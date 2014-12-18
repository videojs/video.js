/**
 * An instance of the `vjs.Player` class is created when any of the Video.js setup methods are used to initialize a video.
 *
 * ```js
 * var myPlayer = videojs('example_video_1');
 * ```
 *
 * In the following example, the `data-setup` attribute tells the Video.js library to create a player instance when the library is ready.
 *
 * ```html
 * <video id="example_video_1" data-setup='{}' controls>
 *   <source src="my-source.mp4" type="video/mp4">
 * </video>
 * ```
 *
 * After an instance has been created it can be accessed globally using `Video('example_video_1')`.
 *
 * @class
 * @extends vjs.Component
 */
vjs.Player = vjs.Component.extend({

  /**
   * player's constructor function
   *
   * @constructs
   * @method init
   * @param {Element} tag        The original video tag used for configuring options
   * @param {Object=} options    Player options
   * @param {Function=} ready    Ready callback function
   */
  init: function(tag, options, ready){
    this.tag = tag; // Store the original tag used to set options

    // Make sure tag ID exists
    tag.id = tag.id || 'vjs_video_' + vjs.guid++;

    // Store the tag attributes used to restore html5 element
    this.tagAttributes = tag && vjs.getElementAttributes(tag);

    // Set Options
    // The options argument overrides options set in the video tag
    // which overrides globally set options.
    // This latter part coincides with the load order
    // (tag must exist before Player)
    options = vjs.obj.merge(this.getTagSettings(tag), options);

    // Update Current Language
    this.language_ = options['language'] || vjs.options['language'];

    // Update Supported Languages
    this.languages_ = options['languages'] || vjs.options['languages'];

    // Cache for video property values.
    this.cache_ = {};

    // Set poster
    this.poster_ = options['poster'] || '';

    // Set controls
    this.controls_ = !!options['controls'];
    // Original tag settings stored in options
    // now remove immediately so native controls don't flash.
    // May be turned back on by HTML5 tech if nativeControlsForTouch is true
    tag.controls = false;

    // we don't want the player to report touch activity on itself
    // see enableTouchActivity in Component
    options.reportTouchActivity = false;

    // Set isAudio based on whether or not an audio tag was used
    this.isAudio(this.tag.nodeName.toLowerCase() === 'audio');

    // Run base component initializing with new options.
    // Builds the element through createEl()
    // Inits and embeds any child components in opts
    vjs.Component.call(this, this, options, ready);

    // Update controls className. Can't do this when the controls are initially
    // set because the element doesn't exist yet.
    if (this.controls()) {
      this.addClass('vjs-controls-enabled');
    } else {
      this.addClass('vjs-controls-disabled');
    }

    if (this.isAudio()) {
      this.addClass('vjs-audio');
    }

    // TODO: Make this smarter. Toggle user state between touching/mousing
    // using events, since devices can have both touch and mouse events.
    // if (vjs.TOUCH_ENABLED) {
    //   this.addClass('vjs-touch-enabled');
    // }

    // Make player easily findable by ID
    vjs.players[this.id_] = this;

    if (options['plugins']) {
      vjs.obj.each(options['plugins'], function(key, val){
        this[key](val);
      }, this);
    }

    this.listenForUserActivity();
  }
});

/**
 * The player's stored language code
 *
 * @type {String}
 * @private
 */
vjs.Player.prototype.language_;

/**
 * The player's language code
 * @param  {String} languageCode  The locale string
 * @return {String}             The locale string when getting
 * @return {vjs.Player}         self, when setting
 */
vjs.Player.prototype.language = function (languageCode) {
  if (languageCode === undefined) {
    return this.language_;
  }

  this.language_ = languageCode;
  return this;
};

/**
 * The player's stored language dictionary
 *
 * @type {Object}
 * @private
 */
vjs.Player.prototype.languages_;

vjs.Player.prototype.languages = function(){
  return this.languages_;
};

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

/**
 * Destroys the video player and does any necessary cleanup
 *
 *     myPlayer.dispose();
 *
 * This is especially helpful if you are dynamically adding and removing videos
 * to/from the DOM.
 */
vjs.Player.prototype.dispose = function(){
  this.trigger('dispose');
  // prevent dispose from being called twice
  this.off('dispose');

  // Kill reference to this player
  vjs.players[this.id_] = null;
  if (this.tag && this.tag['player']) { this.tag['player'] = null; }
  if (this.el_ && this.el_['player']) { this.el_['player'] = null; }

  if (this.tech) { this.tech.dispose(); }

  // Component dispose
  vjs.Component.prototype.dispose.call(this);
};

vjs.Player.prototype.getTagSettings = function(tag){
  var tagOptions,
      dataSetup,
      options = {
        'sources': [],
        'tracks': []
      };

  tagOptions = vjs.getElementAttributes(tag);
  dataSetup = tagOptions['data-setup'];

  // Check if data-setup attr exists.
  if (dataSetup !== null){
    // Parse options JSON
    // If empty string, make it a parsable json object.
    vjs.obj.merge(tagOptions, vjs.JSON.parse(dataSetup || '{}'));
  }

  vjs.obj.merge(options, tagOptions);

  // Get tag children settings
  if (tag.hasChildNodes()) {
    var children, child, childName, i, j;

    children = tag.childNodes;

    for (i=0,j=children.length; i<j; i++) {
      child = children[i];
      // Change case needed: http://ejohn.org/blog/nodename-case-sensitivity/
      childName = child.nodeName.toLowerCase();
      if (childName === 'source') {
        options['sources'].push(vjs.getElementAttributes(child));
      } else if (childName === 'track') {
        options['tracks'].push(vjs.getElementAttributes(child));
      }
    }
  }

  return options;
};

