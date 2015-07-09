/**
 * @file merge-options.js
 */
import merge from 'lodash-compat/object/merge';

function isPlain(obj) {
  return !!obj
    && typeof obj === 'object'
    && obj.toString() === '[object Object]'
    && obj.constructor === Object;
}

/**
 * Merge two options objects, recursively merging **only* * plain object
 * properties.  Previously `deepMerge`.
 *
 * @param  {Object} object    The destination object
 * @param  {...Object} source One or more objects to merge into the first
 * @returns {Object}          The updated first object
 * @function mergeOptions
 */
export default function mergeOptions(object={}) {

  // Allow for infinite additional object args to merge
  Array.prototype.slice.call(arguments, 1).forEach(function(source){

    // Recursively merge only plain objects
    // All other values will be directly copied
    merge(object, source, function(a, b) {

      // If we're not working with a plain object, copy the value as is
      if (!isPlain(b)) {
        return b;
      }

      // If the new value is a plain object but the first object value is not
      // we need to create a new object for the first object to merge with.
      // This makes it consistent with how merge() works by default
      // and also protects from later changes the to first object affecting
      // the second object's values.
      if (!isPlain(a)) {
        return mergeOptions({}, b);
      }
    });
  });

  return object;
}
