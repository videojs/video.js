import type { MediaTextCue } from '@videojs/media';
import { isUndefined } from '@videojs/utils/predicate';

import type { TextTrackDefinition, TextTrackIdentity } from './definition';

/** A cue an app adds to the player. Plain, JSON-serializable data, so it works on the server too. */
export interface TextCueInit<Value = unknown> {
  /** Defaults, when missing or empty, to an id unique within the track. */
  id?: string | undefined;
  startTime: number;
  /**
   * Omit for a point, which stays active for one second. In a chapters track, a chapter without an end runs to the next
   * one, and the last to the end of the media.
   */
  endTime?: number | undefined;
  text?: string | undefined;
  /** Structured, JSON-serializable data, named after the platform's `DataCue`. */
  value?: Value | undefined;
  /** What `value` holds, also named after `DataCue`. */
  type?: string | undefined;
}

/**
 * The cues a `format` read from a file: an array, or an object with a `cues` array, the same shapes a JSON file can
 * hold. A parser's result that carries its cues as `cues` fits as is.
 */
export type TextCueFormatResult<Value = unknown> =
  | readonly TextCueInit<Value>[]
  | { readonly cues: readonly TextCueInit<Value>[] };

/**
 * Reads the text of a file into cues, for a format the player doesn't read itself, such as Podcasting 2.0 chapters or
 * SRT. It can return a promise, so a parser can be loaded only once a file needs it.
 */
export type TextCueFormat<Value = unknown> = (
  text: string
) => TextCueFormatResult<Value> | Promise<TextCueFormatResult<Value>>;

/** What a track an app adds carries: cues, a file to load them from, or both. */
export interface TextTrackContent<Value = unknown> {
  cues?: readonly TextCueInit<Value>[] | undefined;
  /**
   * A file to load cues from, fetched once the player is on the client. Without a `format`, it's WebVTT, or JSON that
   * is an array of cues or an object with a `cues` array.
   */
  src?: string | undefined;
  /** Reads the `src` file's text into cues, in place of the player's own WebVTT and JSON reading. */
  format?: TextCueFormat<Value> | undefined;
}

/** A track an app adds to the player: what identifies it, and what it carries. */
export interface TextTrackInit<Value = unknown> extends TextTrackIdentity, TextTrackContent<Value> {}

/**
 * A track an app added to the player. It belongs to the source playing when it was added, or the first one if there was
 * none yet, and is cleared when the source changes or the media is swapped.
 */
export interface AppTextTrack<Value = unknown> {
  /** The track's id in `textTrackList`. */
  readonly id: string;
  /** Whether the track is gone, removed by the app or cleared with its source. */
  readonly removed: boolean;
  addCue(cue: TextCueInit<Value>): void;
  removeCue(id: string): void;
  remove(): void;
}

/** The value type of a cue type. */
export type InferCueValue<Cue> = Cue extends MediaTextCue<infer Value> ? Value : unknown;

/** Adds a text track to the player, from a track definition or a plain description. */
export interface AddTextTrack {
  /**
   * Add a track defined with `defineTextTrack()`. Its cues are checked against the definition's type.
   *
   * ```ts
   * const quiz = player.store.addTextTrack(quizTrack, { cues });
   * ```
   */
  <Cue extends MediaTextCue>(
    track: TextTrackDefinition<Cue>,
    content?: TextTrackContent<InferCueValue<Cue>>
  ): AppTextTrack<InferCueValue<Cue>>;
  /**
   * Add a track from a plain description.
   *
   * ```ts
   * const quiz = player.store.addTextTrack({ kind: 'metadata', label: 'quiz', cues });
   * ```
   */
  <Value = unknown>(init: TextTrackInit<Value>): AppTextTrack<Value>;
}

/**
 * A cue an app added, as plain store data. A point's end is its start.
 *
 * @internal
 */
export function toAppCue(cue: TextCueInit, id: string): MediaTextCue {
  const result: MediaTextCue = {
    // Parsers leave a cue without an id empty, as the platform's cues do.
    id: cue.id || id,
    startTime: cue.startTime,
    endTime: cue.endTime ?? cue.startTime,
    text: cue.text ?? '',
  };

  if (!isUndefined(cue.value)) result.value = cue.value;

  if (cue.type) result.type = cue.type;

  return result;
}
