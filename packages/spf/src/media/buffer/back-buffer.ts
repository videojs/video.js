/**
 * Back Buffer Strategy (Simple)
 *
 * Calculates flush points for back buffer management. V1 uses simple "keep N segments" strategy.
 */

import type { Segment } from '../types';

/** Back buffer configuration. */
export interface BackBufferConfig {
  /** Number of segments to keep behind current playback position. Default: 2 segments. */
  keepSegments: number;
}

/** Default back buffer configuration. */
export const DEFAULT_BACK_BUFFER_CONFIG: BackBufferConfig = {
  keepSegments: 2,
};

/**
 * Calculate back buffer flush point.
 *
 * Determines where to flush old segments from the back buffer. Keeps a fixed number of segments behind the current
 * playback position.
 *
 * Algorithm: 1. Find segments before currentTime 2. Count back N segments (keepSegments) 3. Return startTime of segment
 * N+1 back (flush everything before this)
 *
 * @example
 *   const segments = [
 *   { startTime: 0, duration: 6, ... },
 *   { startTime: 6, duration: 6, ... },
 *   { startTime: 12, duration: 6, ... },
 *   { startTime: 18, duration: 6, ... },
 *   ];
 *
 *   // Playing at 18s, keep 2 segments
 *   const flushEnd = calculateBackBufferFlushPoint(segments, 18);
 *   // Returns 6 (flush [0, 6), keep [6-18))
 *
 *   Never flushes the segment before the playhead's, whatever `keepSegments` says; see `playheadPredecessorStart`.
 *
 * @param segments - Available segments (should be sorted by startTime)
 * @param currentTime - Current playback position in seconds
 * @param config - Optional back buffer configuration
 * @returns Time in seconds to flush up to (flush range: [0, flushEnd))
 */
export function calculateBackBufferFlushPoint(
  segments: Segment[],
  currentTime: number,
  config: BackBufferConfig = DEFAULT_BACK_BUFFER_CONFIG
): number {
  return Math.min(
    keepSegmentsFlushPoint(segments, currentTime, config),
    playheadPredecessorStart(segments, currentTime)
  );
}

/**
 * The start of the segment before the playhead's — the back-buffer's hard floor, whatever `keepSegments` says. Segment
 * boundaries are approximate: the predecessor's media can run past its playlist end, so its tail may be the media under
 * the playhead (a lead-in at a boundary reached by a seek). And MSE removes a flushed range's decode dependents through
 * the next keyframe, so flushing the predecessor's span would take that tail with it. `Infinity` when there is no
 * predecessor to keep.
 */
function playheadPredecessorStart(segments: Segment[], currentTime: number): number {
  const playheadSegment = segments.find(
    ({ startTime, duration }) => startTime <= currentTime && currentTime < startTime + duration
  );
  const playheadStart = playheadSegment?.startTime ?? currentTime;
  const predecessor = segments.filter(({ startTime, duration }) => startTime + duration <= playheadStart).at(-1);

  return predecessor?.startTime ?? Infinity;
}

/** The flush point the `keepSegments` count alone gives. */
function keepSegmentsFlushPoint(segments: Segment[], currentTime: number, config: BackBufferConfig): number {
  if (segments.length === 0) {
    return 0;
  }

  // Find all segments before current time (not including current segment)
  const segmentsBefore = segments.filter((seg) => seg.startTime < currentTime);
  // If no segments before current time, nothing to flush
  if (segmentsBefore.length === 0) return 0;

  // Calculate how many segments to flush
  // Keep last N segments, flush the rest
  const segmentsToFlush = segmentsBefore.length - config.keepSegments;
  // If we don't have enough segments to flush, keep everything
  if (segmentsToFlush <= 0) return 0;

  // If we want to flush all segments, return currentTime
  // (flush everything before current playback position)
  if (segmentsToFlush >= segmentsBefore.length) {
    return currentTime;
  }

  // Return the startTime of the first segment we want to keep
  // Everything before this will be flushed
  return segmentsBefore[segmentsToFlush]!.startTime;
}
