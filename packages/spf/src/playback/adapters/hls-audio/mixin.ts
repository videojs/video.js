import { type MediaCrossOriginType, type MediaStreamType, MediaStreamTypes, toMediaCrossOrigin } from '@videojs/media';
import { onEvent } from '@videojs/utils/dom';
import type { Constructor, MixinReturn } from '@videojs/utils/types';

import type { Composition } from '../../../core/composition/create-composition';
import { effect } from '../../../core/signals/effect';
import {
  SVTA_NO_SUPPORTED_AUDIO_TRACK,
  SVTA_PRIMARY_MANIFEST_LOAD_ERROR,
  SVTA_UNSUPPORTED_PLAYBACK_FEATURE,
  type SvtaError,
} from '../../../media/errors';
import { resolveLiveLatency } from '../../../media/hls/reload-policy';
import { deriveTargetLiveWindow } from '../../../media/live-window';
import {
  getMediaPlaylistMetadata,
  isResolvedPresentation,
  isResolvedTrack,
  type MaybeResolvedPresentation,
} from '../../../media/types';
import { findTrackById } from '../../../media/utils/tracks';
import { crossOriginToRequestCredentials } from '../../../network/request-credentials';
import { resolveSourceUrl } from '../../../network/resolve-source-url';
import { createEngine, type EngineConfig, type EngineContext, type EngineState } from '../../engines/hls-audio';
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
} from '../hls-video/error-surface';
import type { HlsVideoSource } from '../hls-video/mixin';

/** What `new HlsAudioAdapter(options)` accepts; see `HlsVideoAdapterOptions` for why it is typed here. */
export interface HlsAudioAdapterOptions {
  /** Engine config forwarded to `createEngine`. */
  config?: EngineConfig;
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
  streamType: MediaStreamType;
}

export interface HlsAudioAdapterAPI extends HlsAudioAdapterProps {
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
 * Which reported conditions this composition treats as fatal: a manifest that fails to load, and the audio verdict. An
 * audio-only engine composes no video selection, so `SVTA_NO_SUPPORTED_VIDEO_TRACK` is never reported and surfacing it
 * would describe a track type this media doesn't have.
 */
const FATAL_SVTA_CODES: ReadonlySet<number> = new Set<number>([
  SVTA_PRIMARY_MANIFEST_LOAD_ERROR,
  SVTA_NO_SUPPORTED_AUDIO_TRACK,
]);

/**
 * Mixin that adds SPF audio-only HLS playback to any base class.
 *
 * Parallel to `HlsVideoMixin` with one substantive difference: the underlying engine is the audio-only variant
 * (`createEngine`), which omits video and text-track behaviors. The src / preload / disableRemotePlayback / play()
 * contract per the WHATWG HTML spec is identical to the default adapter.
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
 * @fires streamtypechange - Fired when the detected stream type changes. Read `streamType` for the new value.
 * @fires targetlivewindowchange - Fired when the target live window changes. Read `targetLiveWindow` for the new value.
 * @fires error - Fired when a fatal condition is reported. Read `error` for it.
 */
/** What the adapter's `createEngine` static builds: an engine over this adapter's state and context. */
export type CreateEngine = (config: EngineConfig) => Composition<EngineState, EngineContext>;

export function HlsAudioMixin<Base extends Constructor<any>>(BaseClass: Base) {
  class HlsAudioImpl extends BaseClass {
    static readonly defaultProps: HlsAudioAdapterProps = {
      src: '',
      source: null,
      preload: '',
      crossOrigin: null,
      disableRemotePlayback: false,
      streamType: MediaStreamTypes.UNKNOWN,
    };

    /**
     * Engine this media plays through, reported to analytics such as Mux Data. Names the SPF engine entry point it
     * composes (`@videojs/spf/engines/hls-audio`), since each SPF engine is its own composition.
     */
    static readonly engineName: string = 'spf-hls-audio';

    /**
     * A complete sentence naming the Media to reach for when this one can't play a source. Appended to the copy this
     * adapter logs.
     *
     * Empty here, and overridden the same way as on the video adapter — see its note. `hls-audio` has no
     * better-equipped sibling of its own; the Mux audio Media built on this engine does, and points at the
     * hls.js-backed one.
     *
     * @internal
     */
    static get alternativeMediaSuggestion(): string | undefined {
      return undefined;
    }

    /**
     * The engine factory the adapter builds its engine with. A Media over a differently composed engine — one sharing
     * this engine's state and context, with more features laid in, as the Mux Medias lay the MPEG-TS transmux —
     * overrides this static and nothing else.
     */
    static readonly createEngine: CreateEngine = createEngine;

    readonly #engine: Composition<EngineState, EngineContext>;
    #config: EngineConfig;
    #preload: '' | 'none' | 'metadata' | 'auto' = HlsAudioImpl.defaultProps.preload;
    #crossOrigin: MediaCrossOriginType | null = toMediaCrossOrigin(HlsAudioImpl.defaultProps.crossOrigin);
    #disableRemotePlayback: boolean = HlsAudioImpl.defaultProps.disableRemotePlayback;
    #streamType: MediaStreamType = HlsAudioImpl.defaultProps.streamType;
    #isUserStreamType = false;
    #targetLiveWindow = Number.NaN;
    /** Delivery notices already logged for the current source — see the video adapter. */
    #noticed = new Set<string>();
    #stopLiveSync: () => void;
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

      // Mirror the engine's live detection onto the media surface, as the video
      // adapter does; `liveEdgeStart` is derived at read time.
      this.#stopLiveSync = effect(() => {
        const presentation = this.#engine.state.presentation.get();

        this.#setDetectedStreamType(presentation?.streamType ?? MediaStreamTypes.UNKNOWN);
        this.#setTargetLiveWindow(deriveTargetLiveWindow(presentation, liveTrackId(this.#engine.state)));
        this.#reportDeliveryNotices(presentation);
      });

