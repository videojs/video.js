/**
 * @file browser.js
 */
import document from 'global/document';
import window from 'global/window';

const USER_AGENT = window.navigator.userAgent;
const webkitVersionMap = (/AppleWebKit\/([\d.]+)/i).exec(USER_AGENT);
const appleWebkitVersion = webkitVersionMap ? parseFloat(webkitVersionMap.pop()) : null;

/*
 * Device is an iPhone
 *
 * @type {Boolean}
 * @constant
 * @private
 */
export const IS_IPHONE = (/iPhone/i).test(USER_AGENT);
export const IS_IPAD = (/iPad/i).test(USER_AGENT);
export const IS_IPOD = (/iPod/i).test(USER_AGENT);
export const IS_IOS = IS_IPHONE || IS_IPAD || IS_IPOD;

export const IOS_VERSION = (function(){
  var match = USER_AGENT.match(/OS (\d+)_/i);
  if (match && match[1]) { return match[1]; }
})();

export const IS_ANDROID = (/Android/i).test(USER_AGENT);
export const ANDROID_VERSION = (function() {
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
export const IS_OLD_ANDROID = IS_ANDROID && (/webkit/i).test(USER_AGENT) && ANDROID_VERSION < 2.3;
export const IS_NATIVE_ANDROID = IS_ANDROID && ANDROID_VERSION < 5 && appleWebkitVersion < 537;

export const IS_FIREFOX = (/Firefox/i).test(USER_AGENT);
export const IS_CHROME = (/Chrome/i).test(USER_AGENT);
export const IS_IE8 = (/MSIE\s8\.0/).test(USER_AGENT);

export const TOUCH_ENABLED = !!(('ontouchstart' in window) || window.DocumentTouch && document instanceof window.DocumentTouch);
export const BACKGROUND_SIZE_SUPPORTED = 'backgroundSize' in document.createElement('video').style;
