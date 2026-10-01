import { isNil } from '../predicate';

/**
 * Composes multiple callbacks into one. All callbacks receive same args, no return value. Returns undefined if no
 * callbacks provided.
 *
 * @example
 *   ```ts
 *   const onSetup = composeCallbacks(base.onSetup, extension.onSetup);
 *   onSetup?.(ctx); // Calls both if defined
 *   ```;
 *
 * @internal
 */
export function composeCallbacks<T extends (...args: any[]) => void>(...fns: (T | undefined | null)[]): T | undefined {
  const defined = fns.filter((fn): fn is T => !isNil(fn));
  if (defined.length === 0) return undefined;

  if (defined.length === 1) return defined[0];

  return ((...args: Parameters<T>) => {
    defined.forEach((fn) => fn(...args));
  }) as T;
}
