/**
 * @file dom.js
 * @module dom
 */
import document from 'global/document';
import window from 'global/window';
import fs from '../fullscreen-api';
import log from './log.js';
import {isObject} from './obj';
import computedStyle from './computed-style';
import * as browser from './browser';

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
 * Produce a regular expression for matching a className within an elements className.
 *
 * @private
 * @param  {string} className
 *         The className to generate the RegExp for.
 *
 * @return {RegExp}
 *         The RegExp that will check for a specific `className` in an elements
 *         className.
 */
function classRegExp(className) {
  return new RegExp('(^|\\s)' + className + '($|\\s)');
}

/**
 * Whether the current DOM interface appears to be real (i.e. not simulated).
 *
 * @return {boolean}
 *         Will be `true` if the DOM appears to be real, `false` otherwise.
 */
export function isReal() {
  // Both document and window will never be undefined thanks to `global`.
  return document === window.document;
}

/**
 * Determines, via duck typing, whether or not a value is a DOM element.
 *
 * @param  {Mixed} value
 *         The value to check.
 *
 * @return {boolean}
 *         Will be `true` if the value is a DOM element, `false` otherwise.
 */
export function isEl(value) {
  return isObject(value) && value.nodeType === 1;
}

/**
 * Determines if the current DOM is embedded in an iframe.
 *
 * @return {boolean}
 *         Will be `true` if the DOM is embedded in an iframe, `false`
 *         otherwise.
 */
