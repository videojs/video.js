/**
 * Main player class. A player instance is returned by _V_(id);
 * @param {Element} tag        The original video tag used for configuring options
 * @param {Object=} options    Player options
 * @param {Function=} ready    Ready callback function
 * @constructor
 */
vjs.Player = vjs.Component.extend({
  /** @constructor */
  init: function(tag, options, ready){
    this.tag = tag; // Store the original tag used to set options

    // Set Options
    // The options argument overrides options set in the video tag
    // which overrides globally set options.
    // This latter part coincides with the load order
    // (tag must exist before Player)
    options = vjs.obj.merge(this.getTagSettings(tag), options);

    // Cache for video property values.
    this.cache_ = {};

    // Set poster
    this.poster_ = options['poster'];
    // Set controls
    this.controls_ = options['controls'];

    // Run base component initializing with new options.
    // Builds the element through createEl()
    // Inits and embeds any child components in opts
    vjs.Component.call(this, this, options, ready);

    // Firstplay event implimentation. Not sold on the event yet.
    // Could probably just check currentTime==0?
    this.one('play', function(e){
      var fpEvent = { type: 'firstplay', target: this.el_ };
      // Using vjs.trigger so we can check if default was prevented
      var keepGoing = vjs.trigger(this.el_, fpEvent);

      if (!keepGoing) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
      }
    });

    this.on('ended', this.onEnded);
    this.on('play', this.onPlay);
    this.on('firstplay', this.onFirstPlay);
    this.on('pause', this.onPause);
    this.on('progress', this.onProgress);
    this.on('durationchange', this.onDurationChange);
    this.on('error', this.onError);
    this.on('fullscreenchange', this.onFullscreenChange);

    // Make player easily findable by ID
    vjs.players[this.id_] = this;

    if (options['plugins']) {
      vjs.obj.each(options['plugins'], function(key, val){
        this[key](val);
      }, this);
    }
  }
});

/**
 * Player instance options, surfaced using vjs.options
 * vjs.options = vjs.Player.prototype.options_
 * Make changes in vjs.options, not here.
 * All options should use string keys so they avoid
 * renaming by closure compiler
 * @type {Object}
 * @private
 */
vjs.Player.prototype.options_ = vjs.options;

vjs.Player.prototype.dispose = function(){
  // this.isReady_ = false;

  // Kill reference to this player
  vjs.players[this.id_] = null;
  if (this.tag && this.tag['player']) { this.tag['player'] = null; }
  if (this.el_ && this.el_['player']) { this.el_['player'] = null; }

  // Ensure that tracking progress and time progress will stop and plater deleted
  this.stopTrackingProgress();
  this.stopTrackingCurrentTime();

  if (this.tech) { this.tech.dispose(); }

  // Component dispose
  vjs.Component.prototype.dispose.call(this);
};

vjs.Player.prototype.getTagSettings = function(tag){
  var options = {
    'sources': [],
    'tracks': []
  };

  vjs.obj.merge(options, vjs.getAttributeValues(tag));

  // Get tag children settings
  if (tag.hasChildNodes()) {
    var child, childName,
        children = tag.childNodes,
        i = 0,
        j = children.length;

    for (; i < j; i++) {
      child = children[i];
      // Change case needed: http://ejohn.org/blog/nodename-case-sensitivity/
      childName = child.nodeName.toLowerCase();

      if (childName === 'source') {
        options['sources'].push(vjs.getAttributeValues(child));

      } else if (childName === 'track') {
        options['tracks'].push(vjs.getAttributeValues(child));

      }
    }
  }

  return options;
};

