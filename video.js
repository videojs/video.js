// Self-executing function to prevent global vars and help with minification
;(function(window, undefined){
  var document = window.document;

// HTML5 Shiv. Must be in <head>.
document.createElement("video");document.createElement("audio");

var VideoJS = _V_ = function(id, options){

  // Allow for element or ID to be passed in.
  var tag = (typeof id == "string" ? _V_.el(id) : id);
  if (!tag || !tag.nodeName) { // Could be a box div also
    throw new TypeError("The element or ID supplied is not valid. (video.js)");
    return;
  }

  // Check if (not) using "new" operator before the function to create new instance
  if (!(this instanceof arguments.callee)) {
    // Return the player attr on the element if it exists
    // Otherwise set up a new player.
    return tag.player || new VideoJS(id, options);
  }

  this.tag = tag;
  var box = this.box = _V_.createElement("div"),
      width = tag.width || 300,
      height = tag.height || 150;

  // Make player findable on elements
  tag.player = box.player = this;

  // Wrap video tag in div (box) container
  tag.parentNode.insertBefore(box, tag);
  box.appendChild(tag); // Breaks iPhone, fixed in HTML5 setup.

  // Give video tag properties to box
  box.id = tag.id; // ID will now reference box, not the video tag
  box.className = tag.className;
  box.setAttribute("width", width);
  box.setAttribute("height", height);
  box.style.width = width+"px";
  box.style.height = height+"px";

  // Strip tag of basic properties
  tag.id += "_html5_api";
  tag.className = "vjs-tech";
  tag.removeAttribute("width");
  tag.removeAttribute("height");
  tag.removeAttribute("controls");

  // Same id for player/box
  this.id = box.id;

  // Default Options
  this.options = _V_.options; // Global Defaults
  _V_.merge(this.options, this.getVideoTagSettings()); // Override with Video Tag Options
  _V_.merge(this.options, options); // Override/extend with options from setup call

  // Empty video tag sources and tracks so the built in player doesn't use them also.
  if (tag.hasChildNodes()) {
    for (var i=0,j=tag.childNodes;i<j.length;i++) {
      if (j[i].nodeName == "SOURCE" || j[i].nodeName == "TRACK") {
        tag.removeChild(j[i]);
      }
    }
  }

  // Store references to elements for different purposes
  this.els = {};
  // Tech (playback) Elements. Store playback tech objects for switching between them.
  // ex. this.tels.html5 = videoTagElement; this.tels.flowplayer = swfObject;
  this.tels = {};
  // Behavior Elements. Store refs to elements that trigger/are triggered by a behavior.
  // ex. this.bels.playButtons = [element1, element2]
  this.bels = {};
  // Control Elements. Store refs to elements that are part of control sets
  // this.cels.mainControls.playButton = playButtonDiv;
  this.cels = {};
  // Cache for video property values.
  this.values = {};

  this.apiIsReady = false;

  this.addBehavior(this.box, "box");

  this.addEvent("ended", this.handleEnded);

  // Build controls when the API is ready
  this.addEvent("techready", _V_.proxy(this, function(){
    this.each(this.options.controlSets, function(set){
      _V_.controlSets[set].add.call(this);
    });
  }));

  // Loop through playback technologies (HTML5, Flash) and check for support
  // Then load the best source.
  this.src(this.options.sources);
};

VideoJS.options = {
  techOrder: ["html5","flowplayer","h5swf"],
  controlSets: ["bigPlayButton", "bar", "subtitlesBox"/*, "replay"*/],
  controlSetOptions: {
    bigPlayButton: {},
    bar: {},
    replay: {}
  },
  width: "auto", // Default of web browser is 300x150. Should rely on source width/height.
  height: "auto"
};

VideoJS.fn = VideoJS.prototype = {

  getVideoTagSettings: function(){
    var options = {
      sources: [],
      tracks: []
    };

    options.width = this.tag.width;
    options.height = this.tag.height;
    options.src = this.tag.src;
    options.poster = this.tag.poster;
    options.preload = this.tag.preload;
    options.autoplay = this.tag.getAttribute("autoplay") !== null; // hasAttribute not IE <8 compatible
    options.controls = this.tag.getAttribute("controls") !== null;
    options.loop = this.tag.getAttribute("loop") !== null;
    options.muted = this.tag.getAttribute("muted") !== null;

    for (var c,i=0,j=this.tag.children;i<j.length;i++) {
      c = j[i];
      if (c.nodeName == "SOURCE") {
        options.sources.push({
          src: c.src,
          type: c.type,
          media: c.media,
          title: c.title
        });
      }
      if (c.nodeName == "TRACK") {
        options.tracks.push(new _V_.Track({
          src: c.getAttribute("src"),
          kind: c.getAttribute("kind"),
          srclang: c.getAttribute("srclang"),
          label: c.getAttribute("label"),
          'default': c.getAttribute("default") !== null,
          title: c.getAttribute("title")
        }, this));
        
      }
    }
    return options;
  },

  /* PLayback Technology (tech)
  ================================================================================ */
  loadTech: function(techName, source){
    var tech = this.currentTech = _V_.tech[techName];

    // Pause and remove current playback technology
    if (this.currentTechName) {
      this.removeTech(techName);

    // If the first time loading, HTML5 tag will exist but won't be initialized
    // So we need to remove it if we're not loading HTML5
    } else if (!this.currentTechName && techName != "html5") {
      this.removeTechElement(this.tag);
    }

    this.currentTechName = techName;

    // Turn off API access because we're loading a new tech that might load asynchronously
    this.isReady = false;

    // Point all internal API calls to new playback tech's API.
    this.api = tech.api;

    // Finsh API Setup when tech is ready
    this.addEvent("techready", _V_.proxy(this, function(){
      // Reomve this so it's not called twice next load
      // this.removeEvent("techready", arguments.callee);
      
      this.currentTechElement = this.tels[this.currentTechName];

      // Set up playback technology's event triggers
      this.api.setupTriggers.call(this);
      this.triggerReady();

      // Make playback element clickable
      this.addBehavior(this.currentTechElement, "tech");

      // Manually track progress in cases where the browser/flash player doesn't report it.
      if (!_V_.techSupports(tech, "event", "progress")) { this.manualProgressOn(); }

      // Manually track timeudpates in cases where the browser/flash player doesn't report it.
      if (!_V_.techSupports(tech, "event", "timeupdate")) { this.manualTimeUpdatesOn(); }
    }));

    // Initialize new tech if it hasn't been yet
    if (this.tels[techName] === undefined) {
      tech.init.call(this, source);
    } else {
      _V_.insertFirst(this.tels[techName], this.box);
      this.src(source);
    }
  },

  removeTech: function(techName){
    this.removeTechElement(this.tels[techName]);
    // Should probably remove API listeners as well
  },
  removeTechElement: function(el){
    this.box.removeChild(el);
  },

  /* Ready - Trigger functions when player is ready
  ================================================================================ */
  readyQueue: [],
  ready: function(fn){
    if (this.isReady) {
      fn.call(this);
    } else {
      this.readyQueue.push(fn);
    }
  },
  triggerReady: function(){
    if (this.isReady) return;
    this.isReady = true;
    if (this.readyQueue.length > 0) {
      // Call all functions in ready queue
      this.each(this.readyQueue, function(fn){
        fn.call(this);
      });

      // Reset Ready Queue
      this.readyQueue = [];
    }
  },

  /* Behaviors - Make elements act like specific controls or displays
  ================================================================================ */
  /* TODO - Make behavior classes. Use JR's simple inheritance for sub-classing. */
  behaviors: {},
  // New Behavior. Gets called in prototype scope (_V_.fn.newBehavior), so added to all instances.
  newBehavior: function(name, add, remove, functions){
    this.behaviors[name] = { add: add, remove: remove };
    this.extend(functions);
  },
  addBehavior: function(element, behavior){
    // Allow passing and ID string
    if (typeof element == "string") { element = _V_.el(element); }
    this.behaviors[behavior].add.call(this, element);
  },
  removeBehavior: function(element, behavior){
    if (typeof element == "string") { element = _V_.el(element); }
    this.behaviors[behavior].remove.call(this, element);
  },

  /* Fallbacks for unsupported event types
  ================================================================================ */
  // Manually trigger progress events based on changes to the buffered amount
  // Many flash players and older HTML5 browsers don't send progress or progress-like events
  manualProgressOn: function(){
    this.manualProgress = true;
    // Trigger progress watching when a source begins loading
    // this.addEvent("loadstart", _V_.proxy(this, this.trackProgress));
    this.trackProgress();

    // Set variables of closure
    var tech = _V_.tech[this.currentTechName],
        el = this.tels[this.currentTechName];

    // Watch for native progress event
    _V_.addEvent(el, "progress", _V_.proxy(this, function(){
      // Remove this listener from the element
      _V_.removeEvent(el, "progress", arguments.callee);
      // Update known progress support for this playback technology
      _V_.updateTechSupport(tech, "event", "progress", true);
      // Turn off manual progress tracking
      this.manualProgressOff();
    }));
  },
  manualProgressOff: function(){
    this.manualProgress = false;
    this.removeEvent("loadstart", _V_.proxy(this, this.trackProgress));
    this.stopTrackingProgress();
  },

  trackProgress: function(){
    this.progressInterval = setInterval(_V_.proxy(this, function(){
      // Don't trigger unless buffered amount is greater than last time
      // log(this.values.bufferEnd, this.buffered().end(0), this.duration())
      /* TODO: update for multiple buffered regions */
      if (this.values.bufferEnd < this.buffered().end(0)) {
        this.triggerEvent("progress");
      } else if (this.bufferedPercent() == 1) {
        this.stopTrackingProgress();
        this.triggerEvent("progress"); // Last update
      }
    }), 500);
  },
  stopTrackingProgress: function(){ clearInterval(this.progressInterval); },

  /* Time Tracking -------------------------------------------------------------- */
  manualTimeUpdatesOn: function(){
    this.manualTimeUpdates = true;

    this.addEvent("play", this.trackCurrentTime);
    this.addEvent("pause", this.stopTrackingCurrentTime);
    // timeupdate is also called by .currentTime whenever current time is set

    // Set variables of closure
    var tech = _V_.tech[this.currentTechName],
        el = this.tels[this.currentTechName];

    // Watch for native timeupdate event
    _V_.addEvent(el, "timeupdate", _V_.proxy(this, function(){

      // Remove this listener from the element
      _V_.removeEvent(el, "timeupdate", arguments.callee);

      // Update known progress support for this playback technology
      _V_.updateTechSupport(tech, "event", "timeupdate", true);

      // Turn off manual progress tracking
      this.manualTimeUpdatesOff();
    }));
  },
  manualTimeUpdatesOff: function(){
    this.manualTimeUpdates = false;
    this.stopTrackingCurrentTime();
    this.removeEvent("play", this.trackCurrentTime);
    this.removeEvent("pause", this.stopTrackingCurrentTime);
  },
  
  trackCurrentTime: function(){
    if (this.currentTimeInterval) { this.stopTrackingCurrentTime(); }
    this.currentTimeInterval = setInterval(_V_.proxy(this, function(){
      this.triggerEvent("timeupdate");
    }), 250); // 42 = 24 fps // 250 is what Webkit uses // FF uses 15
  },
  // Turn off play progress tracking (when paused or dragging)
  stopTrackingCurrentTime: function(){ clearInterval(this.currentTimeInterval); },
  
  /* Player event handlers (how the player reacts to certain events)
  ================================================================================ */
  handleEnded: function(){
    if (this.options.loop) {
      this.currentTime(0);
      this.play();
    } else {
      this.currentTime(0);
      this.pause();
    }
  },

  /* Utility
  ================================================================================ */
  each: function(arr, fn){
    if (!arr || arr.length === 0) { return; }
    for (var i=0,j=arr.length; i<j; i++) {
      if (fn.call(this, arr[i], i)) { break; }
    }
  },

  extend: function(obj){
    for (var attrname in obj) {
      if (obj.hasOwnProperty(attrname)) { this[attrname]=obj[attrname]; }
    }
  },

  /* Local Storage
  ================================================================================ */
  setLocalStorage: function(key, value){
    // IE was throwing errors referencing the var anywhere without this
    var localStorage = localStorage || false;
    if (!localStorage) { return; }
    try {
      localStorage[key] = value;
    } catch(e) {
      if (e.code == 22 || e.code == 1014) { // Webkit == 22 / Firefox == 1014
        // this.warning(VideoJS.warnings.localStorageFull);
      }
    }
  }
};

VideoJS.players = {};
/* Player API
================================================================================ */
VideoJS.fn.extend({

  apiCall: function(method, arg){
    if (this.isReady) {
      if (this.api[method]) {
        return this.api[method].call(this, arg);
      } else {
        throw new Error("The '"+method+"' method is not available on the playback technology's API");
      }
    } else {
      throw new Error("The playback technology API is not ready yet. Use player.ready(myFunction).");
    }
  },

  /* Listener types: play, pause, timeupdate, bufferedupdate, ended, volumechange, error */
  addEvent: function(type, fn){
    return _V_.addEvent(this.box, type, _V_.proxy(this, fn));
  },
  removeEvent: function(type, fn){
    return _V_.removeEvent(this.box, type, fn);
  },
  triggerEvent: function(type, e){
    return _V_.triggerEvent(this.box, type, e);
  },

  play: function(){
    this.apiCall("play"); return this;
  },
  pause: function(){
    this.apiCall("pause"); return this;
  },
  paused: function(){
    return this.apiCall("paused");
  },

  currentTime: function(seconds){
    if (seconds !== undefined) {
      this.values.currentTime = seconds; // Cache the last set value for smoother scrubbing.
      this.apiCall("setCurrentTime", seconds);
      if (this.manualTimeUpdates) { this.triggerEvent("timeupdate"); }
      return this;
    }
    return this.apiCall("currentTime");
  },
  duration: function(){
    return this.apiCall("duration");
  },
  remainingTime: function(){
    return this.duration() - this.currentTime();
  },

  buffered: function(){
    var buffered = this.apiCall("buffered"),
        start = 0, end = this.values.bufferEnd = this.values.bufferEnd || 0,
        timeRange;

    if (buffered && buffered.length > 0 && buffered.end(0) > end) {
      end = buffered.end(0);
      // Storing values allows them be overridden by setBufferedFromProgress
      this.values.bufferEnd = end;
    }

    return _V_.createTimeRange(start, end);
  },

  // Calculates amount of buffer is full
  bufferedPercent: function(){
    return (this.duration()) ? this.buffered().end(0) / this.duration() : 0;
  },

  volume: function(percentAsDecimal){
    if (percentAsDecimal !== undefined) {
      var vol = Math.max(0, Math.min(1, parseFloat(percentAsDecimal))); // Force value to between 0 and 1
      this.values.volume = vol;
      this.apiCall("setVolume", vol);
      this.setLocalStorage("volume", vol);
      return this;
    }
    // if (this.values.volume) { return this.values.volume; }
    return this.apiCall("volume");
  },
  muted: function(muted){
    if (muted !== undefined) {
      this.apiCall("setMuted", muted);
      return this;
    }
    return this.apiCall("muted");
  },

  width: function(width, skipListeners){
    if (width !== undefined) {
      this.box.width = width;
      this.box.style.width = width+"px";
      if (!skipListeners) { this.triggerEvent("resize"); }
      return this;
    }
    return parseInt(this.box.getAttribute("width"));
  },
  height: function(height){
    if (height !== undefined) {
      this.box.height = height;
      this.box.style.height = height+"px";
      this.triggerEvent("resize");
      return this;
    }
    return parseInt(this.box.getAttribute("height"));
  },
  size: function(width, height){
    // Skip resize listeners on width for optimization
    return this.width(width, true).height(height);
  },

  supportsFullScreen: function(){ return this.apiCall("supportsFullScreen"); },

  // Turn on fullscreen (or window) mode
  enterFullScreen: function(){
    if (false && this.supportsFullScreen()) {
      this.api("enterFullScreen");
    } else {
      this.enterFullWindow();
    }
    this.triggerEvent("enterFullScreen");
    return this;
  },

  exitFullScreen: function(){
    if (true || !this.supportsFullScreen()) {
      this.exitFullWindow();
    }
    this.triggerEvent("exitFullScreen");

    // Otherwise Shouldn't be called since native fullscreen uses own controls.
    return this;
  },

  enterFullWindow: function(){
    this.videoIsFullScreen = true;

    // Storing original doc overflow value to return to when fullscreen is off
    this.docOrigOverflow = document.documentElement.style.overflow;

    // Add listener for esc key to exit fullscreen
    _V_.addEvent(document, "keydown", _V_.proxy(this, this.fullscreenOnEscKey));

    // Add listener for a window resize
    _V_.addEvent(window, "resize", _V_.proxy(this, this.fullscreenOnWindowResize));

    // Hide any scroll bars
    document.documentElement.style.overflow = 'hidden';

    // Apply fullscreen styles
    _V_.addClass(document.body, "vjs-full-window");
    _V_.addClass(this.box, "vjs-fullscreen");

    this.triggerEvent("enterFullWindow");
  },

  exitFullWindow: function(){
    this.videoIsFullScreen = false;
    _V_.removeEvent(document, "keydown", this.fullscreenOnEscKey);
    _V_.removeEvent(window, "resize", this.fullscreenOnWindowResize);

    // Unhide scroll bars.
    document.documentElement.style.overflow = this.docOrigOverflow;

    // Remove fullscreen styles
    _V_.removeClass(document.body, "vjs-full-window");
    _V_.removeClass(this.box, "vjs-fullscreen");

    // Resize the box, controller, and poster to original sizes
    // this.positionAll();
    this.triggerEvent("exitFullWindow");
  },

  // src is a pretty powerful function
  // If you pass it an array of source objects, it will find the best source to play and use that object.src
  //   If the new source requires a new playback technology, it will switch to that.
  // If you pass it an object, it will set the source to object.src
  // If you pass it anything else (url string) it will set the video source to that
  src: function(source){
    // Case: Array of source objects to choose from and pick the best to play
    if (source instanceof Array) {
      techLoop: // Named loop for breaking both loops
      // Loop through each playback technology in the options order
      for (var i=0,j=this.options.techOrder;i<j.length;i++) {
        var techName = j[i],
            tech = _V_.tech[techName];

        // Check if the browser supports this technology
        if (tech.supported()) {

          // Loop through each source object
          for (var a=0,b=this.options.sources;a<b.length;a++) {
            var source = b[a];

            // Check if source can be played with this technology
            if (tech.canPlaySource.call(this, source)) {

              // If this technology is already loaded, set source
              if (techName == this.currentTechName) {
                this.src(source); // Passing the source object

              // Otherwise load this technology with chosen source
              } else {
                this.loadTech(techName, source);
              }

              break techLoop; // Break both loops
            }
          }
        }
      }

    // Case: Source object { src: "", type: "" ... }
    } else if (source instanceof Object) {
      this.src(source.src);

    // Case: URL String (http://myvideo...)
    } else {
      this.apiCall("src", source);
      this.load();
    }
    return this;
  },

  // Begin loading the src data
  load: function(){
    this.apiCall("load");
    return this;
  },
  currentSrc: function(){
    return this.apiCall("currentSrc");
  },

  textTrackValue: function(kind, value){
    if (value !== undefined) {
      this.values[kind] = value;
      this.triggerEvent(kind+"update");
      return this;
    }
    return this.values[kind];
  },

  // Attributes/Options
  preload: function(value){
    if (value !== undefined) {
      this.apiCall("setPreload", value);
      this.options.preload = value;
      return this;
    }
    return this.apiCall("preload", value);
  },
  autoplay: function(value){
    if (value !== undefined) {
      this.apiCall("setAutoplay", value);
      this.options.autoplay = value;
      return this;
    }
    return this.apiCall("autoplay", value);
  },
  loop: function(value){
    if (value !== undefined) {
      this.apiCall("setLoop", value);
      this.options.loop = value;
      return this;
    }
    return this.apiCall("loop", value);
  },

  controls: function(){ return this.options.controls; },
  textTracks: function(){ return this.options.tracks; },

  error: function(){ return this.apiCall("error"); },
  networkState: function(){ return this.apiCall("networkState"); },
  readyState: function(){ return this.apiCall("readyState"); },
  seeking: function(){ return this.apiCall("seeking"); },
  initialTime: function(){ return this.apiCall("initialTime"); },
  startOffsetTime: function(){ return this.apiCall("startOffsetTime"); },
  played: function(){ return this.apiCall("played"); },
  seekable: function(){ return this.apiCall("seekable"); },
  ended: function(){ return this.apiCall("ended"); },
  videoTracks: function(){ return this.apiCall("videoTracks"); },
  audioTracks: function(){ return this.apiCall("audioTracks"); },
  videoWidth: function(){ return this.apiCall("videoWidth"); },
  videoHeight: function(){ return this.apiCall("videoHeight"); },
  defaultPlaybackRate: function(){ return this.apiCall("defaultPlaybackRate"); },
  playbackRate: function(){ return this.apiCall("playbackRate"); },
  mediaGroup: function(){ return this.apiCall("mediaGroup"); },
  controller: function(){ return this.apiCall("controller"); },
  controls: function(){ return this.apiCall("controls"); },
  defaultMuted: function(){ return this.apiCall("defaultMuted"); }
});
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
// ECMA-262 is the standard for javascript.
// The following methods are impelemented EXACTLY as described in the standard (according to Mozilla Docs), and do not override the default method if one exists.
// This may conflict with other libraries that modify the array prototype, but those libs should update to use the standard.

// [].indexOf
// https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/indexOf
if (!Array.prototype.indexOf) {
    Array.prototype.indexOf = function (searchElement /*, fromIndex */ ) {
        "use strict";
        if (this === void 0 || this === null) {
            throw new TypeError();
        }
        var t = Object(this);
        var len = t.length >>> 0;
        if (len === 0) {
            return -1;
        }
        var n = 0;
        if (arguments.length > 0) {
            n = Number(arguments[1]);
            if (n !== n) { // shortcut for verifying if it's NaN
                n = 0;
            } else if (n !== 0 && n !== (1 / 0) && n !== -(1 / 0)) {
                n = (n > 0 || -1) * Math.floor(Math.abs(n));
            }
        }
        if (n >= len) {
            return -1;
        }
        var k = n >= 0 ? n : Math.max(len - Math.abs(n), 0);
        for (; k < len; k++) {
            if (k in t && t[k] === searchElement) {
                return k;
            }
        }
        return -1;
    }
}

// NOT NEEDED YET
// [].lastIndexOf
// https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/lastIndexOf
// if (!Array.prototype.lastIndexOf)
// {
//   Array.prototype.lastIndexOf = function(searchElement /*, fromIndex*/)
//   {
//     "use strict";
// 
//     if (this === void 0 || this === null)
//       throw new TypeError();
// 
//     var t = Object(this);
//     var len = t.length >>> 0;
//     if (len === 0)
//       return -1;
// 
//     var n = len;
//     if (arguments.length > 1)
//     {
//       n = Number(arguments[1]);
//       if (n !== n)
//         n = 0;
//       else if (n !== 0 && n !== (1 / 0) && n !== -(1 / 0))
//         n = (n > 0 || -1) * Math.floor(Math.abs(n));
//     }
// 
//     var k = n >= 0
//           ? Math.min(n, len - 1)
//           : len - Math.abs(n);
// 
//     for (; k >= 0; k--)
//     {
//       if (k in t && t[k] === searchElement)
//         return k;
//     }
//     return -1;
//   };
// }


// NOT NEEDED YET
// Array forEach per ECMA standard https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/array/foreach
// Production steps of ECMA-262, Edition 5, 15.4.4.18
// Reference: http://es5.github.com/#x15.4.4.18
// if ( !Array.prototype.forEach ) {
// 
//   Array.prototype.forEach = function( callback, thisArg ) {
// 
//     var T, k;
// 
//     if ( this == null ) {
//       throw new TypeError( " this is null or not defined" );
//     }
// 
//     // 1. Let O be the result of calling ToObject passing the |this| value as the argument.
//     var O = Object(this);
// 
//     // 2. Let lenValue be the result of calling the Get internal method of O with the argument "length".
//     // 3. Let len be ToUint32(lenValue).
//     var len = O.length >>> 0;
// 
//     // 4. If IsCallable(callback) is false, throw a TypeError exception.
//     // See: http://es5.github.com/#x9.11
//     if ( {}.toString.call(callback) != "[object Function]" ) {
//       throw new TypeError( callback + " is not a function" );
//     }
// 
//     // 5. If thisArg was supplied, let T be thisArg; else let T be undefined.
//     if ( thisArg ) {
//       T = thisArg;
//     }
// 
//     // 6. Let k be 0
//     k = 0;
// 
//     // 7. Repeat, while k < len
//     while( k < len ) {
// 
//       var kValue;
// 
//       // a. Let Pk be ToString(k).
//       //   This is implicit for LHS operands of the in operator
//       // b. Let kPresent be the result of calling the HasProperty internal method of O with argument Pk.
//       //   This step can be combined with c
//       // c. If kPresent is true, then
//       if ( k in O ) {
// 
//         // i. Let kValue be the result of calling the Get internal method of O with argument Pk.
//         kValue = O[ Pk ];
// 
//         // ii. Call the Call internal method of callback with T as the this value and
//         // argument list containing kValue, k, and O.
//         callback.call( T, kValue, k, O );
//       }
//       // d. Increase k by 1.
//       k++;
//     }
//     // 8. return undefined
//   };
// }


// NOT NEEDED YET
// https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/map
// Production steps of ECMA-262, Edition 5, 15.4.4.19
// Reference: http://es5.github.com/#x15.4.4.19
// if (!Array.prototype.map) {
//   Array.prototype.map = function(callback, thisArg) {
// 
//     var T, A, k;
// 
//     if (this == null) {
//       throw new TypeError(" this is null or not defined");
//     }
// 
//     // 1. Let O be the result of calling ToObject passing the |this| value as the argument.
//     var O = Object(this);
// 
//     // 2. Let lenValue be the result of calling the Get internal method of O with the argument "length".
//     // 3. Let len be ToUint32(lenValue).
//     var len = O.length >>> 0;
// 
//     // 4. If IsCallable(callback) is false, throw a TypeError exception.
//     // See: http://es5.github.com/#x9.11
//     if ({}.toString.call(callback) != "[object Function]") {
//       throw new TypeError(callback + " is not a function");
//     }
// 
//     // 5. If thisArg was supplied, let T be thisArg; else let T be undefined.
//     if (thisArg) {
//       T = thisArg;
//     }
// 
//     // 6. Let A be a new array created as if by the expression new Array(len) where Array is
//     // the standard built-in constructor with that name and len is the value of len.
//     A = new Array(len);
// 
//     // 7. Let k be 0
//     k = 0;
// 
//     // 8. Repeat, while k < len
//     while(k < len) {
// 
//       var kValue, mappedValue;
// 
//       // a. Let Pk be ToString(k).
//       //   This is implicit for LHS operands of the in operator
//       // b. Let kPresent be the result of calling the HasProperty internal method of O with argument Pk.
//       //   This step can be combined with c
//       // c. If kPresent is true, then
//       if (k in O) {
// 
//         // i. Let kValue be the result of calling the Get internal method of O with argument Pk.
//         kValue = O[ k ];
// 
//         // ii. Let mappedValue be the result of calling the Call internal method of callback
//         // with T as the this value and argument list containing kValue, k, and O.
//         mappedValue = callback.call(T, kValue, k, O);
// 
//         // iii. Call the DefineOwnProperty internal method of A with arguments
//         // Pk, Property Descriptor {Value: mappedValue, Writable: true, Enumerable: true, Configurable: true},
//         // and false.
// 
//         // In browsers that support Object.defineProperty, use the following:
//         // Object.defineProperty(A, Pk, { value: mappedValue, writable: true, enumerable: true, configurable: true });
// 
//         // For best browser support, use the following:
//         A[ k ] = mappedValue;
//       }
//       // d. Increase k by 1.
//       k++;
//     }
// 
//     // 9. return A
//     return A;
//   };      
// }
// Javascript JSON implementation
// (Parse Method Only)
// https://github.com/douglascrockford/JSON-js/blob/master/json2.js

var JSON;
if (!JSON) { JSON = {}; }

(function(){
  var cx = /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g;

  if (typeof JSON.parse !== 'function') {
      JSON.parse = function (text, reviver) {
          var j;

          function walk(holder, key) {
              var k, v, value = holder[key];
              if (value && typeof value === 'object') {
                  for (k in value) {
                      if (Object.prototype.hasOwnProperty.call(value, k)) {
                          v = walk(value, k);
                          if (v !== undefined) {
                              value[k] = v;
                          } else {
                              delete value[k];
                          }
                      }
                  }
              }
              return reviver.call(holder, key, value);
          }
          text = String(text);
          cx.lastIndex = 0;
          if (cx.test(text)) {
              text = text.replace(cx, function (a) {
                  return '\\u' +
                      ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
              });
          }

          if (/^[\],:{}\s]*$/
                  .test(text.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g, '@')
                      .replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']')
                      .replace(/(?:^|:|,)(?:\s*\[)+/g, ''))) {

              j = eval('(' + text + ')');

              return typeof reviver === 'function' ?
                  walk({'': j}, '') : j;
          }

          throw new SyntaxError('JSON.parse');
      };
  }
}());
// Event System (J.Resig - Secrets of a JS Ninja http://jsninja.com/ [Go buy it, really])
// (Book version isn't completely usable, so fixed some things and borrowed from jQuery where it's working)
// 
// This should work very similarly to jQuery's events, however it's based off the book version which isn't as
// robust as jquery's, so there's probably some differences.
// 
// When you add an event listener using _V_.addEvent, 
//   it stores the handler function in seperate cache object, 
//   and adds a generic handler to the element's event,
//   along with a unique id (guid) to the element.

