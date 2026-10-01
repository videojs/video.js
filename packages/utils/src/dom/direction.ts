/**
 * Check whether an element's text direction is right-to-left.
 *
 * @internal
 */
export function isRTL(element: Element): boolean {
  const dir = element.closest('[dir]')?.getAttribute('dir')?.toLowerCase();
  if (dir === 'rtl' || dir === 'ltr') return dir === 'rtl';

  return getComputedStyle(element).direction === 'rtl';
}
