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
    vjs.Component.call(this, player, options, ready);

    var controlsListener = function(){
      if (this.player().controls() && !this.player().useNativeControls()) {
        this.initListeners();
      }
    };

    // Set up event listeners once the tech is ready and has an element to apply
    // listeners to
    this.ready(controlsListener);
    this.player().on('controlsenabled', vjs.bind(this, controlsListener));
    this.player().on('controlsdisabled', vjs.bind(this, this.removeListeners));
  }
});

/**
 * Determine whether or not controls should be enabled on the video element
 * Use native controls for iOS and Android by default until controls are more
 * stable on those devices
 *
 * @return {Boolean} Controls enabled
 * @private
 */
vjs.MediaTechController.prototype.usingNativeControls = function(){
  var controls = false;
  if (vjs.TOUCH_ENABLED
      && this.nativeControlsAvailable !== false
      && this.player().options()['nativeControlsForTouch'] !== false) {
    controls = this.player().controls();
  }
  return controls;
};

/**
 * Set up click and touch listeners for the playback element
 * On desktops, a click on the video itself will toggle playback,
 * on a mobile device a click on the video toggles controls.
 * (toggling controls is done by toggling the user state between active and
 * passive)
 *
 * A tap can signal that a user has become active, or has become passive
 * e.g. a quick tap on an iPhone movie should reveal the controls. Another
 * quick tap should hide them again (signaling the user is in a passive
 * viewing state)
 *
 * In addition to this, we still want the user to be considered passive after
 * a few seconds of inactivity.
 *
 * Note: the only part of iOS interaction we can't mimic with this setup
 * is a touch and hold on the video element counting as activity in order to
 * keep the controls showing, but that shouldn't be an issue. A touch and hold on
 * any controls will still keep the user active
 */
vjs.MediaTechController.prototype.initListeners = function(){
  var preventBubble, userWasActive;

  if ('ontouchstart' in window) {
    // We need to block touch events on the video element from bubbling up,
    // otherwise they'll signal activity prematurely. The specific use case is
    // when the video is playing and the controls have faded out. In this case
    // only a tap (fast touch) should toggle the user active state and turn the
    // controls back on. A touch and move or touch and hold should not trigger
    // the controls (per iOS as an example at least)
    //
    // We always want to stop propagation on touchstart because touchstart
    // at the player level starts the touchInProgress interval. We can still
    // report activity on the other events, but won't let them bubble for
    // consistency. We don't want to bubble a touchend without a touchstart.
    this.on('touchstart', function(event) {
      // Stop the mouse events from also happening
      event.preventDefault();
      event.stopPropagation();
      // Record if the user was active now so we don't have to keep polling it
      userWasActive = this.player_.userActive();
    });

    preventBubble = function(event){
      event.stopPropagation();
      if (userWasActive) {
        this.player_.reportUserActivity();
      }
    };

    // Treat all touch events the same for consistency
    this.on('touchmove', preventBubble);
    this.on('touchleave', preventBubble);
    this.on('touchcancel', preventBubble);
    this.on('touchend', preventBubble);

    // Turn on component tap events
    this.emitTapEvents();

    // The tap listener needs to come after the touchend listener because the tap
    // listener cancels out any reportedUserActivity when setting userActive(false)
    this.on('tap', function(){
      if (this.player_.userActive()) {
        this.player_.userActive(false);
      } else {
        this.player_.userActive(true);
      }
    });
  } else {
    this.on('click', this.onClick);
  }
};

vjs.MediaTechController.prototype.removeListeners = function(){
  console.log('removeListeners');
  this.off('tap');
  this.off('touchstart');
  this.off('touchmove');
  this.off('touchleave');
  this.off('touchcancel');
  this.off('touchend');
  this.off('click');
};

/**
 * Handle a click on the media element. By default will play the media.
 */
vjs.MediaTechController.prototype.onClick = function(){
  console.log('onClick');
  // When controls are disabled a click should not toggle playback because
  // the click is considered a control
  if (this.player_.controls()) {
    if (this.player_.paused()) {
      this.player_.play();
    } else {
      this.player_.pause();
    }
  }
};

vjs.MediaTechController.prototype.features = {
  volumeControl: true,

  // Resizing plugins using request fullscreen reloads the plugin
  fullscreenResize: false,

  // Optional events that we can manually mimic with timers
  // currently not triggered by video-js-swf
  progressEvents: false,
  timeupdateEvents: false
};

vjs.media = {};

/**
 * List of default API methods for any MediaTechController
 * @type {String}
 */
vjs.media.ApiMethods = 'play,pause,paused,currentTime,setCurrentTime,duration,buffered,volume,setVolume,muted,setMuted,width,height,supportsFullScreen,enterFullScreen,src,load,currentSrc,preload,setPreload,autoplay,setAutoplay,loop,setLoop,error,networkState,readyState,seeking,initialTime,startOffsetTime,played,seekable,ended,videoTracks,audioTracks,videoWidth,videoHeight,textTracks,defaultPlaybackRate,playbackRate,mediaGroup,controller,controls,defaultMuted'.split(',');
// Create placeholder methods for each that warn when a method isn't supported by the current playback technology

function createMethod(methodName){
  return function(){
    throw new Error('The "'+methodName+'" method is not available on the playback technology\'s API');
  };
}

for (var i = vjs.media.ApiMethods.length - 1; i >= 0; i--) {
  var methodName = vjs.media.ApiMethods[i];
  vjs.MediaTechController.prototype[vjs.media.ApiMethods[i]] = createMethod(methodName);
}
