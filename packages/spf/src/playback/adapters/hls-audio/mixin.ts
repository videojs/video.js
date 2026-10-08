import { type MediaCrossOriginType, toMediaCrossOrigin } from '@videojs/media';
import { onEvent } from '@videojs/utils/dom';
import type { Constructor, MixinReturn } from '@videojs/utils/types';

import type { Composition } from '../../../core/composition/create-composition';
import { effect } from '../../../core/signals/effect';
import {
  SVTA_NO_SUPPORTED_AUDIO_TRACK,
  SVTA_UNSUPPORTED_PLAYBACK_FEATURE,
  type SvtaError,
} from '../../../media/errors';
import { crossOriginToRequestCredentials } from '../../../network/request-credentials';
import {
  createHlsAudioEngine,
  type HlsAudioEngineConfig,
  type HlsAudioEngineContext,
  type HlsAudioEngineSignals,
  type HlsAudioEngineState,
} from '../../engines/hls/engine-audio-only';
import { UNSUPPORTED_PLAYBACK_FEATURE_MESSAGE } from '../../primitives/error-messages';
import {
  firstFatal,
  type HlsVideoMediaError,
  hasUnsupportedFeatureCause,
  withAlternativeMediaSuggestion,
} from '../hls-video/error-surface';
import type { HlsVideoSource } from '../hls-video/mixin';

/** What `new HlsAudioAdapter(options)` accepts; see `HlsVideoAdapterOptions` for why it is typed here. */
export interface HlsAudioAdapterOptions {
  /** Engine config forwarded to `createHlsAudioEngine`. */
  config?: HlsAudioEngineConfig;
}

export interface HlsAudioAdapterProps {
  src: string;
  source: HlsVideoSource | null;
  preload: '' | 'none' | 'metadata' | 'auto';
  /**
   * The element's CORS-settings attribute: a mode, the bare attribute (`''`, read as `anonymous`), or `null` for none.
   * `use-credentials` also sends cookies with every manifest, playlist, and segment request the engine makes; any other
   * value leaves those requests at the platform default.
   */
  crossOrigin: MediaCrossOriginType | '' | null;
  disableRemotePlayback: boolean;
}

export interface HlsAudioAdapterAPI extends HlsAudioAdapterProps {
  readonly engine: Composition<HlsAudioEngineState, HlsAudioEngineContext>;
  readonly error: HlsVideoMediaError | null;
  attach(mediaElement: HTMLMediaElement): void;
  detach(): void;
  destroy(): void;
  play(): Promise<void>;
}

/**
 * Which reported conditions this composition treats as fatal. Only the audio verdict: an audio-only engine composes no
 * video selection, so `SVTA_NO_SUPPORTED_VIDEO_TRACK` is never reported and surfacing it would describe a track type
 * this media doesn't have.
 */
const FATAL_SVTA_CODES: ReadonlySet<number> = new Set<number>([SVTA_NO_SUPPORTED_AUDIO_TRACK]);

/**
 * Mixin that adds SPF audio-only HLS playback to any base class.
 *
 * Parallel to `HlsVideoMixin` with one substantive difference: the underlying engine is the audio-only variant
 * (`createHlsAudioEngine`), which omits video and text-track behaviors. The src / preload / disableRemotePlayback /
 * play() contract per the WHATWG HTML spec is identical to the default adapter.
 *
 * Selecting this adapter is the variant decision: instantiating `HlsAudioAdapterCore` opts the consumer into audio-only
 * delivery even when the source is a mixed-AV HLS manifest.
 *
 * @example
 *   class HlsAudioAdapter extends HlsAudioMixin(HTMLVideoAdapter) {}
 *
 *   const media = new HlsAudioAdapter();
 *   media.attach(document.querySelector('video'));
 *   media.src = 'https://stream.mux.com/abc123.m3u8';
 *
 * @fires error - Fired when a fatal condition is reported. Read `error` for it.
 */
