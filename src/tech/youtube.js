
/* VideoJS-YouTube - YouTube iFrame Wrapper
================================================================================ */
_V_.youtube = _V_.PlaybackTech.extend({

  init: function(player, options){
    this.player = player;

    var source = options.source;

    // Extract the YouTube videoID from the source
    var videoId = this.getVideoId(source.src);

    // Which element to embed in
    var parentEl = options.parentEl;

    // Generate ID for iFrame
    var objId = player.el.id+"_youtube_api";

    // Create an iFrame for the YouTube player
    var iFrm = this.el = _V_.createElement("iframe", {
      id: objId + "_iframe",
      name: objId + "_iframe",
      className: "vjs-tech",
      scrolling: "no",
      marginWidth: 0,
      marginHeight: 0,
      frameBorder: 0,
      webkitAllowFullScreen: "",
      mozallowfullscreen: "",
      allowFullScreen: ""
    });

    // Store a global list of currently loading players
    _V_.youtube.loadingEls = _V_.youtube.loadingEls || [];
    _V_.youtube.loadingEls.push(parentEl);

    var playerOptions = player.options;
    var optionsParams = options.params || {};

    // Setup player parameters
    var params = {
      disablekb: 1,
      enablejsapi: 1,
      iv_load_policy: 3,
      modestbranding: 1,
      playerapiid: objId,
      wmode: "opaque", // Opaque is needed to overlay controls, but can affect playback performance (Flash only)
      rel: 0,
      showinfo: 0,
      showsearch: 0,
      controls: this.toBoolInt(optionsParams.ytcontrols || playerOptions.ytcontrols),
      autoplay: this.toBoolInt(optionsParams.autoplay || playerOptions.autoplay),
      loop: this.toBoolInt(optionsParams.loop || playerOptions.loop),
      hd: this.toBoolInt(optionsParams.hd || playerOptions.hd)
    };

    var p = (document.location.protocol == 'https:') ? 'https:' : 'http:';

    if (document.domain != 'localhost' && document.location.protocol != 'file:')
      params.origin = p + "//" + document.domain;

    this.player.apiArgs = {
      videoId: videoId,
      playerVars: params,
      events: {
        "onReady": _V_.youtube.onReady,
        "onStateChange": _V_.youtube.onStateChange,
        "onPlaybackQualityChange": _V_.youtube.onPlaybackQualityChange,
        "onError": _V_.youtube.onError
      }
    };

    _V_.addEvent(parentEl, "techready", _V_.proxy(this, function(){
      // YouTube JS API is ready, load the player
      iFrm.src = p + "//www.youtube.com/embed/" + videoId + "?" +
        this.makeQueryString(params);
      // Initialize the YouTube Player object. Only pass events as arguments,
      // since all of our other parameters went into the iFrame URL
      this.youtube = new YT.Player(iFrm, { events: this.player.apiArgs.events });
    }));

    // Add iFrame to player div
    _V_.insertFirst(iFrm, parentEl);

    _V_.youtube.updateVideoQuality(this.player, null);

    this.loadApi();
  },

  destroy: function(){
    this.el.parentNode.removeChild(this.el);
    this.youtube.destroy();
    delete this.youtube;
  },

  play: function(){ this.youtube.playVideo(); },
  pause: function(){ this.youtube.pauseVideo(); },
  paused: function(){
    var state = this.youtube.getPlayerState();
    return state !== YT.PlayerState.PLAYING &&
           state !== YT.PlayerState.BUFFERING;
  },

  src: function(src){
    delete this.player.error;
    
    // FIXME: Does this work or do we have to set the iFrame src again?
    var videoId = this.getVideoId(src);
    this.youtube.loadVideoById(videoId);
  },
  load: function(){ },
  poster: function(){
    var videoId = this.getVideoId(this.youtube.getVideoUrl());
    return "http://img.youtube.com/vi/" + videoId + "/0.jpg";
  },

  currentTime: function(){ return this.youtube.getCurrentTime() || 0; },
  setCurrentTime: function(seconds){
    this.youtube.seekTo(seconds, true);
    this.player.triggerEvent("timeupdate");
  },

  duration: function(){ return this.youtube.getDuration() || 0; },
  buffered: function(){
    var loadedBytes = this.youtube.getVideoBytesLoaded();
    var totalBytes = this.youtube.getVideoBytesTotal();
    if (!loadedBytes || !totalBytes) return 0;

    var duration = this.youtube.getDuration();
    var secondsBuffered = (loadedBytes / totalBytes) * duration;
    var secondsOffset = (this.youtube.getVideoStartBytes() / totalBytes) * duration;
    return _V_.createTimeRange(secondsOffset, secondsOffset + secondsBuffered);
  },

  volume: function(){
    if (isNaN(this.youtube.volumeVal))
      this.youtube.volumeVal = this.youtube.getVolume() / 100.0;
    return this.youtube.volumeVal;
  },
  setVolume: function(percentAsDecimal){
    if (percentAsDecimal != this.youtube.volumeVal) {
      this.youtube.volumeVal = percentAsDecimal;
      this.youtube.setVolume(percentAsDecimal * 100.0);
      this.player.triggerEvent("volumechange");
    }
  },
  muted: function(){ return this.youtube.isMuted(); },
  setMuted: function(muted){
    if (muted)
      this.youtube.mute();
    else
      this.youtube.unMute();

    // Volume changes do not show up in the API immediately, so we need
    // to wait for a moment
    var self = this;
    setTimeout(function() { self.player.triggerEvent("volumechange"); }, 50);
  },

  width: function(){ return this.el.offsetWidth; },
  height: function(){ return this.el.offsetHeight; },

  currentSrc: function(){ return this.youtube.getVideoUrl(); },

  preload: function(){ return false; },
  setPreload: function(val){ },
  autoplay: function(){ return !!this.player.apiArgs.playerVars.autoplay; },
  setAutoplay: function(val){ },
  loop: function(){ return !!this.player.apiArgs.playerVars.loop; },
  setLoop: function(val){
    this.player.apiArgs.playerVars.loop = (val ? 1 : 0);
    // We handle looping manually
    //this.youtube.setLoop(val);
  },

  supportsFullScreen: function(){ return false; },
  enterFullScreen: function(){ return false; },

  error: function(){ return this.player.error; },
  seeking: function(){ return false; },
  ended: function(){ return this.youtube.getPlayerState() === YT.PlayerState.ENDED; },
  videoWidth: function(){ return this.player.videoWidth; },
  videoHeight: function(){ return this.player.videoHeight; },
  controls: function(){ return this.player.options.controls; },
  defaultMuted: function(){ return false; },

  // Helpers ------------------------------------------------------------------

  makeQueryString: function(args) {
    var array = [];
    for (var key in args) {
      if (args.hasOwnProperty(key))
        array.push(encodeURIComponent(key) + "=" + encodeURIComponent(args[key]));
    }
    return array.join("&");
  },

  getVideoId: function(url) {
    return url.match(/v=([^&]+)/)[1];
  },

  toBoolInt: function(val) {
    return val ? 1 : 0;
  },

  loadApi: function() {
    // Check if the YouTube JS API has already been loaded
    var js, id = "youtube-jssdk", ref = document.getElementsByTagName("script")[0];
    if (_V_.el(id)) {
      window.onYouTubePlayerAPIReady();
      return;
    }

    // Asynchronously load the YouTube JS API
    var p = (document.location.protocol == "https:") ? "https:" : "http:";
    js = _V_.createElement("script", { id: id, async: true, src: p + "//www.youtube.com/player_api" });
    ref.parentNode.insertBefore(js, ref);
  }
});

