/**
 * @file obj.js
 * @module obj
 */
import objectAssign from 'object.assign';

/**
 * @callback obj:EachCallback
 *
 * @param {Mixed} value
 *        The current key for the object that is being iterated over.
 *
 * @param {string} key
 *        The current key-value for object that is being iterated over
 */

/**
 * @callback obj:ReduceCallback
 *
 * @param {Mixed} accum
 *        The value that is accumulating over the reduce loop.
 *
 * @param {Mixed} value
 *        The current key for the object that is being iterated over.
 *
 * @param {string} key
 *        The current key-value for object that is being iterated over
 *
 * @return {Mixed}
 *         The new accumulated value.
 */
const toString = Object.prototype.toString;

/**
 * Array-like iteration for objects.
 *
 * @param {Object} object
 *        The object to iterate over
 *
 * @param {obj:EachCallback} fn
 *        The callback function which is called for each key in the object.
 */
export function each(object, fn) {
  Object.keys(object).forEach(key => fn(object[key], key));
}

/**
 * Array-like reduce for objects.
 *
 * @param {Object} object
 *        The Object that you want to reduce.
 *
 * @param {Function} fn
 *         A callback function which is called for each key in the object. It
 *         receives the accumulated value and the per-iteration value and key
 *         as arguments.
 *
 * @param {Mixed} [initial = 0]
 *        Starting value
 *
 * @return {Mixed}
 *         The final accumulated value.
 */
export function reduce(object, fn, initial = 0) {
  return Object.keys(object).reduce(
    (accum, key) => fn(accum, object[key], key), initial);
}

/**
 * Object.assign-style object shallow merge/extend.
 *
 * @param  {Object} target
 * @param  {Object} ...sources
 * @return {Object}
 */
export function assign(target, ...sources) {
  if (Object.assign) {
    return Object.assign(target, ...sources);
  }

  sources.forEach(source => {
    if (!source) {
      return;
    }

    each(source, (value, key) => {
      target[key] = value;
    });
  });

  return target;
}

/**
 * Returns whether a value is an object of any kind - including DOM nodes,
 * arrays, regular expressions, etc. Not functions, though.
 *
 * This avoids the gotcha where using `typeof` on a `null` value
 * results in `'object'`.
 *
 * @param  {Object} value
 * @return {Boolean}
 */
export function isObject(value) {
  return !!value && typeof value === 'object';
}

/**
 * Returns whether an object appears to be a "plain" object - that is, a
 * direct instance of `Object`.
 *
 * @param  {Object} value
 * @return {Boolean}
 */
export function isPlain(value) {
  return isObject(value) &&
    toString.call(value) === '[object Object]' &&
    value.constructor === Object;
}

/**
 * Object.assign polyfill
 *
 * @param  {Object} target
 * @param  {Object} ...sources
 * @return {Object}
 */
export function assign(...args) {

  // This exists primarily to isolate our dependence on this third-party
  // polyfill. If we decide to move away from it, we can do so in one place.
  return objectAssign(...args);
}

/**
 * Returns whether an object appears to be a non-function/non-array object.
 *
 * This avoids gotchas like `typeof null === 'object'`.
 *
 * @param  {Object} object
 * @return {Boolean}
 */
export function isObject(object) {
  return Object.prototype.toString.call(object) === '[object Object]';
}

/**
 * Returns whether an object appears to be a "plain" object - that is, a
 * direct instance of `Object`.
 *
 * @param  {Object} object
 * @return {Boolean}
 */
export function isPlain(object) {
  return isObject(object) && object.constructor === Object;
}
