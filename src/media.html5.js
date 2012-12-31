goog.provide('_V_.Html5');
goog.provide('_V_.media.html5');

goog.require('_V_.MediaTechController');

/* HTML5 Media Controller - Wrapper for HTML5 Media API
================================================================================ */
/**
 * HTML5 Media Controller - Wrapper for HTML5 Media API
 * @param {_V_.Player|Object} player
 * @param {Object=} options
 * @param {Function=} ready
 * @constructor
 */
_V_.Html5 = function(player, options, ready){
  goog.base(this, player, options, ready);

  var source = options.source;

  // If the element source is already set, we may have missed the loadstart event, and want to trigger it.
  // We don't want to set the source again and interrupt playback.
  if (source && this.el_.currentSrc == source.src) {
    player.trigger("loadstart");

  // Otherwise set the source if one was provided.
  } else if (source) {
    this.el_.src = source.src;
  }

  // Chrome and Safari both have issues with autoplay.
  // In Safari (5.1.1), when we move the video element into the container div, autoplay doesn't work.
  // In Chrome (15), if you have autoplay + a poster + no controls, the video gets hidden (but audio plays)
  // This fixes both issues. Need to wait for API, so it updates displays correctly
  player.ready(function(){
    if (this.options.autoplay && this.paused()) {
      this.tag.poster = null; // Chrome Fix. Fixed in Chrome v16.
      this.play();
    }
  });

  this.on("click", this.onClick);

  this.setupTriggers();

  this.triggerReady();
};
goog.inherits(_V_.Html5, _V_.MediaTechController);

_V_.Html5.prototype.dispose = function(){
  // this.player.tag = false;
  this.removeTriggers();

  goog.base(this, 'dispose');
};

_V_.Html5.prototype.createEl = function(){
  var player = this.player,
      // If possible, reuse original tag for HTML5 playback technology element
      el = player.tag,
      newEl;

  // Check if this browser supports moving the element into the box.
  // On the iPhone video will break if you move the element,
  // So we have to create a brand new element.
  if (!el || _V_.media.html5.support.movingElementInDOM === false) {

    // If the original tag is still there, remove it.
    if (el) {
      player.getEl().removeChild(el);
    }

    newEl = _V_.createElement("video", {
      id: el.id || player.id + "_html5_api",
      className: el.className || "vjs-tech"
    });

    el = newEl;
    _V_.insertFirst(el, player.el);
  }

  // Update specific tag settings, in case they were overridden
  var attrs = ["autoplay","preload","loop","muted"];
  for (var i = attrs.length - 1; i >= 0; i--) {
    var attr = attrs[i];
    if (player.options[attr] !== null) {
      el[attr] = player.options[attr];
    }
  };

  return el;
  // jenniisawesome = true;
};

// Make video events trigger player events
// May seem verbose here, but makes other APIs possible.
_V_.Html5.prototype.setupTriggers = function(){
  for (var i = _V_.media.html5.events.length - 1; i >= 0; i--) {
    _V_.on(this.el_, _V_.media.html5.events[i], _V_.bind(this.player, this.eventHandler));
  };
};
_V_.Html5.prototype.removeTriggers = function(){
  for (var i = _V_.media.html5.events.length - 1; i >= 0; i--) {
    _V_.off(this.el_, _V_.media.html5.events[i], _V_.bind(this.player, this.eventHandler));
  };
  // console.log("removeTriggers", _V_.getData(this.el_));
};
_V_.Html5.prototype.eventHandler = function(e){
  // console.log('eventHandler', e.type, e, this.el_)
  this.trigger(e);
  e.stopPropagation();
};


_V_.Html5.prototype.play = function(){ this.el_.play(); };
_V_.Html5.prototype.pause = function(){ this.el_.pause(); };
_V_.Html5.prototype.paused = function(){ return this.el_.paused; };

_V_.Html5.prototype.currentTime = function(){ return this.el_.currentTime; };
_V_.Html5.prototype.setCurrentTime = function(seconds){
  try {
    this.el_.currentTime = seconds;
  } catch(e) {
    _V_.log(e, "Video isn't ready. (Video.js)");
    // this.warning(VideoJS.warnings.videoNotReady);
  }
};

_V_.Html5.prototype.duration = function(){ return this.el_.duration || 0; };
_V_.Html5.prototype.buffered = function(){ return this.el_.buffered; };

_V_.Html5.prototype.volume = function(){ return this.el_.volume; };
_V_.Html5.prototype.setVolume = function(percentAsDecimal){ this.el_.volume = percentAsDecimal; };
_V_.Html5.prototype.muted = function(){ return this.el_.muted; };
_V_.Html5.prototype.setMuted = function(muted){ this.el_.muted = muted; };

_V_.Html5.prototype.width = function(){ return this.el_.offsetWidth; };
_V_.Html5.prototype.height = function(){ return this.el_.offsetHeight; };

