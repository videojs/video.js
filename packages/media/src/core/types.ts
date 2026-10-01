// ----------------------------------------
// Event primitives
// ----------------------------------------

export interface EventLike<Detail = void> {
  readonly type: string;
  readonly timeStamp: number;
  readonly detail?: Detail;
}

export interface EventTargetLike<Events extends { [K in keyof Events]: EventLike }> {
  addEventListener<K extends keyof Events & string>(
    type: K,
    listener: (event: Events[K]) => void,
    options?: { signal?: AbortSignal }
  ): void;
  removeEventListener<K extends keyof Events & string>(type: K, listener: (event: Events[K]) => void): void;
  dispatchEvent(event: EventLike): boolean;
}

/** @internal */
export function TypedEventTarget<Events extends { [K in keyof Events]: EventLike }>() {
  return EventTarget as unknown as { new (): EventTargetLike<Events> };
}

// ----------------------------------------
// Shared value types
// ----------------------------------------

export type MediaFeatureAvailability = 'available' | 'unavailable' | 'unsupported';

/**
 * Rendition height, as the `{height}p` shorthand streaming providers use.
 *
 * Options that accept one match renditions by pixel area rather than by literal height, so anamorphic variants land in
 * the bucket their source material belongs to.
 */
export type MediaResolution = '270p' | '360p' | '480p' | '540p' | '720p' | '1080p' | '1440p' | '2160p';

// ----------------------------------------
// Controls
// ----------------------------------------

export interface MediaControlsCapability {
  controls: boolean;
}

// ----------------------------------------
// Playback
// ----------------------------------------

export interface MediaPlaybackEvents {
  play: EventLike;
  playing: EventLike;
  waiting: EventLike;
}

export interface MediaPlaybackCapability {
  play(): Promise<void>;
}

// ----------------------------------------
// Autoplay
// ----------------------------------------

export interface MediaAutoplayCapability {
  autoplay: boolean;
}

// ----------------------------------------
// Pause
// ----------------------------------------

export interface MediaPauseEvents {
  pause: EventLike;
  ended: EventLike;
}

export interface MediaPauseCapability {
  pause(): void;
  readonly paused: boolean;
  readonly ended: boolean;
}

// ----------------------------------------
// Seek
// ----------------------------------------

export interface MediaSeekEvents {
  timeupdate: EventLike;
  durationchange: EventLike;
  seeking: EventLike;
  seeked: EventLike;
  loadedmetadata: EventLike;
}

export interface MediaSeekCapability {
  currentTime: number;
  loop: boolean;
  readonly duration: number;
  readonly seeking: boolean;
}

// ----------------------------------------
// Source
// ----------------------------------------

export type MediaPreloadType = '' | 'none' | 'metadata' | 'auto';

/** @internal */
export const MediaReadyState = {
  HAVE_NOTHING: 0,
  HAVE_METADATA: 1,
  HAVE_CURRENT_DATA: 2,
  HAVE_FUTURE_DATA: 3,
  HAVE_ENOUGH_DATA: 4,
} as const;

/** An `HTMLMediaElement.readyState` value, from `0` (`HAVE_NOTHING`) to `4` (`HAVE_ENOUGH_DATA`). */
export type MediaReadyStateValue = 0 | 1 | 2 | 3 | 4;

export interface MediaSourceEvents {
  loadstart: EventLike;
  emptied: EventLike;
  canplay: EventLike;
  canplaythrough: EventLike;
  loadeddata: EventLike;
  abort: EventLike;
  stalled: EventLike;
  suspend: EventLike;
}

/** Result of {@link MediaSourceCapability.canPlayType}. */
export type CanPlayTypeResult = '' | 'maybe' | 'probably';

export interface MediaSourceCapability {
  src: string;
  readonly currentSrc: string;
  readonly readyState: MediaReadyStateValue | number;
  preload: MediaPreloadType;
  crossOrigin: string | null;
  load(): Promise<void> | void;
  canPlayType(type: string): CanPlayTypeResult;
}

