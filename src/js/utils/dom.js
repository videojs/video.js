/**
 * @file dom.js
 * @module dom
 */
import document from 'global/document';
import window from 'global/window';
import log from './log.js';
import tsml from 'tsml';
import {isObject} from './obj';
import computedStyle from './computed-style';

/**
 * Detect if a value is a string with any non-whitespace characters.
 *
 * @param {string} str
 *        The string to check
 *
 * @return {boolean}
 *         - True if the string is non-blank
 *         - False otherwise
 *
 */
function isNonBlankString(str) {
  return typeof str === 'string' && (/\S/).test(str);
}

/**
 * Throws an error if the passed string has whitespace. This is used by
 * class methods to be relatively consistent with the classList API.
 *
 * @param {string} str
 *         The string to check for whitespace.
 *
 * @throws {Error}
 *         Throws an error if there is whitespace in the string.
 *
 */
function throwIfWhitespace(str) {
  if ((/\s/).test(str)) {
    throw new Error('class has illegal whitespace characters');
  }
}

/**
 * Produce a regular expression for matching a className within an elements className.
 *
 * @param {string} className
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
 * Whether the current DOM interface appears to be real.
 *
 * @return {Boolean}
 */
export function isReal() {
  return (

    // Both document and window will never be undefined thanks to `global`.
    document === window.document &&

    // In IE < 9, DOM methods return "object" as their type, so all we can
    // confidently check is that it exists.
    typeof document.createElement !== 'undefined');
}

/**
 * Determines, via duck typing, whether or not a value is a DOM element.
 *
 * @param {Mixed} value
 *        The thing to check
 *
 * @return {boolean}
 *         - True if it is a DOM element
 *         - False otherwise
 */
export function isEl(value) {
  return isObject(value) && value.nodeType === 1;
}

/**
 * Creates functions to query the DOM using a given method.
 *
 * @param {string} method
 *         The method to create the query with.
 *
 * @return {Function}
 *         The query method
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
 * Creates an element and applies properties.
 *
 * @param {string} [tagName='div']
 *         Name of tag to be created.
 *
 * @param {Object} [properties={}]
 *         Element properties to be applied.
 *
 * @param {Object} [attributes={}]
 *         Element attributes to be applied.
 *
 * @param {String|Element|TextNode|Array|Function} [content]
 *         Contents for the element (see: {@link dom:normalizeContent})
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
      log.warn(tsml`Setting attributes in the second argument of createEl()
                has been deprecated. Use the third argument instead.
                createEl(type, properties, attributes). Attempting to set ${propName} to ${val}.`);
      el.setAttribute(propName, val);

    // Handle textContent since it's not supported everywhere and we have a
    // method for it.
    } else if (propName === 'textContent') {
      textContent(el, val);
    } else {
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
 * @param {Element} el
 *        The element to add text content into
 *
 * @param {string} text
 *        The text content to add.
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
 * Check if an element has a CSS class
 *
 * @param {Element} element
 *        Element to check
 *
 * @param {string} classToCheck
 *        Class name to check for
 *
 * @return {boolean}
 *         - True if the element had the class
 *         - False otherwise.
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
 * Add a CSS class name to an element
 *
 * @param {Element} element
 *        Element to add class name to.
 *
 * @param {string} classToAdd
 *        Class name to add.
 *
 * @return {Element}
 *         The dom element with the added class name.
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
 * Remove a CSS class name from an element
 *
 * @param {Element} element
 *        Element to remove a class name from.
 *
 * @param {string} classToRemove
 *        Class name to remove
 *
 * @return {Element}
 *         The dom element with class name removed.
 */
