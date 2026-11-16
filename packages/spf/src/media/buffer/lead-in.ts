/**
 * Segment lead-in: a playlist's segment boundaries are approximate. A segment's media can start a little after its
 * playlist start — video cut on a keyframe presents a frame or two after the boundary (B-frame reordering), and audio
 * cut on whole codec frames can start up to one frame late — so the media covering a boundary's first instants lives in
 * the _previous_ segment's tail. Played straight through that's invisible; a load that starts at the boundary (a seek,
 * a live join, a start position) leaves the playhead just before the first buffered media.
 */
import type { Segment } from '../types';
import type { TimeRange } from './forward-buffer';

/**
 * Where a load should start when that's earlier than the playhead: the start of the segment whose tail covers
 * `currentTime`, once the segment the playlist places there turns out to start late. Reads the evidence straight from
 * what is buffered — a range that starts inside the playhead's segment, after the playhead, is that segment's media
 * starting late, and its predecessor holds the rest. `undefined` when the load should start at the playhead (it's
 * buffered, nothing near it is, or it's in the first segment, which has no predecessor).
 */
export function previousSegmentLeadInStart(
  segments: readonly Segment[],
  bufferedRanges: readonly TimeRange[],
  currentTime: number
): number | undefined {
  if (bufferedRanges.some(({ start, end }) => start <= currentTime && currentTime < end)) return undefined;

  const index = segments.findIndex(
    ({ startTime, duration }) => startTime <= currentTime && currentTime < startTime + duration
  );
  if (index <= 0) return undefined;

  const segment = segments[index]!;
  const startsLate = bufferedRanges.some(
    ({ start }) => start > currentTime && start < segment.startTime + segment.duration
  );

  return startsLate ? segments[index - 1]!.startTime : undefined;
}
