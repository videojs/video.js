/**
 * Utility functions namespace
 * @namespace
 * @type {Object}
 */
vjs.util = {};

/**
 * Merge two options objects, 
 * recursively merging any plain object properties as well.
 * Previously `deepMerge`
 * 
 * @param  {Object} obj1 Object to override values in
 * @param  {Object} obj2 Overriding object
 * @return {Object}      New object -- obj1 and obj2 will be untouched
 */
vjs.util.mergeOptions = function(obj1, obj2){
  var key, val1, val2;

  // make a copy of obj1 so we're not ovewriting original values.
  // like prototype.options_ and all sub options objects
  obj1 = vjs.obj.copy(obj1);

  for (key in obj2){
    if (obj2.hasOwnProperty(key)) {
      val1 = obj1[key];
      val2 = obj2[key];

      // Check if both properties are pure objects and do a deep merge if so
      if (vjs.obj.isPlain(val1) && vjs.obj.isPlain(val2)) {
        obj1[key] = vjs.util.mergeOptions(val1, val2);
      } else {
        obj1[key] = obj2[key];
      }
    }
  }
  return obj1;
};


