import { type MediaCrossOriginType, type MediaStreamType, MediaStreamTypes, toMediaCrossOrigin } from '@videojs/media';
import { onEvent } from '@videojs/utils/dom';
import type { Constructor, MixinReturn } from '@videojs/utils/types';

import type { Composition } from '../../../core/composition/create-composition';
import { effect } from '../../../core/signals/effect';
import { DEFAULT_KEY_SYSTEMS } from '../../../media/dom/key-systems';
import {
  type DrmSystemsConfig,
  type DrmSystemsConfigFor,
  type KeySystemId,
  type KeySystemModule,
  sourceDrmSystems,
} from '../../../media/drm';
import {
  SVTA_NO_SUPPORTED_AUDIO_TRACK,
  SVTA_NO_SUPPORTED_VIDEO_TRACK,
  SVTA_UNSUPPORTED_PLAYBACK_FEATURE,
  type SvtaError,
} from '../../../media/errors';
import { resolveLiveLatency } from '../../../media/hls/reload-policy';
import {
  deriveStreamType,
  getMediaPlaylistMetadata,
  isResolvedPresentation,
  isResolvedTrack,
  type MaybeResolvedPresentation,
} from '../../../media/types';
import { findTrackById } from '../../../media/utils/tracks';
import { crossOriginToRequestCredentials } from '../../../network/request-credentials';
import { createEngine, type EngineConfig, type EngineContext, type EngineState } from '../../engines/hls/engine';
import {
  DVR_EXPERIMENTAL_MESSAGE,
  LOW_LATENCY_UNSUPPORTED_MESSAGE,
  UNSUPPORTED_PLAYBACK_FEATURE_MESSAGE,
} from '../../primitives/error-messages';
import { getLiveEdge, type LiveWindowState, liveTrackId } from '../../primitives/live-window';
import {
  firstFatal,
  type HlsVideoMediaError,
  hasUnsupportedFeatureCause,
  withAlternativeMediaSuggestion,
} from './error-surface';

/**
 * The media-level stream type: the engine's detected stream type (`'live'` / `'on-demand'`) plus `'unknown'` for "no
 * playlist parsed yet." `@videojs/media`'s {@link MediaStreamType} itself, kept under its own name because that is what
 * this adapter's `streamType` property is documented against.
 */
export type HlsVideoMediaStreamType = MediaStreamType;

export type { HlsVideoMediaError } from './error-surface';

/**
 * What this Adapter can be pointed at, beyond a bare URL.
 *
 * Deliberately narrower than `@videojs/media`'s `HlsSource`: that shape also carries `preferPlayback`, `engine`, and
 * the rendition caps, none of which this engine can honour — SPF publishes no engine-shaped config, and there is no
 * native path to prefer. A value typed as the wider shape still assigns here.
 */
export interface HlsVideoSource {
  /** Manifest URL. Mirrors the host's `src` property. */
  src?: string | undefined;
  /** MIME type of the source. Takes precedence over inference from `src`. */
  type?: string | undefined;
  /**
   * License servers for protected content, keyed by EME key-system id.
   *
   * Read per license request rather than captured, so changing the source changes what is licensed without rebuilding
   * the engine. Accepts a resolver per URL (see `DrmUrl`) for servers only known once a source is set.
   */
  drm?: DrmSystemsConfig | undefined;
}

/**
 * What `new HlsVideoAdapter(options)` accepts. The mixin class is forced to `constructor(...args: any[])`, so this is
 * the type its returned constructor names for the one argument it reads.
 */
export type HlsVideoAdapterOptions =
  | {
      /**
       * Engine config forwarded to `createEngine`. Its `drm` merges over the license servers derived from the current
       * `source.drm`, so an entry here names a server the source does not. With no `keySystems`, `drm` is keyed by the
       * default systems' ids.
       */
      config?: Omit<EngineConfig, 'drm' | 'keySystems'> & {
        drm?: DrmSystemsConfigFor<KeySystemId<typeof DEFAULT_KEY_SYSTEMS>>;
        keySystems?: undefined;
      };
    }
  | {
      /**
       * The same, with `keySystems` narrowed. A constructor cannot be generic per call the way `createEngine` is, so
       * `drm` is keyed by any id here; the engine still negotiates only what `keySystems` composes.
       */
      config: EngineConfig & { keySystems: readonly KeySystemModule[] };
    };

