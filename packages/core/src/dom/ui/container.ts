import { containsComposed, getDeepActiveElement } from '@videojs/utils/dom';

/** @internal */
export const DEFAULT_CONTAINER_ROLE = 'group';
/** @internal */
export const DEFAULT_CONTAINER_TAB_INDEX = 0;

/** @internal */
export function applyContainerAttrs(element: HTMLElement): void {
  if (!element.hasAttribute('role')) {
    element.setAttribute('role', DEFAULT_CONTAINER_ROLE);
  }

  // Make it focusable so keyboard events reach the hotkey coordinator's listener.
  if (!element.hasAttribute('tabindex')) {
    element.setAttribute('tabindex', String(DEFAULT_CONTAINER_TAB_INDEX));
  }
}

/** @internal */
export function focusContainer(element: HTMLElement): void {
  const active = getDeepActiveElement(element.ownerDocument);

  // If nothing inside the container has focus, grab it so keyboard
  // events reach the hotkey coordinator's listener.
  if (!active || active === element.ownerDocument.body || !containsComposed(element, active)) {
    element.focus({ preventScroll: true });
  }
}