      // Promote the first fatal condition out of the engine's reported sequence
      // onto the media surface. Clearing rides the same signal: `collectErrors`
      // resets the signal per source, so a new source starts with no error without
      // this needing its own source-change hook.
      this.#stopErrorSync = effect(() => {
        const errors = this.#engine.state.errors.get();

        this.#setError(firstFatal(errors, FATAL_SVTA_CODES), errors);
      });
    }

    /**
     * The current fatal error, or `null`. Only errors that stop playback appear here; recoverable ones do not. Resets
     * when the source changes. Fires `'error'` when set.
     */
    get error(): HlsVideoMediaError | null {
      return this.#error;
    }

    // -------------------------------------------------------------------------
    // Live surface — streamType / targetLiveWindow / liveEdgeStart, as on the
    // video adapter
    // -------------------------------------------------------------------------

    /**
     * The source's stream type — `'live'`, `'on-demand'`, or `'unknown'` until a media playlist has been parsed.
     * Setting a non-`'unknown'` value pins a user override (detection stops updating it); setting `'unknown'` reverts
     * to the engine's detected value.
     */
    get streamType(): MediaStreamType {
      return this.#streamType;
    }

    set streamType(value: MediaStreamType) {
      if (value === MediaStreamTypes.UNKNOWN) {
        this.#isUserStreamType = false;
        this.#updateStreamType(this.#engine.state.presentation.get()?.streamType ?? MediaStreamTypes.UNKNOWN);
        return;
      }

      this.#isUserStreamType = true;
      this.#updateStreamType(value);
    }

    /**
     * Presentation time marking the start of the live-edge window. Playback at `currentTime >= liveEdgeStart` counts as
     * "at the live edge", and seeking to live lands here. `NaN` when the stream isn't live or nothing has loaded yet.
     * No change event fires; re-read it on `timeupdate` or `progress`.
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

    #setDetectedStreamType(value: MediaStreamType): void {
      if (this.#isUserStreamType) return;

      this.#updateStreamType(value);
    }

    #updateStreamType(value: MediaStreamType): void {
      if (this.#streamType === value) return;

      this.#streamType = value;
      this.dispatchEvent?.(new Event('streamtypechange'));
    }

    #setTargetLiveWindow(value: number): void {
      if (Object.is(this.#targetLiveWindow, value)) return;

      this.#targetLiveWindow = value;
      this.dispatchEvent?.(new Event('targetlivewindowchange'));
    }

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
     *
     * @internal
     */
    get engine(): Composition<EngineState, EngineContext> {
      return this.#engine;
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

      // Most-recent-wins on attach — see the video mixin.
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

      const mediaElement = this.#engine.context.mediaElement.get();

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
        this.#engine.state.preload.set(value);
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
      // Resolved before comparing or storing — see the video adapter's note.
      const url = resolveSourceUrl(value);
      // Unchanged URL, no reload — see the video adapter's note.
      if (url === this.src) return;

      this.#source = url ? { src: url } : null;
      this.#applySrc(url);
      this.dispatchEvent?.(new Event('sourcechange'));
    }

    /**
     * Structured source, the same shape the video flavor takes so one object serves either.
     *
     * `drm` is accepted and inert: this engine composes no EME. It is kept in the shape rather than removed so a source
     * can be handed to both flavors — and because Mux encrypts video renditions and leaves audio clear, so a protected
     * playback ID plays here regardless.
     *
     * [Media sources](https://videojs.org/docs/guides/media-sources) explains how `src` and `source` relate.
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

    /** Point the engine at a URL, resolved; an unchanged one is not a reload request. */
    #applySrc(value: string): void {
      const url = resolveSourceUrl(value);
      if (url === this.src) return;

      this.#cancelPendingPlay();
      this.#engine.state.presentation.set(url ? { url } : undefined);
    }

    // -------------------------------------------------------------------------
    // play() — WHATWG §4.8.11.8
    // -------------------------------------------------------------------------

    play(): Promise<void> {
      const mediaElement = this.#engine.context.mediaElement.get();
      if (!mediaElement) return Promise.reject(new Error('HlsAudioAdapterCore: no media element attached'));

      const { signal } = this.#playGeneration;

      this.#engine.state.loadActivated.set(true);

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

    #createEngine(): Composition<EngineState, EngineContext> {
      return (this.constructor as typeof HlsAudioImpl).createEngine({
        ...this.#config,
        // A policy, not a value — see the video mixin. A consumer-supplied one wins.
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
  return HlsAudioImpl as unknown as MixinReturn<Base, HlsAudioAdapterAPI, [options?: HlsAudioAdapterOptions]> & {
    readonly alternativeMediaSuggestion: string | undefined;
    readonly createEngine: CreateEngine;
    readonly defaultProps: HlsAudioAdapterProps;
  };
}

/** Standalone SPF audio-only media adapter with no base class. */
export class HlsAudioAdapterCore extends HlsAudioMixin(class {}) {}