vjs.Player.prototype.createEl = function(){
  var el = this.el_ = vjs.Component.prototype.createEl.call(this, 'div');
  var tag = this.tag;

  // Original tag settings stored in options
  // now remove immediately so native controls don't flash.
  tag.removeAttribute('controls');
  // Remove width/height attrs from tag so CSS can make it 100% width/height
  tag.removeAttribute('width');
  tag.removeAttribute('height');
  // Empty video tag sources and tracks so the built-in player doesn't use them also.
  // This may not be fast enough to stop HTML5 browsers from reading the tags
  // so we'll need to turn off any default tracks if we're manually doing
  // captions and subtitles. videoElement.textTracks
  if (tag.hasChildNodes()) {
    var nrOfChildNodes = tag.childNodes.length;
    for (var i=0,j=tag.childNodes;i<nrOfChildNodes;i++) {
      if (j[0].nodeName.toLowerCase() == 'source' || j[0].nodeName.toLowerCase() == 'track') {
        tag.removeChild(j[0]);
      }
    }
  }

  // Make sure tag ID exists
  tag.id = tag.id || 'vjs_video_' + vjs.guid++;

  // Give video tag ID and class to player div
  // ID will now reference player box, not the video tag
  el.id = tag.id;
  el.className = tag.className;

  // Update tag id/class for use as HTML5 playback tech
  // Might think we should do this after embedding in container so .vjs-tech class
  // doesn't flash 100% width/height, but class only applies with .video-js parent
  tag.id += '_html5_api';
  tag.className = 'vjs-tech';

  // Make player findable on elements
  tag['player'] = el['player'] = this;
  // Default state of video is paused
  this.addClass('vjs-paused');

  // Make box use width/height of tag, or rely on default implementation
  // Enforce with CSS since width/height attrs don't work on divs
  this.width(this.options_['width'], true); // (true) Skip resize listener on load
  this.height(this.options_['height'], true);

  // Wrap video tag in div (el/box) container
  if (tag.parentNode) {
    tag.parentNode.insertBefore(el, tag);
  }
  vjs.insertFirst(tag, el); // Breaks iPhone, fixed in HTML5 setup.

  return el;
};

// /* Media Technology (tech)
// ================================================================================ */
// Load/Create an instance of playback technlogy including element and API methods
// And append playback element in player div.
vjs.Player.prototype.loadTech = function(techName, source){

  // Pause and remove current playback technology
  if (this.tech) {
    this.unloadTech();

  // If the first time loading, HTML5 tag will exist but won't be initialized
  // So we need to remove it if we're not loading HTML5
  } else if (techName !== 'Html5' && this.tag) {
    this.el_.removeChild(this.tag);
    this.tag.player = null;
    this.tag = null;
  }

  this.techName = techName;

  // Turn off API access because we're loading a new tech that might load asynchronously
  this.isReady_ = false;

  var techReady = function(){
    this.player_.triggerReady();

    // Manually track progress in cases where the browser/flash player doesn't report it.
    if (!this.features.progressEvents) {
      this.player_.manualProgressOn();
    }

    // Manually track timeudpates in cases where the browser/flash player doesn't report it.
    if (!this.features.timeupdateEvents) {
      this.player_.manualTimeUpdatesOn();
    }
  };

  // Grab tech-specific options from player options and add source and parent element to use.
  var techOptions = vjs.obj.merge({ 'source': source, 'parentEl': this.el_ }, this.options_[techName.toLowerCase()]);

  if (source) {
    if (source.src == this.cache_.src && this.cache_.currentTime > 0) {
      techOptions['startTime'] = this.cache_.currentTime;
    }

    this.cache_.src = source.src;
  }

  // Initialize tech instance
  this.tech = new window['videojs'][techName](this, techOptions);

  this.tech.ready(techReady);
};

vjs.Player.prototype.unloadTech = function(){
  this.isReady_ = false;
  this.tech.dispose();

  // Turn off any manual progress or timeupdate tracking
  if (this.manualProgress) { this.manualProgressOff(); }

  if (this.manualTimeUpdates) { this.manualTimeUpdatesOff(); }

  this.tech = false;
};

// There's many issues around changing the size of a Flash (or other plugin) object.
// First is a plugin reload issue in Firefox that has been around for 11 years: https://bugzilla.mozilla.org/show_bug.cgi?id=90268
// Then with the new fullscreen API, Mozilla and webkit browsers will reload the flash object after going to fullscreen.
// To get around this, we're unloading the tech, caching source and currentTime values, and reloading the tech once the plugin is resized.
// reloadTech: function(betweenFn){
//   vjs.log('unloadingTech')
//   this.unloadTech();
//   vjs.log('unloadedTech')
//   if (betweenFn) { betweenFn.call(); }
//   vjs.log('LoadingTech')
//   this.loadTech(this.techName, { src: this.cache_.src })
//   vjs.log('loadedTech')
// },

