/** @internal */
export function isMacOS(): boolean {
  return typeof navigator !== 'undefined' && /mac/i.test(navigator.userAgent);
}
