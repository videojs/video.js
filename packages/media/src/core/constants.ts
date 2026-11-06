import type { TimeRangeLike } from './types';

/**
 * A frozen, empty `TimeRanges`-like value for hosts that report ranges but have none yet, such as an embed before it
 * loads. A host that never reports ranges returns `undefined` instead.
 *
 * @internal
 */
export const NO_TIME_RANGES_YET: TimeRangeLike = Object.freeze({
  length: 0,
  start: () => 0,
  end: () => 0,
});
