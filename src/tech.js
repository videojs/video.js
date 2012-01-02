/* Playback Technology - Base class for playback technologies
================================================================================ */
_V_.PlaybackTech = _V_.Component.extend({
  init: function(player, options){
    // this._super(player, options);

    // Make playback element clickable
    // _V_.addEvent(this.el, "click", _V_.proxy(this, _V_.PlayToggle.prototype.onClick));

    // player.triggerEvent("techready");
  }
  // destroy: function(){},
  // createElement: function(){},
});

// Create placeholder methods for each that warn when a method isn't supported by the current playback technology
_V_.apiMethods = "play,pause,paused,currentTime,setCurrentTime,duration,buffered,volume,setVolume,muted,setMuted,width,height,supportsFullScreen,enterFullScreen,src,load,currentSrc,preload,setPreload,autoplay,setAutoplay,loop,setLoop,error,networkState,readyState,seeking,initialTime,startOffsetTime,played,seekable,ended,videoTracks,audioTracks,videoWidth,videoHeight,textTracks,defaultPlaybackRate,playbackRate,mediaGroup,controller,controls,defaultMuted".split(",");
_V_.each(_V_.apiMethods, function(methodName){
  _V_.PlaybackTech.prototype[methodName] = function(){
    throw new Error("The '"+method+"' method is not available on the playback technology's API");
  }
});

