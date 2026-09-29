import type { ErrorLike, MediaFeatureAvailability, MediaStreamType, TextTrackKind } from './types';

export type { TextTrackKind };

export interface MediaPlaybackState {
  /**
   * Whether playback is paused.
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/paused
   */
  paused: boolean;
  /**
   * Whether playback has reached the end.
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/ended
   */
  ended: boolean;
  /** Whether playback has started (played or seeked). */
  started: boolean;
  /**
   * Whether playback is stalled waiting for data.
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/waiting_event
   */
  waiting: boolean;
  /**
   * Start playback. Updates `paused` immediately when the media starts.
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/play
   */
  play(): Promise<void>;
  /**
   * Pause playback. Updates `paused` immediately.
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/pause
   */
  pause(): void;
}

export interface MediaVolumeState {
  /**
   * Volume level from 0 (silent) to 1 (max).
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/volume
   */
  volume: number;
  /**
   * Whether audio is muted.
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/muted
   */
  muted: boolean;
  /**
   * Whether volume can be programmatically set on this platform.
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/volume
   */
  volumeAvailability: MediaFeatureAvailability;
  /**
   * Whether the media can be muted. Separate from `volumeAvailability` because the two come apart: an embed can take a
   * mute command while offering no way to set a level, and iOS Safari refuses a volume write on media that mutes
   * perfectly well.
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/muted
   */
  mutedAvailability: MediaFeatureAvailability;
  /**
   * Set volume (clamped 0-1). Returns the clamped value.
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/volume
   */
  setVolume(volume: number): number;
  /**
   * Set the muted state, updating the store immediately. Unmuting at volume 0 restores volume to 0.25. Returns the new
   * muted value.
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/muted
   */
  setMuted(muted: boolean): boolean;
}

export interface MediaTimeState {
  /**
   * Current playback position in seconds.
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/currentTime
   */
  currentTime: number;
  /**
   * Total duration in seconds (0 if unknown).
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/duration
   */
  duration: number;
  /**
   * Whether a seek operation is in progress.
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/seeking
   */
  seeking: boolean;
  /**
   * Seek to a time in seconds. Returns the actual position after seek.
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/currentTime
   */
  seek(time: number): Promise<number>;
}

export interface MediaSourceState {
  /**
   * Current media source URL (empty string if none).
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/currentSrc
   */
  currentSrc: string;
  /**
   * Whether enough data is loaded to begin playback.
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/readyState
   */
  canPlay: boolean;
}

export interface MediaStreamTypeState {
  /**
   * Current stream delivery type.
   *
   * Components use this to show live-specific UI (for example, a live indicator or a "jump to live edge" button) or
   * hide the time display.
   *
   * @see {@link MediaStreamTypes} for the canonical string values.
   * @see https://github.com/video-dev/media-ui-extensions/blob/main/proposals/0010-stream-type.md
   */
  streamType: MediaStreamType;
}

/** Resolved content metadata exposed by the player store. */
export interface MediaMetadataState {
  /** The resolved content title. Set it through the player, not through the store. */
  title: string;
  /**
   * The resolved poster URL, independent of the media element's own `poster`. Set it through the player, not through
   * the store.
   */
  poster: string;
}

export interface MediaLiveState {
  /**
   * Playback time where the live edge begins.
   *
   * Playback is live when `currentTime >= liveEdgeStart`. `NaN` when the stream is not live or the value is unknown.
   *
   * @see https://github.com/video-dev/media-ui-extensions/blob/main/proposals/0007-live-edge.md
   */
  liveEdgeStart: number;
  /**
   * Describes the kind of live window available. This value is not a duration.
   *
   * `0` for a sliding live window, `Infinity` for a live event with playback history, and `NaN` for on-demand or
   * unknown.
   */
  targetLiveWindow: number;
}

export interface MediaBufferState {
  /**
   * Buffered time ranges as [start, end] tuples.
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/buffered
   */
  buffered: [number, number][];
  /**
   * Seekable time ranges as [start, end] tuples.
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/seekable
   */
  seekable: [number, number][];
}

export interface MediaFullscreenState {
  /**
   * Whether fullscreen mode is currently active.
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/API/Fullscreen_API
   */
  isFullscreen: boolean;
  /**
   * Whether fullscreen can be requested on this platform.
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/API/Document/fullscreenEnabled
   */
  fullscreenAvailability: MediaFeatureAvailability;
  /**
   * Enter fullscreen mode. Tries container first, falls back to media element.
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/API/Element/requestFullscreen
   */
  requestFullscreen(): Promise<void>;
  /**
   * Exit fullscreen mode.
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/API/Document/exitFullscreen
   */
  exitFullscreen(): Promise<void>;
}

export interface MediaControlsState {
  /** Whether the user has recently interacted with the player. */
  userActive: boolean;
  /** Whether controls should be visible. */
  controlsVisible: boolean;
  /**
   * Keep controls visible during a sustained interaction.
   *
   * The returned function releases the lock. Multiple concurrent locks are supported and each release function is
   * idempotent.
   */
  requestControlsLock(): () => void;
  /** Toggle controls visibility, or force it with `forceShow`. Returns the new `controlsVisible` value. */
  toggleControls(forceShow?: boolean): boolean;
}