export function HlsAudioMixin<Base extends Constructor<any>>(BaseClass: Base) {
  class HlsAudioImpl extends BaseClass {
    static readonly defaultProps: HlsAudioAdapterProps = {
      src: '',
      source: null,
      preload: '',
      crossOrigin: null,
      disableRemotePlayback: false,
    };

    /**
     * A complete sentence naming the Media to reach for when this one can't play a source. Appended to the copy this
     * adapter logs.
     *
     * Empty here, and overridden the same way as on the video adapter — see its note. `hls-audio` has no
     * better-equipped sibling of its own; the Mux audio Media built on this engine does, and points at the
     * hls.js-backed one.
     */
    static get alternativeMediaSuggestion(): string | undefined {
      return undefined;
    }

    readonly #engine: Composition<HlsAudioEngineState, HlsAudioEngineContext>;
    #config: HlsAudioEngineConfig;
    #signals!: HlsAudioEngineSignals;
    #preload: '' | 'none' | 'metadata' | 'auto' = HlsAudioImpl.defaultProps.preload;
    #crossOrigin: MediaCrossOriginType | null = toMediaCrossOrigin(HlsAudioImpl.defaultProps.crossOrigin);
    #disableRemotePlayback: boolean = HlsAudioImpl.defaultProps.disableRemotePlayback;
    #error: HlsVideoMediaError | null = null;
    /** Reported condition currently surfaced — see the video adapter's note. */
    #reportedCode: number | null = null;
    #stopErrorSync: () => void;

    /** Aborting a generation cancels all retries, including ones not yet registered. */
    #playGeneration = new AbortController();
    #source: HlsVideoSource | null = HlsAudioImpl.defaultProps.source;

    constructor(...args: any[]) {
      super(...args);

      const { config } = (args[0] ?? {}) as HlsAudioAdapterOptions;

      this.#config = config ?? {};
      this.#engine = this.#createEngine();

      // Promote the first fatal condition out of the engine's reported sequence
      // onto the media surface. Clearing rides the same signal: `collectErrors`
      // resets the slot per source, so a new source starts with no error without
      // this needing its own source-change hook.
      this.#stopErrorSync = effect(() => {
        const errors = this.#signals.state.errors.get();

        this.#setError(firstFatal(errors, FATAL_SVTA_CODES), errors);
      });
    }

    /**
     * The current fatal error, or `null`. Only _fatal_ conditions appear here — the engine reports non-fatal ones too,
     * which stay in `engine.state.errors`. Resets per source. Fires `'error'` when set.
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

      // See the video adapter: a cause this engine can't implement is what the
      // consumer needs, so it replaces the verdict's code on the surface.
      const unsupported = hasUnsupportedFeatureCause(errors);

      if (unsupported) {
        console.error(this.#withSuggestion(UNSUPPORTED_PLAYBACK_FEATURE_MESSAGE), { conditions: errors });
      }

      this.#error = {
        code: unsupported ? SVTA_UNSUPPORTED_PLAYBACK_FEATURE : reported.code,
        message: reported.message ?? '',
        ...(reported.data === undefined ? {} : { data: reported.data }),
      };
      this.dispatchEvent?.(new Event('error'));
    }

    /**
     * Underlying playback engine — the low-level SPF reactive composition that drives playback. An advanced escape
     * hatch for direct engine access; normal playback is driven through this element's own properties and methods.
     */
    get engine(): Composition<HlsAudioEngineState, HlsAudioEngineContext> {
      return this.#engine;
    }

    // -------------------------------------------------------------------------
    // Media element lifecycle
    // -------------------------------------------------------------------------

    attach(mediaElement: HTMLMediaElement): void {
      if (mediaElement !== this.#signals.context.mediaElement.get()) {
        this.#cancelPendingPlay();
      }

      super.attach?.(mediaElement);
      this.#signals.context.mediaElement.set(mediaElement);

      // Most-recent-wins on attach — see the video mixin.
      this.#crossOrigin = toMediaCrossOrigin(mediaElement.crossOrigin) ?? this.#crossOrigin;
      mediaElement.crossOrigin = this.#crossOrigin;
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
    // crossOrigin — synchronous IDL attribute (WHATWG §4.8.11.2)
    // Reflected onto the attached media element (`null` removes it), and the
    // author's request-credentials intent for the engine's own fetches, read
    // per request through the policy `#createEngine` installs. See the video
    // mixin.
    // -------------------------------------------------------------------------

    get crossOrigin(): MediaCrossOriginType | null {
      return this.#crossOrigin;
    }

    set crossOrigin(value: MediaCrossOriginType | '' | null) {
      // Limited to known values, as the element reflects it — see the video mixin.
      this.#crossOrigin = toMediaCrossOrigin(value);

      const mediaElement = this.#signals.context.mediaElement.get();

      if (mediaElement) mediaElement.crossOrigin = value;
    }

    // -------------------------------------------------------------------------
    // preload — synchronous IDL attribute (WHATWG §4.8.11.2)
    // -------------------------------------------------------------------------

    /** Preload type (`'none'` / `'metadata'` / `'auto'`). */
    get preload(): '' | 'none' | 'metadata' | 'auto' {
      return this.#preload;
    }

    set preload(value: '' | 'none' | 'metadata' | 'auto') {
      this.#preload = value;

      if (value) {
        this.#signals.state.preload.set(value);
      }
    }

    // -------------------------------------------------------------------------
    // disableRemotePlayback — synchronous IDL attribute (WHATWG Remote Playback)
    // Author intent for whether the AirPlay/remote picker is offered. Mirrors
    // the DOM attribute name; the value flows to `state.disableRemotePlayback`,
    // which `setupAirPlay` reads to honor an explicit opt-out. The underlying
    // media element's own `disableRemotePlayback` stays programmatically managed
    // (ManagedMediaSource needs it `true` to open; AirPlay flips it `false` once
    // the source is open), so author intent and the effective flag stay distinct.
    // -------------------------------------------------------------------------

    get disableRemotePlayback(): boolean {
      return this.#disableRemotePlayback;
    }

    set disableRemotePlayback(value: boolean) {
      this.#disableRemotePlayback = value;
      this.#signals.state.disableRemotePlayback.set(value);
    }

    // -------------------------------------------------------------------------
    // src — synchronous IDL attribute (WHATWG §4.8.11.2)
    // Each assignment overwrites the engine's presentation state in place. The
    // resolver FSM routes back through teardown → rebuild on the same engine,
    // mirroring how the browser's load algorithm resets media state on src change
    // — without recreating the engine or re-capturing its signals. Setting an
    // empty src un-resolves the presentation, tearing the current source down to
    // the engine's fresh-but-attached "no source" state.
    // -------------------------------------------------------------------------

    get src(): string {
      return this.#signals.state.presentation.get()?.url ?? '';
    }

    set src(value: string) {
      // Unchanged URL, no reload — see the video adapter's note.
      if (value === this.src) return;

      this.#source = value ? { src: value } : null;
      this.#applySrc(value);
      this.dispatchEvent?.(new Event('sourcechange'));
    }

    /**
     * Structured source, the same shape the video flavor takes so one object serves either.
     *
     * `drm` is accepted and inert: this engine composes no EME. It is kept in the shape rather than removed so a source
     * can be handed to both flavors — and because Mux encrypts video renditions and leaves audio clear, so a protected
     * playback ID plays here regardless.
     *
     * @fires sourcechange - Fired when `source` changes. Read `source` for the new value.
     */
    get source(): HlsVideoSource | null {
      return this.#source;
    }

    set source(value: HlsVideoSource | null) {
      const source = value ?? null;
      if (source === this.#source) return;

      this.#source = source;
      this.#applySrc(source?.src ?? '');
      this.dispatchEvent?.(new Event('sourcechange'));
    }

    /** Point the engine at a URL; an unchanged one is not a reload request. */
    #applySrc(value: string): void {
      if (value === this.src) return;

      this.#cancelPendingPlay();
      this.#signals.state.presentation.set(value ? { url: value } : undefined);
    }

    // -------------------------------------------------------------------------
    // play() — WHATWG §4.8.11.8
    // -------------------------------------------------------------------------

    play(): Promise<void> {
      const mediaElement = this.#signals.context.mediaElement.get();
      if (!mediaElement) return Promise.reject(new Error('HlsAudioAdapterCore: no media element attached'));

      const { signal } = this.#playGeneration;

      this.#signals.state.loadActivated.set(true);

      return mediaElement.play().catch((err: unknown) => {
        signal.throwIfAborted();

        if (this.src) {
          return onEvent(mediaElement, 'loadstart', { signal }).then(() => {
            signal.throwIfAborted();

            return mediaElement.play();
          });
        }

        throw err;
      });
    }

    // -------------------------------------------------------------------------
    // Private
    // -------------------------------------------------------------------------

    /** `message`, plus the alternative-Media sentence when this class names one. */
    #withSuggestion(message: string): string {
      return withAlternativeMediaSuggestion(message, this);
    }

    #createEngine(): Composition<HlsAudioEngineState, HlsAudioEngineContext> {
      return createHlsAudioEngine({
        ...this.#config,
        // A policy, not a value — see the video mixin. A consumer-supplied one wins.
        requestCredentials:
          this.#config?.requestCredentials ?? (() => crossOriginToRequestCredentials(this.#crossOrigin)),
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

  // `MixinReturn` sources statics from `Base`, so the adapter's own static needs
  // adding back to the type or callers can't read it.
  return HlsAudioImpl as unknown as MixinReturn<Base, HlsAudioAdapterAPI, [options?: HlsAudioAdapterOptions]> & {
    readonly alternativeMediaSuggestion: string | undefined;
    readonly defaultProps: HlsAudioAdapterProps;
  };
}

/** Standalone SPF audio-only media adapter with no base class. */
export class HlsAudioAdapterCore extends HlsAudioMixin(class {}) {}
