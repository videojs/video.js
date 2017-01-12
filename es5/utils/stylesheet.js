'use strict';

exports.__esModule = true;
exports.setTextContent = exports.createStyleElement = undefined;

var _document = require('global/document');

var _document2 = _interopRequireDefault(_document);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

/**
 * Create a DOM syle element given a className for it.
 *
 * @param {string} className
 *        The className to add to the created style element.
 *
 * @return {Element}
 *         The element that was created.
 */
var createStyleElement = exports.createStyleElement = function createStyleElement(className) {
  var style = _document2['default'].createElement('style');

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
/**
 * @file stylesheet.js
 * @module stylesheet
 */
var setTextContent = exports.setTextContent = function setTextContent(el, content) {
  if (el.styleSheet) {
    el.styleSheet.cssText = content;
  } else {
    el.textContent = content;
  }
};
