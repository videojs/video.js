/**
 * A throttled function that can be cancelled.
 *
 * @internal
 */
export interface RafThrottled<Args extends unknown[]> {
  (...args: Args): void;
  /** Cancel any pending animation frame. */
  cancel(): void;
}

/**
 * Throttle a function to fire at most once per animation frame.
 *
 * @internal
 */
export function rafThrottle<Args extends unknown[]>(fn: (...args: Args) => void): RafThrottled<Args> {
  let rafId: number | null = null;
  let latestArgs: Args;

  const throttled = (...args: Args): void => {
    latestArgs = args;

    if (rafId !== null) return;

    rafId = requestAnimationFrame(() => {
      rafId = null;
      fn(...latestArgs);
    });
  };

  throttled.cancel = (): void => {
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  };

  return throttled;
}
