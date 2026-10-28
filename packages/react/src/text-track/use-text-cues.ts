'use client';

import { getActiveTextCues, getTextCues, type TextCuesSource, type TextTrackDefinition } from '@videojs/core';
import type { MediaTextCue, TextTrackFilter } from '@videojs/media';
import { isFunction, isObject } from '@videojs/utils/predicate';
import { useEffect } from 'react';

import { usePlayer } from '../player/context';
import { useLatestRef } from '../utils/use-latest-ref';

const NO_CUES: readonly MediaTextCue[] = [];
const ALL_TRACKS: TextTrackFilter = {};

type TextTrackQuery = TextTrackFilter | TextTrackDefinition;

/**
 * Every cue on the tracks a track definition matches, typed by the definition. Re-renders when those cues change.
 *
 * @param track - The track definition to read.
 * @label With Definition
 * @internal
 */
export function useTextCues<Cue extends MediaTextCue>(track: TextTrackDefinition<Cue>): readonly Cue[];
/**
 * Every cue on the tracks a filter matches, from the media or the app. Re-renders when those cues change. A function
 * filter should keep its identity across renders.
 *
 * @param filter - Picks tracks by kind, label, or language, or with a function.
 * @label With Filter
 * @internal
 */
export function useTextCues(filter?: TextTrackFilter): readonly MediaTextCue[];
export function useTextCues(filter: TextTrackQuery = ALL_TRACKS): readonly MediaTextCue[] {
  return useCues(filter, getTextCues);
}

/**
 * The cues active now on the tracks a track definition matches, typed by the definition. Re-renders when they change.
 *
 * ```tsx
 * const [cue] = useActiveTextCues(quizTrack);
 * ```
 *
 * @param track - The track definition to read.
 * @label With Definition
 * @internal
 */
export function useActiveTextCues<Cue extends MediaTextCue>(track: TextTrackDefinition<Cue>): readonly Cue[];
/**
 * The cues active now on the tracks a filter matches, from the media or the app. Re-renders when they change. A
 * function filter should keep its identity across renders.
 *
 * @param filter - Picks tracks by kind, label, or language, or with a function.
 * @label With Filter
 * @internal
 */
export function useActiveTextCues(filter?: TextTrackFilter): readonly MediaTextCue[];
export function useActiveTextCues(filter: TextTrackQuery = ALL_TRACKS): readonly MediaTextCue[] {
  return useCues(filter, getActiveTextCues);
}

function useCues(
  filter: TextTrackQuery,
  read: (source: TextCuesSource, filter: TextTrackQuery) => readonly MediaTextCue[]
): readonly MediaTextCue[] {
  useWatchTextCues(filter);

  return useReadTextCues(filter, read);
}

/**
 * Select the cues a reader returns for a filter, without asking the store to track it. Pair with `useWatchTextCues`.
 *
 * @internal
 */
export function useReadTextCues(
  filter: TextTrackQuery,
  read: (source: TextCuesSource, filter: TextTrackQuery) => MediaTextCue[]
): MediaTextCue[] {
  return usePlayer((state) => (hasTextCues(state) ? read(state, filter) : NO_CUES));
}

/**
 * Ask the store to track cues for a filter while the component is mounted.
 *
 * @internal
 */
export function useWatchTextCues(filter: TextTrackQuery): void {
  const store = usePlayer();
  const latest = useLatestRef(filter);
  const key = getFilterKey(filter);

  useEffect(() => {
    const watch = store.watchTextCues;
    if (!isFunction(watch)) return;

    return watch(latest.current) as () => void;
    // `latest` is a ref; `key` stands in for the filter so an inline object doesn't re-register on every render.
  }, [store, key, latest]);
}

/** A key that changes only when what a filter matches does, so inline object filters don't re-register each render. */
function getFilterKey(filter: TextTrackQuery): unknown {
  if (isFunction(filter)) return filter;

  const { kind, label, language } = filter;

  return JSON.stringify([kind, label, language]);
}

function hasTextCues(state: unknown): state is TextCuesSource {
  return isObject(state) && 'textCues' in state && Array.isArray(state.textCues);
}
