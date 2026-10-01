import { noop } from '../function/noop';
import { listen } from './listen';

/**
 * The environment's `devicePixelRatio`, or `1` where it isn't reported.
 *
 * @internal
 */
export function getDevicePixelRatio(): number {
  return globalThis.devicePixelRatio || 1;
}

/**
 * Call `onChange` with the new ratio whenever `devicePixelRatio` changes.
 *
 * `devicePixelRatio` fires no change event, so the ratio is watched through a `(resolution: …dppx)` media query. Each
 * query only answers about the ratio it was built for, so it reports a single change and the handler builds the next.
 * `once: true` is what keeps that from accumulating listeners: the fired one is gone before the replacement is armed.
 * Same shape as MDN's snippet for this, whose earlier non-re-arming version fired exactly once and stopped.
 *
 * Worth watching separately from an element's size: browser zoom, or dragging the window to a display with a different
 * ratio, changes the ratio without resizing the element.
 *
 * @param onChange - Called with the new `devicePixelRatio` after each change
 * @param signal - Optional, for a caller that tears every subscription down through one signal rather than a handle
 *   each; aborting it stops the watching
 * @returns Cleanup that detaches the armed query
 * @internal
 */
export function watchDevicePixelRatio(onChange: (devicePixelRatio: number) => void, signal?: AbortSignal): () => void {
  if (typeof globalThis.matchMedia !== 'function') return noop;

  const options: AddEventListenerOptions = signal ? { once: true, signal } : { once: true };
  // Only one listener is ever armed, so only its removal is worth holding: a
  // fired one removed itself, and every earlier one is long gone.
  let removeListener: () => void = noop;

  const setupListener = () => {
    const query = globalThis.matchMedia(`(resolution: ${getDevicePixelRatio()}dppx)`);

    removeListener = listen(query, 'change', handleChange, options);
  };

  const handleChange = () => {
    setupListener();
    onChange(getDevicePixelRatio());
  };

  setupListener();
  return () => removeListener();
}
