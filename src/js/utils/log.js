/**
 * @file log.js
 */
import window from 'global/window';
import {IE_VERSION} from './browser';

/**
 * Log messages to the console and history based on the type of message
 *
 * @param  {String} type
 *         The name of the console method to use.
 * @param  {Array} args
 *         The arguments to be passed to the matching console method.
 * @param  {Boolean} [stringify]
 *         By default, only old IEs should get console argument stringification,
 *         but this is exposed as a parameter to facilitate testing.
 */
export const logByType = (type, args, stringify = !!IE_VERSION && IE_VERSION < 11) => {
  const console = window.console;

  // If there's no console then don't try to output messages, but they will
  // still be stored in `log.history`.
  //
  // Was setting these once outside of this function, but containing them
  // in the function makes it easier to test cases where console doesn't exist
  // when the module is executed.
  const fn = console && console[type] || function(){};

  if (type !== 'log') {

    // add the type to the front of the message when it's not "log"
    args.unshift(type.toUpperCase() + ':');
  }

  // add to history
  log.history.push(args);

  // add console prefix after adding to history
  args.unshift('VIDEOJS:');

  // Old IE versions do not allow .apply() for some/all console method(s). And
  // IEs previous to 11 log objects uselessly as "[object Object]"; so, JSONify
  // objects and arrays for those less-capable browsers.
  if (!fn.apply || stringify) {
    fn(args.map(a => {
      if (a && typeof a === 'object' || Array.isArray(a)) {
        try {
          return JSON.stringify(a);
        } catch (x) {}
      }

      // Cast to string before joining, so we get null and undefined explicitly
      // included in output (as we would in a modern console).
      return String(a);
    }).join(' '));

  // Default hanlding for modern consoles.
  } else {
    fn.apply(console, args);
  }
};

/**
 * Log plain debug messages
 *
 * @function log
 */
function log(...args) {
  logByType('log', args);
}

/**
 * Keep a history of log messages
 *
 * @type {Array}
 */
log.history = [];

/**
 * Log error messages
 *
 * @method error
 */
log.error = (...args) => logByType('error', args);

/**
 * Log warning messages
 *
 * @method warn
 */
log.warn = (...args) => logByType('warn', args);


export default log;
