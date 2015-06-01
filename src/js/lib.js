var hasOwnProp = Object.prototype.hasOwnProperty;

/**
 * Creates an element and applies properties.
 * @param  {String=} tagName    Name of tag to be created.
 * @param  {Object=} properties Element properties to be applied.
 * @return {Element}
 * @private
 */
vjs.createEl = function(tagName, properties){
  var el;

  tagName = tagName || 'div';
  properties = properties || {};

  el = document.createElement(tagName);

  vjs.obj.each(properties, function(propName, val){
    // Not remembering why we were checking for dash
    // but using setAttribute means you have to use getAttribute

    // The check for dash checks for the aria-* attributes, like aria-label, aria-valuemin.
    // The additional check for "role" is because the default method for adding attributes does not
    // add the attribute "role". My guess is because it's not a valid attribute in some namespaces, although
    // browsers handle the attribute just fine. The W3C allows for aria-* attributes to be used in pre-HTML5 docs.
    // http://www.w3.org/TR/wai-aria-primer/#ariahtml. Using setAttribute gets around this problem.
    if (propName.indexOf('aria-') !== -1 || propName == 'role') {
     el.setAttribute(propName, val);
    } else {
     el[propName] = val;
    }
  });

  return el;
};

/**
 * Uppercase the first letter of a string
 * @param  {String} string String to be uppercased
 * @return {String}
 * @private
 */
vjs.capitalize = function(string){
  return string.charAt(0).toUpperCase() + string.slice(1);
};

/**
 * Object functions container
 * @type {Object}
 * @private
 */
vjs.obj = {};

/**
 * Object.create shim for prototypal inheritance
 *
 * https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Object/create
 *
 * @function
 * @param  {Object}   obj Object to use as prototype
 * @private
 */
vjs.obj.create = Object.create || function(obj){
  //Create a new function called 'F' which is just an empty object.
  function F() {}

  //the prototype of the 'F' function should point to the
  //parameter of the anonymous function.
  F.prototype = obj;

  //create a new constructor function based off of the 'F' function.
  return new F();
};

/**
 * Loop through each property in an object and call a function
 * whose arguments are (key,value)
 * @param  {Object}   obj Object of properties
 * @param  {Function} fn  Function to be called on each property.
 * @this {*}
 * @private
 */
vjs.obj.each = function(obj, fn, context){
  for (var key in obj) {
    if (hasOwnProp.call(obj, key)) {
      fn.call(context || this, key, obj[key]);
    }
  }
};

/**
 * Merge two objects together and return the original.
 * @param  {Object} obj1
 * @param  {Object} obj2
 * @return {Object}
 * @private
 */
vjs.obj.merge = function(obj1, obj2){
  if (!obj2) { return obj1; }
  for (var key in obj2){
    if (hasOwnProp.call(obj2, key)) {
      obj1[key] = obj2[key];
    }
  }
  return obj1;
};

/**
 * Merge two objects, and merge any properties that are objects
 * instead of just overwriting one. Uses to merge options hashes
 * where deeper default settings are important.
 * @param  {Object} obj1 Object to override
 * @param  {Object} obj2 Overriding object
 * @return {Object}      New object. Obj1 and Obj2 will be untouched.
 * @private
 */
vjs.obj.deepMerge = function(obj1, obj2){
  var key, val1, val2;

  // make a copy of obj1 so we're not overwriting original values.
  // like prototype.options_ and all sub options objects
  obj1 = vjs.obj.copy(obj1);

  for (key in obj2){
    if (hasOwnProp.call(obj2, key)) {
      val1 = obj1[key];
      val2 = obj2[key];

      // Check if both properties are pure objects and do a deep merge if so
      if (vjs.obj.isPlain(val1) && vjs.obj.isPlain(val2)) {
        obj1[key] = vjs.obj.deepMerge(val1, val2);
      } else {
        obj1[key] = obj2[key];
      }
    }
  }
  return obj1;
};

