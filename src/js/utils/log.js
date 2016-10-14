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

  // Make sure this is a plain old array.
  args = Array.prototype.slice.call(args);

  // Add the type to the front of the message when it's not "log"
  if (type !== 'log') {
    args.unshift(type.toUpperCase() + ':');
  }

  args.unshift('VIDEOJS:');

  // Add arguments to history
  log.history.push(args);

  // If there's no console then don't try to output messages, but they will
  // still be stored in `log.history`.
  //
  // This mainly prevents cases where old IE versions don't expose a `console`
  // object unless the console is actually open.
  const fn = window.console && window.console[type];

  if (!fn) {
    return;
  }

  // IEs previous to 11 log objects uselessly as "[object Object]"; so, JSONify
  // objects and arrays for those less-capable browsers.
  if (stringify) {
    args = args.map(a => {
      if (a && typeof a === 'object' || Array.isArray(a)) {
        try {
          return JSON.stringify(a);
        } catch (x) {}
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
    fn[Array.isArray(args) ? 'apply' : 'call'](null, args);
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
