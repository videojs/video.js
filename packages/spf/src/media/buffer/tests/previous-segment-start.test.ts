import { describe, expect, it } from 'vite-plus/test';

import type { Segment } from '../../types';
import { previousSegmentStartIfMediaStartsLate } from '../previous-segment-start';

function segment(index: number, duration = 4): Segment {
  return { id: `segment-${index}`, url: `segment-${index}.ts`, startTime: index * duration, duration };
}

const segments = [segment(0), segment(1), segment(2), segment(3)];

describe('previousSegmentStartIfMediaStartsLate', () => {
  it.each<{ name: string; ranges: { start: number; end: number }[]; time: number; expected: number | undefined }>([
    {
      name: "the previous segment's start when the playhead segment starts late",
      ranges: [{ start: 8.03, end: 12 }],
      time: 8,
      expected: 4,
    },
    { name: 'nothing when the playhead is buffered', ranges: [{ start: 4, end: 12 }], time: 8, expected: undefined },
    {
      name: 'nothing when nothing is buffered near it',
      ranges: [{ start: 12.03, end: 16 }],
      time: 8,
      expected: undefined,
    },
    { name: 'nothing in the first segment', ranges: [{ start: 0.063, end: 4 }], time: 0, expected: undefined },
    { name: 'nothing past the last segment', ranges: [], time: 20, expected: undefined },
  ])('finds $name', ({ ranges, time, expected }) => {
    expect(previousSegmentStartIfMediaStartsLate(segments, ranges, time)).toBe(expected);
  });
});
