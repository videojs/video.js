// Flowplayer API Connector
VideoJS.tech.youtube = {
  name: "YouTube",
  
  supported: function(){
    // Flash Player 8 or higher
    return true;
  },
  canPlaySource: function(sourceObj){
    return sourceObj.type == "video/youtube";
  },
  supports: {
    format: {},
    event: {
      progress: false,
      timeupdate: false
    }
  },
  init: function(sourceObj){
    var player = this,
        placeHolder = _V_.createElement("div", { id: player.box.id + "_temp_ytswf" }),
        objId = player.box.id+"_youtube_api";

        flashvars = {
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

    this.addEvent("techready", function(){
      var url = sourceObj.src;

      if (url.indexOf("http://") == 0) {
        // Get Youtube ID from URL
        url = url.match(/v=([^&]+)/)[1];
      }
      this.tels.youtube.cueVideoById(url);
    });

    player.box.appendChild(placeHolder);

    swfobject.embedSWF("http://www.youtube.com/apiplayer?" +
                       "version=3&enablejsapi=1&playerapiid=" + objId,
                       placeHolder.id, "480", "295", "9", null, null, params, attributes);
  },
  stateChange: function(id, state){
    var player = _V_(id);

    if (state == 0) {
      player.triggerEvent("ended");
    } else if (state == 1) {
      player.triggerEvent("play");
      player.triggerEvent("playing");
    } else if (state == 2) {
      player.triggerEvent("pause");
    }
  },
  
  error: function(id, errorCode){
    _V_.log(id, errorCode);
  },

  api: {
    setupTriggers: function(){
      this.tels.youtube.addEventListener("onStateChange", 
        "(function(state){ _V_.tech.youtube.stateChange('"+this.id+"',state); })");

      this.tels.youtube.addEventListener("onError", 
        "(function(errorCode){ _V_.tech.youtube.error('"+this.id+"',errorCode); })");

    },

    play: function(){ this.tels.youtube.playVideo(); },
    pause: function(){ this.tels.youtube.pauseVideo(); },
    paused: function(){
      return this.tels.youtube.getPlayerState() !== 1; // More accurate than isPaused
    },

    currentTime: function(){ return this.tels.youtube.getCurrentTime(); },
    setCurrentTime: function(seconds){
      // False blocks seek-ahead.
      this.tels.youtube.seekTo(seconds, true);
    },

    duration: function(){
      return this.tels.youtube.getDuration();
    },

    buffered: function(){
      var percent = this.tels.youtube.getVideoBytesLoaded() / this.tels.youtube.getVideoBytesTotal(),
          seconds = this.duration() * percent;
      return _V_.createTimeRange(0, seconds);
    },

    volume: function(){ return _V_.round(this.tels.youtube.getVolume() / 100, 2); },
    setVolume: function(percentAsDecimal){
      this.tels.youtube.setVolume(parseInt(percentAsDecimal * 100));

      // Youtube Doesn't support VolumeChange Events
      this.triggerEvent("volumechange");
    },
    muted: function(){ return this.tels.youtube.isMuted(); },
    setMuted: function(bool){
      if (bool) {
        this.tels.youtube.mute()
      } else {
        this.tels.youtube.unMute()
      }
    },

    supportsFullScreen: function(){
      return false; // Flash does not allow fullscreen through javascript
      // Maybe at click listener, and say "click screen".
    },
    enterFullScreen: function(){ this.tels.flowplayer.api.toggleFullscreen(); },

    src: function(src){
      this.tels.youtube.cueVideoById(src);
    },
    load: function(){
      // Youtube will autoload?
    }
  }
};

// YouTube Defined Player Ready Callback
window.onYouTubePlayerReady = function(playerId) {
  var el = _V_.el(playerId),
      player = el.parentNode.player; // Get player from box

  el.player = player;

  // Update reference to playback technology element
  player.tels.youtube = el;

  player.triggerEvent("techready");
}

