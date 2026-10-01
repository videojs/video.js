/**
 * Hosted floating UI surfaces (popover, menu, tooltip, and future overlays) that support parent-driven lifecycle may
 * set {@link POPUP_HOST_ATTR}. Ancestors can discover them with {@link POPUP_HOST_SELECTOR} and call methods such as
 * `close('imperative-action')` when the element implements that contract.
 *
 * @internal
 */
export const POPUP_HOST_ATTR = 'data-popup';

/** @internal */
export const POPUP_HOST_SELECTOR = `[${POPUP_HOST_ATTR}]`;
