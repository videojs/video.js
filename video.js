/*
VideoJS - HTML5 Video Player
v2.0.2

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

// Self-executing function to prevent global vars and help with minification
(function(window, undefined){
  var document = window.document;

// Using jresig's Class implementation http://ejohn.org/blog/simple-javascript-inheritance/
(function(){var initializing=false, fnTest=/xyz/.test(function(){xyz;}) ? /\b_super\b/ : /.*/; this.JRClass = function(){}; JRClass.extend = function(prop) { var _super = this.prototype; initializing = true; var prototype = new this(); initializing = false; for (var name in prop) { prototype[name] = typeof prop[name] == "function" && typeof _super[name] == "function" && fnTest.test(prop[name]) ? (function(name, fn){ return function() { var tmp = this._super; this._super = _super[name]; var ret = fn.apply(this, arguments); this._super = tmp; return ret; }; })(name, prop[name]) : prop[name]; } function JRClass() { if ( !initializing && this.init ) this.init.apply(this, arguments); } JRClass.prototype = prototype; JRClass.constructor = JRClass; JRClass.extend = arguments.callee; return JRClass;};})();

// Video JS Player Class
var VideoJS = JRClass.extend({

  // Initialize the player for the supplied video tag element
  // element: video tag
  init: function(element, setOptions){

    // Allow an ID string or an element
    if (typeof element == 'string') {
      this.video = document.getElementById(element);
    } else {
      this.video = element;
    }

    this.video.player = this; // Store reference to player on the video element.
    this.box = this.video.parentNode; // Container element for controls positioning
    this.values = {}; // Cache video values.
    this.elements = {}; // Store refs to controls elements.
    this.listeners = {}; // Store video event listeners.
    this.api = {}; // Current API to video functions (changes with player type)

    // Hide Links. Will be shown again if "links" player is used
    this.linksFallback = this.getLinksFallback();
    this.hideLinksFallback();

    // Default Options
    this.options = {
      autoplay: false,
      preload: true,
      loop: false,
      returnToStart: true,
      controlsEnabled: true,
      useBuiltInControls: false, // Use the browser's controls (iPhone)
      controlsBelow: false, // Display control bar below video vs. in front of
      controlsAtStart: false, // Make controls visible when page loads
      controlsHiding: true, // Hide controls when not over the video
      defaultVolume: 0.85, // Will be overridden by localStorage volume if available
      playerFallbackOrder: ["html5", "flash", "links"], // Players and order to use them
      flashPlayer: "htmlObject",
      flashPlayerVersion: false // Required flash version for fallback
    };
    // Override default options with global options
    if (typeof VideoJS.options == "object") { _V_.merge(this.options, VideoJS.options); }
    // Override default & global options with options specific to this player
    if (typeof setOptions == "object") { _V_.merge(this.options, setOptions); }
    // Override preload & autoplay with video attributes
    if (this.getPreloadAttribute() !== undefined) { this.options.preload = this.getPreloadAttribute(); }
    if (this.getAutoplayAttribute() !== undefined) { this.options.autoplay = this.getAutoplayAttribute(); }

    // Loop through the player names list in options, "html5" etc.
    // For each player name, initialize the player with that name under VideoJS.players
    // If the player successfully initializes, we're done
    // If not, try the next player in the list
    this.each(this.options.playerFallbackOrder, function(playerType){
      if (this[playerType+"Supported"]()) { // Check if player type is supported
        this[playerType+"Init"](); // Initialize player type
        return true; // Stop looping through players
      }
    });

    // Start Global Listeners - API doesn't exist before now
    this.activateElement(this, "player");
    this.activateElement(this.box, "box");
  },
  /* Behaviors
  ================================================================================ */
  behaviors: {},
  newBehavior: function(name, activate, functions){
    this.behaviors[name] = activate;
    this.extend(functions);
  },
  activateElement: function(element, behavior){
    // Allow passing and ID string
    if (typeof element == "string") { element = document.getElementById(element); }
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
    if (!localStorage) { return; }
    try {
      localStorage[key] = value;
    } catch(e) {
      if (e.code == 22 || e.code == 1014) { // Webkit == 22 / Firefox == 1014
        this.warning(VideoJS.warnings.localStorageFull);
      }
    }
  },
  /* Helpers
  ================================================================================ */
  getPreloadAttribute: function(){
    if (typeof this.video.hasAttribute == "function" && this.video.hasAttribute("preload")) {
      var preload = this.video.getAttribute("preload");
      // Only included the attribute, thinking it was boolean
      if (preload === "" || preload === "true") { return "auto"; }
      if (preload === "false") { return "none"; }
      return preload;
    }
  },
  getAutoplayAttribute: function(){
    if (typeof this.video.hasAttribute == "function" && this.video.hasAttribute("autoplay")) {
      var autoplay = this.video.getAttribute("autoplay");
      if (autoplay === "false") { return false; }
      return true;
    }
  },
  // Each that maintains player as context
  // Break if true is returned
  each: function(arr, fn){
    if (!arr || arr.length === 0) { return; }
    for (var i=0,j=arr.length; i<j; i++) {
      if (fn.call(this, arr[i], i)) { break; }
    }
  },
  // Add functions to the player
  extend: function(obj){
    for (var attrname in obj) {
      if (obj.hasOwnProperty(attrname)) { this[attrname]=obj[attrname]; }
    }
  }
});
VideoJS.fn = VideoJS.prototype;
VideoJS.options = {}; // Globally set options

