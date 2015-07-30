/**
 * @file dom.js
 */
import document from 'global/document';
import window from 'global/window';
import  * as Guid from './guid.js';

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
export function createEl(tagName='div', properties={}){
  let el = document.createElement(tagName);

  Object.getOwnPropertyNames(properties).forEach(function(propName){
      let val = properties[propName];

      // Not remembering why we were checking for dash
      // but using setAttribute means you have to use getAttribute

      // The check for dash checks for the aria- * attributes, like aria-label, aria-valuemin.
      // The additional check for "role" is because the default method for adding attributes does not
      // add the attribute "role". My guess is because it's not a valid attribute in some namespaces, although
      // browsers handle the attribute just fine. The W3C allows for aria- * attributes to be used in pre-HTML5 docs.
      // http://www.w3.org/TR/wai-aria-primer/#ariahtml. Using setAttribute gets around this problem.
      if (propName.indexOf('aria-') !== -1 || propName === 'role') {
       el.setAttribute(propName, val);
      } else {
       el[propName] = val;
      }
  });

  return el;
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
