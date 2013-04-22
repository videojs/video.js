/**
 * @fileoverview HTML5 Media Controller - Wrapper for HTML5 Media API
 */

/**
 * HTML5 Media Controller - Wrapper for HTML5 Media API
 * @param {vjs.Player|Object} player
 * @param {Object=} options
 * @param {Function=} ready
 * @constructor
 */
vjs.Html5 = vjs.MediaTechController.extend({
  /** @constructor */
  init: function(player, options, ready){
    // volume cannot be changed from 1 on iOS
    this.features.volumeControl = vjs.Html5.canControlVolume();

    // In iOS, if you move a video element in the DOM, it breaks video playback.
    this.features.movingMediaElementInDOM = !vjs.IS_IOS;

    vjs.MediaTechController.call(this, player, options, ready);

    var source = options['source'];

    // If the element source is already set, we may have missed the loadstart event, and want to trigger it.
    // We don't want to set the source again and interrupt playback.
    if (source && this.el_.currentSrc == source.src) {
      player.trigger('loadstart');

    // Otherwise set the source if one was provided.
    } else if (source) {
      this.el_.src = source.src;
    }

    // Chrome and Safari both have issues with autoplay.
    // In Safari (5.1.1), when we move the video element into the container div, autoplay doesn't work.
    // In Chrome (15), if you have autoplay + a poster + no controls, the video gets hidden (but audio plays)
    // This fixes both issues. Need to wait for API, so it updates displays correctly
    player.ready(function(){
      if (this.options_['autoplay'] && this.paused()) {
        this.tag.poster = null; // Chrome Fix. Fixed in Chrome v16.
        this.play();
      }
    });

    this.on('click', this.onClick);

    this.setupTriggers();

    this.triggerReady();
  }
});

vjs.Html5.prototype.dispose = function(){
  vjs.MediaTechController.prototype.dispose.call(this);
};

vjs.Html5.prototype.createEl = function(){
  var player = this.player_,
      // If possible, reuse original tag for HTML5 playback technology element
      el = player.tag,
      newEl;

  // Check if this browser supports moving the element into the box.
  // On the iPhone video will break if you move the element,
  // So we have to create a brand new element.
  if (!el || this.features.movingMediaElementInDOM === false) {

    // If the original tag is still there, remove it.
    if (el) {
      player.el().removeChild(el);
      el = el.cloneNode(false);
    } else {
      el = vjs.createEl('video', {
        id:player.id() + '_html5_api',
        className:'vjs-tech'
      });
    }
    // associate the player with the new tag
    el['player'] = player;

    vjs.insertFirst(el, player.el());
  }

  // Update specific tag settings, in case they were overridden
  var attrs = ['autoplay','preload','loop','muted'];
  for (var i = attrs.length - 1; i >= 0; i--) {
    var attr = attrs[i];
    if (player.options_[attr] !== null) {
      el[attr] = player.options_[attr];
    }
  }

  return el;
  // jenniisawesome = true;
};

// Make video events trigger player events
// May seem verbose here, but makes other APIs possible.
vjs.Html5.prototype.setupTriggers = function(){
  for (var i = vjs.Html5.Events.length - 1; i >= 0; i--) {
    vjs.on(this.el_, vjs.Html5.Events[i], vjs.bind(this.player_, this.eventHandler));
  }
};
// Triggers removed using this.off when disposed

vjs.Html5.prototype.eventHandler = function(e){
  this.trigger(e);

  // No need for media events to bubble up.
  e.stopPropagation();
};


vjs.Html5.prototype.play = function(){ this.el_.play(); };
vjs.Html5.prototype.pause = function(){ this.el_.pause(); };
vjs.Html5.prototype.paused = function(){ return this.el_.paused; };

vjs.Html5.prototype.currentTime = function(){ return this.el_.currentTime; };
vjs.Html5.prototype.setCurrentTime = function(seconds){
  try {
    this.el_.currentTime = seconds;
  } catch(e) {
    vjs.log(e, 'Video is not ready. (Video.js)');
    // this.warning(VideoJS.warnings.videoNotReady);
  }
};

vjs.Html5.prototype.duration = function(){ return this.el_.duration || 0; };
vjs.Html5.prototype.buffered = function(){ return this.el_.buffered; };

vjs.Html5.prototype.volume = function(){ return this.el_.volume; };
vjs.Html5.prototype.setVolume = function(percentAsDecimal){ this.el_.volume = percentAsDecimal; };
vjs.Html5.prototype.muted = function(){ return this.el_.muted; };
vjs.Html5.prototype.setMuted = function(muted){ this.el_.muted = muted; };

