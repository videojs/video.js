import { supportsIdleCallback } from './supports';

/**
 * Request an idle callback with cleanup. Falls back to setTimeout for Safari.
 *
 * @example
 *   ```ts
 *   const cancel = idleCallback(doWork, { timeout: 1000 });
 *   cancel(); // Cancel if needed
 *   ```;
 *
 * @internal
 */
export function idleCallback(callback: IdleRequestCallback, options?: IdleRequestOptions): () => void {
  if (supportsIdleCallback()) {
    const id = requestIdleCallback(callback, options);

    return () => cancelIdleCallback(id);
  }

  // Fallback for Safari and other browsers without requestIdleCallback
  const id = setTimeout(() => {
    callback({
      didTimeout: false,
      timeRemaining: () => 50, // Approximate idle time
    });
  }, 1);

  return () => clearTimeout(id);
}
