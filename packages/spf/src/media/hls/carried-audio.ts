/**
 * Audio renditions carried in video segments. HLS lets an `EXT-X-MEDIA` audio rendition omit its `URI`, meaning its
 * media is muxed into the segments of every variant that references its group. The multivariant parser keeps such a
 * rendition as a track with an empty `url`, which nothing can fetch: it never resolves, and the active-CDN scope (keyed
 * on the URL's origin) never picks it. A composition that can extract an elementary stream from a muxed segment — the
 * MPEG-TS transmux feature — resolves the rendition here instead: it borrows the playlist of the lowest-bandwidth
 * variant carrying its group (its _carrier_), so it resolves, scopes to the video CDN, and plans segments like any
 * audio rendition. Which variant's segment is actually fetched is the loader pipeline's call, made per segment against
 * the selected video track so the bytes are shared with the video fetch.
 */
import type { MaybeResolvedPresentation, PartiallyResolvedVideoTrack, Presentation, VideoTrack } from '../types';
import { getTracksByType } from '../utils/tracks';

type AnyVideoTrack = PartiallyResolvedVideoTrack | VideoTrack;

/** The lowest-bandwidth video track advertising the audio group. */
function carrierFor(videoTracks: readonly AnyVideoTrack[], groupId: string): AnyVideoTrack | undefined {
  return videoTracks
    .filter((track) => track.audioGroupIds?.includes(groupId))
    .reduce<AnyVideoTrack | undefined>(
      (lowest, track) => (!lowest || track.bandwidth < lowest.bandwidth ? track : lowest),
      undefined
    );
}

/** Give every URI-less audio rendition its carrier variant's playlist URL. Returns the input when nothing changes. */
export function resolveCarriedAudioRenditions(presentation: Presentation): Presentation {
  const videoTracks = getTracksByType(presentation, 'video') as AnyVideoTrack[];
  let changed = false;

  const selectionSets = presentation.selectionSets.map((selectionSet) => {
    if (selectionSet.type !== 'audio') return selectionSet;

    return {
      ...selectionSet,
      switchingSets: selectionSet.switchingSets.map((switchingSet) => ({
        ...switchingSet,
        tracks: switchingSet.tracks.map((track) => {
          const carrier = track.url === '' ? carrierFor(videoTracks, track.groupId) : undefined;
          if (!carrier) return track;

          changed = true;
          return { ...track, url: carrier.url };
        }),
      })),
    };
  });

  return changed ? ({ ...presentation, selectionSets } as Presentation) : presentation;
}

/** Whether an audio track's media is carried in video segments: it shares a playlist URL with a video track. */
export function isCarriedAudioTrack(
  presentation: MaybeResolvedPresentation,
  track: { type: string; url: string }
): boolean {
  if (track.type !== 'audio' || track.url === '') return false;

  return getTracksByType(presentation, 'video').some((video) => video.url === track.url);
}
