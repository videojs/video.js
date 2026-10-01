import {
  bridgeEvents,
  type DrmSystemsConfig,
  KeySystems,
  type MediaResolution,
  type MediaStreamType,
  MediaStreamTypes,
} from '@videojs/media';
import { HTMLVideoAdapter } from '@videojs/media/dom';
import { type NativeHlsConfig, NativeHlsAdapter, type NativeHlsSource } from '@videojs/native-hls-video';
import { deepEqual } from '@videojs/utils/object';
import Hls, { type HlsConfig as HlsJsConfig } from 'hls.js';

import { HlsJsOnlyAdapter } from './hls-js-only';

export type PreloadType = '' | 'none' | 'metadata' | 'auto';

export type { MediaResolution };

export { Hls };

/** How hls.js plays a source: through Media Source Extensions, or the browser's native HLS support. */
export type PlaybackType = 'mse' | 'native' | (string & {});
/** A source's MIME type, such as `application/vnd.apple.mpegurl` for HLS or `video/mp4`. */
export type SourceType = 'application/vnd.apple.mpegurl' | 'video/mp4' | (string & {});
export type StreamType = MediaStreamType;

/** @internal */
export const PlaybackTypes = {
  MSE: 'mse',
  NATIVE: 'native',
};

/** @internal */
export const ContentTypes = {
  M3U8: 'application/vnd.apple.mpegurl',
  MP4: 'video/mp4',
};

/**
 * Every MIME type that means HLS in the wild, lowercased. `application/vnd.apple.mpegurl` is the registered one, but
 * `application/x-mpegURL` predates it and is what most servers, CDNs, and older Video.js guides hand out, so a source
 * naming any of these has to reach hls.js rather than fall through to native playback.
 */
const HLS_CONTENT_TYPES: ReadonlySet<string> = new Set([
  ContentTypes.M3U8,
  'application/x-mpegurl',
  'application/mpegurl',
  'audio/mpegurl',
  'audio/x-mpegurl',
]);

const MP4_CONTENT_TYPES: ReadonlySet<string> = new Set([ContentTypes.MP4]);

/** @internal */
export const StreamTypes = MediaStreamTypes;

export interface HlsJsAdapterProps {
  src: string;
  source: HlsSource | null;
  preload: PreloadType;
  streamType: StreamType;
  disableRemotePlayback: boolean;
}

/**
 * Structured HLS source: which source to play, plus how to play it.
 *
 * Playback options are namespaced by engine. There are two paths here — hls.js and the browser's own HLS support — and
 * only one of them runs, so a source describes both without either engine reading the other's options.
 *
 * `preferPlayback` and the engine options are all read when the engine is constructed, so changing any of them
 * recreates it.
 */
