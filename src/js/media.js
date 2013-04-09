/**
 * @fileoverview Media Technology Controller - Base class for media playback technology controllers like Flash and HTML5
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

    // Make playback element clickable
    // this.addEvent('click', this.proxy(this.onClick));

    // player.triggerEvent('techready');
  }
});

// destroy: function(){},
// createElement: function(){},

/**
 * Handle a click on the media element. By default will play the media.
 */
vjs.MediaTechController.prototype.onClick = function(){
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
