'use strict';

exports.__esModule = true;
exports['default'] = mergeOptions;

var _obj = require('./obj');

/**
 * Deep-merge one or more options objects, recursively merging **only** plain
 * object properties.
 *
 * @param   {Object[]} sources
 *          One or more objects to merge into a new object.
 *
 * @returns {Object}
 *          A new object that is the merged result of all sources.
 */
function mergeOptions() {
  var result = {};

  for (var _len = arguments.length, sources = Array(_len), _key = 0; _key < _len; _key++) {
    sources[_key] = arguments[_key];
  }

  sources.forEach(function (source) {
    if (!source) {
      return;
    }

    (0, _obj.each)(source, function (value, key) {
      if (!(0, _obj.isPlain)(value)) {
        result[key] = value;
        return;
      }

      if (!(0, _obj.isPlain)(result[key])) {
        result[key] = {};
      }

      result[key] = mergeOptions(result[key], value);
    });
  });

  return result;
} /**
   * @file merge-options.js
   * @module merge-options
   */
