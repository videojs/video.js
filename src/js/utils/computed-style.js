import window from 'global/window';

/**
 * A safe getComputedStyle with an IE8 fallback.
 *
 * This is because in Firefox, if the player is loaded in an iframe with `display:none`,
 * then `getComputedStyle` returns `null`, so, we do a null-check to make sure
 * that the player doesn't break in these cases.
 * See https://bugzilla.mozilla.org/show_bug.cgi?id=548397 for more details.
 *
 * @function computedStyle
 * @param el the element you want the computed style of
 * @param prop the property name you want
 */
export default function computedStyle(el, prop) {
  if (!el || !prop) {
    return '';
  }

  if (typeof window.getComputedStyle === 'function') {
    const cs = window.getComputedStyle(el);

    return cs ? cs[prop] : '';
  }

  return el.currentStyle[prop] || '';
}
