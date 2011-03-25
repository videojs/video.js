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

  // Get the player object for the supplied video tag ID
  player: function(id){ return document.getElementById(id).player; },

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