/* Fallbacks for unsupported event types
================================================================================ */
// Manually trigger progress events based on changes to the buffered amount
// Many flash players and older HTML5 browsers don't send progress or progress-like events
vjs.Player.prototype.manualProgressOn = function(){
  this.manualProgress = true;

  // Trigger progress watching when a source begins loading
  this.trackProgress();

  // Watch for a native progress event call on the tech element
  // In HTML5, some older versions don't support the progress event
  // So we're assuming they don't, and turning off manual progress if they do.
  // As opposed to doing user agent detection
  this.tech.one('progress', function(){

    // Update known progress support for this playback technology
    this.features.progressEvents = true;

    // Turn off manual progress tracking
    this.player_.manualProgressOff();
  });
};

vjs.Player.prototype.manualProgressOff = function(){
  this.manualProgress = false;
  this.stopTrackingProgress();
};

vjs.Player.prototype.trackProgress = function(){

  this.progressInterval = setInterval(vjs.bind(this, function(){
    // Don't trigger unless buffered amount is greater than last time
    // log(this.cache_.bufferEnd, this.buffered().end(0), this.duration())
    /* TODO: update for multiple buffered regions */
    if (this.cache_.bufferEnd < this.buffered().end(0)) {
      this.trigger('progress');
    } else if (this.bufferedPercent() == 1) {
      this.stopTrackingProgress();
      this.trigger('progress'); // Last update
    }
  }), 500);
};
vjs.Player.prototype.stopTrackingProgress = function(){ clearInterval(this.progressInterval); };

/* Time Tracking -------------------------------------------------------------- */
vjs.Player.prototype.manualTimeUpdatesOn = function(){
  this.manualTimeUpdates = true;

  this.on('play', this.trackCurrentTime);
  this.on('pause', this.stopTrackingCurrentTime);
  // timeupdate is also called by .currentTime whenever current time is set

  // Watch for native timeupdate event
  this.tech.one('timeupdate', function(){
    // Update known progress support for this playback technology
    this.features.timeupdateEvents = true;
    // Turn off manual progress tracking
    this.player_.manualTimeUpdatesOff();
  });
};

vjs.Player.prototype.manualTimeUpdatesOff = function(){
  this.manualTimeUpdates = false;
  this.stopTrackingCurrentTime();
  this.off('play', this.trackCurrentTime);
  this.off('pause', this.stopTrackingCurrentTime);
};

vjs.Player.prototype.trackCurrentTime = function(){
  if (this.currentTimeInterval) { this.stopTrackingCurrentTime(); }
  this.currentTimeInterval = setInterval(vjs.bind(this, function(){
    this.trigger('timeupdate');
  }), 250); // 42 = 24 fps // 250 is what Webkit uses // FF uses 15
};

// Turn off play progress tracking (when paused or dragging)
vjs.Player.prototype.stopTrackingCurrentTime = function(){ clearInterval(this.currentTimeInterval); };

// /* Player event handlers (how the player reacts to certain events)
// ================================================================================ */
vjs.Player.prototype.onEnded = function(){
  if (this.options_['loop']) {
    this.currentTime(0);
    this.play();
  }
};

vjs.Player.prototype.onPlay = function(){
  vjs.removeClass(this.el_, 'vjs-paused');
  vjs.addClass(this.el_, 'vjs-playing');
};

vjs.Player.prototype.onFirstPlay = function(){
    //If the first starttime attribute is specified
    //then we will start at the given offset in seconds
    if(this.options_['starttime']){
      this.currentTime(this.options_['starttime']);
    }
};

vjs.Player.prototype.onPause = function(){
  vjs.removeClass(this.el_, 'vjs-playing');
  vjs.addClass(this.el_, 'vjs-paused');
};

vjs.Player.prototype.onProgress = function(){
  // Add custom event for when source is finished downloading.
  if (this.bufferedPercent() == 1) {
    this.trigger('loadedalldata');
  }
};

// Update duration with durationchange event
// Allows for cacheing value instead of asking player each time.
vjs.Player.prototype.onDurationChange = function(){
  this.duration(this.techGet('duration'));
};

vjs.Player.prototype.onError = function(e) {
  vjs.log('Video Error', e);
};

vjs.Player.prototype.onFullscreenChange = function(e) {
  if (this.isFullScreen) {
    this.addClass('vjs-fullscreen');
  } else {
    this.removeClass('vjs-fullscreen');
  }
};

// /* Player API
// ================================================================================ */

