import { isPlainObject, isString } from '../predicate';

type ClassPrimitive = string | Record<string, unknown> | false | null | undefined;
/** @internal */
export type ClassValue = ClassPrimitive | readonly string[] | readonly ClassPrimitive[];

/** @internal */
export type ClassName<State, Value = string | undefined> = Value | ((state: State) => Value);

/**
 * Resolve a static or state-derived class name.
 *
 * @internal
 */
export function resolveClassName<State, Value>(className: ClassName<State, Value>, state: State): Value {
  return typeof className === 'function' ? (className as (state: State) => Value)(state) : className;
}

/**
 * A (very basic) utility to merge class names and make them a little easier to read. Aims to replicate the API of
 * popular libraries like `clsx` and `classnames` but with a much simpler implementation. This is not intended to be a
 * full replacement for those libraries, but it should be sufficient for our use case. It also allows us to avoid adding
 * an additional dependency to our packages.
 *
 * @example
 *   ```ts
 *   cn('foo', { bar: true, baz: false }, 'qux');
 *   // => 'foo bar qux'
 *   ```;
 *
 * @internal
 */
export function cn(...classes: ClassValue[]): string {
  const result: string[] = [];

  for (const value of classes.flat()) {
    if (isString(value) && value) {
      result.push(value);
    } else if (isPlainObject(value)) {
      for (const key in value) {
        if (value[key]) {
          result.push(key);
        }
      }
    }
  }

  return result.join(' ');
}
