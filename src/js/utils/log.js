/**
 * @file log.js
 * @module log
 */
import window from 'global/window';
import {IE_VERSION} from './browser';
import {isObject} from './obj';

let log;

// This is the private tracking variable for logging level.
let level = 'debug';

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
export const logByType = (type, args, stringify = !!IE_VERSION && IE_VERSION < 11) => {
  const lvl = log.levels[level];
  const lvlRegExp = new RegExp(`^(${lvl})$`);

  if (type !== 'log') {

    // Add the type to the front of the message when it's not "log".
    args.unshift(type.toUpperCase() + ':');
  }

  // Add a clone of the args at this point to history.
  log.history.push([].concat(args));

  // Add console prefix after adding to history.
  args.unshift('VIDEOJS:');

  // If there's no console then don't try to output messages, but they will
  // still be stored in `log.history`.
  //
  // Was setting these once outside of this function, but containing them
  // in the function makes it easier to test cases where console doesn't exist
  // when the module is executed.
  const fn = window.console && window.console[type];

  // Bail out if there's no console or if this type is not allowed by the
  // current logging level.
  if (!fn || !lvl || !lvlRegExp.test(type)) {
    return;
  }

  // IEs previous to 11 log objects uselessly as "[object Object]"; so, JSONify
  // objects and arrays for those less-capable browsers.
  if (stringify) {
    args = args.map(a => {
      if (isObject(a) || Array.isArray(a)) {
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
    fn[Array.isArray(args) ? 'apply' : 'call'](window.console, args);
  }
};

/**
 * Log plain debug messages
 *
 * @param {Mixed[]} args
 *        One or more messages or objects that should be logged.
 */
log = function(...args) {
  logByType('log', args);
};

/**
 * Keep a history of log messages
 *
 * @type {Array}
 */
log.history = [];

/**
 * Enumeration of available logging levels, where the keys are the level names
 * and the values are `|`-separated strings containing logging methods allowed
 * in that logging level.
 *
 * This allows users to define their own logging levels if desired. Levels are
 * used to create a regular expression matching the function name being called.
 *
 * Levels provided by video.js are:
 *
 * - `off`: Matches no calls. Any value that can be cast to `false` will have
 *   this effect. The most restrictive.
 * - `debug` (default): Matches only Video.js-provided functions (`log`,
 *   `log.warn`, and `log.error`).
 * - `warn`: Matches `log.warn` and `log.error` calls.
 * - `error`: Matches only `log.error` calls.
 *
 * @type {Object}
 */
log.levels = {};

Object.defineProperties(log.levels, {
  debug: {
    enumerable: true,
    value: 'log|warn|error'
  },
  error: {
    enumerable: true,
    value: 'error'
  },
  off: {
    enumerable: true,
    value: ''
  },
  warn: {
    enumerable: true,
    value: 'warn|error'
  }
});

if (window.VIDEOJS_DEFAULT_LOG_LEVEL &&
    log.levels.hasOwnProperty(window.VIDEOJS_DEFAULT_LOG_LEVEL)) {
  level = window.VIDEOJS_DEFAULT_LOG_LEVEL;
}

// DEFAULT is non-enumerable so it doesn't show up as an available level. This
// needs to be set _after_ the check for window.VIDEOJS_DEFAULT_LOG_LEVEL.
Object.defineProperty(log.levels, 'DEFAULT', {value: level});

/**
 * Get or set the current logging level. If a string matching a key from
 * {@see log.levels} is provided, acts as a setter. Regardless of argument,
 * returns the current logging level.
 *
 * @param  {String} [lvl]
 *         Pass to set a new logging level.
 *
 * @return {String}
 *         The current logging level.
 */
log.level = (lvl) => {
  if (typeof lvl === 'string') {
    if (!log.levels.hasOwnProperty(lvl)) {
      throw new Error(`"${lvl}" in not a valid log level. try one of: "${Object.keys(log.levels).join('", "')}"`);
    }
    level = lvl;
  }
  return level;
};

/**
 * Log error messages
 *
 * @param {Mixed[]} args
 *        One or more messages or objects that should be logged as an error
 */
log.error = (...args) => logByType('error', args);

/**
 * Log warning messages
 *
 * @param {Mixed[]} args
 *        One or more messages or objects that should be logged as a warning.
 */
log.warn = (...args) => logByType('warn', args);

export default log;
