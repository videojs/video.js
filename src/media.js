goog.provide('_V_.media');
goog.provide('_V_.MediaTechController');

goog.require('_V_.Component');

/* Media Technology Controller - Base class for media playback technologies
================================================================================ */

/**
 * Base class for media (HTML5 Video, Flash) controllers
 * @param {_V_.Player|Object} player  Central player instance
 * @param {Object=} options Options object
 * @constructor
 */
_V_.MediaTechController = function(player, options, ready){
  goog.base(this, player, options, ready);

  // Make playback element clickable
  // this.addEvent("click", this.proxy(this.onClick));

  // player.triggerEvent("techready");
};
goog.inherits(_V_.MediaTechController, _V_.Component);

// destroy: function(){},
// createElement: function(){},

/**
 * Handle a click on the media element. By default will play the media.
 */
_V_.MediaTechController.prototype.onClick = function(){
  if (this.player.options.controls) {
    if (this.player.paused()) {
      this.player.play();
    } else {
      this.player.pause();
    }
  }
};

/**
 * List of default API methods for any MediaTechController
 * @type {String}
 */
_V_.apiMethods = "play,pause,paused,currentTime,setCurrentTime,duration,buffered,volume,setVolume,muted,setMuted,width,height,supportsFullScreen,enterFullScreen,src,load,currentSrc,preload,setPreload,autoplay,setAutoplay,loop,setLoop,error,networkState,readyState,seeking,initialTime,startOffsetTime,played,seekable,ended,videoTracks,audioTracks,videoWidth,videoHeight,textTracks,defaultPlaybackRate,playbackRate,mediaGroup,controller,controls,defaultMuted".split(",");

// Create placeholder methods for each that warn when a method isn't supported by the current playback technology
for (var i = _V_.apiMethods.length - 1; i >= 0; i--) {
  var methodName = _V_.apiMethods[i];

  _V_.MediaTechController.prototype[_V_.apiMethods[i]] = (function(methodName){
    return function(){
      throw new Error("The '"+methodName+"' method is not available on the playback technology's API");
    }
  })(methodName);
};
