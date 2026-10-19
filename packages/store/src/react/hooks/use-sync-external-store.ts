'use client';

import * as React from 'react';
import { useEffect, useLayoutEffect, useState } from 'react';

type Subscribe = (onStoreChange: () => void) => () => void;

interface SnapshotInstance<T> {
  value: T;
  getSnapshot: () => T;
}

function didSnapshotChange<T>(inst: SnapshotInstance<T>): boolean {
  try {
    return !Object.is(inst.value, inst.getSnapshot());
  } catch {
    return true;
  }
}

/**
 * Stands in for `useSyncExternalStore` before React 18, as React's own shim does: render with the current snapshot,
 * then re-render when it changed before the subscription started or whenever the store notifies.
 */
function useSyncExternalStoreFallback<T>(subscribe: Subscribe, getSnapshot: () => T): T {
  // The instance is mutated in effects on purpose; compiler memoization would read it stale.
  'use no memo';

  const value = getSnapshot();
  const [{ inst }, forceUpdate] = useState(() => ({ inst: { value, getSnapshot } }));

  useLayoutEffect(() => {
    inst.value = value;
    inst.getSnapshot = getSnapshot;

    if (didSnapshotChange(inst)) forceUpdate({ inst });
  }, [inst, subscribe, value, getSnapshot]);

  useEffect(() => {
    if (didSnapshotChange(inst)) forceUpdate({ inst });

    return subscribe(() => {
      if (didSnapshotChange(inst)) forceUpdate({ inst });
    });
  }, [inst, subscribe]);

  return value;
}

/**
 * React's `useSyncExternalStore`, with a fallback for React 16 and 17. A dynamic read keeps bundlers that know the
 * exports of those versions from failing the build over a static import that does not exist there.
 *
 * @internal
 */
export const useSyncExternalStore: <T>(subscribe: Subscribe, getSnapshot: () => T, getServerSnapshot?: () => T) => T =
  Reflect.get(React, 'useSyncExternalStore') ?? useSyncExternalStoreFallback;
