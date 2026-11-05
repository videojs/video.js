'use client';

import type {
  TextTrackHandle,
  InferCueValue,
  TextTrackContent,
  TextTrackDefinition,
  TextTrackInit,
} from '@videojs/core';
import type { MediaTextCue } from '@videojs/media';
import { isFunction } from '@videojs/utils/predicate';
import { useEffect, useState } from 'react';

import { usePlayer } from '../player/context';
import { useLatestRef } from '../utils/use-latest-ref';

/**
 * Add a track defined with `defineTextTrack()` while the component is mounted. Its cues are checked against the
 * definition's type. A source change clears app tracks, so the track is added again for the new source. Keep `cues` the
 * same array, and `format` the same function, across renders; a new one replaces the track.
 *
 * ```tsx
 * useCreateTextTrack(quizTrack, { cues });
 * ```
 *
 * @param track - The track definition to add.
 * @param content - The track's cues.
 * @label With Definition
 * @internal
 */
export function useCreateTextTrack<Cue extends MediaTextCue>(
  track: TextTrackDefinition<Cue>,
  content?: TextTrackContent<InferCueValue<Cue>>
): TextTrackHandle<InferCueValue<Cue>> | null;
/**
 * Add a text track while the component is mounted. A source change clears app tracks, so the track is added again for
 * the new source. Keep `cues` the same array, and `format` the same function, across renders; a new one replaces the
 * track.
 *
 * ```tsx
 * useCreateTextTrack({ kind: 'metadata', label: 'quiz', cues });
 * ```
 *
 * @param init - The track to add, with its cues.
 * @label With Description
 * @internal
 */
export function useCreateTextTrack<Value = unknown>(init: TextTrackInit<Value>): TextTrackHandle<Value> | null;
export function useCreateTextTrack(init: TextTrackInit, content?: TextTrackContent): TextTrackHandle | null {
  const store = usePlayer();
  const [added, setAdded] = useState<TextTrackHandle | null>(null);
  const [generation, setGeneration] = useState(0);
  const latest = useLatestRef({ init, content });
  const cues = content?.cues ?? init.cues;
  const src = content?.src ?? init.src;
  const format = content?.format ?? init.format;
  const key = JSON.stringify([init.kind, init.label, init.language]);

  useEffect(() => {
    const addTextTrack = store.addTextTrack;
    if (!isFunction(addTextTrack)) return;

    const track: TextTrackHandle = addTextTrack(latest.current.init, latest.current.content);
    let removedByApp = false;

    const handle: TextTrackHandle = {
      id: track.id,
      get removed() {
        return track.removed;
      },
      addCue: (cue) => track.addCue(cue),
      removeCue: (id) => track.removeCue(id),
      remove() {
        removedByApp = true;
        track.remove();
      },
    };

    setAdded(handle);

    // A source change or media swap clears the track; add it again for what plays next.
    const unsubscribe = store.subscribe(() => {
      if (track.removed && !removedByApp) setGeneration((count) => count + 1);
    });

    return () => {
      unsubscribe();
      track.remove();
      setAdded(null);
    };
    // `latest` is a ref; `key`, `cues`, `src`, and `format` stand in for the description so an inline object doesn't
    // re-add each render.
  }, [store, key, cues, src, format, generation, latest]);

  return added;
}
