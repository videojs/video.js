/**
 * Converts a TimeRanges object to an array of [start, end] tuples.
 *
 * @internal
 */
export function serializeTimeRanges(ranges: TimeRanges): Array<[number, number]> {
  const result: Array<[number, number]> = [];

  for (let i = 0; i < ranges.length; i++) {
    result.push([ranges.start(i), ranges.end(i)]);
  }

  return result;
}
