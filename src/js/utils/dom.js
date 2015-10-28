/**
 * @file dom.js
 */
import document from 'global/document';
import window from 'global/window';
import  * as Guid from './guid.js';
import log from './log.js';
import tsml from 'tsml';

/**
 * Shorthand for document.getElementById()
 * Also allows for CSS (jQuery) ID syntax. But nothing other than IDs.
 *
 * @param  {String} id  Element ID
 * @return {Element}    Element with supplied ID
 * @function getEl
 */
export function getEl(id){
  if (id.indexOf('#') === 0) {
    id = id.slice(1);
  }

  return document.getElementById(id);
}

/**
 * Creates an element and applies properties.
 *
 * @param  {String=} tagName    Name of tag to be created.
 * @param  {Object=} properties Element properties to be applied.
 * @return {Element}
 * @function createEl
 */
export function createEl(tagName='div', properties={}, attributes={}){
  let el = document.createElement(tagName);

  Object.getOwnPropertyNames(properties).forEach(function(propName){
    let val = properties[propName];

    // See #2176
    // We originally were accepting both properties and attributes in the
    // same object, but that doesn't work so well.
    if (propName.indexOf('aria-') !== -1 || propName === 'role' || propName === 'type') {
      log.warn(tsml`Setting attributes in the second argument of createEl()
                has been deprecated. Use the third argument instead.
                createEl(type, properties, attributes). Attempting to set ${propName} to ${val}.`);
      el.setAttribute(propName, val);
    } else {
      el[propName] = val;
    }
  });

  Object.getOwnPropertyNames(attributes).forEach(function(attrName){
    let val = attributes[attrName];
    el.setAttribute(attrName, attributes[attrName]);
  });

  return el;
}

/**
 * Injects text into an element, replacing any existing contents entirely.
 *
 * @param  {Element} el
 * @param  {String} text
 * @return {Element}
 * @function textContent
 */
export function textContent(el, text) {
  if (typeof el.textContent === 'undefined') {
    el.innerText = text;
  } else {
    el.textContent = text;
  }
}

/**
 * Insert an element as the first child node of another
 *
 * @param  {Element} child   Element to insert
 * @param  {Element} parent Element to insert child into
 * @private
 * @function insertElFirst
 */
export function insertElFirst(child, parent){
  if (parent.firstChild) {
    parent.insertBefore(child, parent.firstChild);
  } else {
    parent.appendChild(child);
  }
}

/**
 * Element Data Store. Allows for binding data to an element without putting it directly on the element.
 * Ex. Event listeners are stored here.
 * (also from jsninja.com, slightly modified and updated for closure compiler)
 *
 * @type {Object}
 * @private
 */
const elData = {};

/*
 * Unique attribute name to store an element's guid in
 *
 * @type {String}
 * @constant
 * @private
 */
const elIdAttr = 'vdata' + (new Date()).getTime();

/**
 * Returns the cache object where data for an element is stored
 *
 * @param  {Element} el Element to store data for.
 * @return {Object}
 * @function getElData
 */
export function getElData(el) {
  let id = el[elIdAttr];

  if (!id) {
    id = el[elIdAttr] = Guid.newGUID();
  }

  if (!elData[id]) {
    elData[id] = {};
  }

  return elData[id];
}

/**
 * Returns whether or not an element has cached data
 *
 * @param  {Element} el A dom element
 * @return {Boolean}
 * @private
 * @function hasElData
 */
export function hasElData(el) {
  const id = el[elIdAttr];

  if (!id) {
    return false;
  }

  return !!Object.getOwnPropertyNames(elData[id]).length;
}

/**
 * Delete data for the element from the cache and the guid attr from getElementById
 *
 * @param  {Element} el Remove data for an element
 * @private
 * @function removeElData
 */
export function removeElData(el) {
  let id = el[elIdAttr];

  if (!id) {
    return;
  }

  // Remove all stored data
  delete elData[id];

  // Remove the elIdAttr property from the DOM node
  try {
    delete el[elIdAttr];
  } catch(e) {
    if (el.removeAttribute) {
      el.removeAttribute(elIdAttr);
    } else {
      // IE doesn't appear to support removeAttribute on the document element
      el[elIdAttr] = null;
    }
  }
}

/**
 * Check if an element has a CSS class
 *
 * @param {Element} element Element to check
 * @param {String} classToCheck Classname to check
 * @function hasElClass
 */
export function hasElClass(element, classToCheck) {
  return ((' ' + element.className + ' ').indexOf(' ' + classToCheck + ' ') !== -1);
}

/**
 * Add a CSS class name to an element
 *
 * @param {Element} element    Element to add class name to
 * @param {String} classToAdd Classname to add
 * @function addElClass
 */
export function addElClass(element, classToAdd) {
  if (!hasElClass(element, classToAdd)) {
    element.className = element.className === '' ? classToAdd : element.className + ' ' + classToAdd;
  }
}