_V_.extend({

  // Add an event listener to element
  // It stores the handler function in a separate cache object
  // and adds a generic handler to the element's event,
  // along with a unique id (guid) to the element.
  addEvent: function(elem, type, fn){
    var data = _V_.getData(elem), handlers;

    // We only need to generate one handler per element
    if (data && !data.handler) {
      // Our new meta-handler that fixes the event object and the context
      data.handler = function(event){
        event = _V_.fixEvent(event);
        var handlers = _V_.getData(elem).events[event.type];
        // Go through and call all the real bound handlers
        if (handlers) {
          
          // Copy handlers so if handlers are added/removed during the process it doesn't throw everything off.
          var handlersCopy = [];
          _V_.each(handlers, function(handler, i){
            handlersCopy[i] = handler;
          })
          
          for (var i = 0, l = handlersCopy.length; i < l; i++) {
            handlersCopy[i].call(elem, event);
          }
        }
      };
    }

    // We need a place to store all our event data
    if (!data.events) { data.events = {}; }

    // And a place to store the handlers for this event type
    handlers = data.events[type];

    if (!handlers) {
      handlers = data.events[ type ] = [];

      // Attach our meta-handler to the element, since one doesn't exist
      if (document.addEventListener) {
        elem.addEventListener(type, data.handler, false);
      } else if (document.attachEvent) {
        elem.attachEvent("on" + type, data.handler);
      }
    }

    if (!fn.guid) { fn.guid = _V_.guid++; }

    handlers.push(fn);
  },

  removeEvent: function(elem, type, fn) {
    var data = _V_.getData(elem), handlers;
    // If no events exist, nothing to unbind
    if (!data.events) { return; }

    // Are we removing all bound events?
    if (!type) {
      for (type in data.events) {
        _V_.cleanUpEvents(elem, type);
      }
      return;
    }

    // And a place to store the handlers for this event type
    handlers = data.events[type];

    // If no handlers exist, nothing to unbind
    if (!handlers) { return; }

    // See if we're only removing a single handler
    if (fn && fn.guid) {
      for (var i = 0; i < handlers.length; i++) {
        // We found a match (don't stop here, there could be a couple bound)
        if (handlers[i].guid === fn.guid) {
          // Remove the handler from the array of handlers
          handlers.splice(i--, 1);
        }
      }
    }

    _V_.cleanUpEvents(elem, type);
  },

  cleanUpEvents: function(elem, type) {
    var data = _V_.getData(elem);
    // Remove the events of a particular type if there are none left

    if (data.events[type].length === 0) {
      delete data.events[type];

      // Remove the meta-handler from the element
      if (document.removeEventListener) {
        elem.removeEventListener(type, data.handler, false);
      } else if (document.detachEvent) {
        elem.detachEvent("on" + type, data.handler);
      }
    }

    // Remove the events object if there are no types left
    if (_V_.isEmpty(data.events)) {
      delete data.events;
      delete data.handler;
    }

    // Finally remove the expando if there is no data left
    if (_V_.isEmpty(data)) {
      _V_.removeData(elem);
    }
  },

  fixEvent: function(event) {
    if (event[_V_.expando]) { return event; }
    // store a copy of the original event object
    // and "clone" to set read-only properties
    var originalEvent = event;
    event = new _V_.Event(originalEvent);

    for ( var i = _V_.Event.props.length, prop; i; ) {
      prop = _V_.Event.props[ --i ];
      event[prop] = originalEvent[prop];
    }

    // Fix target property, if necessary
    if (!event.target) { event.target = event.srcElement || document; }

    // check if target is a textnode (safari)
    if (event.target.nodeType === 3) { event.target = event.target.parentNode; }

    // Add relatedTarget, if necessary
    if (!event.relatedTarget && event.fromElement) {
      event.relatedTarget = event.fromElement === event.target ? event.toElement : event.fromElement;
    }

    // Calculate pageX/Y if missing and clientX/Y available
    if ( event.pageX == null && event.clientX != null ) {
      var eventDocument = event.target.ownerDocument || document,
        doc = eventDocument.documentElement,
        body = eventDocument.body;

      event.pageX = event.clientX + (doc && doc.scrollLeft || body && body.scrollLeft || 0) - (doc && doc.clientLeft || body && body.clientLeft || 0);
      event.pageY = event.clientY + (doc && doc.scrollTop  || body && body.scrollTop  || 0) - (doc && doc.clientTop  || body && body.clientTop  || 0);
    }

    // Add which for key events
    if (event.which == null && (event.charCode != null || event.keyCode != null)) {
      event.which = event.charCode != null ? event.charCode : event.keyCode;
    }

    // Add metaKey to non-Mac browsers (use ctrl for PC's and Meta for Macs)
    if ( !event.metaKey && event.ctrlKey ) {
      event.metaKey = event.ctrlKey;
    }

    // Add which for click: 1 === left; 2 === middle; 3 === right
    // Note: button is not normalized, so don't use it
    if ( !event.which && event.button !== undefined ) {
      event.which = (event.button & 1 ? 1 : ( event.button & 2 ? 3 : ( event.button & 4 ? 2 : 0 ) ));
    }

    return event;
  },

  triggerEvent: function(elem, event) {
    var data = _V_.getData(elem),
        parent = elem.parentNode || elem.ownerDocument,
        type = event.type || event,
        handler;

    if (data) { handler = data.handler }

    // Added in attion to book. Book code was broke.
    event = typeof event === "object" ?
      event[_V_.expando] ? 
        event :
        new _V_.Event(type, event) :
      new _V_.Event(type);

    event.type = type;
    if (handler) {
      handler.call(elem, event);
    }

    // Clean up the event in case it is being reused
    event.result = undefined;
    event.target = elem;

    // Bubble the event up the tree to the document,
    // Unless it's been explicitly stopped
    // if (parent && !event.isPropagationStopped()) {
    //   _V_.triggerEvent(parent, event);
    // 
    // // We're at the top document so trigger the default action
    // } else if (!parent && !event.isDefaultPrevented()) {
    //   // log(type);
    //   var targetData = _V_.getData(event.target);
    //   // log(targetData);
    //   var targetHandler = targetData.handler;
    //   // log("2");
    //   if (event.target[event.type]) {
    //     // Temporarily disable the bound handler,
    //     // don't want to execute it twice
    //     if (targetHandler) {
    //       targetData.handler = function(){};
    //     }
    // 
    //     // Trigger the native event (click, focus, blur)
    //     event.target[event.type]();
    // 
    //     // Restore the handler
    //     if (targetHandler) {
    //       targetData.handler = targetHandler;
    //     }
    //   }
    // }
  }
});