/* Download Links Fallback (Player Type)
================================================================================ */
VideoJS.fn.extend({
  linksSupported: function(){ return true; },
  linksInit: function(){
    this.showLinksFallback();
    this.element = this.video;
  },
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
VideoJS.extend = function(obj){ this.merge(this, obj, true); };

VideoJS.extend({
  // Add VideoJS to all video tags with the video-js class when the DOM is ready
  setupAll: function(options, fn){
    // Options is stored globally, and added ot any new player on init
    VideoJS.options = options;
    VideoJS.DOMReady(VideoJS.setup);
    if (fn) { VideoJS.DOMReady(fn); }
  },
  
  // Backward compatability. Changed to just SetupAll
  setupAllWhenReady: function(options){ VideoJS.setupAll(options); },

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
  isAndroid: function(){ return navigator.userAgent.match(/Android.*AppleWebKit/i) !== null; },
  androidVersion: function() {
    var match = navigator.userAgent.match(/Android (\d+)\./i);
    if (match && match[1]) { return match[1]; }
  },
  //isAndroidBrowser

  warnings: {
    // Safari errors if you call functions on a video that hasn't loaded yet
    videoNotReady: "Video is not ready yet (try playing the video first).",
    // Getting a QUOTA_EXCEEDED_ERR when setting local storage occasionally
    localStorageFull: "Local Storage is Full"
  }
});

// Shim to make Video tag valid in IE
if(VideoJS.isIE()) { document.createElement("video"); }

// Expose to global
window.VideoJS = window._V_ = VideoJS;

/* Player API
================================================================================ */
VideoJS.fn.extend({

  /* Listener types: play, pause, timeupdate, bufferedupdate, ended, volumechange, error */
  addListener: function(type, fn){
    if (!this.listeners[type]) { this.listeners[type] = []; }
    this.listeners[type].push(fn);
  },

  triggerListeners: function(type, e){
    this.each(this.listeners[type], function(listener){
      listener.call(this, e);
    });
  },

  removeListener: function(type, fn){
    var listeners = this.listeners[type];
    if (!listeners) { return; }
    for (var i=0; i<listeners.length; i++) {
      if (listeners[i] == fn) {
        listeners.splice(i--, 1);
      }
    }
  },

  play: function(){ this.api.play.apply(this); return this; },
  pause: function(){ this.api.pause.apply(this); return this; },
  paused: function(){ return this.api.paused.apply(this); },

  currentTime: function(seconds){
    if (seconds !== undefined) {
      this.values.currentTime = seconds; // Cache the last set value for smoother scrubbing.
      this.api.setCurrentTime.call(this, seconds);
      return this;
    }
    return this.api.currentTime.apply(this);
  },

  duration: function(){ return this.api.duration.apply(this); },

  buffered: function(){
    var buffered = this.api.buffered.apply(this),
        start = 0, end = this.values.bufferEnd = this.values.bufferEnd || 0,
        timeRange;

    if (buffered && buffered.length > 0 && buffered.end(0) > end) {
      end = buffered.end(0);
      // Storing values allows them be overridden by setBufferedFromProgress
      this.values.bufferEnd = end;
    }

    return this.createTimeRange(start, end);
  },
  // Mimic HTML5 TimeRange Spec.
  createTimeRange: function(start, end){
    return {
      length: 1,
      start: function() { return start; },
      end: function() { return end; }
    };
  },
  // Calculates amount of buffer is full
  bufferedPercent: function(){ return (this.duration()) ? this.buffered().end(0) / this.duration() : 0; },

  volume: function(percentAsDecimal){
    if (percentAsDecimal !== undefined) {
      var vol = Math.max(0, Math.min(1, parseFloat(percentAsDecimal))); // Force value to between 0 and 1
      this.values.volume = vol;
      this.api.setVolume.call(this, vol);
      this.setLocalStorage("volume", vol);
      return this;
    }
    // if (this.values.volume) { return this.values.volume; }
    return this.api.volume.call(this);
  },

  width: function(width, skipListeners){
    if (width !== undefined) {
      this.element.width = width; // Not using style so it can be overridden on fullscreen.
      this.box.style.width = width+"px";
      if (!skipListeners) { this.triggerListeners("resize"); }
      return this;
    }
    return parseInt(this.element.getAttribute("width"));
    // return this.element.offsetWidth;
  },
  height: function(height){
    if (height !== undefined) {
      this.element.height = height;
      this.box.style.height = height+"px";
      this.triggerListeners("resize");
      return this;
    }
    return parseInt(this.element.getAttribute("height"));
    // return this.element.offsetHeight;
  },
  size: function(width, height){
    // Skip resize listeners on width for optimization
    return this.width(width, true).height(height);
  },

  supportsFullScreen: function(){ return this.api.supportsFullScreen.call(this); },

  // Turn on fullscreen (or window) mode
  enterFullScreen: function(){
    if (this.supportsFullScreen()) {
      this.api.enterFullScreen.call(this);
    } else {
      this.enterFullWindow();
    }
    this.triggerListeners("enterFullScreen");
    return this;
  },

  exitFullScreen: function(){
    if (!this.supportsFullScreen()) {
      this.exitFullWindow();
    }
    this.triggerListeners("exitFullScreen");
    // Otherwise Shouldn't be called since native fullscreen uses own controls.
    return this;
  },

  enterFullWindow: function(){
    this.videoIsFullScreen = true;
    // Storing original doc overflow value to return to when fullscreen is off
    this.docOrigOverflow = document.documentElement.style.overflow;
    // Add listener for esc key to exit fullscreen
    _V_.addListener(document, "keydown", this.fullscreenOnEscKey.rEvtContext(this));
    // Add listener for a window resize
    _V_.addListener(window, "resize", this.fullscreenOnWindowResize.rEvtContext(this));
    // Hide any scroll bars
    document.documentElement.style.overflow = 'hidden';
    // Apply fullscreen styles
    _V_.addClass(this.box, "vjs-fullscreen");
    // Resize the box, controller, and poster
    this.positionAll();
    this.triggerListeners("enterFullWindow");
  },

  exitFullWindow: function(){
    this.videoIsFullScreen = false;
    document.removeEventListener("keydown", this.fullscreenOnEscKey, false);
    window.removeEventListener("resize", this.fullscreenOnWindowResize, false);
    // Unhide scroll bars.
    document.documentElement.style.overflow = this.docOrigOverflow;
    // Remove fullscreen styles
    _V_.removeClass(this.box, "vjs-fullscreen");
    // Resize the box, controller, and poster to original sizes
    this.positionAll();
    this.triggerListeners("exitFullWindow");
  },

  src: function(src){
    this.api.src.call(this, src);
    return this;
  }
});/* HTML5 Player Type
================================================================================ */
VideoJS.fn.extend({

  html5Supported: function(){
    if (VideoJS.browserSupportsVideo() && this.canPlaySource()) {
      return true;
    } else {
      return false;
    }
  },

  html5Init: function(){
    this.element = this.video;
    this.api = this.html5API;
    this.api.setupTriggers.call(this);

    this.fixPreloading(); // Support old browsers that used autobuffer
    this.supportProgressEvents(); // Support browsers that don't use 'buffered'

    // Set to stored volume OR 85%
    this.volume((localStorage && localStorage.volume) || this.options.defaultVolume);

    // Update interface for device needs
    if (VideoJS.isIOS()) {
      this.options.useBuiltInControls = true;
      this.iOSInterface();
    } else if (VideoJS.isAndroid()) {
      this.options.useBuiltInControls = true;
      this.androidInterface();
    }

    // Add VideoJS Controls
    if (!this.options.useBuiltInControls) {
      this.video.controls = false;

      if (this.options.controlsBelow) { _V_.addClass(this.box, "vjs-controls-below"); }

      // Make a click on th video act as a play button
      this.activateElement(this.video, "playToggle");

      // Build Interface
      this.buildStylesCheckDiv(); // Used to check if style are loaded
      this.buildAndActivatePoster();
      this.buildBigPlayButton();
      this.buildAndActivateSpinner();
      this.buildAndActivateControlBar();
      this.loadInterface(); // Show everything once styles are loaded
      this.getSubtitles();
    }
  },
  /* Source Managemet
  ================================================================================ */
  canPlaySource: function(){
    // Cache Result
    if (this.canPlaySourceResult) { return this.canPlaySourceResult; }
    // Loop through sources and check if any can play
    var children = this.video.children;
    for (var i=0,j=children.length; i<j; i++) {
      if (children[i].tagName.toUpperCase() == "SOURCE") {
        var canPlay = this.video.canPlayType(children[i].type) || this.canPlayExt(children[i].src);
        if (canPlay == "probably" || canPlay == "maybe") {
          this.firstPlayableSource = children[i];
          this.canPlaySourceResult = true;
          return true;
        }
      }
    }
    this.canPlaySourceResult = false;
    return false;
  },
  // Check if the extention is compatible, for when type won't work
  canPlayExt: function(src){
    if (!src) { return ""; }
    var match = src.match(/\.([^\.]+)$/);
    if (match && match[1]) {
      var ext = match[1].toLowerCase();
      // Android canPlayType doesn't work
      if (VideoJS.isAndroid()) {
        if (ext == "mp4" || ext == "m4v") { return "maybe"; }
      // Allow Apple HTTP Streaming for iOS
      } else if (VideoJS.isIOS()) {
        if (ext == "m3u8") { return "maybe"; }
      }
    }
    return "";
  },
  // Force the video source - Helps fix loading bugs in a handful of devices, like the iPad/iPhone poster bug
  // And iPad/iPhone javascript include location bug. And Android type attribute bug
  forceTheSource: function(){
    this.video.src = this.firstPlayableSource.src; // From canPlaySource()
    this.video.load();
  },
  /* Device Fixes
  ================================================================================ */
  // Support older browsers that used "autobuffer"
  fixPreloading: function(){
    if (typeof this.video.hasAttribute == "function" && this.video.hasAttribute("preload") && this.video.preload != "none") {
      this.video.autobuffer = true; // Was a boolean
    } else {
      this.video.autobuffer = false;
      this.video.preload = "none";
    }
  },

  // Listen for Video Load Progress (currently does not if html file is local)
  // Buffered does't work in all browsers, so watching progress as well
  supportProgressEvents: function(e){
    _V_.addListener(this.video, 'progress', this.setBufferedFromProgress.context(this));
  },
  // playerOnVideoProgress: function(event){
  //   this.setBufferedFromProgress(event);
  // },
  setBufferedFromProgress: function(event){ // HTML5 Only
    if(event.total > 0 && this.duration()) {
      var newBufferEnd = (event.loaded / event.total) * this.duration();
      if (newBufferEnd > this.values.bufferEnd) {
        this.values.bufferEnd = newBufferEnd;
        this.triggerListeners("bufferedupdate");
      }
    }
  },

  iOSInterface: function(){
    if(VideoJS.iOSVersion() < 4) { this.forceTheSource(); } // Fix loading issues
    if(VideoJS.isIPad()) { // iPad could work with controlsBelow
      this.buildAndActivateSpinner(); // Spinner still works well on iPad, since iPad doesn't have one
    }
  },

  // Fix android specific quirks
  // Use built-in controls, but add the big play button, since android doesn't have one.
  androidInterface: function(){
    this.forceTheSource(); // Fix loading issues
    _V_.addListener(this.video, "click", function(){ this.play(); }); // Required to play
    this.buildBigPlayButton(); // But don't activate the normal way. Pause doesn't work right on android.
    _V_.addListener(this.bigPlayButton, "click", function(){ this.play(); }.context(this));
    this.positionBox();
    this.showBigPlayButtons();
  },
  /* Wait for styles (TODO: move to _V_)
  ================================================================================ */
  loadInterface: function(){
    if(!this.stylesHaveLoaded()) {
      // Don't want to create an endless loop either.
      if (!this.positionRetries) { this.positionRetries = 1; }
      if (this.positionRetries++ < 100) {
        setTimeout(this.loadInterface.context(this),10);
        return;
      }
    }
    this.hideStylesCheckDiv();
    this.showPoster();
    if (this.video.paused !== false) { this.showBigPlayButtons(); }
    if (this.options.controlsAtStart) { this.showControlBars(); }
    this.positionAll();
  },
  /* Control Bar
  ================================================================================ */
  buildAndActivateControlBar: function(){
    /* Creating this HTML
      <div class="vjs-controls">
        <div class="vjs-play-control">
          <span></span>
        </div>
        <div class="vjs-progress-control">
          <div class="vjs-progress-holder">
            <div class="vjs-load-progress"></div>
            <div class="vjs-play-progress"></div>
          </div>
        </div>
        <div class="vjs-time-control">
          <span class="vjs-current-time-display">00:00</span><span> / </span><span class="vjs-duration-display">00:00</span>
        </div>
        <div class="vjs-volume-control">
          <div>
            <span></span><span></span><span></span><span></span><span></span><span></span>
          </div>
        </div>
        <div class="vjs-fullscreen-control">
          <div>
            <span></span><span></span><span></span><span></span>
          </div>
        </div>
      </div>
    */

    // Create a div to hold the different controls
    this.controls = _V_.createElement("div", { className: "vjs-controls" });
    // Add the controls to the video's container
    this.box.appendChild(this.controls);
    this.activateElement(this.controls, "controlBar");
    this.activateElement(this.controls, "mouseOverVideoReporter");

    // Build the play control
    this.playControl = _V_.createElement("div", { className: "vjs-play-control", innerHTML: "<span></span>" });
    this.controls.appendChild(this.playControl);
    this.activateElement(this.playControl, "playToggle");

    // Build the progress control
    this.progressControl = _V_.createElement("div", { className: "vjs-progress-control" });
    this.controls.appendChild(this.progressControl);

    // Create a holder for the progress bars
    this.progressHolder = _V_.createElement("div", { className: "vjs-progress-holder" });
    this.progressControl.appendChild(this.progressHolder);
    this.activateElement(this.progressHolder, "currentTimeScrubber");

    // Create the loading progress display
    this.loadProgressBar = _V_.createElement("div", { className: "vjs-load-progress" });
    this.progressHolder.appendChild(this.loadProgressBar);
    this.activateElement(this.loadProgressBar, "loadProgressBar");

    // Create the playing progress display
    this.playProgressBar = _V_.createElement("div", { className: "vjs-play-progress" });
    this.progressHolder.appendChild(this.playProgressBar);
    this.activateElement(this.playProgressBar, "playProgressBar");

    // Create the progress time display (00:00 / 00:00)
    this.timeControl = _V_.createElement("div", { className: "vjs-time-control" });
    this.controls.appendChild(this.timeControl);

    // Create the current play time display
    this.currentTimeDisplay = _V_.createElement("span", { className: "vjs-current-time-display", innerHTML: "00:00" });
    this.timeControl.appendChild(this.currentTimeDisplay);
    this.activateElement(this.currentTimeDisplay, "currentTimeDisplay");

    // Add time separator
    this.timeSeparator = _V_.createElement("span", { innerHTML: " / " });
    this.timeControl.appendChild(this.timeSeparator);

    // Create the total duration display
    this.durationDisplay = _V_.createElement("span", { className: "vjs-duration-display", innerHTML: "00:00" });
    this.timeControl.appendChild(this.durationDisplay);
    this.activateElement(this.durationDisplay, "durationDisplay");

    // Create the volumne control
    this.volumeControl = _V_.createElement("div", {
      className: "vjs-volume-control",
      innerHTML: "<div><span></span><span></span><span></span><span></span><span></span><span></span></div>"
    });
    this.controls.appendChild(this.volumeControl);
    this.activateElement(this.volumeControl, "volumeScrubber");

    this.volumeDisplay = this.volumeControl.children[0];
    this.activateElement(this.volumeDisplay, "volumeDisplay");

    // Crete the fullscreen control
    this.fullscreenControl = _V_.createElement("div", {
      className: "vjs-fullscreen-control",
      innerHTML: "<div><span></span><span></span><span></span><span></span></div>"
    });
    this.controls.appendChild(this.fullscreenControl);
    this.activateElement(this.fullscreenControl, "fullscreenToggle");
  },
  /* Poster Image
  ================================================================================ */
  buildAndActivatePoster: function(){
    this.updatePosterSource();
    if (this.video.poster) {
      this.poster = document.createElement("img");
      // Add poster to video box
      this.box.appendChild(this.poster);

      // Add poster image data
      this.poster.src = this.video.poster;
      // Add poster styles
      this.poster.className = "vjs-poster";
      this.activateElement(this.poster, "poster");
    } else {
      this.poster = false;
    }
  },
  /* Big Play Button
  ================================================================================ */
  buildBigPlayButton: function(){
    /* Creating this HTML
      <div class="vjs-big-play-button"><span></span></div>
    */
    this.bigPlayButton = _V_.createElement("div", {
      className: "vjs-big-play-button",
      innerHTML: "<span></span>"
    });
    this.box.appendChild(this.bigPlayButton);
    this.activateElement(this.bigPlayButton, "bigPlayButton");
  },
  /* Spinner (Loading)
  ================================================================================ */
  buildAndActivateSpinner: function(){
    this.spinner = _V_.createElement("div", {
      className: "vjs-spinner",
      innerHTML: "<div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div>"
    });
    this.box.appendChild(this.spinner);
    this.activateElement(this.spinner, "spinner");
  },
  /* Styles Check - Check if styles are loaded (move ot _V_)
  ================================================================================ */
  // Sometimes the CSS styles haven't been applied to the controls yet
  // when we're trying to calculate the height and position them correctly.
  // This causes a flicker where the controls are out of place.
  buildStylesCheckDiv: function(){
    this.stylesCheckDiv = _V_.createElement("div", { className: "vjs-styles-check" });
    this.stylesCheckDiv.style.position = "absolute";
    this.box.appendChild(this.stylesCheckDiv);
  },
  hideStylesCheckDiv: function(){ this.stylesCheckDiv.style.display = "none"; },
  stylesHaveLoaded: function(){
    if (this.stylesCheckDiv.offsetHeight != 5) {
       return false;
    } else {
      return true;
    }
  },
  /* VideoJS Box - Holds all elements
  ================================================================================ */
  positionAll: function(){
    this.positionBox();
    this.positionControlBars();
    this.positionPoster();
  },
  positionBox: function(){
    // Set width based on fullscreen or not.
    if (this.videoIsFullScreen) {
      this.box.style.width = "";
      this.element.style.height="";
      if (this.options.controlsBelow) {
        this.box.style.height = "";
        this.element.style.height = (this.box.offsetHeight - this.controls.offsetHeight) + "px";
      }
    } else {
      this.box.style.width = this.width() + "px";
      this.element.style.height=this.height()+"px";
      if (this.options.controlsBelow) {
        this.element.style.height = "";
        // this.box.style.height = this.video.offsetHeight + this.controls.offsetHeight + "px";
      }
    }
  },
  /* Subtitles
  ================================================================================ */
  getSubtitles: function(){
    var tracks = this.video.getElementsByTagName("TRACK");
    for (var i=0,j=tracks.length; i<j; i++) {
      if (tracks[i].getAttribute("kind") == "subtitles" && tracks[i].getAttribute("src")) {
        this.subtitlesSource = tracks[i].getAttribute("src");
        this.loadSubtitles();
        this.buildSubtitles();
      }
    }
  },
  loadSubtitles: function() { _V_.get(this.subtitlesSource, this.parseSubtitles.context(this)); },
  parseSubtitles: function(subText) {
    var lines = subText.split("\n"),
        line = "",
        subtitle, time, text;
    this.subtitles = [];
    this.currentSubtitle = false;
    this.lastSubtitleIndex = 0;

    for (var i=0; i<lines.length; i++) {
      line = _V_.trim(lines[i]); // Trim whitespace and linebreaks
      if (line) { // Loop until a line with content

        // First line - Number
        subtitle = {
          id: line, // Subtitle Number
          index: this.subtitles.length // Position in Array
        };

        // Second line - Time
        line = _V_.trim(lines[++i]);
        time = line.split(" --> ");
        subtitle.start = this.parseSubtitleTime(time[0]);
        subtitle.end = this.parseSubtitleTime(time[1]);

        // Additional lines - Subtitle Text
        text = [];
        for (var j=i; j<lines.length; j++) { // Loop until a blank line or end of lines
          line = _V_.trim(lines[++i]);
          if (!line) { break; }
          text.push(line);
        }
        subtitle.text = text.join('<br/>');

        // Add this subtitle
        this.subtitles.push(subtitle);
      }
    }
  },

  parseSubtitleTime: function(timeText) {
    var parts = timeText.split(':'),
        time = 0;
    // hours => seconds
    time += parseFloat(parts[0])*60*60;
    // minutes => seconds
    time += parseFloat(parts[1])*60;
    // get seconds
    var seconds = parts[2].split(/\.|,/); // Either . or ,
    time += parseFloat(seconds[0]);
    // add miliseconds
    ms = parseFloat(seconds[1]);
    if (ms) { time += ms/1000; }
    return time;
  },

  buildSubtitles: function(){
    /* Creating this HTML
      <div class="vjs-subtitles"></div>
    */
    this.subtitlesDisplay = _V_.createElement("div", { className: 'vjs-subtitles' });
    this.box.appendChild(this.subtitlesDisplay);
    this.activateElement(this.subtitlesDisplay, "subtitlesDisplay");
  },

  /* Player API - Translate functionality from player to video
  ================================================================================ */
  html5API: {
    setupTriggers: function(){
      // Make video events trigger player events
      // May seem verbose here, but makes other APIs possible.
      var types = ["play", "pause", "ended", "volumechange", "error"],
          player = this, i, type;
      for (i = 0; i<types.length; i++) {
        type = types[i];
        _V_.addListener(this.video, type, function(e){
          player.triggerListeners(this, e);
        }.context(type));
      }
    },

    play: function(){ this.video.play(); },
    pause: function(){ this.video.pause(); },
    paused: function(){ return this.video.paused; },

    currentTime: function(){ return this.video.currentTime; },
    setCurrentTime: function(seconds){
      try { this.video.currentTime = seconds; }
      catch(e) { this.warning(VideoJS.warnings.videoNotReady); }
    },

    duration: function(){ return this.video.duration; },
    buffered: function(){ return this.video.buffered; },

    volume: function(){ return this.video.volume; },
    setVolume: function(percentAsDecimal){ this.video.volume = percentAsDecimal; },

    width: function(){ return this.video.offsetWidth; },
    height: function(){ return this.video.offsetHeight; },

    supportsFullScreen: function(){
      if(typeof this.video.webkitEnterFullScreen == 'function') {
        // Seems to be broken in Chromium/Chrome && Safari in Leopard
        if (!navigator.userAgent.match("Chrome") && !navigator.userAgent.match("Mac OS X 10.5")) {
          return true;
        }
      }
      return false;
    },
    enterFullScreen: function(){
      try {
        this.video.webkitEnterFullScreen();
      } catch (e) {
        if (e.code == 11) { this.warning(VideoJS.warnings.videoNotReady); }
      }
    },
    src: function(src){
      this.video.src = src;
      this.video.load();
    }
  }
});

/* Flash Player Type
================================================================================ */
VideoJS.fn.extend({

  flashSupported: function(){
    if (!this.flashElement) { this.flashElement = this.getFlashElement(); }
    // Check if object exists & Flash Player version is supported
    return !!(this.flashElement && this.flashPlayerVersionSupported());
  },

  flashInit: function(){
    this.replaceWithFlash();
    this.element = this.flashElement;
    this.video.src = ""; // Stop video from downloading if HTML5 is still supported
    var flashPlayer = VideoJS.flashPlayers[this.options.flashPlayer];
    flashPlayer.init.call(this);
    this.api = flashPlayer.api;
    this.api.setupTriggers.call(this);
  },

  // Get Flash Fallback object element from Embed Code
  getFlashElement: function(){
    var children = this.video.children;
    for (var i=0,j=children.length; i<j; i++) {
      if (children[i].className == "vjs-flash-fallback") {
        return children[i];
      }
    }
  },

  // Used to force a browser to fall back when it's an HTML5 browser but there's no supported sources
  replaceWithFlash: function(){
    // this.flashElement = this.video.removeChild(this.flashElement);
    if (this.flashElement) {
      this.box.insertBefore(this.flashElement, this.video);
      this.video.style.display = "none"; // Removing it was breaking later players
    }
  },

  // Check if browser can use this flash player
  flashPlayerVersionSupported: function(){
    var playerVersion = (this.options.flashPlayerVersion) ? this.options.flashPlayerVersion : VideoJS.flashPlayers[this.options.flashPlayer].flashPlayerVersion;
    return VideoJS.getFlashVersion() >= playerVersion;
  }
});

/* Flash Object Fallback (Flash Player)
================================================================================ */
VideoJS.flashPlayers = {};
VideoJS.flashPlayers.htmlObject = {
  flashPlayerVersion: 9,
  init: function() { return true; },
  api: {} // No video API available with HTML Object embed method
};

////////////////////////////////////////////////////////////////////////////////
// Element Behaviors
// Tell elements how to act or react
////////////////////////////////////////////////////////////////////////////////

/* Player Behaviors - How VideoJS reacts to what the video is doing.
================================================================================ */
VideoJS.fn.newBehavior("player", function(player){
    this.addListener("error", this.playerOnVideoError);
    this.addListener("play", this.playerOnVideoPlay);
    this.addListener("play", this.trackCurrentTime);
    this.addListener("pause", this.stopTrackingCurrentTime);
    this.addListener("ended", this.playerOnVideoEnded);
    this.trackBuffered();
    this.addListener("bufferedupdate", this.bufferFull);
  },{
    playerOnVideoError: function(event){
      this.log(event);
      this.log(this.video.error);
    },
    playerOnVideoPlay: function(event){ this.hasPlayed = true; },
    playerOnVideoEnded: function(event){
      if (this.options.loop) {
        this.currentTime(0);
        this.play();
      } else if (this.options.returnToStart) {
        this.currentTime(0);
        this.pause();
      }
    },

    /* Load Tracking -------------------------------------------------------------- */
    // Buffer watching method for load progress.
    // Used for browsers that don't support the progress event
    trackBuffered: function(){
      this.bufferedInterval = setInterval(function(){
        // Don't trigger unless
        if (this.values.bufferEnd < this.buffered().end(0)) {
          this.triggerListeners("bufferedupdate");
        }
      }.context(this), 500);
    },
    stopTrackingBuffered: function(){ clearInterval(this.bufferedInterval); },
    bufferFull: function(){
      if (this.bufferedPercent() == 1) {
        this.stopTrackingBuffered();
      }
    },

    /* Time Tracking -------------------------------------------------------------- */
    trackCurrentTime: function(){
      if (this.currentTimeInterval) { clearInterval(this.currentTimeInterval); }

      this.currentTimeInterval = setInterval(function(){
        this.triggerListeners("timeupdate");
      }.context(this), 100); // 42 = 24 fps

      this.trackingCurrentTime = true;
    },
    // Turn off play progress tracking (when paused or dragging)
    stopTrackingCurrentTime: function(){
      clearInterval(this.currentTimeInterval);
      this.trackingCurrentTime = false;
    }
  }
);
/* Mouse Over Video Reporter Behaviors - i.e. Controls hiding based on mouse location
================================================================================ */
VideoJS.fn.newBehavior("mouseOverVideoReporter", function(element){
    // Listen for the mouse move the video. Used to reveal the controller.
    _V_.addListener(element, "mousemove", this.mouseOverVideoReporterOnMouseMove.context(this));
    // Listen for the mouse moving out of the video. Used to hide the controller.
    _V_.addListener(element, "mouseout", this.mouseOverVideoReporterOnMouseOut.context(this));
  },{
    mouseOverVideoReporterOnMouseMove: function(){
      this.showControlBars();
      clearInterval(this.mouseMoveTimeout);
      this.mouseMoveTimeout = setTimeout(this.hideControlBars.context(this), 4000);
    },
    mouseOverVideoReporterOnMouseOut: function(event){
      // Prevent flicker by making sure mouse hasn't left the video
      var parent = event.relatedTarget;
      while (parent && parent !== this.box) {
        parent = parent.parentNode;
      }
      if (parent !== this.box) {
        this.hideControlBars();
      }
    }
  }
);
/* Mouse Over Video Reporter Behaviors - i.e. Controls hiding based on mouse location
================================================================================ */
VideoJS.fn.newBehavior("box", function(element){
    this.positionBox();
    _V_.addClass(element, "vjs-paused");
    this.activateElement(element, "mouseOverVideoReporter");
    this.addListener("play", this.boxOnVideoPlay);
    this.addListener("pause", this.boxOnVideoPause);
  },{
    boxOnVideoPlay: function(){
      _V_.removeClass(this.box, "vjs-paused");
      _V_.addClass(this.box, "vjs-playing");
    },
    boxOnVideoPause: function(){
      _V_.removeClass(this.box, "vjs-playing");
      _V_.addClass(this.box, "vjs-paused");
    }
  }
);
/* Poster Image Overlay
================================================================================ */
VideoJS.fn.newBehavior("poster", function(element){
    this.activateElement(element, "mouseOverVideoReporter");
    this.activateElement(element, "playButton");
    this.addListener("play", this.hidePoster);
    this.addListener("ended", this.showPoster);
    this.addListener("resize", this.positionPoster);
  },{
    showPoster: function(){
      if (!this.poster) { return; }
      this.poster.style.display = "block";
      this.positionPoster();
    },
    positionPoster: function(){
      // Only if the poster is visible
      if (!this.poster || this.poster.style.display == 'none') { return; }
      this.poster.style.height = this.height() + "px"; // Need incase controlsBelow
      this.poster.style.width = this.width() + "px"; // Could probably do 100% of box
    },
    hidePoster: function(){
      if (!this.poster) { return; }
      this.poster.style.display = "none";
    },
    // Update poster source from attribute or fallback image
    // iPad breaks if you include a poster attribute, so this fixes that
    updatePosterSource: function(){
      if (!this.video.poster) {
        var images = this.video.getElementsByTagName("img");
        if (images.length > 0) { this.video.poster = images[0].src; }
      }
    }
  }
);
/* Control Bar Behaviors
================================================================================ */
VideoJS.fn.newBehavior("controlBar", function(element){
    if (!this.controlBars) {
      this.controlBars = [];
      this.addListener("resize", this.positionControlBars);
    }
    this.controlBars.push(element);
    _V_.addListener(element, "mousemove", this.onControlBarsMouseMove.context(this));
    _V_.addListener(element, "mouseout", this.onControlBarsMouseOut.context(this));
  },{
    showControlBars: function(){
      if (!this.options.controlsEnabled) { return; }
      if (!this.options.controlsAtStart && !this.hasPlayed) { return; }
      this.each(this.controlBars, function(bar){
        // bar.style.opacity = 1;
        bar.style.display = "block";
      });
    },
    // Place controller relative to the video's position (now just resizing bars)
    positionControlBars: function(){
      this.updatePlayProgressBars();
      this.updateLoadProgressBars();
    },
    hideControlBars: function(){
      if (this.options.controlsHiding && !this.mouseIsOverControls) {
        this.each(this.controlBars, function(bar){
          // bar.style.opacity = 0;
          bar.style.display = "none";
        });
      }
    },
    // Block controls from hiding when mouse is over them.
    onControlBarsMouseMove: function(){ this.mouseIsOverControls = true; },
    onControlBarsMouseOut: function(event){
      this.mouseIsOverControls = false;
    }
  }
);
/* PlayToggle, PlayButton, PauseButton Behaviors
================================================================================ */
// Play Toggle
VideoJS.fn.newBehavior("playToggle", function(element){
    if (!this.elements.playToggles) {
      this.elements.playToggles = [];
      this.addListener("play", this.playTogglesOnPlay);
      this.addListener("pause", this.playTogglesOnPause);
    }
    this.elements.playToggles.push(element);
    _V_.addListener(element, "click", this.onPlayToggleClick.context(this));
  },{
    onPlayToggleClick: function(event){
      if (this.paused()) {
        this.play();
      } else {
        this.pause();
      }
    },
    playTogglesOnPlay: function(event){
      this.each(this.elements.playToggles, function(toggle){
        _V_.removeClass(toggle, "vjs-paused");
        _V_.addClass(toggle, "vjs-playing");
      });
    },
    playTogglesOnPause: function(event){
      this.each(this.elements.playToggles, function(toggle){
        _V_.removeClass(toggle, "vjs-playing");
        _V_.addClass(toggle, "vjs-paused");
      });
    }
  }
);
// Play
VideoJS.fn.newBehavior("playButton", function(element){
    _V_.addListener(element, "click", this.onPlayButtonClick.context(this));
  },{
    onPlayButtonClick: function(event){ this.play(); }
  }
);
// Pause
VideoJS.fn.newBehavior("pauseButton", function(element){
    _V_.addListener(element, "click", this.onPauseButtonClick.context(this));
  },{
    onPauseButtonClick: function(event){ this.pause(); }
  }
);
/* Play Progress Bar Behaviors
================================================================================ */
VideoJS.fn.newBehavior("playProgressBar", function(element){
    if (!this.elements.playProgressBars) {
      this.elements.playProgressBars = [];
      this.addListener("timeupdate", this.updatePlayProgressBars);
    }
    this.elements.playProgressBars.push(element);
  },{
    // Ajust the play progress bar's width based on the current play time
    updatePlayProgressBars: function(newTime){
      var progress = (this.scrubbing) ? this.values.currentTime / this.duration() : this.currentTime() / this.duration();
      if (isNaN(progress)) { progress = 0; }
      this.each(this.elements.playProgressBars, function(bar){
        if (bar.style) { bar.style.width = _V_.round(progress * 100, 2) + "%"; }
      });
    }
  }
);
/* Load Progress Bar Behaviors
================================================================================ */
VideoJS.fn.newBehavior("loadProgressBar", function(element){
    if (!this.elements.loadProgressBars) { this.elements.loadProgressBars = []; }
    this.elements.loadProgressBars.push(element);
    this.addListener("bufferedupdate", this.updateLoadProgressBars);
  },{
    updateLoadProgressBars: function(){
      this.each(this.elements.loadProgressBars, function(bar){
        if (bar.style) { bar.style.width = _V_.round(this.bufferedPercent() * 100, 2) + "%"; }
      });
    }
  }
);

/* Current Time Display Behaviors
================================================================================ */
VideoJS.fn.newBehavior("currentTimeDisplay", function(element){
    if (!this.elements.currentTimeDisplays) {
      this.elements.currentTimeDisplays = [];
      this.addListener("timeupdate", this.updateCurrentTimeDisplays);
    }
    this.elements.currentTimeDisplays.push(element);
  },{
    // Update the displayed time (00:00)
    updateCurrentTimeDisplays: function(newTime){
      // Allows for smooth scrubbing, when player can't keep up.
      var time = (this.scrubbing) ? this.values.currentTime : this.currentTime();
      this.each(this.elements.currentTimeDisplays, function(dis){
        dis.innerHTML = _V_.formatTime(time);
      });
    }
  }
);

/* Duration Display Behaviors
================================================================================ */
VideoJS.fn.newBehavior("durationDisplay", function(element){
    if (!this.elements.durationDisplays) {
      this.elements.durationDisplays = [];
      this.addListener("timeupdate", this.updateDurationDisplays);
    }
    this.elements.durationDisplays.push(element);
  },{
    updateDurationDisplays: function(){
      this.each(this.elements.durationDisplays, function(dis){
        if (this.duration()) { dis.innerHTML = _V_.formatTime(this.duration()); }
      });
    }
  }
);

/* Current Time Scrubber Behaviors
================================================================================ */
VideoJS.fn.newBehavior("currentTimeScrubber", function(element){
    _V_.addListener(element, "mousedown", this.onCurrentTimeScrubberMouseDown.rEvtContext(this));
  },{
    // Adjust the play position when the user drags on the progress bar
    onCurrentTimeScrubberMouseDown: function(event, scrubber){
      event.preventDefault();
      this.currentScrubber = scrubber;

      this.stopTrackingCurrentTime(); // Allows for smooth scrubbing
      this.scrubbing = true;

      this.videoWasPlaying = !this.paused();
      this.pause();

      _V_.blockTextSelection();
      this.setCurrentTimeWithScrubber(event);
      _V_.addListener(document, "mousemove", this.onCurrentTimeScrubberMouseMove.rEvtContext(this));
      _V_.addListener(document, "mouseup", this.onCurrentTimeScrubberMouseUp.rEvtContext(this));
    },
    onCurrentTimeScrubberMouseMove: function(event){ // Removeable
      this.setCurrentTimeWithScrubber(event);
    },
    onCurrentTimeScrubberMouseUp: function(event){ // Removeable
      _V_.unblockTextSelection();
      document.removeEventListener("mousemove", this.onCurrentTimeScrubberMouseMove, false);
      document.removeEventListener("mouseup", this.onCurrentTimeScrubberMouseUp, false);
      this.scrubbing = false;
      if (this.videoWasPlaying) {
        this.play();
        this.trackCurrentTime();
      }
    },
    setCurrentTimeWithScrubber: function(event){
      var newProgress = _V_.getRelativePosition(event.pageX, this.currentScrubber);
      var newTime = newProgress * this.duration();
      // Don't let video end while scrubbing.
      if (newTime == this.duration()) { newTime = newTime - 0.1; }
      this.currentTime(newTime);
      this.triggerListeners("timeupdate");
    }
  }
);
/* Volume Display Behaviors
================================================================================ */
VideoJS.fn.newBehavior("volumeDisplay", function(element){
    if (!this.elements.volumeDisplays) {
      this.elements.volumeDisplays = [];
      this.addListener("volumechange", this.updateVolumeDisplays);
    }
    this.elements.volumeDisplays.push(element);
    this.updateVolumeDisplay(element); // Set the display to the initial volume
  },{
    // Update the volume control display
    // Unique to these default controls. Uses borders to create the look of bars.
    updateVolumeDisplays: function(){
      if (!this.elements.volumeDisplays) { return; }
      this.each(this.elements.volumeDisplays, function(dis){
        this.updateVolumeDisplay(dis);
      });
    },
    updateVolumeDisplay: function(display){
      var volNum = Math.ceil(this.volume() * 6);
      this.each(display.children, function(child, num){
        if (num < volNum) {
          _V_.addClass(child, "vjs-volume-level-on");
        } else {
          _V_.removeClass(child, "vjs-volume-level-on");
        }
      });
    }
  }
);
/* Volume Scrubber Behaviors
================================================================================ */
VideoJS.fn.newBehavior("volumeScrubber", function(element){
    _V_.addListener(element, "mousedown", this.onVolumeScrubberMouseDown.rEvtContext(this));
  },{
    // Adjust the volume when the user drags on the volume control
    onVolumeScrubberMouseDown: function(event, scrubber){
      // event.preventDefault();
      _V_.blockTextSelection();
      this.currentScrubber = scrubber;
      this.setVolumeWithScrubber(event);
      _V_.addListener(document, "mousemove", this.onVolumeScrubberMouseMove.rEvtContext(this));
      _V_.addListener(document, "mouseup", this.onVolumeScrubberMouseUp.rEvtContext(this));
    },
    onVolumeScrubberMouseMove: function(event){
      this.setVolumeWithScrubber(event);
    },
    onVolumeScrubberMouseUp: function(event){
      this.setVolumeWithScrubber(event);
      _V_.unblockTextSelection();
      document.removeEventListener("mousemove", this.onVolumeScrubberMouseMove, false);
      document.removeEventListener("mouseup", this.onVolumeScrubberMouseUp, false);
    },
    setVolumeWithScrubber: function(event){
      var newVol = _V_.getRelativePosition(event.pageX, this.currentScrubber);
      this.volume(newVol);
    }
  }
);
/* Fullscreen Toggle Behaviors
================================================================================ */
VideoJS.fn.newBehavior("fullscreenToggle", function(element){
    _V_.addListener(element, "click", this.onFullscreenToggleClick.context(this));
  },{
    // When the user clicks on the fullscreen button, update fullscreen setting
    onFullscreenToggleClick: function(event){
      if (!this.videoIsFullScreen) {
        this.enterFullScreen();
      } else {
        this.exitFullScreen();
      }
    },

    fullscreenOnWindowResize: function(event){ // Removeable
      this.positionControlBars();
    },
    // Create listener for esc key while in full screen mode
    fullscreenOnEscKey: function(event){ // Removeable
      if (event.keyCode == 27) {
        this.exitFullScreen();
      }
    }
  }
);
/* Big Play Button Behaviors
================================================================================ */
VideoJS.fn.newBehavior("bigPlayButton", function(element){
    if (!this.elements.bigPlayButtons) {
      this.elements.bigPlayButtons = [];
      this.addListener("play", this.hideBigPlayButtons);
      this.addListener("ended", this.showBigPlayButtons);
    }
    this.elements.bigPlayButtons.push(element);
    this.activateElement(element, "playButton");
  },{
    showBigPlayButtons: function(){
      if (!this.options.controlsEnabled) { return; }
      this.each(this.elements.bigPlayButtons, function(element){
        element.style.display = "block";
      });
    },
    hideBigPlayButtons: function(){
      this.each(this.elements.bigPlayButtons, function(element){
        element.style.display = "none";
      });
    }
  }
);
/* Spinner
================================================================================ */
VideoJS.fn.newBehavior("spinner", function(element){
    if (!this.spinners) {
      this.spinners = [];
      this.spinnersRotated = 0;
      _V_.addListener(this.video, "loadeddata", this.spinnersOnVideoLoadedData.context(this));
      _V_.addListener(this.video, "loadstart", this.spinnersOnVideoLoadStart.context(this));
      _V_.addListener(this.video, "seeking", this.spinnersOnVideoSeeking.context(this));
      _V_.addListener(this.video, "seeked", this.spinnersOnVideoSeeked.context(this));
      _V_.addListener(this.video, "canplay", this.spinnersOnVideoCanPlay.context(this));
      _V_.addListener(this.video, "canplaythrough", this.spinnersOnVideoCanPlayThrough.context(this));
      _V_.addListener(this.video, "waiting", this.spinnersOnVideoWaiting.context(this));
      _V_.addListener(this.video, "stalled", this.spinnersOnVideoStalled.context(this));
      _V_.addListener(this.video, "suspend", this.spinnersOnVideoSuspend.context(this));
      _V_.addListener(this.video, "playing", this.spinnersOnVideoPlaying.context(this));
      _V_.addListener(this.video, "timeupdate", this.spinnersOnVideoTimeUpdate.context(this));
    }
    this.spinners.push(element);
  },{
    showSpinners: function(){
      this.each(this.spinners, function(spinner){
        spinner.style.display = "block";
      });
      clearInterval(this.spinnerInterval);
      this.spinnerInterval = setInterval(this.rotateSpinners.context(this), 100);
    },
    hideSpinners: function(){
      this.each(this.spinners, function(spinner){
        spinner.style.display = "none";
      });
      clearInterval(this.spinnerInterval);
    },
    rotateSpinners: function(){
      this.each(this.spinners, function(spinner){
        // spinner.style.transform =       'scale(0.5) rotate('+this.spinnersRotated+'deg)';
        spinner.style.WebkitTransform = 'scale(0.5) rotate('+this.spinnersRotated+'deg)';
        spinner.style.MozTransform =    'scale(0.5) rotate('+this.spinnersRotated+'deg)';
      });
      if (this.spinnersRotated == 360) { this.spinnersRotated = 0; }
      this.spinnersRotated += 45;
    },
    spinnersOnVideoLoadedData: function(event){ this.hideSpinners(); },
    spinnersOnVideoLoadStart: function(event){ this.showSpinners(); },
    spinnersOnVideoSeeking: function(event){ /* this.showSpinners(); */ },
    spinnersOnVideoSeeked: function(event){ /* this.hideSpinners(); */ },
    spinnersOnVideoCanPlay: function(event){ /* this.hideSpinners(); */ },
    spinnersOnVideoCanPlayThrough: function(event){ this.hideSpinners(); },
    spinnersOnVideoWaiting: function(event){
      // Safari sometimes triggers waiting inappropriately
      // Like after video has played, and you play again.
      this.showSpinners();
    },
    spinnersOnVideoStalled: function(event){},
    spinnersOnVideoSuspend: function(event){},
    spinnersOnVideoPlaying: function(event){ this.hideSpinners(); },
    spinnersOnVideoTimeUpdate: function(event){
      // Safari sometimes calls waiting and doesn't recover
      if(this.spinner.style.display == "block") { this.hideSpinners(); }
    }
  }
);
/* Subtitles
================================================================================ */
VideoJS.fn.newBehavior("subtitlesDisplay", function(element){
    if (!this.elements.subtitleDisplays) {
      this.elements.subtitleDisplays = [];
      this.addListener("timeupdate", this.subtitleDisplaysOnVideoTimeUpdate);
      this.addListener("ended", function() { this.lastSubtitleIndex = 0; }.context(this));
    }
    this.elements.subtitleDisplays.push(element);
  },{
    subtitleDisplaysOnVideoTimeUpdate: function(){
      // Assuming all subtitles are in order by time, and do not overlap
      if (this.subtitles) {
        var time = this.currentTime();
        // If current subtitle should stay showing, don't do anything. Otherwise, find new subtitle.
        if (!this.currentSubtitle || this.currentSubtitle.start >= time || this.currentSubtitle.end < time) {
          var newSubIndex = false,
              // Loop in reverse if lastSubtitle is after current time (optimization)
              // Meaning the user is scrubbing in reverse or rewinding
              reverse = (this.subtitles[this.lastSubtitleIndex].start > time),
              // If reverse, step back 1 becase we know it's not the lastSubtitle
              i = this.lastSubtitleIndex - (reverse) ? 1 : 0;
          while (true) { // Loop until broken
            if (reverse) { // Looping in reverse
              // Stop if no more, or this subtitle ends before the current time (no earlier subtitles should apply)
              if (i < 0 || this.subtitles[i].end < time) { break; }
              // End is greater than time, so if start is less, show this subtitle
              if (this.subtitles[i].start < time) {
                newSubIndex = i;
                break;
              }
              i--;
            } else { // Looping forward
              // Stop if no more, or this subtitle starts after time (no later subtitles should apply)
              if (i >= this.subtitles.length || this.subtitles[i].start > time) { break; }
              // Start is less than time, so if end is later, show this subtitle
              if (this.subtitles[i].end > time) {
                newSubIndex = i;
                break;
              }
              i++;
            }
          }

          // Set or clear current subtitle
          if (newSubIndex !== false) {
            this.currentSubtitle = this.subtitles[newSubIndex];
            this.lastSubtitleIndex = newSubIndex;
            this.updateSubtitleDisplays(this.currentSubtitle.text);
          } else if (this.currentSubtitle) {
            this.currentSubtitle = false;
            this.updateSubtitleDisplays("");
          }
        }
      }
    },
    updateSubtitleDisplays: function(val){
      this.each(this.elements.subtitleDisplays, function(disp){
        disp.innerHTML = val;
      });
    }
  }
);

////////////////////////////////////////////////////////////////////////////////
// Convenience Functions (mini library)
// Functions not specific to video or VideoJS and could probably be replaced with a library like jQuery
////////////////////////////////////////////////////////////////////////////////

VideoJS.extend({

  addClass: function(element, classToAdd){
    if ((" "+element.className+" ").indexOf(" "+classToAdd+" ") == -1) {
      element.className = element.className === "" ? classToAdd : element.className + " " + classToAdd;
    }
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

  addListener: function(element, type, handler){
    if (element.addEventListener) {
      element.addEventListener(type, handler, false);
    } else if (element.attachEvent) {
      element.attachEvent("on"+type, handler);
    }
  },
  removeListener: function(element, type, handler){
    if (element.removeEventListener) {
      element.removeEventListener(type, handler, false);
    } else if (element.attachEvent) {
      element.detachEvent("on"+type, handler);
    }
  },

  get: function(url, onSuccess){
    // if (netscape.security.PrivilegeManager.enablePrivilege) {
    //   netscape.security.PrivilegeManager.enablePrivilege("UniversalBrowserRead");
    // }
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
    try {
      request.send();
    } catch(e) {
      // Can't access file.
    }
  },

  trim: function(string){ return string.toString().replace(/^\s+/, "").replace(/\s+$/, ""); },

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
// Only use with event callbacks
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
// In order to work, a version of the function must already exist in the player/prototype
Function.prototype.rEvtContext = function(obj, funcParent){
  if (this.hasContext === true) { return this; }
  if (!funcParent) { funcParent = obj; }
  for (var attrname in funcParent) {
    if (funcParent[attrname] == this) {
      funcParent[attrname] = this.evtContext(obj);
      funcParent[attrname].hasContext = true;
      return funcParent[attrname];
    }
  }
  return this.evtContext(obj);
};

/* jQuery Plugin
================================================================================ */
if (window.jQuery) {
  (function($) {

    $.fn.setupPlayer = function(options) {
      return VideoJS.setup(this[0], options);
    };

    // Deprecated
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
window.VideoJS = window._V_ = VideoJS;

// End self-executing function
})(window);