vjs.Player.prototype.createEl = function(){
  var
    el = this.el_ = vjs.Component.prototype.createEl.call(this, 'div'),
    tag = this.tag,
    attrs;

  // Remove width/height attrs from tag so CSS can make it 100% width/height
  tag.removeAttribute('width');
  tag.removeAttribute('height');
  // Empty video tag tracks so the built-in player doesn't use them also.
  // This may not be fast enough to stop HTML5 browsers from reading the tags
  // so we'll need to turn off any default tracks if we're manually doing
  // captions and subtitles. videoElement.textTracks
  if (tag.hasChildNodes()) {
    var nodes, nodesLength, i, node, nodeName, removeNodes;

    nodes = tag.childNodes;
    nodesLength = nodes.length;
    removeNodes = [];

    while (nodesLength--) {
      node = nodes[nodesLength];
      nodeName = node.nodeName.toLowerCase();
      if (nodeName === 'track') {
        removeNodes.push(node);
      }
    }

    for (i=0; i<removeNodes.length; i++) {
      tag.removeChild(removeNodes[i]);
    }
  }

  // Copy over all the attributes from the tag, including ID and class
  // ID will now reference player box, not the video tag
  attrs = vjs.getElementAttributes(tag);
  vjs.obj.each(attrs, function(attr) {
    // workaround so we don't totally break IE7
    // http://stackoverflow.com/questions/3653444/css-styles-not-applied-on-dynamic-elements-in-internet-explorer-7
    if (attr == 'class') {
      el.className = attrs[attr];
    } else {
      el.setAttribute(attr, attrs[attr]);
    }
  });

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

  // vjs.insertFirst seems to cause the networkState to flicker from 3 to 2, so
  // keep track of the original for later so we can know if the source originally failed
  tag.initNetworkState_ = tag.networkState;

  // Wrap video tag in div (el/box) container
  if (tag.parentNode) {
    tag.parentNode.insertBefore(el, tag);
  }
  vjs.insertFirst(tag, el); // Breaks iPhone, fixed in HTML5 setup.

  // The event listeners need to be added before the children are added
  // in the component init because the tech (loaded with mediaLoader) may
  // fire events, like loadstart, that these events need to capture.
  // Long term it might be better to expose a way to do this in component.init
  // like component.initEventListeners() that runs between el creation and
  // adding children
  this.el_ = el;
  this.on('loadstart', this.onLoadStart);
  this.on('waiting', this.onWaiting);
  this.on(['canplay', 'canplaythrough', 'playing', 'ended'], this.onWaitEnd);
  this.on('seeking', this.onSeeking);
  this.on('seeked', this.onSeeked);
  this.on('ended', this.onEnded);
  this.on('play', this.onPlay);
  this.on('firstplay', this.onFirstPlay);
  this.on('pause', this.onPause);
  this.on('progress', this.onProgress);
  this.on('durationchange', this.onDurationChange);
  this.on('fullscreenchange', this.onFullscreenChange);

  return el;
};

