/** Type-only brand carried by {@link KeyedBy}. Declared, never assigned: no value has it. */
declare const keyedBy: unique symbol;

/**
 * A config record whose keys must be the `Id` values of the entries in the same config's `Source` list. At runtime it's
 * an ordinary partial record; the brand only lets {@link CheckKeyedFields} find the field and its source.
 *
 * @example
 *   ```ts
 *   interface Config {
 *   keySystems: readonly KeySystemModule[];
 *   // Keys must be the `keySystem` ids of the modules in `keySystems`.
 *   drm: KeyedBy<'keySystems', 'keySystem', DrmSystemConfig>;
 *   }
 *   ```;
 */
export type KeyedBy<Source extends string, Id extends string, Value> = Partial<Record<string, Value>> & {
  readonly [keyedBy]?: { readonly source: Source; readonly id: Id };
};

// Requires `T` to declare the brand key: an optional property alone would match any type, primitives included.
type KeyedByLink<T> = typeof keyedBy extends keyof T
  ? NonNullable<T[typeof keyedBy]> extends infer Link
    ? Link extends { readonly source: infer Source extends string; readonly id: infer Id extends string }
      ? { source: Source; id: Id }
      : never
    : never
  : never;

/** The source list a keyed field reads: `C`'s when the caller set it, else the composition default's. */
type SourceList<C, Defaults, Source extends string> = Source extends keyof C
  ? NonNullable<C[Source]> extends readonly unknown[]
    ? NonNullable<C[Source]>
    : DefaultSourceList<Defaults, Source>
  : DefaultSourceList<Defaults, Source>;

type DefaultSourceList<Defaults, Source extends string> = Source extends keyof Defaults ? Defaults[Source] : never;

type AllowedIds<List, Id extends string> = List extends readonly (infer Entry)[]
  ? Entry extends { readonly [K in Id]: infer Value }
    ? Value
    : never
  : never;

/**
 * The keys `C` gives a keyed field, as string literals. `never` when they're plain `string`, as for a record built from
 * runtime data: there's nothing to check until the keys are known.
 */
type LiteralKeys<Value> =
  string extends Extract<keyof NonNullable<Value>, string> ? never : Extract<keyof NonNullable<Value>, string>;

/** One keyed field's violation: the keys `C` gives it that aren't ids from its source, or `never` when there are none. */
type FieldViolation<K, Link, C, Defaults> = Link extends {
  source: infer Source extends string;
  id: infer Id extends string;
}
  ? K extends keyof C
    ? [Exclude<LiteralKeys<C[K]>, AllowedIds<SourceList<C, Defaults, Source>, Id>>] extends [never]
      ? never
      : { field: K; notIn: Source; keys: Exclude<LiteralKeys<C[K]>, AllowedIds<SourceList<C, Defaults, Source>, Id>> }
    : never
  : never;

/** Each keyed field of `Cfg` whose keys in `C` aren't ids from its source, with the offending keys. */
type KeyedFieldViolations<Cfg, C, Defaults> = {
  // `[…] extends [never]` first: an unkeyed field's link is `never`, and `never` would match any pattern below.
  [K in keyof Cfg]-?: [KeyedByLink<NonNullable<Cfg[K]>>] extends [never]
    ? never
    : FieldViolation<K, KeyedByLink<NonNullable<Cfg[K]>>, C, Defaults>;
}[keyof Cfg];

/**
 * `unknown` when every {@link KeyedBy} field in config `C` is keyed by ids its source lists; otherwise an error tag
 * naming the field and the keys that aren't. `Cfg` is the composition's config type (where the brands are), `Defaults`
 * its `defaultConfig`, read for a source `C` leaves out.
 */
export type CheckKeyedFields<Cfg, C, Defaults> = [KeyedFieldViolations<Cfg, C, Defaults>] extends [never]
  ? unknown
  : { 'Error: a keyed config field names ids its source list does not': KeyedFieldViolations<Cfg, C, Defaults> };
