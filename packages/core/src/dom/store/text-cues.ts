import type { MediaTextCue, TextTrackCueLike } from '@videojs/media';
import { isObject, isString, isUndefined } from '@videojs/utils/predicate';

export interface TextCueOptions {
  /** The kind of track the cues belong to. JSON text becomes `value` only on `metadata` tracks. */
  kind?: string | undefined;
  /** Clamp every cue end to this duration once it is finite. */
  duration?: number | undefined;
}

/**
 * Plain cue data from a text track's cue list.
 *
 * Every cue gets an id: its own, or one derived from where it sits when it has none. `value` comes from the cue itself
 * when it carries data, such as a `DataCue` or a `VTTCue` hls.js filled in, and otherwise from text on a `metadata`
 * track that parses to a JSON object or array. Plain text, and text that isn't valid JSON, leave `value` unset.
 *
 * Cues delivered with a stream can be open-ended — a chapters document leaves its last chapter open, and the track
 * carries that as a very large `endTime` because engines reject `Infinity` — so a consumer reading the list gets each
 * cue ending no later than the media does. While the duration is unknown or infinite the ends pass through unchanged.
 * Pure: the result is fresh data, never the live cues, so a store can expose it without leaking DOM objects.
 */
export function toMediaTextCues(
  cues: Iterable<TextTrackCueLike> | null | undefined,
  options: TextCueOptions = {}
): MediaTextCue[] {
  if (!cues) return [];

  const { kind, duration = Number.NaN } = options;
  const max = Number.isFinite(duration) && duration > 0 ? duration : Number.POSITIVE_INFINITY;
  const list = Array.from(cues);
  const getId = createCueIds(list);

  return list.map((cue) => toMediaTextCue(cue, kind, max, getId));
}

function toMediaTextCue(cue: TextTrackCueLike, kind: string | undefined, max: number, getId: CueIds) {
  const text = 'text' in cue && isString(cue.text) ? cue.text : '';
  const result: MediaTextCue = {
    id: getId(cue),
    startTime: cue.startTime,
    endTime: Math.min(cue.endTime, max),
    text,
  };

  if ('value' in cue && !isUndefined(cue.value)) {
    result.value = cue.value;

    if ('type' in cue && isString(cue.type) && cue.type) result.type = cue.type;
  } else if (kind === 'metadata') {
    const value = parseJsonValue(text);

    if (!isUndefined(value)) result.value = value;
  }

  return result;
}

type CueIds = (cue: TextTrackCueLike) => string;

/**
 * Ids for the cues in one list: a cue's own id, or where it starts and ends when it has none. A cue keeps its own id
 * the first time it appears; a repeat, or a derived id another cue already owns, gets a suffix that no cue in the list
 * has.
 */
function createCueIds(cues: readonly TextTrackCueLike[]): CueIds {
  const own = new Set<string>();
  const used = new Set<string>();
  const counts = new Map<string, number>();

  for (const cue of cues) if (cue.id) own.add(cue.id);

  return (cue) => {
    const base = cue.id || `${cue.startTime}-${cue.endTime}`;
    let id = base;

    if (used.has(id) || (!cue.id && own.has(id))) {
      let count = counts.get(base) ?? 0;

      do {
        id = `${base}-${++count}`;
      } while (own.has(id) || used.has(id));

      counts.set(base, count);
    }

    used.add(id);

    return id;
  };
}

/** A JSON object or array from cue text, or `undefined` for anything else. Never throws. */
function parseJsonValue(text: string): unknown {
  const trimmed = text.trim();
  if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) return undefined;

  try {
    const value: unknown = JSON.parse(trimmed);

    return isObject(value) ? value : undefined;
  } catch {
    return undefined;
  }
}
