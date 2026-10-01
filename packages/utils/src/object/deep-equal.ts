import { isPlainObject, isUndefined } from '../predicate';

/**
 * Deep structural equality for plain objects, arrays, and primitives. Keys explicitly set to `undefined` are treated as
 * absent (matching JSON semantics), leaf values are compared with `Object.is`, and non-plain objects (class instances,
 * Maps, Sets, etc.) are only equal by reference.
 *
 * @example
 *   ```ts
 *   deepEqual({ a: [1, { b: 2 }] }, { a: [1, { b: 2 }] }); // true
 *   deepEqual({ a: 1, b: undefined }, { a: 1 }); // true
 *   ```;
 *
 * @internal
 */
export function deepEqual(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;

  if (Array.isArray(a) || Array.isArray(b)) {
    return (
      Array.isArray(a) && Array.isArray(b) && a.length === b.length && a.every((value, i) => deepEqual(value, b[i]))
    );
  }

  if (!isPlainObject(a) || !isPlainObject(b)) return false;

  const keysA = Object.keys(a).filter((key) => !isUndefined(a[key]));
  const keysB = Object.keys(b).filter((key) => !isUndefined(b[key]));

  return keysA.length === keysB.length && keysA.every((key) => deepEqual(a[key], b[key]));
}