// ----------------------------------------
// Volume
// ----------------------------------------

export interface MediaVolumeEvents {
  volumechange: EventLike;
}

export interface MediaVolumeCapability {
  volume: number;
  muted: boolean;
  defaultMuted: boolean;
}

// ----------------------------------------
// Playback rate
// ----------------------------------------

export interface MediaPlaybackRateEvents {
  ratechange: EventLike;
}

export interface MediaPlaybackRateCapability {
  playbackRate: number;
  defaultPlaybackRate: number;
}

// ----------------------------------------
// Buffer
// ----------------------------------------

export interface TimeRangeLike {
  readonly length: number;
  start(index: number): number;
  end(index: number): number;
}

export interface MediaBufferEvents {
  progress: EventLike;
}

export interface MediaBufferCapability {
  readonly buffered: TimeRangeLike;
  readonly seekable: TimeRangeLike;
}

// ----------------------------------------
// Played
// ----------------------------------------

export interface MediaPlayedCapability {
  readonly played: TimeRangeLike;
}

// ----------------------------------------
// Error
// ----------------------------------------

export interface ErrorLike {
  readonly code: number;
  readonly message: string;
}

export interface MediaErrorEvents {
  error: EventLike;
}

export interface MediaErrorCapability {
  readonly error: ErrorLike | null;
}

// ----------------------------------------
// Text tracks
// ----------------------------------------

export interface TextCueLike {
  readonly startTime: number;
  readonly endTime: number;
  readonly text?: string;
}

export interface TextCueListLike {
  readonly length: number;
  [Symbol.iterator](): Iterator<TextCueLike>;
  getCueById?(id: string): TextCueLike | null;
}

/**
 * The kind of text track.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/TextTrack/kind
 */
export type TextTrackKind = 'subtitles' | 'captions' | 'descriptions' | 'chapters' | 'metadata';

export interface TextTrackLike {
  readonly kind: string;
  readonly label: string;
  readonly language: string;
  readonly id: string;
  readonly src?: string;
  mode: 'showing' | 'disabled' | 'hidden';
  readonly cues: TextCueListLike | null;
  addCue?(cue: TextCueLike): void;
}

export interface TextTrackListEvents {
  addtrack: EventLike;
  removetrack: EventLike;
  change: EventLike;
}

export interface TextTrackListLike extends EventTargetLike<TextTrackListEvents> {
  readonly length: number;
  readonly [index: number]: TextTrackLike;
  [Symbol.iterator](): Iterator<TextTrackLike>;
  getTrackById?(id: string): TextTrackLike | null;
}

export interface MediaTextTrackCapability {
  readonly textTracks: TextTrackListLike;
  addTextTrack(kind: TextTrackKind, label?: string, language?: string): TextTrackLike;
}

// ----------------------------------------
// Media tracks
// ----------------------------------------

interface MediaTrackEventLike<Track> extends EventLike {
  readonly track: Track;
}

interface MediaTrackListEvents<Track> {
  addtrack: MediaTrackEventLike<Track>;
  removetrack: MediaTrackEventLike<Track>;
  change: EventLike;
}

export interface AudioTrackLike {
  id: string | undefined;
  readonly kind: string | undefined;
  readonly label: string;
  readonly language: string;
  enabled: boolean;
  addRendition(src: string, codec?: string | undefined, bitrate?: number | undefined): AudioRenditionLike;
  removeRendition(rendition: AudioRenditionLike): void;
}

export interface AudioTrackListLike extends EventTargetLike<MediaTrackListEvents<AudioTrackLike>> {
  readonly length: number;
  readonly [index: number]: AudioTrackLike;
  [Symbol.iterator](): Iterator<AudioTrackLike>;
  getTrackById(id: string): AudioTrackLike | null;
}

