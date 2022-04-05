/**
 * @file extend.js
 * @module extend
 */

/**
 * Used to subclass an existing class by emulating ES subclassing using the
 * `extends` keyword.
 *
 * @function
 * @example
 * var MyComponent = videojs.extend(videojs.getComponent('Component'), {
 *   myCustomMethod: function() {
 *     // Do things in my method.
 *   }
 * });
 *
 * @param    {Function} superClass
 *           The class to inherit from
 *
 * @param    {Object}   [subClassMethods={}]
 *           Methods of the new class
 *
 * @return   {Function}
 *           The new class with subClassMethods that inherited superClass.
 */
const extend = function(superClass, subClassMethods = {}) {
  let subClass;

  // If the provided super class is a native ES6 class,
  // make the sub class one as well.
  if (/^class/.test(superClass.toString())) {
    subClass = class SubClass extends superClass {};
  } else {
    subClass = function() {
      superClass.apply(this, arguments);
    };
  }

  let methods = {};

  if (typeof subClassMethods === 'object') {
    if (subClassMethods.constructor !== Object.prototype.constructor) {
      subClass = subClassMethods.constructor;
    }
    methods = subClassMethods;
  } else if (typeof subClassMethods === 'function') {
    subClass = subClassMethods;
  }

  // this is needed for backward-compatibility and node compatibility.
  if (superClass) {
    subClass.super_ = superClass;
  }

  // Extend subObj's prototype with functions and other properties from props
  for (const name in methods) {
    if (methods.hasOwnProperty(name)) {
      subClass.prototype[name] = methods[name];
    }
  }

  return subClass;
};

export default extend;
