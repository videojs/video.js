/**
 * @file obj.js
 * @module obj
 */

/**
 * @callback obj:EachCallback
 *
 * @param {*} value
 *        The current key for the object that is being iterated over.
 *
 * @param {string} key
 *        The current key-value for object that is being iterated over
 */

/**
 * @callback obj:ReduceCallback
 *
 * @param {*} accum
 *        The value that is accumulating over the reduce loop.
 *
 * @param {*} value
 *        The current key for the object that is being iterated over.
 *
 * @param {string} key
 *        The current key-value for object that is being iterated over
 *
 * @return {*}
 *         The new accumulated value.
 */
const toString = Object.prototype.toString;

/**
 * Get the keys of an Object
 *
 * @param {Object}
 *        The Object to get the keys from
 *
 * @return {string[]}
 *         An array of the keys from the object. Returns an empty array if the
 *         object passed in was invalid or had no keys.
 *
 * @private
 */
const keys = function(object) {
  return isObject(object) ? Object.keys(object) : [];
};

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
  keys(object).forEach(key => fn(object[key], key));
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
 * @param {*} [initial = 0]
 *        Starting value
 *
 * @return {*}
 *         The final accumulated value.
 */
export function reduce(object, fn, initial = 0) {
  return keys(object).reduce((accum, key) => fn(accum, object[key], key), initial);
}

/**
 * Returns whether a value is an object of any kind - including DOM nodes,
 * arrays, regular expressions, etc. Not functions, though.
 *
 * This avoids the gotcha where using `typeof` on a `null` value
 * results in `'object'`.
 *
 * @param  {Object} value
 * @return {boolean}
 */
export function isObject(value) {
  return !!value && typeof value === 'object';
}

/**
 * Returns whether an object appears to be a "plain" object - that is, a
 * direct instance of `Object`.
 *
 * @param  {Object} value
 * @return {boolean}
 */
export function isPlain(value) {
  return isObject(value) &&
    toString.call(value) === '[object Object]' &&
    value.constructor === Object;
}

/**
 * Merge two objects recursively.
 *
 * Performs a deep merge like
 * {@link https://lodash.com/docs/4.17.10#merge|lodash.merge}, but only merges
 * plain objects (not arrays, elements, or anything else).
 *
 * Non-plain object values will be copied directly from the right-most
 * argument.
 *
 * @param   {Object[]} sources
 *          One or more objects to merge into a new object.
 *
 * @return {Object}
 *          A new object that is the merged result of all sources.
 */
export function merge(...sources) {
  const result = {};

  sources.forEach(source => {
    if (!source) {
      return;
    }

    each(source, (value, key) => {
      if (!isPlain(value)) {
        result[key] = value;
        return;
      }

      if (!isPlain(result[key])) {
        result[key] = {};
      }

      result[key] = merge(result[key], value);
    });
  });

  return result;
}

/**
 * Returns an array of values for a given object
 *
 * @param  {Object} source - target object
 * @return {Array<unknown>} - object values
 */
export function values(source = {}) {
  const result = [];

  for (const key in source) {
    if (source.hasOwnProperty(key)) {
      const value = source[key];

      result.push(value);
    }
  }

  return result;
}

/**
 * Object.defineProperty but "lazy", which means that the value is only set after
 * it is retrieved the first time, rather than being set right away.
 *
 * @param {Object} obj the object to set the property on
 * @param {string} key the key for the property to set
 * @param {Function} getValue the function used to get the value when it is needed.
 * @param {boolean} setter whether a setter should be allowed or not
 */
export function defineLazyProperty(obj, key, getValue, setter = true) {
  const set = (value) =>
    Object.defineProperty(obj, key, {value, enumerable: true, writable: true});

  const options = {
    configurable: true,
    enumerable: true,
    get() {
      const value = getValue();

      set(value);

      return value;
    }
  };

  if (setter) {
    options.set = set;
  }

  return Object.defineProperty(obj, key, options);
}