export interface VideoTrackLike {
  id: string | undefined;
  readonly kind: string | undefined;
  readonly label: string;
  readonly language: string;
  selected: boolean;
  addRendition(
    src: string,
    width?: number | undefined,
    height?: number | undefined,
    codec?: string | undefined,
    bitrate?: number | undefined,
    frameRate?: number | undefined
  ): VideoRenditionLike;
  removeRendition(rendition: VideoRenditionLike): void;
}

export interface VideoTrackListLike extends EventTargetLike<MediaTrackListEvents<VideoTrackLike>> {
  readonly length: number;
  readonly [index: number]: VideoTrackLike;
  [Symbol.iterator](): Iterator<VideoTrackLike>;
  getTrackById(id: string): VideoTrackLike | null;
  readonly selectedIndex: number;
}

export interface MediaAudioTrackCapability {
  readonly audioTracks: AudioTrackListLike;
  addAudioTrack(kind: string, label?: string, language?: string): AudioTrackLike;
  removeAudioTrack(track: AudioTrackLike): void;
}

/** @experimental */
export interface MediaVideoTrackCapability {
  readonly videoTracks: VideoTrackListLike;
  addVideoTrack(kind: string, label?: string, language?: string): VideoTrackLike;
  removeVideoTrack(track: VideoTrackLike): void;
}

// ----------------------------------------
// Renditions
// ----------------------------------------

interface RenditionEventLike<Rendition> extends EventLike {
  readonly rendition: Rendition;
}

interface RenditionListEvents<Rendition> {
  addrendition: RenditionEventLike<Rendition>;
  removerendition: RenditionEventLike<Rendition>;
  change: EventLike;
}

export interface AudioRenditionLike {
  id: string | undefined;
  readonly bitrate: number | undefined;
  readonly codec: string | undefined;
  selected: boolean;
}

export interface AudioRenditionListLike extends EventTargetLike<RenditionListEvents<AudioRenditionLike>> {
  readonly length: number;
  readonly [index: number]: AudioRenditionLike;
  [Symbol.iterator](): Iterator<AudioRenditionLike>;
  getRenditionById(id: string): AudioRenditionLike | null;
  selectedIndex: number;
}

export interface VideoRenditionLike {
  id: string | undefined;
  readonly width: number | undefined;
  readonly height: number | undefined;
  readonly bitrate: number | undefined;
  readonly frameRate: number | undefined;
  readonly codec: string | undefined;
  selected: boolean;
  active?: boolean | undefined;
}

interface VideoRenditionListEvents extends RenditionListEvents<VideoRenditionLike> {
  activechange: EventLike;
}

export interface VideoRenditionListLike extends EventTargetLike<VideoRenditionListEvents> {
  readonly length: number;
  readonly [index: number]: VideoRenditionLike;
  [Symbol.iterator](): Iterator<VideoRenditionLike>;
  getRenditionById(id: string): VideoRenditionLike | null;
  selectedIndex: number;
}

/** @experimental */
export interface MediaAudioRenditionCapability {
  readonly audioRenditions: AudioRenditionListLike;
}

export interface MediaVideoRenditionCapability {
  readonly videoRenditions: VideoRenditionListLike;
}

// ----------------------------------------
// Fullscreen
// ----------------------------------------

export interface MediaFullscreenCapability {
  readonly isFullscreen: boolean;
  requestFullscreen(): Promise<unknown>;
  exitFullscreen(): Promise<unknown>;
}

// ----------------------------------------
// Picture-in-picture
// ----------------------------------------

export interface MediaPictureInPictureEvents {
  enterpictureinpicture: EventLike;
  leavepictureinpicture: EventLike;
}

export interface MediaPictureInPictureCapability {
  readonly isPictureInPicture: boolean;
  disablePictureInPicture: boolean;
  requestPictureInPicture(): Promise<unknown>;
  exitPictureInPicture(): Promise<unknown>;
}

// ----------------------------------------
// Stream type
// ----------------------------------------

