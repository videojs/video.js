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
 * How the browser plays HLS without an engine:
 *
 * - `'preferred'`: natively by default, because there's no MSE for an engine to play through, as on iOS before 17.1.
 * - `'supported'`: it can, but an MSE engine plays by default, with more features and the same behavior everywhere.
 *   That's every browser with MSE, Safari included.
 * - `'unsupported'`: it can't, which is also the answer without a DOM.
 *
 * @internal
 */
export function nativeHlsSupport(): 'preferred' | 'supported' | 'unsupported' {
  if (typeof document === 'undefined' || typeof navigator === 'undefined') return 'unsupported';

  if (!document.createElement('video').canPlayType('application/vnd.apple.mpegurl')) return 'unsupported';

  return supportsMediaSource() ? 'supported' : 'preferred';
}

/**
 * Whether an MSE engine can run: `MediaSource`, or `ManagedMediaSource` on iOS 17.1+.
 *
 * @internal
 */
export function supportsMediaSource(): boolean {
  const scope = globalThis as { MediaSource?: unknown; ManagedMediaSource?: unknown; WebKitMediaSource?: unknown };

  return !!(scope.MediaSource ?? scope.ManagedMediaSource ?? scope.WebKitMediaSource);
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
