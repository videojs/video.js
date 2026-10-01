import type { TimeRangeLike } from '../../core/types';

/**
 * A `TimeRanges`-shaped object holding a single range. Embed hosts only ever know one contiguous buffered or seekable
 * span, so they report it through this rather than constructing a real `TimeRanges`, which has no public constructor.
 *
 * @internal
 */
export function createTimeRange(start: number, end: number): TimeRangeLike {
  return { length: 1, start: () => start, end: () => end };
}
