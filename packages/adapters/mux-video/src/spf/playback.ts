import {
  adapterTypeForMimeType,
  type DrmSystemsConfig,
  type MediaCrossOriginType,
  type MediaStreamType,
  MediaStreamTypes,
  resolveMimeType,
  toMediaCrossOrigin,
} from '@videojs/media';
import { getMediaEngineName, HTMLVideoAdapter } from '@videojs/media/dom';
import { NativeHlsAdapter } from '@videojs/native-hls-video';
import type { HlsVideoAdapterAPI } from '@videojs/spf/adapters/hls-video';
import { HlsVideoMpegTsAdapter } from '@videojs/spf/adapters/hls-video-mpeg-ts';
import { supportsMediaSource } from '@videojs/utils/dom';

import { MUX_ALTERNATIVE_MEDIA_SUGGESTION } from './mixin';

/** How a source plays: through SPF over Media Source Extensions, or the browser's own HLS support. */
export type SpfPlaybackType = 'mse' | 'native';

/** Structured source for {@link SpfVideoAdapter}: which source to play, plus how to play it. */
export interface SpfVideoSource {
  /** Manifest URL. Mirrors the host's `src` property. */
  src?: string | undefined;
  /**
   * MIME type of the source. Takes precedence over inference from `src`. An HLS type (any of its spellings) plays
   * through SPF; anything else, such as `video/mp4`, is handed to the browser.
   */
  type?: string | undefined;
  /**
   * Preferred playback path: `'mse'` for SPF, `'native'` for the browser's own HLS support. Ignored when the preferred
   * path cannot play the source.
   */
  preferPlayback?: SpfPlaybackType | undefined;
  /**
   * License servers for protected content, keyed by EME key system id. Engine neutral: SPF negotiates every system
   * named here, and native playback negotiates the `com.apple.fps` entry itself.
   */
  drm?: DrmSystemsConfig | undefined;
}

export interface SpfVideoAdapterProps {
  src: string;
  source: SpfVideoSource | null;
  preload: '' | 'none' | 'metadata' | 'auto';
  crossOrigin: MediaCrossOriginType | '' | null;
  disableRemotePlayback: boolean;
  streamType: MediaStreamType;
}

/** The SPF Media this adapter delegates to, with the Mux error copy pointing at the hls.js-backed flavor. */
class SpfDelegate extends HlsVideoMpegTsAdapter {
  static override get alternativeMediaSuggestion(): string | undefined {
    return MUX_ALTERNATIVE_MEDIA_SUGGESTION;
  }
}

type Delegate = SpfDelegate | NativeHlsAdapter;

/**
 * SPF where it can play, the browser's own HLS where it can't — the SPF counterpart of `HlsJsAdapter`, which makes the
 * same choice between hls.js and native playback.
 *
 * Native playback is taken when the browser has no Media Source Extensions (iPhone Safari before iOS 17.1), when the
 * source isn't HLS (a static MP4 rendition), or when `source.preferPlayback` asks for it. The choice is made per
 * source, and the delegate behind it is kept for as long as the choice holds: SPF recycles one engine across sources,
 * so only switching paths builds a new one.
 *
 * @fires sourcechange - Fired when `source` changes, either directly or by resolving a new `src`. Read `source` for the
 *   new value.
 * @fires streamtypechange - Fired when the detected stream type changes. Read `streamType` for the new value.
 * @fires targetlivewindowchange - Fired when the target live window changes. Read `targetLiveWindow` for the new value.
 */
export class SpfVideoAdapter extends HTMLVideoAdapter implements SpfVideoAdapterProps {
  static readonly defaultProps: SpfVideoAdapterProps = {
    src: '',
    source: null,
    preload: 'metadata',
    crossOrigin: null,
    disableRemotePlayback: false,
    streamType: MediaStreamTypes.UNKNOWN,
  };

  #delegate: Delegate | null = null;
  #mediaElement: HTMLVideoElement | null = null;
  #source: SpfVideoSource | null = SpfVideoAdapter.defaultProps.source;
  #preload = SpfVideoAdapter.defaultProps.preload;
  #streamType: MediaStreamType = SpfVideoAdapter.defaultProps.streamType;
  #isUserStreamType = false;
  /** Kept here rather than read off the element, so it survives until there is one; SPF reads it per request. */
  #crossOrigin: MediaCrossOriginType | null = toMediaCrossOrigin(SpfVideoAdapter.defaultProps.crossOrigin);
  /**
   * The author's value, kept for a delegate that doesn't exist yet. SPF manages the element's `disableRemotePlayback`
   * itself, so the author's intent has to reach SPF rather than the element.
   */
  #authorDisableRemotePlayback?: boolean;

