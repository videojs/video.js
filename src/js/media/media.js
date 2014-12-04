/**
 * @fileoverview Media Technology Controller - Base class for media playback
 * technology controllers like Flash and HTML5
 */

/**
 * Base class for media (HTML5 Video, Flash) controllers
 * @param {vjs.Player|Object} player  Central player instance
 * @param {Object=} options Options object
 * @constructor
 */
vjs.MediaTechController = vjs.Component.extend({
  /** @constructor */
  init: function(player, options, ready){
    options = options || {};
    // we don't want the tech to report user activity automatically.
    // This is done manually in addControlsListeners
    options.reportTouchActivity = false;
    vjs.Component.call(this, player, options, ready);

    // Manually track progress in cases where the browser/flash player doesn't report it.
    if (!this['featuresProgressEvents']) {
      this.manualProgressOn();
    }

    // Manually track timeupdates in cases where the browser/flash player doesn't report it.
    if (!this['featuresTimeupdateEvents']) {
      this.manualTimeUpdatesOn();
    }

    this.initControlsListeners();
  }
});

/**
 * Set up click and touch listeners for the playback element
 * On desktops, a click on the video itself will toggle playback,
 * on a mobile device a click on the video toggles controls.
 * (toggling controls is done by toggling the user state between active and
 * inactive)
 *
 * A tap can signal that a user has become active, or has become inactive
 * e.g. a quick tap on an iPhone movie should reveal the controls. Another
 * quick tap should hide them again (signaling the user is in an inactive
 * viewing state)
 *
 * In addition to this, we still want the user to be considered inactive after
 * a few seconds of inactivity.
 *
 * Note: the only part of iOS interaction we can't mimic with this setup
 * is a touch and hold on the video element counting as activity in order to
 * keep the controls showing, but that shouldn't be an issue. A touch and hold on
 * any controls will still keep the user active
 */
vjs.MediaTechController.prototype.initControlsListeners = function(){
  var player, activateControls;

  player = this.player();

  activateControls = function(){
    if (player.controls() && !player.usingNativeControls()) {
      this.addControlsListeners();
    }
  };

  // Set up event listeners once the tech is ready and has an element to apply
  // listeners to
  this.ready(activateControls);
  this.on(player, 'controlsenabled', activateControls);
  this.on(player, 'controlsdisabled', this.removeControlsListeners);

  // if we're loading the playback object after it has started loading or playing the
  // video (often with autoplay on) then the loadstart event has already fired and we
  // need to fire it manually because many things rely on it.
  // Long term we might consider how we would do this for other events like 'canplay'
  // that may also have fired.
  this.ready(function(){
    if (this.networkState && this.networkState() > 0) {
      this.player().trigger('loadstart');
    }
  });
};

vjs.MediaTechController.prototype.addControlsListeners = function(){
  var userWasActive;

  // Some browsers (Chrome & IE) don't trigger a click on a flash swf, but do
  // trigger mousedown/up.
  // http://stackoverflow.com/questions/1444562/javascript-onclick-event-over-flash-object
  // Any touch events are set to block the mousedown event from happening
  this.on('mousedown', this.onClick);

  // If the controls were hidden we don't want that to change without a tap event
  // so we'll check if the controls were already showing before reporting user
  // activity
  this.on('touchstart', function(event) {
    userWasActive = this.player_.userActive();
  });

  this.on('touchmove', function(event) {
    if (userWasActive){
      this.player().reportUserActivity();
    }
  });

  this.on('touchend', function(event) {
    // Stop the mouse events from also happening
    event.preventDefault();
  });

  // Turn on component tap events
  this.emitTapEvents();

  // The tap listener needs to come after the touchend listener because the tap
  // listener cancels out any reportedUserActivity when setting userActive(false)
  this.on('tap', this.onTap);
};

/**
 * Remove the listeners used for click and tap controls. This is needed for
 * toggling to controls disabled, where a tap/touch should do nothing.
 */
