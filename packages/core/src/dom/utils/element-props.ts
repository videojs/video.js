import { listen } from '@videojs/utils/dom';
import { isFunction, isUndefined } from '@videojs/utils/predicate';

/**
 * Apply props to a DOM element.
 *
 * Handles both attributes and event listeners: - Event props (onClick, onKeyDown, etc.) are attached as listeners -
 * Event props ending in `Capture` use capture phase, except pointer capture events - Boolean props: `true` sets empty
 * attribute, `false` removes - `undefined` removes the attribute - Other props are set as string attributes
 *
 * @internal
 */
export function applyElementProps(element: HTMLElement, props: object, options?: { signal?: AbortSignal }): void {
  const signal = options?.signal;

  for (const [key, value] of Object.entries(props)) {
    if (isFunction(value) && key.startsWith('on')) {
      const capture = key.endsWith('Capture') && !key.endsWith('PointerCapture');
      const event = key.slice(2, capture ? -7 : undefined).toLowerCase();

      listen(element, event, value as EventListener, signal ? { capture, signal } : { capture });
    } else if (isUndefined(value) || value === false) {
      element.removeAttribute(key);
    } else if (value === true) {
      element.setAttribute(key, '');
    } else {
      element.setAttribute(key, String(value));
    }
  }
}