/**
 * Make a copy of the supplied object
 * @param  {Object} obj Object to copy
 * @return {Object}     Copy of object
 * @private
 */
vjs.obj.copy = function(obj){
  return vjs.obj.merge({}, obj);
};

/**
 * Check if an object is plain, and not a dom node or any object sub-instance
 * @param  {Object} obj Object to check
 * @return {Boolean}     True if plain, false otherwise
 * @private
 */
vjs.obj.isPlain = function(obj){
  return !!obj
    && typeof obj === 'object'
    && obj.toString() === '[object Object]'
    && obj.constructor === Object;
};

/**
 * Check if an object is Array
*  Since instanceof Array will not work on arrays created in another frame we need to use Array.isArray, but since IE8 does not support Array.isArray we need this shim
 * @param  {Object} obj Object to check
 * @return {Boolean}     True if plain, false otherwise
 * @private
 */
vjs.obj.isArray = Array.isArray || function(arr) {
  return Object.prototype.toString.call(arr) === '[object Array]';
};

/**
 * Check to see whether the input is NaN or not.
 * NaN is the only JavaScript construct that isn't equal to itself
 * @param {Number} num Number to check
 * @return {Boolean} True if NaN, false otherwise
 * @private
 */
vjs.isNaN = function(num) {
  return num !== num;
};

/**
 * Bind (a.k.a proxy or Context). A simple method for changing the context of a function
   It also stores a unique id on the function so it can be easily removed from events
 * @param  {*}   context The object to bind as scope
 * @param  {Function} fn      The function to be bound to a scope
 * @param  {Number=}   uid     An optional unique ID for the function to be set
 * @return {Function}
 * @private
 */
vjs.bind = function(context, fn, uid) {
  // Make sure the function has a unique ID
  if (!fn.guid) { fn.guid = vjs.guid++; }

  // Create the new function that changes the context
  var ret = function() {
    return fn.apply(context, arguments);
  };

  // Allow for the ability to individualize this function
  // Needed in the case where multiple objects might share the same prototype
  // IF both items add an event listener with the same function, then you try to remove just one
  // it will remove both because they both have the same guid.
  // when using this, you need to use the bind method when you remove the listener as well.
  // currently used in text tracks
  ret.guid = (uid) ? uid + '_' + fn.guid : fn.guid;

  return ret;
};

/**
 * Element Data Store. Allows for binding data to an element without putting it directly on the element.
 * Ex. Event listeners are stored here.
 * (also from jsninja.com, slightly modified and updated for closure compiler)
 * @type {Object}
 * @private
 */
vjs.cache = {};

/**
 * Unique ID for an element or function
 * @type {Number}
 * @private
 */
vjs.guid = 1;

/**
 * Unique attribute name to store an element's guid in
 * @type {String}
 * @constant
 * @private
 */
vjs.expando = 'vdata' + (new Date()).getTime();

/**
 * Returns the cache object where data for an element is stored
 * @param  {Element} el Element to store data for.
 * @return {Object}
 * @private
 */
vjs.getData = function(el){
  var id = el[vjs.expando];
  if (!id) {
    id = el[vjs.expando] = vjs.guid++;
  }
  if (!vjs.cache[id]) {
    vjs.cache[id] = {};
  }
  return vjs.cache[id];
};

/**
 * Returns the cache object where data for an element is stored
 * @param  {Element} el Element to store data for.
 * @return {Object}
 * @private
 */
vjs.hasData = function(el){
  var id = el[vjs.expando];
  return !(!id || vjs.isEmpty(vjs.cache[id]));
};

/**
 * Delete data for the element from the cache and the guid attr from getElementById
 * @param  {Element} el Remove data for an element
 * @private
 */
vjs.removeData = function(el){
  var id = el[vjs.expando];
  if (!id) { return; }
  // Remove all stored data
  // Changed to = null
  // http://coding.smashingmagazine.com/2012/11/05/writing-fast-memory-efficient-javascript/
  // vjs.cache[id] = null;
  delete vjs.cache[id];

  // Remove the expando property from the DOM node
  try {
    delete el[vjs.expando];
  } catch(e) {
    if (el.removeAttribute) {
      el.removeAttribute(vjs.expando);
    } else {
      // IE doesn't appear to support removeAttribute on the document element
      el[vjs.expando] = null;
    }
  }
};