vjs.MediaTechController.prototype.removeControlsListeners = function(){
  // We don't want to just use `this.off()` because there might be other needed
  // listeners added by techs that extend this.
  this.off('tap');
  this.off('touchstart');
  this.off('touchmove');
  this.off('touchleave');
  this.off('touchcancel');
  this.off('touchend');
  this.off('click');
  this.off('mousedown');
};

/**
 * Handle a click on the media element. By default will play/pause the media.
 */
vjs.MediaTechController.prototype.onClick = function(event){
  // We're using mousedown to detect clicks thanks to Flash, but mousedown
  // will also be triggered with right-clicks, so we need to prevent that
  if (event.button !== 0) return;

  // When controls are disabled a click should not toggle playback because
  // the click is considered a control
  if (this.player().controls()) {
    if (this.player().paused()) {
      this.player().play();
    } else {
      this.player().pause();
    }
  }
};

/**
 * Handle a tap on the media element. By default it will toggle the user
 * activity state, which hides and shows the controls.
 */
vjs.MediaTechController.prototype.onTap = function(){
  this.player().userActive(!this.player().userActive());
};

/* Fallbacks for unsupported event types
================================================================================ */
// Manually trigger progress events based on changes to the buffered amount
// Many flash players and older HTML5 browsers don't send progress or progress-like events
vjs.MediaTechController.prototype.manualProgressOn = function(){
  this.manualProgress = true;

  // Trigger progress watching when a source begins loading
  this.trackProgress();
};

vjs.MediaTechController.prototype.manualProgressOff = function(){
  this.manualProgress = false;
  this.stopTrackingProgress();
};

vjs.MediaTechController.prototype.trackProgress = function(){
  this.progressInterval = this.setInterval(function(){
    // Don't trigger unless buffered amount is greater than last time

    var bufferedPercent = this.player().bufferedPercent();

    if (this.bufferedPercent_ != bufferedPercent) {
      this.player().trigger('progress');
    }

    this.bufferedPercent_ = bufferedPercent;

    if (bufferedPercent === 1) {
      this.stopTrackingProgress();
    }
  }, 500);
};
vjs.MediaTechController.prototype.stopTrackingProgress = function(){ this.clearInterval(this.progressInterval); };

/*! Time Tracking -------------------------------------------------------------- */
vjs.MediaTechController.prototype.manualTimeUpdatesOn = function(){
  var player = this.player_;

  this.manualTimeUpdates = true;

  this.on(player, 'play', this.trackCurrentTime);
  this.on(player, 'pause', this.stopTrackingCurrentTime);
  // timeupdate is also called by .currentTime whenever current time is set

  // Watch for native timeupdate event
  this.one('timeupdate', function(){
    // Update known progress support for this playback technology
    this['featuresTimeupdateEvents'] = true;
    // Turn off manual progress tracking
    this.manualTimeUpdatesOff();
  });
};

vjs.MediaTechController.prototype.manualTimeUpdatesOff = function(){
  this.manualTimeUpdates = false;
  this.stopTrackingCurrentTime();
  this.off('play', this.trackCurrentTime);
  this.off('pause', this.stopTrackingCurrentTime);
};

vjs.MediaTechController.prototype.trackCurrentTime = function(){
  if (this.currentTimeInterval) { this.stopTrackingCurrentTime(); }
  this.currentTimeInterval = this.setInterval(function(){
    this.player().trigger('timeupdate');
  }, 250); // 42 = 24 fps // 250 is what Webkit uses // FF uses 15
};

// Turn off play progress tracking (when paused or dragging)
vjs.MediaTechController.prototype.stopTrackingCurrentTime = function(){
  this.clearInterval(this.currentTimeInterval);

  // #1002 - if the video ends right before the next timeupdate would happen,
  // the progress bar won't make it all the way to the end
  this.player().trigger('timeupdate');
};

