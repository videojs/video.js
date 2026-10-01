import { onEvent } from '@videojs/utils/dom';
import type { Constructor, MixinReturn } from '@videojs/utils/types';

import type { Composition } from '../../../core/composition/create-composition';
import { effect } from '../../../core/signals/effect';
import {
  SVTA_NO_SUPPORTED_VIDEO_TRACK,
  SVTA_UNSUPPORTED_DRM_SYSTEM,
  SVTA_UNSUPPORTED_PLAYBACK_FEATURE,
  SVTA_UNSUPPORTED_VIDEO_FORMAT,
  type SvtaError,
} from '../../../media/errors';
import {
  type BackgroundVideoEngineConfig,
  type BackgroundVideoEngineContext,
  type BackgroundVideoEngineSignals,
  type BackgroundVideoEngineState,
  createBackgroundVideoEngine,
} from '../../engines/hls/engine-background-video';
import { UNPLAYABLE_SOURCE_MESSAGE } from '../../primitives/error-messages';
import { firstFatal, type HlsVideoMediaError, hasUnsupportedFeatureCause } from '../hls-video/error-surface';

// The same error shape the video and audio Medias expose, under the name they
// publish it as — one type for all three surfaces rather than a background-flavored
// copy of it.
export type { HlsVideoMediaError } from '../hls-video/error-surface';

/** What `new HlsBackgroundVideoAdapter(options)` accepts; see `HlsVideoAdapterOptions` for why it is typed here. */
export interface HlsBackgroundVideoAdapterOptions {
  /** Engine config forwarded to `createBackgroundVideoEngine`. */
  config?: BackgroundVideoEngineConfig;
}

export interface HlsBackgroundVideoAdapterProps {
  src: string;
}

export interface HlsBackgroundVideoAdapterAPI extends HlsBackgroundVideoAdapterProps {
  readonly engine: Composition<BackgroundVideoEngineState, BackgroundVideoEngineContext>;
  readonly error: HlsVideoMediaError | null;
  attach(mediaElement: HTMLMediaElement): void;
  detach(): void;
  destroy(): void;
  play(): Promise<void>;
}

/**
 * Which reported conditions this composition treats as **fatal** — the ones that reach `error` and fire `'error'`.
 * Severity isn't part of an SVTA code (§Approach: "impact varies with player implementation"), so it's decided at this
 * boundary rather than by the reporter.
 *
 * **Causes are fatal here, unlike on the other two adapters.** There, a cause is context — one unplayable rendition
 * doesn't fail a source whose others still play, and a verdict follows if the type empties. In the pinned variant a
 * cause _is_ the verdict: only the pinned rendition's playlist is ever resolved, so a cause can only be about the pick
 * itself, and dropping that pick is final — nothing here re-picks (that is what `switchVideoTrack` exists for, and this
 * engine doesn't compose it). Measured on Chromium: an MPEG-TS source reports 1004 and an encrypted one 4008, each with
 * no verdict behind it, and the element then sits at `readyState 0` with `error` null forever.
 *
 * The verdict is still listed, for the shapes that report nothing else: no video renditions at all, or a ladder pruned
 * before anything resolves — both of which `reportAbsentTrackType` covers from the tail of the constraint chain.
 *
 * First-fatal-wins then surfaces the cause rather than the verdict when both are present, which is the more specific of
 * the two.
 */
const FATAL_SVTA_CODES: ReadonlySet<number> = new Set<number>([
  SVTA_NO_SUPPORTED_VIDEO_TRACK,
  SVTA_UNSUPPORTED_VIDEO_FORMAT,
  SVTA_UNSUPPORTED_DRM_SYSTEM,
]);

