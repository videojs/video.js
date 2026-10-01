/**
 * Wrap a function to catch and handle errors instead of throwing.
 *
 * @example
 *   ```ts
 *   const safeFn = tryCatch(riskyFn, (e) => logger.error(e));
 *   safeFn?.(); // Never throws
 *   ```;
 *
 * @internal
 */
export function tryCatch<T extends (...args: any[]) => unknown>(
  fn: T | undefined,
  onError: (error: unknown) => void = console.error
): T | undefined {
  if (!fn) return undefined;

  return ((...args: Parameters<T>) => {
    try {
      return fn(...args);
    } catch (error) {
      onError(error);
      return undefined;
    }
  }) as T;
}