// /* Media Technology (tech)
// ================================================================================ */
// Load/Create an instance of playback technology including element and API methods
// And append playback element in player div.
vjs.Player.prototype.loadTech = function(techName, source){

  // Pause and remove current playback technology
  if (this.tech) {
    this.unloadTech();
  }

  // get rid of the HTML5 video tag as soon as we are using another tech
  if (techName !== 'Html5' && this.tag) {
    vjs.Html5.disposeMediaElement(this.tag);
    this.tag = null;
  }

  this.techName = techName;

  // Turn off API access because we're loading a new tech that might load asynchronously
  this.isReady_ = false;

  var techReady = function(){
    this.player_.triggerReady();
  };

  // Grab tech-specific options from player options and add source and parent element to use.
  var techOptions = vjs.obj.merge({ 'source': source, 'parentEl': this.el_ }, this.options_[techName.toLowerCase()]);

  if (source) {
    this.currentType_ = source.type;
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

// /* Player event handlers (how the player reacts to certain events)
// ================================================================================ */

/**
 * Fired when the user agent begins looking for media data
 * @event loadstart
 */
vjs.Player.prototype.onLoadStart = function() {
  // TODO: Update to use `emptied` event instead. See #1277.

  // reset the error state
  this.error(null);

  // If it's already playing we want to trigger a firstplay event now.
  // The firstplay event relies on both the play and loadstart events
  // which can happen in any order for a new source
  if (!this.paused()) {
    this.trigger('firstplay');
  } else {
    // reset the hasStarted state
    this.hasStarted(false);
    this.one('play', function(){
      this.hasStarted(true);
    });
  }
};

vjs.Player.prototype.hasStarted_ = false;

vjs.Player.prototype.hasStarted = function(hasStarted){
  if (hasStarted !== undefined) {
    // only update if this is a new value
    if (this.hasStarted_ !== hasStarted) {
      this.hasStarted_ = hasStarted;
      if (hasStarted) {
        this.addClass('vjs-has-started');
        // trigger the firstplay event if this newly has played
        this.trigger('firstplay');
      } else {
        this.removeClass('vjs-has-started');
      }
    }
    return this;
  }
  return this.hasStarted_;
};

/**
 * Fired when the player has initial duration and dimension information
 * @event loadedmetadata
 */
vjs.Player.prototype.onLoadedMetaData;

/**
 * Fired when the player has downloaded data at the current playback position
 * @event loadeddata
 */
vjs.Player.prototype.onLoadedData;

/**
 * Fired when the player has finished downloading the source data
 * @event loadedalldata
 */
vjs.Player.prototype.onLoadedAllData;

/**
 * Fired whenever the media begins or resumes playback
 * @event play
 */
vjs.Player.prototype.onPlay = function(){
  this.removeClass('vjs-paused');
  this.addClass('vjs-playing');
};

/**
 * Fired whenever the media begins waiting
 * @event waiting
 */
vjs.Player.prototype.onWaiting = function(){
  this.addClass('vjs-waiting');
};

/**
 * A handler for events that signal that waiting has ended
 * which is not consistent between browsers. See #1351
 * @private
 */
vjs.Player.prototype.onWaitEnd = function(){
  this.removeClass('vjs-waiting');
};

/**
 * Fired whenever the player is jumping to a new time
 * @event seeking
 */
vjs.Player.prototype.onSeeking = function(){
  this.addClass('vjs-seeking');
};

/**
 * Fired when the player has finished jumping to a new time
 * @event seeked
 */
vjs.Player.prototype.onSeeked = function(){
  this.removeClass('vjs-seeking');
};

/**
 * Fired the first time a video is played
 *
 * Not part of the HLS spec, and we're not sure if this is the best
 * implementation yet, so use sparingly. If you don't have a reason to
 * prevent playback, use `myPlayer.one('play');` instead.
 *
 * @event firstplay
 */
vjs.Player.prototype.onFirstPlay = function(){
    //If the first starttime attribute is specified
    //then we will start at the given offset in seconds
    if(this.options_['starttime']){
      this.currentTime(this.options_['starttime']);
    }

    this.addClass('vjs-has-started');
};

/**
 * Fired whenever the media has been paused
 * @event pause
 */
vjs.Player.prototype.onPause = function(){
  this.removeClass('vjs-playing');
  this.addClass('vjs-paused');
};

/**
 * Fired when the current playback position has changed
 *
 * During playback this is fired every 15-250 milliseconds, depending on the
 * playback technology in use.
 * @event timeupdate
 */
vjs.Player.prototype.onTimeUpdate;

/**
 * Fired while the user agent is downloading media data
 * @event progress
 */
vjs.Player.prototype.onProgress = function(){
  // Add custom event for when source is finished downloading.
  if (this.bufferedPercent() == 1) {
    this.trigger('loadedalldata');
  }
};

/**
 * Fired when the end of the media resource is reached (currentTime == duration)
 * @event ended
 */
vjs.Player.prototype.onEnded = function(){
  if (this.options_['loop']) {
    this.currentTime(0);
    this.play();
  } else if (!this.paused()) {
    this.pause();
  }
};

/**
 * Fired when the duration of the media resource is first known or changed
 * @event durationchange
 */
vjs.Player.prototype.onDurationChange = function(){
  // Allows for caching value instead of asking player each time.
  // We need to get the techGet response and check for a value so we don't
  // accidentally cause the stack to blow up.
  var duration = this.techGet('duration');
  if (duration) {
    if (duration < 0) {
      duration = Infinity;
    }
    this.duration(duration);
    // Determine if the stream is live and propagate styles down to UI.
    if (duration === Infinity) {
      this.addClass('vjs-live');
    } else {
      this.removeClass('vjs-live');
    }
  }
};

/**
 * Fired when the volume changes
 * @event volumechange
 */
vjs.Player.prototype.onVolumeChange;

/**
 * Fired when the player switches in or out of fullscreen mode
 * @event fullscreenchange
 */
vjs.Player.prototype.onFullscreenChange = function() {
  if (this.isFullscreen()) {
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
  if (this.tech && !this.tech.isReady_) {
    this.tech.ready(function(){
      this[method](arg);
    });

  // Otherwise call method now
  } else {
    try {
      this.tech[method](arg);
    } catch(e) {
      vjs.log(e);
      throw e;
    }
  }
};

// Get calls can't wait for the tech, and sometimes don't need to.
vjs.Player.prototype.techGet = function(method){
  if (this.tech && this.tech.isReady_) {

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
        } else {
          vjs.log(e);
        }
      }
      throw e;
    }
  }

  return;
};

/**
 * start media playback
 *
 *     myPlayer.play();
 *
 * @return {vjs.Player} self
 */
vjs.Player.prototype.play = function(){
  this.techCall('play');
  return this;
};

/**
 * Pause the video playback
 *
 *     myPlayer.pause();
 *
 * @return {vjs.Player} self
 */
vjs.Player.prototype.pause = function(){
  this.techCall('pause');
  return this;
};

/**
 * Check if the player is paused
 *
 *     var isPaused = myPlayer.paused();
 *     var isPlaying = !myPlayer.paused();
 *
 * @return {Boolean} false if the media is currently playing, or true otherwise
 */
vjs.Player.prototype.paused = function(){
  // The initial state of paused should be true (in Safari it's actually false)
  return (this.techGet('paused') === false) ? false : true;
};

