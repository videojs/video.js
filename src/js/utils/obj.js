/**
 * @file obj.js
 */

/**
 * Array-like iteration for objects.
 *
 * @param  {Object}   object
 * @param  {Function} fn
 *         A callback function which is called for each key in the object. It
 *         receives the value and key as arguments.
 */
export function each(object, fn) {
  Object.keys(object).forEach(key => fn(object[key], key));
}

/**
 * Array-like reduce for objects.
 *
 * @param  {Object}   object
 * @param  {Function} fn
 *         A callback function which is called for each key in the object. It
 *         receives the accumulated value and the per-iteration value and key
 *         as arguments.
 * @param  {Mixed}    [initial = 0]
 * @return {Mixed}
 */
export function reduce(object, fn, initial = 0) {
  return Object.keys(object).reduce(
    (accum, key) => fn(accum, object[key], key),
    initial);
}