/**
 * Remove a CSS class name from an element
 *
 * @param {Element} element    Element to remove from class name
 * @param {String} classToRemove Classname to remove
 * @function removeElClass
 */
export function removeElClass(element, classToRemove) {
  if (!hasElClass(element, classToRemove)) {return;}

  let classNames = element.className.split(' ');

  // no arr.indexOf in ie8, and we don't want to add a big shim
  for (let i = classNames.length - 1; i >= 0; i--) {
    if (classNames[i] === classToRemove) {
      classNames.splice(i,1);
    }
  }

  element.className = classNames.join(' ');
}

/**
 * Apply attributes to an HTML element.
 *
 * @param  {Element} el         Target element.
 * @param  {Object=} attributes Element attributes to be applied.
 * @private
 * @function setElAttributes
 */
export function setElAttributes(el, attributes) {
  Object.getOwnPropertyNames(attributes).forEach(function(attrName){
    let attrValue = attributes[attrName];

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
 * @param  {Element} tag Element from which to get tag attributes
 * @return {Object}
 * @private
 * @function getElAttributes
 */
export function getElAttributes(tag) {
  var obj, knownBooleans, attrs, attrName, attrVal;

  obj = {};

  // known boolean attributes
  // we can check for matching boolean properties, but older browsers
  // won't know about HTML5 boolean attributes that we still read from
  knownBooleans = ','+'autoplay,controls,loop,muted,default'+',';

  if (tag && tag.attributes && tag.attributes.length > 0) {
    attrs = tag.attributes;

    for (var i = attrs.length - 1; i >= 0; i--) {
      attrName = attrs[i].name;
      attrVal = attrs[i].value;

      // check for known booleans
      // the matching element property will return a value for typeof
      if (typeof tag[attrName] === 'boolean' || knownBooleans.indexOf(','+attrName+',') !== -1) {
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
 * Attempt to block the ability to select text while dragging controls
 *
 * @return {Boolean}
 * @method blockTextSelection
 */
export function blockTextSelection() {
  document.body.focus();
  document.onselectstart = function() {
    return false;
  };
}

/**
 * Turn off text selection blocking
 *
 * @return {Boolean}
 * @method unblockTextSelection
 */
export function unblockTextSelection() {
  document.onselectstart = function() {
    return true;
  };
}

/**
 * Offset Left
 * getBoundingClientRect technique from
 * John Resig http://ejohn.org/blog/getboundingclientrect-is-awesome/
 *
 * @param {Element} el Element from which to get offset
 * @return {Object=}
 * @method findElPosition
 */
export function findElPosition(el) {
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
 * Get pointer position in element
 * Returns an object with x and y coordinates.
 * The base on the coordinates are the bottom left of the element.
 *
 * @param {Element} el Element on which to get the pointer position on
 * @param {Event} event Event object
 * @return {Object=} position This object will have x and y coordinates corresponding to the mouse position
 * @metho getPointerPosition
 */
export function getPointerPosition(el, event) {
  let position = {};
  let box = findElPosition(el);
  let boxW = el.offsetWidth;
  let boxH = el.offsetHeight;

  let boxY = box.top;
  let boxX = box.left;
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
 * Determines, via duck typing, whether or not a value is a DOM element.
 *
 * @param  {Mixed} value
 * @return {Boolean}
 */
export function isEl(value) {
  return !!value && typeof value === 'object' && value.nodeType === 1;
}

/**
 * Determines, via duck typing, whether or not a value is a text node.
 *
 * @param  {Mixed} value
 * @return {Boolean}
 */
export function isTextNode(value) {
  return !!value && typeof value === 'object' && value.nodeType === 3;
}

/**
 * Empties the contents of an element.
 *
 * @function emptyEl
 * @param    {Element} el
 * @return   {Element}
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
 * The content for an element can be passed in multiple types, whose
 * behavior is as follows:
 *
 * - String: Normalized into a text node.
 * - Node: An Element or TextNode is passed through.
 * - Array: A one-dimensional array of strings, nodes, or functions (which
 *   return single strings or nodes).
 * - Function: If the sole argument, is expected to produce a string, node,
 *   or array.
 *
 * @function normalizeContent
 * @param    {String|Element|Array|Function} content
 * @return   {Array}
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

    if (typeof value === 'string' && /\S/.test(value)) {
      return document.createTextNode(value);
    }
  }).filter(value => value);
}

/**
 * Normalizes and appends content to an element.
 *
 * @function appendContent
 * @param    {Element} el
 * @param    {String|Element|Array|Function} content
 * @return   {Element}
 */
export function appendContent(el, content) {
  normalizeContent(content).forEach(node => el.appendChild(node));
  return el;
}

/**
 * Normalizes and inserts content into an element; this is identical to
 * `appendContent()`, except it empties the element first.
 *
 * @function insertContent
 * @param    {Element} el
 * @param    {String|Element|Array|Function} content
 * @return   {Element}
 */
export function insertContent(el, content) {
  return appendContent(emptyEl(el), content);
}
