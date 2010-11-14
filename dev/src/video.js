/*
VideoJS - HTML5 Video Player
v1.2.0

This file is part of VideoJS. Copyright 2010 Zencoder, Inc.

VideoJS is free software: you can redistribute it and/or modify
it under the terms of the GNU Lesser General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

VideoJS is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Lesser General Public License for more details.

You should have received a copy of the GNU Lesser General Public License
along with VideoJS.  If not, see <http://www.gnu.org/licenses/>.
*/

// Using jresig's Class implementation http://ejohn.org/blog/simple-javascript-inheritance/
(function(){var initializing=false, fnTest=/xyz/.test(function(){xyz;}) ? /\b_super\b/ : /.*/; this.JRClass = function(){}; JRClass.extend = function(prop) { var _super = this.prototype; initializing = true; var prototype = new this(); initializing = false; for (var name in prop) { prototype[name] = typeof prop[name] == "function" && typeof _super[name] == "function" && fnTest.test(prop[name]) ? (function(name, fn){ return function() { var tmp = this._super; this._super = _super[name]; var ret = fn.apply(this, arguments); this._super = tmp; return ret; }; })(name, prop[name]) : prop[name]; } function JRClass() { if ( !initializing && this.init ) this.init.apply(this, arguments); } JRClass.prototype = prototype; JRClass.constructor = JRClass; JRClass.extend = arguments.callee; return JRClass;};})();