/**
 * Get or set the current time (in seconds)
 *
 *     // get
 *     var whereYouAt = myPlayer.currentTime();
 *
 *     // set
 *     myPlayer.currentTime(120); // 2 minutes into the video
 *
 * @param  {Number|String=} seconds The time to seek to
 * @return {Number}        The time in seconds, when not setting
 * @return {vjs.Player}    self, when the current time is set
 */
vjs.Player.prototype.currentTime = function(seconds){
  if (seconds !== undefined) {

    this.techCall('setCurrentTime', seconds);

    return this;
  }

  // cache last currentTime and return. default to 0 seconds
  //
  // Caching the currentTime is meant to prevent a massive amount of reads on the tech's
  // currentTime when scrubbing, but may not provide much performance benefit afterall.
  // Should be tested. Also something has to read the actual current time or the cache will
  // never get updated.
  return this.cache_.currentTime = (this.techGet('currentTime') || 0);
};

/**
 * Get the length in time of the video in seconds
 *
 *     var lengthOfVideo = myPlayer.duration();
 *
 * **NOTE**: The video must have started loading before the duration can be
 * known, and in the case of Flash, may not be known until the video starts
 * playing.
 *
 * @return {Number} The duration of the video in seconds
 */
vjs.Player.prototype.duration = function(seconds){
  if (seconds !== undefined) {

    // cache the last set value for optimized scrubbing (esp. Flash)
    this.cache_.duration = parseFloat(seconds);

    return this;
  }

  if (this.cache_.duration === undefined) {
    this.onDurationChange();
  }

  return this.cache_.duration || 0;
};

/**
 * Calculates how much time is left.
 *
 *     var timeLeft = myPlayer.remainingTime();
 *
 * Not a native video element function, but useful
 * @return {Number} The time remaining in seconds
 */
vjs.Player.prototype.remainingTime = function(){
  return this.duration() - this.currentTime();
};

// http://dev.w3.org/html5/spec/video.html#dom-media-buffered
// Buffered returns a timerange object.
// Kind of like an array of portions of the video that have been downloaded.

/**
 * Get a TimeRange object with the times of the video that have been downloaded
 *
 * If you just want the percent of the video that's been downloaded,
 * use bufferedPercent.
 *
 *     // Number of different ranges of time have been buffered. Usually 1.
 *     numberOfRanges = bufferedTimeRange.length,
 *
 *     // Time in seconds when the first range starts. Usually 0.
 *     firstRangeStart = bufferedTimeRange.start(0),
 *
 *     // Time in seconds when the first range ends
 *     firstRangeEnd = bufferedTimeRange.end(0),
 *
 *     // Length in seconds of the first time range
 *     firstRangeLength = firstRangeEnd - firstRangeStart;
 *
 * @return {Object} A mock TimeRange object (following HTML spec)
 */
vjs.Player.prototype.buffered = function(){
  var buffered = this.techGet('buffered');

  if (!buffered || !buffered.length) {
    buffered = vjs.createTimeRange(0,0);
  }

  return buffered;
};

/**
 * Get the percent (as a decimal) of the video that's been downloaded
 *
 *     var howMuchIsDownloaded = myPlayer.bufferedPercent();
 *
 * 0 means none, 1 means all.
 * (This method isn't in the HTML5 spec, but it's very convenient)
 *
 * @return {Number} A decimal between 0 and 1 representing the percent
 */
vjs.Player.prototype.bufferedPercent = function(){
  var duration = this.duration(),
      buffered = this.buffered(),
      bufferedDuration = 0,
      start, end;

  if (!duration) {
    return 0;
  }

  for (var i=0; i<buffered.length; i++){
    start = buffered.start(i);
    end   = buffered.end(i);

    // buffered end can be bigger than duration by a very small fraction
    if (end > duration) {
      end = duration;
    }

    bufferedDuration += end - start;
  }

  return bufferedDuration / duration;
};

/**
 * Get the ending time of the last buffered time range
 *
 * This is used in the progress bar to encapsulate all time ranges.
 * @return {Number} The end of the last buffered time range
 */
vjs.Player.prototype.bufferedEnd = function(){
  var buffered = this.buffered(),
      duration = this.duration(),
      end = buffered.end(buffered.length-1);

  if (end > duration) {
    end = duration;
  }

  return end;
};

/**
 * Get or set the current volume of the media
 *
 *     // get
 *     var howLoudIsIt = myPlayer.volume();
 *
 *     // set
 *     myPlayer.volume(0.5); // Set volume to half
 *
 * 0 is off (muted), 1.0 is all the way up, 0.5 is half way.
 *
 * @param  {Number} percentAsDecimal The new volume as a decimal percent
 * @return {Number}                  The current volume, when getting
 * @return {vjs.Player}              self, when setting
 */
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


/**
 * Get the current muted state, or turn mute on or off
 *
 *     // get
 *     var isVolumeMuted = myPlayer.muted();
 *
 *     // set
 *     myPlayer.muted(true); // mute the volume
 *
 * @param  {Boolean=} muted True to mute, false to unmute
 * @return {Boolean} True if mute is on, false if not, when getting
 * @return {vjs.Player} self, when setting mute
 */
vjs.Player.prototype.muted = function(muted){
  if (muted !== undefined) {
    this.techCall('setMuted', muted);
    return this;
  }
  return this.techGet('muted') || false; // Default to false
};

// Check if current tech can support native fullscreen
// (e.g. with built in controls like iOS, so not our flash swf)
vjs.Player.prototype.supportsFullScreen = function(){
  return this.techGet('supportsFullScreen') || false;
};

