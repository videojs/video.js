/**
 * Creates an element and applies properties.
 * @param  {String=} tagName    Name of tag to be created.
 * @param  {Object=} properties Element properties to be applied.
 * @return {Element}
 */
_V_.createEl = function(tagName, properties){
  var el = document.createElement(tagName || 'div');

  for (var propName in properties){
    if (properties.hasOwnProperty(propName)) {
      el[propName] = properties[propName];
      // Not remembering why we were checking for dash
      // but using setAttribute means you have to use getAttribute
      // if (propName.indexOf("-") !== -1) {
      //   el.setAttribute(propName, properties[propName]);
      // } else {
      //   el[propName] = properties[propName];
      // }
    }
  }
  return el;
};

/**
 * Uppercase the first letter of a string
 * @param  {String} string String to be uppercased
 * @return {String}
 */
_V_.uc = function(string){
  return string.charAt(0).toUpperCase() + string.slice(1);
};

/**
 * Loop through each property in an object and call a function
 * whose arguments are (key,value)
 * @param  {Object}   obj Object of properties
 * @param  {Function} fn  Function to be called on each property.
 * @this {*}
 */
_V_.eachProp = function(obj, fn){
  if (!obj) { return; }
  for (var name in obj) {
    if (obj.hasOwnProperty(name)) {
      fn.call(this, name, obj[name]);
    }
  }
};

/**
 * Merge two objects together and return the original.
 * @param  {[type]} obj1 [description]
 * @param  {[type]} obj2 [description]
 * @param  {[type]} safe [description]
 * @return {[type]}
 */
_V_.merge = function(obj1, obj2, safe){
  // Make sure second object exists
  if (!obj2) { return obj1; }

  for (var attrname in obj2){
    if (obj2.hasOwnProperty(attrname) && (!safe || !obj1.hasOwnProperty(attrname))) { obj1[attrname]=obj2[attrname]; }
  }
  return obj1;
};
// _V_.extend = function(obj){ this.merge(this, obj, true); };

/**
 * Bind (a.k.a proxy or Context). A simple method for changing the context of a function
   It also stores a unique id on the function so it can be easily removed from events
 * @param  {*}   context The object to bind as scope
 * @param  {Function} fn      The function to be bound to a scope
 * @param  {Number=}   uid     An optional unique ID for the function to be set
 * @return {Function}
 */
_V_.bind = function(context, fn, uid) {
  // Make sure the function has a unique ID
  if (!fn.guid) { fn.guid = _V_.guid++; }

  // Create the new function that changes the context
  var ret = function() {
    return fn.apply(context, arguments);
  }

  // Allow for the ability to individualize this function
  // Needed in the case where multiple objects might share the same prototype
  // IF both items add an event listener with the same function, then you try to remove just one
  // it will remove both because they both have the same guid.
  // when using this, you need to use the bind method when you remove the listener as well.
  ret.guid = (uid) ? uid + "_" + fn.guid : fn.guid;

  return ret;
};

/**
 * Element Data Store. Allows for binding data to an element without putting it directly on the element.
 * Ex. Event listneres are stored here.
 * (also from jsninja.com, slightly modified and updated for closure compiler)
 * @type {Object}
 */
_V_.cache = {};

/**
 * Unique ID for an element or function
 * @type {Number}
 */
_V_.guid = 1;

/**
 * Unique attribute name to store an element's guid in
 * @type {String}
 * @constant
 */
_V_.expando = "vdata" + (new Date).getTime();

/**
 * Returns the cache object where data for an element is stored
 * @param  {Element} el Element to store data for.
 * @return {Object}
 */
_V_.getData = function(el){
  var id = el[_V_.expando];
  if (!id) {
    id = el[_V_.expando] = _V_.guid++;
    _V_.cache[id] = {};
  }
  return _V_.cache[id];
};

/**
 * Delete data for the element from the cache and the guid attr from getElementById
 * @param  {Element} el Remove data for an element
 */