/**
 * Check if an object is empty
 * @param  {Object}  obj The object to check for emptiness
 * @return {Boolean}
 * @private
 */
vjs.isEmpty = function(obj) {
  for (var prop in obj) {
    // Inlude null properties as empty.
    if (obj[prop] !== null) {
      return false;
    }
  }
  return true;
};

/**
 * Check if an element has a CSS class
 * @param {Element} element Element to check
 * @param {String} classToCheck Classname to check
 * @private
 */
vjs.hasClass = function(element, classToCheck){
  return ((' ' + element.className + ' ').indexOf(' ' + classToCheck + ' ') !== -1);
};


/**
 * Add a CSS class name to an element
 * @param {Element} element    Element to add class name to
 * @param {String} classToAdd Classname to add
 * @private
 */
vjs.addClass = function(element, classToAdd){
  if (!vjs.hasClass(element, classToAdd)) {
    element.className = element.className === '' ? classToAdd : element.className + ' ' + classToAdd;
  }
};

/**
 * Remove a CSS class name from an element
 * @param {Element} element    Element to remove from class name
 * @param {String} classToAdd Classname to remove
 * @private
 */
vjs.removeClass = function(element, classToRemove){
  var classNames, i;

  if (!vjs.hasClass(element, classToRemove)) {return;}

  classNames = element.className.split(' ');

  // no arr.indexOf in ie8, and we don't want to add a big shim
  for (i = classNames.length - 1; i >= 0; i--) {
    if (classNames[i] === classToRemove) {
      classNames.splice(i,1);
    }
  }

  element.className = classNames.join(' ');
};

/**
 * Element for testing browser HTML5 video capabilities
 * @type {Element}
 * @constant
 * @private
 */
vjs.TEST_VID = vjs.createEl('video');
(function() {
  var track = document.createElement('track');
  track.kind = 'captions';
  track.srclang = 'en';
  track.label = 'English';
  vjs.TEST_VID.appendChild(track);
})();

/**
 * Useragent for browser testing.
 * @type {String}
 * @constant
 * @private
 */
vjs.USER_AGENT = navigator.userAgent;

/**
 * Device is an iPhone
 * @type {Boolean}
 * @constant
 * @private
 */
vjs.IS_IPHONE = (/iPhone/i).test(vjs.USER_AGENT);
vjs.IS_IPAD = (/iPad/i).test(vjs.USER_AGENT);
vjs.IS_IPOD = (/iPod/i).test(vjs.USER_AGENT);
vjs.IS_IOS = vjs.IS_IPHONE || vjs.IS_IPAD || vjs.IS_IPOD;

vjs.IOS_VERSION = (function(){
  var match = vjs.USER_AGENT.match(/OS (\d+)_/i);
  if (match && match[1]) { return match[1]; }
})();

