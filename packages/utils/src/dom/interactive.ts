import { resolveEventTarget } from './event';

/** @internal */
export const INTERACTIVE_SELECTOR = [
  'button',
  'input',
  'select',
  'textarea',
  'a[href]',
  '[role="button"]',
  '[role="menu"]',
  '[role="menuitem"]',
  '[role="menuitemcheckbox"]',
  '[role="menuitemradio"]',
  '[role="slider"]',
  '[data-interactive]',
].join(',');

const EDITABLE_INPUT_TYPES = ['text', 'search', 'url', 'tel', 'email', 'password', 'number'];

/** @internal */
export const EDITABLE_SELECTOR = [
  'textarea',
  'select',
  'input:not([type])',
  ...EDITABLE_INPUT_TYPES.map((type) => `input[type="${type}"]`),
  '[contenteditable]:not([contenteditable="false"])',
].join(',');

/** @internal */
export function isEditableElement(el: Element): boolean {
  return el.matches(EDITABLE_SELECTOR);
}

/**
 * Whether the keyboard event target is an editable element (input, textarea, etc).
 *
 * @internal
 */
export function isEditableTarget(event: KeyboardEvent): boolean {
  const target = resolveEventTarget(event);

  return target instanceof Element && isEditableElement(target);
}

/**
 * Whether the event originated from an interactive control (button, slider, etc).
 *
 * @internal
 */
export function isInteractiveTarget(event: Event): boolean {
  const target = resolveEventTarget(event);
  if (!(target instanceof Element)) return false;

  return target.closest(INTERACTIVE_SELECTOR) !== null;
}

const ACTIVATION_KEYS = new Set([' ', 'Enter']);

/**
 * Selector for elements that use Space/Enter as a native activation key. Narrower than `INTERACTIVE_SELECTOR` —
 * excludes editable elements like `input`, `textarea`, `select` where Space/Enter is text input, not activation.
 */
const ACTIVATABLE_SELECTOR = 'button,a[href],[role="slider"],[role="button"]';

/**
 * Whether the event is an activation key on an activatable element (button, link, slider).
 *
 * @internal
 */
export function isInteractiveActivation(event: KeyboardEvent): boolean {
  if (!ACTIVATION_KEYS.has(event.key)) return false;

  const target = resolveEventTarget(event);

  return target instanceof Element && target.matches(ACTIVATABLE_SELECTOR);
}
