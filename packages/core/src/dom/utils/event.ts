import { isFunction } from '@videojs/utils/predicate';

/** @internal */
export function isEventWithinElement(event: Event, element: Element | null): boolean {
  if (!element) return false;

  if (isFunction(event.composedPath)) {
    return event.composedPath().includes(element);
  }

  const target = event.target;

  return target instanceof Node && element.contains(target);
}
