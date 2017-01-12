'use strict';

exports.__esModule = true;
exports.logByType = undefined;

var _window = require('global/window');

var _window2 = _interopRequireDefault(_window);

var _browser = require('./browser');

var _obj = require('./obj');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var log = void 0;

/**
 * Log messages to the console and history based on the type of message
 *
 * @param  {string} type
 *         The name of the console method to use.
 *
 * @param  {Array} args
 *         The arguments to be passed to the matching console method.
 *
 * @param  {boolean} [stringify]
 *         By default, only old IEs should get console argument stringification,
 *         but this is exposed as a parameter to facilitate testing.
 */
/**
 * @file log.js
 * @module log
 */
var logByType = exports.logByType = function logByType(type, args) {
  var stringify = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : !!_browser.IE_VERSION && _browser.IE_VERSION < 11;


  if (type !== 'log') {

    // add the type to the front of the message when it's not "log"
    args.unshift(type.toUpperCase() + ':');
  }

  // add to history
  log.history.push(args);

  // add console prefix after adding to history
  args.unshift('VIDEOJS:');

  // If there's no console then don't try to output messages, but they will
  // still be stored in `log.history`.
  //
  // Was setting these once outside of this function, but containing them
  // in the function makes it easier to test cases where console doesn't exist
  // when the module is executed.
  var fn = _window2['default'].console && _window2['default'].console[type];

  // Bail out if there's no console.
  if (!fn) {
    return;
  }

  // IEs previous to 11 log objects uselessly as "[object Object]"; so, JSONify
  // objects and arrays for those less-capable browsers.
  if (stringify) {
    args = args.map(function (a) {
      if ((0, _obj.isObject)(a) || Array.isArray(a)) {
        try {
          return JSON.stringify(a);
        } catch (x) {
          return String(a);
        }
      }

      // Cast to string before joining, so we get null and undefined explicitly
      // included in output (as we would in a modern console).
      return String(a);
    }).join(' ');
  }

  // Old IE versions do not allow .apply() for console methods (they are
  // reported as objects rather than functions).
  if (!fn.apply) {
    fn(args);
  } else {
    fn[Array.isArray(args) ? 'apply' : 'call'](_window2['default'].console, args);
  }
};

/**
 * Log plain debug messages
 *
 * @param {Mixed[]} args
 *        One or more messages or objects that should be logged.
 */
log = function log() {
  for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
    args[_key] = arguments[_key];
  }

  logByType('log', args);
};

/**
 * Keep a history of log messages
 *
 * @type {Array}
 */
log.history = [];

/**
 * Log error messages
 *
 * @param {Mixed[]} args
 *        One or more messages or objects that should be logged as an error
 */
log.error = function () {
  for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
    args[_key2] = arguments[_key2];
  }

  return logByType('error', args);
};

/**
 * Log warning messages
 *
 * @param {Mixed[]} args
 *        One or more messages or objects that should be logged as a warning.
 */
log.warn = function () {
  for (var _len3 = arguments.length, args = Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
    args[_key3] = arguments[_key3];
  }

  return logByType('warn', args);
};

exports['default'] = log;