// Self-executing function to prevent global vars and help with minification
(function(window, undefined){
  var document = window.document;

// Video JS Player Class
var VideoJS = _V_ = JRClass.extend({

  // Initialize the player for the supplied video tag element
  // element: video tag
  init: function(element, setOptions){

    // Allow an ID string or an element
    if (typeof element == 'string') {
      this.video = document.getElementById(element);
    } else {
      this.video = element;
    }
    // Store reference to player on the video element.
    // So you can acess the player later: document.getElementById("video_id").player.play();
    this.video.player = this;

    // Default Options
    this.options = {
      controlsBelow: false, // Display control bar below video vs. in front of
      showControlsAtStart: false, // Make controls visible when page loads
      controlsHiding: true, // Hide controls when not over the video
      defaultVolume: 0.85, // Will be overridden by localStorage volume if available
      flashVersion: 9, // Required flash version for fallback
      flashIsDominant: false, // Always use Flash when available
      useBuiltInControls: false, // Dont' use the video JS controls (iPhone)
      playerFallbackOrder: ["html5", "flash", "links"] // Players and order to use them
    };
    // Override default options with global options
    if (typeof VideoJS.options == "object") { _V_.merge(this.options, VideoJS.options); }
    // Override default & global options with options specific to this player
    if (typeof setOptions == "object") { _V_.merge(this.options, setOptions); }

    // Store reference to embed code pieces
    this.box = this.video.parentNode;
    this.linksFallback = this.getLinksFallback();
    this.hideLinksFallback(); // Will be shown again if "links" player is used

    // Make Flash first player in line
    if (this.options.flashIsDominant) { this.options.playerFallbackOrder.unshift("flash") }

    // Loop through the player names list in options, "html5" etc.
    // For each player name, initialize the player with that name under VideoJS.players
    // If the player successfully initializes, we're done
    // If not, try the next player in the list
    this.each(this.options.playerFallbackOrder, function(playerType){
      if (!this[playerType+"Supported"]) { return false; }
      if (this[playerType+"Supported"]()) {
        this[playerType+"Init"]();
        return true;
      }
    });
  },
  /* Behaviors
  ================================================================================ */
  behaviors: {},
  elements: {},
  newBehavior: function(name, activate, functions){
    this.behaviors[name] = activate;
    this.extend(functions);
  },
  activateElement: function(element, behavior){
    this.behaviors[behavior].call(this, element);
  },
  /* Errors/Warnings
  ================================================================================ */
  errors: [], // Array to track errors
  warnings: [],
  warning: function(warning){
    this.warnings.push(warning);
    this.log(warning);
  },
  /* History of errors/events (not quite there yet)
  ================================================================================ */
  history: [],
  log: function(event){
    if (!event) { return; }
    if (typeof event == "string") { event = { type: event }; }
    if (event.type) { this.history.push(event.type); }
    if (this.history.length >= 50) { this.history.shift(); }
    try { console.log(event.type); } catch(e) { try { opera.postError(event.type); } catch(e){} }
  },
  /* Local Storage
  ================================================================================ */
  setLocalStorage: function(key, value){
    try { localStorage[key] = value; }
    catch(e) {
      if (e.code == 22 || e.code == 1014) { // Webkit == 22 / Firefox == 1014
        this.warning(VideoJS.warnings.localStorageFull);
      }
    }
  },

  /* Player API - Translate functionality from player to video
  ================================================================================ */
  values: {}, // Storage for setters and getters of the same name.
  play: function(){ 
    this.video.play(); 
    return this;
  },
  pause: function(){ 
    this.video.pause(); 
    return this;
  },
  currentTime: function(seconds){
    if (seconds !== undefined) { 
      this.video.currentTime = seconds;
      this.values.currentTime = seconds;
      this.onCurrentTimeUpdate();
    } else {
      this.values.currentTime = this.video.currentTime
    }
    // Allow for smoother scrubbing by repoting back stored value
    return this.values.currentTime;
  },
  duration: function(){
    return this.video.duration;
  },
  playProgress: function(percentAsDecimal){
    if (percentAsDecimal !== undefined) { 
      this.values.playProgress = percentAsDecimal; 
      this.onPlayProgressUpdate();
    }
    if (this.values.playProgress == undefined) { this.values.playProgress = 0; }
    return this.values.playProgress;
  },
  loaded: function(percentAsDecimal){
    if (percentAsDecimal !== undefined && percentAsDecimal > this.values.loaded) {
      this.values.loaded = percentAsDecimal
      this.updateLoadProgress();
    }
    if (this.values.loaded == undefined) { this.values.loaded = 0; }
    return this.values.loaded;
  },
  volume: function(percentAsDecimal){
    if (percentAsDecimal !== undefined) {
      this.values.volume = parseFloat(percentAsDecimal);
      this.video.volume = this.values.volume;
      this.setLocalStorage("volume", this.video.volume);
    }
    if (this.values.volume) { return this.values.volume; }
    return this.video.volume;
  },
  width: function(width){
    if (width !== undefined) {
      this.video.width = width;
      this.box.width = width;
      this.positionPoster();
      this.positionControlBars();
    }
    return this.video.width;
  },
  height: function(height){
    if (height !== undefined) {
      this.video.height = height;
      this.box.height = height;
      this.positionPoster();
      this.positionControlBars();
    }
    return this.video.height;
  },

  /* Helpers
  ================================================================================ */
  // Each that maintains player as context
  // Break if true is returned
  each: function(arr, fn){
    for (var i=0,j=arr.length; i<j; i++) { 
      if (fn.call(this, arr[i], i)) { break; }
    }
  },

  extend: function(obj){
    for (var attrname in obj) {
      if (obj.hasOwnProperty(attrname)) { this[attrname]=obj[attrname]; }
    }
  }
});
VideoJS.player = VideoJS.prototype;

////////////////////////////////////////////////////////////////////////////////
// Player Types
////////////////////////////////////////////////////////////////////////////////

/* Flash Object Fallback
================================================================================ */
VideoJS.player.extend({
  flashSupported: function(){
    if (!this.flashObject) { this.flashObject = this.getFlashObject(); }
    // Check if object exists & Flash Player version is supported
    if (this.flashObject && this.flashVersionSupported()) {
      return true;
    } else {
      return false;
    }
  },
  flashInit: function(){
    this.replaceWithFlash();
    this.video.src = ""; // Stop video from downloading if HTML5 is still supported
  },
  // Get Flash Fallback object element from Embed Code
  getFlashObject: function(){
    var objects = this.video.getElementsByTagName("OBJECT");
    for (var i=0,j=objects.length; i<j; i++) {
      if (objects[i].className == "vjs-flash-fallback") {
        return  objects[i];
      }
    }
  },
  // Used to force a browser to fall back when it's an HTML5 browser but there's no supported sources
  replaceWithFlash: function(){
    // this.flashObject = this.video.removeChild(this.flashObject);
    if (this.flashObject) {
      this.box.insertBefore(this.flashObject, this.video);
      this.video.style.display = "none"; // Removing it was breaking later players
    }
  },
  // Check if browser can use this flash player
  flashVersionSupported: function(){ 
    return VideoJS.getFlashVersion() >= this.options.flashVersion; 
  }
});

/* Download Links Fallback
================================================================================ */
VideoJS.player.extend({
  linksSupported: function(){ return true; },
  linksInit: function(){ this.showLinksFallback(); },
  // Get the download links block element
  getLinksFallback: function(){ return this.box.getElementsByTagName("P")[0]; },
  // Hide no-video download paragraph
  hideLinksFallback: function(){
    if (this.linksFallback) { this.linksFallback.style.display = "none"; }
  },
  // Hide no-video download paragraph
  showLinksFallback: function(){
    if (this.linksFallback) { this.linksFallback.style.display = "block"; }
  }
});

////////////////////////////////////////////////////////////////////////////////
// Class Methods
// Functions that don't apply to individual videos.
////////////////////////////////////////////////////////////////////////////////

// Combine Objects - Use "safe" to protect from overwriting existing items
VideoJS.merge = function(obj1, obj2, safe){
  for (var attrname in obj2){
    if (obj2.hasOwnProperty(attrname) && (!safe || !obj1.hasOwnProperty(attrname))) { obj1[attrname]=obj2[attrname]; }
  }
  return obj1;
};
VideoJS.extend = function(obj){ this.merge(this, obj, true); }

VideoJS.extend({
  // Add VideoJS to all video tags with the video-js class when the DOM is ready
  setupAllWhenReady: function(options){
    // Options is stored globally, and added ot any new player on init
    VideoJS.options = options;
    VideoJS.DOMReady(VideoJS.setup);
  },

  // Run the supplied function when the DOM is ready
  DOMReady: function(fn){
    VideoJS.addToDOMReady(fn);
  },

  // Set up a specific video or array of video elements
  // "video" can be:
  //    false, undefined, or "All": set up all videos with the video-js class
  //    A video tag ID or video tag element: set up one video and return one player
  //    An array of video tag elements/IDs: set up each and return an array of players
  setup: function(videos, options){

    var returnSingular = false,
    playerList = [],
    videoElement;

    // If videos is undefined or "All", set up all videos with the video-js class
    if (!videos || videos == "All") {
      videos = VideoJS.getVideoJSTags();
    // If videos is not an array, add to an array
    } else if (typeof videos != 'object' || videos.nodeType == 1) {
      videos = [videos];
      returnSingular = true;
    }

    // Loop through videos and create players for them
    for (var i=0; i<videos.length; i++) {
      if (typeof videos[i] == 'string') {
        videoElement = document.getElementById(videos[i]);
      } else { // assume DOM object
        videoElement = videos[i];
      }
      playerList.push(new VideoJS(videoElement, options));
    }

    // Return one or all depending on what was passed in
    return (returnSingular) ? playerList[0] : playerList;
  },

  // Find video tags with the video-js class
  getVideoJSTags: function() {
    var videoTags = document.getElementsByTagName("video"),
    videoJSTags = [], videoTag;

    for (var i=0,j=videoTags.length; i<j; i++) {
      videoTag = videoTags[i];
      if (videoTag.className.indexOf("video-js") != -1) {
        videoJSTags.push(videoTag);
      }
    }
    return videoJSTags;
  },

  // Check if the browser supports video.
  browserSupportsVideo: function() {
    if (typeof VideoJS.videoSupport != "undefined") { return VideoJS.videoSupport; }
    VideoJS.videoSupport = !!document.createElement('video').canPlayType;
    return VideoJS.videoSupport;
  },

  getFlashVersion: function(){
    // Cache Version
    if (typeof VideoJS.flashVersion != "undefined") { return VideoJS.flashVersion; }
    var version = 0, desc;
    if (typeof navigator.plugins != "undefined" && typeof navigator.plugins["Shockwave Flash"] == "object") {
      desc = navigator.plugins["Shockwave Flash"].description;
      if (desc && !(typeof navigator.mimeTypes != "undefined" && navigator.mimeTypes["application/x-shockwave-flash"] && !navigator.mimeTypes["application/x-shockwave-flash"].enabledPlugin)) {
        version = parseInt(desc.match(/^.*\s+([^\s]+)\.[^\s]+\s+[^\s]+$/)[1], 10);
      }
    } else if (typeof window.ActiveXObject != "undefined") {
      try {
        var testObject = new ActiveXObject("ShockwaveFlash.ShockwaveFlash");
        if (testObject) {
          version = parseInt(testObject.GetVariable("$version").match(/^[^\s]+\s(\d+)/)[1], 10);
        }
      }
      catch(e) {}
    }
    VideoJS.flashVersion = version;
    return VideoJS.flashVersion;
  },

  // Browser & Device Checks
  isIE: function(){ return !+"\v1"; },
  isIPad: function(){ return navigator.userAgent.match(/iPad/i) !== null; },
  isIPhone: function(){ return navigator.userAgent.match(/iPhone/i) !== null; },
  isIOS: function(){ return VideoJS.isIPhone() || VideoJS.isIPad(); },
  iOSVersion: function() {
    var match = navigator.userAgent.match(/OS (\d+)_/i);
    if (match && match[1]) { return match[1]; }
  },
  isAndroid: function(){ return navigator.userAgent.match(/Android/i) !== null; },
  androidVersion: function() {
    var match = navigator.userAgent.match(/Android (\d+)\./i);
    if (match && match[1]) { return match[1]; }
  },

  warnings: {
    // Safari errors if you call functions on a video that hasn't loaded yet
    videoNotReady: "Video is not ready yet (try playing the video first).",
    // Getting a QUOTA_EXCEEDED_ERR when setting local storage occasionally
    localStorageFull: "Local Storage is Full"
  }
});

////////////////////////////////////////////////////////////////////////////////
// Convenience Functions (mini library)
// Functions not specific to video or VideoJS and could probably be replaced with a library like jQuery
////////////////////////////////////////////////////////////////////////////////

VideoJS.extend({

  addClass: function(element, classToAdd){
    if (element.className.split(/\s+/).lastIndexOf(classToAdd) == -1) { element.className = element.className === "" ? classToAdd : element.className + " " + classToAdd; }
  },
  removeClass: function(element, classToRemove){
    if (element.className.indexOf(classToRemove) == -1) { return; }
    var classNames = element.className.split(/\s+/);
    classNames.splice(classNames.lastIndexOf(classToRemove),1);
    element.className = classNames.join(" ");
  },
  createElement: function(tagName, attributes){
    return this.merge(document.createElement(tagName), attributes);
  },

  // Attempt to block the ability to select text while dragging controls
  blockTextSelection: function(){
    document.body.focus();
    document.onselectstart = function () { return false; };
  },
  // Turn off text selection blocking
  unblockTextSelection: function(){ document.onselectstart = function () { return true; }; },

  // Return seconds as MM:SS
  formatTime: function(secs) {
    var seconds = Math.round(secs);
    var minutes = Math.floor(seconds / 60);
    minutes = (minutes >= 10) ? minutes : "0" + minutes;
    seconds = Math.floor(seconds % 60);
    seconds = (seconds >= 10) ? seconds : "0" + seconds;
    return minutes + ":" + seconds;
  },

  // Return the relative horizonal position of an event as a value from 0-1
  getRelativePosition: function(x, relativeElement){
    return Math.max(0, Math.min(1, (x - this.findPosX(relativeElement)) / relativeElement.offsetWidth));
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

  round: function(num, dec) {
    if (!dec) { dec = 0; }
    return Math.round(num*Math.pow(10,dec))/Math.pow(10,dec);
  },

  get: function(url, onSuccess){
    if (typeof XMLHttpRequest == "undefined") {
      XMLHttpRequest = function () {
        try { return new ActiveXObject("Msxml2.XMLHTTP.6.0"); } catch (e) {}
        try { return new ActiveXObject("Msxml2.XMLHTTP.3.0"); } catch (f) {}
        try { return new ActiveXObject("Msxml2.XMLHTTP"); } catch (g) {}
        //Microsoft.XMLHTTP points to Msxml2.XMLHTTP.3.0 and is redundant
        throw new Error("This browser does not support XMLHttpRequest.");
      };
    }
    var request = new XMLHttpRequest();
    request.open("GET",url);
    request.onreadystatechange = function() {
      if (request.readyState == 4 && request.status == 200) {
        onSuccess(request.responseText);
      }
    }.context(this);
    request.send();
  },

  // DOM Ready functionality adapted from jQuery. http://jquery.com/
  bindDOMReady: function(){
    if (document.readyState === "complete") {
      return VideoJS.onDOMReady();
    }
    if (document.addEventListener) {
      document.addEventListener("DOMContentLoaded", VideoJS.DOMContentLoaded, false);
      window.addEventListener("load", VideoJS.onDOMReady, false);
    } else if (document.attachEvent) {
      document.attachEvent("onreadystatechange", VideoJS.DOMContentLoaded);
      window.attachEvent("onload", VideoJS.onDOMReady);
    }
  },

  DOMContentLoaded: function(){
    if (document.addEventListener) {
      document.removeEventListener( "DOMContentLoaded", VideoJS.DOMContentLoaded, false);
      VideoJS.onDOMReady();
    } else if ( document.attachEvent ) {
      if ( document.readyState === "complete" ) {
        document.detachEvent("onreadystatechange", VideoJS.DOMContentLoaded);
        VideoJS.onDOMReady();
      }
    }
  },

  // Functions to be run once the DOM is loaded
  DOMReadyList: [],
  addToDOMReady: function(fn){
    if (VideoJS.DOMIsReady) {
      fn.call(document);
    } else {
      VideoJS.DOMReadyList.push(fn);
    }
  },

  DOMIsReady: false,
  onDOMReady: function(){
    if (VideoJS.DOMIsReady) { return; }
    if (!document.body) { return setTimeout(VideoJS.onDOMReady, 13); }
    VideoJS.DOMIsReady = true;
    if (VideoJS.DOMReadyList) {
      for (var i=0; i<VideoJS.DOMReadyList.length; i++) {
        VideoJS.DOMReadyList[i].call(document);
      }
      VideoJS.DOMReadyList = null;
    }
  }
});
VideoJS.bindDOMReady();

// Allows for binding context to functions
// when using in event listeners and timeouts
Function.prototype.context = function(obj){
  var method = this,
  temp = function(){
    return method.apply(obj, arguments);
  };
  return temp;
};

// Like context, in that it creates a closure
// But insteaad keep "this" intact, and passes the var as the second argument of the function
// Need for event listeners where you need to know what called the event
Function.prototype.evtContext = function(obj){
  var method = this,
  temp = function(){
    var origContext = this;
    return method.call(obj, arguments[0], origContext);
  };
  return temp;
};

// Removeable Event listener with Context
// Replaces the original function with a version that has context
// So it can be removed using the original function name.
// I have a feeling this one is gonna bite me in the butt some day
Function.prototype.rEvtContext = function(obj, funcParent){
  if (this.hasContext == true) { return this; }
  if (!funcParent) { funcParent = obj; }
  for (var attrname in funcParent) {
    if (funcParent[attrname] == this) {
      funcParent[attrname] = this.evtContext(obj);
      funcParent[attrname].hasContext = true;
      return funcParent[attrname];
    }
  }
  // Log function not found on object
};

// Shim to make Video tag valid in IE
if(VideoJS.isIE()) { document.createElement("video"); }

// jQuery Plugin
if (window.jQuery) {
  (function($) {
    $.fn.VideoJS = function(options) {
      this.each(function() {
        VideoJS.setup(this, options);
      });
      return this;
    };
    $.fn.player = function() {
      return this[0].player;
    };
  })(jQuery);
}

// Expose to global
return (window.VideoJS = window._V_ = VideoJS);

// End self-executing function
})(window);