vjs.Html5.prototype.width = function(){ return this.el_.offsetWidth; };
vjs.Html5.prototype.height = function(){ return this.el_.offsetHeight; };

vjs.Html5.prototype.supportsFullScreen = function(){
  if (typeof this.el_.webkitEnterFullScreen == 'function') {

    // Seems to be broken in Chromium/Chrome && Safari in Leopard
    if (!navigator.userAgent.match('Chrome') && !navigator.userAgent.match('Mac OS X 10.5')) {
      return true;
    }
  }
  return false;
};

vjs.Html5.prototype.enterFullScreen = function(){
  try {
    this.el_.webkitEnterFullScreen();
  } catch (e) {
    if (e.code == 11) {
      // this.warning(VideoJS.warnings.videoNotReady);
      vjs.log('Video.js: Video not ready.');
    }
  }
};
vjs.Html5.prototype.exitFullScreen = function(){
    try {
      this.el_.webkitExitFullScreen();
    } catch (e) {
      if (e.code == 11) {
        // this.warning(VideoJS.warnings.videoNotReady);
        vjs.log('Video.js: Video not ready.');
      }
    }
};
vjs.Html5.prototype.src = function(src){ this.el_.src = src; };
vjs.Html5.prototype.load = function(){ this.el_.load(); };
vjs.Html5.prototype.currentSrc = function(){ return this.el_.currentSrc; };

vjs.Html5.prototype.preload = function(){ return this.el_.preload; };
vjs.Html5.prototype.setPreload = function(val){ this.el_.preload = val; };
vjs.Html5.prototype.autoplay = function(){ return this.el_.autoplay; };
vjs.Html5.prototype.setAutoplay = function(val){ this.el_.autoplay = val; };
vjs.Html5.prototype.loop = function(){ return this.el_.loop; };
vjs.Html5.prototype.setLoop = function(val){ this.el_.loop = val; };

vjs.Html5.prototype.error = function(){ return this.el_.error; };
  // networkState: function(){ return this.el_.networkState; },
  // readyState: function(){ return this.el_.readyState; },
vjs.Html5.prototype.seeking = function(){ return this.el_.seeking; };
  // initialTime: function(){ return this.el_.initialTime; },
  // startOffsetTime: function(){ return this.el_.startOffsetTime; },
  // played: function(){ return this.el_.played; },
  // seekable: function(){ return this.el_.seekable; },
vjs.Html5.prototype.ended = function(){ return this.el_.ended; };
  // videoTracks: function(){ return this.el_.videoTracks; },
  // audioTracks: function(){ return this.el_.audioTracks; },
  // videoWidth: function(){ return this.el_.videoWidth; },
  // videoHeight: function(){ return this.el_.videoHeight; },
  // textTracks: function(){ return this.el_.textTracks; },
  // defaultPlaybackRate: function(){ return this.el_.defaultPlaybackRate; },
  // playbackRate: function(){ return this.el_.playbackRate; },
  // mediaGroup: function(){ return this.el_.mediaGroup; },
  // controller: function(){ return this.el_.controller; },
vjs.Html5.prototype.defaultMuted = function(){ return this.el_.defaultMuted; };

/* HTML5 Support Testing ---------------------------------------------------- */

vjs.Html5.isSupported = function(){
  return !!document.createElement('video').canPlayType;
};

vjs.Html5.canPlaySource = function(srcObj){
  return !!document.createElement('video').canPlayType(srcObj.type);
  // TODO: Check Type
  // If no Type, check ext
  // Check Media Type
};

vjs.Html5.canControlVolume = function(){
  var volume =  vjs.TEST_VID.volume;
  vjs.TEST_VID.volume = (volume / 2) + 0.1;
  return volume !== vjs.TEST_VID.volume;
};

// List of all HTML5 events (various uses).
vjs.Html5.Events = 'loadstart,suspend,abort,error,emptied,stalled,loadedmetadata,loadeddata,canplay,canplaythrough,playing,waiting,seeking,seeked,ended,durationchange,timeupdate,progress,play,pause,ratechange,volumechange'.split(',');


// HTML5 Feature detection and Device Fixes --------------------------------- //

// Android
if (vjs.IS_ANDROID) {

  // Override Android 2.2 and less canPlayType method which is broken
  if (vjs.ANDROID_VERSION < 3) {
    document.createElement('video').constructor.prototype.canPlayType = function(type){
      return (type && type.toLowerCase().indexOf('video/mp4') != -1) ? 'maybe' : '';
    };
  }
}

