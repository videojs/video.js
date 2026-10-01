/**
 * Resolve the deepest event target, preferring composedPath for shadow DOM.
 *
 * @internal
 */
export function resolveEventTarget(event: Event): EventTarget | null {
  const path = event.composedPath();

  return path.length > 0 ? path[0]! : event.target;
}

/** @internal */
export interface OnEventOptions extends AddEventListenerOptions {
  /**
   * An AbortSignal to cancel waiting for the event.
   *
   * If aborted, the returned promise will reject with an `AbortError`.
   */
  signal?: AbortSignal;
}

/**
 * Wait for an event to occur on a target.
 *
 * @example
 *   ```ts
 *   const event = await onEvent(video, 'seeked');
 *   ```;
 *
 * @internal
 */
export function onEvent<K extends keyof HTMLMediaElementEventMap>(
  target: HTMLMediaElement,
  type: K,
  options?: OnEventOptions
): Promise<HTMLMediaElementEventMap[K]>;

/** @internal */
export function onEvent<K extends keyof HTMLElementEventMap>(
  target: HTMLElement,
  type: K,
  options?: OnEventOptions
): Promise<HTMLElementEventMap[K]>;

/** @internal */
export function onEvent<K extends keyof WindowEventMap>(
  target: Window,
  type: K,
  options?: OnEventOptions
): Promise<WindowEventMap[K]>;

/** @internal */
export function onEvent<K extends keyof DocumentEventMap>(
  target: Document,
  type: K,
  options?: OnEventOptions
): Promise<DocumentEventMap[K]>;

/** @internal */
export function onEvent(target: EventTarget, type: string, options?: OnEventOptions): Promise<Event>;

/** @internal */
export function onEvent(target: EventTarget, type: string, options?: OnEventOptions): Promise<Event> {
  return new Promise((resolve, reject) => {
    const handleAbort = () => {
      reject(options?.signal?.reason ?? 'Aborted');
    };

    // If already aborted, reject immediately
    if (options?.signal?.aborted) {
      handleAbort();
      return;
    }

    // Listen for abort
    options?.signal?.addEventListener('abort', handleAbort, { once: true });

    // Listen for the event
    target.addEventListener(
      type,
      (event) => {
        options?.signal?.removeEventListener('abort', handleAbort);
        resolve(event);
      },
      { ...options, once: true }
    );
  });
}