export interface HlsSource {
  /** Manifest URL. Mirrors the host's `src` property. */
  src?: string | undefined;
  /**
   * MIME type of the source. Takes precedence over inference from `src`.
   *
   * Matched case-insensitively, and the legacy HLS spellings (`application/x-mpegURL`, `audio/mpegurl`, …) count as
   * `application/vnd.apple.mpegurl`. Anything unrecognized is treated as a URL the browser plays on its own.
   */
  type?: SourceType | undefined;
  /**
   * Preferred playback path: `'mse'` for hls.js, `'native'` for the browser's own HLS support. Ignored when the
   * preferred path cannot play the source.
   */
  preferPlayback?: PlaybackType | undefined;
  /**
   * License servers for protected content, keyed by EME key system id.
   *
   * Engine neutral, because which engine plays is decided later: hls.js is handed every system named here (with EME
   * switched on), and native playback negotiates the `com.apple.fps` entry itself. Name every system you hold a license
   * server for — which one is used is the browser's choice.
   */
  drm?: DrmSystemsConfig | undefined;
  /**
   * Highest resolution adaptive bitrate selection may choose on its own.
   *
   * A ceiling on automatic selection, not a filter on what is available: renditions above it stay in `videoRenditions`
   * and can still be selected by hand. Matching is by pixel area, so a `'720p'` cap admits any rendition at or below
   * 1280×720 worth of pixels. When every rendition sits above the cap, the smallest one is used.
   *
   * Applied live — changing it never rebuilds the playback engine. Requires the hls.js (MSE) engine; native HLS
   * playback ignores it.
   *
   * For Mux sources this is distinct from `playback.maxResolution`, which asks Mux to leave higher renditions out of
   * the manifest altogether.
   */
  maxAutoResolution?: MediaResolution | undefined;
  /**
   * Whether the element's rendered size caps automatic selection. Defaults to `true`.
   *
   * A 400px-wide player has no use for a 4K rendition, so selection is held to the smallest rendition that still covers
   * the element, measured in device pixels — a `2` device pixel ratio asks for twice what a CSS measurement would. The
   * cap follows the element as it resizes, and `minAutoResolution` bounds how far down it can go. Set it to `false` for
   * a player whose layout size understates what it needs, such as one that goes fullscreen without a resize.
   *
   * Which rendition covers the element is hls.js's own judgement, weighed on the largest dimension rather than pixel
   * area, so it can land elsewhere than `maxAutoResolution` would for the same ladder.
   *
   * Applied live — changing it never rebuilds the playback engine. Requires the hls.js (MSE) engine; native HLS
   * playback ignores it. Setting hls.js's own `capLevelToPlayerSize` through `source.engine.hlsJs` is a different
   * thing: it stops the loop _every_ cap here is evaluated on, and takes a rebuild.
   */
  capRenditionToPlayerSize?: boolean | undefined;
  /**
   * Lowest resolution `capRenditionToPlayerSize` may cap down to. Defaults to `'720p'`.
   *
   * Not a quality floor. It bounds the size-derived cap and nothing else: when bandwidth is poor, adaptive selection
   * still drops below it, because the cap is a ceiling and selection stays free underneath. Nor does it raise an
   * explicit `maxAutoResolution` — asking for at most `'360p'` alongside a `'720p'` floor yields `'360p'`.
   *
   * The default exists because the low rungs of a ladder are there for poor network conditions, and capping a small
   * player to them looks worse than its size suggests. Name a lower rung to weaken the floor, or `'270p'` to lift it
   * for any real ladder.
   *
   * Applied live — changing it never rebuilds the playback engine. Requires the hls.js (MSE) engine; native HLS
   * playback ignores it.
   */
  minAutoResolution?: MediaResolution | undefined;
  /**
   * Playback options, keyed by the engine that reads them. Only one of the two engines below ends up playing, and each
   * reads only its own key.
   */
  engine?: HlsEngineConfig | undefined;
}

/** The engines an HLS source can configure. */
export interface HlsEngineConfig {
  /**
   * Hls.js's own configuration, passed through untouched. A `drmSystems` of its own replaces `source.drm` for hls.js —
   * an escape hatch for licensing MSE playback differently, or for the parts of hls.js's DRM configuration `source.drm`
   * does not cover.
   */
  hlsJs?: Partial<HlsJsConfig> | undefined;
  /**
   * Options for the browser's own HLS playback, used whenever the native path is the one taken. Its `drmSystems`
   * replaces `source.drm` for that path in the same way.
   */
  nativeHls?: NativeHlsConfig | undefined;
}

class HlsMediaEvent extends Event {}

/**
 * @fires sourcechange - Fired when `source` changes, either directly or by resolving a new `src`. Read `source` for the
 *   new value.
 * @fires streamtypechange - Fired when the detected stream type changes. Read `streamType` for the new value.
 * @fires targetlivewindowchange - Fired when the target live window changes. Read `targetLiveWindow` for the new value.
 */
export class HlsJsAdapter extends HTMLVideoAdapter implements HlsJsAdapterProps {
  static readonly defaultProps: HlsJsAdapterProps = {
    src: '',
    source: null,
    preload: 'metadata',
    streamType: MediaStreamTypes.UNKNOWN,
    disableRemotePlayback: false,
  };