/* HTML5 Playback Technology - Wrapper for HTML5 Media API
================================================================================ */
_V_.html5 = _V_.PlaybackTech.extend({

  init: function(player, options, ready){
    this.player = player;
    this.el = this.createElement();
    this.ready(ready);

    var source = options.source;

    // If the element source is already set, we may have missed the loadstart event, and want to trigger it.
    // We don't want to set the source again and interrupt playback.
    if (source && this.el.currentSrc == source.src) {
      player.triggerEvent("loadstart");

    // Otherwise set the source if one was provided.
    } else if (source) {
      this.el.src = source.src;
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

    this.setupTriggers();

    this.triggerReady();
  },
  
  destroy: function(){
    this.player.tag = false;
    this.el.parentNode.removeChild(this.el);
  },

  createElement: function(){
    var html5 = _V_.html5,
        player = this.player,

        // If possible, reuse original tag for HTML5 playback technology element
        el = player.tag,
        newEl;

    // Check if this browser supports moving the element into the box.
    // On the iPhone video will break if you move the element,
    // So we have to create a brand new element.
    if (!el || html5.supports.movingElementInDOM === false) {

      // If the original tag is still there, remove it.
      if (el) { 
        player.el.removeChild(el);
      }

      newEl = _V_.createElement("video", {
        id: el.id || player.el.id + "_html5_api",
        className: el.className || "vjs-tech"
      });

      el = newEl;
      _V_.insertFirst(el, player.el);
    }

    // Update tag settings, in case they were overridden
    _V_.each(["autoplay","preload","loop","muted","poster"], function(attr){
      el[attr] = player.options[attr];
    }, this);

    return el;
  },

  setupTriggers: function(){
    // Make video events trigger player events
    // May seem verbose here, but makes other APIs possible.

    // ["play", "playing", "pause", "ended", "volumechange", "error", "progress", "seeking", "timeupdate"]
    var types = _V_.html5.events,
        i;
    for (i = 0;i<types.length; i++) {
      _V_.addEvent(this.el, types[i], _V_.proxy(this.player, function(e){
        e.stopPropagation();
        this.triggerEvent(e);
      }));
    }
  },
  removeTriggers: function(){},

  play: function(){ this.el.play(); },
  pause: function(){ this.el.pause(); },
  paused: function(){ return this.el.paused; },

  currentTime: function(){ return this.el.currentTime; },
  setCurrentTime: function(seconds){
    try {
      this.el.currentTime = seconds;
      } catch(e) {
        _V_.log(e, "Video isn't ready. (VideoJS)");
      // this.warning(VideoJS.warnings.videoNotReady);
    }
  },

  duration: function(){ return this.el.duration || 0; },
  buffered: function(){ return this.el.buffered; },

  volume: function(){ return this.el.volume; },
  setVolume: function(percentAsDecimal){ this.el.volume = percentAsDecimal; },
  muted: function(){ return this.el.muted; },
  setMuted: function(muted){ this.el.muted = muted },

  width: function(){ return this.el.offsetWidth; },
  height: function(){ return this.el.offsetHeight; },

  supportsFullScreen: function(){
    if (typeof this.el.webkitEnterFullScreen == 'function') {

      // Seems to be broken in Chromium/Chrome && Safari in Leopard
      if (!navigator.userAgent.match("Chrome") && !navigator.userAgent.match("Mac OS X 10.5")) {
        return true;
      }
    }
      return false;
  },
  enterFullScreen: function(){
      try {
        this.el.webkitEnterFullScreen();
      } catch (e) {
        if (e.code == 11) {
          // this.warning(VideoJS.warnings.videoNotReady);
          _V_.log("VideoJS: Video not ready.")
        }
      }
  },
  src: function(src){ this.el.src = src; },
  load: function(){ this.el.load(); },
  currentSrc: function(){ return this.el.currentSrc; },

  preload: function(){ return this.el.preload; },
  setPreload: function(val){ this.el.preload = val; },
  autoplay: function(){ return this.el.autoplay; },
  setAutoplay: function(val){ this.el.autoplay = val; },
  loop: function(){ return this.el.loop; },
  setLoop: function(val){ this.el.loop = val; },

  error: function(){ return this.el.error; },
  networkState: function(){ return this.el.networkState; },
  readyState: function(){ return this.el.readyState; },
  seeking: function(){ return this.el.seeking; },
  initialTime: function(){ return this.el.initialTime; },
  startOffsetTime: function(){ return this.el.startOffsetTime; },
  played: function(){ return this.el.played; },
  seekable: function(){ return this.el.seekable; },
  ended: function(){ return this.el.ended; },
  videoTracks: function(){ return this.el.videoTracks; },
  audioTracks: function(){ return this.el.audioTracks; },
  videoWidth: function(){ return this.el.videoWidth; },
  videoHeight: function(){ return this.el.videoHeight; },
  textTracks: function(){ return this.el.textTracks; },
  defaultPlaybackRate: function(){ return this.el.defaultPlaybackRate; },
  playbackRate: function(){ return this.el.playbackRate; },
  mediaGroup: function(){ return this.el.mediaGroup; },
  controller: function(){ return this.el.controller; },
  controls: function(){ return this.player.options.controls; },
  defaultMuted: function(){ return this.el.defaultMuted; }
});

/* HTML5 Support Testing -------------------------------------------------------- */

_V_.html5.isSupported = function(){
  return !!document.createElement("video").canPlayType;
};

_V_.html5.canPlaySource = function(srcObj){
  return !!document.createElement("video").canPlayType(srcObj.type);
  // TODO: Check Type
  // If no Type, check ext
  // Check Media Type
};

_V_.html5.supports = {};

// List of all HTML5 events (various uses).
_V_.html5.events = "loadstart,suspend,abort,error,emptied,stalled,loadedmetadata,loadeddata,canplay,canplaythrough,playing,waiting,seeking,seeked,ended,durationchange,timeupdate,progress,play,pause,ratechange,volumechange".split(",");

/* HTML5 Device Fixes ---------------------------------------------------------- */

// iOS
if (_V_.isIOS()) {
  // If you move a video element in the DOM, it breaks video playback.
  _V_.html5.supports.movingElementInDOM = false;
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


/* VideoJS-SWF - Custom Flash Player with HTML5-ish API
================================================================================ */
_V_.flash = _V_.PlaybackTech.extend({

  init: function(player, options){
    this.player = player;

    var source = options.source,
        parentEl = options.parentEl,
        placeHolder = this.el = _V_.createElement("div", { id: parentEl.id + "_temp_flash" }),
        objId = player.el.id+"_flash_api",
        playerOptions = player.options;

        flashVars = _V_.merge({

          // SWF Callback Functions
          readyFunction: "_V_.flash.onSWFReady",
          eventProxyFunction: "_V_.flash.onSWFEvent",
          errorEventProxyFunction: "_V_.flash.onSWFErrorEvent",

          // Player Settings
          autoplay: playerOptions.autoplay,
          preload: playerOptions.preload,
          loop: playerOptions.loop,
          muted: playerOptions.muted

        }, options.flashVars),

        params = _V_.merge({
          allowScriptAccess: "always",
          wmode: "opaque",
          bgcolor: "#000000"
        }, options.params),

        attributes = _V_.merge({
          id: objId,
          name: objId,
          'class': 'vjs-tech'
        }, options.attributes);

    if (playerOptions.poster) {
      flashVars.poster = playerOptions.poster;
    }

    // If source was supplied pass as a flash var.
    if (source) {
      flashVars.src = source.src;
    }

    // Add to box.
    _V_.insertFirst(placeHolder, parentEl);

    swfobject.embedSWF(options.swf, placeHolder.id, "480", "270", "9.0.124", "", flashVars, params, attributes);
  },
  
  destroy: function(){
    this.el.parentNode.removeChild(this.el);
  },

  // setupTriggers: function(){}, // Using global onSWFEvent func to distribute events

  play: function(){ this.el.vjs_play(); },
  pause: function(){ this.el.vjs_pause(); },
  src: function(src){
    this.el.vjs_src(src);

    // Currently the SWF doesn't autoplay if you load a source later.
    // e.g. Load player w/ no source, wait 2s, set src.
    if (this.player.autoplay) {
      var tech = this;
      setTimeout(function(){ tech.play(); }, 0);
    }
  },
  load: function(){ this.el.vjs_load(); },
  poster: function(){ this.el.vjs_getProperty("poster"); },

  buffered: function(){
    return _V_.createTimeRange(0, this.el.vjs_getProperty("buffered"));
  },

  supportsFullScreen: function(){
    return false; // Flash does not allow fullscreen through javascript
  },
  enterFullScreen: function(){
    return false;
  }
});

// Create setters and getters for attributes
(function(){
  var api = _V_.flash.prototype,
      readWrite = "preload,currentTime,defaultPlaybackRate,playbackRate,autoplay,loop,mediaGroup,controller,controls,volume,muted,defaultMuted".split(","),
      readOnly = "error,currentSrc,networkState,readyState,seeking,initialTime,duration,startOffsetTime,paused,played,seekable,ended,videoTracks,audioTracks,videoWidth,videoHeight,textTracks".split(","),
      callOnly = "load,play,pause".split(",");
      // Overridden: buffered

      createSetter = function(attr){
        var attrUpper = attr.charAt(0).toUpperCase() + attr.slice(1);
        api["set"+attrUpper] = function(val){ return this.el.vjs_setProperty(attr, val); };
      },

      createGetter = function(attr){
        api[attr] = function(){ return this.el.vjs_getProperty(attr); };
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

/* Flash Support Testing -------------------------------------------------------- */

_V_.flash.isSupported = function(){
  return swfobject.hasFlashPlayerVersion("9");
};

_V_.flash.canPlaySource = function(srcObj){
  if (srcObj.type in _V_.flash.supports.format) { return "maybe"; }
};

_V_.flash.supports = {
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
};

_V_.flash.onSWFReady = function(currSwf){

  _V_.log(currSwf, "currSwf")

  var el = _V_.el(currSwf);

  // Get player from box
  // On firefox reloads, el might already have a player
  var player = el.player || el.parentNode.player,
      tech = player.tech;

  // Reference player on tech element
  el.player = player;

  // Update reference to playback technology element
  tech.el = el;

  _V_.flash.checkReady(tech);
};

// The SWF isn't alwasy ready when it says it is. Sometimes the API functions still need to be added to the object.
// If it's not ready, we set a timeout to check again shortly.
_V_.flash.checkReady = function(tech){
  if (tech.el.vjs_getProperty) {
    tech.triggerReady();
  } else {
    setTimeout(function(){
      _V_.flash.checkReady(tech);
    }, 50);
  }
};

_V_.flash.onSWFEvent = function(swfID, eventName, other){
  try {
    var player = _V_.el(swfID).player;
    if (player) {
      player.triggerEvent(eventName);
    }
  } catch(err) {
    _V_.log(err);
  }
};

_V_.flash.onSWFErrorEvent = function(swfID, eventName){
  _V_.log("Flash Error", eventName);
};
