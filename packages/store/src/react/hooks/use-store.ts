'use client';

import { identity, noop } from '@videojs/utils/function';
import { isFunction } from '@videojs/utils/predicate';
import { useMemo } from 'react';

import type { AnyStore, InferStoreState } from '../../core/store';
import { type Comparator, type Selector, useSelector } from './use-selector';

const noopSubscribe = () => noop;

/**
 * Access store state and actions.
 *
 * Without selector: Returns the store, does NOT subscribe to changes. With selector: Returns selected state, re-renders
 * when selected state changes (shallowEqual).
 *
 * @example
 *   ```tsx
 *   // Store access (no subscription) - access actions, subscribe without re-render
 *   function Controls() {
 *     const { setVolume } = useStore(store);
 *   }
 *
 *   // Selector-based subscription - re-renders when paused changes
 *   function PlayButton() {
 *     const paused = useStore(store, (s) => s.paused);
 *     return <button>{paused ? 'Play' : 'Pause'}</button>;
 *   }
 *   ```;
 */
/** @label Without Selector */
export function useStore<S extends AnyStore>(store: S): S;

/**
 * Select a value from the store. Re-renders when the selected value changes (shallowEqual).
 *
 * @param selector - Derives a value from the store state.
 * @param isEqual - Custom equality function. Defaults to `shallowEqual`.
 * @label With Selector
 */
export function useStore<S extends AnyStore, R>(
  store: S,
  selector: Selector<InferStoreState<S>, R>,
  isEqual?: Comparator<R>
): R;

export function useStore(store: AnyStore, selector?: Selector<any, any>, isEqual?: Comparator<any>) {
  const hasSelector = isFunction(selector);

  // Keyed on whether a selector exists, not its identity, so an inline selector does not resubscribe every render.
  const subscribe = useMemo(
      () => (hasSelector ? (cb: () => void) => store.subscribe(cb) : noopSubscribe),
      [store, hasSelector]
    ),
    getSnapshot = useMemo(() => (hasSelector ? () => store.state : () => store), [store, hasSelector]);

  return useSelector(subscribe, getSnapshot, selector ?? identity, isEqual);
}

export namespace useStore {
  export type Result<S extends AnyStore> = S;
}
