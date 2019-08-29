/**
 * @file create-logger.js
 * @module create-logger
 */
import window from 'global/window';

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
 */
const LogByTypeFactory = (name, log) => (type, level, args) => {
  const lvl = log.levels[level];
  const lvlRegExp = new RegExp(`^(${lvl})$`);

  if (type !== 'log') {

    // Add the type to the front of the message when it's not "log".
    args.unshift(type.toUpperCase() + ':');
  }

  // Add console prefix after adding to history.
  args.unshift(name + ':');

  // Add a clone of the args at this point to history.
  if (history) {
    history.push([].concat(args));

    // only store 1000 history entries
    const splice = history.length - 1000;

    history.splice(0, splice > 0 ? splice : 0);
  }

  // If there's no console then don't try to output messages, but they will
  // still be stored in history.
  if (!window.console) {
    return;
  }

  // Was setting these once outside of this function, but containing them
  // in the function makes it easier to test cases where console doesn't exist
  // when the module is executed.
  let fn = window.console[type];

  if (!fn && type === 'debug') {
    // Certain browsers don't have support for console.debug. For those, we
    // should default to the closest comparable log.
    fn = window.console.info || window.console.log;
  }

  // Bail out if there's no console or if this type is not allowed by the
  // current logging level.
  if (!fn || !lvl || !lvlRegExp.test(type)) {
    return;
  }

  fn[Array.isArray(args) ? 'apply' : 'call'](window.console, args);
};

export default function createLogger(name) {
  // This is the private tracking variable for logging level.
  let level = 'info';

  // the curried logByType bound to the specific log and history
  let logByType;

  /**
   * Logs plain debug messages. Similar to `console.log`.
   *
   * Due to [limitations](https://github.com/jsdoc3/jsdoc/issues/955#issuecomment-313829149)
   * of our JSDoc template, we cannot properly document this as both a function
   * and a namespace, so its function signature is documented here.
   *
   * #### Arguments
   * ##### *args
   * Mixed[]
   *
   * Any combination of values that could be passed to `console.log()`.
   *
   * #### Return Value
   *
   * `undefined`
   *
   * @namespace
   * @param    {Mixed[]} args
   *           One or more messages or objects that should be logged.
   */
  const log = function(...args) {
    logByType('log', level, args);
  };

  // This is the logByType helper that the logging methods below use
  logByType = LogByTypeFactory(name, log);

  /**
   * Create a new sublogger which chains the old name to the new name.
   *
   * For example, doing `videojs.log.createLogger('player')` and then using that logger will log the following:
   * ```js
   *  mylogger('foo');
   *  // > VIDEOJS: player: foo
   * ```
   *
   * @param {string} name
   *        The name to add call the new logger
   * @return {Object}
   */
  log.createLogger = (subname) => createLogger(name + ': ' + subname);

  /**
   * Enumeration of available logging levels, where the keys are the level names
   * and the values are `|`-separated strings containing logging methods allowed
   * in that logging level. These strings are used to create a regular expression
   * matching the function name being called.
   *
   * Levels provided by Video.js are:
   *
   * - `off`: Matches no calls. Any value that can be cast to `false` will have
   *   this effect. The most restrictive.
   * - `all`: Matches only Video.js-provided functions (`debug`, `log`,
   *   `log.warn`, and `log.error`).
   * - `debug`: Matches `log.debug`, `log`, `log.warn`, and `log.error` calls.
   * - `info` (default): Matches `log`, `log.warn`, and `log.error` calls.
   * - `warn`: Matches `log.warn` and `log.error` calls.
   * - `error`: Matches only `log.error` calls.
   *
   * @type {Object}
   */
  log.levels = {
    all: 'debug|log|warn|error',
    off: '',
    debug: 'debug|log|warn|error',
    info: 'log|warn|error',
    warn: 'warn|error',
    error: 'error',
    DEFAULT: level
  };

  /**
   * Get or set the current logging level.
   *
   * If a string matching a key from {@link module:log.levels} is provided, acts
   * as a setter.
   *
   * @param  {string} [lvl]
   *         Pass a valid level to set a new logging level.
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
   * Allows you to filter the history by the given logger name
   *
   * @param {string} fname
   *        The name to filter by
   *
   * @return {Array}
   *         The filtered list to return
   */
  log.history.filter = (fname) => {
    return (history || []).filter((historyItem) => {
      // if the first item in each historyItem includes `fname`, then it's a match
      return new RegExp(`.*${fname}.*`).test(historyItem[0]);
    });
  };

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
  log.error = (...args) => logByType('error', level, args);

  /**
   * Logs warning messages. Similar to `console.warn`.
   *
   * @param {Mixed[]} args
   *        One or more messages or objects that should be logged as a warning.
   */
  log.warn = (...args) => logByType('warn', level, args);

  /**
   * Logs debug messages. Similar to `console.debug`, but may also act as a comparable
   * log if `console.debug` is not available
   *
   * @param {Mixed[]} args
   *        One or more messages or objects that should be logged as debug.
   */
  log.debug = (...args) => logByType('debug', level, args);

  return log;
}