/**
 * Object for cached values.
 * @private
 */
vjs.Player.prototype.cache_;

vjs.Player.prototype.getCache = function(){
  return this.cache_;
};

// Pass values to the playback tech
vjs.Player.prototype.techCall = function(method, arg){
  // If it's not ready yet, call method when it is
  if (this.tech && this.tech.isReady_) {
    this.tech.ready(function(){
      this[method](arg);
    });

  // Otherwise call method now
  } else {
    try {
      this.tech[method](arg);
    } catch(e) {
      vjs.log(e);
    }
  }
};

// Get calls can't wait for the tech, and sometimes don't need to.
vjs.Player.prototype.techGet = function(method){

  // Make sure there is a tech
  // if (!this.tech) {
  //   return;
  // }

  if (this.tech.isReady_) {

    // Flash likes to die and reload when you hide or reposition it.
    // In these cases the object methods go away and we get errors.
    // When that happens we'll catch the errors and inform tech that it's not ready any more.
    try {
      return this.tech[method]();
    } catch(e) {

      // When building additional tech libs, an expected method may not be defined yet
      if (this.tech[method] === undefined) {
        vjs.log('Video.js: ' + method + ' method not defined for '+this.techName+' playback technology.', e);

      } else {

        // When a method isn't available on the object it throws a TypeError
        if (e.name == 'TypeError') {
          vjs.log('Video.js: ' + method + ' unavailable on '+this.techName+' playback technology element.', e);
          this.tech.isReady_ = false;
          throw e;
        } else {
          vjs.log(e);
        }
      }
    }
  }

  return;
};

/**
 * Start media playback
 * http://dev.w3.org/html5/spec/video.html#dom-media-play
 * We're triggering the 'play' event here instead of relying on the
 * media element to allow using event.preventDefault() to stop
 * play from happening if desired. Usecase: preroll ads.
 */
vjs.Player.prototype.play = function(){
  this.techCall('play');
  return this;
};

// http://dev.w3.org/html5/spec/video.html#dom-media-pause
vjs.Player.prototype.pause = function(){
  this.techCall('pause');
  return this;
};

// http://dev.w3.org/html5/spec/video.html#dom-media-paused
// The initial state of paused should be true (in Safari it's actually false)
vjs.Player.prototype.paused = function(){
  return (this.techGet('paused') === false) ? false : true;
};

// http://dev.w3.org/html5/spec/video.html#dom-media-currenttime
vjs.Player.prototype.currentTime = function(seconds){
  if (seconds !== undefined) {

    // Cache the last set value for smoother scrubbing.
    this.cache_.lastSetCurrentTime = seconds;

    this.techCall('setCurrentTime', seconds);

    // Improve the accuracy of manual timeupdates
    if (this.manualTimeUpdates) { this.trigger('timeupdate'); }

    return this;
  }

  // Cache last currentTime and return
  // Default to 0 seconds
  return this.cache_.currentTime = (this.techGet('currentTime') || 0);
};

// http://dev.w3.org/html5/spec/video.html#dom-media-duration
// Duration should return NaN if not available. ParseFloat will turn false-ish values to NaN.
vjs.Player.prototype.duration = function(seconds){
  if (seconds !== undefined) {

    // Cache the last set value for optimiized scrubbing (esp. Flash)
    this.cache_.duration = parseFloat(seconds);

    return this;
  }

  return this.cache_.duration;
};

// Calculates how much time is left. Not in spec, but useful.
vjs.Player.prototype.remainingTime = function(){
  return this.duration() - this.currentTime();
};

// http://dev.w3.org/html5/spec/video.html#dom-media-buffered
// Buffered returns a timerange object.
// Kind of like an array of portions of the video that have been downloaded.
// So far no browsers return more than one range (portion)
vjs.Player.prototype.buffered = function(){
  var buffered = this.techGet('buffered'),
      start = 0,
      // Default end to 0 and store in values
      end = this.cache_.bufferEnd = this.cache_.bufferEnd || 0;

  if (buffered && buffered.length > 0 && buffered.end(0) !== end) {
    end = buffered.end(0);
    // Storing values allows them be overridden by setBufferedFromProgress
    this.cache_.bufferEnd = end;
  }

  return vjs.createTimeRange(start, end);
};

