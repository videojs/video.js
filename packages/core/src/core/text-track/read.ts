import type { MediaTextCue, MediaTextTrack, MediaTrackCues, TextTrackFilter } from '@videojs/media';
import { isFunction } from '@videojs/utils/predicate';

import type { TextTrackDefinition } from './definition';
import { matchTextTrack } from './filter';
import { parseWithSchema, type StandardSchemaV1 } from './schema';

/**
 * Player state that lists text tracks, such as the player store.
 *
 * @internal
 */
export interface TextTracksSource {
  readonly textTrackList: readonly MediaTextTrack[];
}

/**
 * Player state that carries text cues, such as the player store.
 *
 * @internal
 */
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
 * @internal
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
 * @internal
 */
export function getTextCues<Cue extends MediaTextCue>(source: TextCuesSource, track: TextTrackDefinition<Cue>): Cue[];
/**
 * Every cue on the tracks a filter matches.
 *
 * @internal
 */
export function getTextCues(source: TextCuesSource, filter?: TextTrackFilter): MediaTextCue[];
export function getTextCues(
  source: TextCuesSource,
  filter: TextTrackFilter | TextTrackDefinition = {}
): MediaTextCue[] {
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
 * @internal
 */
export function getActiveTextCues<Cue extends MediaTextCue>(
  source: TextCuesSource,
  track: TextTrackDefinition<Cue>
): Cue[];
/**
 * The cues active now on the tracks a filter matches.
 *
 * @internal
 */
export function getActiveTextCues(source: TextCuesSource, filter?: TextTrackFilter): MediaTextCue[];
export function getActiveTextCues(
  source: TextCuesSource,
  filter: TextTrackFilter | TextTrackDefinition = {}
): MediaTextCue[] {
  return readCues(source, filter, 'activeCues');
}

/** Cue reads checked against a schema, kept per schema and cue so each cue is checked once. */
const parsedCues = new WeakMap<StandardSchemaV1, WeakMap<MediaTextCue, MediaTextCue | null>>();

function readCues(
  source: TextCuesSource,
  filter: TextTrackFilter | TextTrackDefinition,
  list: 'cues' | 'activeCues'
): MediaTextCue[] {
  const schema = !isFunction(filter) && 'schema' in filter ? filter.schema : undefined;
  const result: MediaTextCue[] = [];
  let tracks = 0;

  for (const entry of source.textCues) {
    if (!matchTextTrack(entry.track, filter)) continue;

    tracks++;

    for (const cue of entry[list]) {
      const read = schema ? parseCue(cue, schema) : cue;

      if (read) result.push(read);
    }
  }

  // Each track's cues are already in order; cues from several tracks are merged by time.
  if (tracks > 1) result.sort((a, b) => a.startTime - b.startTime || a.endTime - b.endTime);

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
