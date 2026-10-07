import { isFunction, isObject, isUndefined } from '@videojs/utils/predicate';

import { EMPTY_REMOTE, EMPTY_TEXT_TRACKS, EMPTY_TIME_RANGES } from './constants';
import type { MediaBufferState, MediaPlaybackState, MediaTimeState } from './state';
import { MediaReadyState } from './types';
import type {
  EngineAdapter,
  MediaAudioTrackCapability,
  MediaBufferCapability,
  MediaContentDataCapability,
  MediaErrorCapability,
  MediaLiveCapability,
  MediaPauseCapability,
  MediaPictureInPictureCapability,
  MediaPlaybackRateCapability,
  MediaRemotePlaybackCapability,
  MediaSeekCapability,
  MediaSourceCapability,
  MediaStreamTypeCapability,
  MediaTextTrackCapability,
  MediaVideoDimensionsCapability,
  MediaVideoRenditionCapability,
  MediaVolumeCapability,
} from './types';

export function hasMetadata(media: Pick<MediaSourceCapability, 'readyState'>): boolean {
  return media.readyState >= MediaReadyState.HAVE_METADATA;
}

/** @internal */
export type MediaTimeRangeState = Pick<MediaTimeState, 'duration'> & Pick<MediaBufferState, 'seekable'>;

/** @internal */
export function getTimeRangeEnd(media: MediaTimeRangeState): number {
  if (Number.isFinite(media.duration) && media.duration > 0) return media.duration;

  const end = media.seekable.at(-1)?.[1];
  if (end === undefined || !Number.isFinite(end) || end <= 0) return 0;

  return end;
}

/** @internal */
export function hasTimeRange(media: MediaTimeRangeState): boolean {
  return getTimeRangeEnd(media) > 0;
}

/**
 * Whether playback is running without waiting for data.
 *
 * @internal
 */
export function isMediaPlaying(
  media: Pick<MediaPlaybackState, 'paused' | 'ended' | 'waiting'> | null | undefined
): boolean {
  return !!media && !media.paused && !media.ended && !media.waiting;
}

export function isMediaPauseCapable(value: unknown): value is MediaPauseCapability {
  if (!isObject(value)) return false;

  const media = value as Record<string, unknown>;

  return !isUndefined(media.paused) && !isUndefined(media.ended) && isFunction(media.pause);
}

export function isMediaSeekCapable(value: unknown): value is MediaSeekCapability {
  if (!isObject(value)) return false;

  const media = value as Record<string, unknown>;

  return !isUndefined(media.currentTime) && !isUndefined(media.duration) && !isUndefined(media.seeking);
}

export function isMediaSourceCapable(value: unknown): value is MediaSourceCapability {
  if (!isObject(value)) return false;

  const media = value as Record<string, unknown>;

  return (
    !isUndefined(media.src) &&
    !isUndefined(media.currentSrc) &&
    !isUndefined(media.readyState) &&
    isFunction(media.load)
  );
}

export function isMediaVolumeCapable(value: unknown): value is MediaVolumeCapability {
  if (!isObject(value)) return false;

  const media = value as Record<string, unknown>;

  return !isUndefined(media.volume) && !isUndefined(media.muted);
}

/**
 * Whether the media reports a mute at all, which is a narrower question than `isMediaVolumeCapable`: an embed can take
 * a mute command while offering no way to set a level.
 *
 * @internal
 */
export function isMediaMutedCapable(value: unknown): value is Pick<MediaVolumeCapability, 'muted'> {
  if (!isObject(value)) return false;

  const media = value as Record<string, unknown>;

  return !isUndefined(media.muted);
}

export function isMediaPlaybackRateCapable(value: unknown): value is MediaPlaybackRateCapability {
  if (!isObject(value)) return false;

  const media = value as Record<string, unknown>;

  return !isUndefined(media.playbackRate);
}

/**
 * Only `requestPictureInPicture` is required. A native video element carries it but leaves exiting to `document`, so
 * demanding the pair would rule out the one media that most certainly can.
 *
 * @internal
 */