// Calculates amount of buffer is full. Not in spec but useful.
vjs.Player.prototype.bufferedPercent = function(){
  return (this.duration()) ? this.buffered().end(0) / this.duration() : 0;
};

// http://dev.w3.org/html5/spec/video.html#dom-media-volume
vjs.Player.prototype.volume = function(percentAsDecimal){
  var vol;

  if (percentAsDecimal !== undefined) {
    vol = Math.max(0, Math.min(1, parseFloat(percentAsDecimal))); // Force value to between 0 and 1
    this.cache_.volume = vol;
    this.techCall('setVolume', vol);
    vjs.setLocalStorage('volume', vol);
    return this;
  }

  // Default to 1 when returning current volume.
  vol = parseFloat(this.techGet('volume'));
  return (isNaN(vol)) ? 1 : vol;
};

// http://dev.w3.org/html5/spec/video.html#attr-media-muted
vjs.Player.prototype.muted = function(muted){
  if (muted !== undefined) {
    this.techCall('setMuted', muted);
    return this;
  }
  return this.techGet('muted') || false; // Default to false
};

// Check if current tech can support native fullscreen (e.g. with built in controls lik iOS, so not our flash swf)
vjs.Player.prototype.supportsFullScreen = function(){ return this.techGet('supportsFullScreen') || false; };

// Turn on fullscreen (or window) mode
vjs.Player.prototype.requestFullScreen = function(){
  var requestFullScreen = vjs.support.requestFullScreen;

  this.isFullScreen = true;

  // Check for browser element fullscreen support
  if (requestFullScreen) {

    // Trigger fullscreenchange event after change
    vjs.on(document, requestFullScreen.eventName, vjs.bind(this, function(){
      this.isFullScreen = document[requestFullScreen.isFullScreen];

      // If cancelling fullscreen, remove event listener.
      if (this.isFullScreen === false) {
        vjs.off(document, requestFullScreen.eventName, arguments.callee);
      }

      this.trigger('fullscreenchange');
    }));

    // Flash and other plugins get reloaded when you take their parent to fullscreen.
    // To fix that we'll remove the tech, and reload it after the resize has finished.
    if (this.tech.features.fullscreenResize === false && this.options_['flash']['iFrameMode'] !== true) {

      this.pause();
      this.unloadTech();

      vjs.on(document, requestFullScreen.eventName, vjs.bind(this, function(){
        vjs.off(document, requestFullScreen.eventName, arguments.callee);
        this.loadTech(this.techName, { src: this.cache_.src });
      }));

      this.el_[requestFullScreen.requestFn]();

    } else {
      this.el_[requestFullScreen.requestFn]();
    }

  } else if (this.tech.supportsFullScreen()) {
    this.trigger('fullscreenchange');
    this.techCall('enterFullScreen');

  } else {
    this.trigger('fullscreenchange');
    this.enterFullWindow();
  }

   return this;
};

vjs.Player.prototype.cancelFullScreen = function(){
  var requestFullScreen = vjs.support.requestFullScreen;

  this.isFullScreen = false;

  // Check for browser element fullscreen support
  if (requestFullScreen) {

   // Flash and other plugins get reloaded when you take their parent to fullscreen.
   // To fix that we'll remove the tech, and reload it after the resize has finished.
   if (this.tech.features.fullscreenResize === false && this.options_['flash']['iFrameMode'] !== true) {

     this.pause();
     this.unloadTech();

     vjs.on(document, requestFullScreen.eventName, vjs.bind(this, function(){
       vjs.off(document, requestFullScreen.eventName, arguments.callee);
       this.loadTech(this.techName, { src: this.cache_.src });
     }));

     document[requestFullScreen.cancelFn]();

   } else {
     document[requestFullScreen.cancelFn]();
   }

  } else if (this.tech.supportsFullScreen()) {
   this.techCall('exitFullScreen');
   this.trigger('fullscreenchange');

  } else {
   this.exitFullWindow();
   this.trigger('fullscreenchange');
  }

  return this;
};