/**
 * Mixin that adds the background-video SPF playback engine to any base class, for an HLS URL.
 *
 * `src` is the whole input surface, and `error` is the one output: nothing about an unplayable source reaches the media
 * element on its own here — an unsupported container, encryption with no EME, and an undecodable codec all leave
 * `HTMLMediaElement.error` null with the element stalled at `readyState 0` (measured on Chromium and WebKit) — so a
 * consumer that watched only the `<video>` would see a source that never appears and never says why. The engine reports
 * each condition onto `engine.state.errors` and logs it; this adapter promotes the first fatal one, mapping it the same
 * way the video and audio Medias map theirs. See `internal/design/spf/features/errors.md`.
 *
 * Selection pins the largest rendition that _fits the screen_, and holds it for the session. The manifest is still the
 * better place to narrow further: a delivery param — `?max_resolution=720p` on a Mux stream URL, for one — keeps the
 * renditions it excludes out of the manifest entirely, rather than fetched-then-unpicked.
 *
 * The pin is given up, never moved, if the pick turns out to be unplayable: the container is only known once a media
 * playlist resolves, which is after the pick is made, so the selection clears rather than quietly appending bytes
 * nothing can decode.
 *
 * `<mux-background-video>` in html and react is this same Media under a Mux-flavored name — an alias, not a variant.
 * Nothing about the surface changes with the name.
 *
 * Everything else the use case fixes rather than exposes: video-only, looping, muted, autoplaying, loading as soon as
 * there is a source. `attach` writes that onto the element and nothing here declares `loop` / `muted` / `autoplay` /
 * `preload` of its own — a host-bound Media inherits all four from the host already, and shadowing them with fixed
 * values would only make reads describe an intention rather than what the element is doing.
 *
 * A new src re-resolves the presentation, tearing down the state, SourceBuffers, and in-flight requests the previous
 * one built before the next begins. The engine instance and the attached media element are both kept, so neither has to
 * be rewired.
 *
 * @example
 *   class HlsBackgroundVideoAdapter extends HlsBackgroundVideoMixin(BackgroundVideoHost) {}
 *
 *   const media = new HlsBackgroundVideoAdapter();
 *   media.attach(document.querySelector('video'));
 *   media.src = 'https://stream.mux.com/PLAYBACK_ID.m3u8?max_resolution=720p';
 *   media.play();
 *
 * @fires error - Fired when a fatal condition is reported. Read `error` for it.
 */
