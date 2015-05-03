import merge from 'lodash.merge';
import isPlainObject from 'lodash.isplainobject';
import cloneDeep from 'lodash.clonedeep';

/**
 * Merge two options objects, recursively merging any plain object properties as
 * well.  Previously `deepMerge`
 *
 * @param  {Object} obj1 Object to override values in
 * @param  {Object} obj2 Overriding object
 * @return {Object}      New object -- obj1 and obj2 will be untouched
 */
export default function mergeOptions(obj1){
  // Copy to ensure we're not modifying the defaults somewhere
  obj1 = cloneDeep(obj1, function(value) {
    if (!isPlainObject(value)) {
      return value;
    }
  });

  // Allow for infinite additional object args to merge
  Array.prototype.slice.call(arguments, 1).forEach(function(argObj){
    // Recursively merge only plain objects
    // All other values will be directly copied
    merge(obj1, argObj, function(a, b) {
      if (!isPlainObject(a) || !isPlainObject(b)) {
        return b;
      }
    });
  });

  return obj1;
}