/**
 * is the player in fullscreen
 * @type {Boolean}
 * @private
 */
vjs.Player.prototype.isFullscreen_ = false;

/**
 * Check if the player is in fullscreen mode
 *
 *     // get
 *     var fullscreenOrNot = myPlayer.isFullscreen();
 *
 *     // set
 *     myPlayer.isFullscreen(true); // tell the player it's in fullscreen
 *
 * NOTE: As of the latest HTML5 spec, isFullscreen is no longer an official
 * property and instead document.fullscreenElement is used. But isFullscreen is
 * still a valuable property for internal player workings.
 *
 * @param  {Boolean=} isFS Update the player's fullscreen state
 * @return {Boolean} true if fullscreen, false if not
 * @return {vjs.Player} self, when setting
 */
vjs.Player.prototype.isFullscreen = function(isFS){
  if (isFS !== undefined) {
    this.isFullscreen_ = !!isFS;
    return this;
  }
  return this.isFullscreen_;
};

/**
 * Old naming for isFullscreen()
 * @deprecated for lowercase 's' version
 */
vjs.Player.prototype.isFullScreen = function(isFS){
  vjs.log.warn('player.isFullScreen() has been deprecated, use player.isFullscreen() with a lowercase "s")');
  return this.isFullscreen(isFS);
};

/**
 * Increase the size of the video to full screen
 *
 *     myPlayer.requestFullscreen();
 *
 * In some browsers, full screen is not supported natively, so it enters
 * "full window mode", where the video fills the browser window.
 * In browsers and devices that support native full screen, sometimes the
 * browser's default controls will be shown, and not the Video.js custom skin.
 * This includes most mobile devices (iOS, Android) and older versions of
 * Safari.
 *
 * @return {vjs.Player} self
 */
vjs.Player.prototype.requestFullscreen = function(){
  var fsApi = vjs.browser.fullscreenAPI;

  this.isFullscreen(true);

  if (fsApi) {
    // the browser supports going fullscreen at the element level so we can
    // take the controls fullscreen as well as the video

    // Trigger fullscreenchange event after change
    // We have to specifically add this each time, and remove
    // when canceling fullscreen. Otherwise if there's multiple
    // players on a page, they would all be reacting to the same fullscreen
    // events
    vjs.on(document, fsApi['fullscreenchange'], vjs.bind(this, function(e){
      this.isFullscreen(document[fsApi.fullscreenElement]);

      // If cancelling fullscreen, remove event listener.
      if (this.isFullscreen() === false) {
        vjs.off(document, fsApi['fullscreenchange'], arguments.callee);
      }

      this.trigger('fullscreenchange');
    }));

    this.el_[fsApi.requestFullscreen]();

  } else if (this.tech.supportsFullScreen()) {
    // we can't take the video.js controls fullscreen but we can go fullscreen
    // with native controls
    this.techCall('enterFullScreen');
  } else {
    // fullscreen isn't supported so we'll just stretch the video element to
    // fill the viewport
    this.enterFullWindow();
    this.trigger('fullscreenchange');
  }

  return this;
};

/**
 * Old naming for requestFullscreen
 * @deprecated for lower case 's' version
 */
vjs.Player.prototype.requestFullScreen = function(){
  vjs.log.warn('player.requestFullScreen() has been deprecated, use player.requestFullscreen() with a lowercase "s")');
  return this.requestFullscreen();
};


/**
 * Return the video to its normal size after having been in full screen mode
 *
 *     myPlayer.exitFullscreen();
 *
 * @return {vjs.Player} self
 */
vjs.Player.prototype.exitFullscreen = function(){
  var fsApi = vjs.browser.fullscreenAPI;
  this.isFullscreen(false);

  // Check for browser element fullscreen support
  if (fsApi) {
    document[fsApi.exitFullscreen]();
  } else if (this.tech.supportsFullScreen()) {
   this.techCall('exitFullScreen');
  } else {
   this.exitFullWindow();
   this.trigger('fullscreenchange');
  }

  return this;
};

/**
 * Old naming for exitFullscreen
 * @deprecated for exitFullscreen
 */
