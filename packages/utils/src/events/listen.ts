/**
 * Listener options every event target understands, including `EventTargetLike` emitters that ignore the rest.
 *
 * @internal
 */
export interface ListenOptions {
  signal?: AbortSignal;
}

/**
 * Anything that adds and removes listeners: DOM targets, React Native's polyfilled `EventTarget`, and hand-rolled
 * `EventTargetLike` emitters.
 *
 * @internal
 */
export interface ListenTarget {
  addEventListener(type: string, listener: AnyListener, options?: ListenOptions): void;
  removeEventListener(type: string, listener: AnyListener): void;
}

// `any` rather than `never`: callback parameters are checked strictly, so only `any` lets typed DOM and
// `EventTargetLike` listener signatures both satisfy the shape.
type AnyListener = (event: any) => void;

/**
 * Add an event listener and return a cleanup function to remove it.
 *
 * The DOM-free counterpart of `listen` from `@videojs/utils/dom`, for code that must run against any event target.
 *
 * @example
 *   ```ts
 *   const cleanup = listen(media, 'play', () => console.log('playing'));
 *   cleanup(); // Remove listener
 *   ```;
 *
 * @internal
 */
export function listen<Event = unknown>(
  target: ListenTarget,
  type: string,
  listener: (event: Event) => void,
  options?: ListenOptions
): () => void {
  target.addEventListener(type, listener, options);
  return () => target.removeEventListener(type, listener);
}

/**
 * Wait for an event to occur on a target. Rejects with the signal's reason if `options.signal` aborts first.
 *
 * Removes its listener itself rather than relying on `once`, which `EventTargetLike` emitters need not support.
 *
 * @internal
 */
export function onEvent<Event = unknown>(target: ListenTarget, type: string, options?: ListenOptions): Promise<Event> {
  return new Promise((resolve, reject) => {
    const signal = options?.signal;

    if (signal?.aborted) {
      reject(signal.reason ?? 'Aborted');
      return;
    }

    const onAbort = () => {
      target.removeEventListener(type, onFire);
      reject(signal?.reason ?? 'Aborted');
    };

    const onFire = (event: Event) => {
      target.removeEventListener(type, onFire);
      signal?.removeEventListener('abort', onAbort);
      resolve(event);
    };

    signal?.addEventListener('abort', onAbort, { once: true });
    target.addEventListener(type, onFire);
  });
}