// When fullscreen isn't supported we can stretch the video container to as wide as the browser will let us.
vjs.Player.prototype.enterFullWindow = function(){
  this.isFullWindow = true;

  // Storing original doc overflow value to return to when fullscreen is off
  this.docOrigOverflow = document.documentElement.style.overflow;

  // Add listener for esc key to exit fullscreen
  vjs.on(document, 'keydown', vjs.bind(this, this.fullWindowOnEscKey));

  // Hide any scroll bars
  document.documentElement.style.overflow = 'hidden';

  // Apply fullscreen styles
  vjs.addClass(document.body, 'vjs-full-window');
  vjs.addClass(this.el_, 'vjs-fullscreen');

  this.trigger('enterFullWindow');
};
vjs.Player.prototype.fullWindowOnEscKey = function(event){
  if (event.keyCode === 27) {
    if (this.isFullScreen === true) {
      this.cancelFullScreen();
    } else {
      this.exitFullWindow();
    }
  }
};

vjs.Player.prototype.exitFullWindow = function(){
  this.isFullWindow = false;
  vjs.off(document, 'keydown', this.fullWindowOnEscKey);

  // Unhide scroll bars.
  document.documentElement.style.overflow = this.docOrigOverflow;

  // Remove fullscreen styles
  vjs.removeClass(document.body, 'vjs-full-window');
  vjs.removeClass(this.el_, 'vjs-fullscreen');

  // Resize the box, controller, and poster to original sizes
  // this.positionAll();
  this.trigger('exitFullWindow');
};

vjs.Player.prototype.selectSource = function(sources){

  // Loop through each playback technology in the options order
  for (var i=0,j=this.options_['techOrder'];i<j.length;i++) {
    var techName = vjs.capitalize(j[i]),
        tech = window['videojs'][techName];

    // Check if the browser supports this technology
    if (tech.isSupported()) {
      // Loop through each source object
      for (var a=0,b=sources;a<b.length;a++) {
        var source = b[a];

        // Check if source can be played with this technology
        if (tech['canPlaySource'](source)) {
          return { source: source, tech: techName };
        }
      }
    }
  }

  return false;
};

// src is a pretty powerful function
// If you pass it an array of source objects, it will find the best source to play and use that object.src
//   If the new source requires a new playback technology, it will switch to that.
// If you pass it an object, it will set the source to object.src
// If you pass it anything else (url string) it will set the video source to that
vjs.Player.prototype.src = function(source){
  // Case: Array of source objects to choose from and pick the best to play
  if (source instanceof Array) {

    var sourceTech = this.selectSource(source),
        techName;

    if (sourceTech) {
        source = sourceTech.source;
        techName = sourceTech.tech;

      // If this technology is already loaded, set source
      if (techName == this.techName) {
        this.src(source); // Passing the source object
      // Otherwise load this technology with chosen source
      } else {
        this.loadTech(techName, source);
      }
    } else {
      this.el_.appendChild(vjs.createEl('p', {
        innerHTML: 'Sorry, no compatible source and playback technology were found for this video. Try using another browser like <a href="http://bit.ly/ccMUEC">Chrome</a> or download the latest <a href="http://adobe.ly/mwfN1">Adobe Flash Player</a>.'
      }));
    }

  // Case: Source object { src: '', type: '' ... }
  } else if (source instanceof Object) {

    if (window['videojs'][this.techName]['canPlaySource'](source)) {
      this.src(source.src);
    } else {
      // Send through tech loop to check for a compatible technology.
      this.src([source]);
    }

  // Case: URL String (http://myvideo...)
  } else {
    // Cache for getting last set source
    this.cache_.src = source;

    if (!this.isReady_) {
      this.ready(function(){
        this.src(source);
      });
    } else {
      this.techCall('src', source);
      if (this.options_['preload'] == 'auto') {
        this.load();
      }
      if (this.options_['autoplay']) {
        this.play();
      }
    }
  }
  return this;
};

// Begin loading the src data
// http://dev.w3.org/html5/spec/video.html#dom-media-load
vjs.Player.prototype.load = function(){
  this.techCall('load');
  return this;
};

// http://dev.w3.org/html5/spec/video.html#dom-media-currentsrc
vjs.Player.prototype.currentSrc = function(){
  return this.techGet('currentSrc') || this.cache_.src || '';
};

// Attributes/Options
vjs.Player.prototype.preload = function(value){
  if (value !== undefined) {
    this.techCall('setPreload', value);
    this.options_['preload'] = value;
    return this;
  }
  return this.techGet('preload');
};
vjs.Player.prototype.autoplay = function(value){
  if (value !== undefined) {
    this.techCall('setAutoplay', value);
    this.options_['autoplay'] = value;
    return this;
  }
  return this.techGet('autoplay', value);
};
vjs.Player.prototype.loop = function(value){
  if (value !== undefined) {
    this.techCall('setLoop', value);
    this.options_['loop'] = value;
    return this;
  }
  return this.techGet('loop');
};