// Custom Event object for standardizing event objects between browsers.
_V_.Event = function(src, props){
  // Event object
  if (src && src.type) {
    this.originalEvent = src;
    this.type = src.type;

    // Events bubbling up the document may have been marked as prevented
    // by a handler lower down the tree; reflect the correct value.
    this.isDefaultPrevented = (src.defaultPrevented || src.returnValue === false ||
      src.getPreventDefault && src.getPreventDefault()) ? returnTrue : returnFalse;

  // Event type
  } else {
    this.type = src;
  }

  // Put explicitly provided properties onto the event object
  if (props) { _V_.merge(this, props); }

  this.timeStamp = (new Date).getTime();

  // Mark it as fixed
  this[_V_.expando] = true;
};

_V_.Event.prototype = {
  preventDefault: function() {
    this.isDefaultPrevented = returnTrue;

    var e = this.originalEvent;
    if (!e) { return; }

    // if preventDefault exists run it on the original event
    if (e.preventDefault) { 
      e.preventDefault();
    // otherwise set the returnValue property of the original event to false (IE)
    } else {
      e.returnValue = false;
    }
  },
  stopPropagation: function() {
    this.isPropagationStopped = returnTrue;

    var e = this.originalEvent;
    if (!e) { return; }
    // if stopPropagation exists run it on the original event
    if (e.stopPropagation) { e.stopPropagation(); }
    // otherwise set the cancelBubble property of the original event to true (IE)
    e.cancelBubble = true;
  },
  stopImmediatePropagation: function() {
    this.isImmediatePropagationStopped = returnTrue;
    this.stopPropagation();
  },
  isDefaultPrevented: returnFalse,
  isPropagationStopped: returnFalse,
  isImmediatePropagationStopped: returnFalse
};
_V_.Event.props = "altKey attrChange attrName bubbles button cancelable charCode clientX clientY ctrlKey currentTarget data detail eventPhase fromElement handler keyCode layerX layerY metaKey newValue offsetX offsetY pageX pageY prevValue relatedNode relatedTarget screenX screenY shiftKey srcElement target toElement view wheelDelta which".split(" ");

function returnTrue(){ return true; }
function returnFalse(){ return false; }
_V_.Track = function(attributes, player){
  // Store reference to the parent player
  this.player = player;

  this.src = attributes.src;
  this.kind = attributes.kind;
  this.srclang = attributes.srclang;
  this.label = attributes.label;
  this["default"] = attributes["default"];
  this.title = attributes.title;

  this.cues = [];
  this.currentCue = false;
  this.lastCueIndex = 0;

  // Update current cue on timeupdate
  player.addEvent("timeupdate", _V_.proxy(this, this.update))
  // Reset cue time on media end
  player.addEvent("ended", _V_.proxy(this, function() { this.lastCueIndex = 0; }));

  // Load Track File
  _V_.get(attributes.src, _V_.proxy(this, this.parseCues));
};

