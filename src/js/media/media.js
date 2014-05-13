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
  var player, tech, activateControls, deactivateControls;

  tech = this;
  player = this.player();

  var activateControls = function(){
    if (player.controls() && !player.usingNativeControls()) {
      tech.addControlsListeners();
    }
  };

  deactivateControls = vjs.bind(tech, tech.removeControlsListeners);

  // Set up event listeners once the tech is ready and has an element to apply
  // listeners to
  this.ready(activateControls);
  player.on('controlsenabled', activateControls);
  player.on('controlsdisabled', deactivateControls);
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
    // Stop the mouse events from also happening
    event.preventDefault();
    userWasActive = this.player_.userActive();
  });

  this.on('touchmove', function(event) {
    if (userWasActive){
      this.player().reportUserActivity();
    }
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

/**
 * Provide a default setPoster method for techs
 *
 * Poster support for techs should be optional, so we don't want techs to
 * break if they don't have a way to set a poster.
 */
vjs.MediaTechController.prototype.setPoster = function(){};

vjs.MediaTechController.prototype.features = {
  'volumeControl': true,

  // Resizing plugins using request fullscreen reloads the plugin
  'fullscreenResize': false,
  'playbackRate': false,

  // Optional events that we can manually mimic with timers
  // currently not triggered by video-js-swf
  'progressEvents': false,
  'timeupdateEvents': false
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
