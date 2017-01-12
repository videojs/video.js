'use strict';

exports.__esModule = true;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _log = require('./utils/log');

var _log2 = _interopRequireDefault(_log);

var _obj = require('./utils/obj');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

/**
 * @file extend.js
 * @module extend
 */

/**
 * A combination of node inherits and babel's inherits (after transpile).
 * Both work the same but node adds `super_` to the subClass
 * and Bable adds the superClass as __proto__. Both seem useful.
 *
 * @param {Object} subClass
 *        The class to inherit to
 *
 * @param {Object} superClass
 *        The class to inherit from
 *
 * @private
 */
var _inherits = function _inherits(subClass, superClass) {
  if (typeof superClass !== 'function' && superClass !== null) {
    throw new TypeError('Super expression must either be null or a function, not ' + (typeof superClass === 'undefined' ? 'undefined' : _typeof(superClass)));
  }

  subClass.prototype = Object.create(superClass && superClass.prototype, {
    constructor: {
      value: subClass,
      enumerable: false,
      writable: true,
      configurable: true
    }
  });

  if (superClass) {
    // node
    subClass.super_ = superClass;
  }
};

/**
 * Function for subclassing using the same inheritance that
 * videojs uses internally
 *
 * @param {Object} superClass
 *        The class to inherit from
 *
 * @param {Object} [subClassMethods={}]
 *        The class to inherit to
 *
 * @return {Object}
 *         The new object with subClassMethods that inherited superClass.
 */
var extendFn = function extendFn(superClass) {
  var subClassMethods = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

  var subClass = function subClass() {
    superClass.apply(this, arguments);
  };

  var methods = {};

  if ((0, _obj.isObject)(subClassMethods)) {
    if (typeof subClassMethods.init === 'function') {
      _log2['default'].warn('Constructor logic via init() is deprecated; please use constructor() instead.');
      subClassMethods.constructor = subClassMethods.init;
    }
    if (subClassMethods.constructor !== Object.prototype.constructor) {
      subClass = subClassMethods.constructor;
    }
    methods = subClassMethods;
  } else if (typeof subClassMethods === 'function') {
    subClass = subClassMethods;
  }

  _inherits(subClass, superClass);

  // Extend subObj's prototype with functions and other properties from props
  for (var name in methods) {
    if (methods.hasOwnProperty(name)) {
      subClass.prototype[name] = methods[name];
    }
  }

  return subClass;
};

exports['default'] = extendFn;