export function HlsBackgroundVideoMixin<Base extends Constructor<any>>(BaseClass: Base) {
  class HlsBackgroundVideoImpl extends BaseClass {
    static readonly defaultProps: HlsBackgroundVideoAdapterProps = {
      src: '',
    };

    #engine: Composition<BackgroundVideoEngineState, BackgroundVideoEngineContext>;
    #config: BackgroundVideoEngineConfig;
    #signals!: BackgroundVideoEngineSignals;
    #error: HlsVideoMediaError | null = null;
    /**
     * The _reported_ condition currently surfaced, which is what the re-fire latch keys on. Not `#error.code`: that's
     * the code this adapter chose to surface, and the substitution below can make the two differ.
     */
    #reportedCode: number | null = null;
    #stopErrorSync: () => void;

    /** Aborting a generation cancels all retries, including ones not yet registered. */
    #playGeneration = new AbortController();

    constructor(...args: any[]) {
      super(...args);

      const { config } = (args[0] ?? {}) as HlsBackgroundVideoAdapterOptions;

      this.#config = config ?? {};
      this.#engine = this.#createEngine();

      // Promote the first fatal condition out of the engine's reported sequence
      // onto this surface. Clearing rides the same signal: `collectErrors` resets
      // the slot per source, so a new source starts with no error without this
      // needing its own source-change hook.
      this.#stopErrorSync = effect(() => {
        const errors = this.#signals.state.errors.get();

        this.#setError(firstFatal(errors, FATAL_SVTA_CODES), errors);
      });
    }

    get engine(): Composition<BackgroundVideoEngineState, BackgroundVideoEngineContext> {
      return this.#engine;
    }

    /**
     * The current fatal condition, or `null`. Only _fatal_ ones appear here — the engine reports non-fatal ones too
     * (they stay in `engine.state.errors`), and promoting them would say playback had failed when it hadn't. Which ones
     * are fatal is wider here than on the video and audio Medias; see {@link FATAL_SVTA_CODES}. Resets per source.
     * Fires `'error'` when set.
     *
     * Mapped the same way theirs are: a sequence holding an unimplemented-capability cause surfaces as
     * {@link SVTA_UNSUPPORTED_PLAYBACK_FEATURE} (99001) with the specifics logged, because "this player can't play this
     * source" is what a consumer can act on, where a raw container or DRM code only says what to go and look up.
     */
    get error(): HlsVideoMediaError | null {
      return this.#error;
    }

    #setError(reported: SvtaError | undefined, errors: readonly SvtaError[] | undefined): void {
      if (!reported) {
        // Cleared (new source). No event: `'error'` announces a failure, and
        // consumers reset their own copy on source change.
        this.#error = null;
        this.#reportedCode = null;
        return;
      }

      // Keyed on the code, not the object: a later append re-runs this effect
      // with an equal-but-new array, and re-firing `'error'` for a condition
      // already surfaced would look like a second failure.
      if (this.#reportedCode === reported.code) return;

      this.#reportedCode = reported.code;

      // Logged for every fatal condition, not just the substituted ones: a source
      // with no video renditions is as dead as an unplayable container, and it
      // would otherwise reach a developer as a bare code. One generic sentence
      // rather than one per case — the conditions beside it carry the specifics.
      //
      // Prose stays here rather than on `error.message`, matching the other two:
      // viewer-facing copy is the consumer's to localize, and a background video
      // has no chrome to put it in anyway.
      console.error(UNPLAYABLE_SOURCE_MESSAGE, { conditions: errors });

      this.#error = {
        code: hasUnsupportedFeatureCause(errors) ? SVTA_UNSUPPORTED_PLAYBACK_FEATURE : reported.code,
        message: reported.message ?? '',
        ...(reported.data === undefined ? {} : { data: reported.data }),
      };
      // Optional-chained: with an EventTarget-less base (`HlsBackgroundVideoAdapterCore`
      // standalone) there's nowhere to dispatch.
      this.dispatchEvent?.(new Event('error'));
    }

    // -------------------------------------------------------------------------
    // Media element lifecycle
    // -------------------------------------------------------------------------

    attach(mediaElement: HTMLMediaElement): void {
      if (mediaElement !== this.#signals.context.mediaElement.get()) {
        this.#cancelPendingPlay();
      }

      super.attach?.(mediaElement);
      // The one place the fixed behavior is stated. Muted and autoplay are what
      // let it start without a gesture, loop is the defining behavior, and
      // `preload` says out loud what the engine does regardless — it subtracts
      // preload monitoring and loads from the moment it has a source.
      mediaElement.loop = true;
      mediaElement.muted = true;
      mediaElement.autoplay = true;
      mediaElement.preload = 'auto';

      this.#signals.context.mediaElement.set(mediaElement);
    }

    detach(): void {
      this.#cancelPendingPlay();
      this.#signals.context.mediaElement.set(undefined);
      super.detach?.();
    }

    destroy(): void {
      this.#cancelPendingPlay();
      this.#stopErrorSync();
      this.#engine.destroy();
    }

    // -------------------------------------------------------------------------
    // src — synchronous IDL attribute (WHATWG §4.8.11.2)
    // -------------------------------------------------------------------------

    get src(): string {
      return this.#signals.state.presentation.get()?.url ?? '';
    }

    set src(value: string) {
      // Same line the HLS Medias draw: the presentation is set from a fresh
      // object every time, so re-resolving a URL already playing would restart
      // it for no reason.
      if (value === this.src) return;

      this.#cancelPendingPlay();
      this.#signals.state.presentation.set(value ? { url: value } : undefined);
    }

    // -------------------------------------------------------------------------
    // play() — WHATWG §4.8.11.8
    // Delegates to the attached media element's native play().
    // -------------------------------------------------------------------------

    async play(): Promise<void> {
      const mediaElement = this.#signals.context.mediaElement.get();
      if (!mediaElement) return Promise.reject(new Error('HlsBackgroundVideoAdapterCore: no media element attached'));

      const { signal } = this.#playGeneration;

      try {
        return await mediaElement.play();
      } catch (err) {
        signal.throwIfAborted();

        // If we have a pending HLS source, the rejection may be because MSE
        // hasn't attached a blob URL yet. Wait for loadstart (src assigned by
        // MSE setup) and retry once.
        if (this.src) {
          return onEvent(mediaElement, 'loadstart', { signal }).then(() => {
            signal.throwIfAborted();

            return mediaElement.play();
          });
        }

        throw err;
      }
    }

    // -------------------------------------------------------------------------
    // Private
    // -------------------------------------------------------------------------

    #createEngine(): Composition<BackgroundVideoEngineState, BackgroundVideoEngineContext> {
      // No selection config of its own: the engine's default rule chain already
      // narrows to the largest rendition that fits the screen, which is exactly
      // what this adapter used to hand over as a bespoke picker.
      return createBackgroundVideoEngine({
        ...this.#config,
        onSignalsReady: (signals) => {
          this.#signals = signals;
        },
      });
    }

    #cancelPendingPlay(): void {
      this.#playGeneration.abort();
      this.#playGeneration = new AbortController();
    }
  }

  return HlsBackgroundVideoImpl as unknown as MixinReturn<
    Base,
    HlsBackgroundVideoAdapterAPI,
    [options?: HlsBackgroundVideoAdapterOptions]
  > & {
    readonly defaultProps: HlsBackgroundVideoAdapterProps;
  };
}

/** Standalone SPF background-video adapter with no base class. */
export class HlsBackgroundVideoAdapterCore extends HlsBackgroundVideoMixin(class {}) {}
