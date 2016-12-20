/**
 * @file merge-options.js
 * @module merge-options
 */
import {each, isPlain} from './obj';

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
export default function mergeOptions(...sources) {
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

      result[key] = mergeOptions(result[key], value);
    });
  });

  return result;
}