_V_.Track.prototype = {

  parseCues: function(srcContent) {
    var cue, time, text,
        lines = srcContent.split("\n"),
        line = "";

    for (var i=0; i<lines.length; i++) {
      line = _V_.trim(lines[i]); // Trim whitespace and linebreaks
      if (line) { // Loop until a line with content

        // First line - Number
        cue = {
          id: line, // Cue Number
          index: this.cues.length // Position in Array
        };

        // Second line - Time
        line = _V_.trim(lines[++i]);
        time = line.split(" --> ");
        cue.startTime = this.parseCueTime(time[0]);
        cue.endTime = this.parseCueTime(time[1]);

        // Additional lines - Cue Text
        text = [];
        for (var j=i; j<lines.length; j++) { // Loop until a blank line or end of lines
          line = _V_.trim(lines[++i]);
          if (!line) { break; }
          text.push(line);
        }
        cue.text = text.join('<br/>');

        // Add this cue
        this.cues.push(cue);
      }
    }
  },

  parseCueTime: function(timeText) {
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

  update: function(){
    // Assuming all cues are in order by time, and do not overlap
    if (this.cues && this.cues.length > 0) {
      var time = this.player.currentTime();
      // If current cue should stay showing, don't do anything. Otherwise, find new cue.
      if (!this.currentCue || this.currentCue.startTime >= time || this.currentCue.endTime < time) {
        var newSubIndex = false,
          // Loop in reverse if lastCue is after current time (optimization)
          // Meaning the user is scrubbing in reverse or rewinding
          reverse = (this.cues[this.lastCueIndex].startTime > time),
          // If reverse, step back 1 becase we know it's not the lastCue
          i = this.lastCueIndex - (reverse) ? 1 : 0;
        while (true) { // Loop until broken
          if (reverse) { // Looping in reverse
            // Stop if no more, or this cue ends before the current time (no earlier cues should apply)
            if (i < 0 || this.cues[i].endTime < time) { break; }
            // End is greater than time, so if start is less, show this cue
            if (this.cues[i].startTime < time) {
              newSubIndex = i;
              break;
            }
            i--;
          } else { // Looping forward
            // Stop if no more, or this cue starts after time (no later cues should apply)
            if (i >= this.cues.length || this.cues[i].startTime > time) { break; }
            // Start is less than time, so if end is later, show this cue
            if (this.cues[i].endTime > time) {
              newSubIndex = i;
              break;
            }
            i++;
          }
        }

        // Set or clear current cue
        if (newSubIndex !== false) {
          this.currentCue = this.cues[newSubIndex];
          this.lastCueIndex = newSubIndex;
          this.updatePlayer(this.currentCue.text);
        } else if (this.currentCue) {
          this.currentCue = false;
          this.updatePlayer("");
        }
      }
    }
  },

  // Update the stored value for the current track kind
  // and trigger an event to update all text track displays.
  updatePlayer: function(text){
    this.player.textTrackValue(this.kind, text);
  }
};
// Setup an API for the HTML5 playback technology
VideoJS.tech.html5 = {
  supported: function(){
    return !!document.createElement("video").canPlayType;
  },
  canPlaySource: function(srcObj){
    return this.tag.canPlayType(srcObj.type); // Switch to global check
    // Check Type
    // If no Type, check ext
    // Check Media Type
  },
  init: function(sourceObj){
    var tag = this.tag, // Reuse original tag for HTML5 playback technology element
        html5 = _V_.tech.html5,
        options = this.options;

    // Check if this browser supports moving the element into the box.
    // On the iPhone video will break if you move the element,
    // So we have to create a brand new element.
    if (html5.supports.movingElementInDOM === false) {
      var newTag = _V_.createElement("video", {
        id: tag.id,
        className: tag.className
      });

      this.box.removeChild(this.tag);
      tag = this.tag = newTag;
      this.box.appendChild(tag);
    }

    // Store reference to playback element
    this.tels.html5 = tag;

    // Update tag settings, in case they were overridden
    _V_.each(["autoplay","preload","loop","muted","poster"], function(attr){
      tag[attr] = options[attr];
    }, this);

    if (tag.currentSrc != sourceObj.src) {
      tag.src = sourceObj.src;
    } else {
      this.triggerEvent("loadstart");
    }
    this.triggerEvent("techready");
  },
  supports: {
    /* Will hold support info as it's discovered */
  },
  api: {
    setupTriggers: function(){
      // Make video events trigger player events
      // May seem verbose here, but makes other APIs possible.

      // ["play", "playing", "pause", "ended", "volumechange", "error", "progress", "seeking", "timeupdate"]
      var types = _V_.html5Events,
          i;
      for (i = 0;i<types.length; i++) {
        _V_.addEvent(this.tels.html5, types[i], _V_.proxy(this, function(e){
          e.stopPropagation();
          this.triggerEvent(e);
        }));
      }
    },
    removeTriggers: function(){},

    play: function(){ this.tels.html5.play(); },
    pause: function(){ this.tels.html5.pause(); },
    paused: function(){ return this.tels.html5.paused; },

    currentTime: function(){ return this.tels.html5.currentTime; },
    setCurrentTime: function(seconds){
      try { this.tels.html5.currentTime = seconds; }
      catch(e) {
        _V_.log(e);
        // this.warning(VideoJS.warnings.videoNotReady); 
      }
    },

    duration: function(){ return this.tels.html5.duration || 0; },
    buffered: function(){ return this.tels.html5.buffered; },

    volume: function(){ return this.tels.html5.volume; },
    setVolume: function(percentAsDecimal){ this.tels.html5.volume = percentAsDecimal; },
    muted: function(){ return this.tels.html5.muted; },
    setMuted: function(muted){ this.tels.html5.muted = muted },

    width: function(){ return this.tels.html5.offsetWidth; },
    height: function(){ return this.tels.html5.offsetHeight; },

    supportsFullScreen: function(){
      if(typeof this.tels.html5.webkitEnterFullScreen == 'function') {
        // Seems to be broken in Chromium/Chrome && Safari in Leopard
        if (!navigator.userAgent.match("Chrome") && !navigator.userAgent.match("Mac OS X 10.5")) {
          return true;
        }
      }
      return false;
    },
    enterFullScreen: function(){
      try {
        this.tels.html5.webkitEnterFullScreen();
      } catch (e) {
        if (e.code == 11) { this.warning(VideoJS.warnings.videoNotReady); }
      }
    },
    src: function(src){ this.tels.html5.src = src; },
    load: function(){ this.tels.html5.load(); },
    currentSrc: function(){ return this.tels.html5.currentSrc; },

    preload: function(){ return this.tels.html5.preload; },
    setPreload: function(val){ this.tels.html5.preload = val; },
    autoplay: function(){ return this.tels.html5.autoplay; },
    setAutoplay: function(val){ this.tels.html5.autoplay = val; },
    loop: function(){ return this.tels.html5.loop; },
    setLoop: function(val){ this.tels.html5.loop = val; },

    error: function(){ return this.tels.html5.error; },
    networkState: function(){ return this.tels.html5.networkState; },
    readyState: function(){ return this.tels.html5.readyState; },
    seeking: function(){ return this.tels.html5.seeking; },
    initialTime: function(){ return this.tels.html5.initialTime; },
    startOffsetTime: function(){ return this.tels.html5.startOffsetTime; },
    played: function(){ return this.tels.html5.played; },
    seekable: function(){ return this.tels.html5.seekable; },
    ended: function(){ return this.tels.html5.ended; },
    videoTracks: function(){ return this.tels.html5.videoTracks; },
    audioTracks: function(){ return this.tels.html5.audioTracks; },
    videoWidth: function(){ return this.tels.html5.videoWidth; },
    videoHeight: function(){ return this.tels.html5.videoHeight; },
    textTracks: function(){ return this.tels.html5.textTracks; },
    defaultPlaybackRate: function(){ return this.tels.html5.defaultPlaybackRate; },
    playbackRate: function(){ return this.tels.html5.playbackRate; },
    mediaGroup: function(){ return this.tels.html5.mediaGroup; },
    controller: function(){ return this.tels.html5.controller; },
    controls: function(){ return this.tels.html5.controls; },
    defaultMuted: function(){ return this.tels.html5.defaultMuted; }
  }
};

/* Device Fixes
================================================================================ */
// iOS
if (_V_.isIOS()) {
  // If you move a video element in the DOM, it breaks video playback.
  _V_.tech.supports.movingElementInDOM = false;
}

// Android
if (_V_.isAndroid()) {

  // Override Android 2.2 and less canPlayType method which is broken
  if (_V_.androidVersion() < 3) {
    document.createElement("video").constructor.prototype.canPlayType = function(type){
      return (type && type.toLowerCase().indexOf("video/mp4") != -1) ? "maybe" : "";
    };
  }
}
// Flowplayer API Connector
VideoJS.tech.flowplayer = {
  supported: function(){
    if (flowplayer) { 
      return true;
    } else {
      return false;
    }
  },
  canPlaySource: function(sourceObj){
    if (sourceObj.type in _V_.tech.flowplayer.supports.format) { return "maybe"; }
  },
  supports: {
    format: {
      "video/flv": "FLV",
      "video/x-flv": "FLV",
      "video/mp4": "MP4",
      "video/m4v": "MP4"
    },
    
    // Optional events that we can manually mimic with timers
    event: {
      progress: false,
      timeupdate: false
    }
  },
  init: function(sourceObj){
    var player = this;
    flowplayer(
      this.box.id, // Where it will put the swf object inside of
      {
        src: 'http://releases.flowplayer.org/swf/flowplayer-3.2.5.swf', 
        wmode: 'opaque'
      },
      {
        clip: { 
          url: sourceObj.src, 
          autoPlay: false, 
          scaling: "fit",
          onBegin: _V_.proxy(this, function(){
            this.triggerEvent("loadstart");
          })
        },
        autoPlay: true,
        onLoad: function() {
          player.tels.flowplayer = document.getElementById(player.box.id+"_api");
          player.tels.flowplayer.className = "vjs-tech";
          player.tels.flowplayer.api = this; // Need to re-establish API on object
          player.triggerEvent("techready");
        },
        // Hide Flowplayer's big play button
        play: {opacity: 0},
        // Hide Flowplayer's controls
        plugins: { controls: { autoHide: "always" } },
        plugins:  { controls: null }
      }
    );
  },
  api: {
    setupTriggers: function(){
      // Map flowplayer events to video.js events
      var map = [
        { f:"onStart", v:"play" },
        { f:"onResume", v:"play" },
        { f:"onPause", v:"pause" },
        { f:"onVolume", v:"volumechange" },
        { f:"onError", v:"error" }
      ];
      _V_.each(map, _V_.proxy(this, function(item){
        this.tels.flowplayer.api[item.f](_V_.proxy(this, function(e){ this.triggerEvent(item.v, e); }));
      }));
    },

    play: function(){ this.tels.flowplayer.api.play(); },
    pause: function(){ this.tels.flowplayer.api.pause(); },
    paused: function(){ 
      return !this.tels.flowplayer.api.isPlaying(); // More accurate than isPaused
    },

    currentTime: function(){ return this.tels.flowplayer.api.getTime(); },
    setCurrentTime: function(seconds){ this.tels.flowplayer.api.seek(seconds); },

    duration: function(){
      var clip = this.tels.flowplayer.api.getClip();
      return (clip) ? clip.duration : 0;
    },

    buffered: function(){
      var status = this.tels.flowplayer.api.getStatus();
      return _V_.createTimeRange(status.bufferStart, status.bufferEnd);
    },

    volume: function(){ return _V_.round(this.tels.flowplayer.api.getVolume() / 100, 2); },
    setVolume: function(percentAsDecimal){ this.tels.flowplayer.api.setVolume(parseInt(percentAsDecimal * 100)); },
    muted: function(){ return this.volume() == 0; },
    setMuted: function(bool){
      if (bool) {
        this.values.mutedVol = this.volume();
        this.volume(0);
      } else {
        this.volume(this.values.mutedVol);
      }
    },

    supportsFullScreen: function(){
      return false; // Flash does not allow fullscreen through javascript
      // Maybe at click listener, and say "click screen".
    },
    enterFullScreen: function(){ this.tels.flowplayer.api.toggleFullscreen(); },

    readError: function(eventArguments){
      var errorCode = arguments[0],
          errorMessage = arguments[1];
      return errorMessage;
    },

    src: function(src){
      this.setClip(src);
    },
    load: function(){
      // Flowplayer always auto loads
    }
  }
};


/* 
 * flowplayer.js 3.2.4. The Flowplayer API
 * 
 * Copyright 2009 Flowplayer Oy
 * 
 * This file is part of Flowplayer.
 * 
 * Flowplayer is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * Flowplayer is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU General Public License
 * along with Flowplayer.  If not, see <http://www.gnu.org/licenses/>.
 * 
 * Date: 2010-08-25 12:48:46 +0000 (Wed, 25 Aug 2010)
 * Revision: 551 
 */
(function(){function g(o){console.log("$f.fireEvent",[].slice.call(o))}function k(q){if(!q||typeof q!="object"){return q}var o=new q.constructor();for(var p in q){if(q.hasOwnProperty(p)){o[p]=k(q[p])}}return o}function m(t,q){if(!t){return}var o,p=0,r=t.length;if(r===undefined){for(o in t){if(q.call(t[o],o,t[o])===false){break}}}else{for(var s=t[0];p<r&&q.call(s,p,s)!==false;s=t[++p]){}}return t}function c(o){return document.getElementById(o)}function i(q,p,o){if(typeof p!="object"){return q}if(q&&p){m(p,function(r,s){if(!o||typeof s!="function"){q[r]=s}})}return q}function n(s){var q=s.indexOf(".");if(q!=-1){var p=s.slice(0,q)||"*";var o=s.slice(q+1,s.length);var r=[];m(document.getElementsByTagName(p),function(){if(this.className&&this.className.indexOf(o)!=-1){r.push(this)}});return r}}function f(o){o=o||window.event;if(o.preventDefault){o.stopPropagation();o.preventDefault()}else{o.returnValue=false;o.cancelBubble=true}return false}function j(q,o,p){q[o]=q[o]||[];q[o].push(p)}function e(){return"_"+(""+Math.random()).slice(2,10)}var h=function(t,r,s){var q=this,p={},u={};q.index=r;if(typeof t=="string"){t={url:t}}i(this,t,true);m(("Begin*,Start,Pause*,Resume*,Seek*,Stop*,Finish*,LastSecond,Update,BufferFull,BufferEmpty,BufferStop").split(","),function(){var v="on"+this;if(v.indexOf("*")!=-1){v=v.slice(0,v.length-1);var w="onBefore"+v.slice(2);q[w]=function(x){j(u,w,x);return q}}q[v]=function(x){j(u,v,x);return q};if(r==-1){if(q[w]){s[w]=q[w]}if(q[v]){s[v]=q[v]}}});i(this,{onCuepoint:function(x,w){if(arguments.length==1){p.embedded=[null,x];return q}if(typeof x=="number"){x=[x]}var v=e();p[v]=[x,w];if(s.isLoaded()){s._api().fp_addCuepoints(x,r,v)}return q},update:function(w){i(q,w);if(s.isLoaded()){s._api().fp_updateClip(w,r)}var v=s.getConfig();var x=(r==-1)?v.clip:v.playlist[r];i(x,w,true)},_fireEvent:function(v,y,w,A){if(v=="onLoad"){m(p,function(B,C){if(C[0]){s._api().fp_addCuepoints(C[0],r,B)}});return false}A=A||q;if(v=="onCuepoint"){var z=p[y];if(z){return z[1].call(s,A,w)}}if(y&&"onBeforeBegin,onMetaData,onStart,onUpdate,onResume".indexOf(v)!=-1){i(A,y);if(y.metaData){if(!A.duration){A.duration=y.metaData.duration}else{A.fullDuration=y.metaData.duration}}}var x=true;m(u[v],function(){x=this.call(s,A,y,w)});return x}});if(t.onCuepoint){var o=t.onCuepoint;q.onCuepoint.apply(q,typeof o=="function"?[o]:o);delete t.onCuepoint}m(t,function(v,w){if(typeof w=="function"){j(u,v,w);delete t[v]}});if(r==-1){s.onCuepoint=this.onCuepoint}};var l=function(p,r,q,t){var o=this,s={},u=false;if(t){i(s,t)}m(r,function(v,w){if(typeof w=="function"){s[v]=w;delete r[v]}});i(this,{animate:function(y,z,x){if(!y){return o}if(typeof z=="function"){x=z;z=500}if(typeof y=="string"){var w=y;y={};y[w]=z;z=500}if(x){var v=e();s[v]=x}if(z===undefined){z=500}r=q._api().fp_animate(p,y,z,v);return o},css:function(w,x){if(x!==undefined){var v={};v[w]=x;w=v}r=q._api().fp_css(p,w);i(o,r);return o},show:function(){this.display="block";q._api().fp_showPlugin(p);return o},hide:function(){this.display="none";q._api().fp_hidePlugin(p);return o},toggle:function(){this.display=q._api().fp_togglePlugin(p);return o},fadeTo:function(y,x,w){if(typeof x=="function"){w=x;x=500}if(w){var v=e();s[v]=w}this.display=q._api().fp_fadeTo(p,y,x,v);this.opacity=y;return o},fadeIn:function(w,v){return o.fadeTo(1,w,v)},fadeOut:function(w,v){return o.fadeTo(0,w,v)},getName:function(){return p},getPlayer:function(){return q},_fireEvent:function(w,v,x){if(w=="onUpdate"){var z=q._api().fp_getPlugin(p);if(!z){return}i(o,z);delete o.methods;if(!u){m(z.methods,function(){var B=""+this;o[B]=function(){var C=[].slice.call(arguments);var D=q._api().fp_invoke(p,B,C);return D==="undefined"||D===undefined?o:D}});u=true}}var A=s[w];if(A){var y=A.apply(o,v);if(w.slice(0,1)=="_"){delete s[w]}return y}return o}})};function b(q,G,t){var w=this,v=null,D=false,u,s,F=[],y={},x={},E,r,p,C,o,A;i(w,{id:function(){return E},isLoaded:function(){return(v!==null&&v.fp_play!==undefined&&!D)},getParent:function(){return q},hide:function(H){if(H){q.style.height="0px"}if(w.isLoaded()){v.style.height="0px"}return w},show:function(){q.style.height=A+"px";if(w.isLoaded()){v.style.height=o+"px"}return w},isHidden:function(){return w.isLoaded()&&parseInt(v.style.height,10)===0},load:function(J){if(!w.isLoaded()&&w._fireEvent("onBeforeLoad")!==false){var H=function(){u=q.innerHTML;if(u&&!flashembed.isSupported(G.version)){q.innerHTML=""}if(J){J.cached=true;j(x,"onLoad",J)}flashembed(q,G,{config:t})};var I=0;m(a,function(){this.unload(function(K){if(++I==a.length){H()}})})}return w},unload:function(J){if(this.isFullscreen()&&/WebKit/i.test(navigator.userAgent)){if(J){J(false)}return w}if(u.replace(/\s/g,"")!==""){if(w._fireEvent("onBeforeUnload")===false){if(J){J(false)}return w}D=true;try{if(v){v.fp_close();w._fireEvent("onUnload")}}catch(H){}var I=function(){v=null;q.innerHTML=u;D=false;if(J){J(true)}};setTimeout(I,50)}else{if(J){J(false)}}return w},getClip:function(H){if(H===undefined){H=C}return F[H]},getCommonClip:function(){return s},getPlaylist:function(){return F},getPlugin:function(H){var J=y[H];if(!J&&w.isLoaded()){var I=w._api().fp_getPlugin(H);if(I){J=new l(H,I,w);y[H]=J}}return J},getScreen:function(){return w.getPlugin("screen")},getControls:function(){return w.getPlugin("controls")._fireEvent("onUpdate")},getLogo:function(){try{return w.getPlugin("logo")._fireEvent("onUpdate")}catch(H){}},getPlay:function(){return w.getPlugin("play")._fireEvent("onUpdate")},getConfig:function(H){return H?k(t):t},getFlashParams:function(){return G},loadPlugin:function(K,J,M,L){if(typeof M=="function"){L=M;M={}}var I=L?e():"_";w._api().fp_loadPlugin(K,J,M,I);var H={};H[I]=L;var N=new l(K,null,w,H);y[K]=N;return N},getState:function(){return w.isLoaded()?v.fp_getState():-1},play:function(I,H){var J=function(){if(I!==undefined){w._api().fp_play(I,H)}else{w._api().fp_play()}};if(w.isLoaded()){J()}else{if(D){setTimeout(function(){w.play(I,H)},50)}else{w.load(function(){J()})}}return w},getVersion:function(){var I="flowplayer.js 3.2.4";if(w.isLoaded()){var H=v.fp_getVersion();H.push(I);return H}return I},_api:function(){if(!w.isLoaded()){throw"Flowplayer "+w.id()+" not loaded when calling an API method"}return v},setClip:function(H){w.setPlaylist([H]);return w},getIndex:function(){return p},_swfHeight:function(){return v.clientHeight}});m(("Click*,Load*,Unload*,Keypress*,Volume*,Mute*,Unmute*,PlaylistReplace,ClipAdd,Fullscreen*,FullscreenExit,Error,MouseOver,MouseOut").split(","),function(){var H="on"+this;if(H.indexOf("*")!=-1){H=H.slice(0,H.length-1);var I="onBefore"+H.slice(2);w[I]=function(J){j(x,I,J);return w}}w[H]=function(J){j(x,H,J);return w}});m(("pause,resume,mute,unmute,stop,toggle,seek,getStatus,getVolume,setVolume,getTime,isPaused,isPlaying,startBuffering,stopBuffering,isFullscreen,toggleFullscreen,reset,close,setPlaylist,addClip,playFeed,setKeyboardShortcutsEnabled,isKeyboardShortcutsEnabled").split(","),function(){var H=this;w[H]=function(J,I){if(!w.isLoaded()){return w}var K=null;if(J!==undefined&&I!==undefined){K=v["fp_"+H](J,I)}else{K=(J===undefined)?v["fp_"+H]():v["fp_"+H](J)}return K==="undefined"||K===undefined?w:K}});w._fireEvent=function(Q){if(typeof Q=="string"){Q=[Q]}var R=Q[0],O=Q[1],M=Q[2],L=Q[3],K=0;if(t.debug){g(Q)}if(!w.isLoaded()&&R=="onLoad"&&O=="player"){v=v||c(r);o=w._swfHeight();m(F,function(){this._fireEvent("onLoad")});m(y,function(S,T){T._fireEvent("onUpdate")});s._fireEvent("onLoad")}if(R=="onLoad"&&O!="player"){return}if(R=="onError"){if(typeof O=="string"||(typeof O=="number"&&typeof M=="number")){O=M;M=L}}if(R=="onContextMenu"){m(t.contextMenu[O],function(S,T){T.call(w)});return}if(R=="onPluginEvent"||R=="onBeforePluginEvent"){var H=O.name||O;var I=y[H];if(I){I._fireEvent("onUpdate",O);return I._fireEvent(M,Q.slice(3))}return}if(R=="onPlaylistReplace"){F=[];var N=0;m(O,function(){F.push(new h(this,N++,w))})}if(R=="onClipAdd"){if(O.isInStream){return}O=new h(O,M,w);F.splice(M,0,O);for(K=M+1;K<F.length;K++){F[K].index++}}var P=true;if(typeof O=="number"&&O<F.length){C=O;var J=F[O];if(J){P=J._fireEvent(R,M,L)}if(!J||P!==false){P=s._fireEvent(R,M,L,J)}}m(x[R],function(){P=this.call(w,O,M);if(this.cached){x[R].splice(K,1)}if(P===false){return false}K++});return P};function B(){if($f(q)){$f(q).getParent().innerHTML="";p=$f(q).getIndex();a[p]=w}else{a.push(w);p=a.length-1}A=parseInt(q.style.height,10)||q.clientHeight;E=q.id||"fp"+e();r=G.id||E+"_api";G.id=r;t.playerId=E;if(typeof t=="string"){t={clip:{url:t}}}if(typeof t.clip=="string"){t.clip={url:t.clip}}t.clip=t.clip||{};if(q.getAttribute("href",2)&&!t.clip.url){t.clip.url=q.getAttribute("href",2)}s=new h(t.clip,-1,w);t.playlist=t.playlist||[t.clip];var I=0;m(t.playlist,function(){var K=this;if(typeof K=="object"&&K.length){K={url:""+K}}m(t.clip,function(L,M){if(M!==undefined&&K[L]===undefined&&typeof M!="function"){K[L]=M}});t.playlist[I]=K;K=new h(K,I,w);F.push(K);I++});m(t,function(K,L){if(typeof L=="function"){if(s[K]){s[K](L)}else{j(x,K,L)}delete t[K]}});m(t.plugins,function(K,L){if(L){y[K]=new l(K,L,w)}});if(!t.plugins||t.plugins.controls===undefined){y.controls=new l("controls",null,w)}y.canvas=new l("canvas",null,w);u=q.innerHTML;function J(L){var K=w.hasiPadSupport&&w.hasiPadSupport();if(/iPad|iPhone|iPod/i.test(navigator.userAgent)&&!/.flv$/i.test(F[0].url)&&!K){return true}if(!w.isLoaded()&&w._fireEvent("onBeforeClick")!==false){w.load()}return f(L)}function H(){if(u.replace(/\s/g,"")!==""){if(q.addEventListener){q.addEventListener("click",J,false)}else{if(q.attachEvent){q.attachEvent("onclick",J)}}}else{if(q.addEventListener){q.addEventListener("click",f,false)}w.load()}}setTimeout(H,0)}if(typeof q=="string"){var z=c(q);if(!z){throw"Flowplayer cannot access element: "+q}q=z;B()}else{B()}}var a=[];function d(o){this.length=o.length;this.each=function(p){m(o,p)};this.size=function(){return o.length}}window.flowplayer=window.$f=function(){var p=null;var o=arguments[0];if(!arguments.length){m(a,function(){if(this.isLoaded()){p=this;return false}});return p||a[0]}if(arguments.length==1){if(typeof o=="number"){return a[o]}else{if(o=="*"){return new d(a)}m(a,function(){if(this.id()==o.id||this.id()==o||this.getParent()==o){p=this;return false}});return p}}if(arguments.length>1){var t=arguments[1],q=(arguments.length==3)?arguments[2]:{};if(typeof t=="string"){t={src:t}}t=i({bgcolor:"#000000",version:[9,0],expressInstall:"http://static.flowplayer.org/swf/expressinstall.swf",cachebusting:true},t);if(typeof o=="string"){if(o.indexOf(".")!=-1){var s=[];m(n(o),function(){s.push(new b(this,k(t),k(q)))});return new d(s)}else{var r=c(o);return new b(r!==null?r:o,t,q)}}else{if(o){return new b(o,t,q)}}}return null};i(window.$f,{fireEvent:function(){var o=[].slice.call(arguments);var q=$f(o[0]);return q?q._fireEvent(o.slice(1)):null},addPlugin:function(o,p){b.prototype[o]=p;return $f},each:m,extend:i});if(typeof jQuery=="function"){jQuery.fn.flowplayer=function(q,p){if(!arguments.length||typeof arguments[0]=="number"){var o=[];this.each(function(){var r=$f(this);if(r){o.push(r)}});return arguments.length?o[arguments[0]]:new d(o)}return this.each(function(){$f(this,k(q),p?k(p):{})})}}})();(function(){var h=document.all,j="http://www.adobe.com/go/getflashplayer",c=typeof jQuery=="function",e=/(\d+)[^\d]+(\d+)[^\d]*(\d*)/,b={width:"100%",height:"100%",id:"_"+(""+Math.random()).slice(9),allowfullscreen:true,allowscriptaccess:"always",quality:"high",version:[3,0],onFail:null,expressInstall:null,w3c:false,cachebusting:false};if(window.attachEvent){window.attachEvent("onbeforeunload",function(){__flash_unloadHandler=function(){};__flash_savedUnloadHandler=function(){}})}function i(m,l){if(l){for(var f in l){if(l.hasOwnProperty(f)){m[f]=l[f]}}}return m}function a(f,n){var m=[];for(var l in f){if(f.hasOwnProperty(l)){m[l]=n(f[l])}}return m}window.flashembed=function(f,m,l){if(typeof f=="string"){f=document.getElementById(f.replace("#",""))}if(!f){return}if(typeof m=="string"){m={src:m}}return new d(f,i(i({},b),m),l)};var g=i(window.flashembed,{conf:b,getVersion:function(){var m,f;try{f=navigator.plugins["Shockwave Flash"].description.slice(16)}catch(o){try{m=new ActiveXObject("ShockwaveFlash.ShockwaveFlash.7");f=m&&m.GetVariable("$version")}catch(n){try{m=new ActiveXObject("ShockwaveFlash.ShockwaveFlash.6");f=m&&m.GetVariable("$version")}catch(l){}}}f=e.exec(f);return f?[f[1],f[3]]:[0,0]},asString:function(l){if(l===null||l===undefined){return null}var f=typeof l;if(f=="object"&&l.push){f="array"}switch(f){case"string":l=l.replace(new RegExp('(["\\\\])',"g"),"\\$1");l=l.replace(/^\s?(\d+\.?\d+)%/,"$1pct");return'"'+l+'"';case"array":return"["+a(l,function(o){return g.asString(o)}).join(",")+"]";case"function":return'"function()"';case"object":var m=[];for(var n in l){if(l.hasOwnProperty(n)){m.push('"'+n+'":'+g.asString(l[n]))}}return"{"+m.join(",")+"}"}return String(l).replace(/\s/g," ").replace(/\'/g,'"')},getHTML:function(o,l){o=i({},o);var n='<object width="'+o.width+'" height="'+o.height+'" id="'+o.id+'" name="'+o.id+'"';if(o.cachebusting){o.src+=((o.src.indexOf("?")!=-1?"&":"?")+Math.random())}if(o.w3c||!h){n+=' data="'+o.src+'" type="application/x-shockwave-flash"'}else{n+=' classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000"'}n+=">";if(o.w3c||h){n+='<param name="movie" value="'+o.src+'" />'}o.width=o.height=o.id=o.w3c=o.src=null;o.onFail=o.version=o.expressInstall=null;for(var m in o){if(o[m]){n+='<param name="'+m+'" value="'+o[m]+'" />'}}var p="";if(l){for(var f in l){if(l[f]){var q=l[f];p+=f+"="+(/function|object/.test(typeof q)?g.asString(q):q)+"&"}}p=p.slice(0,-1);n+='<param name="flashvars" value=\''+p+"' />"}n+="</object>";return n},isSupported:function(f){return k[0]>f[0]||k[0]==f[0]&&k[1]>=f[1]}});var k=g.getVersion();function d(f,n,m){if(g.isSupported(n.version)){f.innerHTML=g.getHTML(n,m)}else{if(n.expressInstall&&g.isSupported([6,65])){f.innerHTML=g.getHTML(i(n,{src:n.expressInstall}),{MMredirectURL:location.href,MMplayerType:"PlugIn",MMdoctitle:document.title})}else{if(!f.innerHTML.replace(/\s/g,"")){f.innerHTML="<h2>Flash version "+n.version+" or greater is required</h2><h3>"+(k[0]>0?"Your version is "+k:"You have no flash plugin installed")+"</h3>"+(f.tagName=="A"?"<p>Click here to download latest version</p>":"<p>Download latest version from <a href='"+j+"'>here</a></p>");if(f.tagName=="A"){f.onclick=function(){location.href=j}}}if(n.onFail){var l=n.onFail.call(this);if(typeof l=="string"){f.innerHTML=l}}}}if(h){window[n.id]=document.getElementById(n.id)}i(this,{getRoot:function(){return f},getOptions:function(){return n},getConf:function(){return m},getApi:function(){return f.firstChild}})}if(c){jQuery.tools=jQuery.tools||{version:"3.2.4"};jQuery.tools.flashembed={conf:b};jQuery.fn.flashembed=function(l,f){return this.each(function(){$(this).data("flashembed",flashembed(this,l,f))})}}})();
VideoJS.tech.h5swf = {
  // swf: "flash/VideoJS.swf",
  swf: "https://s3.amazonaws.com/video-js/3.0b/video-js.swf",
  // swf: "http://video-js.zencoder.com/3.0b/video-js.swf",
  supported: function(){
    /* TODO Check for flash, etc. */
    return true;
  },
  canPlaySource: function(sourceObj){
    if (sourceObj.type in _V_.tech.h5swf.supports.format) { return "maybe"; }
  },
  supports: {
    format: {
      "video/flv": "FLV",
      "video/x-flv": "FLV",
      "video/mp4": "MP4",
      "video/m4v": "MP4"
    },

    // Optional events that we can manually mimic with timers
    event: {
      progress: false,
      timeupdate: false
    }
  },

  // Init the swf object
  init: function(sourceObj){
    var player = this,
        placeHolder = _V_.createElement("div", { id: player.box.id + "_temp_h5swf" }),
        objId = player.box.id+"_h5swf_api",
        h5swf = VideoJS.tech.h5swf,

        flashvars = {
          readyFunction: "_V_.tech.h5swf.onSWFReady",
          eventProxyFunction: "_V_.tech.h5swf.onSWFEvent",
          errorEventProxyFunction: "_V_.tech.h5swf.onSWFErrorEvent",
          src: sourceObj.src,
          autoplay: this.options.autoplay,
          preload: this.options.preload,
          loop: this.options.loop,
          muted: this.options.muted
        },

        params = {
          allowScriptAccess: "always",
          wmode: "opaque",
          bgcolor: "#000000"
        },

        attributes = {
          id: objId,
          name: objId,
          'class': 'vjs-tech'
        };

    player.box.appendChild(placeHolder);

    swfobject.embedSWF(_V_.tech.h5swf.swf, placeHolder.id, "480", "270", "9.0.124", "", flashvars, params, attributes);
  },
  onSWFReady: function(currSwf){
    // Flash seems to be catching errors, so raising them manally
    try {
      // Delay for real swf ready.
      setTimeout(function(){
        var el = _V_.el(currSwf),
            player = el.parentNode.player; // Get player from box

        el.player = player;

        // Update reference to playback technology element
        player.tels.h5swf = el;

        player.ready(function(){
          // this.src("http://video-js.zencoder.com/oceans-clip.mp4");
        });
        player.triggerEvent("techready");

      },0);
    } catch(err) {
      _V_.log(err);
    }
  },
  
  onSWFEvent: function(swfID, eventName, other){
    try {
      var player = _V_.el(swfID).player;
      if (player) {
        player.triggerEvent(eventName);
      }
    } catch(err) {
      _V_.log(err);
    }
  },

   onSWFErrorEvent: function(swfID, eventName){
    _V_.log("Error", eventName);
  },
  
  api: {
    setupTriggers: function(){
      // Using global onSWFEvent func to distribute events
    },

    play: function(){ this.tels.h5swf.vjs_play(); },
    pause: function(){ this.tels.h5swf.vjs_pause(); },
    src: function(src){ this.tels.h5swf.vjs_src(src); },
    load: function(){ this.tels.h5swf.vjs_load(); },

    buffered: function(){
      return _V_.createTimeRange(0, this.tels.h5swf.vjs_getProperty("buffered"));
    },

    supportsFullScreen: function(){
      return false; // Flash does not allow fullscreen through javascript
    },
    enterFullScreen: function(){ return false; }
  }
};

// Create setters and getters for attributes
(function(){
  var api = VideoJS.tech.h5swf.api,
      readWrite = "src,preload,currentTime,defaultPlaybackRate,playbackRate,autoplay,loop,mediaGroup,controller,controls,volume,muted,defaultMuted".split(","),
      readOnly = "error,currentSrc,networkState,readyState,seeking,initialTime,duration,startOffsetTime,paused,played,seekable,ended,videoTracks,audioTracks,videoWidth,videoHeight,textTracks".split(","),
      callOnly = "load,play,pause".split(",");
      // Overridden: buffered

      createSetter = function(attr){
        var attrUpper = attr.charAt(0).toUpperCase() + attr.slice(1);
        api["set"+attrUpper] = function(val){ return this.tels.h5swf.vjs_setProperty(attr, val); };
      },

      createGetter = function(attr){
        api[attr] = function(){ return this.tels.h5swf.vjs_getProperty(attr); };
      };

  // Create getter and setters for all read/write attributes
  _V_.each(readWrite, function(attr){
    createGetter(attr);
    createSetter(attr);
  });

  // Create getters for read-only attributes
  _V_.each(readOnly, function(attr){
    createGetter(attr);
  });
})();
// Special
// canPlayType
// addTextTrack
// textTracks
/* SWFObject v2.1 <http://code.google.com/p/swfobject/>
	Copyright (c) 2007-2008 Geoff Stearns, Michael Williams, and Bobby van der Sluis
	This software is released under the MIT License <http://www.opensource.org/licenses/mit-license.php>
*/
var swfobject=function(){var b="undefined",Q="object",n="Shockwave Flash",p="ShockwaveFlash.ShockwaveFlash",P="application/x-shockwave-flash",m="SWFObjectExprInst",j=window,K=document,T=navigator,o=[],N=[],i=[],d=[],J,Z=null,M=null,l=null,e=false,A=false;var h=function(){var v=typeof K.getElementById!=b&&typeof K.getElementsByTagName!=b&&typeof K.createElement!=b,AC=[0,0,0],x=null;if(typeof T.plugins!=b&&typeof T.plugins[n]==Q){x=T.plugins[n].description;if(x&&!(typeof T.mimeTypes!=b&&T.mimeTypes[P]&&!T.mimeTypes[P].enabledPlugin)){x=x.replace(/^.*\s+(\S+\s+\S+$)/,"$1");AC[0]=parseInt(x.replace(/^(.*)\..*$/,"$1"),10);AC[1]=parseInt(x.replace(/^.*\.(.*)\s.*$/,"$1"),10);AC[2]=/r/.test(x)?parseInt(x.replace(/^.*r(.*)$/,"$1"),10):0}}else{if(typeof j.ActiveXObject!=b){var y=null,AB=false;try{y=new ActiveXObject(p+".7")}catch(t){try{y=new ActiveXObject(p+".6");AC=[6,0,21];y.AllowScriptAccess="always"}catch(t){if(AC[0]==6){AB=true}}if(!AB){try{y=new ActiveXObject(p)}catch(t){}}}if(!AB&&y){try{x=y.GetVariable("$version");if(x){x=x.split(" ")[1].split(",");AC=[parseInt(x[0],10),parseInt(x[1],10),parseInt(x[2],10)]}}catch(t){}}}}var AD=T.userAgent.toLowerCase(),r=T.platform.toLowerCase(),AA=/webkit/.test(AD)?parseFloat(AD.replace(/^.*webkit\/(\d+(\.\d+)?).*$/,"$1")):false,q=false,z=r?/win/.test(r):/win/.test(AD),w=r?/mac/.test(r):/mac/.test(AD);/*@cc_on q=true;@if(@_win32)z=true;@elif(@_mac)w=true;@end@*/return{w3cdom:v,pv:AC,webkit:AA,ie:q,win:z,mac:w}}();var L=function(){if(!h.w3cdom){return }f(H);if(h.ie&&h.win){try{K.write("<script id=__ie_ondomload defer=true src=//:><\/script>");J=C("__ie_ondomload");if(J){I(J,"onreadystatechange",S)}}catch(q){}}if(h.webkit&&typeof K.readyState!=b){Z=setInterval(function(){if(/loaded|complete/.test(K.readyState)){E()}},10)}if(typeof K.addEventListener!=b){K.addEventListener("DOMContentLoaded",E,null)}R(E)}();function S(){if(J.readyState=="complete"){J.parentNode.removeChild(J);E()}}function E(){if(e){return }if(h.ie&&h.win){var v=a("span");try{var u=K.getElementsByTagName("body")[0].appendChild(v);u.parentNode.removeChild(u)}catch(w){return }}e=true;if(Z){clearInterval(Z);Z=null}var q=o.length;for(var r=0;r<q;r++){o[r]()}}function f(q){if(e){q()}else{o[o.length]=q}}function R(r){if(typeof j.addEventListener!=b){j.addEventListener("load",r,false)}else{if(typeof K.addEventListener!=b){K.addEventListener("load",r,false)}else{if(typeof j.attachEvent!=b){I(j,"onload",r)}else{if(typeof j.onload=="function"){var q=j.onload;j.onload=function(){q();r()}}else{j.onload=r}}}}}function H(){var t=N.length;for(var q=0;q<t;q++){var u=N[q].id;if(h.pv[0]>0){var r=C(u);if(r){N[q].width=r.getAttribute("width")?r.getAttribute("width"):"0";N[q].height=r.getAttribute("height")?r.getAttribute("height"):"0";if(c(N[q].swfVersion)){if(h.webkit&&h.webkit<312){Y(r)}W(u,true)}else{if(N[q].expressInstall&&!A&&c("6.0.65")&&(h.win||h.mac)){k(N[q])}else{O(r)}}}}else{W(u,true)}}}function Y(t){var q=t.getElementsByTagName(Q)[0];if(q){var w=a("embed"),y=q.attributes;if(y){var v=y.length;for(var u=0;u<v;u++){if(y[u].nodeName=="DATA"){w.setAttribute("src",y[u].nodeValue)}else{w.setAttribute(y[u].nodeName,y[u].nodeValue)}}}var x=q.childNodes;if(x){var z=x.length;for(var r=0;r<z;r++){if(x[r].nodeType==1&&x[r].nodeName=="PARAM"){w.setAttribute(x[r].getAttribute("name"),x[r].getAttribute("value"))}}}t.parentNode.replaceChild(w,t)}}function k(w){A=true;var u=C(w.id);if(u){if(w.altContentId){var y=C(w.altContentId);if(y){M=y;l=w.altContentId}}else{M=G(u)}if(!(/%$/.test(w.width))&&parseInt(w.width,10)<310){w.width="310"}if(!(/%$/.test(w.height))&&parseInt(w.height,10)<137){w.height="137"}K.title=K.title.slice(0,47)+" - Flash Player Installation";var z=h.ie&&h.win?"ActiveX":"PlugIn",q=K.title,r="MMredirectURL="+j.location+"&MMplayerType="+z+"&MMdoctitle="+q,x=w.id;if(h.ie&&h.win&&u.readyState!=4){var t=a("div");x+="SWFObjectNew";t.setAttribute("id",x);u.parentNode.insertBefore(t,u);u.style.display="none";var v=function(){u.parentNode.removeChild(u)};I(j,"onload",v)}U({data:w.expressInstall,id:m,width:w.width,height:w.height},{flashvars:r},x)}}function O(t){if(h.ie&&h.win&&t.readyState!=4){var r=a("div");t.parentNode.insertBefore(r,t);r.parentNode.replaceChild(G(t),r);t.style.display="none";var q=function(){t.parentNode.removeChild(t)};I(j,"onload",q)}else{t.parentNode.replaceChild(G(t),t)}}function G(v){var u=a("div");if(h.win&&h.ie){u.innerHTML=v.innerHTML}else{var r=v.getElementsByTagName(Q)[0];if(r){var w=r.childNodes;if(w){var q=w.length;for(var t=0;t<q;t++){if(!(w[t].nodeType==1&&w[t].nodeName=="PARAM")&&!(w[t].nodeType==8)){u.appendChild(w[t].cloneNode(true))}}}}}return u}function U(AG,AE,t){var q,v=C(t);if(v){if(typeof AG.id==b){AG.id=t}if(h.ie&&h.win){var AF="";for(var AB in AG){if(AG[AB]!=Object.prototype[AB]){if(AB.toLowerCase()=="data"){AE.movie=AG[AB]}else{if(AB.toLowerCase()=="styleclass"){AF+=' class="'+AG[AB]+'"'}else{if(AB.toLowerCase()!="classid"){AF+=" "+AB+'="'+AG[AB]+'"'}}}}}var AD="";for(var AA in AE){if(AE[AA]!=Object.prototype[AA]){AD+='<param name="'+AA+'" value="'+AE[AA]+'" />'}}v.outerHTML='<object classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000"'+AF+">"+AD+"</object>";i[i.length]=AG.id;q=C(AG.id)}else{if(h.webkit&&h.webkit<312){var AC=a("embed");AC.setAttribute("type",P);for(var z in AG){if(AG[z]!=Object.prototype[z]){if(z.toLowerCase()=="data"){AC.setAttribute("src",AG[z])}else{if(z.toLowerCase()=="styleclass"){AC.setAttribute("class",AG[z])}else{if(z.toLowerCase()!="classid"){AC.setAttribute(z,AG[z])}}}}}for(var y in AE){if(AE[y]!=Object.prototype[y]){if(y.toLowerCase()!="movie"){AC.setAttribute(y,AE[y])}}}v.parentNode.replaceChild(AC,v);q=AC}else{var u=a(Q);u.setAttribute("type",P);for(var x in AG){if(AG[x]!=Object.prototype[x]){if(x.toLowerCase()=="styleclass"){u.setAttribute("class",AG[x])}else{if(x.toLowerCase()!="classid"){u.setAttribute(x,AG[x])}}}}for(var w in AE){if(AE[w]!=Object.prototype[w]&&w.toLowerCase()!="movie"){F(u,w,AE[w])}}v.parentNode.replaceChild(u,v);q=u}}}return q}function F(t,q,r){var u=a("param");u.setAttribute("name",q);u.setAttribute("value",r);t.appendChild(u)}function X(r){var q=C(r);if(q&&(q.nodeName=="OBJECT"||q.nodeName=="EMBED")){if(h.ie&&h.win){if(q.readyState==4){B(r)}else{j.attachEvent("onload",function(){B(r)})}}else{q.parentNode.removeChild(q)}}}function B(t){var r=C(t);if(r){for(var q in r){if(typeof r[q]=="function"){r[q]=null}}r.parentNode.removeChild(r)}}function C(t){var q=null;try{q=K.getElementById(t)}catch(r){}return q}function a(q){return K.createElement(q)}function I(t,q,r){t.attachEvent(q,r);d[d.length]=[t,q,r]}function c(t){var r=h.pv,q=t.split(".");q[0]=parseInt(q[0],10);q[1]=parseInt(q[1],10)||0;q[2]=parseInt(q[2],10)||0;return(r[0]>q[0]||(r[0]==q[0]&&r[1]>q[1])||(r[0]==q[0]&&r[1]==q[1]&&r[2]>=q[2]))?true:false}function V(v,r){if(h.ie&&h.mac){return }var u=K.getElementsByTagName("head")[0],t=a("style");t.setAttribute("type","text/css");t.setAttribute("media","screen");if(!(h.ie&&h.win)&&typeof K.createTextNode!=b){t.appendChild(K.createTextNode(v+" {"+r+"}"))}u.appendChild(t);if(h.ie&&h.win&&typeof K.styleSheets!=b&&K.styleSheets.length>0){var q=K.styleSheets[K.styleSheets.length-1];if(typeof q.addRule==Q){q.addRule(v,r)}}}function W(t,q){var r=q?"visible":"hidden";if(e&&C(t)){C(t).style.visibility=r}else{V("#"+t,"visibility:"+r)}}function g(s){var r=/[\\\"<>\.;]/;var q=r.exec(s)!=null;return q?encodeURIComponent(s):s}var D=function(){if(h.ie&&h.win){window.attachEvent("onunload",function(){var w=d.length;for(var v=0;v<w;v++){d[v][0].detachEvent(d[v][1],d[v][2])}var t=i.length;for(var u=0;u<t;u++){X(i[u])}for(var r in h){h[r]=null}h=null;for(var q in swfobject){swfobject[q]=null}swfobject=null})}}();return{registerObject:function(u,q,t){if(!h.w3cdom||!u||!q){return }var r={};r.id=u;r.swfVersion=q;r.expressInstall=t?t:false;N[N.length]=r;W(u,false)},getObjectById:function(v){var q=null;if(h.w3cdom){var t=C(v);if(t){var u=t.getElementsByTagName(Q)[0];if(!u||(u&&typeof t.SetVariable!=b)){q=t}else{if(typeof u.SetVariable!=b){q=u}}}}return q},embedSWF:function(x,AE,AB,AD,q,w,r,z,AC){if(!h.w3cdom||!x||!AE||!AB||!AD||!q){return }AB+="";AD+="";if(c(q)){W(AE,false);var AA={};if(AC&&typeof AC===Q){for(var v in AC){if(AC[v]!=Object.prototype[v]){AA[v]=AC[v]}}}AA.data=x;AA.width=AB;AA.height=AD;var y={};if(z&&typeof z===Q){for(var u in z){if(z[u]!=Object.prototype[u]){y[u]=z[u]}}}if(r&&typeof r===Q){for(var t in r){if(r[t]!=Object.prototype[t]){if(typeof y.flashvars!=b){y.flashvars+="&"+t+"="+r[t]}else{y.flashvars=t+"="+r[t]}}}}f(function(){U(AA,y,AE);if(AA.id==AE){W(AE,true)}})}else{if(w&&!A&&c("6.0.65")&&(h.win||h.mac)){A=true;W(AE,false);f(function(){var AF={};AF.id=AF.altContentId=AE;AF.width=AB;AF.height=AD;AF.expressInstall=w;k(AF)})}}},getFlashPlayerVersion:function(){return{major:h.pv[0],minor:h.pv[1],release:h.pv[2]}},hasFlashPlayerVersion:c,createSWF:function(t,r,q){if(h.w3cdom){return U(t,r,q)}else{return undefined}},removeSWF:function(q){if(h.w3cdom){X(q)}},createCSS:function(r,q){if(h.w3cdom){V(r,q)}},addDomLoadEvent:f,addLoadEvent:R,getQueryParamValue:function(v){var u=K.location.search||K.location.hash;if(v==null){return g(u)}if(u){var t=u.substring(1).split("&");for(var r=0;r<t.length;r++){if(t[r].substring(0,t[r].indexOf("="))==v){return g(t[r].substring((t[r].indexOf("=")+1)))}}}return""},expressInstallCallback:function(){if(A&&M){var q=C(m);if(q){q.parentNode.replaceChild(M,q);if(l){W(l,true);if(h.ie&&h.win){M.style.display="block"}}M=null;l=null;A=false}}}}}();

// Flowplayer API Connector
VideoJS.tech.youtube = {
  supported: function(){
    // Flash Player 8 or higher
    return true;
  },
  canPlaySource: function(sourceObj){
    return sourceObj.type == "video/youtube";
  },
  supports: {
    format: {},
    event: {
      progress: false,
      timeupdate: false
    }
  },
  init: function(sourceObj){
    var player = this,
        placeHolder = _V_.createElement("div", { id: player.box.id + "_temp_ytswf" }),
        objId = player.box.id+"_youtube_api";

        flashvars = {
        },

        params = {
          allowScriptAccess: "always",
          wmode: "opaque",
          bgcolor: "#000000"
        },

        attributes = {
          id: objId,
          name: objId,
          'class': 'vjs-tech'
        };

    this.addEvent("techready", function(){
      var url = sourceObj.src;

      if (url.indexOf("http://") == 0) {
        // Get Youtube ID from URL
        url = url.match(/v=([^&]+)/)[1];
      }
      this.tels.youtube.cueVideoById(url);
    });

    player.box.appendChild(placeHolder);

    swfobject.embedSWF("http://www.youtube.com/apiplayer?" +
                       "version=3&enablejsapi=1&playerapiid=" + objId,
                       placeHolder.id, "480", "295", "9", null, null, params, attributes);
  },
  stateChange: function(id, state){
    var player = _V_(id);

    if (state == 0) {
      player.triggerEvent("ended");
    } else if (state == 1) {
      player.triggerEvent("play");
      player.triggerEvent("playing");
    } else if (state == 2) {
      player.triggerEvent("pause");
    }
  },
  
  error: function(id, errorCode){
    _V_.log(id, errorCode);
  },

  api: {
    setupTriggers: function(){
      this.tels.youtube.addEventListener("onStateChange", 
        "(function(state){ _V_.tech.youtube.stateChange('"+this.id+"',state); })");

      this.tels.youtube.addEventListener("onError", 
        "(function(errorCode){ _V_.tech.youtube.error('"+this.id+"',errorCode); })");

    },

    play: function(){ this.tels.youtube.playVideo(); },
    pause: function(){ this.tels.youtube.pauseVideo(); },
    paused: function(){
      return this.tels.youtube.getPlayerState() !== 1; // More accurate than isPaused
    },

    currentTime: function(){ return this.tels.youtube.getCurrentTime(); },
    setCurrentTime: function(seconds){
      // False blocks seek-ahead.
      this.tels.youtube.seekTo(seconds, true);
    },

    duration: function(){
      return this.tels.youtube.getDuration();
    },

    buffered: function(){
      var percent = this.tels.youtube.getVideoBytesLoaded() / this.tels.youtube.getVideoBytesTotal(),
          seconds = this.duration() * percent;
      return _V_.createTimeRange(0, seconds);
    },

    volume: function(){ return _V_.round(this.tels.youtube.getVolume() / 100, 2); },
    setVolume: function(percentAsDecimal){
      this.tels.youtube.setVolume(parseInt(percentAsDecimal * 100));

      // Youtube Doesn't support VolumeChange Events
      this.triggerEvent("volumechange");
    },
    muted: function(){ return this.tels.youtube.isMuted(); },
    setMuted: function(bool){
      if (bool) {
        this.tels.youtube.mute()
      } else {
        this.tels.youtube.unMute()
      }
    },

    supportsFullScreen: function(){
      return false; // Flash does not allow fullscreen through javascript
      // Maybe at click listener, and say "click screen".
    },
    enterFullScreen: function(){ this.tels.flowplayer.api.toggleFullscreen(); },

    src: function(src){
      this.tels.youtube.cueVideoById(src);
    },
    load: function(){
      // Youtube will autoload?
    }
  }
};

// YouTube Defined Player Ready Callback
window.onYouTubePlayerReady = function(playerId) {
  var el = _V_.el(playerId),
      player = el.parentNode.player; // Get player from box

  el.player = player;

  // Update reference to playback technology element
  player.tels.youtube = el;

  player.triggerEvent("techready");
}

/* Box Behaviors - The primary container element
================================================================================ */
VideoJS.fn.newBehavior("box", 
  function(element){
    _V_.addClass(element, "vjs-paused");
    this.addEvent("play", this.boxOnVideoPlay);
    this.addEvent("pause", this.boxOnVideoPause);
  },
  function(){},
  {
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

/* Playback Technology Element Behaviors
================================================================================ */
VideoJS.fn.newBehavior("tech", 
  function(element){
    _V_.addEvent(element, "click", _V_.proxy(this, this.onPlayToggleClick));
  },
  function(element){
    _V_.removeEvent(element, "click", this.onPlayToggleClick);
  },
  {}
);

/* Control Bar Behaviors
================================================================================ */
VideoJS.fn.newBehavior("controlBar",
  function(element){
    if (!this.bels.controlBars) {
      this.bels.controlBars = [];
      // this.addEvent("mouseover", this.showControlBars);
      // this.addEvent("mouseout", this.hideControlBars);
    }
    this.bels.controlBars.push(element);
  },
  function(element){},
  {
    showControlBars: function(){
      this.each(this.bels.controlBars, function(bar){
        bar.style.opacity = 1;
        // bar.style.display = "block";
      });
    },
    hideControlBars: function(){
      this.each(this.bels.controlBars, function(bar){
        bar.style.opacity = 0;
        // bar.style.display = "none";
      });
    }
  }
);

/* PlayToggle, PlayButton, PauseButton Behaviors
================================================================================ */
// Play Toggle
VideoJS.fn.newBehavior("playToggle", function(element){
    if (!this.bels.playToggles) {
      this.bels.playToggles = [];
      this.addEvent("play", this.playTogglesOnPlay);
      this.addEvent("pause", this.playTogglesOnPause);
    }
    this.bels.playToggles.push(element);
    _V_.addEvent(element, "click", _V_.proxy(this, this.onPlayToggleClick));
    _V_.addEvent(element, "focus", _V_.proxy(this, this.onPlayToggleFocus));
    _V_.addEvent(element, "blur", _V_.proxy(this, this.onPlayToggleBlur));
  },
  function(){},
  {
    onPlayToggleClick: function(event){
      if (this.paused()) {
        this.play();
      } else {
        this.pause();
      }
    },
    playTogglesOnPlay: function(event){
      this.each(this.bels.playToggles, function(toggle){
        _V_.removeClass(toggle, "vjs-paused");
        _V_.addClass(toggle, "vjs-playing");
      });
    },
    playTogglesOnPause: function(event){
      this.each(this.bels.playToggles, function(toggle){
        _V_.removeClass(toggle, "vjs-playing");
        _V_.addClass(toggle, "vjs-paused");
      });
    },
    onPlayToggleFocus: function(event){
      _V_.addEvent(document, "keyup", _V_.proxy(this, this.onPlayToggleKey));
    },
    onPlayToggleKey: function(event){
      if (event.which == 32 || event.which == 13) {
        event.preventDefault();
        this.onPlayToggleClick();
      }
    },
    onPlayToggleBlur: function(event){
       _V_.removeEvent(document, "keyup", _V_.proxy(this, this.onPlayToggleKey));
    }
  }
);
// Play
VideoJS.fn.newBehavior("playButton", function(element){
    _V_.addEvent(element, "click", _V_.proxy(this, this.onPlayButtonClick));
  },
  function(){},
  {
    onPlayButtonClick: function(event){ this.play(); }
  }
);
// Pause
VideoJS.fn.newBehavior("pauseButton", function(element){
    _V_.addEvent(element, "click", _V_.proxy(this, this.onPauseButtonClick));
  },
  function(){},
  {
    onPauseButtonClick: function(event){ this.pause(); }
  }
);

/* Current Time Display Behaviors
================================================================================ */
VideoJS.fn.newBehavior("currentTimeDisplay", function(element){
    if (!this.bels.currentTimeDisplays) {
      this.bels.currentTimeDisplays = [];
      this.addEvent("timeupdate", this.updateCurrentTimeDisplays);
    }
    this.bels.currentTimeDisplays.push(element);
  },
  function(){},
  {
    // Update the displayed time (00:00)
    updateCurrentTimeDisplays: function(newTime){
      // Allows for smooth scrubbing, when player can't keep up.
      var time = (this.scrubbing) ? this.values.currentTime : this.currentTime();
      this.each(this.bels.currentTimeDisplays, function(dis){
        dis.innerHTML = _V_.formatTime(time, this.duration());
      });
    }
  }
);

/* Duration Display Behaviors
================================================================================ */
VideoJS.fn.newBehavior("durationDisplay", function(element){
    if (!this.bels.durationDisplays) {
      this.bels.durationDisplays = [];
      this.addEvent("timeupdate", this.updateDurationDisplays);
    }
    this.bels.durationDisplays.push(element);
  },
  function(){},
  {
    updateDurationDisplays: function(){
      this.each(this.bels.durationDisplays, function(dis){
        if (this.duration()) { dis.innerHTML = _V_.formatTime(this.duration()); }
      });
    }
  }
);

/* Duration Display Behaviors
================================================================================ */
VideoJS.fn.newBehavior("remainingTimeDisplay", function(element){
    if (!this.bels.remainingTimeDisplays) {
      this.bels.remainingTimeDisplays = [];
      this.addEvent("timeupdate", this.updateRemainingTimeDisplays);
    }
    this.bels.remainingTimeDisplays.push(element);
  },
  function(){},
  {
    updateRemainingTimeDisplays: function(){
      this.each(this.bels.remainingTimeDisplays, function(dis){
        if (this.duration()) { dis.innerHTML = "-"+_V_.formatTime(this.remainingTime()); }
      });
    }
  }
);

/* Time Left (remaining) Display Behaviors
================================================================================ */
VideoJS.fn.newBehavior("timeLeftDisplay", function(element){
    if (!this.bels.timeLeftDisplays) {
      this.bels.timeLeftDisplays = [];
      this.addEvent("timeupdate", this.updateTimeLeftDisplays);
    }
    this.bels.timeLeftDisplays.push(element);
  },
  function(){
    this.removeEvent("timeupdate", this.updateTimeLeftDisplays);
    delete this.bels.timeLeftDisplays;
  },
  {
    updateTimeLeftDisplays: function(){
      // Allows for smooth scrubbing, when player can't keep up.
      var time = (this.scrubbing) ? this.values.currentTime : this.currentTime();
      this.each(this.bels.timeLeftDisplays, function(dis){
        dis.innerHTML = "-" + _V_.formatTime(this.duration() - time);
      });
    }
  }
);

/* Volume Scrubber Behaviors
================================================================================ */
VideoJS.fn.newBehavior("volumeScrubber", function(element){
    // Binding with element as 'this' so the progress holder element can be retrieved in IE.
    // IE doesn't support the currentTarget event attr.
    var player = this;
    _V_.addEvent(element, "mousedown", _V_.proxy(element, function(e){
      player.onVolumeScrubberMouseDown(e, this);
    }));
  },
  function(){},
  {
    // Adjust the volume when the user drags on the volume control
    onVolumeScrubberMouseDown: function(event, scrubber){
      // event.preventDefault();
      _V_.blockTextSelection();
      this.currentScrubber = scrubber;
      this.setVolumeWithScrubber(event);
      _V_.addEvent(document, "mousemove", _V_.proxy(this, this.onVolumeScrubberMouseMove));
      _V_.addEvent(document, "mouseup", _V_.proxy(this, this.onVolumeScrubberMouseUp));
    },
    onVolumeScrubberMouseMove: function(event){
      this.setVolumeWithScrubber(event);
    },
    onVolumeScrubberMouseUp: function(event){
      this.setVolumeWithScrubber(event);
      _V_.unblockTextSelection();
      _V_.removeEvent(document, "mousemove", this.onVolumeScrubberMouseMove, false);
      _V_.removeEvent(document, "mouseup", this.onVolumeScrubberMouseUp, false);
    },
    setVolumeWithScrubber: function(event){
      var newVol = _V_.getRelativePosition(event.pageX, this.currentScrubber);
      this.volume(newVol);
    }
  }
);

/* Volume Display Behaviors
================================================================================ */
VideoJS.fn.newBehavior("volumeDisplay", function(element){
    if (!this.bels.volumeDisplays) {
      this.bels.volumeDisplays = [];
      this.addEvent("volumechange", this.updateVolumeDisplays);
    }
    this.bels.volumeDisplays.push(element);
    this.updateVolumeDisplay(element); // Set the display to the initial volume
  },
  function(){},
  {
    // Update the volume control display
    // Unique to these default controls. Uses borders to create the look of bars.
    updateVolumeDisplays: function(){
      if (!this.bels.volumeDisplays) { return; }
      this.each(this.bels.volumeDisplays, function(dis){
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

/* Fullscreen Toggle Behaviors
================================================================================ */
VideoJS.fn.newBehavior("fullscreenToggle", function(element){
    _V_.addEvent(element, "click", _V_.proxy(this, this.onFullscreenToggleClick));
  },
  function(){},
  {
    // When the user clicks on the fullscreen button, update fullscreen setting
    onFullscreenToggleClick: function(event){
      if (!this.videoIsFullScreen) {
        this.enterFullScreen();
      } else {
        this.exitFullScreen();
      }
    },

    fullscreenOnWindowResize: function(event){ // Removeable
      // this.positionControlBars();
    },
    // Create listener for esc key while in full screen mode
    fullscreenOnEscKey: function(event){ // Removeable
      if (event.keyCode == 27) {
        this.exitFullScreen();
      }
    }
  }
);
/* Seek Bar Behaviors (Current Time Scrubber)
================================================================================ */
VideoJS.fn.newBehavior("seekBar",
  function(element){
    if (!this.bels.seekBars) {
      this.bels.seekBars = [];
      this.addEvent("timeupdate", this.updateSeekBars);
    }
    this.bels.seekBars.push(element);

    // Get and store related child objects (progress bar & handle)
    var data = _V_.getData(element);
    this.each(element.childNodes, function(c){
      if (c.className) {
        if (c.className.indexOf("seek-handle") != -1) {
          data.seekHandle = c;
        } else if (c.className.indexOf("play-progress") != -1) {
          data.playProgress = c;
        }
      }
    });

    // Binding with element as 'this' so the progress holder element can be retrieved in IE.
    // IE doesn't support the currentTarget event attr.
    var player = this;
    _V_.addEvent(element, "mousedown", _V_.proxy(element, function(event){
      player.onSeekBarMouseDown(event, this);
    }));
    _V_.addEvent(element, "focus", _V_.proxy(this, this.onSeekBarFocus));
    _V_.addEvent(element, "blur", _V_.proxy(this, this.onSeekBarBlur));
  },
  function(){},
  {
    // Adjust the play position when the user drags on the progress bar
    onSeekBarMouseDown: function(event, currentTarget){
      event.preventDefault();
      _V_.blockTextSelection();

      this.currSeekBar = currentTarget;
      this.currHandle = _V_.getData(currentTarget).seekHandle || false;

      this.scrubbing = true;

      this.videoWasPlaying = !this.paused();
      this.pause();

      this.setCurrentTimeWithScrubber(event);
      _V_.addEvent(document, "mousemove", _V_.proxy(this, this.onSeekBarMouseMove));
      _V_.addEvent(document, "mouseup", _V_.proxy(this, this.onSeekBarMouseUp));
    },
    onSeekBarMouseMove: function(event){ // Removeable
      this.setCurrentTimeWithScrubber(event);
    },
    onSeekBarMouseUp: function(event){ // Removeable
      _V_.unblockTextSelection();
      _V_.removeEvent(document, "mousemove", this.onSeekBarMouseMove, false);
      _V_.removeEvent(document, "mouseup", this.onSeekBarMouseUp, false);
      this.scrubbing = false;
      if (this.videoWasPlaying) {
        this.play();
      }
    },
    setCurrentTimeWithScrubber: function(event){
      var bar = this.currSeekBar,
          barX = _V_.findPosX(bar),
          barW = bar.offsetWidth,
          handle = this.currHandle,
          handleW = (handle) ? handle.offsetWidth : 0;
          
          // Adjusted X and Width, so handle doesn't go outside the bar
          barAX = barX + (handleW / 2),
          barAW = barW - handleW,
          // Percent that the click is through the adjusted area
          percent = Math.max(0, Math.min(1, (event.pageX - barAX) / barAW)),
          // Percent translated to pixels
          percentPix = percent * barAW,
          // Percent translated to seconds
          newTime = percent * this.duration();

      // Don't let video end while scrubbing.
      if (newTime == this.duration()) { newTime = newTime - 0.1; }

      // Set new time (tell player to seek to new time)
      this.currentTime(newTime);
    },
    getSeekBarAdjustedWidth: function(bar, handle){
      var bar = this.currSeekBar,
          barX = _V_.findPosX(bar),
          barW = bar.offsetWidth,
          handle = this.currHandle,
          handleW = (handle) ? handle.offsetWidth : 0;

          // Adjusted X and Width, so handle doesn't go outside the bar
          barAX = barX + (handleW / 2),
          barAW = barW - handleW;
    },
    updateSeekBars: function(){
      // If scrubbing, use the cached currentTime value for speed
      var progress = /* (this.scrubbing) ? this.scrubTime / this.duration() : */ this.currentTime() / this.duration();
      // Protect against no duration and other division issues
      if (isNaN(progress)) { progress = 0; }
      
      this.each(this.bels.seekBars, function(bar){
        var barData = _V_.getData(bar),
            barX = _V_.findPosX(bar),
            barW = bar.offsetWidth,
            handle = barData.seekHandle,
            progBar = barData.playProgress,
            handleW = (handle) ? handle.offsetWidth : 0;

            // Adjusted X and Width, so handle doesn't go outside the bar
            barAX = barX + (handleW / 2),
            barAW = barW - handleW;
            // Percent that the click is through the adjusted area
            // percent = Math.max(0, Math.min(1, (event.pageX - barAX) / barAW)),
            // Percent translated to pixels
            // percentPix = percent * barAW,
            // Percent translated to seconds
            // newTime = percent * this.duration();
        
            
        progBarProgress = _V_.round(progress * barAW + handleW / 2) + "px";
        if (progBar && progBar.style) { progBar.style.width = progBarProgress; }
        
        handle.style.left = _V_.round(progress * barAW)+"px";
      });
      
      
      // Update bar length
      // this.each(this.bels.playProgressBars, function(bar){
      //   if (bar.style) { bar.style.width = _V_.round(progress * 100, 2) + "%"; }
      // });

      // Move Handle
    },
    onSeekBarFocus: function(event){
      _V_.addEvent(document, "keyup", _V_.proxy(this, this.onSeekBarKey));
    },
    onSeekBarKey: function(event){
      if (event.which == 37) {
        event.preventDefault();
        this.currentTime(this.currentTime() - 1);
      } else if (event.which == 39) {
        event.preventDefault();
        this.currentTime(this.currentTime() + 1);
      }
    },
    onSeekBarBlur: function(event){
       _V_.removeEvent(document, "keyup", _V_.proxy(this, this.onSeekBarKey));
    }
  }
);
/* Seek Handle Behaviors
================================================================================ */
VideoJS.fn.newBehavior("seekHandle",
  function(element){
    if (!this.bels.seekHandles) { this.bels.seekHandles = []; }
    this.bels.seekHandles.push(element);

    // Store references between seekbar and seekhandle
    _V_.getData(element).seekBar = element.parentNode;
    _V_.getData(element.parentNode).seekHandle = element;
  },
  function(){},
  {}
);

/* Play Progress Bar Behaviors
================================================================================ */
VideoJS.fn.newBehavior("playProgressBar",
  function(element){
    if (!this.bels.playProgressBars) {
      this.bels.playProgressBars = [];
      this.addEvent("timeupdate", this.updatePlayProgressBars);
    }
    this.bels.playProgressBars.push(element);
  },
  function(){
    // Remove
  },
  {
    // Ajust the play progress bar's width based on the current play time
    updatePlayProgressBars: function(){
      // If scrubbing, use the cached currentTime value for speed
      var progress = (this.scrubbing) ? this.values.currentTime / this.duration() : this.currentTime() / this.duration();
      // Protect against no duration and other division issues
      if (isNaN(progress)) { progress = 0; }
      // Update bar length
      this.each(this.bels.playProgressBars, function(bar){
        if (bar.style) { bar.style.width = _V_.round(progress * 100, 2) + "%"; }
      });
    }
  }
);

/* Load Progress Bar Behaviors
================================================================================ */
VideoJS.fn.newBehavior("loadProgressBar",
  function(element){
    if (!this.bels.loadProgressBars) { this.bels.loadProgressBars = []; }
    this.bels.loadProgressBars.push(element);
    this.addEvent("progress", this.updateLoadProgressBars);
  },
  function(){},
  {
    updateLoadProgressBars: function(event){
      // log("updating progress bars", this.bufferedPercent());
      this.each(this.bels.loadProgressBars, function(bar){
        if (bar.style) { bar.style.width = _V_.round(this.bufferedPercent() * 100, 2) + "%"; }
      });
    }
  }
);
/* Text Track Displays
================================================================================ */
// Create a behavior type for each text track type (subtitlesDisplay, captionsDisplay, etc.).
// Then you can easily do something like.
//    player.addBehavior(myDiv, "subtitlesDisplay");
// And the myDiv's content will be updated with the text change.
_V_.each(["subtitles", "captions", "chapters", "descriptions"], function(type){
  var add, remove,
      name = type+"Display",
      plural = name+"s",
      updateFuncName = "update"+plural,
      funcs = {};

  // Add the behavior to an element
  add = function(element){
    if (!this.bels[plural]) {
      this.bels[plural] = [];
      this.addEvent(type+"update", this[updateFuncName]);
    }
    this.bels[plural].push(element);
  };

  // Remove the behavior from an element
  remove = function(element){
    if (this.bels[plural]) {
      _V_.remove(element, this.bels[plural]);
      if (this.bels[plural].length == 0) {
        this.removeEvent(type+"update", this[updateFuncName]);
        delete this.bels[plural];
      }
    }
  };

  // Addional needed funcitons (added directly to player)
  funcs[updateFuncName] = function(){
    var val = this.textTrackValue(type);
    this.each(this.bels[plural], function(display){
      display.innerHTML = val;
    });
  };

  VideoJS.fn.newBehavior(name, add, remove, funcs);
});
/* Volume Behaviors
================================================================================ */
/* Seek Bar Behaviors (Current Time Scrubber)
================================================================================ */
VideoJS.fn.newBehavior("volumeBar",
  function(element){
    if (!this.bels.volumeBars) {
      this.bels.volumeBars = [];
      this.addEvent("volumechange", this.updateVolumeBars);
    }
    this.bels.volumeBars.push(element);

    // Get and store related child objects (level & handle)
    var data = _V_.getData(element);
    this.each(element.childNodes, function(c){
      if (c.className) {
        if (c.className.indexOf("volume-handle") != -1) {
          data.volumeHandle = c;
        } else if (c.className.indexOf("volume-level") != -1) {
          data.volumeLevel = c;
        }
      }
    });

    // Binding with element as 'this' so the holder element can be retrieved in IE.
    // IE doesn't support the currentTarget event attr.
    var player = this;
    _V_.addEvent(element, "mousedown", _V_.proxy(element, function(event){
      player.onVolumeBarMouseDown(event, this);
    }));
    // _V_.addEvent(element, "focus", _V_.proxy(this, this.onVolumeBarFocus));
    // _V_.addEvent(element, "blur", _V_.proxy(this, this.onVolumeBarBlur));
  },
  function(){},
  {
    // Adjust the play position when the user drags on the progress bar
    onVolumeBarMouseDown: function(event, currentTarget){
      event.preventDefault();
      _V_.blockTextSelection();

      this.currVolumeBar = currentTarget;
      this.currHandle = _V_.getData(currentTarget).volumeHandle || false;

      this.setVolumeWithSlider(event);
      _V_.addEvent(document, "mousemove", _V_.proxy(this, this.onVolumeBarMouseMove));
      _V_.addEvent(document, "mouseup", _V_.proxy(this, this.onVolumeBarMouseUp));
    },
    onVolumeBarMouseMove: function(event){ // Removeable
      this.setVolumeWithSlider(event);
    },
    onVolumeBarMouseUp: function(event){ // Removeable
      _V_.unblockTextSelection();
      _V_.removeEvent(document, "mousemove", this.onVolumeBarMouseMove, false);
      _V_.removeEvent(document, "mouseup", this.onVolumeBarMouseUp, false);
    },
    setVolumeWithSlider: function(event){
      var bar = this.currVolumeBar,
          barX = _V_.findPosX(bar),
          barW = bar.offsetWidth,
          handle = this.currHandle,
          handleW = (handle) ? handle.offsetWidth : 0;
          
          // Adjusted X and Width, so handle doesn't go outside the bar
          barAX = barX + (handleW / 2),
          barAW = barW - handleW,
          // Percent that the click is through the adjusted area
          percent = Math.max(0, Math.min(1, (event.pageX - barAX) / barAW)),
          // Percent translated to pixels
          percentPix = percent * barAW,
          // Percent translated to seconds
          newTime = percent * this.duration();

      this.volume(percent);
    },
    updateVolumeBars: function(){
      var vol = this.volume();
      this.each(this.bels.volumeBars, function(bar){
        var barData = _V_.getData(bar),
            barX = _V_.findPosX(bar),
            barW = bar.offsetWidth,
            handle = barData.volumeHandle,
            progBar = barData.volumeLevel,
            handleW = (handle) ? handle.offsetWidth : 0;

            // Adjusted X and Width, so handle doesn't go outside the bar
            barAX = barX + (handleW / 2),
            barAW = barW - handleW;
            // Percent that the click is through the adjusted area
            // percent = Math.max(0, Math.min(1, (event.pageX - barAX) / barAW)),
            // Percent translated to pixels
            // percentPix = percent * barAW,
            // Percent translated to seconds
            // newTime = percent * this.duration();

        progBarProgress = _V_.round(vol * barAW + handleW / 2) + "px";
        if (progBar && progBar.style) { progBar.style.width = progBarProgress; }
        
        handle.style.left = _V_.round(vol * barAW)+"px";
      });
      
      
      // Update bar length
      // this.each(this.bels.playProgressBars, function(bar){
      //   if (bar.style) { bar.style.width = _V_.round(progress * 100, 2) + "%"; }
      // });

      // Move Handle
    }// ,
    //     onVolumeBarFocus: function(event){
    //       _V_.addEvent(document, "keyup", _V_.proxy(this, this.onVolumeBarKey));
    //     },
    //     onVolumeBarKey: function(event){
    //       if (event.which == 37) {
    //         event.preventDefault();
    //         this.currentTime(this.currentTime() - 1);
    //       } else if (event.which == 39) {
    //         event.preventDefault();
    //         this.currentTime(this.currentTime() + 1);
    //       }
    //     },
    //     onVolumeBarBlur: function(event){
    //        _V_.removeEvent(document, "keyup", _V_.proxy(this, this.onVolumeBarKey));
    //     }
  }
);

/* Mute Toggle
================================================================================ */
VideoJS.fn.newBehavior("muteToggle", function(element){
    if (!this.bels.muteToggles) {
      this.bels.muteToggles = [];
      this.addEvent("volumechange", this.muteTogglesOnVolumeChange);
    }
    this.bels.muteToggles.push(element);
    _V_.addEvent(element, "click", _V_.proxy(this, this.onMuteToggleClick));
    // _V_.addEvent(element, "focus", _V_.proxy(this, this.onMuteToggleFocus));
    // _V_.addEvent(element, "blur", _V_.proxy(this, this.onMuteToggleBlur));
  },
  function(){},
  {
    onMuteToggleClick: function(event){
      this.muted( this.muted() ? false : true );
    },
    muteTogglesOnVolumeChange: function(event){
      var vol = this.volume(),
          level = 3;

      if (vol == 0 || this.muted()) {
        level = 0;
      } else if (vol < 0.33) {
        level = 1;
      } else if (vol < 0.67) {
        level = 2;
      }

      this.each(this.bels.muteToggles, function(toggle){
        /* TODO improve muted icon classes */
        _V_.each([0,1,2,3], function(i){
          _V_.removeClass(toggle, "vjs-vol-"+i);
        });
        _V_.addClass(toggle, "vjs-vol-"+level);
      });
    }//,
    // onMuteToggleFocus: function(event){
    //   _V_.addEvent(document, "keyup", _V_.proxy(this, this.onMuteToggleKey));
    // },
    // onMuteToggleKey: function(event){
    //   if (event.which == 32 || event.which == 13) {
    //     event.preventDefault();
    //     this.onMuteToggleClick();
    //   }
    // },
    // onMuteToggleBlur: function(event){
    //    _V_.removeEvent(document, "keyup", _V_.proxy(this, this.onMuteToggleKey));
    // }
  }
);
_V_.controlSets.bar = {
  options: {},
  add: function(){
    /* See controls/controls.html to see the HTML this creates. */

    // Create a reference to the controls elements
    var bar = this.cels.bar = {};

    // Control Bar Main Div ("main")
    bar.main = _V_.createElement("div", { className: "vjs-controls" });
    // Add the controls to the video's container
    this.box.appendChild(bar.main);
    this.addBehavior(bar.main, "controlBar");

    // Play Control
    bar.playControl = _V_.createElement("div", {
      className: "vjs-play-control vjs-control",
      innerHTML: '<div><span class="vjs-control-text">Play</span></div>',
      role: "button", tabIndex: 0
    });
    bar.main.appendChild(bar.playControl);
    this.addBehavior(bar.playControl, "playToggle");

    /* Time -------------------------------------------------------------- */
    // Time Display
    bar.currentTime = _V_.createElement("div", { 
      className: "vjs-current-time vjs-time-controls vjs-control"
    });
    bar.currentTimeDisplay = _V_.createElement("span", { 
      className: "vjs-current-time-display",
      innerHTML: '0:00'
    });
    // Put display inside div, inside control div, to follow control scheme.
    bar.currentTime.appendChild(_V_.createElement("div").appendChild(bar.currentTimeDisplay));
    bar.main.appendChild(bar.currentTime);
    this.addBehavior(bar.currentTimeDisplay, "currentTimeDisplay");

    // Time Separator (Not used in main skin, but still available, and could be used as a 'spare element')
    bar.timeDivider = _V_.createElement("div", {
      className: "vjs-time-divider",
      innerHTML: '<div><span>/</span></div>'
    });
    bar.main.appendChild(bar.timeDivider);

    // Duration Display
    bar.duration = _V_.createElement("div", { 
      className: "vjs-duration vjs-time-controls vjs-control"
    });
    bar.durationDisplay = _V_.createElement("span", { 
      className: "vjs-duration-display",
      innerHTML: '0:00'
    });
    // Put display inside div, inside control div, to follow control scheme.
    bar.duration.appendChild(_V_.createElement("div").appendChild(bar.durationDisplay));
    bar.main.appendChild(bar.duration);
    this.addBehavior(bar.durationDisplay, "durationDisplay");
    
    // Duration Display
    bar.remainingTime = _V_.createElement("div", { 
      className: "vjs-remaining-time vjs-time-controls vjs-control"
    });
    bar.remainingTimeDisplay = _V_.createElement("span", { 
      className: "vjs-remaining-time-display",
      innerHTML: '-0:00'
    });
    // Put display inside div, inside control div, to follow control scheme.
    bar.remainingTime.appendChild(_V_.createElement("div").appendChild(bar.remainingTimeDisplay));
    bar.main.appendChild(bar.remainingTime);
    this.addBehavior(bar.remainingTime, "remainingTimeDisplay");

    /* Progress -------------------------------------------------------------- */
    // Progress Control: Seek, Load Progress, and Play Progress
    bar.progressControl = _V_.createElement("div", { className: "vjs-progress-control vjs-control" });
    bar.main.appendChild(bar.progressControl);

    // Seek Bar and holder for the progress bars
    bar.seekBar = _V_.createElement("div", { className: "vjs-progress-holder" });
    bar.progressControl.appendChild(bar.seekBar);

    // Load Progress Bar
    bar.loadProgressBar = _V_.createElement("div", {
      className: "vjs-load-progress",
      innerHTML: '<span class="vjs-control-text">Loaded: 0%</span>'
    });
    bar.seekBar.appendChild(bar.loadProgressBar);
    this.addBehavior(bar.loadProgressBar, "loadProgressBar");

    // Play Progress Bar
    bar.playProgressBar = _V_.createElement("div", { 
      className: "vjs-play-progress",
      innerHTML: '<span class="vjs-control-text">Progress: 0%</span>'
    });
    bar.seekBar.appendChild(bar.playProgressBar);

    // Seek Handle
    bar.seekHandle = _V_.createElement("div", {
      className: "vjs-seek-handle",
      innerHTML: '<span class="vjs-control-text">00:00</span>',
      tabIndex: 0,
      role: "slider", "aria-valuenow": 0, "aria-valuemin": 0, "aria-valuemax": 100
    });
    bar.seekBar.appendChild(bar.seekHandle);

    // SeekBar Behavior includes play progress bar, and seek handle
    // Needed so it can determine seek position based on handle position/size
    this.addBehavior(bar.seekBar, "seekBar");

    /* Fullscreen -------------------------------------------------------------- */
    // Fullscreen Button
    bar.fullscreenControl = _V_.createElement("div", {
      className: "vjs-fullscreen-control vjs-control",
      innerHTML: '<div><span class="vjs-control-text">Fullscreen</span></div>',
      role: "button", tabIndex: 0
    });
    bar.main.appendChild(bar.fullscreenControl);
    this.addBehavior(bar.fullscreenControl, "fullscreenToggle");

    /* Volume -------------------------------------------------------------- */
    // Fullscreen Button
    bar.volumeControl = _V_.createElement("div", { className: "vjs-volume-control vjs-control" });
    bar.volumeBar = _V_.createElement("div", { className: "vjs-volume-bar" });
    bar.volumeLevel = _V_.createElement("div", {
      className: "vjs-volume-level",
      innerHTML: '<span class="vjs-control-text"></span>'
    });
    bar.volumeHandle = _V_.createElement("div", {
      className: "vjs-volume-handle",
      innerHTML: '<span class="vjs-control-text"></span>',
      tabindex: 0,
      role: "slider", "aria-valuenow": 0, "aria-valuemin": 0, "aria-valuemax": 100
    });
    
    bar.volumeBar.appendChild(bar.volumeLevel);
    bar.volumeBar.appendChild(bar.volumeHandle);
    bar.volumeControl.appendChild(bar.volumeBar);
    bar.main.appendChild(bar.volumeControl);
    this.addBehavior(bar.volumeBar, "volumeBar");

    // Mute Button
    bar.muteControl = _V_.createElement("div", {
      className: "vjs-mute-control vjs-control",
      innerHTML: '<div><span class="vjs-control-text">Mute</span></div>',
      role: "button", tabIndex: 0
    });
    bar.main.appendChild(bar.muteControl);
    this.addBehavior(bar.muteControl, "muteToggle");
  },
  remove: function(){
    this.box.removeChild(this.cels.bigPlayButton);
    delete this.cels.bigPlayButton;
    this.removeBehavior(this.cels.bigPlayButton, "bigPlayButton");
  }
};
_V_.controlSets.bigPlayButton = {
  options: {},
  add: function(){
    /* Creating this HTML
      <div class="vjs-big-play-button"><span></span></div>
    */
    this.cels.bigPlayButton = _V_.createElement("div", {
      className: "vjs-big-play-button",
      innerHTML: "<span></span>"
    });
    this.box.appendChild(this.cels.bigPlayButton);
    this.addBehavior(this.cels.bigPlayButton, "bigPlayButton");
  },
  remove: function(){
    this.removeBehavior(this.cels.bigPlayButton, "bigPlayButton");
    this.box.removeChild(this.cels.bigPlayButton);
    delete this.cels.bigPlayButton;
  }
};

/* Big Play Button Behaviors
================================================================================ */
VideoJS.fn.newBehavior("bigPlayButton",
  // Add Big Play Button Behavior
  function(element){
    if (!this.bels.bigPlayButtons) {
      this.bels.bigPlayButtons = [];
      this.addEvent("play", this.hideBigPlayButtons);
      this.addEvent("ended", this.showBigPlayButtons);
    }
    this.bels.bigPlayButtons.push(element);
    this.addBehavior(element, "playButton");
  },
  // Remove Big Play Button Behavior
  function(element){
    
  },
  // Needed functions (added directly to player (this))
  {
    showBigPlayButtons: function(){
      if (!this.options.controlsEnabled) { return; }
      this.each(this.bels.bigPlayButtons, function(element){
        element.style.display = "block";
      });
    },
    hideBigPlayButtons: function(){
      this.each(this.bels.bigPlayButtons, function(element){
        element.style.display = "none";
      });
    }
  }
);
_V_.controlSets.subtitlesBox = {
  options: {},
  add: function(){
    /* Creating this HTML

      <div class="vjs-subtitles"></div>

    */

    // Create a reference to the element
    var subs = this.cels.subtitlesBox = _V_.createElement("div", { className: "vjs-subtitles" });

    // Add the controls to the video's container
    this.box.appendChild(subs);
    this.addBehavior(subs, "subtitlesDisplay");
  },
  remove: function(){
    this.removeBehavior(this.cels.subtitlesBox, "subtitlesDisplay");
    this.box.removeChild(this.cels.subtitlesBox);
    delete this.cels.subtitlesBox;
  }
};
_V_.loadPlayers = function(){
  var vids = document.getElementsByTagName("video"),
      options, vid;
  if (vids && vids.length > 0) {
    for (var i=0,j=vids.length; i<j; i++) {
      vid = vids[i];
      // Check if element exists, has getAttribute func.
      // IE seems to consider typeof el.getAttribute == "object" instead of "function" like expected, at least when loading the player immediately.
      if (vid && vid.getAttribute) {
        // Check if this video has already been set up by video.js.
        if (vid.player === undefined) {
          options = vid.getAttribute("data-setup");
          // Check if data-setup attr exists. 
          // We only auto-setup if they've added the data-setup attr.
          if (options !== null) {
            // Parse options JSON
            // If empty string, make it a parsable json object.
            options = JSON.parse(options || "{}");
            // Create new video.js instance.
            VideoJS.players[vid.id] = new VideoJS(vid, options);
          }
        }

      // If getAttribute isn't defined, we need to wait for the DOM.
      } else {
        _V_.loadPlayerTimeout(1);
        break;
      }
    }
  } else {
    _V_.loadPlayerTimeout(1);
  }
};
_V_.loadPlayerTimeout = function(wait){
  setTimeout(_V_.loadPlayers, wait);
};
_V_.loadPlayerTimeout(1); // Let vjs javascript finish executing

// Expose to global
window.VideoJS = window._V_ = VideoJS;

// End self-executing function
})(window);