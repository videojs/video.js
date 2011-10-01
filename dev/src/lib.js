_V_.merge = function(obj1, obj2, safe){
  for (var attrname in obj2){
    if (obj2.hasOwnProperty(attrname) && (!safe || !obj1.hasOwnProperty(attrname))) { obj1[attrname]=obj2[attrname]; }
  }
  return obj1;
};
_V_.extend = function(obj){ this.merge(this, obj, true); };

_V_.extend({
  tech: {}, // Holder for playback technology settings
  controlSets: {}, // Holder for control set definitions

  techSupports: function(tech, type, name){
    if (tech.supports[type]) {
      return tech.supports[type][name];
    }
    return false;
  },
  updateTechSupport: function(tech, type, name, value){
    if (!tech.supports[type]) { tech.supports[type] = {}; }
    tech.supports[type][name] = value;
  },
  
  html5Events: "loadstart,suspend,abort,error,emptied,stalled,loadedmetadata,loadeddata,canplay,canplaythrough,playing,waiting,seeking,seeked,ended,durationchange,timeupdate,progress,play,pause,ratechange,volumechange".split(","),

  // Device Checks
  isIE: function(){ return !+"\v1"; },
  isIPad: function(){ return navigator.userAgent.match(/iPad/i) !== null; },
  isIPhone: function(){ return navigator.userAgent.match(/iPhone/i) !== null; },
  isIOS: function(){ return VideoJS.isIPhone() || VideoJS.isIPad(); },
  iOSVersion: function() {
    var match = navigator.userAgent.match(/OS (\d+)_/i);
    if (match && match[1]) { return match[1]; }
  },
  isAndroid: function(){ return navigator.userAgent.match(/Android.*AppleWebKit/i) !== null; },
  androidVersion: function() {
    var match = navigator.userAgent.match(/Android (\d+)\./i);
    if (match && match[1]) { return match[1]; }
  },
  //isAndroidBrowser

  each: function(arr, fn){
    if (!arr || arr.length === 0) { return; }
    for (var i=0,j=arr.length; i<j; i++) {
      fn.call(this, arr[i], i);
    }
  },

  el: function(id){ return document.getElementById(id); },
  createElement: function(tagName, attributes){
    var el = document.createElement(tagName),
        attrname;
    for (attrname in attributes){
      if (attributes.hasOwnProperty(attrname)) {
        if (attrname.indexOf("-") !== -1) {
          el.setAttribute(attrname, attributes[attrname]);
        } else {
          el[attrname] = attributes[attrname];
        }
      }
    }
    return el;
  },
  insertFirst: function(node, parent){
    if (parent.firstChild) {
      parent.insertBefore(parent.firstChild, node);
    } else {
      parent.appendChild(node);
    }
  },
  addClass: function(element, classToAdd){
    if ((" "+element.className+" ").indexOf(" "+classToAdd+" ") == -1) {
      element.className = element.className === "" ? classToAdd : element.className + " " + classToAdd;
    }
  },
  removeClass: function(element, classToRemove){
    if (element.className.indexOf(classToRemove) == -1) { return; }
    var classNames = element.className.split(" ");
    classNames.splice(classNames.indexOf(classToRemove),1);
    element.className = classNames.join(" ");
  },
  
  remove: function(item, array){
    if (!array) return;
    var i = array.indexOf(item);
    if (i != -1) { 
      return array.splice(i, 1)
    };
  },

  // Attempt to block the ability to select text while dragging controls
  blockTextSelection: function(){
    document.body.focus();
    document.onselectstart = function () { return false; };
  },
  // Turn off text selection blocking
  unblockTextSelection: function(){ document.onselectstart = function () { return true; }; },

  // Return seconds as H:MM:SS or M:SS
  // Supplying a guide (in seconds) will include enough leading zeros to cover the length of the guide
  formatTime: function(seconds, guide) {
    var guide = guide || seconds, // Default to using seconds as guide
        s = Math.floor(seconds % 60),
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
  },

  // Return the relative horizonal position of an event as a value from 0-1
  getRelativePosition: function(x, relativeElement){
    return Math.max(0, Math.min(1, (x - _V_.findPosX(relativeElement)) / relativeElement.offsetWidth));
  },
  // Get an objects position on the page
  findPosX: function(obj) {
    var curleft = obj.offsetLeft;
    while(obj = obj.offsetParent) {
      curleft += obj.offsetLeft;
    }
    return curleft;
  },
  getComputedStyleValue: function(element, style){
    return window.getComputedStyle(element, null).getPropertyValue(style);
  },

  trim: function(string){ return string.toString().replace(/^\s+/, "").replace(/\s+$/, ""); },
  round: function(num, dec) {
    if (!dec) { dec = 0; }
    return Math.round(num*Math.pow(10,dec))/Math.pow(10,dec);
  },

  isEmpty: function(object) {
    for (var prop in object) {
      return false;
    }
    return true;
  },

  // Mimic HTML5 TimeRange Spec.
  createTimeRange: function(start, end){
    return {
      length: 1,
      start: function() { return start; },
      end: function() { return end; }
    };
  },

  /* Element Data Store. Allows for binding data to an element without putting it directly on the element.
     Ex. Event listneres are stored here.
     (also from jsninja.com)
  ================================================================================ */
  cache: {}, // Where the data is stored
  guid: 1, // Unique ID for the element
  expando: "vdata" + (new Date).getTime(), // Unique attribute to store element's guid in

  // Returns the cache object where data for the element is stored
  getData: function(elem){
    var id = elem[_V_.expando];
    if (!id) {
      id = elem[_V_.expando] = _V_.guid++;
      _V_.cache[id] = {};
    }
    return _V_.cache[id];
  },
  // Delete data for the element from the cache and the guid attr from element
  removeData: function(elem){
    var id = elem[_V_.expando];
    if (!id) { return; }
    // Remove all stored data
    delete _V_.cache[id];
    // Remove the expando property from the DOM node
    try {
      delete elem[_V_.expando];
    } catch(e) {
      if (elem.removeAttribute) {
        elem.removeAttribute(_V_.expando);
      } else {
        // IE doesn't appear to support removeAttribute on the document element
        elem[_V_.expando] = null;
      }
    }
  },

  /* Proxy (a.k.a Bind or Context). A simple method for changing the context of a function
     It also stores a unique id on the function so it can be easily removed from events
  ================================================================================ */
  proxy: function(context, fn) {
    // Make sure the function has a unique ID
    if (!fn.guid) { fn.guid = _V_.guid++; }
    // Create the new function that changes the context
    var ret = function() {
      return fn.apply(context, arguments);
    };

    // Give the new function the same ID
    // (so that they are equivalent and can be easily removed)
    ret.guid = fn.guid;

    return ret;
  },

  get: function(url, onSuccess, onError){
    // if (netscape.security.PrivilegeManager.enablePrivilege) {
    //   netscape.security.PrivilegeManager.enablePrivilege("UniversalBrowserRead");
    // }

    var local = (url.indexOf("file:") == 0 || (window.location.href.indexOf("file:") == 0 && url.indexOf("http:") == -1));

    if (typeof XMLHttpRequest == "undefined") {
      XMLHttpRequest = function () {
        try { return new ActiveXObject("Msxml2.XMLHTTP.6.0"); } catch (e) {}
        try { return new ActiveXObject("Msxml2.XMLHTTP.3.0"); } catch (f) {}
        try { return new ActiveXObject("Msxml2.XMLHTTP"); } catch (g) {}
        throw new Error("This browser does not support XMLHttpRequest.");
      };
    }

    var request = new XMLHttpRequest();

    try {
      request.open("GET", url);
    } catch(e) {
      _V_.log(e);
      // onError(e);
      return false;
    }

    request.onreadystatechange = _V_.proxy(this, function() {
      if (request.readyState == 4) {
        if (request.status == 200 || local && request.status == 0) {
          onSuccess(request.responseText);
        } else {
          onError();
        }
      }
    });

    try {
      request.send();
    } catch(e) {
      _V_.log(e);
      onError(e);
    }
  }

});

// /* Function Context Allows for binding context to functions when using in event listeners
// ================================================================================ */
// Function.prototype.context = function(obj){
//   var method = this,
//   temp = function(){
//     return method.apply(obj, arguments);
//   };
//   return temp;
// };