vjs.MediaTechController.prototype.dispose = function() {
  // Turn off any manual progress or timeupdate tracking
  if (this.manualProgress) { this.manualProgressOff(); }

  if (this.manualTimeUpdates) { this.manualTimeUpdatesOff(); }

  vjs.Component.prototype.dispose.call(this);
};

vjs.MediaTechController.prototype.setCurrentTime = function() {
  // improve the accuracy of manual timeupdates
  if (this.manualTimeUpdates) { this.player().trigger('timeupdate'); }
};

/**
 * Provide a default setPoster method for techs
 *
 * Poster support for techs should be optional, so we don't want techs to
 * break if they don't have a way to set a poster.
 */
vjs.MediaTechController.prototype.setPoster = function(){};

vjs.MediaTechController.prototype['featuresVolumeControl'] = true;

// Resizing plugins using request fullscreen reloads the plugin
vjs.MediaTechController.prototype['featuresFullscreenResize'] = false;
vjs.MediaTechController.prototype['featuresPlaybackRate'] = false;

// Optional events that we can manually mimic with timers
// currently not triggered by video-js-swf
vjs.MediaTechController.prototype['featuresProgressEvents'] = false;
vjs.MediaTechController.prototype['featuresTimeupdateEvents'] = false;

/**
 * A functional mixin for techs that want to use the Source Handler pattern.
 *
 * ##### EXAMPLE:
 *
 *   videojs.MediaTechController.withSourceHandlers.call(MyTech);
 *
 */
vjs.MediaTechController.withSourceHandlers = function(Tech){
  /**
   * Register a source handler
   * Source handlers are scripts for handling specific formats.
   * The source handler pattern is used for adaptive formats (HLS, DASH) that
   * manually load video data and feed it into a Source Buffer (Media Source Extensions)
   * @param  {Function} handler  The source handler
   * @param  {Boolean}  first    Register it before any existing handlers
   */
  Tech.registerSourceHandler = function(handler, index){
    var handlers = Tech.sourceHandlers;

    if (!handlers) {
      handlers = Tech.sourceHandlers = [];
    }

    if (index === undefined) {
      // add to the end of the list
      index = handlers.length;
    }

    handlers.splice(index, 0, handler);
  };

  /**
   * Return the first source handler that supports the source
   * TODO: Answer question: should 'probably' be prioritized over 'maybe'
   * @param  {Object} source The source object
   * @returns {Object}       The first source handler that supports the source
   * @returns {null}         Null if no source handler is found
   */
  Tech.selectSourceHandler = function(source){
    var handlers = Tech.sourceHandlers || [],
        can;

    for (var i = 0; i < handlers.length; i++) {
      can = handlers[i].canHandleSource(source);

      if (can) {
        return handlers[i];
      }
    }

    return null;
  };

  /**
  * Check if the tech can support the given source
  * @param  {Object} srcObj  The source object
  * @return {String}         'probably', 'maybe', or '' (empty string)
  */
  Tech.canPlaySource = function(srcObj){
    var sh = Tech.selectSourceHandler(srcObj);

    if (sh) {
      return sh.canHandleSource(srcObj);
    }

    return '';
  };

  /**
   * Create a function for setting the source using a source object
   * and source handlers.
   * Should never be called unless a source handler was found.
   * @param {Object} source  A source object with src and type keys
   * @return {vjs.MediaTechController} self
   */
  Tech.prototype.setSource = function(source){
    var sh = Tech.selectSourceHandler(source);

    // Dispose any existing source handler
    this.disposeSourceHandler();
    this.off('dispose', this.disposeSourceHandler);

    this.currentSource_ = source;
    this.sourceHandler_ = sh.handleSource(source, this);
    this.on('dispose', this.disposeSourceHandler);

    return this;
  };

  /**
   * Clean up any existing source handler
   */
  Tech.prototype.disposeSourceHandler = function(){
    if (this.sourceHandler_ && this.sourceHandler_.dispose) {
      this.sourceHandler_.dispose();
    }
  };

};
