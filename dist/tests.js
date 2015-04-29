(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function (global){
var topLevel = typeof global !== 'undefined' ? global :
    typeof window !== 'undefined' ? window : {}
var minDoc = require('min-document');

if (typeof document !== 'undefined') {
    module.exports = document;
} else {
    var doccy = topLevel['__GLOBAL_DOCUMENT_CACHE@4'];

    if (!doccy) {
        doccy = topLevel['__GLOBAL_DOCUMENT_CACHE@4'] = minDoc;
    }

    module.exports = doccy;
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"min-document":3}],2:[function(require,module,exports){
(function (global){
if (typeof window !== "undefined") {
    module.exports = window;
} else if (typeof global !== "undefined") {
    module.exports = global;
} else if (typeof self !== "undefined"){
    module.exports = self;
} else {
    module.exports = {};
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],3:[function(require,module,exports){

},{}],4:[function(require,module,exports){
if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    var TempCtor = function () {}
    TempCtor.prototype = superCtor.prototype
    ctor.prototype = new TempCtor()
    ctor.prototype.constructor = ctor
  }
}

},{}],5:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};
var queue = [];
var draining = false;

function drainQueue() {
    if (draining) {
        return;
    }
    draining = true;
    var currentQueue;
    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        var i = -1;
        while (++i < len) {
            currentQueue[i]();
        }
        len = queue.length;
    }
    draining = false;
}
process.nextTick = function (fun) {
    queue.push(fun);
    if (!draining) {
        setTimeout(drainQueue, 0);
    }
};

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],6:[function(require,module,exports){
module.exports = function isBuffer(arg) {
  return arg && typeof arg === 'object'
    && typeof arg.copy === 'function'
    && typeof arg.fill === 'function'
    && typeof arg.readUInt8 === 'function';
}
},{}],7:[function(require,module,exports){
(function (process,global){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var formatRegExp = /%[sdj%]/g;
exports.format = function(f) {
  if (!isString(f)) {
    var objects = [];
    for (var i = 0; i < arguments.length; i++) {
      objects.push(inspect(arguments[i]));
    }
    return objects.join(' ');
  }

  var i = 1;
  var args = arguments;
  var len = args.length;
  var str = String(f).replace(formatRegExp, function(x) {
    if (x === '%%') return '%';
    if (i >= len) return x;
    switch (x) {
      case '%s': return String(args[i++]);
      case '%d': return Number(args[i++]);
      case '%j':
        try {
          return JSON.stringify(args[i++]);
        } catch (_) {
          return '[Circular]';
        }
      default:
        return x;
    }
  });
  for (var x = args[i]; i < len; x = args[++i]) {
    if (isNull(x) || !isObject(x)) {
      str += ' ' + x;
    } else {
      str += ' ' + inspect(x);
    }
  }
  return str;
};


// Mark that a method should not be used.
// Returns a modified function which warns once by default.
// If --no-deprecation is set, then it is a no-op.
exports.deprecate = function(fn, msg) {
  // Allow for deprecating things in the process of starting up.
  if (isUndefined(global.process)) {
    return function() {
      return exports.deprecate(fn, msg).apply(this, arguments);
    };
  }

  if (process.noDeprecation === true) {
    return fn;
  }

  var warned = false;
  function deprecated() {
    if (!warned) {
      if (process.throwDeprecation) {
        throw new Error(msg);
      } else if (process.traceDeprecation) {
        console.trace(msg);
      } else {
        console.error(msg);
      }
      warned = true;
    }
    return fn.apply(this, arguments);
  }

  return deprecated;
};


var debugs = {};
var debugEnviron;
exports.debuglog = function(set) {
  if (isUndefined(debugEnviron))
    debugEnviron = process.env.NODE_DEBUG || '';
  set = set.toUpperCase();
  if (!debugs[set]) {
    if (new RegExp('\\b' + set + '\\b', 'i').test(debugEnviron)) {
      var pid = process.pid;
      debugs[set] = function() {
        var msg = exports.format.apply(exports, arguments);
        console.error('%s %d: %s', set, pid, msg);
      };
    } else {
      debugs[set] = function() {};
    }
  }
  return debugs[set];
};


/**
 * Echos the value of a value. Trys to print the value out
 * in the best way possible given the different types.
 *
 * @param {Object} obj The object to print out.
 * @param {Object} opts Optional options object that alters the output.
 */
/* legacy: obj, showHidden, depth, colors*/
function inspect(obj, opts) {
  // default options
  var ctx = {
    seen: [],
    stylize: stylizeNoColor
  };
  // legacy...
  if (arguments.length >= 3) ctx.depth = arguments[2];
  if (arguments.length >= 4) ctx.colors = arguments[3];
  if (isBoolean(opts)) {
    // legacy...
    ctx.showHidden = opts;
  } else if (opts) {
    // got an "options" object
    exports._extend(ctx, opts);
  }
  // set default options
  if (isUndefined(ctx.showHidden)) ctx.showHidden = false;
  if (isUndefined(ctx.depth)) ctx.depth = 2;
  if (isUndefined(ctx.colors)) ctx.colors = false;
  if (isUndefined(ctx.customInspect)) ctx.customInspect = true;
  if (ctx.colors) ctx.stylize = stylizeWithColor;
  return formatValue(ctx, obj, ctx.depth);
}
exports.inspect = inspect;


// http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
inspect.colors = {
  'bold' : [1, 22],
  'italic' : [3, 23],
  'underline' : [4, 24],
  'inverse' : [7, 27],
  'white' : [37, 39],
  'grey' : [90, 39],
  'black' : [30, 39],
  'blue' : [34, 39],
  'cyan' : [36, 39],
  'green' : [32, 39],
  'magenta' : [35, 39],
  'red' : [31, 39],
  'yellow' : [33, 39]
};

// Don't use 'blue' not visible on cmd.exe
inspect.styles = {
  'special': 'cyan',
  'number': 'yellow',
  'boolean': 'yellow',
  'undefined': 'grey',
  'null': 'bold',
  'string': 'green',
  'date': 'magenta',
  // "name": intentionally not styling
  'regexp': 'red'
};


function stylizeWithColor(str, styleType) {
  var style = inspect.styles[styleType];

  if (style) {
    return '\u001b[' + inspect.colors[style][0] + 'm' + str +
           '\u001b[' + inspect.colors[style][1] + 'm';
  } else {
    return str;
  }
}


function stylizeNoColor(str, styleType) {
  return str;
}


function arrayToHash(array) {
  var hash = {};

  array.forEach(function(val, idx) {
    hash[val] = true;
  });

  return hash;
}


function formatValue(ctx, value, recurseTimes) {
  // Provide a hook for user-specified inspect functions.
  // Check that value is an object with an inspect function on it
  if (ctx.customInspect &&
      value &&
      isFunction(value.inspect) &&
      // Filter out the util module, it's inspect function is special
      value.inspect !== exports.inspect &&
      // Also filter out any prototype objects using the circular check.
      !(value.constructor && value.constructor.prototype === value)) {
    var ret = value.inspect(recurseTimes, ctx);
    if (!isString(ret)) {
      ret = formatValue(ctx, ret, recurseTimes);
    }
    return ret;
  }

  // Primitive types cannot have properties
  var primitive = formatPrimitive(ctx, value);
  if (primitive) {
    return primitive;
  }

  // Look up the keys of the object.
  var keys = Object.keys(value);
  var visibleKeys = arrayToHash(keys);

  if (ctx.showHidden) {
    keys = Object.getOwnPropertyNames(value);
  }

  // IE doesn't make error fields non-enumerable
  // http://msdn.microsoft.com/en-us/library/ie/dww52sbt(v=vs.94).aspx
  if (isError(value)
      && (keys.indexOf('message') >= 0 || keys.indexOf('description') >= 0)) {
    return formatError(value);
  }

  // Some type of object without properties can be shortcutted.
  if (keys.length === 0) {
    if (isFunction(value)) {
      var name = value.name ? ': ' + value.name : '';
      return ctx.stylize('[Function' + name + ']', 'special');
    }
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    }
    if (isDate(value)) {
      return ctx.stylize(Date.prototype.toString.call(value), 'date');
    }
    if (isError(value)) {
      return formatError(value);
    }
  }

  var base = '', array = false, braces = ['{', '}'];

  // Make Array say that they are Array
  if (isArray(value)) {
    array = true;
    braces = ['[', ']'];
  }

  // Make functions say that they are functions
  if (isFunction(value)) {
    var n = value.name ? ': ' + value.name : '';
    base = ' [Function' + n + ']';
  }

  // Make RegExps say that they are RegExps
  if (isRegExp(value)) {
    base = ' ' + RegExp.prototype.toString.call(value);
  }

  // Make dates with properties first say the date
  if (isDate(value)) {
    base = ' ' + Date.prototype.toUTCString.call(value);
  }

  // Make error with message first say the error
  if (isError(value)) {
    base = ' ' + formatError(value);
  }

  if (keys.length === 0 && (!array || value.length == 0)) {
    return braces[0] + base + braces[1];
  }

  if (recurseTimes < 0) {
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    } else {
      return ctx.stylize('[Object]', 'special');
    }
  }

  ctx.seen.push(value);

  var output;
  if (array) {
    output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
  } else {
    output = keys.map(function(key) {
      return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
    });
  }

  ctx.seen.pop();

  return reduceToSingleString(output, base, braces);
}


function formatPrimitive(ctx, value) {
  if (isUndefined(value))
    return ctx.stylize('undefined', 'undefined');
  if (isString(value)) {
    var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
                                             .replace(/'/g, "\\'")
                                             .replace(/\\"/g, '"') + '\'';
    return ctx.stylize(simple, 'string');
  }
  if (isNumber(value))
    return ctx.stylize('' + value, 'number');
  if (isBoolean(value))
    return ctx.stylize('' + value, 'boolean');
  // For some reason typeof null is "object", so special case here.
  if (isNull(value))
    return ctx.stylize('null', 'null');
}


function formatError(value) {
  return '[' + Error.prototype.toString.call(value) + ']';
}


function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
  var output = [];
  for (var i = 0, l = value.length; i < l; ++i) {
    if (hasOwnProperty(value, String(i))) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          String(i), true));
    } else {
      output.push('');
    }
  }
  keys.forEach(function(key) {
    if (!key.match(/^\d+$/)) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          key, true));
    }
  });
  return output;
}


function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
  var name, str, desc;
  desc = Object.getOwnPropertyDescriptor(value, key) || { value: value[key] };
  if (desc.get) {
    if (desc.set) {
      str = ctx.stylize('[Getter/Setter]', 'special');
    } else {
      str = ctx.stylize('[Getter]', 'special');
    }
  } else {
    if (desc.set) {
      str = ctx.stylize('[Setter]', 'special');
    }
  }
  if (!hasOwnProperty(visibleKeys, key)) {
    name = '[' + key + ']';
  }
  if (!str) {
    if (ctx.seen.indexOf(desc.value) < 0) {
      if (isNull(recurseTimes)) {
        str = formatValue(ctx, desc.value, null);
      } else {
        str = formatValue(ctx, desc.value, recurseTimes - 1);
      }
      if (str.indexOf('\n') > -1) {
        if (array) {
          str = str.split('\n').map(function(line) {
            return '  ' + line;
          }).join('\n').substr(2);
        } else {
          str = '\n' + str.split('\n').map(function(line) {
            return '   ' + line;
          }).join('\n');
        }
      }
    } else {
      str = ctx.stylize('[Circular]', 'special');
    }
  }
  if (isUndefined(name)) {
    if (array && key.match(/^\d+$/)) {
      return str;
    }
    name = JSON.stringify('' + key);
    if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
      name = name.substr(1, name.length - 2);
      name = ctx.stylize(name, 'name');
    } else {
      name = name.replace(/'/g, "\\'")
                 .replace(/\\"/g, '"')
                 .replace(/(^"|"$)/g, "'");
      name = ctx.stylize(name, 'string');
    }
  }

  return name + ': ' + str;
}


function reduceToSingleString(output, base, braces) {
  var numLinesEst = 0;
  var length = output.reduce(function(prev, cur) {
    numLinesEst++;
    if (cur.indexOf('\n') >= 0) numLinesEst++;
    return prev + cur.replace(/\u001b\[\d\d?m/g, '').length + 1;
  }, 0);

  if (length > 60) {
    return braces[0] +
           (base === '' ? '' : base + '\n ') +
           ' ' +
           output.join(',\n  ') +
           ' ' +
           braces[1];
  }

  return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
}


// NOTE: These type checking functions intentionally don't use `instanceof`
// because it is fragile and can be easily faked with `Object.create()`.
function isArray(ar) {
  return Array.isArray(ar);
}
exports.isArray = isArray;

function isBoolean(arg) {
  return typeof arg === 'boolean';
}
exports.isBoolean = isBoolean;

function isNull(arg) {
  return arg === null;
}
exports.isNull = isNull;

function isNullOrUndefined(arg) {
  return arg == null;
}
exports.isNullOrUndefined = isNullOrUndefined;

function isNumber(arg) {
  return typeof arg === 'number';
}
exports.isNumber = isNumber;

function isString(arg) {
  return typeof arg === 'string';
}
exports.isString = isString;

function isSymbol(arg) {
  return typeof arg === 'symbol';
}
exports.isSymbol = isSymbol;

function isUndefined(arg) {
  return arg === void 0;
}
exports.isUndefined = isUndefined;

function isRegExp(re) {
  return isObject(re) && objectToString(re) === '[object RegExp]';
}
exports.isRegExp = isRegExp;

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}
exports.isObject = isObject;

function isDate(d) {
  return isObject(d) && objectToString(d) === '[object Date]';
}
exports.isDate = isDate;

function isError(e) {
  return isObject(e) &&
      (objectToString(e) === '[object Error]' || e instanceof Error);
}
exports.isError = isError;

function isFunction(arg) {
  return typeof arg === 'function';
}
exports.isFunction = isFunction;

function isPrimitive(arg) {
  return arg === null ||
         typeof arg === 'boolean' ||
         typeof arg === 'number' ||
         typeof arg === 'string' ||
         typeof arg === 'symbol' ||  // ES6 symbol
         typeof arg === 'undefined';
}
exports.isPrimitive = isPrimitive;

exports.isBuffer = require('./support/isBuffer');

function objectToString(o) {
  return Object.prototype.toString.call(o);
}


function pad(n) {
  return n < 10 ? '0' + n.toString(10) : n.toString(10);
}


var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
              'Oct', 'Nov', 'Dec'];

// 26 Feb 16:19:34
function timestamp() {
  var d = new Date();
  var time = [pad(d.getHours()),
              pad(d.getMinutes()),
              pad(d.getSeconds())].join(':');
  return [d.getDate(), months[d.getMonth()], time].join(' ');
}


// log is just a thin wrapper to console.log that prepends a timestamp
exports.log = function() {
  console.log('%s - %s', timestamp(), exports.format.apply(exports, arguments));
};


/**
 * Inherit the prototype methods from one constructor into another.
 *
 * The Function.prototype.inherits from lang.js rewritten as a standalone
 * function (not on Function.prototype). NOTE: If this file is to be loaded
 * during bootstrapping this function needs to be rewritten using some native
 * functions as prototype setup using normal JavaScript does not work as
 * expected during bootstrapping (see mirror.js in r114903).
 *
 * @param {function} ctor Constructor function which needs to inherit the
 *     prototype.
 * @param {function} superCtor Constructor function to inherit prototype from.
 */
exports.inherits = require('inherits');

exports._extend = function(origin, add) {
  // Don't do anything if add isn't an object
  if (!add || !isObject(add)) return origin;

  var keys = Object.keys(add);
  var i = keys.length;
  while (i--) {
    origin[keys[i]] = add[keys[i]];
  }
  return origin;
};

function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./support/isBuffer":6,"_process":5,"inherits":4}],8:[function(require,module,exports){
module.exports = SafeParseTuple

function SafeParseTuple(obj, reviver) {
    var json
    var error = null

    try {
        json = JSON.parse(obj, reviver)
    } catch (err) {
        error = err
    }

    return [error, json]
}

},{}],9:[function(require,module,exports){
/*jslint eqeqeq: false, onevar: false, forin: true, nomen: false, regexp: false, plusplus: false*/
/*global module, require, __dirname, document*/
/**
 * Sinon core utilities. For internal use only.
 *
 * @author Christian Johansen (christian@cjohansen.no)
 * @license BSD
 *
 * Copyright (c) 2010-2013 Christian Johansen
 */
"use strict";

var sinon = (function (formatio) {
    var div = typeof document != "undefined" && document.createElement("div");
    var hasOwn = Object.prototype.hasOwnProperty;

    function isDOMNode(obj) {
        var success = false;

        try {
            obj.appendChild(div);
            success = div.parentNode == obj;
        } catch (e) {
            return false;
        } finally {
            try {
                obj.removeChild(div);
            } catch (e) {
                // Remove failed, not much we can do about that
            }
        }

        return success;
    }

    function isElement(obj) {
        return div && obj && obj.nodeType === 1 && isDOMNode(obj);
    }

    function isFunction(obj) {
        return typeof obj === "function" || !!(obj && obj.constructor && obj.call && obj.apply);
    }

    function isReallyNaN(val) {
        return typeof val === 'number' && isNaN(val);
    }

    function mirrorProperties(target, source) {
        for (var prop in source) {
            if (!hasOwn.call(target, prop)) {
                target[prop] = source[prop];
            }
        }
    }

    function isRestorable (obj) {
        return typeof obj === "function" && typeof obj.restore === "function" && obj.restore.sinon;
    }

    var sinon = {
        wrapMethod: function wrapMethod(object, property, method) {
            if (!object) {
                throw new TypeError("Should wrap property of object");
            }

            if (typeof method != "function") {
                throw new TypeError("Method wrapper should be function");
            }

            var wrappedMethod = object[property],
                error;

            if (!isFunction(wrappedMethod)) {
                error = new TypeError("Attempted to wrap " + (typeof wrappedMethod) + " property " +
                                    property + " as function");
            }

            if (wrappedMethod.restore && wrappedMethod.restore.sinon) {
                error = new TypeError("Attempted to wrap " + property + " which is already wrapped");
            }

            if (wrappedMethod.calledBefore) {
                var verb = !!wrappedMethod.returns ? "stubbed" : "spied on";
                error = new TypeError("Attempted to wrap " + property + " which is already " + verb);
            }

            if (error) {
                if (wrappedMethod._stack) {
                    error.stack += '\n--------------\n' + wrappedMethod._stack;
                }
                throw error;
            }

            // IE 8 does not support hasOwnProperty on the window object and Firefox has a problem
            // when using hasOwn.call on objects from other frames.
            var owned = object.hasOwnProperty ? object.hasOwnProperty(property) : hasOwn.call(object, property);
            object[property] = method;
            method.displayName = property;
            // Set up a stack trace which can be used later to find what line of
            // code the original method was created on.
            method._stack = (new Error('Stack Trace for original')).stack;

            method.restore = function () {
                // For prototype properties try to reset by delete first.
                // If this fails (ex: localStorage on mobile safari) then force a reset
                // via direct assignment.
                if (!owned) {
                    delete object[property];
                }
                if (object[property] === method) {
                    object[property] = wrappedMethod;
                }
            };

            method.restore.sinon = true;
            mirrorProperties(method, wrappedMethod);

            return method;
        },

        extend: function extend(target) {
            for (var i = 1, l = arguments.length; i < l; i += 1) {
                for (var prop in arguments[i]) {
                    if (arguments[i].hasOwnProperty(prop)) {
                        target[prop] = arguments[i][prop];
                    }

                    // DONT ENUM bug, only care about toString
                    if (arguments[i].hasOwnProperty("toString") &&
                        arguments[i].toString != target.toString) {
                        target.toString = arguments[i].toString;
                    }
                }
            }

            return target;
        },

        create: function create(proto) {
            var F = function () {};
            F.prototype = proto;
            return new F();
        },

        deepEqual: function deepEqual(a, b) {
            if (sinon.match && sinon.match.isMatcher(a)) {
                return a.test(b);
            }

            if (typeof a != 'object' || typeof b != 'object') {
                if (isReallyNaN(a) && isReallyNaN(b)) {
                    return true;
                } else {
                    return a === b;
                }
            }

            if (isElement(a) || isElement(b)) {
                return a === b;
            }

            if (a === b) {
                return true;
            }

            if ((a === null && b !== null) || (a !== null && b === null)) {
                return false;
            }

            if (a instanceof RegExp && b instanceof RegExp) {
              return (a.source === b.source) && (a.global === b.global) &&
                (a.ignoreCase === b.ignoreCase) && (a.multiline === b.multiline);
            }

            var aString = Object.prototype.toString.call(a);
            if (aString != Object.prototype.toString.call(b)) {
                return false;
            }

            if (aString == "[object Date]") {
                return a.valueOf() === b.valueOf();
            }

            var prop, aLength = 0, bLength = 0;

            if (aString == "[object Array]" && a.length !== b.length) {
                return false;
            }

            for (prop in a) {
                aLength += 1;

                if (!deepEqual(a[prop], b[prop])) {
                    return false;
                }
            }

            for (prop in b) {
                bLength += 1;
            }

            return aLength == bLength;
        },

        functionName: function functionName(func) {
            var name = func.displayName || func.name;

            // Use function decomposition as a last resort to get function
            // name. Does not rely on function decomposition to work - if it
            // doesn't debugging will be slightly less informative
            // (i.e. toString will say 'spy' rather than 'myFunc').
            if (!name) {
                var matches = func.toString().match(/function ([^\s\(]+)/);
                name = matches && matches[1];
            }

            return name;
        },

        functionToString: function toString() {
            if (this.getCall && this.callCount) {
                var thisValue, prop, i = this.callCount;

                while (i--) {
                    thisValue = this.getCall(i).thisValue;

                    for (prop in thisValue) {
                        if (thisValue[prop] === this) {
                            return prop;
                        }
                    }
                }
            }

            return this.displayName || "sinon fake";
        },

        getConfig: function (custom) {
            var config = {};
            custom = custom || {};
            var defaults = sinon.defaultConfig;

            for (var prop in defaults) {
                if (defaults.hasOwnProperty(prop)) {
                    config[prop] = custom.hasOwnProperty(prop) ? custom[prop] : defaults[prop];
                }
            }

            return config;
        },

        format: function (val) {
            return "" + val;
        },

        defaultConfig: {
            injectIntoThis: true,
            injectInto: null,
            properties: ["spy", "stub", "mock", "clock", "server", "requests"],
            useFakeTimers: true,
            useFakeServer: true
        },

        timesInWords: function timesInWords(count) {
            return count == 1 && "once" ||
                count == 2 && "twice" ||
                count == 3 && "thrice" ||
                (count || 0) + " times";
        },

        calledInOrder: function (spies) {
            for (var i = 1, l = spies.length; i < l; i++) {
                if (!spies[i - 1].calledBefore(spies[i]) || !spies[i].called) {
                    return false;
                }
            }

            return true;
        },

        orderByFirstCall: function (spies) {
            return spies.sort(function (a, b) {
                // uuid, won't ever be equal
                var aCall = a.getCall(0);
                var bCall = b.getCall(0);
                var aId = aCall && aCall.callId || -1;
                var bId = bCall && bCall.callId || -1;

                return aId < bId ? -1 : 1;
            });
        },

        log: function () {},

        logError: function (label, err) {
            var msg = label + " threw exception: ";
            sinon.log(msg + "[" + err.name + "] " + err.message);
            if (err.stack) { sinon.log(err.stack); }

            setTimeout(function () {
                err.message = msg + err.message;
                throw err;
            }, 0);
        },

        typeOf: function (value) {
            if (value === null) {
                return "null";
            }
            else if (value === undefined) {
                return "undefined";
            }
            var string = Object.prototype.toString.call(value);
            return string.substring(8, string.length - 1).toLowerCase();
        },

        createStubInstance: function (constructor) {
            if (typeof constructor !== "function") {
                throw new TypeError("The constructor should be a function.");
            }
            return sinon.stub(sinon.create(constructor.prototype));
        },

        restore: function (object) {
            if (object !== null && typeof object === "object") {
                for (var prop in object) {
                    if (isRestorable(object[prop])) {
                        object[prop].restore();
                    }
                }
            }
            else if (isRestorable(object)) {
                object.restore();
            }
        }
    };

    var isNode = typeof module !== "undefined" && module.exports;
    var isAMD = typeof define === 'function' && typeof define.amd === 'object' && define.amd;

    if (isAMD) {
        define(function(){
            return sinon;
        });
    } else if (isNode) {
        try {
            formatio = require("formatio");
        } catch (e) {}
        module.exports = sinon;
        module.exports.spy = require("./sinon/spy");
        module.exports.spyCall = require("./sinon/call");
        module.exports.behavior = require("./sinon/behavior");
        module.exports.stub = require("./sinon/stub");
        module.exports.mock = require("./sinon/mock");
        module.exports.collection = require("./sinon/collection");
        module.exports.assert = require("./sinon/assert");
        module.exports.sandbox = require("./sinon/sandbox");
        module.exports.test = require("./sinon/test");
        module.exports.testCase = require("./sinon/test_case");
        module.exports.assert = require("./sinon/assert");
        module.exports.match = require("./sinon/match");
    }

    if (formatio) {
        var formatter = formatio.configure({ quoteStrings: false });
        sinon.format = function () {
            return formatter.ascii.apply(formatter, arguments);
        };
    } else if (isNode) {
        try {
            var util = require("util");
            sinon.format = function (value) {
                return typeof value == "object" && value.toString === Object.prototype.toString ? util.inspect(value) : value;
            };
        } catch (e) {
            /* Node, but no util module - would be very old, but better safe than
             sorry */
        }
    }

    return sinon;
}(typeof formatio == "object" && formatio));

},{"./sinon/assert":10,"./sinon/behavior":11,"./sinon/call":12,"./sinon/collection":13,"./sinon/match":14,"./sinon/mock":15,"./sinon/sandbox":16,"./sinon/spy":17,"./sinon/stub":18,"./sinon/test":19,"./sinon/test_case":20,"formatio":22,"util":7}],10:[function(require,module,exports){
(function (global){
/**
 * @depend ../sinon.js
 * @depend stub.js
 */
/*jslint eqeqeq: false, onevar: false, nomen: false, plusplus: false*/
/*global module, require, sinon*/
/**
 * Assertions matching the test spy retrieval interface.
 *
 * @author Christian Johansen (christian@cjohansen.no)
 * @license BSD
 *
 * Copyright (c) 2010-2013 Christian Johansen
 */
"use strict";

(function (sinon, global) {
    var commonJSModule = typeof module !== "undefined" && module.exports;
    var slice = Array.prototype.slice;
    var assert;

    if (!sinon && commonJSModule) {
        sinon = require("../sinon");
    }

    if (!sinon) {
        return;
    }

    function verifyIsStub() {
        var method;

        for (var i = 0, l = arguments.length; i < l; ++i) {
            method = arguments[i];

            if (!method) {
                assert.fail("fake is not a spy");
            }

            if (typeof method != "function") {
                assert.fail(method + " is not a function");
            }

            if (typeof method.getCall != "function") {
                assert.fail(method + " is not stubbed");
            }
        }
    }

    function failAssertion(object, msg) {
        object = object || global;
        var failMethod = object.fail || assert.fail;
        failMethod.call(object, msg);
    }

    function mirrorPropAsAssertion(name, method, message) {
        if (arguments.length == 2) {
            message = method;
            method = name;
        }

        assert[name] = function (fake) {
            verifyIsStub(fake);

            var args = slice.call(arguments, 1);
            var failed = false;

            if (typeof method == "function") {
                failed = !method(fake);
            } else {
                failed = typeof fake[method] == "function" ?
                    !fake[method].apply(fake, args) : !fake[method];
            }

            if (failed) {
                failAssertion(this, fake.printf.apply(fake, [message].concat(args)));
            } else {
                assert.pass(name);
            }
        };
    }

    function exposedName(prefix, prop) {
        return !prefix || /^fail/.test(prop) ? prop :
            prefix + prop.slice(0, 1).toUpperCase() + prop.slice(1);
    }

    assert = {
        failException: "AssertError",

        fail: function fail(message) {
            var error = new Error(message);
            error.name = this.failException || assert.failException;

            throw error;
        },

        pass: function pass(assertion) {},

        callOrder: function assertCallOrder() {
            verifyIsStub.apply(null, arguments);
            var expected = "", actual = "";

            if (!sinon.calledInOrder(arguments)) {
                try {
                    expected = [].join.call(arguments, ", ");
                    var calls = slice.call(arguments);
                    var i = calls.length;
                    while (i) {
                        if (!calls[--i].called) {
                            calls.splice(i, 1);
                        }
                    }
                    actual = sinon.orderByFirstCall(calls).join(", ");
                } catch (e) {
                    // If this fails, we'll just fall back to the blank string
                }

                failAssertion(this, "expected " + expected + " to be " +
                              "called in order but were called as " + actual);
            } else {
                assert.pass("callOrder");
            }
        },

        callCount: function assertCallCount(method, count) {
            verifyIsStub(method);

            if (method.callCount != count) {
                var msg = "expected %n to be called " + sinon.timesInWords(count) +
                    " but was called %c%C";
                failAssertion(this, method.printf(msg));
            } else {
                assert.pass("callCount");
            }
        },

        expose: function expose(target, options) {
            if (!target) {
                throw new TypeError("target is null or undefined");
            }

            var o = options || {};
            var prefix = typeof o.prefix == "undefined" && "assert" || o.prefix;
            var includeFail = typeof o.includeFail == "undefined" || !!o.includeFail;

            for (var method in this) {
                if (method != "export" && (includeFail || !/^(fail)/.test(method))) {
                    target[exposedName(prefix, method)] = this[method];
                }
            }

            return target;
        },

        match: function match(actual, expectation) {
            var matcher = sinon.match(expectation);
            if (matcher.test(actual)) {
                assert.pass("match");
            } else {
                var formatted = [
                    "expected value to match",
                    "    expected = " + sinon.format(expectation),
                    "    actual = " + sinon.format(actual)
                ]
                failAssertion(this, formatted.join("\n"));
            }
        }
    };

    mirrorPropAsAssertion("called", "expected %n to have been called at least once but was never called");
    mirrorPropAsAssertion("notCalled", function (spy) { return !spy.called; },
                          "expected %n to not have been called but was called %c%C");
    mirrorPropAsAssertion("calledOnce", "expected %n to be called once but was called %c%C");
    mirrorPropAsAssertion("calledTwice", "expected %n to be called twice but was called %c%C");
    mirrorPropAsAssertion("calledThrice", "expected %n to be called thrice but was called %c%C");
    mirrorPropAsAssertion("calledOn", "expected %n to be called with %1 as this but was called with %t");
    mirrorPropAsAssertion("alwaysCalledOn", "expected %n to always be called with %1 as this but was called with %t");
    mirrorPropAsAssertion("calledWithNew", "expected %n to be called with new");
    mirrorPropAsAssertion("alwaysCalledWithNew", "expected %n to always be called with new");
    mirrorPropAsAssertion("calledWith", "expected %n to be called with arguments %*%C");
    mirrorPropAsAssertion("calledWithMatch", "expected %n to be called with match %*%C");
    mirrorPropAsAssertion("alwaysCalledWith", "expected %n to always be called with arguments %*%C");
    mirrorPropAsAssertion("alwaysCalledWithMatch", "expected %n to always be called with match %*%C");
    mirrorPropAsAssertion("calledWithExactly", "expected %n to be called with exact arguments %*%C");
    mirrorPropAsAssertion("alwaysCalledWithExactly", "expected %n to always be called with exact arguments %*%C");
    mirrorPropAsAssertion("neverCalledWith", "expected %n to never be called with arguments %*%C");
    mirrorPropAsAssertion("neverCalledWithMatch", "expected %n to never be called with match %*%C");
    mirrorPropAsAssertion("threw", "%n did not throw exception%C");
    mirrorPropAsAssertion("alwaysThrew", "%n did not always throw exception%C");

    if (commonJSModule) {
        module.exports = assert;
    } else {
        sinon.assert = assert;
    }
}(typeof sinon == "object" && sinon || null, typeof window != "undefined" ? window : (typeof self != "undefined") ? self : global));

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"../sinon":9}],11:[function(require,module,exports){
(function (process){
/**
 * @depend ../sinon.js
 */
/*jslint eqeqeq: false, onevar: false*/
/*global module, require, sinon, process, setImmediate, setTimeout*/
/**
 * Stub behavior
 *
 * @author Christian Johansen (christian@cjohansen.no)
 * @author Tim Fischbach (mail@timfischbach.de)
 * @license BSD
 *
 * Copyright (c) 2010-2013 Christian Johansen
 */
"use strict";

(function (sinon) {
    var commonJSModule = typeof module !== 'undefined' && module.exports;

    if (!sinon && commonJSModule) {
        sinon = require("../sinon");
    }

    if (!sinon) {
        return;
    }

    var slice = Array.prototype.slice;
    var join = Array.prototype.join;
    var proto;

    var nextTick = (function () {
        if (typeof process === "object" && typeof process.nextTick === "function") {
            return process.nextTick;
        } else if (typeof setImmediate === "function") {
            return setImmediate;
        } else {
            return function (callback) {
                setTimeout(callback, 0);
            };
        }
    })();

    function throwsException(error, message) {
        if (typeof error == "string") {
            this.exception = new Error(message || "");
            this.exception.name = error;
        } else if (!error) {
            this.exception = new Error("Error");
        } else {
            this.exception = error;
        }

        return this;
    }

    function getCallback(behavior, args) {
        var callArgAt = behavior.callArgAt;

        if (callArgAt < 0) {
            var callArgProp = behavior.callArgProp;

            for (var i = 0, l = args.length; i < l; ++i) {
                if (!callArgProp && typeof args[i] == "function") {
                    return args[i];
                }

                if (callArgProp && args[i] &&
                    typeof args[i][callArgProp] == "function") {
                    return args[i][callArgProp];
                }
            }

            return null;
        }

        return args[callArgAt];
    }

    function getCallbackError(behavior, func, args) {
        if (behavior.callArgAt < 0) {
            var msg;

            if (behavior.callArgProp) {
                msg = sinon.functionName(behavior.stub) +
                    " expected to yield to '" + behavior.callArgProp +
                    "', but no object with such a property was passed.";
            } else {
                msg = sinon.functionName(behavior.stub) +
                    " expected to yield, but no callback was passed.";
            }

            if (args.length > 0) {
                msg += " Received [" + join.call(args, ", ") + "]";
            }

            return msg;
        }

        return "argument at index " + behavior.callArgAt + " is not a function: " + func;
    }

    function callCallback(behavior, args) {
        if (typeof behavior.callArgAt == "number") {
            var func = getCallback(behavior, args);

            if (typeof func != "function") {
                throw new TypeError(getCallbackError(behavior, func, args));
            }

            if (behavior.callbackAsync) {
                nextTick(function() {
                    func.apply(behavior.callbackContext, behavior.callbackArguments);
                });
            } else {
                func.apply(behavior.callbackContext, behavior.callbackArguments);
            }
        }
    }

    proto = {
        create: function(stub) {
            var behavior = sinon.extend({}, sinon.behavior);
            delete behavior.create;
            behavior.stub = stub;

            return behavior;
        },

        isPresent: function() {
            return (typeof this.callArgAt == 'number' ||
                    this.exception ||
                    typeof this.returnArgAt == 'number' ||
                    this.returnThis ||
                    this.returnValueDefined);
        },

        invoke: function(context, args) {
            callCallback(this, args);

            if (this.exception) {
                throw this.exception;
            } else if (typeof this.returnArgAt == 'number') {
                return args[this.returnArgAt];
            } else if (this.returnThis) {
                return context;
            }

            return this.returnValue;
        },

        onCall: function(index) {
            return this.stub.onCall(index);
        },

        onFirstCall: function() {
            return this.stub.onFirstCall();
        },

        onSecondCall: function() {
            return this.stub.onSecondCall();
        },

        onThirdCall: function() {
            return this.stub.onThirdCall();
        },

        withArgs: function(/* arguments */) {
            throw new Error('Defining a stub by invoking "stub.onCall(...).withArgs(...)" is not supported. ' +
                            'Use "stub.withArgs(...).onCall(...)" to define sequential behavior for calls with certain arguments.');
        },

        callsArg: function callsArg(pos) {
            if (typeof pos != "number") {
                throw new TypeError("argument index is not number");
            }

            this.callArgAt = pos;
            this.callbackArguments = [];
            this.callbackContext = undefined;
            this.callArgProp = undefined;
            this.callbackAsync = false;

            return this;
        },

        callsArgOn: function callsArgOn(pos, context) {
            if (typeof pos != "number") {
                throw new TypeError("argument index is not number");
            }
            if (typeof context != "object") {
                throw new TypeError("argument context is not an object");
            }

            this.callArgAt = pos;
            this.callbackArguments = [];
            this.callbackContext = context;
            this.callArgProp = undefined;
            this.callbackAsync = false;

            return this;
        },

        callsArgWith: function callsArgWith(pos) {
            if (typeof pos != "number") {
                throw new TypeError("argument index is not number");
            }

            this.callArgAt = pos;
            this.callbackArguments = slice.call(arguments, 1);
            this.callbackContext = undefined;
            this.callArgProp = undefined;
            this.callbackAsync = false;

            return this;
        },

        callsArgOnWith: function callsArgWith(pos, context) {
            if (typeof pos != "number") {
                throw new TypeError("argument index is not number");
            }
            if (typeof context != "object") {
                throw new TypeError("argument context is not an object");
            }

            this.callArgAt = pos;
            this.callbackArguments = slice.call(arguments, 2);
            this.callbackContext = context;
            this.callArgProp = undefined;
            this.callbackAsync = false;

            return this;
        },

        yields: function () {
            this.callArgAt = -1;
            this.callbackArguments = slice.call(arguments, 0);
            this.callbackContext = undefined;
            this.callArgProp = undefined;
            this.callbackAsync = false;

            return this;
        },

        yieldsOn: function (context) {
            if (typeof context != "object") {
                throw new TypeError("argument context is not an object");
            }

            this.callArgAt = -1;
            this.callbackArguments = slice.call(arguments, 1);
            this.callbackContext = context;
            this.callArgProp = undefined;
            this.callbackAsync = false;

            return this;
        },

        yieldsTo: function (prop) {
            this.callArgAt = -1;
            this.callbackArguments = slice.call(arguments, 1);
            this.callbackContext = undefined;
            this.callArgProp = prop;
            this.callbackAsync = false;

            return this;
        },

        yieldsToOn: function (prop, context) {
            if (typeof context != "object") {
                throw new TypeError("argument context is not an object");
            }

            this.callArgAt = -1;
            this.callbackArguments = slice.call(arguments, 2);
            this.callbackContext = context;
            this.callArgProp = prop;
            this.callbackAsync = false;

            return this;
        },


        "throws": throwsException,
        throwsException: throwsException,

        returns: function returns(value) {
            this.returnValue = value;
            this.returnValueDefined = true;

            return this;
        },

        returnsArg: function returnsArg(pos) {
            if (typeof pos != "number") {
                throw new TypeError("argument index is not number");
            }

            this.returnArgAt = pos;

            return this;
        },

        returnsThis: function returnsThis() {
            this.returnThis = true;

            return this;
        }
    };

    // create asynchronous versions of callsArg* and yields* methods
    for (var method in proto) {
        // need to avoid creating anotherasync versions of the newly added async methods
        if (proto.hasOwnProperty(method) &&
            method.match(/^(callsArg|yields)/) &&
            !method.match(/Async/)) {
            proto[method + 'Async'] = (function (syncFnName) {
                return function () {
                    var result = this[syncFnName].apply(this, arguments);
                    this.callbackAsync = true;
                    return result;
                };
            })(method);
        }
    }

    if (commonJSModule) {
        module.exports = proto;
    } else {
        sinon.behavior = proto;
    }
}(typeof sinon == "object" && sinon || null));
}).call(this,require('_process'))
},{"../sinon":9,"_process":5}],12:[function(require,module,exports){
/**
  * @depend ../sinon.js
  * @depend match.js
  */
/*jslint eqeqeq: false, onevar: false, plusplus: false*/
/*global module, require, sinon*/
/**
  * Spy calls
  *
  * @author Christian Johansen (christian@cjohansen.no)
  * @author Maximilian Antoni (mail@maxantoni.de)
  * @license BSD
  *
  * Copyright (c) 2010-2013 Christian Johansen
  * Copyright (c) 2013 Maximilian Antoni
  */
"use strict";

(function (sinon) {
    var commonJSModule = typeof module !== 'undefined' && module.exports;
    if (!sinon && commonJSModule) {
        sinon = require("../sinon");
    }

    if (!sinon) {
        return;
    }

    function throwYieldError(proxy, text, args) {
        var msg = sinon.functionName(proxy) + text;
        if (args.length) {
            msg += " Received [" + slice.call(args).join(", ") + "]";
        }
        throw new Error(msg);
    }

    var slice = Array.prototype.slice;

    var callProto = {
        calledOn: function calledOn(thisValue) {
            if (sinon.match && sinon.match.isMatcher(thisValue)) {
                return thisValue.test(this.thisValue);
            }
            return this.thisValue === thisValue;
        },

        calledWith: function calledWith() {
            for (var i = 0, l = arguments.length; i < l; i += 1) {
                if (!sinon.deepEqual(arguments[i], this.args[i])) {
                    return false;
                }
            }

            return true;
        },

        calledWithMatch: function calledWithMatch() {
            for (var i = 0, l = arguments.length; i < l; i += 1) {
                var actual = this.args[i];
                var expectation = arguments[i];
                if (!sinon.match || !sinon.match(expectation).test(actual)) {
                    return false;
                }
            }
            return true;
        },

        calledWithExactly: function calledWithExactly() {
            return arguments.length == this.args.length &&
                this.calledWith.apply(this, arguments);
        },

        notCalledWith: function notCalledWith() {
            return !this.calledWith.apply(this, arguments);
        },

        notCalledWithMatch: function notCalledWithMatch() {
            return !this.calledWithMatch.apply(this, arguments);
        },

        returned: function returned(value) {
            return sinon.deepEqual(value, this.returnValue);
        },

        threw: function threw(error) {
            if (typeof error === "undefined" || !this.exception) {
                return !!this.exception;
            }

            return this.exception === error || this.exception.name === error;
        },

        calledWithNew: function calledWithNew() {
            return this.proxy.prototype && this.thisValue instanceof this.proxy;
        },

        calledBefore: function (other) {
            return this.callId < other.callId;
        },

        calledAfter: function (other) {
            return this.callId > other.callId;
        },

        callArg: function (pos) {
            this.args[pos]();
        },

        callArgOn: function (pos, thisValue) {
            this.args[pos].apply(thisValue);
        },

        callArgWith: function (pos) {
            this.callArgOnWith.apply(this, [pos, null].concat(slice.call(arguments, 1)));
        },

        callArgOnWith: function (pos, thisValue) {
            var args = slice.call(arguments, 2);
            this.args[pos].apply(thisValue, args);
        },

        "yield": function () {
            this.yieldOn.apply(this, [null].concat(slice.call(arguments, 0)));
        },

        yieldOn: function (thisValue) {
            var args = this.args;
            for (var i = 0, l = args.length; i < l; ++i) {
                if (typeof args[i] === "function") {
                    args[i].apply(thisValue, slice.call(arguments, 1));
                    return;
                }
            }
            throwYieldError(this.proxy, " cannot yield since no callback was passed.", args);
        },

        yieldTo: function (prop) {
            this.yieldToOn.apply(this, [prop, null].concat(slice.call(arguments, 1)));
        },

        yieldToOn: function (prop, thisValue) {
            var args = this.args;
            for (var i = 0, l = args.length; i < l; ++i) {
                if (args[i] && typeof args[i][prop] === "function") {
                    args[i][prop].apply(thisValue, slice.call(arguments, 2));
                    return;
                }
            }
            throwYieldError(this.proxy, " cannot yield to '" + prop +
                "' since no callback was passed.", args);
        },

        toString: function () {
            var callStr = this.proxy.toString() + "(";
            var args = [];

            for (var i = 0, l = this.args.length; i < l; ++i) {
                args.push(sinon.format(this.args[i]));
            }

            callStr = callStr + args.join(", ") + ")";

            if (typeof this.returnValue != "undefined") {
                callStr += " => " + sinon.format(this.returnValue);
            }

            if (this.exception) {
                callStr += " !" + this.exception.name;

                if (this.exception.message) {
                    callStr += "(" + this.exception.message + ")";
                }
            }

            return callStr;
        }
    };

    callProto.invokeCallback = callProto.yield;

    function createSpyCall(spy, thisValue, args, returnValue, exception, id) {
        if (typeof id !== "number") {
            throw new TypeError("Call id is not a number");
        }
        var proxyCall = sinon.create(callProto);
        proxyCall.proxy = spy;
        proxyCall.thisValue = thisValue;
        proxyCall.args = args;
        proxyCall.returnValue = returnValue;
        proxyCall.exception = exception;
        proxyCall.callId = id;

        return proxyCall;
    }
    createSpyCall.toString = callProto.toString; // used by mocks

    if (commonJSModule) {
        module.exports = createSpyCall;
    } else {
        sinon.spyCall = createSpyCall;
    }
}(typeof sinon == "object" && sinon || null));


},{"../sinon":9}],13:[function(require,module,exports){
/**
 * @depend ../sinon.js
 * @depend stub.js
 * @depend mock.js
 */
/*jslint eqeqeq: false, onevar: false, forin: true*/
/*global module, require, sinon*/
/**
 * Collections of stubs, spies and mocks.
 *
 * @author Christian Johansen (christian@cjohansen.no)
 * @license BSD
 *
 * Copyright (c) 2010-2013 Christian Johansen
 */
"use strict";

(function (sinon) {
    var commonJSModule = typeof module !== 'undefined' && module.exports;
    var push = [].push;
    var hasOwnProperty = Object.prototype.hasOwnProperty;

    if (!sinon && commonJSModule) {
        sinon = require("../sinon");
    }

    if (!sinon) {
        return;
    }

    function getFakes(fakeCollection) {
        if (!fakeCollection.fakes) {
            fakeCollection.fakes = [];
        }

        return fakeCollection.fakes;
    }

    function each(fakeCollection, method) {
        var fakes = getFakes(fakeCollection);

        for (var i = 0, l = fakes.length; i < l; i += 1) {
            if (typeof fakes[i][method] == "function") {
                fakes[i][method]();
            }
        }
    }

    function compact(fakeCollection) {
        var fakes = getFakes(fakeCollection);
        var i = 0;
        while (i < fakes.length) {
          fakes.splice(i, 1);
        }
    }

    var collection = {
        verify: function resolve() {
            each(this, "verify");
        },

        restore: function restore() {
            each(this, "restore");
            compact(this);
        },

        verifyAndRestore: function verifyAndRestore() {
            var exception;

            try {
                this.verify();
            } catch (e) {
                exception = e;
            }

            this.restore();

            if (exception) {
                throw exception;
            }
        },

        add: function add(fake) {
            push.call(getFakes(this), fake);
            return fake;
        },

        spy: function spy() {
            return this.add(sinon.spy.apply(sinon, arguments));
        },

        stub: function stub(object, property, value) {
            if (property) {
                var original = object[property];

                if (typeof original != "function") {
                    if (!hasOwnProperty.call(object, property)) {
                        throw new TypeError("Cannot stub non-existent own property " + property);
                    }

                    object[property] = value;

                    return this.add({
                        restore: function () {
                            object[property] = original;
                        }
                    });
                }
            }
            if (!property && !!object && typeof object == "object") {
                var stubbedObj = sinon.stub.apply(sinon, arguments);

                for (var prop in stubbedObj) {
                    if (typeof stubbedObj[prop] === "function") {
                        this.add(stubbedObj[prop]);
                    }
                }

                return stubbedObj;
            }

            return this.add(sinon.stub.apply(sinon, arguments));
        },

        mock: function mock() {
            return this.add(sinon.mock.apply(sinon, arguments));
        },

        inject: function inject(obj) {
            var col = this;

            obj.spy = function () {
                return col.spy.apply(col, arguments);
            };

            obj.stub = function () {
                return col.stub.apply(col, arguments);
            };

            obj.mock = function () {
                return col.mock.apply(col, arguments);
            };

            return obj;
        }
    };

    if (commonJSModule) {
        module.exports = collection;
    } else {
        sinon.collection = collection;
    }
}(typeof sinon == "object" && sinon || null));

},{"../sinon":9}],14:[function(require,module,exports){
/* @depend ../sinon.js */
/*jslint eqeqeq: false, onevar: false, plusplus: false*/
/*global module, require, sinon*/
/**
 * Match functions
 *
 * @author Maximilian Antoni (mail@maxantoni.de)
 * @license BSD
 *
 * Copyright (c) 2012 Maximilian Antoni
 */
"use strict";

(function (sinon) {
    var commonJSModule = typeof module !== 'undefined' && module.exports;

    if (!sinon && commonJSModule) {
        sinon = require("../sinon");
    }

    if (!sinon) {
        return;
    }

    function assertType(value, type, name) {
        var actual = sinon.typeOf(value);
        if (actual !== type) {
            throw new TypeError("Expected type of " + name + " to be " +
                type + ", but was " + actual);
        }
    }

    var matcher = {
        toString: function () {
            return this.message;
        }
    };

    function isMatcher(object) {
        return matcher.isPrototypeOf(object);
    }

    function matchObject(expectation, actual) {
        if (actual === null || actual === undefined) {
            return false;
        }
        for (var key in expectation) {
            if (expectation.hasOwnProperty(key)) {
                var exp = expectation[key];
                var act = actual[key];
                if (match.isMatcher(exp)) {
                    if (!exp.test(act)) {
                        return false;
                    }
                } else if (sinon.typeOf(exp) === "object") {
                    if (!matchObject(exp, act)) {
                        return false;
                    }
                } else if (!sinon.deepEqual(exp, act)) {
                    return false;
                }
            }
        }
        return true;
    }

    matcher.or = function (m2) {
        if (!arguments.length) {
            throw new TypeError("Matcher expected");
        } else if (!isMatcher(m2)) {
            m2 = match(m2);
        }
        var m1 = this;
        var or = sinon.create(matcher);
        or.test = function (actual) {
            return m1.test(actual) || m2.test(actual);
        };
        or.message = m1.message + ".or(" + m2.message + ")";
        return or;
    };

    matcher.and = function (m2) {
        if (!arguments.length) {
            throw new TypeError("Matcher expected");
        } else if (!isMatcher(m2)) {
            m2 = match(m2);
        }
        var m1 = this;
        var and = sinon.create(matcher);
        and.test = function (actual) {
            return m1.test(actual) && m2.test(actual);
        };
        and.message = m1.message + ".and(" + m2.message + ")";
        return and;
    };

    var match = function (expectation, message) {
        var m = sinon.create(matcher);
        var type = sinon.typeOf(expectation);
        switch (type) {
        case "object":
            if (typeof expectation.test === "function") {
                m.test = function (actual) {
                    return expectation.test(actual) === true;
                };
                m.message = "match(" + sinon.functionName(expectation.test) + ")";
                return m;
            }
            var str = [];
            for (var key in expectation) {
                if (expectation.hasOwnProperty(key)) {
                    str.push(key + ": " + expectation[key]);
                }
            }
            m.test = function (actual) {
                return matchObject(expectation, actual);
            };
            m.message = "match(" + str.join(", ") + ")";
            break;
        case "number":
            m.test = function (actual) {
                return expectation == actual;
            };
            break;
        case "string":
            m.test = function (actual) {
                if (typeof actual !== "string") {
                    return false;
                }
                return actual.indexOf(expectation) !== -1;
            };
            m.message = "match(\"" + expectation + "\")";
            break;
        case "regexp":
            m.test = function (actual) {
                if (typeof actual !== "string") {
                    return false;
                }
                return expectation.test(actual);
            };
            break;
        case "function":
            m.test = expectation;
            if (message) {
                m.message = message;
            } else {
                m.message = "match(" + sinon.functionName(expectation) + ")";
            }
            break;
        default:
            m.test = function (actual) {
              return sinon.deepEqual(expectation, actual);
            };
        }
        if (!m.message) {
            m.message = "match(" + expectation + ")";
        }
        return m;
    };

    match.isMatcher = isMatcher;

    match.any = match(function () {
        return true;
    }, "any");

    match.defined = match(function (actual) {
        return actual !== null && actual !== undefined;
    }, "defined");

    match.truthy = match(function (actual) {
        return !!actual;
    }, "truthy");

    match.falsy = match(function (actual) {
        return !actual;
    }, "falsy");

    match.same = function (expectation) {
        return match(function (actual) {
            return expectation === actual;
        }, "same(" + expectation + ")");
    };

    match.typeOf = function (type) {
        assertType(type, "string", "type");
        return match(function (actual) {
            return sinon.typeOf(actual) === type;
        }, "typeOf(\"" + type + "\")");
    };

    match.instanceOf = function (type) {
        assertType(type, "function", "type");
        return match(function (actual) {
            return actual instanceof type;
        }, "instanceOf(" + sinon.functionName(type) + ")");
    };

    function createPropertyMatcher(propertyTest, messagePrefix) {
        return function (property, value) {
            assertType(property, "string", "property");
            var onlyProperty = arguments.length === 1;
            var message = messagePrefix + "(\"" + property + "\"";
            if (!onlyProperty) {
                message += ", " + value;
            }
            message += ")";
            return match(function (actual) {
                if (actual === undefined || actual === null ||
                        !propertyTest(actual, property)) {
                    return false;
                }
                return onlyProperty || sinon.deepEqual(value, actual[property]);
            }, message);
        };
    }

    match.has = createPropertyMatcher(function (actual, property) {
        if (typeof actual === "object") {
            return property in actual;
        }
        return actual[property] !== undefined;
    }, "has");

    match.hasOwn = createPropertyMatcher(function (actual, property) {
        return actual.hasOwnProperty(property);
    }, "hasOwn");

    match.bool = match.typeOf("boolean");
    match.number = match.typeOf("number");
    match.string = match.typeOf("string");
    match.object = match.typeOf("object");
    match.func = match.typeOf("function");
    match.array = match.typeOf("array");
    match.regexp = match.typeOf("regexp");
    match.date = match.typeOf("date");

    if (commonJSModule) {
        module.exports = match;
    } else {
        sinon.match = match;
    }
}(typeof sinon == "object" && sinon || null));

},{"../sinon":9}],15:[function(require,module,exports){
/**
 * @depend ../sinon.js
 * @depend stub.js
 */
/*jslint eqeqeq: false, onevar: false, nomen: false*/
/*global module, require, sinon*/
/**
 * Mock functions.
 *
 * @author Christian Johansen (christian@cjohansen.no)
 * @license BSD
 *
 * Copyright (c) 2010-2013 Christian Johansen
 */
"use strict";

(function (sinon) {
    var commonJSModule = typeof module !== 'undefined' && module.exports;
    var push = [].push;
    var match;

    if (!sinon && commonJSModule) {
        sinon = require("../sinon");
    }

    if (!sinon) {
        return;
    }

    match = sinon.match;

    if (!match && commonJSModule) {
        match = require("./match");
    }

    function mock(object) {
        if (!object) {
            return sinon.expectation.create("Anonymous mock");
        }

        return mock.create(object);
    }

    sinon.mock = mock;

    sinon.extend(mock, (function () {
        function each(collection, callback) {
            if (!collection) {
                return;
            }

            for (var i = 0, l = collection.length; i < l; i += 1) {
                callback(collection[i]);
            }
        }

        return {
            create: function create(object) {
                if (!object) {
                    throw new TypeError("object is null");
                }

                var mockObject = sinon.extend({}, mock);
                mockObject.object = object;
                delete mockObject.create;

                return mockObject;
            },

            expects: function expects(method) {
                if (!method) {
                    throw new TypeError("method is falsy");
                }

                if (!this.expectations) {
                    this.expectations = {};
                    this.proxies = [];
                }

                if (!this.expectations[method]) {
                    this.expectations[method] = [];
                    var mockObject = this;

                    sinon.wrapMethod(this.object, method, function () {
                        return mockObject.invokeMethod(method, this, arguments);
                    });

                    push.call(this.proxies, method);
                }

                var expectation = sinon.expectation.create(method);
                push.call(this.expectations[method], expectation);

                return expectation;
            },

            restore: function restore() {
                var object = this.object;

                each(this.proxies, function (proxy) {
                    if (typeof object[proxy].restore == "function") {
                        object[proxy].restore();
                    }
                });
            },

            verify: function verify() {
                var expectations = this.expectations || {};
                var messages = [], met = [];

                each(this.proxies, function (proxy) {
                    each(expectations[proxy], function (expectation) {
                        if (!expectation.met()) {
                            push.call(messages, expectation.toString());
                        } else {
                            push.call(met, expectation.toString());
                        }
                    });
                });

                this.restore();

                if (messages.length > 0) {
                    sinon.expectation.fail(messages.concat(met).join("\n"));
                } else {
                    sinon.expectation.pass(messages.concat(met).join("\n"));
                }

                return true;
            },

            invokeMethod: function invokeMethod(method, thisValue, args) {
                var expectations = this.expectations && this.expectations[method];
                var length = expectations && expectations.length || 0, i;

                for (i = 0; i < length; i += 1) {
                    if (!expectations[i].met() &&
                        expectations[i].allowsCall(thisValue, args)) {
                        return expectations[i].apply(thisValue, args);
                    }
                }

                var messages = [], available, exhausted = 0;

                for (i = 0; i < length; i += 1) {
                    if (expectations[i].allowsCall(thisValue, args)) {
                        available = available || expectations[i];
                    } else {
                        exhausted += 1;
                    }
                    push.call(messages, "    " + expectations[i].toString());
                }

                if (exhausted === 0) {
                    return available.apply(thisValue, args);
                }

                messages.unshift("Unexpected call: " + sinon.spyCall.toString.call({
                    proxy: method,
                    args: args
                }));

                sinon.expectation.fail(messages.join("\n"));
            }
        };
    }()));

    var times = sinon.timesInWords;

    sinon.expectation = (function () {
        var slice = Array.prototype.slice;
        var _invoke = sinon.spy.invoke;

        function callCountInWords(callCount) {
            if (callCount == 0) {
                return "never called";
            } else {
                return "called " + times(callCount);
            }
        }

        function expectedCallCountInWords(expectation) {
            var min = expectation.minCalls;
            var max = expectation.maxCalls;

            if (typeof min == "number" && typeof max == "number") {
                var str = times(min);

                if (min != max) {
                    str = "at least " + str + " and at most " + times(max);
                }

                return str;
            }

            if (typeof min == "number") {
                return "at least " + times(min);
            }

            return "at most " + times(max);
        }

        function receivedMinCalls(expectation) {
            var hasMinLimit = typeof expectation.minCalls == "number";
            return !hasMinLimit || expectation.callCount >= expectation.minCalls;
        }

        function receivedMaxCalls(expectation) {
            if (typeof expectation.maxCalls != "number") {
                return false;
            }

            return expectation.callCount == expectation.maxCalls;
        }

        function verifyMatcher(possibleMatcher, arg){
            if (match && match.isMatcher(possibleMatcher)) {
                return possibleMatcher.test(arg);
            } else {
                return true;
            }
        }

        return {
            minCalls: 1,
            maxCalls: 1,

            create: function create(methodName) {
                var expectation = sinon.extend(sinon.stub.create(), sinon.expectation);
                delete expectation.create;
                expectation.method = methodName;

                return expectation;
            },

            invoke: function invoke(func, thisValue, args) {
                this.verifyCallAllowed(thisValue, args);

                return _invoke.apply(this, arguments);
            },

            atLeast: function atLeast(num) {
                if (typeof num != "number") {
                    throw new TypeError("'" + num + "' is not number");
                }

                if (!this.limitsSet) {
                    this.maxCalls = null;
                    this.limitsSet = true;
                }

                this.minCalls = num;

                return this;
            },

            atMost: function atMost(num) {
                if (typeof num != "number") {
                    throw new TypeError("'" + num + "' is not number");
                }

                if (!this.limitsSet) {
                    this.minCalls = null;
                    this.limitsSet = true;
                }

                this.maxCalls = num;

                return this;
            },

            never: function never() {
                return this.exactly(0);
            },

            once: function once() {
                return this.exactly(1);
            },

            twice: function twice() {
                return this.exactly(2);
            },

            thrice: function thrice() {
                return this.exactly(3);
            },

            exactly: function exactly(num) {
                if (typeof num != "number") {
                    throw new TypeError("'" + num + "' is not a number");
                }

                this.atLeast(num);
                return this.atMost(num);
            },

            met: function met() {
                return !this.failed && receivedMinCalls(this);
            },

            verifyCallAllowed: function verifyCallAllowed(thisValue, args) {
                if (receivedMaxCalls(this)) {
                    this.failed = true;
                    sinon.expectation.fail(this.method + " already called " + times(this.maxCalls));
                }

                if ("expectedThis" in this && this.expectedThis !== thisValue) {
                    sinon.expectation.fail(this.method + " called with " + thisValue + " as thisValue, expected " +
                        this.expectedThis);
                }

                if (!("expectedArguments" in this)) {
                    return;
                }

                if (!args) {
                    sinon.expectation.fail(this.method + " received no arguments, expected " +
                        sinon.format(this.expectedArguments));
                }

                if (args.length < this.expectedArguments.length) {
                    sinon.expectation.fail(this.method + " received too few arguments (" + sinon.format(args) +
                        "), expected " + sinon.format(this.expectedArguments));
                }

                if (this.expectsExactArgCount &&
                    args.length != this.expectedArguments.length) {
                    sinon.expectation.fail(this.method + " received too many arguments (" + sinon.format(args) +
                        "), expected " + sinon.format(this.expectedArguments));
                }

                for (var i = 0, l = this.expectedArguments.length; i < l; i += 1) {

                    if (!verifyMatcher(this.expectedArguments[i],args[i])) {
                        sinon.expectation.fail(this.method + " received wrong arguments " + sinon.format(args) +
                            ", didn't match " + this.expectedArguments.toString());
                    }

                    if (!sinon.deepEqual(this.expectedArguments[i], args[i])) {
                        sinon.expectation.fail(this.method + " received wrong arguments " + sinon.format(args) +
                            ", expected " + sinon.format(this.expectedArguments));
                    }
                }
            },

            allowsCall: function allowsCall(thisValue, args) {
                if (this.met() && receivedMaxCalls(this)) {
                    return false;
                }

                if ("expectedThis" in this && this.expectedThis !== thisValue) {
                    return false;
                }

                if (!("expectedArguments" in this)) {
                    return true;
                }

                args = args || [];

                if (args.length < this.expectedArguments.length) {
                    return false;
                }

                if (this.expectsExactArgCount &&
                    args.length != this.expectedArguments.length) {
                    return false;
                }

                for (var i = 0, l = this.expectedArguments.length; i < l; i += 1) {
                    if (!verifyMatcher(this.expectedArguments[i],args[i])) {
                        return false;
                    }

                    if (!sinon.deepEqual(this.expectedArguments[i], args[i])) {
                        return false;
                    }
                }

                return true;
            },

            withArgs: function withArgs() {
                this.expectedArguments = slice.call(arguments);
                return this;
            },

            withExactArgs: function withExactArgs() {
                this.withArgs.apply(this, arguments);
                this.expectsExactArgCount = true;
                return this;
            },

            on: function on(thisValue) {
                this.expectedThis = thisValue;
                return this;
            },

            toString: function () {
                var args = (this.expectedArguments || []).slice();

                if (!this.expectsExactArgCount) {
                    push.call(args, "[...]");
                }

                var callStr = sinon.spyCall.toString.call({
                    proxy: this.method || "anonymous mock expectation",
                    args: args
                });

                var message = callStr.replace(", [...", "[, ...") + " " +
                    expectedCallCountInWords(this);

                if (this.met()) {
                    return "Expectation met: " + message;
                }

                return "Expected " + message + " (" +
                    callCountInWords(this.callCount) + ")";
            },

            verify: function verify() {
                if (!this.met()) {
                    sinon.expectation.fail(this.toString());
                } else {
                    sinon.expectation.pass(this.toString());
                }

                return true;
            },

            pass: function(message) {
              sinon.assert.pass(message);
            },
            fail: function (message) {
                var exception = new Error(message);
                exception.name = "ExpectationError";

                throw exception;
            }
        };
    }());

    if (commonJSModule) {
        module.exports = mock;
    } else {
        sinon.mock = mock;
    }
}(typeof sinon == "object" && sinon || null));

},{"../sinon":9,"./match":14}],16:[function(require,module,exports){
/**
 * @depend ../sinon.js
 * @depend collection.js
 * @depend util/fake_timers.js
 * @depend util/fake_server_with_clock.js
 */
/*jslint eqeqeq: false, onevar: false, plusplus: false*/
/*global require, module*/
/**
 * Manages fake collections as well as fake utilities such as Sinon's
 * timers and fake XHR implementation in one convenient object.
 *
 * @author Christian Johansen (christian@cjohansen.no)
 * @license BSD
 *
 * Copyright (c) 2010-2013 Christian Johansen
 */
"use strict";

if (typeof module !== 'undefined' && module.exports) {
    var sinon = require("../sinon");
    sinon.extend(sinon, require("./util/fake_timers"));
}

(function () {
    var push = [].push;

    function exposeValue(sandbox, config, key, value) {
        if (!value) {
            return;
        }

        if (config.injectInto && !(key in config.injectInto)) {
            config.injectInto[key] = value;
            sandbox.injectedKeys.push(key);
        } else {
            push.call(sandbox.args, value);
        }
    }

    function prepareSandboxFromConfig(config) {
        var sandbox = sinon.create(sinon.sandbox);

        if (config.useFakeServer) {
            if (typeof config.useFakeServer == "object") {
                sandbox.serverPrototype = config.useFakeServer;
            }

            sandbox.useFakeServer();
        }

        if (config.useFakeTimers) {
            if (typeof config.useFakeTimers == "object") {
                sandbox.useFakeTimers.apply(sandbox, config.useFakeTimers);
            } else {
                sandbox.useFakeTimers();
            }
        }

        return sandbox;
    }

    sinon.sandbox = sinon.extend(sinon.create(sinon.collection), {
        useFakeTimers: function useFakeTimers() {
            this.clock = sinon.useFakeTimers.apply(sinon, arguments);

            return this.add(this.clock);
        },

        serverPrototype: sinon.fakeServer,

        useFakeServer: function useFakeServer() {
            var proto = this.serverPrototype || sinon.fakeServer;

            if (!proto || !proto.create) {
                return null;
            }

            this.server = proto.create();
            return this.add(this.server);
        },

        inject: function (obj) {
            sinon.collection.inject.call(this, obj);

            if (this.clock) {
                obj.clock = this.clock;
            }

            if (this.server) {
                obj.server = this.server;
                obj.requests = this.server.requests;
            }

            return obj;
        },

        restore: function () {
            sinon.collection.restore.apply(this, arguments);
            this.restoreContext();
        },

        restoreContext: function () {
            if (this.injectedKeys) {
                for (var i = 0, j = this.injectedKeys.length; i < j; i++) {
                    delete this.injectInto[this.injectedKeys[i]];
                }
                this.injectedKeys = [];
            }
        },

        create: function (config) {
            if (!config) {
                return sinon.create(sinon.sandbox);
            }

            var sandbox = prepareSandboxFromConfig(config);
            sandbox.args = sandbox.args || [];
            sandbox.injectedKeys = [];
            sandbox.injectInto = config.injectInto;
            var prop, value, exposed = sandbox.inject({});

            if (config.properties) {
                for (var i = 0, l = config.properties.length; i < l; i++) {
                    prop = config.properties[i];
                    value = exposed[prop] || prop == "sandbox" && sandbox;
                    exposeValue(sandbox, config, prop, value);
                }
            } else {
                exposeValue(sandbox, config, "sandbox", value);
            }

            return sandbox;
        }
    });

    sinon.sandbox.useFakeXMLHttpRequest = sinon.sandbox.useFakeServer;

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = sinon.sandbox;
    }
}());

},{"../sinon":9,"./util/fake_timers":21}],17:[function(require,module,exports){
/**
  * @depend ../sinon.js
  * @depend call.js
  */
/*jslint eqeqeq: false, onevar: false, plusplus: false*/
/*global module, require, sinon*/
/**
  * Spy functions
  *
  * @author Christian Johansen (christian@cjohansen.no)
  * @license BSD
  *
  * Copyright (c) 2010-2013 Christian Johansen
  */
"use strict";

(function (sinon) {
    var commonJSModule = typeof module !== 'undefined' && module.exports;
    var push = Array.prototype.push;
    var slice = Array.prototype.slice;
    var callId = 0;

    if (!sinon && commonJSModule) {
        sinon = require("../sinon");
    }

    if (!sinon) {
        return;
    }

    function spy(object, property) {
        if (!property && typeof object == "function") {
            return spy.create(object);
        }

        if (!object && !property) {
            return spy.create(function () { });
        }

        var method = object[property];
        return sinon.wrapMethod(object, property, spy.create(method));
    }

    function matchingFake(fakes, args, strict) {
        if (!fakes) {
            return;
        }

        for (var i = 0, l = fakes.length; i < l; i++) {
            if (fakes[i].matches(args, strict)) {
                return fakes[i];
            }
        }
    }

    function incrementCallCount() {
        this.called = true;
        this.callCount += 1;
        this.notCalled = false;
        this.calledOnce = this.callCount == 1;
        this.calledTwice = this.callCount == 2;
        this.calledThrice = this.callCount == 3;
    }

    function createCallProperties() {
        this.firstCall = this.getCall(0);
        this.secondCall = this.getCall(1);
        this.thirdCall = this.getCall(2);
        this.lastCall = this.getCall(this.callCount - 1);
    }

    var vars = "a,b,c,d,e,f,g,h,i,j,k,l";
    function createProxy(func) {
        // Retain the function length:
        var p;
        if (func.length) {
            eval("p = (function proxy(" + vars.substring(0, func.length * 2 - 1) +
                ") { return p.invoke(func, this, slice.call(arguments)); });");
        }
        else {
            p = function proxy() {
                return p.invoke(func, this, slice.call(arguments));
            };
        }
        return p;
    }

    var uuid = 0;

    // Public API
    var spyApi = {
        reset: function () {
            this.called = false;
            this.notCalled = true;
            this.calledOnce = false;
            this.calledTwice = false;
            this.calledThrice = false;
            this.callCount = 0;
            this.firstCall = null;
            this.secondCall = null;
            this.thirdCall = null;
            this.lastCall = null;
            this.args = [];
            this.returnValues = [];
            this.thisValues = [];
            this.exceptions = [];
            this.callIds = [];
            if (this.fakes) {
                for (var i = 0; i < this.fakes.length; i++) {
                    this.fakes[i].reset();
                }
            }
        },

        create: function create(func) {
            var name;

            if (typeof func != "function") {
                func = function () { };
            } else {
                name = sinon.functionName(func);
            }

            var proxy = createProxy(func);

            sinon.extend(proxy, spy);
            delete proxy.create;
            sinon.extend(proxy, func);

            proxy.reset();
            proxy.prototype = func.prototype;
            proxy.displayName = name || "spy";
            proxy.toString = sinon.functionToString;
            proxy._create = sinon.spy.create;
            proxy.id = "spy#" + uuid++;

            return proxy;
        },

        invoke: function invoke(func, thisValue, args) {
            var matching = matchingFake(this.fakes, args);
            var exception, returnValue;

            incrementCallCount.call(this);
            push.call(this.thisValues, thisValue);
            push.call(this.args, args);
            push.call(this.callIds, callId++);

            try {
                if (matching) {
                    returnValue = matching.invoke(func, thisValue, args);
                } else {
                    returnValue = (this.func || func).apply(thisValue, args);
                }

                var thisCall = this.getCall(this.callCount - 1);
                if (thisCall.calledWithNew() && typeof returnValue !== 'object') {
                    returnValue = thisValue;
                }
            } catch (e) {
                exception = e;
            }

            push.call(this.exceptions, exception);
            push.call(this.returnValues, returnValue);

            createCallProperties.call(this);

            if (exception !== undefined) {
                throw exception;
            }

            return returnValue;
        },

        getCall: function getCall(i) {
            if (i < 0 || i >= this.callCount) {
                return null;
            }

            return sinon.spyCall(this, this.thisValues[i], this.args[i],
                                    this.returnValues[i], this.exceptions[i],
                                    this.callIds[i]);
        },

        getCalls: function () {
            var calls = [];
            var i;

            for (i = 0; i < this.callCount; i++) {
                calls.push(this.getCall(i));
            }

            return calls;
        },

        calledBefore: function calledBefore(spyFn) {
            if (!this.called) {
                return false;
            }

            if (!spyFn.called) {
                return true;
            }

            return this.callIds[0] < spyFn.callIds[spyFn.callIds.length - 1];
        },

        calledAfter: function calledAfter(spyFn) {
            if (!this.called || !spyFn.called) {
                return false;
            }

            return this.callIds[this.callCount - 1] > spyFn.callIds[spyFn.callCount - 1];
        },

        withArgs: function () {
            var args = slice.call(arguments);

            if (this.fakes) {
                var match = matchingFake(this.fakes, args, true);

                if (match) {
                    return match;
                }
            } else {
                this.fakes = [];
            }

            var original = this;
            var fake = this._create();
            fake.matchingAguments = args;
            fake.parent = this;
            push.call(this.fakes, fake);

            fake.withArgs = function () {
                return original.withArgs.apply(original, arguments);
            };

            for (var i = 0; i < this.args.length; i++) {
                if (fake.matches(this.args[i])) {
                    incrementCallCount.call(fake);
                    push.call(fake.thisValues, this.thisValues[i]);
                    push.call(fake.args, this.args[i]);
                    push.call(fake.returnValues, this.returnValues[i]);
                    push.call(fake.exceptions, this.exceptions[i]);
                    push.call(fake.callIds, this.callIds[i]);
                }
            }
            createCallProperties.call(fake);

            return fake;
        },

        matches: function (args, strict) {
            var margs = this.matchingAguments;

            if (margs.length <= args.length &&
                sinon.deepEqual(margs, args.slice(0, margs.length))) {
                return !strict || margs.length == args.length;
            }
        },

        printf: function (format) {
            var spy = this;
            var args = slice.call(arguments, 1);
            var formatter;

            return (format || "").replace(/%(.)/g, function (match, specifyer) {
                formatter = spyApi.formatters[specifyer];

                if (typeof formatter == "function") {
                    return formatter.call(null, spy, args);
                } else if (!isNaN(parseInt(specifyer, 10))) {
                    return sinon.format(args[specifyer - 1]);
                }

                return "%" + specifyer;
            });
        }
    };

    function delegateToCalls(method, matchAny, actual, notCalled) {
        spyApi[method] = function () {
            if (!this.called) {
                if (notCalled) {
                    return notCalled.apply(this, arguments);
                }
                return false;
            }

            var currentCall;
            var matches = 0;

            for (var i = 0, l = this.callCount; i < l; i += 1) {
                currentCall = this.getCall(i);

                if (currentCall[actual || method].apply(currentCall, arguments)) {
                    matches += 1;

                    if (matchAny) {
                        return true;
                    }
                }
            }

            return matches === this.callCount;
        };
    }

    delegateToCalls("calledOn", true);
    delegateToCalls("alwaysCalledOn", false, "calledOn");
    delegateToCalls("calledWith", true);
    delegateToCalls("calledWithMatch", true);
    delegateToCalls("alwaysCalledWith", false, "calledWith");
    delegateToCalls("alwaysCalledWithMatch", false, "calledWithMatch");
    delegateToCalls("calledWithExactly", true);
    delegateToCalls("alwaysCalledWithExactly", false, "calledWithExactly");
    delegateToCalls("neverCalledWith", false, "notCalledWith",
        function () { return true; });
    delegateToCalls("neverCalledWithMatch", false, "notCalledWithMatch",
        function () { return true; });
    delegateToCalls("threw", true);
    delegateToCalls("alwaysThrew", false, "threw");
    delegateToCalls("returned", true);
    delegateToCalls("alwaysReturned", false, "returned");
    delegateToCalls("calledWithNew", true);
    delegateToCalls("alwaysCalledWithNew", false, "calledWithNew");
    delegateToCalls("callArg", false, "callArgWith", function () {
        throw new Error(this.toString() + " cannot call arg since it was not yet invoked.");
    });
    spyApi.callArgWith = spyApi.callArg;
    delegateToCalls("callArgOn", false, "callArgOnWith", function () {
        throw new Error(this.toString() + " cannot call arg since it was not yet invoked.");
    });
    spyApi.callArgOnWith = spyApi.callArgOn;
    delegateToCalls("yield", false, "yield", function () {
        throw new Error(this.toString() + " cannot yield since it was not yet invoked.");
    });
    // "invokeCallback" is an alias for "yield" since "yield" is invalid in strict mode.
    spyApi.invokeCallback = spyApi.yield;
    delegateToCalls("yieldOn", false, "yieldOn", function () {
        throw new Error(this.toString() + " cannot yield since it was not yet invoked.");
    });
    delegateToCalls("yieldTo", false, "yieldTo", function (property) {
        throw new Error(this.toString() + " cannot yield to '" + property +
            "' since it was not yet invoked.");
    });
    delegateToCalls("yieldToOn", false, "yieldToOn", function (property) {
        throw new Error(this.toString() + " cannot yield to '" + property +
            "' since it was not yet invoked.");
    });

    spyApi.formatters = {
        "c": function (spy) {
            return sinon.timesInWords(spy.callCount);
        },

        "n": function (spy) {
            return spy.toString();
        },

        "C": function (spy) {
            var calls = [];

            for (var i = 0, l = spy.callCount; i < l; ++i) {
                var stringifiedCall = "    " + spy.getCall(i).toString();
                if (/\n/.test(calls[i - 1])) {
                    stringifiedCall = "\n" + stringifiedCall;
                }
                push.call(calls, stringifiedCall);
            }

            return calls.length > 0 ? "\n" + calls.join("\n") : "";
        },

        "t": function (spy) {
            var objects = [];

            for (var i = 0, l = spy.callCount; i < l; ++i) {
                push.call(objects, sinon.format(spy.thisValues[i]));
            }

            return objects.join(", ");
        },

        "*": function (spy, args) {
            var formatted = [];

            for (var i = 0, l = args.length; i < l; ++i) {
                push.call(formatted, sinon.format(args[i]));
            }

            return formatted.join(", ");
        }
    };

    sinon.extend(spy, spyApi);

    spy.spyCall = sinon.spyCall;

    if (commonJSModule) {
        module.exports = spy;
    } else {
        sinon.spy = spy;
    }
}(typeof sinon == "object" && sinon || null));

},{"../sinon":9}],18:[function(require,module,exports){
/**
 * @depend ../sinon.js
 * @depend spy.js
 * @depend behavior.js
 */
/*jslint eqeqeq: false, onevar: false*/
/*global module, require, sinon*/
/**
 * Stub functions
 *
 * @author Christian Johansen (christian@cjohansen.no)
 * @license BSD
 *
 * Copyright (c) 2010-2013 Christian Johansen
 */
"use strict";

(function (sinon) {
    var commonJSModule = typeof module !== 'undefined' && module.exports;

    if (!sinon && commonJSModule) {
        sinon = require("../sinon");
    }

    if (!sinon) {
        return;
    }

    function stub(object, property, func) {
        if (!!func && typeof func != "function") {
            throw new TypeError("Custom stub should be function");
        }

        var wrapper;

        if (func) {
            wrapper = sinon.spy && sinon.spy.create ? sinon.spy.create(func) : func;
        } else {
            wrapper = stub.create();
        }

        if (!object && typeof property === "undefined") {
            return sinon.stub.create();
        }

        if (typeof property === "undefined" && typeof object == "object") {
            for (var prop in object) {
                if (typeof object[prop] === "function") {
                    stub(object, prop);
                }
            }

            return object;
        }

        return sinon.wrapMethod(object, property, wrapper);
    }

    function getDefaultBehavior(stub) {
        return stub.defaultBehavior || getParentBehaviour(stub) || sinon.behavior.create(stub);
    }

    function getParentBehaviour(stub) {
        return (stub.parent && getCurrentBehavior(stub.parent));
    }

    function getCurrentBehavior(stub) {
        var behavior = stub.behaviors[stub.callCount - 1];
        return behavior && behavior.isPresent() ? behavior : getDefaultBehavior(stub);
    }

    var uuid = 0;

    sinon.extend(stub, (function () {
        var proto = {
            create: function create() {
                var functionStub = function () {
                    return getCurrentBehavior(functionStub).invoke(this, arguments);
                };

                functionStub.id = "stub#" + uuid++;
                var orig = functionStub;
                functionStub = sinon.spy.create(functionStub);
                functionStub.func = orig;

                sinon.extend(functionStub, stub);
                functionStub._create = sinon.stub.create;
                functionStub.displayName = "stub";
                functionStub.toString = sinon.functionToString;

                functionStub.defaultBehavior = null;
                functionStub.behaviors = [];

                return functionStub;
            },

            resetBehavior: function () {
                var i;

                this.defaultBehavior = null;
                this.behaviors = [];

                delete this.returnValue;
                delete this.returnArgAt;
                this.returnThis = false;

                if (this.fakes) {
                    for (i = 0; i < this.fakes.length; i++) {
                        this.fakes[i].resetBehavior();
                    }
                }
            },

            onCall: function(index) {
                if (!this.behaviors[index]) {
                    this.behaviors[index] = sinon.behavior.create(this);
                }

                return this.behaviors[index];
            },

            onFirstCall: function() {
                return this.onCall(0);
            },

            onSecondCall: function() {
                return this.onCall(1);
            },

            onThirdCall: function() {
                return this.onCall(2);
            }
        };

        for (var method in sinon.behavior) {
            if (sinon.behavior.hasOwnProperty(method) &&
                !proto.hasOwnProperty(method) &&
                method != 'create' &&
                method != 'withArgs' &&
                method != 'invoke') {
                proto[method] = (function(behaviorMethod) {
                    return function() {
                        this.defaultBehavior = this.defaultBehavior || sinon.behavior.create(this);
                        this.defaultBehavior[behaviorMethod].apply(this.defaultBehavior, arguments);
                        return this;
                    };
                }(method));
            }
        }

        return proto;
    }()));

    if (commonJSModule) {
        module.exports = stub;
    } else {
        sinon.stub = stub;
    }
}(typeof sinon == "object" && sinon || null));

},{"../sinon":9}],19:[function(require,module,exports){
/**
 * @depend ../sinon.js
 * @depend stub.js
 * @depend mock.js
 * @depend sandbox.js
 */
/*jslint eqeqeq: false, onevar: false, forin: true, plusplus: false*/
/*global module, require, sinon*/
/**
 * Test function, sandboxes fakes
 *
 * @author Christian Johansen (christian@cjohansen.no)
 * @license BSD
 *
 * Copyright (c) 2010-2013 Christian Johansen
 */
"use strict";

(function (sinon) {
    var commonJSModule = typeof module !== 'undefined' && module.exports;

    if (!sinon && commonJSModule) {
        sinon = require("../sinon");
    }

    if (!sinon) {
        return;
    }

    function test(callback) {
        var type = typeof callback;

        if (type != "function") {
            throw new TypeError("sinon.test needs to wrap a test function, got " + type);
        }

        return function () {
            var config = sinon.getConfig(sinon.config);
            config.injectInto = config.injectIntoThis && this || config.injectInto;
            var sandbox = sinon.sandbox.create(config);
            var exception, result;
            var args = Array.prototype.slice.call(arguments).concat(sandbox.args);

            try {
                result = callback.apply(this, args);
            } catch (e) {
                exception = e;
            }

            if (typeof exception !== "undefined") {
                sandbox.restore();
                throw exception;
            }
            else {
                sandbox.verifyAndRestore();
            }

            return result;
        };
    }

    test.config = {
        injectIntoThis: true,
        injectInto: null,
        properties: ["spy", "stub", "mock", "clock", "server", "requests"],
        useFakeTimers: true,
        useFakeServer: true
    };

    if (commonJSModule) {
        module.exports = test;
    } else {
        sinon.test = test;
    }
}(typeof sinon == "object" && sinon || null));

},{"../sinon":9}],20:[function(require,module,exports){
/**
 * @depend ../sinon.js
 * @depend test.js
 */
/*jslint eqeqeq: false, onevar: false, eqeqeq: false*/
/*global module, require, sinon*/
/**
 * Test case, sandboxes all test functions
 *
 * @author Christian Johansen (christian@cjohansen.no)
 * @license BSD
 *
 * Copyright (c) 2010-2013 Christian Johansen
 */
"use strict";

(function (sinon) {
    var commonJSModule = typeof module !== 'undefined' && module.exports;

    if (!sinon && commonJSModule) {
        sinon = require("../sinon");
    }

    if (!sinon || !Object.prototype.hasOwnProperty) {
        return;
    }

    function createTest(property, setUp, tearDown) {
        return function () {
            if (setUp) {
                setUp.apply(this, arguments);
            }

            var exception, result;

            try {
                result = property.apply(this, arguments);
            } catch (e) {
                exception = e;
            }

            if (tearDown) {
                tearDown.apply(this, arguments);
            }

            if (exception) {
                throw exception;
            }

            return result;
        };
    }

    function testCase(tests, prefix) {
        /*jsl:ignore*/
        if (!tests || typeof tests != "object") {
            throw new TypeError("sinon.testCase needs an object with test functions");
        }
        /*jsl:end*/

        prefix = prefix || "test";
        var rPrefix = new RegExp("^" + prefix);
        var methods = {}, testName, property, method;
        var setUp = tests.setUp;
        var tearDown = tests.tearDown;

        for (testName in tests) {
            if (tests.hasOwnProperty(testName)) {
                property = tests[testName];

                if (/^(setUp|tearDown)$/.test(testName)) {
                    continue;
                }

                if (typeof property == "function" && rPrefix.test(testName)) {
                    method = property;

                    if (setUp || tearDown) {
                        method = createTest(property, setUp, tearDown);
                    }

                    methods[testName] = sinon.test(method);
                } else {
                    methods[testName] = tests[testName];
                }
            }
        }

        return methods;
    }

    if (commonJSModule) {
        module.exports = testCase;
    } else {
        sinon.testCase = testCase;
    }
}(typeof sinon == "object" && sinon || null));

},{"../sinon":9}],21:[function(require,module,exports){
(function (global){
/*jslint eqeqeq: false, plusplus: false, evil: true, onevar: false, browser: true, forin: false*/
/*global module, require, window*/
/**
 * Fake timer API
 * setTimeout
 * setInterval
 * clearTimeout
 * clearInterval
 * tick
 * reset
 * Date
 *
 * Inspired by jsUnitMockTimeOut from JsUnit
 *
 * @author Christian Johansen (christian@cjohansen.no)
 * @license BSD
 *
 * Copyright (c) 2010-2013 Christian Johansen
 */
"use strict";

if (typeof sinon == "undefined") {
    var sinon = {};
}

(function (global) {
    // node expects setTimeout/setInterval to return a fn object w/ .ref()/.unref()
    // browsers, a number.
    // see https://github.com/cjohansen/Sinon.JS/pull/436
    var timeoutResult = setTimeout(function() {}, 0);
    var addTimerReturnsObject = typeof timeoutResult === 'object';
    clearTimeout(timeoutResult);

    var id = 1;

    function addTimer(args, recurring) {
        if (args.length === 0) {
            throw new Error("Function requires at least 1 parameter");
        }

        if (typeof args[0] === "undefined") {
            throw new Error("Callback must be provided to timer calls");
        }

        var toId = id++;
        var delay = args[1] || 0;

        if (!this.timeouts) {
            this.timeouts = {};
        }

        this.timeouts[toId] = {
            id: toId,
            func: args[0],
            callAt: this.now + delay,
            invokeArgs: Array.prototype.slice.call(args, 2)
        };

        if (recurring === true) {
            this.timeouts[toId].interval = delay;
        }

        if (addTimerReturnsObject) {
            return {
                id: toId,
                ref: function() {},
                unref: function() {}
            };
        }
        else {
            return toId;
        }
    }

    function parseTime(str) {
        if (!str) {
            return 0;
        }

        var strings = str.split(":");
        var l = strings.length, i = l;
        var ms = 0, parsed;

        if (l > 3 || !/^(\d\d:){0,2}\d\d?$/.test(str)) {
            throw new Error("tick only understands numbers and 'h:m:s'");
        }

        while (i--) {
            parsed = parseInt(strings[i], 10);

            if (parsed >= 60) {
                throw new Error("Invalid time " + str);
            }

            ms += parsed * Math.pow(60, (l - i - 1));
        }

        return ms * 1000;
    }

    function createObject(object) {
        var newObject;

        if (Object.create) {
            newObject = Object.create(object);
        } else {
            var F = function () {};
            F.prototype = object;
            newObject = new F();
        }

        newObject.Date.clock = newObject;
        return newObject;
    }

    sinon.clock = {
        now: 0,

        create: function create(now) {
            var clock = createObject(this);

            if (typeof now == "number") {
                clock.now = now;
            }

            if (!!now && typeof now == "object") {
                throw new TypeError("now should be milliseconds since UNIX epoch");
            }

            return clock;
        },

        setTimeout: function setTimeout(callback, timeout) {
            return addTimer.call(this, arguments, false);
        },

        clearTimeout: function clearTimeout(timerId) {
            if (!this.timeouts) {
                this.timeouts = [];
            }

            if (timerId in this.timeouts) {
                delete this.timeouts[timerId];
            }
        },

        setInterval: function setInterval(callback, timeout) {
            return addTimer.call(this, arguments, true);
        },

        clearInterval: function clearInterval(timerId) {
            this.clearTimeout(timerId);
        },

        setImmediate: function setImmediate(callback) {
            var passThruArgs = Array.prototype.slice.call(arguments, 1);

            return addTimer.call(this, [callback, 0].concat(passThruArgs), false);
        },

        clearImmediate: function clearImmediate(timerId) {
            this.clearTimeout(timerId);
        },

        tick: function tick(ms) {
            ms = typeof ms == "number" ? ms : parseTime(ms);
            var tickFrom = this.now, tickTo = this.now + ms, previous = this.now;
            var timer = this.firstTimerInRange(tickFrom, tickTo);

            var firstException;
            while (timer && tickFrom <= tickTo) {
                if (this.timeouts[timer.id]) {
                    tickFrom = this.now = timer.callAt;
                    try {
                      this.callTimer(timer);
                    } catch (e) {
                      firstException = firstException || e;
                    }
                }

                timer = this.firstTimerInRange(previous, tickTo);
                previous = tickFrom;
            }

            this.now = tickTo;

            if (firstException) {
              throw firstException;
            }

            return this.now;
        },

        firstTimerInRange: function (from, to) {
            var timer, smallest = null, originalTimer;

            for (var id in this.timeouts) {
                if (this.timeouts.hasOwnProperty(id)) {
                    if (this.timeouts[id].callAt < from || this.timeouts[id].callAt > to) {
                        continue;
                    }

                    if (smallest === null || this.timeouts[id].callAt < smallest) {
                        originalTimer = this.timeouts[id];
                        smallest = this.timeouts[id].callAt;

                        timer = {
                            func: this.timeouts[id].func,
                            callAt: this.timeouts[id].callAt,
                            interval: this.timeouts[id].interval,
                            id: this.timeouts[id].id,
                            invokeArgs: this.timeouts[id].invokeArgs
                        };
                    }
                }
            }

            return timer || null;
        },

        callTimer: function (timer) {
            if (typeof timer.interval == "number") {
                this.timeouts[timer.id].callAt += timer.interval;
            } else {
                delete this.timeouts[timer.id];
            }

            try {
                if (typeof timer.func == "function") {
                    timer.func.apply(null, timer.invokeArgs);
                } else {
                    eval(timer.func);
                }
            } catch (e) {
              var exception = e;
            }

            if (!this.timeouts[timer.id]) {
                if (exception) {
                  throw exception;
                }
                return;
            }

            if (exception) {
              throw exception;
            }
        },

        reset: function reset() {
            this.timeouts = {};
        },

        Date: (function () {
            var NativeDate = Date;

            function ClockDate(year, month, date, hour, minute, second, ms) {
                // Defensive and verbose to avoid potential harm in passing
                // explicit undefined when user does not pass argument
                switch (arguments.length) {
                case 0:
                    return new NativeDate(ClockDate.clock.now);
                case 1:
                    return new NativeDate(year);
                case 2:
                    return new NativeDate(year, month);
                case 3:
                    return new NativeDate(year, month, date);
                case 4:
                    return new NativeDate(year, month, date, hour);
                case 5:
                    return new NativeDate(year, month, date, hour, minute);
                case 6:
                    return new NativeDate(year, month, date, hour, minute, second);
                default:
                    return new NativeDate(year, month, date, hour, minute, second, ms);
                }
            }

            return mirrorDateProperties(ClockDate, NativeDate);
        }())
    };

    function mirrorDateProperties(target, source) {
        if (source.now) {
            target.now = function now() {
                return target.clock.now;
            };
        } else {
            delete target.now;
        }

        if (source.toSource) {
            target.toSource = function toSource() {
                return source.toSource();
            };
        } else {
            delete target.toSource;
        }

        target.toString = function toString() {
            return source.toString();
        };

        target.prototype = source.prototype;
        target.parse = source.parse;
        target.UTC = source.UTC;
        target.prototype.toUTCString = source.prototype.toUTCString;

        for (var prop in source) {
            if (source.hasOwnProperty(prop)) {
                target[prop] = source[prop];
            }
        }

        return target;
    }

    var methods = ["Date", "setTimeout", "setInterval",
                   "clearTimeout", "clearInterval"];

    if (typeof global.setImmediate !== "undefined") {
        methods.push("setImmediate");
    }

    if (typeof global.clearImmediate !== "undefined") {
        methods.push("clearImmediate");
    }

    function restore() {
        var method;

        for (var i = 0, l = this.methods.length; i < l; i++) {
            method = this.methods[i];

            if (global[method].hadOwnProperty) {
                global[method] = this["_" + method];
            } else {
                try {
                    delete global[method];
                } catch (e) {}
            }
        }

        // Prevent multiple executions which will completely remove these props
        this.methods = [];
    }

    function stubGlobal(method, clock) {
        clock[method].hadOwnProperty = Object.prototype.hasOwnProperty.call(global, method);
        clock["_" + method] = global[method];

        if (method == "Date") {
            var date = mirrorDateProperties(clock[method], global[method]);
            global[method] = date;
        } else {
            global[method] = function () {
                return clock[method].apply(clock, arguments);
            };

            for (var prop in clock[method]) {
                if (clock[method].hasOwnProperty(prop)) {
                    global[method][prop] = clock[method][prop];
                }
            }
        }

        global[method].clock = clock;
    }

    sinon.useFakeTimers = function useFakeTimers(now) {
        var clock = sinon.clock.create(now);
        clock.restore = restore;
        clock.methods = Array.prototype.slice.call(arguments,
                                                   typeof now == "number" ? 1 : 0);

        if (clock.methods.length === 0) {
            clock.methods = methods;
        }

        for (var i = 0, l = clock.methods.length; i < l; i++) {
            stubGlobal(clock.methods[i], clock);
        }

        return clock;
    };
}(typeof global != "undefined" && typeof global !== "function" ? global : this));

sinon.timers = {
    setTimeout: setTimeout,
    clearTimeout: clearTimeout,
    setImmediate: (typeof setImmediate !== "undefined" ? setImmediate : undefined),
    clearImmediate: (typeof clearImmediate !== "undefined" ? clearImmediate: undefined),
    setInterval: setInterval,
    clearInterval: clearInterval,
    Date: Date
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = sinon;
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],22:[function(require,module,exports){
(function (global){
((typeof define === "function" && define.amd && function (m) {
    define("formatio", ["samsam"], m);
}) || (typeof module === "object" && function (m) {
    module.exports = m(require("samsam"));
}) || function (m) { this.formatio = m(this.samsam); }
)(function (samsam) {
    "use strict";

    var formatio = {
        excludeConstructors: ["Object", /^.$/],
        quoteStrings: true
    };

    var hasOwn = Object.prototype.hasOwnProperty;

    var specialObjects = [];
    if (typeof global !== "undefined") {
        specialObjects.push({ object: global, value: "[object global]" });
    }
    if (typeof document !== "undefined") {
        specialObjects.push({
            object: document,
            value: "[object HTMLDocument]"
        });
    }
    if (typeof window !== "undefined") {
        specialObjects.push({ object: window, value: "[object Window]" });
    }

    function functionName(func) {
        if (!func) { return ""; }
        if (func.displayName) { return func.displayName; }
        if (func.name) { return func.name; }
        var matches = func.toString().match(/function\s+([^\(]+)/m);
        return (matches && matches[1]) || "";
    }

    function constructorName(f, object) {
        var name = functionName(object && object.constructor);
        var excludes = f.excludeConstructors ||
                formatio.excludeConstructors || [];

        var i, l;
        for (i = 0, l = excludes.length; i < l; ++i) {
            if (typeof excludes[i] === "string" && excludes[i] === name) {
                return "";
            } else if (excludes[i].test && excludes[i].test(name)) {
                return "";
            }
        }

        return name;
    }

    function isCircular(object, objects) {
        if (typeof object !== "object") { return false; }
        var i, l;
        for (i = 0, l = objects.length; i < l; ++i) {
            if (objects[i] === object) { return true; }
        }
        return false;
    }

    function ascii(f, object, processed, indent) {
        if (typeof object === "string") {
            var qs = f.quoteStrings;
            var quote = typeof qs !== "boolean" || qs;
            return processed || quote ? '"' + object + '"' : object;
        }

        if (typeof object === "function" && !(object instanceof RegExp)) {
            return ascii.func(object);
        }

        processed = processed || [];

        if (isCircular(object, processed)) { return "[Circular]"; }

        if (Object.prototype.toString.call(object) === "[object Array]") {
            return ascii.array.call(f, object, processed);
        }

        if (!object) { return String((1/object) === -Infinity ? "-0" : object); }
        if (samsam.isElement(object)) { return ascii.element(object); }

        if (typeof object.toString === "function" &&
                object.toString !== Object.prototype.toString) {
            return object.toString();
        }

        var i, l;
        for (i = 0, l = specialObjects.length; i < l; i++) {
            if (object === specialObjects[i].object) {
                return specialObjects[i].value;
            }
        }

        return ascii.object.call(f, object, processed, indent);
    }

    ascii.func = function (func) {
        return "function " + functionName(func) + "() {}";
    };

    ascii.array = function (array, processed) {
        processed = processed || [];
        processed.push(array);
        var i, l, pieces = [];
        for (i = 0, l = array.length; i < l; ++i) {
            pieces.push(ascii(this, array[i], processed));
        }
        return "[" + pieces.join(", ") + "]";
    };

    ascii.object = function (object, processed, indent) {
        processed = processed || [];
        processed.push(object);
        indent = indent || 0;
        var pieces = [], properties = samsam.keys(object).sort();
        var length = 3;
        var prop, str, obj, i, l;

        for (i = 0, l = properties.length; i < l; ++i) {
            prop = properties[i];
            obj = object[prop];

            if (isCircular(obj, processed)) {
                str = "[Circular]";
            } else {
                str = ascii(this, obj, processed, indent + 2);
            }

            str = (/\s/.test(prop) ? '"' + prop + '"' : prop) + ": " + str;
            length += str.length;
            pieces.push(str);
        }

        var cons = constructorName(this, object);
        var prefix = cons ? "[" + cons + "] " : "";
        var is = "";
        for (i = 0, l = indent; i < l; ++i) { is += " "; }

        if (length + indent > 80) {
            return prefix + "{\n  " + is + pieces.join(",\n  " + is) + "\n" +
                is + "}";
        }
        return prefix + "{ " + pieces.join(", ") + " }";
    };

    ascii.element = function (element) {
        var tagName = element.tagName.toLowerCase();
        var attrs = element.attributes, attr, pairs = [], attrName, i, l, val;

        for (i = 0, l = attrs.length; i < l; ++i) {
            attr = attrs.item(i);
            attrName = attr.nodeName.toLowerCase().replace("html:", "");
            val = attr.nodeValue;
            if (attrName !== "contenteditable" || val !== "inherit") {
                if (!!val) { pairs.push(attrName + "=\"" + val + "\""); }
            }
        }

        var formatted = "<" + tagName + (pairs.length > 0 ? " " : "");
        var content = element.innerHTML;

        if (content.length > 20) {
            content = content.substr(0, 20) + "[...]";
        }

        var res = formatted + pairs.join(" ") + ">" + content +
                "</" + tagName + ">";

        return res.replace(/ contentEditable="inherit"/, "");
    };

    function Formatio(options) {
        for (var opt in options) {
            this[opt] = options[opt];
        }
    }

    Formatio.prototype = {
        functionName: functionName,

        configure: function (options) {
            return new Formatio(options);
        },

        constructorName: function (object) {
            return constructorName(this, object);
        },

        ascii: function (object, processed, indent) {
            return ascii(this, object, processed, indent);
        }
    };

    return Formatio.prototype;
});

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"samsam":23}],23:[function(require,module,exports){
((typeof define === "function" && define.amd && function (m) { define("samsam", m); }) ||
 (typeof module === "object" &&
      function (m) { module.exports = m(); }) || // Node
 function (m) { this.samsam = m(); } // Browser globals
)(function () {
    var o = Object.prototype;
    var div = typeof document !== "undefined" && document.createElement("div");

    function isNaN(value) {
        // Unlike global isNaN, this avoids type coercion
        // typeof check avoids IE host object issues, hat tip to
        // lodash
        var val = value; // JsLint thinks value !== value is "weird"
        return typeof value === "number" && value !== val;
    }

    function getClass(value) {
        // Returns the internal [[Class]] by calling Object.prototype.toString
        // with the provided value as this. Return value is a string, naming the
        // internal class, e.g. "Array"
        return o.toString.call(value).split(/[ \]]/)[1];
    }

    /**
     * @name samsam.isArguments
     * @param Object object
     *
     * Returns ``true`` if ``object`` is an ``arguments`` object,
     * ``false`` otherwise.
     */
    function isArguments(object) {
        if (getClass(object) === 'Arguments') { return true; }
        if (typeof object !== "object" || typeof object.length !== "number" ||
                getClass(object) === "Array") {
            return false;
        }
        if (typeof object.callee == "function") { return true; }
        try {
            object[object.length] = 6;
            delete object[object.length];
        } catch (e) {
            return true;
        }
        return false;
    }

    /**
     * @name samsam.isElement
     * @param Object object
     *
     * Returns ``true`` if ``object`` is a DOM element node. Unlike
     * Underscore.js/lodash, this function will return ``false`` if ``object``
     * is an *element-like* object, i.e. a regular object with a ``nodeType``
     * property that holds the value ``1``.
     */
    function isElement(object) {
        if (!object || object.nodeType !== 1 || !div) { return false; }
        try {
            object.appendChild(div);
            object.removeChild(div);
        } catch (e) {
            return false;
        }
        return true;
    }

    /**
     * @name samsam.keys
     * @param Object object
     *
     * Return an array of own property names.
     */
    function keys(object) {
        var ks = [], prop;
        for (prop in object) {
            if (o.hasOwnProperty.call(object, prop)) { ks.push(prop); }
        }
        return ks;
    }

    /**
     * @name samsam.isDate
     * @param Object value
     *
     * Returns true if the object is a ``Date``, or *date-like*. Duck typing
     * of date objects work by checking that the object has a ``getTime``
     * function whose return value equals the return value from the object's
     * ``valueOf``.
     */
    function isDate(value) {
        return typeof value.getTime == "function" &&
            value.getTime() == value.valueOf();
    }

    /**
     * @name samsam.isNegZero
     * @param Object value
     *
     * Returns ``true`` if ``value`` is ``-0``.
     */
    function isNegZero(value) {
        return value === 0 && 1 / value === -Infinity;
    }

    /**
     * @name samsam.equal
     * @param Object obj1
     * @param Object obj2
     *
     * Returns ``true`` if two objects are strictly equal. Compared to
     * ``===`` there are two exceptions:
     *
     *   - NaN is considered equal to NaN
     *   - -0 and +0 are not considered equal
     */
    function identical(obj1, obj2) {
        if (obj1 === obj2 || (isNaN(obj1) && isNaN(obj2))) {
            return obj1 !== 0 || isNegZero(obj1) === isNegZero(obj2);
        }
    }


    /**
     * @name samsam.deepEqual
     * @param Object obj1
     * @param Object obj2
     *
     * Deep equal comparison. Two values are "deep equal" if:
     *
     *   - They are equal, according to samsam.identical
     *   - They are both date objects representing the same time
     *   - They are both arrays containing elements that are all deepEqual
     *   - They are objects with the same set of properties, and each property
     *     in ``obj1`` is deepEqual to the corresponding property in ``obj2``
     *
     * Supports cyclic objects.
     */
    function deepEqualCyclic(obj1, obj2) {

        // used for cyclic comparison
        // contain already visited objects
        var objects1 = [],
            objects2 = [],
        // contain pathes (position in the object structure)
        // of the already visited objects
        // indexes same as in objects arrays
            paths1 = [],
            paths2 = [],
        // contains combinations of already compared objects
        // in the manner: { "$1['ref']$2['ref']": true }
            compared = {};

        /**
         * used to check, if the value of a property is an object
         * (cyclic logic is only needed for objects)
         * only needed for cyclic logic
         */
        function isObject(value) {

            if (typeof value === 'object' && value !== null &&
                    !(value instanceof Boolean) &&
                    !(value instanceof Date)    &&
                    !(value instanceof Number)  &&
                    !(value instanceof RegExp)  &&
                    !(value instanceof String)) {

                return true;
            }

            return false;
        }

        /**
         * returns the index of the given object in the
         * given objects array, -1 if not contained
         * only needed for cyclic logic
         */
        function getIndex(objects, obj) {

            var i;
            for (i = 0; i < objects.length; i++) {
                if (objects[i] === obj) {
                    return i;
                }
            }

            return -1;
        }

        // does the recursion for the deep equal check
        return (function deepEqual(obj1, obj2, path1, path2) {
            var type1 = typeof obj1;
            var type2 = typeof obj2;

            // == null also matches undefined
            if (obj1 === obj2 ||
                    isNaN(obj1) || isNaN(obj2) ||
                    obj1 == null || obj2 == null ||
                    type1 !== "object" || type2 !== "object") {

                return identical(obj1, obj2);
            }

            // Elements are only equal if identical(expected, actual)
            if (isElement(obj1) || isElement(obj2)) { return false; }

            var isDate1 = isDate(obj1), isDate2 = isDate(obj2);
            if (isDate1 || isDate2) {
                if (!isDate1 || !isDate2 || obj1.getTime() !== obj2.getTime()) {
                    return false;
                }
            }

            if (obj1 instanceof RegExp && obj2 instanceof RegExp) {
                if (obj1.toString() !== obj2.toString()) { return false; }
            }

            var class1 = getClass(obj1);
            var class2 = getClass(obj2);
            var keys1 = keys(obj1);
            var keys2 = keys(obj2);

            if (isArguments(obj1) || isArguments(obj2)) {
                if (obj1.length !== obj2.length) { return false; }
            } else {
                if (type1 !== type2 || class1 !== class2 ||
                        keys1.length !== keys2.length) {
                    return false;
                }
            }

            var key, i, l,
                // following vars are used for the cyclic logic
                value1, value2,
                isObject1, isObject2,
                index1, index2,
                newPath1, newPath2;

            for (i = 0, l = keys1.length; i < l; i++) {
                key = keys1[i];
                if (!o.hasOwnProperty.call(obj2, key)) {
                    return false;
                }

                // Start of the cyclic logic

                value1 = obj1[key];
                value2 = obj2[key];

                isObject1 = isObject(value1);
                isObject2 = isObject(value2);

                // determine, if the objects were already visited
                // (it's faster to check for isObject first, than to
                // get -1 from getIndex for non objects)
                index1 = isObject1 ? getIndex(objects1, value1) : -1;
                index2 = isObject2 ? getIndex(objects2, value2) : -1;

                // determine the new pathes of the objects
                // - for non cyclic objects the current path will be extended
                //   by current property name
                // - for cyclic objects the stored path is taken
                newPath1 = index1 !== -1
                    ? paths1[index1]
                    : path1 + '[' + JSON.stringify(key) + ']';
                newPath2 = index2 !== -1
                    ? paths2[index2]
                    : path2 + '[' + JSON.stringify(key) + ']';

                // stop recursion if current objects are already compared
                if (compared[newPath1 + newPath2]) {
                    return true;
                }

                // remember the current objects and their pathes
                if (index1 === -1 && isObject1) {
                    objects1.push(value1);
                    paths1.push(newPath1);
                }
                if (index2 === -1 && isObject2) {
                    objects2.push(value2);
                    paths2.push(newPath2);
                }

                // remember that the current objects are already compared
                if (isObject1 && isObject2) {
                    compared[newPath1 + newPath2] = true;
                }

                // End of cyclic logic

                // neither value1 nor value2 is a cycle
                // continue with next level
                if (!deepEqual(value1, value2, newPath1, newPath2)) {
                    return false;
                }
            }

            return true;

        }(obj1, obj2, '$1', '$2'));
    }

    var match;

    function arrayContains(array, subset) {
        if (subset.length === 0) { return true; }
        var i, l, j, k;
        for (i = 0, l = array.length; i < l; ++i) {
            if (match(array[i], subset[0])) {
                for (j = 0, k = subset.length; j < k; ++j) {
                    if (!match(array[i + j], subset[j])) { return false; }
                }
                return true;
            }
        }
        return false;
    }

    /**
     * @name samsam.match
     * @param Object object
     * @param Object matcher
     *
     * Compare arbitrary value ``object`` with matcher.
     */
    match = function match(object, matcher) {
        if (matcher && typeof matcher.test === "function") {
            return matcher.test(object);
        }

        if (typeof matcher === "function") {
            return matcher(object) === true;
        }

        if (typeof matcher === "string") {
            matcher = matcher.toLowerCase();
            var notNull = typeof object === "string" || !!object;
            return notNull &&
                (String(object)).toLowerCase().indexOf(matcher) >= 0;
        }

        if (typeof matcher === "number") {
            return matcher === object;
        }

        if (typeof matcher === "boolean") {
            return matcher === object;
        }

        if (getClass(object) === "Array" && getClass(matcher) === "Array") {
            return arrayContains(object, matcher);
        }

        if (matcher && typeof matcher === "object") {
            var prop;
            for (prop in matcher) {
                var value = object[prop];
                if (typeof value === "undefined" &&
                        typeof object.getAttribute === "function") {
                    value = object.getAttribute(prop);
                }
                if (typeof value === "undefined" || !match(value, matcher[prop])) {
                    return false;
                }
            }
            return true;
        }

        throw new Error("Matcher was not a string, a number, a " +
                        "function, a boolean or an object");
    };

    return {
        isArguments: isArguments,
        isElement: isElement,
        isDate: isDate,
        isNegZero: isNegZero,
        identical: identical,
        deepEqual: deepEqualCyclic,
        match: match,
        keys: keys
    };
});

},{}],24:[function(require,module,exports){
'use strict';

var _interopRequireWildcard = function (obj) { return obj && obj.__esModule ? obj : { 'default': obj }; };

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } };

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if (descriptor.value) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(object, property, receiver) { var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _inherits = function (subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; };

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _Button2 = require('./button');

var _Button3 = _interopRequireWildcard(_Button2);

/* Big Play Button
================================================================================ */
/**
 * Initial play button. Shows before the video has played. The hiding of the
 * big play button is done via CSS and player states.
 * @param {Player|Object} player
 * @param {Object=} options
 * @class
 * @constructor
 */

var BigPlayButton = (function (_Button) {
  function BigPlayButton() {
    _classCallCheck(this, BigPlayButton);

    if (_Button != null) {
      _Button.apply(this, arguments);
    }
  }

  _inherits(BigPlayButton, _Button);

  _createClass(BigPlayButton, [{
    key: 'createEl',
    value: function createEl() {
      return _get(Object.getPrototypeOf(BigPlayButton.prototype), 'createEl', this).call(this, 'div', {
        className: 'vjs-big-play-button',
        innerHTML: '<span aria-hidden="true"></span>',
        'aria-label': 'play video'
      });
    }
  }, {
    key: 'handleClick',
    value: function handleClick() {
      this.player_.play();
    }
  }]);

  return BigPlayButton;
})(_Button3['default']);

_Button3['default'].registerComponent('BigPlayButton', BigPlayButton);
exports['default'] = BigPlayButton;
module.exports = exports['default'];

},{"./button":25}],25:[function(require,module,exports){
'use strict';

var _interopRequireWildcard = function (obj) { return obj && obj.__esModule ? obj : { 'default': obj }; };

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } };

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if (descriptor.value) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(object, property, receiver) { var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _inherits = function (subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; };

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _Component2 = require('./component');

var _Component3 = _interopRequireWildcard(_Component2);

var _import = require('./lib');

var Lib = _interopRequireWildcard(_import);

var _import2 = require('./events');

var Events = _interopRequireWildcard(_import2);

var _document = require('global/document');

var _document2 = _interopRequireWildcard(_document);

/* Button - Base class for all buttons
================================================================================ */
/**
 * Base class for all buttons
 * @param {Player|Object} player
 * @param {Object=} options
 * @class
 * @constructor
 */

var Button = (function (_Component) {
  function Button(player, options) {
    _classCallCheck(this, Button);

    _get(Object.getPrototypeOf(Button.prototype), 'constructor', this).call(this, player, options);

    this.emitTapEvents();

    this.on('tap', this.handleClick);
    this.on('click', this.handleClick);
    this.on('focus', this.handleFocus);
    this.on('blur', this.handleBlur);
  }

  _inherits(Button, _Component);

  _createClass(Button, [{
    key: 'createEl',
    value: function createEl(type, props) {
      // Add standard Aria and Tabindex info
      props = Lib.obj.merge({
        className: this.buildCSSClass(),
        role: 'button',
        'aria-live': 'polite', // let the screen reader user know that the text of the button may change
        tabIndex: 0
      }, props);

      var el = _get(Object.getPrototypeOf(Button.prototype), 'createEl', this).call(this, type, props);

      // if innerHTML hasn't been overridden (bigPlayButton), add content elements
      if (!props.innerHTML) {
        this.contentEl_ = Lib.createEl('div', {
          className: 'vjs-control-content'
        });

        this.controlText_ = Lib.createEl('span', {
          className: 'vjs-control-text',
          innerHTML: this.localize(this.buttonText) || 'Need Text'
        });

        this.contentEl_.appendChild(this.controlText_);
        el.appendChild(this.contentEl_);
      }

      return el;
    }
  }, {
    key: 'buildCSSClass',
    value: function buildCSSClass() {
      return 'vjs-control vjs-button ' + _get(Object.getPrototypeOf(Button.prototype), 'buildCSSClass', this).call(this);
    }
  }, {
    key: 'handleClick',

    // Click - Override with specific functionality for button
    value: function handleClick() {}
  }, {
    key: 'handleFocus',

    // Focus - Add keyboard functionality to element
    value: function handleFocus() {
      Events.on(_document2['default'], 'keydown', Lib.bind(this, this.handleKeyPress));
    }
  }, {
    key: 'handleKeyPress',

    // KeyPress (document level) - Trigger click when keys are pressed
    value: function handleKeyPress(event) {
      // Check for space bar (32) or enter (13) keys
      if (event.which == 32 || event.which == 13) {
        event.preventDefault();
        this.handleClick();
      }
    }
  }, {
    key: 'handleBlur',

    // Blur - Remove keyboard triggers
    value: function handleBlur() {
      Events.off(_document2['default'], 'keydown', Lib.bind(this, this.handleKeyPress));
    }
  }]);

  return Button;
})(_Component3['default']);

_Component3['default'].registerComponent('Button', Button);
exports['default'] = Button;
module.exports = exports['default'];

},{"./component":26,"./events":62,"./lib":64,"global/document":1}],26:[function(require,module,exports){
'use strict';

var _interopRequireWildcard = function (obj) { return obj && obj.__esModule ? obj : { 'default': obj }; };

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } };

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if (descriptor.value) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

Object.defineProperty(exports, '__esModule', {
  value: true
});
/**
 * @fileoverview Player Component - Base class for all UI objects
 *
 */

var _import = require('./lib.js');

var Lib = _interopRequireWildcard(_import);

var _import2 = require('./util.js');

var VjsUtil = _interopRequireWildcard(_import2);

var _import3 = require('./events.js');

var Events = _interopRequireWildcard(_import3);

var _window = require('global/window');

var _window2 = _interopRequireWildcard(_window);

/**
 * Base UI Component class
 *
 * Components are embeddable UI objects that are represented by both a
 * javascript object and an element in the DOM. They can be children of other
 * components, and can have many children themselves.
 *
 *     // adding a button to the player
 *     var button = player.addChild('button');
 *     button.el(); // -> button element
 *
 *     <div class="video-js">
 *       <div class="vjs-button">Button</div>
 *     </div>
 *
 * Components are also event emitters.
 *
 *     button.on('click', function(){
 *       console.log('Button Clicked!');
 *     });
 *
 *     button.trigger('customevent');
 *
 * @param {Object} player  Main Player
 * @param {Object=} options
 * @class
 * @constructor
 */

var Component = (function () {
  function Component(player, options, ready) {
    _classCallCheck(this, Component);

    // The component might be the player itself and we can't pass `this` to super
    if (!player && this.play) {
      this.player_ = player = this;
    } else {
      this.player_ = player;
    }

    // Make a copy of prototype.options_ to protect against overriding global defaults
    this.options_ = Lib.obj.copy(this.options_);

    // Updated options with supplied options
    options = this.options(options);

    // Get ID from options or options element if one is supplied
    this.id_ = options.id || options.el && options.el.id;

    // If there was no ID from the options, generate one
    if (!this.id_) {
      // Don't require the player ID function in the case of mock players
      var id = player.id && player.id() || 'no_player';
      this.id_ = '' + id + '_component_' + Lib.guid++;
    }

    this.name_ = options.name || null;

    // Create element if one wasn't provided in options
    if (options.el) {
      this.el_ = options.el;
    } else if (options.createEl !== false) {
      this.el_ = this.createEl();
    }

    this.children_ = [];
    this.childIndex_ = {};
    this.childNameIndex_ = {};

    // Add any child components in options
    if (options.initChildren !== false) {
      this.initChildren();
    }

    this.ready(ready);
    // Don't want to trigger ready here or it will before init is actually
    // finished for all children that run this constructor

    if (options.reportTouchActivity !== false) {
      this.enableTouchActivity();
    }
  }

  _createClass(Component, [{
    key: 'init',

    // Temp for ES6 class transition, remove before 5.0
    value: function init() {
      // console.log('init called on Component');
      Component.apply(this, arguments);
    }
  }, {
    key: 'dispose',

    /**
     * Dispose of the component and all child components
     */
    value: function dispose() {
      this.trigger({ type: 'dispose', bubbles: false });

      // Dispose all children.
      if (this.children_) {
        for (var i = this.children_.length - 1; i >= 0; i--) {
          if (this.children_[i].dispose) {
            this.children_[i].dispose();
          }
        }
      }

      // Delete child references
      this.children_ = null;
      this.childIndex_ = null;
      this.childNameIndex_ = null;

      // Remove all event listeners.
      this.off();

      // Remove element from DOM
      if (this.el_.parentNode) {
        this.el_.parentNode.removeChild(this.el_);
      }

      Lib.removeData(this.el_);
      this.el_ = null;
    }
  }, {
    key: 'player',

    /**
     * Return the component's player
     *
     * @return {Player}
     */
    value: function player() {
      return this.player_;
    }
  }, {
    key: 'options',

    /**
     * Deep merge of options objects
     *
     * Whenever a property is an object on both options objects
     * the two properties will be merged using Lib.obj.deepMerge.
     *
     * This is used for merging options for child components. We
     * want it to be easy to override individual options on a child
     * component without having to rewrite all the other default options.
     *
     *     Parent.prototype.options_ = {
     *       children: {
     *         'childOne': { 'foo': 'bar', 'asdf': 'fdsa' },
     *         'childTwo': {},
     *         'childThree': {}
     *       }
     *     }
     *     newOptions = {
     *       children: {
     *         'childOne': { 'foo': 'baz', 'abc': '123' }
     *         'childTwo': null,
     *         'childFour': {}
     *       }
     *     }
     *
     *     this.options(newOptions);
     *
     * RESULT
     *
     *     {
     *       children: {
     *         'childOne': { 'foo': 'baz', 'asdf': 'fdsa', 'abc': '123' },
     *         'childTwo': null, // Disabled. Won't be initialized.
     *         'childThree': {},
     *         'childFour': {}
     *       }
     *     }
     *
     * @param  {Object} obj Object of new option values
     * @return {Object}     A NEW object of this.options_ and obj merged
     */
    value: function options(obj) {
      if (obj === undefined) {
        return this.options_;
      }return this.options_ = VjsUtil.mergeOptions(this.options_, obj);
    }
  }, {
    key: 'el',

    /**
     * Get the component's DOM element
     *
     *     var domEl = myComponent.el();
     *
     * @return {Element}
     */
    value: function el() {
      return this.el_;
    }
  }, {
    key: 'createEl',

    /**
     * Create the component's DOM element
     *
     * @param  {String=} tagName  Element's node type. e.g. 'div'
     * @param  {Object=} attributes An object of element attributes that should be set on the element
     * @return {Element}
     */
    value: function createEl(tagName, attributes) {
      return Lib.createEl(tagName, attributes);
    }
  }, {
    key: 'localize',
    value: function localize(string) {
      var lang = this.player_.language();
      var languages = this.player_.languages();

      if (languages && languages[lang] && languages[lang][string]) {
        return languages[lang][string];
      }

      return string;
    }
  }, {
    key: 'contentEl',

    /**
     * Return the component's DOM element where children are inserted.
     * Will either be the same as el() or a new element defined in createEl().
     *
     * @return {Element}
     */
    value: function contentEl() {
      return this.contentEl_ || this.el_;
    }
  }, {
    key: 'id',

    /**
     * Get the component's ID
     *
     *     var id = myComponent.id();
     *
     * @return {String}
     */
    value: function id() {
      return this.id_;
    }
  }, {
    key: 'name',

    /**
     * Get the component's name. The name is often used to reference the component.
     *
     *     var name = myComponent.name();
     *
     * @return {String}
     */
    value: function name() {
      return this.name_;
    }
  }, {
    key: 'children',

    /**
     * Get an array of all child components
     *
     *     var kids = myComponent.children();
     *
     * @return {Array} The children
     */
    value: function children() {
      return this.children_;
    }
  }, {
    key: 'getChildById',

    /**
     * Returns a child component with the provided ID
     *
     * @return {Component}
     */
    value: function getChildById(id) {
      return this.childIndex_[id];
    }
  }, {
    key: 'getChild',

    /**
     * Returns a child component with the provided name
     *
     * @return {Component}
     */
    value: function getChild(name) {
      return this.childNameIndex_[name];
    }
  }, {
    key: 'addChild',

    /**
     * Adds a child component inside this component
     *
     *     myComponent.el();
     *     // -> <div class='my-component'></div>
     *     myComponent.children();
     *     // [empty array]
     *
     *     var myButton = myComponent.addChild('MyButton');
     *     // -> <div class='my-component'><div class="my-button">myButton<div></div>
     *     // -> myButton === myComonent.children()[0];
     *
     * Pass in options for child constructors and options for children of the child
     *
     *     var myButton = myComponent.addChild('MyButton', {
     *       text: 'Press Me',
     *       children: {
     *         buttonChildExample: {
     *           buttonChildOption: true
     *         }
     *       }
     *     });
     *
     * @param {String|Component} child The class name or instance of a child to add
     * @param {Object=} options Options, including options to be passed to children of the child.
     * @return {Component} The child component (created by this process if a string was used)
     * @suppress {accessControls|checkRegExp|checkTypes|checkVars|const|constantProperty|deprecated|duplicate|es5Strict|fileoverviewTags|globalThis|invalidCasts|missingProperties|nonStandardJsDocs|strictModuleDepCheck|undefinedNames|undefinedVars|unknownDefines|uselessCode|visibility}
     */
    value: function addChild(child) {
      var options = arguments[1] === undefined ? {} : arguments[1];

      var component = undefined;
      var componentName = undefined;

      // If child is a string, create nt with options
      if (typeof child === 'string') {
        componentName = child;

        // Options can also be specified as a boolean, so convert to an empty object if false.
        if (!options) {
          options = {};
        }

        // Same as above, but true is deprecated so show a warning.
        if (options === true) {
          Lib.log.warn('Initializing a child component with `true` is deprecated. Children should be defined in an array when possible, but if necessary use an object instead of `true`.');
          options = {};
        }

        // If no componentClass in options, assume componentClass is the name lowercased
        // (e.g. playButton)
        var componentClassName = options.componentClass || Lib.capitalize(componentName);

        // Set name through options
        options.name = componentName;

        // Create a new object & element for this controls set
        // If there's no .player_, this is a player
        var componentClass = Component.getComponent(componentClassName);

        component = new componentClass(this.player_ || this, options);

        // child is a component instance
      } else {
        component = child;
      }

      this.children_.push(component);

      if (typeof component.id === 'function') {
        this.childIndex_[component.id()] = component;
      }

      // If a name wasn't used to create the component, check if we can use the
      // name function of the component
      componentName = componentName || component.name && component.name();

      if (componentName) {
        this.childNameIndex_[componentName] = component;
      }

      // Add the UI object's element to the container div (box)
      // Having an element is not required
      if (typeof component.el === 'function' && component.el()) {
        this.contentEl().appendChild(component.el());
      }

      // Return so it can stored on parent object if desired.
      return component;
    }
  }, {
    key: 'removeChild',

    /**
     * Remove a child component from this component's list of children, and the
     * child component's element from this component's element
     *
     * @param  {Component} component Component to remove
     */
    value: function removeChild(component) {
      if (typeof component === 'string') {
        component = this.getChild(component);
      }

      if (!component || !this.children_) {
        return;
      }var childFound = false;
      for (var i = this.children_.length - 1; i >= 0; i--) {
        if (this.children_[i] === component) {
          childFound = true;
          this.children_.splice(i, 1);
          break;
        }
      }

      if (!childFound) {
        return;
      }this.childIndex_[component.id()] = null;
      this.childNameIndex_[component.name()] = null;

      var compEl = component.el();
      if (compEl && compEl.parentNode === this.contentEl()) {
        this.contentEl().removeChild(component.el());
      }
    }
  }, {
    key: 'initChildren',

    /**
     * Add and initialize default child components from options
     *
     *     // when an instance of MyComponent is created, all children in options
     *     // will be added to the instance by their name strings and options
     *     MyComponent.prototype.options_.children = {
     *       myChildComponent: {
     *         myChildOption: true
     *       }
     *     }
     *
     *     // Or when creating the component
     *     var myComp = new MyComponent(player, {
     *       children: {
     *         myChildComponent: {
     *           myChildOption: true
     *         }
     *       }
     *     });
     *
     * The children option can also be an Array of child names or
     * child options objects (that also include a 'name' key).
     *
     *     var myComp = new MyComponent(player, {
     *       children: [
     *         'button',
     *         {
     *           name: 'button',
     *           someOtherOption: true
     *         }
     *       ]
     *     });
     *
     */
    value: function initChildren() {
      var _this = this;

      var children = this.options_.children;

      if (children) {
        var i;

        (function () {
          var parent = _this;
          var parentOptions = parent.options();
          var handleAdd = function handleAdd(name, opts) {
            // Allow options for children to be set at the parent options
            // e.g. videojs(id, { controlBar: false });
            // instead of videojs(id, { children: { controlBar: false });
            if (parentOptions[name] !== undefined) {
              opts = parentOptions[name];
            }

            // Allow for disabling default components
            // e.g. options['children']['posterImage'] = false
            if (opts === false) {
              return;
            } // Create and add the child component.
            // Add a direct reference to the child by name on the parent instance.
            // If two of the same component are used, different names should be supplied
            // for each
            parent[name] = parent.addChild(name, opts);
          };

          // Allow for an array of children details to passed in the options
          if (Lib.obj.isArray(children)) {
            for (i = 0; i < children.length; i++) {
              var child = children[i];

              var _name = undefined,
                  opts = undefined;
              if (typeof child == 'string') {
                // ['myComponent']
                _name = child;
                opts = {};
              } else {
                // [{ name: 'myComponent', otherOption: true }]
                _name = child.name;
                opts = child;
              }

              handleAdd(_name, opts);
            }
          } else {
            Lib.obj.each(children, handleAdd);
          }
        })();
      }
    }
  }, {
    key: 'buildCSSClass',

    /**
     * Allows sub components to stack CSS class names
     *
     * @return {String} The constructed class name
     */
    value: function buildCSSClass() {
      // Child classes can include a function that does:
      // return 'CLASS NAME' + this._super();
      return '';
    }
  }, {
    key: 'on',

    /**
     * Add an event listener to this component's element
     *
     *     var myFunc = function(){
     *       var myComponent = this;
     *       // Do something when the event is fired
     *     };
     *
     *     myComponent.on('eventType', myFunc);
     *
     * The context of myFunc will be myComponent unless previously bound.
     *
     * Alternatively, you can add a listener to another element or component.
     *
     *     myComponent.on(otherElement, 'eventName', myFunc);
     *     myComponent.on(otherComponent, 'eventName', myFunc);
     *
     * The benefit of using this over `VjsEvents.on(otherElement, 'eventName', myFunc)`
     * and `otherComponent.on('eventName', myFunc)` is that this way the listeners
     * will be automatically cleaned up when either component is disposed.
     * It will also bind myComponent as the context of myFunc.
     *
     * **NOTE**: When using this on elements in the page other than window
     * and document (both permanent), if you remove the element from the DOM
     * you need to call `myComponent.trigger(el, 'dispose')` on it to clean up
     * references to it and allow the browser to garbage collect it.
     *
     * @param  {String|Component} first   The event type or other component
     * @param  {Function|String}      second  The event handler or event type
     * @param  {Function}             third   The event handler
     * @return {Component}        self
     */
    value: function on(first, second, third) {
      var _this2 = this;

      if (typeof first === 'string' || Lib.obj.isArray(first)) {
        Events.on(this.el_, first, Lib.bind(this, second));

        // Targeting another component or element
      } else {
        (function () {
          var target = first;
          var type = second;
          var fn = Lib.bind(_this2, third);
          var thisComponent = _this2;

          // When this component is disposed, remove the listener from the other component
          var removeOnDispose = function removeOnDispose() {
            thisComponent.off(target, type, fn);
          };
          // Use the same function ID so we can remove it later it using the ID
          // of the original listener
          removeOnDispose.guid = fn.guid;
          _this2.on('dispose', removeOnDispose);

          // If the other component is disposed first we need to clean the reference
          // to the other component in this component's removeOnDispose listener
          // Otherwise we create a memory leak.
          var cleanRemover = function cleanRemover() {
            thisComponent.off('dispose', removeOnDispose);
          };
          // Add the same function ID so we can easily remove it later
          cleanRemover.guid = fn.guid;

          // Check if this is a DOM node
          if (first.nodeName) {
            // Add the listener to the other element
            Events.on(target, type, fn);
            Events.on(target, 'dispose', cleanRemover);

            // Should be a component
            // Not using `instanceof Component` because it makes mock players difficult
          } else if (typeof first.on === 'function') {
            // Add the listener to the other component
            target.on(type, fn);
            target.on('dispose', cleanRemover);
          }
        })();
      }

      return this;
    }
  }, {
    key: 'off',

    /**
     * Remove an event listener from this component's element
     *
     *     myComponent.off('eventType', myFunc);
     *
     * If myFunc is excluded, ALL listeners for the event type will be removed.
     * If eventType is excluded, ALL listeners will be removed from the component.
     *
     * Alternatively you can use `off` to remove listeners that were added to other
     * elements or components using `myComponent.on(otherComponent...`.
     * In this case both the event type and listener function are REQUIRED.
     *
     *     myComponent.off(otherElement, 'eventType', myFunc);
     *     myComponent.off(otherComponent, 'eventType', myFunc);
     *
     * @param  {String=|Component}  first  The event type or other component
     * @param  {Function=|String}       second The listener function or event type
     * @param  {Function=}              third  The listener for other component
     * @return {Component}
     */
    value: function off(first, second, third) {
      if (!first || typeof first === 'string' || Lib.obj.isArray(first)) {
        Events.off(this.el_, first, second);
      } else {
        var target = first;
        var type = second;
        // Ensure there's at least a guid, even if the function hasn't been used
        var fn = Lib.bind(this, third);

        // Remove the dispose listener on this component,
        // which was given the same guid as the event listener
        this.off('dispose', fn);

        if (first.nodeName) {
          // Remove the listener
          Events.off(target, type, fn);
          // Remove the listener for cleaning the dispose listener
          Events.off(target, 'dispose', fn);
        } else {
          target.off(type, fn);
          target.off('dispose', fn);
        }
      }

      return this;
    }
  }, {
    key: 'one',

    /**
     * Add an event listener to be triggered only once and then removed
     *
     *     myComponent.one('eventName', myFunc);
     *
     * Alternatively you can add a listener to another element or component
     * that will be triggered only once.
     *
     *     myComponent.one(otherElement, 'eventName', myFunc);
     *     myComponent.one(otherComponent, 'eventName', myFunc);
     *
     * @param  {String|Component}  first   The event type or other component
     * @param  {Function|String}       second  The listener function or event type
     * @param  {Function=}             third   The listener function for other component
     * @return {Component}
     */
    value: function one(first, second, third) {
      var _this3 = this;

      if (typeof first === 'string' || Lib.obj.isArray(first)) {
        Events.one(this.el_, first, Lib.bind(this, second));
      } else {
        (function () {
          var target = first;
          var type = second;
          var fn = Lib.bind(_this3, third);
          var thisComponent = _this3;

          var newFunc = (function (_newFunc) {
            function newFunc() {
              return _newFunc.apply(this, arguments);
            }

            newFunc.toString = function () {
              return newFunc.toString();
            };

            return newFunc;
          })(function () {
            thisComponent.off(target, type, newFunc);
            fn.apply(this, arguments);
          });
          // Keep the same function ID so we can remove it later
          newFunc.guid = fn.guid;

          _this3.on(target, type, newFunc);
        })();
      }

      return this;
    }
  }, {
    key: 'trigger',

    /**
     * Trigger an event on an element
     *
     *     myComponent.trigger('eventName');
     *     myComponent.trigger({'type':'eventName'});
     *
     * @param  {Event|Object|String} event  A string (the type) or an event object with a type attribute
     * @return {Component}       self
     */
    value: function trigger(event) {
      Events.trigger(this.el_, event);
      return this;
    }
  }, {
    key: 'ready',

    /**
     * Bind a listener to the component's ready state
     *
     * Different from event listeners in that if the ready event has already happened
     * it will trigger the function immediately.
     *
     * @param  {Function} fn Ready listener
     * @return {Component}
     */
    value: function ready(fn) {
      if (fn) {
        if (this.isReady_) {
          fn.call(this);
        } else {
          this.readyQueue_ = this.readyQueue_ || [];
          this.readyQueue_.push(fn);
        }
      }
      return this;
    }
  }, {
    key: 'triggerReady',

    /**
     * Trigger the ready listeners
     *
     * @return {Component}
     */
    value: function triggerReady() {
      this.isReady_ = true;

      var readyQueue = this.readyQueue_;

      if (readyQueue && readyQueue.length > 0) {

        for (var i = 0, j = readyQueue.length; i < j; i++) {
          readyQueue[i].call(this);
        }

        // Reset Ready Queue
        this.readyQueue_ = [];

        // Allow for using event listeners also, in case you want to do something everytime a source is ready.
        this.trigger('ready');
      }
    }
  }, {
    key: 'hasClass',

    /**
     * Check if a component's element has a CSS class name
     *
     * @param {String} classToCheck Classname to check
     * @return {Component}
     */
    value: function hasClass(classToCheck) {
      return Lib.hasClass(this.el_, classToCheck);
    }
  }, {
    key: 'addClass',

    /**
     * Add a CSS class name to the component's element
     *
     * @param {String} classToAdd Classname to add
     * @return {Component}
     */
    value: function addClass(classToAdd) {
      Lib.addClass(this.el_, classToAdd);
      return this;
    }
  }, {
    key: 'removeClass',

    /**
     * Remove a CSS class name from the component's element
     *
     * @param {String} classToRemove Classname to remove
     * @return {Component}
     */
    value: function removeClass(classToRemove) {
      Lib.removeClass(this.el_, classToRemove);
      return this;
    }
  }, {
    key: 'show',

    /**
     * Show the component element if hidden
     *
     * @return {Component}
     */
    value: function show() {
      this.removeClass('vjs-hidden');
      return this;
    }
  }, {
    key: 'hide',

    /**
     * Hide the component element if currently showing
     *
     * @return {Component}
     */
    value: function hide() {
      this.addClass('vjs-hidden');
      return this;
    }
  }, {
    key: 'lockShowing',

    /**
     * Lock an item in its visible state
     * To be used with fadeIn/fadeOut.
     *
     * @return {Component}
     * @private
     */
    value: function lockShowing() {
      this.addClass('vjs-lock-showing');
      return this;
    }
  }, {
    key: 'unlockShowing',

    /**
     * Unlock an item to be hidden
     * To be used with fadeIn/fadeOut.
     *
     * @return {Component}
     * @private
     */
    value: function unlockShowing() {
      this.removeClass('vjs-lock-showing');
      return this;
    }
  }, {
    key: 'width',

    /**
     * Set or get the width of the component (CSS values)
     *
     * Setting the video tag dimension values only works with values in pixels.
     * Percent values will not work.
     * Some percents can be used, but width()/height() will return the number + %,
     * not the actual computed width/height.
     *
     * @param  {Number|String=} num   Optional width number
     * @param  {Boolean} skipListeners Skip the 'resize' event trigger
     * @return {Component} This component, when setting the width
     * @return {Number|String} The width, when getting
     */
    value: function width(num, skipListeners) {
      return this.dimension('width', num, skipListeners);
    }
  }, {
    key: 'height',

    /**
     * Get or set the height of the component (CSS values)
     *
     * Setting the video tag dimension values only works with values in pixels.
     * Percent values will not work.
     * Some percents can be used, but width()/height() will return the number + %,
     * not the actual computed width/height.
     *
     * @param  {Number|String=} num     New component height
     * @param  {Boolean=} skipListeners Skip the resize event trigger
     * @return {Component} This component, when setting the height
     * @return {Number|String} The height, when getting
     */
    value: function height(num, skipListeners) {
      return this.dimension('height', num, skipListeners);
    }
  }, {
    key: 'dimensions',

    /**
     * Set both width and height at the same time
     *
     * @param  {Number|String} width
     * @param  {Number|String} height
     * @return {Component} The component
     */
    value: function dimensions(width, height) {
      // Skip resize listeners on width for optimization
      return this.width(width, true).height(height);
    }
  }, {
    key: 'dimension',

    /**
     * Get or set width or height
     *
     * This is the shared code for the width() and height() methods.
     * All for an integer, integer + 'px' or integer + '%';
     *
     * Known issue: Hidden elements officially have a width of 0. We're defaulting
     * to the style.width value and falling back to computedStyle which has the
     * hidden element issue. Info, but probably not an efficient fix:
     * http://www.foliotek.com/devblog/getting-the-width-of-a-hidden-element-with-jquery-using-width/
     *
     * @param  {String} widthOrHeight  'width' or 'height'
     * @param  {Number|String=} num     New dimension
     * @param  {Boolean=} skipListeners Skip resize event trigger
     * @return {Component} The component if a dimension was set
     * @return {Number|String} The dimension if nothing was set
     * @private
     */
    value: function dimension(widthOrHeight, num, skipListeners) {
      if (num !== undefined) {
        // Set to zero if null or literally NaN (NaN !== NaN)
        if (num === null || num !== num) {
          num = 0;
        }

        // Check if using css width/height (% or px) and adjust
        if (('' + num).indexOf('%') !== -1 || ('' + num).indexOf('px') !== -1) {
          this.el_.style[widthOrHeight] = num;
        } else if (num === 'auto') {
          this.el_.style[widthOrHeight] = '';
        } else {
          this.el_.style[widthOrHeight] = num + 'px';
        }

        // skipListeners allows us to avoid triggering the resize event when setting both width and height
        if (!skipListeners) {
          this.trigger('resize');
        }

        // Return component
        return this;
      }

      // Not setting a value, so getting it
      // Make sure element exists
      if (!this.el_) {
        return 0;
      } // Get dimension value from style
      var val = this.el_.style[widthOrHeight];
      var pxIndex = val.indexOf('px');
      if (pxIndex !== -1) {
        // Return the pixel value with no 'px'
        return parseInt(val.slice(0, pxIndex), 10);

        // No px so using % or no style was set, so falling back to offsetWidth/height
        // If component has display:none, offset will return 0
        // TODO: handle display:none and no dimension style using px
      } else {

        return parseInt(this.el_['offset' + Lib.capitalize(widthOrHeight)], 10);

        // ComputedStyle version.
        // Only difference is if the element is hidden it will return
        // the percent value (e.g. '100%'')
        // instead of zero like offsetWidth returns.
        // var val = Lib.getComputedStyleValue(this.el_, widthOrHeight);
        // var pxIndex = val.indexOf('px');

        // if (pxIndex !== -1) {
        //   return val.slice(0, pxIndex);
        // } else {
        //   return val;
        // }
      }
    }
  }, {
    key: 'emitTapEvents',

    /**
     * Emit 'tap' events when touch events are supported
     *
     * This is used to support toggling the controls through a tap on the video.
     *
     * We're requiring them to be enabled because otherwise every component would
     * have this extra overhead unnecessarily, on mobile devices where extra
     * overhead is especially bad.
     * @private
     */
    value: function emitTapEvents() {
      // Track the start time so we can determine how long the touch lasted
      var touchStart = 0;
      var firstTouch = null;

      // Maximum movement allowed during a touch event to still be considered a tap
      // Other popular libs use anywhere from 2 (hammer.js) to 15, so 10 seems like a nice, round number.
      var tapMovementThreshold = 10;

      // The maximum length a touch can be while still being considered a tap
      var touchTimeThreshold = 200;

      var couldBeTap = undefined;
      this.on('touchstart', function (event) {
        // If more than one finger, don't consider treating this as a click
        if (event.touches.length === 1) {
          firstTouch = Lib.obj.copy(event.touches[0]);
          // Record start time so we can detect a tap vs. "touch and hold"
          touchStart = new Date().getTime();
          // Reset couldBeTap tracking
          couldBeTap = true;
        }
      });

      this.on('touchmove', function (event) {
        // If more than one finger, don't consider treating this as a click
        if (event.touches.length > 1) {
          couldBeTap = false;
        } else if (firstTouch) {
          // Some devices will throw touchmoves for all but the slightest of taps.
          // So, if we moved only a small distance, this could still be a tap
          var xdiff = event.touches[0].pageX - firstTouch.pageX;
          var ydiff = event.touches[0].pageY - firstTouch.pageY;
          var touchDistance = Math.sqrt(xdiff * xdiff + ydiff * ydiff);
          if (touchDistance > tapMovementThreshold) {
            couldBeTap = false;
          }
        }
      });

      var noTap = function noTap() {
        couldBeTap = false;
      };
      // TODO: Listen to the original target. http://youtu.be/DujfpXOKUp8?t=13m8s
      this.on('touchleave', noTap);
      this.on('touchcancel', noTap);

      // When the touch ends, measure how long it took and trigger the appropriate
      // event
      this.on('touchend', function (event) {
        firstTouch = null;
        // Proceed only if the touchmove/leave/cancel event didn't happen
        if (couldBeTap === true) {
          // Measure how long the touch lasted
          var touchTime = new Date().getTime() - touchStart;
          // Make sure the touch was less than the threshold to be considered a tap
          if (touchTime < touchTimeThreshold) {
            event.preventDefault(); // Don't let browser turn this into a click
            this.trigger('tap');
            // It may be good to copy the touchend event object and change the
            // type to tap, if the other event properties aren't exact after
            // Lib.fixEvent runs (e.g. event.target)
          }
        }
      });
    }
  }, {
    key: 'enableTouchActivity',

    /**
     * Report user touch activity when touch events occur
     *
     * User activity is used to determine when controls should show/hide. It's
     * relatively simple when it comes to mouse events, because any mouse event
     * should show the controls. So we capture mouse events that bubble up to the
     * player and report activity when that happens.
     *
     * With touch events it isn't as easy. We can't rely on touch events at the
     * player level, because a tap (touchstart + touchend) on the video itself on
     * mobile devices is meant to turn controls off (and on). User activity is
     * checked asynchronously, so what could happen is a tap event on the video
     * turns the controls off, then the touchend event bubbles up to the player,
     * which if it reported user activity, would turn the controls right back on.
     * (We also don't want to completely block touch events from bubbling up)
     *
     * Also a touchmove, touch+hold, and anything other than a tap is not supposed
     * to turn the controls back on on a mobile device.
     *
     * Here we're setting the default component behavior to report user activity
     * whenever touch events happen, and this can be turned off by components that
     * want touch events to act differently.
     */
    value: function enableTouchActivity() {
      // Don't continue if the root player doesn't support reporting user activity
      if (!this.player().reportUserActivity) {
        return;
      }

      // listener for reporting that the user is active
      var report = Lib.bind(this.player(), this.player().reportUserActivity);

      var touchHolding = undefined;
      this.on('touchstart', function () {
        report();
        // For as long as the they are touching the device or have their mouse down,
        // we consider them active even if they're not moving their finger or mouse.
        // So we want to continue to update that they are active
        this.clearInterval(touchHolding);
        // report at the same interval as activityCheck
        touchHolding = this.setInterval(report, 250);
      });

      var touchEnd = function touchEnd(event) {
        report();
        // stop the interval that maintains activity if the touch is holding
        this.clearInterval(touchHolding);
      };

      this.on('touchmove', report);
      this.on('touchend', touchEnd);
      this.on('touchcancel', touchEnd);
    }
  }, {
    key: 'setTimeout',

    /**
     * Creates timeout and sets up disposal automatically.
     * @param {Function} fn The function to run after the timeout.
     * @param {Number} timeout Number of ms to delay before executing specified function.
     * @return {Number} Returns the timeout ID
     */
    value: (function (_setTimeout) {
      function setTimeout(_x, _x2) {
        return _setTimeout.apply(this, arguments);
      }

      setTimeout.toString = function () {
        return setTimeout.toString();
      };

      return setTimeout;
    })(function (fn, timeout) {
      fn = Lib.bind(this, fn);

      // window.setTimeout would be preferable here, but due to some bizarre issue with Sinon and/or Phantomjs, we can't.
      var timeoutId = setTimeout(fn, timeout);

      var disposeFn = function disposeFn() {
        this.clearTimeout(timeoutId);
      };

      disposeFn.guid = 'vjs-timeout-' + timeoutId;

      this.on('dispose', disposeFn);

      return timeoutId;
    })
  }, {
    key: 'clearTimeout',

    /**
     * Clears a timeout and removes the associated dispose listener
     * @param {Number} timeoutId The id of the timeout to clear
     * @return {Number} Returns the timeout ID
     */
    value: (function (_clearTimeout) {
      function clearTimeout(_x3) {
        return _clearTimeout.apply(this, arguments);
      }

      clearTimeout.toString = function () {
        return clearTimeout.toString();
      };

      return clearTimeout;
    })(function (timeoutId) {
      clearTimeout(timeoutId);

      var disposeFn = function disposeFn() {};
      disposeFn.guid = 'vjs-timeout-' + timeoutId;

      this.off('dispose', disposeFn);

      return timeoutId;
    })
  }, {
    key: 'setInterval',

    /**
     * Creates an interval and sets up disposal automatically.
     * @param {Function} fn The function to run every N seconds.
     * @param {Number} interval Number of ms to delay before executing specified function.
     * @return {Number} Returns the interval ID
     */
    value: (function (_setInterval) {
      function setInterval(_x4, _x5) {
        return _setInterval.apply(this, arguments);
      }

      setInterval.toString = function () {
        return setInterval.toString();
      };

      return setInterval;
    })(function (fn, interval) {
      fn = Lib.bind(this, fn);

      var intervalId = setInterval(fn, interval);

      var disposeFn = function disposeFn() {
        this.clearInterval(intervalId);
      };

      disposeFn.guid = 'vjs-interval-' + intervalId;

      this.on('dispose', disposeFn);

      return intervalId;
    })
  }, {
    key: 'clearInterval',

    /**
     * Clears an interval and removes the associated dispose listener
     * @param {Number} intervalId The id of the interval to clear
     * @return {Number} Returns the interval ID
     */
    value: (function (_clearInterval) {
      function clearInterval(_x6) {
        return _clearInterval.apply(this, arguments);
      }

      clearInterval.toString = function () {
        return clearInterval.toString();
      };

      return clearInterval;
    })(function (intervalId) {
      clearInterval(intervalId);

      var disposeFn = function disposeFn() {};
      disposeFn.guid = 'vjs-interval-' + intervalId;

      this.off('dispose', disposeFn);

      return intervalId;
    })
  }], [{
    key: 'registerComponent',
    value: function registerComponent(name, comp) {
      if (!Component.components_) {
        Component.components_ = {};
      }

      Component.components_[name] = comp;
      return comp;
    }
  }, {
    key: 'getComponent',
    value: function getComponent(name) {
      if (Component.components_ && Component.components_[name]) {
        return Component.components_[name];
      }

      if (_window2['default'] && _window2['default'].videojs && _window2['default'].videojs[name]) {
        Lib.log.warn('The ' + name + ' component was added to the videojs object when it should be registered using videojs.registerComponent(name, component)');
        return _window2['default'].videojs[name];
      }
    }
  }, {
    key: 'extend',
    value: function extend(props) {
      props = props || {};
      // Set up the constructor using the supplied init method
      // or using the init of the parent object
      // Make sure to check the unobfuscated version for external libs
      var init = props.init || props.init || this.prototype.init || this.prototype.init || function () {};
      // In Resig's simple class inheritance (previously used) the constructor
      //  is a function that calls `this.init.apply(arguments)`
      // However that would prevent us from using `ParentObject.call(this);`
      //  in a Child constructor because the `this` in `this.init`
      //  would still refer to the Child and cause an infinite loop.
      // We would instead have to do
      //    `ParentObject.prototype.init.apply(this, arguments);`
      //  Bleh. We're not creating a _super() function, so it's good to keep
      //  the parent constructor reference simple.
      var subObj = function subObj() {
        init.apply(this, arguments);
      };

      // Inherit from this object's prototype
      subObj.prototype = Lib.obj.create(this.prototype);
      // Reset the constructor property for subObj otherwise
      // instances of subObj would have the constructor of the parent Object
      subObj.prototype.constructor = subObj;

      // Make the class extendable
      subObj.extend = Component.extend;
      // Make a function for creating instances
      // subObj.create = CoreObject.create;

      // Extend subObj's prototype with functions and other properties from props
      for (var name in props) {
        if (props.hasOwnProperty(name)) {
          subObj.prototype[name] = props[name];
        }
      }

      return subObj;
    }
  }]);

  return Component;
})();

Component.registerComponent('Component', Component);
exports['default'] = Component;
module.exports = exports['default'];

},{"./events.js":62,"./lib.js":64,"./util.js":87,"global/window":2}],27:[function(require,module,exports){
'use strict';

var _interopRequireWildcard = function (obj) { return obj && obj.__esModule ? obj : { 'default': obj }; };

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } };

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if (descriptor.value) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _inherits = function (subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; };

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _Component2 = require('../component.js');

var _Component3 = _interopRequireWildcard(_Component2);

var _import = require('../lib.js');

var Lib = _interopRequireWildcard(_import);

// Required children

var _PlayToggle = require('./play-toggle.js');

var _PlayToggle2 = _interopRequireWildcard(_PlayToggle);

var _CurrentTimeDisplay = require('./time-controls/current-time-display.js');

var _CurrentTimeDisplay2 = _interopRequireWildcard(_CurrentTimeDisplay);

var _DurationDisplay = require('./time-controls/duration-display.js');

var _DurationDisplay2 = _interopRequireWildcard(_DurationDisplay);

var _TimeDivider = require('./time-controls/time-divider.js');

var _TimeDivider2 = _interopRequireWildcard(_TimeDivider);

var _RemainingTimeDisplay = require('./time-controls/remaining-time-display.js');

var _RemainingTimeDisplay2 = _interopRequireWildcard(_RemainingTimeDisplay);

var _LiveDisplay = require('./live-display.js');

var _LiveDisplay2 = _interopRequireWildcard(_LiveDisplay);

var _ProgressControl = require('./progress-control/progress-control.js');

var _ProgressControl2 = _interopRequireWildcard(_ProgressControl);

var _FullscreenToggle = require('./fullscreen-toggle.js');

var _FullscreenToggle2 = _interopRequireWildcard(_FullscreenToggle);

var _VolumeControl = require('./volume-control/volume-control.js');

var _VolumeControl2 = _interopRequireWildcard(_VolumeControl);

var _VolumeMenuButton = require('./volume-menu-button.js');

var _VolumeMenuButton2 = _interopRequireWildcard(_VolumeMenuButton);

var _MuteToggle = require('./mute-toggle.js');

var _MuteToggle2 = _interopRequireWildcard(_MuteToggle);

var _ChaptersButton = require('./text-track-controls/chapters-button.js');

var _ChaptersButton2 = _interopRequireWildcard(_ChaptersButton);

var _SubtitlesButton = require('./text-track-controls/subtitles-button.js');

var _SubtitlesButton2 = _interopRequireWildcard(_SubtitlesButton);

var _CaptionsButton = require('./text-track-controls/captions-button.js');

var _CaptionsButton2 = _interopRequireWildcard(_CaptionsButton);

var _PlaybackRateMenuButton = require('./playback-rate-menu/playback-rate-menu-button.js');

var _PlaybackRateMenuButton2 = _interopRequireWildcard(_PlaybackRateMenuButton);

var _CustomControlSpacer = require('./spacer-controls/custom-control-spacer.js');

var _CustomControlSpacer2 = _interopRequireWildcard(_CustomControlSpacer);

/**
 * Container of main controls
 * @param {Player|Object} player
 * @param {Object=} options
 * @class
 * @constructor
 * @extends Component
 */

var ControlBar = (function (_Component) {
  function ControlBar() {
    _classCallCheck(this, ControlBar);

    if (_Component != null) {
      _Component.apply(this, arguments);
    }
  }

  _inherits(ControlBar, _Component);

  _createClass(ControlBar, [{
    key: 'createEl',
    value: function createEl() {
      return Lib.createEl('div', {
        className: 'vjs-control-bar'
      });
    }
  }]);

  return ControlBar;
})(_Component3['default']);

ControlBar.prototype.options_ = {
  loadEvent: 'play',
  children: ['playToggle', 'currentTimeDisplay', 'timeDivider', 'durationDisplay', 'progressControl', 'liveDisplay', 'remainingTimeDisplay', 'customControlSpacer', 'playbackRateMenuButton', 'muteToggle', 'volumeControl', 'chaptersButton', 'subtitlesButton', 'captionsButton', 'volumeMenuButton', 'fullscreenToggle']
};

_Component3['default'].registerComponent('ControlBar', ControlBar);
exports['default'] = ControlBar;
module.exports = exports['default'];

},{"../component.js":26,"../lib.js":64,"./fullscreen-toggle.js":28,"./live-display.js":29,"./mute-toggle.js":30,"./play-toggle.js":31,"./playback-rate-menu/playback-rate-menu-button.js":32,"./progress-control/progress-control.js":36,"./spacer-controls/custom-control-spacer.js":39,"./text-track-controls/captions-button.js":42,"./text-track-controls/chapters-button.js":43,"./text-track-controls/subtitles-button.js":46,"./time-controls/current-time-display.js":49,"./time-controls/duration-display.js":50,"./time-controls/remaining-time-display.js":51,"./time-controls/time-divider.js":52,"./volume-control/volume-control.js":54,"./volume-menu-button.js":57}],28:[function(require,module,exports){
'use strict';

var _interopRequireWildcard = function (obj) { return obj && obj.__esModule ? obj : { 'default': obj }; };

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } };

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if (descriptor.value) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(object, property, receiver) { var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _inherits = function (subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; };

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _Button2 = require('../button');

var _Button3 = _interopRequireWildcard(_Button2);

/**
 * Toggle fullscreen video
 * @param {Player|Object} player
 * @param {Object=} options
 * @class
 * @extends vjs.Button
 */

var FullscreenToggle = (function (_Button) {
  function FullscreenToggle() {
    _classCallCheck(this, FullscreenToggle);

    if (_Button != null) {
      _Button.apply(this, arguments);
    }
  }

  _inherits(FullscreenToggle, _Button);

  _createClass(FullscreenToggle, [{
    key: 'buildCSSClass',
    value: function buildCSSClass() {
      return 'vjs-fullscreen-control ' + _get(Object.getPrototypeOf(FullscreenToggle.prototype), 'buildCSSClass', this).call(this);
    }
  }, {
    key: 'handleClick',
    value: function handleClick() {
      if (!this.player_.isFullscreen()) {
        this.player_.requestFullscreen();
        this.controlText_.innerHTML = this.localize('Non-Fullscreen');
      } else {
        this.player_.exitFullscreen();
        this.controlText_.innerHTML = this.localize('Fullscreen');
      }
    }
  }]);

  return FullscreenToggle;
})(_Button3['default']);

FullscreenToggle.prototype.buttonText = 'Fullscreen';

_Button3['default'].registerComponent('FullscreenToggle', FullscreenToggle);
exports['default'] = FullscreenToggle;
module.exports = exports['default'];

},{"../button":25}],29:[function(require,module,exports){
'use strict';

var _interopRequireWildcard = function (obj) { return obj && obj.__esModule ? obj : { 'default': obj }; };

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } };

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if (descriptor.value) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(object, property, receiver) { var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _inherits = function (subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; };

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _Component2 = require('../component');

var _Component3 = _interopRequireWildcard(_Component2);

var _import = require('../lib');

var Lib = _interopRequireWildcard(_import);

/**
 * Displays the live indicator
 * TODO - Future make it click to snap to live
 * @param {Player|Object} player
 * @param {Object=} options
 * @constructor
 */

var LiveDisplay = (function (_Component) {
  function LiveDisplay() {
    _classCallCheck(this, LiveDisplay);

    if (_Component != null) {
      _Component.apply(this, arguments);
    }
  }

  _inherits(LiveDisplay, _Component);

  _createClass(LiveDisplay, [{
    key: 'createEl',
    value: function createEl() {
      var el = _get(Object.getPrototypeOf(LiveDisplay.prototype), 'createEl', this).call(this, 'div', {
        className: 'vjs-live-control vjs-control'
      });

      this.contentEl_ = Lib.createEl('div', {
        className: 'vjs-live-display',
        innerHTML: '<span class="vjs-control-text">' + this.localize('Stream Type') + '</span>' + this.localize('LIVE'),
        'aria-live': 'off'
      });

      el.appendChild(this.contentEl_);

      return el;
    }
  }]);

  return LiveDisplay;
})(_Component3['default']);

_Component3['default'].registerComponent('LiveDisplay', LiveDisplay);
exports['default'] = LiveDisplay;
module.exports = exports['default'];

},{"../component":26,"../lib":64}],30:[function(require,module,exports){
'use strict';

var _interopRequireWildcard = function (obj) { return obj && obj.__esModule ? obj : { 'default': obj }; };

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } };

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if (descriptor.value) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(object, property, receiver) { var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _inherits = function (subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; };

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _Button2 = require('../button');

var _Button3 = _interopRequireWildcard(_Button2);

var _Component = require('../component');

var _Component2 = _interopRequireWildcard(_Component);

var _import = require('../lib');

var Lib = _interopRequireWildcard(_import);

/**
 * A button component for muting the audio
 *
 * @param {Player|Object} player
 * @param {Object=} options
 * @constructor
 */

var MuteToggle = (function (_Button) {
  function MuteToggle(player, options) {
    _classCallCheck(this, MuteToggle);

    _get(Object.getPrototypeOf(MuteToggle.prototype), 'constructor', this).call(this, player, options);

    this.on(player, 'volumechange', this.update);

    // hide mute toggle if the current tech doesn't support volume control
    if (player.tech && player.tech.featuresVolumeControl === false) {
      this.addClass('vjs-hidden');
    }

    this.on(player, 'loadstart', function () {
      if (player.tech.featuresVolumeControl === false) {
        this.addClass('vjs-hidden');
      } else {
        this.removeClass('vjs-hidden');
      }
    });
  }

  _inherits(MuteToggle, _Button);

  _createClass(MuteToggle, [{
    key: 'createEl',
    value: function createEl() {
      return _get(Object.getPrototypeOf(MuteToggle.prototype), 'createEl', this).call(this, 'div', {
        className: this.buildCSSClass(),
        innerHTML: '<div><span class="vjs-control-text">' + this.localize('Mute') + '</span></div>'
      });
    }
  }, {
    key: 'buildCSSClass',
    value: function buildCSSClass() {
      return 'vjs-mute-control ' + _get(Object.getPrototypeOf(MuteToggle.prototype), 'buildCSSClass', this).call(this);
    }
  }, {
    key: 'handleClick',
    value: function handleClick() {
      this.player_.muted(this.player_.muted() ? false : true);
    }
  }, {
    key: 'update',
    value: function update() {
      var vol = this.player_.volume(),
          level = 3;

      if (vol === 0 || this.player_.muted()) {
        level = 0;
      } else if (vol < 0.33) {
        level = 1;
      } else if (vol < 0.67) {
        level = 2;
      }

      // Don't rewrite the button text if the actual text doesn't change.
      // This causes unnecessary and confusing information for screen reader users.
      // This check is needed because this function gets called every time the volume level is changed.
      var toMute = this.player_.muted() ? 'Unmute' : 'Mute';
      var localizedMute = this.localize(toMute);
      if (this.el_.children[0].children[0].innerHTML !== localizedMute) {
        this.el_.children[0].children[0].innerHTML = localizedMute;
      }

      /* TODO improve muted icon classes */
      for (var i = 0; i < 4; i++) {
        Lib.removeClass(this.el_, 'vjs-vol-' + i);
      }
      Lib.addClass(this.el_, 'vjs-vol-' + level);
    }
  }]);

  return MuteToggle;
})(_Button3['default']);

_Component2['default'].registerComponent('MuteToggle', MuteToggle);
exports['default'] = MuteToggle;
module.exports = exports['default'];

},{"../button":25,"../component":26,"../lib":64}],31:[function(require,module,exports){
'use strict';

var _interopRequireWildcard = function (obj) { return obj && obj.__esModule ? obj : { 'default': obj }; };

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } };

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if (descriptor.value) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(object, property, receiver) { var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _inherits = function (subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; };

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _Button2 = require('../button');

var _Button3 = _interopRequireWildcard(_Button2);

var _import = require('../lib');

var Lib = _interopRequireWildcard(_import);

/**
 * Button to toggle between play and pause
 * @param {Player|Object} player
 * @param {Object=} options
 * @class
 * @constructor
 */

var PlayToggle = (function (_Button) {
  function PlayToggle(player, options) {
    _classCallCheck(this, PlayToggle);

    _get(Object.getPrototypeOf(PlayToggle.prototype), 'constructor', this).call(this, player, options);

    this.on(player, 'play', this.handlePlay);
    this.on(player, 'pause', this.handlePause);
  }

  _inherits(PlayToggle, _Button);

  _createClass(PlayToggle, [{
    key: 'buildCSSClass',
    value: function buildCSSClass() {
      return 'vjs-play-control ' + _get(Object.getPrototypeOf(PlayToggle.prototype), 'buildCSSClass', this).call(this);
    }
  }, {
    key: 'handleClick',

    // handleClick - Toggle between play and pause
    value: function handleClick() {
      if (this.player_.paused()) {
        this.player_.play();
      } else {
        this.player_.pause();
      }
    }
  }, {
    key: 'handlePlay',

    // handlePlay - Add the vjs-playing class to the element so it can change appearance
    value: function handlePlay() {
      this.removeClass('vjs-paused');
      this.addClass('vjs-playing');
      this.el_.children[0].children[0].innerHTML = this.localize('Pause'); // change the button text to "Pause"
    }
  }, {
    key: 'handlePause',

    // handlePause - Add the vjs-paused class to the element so it can change appearance
    value: function handlePause() {
      this.removeClass('vjs-playing');
      this.addClass('vjs-paused');
      this.el_.children[0].children[0].innerHTML = this.localize('Play'); // change the button text to "Play"
    }
  }]);

  return PlayToggle;
})(_Button3['default']);

PlayToggle.prototype.buttonText = 'Play';

_Button3['default'].registerComponent('PlayToggle', PlayToggle);
exports['default'] = PlayToggle;
module.exports = exports['default'];

},{"../button":25,"../lib":64}],32:[function(require,module,exports){
'use strict';

var _interopRequireWildcard = function (obj) { return obj && obj.__esModule ? obj : { 'default': obj }; };

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } };

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if (descriptor.value) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(object, property, receiver) { var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _inherits = function (subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; };

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _MenuButton2 = require('../../menu/menu-button.js');

var _MenuButton3 = _interopRequireWildcard(_MenuButton2);

var _Menu = require('../../menu/menu.js');

var _Menu2 = _interopRequireWildcard(_Menu);

var _PlaybackRateMenuItem = require('./playback-rate-menu-item.js');

var _PlaybackRateMenuItem2 = _interopRequireWildcard(_PlaybackRateMenuItem);

var _import = require('../../lib.js');

var Lib = _interopRequireWildcard(_import);

/**
 * The component for controlling the playback rate
 *
 * @param {Player|Object} player
 * @param {Object=} options
 * @constructor
 */

var PlaybackRateMenuButton = (function (_MenuButton) {
  function PlaybackRateMenuButton(player, options) {
    _classCallCheck(this, PlaybackRateMenuButton);

    _get(Object.getPrototypeOf(PlaybackRateMenuButton.prototype), 'constructor', this).call(this, player, options);

    this.updateVisibility();
    this.updateLabel();

    this.on(player, 'loadstart', this.updateVisibility);
    this.on(player, 'ratechange', this.updateLabel);
  }

  _inherits(PlaybackRateMenuButton, _MenuButton);

  _createClass(PlaybackRateMenuButton, [{
    key: 'createEl',
    value: function createEl() {
      var el = _get(Object.getPrototypeOf(PlaybackRateMenuButton.prototype), 'createEl', this).call(this);

      this.labelEl_ = Lib.createEl('div', {
        className: 'vjs-playback-rate-value',
        innerHTML: 1
      });

      el.appendChild(this.labelEl_);

      return el;
    }
  }, {
    key: 'createMenu',

    // Menu creation
    value: function createMenu() {
      var menu = new _Menu2['default'](this.player());
      var rates = this.player().options().playbackRates;

      if (rates) {
        for (var i = rates.length - 1; i >= 0; i--) {
          menu.addChild(new _PlaybackRateMenuItem2['default'](this.player(), { rate: rates[i] + 'x' }));
        }
      }

      return menu;
    }
  }, {
    key: 'updateARIAAttributes',
    value: function updateARIAAttributes() {
      // Current playback rate
      this.el().setAttribute('aria-valuenow', this.player().playbackRate());
    }
  }, {
    key: 'handleClick',
    value: function handleClick() {
      // select next rate option
      var currentRate = this.player().playbackRate();
      var rates = this.player().options().playbackRates;
      // this will select first one if the last one currently selected
      var newRate = rates[0];
      for (var i = 0; i < rates.length; i++) {
        if (rates[i] > currentRate) {
          newRate = rates[i];
          break;
        }
      }
      this.player().playbackRate(newRate);
    }
  }, {
    key: 'playbackRateSupported',
    value: function playbackRateSupported() {
      return this.player().tech && this.player().tech.featuresPlaybackRate && this.player().options().playbackRates && this.player().options().playbackRates.length > 0;
    }
  }, {
    key: 'updateVisibility',

    /**
     * Hide playback rate controls when they're no playback rate options to select
     */
    value: function updateVisibility() {
      if (this.playbackRateSupported()) {
        this.removeClass('vjs-hidden');
      } else {
        this.addClass('vjs-hidden');
      }
    }
  }, {
    key: 'updateLabel',

    /**
     * Update button label when rate changed
     */
    value: function updateLabel() {
      if (this.playbackRateSupported()) {
        this.labelEl_.innerHTML = this.player().playbackRate() + 'x';
      }
    }
  }]);

  return PlaybackRateMenuButton;
})(_MenuButton3['default']);

PlaybackRateMenuButton.prototype.buttonText = 'Playback Rate';
PlaybackRateMenuButton.prototype.className = 'vjs-playback-rate';

_MenuButton3['default'].registerComponent('PlaybackRateMenuButton', PlaybackRateMenuButton);
exports['default'] = PlaybackRateMenuButton;
module.exports = exports['default'];

},{"../../lib.js":64,"../../menu/menu-button.js":67,"../../menu/menu.js":69,"./playback-rate-menu-item.js":33}],33:[function(require,module,exports){
'use strict';

var _interopRequireWildcard = function (obj) { return obj && obj.__esModule ? obj : { 'default': obj }; };

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } };

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if (descriptor.value) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(object, property, receiver) { var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _inherits = function (subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; };

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _MenuItem2 = require('../../menu/menu-item.js');

var _MenuItem3 = _interopRequireWildcard(_MenuItem2);

/**
 * The specific menu item type for selecting a playback rate
 *
 * @constructor
 */

var PlaybackRateMenuItem = (function (_MenuItem) {
  function PlaybackRateMenuItem(player, options) {
    _classCallCheck(this, PlaybackRateMenuItem);

    var label = options.rate;
    var rate = parseFloat(label, 10);

    // Modify options for parent MenuItem class's init.
    options.label = label;
    options.selected = rate === 1;
    _get(Object.getPrototypeOf(PlaybackRateMenuItem.prototype), 'constructor', this).call(this, player, options);

    this.label = label;
    this.rate = rate;

    this.on(player, 'ratechange', this.update);
  }

  _inherits(PlaybackRateMenuItem, _MenuItem);

  _createClass(PlaybackRateMenuItem, [{
    key: 'handleClick',
    value: function handleClick() {
      _get(Object.getPrototypeOf(PlaybackRateMenuItem.prototype), 'handleClick', this).call(this);
      this.player().playbackRate(this.rate);
    }
  }, {
    key: 'update',
    value: function update() {
      this.selected(this.player().playbackRate() == this.rate);
    }
  }]);

  return PlaybackRateMenuItem;
})(_MenuItem3['default']);

PlaybackRateMenuItem.prototype.contentElType = 'button';

_MenuItem3['default'].registerComponent('PlaybackRateMenuItem', PlaybackRateMenuItem);
exports['default'] = PlaybackRateMenuItem;
module.exports = exports['default'];

},{"../../menu/menu-item.js":68}],34:[function(require,module,exports){
'use strict';

var _interopRequireWildcard = function (obj) { return obj && obj.__esModule ? obj : { 'default': obj }; };

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } };

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if (descriptor.value) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(object, property, receiver) { var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _inherits = function (subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; };

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _Component2 = require('../../component.js');

var _Component3 = _interopRequireWildcard(_Component2);

var _import = require('../../lib.js');

var Lib = _interopRequireWildcard(_import);

/**
 * Shows load progress
 *
 * @param {Player|Object} player
 * @param {Object=} options
 * @constructor
 */

var LoadProgressBar = (function (_Component) {
  function LoadProgressBar(player, options) {
    _classCallCheck(this, LoadProgressBar);

    _get(Object.getPrototypeOf(LoadProgressBar.prototype), 'constructor', this).call(this, player, options);
    this.on(player, 'progress', this.update);
  }

  _inherits(LoadProgressBar, _Component);

  _createClass(LoadProgressBar, [{
    key: 'createEl',
    value: function createEl() {
      return _get(Object.getPrototypeOf(LoadProgressBar.prototype), 'createEl', this).call(this, 'div', {
        className: 'vjs-load-progress',
        innerHTML: '<span class="vjs-control-text"><span>' + this.localize('Loaded') + '</span>: 0%</span>'
      });
    }
  }, {
    key: 'update',
    value: function update() {
      var buffered = this.player_.buffered();
      var duration = this.player_.duration();
      var bufferedEnd = this.player_.bufferedEnd();
      var children = this.el_.children;

      // get the percent width of a time compared to the total end
      var percentify = function percentify(time, end) {
        var percent = time / end || 0; // no NaN
        return percent * 100 + '%';
      };

      // update the width of the progress bar
      this.el_.style.width = percentify(bufferedEnd, duration);

      // add child elements to represent the individual buffered time ranges
      for (var i = 0; i < buffered.length; i++) {
        var start = buffered.start(i);
        var end = buffered.end(i);
        var part = children[i];

        if (!part) {
          part = this.el_.appendChild(Lib.createEl());
        }

        // set the percent based on the width of the progress bar (bufferedEnd)
        part.style.left = percentify(start, bufferedEnd);
        part.style.width = percentify(end - start, bufferedEnd);
      }

      // remove unused buffered range elements
      for (var i = children.length; i > buffered.length; i--) {
        this.el_.removeChild(children[i - 1]);
      }
    }
  }]);

  return LoadProgressBar;
})(_Component3['default']);

_Component3['default'].registerComponent('LoadProgressBar', LoadProgressBar);
exports['default'] = LoadProgressBar;
module.exports = exports['default'];

},{"../../component.js":26,"../../lib.js":64}],35:[function(require,module,exports){
'use strict';

var _interopRequireWildcard = function (obj) { return obj && obj.__esModule ? obj : { 'default': obj }; };

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } };

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if (descriptor.value) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(object, property, receiver) { var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _inherits = function (subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; };

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _Component2 = require('../../component.js');

var _Component3 = _interopRequireWildcard(_Component2);

/**
 * Shows play progress
 *
 * @param {Player|Object} player
 * @param {Object=} options
 * @constructor
 */

var PlayProgressBar = (function (_Component) {
  function PlayProgressBar() {
    _classCallCheck(this, PlayProgressBar);

    if (_Component != null) {
      _Component.apply(this, arguments);
    }
  }

  _inherits(PlayProgressBar, _Component);

  _createClass(PlayProgressBar, [{
    key: 'createEl',
    value: function createEl() {
      return _get(Object.getPrototypeOf(PlayProgressBar.prototype), 'createEl', this).call(this, 'div', {
        className: 'vjs-play-progress',
        innerHTML: '<span class="vjs-control-text"><span>' + this.localize('Progress') + '</span>: 0%</span>'
      });
    }
  }]);

  return PlayProgressBar;
})(_Component3['default']);

_Component3['default'].registerComponent('PlayProgressBar', PlayProgressBar);
exports['default'] = PlayProgressBar;
module.exports = exports['default'];

},{"../../component.js":26}],36:[function(require,module,exports){
'use strict';

var _interopRequireWildcard = function (obj) { return obj && obj.__esModule ? obj : { 'default': obj }; };

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } };

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if (descriptor.value) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(object, property, receiver) { var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _inherits = function (subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; };

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _Component2 = require('../../component.js');

var _Component3 = _interopRequireWildcard(_Component2);

var _SeekBar = require('./seek-bar.js');

var _SeekBar2 = _interopRequireWildcard(_SeekBar);

/**
 * The Progress Control component contains the seek bar, load progress,
 * and play progress
 *
 * @param {Player|Object} player
 * @param {Object=} options
 * @constructor
 */

var ProgressControl = (function (_Component) {
  function ProgressControl() {
    _classCallCheck(this, ProgressControl);

    if (_Component != null) {
      _Component.apply(this, arguments);
    }
  }

  _inherits(ProgressControl, _Component);

  _createClass(ProgressControl, [{
    key: 'createEl',
    value: function createEl() {
      return _get(Object.getPrototypeOf(ProgressControl.prototype), 'createEl', this).call(this, 'div', {
        className: 'vjs-progress-control vjs-control'
      });
    }
  }]);

  return ProgressControl;
})(_Component3['default']);

ProgressControl.prototype.options_ = {
  children: {
    seekBar: {}
  }
};

_Component3['default'].registerComponent('ProgressControl', ProgressControl);
exports['default'] = ProgressControl;
module.exports = exports['default'];

},{"../../component.js":26,"./seek-bar.js":37}],37:[function(require,module,exports){
'use strict';

var _interopRequireWildcard = function (obj) { return obj && obj.__esModule ? obj : { 'default': obj }; };

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } };

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if (descriptor.value) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(object, property, receiver) { var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _inherits = function (subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; };

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _Slider2 = require('../../slider/slider.js');

var _Slider3 = _interopRequireWildcard(_Slider2);

var _LoadProgressBar = require('./load-progress-bar.js');

var _LoadProgressBar2 = _interopRequireWildcard(_LoadProgressBar);

var _PlayProgressBar = require('./play-progress-bar.js');

var _PlayProgressBar2 = _interopRequireWildcard(_PlayProgressBar);

var _SeekHandle = require('./seek-handle.js');

var _SeekHandle2 = _interopRequireWildcard(_SeekHandle);

var _import = require('../../lib.js');

var Lib = _interopRequireWildcard(_import);

/**
 * Seek Bar and holder for the progress bars
 *
 * @param {Player|Object} player
 * @param {Object=} options
 * @constructor
 */

var SeekBar = (function (_Slider) {
  function SeekBar(player, options) {
    _classCallCheck(this, SeekBar);

    _get(Object.getPrototypeOf(SeekBar.prototype), 'constructor', this).call(this, player, options);
    this.on(player, 'timeupdate', this.updateARIAAttributes);
    player.ready(Lib.bind(this, this.updateARIAAttributes));
  }

  _inherits(SeekBar, _Slider);

  _createClass(SeekBar, [{
    key: 'createEl',
    value: function createEl() {
      return _get(Object.getPrototypeOf(SeekBar.prototype), 'createEl', this).call(this, 'div', {
        className: 'vjs-progress-holder',
        'aria-label': 'video progress bar'
      });
    }
  }, {
    key: 'updateARIAAttributes',
    value: function updateARIAAttributes() {
      // Allows for smooth scrubbing, when player can't keep up.
      var time = this.player_.scrubbing() ? this.player_.getCache().currentTime : this.player_.currentTime();
      this.el_.setAttribute('aria-valuenow', Lib.round(this.getPercent() * 100, 2)); // machine readable value of progress bar (percentage complete)
      this.el_.setAttribute('aria-valuetext', Lib.formatTime(time, this.player_.duration())); // human readable value of progress bar (time complete)
    }
  }, {
    key: 'getPercent',
    value: function getPercent() {
      return this.player_.currentTime() / this.player_.duration();
    }
  }, {
    key: 'handleMouseDown',
    value: function handleMouseDown(event) {
      _get(Object.getPrototypeOf(SeekBar.prototype), 'handleMouseDown', this).call(this, event);

      this.player_.scrubbing(true);

      this.videoWasPlaying = !this.player_.paused();
      this.player_.pause();
    }
  }, {
    key: 'handleMouseMove',
    value: function handleMouseMove(event) {
      var newTime = this.calculateDistance(event) * this.player_.duration();

      // Don't let video end while scrubbing.
      if (newTime == this.player_.duration()) {
        newTime = newTime - 0.1;
      }

      // Set new time (tell player to seek to new time)
      this.player_.currentTime(newTime);
    }
  }, {
    key: 'handleMouseUp',
    value: function handleMouseUp(event) {
      _get(Object.getPrototypeOf(SeekBar.prototype), 'handleMouseUp', this).call(this, event);

      this.player_.scrubbing(false);
      if (this.videoWasPlaying) {
        this.player_.play();
      }
    }
  }, {
    key: 'stepForward',
    value: function stepForward() {
      this.player_.currentTime(this.player_.currentTime() + 5); // more quickly fast forward for keyboard-only users
    }
  }, {
    key: 'stepBack',
    value: function stepBack() {
      this.player_.currentTime(this.player_.currentTime() - 5); // more quickly rewind for keyboard-only users
    }
  }]);

  return SeekBar;
})(_Slider3['default']);

SeekBar.prototype.options_ = {
  children: {
    loadProgressBar: {},
    playProgressBar: {},
    seekHandle: {}
  },
  barName: 'playProgressBar',
  handleName: 'seekHandle'
};

SeekBar.prototype.playerEvent = 'timeupdate';

_Slider3['default'].registerComponent('SeekBar', SeekBar);
exports['default'] = SeekBar;
module.exports = exports['default'];

},{"../../lib.js":64,"../../slider/slider.js":75,"./load-progress-bar.js":34,"./play-progress-bar.js":35,"./seek-handle.js":38}],38:[function(require,module,exports){
'use strict';

var _interopRequireWildcard = function (obj) { return obj && obj.__esModule ? obj : { 'default': obj }; };

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } };

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if (descriptor.value) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(object, property, receiver) { var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _inherits = function (subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; };

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _SliderHandle2 = require('../../slider/slider-handle.js');

var _SliderHandle3 = _interopRequireWildcard(_SliderHandle2);

var _import = require('../../lib.js');

var Lib = _interopRequireWildcard(_import);

/**
 * The Seek Handle shows the current position of the playhead during playback,
 * and can be dragged to adjust the playhead.
 *
 * @param {Player|Object} player
 * @param {Object=} options
 * @constructor
 */

var SeekHandle = (function (_SliderHandle) {
  function SeekHandle(player, options) {
    _classCallCheck(this, SeekHandle);

    _get(Object.getPrototypeOf(SeekHandle.prototype), 'constructor', this).call(this, player, options);
    this.on(player, 'timeupdate', this.updateContent);
  }

  _inherits(SeekHandle, _SliderHandle);

  _createClass(SeekHandle, [{
    key: 'createEl',

    /** @inheritDoc */
    value: function createEl() {
      return _get(Object.getPrototypeOf(SeekHandle.prototype), 'createEl', this).call(this, 'div', {
        className: 'vjs-seek-handle',
        'aria-live': 'off'
      });
    }
  }, {
    key: 'updateContent',
    value: function updateContent() {
      var time = this.player_.scrubbing ? this.player_.getCache().currentTime : this.player_.currentTime();
      this.el_.innerHTML = '<span class="vjs-control-text">' + Lib.formatTime(time, this.player_.duration()) + '</span>';
    }
  }]);

  return SeekHandle;
})(_SliderHandle3['default']);

/**
 * The default value for the handle content, which may be read by screen readers
 *
 * @type {String}
 * @private
 */
SeekHandle.prototype.defaultValue = '00:00';

_SliderHandle3['default'].registerComponent('SeekHandle', SeekHandle);
exports['default'] = SeekHandle;
module.exports = exports['default'];

},{"../../lib.js":64,"../../slider/slider-handle.js":74}],39:[function(require,module,exports){
'use strict';

var _interopRequireWildcard = function (obj) { return obj && obj.__esModule ? obj : { 'default': obj }; };

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } };

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if (descriptor.value) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(object, property, receiver) { var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _inherits = function (subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; };

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _Spacer2 = require('./spacer.js');

var _Spacer3 = _interopRequireWildcard(_Spacer2);

/**
 * Spacer specifically meant to be used as an insertion point for new plugins, etc.
 *
 * @param {Player|Object} player
 * @param {Obect=} options
 */

var CustomControlSpacer = (function (_Spacer) {
  function CustomControlSpacer() {
    _classCallCheck(this, CustomControlSpacer);

    if (_Spacer != null) {
      _Spacer.apply(this, arguments);
    }
  }

  _inherits(CustomControlSpacer, _Spacer);

  _createClass(CustomControlSpacer, [{
    key: 'buildCSSClass',
    value: function buildCSSClass() {
      return 'vjs-custom-control-spacer ' + _get(Object.getPrototypeOf(CustomControlSpacer.prototype), 'buildCSSClass', this).call(this);
    }
  }, {
    key: 'createEl',
    value: function createEl() {
      return _get(Object.getPrototypeOf(CustomControlSpacer.prototype), 'createEl', this).call(this, {
        className: this.buildCSSClass()
      });
    }
  }]);

  return CustomControlSpacer;
})(_Spacer3['default']);

_Spacer3['default'].registerComponent('CustomControlSpacer', CustomControlSpacer);

exports['default'] = CustomControlSpacer;
module.exports = exports['default'];

},{"./spacer.js":40}],40:[function(require,module,exports){
'use strict';

var _interopRequireWildcard = function (obj) { return obj && obj.__esModule ? obj : { 'default': obj }; };

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } };

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if (descriptor.value) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(object, property, receiver) { var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _inherits = function (subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; };

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _Component2 = require('../../component.js');

var _Component3 = _interopRequireWildcard(_Component2);

/**
 * Just an empty spacer element that can be used as an append point for plugins, etc.
 * Also can be used to create space between elements when necessary.
 *
 * @param {Player|Object} player
 * @param {Object=} options
 */

var Spacer = (function (_Component) {
  function Spacer() {
    _classCallCheck(this, Spacer);

    if (_Component != null) {
      _Component.apply(this, arguments);
    }
  }

  _inherits(Spacer, _Component);

  _createClass(Spacer, [{
    key: 'buildCSSClass',
    value: function buildCSSClass() {
      return 'vjs-spacer ' + _get(Object.getPrototypeOf(Spacer.prototype), 'buildCSSClass', this).call(this);
    }
  }, {
    key: 'createEl',
    value: function createEl(props) {
      return _get(Object.getPrototypeOf(Spacer.prototype), 'createEl', this).call(this, 'div', {
        className: this.buildCSSClass()
      });
    }
  }]);

  return Spacer;
})(_Component3['default']);

_Component3['default'].registerComponent('Spacer', Spacer);

exports['default'] = Spacer;
module.exports = exports['default'];

},{"../../component.js":26}],41:[function(require,module,exports){
'use strict';

var _interopRequireWildcard = function (obj) { return obj && obj.__esModule ? obj : { 'default': obj }; };

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } };

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if (descriptor.value) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(object, property, receiver) { var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _inherits = function (subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; };

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _TextTrackMenuItem2 = require('./text-track-menu-item.js');

var _TextTrackMenuItem3 = _interopRequireWildcard(_TextTrackMenuItem2);

var CaptionSettingsMenuItem = (function (_TextTrackMenuItem) {
  function CaptionSettingsMenuItem(player, options) {
    _classCallCheck(this, CaptionSettingsMenuItem);

    options.track = {
      kind: options.kind,
      player: player,
      label: options.kind + ' settings',
      'default': false,
      mode: 'disabled'
    };

    _get(Object.getPrototypeOf(CaptionSettingsMenuItem.prototype), 'constructor', this).call(this, player, options);
    this.addClass('vjs-texttrack-settings');
  }

  _inherits(CaptionSettingsMenuItem, _TextTrackMenuItem);

  _createClass(CaptionSettingsMenuItem, [{
    key: 'handleClick',
    value: function handleClick() {
      this.player().getChild('textTrackSettings').show();
    }
  }]);

  return CaptionSettingsMenuItem;
})(_TextTrackMenuItem3['default']);

_TextTrackMenuItem3['default'].registerComponent('CaptionSettingsMenuItem', CaptionSettingsMenuItem);
exports['default'] = CaptionSettingsMenuItem;
module.exports = exports['default'];

},{"./text-track-menu-item.js":48}],42:[function(require,module,exports){
'use strict';

var _interopRequireWildcard = function (obj) { return obj && obj.__esModule ? obj : { 'default': obj }; };

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } };

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if (descriptor.value) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(object, property, receiver) { var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _inherits = function (subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; };

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _TextTrackButton2 = require('./text-track-button.js');

var _TextTrackButton3 = _interopRequireWildcard(_TextTrackButton2);

var _CaptionSettingsMenuItem = require('./caption-settings-menu-item.js');

var _CaptionSettingsMenuItem2 = _interopRequireWildcard(_CaptionSettingsMenuItem);

/**
 * The button component for toggling and selecting captions
 *
 * @constructor
 */

var CaptionsButton = (function (_TextTrackButton) {
  function CaptionsButton(player, options, ready) {
    _classCallCheck(this, CaptionsButton);

    _get(Object.getPrototypeOf(CaptionsButton.prototype), 'constructor', this).call(this, player, options, ready);
    this.el_.setAttribute('aria-label', 'Captions Menu');
  }

  _inherits(CaptionsButton, _TextTrackButton);

  _createClass(CaptionsButton, [{
    key: 'update',
    value: function update() {
      var threshold = 2;
      _get(Object.getPrototypeOf(CaptionsButton.prototype), 'update', this).call(this);

      // if native, then threshold is 1 because no settings button
      if (this.player().tech && this.player().tech.featuresNativeTextTracks) {
        threshold = 1;
      }

      if (this.items && this.items.length > threshold) {
        this.show();
      } else {
        this.hide();
      }
    }
  }, {
    key: 'createItems',
    value: function createItems() {
      var items = [];

      if (!(this.player().tech && this.player().tech.featuresNativeTextTracks)) {
        items.push(new _CaptionSettingsMenuItem2['default'](this.player_, { kind: this.kind_ }));
      }

      return _get(Object.getPrototypeOf(CaptionsButton.prototype), 'createItems', this).call(this, items);
    }
  }]);

  return CaptionsButton;
})(_TextTrackButton3['default']);

CaptionsButton.prototype.kind_ = 'captions';
CaptionsButton.prototype.buttonText = 'Captions';
CaptionsButton.prototype.className = 'vjs-captions-button';

_TextTrackButton3['default'].registerComponent('CaptionsButton', CaptionsButton);
exports['default'] = CaptionsButton;
module.exports = exports['default'];

},{"./caption-settings-menu-item.js":41,"./text-track-button.js":47}],43:[function(require,module,exports){
'use strict';

var _interopRequireWildcard = function (obj) { return obj && obj.__esModule ? obj : { 'default': obj }; };

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } };

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if (descriptor.value) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(object, property, receiver) { var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _inherits = function (subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; };

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _TextTrackButton2 = require('./text-track-button.js');

var _TextTrackButton3 = _interopRequireWildcard(_TextTrackButton2);

var _TextTrackMenuItem = require('./text-track-menu-item.js');

var _TextTrackMenuItem2 = _interopRequireWildcard(_TextTrackMenuItem);

var _ChaptersTrackMenuItem = require('./chapters-track-menu-item.js');

var _ChaptersTrackMenuItem2 = _interopRequireWildcard(_ChaptersTrackMenuItem);

var _Menu = require('../../menu/menu.js');

var _Menu2 = _interopRequireWildcard(_Menu);

var _import = require('../../lib.js');

var Lib = _interopRequireWildcard(_import);

var _window = require('global/window');

var _window2 = _interopRequireWildcard(_window);

// Chapters act much differently than other text tracks
// Cues are navigation vs. other tracks of alternative languages
/**
 * The button component for toggling and selecting chapters
 *
 * @constructor
 */

var ChaptersButton = (function (_TextTrackButton) {
  function ChaptersButton(player, options, ready) {
    _classCallCheck(this, ChaptersButton);

    _get(Object.getPrototypeOf(ChaptersButton.prototype), 'constructor', this).call(this, player, options, ready);
    this.el_.setAttribute('aria-label', 'Chapters Menu');
  }

  _inherits(ChaptersButton, _TextTrackButton);

  _createClass(ChaptersButton, [{
    key: 'createItems',

    // Create a menu item for each text track
    value: function createItems() {
      var items = [];

      var tracks = this.player_.textTracks();

      if (!tracks) {
        return items;
      }

      for (var i = 0; i < tracks.length; i++) {
        var track = tracks[i];
        if (track.kind === this.kind_) {
          items.push(new _TextTrackMenuItem2['default'](this.player_, {
            track: track
          }));
        }
      }

      return items;
    }
  }, {
    key: 'createMenu',
    value: function createMenu() {
      var tracks = this.player_.textTracks() || [];
      var chaptersTrack = undefined;
      var items = this.items = [];

      for (var i = 0, l = tracks.length; i < l; i++) {
        var track = tracks[i];
        if (track.kind == this.kind_) {
          if (!track.cues) {
            track.mode = 'hidden';
            /* jshint loopfunc:true */
            // TODO see if we can figure out a better way of doing this https://github.com/videojs/video.js/issues/1864
            _window2['default'].setTimeout(Lib.bind(this, function () {
              this.createMenu();
            }), 100);
            /* jshint loopfunc:false */
          } else {
            chaptersTrack = track;
            break;
          }
        }
      }

      var menu = this.menu;
      if (menu === undefined) {
        menu = new _Menu2['default'](this.player_);
        menu.contentEl().appendChild(Lib.createEl('li', {
          className: 'vjs-menu-title',
          innerHTML: Lib.capitalize(this.kind_),
          tabindex: -1
        }));
      }

      if (chaptersTrack) {
        var cues = chaptersTrack.cues,
            cue = undefined;

        for (var i = 0, l = cues.length; i < l; i++) {
          cue = cues[i];

          var mi = new _ChaptersTrackMenuItem2['default'](this.player_, {
            track: chaptersTrack,
            cue: cue
          });

          items.push(mi);

          menu.addChild(mi);
        }
        this.addChild(menu);
      }

      if (this.items.length > 0) {
        this.show();
      }

      return menu;
    }
  }]);

  return ChaptersButton;
})(_TextTrackButton3['default']);

ChaptersButton.prototype.kind_ = 'chapters';
ChaptersButton.prototype.buttonText = 'Chapters';
ChaptersButton.prototype.className = 'vjs-chapters-button';

_TextTrackButton3['default'].registerComponent('ChaptersButton', ChaptersButton);
exports['default'] = ChaptersButton;
module.exports = exports['default'];

},{"../../lib.js":64,"../../menu/menu.js":69,"./chapters-track-menu-item.js":44,"./text-track-button.js":47,"./text-track-menu-item.js":48,"global/window":2}],44:[function(require,module,exports){
'use strict';

var _interopRequireWildcard = function (obj) { return obj && obj.__esModule ? obj : { 'default': obj }; };

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } };

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if (descriptor.value) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(object, property, receiver) { var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _inherits = function (subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; };

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _MenuItem2 = require('../../menu/menu-item.js');

var _MenuItem3 = _interopRequireWildcard(_MenuItem2);

var _import = require('../../lib.js');

var Lib = _interopRequireWildcard(_import);

/**
 * @constructor
 */

var ChaptersTrackMenuItem = (function (_MenuItem) {
  function ChaptersTrackMenuItem(player, options) {
    _classCallCheck(this, ChaptersTrackMenuItem);

    var track = options.track;
    var cue = options.cue;
    var currentTime = player.currentTime();

    // Modify options for parent MenuItem class's init.
    options.label = cue.text;
    options.selected = cue.startTime <= currentTime && currentTime < cue.endTime;
    _get(Object.getPrototypeOf(ChaptersTrackMenuItem.prototype), 'constructor', this).call(this, player, options);

    this.track = track;
    this.cue = cue;
    track.addEventListener('cuechange', Lib.bind(this, this.update));
  }

  _inherits(ChaptersTrackMenuItem, _MenuItem);

  _createClass(ChaptersTrackMenuItem, [{
    key: 'handleClick',
    value: function handleClick() {
      _get(Object.getPrototypeOf(ChaptersTrackMenuItem.prototype), 'handleClick', this).call(this);
      this.player_.currentTime(this.cue.startTime);
      this.update(this.cue.startTime);
    }
  }, {
    key: 'update',
    value: function update() {
      var cue = this.cue;
      var currentTime = this.player_.currentTime();

      // vjs.log(currentTime, cue.startTime);
      this.selected(cue.startTime <= currentTime && currentTime < cue.endTime);
    }
  }]);

  return ChaptersTrackMenuItem;
})(_MenuItem3['default']);

_MenuItem3['default'].registerComponent('ChaptersTrackMenuItem', ChaptersTrackMenuItem);
exports['default'] = ChaptersTrackMenuItem;
module.exports = exports['default'];

},{"../../lib.js":64,"../../menu/menu-item.js":68}],45:[function(require,module,exports){
'use strict';

var _interopRequireWildcard = function (obj) { return obj && obj.__esModule ? obj : { 'default': obj }; };

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } };

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if (descriptor.value) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(object, property, receiver) { var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _inherits = function (subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; };

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _TextTrackMenuItem2 = require('./text-track-menu-item.js');

var _TextTrackMenuItem3 = _interopRequireWildcard(_TextTrackMenuItem2);

/**
 * A special menu item for turning of a specific type of text track
 *
 * @constructor
 */

var OffTextTrackMenuItem = (function (_TextTrackMenuItem) {
  function OffTextTrackMenuItem(player, options) {
    _classCallCheck(this, OffTextTrackMenuItem);

    // Create pseudo track info
    // Requires options['kind']
    options.track = {
      kind: options.kind,
      player: player,
      label: options.kind + ' off',
      'default': false,
      mode: 'disabled'
    };

    _get(Object.getPrototypeOf(OffTextTrackMenuItem.prototype), 'constructor', this).call(this, player, options);
    this.selected(true);
  }

  _inherits(OffTextTrackMenuItem, _TextTrackMenuItem);

  _createClass(OffTextTrackMenuItem, [{
    key: 'handleTracksChange',
    value: function handleTracksChange(event) {
      var tracks = this.player().textTracks();
      var selected = true;

      for (var i = 0, l = tracks.length; i < l; i++) {
        var track = tracks[i];
        if (track.kind === this.track.kind && track.mode === 'showing') {
          selected = false;
          break;
        }
      }

      this.selected(selected);
    }
  }]);

  return OffTextTrackMenuItem;
})(_TextTrackMenuItem3['default']);

_TextTrackMenuItem3['default'].registerComponent('OffTextTrackMenuItem', OffTextTrackMenuItem);
exports['default'] = OffTextTrackMenuItem;
module.exports = exports['default'];

},{"./text-track-menu-item.js":48}],46:[function(require,module,exports){
'use strict';

var _interopRequireWildcard = function (obj) { return obj && obj.__esModule ? obj : { 'default': obj }; };

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } };

var _get = function get(object, property, receiver) { var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _inherits = function (subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; };

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _TextTrackButton2 = require('./text-track-button.js');

var _TextTrackButton3 = _interopRequireWildcard(_TextTrackButton2);

/**
 * The button component for toggling and selecting subtitles
 *
 * @constructor
 */

var SubtitlesButton = (function (_TextTrackButton) {
  function SubtitlesButton(player, options, ready) {
    _classCallCheck(this, SubtitlesButton);

    _get(Object.getPrototypeOf(SubtitlesButton.prototype), 'constructor', this).call(this, player, options, ready);
    this.el_.setAttribute('aria-label', 'Subtitles Menu');
  }

  _inherits(SubtitlesButton, _TextTrackButton);

  return SubtitlesButton;
})(_TextTrackButton3['default']);

SubtitlesButton.prototype.kind_ = 'subtitles';
SubtitlesButton.prototype.buttonText = 'Subtitles';
SubtitlesButton.prototype.className = 'vjs-subtitles-button';

_TextTrackButton3['default'].registerComponent('SubtitlesButton', SubtitlesButton);
exports['default'] = SubtitlesButton;
module.exports = exports['default'];

},{"./text-track-button.js":47}],47:[function(require,module,exports){
'use strict';

var _interopRequireWildcard = function (obj) { return obj && obj.__esModule ? obj : { 'default': obj }; };

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } };

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if (descriptor.value) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(object, property, receiver) { var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _inherits = function (subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; };

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _MenuButton2 = require('../../menu/menu-button.js');

var _MenuButton3 = _interopRequireWildcard(_MenuButton2);

var _import = require('../../lib.js');

var Lib = _interopRequireWildcard(_import);

var _TextTrackMenuItem = require('./text-track-menu-item.js');

var _TextTrackMenuItem2 = _interopRequireWildcard(_TextTrackMenuItem);

var _OffTextTrackMenuItem = require('./off-text-track-menu-item.js');

var _OffTextTrackMenuItem2 = _interopRequireWildcard(_OffTextTrackMenuItem);

/**
 * The base class for buttons that toggle specific text track types (e.g. subtitles)
 *
 * @constructor
 */

var TextTrackButton = (function (_MenuButton) {
  function TextTrackButton(player, options) {
    _classCallCheck(this, TextTrackButton);

    _get(Object.getPrototypeOf(TextTrackButton.prototype), 'constructor', this).call(this, player, options);

    var tracks = this.player_.textTracks();

    if (this.items.length <= 1) {
      this.hide();
    }

    if (!tracks) {
      return;
    }

    var updateHandler = Lib.bind(this, this.update);
    tracks.addEventListener('removetrack', updateHandler);
    tracks.addEventListener('addtrack', updateHandler);

    this.player_.on('dispose', function () {
      tracks.removeEventListener('removetrack', updateHandler);
      tracks.removeEventListener('addtrack', updateHandler);
    });
  }

  _inherits(TextTrackButton, _MenuButton);

  _createClass(TextTrackButton, [{
    key: 'createItems',

    // Create a menu item for each text track
    value: function createItems() {
      var items = arguments[0] === undefined ? [] : arguments[0];

      // Add an OFF menu item to turn all tracks off
      items.push(new _OffTextTrackMenuItem2['default'](this.player_, { kind: this.kind_ }));

      var tracks = this.player_.textTracks();

      if (!tracks) {
        return items;
      }

      for (var i = 0; i < tracks.length; i++) {
        var track = tracks[i];

        // only add tracks that are of the appropriate kind and have a label
        if (track.kind === this.kind_) {
          items.push(new _TextTrackMenuItem2['default'](this.player_, {
            track: track
          }));
        }
      }

      return items;
    }
  }]);

  return TextTrackButton;
})(_MenuButton3['default']);

_MenuButton3['default'].registerComponent('TextTrackButton', TextTrackButton);
exports['default'] = TextTrackButton;
module.exports = exports['default'];

},{"../../lib.js":64,"../../menu/menu-button.js":67,"./off-text-track-menu-item.js":45,"./text-track-menu-item.js":48}],48:[function(require,module,exports){
'use strict';

var _interopRequireWildcard = function (obj) { return obj && obj.__esModule ? obj : { 'default': obj }; };

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } };

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if (descriptor.value) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(object, property, receiver) { var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _inherits = function (subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; };

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _MenuItem2 = require('../../menu/menu-item.js');

var _MenuItem3 = _interopRequireWildcard(_MenuItem2);

var _import = require('../../lib.js');

var Lib = _interopRequireWildcard(_import);

var _window = require('global/window');

var _window2 = _interopRequireWildcard(_window);

var _document = require('global/document');

var _document2 = _interopRequireWildcard(_document);

/**
 * The specific menu item type for selecting a language within a text track kind
 *
 * @constructor
 */

var TextTrackMenuItem = (function (_MenuItem) {
  function TextTrackMenuItem(player, options) {
    var _this = this;

    _classCallCheck(this, TextTrackMenuItem);

    var track = options.track;
    var tracks = player.textTracks();

    // Modify options for parent MenuItem class's init.
    options.label = track.label || track.language || 'Unknown';
    options.selected = track['default'] || track.mode === 'showing';
    _get(Object.getPrototypeOf(TextTrackMenuItem.prototype), 'constructor', this).call(this, player, options);

    this.track = track;

    if (tracks) {
      (function () {
        var changeHandler = Lib.bind(_this, _this.handleTracksChange);

        tracks.addEventListener('change', changeHandler);
        _this.on('dispose', function () {
          tracks.removeEventListener('change', changeHandler);
        });
      })();
    }

    // iOS7 doesn't dispatch change events to TextTrackLists when an
    // associated track's mode changes. Without something like
    // Object.observe() (also not present on iOS7), it's not
    // possible to detect changes to the mode attribute and polyfill
    // the change event. As a poor substitute, we manually dispatch
    // change events whenever the controls modify the mode.
    if (tracks && tracks.onchange === undefined) {
      (function () {
        var event = undefined;

        _this.on(['tap', 'click'], function () {
          if (typeof _window2['default'].Event !== 'object') {
            // Android 2.3 throws an Illegal Constructor error for window.Event
            try {
              event = new _window2['default'].Event('change');
            } catch (err) {}
          }

          if (!event) {
            event = _document2['default'].createEvent('Event');
            event.initEvent('change', true, true);
          }

          tracks.dispatchEvent(event);
        });
      })();
    }
  }

  _inherits(TextTrackMenuItem, _MenuItem);

  _createClass(TextTrackMenuItem, [{
    key: 'handleClick',
    value: function handleClick(event) {
      var kind = this.track.kind;
      var tracks = this.player_.textTracks();

      _get(Object.getPrototypeOf(TextTrackMenuItem.prototype), 'handleClick', this).call(this, event);

      if (!tracks) {
        return;
      }for (var i = 0; i < tracks.length; i++) {
        var track = tracks[i];

        if (track.kind !== kind) {
          continue;
        }

        if (track === this.track) {
          track.mode = 'showing';
        } else {
          track.mode = 'disabled';
        }
      }
    }
  }, {
    key: 'handleTracksChange',
    value: function handleTracksChange(event) {
      this.selected(this.track.mode === 'showing');
    }
  }]);

  return TextTrackMenuItem;
})(_MenuItem3['default']);

_MenuItem3['default'].registerComponent('TextTrackMenuItem', TextTrackMenuItem);
exports['default'] = TextTrackMenuItem;
module.exports = exports['default'];

},{"../../lib.js":64,"../../menu/menu-item.js":68,"global/document":1,"global/window":2}],49:[function(require,module,exports){
'use strict';

var _interopRequireWildcard = function (obj) { return obj && obj.__esModule ? obj : { 'default': obj }; };

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } };

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if (descriptor.value) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(object, property, receiver) { var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _inherits = function (subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; };

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _Component2 = require('../../component.js');

var _Component3 = _interopRequireWildcard(_Component2);

var _import = require('../../lib.js');

var Lib = _interopRequireWildcard(_import);

/**
 * Displays the current time
 * @param {Player|Object} player
 * @param {Object=} options
 * @constructor
 */

var CurrentTimeDisplay = (function (_Component) {
  function CurrentTimeDisplay(player, options) {
    _classCallCheck(this, CurrentTimeDisplay);

    _get(Object.getPrototypeOf(CurrentTimeDisplay.prototype), 'constructor', this).call(this, player, options);

    this.on(player, 'timeupdate', this.updateContent);
  }

  _inherits(CurrentTimeDisplay, _Component);

  _createClass(CurrentTimeDisplay, [{
    key: 'createEl',
    value: function createEl() {
      var el = _get(Object.getPrototypeOf(CurrentTimeDisplay.prototype), 'createEl', this).call(this, 'div', {
        className: 'vjs-current-time vjs-time-control vjs-control'
      });

      this.contentEl_ = Lib.createEl('div', {
        className: 'vjs-current-time-display',
        innerHTML: '<span class="vjs-control-text">Current Time </span>' + '0:00', // label the current time for screen reader users
        'aria-live': 'off' // tell screen readers not to automatically read the time as it changes
      });

      el.appendChild(this.contentEl_);
      return el;
    }
  }, {
    key: 'updateContent',
    value: function updateContent() {
      // Allows for smooth scrubbing, when player can't keep up.
      var time = this.player_.scrubbing ? this.player_.getCache().currentTime : this.player_.currentTime();
      var localizedText = this.localize('Current Time');
      var formattedTime = Lib.formatTime(time, this.player_.duration());
      this.contentEl_.innerHTML = '<span class="vjs-control-text">' + localizedText + '</span> ' + formattedTime;
    }
  }]);

  return CurrentTimeDisplay;
})(_Component3['default']);

_Component3['default'].registerComponent('CurrentTimeDisplay', CurrentTimeDisplay);
exports['default'] = CurrentTimeDisplay;
module.exports = exports['default'];

},{"../../component.js":26,"../../lib.js":64}],50:[function(require,module,exports){
'use strict';

var _interopRequireWildcard = function (obj) { return obj && obj.__esModule ? obj : { 'default': obj }; };

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } };

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if (descriptor.value) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(object, property, receiver) { var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _inherits = function (subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; };

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _Component2 = require('../../component.js');

var _Component3 = _interopRequireWildcard(_Component2);

var _import = require('../../lib.js');

var Lib = _interopRequireWildcard(_import);

/**
 * Displays the duration
 * @param {Player|Object} player
 * @param {Object=} options
 * @constructor
 */

var DurationDisplay = (function (_Component) {
  function DurationDisplay(player, options) {
    _classCallCheck(this, DurationDisplay);

    _get(Object.getPrototypeOf(DurationDisplay.prototype), 'constructor', this).call(this, player, options);

    // this might need to be changed to 'durationchange' instead of 'timeupdate' eventually,
    // however the durationchange event fires before this.player_.duration() is set,
    // so the value cannot be written out using this method.
    // Once the order of durationchange and this.player_.duration() being set is figured out,
    // this can be updated.
    this.on(player, 'timeupdate', this.updateContent);
  }

  _inherits(DurationDisplay, _Component);

  _createClass(DurationDisplay, [{
    key: 'createEl',
    value: function createEl() {
      var el = _get(Object.getPrototypeOf(DurationDisplay.prototype), 'createEl', this).call(this, 'div', {
        className: 'vjs-duration vjs-time-control vjs-control'
      });

      this.contentEl_ = Lib.createEl('div', {
        className: 'vjs-duration-display',
        innerHTML: '<span class="vjs-control-text">' + this.localize('Duration Time') + '</span> 0:00', // label the duration time for screen reader users
        'aria-live': 'off' // tell screen readers not to automatically read the time as it changes
      });

      el.appendChild(this.contentEl_);
      return el;
    }
  }, {
    key: 'updateContent',
    value: function updateContent() {
      var duration = this.player_.duration();
      if (duration) {
        var localizedText = this.localize('Duration Time');
        var formattedTime = Lib.formatTime(duration);
        this.contentEl_.innerHTML = '<span class="vjs-control-text">' + localizedText + '</span> ' + formattedTime; // label the duration time for screen reader users
      }
    }
  }]);

  return DurationDisplay;
})(_Component3['default']);

_Component3['default'].registerComponent('DurationDisplay', DurationDisplay);
exports['default'] = DurationDisplay;
module.exports = exports['default'];

},{"../../component.js":26,"../../lib.js":64}],51:[function(require,module,exports){
'use strict';

var _interopRequireWildcard = function (obj) { return obj && obj.__esModule ? obj : { 'default': obj }; };

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } };

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if (descriptor.value) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(object, property, receiver) { var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _inherits = function (subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; };

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _Component2 = require('../../component.js');

var _Component3 = _interopRequireWildcard(_Component2);

var _import = require('../../lib');

var Lib = _interopRequireWildcard(_import);

/**
 * Displays the time left in the video
 * @param {Player|Object} player
 * @param {Object=} options
 * @constructor
 */

var RemainingTimeDisplay = (function (_Component) {
  function RemainingTimeDisplay(player, options) {
    _classCallCheck(this, RemainingTimeDisplay);

    _get(Object.getPrototypeOf(RemainingTimeDisplay.prototype), 'constructor', this).call(this, player, options);

    this.on(player, 'timeupdate', this.updateContent);
  }

  _inherits(RemainingTimeDisplay, _Component);

  _createClass(RemainingTimeDisplay, [{
    key: 'createEl',
    value: function createEl() {
      var el = _get(Object.getPrototypeOf(RemainingTimeDisplay.prototype), 'createEl', this).call(this, 'div', {
        className: 'vjs-remaining-time vjs-time-control vjs-control'
      });

      this.contentEl_ = Lib.createEl('div', {
        className: 'vjs-remaining-time-display',
        innerHTML: '<span class="vjs-control-text">' + this.localize('Remaining Time') + '</span> -0:00', // label the remaining time for screen reader users
        'aria-live': 'off' // tell screen readers not to automatically read the time as it changes
      });

      el.appendChild(this.contentEl_);
      return el;
    }
  }, {
    key: 'updateContent',
    value: function updateContent() {
      if (this.player_.duration()) {
        var localizedText = this.localize('Remaining Time');
        var formattedTime = Lib.formatTime(this.player_.remainingTime());
        this.contentEl_.innerHTML = '<span class="vjs-control-text">' + localizedText + '</span> -' + formattedTime;
      }

      // Allows for smooth scrubbing, when player can't keep up.
      // var time = (this.player_.scrubbing) ? this.player_.getCache().currentTime : this.player_.currentTime();
      // this.contentEl_.innerHTML = vjs.formatTime(time, this.player_.duration());
    }
  }]);

  return RemainingTimeDisplay;
})(_Component3['default']);

_Component3['default'].registerComponent('RemainingTimeDisplay', RemainingTimeDisplay);
exports['default'] = RemainingTimeDisplay;
module.exports = exports['default'];

},{"../../component.js":26,"../../lib":64}],52:[function(require,module,exports){
'use strict';

var _interopRequireWildcard = function (obj) { return obj && obj.__esModule ? obj : { 'default': obj }; };

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } };

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if (descriptor.value) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(object, property, receiver) { var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _inherits = function (subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; };

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _Component2 = require('../../component.js');

var _Component3 = _interopRequireWildcard(_Component2);

/**
 * The separator between the current time and duration
 *
 * Can be hidden if it's not needed in the design.
 *
 * @param {Player|Object} player
 * @param {Object=} options
 * @constructor
 */

var TimeDivider = (function (_Component) {
  function TimeDivider() {
    _classCallCheck(this, TimeDivider);

    if (_Component != null) {
      _Component.apply(this, arguments);
    }
  }

  _inherits(TimeDivider, _Component);

  _createClass(TimeDivider, [{
    key: 'createEl',
    value: function createEl() {
      return _get(Object.getPrototypeOf(TimeDivider.prototype), 'createEl', this).call(this, 'div', {
        className: 'vjs-time-control vjs-time-divider',
        innerHTML: '<div><span>/</span></div>'
      });
    }
  }]);

  return TimeDivider;
})(_Component3['default']);

_Component3['default'].registerComponent('TimeDivider', TimeDivider);
exports['default'] = TimeDivider;
module.exports = exports['default'];

},{"../../component.js":26}],53:[function(require,module,exports){
'use strict';

var _interopRequireWildcard = function (obj) { return obj && obj.__esModule ? obj : { 'default': obj }; };

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } };

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if (descriptor.value) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(object, property, receiver) { var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _inherits = function (subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; };

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _Slider2 = require('../../slider/slider.js');

var _Slider3 = _interopRequireWildcard(_Slider2);

var _import = require('../../lib.js');

var Lib = _interopRequireWildcard(_import);

// Required children

var _VolumeHandle = require('./volume-handle.js');

var _VolumeHandle2 = _interopRequireWildcard(_VolumeHandle);

var _VolumeLevel = require('./volume-level.js');

var _VolumeLevel2 = _interopRequireWildcard(_VolumeLevel);

/**
 * The bar that contains the volume level and can be clicked on to adjust the level
 *
 * @param {Player|Object} player
 * @param {Object=} options
 * @constructor
 */

var VolumeBar = (function (_Slider) {
  function VolumeBar(player, options) {
    _classCallCheck(this, VolumeBar);

    _get(Object.getPrototypeOf(VolumeBar.prototype), 'constructor', this).call(this, player, options);
    this.on(player, 'volumechange', this.updateARIAAttributes);
    player.ready(Lib.bind(this, this.updateARIAAttributes));
  }

  _inherits(VolumeBar, _Slider);

  _createClass(VolumeBar, [{
    key: 'createEl',
    value: function createEl() {
      return _get(Object.getPrototypeOf(VolumeBar.prototype), 'createEl', this).call(this, 'div', {
        className: 'vjs-volume-bar',
        'aria-label': 'volume level'
      });
    }
  }, {
    key: 'handleMouseMove',
    value: function handleMouseMove(event) {
      if (this.player_.muted()) {
        this.player_.muted(false);
      }

      this.player_.volume(this.calculateDistance(event));
    }
  }, {
    key: 'getPercent',
    value: function getPercent() {
      if (this.player_.muted()) {
        return 0;
      } else {
        return this.player_.volume();
      }
    }
  }, {
    key: 'stepForward',
    value: function stepForward() {
      this.player_.volume(this.player_.volume() + 0.1);
    }
  }, {
    key: 'stepBack',
    value: function stepBack() {
      this.player_.volume(this.player_.volume() - 0.1);
    }
  }, {
    key: 'updateARIAAttributes',
    value: function updateARIAAttributes() {
      // Current value of volume bar as a percentage
      this.el_.setAttribute('aria-valuenow', Lib.round(this.player_.volume() * 100, 2));
      this.el_.setAttribute('aria-valuetext', Lib.round(this.player_.volume() * 100, 2) + '%');
    }
  }]);

  return VolumeBar;
})(_Slider3['default']);

VolumeBar.prototype.options_ = {
  children: {
    volumeLevel: {},
    volumeHandle: {}
  },
  barName: 'volumeLevel',
  handleName: 'volumeHandle'
};

VolumeBar.prototype.playerEvent = 'volumechange';

_Slider3['default'].registerComponent('VolumeBar', VolumeBar);
exports['default'] = VolumeBar;
module.exports = exports['default'];

},{"../../lib.js":64,"../../slider/slider.js":75,"./volume-handle.js":55,"./volume-level.js":56}],54:[function(require,module,exports){
'use strict';

var _interopRequireWildcard = function (obj) { return obj && obj.__esModule ? obj : { 'default': obj }; };

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } };

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if (descriptor.value) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(object, property, receiver) { var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _inherits = function (subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; };

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _Component2 = require('../../component.js');

var _Component3 = _interopRequireWildcard(_Component2);

var _import = require('../../lib.js');

var Lib = _interopRequireWildcard(_import);

// Required children

var _VolumeBar = require('./volume-bar.js');

var _VolumeBar2 = _interopRequireWildcard(_VolumeBar);

/**
 * The component for controlling the volume level
 *
 * @param {Player|Object} player
 * @param {Object=} options
 * @constructor
 */

var VolumeControl = (function (_Component) {
  function VolumeControl(player, options) {
    _classCallCheck(this, VolumeControl);

    _get(Object.getPrototypeOf(VolumeControl.prototype), 'constructor', this).call(this, player, options);

    // hide volume controls when they're not supported by the current tech
    if (player.tech && player.tech.featuresVolumeControl === false) {
      this.addClass('vjs-hidden');
    }
    this.on(player, 'loadstart', function () {
      if (player.tech.featuresVolumeControl === false) {
        this.addClass('vjs-hidden');
      } else {
        this.removeClass('vjs-hidden');
      }
    });
  }

  _inherits(VolumeControl, _Component);

  _createClass(VolumeControl, [{
    key: 'createEl',
    value: function createEl() {
      return _get(Object.getPrototypeOf(VolumeControl.prototype), 'createEl', this).call(this, 'div', {
        className: 'vjs-volume-control vjs-control'
      });
    }
  }]);

  return VolumeControl;
})(_Component3['default']);

VolumeControl.prototype.options_ = {
  children: {
    volumeBar: {}
  }
};

_Component3['default'].registerComponent('VolumeControl', VolumeControl);
exports['default'] = VolumeControl;
module.exports = exports['default'];

},{"../../component.js":26,"../../lib.js":64,"./volume-bar.js":53}],55:[function(require,module,exports){
'use strict';

var _interopRequireWildcard = function (obj) { return obj && obj.__esModule ? obj : { 'default': obj }; };

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } };

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if (descriptor.value) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(object, property, receiver) { var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _inherits = function (subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; };

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _SliderHandle2 = require('../../slider/slider-handle.js');

var _SliderHandle3 = _interopRequireWildcard(_SliderHandle2);

/**
 * The volume handle can be dragged to adjust the volume level
 *
 * @param {Player|Object} player
 * @param {Object=} options
 * @constructor
 */

var VolumeHandle = (function (_SliderHandle) {
  function VolumeHandle() {
    _classCallCheck(this, VolumeHandle);

    if (_SliderHandle != null) {
      _SliderHandle.apply(this, arguments);
    }
  }

  _inherits(VolumeHandle, _SliderHandle);

  _createClass(VolumeHandle, [{
    key: 'createEl',

    /** @inheritDoc */
    value: function createEl() {
      return _get(Object.getPrototypeOf(VolumeHandle.prototype), 'createEl', this).call(this, 'div', {
        className: 'vjs-volume-handle'
      });
    }
  }]);

  return VolumeHandle;
})(_SliderHandle3['default']);

VolumeHandle.prototype.defaultValue = '00:00';

_SliderHandle3['default'].registerComponent('VolumeHandle', VolumeHandle);
exports['default'] = VolumeHandle;
module.exports = exports['default'];

},{"../../slider/slider-handle.js":74}],56:[function(require,module,exports){
'use strict';

var _interopRequireWildcard = function (obj) { return obj && obj.__esModule ? obj : { 'default': obj }; };

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } };

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if (descriptor.value) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(object, property, receiver) { var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _inherits = function (subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; };

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _Component2 = require('../../component.js');

var _Component3 = _interopRequireWildcard(_Component2);

/**
 * Shows volume level
 *
 * @param {Player|Object} player
 * @param {Object=} options
 * @constructor
 */

var VolumeLevel = (function (_Component) {
  function VolumeLevel() {
    _classCallCheck(this, VolumeLevel);

    if (_Component != null) {
      _Component.apply(this, arguments);
    }
  }

  _inherits(VolumeLevel, _Component);

  _createClass(VolumeLevel, [{
    key: 'createEl',
    value: function createEl() {
      return _get(Object.getPrototypeOf(VolumeLevel.prototype), 'createEl', this).call(this, 'div', {
        className: 'vjs-volume-level',
        innerHTML: '<span class="vjs-control-text"></span>'
      });
    }
  }]);

  return VolumeLevel;
})(_Component3['default']);

_Component3['default'].registerComponent('VolumeLevel', VolumeLevel);
exports['default'] = VolumeLevel;
module.exports = exports['default'];

},{"../../component.js":26}],57:[function(require,module,exports){
'use strict';

var _interopRequireWildcard = function (obj) { return obj && obj.__esModule ? obj : { 'default': obj }; };

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } };

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if (descriptor.value) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(object, property, receiver) { var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _inherits = function (subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; };

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _Button = require('../button.js');

var _Button2 = _interopRequireWildcard(_Button);

var _Menu = require('../menu/menu.js');

var _Menu2 = _interopRequireWildcard(_Menu);

var _MenuButton2 = require('../menu/menu-button.js');

var _MenuButton3 = _interopRequireWildcard(_MenuButton2);

var _MuteToggle = require('./mute-toggle.js');

var _MuteToggle2 = _interopRequireWildcard(_MuteToggle);

var _import = require('../lib.js');

var Lib = _interopRequireWildcard(_import);

var _VolumeBar = require('./volume-control/volume-bar.js');

var _VolumeBar2 = _interopRequireWildcard(_VolumeBar);

/**
 * Menu button with a popup for showing the volume slider.
 * @constructor
 */

var VolumeMenuButton = (function (_MenuButton) {
  function VolumeMenuButton(player, options) {
    _classCallCheck(this, VolumeMenuButton);

    _get(Object.getPrototypeOf(VolumeMenuButton.prototype), 'constructor', this).call(this, player, options);

    // Same listeners as MuteToggle
    this.on(player, 'volumechange', this.volumeUpdate);

    // hide mute toggle if the current tech doesn't support volume control
    if (player.tech && player.tech.featuresVolumeControl === false) {
      this.addClass('vjs-hidden');
    }
    this.on(player, 'loadstart', function () {
      if (player.tech.featuresVolumeControl === false) {
        this.addClass('vjs-hidden');
      } else {
        this.removeClass('vjs-hidden');
      }
    });
    this.addClass('vjs-menu-button');
  }

  _inherits(VolumeMenuButton, _MenuButton);

  _createClass(VolumeMenuButton, [{
    key: 'createMenu',
    value: function createMenu() {
      var menu = new _Menu2['default'](this.player_, {
        contentElType: 'div'
      });

      // The volumeBar is vertical by default in the base theme when used with a VolumeMenuButton
      var options = this.options_.volumeBar || {};
      options.vertical = options.vertical || true;

      var vc = new _VolumeBar2['default'](this.player_, options);

      vc.on('focus', function () {
        menu.lockShowing();
      });
      vc.on('blur', function () {
        menu.unlockShowing();
      });
      menu.addChild(vc);
      return menu;
    }
  }, {
    key: 'handleClick',
    value: function handleClick() {
      _MuteToggle2['default'].prototype.handleClick.call(this);
      _get(Object.getPrototypeOf(VolumeMenuButton.prototype), 'handleClick', this).call(this);
    }
  }, {
    key: 'createEl',
    value: function createEl() {
      return _get(Object.getPrototypeOf(VolumeMenuButton.prototype), 'createEl', this).call(this, 'div', {
        className: 'vjs-volume-menu-button vjs-menu-button vjs-control vjs-button',
        innerHTML: '<div><span class="vjs-control-text">' + this.localize('Mute') + '</span></div>'
      });
    }
  }]);

  return VolumeMenuButton;
})(_MenuButton3['default']);

VolumeMenuButton.prototype.volumeUpdate = _MuteToggle2['default'].prototype.update;

_Button2['default'].registerComponent('VolumeMenuButton', VolumeMenuButton);
exports['default'] = VolumeMenuButton;
module.exports = exports['default'];

},{"../button.js":25,"../lib.js":64,"../menu/menu-button.js":67,"../menu/menu.js":69,"./mute-toggle.js":30,"./volume-control/volume-bar.js":53}],58:[function(require,module,exports){
'use strict';

var _interopRequireWildcard = function (obj) { return obj && obj.__esModule ? obj : { 'default': obj }; };

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _import = require('./lib');

var Lib = _interopRequireWildcard(_import);

/**
 * Core Object/Class for objects that use inheritance + constructors
 *
 * To create a class that can be subclassed itself, extend the CoreObject class.
 *
 *     var Animal = CoreObject.extend();
 *     var Horse = Animal.extend();
 *
 * The constructor can be defined through the init property of an object argument.
 *
 *     var Animal = CoreObject.extend({
 *       init: function(name, sound){
 *         this.name = name;
 *       }
 *     });
 *
 * Other methods and properties can be added the same way, or directly to the
 * prototype.
 *
 *    var Animal = CoreObject.extend({
 *       init: function(name){
 *         this.name = name;
 *       },
 *       getName: function(){
 *         return this.name;
 *       },
 *       sound: '...'
 *    });
 *
 *    Animal.prototype.makeSound = function(){
 *      alert(this.sound);
 *    };
 *
 * To create an instance of a class, use the create method.
 *
 *    var fluffy = Animal.create('Fluffy');
 *    fluffy.getName(); // -> Fluffy
 *
 * Methods and properties can be overridden in subclasses.
 *
 *     var Horse = Animal.extend({
 *       sound: 'Neighhhhh!'
 *     });
 *
 *     var horsey = Horse.create('Horsey');
 *     horsey.getName(); // -> Horsey
 *     horsey.makeSound(); // -> Alert: Neighhhhh!
 *
 * @class
 * @constructor
 */
var CoreObject = function CoreObject() {};
// Manually exporting vjs['CoreObject'] here for Closure Compiler
// because of the use of the extend/create class methods
// If we didn't do this, those functions would get flattened to something like
// `a = ...` and `this.prototype` would refer to the global object instead of
// CoreObject

/**
 * Create a new object that inherits from this Object
 *
 *     var Animal = CoreObject.extend();
 *     var Horse = Animal.extend();
 *
 * @param {Object} props Functions and properties to be applied to the
 *                       new object's prototype
 * @return {CoreObject} An object that inherits from CoreObject
 * @this {*}
 */
CoreObject.extend = function () {
  var props = arguments[0] === undefined ? {} : arguments[0];

  // Set up the constructor using the supplied init method
  // or using the init of the parent object
  // Make sure to check the unobfuscated version for external libs
  var init = props.init || props.init || this.prototype.init || this.prototype.init || function () {};
  // In Resig's simple class inheritance (previously used) the constructor
  //  is a function that calls `this.init.apply(arguments)`
  // However that would prevent us from using `ParentObject.call(this);`
  //  in a Child constructor because the `this` in `this.init`
  //  would still refer to the Child and cause an infinite loop.
  // We would instead have to do
  //    `ParentObject.prototype.init.apply(this, arguments);`
  //  Bleh. We're not creating a _super() function, so it's good to keep
  //  the parent constructor reference simple.
  var subObj = function subObj() {
    init.apply(this, arguments);
  };

  // Inherit from this object's prototype
  subObj.prototype = Lib.obj.create(this.prototype);
  // Reset the constructor property for subObj otherwise
  // instances of subObj would have the constructor of the parent Object
  subObj.prototype.constructor = subObj;

  // Make the class extendable
  subObj.extend = CoreObject.extend;
  // Make a function for creating instances
  subObj.create = CoreObject.create;

  // Extend subObj's prototype with functions and other properties from props
  for (var name in props) {
    if (props.hasOwnProperty(name)) {
      subObj.prototype[name] = props[name];
    }
  }

  return subObj;
};

/**
 * Create a new instance of this Object class
 *
 *     var myAnimal = Animal.create();
 *
 * @return {CoreObject} An instance of a CoreObject subclass
 * @this {*}
 */
CoreObject.create = function () {
  // Create a new object that inherits from this object's prototype
  var inst = Lib.obj.create(this.prototype);

  // Apply this constructor function to the new object
  this.apply(inst, arguments);

  // Return the new object
  return inst;
};

exports['default'] = CoreObject;
module.exports = exports['default'];

},{"./lib":64}],59:[function(require,module,exports){
'use strict';

var _interopRequireWildcard = function (obj) { return obj && obj.__esModule ? obj : { 'default': obj }; };

Object.defineProperty(exports, '__esModule', {
  value: true
});
/**
 * @fileoverview Main function src.
 */

var _Player = require('./player');

var _Player2 = _interopRequireWildcard(_Player);

var _Plugins = require('./plugins');

var _Plugins2 = _interopRequireWildcard(_Plugins);

var _Options = require('./options');

var _Options2 = _interopRequireWildcard(_Options);

var _import = require('./lib');

var Lib = _interopRequireWildcard(_import);

var _import2 = require('./util');

var VjsUtil = _interopRequireWildcard(_import2);

var _CoreObject = require('./core-object');

var _CoreObject2 = _interopRequireWildcard(_CoreObject);

var _document = require('global/document');

var _document2 = _interopRequireWildcard(_document);

/**
 * Doubles as the main function for users to create a player instance and also
 * the main library object.
 *
 * **ALIASES** videojs, _V_ (deprecated)
 *
 * The `vjs` function can be used to initialize or retrieve a player.
 *
 *     var myPlayer = vjs('my_video_id');
 *
 * @param  {String|Element} id      Video element or video element ID
 * @param  {Object=} options        Optional options object for config/settings
 * @param  {Function=} ready        Optional ready callback
 * @return {Player}             A player instance
 * @namespace
 */
var videojs = function videojs(id, options, ready) {
  var tag; // Element of ID

  // Allow for element or ID to be passed in
  // String ID
  if (typeof id === 'string') {

    // Adjust for jQuery ID syntax
    if (id.indexOf('#') === 0) {
      id = id.slice(1);
    }

    // If a player instance has already been created for this ID return it.
    if (_Player2['default'].players[id]) {

      // If options or ready funtion are passed, warn
      if (options) {
        Lib.log.warn('Player "' + id + '" is already initialised. Options will not be applied.');
      }

      if (ready) {
        _Player2['default'].players[id].ready(ready);
      }

      return _Player2['default'].players[id];

      // Otherwise get element for ID
    } else {
      tag = Lib.el(id);
    }

    // ID is a media element
  } else {
    tag = id;
  }

  // Check for a useable element
  if (!tag || !tag.nodeName) {
    // re: nodeName, could be a box div also
    throw new TypeError('The element or ID supplied is not valid. (videojs)'); // Returns
  }

  // Element may have a player attr referring to an already created player instance.
  // If not, set up a new player and return the instance.
  return tag.player || new _Player2['default'](tag, options, ready);
};

// Extended name, also available externally, window.videojs
// var videojs = window['videojs'] = vjs;

// CDN Version. Used to target right flash swf.
videojs.CDN_VERSION = '5.0';
videojs.ACCESS_PROTOCOL = 'https:' == _document2['default'].location.protocol ? 'https://' : 'http://';

/**
* Full player version
* @type {string}
*/
videojs.VERSION = '5.0.0-1';

// Set CDN Version of swf
// The added (+) blocks the replace from changing this _VERSION_NO_PATCH_ string
if (videojs.CDN_VERSION !== '__VERSION_' + 'NO_PATCH__') {
  _Options2['default'].flash.swf = '' + videojs.ACCESS_PROTOCOL + 'vjs.zencdn.net/' + videojs.CDN_VERSION + '/video-js.swf';
}

/**
 * Utility function for adding languages to the default options. Useful for
 * amending multiple language support at runtime.
 *
 * Example: videojs.addLanguage('es', {'Hello':'Hola'});
 *
 * @param  {String} code The language code or dictionary property
 * @param  {Object} data The data values to be translated
 * @return {Object} The resulting global languages dictionary object
 */
videojs.addLanguage = function (code, data) {
  if (_Options2['default'].languages[code] !== undefined) {
    _Options2['default'].languages[code] = VjsUtil.mergeOptions(_Options2['default'].languages[code], data);
  } else {
    _Options2['default'].languages[code] = data;
  }
  return _Options2['default'].languages;
};

/**
 * Custom Universal Module Definition (UMD)
 *
 * Video.js will never be a non-browser lib so we can simplify UMD a bunch and
 * still support requirejs and browserify. This also needs to be closure
 * compiler compatible, so string keys are used.
 */
if (typeof define === 'function' && define.amd) {
  define('videojs', [], function () {
    return videojs;
  });

  // checking that module is an object too because of umdjs/umd#35
} else if (typeof exports === 'object' && typeof module === 'object') {
  module.exports = videojs;
}

exports['default'] = videojs;
module.exports = exports['default'];

},{"./core-object":58,"./lib":64,"./options":70,"./player":71,"./plugins":72,"./util":87,"global/document":1}],60:[function(require,module,exports){
'use strict';

var _interopRequireWildcard = function (obj) { return obj && obj.__esModule ? obj : { 'default': obj }; };

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } };

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if (descriptor.value) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(object, property, receiver) { var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _inherits = function (subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; };

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _Component2 = require('./component');

var _Component3 = _interopRequireWildcard(_Component2);

var _import = require('./lib');

var Lib = _interopRequireWildcard(_import);

/**
 * Display that an error has occurred making the video unplayable
 * @param {Player|Object} player
 * @param {Object=} options
 * @constructor
 */

var ErrorDisplay = (function (_Component) {
  function ErrorDisplay(player, options) {
    _classCallCheck(this, ErrorDisplay);

    _get(Object.getPrototypeOf(ErrorDisplay.prototype), 'constructor', this).call(this, player, options);

    this.update();
    this.on(player, 'error', this.update);
  }

  _inherits(ErrorDisplay, _Component);

  _createClass(ErrorDisplay, [{
    key: 'createEl',
    value: function createEl() {
      var el = _get(Object.getPrototypeOf(ErrorDisplay.prototype), 'createEl', this).call(this, 'div', {
        className: 'vjs-error-display'
      });

      this.contentEl_ = Lib.createEl('div');
      el.appendChild(this.contentEl_);

      return el;
    }
  }, {
    key: 'update',
    value: function update() {
      if (this.player().error()) {
        this.contentEl_.innerHTML = this.localize(this.player().error().message);
      }
    }
  }]);

  return ErrorDisplay;
})(_Component3['default']);

_Component3['default'].registerComponent('ErrorDisplay', ErrorDisplay);
exports['default'] = ErrorDisplay;
module.exports = exports['default'];

},{"./component":26,"./lib":64}],61:[function(require,module,exports){
'use strict';

var _interopRequireWildcard = function (obj) { return obj && obj.__esModule ? obj : { 'default': obj }; };

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _import = require('./events');

var Events = _interopRequireWildcard(_import);

var _import2 = require('./lib');

var Lib = _interopRequireWildcard(_import2);

var EventEmitter = function EventEmitter() {};

EventEmitter.prototype.allowedEvents_ = {};

EventEmitter.prototype.on = function (type, fn) {
  // Remove the addEventListener alias before calling Events.on
  // so we don't get into an infinite type loop
  var ael = this.addEventListener;
  this.addEventListener = Function.prototype;
  Events.on(this, type, fn);
  this.addEventListener = ael;
};
EventEmitter.prototype.addEventListener = EventEmitter.prototype.on;

EventEmitter.prototype.off = function (type, fn) {
  Events.off(this, type, fn);
};
EventEmitter.prototype.removeEventListener = EventEmitter.prototype.off;

EventEmitter.prototype.one = function (type, fn) {
  Events.one(this, type, fn);
};

EventEmitter.prototype.trigger = function (event) {
  var type = event.type || event;

  if (typeof event === 'string') {
    event = {
      type: type
    };
  }
  event = Events.fixEvent(event);

  if (this.allowedEvents_[type] && this['on' + type]) {
    this['on' + type](event);
  }

  Events.trigger(this, event);
};
// The standard DOM EventTarget.dispatchEvent() is aliased to trigger()
EventEmitter.prototype.dispatchEvent = EventEmitter.prototype.trigger;

exports['default'] = EventEmitter;
module.exports = exports['default'];

},{"./events":62,"./lib":64}],62:[function(require,module,exports){
'use strict';

var _interopRequireWildcard = function (obj) { return obj && obj.__esModule ? obj : { 'default': obj }; };

Object.defineProperty(exports, '__esModule', {
  value: true
});
/**
 * @fileoverview Event System (John Resig - Secrets of a JS Ninja http://jsninja.com/)
 * (Original book version wasn't completely usable, so fixed some things and made Closure Compiler compatible)
 * This should work very similarly to jQuery's events, however it's based off the book version which isn't as
 * robust as jquery's, so there's probably some differences.
 */

var _import = require('./lib');

var Lib = _interopRequireWildcard(_import);

var _window = require('global/window');

var _window2 = _interopRequireWildcard(_window);

var _document = require('global/document');

var _document2 = _interopRequireWildcard(_document);

/**
 * Fix a native event to have standard property values
 * @param  {Object} event Event object to fix
 * @return {Object}
 * @private
 */
var fixEvent = function fixEvent(event) {

  function returnTrue() {
    return true;
  }
  function returnFalse() {
    return false;
  }

  // Test if fixing up is needed
  // Used to check if !event.stopPropagation instead of isPropagationStopped
  // But native events return true for stopPropagation, but don't have
  // other expected methods like isPropagationStopped. Seems to be a problem
  // with the Javascript Ninja code. So we're just overriding all events now.
  if (!event || !event.isPropagationStopped) {
    var old = event || _window2['default'].event;

    event = {};
    // Clone the old object so that we can modify the values event = {};
    // IE8 Doesn't like when you mess with native event properties
    // Firefox returns false for event.hasOwnProperty('type') and other props
    //  which makes copying more difficult.
    // TODO: Probably best to create a whitelist of event props
    for (var key in old) {
      // Safari 6.0.3 warns you if you try to copy deprecated layerX/Y
      // Chrome warns you if you try to copy deprecated keyboardEvent.keyLocation
      if (key !== 'layerX' && key !== 'layerY' && key !== 'keyLocation') {
        // Chrome 32+ warns if you try to copy deprecated returnValue, but
        // we still want to if preventDefault isn't supported (IE8).
        if (!(key === 'returnValue' && old.preventDefault)) {
          event[key] = old[key];
        }
      }
    }

    // The event occurred on this element
    if (!event.target) {
      event.target = event.srcElement || _document2['default'];
    }

    // Handle which other element the event is related to
    event.relatedTarget = event.fromElement === event.target ? event.toElement : event.fromElement;

    // Stop the default browser action
    event.preventDefault = function () {
      if (old.preventDefault) {
        old.preventDefault();
      }
      event.returnValue = false;
      event.defaultPrevented = true;
    };

    event.defaultPrevented = false;

    // Stop the event from bubbling
    event.stopPropagation = function () {
      if (old.stopPropagation) {
        old.stopPropagation();
      }
      event.cancelBubble = true;
      event.isPropagationStopped = returnTrue;
    };

    event.isPropagationStopped = returnFalse;

    // Stop the event from bubbling and executing other handlers
    event.stopImmediatePropagation = function () {
      if (old.stopImmediatePropagation) {
        old.stopImmediatePropagation();
      }
      event.isImmediatePropagationStopped = returnTrue;
      event.stopPropagation();
    };

    event.isImmediatePropagationStopped = returnFalse;

    // Handle mouse position
    if (event.clientX != null) {
      var doc = _document2['default'].documentElement,
          body = _document2['default'].body;

      event.pageX = event.clientX + (doc && doc.scrollLeft || body && body.scrollLeft || 0) - (doc && doc.clientLeft || body && body.clientLeft || 0);
      event.pageY = event.clientY + (doc && doc.scrollTop || body && body.scrollTop || 0) - (doc && doc.clientTop || body && body.clientTop || 0);
    }

    // Handle key presses
    event.which = event.charCode || event.keyCode;

    // Fix button for mouse clicks:
    // 0 == left; 1 == middle; 2 == right
    if (event.button != null) {
      event.button = event.button & 1 ? 0 : event.button & 4 ? 1 : event.button & 2 ? 2 : 0;
    }
  }

  // Returns fixed-up instance
  return event;
};

/**
 * Add an event listener to element
 * It stores the handler function in a separate cache object
 * and adds a generic handler to the element's event,
 * along with a unique id (guid) to the element.
 * @param  {Element|Object}   elem Element or object to bind listeners to
 * @param  {String|Array}   type Type of event to bind to.
 * @param  {Function} fn   Event listener.
 * @private
 */
var on = (function (_on) {
  function on(_x, _x2, _x3) {
    return _on.apply(this, arguments);
  }

  on.toString = function () {
    return on.toString();
  };

  return on;
})(function (elem, type, fn) {
  if (Lib.obj.isArray(type)) {
    return _handleMultipleEvents(on, elem, type, fn);
  }

  var data = Lib.getData(elem);

  // We need a place to store all our handler data
  if (!data.handlers) data.handlers = {};

  if (!data.handlers[type]) data.handlers[type] = [];

  if (!fn.guid) fn.guid = Lib.guid++;

  data.handlers[type].push(fn);

  if (!data.dispatcher) {
    data.disabled = false;

    data.dispatcher = function (event) {

      if (data.disabled) return;
      event = fixEvent(event);

      var handlers = data.handlers[event.type];

      if (handlers) {
        // Copy handlers so if handlers are added/removed during the process it doesn't throw everything off.
        var handlersCopy = handlers.slice(0);

        for (var m = 0, n = handlersCopy.length; m < n; m++) {
          if (event.isImmediatePropagationStopped()) {
            break;
          } else {
            handlersCopy[m].call(elem, event);
          }
        }
      }
    };
  }

  if (data.handlers[type].length == 1) {
    if (elem.addEventListener) {
      elem.addEventListener(type, data.dispatcher, false);
    } else if (elem.attachEvent) {
      elem.attachEvent('on' + type, data.dispatcher);
    }
  }
});

/**
 * Removes event listeners from an element
 * @param  {Element|Object}   elem Object to remove listeners from
 * @param  {String|Array=}   type Type of listener to remove. Don't include to remove all events from element.
 * @param  {Function} fn   Specific listener to remove. Don't include to remove listeners for an event type.
 * @private
 */
var off = (function (_off) {
  function off(_x4, _x5, _x6) {
    return _off.apply(this, arguments);
  }

  off.toString = function () {
    return off.toString();
  };

  return off;
})(function (elem, type, fn) {
  // Don't want to add a cache object through getData if not needed
  if (!Lib.hasData(elem)) return;

  var data = Lib.getData(elem);

  // If no events exist, nothing to unbind
  if (!data.handlers) {
    return;
  }

  if (Lib.obj.isArray(type)) {
    return _handleMultipleEvents(off, elem, type, fn);
  }

  // Utility function
  var removeType = function removeType(t) {
    data.handlers[t] = [];
    cleanUpEvents(elem, t);
  };

  // Are we removing all bound events?
  if (!type) {
    for (var t in data.handlers) {
      removeType(t);
    }return;
  }

  var handlers = data.handlers[type];

  // If no handlers exist, nothing to unbind
  if (!handlers) return;

  // If no listener was provided, remove all listeners for type
  if (!fn) {
    removeType(type);
    return;
  }

  // We're only removing a single handler
  if (fn.guid) {
    for (var n = 0; n < handlers.length; n++) {
      if (handlers[n].guid === fn.guid) {
        handlers.splice(n--, 1);
      }
    }
  }

  cleanUpEvents(elem, type);
});

/**
 * Clean up the listener cache and dispatchers
 * @param  {Element|Object} elem Element to clean up
 * @param  {String} type Type of event to clean up
 * @private
 */
var cleanUpEvents = function cleanUpEvents(elem, type) {
  var data = Lib.getData(elem);

  // Remove the events of a particular type if there are none left
  if (data.handlers[type].length === 0) {
    delete data.handlers[type];
    // data.handlers[type] = null;
    // Setting to null was causing an error with data.handlers

    // Remove the meta-handler from the element
    if (elem.removeEventListener) {
      elem.removeEventListener(type, data.dispatcher, false);
    } else if (elem.detachEvent) {
      elem.detachEvent('on' + type, data.dispatcher);
    }
  }

  // Remove the events object if there are no types left
  if (Lib.isEmpty(data.handlers)) {
    delete data.handlers;
    delete data.dispatcher;
    delete data.disabled;

    // data.handlers = null;
    // data.dispatcher = null;
    // data.disabled = null;
  }

  // Finally remove the expando if there is no data left
  if (Lib.isEmpty(data)) {
    Lib.removeData(elem);
  }
};

/**
 * Trigger an event for an element
 * @param  {Element|Object}      elem  Element to trigger an event on
 * @param  {Event|Object|String} event A string (the type) or an event object with a type attribute
 * @private
 */
var trigger = (function (_trigger) {
  function trigger(_x7, _x8) {
    return _trigger.apply(this, arguments);
  }

  trigger.toString = function () {
    return trigger.toString();
  };

  return trigger;
})(function (elem, event) {
  // Fetches element data and a reference to the parent (for bubbling).
  // Don't want to add a data object to cache for every parent,
  // so checking hasData first.
  var elemData = Lib.hasData(elem) ? Lib.getData(elem) : {};
  var parent = elem.parentNode || elem.ownerDocument;
  // type = event.type || event,
  // handler;

  // If an event name was passed as a string, creates an event out of it
  if (typeof event === 'string') {
    event = { type: event, target: elem };
  }
  // Normalizes the event properties.
  event = fixEvent(event);

  // If the passed element has a dispatcher, executes the established handlers.
  if (elemData.dispatcher) {
    elemData.dispatcher.call(elem, event);
  }

  // Unless explicitly stopped or the event does not bubble (e.g. media events)
  // recursively calls this function to bubble the event up the DOM.
  if (parent && !event.isPropagationStopped() && event.bubbles !== false) {
    trigger(parent, event);

    // If at the top of the DOM, triggers the default action unless disabled.
  } else if (!parent && !event.defaultPrevented) {
    var targetData = Lib.getData(event.target);

    // Checks if the target has a default action for this event.
    if (event.target[event.type]) {
      // Temporarily disables event dispatching on the target as we have already executed the handler.
      targetData.disabled = true;
      // Executes the default action.
      if (typeof event.target[event.type] === 'function') {
        event.target[event.type]();
      }
      // Re-enables event dispatching.
      targetData.disabled = false;
    }
  }

  // Inform the triggerer if the default was prevented by returning false
  return !event.defaultPrevented;
});

/**
 * Trigger a listener only once for an event
 * @param  {Element|Object}   elem Element or object to
 * @param  {String|Array}   type
 * @param  {Function} fn
 * @private
 */
var one = (function (_one) {
  function one(_x9, _x10, _x11) {
    return _one.apply(this, arguments);
  }

  one.toString = function () {
    return one.toString();
  };

  return one;
})(function (elem, type, fn) {
  if (Lib.obj.isArray(type)) {
    return _handleMultipleEvents(one, elem, type, fn);
  }
  var func = (function (_func) {
    function func() {
      return _func.apply(this, arguments);
    }

    func.toString = function () {
      return func.toString();
    };

    return func;
  })(function () {
    off(elem, type, func);
    fn.apply(this, arguments);
  });
  // copy the guid to the new function so it can removed using the original function's ID
  func.guid = fn.guid = fn.guid || Lib.guid++;
  on(elem, type, func);
});

/**
 * Loops through an array of event types and calls the requested method for each type.
 * @param  {Function} fn   The event method we want to use.
 * @param  {Element|Object} elem Element or object to bind listeners to
 * @param  {String}   type Type of event to bind to.
 * @param  {Function} callback   Event listener.
 * @private
 */
function _handleMultipleEvents(fn, elem, type, callback) {
  Lib.arr.forEach(type, function (type) {
    fn(elem, type, callback); //Call the event method for each one of the types
  });
}

exports.on = on;
exports.off = off;
exports.cleanUpEvents = cleanUpEvents;
exports.fixEvent = fixEvent;
exports.one = one;
exports.trigger = trigger;

},{"./lib":64,"global/document":1,"global/window":2}],63:[function(require,module,exports){
'use strict';

var _interopRequireWildcard = function (obj) { return obj && obj.__esModule ? obj : { 'default': obj }; };

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _document = require('global/document');

var _document2 = _interopRequireWildcard(_document);

/**
 * Store the browser-specific methods for the fullscreen API
 * @type {Object|undefined}
 * @private
 */
var FullscreenApi = {};

// browser API methods
// map approach from Screenful.js - https://github.com/sindresorhus/screenfull.js
var apiMap = [
// Spec: https://dvcs.w3.org/hg/fullscreen/raw-file/tip/Overview.html
['requestFullscreen', 'exitFullscreen', 'fullscreenElement', 'fullscreenEnabled', 'fullscreenchange', 'fullscreenerror'],
// WebKit
['webkitRequestFullscreen', 'webkitExitFullscreen', 'webkitFullscreenElement', 'webkitFullscreenEnabled', 'webkitfullscreenchange', 'webkitfullscreenerror'],
// Old WebKit (Safari 5.1)
['webkitRequestFullScreen', 'webkitCancelFullScreen', 'webkitCurrentFullScreenElement', 'webkitCancelFullScreen', 'webkitfullscreenchange', 'webkitfullscreenerror'],
// Mozilla
['mozRequestFullScreen', 'mozCancelFullScreen', 'mozFullScreenElement', 'mozFullScreenEnabled', 'mozfullscreenchange', 'mozfullscreenerror'],
// Microsoft
['msRequestFullscreen', 'msExitFullscreen', 'msFullscreenElement', 'msFullscreenEnabled', 'MSFullscreenChange', 'MSFullscreenError']];

var specApi = apiMap[0];
var browserApi = undefined;

// determine the supported set of functions
for (var i = 0; i < apiMap.length; i++) {
  // check for exitFullscreen function
  if (apiMap[i][1] in _document2['default']) {
    browserApi = apiMap[i];
    break;
  }
}

// map the browser API names to the spec API names
if (browserApi) {
  for (var i = 0; i < browserApi.length; i++) {
    FullscreenApi[specApi[i]] = browserApi[i];
  }
}

exports['default'] = FullscreenApi;
module.exports = exports['default'];

},{"global/document":1}],64:[function(require,module,exports){
'use strict';

var _interopRequireWildcard = function (obj) { return obj && obj.__esModule ? obj : { 'default': obj }; };

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _window = require('global/window');

var _window2 = _interopRequireWildcard(_window);

var _document = require('global/document');

var _document2 = _interopRequireWildcard(_document);

var navigator = _window2['default'].navigator;

var hasOwnProp = Object.prototype.hasOwnProperty;

/**
 * Creates an element and applies properties.
 * @param  {String=} tagName    Name of tag to be created.
 * @param  {Object=} properties Element properties to be applied.
 * @return {Element}
 * @private
 */
var createEl = function createEl() {
  var tagName = arguments[0] === undefined ? 'div' : arguments[0];
  var properties = arguments[1] === undefined ? {} : arguments[1];

  var el = _document2['default'].createElement(tagName);

  obj.each(properties, function (propName, val) {
    // Not remembering why we were checking for dash
    // but using setAttribute means you have to use getAttribute

    // The check for dash checks for the aria-* attributes, like aria-label, aria-valuemin.
    // The additional check for "role" is because the default method for adding attributes does not
    // add the attribute "role". My guess is because it's not a valid attribute in some namespaces, although
    // browsers handle the attribute just fine. The W3C allows for aria-* attributes to be used in pre-HTML5 docs.
    // http://www.w3.org/TR/wai-aria-primer/#ariahtml. Using setAttribute gets around this problem.
    if (propName.indexOf('aria-') !== -1 || propName == 'role') {
      el.setAttribute(propName, val);
    } else {
      el[propName] = val;
    }
  });

  return el;
};

/**
 * Uppercase the first letter of a string
 * @param  {String} string String to be uppercased
 * @return {String}
 * @private
 */
var capitalize = function capitalize(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
};

/**
 * Object functions container
 * @type {Object}
 * @private
 */
var obj = {};

/**
 * Object.create shim for prototypal inheritance
 *
 * https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Object/create
 *
 * @function
 * @param  {Object}   obj Object to use as prototype
 * @private
 */
obj.create = Object.create || function (obj) {
  //Create a new function called 'F' which is just an empty object.
  function F() {}

  //the prototype of the 'F' function should point to the
  //parameter of the anonymous function.
  F.prototype = obj;

  //create a new constructor function based off of the 'F' function.
  return new F();
};

/**
 * Loop through each property in an object and call a function
 * whose arguments are (key,value)
 * @param  {Object}   obj Object of properties
 * @param  {Function} fn  Function to be called on each property.
 * @this {*}
 * @private
 */
obj.each = function (obj, fn, context) {
  for (var key in obj) {
    if (hasOwnProp.call(obj, key)) {
      fn.call(context || this, key, obj[key]);
    }
  }
};

/**
 * Merge two objects together and return the original.
 * @param  {Object} obj1
 * @param  {Object} obj2
 * @return {Object}
 * @private
 */
obj.merge = function (obj1, obj2) {
  if (!obj2) {
    return obj1;
  }
  for (var key in obj2) {
    if (hasOwnProp.call(obj2, key)) {
      obj1[key] = obj2[key];
    }
  }
  return obj1;
};

/**
 * Merge two objects, and merge any properties that are objects
 * instead of just overwriting one. Uses to merge options hashes
 * where deeper default settings are important.
 * @param  {Object} obj1 Object to override
 * @param  {Object} obj2 Overriding object
 * @return {Object}      New object. Obj1 and Obj2 will be untouched.
 * @private
 */
obj.deepMerge = function (obj1, obj2) {
  var key, val1, val2;

  // make a copy of obj1 so we're not overwriting original values.
  // like prototype.options_ and all sub options objects
  obj1 = obj.copy(obj1);

  for (key in obj2) {
    if (hasOwnProp.call(obj2, key)) {
      val1 = obj1[key];
      val2 = obj2[key];

      // Check if both properties are pure objects and do a deep merge if so
      if (obj.isPlain(val1) && obj.isPlain(val2)) {
        obj1[key] = obj.deepMerge(val1, val2);
      } else {
        obj1[key] = obj2[key];
      }
    }
  }
  return obj1;
};

/**
 * Make a copy of the supplied object
 * @param  {Object} obj Object to copy
 * @return {Object}     Copy of object
 * @private
 */
obj.copy = function (objToCopy) {
  return obj.merge({}, objToCopy);
};

/**
 * Check if an object is plain, and not a dom node or any object sub-instance
 * @param  {Object} obj Object to check
 * @return {Boolean}     True if plain, false otherwise
 * @private
 */
obj.isPlain = function (obj) {
  return !!obj && typeof obj === 'object' && obj.toString() === '[object Object]' && obj.constructor === Object;
};

/**
 * Check if an object is Array
*  Since instanceof Array will not work on arrays created in another frame we need to use Array.isArray, but since IE8 does not support Array.isArray we need this shim
 * @param  {Object} obj Object to check
 * @return {Boolean}     True if plain, false otherwise
 * @private
 */
obj.isArray = Array.isArray || function (arr) {
  return Object.prototype.toString.call(arr) === '[object Array]';
};

/**
 * Bind (a.k.a proxy or Context). A simple method for changing the context of a function
   It also stores a unique id on the function so it can be easily removed from events
 * @param  {*}   context The object to bind as scope
 * @param  {Function} fn      The function to be bound to a scope
 * @param  {Number=}   uid     An optional unique ID for the function to be set
 * @return {Function}
 * @private
 */
var bind = function bind(context, fn, uid) {
  // Make sure the function has a unique ID
  if (!fn.guid) {
    fn.guid = (exports.guid = guid += 1, guid - 1);
  }

  // Create the new function that changes the context
  var ret = function ret() {
    return fn.apply(context, arguments);
  };

  // Allow for the ability to individualize this function
  // Needed in the case where multiple objects might share the same prototype
  // IF both items add an event listener with the same function, then you try to remove just one
  // it will remove both because they both have the same guid.
  // when using this, you need to use the bind method when you remove the listener as well.
  // currently used in text tracks
  ret.guid = uid ? uid + '_' + fn.guid : fn.guid;

  return ret;
};

/**
 * Element Data Store. Allows for binding data to an element without putting it directly on the element.
 * Ex. Event listeners are stored here.
 * (also from jsninja.com, slightly modified and updated for closure compiler)
 * @type {Object}
 * @private
 */
var cache = {};

/**
 * Unique ID for an element or function
 * @type {Number}
 * @private
 */
var guid = 1;

/**
 * Unique attribute name to store an element's guid in
 * @type {String}
 * @constant
 * @private
 */
var expando = 'vdata' + new Date().getTime();

/**
 * Returns the cache object where data for an element is stored
 * @param  {Element} el Element to store data for.
 * @return {Object}
 * @private
 */
var getData = function getData(el) {
  var id = el[expando];
  if (!id) {
    id = el[expando] = (exports.guid = guid += 1, guid - 1);
  }
  if (!cache[id]) {
    cache[id] = {};
  }
  return cache[id];
};

/**
 * Returns the cache object where data for an element is stored
 * @param  {Element} el Element to store data for.
 * @return {Object}
 * @private
 */
var hasData = function hasData(el) {
  var id = el[expando];
  return !(!id || isEmpty(cache[id]));
};

/**
 * Delete data for the element from the cache and the guid attr from getElementById
 * @param  {Element} el Remove data for an element
 * @private
 */
var removeData = function removeData(el) {
  var id = el[expando];
  if (!id) {
    return;
  }
  // Remove all stored data
  // Changed to = null
  // http://coding.smashingmagazine.com/2012/11/05/writing-fast-memory-efficient-javascript/
  // cache[id] = null;
  delete cache[id];

  // Remove the expando property from the DOM node
  try {
    delete el[expando];
  } catch (e) {
    if (el.removeAttribute) {
      el.removeAttribute(expando);
    } else {
      // IE doesn't appear to support removeAttribute on the document element
      el[expando] = null;
    }
  }
};

/**
 * Check if an object is empty
 * @param  {Object}  obj The object to check for emptiness
 * @return {Boolean}
 * @private
 */
var isEmpty = function isEmpty(obj) {
  for (var prop in obj) {
    // Inlude null properties as empty.
    if (obj[prop] !== null) {
      return false;
    }
  }
  return true;
};

/**
 * Check if an element has a CSS class
 * @param {Element} element Element to check
 * @param {String} classToCheck Classname to check
 * @private
 */
var hasClass = function hasClass(element, classToCheck) {
  return (' ' + element.className + ' ').indexOf(' ' + classToCheck + ' ') !== -1;
};

/**
 * Add a CSS class name to an element
 * @param {Element} element    Element to add class name to
 * @param {String} classToAdd Classname to add
 * @private
 */
var addClass = function addClass(element, classToAdd) {
  if (!hasClass(element, classToAdd)) {
    element.className = element.className === '' ? classToAdd : element.className + ' ' + classToAdd;
  }
};

/**
 * Remove a CSS class name from an element
 * @param {Element} element    Element to remove from class name
 * @param {String} classToAdd Classname to remove
 * @private
 */
var removeClass = function removeClass(element, classToRemove) {
  if (!hasClass(element, classToRemove)) {
    return;
  }

  var classNames = element.className.split(' ');

  // no arr.indexOf in ie8, and we don't want to add a big shim
  for (var i = classNames.length - 1; i >= 0; i--) {
    if (classNames[i] === classToRemove) {
      classNames.splice(i, 1);
    }
  }

  element.className = classNames.join(' ');
};

/**
 * Element for testing browser HTML5 video capabilities
 * @type {Element}
 * @constant
 * @private
 */
var TEST_VID = createEl('video');
var track = _document2['default'].createElement('track');
track.kind = 'captions';
track.srclang = 'en';
track.label = 'English';
TEST_VID.appendChild(track);

/**
 * Useragent for browser testing.
 * @type {String}
 * @constant
 * @private
 */
var USER_AGENT = navigator.userAgent;

/**
 * Device is an iPhone
 * @type {Boolean}
 * @constant
 * @private
 */
var IS_IPHONE = /iPhone/i.test(USER_AGENT);
var IS_IPAD = /iPad/i.test(USER_AGENT);
var IS_IPOD = /iPod/i.test(USER_AGENT);
var IS_IOS = IS_IPHONE || IS_IPAD || IS_IPOD;

var IOS_VERSION = (function () {
  var match = USER_AGENT.match(/OS (\d+)_/i);
  if (match && match[1]) {
    return match[1];
  }
})();

var IS_ANDROID = /Android/i.test(USER_AGENT);
var ANDROID_VERSION = (function () {
  // This matches Android Major.Minor.Patch versions
  // ANDROID_VERSION is Major.Minor as a Number, if Minor isn't available, then only Major is returned
  var match = USER_AGENT.match(/Android (\d+)(?:\.(\d+))?(?:\.(\d+))*/i),
      major,
      minor;

  if (!match) {
    return null;
  }

  major = match[1] && parseFloat(match[1]);
  minor = match[2] && parseFloat(match[2]);

  if (major && minor) {
    return parseFloat(match[1] + '.' + match[2]);
  } else if (major) {
    return major;
  } else {
    return null;
  }
})();
// Old Android is defined as Version older than 2.3, and requiring a webkit version of the android browser
var IS_OLD_ANDROID = IS_ANDROID && /webkit/i.test(USER_AGENT) && ANDROID_VERSION < 2.3;

var IS_FIREFOX = /Firefox/i.test(USER_AGENT);
var IS_CHROME = /Chrome/i.test(USER_AGENT);
var IS_IE8 = /MSIE\s8\.0/.test(USER_AGENT);

var TOUCH_ENABLED = !!('ontouchstart' in _window2['default'] || _window2['default'].DocumentTouch && _document2['default'] instanceof _window2['default'].DocumentTouch);
var BACKGROUND_SIZE_SUPPORTED = ('backgroundSize' in TEST_VID.style);

/**
 * Apply attributes to an HTML element.
 * @param  {Element} el         Target element.
 * @param  {Object=} attributes Element attributes to be applied.
 * @private
 */
var setElementAttributes = function setElementAttributes(el, attributes) {
  obj.each(attributes, function (attrName, attrValue) {
    if (attrValue === null || typeof attrValue === 'undefined' || attrValue === false) {
      el.removeAttribute(attrName);
    } else {
      el.setAttribute(attrName, attrValue === true ? '' : attrValue);
    }
  });
};

/**
 * Get an element's attribute values, as defined on the HTML tag
 * Attributes are not the same as properties. They're defined on the tag
 * or with setAttribute (which shouldn't be used with HTML)
 * This will return true or false for boolean attributes.
 * @param  {Element} tag Element from which to get tag attributes
 * @return {Object}
 * @private
 */
var getElementAttributes = function getElementAttributes(tag) {
  var obj, knownBooleans, attrs, attrName, attrVal;

  obj = {};

  // known boolean attributes
  // we can check for matching boolean properties, but older browsers
  // won't know about HTML5 boolean attributes that we still read from
  knownBooleans = ',' + 'autoplay,controls,loop,muted,default' + ',';

  if (tag && tag.attributes && tag.attributes.length > 0) {
    attrs = tag.attributes;

    for (var i = attrs.length - 1; i >= 0; i--) {
      attrName = attrs[i].name;
      attrVal = attrs[i].value;

      // check for known booleans
      // the matching element property will return a value for typeof
      if (typeof tag[attrName] === 'boolean' || knownBooleans.indexOf(',' + attrName + ',') !== -1) {
        // the value of an included boolean attribute is typically an empty
        // string ('') which would equal false if we just check for a false value.
        // we also don't want support bad code like autoplay='false'
        attrVal = attrVal !== null ? true : false;
      }

      obj[attrName] = attrVal;
    }
  }

  return obj;
};

/**
 * Get the computed style value for an element
 * From http://robertnyman.com/2006/04/24/get-the-rendered-style-of-an-element/
 * @param  {Element} el        Element to get style value for
 * @param  {String} strCssRule Style name
 * @return {String}            Style value
 * @private
 */
var getComputedDimension = function getComputedDimension(el, strCssRule) {
  var strValue = '';
  if (_document2['default'].defaultView && _document2['default'].defaultView.getComputedStyle) {
    strValue = _document2['default'].defaultView.getComputedStyle(el, '').getPropertyValue(strCssRule);
  } else if (el.currentStyle) {
    // IE8 Width/Height support
    var upperCasedRule = strCssRule.substr(0, 1).toUpperCase() + strCssRule.substr(1);
    strValue = el['client' + upperCasedRule] + 'px';
  }
  return strValue;
};

/**
 * Insert an element as the first child node of another
 * @param  {Element} child   Element to insert
 * @param  {[type]} parent Element to insert child into
 * @private
 */
var insertFirst = function insertFirst(child, parent) {
  if (parent.firstChild) {
    parent.insertBefore(child, parent.firstChild);
  } else {
    parent.appendChild(child);
  }
};

/**
 * Object to hold browser support information
 * @type {Object}
 * @private
 */
var browser = {};

/**
 * Shorthand for document.getElementById()
 * Also allows for CSS (jQuery) ID syntax. But nothing other than IDs.
 * @param  {String} id  Element ID
 * @return {Element}    Element with supplied ID
 * @private
 */
var el = function el(id) {
  if (id.indexOf('#') === 0) {
    id = id.slice(1);
  }

  return _document2['default'].getElementById(id);
};

/**
 * Format seconds as a time string, H:MM:SS or M:SS
 * Supplying a guide (in seconds) will force a number of leading zeros
 * to cover the length of the guide
 * @param  {Number} seconds Number of seconds to be turned into a string
 * @param  {Number} guide   Number (in seconds) to model the string after
 * @return {String}         Time formatted as H:MM:SS or M:SS
 * @private
 */
var formatTime = function formatTime(seconds) {
  var guide = arguments[1] === undefined ? seconds : arguments[1];
  return (function () {
    var s = Math.floor(seconds % 60);
    var m = Math.floor(seconds / 60 % 60);
    var h = Math.floor(seconds / 3600);
    var gm = Math.floor(guide / 60 % 60);
    var gh = Math.floor(guide / 3600);

    // handle invalid times
    if (isNaN(seconds) || seconds === Infinity) {
      // '-' is false for all relational operators (e.g. <, >=) so this setting
      // will add the minimum number of fields specified by the guide
      h = m = s = '-';
    }

    // Check if we need to show hours
    h = h > 0 || gh > 0 ? h + ':' : '';

    // If hours are showing, we may need to add a leading zero.
    // Always show at least one digit of minutes.
    m = ((h || gm >= 10) && m < 10 ? '0' + m : m) + ':';

    // Check if leading zero is need for seconds
    s = s < 10 ? '0' + s : s;

    return h + m + s;
  })();
};

// Attempt to block the ability to select text while dragging controls
var blockTextSelection = function blockTextSelection() {
  _document2['default'].body.focus();
  _document2['default'].onselectstart = function () {
    return false;
  };
};
// Turn off text selection blocking
var unblockTextSelection = function unblockTextSelection() {
  _document2['default'].onselectstart = function () {
    return true;
  };
};

/**
 * Trim whitespace from the ends of a string.
 * @param  {String} string String to trim
 * @return {String}        Trimmed string
 * @private
 */
var trim = function trim(str) {
  return (str + '').replace(/^\s+|\s+$/g, '');
};

/**
 * Should round off a number to a decimal place
 * @param  {Number} num Number to round
 * @param  {Number} dec Number of decimal places to round to
 * @return {Number}     Rounded number
 * @private
 */
var round = function round(num) {
  var dec = arguments[1] === undefined ? 0 : arguments[1];

  return Math.round(num * Math.pow(10, dec)) / Math.pow(10, dec);
};

/**
 * Should create a fake TimeRange object
 * Mimics an HTML5 time range instance, which has functions that
 * return the start and end times for a range
 * TimeRanges are returned by the buffered() method
 * @param  {Number} start Start time in seconds
 * @param  {Number} end   End time in seconds
 * @return {Object}       Fake TimeRange object
 * @private
 */
var createTimeRange = function createTimeRange(start, end) {
  return {
    length: 1,
    start: (function (_start) {
      function start() {
        return _start.apply(this, arguments);
      }

      start.toString = function () {
        return start.toString();
      };

      return start;
    })(function () {
      return start;
    }),
    end: (function (_end) {
      function end() {
        return _end.apply(this, arguments);
      }

      end.toString = function () {
        return end.toString();
      };

      return end;
    })(function () {
      return end;
    })
  };
};

/**
 * Add to local storage (maybe removable)
 * @private
 */
var setLocalStorage = function setLocalStorage(key, value) {
  try {
    // IE was throwing errors referencing the var anywhere without this
    var _localStorage = _window2['default'].localStorage || false;
    if (!_localStorage) {
      return;
    }
    _localStorage[key] = value;
  } catch (e) {
    if (e.code == 22 || e.code == 1014) {
      // Webkit == 22 / Firefox == 1014
      log('LocalStorage Full (VideoJS)', e);
    } else {
      if (e.code == 18) {
        log('LocalStorage not allowed (VideoJS)', e);
      } else {
        log('LocalStorage Error (VideoJS)', e);
      }
    }
  }
};

/**
 * Get absolute version of relative URL. Used to tell flash correct URL.
 * http://stackoverflow.com/questions/470832/getting-an-absolute-url-from-a-relative-one-ie6-issue
 * @param  {String} url URL to make absolute
 * @return {String}     Absolute URL
 * @private
 */
var getAbsoluteURL = function getAbsoluteURL(url) {
  // Check if absolute URL
  if (!url.match(/^https?:\/\//)) {
    // Convert to absolute URL. Flash hosted off-site needs an absolute URL.
    url = createEl('div', {
      innerHTML: '<a href="' + url + '">x</a>'
    }).firstChild.href;
  }

  return url;
};

/**
 * Resolve and parse the elements of a URL
 * @param  {String} url The url to parse
 * @return {Object}     An object of url details
 */
var parseUrl = function parseUrl(url) {
  var props = ['protocol', 'hostname', 'port', 'pathname', 'search', 'hash', 'host'];

  // add the url to an anchor and let the browser parse the URL
  var a = createEl('a', { href: url });

  // IE8 (and 9?) Fix
  // ie8 doesn't parse the URL correctly until the anchor is actually
  // added to the body, and an innerHTML is needed to trigger the parsing
  var addToBody = a.host === '' && a.protocol !== 'file:';
  var div = undefined;
  if (addToBody) {
    div = createEl('div');
    div.innerHTML = '<a href="' + url + '"></a>';
    a = div.firstChild;
    // prevent the div from affecting layout
    div.setAttribute('style', 'display:none; position:absolute;');
    _document2['default'].body.appendChild(div);
  }

  // Copy the specific URL properties to a new object
  // This is also needed for IE8 because the anchor loses its
  // properties when it's removed from the dom
  var details = {};
  for (var i = 0; i < props.length; i++) {
    details[props[i]] = a[props[i]];
  }

  // IE9 adds the port to the host property unlike everyone else. If
  // a port identifier is added for standard ports, strip it.
  if (details.protocol === 'http:') {
    details.host = details.host.replace(/:80$/, '');
  }
  if (details.protocol === 'https:') {
    details.host = details.host.replace(/:443$/, '');
  }

  if (addToBody) {
    _document2['default'].body.removeChild(div);
  }

  return details;
};

/**
 * Log messages to the console and history based on the type of message
 *
 * @param  {String} type The type of message, or `null` for `log`
 * @param  {[type]} args The args to be passed to the log
 * @private
 */
function _logType(type, args) {
  // convert args to an array to get array functions
  var argsArray = Array.prototype.slice.call(args);
  // if there's no console then don't try to output messages
  // they will still be stored in Lib.log.history
  // Was setting these once outside of this function, but containing them
  // in the function makes it easier to test cases where console doesn't exist
  var noop = function noop() {};

  var console = _window2['default'].console || {
    log: noop,
    warn: noop,
    error: noop
  };

  if (type) {
    // add the type to the front of the message
    argsArray.unshift(type.toUpperCase() + ':');
  } else {
    // default to log with no prefix
    type = 'log';
  }

  // add to history
  log.history.push(argsArray);

  // add console prefix after adding to history
  argsArray.unshift('VIDEOJS:');

  // call appropriate log function
  if (console[type].apply) {
    console[type].apply(console, argsArray);
  } else {
    // ie8 doesn't allow error.apply, but it will just join() the array anyway
    console[type](argsArray.join(' '));
  }
}

/**
 * Log plain debug messages
 */
var log = function log() {
  _logType(null, arguments);
};

/**
 * Keep a history of log messages
 * @type {Array}
 */
log.history = [];

/**
 * Log error messages
 */
log.error = function () {
  _logType('error', arguments);
};

/**
 * Log warning messages
 */
log.warn = function () {
  _logType('warn', arguments);
};

// Offset Left
// getBoundingClientRect technique from John Resig http://ejohn.org/blog/getboundingclientrect-is-awesome/
var findPosition = function findPosition(el) {
  var box = undefined;

  if (el.getBoundingClientRect && el.parentNode) {
    box = el.getBoundingClientRect();
  }

  if (!box) {
    return {
      left: 0,
      top: 0
    };
  }

  var docEl = _document2['default'].documentElement;
  var body = _document2['default'].body;

  var clientLeft = docEl.clientLeft || body.clientLeft || 0;
  var scrollLeft = _window2['default'].pageXOffset || body.scrollLeft;
  var left = box.left + scrollLeft - clientLeft;

  var clientTop = docEl.clientTop || body.clientTop || 0;
  var scrollTop = _window2['default'].pageYOffset || body.scrollTop;
  var top = box.top + scrollTop - clientTop;

  // Android sometimes returns slightly off decimal values, so need to round
  return {
    left: round(left),
    top: round(top)
  };
};

/**
 * Array functions container
 * @type {Object}
 * @private
 */
var arr = {};

/*
 * Loops through an array and runs a function for each item inside it.
 * @param  {Array}    array       The array
 * @param  {Function} callback    The function to be run for each item
 * @param  {*}        thisArg     The `this` binding of callback
 * @returns {Array}               The array
 * @private
 */
arr.forEach = function (array, callback, thisArg) {
  thisArg = thisArg || this;

  if (obj.isArray(array) && callback instanceof Function) {
    for (var i = 0, len = array.length; i < len; ++i) {
      callback.call(thisArg, array[i], i, array);
    }
  }

  return array;
};

/**
 * Returns the extension of the passed file name. It will return an empty string if you pass an invalid path
 *
 * @param {String}    path    The fileName path like '/path/to/file.mp4'
 * @returns {String}          The extension in lower case or an empty string if no extension could be found.
 */
var getFileExtension = function getFileExtension(path) {
  if (typeof path === 'string') {
    var splitPathRe = /^(\/?)([\s\S]*?)((?:\.{1,2}|[^\/]+?)(\.([^\.\/\?]+)))(?:[\/]*|[\?].*)$/i;
    var pathParts = splitPathRe.exec(path);

    if (pathParts) {
      return pathParts.pop().toLowerCase();
    }
  }

  return '';
};

exports.createEl = createEl;
exports.capitalize = capitalize;
exports.obj = obj;
exports.isNaN = isNaN;
exports.bind = bind;
exports.cache = cache;
exports.guid = guid;
exports.expando = expando;
exports.getData = getData;
exports.hasData = hasData;
exports.removeData = removeData;
exports.isEmpty = isEmpty;
exports.hasClass = hasClass;
exports.addClass = addClass;
exports.removeClass = removeClass;
exports.TEST_VID = TEST_VID;
exports.USER_AGENT = USER_AGENT;
exports.IS_IPHONE = IS_IPHONE;
exports.IS_IPAD = IS_IPAD;
exports.IS_IPOD = IS_IPOD;
exports.IS_IOS = IS_IOS;
exports.IOS_VERSION = IOS_VERSION;
exports.IS_ANDROID = IS_ANDROID;
exports.ANDROID_VERSION = ANDROID_VERSION;
exports.IS_OLD_ANDROID = IS_OLD_ANDROID;
exports.IS_FIREFOX = IS_FIREFOX;
exports.IS_IE8 = IS_IE8;
exports.IS_CHROME = IS_CHROME;
exports.TOUCH_ENABLED = TOUCH_ENABLED;
exports.BACKGROUND_SIZE_SUPPORTED = BACKGROUND_SIZE_SUPPORTED;
exports.setElementAttributes = setElementAttributes;
exports.getElementAttributes = getElementAttributes;
exports.getComputedDimension = getComputedDimension;
exports.insertFirst = insertFirst;
exports.browser = browser;
exports.el = el;
exports.formatTime = formatTime;
exports.blockTextSelection = blockTextSelection;
exports.unblockTextSelection = unblockTextSelection;
exports.trim = trim;
exports.round = round;
exports.createTimeRange = createTimeRange;
exports.setLocalStorage = setLocalStorage;
exports.getAbsoluteURL = getAbsoluteURL;
exports.parseUrl = parseUrl;
exports.log = log;
exports.findPosition = findPosition;
exports.arr = arr;
exports.getFileExtension = getFileExtension;

},{"global/document":1,"global/window":2}],65:[function(require,module,exports){
'use strict';

var _interopRequireWildcard = function (obj) { return obj && obj.__esModule ? obj : { 'default': obj }; };

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } };

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if (descriptor.value) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(object, property, receiver) { var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _inherits = function (subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; };

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _Component2 = require('./component');

var _Component3 = _interopRequireWildcard(_Component2);

/* Loading Spinner
================================================================================ */
/**
 * Loading spinner for waiting events
 * @param {Player|Object} player
 * @param {Object=} options
 * @class
 * @constructor
 */

var LoadingSpinner = (function (_Component) {
  function LoadingSpinner() {
    _classCallCheck(this, LoadingSpinner);

    if (_Component != null) {
      _Component.apply(this, arguments);
    }
  }

  _inherits(LoadingSpinner, _Component);

  _createClass(LoadingSpinner, [{
    key: 'createEl',
    value: function createEl() {
      return _get(Object.getPrototypeOf(LoadingSpinner.prototype), 'createEl', this).call(this, 'div', {
        className: 'vjs-loading-spinner'
      });
    }
  }]);

  return LoadingSpinner;
})(_Component3['default']);

_Component3['default'].registerComponent('LoadingSpinner', LoadingSpinner);
exports['default'] = LoadingSpinner;
module.exports = exports['default'];

},{"./component":26}],66:[function(require,module,exports){
'use strict';

var _interopRequireWildcard = function (obj) { return obj && obj.__esModule ? obj : { 'default': obj }; };

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _import = require('./lib');

var Lib = _interopRequireWildcard(_import);

/**
 * Custom MediaError to mimic the HTML5 MediaError
 * @param {Number} code The media error code
 */
var MediaError = (function (_MediaError) {
  function MediaError(_x) {
    return _MediaError.apply(this, arguments);
  }

  MediaError.toString = function () {
    return MediaError.toString();
  };

  return MediaError;
})(function (code) {
  if (typeof code === 'number') {
    this.code = code;
  } else if (typeof code === 'string') {
    // default code is zero, so this is a custom error
    this.message = code;
  } else if (typeof code === 'object') {
    // object
    Lib.obj.merge(this, code);
  }

  if (!this.message) {
    this.message = MediaError.defaultMessages[this.code] || '';
  }
});

/**
 * The error code that refers two one of the defined
 * MediaError types
 * @type {Number}
 */
MediaError.prototype.code = 0;

/**
 * An optional message to be shown with the error.
 * Message is not part of the HTML5 video spec
 * but allows for more informative custom errors.
 * @type {String}
 */
MediaError.prototype.message = '';

/**
 * An optional status code that can be set by plugins
 * to allow even more detail about the error.
 * For example the HLS plugin might provide the specific
 * HTTP status code that was returned when the error
 * occurred, then allowing a custom error overlay
 * to display more information.
 * @type {[type]}
 */
MediaError.prototype.status = null;

MediaError.errorTypes = ['MEDIA_ERR_CUSTOM', // = 0
'MEDIA_ERR_ABORTED', // = 1
'MEDIA_ERR_NETWORK', // = 2
'MEDIA_ERR_DECODE', // = 3
'MEDIA_ERR_SRC_NOT_SUPPORTED', // = 4
'MEDIA_ERR_ENCRYPTED' // = 5
];

MediaError.defaultMessages = {
  1: 'You aborted the video playback',
  2: 'A network error caused the video download to fail part-way.',
  3: 'The video playback was aborted due to a corruption problem or because the video used features your browser did not support.',
  4: 'The video could not be loaded, either because the server or network failed or because the format is not supported.',
  5: 'The video is encrypted and we do not have the keys to decrypt it.'
};

// Add types as properties on MediaError
// e.g. MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED = 4;
for (var errNum = 0; errNum < MediaError.errorTypes.length; errNum++) {
  MediaError[MediaError.errorTypes[errNum]] = errNum;
  // values should be accessible on both the class and instance
  MediaError.prototype[MediaError.errorTypes[errNum]] = errNum;
}

exports['default'] = MediaError;
module.exports = exports['default'];

},{"./lib":64}],67:[function(require,module,exports){
'use strict';

var _interopRequireWildcard = function (obj) { return obj && obj.__esModule ? obj : { 'default': obj }; };

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } };

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if (descriptor.value) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(object, property, receiver) { var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _inherits = function (subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; };

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _Button2 = require('../button.js');

var _Button3 = _interopRequireWildcard(_Button2);

var _Menu = require('./menu.js');

var _Menu2 = _interopRequireWildcard(_Menu);

var _import = require('../lib.js');

var Lib = _interopRequireWildcard(_import);

/**
 * A button class with a popup menu
 * @param {Player|Object} player
 * @param {Object=} options
 * @constructor
 */

var MenuButton = (function (_Button) {
  function MenuButton(player, options) {
    _classCallCheck(this, MenuButton);

    _get(Object.getPrototypeOf(MenuButton.prototype), 'constructor', this).call(this, player, options);

    this.update();

    this.on('keydown', this.handleKeyPress);
    this.el_.setAttribute('aria-haspopup', true);
    this.el_.setAttribute('role', 'button');
  }

  _inherits(MenuButton, _Button);

  _createClass(MenuButton, [{
    key: 'update',
    value: function update() {
      var menu = this.createMenu();

      if (this.menu) {
        this.removeChild(this.menu);
      }

      this.menu = menu;
      this.addChild(menu);

      /**
       * Track the state of the menu button
       * @type {Boolean}
       * @private
       */
      this.buttonPressed_ = false;

      if (this.items && this.items.length === 0) {
        this.hide();
      } else if (this.items && this.items.length > 1) {
        this.show();
      }
    }
  }, {
    key: 'createMenu',
    value: function createMenu() {
      var menu = new _Menu2['default'](this.player_);

      // Add a title list item to the top
      if (this.options().title) {
        menu.contentEl().appendChild(Lib.createEl('li', {
          className: 'vjs-menu-title',
          innerHTML: Lib.capitalize(this.options().title),
          tabindex: -1
        }));
      }

      this.items = this.createItems();

      if (this.items) {
        // Add menu items to the menu
        for (var i = 0; i < this.items.length; i++) {
          menu.addItem(this.items[i]);
        }
      }

      return menu;
    }
  }, {
    key: 'createItems',

    /**
     * Create the list of menu items. Specific to each subclass.
     */
    value: function createItems() {}
  }, {
    key: 'buildCSSClass',

    /** @inheritDoc */
    value: function buildCSSClass() {
      return '' + this.className + ' vjs-menu-button ' + _get(Object.getPrototypeOf(MenuButton.prototype), 'buildCSSClass', this).call(this);
    }
  }, {
    key: 'handleFocus',

    // Focus - Add keyboard functionality to element
    // This function is not needed anymore. Instead, the keyboard functionality is handled by
    // treating the button as triggering a submenu. When the button is pressed, the submenu
    // appears. Pressing the button again makes the submenu disappear.
    value: function handleFocus() {}
  }, {
    key: 'handleBlur',

    // Can't turn off list display that we turned on with focus, because list would go away.
    value: function handleBlur() {}
  }, {
    key: 'handleClick',
    value: function handleClick() {
      // When you click the button it adds focus, which will show the menu indefinitely.
      // So we'll remove focus when the mouse leaves the button.
      // Focus is needed for tab navigation.
      this.one('mouseout', Lib.bind(this, function () {
        this.menu.unlockShowing();
        this.el_.blur();
      }));
      if (this.buttonPressed_) {
        this.unpressButton();
      } else {
        this.pressButton();
      }
    }
  }, {
    key: 'handleKeyPress',
    value: function handleKeyPress(event) {

      // Check for space bar (32) or enter (13) keys
      if (event.which == 32 || event.which == 13) {
        if (this.buttonPressed_) {
          this.unpressButton();
        } else {
          this.pressButton();
        }
        event.preventDefault();
        // Check for escape (27) key
      } else if (event.which == 27) {
        if (this.buttonPressed_) {
          this.unpressButton();
        }
        event.preventDefault();
      }
    }
  }, {
    key: 'pressButton',
    value: function pressButton() {
      this.buttonPressed_ = true;
      this.menu.lockShowing();
      this.el_.setAttribute('aria-pressed', true);
      if (this.items && this.items.length > 0) {
        this.items[0].el().focus(); // set the focus to the title of the submenu
      }
    }
  }, {
    key: 'unpressButton',
    value: function unpressButton() {
      this.buttonPressed_ = false;
      this.menu.unlockShowing();
      this.el_.setAttribute('aria-pressed', false);
    }
  }]);

  return MenuButton;
})(_Button3['default']);

_Button3['default'].registerComponent('MenuButton', MenuButton);
exports['default'] = MenuButton;
module.exports = exports['default'];

},{"../button.js":25,"../lib.js":64,"./menu.js":69}],68:[function(require,module,exports){
'use strict';

var _interopRequireWildcard = function (obj) { return obj && obj.__esModule ? obj : { 'default': obj }; };

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } };

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if (descriptor.value) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(object, property, receiver) { var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _inherits = function (subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; };

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _Button2 = require('../button.js');

var _Button3 = _interopRequireWildcard(_Button2);

var _import = require('../lib.js');

var Lib = _interopRequireWildcard(_import);

/**
 * The component for a menu item. `<li>`
 *
 * @param {Player|Object} player
 * @param {Object=} options
 * @class
 * @constructor
 */

var MenuItem = (function (_Button) {
  function MenuItem(player, options) {
    _classCallCheck(this, MenuItem);

    _get(Object.getPrototypeOf(MenuItem.prototype), 'constructor', this).call(this, player, options);
    this.selected(options.selected);
  }

  _inherits(MenuItem, _Button);

  _createClass(MenuItem, [{
    key: 'createEl',

    /** @inheritDoc */
    value: function createEl(type, props) {
      return _get(Object.getPrototypeOf(MenuItem.prototype), 'createEl', this).call(this, 'li', Lib.obj.merge({
        className: 'vjs-menu-item',
        innerHTML: this.localize(this.options_.label)
      }, props));
    }
  }, {
    key: 'handleClick',

    /**
     * Handle a click on the menu item, and set it to selected
     */
    value: function handleClick() {
      this.selected(true);
    }
  }, {
    key: 'selected',

    /**
     * Set this menu item as selected or not
     * @param  {Boolean} selected
     */
    value: (function (_selected) {
      function selected(_x) {
        return _selected.apply(this, arguments);
      }

      selected.toString = function () {
        return selected.toString();
      };

      return selected;
    })(function (selected) {
      if (selected) {
        this.addClass('vjs-selected');
        this.el_.setAttribute('aria-selected', true);
      } else {
        this.removeClass('vjs-selected');
        this.el_.setAttribute('aria-selected', false);
      }
    })
  }]);

  return MenuItem;
})(_Button3['default']);

_Button3['default'].registerComponent('MenuItem', MenuItem);
exports['default'] = MenuItem;
module.exports = exports['default'];

},{"../button.js":25,"../lib.js":64}],69:[function(require,module,exports){
'use strict';

var _interopRequireWildcard = function (obj) { return obj && obj.__esModule ? obj : { 'default': obj }; };

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } };

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if (descriptor.value) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(object, property, receiver) { var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _inherits = function (subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; };

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _Component2 = require('../component.js');

var _Component3 = _interopRequireWildcard(_Component2);

var _import = require('../lib.js');

var Lib = _interopRequireWildcard(_import);

var _import2 = require('../events.js');

var Events = _interopRequireWildcard(_import2);

/* Menu
================================================================================ */
/**
 * The Menu component is used to build pop up menus, including subtitle and
 * captions selection menus.
 *
 * @param {Player|Object} player
 * @param {Object=} options
 * @class
 * @constructor
 */

var Menu = (function (_Component) {
  function Menu() {
    _classCallCheck(this, Menu);

    if (_Component != null) {
      _Component.apply(this, arguments);
    }
  }

  _inherits(Menu, _Component);

  _createClass(Menu, [{
    key: 'addItem',

    /**
     * Add a menu item to the menu
     * @param {Object|String} component Component or component type to add
     */
    value: function addItem(component) {
      this.addChild(component);
      component.on('click', Lib.bind(this, function () {
        this.unlockShowing();
      }));
    }
  }, {
    key: 'createEl',
    value: function createEl() {
      var contentElType = this.options().contentElType || 'ul';
      this.contentEl_ = Lib.createEl(contentElType, {
        className: 'vjs-menu-content'
      });
      var el = _get(Object.getPrototypeOf(Menu.prototype), 'createEl', this).call(this, 'div', {
        append: this.contentEl_,
        className: 'vjs-menu'
      });
      el.appendChild(this.contentEl_);

      // Prevent clicks from bubbling up. Needed for Menu Buttons,
      // where a click on the parent is significant
      Events.on(el, 'click', function (event) {
        event.preventDefault();
        event.stopImmediatePropagation();
      });

      return el;
    }
  }]);

  return Menu;
})(_Component3['default']);

_Component3['default'].registerComponent('Menu', Menu);
exports['default'] = Menu;
module.exports = exports['default'];

},{"../component.js":26,"../events.js":62,"../lib.js":64}],70:[function(require,module,exports){
'use strict';

var _interopRequireWildcard = function (obj) { return obj && obj.__esModule ? obj : { 'default': obj }; };

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _document = require('global/document');

var _document2 = _interopRequireWildcard(_document);

var _window = require('global/window');

var _window2 = _interopRequireWildcard(_window);

var navigator = _window2['default'].navigator;

/**
 * Global Player instance options, surfaced from Player.prototype.options_
 * options = Player.prototype.options_
 * All options should use string keys so they avoid
 * renaming by closure compiler
 * @type {Object}
 */
exports['default'] = {
  // Default order of fallback technology
  techOrder: ['html5', 'flash'],
  // techOrder: ['flash','html5'],

  html5: {},
  flash: {},

  // Default of web browser is 300x150. Should rely on source width/height.
  width: 300,
  height: 150,
  // defaultVolume: 0.85,
  defaultVolume: 0, // The freakin seaguls are driving me crazy!

  // default inactivity timeout
  inactivityTimeout: 2000,

  // default playback rates
  playbackRates: [],
  // Add playback rate selection by adding rates
  // 'playbackRates': [0.5, 1, 1.5, 2],

  // Included control sets
  children: {
    mediaLoader: {},
    posterImage: {},
    textTrackDisplay: {},
    loadingSpinner: {},
    bigPlayButton: {},
    controlBar: {},
    errorDisplay: {},
    textTrackSettings: {}
  },

  language: _document2['default'].getElementsByTagName('html')[0].getAttribute('lang') || navigator.languages && navigator.languages[0] || navigator.userLanguage || navigator.language || 'en',

  // locales and their language translations
  languages: {},

  // Default message to show when a video cannot be played.
  notSupportedMessage: 'No compatible source was found for this video.'
};
module.exports = exports['default'];

},{"global/document":1,"global/window":2}],71:[function(require,module,exports){
'use strict';

var _interopRequireWildcard = function (obj) { return obj && obj.__esModule ? obj : { 'default': obj }; };

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } };

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if (descriptor.value) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(object, property, receiver) { var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _inherits = function (subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; };

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _Component2 = require('./component.js');

var _Component3 = _interopRequireWildcard(_Component2);

var _import = require('./lib.js');

var Lib = _interopRequireWildcard(_import);

var _import2 = require('./events.js');

var Events = _interopRequireWildcard(_import2);

var _FullscreenApi = require('./fullscreen-api.js');

var _FullscreenApi2 = _interopRequireWildcard(_FullscreenApi);

var _MediaError = require('./media-error.js');

var _MediaError2 = _interopRequireWildcard(_MediaError);

var _Options = require('./options.js');

var _Options2 = _interopRequireWildcard(_Options);

var _safeParseTuple = require('safe-json-parse/tuple');

var _safeParseTuple2 = _interopRequireWildcard(_safeParseTuple);

var _window = require('global/window');

var _window2 = _interopRequireWildcard(_window);

var _document = require('global/document');

var _document2 = _interopRequireWildcard(_document);

// Include required child components

var _MediaLoader = require('./tech/loader.js');

var _MediaLoader2 = _interopRequireWildcard(_MediaLoader);

var _Poster = require('./poster-image.js');

var _Poster2 = _interopRequireWildcard(_Poster);

var _TextTrackDisplay = require('./tracks/text-track-display.js');

var _TextTrackDisplay2 = _interopRequireWildcard(_TextTrackDisplay);

var _LoadingSpinner = require('./loading-spinner.js');

var _LoadingSpinner2 = _interopRequireWildcard(_LoadingSpinner);

var _BigPlayButton = require('./big-play-button.js');

var _BigPlayButton2 = _interopRequireWildcard(_BigPlayButton);

var _controlBar = require('./control-bar/control-bar.js');

var _controlBar2 = _interopRequireWildcard(_controlBar);

var _ErrorDisplay = require('./error-display.js');

var _ErrorDisplay2 = _interopRequireWildcard(_ErrorDisplay);

var _TextTrackSettings = require('./tracks/text-track-settings.js');

var _TextTrackSettings2 = _interopRequireWildcard(_TextTrackSettings);

// Require html5 for disposing the original video tag

var _Html5 = require('./tech/html5.js');

var _Html52 = _interopRequireWildcard(_Html5);

/**
 * An instance of the `Player` class is created when any of the Video.js setup methods are used to initialize a video.
 *
 * ```js
 * var myPlayer = videojs('example_video_1');
 * ```
 *
 * In the following example, the `data-setup` attribute tells the Video.js library to create a player instance when the library is ready.
 *
 * ```html
 * <video id="example_video_1" data-setup='{}' controls>
 *   <source src="my-source.mp4" type="video/mp4">
 * </video>
 * ```
 *
 * After an instance has been created it can be accessed globally using `Video('example_video_1')`.
 *
 * @class
 * @extends Component
 */

var Player = (function (_Component) {

  /**
   * player's constructor function
   *
   * @constructs
   * @method init
   * @param {Element} tag        The original video tag used for configuring options
   * @param {Object=} options    Player options
   * @param {Function=} ready    Ready callback function
   */

  function Player(tag, options, ready) {
    _classCallCheck(this, Player);

    // Make sure tag ID exists
    tag.id = tag.id || 'vjs_video_' + Lib.guid++;

    // Set Options
    // The options argument overrides options set in the video tag
    // which overrides globally set options.
    // This latter part coincides with the load order
    // (tag must exist before Player)
    options = Lib.obj.merge(Player.getTagSettings(tag), options);

    // Delay the initialization of children because we need to set up
    // player properties first, and can't use `this` before `super()`
    options.initChildren = false;

    // Same with creating the element
    options.createEl = false;

    // we don't want the player to report touch activity on itself
    // see enableTouchActivity in Component
    options.reportTouchActivity = false;

    // Run base component initializing with new options
    _get(Object.getPrototypeOf(Player.prototype), 'constructor', this).call(this, null, options, ready);

    // if the global option object was accidentally blown away by
    // someone, bail early with an informative error
    if (!this.options_ || !this.options_.techOrder || !this.options_.techOrder.length) {
      throw new Error('No techOrder specified. Did you overwrite ' + 'videojs.options instead of just changing the ' + 'properties you want to override?');
    }

    this.tag = tag; // Store the original tag used to set options

    // Store the tag attributes used to restore html5 element
    this.tagAttributes = tag && Lib.getElementAttributes(tag);

    // Update Current Language
    this.language_ = options.language || _Options2['default'].language;

    // Update Supported Languages
    this.languages_ = options.languages || _Options2['default'].languages;

    // Cache for video property values.
    this.cache_ = {};

    // Set poster
    this.poster_ = options.poster || '';

    // Set controls
    this.controls_ = !!options.controls;
    // Original tag settings stored in options
    // now remove immediately so native controls don't flash.
    // May be turned back on by HTML5 tech if nativeControlsForTouch is true
    tag.controls = false;

    /**
    * Store the internal state of scrubbing
    * @private
    * @return {Boolean} True if the user is scrubbing
    */
    this.scrubbing_ = false;

    this.el_ = this.createEl();

    // Load plugins
    if (options.plugins) {
      Lib.obj.each(options.plugins, function (key, val) {
        this[key](val);
      }, this);
    }

    this.initChildren();

    // Set isAudio based on whether or not an audio tag was used
    this.isAudio(tag.nodeName.toLowerCase() === 'audio');

    // Update controls className. Can't do this when the controls are initially
    // set because the element doesn't exist yet.
    if (this.controls()) {
      this.addClass('vjs-controls-enabled');
    } else {
      this.addClass('vjs-controls-disabled');
    }

    if (this.isAudio()) {
      this.addClass('vjs-audio');
    }

    if (this.flexNotSupported_()) {
      this.addClass('vjs-no-flex');
    }

    // TODO: Make this smarter. Toggle user state between touching/mousing
    // using events, since devices can have both touch and mouse events.
    // if (Lib.TOUCH_ENABLED) {
    //   this.addClass('vjs-touch-enabled');
    // }

    // Make player easily findable by ID
    Player.players[this.id_] = this;

    // When the player is first initialized, trigger activity so components
    // like the control bar show themselves if needed
    this.userActive_ = true;
    this.reportUserActivity();
    this.listenForUserActivity();
  }

  _inherits(Player, _Component);

  _createClass(Player, [{
    key: 'dispose',

    /**
     * Destroys the video player and does any necessary cleanup
     *
     *     myPlayer.dispose();
     *
     * This is especially helpful if you are dynamically adding and removing videos
     * to/from the DOM.
     */
    value: function dispose() {
      this.trigger('dispose');
      // prevent dispose from being called twice
      this.off('dispose');

      // Kill reference to this player
      Player.players[this.id_] = null;
      if (this.tag && this.tag.player) {
        this.tag.player = null;
      }
      if (this.el_ && this.el_.player) {
        this.el_.player = null;
      }

      if (this.tech) {
        this.tech.dispose();
      }

      _get(Object.getPrototypeOf(Player.prototype), 'dispose', this).call(this);
    }
  }, {
    key: 'createEl',
    value: function createEl() {
      var el = this.el_ = _get(Object.getPrototypeOf(Player.prototype), 'createEl', this).call(this, 'div');
      var tag = this.tag;

      // Remove width/height attrs from tag so CSS can make it 100% width/height
      tag.removeAttribute('width');
      tag.removeAttribute('height');

      // Copy over all the attributes from the tag, including ID and class
      // ID will now reference player box, not the video tag
      var attrs = Lib.getElementAttributes(tag);
      Lib.obj.each(attrs, function (attr) {
        // workaround so we don't totally break IE7
        // http://stackoverflow.com/questions/3653444/css-styles-not-applied-on-dynamic-elements-in-internet-explorer-7
        if (attr == 'class') {
          el.className = attrs[attr];
        } else {
          el.setAttribute(attr, attrs[attr]);
        }
      });

      // Update tag id/class for use as HTML5 playback tech
      // Might think we should do this after embedding in container so .vjs-tech class
      // doesn't flash 100% width/height, but class only applies with .video-js parent
      tag.id += '_html5_api';
      tag.className = 'vjs-tech';

      // Make player findable on elements
      tag.player = el.player = this;
      // Default state of video is paused
      this.addClass('vjs-paused');

      // Make box use width/height of tag, or rely on default implementation
      // Enforce with CSS since width/height attrs don't work on divs
      this.width(this.options_.width, true); // (true) Skip resize listener on load
      this.height(this.options_.height, true);

      // Lib.insertFirst seems to cause the networkState to flicker from 3 to 2, so
      // keep track of the original for later so we can know if the source originally failed
      tag.initNetworkState_ = tag.networkState;

      // Wrap video tag in div (el/box) container
      if (tag.parentNode) {
        tag.parentNode.insertBefore(el, tag);
      }
      Lib.insertFirst(tag, el); // Breaks iPhone, fixed in HTML5 setup.

      // The event listeners need to be added before the children are added
      // in the component init because the tech (loaded with mediaLoader) may
      // fire events, like loadstart, that these events need to capture.
      // Long term it might be better to expose a way to do this in component.init
      // like component.initEventListeners() that runs between el creation and
      // adding children
      this.el_ = el;
      this.on('loadstart', this.handleLoadStart);
      this.on('waiting', this.handleWaiting);
      this.on(['canplay', 'canplaythrough', 'playing', 'ended'], this.handleWaitEnd);
      this.on('seeking', this.handleSeeking);
      this.on('seeked', this.handleSeeked);
      this.on('ended', this.handleEnded);
      this.on('play', this.handlePlay);
      this.on('firstplay', this.handleFirstPlay);
      this.on('pause', this.handlePause);
      this.on('progress', this.handleProgress);
      this.on('durationchange', this.handleDurationChange);
      this.on('fullscreenchange', this.handleFullscreenChange);

      return el;
    }
  }, {
    key: 'loadTech',

    /**
     * Load the Media Playback Technology (tech)
     * Load/Create an instance of playback technology including element and API methods
     * And append playback element in player div.
     */
    value: function loadTech(techName, source) {

      // Pause and remove current playback technology
      if (this.tech) {
        this.unloadTech();
      }

      // get rid of the HTML5 video tag as soon as we are using another tech
      if (techName !== 'Html5' && this.tag) {
        _Component3['default'].getComponent('Html5').disposeMediaElement(this.tag);
        this.tag = null;
      }

      this.techName = techName;

      // Turn off API access because we're loading a new tech that might load asynchronously
      this.isReady_ = false;

      var techReady = function techReady() {
        this.player_.triggerReady();
      };

      // Grab tech-specific options from player options and add source and parent element to use.
      var techOptions = Lib.obj.merge({ source: source, parentEl: this.el_ }, this.options_[techName.toLowerCase()]);

      if (source) {
        this.currentType_ = source.type;
        if (source.src == this.cache_.src && this.cache_.currentTime > 0) {
          techOptions.startTime = this.cache_.currentTime;
        }

        this.cache_.src = source.src;
      }

      // Initialize tech instance
      var techComponent = _Component3['default'].getComponent(techName);
      this.tech = new techComponent(this, techOptions);

      this.tech.ready(techReady);
    }
  }, {
    key: 'unloadTech',
    value: function unloadTech() {
      this.isReady_ = false;

      this.tech.dispose();

      this.tech = false;
    }
  }, {
    key: 'handleLoadStart',

    /**
     * Fired when the user agent begins looking for media data
     * @event loadstart
     */
    value: function handleLoadStart() {
      // TODO: Update to use `emptied` event instead. See #1277.

      this.removeClass('vjs-ended');

      // reset the error state
      this.error(null);

      // If it's already playing we want to trigger a firstplay event now.
      // The firstplay event relies on both the play and loadstart events
      // which can happen in any order for a new source
      if (!this.paused()) {
        this.trigger('firstplay');
      } else {
        // reset the hasStarted state
        this.hasStarted(false);
      }
    }
  }, {
    key: 'hasStarted',
    value: (function (_hasStarted) {
      function hasStarted(_x) {
        return _hasStarted.apply(this, arguments);
      }

      hasStarted.toString = function () {
        return hasStarted.toString();
      };

      return hasStarted;
    })(function (hasStarted) {
      if (hasStarted !== undefined) {
        // only update if this is a new value
        if (this.hasStarted_ !== hasStarted) {
          this.hasStarted_ = hasStarted;
          if (hasStarted) {
            this.addClass('vjs-has-started');
            // trigger the firstplay event if this newly has played
            this.trigger('firstplay');
          } else {
            this.removeClass('vjs-has-started');
          }
        }
        return this;
      }
      return !!this.hasStarted_;
    })
  }, {
    key: 'handlePlay',

    /**
     * Fired whenever the media begins or resumes playback
     * @event play
     */
    value: function handlePlay() {
      this.removeClass('vjs-ended');
      this.removeClass('vjs-paused');
      this.addClass('vjs-playing');

      // hide the poster when the user hits play
      // https://html.spec.whatwg.org/multipage/embedded-content.html#dom-media-play
      this.hasStarted(true);
    }
  }, {
    key: 'handleWaiting',

    /**
     * Fired whenever the media begins waiting
     * @event waiting
     */
    value: function handleWaiting() {
      this.addClass('vjs-waiting');
    }
  }, {
    key: 'handleWaitEnd',

    /**
     * A handler for events that signal that waiting has ended
     * which is not consistent between browsers. See #1351
     * @private
     */
    value: function handleWaitEnd() {
      this.removeClass('vjs-waiting');
    }
  }, {
    key: 'handleSeeking',

    /**
     * Fired whenever the player is jumping to a new time
     * @event seeking
     */
    value: function handleSeeking() {
      this.addClass('vjs-seeking');
    }
  }, {
    key: 'handleSeeked',

    /**
     * Fired when the player has finished jumping to a new time
     * @event seeked
     */
    value: function handleSeeked() {
      this.removeClass('vjs-seeking');
    }
  }, {
    key: 'handleFirstPlay',

    /**
     * Fired the first time a video is played
     *
     * Not part of the HLS spec, and we're not sure if this is the best
     * implementation yet, so use sparingly. If you don't have a reason to
     * prevent playback, use `myPlayer.one('play');` instead.
     *
     * @event firstplay
     */
    value: function handleFirstPlay() {
      //If the first starttime attribute is specified
      //then we will start at the given offset in seconds
      if (this.options_.starttime) {
        this.currentTime(this.options_.starttime);
      }

      this.addClass('vjs-has-started');
    }
  }, {
    key: 'handlePause',

    /**
     * Fired whenever the media has been paused
     * @event pause
     */
    value: function handlePause() {
      this.removeClass('vjs-playing');
      this.addClass('vjs-paused');
    }
  }, {
    key: 'handleProgress',

    /**
     * Fired while the user agent is downloading media data
     * @event progress
     */
    value: function handleProgress() {
      // Add custom event for when source is finished downloading.
      if (this.bufferedPercent() == 1) {
        this.trigger('loadedalldata');
      }
    }
  }, {
    key: 'handleEnded',

    /**
     * Fired when the end of the media resource is reached (currentTime == duration)
     * @event ended
     */
    value: function handleEnded() {
      this.addClass('vjs-ended');
      if (this.options_.loop) {
        this.currentTime(0);
        this.play();
      } else if (!this.paused()) {
        this.pause();
      }
    }
  }, {
    key: 'handleDurationChange',

    /**
     * Fired when the duration of the media resource is first known or changed
     * @event durationchange
     */
    value: function handleDurationChange() {
      // Allows for caching value instead of asking player each time.
      // We need to get the techGet response and check for a value so we don't
      // accidentally cause the stack to blow up.
      var duration = this.techGet('duration');
      if (duration) {
        if (duration < 0) {
          duration = Infinity;
        }
        this.duration(duration);
        // Determine if the stream is live and propagate styles down to UI.
        if (duration === Infinity) {
          this.addClass('vjs-live');
        } else {
          this.removeClass('vjs-live');
        }
      }
    }
  }, {
    key: 'handleFullscreenChange',

    /**
     * Fired when the player switches in or out of fullscreen mode
     * @event fullscreenchange
     */
    value: function handleFullscreenChange() {
      if (this.isFullscreen()) {
        this.addClass('vjs-fullscreen');
      } else {
        this.removeClass('vjs-fullscreen');
      }
    }
  }, {
    key: 'getCache',

    /**
     * Object for cached values.
     */
    value: function getCache() {
      return this.cache_;
    }
  }, {
    key: 'techCall',

    // Pass values to the playback tech
    value: function techCall(method, arg) {
      // If it's not ready yet, call method when it is
      if (this.tech && !this.tech.isReady_) {
        this.tech.ready(function () {
          this[method](arg);
        });

        // Otherwise call method now
      } else {
        try {
          this.tech[method](arg);
        } catch (e) {
          Lib.log(e);
          throw e;
        }
      }
    }
  }, {
    key: 'techGet',

    // Get calls can't wait for the tech, and sometimes don't need to.
    value: function techGet(method) {
      if (this.tech && this.tech.isReady_) {

        // Flash likes to die and reload when you hide or reposition it.
        // In these cases the object methods go away and we get errors.
        // When that happens we'll catch the errors and inform tech that it's not ready any more.
        try {
          return this.tech[method]();
        } catch (e) {
          // When building additional tech libs, an expected method may not be defined yet
          if (this.tech[method] === undefined) {
            Lib.log('Video.js: ' + method + ' method not defined for ' + this.techName + ' playback technology.', e);
          } else {
            // When a method isn't available on the object it throws a TypeError
            if (e.name == 'TypeError') {
              Lib.log('Video.js: ' + method + ' unavailable on ' + this.techName + ' playback technology element.', e);
              this.tech.isReady_ = false;
            } else {
              Lib.log(e);
            }
          }
          throw e;
        }
      }

      return;
    }
  }, {
    key: 'play',

    /**
     * start media playback
     *
     *     myPlayer.play();
     *
     * @return {Player} self
     */
    value: function play() {
      this.techCall('play');
      return this;
    }
  }, {
    key: 'pause',

    /**
     * Pause the video playback
     *
     *     myPlayer.pause();
     *
     * @return {Player} self
     */
    value: function pause() {
      this.techCall('pause');
      return this;
    }
  }, {
    key: 'paused',

    /**
     * Check if the player is paused
     *
     *     var isPaused = myPlayer.paused();
     *     var isPlaying = !myPlayer.paused();
     *
     * @return {Boolean} false if the media is currently playing, or true otherwise
     */
    value: function paused() {
      // The initial state of paused should be true (in Safari it's actually false)
      return this.techGet('paused') === false ? false : true;
    }
  }, {
    key: 'scrubbing',

    /**
    * Returns whether or not the user is "scrubbing". Scrubbing is when the user
    * has clicked the progress bar handle and is dragging it along the progress bar.
    * @param  {Boolean} isScrubbing   True/false the user is scrubbing
    * @return {Boolean}               The scrubbing status when getting
    * @return {Object}                The player when setting
    */
    value: function scrubbing(isScrubbing) {
      if (isScrubbing !== undefined) {
        this.scrubbing_ = !!isScrubbing;

        if (isScrubbing) {
          this.addClass('vjs-scrubbing');
        } else {
          this.removeClass('vjs-scrubbing');
        }

        return this;
      }

      return this.scrubbing_;
    }
  }, {
    key: 'currentTime',

    /**
     * Get or set the current time (in seconds)
     *
     *     // get
     *     var whereYouAt = myPlayer.currentTime();
     *
     *     // set
     *     myPlayer.currentTime(120); // 2 minutes into the video
     *
     * @param  {Number|String=} seconds The time to seek to
     * @return {Number}        The time in seconds, when not setting
     * @return {Player}    self, when the current time is set
     */
    value: function currentTime(seconds) {
      if (seconds !== undefined) {

        this.techCall('setCurrentTime', seconds);

        return this;
      }

      // cache last currentTime and return. default to 0 seconds
      //
      // Caching the currentTime is meant to prevent a massive amount of reads on the tech's
      // currentTime when scrubbing, but may not provide much performance benefit afterall.
      // Should be tested. Also something has to read the actual current time or the cache will
      // never get updated.
      return this.cache_.currentTime = this.techGet('currentTime') || 0;
    }
  }, {
    key: 'duration',

    /**
     * Get the length in time of the video in seconds
     *
     *     var lengthOfVideo = myPlayer.duration();
     *
     * **NOTE**: The video must have started loading before the duration can be
     * known, and in the case of Flash, may not be known until the video starts
     * playing.
     *
     * @return {Number} The duration of the video in seconds
     */
    value: function duration(seconds) {
      if (seconds !== undefined) {

        // cache the last set value for optimized scrubbing (esp. Flash)
        this.cache_.duration = parseFloat(seconds);

        return this;
      }

      if (this.cache_.duration === undefined) {
        this.handleDurationChange();
      }

      return this.cache_.duration || 0;
    }
  }, {
    key: 'remainingTime',

    /**
     * Calculates how much time is left.
     *
     *     var timeLeft = myPlayer.remainingTime();
     *
     * Not a native video element function, but useful
     * @return {Number} The time remaining in seconds
     */
    value: function remainingTime() {
      return this.duration() - this.currentTime();
    }
  }, {
    key: 'buffered',

    // http://dev.w3.org/html5/spec/video.html#dom-media-buffered
    // Buffered returns a timerange object.
    // Kind of like an array of portions of the video that have been downloaded.

    /**
     * Get a TimeRange object with the times of the video that have been downloaded
     *
     * If you just want the percent of the video that's been downloaded,
     * use bufferedPercent.
     *
     *     // Number of different ranges of time have been buffered. Usually 1.
     *     numberOfRanges = bufferedTimeRange.length,
     *
     *     // Time in seconds when the first range starts. Usually 0.
     *     firstRangeStart = bufferedTimeRange.start(0),
     *
     *     // Time in seconds when the first range ends
     *     firstRangeEnd = bufferedTimeRange.end(0),
     *
     *     // Length in seconds of the first time range
     *     firstRangeLength = firstRangeEnd - firstRangeStart;
     *
     * @return {Object} A mock TimeRange object (following HTML spec)
     */
    value: (function (_buffered) {
      function buffered() {
        return _buffered.apply(this, arguments);
      }

      buffered.toString = function () {
        return buffered.toString();
      };

      return buffered;
    })(function () {
      var buffered = this.techGet('buffered');

      if (!buffered || !buffered.length) {
        buffered = Lib.createTimeRange(0, 0);
      }

      return buffered;
    })
  }, {
    key: 'bufferedPercent',

    /**
     * Get the percent (as a decimal) of the video that's been downloaded
     *
     *     var howMuchIsDownloaded = myPlayer.bufferedPercent();
     *
     * 0 means none, 1 means all.
     * (This method isn't in the HTML5 spec, but it's very convenient)
     *
     * @return {Number} A decimal between 0 and 1 representing the percent
     */
    value: function bufferedPercent() {
      var duration = this.duration(),
          buffered = this.buffered(),
          bufferedDuration = 0,
          start,
          end;

      if (!duration) {
        return 0;
      }

      for (var i = 0; i < buffered.length; i++) {
        start = buffered.start(i);
        end = buffered.end(i);

        // buffered end can be bigger than duration by a very small fraction
        if (end > duration) {
          end = duration;
        }

        bufferedDuration += end - start;
      }

      return bufferedDuration / duration;
    }
  }, {
    key: 'bufferedEnd',

    /**
     * Get the ending time of the last buffered time range
     *
     * This is used in the progress bar to encapsulate all time ranges.
     * @return {Number} The end of the last buffered time range
     */
    value: function bufferedEnd() {
      var buffered = this.buffered(),
          duration = this.duration(),
          end = buffered.end(buffered.length - 1);

      if (end > duration) {
        end = duration;
      }

      return end;
    }
  }, {
    key: 'volume',

    /**
     * Get or set the current volume of the media
     *
     *     // get
     *     var howLoudIsIt = myPlayer.volume();
     *
     *     // set
     *     myPlayer.volume(0.5); // Set volume to half
     *
     * 0 is off (muted), 1.0 is all the way up, 0.5 is half way.
     *
     * @param  {Number} percentAsDecimal The new volume as a decimal percent
     * @return {Number}                  The current volume, when getting
     * @return {Player}              self, when setting
     */
    value: function volume(percentAsDecimal) {
      var vol = undefined;

      if (percentAsDecimal !== undefined) {
        vol = Math.max(0, Math.min(1, parseFloat(percentAsDecimal))); // Force value to between 0 and 1
        this.cache_.volume = vol;
        this.techCall('setVolume', vol);
        Lib.setLocalStorage('volume', vol);
        return this;
      }

      // Default to 1 when returning current volume.
      vol = parseFloat(this.techGet('volume'));
      return isNaN(vol) ? 1 : vol;
    }
  }, {
    key: 'muted',

    /**
     * Get the current muted state, or turn mute on or off
     *
     *     // get
     *     var isVolumeMuted = myPlayer.muted();
     *
     *     // set
     *     myPlayer.muted(true); // mute the volume
     *
     * @param  {Boolean=} muted True to mute, false to unmute
     * @return {Boolean} True if mute is on, false if not, when getting
     * @return {Player} self, when setting mute
     */
    value: (function (_muted) {
      function muted(_x2) {
        return _muted.apply(this, arguments);
      }

      muted.toString = function () {
        return muted.toString();
      };

      return muted;
    })(function (muted) {
      if (muted !== undefined) {
        this.techCall('setMuted', muted);
        return this;
      }
      return this.techGet('muted') || false; // Default to false
    })
  }, {
    key: 'supportsFullScreen',

    // Check if current tech can support native fullscreen
    // (e.g. with built in controls like iOS, so not our flash swf)
    value: function supportsFullScreen() {
      return this.techGet('supportsFullScreen') || false;
    }
  }, {
    key: 'isFullscreen',

    /**
     * Check if the player is in fullscreen mode
     *
     *     // get
     *     var fullscreenOrNot = myPlayer.isFullscreen();
     *
     *     // set
     *     myPlayer.isFullscreen(true); // tell the player it's in fullscreen
     *
     * NOTE: As of the latest HTML5 spec, isFullscreen is no longer an official
     * property and instead document.fullscreenElement is used. But isFullscreen is
     * still a valuable property for internal player workings.
     *
     * @param  {Boolean=} isFS Update the player's fullscreen state
     * @return {Boolean} true if fullscreen, false if not
     * @return {Player} self, when setting
     */
    value: function isFullscreen(isFS) {
      if (isFS !== undefined) {
        this.isFullscreen_ = !!isFS;
        return this;
      }
      return !!this.isFullscreen_;
    }
  }, {
    key: 'isFullScreen',

    /**
     * Old naming for isFullscreen()
     * @deprecated for lowercase 's' version
     */
    value: function isFullScreen(isFS) {
      Lib.log.warn('player.isFullScreen() has been deprecated, use player.isFullscreen() with a lowercase "s")');
      return this.isFullscreen(isFS);
    }
  }, {
    key: 'requestFullscreen',

    /**
     * Increase the size of the video to full screen
     *
     *     myPlayer.requestFullscreen();
     *
     * In some browsers, full screen is not supported natively, so it enters
     * "full window mode", where the video fills the browser window.
     * In browsers and devices that support native full screen, sometimes the
     * browser's default controls will be shown, and not the Video.js custom skin.
     * This includes most mobile devices (iOS, Android) and older versions of
     * Safari.
     *
     * @return {Player} self
     */
    value: function requestFullscreen() {
      var fsApi = _FullscreenApi2['default'];

      this.isFullscreen(true);

      if (fsApi) {
        // the browser supports going fullscreen at the element level so we can
        // take the controls fullscreen as well as the video

        // Trigger fullscreenchange event after change
        // We have to specifically add this each time, and remove
        // when canceling fullscreen. Otherwise if there's multiple
        // players on a page, they would all be reacting to the same fullscreen
        // events
        Events.on(_document2['default'], fsApi.fullscreenchange, Lib.bind(this, function documentFullscreenChange(e) {
          this.isFullscreen(_document2['default'][fsApi.fullscreenElement]);

          // If cancelling fullscreen, remove event listener.
          if (this.isFullscreen() === false) {
            Events.off(_document2['default'], fsApi.fullscreenchange, documentFullscreenChange);
          }

          this.trigger('fullscreenchange');
        }));

        this.el_[fsApi.requestFullscreen]();
      } else if (this.tech.supportsFullScreen()) {
        // we can't take the video.js controls fullscreen but we can go fullscreen
        // with native controls
        this.techCall('enterFullScreen');
      } else {
        // fullscreen isn't supported so we'll just stretch the video element to
        // fill the viewport
        this.enterFullWindow();
        this.trigger('fullscreenchange');
      }

      return this;
    }
  }, {
    key: 'requestFullScreen',

    /**
     * Old naming for requestFullscreen
     * @deprecated for lower case 's' version
     */
    value: function requestFullScreen() {
      Lib.log.warn('player.requestFullScreen() has been deprecated, use player.requestFullscreen() with a lowercase "s")');
      return this.requestFullscreen();
    }
  }, {
    key: 'exitFullscreen',

    /**
     * Return the video to its normal size after having been in full screen mode
     *
     *     myPlayer.exitFullscreen();
     *
     * @return {Player} self
     */
    value: function exitFullscreen() {
      var fsApi = _FullscreenApi2['default'];
      this.isFullscreen(false);

      // Check for browser element fullscreen support
      if (fsApi) {
        _document2['default'][fsApi.exitFullscreen]();
      } else if (this.tech.supportsFullScreen()) {
        this.techCall('exitFullScreen');
      } else {
        this.exitFullWindow();
        this.trigger('fullscreenchange');
      }

      return this;
    }
  }, {
    key: 'cancelFullScreen',

    /**
     * Old naming for exitFullscreen
     * @deprecated for exitFullscreen
     */
    value: function cancelFullScreen() {
      Lib.log.warn('player.cancelFullScreen() has been deprecated, use player.exitFullscreen()');
      return this.exitFullscreen();
    }
  }, {
    key: 'enterFullWindow',

    // When fullscreen isn't supported we can stretch the video container to as wide as the browser will let us.
    value: function enterFullWindow() {
      this.isFullWindow = true;

      // Storing original doc overflow value to return to when fullscreen is off
      this.docOrigOverflow = _document2['default'].documentElement.style.overflow;

      // Add listener for esc key to exit fullscreen
      Events.on(_document2['default'], 'keydown', Lib.bind(this, this.fullWindowOnEscKey));

      // Hide any scroll bars
      _document2['default'].documentElement.style.overflow = 'hidden';

      // Apply fullscreen styles
      Lib.addClass(_document2['default'].body, 'vjs-full-window');

      this.trigger('enterFullWindow');
    }
  }, {
    key: 'fullWindowOnEscKey',
    value: function fullWindowOnEscKey(event) {
      if (event.keyCode === 27) {
        if (this.isFullscreen() === true) {
          this.exitFullscreen();
        } else {
          this.exitFullWindow();
        }
      }
    }
  }, {
    key: 'exitFullWindow',
    value: function exitFullWindow() {
      this.isFullWindow = false;
      Events.off(_document2['default'], 'keydown', this.fullWindowOnEscKey);

      // Unhide scroll bars.
      _document2['default'].documentElement.style.overflow = this.docOrigOverflow;

      // Remove fullscreen styles
      Lib.removeClass(_document2['default'].body, 'vjs-full-window');

      // Resize the box, controller, and poster to original sizes
      // this.positionAll();
      this.trigger('exitFullWindow');
    }
  }, {
    key: 'selectSource',
    value: function selectSource(sources) {
      // Loop through each playback technology in the options order
      for (var i = 0, j = this.options_.techOrder; i < j.length; i++) {
        var techName = Lib.capitalize(j[i]);
        var tech = _Component3['default'].getComponent(techName);

        // Check if the current tech is defined before continuing
        if (!tech) {
          Lib.log.error('The "' + techName + '" tech is undefined. Skipped browser support check for that tech.');
          continue;
        }

        // Check if the browser supports this technology
        if (tech.isSupported()) {
          // Loop through each source object
          for (var a = 0, b = sources; a < b.length; a++) {
            var source = b[a];

            // Check if source can be played with this technology
            if (tech.canPlaySource(source)) {
              return { source: source, tech: techName };
            }
          }
        }
      }

      return false;
    }
  }, {
    key: 'src',

    /**
     * The source function updates the video source
     *
     * There are three types of variables you can pass as the argument.
     *
     * **URL String**: A URL to the the video file. Use this method if you are sure
     * the current playback technology (HTML5/Flash) can support the source you
     * provide. Currently only MP4 files can be used in both HTML5 and Flash.
     *
     *     myPlayer.src("http://www.example.com/path/to/video.mp4");
     *
     * **Source Object (or element):** A javascript object containing information
     * about the source file. Use this method if you want the player to determine if
     * it can support the file using the type information.
     *
     *     myPlayer.src({ type: "video/mp4", src: "http://www.example.com/path/to/video.mp4" });
     *
     * **Array of Source Objects:** To provide multiple versions of the source so
     * that it can be played using HTML5 across browsers you can use an array of
     * source objects. Video.js will detect which version is supported and load that
     * file.
     *
     *     myPlayer.src([
     *       { type: "video/mp4", src: "http://www.example.com/path/to/video.mp4" },
     *       { type: "video/webm", src: "http://www.example.com/path/to/video.webm" },
     *       { type: "video/ogg", src: "http://www.example.com/path/to/video.ogv" }
     *     ]);
     *
     * @param  {String|Object|Array=} source The source URL, object, or array of sources
     * @return {String} The current video source when getting
     * @return {String} The player when setting
     */
    value: function src() {
      var source = arguments[0] === undefined ? this.techGet('src') : arguments[0];

      var currentTech = _Component3['default'].getComponent(this.techName);

      // case: Array of source objects to choose from and pick the best to play
      if (Lib.obj.isArray(source)) {
        this.sourceList_(source);

        // case: URL String (http://myvideo...)
      } else if (typeof source === 'string') {
        // create a source object from the string
        this.src({ src: source });

        // case: Source object { src: '', type: '' ... }
      } else if (source instanceof Object) {
        // check if the source has a type and the loaded tech cannot play the source
        // if there's no type we'll just try the current tech
        if (source.type && !currentTech.canPlaySource(source)) {
          // create a source list with the current source and send through
          // the tech loop to check for a compatible technology
          this.sourceList_([source]);
        } else {
          this.cache_.src = source.src;
          this.currentType_ = source.type || '';

          // wait until the tech is ready to set the source
          this.ready(function () {

            // The setSource tech method was added with source handlers
            // so older techs won't support it
            // We need to check the direct prototype for the case where subclasses
            // of the tech do not support source handlers
            if (currentTech.prototype.hasOwnProperty('setSource')) {
              this.techCall('setSource', source);
            } else {
              this.techCall('src', source.src);
            }

            if (this.options_.preload == 'auto') {
              this.load();
            }

            if (this.options_.autoplay) {
              this.play();
            }
          });
        }
      }

      return this;
    }
  }, {
    key: 'sourceList_',

    /**
     * Handle an array of source objects
     * @param  {[type]} sources Array of source objects
     * @private
     */
    value: function sourceList_(sources) {
      var sourceTech = this.selectSource(sources);

      if (sourceTech) {
        if (sourceTech.tech === this.techName) {
          // if this technology is already loaded, set the source
          this.src(sourceTech.source);
        } else {
          // load this technology with the chosen source
          this.loadTech(sourceTech.tech, sourceTech.source);
        }
      } else {
        // We need to wrap this in a timeout to give folks a chance to add error event handlers
        this.setTimeout(function () {
          this.error({ code: 4, message: this.localize(this.options().notSupportedMessage) });
        }, 0);

        // we could not find an appropriate tech, but let's still notify the delegate that this is it
        // this needs a better comment about why this is needed
        this.triggerReady();
      }
    }
  }, {
    key: 'load',

    /**
     * Begin loading the src data.
     * @return {Player} Returns the player
     */
    value: function load() {
      this.techCall('load');
      return this;
    }
  }, {
    key: 'currentSrc',

    /**
     * Returns the fully qualified URL of the current source value e.g. http://mysite.com/video.mp4
     * Can be used in conjuction with `currentType` to assist in rebuilding the current source object.
     * @return {String} The current source
     */
    value: function currentSrc() {
      return this.techGet('currentSrc') || this.cache_.src || '';
    }
  }, {
    key: 'currentType',

    /**
     * Get the current source type e.g. video/mp4
     * This can allow you rebuild the current source object so that you could load the same
     * source and tech later
     * @return {String} The source MIME type
     */
    value: function currentType() {
      return this.currentType_ || '';
    }
  }, {
    key: 'preload',

    /**
     * Get or set the preload attribute.
     * @return {String} The preload attribute value when getting
     * @return {Player} Returns the player when setting
     */
    value: function preload(value) {
      if (value !== undefined) {
        this.techCall('setPreload', value);
        this.options_.preload = value;
        return this;
      }
      return this.techGet('preload');
    }
  }, {
    key: 'autoplay',

    /**
     * Get or set the autoplay attribute.
     * @return {String} The autoplay attribute value when getting
     * @return {Player} Returns the player when setting
     */
    value: function autoplay(value) {
      if (value !== undefined) {
        this.techCall('setAutoplay', value);
        this.options_.autoplay = value;
        return this;
      }
      return this.techGet('autoplay', value);
    }
  }, {
    key: 'loop',

    /**
     * Get or set the loop attribute on the video element.
     * @return {String} The loop attribute value when getting
     * @return {Player} Returns the player when setting
     */
    value: function loop(value) {
      if (value !== undefined) {
        this.techCall('setLoop', value);
        this.options_.loop = value;
        return this;
      }
      return this.techGet('loop');
    }
  }, {
    key: 'poster',

    /**
     * get or set the poster image source url
     *
     * ##### EXAMPLE:
     *
     *     // getting
     *     var currentPoster = myPlayer.poster();
     *
     *     // setting
     *     myPlayer.poster('http://example.com/myImage.jpg');
     *
     * @param  {String=} [src] Poster image source URL
     * @return {String} poster URL when getting
     * @return {Player} self when setting
     */
    value: function poster(src) {
      if (src === undefined) {
        return this.poster_;
      }

      // The correct way to remove a poster is to set as an empty string
      // other falsey values will throw errors
      if (!src) {
        src = '';
      }

      // update the internal poster variable
      this.poster_ = src;

      // update the tech's poster
      this.techCall('setPoster', src);

      // alert components that the poster has been set
      this.trigger('posterchange');

      return this;
    }
  }, {
    key: 'controls',

    /**
     * Get or set whether or not the controls are showing.
     * @param  {Boolean} controls Set controls to showing or not
     * @return {Boolean}    Controls are showing
     */
    value: function controls(bool) {
      if (bool !== undefined) {
        bool = !!bool; // force boolean
        // Don't trigger a change event unless it actually changed
        if (this.controls_ !== bool) {
          this.controls_ = bool;
          if (bool) {
            this.removeClass('vjs-controls-disabled');
            this.addClass('vjs-controls-enabled');
            this.trigger('controlsenabled');
          } else {
            this.removeClass('vjs-controls-enabled');
            this.addClass('vjs-controls-disabled');
            this.trigger('controlsdisabled');
          }
        }
        return this;
      }
      return !!this.controls_;
    }
  }, {
    key: 'usingNativeControls',

    /**
     * Toggle native controls on/off. Native controls are the controls built into
     * devices (e.g. default iPhone controls), Flash, or other techs
     * (e.g. Vimeo Controls)
     *
     * **This should only be set by the current tech, because only the tech knows
     * if it can support native controls**
     *
     * @param  {Boolean} bool    True signals that native controls are on
     * @return {Player}      Returns the player
     * @private
     */
    value: function usingNativeControls(bool) {
      if (bool !== undefined) {
        bool = !!bool; // force boolean
        // Don't trigger a change event unless it actually changed
        if (this.usingNativeControls_ !== bool) {
          this.usingNativeControls_ = bool;
          if (bool) {
            this.addClass('vjs-using-native-controls');

            /**
             * player is using the native device controls
             *
             * @event usingnativecontrols
             * @memberof Player
             * @instance
             * @private
             */
            this.trigger('usingnativecontrols');
          } else {
            this.removeClass('vjs-using-native-controls');

            /**
             * player is using the custom HTML controls
             *
             * @event usingcustomcontrols
             * @memberof Player
             * @instance
             * @private
             */
            this.trigger('usingcustomcontrols');
          }
        }
        return this;
      }
      return !!this.usingNativeControls_;
    }
  }, {
    key: 'error',

    /**
     * Set or get the current MediaError
     * @param  {*} err A MediaError or a String/Number to be turned into a MediaError
     * @return {MediaError|null}     when getting
     * @return {Player}              when setting
     */
    value: function error(err) {
      if (err === undefined) {
        return this.error_ || null;
      }

      // restoring to default
      if (err === null) {
        this.error_ = err;
        this.removeClass('vjs-error');
        return this;
      }

      // error instance
      if (err instanceof _MediaError2['default']) {
        this.error_ = err;
      } else {
        this.error_ = new _MediaError2['default'](err);
      }

      // fire an error event on the player
      this.trigger('error');

      // add the vjs-error classname to the player
      this.addClass('vjs-error');

      // log the name of the error type and any message
      // ie8 just logs "[object object]" if you just log the error object
      Lib.log.error('(CODE:' + this.error_.code + ' ' + _MediaError2['default'].errorTypes[this.error_.code] + ')', this.error_.message, this.error_);

      return this;
    }
  }, {
    key: 'ended',

    /**
     * Returns whether or not the player is in the "ended" state.
     * @return {Boolean} True if the player is in the ended state, false if not.
     */
    value: function ended() {
      return this.techGet('ended');
    }
  }, {
    key: 'seeking',

    /**
     * Returns whether or not the player is in the "seeking" state.
     * @return {Boolean} True if the player is in the seeking state, false if not.
     */
    value: function seeking() {
      return this.techGet('seeking');
    }
  }, {
    key: 'reportUserActivity',
    value: function reportUserActivity(event) {
      this.userActivity_ = true;
    }
  }, {
    key: 'userActive',
    value: function userActive(bool) {
      if (bool !== undefined) {
        bool = !!bool;
        if (bool !== this.userActive_) {
          this.userActive_ = bool;
          if (bool) {
            // If the user was inactive and is now active we want to reset the
            // inactivity timer
            this.userActivity_ = true;
            this.removeClass('vjs-user-inactive');
            this.addClass('vjs-user-active');
            this.trigger('useractive');
          } else {
            // We're switching the state to inactive manually, so erase any other
            // activity
            this.userActivity_ = false;

            // Chrome/Safari/IE have bugs where when you change the cursor it can
            // trigger a mousemove event. This causes an issue when you're hiding
            // the cursor when the user is inactive, and a mousemove signals user
            // activity. Making it impossible to go into inactive mode. Specifically
            // this happens in fullscreen when we really need to hide the cursor.
            //
            // When this gets resolved in ALL browsers it can be removed
            // https://code.google.com/p/chromium/issues/detail?id=103041
            if (this.tech) {
              this.tech.one('mousemove', function (e) {
                e.stopPropagation();
                e.preventDefault();
              });
            }

            this.removeClass('vjs-user-active');
            this.addClass('vjs-user-inactive');
            this.trigger('userinactive');
          }
        }
        return this;
      }
      return this.userActive_;
    }
  }, {
    key: 'listenForUserActivity',
    value: function listenForUserActivity() {
      var mouseInProgress = undefined,
          lastMoveX = undefined,
          lastMoveY = undefined;

      var handleActivity = Lib.bind(this, this.reportUserActivity);

      var handleMouseMove = function handleMouseMove(e) {
        // #1068 - Prevent mousemove spamming
        // Chrome Bug: https://code.google.com/p/chromium/issues/detail?id=366970
        if (e.screenX != lastMoveX || e.screenY != lastMoveY) {
          lastMoveX = e.screenX;
          lastMoveY = e.screenY;
          handleActivity();
        }
      };

      var handleMouseDown = function handleMouseDown() {
        handleActivity();
        // For as long as the they are touching the device or have their mouse down,
        // we consider them active even if they're not moving their finger or mouse.
        // So we want to continue to update that they are active
        this.clearInterval(mouseInProgress);
        // Setting userActivity=true now and setting the interval to the same time
        // as the activityCheck interval (250) should ensure we never miss the
        // next activityCheck
        mouseInProgress = this.setInterval(handleActivity, 250);
      };

      var handleMouseUp = function handleMouseUp(event) {
        handleActivity();
        // Stop the interval that maintains activity if the mouse/touch is down
        this.clearInterval(mouseInProgress);
      };

      // Any mouse movement will be considered user activity
      this.on('mousedown', handleMouseDown);
      this.on('mousemove', handleMouseMove);
      this.on('mouseup', handleMouseUp);

      // Listen for keyboard navigation
      // Shouldn't need to use inProgress interval because of key repeat
      this.on('keydown', handleActivity);
      this.on('keyup', handleActivity);

      // Run an interval every 250 milliseconds instead of stuffing everything into
      // the mousemove/touchmove function itself, to prevent performance degradation.
      // `this.reportUserActivity` simply sets this.userActivity_ to true, which
      // then gets picked up by this loop
      // http://ejohn.org/blog/learning-from-twitter/
      var activityCheck = this.setInterval(function () {
        var inactivityTimeout = undefined;

        // Check to see if mouse/touch activity has happened
        if (this.userActivity_) {
          // Reset the activity tracker
          this.userActivity_ = false;

          // If the user state was inactive, set the state to active
          this.userActive(true);

          // Clear any existing inactivity timeout to start the timer over
          this.clearTimeout(inactivityTimeout);

          var timeout = this.options().inactivityTimeout;
          if (timeout > 0) {
            // In <timeout> milliseconds, if no more activity has occurred the
            // user will be considered inactive
            inactivityTimeout = this.setTimeout(function () {
              // Protect against the case where the inactivityTimeout can trigger just
              // before the next user activity is picked up by the activityCheck loop
              // causing a flicker
              if (!this.userActivity_) {
                this.userActive(false);
              }
            }, timeout);
          }
        }
      }, 250);
    }
  }, {
    key: 'playbackRate',

    /**
     * Gets or sets the current playback rate.  A playback rate of
     * 1.0 represents normal speed and 0.5 would indicate half-speed
     * playback, for instance.
     * @param  {Number} rate    New playback rate to set.
     * @return {Number}         Returns the new playback rate when setting
     * @return {Number}         Returns the current playback rate when getting
     * @see https://html.spec.whatwg.org/multipage/embedded-content.html#dom-media-playbackrate
     */
    value: function playbackRate(rate) {
      if (rate !== undefined) {
        this.techCall('setPlaybackRate', rate);
        return this;
      }

      if (this.tech && this.tech.featuresPlaybackRate) {
        return this.techGet('playbackRate');
      } else {
        return 1;
      }
    }
  }, {
    key: 'isAudio',

    /**
     * Gets or sets the audio flag
     *
     * @param  {Boolean} bool    True signals that this is an audio player.
     * @return {Boolean}         Returns true if player is audio, false if not when getting
     * @return {Player}      Returns the player if setting
     * @private
     */
    value: function isAudio(bool) {
      if (bool !== undefined) {
        this.isAudio_ = !!bool;
        return this;
      }

      return !!this.isAudio_;
    }
  }, {
    key: 'networkState',

    /**
     * Returns the current state of network activity for the element, from
     * the codes in the list below.
     * - NETWORK_EMPTY (numeric value 0)
     *   The element has not yet been initialised. All attributes are in
     *   their initial states.
     * - NETWORK_IDLE (numeric value 1)
     *   The element's resource selection algorithm is active and has
     *   selected a resource, but it is not actually using the network at
     *   this time.
     * - NETWORK_LOADING (numeric value 2)
     *   The user agent is actively trying to download data.
     * - NETWORK_NO_SOURCE (numeric value 3)
     *   The element's resource selection algorithm is active, but it has
     *   not yet found a resource to use.
     * @return {Number} the current network activity state
     * @see https://html.spec.whatwg.org/multipage/embedded-content.html#network-states
     */
    value: function networkState() {
      return this.techGet('networkState');
    }
  }, {
    key: 'readyState',

    /**
     * Returns a value that expresses the current state of the element
     * with respect to rendering the current playback position, from the
     * codes in the list below.
     * - HAVE_NOTHING (numeric value 0)
     *   No information regarding the media resource is available.
     * - HAVE_METADATA (numeric value 1)
     *   Enough of the resource has been obtained that the duration of the
     *   resource is available.
     * - HAVE_CURRENT_DATA (numeric value 2)
     *   Data for the immediate current playback position is available.
     * - HAVE_FUTURE_DATA (numeric value 3)
     *   Data for the immediate current playback position is available, as
     *   well as enough data for the user agent to advance the current
     *   playback position in the direction of playback.
     * - HAVE_ENOUGH_DATA (numeric value 4)
     *   The user agent estimates that enough data is available for
     *   playback to proceed uninterrupted.
     * @return {Number} the current playback rendering state
     * @see https://html.spec.whatwg.org/multipage/embedded-content.html#dom-media-readystate
     */
    value: function readyState() {
      return this.techGet('readyState');
    }
  }, {
    key: 'textTracks',

    /**
     * Text tracks are tracks of timed text events.
     * Captions - text displayed over the video for the hearing impaired
     * Subtitles - text displayed over the video for those who don't understand language in the video
     * Chapters - text displayed in a menu allowing the user to jump to particular points (chapters) in the video
     * Descriptions (not supported yet) - audio descriptions that are read back to the user by a screen reading device
     */

    /**
     * Get an array of associated text tracks. captions, subtitles, chapters, descriptions
     * http://www.w3.org/html/wg/drafts/html/master/embedded-content-0.html#dom-media-texttracks
     * @return {Array}           Array of track objects
     */
    value: function textTracks() {
      // cannot use techGet directly because it checks to see whether the tech is ready.
      // Flash is unlikely to be ready in time but textTracks should still work.
      return this.tech && this.tech.textTracks();
    }
  }, {
    key: 'remoteTextTracks',
    value: function remoteTextTracks() {
      return this.tech && this.tech.remoteTextTracks();
    }
  }, {
    key: 'addTextTrack',

    /**
     * Add a text track
     * In addition to the W3C settings we allow adding additional info through options.
     * http://www.w3.org/html/wg/drafts/html/master/embedded-content-0.html#dom-media-addtexttrack
     * @param {String}  kind        Captions, subtitles, chapters, descriptions, or metadata
     * @param {String=} label       Optional label
     * @param {String=} language    Optional language
     */
    value: function addTextTrack(kind, label, language) {
      return this.tech && this.tech.addTextTrack(kind, label, language);
    }
  }, {
    key: 'addRemoteTextTrack',
    value: function addRemoteTextTrack(options) {
      return this.tech && this.tech.addRemoteTextTrack(options);
    }
  }, {
    key: 'removeRemoteTextTrack',
    value: function removeRemoteTextTrack(track) {
      this.tech && this.tech.removeRemoteTextTrack(track);
    }
  }, {
    key: 'language',

    // Methods to add support for
    // initialTime: function(){ return this.techCall('initialTime'); },
    // startOffsetTime: function(){ return this.techCall('startOffsetTime'); },
    // played: function(){ return this.techCall('played'); },
    // seekable: function(){ return this.techCall('seekable'); },
    // videoTracks: function(){ return this.techCall('videoTracks'); },
    // audioTracks: function(){ return this.techCall('audioTracks'); },
    // videoWidth: function(){ return this.techCall('videoWidth'); },
    // videoHeight: function(){ return this.techCall('videoHeight'); },
    // defaultPlaybackRate: function(){ return this.techCall('defaultPlaybackRate'); },
    // mediaGroup: function(){ return this.techCall('mediaGroup'); },
    // controller: function(){ return this.techCall('controller'); },
    // defaultMuted: function(){ return this.techCall('defaultMuted'); }

    // TODO
    // currentSrcList: the array of sources including other formats and bitrates
    // playList: array of source lists in order of playback

    /**
     * The player's language code
     * @param  {String} languageCode  The locale string
     * @return {String}             The locale string when getting
     * @return {Player}         self, when setting
     */
    value: function language(languageCode) {
      if (languageCode === undefined) {
        return this.language_;
      }

      this.language_ = languageCode;
      return this;
    }
  }, {
    key: 'languages',

    /**
     * Get the player's language dictionary
     */
    value: function languages() {
      return this.languages_;
    }
  }], [{
    key: 'getTagSettings',
    value: function getTagSettings(tag) {
      var baseOptions = {
        sources: [],
        tracks: []
      };

      var tagOptions = Lib.getElementAttributes(tag);
      var dataSetup = tagOptions['data-setup'];

      // Check if data-setup attr exists.
      if (dataSetup !== null) {
        // Parse options JSON
        // If empty string, make it a parsable json object.
        Lib.obj.merge(tagOptions, _safeParseTuple2['default'](dataSetup || '{}')[1]);
      }

      Lib.obj.merge(baseOptions, tagOptions);

      // Get tag children settings
      if (tag.hasChildNodes()) {
        var children = tag.childNodes;

        for (var i = 0, j = children.length; i < j; i++) {
          var child = children[i];
          // Change case needed: http://ejohn.org/blog/nodename-case-sensitivity/
          var childName = child.nodeName.toLowerCase();
          if (childName === 'source') {
            baseOptions.sources.push(Lib.getElementAttributes(child));
          } else if (childName === 'track') {
            baseOptions.tracks.push(Lib.getElementAttributes(child));
          }
        }
      }

      return baseOptions;
    }
  }]);

  return Player;
})(_Component3['default']);

/**
 * Global player list
 * @type {Object}
 */
Player.players = {};

/**
 * Player instance options, surfaced using options
 * options = Player.prototype.options_
 * Make changes in options, not here.
 * All options should use string keys so they avoid
 * renaming by closure compiler
 * @type {Object}
 * @private
 */
Player.prototype.options_ = _Options2['default'];

/**
 * Fired when the player has initial duration and dimension information
 * @event loadedmetadata
 */
Player.prototype.handleLoadedMetaData;

/**
 * Fired when the player has downloaded data at the current playback position
 * @event loadeddata
 */
Player.prototype.handleLoadedData;

/**
 * Fired when the player has finished downloading the source data
 * @event loadedalldata
 */
Player.prototype.handleLoadedAllData;

/**
 * Fired when the user is active, e.g. moves the mouse over the player
 * @event useractive
 */
Player.prototype.handleUserActive;

/**
 * Fired when the user is inactive, e.g. a short delay after the last mouse move or control interaction
 * @event userinactive
 */
Player.prototype.handleUserInactive;

/**
 * Fired when the current playback position has changed
 *
 * During playback this is fired every 15-250 milliseconds, depending on the
 * playback technology in use.
 * @event timeupdate
 */
Player.prototype.handleTimeUpdate;

/**
 * Fired when the volume changes
 * @event volumechange
 */
Player.prototype.handleVolumeChange;

/**
 * Fired when an error occurs
 * @event error
 */
Player.prototype.handleError;

Player.prototype.flexNotSupported_ = function () {
  var elem = _document2['default'].createElement('i');

  return !('flexBasis' in elem.style || 'webkitFlexBasis' in elem.style || 'mozFlexBasis' in elem.style || 'msFlexBasis' in elem.style);
};

_Component3['default'].registerComponent('Player', Player);
exports['default'] = Player;
module.exports = exports['default'];

},{"./big-play-button.js":24,"./component.js":26,"./control-bar/control-bar.js":27,"./error-display.js":60,"./events.js":62,"./fullscreen-api.js":63,"./lib.js":64,"./loading-spinner.js":65,"./media-error.js":66,"./options.js":70,"./poster-image.js":73,"./tech/html5.js":78,"./tech/loader.js":79,"./tracks/text-track-display.js":82,"./tracks/text-track-settings.js":85,"global/document":1,"global/window":2,"safe-json-parse/tuple":8}],72:[function(require,module,exports){
'use strict';

var _interopRequireWildcard = function (obj) { return obj && obj.__esModule ? obj : { 'default': obj }; };

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _Player = require('./player');

var _Player2 = _interopRequireWildcard(_Player);

/**
 * the method for registering a video.js plugin
 *
 * @param  {String} name The name of the plugin
 * @param  {Function} init The function that is run when the player inits
 */
var plugin = function plugin(name, init) {
  _Player2['default'].prototype[name] = init;
};

exports['default'] = plugin;
module.exports = exports['default'];

},{"./player":71}],73:[function(require,module,exports){
'use strict';

var _interopRequireWildcard = function (obj) { return obj && obj.__esModule ? obj : { 'default': obj }; };

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } };

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if (descriptor.value) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(object, property, receiver) { var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _inherits = function (subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; };

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _Button2 = require('./button');

var _Button3 = _interopRequireWildcard(_Button2);

var _import = require('./lib');

var Lib = _interopRequireWildcard(_import);

/* Poster Image
================================================================================ */
/**
 * The component that handles showing the poster image.
 *
 * @param {Player|Object} player
 * @param {Object=} options
 * @constructor
 */

var PosterImage = (function (_Button) {
  function PosterImage(player, options) {
    _classCallCheck(this, PosterImage);

    _get(Object.getPrototypeOf(PosterImage.prototype), 'constructor', this).call(this, player, options);

    this.update();
    player.on('posterchange', Lib.bind(this, this.update));
  }

  _inherits(PosterImage, _Button);

  _createClass(PosterImage, [{
    key: 'dispose',

    /**
     * Clean up the poster image
     */
    value: function dispose() {
      this.player().off('posterchange', this.update);
      _get(Object.getPrototypeOf(PosterImage.prototype), 'dispose', this).call(this);
    }
  }, {
    key: 'createEl',

    /**
     * Create the poster image element
     * @return {Element}
     */
    value: function createEl() {
      var el = Lib.createEl('div', {
        className: 'vjs-poster',

        // Don't want poster to be tabbable.
        tabIndex: -1
      });

      // To ensure the poster image resizes while maintaining its original aspect
      // ratio, use a div with `background-size` when available. For browsers that
      // do not support `background-size` (e.g. IE8), fall back on using a regular
      // img element.
      if (!Lib.BACKGROUND_SIZE_SUPPORTED) {
        this.fallbackImg_ = Lib.createEl('img');
        el.appendChild(this.fallbackImg_);
      }

      return el;
    }
  }, {
    key: 'update',

    /**
     * Event handler for updates to the player's poster source
     */
    value: function update() {
      var url = this.player().poster();

      this.setSrc(url);

      // If there's no poster source we should display:none on this component
      // so it's not still clickable or right-clickable
      if (url) {
        this.show();
      } else {
        this.hide();
      }
    }
  }, {
    key: 'setSrc',

    /**
     * Set the poster source depending on the display method
     */
    value: function setSrc(url) {
      if (this.fallbackImg_) {
        this.fallbackImg_.src = url;
      } else {
        var backgroundImage = '';
        // Any falsey values should stay as an empty string, otherwise
        // this will throw an extra error
        if (url) {
          backgroundImage = 'url("' + url + '")';
        }

        this.el_.style.backgroundImage = backgroundImage;
      }
    }
  }, {
    key: 'handleClick',

    /**
     * Event handler for clicks on the poster image
     */
    value: function handleClick() {
      // We don't want a click to trigger playback when controls are disabled
      // but CSS should be hiding the poster to prevent that from happening
      if (this.player_.paused()) {
        this.player_.play();
      } else {
        this.player_.pause();
      }
    }
  }]);

  return PosterImage;
})(_Button3['default']);

_Button3['default'].registerComponent('PosterImage', PosterImage);
exports['default'] = PosterImage;
module.exports = exports['default'];

},{"./button":25,"./lib":64}],74:[function(require,module,exports){
'use strict';

var _interopRequireWildcard = function (obj) { return obj && obj.__esModule ? obj : { 'default': obj }; };

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } };

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if (descriptor.value) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(object, property, receiver) { var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _inherits = function (subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; };

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _Component2 = require('../component.js');

var _Component3 = _interopRequireWildcard(_Component2);

var _import = require('../lib.js');

var Lib = _interopRequireWildcard(_import);

/**
 * SeekBar Behavior includes play progress bar, and seek handle
 * Needed so it can determine seek position based on handle position/size
 * @param {Player|Object} player
 * @param {Object=} options
 * @constructor
 */

var SliderHandle = (function (_Component) {
  function SliderHandle() {
    _classCallCheck(this, SliderHandle);

    if (_Component != null) {
      _Component.apply(this, arguments);
    }
  }

  _inherits(SliderHandle, _Component);

  _createClass(SliderHandle, [{
    key: 'createEl',

    /** @inheritDoc */
    value: function createEl(type, props) {
      props = props || {};
      // Add the slider element class to all sub classes
      props.className = props.className + ' vjs-slider-handle';
      props = Lib.obj.merge({
        innerHTML: '<span class="vjs-control-text">' + (this.defaultValue || 0) + '</span>'
      }, props);

      return _get(Object.getPrototypeOf(SliderHandle.prototype), 'createEl', this).call(this, 'div', props);
    }
  }]);

  return SliderHandle;
})(_Component3['default']);

_Component3['default'].registerComponent('SliderHandle', SliderHandle);
exports['default'] = SliderHandle;
module.exports = exports['default'];

},{"../component.js":26,"../lib.js":64}],75:[function(require,module,exports){
'use strict';

var _interopRequireWildcard = function (obj) { return obj && obj.__esModule ? obj : { 'default': obj }; };

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } };

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if (descriptor.value) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(object, property, receiver) { var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _inherits = function (subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; };

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _Component2 = require('../component.js');

var _Component3 = _interopRequireWildcard(_Component2);

var _import = require('../lib.js');

var Lib = _interopRequireWildcard(_import);

var _document = require('global/document');

var _document2 = _interopRequireWildcard(_document);

/* Slider
================================================================================ */
/**
 * The base functionality for sliders like the volume bar and seek bar
 *
 * @param {Player|Object} player
 * @param {Object=} options
 * @constructor
 */

var Slider = (function (_Component) {
  function Slider(player, options) {
    _classCallCheck(this, Slider);

    _get(Object.getPrototypeOf(Slider.prototype), 'constructor', this).call(this, player, options);

    // Set property names to bar and handle to match with the child Slider class is looking for
    this.bar = this.getChild(this.options_.barName);
    this.handle = this.getChild(this.options_.handleName);

    // Set a horizontal or vertical class on the slider depending on the slider type
    this.vertical(!!this.options().vertical);

    this.on('mousedown', this.handleMouseDown);
    this.on('touchstart', this.handleMouseDown);
    this.on('focus', this.handleFocus);
    this.on('blur', this.handleBlur);
    this.on('click', this.handleClick);

    this.on(player, 'controlsvisible', this.update);
    this.on(player, this.playerEvent, this.update);
  }

  _inherits(Slider, _Component);

  _createClass(Slider, [{
    key: 'createEl',
    value: function createEl(type) {
      var props = arguments[1] === undefined ? {} : arguments[1];

      // Add the slider element class to all sub classes
      props.className = props.className + ' vjs-slider';
      props = Lib.obj.merge({
        role: 'slider',
        'aria-valuenow': 0,
        'aria-valuemin': 0,
        'aria-valuemax': 100,
        tabIndex: 0
      }, props);

      return _get(Object.getPrototypeOf(Slider.prototype), 'createEl', this).call(this, type, props);
    }
  }, {
    key: 'handleMouseDown',
    value: function handleMouseDown(event) {
      event.preventDefault();
      Lib.blockTextSelection();
      this.addClass('vjs-sliding');

      this.on(_document2['default'], 'mousemove', this.handleMouseMove);
      this.on(_document2['default'], 'mouseup', this.handleMouseUp);
      this.on(_document2['default'], 'touchmove', this.handleMouseMove);
      this.on(_document2['default'], 'touchend', this.handleMouseUp);

      this.handleMouseMove(event);
    }
  }, {
    key: 'handleMouseMove',

    // To be overridden by a subclass
    value: function handleMouseMove() {}
  }, {
    key: 'handleMouseUp',
    value: function handleMouseUp() {
      Lib.unblockTextSelection();
      this.removeClass('vjs-sliding');

      this.off(_document2['default'], 'mousemove', this.handleMouseMove);
      this.off(_document2['default'], 'mouseup', this.handleMouseUp);
      this.off(_document2['default'], 'touchmove', this.handleMouseMove);
      this.off(_document2['default'], 'touchend', this.handleMouseUp);

      this.update();
    }
  }, {
    key: 'update',
    value: function update() {
      // In VolumeBar init we have a setTimeout for update that pops and update to the end of the
      // execution stack. The player is destroyed before then update will cause an error
      if (!this.el_) {
        return;
      } // If scrubbing, we could use a cached value to make the handle keep up with the user's mouse.
      // On HTML5 browsers scrubbing is really smooth, but some flash players are slow, so we might want to utilize this later.
      // var progress =  (this.player_.scrubbing) ? this.player_.getCache().currentTime / this.player_.duration() : this.player_.currentTime() / this.player_.duration();
      var progress = this.getPercent();
      var bar = this.bar;

      // If there's no bar...
      if (!bar) {
        return;
      } // Protect against no duration and other division issues
      if (typeof progress !== 'number' || progress !== progress || progress < 0 || progress === Infinity) {
        progress = 0;
      }

      // If there is a handle, we need to account for the handle in our calculation for progress bar
      // so that it doesn't fall short of or extend past the handle.
      var barProgress = this.updateHandlePosition(progress);

      // Convert to a percentage for setting
      var percentage = Lib.round(barProgress * 100, 2) + '%';

      // Set the new bar width or height
      if (this.vertical()) {
        bar.el().style.height = percentage;
      } else {
        bar.el().style.width = percentage;
      }
    }
  }, {
    key: 'updateHandlePosition',

    /**
    * Update the handle position.
    */
    value: function updateHandlePosition(progress) {
      var handle = this.handle;
      if (!handle) {
        return;
      }var vertical = this.vertical();
      var box = this.el_;

      var boxSize = undefined,
          handleSize = undefined;
      if (vertical) {
        boxSize = box.offsetHeight;
        handleSize = handle.el().offsetHeight;
      } else {
        boxSize = box.offsetWidth;
        handleSize = handle.el().offsetWidth;
      }

      // The width of the handle in percent of the containing box
      // In IE, widths may not be ready yet causing NaN
      var handlePercent = handleSize ? handleSize / boxSize : 0;

      // Get the adjusted size of the box, considering that the handle's center never touches the left or right side.
      // There is a margin of half the handle's width on both sides.
      var boxAdjustedPercent = 1 - handlePercent;

      // Adjust the progress that we'll use to set widths to the new adjusted box width
      var adjustedProgress = progress * boxAdjustedPercent;

      // The bar does reach the left side, so we need to account for this in the bar's width
      var barProgress = adjustedProgress + handlePercent / 2;

      var percentage = Lib.round(adjustedProgress * 100, 2) + '%';

      if (vertical) {
        handle.el().style.bottom = percentage;
      } else {
        handle.el().style.left = percentage;
      }

      return barProgress;
    }
  }, {
    key: 'calculateDistance',
    value: function calculateDistance(event) {
      var el = this.el_;
      var box = Lib.findPosition(el);
      var boxW = el.offsetWidth;
      var boxH = el.offsetHeight;
      var handle = this.handle;

      if (this.options().vertical) {
        var boxY = box.top;

        var pageY = undefined;
        if (event.changedTouches) {
          pageY = event.changedTouches[0].pageY;
        } else {
          pageY = event.pageY;
        }

        if (handle) {
          var handleH = handle.el().offsetHeight;
          // Adjusted X and Width, so handle doesn't go outside the bar
          boxY = boxY + handleH / 2;
          boxH = boxH - handleH;
        }

        // Percent that the click is through the adjusted area
        return Math.max(0, Math.min(1, (boxY - pageY + boxH) / boxH));
      } else {
        var boxX = box.left;

        var pageX = undefined;
        if (event.changedTouches) {
          pageX = event.changedTouches[0].pageX;
        } else {
          pageX = event.pageX;
        }

        if (handle) {
          var handleW = handle.el().offsetWidth;

          // Adjusted X and Width, so handle doesn't go outside the bar
          boxX = boxX + handleW / 2;
          boxW = boxW - handleW;
        }

        // Percent that the click is through the adjusted area
        return Math.max(0, Math.min(1, (pageX - boxX) / boxW));
      }
    }
  }, {
    key: 'handleFocus',
    value: function handleFocus() {
      this.on(_document2['default'], 'keydown', this.handleKeyPress);
    }
  }, {
    key: 'handleKeyPress',
    value: function handleKeyPress(event) {
      if (event.which == 37 || event.which == 40) {
        // Left and Down Arrows
        event.preventDefault();
        this.stepBack();
      } else if (event.which == 38 || event.which == 39) {
        // Up and Right Arrows
        event.preventDefault();
        this.stepForward();
      }
    }
  }, {
    key: 'handleBlur',
    value: function handleBlur() {
      this.off(_document2['default'], 'keydown', this.handleKeyPress);
    }
  }, {
    key: 'handleClick',

    /**
     * Listener for click events on slider, used to prevent clicks
     *   from bubbling up to parent elements like button menus.
     * @param  {Object} event Event object
     */
    value: function handleClick(event) {
      event.stopImmediatePropagation();
      event.preventDefault();
    }
  }, {
    key: 'vertical',
    value: function vertical(bool) {
      if (bool === undefined) {
        return this.vertical_ || false;
      }

      this.vertical_ = !!bool;

      if (this.vertical_) {
        this.addClass('vjs-slider-vertical');
      } else {
        this.addClass('vjs-slider-horizontal');
      }

      return this;
    }
  }]);

  return Slider;
})(_Component3['default']);

_Component3['default'].registerComponent('Slider', Slider);
exports['default'] = Slider;
module.exports = exports['default'];

},{"../component.js":26,"../lib.js":64,"global/document":1}],76:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
function FlashRtmpDecorator(Flash) {
  Flash.streamingFormats = {
    'rtmp/mp4': 'MP4',
    'rtmp/flv': 'FLV'
  };

  Flash.streamFromParts = function (connection, stream) {
    return connection + '&' + stream;
  };

  Flash.streamToParts = function (src) {
    var parts = {
      connection: '',
      stream: ''
    };

    if (!src) return parts;

    // Look for the normal URL separator we expect, '&'.
    // If found, we split the URL into two pieces around the
    // first '&'.
    var connEnd = src.indexOf('&');
    var streamBegin = undefined;
    if (connEnd !== -1) {
      streamBegin = connEnd + 1;
    } else {
      // If there's not a '&', we use the last '/' as the delimiter.
      connEnd = streamBegin = src.lastIndexOf('/') + 1;
      if (connEnd === 0) {
        // really, there's not a '/'?
        connEnd = streamBegin = src.length;
      }
    }
    parts.connection = src.substring(0, connEnd);
    parts.stream = src.substring(streamBegin, src.length);

    return parts;
  };

  Flash.isStreamingType = function (srcType) {
    return srcType in Flash.streamingFormats;
  };

  // RTMP has four variations, any string starting
  // with one of these protocols should be valid
  Flash.RTMP_RE = /^rtmp[set]?:\/\//i;

  Flash.isStreamingSrc = function (src) {
    return Flash.RTMP_RE.test(src);
  };

  /**
   * A source handler for RTMP urls
   * @type {Object}
   */
  Flash.rtmpSourceHandler = {};

  /**
   * Check Flash can handle the source natively
   * @param  {Object} source  The source object
   * @return {String}         'probably', 'maybe', or '' (empty string)
   */
  Flash.rtmpSourceHandler.canHandleSource = function (source) {
    if (Flash.isStreamingType(source.type) || Flash.isStreamingSrc(source.src)) {
      return 'maybe';
    }

    return '';
  };

  /**
   * Pass the source to the flash object
   * Adaptive source handlers will have more complicated workflows before passing
   * video data to the video element
   * @param  {Object} source    The source object
   * @param  {Flash} tech   The instance of the Flash tech
   */
  Flash.rtmpSourceHandler.handleSource = function (source, tech) {
    var srcParts = Flash.streamToParts(source.src);

    tech.setRtmpConnection(srcParts.connection);
    tech.setRtmpStream(srcParts.stream);
  };

  // Register the native source handler
  Flash.registerSourceHandler(Flash.rtmpSourceHandler);

  return Flash;
}

exports['default'] = FlashRtmpDecorator;
module.exports = exports['default'];

},{}],77:[function(require,module,exports){
'use strict';

var _interopRequireWildcard = function (obj) { return obj && obj.__esModule ? obj : { 'default': obj }; };

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } };

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if (descriptor.value) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(object, property, receiver) { var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _inherits = function (subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; };

Object.defineProperty(exports, '__esModule', {
  value: true
});
/**
 * @fileoverview VideoJS-SWF - Custom Flash Player with HTML5-ish API
 * https://github.com/zencoder/video-js-swf
 * Not using setupTriggers. Using global onEvent func to distribute events
 */

var _Tech2 = require('./tech');

var _Tech3 = _interopRequireWildcard(_Tech2);

var _import = require('../lib');

var Lib = _interopRequireWildcard(_import);

var _FlashRtmpDecorator = require('./flash-rtmp');

var _FlashRtmpDecorator2 = _interopRequireWildcard(_FlashRtmpDecorator);

var _Component = require('../component');

var _Component2 = _interopRequireWildcard(_Component);

var _window = require('global/window');

var _window2 = _interopRequireWildcard(_window);

var navigator = _window2['default'].navigator;

/**
 * Flash Media Controller - Wrapper for fallback SWF API
 *
 * @param {Player} player
 * @param {Object=} options
 * @param {Function=} ready
 * @constructor
 */

var Flash = (function (_Tech) {
  function Flash(player, options, ready) {
    _classCallCheck(this, Flash);

    _get(Object.getPrototypeOf(Flash.prototype), 'constructor', this).call(this, player, options, ready);

    var source = options.source;
    var parentEl = options.parentEl;

    // Create a temporary element to be replaced by swf object
    var placeHolder = this.el_ = Lib.createEl('div', { id: player.id() + '_temp_flash' });

    // Generate ID for swf object
    var objId = player.id() + '_flash_api';

    // Store player options in local var for optimization
    // TODO: switch to using player methods instead of options
    // e.g. player.autoplay();
    var playerOptions = player.options_;

    // Merge default flashvars with ones passed in to init
    var flashVars = Lib.obj.merge({

      // SWF Callback Functions
      readyFunction: 'videojs.Flash.onReady',
      eventProxyFunction: 'videojs.Flash.onEvent',
      errorEventProxyFunction: 'videojs.Flash.onError',

      // Player Settings
      autoplay: playerOptions.autoplay,
      preload: playerOptions.preload,
      loop: playerOptions.loop,
      muted: playerOptions.muted

    }, options.flashVars);

    // Merge default parames with ones passed in
    var params = Lib.obj.merge({
      wmode: 'opaque', // Opaque is needed to overlay controls, but can affect playback performance
      bgcolor: '#000000' // Using bgcolor prevents a white flash when the object is loading
    }, options.params);

    // Merge default attributes with ones passed in
    var attributes = Lib.obj.merge({
      id: objId,
      name: objId, // Both ID and Name needed or swf to identify itself
      'class': 'vjs-tech'
    }, options.attributes);

    // If source was supplied pass as a flash var.
    if (source) {
      this.ready(function () {
        this.setSource(source);
      });
    }

    // Add placeholder to player div
    Lib.insertFirst(placeHolder, parentEl);

    // Having issues with Flash reloading on certain page actions (hide/resize/fullscreen) in certain browsers
    // This allows resetting the playhead when we catch the reload
    if (options.startTime) {
      this.ready(function () {
        this.load();
        this.play();
        this.currentTime(options.startTime);
      });
    }

    // firefox doesn't bubble mousemove events to parent. videojs/video-js-swf#37
    // bugzilla bug: https://bugzilla.mozilla.org/show_bug.cgi?id=836786
    if (Lib.IS_FIREFOX) {
      this.ready(function () {
        this.on('mousemove', function () {
          // since it's a custom event, don't bubble higher than the player
          this.player().trigger({ type: 'mousemove', bubbles: false });
        });
      });
    }

    // native click events on the SWF aren't triggered on IE11, Win8.1RT
    // use stageclick events triggered from inside the SWF instead
    player.on('stageclick', player.reportUserActivity);

    this.el_ = Flash.embed(options.swf, placeHolder, flashVars, params, attributes);
  }

  _inherits(Flash, _Tech);

  _createClass(Flash, [{
    key: 'play',
    value: function play() {
      this.el_.vjs_play();
    }
  }, {
    key: 'pause',
    value: function pause() {
      this.el_.vjs_pause();
    }
  }, {
    key: 'src',
    value: (function (_src) {
      function src(_x) {
        return _src.apply(this, arguments);
      }

      src.toString = function () {
        return src.toString();
      };

      return src;
    })(function (src) {
      if (src === undefined) {
        return this.currentSrc();
      }

      // Setting src through `src` not `setSrc` will be deprecated
      return this.setSrc(src);
    })
  }, {
    key: 'setSrc',
    value: function setSrc(src) {
      // Make sure source URL is absolute.
      src = Lib.getAbsoluteURL(src);
      this.el_.vjs_src(src);

      // Currently the SWF doesn't autoplay if you load a source later.
      // e.g. Load player w/ no source, wait 2s, set src.
      if (this.player_.autoplay()) {
        var tech = this;
        this.setTimeout(function () {
          tech.play();
        }, 0);
      }
    }
  }, {
    key: 'setCurrentTime',
    value: function setCurrentTime(time) {
      this.lastSeekTarget_ = time;
      this.el_.vjs_setProperty('currentTime', time);
      _get(Object.getPrototypeOf(Flash.prototype), 'setCurrentTime', this).call(this);
    }
  }, {
    key: 'currentTime',
    value: function currentTime(time) {
      // when seeking make the reported time keep up with the requested time
      // by reading the time we're seeking to
      if (this.seeking()) {
        return this.lastSeekTarget_ || 0;
      }
      return this.el_.vjs_getProperty('currentTime');
    }
  }, {
    key: 'currentSrc',
    value: function currentSrc() {
      if (this.currentSource_) {
        return this.currentSource_.src;
      } else {
        return this.el_.vjs_getProperty('currentSrc');
      }
    }
  }, {
    key: 'load',
    value: function load() {
      this.el_.vjs_load();
    }
  }, {
    key: 'poster',
    value: function poster() {
      this.el_.vjs_getProperty('poster');
    }
  }, {
    key: 'setPoster',

    // poster images are not handled by the Flash tech so make this a no-op
    value: function setPoster() {}
  }, {
    key: 'buffered',
    value: function buffered() {
      return Lib.createTimeRange(0, this.el_.vjs_getProperty('buffered'));
    }
  }, {
    key: 'supportsFullScreen',
    value: function supportsFullScreen() {
      return false; // Flash does not allow fullscreen through javascript
    }
  }, {
    key: 'enterFullScreen',
    value: function enterFullScreen() {
      return false;
    }
  }]);

  return Flash;
})(_Tech3['default']);

// Create setters and getters for attributes
var _api = Flash.prototype;
var _readWrite = 'rtmpConnection,rtmpStream,preload,defaultPlaybackRate,playbackRate,autoplay,loop,mediaGroup,controller,controls,volume,muted,defaultMuted'.split(',');
var _readOnly = 'error,networkState,readyState,seeking,initialTime,duration,startOffsetTime,paused,played,seekable,ended,videoTracks,audioTracks,videoWidth,videoHeight'.split(',');

function _createSetter(attr) {
  var attrUpper = attr.charAt(0).toUpperCase() + attr.slice(1);
  _api['set' + attrUpper] = function (val) {
    return this.el_.vjs_setProperty(attr, val);
  };
}
function _createGetter(attr) {
  _api[attr] = function () {
    return this.el_.vjs_getProperty(attr);
  };
}

// Create getter and setters for all read/write attributes
for (var i = 0; i < _readWrite.length; i++) {
  _createGetter(_readWrite[i]);
  _createSetter(_readWrite[i]);
}

// Create getters for read-only attributes
for (var i = 0; i < _readOnly.length; i++) {
  _createGetter(_readOnly[i]);
}

/* Flash Support Testing -------------------------------------------------------- */

Flash.isSupported = function () {
  return Flash.version()[0] >= 10;
  // return swfobject.hasFlashPlayerVersion('10');
};

// Add Source Handler pattern functions to this tech
_Tech3['default'].withSourceHandlers(Flash);

/**
 * The default native source handler.
 * This simply passes the source to the video element. Nothing fancy.
 * @param  {Object} source   The source object
 * @param  {Flash} tech  The instance of the Flash tech
 */
Flash.nativeSourceHandler = {};

/**
 * Check Flash can handle the source natively
 * @param  {Object} source  The source object
 * @return {String}         'probably', 'maybe', or '' (empty string)
 */
Flash.nativeSourceHandler.canHandleSource = function (source) {
  var type;

  function guessMimeType(src) {
    var ext = Lib.getFileExtension(src);
    if (ext) {
      return 'video/' + ext;
    }
    return '';
  }

  if (!source.type) {
    type = guessMimeType(source.src);
  } else {
    // Strip code information from the type because we don't get that specific
    type = source.type.replace(/;.*/, '').toLowerCase();
  }

  if (type in Flash.formats) {
    return 'maybe';
  }

  return '';
};

/**
 * Pass the source to the flash object
 * Adaptive source handlers will have more complicated workflows before passing
 * video data to the video element
 * @param  {Object} source    The source object
 * @param  {Flash} tech   The instance of the Flash tech
 */
Flash.nativeSourceHandler.handleSource = function (source, tech) {
  tech.setSrc(source.src);
};

/**
 * Clean up the source handler when disposing the player or switching sources..
 * (no cleanup is needed when supporting the format natively)
 */
Flash.nativeSourceHandler.dispose = function () {};

// Register the native source handler
Flash.registerSourceHandler(Flash.nativeSourceHandler);

Flash.formats = {
  'video/flv': 'FLV',
  'video/x-flv': 'FLV',
  'video/mp4': 'MP4',
  'video/m4v': 'MP4'
};

Flash.onReady = function (currSwf) {
  var el = Lib.el(currSwf);

  // get player from the player div property
  var player = el && el.parentNode && el.parentNode.player;

  // if there is no el or player then the tech has been disposed
  // and the tech element was removed from the player div
  if (player) {
    // reference player on tech element
    el.player = player;
    // check that the flash object is really ready
    Flash.checkReady(player.tech);
  }
};

// The SWF isn't always ready when it says it is. Sometimes the API functions still need to be added to the object.
// If it's not ready, we set a timeout to check again shortly.
Flash.checkReady = function (tech) {
  // stop worrying if the tech has been disposed
  if (!tech.el()) {
    return;
  }

  // check if API property exists
  if (tech.el().vjs_getProperty) {
    // tell tech it's ready
    tech.triggerReady();
  } else {
    // wait longer
    this.setTimeout(function () {
      Flash.checkReady(tech);
    }, 50);
  }
};

// Trigger events from the swf on the player
Flash.onEvent = function (swfID, eventName) {
  var player = Lib.el(swfID).player;
  player.trigger(eventName);
};

// Log errors from the swf
Flash.onError = function (swfID, err) {
  var player = Lib.el(swfID).player;
  var msg = 'FLASH: ' + err;

  if (err == 'srcnotfound') {
    player.error({ code: 4, message: msg });

    // errors we haven't categorized into the media errors
  } else {
    player.error(msg);
  }
};

// Flash Version Check
Flash.version = function () {
  var version = '0,0,0';

  // IE
  try {
    version = new _window2['default'].ActiveXObject('ShockwaveFlash.ShockwaveFlash').GetVariable('$version').replace(/\D+/g, ',').match(/^,?(.+),?$/)[1];

    // other browsers
  } catch (e) {
    try {
      if (navigator.mimeTypes['application/x-shockwave-flash'].enabledPlugin) {
        version = (navigator.plugins['Shockwave Flash 2.0'] || navigator.plugins['Shockwave Flash']).description.replace(/\D+/g, ',').match(/^,?(.+),?$/)[1];
      }
    } catch (err) {}
  }
  return version.split(',');
};

// Flash embedding method. Only used in non-iframe mode
Flash.embed = function (swf, placeHolder, flashVars, params, attributes) {
  var code = Flash.getEmbedCode(swf, flashVars, params, attributes);

  // Get element by embedding code and retrieving created element
  var obj = Lib.createEl('div', { innerHTML: code }).childNodes[0];

  var par = placeHolder.parentNode;

  placeHolder.parentNode.replaceChild(obj, placeHolder);
  return obj;
};

Flash.getEmbedCode = function (swf, flashVars, params, attributes) {
  var objTag = '<object type="application/x-shockwave-flash" ';
  var flashVarsString = '';
  var paramsString = '';
  var attrsString = '';

  // Convert flash vars to string
  if (flashVars) {
    Lib.obj.each(flashVars, function (key, val) {
      flashVarsString += '' + key + '=' + val + '&amp;';
    });
  }

  // Add swf, flashVars, and other default params
  params = Lib.obj.merge({
    movie: swf,
    flashvars: flashVarsString,
    allowScriptAccess: 'always', // Required to talk to swf
    allowNetworking: 'all' // All should be default, but having security issues.
  }, params);

  // Create param tags string
  Lib.obj.each(params, function (key, val) {
    paramsString += '<param name="' + key + '" value="' + val + '" />';
  });

  attributes = Lib.obj.merge({
    // Add swf to attributes (need both for IE and Others to work)
    data: swf,

    // Default to 100% width/height
    width: '100%',
    height: '100%'

  }, attributes);

  // Create Attributes string
  Lib.obj.each(attributes, function (key, val) {
    attrsString += '' + key + '="' + val + '" ';
  });

  return '' + objTag + '' + attrsString + '>' + paramsString + '</object>';
};

// Run Flash through the RTMP decorator
_FlashRtmpDecorator2['default'](Flash);

_Tech3['default'].registerComponent('Flash', Flash);
exports['default'] = Flash;
module.exports = exports['default'];

},{"../component":26,"../lib":64,"./flash-rtmp":76,"./tech":80,"global/window":2}],78:[function(require,module,exports){
'use strict';

var _interopRequireWildcard = function (obj) { return obj && obj.__esModule ? obj : { 'default': obj }; };

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } };

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if (descriptor.value) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(object, property, receiver) { var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _inherits = function (subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; };

Object.defineProperty(exports, '__esModule', {
  value: true
});
/**
 * @fileoverview HTML5 Media Controller - Wrapper for HTML5 Media API
 */

var _Tech2 = require('./tech.js');

var _Tech3 = _interopRequireWildcard(_Tech2);

var _Component = require('../component');

var _Component2 = _interopRequireWildcard(_Component);

var _import = require('../lib');

var Lib = _interopRequireWildcard(_import);

var _import2 = require('../util');

var VjsUtil = _interopRequireWildcard(_import2);

var _document = require('global/document');

var _document2 = _interopRequireWildcard(_document);

/**
 * HTML5 Media Controller - Wrapper for HTML5 Media API
 * @param {Player|Object} player
 * @param {Object=} options
 * @param {Function=} ready
 * @constructor
 */

var Html5 = (function (_Tech) {
  function Html5(player, options, ready) {
    _classCallCheck(this, Html5);

    _get(Object.getPrototypeOf(Html5.prototype), 'constructor', this).call(this, player, options, ready);

    this.setupTriggers();

    var source = options.source;

    // Set the source if one is provided
    // 1) Check if the source is new (if not, we want to keep the original so playback isn't interrupted)
    // 2) Check to see if the network state of the tag was failed at init, and if so, reset the source
    // anyway so the error gets fired.
    if (source && (this.el_.currentSrc !== source.src || player.tag && player.tag.initNetworkState_ === 3)) {
      this.setSource(source);
    }

    if (this.el_.hasChildNodes()) {

      var nodes = this.el_.childNodes;
      var nodesLength = nodes.length;
      var removeNodes = [];

      while (nodesLength--) {
        var node = nodes[nodesLength];
        var nodeName = node.nodeName.toLowerCase();
        if (nodeName === 'track') {
          if (!this.featuresNativeTextTracks) {
            // Empty video tag tracks so the built-in player doesn't use them also.
            // This may not be fast enough to stop HTML5 browsers from reading the tags
            // so we'll need to turn off any default tracks if we're manually doing
            // captions and subtitles. videoElement.textTracks
            removeNodes.push(node);
          } else {
            this.remoteTextTracks().addTrack_(node.track);
          }
        }
      }

      for (var i = 0; i < removeNodes.length; i++) {
        this.el_.removeChild(removeNodes[i]);
      }
    }

    if (this.featuresNativeTextTracks) {
      this.on('loadstart', Lib.bind(this, this.hideCaptions));
    }

    // Determine if native controls should be used
    // Our goal should be to get the custom controls on mobile solid everywhere
    // so we can remove this all together. Right now this will block custom
    // controls on touch enabled laptops like the Chrome Pixel
    if (Lib.TOUCH_ENABLED && player.options().nativeControlsForTouch === true) {
      this.useNativeControls();
    }

    // Chrome and Safari both have issues with autoplay.
    // In Safari (5.1.1), when we move the video element into the container div, autoplay doesn't work.
    // In Chrome (15), if you have autoplay + a poster + no controls, the video gets hidden (but audio plays)
    // This fixes both issues. Need to wait for API, so it updates displays correctly
    player.ready(function () {
      if (this.tag && this.options_.autoplay && this.paused()) {
        delete this.tag.poster; // Chrome Fix. Fixed in Chrome v16.
        this.play();
      }
    });

    this.triggerReady();
  }

  _inherits(Html5, _Tech);

  _createClass(Html5, [{
    key: 'dispose',
    value: function dispose() {
      Html5.disposeMediaElement(this.el_);
      _get(Object.getPrototypeOf(Html5.prototype), 'dispose', this).call(this);
    }
  }, {
    key: 'createEl',
    value: function createEl() {
      var player = this.player_;
      var el = player.tag;

      // Check if this browser supports moving the element into the box.
      // On the iPhone video will break if you move the element,
      // So we have to create a brand new element.
      if (!el || this.movingMediaElementInDOM === false) {

        // If the original tag is still there, clone and remove it.
        if (el) {
          var clone = el.cloneNode(false);
          Html5.disposeMediaElement(el);
          el = clone;
          player.tag = null;
        } else {
          el = Lib.createEl('video');

          // determine if native controls should be used
          var attributes = VjsUtil.mergeOptions({}, player.tagAttributes);
          if (!Lib.TOUCH_ENABLED || player.options().nativeControlsForTouch !== true) {
            delete attributes.controls;
          }

          Lib.setElementAttributes(el, Lib.obj.merge(attributes, {
            id: player.id() + '_html5_api',
            'class': 'vjs-tech'
          }));
        }
        // associate the player with the new tag
        el.player = player;

        if (player.options_.tracks) {
          for (var i = 0; i < player.options_.tracks.length; i++) {
            var track = player.options_.tracks[i];
            var trackEl = _document2['default'].createElement('track');
            trackEl.kind = track.kind;
            trackEl.label = track.label;
            trackEl.srclang = track.srclang;
            trackEl.src = track.src;
            if ('default' in track) {
              trackEl.setAttribute('default', 'default');
            }
            el.appendChild(trackEl);
          }
        }

        Lib.insertFirst(el, player.el());
      }

      // Update specific tag settings, in case they were overridden
      var settingsAttrs = ['autoplay', 'preload', 'loop', 'muted'];
      for (var i = settingsAttrs.length - 1; i >= 0; i--) {
        var attr = settingsAttrs[i];
        var overwriteAttrs = {};
        if (typeof player.options_[attr] !== 'undefined') {
          overwriteAttrs[attr] = player.options_[attr];
        }
        Lib.setElementAttributes(el, overwriteAttrs);
      }

      return el;
      // jenniisawesome = true;
    }
  }, {
    key: 'hideCaptions',
    value: function hideCaptions() {
      var tracks = this.el_.querySelectorAll('track');
      var i = tracks.length;
      var kinds = {
        captions: 1,
        subtitles: 1
      };

      while (i--) {
        var track = tracks[i].track;
        if (track && track.kind in kinds && !tracks[i]['default']) {
          track.mode = 'disabled';
        }
      }
    }
  }, {
    key: 'setupTriggers',

    // Make video events trigger player events
    // May seem verbose here, but makes other APIs possible.
    // Triggers removed using this.off when disposed
    value: function setupTriggers() {
      for (var i = Html5.Events.length - 1; i >= 0; i--) {
        this.on(Html5.Events[i], this.eventHandler);
      }
    }
  }, {
    key: 'eventHandler',
    value: function eventHandler(evt) {
      // In the case of an error on the video element, set the error prop
      // on the player and let the player handle triggering the event. On
      // some platforms, error events fire that do not cause the error
      // property on the video element to be set. See #1465 for an example.
      if (evt.type == 'error' && this.error()) {
        this.player().error(this.error().code);

        // in some cases we pass the event directly to the player
      } else {
        // No need for media events to bubble up.
        evt.bubbles = false;

        this.player().trigger(evt);
      }
    }
  }, {
    key: 'useNativeControls',
    value: function useNativeControls() {
      var tech = this;
      var player = this.player();

      // If the player controls are enabled turn on the native controls
      tech.setControls(player.controls());

      // Update the native controls when player controls state is updated
      var controlsOn = function controlsOn() {
        tech.setControls(true);
      };
      var controlsOff = function controlsOff() {
        tech.setControls(false);
      };
      player.on('controlsenabled', controlsOn);
      player.on('controlsdisabled', controlsOff);

      // Clean up when not using native controls anymore
      var cleanUp = function cleanUp() {
        player.off('controlsenabled', controlsOn);
        player.off('controlsdisabled', controlsOff);
      };
      tech.on('dispose', cleanUp);
      player.on('usingcustomcontrols', cleanUp);

      // Update the state of the player to using native controls
      player.usingNativeControls(true);
    }
  }, {
    key: 'play',
    value: function play() {
      this.el_.play();
    }
  }, {
    key: 'pause',
    value: function pause() {
      this.el_.pause();
    }
  }, {
    key: 'paused',
    value: function paused() {
      return this.el_.paused;
    }
  }, {
    key: 'currentTime',
    value: function currentTime() {
      return this.el_.currentTime;
    }
  }, {
    key: 'setCurrentTime',
    value: function setCurrentTime(seconds) {
      try {
        this.el_.currentTime = seconds;
      } catch (e) {
        Lib.log(e, 'Video is not ready. (Video.js)');
        // this.warning(VideoJS.warnings.videoNotReady);
      }
    }
  }, {
    key: 'duration',
    value: function duration() {
      return this.el_.duration || 0;
    }
  }, {
    key: 'buffered',
    value: function buffered() {
      return this.el_.buffered;
    }
  }, {
    key: 'volume',
    value: function volume() {
      return this.el_.volume;
    }
  }, {
    key: 'setVolume',
    value: function setVolume(percentAsDecimal) {
      this.el_.volume = percentAsDecimal;
    }
  }, {
    key: 'muted',
    value: function muted() {
      return this.el_.muted;
    }
  }, {
    key: 'setMuted',
    value: function setMuted(muted) {
      this.el_.muted = muted;
    }
  }, {
    key: 'width',
    value: function width() {
      return this.el_.offsetWidth;
    }
  }, {
    key: 'height',
    value: function height() {
      return this.el_.offsetHeight;
    }
  }, {
    key: 'supportsFullScreen',
    value: function supportsFullScreen() {
      if (typeof this.el_.webkitEnterFullScreen == 'function') {

        // Seems to be broken in Chromium/Chrome && Safari in Leopard
        if (/Android/.test(Lib.USER_AGENT) || !/Chrome|Mac OS X 10.5/.test(Lib.USER_AGENT)) {
          return true;
        }
      }
      return false;
    }
  }, {
    key: 'enterFullScreen',
    value: function enterFullScreen() {
      var video = this.el_;

      if ('webkitDisplayingFullscreen' in video) {
        this.one('webkitbeginfullscreen', function () {
          this.player_.isFullscreen(true);

          this.one('webkitendfullscreen', function () {
            this.player_.isFullscreen(false);
            this.player_.trigger('fullscreenchange');
          });

          this.player_.trigger('fullscreenchange');
        });
      }

      if (video.paused && video.networkState <= video.HAVE_METADATA) {
        // attempt to prime the video element for programmatic access
        // this isn't necessary on the desktop but shouldn't hurt
        this.el_.play();

        // playing and pausing synchronously during the transition to fullscreen
        // can get iOS ~6.1 devices into a play/pause loop
        this.setTimeout(function () {
          video.pause();
          video.webkitEnterFullScreen();
        }, 0);
      } else {
        video.webkitEnterFullScreen();
      }
    }
  }, {
    key: 'exitFullScreen',
    value: function exitFullScreen() {
      this.el_.webkitExitFullScreen();
    }
  }, {
    key: 'src',
    value: (function (_src) {
      function src(_x) {
        return _src.apply(this, arguments);
      }

      src.toString = function () {
        return src.toString();
      };

      return src;
    })(function (src) {
      if (src === undefined) {
        return this.el_.src;
      } else {
        // Setting src through `src` instead of `setSrc` will be deprecated
        this.setSrc(src);
      }
    })
  }, {
    key: 'setSrc',
    value: function setSrc(src) {
      this.el_.src = src;
    }
  }, {
    key: 'load',
    value: function load() {
      this.el_.load();
    }
  }, {
    key: 'currentSrc',
    value: function currentSrc() {
      return this.el_.currentSrc;
    }
  }, {
    key: 'poster',
    value: function poster() {
      return this.el_.poster;
    }
  }, {
    key: 'setPoster',
    value: function setPoster(val) {
      this.el_.poster = val;
    }
  }, {
    key: 'preload',
    value: function preload() {
      return this.el_.preload;
    }
  }, {
    key: 'setPreload',
    value: function setPreload(val) {
      this.el_.preload = val;
    }
  }, {
    key: 'autoplay',
    value: function autoplay() {
      return this.el_.autoplay;
    }
  }, {
    key: 'setAutoplay',
    value: function setAutoplay(val) {
      this.el_.autoplay = val;
    }
  }, {
    key: 'controls',
    value: function controls() {
      return this.el_.controls;
    }
  }, {
    key: 'setControls',
    value: function setControls(val) {
      this.el_.controls = !!val;
    }
  }, {
    key: 'loop',
    value: function loop() {
      return this.el_.loop;
    }
  }, {
    key: 'setLoop',
    value: function setLoop(val) {
      this.el_.loop = val;
    }
  }, {
    key: 'error',
    value: function error() {
      return this.el_.error;
    }
  }, {
    key: 'seeking',
    value: function seeking() {
      return this.el_.seeking;
    }
  }, {
    key: 'ended',
    value: function ended() {
      return this.el_.ended;
    }
  }, {
    key: 'defaultMuted',
    value: function defaultMuted() {
      return this.el_.defaultMuted;
    }
  }, {
    key: 'playbackRate',
    value: function playbackRate() {
      return this.el_.playbackRate;
    }
  }, {
    key: 'setPlaybackRate',
    value: function setPlaybackRate(val) {
      this.el_.playbackRate = val;
    }
  }, {
    key: 'networkState',
    value: function networkState() {
      return this.el_.networkState;
    }
  }, {
    key: 'readyState',
    value: function readyState() {
      return this.el_.readyState;
    }
  }, {
    key: 'textTracks',
    value: function textTracks() {
      if (!this.featuresNativeTextTracks) {
        return _get(Object.getPrototypeOf(Html5.prototype), 'textTracks', this).call(this);
      }

      return this.el_.textTracks;
    }
  }, {
    key: 'addTextTrack',
    value: function addTextTrack(kind, label, language) {
      if (!this.featuresNativeTextTracks) {
        return _get(Object.getPrototypeOf(Html5.prototype), 'addTextTrack', this).call(this, kind, label, language);
      }

      return this.el_.addTextTrack(kind, label, language);
    }
  }, {
    key: 'addRemoteTextTrack',
    value: function addRemoteTextTrack() {
      var options = arguments[0] === undefined ? {} : arguments[0];

      if (!this.featuresNativeTextTracks) {
        return _get(Object.getPrototypeOf(Html5.prototype), 'addRemoteTextTrack', this).call(this, options);
      }

      var track = _document2['default'].createElement('track');

      if (options.kind) {
        track.kind = options.kind;
      }
      if (options.label) {
        track.label = options.label;
      }
      if (options.language || options.srclang) {
        track.srclang = options.language || options.srclang;
      }
      if (options['default']) {
        track['default'] = options['default'];
      }
      if (options.id) {
        track.id = options.id;
      }
      if (options.src) {
        track.src = options.src;
      }

      this.el().appendChild(track);

      if (track.track.kind === 'metadata') {
        track.track.mode = 'hidden';
      } else {
        track.track.mode = 'disabled';
      }

      track.onload = function () {
        var tt = track.track;
        if (track.readyState >= 2) {
          if (tt.kind === 'metadata' && tt.mode !== 'hidden') {
            tt.mode = 'hidden';
          } else if (tt.kind !== 'metadata' && tt.mode !== 'disabled') {
            tt.mode = 'disabled';
          }
          track.onload = null;
        }
      };

      this.remoteTextTracks().addTrack_(track.track);

      return track;
    }
  }, {
    key: 'removeRemoteTextTrack',
    value: function removeRemoteTextTrack(track) {
      if (!this.featuresNativeTextTracks) {
        return _get(Object.getPrototypeOf(Html5.prototype), 'removeRemoteTextTrack', this).call(this, track);
      }

      var tracks, i;

      this.remoteTextTracks().removeTrack_(track);

      tracks = this.el().querySelectorAll('track');

      for (i = 0; i < tracks.length; i++) {
        if (tracks[i] === track || tracks[i].track === track) {
          tracks[i].parentNode.removeChild(tracks[i]);
          break;
        }
      }
    }
  }]);

  return Html5;
})(_Tech3['default']);

/* HTML5 Support Testing ---------------------------------------------------- */

/**
 * Check if HTML5 video is supported by this browser/device
 * @return {Boolean}
 */
Html5.isSupported = function () {
  // IE9 with no Media Player is a LIAR! (#984)
  try {
    Lib.TEST_VID.volume = 0.5;
  } catch (e) {
    return false;
  }

  return !!Lib.TEST_VID.canPlayType;
};

// Add Source Handler pattern functions to this tech
_Tech3['default'].withSourceHandlers(Html5);

/**
 * The default native source handler.
 * This simply passes the source to the video element. Nothing fancy.
 * @param  {Object} source   The source object
 * @param  {Html5} tech  The instance of the HTML5 tech
 */
Html5.nativeSourceHandler = {};

/**
 * Check if the video element can handle the source natively
 * @param  {Object} source  The source object
 * @return {String}         'probably', 'maybe', or '' (empty string)
 */
Html5.nativeSourceHandler.canHandleSource = function (source) {
  var match, ext;

  function canPlayType(type) {
    // IE9 on Windows 7 without MediaPlayer throws an error here
    // https://github.com/videojs/video.js/issues/519
    try {
      return Lib.TEST_VID.canPlayType(type);
    } catch (e) {
      return '';
    }
  }

  // If a type was provided we should rely on that
  if (source.type) {
    return canPlayType(source.type);
  } else if (source.src) {
    // If no type, fall back to checking 'video/[EXTENSION]'
    ext = Lib.getFileExtension(source.src);

    return canPlayType('video/' + ext);
  }

  return '';
};

/**
 * Pass the source to the video element
 * Adaptive source handlers will have more complicated workflows before passing
 * video data to the video element
 * @param  {Object} source    The source object
 * @param  {Html5} tech   The instance of the Html5 tech
 */
Html5.nativeSourceHandler.handleSource = function (source, tech) {
  tech.setSrc(source.src);
};

/**
 * Clean up the source handler when disposing the player or switching sources..
 * (no cleanup is needed when supporting the format natively)
 */
Html5.nativeSourceHandler.dispose = function () {};

// Register the native source handler
Html5.registerSourceHandler(Html5.nativeSourceHandler);

/**
 * Check if the volume can be changed in this browser/device.
 * Volume cannot be changed in a lot of mobile devices.
 * Specifically, it can't be changed from 1 on iOS.
 * @return {Boolean}
 */
Html5.canControlVolume = function () {
  var volume = Lib.TEST_VID.volume;
  Lib.TEST_VID.volume = volume / 2 + 0.1;
  return volume !== Lib.TEST_VID.volume;
};

/**
 * Check if playbackRate is supported in this browser/device.
 * @return {[type]} [description]
 */
Html5.canControlPlaybackRate = function () {
  var playbackRate = Lib.TEST_VID.playbackRate;
  Lib.TEST_VID.playbackRate = playbackRate / 2 + 0.1;
  return playbackRate !== Lib.TEST_VID.playbackRate;
};

/**
 * Check to see if native text tracks are supported by this browser/device
 * @return {Boolean}
 */
Html5.supportsNativeTextTracks = function () {
  var supportsTextTracks;

  // Figure out native text track support
  // If mode is a number, we cannot change it because it'll disappear from view.
  // Browsers with numeric modes include IE10 and older (<=2013) samsung android models.
  // Firefox isn't playing nice either with modifying the mode
  // TODO: Investigate firefox: https://github.com/videojs/video.js/issues/1862
  supportsTextTracks = !!Lib.TEST_VID.textTracks;
  if (supportsTextTracks && Lib.TEST_VID.textTracks.length > 0) {
    supportsTextTracks = typeof Lib.TEST_VID.textTracks[0].mode !== 'number';
  }
  if (supportsTextTracks && Lib.IS_FIREFOX) {
    supportsTextTracks = false;
  }

  return supportsTextTracks;
};

/**
 * Set the tech's volume control support status
 * @type {Boolean}
 */
Html5.prototype.featuresVolumeControl = Html5.canControlVolume();

/**
 * Set the tech's playbackRate support status
 * @type {Boolean}
 */
Html5.prototype.featuresPlaybackRate = Html5.canControlPlaybackRate();

/**
 * Set the tech's status on moving the video element.
 * In iOS, if you move a video element in the DOM, it breaks video playback.
 * @type {Boolean}
 */
Html5.prototype.movingMediaElementInDOM = !Lib.IS_IOS;

/**
 * Set the the tech's fullscreen resize support status.
 * HTML video is able to automatically resize when going to fullscreen.
 * (No longer appears to be used. Can probably be removed.)
 */
Html5.prototype.featuresFullscreenResize = true;

/**
 * Set the tech's progress event support status
 * (this disables the manual progress events of the Tech)
 */
Html5.prototype.featuresProgressEvents = true;

/**
 * Sets the tech's status on native text track support
 * @type {Boolean}
 */
Html5.prototype.featuresNativeTextTracks = Html5.supportsNativeTextTracks();

// HTML5 Feature detection and Device Fixes --------------------------------- //
var canPlayType = undefined;
var mpegurlRE = /^application\/(?:x-|vnd\.apple\.)mpegurl/i;
var mp4RE = /^video\/mp4/i;

Html5.patchCanPlayType = function () {
  // Android 4.0 and above can play HLS to some extent but it reports being unable to do so
  if (Lib.ANDROID_VERSION >= 4) {
    if (!canPlayType) {
      canPlayType = Lib.TEST_VID.constructor.prototype.canPlayType;
    }

    Lib.TEST_VID.constructor.prototype.canPlayType = function (type) {
      if (type && mpegurlRE.test(type)) {
        return 'maybe';
      }
      return canPlayType.call(this, type);
    };
  }

  // Override Android 2.2 and less canPlayType method which is broken
  if (Lib.IS_OLD_ANDROID) {
    if (!canPlayType) {
      canPlayType = Lib.TEST_VID.constructor.prototype.canPlayType;
    }

    Lib.TEST_VID.constructor.prototype.canPlayType = function (type) {
      if (type && mp4RE.test(type)) {
        return 'maybe';
      }
      return canPlayType.call(this, type);
    };
  }
};

Html5.unpatchCanPlayType = function () {
  var r = Lib.TEST_VID.constructor.prototype.canPlayType;
  Lib.TEST_VID.constructor.prototype.canPlayType = canPlayType;
  canPlayType = null;
  return r;
};

// by default, patch the video element
Html5.patchCanPlayType();

// List of all HTML5 events (various uses).
Html5.Events = 'loadstart,suspend,abort,error,emptied,stalled,loadedmetadata,loadeddata,canplay,canplaythrough,playing,waiting,seeking,seeked,ended,durationchange,timeupdate,progress,play,pause,ratechange,volumechange'.split(',');

Html5.disposeMediaElement = function (el) {
  if (!el) {
    return;
  }

  el.player = null;

  if (el.parentNode) {
    el.parentNode.removeChild(el);
  }

  // remove any child track or source nodes to prevent their loading
  while (el.hasChildNodes()) {
    el.removeChild(el.firstChild);
  }

  // remove any src reference. not setting `src=''` because that causes a warning
  // in firefox
  el.removeAttribute('src');

  // force the media element to update its loading state by calling load()
  // however IE on Windows 7N has a bug that throws an error so need a try/catch (#793)
  if (typeof el.load === 'function') {
    // wrapping in an iife so it's not deoptimized (#1060#discussion_r10324473)
    (function () {
      try {
        el.load();
      } catch (e) {}
    })();
  }
};

_Component2['default'].registerComponent('Html5', Html5);
exports['default'] = Html5;
module.exports = exports['default'];

// not supported

},{"../component":26,"../lib":64,"../util":87,"./tech.js":80,"global/document":1}],79:[function(require,module,exports){
'use strict';

var _interopRequireWildcard = function (obj) { return obj && obj.__esModule ? obj : { 'default': obj }; };

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } };

var _get = function get(object, property, receiver) { var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _inherits = function (subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; };

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _Component2 = require('../component');

var _Component3 = _interopRequireWildcard(_Component2);

var _import = require('../lib');

var Lib = _interopRequireWildcard(_import);

var _window = require('global/window');

var _window2 = _interopRequireWildcard(_window);

/**
 * The Media Loader is the component that decides which playback technology to load
 * when the player is initialized.
 *
 * @constructor
 */

var MediaLoader = (function (_Component) {
  function MediaLoader(player, options, ready) {
    _classCallCheck(this, MediaLoader);

    _get(Object.getPrototypeOf(MediaLoader.prototype), 'constructor', this).call(this, player, options, ready);

    // If there are no sources when the player is initialized,
    // load the first supported playback technology.
    if (!player.options_.sources || player.options_.sources.length === 0) {
      for (var i = 0, j = player.options_.techOrder; i < j.length; i++) {
        var techName = Lib.capitalize(j[i]);
        var tech = _Component3['default'].getComponent(techName);

        // Check if the browser supports this technology
        if (tech && tech.isSupported()) {
          player.loadTech(techName);
          break;
        }
      }
    } else {
      // // Loop through playback technologies (HTML5, Flash) and check for support.
      // // Then load the best source.
      // // A few assumptions here:
      // //   All playback technologies respect preload false.
      player.src(player.options_.sources);
    }
  }

  _inherits(MediaLoader, _Component);

  return MediaLoader;
})(_Component3['default']);

_Component3['default'].registerComponent('MediaLoader', MediaLoader);
exports['default'] = MediaLoader;
module.exports = exports['default'];

},{"../component":26,"../lib":64,"global/window":2}],80:[function(require,module,exports){
'use strict';

var _interopRequireWildcard = function (obj) { return obj && obj.__esModule ? obj : { 'default': obj }; };

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } };

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if (descriptor.value) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(object, property, receiver) { var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _inherits = function (subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; };

Object.defineProperty(exports, '__esModule', {
  value: true
});
/**
 * @fileoverview Media Technology Controller - Base class for media playback
 * technology controllers like Flash and HTML5
 */

var _Component2 = require('../component');

var _Component3 = _interopRequireWildcard(_Component2);

var _TextTrack = require('../tracks/text-track');

var _TextTrack2 = _interopRequireWildcard(_TextTrack);

var _TextTrackList = require('../tracks/text-track-list');

var _TextTrackList2 = _interopRequireWildcard(_TextTrackList);

var _import = require('../lib');

var Lib = _interopRequireWildcard(_import);

var _window = require('global/window');

var _window2 = _interopRequireWildcard(_window);

var _document = require('global/document');

var _document2 = _interopRequireWildcard(_document);

/**
 * Base class for media (HTML5 Video, Flash) controllers
 * @param {Player|Object} player  Central player instance
 * @param {Object=} options Options object
 * @constructor
 */

var Tech = (function (_Component) {
  function Tech(player) {
    var options = arguments[1] === undefined ? {} : arguments[1];
    var ready = arguments[2] === undefined ? function () {} : arguments[2];

    _classCallCheck(this, Tech);

    // we don't want the tech to report user activity automatically.
    // This is done manually in addControlsListeners
    options.reportTouchActivity = false;
    _get(Object.getPrototypeOf(Tech.prototype), 'constructor', this).call(this, player, options, ready);

    // Manually track progress in cases where the browser/flash player doesn't report it.
    if (!this.featuresProgressEvents) {
      this.manualProgressOn();
    }

    // Manually track timeupdates in cases where the browser/flash player doesn't report it.
    if (!this.featuresTimeupdateEvents) {
      this.manualTimeUpdatesOn();
    }

    this.initControlsListeners();

    if (options.nativeCaptions === false || options.nativeTextTracks === false) {
      this.featuresNativeTextTracks = false;
    }

    if (!this.featuresNativeTextTracks) {
      this.emulateTextTracks();
    }

    this.initTextTrackListeners();
  }

  _inherits(Tech, _Component);

  _createClass(Tech, [{
    key: 'initControlsListeners',

    /**
     * Set up click and touch listeners for the playback element
     * On desktops, a click on the video itself will toggle playback,
     * on a mobile device a click on the video toggles controls.
     * (toggling controls is done by toggling the user state between active and
     * inactive)
     *
     * A tap can signal that a user has become active, or has become inactive
     * e.g. a quick tap on an iPhone movie should reveal the controls. Another
     * quick tap should hide them again (signaling the user is in an inactive
     * viewing state)
     *
     * In addition to this, we still want the user to be considered inactive after
     * a few seconds of inactivity.
     *
     * Note: the only part of iOS interaction we can't mimic with this setup
     * is a touch and hold on the video element counting as activity in order to
     * keep the controls showing, but that shouldn't be an issue. A touch and hold on
     * any controls will still keep the user active
     */
    value: function initControlsListeners() {
      var player = this.player();

      var activateControls = function activateControls() {
        if (player.controls() && !player.usingNativeControls()) {
          this.addControlsListeners();
        }
      };

      // Set up event listeners once the tech is ready and has an element to apply
      // listeners to
      this.ready(activateControls);
      this.on(player, 'controlsenabled', activateControls);
      this.on(player, 'controlsdisabled', this.removeControlsListeners);

      // if we're loading the playback object after it has started loading or playing the
      // video (often with autoplay on) then the loadstart event has already fired and we
      // need to fire it manually because many things rely on it.
      // Long term we might consider how we would do this for other events like 'canplay'
      // that may also have fired.
      this.ready(function () {
        if (this.networkState && this.networkState() > 0) {
          this.player().trigger('loadstart');
        }
      });
    }
  }, {
    key: 'addControlsListeners',
    value: function addControlsListeners() {
      var userWasActive = undefined;

      // Some browsers (Chrome & IE) don't trigger a click on a flash swf, but do
      // trigger mousedown/up.
      // http://stackoverflow.com/questions/1444562/javascript-onclick-event-over-flash-object
      // Any touch events are set to block the mousedown event from happening
      this.on('mousedown', this.handleClick);

      // If the controls were hidden we don't want that to change without a tap event
      // so we'll check if the controls were already showing before reporting user
      // activity
      this.on('touchstart', function (event) {
        userWasActive = this.player_.userActive();
      });

      this.on('touchmove', function (event) {
        if (userWasActive) {
          this.player().reportUserActivity();
        }
      });

      this.on('touchend', function (event) {
        // Stop the mouse events from also happening
        event.preventDefault();
      });

      // Turn on component tap events
      this.emitTapEvents();

      // The tap listener needs to come after the touchend listener because the tap
      // listener cancels out any reportedUserActivity when setting userActive(false)
      this.on('tap', this.handleTap);
    }
  }, {
    key: 'removeControlsListeners',

    /**
     * Remove the listeners used for click and tap controls. This is needed for
     * toggling to controls disabled, where a tap/touch should do nothing.
     */
    value: function removeControlsListeners() {
      // We don't want to just use `this.off()` because there might be other needed
      // listeners added by techs that extend this.
      this.off('tap');
      this.off('touchstart');
      this.off('touchmove');
      this.off('touchleave');
      this.off('touchcancel');
      this.off('touchend');
      this.off('click');
      this.off('mousedown');
    }
  }, {
    key: 'handleClick',

    /**
     * Handle a click on the media element. By default will play/pause the media.
     */
    value: function handleClick(event) {
      // We're using mousedown to detect clicks thanks to Flash, but mousedown
      // will also be triggered with right-clicks, so we need to prevent that
      if (event.button !== 0) {
        return;
      } // When controls are disabled a click should not toggle playback because
      // the click is considered a control
      if (this.player().controls()) {
        if (this.player().paused()) {
          this.player().play();
        } else {
          this.player().pause();
        }
      }
    }
  }, {
    key: 'handleTap',

    /**
     * Handle a tap on the media element. By default it will toggle the user
     * activity state, which hides and shows the controls.
     */
    value: function handleTap() {
      this.player().userActive(!this.player().userActive());
    }
  }, {
    key: 'manualProgressOn',

    /* Fallbacks for unsupported event types
    ================================================================================ */
    // Manually trigger progress events based on changes to the buffered amount
    // Many flash players and older HTML5 browsers don't send progress or progress-like events
    value: function manualProgressOn() {
      this.manualProgress = true;

      // Trigger progress watching when a source begins loading
      this.trackProgress();
    }
  }, {
    key: 'manualProgressOff',
    value: function manualProgressOff() {
      this.manualProgress = false;
      this.stopTrackingProgress();
    }
  }, {
    key: 'trackProgress',
    value: function trackProgress() {
      this.progressInterval = this.setInterval(function () {
        // Don't trigger unless buffered amount is greater than last time

        var bufferedPercent = this.player().bufferedPercent();

        if (this.bufferedPercent_ != bufferedPercent) {
          this.player().trigger('progress');
        }

        this.bufferedPercent_ = bufferedPercent;

        if (bufferedPercent === 1) {
          this.stopTrackingProgress();
        }
      }, 500);
    }
  }, {
    key: 'stopTrackingProgress',
    value: function stopTrackingProgress() {
      this.clearInterval(this.progressInterval);
    }
  }, {
    key: 'manualTimeUpdatesOn',

    /*! Time Tracking -------------------------------------------------------------- */
    value: function manualTimeUpdatesOn() {
      var player = this.player_;

      this.manualTimeUpdates = true;

      this.on(player, 'play', this.trackCurrentTime);
      this.on(player, 'pause', this.stopTrackingCurrentTime);
      // timeupdate is also called by .currentTime whenever current time is set

      // Watch for native timeupdate event
      this.one('timeupdate', function () {
        // Update known progress support for this playback technology
        this.featuresTimeupdateEvents = true;
        // Turn off manual progress tracking
        this.manualTimeUpdatesOff();
      });
    }
  }, {
    key: 'manualTimeUpdatesOff',
    value: function manualTimeUpdatesOff() {
      var player = this.player_;

      this.manualTimeUpdates = false;
      this.stopTrackingCurrentTime();
      this.off(player, 'play', this.trackCurrentTime);
      this.off(player, 'pause', this.stopTrackingCurrentTime);
    }
  }, {
    key: 'trackCurrentTime',
    value: function trackCurrentTime() {
      if (this.currentTimeInterval) {
        this.stopTrackingCurrentTime();
      }
      this.currentTimeInterval = this.setInterval(function () {
        this.player().trigger('timeupdate');
      }, 250); // 42 = 24 fps // 250 is what Webkit uses // FF uses 15
    }
  }, {
    key: 'stopTrackingCurrentTime',

    // Turn off play progress tracking (when paused or dragging)
    value: function stopTrackingCurrentTime() {
      this.clearInterval(this.currentTimeInterval);

      // #1002 - if the video ends right before the next timeupdate would happen,
      // the progress bar won't make it all the way to the end
      this.player().trigger('timeupdate');
    }
  }, {
    key: 'dispose',
    value: function dispose() {
      // Turn off any manual progress or timeupdate tracking
      if (this.manualProgress) {
        this.manualProgressOff();
      }

      if (this.manualTimeUpdates) {
        this.manualTimeUpdatesOff();
      }

      _get(Object.getPrototypeOf(Tech.prototype), 'dispose', this).call(this);
    }
  }, {
    key: 'setCurrentTime',
    value: function setCurrentTime() {
      // improve the accuracy of manual timeupdates
      if (this.manualTimeUpdates) {
        this.player().trigger('timeupdate');
      }
    }
  }, {
    key: 'initTextTrackListeners',

    // TODO: Consider looking at moving this into the text track display directly
    // https://github.com/videojs/video.js/issues/1863
    value: function initTextTrackListeners() {
      var player = this.player_;

      var textTrackListChanges = function textTrackListChanges() {
        var textTrackDisplay = player.getChild('textTrackDisplay');

        if (textTrackDisplay) {
          textTrackDisplay.updateDisplay();
        }
      };

      var tracks = this.textTracks();

      if (!tracks) {
        return;
      }tracks.addEventListener('removetrack', textTrackListChanges);
      tracks.addEventListener('addtrack', textTrackListChanges);

      this.on('dispose', Lib.bind(this, function () {
        tracks.removeEventListener('removetrack', textTrackListChanges);
        tracks.removeEventListener('addtrack', textTrackListChanges);
      }));
    }
  }, {
    key: 'emulateTextTracks',
    value: function emulateTextTracks() {
      var player = this.player_;

      if (!_window2['default'].WebVTT) {
        var script = _document2['default'].createElement('script');
        script.src = player.options()['vtt.js'] || '../node_modules/vtt.js/dist/vtt.js';
        player.el().appendChild(script);
        _window2['default'].WebVTT = true;
      }

      var tracks = this.textTracks();
      if (!tracks) {
        return;
      }

      var textTracksChanges = function textTracksChanges() {
        var textTrackDisplay = player.getChild('textTrackDisplay');

        textTrackDisplay.updateDisplay();

        for (var i = 0; i < this.length; i++) {
          var track = this[i];
          track.removeEventListener('cuechange', Lib.bind(textTrackDisplay, textTrackDisplay.updateDisplay));
          if (track.mode === 'showing') {
            track.addEventListener('cuechange', Lib.bind(textTrackDisplay, textTrackDisplay.updateDisplay));
          }
        }
      };

      tracks.addEventListener('change', textTracksChanges);

      this.on('dispose', Lib.bind(this, function () {
        tracks.removeEventListener('change', textTracksChanges);
      }));
    }
  }, {
    key: 'textTracks',

    /**
     * Provide default methods for text tracks.
     *
     * Html5 tech overrides these.
     */

    value: function textTracks() {
      this.player_.textTracks_ = this.player_.textTracks_ || new _TextTrackList2['default']();
      return this.player_.textTracks_;
    }
  }, {
    key: 'remoteTextTracks',
    value: function remoteTextTracks() {
      this.player_.remoteTextTracks_ = this.player_.remoteTextTracks_ || new _TextTrackList2['default']();
      return this.player_.remoteTextTracks_;
    }
  }, {
    key: 'addTextTrack',
    value: function addTextTrack(kind, label, language) {
      if (!kind) {
        throw new Error('TextTrack kind is required but was not provided');
      }

      return createTrackHelper(this, kind, label, language);
    }
  }, {
    key: 'addRemoteTextTrack',
    value: function addRemoteTextTrack(options) {
      var track = createTrackHelper(this, options.kind, options.label, options.language, options);
      this.remoteTextTracks().addTrack_(track);
      return {
        track: track
      };
    }
  }, {
    key: 'removeRemoteTextTrack',
    value: function removeRemoteTextTrack(track) {
      this.textTracks().removeTrack_(track);
      this.remoteTextTracks().removeTrack_(track);
    }
  }, {
    key: 'setPoster',

    /**
     * Provide a default setPoster method for techs
     *
     * Poster support for techs should be optional, so we don't want techs to
     * break if they don't have a way to set a poster.
     */
    value: function setPoster() {}
  }]);

  return Tech;
})(_Component3['default']);

/**
 * List of associated text tracks
 * @type {Array}
 * @private
 */
Tech.prototype.textTracks_;

var createTrackHelper = function createTrackHelper(self, kind, label, language) {
  var options = arguments[4] === undefined ? {} : arguments[4];

  var tracks = self.textTracks();

  options.kind = kind;
  if (label) {
    options.label = label;
  }
  if (language) {
    options.language = language;
  }
  options.player = self.player_;

  var track = new _TextTrack2['default'](options);
  tracks.addTrack_(track);

  return track;
};

Tech.prototype.featuresVolumeControl = true;

// Resizing plugins using request fullscreen reloads the plugin
Tech.prototype.featuresFullscreenResize = false;
Tech.prototype.featuresPlaybackRate = false;

// Optional events that we can manually mimic with timers
// currently not triggered by video-js-swf
Tech.prototype.featuresProgressEvents = false;
Tech.prototype.featuresTimeupdateEvents = false;

Tech.prototype.featuresNativeTextTracks = false;

/**
 * A functional mixin for techs that want to use the Source Handler pattern.
 *
 * ##### EXAMPLE:
 *
 *   Tech.withSourceHandlers.call(MyTech);
 *
 */
Tech.withSourceHandlers = function (_Tech) {
  /**
   * Register a source handler
   * Source handlers are scripts for handling specific formats.
   * The source handler pattern is used for adaptive formats (HLS, DASH) that
   * manually load video data and feed it into a Source Buffer (Media Source Extensions)
   * @param  {Function} handler  The source handler
   * @param  {Boolean}  first    Register it before any existing handlers
   */
  _Tech.registerSourceHandler = function (handler, index) {
    var handlers = _Tech.sourceHandlers;

    if (!handlers) {
      handlers = _Tech.sourceHandlers = [];
    }

    if (index === undefined) {
      // add to the end of the list
      index = handlers.length;
    }

    handlers.splice(index, 0, handler);
  };

  /**
   * Return the first source handler that supports the source
   * TODO: Answer question: should 'probably' be prioritized over 'maybe'
   * @param  {Object} source The source object
   * @returns {Object}       The first source handler that supports the source
   * @returns {null}         Null if no source handler is found
   */
  _Tech.selectSourceHandler = function (source) {
    var handlers = _Tech.sourceHandlers || [];
    var can = undefined;

    for (var i = 0; i < handlers.length; i++) {
      can = handlers[i].canHandleSource(source);

      if (can) {
        return handlers[i];
      }
    }

    return null;
  };

  /**
  * Check if the tech can support the given source
  * @param  {Object} srcObj  The source object
  * @return {String}         'probably', 'maybe', or '' (empty string)
  */
  _Tech.canPlaySource = function (srcObj) {
    var sh = _Tech.selectSourceHandler(srcObj);

    if (sh) {
      return sh.canHandleSource(srcObj);
    }

    return '';
  };

  /**
   * Create a function for setting the source using a source object
   * and source handlers.
   * Should never be called unless a source handler was found.
   * @param {Object} source  A source object with src and type keys
   * @return {Tech} self
   */
  _Tech.prototype.setSource = function (source) {
    var sh = _Tech.selectSourceHandler(source);

    if (!sh) {
      // Fall back to a native source hander when unsupported sources are
      // deliberately set
      if (_Tech.nativeSourceHandler) {
        sh = _Tech.nativeSourceHandler;
      } else {
        Lib.log.error('No source hander found for the current source.');
      }
    }

    // Dispose any existing source handler
    this.disposeSourceHandler();
    this.off('dispose', this.disposeSourceHandler);

    this.currentSource_ = source;
    this.sourceHandler_ = sh.handleSource(source, this);
    this.on('dispose', this.disposeSourceHandler);

    return this;
  };

  /**
   * Clean up any existing source handler
   */
  _Tech.prototype.disposeSourceHandler = function () {
    if (this.sourceHandler_ && this.sourceHandler_.dispose) {
      this.sourceHandler_.dispose();
    }
  };
};

_Component3['default'].registerComponent('Tech', Tech);
// Old name for Tech
_Component3['default'].registerComponent('MediaTechController', Tech);
exports['default'] = Tech;
module.exports = exports['default'];

},{"../component":26,"../lib":64,"../tracks/text-track":86,"../tracks/text-track-list":84,"global/document":1,"global/window":2}],81:[function(require,module,exports){
'use strict';

var _interopRequireWildcard = function (obj) { return obj && obj.__esModule ? obj : { 'default': obj }; };

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _import = require('../lib');

var Lib = _interopRequireWildcard(_import);

var _document = require('global/document');

var _document2 = _interopRequireWildcard(_document);

/*
 * https://html.spec.whatwg.org/multipage/embedded-content.html#texttrackcuelist
 *
 * interface TextTrackCueList {
 *   readonly attribute unsigned long length;
 *   getter TextTrackCue (unsigned long index);
 *   TextTrackCue? getCueById(DOMString id);
 * };
 */

var TextTrackCueList = (function (_TextTrackCueList) {
  function TextTrackCueList(_x) {
    return _TextTrackCueList.apply(this, arguments);
  }

  TextTrackCueList.toString = function () {
    return TextTrackCueList.toString();
  };

  return TextTrackCueList;
})(function (cues) {
  var list = this;

  if (Lib.IS_IE8) {
    list = _document2['default'].createElement('custom');

    for (var prop in TextTrackCueList.prototype) {
      list[prop] = TextTrackCueList.prototype[prop];
    }
  }

  TextTrackCueList.prototype.setCues_.call(list, cues);

  Object.defineProperty(list, 'length', {
    get: function get() {
      return this.length_;
    }
  });

  if (Lib.IS_IE8) {
    return list;
  }
});

TextTrackCueList.prototype.setCues_ = function (cues) {
  var oldLength = this.length || 0;
  var i = 0;
  var l = cues.length;

  this.cues_ = cues;
  this.length_ = cues.length;

  var defineProp = function defineProp(i) {
    if (!('' + i in this)) {
      Object.defineProperty(this, '' + i, {
        get: function get() {
          return this.cues_[i];
        }
      });
    }
  };

  if (oldLength < l) {
    i = oldLength;

    for (; i < l; i++) {
      defineProp.call(this, i);
    }
  }
};

TextTrackCueList.prototype.getCueById = function (id) {
  var result = null;
  for (var i = 0, l = this.length; i < l; i++) {
    var cue = this[i];
    if (cue.id === id) {
      result = cue;
      break;
    }
  }

  return result;
};

exports['default'] = TextTrackCueList;
module.exports = exports['default'];

},{"../lib":64,"global/document":1}],82:[function(require,module,exports){
'use strict';

var _interopRequireWildcard = function (obj) { return obj && obj.__esModule ? obj : { 'default': obj }; };

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } };

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if (descriptor.value) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(object, property, receiver) { var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _inherits = function (subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; };

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _Component2 = require('../component');

var _Component3 = _interopRequireWildcard(_Component2);

var _Menu = require('../menu/menu.js');

var _Menu2 = _interopRequireWildcard(_Menu);

var _MenuItem = require('../menu/menu-item.js');

var _MenuItem2 = _interopRequireWildcard(_MenuItem);

var _MenuButton = require('../menu/menu-button.js');

var _MenuButton2 = _interopRequireWildcard(_MenuButton);

var _import = require('../lib.js');

var Lib = _interopRequireWildcard(_import);

var _document = require('global/document');

var _document2 = _interopRequireWildcard(_document);

var _window = require('global/window');

var _window2 = _interopRequireWildcard(_window);

var darkGray = '#222';
var lightGray = '#ccc';
var fontMap = {
  monospace: 'monospace',
  sansSerif: 'sans-serif',
  serif: 'serif',
  monospaceSansSerif: '"Andale Mono", "Lucida Console", monospace',
  monospaceSerif: '"Courier New", monospace',
  proportionalSansSerif: 'sans-serif',
  proportionalSerif: 'serif',
  casual: '"Comic Sans MS", Impact, fantasy',
  script: '"Monotype Corsiva", cursive',
  smallcaps: '"Andale Mono", "Lucida Console", monospace, sans-serif'
};

/**
 * The component for displaying text track cues
 *
 * @constructor
 */

var TextTrackDisplay = (function (_Component) {
  function TextTrackDisplay(player, options, ready) {
    _classCallCheck(this, TextTrackDisplay);

    _get(Object.getPrototypeOf(TextTrackDisplay.prototype), 'constructor', this).call(this, player, options, ready);

    player.on('loadstart', Lib.bind(this, this.toggleDisplay));

    // This used to be called during player init, but was causing an error
    // if a track should show by default and the display hadn't loaded yet.
    // Should probably be moved to an external track loader when we support
    // tracks that don't need a display.
    player.ready(Lib.bind(this, function () {
      if (player.tech && player.tech.featuresNativeTextTracks) {
        this.hide();
        return;
      }

      player.on('fullscreenchange', Lib.bind(this, this.updateDisplay));

      var tracks = player.options_.tracks || [];
      for (var i = 0; i < tracks.length; i++) {
        var track = tracks[i];
        this.player_.addRemoteTextTrack(track);
      }
    }));
  }

  _inherits(TextTrackDisplay, _Component);

  _createClass(TextTrackDisplay, [{
    key: 'toggleDisplay',
    value: function toggleDisplay() {
      if (this.player_.tech && this.player_.tech.featuresNativeTextTracks) {
        this.hide();
      } else {
        this.show();
      }
    }
  }, {
    key: 'createEl',
    value: function createEl() {
      return _get(Object.getPrototypeOf(TextTrackDisplay.prototype), 'createEl', this).call(this, 'div', {
        className: 'vjs-text-track-display'
      });
    }
  }, {
    key: 'clearDisplay',
    value: function clearDisplay() {
      if (typeof _window2['default'].WebVTT === 'function') {
        _window2['default'].WebVTT.processCues(_window2['default'], [], this.el_);
      }
    }
  }, {
    key: 'updateDisplay',
    value: function updateDisplay() {
      var tracks = this.player_.textTracks();

      this.clearDisplay();

      if (!tracks) {
        return;
      }

      for (var i = 0; i < tracks.length; i++) {
        var track = tracks[i];
        if (track.mode === 'showing') {
          this.updateForTrack(track);
        }
      }
    }
  }, {
    key: 'updateForTrack',
    value: function updateForTrack(track) {
      if (typeof _window2['default'].WebVTT !== 'function' || !track.activeCues) {
        return;
      }

      var overrides = this.player_.textTrackSettings.getValues();

      var cues = [];
      for (var _i = 0; _i < track.activeCues.length; _i++) {
        cues.push(track.activeCues[_i]);
      }

      _window2['default'].WebVTT.processCues(_window2['default'], track.activeCues, this.el_);

      var i = cues.length;
      while (i--) {
        var cueDiv = cues[i].displayState;
        if (overrides.color) {
          cueDiv.firstChild.style.color = overrides.color;
        }
        if (overrides.textOpacity) {
          tryUpdateStyle(cueDiv.firstChild, 'color', constructColor(overrides.color || '#fff', overrides.textOpacity));
        }
        if (overrides.backgroundColor) {
          cueDiv.firstChild.style.backgroundColor = overrides.backgroundColor;
        }
        if (overrides.backgroundOpacity) {
          tryUpdateStyle(cueDiv.firstChild, 'backgroundColor', constructColor(overrides.backgroundColor || '#000', overrides.backgroundOpacity));
        }
        if (overrides.windowColor) {
          if (overrides.windowOpacity) {
            tryUpdateStyle(cueDiv, 'backgroundColor', constructColor(overrides.windowColor, overrides.windowOpacity));
          } else {
            cueDiv.style.backgroundColor = overrides.windowColor;
          }
        }
        if (overrides.edgeStyle) {
          if (overrides.edgeStyle === 'dropshadow') {
            cueDiv.firstChild.style.textShadow = '2px 2px 3px ' + darkGray + ', 2px 2px 4px ' + darkGray + ', 2px 2px 5px ' + darkGray;
          } else if (overrides.edgeStyle === 'raised') {
            cueDiv.firstChild.style.textShadow = '1px 1px ' + darkGray + ', 2px 2px ' + darkGray + ', 3px 3px ' + darkGray;
          } else if (overrides.edgeStyle === 'depressed') {
            cueDiv.firstChild.style.textShadow = '1px 1px ' + lightGray + ', 0 1px ' + lightGray + ', -1px -1px ' + darkGray + ', 0 -1px ' + darkGray;
          } else if (overrides.edgeStyle === 'uniform') {
            cueDiv.firstChild.style.textShadow = '0 0 4px ' + darkGray + ', 0 0 4px ' + darkGray + ', 0 0 4px ' + darkGray + ', 0 0 4px ' + darkGray;
          }
        }
        if (overrides.fontPercent && overrides.fontPercent !== 1) {
          var fontSize = _window2['default'].parseFloat(cueDiv.style.fontSize);
          cueDiv.style.fontSize = fontSize * overrides.fontPercent + 'px';
          cueDiv.style.height = 'auto';
          cueDiv.style.top = 'auto';
          cueDiv.style.bottom = '2px';
        }
        if (overrides.fontFamily && overrides.fontFamily !== 'default') {
          if (overrides.fontFamily === 'small-caps') {
            cueDiv.firstChild.style.fontVariant = 'small-caps';
          } else {
            cueDiv.firstChild.style.fontFamily = fontMap[overrides.fontFamily];
          }
        }
      }
    }
  }]);

  return TextTrackDisplay;
})(_Component3['default']);

// Add cue HTML to display
function constructColor(color, opacity) {
  return 'rgba(' +
  // color looks like "#f0e"
  parseInt(color[1] + color[1], 16) + ',' + parseInt(color[2] + color[2], 16) + ',' + parseInt(color[3] + color[3], 16) + ',' + opacity + ')';
}

function tryUpdateStyle(el, style, rule) {
  // some style changes will throw an error, particularly in IE8. Those should be noops.
  try {
    el.style[style] = rule;
  } catch (e) {}
}

_Component3['default'].registerComponent('TextTrackDisplay', TextTrackDisplay);
exports['default'] = TextTrackDisplay;
module.exports = exports['default'];

},{"../component":26,"../lib.js":64,"../menu/menu-button.js":67,"../menu/menu-item.js":68,"../menu/menu.js":69,"global/document":1,"global/window":2}],83:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
/*
 * https://html.spec.whatwg.org/multipage/embedded-content.html#texttrackmode
 *
 * enum TextTrackMode { "disabled",  "hidden",  "showing" };
 */
var TextTrackMode = {
  disabled: 'disabled',
  hidden: 'hidden',
  showing: 'showing'
};

/*
 * https://html.spec.whatwg.org/multipage/embedded-content.html#texttrackkind
 *
 * enum TextTrackKind { "subtitles",  "captions",  "descriptions",  "chapters",  "metadata" };
 */
var TextTrackKind = {
  subtitles: 'subtitles',
  captions: 'captions',
  descriptions: 'descriptions',
  chapters: 'chapters',
  metadata: 'metadata'
};

exports.TextTrackMode = TextTrackMode;
exports.TextTrackKind = TextTrackKind;

},{}],84:[function(require,module,exports){
'use strict';

var _interopRequireWildcard = function (obj) { return obj && obj.__esModule ? obj : { 'default': obj }; };

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _EventEmitter = require('../event-emitter');

var _EventEmitter2 = _interopRequireWildcard(_EventEmitter);

var _import = require('../lib');

var Lib = _interopRequireWildcard(_import);

var _document = require('global/document');

var _document2 = _interopRequireWildcard(_document);

/*
 * https://html.spec.whatwg.org/multipage/embedded-content.html#texttracklist
 *
 * interface TextTrackList : EventTarget {
 *   readonly attribute unsigned long length;
 *   getter TextTrack (unsigned long index);
 *   TextTrack? getTrackById(DOMString id);
 *
 *   attribute EventHandler onchange;
 *   attribute EventHandler onaddtrack;
 *   attribute EventHandler onremovetrack;
 * };
 */
var TextTrackList = (function (_TextTrackList) {
  function TextTrackList(_x) {
    return _TextTrackList.apply(this, arguments);
  }

  TextTrackList.toString = function () {
    return TextTrackList.toString();
  };

  return TextTrackList;
})(function (tracks) {
  var list = this;

  if (Lib.IS_IE8) {
    list = _document2['default'].createElement('custom');

    for (var prop in TextTrackList.prototype) {
      list[prop] = TextTrackList.prototype[prop];
    }
  }

  tracks = tracks || [];
  list.tracks_ = [];

  Object.defineProperty(list, 'length', {
    get: function get() {
      return this.tracks_.length;
    }
  });

  for (var i = 0; i < tracks.length; i++) {
    list.addTrack_(tracks[i]);
  }

  if (Lib.IS_IE8) {
    return list;
  }
});

TextTrackList.prototype = Lib.obj.create(_EventEmitter2['default'].prototype);
TextTrackList.prototype.constructor = TextTrackList;

/*
 * change - One or more tracks in the track list have been enabled or disabled.
 * addtrack - A track has been added to the track list.
 * removetrack - A track has been removed from the track list.
*/
TextTrackList.prototype.allowedEvents_ = {
  change: 'change',
  addtrack: 'addtrack',
  removetrack: 'removetrack'
};

// emulate attribute EventHandler support to allow for feature detection
for (var _event in TextTrackList.prototype.allowedEvents_) {
  TextTrackList.prototype['on' + _event] = null;
}

TextTrackList.prototype.addTrack_ = function (track) {
  var index = this.tracks_.length;
  if (!('' + index in this)) {
    Object.defineProperty(this, index, {
      get: function get() {
        return this.tracks_[index];
      }
    });
  }

  track.addEventListener('modechange', Lib.bind(this, function () {
    this.trigger('change');
  }));
  this.tracks_.push(track);

  this.trigger({
    type: 'addtrack',
    track: track
  });
};

TextTrackList.prototype.removeTrack_ = function (rtrack) {
  var result = null;
  var track = undefined;

  for (var i = 0, l = this.length; i < l; i++) {
    track = this[i];
    if (track === rtrack) {
      this.tracks_.splice(i, 1);
      break;
    }
  }

  this.trigger({
    type: 'removetrack',
    track: track
  });
};

TextTrackList.prototype.getTrackById = function (id) {
  var result = null;

  for (var i = 0, l = this.length; i < l; i++) {
    var track = this[i];
    if (track.id === id) {
      result = track;
      break;
    }
  }

  return result;
};

exports['default'] = TextTrackList;
module.exports = exports['default'];

},{"../event-emitter":61,"../lib":64,"global/document":1}],85:[function(require,module,exports){
'use strict';

var _interopRequireWildcard = function (obj) { return obj && obj.__esModule ? obj : { 'default': obj }; };

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } };

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if (descriptor.value) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(object, property, receiver) { var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _inherits = function (subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; };

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _Component2 = require('../component');

var _Component3 = _interopRequireWildcard(_Component2);

var _import = require('../lib');

var Lib = _interopRequireWildcard(_import);

var _import2 = require('../events');

var Events = _interopRequireWildcard(_import2);

var _safeParseTuple = require('safe-json-parse/tuple');

var _safeParseTuple2 = _interopRequireWildcard(_safeParseTuple);

var _window = require('global/window');

var _window2 = _interopRequireWildcard(_window);

var TextTrackSettings = (function (_Component) {
  function TextTrackSettings(player, options) {
    _classCallCheck(this, TextTrackSettings);

    _get(Object.getPrototypeOf(TextTrackSettings.prototype), 'constructor', this).call(this, player, options);
    this.hide();

    Events.on(this.el().querySelector('.vjs-done-button'), 'click', Lib.bind(this, function () {
      this.saveSettings();
      this.hide();
    }));

    Events.on(this.el().querySelector('.vjs-default-button'), 'click', Lib.bind(this, function () {
      this.el().querySelector('.vjs-fg-color > select').selectedIndex = 0;
      this.el().querySelector('.vjs-bg-color > select').selectedIndex = 0;
      this.el().querySelector('.window-color > select').selectedIndex = 0;
      this.el().querySelector('.vjs-text-opacity > select').selectedIndex = 0;
      this.el().querySelector('.vjs-bg-opacity > select').selectedIndex = 0;
      this.el().querySelector('.vjs-window-opacity > select').selectedIndex = 0;
      this.el().querySelector('.vjs-edge-style select').selectedIndex = 0;
      this.el().querySelector('.vjs-font-family select').selectedIndex = 0;
      this.el().querySelector('.vjs-font-percent select').selectedIndex = 2;
      this.updateDisplay();
    }));

    Events.on(this.el().querySelector('.vjs-fg-color > select'), 'change', Lib.bind(this, this.updateDisplay));
    Events.on(this.el().querySelector('.vjs-bg-color > select'), 'change', Lib.bind(this, this.updateDisplay));
    Events.on(this.el().querySelector('.window-color > select'), 'change', Lib.bind(this, this.updateDisplay));
    Events.on(this.el().querySelector('.vjs-text-opacity > select'), 'change', Lib.bind(this, this.updateDisplay));
    Events.on(this.el().querySelector('.vjs-bg-opacity > select'), 'change', Lib.bind(this, this.updateDisplay));
    Events.on(this.el().querySelector('.vjs-window-opacity > select'), 'change', Lib.bind(this, this.updateDisplay));
    Events.on(this.el().querySelector('.vjs-font-percent select'), 'change', Lib.bind(this, this.updateDisplay));
    Events.on(this.el().querySelector('.vjs-edge-style select'), 'change', Lib.bind(this, this.updateDisplay));
    Events.on(this.el().querySelector('.vjs-font-family select'), 'change', Lib.bind(this, this.updateDisplay));

    if (player.options().persistTextTrackSettings) {
      this.restoreSettings();
    }
  }

  _inherits(TextTrackSettings, _Component);

  _createClass(TextTrackSettings, [{
    key: 'createEl',
    value: function createEl() {
      return _get(Object.getPrototypeOf(TextTrackSettings.prototype), 'createEl', this).call(this, 'div', {
        className: 'vjs-caption-settings vjs-modal-overlay',
        innerHTML: captionOptionsMenuTemplate()
      });
    }
  }, {
    key: 'getValues',
    value: function getValues() {
      var el = this.el();

      var textEdge = getSelectedOptionValue(el.querySelector('.vjs-edge-style select'));
      var fontFamily = getSelectedOptionValue(el.querySelector('.vjs-font-family select'));
      var fgColor = getSelectedOptionValue(el.querySelector('.vjs-fg-color > select'));
      var textOpacity = getSelectedOptionValue(el.querySelector('.vjs-text-opacity > select'));
      var bgColor = getSelectedOptionValue(el.querySelector('.vjs-bg-color > select'));
      var bgOpacity = getSelectedOptionValue(el.querySelector('.vjs-bg-opacity > select'));
      var windowColor = getSelectedOptionValue(el.querySelector('.window-color > select'));
      var windowOpacity = getSelectedOptionValue(el.querySelector('.vjs-window-opacity > select'));
      var fontPercent = _window2['default'].parseFloat(getSelectedOptionValue(el.querySelector('.vjs-font-percent > select')));

      var result = {
        backgroundOpacity: bgOpacity,
        textOpacity: textOpacity,
        windowOpacity: windowOpacity,
        edgeStyle: textEdge,
        fontFamily: fontFamily,
        color: fgColor,
        backgroundColor: bgColor,
        windowColor: windowColor,
        fontPercent: fontPercent
      };
      for (var _name in result) {
        if (result[_name] === '' || result[_name] === 'none' || _name === 'fontPercent' && result[_name] === 1) {
          delete result[_name];
        }
      }
      return result;
    }
  }, {
    key: 'setValues',
    value: function setValues(values) {
      var el = this.el();

      setSelectedOption(el.querySelector('.vjs-edge-style select'), values.edgeStyle);
      setSelectedOption(el.querySelector('.vjs-font-family select'), values.fontFamily);
      setSelectedOption(el.querySelector('.vjs-fg-color > select'), values.color);
      setSelectedOption(el.querySelector('.vjs-text-opacity > select'), values.textOpacity);
      setSelectedOption(el.querySelector('.vjs-bg-color > select'), values.backgroundColor);
      setSelectedOption(el.querySelector('.vjs-bg-opacity > select'), values.backgroundOpacity);
      setSelectedOption(el.querySelector('.window-color > select'), values.windowColor);
      setSelectedOption(el.querySelector('.vjs-window-opacity > select'), values.windowOpacity);

      var fontPercent = values.fontPercent;

      if (fontPercent) {
        fontPercent = fontPercent.toFixed(2);
      }

      setSelectedOption(el.querySelector('.vjs-font-percent > select'), fontPercent);
    }
  }, {
    key: 'restoreSettings',
    value: function restoreSettings() {
      var values = undefined;
      try {
        values = _safeParseTuple2['default'](_window2['default'].localStorage.getItem('vjs-text-track-settings'))[1];
      } catch (e) {}

      if (values) {
        this.setValues(values);
      }
    }
  }, {
    key: 'saveSettings',
    value: function saveSettings() {
      if (!this.player_.options().persistTextTrackSettings) {
        return;
      }

      var values = this.getValues();
      try {
        if (!Lib.isEmpty(values)) {
          _window2['default'].localStorage.setItem('vjs-text-track-settings', JSON.stringify(values));
        } else {
          _window2['default'].localStorage.removeItem('vjs-text-track-settings');
        }
      } catch (e) {}
    }
  }, {
    key: 'updateDisplay',
    value: function updateDisplay() {
      var ttDisplay = this.player_.getChild('textTrackDisplay');
      if (ttDisplay) {
        ttDisplay.updateDisplay();
      }
    }
  }]);

  return TextTrackSettings;
})(_Component3['default']);

_Component3['default'].registerComponent('TextTrackSettings', TextTrackSettings);

function getSelectedOptionValue(target) {
  var selectedOption = undefined;
  // not all browsers support selectedOptions, so, fallback to options
  if (target.selectedOptions) {
    selectedOption = target.selectedOptions[0];
  } else if (target.options) {
    selectedOption = target.options[target.options.selectedIndex];
  }

  return selectedOption.value;
}

function setSelectedOption(target, value) {
  if (!value) {
    return;
  }

  var i = undefined;
  for (i = 0; i < target.options.length; i++) {
    var option = target.options[i];
    if (option.value === value) {
      break;
    }
  }

  target.selectedIndex = i;
}

function captionOptionsMenuTemplate() {
  var template = '<div class="vjs-tracksettings">\n      <div class="vjs-tracksettings-colors">\n        <div class="vjs-fg-color vjs-tracksetting">\n            <label class="vjs-label">Foreground</label>\n            <select>\n              <option value="">---</option>\n              <option value="#FFF">White</option>\n              <option value="#000">Black</option>\n              <option value="#F00">Red</option>\n              <option value="#0F0">Green</option>\n              <option value="#00F">Blue</option>\n              <option value="#FF0">Yellow</option>\n              <option value="#F0F">Magenta</option>\n              <option value="#0FF">Cyan</option>\n            </select>\n            <span class="vjs-text-opacity vjs-opacity">\n              <select>\n                <option value="">---</option>\n                <option value="1">Opaque</option>\n                <option value="0.5">Semi-Opaque</option>\n              </select>\n            </span>\n        </div> <!-- vjs-fg-color -->\n        <div class="vjs-bg-color vjs-tracksetting">\n            <label class="vjs-label">Background</label>\n            <select>\n              <option value="">---</option>\n              <option value="#FFF">White</option>\n              <option value="#000">Black</option>\n              <option value="#F00">Red</option>\n              <option value="#0F0">Green</option>\n              <option value="#00F">Blue</option>\n              <option value="#FF0">Yellow</option>\n              <option value="#F0F">Magenta</option>\n              <option value="#0FF">Cyan</option>\n            </select>\n            <span class="vjs-bg-opacity vjs-opacity">\n                <select>\n                  <option value="">---</option>\n                  <option value="1">Opaque</option>\n                  <option value="0.5">Semi-Transparent</option>\n                  <option value="0">Transparent</option>\n                </select>\n            </span>\n        </div> <!-- vjs-bg-color -->\n        <div class="window-color vjs-tracksetting">\n            <label class="vjs-label">Window</label>\n            <select>\n              <option value="">---</option>\n              <option value="#FFF">White</option>\n              <option value="#000">Black</option>\n              <option value="#F00">Red</option>\n              <option value="#0F0">Green</option>\n              <option value="#00F">Blue</option>\n              <option value="#FF0">Yellow</option>\n              <option value="#F0F">Magenta</option>\n              <option value="#0FF">Cyan</option>\n            </select>\n            <span class="vjs-window-opacity vjs-opacity">\n                <select>\n                  <option value="">---</option>\n                  <option value="1">Opaque</option>\n                  <option value="0.5">Semi-Transparent</option>\n                  <option value="0">Transparent</option>\n                </select>\n            </span>\n        </div> <!-- vjs-window-color -->\n      </div> <!-- vjs-tracksettings -->\n      <div class="vjs-tracksettings-font">\n        <div class="vjs-font-percent vjs-tracksetting">\n          <label class="vjs-label">Font Size</label>\n          <select>\n            <option value="0.50">50%</option>\n            <option value="0.75">75%</option>\n            <option value="1.00" selected>100%</option>\n            <option value="1.25">125%</option>\n            <option value="1.50">150%</option>\n            <option value="1.75">175%</option>\n            <option value="2.00">200%</option>\n            <option value="3.00">300%</option>\n            <option value="4.00">400%</option>\n          </select>\n        </div> <!-- vjs-font-percent -->\n        <div class="vjs-edge-style vjs-tracksetting">\n          <label class="vjs-label">Text Edge Style</label>\n          <select>\n            <option value="none">None</option>\n            <option value="raised">Raised</option>\n            <option value="depressed">Depressed</option>\n            <option value="uniform">Uniform</option>\n            <option value="dropshadow">Dropshadow</option>\n          </select>\n        </div> <!-- vjs-edge-style -->\n        <div class="vjs-font-family vjs-tracksetting">\n          <label class="vjs-label">Font Family</label>\n          <select>\n            <option value="">Default</option>\n            <option value="monospaceSerif">Monospace Serif</option>\n            <option value="proportionalSerif">Proportional Serif</option>\n            <option value="monospaceSansSerif">Monospace Sans-Serif</option>\n            <option value="proportionalSansSerif">Proportional Sans-Serif</option>\n            <option value="casual">Casual</option>\n            <option value="script">Script</option>\n            <option value="small-caps">Small Caps</option>\n          </select>\n        </div> <!-- vjs-font-family -->\n      </div>\n    </div>\n    <div class="vjs-tracksettings-controls">\n      <button class="vjs-default-button">Defaults</button>\n      <button class="vjs-done-button">Done</button>\n    </div>';

  return template;
}

exports['default'] = TextTrackSettings;
module.exports = exports['default'];

},{"../component":26,"../events":62,"../lib":64,"global/window":2,"safe-json-parse/tuple":8}],86:[function(require,module,exports){
'use strict';

var _interopRequireWildcard = function (obj) { return obj && obj.__esModule ? obj : { 'default': obj }; };

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _TextTrackCueList = require('./text-track-cue-list');

var _TextTrackCueList2 = _interopRequireWildcard(_TextTrackCueList);

var _import = require('../lib');

var Lib = _interopRequireWildcard(_import);

var _import2 = require('./text-track-enums');

var TextTrackEnum = _interopRequireWildcard(_import2);

var _EventEmitter = require('../event-emitter');

var _EventEmitter2 = _interopRequireWildcard(_EventEmitter);

var _document = require('global/document');

var _document2 = _interopRequireWildcard(_document);

var _window = require('global/window');

var _window2 = _interopRequireWildcard(_window);

var _XHR = require('../xhr.js');

var _XHR2 = _interopRequireWildcard(_XHR);

/*
 * https://html.spec.whatwg.org/multipage/embedded-content.html#texttrack
 *
 * interface TextTrack : EventTarget {
 *   readonly attribute TextTrackKind kind;
 *   readonly attribute DOMString label;
 *   readonly attribute DOMString language;
 *
 *   readonly attribute DOMString id;
 *   readonly attribute DOMString inBandMetadataTrackDispatchType;
 *
 *   attribute TextTrackMode mode;
 *
 *   readonly attribute TextTrackCueList? cues;
 *   readonly attribute TextTrackCueList? activeCues;
 *
 *   void addCue(TextTrackCue cue);
 *   void removeCue(TextTrackCue cue);
 *
 *   attribute EventHandler oncuechange;
 * };
 */
var TextTrack = (function (_TextTrack) {
  function TextTrack() {
    return _TextTrack.apply(this, arguments);
  }

  TextTrack.toString = function () {
    return TextTrack.toString();
  };

  return TextTrack;
})(function () {
  var options = arguments[0] === undefined ? {} : arguments[0];

  if (!options.player) {
    throw new Error('A player was not provided.');
  }

  var tt = this;
  if (Lib.IS_IE8) {
    tt = _document2['default'].createElement('custom');

    for (var prop in TextTrack.prototype) {
      tt[prop] = TextTrack.prototype[prop];
    }
  }

  tt.player_ = options.player;

  var mode = TextTrackEnum.TextTrackMode[options.mode] || 'disabled';
  var kind = TextTrackEnum.TextTrackKind[options.kind] || 'subtitles';
  var label = options.label || '';
  var language = options.language || options.srclang || '';
  var id = options.id || 'vjs_text_track_' + Lib.guid++;

  if (kind === 'metadata' || kind === 'chapters') {
    mode = 'hidden';
  }

  tt.cues_ = [];
  tt.activeCues_ = [];

  var cues = new _TextTrackCueList2['default'](tt.cues_);
  var activeCues = new _TextTrackCueList2['default'](tt.activeCues_);

  var changed = false;
  var timeupdateHandler = Lib.bind(tt, function () {
    this.activeCues;
    if (changed) {
      this.trigger('cuechange');
      changed = false;
    }
  });
  if (mode !== 'disabled') {
    tt.player_.on('timeupdate', timeupdateHandler);
  }

  Object.defineProperty(tt, 'kind', {
    get: function get() {
      return kind;
    },
    set: Function.prototype
  });

  Object.defineProperty(tt, 'label', {
    get: function get() {
      return label;
    },
    set: Function.prototype
  });

  Object.defineProperty(tt, 'language', {
    get: function get() {
      return language;
    },
    set: Function.prototype
  });

  Object.defineProperty(tt, 'id', {
    get: function get() {
      return id;
    },
    set: Function.prototype
  });

  Object.defineProperty(tt, 'mode', {
    get: function get() {
      return mode;
    },
    set: function set(newMode) {
      if (!TextTrackEnum.TextTrackMode[newMode]) {
        return;
      }
      mode = newMode;
      if (mode === 'showing') {
        this.player_.on('timeupdate', timeupdateHandler);
      }
      this.trigger('modechange');
    }
  });

  Object.defineProperty(tt, 'cues', {
    get: function get() {
      if (!this.loaded_) {
        return null;
      }

      return cues;
    },
    set: Function.prototype
  });

  Object.defineProperty(tt, 'activeCues', {
    get: function get() {
      if (!this.loaded_) {
        return null;
      }

      if (this.cues.length === 0) {
        return activeCues; // nothing to do
      }

      var ct = this.player_.currentTime();
      var active = [];

      for (var i = 0, l = this.cues.length; i < l; i++) {
        var cue = this.cues[i];
        if (cue.startTime <= ct && cue.endTime >= ct) {
          active.push(cue);
        } else if (cue.startTime === cue.endTime && cue.startTime <= ct && cue.startTime + 0.5 >= ct) {
          active.push(cue);
        }
      }

      changed = false;

      if (active.length !== this.activeCues_.length) {
        changed = true;
      } else {
        for (var i = 0; i < active.length; i++) {
          if (indexOf.call(this.activeCues_, active[i]) === -1) {
            changed = true;
          }
        }
      }

      this.activeCues_ = active;
      activeCues.setCues_(this.activeCues_);

      return activeCues;
    },
    set: Function.prototype
  });

  if (options.src) {
    loadTrack(options.src, tt);
  } else {
    tt.loaded_ = true;
  }

  if (Lib.IS_IE8) {
    return tt;
  }
});

TextTrack.prototype = Lib.obj.create(_EventEmitter2['default'].prototype);
TextTrack.prototype.constructor = TextTrack;

/*
 * cuechange - One or more cues in the track have become active or stopped being active.
 */
TextTrack.prototype.allowedEvents_ = {
  cuechange: 'cuechange'
};

TextTrack.prototype.addCue = function (cue) {
  var tracks = this.player_.textTracks();

  if (tracks) {
    for (var i = 0; i < tracks.length; i++) {
      if (tracks[i] !== this) {
        tracks[i].removeCue(cue);
      }
    }
  }

  this.cues_.push(cue);
  this.cues.setCues_(this.cues_);
};

TextTrack.prototype.removeCue = function (removeCue) {
  var removed = false;

  for (var i = 0, l = this.cues_.length; i < l; i++) {
    var cue = this.cues_[i];
    if (cue === removeCue) {
      this.cues_.splice(i, 1);
      removed = true;
    }
  }

  if (removed) {
    this.cues.setCues_(this.cues_);
  }
};

/*
 * Downloading stuff happens below this point
 */
var parseCues = (function (_parseCues) {
  function parseCues(_x, _x2) {
    return _parseCues.apply(this, arguments);
  }

  parseCues.toString = function () {
    return parseCues.toString();
  };

  return parseCues;
})(function (srcContent, track) {
  if (typeof _window2['default'].WebVTT !== 'function') {
    //try again a bit later
    return _window2['default'].setTimeout(function () {
      parseCues(srcContent, track);
    }, 25);
  }

  var parser = new _window2['default'].WebVTT.Parser(_window2['default'], _window2['default'].vttjs, _window2['default'].WebVTT.StringDecoder());

  parser.oncue = function (cue) {
    track.addCue(cue);
  };
  parser.onparsingerror = function (error) {
    Lib.log.error(error);
  };

  parser.parse(srcContent);
  parser.flush();
});

var loadTrack = function loadTrack(src, track) {
  _XHR2['default'](src, Lib.bind(this, function (err, response, responseBody) {
    if (err) {
      return Lib.log.error(err);
    }

    track.loaded_ = true;
    parseCues(responseBody, track);
  }));
};

var indexOf = function indexOf(searchElement, fromIndex) {
  if (this == null) {
    throw new TypeError('"this" is null or not defined');
  }

  var O = Object(this);

  var len = O.length >>> 0;

  if (len === 0) {
    return -1;
  }

  var n = +fromIndex || 0;

  if (Math.abs(n) === Infinity) {
    n = 0;
  }

  if (n >= len) {
    return -1;
  }

  var k = Math.max(n >= 0 ? n : len - Math.abs(n), 0);

  while (k < len) {
    if (k in O && O[k] === searchElement) {
      return k;
    }
    k++;
  }
  return -1;
};

exports['default'] = TextTrack;
module.exports = exports['default'];

},{"../event-emitter":61,"../lib":64,"../xhr.js":88,"./text-track-cue-list":81,"./text-track-enums":83,"global/document":1,"global/window":2}],87:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _obj = require('./lib');

/**
 * Utility functions namespace
 * @namespace
 * @type {Object}
 */
var util = {};

/**
 * Merge two options objects, recursively merging any plain object properties as
 * well.  Previously `deepMerge`
 *
 * @param  {Object} obj1 Object to override values in
 * @param  {Object} obj2 Overriding object
 * @return {Object}      New object -- obj1 and obj2 will be untouched
 */
var mergeOptions = (function (_mergeOptions) {
  function mergeOptions(_x, _x2) {
    return _mergeOptions.apply(this, arguments);
  }

  mergeOptions.toString = function () {
    return mergeOptions.toString();
  };

  return mergeOptions;
})(function (obj1, obj2) {
  var key, val1, val2;

  // make a copy of obj1 so we're not overwriting original values.
  // like prototype.options_ and all sub options objects
  obj1 = _obj.obj.copy(obj1);

  for (key in obj2) {
    if (obj2.hasOwnProperty(key)) {
      val1 = obj1[key];
      val2 = obj2[key];

      // Check if both properties are pure objects and do a deep merge if so
      if (_obj.obj.isPlain(val1) && _obj.obj.isPlain(val2)) {
        obj1[key] = mergeOptions(val1, val2);
      } else {
        obj1[key] = obj2[key];
      }
    }
  }
  return obj1;
});

exports.mergeOptions = mergeOptions;

},{"./lib":64}],88:[function(require,module,exports){
'use strict';

var _interopRequireWildcard = function (obj) { return obj && obj.__esModule ? obj : { 'default': obj }; };

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _import = require('./util');

var VjsUtils = _interopRequireWildcard(_import);

var _import2 = require('./lib');

var Lib = _interopRequireWildcard(_import2);

var _window = require('global/window');

var _window2 = _interopRequireWildcard(_window);

/**
 * Simple http request for retrieving external files (e.g. text tracks)
 *
 * ##### Example
 *
 *     // using url string
 *     videojs.xhr('http://example.com/myfile.vtt', function(error, response, responseBody){});
 *
 *     // or options block
 *     videojs.xhr({
 *       uri: 'http://example.com/myfile.vtt',
 *       method: 'GET',
 *       responseType: 'text'
 *     }, function(error, response, responseBody){
 *       if (error) {
 *         // log the error
 *       } else {
 *         // successful, do something with the response
 *       }
 *     });
 *
 *
 * API is modeled after the Raynos/xhr, which we hope to use after
 * getting browserify implemented.
 * https://github.com/Raynos/xhr/blob/master/index.js
 *
 * @param  {Object|String}  options   Options block or URL string
 * @param  {Function}       callback  The callback function
 * @returns {Object}                  The request
 */
var xhr = function xhr(options, callback) {
  var abortTimeout = undefined;

  // If options is a string it's the url
  if (typeof options === 'string') {
    options = {
      uri: options
    };
  }

  // Merge with default options
  VjsUtils.mergeOptions({
    method: 'GET',
    timeout: 45 * 1000
  }, options);

  callback = callback || function () {};

  var XHR = _window2['default'].XMLHttpRequest;

  if (typeof XHR === 'undefined') {
    // Shim XMLHttpRequest for older IEs
    XHR = function () {
      try {
        return new _window2['default'].ActiveXObject('Msxml2.XMLHTTP.6.0');
      } catch (e) {}
      try {
        return new _window2['default'].ActiveXObject('Msxml2.XMLHTTP.3.0');
      } catch (f) {}
      try {
        return new _window2['default'].ActiveXObject('Msxml2.XMLHTTP');
      } catch (g) {}
      throw new Error('This browser does not support XMLHttpRequest.');
    };
  }

  var request = new XHR();
  // Store a reference to the url on the request instance
  request.uri = options.uri;

  var urlInfo = Lib.parseUrl(options.uri);
  var winLoc = _window2['default'].location;

  var successHandler = function successHandler() {
    _window2['default'].clearTimeout(abortTimeout);
    callback(null, request, request.response || request.responseText);
  };

  var errorHandler = function errorHandler(err) {
    _window2['default'].clearTimeout(abortTimeout);

    if (!err || typeof err === 'string') {
      err = new Error(err);
    }

    callback(err, request);
  };

  // Check if url is for another domain/origin
  // IE8 doesn't know location.origin, so we won't rely on it here
  var crossOrigin = urlInfo.protocol + urlInfo.host !== winLoc.protocol + winLoc.host;

  // XDomainRequest -- Use for IE if XMLHTTPRequest2 isn't available
  // 'withCredentials' is only available in XMLHTTPRequest2
  // Also XDomainRequest has a lot of gotchas, so only use if cross domain
  if (crossOrigin && _window2['default'].XDomainRequest && !('withCredentials' in request)) {
    request = new _window2['default'].XDomainRequest();
    request.onload = successHandler;
    request.onerror = errorHandler;
    // These blank handlers need to be set to fix ie9
    // http://cypressnorth.com/programming/internet-explorer-aborting-ajax-requests-fixed/
    request.onprogress = function () {};
    request.ontimeout = function () {};

    // XMLHTTPRequest
  } else {
    (function () {
      var fileUrl = urlInfo.protocol == 'file:' || winLoc.protocol == 'file:';

      request.onreadystatechange = function () {
        if (request.readyState === 4) {
          if (request.timedout) {
            return errorHandler('timeout');
          }

          if (request.status === 200 || fileUrl && request.status === 0) {
            successHandler();
          } else {
            errorHandler();
          }
        }
      };

      if (options.timeout) {
        abortTimeout = _window2['default'].setTimeout(function () {
          if (request.readyState !== 4) {
            request.timedout = true;
            request.abort();
          }
        }, options.timeout);
      }
    })();
  }

  // open the connection
  try {
    // Third arg is async, or ignored by XDomainRequest
    request.open(options.method || 'GET', options.uri, true);
  } catch (err) {
    return errorHandler(err);
  }

  // withCredentials only supported by XMLHttpRequest2
  if (options.withCredentials) {
    request.withCredentials = true;
  }

  if (options.responseType) {
    request.responseType = options.responseType;
  }

  // send the request
  try {
    request.send();
  } catch (err) {
    return errorHandler(err);
  }

  return request;
};

exports['default'] = xhr;
module.exports = exports['default'];

},{"./lib":64,"./util":87,"global/window":2}],89:[function(require,module,exports){
/**
 * These tests run on the minified, window.videojs and ensure the needed
 * APIs still exist
 */

'use strict';

(function () {

  q.module('Player Minified');

  test('videojs should exist on the window', function () {
    ok(window.videojs, 'videojs exists on the window');
  });

  test('should be able to access expected player API methods', function () {
    var player = videojs.getComponent('Player').prototype;

    // Native HTML5 Methods
    ok(player.error, 'error exists');
    ok(player.src, 'src exists');
    ok(player.currentSrc, 'currentSrc exists');
    ok(player.buffered, 'buffered exists');
    ok(player.load, 'load exists');
    ok(player.seeking, 'seeking exists');
    ok(player.currentTime, 'currentTime exists');
    ok(player.duration, 'duration exists');
    ok(player.paused, 'paused exists');
    ok(player.ended, 'ended exists');
    ok(player.autoplay, 'autoplay exists');
    ok(player.loop, 'loop exists');
    ok(player.play, 'play exists');
    ok(player.pause, 'pause exists');
    ok(player.controls, 'controls exists');
    ok(player.volume, 'volume exists');
    ok(player.muted, 'muted exists');
    ok(player.width, 'width exists');
    ok(player.height, 'height exists');
    ok(player.poster, 'poster exists');
    ok(player.textTracks, 'textTracks exists');
    ok(player.requestFullscreen, 'requestFullscreen exists');
    ok(player.exitFullscreen, 'exitFullscreen exists');
    ok(player.playbackRate, 'playbackRate exists');
    ok(player.networkState, 'networkState exists');
    ok(player.readyState, 'readyState exists');

    // Unsupported Native HTML5 Methods
    // ok(player.canPlayType, 'canPlayType exists');
    // ok(player.startTime, 'startTime exists');
    // ok(player.defaultPlaybackRate, 'defaultPlaybackRate exists');
    // ok(player.playbackRate, 'playbackRate exists');
    // ok(player.played, 'played exists');
    // ok(player.seekable, 'seekable exists');
    // ok(player.videoWidth, 'videoWidth exists');
    // ok(player.videoHeight, 'videoHeight exists');

    // Additional player methods
    ok(player.bufferedPercent, 'bufferedPercent exists');
    ok(player.reportUserActivity, 'reportUserActivity exists');
    ok(player.userActive, 'userActive exists');
    ok(player.usingNativeControls, 'usingNativeControls exists');
    ok(player.isFullscreen, 'isFullscreen exists');

    // TextTrack methods
    ok(player.textTracks, 'textTracks exists');
    ok(player.remoteTextTracks, 'remoteTextTracks exists');
    ok(player.addTextTrack, 'addTextTrack exists');
    ok(player.addRemoteTextTrack, 'addRemoteTextTrack exists');
    ok(player.removeRemoteTextTrack, 'removeRemoteTextTrack exists');

    // Deprecated methods that should still exist
    ok(player.requestFullScreen, 'requestFullScreen exists');
    ok(player.isFullScreen, 'isFullScreen exists');
    ok(player.cancelFullScreen, 'cancelFullScreen exists');
  });

  test('should be able to access expected component API methods', function () {
    var Component = videojs.getComponent('Component');
    var comp = new Component({ id: function id() {
        return 1;
      }, reportUserActivity: function reportUserActivity() {} });

    // Component methods
    ok(comp.player, 'player exists');
    ok(comp.options, 'options exists');
    ok(comp.init, 'init exists');
    ok(comp.dispose, 'dispose exists');
    ok(comp.createEl, 'createEl exists');
    ok(comp.contentEl, 'contentEl exists');
    ok(comp.el, 'el exists');
    ok(comp.addChild, 'addChild exists');
    ok(comp.getChild, 'getChild exists');
    ok(comp.getChildById, 'getChildById exists');
    ok(comp.children, 'children exists');
    ok(comp.initChildren, 'initChildren exists');
    ok(comp.removeChild, 'removeChild exists');
    ok(comp.on, 'on exists');
    ok(comp.off, 'off exists');
    ok(comp.one, 'one exists');
    ok(comp.trigger, 'trigger exists');
    ok(comp.triggerReady, 'triggerReady exists');
    ok(comp.show, 'show exists');
    ok(comp.hide, 'hide exists');
    ok(comp.width, 'width exists');
    ok(comp.height, 'height exists');
    ok(comp.dimensions, 'dimensions exists');
    ok(comp.ready, 'ready exists');
    ok(comp.addClass, 'addClass exists');
    ok(comp.removeClass, 'removeClass exists');
    ok(comp.buildCSSClass, 'buildCSSClass exists');
    ok(comp.setInterval, 'setInterval exists');
    ok(comp.clearInterval, 'clearInterval exists');
    ok(comp.setTimeout, 'setTimeout exists');
    ok(comp.clearTimeout, 'clearTimeout exists');
  });

  test('should be able to access expected MediaTech API methods', function () {
    var media = videojs.getComponent('Tech');
    var mediaProto = media.prototype;
    var html5 = videojs.getComponent('Html5');
    var html5Proto = html5.prototype;
    var flash = videojs.getComponent('Flash');
    var flashProto = flash.prototype;

    ok(mediaProto.setPoster, 'setPoster should exist on the Media tech');
    ok(html5Proto.setPoster, 'setPoster should exist on the HTML5 tech');
    ok(flashProto.setPoster, 'setPoster should exist on the Flash tech');

    ok(html5.patchCanPlayType, 'patchCanPlayType should exist for HTML5');
    ok(html5.unpatchCanPlayType, 'unpatchCanPlayType should exist for HTML5');

    // Source Handler Functions
    ok(media.withSourceHandlers, 'withSourceHandlers should exist for Media Tech');

    ok(html5.canPlaySource, 'canPlaySource should exist for HTML5');
    ok(html5.registerSourceHandler, 'registerSourceHandler should exist for Html5');
    ok(html5.selectSourceHandler, 'selectSourceHandler should exist for Html5');
    ok(html5.prototype.setSource, 'setSource should exist for Html5');
    ok(html5.prototype.disposeSourceHandler, 'disposeSourceHandler should exist for Html5');

    ok(flash.canPlaySource, 'canPlaySource should exist for Flash');
    ok(flash.registerSourceHandler, 'registerSourceHandler should exist for Flash');
    ok(flash.selectSourceHandler, 'selectSourceHandler should exist for Flash');
    ok(flash.prototype.setSource, 'setSource should exist for Flash');
    ok(flash.prototype.disposeSourceHandler, 'disposeSourceHandler should exist for Flash');
  });

  test('should export ready api call to public', function () {
    var videoTag = testHelperMakeTag();

    var fixture = document.getElementById('qunit-fixture');
    fixture.appendChild(videoTag);

    var player = videojs('example_1');
    ok(player.ready !== undefined, 'ready callback is defined');
    player.dispose();
  });

  test('should export useful components to the public', function () {
    ok(videojs.TOUCH_ENABLED !== undefined, 'Touch detection should be public');
    ok(videojs.getComponent('ControlBar'), 'ControlBar should be public');
    ok(videojs.getComponent('Button'), 'Button should be public');
    ok(videojs.getComponent('PlayToggle'), 'PlayToggle should be public');
    ok(videojs.getComponent('FullscreenToggle'), 'FullscreenToggle should be public');
    ok(videojs.getComponent('BigPlayButton'), 'BigPlayButton should be public');
    ok(videojs.getComponent('LoadingSpinner'), 'LoadingSpinner should be public');
    ok(videojs.getComponent('CurrentTimeDisplay'), 'CurrentTimeDisplay should be public');
    ok(videojs.getComponent('DurationDisplay'), 'DurationDisplay should be public');
    ok(videojs.getComponent('TimeDivider'), 'TimeDivider should be public');
    ok(videojs.getComponent('RemainingTimeDisplay'), 'RemainingTimeDisplay should be public');
    ok(videojs.getComponent('Slider'), 'Slider should be public');
    ok(videojs.getComponent('ProgressControl'), 'ProgressControl should be public');
    ok(videojs.getComponent('SeekBar'), 'SeekBar should be public');
    ok(videojs.getComponent('LoadProgressBar'), 'LoadProgressBar should be public');
    ok(videojs.getComponent('PlayProgressBar'), 'PlayProgressBar should be public');
    ok(videojs.getComponent('SeekHandle'), 'SeekHandle should be public');
    ok(videojs.getComponent('VolumeControl'), 'VolumeControl should be public');
    ok(videojs.getComponent('VolumeBar'), 'VolumeBar should be public');
    ok(videojs.getComponent('VolumeLevel'), 'VolumeLevel should be public');
    ok(videojs.getComponent('VolumeMenuButton'), 'VolumeMenuButton should be public');
    ok(videojs.getComponent('VolumeHandle'), 'VolumeHandle should be public');
    ok(videojs.getComponent('MuteToggle'), 'MuteToggle should be public');
    ok(videojs.getComponent('PosterImage'), 'PosterImage should be public');
    ok(videojs.getComponent('Menu'), 'Menu should be public');
    ok(videojs.getComponent('MenuItem'), 'MenuItem should be public');
    ok(videojs.getComponent('MenuButton'), 'MenuButton should be public');
    ok(videojs.getComponent('PlaybackRateMenuButton'), 'PlaybackRateMenuButton should be public');

    ok(videojs.getComponent('CaptionSettingsMenuItem'), 'CaptionSettingsMenuItem should be public');
    ok(videojs.getComponent('OffTextTrackMenuItem'), 'OffTextTrackMenuItem should be public');
    ok(videojs.getComponent('TextTrackMenuItem'), 'TextTrackMenuItem should be public');
    ok(videojs.getComponent('TextTrackDisplay'), 'TextTrackDisplay should be public');
    ok(videojs.getComponent('TextTrackButton'), 'TextTrackButton should be public');
    ok(videojs.getComponent('CaptionsButton'), 'CaptionsButton should be public');
    ok(videojs.getComponent('SubtitlesButton'), 'SubtitlesButton should be public');
    ok(videojs.getComponent('ChaptersButton'), 'ChaptersButton should be public');
    ok(videojs.getComponent('ChaptersTrackMenuItem'), 'ChaptersTrackMenuItem should be public');

    ok(videojs.util, 'util namespace should be public');
    ok(videojs.util.mergeOptions, 'mergeOptions should be public');
  });

  test('should be able to initialize player twice on the same tag using string reference', function () {
    var videoTag = testHelperMakeTag();
    var id = videoTag.id;

    var fixture = document.getElementById('qunit-fixture');
    fixture.appendChild(videoTag);

    var player = videojs('example_1');
    player.dispose();
    ok(!document.getElementById(id), 'element is removed');

    videoTag = testHelperMakeTag();
    fixture.appendChild(videoTag);

    player = videojs('example_1');
    player.dispose();
  });

  test('videojs.players should be available after minification', function () {
    var videoTag = testHelperMakeTag();
    var id = videoTag.id;

    var fixture = document.getElementById('qunit-fixture');
    fixture.appendChild(videoTag);

    var player = videojs(id);
    ok(videojs.players[id] === player, 'videojs.players is available');

    player.dispose();
  });

  test('component can be subclassed externally', function () {
    var Component = videojs.getComponent('Component');
    var ControlBar = videojs.getComponent('ControlBar');

    var player = new (Component.extend({
      languages: function languages() {},
      reportUserActivity: function reportUserActivity() {},
      language: function language() {},
      textTracks: function textTracks() {
        return {
          addEventListener: Function.prototype,
          removeEventListener: Function.prototype
        };
      }
    }))({
      id: function id() {},
      reportUserActivity: function reportUserActivity() {}
    });

    ok(new ControlBar(player), 'created a control bar without throwing');
  });

  function testHelperMakeTag() {
    var videoTag = document.createElement('video');
    videoTag.id = 'example_1';
    videoTag.className = 'video-js vjs-default-skin';
    return videoTag;
  }

  test('should extend Component', function () {
    var Component = videojs.getComponent('Component');
    var MyComponent = videojs['extends'](Component, {
      constructor: function constructor() {
        this.bar = true;
      },
      foo: function foo() {
        return true;
      }
    });

    var myComponent = new MyComponent();
    ok(myComponent instanceof Component, 'creates an instance of Component');
    ok(myComponent instanceof MyComponent, 'creates an instance of MyComponent');
    ok(myComponent.bar, 'the constructor function is used');
    ok(myComponent.foo(), 'instance methods are applied');

    var NoMethods = videojs['extends'](Component);
    var noMethods = new NoMethods({});
    ok(noMethods.on, 'should extend component with no methods or constructor');
  });
})();

},{}],90:[function(require,module,exports){
'use strict';

var _interopRequireWildcard = function (obj) { return obj && obj.__esModule ? obj : { 'default': obj }; };

var _window = require('global/window');

var _window2 = _interopRequireWildcard(_window);

var _sinon = require('sinon');

var _sinon2 = _interopRequireWildcard(_sinon);

_window2['default'].q = QUnit;
_window2['default'].sinon = _sinon2['default'];

// This may not be needed anymore, but double check before removing
_window2['default'].fixture = document.createElement('div');
fixture.id = 'qunit-fixture';
document.body.appendChild(fixture);

},{"global/window":2,"sinon":9}],91:[function(require,module,exports){
'use strict';

var _interopRequireWildcard = function (obj) { return obj && obj.__esModule ? obj : { 'default': obj }; };

var _Button = require('../../src/js/button.js');

var _Button2 = _interopRequireWildcard(_Button);

var _TestHelpers = require('./test-helpers.js');

var _TestHelpers2 = _interopRequireWildcard(_TestHelpers);

q.module('Button');

test('should localize its text', function () {
  expect(1);

  var player, testButton, el;

  player = _TestHelpers2['default'].makePlayer({
    language: 'es',
    languages: {
      es: {
        Play: 'Juego'
      }
    }
  });

  testButton = new _Button2['default'](player);
  testButton.buttonText = 'Play';
  el = testButton.createEl();

  ok(el.innerHTML, 'Juego', 'translation was successful');
});

},{"../../src/js/button.js":25,"./test-helpers.js":107}],92:[function(require,module,exports){
'use strict';

var _interopRequireWildcard = function (obj) { return obj && obj.__esModule ? obj : { 'default': obj }; };

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } };

var _inherits = function (subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; };

var _Component2 = require('../../src/js/component.js');

var _Component3 = _interopRequireWildcard(_Component2);

var _import = require('../../src/js/lib.js');

var Lib = _interopRequireWildcard(_import);

var _import2 = require('../../src/js/events.js');

var Events = _interopRequireWildcard(_import2);

var _document = require('global/document');

var _document2 = _interopRequireWildcard(_document);

q.module('Component', {
  setup: function setup() {
    this.clock = sinon.useFakeTimers();
  },
  teardown: function teardown() {
    this.clock.restore();
  }
});

var getFakePlayer = function getFakePlayer() {
  return {
    // Fake player requries an ID
    id: function id() {
      return 'player_1';
    },
    reportUserActivity: function reportUserActivity() {}
  };
};

test('should create an element', function () {
  var comp = new _Component3['default'](getFakePlayer(), {});

  ok(comp.el().nodeName);
});

test('should add a child component', function () {
  var comp = new _Component3['default'](getFakePlayer());

  var child = comp.addChild('component');

  ok(comp.children().length === 1);
  ok(comp.children()[0] === child);
  ok(comp.el().childNodes[0] === child.el());
  ok(comp.getChild('component') === child);
  ok(comp.getChildById(child.id()) === child);
});

test('should init child components from options', function () {
  var comp = new _Component3['default'](getFakePlayer(), {
    children: {
      component: {}
    }
  });

  ok(comp.children().length === 1);
  ok(comp.el().childNodes.length === 1);
});

test('should init child components from simple children array', function () {
  var comp = new _Component3['default'](getFakePlayer(), {
    children: ['component', 'component', 'component']
  });

  ok(comp.children().length === 3);
  ok(comp.el().childNodes.length === 3);
});

test('should init child components from children array of objects', function () {
  var comp = new _Component3['default'](getFakePlayer(), {
    children: [{ name: 'component' }, { name: 'component' }, { name: 'component' }]
  });

  ok(comp.children().length === 3);
  ok(comp.el().childNodes.length === 3);
});

test('should do a deep merge of child options', function () {
  // Create a default option for component
  _Component3['default'].prototype.options_ = {
    example: {
      childOne: { foo: 'bar', asdf: 'fdsa' },
      childTwo: {},
      childThree: {}
    }
  };

  var comp = new _Component3['default'](getFakePlayer(), {
    example: {
      childOne: { foo: 'baz', abc: '123' },
      childThree: false,
      childFour: {}
    }
  });

  var mergedOptions = comp.options();
  var children = mergedOptions.example;

  ok(children.childOne.foo === 'baz', 'value three levels deep overridden');
  ok(children.childOne.asdf === 'fdsa', 'value three levels deep maintained');
  ok(children.childOne.abc === '123', 'value three levels deep added');
  ok(children.childTwo, 'object two levels deep maintained');
  ok(children.childThree === false, 'object two levels deep removed');
  ok(children.childFour, 'object two levels deep added');

  ok(_Component3['default'].prototype.options_.example.childOne.foo === 'bar', 'prototype options were not overridden');

  // Reset default component options to none
  _Component3['default'].prototype.options_ = null;
});

test('should allows setting child options at the parent options level', function () {
  var parent, options;

  // using children array
  options = {
    children: ['component', 'nullComponent'],
    // parent-level option for child
    component: {
      foo: true
    },
    nullComponent: false
  };

  try {
    parent = new _Component3['default'](getFakePlayer(), options);
  } catch (err) {
    ok(false, 'Child with `false` option was initialized');
  }
  equal(parent.children()[0].options().foo, true, 'child options set when children array is used');

  // using children object
  options = {
    children: {
      component: {
        foo: false
      },
      nullComponent: {}
    },
    // parent-level option for child
    component: {
      foo: true
    },
    nullComponent: false
  };

  try {
    parent = new _Component3['default'](getFakePlayer(), options);
  } catch (err) {
    ok(false, 'Child with `false` option was initialized');
  }
  equal(parent.children()[0].options().foo, true, 'child options set when children object is used');
});

test('should dispose of component and children', function () {
  var comp = new _Component3['default'](getFakePlayer());

  // Add a child
  var child = comp.addChild('Component');
  ok(comp.children().length === 1);

  // Add a listener
  comp.on('click', function () {
    return true;
  });
  var data = Lib.getData(comp.el());
  var id = comp.el()[Lib.expando];

  var hasDisposed = false;
  var bubbles = null;
  comp.on('dispose', function (event) {
    hasDisposed = true;
    bubbles = event.bubbles;
  });

  comp.dispose();

  ok(hasDisposed, 'component fired dispose event');
  ok(bubbles === false, 'dispose event does not bubble');
  ok(!comp.children(), 'component children were deleted');
  ok(!comp.el(), 'component element was deleted');
  ok(!child.children(), 'child children were deleted');
  ok(!child.el(), 'child element was deleted');
  ok(!Lib.cache[id], 'listener cache nulled');
  ok(Lib.isEmpty(data), 'original listener cache object was emptied');
});

test('should add and remove event listeners to element', function () {
  var comp = new _Component3['default'](getFakePlayer(), {});

  // No need to make this async because we're triggering events inline.
  // We're going to trigger the event after removing the listener,
  // So if we get extra asserts that's a problem.
  expect(2);

  var testListener = function testListener() {
    ok(true, 'fired event once');
    ok(this === comp, 'listener has the component as context');
  };

  comp.on('test-event', testListener);
  comp.trigger('test-event');
  comp.off('test-event', testListener);
  comp.trigger('test-event');
});

test('should trigger a listener once using one()', function () {
  var comp = new _Component3['default'](getFakePlayer(), {});

  expect(1);

  var testListener = function testListener() {
    ok(true, 'fired event once');
  };

  comp.one('test-event', testListener);
  comp.trigger('test-event');
  comp.trigger('test-event');
});

test('should add listeners to other components and remove them', function () {
  var player = getFakePlayer(),
      comp1 = new _Component3['default'](player),
      comp2 = new _Component3['default'](player),
      listenerFired = 0,
      testListener;

  testListener = function () {
    equal(this, comp1, 'listener has the first component as context');
    listenerFired++;
  };

  comp1.on(comp2, 'test-event', testListener);
  comp2.trigger('test-event');
  equal(listenerFired, 1, 'listener was fired once');

  listenerFired = 0;
  comp1.off(comp2, 'test-event', testListener);
  comp2.trigger('test-event');
  equal(listenerFired, 0, 'listener was not fired after being removed');

  // this component is disposed first
  listenerFired = 0;
  comp1.on(comp2, 'test-event', testListener);
  comp1.dispose();
  comp2.trigger('test-event');
  equal(listenerFired, 0, 'listener was removed when this component was disposed first');
  comp1.off = function () {
    throw 'Comp1 off called';
  };
  comp2.dispose();
  ok(true, 'this component removed dispose listeners from other component');
});

test('should add listeners to other components and remove when them other component is disposed', function () {
  var player = getFakePlayer(),
      comp1 = new _Component3['default'](player),
      comp2 = new _Component3['default'](player),
      listenerFired = 0,
      testListener;

  testListener = function () {
    equal(this, comp1, 'listener has the first component as context');
    listenerFired++;
  };

  comp1.on(comp2, 'test-event', testListener);
  comp2.dispose();
  comp2.off = function () {
    throw 'Comp2 off called';
  };
  comp1.dispose();
  ok(true, 'this component removed dispose listener from this component that referenced other component');
});

test('should add listeners to other components that are fired once', function () {
  var player = getFakePlayer(),
      comp1 = new _Component3['default'](player),
      comp2 = new _Component3['default'](player),
      listenerFired = 0,
      testListener;

  testListener = function () {
    equal(this, comp1, 'listener has the first component as context');
    listenerFired++;
  };

  comp1.one(comp2, 'test-event', testListener);
  comp2.trigger('test-event');
  equal(listenerFired, 1, 'listener was executed once');
  comp2.trigger('test-event');
  equal(listenerFired, 1, 'listener was executed only once');
});

test('should add listeners to other element and remove them', function () {
  var player = getFakePlayer(),
      comp1 = new _Component3['default'](player),
      el = _document2['default'].createElement('div'),
      listenerFired = 0,
      testListener;

  testListener = function () {
    equal(this, comp1, 'listener has the first component as context');
    listenerFired++;
  };

  comp1.on(el, 'test-event', testListener);
  Events.trigger(el, 'test-event');
  equal(listenerFired, 1, 'listener was fired once');

  listenerFired = 0;
  comp1.off(el, 'test-event', testListener);
  Events.trigger(el, 'test-event');
  equal(listenerFired, 0, 'listener was not fired after being removed from other element');

  // this component is disposed first
  listenerFired = 0;
  comp1.on(el, 'test-event', testListener);
  comp1.dispose();
  Events.trigger(el, 'test-event');
  equal(listenerFired, 0, 'listener was removed when this component was disposed first');
  comp1.off = function () {
    throw 'Comp1 off called';
  };
  try {
    Events.trigger(el, 'dispose');
  } catch (e) {
    ok(false, 'listener was not removed from other element');
  }
  Events.trigger(el, 'dispose');
  ok(true, 'this component removed dispose listeners from other element');
});

test('should add listeners to other components that are fired once', function () {
  var player = getFakePlayer(),
      comp1 = new _Component3['default'](player),
      el = _document2['default'].createElement('div'),
      listenerFired = 0,
      testListener;

  testListener = function () {
    equal(this, comp1, 'listener has the first component as context');
    listenerFired++;
  };

  comp1.one(el, 'test-event', testListener);
  Events.trigger(el, 'test-event');
  equal(listenerFired, 1, 'listener was executed once');
  Events.trigger(el, 'test-event');
  equal(listenerFired, 1, 'listener was executed only once');
});

test('should trigger a listener when ready', function () {
  expect(2);

  var optionsReadyListener = function optionsReadyListener() {
    ok(true, 'options listener fired');
  };
  var methodReadyListener = function methodReadyListener() {
    ok(true, 'ready method listener fired');
  };

  var comp = new _Component3['default'](getFakePlayer(), {}, optionsReadyListener);

  comp.triggerReady();

  comp.ready(methodReadyListener);

  // First two listeners should only be fired once and then removed
  comp.triggerReady();
});

test('should add and remove a CSS class', function () {
  var comp = new _Component3['default'](getFakePlayer(), {});

  comp.addClass('test-class');
  ok(comp.el().className.indexOf('test-class') !== -1);
  comp.removeClass('test-class');
  ok(comp.el().className.indexOf('test-class') === -1);
});

test('should show and hide an element', function () {
  var comp = new _Component3['default'](getFakePlayer(), {});

  comp.hide();
  ok(comp.hasClass('vjs-hidden') === true);
  comp.show();
  ok(comp.hasClass('vjs-hidden') === false);
});

test('dimension() should treat NaN and null as zero', function () {
  var comp, width, height, newWidth, newHeight;
  width = 300;
  height = 150;

  comp = new _Component3['default'](getFakePlayer(), {}),
  // set component dimension

  comp.dimensions(width, height);

  newWidth = comp.dimension('width', null);

  notEqual(newWidth, width, 'new width and old width are not the same');
  equal(newWidth, comp, 'we set a value, so, return value is component');
  equal(comp.width(), 0, 'the new width is zero');

  newHeight = comp.dimension('height', NaN);

  notEqual(newHeight, height, 'new height and old height are not the same');
  equal(newHeight, comp, 'we set a value, so, return value is component');
  equal(comp.height(), 0, 'the new height is zero');

  comp.width(width);
  newWidth = comp.dimension('width', undefined);

  equal(newWidth, width, 'we did not set the width with undefined');
});

test('should change the width and height of a component', function () {
  var container = _document2['default'].createElement('div');
  var comp = new _Component3['default'](getFakePlayer(), {});
  var el = comp.el();
  var fixture = _document2['default'].getElementById('qunit-fixture');

  fixture.appendChild(container);
  container.appendChild(el);
  // Container of el needs dimensions or the component won't have dimensions
  container.style.width = '1000px';
  container.style.height = '1000px';

  comp.width('50%');
  comp.height('123px');

  ok(comp.width() === 500, 'percent values working');
  var compStyle = Lib.getComputedDimension(el, 'width');
  ok(compStyle === comp.width() + 'px', 'matches computed style');
  ok(comp.height() === 123, 'px values working');

  comp.width(321);
  ok(comp.width() === 321, 'integer values working');

  comp.width('auto');
  comp.height('auto');
  ok(comp.width() === 1000, 'forced width was removed');
  ok(comp.height() === 0, 'forced height was removed');
});

test('should use a defined content el for appending children', function () {
  var CompWithContent = (function (_Component) {
    function CompWithContent() {
      _classCallCheck(this, CompWithContent);

      if (_Component != null) {
        _Component.apply(this, arguments);
      }
    }

    _inherits(CompWithContent, _Component);

    return CompWithContent;
  })(_Component3['default']);

  CompWithContent.prototype.createEl = function () {
    // Create the main componenent element
    var el = Lib.createEl('div');
    // Create the element where children will be appended
    this.contentEl_ = Lib.createEl('div', { id: 'contentEl' });
    el.appendChild(this.contentEl_);
    return el;
  };

  var comp = new CompWithContent(getFakePlayer());
  var child = comp.addChild('component');

  ok(comp.children().length === 1);
  ok(comp.el().childNodes[0].id === 'contentEl');
  ok(comp.el().childNodes[0].childNodes[0] === child.el());

  comp.removeChild(child);

  ok(comp.children().length === 0, 'Length should now be zero');
  ok(comp.el().childNodes[0].id === 'contentEl', 'Content El should still exist');
  ok(comp.el().childNodes[0].childNodes[0] !== child.el(), 'Child el should be removed.');
});

test('should emit a tap event', function () {
  expect(3);

  // Fake touch support. Real touch support isn't needed for this test.
  var origTouch = Lib.TOUCH_ENABLED;
  Lib.TOUCH_ENABLED = true;

  var comp = new _Component3['default'](getFakePlayer());
  var singleTouch = {};

  comp.emitTapEvents();
  comp.on('tap', function () {
    ok(true, 'Tap event emitted');
  });

  // A touchstart followed by touchend should trigger a tap
  Events.trigger(comp.el(), { type: 'touchstart', touches: [{}] });
  comp.trigger('touchend');

  // A touchmove with a lot of movement should not trigger a tap
  Events.trigger(comp.el(), { type: 'touchstart', touches: [{ pageX: 0, pageY: 0 }] });
  Events.trigger(comp.el(), { type: 'touchmove', touches: [{ pageX: 100, pageY: 100 }] });
  comp.trigger('touchend');

  // A touchmove with not much movement should still allow a tap
  Events.trigger(comp.el(), { type: 'touchstart', touches: [{ pageX: 0, pageY: 0 }] });
  Events.trigger(comp.el(), { type: 'touchmove', touches: [{ pageX: 7, pageY: 7 }] });
  comp.trigger('touchend');

  // A touchmove with a lot of movement by modifying the exisiting touch object
  // should not trigger a tap
  singleTouch = { pageX: 0, pageY: 0 };
  Events.trigger(comp.el(), { type: 'touchstart', touches: [singleTouch] });
  singleTouch.pageX = 100;
  singleTouch.pageY = 100;
  Events.trigger(comp.el(), { type: 'touchmove', touches: [singleTouch] });
  comp.trigger('touchend');

  // A touchmove with not much movement by modifying the exisiting touch object
  // should still allow a tap
  singleTouch = { pageX: 0, pageY: 0 };
  Events.trigger(comp.el(), { type: 'touchstart', touches: [singleTouch] });
  singleTouch.pageX = 7;
  singleTouch.pageY = 7;
  Events.trigger(comp.el(), { type: 'touchmove', touches: [singleTouch] });
  comp.trigger('touchend');

  // Reset to orignial value
  Lib.TOUCH_ENABLED = origTouch;
});

test('should provide timeout methods that automatically get cleared on component disposal', function () {
  expect(4);

  var comp = new _Component3['default'](getFakePlayer());
  var timeoutsFired = 0;

  comp.setTimeout(function () {
    timeoutsFired++;
    equal(this, comp, 'Timeout fn has the component as its context');
    ok(true, 'Timeout created and fired.');
  }, 100);

  var timeoutToClear = comp.setTimeout(function () {
    timeoutsFired++;
    ok(false, 'Timeout should have been manually cleared');
  }, 500);

  comp.setTimeout(function () {
    timeoutsFired++;
    ok(false, 'Timeout should have been disposed');
  }, 1000);

  this.clock.tick(100);

  ok(timeoutsFired === 1, 'One timeout should have fired by this point');

  comp.clearTimeout(timeoutToClear);

  this.clock.tick(500);

  comp.dispose();

  this.clock.tick(1000);

  ok(timeoutsFired === 1, 'One timeout should have fired overall');
});

test('should provide interval methods that automatically get cleared on component disposal', function () {
  expect(13);

  var comp = new _Component3['default'](getFakePlayer());
  var intervalsFired = 0;

  var interval = comp.setInterval(function () {
    intervalsFired++;
    equal(this, comp, 'Interval fn has the component as its context');
    ok(true, 'Interval created and fired.');
  }, 100);

  comp.setInterval(function () {
    intervalsFired++;
    ok(false, 'Interval should have been disposed');
  }, 1200);

  this.clock.tick(500);

  ok(intervalsFired === 5, 'Component interval fired 5 times');

  comp.clearInterval(interval);

  this.clock.tick(600);

  ok(intervalsFired === 5, 'Interval was manually cleared');

  comp.dispose();

  this.clock.tick(1200);

  ok(intervalsFired === 5, 'Interval was cleared when component was disposed');
});

},{"../../src/js/component.js":26,"../../src/js/events.js":62,"../../src/js/lib.js":64,"global/document":1}],93:[function(require,module,exports){
'use strict';

var _interopRequireWildcard = function (obj) { return obj && obj.__esModule ? obj : { 'default': obj }; };

var _VolumeControl = require('../../src/js/control-bar/volume-control/volume-control.js');

var _VolumeControl2 = _interopRequireWildcard(_VolumeControl);

var _MuteToggle = require('../../src/js/control-bar/mute-toggle.js');

var _MuteToggle2 = _interopRequireWildcard(_MuteToggle);

var _PlaybackRateMenuButton = require('../../src/js/control-bar/playback-rate-menu/playback-rate-menu-button.js');

var _PlaybackRateMenuButton2 = _interopRequireWildcard(_PlaybackRateMenuButton);

var _Slider = require('../../src/js/slider/slider.js');

var _Slider2 = _interopRequireWildcard(_Slider);

var _TestHelpers = require('./test-helpers.js');

var _TestHelpers2 = _interopRequireWildcard(_TestHelpers);

var _document = require('global/document');

var _document2 = _interopRequireWildcard(_document);

q.module('Controls');

test('should hide volume control if it\'s not supported', function () {
  expect(2);

  var noop, player, volumeControl, muteToggle;
  noop = function () {};
  player = {
    id: noop,
    on: noop,
    ready: noop,
    language: noop,
    languages: noop,
    tech: {
      featuresVolumeControl: false
    },
    volume: function volume() {},
    muted: function muted() {},
    reportUserActivity: function reportUserActivity() {}
  };

  volumeControl = new _VolumeControl2['default'](player);
  muteToggle = new _MuteToggle2['default'](player);

  ok(volumeControl.el().className.indexOf('vjs-hidden') >= 0, 'volumeControl is not hidden');
  ok(muteToggle.el().className.indexOf('vjs-hidden') >= 0, 'muteToggle is not hidden');
});

test('should test and toggle volume control on `loadstart`', function () {
  var noop, listeners, player, volumeControl, muteToggle, i;
  noop = function () {};
  listeners = [];
  player = {
    id: noop,
    language: noop,
    languages: noop,
    on: function on(event, callback) {
      // don't fire dispose listeners
      if (event !== 'dispose') {
        listeners.push(callback);
      }
    },
    ready: noop,
    volume: function volume() {
      return 1;
    },
    muted: function muted() {
      return false;
    },
    tech: {
      featuresVolumeControl: true
    },
    reportUserActivity: function reportUserActivity() {}
  };

  volumeControl = new _VolumeControl2['default'](player);
  muteToggle = new _MuteToggle2['default'](player);

  equal(volumeControl.hasClass('vjs-hidden'), false, 'volumeControl is hidden initially');
  equal(muteToggle.hasClass('vjs-hidden'), false, 'muteToggle is hidden initially');

  player.tech.featuresVolumeControl = false;
  for (i = 0; i < listeners.length; i++) {
    listeners[i]();
  }

  equal(volumeControl.hasClass('vjs-hidden'), true, 'volumeControl does not hide itself');
  equal(muteToggle.hasClass('vjs-hidden'), true, 'muteToggle does not hide itself');

  player.tech.featuresVolumeControl = true;
  for (i = 0; i < listeners.length; i++) {
    listeners[i]();
  }

  equal(volumeControl.hasClass('vjs-hidden'), false, 'volumeControl does not show itself');
  equal(muteToggle.hasClass('vjs-hidden'), false, 'muteToggle does not show itself');
});

test('calculateDistance should use changedTouches, if available', function () {
  var noop, player, slider, event;
  noop = function () {};
  player = {
    id: noop,
    on: noop,
    ready: noop,
    reportUserActivity: noop
  };
  slider = new _Slider2['default'](player);
  _document2['default'].body.appendChild(slider.el_);
  slider.el_.style.position = 'absolute';
  slider.el_.style.width = '200px';
  slider.el_.style.left = '0px';

  event = {
    pageX: 10,
    changedTouches: [{
      pageX: 100
    }]
  };

  equal(slider.calculateDistance(event), 0.5, 'we should have touched exactly in the center, so, the ratio should be half');
});

test('should hide playback rate control if it\'s not supported', function () {
  expect(1);

  var player = _TestHelpers2['default'].makePlayer();
  var playbackRate = new _PlaybackRateMenuButton2['default'](player);

  ok(playbackRate.el().className.indexOf('vjs-hidden') >= 0, 'playbackRate is not hidden');
});

},{"../../src/js/control-bar/mute-toggle.js":30,"../../src/js/control-bar/playback-rate-menu/playback-rate-menu-button.js":32,"../../src/js/control-bar/volume-control/volume-control.js":54,"../../src/js/slider/slider.js":75,"./test-helpers.js":107,"global/document":1}],94:[function(require,module,exports){
'use strict';

var _interopRequireWildcard = function (obj) { return obj && obj.__esModule ? obj : { 'default': obj }; };

var _CoreObject = require('../../src/js/core-object.js');

var _CoreObject2 = _interopRequireWildcard(_CoreObject);

q.module('Core Object');

test('should verify CoreObject extension', function () {
  var TestObject = _CoreObject2['default'].extend({
    init: function init(initOptions) {
      this.a = initOptions.a;
    },
    testFn: function testFn() {
      return true;
    }
  });
  var instance = new TestObject({ a: true });

  ok(instance instanceof TestObject, 'New instance is instance of TestObject');
  ok(instance instanceof _CoreObject2['default'], 'New instance is instance of CoreObject');
  ok(instance.a, 'Init options are passed to init');
  ok(instance.testFn(), 'Additional methods are applied to TestObject prototype');

  // Two levels of inheritance
  var TestChild = TestObject.extend({
    init: function init(initOptions) {
      TestObject.call(this, initOptions);
      // TestObject.prototype.init.call(this, initOptions);
      this.b = initOptions.b;
    },
    testFn: function testFn() {
      return false;
    }
  });

  var childInstance = new TestChild({ a: true, b: true });

  ok(childInstance instanceof TestChild, 'New instance is instance of TestChild');
  ok(childInstance instanceof TestObject, 'New instance is instance of TestObject');
  ok(childInstance instanceof _CoreObject2['default'], 'New instance is instance of CoreObject');
  ok(childInstance.b, 'Init options are passed to init');
  ok(childInstance.a, 'Init options are passed to super init');
  ok(childInstance.testFn() === false, 'Methods can be overridden by extend');
  ok(TestObject.prototype.testFn() === true, 'Prototype of parent not overridden');
});

test('should verify CoreObject create function', function () {
  var TestObject = _CoreObject2['default'].extend({
    init: function init(initOptions) {
      this.a = initOptions.a;
    },
    testFn: function testFn() {
      return true;
    }
  });

  var instance = TestObject.create({ a: true });

  ok(instance instanceof TestObject, 'New instance is instance of TestObject');
  ok(instance instanceof _CoreObject2['default'], 'New instance is instance of CoreObject');
  ok(instance.a, 'Init options are passed to init');
  ok(instance.testFn(), 'Additional methods are applied to TestObject prototype');
});

},{"../../src/js/core-object.js":58}],95:[function(require,module,exports){
'use strict';

var _interopRequireWildcard = function (obj) { return obj && obj.__esModule ? obj : { 'default': obj }; };

var _videojs = require('../../src/js/core.js');

var _videojs2 = _interopRequireWildcard(_videojs);

var _Player = require('../../src/js/player.js');

var _Player2 = _interopRequireWildcard(_Player);

var _import = require('../../src/js/lib.js');

var Lib = _interopRequireWildcard(_import);

var _Options = require('../../src/js/options.js');

var _Options2 = _interopRequireWildcard(_Options);

var _document = require('global/document');

var _document2 = _interopRequireWildcard(_document);

q.module('Core');

test('should create a video tag and have access children in old IE', function () {
  var fixture = _document2['default'].getElementById('qunit-fixture');

  fixture.innerHTML += '<video id="test_vid_id"><source type="video/mp4"></video>';

  var vid = _document2['default'].getElementById('test_vid_id');

  ok(vid.childNodes.length === 1);
  ok(vid.childNodes[0].getAttribute('type') === 'video/mp4');
});

test('should return a video player instance', function () {
  var fixture = _document2['default'].getElementById('qunit-fixture');
  fixture.innerHTML += '<video id="test_vid_id"></video><video id="test_vid_id2"></video>';

  var player = _videojs2['default']('test_vid_id');
  ok(player, 'created player from tag');
  ok(player.id() === 'test_vid_id');
  ok(_Player2['default'].players.test_vid_id === player, 'added player to global reference');

  var playerAgain = _videojs2['default']('test_vid_id');
  ok(player === playerAgain, 'did not create a second player from same tag');

  var tag2 = _document2['default'].getElementById('test_vid_id2');
  var player2 = _videojs2['default'](tag2);
  ok(player2.id() === 'test_vid_id2', 'created player from element');
});

test('should add the value to the languages object', function () {
  var code, data, result;

  code = 'es';
  data = { Hello: 'Hola' };
  result = _videojs2['default'].addLanguage(code, data);

  ok(_Options2['default'].languages[code], 'should exist');
  equal(_Options2['default'].languages[code], data, 'should match');
  deepEqual(result[code], _Options2['default'].languages[code], 'should also match');
});

},{"../../src/js/core.js":59,"../../src/js/lib.js":64,"../../src/js/options.js":70,"../../src/js/player.js":71,"global/document":1}],96:[function(require,module,exports){
'use strict';

var _interopRequireWildcard = function (obj) { return obj && obj.__esModule ? obj : { 'default': obj }; };

var _import = require('../../src/js/events.js');

var Events = _interopRequireWildcard(_import);

var _document = require('global/document');

var _document2 = _interopRequireWildcard(_document);

q.module('Events');

test('should add and remove an event listener to an element', function () {
  expect(1);

  var el = _document2['default'].createElement('div');
  var listener = function listener() {
    ok(true, 'Click Triggered');
  };

  Events.on(el, 'click', listener);
  Events.trigger(el, 'click'); // 1 click
  Events.off(el, 'click', listener);
  Events.trigger(el, 'click'); // No click should happen.
});

test('should add and remove multiple event listeners to an element with a single call', function () {
  expect(6);

  var el = _document2['default'].createElement('div');
  var listener = function listener() {
    ok(true, 'Callback triggered');
  };

  Events.on(el, ['click', 'event1', 'event2'], listener);

  Events.trigger(el, 'click');
  Events.trigger(el, 'click');
  Events.off(el, 'click', listener);
  Events.trigger(el, 'click'); // No click should happen.

  Events.trigger(el, 'event1');
  Events.trigger(el, 'event1');
  Events.off(el, 'event1', listener);
  Events.trigger(el, 'event1'); // No event1 should happen.

  Events.trigger(el, 'event2');
  Events.trigger(el, 'event2');
  Events.off(el, 'event2', listener);
  Events.trigger(el, 'event2'); // No event2 should happen.
});

test('should remove all listeners of a type', function () {
  var el = _document2['default'].createElement('div');
  var clicks = 0;
  var listener = function listener() {
    clicks++;
  };
  var listener2 = function listener2() {
    clicks++;
  };

  Events.on(el, 'click', listener);
  Events.on(el, 'click', listener2);
  Events.trigger(el, 'click'); // 2 clicks

  ok(clicks === 2, 'both click listeners fired');

  Events.off(el, 'click');
  Events.trigger(el, 'click'); // No click should happen.

  ok(clicks === 2, 'no click listeners fired');
});

test('should remove all listeners of an array of types', function () {
  var el = _document2['default'].createElement('div');
  var calls = 0;
  var listener = function listener() {
    calls++;
  };
  var listener2 = function listener2() {
    calls++;
  };

  Events.on(el, ['click', 'event1'], listener);
  Events.on(el, ['click', 'event1'], listener2);
  Events.trigger(el, 'click'); // 2 calls
  Events.trigger(el, 'event1'); // 2 calls

  ok(calls === 4, 'both click listeners fired');

  Events.off(el, ['click', 'event1']);
  Events.trigger(el, 'click'); // No click should happen.
  Events.trigger(el, 'event1'); // No event1 should happen.

  ok(calls === 4, 'no event listeners fired');
});

test('should remove all listeners from an element', function () {
  expect(2);

  var el = _document2['default'].createElement('div');
  var listener = function listener() {
    ok(true, 'Fake1 Triggered');
  };
  var listener2 = function listener2() {
    ok(true, 'Fake2 Triggered');
  };

  Events.on(el, 'fake1', listener);
  Events.on(el, 'fake2', listener2);

  Events.trigger(el, 'fake1');
  Events.trigger(el, 'fake2');

  Events.off(el);

  // No listener should happen.
  Events.trigger(el, 'fake1');
  Events.trigger(el, 'fake2');
});

test('should listen only once', function () {
  expect(1);

  var el = _document2['default'].createElement('div');
  var listener = function listener() {
    ok(true, 'Click Triggered');
  };

  Events.one(el, 'click', listener);
  Events.trigger(el, 'click'); // 1 click
  Events.trigger(el, 'click'); // No click should happen.
});

test('should listen only once in multiple events from a single call', function () {
  expect(3);

  var el = _document2['default'].createElement('div');
  var listener = function listener() {
    ok(true, 'Callback Triggered');
  };

  Events.one(el, ['click', 'event1', 'event2'], listener);
  Events.trigger(el, 'click'); // 1 click
  Events.trigger(el, 'click'); // No click should happen.
  Events.trigger(el, 'event1'); // event1 must be handled.
  Events.trigger(el, 'event1'); // No event1 should be handled.
  Events.trigger(el, 'event2'); // event2 must be handled.
  Events.trigger(el, 'event2'); // No event2 should be handled.
});

test('should stop immediate propagtion', function () {
  expect(1);

  var el = _document2['default'].createElement('div');

  Events.on(el, 'test', function (e) {
    ok(true, 'First listener fired');
    e.stopImmediatePropagation();
  });

  Events.on(el, 'test', function (e) {
    ok(false, 'Second listener fired');
  });

  Events.trigger(el, 'test');
});

test('should bubble up DOM unless bubbles == false', function () {
  expect(3);

  var outer = _document2['default'].createElement('div');
  var inner = outer.appendChild(_document2['default'].createElement('div'));

  // Verify that if bubbles === true, event bubbles up dom.
  Events.on(inner, 'bubbles', function (e) {
    ok(true, 'Inner listener fired');
  });
  Events.on(outer, 'bubbles', function (e) {
    ok(true, 'Outer listener fired');
  });
  Events.trigger(inner, { type: 'bubbles', target: inner, bubbles: true });

  // Only change 'bubbles' to false, and verify only inner handler is called.
  Events.on(inner, 'nobub', function (e) {
    ok(true, 'Inner listener fired');
  });
  Events.on(outer, 'nobub', function (e) {
    ok(false, 'Outer listener fired');
  });
  Events.trigger(inner, { type: 'nobub', target: inner, bubbles: false });
});

test('should have a defaultPrevented property on an event that was prevent from doing default action', function () {
  expect(2);

  var el = _document2['default'].createElement('div');

  Events.on(el, 'test', function (e) {
    ok(true, 'First listener fired');
    e.preventDefault();
  });

  Events.on(el, 'test', function (e) {
    ok(e.defaultPrevented, 'Should have `defaultPrevented` to signify preventDefault being called');
  });

  Events.trigger(el, 'test');
});

},{"../../src/js/events.js":62,"global/document":1}],97:[function(require,module,exports){
'use strict';

var _interopRequireWildcard = function (obj) { return obj && obj.__esModule ? obj : { 'default': obj }; };

var _Flash = require('../../src/js/tech/flash.js');

var _Flash2 = _interopRequireWildcard(_Flash);

var _document = require('global/document');

var _document2 = _interopRequireWildcard(_document);

q.module('Flash');

var streamToPartsAndBack = function streamToPartsAndBack(url) {
  var parts = _Flash2['default'].streamToParts(url);
  return _Flash2['default'].streamFromParts(parts.connection, parts.stream);
};

test('test using both streamToParts and streamFromParts', function () {
  ok('rtmp://myurl.com/&isthis' === streamToPartsAndBack('rtmp://myurl.com/isthis'));
  ok('rtmp://myurl.com/&isthis' === streamToPartsAndBack('rtmp://myurl.com/&isthis'));
  ok('rtmp://myurl.com/isthis/&andthis' === streamToPartsAndBack('rtmp://myurl.com/isthis/andthis'));
});

test('test streamToParts', function () {
  var parts = _Flash2['default'].streamToParts('http://myurl.com/streaming&/is/fun');
  ok(parts.connection === 'http://myurl.com/streaming');
  ok(parts.stream === '/is/fun');

  parts = _Flash2['default'].streamToParts('http://myurl.com/&streaming&/is/fun');
  ok(parts.connection === 'http://myurl.com/');
  ok(parts.stream === 'streaming&/is/fun');

  parts = _Flash2['default'].streamToParts('http://myurl.com/streaming/is/fun');
  ok(parts.connection === 'http://myurl.com/streaming/is/');
  ok(parts.stream === 'fun');

  parts = _Flash2['default'].streamToParts('whatisgoingonhere');
  ok(parts.connection === 'whatisgoingonhere');
  ok(parts.stream === '');

  parts = _Flash2['default'].streamToParts();
  ok(parts.connection === '');
  ok(parts.stream === '');
});

test('test isStreamingSrc', function () {
  var isStreamingSrc = _Flash2['default'].isStreamingSrc;
  ok(isStreamingSrc('rtmp://streaming.is/fun'));
  ok(isStreamingSrc('rtmps://streaming.is/fun'));
  ok(isStreamingSrc('rtmpe://streaming.is/fun'));
  ok(isStreamingSrc('rtmpt://streaming.is/fun'));
  // test invalid protocols
  ok(!isStreamingSrc('rtmp:streaming.is/fun'));
  ok(!isStreamingSrc('rtmpz://streaming.is/fun'));
  ok(!isStreamingSrc('http://streaming.is/fun'));
  ok(!isStreamingSrc('https://streaming.is/fun'));
  ok(!isStreamingSrc('file://streaming.is/fun'));
});

test('test canPlaySource', function () {
  var canPlaySource = _Flash2['default'].canPlaySource;

  // supported
  ok(canPlaySource({ type: 'video/mp4; codecs=avc1.42E01E,mp4a.40.2' }), 'codecs supported');
  ok(canPlaySource({ type: 'video/mp4' }), 'video/mp4 supported');
  ok(canPlaySource({ type: 'video/x-flv' }), 'video/x-flv supported');
  ok(canPlaySource({ type: 'video/flv' }), 'video/flv supported');
  ok(canPlaySource({ type: 'video/m4v' }), 'video/m4v supported');
  ok(canPlaySource({ type: 'VIDEO/FLV' }), 'capitalized mime type');

  // not supported
  ok(!canPlaySource({ type: 'video/webm; codecs="vp8, vorbis"' }));
  ok(!canPlaySource({ type: 'video/webm' }));
});

test('currentTime is the seek target during seeking', function () {
  var noop = function noop() {},
      seeking = false,
      parentEl = _document2['default'].createElement('div'),
      tech = new _Flash2['default']({
    id: noop,
    bufferedPercent: noop,
    on: noop,
    trigger: noop,
    ready: noop,
    addChild: noop,
    options_: {},
    // This complexity is needed because of the VTT.js loading
    // It'd be great if we can find a better solution for that
    options: function options() {
      return {};
    },
    el: function el() {
      return {
        appendChild: noop
      };
    }
  }, {
    parentEl: parentEl
  }),
      currentTime;

  tech.el().vjs_setProperty = function (property, value) {
    if (property === 'currentTime') {
      currentTime = value;
    }
  };
  tech.el().vjs_getProperty = function (name) {
    if (name === 'currentTime') {
      return currentTime;
    } else if (name === 'seeking') {
      return seeking;
    }
  };

  currentTime = 3;
  strictEqual(3, tech.currentTime(), 'currentTime is retreived from the SWF');

  tech.setCurrentTime(7);
  seeking = true;
  strictEqual(7, tech.currentTime(), 'during seeks the target time is returned');
});

test('dispose removes the object element even before ready fires', function () {
  var noop = function noop() {},
      parentEl = _document2['default'].createElement('div'),
      tech = new _Flash2['default']({
    id: noop,
    on: noop,
    off: noop,
    trigger: noop,
    ready: noop,
    addChild: noop,
    options: function options() {
      return {};
    },
    options_: {}
  }, {
    parentEl: parentEl
  });

  tech.dispose();
  strictEqual(tech.el(), null, 'tech el is null');
  strictEqual(parentEl.children.length, 0, 'parent el is empty');
});

test('ready triggering before and after disposing the tech', function () {
  var checkReady, fixtureDiv, playerDiv, techEl;

  checkReady = sinon.stub(_Flash2['default'], 'checkReady');

  fixtureDiv = _document2['default'].getElementById('qunit-fixture');
  playerDiv = _document2['default'].createElement('div');
  techEl = _document2['default'].createElement('div');

  playerDiv.appendChild(techEl);
  fixtureDiv.appendChild(playerDiv);

  techEl.id = 'foo1234';
  playerDiv.player = {
    tech: {}
  };

  _Flash2['default'].onReady(techEl.id);
  ok(checkReady.called, 'checkReady should be called before the tech is disposed');

  // remove the tech el from the player div to simulate being disposed
  playerDiv.removeChild(techEl);
  _Flash2['default'].onReady(techEl.id);
  ok(!checkReady.calledTwice, 'checkReady should not be called after the tech is disposed');

  _Flash2['default'].checkReady.restore();
});

test('should have the source handler interface', function () {
  ok(_Flash2['default'].registerSourceHandler, 'has the registerSourceHandler function');
});

test('canHandleSource should be able to work with src objects without a type', function () {
  var canHandleSource = _Flash2['default'].nativeSourceHandler.canHandleSource;
  equal('maybe', canHandleSource({ src: 'test.video.mp4' }), 'should guess that it is a mp4 video');
  equal('maybe', canHandleSource({ src: 'test.video.m4v' }), 'should guess that it is a m4v video');
  equal('maybe', canHandleSource({ src: 'test.video.flv' }), 'should guess that it is a flash video');
  equal('', canHandleSource({ src: 'test.video.wgg' }), 'should return empty string if it can not play the video');
});

},{"../../src/js/tech/flash.js":77,"global/document":1}],98:[function(require,module,exports){
'use strict';

var _interopRequireWildcard = function (obj) { return obj && obj.__esModule ? obj : { 'default': obj }; };

var _import = require('../../src/js/lib.js');

var Lib = _interopRequireWildcard(_import);

var _window = require('global/window');

var _window2 = _interopRequireWildcard(_window);

var _document = require('global/document');

var _document2 = _interopRequireWildcard(_document);

q.module('Lib', {
  setup: function setup() {
    // Allow for stubbing createElement, should replace with sinon now
    this.createElement = _document2['default'].createElement;
  },
  teardown: function teardown() {
    _document2['default'].createElement = this.createElement;
  }
});

test('should create an element', function () {
  var div = Lib.createEl();
  var span = Lib.createEl('span', { 'data-test': 'asdf', innerHTML: 'fdsa' });
  ok(div.nodeName === 'DIV');
  ok(span.nodeName === 'SPAN');
  ok(span['data-test'] === 'asdf');
  ok(span.innerHTML === 'fdsa');
});

test('should make a string start with an uppercase letter', function () {
  var foo = Lib.capitalize('bar');
  ok(foo === 'Bar');
});

test('should loop through each property on an object', function () {
  var asdf = {
    a: 1,
    b: 2,
    c: 3
  };

  // Add 3 to each value
  Lib.obj.each(asdf, function (key, value) {
    asdf[key] = value + 3;
  });

  deepEqual(asdf, { a: 4, b: 5, c: 6 });
});

test('should copy an object', function () {
  var asdf = {
    a: 1,
    b: 2,
    c: 3
  };

  var fdsa = Lib.obj.copy(asdf);

  deepEqual(asdf, fdsa);
});

test('should check if an object is an Array', function () {
  var arr = ['a', 'b', 'c'];
  ok(Lib.obj.isArray(arr) === true, 'Arr object is an Array');

  var obj = {};
  ok(Lib.obj.isArray(obj) === false, 'Obj is not an Array');
});

test('should check if an object is plain', function () {
  var empty = {};
  ok(Lib.obj.isPlain(empty) === true, 'Empty object is plain');

  var node = _document2['default'].createElement('div');
  ok(Lib.obj.isPlain(node) === false, 'DOM node is not plain');

  var fn = function fn() {};
  ok(Lib.obj.isPlain(fn) === false, 'Function is not plain');
});

test('should add context to a function', function () {
  var newContext = { test: 'obj' };
  var asdf = function asdf() {
    ok(this === newContext);
  };
  var fdsa = Lib.bind(newContext, asdf);

  fdsa();
});

test('should add and remove a class name on an element', function () {
  var el = _document2['default'].createElement('div');
  Lib.addClass(el, 'test-class');
  ok(el.className === 'test-class', 'class added');
  Lib.addClass(el, 'test-class');
  ok(el.className === 'test-class', 'same class not duplicated');
  Lib.addClass(el, 'test-class2');
  ok(el.className === 'test-class test-class2', 'added second class');
  Lib.removeClass(el, 'test-class');
  ok(el.className === 'test-class2', 'removed first class');
});

test('should read class names on an element', function () {
  var el = _document2['default'].createElement('div');
  Lib.addClass(el, 'test-class1');
  ok(Lib.hasClass(el, 'test-class1') === true, 'class detected');
  ok(Lib.hasClass(el, 'test-class') === false, 'substring correctly not detected');
});

test('should get and remove data from an element', function () {
  var el = _document2['default'].createElement('div');
  var data = Lib.getData(el);
  var id = el[Lib.expando];

  ok(typeof data === 'object', 'data object created');

  // Add data
  var testData = { asdf: 'fdsa' };
  data.test = testData;
  ok(Lib.getData(el).test === testData, 'data added');

  // Remove all data
  Lib.removeData(el);

  ok(!Lib.cache[id], 'cached item nulled');
  ok(el[Lib.expando] === null || el[Lib.expando] === undefined, 'element data id removed');
});

test('should read tag attributes from elements, including HTML5 in all browsers', function () {
  var tags = '<video id="vid1" controls autoplay loop muted preload="none" src="http://google.com" poster="http://www2.videojs.com/img/video-js-html5-video-player.png" data-test="asdf" data-empty-string=""></video>';
  tags += '<video id="vid2">';
  // Not putting source and track inside video element because
  // oldIE needs the HTML5 shim to read tags inside HTML5 tags.
  // Still may not work in oldIE.
  tags += '<source id="source" src="http://google.com" type="video/mp4" media="fdsa" title="test" >';
  tags += '<track id="track" default src="http://google.com" kind="captions" srclang="en" label="testlabel" title="test" >';
  tags += '</video>';

  _document2['default'].getElementById('qunit-fixture').innerHTML += tags;

  var vid1Vals = Lib.getElementAttributes(_document2['default'].getElementById('vid1'));
  var vid2Vals = Lib.getElementAttributes(_document2['default'].getElementById('vid2'));
  var sourceVals = Lib.getElementAttributes(_document2['default'].getElementById('source'));
  var trackVals = Lib.getElementAttributes(_document2['default'].getElementById('track'));

  // was using deepEqual, but ie8 would send all properties as attributes

  // vid1
  equal(vid1Vals.autoplay, true);
  equal(vid1Vals.controls, true);
  equal(vid1Vals['data-test'], 'asdf');
  equal(vid1Vals['data-empty-string'], '');
  equal(vid1Vals.id, 'vid1');
  equal(vid1Vals.loop, true);
  equal(vid1Vals.muted, true);
  equal(vid1Vals.poster, 'http://www2.videojs.com/img/video-js-html5-video-player.png');
  equal(vid1Vals.preload, 'none');
  equal(vid1Vals.src, 'http://google.com');

  // vid2
  equal(vid2Vals.id, 'vid2');

  // sourceVals
  equal(sourceVals.title, 'test');
  equal(sourceVals.media, 'fdsa');
  equal(sourceVals.type, 'video/mp4');
  equal(sourceVals.src, 'http://google.com');
  equal(sourceVals.id, 'source');

  // trackVals
  equal(trackVals['default'], true);
  equal(trackVals.id, 'track');
  equal(trackVals.kind, 'captions');
  equal(trackVals.label, 'testlabel');
  equal(trackVals.src, 'http://google.com');
  equal(trackVals.srclang, 'en');
  equal(trackVals.title, 'test');
});

test('should set element attributes from object', function () {
  var el, vid1Vals;

  el = _document2['default'].createElement('div');
  el.id = 'el1';

  Lib.setElementAttributes(el, { controls: true, 'data-test': 'asdf' });

  equal(el.getAttribute('id'), 'el1');
  equal(el.getAttribute('controls'), '');
  equal(el.getAttribute('data-test'), 'asdf');
});

test('should get the right style values for an element', function () {
  var el = _document2['default'].createElement('div');
  var container = _document2['default'].createElement('div');
  var fixture = _document2['default'].getElementById('qunit-fixture');

  container.appendChild(el);
  fixture.appendChild(container);

  container.style.width = '1000px';
  container.style.height = '1000px';

  el.style.height = '100%';
  el.style.width = '123px';

  // integer px values may get translated int very-close floats in Chrome/OS X
  // so round the dimensions to ignore this
  equal(Math.round(parseFloat(Lib.getComputedDimension(el, 'height'))), 1000, 'the computed height is equal');
  equal(Math.round(parseFloat(Lib.getComputedDimension(el, 'width'))), 123, 'the computed width is equal');
});

test('should insert an element first in another', function () {
  var el1 = _document2['default'].createElement('div');
  var el2 = _document2['default'].createElement('div');
  var parent = _document2['default'].createElement('div');

  Lib.insertFirst(el1, parent);
  ok(parent.firstChild === el1, 'inserts first into empty parent');

  Lib.insertFirst(el2, parent);
  ok(parent.firstChild === el2, 'inserts first into parent with child');
});

test('should return the element with the ID', function () {
  var el1 = _document2['default'].createElement('div');
  var el2 = _document2['default'].createElement('div');
  var fixture = _document2['default'].getElementById('qunit-fixture');

  fixture.appendChild(el1);
  fixture.appendChild(el2);

  el1.id = 'test_id1';
  el2.id = 'test_id2';

  ok(Lib.el('test_id1') === el1, 'found element for ID');
  ok(Lib.el('#test_id2') === el2, 'found element for CSS ID');
});

test('should trim whitespace from a string', function () {
  ok(Lib.trim(' asdf asdf asdf   \t\n\r') === 'asdf asdf asdf');
});

test('should round a number', function () {
  ok(Lib.round(1.01) === 1);
  ok(Lib.round(1.5) === 2);
  ok(Lib.round(1.55, 2) === 1.55);
  ok(Lib.round(10.551, 2) === 10.55);
});

test('should format time as a string', function () {
  ok(Lib.formatTime(1) === '0:01');
  ok(Lib.formatTime(10) === '0:10');
  ok(Lib.formatTime(60) === '1:00');
  ok(Lib.formatTime(600) === '10:00');
  ok(Lib.formatTime(3600) === '1:00:00');
  ok(Lib.formatTime(36000) === '10:00:00');
  ok(Lib.formatTime(360000) === '100:00:00');

  // Using guide should provide extra leading zeros
  ok(Lib.formatTime(1, 1) === '0:01');
  ok(Lib.formatTime(1, 10) === '0:01');
  ok(Lib.formatTime(1, 60) === '0:01');
  ok(Lib.formatTime(1, 600) === '00:01');
  ok(Lib.formatTime(1, 3600) === '0:00:01');
  // Don't do extra leading zeros for hours
  ok(Lib.formatTime(1, 36000) === '0:00:01');
  ok(Lib.formatTime(1, 360000) === '0:00:01');
});

test('should format invalid times as dashes', function () {
  equal(Lib.formatTime(Infinity, 90), '-:-');
  equal(Lib.formatTime(NaN), '-:-');
  // equal(Lib.formatTime(NaN, 216000), '-:--:--');
  equal(Lib.formatTime(10, Infinity), '0:00:10');
  equal(Lib.formatTime(90, NaN), '1:30');
});

test('should create a fake timerange', function () {
  var tr = Lib.createTimeRange(0, 10);
  ok(tr.start() === 0);
  ok(tr.end() === 10);
});

test('should get an absolute URL', function () {
  // Errors on compiled tests that don't use unit.html. Need a better solution.
  // ok(Lib.getAbsoluteURL('unit.html') === window.location.href);
  ok(Lib.getAbsoluteURL('http://asdf.com') === 'http://asdf.com');
  ok(Lib.getAbsoluteURL('https://asdf.com/index.html') === 'https://asdf.com/index.html');
});

test('should parse the details of a url correctly', function () {
  equal(Lib.parseUrl('#').protocol, _window2['default'].location.protocol, 'parsed relative url protocol');
  equal(Lib.parseUrl('#').host, _window2['default'].location.host, 'parsed relative url host');

  equal(Lib.parseUrl('http://example.com').protocol, 'http:', 'parsed example url protocol');
  equal(Lib.parseUrl('http://example.com').hostname, 'example.com', 'parsed example url hostname');

  equal(Lib.parseUrl('http://example.com:1234').port, '1234', 'parsed example url port');
});

test('should strip port from hosts using http or https', function () {
  var url;

  // attempts to create elements will return an anchor tag that
  // misbehaves like IE9
  _document2['default'].createElement = function () {
    return {
      hostname: 'example.com',
      host: 'example.com:80',
      protocol: 'http:',
      port: '80',
      pathname: '/domain/relative/url',
      hash: ''
    };
  };

  url = Lib.parseUrl('/domain/relative/url');
  ok(!/.*:80$/.test(url.host), ':80 is not appended to the host');
});

test('Lib.findPosition should find top and left position', function () {
  var d = _document2['default'].createElement('div'),
      position = Lib.findPosition(d);
  d.style.top = '10px';
  d.style.left = '20px';
  d.style.position = 'absolute';

  deepEqual(position, { left: 0, top: 0 }, 'If element isn\'t in the DOM, we should get zeros');

  _document2['default'].body.appendChild(d);
  position = Lib.findPosition(d);
  deepEqual(position, { left: 20, top: 10 }, 'The position was not correct');

  d.getBoundingClientRect = null;
  position = Lib.findPosition(d);
  deepEqual(position, { left: 0, top: 0 }, 'If there is no gBCR, we should get zeros');
});

// LOG TESTS
test('should confirm logging functions work', function () {
  var console, log, error, warn, origConsole, origLog, origWarn, origError;

  origConsole = _window2['default'].console;
  // replace the native console for testing
  // in ie8 console.log is apparently not a 'function' so sinon chokes on it
  // https://github.com/cjohansen/Sinon.JS/issues/386
  // instead we'll temporarily replace them with no-op functions
  console = _window2['default'].console = {
    log: function log() {},
    warn: function warn() {},
    error: function error() {}
  };

  // stub the global log functions
  log = sinon.stub(console, 'log');
  error = sinon.stub(console, 'error');
  warn = sinon.stub(console, 'warn');

  Lib.log('log1', 'log2');
  Lib.log.warn('warn1', 'warn2');
  Lib.log.error('error1', 'error2');

  ok(log.called, 'log was called');
  equal(log.firstCall.args[0], 'VIDEOJS:');
  equal(log.firstCall.args[1], 'log1');
  equal(log.firstCall.args[2], 'log2');

  ok(warn.called, 'warn was called');
  equal(warn.firstCall.args[0], 'VIDEOJS:');
  equal(warn.firstCall.args[1], 'WARN:');
  equal(warn.firstCall.args[2], 'warn1');
  equal(warn.firstCall.args[3], 'warn2');

  ok(error.called, 'error was called');
  equal(error.firstCall.args[0], 'VIDEOJS:');
  equal(error.firstCall.args[1], 'ERROR:');
  equal(error.firstCall.args[2], 'error1');
  equal(error.firstCall.args[3], 'error2');

  ok(Lib.log.history.length === 3, 'there should be three messages in the log history');

  // tear down sinon
  log.restore();
  error.restore();
  warn.restore();

  // restore the native console
  _window2['default'].console = origConsole;
});

test('should loop through each element of an array', function () {
  expect(10);
  var a = [1, 2, 3];
  var sum = 0;
  var i = 0;
  var thisArg = {};

  Lib.arr.forEach(a, function (item, iterator, array) {
    sum += item;
    deepEqual(array, a, 'The array arg should match the original array');
    equal(i++, iterator, 'The indexes should match');
    equal(this, thisArg, 'The context should equal the thisArg');

    if (this !== thisArg) {
      ok(false, 'should allow setting the context');
    }
  }, thisArg);

  ok(sum, 6);
});

//getFileExtension tests
test('should get the file extension of the passed path', function () {
  equal(Lib.getFileExtension('/foo/bar/test.video.wgg'), 'wgg');
  equal(Lib.getFileExtension('test./video.mp4'), 'mp4');
  equal(Lib.getFileExtension('.bar/test.video.m4v'), 'm4v');
  equal(Lib.getFileExtension('foo/.bar/test.video.flv'), 'flv');
  equal(Lib.getFileExtension('foo/.bar/test.video.flv?foo=bar'), 'flv');
  equal(Lib.getFileExtension('http://www.test.com/video.mp4'), 'mp4');
  equal(Lib.getFileExtension('http://foo/bar/test.video.wgg'), 'wgg');

  //edge cases
  equal(Lib.getFileExtension('http://...'), '');
  equal(Lib.getFileExtension('foo/.bar/testvideo'), '');
  equal(Lib.getFileExtension(''), '');
  equal(Lib.getFileExtension(null), '');
  equal(Lib.getFileExtension(undefined), '');

  //with capital letters
  equal(Lib.getFileExtension('test.video.MP4'), 'mp4');
  equal(Lib.getFileExtension('test.video.FLV'), 'flv');
});

},{"../../src/js/lib.js":64,"global/document":1,"global/window":2}],99:[function(require,module,exports){
'use strict';

var _interopRequireWildcard = function (obj) { return obj && obj.__esModule ? obj : { 'default': obj }; };

var _Html5 = require('../../src/js/tech/html5.js');

var _Html52 = _interopRequireWildcard(_Html5);

var _import = require('../../src/js/lib.js');

var Lib = _interopRequireWildcard(_import);

var _document = require('global/document');

var _document2 = _interopRequireWildcard(_document);

var player, tech, el;

q.module('HTML5', {
  setup: function setup() {

    el = _document2['default'].createElement('div');
    el.innerHTML = '<div />';

    player = {
      id: function id() {
        return 'id';
      },
      el: (function (_el) {
        function el() {
          return _el.apply(this, arguments);
        }

        el.toString = function () {
          return el.toString();
        };

        return el;
      })(function () {
        return el;
      }),
      options_: {},
      options: function options() {
        return this.options_;
      },
      bufferedPercent: function bufferedPercent() {
        return 0;
      },
      controls: function controls() {
        return false;
      },
      usingNativeControls: function usingNativeControls() {
        return false;
      },
      on: function on() {
        return this;
      },
      off: function off() {
        return this;
      },
      ready: function ready() {},
      addChild: function addChild() {},
      trigger: function trigger() {}
    };
    tech = new _Html52['default'](player, {});
  },
  teardown: function teardown() {
    tech.dispose();
    el = null;
    player = null;
    tech = null;
  }
});

test('should detect whether the volume can be changed', function () {
  var testVid, ConstVolumeVideo;
  if (!({}).__defineSetter__) {
    ok(true, 'your browser does not support this test, skipping it');
    return;
  }
  testVid = Lib.TEST_VID;
  ConstVolumeVideo = function () {
    this.volume = 1;
    this.__defineSetter__('volume', function () {});
  };
  Lib.TEST_VID = new ConstVolumeVideo();

  ok(!_Html52['default'].canControlVolume());
  Lib.TEST_VID = testVid;
});

test('should re-link the player if the tech is moved', function () {
  _Html52['default'].movingMediaElementInDOM = false;
  tech.createEl();

  strictEqual(player, tech.el().player);
});

test('test playbackRate', function () {
  var playbackRate;

  // Android 2.3 always returns 0 for playback rate
  if (!_Html52['default'].canControlPlaybackRate()) {
    ok('Playback rate is not supported');
    return;
  }

  tech.createEl();

  tech.el().playbackRate = 1.25;
  strictEqual(tech.playbackRate(), 1.25);

  tech.setPlaybackRate(0.75);
  strictEqual(tech.playbackRate(), 0.75);
});

test('should remove the controls attribute when recreating the element', function () {
  var el;
  player.tagAttributes = {
    controls: true
  };
  // force custom controls so the test environment is equivalent on iOS
  player.options_.nativeControlsForTouch = false;
  el = tech.createEl();

  // On the iPhone controls are always true
  if (!Lib.IS_IPHONE) {
    ok(!el.controls, 'controls attribute is absent');
  }

  ok(player.tagAttributes.controls, 'tag attribute is still present');
});

test('patchCanPlayType patches canplaytype with our function, conditionally', function () {
  // the patch runs automatically so we need to first unpatch
  _Html52['default'].unpatchCanPlayType();

  var oldAV = Lib.ANDROID_VERSION,
      video = _document2['default'].createElement('video'),
      canPlayType = Lib.TEST_VID.constructor.prototype.canPlayType,
      patchedCanPlayType,
      unpatchedCanPlayType;

  Lib.ANDROID_VERSION = 4;
  _Html52['default'].patchCanPlayType();

  notStrictEqual(video.canPlayType, canPlayType, 'original canPlayType and patched canPlayType should not be equal');

  patchedCanPlayType = video.canPlayType;
  unpatchedCanPlayType = _Html52['default'].unpatchCanPlayType();

  strictEqual(canPlayType, Lib.TEST_VID.constructor.prototype.canPlayType, 'original canPlayType and unpatched canPlayType should be equal');
  strictEqual(patchedCanPlayType, unpatchedCanPlayType, 'patched canPlayType and function returned from unpatch are equal');

  Lib.ANDROID_VERSION = oldAV;
  _Html52['default'].unpatchCanPlayType();
});

test('should return maybe for HLS urls on Android 4.0 or above', function () {
  var oldAV = Lib.ANDROID_VERSION,
      video = _document2['default'].createElement('video');

  Lib.ANDROID_VERSION = 4;
  _Html52['default'].patchCanPlayType();

  strictEqual(video.canPlayType('application/x-mpegurl'), 'maybe', 'android version 4.0 or above should be a maybe for x-mpegurl');
  strictEqual(video.canPlayType('application/x-mpegURL'), 'maybe', 'android version 4.0 or above should be a maybe for x-mpegURL');
  strictEqual(video.canPlayType('application/vnd.apple.mpegurl'), 'maybe', 'android version 4.0 or above should be a maybe for vnd.apple.mpegurl');
  strictEqual(video.canPlayType('application/vnd.apple.mpegURL'), 'maybe', 'android version 4.0 or above should be a maybe for vnd.apple.mpegurl');

  Lib.ANDROID_VERSION = oldAV;
  _Html52['default'].unpatchCanPlayType();
});

test('should return a maybe for mp4 on OLD ANDROID', function () {
  var isOldAndroid = Lib.IS_OLD_ANDROID,
      video = _document2['default'].createElement('video');

  Lib.IS_OLD_ANDROID = true;
  _Html52['default'].patchCanPlayType();

  strictEqual(video.canPlayType('video/mp4'), 'maybe', 'old android should return a maybe for video/mp4');

  Lib.IS_OLD_ANDROID = isOldAndroid;
  _Html52['default'].unpatchCanPlayType();
});

test('error events may not set the errors property', function () {
  equal(tech.error(), undefined, 'no tech-level error');
  tech.trigger('error');
  ok(true, 'no error was thrown');
});

test('should have the source handler interface', function () {
  ok(_Html52['default'].registerSourceHandler, 'has the registerSourceHandler function');
});

test('native source handler canHandleSource', function () {
  var result;

  // Stub the test video canPlayType (used in canHandleSource) to control results
  var origCPT = Lib.TEST_VID.canPlayType;
  Lib.TEST_VID.canPlayType = function (type) {
    if (type === 'video/mp4') {
      return 'maybe';
    }
    return '';
  };

  var canHandleSource = _Html52['default'].nativeSourceHandler.canHandleSource;

  equal(canHandleSource({ type: 'video/mp4', src: 'video.flv' }), 'maybe', 'Native source handler reported type support');
  equal(canHandleSource({ src: 'http://www.example.com/video.mp4' }), 'maybe', 'Native source handler reported extension support');
  equal(canHandleSource({ src: 'https://example.com/video.sd.mp4?s=foo&token=bar' }), 'maybe', 'Native source handler reported extension support');
  equal(canHandleSource({ src: 'https://example.com/video.sd.mp4?s=foo' }), 'maybe', 'Native source handler reported extension support');

  // Test for issue videojs/video.js#1785 and other potential failures
  equal(canHandleSource({ src: '' }), '', 'Native source handler handled empty src');
  equal(canHandleSource({}), '', 'Native source handler handled empty object');
  equal(canHandleSource({ src: 'foo' }), '', 'Native source handler handled bad src');
  equal(canHandleSource({ type: 'foo' }), '', 'Native source handler handled bad type');

  // Reset test video canPlayType
  Lib.TEST_VID.canPlayType = origCPT;
});

},{"../../src/js/lib.js":64,"../../src/js/tech/html5.js":78,"global/document":1}],100:[function(require,module,exports){
'use strict';

var _interopRequireWildcard = function (obj) { return obj && obj.__esModule ? obj : { 'default': obj }; };

var _Tech = require('../../src/js/tech/tech.js');

var _Tech2 = _interopRequireWildcard(_Tech);

var noop = function noop() {},
    clock,
    oldTextTracks;

q.module('Media Tech', {
  setup: function setup() {
    this.noop = function () {};
    this.clock = sinon.useFakeTimers();
    this.featuresProgessEvents = _Tech2['default'].prototype.featuresProgessEvents;
    _Tech2['default'].prototype.featuresProgressEvents = false;
    _Tech2['default'].prototype.featuresNativeTextTracks = true;
    oldTextTracks = _Tech2['default'].prototype.textTracks;
    _Tech2['default'].prototype.textTracks = function () {
      return {
        addEventListener: Function.prototype,
        removeEventListener: Function.prototype
      };
    };
  },
  teardown: function teardown() {
    this.clock.restore();
    _Tech2['default'].prototype.featuresProgessEvents = this.featuresProgessEvents;
    _Tech2['default'].prototype.featuresNativeTextTracks = false;
    _Tech2['default'].prototype.textTracks = oldTextTracks;
  }
});

test('should synthesize timeupdate events by default', function () {
  var timeupdates = 0,
      playHandler,
      i,
      tech;
  tech = new _Tech2['default']({
    id: this.noop,
    on: function on(event, handler) {
      if (event === 'play') {
        playHandler = handler;
      }
    },
    trigger: function trigger(event) {
      if (event === 'timeupdate') {
        timeupdates++;
      }
    }
  });
  playHandler.call(tech);
  tech.on('timeupdate', function () {
    timeupdates++;
  });

  this.clock.tick(250);
  equal(timeupdates, 1, 'triggered one timeupdate');
});

test('stops timeupdates if the tech produces them natively', function () {
  var timeupdates = 0,
      tech,
      playHandler,
      expected;
  tech = new _Tech2['default']({
    id: this.noop,
    off: this.noop,
    on: function on(event, handler) {
      if (event === 'play') {
        playHandler = handler;
      }
    },
    bufferedPercent: this.noop,
    trigger: function trigger(event) {
      if (event === 'timeupdate') {
        timeupdates++;
      }
    }
  });

  playHandler.call(tech);
  // simulate a native timeupdate event
  tech.trigger('timeupdate');

  expected = timeupdates;
  this.clock.tick(10 * 1000);
  equal(timeupdates, expected, 'did not simulate timeupdates');
});

test('stops manual timeupdates while paused', function () {
  var timeupdates = 0,
      tech,
      playHandler,
      pauseHandler,
      expected;
  tech = new _Tech2['default']({
    id: this.noop,
    on: function on(event, handler) {
      if (event === 'play') {
        playHandler = handler;
      } else if (event === 'pause') {
        pauseHandler = handler;
      }
    },
    bufferedPercent: this.noop,
    trigger: function trigger(event) {
      if (event === 'timeupdate') {
        timeupdates++;
      }
    }
  });
  playHandler.call(tech);
  this.clock.tick(10 * 250);
  ok(timeupdates > 0, 'timeupdates fire during playback');

  pauseHandler.call(tech);
  timeupdates = 0;
  this.clock.tick(10 * 250);
  equal(timeupdates, 0, 'timeupdates do not fire when paused');

  playHandler.call(tech);
  this.clock.tick(10 * 250);
  ok(timeupdates > 0, 'timeupdates fire when playback resumes');
});

test('should synthesize progress events by default', function () {
  var progresses = 0,
      tech;
  tech = new _Tech2['default']({
    id: this.noop,
    on: this.noop,
    bufferedPercent: function bufferedPercent() {
      return 0;
    },
    trigger: function trigger(event) {
      if (event === 'progress') {
        progresses++;
      }
    }
  });
  tech.on('progress', function () {
    progresses++;
  });

  this.clock.tick(500);
  equal(progresses, 1, 'triggered one event');
});

test('dispose() should stop time tracking', function () {
  var tech = new _Tech2['default']({
    id: this.noop,
    on: this.noop,
    off: this.noop,
    trigger: this.noop
  });
  tech.dispose();

  // progress and timeupdate events will throw exceptions after the
  // tech is disposed
  try {
    this.clock.tick(10 * 1000);
  } catch (e) {
    return equal(e, undefined, 'threw an exception');
  }
  ok(true, 'no exception was thrown');
});

test('should add the source hanlder interface to a tech', function () {
  var mockPlayer = {
    off: this.noop,
    trigger: this.noop
  };
  var sourceA = { src: 'foo.mp4', type: 'video/mp4' };
  var sourceB = { src: 'no-support', type: 'no-support' };

  // Define a new tech class
  var MyTech = _Tech2['default'].extend();

  // Extend Tech with source handlers
  _Tech2['default'].withSourceHandlers(MyTech);

  // Check for the expected class methods
  ok(MyTech.registerSourceHandler, 'added a registerSourceHandler function to the Tech');
  ok(MyTech.selectSourceHandler, 'added a selectSourceHandler function to the Tech');

  // Create an instance of Tech
  var tech = new MyTech(mockPlayer);

  // Check for the expected instance methods
  ok(tech.setSource, 'added a setSource function to the tech instance');

  // Create an internal state class for the source handler
  // The internal class would be used by a source hanlder to maintain state
  // and provde a dispose method for the handler.
  // This is optional for source handlers
  var disposeCalled = false;
  var handlerInternalState = function handlerInternalState() {};
  handlerInternalState.prototype.dispose = function () {
    disposeCalled = true;
  };

  // Create source handlers
  var handlerOne = {
    canHandleSource: function canHandleSource(source) {
      if (source.type !== 'no-support') {
        return 'probably';
      }
      return '';
    },
    handleSource: function handleSource(s, t) {
      strictEqual(tech, t, 'the tech instance was passed to the source handler');
      strictEqual(sourceA, s, 'the tech instance was passed to the source handler');
      return new handlerInternalState();
    }
  };

  var handlerTwo = {
    canHandleSource: function canHandleSource(source) {
      return ''; // no support
    },
    handleSource: function handleSource(source, tech) {
      ok(false, 'handlerTwo supports nothing and should never be called');
    }
  };

  // Test registering source handlers
  MyTech.registerSourceHandler(handlerOne);
  strictEqual(MyTech.sourceHandlers[0], handlerOne, 'handlerOne was added to the source handler array');
  MyTech.registerSourceHandler(handlerTwo, 0);
  strictEqual(MyTech.sourceHandlers[0], handlerTwo, 'handlerTwo was registered at the correct index (0)');

  // Test handler selection
  strictEqual(MyTech.selectSourceHandler(sourceA), handlerOne, 'handlerOne was selected to handle the valid source');
  strictEqual(MyTech.selectSourceHandler(sourceB), null, 'no handler was selected to handle the invalid source');

  // Test canPlaySource return values
  strictEqual(MyTech.canPlaySource(sourceA), 'probably', 'the Tech returned probably for the valid source');
  strictEqual(MyTech.canPlaySource(sourceB), '', 'the Tech returned an empty string for the invalid source');

  // Pass a source through the source handler process of a tech instance
  tech.setSource(sourceA);
  strictEqual(tech.currentSource_, sourceA, 'sourceA was handled and stored');
  ok(tech.sourceHandler_.dispose, 'the handlerOne state instance was stored');

  // Check that the handler dipose method works
  ok(!disposeCalled, 'dispose has not been called for the handler yet');
  tech.dispose();
  ok(disposeCalled, 'the handler dispose method was called when the tech was disposed');
});

test('should handle unsupported sources with the source hanlder API', function () {
  var mockPlayer = {
    off: this.noop,
    trigger: this.noop
  };

  // Define a new tech class
  var MyTech = _Tech2['default'].extend();
  // Extend Tech with source handlers
  _Tech2['default'].withSourceHandlers(MyTech);
  // Create an instance of Tech
  var tech = new MyTech(mockPlayer);

  var usedNative;
  MyTech.nativeSourceHandler = {
    handleSource: function handleSource() {
      usedNative = true;
    }
  };

  tech.setSource('');
  ok(usedNative, 'native source handler was used when an unsupported source was set');
});

},{"../../src/js/tech/tech.js":80}],101:[function(require,module,exports){
'use strict';

var _interopRequireWildcard = function (obj) { return obj && obj.__esModule ? obj : { 'default': obj }; };

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } };

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if (descriptor.value) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(object, property, receiver) { var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _inherits = function (subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; };

// Fake a media playback tech controller so that player tests
// can run without HTML5 or Flash, of which PhantomJS supports neither.

var _Tech2 = require('../../src/js/tech/tech.js');

var _Tech3 = _interopRequireWildcard(_Tech2);

var _import = require('../../src/js/lib.js');

var Lib = _interopRequireWildcard(_import);

var _Component = require('../../src/js/component.js');

var _Component2 = _interopRequireWildcard(_Component);

/**
 * @constructor
 */

var MediaFaker = (function (_Tech) {
  function MediaFaker(player, options, handleReady) {
    _classCallCheck(this, MediaFaker);

    _get(Object.getPrototypeOf(MediaFaker.prototype), 'constructor', this).call(this, player, options, handleReady);
    this.triggerReady();
  }

  _inherits(MediaFaker, _Tech);

  _createClass(MediaFaker, [{
    key: 'createEl',
    value: function createEl() {
      var el = _get(Object.getPrototypeOf(MediaFaker.prototype), 'createEl', this).call(this, 'div', {
        className: 'vjs-tech'
      });

      if (this.player().poster()) {
        // transfer the poster image to mimic HTML
        el.poster = this.player().poster();
      }

      Lib.insertFirst(el, this.player_.el());

      return el;
    }
  }, {
    key: 'poster',

    // fake a poster attribute to mimic the video element
    value: function poster() {
      return this.el().poster;
    }
  }, {
    key: 'setPoster',
    value: function setPoster(val) {
      this.el().poster = val;
    }
  }, {
    key: 'currentTime',
    value: function currentTime() {
      return 0;
    }
  }, {
    key: 'seeking',
    value: function seeking() {
      return false;
    }
  }, {
    key: 'src',
    value: function src() {
      return 'movie.mp4';
    }
  }, {
    key: 'volume',
    value: function volume() {
      return 0;
    }
  }, {
    key: 'muted',
    value: function muted() {
      return false;
    }
  }, {
    key: 'pause',
    value: function pause() {
      return false;
    }
  }, {
    key: 'paused',
    value: function paused() {
      return true;
    }
  }, {
    key: 'play',
    value: function play() {
      this.player().trigger('play');
    }
  }, {
    key: 'supportsFullScreen',
    value: function supportsFullScreen() {
      return false;
    }
  }, {
    key: 'buffered',
    value: function buffered() {
      return {};
    }
  }, {
    key: 'duration',
    value: function duration() {
      return {};
    }
  }, {
    key: 'networkState',
    value: function networkState() {
      return 0;
    }
  }, {
    key: 'readyState',
    value: function readyState() {
      return 0;
    }
  }], [{
    key: 'isSupported',

    // Support everything except for "video/unsupported-format"
    value: function isSupported() {
      return true;
    }
  }, {
    key: 'canPlaySource',
    value: function canPlaySource(srcObj) {
      return srcObj.type !== 'video/unsupported-format';
    }
  }]);

  return MediaFaker;
})(_Tech3['default']);

_Component2['default'].registerComponent('MediaFaker', MediaFaker);
module.exports = MediaFaker;

},{"../../src/js/component.js":26,"../../src/js/lib.js":64,"../../src/js/tech/tech.js":80}],102:[function(require,module,exports){
'use strict';

var _interopRequireWildcard = function (obj) { return obj && obj.__esModule ? obj : { 'default': obj }; };

var _MenuButton = require('../../src/js/menu/menu-button.js');

var _MenuButton2 = _interopRequireWildcard(_MenuButton);

var _TestHelpers = require('./test-helpers.js');

var _TestHelpers2 = _interopRequireWildcard(_TestHelpers);

q.module('MenuButton');

test('should place title list item into ul', function () {
  var player, menuButton;

  player = _TestHelpers2['default'].makePlayer();

  menuButton = new _MenuButton2['default'](player, {
    title: 'testTitle'
  });

  var menuContentElement = menuButton.el().getElementsByTagName('UL')[0];
  var titleElement = menuContentElement.children[0];

  ok(titleElement.innerHTML === 'TestTitle', 'title element placed in ul');

  player.dispose();
});

},{"../../src/js/menu/menu-button.js":67,"./test-helpers.js":107}],103:[function(require,module,exports){
'use strict';

var _interopRequireWildcard = function (obj) { return obj && obj.__esModule ? obj : { 'default': obj }; };

var _Player = require('../../src/js/player.js');

var _Player2 = _interopRequireWildcard(_Player);

var _videojs = require('../../src/js/core.js');

var _videojs2 = _interopRequireWildcard(_videojs);

var _Options = require('../../src/js/options.js');

var _Options2 = _interopRequireWildcard(_Options);

var _import = require('../../src/js/lib.js');

var Lib = _interopRequireWildcard(_import);

var _MediaError = require('../../src/js/media-error.js');

var _MediaError2 = _interopRequireWildcard(_MediaError);

var _Html5 = require('../../src/js/tech/html5.js');

var _Html52 = _interopRequireWildcard(_Html5);

var _TestHelpers = require('./test-helpers.js');

var _TestHelpers2 = _interopRequireWildcard(_TestHelpers);

var _document = require('global/document');

var _document2 = _interopRequireWildcard(_document);

q.module('Player', {
  setup: function setup() {
    this.clock = sinon.useFakeTimers();
  },
  teardown: function teardown() {
    this.clock.restore();
  }
});

// Compiler doesn't like using 'this' in setup/teardown.
// module("Player", {
//   /**
//    * @this {*}
//    */
//   setup: function(){
//     window.player1 = true; // using window works
//   },

//   /**
//    * @this {*}
//    */
//   teardown: function(){
//     // if (this.player && this.player.el() !== null) {
//     //   this.player.dispose();
//     //   this.player = null;
//     // }
//   }
// });

// Object.size = function(obj) {
//     var size = 0, key;
//     for (key in obj) {
//         console.log('key', key)
//         if (obj.hasOwnProperty(key)) size++;
//     }
//     return size;
// };

test('should create player instance that inherits from component and dispose it', function () {
  var player = _TestHelpers2['default'].makePlayer();

  ok(player.el().nodeName === 'DIV');
  ok(player.on, 'component function exists');

  player.dispose();
  ok(player.el() === null, 'element disposed');
});

test('should accept options from multiple sources and override in correct order', function () {
  // For closure compiler to work, all reference to the prop have to be the same type
  // As in options['attr'] or options.attr. Compiler will minimize each separately.
  // Since we're using setAttribute which requires a string, we have to use the string
  // version of the key for all version.

  // Set a global option
  _Options2['default'].attr = 1;

  var tag0 = _TestHelpers2['default'].makeTag();
  var player0 = new _Player2['default'](tag0);

  ok(player0.options_.attr === 1, 'global option was set');
  player0.dispose();

  // Set a tag level option
  var tag1 = _TestHelpers2['default'].makeTag();
  tag1.setAttribute('attr', 'asdf'); // Attributes must be set as strings

  var player1 = new _Player2['default'](tag1);
  ok(player1.options_.attr === 'asdf', 'Tag options overrode global options');
  player1.dispose();

  // Set a tag level option
  var tag2 = _TestHelpers2['default'].makeTag();
  tag2.setAttribute('attr', 'asdf');

  var player2 = new _Player2['default'](tag2, { attr: 'fdsa' });
  ok(player2.options_.attr === 'fdsa', 'Init options overrode tag and global options');
  player2.dispose();
});

test('should get tag, source, and track settings', function () {
  // Partially tested in lib->getElementAttributes

  var fixture = _document2['default'].getElementById('qunit-fixture');

  var html = '<video id="example_1" class="video-js" autoplay preload="none">';
  html += '<source src="http://google.com" type="video/mp4">';
  html += '<source src="http://google.com" type="video/webm">';
  html += '<track kind="captions" attrtest>';
  html += '</video>';

  fixture.innerHTML += html;

  var tag = _document2['default'].getElementById('example_1');
  var player = _TestHelpers2['default'].makePlayer({}, tag);

  ok(player.options_.autoplay === true);
  ok(player.options_.preload === 'none'); // No extern. Use string.
  ok(player.options_.id === 'example_1');
  ok(player.options_.sources.length === 2);
  ok(player.options_.sources[0].src === 'http://google.com');
  ok(player.options_.sources[0].type === 'video/mp4');
  ok(player.options_.sources[1].type === 'video/webm');
  ok(player.options_.tracks.length === 1);
  ok(player.options_.tracks[0].kind === 'captions'); // No extern
  ok(player.options_.tracks[0].attrtest === '');

  ok(player.el().className.indexOf('video-js') !== -1, 'transferred class from tag to player div');
  ok(player.el().id === 'example_1', 'transferred id from tag to player div');

  ok(_Player2['default'].players[player.id()] === player, 'player referenceable from global list');
  ok(tag.id !== player.id, 'tag ID no longer is the same as player ID');
  ok(tag.className !== player.el().className, 'tag classname updated');

  player.dispose();

  ok(tag.player !== player, 'tag player ref killed');
  ok(!_Player2['default'].players.example_1, 'global player ref killed');
  ok(player.el() === null, 'player el killed');
});

test('should asynchronously fire error events during source selection', function () {
  expect(2);

  sinon.stub(Lib.log, 'error');

  var player = _TestHelpers2['default'].makePlayer({
    techOrder: ['foo'],
    sources: [{ src: 'http://vjs.zencdn.net/v/oceans.mp4', type: 'video/mp4' }]
  });
  ok(player.options_.techOrder[0] === 'foo', 'Foo listed as the only tech');

  player.on('error', function (e) {
    ok(player.error().code === 4, 'Source could not be played error thrown');
  });

  this.clock.tick(1);

  player.dispose();
  Lib.log.error.restore();
});

test('should set the width and height of the player', function () {
  var player = _TestHelpers2['default'].makePlayer({ width: 123, height: '100%' });

  ok(player.width() === 123);
  ok(player.el().style.width === '123px');

  var fixture = _document2['default'].getElementById('qunit-fixture');
  var container = _document2['default'].createElement('div');
  fixture.appendChild(container);

  // Player container needs to have height in order to have height
  // Don't want to mess with the fixture itself
  container.appendChild(player.el());
  container.style.height = '1000px';
  ok(player.height() === 1000);

  player.dispose();
});

test('should not force width and height', function () {
  var player = _TestHelpers2['default'].makePlayer({ width: 'auto', height: 'auto' });
  ok(player.el().style.width === '', 'Width is not forced');
  ok(player.el().style.height === '', 'Height is not forced');

  player.dispose();
});

test('should wrap the original tag in the player div', function () {
  var tag = _TestHelpers2['default'].makeTag();
  var container = _document2['default'].createElement('div');
  var fixture = _document2['default'].getElementById('qunit-fixture');

  container.appendChild(tag);
  fixture.appendChild(container);

  var player = new _Player2['default'](tag);
  var el = player.el();

  ok(el.parentNode === container, 'player placed at same level as tag');
  // Tag may be placed inside the player element or it may be removed from the DOM
  ok(tag.parentNode !== container, 'tag removed from original place');

  player.dispose();
});

test('should set and update the poster value', function () {
  var tag, poster, updatedPoster, player;

  poster = 'http://example.com/poster.jpg';
  updatedPoster = 'http://example.com/updated-poster.jpg';

  tag = _TestHelpers2['default'].makeTag();
  tag.setAttribute('poster', poster);

  player = _TestHelpers2['default'].makePlayer({}, tag);
  equal(player.poster(), poster, 'the poster property should equal the tag attribute');

  var pcEmitted = false;
  player.on('posterchange', function () {
    pcEmitted = true;
  });

  player.poster(updatedPoster);
  ok(pcEmitted, 'posterchange event was emitted');
  equal(player.poster(), updatedPoster, 'the updated poster is returned');

  player.dispose();
});

// hasStarted() is equivalent to the "show poster flag" in the
// standard, for the purpose of displaying the poster image
// https://html.spec.whatwg.org/multipage/embedded-content.html#dom-media-play
test('should hide the poster when play is called', function () {
  var player = _TestHelpers2['default'].makePlayer({
    poster: 'https://example.com/poster.jpg'
  });

  equal(player.hasStarted(), false, 'the show poster flag is true before play');
  player.play();
  equal(player.hasStarted(), true, 'the show poster flag is false after play');

  player.trigger('loadstart');
  equal(player.hasStarted(), false, 'the resource selection algorithm sets the show poster flag to true');

  player.play();
  equal(player.hasStarted(), true, 'the show poster flag is false after play');
});

test('should load a media controller', function () {
  var player = _TestHelpers2['default'].makePlayer({
    preload: 'none',
    sources: [{ src: 'http://google.com', type: 'video/mp4' }, { src: 'http://google.com', type: 'video/webm' }]
  });

  ok(player.el().children[0].className.indexOf('vjs-tech') !== -1, 'media controller loaded');

  player.dispose();
});

test('should be able to initialize player twice on the same tag using string reference', function () {
  var videoTag = _TestHelpers2['default'].makeTag();
  var id = videoTag.id;

  var fixture = _document2['default'].getElementById('qunit-fixture');
  fixture.appendChild(videoTag);

  var player = _videojs2['default'](videoTag.id);
  ok(player, 'player is created');
  player.dispose();

  ok(!_document2['default'].getElementById(id), 'element is removed');
  videoTag = _TestHelpers2['default'].makeTag();
  fixture.appendChild(videoTag);

  //here we receive cached version instead of real
  player = _videojs2['default'](videoTag.id);
  //here it triggers error, because player was destroyed already after first dispose
  player.dispose();
});

test('should set controls and trigger events', function () {
  expect(6);

  var player = _TestHelpers2['default'].makePlayer({ controls: false });
  ok(player.controls() === false, 'controls set through options');
  var hasDisabledClass = player.el().className.indexOf('vjs-controls-disabled');
  ok(hasDisabledClass !== -1, 'Disabled class added to player');

  player.controls(true);
  ok(player.controls() === true, 'controls updated');
  var hasEnabledClass = player.el().className.indexOf('vjs-controls-enabled');
  ok(hasEnabledClass !== -1, 'Disabled class added to player');

  player.on('controlsenabled', function () {
    ok(true, 'enabled fired once');
  });
  player.on('controlsdisabled', function () {
    ok(true, 'disabled fired once');
  });
  player.controls(false);
  player.controls(true);
  // Check for unnecessary events
  player.controls(true);

  player.dispose();
});

// Can't figure out how to test fullscreen events with tests
// Browsers aren't triggering the events at least
// asyncTest('should trigger the fullscreenchange event', function() {
//   expect(3);

//   var player = TestHelpers.makePlayer();
//   player.on('fullscreenchange', function(){
//     ok(true, 'fullscreenchange event fired');
//     ok(this.isFullscreen() === true, 'isFullscreen is true');
//     ok(this.el().className.indexOf('vjs-fullscreen') !== -1, 'vjs-fullscreen class added');

//     player.dispose();
//     start();
//   });

//   player.requestFullscreen();
// });

test('should toggle user the user state between active and inactive', function () {
  var player = _TestHelpers2['default'].makePlayer({});

  expect(9);

  ok(player.userActive(), 'User should be active at player init');

  player.on('userinactive', function () {
    ok(true, 'userinactive event triggered');
  });

  player.on('useractive', function () {
    ok(true, 'useractive event triggered');
  });

  player.userActive(false);
  ok(player.userActive() === false, 'Player state changed to inactive');
  ok(player.el().className.indexOf('vjs-user-active') === -1, 'Active class removed');
  ok(player.el().className.indexOf('vjs-user-inactive') !== -1, 'Inactive class added');

  player.userActive(true);
  ok(player.userActive() === true, 'Player state changed to active');
  ok(player.el().className.indexOf('vjs-user-inactive') === -1, 'Inactive class removed');
  ok(player.el().className.indexOf('vjs-user-active') !== -1, 'Active class added');

  player.dispose();
});

test('should add a touch-enabled classname when touch is supported', function () {
  var player;

  expect(1);

  // Fake touch support. Real touch support isn't needed for this test.
  var origTouch = Lib.TOUCH_ENABLED;
  Lib.TOUCH_ENABLED = true;

  player = _TestHelpers2['default'].makePlayer({});

  ok(player.el().className.indexOf('vjs-touch-enabled'), 'touch-enabled classname added');

  Lib.TOUCH_ENABLED = origTouch;
  player.dispose();
});

test('should allow for tracking when native controls are used', function () {
  var player = _TestHelpers2['default'].makePlayer({});

  expect(6);

  // Make sure native controls is false before starting test
  player.usingNativeControls(false);

  player.on('usingnativecontrols', function () {
    ok(true, 'usingnativecontrols event triggered');
  });

  player.on('usingcustomcontrols', function () {
    ok(true, 'usingcustomcontrols event triggered');
  });

  player.usingNativeControls(true);
  ok(player.usingNativeControls() === true, 'Using native controls is true');
  ok(player.el().className.indexOf('vjs-using-native-controls') !== -1, 'Native controls class added');

  player.usingNativeControls(false);
  ok(player.usingNativeControls() === false, 'Using native controls is false');
  ok(player.el().className.indexOf('vjs-using-native-controls') === -1, 'Native controls class removed');

  player.dispose();
});

// test('should use custom message when encountering an unsupported video type',
//     function() {
//   videojs.options['notSupportedMessage'] = 'Video no go <a href="">link</a>';
//   var fixture = document.getElementById('qunit-fixture');

//   var html =
//       '<video id="example_1">' +
//           '<source src="fake.foo" type="video/foo">' +
//           '</video>';

//   fixture.innerHTML += html;

//   var tag = document.getElementById('example_1');
//   var player = new Player(tag);

//   var incompatibilityMessage = player.el().getElementsByTagName('p')[0];
//   // ie8 capitalizes tag names
//   equal(incompatibilityMessage.innerHTML.toLowerCase(), 'video no go <a href="">link</a>');

//   player.dispose();
// });

test('should register players with generated ids', function () {
  var fixture, video, player, id;
  fixture = _document2['default'].getElementById('qunit-fixture');

  video = _document2['default'].createElement('video');
  video.className = 'vjs-default-skin video-js';
  fixture.appendChild(video);

  player = new _Player2['default'](video);
  id = player.el().id;

  equal(player.el().id, player.id(), 'the player and element ids are equal');
  ok(_Player2['default'].players[id], 'the generated id is registered');
});

test('should not add multiple first play events despite subsequent loads', function () {
  expect(1);

  var player = _TestHelpers2['default'].makePlayer({});

  player.on('firstplay', function () {
    ok(true, 'First play should fire once.');
  });

  // Checking to make sure handleLoadStart removes first play listener before adding a new one.
  player.trigger('loadstart');
  player.trigger('loadstart');
  player.trigger('play');
});

test('should fire firstplay after resetting the player', function () {
  var player = _TestHelpers2['default'].makePlayer({});

  var fpFired = false;
  player.on('firstplay', function () {
    fpFired = true;
  });

  // init firstplay listeners
  player.trigger('loadstart');
  player.trigger('play');
  ok(fpFired, 'First firstplay fired');

  // reset the player
  player.trigger('loadstart');
  fpFired = false;
  player.trigger('play');
  ok(fpFired, 'Second firstplay fired');

  // the play event can fire before the loadstart event.
  // in that case we still want the firstplay even to fire.
  player.tech.paused = function () {
    return false;
  };
  fpFired = false;
  // reset the player
  player.trigger('loadstart');
  // player.trigger('play');
  ok(fpFired, 'Third firstplay fired');
});

test('should remove vjs-has-started class', function () {
  expect(3);

  var player = _TestHelpers2['default'].makePlayer({});

  player.trigger('loadstart');
  player.trigger('play');
  ok(player.el().className.indexOf('vjs-has-started') !== -1, 'vjs-has-started class added');

  player.trigger('loadstart');
  ok(player.el().className.indexOf('vjs-has-started') === -1, 'vjs-has-started class removed');

  player.trigger('play');
  ok(player.el().className.indexOf('vjs-has-started') !== -1, 'vjs-has-started class added again');
});

test('should add and remove vjs-ended class', function () {
  expect(4);

  var player = _TestHelpers2['default'].makePlayer({});

  player.trigger('loadstart');
  player.trigger('play');
  player.trigger('ended');
  ok(player.el().className.indexOf('vjs-ended') !== -1, 'vjs-ended class added');

  player.trigger('play');
  ok(player.el().className.indexOf('vjs-ended') === -1, 'vjs-ended class removed');

  player.trigger('ended');
  ok(player.el().className.indexOf('vjs-ended') !== -1, 'vjs-ended class re-added');

  player.trigger('loadstart');
  ok(player.el().className.indexOf('vjs-ended') === -1, 'vjs-ended class removed');
});

test('player should handle different error types', function () {
  expect(8);
  var player = _TestHelpers2['default'].makePlayer({});
  var testMsg = 'test message';

  // prevent error log messages in the console
  sinon.stub(Lib.log, 'error');

  // error code supplied
  function errCode() {
    equal(player.error().code, 1, 'error code is correct');
  }
  player.on('error', errCode);
  player.error(1);
  player.off('error', errCode);

  // error instance supplied
  function errInst() {
    equal(player.error().code, 2, 'MediaError code is correct');
    equal(player.error().message, testMsg, 'MediaError message is correct');
  }
  player.on('error', errInst);
  player.error(new _MediaError2['default']({ code: 2, message: testMsg }));
  player.off('error', errInst);

  // error message supplied
  function errMsg() {
    equal(player.error().code, 0, 'error message code is correct');
    equal(player.error().message, testMsg, 'error message is correct');
  }
  player.on('error', errMsg);
  player.error(testMsg);
  player.off('error', errMsg);

  // error config supplied
  function errConfig() {
    equal(player.error().code, 3, 'error config code is correct');
    equal(player.error().message, testMsg, 'error config message is correct');
  }
  player.on('error', errConfig);
  player.error({ code: 3, message: testMsg });
  player.off('error', errConfig);

  // check for vjs-error classname
  ok(player.el().className.indexOf('vjs-error') >= 0, 'player does not have vjs-error classname');

  // restore error logging
  Lib.log.error.restore();
});

test('Data attributes on the video element should persist in the new wrapper element', function () {
  var dataId, tag, player;

  dataId = 123;

  tag = _TestHelpers2['default'].makeTag();
  tag.setAttribute('data-id', dataId);

  player = _TestHelpers2['default'].makePlayer({}, tag);

  equal(player.el().getAttribute('data-id'), dataId, 'data-id should be available on the new player element after creation');
});

test('should restore attributes from the original video tag when creating a new element', function () {
  var player, html5Mock, el;

  player = _TestHelpers2['default'].makePlayer();
  html5Mock = { player_: player };

  // simulate attributes stored from the original tag
  player.tagAttributes = {
    preload: 'auto',
    autoplay: true,
    'webkit-playsinline': true
  };

  // set options that should override tag attributes
  player.options_.preload = 'none';

  // create the element
  el = _Html52['default'].prototype.createEl.call(html5Mock);

  equal(el.getAttribute('preload'), 'none', 'attribute was successful overridden by an option');
  equal(el.getAttribute('autoplay'), '', 'autoplay attribute was set properly');
  equal(el.getAttribute('webkit-playsinline'), '', 'webkit-playsinline attribute was set properly');
});

test('should honor default inactivity timeout', function () {
  var player;
  var clock = sinon.useFakeTimers();

  // default timeout is 2000ms
  player = _TestHelpers2['default'].makePlayer({});

  equal(player.userActive(), true, 'User is active on creation');
  clock.tick(1800);
  equal(player.userActive(), true, 'User is still active');
  clock.tick(500);
  equal(player.userActive(), false, 'User is inactive after timeout expired');

  clock.restore();
});

test('should honor configured inactivity timeout', function () {
  var player;
  var clock = sinon.useFakeTimers();

  // default timeout is 2000ms, set to shorter 200ms
  player = _TestHelpers2['default'].makePlayer({
    inactivityTimeout: 200
  });

  equal(player.userActive(), true, 'User is active on creation');
  clock.tick(150);
  equal(player.userActive(), true, 'User is still active');
  clock.tick(350);
  // make sure user is now inactive after 500ms
  equal(player.userActive(), false, 'User is inactive after timeout expired');

  clock.restore();
});

test('should honor disabled inactivity timeout', function () {
  var player;
  var clock = sinon.useFakeTimers();

  // default timeout is 2000ms, disable by setting to zero
  player = _TestHelpers2['default'].makePlayer({
    inactivityTimeout: 0
  });

  equal(player.userActive(), true, 'User is active on creation');
  clock.tick(5000);
  equal(player.userActive(), true, 'User is still active');

  clock.restore();
});

test('should clear pending errors on disposal', function () {
  var clock = sinon.useFakeTimers(),
      player;

  player = _TestHelpers2['default'].makePlayer();
  player.src({
    src: 'http://example.com/movie.unsupported-format',
    type: 'video/unsupported-format'
  });
  player.dispose();
  try {
    clock.tick(5000);
  } catch (e) {
    return ok(!e, 'threw an error: ' + e.message);
  }
  ok(true, 'did not throw an error after disposal');
});

test('pause is called when player ended event is fired and player is not paused', function () {
  var video = _document2['default'].createElement('video'),
      player = _TestHelpers2['default'].makePlayer({}, video),
      pauses = 0;
  player.paused = function () {
    return false;
  };
  player.pause = function () {
    pauses++;
  };
  player.trigger('ended');
  equal(pauses, 1, 'pause was called');
});

test('pause is not called if the player is paused and ended is fired', function () {
  var video = _document2['default'].createElement('video'),
      player = _TestHelpers2['default'].makePlayer({}, video),
      pauses = 0;
  player.paused = function () {
    return true;
  };
  player.pause = function () {
    pauses++;
  };
  player.trigger('ended');
  equal(pauses, 0, 'pause was not called when ended fired');
});

test('should add an audio class if an audio el is used', function () {
  var audio = _document2['default'].createElement('audio'),
      player = _TestHelpers2['default'].makePlayer({}, audio),
      audioClass = 'vjs-audio';

  ok(player.el().className.indexOf(audioClass) !== -1, 'added ' + audioClass + ' css class');
});

test('should not be scrubbing while not seeking', function () {
  var player = _TestHelpers2['default'].makePlayer();
  equal(player.scrubbing(), false, 'player is not scrubbing');
  ok(player.el().className.indexOf('scrubbing') === -1, 'scrubbing class is not present');
  player.scrubbing(false);
  equal(player.scrubbing(), false, 'player is not scrubbing');
});

test('should be scrubbing while seeking', function () {
  var player = _TestHelpers2['default'].makePlayer();
  player.scrubbing(true);
  equal(player.scrubbing(), true, 'player is scrubbing');
  ok(player.el().className.indexOf('scrubbing') !== -1, 'scrubbing class is present');
});

test('should throw on startup no techs are specified', function () {
  var techOrder = _Options2['default'].techOrder;

  _Options2['default'].techOrder = null;
  q.throws(function () {
    _videojs2['default'](_TestHelpers2['default'].makeTag());
  }, 'a falsey techOrder should throw');

  _Options2['default'].techOrder = techOrder;
});

},{"../../src/js/core.js":59,"../../src/js/lib.js":64,"../../src/js/media-error.js":66,"../../src/js/options.js":70,"../../src/js/player.js":71,"../../src/js/tech/html5.js":78,"./test-helpers.js":107,"global/document":1}],104:[function(require,module,exports){
'use strict';

var _interopRequireWildcard = function (obj) { return obj && obj.__esModule ? obj : { 'default': obj }; };

var _Plugin = require('../../src/js/plugins.js');

var _Plugin2 = _interopRequireWildcard(_Plugin);

var _Player = require('../../src/js/player.js');

var _Player2 = _interopRequireWildcard(_Player);

var _TestHelpers = require('./test-helpers.js');

var _TestHelpers2 = _interopRequireWildcard(_TestHelpers);

q.module('Plugins');

test('Plugin should get initialized and receive options', function () {
  expect(2);

  _Plugin2['default']('myPlugin1', function (options) {
    ok(true, 'Plugin initialized');
    ok(options.test, 'Option passed through');
  });

  _Plugin2['default']('myPlugin2', function (options) {
    ok(false, 'Plugin initialized and should not have been');
  });

  var player = _TestHelpers2['default'].makePlayer({
    plugins: {
      myPlugin1: {
        test: true
      }
    }
  });

  player.dispose();
});

test('Plugin should have the option of being initilized outside of player init', function () {
  expect(3);

  _Plugin2['default']('myPlugin3', function (options) {
    ok(true, 'Plugin initialized after player init');
    ok(options.test, 'Option passed through');
  });

  var player = _TestHelpers2['default'].makePlayer({});

  ok(player.myPlugin3, 'Plugin has direct access on player instance');

  player.myPlugin3({
    test: true
  });

  player.dispose();
});

test('Plugin should be able to add a UI component', function () {
  expect(2);

  _Plugin2['default']('myPlugin4', function (options) {
    ok(this instanceof _Player2['default'], 'Plugin executed in player scope by default');
    this.addChild('component');
  });

  var player = _TestHelpers2['default'].makePlayer({});
  player.myPlugin4({
    test: true
  });

  var comp = player.getChild('component');
  ok(comp, 'Plugin added a component to the player');

  player.dispose();
});

test('Plugin should overwrite plugin of same name', function () {
  var v1Called = 0,
      v2Called = 0,
      v3Called = 0;

  // Create initial plugin
  _Plugin2['default']('myPlugin5', function (options) {
    v1Called++;
  });
  var player = _TestHelpers2['default'].makePlayer({});
  player.myPlugin5({});

  // Overwrite and create new player
  _Plugin2['default']('myPlugin5', function (options) {
    v2Called++;
  });
  var player2 = _TestHelpers2['default'].makePlayer({});
  player2.myPlugin5({});

  // Overwrite and init new version on existing player
  _Plugin2['default']('myPlugin5', function (options) {
    v3Called++;
  });
  player2.myPlugin5({});

  var comp = player.getChild('component');
  ok(v1Called === 1, 'First version of plugin called once');
  ok(v2Called === 1, 'Plugin overwritten for new player');
  ok(v3Called === 1, 'Plugin overwritten for existing player');

  player.dispose();
  player2.dispose();
});

test('Plugins should get events in registration order', function () {
  var order = [];
  var expectedOrder = [];
  var pluginName = 'orderPlugin';
  var i = 0;
  var name;
  var player = _TestHelpers2['default'].makePlayer({});
  var plugin = function plugin(name) {
    _Plugin2['default'](name, function (opts) {
      this.on('test', function (event) {
        order.push(name);
      });
    });
    player[name]({});
  };

  for (; i < 3; i++) {
    name = pluginName + i;
    expectedOrder.push(name);
    plugin(name);
  }

  _Plugin2['default']('testerPlugin', function (opts) {
    this.trigger('test');
  });

  player.testerPlugin({});

  deepEqual(order, expectedOrder, 'plugins should receive events in order of initialization');
  player.dispose();
});

test('Plugins should not get events after stopImmediatePropagation is called', function () {
  var order = [];
  var expectedOrder = [];
  var pluginName = 'orderPlugin';
  var i = 0;
  var name;
  var player = _TestHelpers2['default'].makePlayer({});
  var plugin = function plugin(name) {
    _Plugin2['default'](name, function (opts) {
      this.on('test', function (event) {
        order.push(name);
        event.stopImmediatePropagation();
      });
    });
    player[name]({});
  };

  for (; i < 3; i++) {
    name = pluginName + i;
    expectedOrder.push(name);
    plugin(name);
  }

  _Plugin2['default']('testerPlugin', function (opts) {
    this.trigger('test');
  });

  player.testerPlugin({});

  deepEqual(order, expectedOrder.slice(0, order.length), 'plugins should receive events in order of initialization, until stopImmediatePropagation');

  equal(order.length, 1, 'only one event listener should have triggered');
  player.dispose();
});

},{"../../src/js/player.js":71,"../../src/js/plugins.js":72,"./test-helpers.js":107}],105:[function(require,module,exports){
'use strict';

var _interopRequireWildcard = function (obj) { return obj && obj.__esModule ? obj : { 'default': obj }; };

var _PosterImage = require('../../src/js/poster-image.js');

var _PosterImage2 = _interopRequireWildcard(_PosterImage);

var _import = require('../../src/js/lib.js');

var Lib = _interopRequireWildcard(_import);

var _TestHelpers = require('./test-helpers.js');

var _TestHelpers2 = _interopRequireWildcard(_TestHelpers);

var _document = require('global/document');

var _document2 = _interopRequireWildcard(_document);

q.module('PosterImage', {
  setup: function setup() {
    // Store the original background support so we can test different vals
    this.origVal = Lib.BACKGROUND_SIZE_SUPPORTED;
    this.poster1 = 'http://example.com/poster.jpg';
    this.poster2 = 'http://example.com/UPDATED.jpg';

    // Create a mock player object that responds as a player would
    this.mockPlayer = {
      poster_: this.poster1,
      poster: function poster() {
        return this.poster_;
      },
      handler_: null,
      on: function on(type, handler) {
        this.handler_ = handler;
      },
      trigger: function trigger(type) {
        this.handler_.call();
      }
    };
  },
  teardown: function teardown() {
    Lib.BACKGROUND_SIZE_SUPPORTED = this.origVal;
  }
});

test('should create and update a poster image', function () {
  var posterImage;

  // IE11 adds quotes in the returned background url so need to normalize the result
  function normalizeUrl(url) {
    return url.replace(new RegExp('\\"', 'g'), '');
  }

  Lib.BACKGROUND_SIZE_SUPPORTED = true;
  posterImage = new _PosterImage2['default'](this.mockPlayer);
  equal(normalizeUrl(posterImage.el().style.backgroundImage), 'url(' + this.poster1 + ')', 'Background image used');

  // Update with a new poster source and check the new value
  this.mockPlayer.poster_ = this.poster2;
  this.mockPlayer.trigger('posterchange');
  equal(normalizeUrl(posterImage.el().style.backgroundImage), 'url(' + this.poster2 + ')', 'Background image updated');
});

test('should create and update a fallback image in older browsers', function () {
  var posterImage;

  Lib.BACKGROUND_SIZE_SUPPORTED = false;
  posterImage = new _PosterImage2['default'](this.mockPlayer);
  equal(posterImage.fallbackImg_.src, this.poster1, 'Fallback image created');

  // Update with a new poster source and check the new value
  this.mockPlayer.poster_ = this.poster2;
  this.mockPlayer.trigger('posterchange');
  equal(posterImage.fallbackImg_.src, this.poster2, 'Fallback image updated');
});

test('should remove itself from the document flow when there is no poster', function () {
  var posterImage;

  posterImage = new _PosterImage2['default'](this.mockPlayer);
  equal(posterImage.el().style.display, '', 'Poster image shows by default');

  // Update with an empty string
  this.mockPlayer.poster_ = '';
  this.mockPlayer.trigger('posterchange');
  equal(posterImage.hasClass('vjs-hidden'), true, 'Poster image hides with an empty source');

  // Updated with a valid source
  this.mockPlayer.poster_ = this.poster2;
  this.mockPlayer.trigger('posterchange');
  equal(posterImage.hasClass('vjs-hidden'), false, 'Poster image shows again when there is a source');
});

test('should hide the poster in the appropriate player states', function () {
  var posterImage = new _PosterImage2['default'](this.mockPlayer);
  var playerDiv = _document2['default'].createElement('div');
  var fixture = _document2['default'].getElementById('qunit-fixture');
  var el = posterImage.el();

  // Remove the source so when we add to the DOM it doesn't throw an error
  // We want to poster to still think it has a real source so it doesn't hide itself
  posterImage.setSrc('');

  // Add the elements to the DOM so styles are computed
  playerDiv.appendChild(el);
  fixture.appendChild(playerDiv);

  playerDiv.className = 'video-js vjs-has-started';
  equal(_TestHelpers2['default'].getComputedStyle(el, 'display'), 'none', 'The poster hides when the video has started (CSS may not be loaded)');

  playerDiv.className = 'video-js vjs-has-started vjs-audio';
  equal(_TestHelpers2['default'].getComputedStyle(el, 'display'), 'block', 'The poster continues to show when playing audio');
});

},{"../../src/js/lib.js":64,"../../src/js/poster-image.js":73,"./test-helpers.js":107,"global/document":1}],106:[function(require,module,exports){
'use strict';

var _interopRequireWildcard = function (obj) { return obj && obj.__esModule ? obj : { 'default': obj }; };

var _TestHelpers = require('./test-helpers.js');

var _TestHelpers2 = _interopRequireWildcard(_TestHelpers);

q.module('Setup');

test('should set options from data-setup even if autoSetup is not called before initialisation', function () {
  var el = _TestHelpers2['default'].makeTag();
  el.setAttribute('data-setup', '{"controls": true, "autoplay": false, "preload": "auto"}');

  var player = _TestHelpers2['default'].makePlayer({}, el);

  ok(player.options_.controls === true);
  ok(player.options_.autoplay === false);
  ok(player.options_.preload === 'auto');
});

},{"./test-helpers.js":107}],107:[function(require,module,exports){
'use strict';

var _interopRequireWildcard = function (obj) { return obj && obj.__esModule ? obj : { 'default': obj }; };

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _Player = require('../../src/js/player.js');

var _Player2 = _interopRequireWildcard(_Player);

var _MediaFaker = require('./mediafaker.js');

var _MediaFaker2 = _interopRequireWildcard(_MediaFaker);

var _window = require('global/window');

var _window2 = _interopRequireWildcard(_window);

var _document = require('global/document');

var _document2 = _interopRequireWildcard(_document);

var TestHelpers = {
  makeTag: function makeTag() {
    var videoTag = _document2['default'].createElement('video');
    videoTag.id = 'example_1';
    videoTag.className = 'video-js vjs-default-skin';
    return videoTag;
  },

  makePlayer: function makePlayer(playerOptions, videoTag) {
    var player;

    videoTag = videoTag || TestHelpers.makeTag();

    var fixture = _document2['default'].getElementById('qunit-fixture');
    fixture.appendChild(videoTag);

    playerOptions = playerOptions || {};
    playerOptions.techOrder = playerOptions.techOrder || ['mediaFaker'];

    return player = new _Player2['default'](videoTag, playerOptions);
  },

  getComputedStyle: function getComputedStyle(el, rule) {
    var val;

    if (_window2['default'].getComputedStyle) {
      val = _window2['default'].getComputedStyle(el, null).getPropertyValue(rule);
      // IE8
    } else if (el.currentStyle) {
      val = el.currentStyle[rule];
    }

    return val;
  }
};

exports['default'] = TestHelpers;
module.exports = exports['default'];

},{"../../src/js/player.js":71,"./mediafaker.js":101,"global/document":1,"global/window":2}],108:[function(require,module,exports){
'use strict';

var _interopRequireWildcard = function (obj) { return obj && obj.__esModule ? obj : { 'default': obj }; };

var _TextTrackMenuItem = require('../../../src/js/control-bar/text-track-controls/text-track-menu-item.js');

var _TextTrackMenuItem2 = _interopRequireWildcard(_TextTrackMenuItem);

var _TestHelpers = require('../test-helpers.js');

var _TestHelpers2 = _interopRequireWildcard(_TestHelpers);

var _import = require('../../../src/js/lib.js');

var Lib = _interopRequireWildcard(_import);

q.module('Text Track Controls');

var track = {
  kind: 'captions',
  label: 'test'
};

test('should be displayed when text tracks list is not empty', function () {
  var player = _TestHelpers2['default'].makePlayer({
    tracks: [track]
  });

  ok(!player.controlBar.captionsButton.hasClass('vjs-hidden'), 'control is displayed');
  equal(player.textTracks().length, 1, 'textTracks contains one item');
});

test('should be displayed when a text track is added to an empty track list', function () {
  var player = _TestHelpers2['default'].makePlayer();

  player.addRemoteTextTrack(track);

  ok(!player.controlBar.captionsButton.hasClass('vjs-hidden'), 'control is displayed');
  equal(player.textTracks().length, 1, 'textTracks contains one item');
});

test('should not be displayed when text tracks list is empty', function () {
  var player = _TestHelpers2['default'].makePlayer();

  ok(player.controlBar.captionsButton.hasClass('vjs-hidden'), 'control is not displayed');
  equal(player.textTracks().length, 0, 'textTracks is empty');
});

test('should not be displayed when last text track is removed', function () {
  var player = _TestHelpers2['default'].makePlayer({
    tracks: [track]
  });

  player.removeRemoteTextTrack(player.textTracks()[0]);

  ok(player.controlBar.captionsButton.hasClass('vjs-hidden'), 'control is not displayed');
  equal(player.textTracks().length, 0, 'textTracks is empty');
});

test('menu should contain "Settings", "Off" and one track', function () {
  var player = _TestHelpers2['default'].makePlayer({
    tracks: [track]
  }),
      menuItems = player.controlBar.captionsButton.items;

  equal(menuItems.length, 3, 'menu contains three items');
  equal(menuItems[0].track.label, 'captions settings', 'menu contains "captions settings"');
  equal(menuItems[1].track.label, 'captions off', 'menu contains "captions off"');
  equal(menuItems[2].track.label, 'test', 'menu contains "test" track');
});

test('menu should update with addRemoteTextTrack', function () {
  var player = _TestHelpers2['default'].makePlayer({
    tracks: [track]
  });

  player.addRemoteTextTrack(track);

  equal(player.controlBar.captionsButton.items.length, 4, 'menu does contain added track');
  equal(player.textTracks().length, 2, 'textTracks contains two items');
});

test('menu should update with removeRemoteTextTrack', function () {
  var player = _TestHelpers2['default'].makePlayer({
    tracks: [track, track]
  });

  player.removeRemoteTextTrack(player.textTracks()[0]);

  equal(player.controlBar.captionsButton.items.length, 3, 'menu does not contain removed track');
  equal(player.textTracks().length, 1, 'textTracks contains one item');
});

if (!Lib.IS_IE8) {
  // This test doesn't work on IE8.
  // However, this test tests a specific with iOS7 where the TextTrackList doesn't report track mode changes.
  // TODO: figure out why this test doens't work on IE8. https://github.com/videojs/video.js/issues/1861
  test('menu items should polyfill mode change events', function () {
    var player = _TestHelpers2['default'].makePlayer({}),
        changes,
        trackMenuItem;

    // emulate a TextTrackList that doesn't report track mode changes,
    // like iOS7
    player.textTracks().onchange = undefined;
    trackMenuItem = new _TextTrackMenuItem2['default'](player, {
      track: track
    });

    player.textTracks().on('change', function () {
      changes++;
    });
    changes = 0;
    trackMenuItem.trigger('tap');
    equal(changes, 1, 'taps trigger change events');

    trackMenuItem.trigger('click');
    equal(changes, 2, 'clicks trigger change events');
  });
}

},{"../../../src/js/control-bar/text-track-controls/text-track-menu-item.js":48,"../../../src/js/lib.js":64,"../test-helpers.js":107}],109:[function(require,module,exports){
'use strict';

var _interopRequireWildcard = function (obj) { return obj && obj.__esModule ? obj : { 'default': obj }; };

var _TextTrackCueList = require('../../../src/js/tracks/text-track-cue-list.js');

var _TextTrackCueList2 = _interopRequireWildcard(_TextTrackCueList);

var genericTracks = [{
  id: '1'
}, {
  id: '2'
}, {
  id: '3'
}];

q.module('Text Track Cue List');

test('TextTrackCueList\'s length is set correctly', function () {
  var ttcl = new _TextTrackCueList2['default'](genericTracks);

  equal(ttcl.length, genericTracks.length, 'the length is ' + genericTracks.length);
});

test('can get cues by id', function () {
  var ttcl = new _TextTrackCueList2['default'](genericTracks);

  equal(ttcl.getCueById('1').id, 1, 'id "1" has id of "1"');
  equal(ttcl.getCueById('2').id, 2, 'id "2" has id of "2"');
  equal(ttcl.getCueById('3').id, 3, 'id "3" has id of "3"');
  ok(!ttcl.getCueById(1), 'there isn\'t an item with "numeric" id of `1`');
});

test('length is updated when new tracks are added or removed', function () {
  var ttcl = new _TextTrackCueList2['default'](genericTracks);

  ttcl.setCues_(genericTracks.concat([{ id: '100' }]));
  equal(ttcl.length, genericTracks.length + 1, 'the length is ' + (genericTracks.length + 1));
  ttcl.setCues_(genericTracks.concat([{ id: '100' }, { id: '101' }]));
  equal(ttcl.length, genericTracks.length + 2, 'the length is ' + (genericTracks.length + 2));

  ttcl.setCues_(genericTracks.concat([{ id: '100' }]));
  equal(ttcl.length, genericTracks.length + 1, 'the length is ' + (genericTracks.length + 1));
  ttcl.setCues_(genericTracks);
  equal(ttcl.length, genericTracks.length, 'the length is ' + genericTracks.length);
});

test('can access items by index', function () {
  var ttcl = new _TextTrackCueList2['default'](genericTracks),
      i = 0,
      length = ttcl.length;

  expect(length);

  for (; i < length; i++) {
    equal(ttcl[i].id, String(i + 1), 'the id of a track matches the index + 1');
  }
});

test('can access new items by index', function () {
  var ttcl = new _TextTrackCueList2['default'](genericTracks);

  ttcl.setCues_(genericTracks.concat([{ id: '100' }]));

  equal(ttcl[3].id, '100', 'id of item at index 3 is 100');
  ttcl.setCues_(genericTracks.concat([{ id: '100' }, { id: '101' }]));
  equal(ttcl[4].id, '101', 'id of item at index 4 is 101');
});

test('cannot access removed items by index', function () {
  var ttcl = new _TextTrackCueList2['default'](genericTracks);

  ttcl.setCues_(genericTracks.concat([{ id: '100' }, { id: '101' }]));
  equal(ttcl[3].id, '100', 'id of item at index 3 is 100');
  equal(ttcl[4].id, '101', 'id of item at index 4 is 101');

  ttcl.setCues_(genericTracks);

  ok(!ttcl[3], 'nothing at index 3');
  ok(!ttcl[4], 'nothing at index 4');
});

test('new item available at old index', function () {
  var ttcl = new _TextTrackCueList2['default'](genericTracks);

  ttcl.setCues_(genericTracks.concat([{ id: '100' }]));
  equal(ttcl[3].id, '100', 'id of item at index 3 is 100');

  ttcl.setCues_(genericTracks);
  ok(!ttcl[3], 'nothing at index 3');

  ttcl.setCues_(genericTracks.concat([{ id: '101' }]));
  equal(ttcl[3].id, '101', 'id of new item at index 3 is now 101');
});

},{"../../../src/js/tracks/text-track-cue-list.js":81}],110:[function(require,module,exports){
'use strict';

var _interopRequireWildcard = function (obj) { return obj && obj.__esModule ? obj : { 'default': obj }; };

var _TextTrackList = require('../../../src/js/tracks/text-track-list.js');

var _TextTrackList2 = _interopRequireWildcard(_TextTrackList);

var _TextTrack = require('../../../src/js/tracks/text-track.js');

var _TextTrack2 = _interopRequireWildcard(_TextTrack);

var _EventEmitter = require('../../../src/js/event-emitter.js');

var _EventEmitter2 = _interopRequireWildcard(_EventEmitter);

var noop = Function.prototype;
var genericTracks = [{
  id: '1',
  addEventListener: noop
}, {
  id: '2',
  addEventListener: noop
}, {
  id: '3',
  addEventListener: noop
}];

q.module('Text Track List');

test('TextTrackList\'s length is set correctly', function () {
  var ttl = new _TextTrackList2['default'](genericTracks);

  equal(ttl.length, genericTracks.length, 'the length is ' + genericTracks.length);
});

test('can get text tracks by id', function () {
  var ttl = new _TextTrackList2['default'](genericTracks);

  equal(ttl.getTrackById('1').id, 1, 'id "1" has id of "1"');
  equal(ttl.getTrackById('2').id, 2, 'id "2" has id of "2"');
  equal(ttl.getTrackById('3').id, 3, 'id "3" has id of "3"');
  ok(!ttl.getTrackById(1), 'there isn\'t an item with "numeric" id of `1`');
});

test('length is updated when new tracks are added or removed', function () {
  var ttl = new _TextTrackList2['default'](genericTracks);

  ttl.addTrack_({ id: '100', addEventListener: noop });
  equal(ttl.length, genericTracks.length + 1, 'the length is ' + (genericTracks.length + 1));
  ttl.addTrack_({ id: '101', addEventListener: noop });
  equal(ttl.length, genericTracks.length + 2, 'the length is ' + (genericTracks.length + 2));

  ttl.removeTrack_(ttl.getTrackById('101'));
  equal(ttl.length, genericTracks.length + 1, 'the length is ' + (genericTracks.length + 1));
  ttl.removeTrack_(ttl.getTrackById('100'));
  equal(ttl.length, genericTracks.length, 'the length is ' + genericTracks.length);
});

test('can access items by index', function () {
  var ttl = new _TextTrackList2['default'](genericTracks),
      i = 0,
      length = ttl.length;

  expect(length);

  for (; i < length; i++) {
    equal(ttl[i].id, String(i + 1), 'the id of a track matches the index + 1');
  }
});

test('can access new items by index', function () {
  var ttl = new _TextTrackList2['default'](genericTracks);

  ttl.addTrack_({ id: '100', addEventListener: noop });
  equal(ttl[3].id, '100', 'id of item at index 3 is 100');
  ttl.addTrack_({ id: '101', addEventListener: noop });
  equal(ttl[4].id, '101', 'id of item at index 4 is 101');
});

test('cannot access removed items by index', function () {
  var ttl = new _TextTrackList2['default'](genericTracks);

  ttl.addTrack_({ id: '100', addEventListener: noop });
  ttl.addTrack_({ id: '101', addEventListener: noop });
  equal(ttl[3].id, '100', 'id of item at index 3 is 100');
  equal(ttl[4].id, '101', 'id of item at index 4 is 101');

  ttl.removeTrack_(ttl.getTrackById('101'));
  ttl.removeTrack_(ttl.getTrackById('100'));

  ok(!ttl[3], 'nothing at index 3');
  ok(!ttl[4], 'nothing at index 4');
});

test('new item available at old index', function () {
  var ttl = new _TextTrackList2['default'](genericTracks);

  ttl.addTrack_({ id: '100', addEventListener: noop });
  equal(ttl[3].id, '100', 'id of item at index 3 is 100');

  ttl.removeTrack_(ttl.getTrackById('100'));
  ok(!ttl[3], 'nothing at index 3');

  ttl.addTrack_({ id: '101', addEventListener: noop });
  equal(ttl[3].id, '101', 'id of new item at index 3 is now 101');
});

test('a "addtrack" event is triggered when new tracks are added', function () {
  var ttl = new _TextTrackList2['default'](genericTracks),
      tracks = 0,
      adds = 0,
      addHandler = function addHandler(e) {
    e.track && tracks++;
    adds++;
  };

  ttl.on('addtrack', addHandler);

  ttl.addTrack_({ id: '100', addEventListener: noop });
  ttl.addTrack_({ id: '101', addEventListener: noop });

  ttl.off('addtrack', addHandler);

  ttl.onaddtrack = addHandler;

  ttl.addTrack_({ id: '102', addEventListener: noop });
  ttl.addTrack_({ id: '103', addEventListener: noop });

  equal(adds, 4, 'we got ' + adds + ' "addtrack" events');
  equal(tracks, 4, 'we got a track with every event');
});

test('a "removetrack" event is triggered when tracks are removed', function () {
  var ttl = new _TextTrackList2['default'](genericTracks),
      tracks = 0,
      rms = 0,
      rmHandler = function rmHandler(e) {
    e.track && tracks++;
    rms++;
  };

  ttl.on('removetrack', rmHandler);

  ttl.removeTrack_(ttl.getTrackById('1'));
  ttl.removeTrack_(ttl.getTrackById('2'));

  ttl.off('removetrack', rmHandler);

  ttl.onremovetrack = rmHandler;

  ttl.removeTrack_(ttl.getTrackById('3'));

  equal(rms, 3, 'we got ' + rms + ' "removetrack" events');
  equal(tracks, 3, 'we got a track with every event');
});

test('trigger "change" event when "modechange" is fired on a track', function () {
  var tt = new _EventEmitter2['default'](),
      ttl = new _TextTrackList2['default']([tt]),
      changes = 0,
      changeHandler = function changeHandler() {
    changes++;
  };

  ttl.on('change', changeHandler);

  tt.trigger('modechange');

  ttl.off('change', changeHandler);

  ttl.onchange = changeHandler;

  tt.trigger('modechange');

  equal(changes, 2, 'two change events should have fired');
});

test('trigger "change" event when mode changes on a TextTracl', function () {
  var tt = new _TextTrack2['default']({
    player: {
      on: noop
    }
  }),
      ttl = new _TextTrackList2['default']([tt]),
      changes = 0,
      changeHandler = function changeHandler() {
    changes++;
  };

  ttl.on('change', changeHandler);

  tt.mode = 'showing';

  ttl.off('change', changeHandler);

  ttl.onchange = changeHandler;

  tt.mode = 'hidden';
  tt.mode = 'disabled';

  equal(changes, 3, 'three change events should have fired');
});

},{"../../../src/js/event-emitter.js":61,"../../../src/js/tracks/text-track-list.js":84,"../../../src/js/tracks/text-track.js":86}],111:[function(require,module,exports){
'use strict';

var _interopRequireWildcard = function (obj) { return obj && obj.__esModule ? obj : { 'default': obj }; };

var _TextTrackSettings = require('../../../src/js/tracks/text-track-settings.js');

var _TextTrackSettings2 = _interopRequireWildcard(_TextTrackSettings);

var _TestHelpers = require('../test-helpers.js');

var _TestHelpers2 = _interopRequireWildcard(_TestHelpers);

var _import = require('../../../src/js/events.js');

var Events = _interopRequireWildcard(_import);

var _safeParseTuple = require('safe-json-parse/tuple');

var _safeParseTuple2 = _interopRequireWildcard(_safeParseTuple);

var _window = require('global/window');

var _window2 = _interopRequireWildcard(_window);

var tracks = [{
  kind: 'captions',
  label: 'test'
}];

q.module('Text Track Settings', {
  beforeEach: function beforeEach() {
    _window2['default'].localStorage.clear();
  }
});

test('should update settings', function () {
  var player = _TestHelpers2['default'].makePlayer({
    tracks: tracks,
    persistTextTrackSettings: true
  }),
      newSettings = {
    backgroundOpacity: '1',
    textOpacity: '1',
    windowOpacity: '1',
    edgeStyle: 'raised',
    fontFamily: 'monospaceSerif',
    color: '#FFF',
    backgroundColor: '#FFF',
    windowColor: '#FFF',
    fontPercent: 1.25
  };

  player.textTrackSettings.setValues(newSettings);
  deepEqual(player.textTrackSettings.getValues(), newSettings, 'values are updated');

  equal(player.el().querySelector('.vjs-fg-color > select').selectedIndex, 1, 'fg-color is set to new value');
  equal(player.el().querySelector('.vjs-bg-color > select').selectedIndex, 1, 'bg-color is set to new value');
  equal(player.el().querySelector('.window-color > select').selectedIndex, 1, 'window-color is set to new value');
  equal(player.el().querySelector('.vjs-text-opacity > select').selectedIndex, 1, 'text-opacity is set to new value');
  equal(player.el().querySelector('.vjs-bg-opacity > select').selectedIndex, 1, 'bg-opacity is set to new value');
  equal(player.el().querySelector('.vjs-window-opacity > select').selectedIndex, 1, 'window-opacity is set to new value');
  equal(player.el().querySelector('.vjs-edge-style select').selectedIndex, 1, 'edge-style is set to new value');
  equal(player.el().querySelector('.vjs-font-family select').selectedIndex, 1, 'font-family is set to new value');
  equal(player.el().querySelector('.vjs-font-percent select').selectedIndex, 3, 'font-percent is set to new value');

  Events.trigger(player.el().querySelector('.vjs-done-button'), 'click');
  deepEqual(_safeParseTuple2['default'](_window2['default'].localStorage.getItem('vjs-text-track-settings'))[1], newSettings, 'values are saved');
});

test('should restore default settings', function () {
  var player = _TestHelpers2['default'].makePlayer({
    tracks: tracks,
    persistTextTrackSettings: true
  });

  player.el().querySelector('.vjs-fg-color > select').selectedIndex = 1;
  player.el().querySelector('.vjs-bg-color > select').selectedIndex = 1;
  player.el().querySelector('.window-color > select').selectedIndex = 1;
  player.el().querySelector('.vjs-text-opacity > select').selectedIndex = 1;
  player.el().querySelector('.vjs-bg-opacity > select').selectedIndex = 1;
  player.el().querySelector('.vjs-window-opacity > select').selectedIndex = 1;
  player.el().querySelector('.vjs-edge-style select').selectedIndex = 1;
  player.el().querySelector('.vjs-font-family select').selectedIndex = 1;
  player.el().querySelector('.vjs-font-percent select').selectedIndex = 3;

  Events.trigger(player.el().querySelector('.vjs-done-button'), 'click');
  Events.trigger(player.el().querySelector('.vjs-default-button'), 'click');
  Events.trigger(player.el().querySelector('.vjs-done-button'), 'click');

  deepEqual(player.textTrackSettings.getValues(), {}, 'values are defaulted');
  deepEqual(_window2['default'].localStorage.getItem('vjs-text-track-settings'), null, 'values are saved');

  equal(player.el().querySelector('.vjs-fg-color > select').selectedIndex, 0, 'fg-color is set to default value');
  equal(player.el().querySelector('.vjs-bg-color > select').selectedIndex, 0, 'bg-color is set to default value');
  equal(player.el().querySelector('.window-color > select').selectedIndex, 0, 'window-color is set to default value');
  equal(player.el().querySelector('.vjs-text-opacity > select').selectedIndex, 0, 'text-opacity is set to default value');
  equal(player.el().querySelector('.vjs-bg-opacity > select').selectedIndex, 0, 'bg-opacity is set to default value');
  equal(player.el().querySelector('.vjs-window-opacity > select').selectedIndex, 0, 'window-opacity is set to default value');
  equal(player.el().querySelector('.vjs-edge-style select').selectedIndex, 0, 'edge-style is set to default value');
  equal(player.el().querySelector('.vjs-font-family select').selectedIndex, 0, 'font-family is set to default value');
  equal(player.el().querySelector('.vjs-font-percent select').selectedIndex, 2, 'font-percent is set to default value');
});

test('should open on click', function () {
  var player = _TestHelpers2['default'].makePlayer({
    tracks: tracks
  });
  Events.trigger(player.el().querySelector('.vjs-texttrack-settings'), 'click');
  ok(!player.textTrackSettings.hasClass('vjs-hidden'), 'settings open');
});

test('should close on done click', function () {
  var player = _TestHelpers2['default'].makePlayer({
    tracks: tracks
  });
  Events.trigger(player.el().querySelector('.vjs-texttrack-settings'), 'click');
  Events.trigger(player.el().querySelector('.vjs-done-button'), 'click');
  ok(player.textTrackSettings.hasClass('vjs-hidden'), 'settings closed');
});

test('if persist option is set, restore settings on init', function () {
  var player,
      oldRestoreSettings = _TextTrackSettings2['default'].prototype.restoreSettings,
      restore = 0;

  _TextTrackSettings2['default'].prototype.restoreSettings = function () {
    restore++;
  };

  player = _TestHelpers2['default'].makePlayer({
    tracks: tracks,
    persistTextTrackSettings: true
  });

  equal(restore, 1, 'restore was called');

  _TextTrackSettings2['default'].prototype.restoreSettings = oldRestoreSettings;
});

test('if persist option is set, save settings when "done"', function () {
  var player = _TestHelpers2['default'].makePlayer({
    tracks: tracks,
    persistTextTrackSettings: true
  }),
      oldSaveSettings = _TextTrackSettings2['default'].prototype.saveSettings,
      save = 0;

  _TextTrackSettings2['default'].prototype.saveSettings = function () {
    save++;
  };

  Events.trigger(player.el().querySelector('.vjs-done-button'), 'click');

  equal(save, 1, 'save was called');

  _TextTrackSettings2['default'].prototype.saveSettings = oldSaveSettings;
});

test('do not try to restore or save settings if persist option is not set', function () {
  var player,
      oldRestoreSettings = _TextTrackSettings2['default'].prototype.restoreSettings,
      oldSaveSettings = _TextTrackSettings2['default'].prototype.saveSettings,
      save = 0,
      restore = 0;

  _TextTrackSettings2['default'].prototype.restoreSettings = function () {
    restore++;
  };
  _TextTrackSettings2['default'].prototype.saveSettings = function () {
    save++;
  };

  player = _TestHelpers2['default'].makePlayer({
    tracks: tracks,
    persistTextTrackSettings: false
  });

  equal(restore, 0, 'restore was not called');

  Events.trigger(player.el().querySelector('.vjs-done-button'), 'click');

  // saveSettings is called but does nothing
  equal(save, 1, 'save was not called');

  _TextTrackSettings2['default'].prototype.saveSettings = oldSaveSettings;
  _TextTrackSettings2['default'].prototype.restoreSettings = oldRestoreSettings;
});

test('should restore saved settings', function () {
  var player,
      newSettings = {
    backgroundOpacity: '1',
    textOpacity: '1',
    windowOpacity: '1',
    edgeStyle: 'raised',
    fontFamily: 'monospaceSerif',
    color: '#FFF',
    backgroundColor: '#FFF',
    windowColor: '#FFF',
    fontPercent: 1.25
  };

  _window2['default'].localStorage.setItem('vjs-text-track-settings', JSON.stringify(newSettings));

  player = _TestHelpers2['default'].makePlayer({
    tracks: tracks,
    persistTextTrackSettings: true
  });

  deepEqual(player.textTrackSettings.getValues(), newSettings);
});

test('should not restore saved settings', function () {
  var player,
      newSettings = {
    backgroundOpacity: '1',
    textOpacity: '1',
    windowOpacity: '1',
    edgeStyle: 'raised',
    fontFamily: 'monospaceSerif',
    color: '#FFF',
    backgroundColor: '#FFF',
    windowColor: '#FFF',
    fontPercent: 1.25
  };

  _window2['default'].localStorage.setItem('vjs-text-track-settings', JSON.stringify(newSettings));

  player = _TestHelpers2['default'].makePlayer({
    tracks: tracks,
    persistTextTrackSettings: false
  });

  deepEqual(player.textTrackSettings.getValues(), {});
});

},{"../../../src/js/events.js":62,"../../../src/js/tracks/text-track-settings.js":85,"../test-helpers.js":107,"global/window":2,"safe-json-parse/tuple":8}],112:[function(require,module,exports){
'use strict';

var _interopRequireWildcard = function (obj) { return obj && obj.__esModule ? obj : { 'default': obj }; };

var _TextTrack = require('../../../src/js/tracks/text-track.js');

var _TextTrack2 = _interopRequireWildcard(_TextTrack);

var _window = require('global/window');

var _window2 = _interopRequireWildcard(_window);

var _TestHelpers = require('../test-helpers.js');

var _TestHelpers2 = _interopRequireWildcard(_TestHelpers);

var noop = Function.prototype;
var defaultPlayer = {
  textTracks: noop,
  on: noop,
  off: noop,
  currentTime: noop
};

q.module('Text Track');

test('text-track requires a player', function () {
  _window2['default'].throws(function () {
    new _TextTrack2['default']();
  }, new Error('A player was not provided.'), 'a player is required for text track');
});

test('can create a TextTrack with various properties', function () {
  var kind = 'captions',
      label = 'English',
      language = 'en',
      id = '1',
      mode = 'disabled',
      tt = new _TextTrack2['default']({
    player: defaultPlayer,
    kind: kind,
    label: label,
    language: language,
    id: id,
    mode: mode
  });

  equal(tt.kind, kind, 'we have a kind');
  equal(tt.label, label, 'we have a label');
  equal(tt.language, language, 'we have a language');
  equal(tt.id, id, 'we have a id');
  equal(tt.mode, mode, 'we have a mode');
});

test('defaults when items not provided', function () {
  var tt = new _TextTrack2['default']({
    player: defaultPlayer
  });

  equal(tt.kind, 'subtitles', 'kind defaulted to subtitles');
  equal(tt.mode, 'disabled', 'mode defaulted to disabled');
  equal(tt.label, '', 'label defaults to empty string');
  equal(tt.language, '', 'language defaults to empty string');
});

test('kind can only be one of several options, defaults to subtitles', function () {
  var tt = new _TextTrack2['default']({
    player: defaultPlayer,
    kind: 'foo'
  });

  equal(tt.kind, 'subtitles', 'the kind is set to subtitles, not foo');
  notEqual(tt.kind, 'foo', 'the kind is set to subtitles, not foo');

  tt = new _TextTrack2['default']({
    player: defaultPlayer,
    kind: 'subtitles'
  });

  equal(tt.kind, 'subtitles', 'the kind is set to subtitles');

  tt = new _TextTrack2['default']({
    player: defaultPlayer,
    kind: 'captions'
  });

  equal(tt.kind, 'captions', 'the kind is set to captions');

  tt = new _TextTrack2['default']({
    player: defaultPlayer,
    kind: 'descriptions'
  });

  equal(tt.kind, 'descriptions', 'the kind is set to descriptions');

  tt = new _TextTrack2['default']({
    player: defaultPlayer,
    kind: 'chapters'
  });

  equal(tt.kind, 'chapters', 'the kind is set to chapters');

  tt = new _TextTrack2['default']({
    player: defaultPlayer,
    kind: 'metadata'
  });

  equal(tt.kind, 'metadata', 'the kind is set to metadata');
});

test('mode can only be one of several options, defaults to disabled', function () {
  var tt = new _TextTrack2['default']({
    player: defaultPlayer,
    mode: 'foo'
  });

  equal(tt.mode, 'disabled', 'the mode is set to disabled, not foo');
  notEqual(tt.mode, 'foo', 'the mode is set to disabld, not foo');

  tt = new _TextTrack2['default']({
    player: defaultPlayer,
    mode: 'disabled'
  });

  equal(tt.mode, 'disabled', 'the mode is set to disabled');

  tt = new _TextTrack2['default']({
    player: defaultPlayer,
    mode: 'hidden'
  });

  equal(tt.mode, 'hidden', 'the mode is set to hidden');

  tt = new _TextTrack2['default']({
    player: defaultPlayer,
    mode: 'showing'
  });

  equal(tt.mode, 'showing', 'the mode is set to showing');
});

test('kind, label, language, id, cue, and activeCues are read only', function () {
  var kind = 'captions',
      label = 'English',
      language = 'en',
      id = '1',
      mode = 'disabled',
      tt = new _TextTrack2['default']({
    player: defaultPlayer,
    kind: kind,
    label: label,
    language: language,
    id: id,
    mode: mode
  });

  tt.kind = 'subtitles';
  tt.label = 'Spanish';
  tt.language = 'es';
  tt.id = '2';
  tt.cues = 'foo';
  tt.activeCues = 'bar';

  equal(tt.kind, kind, 'kind is still set to captions');
  equal(tt.label, label, 'label is still set to English');
  equal(tt.language, language, 'language is still set to en');
  equal(tt.id, id, 'id is still set to \'1\'');
  notEqual(tt.cues, 'foo', 'cues is still original value');
  notEqual(tt.activeCues, 'bar', 'activeCues is still original value');
});

test('mode can only be set to a few options', function () {
  var tt = new _TextTrack2['default']({
    player: defaultPlayer
  });

  tt.mode = 'foo';

  notEqual(tt.mode, 'foo', 'the mode is still the old value, disabled');
  equal(tt.mode, 'disabled', 'still on the default mode, disabled');

  tt.mode = 'hidden';
  equal(tt.mode, 'hidden', 'mode set to hidden');

  tt.mode = 'bar';
  notEqual(tt.mode, 'bar', 'the mode is still the old value, hidden');
  equal(tt.mode, 'hidden', 'still on the previous mode, hidden');

  tt.mode = 'showing';
  equal(tt.mode, 'showing', 'mode set to showing');

  tt.mode = 'baz';
  notEqual(tt.mode, 'baz', 'the mode is still the old value, showing');
  equal(tt.mode, 'showing', 'still on the previous mode, showing');
});

test('cues and activeCues return a TextTrackCueList', function () {
  var tt = new _TextTrack2['default']({
    player: defaultPlayer
  });

  ok(tt.cues.getCueById, 'cues are a TextTrackCueList');
  ok(tt.activeCues.getCueById, 'activeCues are a TextTrackCueList');
});

test('cues can be added and removed from a TextTrack', function () {
  var tt = new _TextTrack2['default']({
    player: defaultPlayer
  }),
      cues;

  cues = tt.cues;

  equal(cues.length, 0, 'start with zero cues');

  tt.addCue({ id: '1' });

  equal(cues.length, 1, 'we have one cue');

  tt.removeCue(cues.getCueById('1'));

  equal(cues.length, 0, 'we have removed our one cue');

  tt.addCue({ id: '1' });
  tt.addCue({ id: '2' });
  tt.addCue({ id: '3' });

  equal(cues.length, 3, 'we now have 3 cues');
});

test('fires cuechange when cues become active and inactive', function () {
  var player = _TestHelpers2['default'].makePlayer(),
      changes = 0,
      cuechangeHandler,
      tt = new _TextTrack2['default']({
    player: player,
    mode: 'showing'
  });

  cuechangeHandler = function () {
    changes++;
  };

  tt.addCue({
    id: '1',
    startTime: 1,
    endTime: 5
  });

  tt.oncuechange = cuechangeHandler;
  tt.addEventListener('cuechange', cuechangeHandler);

  player.currentTime = function () {
    return 2;
  };

  player.trigger('timeupdate');

  equal(changes, 2, 'a cuechange event trigger addEventListener and oncuechange');

  player.currentTime = function () {
    return 7;
  };

  player.trigger('timeupdate');

  equal(changes, 4, 'a cuechange event trigger addEventListener and oncuechange');
});

},{"../../../src/js/tracks/text-track.js":86,"../test-helpers.js":107,"global/window":2}],113:[function(require,module,exports){
'use strict';

var _interopRequireWildcard = function (obj) { return obj && obj.__esModule ? obj : { 'default': obj }; };

var _ChaptersButton = require('../../../src/js/control-bar/text-track-controls/chapters-button.js');

var _ChaptersButton2 = _interopRequireWildcard(_ChaptersButton);

var _SubtitlesButton = require('../../../src/js/control-bar/text-track-controls/subtitles-button.js');

var _SubtitlesButton2 = _interopRequireWildcard(_SubtitlesButton);

var _CaptionsButton = require('../../../src/js/control-bar/text-track-controls/captions-button.js');

var _CaptionsButton2 = _interopRequireWildcard(_CaptionsButton);

var _TextTrackDisplay = require('../../../src/js/tracks/text-track-display.js');

var _TextTrackDisplay2 = _interopRequireWildcard(_TextTrackDisplay);

var _Html5 = require('../../../src/js/tech/html5.js');

var _Html52 = _interopRequireWildcard(_Html5);

var _Flash = require('../../../src/js/tech/flash.js');

var _Flash2 = _interopRequireWildcard(_Flash);

var _Tech = require('../../../src/js/tech/tech.js');

var _Tech2 = _interopRequireWildcard(_Tech);

var _Component = require('../../../src/js/component.js');

var _Component2 = _interopRequireWildcard(_Component);

var _import = require('../../../src/js/lib.js');

var Lib = _interopRequireWildcard(_import);

var _TestHelpers = require('../test-helpers.js');

var _TestHelpers2 = _interopRequireWildcard(_TestHelpers);

var _document = require('global/document');

var _document2 = _interopRequireWildcard(_document);

q.module('Tracks');

test('should place title list item into ul', function () {
  var player, chaptersButton;

  player = _TestHelpers2['default'].makePlayer();

  chaptersButton = new _ChaptersButton2['default'](player);

  var menuContentElement = chaptersButton.el().getElementsByTagName('UL')[0];
  var titleElement = menuContentElement.children[0];

  ok(titleElement.innerHTML === 'Chapters', 'title element placed in ul');

  player.dispose();
});

test('Player track methods call the tech', function () {
  var player,
      calls = 0;

  player = _TestHelpers2['default'].makePlayer();

  player.tech.textTracks = function () {
    calls++;
  };
  player.tech.addTextTrack = function () {
    calls++;
  };

  player.addTextTrack();
  player.textTracks();

  equal(calls, 2, 'both textTrack and addTextTrack defer to the tech');
});

test('TextTrackDisplay initializes tracks on player ready', function () {
  var calls = 0,
      ttd = new _TextTrackDisplay2['default']({
    on: Function.prototype,
    addTextTracks: function addTextTracks() {
      calls--;
    },
    getChild: function getChild() {
      calls--;
    },
    ready: function ready() {
      calls++;
    }
  }, {});

  equal(calls, 1, 'only a player.ready call was made');
});

// This is a bad test that breaks in Firefox because we disable FF for other reasons.
// test('html5 tech supports native text tracks if the video supports it', function() {
//   var oldTestVid = Lib.TEST_VID;
//
//   Lib.TEST_VID = {
//     textTracks: []
//   };
//
//   ok(Html5.supportsNativeTextTracks(), 'if textTracks are available on video element, native text tracks are supported');
//
//   Lib.TEST_VID = oldTestVid;
// });

test('listen to remove and add track events in native text tracks', function () {
  var oldTestVid = Lib.TEST_VID,
      player,
      options,
      oldTextTracks,
      events = {},
      html;

  oldTextTracks = _Html52['default'].prototype.textTracks;
  _Html52['default'].prototype.textTracks = function () {
    return {
      addEventListener: function addEventListener(type, handler) {
        events[type] = true;
      }
    };
  };

  Lib.TEST_VID = {
    textTracks: []
  };

  player = {
    // Function.prototype is a built-in no-op function.
    controls: Function.prototype,
    ready: Function.prototype,
    options: function options() {
      return {};
    },
    addChild: Function.prototype,
    id: Function.prototype,
    el: function el() {
      return {
        insertBefore: Function.prototype,
        appendChild: Function.prototype
      };
    }
  };
  player.player_ = player;
  player.options_ = options = {};

  html = new _Html52['default'](player, options);

  ok(events.removetrack, 'removetrack listener was added');
  ok(events.addtrack, 'addtrack listener was added');

  Lib.TEST_VID = oldTestVid;
  _Html52['default'].prototype.textTracks = oldTextTracks;
});

test('update texttrack buttons on removetrack or addtrack', function () {
  var update = 0,
      i,
      player,
      tag,
      track,
      oldTextTracks,
      events = {},
      oldCaptionsUpdate,
      oldSubsUpdate,
      oldChaptersUpdate;

  oldCaptionsUpdate = _CaptionsButton2['default'].prototype.update;
  oldSubsUpdate = _SubtitlesButton2['default'].prototype.update;
  oldChaptersUpdate = _ChaptersButton2['default'].prototype.update;
  _CaptionsButton2['default'].prototype.update = function () {
    update++;
    oldCaptionsUpdate.call(this);
  };
  _SubtitlesButton2['default'].prototype.update = function () {
    update++;
    oldSubsUpdate.call(this);
  };
  _ChaptersButton2['default'].prototype.update = function () {
    update++;
    oldChaptersUpdate.call(this);
  };

  _Tech2['default'].prototype.featuresNativeTextTracks = true;
  oldTextTracks = _Tech2['default'].prototype.textTracks;
  _Tech2['default'].prototype.textTracks = function () {
    return {
      length: 0,
      addEventListener: function addEventListener(type, handler) {
        if (!events[type]) {
          events[type] = [];
        }
        events[type].push(handler);
      }
    };
  };

  tag = _document2['default'].createElement('video');
  track = _document2['default'].createElement('track');
  track.kind = 'captions';
  track.label = 'en';
  track.language = 'English';
  track.src = 'en.vtt';
  tag.appendChild(track);
  track = _document2['default'].createElement('track');
  track.kind = 'captions';
  track.label = 'es';
  track.language = 'Spanish';
  track.src = 'es.vtt';
  tag.appendChild(track);

  player = _TestHelpers2['default'].makePlayer({}, tag);

  player.player_ = player;

  equal(update, 3, 'update was called on the three buttons during init');

  for (i = 0; i < events.removetrack.length; i++) {
    events.removetrack[i]();
  }

  equal(update, 6, 'update was called on the three buttons for remove track');

  for (i = 0; i < events.addtrack.length; i++) {
    events.addtrack[i]();
  }

  equal(update, 9, 'update was called on the three buttons for remove track');

  _Tech2['default'].prototype.textTracks = oldTextTracks;
  _Tech2['default'].prototype.featuresNativeTextTracks = false;
  _CaptionsButton2['default'].prototype.update = oldCaptionsUpdate;
  _SubtitlesButton2['default'].prototype.update = oldSubsUpdate;
  _ChaptersButton2['default'].prototype.update = oldChaptersUpdate;
});

test('if native text tracks are not supported, create a texttrackdisplay', function () {
  var oldTestVid = Lib.TEST_VID,
      oldIsFirefox = Lib.IS_FIREFOX,
      oldTextTrackDisplay = _Component2['default'].getComponent('TextTrackDisplay'),
      called = false,
      player,
      tag,
      track,
      options,
      html;

  tag = _document2['default'].createElement('video');
  track = _document2['default'].createElement('track');
  track.kind = 'captions';
  track.label = 'en';
  track.language = 'English';
  track.src = 'en.vtt';
  tag.appendChild(track);
  track = _document2['default'].createElement('track');
  track.kind = 'captions';
  track.label = 'es';
  track.language = 'Spanish';
  track.src = 'es.vtt';
  tag.appendChild(track);

  Lib.TEST_VID = {
    textTracks: []
  };

  Lib.IS_FIREFOX = true;
  _Component2['default'].registerComponent('TextTrackDisplay', function () {
    called = true;
  });

  player = _TestHelpers2['default'].makePlayer({}, tag);

  ok(called, 'text track display was created');

  Lib.TEST_VID = oldTestVid;
  Lib.IS_FIREFOX = oldIsFirefox;
  _Component2['default'].registerComponent('TextTrackDisplay', oldTextTrackDisplay);
});

test('Player track methods call the tech', function () {
  var player,
      calls = 0;

  player = _TestHelpers2['default'].makePlayer();

  player.tech.textTracks = function () {
    calls++;
  };
  player.tech.addTextTrack = function () {
    calls++;
  };

  player.addTextTrack();
  player.textTracks();

  equal(calls, 2, 'both textTrack and addTextTrack defer to the tech');
});

test('html5 tech supports native text tracks if the video supports it, unless mode is a number', function () {
  var oldTestVid = Lib.TEST_VID;

  Lib.TEST_VID = {
    textTracks: [{
      mode: 0
    }]
  };

  ok(!_Html52['default'].supportsNativeTextTracks(), 'native text tracks are not supported if mode is a number');

  Lib.TEST_VID = oldTestVid;
});

test('html5 tech supports native text tracks if the video supports it, unless it is firefox', function () {
  var oldTestVid = Lib.TEST_VID,
      oldIsFirefox = Lib.IS_FIREFOX;

  Lib.TEST_VID = {
    textTracks: []
  };

  Lib.IS_FIREFOX = true;

  ok(!_Html52['default'].supportsNativeTextTracks(), 'if textTracks are available on video element, native text tracks are supported');

  Lib.TEST_VID = oldTestVid;
  Lib.IS_FIREFOX = oldIsFirefox;
});

test('when switching techs, we should not get a new text track', function () {
  var player = _TestHelpers2['default'].makePlayer({
    html5: {
      nativeTextTracks: false
    }
  }),
      htmltracks,
      flashtracks;

  player.loadTech('Html5');

  htmltracks = player.textTracks();

  player.loadTech('Flash');

  flashtracks = player.textTracks();

  ok(htmltracks === flashtracks, 'the tracks are equal');
});

},{"../../../src/js/component.js":26,"../../../src/js/control-bar/text-track-controls/captions-button.js":42,"../../../src/js/control-bar/text-track-controls/chapters-button.js":43,"../../../src/js/control-bar/text-track-controls/subtitles-button.js":46,"../../../src/js/lib.js":64,"../../../src/js/tech/flash.js":77,"../../../src/js/tech/html5.js":78,"../../../src/js/tech/tech.js":80,"../../../src/js/tracks/text-track-display.js":82,"../test-helpers.js":107,"global/document":1}],114:[function(require,module,exports){
'use strict';

var _interopRequireWildcard = function (obj) { return obj && obj.__esModule ? obj : { 'default': obj }; };

var _import = require('../../src/js/util.js');

var Util = _interopRequireWildcard(_import);

q.module('Util');

test('should merge options objects', function () {
  var ob1, ob2, ob3;

  ob1 = {
    a: true,
    b: { b1: true, b2: true, b3: true },
    c: true
  };

  ob2 = {
    // override value
    a: false,
    // merge sub-option values
    b: { b1: true, b2: false, b4: true },
    // add new option
    d: true
  };

  ob3 = Util.mergeOptions(ob1, ob2);

  deepEqual(ob3, {
    a: false,
    b: { b1: true, b2: false, b3: true, b4: true },
    c: true,
    d: true
  }, 'options objects merged correctly');
});

},{"../../src/js/util.js":87}]},{},[90,91,92,93,94,95,96,97,98,99,100,101,102,103,104,105,106,107,108,109,110,111,112,113,114,89]);
