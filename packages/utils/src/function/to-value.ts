/**
 * A value, or a function that produces it when asked.
 *
 * For config that is read at use time rather than at setup: a per-request URL or header can be supplied as a function
 * that reads whatever is current, so the thing holding the config is not rebuilt when the underlying value changes.
 * `undefined`, given outright or returned, means "nothing configured".
 *
 * @internal
 */
export type ValueOrFunction<T> = T | undefined | (() => T | undefined);

/**
 * Unwrap a {@link ValueOrFunction} to its value, calling the function if that is what was given.
 *
 * A function that throws answers `undefined`: callers may be inside a synchronous pass where one bad producer must not
 * fail the whole pass, and a value that cannot be produced is unusable anyway.
 *
 * @example
 *   ```ts
 *   toValue('https://a.example'); // 'https://a.example'
 *   toValue(() => current?.url); // whatever `current.url` is right now
 *   toValue(undefined); // undefined
 *   ```;
 *
 * @internal
 */
export function toValue<T>(value: ValueOrFunction<T>): T | undefined {
  if (typeof value !== 'function') return value;

  try {
    return (value as () => T | undefined)();
  } catch {
    return undefined;
  }
}
