import type { MediaTextCue } from '@videojs/media';
import { isObject } from '@videojs/utils/predicate';

import { type TextCueFormat, type TextCueInit, toAppCue } from '../../core/text-track/app';

/** A file an app track's cues come from. */
export interface TextTrackLoad {
  src: string;
  format?: TextCueFormat | undefined;
}

/**
 * Fetch and parse the cues of a track an app added with a `src`. The track's `format` reads the file when it has one;
 * otherwise WebVTT goes through the browser's own parser, and anything else is JSON: an array of cues, or an object
 * with a `cues` array.
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

    return parseVtt(text, track.kind, signal);
  }

  const cues = readCueList(load.format ? await load.format(text) : JSON.parse(text));

  return cues.map((cue, index) => toAppCue(cue, `${track.id}-src-${index}`));
}

function readCueList(result: unknown): readonly TextCueInit[] {
  if (Array.isArray(result)) return result;

  if (isObject(result) && 'cues' in result && Array.isArray(result.cues)) return result.cues;

  throw new Error('[vjs-core] text track cues must be an array, or an object with a `cues` array');
}
