import { describe, expect, it } from 'vite-plus/test';

import type { Segment } from '../../types';
import {
  calculateForwardFlushPoint,
  DEFAULT_FORWARD_BUFFER_CONFIG,
  getSegmentsToLoad,
  isTimeRangeCovered,
  mergeTimeRanges,
} from '../forward-buffer';

// Helper to create test segments
const createSegment = (startTime: number, duration: number): Segment => ({
  id: `seg-${startTime}`,
  url: `https://example.com/seg-${startTime}.m4s`,
  startTime,
  duration,
});

describe('mergeTimeRanges', () => {
  it('merges contiguous ranges into one', () => {
    expect(
      mergeTimeRanges([
        { start: 0, end: 7.13333 },
        { start: 7.13333, end: 15.13333 },
      ])
    ).toEqual([{ start: 0, end: 15.13333 }]);
  });

  it('merges overlapping ranges, taking the max end', () => {
    // A misaligned switch leaves overlapping model entries (low 7.13..15.13, high 7.98..15.98).
    expect(
      mergeTimeRanges([
        { start: 0, end: 7.13333 },
        { start: 7.13333, end: 15.13333 },
        { start: 7.98333, end: 15.98333 },
      ])
    ).toEqual([{ start: 0, end: 15.98333 }]);
  });

  it('keeps genuinely disjoint ranges separate (post-seek gap)', () => {
    expect(
      mergeTimeRanges([
        { start: 0, end: 10 },
        { start: 30, end: 40 },
      ])
    ).toEqual([
      { start: 0, end: 10 },
      { start: 30, end: 40 },
    ]);
  });

  it('drops empty/inverted ranges and sorts', () => {
    expect(
      mergeTimeRanges([
        { start: 20, end: 30 },
        { start: 5, end: 5 },
        { start: 50, end: 40 },
        { start: 0, end: 10 },
      ])
    ).toEqual([
      { start: 0, end: 10 },
      { start: 20, end: 30 },
    ]);
  });
});

describe('isTimeRangeCovered', () => {
  const merged = [{ start: 0, end: 15.13333 }];

  it('true when fully contained', () => {
    expect(isTimeRangeCovered(0, 7.98333, merged)).toBe(true);
  });

  it('false when the tail extends past coverage (straddling segment)', () => {
    // high segment-1 (7.98333..15.98333) against a buffer ending at 15.13333.
    expect(isTimeRangeCovered(7.98333, 15.98333, merged)).toBe(false);
  });

  it('false when starting past coverage', () => {
    expect(isTimeRangeCovered(15.98333, 23.98333, merged)).toBe(false);
  });

  it('tolerates sub-epsilon overhang at the edges', () => {
    expect(isTimeRangeCovered(-0.00005, 15.13338, merged)).toBe(true);
  });

  it('requires a single range to contain it (not spanning a gap)', () => {
    expect(
      isTimeRangeCovered(5, 35, [
        { start: 0, end: 10 },
        { start: 30, end: 40 },
      ])
    ).toBe(false);
  });
});

