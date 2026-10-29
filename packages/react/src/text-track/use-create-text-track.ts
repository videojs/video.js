'use client';

import type { AppTextTrack, InferCueValue, TextTrackContent, TextTrackDefinition, TextTrackInit } from '@videojs/core';
import type { MediaTextCue } from '@videojs/media';
import { isFunction } from '@videojs/utils/predicate';
import { useEffect, useState } from 'react';

import { usePlayer } from '../player/context';
import { useLatestRef } from '../utils/use-latest-ref';

/**
 * Add a track defined with `defineTextTrack()` while the component is mounted, and remove it when it unmounts. Its cues
 * are checked against the definition's type. The track stays through source changes. Keep `cues` the same array, and
 * `format` the same function, across renders; a new one replaces the track.
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
): AppTextTrack<InferCueValue<Cue>> | null;
/**
 * Add a text track while the component is mounted, and remove it when it unmounts. The track stays through source
 * changes. Keep `cues` the same array, and `format` the same function, across renders; a new one replaces the track.
 *
 * ```tsx
 * useCreateTextTrack({ kind: 'metadata', label: 'quiz', cues });
 * ```
 *
 * @param init - The track to add, with its cues.
 * @label With Description
 * @internal
 */
export function useCreateTextTrack<Value = unknown>(init: TextTrackInit<Value>): AppTextTrack<Value> | null;
export function useCreateTextTrack(init: TextTrackInit, content?: TextTrackContent): AppTextTrack | null {
  const store = usePlayer();
  const [added, setAdded] = useState<AppTextTrack | null>(null);
  const latest = useLatestRef({ init, content });
  const cues = content?.cues ?? init.cues;
  const src = content?.src ?? init.src;
  const format = content?.format ?? init.format;
  const key = JSON.stringify([init.kind, init.label, init.language]);

  useEffect(() => {
    const addTextTrack = store.addTextTrack;
    if (!isFunction(addTextTrack)) return;

    const track: AppTextTrack = addTextTrack(latest.current.init, latest.current.content);

    setAdded(track);

    return () => {
      track.remove();
      setAdded(null);
    };
    // `latest` is a ref; `key`, `cues`, `src`, and `format` stand in for the description so an inline object doesn't
    // re-add each render.
  }, [store, key, cues, src, format, latest]);

  return added;
}
