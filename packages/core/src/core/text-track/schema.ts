import { noop } from '@videojs/utils/function';
import { isFunction, isObject } from '@videojs/utils/predicate';

/**
 * A [Standard Schema](https://standardschema.dev), the one validation interface zod, valibot, arktype, and others
 * implement. Copied from the spec, which is meant to be copied, so no schema library is a dependency.
 */
export interface StandardSchemaV1<Input = unknown, Output = Input> {
  readonly '~standard': StandardSchemaV1Props<Input, Output>;
}

/** The properties a {@link StandardSchemaV1} carries under its `~standard` key. */
export interface StandardSchemaV1Props<Input = unknown, Output = Input> {
  readonly version: 1;
  readonly vendor: string;
  readonly validate: (value: unknown) => StandardSchemaV1Result<Output> | Promise<StandardSchemaV1Result<Output>>;
  readonly types?: { readonly input: Input; readonly output: Output } | undefined;
}

/** What a {@link StandardSchemaV1} returns: the parsed value, or the issues that failed it. */
export type StandardSchemaV1Result<Output> =
  | { readonly value: Output; readonly issues?: undefined }
  | { readonly issues: readonly { readonly message: string }[] };

/**
 * The value type a schema produces.
 *
 * @experimental
 */
export type InferSchemaOutput<Schema extends StandardSchemaV1> = NonNullable<Schema['~standard']['types']>['output'];

/**
 * Check a value against a schema. Returns the parsed value, or `undefined` when it fails. Schemas must be synchronous;
 * an asynchronous one fails every value.
 *
 * @internal
 */
export function parseWithSchema<Output>(
  schema: StandardSchemaV1<unknown, Output>,
  value: unknown
): { value: Output } | undefined {
  const result = schema['~standard'].validate(value);

  if (isThenable(result)) {
    if (__DEV__) console.warn('[vjs-core] text track schemas must be synchronous; this one returned a promise.');

    // Nothing waits for the result, so a rejection mustn't surface as an unhandled one.
    result.then(undefined, noop);

    return undefined;
  }

  if (result.issues) {
    if (__DEV__) console.warn('[vjs-core] a cue value failed its text track schema:', result.issues, value);

    return undefined;
  }

  return { value: result.value };
}

/** A promise from any realm, such as one a schema built in an iframe returns, which isn't this realm's `Promise`. */
function isThenable(value: unknown): value is PromiseLike<unknown> {
  return isObject(value) && isFunction((value as PromiseLike<unknown>).then);
}
