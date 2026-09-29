export type CaptionOrSubtitleKind = 'captions' | 'subtitles';

/** Whether a text track is a captions or subtitles track. */
export function isCaptionOrSubtitleTrack(track: { kind: string }): track is { kind: CaptionOrSubtitleKind } {
  return track.kind === 'captions' || track.kind === 'subtitles';
}

/**
 * Captions and subtitles tracks in the order menus present them: grouped by kind, keeping source order within a kind.
 * Shared so selection fallbacks pick the same track the captions menu lists first.
 */
export function getCaptionOrSubtitleTracks<Track extends { kind: string }>(tracks: Iterable<Track>): Track[] {
  return Array.from(tracks).filter(isCaptionOrSubtitleTrack).sort(sortByKind);
}

/** Find the `<track>` element that owns the given `TextTrack`. */
export function findTrackElement(media: EventTarget, track: unknown): HTMLTrackElement | null {
  if (!(media instanceof HTMLElement)) return null;

  for (const el of media.querySelectorAll('track')) {
    if (el.track === track) return el;
  }

  return null;
}

export function getTextTrackList<Track extends { kind: string; mode: string }>(
  media: { textTracks?: Iterable<Track> },
  filterPred: (textTrack: Track) => boolean
): Track[] {
  if (!media.textTracks) return [];

  return Array.from(media.textTracks).filter(filterPred).sort(sortByKind);
}

function sortByKind(a: { kind: string }, b: { kind: string }): number {
  return a.kind > b.kind ? 1 : a.kind < b.kind ? -1 : 0;
}