/**
 * The url of the poster image source.
 * @type {String}
 * @private
 */
vjs.Player.prototype.poster_;

/**
 * Get or set the poster image source url.
 * @param  {String} src Poster image source URL
 * @return {String}    Poster image source URL or null
 */
vjs.Player.prototype.poster = function(src){
  if (src !== undefined) {
    this.poster_ = src;
  }
  return this.poster_;
};

/**
 * Whether or not the controls are showing
 * @type {Boolean}
 * @private
 */
vjs.Player.prototype.controls_;

/**
 * Get or set whether or not the controls are showing.
 * @param  {Boolean} controls Set controls to showing or not
 * @return {Boolean}    Controls are showing
 */
vjs.Player.prototype.controls = function(controls){
  if (controls !== undefined) {
    this.controls_ = controls;
  }
  return this.controls_;
};

vjs.Player.prototype.error = function(){ return this.techGet('error'); };
vjs.Player.prototype.ended = function(){ return this.techGet('ended'); };

// Methods to add support for
// networkState: function(){ return this.techCall('networkState'); },
// readyState: function(){ return this.techCall('readyState'); },
// seeking: function(){ return this.techCall('seeking'); },
// initialTime: function(){ return this.techCall('initialTime'); },
// startOffsetTime: function(){ return this.techCall('startOffsetTime'); },
// played: function(){ return this.techCall('played'); },
// seekable: function(){ return this.techCall('seekable'); },
// videoTracks: function(){ return this.techCall('videoTracks'); },
// audioTracks: function(){ return this.techCall('audioTracks'); },
// videoWidth: function(){ return this.techCall('videoWidth'); },
// videoHeight: function(){ return this.techCall('videoHeight'); },
// defaultPlaybackRate: function(){ return this.techCall('defaultPlaybackRate'); },
// playbackRate: function(){ return this.techCall('playbackRate'); },
// mediaGroup: function(){ return this.techCall('mediaGroup'); },
// controller: function(){ return this.techCall('controller'); },
// defaultMuted: function(){ return this.techCall('defaultMuted'); }

// TODO
// currentSrcList: the array of sources including other formats and bitrates
// playList: array of source lists in order of playback

// RequestFullscreen API
(function(){
  var requestFn, cancelFn, eventName, isFullScreen;

  // Current W3C Spec
  // http://dvcs.w3.org/hg/fullscreen/raw-file/tip/Overview.html#api
  // Mozilla Draft: https://wiki.mozilla.org/Gecko:FullScreenAPI#fullscreenchange_event
  if (document.cancelFullscreen !== undefined) {
    requestFn = 'requestFullscreen';
    cancelFn = 'exitFullscreen';
    eventName = 'fullscreenchange';
    isFullScreen = 'fullScreen';

  // Webkit (Chrome/Safari) and Mozilla (Firefox) have working implementaitons
  // that use prefixes and vary slightly from the new W3C spec. Specifically, using 'exit' instead of 'cancel',
  // and lowercasing the 'S' in Fullscreen.
  // Other browsers don't have any hints of which version they might follow yet, so not going to try to predict by loopeing through all prefixes.
  } else {

    var prefixes = ['moz', 'webkit'];

    for (var i = prefixes.length - 1; i >= 0; i--) {
      var prefix = prefixes[i];

      // https://github.com/zencoder/video-js/pull/128
      if ((prefix != 'moz' || document.mozFullScreenEnabled) && document[prefix + 'CancelFullScreen'] !== undefined) {
        requestFn = prefix + 'RequestFullScreen';
        cancelFn = prefix + 'CancelFullScreen';
        eventName = prefix + 'fullscreenchange';

        if (prefix == 'webkit') {
          isFullScreen = prefix + 'IsFullScreen';
        } else {
          isFullScreen = prefix + 'FullScreen';
        }
      }
    }
  }

  if (requestFn) {
    vjs.support.requestFullScreen = {
      requestFn: requestFn,
      cancelFn: cancelFn,
      eventName: eventName,
      isFullScreen: isFullScreen
    };
  }

})();


