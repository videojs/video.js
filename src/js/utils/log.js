/**
 * @file log.js
 * @module log
 */
import window from 'global/window';
import {IE_VERSION} from './browser';
import {isObject} from './obj';

let log;

// This is the private tracking variable for logging level.
let level = 'all';

// This is the private tracking variable for the logging history.
let history = [];

/**
 * Log messages to the console and history based on the type of message
 *
 * @private
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
  if (history) {
    history.push([].concat(args));
  }

  // Add console prefix after adding to history.
  args.unshift('VIDEOJS:');

  // If there's no console then don't try to output messages, but they will
  // still be stored in history.
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
 * Logs plain debug messages. Similar to `console.log`.
 *
 * @class
 * @param    {Mixed[]} args
 *           One or more messages or objects that should be logged.
 */
log = function(...args) {
  logByType('log', args);
};

/**
 * Enumeration of available logging levels, where the keys are the level names
 * and the values are `|`-separated strings containing logging methods allowed
 * in that logging level. These strings are used to create a regular expression
 * matching the function name being called.
 *
 * Levels provided by video.js are:
 *
 * - `off`: Matches no calls. Any value that can be cast to `false` will have
 *   this effect. The most restrictive.
 * - `all` (default): Matches only Video.js-provided functions (`log`,
 *   `log.warn`, and `log.error`).
 * - `warn`: Matches `log.warn` and `log.error` calls.
 * - `error`: Matches only `log.error` calls.
 *
 * @type {Object}
 */
log.levels = {
  all: 'log|warn|error',
  error: 'error',
  off: '',
  warn: 'warn|error',
  DEFAULT: level
};

/**
 * Get or set the current logging level. If a string matching a key from
 * {@link log.levels} is provided, acts as a setter. Regardless of argument,
 * returns the current logging level.
 *
 * @param  {string} [lvl]
 *         Pass to set a new logging level.
 *
 * @return {string}
 *         The current logging level.
 */
log.level = (lvl) => {
  if (typeof lvl === 'string') {
    if (!log.levels.hasOwnProperty(lvl)) {
      throw new Error(`"${lvl}" in not a valid log level`);
    }
    level = lvl;
  }
  return level;
};

/**
 * Returns an array containing everything that has been logged to the history.
 *
 * This array is a shallow clone of the internal history record. However, its
 * contents are _not_ cloned; so, mutating objects inside this array will
 * mutate them in history.
 *
 * @return {Array}
 */
log.history = () => history ? [].concat(history) : [];

/**
 * Clears the internal history tracking, but does not prevent further history
 * tracking.
 */
log.history.clear = () => {
  if (history) {
    history.length = 0;
  }
};

/**
 * Disable history tracking if it is currently enabled.
 */
log.history.disable = () => {
  if (history !== null) {
    history.length = 0;
    history = null;
  }
};

/**
 * Enable history tracking if it is currently disabled.
 */
log.history.enable = () => {
  if (history === null) {
    history = [];
  }
};

/**
 * Logs error messages. Similar to `console.error`.
 *
 * @param {Mixed[]} args
 *        One or more messages or objects that should be logged as an error
 */
log.error = (...args) => logByType('error', args);

/**
 * Logs warning messages. Similar to `console.warn`.
 *
 * @param {Mixed[]} args
 *        One or more messages or objects that should be logged as a warning.
 */
log.warn = (...args) => logByType('warn', args);

export default log;
