import type { MediaTextCue } from '@videojs/media';
import { isObject } from '@videojs/utils/predicate';

import { type TextCueFormat, type TextCueInit, toAppCue } from '../../core/text-track/app';

/** A file an app track's cues come from. */
export interface TextTrackLoad {
  src: string;
  format?: TextCueFormat | undefined;
}

/**
 * Fetch and parse the cues of a track an app added with a `src`. WebVTT goes through the browser's own parser; anything
 * else is JSON, read through the track's `format` when it has one, and otherwise as an array of cues or an object with
 * a `cues` array.
 */
export async function loadTextTrackCues(
  load: TextTrackLoad,
  track: { id: string; kind: string },
  signal: AbortSignal
): Promise<MediaTextCue[]> {
  const response = await fetch(load.src, { signal });
  if (!response.ok) throw new Error(`[vjs-core] could not load text track ${load.src} (${response.status})`);

  const text = await response.text();

  if (!load.format && text.trimStart().startsWith('WEBVTT')) {
    const { parseVtt } = await import('./parse-vtt');

    return parseVtt(text, track.kind);
  }

  const json: unknown = JSON.parse(text);
  const cues = load.format ? load.format(json) : readCueList(json);

  return cues.map((cue, index) => toAppCue(cue, `${track.id}-src-${index}`));
}

function readCueList(json: unknown): readonly TextCueInit[] {
  if (Array.isArray(json)) return json;

  if (isObject(json) && 'cues' in json && Array.isArray(json.cues)) return json.cues;

  throw new Error('[vjs-core] a JSON text track must be an array of cues, or an object with a `cues` array');
}
