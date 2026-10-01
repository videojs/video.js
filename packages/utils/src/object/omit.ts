/**
 * Creates a new object without the specified keys.
 *
 * @example
 *   const obj = { a: 1, b: 2, c: 3 };
 *   omit(obj, ['b']); // { a: 1, c: 3 }
 *
 * @internal
 */
export function omit<T extends Record<string, unknown>, K extends keyof T>(obj: T, keys: readonly K[]): Omit<T, K> {
  const result = {} as Record<string, unknown>;

  for (const key in obj) {
    if (!keys.includes(key as unknown as K)) {
      result[key] = obj[key];
    }
  }

  return result as Omit<T, K>;
}
