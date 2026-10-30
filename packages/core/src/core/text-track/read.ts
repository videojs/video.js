import type { MediaTextCue, MediaTextTrack, MediaTrackCues, TextTrackFilter } from '@videojs/media';
import { isFunction } from '@videojs/utils/predicate';

import type { TextTrackDefinition } from './definition';
import { matchTextTrack } from './filter';
import { parseWithSchema, type StandardSchemaV1 } from './schema';

/** Player state that lists text tracks, such as the player store. */
export interface TextTracksSource {
  readonly textTrackList: readonly MediaTextTrack[];
}

/** Player state that carries text cues, such as the player store. */
export interface TextCuesSource {
  readonly textCues: readonly MediaTrackCues[];
}

/**
 * The text tracks a filter or track definition matches, from the media or the app.
 *
 * ```ts
 * const chapters = getTextTracks(player.store, { kind: 'chapters' });
 * ```
 *
 * @param source - State that lists text tracks, such as the player store.
 * @param filter - Picks tracks by kind, label, or language, or with a function. Defaults to every track.
 * @public
 */
export function getTextTracks(
  source: TextTracksSource,
  filter: TextTrackFilter | TextTrackDefinition = {}
): MediaTextTrack[] {
  return source.textTrackList.filter((track) => matchTextTrack(track, filter));
}

/**
 * Every cue on the tracks a track definition matches, typed by the definition. With a schema, cues whose value fails it
 * are skipped.
 *
 * ```ts
 * const questions = getTextCues(player.store, quizTrack);
 * ```
 *
 * @param source - State that carries text cues, such as the player store.
 * @param track - The track definition to read.
 * @label With Definition
 * @public
 */
export function getTextCues<Cue extends MediaTextCue>(
  source: TextCuesSource,
  track: TextTrackDefinition<Cue>
): readonly Cue[];
/**
 * Every cue on the tracks a filter matches, from the media or the app.
 *
 * @param source - State that carries text cues, such as the player store.
 * @param filter - Picks tracks by kind, label, or language, or with a function. Defaults to every track being read.
 * @label With Filter
 */
export function getTextCues(source: TextCuesSource, filter?: TextTrackFilter): readonly MediaTextCue[];
export function getTextCues(
  source: TextCuesSource,
  filter: TextTrackFilter | TextTrackDefinition = ALL_TRACKS
): readonly MediaTextCue[] {
  return readCues(source, filter, 'cues');
}

/**
 * The cues active now on the tracks a track definition matches, typed by the definition. With a schema, cues whose
 * value fails it are skipped.
 *
 * ```ts
 * player.store.subscribe(() => {
 *   const [question] = getActiveTextCues(player.store, quizTrack);
 * });
 * ```
 *
 * @param source - State that carries text cues, such as the player store.
 * @param track - The track definition to read.
 * @label With Definition
 * @public
 */
export function getActiveTextCues<Cue extends MediaTextCue>(
  source: TextCuesSource,
  track: TextTrackDefinition<Cue>
): readonly Cue[];
/**
 * The cues active now on the tracks a filter matches, from the media or the app.
 *
 * @param source - State that carries text cues, such as the player store.
 * @param filter - Picks tracks by kind, label, or language, or with a function. Defaults to every track being read.
 * @label With Filter
 */
export function getActiveTextCues(source: TextCuesSource, filter?: TextTrackFilter): readonly MediaTextCue[];
export function getActiveTextCues(
  source: TextCuesSource,
  filter: TextTrackFilter | TextTrackDefinition = ALL_TRACKS
): readonly MediaTextCue[] {
  return readCues(source, filter, 'activeCues');
}

const ALL_TRACKS: TextTrackFilter = Object.freeze({});

type CueList = 'cues' | 'activeCues';

/** Cue reads checked against a schema, kept per schema and cue so each cue is checked once. */
const parsedCues = new WeakMap<StandardSchemaV1, WeakMap<MediaTextCue, MediaTextCue | null>>();

/**
 * Reads kept per store cue state and filter. Readers run on every store change, most of which leave the cues alone, so
 * reading through the same filter again returns the same array instead of building a new one.
 */
const reads = new WeakMap<
  readonly MediaTrackCues[],
  WeakMap<TextTrackFilter | TextTrackDefinition, Partial<Record<CueList, readonly MediaTextCue[]>>>
>();

function readCues(
  source: TextCuesSource,
  filter: TextTrackFilter | TextTrackDefinition,
  list: CueList
): readonly MediaTextCue[] {
  let byFilter = reads.get(source.textCues);

  if (!byFilter) {
    byFilter = new WeakMap();
    reads.set(source.textCues, byFilter);
  }

  const kept = byFilter.get(filter);
  const cached = kept?.[list];
  if (cached) return cached;

  const result = matchCues(source.textCues, filter, list);

  byFilter.set(filter, { ...kept, [list]: result });

  return result;
}

function matchCues(
  textCues: readonly MediaTrackCues[],
  filter: TextTrackFilter | TextTrackDefinition,
  list: CueList
): readonly MediaTextCue[] {
  const schema = !isFunction(filter) && 'schema' in filter ? filter.schema : undefined;
  const entries = textCues.filter((entry) => matchTextTrack(entry.track, filter));
  // One track's list is already in order, so without a schema it's read as the store holds it, keeping its identity
  // until that track's cues change.
  if (entries.length === 1 && !schema) return entries[0]![list];

  const result: MediaTextCue[] = [];

  for (const entry of entries) {
    for (const cue of entry[list]) {
      const read = schema ? parseCue(cue, schema) : cue;

      if (read) result.push(read);
    }
  }

  // Cues from several tracks are merged by time.
  if (entries.length > 1) result.sort((a, b) => a.startTime - b.startTime || a.endTime - b.endTime);

  return result;
}

function parseCue(cue: MediaTextCue, schema: StandardSchemaV1): MediaTextCue | null {
  let cache = parsedCues.get(schema);

  if (!cache) {
    cache = new WeakMap();
    parsedCues.set(schema, cache);
  }

  const cached = cache.get(cue);
  if (cached !== undefined) return cached;

  const parsed = parseWithSchema(schema, cue.value);
  const read = parsed ? (Object.is(parsed.value, cue.value) ? cue : { ...cue, value: parsed.value }) : null;

  cache.set(cue, read);

  return read;
}