export interface MediaPlaybackRateState {
  /**
   * Available playback rates.
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/playbackRate
   */
  readonly playbackRates: readonly number[];
  /**
   * Current playback rate.
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/playbackRate
   */
  playbackRate: number;
  /**
   * Set the playback rate.
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/playbackRate
   */
  setPlaybackRate(rate: number): void;
}

export interface MediaVideoRendition {
  /** Rendition id, used by `selectVideoRendition`. */
  id: string;
  width?: number;
  height?: number;
  bitrate?: number;
  frameRate?: number;
  codec?: string;
  selected: boolean;
}

export interface MediaQualityState {
  /** Video renditions available for manual quality selection. */
  videoRenditionList: MediaVideoRendition[];
  /** Video rendition currently playing, including when automatic ABR is selected. */
  activeVideoRendition: MediaVideoRendition | null;
  /** Select a video rendition by `id`, or automatic ABR with `"auto"`. */
  selectVideoRendition(id: string): void;
}

export interface MediaAudioTrack {
  /** Track id, used by `selectAudioTrack`. */
  id: string;
  kind?: string;
  label: string;
  language: string;
  enabled: boolean;
}

export interface MediaAudioTrackState {
  /** Audio tracks available for manual track selection. */
  audioTrackList: MediaAudioTrack[];
  /** Select an audio track by `id`. */
  selectAudioTrack(id: string): void;
}

/**
 * A text cue.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/VTTCue
 */
export interface MediaTextCue {
  startTime: number;
  endTime: number;
  text: string;
}

/**
 * The mode of a text track.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/TextTrack/mode
 */
export type TextTrackMode = 'showing' | 'disabled' | 'hidden';

/**
 * A text track.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/TextTrack
 */
export interface MediaTextTrack<Kind extends string = TextTrackKind> {
  /** Track id, used by `selectSubtitlesTrack`. */
  id: string;
  kind: Kind;
  label: string;
  language: string;
  mode: TextTrackMode;
}

export interface MediaTextTrackState {
  /** Cues from the first `kind="chapters"` track. */
  chaptersCues: MediaTextCue[];
  /** Cues from the first `kind="metadata" label="thumbnails"` track. */
  thumbnailCues: MediaTextCue[];
  /** The `<track>` element's `src` for resolving relative cue text URLs. */
  thumbnailTrackSrc: string | null;
  /**
   * The media element's CORS mode, mapped through the CORS-settings-attribute rules, or `null` when it is not in CORS
   * mode. Thumbnail UI fetches the sprite sheets the cues point at with this mode, since a cross-origin `<track>` only
   * loads at all when the media element is CORS-enabled.
   */
  thumbnailTrackCrossOrigin: 'anonymous' | 'use-credentials' | null;
  /** All text tracks available on the media element. */
  textTrackList: MediaTextTrack[];
  /** Whether captions/subtitles are currently enabled. */
  subtitlesShowing: boolean;
  /**
   * Toggle captions/subtitles visibility. Showing restores the track that was last showing, or the first
   * caption/subtitle track when there is none. Returns the new enabled value.
   */
  toggleSubtitles(forceShow?: boolean): boolean;
  /** Select a captions/subtitles track by `id`, or disable with `"off"`. */
  selectSubtitlesTrack(id: string): void;
}

export interface MediaErrorState {
  /**
   * The current media error, or null if none.
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/error
   */
  error: ErrorLike | null;
  /** Dismiss the current error by clearing it. */
  dismissError(): void;
}

export type RemotePlaybackConnectionState = 'disconnected' | 'connecting' | 'connected';

export interface MediaRemotePlaybackState {
  /**
   * Current remote playback connection state.
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/API/RemotePlayback/state
   */
  remotePlaybackState: RemotePlaybackConnectionState;
  /**
   * Whether remote playback can be requested on this platform.
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/API/RemotePlayback
   */
  remotePlaybackAvailability: MediaFeatureAvailability;
  /**
   * Prompt the user to pick a remote playback device. Exits fullscreen first when connecting.
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/API/RemotePlayback/prompt
   */
  promptRemotePlayback(): Promise<void>;
}

export interface MediaPictureInPictureState {
  /**
   * Whether picture-in-picture mode is currently active.
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/API/Picture-in-Picture_API
   */
  isPictureInPicture: boolean;
  /**
   * Whether picture-in-picture can be requested on this platform.
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/API/Document/pictureInPictureEnabled
   */
  pictureInPictureAvailability: MediaFeatureAvailability;
  /**
   * Enter picture-in-picture mode, exiting fullscreen first. Rejects before metadata is loaded.
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/API/HTMLVideoElement/requestPictureInPicture
   */
  requestPictureInPicture(): Promise<void>;
  /**
   * Exit picture-in-picture mode.
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/API/Document/exitPictureInPicture
   */
  exitPictureInPicture(): Promise<void>;
}
