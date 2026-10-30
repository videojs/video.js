import type { MediaTextTrack, MediaTextTrackCapability, TextTrackKind, TextTrackLike } from '@videojs/media';
import { isQuerySelectorAllCapable } from '@videojs/media';
import { listen } from '@videojs/utils/dom';

import { getAppTrackCopyId } from './app-text-tracks';

/**
 * A media track's id in `textTrackList`: its own, or one derived from where it sits and what it is. A copy of an app
 * track goes by that track's id, and a track whose own id is one of `appIds` goes by the derived id, so a media track
 * and an app track never share one.
 */
export function getTextTrackId(track: TextTrackLike, index: number, appIds?: ReadonlySet<string>): string {
  const copyOf = getAppTrackCopyId(track);
  if (copyOf) return copyOf;

  return track.id && !appIds?.has(track.id)
    ? track.id
    : `track:${index}:${track.kind}:${track.language}:${track.label}`;
}

/** A media track as plain data. */
export function toMediaTextTrack(track: TextTrackLike, index: number, appIds?: ReadonlySet<string>): MediaTextTrack {
  return {
    id: getTextTrackId(track, index, appIds),
    kind: track.kind as TextTrackKind,
    label: track.label,
    language: track.language,
    mode: track.mode,
    source: 'media',
  };
}

/**
 * Call `listener` when a `<track>` element still missing cues finishes loading. `addtrack` fires before a track's cues
 * are parsed, and only the element's `load` tells when they're ready.
 */
export function listenForTrackLoads(media: MediaTextTrackCapability, listener: () => void, signal: AbortSignal): void {
  const tracks = (isQuerySelectorAllCapable<HTMLTrackElement>(media) && media.querySelectorAll('track')) || [];
  const shadowTracks = (media instanceof HTMLElement && media.shadowRoot?.querySelectorAll('track')) || [];

  for (const element of [...tracks, ...shadowTracks]) {
    if (!element.track?.cues?.length) listen(element, 'load', listener, { signal });
  }
}
