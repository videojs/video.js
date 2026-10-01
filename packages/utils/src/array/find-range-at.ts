import { findLastIndexAtOrBefore } from './find-last-at-or-before';

/**
 * Finds the ordered range containing the target value.
 *
 * @internal
 */
export function findRangeAt<Range>(
  ranges: readonly Range[],
  value: number,
  getStart: (range: Range) => number,
  getEnd: (range: Range) => number
): Range | undefined {
  const index = findLastIndexAtOrBefore(ranges, value, getStart);
  if (index < 0) return undefined;

  const range = ranges[index]!;
  const end = getEnd(range);
  const last = index === ranges.length - 1;

  return value < end || (last && value === end) ? range : undefined;
}
