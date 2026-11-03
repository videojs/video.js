import type { RemotePlaybackLike, TextTrackListLike, TimeRangeLike } from './types';

/**
 * A frozen, empty `TimeRanges`-like placeholder for hosts that never report ranges. `isMediaBufferCapable` rejects it,
 * so the player stops listening for ranges for good. A host that has no ranges yet returns `NO_TIME_RANGES_YET`.
 *
 * @internal
 */
export const EMPTY_TIME_RANGES: TimeRangeLike = Object.freeze({
  length: 0,
  start: () => 0,
  end: () => 0,
});

/**
 * A frozen, empty `TimeRanges`-like value for hosts that report ranges but have none yet, such as an embed before it
 * loads. Unlike `EMPTY_TIME_RANGES`, `isMediaBufferCapable` accepts it.
 *
 * @internal
 */
export const NO_TIME_RANGES_YET: TimeRangeLike = Object.freeze({
  length: 0,
  start: () => 0,
  end: () => 0,
});

/**
 * A frozen, empty `TextTrackList`-like value for hosts with no text tracks.
 *
 * @internal
 */
export const EMPTY_TEXT_TRACKS: TextTrackListLike = Object.assign(new EventTarget(), {
  length: 0,
  *[Symbol.iterator]() {},
  getTrackById: () => null,
}) as unknown as TextTrackListLike;

/** @internal */
export const EMPTY_REMOTE = new EventTarget() as unknown as RemotePlaybackLike;
