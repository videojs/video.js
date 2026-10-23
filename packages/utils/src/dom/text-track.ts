/** @internal */
export type CaptionOrSubtitleKind = 'captions' | 'subtitles';

/**
 * Whether a text track is a captions or subtitles track.
 *
 * @internal
 */
export function isCaptionOrSubtitleTrack(track: { kind: string }): track is { kind: CaptionOrSubtitleKind } {
  return track.kind === 'captions' || track.kind === 'subtitles';
}

/**
 * Captions and subtitles tracks in the order menus present them: grouped by kind, keeping source order within a kind.
 * Shared so selection fallbacks pick the same track the captions menu lists first.
 *
 * @internal
 */
export function getCaptionOrSubtitleTracks<Track extends { kind: string }>(tracks: Iterable<Track>): Track[] {
  return Array.from(tracks).filter(isCaptionOrSubtitleTrack).sort(sortByKind);
}

/**
 * Find the `<track>` element that owns the given `TextTrack`.
 *
 * @internal
 */
export function findTrackElement(media: EventTarget, track: unknown): HTMLTrackElement | null {
  if (!(media instanceof HTMLElement)) return null;

  for (const el of media.querySelectorAll('track')) {
    if (el.track === track) return el;
  }

  return null;
}

/**
 * Add a text track to a media element through a `<track>` child, so removing the element removes the track. A track
 * from `HTMLMediaElement.addTextTrack()` can never be removed. The track starts `hidden`, like one from
 * `addTextTrack()`, and comes from `addTextTrack()` instead where the element yields no track.
 *
 * Chromium discards cues added to the track before the element settles, which a `<track>` without `src` does by firing
 * `error` once it leaves `disabled` mode.
 *
 * @internal
 */
export function addRemovableTextTrack(
  media: HTMLMediaElement,
  kind: TextTrackKind,
  label?: string,
  language?: string
): TextTrack {
  const element = media.ownerDocument.createElement('track');

  element.kind = kind;

  if (label) element.label = label;

  if (language) element.srclang = language;

  media.append(element);

  // Environments without native text tracks, such as jsdom, leave `track` unset.
  const { track } = element;

  if (!track) {
    element.remove();
    return media.addTextTrack(kind, label, language);
  }

  track.mode = 'hidden';

  return track;
}

/** @internal */
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
