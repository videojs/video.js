// Setup an API for the HTML5 playback technology
VideoJS.tech.html5 = {
  supported: function(){
    return !!document.createElement("video").canPlayType;
  },
  canPlaySource: function(srcObj){
    return this.tag.canPlayType(srcObj.type); // Switch to global check
    // Check Type
    // If no Type, check ext
    // Check Media Type
  },
  init: function(sourceObj){
    var tag = this.tag, // Reuse original tag for HTML5 playback technology element
        html5 = _V_.tech.html5,
        options = this.options;

    // Check if this browser supports moving the element into the box.
    // On the iPhone video will break if you move the element,
    // So we have to create a brand new element.
    if (html5.supports.movingElementInDOM === false) {
      var newTag = _V_.createElement("video", {
        id: tag.id,
        className: tag.className
      });

      this.box.removeChild(this.tag);
      tag = this.tag = newTag;
      this.box.appendChild(tag);
    }

    // Store reference to playback element
    this.tels.html5 = tag;

    // Update tag settings, in case they were overridden
    _V_.each(["autoplay","preload","loop","muted","poster"], function(attr){
      tag[attr] = options[attr];
    }, this);

    if (tag.currentSrc != sourceObj.src) {
      tag.src = sourceObj.src;
    } else {
      this.triggerEvent("loadstart");
    }

    // Moving video inside box breaks autoplay on Safari. This forces it to play.
    // Currently triggering play in other browsers as well.
    this.addEvent("techready", function(){
      if (this.options.autoplay && this.paused()) {
        this.play();
      }
      this.removeEvent("techready", arguments.callee);
    });

    this.triggerEvent("techready");
  },
  supports: {
    /* Will hold support info as it's discovered */
  },
  api: {
    setupTriggers: function(){
      // Make video events trigger player events
      // May seem verbose here, but makes other APIs possible.

      // ["play", "playing", "pause", "ended", "volumechange", "error", "progress", "seeking", "timeupdate"]
      var types = _V_.html5Events,
          i;
      for (i = 0;i<types.length; i++) {
        _V_.addEvent(this.tels.html5, types[i], _V_.proxy(this, function(e){
          e.stopPropagation();
          this.triggerEvent(e);
        }));
      }
    },
    removeTriggers: function(){},

    play: function(){ this.tels.html5.play(); },
    pause: function(){ this.tels.html5.pause(); },
    paused: function(){ return this.tels.html5.paused; },

    currentTime: function(){ return this.tels.html5.currentTime; },
    setCurrentTime: function(seconds){
      try { this.tels.html5.currentTime = seconds; }
      catch(e) {
        _V_.log(e);
        // this.warning(VideoJS.warnings.videoNotReady); 
      }
    },

    duration: function(){ return this.tels.html5.duration || 0; },
    buffered: function(){ return this.tels.html5.buffered; },

    volume: function(){ return this.tels.html5.volume; },
    setVolume: function(percentAsDecimal){ this.tels.html5.volume = percentAsDecimal; },
    muted: function(){ return this.tels.html5.muted; },
    setMuted: function(muted){ this.tels.html5.muted = muted },

    width: function(){ return this.tels.html5.offsetWidth; },
    height: function(){ return this.tels.html5.offsetHeight; },

    supportsFullScreen: function(){
      if(typeof this.tels.html5.webkitEnterFullScreen == 'function') {
        // Seems to be broken in Chromium/Chrome && Safari in Leopard
        if (!navigator.userAgent.match("Chrome") && !navigator.userAgent.match("Mac OS X 10.5")) {
          return true;
        }
      }
      return false;
    },
    enterFullScreen: function(){
      try {
        this.tels.html5.webkitEnterFullScreen();
      } catch (e) {
        if (e.code == 11) { 
          // this.warning(VideoJS.warnings.videoNotReady);
          _V_.log("VideoJS: Video not ready.")
        }
      }
    },
    src: function(src){ this.tels.html5.src = src; },
    load: function(){ this.tels.html5.load(); },
    currentSrc: function(){ return this.tels.html5.currentSrc; },

    preload: function(){ return this.tels.html5.preload; },
    setPreload: function(val){ this.tels.html5.preload = val; },
    autoplay: function(){ return this.tels.html5.autoplay; },
    setAutoplay: function(val){ this.tels.html5.autoplay = val; },
    loop: function(){ return this.tels.html5.loop; },
    setLoop: function(val){ this.tels.html5.loop = val; },

    error: function(){ return this.tels.html5.error; },
    networkState: function(){ return this.tels.html5.networkState; },
    readyState: function(){ return this.tels.html5.readyState; },
    seeking: function(){ return this.tels.html5.seeking; },
    initialTime: function(){ return this.tels.html5.initialTime; },
    startOffsetTime: function(){ return this.tels.html5.startOffsetTime; },
    played: function(){ return this.tels.html5.played; },
    seekable: function(){ return this.tels.html5.seekable; },
    ended: function(){ return this.tels.html5.ended; },
    videoTracks: function(){ return this.tels.html5.videoTracks; },
    audioTracks: function(){ return this.tels.html5.audioTracks; },
    videoWidth: function(){ return this.tels.html5.videoWidth; },
    videoHeight: function(){ return this.tels.html5.videoHeight; },
    textTracks: function(){ return this.tels.html5.textTracks; },
    defaultPlaybackRate: function(){ return this.tels.html5.defaultPlaybackRate; },
    playbackRate: function(){ return this.tels.html5.playbackRate; },
    mediaGroup: function(){ return this.tels.html5.mediaGroup; },
    controller: function(){ return this.tels.html5.controller; },
    controls: function(){ return this.tels.html5.controls; },
    defaultMuted: function(){ return this.tels.html5.defaultMuted; }
  }
};

/* Device Fixes
================================================================================ */
// iOS
if (_V_.isIOS()) {
  // If you move a video element in the DOM, it breaks video playback.
  _V_.tech.html5.supports.movingElementInDOM = false;
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