// Event callbacks ------------------------------------------------------------

_V_.youtube.onReady = function(e){
  var player = e.target.getIframe().parentNode.player;

  player.tech.triggerReady();
  player.triggerReady();
  player.triggerEvent("durationchange");
  
  _V_.youtube.hideOverlay(player);
};

_V_.youtube.onStateChange = function(e){
  var player = e.target.getIframe().parentNode.player;

  // Suppress any duplicate events from YouTube
  if (player.lastState === e.data)
    return;

  switch (e.data) {
    case -1: // Unstarted
      player.triggerEvent("durationchange");
      break;
    case YT.PlayerState.CUED:
      break;
    case YT.PlayerState.ENDED:
      player.triggerEvent("ended");
      _V_.youtube.hideOverlay(player);
      
      // YouTube looping doesn't seem to play well with VideoJS, so we need to
      // implement it manually here
      if (player.apiArgs.playerVars.loop) {
        player.tech.youtube.seekTo(0, true);
        player.tech.youtube.playVideo();
      } else {
        player.tech.youtube.stopVideo();
      }
      break;
    case YT.PlayerState.PLAYING:
      player.triggerEvent("timeupdate");
      player.triggerEvent("playing");
      player.triggerEvent("play");
      break;
    case YT.PlayerState.PAUSED:
      player.triggerEvent("pause");
      break;
    case YT.PlayerState.BUFFERING:
      player.triggerEvent("timeupdate");
      player.triggerEvent("waiting");
      // Hide the waiting spinner since YouTube has its own
      player.loadingSpinner.hide();
      break;
  }

  player.lastState = e.data;
};