  #delegate: HlsJsOnlyAdapter | NativeHlsAdapter | null = null;
  #mediaElement: HTMLVideoElement | null = null;
  #src = HlsJsAdapter.defaultProps.src;
  #source: HlsSource | null = HlsJsAdapter.defaultProps.source;
  #preload = HlsJsAdapter.defaultProps.preload;
  #streamType: StreamType = HlsJsAdapter.defaultProps.streamType;
  #isUserStreamType = false;
  #loadRequested?: Promise<void> | null;
  #prevEngineConfigKey?: Record<string, any> | null;
  /**
   * The author's `disableRemotePlayback`, not the element's current value. Tracked because engines (hls.js or SPF) may
   * alter the value internally. Cached here for cases where this value is set before the delegate is created so it can
   * later be forwarded.
   */
  #authorDisableRemotePlayback?: boolean;

  constructor() {
    super();
    // Cancel the native loadstart event, it's handled in the load method.
    this.addEventListener('loadstart', this.#stopTargetLoadStartEvent);
  }

  attach(target: HTMLVideoElement) {
    this.#mediaElement = target;
    super.attach(target);
    this.#delegate?.attach(target);
  }

  detach() {
    this.#delegate?.detach();
    super.detach();
    this.#mediaElement = null;
  }

  destroy() {
    this.detach();
    this.#engineDestroy();
    super.destroy();
    this.removeEventListener('loadstart', this.#stopTargetLoadStartEvent);
  }

  /**
   * Underlying playback engine — the hls.js `Hls` instance when playing via MSE, otherwise `null`. An advanced escape
   * hatch for direct engine access; normal playback is driven through this element's own properties and methods.
   */
  get engine() {
    return this.#delegate?.engine ?? null;
  }

  get error() {
    return this.#delegate?.error ?? null;
  }

  /** Populated only while the hls.js (MSE) engine is active; otherwise `undefined`. */
  get videoTracks() {
    return this.#delegate instanceof HlsJsOnlyAdapter ? this.#delegate.videoTracks : undefined;
  }

  /** Populated only while the hls.js (MSE) engine is active; otherwise `undefined`. */
  get audioTracks() {
    return this.#delegate instanceof HlsJsOnlyAdapter ? this.#delegate.audioTracks : undefined;
  }

  /** Selectable quality levels, populated only while the hls.js (MSE) engine is active; otherwise `undefined`. */
  get videoRenditions() {
    return this.#delegate instanceof HlsJsOnlyAdapter ? this.#delegate.videoRenditions : undefined;
  }

  /** Selectable audio variants, populated only while the hls.js (MSE) engine is active; otherwise `undefined`. */
  get audioRenditions() {
    return this.#delegate instanceof HlsJsOnlyAdapter ? this.#delegate.audioRenditions : undefined;
  }

  /**
   * Media source URL. Assigning it replaces the identity half of `source` and leaves `type` and the engine options
   * intact, so changing the URL never disturbs engine configuration.
   */
  get src() {
    return this.#src;
  }

  set src(src: string) {
    // `src` says which source to play; every other field says how to play it, so
    // they carry over.
    const { type, preferPlayback, drm, engine, maxAutoResolution, capRenditionToPlayerSize, minAutoResolution } =
      this.#source ?? {};
    const next: HlsSource = {
      ...(type && { type }),
      ...(preferPlayback && { preferPlayback }),
      ...(drm && { drm }),
      ...(engine && { engine }),
      ...(maxAutoResolution && { maxAutoResolution }),
      // Definedness, not truthiness: `false` is the value worth naming, and the
      // falsy one, so the neighbors' pattern would drop it.
      ...(capRenditionToPlayerSize !== undefined && { capRenditionToPlayerSize }),
      ...(minAutoResolution && { minAutoResolution }),
      ...(src && { src }),
    };

    // Everything happens in the `source` setter, so there is one path for storing
    // it, deciding on a load, and dispatching `sourcechange`.
    this.source = Object.keys(next).length > 0 ? next : null;
  }

  /**
   * Structured source: what to play (`src`, an optional `type`) plus how to play it (`preferPlayback`, `engine`).
   * Assigning it derives `src`.
   *
   * Sources are compared structurally, so reassigning an equivalent object is a no-op. Only a change to the engine
   * options (or to the resolved content type) recreates the playback engine.
   */
  get source(): HlsSource | null {
    return this.#source;
  }

  set source(value: HlsSource | null) {
    const source = value ?? null;
    // Changing anything takes a new object, so handing the same one back costs
    // nothing.
    if (source === this.#source) return;

    const src = source?.src ?? '';
    const srcChanged = this.#src !== src;

    this.#source = source;
    this.#src = src;

    // Deliberately outside the engine config key below, so it reaches the engine
    // already running.
    this.#applyRenditionCaps();

    // Assigning is always a source change, so it is always announced.
    this.dispatchEvent(new Event('sourcechange'));

    // Only reload for something playback depends on. Subclasses add params that
    // describe images rather than the stream — Mux's `poster` and `storyboard` —
    // and changing one of those must not restart what is already playing.
    if (srcChanged || this.#shouldEngineUpdate(this.#engineConfigKey())) this.#requestLoad();
  }

  /** Preload type (`'none'` / `'metadata'` / `'auto'`). */
  get preload() {
    return this.#preload;
  }

  set preload(value) {
    this.#preload = value;

    if (this.#delegate) {
      this.#delegate.preload = value;
    }
  }

  /** Whether remote playback (AirPlay, Google Cast) is disabled for this media. */
  get disableRemotePlayback() {
    return super.disableRemotePlayback;
  }

  set disableRemotePlayback(value: boolean) {
    this.#authorDisableRemotePlayback = value;
    super.disableRemotePlayback = value;

    if (this.#delegate instanceof HlsJsOnlyAdapter) {
      this.#delegate.disableRemotePlayback = value;
    }
  }

  /** Current stream type (`'on-demand'` / `'live'` / `'unknown'`). */
  get streamType(): StreamType {
    return this.#delegate?.streamType ?? this.#streamType;
  }

  set streamType(value: StreamType) {
    this.#isUserStreamType = value !== StreamTypes.UNKNOWN;

    if (this.#delegate) {
      this.#delegate.streamType = value;
      this.#streamType = this.#delegate.streamType;
      return;
    }

    if (this.#streamType === value) return;

    this.#streamType = value;
    this.dispatchEvent(new HlsMediaEvent('streamtypechange'));
  }

  /**
   * Presentation time marking the start of the Live Edge Window.
   *
   * Derived from the delegate on every read; `NaN` when no delegate is attached or the stream is not live.
   */
  get liveEdgeStart() {
    return this.#delegate?.liveEdgeStart ?? Number.NaN;
  }

  /**
   * Seekable range size for live content. `0` for standard live, `Infinity` for DVR, `NaN` for on-demand or unknown.
   * Fires `targetlivewindowchange` when the value changes (bridged from the delegate).
   */
  get targetLiveWindow() {
    return this.#delegate?.targetLiveWindow ?? Number.NaN;
  }

  async load() {
    this.#loadRequested = null;

    if (this.remote.state === 'connected') {
      this.dispatchEvent(new HlsMediaEvent('loadstart'));
      return super.load();
    }

    if (this.#shouldEngineUpdate(this.#engineConfigKey())) {
      this.#engineDestroy();
      this.#prevEngineConfigKey = this.#engineConfigKey();

      // Read the stored source, not the `source` getter: subclasses override the
      // getter to return what was assigned to them, while the fields below come
      // from what they resolved and handed down (Mux fills in the DRM options).
      const { type, preferPlayback, drm, engine, maxAutoResolution, capRenditionToPlayerSize, minAutoResolution } =
        this.#source ?? {};
      const { hlsJs, nativeHls } = engine ?? {};
      const contentType = resolveContentType(type, this.src);
      const useMse = Hls.isSupported() && contentType === ContentTypes.M3U8 && preferPlayback !== PlaybackTypes.NATIVE;

      if (__DEV__ && type && !contentType) {
        console.warn(
          `[vjs-media] Unrecognized \`source.type\` "${type}". HLS sources should use \`${ContentTypes.M3U8}\` (or \`application/x-mpegURL\`); the browser is being handed this source to play natively, so hls.js features such as quality selection are unavailable.`
        );
      }

      if (__DEV__ && !useMse) {
        const ignored = Object.entries({ maxAutoResolution, capRenditionToPlayerSize, minAutoResolution })
          .filter(([, value]) => value !== undefined)
          .map(([key]) => `\`${key}\``);

        if (ignored.length > 0) {
          const [verb, pronoun] = ignored.length > 1 ? ['require', 'them'] : ['requires', 'it'];

          console.warn(
            `[vjs-media] ${ignored.join(', ')} ${verb} the hls.js (MSE) engine; native HLS playback ignores ${pronoun}.`
          );
        }
      }

      this.#delegate = useMse
        ? new HlsJsOnlyAdapter({ config: withDrmSystems(hlsJs, drm) })
        : this.#createNativeDelegate(drm, nativeHls, hlsJs);

      bridgeEvents(this.#delegate, this);

      // Apply user `streamType` before `attach()` so native delegates do not run
      // synchronous duration-based detection first and emit a transient value.
      if (this.#isUserStreamType) {
        this.#delegate.streamType = this.#streamType;
      }

      this.#delegate.preload = this.preload;
      this.#applyRenditionCaps();

      // Forward the author intent to the delegate, in case it was captured before it existed.
      if (this.#authorDisableRemotePlayback !== undefined && this.#delegate instanceof HlsJsOnlyAdapter) {
        this.#delegate.disableRemotePlayback = this.#authorDisableRemotePlayback;
      }

      if (this.#mediaElement) {
        this.#delegate.attach(this.#mediaElement);
      }
    }

    if (this.#delegate) {
      this.dispatchEvent(new HlsMediaEvent('loadstart'));
      this.#delegate.src = this.src;
    }
  }

  /**
   * A native delegate carrying the native half of the source — the DRM configuration and the native engine options,
   * which it applies the same precedence to. Its `src` is assigned separately, once the delegate is wired up, and
   * carries what is set here forward.
   */
  #createNativeDelegate(
    drm: DrmSystemsConfig | undefined,
    nativeHls: NativeHlsConfig | undefined,
    hlsJs: Partial<HlsJsConfig> | undefined
  ) {
    if (__DEV__) {
      // The delegate applies the same precedence, so the warning has to read — and
      // name — whatever it will end up licensing against. An escape hatch replaces
      // `source.drm` rather than adding to it, so pointing at the wrong one of the
      // two would send a reader looking in a field that is already correct.
      const drmSystems = nativeHls?.drmSystems ?? drm;
      const field = nativeHls?.drmSystems ? 'source.engine.nativeHls.drmSystems' : 'source.drm';
      const isProtected = hlsJs?.emeEnabled || hlsJs?.drmSystems || Object.keys(drmSystems ?? {}).length > 0;

      if (isProtected && !drmSystems?.[KeySystems.FAIRPLAY]) {
        console.warn(
          `[vjs-drm] Native HLS playback negotiates FairPlay itself and never sees the hls.js DRM configuration, and no \`${KeySystems.FAIRPLAY}\` license server is named in \`${field}\`. DRM-protected media will not play.`
        );
      }
    }

    const media = new NativeHlsAdapter();
    const source: NativeHlsSource = {
      ...(drm && { drm }),
      ...(nativeHls && { engine: { nativeHls } }),
    };

    if (Object.keys(source).length > 0) media.source = source;

    return media;
  }

  /** Push the source's rendition caps down; only the hls.js engine has a lever. */
  #applyRenditionCaps() {
    if (this.#delegate instanceof HlsJsOnlyAdapter) {
      this.#delegate.maxAutoResolution = this.#source?.maxAutoResolution;
      this.#delegate.capRenditionToPlayerSize = this.#source?.capRenditionToPlayerSize;
      this.#delegate.minAutoResolution = this.#source?.minAutoResolution;
    }
  }

  #stopTargetLoadStartEvent = (event: Event) => {
    if (!(event instanceof HlsMediaEvent)) event.stopImmediatePropagation();
  };

  async #requestLoad() {
    if (this.#loadRequested) return;

    await (this.#loadRequested = Promise.resolve());
    this.#loadRequested = null;
    this.load();
  }

  #shouldEngineUpdate(nextEngineConfigKey: Record<string, any>) {
    return !deepEqual(this.#prevEngineConfigKey, nextEngineConfigKey);
  }

  /**
   * Every value the engine is constructed from. Compared structurally, so equivalent engine options never trigger a
   * rebuild — including nested ones like `drmSystems`, which a flat comparison would see as changed whenever the object
   * identity did.
   */
  #engineConfigKey() {
    const { type, preferPlayback, drm, engine } = this.#source ?? {};

    return { drm, engine, preferPlayback, contentType: resolveContentType(type, this.src) };
  }

  #engineDestroy() {
    this.#delegate?.destroy();
    this.#delegate = null;
    this.#prevEngineConfigKey = null;
    this.#loadRequested = null;

    // Delegate teardown already emits `streamtypechange` (bridged); only sync cache.
    if (!this.#isUserStreamType) this.#streamType = StreamTypes.UNKNOWN;
  }
}

/**
 * Hls.js configuration with the source's DRM licensing folded in. hls.js takes `drmSystems` in the same shape as
 * `source.drm`, so the standardized config is what it plays from unless `engine.hlsJs` names servers of its own.
 *
 * Hls.js runs key exchange only while `emeEnabled` is set, so configured DRM switches it on — short of an explicit
 * `emeEnabled: false`, which stays a way to describe a source's licensing without acting on it.
 */
function withDrmSystems(
  hlsJs: Partial<HlsJsConfig> | undefined,
  drm: DrmSystemsConfig | undefined
): Partial<HlsJsConfig> {
  const drmSystems = hlsJs?.drmSystems ?? drm;
  if (!drmSystems || Object.keys(drmSystems).length === 0) return { ...hlsJs };

  // hls.js declares `serverCertificateUrl` without `undefined`, which an
  // omittable property here is allowed to carry. The values are the same.
  return { emeEnabled: true, ...hlsJs, drmSystems: drmSystems as HlsJsConfig['drmSystems'] };
}

/**
 * The canonical content type the engine decision is made on: an explicit `type` folded onto its canonical spelling, or
 * what the URL suggests when there is none. An explicit type nobody recognizes resolves to `undefined` rather than
 * falling back to inference — the author said what the source is, and guessing over them would make `type` mean
 * different things depending on its value.
 */
function resolveContentType(type: string | undefined, src: string): SourceType | undefined {
  if (!type) return inferContentType(src);

  // Parameters (`; charset=...`) and case carry no meaning for the engine choice.
  const normalized = (type.split(';')[0] ?? '').trim().toLowerCase();
  if (HLS_CONTENT_TYPES.has(normalized)) return ContentTypes.M3U8;

  if (MP4_CONTENT_TYPES.has(normalized)) return ContentTypes.MP4;

  return undefined;
}

function inferContentType(src: string): SourceType {
  const path = src.split(/[?#]/)[0] ?? '';
  if (path.endsWith('.mp4')) return ContentTypes.MP4;

  return ContentTypes.M3U8;
}