_V_.removeData = function(el){
  var id = el[_V_.expando];
  if (!id) { return; }
  // Remove all stored data
  // Changed to = null
  // http://coding.smashingmagazine.com/2012/11/05/writing-fast-memory-efficient-javascript/
  _V_.cache[id] = null;
  // Remove the expando property from the DOM node
  try {
    delete el[_V_.expando];
  } catch(e) {
    if (el.removeAttribute) {
      el.removeAttribute(_V_.expando);
    } else {
      // IE doesn't appear to support removeAttribute on the document element
      el[_V_.expando] = null;
    }
  }
};

_V_.isEmpty = function(obj) {
  for (var prop in obj) {
    // Inlude null properties as empty.
    if (obj[prop] !== null) {
      return false;
    }
  }
  return true;
};

/**
 * Add a CSS class name to an element
 * @param {Element} element    Element to add class name to
 * @param {String} classToAdd Classname to add
 */
_V_.addClass = function(element, classToAdd){
  if ((" "+element.className+" ").indexOf(" "+classToAdd+" ") == -1) {
    element.className = element.className === "" ? classToAdd : element.className + " " + classToAdd;
  }
};

/**
 * Remove a CSS class name from an element
 * @param {Element} element    Element to remove from class name
 * @param {String} classToAdd Classname to remove
 */
_V_.removeClass = function(element, classToRemove){
  if (element.className.indexOf(classToRemove) == -1) { return; }
  var classNames = element.className.split(" ");
  classNames.splice(classNames.indexOf(classToRemove),1);
  element.className = classNames.join(" ");
};

/**
 * Element for testing browser HTML5 video capabilities
 * @type {Element}
 * @constant
 */
_V_.TEST_VID = document.createElement("video");

/**
 * Useragent for browser testing.
 * @type {String}
 * @constant
 */
_V_.UA = navigator.userAgent;

/**
 * Device is an iPhone
 * @type {Boolean}
 * @constant
 */
_V_.IS_IPHONE = !!navigator.userAgent.match(/iPad/i);
_V_.IS_IPAD = !!navigator.userAgent.match(/iPhone/i);
_V_.IS_IPOD = !!navigator.userAgent.match(/iPod/i);
_V_.IS_IOS = _V_.IS_IPHONE || _V_.IS_IPAD || _V_.IS_IPOD;

_V_.IOS_VERSION = (function(){
  var match = navigator.userAgent.match(/OS (\d+)_/i);
  if (match && match[1]) { return match[1]; }
})();

_V_.IS_ANDROID = !!navigator.userAgent.match(/Android.*AppleWebKit/i);
_V_.ANDROID_VERSION = (function() {
  var match = navigator.userAgent.match(/Android (\d+)\./i);
  if (match && match[1]) {
    return match[1];
  }
  return null;
})();

/**
 * Get an element's attribute values, as defined on the HTML tag
 * Attributs are not the same as properties. They're defined on the tag
 * or with setAttribute (which shouldn't be used with HTML)
 * This will return true or false for boolean attributes.
 * @param  {Element} tag Element from which to get tag attributes
 * @return {Object}
 */
_V_.getAttributeValues = function(tag){
  var obj = {};

  // Known boolean attributes
  // We can check for matching boolean properties, but older browsers
  // won't know about HTML5 boolean attributes that we still read from.
  // Bookending with commas to allow for an easy string search.
  var knownBooleans = ","+"autoplay,controls,loop,muted,default"+",";

  if (tag && tag.attributes && tag.attributes.length > 0) {
    var attrs = tag.attributes;
    var attrName, attrVal;

    for (var i = attrs.length - 1; i >= 0; i--) {
      attrName = attrs[i].name;
      attrVal = attrs[i].value;

      // Check for known booleans
      // The matching element property will return a value for typeof
      if (typeof tag[attrName] === 'boolean' || knownBooleans.indexOf(","+attrName+",") !== -1) {
        // The value of an included boolean attribute is typically an empty string ("")
        // which would equal false if we just check for a false value.
        // We also don't want support bad code like autoplay="false"
        attrVal = (attrVal !== null) ? true : false;
      }

      obj[attrName] = attrVal;
    };
  }

  return obj;
};

/**
 * Get the computed style value for an element
 * From http://robertnyman.com/2006/04/24/get-the-rendered-style-of-an-element/
 * @param  {Element} el        Element to get style value for
 * @param  {String} strCssRule Style name
 * @return {String}            Style value
 */
