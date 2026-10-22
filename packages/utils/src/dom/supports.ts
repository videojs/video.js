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
 * Whether HLS should play through the browser's own support by default rather than an MSE engine. Matches Mux's
 * playback-core: native on Safari, and anywhere that plays HLS natively but has no MSE. Chromium and Android browsers
 * that also report native HLS play it with fewer features than an engine, so they default to MSE. Always `false`
 * without a DOM.
 *
 * @internal
 */
export function prefersNativeHls(): boolean {
  if (typeof document === 'undefined' || typeof navigator === 'undefined') return false;

  if (document.createElement('video').canPlayType('application/vnd.apple.mpegurl') === '') return false;

  if (!supportsMediaSource()) return true;

  const { userAgent } = navigator;
  const platform = (navigator as NavigatorWithUAData).userAgentData?.platform ?? '';
  const isAndroidLike = /android/i.test(userAgent) || /x11|android/i.test(platform);

  return !isAndroidLike && SAFARI_USER_AGENT.test(userAgent);
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
