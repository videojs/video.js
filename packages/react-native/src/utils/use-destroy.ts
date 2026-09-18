import { isNull } from '@videojs/utils/predicate';
import { useEffect, useRef } from 'react';

import { useLatestRef } from './use-latest-ref';

interface Destroyable {
  destroy(): void;
}

/**
 * Destroy an instance on unmount, deferring destruction to survive React
 * StrictMode's simulated unmount/re-mount cycle.
 *
 * StrictMode runs effects, then immediately runs cleanup, then re-runs
 * effects — all synchronously. By deferring `destroy()` to a macrotask,
 * the re-mount effect can cancel it before it fires.
 *
 * @param instance - Object with a `destroy()` method.
 * @param setup - Optional setup called on first mount. Skipped on StrictMode
 *   re-mount since the previous setup was never torn down.
 * @param teardown - Optional teardown called right before `destroy()` on real
 *   unmount. Skipped on StrictMode simulated unmount.
 */
export function useDestroy(instance: Destroyable, setup?: () => void, teardown?: () => void): void {
  const pendingRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const setupRef = useLatestRef(setup);
  const teardownRef = useLatestRef(teardown);

  useEffect(() => {
    if (!isNull(pendingRef.current)) {
      clearTimeout(pendingRef.current);
      pendingRef.current = null;
    } else {
      setupRef.current?.();
    }

    return () => {
      pendingRef.current = setTimeout(() => {
        teardownRef.current?.();
        instance.destroy();
      }, 0);
    };
  }, [instance]);
}
