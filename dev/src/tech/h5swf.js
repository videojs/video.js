VideoJS.tech.h5swf = {
  // swf: "flash/VideoJS.swf",
  swf: "https://s3.amazonaws.com/video-js/3.0b/video-js.swf",
  // swf: "http://video-js.zencoder.com/3.0b/video-js.swf",
  supported: function(){
    return swfobject.hasFlashPlayerVersion("9");
  },
  canPlaySource: function(sourceObj){
    if (sourceObj.type in _V_.tech.h5swf.supports.format) { return "maybe"; }
  },
  supports: {
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
  },

  // Init the swf object
  init: function(sourceObj){
    var player = this,
        placeHolder = _V_.createElement("div", { id: player.box.id + "_temp_h5swf" }),
        objId = player.box.id+"_h5swf_api",
        h5swf = VideoJS.tech.h5swf,

        flashvars = {
          readyFunction: "_V_.tech.h5swf.onSWFReady",
          eventProxyFunction: "_V_.tech.h5swf.onSWFEvent",
          errorEventProxyFunction: "_V_.tech.h5swf.onSWFErrorEvent",
          src: sourceObj.src,
          autoplay: this.options.autoplay,
          preload: this.options.preload,
          loop: this.options.loop,
          muted: this.options.muted,
          poster: this.options.poster,
        },

        params = {
          allowScriptAccess: "always",
          wmode: "opaque",
          bgcolor: "#000000"
        },

        attributes = {
          id: objId,
          name: objId,
          'class': 'vjs-tech'
        };

    player.box.appendChild(placeHolder);

    swfobject.embedSWF(_V_.tech.h5swf.swf, placeHolder.id, "480", "270", "9.0.124", "", flashvars, params, attributes);
  },
  onSWFReady: function(currSwf){
    // Flash seems to be catching errors, so raising them manally
    try {
      // Delay for real swf ready.
      setTimeout(function(){
        var el = _V_.el(currSwf),
            player = el.parentNode.player; // Get player from box

        el.player = player;

        // Update reference to playback technology element
        player.tels.h5swf = el;

        player.ready(function(){
          // this.src("http://video-js.zencoder.com/oceans-clip.mp4");
        });
        player.triggerEvent("techready");

      },0);
    } catch(err) {
      _V_.log(err);
    }
  },
  
  onSWFEvent: function(swfID, eventName, other){
    try {
      var player = _V_.el(swfID).player;
      if (player) {
        player.triggerEvent(eventName);
      }
    } catch(err) {
      _V_.log(err);
    }
  },

  onSWFErrorEvent: function(swfID, eventName){
    _V_.log("Flash (H5SWF) Error", eventName);
  },
  
  api: {
    setupTriggers: function(){
      // Using global onSWFEvent func to distribute events
    },

    play: function(){ this.tels.h5swf.vjs_play(); },
    pause: function(){ this.tels.h5swf.vjs_pause(); },
    src: function(src){ this.tels.h5swf.vjs_src(src); },
    load: function(){ this.tels.h5swf.vjs_load(); },
    poster: function(){ this.tels.h5swf.vjs_getProperty("poster"); },

    buffered: function(){
      return _V_.createTimeRange(0, this.tels.h5swf.vjs_getProperty("buffered"));
    },

    supportsFullScreen: function(){
      return false; // Flash does not allow fullscreen through javascript
    },
    enterFullScreen: function(){ return false; }
  }
};

// Create setters and getters for attributes
(function(){
  var api = VideoJS.tech.h5swf.api,
      readWrite = "src,preload,currentTime,defaultPlaybackRate,playbackRate,autoplay,loop,mediaGroup,controller,controls,volume,muted,defaultMuted".split(","),
      readOnly = "error,currentSrc,networkState,readyState,seeking,initialTime,duration,startOffsetTime,paused,played,seekable,ended,videoTracks,audioTracks,videoWidth,videoHeight,textTracks".split(","),
      callOnly = "load,play,pause".split(",");
      // Overridden: buffered

      createSetter = function(attr){
        var attrUpper = attr.charAt(0).toUpperCase() + attr.slice(1);
        api["set"+attrUpper] = function(val){ return this.tels.h5swf.vjs_setProperty(attr, val); };
      },

      createGetter = function(attr){
        api[attr] = function(){ return this.tels.h5swf.vjs_getProperty(attr); };
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
// Special
// canPlayType
// addTextTrack
// textTracks
