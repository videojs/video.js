/**
 * Creates a new object with only the specified keys.
 *
 * @example
 *   const obj = { a: 1, b: 2, c: 3 };
 *   pick(obj, ['a', 'c']); // { a: 1, c: 3 }
 *
 * @internal
 */
export function pick<T extends Record<string, unknown>, K extends keyof T>(obj: T, keys: readonly K[]): Pick<T, K> {
  const result = {} as Pick<T, K>;

  for (const key of keys) {
    if (Object.hasOwn(obj, key)) {
      result[key] = obj[key];
    }
  }

  return result;
}
