import type { MediaTextTrack, MediaTextTrackCapability, TextTrackKind, TextTrackLike } from '@videojs/media';
import { isQuerySelectorAllCapable } from '@videojs/media';
import { listen } from '@videojs/utils/dom';

/** A media track's id in `textTrackList`: its own, or one derived from where it sits and what it is. */
export function getTextTrackId(track: TextTrackLike, index: number): string {
  return track.id || `track:${index}:${track.kind}:${track.language}:${track.label}`;
}

/** A media track as plain data. */
export function toMediaTextTrack(track: TextTrackLike, index: number): MediaTextTrack {
  return {
    id: getTextTrackId(track, index),
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
