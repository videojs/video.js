import type { MediaTextCue } from '@videojs/media';
import { isUndefined } from '@videojs/utils/predicate';

import type { TextTrackDefinition, TextTrackIdentity } from './definition';

/** A cue an app adds to the player. Plain, JSON-serializable data, so it works on the server too. */
export interface TextCueInit<Value = unknown> {
  /** Defaults to an id unique within the track. */
  id?: string | undefined;
  startTime: number;
  /** Omit for a point, which stays active for one second. */
  endTime?: number | undefined;
  text?: string | undefined;
  /** Structured, JSON-serializable data, named after the platform's `DataCue`. */
  value?: Value | undefined;
  /** What `value` holds, also named after `DataCue`. */
  type?: string | undefined;
}

/** What a track an app adds carries. */
export interface TextTrackContent<Value = unknown> {
  cues?: readonly TextCueInit<Value>[] | undefined;
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
    id: cue.id ?? id,
    startTime: cue.startTime,
    endTime: cue.endTime ?? cue.startTime,
    text: cue.text ?? '',
  };

  if (!isUndefined(cue.value)) result.value = cue.value;

  if (cue.type) result.type = cue.type;

  return result;
}
