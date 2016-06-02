/**
 * @file log.js
 */
import window from 'global/window';
import {IE_VERSION} from './browser';

const IS_IE_LT_11 = !!IE_VERSION && IE_VERSION < 11;

/**
 * Log messages to the console and history based on the type of message
 *
 * @param  {Object} args The args to be passed to the log
 * @param  {String} [type='log']
 * @private
 */
const _logByType = (args, type = 'log') => {

  // if there's no console then don't try to output messages
  // they will still be stored in log.history
  // Was setting these once outside of this function, but containing them
  // in the function makes it easier to test cases where console doesn't exist
  const noop = function(){};

  const console = window.console || {
    log: noop,
    warn: noop,
    error: noop
  };

  const fn = console[type];

  if (type !== 'log') {
    // add the type to the front of the message
    args.unshift(type.toUpperCase() + ':');
  }

  // add to history
  log.history.push(args);

  // add console prefix after adding to history
  args.unshift('VIDEOJS:');

  // Old IE versions do not allow .apply() for some/all console method(s). And
  // IEs previous to 11 log objects uselessly as "[object Object]"; so, JSONify
  // objects and arrays for those less-capable browsers.
  if (!fn.apply || IS_IE_LT_11) {
    fn(args.map(a => {
      if (a && typeof a === 'object' || Array.isArray(a)) {
        return JSON.stringify(a);
      }
      return a;
    }).join(' '));

  // Default hanlding for modern consoles.
  } else {
    fn(...args);
  }
};

/**
 * Log plain debug messages
 *
 * @function log
 */
function log(...args) {
  _logByType(args);
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
log.error = (...args) => _logByType(args, 'error');

/**
 * Log warning messages
 *
 * @method warn
 */
log.warn = (...args) => _logByType(args, 'warn');


export default log;