export interface HlsVideoAdapterProps {
  src: string;
  source: HlsVideoSource | null;
  preload: '' | 'none' | 'metadata' | 'auto';
  /**
   * The element's CORS-settings attribute: a mode, the bare attribute (`''`, read as `anonymous`), or `null` for none.
   * `use-credentials` also sends cookies with every manifest, playlist, and segment request the engine makes, the way
   * the browser does under native playback; any other value leaves those requests at the platform default.
   */
  crossOrigin: MediaCrossOriginType | '' | null;
  disableRemotePlayback: boolean;
  streamType: HlsVideoMediaStreamType;
}

export interface HlsVideoAdapterAPI extends HlsVideoAdapterProps {
  readonly engine: Composition<EngineState, EngineContext>;
  readonly error: HlsVideoMediaError | null;
  readonly liveEdgeStart: number;
  readonly targetLiveWindow: number;
  attach(mediaElement: HTMLMediaElement): void;
  detach(): void;
  destroy(): void;
  play(): Promise<void>;
}

/**
 * `targetLiveWindow` per the media-ui-extensions live-edge proposal: `NaN` for on-demand (or nothing resolved yet), `0`
 * for standard sliding-window live, `Infinity` for DVR (`#EXT-X-PLAYLIST-TYPE:EVENT` — the window grows from the
 * start). Read from the timeline-bearing track's playlist metadata.
 */
function deriveTargetLiveWindow(
  presentation: MaybeResolvedPresentation | undefined,
  trackId: string | undefined
): number {
  if (!isResolvedPresentation(presentation) || !trackId) return Number.NaN;

  const track = findTrackById(presentation, trackId);
  if (!track || !isResolvedTrack(track)) return Number.NaN;

  const metadata = getMediaPlaylistMetadata(track);
  if (!metadata) return Number.NaN;

  if (metadata.playlistType === 'EVENT') return Number.POSITIVE_INFINITY;

  return deriveStreamType(metadata) === 'live' ? 0 : Number.NaN;
}

// ============================================================================
// Error surface
// ============================================================================

/**
 * Which reported conditions this composition treats as **fatal** — the ones that reach `error` and fire `'error'`.
 * Severity isn't part of an SVTA code (§Approach: "impact varies with player implementation"), and here it also varies
 * by composition, so it's decided at this boundary rather than by the reporter.
 *
 * An allow-list, deliberately: only _verdicts_ are here. The per-rendition causes `resolve-track` reports (unsupported
 * format, unsupported DRM) stay in the sequence as context — one unplayable rendition doesn't fail the source, and
 * promoting a cause would put a dialog over a mixed source that goes on to play.
 */
const FATAL_SVTA_CODES: ReadonlySet<number> = new Set<number>([
  SVTA_NO_SUPPORTED_VIDEO_TRACK,
  SVTA_NO_SUPPORTED_AUDIO_TRACK,
]);

/**
 * Mixin that adds SPF playback engine behavior to any base class.
 *
 * Implements the src/play() contract per the WHATWG HTML spec so that SPF can be used anywhere a media element API is
 * expected.
 *
 * A single engine instance is created at construction and recycled across src changes.
 *
 * @example
 *   class HlsVideoAdapter extends HlsVideoMixin(HTMLVideoAdapter) {}
 *
 *   const media = new HlsVideoAdapter();
 *   media.attach(document.querySelector('video'));
 *   media.src = 'https://stream.mux.com/abc123.m3u8';
 *
 * @fires streamtypechange - Fired when the detected stream type changes. Read `streamType` for the new value.
 * @fires targetlivewindowchange - Fired when the target live window changes. Read `targetLiveWindow` for the new value.
 * @fires error - Fired when a fatal condition is reported. Read `error` for it.
 */
