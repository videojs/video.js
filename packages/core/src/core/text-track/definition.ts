import type { MediaTextCue, TextTrackKind } from '@videojs/media';

import type { InferSchemaOutput, StandardSchemaV1 } from './schema';

declare const CUE_TYPE: unique symbol;

/** What identifies a text track: its kind, and optionally its label and language. */
export interface TextTrackIdentity {
  readonly kind: TextTrackKind;
  readonly label?: string | undefined;
  readonly language?: string | undefined;
}

/**
 * A text track defined once with the type of its cues, to provide and to read with. Works anywhere a text track filter
 * does, matching by kind, label, and language.
 */
export interface TextTrackDefinition<Cue extends MediaTextCue = MediaTextCue> extends TextTrackIdentity {
  /** Checks each cue's `value` where it's read. Cues whose value fails are skipped. */
  readonly schema?: StandardSchemaV1 | undefined;
  /** Type-only: the cues read through this definition. */
  readonly [CUE_TYPE]?: Cue;
}

/** The cue type a text track definition reads. */
export type InferTextTrackCue<Definition> = Definition extends TextTrackDefinition<infer Cue> ? Cue : MediaTextCue;

/**
 * Define a text track whose cues carry a `value` checked by a schema, such as one from zod or valibot. Cues whose value
 * fails it are skipped where they're read.
 *
 * ```ts
 * const quizTrack = defineTextTrack({ kind: 'metadata', label: 'quiz', schema: QuizSchema });
 * ```
 *
 * @param init - The track's kind, and optionally its label and language, with a [Standard
 *   Schema](https://standardschema.dev) for its cue values.
 * @label With Schema
 * @public
 */
export function defineTextTrack<Schema extends StandardSchemaV1>(
  init: TextTrackIdentity & { schema: Schema }
): TextTrackDefinition<MediaTextCue<InferSchemaOutput<Schema>>>;
/**
 * Define a text track whose cues carry a `value` of a given type. The type is not checked at runtime; pass a `schema`
 * for that.
 *
 * ```ts
 * const quizTrack = defineTextTrack<Quiz>({ kind: 'metadata', label: 'quiz' });
 * ```
 *
 * @param init - The track's kind, and optionally its label and language.
 * @label With Type
 */
export function defineTextTrack<Value = unknown>(init: TextTrackIdentity): TextTrackDefinition<MediaTextCue<Value>>;
export function defineTextTrack(init: TextTrackIdentity & { schema?: StandardSchemaV1 }): TextTrackDefinition {
  return Object.freeze({ ...init });
}
