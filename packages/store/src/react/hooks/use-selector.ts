'use client';

import { useCallback, useRef, useSyncExternalStore } from 'react';

import { type Comparator, type Selector, shallowEqual } from '../../core/shallow-equal';

export type { Comparator, Selector };

/**
 * Subscribe to derived state with customizable equality check.
 *
 * Low-level hook used internally by `useStore` and `useSnapshot`.
 *
 * @param subscribe - Subscribe function that returns an unsubscribe callback.
 * @param getSnapshot - Returns the current snapshot value.
 * @param selector - Derives a value from the snapshot.
 * @param isEqual - Custom equality function. Defaults to `shallowEqual`.
 */
export function useSelector<S, R>(
  subscribe: (cb: () => void) => () => void,
  getSnapshot: () => S,
  selector: Selector<S, R>,
  isEqual: Comparator<R> = shallowEqual
): R {
  const cache = useRef<R | undefined>(undefined);

  const getSelectedSnapshot = useCallback(() => {
    const next = selector(getSnapshot());
    if (cache.current !== undefined && isEqual(cache.current, next)) return cache.current;

    cache.current = next;

    return next;
  }, [getSnapshot, selector, isEqual]);

  return useSyncExternalStore(subscribe, getSelectedSnapshot, getSelectedSnapshot);
}
