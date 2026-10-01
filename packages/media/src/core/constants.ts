import type { RemotePlaybackLike, TextTrackListLike, TimeRangeLike } from './types';

/**
 * A frozen, empty `TimeRanges`-like value for hosts with no ranges.
 *
 * @internal
 */
export const EMPTY_TIME_RANGES: TimeRangeLike = Object.freeze({
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
