'use client';

import { identity } from '@videojs/utils/function';

import type { State } from '../../core/state';
import { type Comparator, type Selector, useSelector } from './use-selector';

/**
 * Subscribe to a State container's current value.
 *
 * @param state - The State container to subscribe to.
 * @param selector - Derives a value from state.
 * @param isEqual - Custom equality function. Defaults to `shallowEqual`.
 */
/** @label Without Selector */
export function useSnapshot<T extends object>(state: State<T>): T;

/**
 * Select a value from state. Re-renders when the selected value changes.
 *
 * @param selector - Derives a value from state.
 * @param isEqual - Custom equality function. Defaults to `shallowEqual`.
 * @label With Selector
 */
export function useSnapshot<T extends object, R>(state: State<T>, selector: Selector<T, R>, isEqual?: Comparator<R>): R;

export function useSnapshot(state: State<object>, selector?: Selector<any, any>, isEqual?: Comparator<any>) {
  // Fresh callbacks resubscribe every render on purpose: memoizing them breaks the dialog and menu transition tests in
  // @videojs/react, which rely on the snapshot re-check that resubscribing triggers.
  return useSelector(
    (cb) => state.subscribe(cb),
    () => state.current,
    selector ?? identity,
    isEqual
  );
}