_V_.getComputedStyleValue = function(el, strCssRule){
  var strValue = "";
  if(document.defaultView && document.defaultView.getComputedStyle){
    strValue = document.defaultView.getComputedStyle(el, "").getPropertyValue(strCssRule);

  } else if(el.currentStyle){
    strCssRule = strCssRule.replace(/\-(\w)/g, function (strMatch, p1){
      return p1.toUpperCase();
    });
    strValue = el.currentStyle[strCssRule];
  }
  return strValue;
};

/**
 * Insert an element as the first child node of another
 * @param  {Element} child   Element to insert
 * @param  {[type]} parent Element to insert child into
 */
_V_.insertFirst = function(child, parent){
  if (parent.firstChild) {
    parent.insertBefore(child, parent.firstChild);
  } else {
    parent.appendChild(child);
  }
};

/**
 * Object to hold browser support information
 * @type {Object}
 */
_V_.support = {};

/**
 * Shorthand for document.getElementById()
 * Also allows for CSS (jQuery) ID syntax. But nothing other than IDs.
 * @param  {String} id  Element ID
 * @return {Element}    Element with supplied ID
 */
_V_.el = function(id){
  if (id.indexOf("#") === 0) {
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
 */
_V_.formatTime = function(seconds, guide) {
  guide = guide || seconds; // Default to using seconds as guide
  var s = Math.floor(seconds % 60),
      m = Math.floor(seconds / 60 % 60),
      h = Math.floor(seconds / 3600),
      gm = Math.floor(guide / 60 % 60),
      gh = Math.floor(guide / 3600);

  // Check if we need to show hours
  h = (h > 0 || gh > 0) ? h + ":" : "";

  // If hours are showing, we may need to add a leading zero.
  // Always show at least one digit of minutes.
  m = (((h || gm >= 10) && m < 10) ? "0" + m : m) + ":";

  // Check if leading zero is need for seconds
  s = (s < 10) ? "0" + s : s;

  return h + m + s;
};

// Attempt to block the ability to select text while dragging controls
_V_.blockTextSelection = function(){
  document.body.focus();
  document.onselectstart = function () { return false; };
};
// Turn off text selection blocking
_V_.unblockTextSelection = function(){ document.onselectstart = function () { return true; }; };

/**
 * Trim whitespace from the ends of a string.
 * @param  {String} string String to trim
 * @return {String}        Trimmed string
 */
_V_.trim = function(string){
  return string.toString().replace(/^\s+/, "").replace(/\s+$/, "");
};

/**
 * Should round off a number to a decimal place
 * @param  {Number} num Number to round
 * @param  {Number} dec Number of decimal places to round to
 * @return {Number}     Rounded number
 */
_V_.round = function(num, dec) {
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
 */
_V_.createTimeRange = function(start, end){
  return {
    length: 1,
    start: function() { return start; },
    end: function() { return end; }
  };
};

// _V_.extend({
//   // Device Checks
//   isIE: function(){ return !+"\v1"; },
//   isFF: function(){ return !!_V_.ua.match("Firefox") },

//   each: function(arr, fn){
//     if (!arr || arr.length === 0) { return; }
//     for (var i=0,j=arr.length; i<j; i++) {
//       fn.call(this, arr[i], i);
//     }
//   },

//   // Return the relative horizonal position of an event as a value from 0-1
//   getRelativePosition: function(x, relativeElement){
//     return Math.max(0, Math.min(1, (x - _V_.findPosX(relativeElement)) / relativeElement.offsetWidth));
//   },

//   get: function(url, onSuccess, onError){
//     // if (netscape.security.PrivilegeManager.enablePrivilege) {
//     //   netscape.security.PrivilegeManager.enablePrivilege("UniversalBrowserRead");
//     // }

//     var local = (url.indexOf("file:") == 0 || (window.location.href.indexOf("file:") == 0 && url.indexOf("http:") == -1));

//     if (typeof XMLHttpRequest == "undefined") {
//       XMLHttpRequest = function () {
//         try { return new ActiveXObject("Msxml2.XMLHTTP.6.0"); } catch (e) {}
//         try { return new ActiveXObject("Msxml2.XMLHTTP.3.0"); } catch (f) {}
//         try { return new ActiveXObject("Msxml2.XMLHTTP"); } catch (g) {}
//         throw new Error("This browser does not support XMLHttpRequest.");
//       };
//     }

//     var request = new XMLHttpRequest();

//     try {
//       request.open("GET", url);
//     } catch(e) {
//       _V_.log("VideoJS XMLHttpRequest (open)", e);
//       // onError(e);
//       return false;
//     }

//     request.onreadystatechange = _V_.proxy(this, function() {
//       if (request.readyState == 4) {
//         if (request.status == 200 || local && request.status == 0) {
//           onSuccess(request.responseText);
//         } else {
//           if (onError) {
//             onError();
//           }
//         }
//       }
//     });

//     try {
//       request.send();
//     } catch(e) {
//       _V_.log("VideoJS XMLHttpRequest (send)", e);
//       if (onError) {
//         onError(e);
//       }
//     }
//   },

/* Local Storage
================================================================================ */
_V_.setLocalStorage = function(key, value){
  // IE was throwing errors referencing the var anywhere without this
  var localStorage = window.localStorage || false;
  if (!localStorage) { return; }
  try {
    localStorage[key] = value;
  } catch(e) {
    if (e.code == 22 || e.code == 1014) { // Webkit == 22 / Firefox == 1014
      _V_.log("LocalStorage Full (VideoJS)", e);
    } else {
      _V_.log("LocalStorage Error (VideoJS)", e);
    }
  }
};

/**
 * Get abosolute version of relative URL. Used to tell flash correct URL.
 * http://stackoverflow.com/questions/470832/getting-an-absolute-url-from-a-relative-one-ie6-issue
 * @param  {String} url URL to make absolute
 * @return {String}     Absolute URL
 */
_V_.getAbsoluteURL = function(url){

  // Check if absolute URL
  if (!url.match(/^https?:\/\//)) {
    // Convert to absolute URL. Flash hosted off-site needs an absolute URL.
    url = _V_.createEl('div', {
      innerHTML: '<a href="'+url+'">x</a>'
    }).firstChild.href;
  }

  return url;
};

// });

// usage: log('inside coolFunc', this, arguments);
// paulirish.com/2009/log-a-lightweight-wrapper-for-consolelog/
_V_.log = function(){
  _V_.log.history = _V_.log.history || [];// store logs to an array for reference
  _V_.log.history.push(arguments);
  if(window.console) {
    arguments.callee = arguments.callee.caller;
    var newarr = [].slice.call(arguments);
    (typeof console.log === 'object' ? _V_.log.apply.call(console.log, console, newarr) : console.log.apply(console, newarr));
  }
};

// make it safe to use console.log always
(function(b){function c(){}for(var d="assert,count,debug,dir,dirxml,error,exception,group,groupCollapsed,groupEnd,info,log,timeStamp,profile,profileEnd,time,timeEnd,trace,warn".split(","),a;a=d.pop();){b[a]=b[a]||c}})((function(){try
{console.log();return window.console;}catch(err){return window.console={};}})());

// Offset Left
// getBoundingClientRect technique from John Resig http://ejohn.org/blog/getboundingclientrect-is-awesome/
if ("getBoundingClientRect" in document.documentElement) {
  _V_.findPosX = function(el) {
    var box;

    try {
      box = el.getBoundingClientRect();
    } catch(e) {}

    if (!box) { return 0; }

    var docEl = document.documentElement,
        body = document.body,
        clientLeft = docEl.clientLeft || body.clientLeft || 0,
        scrollLeft = window.pageXOffset || body.scrollLeft,
        left = box.left + scrollLeft - clientLeft;

    return left;
  };
} else {
  _V_.findPosX = function(el) {
    var curleft = el.offsetLeft;
    // _V_.log(obj.className, obj.offsetLeft)
    while(el = obj.offsetParent) {
      if (el.className.indexOf("video-js") == -1) {
        // _V_.log(el.offsetParent, "OFFSETLEFT", el.offsetLeft)
        // _V_.log("-webkit-full-screen", el.webkitMatchesSelector("-webkit-full-screen"));
        // _V_.log("-webkit-full-screen", el.querySelectorAll(".video-js:-webkit-full-screen"));
      } else {
      }
      curleft += el.offsetLeft;
    }
    return curleft;
  };
}