  attach(target: HTMLVideoElement) {
    this.#mediaElement = target;
    super.attach(target);

    // Most-recent-wins on attach, as SPF does: an element authored with
    // `crossorigin` is the intent; otherwise what was set before attach reaches
    // the element now.
    this.#crossOrigin = toMediaCrossOrigin(target.crossOrigin) ?? this.#crossOrigin;
    target.crossOrigin = this.#crossOrigin;

    this.#delegate?.attach(target);
  }

  detach() {
    this.#delegate?.detach();
    super.detach();
    this.#mediaElement = null;
  }

  destroy() {
    this.detach();
    this.#destroyDelegate();
    super.destroy();
  }

  /**
   * Underlying playback engine — the SPF composition while SPF plays, otherwise `null`. An advanced escape hatch for
   * direct engine access; normal playback is driven through this element's own properties and methods.
   */
  get engine(): HlsVideoAdapterAPI['engine'] | null {
    return this.#delegate instanceof SpfDelegate ? this.#delegate.engine : null;
  }

  /**
   * Engine this media is playing through, reported to analytics such as Mux Data: SPF's engine name via MSE, `browser`
   * for native HLS, or `undefined` until a source loads. Read from the instance because the engine is picked per
   * source.
   */
  get engineName(): string | undefined {
    return getMediaEngineName(this.#delegate);
  }

  get error() {
    return this.#delegate?.error ?? null;
  }

  /** Populated only while SPF plays; otherwise `undefined`. */
  get videoTracks() {
    return this.#delegate instanceof SpfDelegate ? this.#delegate.videoTracks : undefined;
  }

  /** Populated only while SPF plays; otherwise `undefined`. */
  get audioTracks() {
    return this.#delegate instanceof SpfDelegate ? this.#delegate.audioTracks : undefined;
  }

  /** Selectable quality levels, populated only while SPF plays; otherwise `undefined`. */
  get videoRenditions() {
    return this.#delegate instanceof SpfDelegate ? this.#delegate.videoRenditions : undefined;
  }

  /** Selectable audio variants, populated only while SPF plays; otherwise `undefined`. */
  get audioRenditions() {
    return this.#delegate instanceof SpfDelegate ? this.#delegate.audioRenditions : undefined;
  }

  /**
   * Media source URL. Assigning it replaces the identity half of `source` and leaves `type` and `preferPlayback`
   * intact, so changing the URL never changes how it plays.
   */
  get src() {
    return this.#source?.src ?? '';
  }

  set src(src: string) {
    const { type, preferPlayback } = this.#source ?? {};
    const next: SpfVideoSource = {
      ...(type && { type }),
      ...(preferPlayback && { preferPlayback }),
      ...(src && { src }),
    };

    this.source = Object.keys(next).length > 0 ? next : null;
  }

  /**
   * Structured source: what to play (`src`, an optional `type`) plus how to play it (`preferPlayback`, `drm`).
   * Assigning it derives `src`. Assigning the same object back costs nothing — changing anything takes a new one.
   */
  get source(): SpfVideoSource | null {
    return this.#source;
  }

  set source(value: SpfVideoSource | null) {
    const source = value ?? null;
    if (source === this.#source) return;

    this.#source = source;
    this.#syncDelegate();

    this.dispatchEvent(new Event('sourcechange'));
  }

  /** Preload type (`'none'` / `'metadata'` / `'auto'`). */
  get preload() {
    return this.#preload;
  }

  set preload(value) {
    this.#preload = value;

    if (this.#delegate) this.#delegate.preload = value;
  }

  /** The element's CORS-settings attribute. Under SPF, `use-credentials` also sends cookies with its own requests. */
  get crossOrigin(): MediaCrossOriginType | null {
    return this.#crossOrigin;
  }

  set crossOrigin(value: MediaCrossOriginType | '' | null) {
    // The attribute keeps the author's spelling; the getter and SPF see the
    // canonical keyword.
    this.#crossOrigin = toMediaCrossOrigin(value);

    if (this.#delegate instanceof SpfDelegate) this.#delegate.crossOrigin = value;
    else if (this.#mediaElement) this.#mediaElement.crossOrigin = value;
  }

  /** Whether remote playback (AirPlay, Google Cast) is disabled for this media. */
  get disableRemotePlayback() {
    return this.#delegate instanceof SpfDelegate ? this.#delegate.disableRemotePlayback : super.disableRemotePlayback;
  }

  set disableRemotePlayback(value: boolean) {
    this.#authorDisableRemotePlayback = value;

    if (this.#delegate instanceof SpfDelegate) this.#delegate.disableRemotePlayback = value;
    else super.disableRemotePlayback = value;
  }

  /** Current stream type (`'on-demand'` / `'live'` / `'unknown'`). */
  get streamType(): MediaStreamType {
    return this.#delegate?.streamType ?? this.#streamType;
  }

  set streamType(value: MediaStreamType) {
    this.#isUserStreamType = value !== MediaStreamTypes.UNKNOWN;

    if (this.#delegate) {
      this.#delegate.streamType = value;
      this.#streamType = this.#delegate.streamType;
      return;
    }

    if (this.#streamType === value) return;

    this.#streamType = value;
    this.dispatchEvent(new Event('streamtypechange'));
  }

  /** Presentation time marking the start of the live edge window; `NaN` when nothing plays or the stream isn't live. */
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

  /** SPF's `play()` also tells the engine playback was asked for, which loads a `preload="none"` source. */
  play() {
    return this.#delegate?.play() ?? super.play();
  }

  /**
   * Hand the source to the delegate that can play it, replacing the delegate only when the path changes. A cleared
   * source goes to whichever delegate is there, so it unloads without deciding anything.
   */
  #syncDelegate() {
    const { src, type, preferPlayback, drm } = this.#source ?? {};

    if (src) {
      const useSpf = supportsMediaSource() && isHlsSource(src, type) && preferPlayback !== 'native';

      if (this.#delegate && this.#delegate instanceof SpfDelegate !== useSpf) this.#destroyDelegate();

      this.#delegate ??= this.#createDelegate(useSpf);
    }

    if (this.#delegate) this.#delegate.source = src ? { src, ...(drm && { drm }) } : null;
  }

  #createDelegate(useSpf: boolean): Delegate {
    const delegate = useSpf ? new SpfDelegate() : new NativeHlsAdapter();

    bridgeDelegateEvents(delegate, this);

    // Before `attach()`, so native playback doesn't detect a stream type first and
    // announce a transient one.
    if (this.#isUserStreamType) delegate.streamType = this.#streamType;

    delegate.preload = this.#preload;

    if (delegate instanceof SpfDelegate) {
      delegate.crossOrigin = this.#crossOrigin;

      if (this.#authorDisableRemotePlayback !== undefined) {
        delegate.disableRemotePlayback = this.#authorDisableRemotePlayback;
      }
    }

    if (this.#mediaElement) delegate.attach(this.#mediaElement);

    return delegate;
  }

  #destroyDelegate() {
    const wasSpf = this.#delegate instanceof SpfDelegate;

    this.#delegate?.destroy();
    this.#delegate = null;

    // Under Managed Media Source, SPF leaves the element's `disableRemotePlayback`
    // set, which would keep AirPlay off for the source native playback takes next.
    if (wasSpf && this.#mediaElement) super.disableRemotePlayback = this.#authorDisableRemotePlayback ?? false;

    // Delegate teardown already emits `streamtypechange` (bridged); only sync the cache.
    if (!this.#isUserStreamType) this.#streamType = MediaStreamTypes.UNKNOWN;
  }
}

/**
 * Whether a source is HLS, and so SPF's to play. An explicit `type` decides on its own — the author said what the
 * source is. Without one, a URL with a known extension is what its extension says, and one without
 * (`stream.mux.com/<id>`) is HLS.
 */
function isHlsSource(src: string, type: string | undefined): boolean {
  if (type) return adapterTypeForMimeType(type) === 'hls';

  const mimeType = resolveMimeType(src);

  return !mimeType || adapterTypeForMimeType(mimeType) === 'hls';
}

/**
 * Re-dispatch the delegate's events on the host, as `bridgeEvents` does, minus `sourcechange`: the host announces its
 * own source, and SPF announcing the source handed down to it would fire the event twice.
 */
function bridgeDelegateEvents(delegate: EventTarget, host: EventTarget): void {
  // SAFETY: every event's constructor is an `Event` subclass taking `(type, init)`, and the event is its own init.
  delegate.dispatchEvent = (event: Event) =>
    event.type === 'sourcechange' || host.dispatchEvent(new (event.constructor as typeof Event)(event.type, event));
}
