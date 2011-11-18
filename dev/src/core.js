// HTML5 Shiv. Must be in <head>.
document.createElement("video");document.createElement("audio");

var VideoJS = _V_ = function(id, addOptions, ready){

  // If player has already been created for ID, return player.
  if (_V_.players[id]) {
    return _V_.players[id];
  }

  // Allow for element or ID to be passed in.
  var tag = (typeof id == "string" ? _V_.el(id) : id);
  if (!tag || !tag.nodeName) { // Could be a box div also
    throw new TypeError("The element or ID supplied is not valid. (video.js)"); // Returns
  }

  // Check if (not) using "new" operator before the function to create new instance
  if (!(this instanceof arguments.callee)) {
    // Return the player attr on the element if it exists
    // Otherwise set up a new player.
    return tag.player || new VideoJS(id, addOptions, ready);
  }

  this.tag = tag; // Store the original tag used to set options

  var box = this.box = _V_.createElement("div"), // Div to contain video and controls
      options = this.options = {},
      width = options.width = tag.width,
      height = options.height = tag.height,

      // Browsers default to 300x150 if there's no width/height or video size data.
      initWidth = width || 300,
      initHeight = height || 150,
      
      // If the HTML5 video is already playing, we'll adjust
      paused = tag.paused;

  // Make player findable on elements
  tag.player = box.player = this;

  // Wrap video tag in div (box) container
  tag.parentNode.insertBefore(box, tag);
  box.appendChild(tag); // Breaks iPhone, fixed in HTML5 setup.

  // Safari (5.1.1) and Chrome (15) both have issues when you use autoplay and a poster and no controls.
  // Chrome just hides the video. Safari hides the video if you move it in the DOM like VJS does.
  // This fixes the Safari issue by removing the poster, which is currently never used again after
  // the video starts playing.
  if (!paused) {
    options.poster = tag.poster
    tag.poster = null; 
    tag.play();
  }

  // Give video tag properties to box
  box.id = this.id = tag.id; // ID will now reference box, not the video tag
  box.className = tag.className;
  // Update tag id/class for use as HTML5 playback tech
  tag.id += "_html5_api";
  tag.className = "vjs-tech";

  // Make player easily findable by ID
  _V_.players[box.id] = this

  // Make box use width/height of tag, or default 300x150
  box.setAttribute("width", initWidth);
  box.setAttribute("height", initHeight);
  // Enforce with CSS since width/height attrs don't work on divs
  box.style.width = initWidth+"px";
  box.style.height = initHeight+"px";
  // Remove width/height attrs from tag so CSS can make it 100% width/height
  tag.removeAttribute("width");
  tag.removeAttribute("height");

  // Store controls setting, and then remove immediately so native controls don't flash.
  options.controls = tag.getAttribute("controls") !== null;
  tag.removeAttribute("controls");

  // Set Options
  _V_.merge(options, _V_.options); // Copy Global Defaults
  _V_.merge(options, this.getVideoTagSettings()); // Override with Video Tag Options
  _V_.merge(options, addOptions); // Override/extend with options from setup call

  // Empty video tag sources and tracks so the built in player doesn't use them also.
  if (tag.hasChildNodes()) {
    for (var i=0,j=tag.childNodes;i<j.length;i++) {
      if (j[i].nodeName == "SOURCE" || j[i].nodeName == "TRACK") {
        tag.removeChild(j[i]);
      }
    }
  }

  // Add callback to ready queue
  if (ready) { this.ready(ready); }

  // Store references to elements for different purposes
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

  // When the API is ready, loop through the controlsets and add to the player.
  if (this.options.controls) {
    this.addEvent("techready", function(){
      this.each(this.options.controlSets, function(set){
        _V_.controlSets[set].add.call(this);
      });
    });
  }

  // Loop through playback technologies (HTML5, Flash) and check for support
  // Then load the best source.
  this.src(this.options.sources);

  // Return Player Obj (though API will not be ready yet)
  return this;

}, _V_ = VideoJS;

VideoJS.options = {
  techOrder: ["html5","h5swf","flowplayer"],
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

    options.src = this.tag.src;
    options.poster = this.tag.poster;
    options.preload = this.tag.preload;
    options.autoplay = this.tag.getAttribute("autoplay") !== null; // hasAttribute not IE <8 compatible
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
      this.addBehavior(this.currentTechElement, "playToggle");

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
      this.pause();
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
        _V_.log("VideoJS: LocalStorage Full")
      }
    }
  }
};

VideoJS.players = {};
