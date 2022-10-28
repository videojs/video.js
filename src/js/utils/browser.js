/**
 * @file browser.js
 * @module browser
 */
import * as Dom from './dom';
import window from 'global/window';

/**
 * Whether or not this device is an iPod.
 *
 * @static
 * @type {Boolean}
 */
export let IS_IPOD = false;

/**
 * The detected iOS version - or `null`.
 *
 * @static
 * @type {string|null}
 */
export let IOS_VERSION = null;

/**
 * Whether or not this is an Android device.
 *
 * @static
 * @type {Boolean}
 */
export let IS_ANDROID = false;

/**
 * The detected Android version - or `null` if not Android or indeterminable.
 *
 * @static
 * @type {number|string|null}
 */
export let ANDROID_VERSION;

/**
 * Whether or not this is Mozilla Firefox.
 *
 * @static
 * @type {Boolean}
 */
export let IS_FIREFOX = false;

/**
 * Whether or not this is Microsoft Edge.
 *
 * @static
 * @type {Boolean}
 */
export let IS_EDGE = false;

/**
 * Whether or not this is Google Chrome.
 *
 * This will also be `true` for Chrome on iOS, which will have different support
 * as it is actually Safari under the hood.
 *
 * This will be true for any Chromium browser that is not Edge.
 *
 * @static
 * @type {Boolean}
 */
export let IS_CHROME = false;

/**
 * The detected Google Chrome version - or `null`.
 * This has always been the _Chromium_ version, i.e. would return on Chromium Edge
 *
 * @static
 * @type {number|null}
 */
export let CHROME_VERSION = null;

/**
 * Whether or not this is desktop Safari.
 *
 * @static
 * @type {Boolean}
 */
export let IS_SAFARI = false;

/**
 * Whether or not this is a Windows machine.
 *
 * @static
 * @type {Boolean}
 */
export let IS_WINDOWS = false;

/**
 * Whether or not this device is an iPad.
 *
 * @static
 * @type {Boolean}
 */
export let IS_IPAD = false;

/**
 * Whether or not this device is an iPhone.
 *
 * @static
 * @type {Boolean}
 */
// The Facebook app's UIWebView identifies as both an iPhone and iPad, so
// to identify iPhones, we need to exclude iPads.
// http://artsy.github.io/blog/2012/10/18/the-perils-of-ios-user-agent-sniffing/
export let IS_IPHONE = false;

/**
 * Whether or not this device is touch-enabled.
 *
 * @static
 * @const
 * @type {Boolean}
 */
export const TOUCH_ENABLED = Boolean(Dom.isReal() && (
  'ontouchstart' in window ||
  window.navigator.maxTouchPoints ||
  window.DocumentTouch && window.document instanceof window.DocumentTouch));

const UAD = window.navigator && window.navigator.userAgentData;

if (UAD) {
  // If userAgentData is present, use it instead of userAgent to avoid warnings
  // Currently only implemented on Chromium
  // userAgentData does not expose Android version, so ANDROID_VERSION remains `null`

  IS_ANDROID = UAD.platform === 'Android';
  IS_CHROME = Boolean(UAD.brands.find(b => b.brand === 'Google Chrome'));
  IS_EDGE = Boolean(UAD.brands.find(b => b.brand === 'Microsoft Edge'));
  CHROME_VERSION = (UAD.brands.find(b => b.brand === 'Chromium') || {}).version || null;
  IS_WINDOWS = UAD.platform === 'Windows';
}

if (!CHROME_VERSION) {
  // no userAgentData, or a browser that has added userAgentData since this was added
  const USER_AGENT = window.navigator && window.navigator.userAgent || '';

  IS_IPOD = (/iPod/i).test(USER_AGENT);

  IOS_VERSION = (function() {
    const match = USER_AGENT.match(/OS (\d+)_/i);

    if (match && match[1]) {
      return match[1];
    }
    return null;
  }());

  IS_ANDROID = (/Android/i).test(USER_AGENT);

  ANDROID_VERSION = (function() {
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
  }());

  IS_FIREFOX = (/Firefox/i).test(USER_AGENT);

  IS_EDGE = (/Edg/i).test(USER_AGENT);

  IS_CHROME = !IS_EDGE && ((/Chrome/i).test(USER_AGENT) || (/CriOS/i).test(USER_AGENT));

  CHROME_VERSION = (function() {
    const match = USER_AGENT.match(/(Chrome|CriOS)\/(\d+)/);

    if (match && match[2]) {
      return parseFloat(match[2]);
    }
    return null;
  }());

  IS_SAFARI = (/Safari/i).test(USER_AGENT) && !IS_CHROME && !IS_ANDROID && !IS_EDGE;

  IS_WINDOWS = (/Windows/i).test(USER_AGENT);

  IS_IPAD = (/iPad/i).test(USER_AGENT) ||
  (IS_SAFARI && TOUCH_ENABLED && !(/iPhone/i).test(USER_AGENT));

  IS_IPHONE = (/iPhone/i).test(USER_AGENT) && !IS_IPAD;
}

/**
 * Whether or not this is an iOS device.
 *
 * @static
 * @const
 * @type {Boolean}
 */
export const IS_IOS = IS_IPHONE || IS_IPAD || IS_IPOD;

/**
 * Whether or not this is any flavor of Safari - including iOS.
 *
 * @static
 * @const
 * @type {Boolean}
 */
export const IS_ANY_SAFARI = (IS_SAFARI || IS_IOS) && !IS_CHROME;
