'use client';

import { useEffect, useRef } from 'react';

import { useLatestRef } from './use-latest-ref';

interface Destroyable {
  destroy(): void;
}

/**
 * Destroy an instance on unmount, deferring destruction to survive React StrictMode's simulated unmount/re-mount cycle.
 *
 * StrictMode runs effects, then immediately runs cleanup, then re-runs effects — all synchronously. By deferring
 * `destroy()` to a macrotask, the re-mount effect can cancel it before it fires.
 *
 * React `<Activity>` hide runs the same cleanup but re-mounts later, after `destroy()` has fired, while keeping
 * component state. `setup` runs again on that re-mount, so `setup` and `teardown` always pair up — but the instance it
 * receives is destroyed. Use `useInstance` when the component should get a fresh instance instead.
 *
 * @param instance - Object with a `destroy()` method.
 * @param setup - Optional setup called on mount, including a re-mount after `destroy()` fired. Skipped on StrictMode
 *   re-mount since the previous setup was never torn down.
 * @param teardown - Optional teardown called right before `destroy()`. Skipped on StrictMode simulated unmount.
 */
export function useDestroy(instance: Destroyable, setup?: () => void, teardown?: () => void): void {
  const pendingRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const destroyedRef = useRef<Destroyable | null>(null);
  const setupRef = useLatestRef(setup);
  const teardownRef = useLatestRef(teardown);

  useEffect(() => {
    if (pendingRef.current !== null) {
      clearTimeout(pendingRef.current);
      pendingRef.current = null;
    } else {
      setupRef.current?.();
    }

    return () => {
      // Already destroyed while hidden; the instance is being replaced, not unmounted again.
      if (destroyedRef.current === instance) return;

      pendingRef.current = setTimeout(() => {
        pendingRef.current = null;
        destroyedRef.current = instance;
        teardownRef.current?.();
        instance.destroy();
      }, 0);
    };
  }, [instance]);
}