export function HlsVideoMixin<Base extends Constructor<any>>(BaseClass: Base) {
  class HlsVideoImpl extends BaseClass {
    static readonly defaultProps: HlsVideoAdapterProps = {
      src: '',
      source: null,
      preload: '',
      crossOrigin: null,
      disableRemotePlayback: false,
      streamType: MediaStreamTypes.UNKNOWN,
    };

    /**
     * A complete sentence naming the Media to reach for when this one can't play a source — `Try the hls.js-backed Mux
     * media instead: import the hls-js flavor in place of the spf one.` Appended to the copy this adapter surfaces, and
     * to the notices it logs. Name the flavor, not an import path: a Media is reached through several packages, each
     * with its own counterpart.
     *
     * Empty here: `hls-video` has no better-equipped sibling to point at. A Media that does (a Mux Video built on this
     * engine, whose hls.js-backed counterpart plays MPEG-TS and DRM) overrides this static, and its copy gains the
     * second sentence with no other change.
     */
    static get alternativeMediaSuggestion(): string | undefined {
      return undefined;
    }

    readonly #engine: Composition<EngineState, EngineContext>;
    #config: EngineConfig;
    #preload: '' | 'none' | 'metadata' | 'auto' = HlsVideoImpl.defaultProps.preload;
    #crossOrigin: MediaCrossOriginType | null = toMediaCrossOrigin(HlsVideoImpl.defaultProps.crossOrigin);
    #disableRemotePlayback: boolean = HlsVideoImpl.defaultProps.disableRemotePlayback;
    #streamType: HlsVideoMediaStreamType = HlsVideoImpl.defaultProps.streamType;
    #isUserStreamType = false;
    #targetLiveWindow = Number.NaN;
    #error: HlsVideoMediaError | null = null;
    /**
     * The _reported_ condition currently surfaced, which is what the re-fire latch keys on. Not `#error.code`: that's
     * the code this adapter chose to surface, and a later cause can change the choice for a condition already
     * announced.
     */
    #reportedCode: number | null = null;
    /** Notices already logged for the current source; cleared when it unloads. */
    #noticed = new Set<string>();
    #stopLiveSync: () => void;
    #stopErrorSync: () => void;

    /** Aborting a generation cancels all retries, including ones not yet registered. */
    #playGeneration = new AbortController();

    #source: HlsVideoSource | null = HlsVideoImpl.defaultProps.source;

    constructor(...args: any[]) {
      super(...args);

      // The mixin constructor's `any[]` is TypeScript's rule, not the contract;
      // the returned constructor names `HlsVideoAdapterOptions`, so this is the
      // shape callers were checked against.
      const { config } = (args[0] ?? {}) as HlsVideoAdapterOptions;

      // Every key system this engine knows gets an entry whose fields read
      // whatever source is current, so `source.drm` licenses playback without the
      // engine — built once, here — ever being rebuilt. A system the current
      // source says nothing about resolves to `undefined`, which prunes its
      // renditions exactly as naming no server at all does.
      //
      // `sourceDrmSystems` closes over `this` but runs before `super()` returns:
      // safe because nothing resolves during engine construction, the first read
      // being a capability probe with no presentation set yet.
      const keySystems: readonly KeySystemModule[] = config?.keySystems ?? DEFAULT_KEY_SYSTEMS;
      const drm = sourceDrmSystems(() => this.#source?.drm, keySystems);

      this.#config = { ...config, drm: { ...drm, ...config?.drm } };
      this.#engine = this.#createEngine();

      // Mirror the engine's live/stream-type detection onto the media surface,
      // firing the change events the store features listen for. One effect over
      // the presentation + selection signals; `liveEdgeStart` is deliberately
      // NOT cached here — it's derived at read time (the store re-reads it on
      // `timeupdate`/`progress`), so a sliding window needs no event churn.
      this.#stopLiveSync = effect(() => {
        const presentation = this.#engine.state.presentation.get();

        this.#setDetectedStreamType(presentation?.streamType ?? MediaStreamTypes.UNKNOWN);
        this.#setTargetLiveWindow(deriveTargetLiveWindow(presentation, liveTrackId(this.#engine.state)));
        this.#reportDeliveryNotices(presentation);
      });

      // Promote the first fatal condition out of the engine's reported sequence
      // onto the media surface. Clearing rides the same signal: `collectErrors`
      // resets the slot per source, so a new source starts with no error without
      // this needing its own source-change hook.
      this.#stopErrorSync = effect(() => {
        const errors = this.#engine.state.errors.get();

        this.#setError(firstFatal(errors, FATAL_SVTA_CODES), errors);
      });
    }

    /**
     * Underlying playback engine — the low-level SPF reactive composition that drives playback. An advanced escape
     * hatch for direct engine access; normal playback is driven through this element's own properties and methods.
     */
    get engine(): Composition<EngineState, EngineContext> {
      return this.#engine;
    }

    // -------------------------------------------------------------------------
    // Live surface — streamType / targetLiveWindow / liveEdgeStart
    // (the MediaStreamTypeCapability + MediaLiveCapability contract the player
    // store's stream-type and live features consume)
    // -------------------------------------------------------------------------

    /**
     * The current fatal error, or `null`. Only _fatal_ conditions appear here — the engine reports non-fatal ones too
     * (they stay in `engine.state.errors`), and promoting them would tell a consumer playback had failed when it
     * hadn't. Resets per source. Fires `'error'` when set.
     */
    get error(): HlsVideoMediaError | null {
      return this.#error;
    }

    /**
     * The source's stream type — `'live'`, `'on-demand'`, or `'unknown'` until a media playlist has been parsed.
     * Setting a non-`'unknown'` value pins a user override (detection stops updating it); setting `'unknown'` reverts
     * to the engine's detected value.
     */
    get streamType(): HlsVideoMediaStreamType {
      return this.#streamType;
    }

    set streamType(value: HlsVideoMediaStreamType) {
      if (value === MediaStreamTypes.UNKNOWN) {
        this.#isUserStreamType = false;
        this.#updateStreamType(this.#engine.state.presentation.get()?.streamType ?? MediaStreamTypes.UNKNOWN);
        return;
      }

      this.#isUserStreamType = true;
      this.#updateStreamType(value);
    }

    /**
     * Presentation time marking the start of the live-edge window — playback at `currentTime >= liveEdgeStart` counts
     * as "at the live edge" (the same target the engine's `seekToLiveEdge` seeks to: window end − HOLD-BACK). `NaN`
     * when the stream isn't live or nothing is resolved yet. Derived at read time from the engine's live window — no
     * change event; re-read on `timeupdate`/`progress` (as the store's live feature does).
     */
    get liveEdgeStart(): number {
      const edge = getLiveEdge({
        state: this.#engine.state as LiveWindowState,
        config: { resolveLiveLatency },
      });

      return edge?.liveEdgeStart ?? Number.NaN;
    }

    /**
     * The target live window: `NaN` for on-demand (or unknown), `0` for standard sliding-window live, `Infinity` for
     * DVR (`#EXT-X-PLAYLIST-TYPE:EVENT`). Fires `targetlivewindowchange` on change.
     */
    get targetLiveWindow(): number {
      return this.#targetLiveWindow;
    }

    #setDetectedStreamType(value: HlsVideoMediaStreamType): void {
      if (this.#isUserStreamType) return;

      this.#updateStreamType(value);
    }

    #updateStreamType(value: HlsVideoMediaStreamType): void {
      if (this.#streamType === value) return;

      this.#streamType = value;
      // Optional-chained: with an EventTarget-less base (`HlsVideoAdapterCore`
      // standalone) there's nowhere to dispatch; hosts forward it to listeners.
      this.dispatchEvent?.(new Event('streamtypechange'));
    }

    #setTargetLiveWindow(value: number): void {
      if (Object.is(this.#targetLiveWindow, value)) return;

      this.#targetLiveWindow = value;
      this.dispatchEvent?.(new Event('targetlivewindowchange'));
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

      // A verdict says a type emptied; the causes say whether anything could
      // have played it. When they include something this engine simply doesn't
      // implement, that's the more useful thing to tell a consumer, so it
      // replaces the verdict's code on the surface.
      const unsupported = hasUnsupportedFeatureCause(errors);

      if (unsupported) {
        // The only place this engine explains itself in prose, and it's a
        // console: the viewer-facing sentence is the consumer's to localize from
        // the code. Conditions ride along structured so the specifics stay
        // inspectable.
        console.error(this.#withSuggestion(UNSUPPORTED_PLAYBACK_FEATURE_MESSAGE), { conditions: errors });
      }

      this.#error = {
        code: unsupported ? SVTA_UNSUPPORTED_PLAYBACK_FEATURE : reported.code,
        message: reported.message ?? '',
        ...(reported.data === undefined ? {} : { data: reported.data }),
      };
      this.dispatchEvent?.(new Event('error'));
    }

    // -------------------------------------------------------------------------
    // Media element lifecycle
    // -------------------------------------------------------------------------

    attach(mediaElement: HTMLMediaElement): void {
      if (mediaElement !== this.#engine.context.mediaElement.get()) {
        this.#cancelPendingPlay();
      }

      super.attach?.(mediaElement);
      this.#engine.context.mediaElement.set(mediaElement);

      // Most-recent-wins on attach, as with `preload`: an element authored with
      // `crossorigin` (a React-rendered `<video>`, a standalone attach) is the
      // intent; otherwise what was set before attach reaches the element now.
      this.#crossOrigin = toMediaCrossOrigin(mediaElement.crossOrigin) ?? this.#crossOrigin;
      mediaElement.crossOrigin = this.#crossOrigin;
    }

    detach(): void {
      this.#cancelPendingPlay();
      this.#engine.context.mediaElement.set(undefined);
      super.detach?.();
    }

    destroy(): void {
      this.#cancelPendingPlay();
      this.#stopLiveSync();
      this.#stopErrorSync();
      this.#engine.destroy();
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
        this.#engine.state.preload.set(value);
      }
      // value = '' resets the IDL mirror (so `get preload` reflects '') but does
      // not patch state — the engine keeps its current preload until an explicit
      // W3C value replaces it.
    }

    // -------------------------------------------------------------------------
    // crossOrigin — synchronous IDL attribute (WHATWG §4.8.11.2)
    // The element's CORS-settings attribute, reflected onto the attached media
    // element (`null` removes it), and additionally the author's
    // request-credentials intent for the engine's own fetches:
    // `use-credentials` makes every manifest, playlist, and segment request
    // carry cookies (`credentials: 'include'`), the same way the browser fetches
    // under native playback. Anything else leaves the platform default. The
    // engine reads the mirror through the `requestCredentials` policy
    // `#createEngine` installs, per request, so no engine state is touched.
    // -------------------------------------------------------------------------

    get crossOrigin(): MediaCrossOriginType | null {
      return this.#crossOrigin;
    }

    set crossOrigin(value: MediaCrossOriginType | '' | null) {
      // Reflect "limited to only known values", as the element does: the
      // attribute keeps the author's spelling, the getter and the engine see the
      // canonical keyword. A custom element hands the raw attribute string here.
      this.#crossOrigin = toMediaCrossOrigin(value);

      const mediaElement = this.#engine.context.mediaElement.get();

      if (mediaElement) mediaElement.crossOrigin = value;
    }

    // -------------------------------------------------------------------------
    // disableRemotePlayback — synchronous IDL attribute (WHATWG Remote Playback)
    // Author intent for whether the AirPlay/remote picker is offered. Mirrors
    // the DOM attribute name; the value flows to `state.disableRemotePlayback`,
    // which `setupAirPlay` reads to honor an explicit opt-out. The underlying
    // <video>'s own `disableRemotePlayback` stays programmatically managed
    // (ManagedMediaSource needs it `true` to open; AirPlay flips it `false` once
    // the source is open), so author intent and the effective flag stay distinct.
    // -------------------------------------------------------------------------

    get disableRemotePlayback(): boolean {
      return this.#disableRemotePlayback;
    }

    set disableRemotePlayback(value: boolean) {
      this.#disableRemotePlayback = value;
      this.#engine.state.disableRemotePlayback.set(value);
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
      return this.#engine.state.presentation.get()?.url ?? '';
    }

    set src(value: string) {
      // Guarded on the URL rather than on source identity: the presentation can
      // also be written straight to the engine, and clearing `src` has to reach
      // it either way.
      if (value === this.src) return;

      // A bare URL names a different asset, so whatever the previous source said
      // about licensing it no longer applies — same line the Mux flavor draws
      // when a URL replaces a structured source.
      this.#source = value ? { src: value } : null;
      this.#applySrc(value);
      this.dispatchEvent?.(new Event('sourcechange'));
    }

    /**
     * Structured source: the manifest URL plus what a URL cannot carry, which today is the license servers for
     * protected content. Setting it derives `src`. Assigning the same object back costs nothing — changing anything
     * takes a new one.
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

    /**
     * Point the engine at a URL. Assigning the one already playing is not a request to reload it: the presentation is
     * set from a fresh object every time, so re-resolving an unchanged URL would restart playback — which is what
     * changing only the licensing half of a source would otherwise cause.
     */
    #applySrc(value: string): void {
      if (value === this.src) return;

      this.#cancelPendingPlay();
      this.#engine.state.presentation.set(value ? { url: value } : undefined);
    }

    // -------------------------------------------------------------------------
    // play() — WHATWG §4.8.11.8
    // Delegates to the attached media element's native play().
    // -------------------------------------------------------------------------

    play(): Promise<void> {
      const mediaElement = this.#engine.context.mediaElement.get();
      if (!mediaElement) return Promise.reject(new Error('HlsVideoAdapterCore: no media element attached'));

      const { signal } = this.#playGeneration;

      // Signal play intent — enables loading even with preload="none"
      this.#engine.state.loadActivated.set(true);

      return mediaElement.play().catch((err: unknown) => {
        signal.throwIfAborted();

        // If we have a pending HLS source, the rejection may be because MSE
        // hasn't attached a blob URL yet. Wait for loadstart (src assigned
        // by MSE setup) and retry once.
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

    /**
     * Log what this engine is delivering differently from what the playlist asked for. Neither condition stops
     * playback, so neither is an error — they go to the console rather than the error surface.
     *
     * Once per source, not per parse: a live playlist reloads every target duration, and the timeline track re-parses
     * on each one. Keyed on the notice rather than latched with a boolean so the two are independent, and cleared when
     * the presentation unresolves so the next source starts quiet.
     */
    #reportDeliveryNotices(presentation: MaybeResolvedPresentation | undefined): void {
      if (!isResolvedPresentation(presentation)) {
        this.#noticed.clear();
        return;
      }

      const trackId = liveTrackId(this.#engine.state);
      const track = trackId ? findTrackById(presentation, trackId) : undefined;
      if (!track || !isResolvedTrack(track)) return;

      const metadata = getMediaPlaylistMetadata(track);
      if (!metadata) return;

      if (metadata.lowLatency && !this.#noticed.has('lowLatency')) {
        this.#noticed.add('lowLatency');
        console.warn(this.#withSuggestion(LOW_LATENCY_UNSUPPORTED_MESSAGE));
      }

      if (metadata.playlistType === 'EVENT' && !this.#noticed.has('dvr')) {
        this.#noticed.add('dvr');
        console.warn(this.#withSuggestion(DVR_EXPERIMENTAL_MESSAGE));
      }
    }

    #createEngine(): Composition<EngineState, EngineContext> {
      return createEngine({
        ...this.#config,
        // A policy, not a value: the engine outlives `crossOrigin` changes and
        // consults this on every request. A consumer-supplied policy wins.
        requestCredentials:
          this.#config?.requestCredentials ?? (() => crossOriginToRequestCredentials(this.#crossOrigin)),
      });
    }

    #cancelPendingPlay(): void {
      this.#playGeneration.abort();
      this.#playGeneration = new AbortController();
    }
  }

  // `MixinReturn` sources statics from `Base`, so the adapter's own static needs
  // adding back to the type or callers can't read it.
  return HlsVideoImpl as unknown as MixinReturn<Base, HlsVideoAdapterAPI, [options?: HlsVideoAdapterOptions]> & {
    readonly alternativeMediaSuggestion: string | undefined;
    readonly defaultProps: HlsVideoAdapterProps;
  };
}

/** Standalone SPF media adapter with no base class. */
export class HlsVideoAdapterCore extends HlsVideoMixin(class {}) {}
