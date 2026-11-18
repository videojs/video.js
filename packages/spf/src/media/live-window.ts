/**
 * Derive the live window of the track with the given id — the single source of truth for "where is live," consumed (via
 * `liveWindowFromState`) by the seek-to-live-edge and live-seekable-range behaviors so neither re-derives (or
 * re-presumes) the window shape. Type-agnostic: the caller decides which track bears the timeline (video when present,
 * else audio).
 *
 * The window is a **live read** over the current `segments` array — never stored on the track. The anchor triple is
 * frozen per source; per-segment `startTime` values are re-derived against it on every reload, so the edge here slides
 * while the origin stays fixed (see `internal/design/spf/live-presentation-timeline-model.md`).
 *
 * Returns `null` when there is no live edge to track: an unresolved presentation or track, a track with no segments, or
 * a **complete** playlist (VoD, or live that has ended — a finite `Track.duration`).
 */
import {
  deriveStreamType,
  getMediaPlaylistMetadata,
  isResolvedPresentation,
  isResolvedTrack,
  type MaybeResolvedPresentation,
} from './types';
import { findTrackById } from './utils/tracks';

export interface LiveWindow {
  /** Earliest time still in the window (seconds, presentation timeline). */
  start: number;
  /** The live edge — latest time in the window (seconds). */
  end: number;
}

export function liveWindowFor(
  presentation: MaybeResolvedPresentation | undefined,
  trackId: string | undefined
): LiveWindow | null {
  if (!isResolvedPresentation(presentation) || !trackId) return null;

  const track = findTrackById(presentation, trackId);
  if (!track || !isResolvedTrack(track) || track.segments.length === 0) return null;

  // Complete playlist (VoD, or live that has ended) → no live edge. `Track.duration`
  // is the parser's completeness signal (finite = complete, Infinity = still growing).
  if (Number.isFinite(track.duration)) return null;

  const { segments } = track;
  const last = segments[segments.length - 1]!;

  return {
    start: segments[0]!.startTime,
    end: last.startTime + last.duration,
  };
}

/**
 * `targetLiveWindow` per the media-ui-extensions live-edge proposal: `NaN` for on-demand (or nothing resolved yet), `0`
 * for standard sliding-window live, `Infinity` for DVR (`#EXT-X-PLAYLIST-TYPE:EVENT` — the window grows from the
 * start). Read from the timeline-bearing track's playlist metadata.
 */
export function deriveTargetLiveWindow(
  presentation: MaybeResolvedPresentation | undefined,
  trackId: string | undefined
): number {
  if (!isResolvedPresentation(presentation) || !trackId) return Number.NaN;

  const track = findTrackById(presentation, trackId);
  if (!track || !isResolvedTrack(track)) return Number.NaN;

  const metadata = getMediaPlaylistMetadata(track);
  if (!metadata) return Number.NaN;

  if (metadata.playlistType === 'EVENT') return Number.POSITIVE_INFINITY;

  return deriveStreamType(metadata) === 'live' ? 0 : Number.NaN;
}