_V_.youtube.onPlaybackQualityChange = function(e){
  var player = e.target.getIframe().parentNode.player;
  _V_.youtube.updateVideoQuality(player, e.data);
  player.triggerEvent("ratechange");
};

_V_.youtube.onError = function(e){
  var player = e.target.getIframe().parentNode.player;
  player.error = e.data;
  player.triggerEvent("error");
};

// Helpers --------------------------------------------------------------------

_V_.youtube.hideOverlay = function(player) {
  // Hide the big play button and poster since YouTube provides these. Using
  // our own prevents the video from playing on the first click in mobile
  // devices
  player.bigPlayButton.hide();
  player.posterImage.hide();
};

_V_.youtube.updateVideoQuality = function(player, quality) {
  switch (quality) {
    case 'medium':
      player.videoWidth = 480;
      player.videoHeight = 360;
      break;
    case 'large':
      player.videoWidth = 640;
      player.videoHeight = 480;
      break;
    case 'hd720':
      player.videoWidth = 960;
      player.videoHeight = 720;
      break;
    case 'hd1080':
      player.videoWidth = 1440;
      player.videoHeight = 1080;
      break;
    case 'highres':
      player.videoWidth = 1920;
      player.videoHeight = 1080;
      break;
    case 'small':
      player.videoWidth = 320;
      player.videoHeight = 240;
      break;
    default:
      player.videoWidth = 0;
      player.videoHeight = 0;
      break;
  }
};

// Support testing ------------------------------------------------------------

_V_.youtube.isSupported = function(){
  return true;
};

_V_.youtube.canPlaySource = function(srcObj){
  return srcObj.type == "video/youtube";
};

_V_.youtube.prototype.support = {
  formats: {
    "video/youtube": "YT"
  },

  // Optional events that we can manually mimic with timers
  progressEvent: false,
  timeupdateEvent: false,

  //fullscreen: true,
  // In iOS, if you move a video element in the DOM, it breaks video playback.
  movingElementInDOM: !_V_.isIOS(),

  fullscreenResize: true,
  parentResize: true
};

// YouTube JS API load callback -----------------------------------------------

window.onYouTubePlayerAPIReady = function() {
  // Fire a techready event for each loading player
  var loadingEl;
  while ((loadingEl = _V_.youtube.loadingEls.shift())) {
    loadingEl.player.triggerEvent("techready");
  }
};
