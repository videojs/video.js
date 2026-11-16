'use client';

import { useRef, useState } from 'react';

import { useDestroy } from './use-destroy';
import { useLatestRef } from './use-latest-ref';

interface Destroyable {
  destroy(): void;
}

export interface UseInstanceOptions<Instance> {
  /** Runs when an instance mounts. Skipped on StrictMode's simulated re-mount. */
  setup?: (instance: Instance) => void;
  /** Runs right before `destroy()` on a real unmount or an `<Activity>` hide. */
  teardown?: (instance: Instance) => void;
}

/**
 * Create an instance that is destroyed on unmount and recreated if it was destroyed while the component's state
 * survived, as when a React `<Activity>` is hidden and shown again.
 *
 * @param create - Factory for the instance. The latest factory is used when the instance is recreated.
 * @param options - Optional setup and teardown hooks for each instance.
 * @internal
 */
export function useInstance<Instance extends Destroyable>(
  create: () => Instance,
  options?: UseInstanceOptions<Instance>
): Instance {
  const [instance, setInstance] = useState(create);
  const destroyedRef = useRef(false);
  const createRef = useLatestRef(create);
  const optionsRef = useLatestRef(options);

  useDestroy(
    instance,
    () => {
      // Re-mounted after the deferred destroy fired. Setup runs for the replacement on its own mount.
      if (destroyedRef.current) {
        destroyedRef.current = false;
        setInstance(createRef.current());
        return;
      }

      optionsRef.current?.setup?.(instance);
    },
    () => {
      destroyedRef.current = true;
      optionsRef.current?.teardown?.(instance);
    }
  );

  return instance;
}