vjs.IS_ANDROID = (/Android/i).test(vjs.USER_AGENT);
vjs.ANDROID_VERSION = (function() {
  // This matches Android Major.Minor.Patch versions
  // ANDROID_VERSION is Major.Minor as a Number, if Minor isn't available, then only Major is returned
  var match = vjs.USER_AGENT.match(/Android (\d+)(?:\.(\d+))?(?:\.(\d+))*/i),
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
vjs.IS_OLD_ANDROID = vjs.IS_ANDROID && (/webkit/i).test(vjs.USER_AGENT) && vjs.ANDROID_VERSION < 2.3;

vjs.IS_FIREFOX = (/Firefox/i).test(vjs.USER_AGENT);
vjs.IS_CHROME = (/Chrome/i).test(vjs.USER_AGENT);
vjs.IS_IE8 = (/MSIE\s8\.0/).test(vjs.USER_AGENT);

vjs.TOUCH_ENABLED = !!(('ontouchstart' in window) || window.DocumentTouch && document instanceof window.DocumentTouch);
vjs.BACKGROUND_SIZE_SUPPORTED = 'backgroundSize' in vjs.TEST_VID.style;

/**
 * Apply attributes to an HTML element.
 * @param  {Element} el         Target element.
 * @param  {Object=} attributes Element attributes to be applied.
 * @private
 */
vjs.setElementAttributes = function(el, attributes){
  vjs.obj.each(attributes, function(attrName, attrValue) {
    if (attrValue === null || typeof attrValue === 'undefined' || attrValue === false) {
      el.removeAttribute(attrName);
    } else {
      el.setAttribute(attrName, (attrValue === true ? '' : attrValue));
    }
  });
};

/**
 * Get an element's attribute values, as defined on the HTML tag
 * Attributes are not the same as properties. They're defined on the tag
 * or with setAttribute (which shouldn't be used with HTML)
 * This will return true or false for boolean attributes.
 * @param  {Element} tag Element from which to get tag attributes
 * @return {Object}
 * @private
 */
vjs.getElementAttributes = function(tag){
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
};

/**
 * Get the computed style value for an element
 * From http://robertnyman.com/2006/04/24/get-the-rendered-style-of-an-element/
 * @param  {Element} el        Element to get style value for
 * @param  {String} strCssRule Style name
 * @return {String}            Style value
 * @private
 */
vjs.getComputedDimension = function(el, strCssRule){
  var strValue = '';
  if(document.defaultView && document.defaultView.getComputedStyle){
    strValue = document.defaultView.getComputedStyle(el, '').getPropertyValue(strCssRule);

  } else if(el.currentStyle){
    // IE8 Width/Height support
    strValue = el['client'+strCssRule.substr(0,1).toUpperCase() + strCssRule.substr(1)] + 'px';
  }
  return strValue;
};

/**
 * Insert an element as the first child node of another
 * @param  {Element} child   Element to insert
 * @param  {[type]} parent Element to insert child into
 * @private
 */
vjs.insertFirst = function(child, parent){
  if (parent.firstChild) {
    parent.insertBefore(child, parent.firstChild);
  } else {
    parent.appendChild(child);
  }
};

/**
 * Object to hold browser support information
 * @type {Object}
 * @private
 */
vjs.browser = {};

/**
 * Shorthand for document.getElementById()
 * Also allows for CSS (jQuery) ID syntax. But nothing other than IDs.
 * @param  {String} id  Element ID
 * @return {Element}    Element with supplied ID
 * @private
 */
vjs.el = function(id){
  if (id.indexOf('#') === 0) {
    id = id.slice(1);
  }

  return document.getElementById(id);
};

/**
 * Format seconds as a time string, H:MM:SS or M:SS
 * Supplying a guide (in seconds) will force a number of leading zeros
 * to cover the length of the guide
 * @param  {Number} seconds Number of seconds to be turned into a string
 * @param  {Number} guide   Number (in seconds) to model the string after
 * @return {String}         Time formatted as H:MM:SS or M:SS
 * @private
 */
vjs.formatTime = function(seconds, guide) {
  // Default to using seconds as guide
  guide = guide || seconds;
  var s = Math.floor(seconds % 60),
      m = Math.floor(seconds / 60 % 60),
      h = Math.floor(seconds / 3600),
      gm = Math.floor(guide / 60 % 60),
      gh = Math.floor(guide / 3600);

  // handle invalid times
  if (isNaN(seconds) || seconds === Infinity) {
    // '-' is false for all relational operators (e.g. <, >=) so this setting
    // will add the minimum number of fields specified by the guide
    h = m = s = '-';
  }

  // Check if we need to show hours
  h = (h > 0 || gh > 0) ? h + ':' : '';

  // If hours are showing, we may need to add a leading zero.
  // Always show at least one digit of minutes.
  m = (((h || gm >= 10) && m < 10) ? '0' + m : m) + ':';

  // Check if leading zero is need for seconds
  s = (s < 10) ? '0' + s : s;

  return h + m + s;
};

// Attempt to block the ability to select text while dragging controls
vjs.blockTextSelection = function(){
  document.body.focus();
  document.onselectstart = function () { return false; };
};
// Turn off text selection blocking
vjs.unblockTextSelection = function(){ document.onselectstart = function () { return true; }; };

/**
 * Trim whitespace from the ends of a string.
 * @param  {String} string String to trim
 * @return {String}        Trimmed string
 * @private
 */
vjs.trim = function(str){
  return (str+'').replace(/^\s+|\s+$/g, '');
};

/**
 * Should round off a number to a decimal place
 * @param  {Number} num Number to round
 * @param  {Number} dec Number of decimal places to round to
 * @return {Number}     Rounded number
 * @private
 */
vjs.round = function(num, dec) {
  if (!dec) { dec = 0; }
  return Math.round(num*Math.pow(10,dec))/Math.pow(10,dec);
};

/**
 * Should create a fake TimeRange object
 * Mimics an HTML5 time range instance, which has functions that
 * return the start and end times for a range
 * TimeRanges are returned by the buffered() method
 * @param  {Number} start Start time in seconds
 * @param  {Number} end   End time in seconds
 * @return {Object}       Fake TimeRange object
 * @private
 */
vjs.createTimeRange = function(start, end){
  if (start === undefined && end === undefined) {
    return {
      length: 0,
      start: function() {
        throw new Error('This TimeRanges object is empty');
      },
      end: function() {
        throw new Error('This TimeRanges object is empty');
      }
    };
  }

  return {
    length: 1,
    start: function() { return start; },
    end: function() { return end; }
  };
};

/**
 * Add to local storage (may removable)
 * @private
 */
vjs.setLocalStorage = function(key, value){
  try {
    // IE was throwing errors referencing the var anywhere without this
    var localStorage = window.localStorage || false;
    if (!localStorage) { return; }
    localStorage[key] = value;
  } catch(e) {
    if (e.code == 22 || e.code == 1014) { // Webkit == 22 / Firefox == 1014
      vjs.log('LocalStorage Full (VideoJS)', e);
    } else {
      if (e.code == 18) {
        vjs.log('LocalStorage not allowed (VideoJS)', e);
      } else {
        vjs.log('LocalStorage Error (VideoJS)', e);
      }
    }
  }
};

/**
 * Get absolute version of relative URL. Used to tell flash correct URL.
 * http://stackoverflow.com/questions/470832/getting-an-absolute-url-from-a-relative-one-ie6-issue
 * @param  {String} url URL to make absolute
 * @return {String}     Absolute URL
 * @private
 */
vjs.getAbsoluteURL = function(url){

  // Check if absolute URL
  if (!url.match(/^https?:\/\//)) {
    // Convert to absolute URL. Flash hosted off-site needs an absolute URL.
    url = vjs.createEl('div', {
      innerHTML: '<a href="'+url+'">x</a>'
    }).firstChild.href;
  }

  return url;
};


/**
 * Resolve and parse the elements of a URL
 * @param  {String} url The url to parse
 * @return {Object}     An object of url details
 */
vjs.parseUrl = function(url) {
  var div, a, addToBody, props, details;

  props = ['protocol', 'hostname', 'port', 'pathname', 'search', 'hash', 'host'];

  // add the url to an anchor and let the browser parse the URL
  a = vjs.createEl('a', { href: url });

  // IE8 (and 9?) Fix
  // ie8 doesn't parse the URL correctly until the anchor is actually
  // added to the body, and an innerHTML is needed to trigger the parsing
  addToBody = (a.host === '' && a.protocol !== 'file:');
  if (addToBody) {
    div = vjs.createEl('div');
    div.innerHTML = '<a href="'+url+'"></a>';
    a = div.firstChild;
    // prevent the div from affecting layout
    div.setAttribute('style', 'display:none; position:absolute;');
    document.body.appendChild(div);
  }

  // Copy the specific URL properties to a new object
  // This is also needed for IE8 because the anchor loses its
  // properties when it's removed from the dom
  details = {};
  for (var i = 0; i < props.length; i++) {
    details[props[i]] = a[props[i]];
  }

  // IE9 adds the port to the host property unlike everyone else. If
  // a port identifier is added for standard ports, strip it.
  if (details.protocol === 'http:') {
    details.host = details.host.replace(/:80$/, '');
  }
  if (details.protocol === 'https:') {
    details.host = details.host.replace(/:443$/, '');
  }

  if (addToBody) {
    document.body.removeChild(div);
  }

  return details;
};

/**
 * Log messages to the console and history based on the type of message
 *
 * @param  {String} type The type of message, or `null` for `log`
 * @param  {[type]} args The args to be passed to the log
 * @private
 */
function _logType(type, args){
  var argsArray, noop, console;

  // convert args to an array to get array functions
  argsArray = Array.prototype.slice.call(args);
  // if there's no console then don't try to output messages
  // they will still be stored in vjs.log.history
  // Was setting these once outside of this function, but containing them
  // in the function makes it easier to test cases where console doesn't exist
  noop = function(){};
  console = window['console'] || {
    'log': noop,
    'warn': noop,
    'error': noop
  };

  if (type) {
    // add the type to the front of the message
    argsArray.unshift(type.toUpperCase()+':');
  } else {
    // default to log with no prefix
    type = 'log';
  }

  // add to history
  vjs.log.history.push(argsArray);

  // add console prefix after adding to history
  argsArray.unshift('VIDEOJS:');

  // call appropriate log function
  if (console[type].apply) {
    console[type].apply(console, argsArray);
  } else {
    // ie8 doesn't allow error.apply, but it will just join() the array anyway
    console[type](argsArray.join(' '));
  }
}

/**
 * Log plain debug messages
 */
vjs.log = function(){
  _logType(null, arguments);
};

/**
 * Keep a history of log messages
 * @type {Array}
 */
vjs.log.history = [];

/**
 * Log error messages
 */
vjs.log.error = function(){
  _logType('error', arguments);
};

/**
 * Log warning messages
 */
vjs.log.warn = function(){
  _logType('warn', arguments);
};

// Offset Left
// getBoundingClientRect technique from John Resig http://ejohn.org/blog/getboundingclientrect-is-awesome/
vjs.findPosition = function(el) {
  var box, docEl, body, clientLeft, scrollLeft, left, clientTop, scrollTop, top;

  if (el.getBoundingClientRect && el.parentNode) {
    box = el.getBoundingClientRect();
  }

  if (!box) {
    return {
      left: 0,
      top: 0
    };
  }

  docEl = document.documentElement;
  body = document.body;

  clientLeft = docEl.clientLeft || body.clientLeft || 0;
  scrollLeft = window.pageXOffset || body.scrollLeft;
  left = box.left + scrollLeft - clientLeft;

  clientTop = docEl.clientTop || body.clientTop || 0;
  scrollTop = window.pageYOffset || body.scrollTop;
  top = box.top + scrollTop - clientTop;

  // Android sometimes returns slightly off decimal values, so need to round
  return {
    left: vjs.round(left),
    top: vjs.round(top)
  };
};

/**
 * Array functions container
 * @type {Object}
 * @private
 */
vjs.arr = {};

/*
 * Loops through an array and runs a function for each item inside it.
 * @param  {Array}    array       The array
 * @param  {Function} callback    The function to be run for each item
 * @param  {*}        thisArg     The `this` binding of callback
 * @returns {Array}               The array
 * @private
 */
vjs.arr.forEach = function(array, callback, thisArg) {
  if (vjs.obj.isArray(array) && callback instanceof Function) {
    for (var i = 0, len = array.length; i < len; ++i) {
      callback.call(thisArg || vjs, array[i], i, array);
    }
  }

  return array;
};
