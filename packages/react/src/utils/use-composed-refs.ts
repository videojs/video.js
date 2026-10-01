'use client';

import { isFunction } from '@videojs/utils/predicate';
import type { Ref, RefCallback } from 'react';
import { useCallback } from 'react';

type OptionalRef<T> = Ref<T> | undefined;

/**
 * Set a given ref to a given value.
 *
 * Handles both callback refs and RefObject(s).
 *
 * @returns Cleanup function if the ref callback returned one (React 19+)
 */
function setRef<T>(ref: OptionalRef<T>, value: T): (() => void) | void | undefined {
  if (isFunction(ref)) {
    return ref(value);
  } else if (ref !== null && ref !== undefined) {
    ref.current = value;
  }
}

/**
 * Compose multiple refs into a single callback ref.
 *
 * @example
 *   ```tsx
 *   const composedRef = composeRefs(ref1, ref2, ref3);
 *   return <div ref={composedRef} />;
 *   ```;
 *
 * @internal
 */
export function composeRefs<T>(...refs: (OptionalRef<T> | OptionalRef<T>[])[]): RefCallback<T> {
  const flatRefs = refs.flat();

  return (node): (() => void) | void => {
    const cleanups = flatRefs.map((ref) => setRef(ref, node));

    // Only return cleanup if any refs returned one (React 19+).
    // React 18 handles cleanup by calling the ref callback with null.
    if (cleanups.some(isFunction)) {
      return () => {
        for (let i = 0; i < cleanups.length; i++) {
          const cleanup = cleanups[i];

          if (isFunction(cleanup)) {
            cleanup();
          } else {
            setRef(flatRefs[i], null);
          }
        }
      };
    }
  };
}

/**
 * Hook that composes multiple refs into a single callback ref.
 *
 * Memoized for stable reference.
 *
 * @example
 *   ```tsx
 *   const composedRef = useComposedRefs(forwardedRef, localRef);
 *   return <div ref={composedRef} />;
 *   ```;
 *
 * @param refs - Refs to update from the returned callback.
 */
export function useComposedRefs<T>(...refs: OptionalRef<T>[]): RefCallback<T> {
  return useCallback(composeRefs(...refs), [...refs]);
}
