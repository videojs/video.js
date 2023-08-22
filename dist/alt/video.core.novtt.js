/**
 * @license
 * Video.js 8.5.2 <http://videojs.com/>
 * Copyright Brightcove, Inc. <https://www.brightcove.com/>
 * Available under Apache License Version 2.0
 * <https://github.com/videojs/video.js/blob/main/LICENSE>
 *
 * Includes vtt.js <https://github.com/mozilla/vtt.js>
 * Available under Apache License Version 2.0
 * <https://github.com/mozilla/vtt.js/blob/main/LICENSE>
 */

(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.videojs = factory());
})(this, (function () { 'use strict';

  var version = "8.5.2";

  /**
   * An Object that contains lifecycle hooks as keys which point to an array
   * of functions that are run when a lifecycle is triggered
   *
   * @private
   */
  const hooks_ = {};

  /**
   * Get a list of hooks for a specific lifecycle
   *
   * @param  {string} type
   *         the lifecycle to get hooks from
   *
   * @param  {Function|Function[]} [fn]
   *         Optionally add a hook (or hooks) to the lifecycle that your are getting.
   *
   * @return {Array}
   *         an array of hooks, or an empty array if there are none.
   */
  const hooks = function (type, fn) {
    hooks_[type] = hooks_[type] || [];
    if (fn) {
      hooks_[type] = hooks_[type].concat(fn);
    }
    return hooks_[type];
  };

  /**
   * Add a function hook to a specific videojs lifecycle.
   *
   * @param {string} type
   *        the lifecycle to hook the function to.
   *
   * @param {Function|Function[]}
   *        The function or array of functions to attach.
   */
  const hook = function (type, fn) {
    hooks(type, fn);
  };

  /**
   * Remove a hook from a specific videojs lifecycle.
   *
   * @param  {string} type
   *         the lifecycle that the function hooked to
   *
   * @param  {Function} fn
   *         The hooked function to remove
   *
   * @return {boolean}
   *         The function that was removed or undef
   */
  const removeHook = function (type, fn) {
    const index = hooks(type).indexOf(fn);
    if (index <= -1) {
      return false;
    }
    hooks_[type] = hooks_[type].slice();
    hooks_[type].splice(index, 1);
    return true;
  };

  /**
   * Add a function hook that will only run once to a specific videojs lifecycle.
   *
   * @param {string} type
   *        the lifecycle to hook the function to.
   *
   * @param {Function|Function[]}
   *        The function or array of functions to attach.
   */
  const hookOnce = function (type, fn) {
    hooks(type, [].concat(fn).map(original => {
      const wrapper = (...args) => {
        removeHook(type, wrapper);
        return original(...args);
      };
      return wrapper;
    }));
  };

  /**
   * @file fullscreen-api.js
   * @module fullscreen-api
   */

  /**
   * Store the browser-specific methods for the fullscreen API.
   *
   * @type {Object}
   * @see [Specification]{@link https://fullscreen.spec.whatwg.org}
   * @see [Map Approach From Screenfull.js]{@link https://github.com/sindresorhus/screenfull.js}
   */
  const FullscreenApi = {
    prefixed: true
  };

  // browser API methods
  const apiMap = [['requestFullscreen', 'exitFullscreen', 'fullscreenElement', 'fullscreenEnabled', 'fullscreenchange', 'fullscreenerror', 'fullscreen'],
  // WebKit
  ['webkitRequestFullscreen', 'webkitExitFullscreen', 'webkitFullscreenElement', 'webkitFullscreenEnabled', 'webkitfullscreenchange', 'webkitfullscreenerror', '-webkit-full-screen']];
  const specApi = apiMap[0];
  let browserApi;

  // determine the supported set of functions
  for (let i = 0; i < apiMap.length; i++) {
    // check for exitFullscreen function
    if (apiMap[i][1] in document) {
      browserApi = apiMap[i];
      break;
    }
  }

  // map the browser API names to the spec API names
  if (browserApi) {
    for (let i = 0; i < browserApi.length; i++) {
      FullscreenApi[specApi[i]] = browserApi[i];
    }
    FullscreenApi.prefixed = browserApi[0] !== specApi[0];
  }

  /**
   * @file create-logger.js
   * @module create-logger
   */

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
  function createLogger$1(name) {
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
     * *[]
     *
     * Any combination of values that could be passed to `console.log()`.
     *
     * #### Return Value
     *
     * `undefined`
     *
     * @namespace
     * @param    {...*} args
     *           One or more messages or objects that should be logged.
     */
    const log = function (...args) {
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
    log.createLogger = subname => createLogger$1(name + ': ' + subname);

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
    log.level = lvl => {
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
    log.history.filter = fname => {
      return (history || []).filter(historyItem => {
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
     * @param {...*} args
     *        One or more messages or objects that should be logged as an error
     */
    log.error = (...args) => logByType('error', level, args);

    /**
     * Logs warning messages. Similar to `console.warn`.
     *
     * @param {...*} args
     *        One or more messages or objects that should be logged as a warning.
     */
    log.warn = (...args) => logByType('warn', level, args);

    /**
     * Logs debug messages. Similar to `console.debug`, but may also act as a comparable
     * log if `console.debug` is not available
     *
     * @param {...*} args
     *        One or more messages or objects that should be logged as debug.
     */
    log.debug = (...args) => logByType('debug', level, args);
    return log;
  }

  /**
   * @file log.js
   * @module log
   */
  const log = createLogger$1('VIDEOJS');
  const createLogger = log.createLogger;

  /**
   * @file obj.js
   * @module obj
   */

  /**
   * @callback obj:EachCallback
   *
   * @param {*} value
   *        The current key for the object that is being iterated over.
   *
   * @param {string} key
   *        The current key-value for object that is being iterated over
   */

  /**
   * @callback obj:ReduceCallback
   *
   * @param {*} accum
   *        The value that is accumulating over the reduce loop.
   *
   * @param {*} value
   *        The current key for the object that is being iterated over.
   *
   * @param {string} key
   *        The current key-value for object that is being iterated over
   *
   * @return {*}
   *         The new accumulated value.
   */
  const toString$1 = Object.prototype.toString;

  /**
   * Get the keys of an Object
   *
   * @param {Object}
   *        The Object to get the keys from
   *
   * @return {string[]}
   *         An array of the keys from the object. Returns an empty array if the
   *         object passed in was invalid or had no keys.
   *
   * @private
   */
  const keys = function (object) {
    return isObject(object) ? Object.keys(object) : [];
  };

  /**
   * Array-like iteration for objects.
   *
   * @param {Object} object
   *        The object to iterate over
   *
   * @param {obj:EachCallback} fn
   *        The callback function which is called for each key in the object.
   */
  function each(object, fn) {
    keys(object).forEach(key => fn(object[key], key));
  }

  /**
   * Array-like reduce for objects.
   *
   * @param {Object} object
   *        The Object that you want to reduce.
   *
   * @param {Function} fn
   *         A callback function which is called for each key in the object. It
   *         receives the accumulated value and the per-iteration value and key
   *         as arguments.
   *
   * @param {*} [initial = 0]
   *        Starting value
   *
   * @return {*}
   *         The final accumulated value.
   */
  function reduce(object, fn, initial = 0) {
    return keys(object).reduce((accum, key) => fn(accum, object[key], key), initial);
  }

  /**
   * Returns whether a value is an object of any kind - including DOM nodes,
   * arrays, regular expressions, etc. Not functions, though.
   *
   * This avoids the gotcha where using `typeof` on a `null` value
   * results in `'object'`.
   *
   * @param  {Object} value
   * @return {boolean}
   */
  function isObject(value) {
    return !!value && typeof value === 'object';
  }

  /**
   * Returns whether an object appears to be a "plain" object - that is, a
   * direct instance of `Object`.
   *
   * @param  {Object} value
   * @return {boolean}
   */
  function isPlain(value) {
    return isObject(value) && toString$1.call(value) === '[object Object]' && value.constructor === Object;
  }

  /**
   * Merge two objects recursively.
   *
   * Performs a deep merge like
   * {@link https://lodash.com/docs/4.17.10#merge|lodash.merge}, but only merges
   * plain objects (not arrays, elements, or anything else).
   *
   * Non-plain object values will be copied directly from the right-most
   * argument.
   *
   * @param   {Object[]} sources
   *          One or more objects to merge into a new object.
   *
   * @return {Object}
   *          A new object that is the merged result of all sources.
   */
  function merge(...sources) {
    const result = {};
    sources.forEach(source => {
      if (!source) {
        return;
      }
      each(source, (value, key) => {
        if (!isPlain(value)) {
          result[key] = value;
          return;
        }
        if (!isPlain(result[key])) {
          result[key] = {};
        }
        result[key] = merge(result[key], value);
      });
    });
    return result;
  }

  /**
   * Returns an array of values for a given object
   *
   * @param  {Object} source - target object
   * @return {Array<unknown>} - object values
   */
  function values(source = {}) {
    const result = [];
    for (const key in source) {
      if (source.hasOwnProperty(key)) {
        const value = source[key];
        result.push(value);
      }
    }
    return result;
  }

  /**
   * Object.defineProperty but "lazy", which means that the value is only set after
   * it is retrieved the first time, rather than being set right away.
   *
   * @param {Object} obj the object to set the property on
   * @param {string} key the key for the property to set
   * @param {Function} getValue the function used to get the value when it is needed.
   * @param {boolean} setter whether a setter should be allowed or not
   */
  function defineLazyProperty(obj, key, getValue, setter = true) {
    const set = value => Object.defineProperty(obj, key, {
      value,
      enumerable: true,
      writable: true
    });
    const options = {
      configurable: true,
      enumerable: true,
      get() {
        const value = getValue();
        set(value);
        return value;
      }
    };
    if (setter) {
      options.set = set;
    }
    return Object.defineProperty(obj, key, options);
  }

  var Obj = /*#__PURE__*/Object.freeze({
    __proto__: null,
    each: each,
    reduce: reduce,
    isObject: isObject,
    isPlain: isPlain,
    merge: merge,
    values: values,
    defineLazyProperty: defineLazyProperty
  });

  /**
   * @file browser.js
   * @module browser
   */

  /**
   * Whether or not this device is an iPod.
   *
   * @static
   * @type {Boolean}
   */
  let IS_IPOD = false;

  /**
   * The detected iOS version - or `null`.
   *
   * @static
   * @type {string|null}
   */
  let IOS_VERSION = null;

  /**
   * Whether or not this is an Android device.
   *
   * @static
   * @type {Boolean}
   */
  let IS_ANDROID = false;

  /**
   * The detected Android version - or `null` if not Android or indeterminable.
   *
   * @static
   * @type {number|string|null}
   */
  let ANDROID_VERSION;

  /**
   * Whether or not this is Mozilla Firefox.
   *
   * @static
   * @type {Boolean}
   */
  let IS_FIREFOX = false;

  /**
   * Whether or not this is Microsoft Edge.
   *
   * @static
   * @type {Boolean}
   */
  let IS_EDGE = false;

  /**
   * Whether or not this is any Chromium Browser
   *
   * @static
   * @type {Boolean}
   */
  let IS_CHROMIUM = false;

  /**
   * Whether or not this is any Chromium browser that is not Edge.
   *
   * This will also be `true` for Chrome on iOS, which will have different support
   * as it is actually Safari under the hood.
   *
   * Deprecated, as the behaviour to not match Edge was to prevent Legacy Edge's UA matching.
   * IS_CHROMIUM should be used instead.
   * "Chromium but not Edge" could be explicitly tested with IS_CHROMIUM && !IS_EDGE
   *
   * @static
   * @deprecated
   * @type {Boolean}
   */
  let IS_CHROME = false;

  /**
   * The detected Chromium version - or `null`.
   *
   * @static
   * @type {number|null}
   */
  let CHROMIUM_VERSION = null;

  /**
   * The detected Google Chrome version - or `null`.
   * This has always been the _Chromium_ version, i.e. would return on Chromium Edge.
   * Deprecated, use CHROMIUM_VERSION instead.
   *
   * @static
   * @deprecated
   * @type {number|null}
   */
  let CHROME_VERSION = null;

  /**
   * The detected Internet Explorer version - or `null`.
   *
   * @static
   * @deprecated
   * @type {number|null}
   */
  let IE_VERSION = null;

  /**
   * Whether or not this is desktop Safari.
   *
   * @static
   * @type {Boolean}
   */
  let IS_SAFARI = false;

  /**
   * Whether or not this is a Windows machine.
   *
   * @static
   * @type {Boolean}
   */
  let IS_WINDOWS = false;

  /**
   * Whether or not this device is an iPad.
   *
   * @static
   * @type {Boolean}
   */
  let IS_IPAD = false;

  /**
   * Whether or not this device is an iPhone.
   *
   * @static
   * @type {Boolean}
   */
  // The Facebook app's UIWebView identifies as both an iPhone and iPad, so
  // to identify iPhones, we need to exclude iPads.
  // http://artsy.github.io/blog/2012/10/18/the-perils-of-ios-user-agent-sniffing/
  let IS_IPHONE = false;

  /**
   * Whether or not this device is touch-enabled.
   *
   * @static
   * @const
   * @type {Boolean}
   */
  const TOUCH_ENABLED = Boolean(isReal() && ('ontouchstart' in window || window.navigator.maxTouchPoints || window.DocumentTouch && window.document instanceof window.DocumentTouch));
  const UAD = window.navigator && window.navigator.userAgentData;
  if (UAD) {
    // If userAgentData is present, use it instead of userAgent to avoid warnings
    // Currently only implemented on Chromium
    // userAgentData does not expose Android version, so ANDROID_VERSION remains `null`

    IS_ANDROID = UAD.platform === 'Android';
    IS_EDGE = Boolean(UAD.brands.find(b => b.brand === 'Microsoft Edge'));
    IS_CHROMIUM = Boolean(UAD.brands.find(b => b.brand === 'Chromium'));
    IS_CHROME = !IS_EDGE && IS_CHROMIUM;
    CHROMIUM_VERSION = CHROME_VERSION = (UAD.brands.find(b => b.brand === 'Chromium') || {}).version || null;
    IS_WINDOWS = UAD.platform === 'Windows';
  }

  // If the browser is not Chromium, either userAgentData is not present which could be an old Chromium browser,
  //  or it's a browser that has added userAgentData since that we don't have tests for yet. In either case,
  // the checks need to be made agiainst the regular userAgent string.
  if (!IS_CHROMIUM) {
    const USER_AGENT = window.navigator && window.navigator.userAgent || '';
    IS_IPOD = /iPod/i.test(USER_AGENT);
    IOS_VERSION = function () {
      const match = USER_AGENT.match(/OS (\d+)_/i);
      if (match && match[1]) {
        return match[1];
      }
      return null;
    }();
    IS_ANDROID = /Android/i.test(USER_AGENT);
    ANDROID_VERSION = function () {
      // This matches Android Major.Minor.Patch versions
      // ANDROID_VERSION is Major.Minor as a Number, if Minor isn't available, then only Major is returned
      const match = USER_AGENT.match(/Android (\d+)(?:\.(\d+))?(?:\.(\d+))*/i);
      if (!match) {
        return null;
      }
      const major = match[1] && parseFloat(match[1]);
      const minor = match[2] && parseFloat(match[2]);
      if (major && minor) {
        return parseFloat(match[1] + '.' + match[2]);
      } else if (major) {
        return major;
      }
      return null;
    }();
    IS_FIREFOX = /Firefox/i.test(USER_AGENT);
    IS_EDGE = /Edg/i.test(USER_AGENT);
    IS_CHROMIUM = /Chrome/i.test(USER_AGENT) || /CriOS/i.test(USER_AGENT);
    IS_CHROME = !IS_EDGE && IS_CHROMIUM;
    CHROMIUM_VERSION = CHROME_VERSION = function () {
      const match = USER_AGENT.match(/(Chrome|CriOS)\/(\d+)/);
      if (match && match[2]) {
        return parseFloat(match[2]);
      }
      return null;
    }();
    IE_VERSION = function () {
      const result = /MSIE\s(\d+)\.\d/.exec(USER_AGENT);
      let version = result && parseFloat(result[1]);
      if (!version && /Trident\/7.0/i.test(USER_AGENT) && /rv:11.0/.test(USER_AGENT)) {
        // IE 11 has a different user agent string than other IE versions
        version = 11.0;
      }
      return version;
    }();
    IS_SAFARI = /Safari/i.test(USER_AGENT) && !IS_CHROME && !IS_ANDROID && !IS_EDGE;
    IS_WINDOWS = /Windows/i.test(USER_AGENT);
    IS_IPAD = /iPad/i.test(USER_AGENT) || IS_SAFARI && TOUCH_ENABLED && !/iPhone/i.test(USER_AGENT);
    IS_IPHONE = /iPhone/i.test(USER_AGENT) && !IS_IPAD;
  }

  /**
   * Whether or not this is an iOS device.
   *
   * @static
   * @const
   * @type {Boolean}
   */
  const IS_IOS = IS_IPHONE || IS_IPAD || IS_IPOD;

  /**
   * Whether or not this is any flavor of Safari - including iOS.
   *
   * @static
   * @const
   * @type {Boolean}
   */
  const IS_ANY_SAFARI = (IS_SAFARI || IS_IOS) && !IS_CHROME;

  var browser = /*#__PURE__*/Object.freeze({
    __proto__: null,
    get IS_IPOD () { return IS_IPOD; },
    get IOS_VERSION () { return IOS_VERSION; },
    get IS_ANDROID () { return IS_ANDROID; },
    get ANDROID_VERSION () { return ANDROID_VERSION; },
    get IS_FIREFOX () { return IS_FIREFOX; },
    get IS_EDGE () { return IS_EDGE; },
    get IS_CHROMIUM () { return IS_CHROMIUM; },
    get IS_CHROME () { return IS_CHROME; },
    get CHROMIUM_VERSION () { return CHROMIUM_VERSION; },
    get CHROME_VERSION () { return CHROME_VERSION; },
    get IE_VERSION () { return IE_VERSION; },
    get IS_SAFARI () { return IS_SAFARI; },
    get IS_WINDOWS () { return IS_WINDOWS; },
    get IS_IPAD () { return IS_IPAD; },
    get IS_IPHONE () { return IS_IPHONE; },
    TOUCH_ENABLED: TOUCH_ENABLED,
    IS_IOS: IS_IOS,
    IS_ANY_SAFARI: IS_ANY_SAFARI
  });

  /**
   * @file dom.js
   * @module dom
   */

  /**
   * Detect if a value is a string with any non-whitespace characters.
   *
   * @private
   * @param  {string} str
   *         The string to check
   *
   * @return {boolean}
   *         Will be `true` if the string is non-blank, `false` otherwise.
   *
   */
  function isNonBlankString(str) {
    // we use str.trim as it will trim any whitespace characters
    // from the front or back of non-whitespace characters. aka
    // Any string that contains non-whitespace characters will
    // still contain them after `trim` but whitespace only strings
    // will have a length of 0, failing this check.
    return typeof str === 'string' && Boolean(str.trim());
  }

  /**
   * Throws an error if the passed string has whitespace. This is used by
   * class methods to be relatively consistent with the classList API.
   *
   * @private
   * @param  {string} str
   *         The string to check for whitespace.
   *
   * @throws {Error}
   *         Throws an error if there is whitespace in the string.
   */
  function throwIfWhitespace(str) {
    // str.indexOf instead of regex because str.indexOf is faster performance wise.
    if (str.indexOf(' ') >= 0) {
      throw new Error('class has illegal whitespace characters');
    }
  }

  /**
   * Whether the current DOM interface appears to be real (i.e. not simulated).
   *
   * @return {boolean}
   *         Will be `true` if the DOM appears to be real, `false` otherwise.
   */
  function isReal() {
    // Both document and window will never be undefined thanks to `global`.
    return document === window.document;
  }

  /**
   * Determines, via duck typing, whether or not a value is a DOM element.
   *
   * @param  {*} value
   *         The value to check.
   *
   * @return {boolean}
   *         Will be `true` if the value is a DOM element, `false` otherwise.
   */
  function isEl(value) {
    return isObject(value) && value.nodeType === 1;
  }

  /**
   * Determines if the current DOM is embedded in an iframe.
   *
   * @return {boolean}
   *         Will be `true` if the DOM is embedded in an iframe, `false`
   *         otherwise.
   */
  function isInFrame() {
    // We need a try/catch here because Safari will throw errors when attempting
    // to get either `parent` or `self`
    try {
      return window.parent !== window.self;
    } catch (x) {
      return true;
    }
  }

  /**
   * Creates functions to query the DOM using a given method.
   *
   * @private
   * @param   {string} method
   *          The method to create the query with.
   *
   * @return  {Function}
   *          The query method
   */
  function createQuerier(method) {
    return function (selector, context) {
      if (!isNonBlankString(selector)) {
        return document[method](null);
      }
      if (isNonBlankString(context)) {
        context = document.querySelector(context);
      }
      const ctx = isEl(context) ? context : document;
      return ctx[method] && ctx[method](selector);
    };
  }

  /**
   * Creates an element and applies properties, attributes, and inserts content.
   *
   * @param  {string} [tagName='div']
   *         Name of tag to be created.
   *
   * @param  {Object} [properties={}]
   *         Element properties to be applied.
   *
   * @param  {Object} [attributes={}]
   *         Element attributes to be applied.
   *
   * @param {ContentDescriptor} [content]
   *        A content descriptor object.
   *
   * @return {Element}
   *         The element that was created.
   */
  function createEl(tagName = 'div', properties = {}, attributes = {}, content) {
    const el = document.createElement(tagName);
    Object.getOwnPropertyNames(properties).forEach(function (propName) {
      const val = properties[propName];

      // Handle textContent since it's not supported everywhere and we have a
      // method for it.
      if (propName === 'textContent') {
        textContent(el, val);
      } else if (el[propName] !== val || propName === 'tabIndex') {
        el[propName] = val;
      }
    });
    Object.getOwnPropertyNames(attributes).forEach(function (attrName) {
      el.setAttribute(attrName, attributes[attrName]);
    });
    if (content) {
      appendContent(el, content);
    }
    return el;
  }

  /**
   * Injects text into an element, replacing any existing contents entirely.
   *
   * @param  {HTMLElement} el
   *         The element to add text content into
   *
   * @param  {string} text
   *         The text content to add.
   *
   * @return {Element}
   *         The element with added text content.
   */
  function textContent(el, text) {
    if (typeof el.textContent === 'undefined') {
      el.innerText = text;
    } else {
      el.textContent = text;
    }
    return el;
  }

  /**
   * Insert an element as the first child node of another
   *
   * @param {Element} child
   *        Element to insert
   *
   * @param {Element} parent
   *        Element to insert child into
   */
  function prependTo(child, parent) {
    if (parent.firstChild) {
      parent.insertBefore(child, parent.firstChild);
    } else {
      parent.appendChild(child);
    }
  }

  /**
   * Check if an element has a class name.
   *
   * @param  {Element} element
   *         Element to check
   *
   * @param  {string} classToCheck
   *         Class name to check for
   *
   * @return {boolean}
   *         Will be `true` if the element has a class, `false` otherwise.
   *
   * @throws {Error}
   *         Throws an error if `classToCheck` has white space.
   */
  function hasClass(element, classToCheck) {
    throwIfWhitespace(classToCheck);
    return element.classList.contains(classToCheck);
  }

  /**
   * Add a class name to an element.
   *
   * @param  {Element} element
   *         Element to add class name to.
   *
   * @param  {...string} classesToAdd
   *         One or more class name to add.
   *
   * @return {Element}
   *         The DOM element with the added class name.
   */
  function addClass(element, ...classesToAdd) {
    element.classList.add(...classesToAdd.reduce((prev, current) => prev.concat(current.split(/\s+/)), []));
    return element;
  }

  /**
   * Remove a class name from an element.
   *
   * @param  {Element} element
   *         Element to remove a class name from.
   *
   * @param  {...string} classesToRemove
   *         One or more class name to remove.
   *
   * @return {Element}
   *         The DOM element with class name removed.
   */
  function removeClass(element, ...classesToRemove) {
    // Protect in case the player gets disposed
    if (!element) {
      log.warn("removeClass was called with an element that doesn't exist");
      return null;
    }
    element.classList.remove(...classesToRemove.reduce((prev, current) => prev.concat(current.split(/\s+/)), []));
    return element;
  }

  /**
   * The callback definition for toggleClass.
   *
   * @callback module:dom~PredicateCallback
   * @param    {Element} element
   *           The DOM element of the Component.
   *
   * @param    {string} classToToggle
   *           The `className` that wants to be toggled
   *
   * @return   {boolean|undefined}
   *           If `true` is returned, the `classToToggle` will be added to the
   *           `element`. If `false`, the `classToToggle` will be removed from
   *           the `element`. If `undefined`, the callback will be ignored.
   */

  /**
   * Adds or removes a class name to/from an element depending on an optional
   * condition or the presence/absence of the class name.
   *
   * @param  {Element} element
   *         The element to toggle a class name on.
   *
   * @param  {string} classToToggle
   *         The class that should be toggled.
   *
   * @param  {boolean|module:dom~PredicateCallback} [predicate]
   *         See the return value for {@link module:dom~PredicateCallback}
   *
   * @return {Element}
   *         The element with a class that has been toggled.
   */
  function toggleClass(element, classToToggle, predicate) {
    if (typeof predicate === 'function') {
      predicate = predicate(element, classToToggle);
    }
    if (typeof predicate !== 'boolean') {
      predicate = undefined;
    }
    classToToggle.split(/\s+/).forEach(className => element.classList.toggle(className, predicate));
    return element;
  }

  /**
   * Apply attributes to an HTML element.
   *
   * @param {Element} el
   *        Element to add attributes to.
   *
   * @param {Object} [attributes]
   *        Attributes to be applied.
   */
  function setAttributes(el, attributes) {
    Object.getOwnPropertyNames(attributes).forEach(function (attrName) {
      const attrValue = attributes[attrName];
      if (attrValue === null || typeof attrValue === 'undefined' || attrValue === false) {
        el.removeAttribute(attrName);
      } else {
        el.setAttribute(attrName, attrValue === true ? '' : attrValue);
      }
    });
  }

  /**
   * Get an element's attribute values, as defined on the HTML tag.
   *
   * Attributes are not the same as properties. They're defined on the tag
   * or with setAttribute.
   *
   * @param  {Element} tag
   *         Element from which to get tag attributes.
   *
   * @return {Object}
   *         All attributes of the element. Boolean attributes will be `true` or
   *         `false`, others will be strings.
   */
  function getAttributes(tag) {
    const obj = {};

    // known boolean attributes
    // we can check for matching boolean properties, but not all browsers
    // and not all tags know about these attributes, so, we still want to check them manually
    const knownBooleans = ['autoplay', 'controls', 'playsinline', 'loop', 'muted', 'default', 'defaultMuted'];
    if (tag && tag.attributes && tag.attributes.length > 0) {
      const attrs = tag.attributes;
      for (let i = attrs.length - 1; i >= 0; i--) {
        const attrName = attrs[i].name;
        /** @type {boolean|string} */
        let attrVal = attrs[i].value;

        // check for known booleans
        // the matching element property will return a value for typeof
        if (knownBooleans.includes(attrName)) {
          // the value of an included boolean attribute is typically an empty
          // string ('') which would equal false if we just check for a false value.
          // we also don't want support bad code like autoplay='false'
          attrVal = attrVal !== null ? true : false;
        }
        obj[attrName] = attrVal;
      }
    }
    return obj;
  }

  /**
   * Get the value of an element's attribute.
   *
   * @param {Element} el
   *        A DOM element.
   *
   * @param {string} attribute
   *        Attribute to get the value of.
   *
   * @return {string}
   *         The value of the attribute.
   */
  function getAttribute(el, attribute) {
    return el.getAttribute(attribute);
  }

  /**
   * Set the value of an element's attribute.
   *
   * @param {Element} el
   *        A DOM element.
   *
   * @param {string} attribute
   *        Attribute to set.
   *
   * @param {string} value
   *        Value to set the attribute to.
   */
  function setAttribute(el, attribute, value) {
    el.setAttribute(attribute, value);
  }

  /**
   * Remove an element's attribute.
   *
   * @param {Element} el
   *        A DOM element.
   *
   * @param {string} attribute
   *        Attribute to remove.
   */
  function removeAttribute(el, attribute) {
    el.removeAttribute(attribute);
  }

  /**
   * Attempt to block the ability to select text.
   */
  function blockTextSelection() {
    document.body.focus();
    document.onselectstart = function () {
      return false;
    };
  }

  /**
   * Turn off text selection blocking.
   */
  function unblockTextSelection() {
    document.onselectstart = function () {
      return true;
    };
  }

  /**
   * Identical to the native `getBoundingClientRect` function, but ensures that
   * the method is supported at all (it is in all browsers we claim to support)
   * and that the element is in the DOM before continuing.
   *
   * This wrapper function also shims properties which are not provided by some
   * older browsers (namely, IE8).
   *
   * Additionally, some browsers do not support adding properties to a
   * `ClientRect`/`DOMRect` object; so, we shallow-copy it with the standard
   * properties (except `x` and `y` which are not widely supported). This helps
   * avoid implementations where keys are non-enumerable.
   *
   * @param  {Element} el
   *         Element whose `ClientRect` we want to calculate.
   *
   * @return {Object|undefined}
   *         Always returns a plain object - or `undefined` if it cannot.
   */
  function getBoundingClientRect(el) {
    if (el && el.getBoundingClientRect && el.parentNode) {
      const rect = el.getBoundingClientRect();
      const result = {};
      ['bottom', 'height', 'left', 'right', 'top', 'width'].forEach(k => {
        if (rect[k] !== undefined) {
          result[k] = rect[k];
        }
      });
      if (!result.height) {
        result.height = parseFloat(computedStyle(el, 'height'));
      }
      if (!result.width) {
        result.width = parseFloat(computedStyle(el, 'width'));
      }
      return result;
    }
  }

  /**
   * Represents the position of a DOM element on the page.
   *
   * @typedef  {Object} module:dom~Position
   *
   * @property {number} left
   *           Pixels to the left.
   *
   * @property {number} top
   *           Pixels from the top.
   */

  /**
   * Get the position of an element in the DOM.
   *
   * Uses `getBoundingClientRect` technique from John Resig.
   *
   * @see http://ejohn.org/blog/getboundingclientrect-is-awesome/
   *
   * @param  {Element} el
   *         Element from which to get offset.
   *
   * @return {module:dom~Position}
   *         The position of the element that was passed in.
   */
  function findPosition(el) {
    if (!el || el && !el.offsetParent) {
      return {
        left: 0,
        top: 0,
        width: 0,
        height: 0
      };
    }
    const width = el.offsetWidth;
    const height = el.offsetHeight;
    let left = 0;
    let top = 0;
    while (el.offsetParent && el !== document[FullscreenApi.fullscreenElement]) {
      left += el.offsetLeft;
      top += el.offsetTop;
      el = el.offsetParent;
    }
    return {
      left,
      top,
      width,
      height
    };
  }

  /**
   * Represents x and y coordinates for a DOM element or mouse pointer.
   *
   * @typedef  {Object} module:dom~Coordinates
   *
   * @property {number} x
   *           x coordinate in pixels
   *
   * @property {number} y
   *           y coordinate in pixels
   */

  /**
   * Get the pointer position within an element.
   *
   * The base on the coordinates are the bottom left of the element.
   *
   * @param  {Element} el
   *         Element on which to get the pointer position on.
   *
   * @param  {Event} event
   *         Event object.
   *
   * @return {module:dom~Coordinates}
   *         A coordinates object corresponding to the mouse position.
   *
   */
  function getPointerPosition(el, event) {
    const translated = {
      x: 0,
      y: 0
    };
    if (IS_IOS) {
      let item = el;
      while (item && item.nodeName.toLowerCase() !== 'html') {
        const transform = computedStyle(item, 'transform');
        if (/^matrix/.test(transform)) {
          const values = transform.slice(7, -1).split(/,\s/).map(Number);
          translated.x += values[4];
          translated.y += values[5];
        } else if (/^matrix3d/.test(transform)) {
          const values = transform.slice(9, -1).split(/,\s/).map(Number);
          translated.x += values[12];
          translated.y += values[13];
        }
        item = item.parentNode;
      }
    }
    const position = {};
    const boxTarget = findPosition(event.target);
    const box = findPosition(el);
    const boxW = box.width;
    const boxH = box.height;
    let offsetY = event.offsetY - (box.top - boxTarget.top);
    let offsetX = event.offsetX - (box.left - boxTarget.left);
    if (event.changedTouches) {
      offsetX = event.changedTouches[0].pageX - box.left;
      offsetY = event.changedTouches[0].pageY + box.top;
      if (IS_IOS) {
        offsetX -= translated.x;
        offsetY -= translated.y;
      }
    }
    position.y = 1 - Math.max(0, Math.min(1, offsetY / boxH));
    position.x = Math.max(0, Math.min(1, offsetX / boxW));
    return position;
  }

  /**
   * Determines, via duck typing, whether or not a value is a text node.
   *
   * @param  {*} value
   *         Check if this value is a text node.
   *
   * @return {boolean}
   *         Will be `true` if the value is a text node, `false` otherwise.
   */
  function isTextNode(value) {
    return isObject(value) && value.nodeType === 3;
  }

  /**
   * Empties the contents of an element.
   *
   * @param  {Element} el
   *         The element to empty children from
   *
   * @return {Element}
   *         The element with no children
   */
  function emptyEl(el) {
    while (el.firstChild) {
      el.removeChild(el.firstChild);
    }
    return el;
  }

  /**
   * This is a mixed value that describes content to be injected into the DOM
   * via some method. It can be of the following types:
   *
   * Type       | Description
   * -----------|-------------
   * `string`   | The value will be normalized into a text node.
   * `Element`  | The value will be accepted as-is.
   * `Text`     | A TextNode. The value will be accepted as-is.
   * `Array`    | A one-dimensional array of strings, elements, text nodes, or functions. These functions should return a string, element, or text node (any other return value, like an array, will be ignored).
   * `Function` | A function, which is expected to return a string, element, text node, or array - any of the other possible values described above. This means that a content descriptor could be a function that returns an array of functions, but those second-level functions must return strings, elements, or text nodes.
   *
   * @typedef {string|Element|Text|Array|Function} ContentDescriptor
   */

  /**
   * Normalizes content for eventual insertion into the DOM.
   *
   * This allows a wide range of content definition methods, but helps protect
   * from falling into the trap of simply writing to `innerHTML`, which could
   * be an XSS concern.
   *
   * The content for an element can be passed in multiple types and
   * combinations, whose behavior is as follows:
   *
   * @param {ContentDescriptor} content
   *        A content descriptor value.
   *
   * @return {Array}
   *         All of the content that was passed in, normalized to an array of
   *         elements or text nodes.
   */
  function normalizeContent(content) {
    // First, invoke content if it is a function. If it produces an array,
    // that needs to happen before normalization.
    if (typeof content === 'function') {
      content = content();
    }

    // Next up, normalize to an array, so one or many items can be normalized,
    // filtered, and returned.
    return (Array.isArray(content) ? content : [content]).map(value => {
      // First, invoke value if it is a function to produce a new value,
      // which will be subsequently normalized to a Node of some kind.
      if (typeof value === 'function') {
        value = value();
      }
      if (isEl(value) || isTextNode(value)) {
        return value;
      }
      if (typeof value === 'string' && /\S/.test(value)) {
        return document.createTextNode(value);
      }
    }).filter(value => value);
  }

  /**
   * Normalizes and appends content to an element.
   *
   * @param  {Element} el
   *         Element to append normalized content to.
   *
   * @param {ContentDescriptor} content
   *        A content descriptor value.
   *
   * @return {Element}
   *         The element with appended normalized content.
   */
  function appendContent(el, content) {
    normalizeContent(content).forEach(node => el.appendChild(node));
    return el;
  }

  /**
   * Normalizes and inserts content into an element; this is identical to
   * `appendContent()`, except it empties the element first.
   *
   * @param {Element} el
   *        Element to insert normalized content into.
   *
   * @param {ContentDescriptor} content
   *        A content descriptor value.
   *
   * @return {Element}
   *         The element with inserted normalized content.
   */
  function insertContent(el, content) {
    return appendContent(emptyEl(el), content);
  }

  /**
   * Check if an event was a single left click.
   *
   * @param  {MouseEvent} event
   *         Event object.
   *
   * @return {boolean}
   *         Will be `true` if a single left click, `false` otherwise.
   */
  function isSingleLeftClick(event) {
    // Note: if you create something draggable, be sure to
    // call it on both `mousedown` and `mousemove` event,
    // otherwise `mousedown` should be enough for a button

    if (event.button === undefined && event.buttons === undefined) {
      // Why do we need `buttons` ?
      // Because, middle mouse sometimes have this:
      // e.button === 0 and e.buttons === 4
      // Furthermore, we want to prevent combination click, something like
      // HOLD middlemouse then left click, that would be
      // e.button === 0, e.buttons === 5
      // just `button` is not gonna work

      // Alright, then what this block does ?
      // this is for chrome `simulate mobile devices`
      // I want to support this as well

      return true;
    }
    if (event.button === 0 && event.buttons === undefined) {
      // Touch screen, sometimes on some specific device, `buttons`
      // doesn't have anything (safari on ios, blackberry...)

      return true;
    }

    // `mouseup` event on a single left click has
    // `button` and `buttons` equal to 0
    if (event.type === 'mouseup' && event.button === 0 && event.buttons === 0) {
      return true;
    }
    if (event.button !== 0 || event.buttons !== 1) {
      // This is the reason we have those if else block above
      // if any special case we can catch and let it slide
      // we do it above, when get to here, this definitely
      // is-not-left-click

      return false;
    }
    return true;
  }

  /**
   * Finds a single DOM element matching `selector` within the optional
   * `context` of another DOM element (defaulting to `document`).
   *
   * @param  {string} selector
   *         A valid CSS selector, which will be passed to `querySelector`.
   *
   * @param  {Element|String} [context=document]
   *         A DOM element within which to query. Can also be a selector
   *         string in which case the first matching element will be used
   *         as context. If missing (or no element matches selector), falls
   *         back to `document`.
   *
   * @return {Element|null}
   *         The element that was found or null.
   */
  const $ = createQuerier('querySelector');

  /**
   * Finds a all DOM elements matching `selector` within the optional
   * `context` of another DOM element (defaulting to `document`).
   *
   * @param  {string} selector
   *         A valid CSS selector, which will be passed to `querySelectorAll`.
   *
   * @param  {Element|String} [context=document]
   *         A DOM element within which to query. Can also be a selector
   *         string in which case the first matching element will be used
   *         as context. If missing (or no element matches selector), falls
   *         back to `document`.
   *
   * @return {NodeList}
   *         A element list of elements that were found. Will be empty if none
   *         were found.
   *
   */
  const $$ = createQuerier('querySelectorAll');

  /**
   * A safe getComputedStyle.
   *
   * This is needed because in Firefox, if the player is loaded in an iframe with
   * `display:none`, then `getComputedStyle` returns `null`, so, we do a
   * null-check to make sure that the player doesn't break in these cases.
   *
   * @param    {Element} el
   *           The element you want the computed style of
   *
   * @param    {string} prop
   *           The property name you want
   *
   * @see      https://bugzilla.mozilla.org/show_bug.cgi?id=548397
   */
  function computedStyle(el, prop) {
    if (!el || !prop) {
      return '';
    }
    if (typeof window.getComputedStyle === 'function') {
      let computedStyleValue;
      try {
        computedStyleValue = window.getComputedStyle(el);
      } catch (e) {
        return '';
      }
      return computedStyleValue ? computedStyleValue.getPropertyValue(prop) || computedStyleValue[prop] : '';
    }
    return '';
  }

  /**
   * Copy document style sheets to another window.
   *
   * @param    {Window} win
   *           The window element you want to copy the document style sheets to.
   *
   */
  function copyStyleSheetsToWindow(win) {
    [...document.styleSheets].forEach(styleSheet => {
      try {
        const cssRules = [...styleSheet.cssRules].map(rule => rule.cssText).join('');
        const style = document.createElement('style');
        style.textContent = cssRules;
        win.document.head.appendChild(style);
      } catch (e) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.type = styleSheet.type;
        // For older Safari this has to be the string; on other browsers setting the MediaList works
        link.media = styleSheet.media.mediaText;
        link.href = styleSheet.href;
        win.document.head.appendChild(link);
      }
    });
  }

  var Dom = /*#__PURE__*/Object.freeze({
    __proto__: null,
    isReal: isReal,
    isEl: isEl,
    isInFrame: isInFrame,
    createEl: createEl,
    textContent: textContent,
    prependTo: prependTo,
    hasClass: hasClass,
    addClass: addClass,
    removeClass: removeClass,
    toggleClass: toggleClass,
    setAttributes: setAttributes,
    getAttributes: getAttributes,
    getAttribute: getAttribute,
    setAttribute: setAttribute,
    removeAttribute: removeAttribute,
    blockTextSelection: blockTextSelection,
    unblockTextSelection: unblockTextSelection,
    getBoundingClientRect: getBoundingClientRect,
    findPosition: findPosition,
    getPointerPosition: getPointerPosition,
    isTextNode: isTextNode,
    emptyEl: emptyEl,
    normalizeContent: normalizeContent,
    appendContent: appendContent,
    insertContent: insertContent,
    isSingleLeftClick: isSingleLeftClick,
    $: $,
    $$: $$,
    computedStyle: computedStyle,
    copyStyleSheetsToWindow: copyStyleSheetsToWindow
  });

  /**
   * @file setup.js - Functions for setting up a player without
   * user interaction based on the data-setup `attribute` of the video tag.
   *
   * @module setup
   */
  let _windowLoaded = false;
  let videojs$1;

  /**
   * Set up any tags that have a data-setup `attribute` when the player is started.
   */
  const autoSetup = function () {
    if (videojs$1.options.autoSetup === false) {
      return;
    }
    const vids = Array.prototype.slice.call(document.getElementsByTagName('video'));
    const audios = Array.prototype.slice.call(document.getElementsByTagName('audio'));
    const divs = Array.prototype.slice.call(document.getElementsByTagName('video-js'));
    const mediaEls = vids.concat(audios, divs);

    // Check if any media elements exist
    if (mediaEls && mediaEls.length > 0) {
      for (let i = 0, e = mediaEls.length; i < e; i++) {
        const mediaEl = mediaEls[i];

        // Check if element exists, has getAttribute func.
        if (mediaEl && mediaEl.getAttribute) {
          // Make sure this player hasn't already been set up.
          if (mediaEl.player === undefined) {
            const options = mediaEl.getAttribute('data-setup');

            // Check if data-setup attr exists.
            // We only auto-setup if they've added the data-setup attr.
            if (options !== null) {
              // Create new video.js instance.
              videojs$1(mediaEl);
            }
          }

          // If getAttribute isn't defined, we need to wait for the DOM.
        } else {
          autoSetupTimeout(1);
          break;
        }
      }

      // No videos were found, so keep looping unless page is finished loading.
    } else if (!_windowLoaded) {
      autoSetupTimeout(1);
    }
  };

  /**
   * Wait until the page is loaded before running autoSetup. This will be called in
   * autoSetup if `hasLoaded` returns false.
   *
   * @param {number} wait
   *        How long to wait in ms
   *
   * @param {module:videojs} [vjs]
   *        The videojs library function
   */
  function autoSetupTimeout(wait, vjs) {
    // Protect against breakage in non-browser environments
    if (!isReal()) {
      return;
    }
    if (vjs) {
      videojs$1 = vjs;
    }
    window.setTimeout(autoSetup, wait);
  }

  /**
   * Used to set the internal tracking of window loaded state to true.
   *
   * @private
   */
  function setWindowLoaded() {
    _windowLoaded = true;
    window.removeEventListener('load', setWindowLoaded);
  }
  if (isReal()) {
    if (document.readyState === 'complete') {
      setWindowLoaded();
    } else {
      /**
       * Listen for the load event on window, and set _windowLoaded to true.
       *
       * We use a standard event listener here to avoid incrementing the GUID
       * before any players are created.
       *
       * @listens load
       */
      window.addEventListener('load', setWindowLoaded);
    }
  }

  /**
   * @file stylesheet.js
   * @module stylesheet
   */

  /**
   * Create a DOM style element given a className for it.
   *
   * @param {string} className
   *        The className to add to the created style element.
   *
   * @return {Element}
   *         The element that was created.
   */
  const createStyleElement = function (className) {
    const style = document.createElement('style');
    style.className = className;
    return style;
  };

  /**
   * Add text to a DOM element.
   *
   * @param {Element} el
   *        The Element to add text content to.
   *
   * @param {string} content
   *        The text to add to the element.
   */
  const setTextContent = function (el, content) {
    if (el.styleSheet) {
      el.styleSheet.cssText = content;
    } else {
      el.textContent = content;
    }
  };

  /**
   * @file dom-data.js
   * @module dom-data
   */

  /**
   * Element Data Store.
   *
   * Allows for binding data to an element without putting it directly on the
   * element. Ex. Event listeners are stored here.
   * (also from jsninja.com, slightly modified and updated for closure compiler)
   *
   * @type {Object}
   * @private
   */
  var DomData = new WeakMap();

  /**
   * @file guid.js
   * @module guid
   */

  // Default value for GUIDs. This allows us to reset the GUID counter in tests.
  //
  // The initial GUID is 3 because some users have come to rely on the first
  // default player ID ending up as `vjs_video_3`.
  //
  // See: https://github.com/videojs/video.js/pull/6216
  const _initialGuid = 3;

  /**
   * Unique ID for an element or function
   *
   * @type {Number}
   */
  let _guid = _initialGuid;

  /**
   * Get a unique auto-incrementing ID by number that has not been returned before.
   *
   * @return {number}
   *         A new unique ID.
   */
  function newGUID() {
    return _guid++;
  }

  /**
   * @file events.js. An Event System (John Resig - Secrets of a JS Ninja http://jsninja.com/)
   * (Original book version wasn't completely usable, so fixed some things and made Closure Compiler compatible)
   * This should work very similarly to jQuery's events, however it's based off the book version which isn't as
   * robust as jquery's, so there's probably some differences.
   *
   * @file events.js
   * @module events
   */

  /**
   * Clean up the listener cache and dispatchers
   *
   * @param {Element|Object} elem
   *        Element to clean up
   *
   * @param {string} type
   *        Type of event to clean up
   */
  function _cleanUpEvents(elem, type) {
    if (!DomData.has(elem)) {
      return;
    }
    const data = DomData.get(elem);

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
    if (Object.getOwnPropertyNames(data.handlers).length <= 0) {
      delete data.handlers;
      delete data.dispatcher;
      delete data.disabled;
    }

    // Finally remove the element data if there is no data left
    if (Object.getOwnPropertyNames(data).length === 0) {
      DomData.delete(elem);
    }
  }

  /**
   * Loops through an array of event types and calls the requested method for each type.
   *
   * @param {Function} fn
   *        The event method we want to use.
   *
   * @param {Element|Object} elem
   *        Element or object to bind listeners to
   *
   * @param {string} type
   *        Type of event to bind to.
   *
   * @param {Function} callback
   *        Event listener.
   */
  function _handleMultipleEvents(fn, elem, types, callback) {
    types.forEach(function (type) {
      // Call the event method for each one of the types
      fn(elem, type, callback);
    });
  }

  /**
   * Fix a native event to have standard property values
   *
   * @param {Object} event
   *        Event object to fix.
   *
   * @return {Object}
   *         Fixed event object.
   */
  function fixEvent(event) {
    if (event.fixed_) {
      return event;
    }
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
    if (!event || !event.isPropagationStopped || !event.isImmediatePropagationStopped) {
      const old = event || window.event;
      event = {};
      // Clone the old object so that we can modify the values event = {};
      // IE8 Doesn't like when you mess with native event properties
      // Firefox returns false for event.hasOwnProperty('type') and other props
      //  which makes copying more difficult.
      // TODO: Probably best to create a whitelist of event props
      for (const key in old) {
        // Safari 6.0.3 warns you if you try to copy deprecated layerX/Y
        // Chrome warns you if you try to copy deprecated keyboardEvent.keyLocation
        // and webkitMovementX/Y
        // Lighthouse complains if Event.path is copied
        if (key !== 'layerX' && key !== 'layerY' && key !== 'keyLocation' && key !== 'webkitMovementX' && key !== 'webkitMovementY' && key !== 'path') {
          // Chrome 32+ warns if you try to copy deprecated returnValue, but
          // we still want to if preventDefault isn't supported (IE8).
          if (!(key === 'returnValue' && old.preventDefault)) {
            event[key] = old[key];
          }
        }
      }

      // The event occurred on this element
      if (!event.target) {
        event.target = event.srcElement || document;
      }

      // Handle which other element the event is related to
      if (!event.relatedTarget) {
        event.relatedTarget = event.fromElement === event.target ? event.toElement : event.fromElement;
      }

      // Stop the default browser action
      event.preventDefault = function () {
        if (old.preventDefault) {
          old.preventDefault();
        }
        event.returnValue = false;
        old.returnValue = false;
        event.defaultPrevented = true;
      };
      event.defaultPrevented = false;

      // Stop the event from bubbling
      event.stopPropagation = function () {
        if (old.stopPropagation) {
          old.stopPropagation();
        }
        event.cancelBubble = true;
        old.cancelBubble = true;
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
      if (event.clientX !== null && event.clientX !== undefined) {
        const doc = document.documentElement;
        const body = document.body;
        event.pageX = event.clientX + (doc && doc.scrollLeft || body && body.scrollLeft || 0) - (doc && doc.clientLeft || body && body.clientLeft || 0);
        event.pageY = event.clientY + (doc && doc.scrollTop || body && body.scrollTop || 0) - (doc && doc.clientTop || body && body.clientTop || 0);
      }

      // Handle key presses
      event.which = event.charCode || event.keyCode;

      // Fix button for mouse clicks:
      // 0 == left; 1 == middle; 2 == right
      if (event.button !== null && event.button !== undefined) {
        // The following is disabled because it does not pass videojs-standard
        // and... yikes.
        /* eslint-disable */
        event.button = event.button & 1 ? 0 : event.button & 4 ? 1 : event.button & 2 ? 2 : 0;
        /* eslint-enable */
      }
    }

    event.fixed_ = true;
    // Returns fixed-up instance
    return event;
  }

  /**
   * Whether passive event listeners are supported
   */
  let _supportsPassive;
  const supportsPassive = function () {
    if (typeof _supportsPassive !== 'boolean') {
      _supportsPassive = false;
      try {
        const opts = Object.defineProperty({}, 'passive', {
          get() {
            _supportsPassive = true;
          }
        });
        window.addEventListener('test', null, opts);
        window.removeEventListener('test', null, opts);
      } catch (e) {
        // disregard
      }
    }
    return _supportsPassive;
  };

  /**
   * Touch events Chrome expects to be passive
   */
  const passiveEvents = ['touchstart', 'touchmove'];

  /**
   * Add an event listener to element
   * It stores the handler function in a separate cache object
   * and adds a generic handler to the element's event,
   * along with a unique id (guid) to the element.
   *
   * @param {Element|Object} elem
   *        Element or object to bind listeners to
   *
   * @param {string|string[]} type
   *        Type of event to bind to.
   *
   * @param {Function} fn
   *        Event listener.
   */
  function on(elem, type, fn) {
    if (Array.isArray(type)) {
      return _handleMultipleEvents(on, elem, type, fn);
    }
    if (!DomData.has(elem)) {
      DomData.set(elem, {});
    }
    const data = DomData.get(elem);

    // We need a place to store all our handler data
    if (!data.handlers) {
      data.handlers = {};
    }
    if (!data.handlers[type]) {
      data.handlers[type] = [];
    }
    if (!fn.guid) {
      fn.guid = newGUID();
    }
    data.handlers[type].push(fn);
    if (!data.dispatcher) {
      data.disabled = false;
      data.dispatcher = function (event, hash) {
        if (data.disabled) {
          return;
        }
        event = fixEvent(event);
        const handlers = data.handlers[event.type];
        if (handlers) {
          // Copy handlers so if handlers are added/removed during the process it doesn't throw everything off.
          const handlersCopy = handlers.slice(0);
          for (let m = 0, n = handlersCopy.length; m < n; m++) {
            if (event.isImmediatePropagationStopped()) {
              break;
            } else {
              try {
                handlersCopy[m].call(elem, event, hash);
              } catch (e) {
                log.error(e);
              }
            }
          }
        }
      };
    }
    if (data.handlers[type].length === 1) {
      if (elem.addEventListener) {
        let options = false;
        if (supportsPassive() && passiveEvents.indexOf(type) > -1) {
          options = {
            passive: true
          };
        }
        elem.addEventListener(type, data.dispatcher, options);
      } else if (elem.attachEvent) {
        elem.attachEvent('on' + type, data.dispatcher);
      }
    }
  }

  /**
   * Removes event listeners from an element
   *
   * @param {Element|Object} elem
   *        Object to remove listeners from.
   *
   * @param {string|string[]} [type]
   *        Type of listener to remove. Don't include to remove all events from element.
   *
   * @param {Function} [fn]
   *        Specific listener to remove. Don't include to remove listeners for an event
   *        type.
   */
  function off(elem, type, fn) {
    // Don't want to add a cache object through getElData if not needed
    if (!DomData.has(elem)) {
      return;
    }
    const data = DomData.get(elem);

    // If no events exist, nothing to unbind
    if (!data.handlers) {
      return;
    }
    if (Array.isArray(type)) {
      return _handleMultipleEvents(off, elem, type, fn);
    }

    // Utility function
    const removeType = function (el, t) {
      data.handlers[t] = [];
      _cleanUpEvents(el, t);
    };

    // Are we removing all bound events?
    if (type === undefined) {
      for (const t in data.handlers) {
        if (Object.prototype.hasOwnProperty.call(data.handlers || {}, t)) {
          removeType(elem, t);
        }
      }
      return;
    }
    const handlers = data.handlers[type];

    // If no handlers exist, nothing to unbind
    if (!handlers) {
      return;
    }

    // If no listener was provided, remove all listeners for type
    if (!fn) {
      removeType(elem, type);
      return;
    }

    // We're only removing a single handler
    if (fn.guid) {
      for (let n = 0; n < handlers.length; n++) {
        if (handlers[n].guid === fn.guid) {
          handlers.splice(n--, 1);
        }
      }
    }
    _cleanUpEvents(elem, type);
  }

  /**
   * Trigger an event for an element
   *
   * @param {Element|Object} elem
   *        Element to trigger an event on
   *
   * @param {EventTarget~Event|string} event
   *        A string (the type) or an event object with a type attribute
   *
   * @param {Object} [hash]
   *        data hash to pass along with the event
   *
   * @return {boolean|undefined}
   *         Returns the opposite of `defaultPrevented` if default was
   *         prevented. Otherwise, returns `undefined`
   */
  function trigger(elem, event, hash) {
    // Fetches element data and a reference to the parent (for bubbling).
    // Don't want to add a data object to cache for every parent,
    // so checking hasElData first.
    const elemData = DomData.has(elem) ? DomData.get(elem) : {};
    const parent = elem.parentNode || elem.ownerDocument;
    // type = event.type || event,
    // handler;

    // If an event name was passed as a string, creates an event out of it
    if (typeof event === 'string') {
      event = {
        type: event,
        target: elem
      };
    } else if (!event.target) {
      event.target = elem;
    }

    // Normalizes the event properties.
    event = fixEvent(event);

    // If the passed element has a dispatcher, executes the established handlers.
    if (elemData.dispatcher) {
      elemData.dispatcher.call(elem, event, hash);
    }

    // Unless explicitly stopped or the event does not bubble (e.g. media events)
    // recursively calls this function to bubble the event up the DOM.
    if (parent && !event.isPropagationStopped() && event.bubbles === true) {
      trigger.call(null, parent, event, hash);

      // If at the top of the DOM, triggers the default action unless disabled.
    } else if (!parent && !event.defaultPrevented && event.target && event.target[event.type]) {
      if (!DomData.has(event.target)) {
        DomData.set(event.target, {});
      }
      const targetData = DomData.get(event.target);

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
  }

  /**
   * Trigger a listener only once for an event.
   *
   * @param {Element|Object} elem
   *        Element or object to bind to.
   *
   * @param {string|string[]} type
   *        Name/type of event
   *
   * @param {Event~EventListener} fn
   *        Event listener function
   */
  function one(elem, type, fn) {
    if (Array.isArray(type)) {
      return _handleMultipleEvents(one, elem, type, fn);
    }
    const func = function () {
      off(elem, type, func);
      fn.apply(this, arguments);
    };

    // copy the guid to the new function so it can removed using the original function's ID
    func.guid = fn.guid = fn.guid || newGUID();
    on(elem, type, func);
  }

  /**
   * Trigger a listener only once and then turn if off for all
   * configured events
   *
   * @param {Element|Object} elem
   *        Element or object to bind to.
   *
   * @param {string|string[]} type
   *        Name/type of event
   *
   * @param {Event~EventListener} fn
   *        Event listener function
   */
  function any(elem, type, fn) {
    const func = function () {
      off(elem, type, func);
      fn.apply(this, arguments);
    };

    // copy the guid to the new function so it can removed using the original function's ID
    func.guid = fn.guid = fn.guid || newGUID();

    // multiple ons, but one off for everything
    on(elem, type, func);
  }

  var Events = /*#__PURE__*/Object.freeze({
    __proto__: null,
    fixEvent: fixEvent,
    on: on,
    off: off,
    trigger: trigger,
    one: one,
    any: any
  });

  /**
   * @file fn.js
   * @module fn
   */
  const UPDATE_REFRESH_INTERVAL = 30;

  /**
   * A private, internal-only function for changing the context of a function.
   *
   * It also stores a unique id on the function so it can be easily removed from
   * events.
   *
   * @private
   * @function
   * @param    {*} context
   *           The object to bind as scope.
   *
   * @param    {Function} fn
   *           The function to be bound to a scope.
   *
   * @param    {number} [uid]
   *           An optional unique ID for the function to be set
   *
   * @return   {Function}
   *           The new function that will be bound into the context given
   */
  const bind_ = function (context, fn, uid) {
    // Make sure the function has a unique ID
    if (!fn.guid) {
      fn.guid = newGUID();
    }

    // Create the new function that changes the context
    const bound = fn.bind(context);

    // Allow for the ability to individualize this function
    // Needed in the case where multiple objects might share the same prototype
    // IF both items add an event listener with the same function, then you try to remove just one
    // it will remove both because they both have the same guid.
    // when using this, you need to use the bind method when you remove the listener as well.
    // currently used in text tracks
    bound.guid = uid ? uid + '_' + fn.guid : fn.guid;
    return bound;
  };

  /**
   * Wraps the given function, `fn`, with a new function that only invokes `fn`
   * at most once per every `wait` milliseconds.
   *
   * @function
   * @param    {Function} fn
   *           The function to be throttled.
   *
   * @param    {number}   wait
   *           The number of milliseconds by which to throttle.
   *
   * @return   {Function}
   */
  const throttle = function (fn, wait) {
    let last = window.performance.now();
    const throttled = function (...args) {
      const now = window.performance.now();
      if (now - last >= wait) {
        fn(...args);
        last = now;
      }
    };
    return throttled;
  };

  /**
   * Creates a debounced function that delays invoking `func` until after `wait`
   * milliseconds have elapsed since the last time the debounced function was
   * invoked.
   *
   * Inspired by lodash and underscore implementations.
   *
   * @function
   * @param    {Function} func
   *           The function to wrap with debounce behavior.
   *
   * @param    {number} wait
   *           The number of milliseconds to wait after the last invocation.
   *
   * @param    {boolean} [immediate]
   *           Whether or not to invoke the function immediately upon creation.
   *
   * @param    {Object} [context=window]
   *           The "context" in which the debounced function should debounce. For
   *           example, if this function should be tied to a Video.js player,
   *           the player can be passed here. Alternatively, defaults to the
   *           global `window` object.
   *
   * @return   {Function}
   *           A debounced function.
   */
  const debounce = function (func, wait, immediate, context = window) {
    let timeout;
    const cancel = () => {
      context.clearTimeout(timeout);
      timeout = null;
    };

    /* eslint-disable consistent-this */
    const debounced = function () {
      const self = this;
      const args = arguments;
      let later = function () {
        timeout = null;
        later = null;
        if (!immediate) {
          func.apply(self, args);
        }
      };
      if (!timeout && immediate) {
        func.apply(self, args);
      }
      context.clearTimeout(timeout);
      timeout = context.setTimeout(later, wait);
    };
    /* eslint-enable consistent-this */

    debounced.cancel = cancel;
    return debounced;
  };

  var Fn = /*#__PURE__*/Object.freeze({
    __proto__: null,
    UPDATE_REFRESH_INTERVAL: UPDATE_REFRESH_INTERVAL,
    bind_: bind_,
    throttle: throttle,
    debounce: debounce
  });

  /**
   * @file src/js/event-target.js
   */
  let EVENT_MAP;

  /**
   * `EventTarget` is a class that can have the same API as the DOM `EventTarget`. It
   * adds shorthand functions that wrap around lengthy functions. For example:
   * the `on` function is a wrapper around `addEventListener`.
   *
   * @see [EventTarget Spec]{@link https://www.w3.org/TR/DOM-Level-2-Events/events.html#Events-EventTarget}
   * @class EventTarget
   */
  class EventTarget {
    /**
     * Adds an `event listener` to an instance of an `EventTarget`. An `event listener` is a
     * function that will get called when an event with a certain name gets triggered.
     *
     * @param {string|string[]} type
     *        An event name or an array of event names.
     *
     * @param {Function} fn
     *        The function to call with `EventTarget`s
     */
    on(type, fn) {
      // Remove the addEventListener alias before calling Events.on
      // so we don't get into an infinite type loop
      const ael = this.addEventListener;
      this.addEventListener = () => {};
      on(this, type, fn);
      this.addEventListener = ael;
    }
    /**
     * Removes an `event listener` for a specific event from an instance of `EventTarget`.
     * This makes it so that the `event listener` will no longer get called when the
     * named event happens.
     *
     * @param {string|string[]} type
     *        An event name or an array of event names.
     *
     * @param {Function} fn
     *        The function to remove.
     */
    off(type, fn) {
      off(this, type, fn);
    }
    /**
     * This function will add an `event listener` that gets triggered only once. After the
     * first trigger it will get removed. This is like adding an `event listener`
     * with {@link EventTarget#on} that calls {@link EventTarget#off} on itself.
     *
     * @param {string|string[]} type
     *        An event name or an array of event names.
     *
     * @param {Function} fn
     *        The function to be called once for each event name.
     */
    one(type, fn) {
      // Remove the addEventListener aliasing Events.on
      // so we don't get into an infinite type loop
      const ael = this.addEventListener;
      this.addEventListener = () => {};
      one(this, type, fn);
      this.addEventListener = ael;
    }
    /**
     * This function will add an `event listener` that gets triggered only once and is
     * removed from all events. This is like adding an array of `event listener`s
     * with {@link EventTarget#on} that calls {@link EventTarget#off} on all events the
     * first time it is triggered.
     *
     * @param {string|string[]} type
     *        An event name or an array of event names.
     *
     * @param {Function} fn
     *        The function to be called once for each event name.
     */
    any(type, fn) {
      // Remove the addEventListener aliasing Events.on
      // so we don't get into an infinite type loop
      const ael = this.addEventListener;
      this.addEventListener = () => {};
      any(this, type, fn);
      this.addEventListener = ael;
    }
    /**
     * This function causes an event to happen. This will then cause any `event listeners`
     * that are waiting for that event, to get called. If there are no `event listeners`
     * for an event then nothing will happen.
     *
     * If the name of the `Event` that is being triggered is in `EventTarget.allowedEvents_`.
     * Trigger will also call the `on` + `uppercaseEventName` function.
     *
     * Example:
     * 'click' is in `EventTarget.allowedEvents_`, so, trigger will attempt to call
     * `onClick` if it exists.
     *
     * @param {string|EventTarget~Event|Object} event
     *        The name of the event, an `Event`, or an object with a key of type set to
     *        an event name.
     */
    trigger(event) {
      const type = event.type || event;

      // deprecation
      // In a future version we should default target to `this`
      // similar to how we default the target to `elem` in
      // `Events.trigger`. Right now the default `target` will be
      // `document` due to the `Event.fixEvent` call.
      if (typeof event === 'string') {
        event = {
          type
        };
      }
      event = fixEvent(event);
      if (this.allowedEvents_[type] && this['on' + type]) {
        this['on' + type](event);
      }
      trigger(this, event);
    }
    queueTrigger(event) {
      // only set up EVENT_MAP if it'll be used
      if (!EVENT_MAP) {
        EVENT_MAP = new Map();
      }
      const type = event.type || event;
      let map = EVENT_MAP.get(this);
      if (!map) {
        map = new Map();
        EVENT_MAP.set(this, map);
      }
      const oldTimeout = map.get(type);
      map.delete(type);
      window.clearTimeout(oldTimeout);
      const timeout = window.setTimeout(() => {
        map.delete(type);
        // if we cleared out all timeouts for the current target, delete its map
        if (map.size === 0) {
          map = null;
          EVENT_MAP.delete(this);
        }
        this.trigger(event);
      }, 0);
      map.set(type, timeout);
    }
  }

  /**
   * A Custom DOM event.
   *
   * @typedef {CustomEvent} Event
   * @see [Properties]{@link https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent}
   */

  /**
   * All event listeners should follow the following format.
   *
   * @callback EventTarget~EventListener
   * @this {EventTarget}
   *
   * @param {Event} event
   *        the event that triggered this function
   *
   * @param {Object} [hash]
   *        hash of data sent during the event
   */

  /**
   * An object containing event names as keys and booleans as values.
   *
   * > NOTE: If an event name is set to a true value here {@link EventTarget#trigger}
   *         will have extra functionality. See that function for more information.
   *
   * @property EventTarget.prototype.allowedEvents_
   * @private
   */
  EventTarget.prototype.allowedEvents_ = {};

  /**
   * An alias of {@link EventTarget#on}. Allows `EventTarget` to mimic
   * the standard DOM API.
   *
   * @function
   * @see {@link EventTarget#on}
   */
  EventTarget.prototype.addEventListener = EventTarget.prototype.on;

  /**
   * An alias of {@link EventTarget#off}. Allows `EventTarget` to mimic
   * the standard DOM API.
   *
   * @function
   * @see {@link EventTarget#off}
   */
  EventTarget.prototype.removeEventListener = EventTarget.prototype.off;

  /**
   * An alias of {@link EventTarget#trigger}. Allows `EventTarget` to mimic
   * the standard DOM API.
   *
   * @function
   * @see {@link EventTarget#trigger}
   */
  EventTarget.prototype.dispatchEvent = EventTarget.prototype.trigger;

  /**
   * @file mixins/evented.js
   * @module evented
   */
  const objName = obj => {
    if (typeof obj.name === 'function') {
      return obj.name();
    }
    if (typeof obj.name === 'string') {
      return obj.name;
    }
    if (obj.name_) {
      return obj.name_;
    }
    if (obj.constructor && obj.constructor.name) {
      return obj.constructor.name;
    }
    return typeof obj;
  };

  /**
   * Returns whether or not an object has had the evented mixin applied.
   *
   * @param  {Object} object
   *         An object to test.
   *
   * @return {boolean}
   *         Whether or not the object appears to be evented.
   */
  const isEvented = object => object instanceof EventTarget || !!object.eventBusEl_ && ['on', 'one', 'off', 'trigger'].every(k => typeof object[k] === 'function');

  /**
   * Adds a callback to run after the evented mixin applied.
   *
   * @param  {Object} target
   *         An object to Add
   * @param  {Function} callback
   *         The callback to run.
   */
  const addEventedCallback = (target, callback) => {
    if (isEvented(target)) {
      callback();
    } else {
      if (!target.eventedCallbacks) {
        target.eventedCallbacks = [];
      }
      target.eventedCallbacks.push(callback);
    }
  };

  /**
   * Whether a value is a valid event type - non-empty string or array.
   *
   * @private
   * @param  {string|Array} type
   *         The type value to test.
   *
   * @return {boolean}
   *         Whether or not the type is a valid event type.
   */
  const isValidEventType = type =>
  // The regex here verifies that the `type` contains at least one non-
  // whitespace character.
  typeof type === 'string' && /\S/.test(type) || Array.isArray(type) && !!type.length;

  /**
   * Validates a value to determine if it is a valid event target. Throws if not.
   *
   * @private
   * @throws {Error}
   *         If the target does not appear to be a valid event target.
   *
   * @param  {Object} target
   *         The object to test.
   *
   * @param  {Object} obj
   *         The evented object we are validating for
   *
   * @param  {string} fnName
   *         The name of the evented mixin function that called this.
   */
  const validateTarget = (target, obj, fnName) => {
    if (!target || !target.nodeName && !isEvented(target)) {
      throw new Error(`Invalid target for ${objName(obj)}#${fnName}; must be a DOM node or evented object.`);
    }
  };

  /**
   * Validates a value to determine if it is a valid event target. Throws if not.
   *
   * @private
   * @throws {Error}
   *         If the type does not appear to be a valid event type.
   *
   * @param  {string|Array} type
   *         The type to test.
   *
   * @param  {Object} obj
  *         The evented object we are validating for
   *
   * @param  {string} fnName
   *         The name of the evented mixin function that called this.
   */
  const validateEventType = (type, obj, fnName) => {
    if (!isValidEventType(type)) {
      throw new Error(`Invalid event type for ${objName(obj)}#${fnName}; must be a non-empty string or array.`);
    }
  };

  /**
   * Validates a value to determine if it is a valid listener. Throws if not.
   *
   * @private
   * @throws {Error}
   *         If the listener is not a function.
   *
   * @param  {Function} listener
   *         The listener to test.
   *
   * @param  {Object} obj
   *         The evented object we are validating for
   *
   * @param  {string} fnName
   *         The name of the evented mixin function that called this.
   */
  const validateListener = (listener, obj, fnName) => {
    if (typeof listener !== 'function') {
      throw new Error(`Invalid listener for ${objName(obj)}#${fnName}; must be a function.`);
    }
  };

  /**
   * Takes an array of arguments given to `on()` or `one()`, validates them, and
   * normalizes them into an object.
   *
   * @private
   * @param  {Object} self
   *         The evented object on which `on()` or `one()` was called. This
   *         object will be bound as the `this` value for the listener.
   *
   * @param  {Array} args
   *         An array of arguments passed to `on()` or `one()`.
   *
   * @param  {string} fnName
   *         The name of the evented mixin function that called this.
   *
   * @return {Object}
   *         An object containing useful values for `on()` or `one()` calls.
   */
  const normalizeListenArgs = (self, args, fnName) => {
    // If the number of arguments is less than 3, the target is always the
    // evented object itself.
    const isTargetingSelf = args.length < 3 || args[0] === self || args[0] === self.eventBusEl_;
    let target;
    let type;
    let listener;
    if (isTargetingSelf) {
      target = self.eventBusEl_;

      // Deal with cases where we got 3 arguments, but we are still listening to
      // the evented object itself.
      if (args.length >= 3) {
        args.shift();
      }
      [type, listener] = args;
    } else {
      [target, type, listener] = args;
    }
    validateTarget(target, self, fnName);
    validateEventType(type, self, fnName);
    validateListener(listener, self, fnName);
    listener = bind_(self, listener);
    return {
      isTargetingSelf,
      target,
      type,
      listener
    };
  };

  /**
   * Adds the listener to the event type(s) on the target, normalizing for
   * the type of target.
   *
   * @private
   * @param  {Element|Object} target
   *         A DOM node or evented object.
   *
   * @param  {string} method
   *         The event binding method to use ("on" or "one").
   *
   * @param  {string|Array} type
   *         One or more event type(s).
   *
   * @param  {Function} listener
   *         A listener function.
   */
  const listen = (target, method, type, listener) => {
    validateTarget(target, target, method);
    if (target.nodeName) {
      Events[method](target, type, listener);
    } else {
      target[method](type, listener);
    }
  };

  /**
   * Contains methods that provide event capabilities to an object which is passed
   * to {@link module:evented|evented}.
   *
   * @mixin EventedMixin
   */
  const EventedMixin = {
    /**
     * Add a listener to an event (or events) on this object or another evented
     * object.
     *
     * @param  {string|Array|Element|Object} targetOrType
     *         If this is a string or array, it represents the event type(s)
     *         that will trigger the listener.
     *
     *         Another evented object can be passed here instead, which will
     *         cause the listener to listen for events on _that_ object.
     *
     *         In either case, the listener's `this` value will be bound to
     *         this object.
     *
     * @param  {string|Array|Function} typeOrListener
     *         If the first argument was a string or array, this should be the
     *         listener function. Otherwise, this is a string or array of event
     *         type(s).
     *
     * @param  {Function} [listener]
     *         If the first argument was another evented object, this will be
     *         the listener function.
     */
    on(...args) {
      const {
        isTargetingSelf,
        target,
        type,
        listener
      } = normalizeListenArgs(this, args, 'on');
      listen(target, 'on', type, listener);

      // If this object is listening to another evented object.
      if (!isTargetingSelf) {
        // If this object is disposed, remove the listener.
        const removeListenerOnDispose = () => this.off(target, type, listener);

        // Use the same function ID as the listener so we can remove it later it
        // using the ID of the original listener.
        removeListenerOnDispose.guid = listener.guid;

        // Add a listener to the target's dispose event as well. This ensures
        // that if the target is disposed BEFORE this object, we remove the
        // removal listener that was just added. Otherwise, we create a memory leak.
        const removeRemoverOnTargetDispose = () => this.off('dispose', removeListenerOnDispose);

        // Use the same function ID as the listener so we can remove it later
        // it using the ID of the original listener.
        removeRemoverOnTargetDispose.guid = listener.guid;
        listen(this, 'on', 'dispose', removeListenerOnDispose);
        listen(target, 'on', 'dispose', removeRemoverOnTargetDispose);
      }
    },
    /**
     * Add a listener to an event (or events) on this object or another evented
     * object. The listener will be called once per event and then removed.
     *
     * @param  {string|Array|Element|Object} targetOrType
     *         If this is a string or array, it represents the event type(s)
     *         that will trigger the listener.
     *
     *         Another evented object can be passed here instead, which will
     *         cause the listener to listen for events on _that_ object.
     *
     *         In either case, the listener's `this` value will be bound to
     *         this object.
     *
     * @param  {string|Array|Function} typeOrListener
     *         If the first argument was a string or array, this should be the
     *         listener function. Otherwise, this is a string or array of event
     *         type(s).
     *
     * @param  {Function} [listener]
     *         If the first argument was another evented object, this will be
     *         the listener function.
     */
    one(...args) {
      const {
        isTargetingSelf,
        target,
        type,
        listener
      } = normalizeListenArgs(this, args, 'one');

      // Targeting this evented object.
      if (isTargetingSelf) {
        listen(target, 'one', type, listener);

        // Targeting another evented object.
      } else {
        // TODO: This wrapper is incorrect! It should only
        //       remove the wrapper for the event type that called it.
        //       Instead all listeners are removed on the first trigger!
        //       see https://github.com/videojs/video.js/issues/5962
        const wrapper = (...largs) => {
          this.off(target, type, wrapper);
          listener.apply(null, largs);
        };

        // Use the same function ID as the listener so we can remove it later
        // it using the ID of the original listener.
        wrapper.guid = listener.guid;
        listen(target, 'one', type, wrapper);
      }
    },
    /**
     * Add a listener to an event (or events) on this object or another evented
     * object. The listener will only be called once for the first event that is triggered
     * then removed.
     *
     * @param  {string|Array|Element|Object} targetOrType
     *         If this is a string or array, it represents the event type(s)
     *         that will trigger the listener.
     *
     *         Another evented object can be passed here instead, which will
     *         cause the listener to listen for events on _that_ object.
     *
     *         In either case, the listener's `this` value will be bound to
     *         this object.
     *
     * @param  {string|Array|Function} typeOrListener
     *         If the first argument was a string or array, this should be the
     *         listener function. Otherwise, this is a string or array of event
     *         type(s).
     *
     * @param  {Function} [listener]
     *         If the first argument was another evented object, this will be
     *         the listener function.
     */
    any(...args) {
      const {
        isTargetingSelf,
        target,
        type,
        listener
      } = normalizeListenArgs(this, args, 'any');

      // Targeting this evented object.
      if (isTargetingSelf) {
        listen(target, 'any', type, listener);

        // Targeting another evented object.
      } else {
        const wrapper = (...largs) => {
          this.off(target, type, wrapper);
          listener.apply(null, largs);
        };

        // Use the same function ID as the listener so we can remove it later
        // it using the ID of the original listener.
        wrapper.guid = listener.guid;
        listen(target, 'any', type, wrapper);
      }
    },
    /**
     * Removes listener(s) from event(s) on an evented object.
     *
     * @param  {string|Array|Element|Object} [targetOrType]
     *         If this is a string or array, it represents the event type(s).
     *
     *         Another evented object can be passed here instead, in which case
     *         ALL 3 arguments are _required_.
     *
     * @param  {string|Array|Function} [typeOrListener]
     *         If the first argument was a string or array, this may be the
     *         listener function. Otherwise, this is a string or array of event
     *         type(s).
     *
     * @param  {Function} [listener]
     *         If the first argument was another evented object, this will be
     *         the listener function; otherwise, _all_ listeners bound to the
     *         event type(s) will be removed.
     */
    off(targetOrType, typeOrListener, listener) {
      // Targeting this evented object.
      if (!targetOrType || isValidEventType(targetOrType)) {
        off(this.eventBusEl_, targetOrType, typeOrListener);

        // Targeting another evented object.
      } else {
        const target = targetOrType;
        const type = typeOrListener;

        // Fail fast and in a meaningful way!
        validateTarget(target, this, 'off');
        validateEventType(type, this, 'off');
        validateListener(listener, this, 'off');

        // Ensure there's at least a guid, even if the function hasn't been used
        listener = bind_(this, listener);

        // Remove the dispose listener on this evented object, which was given
        // the same guid as the event listener in on().
        this.off('dispose', listener);
        if (target.nodeName) {
          off(target, type, listener);
          off(target, 'dispose', listener);
        } else if (isEvented(target)) {
          target.off(type, listener);
          target.off('dispose', listener);
        }
      }
    },
    /**
     * Fire an event on this evented object, causing its listeners to be called.
     *
     * @param   {string|Object} event
     *          An event type or an object with a type property.
     *
     * @param   {Object} [hash]
     *          An additional object to pass along to listeners.
     *
     * @return {boolean}
     *          Whether or not the default behavior was prevented.
     */
    trigger(event, hash) {
      validateTarget(this.eventBusEl_, this, 'trigger');
      const type = event && typeof event !== 'string' ? event.type : event;
      if (!isValidEventType(type)) {
        throw new Error(`Invalid event type for ${objName(this)}#trigger; ` + 'must be a non-empty string or object with a type key that has a non-empty value.');
      }
      return trigger(this.eventBusEl_, event, hash);
    }
  };

  /**
   * Applies {@link module:evented~EventedMixin|EventedMixin} to a target object.
   *
   * @param  {Object} target
   *         The object to which to add event methods.
   *
   * @param  {Object} [options={}]
   *         Options for customizing the mixin behavior.
   *
   * @param  {string} [options.eventBusKey]
   *         By default, adds a `eventBusEl_` DOM element to the target object,
   *         which is used as an event bus. If the target object already has a
   *         DOM element that should be used, pass its key here.
   *
   * @return {Object}
   *         The target object.
   */
  function evented(target, options = {}) {
    const {
      eventBusKey
    } = options;

    // Set or create the eventBusEl_.
    if (eventBusKey) {
      if (!target[eventBusKey].nodeName) {
        throw new Error(`The eventBusKey "${eventBusKey}" does not refer to an element.`);
      }
      target.eventBusEl_ = target[eventBusKey];
    } else {
      target.eventBusEl_ = createEl('span', {
        className: 'vjs-event-bus'
      });
    }
    Object.assign(target, EventedMixin);
    if (target.eventedCallbacks) {
      target.eventedCallbacks.forEach(callback => {
        callback();
      });
    }

    // When any evented object is disposed, it removes all its listeners.
    target.on('dispose', () => {
      target.off();
      [target, target.el_, target.eventBusEl_].forEach(function (val) {
        if (val && DomData.has(val)) {
          DomData.delete(val);
        }
      });
      window.setTimeout(() => {
        target.eventBusEl_ = null;
      }, 0);
    });
    return target;
  }

  /**
   * @file mixins/stateful.js
   * @module stateful
   */

  /**
   * Contains methods that provide statefulness to an object which is passed
   * to {@link module:stateful}.
   *
   * @mixin StatefulMixin
   */
  const StatefulMixin = {
    /**
     * A hash containing arbitrary keys and values representing the state of
     * the object.
     *
     * @type {Object}
     */
    state: {},
    /**
     * Set the state of an object by mutating its
     * {@link module:stateful~StatefulMixin.state|state} object in place.
     *
     * @fires   module:stateful~StatefulMixin#statechanged
     * @param   {Object|Function} stateUpdates
     *          A new set of properties to shallow-merge into the plugin state.
     *          Can be a plain object or a function returning a plain object.
     *
     * @return {Object|undefined}
     *          An object containing changes that occurred. If no changes
     *          occurred, returns `undefined`.
     */
    setState(stateUpdates) {
      // Support providing the `stateUpdates` state as a function.
      if (typeof stateUpdates === 'function') {
        stateUpdates = stateUpdates();
      }
      let changes;
      each(stateUpdates, (value, key) => {
        // Record the change if the value is different from what's in the
        // current state.
        if (this.state[key] !== value) {
          changes = changes || {};
          changes[key] = {
            from: this.state[key],
            to: value
          };
        }
        this.state[key] = value;
      });

      // Only trigger "statechange" if there were changes AND we have a trigger
      // function. This allows us to not require that the target object be an
      // evented object.
      if (changes && isEvented(this)) {
        /**
         * An event triggered on an object that is both
         * {@link module:stateful|stateful} and {@link module:evented|evented}
         * indicating that its state has changed.
         *
         * @event    module:stateful~StatefulMixin#statechanged
         * @type     {Object}
         * @property {Object} changes
         *           A hash containing the properties that were changed and
         *           the values they were changed `from` and `to`.
         */
        this.trigger({
          changes,
          type: 'statechanged'
        });
      }
      return changes;
    }
  };

  /**
   * Applies {@link module:stateful~StatefulMixin|StatefulMixin} to a target
   * object.
   *
   * If the target object is {@link module:evented|evented} and has a
   * `handleStateChanged` method, that method will be automatically bound to the
   * `statechanged` event on itself.
   *
   * @param   {Object} target
   *          The object to be made stateful.
   *
   * @param   {Object} [defaultState]
   *          A default set of properties to populate the newly-stateful object's
   *          `state` property.
   *
   * @return {Object}
   *          Returns the `target`.
   */
  function stateful(target, defaultState) {
    Object.assign(target, StatefulMixin);

    // This happens after the mixing-in because we need to replace the `state`
    // added in that step.
    target.state = Object.assign({}, target.state, defaultState);

    // Auto-bind the `handleStateChanged` method of the target object if it exists.
    if (typeof target.handleStateChanged === 'function' && isEvented(target)) {
      target.on('statechanged', target.handleStateChanged);
    }
    return target;
  }

  /**
   * @file str.js
   * @module to-lower-case
   */

  /**
   * Lowercase the first letter of a string.
   *
   * @param {string} string
   *        String to be lowercased
   *
   * @return {string}
   *         The string with a lowercased first letter
   */
  const toLowerCase = function (string) {
    if (typeof string !== 'string') {
      return string;
    }
    return string.replace(/./, w => w.toLowerCase());
  };

  /**
   * Uppercase the first letter of a string.
   *
   * @param {string} string
   *        String to be uppercased
   *
   * @return {string}
   *         The string with an uppercased first letter
   */
  const toTitleCase = function (string) {
    if (typeof string !== 'string') {
      return string;
    }
    return string.replace(/./, w => w.toUpperCase());
  };

  /**
   * Compares the TitleCase versions of the two strings for equality.
   *
   * @param {string} str1
   *        The first string to compare
   *
   * @param {string} str2
   *        The second string to compare
   *
   * @return {boolean}
   *         Whether the TitleCase versions of the strings are equal
   */
  const titleCaseEquals = function (str1, str2) {
    return toTitleCase(str1) === toTitleCase(str2);
  };

  var Str = /*#__PURE__*/Object.freeze({
    __proto__: null,
    toLowerCase: toLowerCase,
    toTitleCase: toTitleCase,
    titleCaseEquals: titleCaseEquals
  });

  var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

  function unwrapExports (x) {
  	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
  }

  function createCommonjsModule(fn, module) {
  	return module = { exports: {} }, fn(module, module.exports), module.exports;
  }

  var keycode = createCommonjsModule(function (module, exports) {
    // Source: http://jsfiddle.net/vWx8V/
    // http://stackoverflow.com/questions/5603195/full-list-of-javascript-keycodes

    /**
     * Conenience method returns corresponding value for given keyName or keyCode.
     *
     * @param {Mixed} keyCode {Number} or keyName {String}
     * @return {Mixed}
     * @api public
     */

    function keyCode(searchInput) {
      // Keyboard Events
      if (searchInput && 'object' === typeof searchInput) {
        var hasKeyCode = searchInput.which || searchInput.keyCode || searchInput.charCode;
        if (hasKeyCode) searchInput = hasKeyCode;
      }

      // Numbers
      if ('number' === typeof searchInput) return names[searchInput];

      // Everything else (cast to string)
      var search = String(searchInput);

      // check codes
      var foundNamedKey = codes[search.toLowerCase()];
      if (foundNamedKey) return foundNamedKey;

      // check aliases
      var foundNamedKey = aliases[search.toLowerCase()];
      if (foundNamedKey) return foundNamedKey;

      // weird character?
      if (search.length === 1) return search.charCodeAt(0);
      return undefined;
    }

    /**
     * Compares a keyboard event with a given keyCode or keyName.
     *
     * @param {Event} event Keyboard event that should be tested
     * @param {Mixed} keyCode {Number} or keyName {String}
     * @return {Boolean}
     * @api public
     */
    keyCode.isEventKey = function isEventKey(event, nameOrCode) {
      if (event && 'object' === typeof event) {
        var keyCode = event.which || event.keyCode || event.charCode;
        if (keyCode === null || keyCode === undefined) {
          return false;
        }
        if (typeof nameOrCode === 'string') {
          // check codes
          var foundNamedKey = codes[nameOrCode.toLowerCase()];
          if (foundNamedKey) {
            return foundNamedKey === keyCode;
          }

          // check aliases
          var foundNamedKey = aliases[nameOrCode.toLowerCase()];
          if (foundNamedKey) {
            return foundNamedKey === keyCode;
          }
        } else if (typeof nameOrCode === 'number') {
          return nameOrCode === keyCode;
        }
        return false;
      }
    };
    exports = module.exports = keyCode;

    /**
     * Get by name
     *
     *   exports.code['enter'] // => 13
     */

    var codes = exports.code = exports.codes = {
      'backspace': 8,
      'tab': 9,
      'enter': 13,
      'shift': 16,
      'ctrl': 17,
      'alt': 18,
      'pause/break': 19,
      'caps lock': 20,
      'esc': 27,
      'space': 32,
      'page up': 33,
      'page down': 34,
      'end': 35,
      'home': 36,
      'left': 37,
      'up': 38,
      'right': 39,
      'down': 40,
      'insert': 45,
      'delete': 46,
      'command': 91,
      'left command': 91,
      'right command': 93,
      'numpad *': 106,
      'numpad +': 107,
      'numpad -': 109,
      'numpad .': 110,
      'numpad /': 111,
      'num lock': 144,
      'scroll lock': 145,
      'my computer': 182,
      'my calculator': 183,
      ';': 186,
      '=': 187,
      ',': 188,
      '-': 189,
      '.': 190,
      '/': 191,
      '`': 192,
      '[': 219,
      '\\': 220,
      ']': 221,
      "'": 222
    };

    // Helper aliases

    var aliases = exports.aliases = {
      'windows': 91,
      '⇧': 16,
      '⌥': 18,
      '⌃': 17,
      '⌘': 91,
      'ctl': 17,
      'control': 17,
      'option': 18,
      'pause': 19,
      'break': 19,
      'caps': 20,
      'return': 13,
      'escape': 27,
      'spc': 32,
      'spacebar': 32,
      'pgup': 33,
      'pgdn': 34,
      'ins': 45,
      'del': 46,
      'cmd': 91
    };

    /*!
     * Programatically add the following
     */

    // lower case chars
    for (i = 97; i < 123; i++) codes[String.fromCharCode(i)] = i - 32;

    // numbers
    for (var i = 48; i < 58; i++) codes[i - 48] = i;

    // function keys
    for (i = 1; i < 13; i++) codes['f' + i] = i + 111;

    // numpad keys
    for (i = 0; i < 10; i++) codes['numpad ' + i] = i + 96;

    /**
     * Get by code
     *
     *   exports.name[13] // => 'Enter'
     */

    var names = exports.names = exports.title = {}; // title for backward compat

    // Create reverse mapping
    for (i in codes) names[codes[i]] = i;

    // Add aliases
    for (var alias in aliases) {
      codes[alias] = aliases[alias];
    }
  });
  keycode.code;
  keycode.codes;
  keycode.aliases;
  keycode.names;
  keycode.title;

  /**
   * Player Component - Base class for all UI objects
   *
   * @file component.js
   */

  /**
   * Base class for all UI Components.
   * Components are UI objects which represent both a javascript object and an element
   * in the DOM. They can be children of other components, and can have
   * children themselves.
   *
   * Components can also use methods from {@link EventTarget}
   */
  class Component {
    /**
     * A callback that is called when a component is ready. Does not have any
     * parameters and any callback value will be ignored.
     *
     * @callback ReadyCallback
     * @this Component
     */

    /**
     * Creates an instance of this class.
     *
     * @param { import('./player').default } player
     *        The `Player` that this class should be attached to.
     *
     * @param {Object} [options]
     *        The key/value store of component options.
     *
     * @param {Object[]} [options.children]
     *        An array of children objects to initialize this component with. Children objects have
     *        a name property that will be used if more than one component of the same type needs to be
     *        added.
     *
     * @param  {string} [options.className]
     *         A class or space separated list of classes to add the component
     *
     * @param {ReadyCallback} [ready]
     *        Function that gets called when the `Component` is ready.
     */
    constructor(player, options, ready) {
      // The component might be the player itself and we can't pass `this` to super
      if (!player && this.play) {
        this.player_ = player = this; // eslint-disable-line
      } else {
        this.player_ = player;
      }
      this.isDisposed_ = false;

      // Hold the reference to the parent component via `addChild` method
      this.parentComponent_ = null;

      // Make a copy of prototype.options_ to protect against overriding defaults
      this.options_ = merge({}, this.options_);

      // Updated options with supplied options
      options = this.options_ = merge(this.options_, options);

      // Get ID from options or options element if one is supplied
      this.id_ = options.id || options.el && options.el.id;

      // If there was no ID from the options, generate one
      if (!this.id_) {
        // Don't require the player ID function in the case of mock players
        const id = player && player.id && player.id() || 'no_player';
        this.id_ = `${id}_component_${newGUID()}`;
      }
      this.name_ = options.name || null;

      // Create element if one wasn't provided in options
      if (options.el) {
        this.el_ = options.el;
      } else if (options.createEl !== false) {
        this.el_ = this.createEl();
      }
      if (options.className && this.el_) {
        options.className.split(' ').forEach(c => this.addClass(c));
      }

      // Remove the placeholder event methods. If the component is evented, the
      // real methods are added next
      ['on', 'off', 'one', 'any', 'trigger'].forEach(fn => {
        this[fn] = undefined;
      });

      // if evented is anything except false, we want to mixin in evented
      if (options.evented !== false) {
        // Make this an evented object and use `el_`, if available, as its event bus
        evented(this, {
          eventBusKey: this.el_ ? 'el_' : null
        });
        this.handleLanguagechange = this.handleLanguagechange.bind(this);
        this.on(this.player_, 'languagechange', this.handleLanguagechange);
      }
      stateful(this, this.constructor.defaultState);
      this.children_ = [];
      this.childIndex_ = {};
      this.childNameIndex_ = {};
      this.setTimeoutIds_ = new Set();
      this.setIntervalIds_ = new Set();
      this.rafIds_ = new Set();
      this.namedRafs_ = new Map();
      this.clearingTimersOnDispose_ = false;

      // Add any child components in options
      if (options.initChildren !== false) {
        this.initChildren();
      }

      // Don't want to trigger ready here or it will go before init is actually
      // finished for all children that run this constructor
      this.ready(ready);
      if (options.reportTouchActivity !== false) {
        this.enableTouchActivity();
      }
    }

    // `on`, `off`, `one`, `any` and `trigger` are here so tsc includes them in definitions.
    // They are replaced or removed in the constructor

    /**
     * Adds an `event listener` to an instance of an `EventTarget`. An `event listener` is a
     * function that will get called when an event with a certain name gets triggered.
     *
     * @param {string|string[]} type
     *        An event name or an array of event names.
     *
     * @param {Function} fn
     *        The function to call with `EventTarget`s
     */
    on(type, fn) {}

    /**
     * Removes an `event listener` for a specific event from an instance of `EventTarget`.
     * This makes it so that the `event listener` will no longer get called when the
     * named event happens.
     *
     * @param {string|string[]} type
     *        An event name or an array of event names.
     *
     * @param {Function} fn
     *        The function to remove.
     */
    off(type, fn) {}

    /**
     * This function will add an `event listener` that gets triggered only once. After the
     * first trigger it will get removed. This is like adding an `event listener`
     * with {@link EventTarget#on} that calls {@link EventTarget#off} on itself.
     *
     * @param {string|string[]} type
     *        An event name or an array of event names.
     *
     * @param {Function} fn
     *        The function to be called once for each event name.
     */
    one(type, fn) {}

    /**
     * This function will add an `event listener` that gets triggered only once and is
     * removed from all events. This is like adding an array of `event listener`s
     * with {@link EventTarget#on} that calls {@link EventTarget#off} on all events the
     * first time it is triggered.
     *
     * @param {string|string[]} type
     *        An event name or an array of event names.
     *
     * @param {Function} fn
     *        The function to be called once for each event name.
     */
    any(type, fn) {}

    /**
     * This function causes an event to happen. This will then cause any `event listeners`
     * that are waiting for that event, to get called. If there are no `event listeners`
     * for an event then nothing will happen.
     *
     * If the name of the `Event` that is being triggered is in `EventTarget.allowedEvents_`.
     * Trigger will also call the `on` + `uppercaseEventName` function.
     *
     * Example:
     * 'click' is in `EventTarget.allowedEvents_`, so, trigger will attempt to call
     * `onClick` if it exists.
     *
     * @param {string|Event|Object} event
     *        The name of the event, an `Event`, or an object with a key of type set to
     *        an event name.
     *
     * @param {Object} [hash]
     *        Optionally extra argument to pass through to an event listener
     */
    trigger(event, hash) {}

    /**
     * Dispose of the `Component` and all child components.
     *
     * @fires Component#dispose
     *
     * @param {Object} options
     * @param {Element} options.originalEl element with which to replace player element
     */
    dispose(options = {}) {
      // Bail out if the component has already been disposed.
      if (this.isDisposed_) {
        return;
      }
      if (this.readyQueue_) {
        this.readyQueue_.length = 0;
      }

      /**
       * Triggered when a `Component` is disposed.
       *
       * @event Component#dispose
       * @type {Event}
       *
       * @property {boolean} [bubbles=false]
       *           set to false so that the dispose event does not
       *           bubble up
       */
      this.trigger({
        type: 'dispose',
        bubbles: false
      });
      this.isDisposed_ = true;

      // Dispose all children.
      if (this.children_) {
        for (let i = this.children_.length - 1; i >= 0; i--) {
          if (this.children_[i].dispose) {
            this.children_[i].dispose();
          }
        }
      }

      // Delete child references
      this.children_ = null;
      this.childIndex_ = null;
      this.childNameIndex_ = null;
      this.parentComponent_ = null;
      if (this.el_) {
        // Remove element from DOM
        if (this.el_.parentNode) {
          if (options.restoreEl) {
            this.el_.parentNode.replaceChild(options.restoreEl, this.el_);
          } else {
            this.el_.parentNode.removeChild(this.el_);
          }
        }
        this.el_ = null;
      }

      // remove reference to the player after disposing of the element
      this.player_ = null;
    }

    /**
     * Determine whether or not this component has been disposed.
     *
     * @return {boolean}
     *         If the component has been disposed, will be `true`. Otherwise, `false`.
     */
    isDisposed() {
      return Boolean(this.isDisposed_);
    }

    /**
     * Return the {@link Player} that the `Component` has attached to.
     *
     * @return { import('./player').default }
     *         The player that this `Component` has attached to.
     */
    player() {
      return this.player_;
    }

    /**
     * Deep merge of options objects with new options.
     * > Note: When both `obj` and `options` contain properties whose values are objects.
     *         The two properties get merged using {@link module:obj.merge}
     *
     * @param {Object} obj
     *        The object that contains new options.
     *
     * @return {Object}
     *         A new object of `this.options_` and `obj` merged together.
     */
    options(obj) {
      if (!obj) {
        return this.options_;
      }
      this.options_ = merge(this.options_, obj);
      return this.options_;
    }

    /**
     * Get the `Component`s DOM element
     *
     * @return {Element}
     *         The DOM element for this `Component`.
     */
    el() {
      return this.el_;
    }

    /**
     * Create the `Component`s DOM element.
     *
     * @param {string} [tagName]
     *        Element's DOM node type. e.g. 'div'
     *
     * @param {Object} [properties]
     *        An object of properties that should be set.
     *
     * @param {Object} [attributes]
     *        An object of attributes that should be set.
     *
     * @return {Element}
     *         The element that gets created.
     */
    createEl(tagName, properties, attributes) {
      return createEl(tagName, properties, attributes);
    }

    /**
     * Localize a string given the string in english.
     *
     * If tokens are provided, it'll try and run a simple token replacement on the provided string.
     * The tokens it looks for look like `{1}` with the index being 1-indexed into the tokens array.
     *
     * If a `defaultValue` is provided, it'll use that over `string`,
     * if a value isn't found in provided language files.
     * This is useful if you want to have a descriptive key for token replacement
     * but have a succinct localized string and not require `en.json` to be included.
     *
     * Currently, it is used for the progress bar timing.
     * ```js
     * {
     *   "progress bar timing: currentTime={1} duration={2}": "{1} of {2}"
     * }
     * ```
     * It is then used like so:
     * ```js
     * this.localize('progress bar timing: currentTime={1} duration{2}',
     *               [this.player_.currentTime(), this.player_.duration()],
     *               '{1} of {2}');
     * ```
     *
     * Which outputs something like: `01:23 of 24:56`.
     *
     *
     * @param {string} string
     *        The string to localize and the key to lookup in the language files.
     * @param {string[]} [tokens]
     *        If the current item has token replacements, provide the tokens here.
     * @param {string} [defaultValue]
     *        Defaults to `string`. Can be a default value to use for token replacement
     *        if the lookup key is needed to be separate.
     *
     * @return {string}
     *         The localized string or if no localization exists the english string.
     */
    localize(string, tokens, defaultValue = string) {
      const code = this.player_.language && this.player_.language();
      const languages = this.player_.languages && this.player_.languages();
      const language = languages && languages[code];
      const primaryCode = code && code.split('-')[0];
      const primaryLang = languages && languages[primaryCode];
      let localizedString = defaultValue;
      if (language && language[string]) {
        localizedString = language[string];
      } else if (primaryLang && primaryLang[string]) {
        localizedString = primaryLang[string];
      }
      if (tokens) {
        localizedString = localizedString.replace(/\{(\d+)\}/g, function (match, index) {
          const value = tokens[index - 1];
          let ret = value;
          if (typeof value === 'undefined') {
            ret = match;
          }
          return ret;
        });
      }
      return localizedString;
    }

    /**
     * Handles language change for the player in components. Should be overridden by sub-components.
     *
     * @abstract
     */
    handleLanguagechange() {}

    /**
     * Return the `Component`s DOM element. This is where children get inserted.
     * This will usually be the the same as the element returned in {@link Component#el}.
     *
     * @return {Element}
     *         The content element for this `Component`.
     */
    contentEl() {
      return this.contentEl_ || this.el_;
    }

    /**
     * Get this `Component`s ID
     *
     * @return {string}
     *         The id of this `Component`
     */
    id() {
      return this.id_;
    }

    /**
     * Get the `Component`s name. The name gets used to reference the `Component`
     * and is set during registration.
     *
     * @return {string}
     *         The name of this `Component`.
     */
    name() {
      return this.name_;
    }

    /**
     * Get an array of all child components
     *
     * @return {Array}
     *         The children
     */
    children() {
      return this.children_;
    }

    /**
     * Returns the child `Component` with the given `id`.
     *
     * @param {string} id
     *        The id of the child `Component` to get.
     *
     * @return {Component|undefined}
     *         The child `Component` with the given `id` or undefined.
     */
    getChildById(id) {
      return this.childIndex_[id];
    }

    /**
     * Returns the child `Component` with the given `name`.
     *
     * @param {string} name
     *        The name of the child `Component` to get.
     *
     * @return {Component|undefined}
     *         The child `Component` with the given `name` or undefined.
     */
    getChild(name) {
      if (!name) {
        return;
      }
      return this.childNameIndex_[name];
    }

    /**
     * Returns the descendant `Component` following the givent
     * descendant `names`. For instance ['foo', 'bar', 'baz'] would
     * try to get 'foo' on the current component, 'bar' on the 'foo'
     * component and 'baz' on the 'bar' component and return undefined
     * if any of those don't exist.
     *
     * @param {...string[]|...string} names
     *        The name of the child `Component` to get.
     *
     * @return {Component|undefined}
     *         The descendant `Component` following the given descendant
     *         `names` or undefined.
     */
    getDescendant(...names) {
      // flatten array argument into the main array
      names = names.reduce((acc, n) => acc.concat(n), []);
      let currentChild = this;
      for (let i = 0; i < names.length; i++) {
        currentChild = currentChild.getChild(names[i]);
        if (!currentChild || !currentChild.getChild) {
          return;
        }
      }
      return currentChild;
    }

    /**
     * Adds an SVG icon element to another element or component.
     *
     * @param {string} iconName
     *        The name of icon. A list of all the icon names can be found at 'sandbox/svg-icons.html'
     *
     * @param {Element} [el=this.el()]
     *        Element to set the title on. Defaults to the current Component's element.
     *
     * @return {Element}
     *        The newly created icon element.
     */
    setIcon(iconName, el = this.el()) {
      // TODO: In v9 of video.js, we will want to remove font icons entirely.
      // This means this check, as well as the others throughout the code, and
      // the unecessary CSS for font icons, will need to be removed.
      // See https://github.com/videojs/video.js/pull/8260 as to which components
      // need updating.
      if (!this.player_.options_.experimentalSvgIcons) {
        return;
      }
      const xmlnsURL = 'http://www.w3.org/2000/svg';

      // The below creates an element in the format of:
      // <span><svg><use>....</use></svg></span>
      const iconContainer = createEl('span', {
        className: 'vjs-icon-placeholder vjs-svg-icon'
      }, {
        'aria-hidden': 'true'
      });
      const svgEl = document.createElementNS(xmlnsURL, 'svg');
      svgEl.setAttributeNS(null, 'viewBox', '0 0 512 512');
      const useEl = document.createElementNS(xmlnsURL, 'use');
      svgEl.appendChild(useEl);
      useEl.setAttributeNS(null, 'href', `#vjs-icon-${iconName}`);
      iconContainer.appendChild(svgEl);

      // Replace a pre-existing icon if one exists.
      if (this.iconIsSet_) {
        el.replaceChild(iconContainer, el.querySelector('.vjs-icon-placeholder'));
      } else {
        el.appendChild(iconContainer);
      }
      this.iconIsSet_ = true;
      return iconContainer;
    }

    /**
     * Add a child `Component` inside the current `Component`.
     *
     *
     * @param {string|Component} child
     *        The name or instance of a child to add.
     *
     * @param {Object} [options={}]
     *        The key/value store of options that will get passed to children of
     *        the child.
     *
     * @param {number} [index=this.children_.length]
     *        The index to attempt to add a child into.
     *
     * @return {Component}
     *         The `Component` that gets added as a child. When using a string the
     *         `Component` will get created by this process.
     */
    addChild(child, options = {}, index = this.children_.length) {
      let component;
      let componentName;

      // If child is a string, create component with options
      if (typeof child === 'string') {
        componentName = toTitleCase(child);
        const componentClassName = options.componentClass || componentName;

        // Set name through options
        options.name = componentName;

        // Create a new object & element for this controls set
        // If there's no .player_, this is a player
        const ComponentClass = Component.getComponent(componentClassName);
        if (!ComponentClass) {
          throw new Error(`Component ${componentClassName} does not exist`);
        }

        // data stored directly on the videojs object may be
        // misidentified as a component to retain
        // backwards-compatibility with 4.x. check to make sure the
        // component class can be instantiated.
        if (typeof ComponentClass !== 'function') {
          return null;
        }
        component = new ComponentClass(this.player_ || this, options);

        // child is a component instance
      } else {
        component = child;
      }
      if (component.parentComponent_) {
        component.parentComponent_.removeChild(component);
      }
      this.children_.splice(index, 0, component);
      component.parentComponent_ = this;
      if (typeof component.id === 'function') {
        this.childIndex_[component.id()] = component;
      }

      // If a name wasn't used to create the component, check if we can use the
      // name function of the component
      componentName = componentName || component.name && toTitleCase(component.name());
      if (componentName) {
        this.childNameIndex_[componentName] = component;
        this.childNameIndex_[toLowerCase(componentName)] = component;
      }

      // Add the UI object's element to the container div (box)
      // Having an element is not required
      if (typeof component.el === 'function' && component.el()) {
        // If inserting before a component, insert before that component's element
        let refNode = null;
        if (this.children_[index + 1]) {
          // Most children are components, but the video tech is an HTML element
          if (this.children_[index + 1].el_) {
            refNode = this.children_[index + 1].el_;
          } else if (isEl(this.children_[index + 1])) {
            refNode = this.children_[index + 1];
          }
        }
        this.contentEl().insertBefore(component.el(), refNode);
      }

      // Return so it can stored on parent object if desired.
      return component;
    }

    /**
     * Remove a child `Component` from this `Component`s list of children. Also removes
     * the child `Component`s element from this `Component`s element.
     *
     * @param {Component} component
     *        The child `Component` to remove.
     */
    removeChild(component) {
      if (typeof component === 'string') {
        component = this.getChild(component);
      }
      if (!component || !this.children_) {
        return;
      }
      let childFound = false;
      for (let i = this.children_.length - 1; i >= 0; i--) {
        if (this.children_[i] === component) {
          childFound = true;
          this.children_.splice(i, 1);
          break;
        }
      }
      if (!childFound) {
        return;
      }
      component.parentComponent_ = null;
      this.childIndex_[component.id()] = null;
      this.childNameIndex_[toTitleCase(component.name())] = null;
      this.childNameIndex_[toLowerCase(component.name())] = null;
      const compEl = component.el();
      if (compEl && compEl.parentNode === this.contentEl()) {
        this.contentEl().removeChild(component.el());
      }
    }

    /**
     * Add and initialize default child `Component`s based upon options.
     */
    initChildren() {
      const children = this.options_.children;
      if (children) {
        // `this` is `parent`
        const parentOptions = this.options_;
        const handleAdd = child => {
          const name = child.name;
          let opts = child.opts;

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
          }

          // Allow options to be passed as a simple boolean if no configuration
          // is necessary.
          if (opts === true) {
            opts = {};
          }

          // We also want to pass the original player options
          // to each component as well so they don't need to
          // reach back into the player for options later.
          opts.playerOptions = this.options_.playerOptions;

          // Create and add the child component.
          // Add a direct reference to the child by name on the parent instance.
          // If two of the same component are used, different names should be supplied
          // for each
          const newChild = this.addChild(name, opts);
          if (newChild) {
            this[name] = newChild;
          }
        };

        // Allow for an array of children details to passed in the options
        let workingChildren;
        const Tech = Component.getComponent('Tech');
        if (Array.isArray(children)) {
          workingChildren = children;
        } else {
          workingChildren = Object.keys(children);
        }
        workingChildren
        // children that are in this.options_ but also in workingChildren  would
        // give us extra children we do not want. So, we want to filter them out.
        .concat(Object.keys(this.options_).filter(function (child) {
          return !workingChildren.some(function (wchild) {
            if (typeof wchild === 'string') {
              return child === wchild;
            }
            return child === wchild.name;
          });
        })).map(child => {
          let name;
          let opts;
          if (typeof child === 'string') {
            name = child;
            opts = children[name] || this.options_[name] || {};
          } else {
            name = child.name;
            opts = child;
          }
          return {
            name,
            opts
          };
        }).filter(child => {
          // we have to make sure that child.name isn't in the techOrder since
          // techs are registered as Components but can't aren't compatible
          // See https://github.com/videojs/video.js/issues/2772
          const c = Component.getComponent(child.opts.componentClass || toTitleCase(child.name));
          return c && !Tech.isTech(c);
        }).forEach(handleAdd);
      }
    }

    /**
     * Builds the default DOM class name. Should be overridden by sub-components.
     *
     * @return {string}
     *         The DOM class name for this object.
     *
     * @abstract
     */
    buildCSSClass() {
      // Child classes can include a function that does:
      // return 'CLASS NAME' + this._super();
      return '';
    }

    /**
     * Bind a listener to the component's ready state.
     * Different from event listeners in that if the ready event has already happened
     * it will trigger the function immediately.
     *
     * @param {ReadyCallback} fn
     *        Function that gets called when the `Component` is ready.
     *
     * @return {Component}
     *         Returns itself; method can be chained.
     */
    ready(fn, sync = false) {
      if (!fn) {
        return;
      }
      if (!this.isReady_) {
        this.readyQueue_ = this.readyQueue_ || [];
        this.readyQueue_.push(fn);
        return;
      }
      if (sync) {
        fn.call(this);
      } else {
        // Call the function asynchronously by default for consistency
        this.setTimeout(fn, 1);
      }
    }

    /**
     * Trigger all the ready listeners for this `Component`.
     *
     * @fires Component#ready
     */
    triggerReady() {
      this.isReady_ = true;

      // Ensure ready is triggered asynchronously
      this.setTimeout(function () {
        const readyQueue = this.readyQueue_;

        // Reset Ready Queue
        this.readyQueue_ = [];
        if (readyQueue && readyQueue.length > 0) {
          readyQueue.forEach(function (fn) {
            fn.call(this);
          }, this);
        }

        // Allow for using event listeners also
        /**
         * Triggered when a `Component` is ready.
         *
         * @event Component#ready
         * @type {Event}
         */
        this.trigger('ready');
      }, 1);
    }

    /**
     * Find a single DOM element matching a `selector`. This can be within the `Component`s
     * `contentEl()` or another custom context.
     *
     * @param {string} selector
     *        A valid CSS selector, which will be passed to `querySelector`.
     *
     * @param {Element|string} [context=this.contentEl()]
     *        A DOM element within which to query. Can also be a selector string in
     *        which case the first matching element will get used as context. If
     *        missing `this.contentEl()` gets used. If  `this.contentEl()` returns
     *        nothing it falls back to `document`.
     *
     * @return {Element|null}
     *         the dom element that was found, or null
     *
     * @see [Information on CSS Selectors](https://developer.mozilla.org/en-US/docs/Web/Guide/CSS/Getting_Started/Selectors)
     */
    $(selector, context) {
      return $(selector, context || this.contentEl());
    }

    /**
     * Finds all DOM element matching a `selector`. This can be within the `Component`s
     * `contentEl()` or another custom context.
     *
     * @param {string} selector
     *        A valid CSS selector, which will be passed to `querySelectorAll`.
     *
     * @param {Element|string} [context=this.contentEl()]
     *        A DOM element within which to query. Can also be a selector string in
     *        which case the first matching element will get used as context. If
     *        missing `this.contentEl()` gets used. If  `this.contentEl()` returns
     *        nothing it falls back to `document`.
     *
     * @return {NodeList}
     *         a list of dom elements that were found
     *
     * @see [Information on CSS Selectors](https://developer.mozilla.org/en-US/docs/Web/Guide/CSS/Getting_Started/Selectors)
     */
    $$(selector, context) {
      return $$(selector, context || this.contentEl());
    }

    /**
     * Check if a component's element has a CSS class name.
     *
     * @param {string} classToCheck
     *        CSS class name to check.
     *
     * @return {boolean}
     *         - True if the `Component` has the class.
     *         - False if the `Component` does not have the class`
     */
    hasClass(classToCheck) {
      return hasClass(this.el_, classToCheck);
    }

    /**
     * Add a CSS class name to the `Component`s element.
     *
     * @param {...string} classesToAdd
     *        One or more CSS class name to add.
     */
    addClass(...classesToAdd) {
      addClass(this.el_, ...classesToAdd);
    }

    /**
     * Remove a CSS class name from the `Component`s element.
     *
     * @param {...string} classesToRemove
     *        One or more CSS class name to remove.
     */
    removeClass(...classesToRemove) {
      removeClass(this.el_, ...classesToRemove);
    }

    /**
     * Add or remove a CSS class name from the component's element.
     * - `classToToggle` gets added when {@link Component#hasClass} would return false.
     * - `classToToggle` gets removed when {@link Component#hasClass} would return true.
     *
     * @param  {string} classToToggle
     *         The class to add or remove based on (@link Component#hasClass}
     *
     * @param  {boolean|Dom~predicate} [predicate]
     *         An {@link Dom~predicate} function or a boolean
     */
    toggleClass(classToToggle, predicate) {
      toggleClass(this.el_, classToToggle, predicate);
    }

    /**
     * Show the `Component`s element if it is hidden by removing the
     * 'vjs-hidden' class name from it.
     */
    show() {
      this.removeClass('vjs-hidden');
    }

    /**
     * Hide the `Component`s element if it is currently showing by adding the
     * 'vjs-hidden` class name to it.
     */
    hide() {
      this.addClass('vjs-hidden');
    }

    /**
     * Lock a `Component`s element in its visible state by adding the 'vjs-lock-showing'
     * class name to it. Used during fadeIn/fadeOut.
     *
     * @private
     */
    lockShowing() {
      this.addClass('vjs-lock-showing');
    }

    /**
     * Unlock a `Component`s element from its visible state by removing the 'vjs-lock-showing'
     * class name from it. Used during fadeIn/fadeOut.
     *
     * @private
     */
    unlockShowing() {
      this.removeClass('vjs-lock-showing');
    }

    /**
     * Get the value of an attribute on the `Component`s element.
     *
     * @param {string} attribute
     *        Name of the attribute to get the value from.
     *
     * @return {string|null}
     *         - The value of the attribute that was asked for.
     *         - Can be an empty string on some browsers if the attribute does not exist
     *           or has no value
     *         - Most browsers will return null if the attribute does not exist or has
     *           no value.
     *
     * @see [DOM API]{@link https://developer.mozilla.org/en-US/docs/Web/API/Element/getAttribute}
     */
    getAttribute(attribute) {
      return getAttribute(this.el_, attribute);
    }

    /**
     * Set the value of an attribute on the `Component`'s element
     *
     * @param {string} attribute
     *        Name of the attribute to set.
     *
     * @param {string} value
     *        Value to set the attribute to.
     *
     * @see [DOM API]{@link https://developer.mozilla.org/en-US/docs/Web/API/Element/setAttribute}
     */
    setAttribute(attribute, value) {
      setAttribute(this.el_, attribute, value);
    }

    /**
     * Remove an attribute from the `Component`s element.
     *
     * @param {string} attribute
     *        Name of the attribute to remove.
     *
     * @see [DOM API]{@link https://developer.mozilla.org/en-US/docs/Web/API/Element/removeAttribute}
     */
    removeAttribute(attribute) {
      removeAttribute(this.el_, attribute);
    }

    /**
     * Get or set the width of the component based upon the CSS styles.
     * See {@link Component#dimension} for more detailed information.
     *
     * @param {number|string} [num]
     *        The width that you want to set postfixed with '%', 'px' or nothing.
     *
     * @param {boolean} [skipListeners]
     *        Skip the componentresize event trigger
     *
     * @return {number|string}
     *         The width when getting, zero if there is no width. Can be a string
     *           postpixed with '%' or 'px'.
     */
    width(num, skipListeners) {
      return this.dimension('width', num, skipListeners);
    }

    /**
     * Get or set the height of the component based upon the CSS styles.
     * See {@link Component#dimension} for more detailed information.
     *
     * @param {number|string} [num]
     *        The height that you want to set postfixed with '%', 'px' or nothing.
     *
     * @param {boolean} [skipListeners]
     *        Skip the componentresize event trigger
     *
     * @return {number|string}
     *         The width when getting, zero if there is no width. Can be a string
     *         postpixed with '%' or 'px'.
     */
    height(num, skipListeners) {
      return this.dimension('height', num, skipListeners);
    }

    /**
     * Set both the width and height of the `Component` element at the same time.
     *
     * @param  {number|string} width
     *         Width to set the `Component`s element to.
     *
     * @param  {number|string} height
     *         Height to set the `Component`s element to.
     */
    dimensions(width, height) {
      // Skip componentresize listeners on width for optimization
      this.width(width, true);
      this.height(height);
    }

    /**
     * Get or set width or height of the `Component` element. This is the shared code
     * for the {@link Component#width} and {@link Component#height}.
     *
     * Things to know:
     * - If the width or height in an number this will return the number postfixed with 'px'.
     * - If the width/height is a percent this will return the percent postfixed with '%'
     * - Hidden elements have a width of 0 with `window.getComputedStyle`. This function
     *   defaults to the `Component`s `style.width` and falls back to `window.getComputedStyle`.
     *   See [this]{@link http://www.foliotek.com/devblog/getting-the-width-of-a-hidden-element-with-jquery-using-width/}
     *   for more information
     * - If you want the computed style of the component, use {@link Component#currentWidth}
     *   and {@link {Component#currentHeight}
     *
     * @fires Component#componentresize
     *
     * @param {string} widthOrHeight
     8        'width' or 'height'
     *
     * @param  {number|string} [num]
     8         New dimension
     *
     * @param  {boolean} [skipListeners]
     *         Skip componentresize event trigger
     *
     * @return {number}
     *         The dimension when getting or 0 if unset
     */
    dimension(widthOrHeight, num, skipListeners) {
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
          /**
           * Triggered when a component is resized.
           *
           * @event Component#componentresize
           * @type {Event}
           */
          this.trigger('componentresize');
        }
        return;
      }

      // Not setting a value, so getting it
      // Make sure element exists
      if (!this.el_) {
        return 0;
      }

      // Get dimension value from style
      const val = this.el_.style[widthOrHeight];
      const pxIndex = val.indexOf('px');
      if (pxIndex !== -1) {
        // Return the pixel value with no 'px'
        return parseInt(val.slice(0, pxIndex), 10);
      }

      // No px so using % or no style was set, so falling back to offsetWidth/height
      // If component has display:none, offset will return 0
      // TODO: handle display:none and no dimension style using px
      return parseInt(this.el_['offset' + toTitleCase(widthOrHeight)], 10);
    }

    /**
     * Get the computed width or the height of the component's element.
     *
     * Uses `window.getComputedStyle`.
     *
     * @param {string} widthOrHeight
     *        A string containing 'width' or 'height'. Whichever one you want to get.
     *
     * @return {number}
     *         The dimension that gets asked for or 0 if nothing was set
     *         for that dimension.
     */
    currentDimension(widthOrHeight) {
      let computedWidthOrHeight = 0;
      if (widthOrHeight !== 'width' && widthOrHeight !== 'height') {
        throw new Error('currentDimension only accepts width or height value');
      }
      computedWidthOrHeight = computedStyle(this.el_, widthOrHeight);

      // remove 'px' from variable and parse as integer
      computedWidthOrHeight = parseFloat(computedWidthOrHeight);

      // if the computed value is still 0, it's possible that the browser is lying
      // and we want to check the offset values.
      // This code also runs wherever getComputedStyle doesn't exist.
      if (computedWidthOrHeight === 0 || isNaN(computedWidthOrHeight)) {
        const rule = `offset${toTitleCase(widthOrHeight)}`;
        computedWidthOrHeight = this.el_[rule];
      }
      return computedWidthOrHeight;
    }

    /**
     * An object that contains width and height values of the `Component`s
     * computed style. Uses `window.getComputedStyle`.
     *
     * @typedef {Object} Component~DimensionObject
     *
     * @property {number} width
     *           The width of the `Component`s computed style.
     *
     * @property {number} height
     *           The height of the `Component`s computed style.
     */

    /**
     * Get an object that contains computed width and height values of the
     * component's element.
     *
     * Uses `window.getComputedStyle`.
     *
     * @return {Component~DimensionObject}
     *         The computed dimensions of the component's element.
     */
    currentDimensions() {
      return {
        width: this.currentDimension('width'),
        height: this.currentDimension('height')
      };
    }

    /**
     * Get the computed width of the component's element.
     *
     * Uses `window.getComputedStyle`.
     *
     * @return {number}
     *         The computed width of the component's element.
     */
    currentWidth() {
      return this.currentDimension('width');
    }

    /**
     * Get the computed height of the component's element.
     *
     * Uses `window.getComputedStyle`.
     *
     * @return {number}
     *         The computed height of the component's element.
     */
    currentHeight() {
      return this.currentDimension('height');
    }

    /**
     * Set the focus to this component
     */
    focus() {
      this.el_.focus();
    }

    /**
     * Remove the focus from this component
     */
    blur() {
      this.el_.blur();
    }

    /**
     * When this Component receives a `keydown` event which it does not process,
     *  it passes the event to the Player for handling.
     *
     * @param {KeyboardEvent} event
     *        The `keydown` event that caused this function to be called.
     */
    handleKeyDown(event) {
      if (this.player_) {
        // We only stop propagation here because we want unhandled events to fall
        // back to the browser. Exclude Tab for focus trapping.
        if (!keycode.isEventKey(event, 'Tab')) {
          event.stopPropagation();
        }
        this.player_.handleKeyDown(event);
      }
    }

    /**
     * Many components used to have a `handleKeyPress` method, which was poorly
     * named because it listened to a `keydown` event. This method name now
     * delegates to `handleKeyDown`. This means anyone calling `handleKeyPress`
     * will not see their method calls stop working.
     *
     * @param {Event} event
     *        The event that caused this function to be called.
     */
    handleKeyPress(event) {
      this.handleKeyDown(event);
    }

    /**
     * Emit a 'tap' events when touch event support gets detected. This gets used to
     * support toggling the controls through a tap on the video. They get enabled
     * because every sub-component would have extra overhead otherwise.
     *
     * @private
     * @fires Component#tap
     * @listens Component#touchstart
     * @listens Component#touchmove
     * @listens Component#touchleave
     * @listens Component#touchcancel
     * @listens Component#touchend
      */
    emitTapEvents() {
      // Track the start time so we can determine how long the touch lasted
      let touchStart = 0;
      let firstTouch = null;

      // Maximum movement allowed during a touch event to still be considered a tap
      // Other popular libs use anywhere from 2 (hammer.js) to 15,
      // so 10 seems like a nice, round number.
      const tapMovementThreshold = 10;

      // The maximum length a touch can be while still being considered a tap
      const touchTimeThreshold = 200;
      let couldBeTap;
      this.on('touchstart', function (event) {
        // If more than one finger, don't consider treating this as a click
        if (event.touches.length === 1) {
          // Copy pageX/pageY from the object
          firstTouch = {
            pageX: event.touches[0].pageX,
            pageY: event.touches[0].pageY
          };
          // Record start time so we can detect a tap vs. "touch and hold"
          touchStart = window.performance.now();
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
          const xdiff = event.touches[0].pageX - firstTouch.pageX;
          const ydiff = event.touches[0].pageY - firstTouch.pageY;
          const touchDistance = Math.sqrt(xdiff * xdiff + ydiff * ydiff);
          if (touchDistance > tapMovementThreshold) {
            couldBeTap = false;
          }
        }
      });
      const noTap = function () {
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
          const touchTime = window.performance.now() - touchStart;

          // Make sure the touch was less than the threshold to be considered a tap
          if (touchTime < touchTimeThreshold) {
            // Don't let browser turn this into a click
            event.preventDefault();
            /**
             * Triggered when a `Component` is tapped.
             *
             * @event Component#tap
             * @type {MouseEvent}
             */
            this.trigger('tap');
            // It may be good to copy the touchend event object and change the
            // type to tap, if the other event properties aren't exact after
            // Events.fixEvent runs (e.g. event.target)
          }
        }
      });
    }

    /**
     * This function reports user activity whenever touch events happen. This can get
     * turned off by any sub-components that wants touch events to act another way.
     *
     * Report user touch activity when touch events occur. User activity gets used to
     * determine when controls should show/hide. It is simple when it comes to mouse
     * events, because any mouse event should show the controls. So we capture mouse
     * events that bubble up to the player and report activity when that happens.
     * With touch events it isn't as easy as `touchstart` and `touchend` toggle player
     * controls. So touch events can't help us at the player level either.
     *
     * User activity gets checked asynchronously. So what could happen is a tap event
     * on the video turns the controls off. Then the `touchend` event bubbles up to
     * the player. Which, if it reported user activity, would turn the controls right
     * back on. We also don't want to completely block touch events from bubbling up.
     * Furthermore a `touchmove` event and anything other than a tap, should not turn
     * controls back on.
     *
     * @listens Component#touchstart
     * @listens Component#touchmove
     * @listens Component#touchend
     * @listens Component#touchcancel
     */
    enableTouchActivity() {
      // Don't continue if the root player doesn't support reporting user activity
      if (!this.player() || !this.player().reportUserActivity) {
        return;
      }

      // listener for reporting that the user is active
      const report = bind_(this.player(), this.player().reportUserActivity);
      let touchHolding;
      this.on('touchstart', function () {
        report();
        // For as long as the they are touching the device or have their mouse down,
        // we consider them active even if they're not moving their finger or mouse.
        // So we want to continue to update that they are active
        this.clearInterval(touchHolding);
        // report at the same interval as activityCheck
        touchHolding = this.setInterval(report, 250);
      });
      const touchEnd = function (event) {
        report();
        // stop the interval that maintains activity if the touch is holding
        this.clearInterval(touchHolding);
      };
      this.on('touchmove', report);
      this.on('touchend', touchEnd);
      this.on('touchcancel', touchEnd);
    }

    /**
     * A callback that has no parameters and is bound into `Component`s context.
     *
     * @callback Component~GenericCallback
     * @this Component
     */

    /**
     * Creates a function that runs after an `x` millisecond timeout. This function is a
     * wrapper around `window.setTimeout`. There are a few reasons to use this one
     * instead though:
     * 1. It gets cleared via  {@link Component#clearTimeout} when
     *    {@link Component#dispose} gets called.
     * 2. The function callback will gets turned into a {@link Component~GenericCallback}
     *
     * > Note: You can't use `window.clearTimeout` on the id returned by this function. This
     *         will cause its dispose listener not to get cleaned up! Please use
     *         {@link Component#clearTimeout} or {@link Component#dispose} instead.
     *
     * @param {Component~GenericCallback} fn
     *        The function that will be run after `timeout`.
     *
     * @param {number} timeout
     *        Timeout in milliseconds to delay before executing the specified function.
     *
     * @return {number}
     *         Returns a timeout ID that gets used to identify the timeout. It can also
     *         get used in {@link Component#clearTimeout} to clear the timeout that
     *         was set.
     *
     * @listens Component#dispose
     * @see [Similar to]{@link https://developer.mozilla.org/en-US/docs/Web/API/WindowTimers/setTimeout}
     */
    setTimeout(fn, timeout) {
      // declare as variables so they are properly available in timeout function
      // eslint-disable-next-line
      var timeoutId;
      fn = bind_(this, fn);
      this.clearTimersOnDispose_();
      timeoutId = window.setTimeout(() => {
        if (this.setTimeoutIds_.has(timeoutId)) {
          this.setTimeoutIds_.delete(timeoutId);
        }
        fn();
      }, timeout);
      this.setTimeoutIds_.add(timeoutId);
      return timeoutId;
    }

    /**
     * Clears a timeout that gets created via `window.setTimeout` or
     * {@link Component#setTimeout}. If you set a timeout via {@link Component#setTimeout}
     * use this function instead of `window.clearTimout`. If you don't your dispose
     * listener will not get cleaned up until {@link Component#dispose}!
     *
     * @param {number} timeoutId
     *        The id of the timeout to clear. The return value of
     *        {@link Component#setTimeout} or `window.setTimeout`.
     *
     * @return {number}
     *         Returns the timeout id that was cleared.
     *
     * @see [Similar to]{@link https://developer.mozilla.org/en-US/docs/Web/API/WindowTimers/clearTimeout}
     */
    clearTimeout(timeoutId) {
      if (this.setTimeoutIds_.has(timeoutId)) {
        this.setTimeoutIds_.delete(timeoutId);
        window.clearTimeout(timeoutId);
      }
      return timeoutId;
    }

    /**
     * Creates a function that gets run every `x` milliseconds. This function is a wrapper
     * around `window.setInterval`. There are a few reasons to use this one instead though.
     * 1. It gets cleared via  {@link Component#clearInterval} when
     *    {@link Component#dispose} gets called.
     * 2. The function callback will be a {@link Component~GenericCallback}
     *
     * @param {Component~GenericCallback} fn
     *        The function to run every `x` seconds.
     *
     * @param {number} interval
     *        Execute the specified function every `x` milliseconds.
     *
     * @return {number}
     *         Returns an id that can be used to identify the interval. It can also be be used in
     *         {@link Component#clearInterval} to clear the interval.
     *
     * @listens Component#dispose
     * @see [Similar to]{@link https://developer.mozilla.org/en-US/docs/Web/API/WindowTimers/setInterval}
     */
    setInterval(fn, interval) {
      fn = bind_(this, fn);
      this.clearTimersOnDispose_();
      const intervalId = window.setInterval(fn, interval);
      this.setIntervalIds_.add(intervalId);
      return intervalId;
    }

    /**
     * Clears an interval that gets created via `window.setInterval` or
     * {@link Component#setInterval}. If you set an interval via {@link Component#setInterval}
     * use this function instead of `window.clearInterval`. If you don't your dispose
     * listener will not get cleaned up until {@link Component#dispose}!
     *
     * @param {number} intervalId
     *        The id of the interval to clear. The return value of
     *        {@link Component#setInterval} or `window.setInterval`.
     *
     * @return {number}
     *         Returns the interval id that was cleared.
     *
     * @see [Similar to]{@link https://developer.mozilla.org/en-US/docs/Web/API/WindowTimers/clearInterval}
     */
    clearInterval(intervalId) {
      if (this.setIntervalIds_.has(intervalId)) {
        this.setIntervalIds_.delete(intervalId);
        window.clearInterval(intervalId);
      }
      return intervalId;
    }

    /**
     * Queues up a callback to be passed to requestAnimationFrame (rAF), but
     * with a few extra bonuses:
     *
     * - Supports browsers that do not support rAF by falling back to
     *   {@link Component#setTimeout}.
     *
     * - The callback is turned into a {@link Component~GenericCallback} (i.e.
     *   bound to the component).
     *
     * - Automatic cancellation of the rAF callback is handled if the component
     *   is disposed before it is called.
     *
     * @param  {Component~GenericCallback} fn
     *         A function that will be bound to this component and executed just
     *         before the browser's next repaint.
     *
     * @return {number}
     *         Returns an rAF ID that gets used to identify the timeout. It can
     *         also be used in {@link Component#cancelAnimationFrame} to cancel
     *         the animation frame callback.
     *
     * @listens Component#dispose
     * @see [Similar to]{@link https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame}
     */
    requestAnimationFrame(fn) {
      this.clearTimersOnDispose_();

      // declare as variables so they are properly available in rAF function
      // eslint-disable-next-line
      var id;
      fn = bind_(this, fn);
      id = window.requestAnimationFrame(() => {
        if (this.rafIds_.has(id)) {
          this.rafIds_.delete(id);
        }
        fn();
      });
      this.rafIds_.add(id);
      return id;
    }

    /**
     * Request an animation frame, but only one named animation
     * frame will be queued. Another will never be added until
     * the previous one finishes.
     *
     * @param {string} name
     *        The name to give this requestAnimationFrame
     *
     * @param  {Component~GenericCallback} fn
     *         A function that will be bound to this component and executed just
     *         before the browser's next repaint.
     */
    requestNamedAnimationFrame(name, fn) {
      if (this.namedRafs_.has(name)) {
        return;
      }
      this.clearTimersOnDispose_();
      fn = bind_(this, fn);
      const id = this.requestAnimationFrame(() => {
        fn();
        if (this.namedRafs_.has(name)) {
          this.namedRafs_.delete(name);
        }
      });
      this.namedRafs_.set(name, id);
      return name;
    }

    /**
     * Cancels a current named animation frame if it exists.
     *
     * @param {string} name
     *        The name of the requestAnimationFrame to cancel.
     */
    cancelNamedAnimationFrame(name) {
      if (!this.namedRafs_.has(name)) {
        return;
      }
      this.cancelAnimationFrame(this.namedRafs_.get(name));
      this.namedRafs_.delete(name);
    }

    /**
     * Cancels a queued callback passed to {@link Component#requestAnimationFrame}
     * (rAF).
     *
     * If you queue an rAF callback via {@link Component#requestAnimationFrame},
     * use this function instead of `window.cancelAnimationFrame`. If you don't,
     * your dispose listener will not get cleaned up until {@link Component#dispose}!
     *
     * @param {number} id
     *        The rAF ID to clear. The return value of {@link Component#requestAnimationFrame}.
     *
     * @return {number}
     *         Returns the rAF ID that was cleared.
     *
     * @see [Similar to]{@link https://developer.mozilla.org/en-US/docs/Web/API/window/cancelAnimationFrame}
     */
    cancelAnimationFrame(id) {
      if (this.rafIds_.has(id)) {
        this.rafIds_.delete(id);
        window.cancelAnimationFrame(id);
      }
      return id;
    }

    /**
     * A function to setup `requestAnimationFrame`, `setTimeout`,
     * and `setInterval`, clearing on dispose.
     *
     * > Previously each timer added and removed dispose listeners on it's own.
     * For better performance it was decided to batch them all, and use `Set`s
     * to track outstanding timer ids.
     *
     * @private
     */
    clearTimersOnDispose_() {
      if (this.clearingTimersOnDispose_) {
        return;
      }
      this.clearingTimersOnDispose_ = true;
      this.one('dispose', () => {
        [['namedRafs_', 'cancelNamedAnimationFrame'], ['rafIds_', 'cancelAnimationFrame'], ['setTimeoutIds_', 'clearTimeout'], ['setIntervalIds_', 'clearInterval']].forEach(([idName, cancelName]) => {
          // for a `Set` key will actually be the value again
          // so forEach((val, val) =>` but for maps we want to use
          // the key.
          this[idName].forEach((val, key) => this[cancelName](key));
        });
        this.clearingTimersOnDispose_ = false;
      });
    }

    /**
     * Register a `Component` with `videojs` given the name and the component.
     *
     * > NOTE: {@link Tech}s should not be registered as a `Component`. {@link Tech}s
     *         should be registered using {@link Tech.registerTech} or
     *         {@link videojs:videojs.registerTech}.
     *
     * > NOTE: This function can also be seen on videojs as
     *         {@link videojs:videojs.registerComponent}.
     *
     * @param {string} name
     *        The name of the `Component` to register.
     *
     * @param {Component} ComponentToRegister
     *        The `Component` class to register.
     *
     * @return {Component}
     *         The `Component` that was registered.
     */
    static registerComponent(name, ComponentToRegister) {
      if (typeof name !== 'string' || !name) {
        throw new Error(`Illegal component name, "${name}"; must be a non-empty string.`);
      }
      const Tech = Component.getComponent('Tech');

      // We need to make sure this check is only done if Tech has been registered.
      const isTech = Tech && Tech.isTech(ComponentToRegister);
      const isComp = Component === ComponentToRegister || Component.prototype.isPrototypeOf(ComponentToRegister.prototype);
      if (isTech || !isComp) {
        let reason;
        if (isTech) {
          reason = 'techs must be registered using Tech.registerTech()';
        } else {
          reason = 'must be a Component subclass';
        }
        throw new Error(`Illegal component, "${name}"; ${reason}.`);
      }
      name = toTitleCase(name);
      if (!Component.components_) {
        Component.components_ = {};
      }
      const Player = Component.getComponent('Player');
      if (name === 'Player' && Player && Player.players) {
        const players = Player.players;
        const playerNames = Object.keys(players);

        // If we have players that were disposed, then their name will still be
        // in Players.players. So, we must loop through and verify that the value
        // for each item is not null. This allows registration of the Player component
        // after all players have been disposed or before any were created.
        if (players && playerNames.length > 0 && playerNames.map(pname => players[pname]).every(Boolean)) {
          throw new Error('Can not register Player component after player has been created.');
        }
      }
      Component.components_[name] = ComponentToRegister;
      Component.components_[toLowerCase(name)] = ComponentToRegister;
      return ComponentToRegister;
    }

    /**
     * Get a `Component` based on the name it was registered with.
     *
     * @param {string} name
     *        The Name of the component to get.
     *
     * @return {Component}
     *         The `Component` that got registered under the given name.
     */
    static getComponent(name) {
      if (!name || !Component.components_) {
        return;
      }
      return Component.components_[name];
    }
  }
  Component.registerComponent('Component', Component);

  /**
   * @file time.js
   * @module time
   */

  /**
   * Returns the time for the specified index at the start or end
   * of a TimeRange object.
   *
   * @typedef    {Function} TimeRangeIndex
   *
   * @param      {number} [index=0]
   *             The range number to return the time for.
   *
   * @return     {number}
   *             The time offset at the specified index.
   *
   * @deprecated The index argument must be provided.
   *             In the future, leaving it out will throw an error.
   */

  /**
   * An object that contains ranges of time, which mimics {@link TimeRanges}.
   *
   * @typedef  {Object} TimeRange
   *
   * @property {number} length
   *           The number of time ranges represented by this object.
   *
   * @property {module:time~TimeRangeIndex} start
   *           Returns the time offset at which a specified time range begins.
   *
   * @property {module:time~TimeRangeIndex} end
   *           Returns the time offset at which a specified time range ends.
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/API/TimeRanges
   */

  /**
   * Check if any of the time ranges are over the maximum index.
   *
   * @private
   * @param   {string} fnName
   *          The function name to use for logging
   *
   * @param   {number} index
   *          The index to check
   *
   * @param   {number} maxIndex
   *          The maximum possible index
   *
   * @throws  {Error} if the timeRanges provided are over the maxIndex
   */
  function rangeCheck(fnName, index, maxIndex) {
    if (typeof index !== 'number' || index < 0 || index > maxIndex) {
      throw new Error(`Failed to execute '${fnName}' on 'TimeRanges': The index provided (${index}) is non-numeric or out of bounds (0-${maxIndex}).`);
    }
  }

  /**
   * Get the time for the specified index at the start or end
   * of a TimeRange object.
   *
   * @private
   * @param      {string} fnName
   *             The function name to use for logging
   *
   * @param      {string} valueIndex
   *             The property that should be used to get the time. should be
   *             'start' or 'end'
   *
   * @param      {Array} ranges
   *             An array of time ranges
   *
   * @param      {Array} [rangeIndex=0]
   *             The index to start the search at
   *
   * @return     {number}
   *             The time that offset at the specified index.
   *
   * @deprecated rangeIndex must be set to a value, in the future this will throw an error.
   * @throws     {Error} if rangeIndex is more than the length of ranges
   */
  function getRange(fnName, valueIndex, ranges, rangeIndex) {
    rangeCheck(fnName, rangeIndex, ranges.length - 1);
    return ranges[rangeIndex][valueIndex];
  }

  /**
   * Create a time range object given ranges of time.
   *
   * @private
   * @param   {Array} [ranges]
   *          An array of time ranges.
   *
   * @return  {TimeRange}
   */
  function createTimeRangesObj(ranges) {
    let timeRangesObj;
    if (ranges === undefined || ranges.length === 0) {
      timeRangesObj = {
        length: 0,
        start() {
          throw new Error('This TimeRanges object is empty');
        },
        end() {
          throw new Error('This TimeRanges object is empty');
        }
      };
    } else {
      timeRangesObj = {
        length: ranges.length,
        start: getRange.bind(null, 'start', 0, ranges),
        end: getRange.bind(null, 'end', 1, ranges)
      };
    }
    if (window.Symbol && window.Symbol.iterator) {
      timeRangesObj[window.Symbol.iterator] = () => (ranges || []).values();
    }
    return timeRangesObj;
  }

  /**
   * Create a `TimeRange` object which mimics an
   * {@link https://developer.mozilla.org/en-US/docs/Web/API/TimeRanges|HTML5 TimeRanges instance}.
   *
   * @param {number|Array[]} start
   *        The start of a single range (a number) or an array of ranges (an
   *        array of arrays of two numbers each).
   *
   * @param {number} end
   *        The end of a single range. Cannot be used with the array form of
   *        the `start` argument.
   *
   * @return {TimeRange}
   */
  function createTimeRanges(start, end) {
    if (Array.isArray(start)) {
      return createTimeRangesObj(start);
    } else if (start === undefined || end === undefined) {
      return createTimeRangesObj();
    }
    return createTimeRangesObj([[start, end]]);
  }

  /**
   * Format seconds as a time string, H:MM:SS or M:SS. Supplying a guide (in
   * seconds) will force a number of leading zeros to cover the length of the
   * guide.
   *
   * @private
   * @param  {number} seconds
   *         Number of seconds to be turned into a string
   *
   * @param  {number} guide
   *         Number (in seconds) to model the string after
   *
   * @return {string}
   *         Time formatted as H:MM:SS or M:SS
   */
  const defaultImplementation = function (seconds, guide) {
    seconds = seconds < 0 ? 0 : seconds;
    let s = Math.floor(seconds % 60);
    let m = Math.floor(seconds / 60 % 60);
    let h = Math.floor(seconds / 3600);
    const gm = Math.floor(guide / 60 % 60);
    const gh = Math.floor(guide / 3600);

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
  };

  // Internal pointer to the current implementation.
  let implementation = defaultImplementation;

  /**
   * Replaces the default formatTime implementation with a custom implementation.
   *
   * @param {Function} customImplementation
   *        A function which will be used in place of the default formatTime
   *        implementation. Will receive the current time in seconds and the
   *        guide (in seconds) as arguments.
   */
  function setFormatTime(customImplementation) {
    implementation = customImplementation;
  }

  /**
   * Resets formatTime to the default implementation.
   */
  function resetFormatTime() {
    implementation = defaultImplementation;
  }

  /**
   * Delegates to either the default time formatting function or a custom
   * function supplied via `setFormatTime`.
   *
   * Formats seconds as a time string (H:MM:SS or M:SS). Supplying a
   * guide (in seconds) will force a number of leading zeros to cover the
   * length of the guide.
   *
   * @example  formatTime(125, 600) === "02:05"
   * @param    {number} seconds
   *           Number of seconds to be turned into a string
   *
   * @param    {number} guide
   *           Number (in seconds) to model the string after
   *
   * @return   {string}
   *           Time formatted as H:MM:SS or M:SS
   */
  function formatTime(seconds, guide = seconds) {
    return implementation(seconds, guide);
  }

  var Time = /*#__PURE__*/Object.freeze({
    __proto__: null,
    createTimeRanges: createTimeRanges,
    createTimeRange: createTimeRanges,
    setFormatTime: setFormatTime,
    resetFormatTime: resetFormatTime,
    formatTime: formatTime
  });

  /**
   * @file buffer.js
   * @module buffer
   */

  /**
   * Compute the percentage of the media that has been buffered.
   *
   * @param { import('./time').TimeRange } buffered
   *        The current `TimeRanges` object representing buffered time ranges
   *
   * @param {number} duration
   *        Total duration of the media
   *
   * @return {number}
   *         Percent buffered of the total duration in decimal form.
   */
  function bufferedPercent(buffered, duration) {
    let bufferedDuration = 0;
    let start;
    let end;
    if (!duration) {
      return 0;
    }
    if (!buffered || !buffered.length) {
      buffered = createTimeRanges(0, 0);
    }
    for (let i = 0; i < buffered.length; i++) {
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

  /**
   * @file media-error.js
   */

  /**
   * A Custom `MediaError` class which mimics the standard HTML5 `MediaError` class.
   *
   * @param {number|string|Object|MediaError} value
   *        This can be of multiple types:
   *        - number: should be a standard error code
   *        - string: an error message (the code will be 0)
   *        - Object: arbitrary properties
   *        - `MediaError` (native): used to populate a video.js `MediaError` object
   *        - `MediaError` (video.js): will return itself if it's already a
   *          video.js `MediaError` object.
   *
   * @see [MediaError Spec]{@link https://dev.w3.org/html5/spec-author-view/video.html#mediaerror}
   * @see [Encrypted MediaError Spec]{@link https://www.w3.org/TR/2013/WD-encrypted-media-20130510/#error-codes}
   *
   * @class MediaError
   */
  function MediaError(value) {
    // Allow redundant calls to this constructor to avoid having `instanceof`
    // checks peppered around the code.
    if (value instanceof MediaError) {
      return value;
    }
    if (typeof value === 'number') {
      this.code = value;
    } else if (typeof value === 'string') {
      // default code is zero, so this is a custom error
      this.message = value;
    } else if (isObject(value)) {
      // We assign the `code` property manually because native `MediaError` objects
      // do not expose it as an own/enumerable property of the object.
      if (typeof value.code === 'number') {
        this.code = value.code;
      }
      Object.assign(this, value);
    }
    if (!this.message) {
      this.message = MediaError.defaultMessages[this.code] || '';
    }
  }

  /**
   * The error code that refers two one of the defined `MediaError` types
   *
   * @type {Number}
   */
  MediaError.prototype.code = 0;

  /**
   * An optional message that to show with the error. Message is not part of the HTML5
   * video spec but allows for more informative custom errors.
   *
   * @type {String}
   */
  MediaError.prototype.message = '';

  /**
   * An optional status code that can be set by plugins to allow even more detail about
   * the error. For example a plugin might provide a specific HTTP status code and an
   * error message for that code. Then when the plugin gets that error this class will
   * know how to display an error message for it. This allows a custom message to show
   * up on the `Player` error overlay.
   *
   * @type {Array}
   */
  MediaError.prototype.status = null;

  /**
   * Errors indexed by the W3C standard. The order **CANNOT CHANGE**! See the
   * specification listed under {@link MediaError} for more information.
   *
   * @enum {array}
   * @readonly
   * @property {string} 0 - MEDIA_ERR_CUSTOM
   * @property {string} 1 - MEDIA_ERR_ABORTED
   * @property {string} 2 - MEDIA_ERR_NETWORK
   * @property {string} 3 - MEDIA_ERR_DECODE
   * @property {string} 4 - MEDIA_ERR_SRC_NOT_SUPPORTED
   * @property {string} 5 - MEDIA_ERR_ENCRYPTED
   */
  MediaError.errorTypes = ['MEDIA_ERR_CUSTOM', 'MEDIA_ERR_ABORTED', 'MEDIA_ERR_NETWORK', 'MEDIA_ERR_DECODE', 'MEDIA_ERR_SRC_NOT_SUPPORTED', 'MEDIA_ERR_ENCRYPTED'];

  /**
   * The default `MediaError` messages based on the {@link MediaError.errorTypes}.
   *
   * @type {Array}
   * @constant
   */
  MediaError.defaultMessages = {
    1: 'You aborted the media playback',
    2: 'A network error caused the media download to fail part-way.',
    3: 'The media playback was aborted due to a corruption problem or because the media used features your browser did not support.',
    4: 'The media could not be loaded, either because the server or network failed or because the format is not supported.',
    5: 'The media is encrypted and we do not have the keys to decrypt it.'
  };

  // Add types as properties on MediaError
  // e.g. MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED = 4;
  for (let errNum = 0; errNum < MediaError.errorTypes.length; errNum++) {
    MediaError[MediaError.errorTypes[errNum]] = errNum;
    // values should be accessible on both the class and instance
    MediaError.prototype[MediaError.errorTypes[errNum]] = errNum;
  }

  var tuple = SafeParseTuple;
  function SafeParseTuple(obj, reviver) {
    var json;
    var error = null;
    try {
      json = JSON.parse(obj, reviver);
    } catch (err) {
      error = err;
    }
    return [error, json];
  }

  /**
   * Returns whether an object is `Promise`-like (i.e. has a `then` method).
   *
   * @param  {Object}  value
   *         An object that may or may not be `Promise`-like.
   *
   * @return {boolean}
   *         Whether or not the object is `Promise`-like.
   */
  function isPromise(value) {
    return value !== undefined && value !== null && typeof value.then === 'function';
  }

  /**
   * Silence a Promise-like object.
   *
   * This is useful for avoiding non-harmful, but potentially confusing "uncaught
   * play promise" rejection error messages.
   *
   * @param  {Object} value
   *         An object that may or may not be `Promise`-like.
   */
  function silencePromise(value) {
    if (isPromise(value)) {
      value.then(null, e => {});
    }
  }

  /**
   * @file text-track-list-converter.js Utilities for capturing text track state and
   * re-creating tracks based on a capture.
   *
   * @module text-track-list-converter
   */

  /**
   * Examine a single {@link TextTrack} and return a JSON-compatible javascript object that
   * represents the {@link TextTrack}'s state.
   *
   * @param {TextTrack} track
   *        The text track to query.
   *
   * @return {Object}
   *         A serializable javascript representation of the TextTrack.
   * @private
   */
  const trackToJson_ = function (track) {
    const ret = ['kind', 'label', 'language', 'id', 'inBandMetadataTrackDispatchType', 'mode', 'src'].reduce((acc, prop, i) => {
      if (track[prop]) {
        acc[prop] = track[prop];
      }
      return acc;
    }, {
      cues: track.cues && Array.prototype.map.call(track.cues, function (cue) {
        return {
          startTime: cue.startTime,
          endTime: cue.endTime,
          text: cue.text,
          id: cue.id
        };
      })
    });
    return ret;
  };

  /**
   * Examine a {@link Tech} and return a JSON-compatible javascript array that represents the
   * state of all {@link TextTrack}s currently configured. The return array is compatible with
   * {@link text-track-list-converter:jsonToTextTracks}.
   *
   * @param { import('../tech/tech').default } tech
   *        The tech object to query
   *
   * @return {Array}
   *         A serializable javascript representation of the {@link Tech}s
   *         {@link TextTrackList}.
   */
  const textTracksToJson = function (tech) {
    const trackEls = tech.$$('track');
    const trackObjs = Array.prototype.map.call(trackEls, t => t.track);
    const tracks = Array.prototype.map.call(trackEls, function (trackEl) {
      const json = trackToJson_(trackEl.track);
      if (trackEl.src) {
        json.src = trackEl.src;
      }
      return json;
    });
    return tracks.concat(Array.prototype.filter.call(tech.textTracks(), function (track) {
      return trackObjs.indexOf(track) === -1;
    }).map(trackToJson_));
  };

  /**
   * Create a set of remote {@link TextTrack}s on a {@link Tech} based on an array of javascript
   * object {@link TextTrack} representations.
   *
   * @param {Array} json
   *        An array of `TextTrack` representation objects, like those that would be
   *        produced by `textTracksToJson`.
   *
   * @param {Tech} tech
   *        The `Tech` to create the `TextTrack`s on.
   */
  const jsonToTextTracks = function (json, tech) {
    json.forEach(function (track) {
      const addedTrack = tech.addRemoteTextTrack(track).track;
      if (!track.src && track.cues) {
        track.cues.forEach(cue => addedTrack.addCue(cue));
      }
    });
    return tech.textTracks();
  };
  var textTrackConverter = {
    textTracksToJson,
    jsonToTextTracks,
    trackToJson_
  };

  /**
   * @file modal-dialog.js
   */
  const MODAL_CLASS_NAME = 'vjs-modal-dialog';

  /**
   * The `ModalDialog` displays over the video and its controls, which blocks
   * interaction with the player until it is closed.
   *
   * Modal dialogs include a "Close" button and will close when that button
   * is activated - or when ESC is pressed anywhere.
   *
   * @extends Component
   */
  class ModalDialog extends Component {
    /**
     * Create an instance of this class.
     *
     * @param { import('./player').default } player
     *        The `Player` that this class should be attached to.
     *
     * @param {Object} [options]
     *        The key/value store of player options.
     *
     * @param { import('./utils/dom').ContentDescriptor} [options.content=undefined]
     *        Provide customized content for this modal.
     *
     * @param {string} [options.description]
     *        A text description for the modal, primarily for accessibility.
     *
     * @param {boolean} [options.fillAlways=false]
     *        Normally, modals are automatically filled only the first time
     *        they open. This tells the modal to refresh its content
     *        every time it opens.
     *
     * @param {string} [options.label]
     *        A text label for the modal, primarily for accessibility.
     *
     * @param {boolean} [options.pauseOnOpen=true]
     *        If `true`, playback will will be paused if playing when
     *        the modal opens, and resumed when it closes.
     *
     * @param {boolean} [options.temporary=true]
     *        If `true`, the modal can only be opened once; it will be
     *        disposed as soon as it's closed.
     *
     * @param {boolean} [options.uncloseable=false]
     *        If `true`, the user will not be able to close the modal
     *        through the UI in the normal ways. Programmatic closing is
     *        still possible.
     */
    constructor(player, options) {
      super(player, options);
      this.handleKeyDown_ = e => this.handleKeyDown(e);
      this.close_ = e => this.close(e);
      this.opened_ = this.hasBeenOpened_ = this.hasBeenFilled_ = false;
      this.closeable(!this.options_.uncloseable);
      this.content(this.options_.content);

      // Make sure the contentEl is defined AFTER any children are initialized
      // because we only want the contents of the modal in the contentEl
      // (not the UI elements like the close button).
      this.contentEl_ = createEl('div', {
        className: `${MODAL_CLASS_NAME}-content`
      }, {
        role: 'document'
      });
      this.descEl_ = createEl('p', {
        className: `${MODAL_CLASS_NAME}-description vjs-control-text`,
        id: this.el().getAttribute('aria-describedby')
      });
      textContent(this.descEl_, this.description());
      this.el_.appendChild(this.descEl_);
      this.el_.appendChild(this.contentEl_);
    }

    /**
     * Create the `ModalDialog`'s DOM element
     *
     * @return {Element}
     *         The DOM element that gets created.
     */
    createEl() {
      return super.createEl('div', {
        className: this.buildCSSClass(),
        tabIndex: -1
      }, {
        'aria-describedby': `${this.id()}_description`,
        'aria-hidden': 'true',
        'aria-label': this.label(),
        'role': 'dialog'
      });
    }
    dispose() {
      this.contentEl_ = null;
      this.descEl_ = null;
      this.previouslyActiveEl_ = null;
      super.dispose();
    }

    /**
     * Builds the default DOM `className`.
     *
     * @return {string}
     *         The DOM `className` for this object.
     */
    buildCSSClass() {
      return `${MODAL_CLASS_NAME} vjs-hidden ${super.buildCSSClass()}`;
    }

    /**
     * Returns the label string for this modal. Primarily used for accessibility.
     *
     * @return {string}
     *         the localized or raw label of this modal.
     */
    label() {
      return this.localize(this.options_.label || 'Modal Window');
    }

    /**
     * Returns the description string for this modal. Primarily used for
     * accessibility.
     *
     * @return {string}
     *         The localized or raw description of this modal.
     */
    description() {
      let desc = this.options_.description || this.localize('This is a modal window.');

      // Append a universal closeability message if the modal is closeable.
      if (this.closeable()) {
        desc += ' ' + this.localize('This modal can be closed by pressing the Escape key or activating the close button.');
      }
      return desc;
    }

    /**
     * Opens the modal.
     *
     * @fires ModalDialog#beforemodalopen
     * @fires ModalDialog#modalopen
     */
    open() {
      if (!this.opened_) {
        const player = this.player();

        /**
          * Fired just before a `ModalDialog` is opened.
          *
          * @event ModalDialog#beforemodalopen
          * @type {Event}
          */
        this.trigger('beforemodalopen');
        this.opened_ = true;

        // Fill content if the modal has never opened before and
        // never been filled.
        if (this.options_.fillAlways || !this.hasBeenOpened_ && !this.hasBeenFilled_) {
          this.fill();
        }

        // If the player was playing, pause it and take note of its previously
        // playing state.
        this.wasPlaying_ = !player.paused();
        if (this.options_.pauseOnOpen && this.wasPlaying_) {
          player.pause();
        }
        this.on('keydown', this.handleKeyDown_);

        // Hide controls and note if they were enabled.
        this.hadControls_ = player.controls();
        player.controls(false);
        this.show();
        this.conditionalFocus_();
        this.el().setAttribute('aria-hidden', 'false');

        /**
          * Fired just after a `ModalDialog` is opened.
          *
          * @event ModalDialog#modalopen
          * @type {Event}
          */
        this.trigger('modalopen');
        this.hasBeenOpened_ = true;
      }
    }

    /**
     * If the `ModalDialog` is currently open or closed.
     *
     * @param  {boolean} [value]
     *         If given, it will open (`true`) or close (`false`) the modal.
     *
     * @return {boolean}
     *         the current open state of the modaldialog
     */
    opened(value) {
      if (typeof value === 'boolean') {
        this[value ? 'open' : 'close']();
      }
      return this.opened_;
    }

    /**
     * Closes the modal, does nothing if the `ModalDialog` is
     * not open.
     *
     * @fires ModalDialog#beforemodalclose
     * @fires ModalDialog#modalclose
     */
    close() {
      if (!this.opened_) {
        return;
      }
      const player = this.player();

      /**
        * Fired just before a `ModalDialog` is closed.
        *
        * @event ModalDialog#beforemodalclose
        * @type {Event}
        */
      this.trigger('beforemodalclose');
      this.opened_ = false;
      if (this.wasPlaying_ && this.options_.pauseOnOpen) {
        player.play();
      }
      this.off('keydown', this.handleKeyDown_);
      if (this.hadControls_) {
        player.controls(true);
      }
      this.hide();
      this.el().setAttribute('aria-hidden', 'true');

      /**
        * Fired just after a `ModalDialog` is closed.
        *
        * @event ModalDialog#modalclose
        * @type {Event}
        */
      this.trigger('modalclose');
      this.conditionalBlur_();
      if (this.options_.temporary) {
        this.dispose();
      }
    }

    /**
     * Check to see if the `ModalDialog` is closeable via the UI.
     *
     * @param  {boolean} [value]
     *         If given as a boolean, it will set the `closeable` option.
     *
     * @return {boolean}
     *         Returns the final value of the closable option.
     */
    closeable(value) {
      if (typeof value === 'boolean') {
        const closeable = this.closeable_ = !!value;
        let close = this.getChild('closeButton');

        // If this is being made closeable and has no close button, add one.
        if (closeable && !close) {
          // The close button should be a child of the modal - not its
          // content element, so temporarily change the content element.
          const temp = this.contentEl_;
          this.contentEl_ = this.el_;
          close = this.addChild('closeButton', {
            controlText: 'Close Modal Dialog'
          });
          this.contentEl_ = temp;
          this.on(close, 'close', this.close_);
        }

        // If this is being made uncloseable and has a close button, remove it.
        if (!closeable && close) {
          this.off(close, 'close', this.close_);
          this.removeChild(close);
          close.dispose();
        }
      }
      return this.closeable_;
    }

    /**
     * Fill the modal's content element with the modal's "content" option.
     * The content element will be emptied before this change takes place.
     */
    fill() {
      this.fillWith(this.content());
    }

    /**
     * Fill the modal's content element with arbitrary content.
     * The content element will be emptied before this change takes place.
     *
     * @fires ModalDialog#beforemodalfill
     * @fires ModalDialog#modalfill
     *
     * @param { import('./utils/dom').ContentDescriptor} [content]
     *        The same rules apply to this as apply to the `content` option.
     */
    fillWith(content) {
      const contentEl = this.contentEl();
      const parentEl = contentEl.parentNode;
      const nextSiblingEl = contentEl.nextSibling;

      /**
        * Fired just before a `ModalDialog` is filled with content.
        *
        * @event ModalDialog#beforemodalfill
        * @type {Event}
        */
      this.trigger('beforemodalfill');
      this.hasBeenFilled_ = true;

      // Detach the content element from the DOM before performing
      // manipulation to avoid modifying the live DOM multiple times.
      parentEl.removeChild(contentEl);
      this.empty();
      insertContent(contentEl, content);
      /**
       * Fired just after a `ModalDialog` is filled with content.
       *
       * @event ModalDialog#modalfill
       * @type {Event}
       */
      this.trigger('modalfill');

      // Re-inject the re-filled content element.
      if (nextSiblingEl) {
        parentEl.insertBefore(contentEl, nextSiblingEl);
      } else {
        parentEl.appendChild(contentEl);
      }

      // make sure that the close button is last in the dialog DOM
      const closeButton = this.getChild('closeButton');
      if (closeButton) {
        parentEl.appendChild(closeButton.el_);
      }
    }

    /**
     * Empties the content element. This happens anytime the modal is filled.
     *
     * @fires ModalDialog#beforemodalempty
     * @fires ModalDialog#modalempty
     */
    empty() {
      /**
      * Fired just before a `ModalDialog` is emptied.
      *
      * @event ModalDialog#beforemodalempty
      * @type {Event}
      */
      this.trigger('beforemodalempty');
      emptyEl(this.contentEl());

      /**
      * Fired just after a `ModalDialog` is emptied.
      *
      * @event ModalDialog#modalempty
      * @type {Event}
      */
      this.trigger('modalempty');
    }

    /**
     * Gets or sets the modal content, which gets normalized before being
     * rendered into the DOM.
     *
     * This does not update the DOM or fill the modal, but it is called during
     * that process.
     *
     * @param  { import('./utils/dom').ContentDescriptor} [value]
     *         If defined, sets the internal content value to be used on the
     *         next call(s) to `fill`. This value is normalized before being
     *         inserted. To "clear" the internal content value, pass `null`.
     *
     * @return { import('./utils/dom').ContentDescriptor}
     *         The current content of the modal dialog
     */
    content(value) {
      if (typeof value !== 'undefined') {
        this.content_ = value;
      }
      return this.content_;
    }

    /**
     * conditionally focus the modal dialog if focus was previously on the player.
     *
     * @private
     */
    conditionalFocus_() {
      const activeEl = document.activeElement;
      const playerEl = this.player_.el_;
      this.previouslyActiveEl_ = null;
      if (playerEl.contains(activeEl) || playerEl === activeEl) {
        this.previouslyActiveEl_ = activeEl;
        this.focus();
      }
    }

    /**
     * conditionally blur the element and refocus the last focused element
     *
     * @private
     */
    conditionalBlur_() {
      if (this.previouslyActiveEl_) {
        this.previouslyActiveEl_.focus();
        this.previouslyActiveEl_ = null;
      }
    }

    /**
     * Keydown handler. Attached when modal is focused.
     *
     * @listens keydown
     */
    handleKeyDown(event) {
      // Do not allow keydowns to reach out of the modal dialog.
      event.stopPropagation();
      if (keycode.isEventKey(event, 'Escape') && this.closeable()) {
        event.preventDefault();
        this.close();
        return;
      }

      // exit early if it isn't a tab key
      if (!keycode.isEventKey(event, 'Tab')) {
        return;
      }
      const focusableEls = this.focusableEls_();
      const activeEl = this.el_.querySelector(':focus');
      let focusIndex;
      for (let i = 0; i < focusableEls.length; i++) {
        if (activeEl === focusableEls[i]) {
          focusIndex = i;
          break;
        }
      }
      if (document.activeElement === this.el_) {
        focusIndex = 0;
      }
      if (event.shiftKey && focusIndex === 0) {
        focusableEls[focusableEls.length - 1].focus();
        event.preventDefault();
      } else if (!event.shiftKey && focusIndex === focusableEls.length - 1) {
        focusableEls[0].focus();
        event.preventDefault();
      }
    }

    /**
     * get all focusable elements
     *
     * @private
     */
    focusableEls_() {
      const allChildren = this.el_.querySelectorAll('*');
      return Array.prototype.filter.call(allChildren, child => {
        return (child instanceof window.HTMLAnchorElement || child instanceof window.HTMLAreaElement) && child.hasAttribute('href') || (child instanceof window.HTMLInputElement || child instanceof window.HTMLSelectElement || child instanceof window.HTMLTextAreaElement || child instanceof window.HTMLButtonElement) && !child.hasAttribute('disabled') || child instanceof window.HTMLIFrameElement || child instanceof window.HTMLObjectElement || child instanceof window.HTMLEmbedElement || child.hasAttribute('tabindex') && child.getAttribute('tabindex') !== -1 || child.hasAttribute('contenteditable');
      });
    }
  }

  /**
   * Default options for `ModalDialog` default options.
   *
   * @type {Object}
   * @private
   */
  ModalDialog.prototype.options_ = {
    pauseOnOpen: true,
    temporary: true
  };
  Component.registerComponent('ModalDialog', ModalDialog);

  /**
   * @file track-list.js
   */

  /**
   * Common functionaliy between {@link TextTrackList}, {@link AudioTrackList}, and
   * {@link VideoTrackList}
   *
   * @extends EventTarget
   */
  class TrackList extends EventTarget {
    /**
     * Create an instance of this class
     *
     * @param { import('./track').default[] } tracks
     *        A list of tracks to initialize the list with.
     *
     * @abstract
     */
    constructor(tracks = []) {
      super();
      this.tracks_ = [];

      /**
       * @memberof TrackList
       * @member {number} length
       *         The current number of `Track`s in the this Trackist.
       * @instance
       */
      Object.defineProperty(this, 'length', {
        get() {
          return this.tracks_.length;
        }
      });
      for (let i = 0; i < tracks.length; i++) {
        this.addTrack(tracks[i]);
      }
    }

    /**
     * Add a {@link Track} to the `TrackList`
     *
     * @param { import('./track').default } track
     *        The audio, video, or text track to add to the list.
     *
     * @fires TrackList#addtrack
     */
    addTrack(track) {
      const index = this.tracks_.length;
      if (!('' + index in this)) {
        Object.defineProperty(this, index, {
          get() {
            return this.tracks_[index];
          }
        });
      }

      // Do not add duplicate tracks
      if (this.tracks_.indexOf(track) === -1) {
        this.tracks_.push(track);
        /**
         * Triggered when a track is added to a track list.
         *
         * @event TrackList#addtrack
         * @type {Event}
         * @property {Track} track
         *           A reference to track that was added.
         */
        this.trigger({
          track,
          type: 'addtrack',
          target: this
        });
      }

      /**
       * Triggered when a track label is changed.
       *
       * @event TrackList#addtrack
       * @type {Event}
       * @property {Track} track
       *           A reference to track that was added.
       */
      track.labelchange_ = () => {
        this.trigger({
          track,
          type: 'labelchange',
          target: this
        });
      };
      if (isEvented(track)) {
        track.addEventListener('labelchange', track.labelchange_);
      }
    }

    /**
     * Remove a {@link Track} from the `TrackList`
     *
     * @param { import('./track').default } rtrack
     *        The audio, video, or text track to remove from the list.
     *
     * @fires TrackList#removetrack
     */
    removeTrack(rtrack) {
      let track;
      for (let i = 0, l = this.length; i < l; i++) {
        if (this[i] === rtrack) {
          track = this[i];
          if (track.off) {
            track.off();
          }
          this.tracks_.splice(i, 1);
          break;
        }
      }
      if (!track) {
        return;
      }

      /**
       * Triggered when a track is removed from track list.
       *
       * @event TrackList#removetrack
       * @type {Event}
       * @property {Track} track
       *           A reference to track that was removed.
       */
      this.trigger({
        track,
        type: 'removetrack',
        target: this
      });
    }

    /**
     * Get a Track from the TrackList by a tracks id
     *
     * @param {string} id - the id of the track to get
     * @method getTrackById
     * @return { import('./track').default }
     * @private
     */
    getTrackById(id) {
      let result = null;
      for (let i = 0, l = this.length; i < l; i++) {
        const track = this[i];
        if (track.id === id) {
          result = track;
          break;
        }
      }
      return result;
    }
  }

  /**
   * Triggered when a different track is selected/enabled.
   *
   * @event TrackList#change
   * @type {Event}
   */

  /**
   * Events that can be called with on + eventName. See {@link EventHandler}.
   *
   * @property {Object} TrackList#allowedEvents_
   * @private
   */
  TrackList.prototype.allowedEvents_ = {
    change: 'change',
    addtrack: 'addtrack',
    removetrack: 'removetrack',
    labelchange: 'labelchange'
  };

  // emulate attribute EventHandler support to allow for feature detection
  for (const event in TrackList.prototype.allowedEvents_) {
    TrackList.prototype['on' + event] = null;
  }

  /**
   * @file audio-track-list.js
   */

  /**
   * Anywhere we call this function we diverge from the spec
   * as we only support one enabled audiotrack at a time
   *
   * @param {AudioTrackList} list
   *        list to work on
   *
   * @param { import('./audio-track').default } track
   *        The track to skip
   *
   * @private
   */
  const disableOthers$1 = function (list, track) {
    for (let i = 0; i < list.length; i++) {
      if (!Object.keys(list[i]).length || track.id === list[i].id) {
        continue;
      }
      // another audio track is enabled, disable it
      list[i].enabled = false;
    }
  };

  /**
   * The current list of {@link AudioTrack} for a media file.
   *
   * @see [Spec]{@link https://html.spec.whatwg.org/multipage/embedded-content.html#audiotracklist}
   * @extends TrackList
   */
  class AudioTrackList extends TrackList {
    /**
     * Create an instance of this class.
     *
     * @param {AudioTrack[]} [tracks=[]]
     *        A list of `AudioTrack` to instantiate the list with.
     */
    constructor(tracks = []) {
      // make sure only 1 track is enabled
      // sorted from last index to first index
      for (let i = tracks.length - 1; i >= 0; i--) {
        if (tracks[i].enabled) {
          disableOthers$1(tracks, tracks[i]);
          break;
        }
      }
      super(tracks);
      this.changing_ = false;
    }

    /**
     * Add an {@link AudioTrack} to the `AudioTrackList`.
     *
     * @param { import('./audio-track').default } track
     *        The AudioTrack to add to the list
     *
     * @fires TrackList#addtrack
     */
    addTrack(track) {
      if (track.enabled) {
        disableOthers$1(this, track);
      }
      super.addTrack(track);
      // native tracks don't have this
      if (!track.addEventListener) {
        return;
      }
      track.enabledChange_ = () => {
        // when we are disabling other tracks (since we don't support
        // more than one track at a time) we will set changing_
        // to true so that we don't trigger additional change events
        if (this.changing_) {
          return;
        }
        this.changing_ = true;
        disableOthers$1(this, track);
        this.changing_ = false;
        this.trigger('change');
      };

      /**
       * @listens AudioTrack#enabledchange
       * @fires TrackList#change
       */
      track.addEventListener('enabledchange', track.enabledChange_);
    }
    removeTrack(rtrack) {
      super.removeTrack(rtrack);
      if (rtrack.removeEventListener && rtrack.enabledChange_) {
        rtrack.removeEventListener('enabledchange', rtrack.enabledChange_);
        rtrack.enabledChange_ = null;
      }
    }
  }

  /**
   * @file video-track-list.js
   */

  /**
   * Un-select all other {@link VideoTrack}s that are selected.
   *
   * @param {VideoTrackList} list
   *        list to work on
   *
   * @param { import('./video-track').default } track
   *        The track to skip
   *
   * @private
   */
  const disableOthers = function (list, track) {
    for (let i = 0; i < list.length; i++) {
      if (!Object.keys(list[i]).length || track.id === list[i].id) {
        continue;
      }
      // another video track is enabled, disable it
      list[i].selected = false;
    }
  };

  /**
   * The current list of {@link VideoTrack} for a video.
   *
   * @see [Spec]{@link https://html.spec.whatwg.org/multipage/embedded-content.html#videotracklist}
   * @extends TrackList
   */
  class VideoTrackList extends TrackList {
    /**
     * Create an instance of this class.
     *
     * @param {VideoTrack[]} [tracks=[]]
     *        A list of `VideoTrack` to instantiate the list with.
     */
    constructor(tracks = []) {
      // make sure only 1 track is enabled
      // sorted from last index to first index
      for (let i = tracks.length - 1; i >= 0; i--) {
        if (tracks[i].selected) {
          disableOthers(tracks, tracks[i]);
          break;
        }
      }
      super(tracks);
      this.changing_ = false;

      /**
       * @member {number} VideoTrackList#selectedIndex
       *         The current index of the selected {@link VideoTrack`}.
       */
      Object.defineProperty(this, 'selectedIndex', {
        get() {
          for (let i = 0; i < this.length; i++) {
            if (this[i].selected) {
              return i;
            }
          }
          return -1;
        },
        set() {}
      });
    }

    /**
     * Add a {@link VideoTrack} to the `VideoTrackList`.
     *
     * @param { import('./video-track').default } track
     *        The VideoTrack to add to the list
     *
     * @fires TrackList#addtrack
     */
    addTrack(track) {
      if (track.selected) {
        disableOthers(this, track);
      }
      super.addTrack(track);
      // native tracks don't have this
      if (!track.addEventListener) {
        return;
      }
      track.selectedChange_ = () => {
        if (this.changing_) {
          return;
        }
        this.changing_ = true;
        disableOthers(this, track);
        this.changing_ = false;
        this.trigger('change');
      };

      /**
       * @listens VideoTrack#selectedchange
       * @fires TrackList#change
       */
      track.addEventListener('selectedchange', track.selectedChange_);
    }
    removeTrack(rtrack) {
      super.removeTrack(rtrack);
      if (rtrack.removeEventListener && rtrack.selectedChange_) {
        rtrack.removeEventListener('selectedchange', rtrack.selectedChange_);
        rtrack.selectedChange_ = null;
      }
    }
  }

  /**
   * @file text-track-list.js
   */

  /**
   * The current list of {@link TextTrack} for a media file.
   *
   * @see [Spec]{@link https://html.spec.whatwg.org/multipage/embedded-content.html#texttracklist}
   * @extends TrackList
   */
  class TextTrackList extends TrackList {
    /**
     * Add a {@link TextTrack} to the `TextTrackList`
     *
     * @param { import('./text-track').default } track
     *        The text track to add to the list.
     *
     * @fires TrackList#addtrack
     */
    addTrack(track) {
      super.addTrack(track);
      if (!this.queueChange_) {
        this.queueChange_ = () => this.queueTrigger('change');
      }
      if (!this.triggerSelectedlanguagechange) {
        this.triggerSelectedlanguagechange_ = () => this.trigger('selectedlanguagechange');
      }

      /**
       * @listens TextTrack#modechange
       * @fires TrackList#change
       */
      track.addEventListener('modechange', this.queueChange_);
      const nonLanguageTextTrackKind = ['metadata', 'chapters'];
      if (nonLanguageTextTrackKind.indexOf(track.kind) === -1) {
        track.addEventListener('modechange', this.triggerSelectedlanguagechange_);
      }
    }
    removeTrack(rtrack) {
      super.removeTrack(rtrack);

      // manually remove the event handlers we added
      if (rtrack.removeEventListener) {
        if (this.queueChange_) {
          rtrack.removeEventListener('modechange', this.queueChange_);
        }
        if (this.selectedlanguagechange_) {
          rtrack.removeEventListener('modechange', this.triggerSelectedlanguagechange_);
        }
      }
    }
  }

  /**
   * @file html-track-element-list.js
   */

  /**
   * The current list of {@link HtmlTrackElement}s.
   */
  class HtmlTrackElementList {
    /**
     * Create an instance of this class.
     *
     * @param {HtmlTrackElement[]} [tracks=[]]
     *        A list of `HtmlTrackElement` to instantiate the list with.
     */
    constructor(trackElements = []) {
      this.trackElements_ = [];

      /**
       * @memberof HtmlTrackElementList
       * @member {number} length
       *         The current number of `Track`s in the this Trackist.
       * @instance
       */
      Object.defineProperty(this, 'length', {
        get() {
          return this.trackElements_.length;
        }
      });
      for (let i = 0, length = trackElements.length; i < length; i++) {
        this.addTrackElement_(trackElements[i]);
      }
    }

    /**
     * Add an {@link HtmlTrackElement} to the `HtmlTrackElementList`
     *
     * @param {HtmlTrackElement} trackElement
     *        The track element to add to the list.
     *
     * @private
     */
    addTrackElement_(trackElement) {
      const index = this.trackElements_.length;
      if (!('' + index in this)) {
        Object.defineProperty(this, index, {
          get() {
            return this.trackElements_[index];
          }
        });
      }

      // Do not add duplicate elements
      if (this.trackElements_.indexOf(trackElement) === -1) {
        this.trackElements_.push(trackElement);
      }
    }

    /**
     * Get an {@link HtmlTrackElement} from the `HtmlTrackElementList` given an
     * {@link TextTrack}.
     *
     * @param {TextTrack} track
     *        The track associated with a track element.
     *
     * @return {HtmlTrackElement|undefined}
     *         The track element that was found or undefined.
     *
     * @private
     */
    getTrackElementByTrack_(track) {
      let trackElement_;
      for (let i = 0, length = this.trackElements_.length; i < length; i++) {
        if (track === this.trackElements_[i].track) {
          trackElement_ = this.trackElements_[i];
          break;
        }
      }
      return trackElement_;
    }

    /**
     * Remove a {@link HtmlTrackElement} from the `HtmlTrackElementList`
     *
     * @param {HtmlTrackElement} trackElement
     *        The track element to remove from the list.
     *
     * @private
     */
    removeTrackElement_(trackElement) {
      for (let i = 0, length = this.trackElements_.length; i < length; i++) {
        if (trackElement === this.trackElements_[i]) {
          if (this.trackElements_[i].track && typeof this.trackElements_[i].track.off === 'function') {
            this.trackElements_[i].track.off();
          }
          if (typeof this.trackElements_[i].off === 'function') {
            this.trackElements_[i].off();
          }
          this.trackElements_.splice(i, 1);
          break;
        }
      }
    }
  }

  /**
   * @file text-track-cue-list.js
   */

  /**
   * @typedef {Object} TextTrackCueList~TextTrackCue
   *
   * @property {string} id
   *           The unique id for this text track cue
   *
   * @property {number} startTime
   *           The start time for this text track cue
   *
   * @property {number} endTime
   *           The end time for this text track cue
   *
   * @property {boolean} pauseOnExit
   *           Pause when the end time is reached if true.
   *
   * @see [Spec]{@link https://html.spec.whatwg.org/multipage/embedded-content.html#texttrackcue}
   */

  /**
   * A List of TextTrackCues.
   *
   * @see [Spec]{@link https://html.spec.whatwg.org/multipage/embedded-content.html#texttrackcuelist}
   */
  class TextTrackCueList {
    /**
     * Create an instance of this class..
     *
     * @param {Array} cues
     *        A list of cues to be initialized with
     */
    constructor(cues) {
      TextTrackCueList.prototype.setCues_.call(this, cues);

      /**
       * @memberof TextTrackCueList
       * @member {number} length
       *         The current number of `TextTrackCue`s in the TextTrackCueList.
       * @instance
       */
      Object.defineProperty(this, 'length', {
        get() {
          return this.length_;
        }
      });
    }

    /**
     * A setter for cues in this list. Creates getters
     * an an index for the cues.
     *
     * @param {Array} cues
     *        An array of cues to set
     *
     * @private
     */
    setCues_(cues) {
      const oldLength = this.length || 0;
      let i = 0;
      const l = cues.length;
      this.cues_ = cues;
      this.length_ = cues.length;
      const defineProp = function (index) {
        if (!('' + index in this)) {
          Object.defineProperty(this, '' + index, {
            get() {
              return this.cues_[index];
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
    }

    /**
     * Get a `TextTrackCue` that is currently in the `TextTrackCueList` by id.
     *
     * @param {string} id
     *        The id of the cue that should be searched for.
     *
     * @return {TextTrackCueList~TextTrackCue|null}
     *         A single cue or null if none was found.
     */
    getCueById(id) {
      let result = null;
      for (let i = 0, l = this.length; i < l; i++) {
        const cue = this[i];
        if (cue.id === id) {
          result = cue;
          break;
        }
      }
      return result;
    }
  }

  /**
   * @file track-kinds.js
   */

  /**
   * All possible `VideoTrackKind`s
   *
   * @see https://html.spec.whatwg.org/multipage/embedded-content.html#dom-videotrack-kind
   * @typedef VideoTrack~Kind
   * @enum
   */
  const VideoTrackKind = {
    alternative: 'alternative',
    captions: 'captions',
    main: 'main',
    sign: 'sign',
    subtitles: 'subtitles',
    commentary: 'commentary'
  };

  /**
   * All possible `AudioTrackKind`s
   *
   * @see https://html.spec.whatwg.org/multipage/embedded-content.html#dom-audiotrack-kind
   * @typedef AudioTrack~Kind
   * @enum
   */
  const AudioTrackKind = {
    'alternative': 'alternative',
    'descriptions': 'descriptions',
    'main': 'main',
    'main-desc': 'main-desc',
    'translation': 'translation',
    'commentary': 'commentary'
  };

  /**
   * All possible `TextTrackKind`s
   *
   * @see https://html.spec.whatwg.org/multipage/embedded-content.html#dom-texttrack-kind
   * @typedef TextTrack~Kind
   * @enum
   */
  const TextTrackKind = {
    subtitles: 'subtitles',
    captions: 'captions',
    descriptions: 'descriptions',
    chapters: 'chapters',
    metadata: 'metadata'
  };

  /**
   * All possible `TextTrackMode`s
   *
   * @see https://html.spec.whatwg.org/multipage/embedded-content.html#texttrackmode
   * @typedef TextTrack~Mode
   * @enum
   */
  const TextTrackMode = {
    disabled: 'disabled',
    hidden: 'hidden',
    showing: 'showing'
  };

  /**
   * @file track.js
   */

  /**
   * A Track class that contains all of the common functionality for {@link AudioTrack},
   * {@link VideoTrack}, and {@link TextTrack}.
   *
   * > Note: This class should not be used directly
   *
   * @see {@link https://html.spec.whatwg.org/multipage/embedded-content.html}
   * @extends EventTarget
   * @abstract
   */
  class Track extends EventTarget {
    /**
     * Create an instance of this class.
     *
     * @param {Object} [options={}]
     *        Object of option names and values
     *
     * @param {string} [options.kind='']
     *        A valid kind for the track type you are creating.
     *
     * @param {string} [options.id='vjs_track_' + Guid.newGUID()]
     *        A unique id for this AudioTrack.
     *
     * @param {string} [options.label='']
     *        The menu label for this track.
     *
     * @param {string} [options.language='']
     *        A valid two character language code.
     *
     * @abstract
     */
    constructor(options = {}) {
      super();
      const trackProps = {
        id: options.id || 'vjs_track_' + newGUID(),
        kind: options.kind || '',
        language: options.language || ''
      };
      let label = options.label || '';

      /**
       * @memberof Track
       * @member {string} id
       *         The id of this track. Cannot be changed after creation.
       * @instance
       *
       * @readonly
       */

      /**
       * @memberof Track
       * @member {string} kind
       *         The kind of track that this is. Cannot be changed after creation.
       * @instance
       *
       * @readonly
       */

      /**
       * @memberof Track
       * @member {string} language
       *         The two letter language code for this track. Cannot be changed after
       *         creation.
       * @instance
       *
       * @readonly
       */

      for (const key in trackProps) {
        Object.defineProperty(this, key, {
          get() {
            return trackProps[key];
          },
          set() {}
        });
      }

      /**
       * @memberof Track
       * @member {string} label
       *         The label of this track. Cannot be changed after creation.
       * @instance
       *
       * @fires Track#labelchange
       */
      Object.defineProperty(this, 'label', {
        get() {
          return label;
        },
        set(newLabel) {
          if (newLabel !== label) {
            label = newLabel;

            /**
             * An event that fires when label changes on this track.
             *
             * > Note: This is not part of the spec!
             *
             * @event Track#labelchange
             * @type {Event}
             */
            this.trigger('labelchange');
          }
        }
      });
    }
  }

  /**
   * @file url.js
   * @module url
   */

  /**
   * @typedef {Object} url:URLObject
   *
   * @property {string} protocol
   *           The protocol of the url that was parsed.
   *
   * @property {string} hostname
   *           The hostname of the url that was parsed.
   *
   * @property {string} port
   *           The port of the url that was parsed.
   *
   * @property {string} pathname
   *           The pathname of the url that was parsed.
   *
   * @property {string} search
   *           The search query of the url that was parsed.
   *
   * @property {string} hash
   *           The hash of the url that was parsed.
   *
   * @property {string} host
   *           The host of the url that was parsed.
   */

  /**
   * Resolve and parse the elements of a URL.
   *
   * @function
   * @param    {String} url
   *           The url to parse
   *
   * @return   {url:URLObject}
   *           An object of url details
   */
  const parseUrl = function (url) {
    // This entire method can be replace with URL once we are able to drop IE11

    const props = ['protocol', 'hostname', 'port', 'pathname', 'search', 'hash', 'host'];

    // add the url to an anchor and let the browser parse the URL
    const a = document.createElement('a');
    a.href = url;

    // Copy the specific URL properties to a new object
    // This is also needed for IE because the anchor loses its
    // properties when it's removed from the dom
    const details = {};
    for (let i = 0; i < props.length; i++) {
      details[props[i]] = a[props[i]];
    }

    // IE adds the port to the host property unlike everyone else. If
    // a port identifier is added for standard ports, strip it.
    if (details.protocol === 'http:') {
      details.host = details.host.replace(/:80$/, '');
    }
    if (details.protocol === 'https:') {
      details.host = details.host.replace(/:443$/, '');
    }
    if (!details.protocol) {
      details.protocol = window.location.protocol;
    }

    /* istanbul ignore if */
    if (!details.host) {
      details.host = window.location.host;
    }
    return details;
  };

  /**
   * Get absolute version of relative URL.
   *
   * @function
   * @param    {string} url
   *           URL to make absolute
   *
   * @return   {string}
   *           Absolute URL
   *
   * @see      http://stackoverflow.com/questions/470832/getting-an-absolute-url-from-a-relative-one-ie6-issue
   */
  const getAbsoluteURL = function (url) {
    // Check if absolute URL
    if (!url.match(/^https?:\/\//)) {
      // Add the url to an anchor and let the browser parse it to convert to an absolute url
      const a = document.createElement('a');
      a.href = url;
      url = a.href;
    }
    return url;
  };

  /**
   * Returns the extension of the passed file name. It will return an empty string
   * if passed an invalid path.
   *
   * @function
   * @param    {string} path
   *           The fileName path like '/path/to/file.mp4'
   *
   * @return  {string}
   *           The extension in lower case or an empty string if no
   *           extension could be found.
   */
  const getFileExtension = function (path) {
    if (typeof path === 'string') {
      const splitPathRe = /^(\/?)([\s\S]*?)((?:\.{1,2}|[^\/]+?)(\.([^\.\/\?]+)))(?:[\/]*|[\?].*)$/;
      const pathParts = splitPathRe.exec(path);
      if (pathParts) {
        return pathParts.pop().toLowerCase();
      }
    }
    return '';
  };

  /**
   * Returns whether the url passed is a cross domain request or not.
   *
   * @function
   * @param    {string} url
   *           The url to check.
   *
   * @param    {Object} [winLoc]
   *           the domain to check the url against, defaults to window.location
   *
   * @param    {string} [winLoc.protocol]
   *           The window location protocol defaults to window.location.protocol
   *
   * @param    {string} [winLoc.host]
   *           The window location host defaults to window.location.host
   *
   * @return   {boolean}
   *           Whether it is a cross domain request or not.
   */
  const isCrossOrigin = function (url, winLoc = window.location) {
    const urlInfo = parseUrl(url);

    // IE8 protocol relative urls will return ':' for protocol
    const srcProtocol = urlInfo.protocol === ':' ? winLoc.protocol : urlInfo.protocol;

    // Check if url is for another domain/origin
    // IE8 doesn't know location.origin, so we won't rely on it here
    const crossOrigin = srcProtocol + urlInfo.host !== winLoc.protocol + winLoc.host;
    return crossOrigin;
  };

  var Url = /*#__PURE__*/Object.freeze({
    __proto__: null,
    parseUrl: parseUrl,
    getAbsoluteURL: getAbsoluteURL,
    getFileExtension: getFileExtension,
    isCrossOrigin: isCrossOrigin
  });

  var win;
  if (typeof window !== "undefined") {
    win = window;
  } else if (typeof commonjsGlobal !== "undefined") {
    win = commonjsGlobal;
  } else if (typeof self !== "undefined") {
    win = self;
  } else {
    win = {};
  }
  var window_1 = win;

  var _extends_1 = createCommonjsModule(function (module) {
    function _extends() {
      module.exports = _extends = Object.assign ? Object.assign.bind() : function (target) {
        for (var i = 1; i < arguments.length; i++) {
          var source = arguments[i];
          for (var key in source) {
            if (Object.prototype.hasOwnProperty.call(source, key)) {
              target[key] = source[key];
            }
          }
        }
        return target;
      }, module.exports.__esModule = true, module.exports["default"] = module.exports;
      return _extends.apply(this, arguments);
    }
    module.exports = _extends, module.exports.__esModule = true, module.exports["default"] = module.exports;
  });
  unwrapExports(_extends_1);

  var isFunction_1 = isFunction;
  var toString = Object.prototype.toString;
  function isFunction(fn) {
    if (!fn) {
      return false;
    }
    var string = toString.call(fn);
    return string === '[object Function]' || typeof fn === 'function' && string !== '[object RegExp]' || typeof window !== 'undefined' && (
    // IE8 and below
    fn === window.setTimeout || fn === window.alert || fn === window.confirm || fn === window.prompt);
  }

  var httpResponseHandler = function httpResponseHandler(callback, decodeResponseBody) {
    if (decodeResponseBody === void 0) {
      decodeResponseBody = false;
    }
    return function (err, response, responseBody) {
      // if the XHR failed, return that error
      if (err) {
        callback(err);
        return;
      } // if the HTTP status code is 4xx or 5xx, the request also failed

      if (response.statusCode >= 400 && response.statusCode <= 599) {
        var cause = responseBody;
        if (decodeResponseBody) {
          if (window_1.TextDecoder) {
            var charset = getCharset(response.headers && response.headers['content-type']);
            try {
              cause = new TextDecoder(charset).decode(responseBody);
            } catch (e) {}
          } else {
            cause = String.fromCharCode.apply(null, new Uint8Array(responseBody));
          }
        }
        callback({
          cause: cause
        });
        return;
      } // otherwise, request succeeded

      callback(null, responseBody);
    };
  };
  function getCharset(contentTypeHeader) {
    if (contentTypeHeader === void 0) {
      contentTypeHeader = '';
    }
    return contentTypeHeader.toLowerCase().split(';').reduce(function (charset, contentType) {
      var _contentType$split = contentType.split('='),
        type = _contentType$split[0],
        value = _contentType$split[1];
      if (type.trim() === 'charset') {
        return value.trim();
      }
      return charset;
    }, 'utf-8');
  }
  var httpHandler = httpResponseHandler;

  createXHR.httpHandler = httpHandler;
  /**
   * @license
   * slighly modified parse-headers 2.0.2 <https://github.com/kesla/parse-headers/>
   * Copyright (c) 2014 David Björklund
   * Available under the MIT license
   * <https://github.com/kesla/parse-headers/blob/master/LICENCE>
   */

  var parseHeaders = function parseHeaders(headers) {
    var result = {};
    if (!headers) {
      return result;
    }
    headers.trim().split('\n').forEach(function (row) {
      var index = row.indexOf(':');
      var key = row.slice(0, index).trim().toLowerCase();
      var value = row.slice(index + 1).trim();
      if (typeof result[key] === 'undefined') {
        result[key] = value;
      } else if (Array.isArray(result[key])) {
        result[key].push(value);
      } else {
        result[key] = [result[key], value];
      }
    });
    return result;
  };
  var lib = createXHR; // Allow use of default import syntax in TypeScript

  var default_1 = createXHR;
  createXHR.XMLHttpRequest = window_1.XMLHttpRequest || noop;
  createXHR.XDomainRequest = "withCredentials" in new createXHR.XMLHttpRequest() ? createXHR.XMLHttpRequest : window_1.XDomainRequest;
  forEachArray(["get", "put", "post", "patch", "head", "delete"], function (method) {
    createXHR[method === "delete" ? "del" : method] = function (uri, options, callback) {
      options = initParams(uri, options, callback);
      options.method = method.toUpperCase();
      return _createXHR(options);
    };
  });
  function forEachArray(array, iterator) {
    for (var i = 0; i < array.length; i++) {
      iterator(array[i]);
    }
  }
  function isEmpty(obj) {
    for (var i in obj) {
      if (obj.hasOwnProperty(i)) return false;
    }
    return true;
  }
  function initParams(uri, options, callback) {
    var params = uri;
    if (isFunction_1(options)) {
      callback = options;
      if (typeof uri === "string") {
        params = {
          uri: uri
        };
      }
    } else {
      params = _extends_1({}, options, {
        uri: uri
      });
    }
    params.callback = callback;
    return params;
  }
  function createXHR(uri, options, callback) {
    options = initParams(uri, options, callback);
    return _createXHR(options);
  }
  function _createXHR(options) {
    if (typeof options.callback === "undefined") {
      throw new Error("callback argument missing");
    }
    var called = false;
    var callback = function cbOnce(err, response, body) {
      if (!called) {
        called = true;
        options.callback(err, response, body);
      }
    };
    function readystatechange() {
      if (xhr.readyState === 4) {
        setTimeout(loadFunc, 0);
      }
    }
    function getBody() {
      // Chrome with requestType=blob throws errors arround when even testing access to responseText
      var body = undefined;
      if (xhr.response) {
        body = xhr.response;
      } else {
        body = xhr.responseText || getXml(xhr);
      }
      if (isJson) {
        try {
          body = JSON.parse(body);
        } catch (e) {}
      }
      return body;
    }
    function errorFunc(evt) {
      clearTimeout(timeoutTimer);
      if (!(evt instanceof Error)) {
        evt = new Error("" + (evt || "Unknown XMLHttpRequest Error"));
      }
      evt.statusCode = 0;
      return callback(evt, failureResponse);
    } // will load the data & process the response in a special response object

    function loadFunc() {
      if (aborted) return;
      var status;
      clearTimeout(timeoutTimer);
      if (options.useXDR && xhr.status === undefined) {
        //IE8 CORS GET successful response doesn't have a status field, but body is fine
        status = 200;
      } else {
        status = xhr.status === 1223 ? 204 : xhr.status;
      }
      var response = failureResponse;
      var err = null;
      if (status !== 0) {
        response = {
          body: getBody(),
          statusCode: status,
          method: method,
          headers: {},
          url: uri,
          rawRequest: xhr
        };
        if (xhr.getAllResponseHeaders) {
          //remember xhr can in fact be XDR for CORS in IE
          response.headers = parseHeaders(xhr.getAllResponseHeaders());
        }
      } else {
        err = new Error("Internal XMLHttpRequest Error");
      }
      return callback(err, response, response.body);
    }
    var xhr = options.xhr || null;
    if (!xhr) {
      if (options.cors || options.useXDR) {
        xhr = new createXHR.XDomainRequest();
      } else {
        xhr = new createXHR.XMLHttpRequest();
      }
    }
    var key;
    var aborted;
    var uri = xhr.url = options.uri || options.url;
    var method = xhr.method = options.method || "GET";
    var body = options.body || options.data;
    var headers = xhr.headers = options.headers || {};
    var sync = !!options.sync;
    var isJson = false;
    var timeoutTimer;
    var failureResponse = {
      body: undefined,
      headers: {},
      statusCode: 0,
      method: method,
      url: uri,
      rawRequest: xhr
    };
    if ("json" in options && options.json !== false) {
      isJson = true;
      headers["accept"] || headers["Accept"] || (headers["Accept"] = "application/json"); //Don't override existing accept header declared by user

      if (method !== "GET" && method !== "HEAD") {
        headers["content-type"] || headers["Content-Type"] || (headers["Content-Type"] = "application/json"); //Don't override existing accept header declared by user

        body = JSON.stringify(options.json === true ? body : options.json);
      }
    }
    xhr.onreadystatechange = readystatechange;
    xhr.onload = loadFunc;
    xhr.onerror = errorFunc; // IE9 must have onprogress be set to a unique function.

    xhr.onprogress = function () {// IE must die
    };
    xhr.onabort = function () {
      aborted = true;
    };
    xhr.ontimeout = errorFunc;
    xhr.open(method, uri, !sync, options.username, options.password); //has to be after open

    if (!sync) {
      xhr.withCredentials = !!options.withCredentials;
    } // Cannot set timeout with sync request
    // not setting timeout on the xhr object, because of old webkits etc. not handling that correctly
    // both npm's request and jquery 1.x use this kind of timeout, so this is being consistent

    if (!sync && options.timeout > 0) {
      timeoutTimer = setTimeout(function () {
        if (aborted) return;
        aborted = true; //IE9 may still call readystatechange

        xhr.abort("timeout");
        var e = new Error("XMLHttpRequest timeout");
        e.code = "ETIMEDOUT";
        errorFunc(e);
      }, options.timeout);
    }
    if (xhr.setRequestHeader) {
      for (key in headers) {
        if (headers.hasOwnProperty(key)) {
          xhr.setRequestHeader(key, headers[key]);
        }
      }
    } else if (options.headers && !isEmpty(options.headers)) {
      throw new Error("Headers cannot be set on an XDomainRequest object");
    }
    if ("responseType" in options) {
      xhr.responseType = options.responseType;
    }
    if ("beforeSend" in options && typeof options.beforeSend === "function") {
      options.beforeSend(xhr);
    } // Microsoft Edge browser sends "undefined" when send is called with undefined value.
    // XMLHttpRequest spec says to pass null as body to indicate no body
    // See https://github.com/naugtur/xhr/issues/100.

    xhr.send(body || null);
    return xhr;
  }
  function getXml(xhr) {
    // xhr.responseXML will throw Exception "InvalidStateError" or "DOMException"
    // See https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/responseXML.
    try {
      if (xhr.responseType === "document") {
        return xhr.responseXML;
      }
      var firefoxBugTakenEffect = xhr.responseXML && xhr.responseXML.documentElement.nodeName === "parsererror";
      if (xhr.responseType === "" && !firefoxBugTakenEffect) {
        return xhr.responseXML;
      }
    } catch (e) {}
    return null;
  }
  function noop() {}
  lib.default = default_1;

  /**
   * @file text-track.js
   */

  /**
   * Takes a webvtt file contents and parses it into cues
   *
   * @param {string} srcContent
   *        webVTT file contents
   *
   * @param {TextTrack} track
   *        TextTrack to add cues to. Cues come from the srcContent.
   *
   * @private
   */
  const parseCues = function (srcContent, track) {
    const parser = new window.WebVTT.Parser(window, window.vttjs, window.WebVTT.StringDecoder());
    const errors = [];
    parser.oncue = function (cue) {
      track.addCue(cue);
    };
    parser.onparsingerror = function (error) {
      errors.push(error);
    };
    parser.onflush = function () {
      track.trigger({
        type: 'loadeddata',
        target: track
      });
    };
    parser.parse(srcContent);
    if (errors.length > 0) {
      if (window.console && window.console.groupCollapsed) {
        window.console.groupCollapsed(`Text Track parsing errors for ${track.src}`);
      }
      errors.forEach(error => log.error(error));
      if (window.console && window.console.groupEnd) {
        window.console.groupEnd();
      }
    }
    parser.flush();
  };

  /**
   * Load a `TextTrack` from a specified url.
   *
   * @param {string} src
   *        Url to load track from.
   *
   * @param {TextTrack} track
   *        Track to add cues to. Comes from the content at the end of `url`.
   *
   * @private
   */
  const loadTrack = function (src, track) {
    const opts = {
      uri: src
    };
    const crossOrigin = isCrossOrigin(src);
    if (crossOrigin) {
      opts.cors = crossOrigin;
    }
    const withCredentials = track.tech_.crossOrigin() === 'use-credentials';
    if (withCredentials) {
      opts.withCredentials = withCredentials;
    }
    lib(opts, bind_(this, function (err, response, responseBody) {
      if (err) {
        return log.error(err, response);
      }
      track.loaded_ = true;

      // Make sure that vttjs has loaded, otherwise, wait till it finished loading
      // NOTE: this is only used for the alt/video.novtt.js build
      if (typeof window.WebVTT !== 'function') {
        if (track.tech_) {
          // to prevent use before define eslint error, we define loadHandler
          // as a let here
          track.tech_.any(['vttjsloaded', 'vttjserror'], event => {
            if (event.type === 'vttjserror') {
              log.error(`vttjs failed to load, stopping trying to process ${track.src}`);
              return;
            }
            return parseCues(responseBody, track);
          });
        }
      } else {
        parseCues(responseBody, track);
      }
    }));
  };

  /**
   * A representation of a single `TextTrack`.
   *
   * @see [Spec]{@link https://html.spec.whatwg.org/multipage/embedded-content.html#texttrack}
   * @extends Track
   */
  class TextTrack extends Track {
    /**
     * Create an instance of this class.
     *
     * @param {Object} options={}
     *        Object of option names and values
     *
     * @param { import('../tech/tech').default } options.tech
     *        A reference to the tech that owns this TextTrack.
     *
     * @param {TextTrack~Kind} [options.kind='subtitles']
     *        A valid text track kind.
     *
     * @param {TextTrack~Mode} [options.mode='disabled']
     *        A valid text track mode.
     *
     * @param {string} [options.id='vjs_track_' + Guid.newGUID()]
     *        A unique id for this TextTrack.
     *
     * @param {string} [options.label='']
     *        The menu label for this track.
     *
     * @param {string} [options.language='']
     *        A valid two character language code.
     *
     * @param {string} [options.srclang='']
     *        A valid two character language code. An alternative, but deprioritized
     *        version of `options.language`
     *
     * @param {string} [options.src]
     *        A url to TextTrack cues.
     *
     * @param {boolean} [options.default]
     *        If this track should default to on or off.
     */
    constructor(options = {}) {
      if (!options.tech) {
        throw new Error('A tech was not provided.');
      }
      const settings = merge(options, {
        kind: TextTrackKind[options.kind] || 'subtitles',
        language: options.language || options.srclang || ''
      });
      let mode = TextTrackMode[settings.mode] || 'disabled';
      const default_ = settings.default;
      if (settings.kind === 'metadata' || settings.kind === 'chapters') {
        mode = 'hidden';
      }
      super(settings);
      this.tech_ = settings.tech;
      this.cues_ = [];
      this.activeCues_ = [];
      this.preload_ = this.tech_.preloadTextTracks !== false;
      const cues = new TextTrackCueList(this.cues_);
      const activeCues = new TextTrackCueList(this.activeCues_);
      let changed = false;
      this.timeupdateHandler = bind_(this, function (event = {}) {
        if (this.tech_.isDisposed()) {
          return;
        }
        if (!this.tech_.isReady_) {
          if (event.type !== 'timeupdate') {
            this.rvf_ = this.tech_.requestVideoFrameCallback(this.timeupdateHandler);
          }
          return;
        }

        // Accessing this.activeCues for the side-effects of updating itself
        // due to its nature as a getter function. Do not remove or cues will
        // stop updating!
        // Use the setter to prevent deletion from uglify (pure_getters rule)
        this.activeCues = this.activeCues;
        if (changed) {
          this.trigger('cuechange');
          changed = false;
        }
        if (event.type !== 'timeupdate') {
          this.rvf_ = this.tech_.requestVideoFrameCallback(this.timeupdateHandler);
        }
      });
      const disposeHandler = () => {
        this.stopTracking();
      };
      this.tech_.one('dispose', disposeHandler);
      if (mode !== 'disabled') {
        this.startTracking();
      }
      Object.defineProperties(this, {
        /**
         * @memberof TextTrack
         * @member {boolean} default
         *         If this track was set to be on or off by default. Cannot be changed after
         *         creation.
         * @instance
         *
         * @readonly
         */
        default: {
          get() {
            return default_;
          },
          set() {}
        },
        /**
         * @memberof TextTrack
         * @member {string} mode
         *         Set the mode of this TextTrack to a valid {@link TextTrack~Mode}. Will
         *         not be set if setting to an invalid mode.
         * @instance
         *
         * @fires TextTrack#modechange
         */
        mode: {
          get() {
            return mode;
          },
          set(newMode) {
            if (!TextTrackMode[newMode]) {
              return;
            }
            if (mode === newMode) {
              return;
            }
            mode = newMode;
            if (!this.preload_ && mode !== 'disabled' && this.cues.length === 0) {
              // On-demand load.
              loadTrack(this.src, this);
            }
            this.stopTracking();
            if (mode !== 'disabled') {
              this.startTracking();
            }
            /**
             * An event that fires when mode changes on this track. This allows
             * the TextTrackList that holds this track to act accordingly.
             *
             * > Note: This is not part of the spec!
             *
             * @event TextTrack#modechange
             * @type {Event}
             */
            this.trigger('modechange');
          }
        },
        /**
         * @memberof TextTrack
         * @member {TextTrackCueList} cues
         *         The text track cue list for this TextTrack.
         * @instance
         */
        cues: {
          get() {
            if (!this.loaded_) {
              return null;
            }
            return cues;
          },
          set() {}
        },
        /**
         * @memberof TextTrack
         * @member {TextTrackCueList} activeCues
         *         The list text track cues that are currently active for this TextTrack.
         * @instance
         */
        activeCues: {
          get() {
            if (!this.loaded_) {
              return null;
            }

            // nothing to do
            if (this.cues.length === 0) {
              return activeCues;
            }
            const ct = this.tech_.currentTime();
            const active = [];
            for (let i = 0, l = this.cues.length; i < l; i++) {
              const cue = this.cues[i];
              if (cue.startTime <= ct && cue.endTime >= ct) {
                active.push(cue);
              }
            }
            changed = false;
            if (active.length !== this.activeCues_.length) {
              changed = true;
            } else {
              for (let i = 0; i < active.length; i++) {
                if (this.activeCues_.indexOf(active[i]) === -1) {
                  changed = true;
                }
              }
            }
            this.activeCues_ = active;
            activeCues.setCues_(this.activeCues_);
            return activeCues;
          },
          // /!\ Keep this setter empty (see the timeupdate handler above)
          set() {}
        }
      });
      if (settings.src) {
        this.src = settings.src;
        if (!this.preload_) {
          // Tracks will load on-demand.
          // Act like we're loaded for other purposes.
          this.loaded_ = true;
        }
        if (this.preload_ || settings.kind !== 'subtitles' && settings.kind !== 'captions') {
          loadTrack(this.src, this);
        }
      } else {
        this.loaded_ = true;
      }
    }
    startTracking() {
      // More precise cues based on requestVideoFrameCallback with a requestAnimationFram fallback
      this.rvf_ = this.tech_.requestVideoFrameCallback(this.timeupdateHandler);
      // Also listen to timeupdate in case rVFC/rAF stops (window in background, audio in video el)
      this.tech_.on('timeupdate', this.timeupdateHandler);
    }
    stopTracking() {
      if (this.rvf_) {
        this.tech_.cancelVideoFrameCallback(this.rvf_);
        this.rvf_ = undefined;
      }
      this.tech_.off('timeupdate', this.timeupdateHandler);
    }

    /**
     * Add a cue to the internal list of cues.
     *
     * @param {TextTrack~Cue} cue
     *        The cue to add to our internal list
     */
    addCue(originalCue) {
      let cue = originalCue;
      if (cue.constructor && cue.constructor.name !== 'VTTCue') {
        cue = new window.vttjs.VTTCue(originalCue.startTime, originalCue.endTime, originalCue.text);
        for (const prop in originalCue) {
          if (!(prop in cue)) {
            cue[prop] = originalCue[prop];
          }
        }

        // make sure that `id` is copied over
        cue.id = originalCue.id;
        cue.originalCue_ = originalCue;
      }
      const tracks = this.tech_.textTracks();
      for (let i = 0; i < tracks.length; i++) {
        if (tracks[i] !== this) {
          tracks[i].removeCue(cue);
        }
      }
      this.cues_.push(cue);
      this.cues.setCues_(this.cues_);
    }

    /**
     * Remove a cue from our internal list
     *
     * @param {TextTrack~Cue} removeCue
     *        The cue to remove from our internal list
     */
    removeCue(removeCue) {
      let i = this.cues_.length;
      while (i--) {
        const cue = this.cues_[i];
        if (cue === removeCue || cue.originalCue_ && cue.originalCue_ === removeCue) {
          this.cues_.splice(i, 1);
          this.cues.setCues_(this.cues_);
          break;
        }
      }
    }
  }

  /**
   * cuechange - One or more cues in the track have become active or stopped being active.
   */
  TextTrack.prototype.allowedEvents_ = {
    cuechange: 'cuechange'
  };

  /**
   * A representation of a single `AudioTrack`. If it is part of an {@link AudioTrackList}
   * only one `AudioTrack` in the list will be enabled at a time.
   *
   * @see [Spec]{@link https://html.spec.whatwg.org/multipage/embedded-content.html#audiotrack}
   * @extends Track
   */
  class AudioTrack extends Track {
    /**
     * Create an instance of this class.
     *
     * @param {Object} [options={}]
     *        Object of option names and values
     *
     * @param {AudioTrack~Kind} [options.kind='']
     *        A valid audio track kind
     *
     * @param {string} [options.id='vjs_track_' + Guid.newGUID()]
     *        A unique id for this AudioTrack.
     *
     * @param {string} [options.label='']
     *        The menu label for this track.
     *
     * @param {string} [options.language='']
     *        A valid two character language code.
     *
     * @param {boolean} [options.enabled]
     *        If this track is the one that is currently playing. If this track is part of
     *        an {@link AudioTrackList}, only one {@link AudioTrack} will be enabled.
     */
    constructor(options = {}) {
      const settings = merge(options, {
        kind: AudioTrackKind[options.kind] || ''
      });
      super(settings);
      let enabled = false;

      /**
       * @memberof AudioTrack
       * @member {boolean} enabled
       *         If this `AudioTrack` is enabled or not. When setting this will
       *         fire {@link AudioTrack#enabledchange} if the state of enabled is changed.
       * @instance
       *
       * @fires VideoTrack#selectedchange
       */
      Object.defineProperty(this, 'enabled', {
        get() {
          return enabled;
        },
        set(newEnabled) {
          // an invalid or unchanged value
          if (typeof newEnabled !== 'boolean' || newEnabled === enabled) {
            return;
          }
          enabled = newEnabled;

          /**
           * An event that fires when enabled changes on this track. This allows
           * the AudioTrackList that holds this track to act accordingly.
           *
           * > Note: This is not part of the spec! Native tracks will do
           *         this internally without an event.
           *
           * @event AudioTrack#enabledchange
           * @type {Event}
           */
          this.trigger('enabledchange');
        }
      });

      // if the user sets this track to selected then
      // set selected to that true value otherwise
      // we keep it false
      if (settings.enabled) {
        this.enabled = settings.enabled;
      }
      this.loaded_ = true;
    }
  }

  /**
   * A representation of a single `VideoTrack`.
   *
   * @see [Spec]{@link https://html.spec.whatwg.org/multipage/embedded-content.html#videotrack}
   * @extends Track
   */
  class VideoTrack extends Track {
    /**
     * Create an instance of this class.
     *
     * @param {Object} [options={}]
     *        Object of option names and values
     *
     * @param {string} [options.kind='']
     *        A valid {@link VideoTrack~Kind}
     *
     * @param {string} [options.id='vjs_track_' + Guid.newGUID()]
     *        A unique id for this AudioTrack.
     *
     * @param {string} [options.label='']
     *        The menu label for this track.
     *
     * @param {string} [options.language='']
     *        A valid two character language code.
     *
     * @param {boolean} [options.selected]
     *        If this track is the one that is currently playing.
     */
    constructor(options = {}) {
      const settings = merge(options, {
        kind: VideoTrackKind[options.kind] || ''
      });
      super(settings);
      let selected = false;

      /**
       * @memberof VideoTrack
       * @member {boolean} selected
       *         If this `VideoTrack` is selected or not. When setting this will
       *         fire {@link VideoTrack#selectedchange} if the state of selected changed.
       * @instance
       *
       * @fires VideoTrack#selectedchange
       */
      Object.defineProperty(this, 'selected', {
        get() {
          return selected;
        },
        set(newSelected) {
          // an invalid or unchanged value
          if (typeof newSelected !== 'boolean' || newSelected === selected) {
            return;
          }
          selected = newSelected;

          /**
           * An event that fires when selected changes on this track. This allows
           * the VideoTrackList that holds this track to act accordingly.
           *
           * > Note: This is not part of the spec! Native tracks will do
           *         this internally without an event.
           *
           * @event VideoTrack#selectedchange
           * @type {Event}
           */
          this.trigger('selectedchange');
        }
      });

      // if the user sets this track to selected then
      // set selected to that true value otherwise
      // we keep it false
      if (settings.selected) {
        this.selected = settings.selected;
      }
    }
  }

  /**
   * @file html-track-element.js
   */

  /**
   * A single track represented in the DOM.
   *
   * @see [Spec]{@link https://html.spec.whatwg.org/multipage/embedded-content.html#htmltrackelement}
   * @extends EventTarget
   */
  class HTMLTrackElement extends EventTarget {
    /**
     * Create an instance of this class.
     *
     * @param {Object} options={}
     *        Object of option names and values
     *
     * @param { import('../tech/tech').default } options.tech
     *        A reference to the tech that owns this HTMLTrackElement.
     *
     * @param {TextTrack~Kind} [options.kind='subtitles']
     *        A valid text track kind.
     *
     * @param {TextTrack~Mode} [options.mode='disabled']
     *        A valid text track mode.
     *
     * @param {string} [options.id='vjs_track_' + Guid.newGUID()]
     *        A unique id for this TextTrack.
     *
     * @param {string} [options.label='']
     *        The menu label for this track.
     *
     * @param {string} [options.language='']
     *        A valid two character language code.
     *
     * @param {string} [options.srclang='']
     *        A valid two character language code. An alternative, but deprioritized
     *        version of `options.language`
     *
     * @param {string} [options.src]
     *        A url to TextTrack cues.
     *
     * @param {boolean} [options.default]
     *        If this track should default to on or off.
     */
    constructor(options = {}) {
      super();
      let readyState;
      const track = new TextTrack(options);
      this.kind = track.kind;
      this.src = track.src;
      this.srclang = track.language;
      this.label = track.label;
      this.default = track.default;
      Object.defineProperties(this, {
        /**
         * @memberof HTMLTrackElement
         * @member {HTMLTrackElement~ReadyState} readyState
         *         The current ready state of the track element.
         * @instance
         */
        readyState: {
          get() {
            return readyState;
          }
        },
        /**
         * @memberof HTMLTrackElement
         * @member {TextTrack} track
         *         The underlying TextTrack object.
         * @instance
         *
         */
        track: {
          get() {
            return track;
          }
        }
      });
      readyState = HTMLTrackElement.NONE;

      /**
       * @listens TextTrack#loadeddata
       * @fires HTMLTrackElement#load
       */
      track.addEventListener('loadeddata', () => {
        readyState = HTMLTrackElement.LOADED;
        this.trigger({
          type: 'load',
          target: this
        });
      });
    }
  }
  HTMLTrackElement.prototype.allowedEvents_ = {
    load: 'load'
  };

  /**
   * The text track not loaded state.
   *
   * @type {number}
   * @static
   */
  HTMLTrackElement.NONE = 0;

  /**
   * The text track loading state.
   *
   * @type {number}
   * @static
   */
  HTMLTrackElement.LOADING = 1;

  /**
   * The text track loaded state.
   *
   * @type {number}
   * @static
   */
  HTMLTrackElement.LOADED = 2;

  /**
   * The text track failed to load state.
   *
   * @type {number}
   * @static
   */
  HTMLTrackElement.ERROR = 3;

  /*
   * This file contains all track properties that are used in
   * player.js, tech.js, html5.js and possibly other techs in the future.
   */

  const NORMAL = {
    audio: {
      ListClass: AudioTrackList,
      TrackClass: AudioTrack,
      capitalName: 'Audio'
    },
    video: {
      ListClass: VideoTrackList,
      TrackClass: VideoTrack,
      capitalName: 'Video'
    },
    text: {
      ListClass: TextTrackList,
      TrackClass: TextTrack,
      capitalName: 'Text'
    }
  };
  Object.keys(NORMAL).forEach(function (type) {
    NORMAL[type].getterName = `${type}Tracks`;
    NORMAL[type].privateName = `${type}Tracks_`;
  });
  const REMOTE = {
    remoteText: {
      ListClass: TextTrackList,
      TrackClass: TextTrack,
      capitalName: 'RemoteText',
      getterName: 'remoteTextTracks',
      privateName: 'remoteTextTracks_'
    },
    remoteTextEl: {
      ListClass: HtmlTrackElementList,
      TrackClass: HTMLTrackElement,
      capitalName: 'RemoteTextTrackEls',
      getterName: 'remoteTextTrackEls',
      privateName: 'remoteTextTrackEls_'
    }
  };
  const ALL = Object.assign({}, NORMAL, REMOTE);
  REMOTE.names = Object.keys(REMOTE);
  NORMAL.names = Object.keys(NORMAL);
  ALL.names = [].concat(REMOTE.names).concat(NORMAL.names);

  var vtt = {};

  /**
   * @file tech.js
   */

  /**
   * An Object containing a structure like: `{src: 'url', type: 'mimetype'}` or string
   * that just contains the src url alone.
   * * `var SourceObject = {src: 'http://ex.com/video.mp4', type: 'video/mp4'};`
     * `var SourceString = 'http://example.com/some-video.mp4';`
   *
   * @typedef {Object|string} Tech~SourceObject
   *
   * @property {string} src
   *           The url to the source
   *
   * @property {string} type
   *           The mime type of the source
   */

  /**
   * A function used by {@link Tech} to create a new {@link TextTrack}.
   *
   * @private
   *
   * @param {Tech} self
   *        An instance of the Tech class.
   *
   * @param {string} kind
   *        `TextTrack` kind (subtitles, captions, descriptions, chapters, or metadata)
   *
   * @param {string} [label]
   *        Label to identify the text track
   *
   * @param {string} [language]
   *        Two letter language abbreviation
   *
   * @param {Object} [options={}]
   *        An object with additional text track options
   *
   * @return {TextTrack}
   *          The text track that was created.
   */
  function createTrackHelper(self, kind, label, language, options = {}) {
    const tracks = self.textTracks();
    options.kind = kind;
    if (label) {
      options.label = label;
    }
    if (language) {
      options.language = language;
    }
    options.tech = self;
    const track = new ALL.text.TrackClass(options);
    tracks.addTrack(track);
    return track;
  }

  /**
   * This is the base class for media playback technology controllers, such as
   * {@link HTML5}
   *
   * @extends Component
   */
  class Tech extends Component {
    /**
    * Create an instance of this Tech.
    *
    * @param {Object} [options]
    *        The key/value store of player options.
    *
    * @param {Function} [ready]
    *        Callback function to call when the `HTML5` Tech is ready.
    */
    constructor(options = {}, ready = function () {}) {
      // we don't want the tech to report user activity automatically.
      // This is done manually in addControlsListeners
      options.reportTouchActivity = false;
      super(null, options, ready);
      this.onDurationChange_ = e => this.onDurationChange(e);
      this.trackProgress_ = e => this.trackProgress(e);
      this.trackCurrentTime_ = e => this.trackCurrentTime(e);
      this.stopTrackingCurrentTime_ = e => this.stopTrackingCurrentTime(e);
      this.disposeSourceHandler_ = e => this.disposeSourceHandler(e);
      this.queuedHanders_ = new Set();

      // keep track of whether the current source has played at all to
      // implement a very limited played()
      this.hasStarted_ = false;
      this.on('playing', function () {
        this.hasStarted_ = true;
      });
      this.on('loadstart', function () {
        this.hasStarted_ = false;
      });
      ALL.names.forEach(name => {
        const props = ALL[name];
        if (options && options[props.getterName]) {
          this[props.privateName] = options[props.getterName];
        }
      });

      // Manually track progress in cases where the browser/tech doesn't report it.
      if (!this.featuresProgressEvents) {
        this.manualProgressOn();
      }

      // Manually track timeupdates in cases where the browser/tech doesn't report it.
      if (!this.featuresTimeupdateEvents) {
        this.manualTimeUpdatesOn();
      }
      ['Text', 'Audio', 'Video'].forEach(track => {
        if (options[`native${track}Tracks`] === false) {
          this[`featuresNative${track}Tracks`] = false;
        }
      });
      if (options.nativeCaptions === false || options.nativeTextTracks === false) {
        this.featuresNativeTextTracks = false;
      } else if (options.nativeCaptions === true || options.nativeTextTracks === true) {
        this.featuresNativeTextTracks = true;
      }
      if (!this.featuresNativeTextTracks) {
        this.emulateTextTracks();
      }
      this.preloadTextTracks = options.preloadTextTracks !== false;
      this.autoRemoteTextTracks_ = new ALL.text.ListClass();
      this.initTrackListeners();

      // Turn on component tap events only if not using native controls
      if (!options.nativeControlsForTouch) {
        this.emitTapEvents();
      }
      if (this.constructor) {
        this.name_ = this.constructor.name || 'Unknown Tech';
      }
    }

    /**
     * A special function to trigger source set in a way that will allow player
     * to re-trigger if the player or tech are not ready yet.
     *
     * @fires Tech#sourceset
     * @param {string} src The source string at the time of the source changing.
     */
    triggerSourceset(src) {
      if (!this.isReady_) {
        // on initial ready we have to trigger source set
        // 1ms after ready so that player can watch for it.
        this.one('ready', () => this.setTimeout(() => this.triggerSourceset(src), 1));
      }

      /**
       * Fired when the source is set on the tech causing the media element
       * to reload.
       *
       * @see {@link Player#event:sourceset}
       * @event Tech#sourceset
       * @type {Event}
       */
      this.trigger({
        src,
        type: 'sourceset'
      });
    }

    /* Fallbacks for unsupported event types
    ================================================================================ */

    /**
     * Polyfill the `progress` event for browsers that don't support it natively.
     *
     * @see {@link Tech#trackProgress}
     */
    manualProgressOn() {
      this.on('durationchange', this.onDurationChange_);
      this.manualProgress = true;

      // Trigger progress watching when a source begins loading
      this.one('ready', this.trackProgress_);
    }

    /**
     * Turn off the polyfill for `progress` events that was created in
     * {@link Tech#manualProgressOn}
     */
    manualProgressOff() {
      this.manualProgress = false;
      this.stopTrackingProgress();
      this.off('durationchange', this.onDurationChange_);
    }

    /**
     * This is used to trigger a `progress` event when the buffered percent changes. It
     * sets an interval function that will be called every 500 milliseconds to check if the
     * buffer end percent has changed.
     *
     * > This function is called by {@link Tech#manualProgressOn}
     *
     * @param {Event} event
     *        The `ready` event that caused this to run.
     *
     * @listens Tech#ready
     * @fires Tech#progress
     */
    trackProgress(event) {
      this.stopTrackingProgress();
      this.progressInterval = this.setInterval(bind_(this, function () {
        // Don't trigger unless buffered amount is greater than last time

        const numBufferedPercent = this.bufferedPercent();
        if (this.bufferedPercent_ !== numBufferedPercent) {
          /**
           * See {@link Player#progress}
           *
           * @event Tech#progress
           * @type {Event}
           */
          this.trigger('progress');
        }
        this.bufferedPercent_ = numBufferedPercent;
        if (numBufferedPercent === 1) {
          this.stopTrackingProgress();
        }
      }), 500);
    }

    /**
     * Update our internal duration on a `durationchange` event by calling
     * {@link Tech#duration}.
     *
     * @param {Event} event
     *        The `durationchange` event that caused this to run.
     *
     * @listens Tech#durationchange
     */
    onDurationChange(event) {
      this.duration_ = this.duration();
    }

    /**
     * Get and create a `TimeRange` object for buffering.
     *
     * @return { import('../utils/time').TimeRange }
     *         The time range object that was created.
     */
    buffered() {
      return createTimeRanges(0, 0);
    }

    /**
     * Get the percentage of the current video that is currently buffered.
     *
     * @return {number}
     *         A number from 0 to 1 that represents the decimal percentage of the
     *         video that is buffered.
     *
     */
    bufferedPercent() {
      return bufferedPercent(this.buffered(), this.duration_);
    }

    /**
     * Turn off the polyfill for `progress` events that was created in
     * {@link Tech#manualProgressOn}
     * Stop manually tracking progress events by clearing the interval that was set in
     * {@link Tech#trackProgress}.
     */
    stopTrackingProgress() {
      this.clearInterval(this.progressInterval);
    }

    /**
     * Polyfill the `timeupdate` event for browsers that don't support it.
     *
     * @see {@link Tech#trackCurrentTime}
     */
    manualTimeUpdatesOn() {
      this.manualTimeUpdates = true;
      this.on('play', this.trackCurrentTime_);
      this.on('pause', this.stopTrackingCurrentTime_);
    }

    /**
     * Turn off the polyfill for `timeupdate` events that was created in
     * {@link Tech#manualTimeUpdatesOn}
     */
    manualTimeUpdatesOff() {
      this.manualTimeUpdates = false;
      this.stopTrackingCurrentTime();
      this.off('play', this.trackCurrentTime_);
      this.off('pause', this.stopTrackingCurrentTime_);
    }

    /**
     * Sets up an interval function to track current time and trigger `timeupdate` every
     * 250 milliseconds.
     *
     * @listens Tech#play
     * @triggers Tech#timeupdate
     */
    trackCurrentTime() {
      if (this.currentTimeInterval) {
        this.stopTrackingCurrentTime();
      }
      this.currentTimeInterval = this.setInterval(function () {
        /**
         * Triggered at an interval of 250ms to indicated that time is passing in the video.
         *
         * @event Tech#timeupdate
         * @type {Event}
         */
        this.trigger({
          type: 'timeupdate',
          target: this,
          manuallyTriggered: true
        });

        // 42 = 24 fps // 250 is what Webkit uses // FF uses 15
      }, 250);
    }

    /**
     * Stop the interval function created in {@link Tech#trackCurrentTime} so that the
     * `timeupdate` event is no longer triggered.
     *
     * @listens {Tech#pause}
     */
    stopTrackingCurrentTime() {
      this.clearInterval(this.currentTimeInterval);

      // #1002 - if the video ends right before the next timeupdate would happen,
      // the progress bar won't make it all the way to the end
      this.trigger({
        type: 'timeupdate',
        target: this,
        manuallyTriggered: true
      });
    }

    /**
     * Turn off all event polyfills, clear the `Tech`s {@link AudioTrackList},
     * {@link VideoTrackList}, and {@link TextTrackList}, and dispose of this Tech.
     *
     * @fires Component#dispose
     */
    dispose() {
      // clear out all tracks because we can't reuse them between techs
      this.clearTracks(NORMAL.names);

      // Turn off any manual progress or timeupdate tracking
      if (this.manualProgress) {
        this.manualProgressOff();
      }
      if (this.manualTimeUpdates) {
        this.manualTimeUpdatesOff();
      }
      super.dispose();
    }

    /**
     * Clear out a single `TrackList` or an array of `TrackLists` given their names.
     *
     * > Note: Techs without source handlers should call this between sources for `video`
     *         & `audio` tracks. You don't want to use them between tracks!
     *
     * @param {string[]|string} types
     *        TrackList names to clear, valid names are `video`, `audio`, and
     *        `text`.
     */
    clearTracks(types) {
      types = [].concat(types);
      // clear out all tracks because we can't reuse them between techs
      types.forEach(type => {
        const list = this[`${type}Tracks`]() || [];
        let i = list.length;
        while (i--) {
          const track = list[i];
          if (type === 'text') {
            this.removeRemoteTextTrack(track);
          }
          list.removeTrack(track);
        }
      });
    }

    /**
     * Remove any TextTracks added via addRemoteTextTrack that are
     * flagged for automatic garbage collection
     */
    cleanupAutoTextTracks() {
      const list = this.autoRemoteTextTracks_ || [];
      let i = list.length;
      while (i--) {
        const track = list[i];
        this.removeRemoteTextTrack(track);
      }
    }

    /**
     * Reset the tech, which will removes all sources and reset the internal readyState.
     *
     * @abstract
     */
    reset() {}

    /**
     * Get the value of `crossOrigin` from the tech.
     *
     * @abstract
     *
     * @see {Html5#crossOrigin}
     */
    crossOrigin() {}

    /**
     * Set the value of `crossOrigin` on the tech.
     *
     * @abstract
     *
     * @param {string} crossOrigin the crossOrigin value
     * @see {Html5#setCrossOrigin}
     */
    setCrossOrigin() {}

    /**
     * Get or set an error on the Tech.
     *
     * @param {MediaError} [err]
     *        Error to set on the Tech
     *
     * @return {MediaError|null}
     *         The current error object on the tech, or null if there isn't one.
     */
    error(err) {
      if (err !== undefined) {
        this.error_ = new MediaError(err);
        this.trigger('error');
      }
      return this.error_;
    }

    /**
     * Returns the `TimeRange`s that have been played through for the current source.
     *
     * > NOTE: This implementation is incomplete. It does not track the played `TimeRange`.
     *         It only checks whether the source has played at all or not.
     *
     * @return {TimeRange}
     *         - A single time range if this video has played
     *         - An empty set of ranges if not.
     */
    played() {
      if (this.hasStarted_) {
        return createTimeRanges(0, 0);
      }
      return createTimeRanges();
    }

    /**
     * Start playback
     *
     * @abstract
     *
     * @see {Html5#play}
     */
    play() {}

    /**
     * Set whether we are scrubbing or not
     *
     * @abstract
     * @param {boolean} _isScrubbing
     *                  - true for we are currently scrubbing
     *                  - false for we are no longer scrubbing
     *
     * @see {Html5#setScrubbing}
     */
    setScrubbing(_isScrubbing) {}

    /**
     * Get whether we are scrubbing or not
     *
     * @abstract
     *
     * @see {Html5#scrubbing}
     */
    scrubbing() {}

    /**
     * Causes a manual time update to occur if {@link Tech#manualTimeUpdatesOn} was
     * previously called.
     *
     * @param {number} _seconds
     *        Set the current time of the media to this.
     * @fires Tech#timeupdate
     */
    setCurrentTime(_seconds) {
      // improve the accuracy of manual timeupdates
      if (this.manualTimeUpdates) {
        /**
         * A manual `timeupdate` event.
         *
         * @event Tech#timeupdate
         * @type {Event}
         */
        this.trigger({
          type: 'timeupdate',
          target: this,
          manuallyTriggered: true
        });
      }
    }

    /**
     * Turn on listeners for {@link VideoTrackList}, {@link {AudioTrackList}, and
     * {@link TextTrackList} events.
     *
     * This adds {@link EventTarget~EventListeners} for `addtrack`, and  `removetrack`.
     *
     * @fires Tech#audiotrackchange
     * @fires Tech#videotrackchange
     * @fires Tech#texttrackchange
     */
    initTrackListeners() {
      /**
        * Triggered when tracks are added or removed on the Tech {@link AudioTrackList}
        *
        * @event Tech#audiotrackchange
        * @type {Event}
        */

      /**
        * Triggered when tracks are added or removed on the Tech {@link VideoTrackList}
        *
        * @event Tech#videotrackchange
        * @type {Event}
        */

      /**
        * Triggered when tracks are added or removed on the Tech {@link TextTrackList}
        *
        * @event Tech#texttrackchange
        * @type {Event}
        */
      NORMAL.names.forEach(name => {
        const props = NORMAL[name];
        const trackListChanges = () => {
          this.trigger(`${name}trackchange`);
        };
        const tracks = this[props.getterName]();
        tracks.addEventListener('removetrack', trackListChanges);
        tracks.addEventListener('addtrack', trackListChanges);
        this.on('dispose', () => {
          tracks.removeEventListener('removetrack', trackListChanges);
          tracks.removeEventListener('addtrack', trackListChanges);
        });
      });
    }

    /**
     * Emulate TextTracks using vtt.js if necessary
     *
     * @fires Tech#vttjsloaded
     * @fires Tech#vttjserror
     */
    addWebVttScript_() {
      if (window.WebVTT) {
        return;
      }

      // Initially, Tech.el_ is a child of a dummy-div wait until the Component system
      // signals that the Tech is ready at which point Tech.el_ is part of the DOM
      // before inserting the WebVTT script
      if (document.body.contains(this.el())) {
        // load via require if available and vtt.js script location was not passed in
        // as an option. novtt builds will turn the above require call into an empty object
        // which will cause this if check to always fail.
        if (!this.options_['vtt.js'] && isPlain(vtt) && Object.keys(vtt).length > 0) {
          this.trigger('vttjsloaded');
          return;
        }

        // load vtt.js via the script location option or the cdn of no location was
        // passed in
        const script = document.createElement('script');
        script.src = this.options_['vtt.js'] || 'https://vjs.zencdn.net/vttjs/0.14.1/vtt.min.js';
        script.onload = () => {
          /**
           * Fired when vtt.js is loaded.
           *
           * @event Tech#vttjsloaded
           * @type {Event}
           */
          this.trigger('vttjsloaded');
        };
        script.onerror = () => {
          /**
           * Fired when vtt.js was not loaded due to an error
           *
           * @event Tech#vttjsloaded
           * @type {Event}
           */
          this.trigger('vttjserror');
        };
        this.on('dispose', () => {
          script.onload = null;
          script.onerror = null;
        });
        // but have not loaded yet and we set it to true before the inject so that
        // we don't overwrite the injected window.WebVTT if it loads right away
        window.WebVTT = true;
        this.el().parentNode.appendChild(script);
      } else {
        this.ready(this.addWebVttScript_);
      }
    }

    /**
     * Emulate texttracks
     *
     */
    emulateTextTracks() {
      const tracks = this.textTracks();
      const remoteTracks = this.remoteTextTracks();
      const handleAddTrack = e => tracks.addTrack(e.track);
      const handleRemoveTrack = e => tracks.removeTrack(e.track);
      remoteTracks.on('addtrack', handleAddTrack);
      remoteTracks.on('removetrack', handleRemoveTrack);
      this.addWebVttScript_();
      const updateDisplay = () => this.trigger('texttrackchange');
      const textTracksChanges = () => {
        updateDisplay();
        for (let i = 0; i < tracks.length; i++) {
          const track = tracks[i];
          track.removeEventListener('cuechange', updateDisplay);
          if (track.mode === 'showing') {
            track.addEventListener('cuechange', updateDisplay);
          }
        }
      };
      textTracksChanges();
      tracks.addEventListener('change', textTracksChanges);
      tracks.addEventListener('addtrack', textTracksChanges);
      tracks.addEventListener('removetrack', textTracksChanges);
      this.on('dispose', function () {
        remoteTracks.off('addtrack', handleAddTrack);
        remoteTracks.off('removetrack', handleRemoveTrack);
        tracks.removeEventListener('change', textTracksChanges);
        tracks.removeEventListener('addtrack', textTracksChanges);
        tracks.removeEventListener('removetrack', textTracksChanges);
        for (let i = 0; i < tracks.length; i++) {
          const track = tracks[i];
          track.removeEventListener('cuechange', updateDisplay);
        }
      });
    }

    /**
     * Create and returns a remote {@link TextTrack} object.
     *
     * @param {string} kind
     *        `TextTrack` kind (subtitles, captions, descriptions, chapters, or metadata)
     *
     * @param {string} [label]
     *        Label to identify the text track
     *
     * @param {string} [language]
     *        Two letter language abbreviation
     *
     * @return {TextTrack}
     *         The TextTrack that gets created.
     */
    addTextTrack(kind, label, language) {
      if (!kind) {
        throw new Error('TextTrack kind is required but was not provided');
      }
      return createTrackHelper(this, kind, label, language);
    }

    /**
     * Create an emulated TextTrack for use by addRemoteTextTrack
     *
     * This is intended to be overridden by classes that inherit from
     * Tech in order to create native or custom TextTracks.
     *
     * @param {Object} options
     *        The object should contain the options to initialize the TextTrack with.
     *
     * @param {string} [options.kind]
     *        `TextTrack` kind (subtitles, captions, descriptions, chapters, or metadata).
     *
     * @param {string} [options.label].
     *        Label to identify the text track
     *
     * @param {string} [options.language]
     *        Two letter language abbreviation.
     *
     * @return {HTMLTrackElement}
     *         The track element that gets created.
     */
    createRemoteTextTrack(options) {
      const track = merge(options, {
        tech: this
      });
      return new REMOTE.remoteTextEl.TrackClass(track);
    }

    /**
     * Creates a remote text track object and returns an html track element.
     *
     * > Note: This can be an emulated {@link HTMLTrackElement} or a native one.
     *
     * @param {Object} options
     *        See {@link Tech#createRemoteTextTrack} for more detailed properties.
     *
     * @param {boolean} [manualCleanup=false]
     *        - When false: the TextTrack will be automatically removed from the video
     *          element whenever the source changes
     *        - When True: The TextTrack will have to be cleaned up manually
     *
     * @return {HTMLTrackElement}
     *         An Html Track Element.
     *
     */
    addRemoteTextTrack(options = {}, manualCleanup) {
      const htmlTrackElement = this.createRemoteTextTrack(options);
      if (typeof manualCleanup !== 'boolean') {
        manualCleanup = false;
      }

      // store HTMLTrackElement and TextTrack to remote list
      this.remoteTextTrackEls().addTrackElement_(htmlTrackElement);
      this.remoteTextTracks().addTrack(htmlTrackElement.track);
      if (manualCleanup === false) {
        // create the TextTrackList if it doesn't exist
        this.ready(() => this.autoRemoteTextTracks_.addTrack(htmlTrackElement.track));
      }
      return htmlTrackElement;
    }

    /**
     * Remove a remote text track from the remote `TextTrackList`.
     *
     * @param {TextTrack} track
     *        `TextTrack` to remove from the `TextTrackList`
     */
    removeRemoteTextTrack(track) {
      const trackElement = this.remoteTextTrackEls().getTrackElementByTrack_(track);

      // remove HTMLTrackElement and TextTrack from remote list
      this.remoteTextTrackEls().removeTrackElement_(trackElement);
      this.remoteTextTracks().removeTrack(track);
      this.autoRemoteTextTracks_.removeTrack(track);
    }

    /**
     * Gets available media playback quality metrics as specified by the W3C's Media
     * Playback Quality API.
     *
     * @see [Spec]{@link https://wicg.github.io/media-playback-quality}
     *
     * @return {Object}
     *         An object with supported media playback quality metrics
     *
     * @abstract
     */
    getVideoPlaybackQuality() {
      return {};
    }

    /**
     * Attempt to create a floating video window always on top of other windows
     * so that users may continue consuming media while they interact with other
     * content sites, or applications on their device.
     *
     * @see [Spec]{@link https://wicg.github.io/picture-in-picture}
     *
     * @return {Promise|undefined}
     *         A promise with a Picture-in-Picture window if the browser supports
     *         Promises (or one was passed in as an option). It returns undefined
     *         otherwise.
     *
     * @abstract
     */
    requestPictureInPicture() {
      return Promise.reject();
    }

    /**
     * A method to check for the value of the 'disablePictureInPicture' <video> property.
     * Defaults to true, as it should be considered disabled if the tech does not support pip
     *
     * @abstract
     */
    disablePictureInPicture() {
      return true;
    }

    /**
     * A method to set or unset the 'disablePictureInPicture' <video> property.
     *
     * @abstract
     */
    setDisablePictureInPicture() {}

    /**
     * A fallback implementation of requestVideoFrameCallback using requestAnimationFrame
     *
     * @param {function} cb
     * @return {number} request id
     */
    requestVideoFrameCallback(cb) {
      const id = newGUID();
      if (!this.isReady_ || this.paused()) {
        this.queuedHanders_.add(id);
        this.one('playing', () => {
          if (this.queuedHanders_.has(id)) {
            this.queuedHanders_.delete(id);
            cb();
          }
        });
      } else {
        this.requestNamedAnimationFrame(id, cb);
      }
      return id;
    }

    /**
     * A fallback implementation of cancelVideoFrameCallback
     *
     * @param {number} id id of callback to be cancelled
     */
    cancelVideoFrameCallback(id) {
      if (this.queuedHanders_.has(id)) {
        this.queuedHanders_.delete(id);
      } else {
        this.cancelNamedAnimationFrame(id);
      }
    }

    /**
     * A method to set a poster from a `Tech`.
     *
     * @abstract
     */
    setPoster() {}

    /**
     * A method to check for the presence of the 'playsinline' <video> attribute.
     *
     * @abstract
     */
    playsinline() {}

    /**
     * A method to set or unset the 'playsinline' <video> attribute.
     *
     * @abstract
     */
    setPlaysinline() {}

    /**
     * Attempt to force override of native audio tracks.
     *
     * @param {boolean} override - If set to true native audio will be overridden,
     * otherwise native audio will potentially be used.
     *
     * @abstract
     */
    overrideNativeAudioTracks(override) {}

    /**
     * Attempt to force override of native video tracks.
     *
     * @param {boolean} override - If set to true native video will be overridden,
     * otherwise native video will potentially be used.
     *
     * @abstract
     */
    overrideNativeVideoTracks(override) {}

    /**
     * Check if the tech can support the given mime-type.
     *
     * The base tech does not support any type, but source handlers might
     * overwrite this.
     *
     * @param  {string} _type
     *         The mimetype to check for support
     *
     * @return {string}
     *         'probably', 'maybe', or empty string
     *
     * @see [Spec]{@link https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/canPlayType}
     *
     * @abstract
     */
    canPlayType(_type) {
      return '';
    }

    /**
     * Check if the type is supported by this tech.
     *
     * The base tech does not support any type, but source handlers might
     * overwrite this.
     *
     * @param {string} _type
     *        The media type to check
     * @return {string} Returns the native video element's response
     */
    static canPlayType(_type) {
      return '';
    }

    /**
     * Check if the tech can support the given source
     *
     * @param {Object} srcObj
     *        The source object
     * @param {Object} options
     *        The options passed to the tech
     * @return {string} 'probably', 'maybe', or '' (empty string)
     */
    static canPlaySource(srcObj, options) {
      return Tech.canPlayType(srcObj.type);
    }

    /*
     * Return whether the argument is a Tech or not.
     * Can be passed either a Class like `Html5` or a instance like `player.tech_`
     *
     * @param {Object} component
     *        The item to check
     *
     * @return {boolean}
     *         Whether it is a tech or not
     *         - True if it is a tech
     *         - False if it is not
     */
    static isTech(component) {
      return component.prototype instanceof Tech || component instanceof Tech || component === Tech;
    }

    /**
     * Registers a `Tech` into a shared list for videojs.
     *
     * @param {string} name
     *        Name of the `Tech` to register.
     *
     * @param {Object} tech
     *        The `Tech` class to register.
     */
    static registerTech(name, tech) {
      if (!Tech.techs_) {
        Tech.techs_ = {};
      }
      if (!Tech.isTech(tech)) {
        throw new Error(`Tech ${name} must be a Tech`);
      }
      if (!Tech.canPlayType) {
        throw new Error('Techs must have a static canPlayType method on them');
      }
      if (!Tech.canPlaySource) {
        throw new Error('Techs must have a static canPlaySource method on them');
      }
      name = toTitleCase(name);
      Tech.techs_[name] = tech;
      Tech.techs_[toLowerCase(name)] = tech;
      if (name !== 'Tech') {
        // camel case the techName for use in techOrder
        Tech.defaultTechOrder_.push(name);
      }
      return tech;
    }

    /**
     * Get a `Tech` from the shared list by name.
     *
     * @param {string} name
     *        `camelCase` or `TitleCase` name of the Tech to get
     *
     * @return {Tech|undefined}
     *         The `Tech` or undefined if there was no tech with the name requested.
     */
    static getTech(name) {
      if (!name) {
        return;
      }
      if (Tech.techs_ && Tech.techs_[name]) {
        return Tech.techs_[name];
      }
      name = toTitleCase(name);
      if (window && window.videojs && window.videojs[name]) {
        log.warn(`The ${name} tech was added to the videojs object when it should be registered using videojs.registerTech(name, tech)`);
        return window.videojs[name];
      }
    }
  }

  /**
   * Get the {@link VideoTrackList}
   *
   * @returns {VideoTrackList}
   * @method Tech.prototype.videoTracks
   */

  /**
   * Get the {@link AudioTrackList}
   *
   * @returns {AudioTrackList}
   * @method Tech.prototype.audioTracks
   */

  /**
   * Get the {@link TextTrackList}
   *
   * @returns {TextTrackList}
   * @method Tech.prototype.textTracks
   */

  /**
   * Get the remote element {@link TextTrackList}
   *
   * @returns {TextTrackList}
   * @method Tech.prototype.remoteTextTracks
   */

  /**
   * Get the remote element {@link HtmlTrackElementList}
   *
   * @returns {HtmlTrackElementList}
   * @method Tech.prototype.remoteTextTrackEls
   */

  ALL.names.forEach(function (name) {
    const props = ALL[name];
    Tech.prototype[props.getterName] = function () {
      this[props.privateName] = this[props.privateName] || new props.ListClass();
      return this[props.privateName];
    };
  });

  /**
   * List of associated text tracks
   *
   * @type {TextTrackList}
   * @private
   * @property Tech#textTracks_
   */

  /**
   * List of associated audio tracks.
   *
   * @type {AudioTrackList}
   * @private
   * @property Tech#audioTracks_
   */

  /**
   * List of associated video tracks.
   *
   * @type {VideoTrackList}
   * @private
   * @property Tech#videoTracks_
   */

  /**
   * Boolean indicating whether the `Tech` supports volume control.
   *
   * @type {boolean}
   * @default
   */
  Tech.prototype.featuresVolumeControl = true;

  /**
   * Boolean indicating whether the `Tech` supports muting volume.
   *
   * @type {boolean}
   * @default
   */
  Tech.prototype.featuresMuteControl = true;

  /**
   * Boolean indicating whether the `Tech` supports fullscreen resize control.
   * Resizing plugins using request fullscreen reloads the plugin
   *
   * @type {boolean}
   * @default
   */
  Tech.prototype.featuresFullscreenResize = false;

  /**
   * Boolean indicating whether the `Tech` supports changing the speed at which the video
   * plays. Examples:
   *   - Set player to play 2x (twice) as fast
   *   - Set player to play 0.5x (half) as fast
   *
   * @type {boolean}
   * @default
   */
  Tech.prototype.featuresPlaybackRate = false;

  /**
   * Boolean indicating whether the `Tech` supports the `progress` event.
   * This will be used to determine if {@link Tech#manualProgressOn} should be called.
   *
   * @type {boolean}
   * @default
   */
  Tech.prototype.featuresProgressEvents = false;

  /**
   * Boolean indicating whether the `Tech` supports the `sourceset` event.
   *
   * A tech should set this to `true` and then use {@link Tech#triggerSourceset}
   * to trigger a {@link Tech#event:sourceset} at the earliest time after getting
   * a new source.
   *
   * @type {boolean}
   * @default
   */
  Tech.prototype.featuresSourceset = false;

  /**
   * Boolean indicating whether the `Tech` supports the `timeupdate` event.
   * This will be used to determine if {@link Tech#manualTimeUpdates} should be called.
   *
   * @type {boolean}
   * @default
   */
  Tech.prototype.featuresTimeupdateEvents = false;

  /**
   * Boolean indicating whether the `Tech` supports the native `TextTrack`s.
   * This will help us integrate with native `TextTrack`s if the browser supports them.
   *
   * @type {boolean}
   * @default
   */
  Tech.prototype.featuresNativeTextTracks = false;

  /**
   * Boolean indicating whether the `Tech` supports `requestVideoFrameCallback`.
   *
   * @type {boolean}
   * @default
   */
  Tech.prototype.featuresVideoFrameCallback = false;

  /**
   * A functional mixin for techs that want to use the Source Handler pattern.
   * Source handlers are scripts for handling specific formats.
   * The source handler pattern is used for adaptive formats (HLS, DASH) that
   * manually load video data and feed it into a Source Buffer (Media Source Extensions)
   * Example: `Tech.withSourceHandlers.call(MyTech);`
   *
   * @param {Tech} _Tech
   *        The tech to add source handler functions to.
   *
   * @mixes Tech~SourceHandlerAdditions
   */
  Tech.withSourceHandlers = function (_Tech) {
    /**
     * Register a source handler
     *
     * @param {Function} handler
     *        The source handler class
     *
     * @param {number} [index]
     *        Register it at the following index
     */
    _Tech.registerSourceHandler = function (handler, index) {
      let handlers = _Tech.sourceHandlers;
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
     * Check if the tech can support the given type. Also checks the
     * Techs sourceHandlers.
     *
     * @param {string} type
     *         The mimetype to check.
     *
     * @return {string}
     *         'probably', 'maybe', or '' (empty string)
     */
    _Tech.canPlayType = function (type) {
      const handlers = _Tech.sourceHandlers || [];
      let can;
      for (let i = 0; i < handlers.length; i++) {
        can = handlers[i].canPlayType(type);
        if (can) {
          return can;
        }
      }
      return '';
    };

    /**
     * Returns the first source handler that supports the source.
     *
     * TODO: Answer question: should 'probably' be prioritized over 'maybe'
     *
     * @param {Tech~SourceObject} source
     *        The source object
     *
     * @param {Object} options
     *        The options passed to the tech
     *
     * @return {SourceHandler|null}
     *          The first source handler that supports the source or null if
     *          no SourceHandler supports the source
     */
    _Tech.selectSourceHandler = function (source, options) {
      const handlers = _Tech.sourceHandlers || [];
      let can;
      for (let i = 0; i < handlers.length; i++) {
        can = handlers[i].canHandleSource(source, options);
        if (can) {
          return handlers[i];
        }
      }
      return null;
    };

    /**
     * Check if the tech can support the given source.
     *
     * @param {Tech~SourceObject} srcObj
     *        The source object
     *
     * @param {Object} options
     *        The options passed to the tech
     *
     * @return {string}
     *         'probably', 'maybe', or '' (empty string)
     */
    _Tech.canPlaySource = function (srcObj, options) {
      const sh = _Tech.selectSourceHandler(srcObj, options);
      if (sh) {
        return sh.canHandleSource(srcObj, options);
      }
      return '';
    };

    /**
     * When using a source handler, prefer its implementation of
     * any function normally provided by the tech.
     */
    const deferrable = ['seekable', 'seeking', 'duration'];

    /**
     * A wrapper around {@link Tech#seekable} that will call a `SourceHandler`s seekable
     * function if it exists, with a fallback to the Techs seekable function.
     *
     * @method _Tech.seekable
     */

    /**
     * A wrapper around {@link Tech#duration} that will call a `SourceHandler`s duration
     * function if it exists, otherwise it will fallback to the techs duration function.
     *
     * @method _Tech.duration
     */

    deferrable.forEach(function (fnName) {
      const originalFn = this[fnName];
      if (typeof originalFn !== 'function') {
        return;
      }
      this[fnName] = function () {
        if (this.sourceHandler_ && this.sourceHandler_[fnName]) {
          return this.sourceHandler_[fnName].apply(this.sourceHandler_, arguments);
        }
        return originalFn.apply(this, arguments);
      };
    }, _Tech.prototype);

    /**
     * Create a function for setting the source using a source object
     * and source handlers.
     * Should never be called unless a source handler was found.
     *
     * @param {Tech~SourceObject} source
     *        A source object with src and type keys
     */
    _Tech.prototype.setSource = function (source) {
      let sh = _Tech.selectSourceHandler(source, this.options_);
      if (!sh) {
        // Fall back to a native source handler when unsupported sources are
        // deliberately set
        if (_Tech.nativeSourceHandler) {
          sh = _Tech.nativeSourceHandler;
        } else {
          log.error('No source handler found for the current source.');
        }
      }

      // Dispose any existing source handler
      this.disposeSourceHandler();
      this.off('dispose', this.disposeSourceHandler_);
      if (sh !== _Tech.nativeSourceHandler) {
        this.currentSource_ = source;
      }
      this.sourceHandler_ = sh.handleSource(source, this, this.options_);
      this.one('dispose', this.disposeSourceHandler_);
    };

    /**
     * Clean up any existing SourceHandlers and listeners when the Tech is disposed.
     *
     * @listens Tech#dispose
     */
    _Tech.prototype.disposeSourceHandler = function () {
      // if we have a source and get another one
      // then we are loading something new
      // than clear all of our current tracks
      if (this.currentSource_) {
        this.clearTracks(['audio', 'video']);
        this.currentSource_ = null;
      }

      // always clean up auto-text tracks
      this.cleanupAutoTextTracks();
      if (this.sourceHandler_) {
        if (this.sourceHandler_.dispose) {
          this.sourceHandler_.dispose();
        }
        this.sourceHandler_ = null;
      }
    };
  };

  // The base Tech class needs to be registered as a Component. It is the only
  // Tech that can be registered as a Component.
  Component.registerComponent('Tech', Tech);
  Tech.registerTech('Tech', Tech);

  /**
   * A list of techs that should be added to techOrder on Players
   *
   * @private
   */
  Tech.defaultTechOrder_ = [];

  /**
   * @file middleware.js
   * @module middleware
   */
  const middlewares = {};
  const middlewareInstances = {};
  const TERMINATOR = {};

  /**
   * A middleware object is a plain JavaScript object that has methods that
   * match the {@link Tech} methods found in the lists of allowed
   * {@link module:middleware.allowedGetters|getters},
   * {@link module:middleware.allowedSetters|setters}, and
   * {@link module:middleware.allowedMediators|mediators}.
   *
   * @typedef {Object} MiddlewareObject
   */

  /**
   * A middleware factory function that should return a
   * {@link module:middleware~MiddlewareObject|MiddlewareObject}.
   *
   * This factory will be called for each player when needed, with the player
   * passed in as an argument.
   *
   * @callback MiddlewareFactory
   * @param { import('../player').default } player
   *        A Video.js player.
   */

  /**
   * Define a middleware that the player should use by way of a factory function
   * that returns a middleware object.
   *
   * @param  {string} type
   *         The MIME type to match or `"*"` for all MIME types.
   *
   * @param  {MiddlewareFactory} middleware
   *         A middleware factory function that will be executed for
   *         matching types.
   */
  function use(type, middleware) {
    middlewares[type] = middlewares[type] || [];
    middlewares[type].push(middleware);
  }

  /**
   * Asynchronously sets a source using middleware by recursing through any
   * matching middlewares and calling `setSource` on each, passing along the
   * previous returned value each time.
   *
   * @param  { import('../player').default } player
   *         A {@link Player} instance.
   *
   * @param  {Tech~SourceObject} src
   *         A source object.
   *
   * @param  {Function}
   *         The next middleware to run.
   */
  function setSource(player, src, next) {
    player.setTimeout(() => setSourceHelper(src, middlewares[src.type], next, player), 1);
  }

  /**
   * When the tech is set, passes the tech to each middleware's `setTech` method.
   *
   * @param {Object[]} middleware
   *        An array of middleware instances.
   *
   * @param { import('../tech/tech').default } tech
   *        A Video.js tech.
   */
  function setTech(middleware, tech) {
    middleware.forEach(mw => mw.setTech && mw.setTech(tech));
  }

  /**
   * Calls a getter on the tech first, through each middleware
   * from right to left to the player.
   *
   * @param  {Object[]} middleware
   *         An array of middleware instances.
   *
   * @param  { import('../tech/tech').default } tech
   *         The current tech.
   *
   * @param  {string} method
   *         A method name.
   *
   * @return {*}
   *         The final value from the tech after middleware has intercepted it.
   */
  function get(middleware, tech, method) {
    return middleware.reduceRight(middlewareIterator(method), tech[method]());
  }

  /**
   * Takes the argument given to the player and calls the setter method on each
   * middleware from left to right to the tech.
   *
   * @param  {Object[]} middleware
   *         An array of middleware instances.
   *
   * @param  { import('../tech/tech').default } tech
   *         The current tech.
   *
   * @param  {string} method
   *         A method name.
   *
   * @param  {*} arg
   *         The value to set on the tech.
   *
   * @return {*}
   *         The return value of the `method` of the `tech`.
   */
  function set(middleware, tech, method, arg) {
    return tech[method](middleware.reduce(middlewareIterator(method), arg));
  }

  /**
   * Takes the argument given to the player and calls the `call` version of the
   * method on each middleware from left to right.
   *
   * Then, call the passed in method on the tech and return the result unchanged
   * back to the player, through middleware, this time from right to left.
   *
   * @param  {Object[]} middleware
   *         An array of middleware instances.
   *
   * @param  { import('../tech/tech').default } tech
   *         The current tech.
   *
   * @param  {string} method
   *         A method name.
   *
   * @param  {*} arg
   *         The value to set on the tech.
   *
   * @return {*}
   *         The return value of the `method` of the `tech`, regardless of the
   *         return values of middlewares.
   */
  function mediate(middleware, tech, method, arg = null) {
    const callMethod = 'call' + toTitleCase(method);
    const middlewareValue = middleware.reduce(middlewareIterator(callMethod), arg);
    const terminated = middlewareValue === TERMINATOR;
    // deprecated. The `null` return value should instead return TERMINATOR to
    // prevent confusion if a techs method actually returns null.
    const returnValue = terminated ? null : tech[method](middlewareValue);
    executeRight(middleware, method, returnValue, terminated);
    return returnValue;
  }

  /**
   * Enumeration of allowed getters where the keys are method names.
   *
   * @type {Object}
   */
  const allowedGetters = {
    buffered: 1,
    currentTime: 1,
    duration: 1,
    muted: 1,
    played: 1,
    paused: 1,
    seekable: 1,
    volume: 1,
    ended: 1
  };

  /**
   * Enumeration of allowed setters where the keys are method names.
   *
   * @type {Object}
   */
  const allowedSetters = {
    setCurrentTime: 1,
    setMuted: 1,
    setVolume: 1
  };

  /**
   * Enumeration of allowed mediators where the keys are method names.
   *
   * @type {Object}
   */
  const allowedMediators = {
    play: 1,
    pause: 1
  };
  function middlewareIterator(method) {
    return (value, mw) => {
      // if the previous middleware terminated, pass along the termination
      if (value === TERMINATOR) {
        return TERMINATOR;
      }
      if (mw[method]) {
        return mw[method](value);
      }
      return value;
    };
  }
  function executeRight(mws, method, value, terminated) {
    for (let i = mws.length - 1; i >= 0; i--) {
      const mw = mws[i];
      if (mw[method]) {
        mw[method](terminated, value);
      }
    }
  }

  /**
   * Clear the middleware cache for a player.
   *
   * @param  { import('../player').default } player
   *         A {@link Player} instance.
   */
  function clearCacheForPlayer(player) {
    middlewareInstances[player.id()] = null;
  }

  /**
   * {
   *  [playerId]: [[mwFactory, mwInstance], ...]
   * }
   *
   * @private
   */
  function getOrCreateFactory(player, mwFactory) {
    const mws = middlewareInstances[player.id()];
    let mw = null;
    if (mws === undefined || mws === null) {
      mw = mwFactory(player);
      middlewareInstances[player.id()] = [[mwFactory, mw]];
      return mw;
    }
    for (let i = 0; i < mws.length; i++) {
      const [mwf, mwi] = mws[i];
      if (mwf !== mwFactory) {
        continue;
      }
      mw = mwi;
    }
    if (mw === null) {
      mw = mwFactory(player);
      mws.push([mwFactory, mw]);
    }
    return mw;
  }
  function setSourceHelper(src = {}, middleware = [], next, player, acc = [], lastRun = false) {
    const [mwFactory, ...mwrest] = middleware;

    // if mwFactory is a string, then we're at a fork in the road
    if (typeof mwFactory === 'string') {
      setSourceHelper(src, middlewares[mwFactory], next, player, acc, lastRun);

      // if we have an mwFactory, call it with the player to get the mw,
      // then call the mw's setSource method
    } else if (mwFactory) {
      const mw = getOrCreateFactory(player, mwFactory);

      // if setSource isn't present, implicitly select this middleware
      if (!mw.setSource) {
        acc.push(mw);
        return setSourceHelper(src, mwrest, next, player, acc, lastRun);
      }
      mw.setSource(Object.assign({}, src), function (err, _src) {
        // something happened, try the next middleware on the current level
        // make sure to use the old src
        if (err) {
          return setSourceHelper(src, mwrest, next, player, acc, lastRun);
        }

        // we've succeeded, now we need to go deeper
        acc.push(mw);

        // if it's the same type, continue down the current chain
        // otherwise, we want to go down the new chain
        setSourceHelper(_src, src.type === _src.type ? mwrest : middlewares[_src.type], next, player, acc, lastRun);
      });
    } else if (mwrest.length) {
      setSourceHelper(src, mwrest, next, player, acc, lastRun);
    } else if (lastRun) {
      next(src, acc);
    } else {
      setSourceHelper(src, middlewares['*'], next, player, acc, true);
    }
  }

  /**
   * Mimetypes
   *
   * @see https://www.iana.org/assignments/media-types/media-types.xhtml
   * @typedef Mimetypes~Kind
   * @enum
   */
  const MimetypesKind = {
    opus: 'video/ogg',
    ogv: 'video/ogg',
    mp4: 'video/mp4',
    mov: 'video/mp4',
    m4v: 'video/mp4',
    mkv: 'video/x-matroska',
    m4a: 'audio/mp4',
    mp3: 'audio/mpeg',
    aac: 'audio/aac',
    caf: 'audio/x-caf',
    flac: 'audio/flac',
    oga: 'audio/ogg',
    wav: 'audio/wav',
    m3u8: 'application/x-mpegURL',
    mpd: 'application/dash+xml',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    gif: 'image/gif',
    png: 'image/png',
    svg: 'image/svg+xml',
    webp: 'image/webp'
  };

  /**
   * Get the mimetype of a given src url if possible
   *
   * @param {string} src
   *        The url to the src
   *
   * @return {string}
   *         return the mimetype if it was known or empty string otherwise
   */
  const getMimetype = function (src = '') {
    const ext = getFileExtension(src);
    const mimetype = MimetypesKind[ext.toLowerCase()];
    return mimetype || '';
  };

  /**
   * Find the mime type of a given source string if possible. Uses the player
   * source cache.
   *
   * @param { import('../player').default } player
   *        The player object
   *
   * @param {string} src
   *        The source string
   *
   * @return {string}
   *         The type that was found
   */
  const findMimetype = (player, src) => {
    if (!src) {
      return '';
    }

    // 1. check for the type in the `source` cache
    if (player.cache_.source.src === src && player.cache_.source.type) {
      return player.cache_.source.type;
    }

    // 2. see if we have this source in our `currentSources` cache
    const matchingSources = player.cache_.sources.filter(s => s.src === src);
    if (matchingSources.length) {
      return matchingSources[0].type;
    }

    // 3. look for the src url in source elements and use the type there
    const sources = player.$$('source');
    for (let i = 0; i < sources.length; i++) {
      const s = sources[i];
      if (s.type && s.src && s.src === src) {
        return s.type;
      }
    }

    // 4. finally fallback to our list of mime types based on src url extension
    return getMimetype(src);
  };

  /**
   * @module filter-source
   */

  /**
   * Filter out single bad source objects or multiple source objects in an
   * array. Also flattens nested source object arrays into a 1 dimensional
   * array of source objects.
   *
   * @param {Tech~SourceObject|Tech~SourceObject[]} src
   *        The src object to filter
   *
   * @return {Tech~SourceObject[]}
   *         An array of sourceobjects containing only valid sources
   *
   * @private
   */
  const filterSource = function (src) {
    // traverse array
    if (Array.isArray(src)) {
      let newsrc = [];
      src.forEach(function (srcobj) {
        srcobj = filterSource(srcobj);
        if (Array.isArray(srcobj)) {
          newsrc = newsrc.concat(srcobj);
        } else if (isObject(srcobj)) {
          newsrc.push(srcobj);
        }
      });
      src = newsrc;
    } else if (typeof src === 'string' && src.trim()) {
      // convert string into object
      src = [fixSource({
        src
      })];
    } else if (isObject(src) && typeof src.src === 'string' && src.src && src.src.trim()) {
      // src is already valid
      src = [fixSource(src)];
    } else {
      // invalid source, turn it into an empty array
      src = [];
    }
    return src;
  };

  /**
   * Checks src mimetype, adding it when possible
   *
   * @param {Tech~SourceObject} src
   *        The src object to check
   * @return {Tech~SourceObject}
   *        src Object with known type
   */
  function fixSource(src) {
    if (!src.type) {
      const mimetype = getMimetype(src.src);
      if (mimetype) {
        src.type = mimetype;
      }
    }
    return src;
  }

  var icons = "<svg xmlns=\"http://www.w3.org/2000/svg\">\n  <defs>\n    <symbol viewBox=\"0 0 16 16\" id=\"vjs-icon-play\">\n      <path d=\"M2 1v14l12-7z\"></path>\n    </symbol>\n    <symbol viewBox=\"0 0 24 24\" id=\"vjs-icon-pause\">\n       <path d=\"M10 4H5v16h5V4zm9 0h-5v16h5V4z\"/>\n    </symbol>\n    <symbol viewBox=\"0 0 24 24\" id=\"vjs-icon-audio\">\n      <g><rect fill='none' height='24' width='24'/></g><g><path d='M12,3c-4.97,0-9,4.03-9,9v7c0,1.1,0.9,2,2,2h4v-8H5v-1c0-3.87,3.13-7,7-7s7,3.13,7,7v1h-4v8h4c1.1,0,2-0.9,2-2v-7 C21,7.03,16.97,3,12,3z'/></g>\n    </symbol>\n    <symbol viewBox=\"0 0 576 512\" id=\"vjs-icon-captions\">\n      <path d='M0 96C0 60.7 28.7 32 64 32H512c35.3 0 64 28.7 64 64V416c0 35.3-28.7 64-64 64H64c-35.3 0-64-28.7-64-64V96zM200 208c14.2 0 27 6.1 35.8 16c8.8 9.9 24 10.7 33.9 1.9s10.7-24 1.9-33.9c-17.5-19.6-43.1-32-71.5-32c-53 0-96 43-96 96s43 96 96 96c28.4 0 54-12.4 71.5-32c8.8-9.9 8-25-1.9-33.9s-25-8-33.9 1.9c-8.8 9.9-21.6 16-35.8 16c-26.5 0-48-21.5-48-48s21.5-48 48-48zm144 48c0-26.5 21.5-48 48-48c14.2 0 27 6.1 35.8 16c8.8 9.9 24 10.7 33.9 1.9s10.7-24 1.9-33.9c-17.5-19.6-43.1-32-71.5-32c-53 0-96 43-96 96s43 96 96 96c28.4 0 54-12.4 71.5-32c8.8-9.9 8-25-1.9-33.9s-25-8-33.9 1.9c-8.8 9.9-21.6 16-35.8 16c-26.5 0-48-21.5-48-48z'/>\n    </symbol>\n    <symbol viewBox=\"0 0 24 24\" id=\"vjs-icon-subtitles\">\n      <path d='M0 0h24v24H0z' fill='none'/><path d='M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zM4 12h4v2H4v-2zm10 6H4v-2h10v2zm6 0h-4v-2h4v2zm0-4H10v-2h10v2z'/>\n    </symbol>\n    <symbol viewBox=\"0 0 448 512\" id=\"vjs-icon-fullscreen-enter\">\n      <path d='M0 180V56c0-13.3 10.7-24 24-24h124c6.6 0 12 5.4 12 12v40c0 6.6-5.4 12-12 12H64v84c0 6.6-5.4 12-12 12H12c-6.6 0-12-5.4-12-12zM288 44v40c0 6.6 5.4 12 12 12h84v84c0 6.6 5.4 12 12 12h40c6.6 0 12-5.4 12-12V56c0-13.3-10.7-24-24-24H300c-6.6 0-12 5.4-12 12zm148 276h-40c-6.6 0-12 5.4-12 12v84h-84c-6.6 0-12 5.4-12 12v40c0 6.6 5.4 12 12 12h124c13.3 0 24-10.7 24-24V332c0-6.6-5.4-12-12-12zM160 468v-40c0-6.6-5.4-12-12-12H64v-84c0-6.6-5.4-12-12-12H12c-6.6 0-12 5.4-12 12v124c0 13.3 10.7 24 24 24h124c6.6 0 12-5.4 12-12z'/>\n    </symbol>\n    <symbol viewBox=\"0 0 24 24\" id=\"vjs-icon-fullscreen-exit\">\n      <path d=\"M16,9h5a1,1,0,0,0,0-2H17V3a1,1,0,0,0-2,0V8A1,1,0,0,0,16,9ZM8,15H3a1,1,0,0,0,0,2H7v4a1,1,0,0,0,2,0V16A1,1,0,0,0,8,15ZM8,2A1,1,0,0,0,7,3V7H3A1,1,0,0,0,3,9H8A1,1,0,0,0,9,8V3A1,1,0,0,0,8,2ZM21,15H16a1,1,0,0,0-1,1v5a1,1,0,0,0,2,0V17h4a1,1,0,0,0,0-2Z\"/>\n    </symbol>\n    <symbol viewBox=\"0 0 512 512\" id=\"vjs-icon-play-circle\">\n      <path d='M464 256A208 208 0 1 0 48 256a208 208 0 1 0 416 0zM0 256a256 256 0 1 1 512 0A256 256 0 1 1 0 256zM188.3 147.1c7.6-4.2 16.8-4.1 24.3 .5l144 88c7.1 4.4 11.5 12.1 11.5 20.5s-4.4 16.1-11.5 20.5l-144 88c-7.4 4.5-16.7 4.7-24.3 .5s-12.3-12.2-12.3-20.9V168c0-8.7 4.7-16.7 12.3-20.9z'/>\n    </symbol>\n    <symbol viewBox=\"0 0 24 24\" id=\"vjs-icon-volume-mute\">\n      <path d='M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z'/>\n    </symbol>\n    <symbol viewBox=\"0 0 24 24\" id=\"vjs-icon-volume-low\">\n      <path d=\"M0 0h24v24H0z\" fill=\"none\"/><path d=\"M7 9v6h4l5 5V4l-5 5H7z\"/>\n    </symbol>\n    <symbol viewBox=\"0 0 24 24\" id=\"vjs-icon-volume-medium\">\n      <path d=\"M0 0h24v24H0z\" fill=\"none\"/><path d=\"M18.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM5 9v6h4l5 5V4L9 9H5z\"/>\n    </symbol>\n    <symbol viewBox=\"0 0 24 24\" id=\"vjs-icon-volume-high\">\n      <path d=\"M0 0h24v24H0z\" fill=\"none\"/><path d=\"M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z\"/>\n    </symbol>\n    <symbol viewBox=\"0 0 512 512\" id=\"vjs-icon-spinner\">\n      <path d='M304 48a48 48 0 1 0 -96 0 48 48 0 1 0 96 0zm0 416a48 48 0 1 0 -96 0 48 48 0 1 0 96 0zM48 304a48 48 0 1 0 0-96 48 48 0 1 0 0 96zm464-48a48 48 0 1 0 -96 0 48 48 0 1 0 96 0zM142.9 437A48 48 0 1 0 75 369.1 48 48 0 1 0 142.9 437zm0-294.2A48 48 0 1 0 75 75a48 48 0 1 0 67.9 67.9zM369.1 437A48 48 0 1 0 437 369.1 48 48 0 1 0 369.1 437z'/>\n    </symbol>\n    <symbol viewBox=\"0 0 24 24\" id=\"vjs-icon-hd\">\n      <path d='M19 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-8 12H9.5v-2h-2v2H6V9h1.5v2.5h2V9H11v6zm2-6h4c.55 0 1 .45 1 1v4c0 .55-.45 1-1 1h-4V9zm1.5 4.5h2v-3h-2v3z'/>\n    </symbol>\n    <symbol viewBox=\"0 0 24 24\" id=\"vjs-icon-chapters\">\n      <path d='M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z'/>\n    </symbol>\n    <symbol viewBox=\"0 0 24 24\" id=\"vjs-icon-downloading\">\n      <path d='M18.32,4.26C16.84,3.05,15.01,2.25,13,2.05v2.02c1.46,0.18,2.79,0.76,3.9,1.62L18.32,4.26z M19.93,11h2.02 c-0.2-2.01-1-3.84-2.21-5.32L18.31,7.1C19.17,8.21,19.75,9.54,19.93,11z M18.31,16.9l1.43,1.43c1.21-1.48,2.01-3.32,2.21-5.32 h-2.02C19.75,14.46,19.17,15.79,18.31,16.9z M13,19.93v2.02c2.01-0.2,3.84-1,5.32-2.21l-1.43-1.43 C15.79,19.17,14.46,19.75,13,19.93z M15.59,10.59L13,13.17V7h-2v6.17l-2.59-2.59L7,12l5,5l5-5L15.59,10.59z M11,19.93v2.02 c-5.05-0.5-9-4.76-9-9.95s3.95-9.45,9-9.95v2.02C7.05,4.56,4,7.92,4,12S7.05,19.44,11,19.93z'/>\n    </symbol>\n    <symbol viewBox=\"0 0 24 24\" id=\"vjs-icon-file-download\">\n      <path d='M18,15v3H6v-3H4v3c0,1.1,0.9,2,2,2h12c1.1,0,2-0.9,2-2v-3H18z M17,11l-1.41-1.41L13,12.17V4h-2v8.17L8.41,9.59L7,11l5,5 L17,11z'/>\n    </symbol>\n    <symbol viewBox=\"0 0 24 24\" id=\"vjs-icon-file-download-done\">\n      <polygon points='20.13,5.41 18.72,4 9.53,13.19 5.28,8.95 3.87,10.36 9.53,16.02'/><rect height='2' width='14' x='5' y='18'/>\n    </symbol>\n    <symbol viewBox=\"0 0 24 24\" id=\"vjs-icon-file-download-off\">\n      <path d='M18,15.17V15h2v2.17L18,15.17z M15.41,12.59L17,11l-1.41-1.41L14,11.17L15.41,12.59z M13,10.17V4h-2v4.17L13,10.17z M21.19,21.19l-1.78-1.78L2.81,2.81L1.39,4.22l6.19,6.19L7,11l5,5l0.59-0.59L15.17,18H6v-3H4v3c0,1.1,0.9,2,2,2h11.17l2.61,2.61 L21.19,21.19z'/>\n    </symbol>\n    <symbol viewBox=\"0 0 24 24\" id=\"vjs-icon-share\">\n      <path d='M0 0h24v24H0z' fill='none'/><path d='M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z'/>\n    </symbol>\n    <symbol viewBox=\"0 0 24 24\" id=\"vjs-icon-cog\">\n      <path d='M0,0h24v24H0V0z' fill='none'/><path d='M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z'/>\n    </symbol>\n    <symbol viewBox=\"0 0 448 512\" id=\"vjs-icon-square\">\n      <path d='M384 80c8.8 0 16 7.2 16 16V416c0 8.8-7.2 16-16 16H64c-8.8 0-16-7.2-16-16V96c0-8.8 7.2-16 16-16H384zM64 32C28.7 32 0 60.7 0 96V416c0 35.3 28.7 64 64 64H384c35.3 0 64-28.7 64-64V96c0-35.3-28.7-64-64-64H64z'/>\n    </symbol>\n    <symbol viewBox=\"0 0 512 512\" id=\"vjs-icon-circle\">\n      <path d='M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512z'/>\n    </symbol>\n    <symbol viewBox=\"0 0 24 24\" id=\"vjs-icon-circle-outline\">\n      <path d='M12,2C6.47,2,2,6.47,2,12c0,5.53,4.47,10,10,10s10-4.47,10-10C22,6.47,17.53,2,12,2z M12,20c-4.42,0-8-3.58-8-8 c0-4.42,3.58-8,8-8s8,3.58,8,8C20,16.42,16.42,20,12,20z'/>\n    </symbol>\n    <symbol viewBox=\"0 0 24 24\" id=\"vjs-icon-circle-inner-circle\">\n      <path d='M12 2C6.49 2 2 6.49 2 12s4.49 10 10 10 10-4.49 10-10S17.51 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3-8c0 1.66-1.34 3-3 3s-3-1.34-3-3 1.34-3 3-3 3 1.34 3 3z'/>\n    </symbol>\n    <symbol viewBox=\"0 0 24 24\" id=\"vjs-icon-cancel\">\n      <path d='M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z'/>\n    </symbol>\n    <symbol viewBox=\"0 0 24 24\" id=\"vjs-icon-repeat\">\n      <path d='M0 0h24v24H0z' fill='none'/><path d='M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z'/>\n    </symbol>\n    <symbol viewBox=\"0 0 24 24\" id=\"vjs-icon-replay\">\n      <path d='M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z'/>\n    </symbol>\n    <symbol viewBox=\"0 96 48 48\" id=\"vjs-icon-replay-5\">\n      <path d='m17.68852 98-8.69633 8.69633 8.69633 8.69634 2.48665-2.48434-4.31928-4.31928h1.3011c4.93015 0 9.07149 1.72189 12.42399 5.16511 3.35251 3.44322 5.02876 7.63753 5.02876 12.58345h3.54972c0-2.95809-.55264-5.7293-1.657-8.3127-1.10435-2.5834-2.62238-4.84095-4.555-6.77357-1.93262-1.93262-4.19017-3.45065-6.77357-4.55501-2.5834-1.10435-5.35462-1.65699-8.31271-1.65699H15.5l4.61508-4.61509zm-8.07929 21.65879v13.86144h11.35631v5.00796H9.60923V143h12.699c.83466 0 1.55075-.29818 2.14693-.89436.59619-.59619.89436-1.30996.89436-2.14462v-7.78117c0-.83466-.29817-1.55075-.89436-2.14693-.59618-.59618-1.31227-.89436-2.14693-.89436h-8.22719v-5.09578h11.26848v-4.38399z'/>\n    </symbol>\n    <symbol viewBox=\"0 96 48 48\" id=\"vjs-icon-replay-10\">\n      <path d='M42.314792 125.62978c0-4.99676-1.693476-9.23445-5.080438-12.71305-3.386962-3.47861-7.570851-5.21791-12.551676-5.21791h-1.314946l4.363203 4.3632-2.510335 2.51034-8.786174-8.78619L25.2206 97l2.450567 2.45057-4.662053 4.66205h1.374714c2.988489 0 5.787713.55785 8.397671 1.67355 2.609949 1.11571 4.891163 2.64981 6.843654 4.60229 1.952481 1.95248 3.486576 4.2337 4.602275 6.84365 1.115709 2.60995 1.673563 5.40917 1.673563 8.39767zM8.1829433 142v-19.65677H3.17603v-4.5433h9.642939V142Zm13.6299297 0c-1.155923 0-2.126398-.39251-2.911424-1.17755-.778861-.77885-1.168286-1.74624-1.168286-2.90215v-16.04066c0-1.15593.392524-2.1264 1.17755-2.91144.77886-.77885 1.746237-1.16827 2.90216-1.16827h7.695814c1.155914 0 2.126388.39251 2.911425 1.17755.77885.77886 1.168275 1.74623 1.168275 2.90216v16.04066c0 1.15591-.392513 2.12639-1.177549 2.91142-.778851.77885-1.746237 1.16828-2.902151 1.16828Zm.556316-4.63603h6.583172v-15.02074h-6.583172z'/>\n    </symbol>\n    <symbol viewBox=\"0 96 48 48\" id=\"vjs-icon-replay-30\">\n      <path d='m26.046875 97-8.732422 8.73242 8.732422 8.73242 2.496094-2.49414-4.335938-4.33789h1.306641c4.950749 0 9.108097 1.72991 12.474609 5.1875 3.366504 3.4576 5.050781 7.66818 5.050781 12.63477h3.564454c0-2.97045-.555098-5.75152-1.664063-8.3457-1.108965-2.59419-2.633522-4.86205-4.574219-6.80274-1.940688-1.94069-4.208545-3.46525-6.802734-4.57422-2.59419-1.10897-5.375262-1.66406-8.345703-1.66406h-1.367188l4.634766-4.63477zM2.5546875 117.53125v4.6875H12.851562v5.25H5.8730469v4.6875h6.9785151v5.15625H2.5546875V142H13.361328c1.06088 0 1.950319-.39495 2.667969-1.18555.71765-.79059 1.076172-1.7727 1.076172-2.9414v-16.2168c0-1.1687-.358522-2.14886-1.076172-2.93945-.71765-.79059-1.607089-1.18555-2.667969-1.18555zm22.4824215.14063c-1.148936 0-2.110612.38991-2.884765 1.16406-.780292.78029-1.171875 1.74365-1.171875 2.89258v15.94336c0 1.14892.387966 2.1106 1.162109 2.88476.780302.78029 1.745595 1.17188 2.894531 1.17188h7.648438c1.148936 0 2.110613-.38795 2.884765-1.16211.780294-.78029 1.169922-1.74561 1.169922-2.89453v-15.94336c0-1.14893-.386013-2.11061-1.160156-2.88477-.780293-.78029-1.745595-1.17187-2.894531-1.17187zm.552735 4.51757h6.544922v14.92969h-6.544922z'/>\n    </symbol>\n    <symbol viewBox=\"0 96 48 48\" id=\"vjs-icon-forward-5\">\n      <path d='m29.50843 97-2.43193 2.42962 4.6253 4.6253h-1.3642c-2.96464 0-5.74198.55386-8.3311 1.66066-2.58912 1.1068-4.85167 2.62819-6.78857 4.56508-1.93689 1.9369-3.45828 4.19945-4.56508 6.78857-1.1068 2.58911-1.66066 5.36646-1.66066 8.3311h3.55757c0-4.95687 1.67996-9.16047 5.03989-12.6113 3.35992-3.45084 7.51042-5.17654 12.45149-5.17654h1.30398l-4.32653 4.32883 2.48984 2.48984 8.71558-8.71558zm-9.78332 21.60945v13.8898h11.38144v5.01905H19.72511V142h12.72711c.83651 0 1.55186-.29884 2.14937-.89634.5975-.59751.89634-1.31286.89634-2.14936v-7.7984c0-.83651-.29884-1.55418-.89634-2.15168-.59751-.5975-1.31286-.89634-2.14937-.89634h-8.2454v-5.10706h11.29111v-4.39137z'/>\n    </symbol>\n    <symbol viewBox=\"0 96 48 48\" id=\"vjs-icon-forward-10\">\n      <path d='m23.118923 97-2.385761 2.38349 4.537491 4.53749h-1.338298c-2.908354 0-5.632974.54335-8.172936 1.62913-2.539963 1.08579-4.759558 2.57829-6.659682 4.47842-1.900125 1.90012-3.39263 4.11972-4.478415 6.65968-1.085785 2.53996-1.629134 5.26458-1.629134 8.17294h3.490028c0-4.86277 1.648071-8.98656 4.944206-12.37188 3.296134-3.38532 7.367841-5.07826 12.215097-5.07826h1.279222l-4.244383 4.24665 2.442565 2.44257 8.550114-8.55012zm-9.520322 21.44913v4.42161h4.871497V142h4.512496v-23.55087zm18.136328 0c-1.124919 0-2.06632.37811-2.824287 1.13608-.763982.76398-1.147437 1.70845-1.147437 2.83337v15.61197c0 1.12492.380382 2.06631 1.138349 2.82428.763983.76398 1.708456 1.14517 2.833375 1.14517h7.489021c1.12492 0 2.06632-.37811 2.82428-1.13608.76399-.76398 1.14517-1.70845 1.14517-2.83337v-15.61197c0-1.12492-.37811-2.06632-1.13608-2.82429-.76398-.76398-1.70845-1.14516-2.83337-1.14516zm.540773 4.42161h6.407468v14.61676h-6.407468z'/>\n    </symbol>\n    <symbol viewBox=\"0 96 48 48\" id=\"vjs-icon-forward-30\">\n      <path d='m25.548631 97-2.436697 2.43438 4.634367 4.63436H26.37943c-2.970448 0-5.753239.55495-8.347429 1.66392-2.594191 1.10897-4.861176 2.63334-6.801867 4.57403-1.940693 1.94069-3.465063 4.20767-4.57403 6.80187-1.108967 2.59419-1.663916 5.37698-1.663916 8.34742h3.56454c0-4.96658 1.683258-9.17841 5.049766-12.63601 3.366507-3.4576 7.525145-5.18669 12.475891-5.18669h1.306534l-4.335002 4.33733 2.494714 2.49471 8.73266-8.73266zm-11.552266 20.53092v4.68774h10.296787v5.24934h-6.978237v4.68774h6.978237v5.15652H13.996365V142h10.807333c1.060879 0 1.94879-.39527 2.666443-1.18586.717653-.79059 1.076789-1.77158 1.076789-2.94028v-16.2168c0-1.1687-.359136-2.14969-1.076789-2.94028-.717653-.79059-1.605564-1.18586-2.666443-1.18586zm21.173741.16708c-1.148937 0-2.110436.38851-2.884586 1.16266-.780294.78029-1.171935 1.74493-1.171935 2.89387v15.94296c0 1.14894.388502 2.11043 1.162652 2.88458.780294.78029 1.744932 1.16962 2.893869 1.16962h7.648904c1.14894 0 2.11044-.38619 2.88459-1.16033.78029-.7803 1.16961-1.74493 1.16961-2.89387v-15.94296c0-1.14894-.38618-2.11044-1.16033-2.88459-.78029-.78029-1.74493-1.17194-2.89387-1.17194zm.552317 4.51602h6.541957v14.93115h-6.541957z'/>\n    </symbol>\n    <symbol viewBox=\"0 0 512 512\" xmlns:sketch='http://www.bohemiancoding.com/sketch/ns' id=\"vjs-icon-audio-description\">\n      <g id='Page-1' stroke='none' stroke-width='1' sketch:type='MSPage'><g id='AD' sketch:type='MSArtboardGroup'><g id='g24' sketch:type='MSLayerGroup' transform='translate(226.904216, 162.124958)'><path d='M0.385466989,219.226204 L0.385466989,0.867948105 C50.7660025,-0.149278544 89.4938709,-2.16027378 118.016886,17.9940357 C145.39121,37.3362698 166.750707,74.9591545 162.906445,123.318579 C158.839382,174.474203 121.571663,217.457893 73.1311827,221.793795 C49.0460488,223.949377 1.1583283,221.793795 1.1583283,221.793795 C1.1583283,221.793795 0.318395733,220.441758 0.385466989,219.226204 M49.1404882,164.421786 C80.5703101,165.681697 102.34881,147.788744 105.636072,119.036417 C110.038491,80.5268177 84.4473371,55.4838492 47.5943801,58.2399576 L47.5943801,161.852062 C47.5585317,163.318404 48.1702678,164.071194 49.1404882,164.421786' id='path26' sketch:type='MSShapeGroup'></path></g><g id='g28' sketch:type='MSLayerGroup' transform='translate(383.779991, 168.926023)'><path d='M0,212.402042 C13.3360014,216.111401 17.386874,201.342635 23.2151349,190.99422 C35.936702,168.422877 45.5086182,139.400143 45.6604922,106.220214 C45.8813648,58.6259492 27.3172746,23.7033002 10.059532,0.0383859113 L1.54919183,0.0383859113 C0.96289654,3.91152436 3.77564916,7.35260805 5.41542574,10.3142944 C18.5814362,34.0755999 30.7818519,66.8674044 30.9556975,104.507776 C31.1545985,147.683822 16.7932549,183.786198 0,212.402042' id='path30' sketch:type='MSShapeGroup'></path></g><g id='g32' sketch:type='MSLayerGroup' transform='translate(425.153705, 168.926023)'><path d='M0,212.402042 C13.3360014,216.111401 17.3841758,201.340502 23.2151349,190.99422 C35.936702,168.422877 45.5066909,139.400143 45.6604922,106.220214 C45.8813648,58.6259492 27.3172746,23.7033002 10.059532,0.0383859113 L1.54919183,0.0383859113 C0.96289654,3.91152436 3.77487823,7.35346107 5.41542574,10.3142944 C18.5814362,34.0755999 30.7822374,66.8674044 30.9556975,104.507776 C31.1545985,147.683822 16.7932549,183.786198 0,212.402042' id='path34' sketch:type='MSShapeGroup'></path></g><g id='g36' sketch:type='MSLayerGroup' transform='translate(466.260868, 168.926023)'><path d='M0,212.402042 C13.3360014,216.111401 17.3841758,201.340502 23.2151349,190.99422 C35.936702,168.422877 45.5066909,139.400143 45.6604922,106.220214 C45.8813648,58.6259492 27.3172746,23.7033002 10.059532,0.0383859113 L1.54919183,0.0383859113 C0.96289654,3.91152436 3.77487823,7.35303456 5.41542574,10.3142944 C18.5814362,34.0755999 30.7818519,66.8674044 30.9556975,104.507776 C31.1545985,147.683822 16.7932549,183.786198 0,212.402042' id='path38' sketch:type='MSShapeGroup'></path></g><path d='M4.4765625,383.005158 L72.5800993,383.005158 L91.1530552,354.521486 L155.321745,354.386058 C155.321745,354.386058 155.386889,373.799083 155.386889,383.005158 L204.142681,383.005158 L204.142681,160.308263 L145.326586,160.308263 C139.673713,169.845383 4.4765625,383.005158 4.4765625,383.005158 L4.4765625,383.005158 Z M157.144233,237.722611 L157.144233,308.881058 L116.6914,308.610203 L157.144233,237.722611 L157.144233,237.722611 Z' id='path22' sketch:type='MSShapeGroup'></path></g></g>\n    </symbol>\n    <symbol viewBox=\"0 0 24 24\" id=\"vjs-icon-next-item\">\n      <path d='M0 0h24v24H0z' fill='none'/><path d='M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z'/>\n    </symbol>\n    <symbol viewBox=\"0 0 24 24\" id=\"vjs-icon-previous-item\">\n      <path d='M0 0h24v24H0z' fill='none'/><path d='M6 6h2v12H6zm3.5 6l8.5 6V6z'/>\n    </symbol>\n    <symbol viewBox=\"0 0 24 24\" id=\"vjs-icon-shuffle\">\n      <path d='M0 0h24v24H0z' fill='none'/><path d='M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z'/>\n    </symbol>\n    <symbol viewBox=\"0 0 24 24\" id=\"vjs-icon-cast\">\n      <path d='M0 0h24v24H0z' fill='none'/><path d='M0 0h24v24H0z' fill='none' opacity='.1'/><path d='M21 3H3c-1.1 0-2 .9-2 2v3h2V5h18v14h-7v2h7c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM1 18v3h3c0-1.66-1.34-3-3-3zm0-4v2c2.76 0 5 2.24 5 5h2c0-3.87-3.13-7-7-7zm0-4v2c4.97 0 9 4.03 9 9h2c0-6.08-4.93-11-11-11z'/>\n    </symbol>\n    <symbol viewBox=\"0 0 24 24\" id=\"vjs-icon-picture-in-picture-enter\">\n      <path d='M0 0h24v24H0V0z' fill='none'/><path d='M19 11h-8v6h8v-6zm4 8V4.98C23 3.88 22.1 3 21 3H3c-1.1 0-2 .88-2 1.98V19c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2zm-2 .02H3V4.97h18v14.05z'/>\n    </symbol>\n    <symbol viewBox=\"0 0 22 18\" id=\"vjs-icon-picture-in-picture-exit\">\n      <path d='M18 4H4v10h14V4zm4 12V1.98C22 .88 21.1 0 20 0H2C.9 0 0 .88 0 1.98V16c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2zm-2 .02H2V1.97h18v14.05z'/><path fill='none' d='M-1-3h24v24H-1z'/>\n    </symbol>\n    <symbol viewBox=\"0 0 320 512\" id=\"vjs-icon-facebook\">\n      <path d='M279.14 288l14.22-92.66h-88.91v-60.13c0-25.35 12.42-50.06 52.24-50.06h40.42V6.26S260.43 0 225.36 0c-73.22 0-121.08 44.38-121.08 124.72v70.62H22.89V288h81.39v224h100.17V288z'/>\n    </symbol>\n    <symbol viewBox=\"0 0 448 512\" id=\"vjs-icon-linkedin\">\n      <path d='M100.28 448H7.4V148.9h92.88zM53.79 108.1C24.09 108.1 0 83.5 0 53.8a53.79 53.79 0 0 1 107.58 0c0 29.7-24.1 54.3-53.79 54.3zM447.9 448h-92.68V302.4c0-34.7-.7-79.2-48.29-79.2-48.29 0-55.69 37.7-55.69 76.7V448h-92.78V148.9h89.08v40.8h1.3c12.4-23.5 42.69-48.3 87.88-48.3 94 0 111.28 61.9 111.28 142.3V448z'/>\n    </symbol>\n    <symbol viewBox=\"0 0 512 512\" id=\"vjs-icon-twitter\">\n      <path d='M459.37 151.716c.325 4.548.325 9.097.325 13.645 0 138.72-105.583 298.558-298.558 298.558-59.452 0-114.68-17.219-161.137-47.106 8.447.974 16.568 1.299 25.34 1.299 49.055 0 94.213-16.568 130.274-44.832-46.132-.975-84.792-31.188-98.112-72.772 6.498.974 12.995 1.624 19.818 1.624 9.421 0 18.843-1.3 27.614-3.573-48.081-9.747-84.143-51.98-84.143-102.985v-1.299c13.969 7.797 30.214 12.67 47.431 13.319-28.264-18.843-46.781-51.005-46.781-87.391 0-19.492 5.197-37.36 14.294-52.954 51.655 63.675 129.3 105.258 216.365 109.807-1.624-7.797-2.599-15.918-2.599-24.04 0-57.828 46.782-104.934 104.934-104.934 30.213 0 57.502 12.67 76.67 33.137 23.715-4.548 46.456-13.32 66.599-25.34-7.798 24.366-24.366 44.833-46.132 57.827 21.117-2.273 41.584-8.122 60.426-16.243-14.292 20.791-32.161 39.308-52.628 54.253z'/>\n    </symbol>\n    <symbol viewBox=\"0 0 320 512\" id=\"vjs-icon-tumblr\">\n      <path d='M309.8 480.3c-13.6 14.5-50 31.7-97.4 31.7-120.8 0-147-88.8-147-140.6v-144H17.9c-5.5 0-10-4.5-10-10v-68c0-7.2 4.5-13.6 11.3-16 62-21.8 81.5-76 84.3-117.1.8-11 6.5-16.3 16.1-16.3h70.9c5.5 0 10 4.5 10 10v115.2h83c5.5 0 10 4.4 10 9.9v81.7c0 5.5-4.5 10-10 10h-83.4V360c0 34.2 23.7 53.6 68 35.8 4.8-1.9 9-3.2 12.7-2.2 3.5.9 5.8 3.4 7.4 7.9l22 64.3c1.8 5 3.3 10.6-.4 14.5z'/>\n    </symbol>\n    <symbol viewBox=\"0 0 496 512\" id=\"vjs-icon-pinterest\">\n      <path d='M496 256c0 137-111 248-248 248-25.6 0-50.2-3.9-73.4-11.1 10.1-16.5 25.2-43.5 30.8-65 3-11.6 15.4-59 15.4-59 8.1 15.4 31.7 28.5 56.8 28.5 74.8 0 128.7-68.8 128.7-154.3 0-81.9-66.9-143.2-152.9-143.2-107 0-163.9 71.8-163.9 150.1 0 36.4 19.4 81.7 50.3 96.1 4.7 2.2 7.2 1.2 8.3-3.3.8-3.4 5-20.3 6.9-28.1.6-2.5.3-4.7-1.7-7.1-10.1-12.5-18.3-35.3-18.3-56.6 0-54.7 41.4-107.6 112-107.6 60.9 0 103.6 41.5 103.6 100.9 0 67.1-33.9 113.6-78 113.6-24.3 0-42.6-20.1-36.7-44.8 7-29.5 20.5-61.3 20.5-82.6 0-19-10.2-34.9-31.4-34.9-24.9 0-44.9 25.7-44.9 60.2 0 22 7.4 36.8 7.4 36.8s-24.5 103.8-29 123.2c-5 21.4-3 51.6-.9 71.2C65.4 450.9 0 361.1 0 256 0 119 111 8 248 8s248 111 248 248z'/>\n    </symbol>\n  </defs>\n</svg>";

  /**
   * @file loader.js
   */

  /**
   * The `MediaLoader` is the `Component` that decides which playback technology to load
   * when a player is initialized.
   *
   * @extends Component
   */
  class MediaLoader extends Component {
    /**
     * Create an instance of this class.
     *
     * @param { import('../player').default } player
     *        The `Player` that this class should attach to.
     *
     * @param {Object} [options]
     *        The key/value store of player options.
     *
     * @param {Function} [ready]
     *        The function that is run when this component is ready.
     */
    constructor(player, options, ready) {
      // MediaLoader has no element
      const options_ = merge({
        createEl: false
      }, options);
      super(player, options_, ready);

      // If there are no sources when the player is initialized,
      // load the first supported playback technology.

      if (!options.playerOptions.sources || options.playerOptions.sources.length === 0) {
        for (let i = 0, j = options.playerOptions.techOrder; i < j.length; i++) {
          const techName = toTitleCase(j[i]);
          let tech = Tech.getTech(techName);

          // Support old behavior of techs being registered as components.
          // Remove once that deprecated behavior is removed.
          if (!techName) {
            tech = Component.getComponent(techName);
          }

          // Check if the browser supports this technology
          if (tech && tech.isSupported()) {
            player.loadTech_(techName);
            break;
          }
        }
      } else {
        // Loop through playback technologies (e.g. HTML5) and check for support.
        // Then load the best source.
        // A few assumptions here:
        //   All playback technologies respect preload false.
        player.src(options.playerOptions.sources);
      }
    }
  }
  Component.registerComponent('MediaLoader', MediaLoader);

  /**
   * @file clickable-component.js
   */

  /**
   * Component which is clickable or keyboard actionable, but is not a
   * native HTML button.
   *
   * @extends Component
   */
  class ClickableComponent extends Component {
    /**
     * Creates an instance of this class.
     *
     * @param  { import('./player').default } player
     *         The `Player` that this class should be attached to.
     *
     * @param  {Object} [options]
     *         The key/value store of component options.
     *
     * @param  {function} [options.clickHandler]
     *         The function to call when the button is clicked / activated
     *
     * @param  {string} [options.controlText]
     *         The text to set on the button
     *
     * @param  {string} [options.className]
     *         A class or space separated list of classes to add the component
     *
     */
    constructor(player, options) {
      super(player, options);
      if (this.options_.controlText) {
        this.controlText(this.options_.controlText);
      }
      this.handleMouseOver_ = e => this.handleMouseOver(e);
      this.handleMouseOut_ = e => this.handleMouseOut(e);
      this.handleClick_ = e => this.handleClick(e);
      this.handleKeyDown_ = e => this.handleKeyDown(e);
      this.emitTapEvents();
      this.enable();
    }

    /**
     * Create the `ClickableComponent`s DOM element.
     *
     * @param {string} [tag=div]
     *        The element's node type.
     *
     * @param {Object} [props={}]
     *        An object of properties that should be set on the element.
     *
     * @param {Object} [attributes={}]
     *        An object of attributes that should be set on the element.
     *
     * @return {Element}
     *         The element that gets created.
     */
    createEl(tag = 'div', props = {}, attributes = {}) {
      props = Object.assign({
        className: this.buildCSSClass(),
        tabIndex: 0
      }, props);
      if (tag === 'button') {
        log.error(`Creating a ClickableComponent with an HTML element of ${tag} is not supported; use a Button instead.`);
      }

      // Add ARIA attributes for clickable element which is not a native HTML button
      attributes = Object.assign({
        role: 'button'
      }, attributes);
      this.tabIndex_ = props.tabIndex;
      const el = createEl(tag, props, attributes);
      if (!this.player_.options_.experimentalSvgIcons) {
        el.appendChild(createEl('span', {
          className: 'vjs-icon-placeholder'
        }, {
          'aria-hidden': true
        }));
      }
      this.createControlTextEl(el);
      return el;
    }
    dispose() {
      // remove controlTextEl_ on dispose
      this.controlTextEl_ = null;
      super.dispose();
    }

    /**
     * Create a control text element on this `ClickableComponent`
     *
     * @param {Element} [el]
     *        Parent element for the control text.
     *
     * @return {Element}
     *         The control text element that gets created.
     */
    createControlTextEl(el) {
      this.controlTextEl_ = createEl('span', {
        className: 'vjs-control-text'
      }, {
        // let the screen reader user know that the text of the element may change
        'aria-live': 'polite'
      });
      if (el) {
        el.appendChild(this.controlTextEl_);
      }
      this.controlText(this.controlText_, el);
      return this.controlTextEl_;
    }

    /**
     * Get or set the localize text to use for the controls on the `ClickableComponent`.
     *
     * @param {string} [text]
     *        Control text for element.
     *
     * @param {Element} [el=this.el()]
     *        Element to set the title on.
     *
     * @return {string}
     *         - The control text when getting
     */
    controlText(text, el = this.el()) {
      if (text === undefined) {
        return this.controlText_ || 'Need Text';
      }
      const localizedText = this.localize(text);

      /** @protected */
      this.controlText_ = text;
      textContent(this.controlTextEl_, localizedText);
      if (!this.nonIconControl && !this.player_.options_.noUITitleAttributes) {
        // Set title attribute if only an icon is shown
        el.setAttribute('title', localizedText);
      }
    }

    /**
     * Builds the default DOM `className`.
     *
     * @return {string}
     *         The DOM `className` for this object.
     */
    buildCSSClass() {
      return `vjs-control vjs-button ${super.buildCSSClass()}`;
    }

    /**
     * Enable this `ClickableComponent`
     */
    enable() {
      if (!this.enabled_) {
        this.enabled_ = true;
        this.removeClass('vjs-disabled');
        this.el_.setAttribute('aria-disabled', 'false');
        if (typeof this.tabIndex_ !== 'undefined') {
          this.el_.setAttribute('tabIndex', this.tabIndex_);
        }
        this.on(['tap', 'click'], this.handleClick_);
        this.on('keydown', this.handleKeyDown_);
      }
    }

    /**
     * Disable this `ClickableComponent`
     */
    disable() {
      this.enabled_ = false;
      this.addClass('vjs-disabled');
      this.el_.setAttribute('aria-disabled', 'true');
      if (typeof this.tabIndex_ !== 'undefined') {
        this.el_.removeAttribute('tabIndex');
      }
      this.off('mouseover', this.handleMouseOver_);
      this.off('mouseout', this.handleMouseOut_);
      this.off(['tap', 'click'], this.handleClick_);
      this.off('keydown', this.handleKeyDown_);
    }

    /**
     * Handles language change in ClickableComponent for the player in components
     *
     *
     */
    handleLanguagechange() {
      this.controlText(this.controlText_);
    }

    /**
     * Event handler that is called when a `ClickableComponent` receives a
     * `click` or `tap` event.
     *
     * @param {Event} event
     *        The `tap` or `click` event that caused this function to be called.
     *
     * @listens tap
     * @listens click
     * @abstract
     */
    handleClick(event) {
      if (this.options_.clickHandler) {
        this.options_.clickHandler.call(this, arguments);
      }
    }

    /**
     * Event handler that is called when a `ClickableComponent` receives a
     * `keydown` event.
     *
     * By default, if the key is Space or Enter, it will trigger a `click` event.
     *
     * @param {Event} event
     *        The `keydown` event that caused this function to be called.
     *
     * @listens keydown
     */
    handleKeyDown(event) {
      // Support Space or Enter key operation to fire a click event. Also,
      // prevent the event from propagating through the DOM and triggering
      // Player hotkeys.
      if (keycode.isEventKey(event, 'Space') || keycode.isEventKey(event, 'Enter')) {
        event.preventDefault();
        event.stopPropagation();
        this.trigger('click');
      } else {
        // Pass keypress handling up for unsupported keys
        super.handleKeyDown(event);
      }
    }
  }
  Component.registerComponent('ClickableComponent', ClickableComponent);

  /**
   * @file poster-image.js
   */

  /**
   * A `ClickableComponent` that handles showing the poster image for the player.
   *
   * @extends ClickableComponent
   */
  class PosterImage extends ClickableComponent {
    /**
     * Create an instance of this class.
     *
     * @param { import('./player').default } player
     *        The `Player` that this class should attach to.
     *
     * @param {Object} [options]
     *        The key/value store of player options.
     */
    constructor(player, options) {
      super(player, options);
      this.update();
      this.update_ = e => this.update(e);
      player.on('posterchange', this.update_);
    }

    /**
     * Clean up and dispose of the `PosterImage`.
     */
    dispose() {
      this.player().off('posterchange', this.update_);
      super.dispose();
    }

    /**
     * Create the `PosterImage`s DOM element.
     *
     * @return {Element}
     *         The element that gets created.
     */
    createEl() {
      // The el is an empty div to keep position in the DOM
      // A picture and img el will be inserted when a source is set
      return createEl('div', {
        className: 'vjs-poster'
      });
    }

    /**
     * Get or set the `PosterImage`'s crossOrigin option.
     *
     * @param {string|null} [value]
     *        The value to set the crossOrigin to. If an argument is
     *        given, must be one of `'anonymous'` or `'use-credentials'`, or 'null'.
     *
     * @return {string|null}
     *         - The current crossOrigin value of the `Player` when getting.
     *         - undefined when setting
     */
    crossOrigin(value) {
      // `null` can be set to unset a value
      if (typeof value === 'undefined') {
        if (this.$('img')) {
          // If the poster's element exists, give its value
          return this.$('img').crossOrigin;
        } else if (this.player_.tech_ && this.player_.tech_.isReady_) {
          // If not but the tech is ready, query the tech
          return this.player_.crossOrigin();
        }
        // Otherwise check options as the  poster is usually set before the state of crossorigin
        // can be retrieved by the getter
        return this.player_.options_.crossOrigin || this.player_.options_.crossorigin || null;
      }
      if (value !== null && value !== 'anonymous' && value !== 'use-credentials') {
        this.player_.log.warn(`crossOrigin must be null,  "anonymous" or "use-credentials", given "${value}"`);
        return;
      }
      if (this.$('img')) {
        this.$('img').crossOrigin = value;
      }
      return;
    }

    /**
     * An {@link EventTarget~EventListener} for {@link Player#posterchange} events.
     *
     * @listens Player#posterchange
     *
     * @param {Event} [event]
     *        The `Player#posterchange` event that triggered this function.
     */
    update(event) {
      const url = this.player().poster();
      this.setSrc(url);

      // If there's no poster source we should display:none on this component
      // so it's not still clickable or right-clickable
      if (url) {
        this.show();
      } else {
        this.hide();
      }
    }

    /**
     * Set the source of the `PosterImage` depending on the display method. (Re)creates
     * the inner picture and img elementss when needed.
     *
     * @param {string} [url]
     *        The URL to the source for the `PosterImage`. If not specified or falsy,
     *        any source and ant inner picture/img are removed.
     */
    setSrc(url) {
      if (!url) {
        this.el_.textContent = '';
        return;
      }
      if (!this.$('img')) {
        this.el_.appendChild(createEl('picture', {
          className: 'vjs-poster',
          // Don't want poster to be tabbable.
          tabIndex: -1
        }, {}, createEl('img', {
          loading: 'lazy',
          crossOrigin: this.crossOrigin()
        }, {
          alt: ''
        })));
      }
      this.$('img').src = url;
    }

    /**
     * An {@link EventTarget~EventListener} for clicks on the `PosterImage`. See
     * {@link ClickableComponent#handleClick} for instances where this will be triggered.
     *
     * @listens tap
     * @listens click
     * @listens keydown
     *
     * @param {Event} event
     +        The `click`, `tap` or `keydown` event that caused this function to be called.
     */
    handleClick(event) {
      // We don't want a click to trigger playback when controls are disabled
      if (!this.player_.controls()) {
        return;
      }
      if (this.player_.tech(true)) {
        this.player_.tech(true).focus();
      }
      if (this.player_.paused()) {
        silencePromise(this.player_.play());
      } else {
        this.player_.pause();
      }
    }
  }

  /**
   * Get or set the `PosterImage`'s crossorigin option. For the HTML5 player, this
   * sets the `crossOrigin` property on the `<img>` tag to control the CORS
   * behavior.
   *
   * @param {string|null} [value]
   *        The value to set the `PosterImages`'s crossorigin to. If an argument is
   *        given, must be one of `anonymous` or `use-credentials`.
   *
   * @return {string|null|undefined}
   *         - The current crossorigin value of the `Player` when getting.
   *         - undefined when setting
   */
  PosterImage.prototype.crossorigin = PosterImage.prototype.crossOrigin;
  Component.registerComponent('PosterImage', PosterImage);

  /**
   * @file text-track-display.js
   */
  const darkGray = '#222';
  const lightGray = '#ccc';
  const fontMap = {
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
   * Construct an rgba color from a given hex color code.
   *
   * @param {number} color
   *        Hex number for color, like #f0e or #f604e2.
   *
   * @param {number} opacity
   *        Value for opacity, 0.0 - 1.0.
   *
   * @return {string}
   *         The rgba color that was created, like 'rgba(255, 0, 0, 0.3)'.
   */
  function constructColor(color, opacity) {
    let hex;
    if (color.length === 4) {
      // color looks like "#f0e"
      hex = color[1] + color[1] + color[2] + color[2] + color[3] + color[3];
    } else if (color.length === 7) {
      // color looks like "#f604e2"
      hex = color.slice(1);
    } else {
      throw new Error('Invalid color code provided, ' + color + '; must be formatted as e.g. #f0e or #f604e2.');
    }
    return 'rgba(' + parseInt(hex.slice(0, 2), 16) + ',' + parseInt(hex.slice(2, 4), 16) + ',' + parseInt(hex.slice(4, 6), 16) + ',' + opacity + ')';
  }

  /**
   * Try to update the style of a DOM element. Some style changes will throw an error,
   * particularly in IE8. Those should be noops.
   *
   * @param {Element} el
   *        The DOM element to be styled.
   *
   * @param {string} style
   *        The CSS property on the element that should be styled.
   *
   * @param {string} rule
   *        The style rule that should be applied to the property.
   *
   * @private
   */
  function tryUpdateStyle(el, style, rule) {
    try {
      el.style[style] = rule;
    } catch (e) {
      // Satisfies linter.
      return;
    }
  }

  /**
   * Converts the CSS top/right/bottom/left property numeric value to string in pixels.
   *
   * @param {number} position
   *        The CSS top/right/bottom/left property value.
   *
   * @return {string}
   *          The CSS property value that was created, like '10px'.
   *
   * @private
   */
  function getCSSPositionValue(position) {
    return position ? `${position}px` : '';
  }

  /**
   * The component for displaying text track cues.
   *
   * @extends Component
   */
  class TextTrackDisplay extends Component {
    /**
     * Creates an instance of this class.
     *
     * @param { import('../player').default } player
     *        The `Player` that this class should be attached to.
     *
     * @param {Object} [options]
     *        The key/value store of player options.
     *
     * @param {Function} [ready]
     *        The function to call when `TextTrackDisplay` is ready.
     */
    constructor(player, options, ready) {
      super(player, options, ready);
      const updateDisplayTextHandler = e => this.updateDisplay(e);
      const updateDisplayHandler = e => {
        this.updateDisplayOverlay();
        this.updateDisplay(e);
      };
      player.on('loadstart', e => this.toggleDisplay(e));
      player.on('texttrackchange', updateDisplayTextHandler);
      player.on('loadedmetadata', e => {
        this.updateDisplayOverlay();
        this.preselectTrack(e);
      });

      // This used to be called during player init, but was causing an error
      // if a track should show by default and the display hadn't loaded yet.
      // Should probably be moved to an external track loader when we support
      // tracks that don't need a display.
      player.ready(bind_(this, function () {
        if (player.tech_ && player.tech_.featuresNativeTextTracks) {
          this.hide();
          return;
        }
        player.on('fullscreenchange', updateDisplayHandler);
        player.on('playerresize', updateDisplayHandler);
        const screenOrientation = window.screen.orientation || window;
        const changeOrientationEvent = window.screen.orientation ? 'change' : 'orientationchange';
        screenOrientation.addEventListener(changeOrientationEvent, updateDisplayHandler);
        player.on('dispose', () => screenOrientation.removeEventListener(changeOrientationEvent, updateDisplayHandler));
        const tracks = this.options_.playerOptions.tracks || [];
        for (let i = 0; i < tracks.length; i++) {
          this.player_.addRemoteTextTrack(tracks[i], true);
        }
        this.preselectTrack();
      }));
    }

    /**
    * Preselect a track following this precedence:
    * - matches the previously selected {@link TextTrack}'s language and kind
    * - matches the previously selected {@link TextTrack}'s language only
    * - is the first default captions track
    * - is the first default descriptions track
    *
    * @listens Player#loadstart
    */
    preselectTrack() {
      const modes = {
        captions: 1,
        subtitles: 1
      };
      const trackList = this.player_.textTracks();
      const userPref = this.player_.cache_.selectedLanguage;
      let firstDesc;
      let firstCaptions;
      let preferredTrack;
      for (let i = 0; i < trackList.length; i++) {
        const track = trackList[i];
        if (userPref && userPref.enabled && userPref.language && userPref.language === track.language && track.kind in modes) {
          // Always choose the track that matches both language and kind
          if (track.kind === userPref.kind) {
            preferredTrack = track;
            // or choose the first track that matches language
          } else if (!preferredTrack) {
            preferredTrack = track;
          }

          // clear everything if offTextTrackMenuItem was clicked
        } else if (userPref && !userPref.enabled) {
          preferredTrack = null;
          firstDesc = null;
          firstCaptions = null;
        } else if (track.default) {
          if (track.kind === 'descriptions' && !firstDesc) {
            firstDesc = track;
          } else if (track.kind in modes && !firstCaptions) {
            firstCaptions = track;
          }
        }
      }

      // The preferredTrack matches the user preference and takes
      // precedence over all the other tracks.
      // So, display the preferredTrack before the first default track
      // and the subtitles/captions track before the descriptions track
      if (preferredTrack) {
        preferredTrack.mode = 'showing';
      } else if (firstCaptions) {
        firstCaptions.mode = 'showing';
      } else if (firstDesc) {
        firstDesc.mode = 'showing';
      }
    }

    /**
     * Turn display of {@link TextTrack}'s from the current state into the other state.
     * There are only two states:
     * - 'shown'
     * - 'hidden'
     *
     * @listens Player#loadstart
     */
    toggleDisplay() {
      if (this.player_.tech_ && this.player_.tech_.featuresNativeTextTracks) {
        this.hide();
      } else {
        this.show();
      }
    }

    /**
     * Create the {@link Component}'s DOM element.
     *
     * @return {Element}
     *         The element that was created.
     */
    createEl() {
      return super.createEl('div', {
        className: 'vjs-text-track-display'
      }, {
        'translate': 'yes',
        'aria-live': 'off',
        'aria-atomic': 'true'
      });
    }

    /**
     * Clear all displayed {@link TextTrack}s.
     */
    clearDisplay() {
      if (typeof window.WebVTT === 'function') {
        window.WebVTT.processCues(window, [], this.el_);
      }
    }

    /**
     * Update the displayed TextTrack when a either a {@link Player#texttrackchange} or
     * a {@link Player#fullscreenchange} is fired.
     *
     * @listens Player#texttrackchange
     * @listens Player#fullscreenchange
     */
    updateDisplay() {
      const tracks = this.player_.textTracks();
      const allowMultipleShowingTracks = this.options_.allowMultipleShowingTracks;
      this.clearDisplay();
      if (allowMultipleShowingTracks) {
        const showingTracks = [];
        for (let i = 0; i < tracks.length; ++i) {
          const track = tracks[i];
          if (track.mode !== 'showing') {
            continue;
          }
          showingTracks.push(track);
        }
        this.updateForTrack(showingTracks);
        return;
      }

      //  Track display prioritization model: if multiple tracks are 'showing',
      //  display the first 'subtitles' or 'captions' track which is 'showing',
      //  otherwise display the first 'descriptions' track which is 'showing'

      let descriptionsTrack = null;
      let captionsSubtitlesTrack = null;
      let i = tracks.length;
      while (i--) {
        const track = tracks[i];
        if (track.mode === 'showing') {
          if (track.kind === 'descriptions') {
            descriptionsTrack = track;
          } else {
            captionsSubtitlesTrack = track;
          }
        }
      }
      if (captionsSubtitlesTrack) {
        if (this.getAttribute('aria-live') !== 'off') {
          this.setAttribute('aria-live', 'off');
        }
        this.updateForTrack(captionsSubtitlesTrack);
      } else if (descriptionsTrack) {
        if (this.getAttribute('aria-live') !== 'assertive') {
          this.setAttribute('aria-live', 'assertive');
        }
        this.updateForTrack(descriptionsTrack);
      }
    }

    /**
     * Updates the displayed TextTrack to be sure it overlays the video when a either
     * a {@link Player#texttrackchange} or a {@link Player#fullscreenchange} is fired.
     */
    updateDisplayOverlay() {
      // inset-inline and inset-block are not supprted on old chrome, but these are
      // only likely to be used on TV devices
      if (!this.player_.videoHeight() || !window.CSS.supports('inset-inline: 10px')) {
        return;
      }
      const playerWidth = this.player_.currentWidth();
      const playerHeight = this.player_.currentHeight();
      const playerAspectRatio = playerWidth / playerHeight;
      const videoAspectRatio = this.player_.videoWidth() / this.player_.videoHeight();
      let insetInlineMatch = 0;
      let insetBlockMatch = 0;
      if (Math.abs(playerAspectRatio - videoAspectRatio) > 0.1) {
        if (playerAspectRatio > videoAspectRatio) {
          insetInlineMatch = Math.round((playerWidth - playerHeight * videoAspectRatio) / 2);
        } else {
          insetBlockMatch = Math.round((playerHeight - playerWidth / videoAspectRatio) / 2);
        }
      }
      tryUpdateStyle(this.el_, 'insetInline', getCSSPositionValue(insetInlineMatch));
      tryUpdateStyle(this.el_, 'insetBlock', getCSSPositionValue(insetBlockMatch));
    }

    /**
     * Style {@Link TextTrack} activeCues according to {@Link TextTrackSettings}.
     *
     * @param {TextTrack} track
     *        Text track object containing active cues to style.
     */
    updateDisplayState(track) {
      const overrides = this.player_.textTrackSettings.getValues();
      const cues = track.activeCues;
      let i = cues.length;
      while (i--) {
        const cue = cues[i];
        if (!cue) {
          continue;
        }
        const cueDiv = cue.displayState;
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
            cueDiv.firstChild.style.textShadow = `2px 2px 3px ${darkGray}, 2px 2px 4px ${darkGray}, 2px 2px 5px ${darkGray}`;
          } else if (overrides.edgeStyle === 'raised') {
            cueDiv.firstChild.style.textShadow = `1px 1px ${darkGray}, 2px 2px ${darkGray}, 3px 3px ${darkGray}`;
          } else if (overrides.edgeStyle === 'depressed') {
            cueDiv.firstChild.style.textShadow = `1px 1px ${lightGray}, 0 1px ${lightGray}, -1px -1px ${darkGray}, 0 -1px ${darkGray}`;
          } else if (overrides.edgeStyle === 'uniform') {
            cueDiv.firstChild.style.textShadow = `0 0 4px ${darkGray}, 0 0 4px ${darkGray}, 0 0 4px ${darkGray}, 0 0 4px ${darkGray}`;
          }
        }
        if (overrides.fontPercent && overrides.fontPercent !== 1) {
          const fontSize = window.parseFloat(cueDiv.style.fontSize);
          cueDiv.style.fontSize = fontSize * overrides.fontPercent + 'px';
          cueDiv.style.height = 'auto';
          cueDiv.style.top = 'auto';
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

    /**
     * Add an {@link TextTrack} to to the {@link Tech}s {@link TextTrackList}.
     *
     * @param {TextTrack|TextTrack[]} tracks
     *        Text track object or text track array to be added to the list.
     */
    updateForTrack(tracks) {
      if (!Array.isArray(tracks)) {
        tracks = [tracks];
      }
      if (typeof window.WebVTT !== 'function' || tracks.every(track => {
        return !track.activeCues;
      })) {
        return;
      }
      const cues = [];

      // push all active track cues
      for (let i = 0; i < tracks.length; ++i) {
        const track = tracks[i];
        for (let j = 0; j < track.activeCues.length; ++j) {
          cues.push(track.activeCues[j]);
        }
      }

      // removes all cues before it processes new ones
      window.WebVTT.processCues(window, cues, this.el_);

      // add unique class to each language text track & add settings styling if necessary
      for (let i = 0; i < tracks.length; ++i) {
        const track = tracks[i];
        for (let j = 0; j < track.activeCues.length; ++j) {
          const cueEl = track.activeCues[j].displayState;
          addClass(cueEl, 'vjs-text-track-cue', 'vjs-text-track-cue-' + (track.language ? track.language : i));
          if (track.language) {
            setAttribute(cueEl, 'lang', track.language);
          }
        }
        if (this.player_.textTrackSettings) {
          this.updateDisplayState(track);
        }
      }
    }
  }
  Component.registerComponent('TextTrackDisplay', TextTrackDisplay);

  /**
   * @file loading-spinner.js
   */

  /**
   * A loading spinner for use during waiting/loading events.
   *
   * @extends Component
   */
  class LoadingSpinner extends Component {
    /**
     * Create the `LoadingSpinner`s DOM element.
     *
     * @return {Element}
     *         The dom element that gets created.
     */
    createEl() {
      const isAudio = this.player_.isAudio();
      const playerType = this.localize(isAudio ? 'Audio Player' : 'Video Player');
      const controlText = createEl('span', {
        className: 'vjs-control-text',
        textContent: this.localize('{1} is loading.', [playerType])
      });
      const el = super.createEl('div', {
        className: 'vjs-loading-spinner',
        dir: 'ltr'
      });
      el.appendChild(controlText);
      return el;
    }

    /**
     * Update control text on languagechange
     */
    handleLanguagechange() {
      this.$('.vjs-control-text').textContent = this.localize('{1} is loading.', [this.player_.isAudio() ? 'Audio Player' : 'Video Player']);
    }
  }
  Component.registerComponent('LoadingSpinner', LoadingSpinner);

  /**
   * @file button.js
   */

  /**
   * Base class for all buttons.
   *
   * @extends ClickableComponent
   */
  class Button extends ClickableComponent {
    /**
     * Create the `Button`s DOM element.
     *
     * @param {string} [tag="button"]
     *        The element's node type. This argument is IGNORED: no matter what
     *        is passed, it will always create a `button` element.
     *
     * @param {Object} [props={}]
     *        An object of properties that should be set on the element.
     *
     * @param {Object} [attributes={}]
     *        An object of attributes that should be set on the element.
     *
     * @return {Element}
     *         The element that gets created.
     */
    createEl(tag, props = {}, attributes = {}) {
      tag = 'button';
      props = Object.assign({
        className: this.buildCSSClass()
      }, props);

      // Add attributes for button element
      attributes = Object.assign({
        // Necessary since the default button type is "submit"
        type: 'button'
      }, attributes);
      const el = createEl(tag, props, attributes);
      if (!this.player_.options_.experimentalSvgIcons) {
        el.appendChild(createEl('span', {
          className: 'vjs-icon-placeholder'
        }, {
          'aria-hidden': true
        }));
      }
      this.createControlTextEl(el);
      return el;
    }

    /**
     * Add a child `Component` inside of this `Button`.
     *
     * @param {string|Component} child
     *        The name or instance of a child to add.
     *
     * @param {Object} [options={}]
     *        The key/value store of options that will get passed to children of
     *        the child.
     *
     * @return {Component}
     *         The `Component` that gets added as a child. When using a string the
     *         `Component` will get created by this process.
     *
     * @deprecated since version 5
     */
    addChild(child, options = {}) {
      const className = this.constructor.name;
      log.warn(`Adding an actionable (user controllable) child to a Button (${className}) is not supported; use a ClickableComponent instead.`);

      // Avoid the error message generated by ClickableComponent's addChild method
      return Component.prototype.addChild.call(this, child, options);
    }

    /**
     * Enable the `Button` element so that it can be activated or clicked. Use this with
     * {@link Button#disable}.
     */
    enable() {
      super.enable();
      this.el_.removeAttribute('disabled');
    }

    /**
     * Disable the `Button` element so that it cannot be activated or clicked. Use this with
     * {@link Button#enable}.
     */
    disable() {
      super.disable();
      this.el_.setAttribute('disabled', 'disabled');
    }

    /**
     * This gets called when a `Button` has focus and `keydown` is triggered via a key
     * press.
     *
     * @param {Event} event
     *        The event that caused this function to get called.
     *
     * @listens keydown
     */
    handleKeyDown(event) {
      // Ignore Space or Enter key operation, which is handled by the browser for
      // a button - though not for its super class, ClickableComponent. Also,
      // prevent the event from propagating through the DOM and triggering Player
      // hotkeys. We do not preventDefault here because we _want_ the browser to
      // handle it.
      if (keycode.isEventKey(event, 'Space') || keycode.isEventKey(event, 'Enter')) {
        event.stopPropagation();
        return;
      }

      // Pass keypress handling up for unsupported keys
      super.handleKeyDown(event);
    }
  }
  Component.registerComponent('Button', Button);

  /**
   * @file big-play-button.js
   */

  /**
   * The initial play button that shows before the video has played. The hiding of the
   * `BigPlayButton` get done via CSS and `Player` states.
   *
   * @extends Button
   */
  class BigPlayButton extends Button {
    constructor(player, options) {
      super(player, options);
      this.mouseused_ = false;
      this.setIcon('play');
      this.on('mousedown', e => this.handleMouseDown(e));
    }

    /**
     * Builds the default DOM `className`.
     *
     * @return {string}
     *         The DOM `className` for this object. Always returns 'vjs-big-play-button'.
     */
    buildCSSClass() {
      return 'vjs-big-play-button';
    }

    /**
     * This gets called when a `BigPlayButton` "clicked". See {@link ClickableComponent}
     * for more detailed information on what a click can be.
     *
     * @param {KeyboardEvent} event
     *        The `keydown`, `tap`, or `click` event that caused this function to be
     *        called.
     *
     * @listens tap
     * @listens click
     */
    handleClick(event) {
      const playPromise = this.player_.play();

      // exit early if clicked via the mouse
      if (this.mouseused_ && event.clientX && event.clientY) {
        silencePromise(playPromise);
        if (this.player_.tech(true)) {
          this.player_.tech(true).focus();
        }
        return;
      }
      const cb = this.player_.getChild('controlBar');
      const playToggle = cb && cb.getChild('playToggle');
      if (!playToggle) {
        this.player_.tech(true).focus();
        return;
      }
      const playFocus = () => playToggle.focus();
      if (isPromise(playPromise)) {
        playPromise.then(playFocus, () => {});
      } else {
        this.setTimeout(playFocus, 1);
      }
    }
    handleKeyDown(event) {
      this.mouseused_ = false;
      super.handleKeyDown(event);
    }
    handleMouseDown(event) {
      this.mouseused_ = true;
    }
  }

  /**
   * The text that should display over the `BigPlayButton`s controls. Added to for localization.
   *
   * @type {string}
   * @protected
   */
  BigPlayButton.prototype.controlText_ = 'Play Video';
  Component.registerComponent('BigPlayButton', BigPlayButton);

  /**
   * @file close-button.js
   */

  /**
   * The `CloseButton` is a `{@link Button}` that fires a `close` event when
   * it gets clicked.
   *
   * @extends Button
   */
  class CloseButton extends Button {
    /**
    * Creates an instance of the this class.
    *
    * @param  { import('./player').default } player
    *         The `Player` that this class should be attached to.
    *
    * @param  {Object} [options]
    *         The key/value store of player options.
    */
    constructor(player, options) {
      super(player, options);
      this.setIcon('cancel');
      this.controlText(options && options.controlText || this.localize('Close'));
    }

    /**
    * Builds the default DOM `className`.
    *
    * @return {string}
    *         The DOM `className` for this object.
    */
    buildCSSClass() {
      return `vjs-close-button ${super.buildCSSClass()}`;
    }

    /**
     * This gets called when a `CloseButton` gets clicked. See
     * {@link ClickableComponent#handleClick} for more information on when
     * this will be triggered
     *
     * @param {Event} event
     *        The `keydown`, `tap`, or `click` event that caused this function to be
     *        called.
     *
     * @listens tap
     * @listens click
     * @fires CloseButton#close
     */
    handleClick(event) {
      /**
       * Triggered when the a `CloseButton` is clicked.
       *
       * @event CloseButton#close
       * @type {Event}
       *
       * @property {boolean} [bubbles=false]
       *           set to false so that the close event does not
       *           bubble up to parents if there is no listener
       */
      this.trigger({
        type: 'close',
        bubbles: false
      });
    }
    /**
     * Event handler that is called when a `CloseButton` receives a
     * `keydown` event.
     *
     * By default, if the key is Esc, it will trigger a `click` event.
     *
     * @param {Event} event
     *        The `keydown` event that caused this function to be called.
     *
     * @listens keydown
     */
    handleKeyDown(event) {
      // Esc button will trigger `click` event
      if (keycode.isEventKey(event, 'Esc')) {
        event.preventDefault();
        event.stopPropagation();
        this.trigger('click');
      } else {
        // Pass keypress handling up for unsupported keys
        super.handleKeyDown(event);
      }
    }
  }
  Component.registerComponent('CloseButton', CloseButton);

  /**
   * @file play-toggle.js
   */

  /**
   * Button to toggle between play and pause.
   *
   * @extends Button
   */
  class PlayToggle extends Button {
    /**
     * Creates an instance of this class.
     *
     * @param { import('./player').default } player
     *        The `Player` that this class should be attached to.
     *
     * @param {Object} [options={}]
     *        The key/value store of player options.
     */
    constructor(player, options = {}) {
      super(player, options);

      // show or hide replay icon
      options.replay = options.replay === undefined || options.replay;
      this.setIcon('play');
      this.on(player, 'play', e => this.handlePlay(e));
      this.on(player, 'pause', e => this.handlePause(e));
      if (options.replay) {
        this.on(player, 'ended', e => this.handleEnded(e));
      }
    }

    /**
     * Builds the default DOM `className`.
     *
     * @return {string}
     *         The DOM `className` for this object.
     */
    buildCSSClass() {
      return `vjs-play-control ${super.buildCSSClass()}`;
    }

    /**
     * This gets called when an `PlayToggle` is "clicked". See
     * {@link ClickableComponent} for more detailed information on what a click can be.
     *
     * @param {Event} [event]
     *        The `keydown`, `tap`, or `click` event that caused this function to be
     *        called.
     *
     * @listens tap
     * @listens click
     */
    handleClick(event) {
      if (this.player_.paused()) {
        silencePromise(this.player_.play());
      } else {
        this.player_.pause();
      }
    }

    /**
     * This gets called once after the video has ended and the user seeks so that
     * we can change the replay button back to a play button.
     *
     * @param {Event} [event]
     *        The event that caused this function to run.
     *
     * @listens Player#seeked
     */
    handleSeeked(event) {
      this.removeClass('vjs-ended');
      if (this.player_.paused()) {
        this.handlePause(event);
      } else {
        this.handlePlay(event);
      }
    }

    /**
     * Add the vjs-playing class to the element so it can change appearance.
     *
     * @param {Event} [event]
     *        The event that caused this function to run.
     *
     * @listens Player#play
     */
    handlePlay(event) {
      this.removeClass('vjs-ended', 'vjs-paused');
      this.addClass('vjs-playing');
      // change the button text to "Pause"
      this.setIcon('pause');
      this.controlText('Pause');
    }

    /**
     * Add the vjs-paused class to the element so it can change appearance.
     *
     * @param {Event} [event]
     *        The event that caused this function to run.
     *
     * @listens Player#pause
     */
    handlePause(event) {
      this.removeClass('vjs-playing');
      this.addClass('vjs-paused');
      // change the button text to "Play"
      this.setIcon('play');
      this.controlText('Play');
    }

    /**
     * Add the vjs-ended class to the element so it can change appearance
     *
     * @param {Event} [event]
     *        The event that caused this function to run.
     *
     * @listens Player#ended
     */
    handleEnded(event) {
      this.removeClass('vjs-playing');
      this.addClass('vjs-ended');
      // change the button text to "Replay"
      this.setIcon('replay');
      this.controlText('Replay');

      // on the next seek remove the replay button
      this.one(this.player_, 'seeked', e => this.handleSeeked(e));
    }
  }

  /**
   * The text that should display over the `PlayToggle`s controls. Added for localization.
   *
   * @type {string}
   * @protected
   */
  PlayToggle.prototype.controlText_ = 'Play';
  Component.registerComponent('PlayToggle', PlayToggle);

  /**
   * @file time-display.js
   */

  /**
   * Displays time information about the video
   *
   * @extends Component
   */
  class TimeDisplay extends Component {
    /**
     * Creates an instance of this class.
     *
     * @param { import('../../player').default } player
     *        The `Player` that this class should be attached to.
     *
     * @param {Object} [options]
     *        The key/value store of player options.
     */
    constructor(player, options) {
      super(player, options);
      this.on(player, ['timeupdate', 'ended'], e => this.updateContent(e));
      this.updateTextNode_();
    }

    /**
     * Create the `Component`'s DOM element
     *
     * @return {Element}
     *         The element that was created.
     */
    createEl() {
      const className = this.buildCSSClass();
      const el = super.createEl('div', {
        className: `${className} vjs-time-control vjs-control`
      });
      const span = createEl('span', {
        className: 'vjs-control-text',
        textContent: `${this.localize(this.labelText_)}\u00a0`
      }, {
        role: 'presentation'
      });
      el.appendChild(span);
      this.contentEl_ = createEl('span', {
        className: `${className}-display`
      }, {
        // span elements have no implicit role, but some screen readers (notably VoiceOver)
        // treat them as a break between items in the DOM when using arrow keys
        // (or left-to-right swipes on iOS) to read contents of a page. Using
        // role='presentation' causes VoiceOver to NOT treat this span as a break.
        role: 'presentation'
      });
      el.appendChild(this.contentEl_);
      return el;
    }
    dispose() {
      this.contentEl_ = null;
      this.textNode_ = null;
      super.dispose();
    }

    /**
     * Updates the time display text node with a new time
     *
     * @param {number} [time=0] the time to update to
     *
     * @private
     */
    updateTextNode_(time = 0) {
      time = formatTime(time);
      if (this.formattedTime_ === time) {
        return;
      }
      this.formattedTime_ = time;
      this.requestNamedAnimationFrame('TimeDisplay#updateTextNode_', () => {
        if (!this.contentEl_) {
          return;
        }
        let oldNode = this.textNode_;
        if (oldNode && this.contentEl_.firstChild !== oldNode) {
          oldNode = null;
          log.warn('TimeDisplay#updateTextnode_: Prevented replacement of text node element since it was no longer a child of this node. Appending a new node instead.');
        }
        this.textNode_ = document.createTextNode(this.formattedTime_);
        if (!this.textNode_) {
          return;
        }
        if (oldNode) {
          this.contentEl_.replaceChild(this.textNode_, oldNode);
        } else {
          this.contentEl_.appendChild(this.textNode_);
        }
      });
    }

    /**
     * To be filled out in the child class, should update the displayed time
     * in accordance with the fact that the current time has changed.
     *
     * @param {Event} [event]
     *        The `timeupdate`  event that caused this to run.
     *
     * @listens Player#timeupdate
     */
    updateContent(event) {}
  }

  /**
   * The text that is added to the `TimeDisplay` for screen reader users.
   *
   * @type {string}
   * @private
   */
  TimeDisplay.prototype.labelText_ = 'Time';

  /**
   * The text that should display over the `TimeDisplay`s controls. Added to for localization.
   *
   * @type {string}
   * @protected
   *
   * @deprecated in v7; controlText_ is not used in non-active display Components
   */
  TimeDisplay.prototype.controlText_ = 'Time';
  Component.registerComponent('TimeDisplay', TimeDisplay);

  /**
   * @file current-time-display.js
   */

  /**
   * Displays the current time
   *
   * @extends Component
   */
  class CurrentTimeDisplay extends TimeDisplay {
    /**
     * Builds the default DOM `className`.
     *
     * @return {string}
     *         The DOM `className` for this object.
     */
    buildCSSClass() {
      return 'vjs-current-time';
    }

    /**
     * Update current time display
     *
     * @param {Event} [event]
     *        The `timeupdate` event that caused this function to run.
     *
     * @listens Player#timeupdate
     */
    updateContent(event) {
      // Allows for smooth scrubbing, when player can't keep up.
      let time;
      if (this.player_.ended()) {
        time = this.player_.duration();
      } else {
        time = this.player_.scrubbing() ? this.player_.getCache().currentTime : this.player_.currentTime();
      }
      this.updateTextNode_(time);
    }
  }

  /**
   * The text that is added to the `CurrentTimeDisplay` for screen reader users.
   *
   * @type {string}
   * @private
   */
  CurrentTimeDisplay.prototype.labelText_ = 'Current Time';

  /**
   * The text that should display over the `CurrentTimeDisplay`s controls. Added to for localization.
   *
   * @type {string}
   * @protected
   *
   * @deprecated in v7; controlText_ is not used in non-active display Components
   */
  CurrentTimeDisplay.prototype.controlText_ = 'Current Time';
  Component.registerComponent('CurrentTimeDisplay', CurrentTimeDisplay);

  /**
   * @file duration-display.js
   */

  /**
   * Displays the duration
   *
   * @extends Component
   */
  class DurationDisplay extends TimeDisplay {
    /**
     * Creates an instance of this class.
     *
     * @param { import('../../player').default } player
     *        The `Player` that this class should be attached to.
     *
     * @param {Object} [options]
     *        The key/value store of player options.
     */
    constructor(player, options) {
      super(player, options);
      const updateContent = e => this.updateContent(e);

      // we do not want to/need to throttle duration changes,
      // as they should always display the changed duration as
      // it has changed
      this.on(player, 'durationchange', updateContent);

      // Listen to loadstart because the player duration is reset when a new media element is loaded,
      // but the durationchange on the user agent will not fire.
      // @see [Spec]{@link https://www.w3.org/TR/2011/WD-html5-20110113/video.html#media-element-load-algorithm}
      this.on(player, 'loadstart', updateContent);

      // Also listen for timeupdate (in the parent) and loadedmetadata because removing those
      // listeners could have broken dependent applications/libraries. These
      // can likely be removed for 7.0.
      this.on(player, 'loadedmetadata', updateContent);
    }

    /**
     * Builds the default DOM `className`.
     *
     * @return {string}
     *         The DOM `className` for this object.
     */
    buildCSSClass() {
      return 'vjs-duration';
    }

    /**
     * Update duration time display.
     *
     * @param {Event} [event]
     *        The `durationchange`, `timeupdate`, or `loadedmetadata` event that caused
     *        this function to be called.
     *
     * @listens Player#durationchange
     * @listens Player#timeupdate
     * @listens Player#loadedmetadata
     */
    updateContent(event) {
      const duration = this.player_.duration();
      this.updateTextNode_(duration);
    }
  }

  /**
   * The text that is added to the `DurationDisplay` for screen reader users.
   *
   * @type {string}
   * @private
   */
  DurationDisplay.prototype.labelText_ = 'Duration';

  /**
   * The text that should display over the `DurationDisplay`s controls. Added to for localization.
   *
   * @type {string}
   * @protected
   *
   * @deprecated in v7; controlText_ is not used in non-active display Components
   */
  DurationDisplay.prototype.controlText_ = 'Duration';
  Component.registerComponent('DurationDisplay', DurationDisplay);

  /**
   * @file time-divider.js
   */

  /**
   * The separator between the current time and duration.
   * Can be hidden if it's not needed in the design.
   *
   * @extends Component
   */
  class TimeDivider extends Component {
    /**
     * Create the component's DOM element
     *
     * @return {Element}
     *         The element that was created.
     */
    createEl() {
      const el = super.createEl('div', {
        className: 'vjs-time-control vjs-time-divider'
      }, {
        // this element and its contents can be hidden from assistive techs since
        // it is made extraneous by the announcement of the control text
        // for the current time and duration displays
        'aria-hidden': true
      });
      const div = super.createEl('div');
      const span = super.createEl('span', {
        textContent: '/'
      });
      div.appendChild(span);
      el.appendChild(div);
      return el;
    }
  }
  Component.registerComponent('TimeDivider', TimeDivider);

  /**
   * @file remaining-time-display.js
   */

  /**
   * Displays the time left in the video
   *
   * @extends Component
   */
  class RemainingTimeDisplay extends TimeDisplay {
    /**
     * Creates an instance of this class.
     *
     * @param { import('../../player').default } player
     *        The `Player` that this class should be attached to.
     *
     * @param {Object} [options]
     *        The key/value store of player options.
     */
    constructor(player, options) {
      super(player, options);
      this.on(player, 'durationchange', e => this.updateContent(e));
    }

    /**
     * Builds the default DOM `className`.
     *
     * @return {string}
     *         The DOM `className` for this object.
     */
    buildCSSClass() {
      return 'vjs-remaining-time';
    }

    /**
     * Create the `Component`'s DOM element with the "minus" character prepend to the time
     *
     * @return {Element}
     *         The element that was created.
     */
    createEl() {
      const el = super.createEl();
      if (this.options_.displayNegative !== false) {
        el.insertBefore(createEl('span', {}, {
          'aria-hidden': true
        }, '-'), this.contentEl_);
      }
      return el;
    }

    /**
     * Update remaining time display.
     *
     * @param {Event} [event]
     *        The `timeupdate` or `durationchange` event that caused this to run.
     *
     * @listens Player#timeupdate
     * @listens Player#durationchange
     */
    updateContent(event) {
      if (typeof this.player_.duration() !== 'number') {
        return;
      }
      let time;

      // @deprecated We should only use remainingTimeDisplay
      // as of video.js 7
      if (this.player_.ended()) {
        time = 0;
      } else if (this.player_.remainingTimeDisplay) {
        time = this.player_.remainingTimeDisplay();
      } else {
        time = this.player_.remainingTime();
      }
      this.updateTextNode_(time);
    }
  }

  /**
   * The text that is added to the `RemainingTimeDisplay` for screen reader users.
   *
   * @type {string}
   * @private
   */
  RemainingTimeDisplay.prototype.labelText_ = 'Remaining Time';

  /**
   * The text that should display over the `RemainingTimeDisplay`s controls. Added to for localization.
   *
   * @type {string}
   * @protected
   *
   * @deprecated in v7; controlText_ is not used in non-active display Components
   */
  RemainingTimeDisplay.prototype.controlText_ = 'Remaining Time';
  Component.registerComponent('RemainingTimeDisplay', RemainingTimeDisplay);

  /**
   * @file live-display.js
   */

  // TODO - Future make it click to snap to live

  /**
   * Displays the live indicator when duration is Infinity.
   *
   * @extends Component
   */
  class LiveDisplay extends Component {
    /**
     * Creates an instance of this class.
     *
     * @param { import('./player').default } player
     *        The `Player` that this class should be attached to.
     *
     * @param {Object} [options]
     *        The key/value store of player options.
     */
    constructor(player, options) {
      super(player, options);
      this.updateShowing();
      this.on(this.player(), 'durationchange', e => this.updateShowing(e));
    }

    /**
     * Create the `Component`'s DOM element
     *
     * @return {Element}
     *         The element that was created.
     */
    createEl() {
      const el = super.createEl('div', {
        className: 'vjs-live-control vjs-control'
      });
      this.contentEl_ = createEl('div', {
        className: 'vjs-live-display'
      }, {
        'aria-live': 'off'
      });
      this.contentEl_.appendChild(createEl('span', {
        className: 'vjs-control-text',
        textContent: `${this.localize('Stream Type')}\u00a0`
      }));
      this.contentEl_.appendChild(document.createTextNode(this.localize('LIVE')));
      el.appendChild(this.contentEl_);
      return el;
    }
    dispose() {
      this.contentEl_ = null;
      super.dispose();
    }

    /**
     * Check the duration to see if the LiveDisplay should be showing or not. Then show/hide
     * it accordingly
     *
     * @param {Event} [event]
     *        The {@link Player#durationchange} event that caused this function to run.
     *
     * @listens Player#durationchange
     */
    updateShowing(event) {
      if (this.player().duration() === Infinity) {
        this.show();
      } else {
        this.hide();
      }
    }
  }
  Component.registerComponent('LiveDisplay', LiveDisplay);

  /**
   * @file seek-to-live.js
   */

  /**
   * Displays the live indicator when duration is Infinity.
   *
   * @extends Component
   */
  class SeekToLive extends Button {
    /**
     * Creates an instance of this class.
     *
     * @param { import('./player').default } player
     *        The `Player` that this class should be attached to.
     *
     * @param {Object} [options]
     *        The key/value store of player options.
     */
    constructor(player, options) {
      super(player, options);
      this.updateLiveEdgeStatus();
      if (this.player_.liveTracker) {
        this.updateLiveEdgeStatusHandler_ = e => this.updateLiveEdgeStatus(e);
        this.on(this.player_.liveTracker, 'liveedgechange', this.updateLiveEdgeStatusHandler_);
      }
    }

    /**
     * Create the `Component`'s DOM element
     *
     * @return {Element}
     *         The element that was created.
     */
    createEl() {
      const el = super.createEl('button', {
        className: 'vjs-seek-to-live-control vjs-control'
      });
      this.setIcon('circle', el);
      this.textEl_ = createEl('span', {
        className: 'vjs-seek-to-live-text',
        textContent: this.localize('LIVE')
      }, {
        'aria-hidden': 'true'
      });
      el.appendChild(this.textEl_);
      return el;
    }

    /**
     * Update the state of this button if we are at the live edge
     * or not
     */
    updateLiveEdgeStatus() {
      // default to live edge
      if (!this.player_.liveTracker || this.player_.liveTracker.atLiveEdge()) {
        this.setAttribute('aria-disabled', true);
        this.addClass('vjs-at-live-edge');
        this.controlText('Seek to live, currently playing live');
      } else {
        this.setAttribute('aria-disabled', false);
        this.removeClass('vjs-at-live-edge');
        this.controlText('Seek to live, currently behind live');
      }
    }

    /**
     * On click bring us as near to the live point as possible.
     * This requires that we wait for the next `live-seekable-change`
     * event which will happen every segment length seconds.
     */
    handleClick() {
      this.player_.liveTracker.seekToLiveEdge();
    }

    /**
     * Dispose of the element and stop tracking
     */
    dispose() {
      if (this.player_.liveTracker) {
        this.off(this.player_.liveTracker, 'liveedgechange', this.updateLiveEdgeStatusHandler_);
      }
      this.textEl_ = null;
      super.dispose();
    }
  }
  /**
   * The text that should display over the `SeekToLive`s control. Added for localization.
   *
   * @type {string}
   * @protected
   */
  SeekToLive.prototype.controlText_ = 'Seek to live, currently playing live';
  Component.registerComponent('SeekToLive', SeekToLive);

  /**
   * @file num.js
   * @module num
   */

  /**
   * Keep a number between a min and a max value
   *
   * @param {number} number
   *        The number to clamp
   *
   * @param {number} min
   *        The minimum value
   * @param {number} max
   *        The maximum value
   *
   * @return {number}
   *         the clamped number
   */
  function clamp(number, min, max) {
    number = Number(number);
    return Math.min(max, Math.max(min, isNaN(number) ? min : number));
  }

  var Num = /*#__PURE__*/Object.freeze({
    __proto__: null,
    clamp: clamp
  });

  /**
   * @file slider.js
   */

  /**
   * The base functionality for a slider. Can be vertical or horizontal.
   * For instance the volume bar or the seek bar on a video is a slider.
   *
   * @extends Component
   */
  class Slider extends Component {
    /**
    * Create an instance of this class
    *
    * @param { import('../player').default } player
    *        The `Player` that this class should be attached to.
    *
    * @param {Object} [options]
    *        The key/value store of player options.
    */
    constructor(player, options) {
      super(player, options);
      this.handleMouseDown_ = e => this.handleMouseDown(e);
      this.handleMouseUp_ = e => this.handleMouseUp(e);
      this.handleKeyDown_ = e => this.handleKeyDown(e);
      this.handleClick_ = e => this.handleClick(e);
      this.handleMouseMove_ = e => this.handleMouseMove(e);
      this.update_ = e => this.update(e);

      // Set property names to bar to match with the child Slider class is looking for
      this.bar = this.getChild(this.options_.barName);

      // Set a horizontal or vertical class on the slider depending on the slider type
      this.vertical(!!this.options_.vertical);
      this.enable();
    }

    /**
     * Are controls are currently enabled for this slider or not.
     *
     * @return {boolean}
     *         true if controls are enabled, false otherwise
     */
    enabled() {
      return this.enabled_;
    }

    /**
     * Enable controls for this slider if they are disabled
     */
    enable() {
      if (this.enabled()) {
        return;
      }
      this.on('mousedown', this.handleMouseDown_);
      this.on('touchstart', this.handleMouseDown_);
      this.on('keydown', this.handleKeyDown_);
      this.on('click', this.handleClick_);

      // TODO: deprecated, controlsvisible does not seem to be fired
      this.on(this.player_, 'controlsvisible', this.update);
      if (this.playerEvent) {
        this.on(this.player_, this.playerEvent, this.update);
      }
      this.removeClass('disabled');
      this.setAttribute('tabindex', 0);
      this.enabled_ = true;
    }

    /**
     * Disable controls for this slider if they are enabled
     */
    disable() {
      if (!this.enabled()) {
        return;
      }
      const doc = this.bar.el_.ownerDocument;
      this.off('mousedown', this.handleMouseDown_);
      this.off('touchstart', this.handleMouseDown_);
      this.off('keydown', this.handleKeyDown_);
      this.off('click', this.handleClick_);
      this.off(this.player_, 'controlsvisible', this.update_);
      this.off(doc, 'mousemove', this.handleMouseMove_);
      this.off(doc, 'mouseup', this.handleMouseUp_);
      this.off(doc, 'touchmove', this.handleMouseMove_);
      this.off(doc, 'touchend', this.handleMouseUp_);
      this.removeAttribute('tabindex');
      this.addClass('disabled');
      if (this.playerEvent) {
        this.off(this.player_, this.playerEvent, this.update);
      }
      this.enabled_ = false;
    }

    /**
     * Create the `Slider`s DOM element.
     *
     * @param {string} type
     *        Type of element to create.
     *
     * @param {Object} [props={}]
     *        List of properties in Object form.
     *
     * @param {Object} [attributes={}]
     *        list of attributes in Object form.
     *
     * @return {Element}
     *         The element that gets created.
     */
    createEl(type, props = {}, attributes = {}) {
      // Add the slider element class to all sub classes
      props.className = props.className + ' vjs-slider';
      props = Object.assign({
        tabIndex: 0
      }, props);
      attributes = Object.assign({
        'role': 'slider',
        'aria-valuenow': 0,
        'aria-valuemin': 0,
        'aria-valuemax': 100
      }, attributes);
      return super.createEl(type, props, attributes);
    }

    /**
     * Handle `mousedown` or `touchstart` events on the `Slider`.
     *
     * @param {MouseEvent} event
     *        `mousedown` or `touchstart` event that triggered this function
     *
     * @listens mousedown
     * @listens touchstart
     * @fires Slider#slideractive
     */
    handleMouseDown(event) {
      const doc = this.bar.el_.ownerDocument;
      if (event.type === 'mousedown') {
        event.preventDefault();
      }
      // Do not call preventDefault() on touchstart in Chrome
      // to avoid console warnings. Use a 'touch-action: none' style
      // instead to prevent unintended scrolling.
      // https://developers.google.com/web/updates/2017/01/scrolling-intervention
      if (event.type === 'touchstart' && !IS_CHROME) {
        event.preventDefault();
      }
      blockTextSelection();
      this.addClass('vjs-sliding');
      /**
       * Triggered when the slider is in an active state
       *
       * @event Slider#slideractive
       * @type {MouseEvent}
       */
      this.trigger('slideractive');
      this.on(doc, 'mousemove', this.handleMouseMove_);
      this.on(doc, 'mouseup', this.handleMouseUp_);
      this.on(doc, 'touchmove', this.handleMouseMove_);
      this.on(doc, 'touchend', this.handleMouseUp_);
      this.handleMouseMove(event, true);
    }

    /**
     * Handle the `mousemove`, `touchmove`, and `mousedown` events on this `Slider`.
     * The `mousemove` and `touchmove` events will only only trigger this function during
     * `mousedown` and `touchstart`. This is due to {@link Slider#handleMouseDown} and
     * {@link Slider#handleMouseUp}.
     *
     * @param {MouseEvent} event
     *        `mousedown`, `mousemove`, `touchstart`, or `touchmove` event that triggered
     *        this function
     * @param {boolean} mouseDown this is a flag that should be set to true if `handleMouseMove` is called directly. It allows us to skip things that should not happen if coming from mouse down but should happen on regular mouse move handler. Defaults to false.
     *
     * @listens mousemove
     * @listens touchmove
     */
    handleMouseMove(event) {}

    /**
     * Handle `mouseup` or `touchend` events on the `Slider`.
     *
     * @param {MouseEvent} event
     *        `mouseup` or `touchend` event that triggered this function.
     *
     * @listens touchend
     * @listens mouseup
     * @fires Slider#sliderinactive
     */
    handleMouseUp(event) {
      const doc = this.bar.el_.ownerDocument;
      unblockTextSelection();
      this.removeClass('vjs-sliding');
      /**
       * Triggered when the slider is no longer in an active state.
       *
       * @event Slider#sliderinactive
       * @type {Event}
       */
      this.trigger('sliderinactive');
      this.off(doc, 'mousemove', this.handleMouseMove_);
      this.off(doc, 'mouseup', this.handleMouseUp_);
      this.off(doc, 'touchmove', this.handleMouseMove_);
      this.off(doc, 'touchend', this.handleMouseUp_);
      this.update();
    }

    /**
     * Update the progress bar of the `Slider`.
     *
     * @return {number}
     *          The percentage of progress the progress bar represents as a
     *          number from 0 to 1.
     */
    update() {
      // In VolumeBar init we have a setTimeout for update that pops and update
      // to the end of the execution stack. The player is destroyed before then
      // update will cause an error
      // If there's no bar...
      if (!this.el_ || !this.bar) {
        return;
      }

      // clamp progress between 0 and 1
      // and only round to four decimal places, as we round to two below
      const progress = this.getProgress();
      if (progress === this.progress_) {
        return progress;
      }
      this.progress_ = progress;
      this.requestNamedAnimationFrame('Slider#update', () => {
        // Set the new bar width or height
        const sizeKey = this.vertical() ? 'height' : 'width';

        // Convert to a percentage for css value
        this.bar.el().style[sizeKey] = (progress * 100).toFixed(2) + '%';
      });
      return progress;
    }

    /**
     * Get the percentage of the bar that should be filled
     * but clamped and rounded.
     *
     * @return {number}
     *         percentage filled that the slider is
     */
    getProgress() {
      return Number(clamp(this.getPercent(), 0, 1).toFixed(4));
    }

    /**
     * Calculate distance for slider
     *
     * @param {Event} event
     *        The event that caused this function to run.
     *
     * @return {number}
     *         The current position of the Slider.
     *         - position.x for vertical `Slider`s
     *         - position.y for horizontal `Slider`s
     */
    calculateDistance(event) {
      const position = getPointerPosition(this.el_, event);
      if (this.vertical()) {
        return position.y;
      }
      return position.x;
    }

    /**
     * Handle a `keydown` event on the `Slider`. Watches for left, right, up, and down
     * arrow keys. This function will only be called when the slider has focus. See
     * {@link Slider#handleFocus} and {@link Slider#handleBlur}.
     *
     * @param {KeyboardEvent} event
     *        the `keydown` event that caused this function to run.
     *
     * @listens keydown
     */
    handleKeyDown(event) {
      // Left and Down Arrows
      if (keycode.isEventKey(event, 'Left') || keycode.isEventKey(event, 'Down')) {
        event.preventDefault();
        event.stopPropagation();
        this.stepBack();

        // Up and Right Arrows
      } else if (keycode.isEventKey(event, 'Right') || keycode.isEventKey(event, 'Up')) {
        event.preventDefault();
        event.stopPropagation();
        this.stepForward();
      } else {
        // Pass keydown handling up for unsupported keys
        super.handleKeyDown(event);
      }
    }

    /**
     * Listener for click events on slider, used to prevent clicks
     *   from bubbling up to parent elements like button menus.
     *
     * @param {Object} event
     *        Event that caused this object to run
     */
    handleClick(event) {
      event.stopPropagation();
      event.preventDefault();
    }

    /**
     * Get/set if slider is horizontal for vertical
     *
     * @param {boolean} [bool]
     *        - true if slider is vertical,
     *        - false is horizontal
     *
     * @return {boolean}
     *         - true if slider is vertical, and getting
     *         - false if the slider is horizontal, and getting
     */
    vertical(bool) {
      if (bool === undefined) {
        return this.vertical_ || false;
      }
      this.vertical_ = !!bool;
      if (this.vertical_) {
        this.addClass('vjs-slider-vertical');
      } else {
        this.addClass('vjs-slider-horizontal');
      }
    }
  }
  Component.registerComponent('Slider', Slider);

  /**
   * @file load-progress-bar.js
   */

  // get the percent width of a time compared to the total end
  const percentify = (time, end) => clamp(time / end * 100, 0, 100).toFixed(2) + '%';

  /**
   * Shows loading progress
   *
   * @extends Component
   */
  class LoadProgressBar extends Component {
    /**
     * Creates an instance of this class.
     *
     * @param { import('../../player').default } player
     *        The `Player` that this class should be attached to.
     *
     * @param {Object} [options]
     *        The key/value store of player options.
     */
    constructor(player, options) {
      super(player, options);
      this.partEls_ = [];
      this.on(player, 'progress', e => this.update(e));
    }

    /**
     * Create the `Component`'s DOM element
     *
     * @return {Element}
     *         The element that was created.
     */
    createEl() {
      const el = super.createEl('div', {
        className: 'vjs-load-progress'
      });
      const wrapper = createEl('span', {
        className: 'vjs-control-text'
      });
      const loadedText = createEl('span', {
        textContent: this.localize('Loaded')
      });
      const separator = document.createTextNode(': ');
      this.percentageEl_ = createEl('span', {
        className: 'vjs-control-text-loaded-percentage',
        textContent: '0%'
      });
      el.appendChild(wrapper);
      wrapper.appendChild(loadedText);
      wrapper.appendChild(separator);
      wrapper.appendChild(this.percentageEl_);
      return el;
    }
    dispose() {
      this.partEls_ = null;
      this.percentageEl_ = null;
      super.dispose();
    }

    /**
     * Update progress bar
     *
     * @param {Event} [event]
     *        The `progress` event that caused this function to run.
     *
     * @listens Player#progress
     */
    update(event) {
      this.requestNamedAnimationFrame('LoadProgressBar#update', () => {
        const liveTracker = this.player_.liveTracker;
        const buffered = this.player_.buffered();
        const duration = liveTracker && liveTracker.isLive() ? liveTracker.seekableEnd() : this.player_.duration();
        const bufferedEnd = this.player_.bufferedEnd();
        const children = this.partEls_;
        const percent = percentify(bufferedEnd, duration);
        if (this.percent_ !== percent) {
          // update the width of the progress bar
          this.el_.style.width = percent;
          // update the control-text
          textContent(this.percentageEl_, percent);
          this.percent_ = percent;
        }

        // add child elements to represent the individual buffered time ranges
        for (let i = 0; i < buffered.length; i++) {
          const start = buffered.start(i);
          const end = buffered.end(i);
          let part = children[i];
          if (!part) {
            part = this.el_.appendChild(createEl());
            children[i] = part;
          }

          //  only update if changed
          if (part.dataset.start === start && part.dataset.end === end) {
            continue;
          }
          part.dataset.start = start;
          part.dataset.end = end;

          // set the percent based on the width of the progress bar (bufferedEnd)
          part.style.left = percentify(start, bufferedEnd);
          part.style.width = percentify(end - start, bufferedEnd);
        }

        // remove unused buffered range elements
        for (let i = children.length; i > buffered.length; i--) {
          this.el_.removeChild(children[i - 1]);
        }
        children.length = buffered.length;
      });
    }
  }
  Component.registerComponent('LoadProgressBar', LoadProgressBar);

  /**
   * @file time-tooltip.js
   */

  /**
   * Time tooltips display a time above the progress bar.
   *
   * @extends Component
   */
  class TimeTooltip extends Component {
    /**
     * Creates an instance of this class.
     *
     * @param { import('../../player').default } player
     *        The {@link Player} that this class should be attached to.
     *
     * @param {Object} [options]
     *        The key/value store of player options.
     */
    constructor(player, options) {
      super(player, options);
      this.update = throttle(bind_(this, this.update), UPDATE_REFRESH_INTERVAL);
    }

    /**
     * Create the time tooltip DOM element
     *
     * @return {Element}
     *         The element that was created.
     */
    createEl() {
      return super.createEl('div', {
        className: 'vjs-time-tooltip'
      }, {
        'aria-hidden': 'true'
      });
    }

    /**
     * Updates the position of the time tooltip relative to the `SeekBar`.
     *
     * @param {Object} seekBarRect
     *        The `ClientRect` for the {@link SeekBar} element.
     *
     * @param {number} seekBarPoint
     *        A number from 0 to 1, representing a horizontal reference point
     *        from the left edge of the {@link SeekBar}
     */
    update(seekBarRect, seekBarPoint, content) {
      const tooltipRect = findPosition(this.el_);
      const playerRect = getBoundingClientRect(this.player_.el());
      const seekBarPointPx = seekBarRect.width * seekBarPoint;

      // do nothing if either rect isn't available
      // for example, if the player isn't in the DOM for testing
      if (!playerRect || !tooltipRect) {
        return;
      }

      // This is the space left of the `seekBarPoint` available within the bounds
      // of the player. We calculate any gap between the left edge of the player
      // and the left edge of the `SeekBar` and add the number of pixels in the
      // `SeekBar` before hitting the `seekBarPoint`
      const spaceLeftOfPoint = seekBarRect.left - playerRect.left + seekBarPointPx;

      // This is the space right of the `seekBarPoint` available within the bounds
      // of the player. We calculate the number of pixels from the `seekBarPoint`
      // to the right edge of the `SeekBar` and add to that any gap between the
      // right edge of the `SeekBar` and the player.
      const spaceRightOfPoint = seekBarRect.width - seekBarPointPx + (playerRect.right - seekBarRect.right);

      // This is the number of pixels by which the tooltip will need to be pulled
      // further to the right to center it over the `seekBarPoint`.
      let pullTooltipBy = tooltipRect.width / 2;

      // Adjust the `pullTooltipBy` distance to the left or right depending on
      // the results of the space calculations above.
      if (spaceLeftOfPoint < pullTooltipBy) {
        pullTooltipBy += pullTooltipBy - spaceLeftOfPoint;
      } else if (spaceRightOfPoint < pullTooltipBy) {
        pullTooltipBy = spaceRightOfPoint;
      }

      // Due to the imprecision of decimal/ratio based calculations and varying
      // rounding behaviors, there are cases where the spacing adjustment is off
      // by a pixel or two. This adds insurance to these calculations.
      if (pullTooltipBy < 0) {
        pullTooltipBy = 0;
      } else if (pullTooltipBy > tooltipRect.width) {
        pullTooltipBy = tooltipRect.width;
      }

      // prevent small width fluctuations within 0.4px from
      // changing the value below.
      // This really helps for live to prevent the play
      // progress time tooltip from jittering
      pullTooltipBy = Math.round(pullTooltipBy);
      this.el_.style.right = `-${pullTooltipBy}px`;
      this.write(content);
    }

    /**
     * Write the time to the tooltip DOM element.
     *
     * @param {string} content
     *        The formatted time for the tooltip.
     */
    write(content) {
      textContent(this.el_, content);
    }

    /**
     * Updates the position of the time tooltip relative to the `SeekBar`.
     *
     * @param {Object} seekBarRect
     *        The `ClientRect` for the {@link SeekBar} element.
     *
     * @param {number} seekBarPoint
     *        A number from 0 to 1, representing a horizontal reference point
     *        from the left edge of the {@link SeekBar}
     *
     * @param {number} time
     *        The time to update the tooltip to, not used during live playback
     *
     * @param {Function} cb
     *        A function that will be called during the request animation frame
     *        for tooltips that need to do additional animations from the default
     */
    updateTime(seekBarRect, seekBarPoint, time, cb) {
      this.requestNamedAnimationFrame('TimeTooltip#updateTime', () => {
        let content;
        const duration = this.player_.duration();
        if (this.player_.liveTracker && this.player_.liveTracker.isLive()) {
          const liveWindow = this.player_.liveTracker.liveWindow();
          const secondsBehind = liveWindow - seekBarPoint * liveWindow;
          content = (secondsBehind < 1 ? '' : '-') + formatTime(secondsBehind, liveWindow);
        } else {
          content = formatTime(time, duration);
        }
        this.update(seekBarRect, seekBarPoint, content);
        if (cb) {
          cb();
        }
      });
    }
  }
  Component.registerComponent('TimeTooltip', TimeTooltip);

  /**
   * @file play-progress-bar.js
   */

  /**
   * Used by {@link SeekBar} to display media playback progress as part of the
   * {@link ProgressControl}.
   *
   * @extends Component
   */
  class PlayProgressBar extends Component {
    /**
     * Creates an instance of this class.
     *
     * @param { import('../../player').default } player
     *        The {@link Player} that this class should be attached to.
     *
     * @param {Object} [options]
     *        The key/value store of player options.
     */
    constructor(player, options) {
      super(player, options);
      this.setIcon('circle');
      this.update = throttle(bind_(this, this.update), UPDATE_REFRESH_INTERVAL);
    }

    /**
     * Create the the DOM element for this class.
     *
     * @return {Element}
     *         The element that was created.
     */
    createEl() {
      return super.createEl('div', {
        className: 'vjs-play-progress vjs-slider-bar'
      }, {
        'aria-hidden': 'true'
      });
    }

    /**
     * Enqueues updates to its own DOM as well as the DOM of its
     * {@link TimeTooltip} child.
     *
     * @param {Object} seekBarRect
     *        The `ClientRect` for the {@link SeekBar} element.
     *
     * @param {number} seekBarPoint
     *        A number from 0 to 1, representing a horizontal reference point
     *        from the left edge of the {@link SeekBar}
     */
    update(seekBarRect, seekBarPoint) {
      const timeTooltip = this.getChild('timeTooltip');
      if (!timeTooltip) {
        return;
      }
      const time = this.player_.scrubbing() ? this.player_.getCache().currentTime : this.player_.currentTime();
      timeTooltip.updateTime(seekBarRect, seekBarPoint, time);
    }
  }

  /**
   * Default options for {@link PlayProgressBar}.
   *
   * @type {Object}
   * @private
   */
  PlayProgressBar.prototype.options_ = {
    children: []
  };

  // Time tooltips should not be added to a player on mobile devices
  if (!IS_IOS && !IS_ANDROID) {
    PlayProgressBar.prototype.options_.children.push('timeTooltip');
  }
  Component.registerComponent('PlayProgressBar', PlayProgressBar);

  /**
   * @file mouse-time-display.js
   */

  /**
   * The {@link MouseTimeDisplay} component tracks mouse movement over the
   * {@link ProgressControl}. It displays an indicator and a {@link TimeTooltip}
   * indicating the time which is represented by a given point in the
   * {@link ProgressControl}.
   *
   * @extends Component
   */
  class MouseTimeDisplay extends Component {
    /**
     * Creates an instance of this class.
     *
     * @param { import('../../player').default } player
     *        The {@link Player} that this class should be attached to.
     *
     * @param {Object} [options]
     *        The key/value store of player options.
     */
    constructor(player, options) {
      super(player, options);
      this.update = throttle(bind_(this, this.update), UPDATE_REFRESH_INTERVAL);
    }

    /**
     * Create the DOM element for this class.
     *
     * @return {Element}
     *         The element that was created.
     */
    createEl() {
      return super.createEl('div', {
        className: 'vjs-mouse-display'
      });
    }

    /**
     * Enqueues updates to its own DOM as well as the DOM of its
     * {@link TimeTooltip} child.
     *
     * @param {Object} seekBarRect
     *        The `ClientRect` for the {@link SeekBar} element.
     *
     * @param {number} seekBarPoint
     *        A number from 0 to 1, representing a horizontal reference point
     *        from the left edge of the {@link SeekBar}
     */
    update(seekBarRect, seekBarPoint) {
      const time = seekBarPoint * this.player_.duration();
      this.getChild('timeTooltip').updateTime(seekBarRect, seekBarPoint, time, () => {
        this.el_.style.left = `${seekBarRect.width * seekBarPoint}px`;
      });
    }
  }

  /**
   * Default options for `MouseTimeDisplay`
   *
   * @type {Object}
   * @private
   */
  MouseTimeDisplay.prototype.options_ = {
    children: ['timeTooltip']
  };
  Component.registerComponent('MouseTimeDisplay', MouseTimeDisplay);

  /**
   * @file seek-bar.js
   */

  // The number of seconds the `step*` functions move the timeline.
  const STEP_SECONDS = 5;

  // The multiplier of STEP_SECONDS that PgUp/PgDown move the timeline.
  const PAGE_KEY_MULTIPLIER = 12;

  /**
   * Seek bar and container for the progress bars. Uses {@link PlayProgressBar}
   * as its `bar`.
   *
   * @extends Slider
   */
  class SeekBar extends Slider {
    /**
     * Creates an instance of this class.
     *
     * @param { import('../../player').default } player
     *        The `Player` that this class should be attached to.
     *
     * @param {Object} [options]
     *        The key/value store of player options.
     */
    constructor(player, options) {
      super(player, options);
      this.setEventHandlers_();
    }

    /**
     * Sets the event handlers
     *
     * @private
     */
    setEventHandlers_() {
      this.update_ = bind_(this, this.update);
      this.update = throttle(this.update_, UPDATE_REFRESH_INTERVAL);
      this.on(this.player_, ['ended', 'durationchange', 'timeupdate'], this.update);
      if (this.player_.liveTracker) {
        this.on(this.player_.liveTracker, 'liveedgechange', this.update);
      }

      // when playing, let's ensure we smoothly update the play progress bar
      // via an interval
      this.updateInterval = null;
      this.enableIntervalHandler_ = e => this.enableInterval_(e);
      this.disableIntervalHandler_ = e => this.disableInterval_(e);
      this.on(this.player_, ['playing'], this.enableIntervalHandler_);
      this.on(this.player_, ['ended', 'pause', 'waiting'], this.disableIntervalHandler_);

      // we don't need to update the play progress if the document is hidden,
      // also, this causes the CPU to spike and eventually crash the page on IE11.
      if ('hidden' in document && 'visibilityState' in document) {
        this.on(document, 'visibilitychange', this.toggleVisibility_);
      }
    }
    toggleVisibility_(e) {
      if (document.visibilityState === 'hidden') {
        this.cancelNamedAnimationFrame('SeekBar#update');
        this.cancelNamedAnimationFrame('Slider#update');
        this.disableInterval_(e);
      } else {
        if (!this.player_.ended() && !this.player_.paused()) {
          this.enableInterval_();
        }

        // we just switched back to the page and someone may be looking, so, update ASAP
        this.update();
      }
    }
    enableInterval_() {
      if (this.updateInterval) {
        return;
      }
      this.updateInterval = this.setInterval(this.update, UPDATE_REFRESH_INTERVAL);
    }
    disableInterval_(e) {
      if (this.player_.liveTracker && this.player_.liveTracker.isLive() && e && e.type !== 'ended') {
        return;
      }
      if (!this.updateInterval) {
        return;
      }
      this.clearInterval(this.updateInterval);
      this.updateInterval = null;
    }

    /**
     * Create the `Component`'s DOM element
     *
     * @return {Element}
     *         The element that was created.
     */
    createEl() {
      return super.createEl('div', {
        className: 'vjs-progress-holder'
      }, {
        'aria-label': this.localize('Progress Bar')
      });
    }

    /**
     * This function updates the play progress bar and accessibility
     * attributes to whatever is passed in.
     *
     * @param {Event} [event]
     *        The `timeupdate` or `ended` event that caused this to run.
     *
     * @listens Player#timeupdate
     *
     * @return {number}
     *          The current percent at a number from 0-1
     */
    update(event) {
      // ignore updates while the tab is hidden
      if (document.visibilityState === 'hidden') {
        return;
      }
      const percent = super.update();
      this.requestNamedAnimationFrame('SeekBar#update', () => {
        const currentTime = this.player_.ended() ? this.player_.duration() : this.getCurrentTime_();
        const liveTracker = this.player_.liveTracker;
        let duration = this.player_.duration();
        if (liveTracker && liveTracker.isLive()) {
          duration = this.player_.liveTracker.liveCurrentTime();
        }
        if (this.percent_ !== percent) {
          // machine readable value of progress bar (percentage complete)
          this.el_.setAttribute('aria-valuenow', (percent * 100).toFixed(2));
          this.percent_ = percent;
        }
        if (this.currentTime_ !== currentTime || this.duration_ !== duration) {
          // human readable value of progress bar (time complete)
          this.el_.setAttribute('aria-valuetext', this.localize('progress bar timing: currentTime={1} duration={2}', [formatTime(currentTime, duration), formatTime(duration, duration)], '{1} of {2}'));
          this.currentTime_ = currentTime;
          this.duration_ = duration;
        }

        // update the progress bar time tooltip with the current time
        if (this.bar) {
          this.bar.update(getBoundingClientRect(this.el()), this.getProgress());
        }
      });
      return percent;
    }

    /**
     * Prevent liveThreshold from causing seeks to seem like they
     * are not happening from a user perspective.
     *
     * @param {number} ct
     *        current time to seek to
     */
    userSeek_(ct) {
      if (this.player_.liveTracker && this.player_.liveTracker.isLive()) {
        this.player_.liveTracker.nextSeekedFromUser();
      }
      this.player_.currentTime(ct);
    }

    /**
     * Get the value of current time but allows for smooth scrubbing,
     * when player can't keep up.
     *
     * @return {number}
     *         The current time value to display
     *
     * @private
     */
    getCurrentTime_() {
      return this.player_.scrubbing() ? this.player_.getCache().currentTime : this.player_.currentTime();
    }

    /**
     * Get the percentage of media played so far.
     *
     * @return {number}
     *         The percentage of media played so far (0 to 1).
     */
    getPercent() {
      const currentTime = this.getCurrentTime_();
      let percent;
      const liveTracker = this.player_.liveTracker;
      if (liveTracker && liveTracker.isLive()) {
        percent = (currentTime - liveTracker.seekableStart()) / liveTracker.liveWindow();

        // prevent the percent from changing at the live edge
        if (liveTracker.atLiveEdge()) {
          percent = 1;
        }
      } else {
        percent = currentTime / this.player_.duration();
      }
      return percent;
    }

    /**
     * Handle mouse down on seek bar
     *
     * @param {MouseEvent} event
     *        The `mousedown` event that caused this to run.
     *
     * @listens mousedown
     */
    handleMouseDown(event) {
      if (!isSingleLeftClick(event)) {
        return;
      }

      // Stop event propagation to prevent double fire in progress-control.js
      event.stopPropagation();
      this.videoWasPlaying = !this.player_.paused();
      this.player_.pause();
      super.handleMouseDown(event);
    }

    /**
     * Handle mouse move on seek bar
     *
     * @param {MouseEvent} event
     *        The `mousemove` event that caused this to run.
     * @param {boolean} mouseDown this is a flag that should be set to true if `handleMouseMove` is called directly. It allows us to skip things that should not happen if coming from mouse down but should happen on regular mouse move handler. Defaults to false
     *
     * @listens mousemove
     */
    handleMouseMove(event, mouseDown = false) {
      if (!isSingleLeftClick(event) || isNaN(this.player_.duration())) {
        return;
      }
      if (!mouseDown && !this.player_.scrubbing()) {
        this.player_.scrubbing(true);
      }
      let newTime;
      const distance = this.calculateDistance(event);
      const liveTracker = this.player_.liveTracker;
      if (!liveTracker || !liveTracker.isLive()) {
        newTime = distance * this.player_.duration();

        // Don't let video end while scrubbing.
        if (newTime === this.player_.duration()) {
          newTime = newTime - 0.1;
        }
      } else {
        if (distance >= 0.99) {
          liveTracker.seekToLiveEdge();
          return;
        }
        const seekableStart = liveTracker.seekableStart();
        const seekableEnd = liveTracker.liveCurrentTime();
        newTime = seekableStart + distance * liveTracker.liveWindow();

        // Don't let video end while scrubbing.
        if (newTime >= seekableEnd) {
          newTime = seekableEnd;
        }

        // Compensate for precision differences so that currentTime is not less
        // than seekable start
        if (newTime <= seekableStart) {
          newTime = seekableStart + 0.1;
        }

        // On android seekableEnd can be Infinity sometimes,
        // this will cause newTime to be Infinity, which is
        // not a valid currentTime.
        if (newTime === Infinity) {
          return;
        }
      }

      // Set new time (tell player to seek to new time)
      this.userSeek_(newTime);
    }
    enable() {
      super.enable();
      const mouseTimeDisplay = this.getChild('mouseTimeDisplay');
      if (!mouseTimeDisplay) {
        return;
      }
      mouseTimeDisplay.show();
    }
    disable() {
      super.disable();
      const mouseTimeDisplay = this.getChild('mouseTimeDisplay');
      if (!mouseTimeDisplay) {
        return;
      }
      mouseTimeDisplay.hide();
    }

    /**
     * Handle mouse up on seek bar
     *
     * @param {MouseEvent} event
     *        The `mouseup` event that caused this to run.
     *
     * @listens mouseup
     */
    handleMouseUp(event) {
      super.handleMouseUp(event);

      // Stop event propagation to prevent double fire in progress-control.js
      if (event) {
        event.stopPropagation();
      }
      this.player_.scrubbing(false);

      /**
       * Trigger timeupdate because we're done seeking and the time has changed.
       * This is particularly useful for if the player is paused to time the time displays.
       *
       * @event Tech#timeupdate
       * @type {Event}
       */
      this.player_.trigger({
        type: 'timeupdate',
        target: this,
        manuallyTriggered: true
      });
      if (this.videoWasPlaying) {
        silencePromise(this.player_.play());
      } else {
        // We're done seeking and the time has changed.
        // If the player is paused, make sure we display the correct time on the seek bar.
        this.update_();
      }
    }

    /**
     * Move more quickly fast forward for keyboard-only users
     */
    stepForward() {
      this.userSeek_(this.player_.currentTime() + STEP_SECONDS);
    }

    /**
     * Move more quickly rewind for keyboard-only users
     */
    stepBack() {
      this.userSeek_(this.player_.currentTime() - STEP_SECONDS);
    }

    /**
     * Toggles the playback state of the player
     * This gets called when enter or space is used on the seekbar
     *
     * @param {KeyboardEvent} event
     *        The `keydown` event that caused this function to be called
     *
     */
    handleAction(event) {
      if (this.player_.paused()) {
        this.player_.play();
      } else {
        this.player_.pause();
      }
    }

    /**
     * Called when this SeekBar has focus and a key gets pressed down.
     * Supports the following keys:
     *
     *   Space or Enter key fire a click event
     *   Home key moves to start of the timeline
     *   End key moves to end of the timeline
     *   Digit "0" through "9" keys move to 0%, 10% ... 80%, 90% of the timeline
     *   PageDown key moves back a larger step than ArrowDown
     *   PageUp key moves forward a large step
     *
     * @param {KeyboardEvent} event
     *        The `keydown` event that caused this function to be called.
     *
     * @listens keydown
     */
    handleKeyDown(event) {
      const liveTracker = this.player_.liveTracker;
      if (keycode.isEventKey(event, 'Space') || keycode.isEventKey(event, 'Enter')) {
        event.preventDefault();
        event.stopPropagation();
        this.handleAction(event);
      } else if (keycode.isEventKey(event, 'Home')) {
        event.preventDefault();
        event.stopPropagation();
        this.userSeek_(0);
      } else if (keycode.isEventKey(event, 'End')) {
        event.preventDefault();
        event.stopPropagation();
        if (liveTracker && liveTracker.isLive()) {
          this.userSeek_(liveTracker.liveCurrentTime());
        } else {
          this.userSeek_(this.player_.duration());
        }
      } else if (/^[0-9]$/.test(keycode(event))) {
        event.preventDefault();
        event.stopPropagation();
        const gotoFraction = (keycode.codes[keycode(event)] - keycode.codes['0']) * 10.0 / 100.0;
        if (liveTracker && liveTracker.isLive()) {
          this.userSeek_(liveTracker.seekableStart() + liveTracker.liveWindow() * gotoFraction);
        } else {
          this.userSeek_(this.player_.duration() * gotoFraction);
        }
      } else if (keycode.isEventKey(event, 'PgDn')) {
        event.preventDefault();
        event.stopPropagation();
        this.userSeek_(this.player_.currentTime() - STEP_SECONDS * PAGE_KEY_MULTIPLIER);
      } else if (keycode.isEventKey(event, 'PgUp')) {
        event.preventDefault();
        event.stopPropagation();
        this.userSeek_(this.player_.currentTime() + STEP_SECONDS * PAGE_KEY_MULTIPLIER);
      } else {
        // Pass keydown handling up for unsupported keys
        super.handleKeyDown(event);
      }
    }
    dispose() {
      this.disableInterval_();
      this.off(this.player_, ['ended', 'durationchange', 'timeupdate'], this.update);
      if (this.player_.liveTracker) {
        this.off(this.player_.liveTracker, 'liveedgechange', this.update);
      }
      this.off(this.player_, ['playing'], this.enableIntervalHandler_);
      this.off(this.player_, ['ended', 'pause', 'waiting'], this.disableIntervalHandler_);

      // we don't need to update the play progress if the document is hidden,
      // also, this causes the CPU to spike and eventually crash the page on IE11.
      if ('hidden' in document && 'visibilityState' in document) {
        this.off(document, 'visibilitychange', this.toggleVisibility_);
      }
      super.dispose();
    }
  }

  /**
   * Default options for the `SeekBar`
   *
   * @type {Object}
   * @private
   */
  SeekBar.prototype.options_ = {
    children: ['loadProgressBar', 'playProgressBar'],
    barName: 'playProgressBar'
  };

  // MouseTimeDisplay tooltips should not be added to a player on mobile devices
  if (!IS_IOS && !IS_ANDROID) {
    SeekBar.prototype.options_.children.splice(1, 0, 'mouseTimeDisplay');
  }
  Component.registerComponent('SeekBar', SeekBar);

  /**
   * @file progress-control.js
   */

  /**
   * The Progress Control component contains the seek bar, load progress,
   * and play progress.
   *
   * @extends Component
   */
  class ProgressControl extends Component {
    /**
     * Creates an instance of this class.
     *
     * @param { import('../../player').default } player
     *        The `Player` that this class should be attached to.
     *
     * @param {Object} [options]
     *        The key/value store of player options.
     */
    constructor(player, options) {
      super(player, options);
      this.handleMouseMove = throttle(bind_(this, this.handleMouseMove), UPDATE_REFRESH_INTERVAL);
      this.throttledHandleMouseSeek = throttle(bind_(this, this.handleMouseSeek), UPDATE_REFRESH_INTERVAL);
      this.handleMouseUpHandler_ = e => this.handleMouseUp(e);
      this.handleMouseDownHandler_ = e => this.handleMouseDown(e);
      this.enable();
    }

    /**
     * Create the `Component`'s DOM element
     *
     * @return {Element}
     *         The element that was created.
     */
    createEl() {
      return super.createEl('div', {
        className: 'vjs-progress-control vjs-control'
      });
    }

    /**
     * When the mouse moves over the `ProgressControl`, the pointer position
     * gets passed down to the `MouseTimeDisplay` component.
     *
     * @param {Event} event
     *        The `mousemove` event that caused this function to run.
     *
     * @listen mousemove
     */
    handleMouseMove(event) {
      const seekBar = this.getChild('seekBar');
      if (!seekBar) {
        return;
      }
      const playProgressBar = seekBar.getChild('playProgressBar');
      const mouseTimeDisplay = seekBar.getChild('mouseTimeDisplay');
      if (!playProgressBar && !mouseTimeDisplay) {
        return;
      }
      const seekBarEl = seekBar.el();
      const seekBarRect = findPosition(seekBarEl);
      let seekBarPoint = getPointerPosition(seekBarEl, event).x;

      // The default skin has a gap on either side of the `SeekBar`. This means
      // that it's possible to trigger this behavior outside the boundaries of
      // the `SeekBar`. This ensures we stay within it at all times.
      seekBarPoint = clamp(seekBarPoint, 0, 1);
      if (mouseTimeDisplay) {
        mouseTimeDisplay.update(seekBarRect, seekBarPoint);
      }
      if (playProgressBar) {
        playProgressBar.update(seekBarRect, seekBar.getProgress());
      }
    }

    /**
     * A throttled version of the {@link ProgressControl#handleMouseSeek} listener.
     *
     * @method ProgressControl#throttledHandleMouseSeek
     * @param {Event} event
     *        The `mousemove` event that caused this function to run.
     *
     * @listen mousemove
     * @listen touchmove
     */

    /**
     * Handle `mousemove` or `touchmove` events on the `ProgressControl`.
     *
     * @param {Event} event
     *        `mousedown` or `touchstart` event that triggered this function
     *
     * @listens mousemove
     * @listens touchmove
     */
    handleMouseSeek(event) {
      const seekBar = this.getChild('seekBar');
      if (seekBar) {
        seekBar.handleMouseMove(event);
      }
    }

    /**
     * Are controls are currently enabled for this progress control.
     *
     * @return {boolean}
     *         true if controls are enabled, false otherwise
     */
    enabled() {
      return this.enabled_;
    }

    /**
     * Disable all controls on the progress control and its children
     */
    disable() {
      this.children().forEach(child => child.disable && child.disable());
      if (!this.enabled()) {
        return;
      }
      this.off(['mousedown', 'touchstart'], this.handleMouseDownHandler_);
      this.off(this.el_, 'mousemove', this.handleMouseMove);
      this.removeListenersAddedOnMousedownAndTouchstart();
      this.addClass('disabled');
      this.enabled_ = false;

      // Restore normal playback state if controls are disabled while scrubbing
      if (this.player_.scrubbing()) {
        const seekBar = this.getChild('seekBar');
        this.player_.scrubbing(false);
        if (seekBar.videoWasPlaying) {
          silencePromise(this.player_.play());
        }
      }
    }

    /**
     * Enable all controls on the progress control and its children
     */
    enable() {
      this.children().forEach(child => child.enable && child.enable());
      if (this.enabled()) {
        return;
      }
      this.on(['mousedown', 'touchstart'], this.handleMouseDownHandler_);
      this.on(this.el_, 'mousemove', this.handleMouseMove);
      this.removeClass('disabled');
      this.enabled_ = true;
    }

    /**
     * Cleanup listeners after the user finishes interacting with the progress controls
     */
    removeListenersAddedOnMousedownAndTouchstart() {
      const doc = this.el_.ownerDocument;
      this.off(doc, 'mousemove', this.throttledHandleMouseSeek);
      this.off(doc, 'touchmove', this.throttledHandleMouseSeek);
      this.off(doc, 'mouseup', this.handleMouseUpHandler_);
      this.off(doc, 'touchend', this.handleMouseUpHandler_);
    }

    /**
     * Handle `mousedown` or `touchstart` events on the `ProgressControl`.
     *
     * @param {Event} event
     *        `mousedown` or `touchstart` event that triggered this function
     *
     * @listens mousedown
     * @listens touchstart
     */
    handleMouseDown(event) {
      const doc = this.el_.ownerDocument;
      const seekBar = this.getChild('seekBar');
      if (seekBar) {
        seekBar.handleMouseDown(event);
      }
      this.on(doc, 'mousemove', this.throttledHandleMouseSeek);
      this.on(doc, 'touchmove', this.throttledHandleMouseSeek);
      this.on(doc, 'mouseup', this.handleMouseUpHandler_);
      this.on(doc, 'touchend', this.handleMouseUpHandler_);
    }

    /**
     * Handle `mouseup` or `touchend` events on the `ProgressControl`.
     *
     * @param {Event} event
     *        `mouseup` or `touchend` event that triggered this function.
     *
     * @listens touchend
     * @listens mouseup
     */
    handleMouseUp(event) {
      const seekBar = this.getChild('seekBar');
      if (seekBar) {
        seekBar.handleMouseUp(event);
      }
      this.removeListenersAddedOnMousedownAndTouchstart();
    }
  }

  /**
   * Default options for `ProgressControl`
   *
   * @type {Object}
   * @private
   */
  ProgressControl.prototype.options_ = {
    children: ['seekBar']
  };
  Component.registerComponent('ProgressControl', ProgressControl);

  /**
   * @file picture-in-picture-toggle.js
   */

  /**
   * Toggle Picture-in-Picture mode
   *
   * @extends Button
   */
  class PictureInPictureToggle extends Button {
    /**
     * Creates an instance of this class.
     *
     * @param { import('./player').default } player
     *        The `Player` that this class should be attached to.
     *
     * @param {Object} [options]
     *        The key/value store of player options.
     *
     * @listens Player#enterpictureinpicture
     * @listens Player#leavepictureinpicture
     */
    constructor(player, options) {
      super(player, options);
      this.setIcon('picture-in-picture-enter');
      this.on(player, ['enterpictureinpicture', 'leavepictureinpicture'], e => this.handlePictureInPictureChange(e));
      this.on(player, ['disablepictureinpicturechanged', 'loadedmetadata'], e => this.handlePictureInPictureEnabledChange(e));
      this.on(player, ['loadedmetadata', 'audioonlymodechange', 'audiopostermodechange'], () => this.handlePictureInPictureAudioModeChange());

      // TODO: Deactivate button on player emptied event.
      this.disable();
    }

    /**
     * Builds the default DOM `className`.
     *
     * @return {string}
     *         The DOM `className` for this object.
     */
    buildCSSClass() {
      return `vjs-picture-in-picture-control vjs-hidden ${super.buildCSSClass()}`;
    }

    /**
     * Displays or hides the button depending on the audio mode detection.
     * Exits picture-in-picture if it is enabled when switching to audio mode.
     */
    handlePictureInPictureAudioModeChange() {
      // This audio detection will not detect HLS or DASH audio-only streams because there was no reliable way to detect them at the time
      const isSourceAudio = this.player_.currentType().substring(0, 5) === 'audio';
      const isAudioMode = isSourceAudio || this.player_.audioPosterMode() || this.player_.audioOnlyMode();
      if (!isAudioMode) {
        this.show();
        return;
      }
      if (this.player_.isInPictureInPicture()) {
        this.player_.exitPictureInPicture();
      }
      this.hide();
    }

    /**
     * Enables or disables button based on availability of a Picture-In-Picture mode.
     *
     * Enabled if
     * - `player.options().enableDocumentPictureInPicture` is true and
     *   window.documentPictureInPicture is available; or
     * - `player.disablePictureInPicture()` is false and
     *   element.requestPictureInPicture is available
     */
    handlePictureInPictureEnabledChange() {
      if (document.pictureInPictureEnabled && this.player_.disablePictureInPicture() === false || this.player_.options_.enableDocumentPictureInPicture && 'documentPictureInPicture' in window) {
        this.enable();
      } else {
        this.disable();
      }
    }

    /**
     * Handles enterpictureinpicture and leavepictureinpicture on the player and change control text accordingly.
     *
     * @param {Event} [event]
     *        The {@link Player#enterpictureinpicture} or {@link Player#leavepictureinpicture} event that caused this function to be
     *        called.
     *
     * @listens Player#enterpictureinpicture
     * @listens Player#leavepictureinpicture
     */
    handlePictureInPictureChange(event) {
      if (this.player_.isInPictureInPicture()) {
        this.setIcon('picture-in-picture-exit');
        this.controlText('Exit Picture-in-Picture');
      } else {
        this.setIcon('picture-in-picture-enter');
        this.controlText('Picture-in-Picture');
      }
      this.handlePictureInPictureEnabledChange();
    }

    /**
     * This gets called when an `PictureInPictureToggle` is "clicked". See
     * {@link ClickableComponent} for more detailed information on what a click can be.
     *
     * @param {Event} [event]
     *        The `keydown`, `tap`, or `click` event that caused this function to be
     *        called.
     *
     * @listens tap
     * @listens click
     */
    handleClick(event) {
      if (!this.player_.isInPictureInPicture()) {
        this.player_.requestPictureInPicture();
      } else {
        this.player_.exitPictureInPicture();
      }
    }

    /**
     * Show the `Component`s element if it is hidden by removing the
     * 'vjs-hidden' class name from it only in browsers that support the Picture-in-Picture API.
     */
    show() {
      // Does not allow to display the pictureInPictureToggle in browsers that do not support the Picture-in-Picture API, e.g. Firefox.
      if (typeof document.exitPictureInPicture !== 'function') {
        return;
      }
      super.show();
    }
  }

  /**
   * The text that should display over the `PictureInPictureToggle`s controls. Added for localization.
   *
   * @type {string}
   * @protected
   */
  PictureInPictureToggle.prototype.controlText_ = 'Picture-in-Picture';
  Component.registerComponent('PictureInPictureToggle', PictureInPictureToggle);

  /**
   * @file fullscreen-toggle.js
   */

  /**
   * Toggle fullscreen video
   *
   * @extends Button
   */
  class FullscreenToggle extends Button {
    /**
     * Creates an instance of this class.
     *
     * @param { import('./player').default } player
     *        The `Player` that this class should be attached to.
     *
     * @param {Object} [options]
     *        The key/value store of player options.
     */
    constructor(player, options) {
      super(player, options);
      this.setIcon('fullscreen-enter');
      this.on(player, 'fullscreenchange', e => this.handleFullscreenChange(e));
      if (document[player.fsApi_.fullscreenEnabled] === false) {
        this.disable();
      }
    }

    /**
     * Builds the default DOM `className`.
     *
     * @return {string}
     *         The DOM `className` for this object.
     */
    buildCSSClass() {
      return `vjs-fullscreen-control ${super.buildCSSClass()}`;
    }

    /**
     * Handles fullscreenchange on the player and change control text accordingly.
     *
     * @param {Event} [event]
     *        The {@link Player#fullscreenchange} event that caused this function to be
     *        called.
     *
     * @listens Player#fullscreenchange
     */
    handleFullscreenChange(event) {
      if (this.player_.isFullscreen()) {
        this.controlText('Exit Fullscreen');
        this.setIcon('fullscreen-exit');
      } else {
        this.controlText('Fullscreen');
        this.setIcon('fullscreen-enter');
      }
    }

    /**
     * This gets called when an `FullscreenToggle` is "clicked". See
     * {@link ClickableComponent} for more detailed information on what a click can be.
     *
     * @param {Event} [event]
     *        The `keydown`, `tap`, or `click` event that caused this function to be
     *        called.
     *
     * @listens tap
     * @listens click
     */
    handleClick(event) {
      if (!this.player_.isFullscreen()) {
        this.player_.requestFullscreen();
      } else {
        this.player_.exitFullscreen();
      }
    }
  }

  /**
   * The text that should display over the `FullscreenToggle`s controls. Added for localization.
   *
   * @type {string}
   * @protected
   */
  FullscreenToggle.prototype.controlText_ = 'Fullscreen';
  Component.registerComponent('FullscreenToggle', FullscreenToggle);

  /**
   * Check if volume control is supported and if it isn't hide the
   * `Component` that was passed  using the `vjs-hidden` class.
   *
   * @param { import('../../component').default } self
   *        The component that should be hidden if volume is unsupported
   *
   * @param { import('../../player').default } player
   *        A reference to the player
   *
   * @private
   */
  const checkVolumeSupport = function (self, player) {
    // hide volume controls when they're not supported by the current tech
    if (player.tech_ && !player.tech_.featuresVolumeControl) {
      self.addClass('vjs-hidden');
    }
    self.on(player, 'loadstart', function () {
      if (!player.tech_.featuresVolumeControl) {
        self.addClass('vjs-hidden');
      } else {
        self.removeClass('vjs-hidden');
      }
    });
  };

  /**
   * @file volume-level.js
   */

  /**
   * Shows volume level
   *
   * @extends Component
   */
  class VolumeLevel extends Component {
    /**
     * Create the `Component`'s DOM element
     *
     * @return {Element}
     *         The element that was created.
     */
    createEl() {
      const el = super.createEl('div', {
        className: 'vjs-volume-level'
      });
      this.setIcon('circle', el);
      el.appendChild(super.createEl('span', {
        className: 'vjs-control-text'
      }));
      return el;
    }
  }
  Component.registerComponent('VolumeLevel', VolumeLevel);

  /**
   * @file volume-level-tooltip.js
   */

  /**
   * Volume level tooltips display a volume above or side by side the volume bar.
   *
   * @extends Component
   */
  class VolumeLevelTooltip extends Component {
    /**
     * Creates an instance of this class.
     *
     * @param { import('../../player').default } player
     *        The {@link Player} that this class should be attached to.
     *
     * @param {Object} [options]
     *        The key/value store of player options.
     */
    constructor(player, options) {
      super(player, options);
      this.update = throttle(bind_(this, this.update), UPDATE_REFRESH_INTERVAL);
    }

    /**
     * Create the volume tooltip DOM element
     *
     * @return {Element}
     *         The element that was created.
     */
    createEl() {
      return super.createEl('div', {
        className: 'vjs-volume-tooltip'
      }, {
        'aria-hidden': 'true'
      });
    }

    /**
     * Updates the position of the tooltip relative to the `VolumeBar` and
     * its content text.
     *
     * @param {Object} rangeBarRect
     *        The `ClientRect` for the {@link VolumeBar} element.
     *
     * @param {number} rangeBarPoint
     *        A number from 0 to 1, representing a horizontal/vertical reference point
     *        from the left edge of the {@link VolumeBar}
     *
     * @param {boolean} vertical
     *        Referees to the Volume control position
     *        in the control bar{@link VolumeControl}
     *
     */
    update(rangeBarRect, rangeBarPoint, vertical, content) {
      if (!vertical) {
        const tooltipRect = getBoundingClientRect(this.el_);
        const playerRect = getBoundingClientRect(this.player_.el());
        const volumeBarPointPx = rangeBarRect.width * rangeBarPoint;
        if (!playerRect || !tooltipRect) {
          return;
        }
        const spaceLeftOfPoint = rangeBarRect.left - playerRect.left + volumeBarPointPx;
        const spaceRightOfPoint = rangeBarRect.width - volumeBarPointPx + (playerRect.right - rangeBarRect.right);
        let pullTooltipBy = tooltipRect.width / 2;
        if (spaceLeftOfPoint < pullTooltipBy) {
          pullTooltipBy += pullTooltipBy - spaceLeftOfPoint;
        } else if (spaceRightOfPoint < pullTooltipBy) {
          pullTooltipBy = spaceRightOfPoint;
        }
        if (pullTooltipBy < 0) {
          pullTooltipBy = 0;
        } else if (pullTooltipBy > tooltipRect.width) {
          pullTooltipBy = tooltipRect.width;
        }
        this.el_.style.right = `-${pullTooltipBy}px`;
      }
      this.write(`${content}%`);
    }

    /**
     * Write the volume to the tooltip DOM element.
     *
     * @param {string} content
     *        The formatted volume for the tooltip.
     */
    write(content) {
      textContent(this.el_, content);
    }

    /**
     * Updates the position of the volume tooltip relative to the `VolumeBar`.
     *
     * @param {Object} rangeBarRect
     *        The `ClientRect` for the {@link VolumeBar} element.
     *
     * @param {number} rangeBarPoint
     *        A number from 0 to 1, representing a horizontal/vertical reference point
     *        from the left edge of the {@link VolumeBar}
     *
     * @param {boolean} vertical
     *        Referees to the Volume control position
     *        in the control bar{@link VolumeControl}
     *
     * @param {number} volume
     *        The volume level to update the tooltip to
     *
     * @param {Function} cb
     *        A function that will be called during the request animation frame
     *        for tooltips that need to do additional animations from the default
     */
    updateVolume(rangeBarRect, rangeBarPoint, vertical, volume, cb) {
      this.requestNamedAnimationFrame('VolumeLevelTooltip#updateVolume', () => {
        this.update(rangeBarRect, rangeBarPoint, vertical, volume.toFixed(0));
        if (cb) {
          cb();
        }
      });
    }
  }
  Component.registerComponent('VolumeLevelTooltip', VolumeLevelTooltip);

  /**
   * @file mouse-volume-level-display.js
   */

  /**
   * The {@link MouseVolumeLevelDisplay} component tracks mouse movement over the
   * {@link VolumeControl}. It displays an indicator and a {@link VolumeLevelTooltip}
   * indicating the volume level which is represented by a given point in the
   * {@link VolumeBar}.
   *
   * @extends Component
   */
  class MouseVolumeLevelDisplay extends Component {
    /**
     * Creates an instance of this class.
     *
     * @param { import('../../player').default } player
     *        The {@link Player} that this class should be attached to.
     *
     * @param {Object} [options]
     *        The key/value store of player options.
     */
    constructor(player, options) {
      super(player, options);
      this.update = throttle(bind_(this, this.update), UPDATE_REFRESH_INTERVAL);
    }

    /**
     * Create the DOM element for this class.
     *
     * @return {Element}
     *         The element that was created.
     */
    createEl() {
      return super.createEl('div', {
        className: 'vjs-mouse-display'
      });
    }

    /**
     * Enquires updates to its own DOM as well as the DOM of its
     * {@link VolumeLevelTooltip} child.
     *
     * @param {Object} rangeBarRect
     *        The `ClientRect` for the {@link VolumeBar} element.
     *
     * @param {number} rangeBarPoint
     *        A number from 0 to 1, representing a horizontal/vertical reference point
     *        from the left edge of the {@link VolumeBar}
     *
     * @param {boolean} vertical
     *        Referees to the Volume control position
     *        in the control bar{@link VolumeControl}
     *
     */
    update(rangeBarRect, rangeBarPoint, vertical) {
      const volume = 100 * rangeBarPoint;
      this.getChild('volumeLevelTooltip').updateVolume(rangeBarRect, rangeBarPoint, vertical, volume, () => {
        if (vertical) {
          this.el_.style.bottom = `${rangeBarRect.height * rangeBarPoint}px`;
        } else {
          this.el_.style.left = `${rangeBarRect.width * rangeBarPoint}px`;
        }
      });
    }
  }

  /**
   * Default options for `MouseVolumeLevelDisplay`
   *
   * @type {Object}
   * @private
   */
  MouseVolumeLevelDisplay.prototype.options_ = {
    children: ['volumeLevelTooltip']
  };
  Component.registerComponent('MouseVolumeLevelDisplay', MouseVolumeLevelDisplay);

  /**
   * @file volume-bar.js
   */

  /**
   * The bar that contains the volume level and can be clicked on to adjust the level
   *
   * @extends Slider
   */
  class VolumeBar extends Slider {
    /**
     * Creates an instance of this class.
     *
     * @param { import('../../player').default } player
     *        The `Player` that this class should be attached to.
     *
     * @param {Object} [options]
     *        The key/value store of player options.
     */
    constructor(player, options) {
      super(player, options);
      this.on('slideractive', e => this.updateLastVolume_(e));
      this.on(player, 'volumechange', e => this.updateARIAAttributes(e));
      player.ready(() => this.updateARIAAttributes());
    }

    /**
     * Create the `Component`'s DOM element
     *
     * @return {Element}
     *         The element that was created.
     */
    createEl() {
      return super.createEl('div', {
        className: 'vjs-volume-bar vjs-slider-bar'
      }, {
        'aria-label': this.localize('Volume Level'),
        'aria-live': 'polite'
      });
    }

    /**
     * Handle mouse down on volume bar
     *
     * @param {Event} event
     *        The `mousedown` event that caused this to run.
     *
     * @listens mousedown
     */
    handleMouseDown(event) {
      if (!isSingleLeftClick(event)) {
        return;
      }
      super.handleMouseDown(event);
    }

    /**
     * Handle movement events on the {@link VolumeMenuButton}.
     *
     * @param {Event} event
     *        The event that caused this function to run.
     *
     * @listens mousemove
     */
    handleMouseMove(event) {
      const mouseVolumeLevelDisplay = this.getChild('mouseVolumeLevelDisplay');
      if (mouseVolumeLevelDisplay) {
        const volumeBarEl = this.el();
        const volumeBarRect = getBoundingClientRect(volumeBarEl);
        const vertical = this.vertical();
        let volumeBarPoint = getPointerPosition(volumeBarEl, event);
        volumeBarPoint = vertical ? volumeBarPoint.y : volumeBarPoint.x;
        // The default skin has a gap on either side of the `VolumeBar`. This means
        // that it's possible to trigger this behavior outside the boundaries of
        // the `VolumeBar`. This ensures we stay within it at all times.
        volumeBarPoint = clamp(volumeBarPoint, 0, 1);
        mouseVolumeLevelDisplay.update(volumeBarRect, volumeBarPoint, vertical);
      }
      if (!isSingleLeftClick(event)) {
        return;
      }
      this.checkMuted();
      this.player_.volume(this.calculateDistance(event));
    }

    /**
     * If the player is muted unmute it.
     */
    checkMuted() {
      if (this.player_.muted()) {
        this.player_.muted(false);
      }
    }

    /**
     * Get percent of volume level
     *
     * @return {number}
     *         Volume level percent as a decimal number.
     */
    getPercent() {
      if (this.player_.muted()) {
        return 0;
      }
      return this.player_.volume();
    }

    /**
     * Increase volume level for keyboard users
     */
    stepForward() {
      this.checkMuted();
      this.player_.volume(this.player_.volume() + 0.1);
    }

    /**
     * Decrease volume level for keyboard users
     */
    stepBack() {
      this.checkMuted();
      this.player_.volume(this.player_.volume() - 0.1);
    }

    /**
     * Update ARIA accessibility attributes
     *
     * @param {Event} [event]
     *        The `volumechange` event that caused this function to run.
     *
     * @listens Player#volumechange
     */
    updateARIAAttributes(event) {
      const ariaValue = this.player_.muted() ? 0 : this.volumeAsPercentage_();
      this.el_.setAttribute('aria-valuenow', ariaValue);
      this.el_.setAttribute('aria-valuetext', ariaValue + '%');
    }

    /**
     * Returns the current value of the player volume as a percentage
     *
     * @private
     */
    volumeAsPercentage_() {
      return Math.round(this.player_.volume() * 100);
    }

    /**
     * When user starts dragging the VolumeBar, store the volume and listen for
     * the end of the drag. When the drag ends, if the volume was set to zero,
     * set lastVolume to the stored volume.
     *
     * @listens slideractive
     * @private
     */
    updateLastVolume_() {
      const volumeBeforeDrag = this.player_.volume();
      this.one('sliderinactive', () => {
        if (this.player_.volume() === 0) {
          this.player_.lastVolume_(volumeBeforeDrag);
        }
      });
    }
  }

  /**
   * Default options for the `VolumeBar`
   *
   * @type {Object}
   * @private
   */
  VolumeBar.prototype.options_ = {
    children: ['volumeLevel'],
    barName: 'volumeLevel'
  };

  // MouseVolumeLevelDisplay tooltip should not be added to a player on mobile devices
  if (!IS_IOS && !IS_ANDROID) {
    VolumeBar.prototype.options_.children.splice(0, 0, 'mouseVolumeLevelDisplay');
  }

  /**
   * Call the update event for this Slider when this event happens on the player.
   *
   * @type {string}
   */
  VolumeBar.prototype.playerEvent = 'volumechange';
  Component.registerComponent('VolumeBar', VolumeBar);

  /**
   * @file volume-control.js
   */

  /**
   * The component for controlling the volume level
   *
   * @extends Component
   */
  class VolumeControl extends Component {
    /**
     * Creates an instance of this class.
     *
     * @param { import('../../player').default } player
     *        The `Player` that this class should be attached to.
     *
     * @param {Object} [options={}]
     *        The key/value store of player options.
     */
    constructor(player, options = {}) {
      options.vertical = options.vertical || false;

      // Pass the vertical option down to the VolumeBar if
      // the VolumeBar is turned on.
      if (typeof options.volumeBar === 'undefined' || isPlain(options.volumeBar)) {
        options.volumeBar = options.volumeBar || {};
        options.volumeBar.vertical = options.vertical;
      }
      super(player, options);

      // hide this control if volume support is missing
      checkVolumeSupport(this, player);
      this.throttledHandleMouseMove = throttle(bind_(this, this.handleMouseMove), UPDATE_REFRESH_INTERVAL);
      this.handleMouseUpHandler_ = e => this.handleMouseUp(e);
      this.on('mousedown', e => this.handleMouseDown(e));
      this.on('touchstart', e => this.handleMouseDown(e));
      this.on('mousemove', e => this.handleMouseMove(e));

      // while the slider is active (the mouse has been pressed down and
      // is dragging) or in focus we do not want to hide the VolumeBar
      this.on(this.volumeBar, ['focus', 'slideractive'], () => {
        this.volumeBar.addClass('vjs-slider-active');
        this.addClass('vjs-slider-active');
        this.trigger('slideractive');
      });
      this.on(this.volumeBar, ['blur', 'sliderinactive'], () => {
        this.volumeBar.removeClass('vjs-slider-active');
        this.removeClass('vjs-slider-active');
        this.trigger('sliderinactive');
      });
    }

    /**
     * Create the `Component`'s DOM element
     *
     * @return {Element}
     *         The element that was created.
     */
    createEl() {
      let orientationClass = 'vjs-volume-horizontal';
      if (this.options_.vertical) {
        orientationClass = 'vjs-volume-vertical';
      }
      return super.createEl('div', {
        className: `vjs-volume-control vjs-control ${orientationClass}`
      });
    }

    /**
     * Handle `mousedown` or `touchstart` events on the `VolumeControl`.
     *
     * @param {Event} event
     *        `mousedown` or `touchstart` event that triggered this function
     *
     * @listens mousedown
     * @listens touchstart
     */
    handleMouseDown(event) {
      const doc = this.el_.ownerDocument;
      this.on(doc, 'mousemove', this.throttledHandleMouseMove);
      this.on(doc, 'touchmove', this.throttledHandleMouseMove);
      this.on(doc, 'mouseup', this.handleMouseUpHandler_);
      this.on(doc, 'touchend', this.handleMouseUpHandler_);
    }

    /**
     * Handle `mouseup` or `touchend` events on the `VolumeControl`.
     *
     * @param {Event} event
     *        `mouseup` or `touchend` event that triggered this function.
     *
     * @listens touchend
     * @listens mouseup
     */
    handleMouseUp(event) {
      const doc = this.el_.ownerDocument;
      this.off(doc, 'mousemove', this.throttledHandleMouseMove);
      this.off(doc, 'touchmove', this.throttledHandleMouseMove);
      this.off(doc, 'mouseup', this.handleMouseUpHandler_);
      this.off(doc, 'touchend', this.handleMouseUpHandler_);
    }

    /**
     * Handle `mousedown` or `touchstart` events on the `VolumeControl`.
     *
     * @param {Event} event
     *        `mousedown` or `touchstart` event that triggered this function
     *
     * @listens mousedown
     * @listens touchstart
     */
    handleMouseMove(event) {
      this.volumeBar.handleMouseMove(event);
    }
  }

  /**
   * Default options for the `VolumeControl`
   *
   * @type {Object}
   * @private
   */
  VolumeControl.prototype.options_ = {
    children: ['volumeBar']
  };
  Component.registerComponent('VolumeControl', VolumeControl);

  /**
   * Check if muting volume is supported and if it isn't hide the mute toggle
   * button.
   *
   * @param { import('../../component').default } self
   *        A reference to the mute toggle button
   *
   * @param { import('../../player').default } player
   *        A reference to the player
   *
   * @private
   */
  const checkMuteSupport = function (self, player) {
    // hide mute toggle button if it's not supported by the current tech
    if (player.tech_ && !player.tech_.featuresMuteControl) {
      self.addClass('vjs-hidden');
    }
    self.on(player, 'loadstart', function () {
      if (!player.tech_.featuresMuteControl) {
        self.addClass('vjs-hidden');
      } else {
        self.removeClass('vjs-hidden');
      }
    });
  };

  /**
   * @file mute-toggle.js
   */

  /**
   * A button component for muting the audio.
   *
   * @extends Button
   */
  class MuteToggle extends Button {
    /**
     * Creates an instance of this class.
     *
     * @param { import('./player').default } player
     *        The `Player` that this class should be attached to.
     *
     * @param {Object} [options]
     *        The key/value store of player options.
     */
    constructor(player, options) {
      super(player, options);

      // hide this control if volume support is missing
      checkMuteSupport(this, player);
      this.on(player, ['loadstart', 'volumechange'], e => this.update(e));
    }

    /**
     * Builds the default DOM `className`.
     *
     * @return {string}
     *         The DOM `className` for this object.
     */
    buildCSSClass() {
      return `vjs-mute-control ${super.buildCSSClass()}`;
    }

    /**
     * This gets called when an `MuteToggle` is "clicked". See
     * {@link ClickableComponent} for more detailed information on what a click can be.
     *
     * @param {Event} [event]
     *        The `keydown`, `tap`, or `click` event that caused this function to be
     *        called.
     *
     * @listens tap
     * @listens click
     */
    handleClick(event) {
      const vol = this.player_.volume();
      const lastVolume = this.player_.lastVolume_();
      if (vol === 0) {
        const volumeToSet = lastVolume < 0.1 ? 0.1 : lastVolume;
        this.player_.volume(volumeToSet);
        this.player_.muted(false);
      } else {
        this.player_.muted(this.player_.muted() ? false : true);
      }
    }

    /**
     * Update the `MuteToggle` button based on the state of `volume` and `muted`
     * on the player.
     *
     * @param {Event} [event]
     *        The {@link Player#loadstart} event if this function was called
     *        through an event.
     *
     * @listens Player#loadstart
     * @listens Player#volumechange
     */
    update(event) {
      this.updateIcon_();
      this.updateControlText_();
    }

    /**
     * Update the appearance of the `MuteToggle` icon.
     *
     * Possible states (given `level` variable below):
     * - 0: crossed out
     * - 1: zero bars of volume
     * - 2: one bar of volume
     * - 3: two bars of volume
     *
     * @private
     */
    updateIcon_() {
      const vol = this.player_.volume();
      let level = 3;
      this.setIcon('volume-high');

      // in iOS when a player is loaded with muted attribute
      // and volume is changed with a native mute button
      // we want to make sure muted state is updated
      if (IS_IOS && this.player_.tech_ && this.player_.tech_.el_) {
        this.player_.muted(this.player_.tech_.el_.muted);
      }
      if (vol === 0 || this.player_.muted()) {
        this.setIcon('volume-mute');
        level = 0;
      } else if (vol < 0.33) {
        this.setIcon('volume-low');
        level = 1;
      } else if (vol < 0.67) {
        this.setIcon('volume-medium');
        level = 2;
      }
      removeClass(this.el_, [0, 1, 2, 3].reduce((str, i) => str + `${i ? ' ' : ''}vjs-vol-${i}`, ''));
      addClass(this.el_, `vjs-vol-${level}`);
    }

    /**
     * If `muted` has changed on the player, update the control text
     * (`title` attribute on `vjs-mute-control` element and content of
     * `vjs-control-text` element).
     *
     * @private
     */
    updateControlText_() {
      const soundOff = this.player_.muted() || this.player_.volume() === 0;
      const text = soundOff ? 'Unmute' : 'Mute';
      if (this.controlText() !== text) {
        this.controlText(text);
      }
    }
  }

  /**
   * The text that should display over the `MuteToggle`s controls. Added for localization.
   *
   * @type {string}
   * @protected
   */
  MuteToggle.prototype.controlText_ = 'Mute';
  Component.registerComponent('MuteToggle', MuteToggle);

  /**
   * @file volume-control.js
   */

  /**
   * A Component to contain the MuteToggle and VolumeControl so that
   * they can work together.
   *
   * @extends Component
   */
  class VolumePanel extends Component {
    /**
     * Creates an instance of this class.
     *
     * @param { import('./player').default } player
     *        The `Player` that this class should be attached to.
     *
     * @param {Object} [options={}]
     *        The key/value store of player options.
     */
    constructor(player, options = {}) {
      if (typeof options.inline !== 'undefined') {
        options.inline = options.inline;
      } else {
        options.inline = true;
      }

      // pass the inline option down to the VolumeControl as vertical if
      // the VolumeControl is on.
      if (typeof options.volumeControl === 'undefined' || isPlain(options.volumeControl)) {
        options.volumeControl = options.volumeControl || {};
        options.volumeControl.vertical = !options.inline;
      }
      super(player, options);

      // this handler is used by mouse handler methods below
      this.handleKeyPressHandler_ = e => this.handleKeyPress(e);
      this.on(player, ['loadstart'], e => this.volumePanelState_(e));
      this.on(this.muteToggle, 'keyup', e => this.handleKeyPress(e));
      this.on(this.volumeControl, 'keyup', e => this.handleVolumeControlKeyUp(e));
      this.on('keydown', e => this.handleKeyPress(e));
      this.on('mouseover', e => this.handleMouseOver(e));
      this.on('mouseout', e => this.handleMouseOut(e));

      // while the slider is active (the mouse has been pressed down and
      // is dragging) we do not want to hide the VolumeBar
      this.on(this.volumeControl, ['slideractive'], this.sliderActive_);
      this.on(this.volumeControl, ['sliderinactive'], this.sliderInactive_);
    }

    /**
     * Add vjs-slider-active class to the VolumePanel
     *
     * @listens VolumeControl#slideractive
     * @private
     */
    sliderActive_() {
      this.addClass('vjs-slider-active');
    }

    /**
     * Removes vjs-slider-active class to the VolumePanel
     *
     * @listens VolumeControl#sliderinactive
     * @private
     */
    sliderInactive_() {
      this.removeClass('vjs-slider-active');
    }

    /**
     * Adds vjs-hidden or vjs-mute-toggle-only to the VolumePanel
     * depending on MuteToggle and VolumeControl state
     *
     * @listens Player#loadstart
     * @private
     */
    volumePanelState_() {
      // hide volume panel if neither volume control or mute toggle
      // are displayed
      if (this.volumeControl.hasClass('vjs-hidden') && this.muteToggle.hasClass('vjs-hidden')) {
        this.addClass('vjs-hidden');
      }

      // if only mute toggle is visible we don't want
      // volume panel expanding when hovered or active
      if (this.volumeControl.hasClass('vjs-hidden') && !this.muteToggle.hasClass('vjs-hidden')) {
        this.addClass('vjs-mute-toggle-only');
      }
    }

    /**
     * Create the `Component`'s DOM element
     *
     * @return {Element}
     *         The element that was created.
     */
    createEl() {
      let orientationClass = 'vjs-volume-panel-horizontal';
      if (!this.options_.inline) {
        orientationClass = 'vjs-volume-panel-vertical';
      }
      return super.createEl('div', {
        className: `vjs-volume-panel vjs-control ${orientationClass}`
      });
    }

    /**
     * Dispose of the `volume-panel` and all child components.
     */
    dispose() {
      this.handleMouseOut();
      super.dispose();
    }

    /**
     * Handles `keyup` events on the `VolumeControl`, looking for ESC, which closes
     * the volume panel and sets focus on `MuteToggle`.
     *
     * @param {Event} event
     *        The `keyup` event that caused this function to be called.
     *
     * @listens keyup
     */
    handleVolumeControlKeyUp(event) {
      if (keycode.isEventKey(event, 'Esc')) {
        this.muteToggle.focus();
      }
    }

    /**
     * This gets called when a `VolumePanel` gains hover via a `mouseover` event.
     * Turns on listening for `mouseover` event. When they happen it
     * calls `this.handleMouseOver`.
     *
     * @param {Event} event
     *        The `mouseover` event that caused this function to be called.
     *
     * @listens mouseover
     */
    handleMouseOver(event) {
      this.addClass('vjs-hover');
      on(document, 'keyup', this.handleKeyPressHandler_);
    }

    /**
     * This gets called when a `VolumePanel` gains hover via a `mouseout` event.
     * Turns on listening for `mouseout` event. When they happen it
     * calls `this.handleMouseOut`.
     *
     * @param {Event} event
     *        The `mouseout` event that caused this function to be called.
     *
     * @listens mouseout
     */
    handleMouseOut(event) {
      this.removeClass('vjs-hover');
      off(document, 'keyup', this.handleKeyPressHandler_);
    }

    /**
     * Handles `keyup` event on the document or `keydown` event on the `VolumePanel`,
     * looking for ESC, which hides the `VolumeControl`.
     *
     * @param {Event} event
     *        The keypress that triggered this event.
     *
     * @listens keydown | keyup
     */
    handleKeyPress(event) {
      if (keycode.isEventKey(event, 'Esc')) {
        this.handleMouseOut();
      }
    }
  }

  /**
   * Default options for the `VolumeControl`
   *
   * @type {Object}
   * @private
   */
  VolumePanel.prototype.options_ = {
    children: ['muteToggle', 'volumeControl']
  };
  Component.registerComponent('VolumePanel', VolumePanel);

  /**
   * Button to skip forward a configurable amount of time
   * through a video. Renders in the control bar.
   *
   * e.g. options: {controlBar: {skipButtons: forward: 5}}
   *
   * @extends Button
   */
  class SkipForward extends Button {
    constructor(player, options) {
      super(player, options);
      this.validOptions = [5, 10, 30];
      this.skipTime = this.getSkipForwardTime();
      if (this.skipTime && this.validOptions.includes(this.skipTime)) {
        this.setIcon(`forward-${this.skipTime}`);
        this.controlText(this.localize('Skip forward {1} seconds', [this.skipTime]));
        this.show();
      } else {
        this.hide();
      }
    }
    getSkipForwardTime() {
      const playerOptions = this.options_.playerOptions;
      return playerOptions.controlBar && playerOptions.controlBar.skipButtons && playerOptions.controlBar.skipButtons.forward;
    }
    buildCSSClass() {
      return `vjs-skip-forward-${this.getSkipForwardTime()} ${super.buildCSSClass()}`;
    }

    /**
     * On click, skips forward in the duration/seekable range by a configurable amount of seconds.
     * If the time left in the duration/seekable range is less than the configured 'skip forward' time,
     * skips to end of duration/seekable range.
     *
     * Handle a click on a `SkipForward` button
     *
     * @param {EventTarget~Event} event
     *        The `click` event that caused this function
     *        to be called
     */
    handleClick(event) {
      if (isNaN(this.player_.duration())) {
        return;
      }
      const currentVideoTime = this.player_.currentTime();
      const liveTracker = this.player_.liveTracker;
      const duration = liveTracker && liveTracker.isLive() ? liveTracker.seekableEnd() : this.player_.duration();
      let newTime;
      if (currentVideoTime + this.skipTime <= duration) {
        newTime = currentVideoTime + this.skipTime;
      } else {
        newTime = duration;
      }
      this.player_.currentTime(newTime);
    }

    /**
     * Update control text on languagechange
     */
    handleLanguagechange() {
      this.controlText(this.localize('Skip forward {1} seconds', [this.skipTime]));
    }
  }
  Component.registerComponent('SkipForward', SkipForward);

  /**
   * Button to skip backward a configurable amount of time
   * through a video. Renders in the control bar.
   *
   *  * e.g. options: {controlBar: {skipButtons: backward: 5}}
   *
   * @extends Button
   */
  class SkipBackward extends Button {
    constructor(player, options) {
      super(player, options);
      this.validOptions = [5, 10, 30];
      this.skipTime = this.getSkipBackwardTime();
      if (this.skipTime && this.validOptions.includes(this.skipTime)) {
        this.setIcon(`replay-${this.skipTime}`);
        this.controlText(this.localize('Skip backward {1} seconds', [this.skipTime]));
        this.show();
      } else {
        this.hide();
      }
    }
    getSkipBackwardTime() {
      const playerOptions = this.options_.playerOptions;
      return playerOptions.controlBar && playerOptions.controlBar.skipButtons && playerOptions.controlBar.skipButtons.backward;
    }
    buildCSSClass() {
      return `vjs-skip-backward-${this.getSkipBackwardTime()} ${super.buildCSSClass()}`;
    }

    /**
     * On click, skips backward in the video by a configurable amount of seconds.
     * If the current time in the video is less than the configured 'skip backward' time,
     * skips to beginning of video or seekable range.
     *
     * Handle a click on a `SkipBackward` button
     *
     * @param {EventTarget~Event} event
     *        The `click` event that caused this function
     *        to be called
     */
    handleClick(event) {
      const currentVideoTime = this.player_.currentTime();
      const liveTracker = this.player_.liveTracker;
      const seekableStart = liveTracker && liveTracker.isLive() && liveTracker.seekableStart();
      let newTime;
      if (seekableStart && currentVideoTime - this.skipTime <= seekableStart) {
        newTime = seekableStart;
      } else if (currentVideoTime >= this.skipTime) {
        newTime = currentVideoTime - this.skipTime;
      } else {
        newTime = 0;
      }
      this.player_.currentTime(newTime);
    }

    /**
     * Update control text on languagechange
     */
    handleLanguagechange() {
      this.controlText(this.localize('Skip backward {1} seconds', [this.skipTime]));
    }
  }
  SkipBackward.prototype.controlText_ = 'Skip Backward';
  Component.registerComponent('SkipBackward', SkipBackward);

  /**
   * @file menu.js
   */

  /**
   * The Menu component is used to build popup menus, including subtitle and
   * captions selection menus.
   *
   * @extends Component
   */
  class Menu extends Component {
    /**
     * Create an instance of this class.
     *
     * @param { import('../player').default } player
     *        the player that this component should attach to
     *
     * @param {Object} [options]
     *        Object of option names and values
     *
     */
    constructor(player, options) {
      super(player, options);
      if (options) {
        this.menuButton_ = options.menuButton;
      }
      this.focusedChild_ = -1;
      this.on('keydown', e => this.handleKeyDown(e));

      // All the menu item instances share the same blur handler provided by the menu container.
      this.boundHandleBlur_ = e => this.handleBlur(e);
      this.boundHandleTapClick_ = e => this.handleTapClick(e);
    }

    /**
     * Add event listeners to the {@link MenuItem}.
     *
     * @param {Object} component
     *        The instance of the `MenuItem` to add listeners to.
     *
     */
    addEventListenerForItem(component) {
      if (!(component instanceof Component)) {
        return;
      }
      this.on(component, 'blur', this.boundHandleBlur_);
      this.on(component, ['tap', 'click'], this.boundHandleTapClick_);
    }

    /**
     * Remove event listeners from the {@link MenuItem}.
     *
     * @param {Object} component
     *        The instance of the `MenuItem` to remove listeners.
     *
     */
    removeEventListenerForItem(component) {
      if (!(component instanceof Component)) {
        return;
      }
      this.off(component, 'blur', this.boundHandleBlur_);
      this.off(component, ['tap', 'click'], this.boundHandleTapClick_);
    }

    /**
     * This method will be called indirectly when the component has been added
     * before the component adds to the new menu instance by `addItem`.
     * In this case, the original menu instance will remove the component
     * by calling `removeChild`.
     *
     * @param {Object} component
     *        The instance of the `MenuItem`
     */
    removeChild(component) {
      if (typeof component === 'string') {
        component = this.getChild(component);
      }
      this.removeEventListenerForItem(component);
      super.removeChild(component);
    }

    /**
     * Add a {@link MenuItem} to the menu.
     *
     * @param {Object|string} component
     *        The name or instance of the `MenuItem` to add.
     *
     */
    addItem(component) {
      const childComponent = this.addChild(component);
      if (childComponent) {
        this.addEventListenerForItem(childComponent);
      }
    }

    /**
     * Create the `Menu`s DOM element.
     *
     * @return {Element}
     *         the element that was created
     */
    createEl() {
      const contentElType = this.options_.contentElType || 'ul';
      this.contentEl_ = createEl(contentElType, {
        className: 'vjs-menu-content'
      });
      this.contentEl_.setAttribute('role', 'menu');
      const el = super.createEl('div', {
        append: this.contentEl_,
        className: 'vjs-menu'
      });
      el.appendChild(this.contentEl_);

      // Prevent clicks from bubbling up. Needed for Menu Buttons,
      // where a click on the parent is significant
      on(el, 'click', function (event) {
        event.preventDefault();
        event.stopImmediatePropagation();
      });
      return el;
    }
    dispose() {
      this.contentEl_ = null;
      this.boundHandleBlur_ = null;
      this.boundHandleTapClick_ = null;
      super.dispose();
    }

    /**
     * Called when a `MenuItem` loses focus.
     *
     * @param {Event} event
     *        The `blur` event that caused this function to be called.
     *
     * @listens blur
     */
    handleBlur(event) {
      const relatedTarget = event.relatedTarget || document.activeElement;

      // Close menu popup when a user clicks outside the menu
      if (!this.children().some(element => {
        return element.el() === relatedTarget;
      })) {
        const btn = this.menuButton_;
        if (btn && btn.buttonPressed_ && relatedTarget !== btn.el().firstChild) {
          btn.unpressButton();
        }
      }
    }

    /**
     * Called when a `MenuItem` gets clicked or tapped.
     *
     * @param {Event} event
     *        The `click` or `tap` event that caused this function to be called.
     *
     * @listens click,tap
     */
    handleTapClick(event) {
      // Unpress the associated MenuButton, and move focus back to it
      if (this.menuButton_) {
        this.menuButton_.unpressButton();
        const childComponents = this.children();
        if (!Array.isArray(childComponents)) {
          return;
        }
        const foundComponent = childComponents.filter(component => component.el() === event.target)[0];
        if (!foundComponent) {
          return;
        }

        // don't focus menu button if item is a caption settings item
        // because focus will move elsewhere
        if (foundComponent.name() !== 'CaptionSettingsMenuItem') {
          this.menuButton_.focus();
        }
      }
    }

    /**
     * Handle a `keydown` event on this menu. This listener is added in the constructor.
     *
     * @param {Event} event
     *        A `keydown` event that happened on the menu.
     *
     * @listens keydown
     */
    handleKeyDown(event) {
      // Left and Down Arrows
      if (keycode.isEventKey(event, 'Left') || keycode.isEventKey(event, 'Down')) {
        event.preventDefault();
        event.stopPropagation();
        this.stepForward();

        // Up and Right Arrows
      } else if (keycode.isEventKey(event, 'Right') || keycode.isEventKey(event, 'Up')) {
        event.preventDefault();
        event.stopPropagation();
        this.stepBack();
      }
    }

    /**
     * Move to next (lower) menu item for keyboard users.
     */
    stepForward() {
      let stepChild = 0;
      if (this.focusedChild_ !== undefined) {
        stepChild = this.focusedChild_ + 1;
      }
      this.focus(stepChild);
    }

    /**
     * Move to previous (higher) menu item for keyboard users.
     */
    stepBack() {
      let stepChild = 0;
      if (this.focusedChild_ !== undefined) {
        stepChild = this.focusedChild_ - 1;
      }
      this.focus(stepChild);
    }

    /**
     * Set focus on a {@link MenuItem} in the `Menu`.
     *
     * @param {Object|string} [item=0]
     *        Index of child item set focus on.
     */
    focus(item = 0) {
      const children = this.children().slice();
      const haveTitle = children.length && children[0].hasClass('vjs-menu-title');
      if (haveTitle) {
        children.shift();
      }
      if (children.length > 0) {
        if (item < 0) {
          item = 0;
        } else if (item >= children.length) {
          item = children.length - 1;
        }
        this.focusedChild_ = item;
        children[item].el_.focus();
      }
    }
  }
  Component.registerComponent('Menu', Menu);

  /**
   * @file menu-button.js
   */

  /**
   * A `MenuButton` class for any popup {@link Menu}.
   *
   * @extends Component
   */
  class MenuButton extends Component {
    /**
     * Creates an instance of this class.
     *
     * @param { import('../player').default } player
     *        The `Player` that this class should be attached to.
     *
     * @param {Object} [options={}]
     *        The key/value store of player options.
     */
    constructor(player, options = {}) {
      super(player, options);
      this.menuButton_ = new Button(player, options);
      this.menuButton_.controlText(this.controlText_);
      this.menuButton_.el_.setAttribute('aria-haspopup', 'true');

      // Add buildCSSClass values to the button, not the wrapper
      const buttonClass = Button.prototype.buildCSSClass();
      this.menuButton_.el_.className = this.buildCSSClass() + ' ' + buttonClass;
      this.menuButton_.removeClass('vjs-control');
      this.addChild(this.menuButton_);
      this.update();
      this.enabled_ = true;
      const handleClick = e => this.handleClick(e);
      this.handleMenuKeyUp_ = e => this.handleMenuKeyUp(e);
      this.on(this.menuButton_, 'tap', handleClick);
      this.on(this.menuButton_, 'click', handleClick);
      this.on(this.menuButton_, 'keydown', e => this.handleKeyDown(e));
      this.on(this.menuButton_, 'mouseenter', () => {
        this.addClass('vjs-hover');
        this.menu.show();
        on(document, 'keyup', this.handleMenuKeyUp_);
      });
      this.on('mouseleave', e => this.handleMouseLeave(e));
      this.on('keydown', e => this.handleSubmenuKeyDown(e));
    }

    /**
     * Update the menu based on the current state of its items.
     */
    update() {
      const menu = this.createMenu();
      if (this.menu) {
        this.menu.dispose();
        this.removeChild(this.menu);
      }
      this.menu = menu;
      this.addChild(menu);

      /**
       * Track the state of the menu button
       *
       * @type {Boolean}
       * @private
       */
      this.buttonPressed_ = false;
      this.menuButton_.el_.setAttribute('aria-expanded', 'false');
      if (this.items && this.items.length <= this.hideThreshold_) {
        this.hide();
        this.menu.contentEl_.removeAttribute('role');
      } else {
        this.show();
        this.menu.contentEl_.setAttribute('role', 'menu');
      }
    }

    /**
     * Create the menu and add all items to it.
     *
     * @return {Menu}
     *         The constructed menu
     */
    createMenu() {
      const menu = new Menu(this.player_, {
        menuButton: this
      });

      /**
       * Hide the menu if the number of items is less than or equal to this threshold. This defaults
       * to 0 and whenever we add items which can be hidden to the menu we'll increment it. We list
       * it here because every time we run `createMenu` we need to reset the value.
       *
       * @protected
       * @type {Number}
       */
      this.hideThreshold_ = 0;

      // Add a title list item to the top
      if (this.options_.title) {
        const titleEl = createEl('li', {
          className: 'vjs-menu-title',
          textContent: toTitleCase(this.options_.title),
          tabIndex: -1
        });
        const titleComponent = new Component(this.player_, {
          el: titleEl
        });
        menu.addItem(titleComponent);
      }
      this.items = this.createItems();
      if (this.items) {
        // Add menu items to the menu
        for (let i = 0; i < this.items.length; i++) {
          menu.addItem(this.items[i]);
        }
      }
      return menu;
    }

    /**
     * Create the list of menu items. Specific to each subclass.
     *
     * @abstract
     */
    createItems() {}

    /**
     * Create the `MenuButtons`s DOM element.
     *
     * @return {Element}
     *         The element that gets created.
     */
    createEl() {
      return super.createEl('div', {
        className: this.buildWrapperCSSClass()
      }, {});
    }

    /**
     * Overwrites the `setIcon` method from `Component`.
     * In this case, we want the icon to be appended to the menuButton.
     *
     * @param {string} name
     *         The icon name to be added.
     */
    setIcon(name) {
      super.setIcon(name, this.menuButton_.el_);
    }

    /**
     * Allow sub components to stack CSS class names for the wrapper element
     *
     * @return {string}
     *         The constructed wrapper DOM `className`
     */
    buildWrapperCSSClass() {
      let menuButtonClass = 'vjs-menu-button';

      // If the inline option is passed, we want to use different styles altogether.
      if (this.options_.inline === true) {
        menuButtonClass += '-inline';
      } else {
        menuButtonClass += '-popup';
      }

      // TODO: Fix the CSS so that this isn't necessary
      const buttonClass = Button.prototype.buildCSSClass();
      return `vjs-menu-button ${menuButtonClass} ${buttonClass} ${super.buildCSSClass()}`;
    }

    /**
     * Builds the default DOM `className`.
     *
     * @return {string}
     *         The DOM `className` for this object.
     */
    buildCSSClass() {
      let menuButtonClass = 'vjs-menu-button';

      // If the inline option is passed, we want to use different styles altogether.
      if (this.options_.inline === true) {
        menuButtonClass += '-inline';
      } else {
        menuButtonClass += '-popup';
      }
      return `vjs-menu-button ${menuButtonClass} ${super.buildCSSClass()}`;
    }

    /**
     * Get or set the localized control text that will be used for accessibility.
     *
     * > NOTE: This will come from the internal `menuButton_` element.
     *
     * @param {string} [text]
     *        Control text for element.
     *
     * @param {Element} [el=this.menuButton_.el()]
     *        Element to set the title on.
     *
     * @return {string}
     *         - The control text when getting
     */
    controlText(text, el = this.menuButton_.el()) {
      return this.menuButton_.controlText(text, el);
    }

    /**
     * Dispose of the `menu-button` and all child components.
     */
    dispose() {
      this.handleMouseLeave();
      super.dispose();
    }

    /**
     * Handle a click on a `MenuButton`.
     * See {@link ClickableComponent#handleClick} for instances where this is called.
     *
     * @param {Event} event
     *        The `keydown`, `tap`, or `click` event that caused this function to be
     *        called.
     *
     * @listens tap
     * @listens click
     */
    handleClick(event) {
      if (this.buttonPressed_) {
        this.unpressButton();
      } else {
        this.pressButton();
      }
    }

    /**
     * Handle `mouseleave` for `MenuButton`.
     *
     * @param {Event} event
     *        The `mouseleave` event that caused this function to be called.
     *
     * @listens mouseleave
     */
    handleMouseLeave(event) {
      this.removeClass('vjs-hover');
      off(document, 'keyup', this.handleMenuKeyUp_);
    }

    /**
     * Set the focus to the actual button, not to this element
     */
    focus() {
      this.menuButton_.focus();
    }

    /**
     * Remove the focus from the actual button, not this element
     */
    blur() {
      this.menuButton_.blur();
    }

    /**
     * Handle tab, escape, down arrow, and up arrow keys for `MenuButton`. See
     * {@link ClickableComponent#handleKeyDown} for instances where this is called.
     *
     * @param {Event} event
     *        The `keydown` event that caused this function to be called.
     *
     * @listens keydown
     */
    handleKeyDown(event) {
      // Escape or Tab unpress the 'button'
      if (keycode.isEventKey(event, 'Esc') || keycode.isEventKey(event, 'Tab')) {
        if (this.buttonPressed_) {
          this.unpressButton();
        }

        // Don't preventDefault for Tab key - we still want to lose focus
        if (!keycode.isEventKey(event, 'Tab')) {
          event.preventDefault();
          // Set focus back to the menu button's button
          this.menuButton_.focus();
        }
        // Up Arrow or Down Arrow also 'press' the button to open the menu
      } else if (keycode.isEventKey(event, 'Up') || keycode.isEventKey(event, 'Down')) {
        if (!this.buttonPressed_) {
          event.preventDefault();
          this.pressButton();
        }
      }
    }

    /**
     * Handle a `keyup` event on a `MenuButton`. The listener for this is added in
     * the constructor.
     *
     * @param {Event} event
     *        Key press event
     *
     * @listens keyup
     */
    handleMenuKeyUp(event) {
      // Escape hides popup menu
      if (keycode.isEventKey(event, 'Esc') || keycode.isEventKey(event, 'Tab')) {
        this.removeClass('vjs-hover');
      }
    }

    /**
     * This method name now delegates to `handleSubmenuKeyDown`. This means
     * anyone calling `handleSubmenuKeyPress` will not see their method calls
     * stop working.
     *
     * @param {Event} event
     *        The event that caused this function to be called.
     */
    handleSubmenuKeyPress(event) {
      this.handleSubmenuKeyDown(event);
    }

    /**
     * Handle a `keydown` event on a sub-menu. The listener for this is added in
     * the constructor.
     *
     * @param {Event} event
     *        Key press event
     *
     * @listens keydown
     */
    handleSubmenuKeyDown(event) {
      // Escape or Tab unpress the 'button'
      if (keycode.isEventKey(event, 'Esc') || keycode.isEventKey(event, 'Tab')) {
        if (this.buttonPressed_) {
          this.unpressButton();
        }
        // Don't preventDefault for Tab key - we still want to lose focus
        if (!keycode.isEventKey(event, 'Tab')) {
          event.preventDefault();
          // Set focus back to the menu button's button
          this.menuButton_.focus();
        }
      }
    }

    /**
     * Put the current `MenuButton` into a pressed state.
     */
    pressButton() {
      if (this.enabled_) {
        this.buttonPressed_ = true;
        this.menu.show();
        this.menu.lockShowing();
        this.menuButton_.el_.setAttribute('aria-expanded', 'true');

        // set the focus into the submenu, except on iOS where it is resulting in
        // undesired scrolling behavior when the player is in an iframe
        if (IS_IOS && isInFrame()) {
          // Return early so that the menu isn't focused
          return;
        }
        this.menu.focus();
      }
    }

    /**
     * Take the current `MenuButton` out of a pressed state.
     */
    unpressButton() {
      if (this.enabled_) {
        this.buttonPressed_ = false;
        this.menu.unlockShowing();
        this.menu.hide();
        this.menuButton_.el_.setAttribute('aria-expanded', 'false');
      }
    }

    /**
     * Disable the `MenuButton`. Don't allow it to be clicked.
     */
    disable() {
      this.unpressButton();
      this.enabled_ = false;
      this.addClass('vjs-disabled');
      this.menuButton_.disable();
    }

    /**
     * Enable the `MenuButton`. Allow it to be clicked.
     */
    enable() {
      this.enabled_ = true;
      this.removeClass('vjs-disabled');
      this.menuButton_.enable();
    }
  }
  Component.registerComponent('MenuButton', MenuButton);

  /**
   * @file track-button.js
   */

  /**
   * The base class for buttons that toggle specific  track types (e.g. subtitles).
   *
   * @extends MenuButton
   */
  class TrackButton extends MenuButton {
    /**
     * Creates an instance of this class.
     *
     * @param { import('./player').default } player
     *        The `Player` that this class should be attached to.
     *
     * @param {Object} [options]
     *        The key/value store of player options.
     */
    constructor(player, options) {
      const tracks = options.tracks;
      super(player, options);
      if (this.items.length <= 1) {
        this.hide();
      }
      if (!tracks) {
        return;
      }
      const updateHandler = bind_(this, this.update);
      tracks.addEventListener('removetrack', updateHandler);
      tracks.addEventListener('addtrack', updateHandler);
      tracks.addEventListener('labelchange', updateHandler);
      this.player_.on('ready', updateHandler);
      this.player_.on('dispose', function () {
        tracks.removeEventListener('removetrack', updateHandler);
        tracks.removeEventListener('addtrack', updateHandler);
        tracks.removeEventListener('labelchange', updateHandler);
      });
    }
  }
  Component.registerComponent('TrackButton', TrackButton);

  /**
   * @file menu-keys.js
   */

  /**
    * All keys used for operation of a menu (`MenuButton`, `Menu`, and `MenuItem`)
    * Note that 'Enter' and 'Space' are not included here (otherwise they would
    * prevent the `MenuButton` and `MenuItem` from being keyboard-clickable)
   *
    * @typedef MenuKeys
    * @array
    */
  const MenuKeys = ['Tab', 'Esc', 'Up', 'Down', 'Right', 'Left'];

  /**
   * @file menu-item.js
   */

  /**
   * The component for a menu item. `<li>`
   *
   * @extends ClickableComponent
   */
  class MenuItem extends ClickableComponent {
    /**
     * Creates an instance of the this class.
     *
     * @param { import('../player').default } player
     *        The `Player` that this class should be attached to.
     *
     * @param {Object} [options={}]
     *        The key/value store of player options.
     *
     */
    constructor(player, options) {
      super(player, options);
      this.selectable = options.selectable;
      this.isSelected_ = options.selected || false;
      this.multiSelectable = options.multiSelectable;
      this.selected(this.isSelected_);
      if (this.selectable) {
        if (this.multiSelectable) {
          this.el_.setAttribute('role', 'menuitemcheckbox');
        } else {
          this.el_.setAttribute('role', 'menuitemradio');
        }
      } else {
        this.el_.setAttribute('role', 'menuitem');
      }
    }

    /**
     * Create the `MenuItem's DOM element
     *
     * @param {string} [type=li]
     *        Element's node type, not actually used, always set to `li`.
     *
     * @param {Object} [props={}]
     *        An object of properties that should be set on the element
     *
     * @param {Object} [attrs={}]
     *        An object of attributes that should be set on the element
     *
     * @return {Element}
     *         The element that gets created.
     */
    createEl(type, props, attrs) {
      // The control is textual, not just an icon
      this.nonIconControl = true;
      const el = super.createEl('li', Object.assign({
        className: 'vjs-menu-item',
        tabIndex: -1
      }, props), attrs);

      // swap icon with menu item text.
      const menuItemEl = createEl('span', {
        className: 'vjs-menu-item-text',
        textContent: this.localize(this.options_.label)
      });

      // If using SVG icons, the element with vjs-icon-placeholder will be added separately.
      if (this.player_.options_.experimentalSvgIcons) {
        el.appendChild(menuItemEl);
      } else {
        el.replaceChild(menuItemEl, el.querySelector('.vjs-icon-placeholder'));
      }
      return el;
    }

    /**
     * Ignore keys which are used by the menu, but pass any other ones up. See
     * {@link ClickableComponent#handleKeyDown} for instances where this is called.
     *
     * @param {Event} event
     *        The `keydown` event that caused this function to be called.
     *
     * @listens keydown
     */
    handleKeyDown(event) {
      if (!MenuKeys.some(key => keycode.isEventKey(event, key))) {
        // Pass keydown handling up for unused keys
        super.handleKeyDown(event);
      }
    }

    /**
     * Any click on a `MenuItem` puts it into the selected state.
     * See {@link ClickableComponent#handleClick} for instances where this is called.
     *
     * @param {Event} event
     *        The `keydown`, `tap`, or `click` event that caused this function to be
     *        called.
     *
     * @listens tap
     * @listens click
     */
    handleClick(event) {
      this.selected(true);
    }

    /**
     * Set the state for this menu item as selected or not.
     *
     * @param {boolean} selected
     *        if the menu item is selected or not
     */
    selected(selected) {
      if (this.selectable) {
        if (selected) {
          this.addClass('vjs-selected');
          this.el_.setAttribute('aria-checked', 'true');
          // aria-checked isn't fully supported by browsers/screen readers,
          // so indicate selected state to screen reader in the control text.
          this.controlText(', selected');
          this.isSelected_ = true;
        } else {
          this.removeClass('vjs-selected');
          this.el_.setAttribute('aria-checked', 'false');
          // Indicate un-selected state to screen reader
          this.controlText('');
          this.isSelected_ = false;
        }
      }
    }
  }
  Component.registerComponent('MenuItem', MenuItem);

  /**
   * @file text-track-menu-item.js
   */

  /**
   * The specific menu item type for selecting a language within a text track kind
   *
   * @extends MenuItem
   */
  class TextTrackMenuItem extends MenuItem {
    /**
     * Creates an instance of this class.
     *
     * @param { import('../../player').default } player
     *        The `Player` that this class should be attached to.
     *
     * @param {Object} [options]
     *        The key/value store of player options.
     */
    constructor(player, options) {
      const track = options.track;
      const tracks = player.textTracks();

      // Modify options for parent MenuItem class's init.
      options.label = track.label || track.language || 'Unknown';
      options.selected = track.mode === 'showing';
      super(player, options);
      this.track = track;
      // Determine the relevant kind(s) of tracks for this component and filter
      // out empty kinds.
      this.kinds = (options.kinds || [options.kind || this.track.kind]).filter(Boolean);
      const changeHandler = (...args) => {
        this.handleTracksChange.apply(this, args);
      };
      const selectedLanguageChangeHandler = (...args) => {
        this.handleSelectedLanguageChange.apply(this, args);
      };
      player.on(['loadstart', 'texttrackchange'], changeHandler);
      tracks.addEventListener('change', changeHandler);
      tracks.addEventListener('selectedlanguagechange', selectedLanguageChangeHandler);
      this.on('dispose', function () {
        player.off(['loadstart', 'texttrackchange'], changeHandler);
        tracks.removeEventListener('change', changeHandler);
        tracks.removeEventListener('selectedlanguagechange', selectedLanguageChangeHandler);
      });

      // iOS7 doesn't dispatch change events to TextTrackLists when an
      // associated track's mode changes. Without something like
      // Object.observe() (also not present on iOS7), it's not
      // possible to detect changes to the mode attribute and polyfill
      // the change event. As a poor substitute, we manually dispatch
      // change events whenever the controls modify the mode.
      if (tracks.onchange === undefined) {
        let event;
        this.on(['tap', 'click'], function () {
          if (typeof window.Event !== 'object') {
            // Android 2.3 throws an Illegal Constructor error for window.Event
            try {
              event = new window.Event('change');
            } catch (err) {
              // continue regardless of error
            }
          }
          if (!event) {
            event = document.createEvent('Event');
            event.initEvent('change', true, true);
          }
          tracks.dispatchEvent(event);
        });
      }

      // set the default state based on current tracks
      this.handleTracksChange();
    }

    /**
     * This gets called when an `TextTrackMenuItem` is "clicked". See
     * {@link ClickableComponent} for more detailed information on what a click can be.
     *
     * @param {Event} event
     *        The `keydown`, `tap`, or `click` event that caused this function to be
     *        called.
     *
     * @listens tap
     * @listens click
     */
    handleClick(event) {
      const referenceTrack = this.track;
      const tracks = this.player_.textTracks();
      super.handleClick(event);
      if (!tracks) {
        return;
      }
      for (let i = 0; i < tracks.length; i++) {
        const track = tracks[i];

        // If the track from the text tracks list is not of the right kind,
        // skip it. We do not want to affect tracks of incompatible kind(s).
        if (this.kinds.indexOf(track.kind) === -1) {
          continue;
        }

        // If this text track is the component's track and it is not showing,
        // set it to showing.
        if (track === referenceTrack) {
          if (track.mode !== 'showing') {
            track.mode = 'showing';
          }

          // If this text track is not the component's track and it is not
          // disabled, set it to disabled.
        } else if (track.mode !== 'disabled') {
          track.mode = 'disabled';
        }
      }
    }

    /**
     * Handle text track list change
     *
     * @param {Event} event
     *        The `change` event that caused this function to be called.
     *
     * @listens TextTrackList#change
     */
    handleTracksChange(event) {
      const shouldBeSelected = this.track.mode === 'showing';

      // Prevent redundant selected() calls because they may cause
      // screen readers to read the appended control text unnecessarily
      if (shouldBeSelected !== this.isSelected_) {
        this.selected(shouldBeSelected);
      }
    }
    handleSelectedLanguageChange(event) {
      if (this.track.mode === 'showing') {
        const selectedLanguage = this.player_.cache_.selectedLanguage;

        // Don't replace the kind of track across the same language
        if (selectedLanguage && selectedLanguage.enabled && selectedLanguage.language === this.track.language && selectedLanguage.kind !== this.track.kind) {
          return;
        }
        this.player_.cache_.selectedLanguage = {
          enabled: true,
          language: this.track.language,
          kind: this.track.kind
        };
      }
    }
    dispose() {
      // remove reference to track object on dispose
      this.track = null;
      super.dispose();
    }
  }
  Component.registerComponent('TextTrackMenuItem', TextTrackMenuItem);

  /**
   * @file off-text-track-menu-item.js
   */

  /**
   * A special menu item for turning of a specific type of text track
   *
   * @extends TextTrackMenuItem
   */
  class OffTextTrackMenuItem extends TextTrackMenuItem {
    /**
     * Creates an instance of this class.
     *
     * @param { import('../../player').default } player
     *        The `Player` that this class should be attached to.
     *
     * @param {Object} [options]
     *        The key/value store of player options.
     */
    constructor(player, options) {
      // Create pseudo track info
      // Requires options['kind']
      options.track = {
        player,
        // it is no longer necessary to store `kind` or `kinds` on the track itself
        // since they are now stored in the `kinds` property of all instances of
        // TextTrackMenuItem, but this will remain for backwards compatibility
        kind: options.kind,
        kinds: options.kinds,
        default: false,
        mode: 'disabled'
      };
      if (!options.kinds) {
        options.kinds = [options.kind];
      }
      if (options.label) {
        options.track.label = options.label;
      } else {
        options.track.label = options.kinds.join(' and ') + ' off';
      }

      // MenuItem is selectable
      options.selectable = true;
      // MenuItem is NOT multiSelectable (i.e. only one can be marked "selected" at a time)
      options.multiSelectable = false;
      super(player, options);
    }

    /**
     * Handle text track change
     *
     * @param {Event} event
     *        The event that caused this function to run
     */
    handleTracksChange(event) {
      const tracks = this.player().textTracks();
      let shouldBeSelected = true;
      for (let i = 0, l = tracks.length; i < l; i++) {
        const track = tracks[i];
        if (this.options_.kinds.indexOf(track.kind) > -1 && track.mode === 'showing') {
          shouldBeSelected = false;
          break;
        }
      }

      // Prevent redundant selected() calls because they may cause
      // screen readers to read the appended control text unnecessarily
      if (shouldBeSelected !== this.isSelected_) {
        this.selected(shouldBeSelected);
      }
    }
    handleSelectedLanguageChange(event) {
      const tracks = this.player().textTracks();
      let allHidden = true;
      for (let i = 0, l = tracks.length; i < l; i++) {
        const track = tracks[i];
        if (['captions', 'descriptions', 'subtitles'].indexOf(track.kind) > -1 && track.mode === 'showing') {
          allHidden = false;
          break;
        }
      }
      if (allHidden) {
        this.player_.cache_.selectedLanguage = {
          enabled: false
        };
      }
    }

    /**
     * Update control text and label on languagechange
     */
    handleLanguagechange() {
      this.$('.vjs-menu-item-text').textContent = this.player_.localize(this.options_.label);
      super.handleLanguagechange();
    }
  }
  Component.registerComponent('OffTextTrackMenuItem', OffTextTrackMenuItem);

  /**
   * @file text-track-button.js
   */

  /**
   * The base class for buttons that toggle specific text track types (e.g. subtitles)
   *
   * @extends MenuButton
   */
  class TextTrackButton extends TrackButton {
    /**
     * Creates an instance of this class.
     *
     * @param { import('../../player').default } player
     *        The `Player` that this class should be attached to.
     *
     * @param {Object} [options={}]
     *        The key/value store of player options.
     */
    constructor(player, options = {}) {
      options.tracks = player.textTracks();
      super(player, options);
    }

    /**
     * Create a menu item for each text track
     *
     * @param {TextTrackMenuItem[]} [items=[]]
     *        Existing array of items to use during creation
     *
     * @return {TextTrackMenuItem[]}
     *         Array of menu items that were created
     */
    createItems(items = [], TrackMenuItem = TextTrackMenuItem) {
      // Label is an override for the [track] off label
      // USed to localise captions/subtitles
      let label;
      if (this.label_) {
        label = `${this.label_} off`;
      }
      // Add an OFF menu item to turn all tracks off
      items.push(new OffTextTrackMenuItem(this.player_, {
        kinds: this.kinds_,
        kind: this.kind_,
        label
      }));
      this.hideThreshold_ += 1;
      const tracks = this.player_.textTracks();
      if (!Array.isArray(this.kinds_)) {
        this.kinds_ = [this.kind_];
      }
      for (let i = 0; i < tracks.length; i++) {
        const track = tracks[i];

        // only add tracks that are of an appropriate kind and have a label
        if (this.kinds_.indexOf(track.kind) > -1) {
          const item = new TrackMenuItem(this.player_, {
            track,
            kinds: this.kinds_,
            kind: this.kind_,
            // MenuItem is selectable
            selectable: true,
            // MenuItem is NOT multiSelectable (i.e. only one can be marked "selected" at a time)
            multiSelectable: false
          });
          item.addClass(`vjs-${track.kind}-menu-item`);
          items.push(item);
        }
      }
      return items;
    }
  }
  Component.registerComponent('TextTrackButton', TextTrackButton);

  /**
   * @file chapters-track-menu-item.js
   */

  /**
   * The chapter track menu item
   *
   * @extends MenuItem
   */
  class ChaptersTrackMenuItem extends MenuItem {
    /**
     * Creates an instance of this class.
     *
     * @param { import('../../player').default } player
     *        The `Player` that this class should be attached to.
     *
     * @param {Object} [options]
     *        The key/value store of player options.
     */
    constructor(player, options) {
      const track = options.track;
      const cue = options.cue;
      const currentTime = player.currentTime();

      // Modify options for parent MenuItem class's init.
      options.selectable = true;
      options.multiSelectable = false;
      options.label = cue.text;
      options.selected = cue.startTime <= currentTime && currentTime < cue.endTime;
      super(player, options);
      this.track = track;
      this.cue = cue;
    }

    /**
     * This gets called when an `ChaptersTrackMenuItem` is "clicked". See
     * {@link ClickableComponent} for more detailed information on what a click can be.
     *
     * @param {Event} [event]
     *        The `keydown`, `tap`, or `click` event that caused this function to be
     *        called.
     *
     * @listens tap
     * @listens click
     */
    handleClick(event) {
      super.handleClick();
      this.player_.currentTime(this.cue.startTime);
    }
  }
  Component.registerComponent('ChaptersTrackMenuItem', ChaptersTrackMenuItem);

  /**
   * @file chapters-button.js
   */

  /**
   * The button component for toggling and selecting chapters
   * Chapters act much differently than other text tracks
   * Cues are navigation vs. other tracks of alternative languages
   *
   * @extends TextTrackButton
   */
  class ChaptersButton extends TextTrackButton {
    /**
     * Creates an instance of this class.
     *
     * @param { import('../../player').default } player
     *        The `Player` that this class should be attached to.
     *
     * @param {Object} [options]
     *        The key/value store of player options.
     *
     * @param {Function} [ready]
     *        The function to call when this function is ready.
     */
    constructor(player, options, ready) {
      super(player, options, ready);
      this.setIcon('chapters');
      this.selectCurrentItem_ = () => {
        this.items.forEach(item => {
          item.selected(this.track_.activeCues[0] === item.cue);
        });
      };
    }

    /**
     * Builds the default DOM `className`.
     *
     * @return {string}
     *         The DOM `className` for this object.
     */
    buildCSSClass() {
      return `vjs-chapters-button ${super.buildCSSClass()}`;
    }
    buildWrapperCSSClass() {
      return `vjs-chapters-button ${super.buildWrapperCSSClass()}`;
    }

    /**
     * Update the menu based on the current state of its items.
     *
     * @param {Event} [event]
     *        An event that triggered this function to run.
     *
     * @listens TextTrackList#addtrack
     * @listens TextTrackList#removetrack
     * @listens TextTrackList#change
     */
    update(event) {
      if (event && event.track && event.track.kind !== 'chapters') {
        return;
      }
      const track = this.findChaptersTrack();
      if (track !== this.track_) {
        this.setTrack(track);
        super.update();
      } else if (!this.items || track && track.cues && track.cues.length !== this.items.length) {
        // Update the menu initially or if the number of cues has changed since set
        super.update();
      }
    }

    /**
     * Set the currently selected track for the chapters button.
     *
     * @param {TextTrack} track
     *        The new track to select. Nothing will change if this is the currently selected
     *        track.
     */
    setTrack(track) {
      if (this.track_ === track) {
        return;
      }
      if (!this.updateHandler_) {
        this.updateHandler_ = this.update.bind(this);
      }

      // here this.track_ refers to the old track instance
      if (this.track_) {
        const remoteTextTrackEl = this.player_.remoteTextTrackEls().getTrackElementByTrack_(this.track_);
        if (remoteTextTrackEl) {
          remoteTextTrackEl.removeEventListener('load', this.updateHandler_);
        }
        this.track_.removeEventListener('cuechange', this.selectCurrentItem_);
        this.track_ = null;
      }
      this.track_ = track;

      // here this.track_ refers to the new track instance
      if (this.track_) {
        this.track_.mode = 'hidden';
        const remoteTextTrackEl = this.player_.remoteTextTrackEls().getTrackElementByTrack_(this.track_);
        if (remoteTextTrackEl) {
          remoteTextTrackEl.addEventListener('load', this.updateHandler_);
        }
        this.track_.addEventListener('cuechange', this.selectCurrentItem_);
      }
    }

    /**
     * Find the track object that is currently in use by this ChaptersButton
     *
     * @return {TextTrack|undefined}
     *         The current track or undefined if none was found.
     */
    findChaptersTrack() {
      const tracks = this.player_.textTracks() || [];
      for (let i = tracks.length - 1; i >= 0; i--) {
        // We will always choose the last track as our chaptersTrack
        const track = tracks[i];
        if (track.kind === this.kind_) {
          return track;
        }
      }
    }

    /**
     * Get the caption for the ChaptersButton based on the track label. This will also
     * use the current tracks localized kind as a fallback if a label does not exist.
     *
     * @return {string}
     *         The tracks current label or the localized track kind.
     */
    getMenuCaption() {
      if (this.track_ && this.track_.label) {
        return this.track_.label;
      }
      return this.localize(toTitleCase(this.kind_));
    }

    /**
     * Create menu from chapter track
     *
     * @return { import('../../menu/menu').default }
     *         New menu for the chapter buttons
     */
    createMenu() {
      this.options_.title = this.getMenuCaption();
      return super.createMenu();
    }

    /**
     * Create a menu item for each text track
     *
     * @return  { import('./text-track-menu-item').default[] }
     *         Array of menu items
     */
    createItems() {
      const items = [];
      if (!this.track_) {
        return items;
      }
      const cues = this.track_.cues;
      if (!cues) {
        return items;
      }
      for (let i = 0, l = cues.length; i < l; i++) {
        const cue = cues[i];
        const mi = new ChaptersTrackMenuItem(this.player_, {
          track: this.track_,
          cue
        });
        items.push(mi);
      }
      return items;
    }
  }

  /**
   * `kind` of TextTrack to look for to associate it with this menu.
   *
   * @type {string}
   * @private
   */
  ChaptersButton.prototype.kind_ = 'chapters';

  /**
   * The text that should display over the `ChaptersButton`s controls. Added for localization.
   *
   * @type {string}
   * @protected
   */
  ChaptersButton.prototype.controlText_ = 'Chapters';
  Component.registerComponent('ChaptersButton', ChaptersButton);

  /**
   * @file descriptions-button.js
   */

  /**
   * The button component for toggling and selecting descriptions
   *
   * @extends TextTrackButton
   */
  class DescriptionsButton extends TextTrackButton {
    /**
     * Creates an instance of this class.
     *
     * @param { import('../../player').default } player
     *        The `Player` that this class should be attached to.
     *
     * @param {Object} [options]
     *        The key/value store of player options.
     *
     * @param {Function} [ready]
     *        The function to call when this component is ready.
     */
    constructor(player, options, ready) {
      super(player, options, ready);
      this.setIcon('audio-description');
      const tracks = player.textTracks();
      const changeHandler = bind_(this, this.handleTracksChange);
      tracks.addEventListener('change', changeHandler);
      this.on('dispose', function () {
        tracks.removeEventListener('change', changeHandler);
      });
    }

    /**
     * Handle text track change
     *
     * @param {Event} event
     *        The event that caused this function to run
     *
     * @listens TextTrackList#change
     */
    handleTracksChange(event) {
      const tracks = this.player().textTracks();
      let disabled = false;

      // Check whether a track of a different kind is showing
      for (let i = 0, l = tracks.length; i < l; i++) {
        const track = tracks[i];
        if (track.kind !== this.kind_ && track.mode === 'showing') {
          disabled = true;
          break;
        }
      }

      // If another track is showing, disable this menu button
      if (disabled) {
        this.disable();
      } else {
        this.enable();
      }
    }

    /**
     * Builds the default DOM `className`.
     *
     * @return {string}
     *         The DOM `className` for this object.
     */
    buildCSSClass() {
      return `vjs-descriptions-button ${super.buildCSSClass()}`;
    }
    buildWrapperCSSClass() {
      return `vjs-descriptions-button ${super.buildWrapperCSSClass()}`;
    }
  }

  /**
   * `kind` of TextTrack to look for to associate it with this menu.
   *
   * @type {string}
   * @private
   */
  DescriptionsButton.prototype.kind_ = 'descriptions';

  /**
   * The text that should display over the `DescriptionsButton`s controls. Added for localization.
   *
   * @type {string}
   * @protected
   */
  DescriptionsButton.prototype.controlText_ = 'Descriptions';
  Component.registerComponent('DescriptionsButton', DescriptionsButton);

  /**
   * @file subtitles-button.js
   */

  /**
   * The button component for toggling and selecting subtitles
   *
   * @extends TextTrackButton
   */
  class SubtitlesButton extends TextTrackButton {
    /**
     * Creates an instance of this class.
     *
     * @param { import('../../player').default } player
     *        The `Player` that this class should be attached to.
     *
     * @param {Object} [options]
     *        The key/value store of player options.
     *
     * @param {Function} [ready]
     *        The function to call when this component is ready.
     */
    constructor(player, options, ready) {
      super(player, options, ready);
      this.setIcon('subtitles');
    }

    /**
     * Builds the default DOM `className`.
     *
     * @return {string}
     *         The DOM `className` for this object.
     */
    buildCSSClass() {
      return `vjs-subtitles-button ${super.buildCSSClass()}`;
    }
    buildWrapperCSSClass() {
      return `vjs-subtitles-button ${super.buildWrapperCSSClass()}`;
    }
  }

  /**
   * `kind` of TextTrack to look for to associate it with this menu.
   *
   * @type {string}
   * @private
   */
  SubtitlesButton.prototype.kind_ = 'subtitles';

  /**
   * The text that should display over the `SubtitlesButton`s controls. Added for localization.
   *
   * @type {string}
   * @protected
   */
  SubtitlesButton.prototype.controlText_ = 'Subtitles';
  Component.registerComponent('SubtitlesButton', SubtitlesButton);

  /**
   * @file caption-settings-menu-item.js
   */

  /**
   * The menu item for caption track settings menu
   *
   * @extends TextTrackMenuItem
   */
  class CaptionSettingsMenuItem extends TextTrackMenuItem {
    /**
     * Creates an instance of this class.
     *
     * @param { import('../../player').default } player
     *        The `Player` that this class should be attached to.
     *
     * @param {Object} [options]
     *        The key/value store of player options.
     */
    constructor(player, options) {
      options.track = {
        player,
        kind: options.kind,
        label: options.kind + ' settings',
        selectable: false,
        default: false,
        mode: 'disabled'
      };

      // CaptionSettingsMenuItem has no concept of 'selected'
      options.selectable = false;
      options.name = 'CaptionSettingsMenuItem';
      super(player, options);
      this.addClass('vjs-texttrack-settings');
      this.controlText(', opens ' + options.kind + ' settings dialog');
    }

    /**
     * This gets called when an `CaptionSettingsMenuItem` is "clicked". See
     * {@link ClickableComponent} for more detailed information on what a click can be.
     *
     * @param {Event} [event]
     *        The `keydown`, `tap`, or `click` event that caused this function to be
     *        called.
     *
     * @listens tap
     * @listens click
     */
    handleClick(event) {
      this.player().getChild('textTrackSettings').open();
    }

    /**
     * Update control text and label on languagechange
     */
    handleLanguagechange() {
      this.$('.vjs-menu-item-text').textContent = this.player_.localize(this.options_.kind + ' settings');
      super.handleLanguagechange();
    }
  }
  Component.registerComponent('CaptionSettingsMenuItem', CaptionSettingsMenuItem);

  /**
   * @file captions-button.js
   */

  /**
   * The button component for toggling and selecting captions
   *
   * @extends TextTrackButton
   */
  class CaptionsButton extends TextTrackButton {
    /**
     * Creates an instance of this class.
     *
     * @param { import('../../player').default } player
     *        The `Player` that this class should be attached to.
     *
     * @param {Object} [options]
     *        The key/value store of player options.
     *
     * @param {Function} [ready]
     *        The function to call when this component is ready.
     */
    constructor(player, options, ready) {
      super(player, options, ready);
      this.setIcon('captions');
    }

    /**
     * Builds the default DOM `className`.
     *
     * @return {string}
     *         The DOM `className` for this object.
     */
    buildCSSClass() {
      return `vjs-captions-button ${super.buildCSSClass()}`;
    }
    buildWrapperCSSClass() {
      return `vjs-captions-button ${super.buildWrapperCSSClass()}`;
    }

    /**
     * Create caption menu items
     *
     * @return {CaptionSettingsMenuItem[]}
     *         The array of current menu items.
     */
    createItems() {
      const items = [];
      if (!(this.player().tech_ && this.player().tech_.featuresNativeTextTracks) && this.player().getChild('textTrackSettings')) {
        items.push(new CaptionSettingsMenuItem(this.player_, {
          kind: this.kind_
        }));
        this.hideThreshold_ += 1;
      }
      return super.createItems(items);
    }
  }

  /**
   * `kind` of TextTrack to look for to associate it with this menu.
   *
   * @type {string}
   * @private
   */
  CaptionsButton.prototype.kind_ = 'captions';

  /**
   * The text that should display over the `CaptionsButton`s controls. Added for localization.
   *
   * @type {string}
   * @protected
   */
  CaptionsButton.prototype.controlText_ = 'Captions';
  Component.registerComponent('CaptionsButton', CaptionsButton);

  /**
   * @file subs-caps-menu-item.js
   */

  /**
   * SubsCapsMenuItem has an [cc] icon to distinguish captions from subtitles
   * in the SubsCapsMenu.
   *
   * @extends TextTrackMenuItem
   */
  class SubsCapsMenuItem extends TextTrackMenuItem {
    createEl(type, props, attrs) {
      const el = super.createEl(type, props, attrs);
      const parentSpan = el.querySelector('.vjs-menu-item-text');
      if (this.options_.track.kind === 'captions') {
        if (this.player_.options_.experimentalSvgIcons) {
          this.setIcon('captions', el);
        } else {
          parentSpan.appendChild(createEl('span', {
            className: 'vjs-icon-placeholder'
          }, {
            'aria-hidden': true
          }));
        }
        parentSpan.appendChild(createEl('span', {
          className: 'vjs-control-text',
          // space added as the text will visually flow with the
          // label
          textContent: ` ${this.localize('Captions')}`
        }));
      }
      return el;
    }
  }
  Component.registerComponent('SubsCapsMenuItem', SubsCapsMenuItem);

  /**
   * @file sub-caps-button.js
   */

  /**
   * The button component for toggling and selecting captions and/or subtitles
   *
   * @extends TextTrackButton
   */
  class SubsCapsButton extends TextTrackButton {
    /**
     * Creates an instance of this class.
     *
     * @param { import('../../player').default } player
     *        The `Player` that this class should be attached to.
     *
     * @param {Object} [options]
     *        The key/value store of player options.
     *
     * @param {Function} [ready]
     *        The function to call when this component is ready.
     */
    constructor(player, options = {}) {
      super(player, options);

      // Although North America uses "captions" in most cases for
      // "captions and subtitles" other locales use "subtitles"
      this.label_ = 'subtitles';
      this.setIcon('subtitles');
      if (['en', 'en-us', 'en-ca', 'fr-ca'].indexOf(this.player_.language_) > -1) {
        this.label_ = 'captions';
        this.setIcon('captions');
      }
      this.menuButton_.controlText(toTitleCase(this.label_));
    }

    /**
     * Builds the default DOM `className`.
     *
     * @return {string}
     *         The DOM `className` for this object.
     */
    buildCSSClass() {
      return `vjs-subs-caps-button ${super.buildCSSClass()}`;
    }
    buildWrapperCSSClass() {
      return `vjs-subs-caps-button ${super.buildWrapperCSSClass()}`;
    }

    /**
     * Create caption/subtitles menu items
     *
     * @return {CaptionSettingsMenuItem[]}
     *         The array of current menu items.
     */
    createItems() {
      let items = [];
      if (!(this.player().tech_ && this.player().tech_.featuresNativeTextTracks) && this.player().getChild('textTrackSettings')) {
        items.push(new CaptionSettingsMenuItem(this.player_, {
          kind: this.label_
        }));
        this.hideThreshold_ += 1;
      }
      items = super.createItems(items, SubsCapsMenuItem);
      return items;
    }
  }

  /**
   * `kind`s of TextTrack to look for to associate it with this menu.
   *
   * @type {array}
   * @private
   */
  SubsCapsButton.prototype.kinds_ = ['captions', 'subtitles'];

  /**
   * The text that should display over the `SubsCapsButton`s controls.
   *
   *
   * @type {string}
   * @protected
   */
  SubsCapsButton.prototype.controlText_ = 'Subtitles';
  Component.registerComponent('SubsCapsButton', SubsCapsButton);

  /**
   * @file audio-track-menu-item.js
   */

  /**
   * An {@link AudioTrack} {@link MenuItem}
   *
   * @extends MenuItem
   */
  class AudioTrackMenuItem extends MenuItem {
    /**
     * Creates an instance of this class.
     *
     * @param { import('../../player').default } player
     *        The `Player` that this class should be attached to.
     *
     * @param {Object} [options]
     *        The key/value store of player options.
     */
    constructor(player, options) {
      const track = options.track;
      const tracks = player.audioTracks();

      // Modify options for parent MenuItem class's init.
      options.label = track.label || track.language || 'Unknown';
      options.selected = track.enabled;
      super(player, options);
      this.track = track;
      this.addClass(`vjs-${track.kind}-menu-item`);
      const changeHandler = (...args) => {
        this.handleTracksChange.apply(this, args);
      };
      tracks.addEventListener('change', changeHandler);
      this.on('dispose', () => {
        tracks.removeEventListener('change', changeHandler);
      });
    }
    createEl(type, props, attrs) {
      const el = super.createEl(type, props, attrs);
      const parentSpan = el.querySelector('.vjs-menu-item-text');
      if (['main-desc', 'description'].indexOf(this.options_.track.kind) >= 0) {
        parentSpan.appendChild(createEl('span', {
          className: 'vjs-icon-placeholder'
        }, {
          'aria-hidden': true
        }));
        parentSpan.appendChild(createEl('span', {
          className: 'vjs-control-text',
          textContent: ' ' + this.localize('Descriptions')
        }));
      }
      return el;
    }

    /**
     * This gets called when an `AudioTrackMenuItem is "clicked". See {@link ClickableComponent}
     * for more detailed information on what a click can be.
     *
     * @param {Event} [event]
     *        The `keydown`, `tap`, or `click` event that caused this function to be
     *        called.
     *
     * @listens tap
     * @listens click
     */
    handleClick(event) {
      super.handleClick(event);

      // the audio track list will automatically toggle other tracks
      // off for us.
      this.track.enabled = true;

      // when native audio tracks are used, we want to make sure that other tracks are turned off
      if (this.player_.tech_.featuresNativeAudioTracks) {
        const tracks = this.player_.audioTracks();
        for (let i = 0; i < tracks.length; i++) {
          const track = tracks[i];

          // skip the current track since we enabled it above
          if (track === this.track) {
            continue;
          }
          track.enabled = track === this.track;
        }
      }
    }

    /**
     * Handle any {@link AudioTrack} change.
     *
     * @param {Event} [event]
     *        The {@link AudioTrackList#change} event that caused this to run.
     *
     * @listens AudioTrackList#change
     */
    handleTracksChange(event) {
      this.selected(this.track.enabled);
    }
  }
  Component.registerComponent('AudioTrackMenuItem', AudioTrackMenuItem);

  /**
   * @file audio-track-button.js
   */

  /**
   * The base class for buttons that toggle specific {@link AudioTrack} types.
   *
   * @extends TrackButton
   */
  class AudioTrackButton extends TrackButton {
    /**
     * Creates an instance of this class.
     *
     * @param {Player} player
     *        The `Player` that this class should be attached to.
     *
     * @param {Object} [options={}]
     *        The key/value store of player options.
     */
    constructor(player, options = {}) {
      options.tracks = player.audioTracks();
      super(player, options);
      this.setIcon('audio');
    }

    /**
     * Builds the default DOM `className`.
     *
     * @return {string}
     *         The DOM `className` for this object.
     */
    buildCSSClass() {
      return `vjs-audio-button ${super.buildCSSClass()}`;
    }
    buildWrapperCSSClass() {
      return `vjs-audio-button ${super.buildWrapperCSSClass()}`;
    }

    /**
     * Create a menu item for each audio track
     *
     * @param {AudioTrackMenuItem[]} [items=[]]
     *        An array of existing menu items to use.
     *
     * @return {AudioTrackMenuItem[]}
     *         An array of menu items
     */
    createItems(items = []) {
      // if there's only one audio track, there no point in showing it
      this.hideThreshold_ = 1;
      const tracks = this.player_.audioTracks();
      for (let i = 0; i < tracks.length; i++) {
        const track = tracks[i];
        items.push(new AudioTrackMenuItem(this.player_, {
          track,
          // MenuItem is selectable
          selectable: true,
          // MenuItem is NOT multiSelectable (i.e. only one can be marked "selected" at a time)
          multiSelectable: false
        }));
      }
      return items;
    }
  }

  /**
   * The text that should display over the `AudioTrackButton`s controls. Added for localization.
   *
   * @type {string}
   * @protected
   */
  AudioTrackButton.prototype.controlText_ = 'Audio Track';
  Component.registerComponent('AudioTrackButton', AudioTrackButton);

  /**
   * @file playback-rate-menu-item.js
   */

  /**
   * The specific menu item type for selecting a playback rate.
   *
   * @extends MenuItem
   */
  class PlaybackRateMenuItem extends MenuItem {
    /**
     * Creates an instance of this class.
     *
     * @param { import('../../player').default } player
     *        The `Player` that this class should be attached to.
     *
     * @param {Object} [options]
     *        The key/value store of player options.
     */
    constructor(player, options) {
      const label = options.rate;
      const rate = parseFloat(label, 10);

      // Modify options for parent MenuItem class's init.
      options.label = label;
      options.selected = rate === player.playbackRate();
      options.selectable = true;
      options.multiSelectable = false;
      super(player, options);
      this.label = label;
      this.rate = rate;
      this.on(player, 'ratechange', e => this.update(e));
    }

    /**
     * This gets called when an `PlaybackRateMenuItem` is "clicked". See
     * {@link ClickableComponent} for more detailed information on what a click can be.
     *
     * @param {Event} [event]
     *        The `keydown`, `tap`, or `click` event that caused this function to be
     *        called.
     *
     * @listens tap
     * @listens click
     */
    handleClick(event) {
      super.handleClick();
      this.player().playbackRate(this.rate);
    }

    /**
     * Update the PlaybackRateMenuItem when the playbackrate changes.
     *
     * @param {Event} [event]
     *        The `ratechange` event that caused this function to run.
     *
     * @listens Player#ratechange
     */
    update(event) {
      this.selected(this.player().playbackRate() === this.rate);
    }
  }

  /**
   * The text that should display over the `PlaybackRateMenuItem`s controls. Added for localization.
   *
   * @type {string}
   * @private
   */
  PlaybackRateMenuItem.prototype.contentElType = 'button';
  Component.registerComponent('PlaybackRateMenuItem', PlaybackRateMenuItem);

  /**
   * @file playback-rate-menu-button.js
   */

  /**
   * The component for controlling the playback rate.
   *
   * @extends MenuButton
   */
  class PlaybackRateMenuButton extends MenuButton {
    /**
     * Creates an instance of this class.
     *
     * @param { import('../../player').default } player
     *        The `Player` that this class should be attached to.
     *
     * @param {Object} [options]
     *        The key/value store of player options.
     */
    constructor(player, options) {
      super(player, options);
      this.menuButton_.el_.setAttribute('aria-describedby', this.labelElId_);
      this.updateVisibility();
      this.updateLabel();
      this.on(player, 'loadstart', e => this.updateVisibility(e));
      this.on(player, 'ratechange', e => this.updateLabel(e));
      this.on(player, 'playbackrateschange', e => this.handlePlaybackRateschange(e));
    }

    /**
     * Create the `Component`'s DOM element
     *
     * @return {Element}
     *         The element that was created.
     */
    createEl() {
      const el = super.createEl();
      this.labelElId_ = 'vjs-playback-rate-value-label-' + this.id_;
      this.labelEl_ = createEl('div', {
        className: 'vjs-playback-rate-value',
        id: this.labelElId_,
        textContent: '1x'
      });
      el.appendChild(this.labelEl_);
      return el;
    }
    dispose() {
      this.labelEl_ = null;
      super.dispose();
    }

    /**
     * Builds the default DOM `className`.
     *
     * @return {string}
     *         The DOM `className` for this object.
     */
    buildCSSClass() {
      return `vjs-playback-rate ${super.buildCSSClass()}`;
    }
    buildWrapperCSSClass() {
      return `vjs-playback-rate ${super.buildWrapperCSSClass()}`;
    }

    /**
     * Create the list of menu items. Specific to each subclass.
     *
     */
    createItems() {
      const rates = this.playbackRates();
      const items = [];
      for (let i = rates.length - 1; i >= 0; i--) {
        items.push(new PlaybackRateMenuItem(this.player(), {
          rate: rates[i] + 'x'
        }));
      }
      return items;
    }

    /**
     * On playbackrateschange, update the menu to account for the new items.
     *
     * @listens Player#playbackrateschange
     */
    handlePlaybackRateschange(event) {
      this.update();
    }

    /**
     * Get possible playback rates
     *
     * @return {Array}
     *         All possible playback rates
     */
    playbackRates() {
      const player = this.player();
      return player.playbackRates && player.playbackRates() || [];
    }

    /**
     * Get whether playback rates is supported by the tech
     * and an array of playback rates exists
     *
     * @return {boolean}
     *         Whether changing playback rate is supported
     */
    playbackRateSupported() {
      return this.player().tech_ && this.player().tech_.featuresPlaybackRate && this.playbackRates() && this.playbackRates().length > 0;
    }

    /**
     * Hide playback rate controls when they're no playback rate options to select
     *
     * @param {Event} [event]
     *        The event that caused this function to run.
     *
     * @listens Player#loadstart
     */
    updateVisibility(event) {
      if (this.playbackRateSupported()) {
        this.removeClass('vjs-hidden');
      } else {
        this.addClass('vjs-hidden');
      }
    }

    /**
     * Update button label when rate changed
     *
     * @param {Event} [event]
     *        The event that caused this function to run.
     *
     * @listens Player#ratechange
     */
    updateLabel(event) {
      if (this.playbackRateSupported()) {
        this.labelEl_.textContent = this.player().playbackRate() + 'x';
      }
    }
  }

  /**
   * The text that should display over the `PlaybackRateMenuButton`s controls.
   *
   * Added for localization.
   *
   * @type {string}
   * @protected
   */
  PlaybackRateMenuButton.prototype.controlText_ = 'Playback Rate';
  Component.registerComponent('PlaybackRateMenuButton', PlaybackRateMenuButton);

  /**
   * @file spacer.js
   */

  /**
   * Just an empty spacer element that can be used as an append point for plugins, etc.
   * Also can be used to create space between elements when necessary.
   *
   * @extends Component
   */
  class Spacer extends Component {
    /**
    * Builds the default DOM `className`.
    *
    * @return {string}
    *         The DOM `className` for this object.
    */
    buildCSSClass() {
      return `vjs-spacer ${super.buildCSSClass()}`;
    }

    /**
     * Create the `Component`'s DOM element
     *
     * @return {Element}
     *         The element that was created.
     */
    createEl(tag = 'div', props = {}, attributes = {}) {
      if (!props.className) {
        props.className = this.buildCSSClass();
      }
      return super.createEl(tag, props, attributes);
    }
  }
  Component.registerComponent('Spacer', Spacer);

  /**
   * @file custom-control-spacer.js
   */

  /**
   * Spacer specifically meant to be used as an insertion point for new plugins, etc.
   *
   * @extends Spacer
   */
  class CustomControlSpacer extends Spacer {
    /**
     * Builds the default DOM `className`.
     *
     * @return {string}
     *         The DOM `className` for this object.
     */
    buildCSSClass() {
      return `vjs-custom-control-spacer ${super.buildCSSClass()}`;
    }

    /**
     * Create the `Component`'s DOM element
     *
     * @return {Element}
     *         The element that was created.
     */
    createEl() {
      return super.createEl('div', {
        className: this.buildCSSClass(),
        // No-flex/table-cell mode requires there be some content
        // in the cell to fill the remaining space of the table.
        textContent: '\u00a0'
      });
    }
  }
  Component.registerComponent('CustomControlSpacer', CustomControlSpacer);

  /**
   * @file control-bar.js
   */

  /**
   * Container of main controls.
   *
   * @extends Component
   */
  class ControlBar extends Component {
    /**
     * Create the `Component`'s DOM element
     *
     * @return {Element}
     *         The element that was created.
     */
    createEl() {
      return super.createEl('div', {
        className: 'vjs-control-bar',
        dir: 'ltr'
      });
    }
  }

  /**
   * Default options for `ControlBar`
   *
   * @type {Object}
   * @private
   */
  ControlBar.prototype.options_ = {
    children: ['playToggle', 'skipBackward', 'skipForward', 'volumePanel', 'currentTimeDisplay', 'timeDivider', 'durationDisplay', 'progressControl', 'liveDisplay', 'seekToLive', 'remainingTimeDisplay', 'customControlSpacer', 'playbackRateMenuButton', 'chaptersButton', 'descriptionsButton', 'subsCapsButton', 'audioTrackButton', 'pictureInPictureToggle', 'fullscreenToggle']
  };
  Component.registerComponent('ControlBar', ControlBar);

  /**
   * @file error-display.js
   */

  /**
   * A display that indicates an error has occurred. This means that the video
   * is unplayable.
   *
   * @extends ModalDialog
   */
  class ErrorDisplay extends ModalDialog {
    /**
     * Creates an instance of this class.
     *
     * @param  { import('./player').default } player
     *         The `Player` that this class should be attached to.
     *
     * @param  {Object} [options]
     *         The key/value store of player options.
     */
    constructor(player, options) {
      super(player, options);
      this.on(player, 'error', e => this.open(e));
    }

    /**
     * Builds the default DOM `className`.
     *
     * @return {string}
     *         The DOM `className` for this object.
     *
     * @deprecated Since version 5.
     */
    buildCSSClass() {
      return `vjs-error-display ${super.buildCSSClass()}`;
    }

    /**
     * Gets the localized error message based on the `Player`s error.
     *
     * @return {string}
     *         The `Player`s error message localized or an empty string.
     */
    content() {
      const error = this.player().error();
      return error ? this.localize(error.message) : '';
    }
  }

  /**
   * The default options for an `ErrorDisplay`.
   *
   * @private
   */
  ErrorDisplay.prototype.options_ = Object.assign({}, ModalDialog.prototype.options_, {
    pauseOnOpen: false,
    fillAlways: true,
    temporary: false,
    uncloseable: true
  });
  Component.registerComponent('ErrorDisplay', ErrorDisplay);

  /**
   * @file text-track-settings.js
   */
  const LOCAL_STORAGE_KEY = 'vjs-text-track-settings';
  const COLOR_BLACK = ['#000', 'Black'];
  const COLOR_BLUE = ['#00F', 'Blue'];
  const COLOR_CYAN = ['#0FF', 'Cyan'];
  const COLOR_GREEN = ['#0F0', 'Green'];
  const COLOR_MAGENTA = ['#F0F', 'Magenta'];
  const COLOR_RED = ['#F00', 'Red'];
  const COLOR_WHITE = ['#FFF', 'White'];
  const COLOR_YELLOW = ['#FF0', 'Yellow'];
  const OPACITY_OPAQUE = ['1', 'Opaque'];
  const OPACITY_SEMI = ['0.5', 'Semi-Transparent'];
  const OPACITY_TRANS = ['0', 'Transparent'];

  // Configuration for the various <select> elements in the DOM of this component.
  //
  // Possible keys include:
  //
  // `default`:
  //   The default option index. Only needs to be provided if not zero.
  // `parser`:
  //   A function which is used to parse the value from the selected option in
  //   a customized way.
  // `selector`:
  //   The selector used to find the associated <select> element.
  const selectConfigs = {
    backgroundColor: {
      selector: '.vjs-bg-color > select',
      id: 'captions-background-color-%s',
      label: 'Color',
      options: [COLOR_BLACK, COLOR_WHITE, COLOR_RED, COLOR_GREEN, COLOR_BLUE, COLOR_YELLOW, COLOR_MAGENTA, COLOR_CYAN]
    },
    backgroundOpacity: {
      selector: '.vjs-bg-opacity > select',
      id: 'captions-background-opacity-%s',
      label: 'Opacity',
      options: [OPACITY_OPAQUE, OPACITY_SEMI, OPACITY_TRANS]
    },
    color: {
      selector: '.vjs-text-color > select',
      id: 'captions-foreground-color-%s',
      label: 'Color',
      options: [COLOR_WHITE, COLOR_BLACK, COLOR_RED, COLOR_GREEN, COLOR_BLUE, COLOR_YELLOW, COLOR_MAGENTA, COLOR_CYAN]
    },
    edgeStyle: {
      selector: '.vjs-edge-style > select',
      id: '%s',
      label: 'Text Edge Style',
      options: [['none', 'None'], ['raised', 'Raised'], ['depressed', 'Depressed'], ['uniform', 'Uniform'], ['dropshadow', 'Drop shadow']]
    },
    fontFamily: {
      selector: '.vjs-font-family > select',
      id: 'captions-font-family-%s',
      label: 'Font Family',
      options: [['proportionalSansSerif', 'Proportional Sans-Serif'], ['monospaceSansSerif', 'Monospace Sans-Serif'], ['proportionalSerif', 'Proportional Serif'], ['monospaceSerif', 'Monospace Serif'], ['casual', 'Casual'], ['script', 'Script'], ['small-caps', 'Small Caps']]
    },
    fontPercent: {
      selector: '.vjs-font-percent > select',
      id: 'captions-font-size-%s',
      label: 'Font Size',
      options: [['0.50', '50%'], ['0.75', '75%'], ['1.00', '100%'], ['1.25', '125%'], ['1.50', '150%'], ['1.75', '175%'], ['2.00', '200%'], ['3.00', '300%'], ['4.00', '400%']],
      default: 2,
      parser: v => v === '1.00' ? null : Number(v)
    },
    textOpacity: {
      selector: '.vjs-text-opacity > select',
      id: 'captions-foreground-opacity-%s',
      label: 'Opacity',
      options: [OPACITY_OPAQUE, OPACITY_SEMI]
    },
    // Options for this object are defined below.
    windowColor: {
      selector: '.vjs-window-color > select',
      id: 'captions-window-color-%s',
      label: 'Color'
    },
    // Options for this object are defined below.
    windowOpacity: {
      selector: '.vjs-window-opacity > select',
      id: 'captions-window-opacity-%s',
      label: 'Opacity',
      options: [OPACITY_TRANS, OPACITY_SEMI, OPACITY_OPAQUE]
    }
  };
  selectConfigs.windowColor.options = selectConfigs.backgroundColor.options;

  /**
   * Get the actual value of an option.
   *
   * @param  {string} value
   *         The value to get
   *
   * @param  {Function} [parser]
   *         Optional function to adjust the value.
   *
   * @return {*}
   *         - Will be `undefined` if no value exists
   *         - Will be `undefined` if the given value is "none".
   *         - Will be the actual value otherwise.
   *
   * @private
   */
  function parseOptionValue(value, parser) {
    if (parser) {
      value = parser(value);
    }
    if (value && value !== 'none') {
      return value;
    }
  }

  /**
   * Gets the value of the selected <option> element within a <select> element.
   *
   * @param  {Element} el
   *         the element to look in
   *
   * @param  {Function} [parser]
   *         Optional function to adjust the value.
   *
   * @return {*}
   *         - Will be `undefined` if no value exists
   *         - Will be `undefined` if the given value is "none".
   *         - Will be the actual value otherwise.
   *
   * @private
   */
  function getSelectedOptionValue(el, parser) {
    const value = el.options[el.options.selectedIndex].value;
    return parseOptionValue(value, parser);
  }

  /**
   * Sets the selected <option> element within a <select> element based on a
   * given value.
   *
   * @param {Element} el
   *        The element to look in.
   *
   * @param {string} value
   *        the property to look on.
   *
   * @param {Function} [parser]
   *        Optional function to adjust the value before comparing.
   *
   * @private
   */
  function setSelectedOption(el, value, parser) {
    if (!value) {
      return;
    }
    for (let i = 0; i < el.options.length; i++) {
      if (parseOptionValue(el.options[i].value, parser) === value) {
        el.selectedIndex = i;
        break;
      }
    }
  }

  /**
   * Manipulate Text Tracks settings.
   *
   * @extends ModalDialog
   */
  class TextTrackSettings extends ModalDialog {
    /**
     * Creates an instance of this class.
     *
     * @param { import('../player').default } player
     *         The `Player` that this class should be attached to.
     *
     * @param {Object} [options]
     *         The key/value store of player options.
     */
    constructor(player, options) {
      options.temporary = false;
      super(player, options);
      this.updateDisplay = this.updateDisplay.bind(this);

      // fill the modal and pretend we have opened it
      this.fill();
      this.hasBeenOpened_ = this.hasBeenFilled_ = true;
      this.endDialog = createEl('p', {
        className: 'vjs-control-text',
        textContent: this.localize('End of dialog window.')
      });
      this.el().appendChild(this.endDialog);
      this.setDefaults();

      // Grab `persistTextTrackSettings` from the player options if not passed in child options
      if (options.persistTextTrackSettings === undefined) {
        this.options_.persistTextTrackSettings = this.options_.playerOptions.persistTextTrackSettings;
      }
      this.on(this.$('.vjs-done-button'), 'click', () => {
        this.saveSettings();
        this.close();
      });
      this.on(this.$('.vjs-default-button'), 'click', () => {
        this.setDefaults();
        this.updateDisplay();
      });
      each(selectConfigs, config => {
        this.on(this.$(config.selector), 'change', this.updateDisplay);
      });
      if (this.options_.persistTextTrackSettings) {
        this.restoreSettings();
      }
    }
    dispose() {
      this.endDialog = null;
      super.dispose();
    }

    /**
     * Create a <select> element with configured options.
     *
     * @param {string} key
     *        Configuration key to use during creation.
     *
     * @return {string}
     *         An HTML string.
     *
     * @private
     */
    createElSelect_(key, legendId = '', type = 'label') {
      const config = selectConfigs[key];
      const id = config.id.replace('%s', this.id_);
      const selectLabelledbyIds = [legendId, id].join(' ').trim();
      return [`<${type} id="${id}" class="${type === 'label' ? 'vjs-label' : ''}">`, this.localize(config.label), `</${type}>`, `<select aria-labelledby="${selectLabelledbyIds}">`].concat(config.options.map(o => {
        const optionId = id + '-' + o[1].replace(/\W+/g, '');
        return [`<option id="${optionId}" value="${o[0]}" `, `aria-labelledby="${selectLabelledbyIds} ${optionId}">`, this.localize(o[1]), '</option>'].join('');
      })).concat('</select>').join('');
    }

    /**
     * Create foreground color element for the component
     *
     * @return {string}
     *         An HTML string.
     *
     * @private
     */
    createElFgColor_() {
      const legendId = `captions-text-legend-${this.id_}`;
      return ['<fieldset class="vjs-fg vjs-track-setting">', `<legend id="${legendId}">`, this.localize('Text'), '</legend>', '<span class="vjs-text-color">', this.createElSelect_('color', legendId), '</span>', '<span class="vjs-text-opacity vjs-opacity">', this.createElSelect_('textOpacity', legendId), '</span>', '</fieldset>'].join('');
    }

    /**
     * Create background color element for the component
     *
     * @return {string}
     *         An HTML string.
     *
     * @private
     */
    createElBgColor_() {
      const legendId = `captions-background-${this.id_}`;
      return ['<fieldset class="vjs-bg vjs-track-setting">', `<legend id="${legendId}">`, this.localize('Text Background'), '</legend>', '<span class="vjs-bg-color">', this.createElSelect_('backgroundColor', legendId), '</span>', '<span class="vjs-bg-opacity vjs-opacity">', this.createElSelect_('backgroundOpacity', legendId), '</span>', '</fieldset>'].join('');
    }

    /**
     * Create window color element for the component
     *
     * @return {string}
     *         An HTML string.
     *
     * @private
     */
    createElWinColor_() {
      const legendId = `captions-window-${this.id_}`;
      return ['<fieldset class="vjs-window vjs-track-setting">', `<legend id="${legendId}">`, this.localize('Caption Area Background'), '</legend>', '<span class="vjs-window-color">', this.createElSelect_('windowColor', legendId), '</span>', '<span class="vjs-window-opacity vjs-opacity">', this.createElSelect_('windowOpacity', legendId), '</span>', '</fieldset>'].join('');
    }

    /**
     * Create color elements for the component
     *
     * @return {Element}
     *         The element that was created
     *
     * @private
     */
    createElColors_() {
      return createEl('div', {
        className: 'vjs-track-settings-colors',
        innerHTML: [this.createElFgColor_(), this.createElBgColor_(), this.createElWinColor_()].join('')
      });
    }

    /**
     * Create font elements for the component
     *
     * @return {Element}
     *         The element that was created.
     *
     * @private
     */
    createElFont_() {
      return createEl('div', {
        className: 'vjs-track-settings-font',
        innerHTML: ['<fieldset class="vjs-font-percent vjs-track-setting">', this.createElSelect_('fontPercent', '', 'legend'), '</fieldset>', '<fieldset class="vjs-edge-style vjs-track-setting">', this.createElSelect_('edgeStyle', '', 'legend'), '</fieldset>', '<fieldset class="vjs-font-family vjs-track-setting">', this.createElSelect_('fontFamily', '', 'legend'), '</fieldset>'].join('')
      });
    }

    /**
     * Create controls for the component
     *
     * @return {Element}
     *         The element that was created.
     *
     * @private
     */
    createElControls_() {
      const defaultsDescription = this.localize('restore all settings to the default values');
      return createEl('div', {
        className: 'vjs-track-settings-controls',
        innerHTML: [`<button type="button" class="vjs-default-button" title="${defaultsDescription}">`, this.localize('Reset'), `<span class="vjs-control-text"> ${defaultsDescription}</span>`, '</button>', `<button type="button" class="vjs-done-button">${this.localize('Done')}</button>`].join('')
      });
    }
    content() {
      return [this.createElColors_(), this.createElFont_(), this.createElControls_()];
    }
    label() {
      return this.localize('Caption Settings Dialog');
    }
    description() {
      return this.localize('Beginning of dialog window. Escape will cancel and close the window.');
    }
    buildCSSClass() {
      return super.buildCSSClass() + ' vjs-text-track-settings';
    }

    /**
     * Gets an object of text track settings (or null).
     *
     * @return {Object}
     *         An object with config values parsed from the DOM or localStorage.
     */
    getValues() {
      return reduce(selectConfigs, (accum, config, key) => {
        const value = getSelectedOptionValue(this.$(config.selector), config.parser);
        if (value !== undefined) {
          accum[key] = value;
        }
        return accum;
      }, {});
    }

    /**
     * Sets text track settings from an object of values.
     *
     * @param {Object} values
     *        An object with config values parsed from the DOM or localStorage.
     */
    setValues(values) {
      each(selectConfigs, (config, key) => {
        setSelectedOption(this.$(config.selector), values[key], config.parser);
      });
    }

    /**
     * Sets all `<select>` elements to their default values.
     */
    setDefaults() {
      each(selectConfigs, config => {
        const index = config.hasOwnProperty('default') ? config.default : 0;
        this.$(config.selector).selectedIndex = index;
      });
    }

    /**
     * Restore texttrack settings from localStorage
     */
    restoreSettings() {
      let values;
      try {
        values = JSON.parse(window.localStorage.getItem(LOCAL_STORAGE_KEY));
      } catch (err) {
        log.warn(err);
      }
      if (values) {
        this.setValues(values);
      }
    }

    /**
     * Save text track settings to localStorage
     */
    saveSettings() {
      if (!this.options_.persistTextTrackSettings) {
        return;
      }
      const values = this.getValues();
      try {
        if (Object.keys(values).length) {
          window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(values));
        } else {
          window.localStorage.removeItem(LOCAL_STORAGE_KEY);
        }
      } catch (err) {
        log.warn(err);
      }
    }

    /**
     * Update display of text track settings
     */
    updateDisplay() {
      const ttDisplay = this.player_.getChild('textTrackDisplay');
      if (ttDisplay) {
        ttDisplay.updateDisplay();
      }
    }

    /**
     * conditionally blur the element and refocus the captions button
     *
     * @private
     */
    conditionalBlur_() {
      this.previouslyActiveEl_ = null;
      const cb = this.player_.controlBar;
      const subsCapsBtn = cb && cb.subsCapsButton;
      const ccBtn = cb && cb.captionsButton;
      if (subsCapsBtn) {
        subsCapsBtn.focus();
      } else if (ccBtn) {
        ccBtn.focus();
      }
    }

    /**
     * Repopulate dialog with new localizations on languagechange
     */
    handleLanguagechange() {
      this.fill();
    }
  }
  Component.registerComponent('TextTrackSettings', TextTrackSettings);

  /**
   * @file resize-manager.js
   */

  /**
   * A Resize Manager. It is in charge of triggering `playerresize` on the player in the right conditions.
   *
   * It'll either create an iframe and use a debounced resize handler on it or use the new {@link https://wicg.github.io/ResizeObserver/|ResizeObserver}.
   *
   * If the ResizeObserver is available natively, it will be used. A polyfill can be passed in as an option.
   * If a `playerresize` event is not needed, the ResizeManager component can be removed from the player, see the example below.
   *
   * @example <caption>How to disable the resize manager</caption>
   * const player = videojs('#vid', {
   *   resizeManager: false
   * });
   *
   * @see {@link https://wicg.github.io/ResizeObserver/|ResizeObserver specification}
   *
   * @extends Component
   */
  class ResizeManager extends Component {
    /**
     * Create the ResizeManager.
     *
     * @param {Object} player
     *        The `Player` that this class should be attached to.
     *
     * @param {Object} [options]
     *        The key/value store of ResizeManager options.
     *
     * @param {Object} [options.ResizeObserver]
     *        A polyfill for ResizeObserver can be passed in here.
     *        If this is set to null it will ignore the native ResizeObserver and fall back to the iframe fallback.
     */
    constructor(player, options) {
      let RESIZE_OBSERVER_AVAILABLE = options.ResizeObserver || window.ResizeObserver;

      // if `null` was passed, we want to disable the ResizeObserver
      if (options.ResizeObserver === null) {
        RESIZE_OBSERVER_AVAILABLE = false;
      }

      // Only create an element when ResizeObserver isn't available
      const options_ = merge({
        createEl: !RESIZE_OBSERVER_AVAILABLE,
        reportTouchActivity: false
      }, options);
      super(player, options_);
      this.ResizeObserver = options.ResizeObserver || window.ResizeObserver;
      this.loadListener_ = null;
      this.resizeObserver_ = null;
      this.debouncedHandler_ = debounce(() => {
        this.resizeHandler();
      }, 100, false, this);
      if (RESIZE_OBSERVER_AVAILABLE) {
        this.resizeObserver_ = new this.ResizeObserver(this.debouncedHandler_);
        this.resizeObserver_.observe(player.el());
      } else {
        this.loadListener_ = () => {
          if (!this.el_ || !this.el_.contentWindow) {
            return;
          }
          const debouncedHandler_ = this.debouncedHandler_;
          let unloadListener_ = this.unloadListener_ = function () {
            off(this, 'resize', debouncedHandler_);
            off(this, 'unload', unloadListener_);
            unloadListener_ = null;
          };

          // safari and edge can unload the iframe before resizemanager dispose
          // we have to dispose of event handlers correctly before that happens
          on(this.el_.contentWindow, 'unload', unloadListener_);
          on(this.el_.contentWindow, 'resize', debouncedHandler_);
        };
        this.one('load', this.loadListener_);
      }
    }
    createEl() {
      return super.createEl('iframe', {
        className: 'vjs-resize-manager',
        tabIndex: -1,
        title: this.localize('No content')
      }, {
        'aria-hidden': 'true'
      });
    }

    /**
     * Called when a resize is triggered on the iframe or a resize is observed via the ResizeObserver
     *
     * @fires Player#playerresize
     */
    resizeHandler() {
      /**
       * Called when the player size has changed
       *
       * @event Player#playerresize
       * @type {Event}
       */
      // make sure player is still around to trigger
      // prevents this from causing an error after dispose
      if (!this.player_ || !this.player_.trigger) {
        return;
      }
      this.player_.trigger('playerresize');
    }
    dispose() {
      if (this.debouncedHandler_) {
        this.debouncedHandler_.cancel();
      }
      if (this.resizeObserver_) {
        if (this.player_.el()) {
          this.resizeObserver_.unobserve(this.player_.el());
        }
        this.resizeObserver_.disconnect();
      }
      if (this.loadListener_) {
        this.off('load', this.loadListener_);
      }
      if (this.el_ && this.el_.contentWindow && this.unloadListener_) {
        this.unloadListener_.call(this.el_.contentWindow);
      }
      this.ResizeObserver = null;
      this.resizeObserver = null;
      this.debouncedHandler_ = null;
      this.loadListener_ = null;
      super.dispose();
    }
  }
  Component.registerComponent('ResizeManager', ResizeManager);

  const defaults = {
    trackingThreshold: 20,
    liveTolerance: 15
  };

  /*
    track when we are at the live edge, and other helpers for live playback */

  /**
   * A class for checking live current time and determining when the player
   * is at or behind the live edge.
   */
  class LiveTracker extends Component {
    /**
     * Creates an instance of this class.
     *
     * @param { import('./player').default } player
     *        The `Player` that this class should be attached to.
     *
     * @param {Object} [options]
     *        The key/value store of player options.
     *
     * @param {number} [options.trackingThreshold=20]
     *        Number of seconds of live window (seekableEnd - seekableStart) that
     *        media needs to have before the liveui will be shown.
     *
     * @param {number} [options.liveTolerance=15]
     *        Number of seconds behind live that we have to be
     *        before we will be considered non-live. Note that this will only
     *        be used when playing at the live edge. This allows large seekable end
     *        changes to not effect whether we are live or not.
     */
    constructor(player, options) {
      // LiveTracker does not need an element
      const options_ = merge(defaults, options, {
        createEl: false
      });
      super(player, options_);
      this.trackLiveHandler_ = () => this.trackLive_();
      this.handlePlay_ = e => this.handlePlay(e);
      this.handleFirstTimeupdate_ = e => this.handleFirstTimeupdate(e);
      this.handleSeeked_ = e => this.handleSeeked(e);
      this.seekToLiveEdge_ = e => this.seekToLiveEdge(e);
      this.reset_();
      this.on(this.player_, 'durationchange', e => this.handleDurationchange(e));
      // we should try to toggle tracking on canplay as native playback engines, like Safari
      // may not have the proper values for things like seekableEnd until then
      this.on(this.player_, 'canplay', () => this.toggleTracking());
    }

    /**
     * all the functionality for tracking when seek end changes
     * and for tracking how far past seek end we should be
     */
    trackLive_() {
      const seekable = this.player_.seekable();

      // skip undefined seekable
      if (!seekable || !seekable.length) {
        return;
      }
      const newTime = Number(window.performance.now().toFixed(4));
      const deltaTime = this.lastTime_ === -1 ? 0 : (newTime - this.lastTime_) / 1000;
      this.lastTime_ = newTime;
      this.pastSeekEnd_ = this.pastSeekEnd() + deltaTime;
      const liveCurrentTime = this.liveCurrentTime();
      const currentTime = this.player_.currentTime();

      // we are behind live if any are true
      // 1. the player is paused
      // 2. the user seeked to a location 2 seconds away from live
      // 3. the difference between live and current time is greater
      //    liveTolerance which defaults to 15s
      let isBehind = this.player_.paused() || this.seekedBehindLive_ || Math.abs(liveCurrentTime - currentTime) > this.options_.liveTolerance;

      // we cannot be behind if
      // 1. until we have not seen a timeupdate yet
      // 2. liveCurrentTime is Infinity, which happens on Android and Native Safari
      if (!this.timeupdateSeen_ || liveCurrentTime === Infinity) {
        isBehind = false;
      }
      if (isBehind !== this.behindLiveEdge_) {
        this.behindLiveEdge_ = isBehind;
        this.trigger('liveedgechange');
      }
    }

    /**
     * handle a durationchange event on the player
     * and start/stop tracking accordingly.
     */
    handleDurationchange() {
      this.toggleTracking();
    }

    /**
     * start/stop tracking
     */
    toggleTracking() {
      if (this.player_.duration() === Infinity && this.liveWindow() >= this.options_.trackingThreshold) {
        if (this.player_.options_.liveui) {
          this.player_.addClass('vjs-liveui');
        }
        this.startTracking();
      } else {
        this.player_.removeClass('vjs-liveui');
        this.stopTracking();
      }
    }

    /**
     * start tracking live playback
     */
    startTracking() {
      if (this.isTracking()) {
        return;
      }

      // If we haven't seen a timeupdate, we need to check whether playback
      // began before this component started tracking. This can happen commonly
      // when using autoplay.
      if (!this.timeupdateSeen_) {
        this.timeupdateSeen_ = this.player_.hasStarted();
      }
      this.trackingInterval_ = this.setInterval(this.trackLiveHandler_, UPDATE_REFRESH_INTERVAL);
      this.trackLive_();
      this.on(this.player_, ['play', 'pause'], this.trackLiveHandler_);
      if (!this.timeupdateSeen_) {
        this.one(this.player_, 'play', this.handlePlay_);
        this.one(this.player_, 'timeupdate', this.handleFirstTimeupdate_);
      } else {
        this.on(this.player_, 'seeked', this.handleSeeked_);
      }
    }

    /**
     * handle the first timeupdate on the player if it wasn't already playing
     * when live tracker started tracking.
     */
    handleFirstTimeupdate() {
      this.timeupdateSeen_ = true;
      this.on(this.player_, 'seeked', this.handleSeeked_);
    }

    /**
     * Keep track of what time a seek starts, and listen for seeked
     * to find where a seek ends.
     */
    handleSeeked() {
      const timeDiff = Math.abs(this.liveCurrentTime() - this.player_.currentTime());
      this.seekedBehindLive_ = this.nextSeekedFromUser_ && timeDiff > 2;
      this.nextSeekedFromUser_ = false;
      this.trackLive_();
    }

    /**
     * handle the first play on the player, and make sure that we seek
     * right to the live edge.
     */
    handlePlay() {
      this.one(this.player_, 'timeupdate', this.seekToLiveEdge_);
    }

    /**
     * Stop tracking, and set all internal variables to
     * their initial value.
     */
    reset_() {
      this.lastTime_ = -1;
      this.pastSeekEnd_ = 0;
      this.lastSeekEnd_ = -1;
      this.behindLiveEdge_ = true;
      this.timeupdateSeen_ = false;
      this.seekedBehindLive_ = false;
      this.nextSeekedFromUser_ = false;
      this.clearInterval(this.trackingInterval_);
      this.trackingInterval_ = null;
      this.off(this.player_, ['play', 'pause'], this.trackLiveHandler_);
      this.off(this.player_, 'seeked', this.handleSeeked_);
      this.off(this.player_, 'play', this.handlePlay_);
      this.off(this.player_, 'timeupdate', this.handleFirstTimeupdate_);
      this.off(this.player_, 'timeupdate', this.seekToLiveEdge_);
    }

    /**
     * The next seeked event is from the user. Meaning that any seek
     * > 2s behind live will be considered behind live for real and
     * liveTolerance will be ignored.
     */
    nextSeekedFromUser() {
      this.nextSeekedFromUser_ = true;
    }

    /**
     * stop tracking live playback
     */
    stopTracking() {
      if (!this.isTracking()) {
        return;
      }
      this.reset_();
      this.trigger('liveedgechange');
    }

    /**
     * A helper to get the player seekable end
     * so that we don't have to null check everywhere
     *
     * @return {number}
     *         The furthest seekable end or Infinity.
     */
    seekableEnd() {
      const seekable = this.player_.seekable();
      const seekableEnds = [];
      let i = seekable ? seekable.length : 0;
      while (i--) {
        seekableEnds.push(seekable.end(i));
      }

      // grab the furthest seekable end after sorting, or if there are none
      // default to Infinity
      return seekableEnds.length ? seekableEnds.sort()[seekableEnds.length - 1] : Infinity;
    }

    /**
     * A helper to get the player seekable start
     * so that we don't have to null check everywhere
     *
     * @return {number}
     *         The earliest seekable start or 0.
     */
    seekableStart() {
      const seekable = this.player_.seekable();
      const seekableStarts = [];
      let i = seekable ? seekable.length : 0;
      while (i--) {
        seekableStarts.push(seekable.start(i));
      }

      // grab the first seekable start after sorting, or if there are none
      // default to 0
      return seekableStarts.length ? seekableStarts.sort()[0] : 0;
    }

    /**
     * Get the live time window aka
     * the amount of time between seekable start and
     * live current time.
     *
     * @return {number}
     *         The amount of seconds that are seekable in
     *         the live video.
     */
    liveWindow() {
      const liveCurrentTime = this.liveCurrentTime();

      // if liveCurrenTime is Infinity then we don't have a liveWindow at all
      if (liveCurrentTime === Infinity) {
        return 0;
      }
      return liveCurrentTime - this.seekableStart();
    }

    /**
     * Determines if the player is live, only checks if this component
     * is tracking live playback or not
     *
     * @return {boolean}
     *         Whether liveTracker is tracking
     */
    isLive() {
      return this.isTracking();
    }

    /**
     * Determines if currentTime is at the live edge and won't fall behind
     * on each seekableendchange
     *
     * @return {boolean}
     *         Whether playback is at the live edge
     */
    atLiveEdge() {
      return !this.behindLiveEdge();
    }

    /**
     * get what we expect the live current time to be
     *
     * @return {number}
     *         The expected live current time
     */
    liveCurrentTime() {
      return this.pastSeekEnd() + this.seekableEnd();
    }

    /**
     * The number of seconds that have occurred after seekable end
     * changed. This will be reset to 0 once seekable end changes.
     *
     * @return {number}
     *         Seconds past the current seekable end
     */
    pastSeekEnd() {
      const seekableEnd = this.seekableEnd();
      if (this.lastSeekEnd_ !== -1 && seekableEnd !== this.lastSeekEnd_) {
        this.pastSeekEnd_ = 0;
      }
      this.lastSeekEnd_ = seekableEnd;
      return this.pastSeekEnd_;
    }

    /**
     * If we are currently behind the live edge, aka currentTime will be
     * behind on a seekableendchange
     *
     * @return {boolean}
     *         If we are behind the live edge
     */
    behindLiveEdge() {
      return this.behindLiveEdge_;
    }

    /**
     * Whether live tracker is currently tracking or not.
     */
    isTracking() {
      return typeof this.trackingInterval_ === 'number';
    }

    /**
     * Seek to the live edge if we are behind the live edge
     */
    seekToLiveEdge() {
      this.seekedBehindLive_ = false;
      if (this.atLiveEdge()) {
        return;
      }
      this.nextSeekedFromUser_ = false;
      this.player_.currentTime(this.liveCurrentTime());
    }

    /**
     * Dispose of liveTracker
     */
    dispose() {
      this.stopTracking();
      super.dispose();
    }
  }
  Component.registerComponent('LiveTracker', LiveTracker);

  /**
   * Displays an element over the player which contains an optional title and
   * description for the current content.
   *
   * Much of the code for this component originated in the now obsolete
   * videojs-dock plugin: https://github.com/brightcove/videojs-dock/
   *
   * @extends Component
   */
  class TitleBar extends Component {
    constructor(player, options) {
      super(player, options);
      this.on('statechanged', e => this.updateDom_());
      this.updateDom_();
    }

    /**
     * Create the `TitleBar`'s DOM element
     *
     * @return {Element}
     *         The element that was created.
     */
    createEl() {
      this.els = {
        title: createEl('div', {
          className: 'vjs-title-bar-title',
          id: `vjs-title-bar-title-${newGUID()}`
        }),
        description: createEl('div', {
          className: 'vjs-title-bar-description',
          id: `vjs-title-bar-description-${newGUID()}`
        })
      };
      return createEl('div', {
        className: 'vjs-title-bar'
      }, {}, values(this.els));
    }

    /**
     * Updates the DOM based on the component's state object.
     */
    updateDom_() {
      const tech = this.player_.tech_;
      const techEl = tech && tech.el_;
      const techAriaAttrs = {
        title: 'aria-labelledby',
        description: 'aria-describedby'
      };
      ['title', 'description'].forEach(k => {
        const value = this.state[k];
        const el = this.els[k];
        const techAriaAttr = techAriaAttrs[k];
        emptyEl(el);
        if (value) {
          textContent(el, value);
        }

        // If there is a tech element available, update its ARIA attributes
        // according to whether a title and/or description have been provided.
        if (techEl) {
          techEl.removeAttribute(techAriaAttr);
          if (value) {
            techEl.setAttribute(techAriaAttr, el.id);
          }
        }
      });
      if (this.state.title || this.state.description) {
        this.show();
      } else {
        this.hide();
      }
    }

    /**
     * Update the contents of the title bar component with new title and
     * description text.
     *
     * If both title and description are missing, the title bar will be hidden.
     *
     * If either title or description are present, the title bar will be visible.
     *
     * NOTE: Any previously set value will be preserved. To unset a previously
     * set value, you must pass an empty string or null.
     *
     * For example:
     *
     * ```
     * update({title: 'foo', description: 'bar'}) // title: 'foo', description: 'bar'
     * update({description: 'bar2'}) // title: 'foo', description: 'bar2'
     * update({title: ''}) // title: '', description: 'bar2'
     * update({title: 'foo', description: null}) // title: 'foo', description: null
     * ```
     *
     * @param  {Object} [options={}]
     *         An options object. When empty, the title bar will be hidden.
     *
     * @param  {string} [options.title]
     *         A title to display in the title bar.
     *
     * @param  {string} [options.description]
     *         A description to display in the title bar.
     */
    update(options) {
      this.setState(options);
    }

    /**
     * Dispose the component.
     */
    dispose() {
      const tech = this.player_.tech_;
      const techEl = tech && tech.el_;
      if (techEl) {
        techEl.removeAttribute('aria-labelledby');
        techEl.removeAttribute('aria-describedby');
      }
      super.dispose();
      this.els = null;
    }
  }
  Component.registerComponent('TitleBar', TitleBar);

  /**
   * This function is used to fire a sourceset when there is something
   * similar to `mediaEl.load()` being called. It will try to find the source via
   * the `src` attribute and then the `<source>` elements. It will then fire `sourceset`
   * with the source that was found or empty string if we cannot know. If it cannot
   * find a source then `sourceset` will not be fired.
   *
   * @param { import('./html5').default } tech
   *        The tech object that sourceset was setup on
   *
   * @return {boolean}
   *         returns false if the sourceset was not fired and true otherwise.
   */
  const sourcesetLoad = tech => {
    const el = tech.el();

    // if `el.src` is set, that source will be loaded.
    if (el.hasAttribute('src')) {
      tech.triggerSourceset(el.src);
      return true;
    }

    /**
     * Since there isn't a src property on the media element, source elements will be used for
     * implementing the source selection algorithm. This happens asynchronously and
     * for most cases were there is more than one source we cannot tell what source will
     * be loaded, without re-implementing the source selection algorithm. At this time we are not
     * going to do that. There are three special cases that we do handle here though:
     *
     * 1. If there are no sources, do not fire `sourceset`.
     * 2. If there is only one `<source>` with a `src` property/attribute that is our `src`
     * 3. If there is more than one `<source>` but all of them have the same `src` url.
     *    That will be our src.
     */
    const sources = tech.$$('source');
    const srcUrls = [];
    let src = '';

    // if there are no sources, do not fire sourceset
    if (!sources.length) {
      return false;
    }

    // only count valid/non-duplicate source elements
    for (let i = 0; i < sources.length; i++) {
      const url = sources[i].src;
      if (url && srcUrls.indexOf(url) === -1) {
        srcUrls.push(url);
      }
    }

    // there were no valid sources
    if (!srcUrls.length) {
      return false;
    }

    // there is only one valid source element url
    // use that
    if (srcUrls.length === 1) {
      src = srcUrls[0];
    }
    tech.triggerSourceset(src);
    return true;
  };

  /**
   * our implementation of an `innerHTML` descriptor for browsers
   * that do not have one.
   */
  const innerHTMLDescriptorPolyfill = Object.defineProperty({}, 'innerHTML', {
    get() {
      return this.cloneNode(true).innerHTML;
    },
    set(v) {
      // make a dummy node to use innerHTML on
      const dummy = document.createElement(this.nodeName.toLowerCase());

      // set innerHTML to the value provided
      dummy.innerHTML = v;

      // make a document fragment to hold the nodes from dummy
      const docFrag = document.createDocumentFragment();

      // copy all of the nodes created by the innerHTML on dummy
      // to the document fragment
      while (dummy.childNodes.length) {
        docFrag.appendChild(dummy.childNodes[0]);
      }

      // remove content
      this.innerText = '';

      // now we add all of that html in one by appending the
      // document fragment. This is how innerHTML does it.
      window.Element.prototype.appendChild.call(this, docFrag);

      // then return the result that innerHTML's setter would
      return this.innerHTML;
    }
  });

  /**
   * Get a property descriptor given a list of priorities and the
   * property to get.
   */
  const getDescriptor = (priority, prop) => {
    let descriptor = {};
    for (let i = 0; i < priority.length; i++) {
      descriptor = Object.getOwnPropertyDescriptor(priority[i], prop);
      if (descriptor && descriptor.set && descriptor.get) {
        break;
      }
    }
    descriptor.enumerable = true;
    descriptor.configurable = true;
    return descriptor;
  };
  const getInnerHTMLDescriptor = tech => getDescriptor([tech.el(), window.HTMLMediaElement.prototype, window.Element.prototype, innerHTMLDescriptorPolyfill], 'innerHTML');

  /**
   * Patches browser internal functions so that we can tell synchronously
   * if a `<source>` was appended to the media element. For some reason this
   * causes a `sourceset` if the the media element is ready and has no source.
   * This happens when:
   * - The page has just loaded and the media element does not have a source.
   * - The media element was emptied of all sources, then `load()` was called.
   *
   * It does this by patching the following functions/properties when they are supported:
   *
   * - `append()` - can be used to add a `<source>` element to the media element
   * - `appendChild()` - can be used to add a `<source>` element to the media element
   * - `insertAdjacentHTML()` -  can be used to add a `<source>` element to the media element
   * - `innerHTML` -  can be used to add a `<source>` element to the media element
   *
   * @param {Html5} tech
   *        The tech object that sourceset is being setup on.
   */
  const firstSourceWatch = function (tech) {
    const el = tech.el();

    // make sure firstSourceWatch isn't setup twice.
    if (el.resetSourceWatch_) {
      return;
    }
    const old = {};
    const innerDescriptor = getInnerHTMLDescriptor(tech);
    const appendWrapper = appendFn => (...args) => {
      const retval = appendFn.apply(el, args);
      sourcesetLoad(tech);
      return retval;
    };
    ['append', 'appendChild', 'insertAdjacentHTML'].forEach(k => {
      if (!el[k]) {
        return;
      }

      // store the old function
      old[k] = el[k];

      // call the old function with a sourceset if a source
      // was loaded
      el[k] = appendWrapper(old[k]);
    });
    Object.defineProperty(el, 'innerHTML', merge(innerDescriptor, {
      set: appendWrapper(innerDescriptor.set)
    }));
    el.resetSourceWatch_ = () => {
      el.resetSourceWatch_ = null;
      Object.keys(old).forEach(k => {
        el[k] = old[k];
      });
      Object.defineProperty(el, 'innerHTML', innerDescriptor);
    };

    // on the first sourceset, we need to revert our changes
    tech.one('sourceset', el.resetSourceWatch_);
  };

  /**
   * our implementation of a `src` descriptor for browsers
   * that do not have one
   */
  const srcDescriptorPolyfill = Object.defineProperty({}, 'src', {
    get() {
      if (this.hasAttribute('src')) {
        return getAbsoluteURL(window.Element.prototype.getAttribute.call(this, 'src'));
      }
      return '';
    },
    set(v) {
      window.Element.prototype.setAttribute.call(this, 'src', v);
      return v;
    }
  });
  const getSrcDescriptor = tech => getDescriptor([tech.el(), window.HTMLMediaElement.prototype, srcDescriptorPolyfill], 'src');

  /**
   * setup `sourceset` handling on the `Html5` tech. This function
   * patches the following element properties/functions:
   *
   * - `src` - to determine when `src` is set
   * - `setAttribute()` - to determine when `src` is set
   * - `load()` - this re-triggers the source selection algorithm, and can
   *              cause a sourceset.
   *
   * If there is no source when we are adding `sourceset` support or during a `load()`
   * we also patch the functions listed in `firstSourceWatch`.
   *
   * @param {Html5} tech
   *        The tech to patch
   */
  const setupSourceset = function (tech) {
    if (!tech.featuresSourceset) {
      return;
    }
    const el = tech.el();

    // make sure sourceset isn't setup twice.
    if (el.resetSourceset_) {
      return;
    }
    const srcDescriptor = getSrcDescriptor(tech);
    const oldSetAttribute = el.setAttribute;
    const oldLoad = el.load;
    Object.defineProperty(el, 'src', merge(srcDescriptor, {
      set: v => {
        const retval = srcDescriptor.set.call(el, v);

        // we use the getter here to get the actual value set on src
        tech.triggerSourceset(el.src);
        return retval;
      }
    }));
    el.setAttribute = (n, v) => {
      const retval = oldSetAttribute.call(el, n, v);
      if (/src/i.test(n)) {
        tech.triggerSourceset(el.src);
      }
      return retval;
    };
    el.load = () => {
      const retval = oldLoad.call(el);

      // if load was called, but there was no source to fire
      // sourceset on. We have to watch for a source append
      // as that can trigger a `sourceset` when the media element
      // has no source
      if (!sourcesetLoad(tech)) {
        tech.triggerSourceset('');
        firstSourceWatch(tech);
      }
      return retval;
    };
    if (el.currentSrc) {
      tech.triggerSourceset(el.currentSrc);
    } else if (!sourcesetLoad(tech)) {
      firstSourceWatch(tech);
    }
    el.resetSourceset_ = () => {
      el.resetSourceset_ = null;
      el.load = oldLoad;
      el.setAttribute = oldSetAttribute;
      Object.defineProperty(el, 'src', srcDescriptor);
      if (el.resetSourceWatch_) {
        el.resetSourceWatch_();
      }
    };
  };

  /**
   * @file html5.js
   */

  /**
   * HTML5 Media Controller - Wrapper for HTML5 Media API
   *
   * @mixes Tech~SourceHandlerAdditions
   * @extends Tech
   */
  class Html5 extends Tech {
    /**
    * Create an instance of this Tech.
    *
    * @param {Object} [options]
    *        The key/value store of player options.
    *
    * @param {Function} [ready]
    *        Callback function to call when the `HTML5` Tech is ready.
    */
    constructor(options, ready) {
      super(options, ready);
      const source = options.source;
      let crossoriginTracks = false;
      this.featuresVideoFrameCallback = this.featuresVideoFrameCallback && this.el_.tagName === 'VIDEO';

      // Set the source if one is provided
      // 1) Check if the source is new (if not, we want to keep the original so playback isn't interrupted)
      // 2) Check to see if the network state of the tag was failed at init, and if so, reset the source
      // anyway so the error gets fired.
      if (source && (this.el_.currentSrc !== source.src || options.tag && options.tag.initNetworkState_ === 3)) {
        this.setSource(source);
      } else {
        this.handleLateInit_(this.el_);
      }

      // setup sourceset after late sourceset/init
      if (options.enableSourceset) {
        this.setupSourcesetHandling_();
      }
      this.isScrubbing_ = false;
      if (this.el_.hasChildNodes()) {
        const nodes = this.el_.childNodes;
        let nodesLength = nodes.length;
        const removeNodes = [];
        while (nodesLength--) {
          const node = nodes[nodesLength];
          const nodeName = node.nodeName.toLowerCase();
          if (nodeName === 'track') {
            if (!this.featuresNativeTextTracks) {
              // Empty video tag tracks so the built-in player doesn't use them also.
              // This may not be fast enough to stop HTML5 browsers from reading the tags
              // so we'll need to turn off any default tracks if we're manually doing
              // captions and subtitles. videoElement.textTracks
              removeNodes.push(node);
            } else {
              // store HTMLTrackElement and TextTrack to remote list
              this.remoteTextTrackEls().addTrackElement_(node);
              this.remoteTextTracks().addTrack(node.track);
              this.textTracks().addTrack(node.track);
              if (!crossoriginTracks && !this.el_.hasAttribute('crossorigin') && isCrossOrigin(node.src)) {
                crossoriginTracks = true;
              }
            }
          }
        }
        for (let i = 0; i < removeNodes.length; i++) {
          this.el_.removeChild(removeNodes[i]);
        }
      }
      this.proxyNativeTracks_();
      if (this.featuresNativeTextTracks && crossoriginTracks) {
        log.warn('Text Tracks are being loaded from another origin but the crossorigin attribute isn\'t used.\n' + 'This may prevent text tracks from loading.');
      }

      // prevent iOS Safari from disabling metadata text tracks during native playback
      this.restoreMetadataTracksInIOSNativePlayer_();

      // Determine if native controls should be used
      // Our goal should be to get the custom controls on mobile solid everywhere
      // so we can remove this all together. Right now this will block custom
      // controls on touch enabled laptops like the Chrome Pixel
      if ((TOUCH_ENABLED || IS_IPHONE) && options.nativeControlsForTouch === true) {
        this.setControls(true);
      }

      // on iOS, we want to proxy `webkitbeginfullscreen` and `webkitendfullscreen`
      // into a `fullscreenchange` event
      this.proxyWebkitFullscreen_();
      this.triggerReady();
    }

    /**
     * Dispose of `HTML5` media element and remove all tracks.
     */
    dispose() {
      if (this.el_ && this.el_.resetSourceset_) {
        this.el_.resetSourceset_();
      }
      Html5.disposeMediaElement(this.el_);
      this.options_ = null;

      // tech will handle clearing of the emulated track list
      super.dispose();
    }

    /**
     * Modify the media element so that we can detect when
     * the source is changed. Fires `sourceset` just after the source has changed
     */
    setupSourcesetHandling_() {
      setupSourceset(this);
    }

    /**
     * When a captions track is enabled in the iOS Safari native player, all other
     * tracks are disabled (including metadata tracks), which nulls all of their
     * associated cue points. This will restore metadata tracks to their pre-fullscreen
     * state in those cases so that cue points are not needlessly lost.
     *
     * @private
     */
    restoreMetadataTracksInIOSNativePlayer_() {
      const textTracks = this.textTracks();
      let metadataTracksPreFullscreenState;

      // captures a snapshot of every metadata track's current state
      const takeMetadataTrackSnapshot = () => {
        metadataTracksPreFullscreenState = [];
        for (let i = 0; i < textTracks.length; i++) {
          const track = textTracks[i];
          if (track.kind === 'metadata') {
            metadataTracksPreFullscreenState.push({
              track,
              storedMode: track.mode
            });
          }
        }
      };

      // snapshot each metadata track's initial state, and update the snapshot
      // each time there is a track 'change' event
      takeMetadataTrackSnapshot();
      textTracks.addEventListener('change', takeMetadataTrackSnapshot);
      this.on('dispose', () => textTracks.removeEventListener('change', takeMetadataTrackSnapshot));
      const restoreTrackMode = () => {
        for (let i = 0; i < metadataTracksPreFullscreenState.length; i++) {
          const storedTrack = metadataTracksPreFullscreenState[i];
          if (storedTrack.track.mode === 'disabled' && storedTrack.track.mode !== storedTrack.storedMode) {
            storedTrack.track.mode = storedTrack.storedMode;
          }
        }
        // we only want this handler to be executed on the first 'change' event
        textTracks.removeEventListener('change', restoreTrackMode);
      };

      // when we enter fullscreen playback, stop updating the snapshot and
      // restore all track modes to their pre-fullscreen state
      this.on('webkitbeginfullscreen', () => {
        textTracks.removeEventListener('change', takeMetadataTrackSnapshot);

        // remove the listener before adding it just in case it wasn't previously removed
        textTracks.removeEventListener('change', restoreTrackMode);
        textTracks.addEventListener('change', restoreTrackMode);
      });

      // start updating the snapshot again after leaving fullscreen
      this.on('webkitendfullscreen', () => {
        // remove the listener before adding it just in case it wasn't previously removed
        textTracks.removeEventListener('change', takeMetadataTrackSnapshot);
        textTracks.addEventListener('change', takeMetadataTrackSnapshot);

        // remove the restoreTrackMode handler in case it wasn't triggered during fullscreen playback
        textTracks.removeEventListener('change', restoreTrackMode);
      });
    }

    /**
     * Attempt to force override of tracks for the given type
     *
     * @param {string} type - Track type to override, possible values include 'Audio',
     * 'Video', and 'Text'.
     * @param {boolean} override - If set to true native audio/video will be overridden,
     * otherwise native audio/video will potentially be used.
     * @private
     */
    overrideNative_(type, override) {
      // If there is no behavioral change don't add/remove listeners
      if (override !== this[`featuresNative${type}Tracks`]) {
        return;
      }
      const lowerCaseType = type.toLowerCase();
      if (this[`${lowerCaseType}TracksListeners_`]) {
        Object.keys(this[`${lowerCaseType}TracksListeners_`]).forEach(eventName => {
          const elTracks = this.el()[`${lowerCaseType}Tracks`];
          elTracks.removeEventListener(eventName, this[`${lowerCaseType}TracksListeners_`][eventName]);
        });
      }
      this[`featuresNative${type}Tracks`] = !override;
      this[`${lowerCaseType}TracksListeners_`] = null;
      this.proxyNativeTracksForType_(lowerCaseType);
    }

    /**
     * Attempt to force override of native audio tracks.
     *
     * @param {boolean} override - If set to true native audio will be overridden,
     * otherwise native audio will potentially be used.
     */
    overrideNativeAudioTracks(override) {
      this.overrideNative_('Audio', override);
    }

    /**
     * Attempt to force override of native video tracks.
     *
     * @param {boolean} override - If set to true native video will be overridden,
     * otherwise native video will potentially be used.
     */
    overrideNativeVideoTracks(override) {
      this.overrideNative_('Video', override);
    }

    /**
     * Proxy native track list events for the given type to our track
     * lists if the browser we are playing in supports that type of track list.
     *
     * @param {string} name - Track type; values include 'audio', 'video', and 'text'
     * @private
     */
    proxyNativeTracksForType_(name) {
      const props = NORMAL[name];
      const elTracks = this.el()[props.getterName];
      const techTracks = this[props.getterName]();
      if (!this[`featuresNative${props.capitalName}Tracks`] || !elTracks || !elTracks.addEventListener) {
        return;
      }
      const listeners = {
        change: e => {
          const event = {
            type: 'change',
            target: techTracks,
            currentTarget: techTracks,
            srcElement: techTracks
          };
          techTracks.trigger(event);

          // if we are a text track change event, we should also notify the
          // remote text track list. This can potentially cause a false positive
          // if we were to get a change event on a non-remote track and
          // we triggered the event on the remote text track list which doesn't
          // contain that track. However, best practices mean looping through the
          // list of tracks and searching for the appropriate mode value, so,
          // this shouldn't pose an issue
          if (name === 'text') {
            this[REMOTE.remoteText.getterName]().trigger(event);
          }
        },
        addtrack(e) {
          techTracks.addTrack(e.track);
        },
        removetrack(e) {
          techTracks.removeTrack(e.track);
        }
      };
      const removeOldTracks = function () {
        const removeTracks = [];
        for (let i = 0; i < techTracks.length; i++) {
          let found = false;
          for (let j = 0; j < elTracks.length; j++) {
            if (elTracks[j] === techTracks[i]) {
              found = true;
              break;
            }
          }
          if (!found) {
            removeTracks.push(techTracks[i]);
          }
        }
        while (removeTracks.length) {
          techTracks.removeTrack(removeTracks.shift());
        }
      };
      this[props.getterName + 'Listeners_'] = listeners;
      Object.keys(listeners).forEach(eventName => {
        const listener = listeners[eventName];
        elTracks.addEventListener(eventName, listener);
        this.on('dispose', e => elTracks.removeEventListener(eventName, listener));
      });

      // Remove (native) tracks that are not used anymore
      this.on('loadstart', removeOldTracks);
      this.on('dispose', e => this.off('loadstart', removeOldTracks));
    }

    /**
     * Proxy all native track list events to our track lists if the browser we are playing
     * in supports that type of track list.
     *
     * @private
     */
    proxyNativeTracks_() {
      NORMAL.names.forEach(name => {
        this.proxyNativeTracksForType_(name);
      });
    }

    /**
     * Create the `Html5` Tech's DOM element.
     *
     * @return {Element}
     *         The element that gets created.
     */
    createEl() {
      let el = this.options_.tag;

      // Check if this browser supports moving the element into the box.
      // On the iPhone video will break if you move the element,
      // So we have to create a brand new element.
      // If we ingested the player div, we do not need to move the media element.
      if (!el || !(this.options_.playerElIngest || this.movingMediaElementInDOM)) {
        // If the original tag is still there, clone and remove it.
        if (el) {
          const clone = el.cloneNode(true);
          if (el.parentNode) {
            el.parentNode.insertBefore(clone, el);
          }
          Html5.disposeMediaElement(el);
          el = clone;
        } else {
          el = document.createElement('video');

          // determine if native controls should be used
          const tagAttributes = this.options_.tag && getAttributes(this.options_.tag);
          const attributes = merge({}, tagAttributes);
          if (!TOUCH_ENABLED || this.options_.nativeControlsForTouch !== true) {
            delete attributes.controls;
          }
          setAttributes(el, Object.assign(attributes, {
            id: this.options_.techId,
            class: 'vjs-tech'
          }));
        }
        el.playerId = this.options_.playerId;
      }
      if (typeof this.options_.preload !== 'undefined') {
        setAttribute(el, 'preload', this.options_.preload);
      }
      if (this.options_.disablePictureInPicture !== undefined) {
        el.disablePictureInPicture = this.options_.disablePictureInPicture;
      }

      // Update specific tag settings, in case they were overridden
      // `autoplay` has to be *last* so that `muted` and `playsinline` are present
      // when iOS/Safari or other browsers attempt to autoplay.
      const settingsAttrs = ['loop', 'muted', 'playsinline', 'autoplay'];
      for (let i = 0; i < settingsAttrs.length; i++) {
        const attr = settingsAttrs[i];
        const value = this.options_[attr];
        if (typeof value !== 'undefined') {
          if (value) {
            setAttribute(el, attr, attr);
          } else {
            removeAttribute(el, attr);
          }
          el[attr] = value;
        }
      }
      return el;
    }

    /**
     * This will be triggered if the loadstart event has already fired, before videojs was
     * ready. Two known examples of when this can happen are:
     * 1. If we're loading the playback object after it has started loading
     * 2. The media is already playing the (often with autoplay on) then
     *
     * This function will fire another loadstart so that videojs can catchup.
     *
     * @fires Tech#loadstart
     *
     * @return {undefined}
     *         returns nothing.
     */
    handleLateInit_(el) {
      if (el.networkState === 0 || el.networkState === 3) {
        // The video element hasn't started loading the source yet
        // or didn't find a source
        return;
      }
      if (el.readyState === 0) {
        // NetworkState is set synchronously BUT loadstart is fired at the
        // end of the current stack, usually before setInterval(fn, 0).
        // So at this point we know loadstart may have already fired or is
        // about to fire, and either way the player hasn't seen it yet.
        // We don't want to fire loadstart prematurely here and cause a
        // double loadstart so we'll wait and see if it happens between now
        // and the next loop, and fire it if not.
        // HOWEVER, we also want to make sure it fires before loadedmetadata
        // which could also happen between now and the next loop, so we'll
        // watch for that also.
        let loadstartFired = false;
        const setLoadstartFired = function () {
          loadstartFired = true;
        };
        this.on('loadstart', setLoadstartFired);
        const triggerLoadstart = function () {
          // We did miss the original loadstart. Make sure the player
          // sees loadstart before loadedmetadata
          if (!loadstartFired) {
            this.trigger('loadstart');
          }
        };
        this.on('loadedmetadata', triggerLoadstart);
        this.ready(function () {
          this.off('loadstart', setLoadstartFired);
          this.off('loadedmetadata', triggerLoadstart);
          if (!loadstartFired) {
            // We did miss the original native loadstart. Fire it now.
            this.trigger('loadstart');
          }
        });
        return;
      }

      // From here on we know that loadstart already fired and we missed it.
      // The other readyState events aren't as much of a problem if we double
      // them, so not going to go to as much trouble as loadstart to prevent
      // that unless we find reason to.
      const eventsToTrigger = ['loadstart'];

      // loadedmetadata: newly equal to HAVE_METADATA (1) or greater
      eventsToTrigger.push('loadedmetadata');

      // loadeddata: newly increased to HAVE_CURRENT_DATA (2) or greater
      if (el.readyState >= 2) {
        eventsToTrigger.push('loadeddata');
      }

      // canplay: newly increased to HAVE_FUTURE_DATA (3) or greater
      if (el.readyState >= 3) {
        eventsToTrigger.push('canplay');
      }

      // canplaythrough: newly equal to HAVE_ENOUGH_DATA (4)
      if (el.readyState >= 4) {
        eventsToTrigger.push('canplaythrough');
      }

      // We still need to give the player time to add event listeners
      this.ready(function () {
        eventsToTrigger.forEach(function (type) {
          this.trigger(type);
        }, this);
      });
    }

    /**
     * Set whether we are scrubbing or not.
     * This is used to decide whether we should use `fastSeek` or not.
     * `fastSeek` is used to provide trick play on Safari browsers.
     *
     * @param {boolean} isScrubbing
     *                  - true for we are currently scrubbing
     *                  - false for we are no longer scrubbing
     */
    setScrubbing(isScrubbing) {
      this.isScrubbing_ = isScrubbing;
    }

    /**
     * Get whether we are scrubbing or not.
     *
     * @return {boolean} isScrubbing
     *                  - true for we are currently scrubbing
     *                  - false for we are no longer scrubbing
     */
    scrubbing() {
      return this.isScrubbing_;
    }

    /**
     * Set current time for the `HTML5` tech.
     *
     * @param {number} seconds
     *        Set the current time of the media to this.
     */
    setCurrentTime(seconds) {
      try {
        if (this.isScrubbing_ && this.el_.fastSeek && IS_ANY_SAFARI) {
          this.el_.fastSeek(seconds);
        } else {
          this.el_.currentTime = seconds;
        }
      } catch (e) {
        log(e, 'Video is not ready. (Video.js)');
        // this.warning(VideoJS.warnings.videoNotReady);
      }
    }

    /**
     * Get the current duration of the HTML5 media element.
     *
     * @return {number}
     *         The duration of the media or 0 if there is no duration.
     */
    duration() {
      // Android Chrome will report duration as Infinity for VOD HLS until after
      // playback has started, which triggers the live display erroneously.
      // Return NaN if playback has not started and trigger a durationupdate once
      // the duration can be reliably known.
      if (this.el_.duration === Infinity && IS_ANDROID && IS_CHROME && this.el_.currentTime === 0) {
        // Wait for the first `timeupdate` with currentTime > 0 - there may be
        // several with 0
        const checkProgress = () => {
          if (this.el_.currentTime > 0) {
            // Trigger durationchange for genuinely live video
            if (this.el_.duration === Infinity) {
              this.trigger('durationchange');
            }
            this.off('timeupdate', checkProgress);
          }
        };
        this.on('timeupdate', checkProgress);
        return NaN;
      }
      return this.el_.duration || NaN;
    }

    /**
     * Get the current width of the HTML5 media element.
     *
     * @return {number}
     *         The width of the HTML5 media element.
     */
    width() {
      return this.el_.offsetWidth;
    }

    /**
     * Get the current height of the HTML5 media element.
     *
     * @return {number}
     *         The height of the HTML5 media element.
     */
    height() {
      return this.el_.offsetHeight;
    }

    /**
     * Proxy iOS `webkitbeginfullscreen` and `webkitendfullscreen` into
     * `fullscreenchange` event.
     *
     * @private
     * @fires fullscreenchange
     * @listens webkitendfullscreen
     * @listens webkitbeginfullscreen
     * @listens webkitbeginfullscreen
     */
    proxyWebkitFullscreen_() {
      if (!('webkitDisplayingFullscreen' in this.el_)) {
        return;
      }
      const endFn = function () {
        this.trigger('fullscreenchange', {
          isFullscreen: false
        });
        // Safari will sometimes set controls on the videoelement when existing fullscreen.
        if (this.el_.controls && !this.options_.nativeControlsForTouch && this.controls()) {
          this.el_.controls = false;
        }
      };
      const beginFn = function () {
        if ('webkitPresentationMode' in this.el_ && this.el_.webkitPresentationMode !== 'picture-in-picture') {
          this.one('webkitendfullscreen', endFn);
          this.trigger('fullscreenchange', {
            isFullscreen: true,
            // set a flag in case another tech triggers fullscreenchange
            nativeIOSFullscreen: true
          });
        }
      };
      this.on('webkitbeginfullscreen', beginFn);
      this.on('dispose', () => {
        this.off('webkitbeginfullscreen', beginFn);
        this.off('webkitendfullscreen', endFn);
      });
    }

    /**
     * Check if fullscreen is supported on the video el.
     *
     * @return {boolean}
     *         - True if fullscreen is supported.
     *         - False if fullscreen is not supported.
     */
    supportsFullScreen() {
      return typeof this.el_.webkitEnterFullScreen === 'function';
    }

    /**
     * Request that the `HTML5` Tech enter fullscreen.
     */
    enterFullScreen() {
      const video = this.el_;
      if (video.paused && video.networkState <= video.HAVE_METADATA) {
        // attempt to prime the video element for programmatic access
        // this isn't necessary on the desktop but shouldn't hurt
        silencePromise(this.el_.play());

        // playing and pausing synchronously during the transition to fullscreen
        // can get iOS ~6.1 devices into a play/pause loop
        this.setTimeout(function () {
          video.pause();
          try {
            video.webkitEnterFullScreen();
          } catch (e) {
            this.trigger('fullscreenerror', e);
          }
        }, 0);
      } else {
        try {
          video.webkitEnterFullScreen();
        } catch (e) {
          this.trigger('fullscreenerror', e);
        }
      }
    }

    /**
     * Request that the `HTML5` Tech exit fullscreen.
     */
    exitFullScreen() {
      if (!this.el_.webkitDisplayingFullscreen) {
        this.trigger('fullscreenerror', new Error('The video is not fullscreen'));
        return;
      }
      this.el_.webkitExitFullScreen();
    }

    /**
     * Create a floating video window always on top of other windows so that users may
     * continue consuming media while they interact with other content sites, or
     * applications on their device.
     *
     * @see [Spec]{@link https://wicg.github.io/picture-in-picture}
     *
     * @return {Promise}
     *         A promise with a Picture-in-Picture window.
     */
    requestPictureInPicture() {
      return this.el_.requestPictureInPicture();
    }

    /**
     * Native requestVideoFrameCallback if supported by browser/tech, or fallback
     * Don't use rVCF on Safari when DRM is playing, as it doesn't fire
     * Needs to be checked later than the constructor
     * This will be a false positive for clear sources loaded after a Fairplay source
     *
     * @param {function} cb function to call
     * @return {number} id of request
     */
    requestVideoFrameCallback(cb) {
      if (this.featuresVideoFrameCallback && !this.el_.webkitKeys) {
        return this.el_.requestVideoFrameCallback(cb);
      }
      return super.requestVideoFrameCallback(cb);
    }

    /**
     * Native or fallback requestVideoFrameCallback
     *
     * @param {number} id request id to cancel
     */
    cancelVideoFrameCallback(id) {
      if (this.featuresVideoFrameCallback && !this.el_.webkitKeys) {
        this.el_.cancelVideoFrameCallback(id);
      } else {
        super.cancelVideoFrameCallback(id);
      }
    }

    /**
     * A getter/setter for the `Html5` Tech's source object.
     * > Note: Please use {@link Html5#setSource}
     *
     * @param {Tech~SourceObject} [src]
     *        The source object you want to set on the `HTML5` techs element.
     *
     * @return {Tech~SourceObject|undefined}
     *         - The current source object when a source is not passed in.
     *         - undefined when setting
     *
     * @deprecated Since version 5.
     */
    src(src) {
      if (src === undefined) {
        return this.el_.src;
      }

      // Setting src through `src` instead of `setSrc` will be deprecated
      this.setSrc(src);
    }

    /**
     * Reset the tech by removing all sources and then calling
     * {@link Html5.resetMediaElement}.
     */
    reset() {
      Html5.resetMediaElement(this.el_);
    }

    /**
     * Get the current source on the `HTML5` Tech. Falls back to returning the source from
     * the HTML5 media element.
     *
     * @return {Tech~SourceObject}
     *         The current source object from the HTML5 tech. With a fallback to the
     *         elements source.
     */
    currentSrc() {
      if (this.currentSource_) {
        return this.currentSource_.src;
      }
      return this.el_.currentSrc;
    }

    /**
     * Set controls attribute for the HTML5 media Element.
     *
     * @param {string} val
     *        Value to set the controls attribute to
     */
    setControls(val) {
      this.el_.controls = !!val;
    }

    /**
     * Create and returns a remote {@link TextTrack} object.
     *
     * @param {string} kind
     *        `TextTrack` kind (subtitles, captions, descriptions, chapters, or metadata)
     *
     * @param {string} [label]
     *        Label to identify the text track
     *
     * @param {string} [language]
     *        Two letter language abbreviation
     *
     * @return {TextTrack}
     *         The TextTrack that gets created.
     */
    addTextTrack(kind, label, language) {
      if (!this.featuresNativeTextTracks) {
        return super.addTextTrack(kind, label, language);
      }
      return this.el_.addTextTrack(kind, label, language);
    }

    /**
     * Creates either native TextTrack or an emulated TextTrack depending
     * on the value of `featuresNativeTextTracks`
     *
     * @param {Object} options
     *        The object should contain the options to initialize the TextTrack with.
     *
     * @param {string} [options.kind]
     *        `TextTrack` kind (subtitles, captions, descriptions, chapters, or metadata).
     *
     * @param {string} [options.label]
     *        Label to identify the text track
     *
     * @param {string} [options.language]
     *        Two letter language abbreviation.
     *
     * @param {boolean} [options.default]
     *        Default this track to on.
     *
     * @param {string} [options.id]
     *        The internal id to assign this track.
     *
     * @param {string} [options.src]
     *        A source url for the track.
     *
     * @return {HTMLTrackElement}
     *         The track element that gets created.
     */
    createRemoteTextTrack(options) {
      if (!this.featuresNativeTextTracks) {
        return super.createRemoteTextTrack(options);
      }
      const htmlTrackElement = document.createElement('track');
      if (options.kind) {
        htmlTrackElement.kind = options.kind;
      }
      if (options.label) {
        htmlTrackElement.label = options.label;
      }
      if (options.language || options.srclang) {
        htmlTrackElement.srclang = options.language || options.srclang;
      }
      if (options.default) {
        htmlTrackElement.default = options.default;
      }
      if (options.id) {
        htmlTrackElement.id = options.id;
      }
      if (options.src) {
        htmlTrackElement.src = options.src;
      }
      return htmlTrackElement;
    }

    /**
     * Creates a remote text track object and returns an html track element.
     *
     * @param {Object} options The object should contain values for
     * kind, language, label, and src (location of the WebVTT file)
     * @param {boolean} [manualCleanup=false] if set to true, the TextTrack
     * will not be removed from the TextTrackList and HtmlTrackElementList
     * after a source change
     * @return {HTMLTrackElement} An Html Track Element.
     * This can be an emulated {@link HTMLTrackElement} or a native one.
     *
     */
    addRemoteTextTrack(options, manualCleanup) {
      const htmlTrackElement = super.addRemoteTextTrack(options, manualCleanup);
      if (this.featuresNativeTextTracks) {
        this.el().appendChild(htmlTrackElement);
      }
      return htmlTrackElement;
    }

    /**
     * Remove remote `TextTrack` from `TextTrackList` object
     *
     * @param {TextTrack} track
     *        `TextTrack` object to remove
     */
    removeRemoteTextTrack(track) {
      super.removeRemoteTextTrack(track);
      if (this.featuresNativeTextTracks) {
        const tracks = this.$$('track');
        let i = tracks.length;
        while (i--) {
          if (track === tracks[i] || track === tracks[i].track) {
            this.el().removeChild(tracks[i]);
          }
        }
      }
    }

    /**
     * Gets available media playback quality metrics as specified by the W3C's Media
     * Playback Quality API.
     *
     * @see [Spec]{@link https://wicg.github.io/media-playback-quality}
     *
     * @return {Object}
     *         An object with supported media playback quality metrics
     */
    getVideoPlaybackQuality() {
      if (typeof this.el().getVideoPlaybackQuality === 'function') {
        return this.el().getVideoPlaybackQuality();
      }
      const videoPlaybackQuality = {};
      if (typeof this.el().webkitDroppedFrameCount !== 'undefined' && typeof this.el().webkitDecodedFrameCount !== 'undefined') {
        videoPlaybackQuality.droppedVideoFrames = this.el().webkitDroppedFrameCount;
        videoPlaybackQuality.totalVideoFrames = this.el().webkitDecodedFrameCount;
      }
      if (window.performance) {
        videoPlaybackQuality.creationTime = window.performance.now();
      }
      return videoPlaybackQuality;
    }
  }

  /* HTML5 Support Testing ---------------------------------------------------- */

  /**
   * Element for testing browser HTML5 media capabilities
   *
   * @type {Element}
   * @constant
   * @private
   */
  defineLazyProperty(Html5, 'TEST_VID', function () {
    if (!isReal()) {
      return;
    }
    const video = document.createElement('video');
    const track = document.createElement('track');
    track.kind = 'captions';
    track.srclang = 'en';
    track.label = 'English';
    video.appendChild(track);
    return video;
  });

  /**
   * Check if HTML5 media is supported by this browser/device.
   *
   * @return {boolean}
   *         - True if HTML5 media is supported.
   *         - False if HTML5 media is not supported.
   */
  Html5.isSupported = function () {
    // IE with no Media Player is a LIAR! (#984)
    try {
      Html5.TEST_VID.volume = 0.5;
    } catch (e) {
      return false;
    }
    return !!(Html5.TEST_VID && Html5.TEST_VID.canPlayType);
  };

  /**
   * Check if the tech can support the given type
   *
   * @param {string} type
   *        The mimetype to check
   * @return {string} 'probably', 'maybe', or '' (empty string)
   */
  Html5.canPlayType = function (type) {
    return Html5.TEST_VID.canPlayType(type);
  };

  /**
   * Check if the tech can support the given source
   *
   * @param {Object} srcObj
   *        The source object
   * @param {Object} options
   *        The options passed to the tech
   * @return {string} 'probably', 'maybe', or '' (empty string)
   */
  Html5.canPlaySource = function (srcObj, options) {
    return Html5.canPlayType(srcObj.type);
  };

  /**
   * Check if the volume can be changed in this browser/device.
   * Volume cannot be changed in a lot of mobile devices.
   * Specifically, it can't be changed from 1 on iOS.
   *
   * @return {boolean}
   *         - True if volume can be controlled
   *         - False otherwise
   */
  Html5.canControlVolume = function () {
    // IE will error if Windows Media Player not installed #3315
    try {
      const volume = Html5.TEST_VID.volume;
      Html5.TEST_VID.volume = volume / 2 + 0.1;
      const canControl = volume !== Html5.TEST_VID.volume;

      // With the introduction of iOS 15, there are cases where the volume is read as
      // changed but reverts back to its original state at the start of the next tick.
      // To determine whether volume can be controlled on iOS,
      // a timeout is set and the volume is checked asynchronously.
      // Since `features` doesn't currently work asynchronously, the value is manually set.
      if (canControl && IS_IOS) {
        window.setTimeout(() => {
          if (Html5 && Html5.prototype) {
            Html5.prototype.featuresVolumeControl = volume !== Html5.TEST_VID.volume;
          }
        });

        // default iOS to false, which will be updated in the timeout above.
        return false;
      }
      return canControl;
    } catch (e) {
      return false;
    }
  };

  /**
   * Check if the volume can be muted in this browser/device.
   * Some devices, e.g. iOS, don't allow changing volume
   * but permits muting/unmuting.
   *
   * @return {boolean}
   *      - True if volume can be muted
   *      - False otherwise
   */
  Html5.canMuteVolume = function () {
    try {
      const muted = Html5.TEST_VID.muted;

      // in some versions of iOS muted property doesn't always
      // work, so we want to set both property and attribute
      Html5.TEST_VID.muted = !muted;
      if (Html5.TEST_VID.muted) {
        setAttribute(Html5.TEST_VID, 'muted', 'muted');
      } else {
        removeAttribute(Html5.TEST_VID, 'muted', 'muted');
      }
      return muted !== Html5.TEST_VID.muted;
    } catch (e) {
      return false;
    }
  };

  /**
   * Check if the playback rate can be changed in this browser/device.
   *
   * @return {boolean}
   *         - True if playback rate can be controlled
   *         - False otherwise
   */
  Html5.canControlPlaybackRate = function () {
    // Playback rate API is implemented in Android Chrome, but doesn't do anything
    // https://github.com/videojs/video.js/issues/3180
    if (IS_ANDROID && IS_CHROME && CHROME_VERSION < 58) {
      return false;
    }
    // IE will error if Windows Media Player not installed #3315
    try {
      const playbackRate = Html5.TEST_VID.playbackRate;
      Html5.TEST_VID.playbackRate = playbackRate / 2 + 0.1;
      return playbackRate !== Html5.TEST_VID.playbackRate;
    } catch (e) {
      return false;
    }
  };

  /**
   * Check if we can override a video/audio elements attributes, with
   * Object.defineProperty.
   *
   * @return {boolean}
   *         - True if builtin attributes can be overridden
   *         - False otherwise
   */
  Html5.canOverrideAttributes = function () {
    // if we cannot overwrite the src/innerHTML property, there is no support
    // iOS 7 safari for instance cannot do this.
    try {
      const noop = () => {};
      Object.defineProperty(document.createElement('video'), 'src', {
        get: noop,
        set: noop
      });
      Object.defineProperty(document.createElement('audio'), 'src', {
        get: noop,
        set: noop
      });
      Object.defineProperty(document.createElement('video'), 'innerHTML', {
        get: noop,
        set: noop
      });
      Object.defineProperty(document.createElement('audio'), 'innerHTML', {
        get: noop,
        set: noop
      });
    } catch (e) {
      return false;
    }
    return true;
  };

  /**
   * Check to see if native `TextTrack`s are supported by this browser/device.
   *
   * @return {boolean}
   *         - True if native `TextTrack`s are supported.
   *         - False otherwise
   */
  Html5.supportsNativeTextTracks = function () {
    return IS_ANY_SAFARI || IS_IOS && IS_CHROME;
  };

  /**
   * Check to see if native `VideoTrack`s are supported by this browser/device
   *
   * @return {boolean}
   *        - True if native `VideoTrack`s are supported.
   *        - False otherwise
   */
  Html5.supportsNativeVideoTracks = function () {
    return !!(Html5.TEST_VID && Html5.TEST_VID.videoTracks);
  };

  /**
   * Check to see if native `AudioTrack`s are supported by this browser/device
   *
   * @return {boolean}
   *        - True if native `AudioTrack`s are supported.
   *        - False otherwise
   */
  Html5.supportsNativeAudioTracks = function () {
    return !!(Html5.TEST_VID && Html5.TEST_VID.audioTracks);
  };

  /**
   * An array of events available on the Html5 tech.
   *
   * @private
   * @type {Array}
   */
  Html5.Events = ['loadstart', 'suspend', 'abort', 'error', 'emptied', 'stalled', 'loadedmetadata', 'loadeddata', 'canplay', 'canplaythrough', 'playing', 'waiting', 'seeking', 'seeked', 'ended', 'durationchange', 'timeupdate', 'progress', 'play', 'pause', 'ratechange', 'resize', 'volumechange'];

  /**
   * Boolean indicating whether the `Tech` supports volume control.
   *
   * @type {boolean}
   * @default {@link Html5.canControlVolume}
   */
  /**
   * Boolean indicating whether the `Tech` supports muting volume.
   *
   * @type {boolean}
   * @default {@link Html5.canMuteVolume}
   */

  /**
   * Boolean indicating whether the `Tech` supports changing the speed at which the media
   * plays. Examples:
   *   - Set player to play 2x (twice) as fast
   *   - Set player to play 0.5x (half) as fast
   *
   * @type {boolean}
   * @default {@link Html5.canControlPlaybackRate}
   */

  /**
   * Boolean indicating whether the `Tech` supports the `sourceset` event.
   *
   * @type {boolean}
   * @default
   */
  /**
   * Boolean indicating whether the `HTML5` tech currently supports native `TextTrack`s.
   *
   * @type {boolean}
   * @default {@link Html5.supportsNativeTextTracks}
   */
  /**
   * Boolean indicating whether the `HTML5` tech currently supports native `VideoTrack`s.
   *
   * @type {boolean}
   * @default {@link Html5.supportsNativeVideoTracks}
   */
  /**
   * Boolean indicating whether the `HTML5` tech currently supports native `AudioTrack`s.
   *
   * @type {boolean}
   * @default {@link Html5.supportsNativeAudioTracks}
   */
  [['featuresMuteControl', 'canMuteVolume'], ['featuresPlaybackRate', 'canControlPlaybackRate'], ['featuresSourceset', 'canOverrideAttributes'], ['featuresNativeTextTracks', 'supportsNativeTextTracks'], ['featuresNativeVideoTracks', 'supportsNativeVideoTracks'], ['featuresNativeAudioTracks', 'supportsNativeAudioTracks']].forEach(function ([key, fn]) {
    defineLazyProperty(Html5.prototype, key, () => Html5[fn](), true);
  });
  Html5.prototype.featuresVolumeControl = Html5.canControlVolume();

  /**
   * Boolean indicating whether the `HTML5` tech currently supports the media element
   * moving in the DOM. iOS breaks if you move the media element, so this is set this to
   * false there. Everywhere else this should be true.
   *
   * @type {boolean}
   * @default
   */
  Html5.prototype.movingMediaElementInDOM = !IS_IOS;

  // TODO: Previous comment: No longer appears to be used. Can probably be removed.
  //       Is this true?
  /**
   * Boolean indicating whether the `HTML5` tech currently supports automatic media resize
   * when going into fullscreen.
   *
   * @type {boolean}
   * @default
   */
  Html5.prototype.featuresFullscreenResize = true;

  /**
   * Boolean indicating whether the `HTML5` tech currently supports the progress event.
   * If this is false, manual `progress` events will be triggered instead.
   *
   * @type {boolean}
   * @default
   */
  Html5.prototype.featuresProgressEvents = true;

  /**
   * Boolean indicating whether the `HTML5` tech currently supports the timeupdate event.
   * If this is false, manual `timeupdate` events will be triggered instead.
   *
   * @default
   */
  Html5.prototype.featuresTimeupdateEvents = true;

  /**
   * Whether the HTML5 el supports `requestVideoFrameCallback`
   *
   * @type {boolean}
   */
  Html5.prototype.featuresVideoFrameCallback = !!(Html5.TEST_VID && Html5.TEST_VID.requestVideoFrameCallback);
  Html5.disposeMediaElement = function (el) {
    if (!el) {
      return;
    }
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
        } catch (e) {
          // not supported
        }
      })();
    }
  };
  Html5.resetMediaElement = function (el) {
    if (!el) {
      return;
    }
    const sources = el.querySelectorAll('source');
    let i = sources.length;
    while (i--) {
      el.removeChild(sources[i]);
    }

    // remove any src reference.
    // not setting `src=''` because that throws an error
    el.removeAttribute('src');
    if (typeof el.load === 'function') {
      // wrapping in an iife so it's not deoptimized (#1060#discussion_r10324473)
      (function () {
        try {
          el.load();
        } catch (e) {
          // satisfy linter
        }
      })();
    }
  };

  /* Native HTML5 element property wrapping ----------------------------------- */
  // Wrap native boolean attributes with getters that check both property and attribute
  // The list is as followed:
  // muted, defaultMuted, autoplay, controls, loop, playsinline
  [
  /**
   * Get the value of `muted` from the media element. `muted` indicates
   * that the volume for the media should be set to silent. This does not actually change
   * the `volume` attribute.
   *
   * @method Html5#muted
   * @return {boolean}
   *         - True if the value of `volume` should be ignored and the audio set to silent.
   *         - False if the value of `volume` should be used.
   *
   * @see [Spec]{@link https://www.w3.org/TR/html5/embedded-content-0.html#dom-media-muted}
   */
  'muted',
  /**
   * Get the value of `defaultMuted` from the media element. `defaultMuted` indicates
   * whether the media should start muted or not. Only changes the default state of the
   * media. `muted` and `defaultMuted` can have different values. {@link Html5#muted} indicates the
   * current state.
   *
   * @method Html5#defaultMuted
   * @return {boolean}
   *         - The value of `defaultMuted` from the media element.
   *         - True indicates that the media should start muted.
   *         - False indicates that the media should not start muted
   *
   * @see [Spec]{@link https://www.w3.org/TR/html5/embedded-content-0.html#dom-media-defaultmuted}
   */
  'defaultMuted',
  /**
   * Get the value of `autoplay` from the media element. `autoplay` indicates
   * that the media should start to play as soon as the page is ready.
   *
   * @method Html5#autoplay
   * @return {boolean}
   *         - The value of `autoplay` from the media element.
   *         - True indicates that the media should start as soon as the page loads.
   *         - False indicates that the media should not start as soon as the page loads.
   *
   * @see [Spec]{@link https://www.w3.org/TR/html5/embedded-content-0.html#attr-media-autoplay}
   */
  'autoplay',
  /**
   * Get the value of `controls` from the media element. `controls` indicates
   * whether the native media controls should be shown or hidden.
   *
   * @method Html5#controls
   * @return {boolean}
   *         - The value of `controls` from the media element.
   *         - True indicates that native controls should be showing.
   *         - False indicates that native controls should be hidden.
   *
   * @see [Spec]{@link https://www.w3.org/TR/html5/embedded-content-0.html#attr-media-controls}
   */
  'controls',
  /**
   * Get the value of `loop` from the media element. `loop` indicates
   * that the media should return to the start of the media and continue playing once
   * it reaches the end.
   *
   * @method Html5#loop
   * @return {boolean}
   *         - The value of `loop` from the media element.
   *         - True indicates that playback should seek back to start once
   *           the end of a media is reached.
   *         - False indicates that playback should not loop back to the start when the
   *           end of the media is reached.
   *
   * @see [Spec]{@link https://www.w3.org/TR/html5/embedded-content-0.html#attr-media-loop}
   */
  'loop',
  /**
   * Get the value of `playsinline` from the media element. `playsinline` indicates
   * to the browser that non-fullscreen playback is preferred when fullscreen
   * playback is the native default, such as in iOS Safari.
   *
   * @method Html5#playsinline
   * @return {boolean}
   *         - The value of `playsinline` from the media element.
   *         - True indicates that the media should play inline.
   *         - False indicates that the media should not play inline.
   *
   * @see [Spec]{@link https://html.spec.whatwg.org/#attr-video-playsinline}
   */
  'playsinline'].forEach(function (prop) {
    Html5.prototype[prop] = function () {
      return this.el_[prop] || this.el_.hasAttribute(prop);
    };
  });

  // Wrap native boolean attributes with setters that set both property and attribute
  // The list is as followed:
  // setMuted, setDefaultMuted, setAutoplay, setLoop, setPlaysinline
  // setControls is special-cased above
  [
  /**
   * Set the value of `muted` on the media element. `muted` indicates that the current
   * audio level should be silent.
   *
   * @method Html5#setMuted
   * @param {boolean} muted
   *        - True if the audio should be set to silent
   *        - False otherwise
   *
   * @see [Spec]{@link https://www.w3.org/TR/html5/embedded-content-0.html#dom-media-muted}
   */
  'muted',
  /**
   * Set the value of `defaultMuted` on the media element. `defaultMuted` indicates that the current
   * audio level should be silent, but will only effect the muted level on initial playback..
   *
   * @method Html5.prototype.setDefaultMuted
   * @param {boolean} defaultMuted
   *        - True if the audio should be set to silent
   *        - False otherwise
   *
   * @see [Spec]{@link https://www.w3.org/TR/html5/embedded-content-0.html#dom-media-defaultmuted}
   */
  'defaultMuted',
  /**
   * Set the value of `autoplay` on the media element. `autoplay` indicates
   * that the media should start to play as soon as the page is ready.
   *
   * @method Html5#setAutoplay
   * @param {boolean} autoplay
   *         - True indicates that the media should start as soon as the page loads.
   *         - False indicates that the media should not start as soon as the page loads.
   *
   * @see [Spec]{@link https://www.w3.org/TR/html5/embedded-content-0.html#attr-media-autoplay}
   */
  'autoplay',
  /**
   * Set the value of `loop` on the media element. `loop` indicates
   * that the media should return to the start of the media and continue playing once
   * it reaches the end.
   *
   * @method Html5#setLoop
   * @param {boolean} loop
   *         - True indicates that playback should seek back to start once
   *           the end of a media is reached.
   *         - False indicates that playback should not loop back to the start when the
   *           end of the media is reached.
   *
   * @see [Spec]{@link https://www.w3.org/TR/html5/embedded-content-0.html#attr-media-loop}
   */
  'loop',
  /**
   * Set the value of `playsinline` from the media element. `playsinline` indicates
   * to the browser that non-fullscreen playback is preferred when fullscreen
   * playback is the native default, such as in iOS Safari.
   *
   * @method Html5#setPlaysinline
   * @param {boolean} playsinline
   *         - True indicates that the media should play inline.
   *         - False indicates that the media should not play inline.
   *
   * @see [Spec]{@link https://html.spec.whatwg.org/#attr-video-playsinline}
   */
  'playsinline'].forEach(function (prop) {
    Html5.prototype['set' + toTitleCase(prop)] = function (v) {
      this.el_[prop] = v;
      if (v) {
        this.el_.setAttribute(prop, prop);
      } else {
        this.el_.removeAttribute(prop);
      }
    };
  });

  // Wrap native properties with a getter
  // The list is as followed
  // paused, currentTime, buffered, volume, poster, preload, error, seeking
  // seekable, ended, playbackRate, defaultPlaybackRate, disablePictureInPicture
  // played, networkState, readyState, videoWidth, videoHeight, crossOrigin
  [
  /**
   * Get the value of `paused` from the media element. `paused` indicates whether the media element
   * is currently paused or not.
   *
   * @method Html5#paused
   * @return {boolean}
   *         The value of `paused` from the media element.
   *
   * @see [Spec]{@link https://www.w3.org/TR/html5/embedded-content-0.html#dom-media-paused}
   */
  'paused',
  /**
   * Get the value of `currentTime` from the media element. `currentTime` indicates
   * the current second that the media is at in playback.
   *
   * @method Html5#currentTime
   * @return {number}
   *         The value of `currentTime` from the media element.
   *
   * @see [Spec]{@link https://www.w3.org/TR/html5/embedded-content-0.html#dom-media-currenttime}
   */
  'currentTime',
  /**
   * Get the value of `buffered` from the media element. `buffered` is a `TimeRange`
   * object that represents the parts of the media that are already downloaded and
   * available for playback.
   *
   * @method Html5#buffered
   * @return {TimeRange}
   *         The value of `buffered` from the media element.
   *
   * @see [Spec]{@link https://www.w3.org/TR/html5/embedded-content-0.html#dom-media-buffered}
   */
  'buffered',
  /**
   * Get the value of `volume` from the media element. `volume` indicates
   * the current playback volume of audio for a media. `volume` will be a value from 0
   * (silent) to 1 (loudest and default).
   *
   * @method Html5#volume
   * @return {number}
   *         The value of `volume` from the media element. Value will be between 0-1.
   *
   * @see [Spec]{@link https://www.w3.org/TR/html5/embedded-content-0.html#dom-a-volume}
   */
  'volume',
  /**
   * Get the value of `poster` from the media element. `poster` indicates
   * that the url of an image file that can/will be shown when no media data is available.
   *
   * @method Html5#poster
   * @return {string}
   *         The value of `poster` from the media element. Value will be a url to an
   *         image.
   *
   * @see [Spec]{@link https://www.w3.org/TR/html5/embedded-content-0.html#attr-video-poster}
   */
  'poster',
  /**
   * Get the value of `preload` from the media element. `preload` indicates
   * what should download before the media is interacted with. It can have the following
   * values:
   * - none: nothing should be downloaded
   * - metadata: poster and the first few frames of the media may be downloaded to get
   *   media dimensions and other metadata
   * - auto: allow the media and metadata for the media to be downloaded before
   *    interaction
   *
   * @method Html5#preload
   * @return {string}
   *         The value of `preload` from the media element. Will be 'none', 'metadata',
   *         or 'auto'.
   *
   * @see [Spec]{@link https://www.w3.org/TR/html5/embedded-content-0.html#attr-media-preload}
   */
  'preload',
  /**
   * Get the value of the `error` from the media element. `error` indicates any
   * MediaError that may have occurred during playback. If error returns null there is no
   * current error.
   *
   * @method Html5#error
   * @return {MediaError|null}
   *         The value of `error` from the media element. Will be `MediaError` if there
   *         is a current error and null otherwise.
   *
   * @see [Spec]{@link https://www.w3.org/TR/html5/embedded-content-0.html#dom-media-error}
   */
  'error',
  /**
   * Get the value of `seeking` from the media element. `seeking` indicates whether the
   * media is currently seeking to a new position or not.
   *
   * @method Html5#seeking
   * @return {boolean}
   *         - The value of `seeking` from the media element.
   *         - True indicates that the media is currently seeking to a new position.
   *         - False indicates that the media is not seeking to a new position at this time.
   *
   * @see [Spec]{@link https://www.w3.org/TR/html5/embedded-content-0.html#dom-media-seeking}
   */
  'seeking',
  /**
   * Get the value of `seekable` from the media element. `seekable` returns a
   * `TimeRange` object indicating ranges of time that can currently be `seeked` to.
   *
   * @method Html5#seekable
   * @return {TimeRange}
   *         The value of `seekable` from the media element. A `TimeRange` object
   *         indicating the current ranges of time that can be seeked to.
   *
   * @see [Spec]{@link https://www.w3.org/TR/html5/embedded-content-0.html#dom-media-seekable}
   */
  'seekable',
  /**
   * Get the value of `ended` from the media element. `ended` indicates whether
   * the media has reached the end or not.
   *
   * @method Html5#ended
   * @return {boolean}
   *         - The value of `ended` from the media element.
   *         - True indicates that the media has ended.
   *         - False indicates that the media has not ended.
   *
   * @see [Spec]{@link https://www.w3.org/TR/html5/embedded-content-0.html#dom-media-ended}
   */
  'ended',
  /**
   * Get the value of `playbackRate` from the media element. `playbackRate` indicates
   * the rate at which the media is currently playing back. Examples:
   *   - if playbackRate is set to 2, media will play twice as fast.
   *   - if playbackRate is set to 0.5, media will play half as fast.
   *
   * @method Html5#playbackRate
   * @return {number}
   *         The value of `playbackRate` from the media element. A number indicating
   *         the current playback speed of the media, where 1 is normal speed.
   *
   * @see [Spec]{@link https://www.w3.org/TR/html5/embedded-content-0.html#dom-media-playbackrate}
   */
  'playbackRate',
  /**
   * Get the value of `defaultPlaybackRate` from the media element. `defaultPlaybackRate` indicates
   * the rate at which the media is currently playing back. This value will not indicate the current
   * `playbackRate` after playback has started, use {@link Html5#playbackRate} for that.
   *
   * Examples:
   *   - if defaultPlaybackRate is set to 2, media will play twice as fast.
   *   - if defaultPlaybackRate is set to 0.5, media will play half as fast.
   *
   * @method Html5.prototype.defaultPlaybackRate
   * @return {number}
   *         The value of `defaultPlaybackRate` from the media element. A number indicating
   *         the current playback speed of the media, where 1 is normal speed.
   *
   * @see [Spec]{@link https://www.w3.org/TR/html5/embedded-content-0.html#dom-media-playbackrate}
   */
  'defaultPlaybackRate',
  /**
   * Get the value of 'disablePictureInPicture' from the video element.
   *
   * @method Html5#disablePictureInPicture
   * @return {boolean} value
   *         - The value of `disablePictureInPicture` from the video element.
   *         - True indicates that the video can't be played in Picture-In-Picture mode
   *         - False indicates that the video can be played in Picture-In-Picture mode
   *
   * @see [Spec]{@link https://w3c.github.io/picture-in-picture/#disable-pip}
   */
  'disablePictureInPicture',
  /**
   * Get the value of `played` from the media element. `played` returns a `TimeRange`
   * object representing points in the media timeline that have been played.
   *
   * @method Html5#played
   * @return {TimeRange}
   *         The value of `played` from the media element. A `TimeRange` object indicating
   *         the ranges of time that have been played.
   *
   * @see [Spec]{@link https://www.w3.org/TR/html5/embedded-content-0.html#dom-media-played}
   */
  'played',
  /**
   * Get the value of `networkState` from the media element. `networkState` indicates
   * the current network state. It returns an enumeration from the following list:
   * - 0: NETWORK_EMPTY
   * - 1: NETWORK_IDLE
   * - 2: NETWORK_LOADING
   * - 3: NETWORK_NO_SOURCE
   *
   * @method Html5#networkState
   * @return {number}
   *         The value of `networkState` from the media element. This will be a number
   *         from the list in the description.
   *
   * @see [Spec] {@link https://www.w3.org/TR/html5/embedded-content-0.html#dom-media-networkstate}
   */
  'networkState',
  /**
   * Get the value of `readyState` from the media element. `readyState` indicates
   * the current state of the media element. It returns an enumeration from the
   * following list:
   * - 0: HAVE_NOTHING
   * - 1: HAVE_METADATA
   * - 2: HAVE_CURRENT_DATA
   * - 3: HAVE_FUTURE_DATA
   * - 4: HAVE_ENOUGH_DATA
   *
   * @method Html5#readyState
   * @return {number}
   *         The value of `readyState` from the media element. This will be a number
   *         from the list in the description.
   *
   * @see [Spec] {@link https://www.w3.org/TR/html5/embedded-content-0.html#ready-states}
   */
  'readyState',
  /**
   * Get the value of `videoWidth` from the video element. `videoWidth` indicates
   * the current width of the video in css pixels.
   *
   * @method Html5#videoWidth
   * @return {number}
   *         The value of `videoWidth` from the video element. This will be a number
   *         in css pixels.
   *
   * @see [Spec] {@link https://www.w3.org/TR/html5/embedded-content-0.html#dom-video-videowidth}
   */
  'videoWidth',
  /**
   * Get the value of `videoHeight` from the video element. `videoHeight` indicates
   * the current height of the video in css pixels.
   *
   * @method Html5#videoHeight
   * @return {number}
   *         The value of `videoHeight` from the video element. This will be a number
   *         in css pixels.
   *
   * @see [Spec] {@link https://www.w3.org/TR/html5/embedded-content-0.html#dom-video-videowidth}
   */
  'videoHeight',
  /**
   * Get the value of `crossOrigin` from the media element. `crossOrigin` indicates
   * to the browser that should sent the cookies along with the requests for the
   * different assets/playlists
   *
   * @method Html5#crossOrigin
   * @return {string}
   *         - anonymous indicates that the media should not sent cookies.
   *         - use-credentials indicates that the media should sent cookies along the requests.
   *
   * @see [Spec]{@link https://html.spec.whatwg.org/#attr-media-crossorigin}
   */
  'crossOrigin'].forEach(function (prop) {
    Html5.prototype[prop] = function () {
      return this.el_[prop];
    };
  });

  // Wrap native properties with a setter in this format:
  // set + toTitleCase(name)
  // The list is as follows:
  // setVolume, setSrc, setPoster, setPreload, setPlaybackRate, setDefaultPlaybackRate,
  // setDisablePictureInPicture, setCrossOrigin
  [
  /**
   * Set the value of `volume` on the media element. `volume` indicates the current
   * audio level as a percentage in decimal form. This means that 1 is 100%, 0.5 is 50%, and
   * so on.
   *
   * @method Html5#setVolume
   * @param {number} percentAsDecimal
   *        The volume percent as a decimal. Valid range is from 0-1.
   *
   * @see [Spec]{@link https://www.w3.org/TR/html5/embedded-content-0.html#dom-a-volume}
   */
  'volume',
  /**
   * Set the value of `src` on the media element. `src` indicates the current
   * {@link Tech~SourceObject} for the media.
   *
   * @method Html5#setSrc
   * @param {Tech~SourceObject} src
   *        The source object to set as the current source.
   *
   * @see [Spec]{@link https://www.w3.org/TR/html5/embedded-content-0.html#dom-media-src}
   */
  'src',
  /**
   * Set the value of `poster` on the media element. `poster` is the url to
   * an image file that can/will be shown when no media data is available.
   *
   * @method Html5#setPoster
   * @param {string} poster
   *        The url to an image that should be used as the `poster` for the media
   *        element.
   *
   * @see [Spec]{@link https://www.w3.org/TR/html5/embedded-content-0.html#attr-media-poster}
   */
  'poster',
  /**
   * Set the value of `preload` on the media element. `preload` indicates
   * what should download before the media is interacted with. It can have the following
   * values:
   * - none: nothing should be downloaded
   * - metadata: poster and the first few frames of the media may be downloaded to get
   *   media dimensions and other metadata
   * - auto: allow the media and metadata for the media to be downloaded before
   *    interaction
   *
   * @method Html5#setPreload
   * @param {string} preload
   *         The value of `preload` to set on the media element. Must be 'none', 'metadata',
   *         or 'auto'.
   *
   * @see [Spec]{@link https://www.w3.org/TR/html5/embedded-content-0.html#attr-media-preload}
   */
  'preload',
  /**
   * Set the value of `playbackRate` on the media element. `playbackRate` indicates
   * the rate at which the media should play back. Examples:
   *   - if playbackRate is set to 2, media will play twice as fast.
   *   - if playbackRate is set to 0.5, media will play half as fast.
   *
   * @method Html5#setPlaybackRate
   * @return {number}
   *         The value of `playbackRate` from the media element. A number indicating
   *         the current playback speed of the media, where 1 is normal speed.
   *
   * @see [Spec]{@link https://www.w3.org/TR/html5/embedded-content-0.html#dom-media-playbackrate}
   */
  'playbackRate',
  /**
   * Set the value of `defaultPlaybackRate` on the media element. `defaultPlaybackRate` indicates
   * the rate at which the media should play back upon initial startup. Changing this value
   * after a video has started will do nothing. Instead you should used {@link Html5#setPlaybackRate}.
   *
   * Example Values:
   *   - if playbackRate is set to 2, media will play twice as fast.
   *   - if playbackRate is set to 0.5, media will play half as fast.
   *
   * @method Html5.prototype.setDefaultPlaybackRate
   * @return {number}
   *         The value of `defaultPlaybackRate` from the media element. A number indicating
   *         the current playback speed of the media, where 1 is normal speed.
   *
   * @see [Spec]{@link https://www.w3.org/TR/html5/embedded-content-0.html#dom-media-defaultplaybackrate}
   */
  'defaultPlaybackRate',
  /**
   * Prevents the browser from suggesting a Picture-in-Picture context menu
   * or to request Picture-in-Picture automatically in some cases.
   *
   * @method Html5#setDisablePictureInPicture
   * @param {boolean} value
   *         The true value will disable Picture-in-Picture mode.
   *
   * @see [Spec]{@link https://w3c.github.io/picture-in-picture/#disable-pip}
   */
  'disablePictureInPicture',
  /**
   * Set the value of `crossOrigin` from the media element. `crossOrigin` indicates
   * to the browser that should sent the cookies along with the requests for the
   * different assets/playlists
   *
   * @method Html5#setCrossOrigin
   * @param {string} crossOrigin
   *         - anonymous indicates that the media should not sent cookies.
   *         - use-credentials indicates that the media should sent cookies along the requests.
   *
   * @see [Spec]{@link https://html.spec.whatwg.org/#attr-media-crossorigin}
   */
  'crossOrigin'].forEach(function (prop) {
    Html5.prototype['set' + toTitleCase(prop)] = function (v) {
      this.el_[prop] = v;
    };
  });

  // wrap native functions with a function
  // The list is as follows:
  // pause, load, play
  [
  /**
   * A wrapper around the media elements `pause` function. This will call the `HTML5`
   * media elements `pause` function.
   *
   * @method Html5#pause
   * @see [Spec]{@link https://www.w3.org/TR/html5/embedded-content-0.html#dom-media-pause}
   */
  'pause',
  /**
   * A wrapper around the media elements `load` function. This will call the `HTML5`s
   * media element `load` function.
   *
   * @method Html5#load
   * @see [Spec]{@link https://www.w3.org/TR/html5/embedded-content-0.html#dom-media-load}
   */
  'load',
  /**
   * A wrapper around the media elements `play` function. This will call the `HTML5`s
   * media element `play` function.
   *
   * @method Html5#play
   * @see [Spec]{@link https://www.w3.org/TR/html5/embedded-content-0.html#dom-media-play}
   */
  'play'].forEach(function (prop) {
    Html5.prototype[prop] = function () {
      return this.el_[prop]();
    };
  });
  Tech.withSourceHandlers(Html5);

  /**
   * Native source handler for Html5, simply passes the source to the media element.
   *
   * @property {Tech~SourceObject} source
   *        The source object
   *
   * @property {Html5} tech
   *        The instance of the HTML5 tech.
   */
  Html5.nativeSourceHandler = {};

  /**
   * Check if the media element can play the given mime type.
   *
   * @param {string} type
   *        The mimetype to check
   *
   * @return {string}
   *         'probably', 'maybe', or '' (empty string)
   */
  Html5.nativeSourceHandler.canPlayType = function (type) {
    // IE without MediaPlayer throws an error (#519)
    try {
      return Html5.TEST_VID.canPlayType(type);
    } catch (e) {
      return '';
    }
  };

  /**
   * Check if the media element can handle a source natively.
   *
   * @param {Tech~SourceObject} source
   *         The source object
   *
   * @param {Object} [options]
   *         Options to be passed to the tech.
   *
   * @return {string}
   *         'probably', 'maybe', or '' (empty string).
   */
  Html5.nativeSourceHandler.canHandleSource = function (source, options) {
    // If a type was provided we should rely on that
    if (source.type) {
      return Html5.nativeSourceHandler.canPlayType(source.type);

      // If no type, fall back to checking 'video/[EXTENSION]'
    } else if (source.src) {
      const ext = getFileExtension(source.src);
      return Html5.nativeSourceHandler.canPlayType(`video/${ext}`);
    }
    return '';
  };

  /**
   * Pass the source to the native media element.
   *
   * @param {Tech~SourceObject} source
   *        The source object
   *
   * @param {Html5} tech
   *        The instance of the Html5 tech
   *
   * @param {Object} [options]
   *        The options to pass to the source
   */
  Html5.nativeSourceHandler.handleSource = function (source, tech, options) {
    tech.setSrc(source.src);
  };

  /**
   * A noop for the native dispose function, as cleanup is not needed.
   */
  Html5.nativeSourceHandler.dispose = function () {};

  // Register the native source handler
  Html5.registerSourceHandler(Html5.nativeSourceHandler);
  Tech.registerTech('Html5', Html5);

  /**
   * @file player.js
   */

  // The following tech events are simply re-triggered
  // on the player when they happen
  const TECH_EVENTS_RETRIGGER = [
  /**
   * Fired while the user agent is downloading media data.
   *
   * @event Player#progress
   * @type {Event}
   */
  /**
   * Retrigger the `progress` event that was triggered by the {@link Tech}.
   *
   * @private
   * @method Player#handleTechProgress_
   * @fires Player#progress
   * @listens Tech#progress
   */
  'progress',
  /**
   * Fires when the loading of an audio/video is aborted.
   *
   * @event Player#abort
   * @type {Event}
   */
  /**
   * Retrigger the `abort` event that was triggered by the {@link Tech}.
   *
   * @private
   * @method Player#handleTechAbort_
   * @fires Player#abort
   * @listens Tech#abort
   */
  'abort',
  /**
   * Fires when the browser is intentionally not getting media data.
   *
   * @event Player#suspend
   * @type {Event}
   */
  /**
   * Retrigger the `suspend` event that was triggered by the {@link Tech}.
   *
   * @private
   * @method Player#handleTechSuspend_
   * @fires Player#suspend
   * @listens Tech#suspend
   */
  'suspend',
  /**
   * Fires when the current playlist is empty.
   *
   * @event Player#emptied
   * @type {Event}
   */
  /**
   * Retrigger the `emptied` event that was triggered by the {@link Tech}.
   *
   * @private
   * @method Player#handleTechEmptied_
   * @fires Player#emptied
   * @listens Tech#emptied
   */
  'emptied',
  /**
   * Fires when the browser is trying to get media data, but data is not available.
   *
   * @event Player#stalled
   * @type {Event}
   */
  /**
   * Retrigger the `stalled` event that was triggered by the {@link Tech}.
   *
   * @private
   * @method Player#handleTechStalled_
   * @fires Player#stalled
   * @listens Tech#stalled
   */
  'stalled',
  /**
   * Fires when the browser has loaded meta data for the audio/video.
   *
   * @event Player#loadedmetadata
   * @type {Event}
   */
  /**
   * Retrigger the `loadedmetadata` event that was triggered by the {@link Tech}.
   *
   * @private
   * @method Player#handleTechLoadedmetadata_
   * @fires Player#loadedmetadata
   * @listens Tech#loadedmetadata
   */
  'loadedmetadata',
  /**
   * Fires when the browser has loaded the current frame of the audio/video.
   *
   * @event Player#loadeddata
   * @type {event}
   */
  /**
   * Retrigger the `loadeddata` event that was triggered by the {@link Tech}.
   *
   * @private
   * @method Player#handleTechLoaddeddata_
   * @fires Player#loadeddata
   * @listens Tech#loadeddata
   */
  'loadeddata',
  /**
   * Fires when the current playback position has changed.
   *
   * @event Player#timeupdate
   * @type {event}
   */
  /**
   * Retrigger the `timeupdate` event that was triggered by the {@link Tech}.
   *
   * @private
   * @method Player#handleTechTimeUpdate_
   * @fires Player#timeupdate
   * @listens Tech#timeupdate
   */
  'timeupdate',
  /**
   * Fires when the video's intrinsic dimensions change
   *
   * @event Player#resize
   * @type {event}
   */
  /**
   * Retrigger the `resize` event that was triggered by the {@link Tech}.
   *
   * @private
   * @method Player#handleTechResize_
   * @fires Player#resize
   * @listens Tech#resize
   */
  'resize',
  /**
   * Fires when the volume has been changed
   *
   * @event Player#volumechange
   * @type {event}
   */
  /**
   * Retrigger the `volumechange` event that was triggered by the {@link Tech}.
   *
   * @private
   * @method Player#handleTechVolumechange_
   * @fires Player#volumechange
   * @listens Tech#volumechange
   */
  'volumechange',
  /**
   * Fires when the text track has been changed
   *
   * @event Player#texttrackchange
   * @type {event}
   */
  /**
   * Retrigger the `texttrackchange` event that was triggered by the {@link Tech}.
   *
   * @private
   * @method Player#handleTechTexttrackchange_
   * @fires Player#texttrackchange
   * @listens Tech#texttrackchange
   */
  'texttrackchange'];

  // events to queue when playback rate is zero
  // this is a hash for the sole purpose of mapping non-camel-cased event names
  // to camel-cased function names
  const TECH_EVENTS_QUEUE = {
    canplay: 'CanPlay',
    canplaythrough: 'CanPlayThrough',
    playing: 'Playing',
    seeked: 'Seeked'
  };
  const BREAKPOINT_ORDER = ['tiny', 'xsmall', 'small', 'medium', 'large', 'xlarge', 'huge'];
  const BREAKPOINT_CLASSES = {};

  // grep: vjs-layout-tiny
  // grep: vjs-layout-x-small
  // grep: vjs-layout-small
  // grep: vjs-layout-medium
  // grep: vjs-layout-large
  // grep: vjs-layout-x-large
  // grep: vjs-layout-huge
  BREAKPOINT_ORDER.forEach(k => {
    const v = k.charAt(0) === 'x' ? `x-${k.substring(1)}` : k;
    BREAKPOINT_CLASSES[k] = `vjs-layout-${v}`;
  });
  const DEFAULT_BREAKPOINTS = {
    tiny: 210,
    xsmall: 320,
    small: 425,
    medium: 768,
    large: 1440,
    xlarge: 2560,
    huge: Infinity
  };

  /**
   * An instance of the `Player` class is created when any of the Video.js setup methods
   * are used to initialize a video.
   *
   * After an instance has been created it can be accessed globally in three ways:
   * 1. By calling `videojs.getPlayer('example_video_1');`
   * 2. By calling `videojs('example_video_1');` (not recomended)
   * 2. By using it directly via  `videojs.players.example_video_1;`
   *
   * @extends Component
   * @global
   */
  class Player extends Component {
    /**
     * Create an instance of this class.
     *
     * @param {Element} tag
     *        The original video DOM element used for configuring options.
     *
     * @param {Object} [options]
     *        Object of option names and values.
     *
     * @param {Function} [ready]
     *        Ready callback function.
     */
    constructor(tag, options, ready) {
      // Make sure tag ID exists
      // also here.. probably better
      tag.id = tag.id || options.id || `vjs_video_${newGUID()}`;

      // Set Options
      // The options argument overrides options set in the video tag
      // which overrides globally set options.
      // This latter part coincides with the load order
      // (tag must exist before Player)
      options = Object.assign(Player.getTagSettings(tag), options);

      // Delay the initialization of children because we need to set up
      // player properties first, and can't use `this` before `super()`
      options.initChildren = false;

      // Same with creating the element
      options.createEl = false;

      // don't auto mixin the evented mixin
      options.evented = false;

      // we don't want the player to report touch activity on itself
      // see enableTouchActivity in Component
      options.reportTouchActivity = false;

      // If language is not set, get the closest lang attribute
      if (!options.language) {
        const closest = tag.closest('[lang]');
        if (closest) {
          options.language = closest.getAttribute('lang');
        }
      }

      // Run base component initializing with new options
      super(null, options, ready);

      // Create bound methods for document listeners.
      this.boundDocumentFullscreenChange_ = e => this.documentFullscreenChange_(e);
      this.boundFullWindowOnEscKey_ = e => this.fullWindowOnEscKey(e);
      this.boundUpdateStyleEl_ = e => this.updateStyleEl_(e);
      this.boundApplyInitTime_ = e => this.applyInitTime_(e);
      this.boundUpdateCurrentBreakpoint_ = e => this.updateCurrentBreakpoint_(e);
      this.boundHandleTechClick_ = e => this.handleTechClick_(e);
      this.boundHandleTechDoubleClick_ = e => this.handleTechDoubleClick_(e);
      this.boundHandleTechTouchStart_ = e => this.handleTechTouchStart_(e);
      this.boundHandleTechTouchMove_ = e => this.handleTechTouchMove_(e);
      this.boundHandleTechTouchEnd_ = e => this.handleTechTouchEnd_(e);
      this.boundHandleTechTap_ = e => this.handleTechTap_(e);

      // default isFullscreen_ to false
      this.isFullscreen_ = false;

      // create logger
      this.log = createLogger(this.id_);

      // Hold our own reference to fullscreen api so it can be mocked in tests
      this.fsApi_ = FullscreenApi;

      // Tracks when a tech changes the poster
      this.isPosterFromTech_ = false;

      // Holds callback info that gets queued when playback rate is zero
      // and a seek is happening
      this.queuedCallbacks_ = [];

      // Turn off API access because we're loading a new tech that might load asynchronously
      this.isReady_ = false;

      // Init state hasStarted_
      this.hasStarted_ = false;

      // Init state userActive_
      this.userActive_ = false;

      // Init debugEnabled_
      this.debugEnabled_ = false;

      // Init state audioOnlyMode_
      this.audioOnlyMode_ = false;

      // Init state audioPosterMode_
      this.audioPosterMode_ = false;

      // Init state audioOnlyCache_
      this.audioOnlyCache_ = {
        playerHeight: null,
        hiddenChildren: []
      };

      // if the global option object was accidentally blown away by
      // someone, bail early with an informative error
      if (!this.options_ || !this.options_.techOrder || !this.options_.techOrder.length) {
        throw new Error('No techOrder specified. Did you overwrite ' + 'videojs.options instead of just changing the ' + 'properties you want to override?');
      }

      // Store the original tag used to set options
      this.tag = tag;

      // Store the tag attributes used to restore html5 element
      this.tagAttributes = tag && getAttributes(tag);

      // Update current language
      this.language(this.options_.language);

      // Update Supported Languages
      if (options.languages) {
        // Normalise player option languages to lowercase
        const languagesToLower = {};
        Object.getOwnPropertyNames(options.languages).forEach(function (name) {
          languagesToLower[name.toLowerCase()] = options.languages[name];
        });
        this.languages_ = languagesToLower;
      } else {
        this.languages_ = Player.prototype.options_.languages;
      }
      this.resetCache_();

      // Set poster
      /** @type string */
      this.poster_ = options.poster || '';

      // Set controls
      /** @type {boolean} */
      this.controls_ = !!options.controls;

      // Original tag settings stored in options
      // now remove immediately so native controls don't flash.
      // May be turned back on by HTML5 tech if nativeControlsForTouch is true
      tag.controls = false;
      tag.removeAttribute('controls');
      this.changingSrc_ = false;
      this.playCallbacks_ = [];
      this.playTerminatedQueue_ = [];

      // the attribute overrides the option
      if (tag.hasAttribute('autoplay')) {
        this.autoplay(true);
      } else {
        // otherwise use the setter to validate and
        // set the correct value.
        this.autoplay(this.options_.autoplay);
      }

      // check plugins
      if (options.plugins) {
        Object.keys(options.plugins).forEach(name => {
          if (typeof this[name] !== 'function') {
            throw new Error(`plugin "${name}" does not exist`);
          }
        });
      }

      /*
       * Store the internal state of scrubbing
       *
       * @private
       * @return {Boolean} True if the user is scrubbing
       */
      this.scrubbing_ = false;
      this.el_ = this.createEl();

      // Make this an evented object and use `el_` as its event bus.
      evented(this, {
        eventBusKey: 'el_'
      });

      // listen to document and player fullscreenchange handlers so we receive those events
      // before a user can receive them so we can update isFullscreen appropriately.
      // make sure that we listen to fullscreenchange events before everything else to make sure that
      // our isFullscreen method is updated properly for internal components as well as external.
      if (this.fsApi_.requestFullscreen) {
        on(document, this.fsApi_.fullscreenchange, this.boundDocumentFullscreenChange_);
        this.on(this.fsApi_.fullscreenchange, this.boundDocumentFullscreenChange_);
      }
      if (this.fluid_) {
        this.on(['playerreset', 'resize'], this.boundUpdateStyleEl_);
      }
      // We also want to pass the original player options to each component and plugin
      // as well so they don't need to reach back into the player for options later.
      // We also need to do another copy of this.options_ so we don't end up with
      // an infinite loop.
      const playerOptionsCopy = merge(this.options_);

      // Load plugins
      if (options.plugins) {
        Object.keys(options.plugins).forEach(name => {
          this[name](options.plugins[name]);
        });
      }

      // Enable debug mode to fire debugon event for all plugins.
      if (options.debug) {
        this.debug(true);
      }
      this.options_.playerOptions = playerOptionsCopy;
      this.middleware_ = [];
      this.playbackRates(options.playbackRates);
      if (options.experimentalSvgIcons) {
        // Add SVG Sprite to the DOM
        const parser = new window.DOMParser();
        const parsedSVG = parser.parseFromString(icons, 'image/svg+xml');
        const errorNode = parsedSVG.querySelector('parsererror');
        if (errorNode) {
          log.warn('Failed to load SVG Icons. Falling back to Font Icons.');
          this.options_.experimentalSvgIcons = null;
        } else {
          const sprite = parsedSVG.documentElement;
          sprite.style.display = 'none';
          this.el_.appendChild(sprite);
          this.addClass('vjs-svg-icons-enabled');
        }
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

      // Set ARIA label and region role depending on player type
      this.el_.setAttribute('role', 'region');
      if (this.isAudio()) {
        this.el_.setAttribute('aria-label', this.localize('Audio Player'));
      } else {
        this.el_.setAttribute('aria-label', this.localize('Video Player'));
      }
      if (this.isAudio()) {
        this.addClass('vjs-audio');
      }

      // TODO: Make this smarter. Toggle user state between touching/mousing
      // using events, since devices can have both touch and mouse events.
      // TODO: Make this check be performed again when the window switches between monitors
      // (See https://github.com/videojs/video.js/issues/5683)
      if (TOUCH_ENABLED) {
        this.addClass('vjs-touch-enabled');
      }

      // iOS Safari has broken hover handling
      if (!IS_IOS) {
        this.addClass('vjs-workinghover');
      }

      // Make player easily findable by ID
      Player.players[this.id_] = this;

      // Add a major version class to aid css in plugins
      const majorVersion = version.split('.')[0];
      this.addClass(`vjs-v${majorVersion}`);

      // When the player is first initialized, trigger activity so components
      // like the control bar show themselves if needed
      this.userActive(true);
      this.reportUserActivity();
      this.one('play', e => this.listenForUserActivity_(e));
      this.on('keydown', e => this.handleKeyDown(e));
      this.on('languagechange', e => this.handleLanguagechange(e));
      this.breakpoints(this.options_.breakpoints);
      this.responsive(this.options_.responsive);

      // Calling both the audio mode methods after the player is fully
      // setup to be able to listen to the events triggered by them
      this.on('ready', () => {
        // Calling the audioPosterMode method first so that
        // the audioOnlyMode can take precedence when both options are set to true
        this.audioPosterMode(this.options_.audioPosterMode);
        this.audioOnlyMode(this.options_.audioOnlyMode);
      });
    }

    /**
     * Destroys the video player and does any necessary cleanup.
     *
     * This is especially helpful if you are dynamically adding and removing videos
     * to/from the DOM.
     *
     * @fires Player#dispose
     */
    dispose() {
      /**
       * Called when the player is being disposed of.
       *
       * @event Player#dispose
       * @type {Event}
       */
      this.trigger('dispose');
      // prevent dispose from being called twice
      this.off('dispose');

      // Make sure all player-specific document listeners are unbound. This is
      off(document, this.fsApi_.fullscreenchange, this.boundDocumentFullscreenChange_);
      off(document, 'keydown', this.boundFullWindowOnEscKey_);
      if (this.styleEl_ && this.styleEl_.parentNode) {
        this.styleEl_.parentNode.removeChild(this.styleEl_);
        this.styleEl_ = null;
      }

      // Kill reference to this player
      Player.players[this.id_] = null;
      if (this.tag && this.tag.player) {
        this.tag.player = null;
      }
      if (this.el_ && this.el_.player) {
        this.el_.player = null;
      }
      if (this.tech_) {
        this.tech_.dispose();
        this.isPosterFromTech_ = false;
        this.poster_ = '';
      }
      if (this.playerElIngest_) {
        this.playerElIngest_ = null;
      }
      if (this.tag) {
        this.tag = null;
      }
      clearCacheForPlayer(this);

      // remove all event handlers for track lists
      // all tracks and track listeners are removed on
      // tech dispose
      ALL.names.forEach(name => {
        const props = ALL[name];
        const list = this[props.getterName]();

        // if it is not a native list
        // we have to manually remove event listeners
        if (list && list.off) {
          list.off();
        }
      });

      // the actual .el_ is removed here, or replaced if
      super.dispose({
        restoreEl: this.options_.restoreEl
      });
    }

    /**
     * Create the `Player`'s DOM element.
     *
     * @return {Element}
     *         The DOM element that gets created.
     */
    createEl() {
      let tag = this.tag;
      let el;
      let playerElIngest = this.playerElIngest_ = tag.parentNode && tag.parentNode.hasAttribute && tag.parentNode.hasAttribute('data-vjs-player');
      const divEmbed = this.tag.tagName.toLowerCase() === 'video-js';
      if (playerElIngest) {
        el = this.el_ = tag.parentNode;
      } else if (!divEmbed) {
        el = this.el_ = super.createEl('div');
      }

      // Copy over all the attributes from the tag, including ID and class
      // ID will now reference player box, not the video tag
      const attrs = getAttributes(tag);
      if (divEmbed) {
        el = this.el_ = tag;
        tag = this.tag = document.createElement('video');
        while (el.children.length) {
          tag.appendChild(el.firstChild);
        }
        if (!hasClass(el, 'video-js')) {
          addClass(el, 'video-js');
        }
        el.appendChild(tag);
        playerElIngest = this.playerElIngest_ = el;
        // move properties over from our custom `video-js` element
        // to our new `video` element. This will move things like
        // `src` or `controls` that were set via js before the player
        // was initialized.
        Object.keys(el).forEach(k => {
          try {
            tag[k] = el[k];
          } catch (e) {
            // we got a a property like outerHTML which we can't actually copy, ignore it
          }
        });
      }

      // set tabindex to -1 to remove the video element from the focus order
      tag.setAttribute('tabindex', '-1');
      attrs.tabindex = '-1';

      // Workaround for #4583 on Chrome (on Windows) with JAWS.
      // See https://github.com/FreedomScientific/VFO-standards-support/issues/78
      // Note that we can't detect if JAWS is being used, but this ARIA attribute
      // doesn't change behavior of Chrome if JAWS is not being used
      if (IS_CHROME && IS_WINDOWS) {
        tag.setAttribute('role', 'application');
        attrs.role = 'application';
      }

      // Remove width/height attrs from tag so CSS can make it 100% width/height
      tag.removeAttribute('width');
      tag.removeAttribute('height');
      if ('width' in attrs) {
        delete attrs.width;
      }
      if ('height' in attrs) {
        delete attrs.height;
      }
      Object.getOwnPropertyNames(attrs).forEach(function (attr) {
        // don't copy over the class attribute to the player element when we're in a div embed
        // the class is already set up properly in the divEmbed case
        // and we want to make sure that the `video-js` class doesn't get lost
        if (!(divEmbed && attr === 'class')) {
          el.setAttribute(attr, attrs[attr]);
        }
        if (divEmbed) {
          tag.setAttribute(attr, attrs[attr]);
        }
      });

      // Update tag id/class for use as HTML5 playback tech
      // Might think we should do this after embedding in container so .vjs-tech class
      // doesn't flash 100% width/height, but class only applies with .video-js parent
      tag.playerId = tag.id;
      tag.id += '_html5_api';
      tag.className = 'vjs-tech';

      // Make player findable on elements
      tag.player = el.player = this;
      // Default state of video is paused
      this.addClass('vjs-paused');

      // Add a style element in the player that we'll use to set the width/height
      // of the player in a way that's still overridable by CSS, just like the
      // video element
      if (window.VIDEOJS_NO_DYNAMIC_STYLE !== true) {
        this.styleEl_ = createStyleElement('vjs-styles-dimensions');
        const defaultsStyleEl = $('.vjs-styles-defaults');
        const head = $('head');
        head.insertBefore(this.styleEl_, defaultsStyleEl ? defaultsStyleEl.nextSibling : head.firstChild);
      }
      this.fill_ = false;
      this.fluid_ = false;

      // Pass in the width/height/aspectRatio options which will update the style el
      this.width(this.options_.width);
      this.height(this.options_.height);
      this.fill(this.options_.fill);
      this.fluid(this.options_.fluid);
      this.aspectRatio(this.options_.aspectRatio);
      // support both crossOrigin and crossorigin to reduce confusion and issues around the name
      this.crossOrigin(this.options_.crossOrigin || this.options_.crossorigin);

      // Hide any links within the video/audio tag,
      // because IE doesn't hide them completely from screen readers.
      const links = tag.getElementsByTagName('a');
      for (let i = 0; i < links.length; i++) {
        const linkEl = links.item(i);
        addClass(linkEl, 'vjs-hidden');
        linkEl.setAttribute('hidden', 'hidden');
      }

      // insertElFirst seems to cause the networkState to flicker from 3 to 2, so
      // keep track of the original for later so we can know if the source originally failed
      tag.initNetworkState_ = tag.networkState;

      // Wrap video tag in div (el/box) container
      if (tag.parentNode && !playerElIngest) {
        tag.parentNode.insertBefore(el, tag);
      }

      // insert the tag as the first child of the player element
      // then manually add it to the children array so that this.addChild
      // will work properly for other components
      //
      // Breaks iPhone, fixed in HTML5 setup.
      prependTo(tag, el);
      this.children_.unshift(tag);

      // Set lang attr on player to ensure CSS :lang() in consistent with player
      // if it's been set to something different to the doc
      this.el_.setAttribute('lang', this.language_);
      this.el_.setAttribute('translate', 'no');
      this.el_ = el;
      return el;
    }

    /**
     * Get or set the `Player`'s crossOrigin option. For the HTML5 player, this
     * sets the `crossOrigin` property on the `<video>` tag to control the CORS
     * behavior.
     *
     * @see [Video Element Attributes]{@link https://developer.mozilla.org/en-US/docs/Web/HTML/Element/video#attr-crossorigin}
     *
     * @param {string|null} [value]
     *        The value to set the `Player`'s crossOrigin to. If an argument is
     *        given, must be one of `'anonymous'` or `'use-credentials'`, or 'null'.
     *
     * @return {string|null|undefined}
     *         - The current crossOrigin value of the `Player` when getting.
     *         - undefined when setting
     */
    crossOrigin(value) {
      // `null` can be set to unset a value
      if (typeof value === 'undefined') {
        return this.techGet_('crossOrigin');
      }
      if (value !== null && value !== 'anonymous' && value !== 'use-credentials') {
        log.warn(`crossOrigin must be null,  "anonymous" or "use-credentials", given "${value}"`);
        return;
      }
      this.techCall_('setCrossOrigin', value);
      if (this.posterImage) {
        this.posterImage.crossOrigin(value);
      }
      return;
    }

    /**
     * A getter/setter for the `Player`'s width. Returns the player's configured value.
     * To get the current width use `currentWidth()`.
     *
     * @param {number|string} [value]
     *        CSS value to set the `Player`'s width to.
     *
     * @return {number|undefined}
     *         - The current width of the `Player` when getting.
     *         - Nothing when setting
     */
    width(value) {
      return this.dimension('width', value);
    }

    /**
     * A getter/setter for the `Player`'s height. Returns the player's configured value.
     * To get the current height use `currentheight()`.
     *
     * @param {number|string} [value]
     *        CSS value to set the `Player`'s height to.
     *
     * @return {number|undefined}
     *         - The current height of the `Player` when getting.
     *         - Nothing when setting
     */
    height(value) {
      return this.dimension('height', value);
    }

    /**
     * A getter/setter for the `Player`'s width & height.
     *
     * @param {string} dimension
     *        This string can be:
     *        - 'width'
     *        - 'height'
     *
     * @param {number|string} [value]
     *        Value for dimension specified in the first argument.
     *
     * @return {number}
     *         The dimension arguments value when getting (width/height).
     */
    dimension(dimension, value) {
      const privDimension = dimension + '_';
      if (value === undefined) {
        return this[privDimension] || 0;
      }
      if (value === '' || value === 'auto') {
        // If an empty string is given, reset the dimension to be automatic
        this[privDimension] = undefined;
        this.updateStyleEl_();
        return;
      }
      const parsedVal = parseFloat(value);
      if (isNaN(parsedVal)) {
        log.error(`Improper value "${value}" supplied for for ${dimension}`);
        return;
      }
      this[privDimension] = parsedVal;
      this.updateStyleEl_();
    }

    /**
     * A getter/setter/toggler for the vjs-fluid `className` on the `Player`.
     *
     * Turning this on will turn off fill mode.
     *
     * @param {boolean} [bool]
     *        - A value of true adds the class.
     *        - A value of false removes the class.
     *        - No value will be a getter.
     *
     * @return {boolean|undefined}
     *         - The value of fluid when getting.
     *         - `undefined` when setting.
     */
    fluid(bool) {
      if (bool === undefined) {
        return !!this.fluid_;
      }
      this.fluid_ = !!bool;
      if (isEvented(this)) {
        this.off(['playerreset', 'resize'], this.boundUpdateStyleEl_);
      }
      if (bool) {
        this.addClass('vjs-fluid');
        this.fill(false);
        addEventedCallback(this, () => {
          this.on(['playerreset', 'resize'], this.boundUpdateStyleEl_);
        });
      } else {
        this.removeClass('vjs-fluid');
      }
      this.updateStyleEl_();
    }

    /**
     * A getter/setter/toggler for the vjs-fill `className` on the `Player`.
     *
     * Turning this on will turn off fluid mode.
     *
     * @param {boolean} [bool]
     *        - A value of true adds the class.
     *        - A value of false removes the class.
     *        - No value will be a getter.
     *
     * @return {boolean|undefined}
     *         - The value of fluid when getting.
     *         - `undefined` when setting.
     */
    fill(bool) {
      if (bool === undefined) {
        return !!this.fill_;
      }
      this.fill_ = !!bool;
      if (bool) {
        this.addClass('vjs-fill');
        this.fluid(false);
      } else {
        this.removeClass('vjs-fill');
      }
    }

    /**
     * Get/Set the aspect ratio
     *
     * @param {string} [ratio]
     *        Aspect ratio for player
     *
     * @return {string|undefined}
     *         returns the current aspect ratio when getting
     */

    /**
     * A getter/setter for the `Player`'s aspect ratio.
     *
     * @param {string} [ratio]
     *        The value to set the `Player`'s aspect ratio to.
     *
     * @return {string|undefined}
     *         - The current aspect ratio of the `Player` when getting.
     *         - undefined when setting
     */
    aspectRatio(ratio) {
      if (ratio === undefined) {
        return this.aspectRatio_;
      }

      // Check for width:height format
      if (!/^\d+\:\d+$/.test(ratio)) {
        throw new Error('Improper value supplied for aspect ratio. The format should be width:height, for example 16:9.');
      }
      this.aspectRatio_ = ratio;

      // We're assuming if you set an aspect ratio you want fluid mode,
      // because in fixed mode you could calculate width and height yourself.
      this.fluid(true);
      this.updateStyleEl_();
    }

    /**
     * Update styles of the `Player` element (height, width and aspect ratio).
     *
     * @private
     * @listens Tech#loadedmetadata
     */
    updateStyleEl_() {
      if (window.VIDEOJS_NO_DYNAMIC_STYLE === true) {
        const width = typeof this.width_ === 'number' ? this.width_ : this.options_.width;
        const height = typeof this.height_ === 'number' ? this.height_ : this.options_.height;
        const techEl = this.tech_ && this.tech_.el();
        if (techEl) {
          if (width >= 0) {
            techEl.width = width;
          }
          if (height >= 0) {
            techEl.height = height;
          }
        }
        return;
      }
      let width;
      let height;
      let aspectRatio;
      let idClass;

      // The aspect ratio is either used directly or to calculate width and height.
      if (this.aspectRatio_ !== undefined && this.aspectRatio_ !== 'auto') {
        // Use any aspectRatio that's been specifically set
        aspectRatio = this.aspectRatio_;
      } else if (this.videoWidth() > 0) {
        // Otherwise try to get the aspect ratio from the video metadata
        aspectRatio = this.videoWidth() + ':' + this.videoHeight();
      } else {
        // Or use a default. The video element's is 2:1, but 16:9 is more common.
        aspectRatio = '16:9';
      }

      // Get the ratio as a decimal we can use to calculate dimensions
      const ratioParts = aspectRatio.split(':');
      const ratioMultiplier = ratioParts[1] / ratioParts[0];
      if (this.width_ !== undefined) {
        // Use any width that's been specifically set
        width = this.width_;
      } else if (this.height_ !== undefined) {
        // Or calculate the width from the aspect ratio if a height has been set
        width = this.height_ / ratioMultiplier;
      } else {
        // Or use the video's metadata, or use the video el's default of 300
        width = this.videoWidth() || 300;
      }
      if (this.height_ !== undefined) {
        // Use any height that's been specifically set
        height = this.height_;
      } else {
        // Otherwise calculate the height from the ratio and the width
        height = width * ratioMultiplier;
      }

      // Ensure the CSS class is valid by starting with an alpha character
      if (/^[^a-zA-Z]/.test(this.id())) {
        idClass = 'dimensions-' + this.id();
      } else {
        idClass = this.id() + '-dimensions';
      }

      // Ensure the right class is still on the player for the style element
      this.addClass(idClass);
      setTextContent(this.styleEl_, `
      .${idClass} {
        width: ${width}px;
        height: ${height}px;
      }

      .${idClass}.vjs-fluid:not(.vjs-audio-only-mode) {
        padding-top: ${ratioMultiplier * 100}%;
      }
    `);
    }

    /**
     * Load/Create an instance of playback {@link Tech} including element
     * and API methods. Then append the `Tech` element in `Player` as a child.
     *
     * @param {string} techName
     *        name of the playback technology
     *
     * @param {string} source
     *        video source
     *
     * @private
     */
    loadTech_(techName, source) {
      // Pause and remove current playback technology
      if (this.tech_) {
        this.unloadTech_();
      }
      const titleTechName = toTitleCase(techName);
      const camelTechName = techName.charAt(0).toLowerCase() + techName.slice(1);

      // get rid of the HTML5 video tag as soon as we are using another tech
      if (titleTechName !== 'Html5' && this.tag) {
        Tech.getTech('Html5').disposeMediaElement(this.tag);
        this.tag.player = null;
        this.tag = null;
      }
      this.techName_ = titleTechName;

      // Turn off API access because we're loading a new tech that might load asynchronously
      this.isReady_ = false;
      let autoplay = this.autoplay();

      // if autoplay is a string (or `true` with normalizeAutoplay: true) we pass false to the tech
      // because the player is going to handle autoplay on `loadstart`
      if (typeof this.autoplay() === 'string' || this.autoplay() === true && this.options_.normalizeAutoplay) {
        autoplay = false;
      }

      // Grab tech-specific options from player options and add source and parent element to use.
      const techOptions = {
        source,
        autoplay,
        'nativeControlsForTouch': this.options_.nativeControlsForTouch,
        'playerId': this.id(),
        'techId': `${this.id()}_${camelTechName}_api`,
        'playsinline': this.options_.playsinline,
        'preload': this.options_.preload,
        'loop': this.options_.loop,
        'disablePictureInPicture': this.options_.disablePictureInPicture,
        'muted': this.options_.muted,
        'poster': this.poster(),
        'language': this.language(),
        'playerElIngest': this.playerElIngest_ || false,
        'vtt.js': this.options_['vtt.js'],
        'canOverridePoster': !!this.options_.techCanOverridePoster,
        'enableSourceset': this.options_.enableSourceset
      };
      ALL.names.forEach(name => {
        const props = ALL[name];
        techOptions[props.getterName] = this[props.privateName];
      });
      Object.assign(techOptions, this.options_[titleTechName]);
      Object.assign(techOptions, this.options_[camelTechName]);
      Object.assign(techOptions, this.options_[techName.toLowerCase()]);
      if (this.tag) {
        techOptions.tag = this.tag;
      }
      if (source && source.src === this.cache_.src && this.cache_.currentTime > 0) {
        techOptions.startTime = this.cache_.currentTime;
      }

      // Initialize tech instance
      const TechClass = Tech.getTech(techName);
      if (!TechClass) {
        throw new Error(`No Tech named '${titleTechName}' exists! '${titleTechName}' should be registered using videojs.registerTech()'`);
      }
      this.tech_ = new TechClass(techOptions);

      // player.triggerReady is always async, so don't need this to be async
      this.tech_.ready(bind_(this, this.handleTechReady_), true);
      textTrackConverter.jsonToTextTracks(this.textTracksJson_ || [], this.tech_);

      // Listen to all HTML5-defined events and trigger them on the player
      TECH_EVENTS_RETRIGGER.forEach(event => {
        this.on(this.tech_, event, e => this[`handleTech${toTitleCase(event)}_`](e));
      });
      Object.keys(TECH_EVENTS_QUEUE).forEach(event => {
        this.on(this.tech_, event, eventObj => {
          if (this.tech_.playbackRate() === 0 && this.tech_.seeking()) {
            this.queuedCallbacks_.push({
              callback: this[`handleTech${TECH_EVENTS_QUEUE[event]}_`].bind(this),
              event: eventObj
            });
            return;
          }
          this[`handleTech${TECH_EVENTS_QUEUE[event]}_`](eventObj);
        });
      });
      this.on(this.tech_, 'loadstart', e => this.handleTechLoadStart_(e));
      this.on(this.tech_, 'sourceset', e => this.handleTechSourceset_(e));
      this.on(this.tech_, 'waiting', e => this.handleTechWaiting_(e));
      this.on(this.tech_, 'ended', e => this.handleTechEnded_(e));
      this.on(this.tech_, 'seeking', e => this.handleTechSeeking_(e));
      this.on(this.tech_, 'play', e => this.handleTechPlay_(e));
      this.on(this.tech_, 'pause', e => this.handleTechPause_(e));
      this.on(this.tech_, 'durationchange', e => this.handleTechDurationChange_(e));
      this.on(this.tech_, 'fullscreenchange', (e, data) => this.handleTechFullscreenChange_(e, data));
      this.on(this.tech_, 'fullscreenerror', (e, err) => this.handleTechFullscreenError_(e, err));
      this.on(this.tech_, 'enterpictureinpicture', e => this.handleTechEnterPictureInPicture_(e));
      this.on(this.tech_, 'leavepictureinpicture', e => this.handleTechLeavePictureInPicture_(e));
      this.on(this.tech_, 'error', e => this.handleTechError_(e));
      this.on(this.tech_, 'posterchange', e => this.handleTechPosterChange_(e));
      this.on(this.tech_, 'textdata', e => this.handleTechTextData_(e));
      this.on(this.tech_, 'ratechange', e => this.handleTechRateChange_(e));
      this.on(this.tech_, 'loadedmetadata', this.boundUpdateStyleEl_);
      this.usingNativeControls(this.techGet_('controls'));
      if (this.controls() && !this.usingNativeControls()) {
        this.addTechControlsListeners_();
      }

      // Add the tech element in the DOM if it was not already there
      // Make sure to not insert the original video element if using Html5
      if (this.tech_.el().parentNode !== this.el() && (titleTechName !== 'Html5' || !this.tag)) {
        prependTo(this.tech_.el(), this.el());
      }

      // Get rid of the original video tag reference after the first tech is loaded
      if (this.tag) {
        this.tag.player = null;
        this.tag = null;
      }
    }

    /**
     * Unload and dispose of the current playback {@link Tech}.
     *
     * @private
     */
    unloadTech_() {
      // Save the current text tracks so that we can reuse the same text tracks with the next tech
      ALL.names.forEach(name => {
        const props = ALL[name];
        this[props.privateName] = this[props.getterName]();
      });
      this.textTracksJson_ = textTrackConverter.textTracksToJson(this.tech_);
      this.isReady_ = false;
      this.tech_.dispose();
      this.tech_ = false;
      if (this.isPosterFromTech_) {
        this.poster_ = '';
        this.trigger('posterchange');
      }
      this.isPosterFromTech_ = false;
    }

    /**
     * Return a reference to the current {@link Tech}.
     * It will print a warning by default about the danger of using the tech directly
     * but any argument that is passed in will silence the warning.
     *
     * @param {*} [safety]
     *        Anything passed in to silence the warning
     *
     * @return {Tech}
     *         The Tech
     */
    tech(safety) {
      if (safety === undefined) {
        log.warn('Using the tech directly can be dangerous. I hope you know what you\'re doing.\n' + 'See https://github.com/videojs/video.js/issues/2617 for more info.\n');
      }
      return this.tech_;
    }

    /**
     * Set up click and touch listeners for the playback element
     *
     * - On desktops: a click on the video itself will toggle playback
     * - On mobile devices: a click on the video toggles controls
     *   which is done by toggling the user state between active and
     *   inactive
     * - A tap can signal that a user has become active or has become inactive
     *   e.g. a quick tap on an iPhone movie should reveal the controls. Another
     *   quick tap should hide them again (signaling the user is in an inactive
     *   viewing state)
     * - In addition to this, we still want the user to be considered inactive after
     *   a few seconds of inactivity.
     *
     * > Note: the only part of iOS interaction we can't mimic with this setup
     * is a touch and hold on the video element counting as activity in order to
     * keep the controls showing, but that shouldn't be an issue. A touch and hold
     * on any controls will still keep the user active
     *
     * @private
     */
    addTechControlsListeners_() {
      // Make sure to remove all the previous listeners in case we are called multiple times.
      this.removeTechControlsListeners_();
      this.on(this.tech_, 'click', this.boundHandleTechClick_);
      this.on(this.tech_, 'dblclick', this.boundHandleTechDoubleClick_);

      // If the controls were hidden we don't want that to change without a tap event
      // so we'll check if the controls were already showing before reporting user
      // activity
      this.on(this.tech_, 'touchstart', this.boundHandleTechTouchStart_);
      this.on(this.tech_, 'touchmove', this.boundHandleTechTouchMove_);
      this.on(this.tech_, 'touchend', this.boundHandleTechTouchEnd_);

      // The tap listener needs to come after the touchend listener because the tap
      // listener cancels out any reportedUserActivity when setting userActive(false)
      this.on(this.tech_, 'tap', this.boundHandleTechTap_);
    }

    /**
     * Remove the listeners used for click and tap controls. This is needed for
     * toggling to controls disabled, where a tap/touch should do nothing.
     *
     * @private
     */
    removeTechControlsListeners_() {
      // We don't want to just use `this.off()` because there might be other needed
      // listeners added by techs that extend this.
      this.off(this.tech_, 'tap', this.boundHandleTechTap_);
      this.off(this.tech_, 'touchstart', this.boundHandleTechTouchStart_);
      this.off(this.tech_, 'touchmove', this.boundHandleTechTouchMove_);
      this.off(this.tech_, 'touchend', this.boundHandleTechTouchEnd_);
      this.off(this.tech_, 'click', this.boundHandleTechClick_);
      this.off(this.tech_, 'dblclick', this.boundHandleTechDoubleClick_);
    }

    /**
     * Player waits for the tech to be ready
     *
     * @private
     */
    handleTechReady_() {
      this.triggerReady();

      // Keep the same volume as before
      if (this.cache_.volume) {
        this.techCall_('setVolume', this.cache_.volume);
      }

      // Look if the tech found a higher resolution poster while loading
      this.handleTechPosterChange_();

      // Update the duration if available
      this.handleTechDurationChange_();
    }

    /**
     * Retrigger the `loadstart` event that was triggered by the {@link Tech}.
     *
     * @fires Player#loadstart
     * @listens Tech#loadstart
     * @private
     */
    handleTechLoadStart_() {
      // TODO: Update to use `emptied` event instead. See #1277.

      this.removeClass('vjs-ended', 'vjs-seeking');

      // reset the error state
      this.error(null);

      // Update the duration
      this.handleTechDurationChange_();
      if (!this.paused()) {
        /**
         * Fired when the user agent begins looking for media data
         *
         * @event Player#loadstart
         * @type {Event}
         */
        this.trigger('loadstart');
      } else {
        // reset the hasStarted state
        this.hasStarted(false);
        this.trigger('loadstart');
      }

      // autoplay happens after loadstart for the browser,
      // so we mimic that behavior
      this.manualAutoplay_(this.autoplay() === true && this.options_.normalizeAutoplay ? 'play' : this.autoplay());
    }

    /**
     * Handle autoplay string values, rather than the typical boolean
     * values that should be handled by the tech. Note that this is not
     * part of any specification. Valid values and what they do can be
     * found on the autoplay getter at Player#autoplay()
     */
    manualAutoplay_(type) {
      if (!this.tech_ || typeof type !== 'string') {
        return;
      }

      // Save original muted() value, set muted to true, and attempt to play().
      // On promise rejection, restore muted from saved value
      const resolveMuted = () => {
        const previouslyMuted = this.muted();
        this.muted(true);
        const restoreMuted = () => {
          this.muted(previouslyMuted);
        };

        // restore muted on play terminatation
        this.playTerminatedQueue_.push(restoreMuted);
        const mutedPromise = this.play();
        if (!isPromise(mutedPromise)) {
          return;
        }
        return mutedPromise.catch(err => {
          restoreMuted();
          throw new Error(`Rejection at manualAutoplay. Restoring muted value. ${err ? err : ''}`);
        });
      };
      let promise;

      // if muted defaults to true
      // the only thing we can do is call play
      if (type === 'any' && !this.muted()) {
        promise = this.play();
        if (isPromise(promise)) {
          promise = promise.catch(resolveMuted);
        }
      } else if (type === 'muted' && !this.muted()) {
        promise = resolveMuted();
      } else {
        promise = this.play();
      }
      if (!isPromise(promise)) {
        return;
      }
      return promise.then(() => {
        this.trigger({
          type: 'autoplay-success',
          autoplay: type
        });
      }).catch(() => {
        this.trigger({
          type: 'autoplay-failure',
          autoplay: type
        });
      });
    }

    /**
     * Update the internal source caches so that we return the correct source from
     * `src()`, `currentSource()`, and `currentSources()`.
     *
     * > Note: `currentSources` will not be updated if the source that is passed in exists
     *         in the current `currentSources` cache.
     *
     *
     * @param {Tech~SourceObject} srcObj
     *        A string or object source to update our caches to.
     */
    updateSourceCaches_(srcObj = '') {
      let src = srcObj;
      let type = '';
      if (typeof src !== 'string') {
        src = srcObj.src;
        type = srcObj.type;
      }

      // make sure all the caches are set to default values
      // to prevent null checking
      this.cache_.source = this.cache_.source || {};
      this.cache_.sources = this.cache_.sources || [];

      // try to get the type of the src that was passed in
      if (src && !type) {
        type = findMimetype(this, src);
      }

      // update `currentSource` cache always
      this.cache_.source = merge({}, srcObj, {
        src,
        type
      });
      const matchingSources = this.cache_.sources.filter(s => s.src && s.src === src);
      const sourceElSources = [];
      const sourceEls = this.$$('source');
      const matchingSourceEls = [];
      for (let i = 0; i < sourceEls.length; i++) {
        const sourceObj = getAttributes(sourceEls[i]);
        sourceElSources.push(sourceObj);
        if (sourceObj.src && sourceObj.src === src) {
          matchingSourceEls.push(sourceObj.src);
        }
      }

      // if we have matching source els but not matching sources
      // the current source cache is not up to date
      if (matchingSourceEls.length && !matchingSources.length) {
        this.cache_.sources = sourceElSources;
        // if we don't have matching source or source els set the
        // sources cache to the `currentSource` cache
      } else if (!matchingSources.length) {
        this.cache_.sources = [this.cache_.source];
      }

      // update the tech `src` cache
      this.cache_.src = src;
    }

    /**
     * *EXPERIMENTAL* Fired when the source is set or changed on the {@link Tech}
     * causing the media element to reload.
     *
     * It will fire for the initial source and each subsequent source.
     * This event is a custom event from Video.js and is triggered by the {@link Tech}.
     *
     * The event object for this event contains a `src` property that will contain the source
     * that was available when the event was triggered. This is generally only necessary if Video.js
     * is switching techs while the source was being changed.
     *
     * It is also fired when `load` is called on the player (or media element)
     * because the {@link https://html.spec.whatwg.org/multipage/media.html#dom-media-load|specification for `load`}
     * says that the resource selection algorithm needs to be aborted and restarted.
     * In this case, it is very likely that the `src` property will be set to the
     * empty string `""` to indicate we do not know what the source will be but
     * that it is changing.
     *
     * *This event is currently still experimental and may change in minor releases.*
     * __To use this, pass `enableSourceset` option to the player.__
     *
     * @event Player#sourceset
     * @type {Event}
     * @prop {string} src
     *                The source url available when the `sourceset` was triggered.
     *                It will be an empty string if we cannot know what the source is
     *                but know that the source will change.
     */
    /**
     * Retrigger the `sourceset` event that was triggered by the {@link Tech}.
     *
     * @fires Player#sourceset
     * @listens Tech#sourceset
     * @private
     */
    handleTechSourceset_(event) {
      // only update the source cache when the source
      // was not updated using the player api
      if (!this.changingSrc_) {
        let updateSourceCaches = src => this.updateSourceCaches_(src);
        const playerSrc = this.currentSource().src;
        const eventSrc = event.src;

        // if we have a playerSrc that is not a blob, and a tech src that is a blob
        if (playerSrc && !/^blob:/.test(playerSrc) && /^blob:/.test(eventSrc)) {
          // if both the tech source and the player source were updated we assume
          // something like @videojs/http-streaming did the sourceset and skip updating the source cache.
          if (!this.lastSource_ || this.lastSource_.tech !== eventSrc && this.lastSource_.player !== playerSrc) {
            updateSourceCaches = () => {};
          }
        }

        // update the source to the initial source right away
        // in some cases this will be empty string
        updateSourceCaches(eventSrc);

        // if the `sourceset` `src` was an empty string
        // wait for a `loadstart` to update the cache to `currentSrc`.
        // If a sourceset happens before a `loadstart`, we reset the state
        if (!event.src) {
          this.tech_.any(['sourceset', 'loadstart'], e => {
            // if a sourceset happens before a `loadstart` there
            // is nothing to do as this `handleTechSourceset_`
            // will be called again and this will be handled there.
            if (e.type === 'sourceset') {
              return;
            }
            const techSrc = this.techGet_('currentSrc');
            this.lastSource_.tech = techSrc;
            this.updateSourceCaches_(techSrc);
          });
        }
      }
      this.lastSource_ = {
        player: this.currentSource().src,
        tech: event.src
      };
      this.trigger({
        src: event.src,
        type: 'sourceset'
      });
    }

    /**
     * Add/remove the vjs-has-started class
     *
     *
     * @param {boolean} request
     *        - true: adds the class
     *        - false: remove the class
     *
     * @return {boolean}
     *         the boolean value of hasStarted_
     */
    hasStarted(request) {
      if (request === undefined) {
        // act as getter, if we have no request to change
        return this.hasStarted_;
      }
      if (request === this.hasStarted_) {
        return;
      }
      this.hasStarted_ = request;
      if (this.hasStarted_) {
        this.addClass('vjs-has-started');
      } else {
        this.removeClass('vjs-has-started');
      }
    }

    /**
     * Fired whenever the media begins or resumes playback
     *
     * @see [Spec]{@link https://html.spec.whatwg.org/multipage/embedded-content.html#dom-media-play}
     * @fires Player#play
     * @listens Tech#play
     * @private
     */
    handleTechPlay_() {
      this.removeClass('vjs-ended', 'vjs-paused');
      this.addClass('vjs-playing');

      // hide the poster when the user hits play
      this.hasStarted(true);
      /**
       * Triggered whenever an {@link Tech#play} event happens. Indicates that
       * playback has started or resumed.
       *
       * @event Player#play
       * @type {Event}
       */
      this.trigger('play');
    }

    /**
     * Retrigger the `ratechange` event that was triggered by the {@link Tech}.
     *
     * If there were any events queued while the playback rate was zero, fire
     * those events now.
     *
     * @private
     * @method Player#handleTechRateChange_
     * @fires Player#ratechange
     * @listens Tech#ratechange
     */
    handleTechRateChange_() {
      if (this.tech_.playbackRate() > 0 && this.cache_.lastPlaybackRate === 0) {
        this.queuedCallbacks_.forEach(queued => queued.callback(queued.event));
        this.queuedCallbacks_ = [];
      }
      this.cache_.lastPlaybackRate = this.tech_.playbackRate();
      /**
       * Fires when the playing speed of the audio/video is changed
       *
       * @event Player#ratechange
       * @type {event}
       */
      this.trigger('ratechange');
    }

    /**
     * Retrigger the `waiting` event that was triggered by the {@link Tech}.
     *
     * @fires Player#waiting
     * @listens Tech#waiting
     * @private
     */
    handleTechWaiting_() {
      this.addClass('vjs-waiting');
      /**
       * A readyState change on the DOM element has caused playback to stop.
       *
       * @event Player#waiting
       * @type {Event}
       */
      this.trigger('waiting');

      // Browsers may emit a timeupdate event after a waiting event. In order to prevent
      // premature removal of the waiting class, wait for the time to change.
      const timeWhenWaiting = this.currentTime();
      const timeUpdateListener = () => {
        if (timeWhenWaiting !== this.currentTime()) {
          this.removeClass('vjs-waiting');
          this.off('timeupdate', timeUpdateListener);
        }
      };
      this.on('timeupdate', timeUpdateListener);
    }

    /**
     * Retrigger the `canplay` event that was triggered by the {@link Tech}.
     * > Note: This is not consistent between browsers. See #1351
     *
     * @fires Player#canplay
     * @listens Tech#canplay
     * @private
     */
    handleTechCanPlay_() {
      this.removeClass('vjs-waiting');
      /**
       * The media has a readyState of HAVE_FUTURE_DATA or greater.
       *
       * @event Player#canplay
       * @type {Event}
       */
      this.trigger('canplay');
    }

    /**
     * Retrigger the `canplaythrough` event that was triggered by the {@link Tech}.
     *
     * @fires Player#canplaythrough
     * @listens Tech#canplaythrough
     * @private
     */
    handleTechCanPlayThrough_() {
      this.removeClass('vjs-waiting');
      /**
       * The media has a readyState of HAVE_ENOUGH_DATA or greater. This means that the
       * entire media file can be played without buffering.
       *
       * @event Player#canplaythrough
       * @type {Event}
       */
      this.trigger('canplaythrough');
    }

    /**
     * Retrigger the `playing` event that was triggered by the {@link Tech}.
     *
     * @fires Player#playing
     * @listens Tech#playing
     * @private
     */
    handleTechPlaying_() {
      this.removeClass('vjs-waiting');
      /**
       * The media is no longer blocked from playback, and has started playing.
       *
       * @event Player#playing
       * @type {Event}
       */
      this.trigger('playing');
    }

    /**
     * Retrigger the `seeking` event that was triggered by the {@link Tech}.
     *
     * @fires Player#seeking
     * @listens Tech#seeking
     * @private
     */
    handleTechSeeking_() {
      this.addClass('vjs-seeking');
      /**
       * Fired whenever the player is jumping to a new time
       *
       * @event Player#seeking
       * @type {Event}
       */
      this.trigger('seeking');
    }

    /**
     * Retrigger the `seeked` event that was triggered by the {@link Tech}.
     *
     * @fires Player#seeked
     * @listens Tech#seeked
     * @private
     */
    handleTechSeeked_() {
      this.removeClass('vjs-seeking', 'vjs-ended');
      /**
       * Fired when the player has finished jumping to a new time
       *
       * @event Player#seeked
       * @type {Event}
       */
      this.trigger('seeked');
    }

    /**
     * Retrigger the `pause` event that was triggered by the {@link Tech}.
     *
     * @fires Player#pause
     * @listens Tech#pause
     * @private
     */
    handleTechPause_() {
      this.removeClass('vjs-playing');
      this.addClass('vjs-paused');
      /**
       * Fired whenever the media has been paused
       *
       * @event Player#pause
       * @type {Event}
       */
      this.trigger('pause');
    }

    /**
     * Retrigger the `ended` event that was triggered by the {@link Tech}.
     *
     * @fires Player#ended
     * @listens Tech#ended
     * @private
     */
    handleTechEnded_() {
      this.addClass('vjs-ended');
      this.removeClass('vjs-waiting');
      if (this.options_.loop) {
        this.currentTime(0);
        this.play();
      } else if (!this.paused()) {
        this.pause();
      }

      /**
       * Fired when the end of the media resource is reached (currentTime == duration)
       *
       * @event Player#ended
       * @type {Event}
       */
      this.trigger('ended');
    }

    /**
     * Fired when the duration of the media resource is first known or changed
     *
     * @listens Tech#durationchange
     * @private
     */
    handleTechDurationChange_() {
      this.duration(this.techGet_('duration'));
    }

    /**
     * Handle a click on the media element to play/pause
     *
     * @param {Event} event
     *        the event that caused this function to trigger
     *
     * @listens Tech#click
     * @private
     */
    handleTechClick_(event) {
      // When controls are disabled a click should not toggle playback because
      // the click is considered a control
      if (!this.controls_) {
        return;
      }
      if (this.options_ === undefined || this.options_.userActions === undefined || this.options_.userActions.click === undefined || this.options_.userActions.click !== false) {
        if (this.options_ !== undefined && this.options_.userActions !== undefined && typeof this.options_.userActions.click === 'function') {
          this.options_.userActions.click.call(this, event);
        } else if (this.paused()) {
          silencePromise(this.play());
        } else {
          this.pause();
        }
      }
    }

    /**
     * Handle a double-click on the media element to enter/exit fullscreen
     *
     * @param {Event} event
     *        the event that caused this function to trigger
     *
     * @listens Tech#dblclick
     * @private
     */
    handleTechDoubleClick_(event) {
      if (!this.controls_) {
        return;
      }

      // we do not want to toggle fullscreen state
      // when double-clicking inside a control bar or a modal
      const inAllowedEls = Array.prototype.some.call(this.$$('.vjs-control-bar, .vjs-modal-dialog'), el => el.contains(event.target));
      if (!inAllowedEls) {
        /*
         * options.userActions.doubleClick
         *
         * If `undefined` or `true`, double-click toggles fullscreen if controls are present
         * Set to `false` to disable double-click handling
         * Set to a function to substitute an external double-click handler
         */
        if (this.options_ === undefined || this.options_.userActions === undefined || this.options_.userActions.doubleClick === undefined || this.options_.userActions.doubleClick !== false) {
          if (this.options_ !== undefined && this.options_.userActions !== undefined && typeof this.options_.userActions.doubleClick === 'function') {
            this.options_.userActions.doubleClick.call(this, event);
          } else if (this.isFullscreen()) {
            this.exitFullscreen();
          } else {
            this.requestFullscreen();
          }
        }
      }
    }

    /**
     * Handle a tap on the media element. It will toggle the user
     * activity state, which hides and shows the controls.
     *
     * @listens Tech#tap
     * @private
     */
    handleTechTap_() {
      this.userActive(!this.userActive());
    }

    /**
     * Handle touch to start
     *
     * @listens Tech#touchstart
     * @private
     */
    handleTechTouchStart_() {
      this.userWasActive = this.userActive();
    }

    /**
     * Handle touch to move
     *
     * @listens Tech#touchmove
     * @private
     */
    handleTechTouchMove_() {
      if (this.userWasActive) {
        this.reportUserActivity();
      }
    }

    /**
     * Handle touch to end
     *
     * @param {Event} event
     *        the touchend event that triggered
     *        this function
     *
     * @listens Tech#touchend
     * @private
     */
    handleTechTouchEnd_(event) {
      // Stop the mouse events from also happening
      if (event.cancelable) {
        event.preventDefault();
      }
    }

    /**
     * @private
     */
    toggleFullscreenClass_() {
      if (this.isFullscreen()) {
        this.addClass('vjs-fullscreen');
      } else {
        this.removeClass('vjs-fullscreen');
      }
    }

    /**
     * when the document fschange event triggers it calls this
     */
    documentFullscreenChange_(e) {
      const targetPlayer = e.target.player;

      // if another player was fullscreen
      // do a null check for targetPlayer because older firefox's would put document as e.target
      if (targetPlayer && targetPlayer !== this) {
        return;
      }
      const el = this.el();
      let isFs = document[this.fsApi_.fullscreenElement] === el;
      if (!isFs && el.matches) {
        isFs = el.matches(':' + this.fsApi_.fullscreen);
      }
      this.isFullscreen(isFs);
    }

    /**
     * Handle Tech Fullscreen Change
     *
     * @param {Event} event
     *        the fullscreenchange event that triggered this function
     *
     * @param {Object} data
     *        the data that was sent with the event
     *
     * @private
     * @listens Tech#fullscreenchange
     * @fires Player#fullscreenchange
     */
    handleTechFullscreenChange_(event, data) {
      if (data) {
        if (data.nativeIOSFullscreen) {
          this.addClass('vjs-ios-native-fs');
          this.tech_.one('webkitendfullscreen', () => {
            this.removeClass('vjs-ios-native-fs');
          });
        }
        this.isFullscreen(data.isFullscreen);
      }
    }
    handleTechFullscreenError_(event, err) {
      this.trigger('fullscreenerror', err);
    }

    /**
     * @private
     */
    togglePictureInPictureClass_() {
      if (this.isInPictureInPicture()) {
        this.addClass('vjs-picture-in-picture');
      } else {
        this.removeClass('vjs-picture-in-picture');
      }
    }

    /**
     * Handle Tech Enter Picture-in-Picture.
     *
     * @param {Event} event
     *        the enterpictureinpicture event that triggered this function
     *
     * @private
     * @listens Tech#enterpictureinpicture
     */
    handleTechEnterPictureInPicture_(event) {
      this.isInPictureInPicture(true);
    }

    /**
     * Handle Tech Leave Picture-in-Picture.
     *
     * @param {Event} event
     *        the leavepictureinpicture event that triggered this function
     *
     * @private
     * @listens Tech#leavepictureinpicture
     */
    handleTechLeavePictureInPicture_(event) {
      this.isInPictureInPicture(false);
    }

    /**
     * Fires when an error occurred during the loading of an audio/video.
     *
     * @private
     * @listens Tech#error
     */
    handleTechError_() {
      const error = this.tech_.error();
      this.error(error);
    }

    /**
     * Retrigger the `textdata` event that was triggered by the {@link Tech}.
     *
     * @fires Player#textdata
     * @listens Tech#textdata
     * @private
     */
    handleTechTextData_() {
      let data = null;
      if (arguments.length > 1) {
        data = arguments[1];
      }

      /**
       * Fires when we get a textdata event from tech
       *
       * @event Player#textdata
       * @type {Event}
       */
      this.trigger('textdata', data);
    }

    /**
     * Get object for cached values.
     *
     * @return {Object}
     *         get the current object cache
     */
    getCache() {
      return this.cache_;
    }

    /**
     * Resets the internal cache object.
     *
     * Using this function outside the player constructor or reset method may
     * have unintended side-effects.
     *
     * @private
     */
    resetCache_() {
      this.cache_ = {
        // Right now, the currentTime is not _really_ cached because it is always
        // retrieved from the tech (see: currentTime). However, for completeness,
        // we set it to zero here to ensure that if we do start actually caching
        // it, we reset it along with everything else.
        currentTime: 0,
        initTime: 0,
        inactivityTimeout: this.options_.inactivityTimeout,
        duration: NaN,
        lastVolume: 1,
        lastPlaybackRate: this.defaultPlaybackRate(),
        media: null,
        src: '',
        source: {},
        sources: [],
        playbackRates: [],
        volume: 1
      };
    }

    /**
     * Pass values to the playback tech
     *
     * @param {string} [method]
     *        the method to call
     *
     * @param {Object} [arg]
     *        the argument to pass
     *
     * @private
     */
    techCall_(method, arg) {
      // If it's not ready yet, call method when it is

      this.ready(function () {
        if (method in allowedSetters) {
          return set(this.middleware_, this.tech_, method, arg);
        } else if (method in allowedMediators) {
          return mediate(this.middleware_, this.tech_, method, arg);
        }
        try {
          if (this.tech_) {
            this.tech_[method](arg);
          }
        } catch (e) {
          log(e);
          throw e;
        }
      }, true);
    }

    /**
     * Mediate attempt to call playback tech method
     * and return the value of the method called.
     *
     * @param {string} method
     *        Tech method
     *
     * @return {*}
     *         Value returned by the tech method called, undefined if tech
     *         is not ready or tech method is not present
     *
     * @private
     */
    techGet_(method) {
      if (!this.tech_ || !this.tech_.isReady_) {
        return;
      }
      if (method in allowedGetters) {
        return get(this.middleware_, this.tech_, method);
      } else if (method in allowedMediators) {
        return mediate(this.middleware_, this.tech_, method);
      }

      // Log error when playback tech object is present but method
      // is undefined or unavailable
      try {
        return this.tech_[method]();
      } catch (e) {
        // When building additional tech libs, an expected method may not be defined yet
        if (this.tech_[method] === undefined) {
          log(`Video.js: ${method} method not defined for ${this.techName_} playback technology.`, e);
          throw e;
        }

        // When a method isn't available on the object it throws a TypeError
        if (e.name === 'TypeError') {
          log(`Video.js: ${method} unavailable on ${this.techName_} playback technology element.`, e);
          this.tech_.isReady_ = false;
          throw e;
        }

        // If error unknown, just log and throw
        log(e);
        throw e;
      }
    }

    /**
     * Attempt to begin playback at the first opportunity.
     *
     * @return {Promise|undefined}
     *         Returns a promise if the browser supports Promises (or one
     *         was passed in as an option). This promise will be resolved on
     *         the return value of play. If this is undefined it will fulfill the
     *         promise chain otherwise the promise chain will be fulfilled when
     *         the promise from play is fulfilled.
     */
    play() {
      return new Promise(resolve => {
        this.play_(resolve);
      });
    }

    /**
     * The actual logic for play, takes a callback that will be resolved on the
     * return value of play. This allows us to resolve to the play promise if there
     * is one on modern browsers.
     *
     * @private
     * @param {Function} [callback]
     *        The callback that should be called when the techs play is actually called
     */
    play_(callback = silencePromise) {
      this.playCallbacks_.push(callback);
      const isSrcReady = Boolean(!this.changingSrc_ && (this.src() || this.currentSrc()));
      const isSafariOrIOS = Boolean(IS_ANY_SAFARI || IS_IOS);

      // treat calls to play_ somewhat like the `one` event function
      if (this.waitToPlay_) {
        this.off(['ready', 'loadstart'], this.waitToPlay_);
        this.waitToPlay_ = null;
      }

      // if the player/tech is not ready or the src itself is not ready
      // queue up a call to play on `ready` or `loadstart`
      if (!this.isReady_ || !isSrcReady) {
        this.waitToPlay_ = e => {
          this.play_();
        };
        this.one(['ready', 'loadstart'], this.waitToPlay_);

        // if we are in Safari, there is a high chance that loadstart will trigger after the gesture timeperiod
        // in that case, we need to prime the video element by calling load so it'll be ready in time
        if (!isSrcReady && isSafariOrIOS) {
          this.load();
        }
        return;
      }

      // If the player/tech is ready and we have a source, we can attempt playback.
      const val = this.techGet_('play');

      // For native playback, reset the progress bar if we get a play call from a replay.
      const isNativeReplay = isSafariOrIOS && this.hasClass('vjs-ended');
      if (isNativeReplay) {
        this.resetProgressBar_();
      }
      // play was terminated if the returned value is null
      if (val === null) {
        this.runPlayTerminatedQueue_();
      } else {
        this.runPlayCallbacks_(val);
      }
    }

    /**
     * These functions will be run when if play is terminated. If play
     * runPlayCallbacks_ is run these function will not be run. This allows us
     * to differentiate between a terminated play and an actual call to play.
     */
    runPlayTerminatedQueue_() {
      const queue = this.playTerminatedQueue_.slice(0);
      this.playTerminatedQueue_ = [];
      queue.forEach(function (q) {
        q();
      });
    }

    /**
     * When a callback to play is delayed we have to run these
     * callbacks when play is actually called on the tech. This function
     * runs the callbacks that were delayed and accepts the return value
     * from the tech.
     *
     * @param {undefined|Promise} val
     *        The return value from the tech.
     */
    runPlayCallbacks_(val) {
      const callbacks = this.playCallbacks_.slice(0);
      this.playCallbacks_ = [];
      // clear play terminatedQueue since we finished a real play
      this.playTerminatedQueue_ = [];
      callbacks.forEach(function (cb) {
        cb(val);
      });
    }

    /**
     * Pause the video playback
     */
    pause() {
      this.techCall_('pause');
    }

    /**
     * Check if the player is paused or has yet to play
     *
     * @return {boolean}
     *         - false: if the media is currently playing
     *         - true: if media is not currently playing
     */
    paused() {
      // The initial state of paused should be true (in Safari it's actually false)
      return this.techGet_('paused') === false ? false : true;
    }

    /**
     * Get a TimeRange object representing the current ranges of time that the user
     * has played.
     *
     * @return { import('./utils/time').TimeRange }
     *         A time range object that represents all the increments of time that have
     *         been played.
     */
    played() {
      return this.techGet_('played') || createTimeRanges(0, 0);
    }

    /**
     * Sets or returns whether or not the user is "scrubbing". Scrubbing is
     * when the user has clicked the progress bar handle and is
     * dragging it along the progress bar.
     *
     * @param {boolean} [isScrubbing]
     *        whether the user is or is not scrubbing
     *
     * @return {boolean|undefined}
     *         - The value of scrubbing when getting
     *         - Nothing when setting
     */
    scrubbing(isScrubbing) {
      if (typeof isScrubbing === 'undefined') {
        return this.scrubbing_;
      }
      this.scrubbing_ = !!isScrubbing;
      this.techCall_('setScrubbing', this.scrubbing_);
      if (isScrubbing) {
        this.addClass('vjs-scrubbing');
      } else {
        this.removeClass('vjs-scrubbing');
      }
    }

    /**
     * Get or set the current time (in seconds)
     *
     * @param {number|string} [seconds]
     *        The time to seek to in seconds
     *
     * @return {number|undefined}
     *         - the current time in seconds when getting
     *         - Nothing when setting
     */
    currentTime(seconds) {
      if (seconds === undefined) {
        // cache last currentTime and return. default to 0 seconds
        //
        // Caching the currentTime is meant to prevent a massive amount of reads on the tech's
        // currentTime when scrubbing, but may not provide much performance benefit after all.
        // Should be tested. Also something has to read the actual current time or the cache will
        // never get updated.
        this.cache_.currentTime = this.techGet_('currentTime') || 0;
        return this.cache_.currentTime;
      }
      if (seconds < 0) {
        seconds = 0;
      }
      if (!this.isReady_ || this.changingSrc_ || !this.tech_ || !this.tech_.isReady_) {
        this.cache_.initTime = seconds;
        this.off('canplay', this.boundApplyInitTime_);
        this.one('canplay', this.boundApplyInitTime_);
        return;
      }
      this.techCall_('setCurrentTime', seconds);
      this.cache_.initTime = 0;
      if (isFinite(seconds)) {
        this.cache_.currentTime = Number(seconds);
      }
    }

    /**
     * Apply the value of initTime stored in cache as currentTime.
     *
     * @private
     */
    applyInitTime_() {
      this.currentTime(this.cache_.initTime);
    }

    /**
     * Normally gets the length in time of the video in seconds;
     * in all but the rarest use cases an argument will NOT be passed to the method
     *
     * > **NOTE**: The video must have started loading before the duration can be
     * known, and depending on preload behaviour may not be known until the video starts
     * playing.
     *
     * @fires Player#durationchange
     *
     * @param {number} [seconds]
     *        The duration of the video to set in seconds
     *
     * @return {number|undefined}
     *         - The duration of the video in seconds when getting
     *         - Nothing when setting
     */
    duration(seconds) {
      if (seconds === undefined) {
        // return NaN if the duration is not known
        return this.cache_.duration !== undefined ? this.cache_.duration : NaN;
      }
      seconds = parseFloat(seconds);

      // Standardize on Infinity for signaling video is live
      if (seconds < 0) {
        seconds = Infinity;
      }
      if (seconds !== this.cache_.duration) {
        // Cache the last set value for optimized scrubbing
        this.cache_.duration = seconds;
        if (seconds === Infinity) {
          this.addClass('vjs-live');
        } else {
          this.removeClass('vjs-live');
        }
        if (!isNaN(seconds)) {
          // Do not fire durationchange unless the duration value is known.
          // @see [Spec]{@link https://www.w3.org/TR/2011/WD-html5-20110113/video.html#media-element-load-algorithm}

          /**
           * @event Player#durationchange
           * @type {Event}
           */
          this.trigger('durationchange');
        }
      }
    }

    /**
     * Calculates how much time is left in the video. Not part
     * of the native video API.
     *
     * @return {number}
     *         The time remaining in seconds
     */
    remainingTime() {
      return this.duration() - this.currentTime();
    }

    /**
     * A remaining time function that is intended to be used when
     * the time is to be displayed directly to the user.
     *
     * @return {number}
     *         The rounded time remaining in seconds
     */
    remainingTimeDisplay() {
      return Math.floor(this.duration()) - Math.floor(this.currentTime());
    }

    //
    // Kind of like an array of portions of the video that have been downloaded.

    /**
     * Get a TimeRange object with an array of the times of the video
     * that have been downloaded. If you just want the percent of the
     * video that's been downloaded, use bufferedPercent.
     *
     * @see [Buffered Spec]{@link http://dev.w3.org/html5/spec/video.html#dom-media-buffered}
     *
     * @return { import('./utils/time').TimeRange }
     *         A mock {@link TimeRanges} object (following HTML spec)
     */
    buffered() {
      let buffered = this.techGet_('buffered');
      if (!buffered || !buffered.length) {
        buffered = createTimeRanges(0, 0);
      }
      return buffered;
    }

    /**
     * Get the percent (as a decimal) of the video that's been downloaded.
     * This method is not a part of the native HTML video API.
     *
     * @return {number}
     *         A decimal between 0 and 1 representing the percent
     *         that is buffered 0 being 0% and 1 being 100%
     */
    bufferedPercent() {
      return bufferedPercent(this.buffered(), this.duration());
    }

    /**
     * Get the ending time of the last buffered time range
     * This is used in the progress bar to encapsulate all time ranges.
     *
     * @return {number}
     *         The end of the last buffered time range
     */
    bufferedEnd() {
      const buffered = this.buffered();
      const duration = this.duration();
      let end = buffered.end(buffered.length - 1);
      if (end > duration) {
        end = duration;
      }
      return end;
    }

    /**
     * Get or set the current volume of the media
     *
     * @param  {number} [percentAsDecimal]
     *         The new volume as a decimal percent:
     *         - 0 is muted/0%/off
     *         - 1.0 is 100%/full
     *         - 0.5 is half volume or 50%
     *
     * @return {number|undefined}
     *         The current volume as a percent when getting
     */
    volume(percentAsDecimal) {
      let vol;
      if (percentAsDecimal !== undefined) {
        // Force value to between 0 and 1
        vol = Math.max(0, Math.min(1, percentAsDecimal));
        this.cache_.volume = vol;
        this.techCall_('setVolume', vol);
        if (vol > 0) {
          this.lastVolume_(vol);
        }
        return;
      }

      // Default to 1 when returning current volume.
      vol = parseFloat(this.techGet_('volume'));
      return isNaN(vol) ? 1 : vol;
    }

    /**
     * Get the current muted state, or turn mute on or off
     *
     * @param {boolean} [muted]
     *        - true to mute
     *        - false to unmute
     *
     * @return {boolean|undefined}
     *         - true if mute is on and getting
     *         - false if mute is off and getting
     *         - nothing if setting
     */
    muted(muted) {
      if (muted !== undefined) {
        this.techCall_('setMuted', muted);
        return;
      }
      return this.techGet_('muted') || false;
    }

    /**
     * Get the current defaultMuted state, or turn defaultMuted on or off. defaultMuted
     * indicates the state of muted on initial playback.
     *
     * ```js
     *   var myPlayer = videojs('some-player-id');
     *
     *   myPlayer.src("http://www.example.com/path/to/video.mp4");
     *
     *   // get, should be false
     *   console.log(myPlayer.defaultMuted());
     *   // set to true
     *   myPlayer.defaultMuted(true);
     *   // get should be true
     *   console.log(myPlayer.defaultMuted());
     * ```
     *
     * @param {boolean} [defaultMuted]
     *        - true to mute
     *        - false to unmute
     *
     * @return {boolean|undefined}
     *         - true if defaultMuted is on and getting
     *         - false if defaultMuted is off and getting
     *         - Nothing when setting
     */
    defaultMuted(defaultMuted) {
      if (defaultMuted !== undefined) {
        this.techCall_('setDefaultMuted', defaultMuted);
      }
      return this.techGet_('defaultMuted') || false;
    }

    /**
     * Get the last volume, or set it
     *
     * @param  {number} [percentAsDecimal]
     *         The new last volume as a decimal percent:
     *         - 0 is muted/0%/off
     *         - 1.0 is 100%/full
     *         - 0.5 is half volume or 50%
     *
     * @return {number|undefined}
     *         - The current value of lastVolume as a percent when getting
     *         - Nothing when setting
     *
     * @private
     */
    lastVolume_(percentAsDecimal) {
      if (percentAsDecimal !== undefined && percentAsDecimal !== 0) {
        this.cache_.lastVolume = percentAsDecimal;
        return;
      }
      return this.cache_.lastVolume;
    }

    /**
     * Check if current tech can support native fullscreen
     * (e.g. with built in controls like iOS)
     *
     * @return {boolean}
     *         if native fullscreen is supported
     */
    supportsFullScreen() {
      return this.techGet_('supportsFullScreen') || false;
    }

    /**
     * Check if the player is in fullscreen mode or tell the player that it
     * is or is not in fullscreen mode.
     *
     * > NOTE: As of the latest HTML5 spec, isFullscreen is no longer an official
     * property and instead document.fullscreenElement is used. But isFullscreen is
     * still a valuable property for internal player workings.
     *
     * @param  {boolean} [isFS]
     *         Set the players current fullscreen state
     *
     * @return {boolean|undefined}
     *         - true if fullscreen is on and getting
     *         - false if fullscreen is off and getting
     *         - Nothing when setting
     */
    isFullscreen(isFS) {
      if (isFS !== undefined) {
        const oldValue = this.isFullscreen_;
        this.isFullscreen_ = Boolean(isFS);

        // if we changed fullscreen state and we're in prefixed mode, trigger fullscreenchange
        // this is the only place where we trigger fullscreenchange events for older browsers
        // fullWindow mode is treated as a prefixed event and will get a fullscreenchange event as well
        if (this.isFullscreen_ !== oldValue && this.fsApi_.prefixed) {
          /**
             * @event Player#fullscreenchange
             * @type {Event}
             */
          this.trigger('fullscreenchange');
        }
        this.toggleFullscreenClass_();
        return;
      }
      return this.isFullscreen_;
    }

    /**
     * Increase the size of the video to full screen
     * In some browsers, full screen is not supported natively, so it enters
     * "full window mode", where the video fills the browser window.
     * In browsers and devices that support native full screen, sometimes the
     * browser's default controls will be shown, and not the Video.js custom skin.
     * This includes most mobile devices (iOS, Android) and older versions of
     * Safari.
     *
     * @param  {Object} [fullscreenOptions]
     *         Override the player fullscreen options
     *
     * @fires Player#fullscreenchange
     */
    requestFullscreen(fullscreenOptions) {
      if (this.isInPictureInPicture()) {
        this.exitPictureInPicture();
      }
      const self = this;
      return new Promise((resolve, reject) => {
        function offHandler() {
          self.off('fullscreenerror', errorHandler);
          self.off('fullscreenchange', changeHandler);
        }
        function changeHandler() {
          offHandler();
          resolve();
        }
        function errorHandler(e, err) {
          offHandler();
          reject(err);
        }
        self.one('fullscreenchange', changeHandler);
        self.one('fullscreenerror', errorHandler);
        const promise = self.requestFullscreenHelper_(fullscreenOptions);
        if (promise) {
          promise.then(offHandler, offHandler);
          promise.then(resolve, reject);
        }
      });
    }
    requestFullscreenHelper_(fullscreenOptions) {
      let fsOptions;

      // Only pass fullscreen options to requestFullscreen in spec-compliant browsers.
      // Use defaults or player configured option unless passed directly to this method.
      if (!this.fsApi_.prefixed) {
        fsOptions = this.options_.fullscreen && this.options_.fullscreen.options || {};
        if (fullscreenOptions !== undefined) {
          fsOptions = fullscreenOptions;
        }
      }

      // This method works as follows:
      // 1. if a fullscreen api is available, use it
      //   1. call requestFullscreen with potential options
      //   2. if we got a promise from above, use it to update isFullscreen()
      // 2. otherwise, if the tech supports fullscreen, call `enterFullScreen` on it.
      //   This is particularly used for iPhone, older iPads, and non-safari browser on iOS.
      // 3. otherwise, use "fullWindow" mode
      if (this.fsApi_.requestFullscreen) {
        const promise = this.el_[this.fsApi_.requestFullscreen](fsOptions);

        // Even on browsers with promise support this may not return a promise
        if (promise) {
          promise.then(() => this.isFullscreen(true), () => this.isFullscreen(false));
        }
        return promise;
      } else if (this.tech_.supportsFullScreen() && !this.options_.preferFullWindow === true) {
        // we can't take the video.js controls fullscreen but we can go fullscreen
        // with native controls
        this.techCall_('enterFullScreen');
      } else {
        // fullscreen isn't supported so we'll just stretch the video element to
        // fill the viewport
        this.enterFullWindow();
      }
    }

    /**
     * Return the video to its normal size after having been in full screen mode
     *
     * @fires Player#fullscreenchange
     */
    exitFullscreen() {
      const self = this;
      return new Promise((resolve, reject) => {
        function offHandler() {
          self.off('fullscreenerror', errorHandler);
          self.off('fullscreenchange', changeHandler);
        }
        function changeHandler() {
          offHandler();
          resolve();
        }
        function errorHandler(e, err) {
          offHandler();
          reject(err);
        }
        self.one('fullscreenchange', changeHandler);
        self.one('fullscreenerror', errorHandler);
        const promise = self.exitFullscreenHelper_();
        if (promise) {
          promise.then(offHandler, offHandler);
          // map the promise to our resolve/reject methods
          promise.then(resolve, reject);
        }
      });
    }
    exitFullscreenHelper_() {
      if (this.fsApi_.requestFullscreen) {
        const promise = document[this.fsApi_.exitFullscreen]();

        // Even on browsers with promise support this may not return a promise
        if (promise) {
          // we're splitting the promise here, so, we want to catch the
          // potential error so that this chain doesn't have unhandled errors
          silencePromise(promise.then(() => this.isFullscreen(false)));
        }
        return promise;
      } else if (this.tech_.supportsFullScreen() && !this.options_.preferFullWindow === true) {
        this.techCall_('exitFullScreen');
      } else {
        this.exitFullWindow();
      }
    }

    /**
     * When fullscreen isn't supported we can stretch the
     * video container to as wide as the browser will let us.
     *
     * @fires Player#enterFullWindow
     */
    enterFullWindow() {
      this.isFullscreen(true);
      this.isFullWindow = true;

      // Storing original doc overflow value to return to when fullscreen is off
      this.docOrigOverflow = document.documentElement.style.overflow;

      // Add listener for esc key to exit fullscreen
      on(document, 'keydown', this.boundFullWindowOnEscKey_);

      // Hide any scroll bars
      document.documentElement.style.overflow = 'hidden';

      // Apply fullscreen styles
      addClass(document.body, 'vjs-full-window');

      /**
       * @event Player#enterFullWindow
       * @type {Event}
       */
      this.trigger('enterFullWindow');
    }

    /**
     * Check for call to either exit full window or
     * full screen on ESC key
     *
     * @param {string} event
     *        Event to check for key press
     */
    fullWindowOnEscKey(event) {
      if (keycode.isEventKey(event, 'Esc')) {
        if (this.isFullscreen() === true) {
          if (!this.isFullWindow) {
            this.exitFullscreen();
          } else {
            this.exitFullWindow();
          }
        }
      }
    }

    /**
     * Exit full window
     *
     * @fires Player#exitFullWindow
     */
    exitFullWindow() {
      this.isFullscreen(false);
      this.isFullWindow = false;
      off(document, 'keydown', this.boundFullWindowOnEscKey_);

      // Unhide scroll bars.
      document.documentElement.style.overflow = this.docOrigOverflow;

      // Remove fullscreen styles
      removeClass(document.body, 'vjs-full-window');

      // Resize the box, controller, and poster to original sizes
      // this.positionAll();
      /**
       * @event Player#exitFullWindow
       * @type {Event}
       */
      this.trigger('exitFullWindow');
    }

    /**
     * Get or set disable Picture-in-Picture mode.
     *
     * @param {boolean} [value]
     *                  - true will disable Picture-in-Picture mode
     *                  - false will enable Picture-in-Picture mode
     */
    disablePictureInPicture(value) {
      if (value === undefined) {
        return this.techGet_('disablePictureInPicture');
      }
      this.techCall_('setDisablePictureInPicture', value);
      this.options_.disablePictureInPicture = value;
      this.trigger('disablepictureinpicturechanged');
    }

    /**
     * Check if the player is in Picture-in-Picture mode or tell the player that it
     * is or is not in Picture-in-Picture mode.
     *
     * @param  {boolean} [isPiP]
     *         Set the players current Picture-in-Picture state
     *
     * @return {boolean|undefined}
     *         - true if Picture-in-Picture is on and getting
     *         - false if Picture-in-Picture is off and getting
     *         - nothing if setting
     */
    isInPictureInPicture(isPiP) {
      if (isPiP !== undefined) {
        this.isInPictureInPicture_ = !!isPiP;
        this.togglePictureInPictureClass_();
        return;
      }
      return !!this.isInPictureInPicture_;
    }

    /**
     * Create a floating video window always on top of other windows so that users may
     * continue consuming media while they interact with other content sites, or
     * applications on their device.
     *
     * This can use document picture-in-picture or element picture in picture
     *
     * Set `enableDocumentPictureInPicture` to `true` to use docPiP on a supported browser
     * Else set `disablePictureInPicture` to `false` to disable elPiP on a supported browser
     *
     *
     * @see [Spec]{@link https://w3c.github.io/picture-in-picture/}
     * @see [Spec]{@link https://wicg.github.io/document-picture-in-picture/}
     *
     * @fires Player#enterpictureinpicture
     *
     * @return {Promise}
     *         A promise with a Picture-in-Picture window.
     */
    requestPictureInPicture() {
      if (this.options_.enableDocumentPictureInPicture && window.documentPictureInPicture) {
        const pipContainer = document.createElement(this.el().tagName);
        pipContainer.classList = this.el().classList;
        pipContainer.classList.add('vjs-pip-container');
        if (this.posterImage) {
          pipContainer.appendChild(this.posterImage.el().cloneNode(true));
        }
        if (this.titleBar) {
          pipContainer.appendChild(this.titleBar.el().cloneNode(true));
        }
        pipContainer.appendChild(createEl('p', {
          className: 'vjs-pip-text'
        }, {}, this.localize('Playing in picture-in-picture')));
        return window.documentPictureInPicture.requestWindow({
          // The aspect ratio won't be correct, Chrome bug https://crbug.com/1407629
          width: this.videoWidth(),
          height: this.videoHeight()
        }).then(pipWindow => {
          copyStyleSheetsToWindow(pipWindow);
          this.el_.parentNode.insertBefore(pipContainer, this.el_);
          pipWindow.document.body.appendChild(this.el_);
          pipWindow.document.body.classList.add('vjs-pip-window');
          this.player_.isInPictureInPicture(true);
          this.player_.trigger('enterpictureinpicture');

          // Listen for the PiP closing event to move the video back.
          pipWindow.addEventListener('pagehide', event => {
            const pipVideo = event.target.querySelector('.video-js');
            pipContainer.parentNode.replaceChild(pipVideo, pipContainer);
            this.player_.isInPictureInPicture(false);
            this.player_.trigger('leavepictureinpicture');
          });
          return pipWindow;
        });
      }
      if ('pictureInPictureEnabled' in document && this.disablePictureInPicture() === false) {
        /**
         * This event fires when the player enters picture in picture mode
         *
         * @event Player#enterpictureinpicture
         * @type {Event}
         */
        return this.techGet_('requestPictureInPicture');
      }
      return Promise.reject('No PiP mode is available');
    }

    /**
     * Exit Picture-in-Picture mode.
     *
     * @see [Spec]{@link https://wicg.github.io/picture-in-picture}
     *
     * @fires Player#leavepictureinpicture
     *
     * @return {Promise}
     *         A promise.
     */
    exitPictureInPicture() {
      if (window.documentPictureInPicture && window.documentPictureInPicture.window) {
        // With documentPictureInPicture, Player#leavepictureinpicture is fired in the pagehide handler
        window.documentPictureInPicture.window.close();
        return Promise.resolve();
      }
      if ('pictureInPictureEnabled' in document) {
        /**
         * This event fires when the player leaves picture in picture mode
         *
         * @event Player#leavepictureinpicture
         * @type {Event}
         */
        return document.exitPictureInPicture();
      }
    }

    /**
     * Called when this Player has focus and a key gets pressed down, or when
     * any Component of this player receives a key press that it doesn't handle.
     * This allows player-wide hotkeys (either as defined below, or optionally
     * by an external function).
     *
     * @param {Event} event
     *        The `keydown` event that caused this function to be called.
     *
     * @listens keydown
     */
    handleKeyDown(event) {
      const {
        userActions
      } = this.options_;

      // Bail out if hotkeys are not configured.
      if (!userActions || !userActions.hotkeys) {
        return;
      }

      // Function that determines whether or not to exclude an element from
      // hotkeys handling.
      const excludeElement = el => {
        const tagName = el.tagName.toLowerCase();

        // The first and easiest test is for `contenteditable` elements.
        if (el.isContentEditable) {
          return true;
        }

        // Inputs matching these types will still trigger hotkey handling as
        // they are not text inputs.
        const allowedInputTypes = ['button', 'checkbox', 'hidden', 'radio', 'reset', 'submit'];
        if (tagName === 'input') {
          return allowedInputTypes.indexOf(el.type) === -1;
        }

        // The final test is by tag name. These tags will be excluded entirely.
        const excludedTags = ['textarea'];
        return excludedTags.indexOf(tagName) !== -1;
      };

      // Bail out if the user is focused on an interactive form element.
      if (excludeElement(this.el_.ownerDocument.activeElement)) {
        return;
      }
      if (typeof userActions.hotkeys === 'function') {
        userActions.hotkeys.call(this, event);
      } else {
        this.handleHotkeys(event);
      }
    }

    /**
     * Called when this Player receives a hotkey keydown event.
     * Supported player-wide hotkeys are:
     *
     *   f          - toggle fullscreen
     *   m          - toggle mute
     *   k or Space - toggle play/pause
     *
     * @param {Event} event
     *        The `keydown` event that caused this function to be called.
     */
    handleHotkeys(event) {
      const hotkeys = this.options_.userActions ? this.options_.userActions.hotkeys : {};

      // set fullscreenKey, muteKey, playPauseKey from `hotkeys`, use defaults if not set
      const {
        fullscreenKey = keydownEvent => keycode.isEventKey(keydownEvent, 'f'),
        muteKey = keydownEvent => keycode.isEventKey(keydownEvent, 'm'),
        playPauseKey = keydownEvent => keycode.isEventKey(keydownEvent, 'k') || keycode.isEventKey(keydownEvent, 'Space')
      } = hotkeys;
      if (fullscreenKey.call(this, event)) {
        event.preventDefault();
        event.stopPropagation();
        const FSToggle = Component.getComponent('FullscreenToggle');
        if (document[this.fsApi_.fullscreenEnabled] !== false) {
          FSToggle.prototype.handleClick.call(this, event);
        }
      } else if (muteKey.call(this, event)) {
        event.preventDefault();
        event.stopPropagation();
        const MuteToggle = Component.getComponent('MuteToggle');
        MuteToggle.prototype.handleClick.call(this, event);
      } else if (playPauseKey.call(this, event)) {
        event.preventDefault();
        event.stopPropagation();
        const PlayToggle = Component.getComponent('PlayToggle');
        PlayToggle.prototype.handleClick.call(this, event);
      }
    }

    /**
     * Check whether the player can play a given mimetype
     *
     * @see https://www.w3.org/TR/2011/WD-html5-20110113/video.html#dom-navigator-canplaytype
     *
     * @param {string} type
     *        The mimetype to check
     *
     * @return {string}
     *         'probably', 'maybe', or '' (empty string)
     */
    canPlayType(type) {
      let can;

      // Loop through each playback technology in the options order
      for (let i = 0, j = this.options_.techOrder; i < j.length; i++) {
        const techName = j[i];
        let tech = Tech.getTech(techName);

        // Support old behavior of techs being registered as components.
        // Remove once that deprecated behavior is removed.
        if (!tech) {
          tech = Component.getComponent(techName);
        }

        // Check if the current tech is defined before continuing
        if (!tech) {
          log.error(`The "${techName}" tech is undefined. Skipped browser support check for that tech.`);
          continue;
        }

        // Check if the browser supports this technology
        if (tech.isSupported()) {
          can = tech.canPlayType(type);
          if (can) {
            return can;
          }
        }
      }
      return '';
    }

    /**
     * Select source based on tech-order or source-order
     * Uses source-order selection if `options.sourceOrder` is truthy. Otherwise,
     * defaults to tech-order selection
     *
     * @param {Array} sources
     *        The sources for a media asset
     *
     * @return {Object|boolean}
     *         Object of source and tech order or false
     */
    selectSource(sources) {
      // Get only the techs specified in `techOrder` that exist and are supported by the
      // current platform
      const techs = this.options_.techOrder.map(techName => {
        return [techName, Tech.getTech(techName)];
      }).filter(([techName, tech]) => {
        // Check if the current tech is defined before continuing
        if (tech) {
          // Check if the browser supports this technology
          return tech.isSupported();
        }
        log.error(`The "${techName}" tech is undefined. Skipped browser support check for that tech.`);
        return false;
      });

      // Iterate over each `innerArray` element once per `outerArray` element and execute
      // `tester` with both. If `tester` returns a non-falsy value, exit early and return
      // that value.
      const findFirstPassingTechSourcePair = function (outerArray, innerArray, tester) {
        let found;
        outerArray.some(outerChoice => {
          return innerArray.some(innerChoice => {
            found = tester(outerChoice, innerChoice);
            if (found) {
              return true;
            }
          });
        });
        return found;
      };
      let foundSourceAndTech;
      const flip = fn => (a, b) => fn(b, a);
      const finder = ([techName, tech], source) => {
        if (tech.canPlaySource(source, this.options_[techName.toLowerCase()])) {
          return {
            source,
            tech: techName
          };
        }
      };

      // Depending on the truthiness of `options.sourceOrder`, we swap the order of techs and sources
      // to select from them based on their priority.
      if (this.options_.sourceOrder) {
        // Source-first ordering
        foundSourceAndTech = findFirstPassingTechSourcePair(sources, techs, flip(finder));
      } else {
        // Tech-first ordering
        foundSourceAndTech = findFirstPassingTechSourcePair(techs, sources, finder);
      }
      return foundSourceAndTech || false;
    }

    /**
     * Executes source setting and getting logic
     *
     * @param {Tech~SourceObject|Tech~SourceObject[]|string} [source]
     *        A SourceObject, an array of SourceObjects, or a string referencing
     *        a URL to a media source. It is _highly recommended_ that an object
     *        or array of objects is used here, so that source selection
     *        algorithms can take the `type` into account.
     *
     *        If not provided, this method acts as a getter.
     * @param {boolean} [isRetry]
     *        Indicates whether this is being called internally as a result of a retry
     *
     * @return {string|undefined}
     *         If the `source` argument is missing, returns the current source
     *         URL. Otherwise, returns nothing/undefined.
     */
    handleSrc_(source, isRetry) {
      // getter usage
      if (typeof source === 'undefined') {
        return this.cache_.src || '';
      }

      // Reset retry behavior for new source
      if (this.resetRetryOnError_) {
        this.resetRetryOnError_();
      }

      // filter out invalid sources and turn our source into
      // an array of source objects
      const sources = filterSource(source);

      // if a source was passed in then it is invalid because
      // it was filtered to a zero length Array. So we have to
      // show an error
      if (!sources.length) {
        this.setTimeout(function () {
          this.error({
            code: 4,
            message: this.options_.notSupportedMessage
          });
        }, 0);
        return;
      }

      // initial sources
      this.changingSrc_ = true;

      // Only update the cached source list if we are not retrying a new source after error,
      // since in that case we want to include the failed source(s) in the cache
      if (!isRetry) {
        this.cache_.sources = sources;
      }
      this.updateSourceCaches_(sources[0]);

      // middlewareSource is the source after it has been changed by middleware
      setSource(this, sources[0], (middlewareSource, mws) => {
        this.middleware_ = mws;

        // since sourceSet is async we have to update the cache again after we select a source since
        // the source that is selected could be out of order from the cache update above this callback.
        if (!isRetry) {
          this.cache_.sources = sources;
        }
        this.updateSourceCaches_(middlewareSource);
        const err = this.src_(middlewareSource);
        if (err) {
          if (sources.length > 1) {
            return this.handleSrc_(sources.slice(1));
          }
          this.changingSrc_ = false;

          // We need to wrap this in a timeout to give folks a chance to add error event handlers
          this.setTimeout(function () {
            this.error({
              code: 4,
              message: this.options_.notSupportedMessage
            });
          }, 0);

          // we could not find an appropriate tech, but let's still notify the delegate that this is it
          // this needs a better comment about why this is needed
          this.triggerReady();
          return;
        }
        setTech(mws, this.tech_);
      });

      // Try another available source if this one fails before playback.
      if (sources.length > 1) {
        const retry = () => {
          // Remove the error modal
          this.error(null);
          this.handleSrc_(sources.slice(1), true);
        };
        const stopListeningForErrors = () => {
          this.off('error', retry);
        };
        this.one('error', retry);
        this.one('playing', stopListeningForErrors);
        this.resetRetryOnError_ = () => {
          this.off('error', retry);
          this.off('playing', stopListeningForErrors);
        };
      }
    }

    /**
     * Get or set the video source.
     *
     * @param {Tech~SourceObject|Tech~SourceObject[]|string} [source]
     *        A SourceObject, an array of SourceObjects, or a string referencing
     *        a URL to a media source. It is _highly recommended_ that an object
     *        or array of objects is used here, so that source selection
     *        algorithms can take the `type` into account.
     *
     *        If not provided, this method acts as a getter.
     *
     * @return {string|undefined}
     *         If the `source` argument is missing, returns the current source
     *         URL. Otherwise, returns nothing/undefined.
     */
    src(source) {
      return this.handleSrc_(source, false);
    }

    /**
     * Set the source object on the tech, returns a boolean that indicates whether
     * there is a tech that can play the source or not
     *
     * @param {Tech~SourceObject} source
     *        The source object to set on the Tech
     *
     * @return {boolean}
     *         - True if there is no Tech to playback this source
     *         - False otherwise
     *
     * @private
     */
    src_(source) {
      const sourceTech = this.selectSource([source]);
      if (!sourceTech) {
        return true;
      }
      if (!titleCaseEquals(sourceTech.tech, this.techName_)) {
        this.changingSrc_ = true;
        // load this technology with the chosen source
        this.loadTech_(sourceTech.tech, sourceTech.source);
        this.tech_.ready(() => {
          this.changingSrc_ = false;
        });
        return false;
      }

      // wait until the tech is ready to set the source
      // and set it synchronously if possible (#2326)
      this.ready(function () {
        // The setSource tech method was added with source handlers
        // so older techs won't support it
        // We need to check the direct prototype for the case where subclasses
        // of the tech do not support source handlers
        if (this.tech_.constructor.prototype.hasOwnProperty('setSource')) {
          this.techCall_('setSource', source);
        } else {
          this.techCall_('src', source.src);
        }
        this.changingSrc_ = false;
      }, true);
      return false;
    }

    /**
     * Begin loading the src data.
     */
    load() {
      // Workaround to use the load method with the VHS.
      // Does not cover the case when the load method is called directly from the mediaElement.
      if (this.tech_ && this.tech_.vhs) {
        this.src(this.currentSource());
        return;
      }
      this.techCall_('load');
    }

    /**
     * Reset the player. Loads the first tech in the techOrder,
     * removes all the text tracks in the existing `tech`,
     * and calls `reset` on the `tech`.
     */
    reset() {
      if (this.paused()) {
        this.doReset_();
      } else {
        const playPromise = this.play();
        silencePromise(playPromise.then(() => this.doReset_()));
      }
    }
    doReset_() {
      if (this.tech_) {
        this.tech_.clearTracks('text');
      }
      this.resetCache_();
      this.poster('');
      this.loadTech_(this.options_.techOrder[0], null);
      this.techCall_('reset');
      this.resetControlBarUI_();
      if (isEvented(this)) {
        this.trigger('playerreset');
      }
    }

    /**
     * Reset Control Bar's UI by calling sub-methods that reset
     * all of Control Bar's components
     */
    resetControlBarUI_() {
      this.resetProgressBar_();
      this.resetPlaybackRate_();
      this.resetVolumeBar_();
    }

    /**
     * Reset tech's progress so progress bar is reset in the UI
     */
    resetProgressBar_() {
      this.currentTime(0);
      const {
        currentTimeDisplay,
        durationDisplay,
        progressControl,
        remainingTimeDisplay
      } = this.controlBar || {};
      const {
        seekBar
      } = progressControl || {};
      if (currentTimeDisplay) {
        currentTimeDisplay.updateContent();
      }
      if (durationDisplay) {
        durationDisplay.updateContent();
      }
      if (remainingTimeDisplay) {
        remainingTimeDisplay.updateContent();
      }
      if (seekBar) {
        seekBar.update();
        if (seekBar.loadProgressBar) {
          seekBar.loadProgressBar.update();
        }
      }
    }

    /**
     * Reset Playback ratio
     */
    resetPlaybackRate_() {
      this.playbackRate(this.defaultPlaybackRate());
      this.handleTechRateChange_();
    }

    /**
     * Reset Volume bar
     */
    resetVolumeBar_() {
      this.volume(1.0);
      this.trigger('volumechange');
    }

    /**
     * Returns all of the current source objects.
     *
     * @return {Tech~SourceObject[]}
     *         The current source objects
     */
    currentSources() {
      const source = this.currentSource();
      const sources = [];

      // assume `{}` or `{ src }`
      if (Object.keys(source).length !== 0) {
        sources.push(source);
      }
      return this.cache_.sources || sources;
    }

    /**
     * Returns the current source object.
     *
     * @return {Tech~SourceObject}
     *         The current source object
     */
    currentSource() {
      return this.cache_.source || {};
    }

    /**
     * Returns the fully qualified URL of the current source value e.g. http://mysite.com/video.mp4
     * Can be used in conjunction with `currentType` to assist in rebuilding the current source object.
     *
     * @return {string}
     *         The current source
     */
    currentSrc() {
      return this.currentSource() && this.currentSource().src || '';
    }

    /**
     * Get the current source type e.g. video/mp4
     * This can allow you rebuild the current source object so that you could load the same
     * source and tech later
     *
     * @return {string}
     *         The source MIME type
     */
    currentType() {
      return this.currentSource() && this.currentSource().type || '';
    }

    /**
     * Get or set the preload attribute
     *
     * @param {'none'|'auto'|'metadata'} [value]
     *        Preload mode to pass to tech
     *
     * @return {string|undefined}
     *         - The preload attribute value when getting
     *         - Nothing when setting
     */
    preload(value) {
      if (value !== undefined) {
        this.techCall_('setPreload', value);
        this.options_.preload = value;
        return;
      }
      return this.techGet_('preload');
    }

    /**
     * Get or set the autoplay option. When this is a boolean it will
     * modify the attribute on the tech. When this is a string the attribute on
     * the tech will be removed and `Player` will handle autoplay on loadstarts.
     *
     * @param {boolean|'play'|'muted'|'any'} [value]
     *        - true: autoplay using the browser behavior
     *        - false: do not autoplay
     *        - 'play': call play() on every loadstart
     *        - 'muted': call muted() then play() on every loadstart
     *        - 'any': call play() on every loadstart. if that fails call muted() then play().
     *        - *: values other than those listed here will be set `autoplay` to true
     *
     * @return {boolean|string|undefined}
     *         - The current value of autoplay when getting
     *         - Nothing when setting
     */
    autoplay(value) {
      // getter usage
      if (value === undefined) {
        return this.options_.autoplay || false;
      }
      let techAutoplay;

      // if the value is a valid string set it to that, or normalize `true` to 'play', if need be
      if (typeof value === 'string' && /(any|play|muted)/.test(value) || value === true && this.options_.normalizeAutoplay) {
        this.options_.autoplay = value;
        this.manualAutoplay_(typeof value === 'string' ? value : 'play');
        techAutoplay = false;

        // any falsy value sets autoplay to false in the browser,
        // lets do the same
      } else if (!value) {
        this.options_.autoplay = false;

        // any other value (ie truthy) sets autoplay to true
      } else {
        this.options_.autoplay = true;
      }
      techAutoplay = typeof techAutoplay === 'undefined' ? this.options_.autoplay : techAutoplay;

      // if we don't have a tech then we do not queue up
      // a setAutoplay call on tech ready. We do this because the
      // autoplay option will be passed in the constructor and we
      // do not need to set it twice
      if (this.tech_) {
        this.techCall_('setAutoplay', techAutoplay);
      }
    }

    /**
     * Set or unset the playsinline attribute.
     * Playsinline tells the browser that non-fullscreen playback is preferred.
     *
     * @param {boolean} [value]
     *        - true means that we should try to play inline by default
     *        - false means that we should use the browser's default playback mode,
     *          which in most cases is inline. iOS Safari is a notable exception
     *          and plays fullscreen by default.
     *
     * @return {string|undefined}
     *         - the current value of playsinline
     *         - Nothing when setting
     *
     * @see [Spec]{@link https://html.spec.whatwg.org/#attr-video-playsinline}
     */
    playsinline(value) {
      if (value !== undefined) {
        this.techCall_('setPlaysinline', value);
        this.options_.playsinline = value;
      }
      return this.techGet_('playsinline');
    }

    /**
     * Get or set the loop attribute on the video element.
     *
     * @param {boolean} [value]
     *        - true means that we should loop the video
     *        - false means that we should not loop the video
     *
     * @return {boolean|undefined}
     *         - The current value of loop when getting
     *         - Nothing when setting
     */
    loop(value) {
      if (value !== undefined) {
        this.techCall_('setLoop', value);
        this.options_.loop = value;
        return;
      }
      return this.techGet_('loop');
    }

    /**
     * Get or set the poster image source url
     *
     * @fires Player#posterchange
     *
     * @param {string} [src]
     *        Poster image source URL
     *
     * @return {string|undefined}
     *         - The current value of poster when getting
     *         - Nothing when setting
     */
    poster(src) {
      if (src === undefined) {
        return this.poster_;
      }

      // The correct way to remove a poster is to set as an empty string
      // other falsey values will throw errors
      if (!src) {
        src = '';
      }
      if (src === this.poster_) {
        return;
      }

      // update the internal poster variable
      this.poster_ = src;

      // update the tech's poster
      this.techCall_('setPoster', src);
      this.isPosterFromTech_ = false;

      // alert components that the poster has been set
      /**
       * This event fires when the poster image is changed on the player.
       *
       * @event Player#posterchange
       * @type {Event}
       */
      this.trigger('posterchange');
    }

    /**
     * Some techs (e.g. YouTube) can provide a poster source in an
     * asynchronous way. We want the poster component to use this
     * poster source so that it covers up the tech's controls.
     * (YouTube's play button). However we only want to use this
     * source if the player user hasn't set a poster through
     * the normal APIs.
     *
     * @fires Player#posterchange
     * @listens Tech#posterchange
     * @private
     */
    handleTechPosterChange_() {
      if ((!this.poster_ || this.options_.techCanOverridePoster) && this.tech_ && this.tech_.poster) {
        const newPoster = this.tech_.poster() || '';
        if (newPoster !== this.poster_) {
          this.poster_ = newPoster;
          this.isPosterFromTech_ = true;

          // Let components know the poster has changed
          this.trigger('posterchange');
        }
      }
    }

    /**
     * Get or set whether or not the controls are showing.
     *
     * @fires Player#controlsenabled
     *
     * @param {boolean} [bool]
     *        - true to turn controls on
     *        - false to turn controls off
     *
     * @return {boolean|undefined}
     *         - The current value of controls when getting
     *         - Nothing when setting
     */
    controls(bool) {
      if (bool === undefined) {
        return !!this.controls_;
      }
      bool = !!bool;

      // Don't trigger a change event unless it actually changed
      if (this.controls_ === bool) {
        return;
      }
      this.controls_ = bool;
      if (this.usingNativeControls()) {
        this.techCall_('setControls', bool);
      }
      if (this.controls_) {
        this.removeClass('vjs-controls-disabled');
        this.addClass('vjs-controls-enabled');
        /**
         * @event Player#controlsenabled
         * @type {Event}
         */
        this.trigger('controlsenabled');
        if (!this.usingNativeControls()) {
          this.addTechControlsListeners_();
        }
      } else {
        this.removeClass('vjs-controls-enabled');
        this.addClass('vjs-controls-disabled');
        /**
         * @event Player#controlsdisabled
         * @type {Event}
         */
        this.trigger('controlsdisabled');
        if (!this.usingNativeControls()) {
          this.removeTechControlsListeners_();
        }
      }
    }

    /**
     * Toggle native controls on/off. Native controls are the controls built into
     * devices (e.g. default iPhone controls) or other techs
     * (e.g. Vimeo Controls)
     * **This should only be set by the current tech, because only the tech knows
     * if it can support native controls**
     *
     * @fires Player#usingnativecontrols
     * @fires Player#usingcustomcontrols
     *
     * @param {boolean} [bool]
     *        - true to turn native controls on
     *        - false to turn native controls off
     *
     * @return {boolean|undefined}
     *         - The current value of native controls when getting
     *         - Nothing when setting
     */
    usingNativeControls(bool) {
      if (bool === undefined) {
        return !!this.usingNativeControls_;
      }
      bool = !!bool;

      // Don't trigger a change event unless it actually changed
      if (this.usingNativeControls_ === bool) {
        return;
      }
      this.usingNativeControls_ = bool;
      if (this.usingNativeControls_) {
        this.addClass('vjs-using-native-controls');

        /**
         * player is using the native device controls
         *
         * @event Player#usingnativecontrols
         * @type {Event}
         */
        this.trigger('usingnativecontrols');
      } else {
        this.removeClass('vjs-using-native-controls');

        /**
         * player is using the custom HTML controls
         *
         * @event Player#usingcustomcontrols
         * @type {Event}
         */
        this.trigger('usingcustomcontrols');
      }
    }

    /**
     * Set or get the current MediaError
     *
     * @fires Player#error
     *
     * @param  {MediaError|string|number} [err]
     *         A MediaError or a string/number to be turned
     *         into a MediaError
     *
     * @return {MediaError|null|undefined}
     *         - The current MediaError when getting (or null)
     *         - Nothing when setting
     */
    error(err) {
      if (err === undefined) {
        return this.error_ || null;
      }

      // allow hooks to modify error object
      hooks('beforeerror').forEach(hookFunction => {
        const newErr = hookFunction(this, err);
        if (!(isObject(newErr) && !Array.isArray(newErr) || typeof newErr === 'string' || typeof newErr === 'number' || newErr === null)) {
          this.log.error('please return a value that MediaError expects in beforeerror hooks');
          return;
        }
        err = newErr;
      });

      // Suppress the first error message for no compatible source until
      // user interaction
      if (this.options_.suppressNotSupportedError && err && err.code === 4) {
        const triggerSuppressedError = function () {
          this.error(err);
        };
        this.options_.suppressNotSupportedError = false;
        this.any(['click', 'touchstart'], triggerSuppressedError);
        this.one('loadstart', function () {
          this.off(['click', 'touchstart'], triggerSuppressedError);
        });
        return;
      }

      // restoring to default
      if (err === null) {
        this.error_ = null;
        this.removeClass('vjs-error');
        if (this.errorDisplay) {
          this.errorDisplay.close();
        }
        return;
      }
      this.error_ = new MediaError(err);

      // add the vjs-error classname to the player
      this.addClass('vjs-error');

      // log the name of the error type and any message
      // IE11 logs "[object object]" and required you to expand message to see error object
      log.error(`(CODE:${this.error_.code} ${MediaError.errorTypes[this.error_.code]})`, this.error_.message, this.error_);

      /**
       * @event Player#error
       * @type {Event}
       */
      this.trigger('error');

      // notify hooks of the per player error
      hooks('error').forEach(hookFunction => hookFunction(this, this.error_));
      return;
    }

    /**
     * Report user activity
     *
     * @param {Object} event
     *        Event object
     */
    reportUserActivity(event) {
      this.userActivity_ = true;
    }

    /**
     * Get/set if user is active
     *
     * @fires Player#useractive
     * @fires Player#userinactive
     *
     * @param {boolean} [bool]
     *        - true if the user is active
     *        - false if the user is inactive
     *
     * @return {boolean|undefined}
     *         - The current value of userActive when getting
     *         - Nothing when setting
     */
    userActive(bool) {
      if (bool === undefined) {
        return this.userActive_;
      }
      bool = !!bool;
      if (bool === this.userActive_) {
        return;
      }
      this.userActive_ = bool;
      if (this.userActive_) {
        this.userActivity_ = true;
        this.removeClass('vjs-user-inactive');
        this.addClass('vjs-user-active');
        /**
         * @event Player#useractive
         * @type {Event}
         */
        this.trigger('useractive');
        return;
      }

      // Chrome/Safari/IE have bugs where when you change the cursor it can
      // trigger a mousemove event. This causes an issue when you're hiding
      // the cursor when the user is inactive, and a mousemove signals user
      // activity. Making it impossible to go into inactive mode. Specifically
      // this happens in fullscreen when we really need to hide the cursor.
      //
      // When this gets resolved in ALL browsers it can be removed
      // https://code.google.com/p/chromium/issues/detail?id=103041
      if (this.tech_) {
        this.tech_.one('mousemove', function (e) {
          e.stopPropagation();
          e.preventDefault();
        });
      }
      this.userActivity_ = false;
      this.removeClass('vjs-user-active');
      this.addClass('vjs-user-inactive');
      /**
       * @event Player#userinactive
       * @type {Event}
       */
      this.trigger('userinactive');
    }

    /**
     * Listen for user activity based on timeout value
     *
     * @private
     */
    listenForUserActivity_() {
      let mouseInProgress;
      let lastMoveX;
      let lastMoveY;
      const handleActivity = bind_(this, this.reportUserActivity);
      const handleMouseMove = function (e) {
        // #1068 - Prevent mousemove spamming
        // Chrome Bug: https://code.google.com/p/chromium/issues/detail?id=366970
        if (e.screenX !== lastMoveX || e.screenY !== lastMoveY) {
          lastMoveX = e.screenX;
          lastMoveY = e.screenY;
          handleActivity();
        }
      };
      const handleMouseDown = function () {
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
      const handleMouseUpAndMouseLeave = function (event) {
        handleActivity();
        // Stop the interval that maintains activity if the mouse/touch is down
        this.clearInterval(mouseInProgress);
      };

      // Any mouse movement will be considered user activity
      this.on('mousedown', handleMouseDown);
      this.on('mousemove', handleMouseMove);
      this.on('mouseup', handleMouseUpAndMouseLeave);
      this.on('mouseleave', handleMouseUpAndMouseLeave);
      const controlBar = this.getChild('controlBar');

      // Fixes bug on Android & iOS where when tapping progressBar (when control bar is displayed)
      // controlBar would no longer be hidden by default timeout.
      if (controlBar && !IS_IOS && !IS_ANDROID) {
        controlBar.on('mouseenter', function (event) {
          if (this.player().options_.inactivityTimeout !== 0) {
            this.player().cache_.inactivityTimeout = this.player().options_.inactivityTimeout;
          }
          this.player().options_.inactivityTimeout = 0;
        });
        controlBar.on('mouseleave', function (event) {
          this.player().options_.inactivityTimeout = this.player().cache_.inactivityTimeout;
        });
      }

      // Listen for keyboard navigation
      // Shouldn't need to use inProgress interval because of key repeat
      this.on('keydown', handleActivity);
      this.on('keyup', handleActivity);

      // Run an interval every 250 milliseconds instead of stuffing everything into
      // the mousemove/touchmove function itself, to prevent performance degradation.
      // `this.reportUserActivity` simply sets this.userActivity_ to true, which
      // then gets picked up by this loop
      // http://ejohn.org/blog/learning-from-twitter/
      let inactivityTimeout;

      /** @this Player */
      const activityCheck = function () {
        // Check to see if mouse/touch activity has happened
        if (!this.userActivity_) {
          return;
        }

        // Reset the activity tracker
        this.userActivity_ = false;

        // If the user state was inactive, set the state to active
        this.userActive(true);

        // Clear any existing inactivity timeout to start the timer over
        this.clearTimeout(inactivityTimeout);
        const timeout = this.options_.inactivityTimeout;
        if (timeout <= 0) {
          return;
        }

        // In <timeout> milliseconds, if no more activity has occurred the
        // user will be considered inactive
        inactivityTimeout = this.setTimeout(function () {
          // Protect against the case where the inactivityTimeout can trigger just
          // before the next user activity is picked up by the activity check loop
          // causing a flicker
          if (!this.userActivity_) {
            this.userActive(false);
          }
        }, timeout);
      };
      this.setInterval(activityCheck, 250);
    }

    /**
     * Gets or sets the current playback rate. A playback rate of
     * 1.0 represents normal speed and 0.5 would indicate half-speed
     * playback, for instance.
     *
     * @see https://html.spec.whatwg.org/multipage/embedded-content.html#dom-media-playbackrate
     *
     * @param {number} [rate]
     *       New playback rate to set.
     *
     * @return {number|undefined}
     *         - The current playback rate when getting or 1.0
     *         - Nothing when setting
     */
    playbackRate(rate) {
      if (rate !== undefined) {
        // NOTE: this.cache_.lastPlaybackRate is set from the tech handler
        // that is registered above
        this.techCall_('setPlaybackRate', rate);
        return;
      }
      if (this.tech_ && this.tech_.featuresPlaybackRate) {
        return this.cache_.lastPlaybackRate || this.techGet_('playbackRate');
      }
      return 1.0;
    }

    /**
     * Gets or sets the current default playback rate. A default playback rate of
     * 1.0 represents normal speed and 0.5 would indicate half-speed playback, for instance.
     * defaultPlaybackRate will only represent what the initial playbackRate of a video was, not
     * not the current playbackRate.
     *
     * @see https://html.spec.whatwg.org/multipage/embedded-content.html#dom-media-defaultplaybackrate
     *
     * @param {number} [rate]
     *       New default playback rate to set.
     *
     * @return {number|undefined}
     *         - The default playback rate when getting or 1.0
     *         - Nothing when setting
     */
    defaultPlaybackRate(rate) {
      if (rate !== undefined) {
        return this.techCall_('setDefaultPlaybackRate', rate);
      }
      if (this.tech_ && this.tech_.featuresPlaybackRate) {
        return this.techGet_('defaultPlaybackRate');
      }
      return 1.0;
    }

    /**
     * Gets or sets the audio flag
     *
     * @param {boolean} [bool]
     *        - true signals that this is an audio player
     *        - false signals that this is not an audio player
     *
     * @return {boolean|undefined}
     *         - The current value of isAudio when getting
     *         - Nothing when setting
     */
    isAudio(bool) {
      if (bool !== undefined) {
        this.isAudio_ = !!bool;
        return;
      }
      return !!this.isAudio_;
    }
    enableAudioOnlyUI_() {
      // Update styling immediately to show the control bar so we can get its height
      this.addClass('vjs-audio-only-mode');
      const playerChildren = this.children();
      const controlBar = this.getChild('ControlBar');
      const controlBarHeight = controlBar && controlBar.currentHeight();

      // Hide all player components except the control bar. Control bar components
      // needed only for video are hidden with CSS
      playerChildren.forEach(child => {
        if (child === controlBar) {
          return;
        }
        if (child.el_ && !child.hasClass('vjs-hidden')) {
          child.hide();
          this.audioOnlyCache_.hiddenChildren.push(child);
        }
      });
      this.audioOnlyCache_.playerHeight = this.currentHeight();

      // Set the player height the same as the control bar
      this.height(controlBarHeight);
      this.trigger('audioonlymodechange');
    }
    disableAudioOnlyUI_() {
      this.removeClass('vjs-audio-only-mode');

      // Show player components that were previously hidden
      this.audioOnlyCache_.hiddenChildren.forEach(child => child.show());

      // Reset player height
      this.height(this.audioOnlyCache_.playerHeight);
      this.trigger('audioonlymodechange');
    }

    /**
     * Get the current audioOnlyMode state or set audioOnlyMode to true or false.
     *
     * Setting this to `true` will hide all player components except the control bar,
     * as well as control bar components needed only for video.
     *
     * @param {boolean} [value]
     *         The value to set audioOnlyMode to.
     *
     * @return {Promise|boolean}
     *        A Promise is returned when setting the state, and a boolean when getting
     *        the present state
     */
    audioOnlyMode(value) {
      if (typeof value !== 'boolean' || value === this.audioOnlyMode_) {
        return this.audioOnlyMode_;
      }
      this.audioOnlyMode_ = value;

      // Enable Audio Only Mode
      if (value) {
        const exitPromises = [];

        // Fullscreen and PiP are not supported in audioOnlyMode, so exit if we need to.
        if (this.isInPictureInPicture()) {
          exitPromises.push(this.exitPictureInPicture());
        }
        if (this.isFullscreen()) {
          exitPromises.push(this.exitFullscreen());
        }
        if (this.audioPosterMode()) {
          exitPromises.push(this.audioPosterMode(false));
        }
        return Promise.all(exitPromises).then(() => this.enableAudioOnlyUI_());
      }

      // Disable Audio Only Mode
      return Promise.resolve().then(() => this.disableAudioOnlyUI_());
    }
    enablePosterModeUI_() {
      // Hide the video element and show the poster image to enable posterModeUI
      const tech = this.tech_ && this.tech_;
      tech.hide();
      this.addClass('vjs-audio-poster-mode');
      this.trigger('audiopostermodechange');
    }
    disablePosterModeUI_() {
      // Show the video element and hide the poster image to disable posterModeUI
      const tech = this.tech_ && this.tech_;
      tech.show();
      this.removeClass('vjs-audio-poster-mode');
      this.trigger('audiopostermodechange');
    }

    /**
     * Get the current audioPosterMode state or set audioPosterMode to true or false
     *
     * @param {boolean} [value]
     *         The value to set audioPosterMode to.
     *
     * @return {Promise|boolean}
     *         A Promise is returned when setting the state, and a boolean when getting
     *        the present state
     */
    audioPosterMode(value) {
      if (typeof value !== 'boolean' || value === this.audioPosterMode_) {
        return this.audioPosterMode_;
      }
      this.audioPosterMode_ = value;
      if (value) {
        if (this.audioOnlyMode()) {
          const audioOnlyModePromise = this.audioOnlyMode(false);
          return audioOnlyModePromise.then(() => {
            // enable audio poster mode after audio only mode is disabled
            this.enablePosterModeUI_();
          });
        }
        return Promise.resolve().then(() => {
          // enable audio poster mode
          this.enablePosterModeUI_();
        });
      }
      return Promise.resolve().then(() => {
        // disable audio poster mode
        this.disablePosterModeUI_();
      });
    }

    /**
     * A helper method for adding a {@link TextTrack} to our
     * {@link TextTrackList}.
     *
     * In addition to the W3C settings we allow adding additional info through options.
     *
     * @see http://www.w3.org/html/wg/drafts/html/master/embedded-content-0.html#dom-media-addtexttrack
     *
     * @param {string} [kind]
     *        the kind of TextTrack you are adding
     *
     * @param {string} [label]
     *        the label to give the TextTrack label
     *
     * @param {string} [language]
     *        the language to set on the TextTrack
     *
     * @return {TextTrack|undefined}
     *         the TextTrack that was added or undefined
     *         if there is no tech
     */
    addTextTrack(kind, label, language) {
      if (this.tech_) {
        return this.tech_.addTextTrack(kind, label, language);
      }
    }

    /**
     * Create a remote {@link TextTrack} and an {@link HTMLTrackElement}.
     *
     * @param {Object} options
     *        Options to pass to {@link HTMLTrackElement} during creation. See
     *        {@link HTMLTrackElement} for object properties that you should use.
     *
     * @param {boolean} [manualCleanup=false] if set to true, the TextTrack will not be removed
     *                                        from the TextTrackList and HtmlTrackElementList
     *                                        after a source change
     *
     * @return { import('./tracks/html-track-element').default }
     *         the HTMLTrackElement that was created and added
     *         to the HtmlTrackElementList and the remote
     *         TextTrackList
     *
     */
    addRemoteTextTrack(options, manualCleanup) {
      if (this.tech_) {
        return this.tech_.addRemoteTextTrack(options, manualCleanup);
      }
    }

    /**
     * Remove a remote {@link TextTrack} from the respective
     * {@link TextTrackList} and {@link HtmlTrackElementList}.
     *
     * @param {Object} track
     *        Remote {@link TextTrack} to remove
     *
     * @return {undefined}
     *         does not return anything
     */
    removeRemoteTextTrack(obj = {}) {
      let {
        track
      } = obj;
      if (!track) {
        track = obj;
      }

      // destructure the input into an object with a track argument, defaulting to arguments[0]
      // default the whole argument to an empty object if nothing was passed in

      if (this.tech_) {
        return this.tech_.removeRemoteTextTrack(track);
      }
    }

    /**
     * Gets available media playback quality metrics as specified by the W3C's Media
     * Playback Quality API.
     *
     * @see [Spec]{@link https://wicg.github.io/media-playback-quality}
     *
     * @return {Object|undefined}
     *         An object with supported media playback quality metrics or undefined if there
     *         is no tech or the tech does not support it.
     */
    getVideoPlaybackQuality() {
      return this.techGet_('getVideoPlaybackQuality');
    }

    /**
     * Get video width
     *
     * @return {number}
     *         current video width
     */
    videoWidth() {
      return this.tech_ && this.tech_.videoWidth && this.tech_.videoWidth() || 0;
    }

    /**
     * Get video height
     *
     * @return {number}
     *         current video height
     */
    videoHeight() {
      return this.tech_ && this.tech_.videoHeight && this.tech_.videoHeight() || 0;
    }

    /**
     * Set or get the player's language code.
     *
     * Changing the language will trigger
     * [languagechange]{@link Player#event:languagechange}
     * which Components can use to update control text.
     * ClickableComponent will update its control text by default on
     * [languagechange]{@link Player#event:languagechange}.
     *
     * @fires Player#languagechange
     *
     * @param {string} [code]
     *        the language code to set the player to
     *
     * @return {string|undefined}
     *         - The current language code when getting
     *         - Nothing when setting
     */
    language(code) {
      if (code === undefined) {
        return this.language_;
      }
      if (this.language_ !== String(code).toLowerCase()) {
        this.language_ = String(code).toLowerCase();

        // during first init, it's possible some things won't be evented
        if (isEvented(this)) {
          /**
          * fires when the player language change
          *
          * @event Player#languagechange
          * @type {Event}
          */
          this.trigger('languagechange');
        }
      }
    }

    /**
     * Get the player's language dictionary
     * Merge every time, because a newly added plugin might call videojs.addLanguage() at any time
     * Languages specified directly in the player options have precedence
     *
     * @return {Array}
     *         An array of of supported languages
     */
    languages() {
      return merge(Player.prototype.options_.languages, this.languages_);
    }

    /**
     * returns a JavaScript object representing the current track
     * information. **DOES not return it as JSON**
     *
     * @return {Object}
     *         Object representing the current of track info
     */
    toJSON() {
      const options = merge(this.options_);
      const tracks = options.tracks;
      options.tracks = [];
      for (let i = 0; i < tracks.length; i++) {
        let track = tracks[i];

        // deep merge tracks and null out player so no circular references
        track = merge(track);
        track.player = undefined;
        options.tracks[i] = track;
      }
      return options;
    }

    /**
     * Creates a simple modal dialog (an instance of the {@link ModalDialog}
     * component) that immediately overlays the player with arbitrary
     * content and removes itself when closed.
     *
     * @param {string|Function|Element|Array|null} content
     *        Same as {@link ModalDialog#content}'s param of the same name.
     *        The most straight-forward usage is to provide a string or DOM
     *        element.
     *
     * @param {Object} [options]
     *        Extra options which will be passed on to the {@link ModalDialog}.
     *
     * @return {ModalDialog}
     *         the {@link ModalDialog} that was created
     */
    createModal(content, options) {
      options = options || {};
      options.content = content || '';
      const modal = new ModalDialog(this, options);
      this.addChild(modal);
      modal.on('dispose', () => {
        this.removeChild(modal);
      });
      modal.open();
      return modal;
    }

    /**
     * Change breakpoint classes when the player resizes.
     *
     * @private
     */
    updateCurrentBreakpoint_() {
      if (!this.responsive()) {
        return;
      }
      const currentBreakpoint = this.currentBreakpoint();
      const currentWidth = this.currentWidth();
      for (let i = 0; i < BREAKPOINT_ORDER.length; i++) {
        const candidateBreakpoint = BREAKPOINT_ORDER[i];
        const maxWidth = this.breakpoints_[candidateBreakpoint];
        if (currentWidth <= maxWidth) {
          // The current breakpoint did not change, nothing to do.
          if (currentBreakpoint === candidateBreakpoint) {
            return;
          }

          // Only remove a class if there is a current breakpoint.
          if (currentBreakpoint) {
            this.removeClass(BREAKPOINT_CLASSES[currentBreakpoint]);
          }
          this.addClass(BREAKPOINT_CLASSES[candidateBreakpoint]);
          this.breakpoint_ = candidateBreakpoint;
          break;
        }
      }
    }

    /**
     * Removes the current breakpoint.
     *
     * @private
     */
    removeCurrentBreakpoint_() {
      const className = this.currentBreakpointClass();
      this.breakpoint_ = '';
      if (className) {
        this.removeClass(className);
      }
    }

    /**
     * Get or set breakpoints on the player.
     *
     * Calling this method with an object or `true` will remove any previous
     * custom breakpoints and start from the defaults again.
     *
     * @param  {Object|boolean} [breakpoints]
     *         If an object is given, it can be used to provide custom
     *         breakpoints. If `true` is given, will set default breakpoints.
     *         If this argument is not given, will simply return the current
     *         breakpoints.
     *
     * @param  {number} [breakpoints.tiny]
     *         The maximum width for the "vjs-layout-tiny" class.
     *
     * @param  {number} [breakpoints.xsmall]
     *         The maximum width for the "vjs-layout-x-small" class.
     *
     * @param  {number} [breakpoints.small]
     *         The maximum width for the "vjs-layout-small" class.
     *
     * @param  {number} [breakpoints.medium]
     *         The maximum width for the "vjs-layout-medium" class.
     *
     * @param  {number} [breakpoints.large]
     *         The maximum width for the "vjs-layout-large" class.
     *
     * @param  {number} [breakpoints.xlarge]
     *         The maximum width for the "vjs-layout-x-large" class.
     *
     * @param  {number} [breakpoints.huge]
     *         The maximum width for the "vjs-layout-huge" class.
     *
     * @return {Object}
     *         An object mapping breakpoint names to maximum width values.
     */
    breakpoints(breakpoints) {
      // Used as a getter.
      if (breakpoints === undefined) {
        return Object.assign(this.breakpoints_);
      }
      this.breakpoint_ = '';
      this.breakpoints_ = Object.assign({}, DEFAULT_BREAKPOINTS, breakpoints);

      // When breakpoint definitions change, we need to update the currently
      // selected breakpoint.
      this.updateCurrentBreakpoint_();

      // Clone the breakpoints before returning.
      return Object.assign(this.breakpoints_);
    }

    /**
     * Get or set a flag indicating whether or not this player should adjust
     * its UI based on its dimensions.
     *
     * @param  {boolean} [value]
     *         Should be `true` if the player should adjust its UI based on its
     *         dimensions; otherwise, should be `false`.
     *
     * @return {boolean|undefined}
     *         Will be `true` if this player should adjust its UI based on its
     *         dimensions; otherwise, will be `false`.
     *         Nothing if setting
     */
    responsive(value) {
      // Used as a getter.
      if (value === undefined) {
        return this.responsive_;
      }
      value = Boolean(value);
      const current = this.responsive_;

      // Nothing changed.
      if (value === current) {
        return;
      }

      // The value actually changed, set it.
      this.responsive_ = value;

      // Start listening for breakpoints and set the initial breakpoint if the
      // player is now responsive.
      if (value) {
        this.on('playerresize', this.boundUpdateCurrentBreakpoint_);
        this.updateCurrentBreakpoint_();

        // Stop listening for breakpoints if the player is no longer responsive.
      } else {
        this.off('playerresize', this.boundUpdateCurrentBreakpoint_);
        this.removeCurrentBreakpoint_();
      }
      return value;
    }

    /**
     * Get current breakpoint name, if any.
     *
     * @return {string}
     *         If there is currently a breakpoint set, returns a the key from the
     *         breakpoints object matching it. Otherwise, returns an empty string.
     */
    currentBreakpoint() {
      return this.breakpoint_;
    }

    /**
     * Get the current breakpoint class name.
     *
     * @return {string}
     *         The matching class name (e.g. `"vjs-layout-tiny"` or
     *         `"vjs-layout-large"`) for the current breakpoint. Empty string if
     *         there is no current breakpoint.
     */
    currentBreakpointClass() {
      return BREAKPOINT_CLASSES[this.breakpoint_] || '';
    }

    /**
     * An object that describes a single piece of media.
     *
     * Properties that are not part of this type description will be retained; so,
     * this can be viewed as a generic metadata storage mechanism as well.
     *
     * @see      {@link https://wicg.github.io/mediasession/#the-mediametadata-interface}
     * @typedef  {Object} Player~MediaObject
     *
     * @property {string} [album]
     *           Unused, except if this object is passed to the `MediaSession`
     *           API.
     *
     * @property {string} [artist]
     *           Unused, except if this object is passed to the `MediaSession`
     *           API.
     *
     * @property {Object[]} [artwork]
     *           Unused, except if this object is passed to the `MediaSession`
     *           API. If not specified, will be populated via the `poster`, if
     *           available.
     *
     * @property {string} [poster]
     *           URL to an image that will display before playback.
     *
     * @property {Tech~SourceObject|Tech~SourceObject[]|string} [src]
     *           A single source object, an array of source objects, or a string
     *           referencing a URL to a media source. It is _highly recommended_
     *           that an object or array of objects is used here, so that source
     *           selection algorithms can take the `type` into account.
     *
     * @property {string} [title]
     *           Unused, except if this object is passed to the `MediaSession`
     *           API.
     *
     * @property {Object[]} [textTracks]
     *           An array of objects to be used to create text tracks, following
     *           the {@link https://www.w3.org/TR/html50/embedded-content-0.html#the-track-element|native track element format}.
     *           For ease of removal, these will be created as "remote" text
     *           tracks and set to automatically clean up on source changes.
     *
     *           These objects may have properties like `src`, `kind`, `label`,
     *           and `language`, see {@link Tech#createRemoteTextTrack}.
     */

    /**
     * Populate the player using a {@link Player~MediaObject|MediaObject}.
     *
     * @param  {Player~MediaObject} media
     *         A media object.
     *
     * @param  {Function} ready
     *         A callback to be called when the player is ready.
     */
    loadMedia(media, ready) {
      if (!media || typeof media !== 'object') {
        return;
      }
      const crossOrigin = this.crossOrigin();
      this.reset();

      // Clone the media object so it cannot be mutated from outside.
      this.cache_.media = merge(media);
      const {
        artist,
        artwork,
        description,
        poster,
        src,
        textTracks,
        title
      } = this.cache_.media;

      // If `artwork` is not given, create it using `poster`.
      if (!artwork && poster) {
        this.cache_.media.artwork = [{
          src: poster,
          type: getMimetype(poster)
        }];
      }
      if (crossOrigin) {
        this.crossOrigin(crossOrigin);
      }
      if (src) {
        this.src(src);
      }
      if (poster) {
        this.poster(poster);
      }
      if (Array.isArray(textTracks)) {
        textTracks.forEach(tt => this.addRemoteTextTrack(tt, false));
      }
      if (this.titleBar) {
        this.titleBar.update({
          title,
          description: description || artist || ''
        });
      }
      this.ready(ready);
    }

    /**
     * Get a clone of the current {@link Player~MediaObject} for this player.
     *
     * If the `loadMedia` method has not been used, will attempt to return a
     * {@link Player~MediaObject} based on the current state of the player.
     *
     * @return {Player~MediaObject}
     */
    getMedia() {
      if (!this.cache_.media) {
        const poster = this.poster();
        const src = this.currentSources();
        const textTracks = Array.prototype.map.call(this.remoteTextTracks(), tt => ({
          kind: tt.kind,
          label: tt.label,
          language: tt.language,
          src: tt.src
        }));
        const media = {
          src,
          textTracks
        };
        if (poster) {
          media.poster = poster;
          media.artwork = [{
            src: media.poster,
            type: getMimetype(media.poster)
          }];
        }
        return media;
      }
      return merge(this.cache_.media);
    }

    /**
     * Gets tag settings
     *
     * @param {Element} tag
     *        The player tag
     *
     * @return {Object}
     *         An object containing all of the settings
     *         for a player tag
     */
    static getTagSettings(tag) {
      const baseOptions = {
        sources: [],
        tracks: []
      };
      const tagOptions = getAttributes(tag);
      const dataSetup = tagOptions['data-setup'];
      if (hasClass(tag, 'vjs-fill')) {
        tagOptions.fill = true;
      }
      if (hasClass(tag, 'vjs-fluid')) {
        tagOptions.fluid = true;
      }

      // Check if data-setup attr exists.
      if (dataSetup !== null) {
        // Parse options JSON
        // If empty string, make it a parsable json object.
        const [err, data] = tuple(dataSetup || '{}');
        if (err) {
          log.error(err);
        }
        Object.assign(tagOptions, data);
      }
      Object.assign(baseOptions, tagOptions);

      // Get tag children settings
      if (tag.hasChildNodes()) {
        const children = tag.childNodes;
        for (let i = 0, j = children.length; i < j; i++) {
          const child = children[i];
          // Change case needed: http://ejohn.org/blog/nodename-case-sensitivity/
          const childName = child.nodeName.toLowerCase();
          if (childName === 'source') {
            baseOptions.sources.push(getAttributes(child));
          } else if (childName === 'track') {
            baseOptions.tracks.push(getAttributes(child));
          }
        }
      }
      return baseOptions;
    }

    /**
     * Set debug mode to enable/disable logs at info level.
     *
     * @param {boolean} enabled
     * @fires Player#debugon
     * @fires Player#debugoff
     * @return {boolean|undefined}
     */
    debug(enabled) {
      if (enabled === undefined) {
        return this.debugEnabled_;
      }
      if (enabled) {
        this.trigger('debugon');
        this.previousLogLevel_ = this.log.level;
        this.log.level('debug');
        this.debugEnabled_ = true;
      } else {
        this.trigger('debugoff');
        this.log.level(this.previousLogLevel_);
        this.previousLogLevel_ = undefined;
        this.debugEnabled_ = false;
      }
    }

    /**
     * Set or get current playback rates.
     * Takes an array and updates the playback rates menu with the new items.
     * Pass in an empty array to hide the menu.
     * Values other than arrays are ignored.
     *
     * @fires Player#playbackrateschange
     * @param {number[]} newRates
     *                   The new rates that the playback rates menu should update to.
     *                   An empty array will hide the menu
     * @return {number[]} When used as a getter will return the current playback rates
     */
    playbackRates(newRates) {
      if (newRates === undefined) {
        return this.cache_.playbackRates;
      }

      // ignore any value that isn't an array
      if (!Array.isArray(newRates)) {
        return;
      }

      // ignore any arrays that don't only contain numbers
      if (!newRates.every(rate => typeof rate === 'number')) {
        return;
      }
      this.cache_.playbackRates = newRates;

      /**
      * fires when the playback rates in a player are changed
      *
      * @event Player#playbackrateschange
      * @type {Event}
      */
      this.trigger('playbackrateschange');
    }
  }

  /**
   * Get the {@link VideoTrackList}
   *
   * @link https://html.spec.whatwg.org/multipage/embedded-content.html#videotracklist
   *
   * @return {VideoTrackList}
   *         the current video track list
   *
   * @method Player.prototype.videoTracks
   */

  /**
   * Get the {@link AudioTrackList}
   *
   * @link https://html.spec.whatwg.org/multipage/embedded-content.html#audiotracklist
   *
   * @return {AudioTrackList}
   *         the current audio track list
   *
   * @method Player.prototype.audioTracks
   */

  /**
   * Get the {@link TextTrackList}
   *
   * @link http://www.w3.org/html/wg/drafts/html/master/embedded-content-0.html#dom-media-texttracks
   *
   * @return {TextTrackList}
   *         the current text track list
   *
   * @method Player.prototype.textTracks
   */

  /**
   * Get the remote {@link TextTrackList}
   *
   * @return {TextTrackList}
   *         The current remote text track list
   *
   * @method Player.prototype.remoteTextTracks
   */

  /**
   * Get the remote {@link HtmlTrackElementList} tracks.
   *
   * @return {HtmlTrackElementList}
   *         The current remote text track element list
   *
   * @method Player.prototype.remoteTextTrackEls
   */

  ALL.names.forEach(function (name) {
    const props = ALL[name];
    Player.prototype[props.getterName] = function () {
      if (this.tech_) {
        return this.tech_[props.getterName]();
      }

      // if we have not yet loadTech_, we create {video,audio,text}Tracks_
      // these will be passed to the tech during loading
      this[props.privateName] = this[props.privateName] || new props.ListClass();
      return this[props.privateName];
    };
  });

  /**
   * Get or set the `Player`'s crossorigin option. For the HTML5 player, this
   * sets the `crossOrigin` property on the `<video>` tag to control the CORS
   * behavior.
   *
   * @see [Video Element Attributes]{@link https://developer.mozilla.org/en-US/docs/Web/HTML/Element/video#attr-crossorigin}
   *
   * @param {string} [value]
   *        The value to set the `Player`'s crossorigin to. If an argument is
   *        given, must be one of `anonymous` or `use-credentials`.
   *
   * @return {string|undefined}
   *         - The current crossorigin value of the `Player` when getting.
   *         - undefined when setting
   */
  Player.prototype.crossorigin = Player.prototype.crossOrigin;

  /**
   * Global enumeration of players.
   *
   * The keys are the player IDs and the values are either the {@link Player}
   * instance or `null` for disposed players.
   *
   * @type {Object}
   */
  Player.players = {};
  const navigator = window.navigator;

  /*
   * Player instance options, surfaced using options
   * options = Player.prototype.options_
   * Make changes in options, not here.
   *
   * @type {Object}
   * @private
   */
  Player.prototype.options_ = {
    // Default order of fallback technology
    techOrder: Tech.defaultTechOrder_,
    html5: {},
    // enable sourceset by default
    enableSourceset: true,
    // default inactivity timeout
    inactivityTimeout: 2000,
    // default playback rates
    playbackRates: [],
    // Add playback rate selection by adding rates
    // 'playbackRates': [0.5, 1, 1.5, 2],
    liveui: false,
    // Included control sets
    children: ['mediaLoader', 'posterImage', 'titleBar', 'textTrackDisplay', 'loadingSpinner', 'bigPlayButton', 'liveTracker', 'controlBar', 'errorDisplay', 'textTrackSettings', 'resizeManager'],
    language: navigator && (navigator.languages && navigator.languages[0] || navigator.userLanguage || navigator.language) || 'en',
    // locales and their language translations
    languages: {},
    // Default message to show when a video cannot be played.
    notSupportedMessage: 'No compatible source was found for this media.',
    normalizeAutoplay: false,
    fullscreen: {
      options: {
        navigationUI: 'hide'
      }
    },
    breakpoints: {},
    responsive: false,
    audioOnlyMode: false,
    audioPosterMode: false
  };
  [
  /**
   * Returns whether or not the player is in the "ended" state.
   *
   * @return {Boolean} True if the player is in the ended state, false if not.
   * @method Player#ended
   */
  'ended',
  /**
   * Returns whether or not the player is in the "seeking" state.
   *
   * @return {Boolean} True if the player is in the seeking state, false if not.
   * @method Player#seeking
   */
  'seeking',
  /**
   * Returns the TimeRanges of the media that are currently available
   * for seeking to.
   *
   * @return {TimeRanges} the seekable intervals of the media timeline
   * @method Player#seekable
   */
  'seekable',
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
   *
   * @see https://html.spec.whatwg.org/multipage/embedded-content.html#network-states
   * @return {number} the current network activity state
   * @method Player#networkState
   */
  'networkState',
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
   *
   * @see https://html.spec.whatwg.org/multipage/embedded-content.html#dom-media-readystate
   * @return {number} the current playback rendering state
   * @method Player#readyState
   */
  'readyState'].forEach(function (fn) {
    Player.prototype[fn] = function () {
      return this.techGet_(fn);
    };
  });
  TECH_EVENTS_RETRIGGER.forEach(function (event) {
    Player.prototype[`handleTech${toTitleCase(event)}_`] = function () {
      return this.trigger(event);
    };
  });

  /**
   * Fired when the player has initial duration and dimension information
   *
   * @event Player#loadedmetadata
   * @type {Event}
   */

  /**
   * Fired when the player has downloaded data at the current playback position
   *
   * @event Player#loadeddata
   * @type {Event}
   */

  /**
   * Fired when the current playback position has changed *
   * During playback this is fired every 15-250 milliseconds, depending on the
   * playback technology in use.
   *
   * @event Player#timeupdate
   * @type {Event}
   */

  /**
   * Fired when the volume changes
   *
   * @event Player#volumechange
   * @type {Event}
   */

  /**
   * Reports whether or not a player has a plugin available.
   *
   * This does not report whether or not the plugin has ever been initialized
   * on this player. For that, [usingPlugin]{@link Player#usingPlugin}.
   *
   * @method Player#hasPlugin
   * @param  {string}  name
   *         The name of a plugin.
   *
   * @return {boolean}
   *         Whether or not this player has the requested plugin available.
   */

  /**
   * Reports whether or not a player is using a plugin by name.
   *
   * For basic plugins, this only reports whether the plugin has _ever_ been
   * initialized on this player.
   *
   * @method Player#usingPlugin
   * @param  {string} name
   *         The name of a plugin.
   *
   * @return {boolean}
   *         Whether or not this player is using the requested plugin.
   */

  Component.registerComponent('Player', Player);

  /**
   * @file plugin.js
   */

  /**
   * The base plugin name.
   *
   * @private
   * @constant
   * @type {string}
   */
  const BASE_PLUGIN_NAME = 'plugin';

  /**
   * The key on which a player's active plugins cache is stored.
   *
   * @private
   * @constant
   * @type     {string}
   */
  const PLUGIN_CACHE_KEY = 'activePlugins_';

  /**
   * Stores registered plugins in a private space.
   *
   * @private
   * @type    {Object}
   */
  const pluginStorage = {};

  /**
   * Reports whether or not a plugin has been registered.
   *
   * @private
   * @param   {string} name
   *          The name of a plugin.
   *
   * @return {boolean}
   *          Whether or not the plugin has been registered.
   */
  const pluginExists = name => pluginStorage.hasOwnProperty(name);

  /**
   * Get a single registered plugin by name.
   *
   * @private
   * @param   {string} name
   *          The name of a plugin.
   *
   * @return {typeof Plugin|Function|undefined}
   *          The plugin (or undefined).
   */
  const getPlugin = name => pluginExists(name) ? pluginStorage[name] : undefined;

  /**
   * Marks a plugin as "active" on a player.
   *
   * Also, ensures that the player has an object for tracking active plugins.
   *
   * @private
   * @param   {Player} player
   *          A Video.js player instance.
   *
   * @param   {string} name
   *          The name of a plugin.
   */
  const markPluginAsActive = (player, name) => {
    player[PLUGIN_CACHE_KEY] = player[PLUGIN_CACHE_KEY] || {};
    player[PLUGIN_CACHE_KEY][name] = true;
  };

  /**
   * Triggers a pair of plugin setup events.
   *
   * @private
   * @param  {Player} player
   *         A Video.js player instance.
   *
   * @param  {Plugin~PluginEventHash} hash
   *         A plugin event hash.
   *
   * @param  {boolean} [before]
   *         If true, prefixes the event name with "before". In other words,
   *         use this to trigger "beforepluginsetup" instead of "pluginsetup".
   */
  const triggerSetupEvent = (player, hash, before) => {
    const eventName = (before ? 'before' : '') + 'pluginsetup';
    player.trigger(eventName, hash);
    player.trigger(eventName + ':' + hash.name, hash);
  };

  /**
   * Takes a basic plugin function and returns a wrapper function which marks
   * on the player that the plugin has been activated.
   *
   * @private
   * @param   {string} name
   *          The name of the plugin.
   *
   * @param   {Function} plugin
   *          The basic plugin.
   *
   * @return {Function}
   *          A wrapper function for the given plugin.
   */
  const createBasicPlugin = function (name, plugin) {
    const basicPluginWrapper = function () {
      // We trigger the "beforepluginsetup" and "pluginsetup" events on the player
      // regardless, but we want the hash to be consistent with the hash provided
      // for advanced plugins.
      //
      // The only potentially counter-intuitive thing here is the `instance` in
      // the "pluginsetup" event is the value returned by the `plugin` function.
      triggerSetupEvent(this, {
        name,
        plugin,
        instance: null
      }, true);
      const instance = plugin.apply(this, arguments);
      markPluginAsActive(this, name);
      triggerSetupEvent(this, {
        name,
        plugin,
        instance
      });
      return instance;
    };
    Object.keys(plugin).forEach(function (prop) {
      basicPluginWrapper[prop] = plugin[prop];
    });
    return basicPluginWrapper;
  };

  /**
   * Takes a plugin sub-class and returns a factory function for generating
   * instances of it.
   *
   * This factory function will replace itself with an instance of the requested
   * sub-class of Plugin.
   *
   * @private
   * @param   {string} name
   *          The name of the plugin.
   *
   * @param   {Plugin} PluginSubClass
   *          The advanced plugin.
   *
   * @return {Function}
   */
  const createPluginFactory = (name, PluginSubClass) => {
    // Add a `name` property to the plugin prototype so that each plugin can
    // refer to itself by name.
    PluginSubClass.prototype.name = name;
    return function (...args) {
      triggerSetupEvent(this, {
        name,
        plugin: PluginSubClass,
        instance: null
      }, true);
      const instance = new PluginSubClass(...[this, ...args]);

      // The plugin is replaced by a function that returns the current instance.
      this[name] = () => instance;
      triggerSetupEvent(this, instance.getEventHash());
      return instance;
    };
  };

  /**
   * Parent class for all advanced plugins.
   *
   * @mixes   module:evented~EventedMixin
   * @mixes   module:stateful~StatefulMixin
   * @fires   Player#beforepluginsetup
   * @fires   Player#beforepluginsetup:$name
   * @fires   Player#pluginsetup
   * @fires   Player#pluginsetup:$name
   * @listens Player#dispose
   * @throws  {Error}
   *          If attempting to instantiate the base {@link Plugin} class
   *          directly instead of via a sub-class.
   */
  class Plugin {
    /**
     * Creates an instance of this class.
     *
     * Sub-classes should call `super` to ensure plugins are properly initialized.
     *
     * @param {Player} player
     *        A Video.js player instance.
     */
    constructor(player) {
      if (this.constructor === Plugin) {
        throw new Error('Plugin must be sub-classed; not directly instantiated.');
      }
      this.player = player;
      if (!this.log) {
        this.log = this.player.log.createLogger(this.name);
      }

      // Make this object evented, but remove the added `trigger` method so we
      // use the prototype version instead.
      evented(this);
      delete this.trigger;
      stateful(this, this.constructor.defaultState);
      markPluginAsActive(player, this.name);

      // Auto-bind the dispose method so we can use it as a listener and unbind
      // it later easily.
      this.dispose = this.dispose.bind(this);

      // If the player is disposed, dispose the plugin.
      player.on('dispose', this.dispose);
    }

    /**
     * Get the version of the plugin that was set on <pluginName>.VERSION
     */
    version() {
      return this.constructor.VERSION;
    }

    /**
     * Each event triggered by plugins includes a hash of additional data with
     * conventional properties.
     *
     * This returns that object or mutates an existing hash.
     *
     * @param   {Object} [hash={}]
     *          An object to be used as event an event hash.
     *
     * @return {Plugin~PluginEventHash}
     *          An event hash object with provided properties mixed-in.
     */
    getEventHash(hash = {}) {
      hash.name = this.name;
      hash.plugin = this.constructor;
      hash.instance = this;
      return hash;
    }

    /**
     * Triggers an event on the plugin object and overrides
     * {@link module:evented~EventedMixin.trigger|EventedMixin.trigger}.
     *
     * @param   {string|Object} event
     *          An event type or an object with a type property.
     *
     * @param   {Object} [hash={}]
     *          Additional data hash to merge with a
     *          {@link Plugin~PluginEventHash|PluginEventHash}.
     *
     * @return {boolean}
     *          Whether or not default was prevented.
     */
    trigger(event, hash = {}) {
      return trigger(this.eventBusEl_, event, this.getEventHash(hash));
    }

    /**
     * Handles "statechanged" events on the plugin. No-op by default, override by
     * subclassing.
     *
     * @abstract
     * @param    {Event} e
     *           An event object provided by a "statechanged" event.
     *
     * @param    {Object} e.changes
     *           An object describing changes that occurred with the "statechanged"
     *           event.
     */
    handleStateChanged(e) {}

    /**
     * Disposes a plugin.
     *
     * Subclasses can override this if they want, but for the sake of safety,
     * it's probably best to subscribe the "dispose" event.
     *
     * @fires Plugin#dispose
     */
    dispose() {
      const {
        name,
        player
      } = this;

      /**
       * Signals that a advanced plugin is about to be disposed.
       *
       * @event Plugin#dispose
       * @type  {Event}
       */
      this.trigger('dispose');
      this.off();
      player.off('dispose', this.dispose);

      // Eliminate any possible sources of leaking memory by clearing up
      // references between the player and the plugin instance and nulling out
      // the plugin's state and replacing methods with a function that throws.
      player[PLUGIN_CACHE_KEY][name] = false;
      this.player = this.state = null;

      // Finally, replace the plugin name on the player with a new factory
      // function, so that the plugin is ready to be set up again.
      player[name] = createPluginFactory(name, pluginStorage[name]);
    }

    /**
     * Determines if a plugin is a basic plugin (i.e. not a sub-class of `Plugin`).
     *
     * @param   {string|Function} plugin
     *          If a string, matches the name of a plugin. If a function, will be
     *          tested directly.
     *
     * @return {boolean}
     *          Whether or not a plugin is a basic plugin.
     */
    static isBasic(plugin) {
      const p = typeof plugin === 'string' ? getPlugin(plugin) : plugin;
      return typeof p === 'function' && !Plugin.prototype.isPrototypeOf(p.prototype);
    }

    /**
     * Register a Video.js plugin.
     *
     * @param   {string} name
     *          The name of the plugin to be registered. Must be a string and
     *          must not match an existing plugin or a method on the `Player`
     *          prototype.
     *
     * @param   {typeof Plugin|Function} plugin
     *          A sub-class of `Plugin` or a function for basic plugins.
     *
     * @return {typeof Plugin|Function}
     *          For advanced plugins, a factory function for that plugin. For
     *          basic plugins, a wrapper function that initializes the plugin.
     */
    static registerPlugin(name, plugin) {
      if (typeof name !== 'string') {
        throw new Error(`Illegal plugin name, "${name}", must be a string, was ${typeof name}.`);
      }
      if (pluginExists(name)) {
        log.warn(`A plugin named "${name}" already exists. You may want to avoid re-registering plugins!`);
      } else if (Player.prototype.hasOwnProperty(name)) {
        throw new Error(`Illegal plugin name, "${name}", cannot share a name with an existing player method!`);
      }
      if (typeof plugin !== 'function') {
        throw new Error(`Illegal plugin for "${name}", must be a function, was ${typeof plugin}.`);
      }
      pluginStorage[name] = plugin;

      // Add a player prototype method for all sub-classed plugins (but not for
      // the base Plugin class).
      if (name !== BASE_PLUGIN_NAME) {
        if (Plugin.isBasic(plugin)) {
          Player.prototype[name] = createBasicPlugin(name, plugin);
        } else {
          Player.prototype[name] = createPluginFactory(name, plugin);
        }
      }
      return plugin;
    }

    /**
     * De-register a Video.js plugin.
     *
     * @param  {string} name
     *         The name of the plugin to be de-registered. Must be a string that
     *         matches an existing plugin.
     *
     * @throws {Error}
     *         If an attempt is made to de-register the base plugin.
     */
    static deregisterPlugin(name) {
      if (name === BASE_PLUGIN_NAME) {
        throw new Error('Cannot de-register base plugin.');
      }
      if (pluginExists(name)) {
        delete pluginStorage[name];
        delete Player.prototype[name];
      }
    }

    /**
     * Gets an object containing multiple Video.js plugins.
     *
     * @param   {Array} [names]
     *          If provided, should be an array of plugin names. Defaults to _all_
     *          plugin names.
     *
     * @return {Object|undefined}
     *          An object containing plugin(s) associated with their name(s) or
     *          `undefined` if no matching plugins exist).
     */
    static getPlugins(names = Object.keys(pluginStorage)) {
      let result;
      names.forEach(name => {
        const plugin = getPlugin(name);
        if (plugin) {
          result = result || {};
          result[name] = plugin;
        }
      });
      return result;
    }

    /**
     * Gets a plugin's version, if available
     *
     * @param   {string} name
     *          The name of a plugin.
     *
     * @return {string}
     *          The plugin's version or an empty string.
     */
    static getPluginVersion(name) {
      const plugin = getPlugin(name);
      return plugin && plugin.VERSION || '';
    }
  }

  /**
   * Gets a plugin by name if it exists.
   *
   * @static
   * @method   getPlugin
   * @memberOf Plugin
   * @param    {string} name
   *           The name of a plugin.
   *
   * @returns  {typeof Plugin|Function|undefined}
   *           The plugin (or `undefined`).
   */
  Plugin.getPlugin = getPlugin;

  /**
   * The name of the base plugin class as it is registered.
   *
   * @type {string}
   */
  Plugin.BASE_PLUGIN_NAME = BASE_PLUGIN_NAME;
  Plugin.registerPlugin(BASE_PLUGIN_NAME, Plugin);

  /**
   * Documented in player.js
   *
   * @ignore
   */
  Player.prototype.usingPlugin = function (name) {
    return !!this[PLUGIN_CACHE_KEY] && this[PLUGIN_CACHE_KEY][name] === true;
  };

  /**
   * Documented in player.js
   *
   * @ignore
   */
  Player.prototype.hasPlugin = function (name) {
    return !!pluginExists(name);
  };

  /**
   * Signals that a plugin is about to be set up on a player.
   *
   * @event    Player#beforepluginsetup
   * @type     {Plugin~PluginEventHash}
   */

  /**
   * Signals that a plugin is about to be set up on a player - by name. The name
   * is the name of the plugin.
   *
   * @event    Player#beforepluginsetup:$name
   * @type     {Plugin~PluginEventHash}
   */

  /**
   * Signals that a plugin has just been set up on a player.
   *
   * @event    Player#pluginsetup
   * @type     {Plugin~PluginEventHash}
   */

  /**
   * Signals that a plugin has just been set up on a player - by name. The name
   * is the name of the plugin.
   *
   * @event    Player#pluginsetup:$name
   * @type     {Plugin~PluginEventHash}
   */

  /**
   * @typedef  {Object} Plugin~PluginEventHash
   *
   * @property {string} instance
   *           For basic plugins, the return value of the plugin function. For
   *           advanced plugins, the plugin instance on which the event is fired.
   *
   * @property {string} name
   *           The name of the plugin.
   *
   * @property {string} plugin
   *           For basic plugins, the plugin function. For advanced plugins, the
   *           plugin class/constructor.
   */

  /**
   * @file deprecate.js
   * @module deprecate
   */

  /**
   * Decorate a function with a deprecation message the first time it is called.
   *
   * @param  {string}   message
   *         A deprecation message to log the first time the returned function
   *         is called.
   *
   * @param  {Function} fn
   *         The function to be deprecated.
   *
   * @return {Function}
   *         A wrapper function that will log a deprecation warning the first
   *         time it is called. The return value will be the return value of
   *         the wrapped function.
   */
  function deprecate(message, fn) {
    let warned = false;
    return function (...args) {
      if (!warned) {
        log.warn(message);
      }
      warned = true;
      return fn.apply(this, args);
    };
  }

  /**
   * Internal function used to mark a function as deprecated in the next major
   * version with consistent messaging.
   *
   * @param  {number}   major   The major version where it will be removed
   * @param  {string}   oldName The old function name
   * @param  {string}   newName The new function name
   * @param  {Function} fn      The function to deprecate
   * @return {Function}         The decorated function
   */
  function deprecateForMajor(major, oldName, newName, fn) {
    return deprecate(`${oldName} is deprecated and will be removed in ${major}.0; please use ${newName} instead.`, fn);
  }

  /**
   * @file video.js
   * @module videojs
   */

  /**
   * Normalize an `id` value by trimming off a leading `#`
   *
   * @private
   * @param   {string} id
   *          A string, maybe with a leading `#`.
   *
   * @return {string}
   *          The string, without any leading `#`.
   */
  const normalizeId = id => id.indexOf('#') === 0 ? id.slice(1) : id;

  /**
   * A callback that is called when a component is ready. Does not have any
   * parameters and any callback value will be ignored. See: {@link Component~ReadyCallback}
   *
   * @callback ReadyCallback
   */

  /**
   * The `videojs()` function doubles as the main function for users to create a
   * {@link Player} instance as well as the main library namespace.
   *
   * It can also be used as a getter for a pre-existing {@link Player} instance.
   * However, we _strongly_ recommend using `videojs.getPlayer()` for this
   * purpose because it avoids any potential for unintended initialization.
   *
   * Due to [limitations](https://github.com/jsdoc3/jsdoc/issues/955#issuecomment-313829149)
   * of our JSDoc template, we cannot properly document this as both a function
   * and a namespace, so its function signature is documented here.
   *
   * #### Arguments
   * ##### id
   * string|Element, **required**
   *
   * Video element or video element ID.
   *
   * ##### options
   * Object, optional
   *
   * Options object for providing settings.
   * See: [Options Guide](https://docs.videojs.com/tutorial-options.html).
   *
   * ##### ready
   * {@link Component~ReadyCallback}, optional
   *
   * A function to be called when the {@link Player} and {@link Tech} are ready.
   *
   * #### Return Value
   *
   * The `videojs()` function returns a {@link Player} instance.
   *
   * @namespace
   *
   * @borrows AudioTrack as AudioTrack
   * @borrows Component.getComponent as getComponent
   * @borrows module:events.on as on
   * @borrows module:events.one as one
   * @borrows module:events.off as off
   * @borrows module:events.trigger as trigger
   * @borrows EventTarget as EventTarget
   * @borrows module:middleware.use as use
   * @borrows Player.players as players
   * @borrows Plugin.registerPlugin as registerPlugin
   * @borrows Plugin.deregisterPlugin as deregisterPlugin
   * @borrows Plugin.getPlugins as getPlugins
   * @borrows Plugin.getPlugin as getPlugin
   * @borrows Plugin.getPluginVersion as getPluginVersion
   * @borrows Tech.getTech as getTech
   * @borrows Tech.registerTech as registerTech
   * @borrows TextTrack as TextTrack
   * @borrows VideoTrack as VideoTrack
   *
   * @param  {string|Element} id
   *         Video element or video element ID.
   *
   * @param  {Object} [options]
   *         Options object for providing settings.
   *         See: [Options Guide](https://docs.videojs.com/tutorial-options.html).
   *
   * @param  {ReadyCallback} [ready]
   *         A function to be called when the {@link Player} and {@link Tech} are
   *         ready.
   *
   * @return {Player}
   *         The `videojs()` function returns a {@link Player|Player} instance.
   */
  function videojs(id, options, ready) {
    let player = videojs.getPlayer(id);
    if (player) {
      if (options) {
        log.warn(`Player "${id}" is already initialised. Options will not be applied.`);
      }
      if (ready) {
        player.ready(ready);
      }
      return player;
    }
    const el = typeof id === 'string' ? $('#' + normalizeId(id)) : id;
    if (!isEl(el)) {
      throw new TypeError('The element or ID supplied is not valid. (videojs)');
    }

    // document.body.contains(el) will only check if el is contained within that one document.
    // This causes problems for elements in iframes.
    // Instead, use the element's ownerDocument instead of the global document.
    // This will make sure that the element is indeed in the dom of that document.
    // Additionally, check that the document in question has a default view.
    // If the document is no longer attached to the dom, the defaultView of the document will be null.
    // If element is inside Shadow DOM (e.g. is part of a Custom element), ownerDocument.body
    // always returns false. Instead, use the Shadow DOM root.
    const inShadowDom = 'getRootNode' in el ? el.getRootNode() instanceof window.ShadowRoot : false;
    const rootNode = inShadowDom ? el.getRootNode() : el.ownerDocument.body;
    if (!el.ownerDocument.defaultView || !rootNode.contains(el)) {
      log.warn('The element supplied is not included in the DOM');
    }
    options = options || {};

    // Store a copy of the el before modification, if it is to be restored in destroy()
    // If div ingest, store the parent div
    if (options.restoreEl === true) {
      options.restoreEl = (el.parentNode && el.parentNode.hasAttribute('data-vjs-player') ? el.parentNode : el).cloneNode(true);
    }
    hooks('beforesetup').forEach(hookFunction => {
      const opts = hookFunction(el, merge(options));
      if (!isObject(opts) || Array.isArray(opts)) {
        log.error('please return an object in beforesetup hooks');
        return;
      }
      options = merge(options, opts);
    });

    // We get the current "Player" component here in case an integration has
    // replaced it with a custom player.
    const PlayerComponent = Component.getComponent('Player');
    player = new PlayerComponent(el, options, ready);
    hooks('setup').forEach(hookFunction => hookFunction(player));
    return player;
  }
  videojs.hooks_ = hooks_;
  videojs.hooks = hooks;
  videojs.hook = hook;
  videojs.hookOnce = hookOnce;
  videojs.removeHook = removeHook;

  // Add default styles
  if (window.VIDEOJS_NO_DYNAMIC_STYLE !== true && isReal()) {
    let style = $('.vjs-styles-defaults');
    if (!style) {
      style = createStyleElement('vjs-styles-defaults');
      const head = $('head');
      if (head) {
        head.insertBefore(style, head.firstChild);
      }
      setTextContent(style, `
      .video-js {
        width: 300px;
        height: 150px;
      }

      .vjs-fluid:not(.vjs-audio-only-mode) {
        padding-top: 56.25%
      }
    `);
    }
  }

  // Run Auto-load players
  // You have to wait at least once in case this script is loaded after your
  // video in the DOM (weird behavior only with minified version)
  autoSetupTimeout(1, videojs);

  /**
   * Current Video.js version. Follows [semantic versioning](https://semver.org/).
   *
   * @type {string}
   */
  videojs.VERSION = version;

  /**
   * The global options object. These are the settings that take effect
   * if no overrides are specified when the player is created.
   *
   * @type {Object}
   */
  videojs.options = Player.prototype.options_;

  /**
   * Get an object with the currently created players, keyed by player ID
   *
   * @return {Object}
   *         The created players
   */
  videojs.getPlayers = () => Player.players;

  /**
   * Get a single player based on an ID or DOM element.
   *
   * This is useful if you want to check if an element or ID has an associated
   * Video.js player, but not create one if it doesn't.
   *
   * @param   {string|Element} id
   *          An HTML element - `<video>`, `<audio>`, or `<video-js>` -
   *          or a string matching the `id` of such an element.
   *
   * @return {Player|undefined}
   *          A player instance or `undefined` if there is no player instance
   *          matching the argument.
   */
  videojs.getPlayer = id => {
    const players = Player.players;
    let tag;
    if (typeof id === 'string') {
      const nId = normalizeId(id);
      const player = players[nId];
      if (player) {
        return player;
      }
      tag = $('#' + nId);
    } else {
      tag = id;
    }
    if (isEl(tag)) {
      const {
        player,
        playerId
      } = tag;

      // Element may have a `player` property referring to an already created
      // player instance. If so, return that.
      if (player || players[playerId]) {
        return player || players[playerId];
      }
    }
  };

  /**
   * Returns an array of all current players.
   *
   * @return {Array}
   *         An array of all players. The array will be in the order that
   *         `Object.keys` provides, which could potentially vary between
   *         JavaScript engines.
   *
   */
  videojs.getAllPlayers = () =>
  // Disposed players leave a key with a `null` value, so we need to make sure
  // we filter those out.
  Object.keys(Player.players).map(k => Player.players[k]).filter(Boolean);
  videojs.players = Player.players;
  videojs.getComponent = Component.getComponent;

  /**
   * Register a component so it can referred to by name. Used when adding to other
   * components, either through addChild `component.addChild('myComponent')` or through
   * default children options  `{ children: ['myComponent'] }`.
   *
   * > NOTE: You could also just initialize the component before adding.
   * `component.addChild(new MyComponent());`
   *
   * @param {string} name
   *        The class name of the component
   *
   * @param {Component} comp
   *        The component class
   *
   * @return {Component}
   *         The newly registered component
   */
  videojs.registerComponent = (name, comp) => {
    if (Tech.isTech(comp)) {
      log.warn(`The ${name} tech was registered as a component. It should instead be registered using videojs.registerTech(name, tech)`);
    }
    return Component.registerComponent.call(Component, name, comp);
  };
  videojs.getTech = Tech.getTech;
  videojs.registerTech = Tech.registerTech;
  videojs.use = use;

  /**
   * An object that can be returned by a middleware to signify
   * that the middleware is being terminated.
   *
   * @type {object}
   * @property {object} middleware.TERMINATOR
   */
  Object.defineProperty(videojs, 'middleware', {
    value: {},
    writeable: false,
    enumerable: true
  });
  Object.defineProperty(videojs.middleware, 'TERMINATOR', {
    value: TERMINATOR,
    writeable: false,
    enumerable: true
  });

  /**
   * A reference to the {@link module:browser|browser utility module} as an object.
   *
   * @type {Object}
   * @see  {@link module:browser|browser}
   */
  videojs.browser = browser;

  /**
   * A reference to the {@link module:obj|obj utility module} as an object.
   *
   * @type {Object}
   * @see  {@link module:obj|obj}
   */
  videojs.obj = Obj;

  /**
   * Deprecated reference to the {@link module:obj.merge|merge function}
   *
   * @type {Function}
   * @see {@link module:obj.merge|merge}
   * @deprecated Deprecated and will be removed in 9.0. Please use videojs.obj.merge instead.
   */
  videojs.mergeOptions = deprecateForMajor(9, 'videojs.mergeOptions', 'videojs.obj.merge', merge);

  /**
   * Deprecated reference to the {@link module:obj.defineLazyProperty|defineLazyProperty function}
   *
   * @type {Function}
   * @see {@link module:obj.defineLazyProperty|defineLazyProperty}
   * @deprecated Deprecated and will be removed in 9.0. Please use videojs.obj.defineLazyProperty instead.
   */
  videojs.defineLazyProperty = deprecateForMajor(9, 'videojs.defineLazyProperty', 'videojs.obj.defineLazyProperty', defineLazyProperty);

  /**
   * Deprecated reference to the {@link module:fn.bind_|fn.bind_ function}
   *
   * @type {Function}
   * @see {@link module:fn.bind_|fn.bind_}
   * @deprecated Deprecated and will be removed in 9.0. Please use native Function.prototype.bind instead.
   */
  videojs.bind = deprecateForMajor(9, 'videojs.bind', 'native Function.prototype.bind', bind_);
  videojs.registerPlugin = Plugin.registerPlugin;
  videojs.deregisterPlugin = Plugin.deregisterPlugin;

  /**
   * Deprecated method to register a plugin with Video.js
   *
   * @deprecated Deprecated and will be removed in 9.0. Use videojs.registerPlugin() instead.
   *
   * @param {string} name
   *        The plugin name
   *
   * @param {Plugin|Function} plugin
   *         The plugin sub-class or function
   */
  videojs.plugin = (name, plugin) => {
    log.warn('videojs.plugin() is deprecated; use videojs.registerPlugin() instead');
    return Plugin.registerPlugin(name, plugin);
  };
  videojs.getPlugins = Plugin.getPlugins;
  videojs.getPlugin = Plugin.getPlugin;
  videojs.getPluginVersion = Plugin.getPluginVersion;

  /**
   * Adding languages so that they're available to all players.
   * Example: `videojs.addLanguage('es', { 'Hello': 'Hola' });`
   *
   * @param {string} code
   *        The language code or dictionary property
   *
   * @param {Object} data
   *        The data values to be translated
   *
   * @return {Object}
   *         The resulting language dictionary object
   */
  videojs.addLanguage = function (code, data) {
    code = ('' + code).toLowerCase();
    videojs.options.languages = merge(videojs.options.languages, {
      [code]: data
    });
    return videojs.options.languages[code];
  };

  /**
   * A reference to the {@link module:log|log utility module} as an object.
   *
   * @type {Function}
   * @see  {@link module:log|log}
   */
  videojs.log = log;
  videojs.createLogger = createLogger;

  /**
   * A reference to the {@link module:time|time utility module} as an object.
   *
   * @type {Object}
   * @see {@link module:time|time}
   */
  videojs.time = Time;

  /**
   * Deprecated reference to the {@link module:time.createTimeRanges|createTimeRanges function}
   *
   * @type {Function}
   * @see {@link module:time.createTimeRanges|createTimeRanges}
   * @deprecated Deprecated and will be removed in 9.0. Please use videojs.time.createTimeRanges instead.
   */
  videojs.createTimeRange = deprecateForMajor(9, 'videojs.createTimeRange', 'videojs.time.createTimeRanges', createTimeRanges);

  /**
   * Deprecated reference to the {@link module:time.createTimeRanges|createTimeRanges function}
   *
   * @type {Function}
   * @see {@link module:time.createTimeRanges|createTimeRanges}
   * @deprecated Deprecated and will be removed in 9.0. Please use videojs.time.createTimeRanges instead.
   */
  videojs.createTimeRanges = deprecateForMajor(9, 'videojs.createTimeRanges', 'videojs.time.createTimeRanges', createTimeRanges);

  /**
   * Deprecated reference to the {@link module:time.formatTime|formatTime function}
   *
   * @type {Function}
   * @see {@link module:time.formatTime|formatTime}
   * @deprecated Deprecated and will be removed in 9.0. Please use videojs.time.format instead.
   */
  videojs.formatTime = deprecateForMajor(9, 'videojs.formatTime', 'videojs.time.formatTime', formatTime);

  /**
   * Deprecated reference to the {@link module:time.setFormatTime|setFormatTime function}
   *
   * @type {Function}
   * @see {@link module:time.setFormatTime|setFormatTime}
   * @deprecated Deprecated and will be removed in 9.0. Please use videojs.time.setFormat instead.
   */
  videojs.setFormatTime = deprecateForMajor(9, 'videojs.setFormatTime', 'videojs.time.setFormatTime', setFormatTime);

  /**
   * Deprecated reference to the {@link module:time.resetFormatTime|resetFormatTime function}
   *
   * @type {Function}
   * @see {@link module:time.resetFormatTime|resetFormatTime}
   * @deprecated Deprecated and will be removed in 9.0. Please use videojs.time.resetFormat instead.
   */
  videojs.resetFormatTime = deprecateForMajor(9, 'videojs.resetFormatTime', 'videojs.time.resetFormatTime', resetFormatTime);

  /**
   * Deprecated reference to the {@link module:url.parseUrl|Url.parseUrl function}
   *
   * @type {Function}
   * @see {@link module:url.parseUrl|parseUrl}
   * @deprecated Deprecated and will be removed in 9.0. Please use videojs.url.parseUrl instead.
   */
  videojs.parseUrl = deprecateForMajor(9, 'videojs.parseUrl', 'videojs.url.parseUrl', parseUrl);

  /**
   * Deprecated reference to the {@link module:url.isCrossOrigin|Url.isCrossOrigin function}
   *
   * @type {Function}
   * @see {@link module:url.isCrossOrigin|isCrossOrigin}
   * @deprecated Deprecated and will be removed in 9.0. Please use videojs.url.isCrossOrigin instead.
   */
  videojs.isCrossOrigin = deprecateForMajor(9, 'videojs.isCrossOrigin', 'videojs.url.isCrossOrigin', isCrossOrigin);
  videojs.EventTarget = EventTarget;
  videojs.any = any;
  videojs.on = on;
  videojs.one = one;
  videojs.off = off;
  videojs.trigger = trigger;

  /**
   * A cross-browser XMLHttpRequest wrapper.
   *
   * @function
   * @param    {Object} options
   *           Settings for the request.
   *
   * @return   {XMLHttpRequest|XDomainRequest}
   *           The request object.
   *
   * @see      https://github.com/Raynos/xhr
   */
  videojs.xhr = lib;
  videojs.TextTrack = TextTrack;
  videojs.AudioTrack = AudioTrack;
  videojs.VideoTrack = VideoTrack;
  ['isEl', 'isTextNode', 'createEl', 'hasClass', 'addClass', 'removeClass', 'toggleClass', 'setAttributes', 'getAttributes', 'emptyEl', 'appendContent', 'insertContent'].forEach(k => {
    videojs[k] = function () {
      log.warn(`videojs.${k}() is deprecated; use videojs.dom.${k}() instead`);
      return Dom[k].apply(null, arguments);
    };
  });
  videojs.computedStyle = deprecateForMajor(9, 'videojs.computedStyle', 'videojs.dom.computedStyle', computedStyle);

  /**
   * A reference to the {@link module:dom|DOM utility module} as an object.
   *
   * @type {Object}
   * @see {@link module:dom|dom}
   */
  videojs.dom = Dom;

  /**
   * A reference to the {@link module:fn|fn utility module} as an object.
   *
   * @type {Object}
   * @see {@link module:fn|fn}
   */
  videojs.fn = Fn;

  /**
   * A reference to the {@link module:num|num utility module} as an object.
   *
   * @type {Object}
   * @see {@link module:num|num}
   */
  videojs.num = Num;

  /**
   * A reference to the {@link module:str|str utility module} as an object.
   *
   * @type {Object}
   * @see {@link module:str|str}
   */
  videojs.str = Str;

  /**
   * A reference to the {@link module:url|URL utility module} as an object.
   *
   * @type {Object}
   * @see {@link module:url|url}
   */
  videojs.url = Url;

  return videojs;

}));
