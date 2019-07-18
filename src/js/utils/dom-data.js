/**
 * @file dom-data.js
 * @module dom-data
 */

/**
 * Element Data Store.
 *
 * Allows for binding data to an element without putting it directly on the
 * element. Ex. Event listeners are stored here.
 * (also from jsninja.com, slightly modified and updated for closure compiler)
 *
 * @type {Object}
 * @private
 */
export const elData = new WeakMap();

/**
 * Returns the cache object where data for an element is stored
 *
 * @param {Element} el
 *        Element to store data for.
 *
 * @return {Object}
 *         The cache object for that el that was passed in.
 */
export function getData(el) {
  if (!elData.has(el)) {
    elData.set(el, {});
  }

  return elData.get(el);
}

/**
 * Returns whether or not an element has cached data
 *
 * @param {Element} el
 *        Check if this element has cached data.
 *
 * @return {boolean}
 *         - True if the DOM element has cached data.
 *         - False otherwise.
 */
export function hasData(el) {
  if (!elData.has(el)) {
    return false;
  }

  return !!Object.getOwnPropertyNames(elData.get(el)).length;
}

/**
 * Delete data for the element from the cache and the guid attr from getElementById
 *
 * @param {Element} el
 *        Remove cached data for this element.
 */
export function removeData(el) {
  // Remove all stored data
  delete elData.delete(el);
}