_V_.Html5.prototype.supportsFullScreen = function(){
  if (typeof this.el_.webkitEnterFullScreen == 'function') {

    // Seems to be broken in Chromium/Chrome && Safari in Leopard
    if (!navigator.userAgent.match("Chrome") && !navigator.userAgent.match("Mac OS X 10.5")) {
      return true;
    }
  }
  return false;
};

_V_.Html5.prototype.enterFullScreen = function(){
  try {
    this.el_.webkitEnterFullScreen();
  } catch (e) {
    if (e.code == 11) {
      // this.warning(VideoJS.warnings.videoNotReady);
      _V_.log("Video.js: Video not ready.");
    }
  }
};
_V_.Html5.prototype.exitFullScreen = function(){
    try {
      this.el_.webkitExitFullScreen();
    } catch (e) {
      if (e.code == 11) {
        // this.warning(VideoJS.warnings.videoNotReady);
        _V_.log("Video.js: Video not ready.");
      }
    }
};
_V_.Html5.prototype.src = function(src){ this.el_.src = src; };
_V_.Html5.prototype.load = function(){ this.el_.load(); };
_V_.Html5.prototype.currentSrc = function(){ return this.el_.currentSrc; };

_V_.Html5.prototype.preload = function(){ return this.el_.preload; };
_V_.Html5.prototype.setPreload = function(val){ this.el_.preload = val; };
_V_.Html5.prototype.autoplay = function(){ return this.el_.autoplay; };
_V_.Html5.prototype.setAutoplay = function(val){ this.el_.autoplay = val; };
_V_.Html5.prototype.loop = function(){ return this.el_.loop; };
_V_.Html5.prototype.setLoop = function(val){ this.el_.loop = val; };

_V_.Html5.prototype.error = function(){ return this.el_.error; };
  // networkState: function(){ return this.el_.networkState; },
  // readyState: function(){ return this.el_.readyState; },
_V_.Html5.prototype.seeking = function(){ return this.el_.seeking; };
  // initialTime: function(){ return this.el_.initialTime; },
  // startOffsetTime: function(){ return this.el_.startOffsetTime; },
  // played: function(){ return this.el_.played; },
  // seekable: function(){ return this.el_.seekable; },
_V_.Html5.prototype.ended = function(){ return this.el_.ended; };
  // videoTracks: function(){ return this.el_.videoTracks; },
  // audioTracks: function(){ return this.el_.audioTracks; },
  // videoWidth: function(){ return this.el_.videoWidth; },
  // videoHeight: function(){ return this.el_.videoHeight; },
  // textTracks: function(){ return this.el_.textTracks; },
  // defaultPlaybackRate: function(){ return this.el_.defaultPlaybackRate; },
  // playbackRate: function(){ return this.el_.playbackRate; },
  // mediaGroup: function(){ return this.el_.mediaGroup; },
  // controller: function(){ return this.el_.controller; },
_V_.Html5.prototype.controls = function(){ return this.player.options.controls; };
_V_.Html5.prototype.defaultMuted = function(){ return this.el_.defaultMuted; };

/* HTML5 Support Testing -------------------------------------------------------- */

_V_.media.html5.isSupported = function(){
  return !!document.createElement("video").canPlayType;
};

_V_.media.html5.canPlaySource = function(srcObj){
  return !!document.createElement("video").canPlayType(srcObj.type);
  // TODO: Check Type
  // If no Type, check ext
  // Check Media Type
};

// List of all HTML5 events (various uses).
_V_.media.html5.events = "loadstart,suspend,abort,error,emptied,stalled,loadedmetadata,loadeddata,canplay,canplaythrough,playing,waiting,seeking,seeked,ended,durationchange,timeupdate,progress,play,pause,ratechange,volumechange".split(",");


// HTML5 Device Fixes ---------------------------------------------------------- //

_V_.media.html5.support = {

  // Support for video element specific full screen. (webkitEnterFullScreen, not requestFullscreen which we use on the player div)
  // http://developer.apple.com/library/safari/#documentation/AudioVideo/Reference/HTMLVideoElementClassReference/HTMLVideoElement/HTMLVideoElement.html
  // Seems to be broken in Chromium/Chrome && Safari in Leopard
  fullscreen: (_V_.TEST_VID.webkitEnterFullScreen) ? (!_V_.UA.match("Chrome") && !_V_.UA.match("Mac OS X 10.5") ? true : false) : false,

  // In iOS, if you move a video element in the DOM, it breaks video playback.
  movingElementInDOM: !_V_.IS_IOS

};

// Android
if (_V_.IS_ANDROID) {

  // Override Android 2.2 and less canPlayType method which is broken
  if (_V_.ANDROID_VERSION < 3) {
    document.createElement("video").constructor.prototype.canPlayType = function(type){
      return (type && type.toLowerCase().indexOf("video/mp4") != -1) ? "maybe" : "";
    };
  }
}