vjs.Player.prototype.cancelFullScreen = function(){
  vjs.log.warn('player.cancelFullScreen() has been deprecated, use player.exitFullscreen()');
  return this.exitFullscreen();
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

  this.trigger('enterFullWindow');
};
vjs.Player.prototype.fullWindowOnEscKey = function(event){
  if (event.keyCode === 27) {
    if (this.isFullscreen() === true) {
      this.exitFullscreen();
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

  // Resize the box, controller, and poster to original sizes
  // this.positionAll();
  this.trigger('exitFullWindow');
};

vjs.Player.prototype.selectSource = function(sources){
  // Loop through each playback technology in the options order
  for (var i=0,j=this.options_['techOrder'];i<j.length;i++) {
    var techName = vjs.capitalize(j[i]),
        tech = window['videojs'][techName];

    // Check if the current tech is defined before continuing
    if (!tech) {
      vjs.log.error('The "' + techName + '" tech is undefined. Skipped browser support check for that tech.');
      continue;
    }

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

/**
 * The source function updates the video source
 *
 * There are three types of variables you can pass as the argument.
 *
 * **URL String**: A URL to the the video file. Use this method if you are sure
 * the current playback technology (HTML5/Flash) can support the source you
 * provide. Currently only MP4 files can be used in both HTML5 and Flash.
 *
 *     myPlayer.src("http://www.example.com/path/to/video.mp4");
 *
 * **Source Object (or element):** A javascript object containing information
 * about the source file. Use this method if you want the player to determine if
 * it can support the file using the type information.
 *
 *     myPlayer.src({ type: "video/mp4", src: "http://www.example.com/path/to/video.mp4" });
 *
 * **Array of Source Objects:** To provide multiple versions of the source so
 * that it can be played using HTML5 across browsers you can use an array of
 * source objects. Video.js will detect which version is supported and load that
 * file.
 *
 *     myPlayer.src([
 *       { type: "video/mp4", src: "http://www.example.com/path/to/video.mp4" },
 *       { type: "video/webm", src: "http://www.example.com/path/to/video.webm" },
 *       { type: "video/ogg", src: "http://www.example.com/path/to/video.ogv" }
 *     ]);
 *
 * @param  {String|Object|Array=} source The source URL, object, or array of sources
 * @return {String} The current video source when getting
 * @return {String} The player when setting
 */
vjs.Player.prototype.src = function(source){
  if (source === undefined) {
    return this.techGet('src');
  }

  // case: Array of source objects to choose from and pick the best to play
  if (vjs.obj.isArray(source)) {
    this.sourceList_(source);

  // case: URL String (http://myvideo...)
  } else if (typeof source === 'string') {
    // create a source object from the string
    this.src({ src: source });

  // case: Source object { src: '', type: '' ... }
  } else if (source instanceof Object) {
    // check if the source has a type and the loaded tech cannot play the source
    // if there's no type we'll just try the current tech
    if (source.type && !window['videojs'][this.techName]['canPlaySource'](source)) {
      // create a source list with the current source and send through
      // the tech loop to check for a compatible technology
      this.sourceList_([source]);
    } else {
      this.cache_.src = source.src;
      this.currentType_ = source.type || '';

      // wait until the tech is ready to set the source
      this.ready(function(){

        // The setSource tech method was added with source handlers
        // so older techs won't support it
        // We need to check the direct prototype for the case where subclasses
        // of the tech do not support source handlers
        if (window['videojs'][this.techName].prototype.hasOwnProperty('setSource')) {
          this.techCall('setSource', source);
        } else {
          this.techCall('src', source.src);
        }

        if (this.options_['preload'] == 'auto') {
          this.load();
        }

        if (this.options_['autoplay']) {
          this.play();
        }
      });
    }
  }

  return this;
};

/**
 * Handle an array of source objects
 * @param  {[type]} sources Array of source objects
 * @private
 */
vjs.Player.prototype.sourceList_ = function(sources){
  var sourceTech = this.selectSource(sources);

  if (sourceTech) {
    if (sourceTech.tech === this.techName) {
      // if this technology is already loaded, set the source
      this.src(sourceTech.source);
    } else {
      // load this technology with the chosen source
      this.loadTech(sourceTech.tech, sourceTech.source);
    }
  } else {
    // We need to wrap this in a timeout to give folks a chance to add error event handlers
    this.setTimeout( function() {
      this.error({ code: 4, message: this.localize(this.options()['notSupportedMessage']) });
    }, 0);

    // we could not find an appropriate tech, but let's still notify the delegate that this is it
    // this needs a better comment about why this is needed
    this.triggerReady();
  }
};

/**
 * Begin loading the src data.
 * @return {vjs.Player} Returns the player
 */
vjs.Player.prototype.load = function(){
  this.techCall('load');
  return this;
};

/**
 * Returns the fully qualified URL of the current source value e.g. http://mysite.com/video.mp4
 * Can be used in conjuction with `currentType` to assist in rebuilding the current source object.
 * @return {String} The current source
 */
vjs.Player.prototype.currentSrc = function(){
  return this.techGet('currentSrc') || this.cache_.src || '';
};

/**
 * Get the current source type e.g. video/mp4
 * This can allow you rebuild the current source object so that you could load the same
 * source and tech later
 * @return {String} The source MIME type
 */
vjs.Player.prototype.currentType = function(){
    return this.currentType_ || '';
};

/**
 * Get or set the preload attribute.
 * @return {String} The preload attribute value when getting
 * @return {vjs.Player} Returns the player when setting
 */
vjs.Player.prototype.preload = function(value){
  if (value !== undefined) {
    this.techCall('setPreload', value);
    this.options_['preload'] = value;
    return this;
  }
  return this.techGet('preload');
};

/**
 * Get or set the autoplay attribute.
 * @return {String} The autoplay attribute value when getting
 * @return {vjs.Player} Returns the player when setting
 */
vjs.Player.prototype.autoplay = function(value){
  if (value !== undefined) {
    this.techCall('setAutoplay', value);
    this.options_['autoplay'] = value;
    return this;
  }
  return this.techGet('autoplay', value);
};

/**
 * Get or set the loop attribute on the video element.
 * @return {String} The loop attribute value when getting
 * @return {vjs.Player} Returns the player when setting
 */
vjs.Player.prototype.loop = function(value){
  if (value !== undefined) {
    this.techCall('setLoop', value);
    this.options_['loop'] = value;
    return this;
  }
  return this.techGet('loop');
};

/**
 * the url of the poster image source
 * @type {String}
 * @private
 */
vjs.Player.prototype.poster_;

/**
 * get or set the poster image source url
 *
 * ##### EXAMPLE:
 *
 *     // getting
 *     var currentPoster = myPlayer.poster();
 *
 *     // setting
 *     myPlayer.poster('http://example.com/myImage.jpg');
 *
 * @param  {String=} [src] Poster image source URL
 * @return {String} poster URL when getting
 * @return {vjs.Player} self when setting
 */
vjs.Player.prototype.poster = function(src){
  if (src === undefined) {
    return this.poster_;
  }

  // The correct way to remove a poster is to set as an empty string
  // other falsey values will throw errors
  if (!src) {
    src = '';
  }

  // update the internal poster variable
  this.poster_ = src;

  // update the tech's poster
  this.techCall('setPoster', src);

  // alert components that the poster has been set
  this.trigger('posterchange');

  return this;
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
vjs.Player.prototype.controls = function(bool){
  if (bool !== undefined) {
    bool = !!bool; // force boolean
    // Don't trigger a change event unless it actually changed
    if (this.controls_ !== bool) {
      this.controls_ = bool;
      if (bool) {
        this.removeClass('vjs-controls-disabled');
        this.addClass('vjs-controls-enabled');
        this.trigger('controlsenabled');
      } else {
        this.removeClass('vjs-controls-enabled');
        this.addClass('vjs-controls-disabled');
        this.trigger('controlsdisabled');
      }
    }
    return this;
  }
  return this.controls_;
};

vjs.Player.prototype.usingNativeControls_;

/**
 * Toggle native controls on/off. Native controls are the controls built into
 * devices (e.g. default iPhone controls), Flash, or other techs
 * (e.g. Vimeo Controls)
 *
 * **This should only be set by the current tech, because only the tech knows
 * if it can support native controls**
 *
 * @param  {Boolean} bool    True signals that native controls are on
 * @return {vjs.Player}      Returns the player
 * @private
 */
vjs.Player.prototype.usingNativeControls = function(bool){
  if (bool !== undefined) {
    bool = !!bool; // force boolean
    // Don't trigger a change event unless it actually changed
    if (this.usingNativeControls_ !== bool) {
      this.usingNativeControls_ = bool;
      if (bool) {
        this.addClass('vjs-using-native-controls');

        /**
         * player is using the native device controls
         *
         * @event usingnativecontrols
         * @memberof vjs.Player
         * @instance
         * @private
         */
        this.trigger('usingnativecontrols');
      } else {
        this.removeClass('vjs-using-native-controls');

        /**
         * player is using the custom HTML controls
         *
         * @event usingcustomcontrols
         * @memberof vjs.Player
         * @instance
         * @private
         */
        this.trigger('usingcustomcontrols');
      }
    }
    return this;
  }
  return this.usingNativeControls_;
};

/**
 * Store the current media error
 * @type {Object}
 * @private
 */
vjs.Player.prototype.error_ = null;

/**
 * Set or get the current MediaError
 * @param  {*} err A MediaError or a String/Number to be turned into a MediaError
 * @return {vjs.MediaError|null}     when getting
 * @return {vjs.Player}              when setting
 */
vjs.Player.prototype.error = function(err){
  if (err === undefined) {
    return this.error_;
  }

  // restoring to default
  if (err === null) {
    this.error_ = err;
    this.removeClass('vjs-error');
    return this;
  }

  // error instance
  if (err instanceof vjs.MediaError) {
    this.error_ = err;
  } else {
    this.error_ = new vjs.MediaError(err);
  }

  // fire an error event on the player
  this.trigger('error');

  // add the vjs-error classname to the player
  this.addClass('vjs-error');

  // log the name of the error type and any message
  // ie8 just logs "[object object]" if you just log the error object
  vjs.log.error('(CODE:'+this.error_.code+' '+vjs.MediaError.errorTypes[this.error_.code]+')', this.error_.message, this.error_);

  return this;
};

/**
 * Returns whether or not the player is in the "ended" state.
 * @return {Boolean} True if the player is in the ended state, false if not.
 */
vjs.Player.prototype.ended = function(){ return this.techGet('ended'); };

/**
 * Returns whether or not the player is in the "seeking" state.
 * @return {Boolean} True if the player is in the seeking state, false if not.
 */
vjs.Player.prototype.seeking = function(){ return this.techGet('seeking'); };

// When the player is first initialized, trigger activity so components
// like the control bar show themselves if needed
vjs.Player.prototype.userActivity_ = true;
vjs.Player.prototype.reportUserActivity = function(event){
  this.userActivity_ = true;
};

vjs.Player.prototype.userActive_ = true;
vjs.Player.prototype.userActive = function(bool){
  if (bool !== undefined) {
    bool = !!bool;
    if (bool !== this.userActive_) {
      this.userActive_ = bool;
      if (bool) {
        // If the user was inactive and is now active we want to reset the
        // inactivity timer
        this.userActivity_ = true;
        this.removeClass('vjs-user-inactive');
        this.addClass('vjs-user-active');
        this.trigger('useractive');
      } else {
        // We're switching the state to inactive manually, so erase any other
        // activity
        this.userActivity_ = false;

        // Chrome/Safari/IE have bugs where when you change the cursor it can
        // trigger a mousemove event. This causes an issue when you're hiding
        // the cursor when the user is inactive, and a mousemove signals user
        // activity. Making it impossible to go into inactive mode. Specifically
        // this happens in fullscreen when we really need to hide the cursor.
        //
        // When this gets resolved in ALL browsers it can be removed
        // https://code.google.com/p/chromium/issues/detail?id=103041
        if(this.tech) {
          this.tech.one('mousemove', function(e){
            e.stopPropagation();
            e.preventDefault();
          });
        }

        this.removeClass('vjs-user-active');
        this.addClass('vjs-user-inactive');
        this.trigger('userinactive');
      }
    }
    return this;
  }
  return this.userActive_;
};

vjs.Player.prototype.listenForUserActivity = function(){
  var onActivity, onMouseMove, onMouseDown, mouseInProgress, onMouseUp,
      activityCheck, inactivityTimeout, lastMoveX, lastMoveY;

  onActivity = vjs.bind(this, this.reportUserActivity);

  onMouseMove = function(e) {
    // #1068 - Prevent mousemove spamming
    // Chrome Bug: https://code.google.com/p/chromium/issues/detail?id=366970
    if(e.screenX != lastMoveX || e.screenY != lastMoveY) {
      lastMoveX = e.screenX;
      lastMoveY = e.screenY;
      onActivity();
    }
  };

  onMouseDown = function() {
    onActivity();
    // For as long as the they are touching the device or have their mouse down,
    // we consider them active even if they're not moving their finger or mouse.
    // So we want to continue to update that they are active
    this.clearInterval(mouseInProgress);
    // Setting userActivity=true now and setting the interval to the same time
    // as the activityCheck interval (250) should ensure we never miss the
    // next activityCheck
    mouseInProgress = this.setInterval(onActivity, 250);
  };

  onMouseUp = function(event) {
    onActivity();
    // Stop the interval that maintains activity if the mouse/touch is down
    this.clearInterval(mouseInProgress);
  };

  // Any mouse movement will be considered user activity
  this.on('mousedown', onMouseDown);
  this.on('mousemove', onMouseMove);
  this.on('mouseup', onMouseUp);

  // Listen for keyboard navigation
  // Shouldn't need to use inProgress interval because of key repeat
  this.on('keydown', onActivity);
  this.on('keyup', onActivity);

  // Run an interval every 250 milliseconds instead of stuffing everything into
  // the mousemove/touchmove function itself, to prevent performance degradation.
  // `this.reportUserActivity` simply sets this.userActivity_ to true, which
  // then gets picked up by this loop
  // http://ejohn.org/blog/learning-from-twitter/
  activityCheck = this.setInterval(function() {
    // Check to see if mouse/touch activity has happened
    if (this.userActivity_) {
      // Reset the activity tracker
      this.userActivity_ = false;

      // If the user state was inactive, set the state to active
      this.userActive(true);

      // Clear any existing inactivity timeout to start the timer over
      this.clearTimeout(inactivityTimeout);

      var timeout = this.options()['inactivityTimeout'];
      if (timeout > 0) {
          // In <timeout> milliseconds, if no more activity has occurred the
          // user will be considered inactive
          inactivityTimeout = this.setTimeout(function () {
              // Protect against the case where the inactivityTimeout can trigger just
              // before the next user activity is picked up by the activityCheck loop
              // causing a flicker
              if (!this.userActivity_) {
                  this.userActive(false);
              }
          }, timeout);
      }
    }
  }, 250);
};

/**
 * Gets or sets the current playback rate.
 * @param  {Boolean} rate   New playback rate to set.
 * @return {Number}         Returns the new playback rate when setting
 * @return {Number}         Returns the current playback rate when getting
 */
vjs.Player.prototype.playbackRate = function(rate) {
  if (rate !== undefined) {
    this.techCall('setPlaybackRate', rate);
    return this;
  }

  if (this.tech && this.tech['featuresPlaybackRate']) {
    return this.techGet('playbackRate');
  } else {
    return 1.0;
  }

};

/**
 * Store the current audio state
 * @type {Boolean}
 * @private
 */
vjs.Player.prototype.isAudio_ = false;

/**
 * Gets or sets the audio flag
 *
 * @param  {Boolean} bool    True signals that this is an audio player.
 * @return {Boolean}         Returns true if player is audio, false if not when getting
 * @return {vjs.Player}      Returns the player if setting
 * @private
 */
vjs.Player.prototype.isAudio = function(bool) {
  if (bool !== undefined) {
    this.isAudio_ = !!bool;
    return this;
  }

  return this.isAudio_;
};

// Methods to add support for
// networkState: function(){ return this.techCall('networkState'); },
// readyState: function(){ return this.techCall('readyState'); },
// initialTime: function(){ return this.techCall('initialTime'); },
// startOffsetTime: function(){ return this.techCall('startOffsetTime'); },
// played: function(){ return this.techCall('played'); },
// seekable: function(){ return this.techCall('seekable'); },
// videoTracks: function(){ return this.techCall('videoTracks'); },
// audioTracks: function(){ return this.techCall('audioTracks'); },
// videoWidth: function(){ return this.techCall('videoWidth'); },
// videoHeight: function(){ return this.techCall('videoHeight'); },
// defaultPlaybackRate: function(){ return this.techCall('defaultPlaybackRate'); },
// mediaGroup: function(){ return this.techCall('mediaGroup'); },
// controller: function(){ return this.techCall('controller'); },
// defaultMuted: function(){ return this.techCall('defaultMuted'); }

// TODO
// currentSrcList: the array of sources including other formats and bitrates
// playList: array of source lists in order of playback
