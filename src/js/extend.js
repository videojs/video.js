/**
 * @file extend.js
 * @module extend
 */

import _inherits from '@babel/runtime/helpers/inherits';
import log from './utils/log.js';

let hasLogged = false;

/**
 * Used to subclass an existing class by emulating ES subclassing using the
 * `extends` keyword.
 *
 * @function
 * @deprecated
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

  // Log a warning the first time extend is called to note that it is deprecated
  // It was previously deprecated in our documentation (guides, specifically),
  // but was never formally deprecated in code.
  if (!hasLogged) {
    log.warn('videojs.extend is deprecated as of Video.js 7.22.0 and will be removed in Video.js 8.0.0');
    hasLogged = true;
  }

  let subClass = function() {
    superClass.apply(this, arguments);
  };

  let methods = {};

  if (typeof subClassMethods === 'object') {
    if (subClassMethods.constructor !== Object.prototype.constructor) {
      subClass = subClassMethods.constructor;
    }
    methods = subClassMethods;
  } else if (typeof subClassMethods === 'function') {
    subClass = subClassMethods;
  }

  _inherits(subClass, superClass);

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