export function isInFrame() {

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
  return function(selector, context) {
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
 * @param {module:dom~ContentDescriptor} content
 *        A content descriptor object.
 *
 * @return {Element}
 *         The element that was created.
 */
export function createEl(tagName = 'div', properties = {}, attributes = {}, content) {
  const el = document.createElement(tagName);

  Object.getOwnPropertyNames(properties).forEach(function(propName) {
    const val = properties[propName];

    // See #2176
    // We originally were accepting both properties and attributes in the
    // same object, but that doesn't work so well.
    if (propName.indexOf('aria-') !== -1 || propName === 'role' || propName === 'type') {
      log.warn('Setting attributes in the second argument of createEl()\n' +
               'has been deprecated. Use the third argument instead.\n' +
               `createEl(type, properties, attributes). Attempting to set ${propName} to ${val}.`);
      el.setAttribute(propName, val);

    // Handle textContent since it's not supported everywhere and we have a
    // method for it.
    } else if (propName === 'textContent') {
      textContent(el, val);
    } else if (el[propName] !== val || propName === 'tabIndex') {
      el[propName] = val;
    }
  });

  Object.getOwnPropertyNames(attributes).forEach(function(attrName) {
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
 * @param  {Element} el
 *         The element to add text content into
 *
 * @param  {string} text
 *         The text content to add.
 *
 * @return {Element}
 *         The element with added text content.
 */
export function textContent(el, text) {
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
export function prependTo(child, parent) {
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
export function hasClass(element, classToCheck) {
  throwIfWhitespace(classToCheck);
  if (element.classList) {
    return element.classList.contains(classToCheck);
  }
  return classRegExp(classToCheck).test(element.className);
}

/**
 * Add a class name to an element.
 *
 * @param  {Element} element
 *         Element to add class name to.
 *
 * @param  {string} classToAdd
 *         Class name to add.
 *
 * @return {Element}
 *         The DOM element with the added class name.
 */
export function addClass(element, classToAdd) {
  if (element.classList) {
    element.classList.add(classToAdd);

  // Don't need to `throwIfWhitespace` here because `hasElClass` will do it
  // in the case of classList not being supported.
  } else if (!hasClass(element, classToAdd)) {
    element.className = (element.className + ' ' + classToAdd).trim();
  }

  return element;
}

/**
 * Remove a class name from an element.
 *
 * @param  {Element} element
 *         Element to remove a class name from.
 *
 * @param  {string} classToRemove
 *         Class name to remove
 *
 * @return {Element}
 *         The DOM element with class name removed.
 */
export function removeClass(element, classToRemove) {
  // Protect in case the player gets disposed
  if (!element) {
    log.warn("removeClass was called with an element that doesn't exist");
    return null;
  }
  if (element.classList) {
    element.classList.remove(classToRemove);
  } else {
    throwIfWhitespace(classToRemove);
    element.className = element.className.split(/\s+/).filter(function(c) {
      return c !== classToRemove;
    }).join(' ');
  }

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
export function toggleClass(element, classToToggle, predicate) {

  // This CANNOT use `classList` internally because IE11 does not support the
  // second parameter to the `classList.toggle()` method! Which is fine because
  // `classList` will be used by the add/remove functions.
  const has = hasClass(element, classToToggle);

  if (typeof predicate === 'function') {
    predicate = predicate(element, classToToggle);
  }

  if (typeof predicate !== 'boolean') {
    predicate = !has;
  }

  // If the necessary class operation matches the current state of the
  // element, no action is required.
  if (predicate === has) {
    return;
  }

  if (predicate) {
    addClass(element, classToToggle);
  } else {
    removeClass(element, classToToggle);
  }

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
export function setAttributes(el, attributes) {
  Object.getOwnPropertyNames(attributes).forEach(function(attrName) {
    const attrValue = attributes[attrName];

    if (attrValue === null || typeof attrValue === 'undefined' || attrValue === false) {
      el.removeAttribute(attrName);
    } else {
      el.setAttribute(attrName, (attrValue === true ? '' : attrValue));
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
export function getAttributes(tag) {
  const obj = {};

  // known boolean attributes
  // we can check for matching boolean properties, but not all browsers
  // and not all tags know about these attributes, so, we still want to check them manually
  const knownBooleans = ',' + 'autoplay,controls,playsinline,loop,muted,default,defaultMuted' + ',';

  if (tag && tag.attributes && tag.attributes.length > 0) {
    const attrs = tag.attributes;

    for (let i = attrs.length - 1; i >= 0; i--) {
      const attrName = attrs[i].name;
      let attrVal = attrs[i].value;

      // check for known booleans
      // the matching element property will return a value for typeof
      if (typeof tag[attrName] === 'boolean' || knownBooleans.indexOf(',' + attrName + ',') !== -1) {
        // the value of an included boolean attribute is typically an empty
        // string ('') which would equal false if we just check for a false value.
        // we also don't want support bad code like autoplay='false'
        attrVal = (attrVal !== null) ? true : false;
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
export function getAttribute(el, attribute) {
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
export function setAttribute(el, attribute, value) {
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
export function removeAttribute(el, attribute) {
  el.removeAttribute(attribute);
}

/**
 * Attempt to block the ability to select text.
 */
export function blockTextSelection() {
  document.body.focus();
  document.onselectstart = function() {
    return false;
  };
}

/**
 * Turn off text selection blocking.
 */
export function unblockTextSelection() {
  document.onselectstart = function() {
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
export function getBoundingClientRect(el) {
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
export function findPosition(el) {
  if (!el || (el && !el.offsetParent)) {
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

  while (el.offsetParent && el !== document[fs.fullscreenElement]) {
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
 * @param  {EventTarget~Event} event
 *         Event object.
 *
 * @return {module:dom~Coordinates}
 *         A coordinates object corresponding to the mouse position.
 *
 */
export function getPointerPosition(el, event) {
  const translated = {
    x: 0,
    y: 0
  };

  if (browser.IS_IOS) {
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
    if (browser.IS_IOS) {
      offsetX -= translated.x;
      offsetY -= translated.y;
    }
  }

  position.y = (1 - Math.max(0, Math.min(1, offsetY / boxH)));
  position.x = Math.max(0, Math.min(1, offsetX / boxW));
  return position;
}

/**
 * Determines, via duck typing, whether or not a value is a text node.
 *
 * @param  {Mixed} value
 *         Check if this value is a text node.
 *
 * @return {boolean}
 *         Will be `true` if the value is a text node, `false` otherwise.
 */
export function isTextNode(value) {
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
export function emptyEl(el) {
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
 * `TextNode` | The value will be accepted as-is.
 * `Array`    | A one-dimensional array of strings, elements, text nodes, or functions. These functions should return a string, element, or text node (any other return value, like an array, will be ignored).
 * `Function` | A function, which is expected to return a string, element, text node, or array - any of the other possible values described above. This means that a content descriptor could be a function that returns an array of functions, but those second-level functions must return strings, elements, or text nodes.
 *
 * @typedef {string|Element|TextNode|Array|Function} module:dom~ContentDescriptor
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
 * @param {module:dom~ContentDescriptor} content
 *        A content descriptor value.
 *
 * @return {Array}
 *         All of the content that was passed in, normalized to an array of
 *         elements or text nodes.
 */
export function normalizeContent(content) {

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

    if (typeof value === 'string' && (/\S/).test(value)) {
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
 * @param {module:dom~ContentDescriptor} content
 *        A content descriptor value.
 *
 * @return {Element}
 *         The element with appended normalized content.
 */
export function appendContent(el, content) {
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
 * @param {module:dom~ContentDescriptor} content
 *        A content descriptor value.
 *
 * @return {Element}
 *         The element with inserted normalized content.
 */
export function insertContent(el, content) {
  return appendContent(emptyEl(el), content);
}

/**
 * Check if an event was a single left click.
 *
 * @param  {EventTarget~Event} event
 *         Event object.
 *
 * @return {boolean}
 *         Will be `true` if a single left click, `false` otherwise.
 */
export function isSingleLeftClick(event) {
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
  if (event.type === 'mouseup' && event.button === 0 &&
      event.buttons === 0) {
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
export const $ = createQuerier('querySelector');

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
export const $$ = createQuerier('querySelectorAll');
