import { describe, expect, it } from 'vite-plus/test';

import { serializeTimeRanges, type TimeRangesLike } from '../ranges';

describe('serializeTimeRanges', () => {
  it('returns empty array for empty ranges', () => {
    const ranges = createTimeRanges([]);

    expect(serializeTimeRanges(ranges)).toEqual([]);
  });

  it('serializes single range', () => {
    const ranges = createTimeRanges([[0, 10]]);

    expect(serializeTimeRanges(ranges)).toEqual([[0, 10]]);
  });

  it('serializes multiple ranges', () => {
    const ranges = createTimeRanges([
      [0, 5],
      [10, 20],
      [30, 45],
    ]);

    expect(serializeTimeRanges(ranges)).toEqual([
      [0, 5],
      [10, 20],
      [30, 45],
    ]);
  });
});

function createTimeRanges(ranges: Array<[number, number]>): TimeRangesLike {
  return {
    length: ranges.length,
    start(index: number): number {
      const range = ranges[index];
      if (index < 0 || index >= ranges.length || !range) throw new RangeError('Index out of range');

      return range[0];
    },
    end(index: number): number {
      const range = ranges[index];
      if (index < 0 || index >= ranges.length || !range) throw new RangeError('Index out of range');

      return range[1];
    },
  };
}