describe('calculateForwardFlushPoint', () => {
  it('returns Infinity when no segments are buffered', () => {
    expect(calculateForwardFlushPoint([], 0)).toBe(Infinity);
  });

  it('returns Infinity when all buffered segments are within the buffer window', () => {
    // currentTime=0, bufferDuration=30 → threshold=30. Segments at 0,6,12,18,24 are all < 30.
    const segments = [
      createSegment(0, 6),
      createSegment(6, 6),
      createSegment(12, 6),
      createSegment(18, 6),
      createSegment(24, 6),
    ];

    expect(calculateForwardFlushPoint(segments, 0)).toBe(Infinity);
  });

  it('returns the startTime of the first segment beyond the buffer window', () => {
    // currentTime=0, bufferDuration=30 → threshold=30.
    // Segments at 30 and 36 are at/beyond threshold — flush from 30.
    const segments = [createSegment(0, 6), createSegment(6, 6), createSegment(30, 6), createSegment(36, 6)];

    expect(calculateForwardFlushPoint(segments, 0)).toBe(30);
  });

  it('moves flush point as currentTime advances', () => {
    // After playing to 10s: threshold = 10 + 30 = 40. Segment at 36 is < 40, stays.
    // Segment at 42 is >= 40, flush from 42.
    const segments = [createSegment(0, 6), createSegment(36, 6), createSegment(42, 6)];

    expect(calculateForwardFlushPoint(segments, 10)).toBe(42);
  });

  it('respects custom bufferDuration', () => {
    const config = { ...DEFAULT_FORWARD_BUFFER_CONFIG, bufferDuration: 12 };
    // threshold = 0 + 12 = 12. Segments at 12 and beyond should be flushed.
    const segments = [createSegment(0, 6), createSegment(6, 6), createSegment(12, 6)];

    expect(calculateForwardFlushPoint(segments, 0, config)).toBe(12);
  });

  it('returns the earliest beyond-threshold segment when multiple exist', () => {
    const segments = [createSegment(30, 6), createSegment(60, 6), createSegment(90, 6)];

    // All are at/beyond threshold=30. Return the earliest (30).
    expect(calculateForwardFlushPoint(segments, 0)).toBe(30);
  });
});

