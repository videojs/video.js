import { getGestureCoordinator } from './coordinator';
import type { GestureOptions } from './gesture';
import { TapRecognizer } from './tap';

const recognizers = new WeakMap<HTMLElement, TapRecognizer>();

function getRecognizer(target: HTMLElement): TapRecognizer {
  let recognizer = recognizers.get(target);
  if (recognizer) return recognizer;

  recognizer = new TapRecognizer();
  recognizers.set(target, recognizer);
  return recognizer;
}

/**
 * Register a tap gesture on a target element.
 *
 * @example
 *   ```ts
 *   const cleanup = createTapGesture(
 *     container,
 *     (event) => {
 *       store.paused ? store.play() : store.pause();
 *     },
 *     { pointer: 'mouse' }
 *   );
 *   ```;
 */
export function createTapGesture(
  target: HTMLElement,
  onActivate: (event: PointerEvent) => void,
  options?: GestureOptions
): () => void {
  return getGestureCoordinator(target).add({
    type: 'tap',
    recognizer: getRecognizer(target),
    onActivate,
    pointer: options?.pointer,
    region: options?.region,
    disabled: options?.disabled,
    action: options?.action,
    value: options?.value,
  });
}

/**
 * Register a doubletap gesture on a target element.
 *
 * @example
 *   ```ts
 *   const cleanup = createDoubleTapGesture(
 *     container,
 *     (event) => {
 *       store.isFullscreen ? store.exitFullscreen() : store.requestFullscreen();
 *     },
 *     { region: 'center' }
 *   );
 *   ```;
 */
export function createDoubleTapGesture(
  target: HTMLElement,
  onActivate: (event: PointerEvent) => void,
  options?: GestureOptions
): () => void {
  return getGestureCoordinator(target).add({
    type: 'doubletap',
    recognizer: getRecognizer(target),
    onActivate,
    pointer: options?.pointer,
    region: options?.region,
    disabled: options?.disabled,
    action: options?.action,
    value: options?.value,
  });
}
