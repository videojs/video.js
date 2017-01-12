'use strict';

exports.__esModule = true;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

exports.each = each;
exports.reduce = reduce;
exports.assign = assign;
exports.isObject = isObject;
exports.isPlain = isPlain;
/**
 * @file obj.js
 * @module obj
 */

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
var toString = Object.prototype.toString;

/**
 * Array-like iteration for objects.
 *
 * @param {Object} object
 *        The object to iterate over
 *
 * @param {obj:EachCallback} fn
 *        The callback function which is called for each key in the object.
 */
function each(object, fn) {
  Object.keys(object).forEach(function (key) {
    return fn(object[key], key);
  });
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
function reduce(object, fn) {
  var initial = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;

  return Object.keys(object).reduce(function (accum, key) {
    return fn(accum, object[key], key);
  }, initial);
}

/**
 * Object.assign-style object shallow merge/extend.
 *
 * @param  {Object} target
 * @param  {Object} ...sources
 * @return {Object}
 */
function assign(target) {
  for (var _len = arguments.length, sources = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
    sources[_key - 1] = arguments[_key];
  }

  if (Object.assign) {
    return Object.assign.apply(Object, [target].concat(sources));
  }

  sources.forEach(function (source) {
    if (!source) {
      return;
    }

    each(source, function (value, key) {
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
function isObject(value) {
  return !!value && (typeof value === 'undefined' ? 'undefined' : _typeof(value)) === 'object';
}

/**
 * Returns whether an object appears to be a "plain" object - that is, a
 * direct instance of `Object`.
 *
 * @param  {Object} value
 * @return {Boolean}
 */
function isPlain(value) {
  return isObject(value) && toString.call(value) === '[object Object]' && value.constructor === Object;
}