describe('getSegmentsToLoad', () => {
  describe('basic forward buffer loading', () => {
    it('should load segments ahead of current time', () => {
      const segments = [
        createSegment(0, 6),
        createSegment(6, 6),
        createSegment(12, 6),
        createSegment(18, 6),
        createSegment(24, 6),
        createSegment(30, 6),
      ] as const;

      const bufferedSegments = [
        segments[0], // 0-6s buffered
        segments[1], // 6-12s buffered
      ] as const;

      const currentTime = 6; // Playing at 6s

      // With default 30s buffer, should load from 12s to 36s
      const toLoad = getSegmentsToLoad(segments, bufferedSegments, currentTime);

      expect(toLoad).toHaveLength(4); // Segments: 12, 18, 24, 30
      expect(toLoad[0]?.id).toBe('seg-12');
      expect(toLoad[3]?.id).toBe('seg-30');
    });

    it('should return empty array when buffer is sufficient', () => {
      const segments: Segment[] = [
        createSegment(0, 6),
        createSegment(6, 6),
        createSegment(12, 6),
        createSegment(18, 6),
      ];

      const bufferedSegments: Segment[] = segments; // All buffered

      const currentTime = 6;

      const toLoad = getSegmentsToLoad(segments, bufferedSegments, currentTime);

      expect(toLoad).toHaveLength(0);
    });

    it('should use custom buffer duration', () => {
      const segments: Segment[] = [
        createSegment(0, 6),
        createSegment(6, 6),
        createSegment(12, 6),
        createSegment(18, 6),
        createSegment(24, 6),
      ];

      const bufferedSegments: Segment[] = [];

      const currentTime = 0;
      const config = {
        ...DEFAULT_FORWARD_BUFFER_CONFIG,
        bufferDuration: 12, // Only 12s ahead instead of 30s
      };

      const toLoad = getSegmentsToLoad(segments, bufferedSegments, currentTime, config);

      expect(toLoad).toHaveLength(2); // Only load to 12s (segments 0-6, 6-12)
      expect(toLoad[0]?.id).toBe('seg-0');
      expect(toLoad[1]?.id).toBe('seg-6');
    });
  });

  describe('buffered segment filtering', () => {
    it('should skip already buffered segments', () => {
      const segments = [
        createSegment(0, 6),
        createSegment(6, 6),
        createSegment(12, 6),
        createSegment(18, 6),
        createSegment(24, 6),
      ] as const;

      // Segments 0, 6, 18 are buffered (sparse)
      const bufferedSegments: Segment[] = [segments[0], segments[1], segments[3]];

      const currentTime = 0;
      const config = {
        ...DEFAULT_FORWARD_BUFFER_CONFIG,
        bufferDuration: 24,
      };

      const toLoad = getSegmentsToLoad(segments, bufferedSegments, currentTime, config);

      // Should only load segment 12 to fill gap (18 is buffered, 24 is beyond target)
      expect(toLoad).toHaveLength(1);
      expect(toLoad[0]?.id).toBe('seg-12');
    });

    it('should handle no segments buffered', () => {
      const segments: Segment[] = [createSegment(0, 6), createSegment(6, 6), createSegment(12, 6)];

      const bufferedSegments: Segment[] = [];

      const currentTime = 0;
      const config = {
        ...DEFAULT_FORWARD_BUFFER_CONFIG,
        bufferDuration: 18,
      };

      const toLoad = getSegmentsToLoad(segments, bufferedSegments, currentTime, config);

      expect(toLoad).toHaveLength(3); // Load all 3 segments
    });
  });

  describe('edge cases', () => {
    it('should handle empty segment list', () => {
      const toLoad = getSegmentsToLoad([], [], 0);

      expect(toLoad).toHaveLength(0);
    });

    it('should handle currentTime before first segment', () => {
      const segments: Segment[] = [createSegment(10, 6), createSegment(16, 6)];

      const bufferedSegments: Segment[] = [];
      const currentTime = 0;

      const toLoad = getSegmentsToLoad(segments, bufferedSegments, currentTime);

      expect(toLoad).toHaveLength(2); // Load both segments within 30s
    });

    it('past all segments, does not reload interior segments the playhead has passed', () => {
      // A playhead past every segment is unreachable in practice (clamped to the
      // presentation's range), but the rule stays well-defined: interior segments
      // behind the playhead are NOT reloaded. The terminal segment has no
      // successor, so it stays selectable — see the exact-end / overshoot cases.
      const segments: Segment[] = [createSegment(0, 6), createSegment(6, 6)];
      const toLoad = getSegmentsToLoad(segments, [], 100);

      expect(toLoad.map((s) => s.id)).toEqual(['seg-6']); // only the terminal segment
    });

    it('should not load segments beyond target', () => {
      const segments: Segment[] = [
        createSegment(0, 6),
        createSegment(6, 6),
        createSegment(12, 6),
        createSegment(18, 6),
        createSegment(24, 6),
        createSegment(30, 6),
        createSegment(36, 6),
        createSegment(42, 6),
      ];

      const bufferedSegments: Segment[] = [];
      const currentTime = 0;
      const config = {
        ...DEFAULT_FORWARD_BUFFER_CONFIG,
        bufferDuration: 18,
      };

      const toLoad = getSegmentsToLoad(segments, bufferedSegments, currentTime, config);

      // Should only load up to 18s (segments 0, 6, 12)
      expect(toLoad).toHaveLength(3);
      expect(toLoad[toLoad.length - 1]?.startTime).toBeLessThan(18);
    });
  });

  describe('variable segment durations', () => {
    it('should handle different segment lengths', () => {
      const segments: Segment[] = [
        createSegment(0, 10),
        createSegment(10, 5),
        createSegment(15, 8),
        createSegment(23, 12),
      ];

      const bufferedSegments: Segment[] = [];
      const currentTime = 0;
      const config = {
        ...DEFAULT_FORWARD_BUFFER_CONFIG,
        bufferDuration: 20,
      };

      const toLoad = getSegmentsToLoad(segments, bufferedSegments, currentTime, config);

      // Load segments covering 0-20s (segments 0, 10, 15)
      expect(toLoad).toHaveLength(3);
    });
  });

  describe('discontiguous buffering (seek scenarios)', () => {
    it('should fill gaps and extend buffer after seek', () => {
      const segments = [
        createSegment(0, 6),
        createSegment(6, 6),
        createSegment(12, 6),
        createSegment(18, 6),
        createSegment(24, 6),
        createSegment(30, 6),
      ] as const;

      // After seek: have [0-12) and [18-30), missing [12-18)
      const bufferedSegments: Segment[] = [
        segments[0], // 0-6
        segments[1], // 6-12
        segments[3], // 18-24
        segments[4], // 24-30
      ];

      const currentTime = 7; // Playing at 7s
      const config = {
        ...DEFAULT_FORWARD_BUFFER_CONFIG,
        bufferDuration: 24, // Buffer to 7+24=31s
      };

      const toLoad = getSegmentsToLoad(segments, bufferedSegments, currentTime, config);

      // Should load seg-12 (fills gap) and seg-30 (extends to 31s)
      expect(toLoad).toHaveLength(2);
      expect(toLoad[0]?.id).toBe('seg-12');
      expect(toLoad[1]?.id).toBe('seg-30');
    });
  });

  describe('playback position', () => {
    it('should load ahead from current position', () => {
      const segments = [
        createSegment(0, 6),
        createSegment(6, 6),
        createSegment(12, 6),
        createSegment(18, 6),
        createSegment(24, 6),
        createSegment(30, 6),
      ] as const;

      // Currently buffered: 0-18s
      const bufferedSegments: Segment[] = [segments[0], segments[1], segments[2]];

      const currentTime = 12; // Playing at 12s
      const config = {
        ...DEFAULT_FORWARD_BUFFER_CONFIG,
        bufferDuration: 30,
      };

      // Should load from 18s to 42s (12 + 30)
      const toLoad = getSegmentsToLoad(segments, bufferedSegments, currentTime, config);

      expect(toLoad).toHaveLength(3); // Segments 18, 24, 30
      expect(toLoad[0]?.id).toBe('seg-18');
    });
  });

  describe('exact-end boundary (#1828)', () => {
    it('loads the final segment when currentTime is exactly the total duration', () => {
      // Regression for #1828: seeking to currentTime === duration must still
      // select the last segment. A strict `endTime > currentTime` overlap test
      // drops the final segment (whose endTime === duration), so it never loads
      // and endOfStream() never fires → the seek stalls forever.
      const segments = [createSegment(0, 6), createSegment(6, 6), createSegment(12, 6)] as const;
      // Playhead dragged to the exact end (duration = 18), nothing buffered there.
      const toLoad = getSegmentsToLoad(segments, [], 18);

      expect(toLoad.map((s) => s.id)).toEqual(['seg-12']);
    });

    it('loads the final segment when currentTime slightly exceeds its model end', () => {
      // Post-loop re-seek variant of #1828. After the first end, endOfStream()
      // clamps MediaSource.duration to the true buffered end, which can run a
      // hair past the model's EXTINF-derived last-segment end. A later seek to
      // that grown duration lands just past the last segment's endTime — its
      // real media still covers the position, so it must still be selected, or
      // the loader goes idle and the seek stalls.
      const segments = [createSegment(0, 6), createSegment(6, 6), createSegment(12, 6)] as const;
      // Model end = 18; duration grew to 18.03, seek lands past seg-12's endTime.
      const toLoad = getSegmentsToLoad(segments, [], 18.03);

      expect(toLoad.map((s) => s.id)).toEqual(['seg-12']);
    });

    it('does not re-select a finished segment at a mid-stream boundary', () => {
      // Guard: the fix is scoped to the final segment. At an interior boundary
      // (currentTime === a non-last segment's endTime) the just-finished segment
      // must NOT be reloaded — only the segments the playhead is entering.
      const segments = [createSegment(0, 6), createSegment(6, 6), createSegment(12, 6)] as const;
      const toLoad = getSegmentsToLoad(segments, [], 6);

      expect(toLoad.map((s) => s.id)).toEqual(['seg-6', 'seg-12']);
    });
  });
});
