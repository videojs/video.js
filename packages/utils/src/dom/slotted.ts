import type { Falsy } from '../types';

/**
 * Finds the first element in a slot's assigned elements that matches a predicate.
 *
 * @example
 *   ```ts
 *   // Find a video element in the default slot
 *   const video = getSlottedElement(this.shadowRoot, '', (el) => el instanceof HTMLVideoElement);
 *   ```;
 *
 * @param shadowRoot - The shadow root containing the slot
 * @param slotName - The slot name to search (empty string for default slot)
 * @param predicate - Function that returns the element if it matches, or falsy if not
 * @returns The first matching element, or null if not found
 * @internal
 */
export function getSlottedElement<T extends Element>(
  shadowRoot: ShadowRoot,
  slotName: string,
  predicate: (el: Element) => Falsy<T>
): T | null {
  const slot = querySlot(shadowRoot, slotName);
  if (!slot) return null;

  for (const el of slot.assignedElements({ flatten: true })) {
    const result = predicate(el);
    if (result) return result;
  }

  return null;
}

/**
 * Queries a slot element by name in a shadow root.
 *
 * @internal
 */
export function querySlot(shadowRoot: ShadowRoot, name: string): HTMLSlotElement | null {
  return shadowRoot.querySelector<HTMLSlotElement>(name ? `slot[name="${name}"]` : 'slot:not([name])');
}
