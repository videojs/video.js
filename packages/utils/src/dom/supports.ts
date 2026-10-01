/** @internal */
export function supportsIdleCallback(): boolean {
  return typeof requestIdleCallback === 'function';
}

/** @internal */
export function supportsAnimationFrame(): boolean {
  return typeof requestAnimationFrame === 'function';
}

/** @internal */
export function supportsAnchorPositioning(): boolean {
  return typeof CSS !== 'undefined' && CSS.supports('anchor-name: --a');
}

/** @internal */
export function supportsPopoverAPI(): boolean {
  return typeof HTMLElement !== 'undefined' && 'popover' in HTMLElement.prototype;
}

/**
 * Whether `new CSSStyleSheet()` works. Safari exposed the interface long before 16.4 made it constructable, and
 * constructing it there throws `TypeError: Illegal constructor`, so checking for the interface is not enough.
 *
 * @internal
 */
export function supportsConstructableStyleSheets(): boolean {
  if (typeof globalThis.CSSStyleSheet === 'undefined') return false;

  try {
    new globalThis.CSSStyleSheet();
    return true;
  } catch {
    return false;
  }
}
