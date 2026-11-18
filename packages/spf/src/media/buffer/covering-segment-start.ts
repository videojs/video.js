/**
 * A playlist's segment boundaries are approximate. A segment's media can start a little after the time the playlist
 * gives for it: video cut on a keyframe presents its first frame a frame or two after that time (B-frame reordering),
 * and audio cut on whole codec frames can start up to one frame late. The media for those first moments is at the end
 * of the _previous_ segment. Played straight through, that's invisible. A load that starts at the boundary (a seek, a
 * live join, a start position) fetches only the later segment and leaves the playhead just before its first media.
 */
import type { Segment } from '../types';
import type { TimeRange } from './forward-buffer';

/**
 * The start of the segment whose media covers `currentTime`, when that's not the segment the playlist places there: the
 * playlist's segment turned out to start late, so its predecessor's end holds the media. Reads the evidence straight
 * from what is buffered — a range that starts inside the playhead's segment, after the playhead, is that segment's
 * media starting late. `undefined` when the playlist's segment is the right one to load from (the playhead is buffered,
 * nothing near it is, or it's in the first segment, which has no predecessor).
 */
export function coveringSegmentStart(
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