/**
 * Named values of {@link MediaStreamType}.
 *
 * @internal
 */
export const MediaStreamTypes = {
  ON_DEMAND: 'on-demand',
  LIVE: 'live',
  UNKNOWN: 'unknown',
} as const;

/**
 * How a stream is delivered.
 *
 * - `on-demand` — a finite-duration asset (VOD). Scrubbing is generally supported across the full timeline.
 * - `live` — a live or DVR stream. The seekable window may slide as new segments are published, and `duration` is
 *   typically `Infinity`.
 * - `unknown` — the stream type has not been determined yet (no source, or metadata has not loaded).
 */
export type MediaStreamType = 'on-demand' | 'live' | 'unknown';

export interface MediaStreamTypeEvents {
  streamtypechange: EventLike;
}

export interface MediaStreamTypeCapability {
  streamType: MediaStreamType;
}

export interface MediaLiveEvents {
  targetlivewindowchange: EventLike;
}

export interface MediaLiveCapability {
  /**
   * Playback time where the live edge begins. Playback is live when `currentTime >= liveEdgeStart`. `NaN` when the
   * stream is not live or the value is unknown.
   *
   * No change event fires for this value alone. Read it again when `seekable`, `targetLiveWindow`, or `streamType`
   * changes.
   *
   * @see https://github.com/video-dev/media-ui-extensions/blob/main/proposals/0007-live-edge.md
   */
  readonly liveEdgeStart: number;
  /**
   * Describes the kind of live window available. `0` for a sliding live window, `Infinity` for a live event with
   * playback history, and `NaN` for on-demand or unknown. This value is not a duration. Fires `targetlivewindowchange`
   * when it changes.
   */
  readonly targetLiveWindow: number;
}

// ----------------------------------------
// Remote playback
// ----------------------------------------

export interface RemotePlaybackEvents {
  connecting: EventLike;
  connect: EventLike;
  disconnect: EventLike;
}

export interface RemotePlaybackLike extends EventTargetLike<RemotePlaybackEvents> {
  readonly state: 'connecting' | 'connected' | 'disconnected';
  prompt(): Promise<void>;
  watchAvailability(callback: (available: boolean) => void): Promise<number>;
  cancelWatchAvailability(id?: number): Promise<void>;
}

export interface MediaRemotePlaybackCapability {
  readonly remote: RemotePlaybackLike;
  disableRemotePlayback: boolean;
}

// ----------------------------------------
// Plays inline (video-only)
// ----------------------------------------

export interface MediaPlaysInlineCapability {
  playsInline: boolean;
}

// ----------------------------------------
// Poster (video-only)
// ----------------------------------------

export interface MediaPosterCapability {
  poster: string;
}

// ----------------------------------------
// Content metadata
// ----------------------------------------

/** A media-owned content value. `undefined` means the key is absent; `null` means it has no current value. */
export type MediaContentValue = string | null | undefined;

/**
 * Standardized content metadata reported by a media implementation. The named keys are the shared vocabulary player
 * features read; a media may report keys of its own alongside them.
 *
 * Report a key only for a value the media can vouch for. Omit it otherwise — an empty string is a deliberate blank that
 * stops a feature's fallback chain, so reporting `''` for "not loaded yet" suppresses the author's fallback.
 */
export interface MediaContentData {
  /** Title of the content. */
  readonly title?: MediaContentValue;
  /** URL of a still image representing the content. */
  readonly poster?: MediaContentValue;
  /** URL of a WebVTT storyboard describing thumbnail sprites for the content. */
  readonly storyboard?: MediaContentValue;
  readonly [key: string]: MediaContentValue;
}

/** Events emitted when a media implementation's content data changes. */
export interface MediaContentDataEvents {
  contentdatachange: EventLike;
}

