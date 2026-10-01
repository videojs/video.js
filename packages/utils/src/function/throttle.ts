/**
 * A throttled function that can be cancelled.
 *
 * @internal
 */
export interface Throttled<Args extends unknown[]> {
  (...args: Args): void;
  /** Cancel any pending trailing-edge invocation. */
  cancel(): void;
}

export interface ThrottleOptions {
  /**
   * When `true`, the first call invokes `fn` immediately (leading edge) and starts the cooldown window. Calls during
   * cooldown are coalesced and fire on the trailing edge. If no calls arrive during the window the next call is treated
   * as a fresh leading invocation.
   */
  leading?: boolean;
}

/**
 * Throttle: limits `fn` to at most once per `ms` window.
 *
 * - Default (no options): trailing-edge only — the first call schedules a timer; subsequent calls within the window
 *   update the arguments. The function fires once per window with the latest arguments.
 * - `{ leading: true }`: leading + trailing — the first call invokes immediately and opens a cooldown window. Subsequent
 *   calls within the window are coalesced to a single trailing-edge invocation.
 *
 * @internal
 */
export function throttle<Args extends unknown[]>(
  fn: (...args: Args) => void,
  ms: number,
  options?: ThrottleOptions
): Throttled<Args> {
  const leading = options?.leading ?? false;

  let timerId: ReturnType<typeof setTimeout> | null = null;
  let latestArgs: Args;
  let hasPending = false;

  function startCooldown(): void {
    timerId = setTimeout(() => {
      timerId = null;

      if (hasPending) {
        hasPending = false;
        fn(...latestArgs);
        startCooldown();
      }
    }, ms);
  }

  const throttled = (...args: Args): void => {
    latestArgs = args;

    if (leading) {
      if (timerId === null) {
        // No active window — fire immediately (leading edge).
        fn(...latestArgs);
        startCooldown();
      } else {
        // Inside cooldown — mark pending for trailing edge.
        hasPending = true;
      }
    } else {
      // Trailing-only (original behavior).
      if (timerId !== null) return;

      timerId = setTimeout(() => {
        timerId = null;
        fn(...latestArgs);
      }, ms);
    }
  };

  throttled.cancel = (): void => {
    if (timerId !== null) {
      clearTimeout(timerId);
      timerId = null;
    }

    hasPending = false;
  };

  return throttled;
}
