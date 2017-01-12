'use strict';

exports.__esModule = true;
exports['default'] = computedStyle;

var _window = require('global/window');

var _window2 = _interopRequireDefault(_window);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

/**
 * A safe getComputedStyle with an IE8 fallback.
 *
 * This is needed because in Firefox, if the player is loaded in an iframe with
 * `display:none`, then `getComputedStyle` returns `null`, so, we do a null-check to
 * make sure  that the player doesn't break in these cases.
 *
 * @param {Element} el
 *        The element you want the computed style of
 *
 * @param {string} prop
 *        The property name you want
 *
 * @see https://bugzilla.mozilla.org/show_bug.cgi?id=548397
 */
function computedStyle(el, prop) {
  if (!el || !prop) {
    return '';
  }

  if (typeof _window2['default'].getComputedStyle === 'function') {
    var cs = _window2['default'].getComputedStyle(el);

    return cs ? cs[prop] : '';
  }

  return el.currentStyle[prop] || '';
} /**
   * @file computed-style.js
   * @module computed-style
   */