export function isMediaPictureInPictureCapable(value: unknown): value is MediaPictureInPictureCapability {
  if (!isObject(value)) return false;

  const media = value as Record<string, unknown>;

  return isFunction(media.requestPictureInPicture);
}

export function isMediaBufferCapable(value: unknown): value is MediaBufferCapability {
  if (!isObject(value)) return false;

  const media = value as Record<string, unknown>;

  return (
    !isUndefined(media.buffered) &&
    media.buffered !== EMPTY_TIME_RANGES &&
    !isUndefined(media.seekable) &&
    media.seekable !== EMPTY_TIME_RANGES
  );
}

export function isMediaErrorCapable(value: unknown): value is MediaErrorCapability {
  if (!isObject(value)) return false;

  const media = value as Record<string, unknown>;

  return !isUndefined(media.error);
}

export function isMediaTextTrackCapable(value: unknown): value is MediaTextTrackCapability {
  if (!isObject(value)) return false;

  const media = value as Record<string, unknown>;

  return !isUndefined(media.textTracks) && media.textTracks !== EMPTY_TEXT_TRACKS;
}

export function isMediaVideoRenditionCapable(value: unknown): value is MediaVideoRenditionCapability {
  if (!isObject(value)) return false;

  const media = value as Record<string, unknown>;

  return !isUndefined(media.videoRenditions);
}

export function isMediaAudioTrackCapable(value: unknown): value is MediaAudioTrackCapability {
  if (!isObject(value)) return false;

  const media = value as Record<string, unknown>;

  return !isUndefined(media.audioTracks);
}

export function isMediaVideoDimensionsCapable(value: unknown): value is MediaVideoDimensionsCapability {
  if (!isObject(value)) return false;

  const media = value as Record<string, unknown>;

  return !isUndefined(media.videoWidth) && !isUndefined(media.videoHeight);
}

export function isMediaRemotePlaybackCapable(value: unknown): value is MediaRemotePlaybackCapability {
  if (!isObject(value)) return false;

  const media = value as Record<string, unknown>;

  return isObject(media.remote) && media.remote !== EMPTY_REMOTE;
}

export function isMediaStreamTypeCapable(value: unknown): value is MediaStreamTypeCapability {
  if (!isObject(value)) return false;

  const media = value as Record<string, unknown>;

  return !isUndefined(media.streamType);
}

/** @internal */
export function isMediaContentDataCapable(value: unknown): value is MediaContentDataCapability {
  if (!isObject(value)) return false;

  return !isUndefined((value as Record<string, unknown>).contentData);
}

export function isMediaLiveCapable(value: unknown): value is MediaLiveCapability {
  if (!isObject(value)) return false;

  const media = value as Record<string, unknown>;

  return !isUndefined(media.liveEdgeStart) && !isUndefined(media.targetLiveWindow);
}

/**
 * Framework-agnostic `NodeList`-like shape returned by `querySelectorAll`.
 *
 * @internal
 */
export interface NodeListLike<Element> {
  readonly length: number;
  readonly [index: number]: Element;
  item(index: number): Element | null;
  [Symbol.iterator](): Iterator<Element>;
}

/** @internal */
export function isQuerySelectorAllCapable<Element = unknown>(
  value: unknown
): value is { querySelectorAll: (selectors: string) => NodeListLike<Element> } {
  return (
    isObject(value) && 'querySelectorAll' in value && isFunction((value as Record<string, unknown>).querySelectorAll)
  );
}

/**
 * Whether `value` is an adapter fronting a JS playback engine (an hls.js instance, a dash.js player, an SPF
 * composition). Narrows to the caller's type so an adapter keeps its own members alongside `engine`.
 *
 * @internal
 */
export function isEngineAdapter<T>(value: T): value is T & EngineAdapter {
  if (!isObject(value)) return false;

  const adapter = value as Record<string, unknown>;

  return 'engine' in adapter && isFunction(adapter.destroy);
}