/**
 * Optional media-owned content metadata.
 *
 * `undefined` means the media does not support content data at all. A defined bag — including an empty one — means it
 * does, and its keys may come and go as a source loads or is replaced.
 *
 * Implementations dispatch `contentdatachange` when the bag changes, and only then; an assignment that leaves every key
 * and value alone stays quiet. They are also expected to clear content data when the source is replaced. Nothing
 * enforces that second half, so a media that skips it reports stale metadata across a source change.
 */
export interface MediaContentDataCapability {
  readonly contentData: MediaContentData | undefined;
}

// ----------------------------------------
// Video dimensions (video-only)
// ----------------------------------------

export interface MediaVideoDimensionsEvents {
  resize: EventLike;
}

export interface MediaVideoDimensionsCapability {
  readonly videoWidth: number;
  readonly videoHeight: number;
}

// ----------------------------------------
// Base Media
// ----------------------------------------

export interface MediaEvents extends MediaPlaybackEvents {}

export interface Media<Events extends { [K in keyof Events]: EventLike } = MediaEvents>
  extends MediaPlaybackCapability, EventTargetLike<Events> {}

// ----------------------------------------
// Composed shapes
// ----------------------------------------

export interface CommonMediaEvents
  extends
    MediaEvents,
    MediaPauseEvents,
    MediaSeekEvents,
    MediaSourceEvents,
    MediaVolumeEvents,
    MediaPlaybackRateEvents,
    MediaBufferEvents,
    MediaErrorEvents,
    TextTrackListEvents,
    MediaStreamTypeEvents,
    MediaLiveEvents,
    MediaContentDataEvents {}

export interface CommonMedia<Events extends { [K in keyof Events]: EventLike } = CommonMediaEvents>
  extends
    Media<Events>,
    MediaPauseCapability,
    MediaSeekCapability,
    MediaSourceCapability,
    MediaVolumeCapability,
    MediaPlaybackRateCapability,
    MediaBufferCapability,
    MediaPlayedCapability,
    MediaErrorCapability,
    MediaTextTrackCapability,
    MediaStreamTypeCapability,
    MediaLiveCapability,
    MediaContentDataCapability,
    MediaRemotePlaybackCapability,
    MediaControlsCapability,
    MediaAutoplayCapability {}

export interface VideoEvents extends CommonMediaEvents, MediaPictureInPictureEvents, MediaVideoDimensionsEvents {}

export interface Video
  extends
    CommonMedia<VideoEvents>,
    MediaPlaysInlineCapability,
    MediaPosterCapability,
    MediaFullscreenCapability,
    MediaPictureInPictureCapability,
    MediaVideoDimensionsCapability {}

/** @internal */
export interface AudioEvents extends CommonMediaEvents {}

/** @internal */
export interface Audio extends CommonMedia<AudioEvents> {}

// ----------------------------------------
// Target shapes
// ----------------------------------------

export interface MediaTargetLike
  extends
    MediaPlaybackCapability,
    MediaPauseCapability,
    MediaSeekCapability,
    MediaSourceCapability,
    MediaVolumeCapability,
    MediaPlaybackRateCapability,
    MediaBufferCapability,
    MediaPlayedCapability,
    MediaErrorCapability,
    MediaTextTrackCapability,
    MediaRemotePlaybackCapability,
    MediaControlsCapability,
    MediaAutoplayCapability,
    Partial<MediaLiveCapability>,
    Partial<MediaStreamTypeCapability>,
    Partial<MediaContentDataCapability> {
  title: string;
}

export interface VideoTargetLike
  extends MediaTargetLike, MediaPosterCapability, MediaPlaysInlineCapability, MediaVideoDimensionsCapability {
  disablePictureInPicture: boolean;
  requestPictureInPicture(): Promise<unknown>;
  requestFullscreen(): Promise<unknown>;
}

/** @experimental */
export interface EngineAdapter<Engine = unknown, Target = unknown> {
  readonly engine: Engine | null;
  attach?(target: Target): void;
  detach?(): void;
  destroy(): void;
}
