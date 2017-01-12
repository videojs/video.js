'use strict';

exports.__esModule = true;
/**
 * @file format-time.js
 * @module Format-time
 */

/**
 * Format seconds as a time string, H:MM:SS or M:SS. Supplying a guide (in seconds)
 * will force a number of leading zeros to cover the length of the guide.
 *
 * @param {number} seconds
 *        Number of seconds to be turned into a string
 *
 * @param {number} guide
 *        Number (in seconds) to model the string after
 *
 * @return {string}
 *         Time formatted as H:MM:SS or M:SS
 */
function formatTime(seconds) {
  var guide = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : seconds;

  seconds = seconds < 0 ? 0 : seconds;
  var s = Math.floor(seconds % 60);
  var m = Math.floor(seconds / 60 % 60);
  var h = Math.floor(seconds / 3600);
  var gm = Math.floor(guide / 60 % 60);
  var gh = Math.floor(guide / 3600);

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
}

exports['default'] = formatTime;