export function removeClass(element, classToRemove) {
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
 * The callback definition for toggleElClass.
 *
 * @callback Dom~PredicateCallback
 * @param {Element} element
 *        The DOM element of the Component.
 *
 * @param {string} classToToggle
 *        The `className` that wants to be toggled
 *
 * @return {boolean|undefined}
 *         - If true the `classToToggle` will get added to `element`.
 *         - If false the `classToToggle` will get removed from `element`.
 *         - If undefined this callback will be ignored
 */

/**
 * Adds or removes a CSS class name on an element depending on an optional
 * condition or the presence/absence of the class name.
 *
 * @param {Element} element
 *        The element to toggle a class name on.
 *
 * @param {string} classToToggle
 *        The class that should be toggled
 *
 * @param {boolean|PredicateCallback} [predicate]
 *        See the return value for {@link Dom~PredicateCallback}
 *
 * @return {Element}
 *         The element with a class that has been toggled.
 */
export function toggleClass(element, classToToggle, predicate) {

  // This CANNOT use `classList` internally because IE does not support the
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
 * Get an element's attribute values, as defined on the HTML tag
 * Attributes are not the same as properties. They're defined on the tag
 * or with setAttribute (which shouldn't be used with HTML)
 * This will return true or false for boolean attributes.
 *
 * @param {Element} tag
 *        Element from which to get tag attributes.
 *
 * @return {Object}
 *         All attributes of the element.
 */
export function getAttributes(tag) {
  const obj = {};

  // known boolean attributes
  // we can check for matching boolean properties, but older browsers
  // won't know about HTML5 boolean attributes that we still read from
  const knownBooleans = ',' + 'autoplay,controls,loop,muted,default' + ',';

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
 * Get the value of an element's attribute
 *
 * @param {Element} el
 *        A DOM element
 *
 * @param {string} attribute
 *        Attribute to get the value of
 *
 * @return {string}
 *         value of the attribute
 */
export function getAttribute(el, attribute) {
  return el.getAttribute(attribute);
}

/**
 * Set the value of an element's attribute
 *
 * @param {Element} el
 *        A DOM element
 *
 * @param {string} attribute
 *        Attribute to set
 *
 * @param {string} value
 *        Value to set the attribute to
 */
export function setAttribute(el, attribute, value) {
  el.setAttribute(attribute, value);
}

/**
 * Remove an element's attribute
 *
 * @param {Element} el
 *        A DOM element
 *
 * @param {string} attribute
 *        Attribute to remove
 */
export function removeAttribute(el, attribute) {
  el.removeAttribute(attribute);
}

/**
 * Attempt to block the ability to select text while dragging controls
 */
export function blockTextSelection() {
  document.body.focus();
  document.onselectstart = function() {
    return false;
  };
}

/**
 * Turn off text selection blocking
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
 *         Always returns a plain
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
 * The postion of a DOM element on the page.
 *
 * @typedef {Object} module:dom~Position
 *
 * @property {number} left
 *           Pixels to the left
 *
 * @property {number} top
 *           Pixels on top
 */

/**
 * Offset Left.
 * getBoundingClientRect technique from
 * John Resig
 *
 * @see http://ejohn.org/blog/getboundingclientrect-is-awesome/
 *
 * @param {Element} el
 *        Element from which to get offset
 *
 * @return {module:dom~Position}
 *         The position of the element that was passed in.
 */
export function findPosition(el) {
  let box;

  if (el.getBoundingClientRect && el.parentNode) {
    box = el.getBoundingClientRect();
  }

  if (!box) {
    return {
      left: 0,
      top: 0
    };
  }

  const docEl = document.documentElement;
  const body = document.body;

  const clientLeft = docEl.clientLeft || body.clientLeft || 0;
  const scrollLeft = window.pageXOffset || body.scrollLeft;
  const left = box.left + scrollLeft - clientLeft;

  const clientTop = docEl.clientTop || body.clientTop || 0;
  const scrollTop = window.pageYOffset || body.scrollTop;
  const top = box.top + scrollTop - clientTop;

  // Android sometimes returns slightly off decimal values, so need to round
  return {
    left: Math.round(left),
    top: Math.round(top)
  };
}

/**
 * x and y coordinates for a dom element or mouse pointer
 *
 * @typedef {Object} Dom~Coordinates
 *
 * @property {number} x
 *           x coordinate in pixels
 *
 * @property {number} y
 *           y coordinate in pixels
 */

/**
 * Get pointer position in element
 * Returns an object with x and y coordinates.
 * The base on the coordinates are the bottom left of the element.
 *
 * @param {Element} el
 *        Element on which to get the pointer position on
 *
 * @param {EventTarget~Event} event
 *        Event object
 *
 * @return {Dom~Coordinates}
 *         A Coordinates object corresponding to the mouse position.
 *
 */
export function getPointerPosition(el, event) {
  const position = {};
  const box = findPosition(el);
  const boxW = el.offsetWidth;
  const boxH = el.offsetHeight;

  const boxY = box.top;
  const boxX = box.left;
  let pageY = event.pageY;
  let pageX = event.pageX;

  if (event.changedTouches) {
    pageX = event.changedTouches[0].pageX;
    pageY = event.changedTouches[0].pageY;
  }

  position.y = Math.max(0, Math.min(1, ((boxY - pageY) + boxH) / boxH));
  position.x = Math.max(0, Math.min(1, (pageX - boxX) / boxW));

  return position;
}

/**
 * Determines, via duck typing, whether or not a value is a text node.
 *
 * @param {Mixed} value
 *        Check if this value is a text node.
 *
 * @return {boolean}
 *         - True if it is a text node
 *         - False otherwise
 */
export function isTextNode(value) {
  return isObject(value) && value.nodeType === 3;
}

/**
 * Empties the contents of an element.
 *
 * @param {Element} el
 *        The element to empty children from
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
 * Normalizes content for eventual insertion into the DOM.
 *
 * This allows a wide range of content definition methods, but protects
 * from falling into the trap of simply writing to `innerHTML`, which is
 * an XSS concern.
 *
 * The content for an element can be passed in multiple types and
 * combinations, whose behavior is as follows:
 *
 * @param {String|Element|TextNode|Array|Function} content
 *        - String: Normalized into a text node.
 *        - Element/TextNode: Passed through.
 *        - Array: A one-dimensional array of strings, elements, nodes, or functions
 *          (which return single strings, elements, or nodes).
 *        - Function: If the sole argument, is expected to produce a string, element,
 *          node, or array as defined above.
 *
 * @return {Array}
 *         All of the content that was passed in normalized.
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
 * @param {Element} el
 *        Element to append normalized content to.
 *
 *
 * @param {String|Element|TextNode|Array|Function} content
 *        See the `content` argument of {@link dom:normalizeContent}
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
 * @param {String|Element|TextNode|Array|Function} content
 *        See the `content` argument of {@link dom:normalizeContent}
 *
 * @return {Element}
 *         The element with inserted normalized content.
 *
 */
export function insertContent(el, content) {
  return appendContent(emptyEl(el), content);
}

/**
 * Finds a single DOM element matching `selector` within the optional
 * `context` of another DOM element (defaulting to `document`).
 *
 * @param {string} selector
 *        A valid CSS selector, which will be passed to `querySelector`.
 *
 * @param {Element|String} [context=document]
 *        A DOM element within which to query. Can also be a selector
 *        string in which case the first matching element will be used
 *        as context. If missing (or no element matches selector), falls
 *        back to `document`.
 *
 * @return {Element|null}
 *         The element that was found or null.
 */
export const $ = createQuerier('querySelector');

/**
 * Finds a all DOM elements matching `selector` within the optional
 * `context` of another DOM element (defaulting to `document`).
 *
 * @param {string} selector
 *           A valid CSS selector, which will be passed to `querySelectorAll`.
 *
 * @param {Element|String} [context=document]
 *           A DOM element within which to query. Can also be a selector
 *           string in which case the first matching element will be used
 *           as context. If missing (or no element matches selector), falls
 *           back to `document`.
 *
 * @return {NodeList}
 *         A element list of elements that were found. Will be empty if none were found.
 *
 */
export const $$ = createQuerier('querySelectorAll');
