import type { MediaTextCue, TextTrackCueLike } from '@videojs/media';
import { deepEqual } from '@videojs/utils/object';
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
 * The result is plain data, never the live cues, so a store can expose it without leaking DOM objects. A cue that
 * hasn't changed since it was last read comes back as the same object, so reading a long list again only converts the
 * cues that are new or changed.
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

interface PlainCueCopy {
  kind: string | undefined;
  /** The live cue's own `value`, which a copy shares instead of parsing it from text. */
  data: unknown;
  cue: MediaTextCue;
}

/** The last plain copy of each live cue. */
const plainCopies = new WeakMap<TextTrackCueLike, PlainCueCopy>();

function toMediaTextCue(
  cue: TextTrackCueLike,
  kind: string | undefined,
  max: number,
  getId: CueIds
): MediaTextCue {
  const id = getId(cue);
  const text = 'text' in cue && isString(cue.text) ? cue.text : '';
  const endTime = Math.min(cue.endTime, max);
  const data = 'value' in cue ? cue.value : undefined;
  const type = !isUndefined(data) && 'type' in cue && isString(cue.type) && cue.type ? cue.type : undefined;

  // Engines can change a cue in place, so a copy is reused only while everything it was made from still matches.
  const copy = plainCopies.get(cue);

  if (
    copy &&
    copy.kind === kind &&
    copy.data === data &&
    copy.cue.id === id &&
    copy.cue.startTime === cue.startTime &&
    copy.cue.endTime === endTime &&
    copy.cue.text === text &&
    copy.cue.type === type
  ) {
    return copy.cue;
  }

  const result: MediaTextCue = { id, startTime: cue.startTime, endTime, text };

  if (!isUndefined(data)) {
    result.value = data;

    if (type) result.type = type;
  } else if (kind === 'metadata') {
    const value = parseJsonValue(text);

    if (!isUndefined(value)) result.value = value;
  }

  plainCopies.set(cue, { kind, data, cue: result });

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

/**
 * `next`, keeping each cue from `previous` that hasn't changed, and `previous` itself when nothing has. Store cues are
 * rebuilt on every sync, so this is what lets subscribers compare cues and cue lists by identity.
 */
export function reuseCues<Cue extends MediaTextCue>(previous: readonly Cue[] | undefined, next: Cue[]): Cue[] {
  if (!previous?.length) return next;

  // Cues that haven't changed come back as the same objects, so an unchanged list needs no matching by id.
  const reused = isSameList(previous, next) ? next : reuseById(previous, next);

  // SAFETY: `previous` is returned only when it holds exactly the cues in `reused`, which is a `Cue[]`.
  return isSameList(previous, reused) ? (previous as Cue[]) : reused;
}

function reuseById<Cue extends MediaTextCue>(previous: readonly Cue[], next: Cue[]): Cue[] {
  const byId = new Map(previous.map((cue) => [cue.id, cue]));

  return next.map((cue) => {
    const old = byId.get(cue.id);

    return old && isSameCue(old, cue) ? old : cue;
  });
}

function isSameList(a: readonly MediaTextCue[], b: readonly MediaTextCue[]): boolean {
  return a.length === b.length && a.every((cue, index) => cue === b[index]);
}

function isSameCue(a: MediaTextCue, b: MediaTextCue): boolean {
  return (
    a.startTime === b.startTime &&
    a.endTime === b.endTime &&
    a.text === b.text &&
    a.type === b.type &&
    // A cue rebuilt from the same data, such as JSON text parsed again, carries an equal but new value.
    deepEqual(a.value, b.value)
  );
}

/** Cues ordered by start time, then end time, keeping the order of cues that tie. */
export function sortCues<Cue extends MediaTextCue>(cues: Cue[]): Cue[] {
  return cues.sort((a, b) => a.startTime - b.startTime || a.endTime - b.endTime);
}
