/**
 * @file computed-style.js
 * @module computed-style
 */
import window from 'global/window';

/**
 * A safe getComputedStyle.
 *
 * This is needed because in Firefox, if the player is loaded in an iframe with
 * `display:none`, then `getComputedStyle` returns `null`, so, we do a
 * null-check to make sure that the player doesn't break in these cases.
 *
 * @function
 * @param    {Element} el
 *           The element you want the computed style of
 *
 * @param    {string} prop
 *           The property name you want
 *
 * @see      https://bugzilla.mozilla.org/show_bug.cgi?id=548397
 */
function computedStyle(el, prop) {
  if (!el || !prop) {
    return '';
  }

  if (typeof window.getComputedStyle === 'function') {
    let computedStyleValue;

    try {
      computedStyleValue = window.getComputedStyle(el);
    } catch (e) {
      return '';
    }

    return computedStyleValue ? computedStyleValue.getPropertyValue(prop) || computedStyleValue[prop] : '';
  }

  return '';
}

export default computedStyle;
