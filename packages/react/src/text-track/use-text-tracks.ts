'use client';

import { getTextTracks, type TextTracksSource, type TextTrackDefinition } from '@videojs/core';
import type { MediaTextTrack, TextTrackFilter } from '@videojs/media';
import { isObject } from '@videojs/utils/predicate';

import { usePlayer } from '../player/context';

const NO_TRACKS: MediaTextTrack[] = [];

/**
 * The text tracks a filter or track definition matches, from the media or the app. Re-renders when they change.
 *
 * ```tsx
 * const chapters = useTextTracks({ kind: 'chapters' });
 * ```
 *
 * @param filter - Picks tracks by kind, label, or language, or with a function.
 * @experimental
 */
export function useTextTracks(filter: TextTrackFilter | TextTrackDefinition = {}): MediaTextTrack[] {
  return usePlayer((state) => (hasTextTracks(state) ? getTextTracks(state, filter) : NO_TRACKS));
}

function hasTextTracks(state: unknown): state is TextTracksSource {
  return isObject(state) && 'textTrackList' in state && Array.isArray(state.textTrackList);
}
