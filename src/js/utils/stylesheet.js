/**
 * @file stylesheet.js
 * @module stylesheet
 */
import document from 'global/document';

/**
 * Create a DOM syle element given a className for it.
 *
 * @param {string} className
 *        The className to add to the created style element.
 *
 * @return {Element}
 *         The element that was created.
 */
export const createStyleElement = function(className) {
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
export const setTextContent = function(el, content) {
  if (el.styleSheet) {
    el.styleSheet.cssText = content;
  } else {
    el.textContent = content;
  }
};
