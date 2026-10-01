import { describe, expect, it } from 'vite-plus/test';

import type { Segment } from '../../types';
import { calculateBackBufferFlushPoint, DEFAULT_BACK_BUFFER_CONFIG } from '../back-buffer';

// Helper to create test segments
const createSegment = (startTime: number, duration: number): Segment => ({
  id: `seg-${startTime}`,
  url: `https://example.com/seg-${startTime}.m4s`,
  startTime,
  duration,
});

describe('calculateBackBufferFlushPoint', () => {
  describe('basic flush point calculation', () => {
    it('should keep N segments behind current time', () => {
      const segments: Segment[] = [
        createSegment(0, 6),
        createSegment(6, 6),
        createSegment(12, 6),
        createSegment(18, 6),
        createSegment(24, 6),
      ];

      const currentTime = 24;

      const flushEnd = calculateBackBufferFlushPoint(segments, currentTime);

      expect(flushEnd).toBe(12);
    });

    it('should return 0 when fewer segments than threshold', () => {
      const segments: Segment[] = [createSegment(0, 6), createSegment(6, 6)];

      const currentTime = 12;

      const flushEnd = calculateBackBufferFlushPoint(segments, currentTime);

      expect(flushEnd).toBe(0);
    });

    it('should handle custom keep count', () => {
      const segments: Segment[] = [
        createSegment(0, 6),
        createSegment(6, 6),
        createSegment(12, 6),
        createSegment(18, 6),
        createSegment(24, 6),
      ];

      const currentTime = 24;
      const config = {
        ...DEFAULT_BACK_BUFFER_CONFIG,
        keepSegments: 3,
      };

      const flushEnd = calculateBackBufferFlushPoint(segments, currentTime, config);

      expect(flushEnd).toBe(6);
    });
  });

  describe('edge cases', () => {
    it('should return 0 for empty segment list', () => {
      const flushEnd = calculateBackBufferFlushPoint([], 10);

      expect(flushEnd).toBe(0);
    });

    it('should return 0 when at start of stream', () => {
      const segments = [0, 6, 12, 18].map((start) => createSegment(start, 6));

      const currentTime = 0;

      const flushEnd = calculateBackBufferFlushPoint(segments, currentTime);

      expect(flushEnd).toBe(0);
      expect(calculateBackBufferFlushPoint(segments, 24)).toBe(12);
    });

    it('should handle currentTime before first segment', () => {
      const segments = [10, 16, 22, 28].map((start) => createSegment(start, 6));

      const currentTime = 5;

      const flushEnd = calculateBackBufferFlushPoint(segments, currentTime);

      expect(flushEnd).toBe(0);
      expect(calculateBackBufferFlushPoint(segments, 34)).toBe(22);
    });

    it('should handle currentTime after all segments', () => {
      const segments: Segment[] = [createSegment(0, 6), createSegment(6, 6), createSegment(12, 6)];

      const currentTime = 100;

      // Keep last 2 segments, flush first one
      const flushEnd = calculateBackBufferFlushPoint(segments, currentTime);

      expect(flushEnd).toBe(6); // Flush [0, 6), keep [6-18)
    });

    it('should handle single segment', () => {
      const segments: Segment[] = [createSegment(0, 6)];

      const currentTime = 3;

      const flushEnd = calculateBackBufferFlushPoint(segments, currentTime);

      expect(flushEnd).toBe(0);
    });
  });

  describe('segment boundary handling', () => {
    it('should flush at segment boundaries', () => {
      const segments: Segment[] = [createSegment(0, 4), createSegment(4, 4), createSegment(8, 4), createSegment(12, 4)];

      const currentTime = 12;

      const flushEnd = calculateBackBufferFlushPoint(segments, currentTime);

      expect(flushEnd).toBe(4);
    });

    it('should handle variable segment durations', () => {
      const segments: Segment[] = [
        createSegment(0, 2),
        createSegment(2, 6),
        createSegment(8, 4),
        createSegment(12, 8),
        createSegment(20, 6),
      ];

      const currentTime = 20;

      const flushEnd = calculateBackBufferFlushPoint(segments, currentTime);

      expect(flushEnd).toBe(8);
    });
  });

  describe('playback position', () => {
    it('should count segments based on current playback position', () => {
      const segments: Segment[] = [
        createSegment(0, 6),
        createSegment(6, 6),
        createSegment(12, 6),
        createSegment(18, 6),
        createSegment(24, 6),
        createSegment(30, 6),
      ];

      const currentTime = 20;

      const flushEnd = calculateBackBufferFlushPoint(segments, currentTime);

      expect(flushEnd).toBe(12);
    });

    it('should handle currentTime at exact segment boundary', () => {
      const segments: Segment[] = [
        createSegment(0, 6),
        createSegment(6, 6),
        createSegment(12, 6),
        createSegment(18, 6),
      ];

      const currentTime = 12;

      const flushEnd = calculateBackBufferFlushPoint(segments, currentTime);

      expect(flushEnd).toBe(0);
    });
  });

  describe('configuration', () => {
    it('should allow keeping 0 segments (flush everything)', () => {
      const segments: Segment[] = [createSegment(0, 6), createSegment(6, 6), createSegment(12, 6)];

      const currentTime = 12;
      const config = {
        ...DEFAULT_BACK_BUFFER_CONFIG,
        keepSegments: 0,
      };

      const flushEnd = calculateBackBufferFlushPoint(segments, currentTime, config);

      expect(flushEnd).toBe(12);
    });

    it('should allow keeping many segments', () => {
      const segments: Segment[] = [
        createSegment(0, 6),
        createSegment(6, 6),
        createSegment(12, 6),
        createSegment(18, 6),
        createSegment(24, 6),
      ];

      const currentTime = 24;
      const config = {
        ...DEFAULT_BACK_BUFFER_CONFIG,
        keepSegments: 10,
      };

      const flushEnd = calculateBackBufferFlushPoint(segments, currentTime, config);

      expect(flushEnd).toBe(0);
    });
  });
});
