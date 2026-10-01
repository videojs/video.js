/**
 * Resolve after `ms` milliseconds. Pass a `signal` to make it cancellable: the timer is cleared and the promise rejects
 * with the signal's reason as soon as the signal aborts (including if it's already aborted).
 *
 * @internal
 */
export function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    if (signal?.aborted) {
      reject(signal.reason);
      return;
    }

    const onAbort = () => {
      clearTimeout(timer);
      reject(signal?.reason);
    };

    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, ms);

    signal?.addEventListener('abort', onAbort, { once: true });
  });
}
