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
 * - `'preferred'`: natively by default, matching Mux's playback-core. That's Safari, and anywhere that plays HLS natively
 *   but has no MSE.
 * - `'supported'`: it can, but an MSE engine plays better. Chromium and Android browsers report native HLS with fewer
 *   features than an engine.
 * - `'unsupported'`: it can't, which is also the answer without a DOM.
 *
 * @internal
 */
export function nativeHlsSupport(): 'preferred' | 'supported' | 'unsupported' {
  if (typeof document === 'undefined' || typeof navigator === 'undefined') return 'unsupported';

  if (!document.createElement('video').canPlayType('application/vnd.apple.mpegurl')) return 'unsupported';

  if (!supportsMediaSource()) return 'preferred';

  const { userAgent } = navigator;
  const platform = (navigator as NavigatorWithUAData).userAgentData?.platform ?? '';
  const isAndroidLike = /android/i.test(userAgent) || /x11|android/i.test(platform);

  return !isAndroidLike && SAFARI_USER_AGENT.test(userAgent) ? 'preferred' : 'supported';
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

interface NavigatorWithUAData extends Navigator {
  userAgentData?: { platform?: string };
}

// Safari, including the iOS browsers built on it, whose user agents say `CriOS` or `FxiOS` rather than `Chrome`.
const SAFARI_USER_AGENT = /^((?!chrome|android).)*safari/i;

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
