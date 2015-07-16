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
    var  nodes, nodesLength, i, node, nodeName, removeNodes;

    if (options['nativeCaptions'] === false || options['nativeTextTracks'] === false) {
      this['featuresNativeTextTracks'] = false;
    }

    vjs.MediaTechController.call(this, player, options, ready);

    this.setupTriggers();

    var source = options['source'];

    // Set the source if one is provided
    // 1) Check if the source is new (if not, we want to keep the original so playback isn't interrupted)
    // 2) Check to see if the network state of the tag was failed at init, and if so, reset the source
    // anyway so the error gets fired.
    if (source && (this.el_.currentSrc !== source.src || (player.tag && player.tag.initNetworkState_ === 3))) {
      this.setSource(source);
    }

    if (this.el_.hasChildNodes()) {

      nodes = this.el_.childNodes;
      nodesLength = nodes.length;
      removeNodes = [];

      while (nodesLength--) {
        node = nodes[nodesLength];
        nodeName = node.nodeName.toLowerCase();
        if (nodeName === 'track') {
          if (!this['featuresNativeTextTracks']) {
            // Empty video tag tracks so the built-in player doesn't use them also.
            // This may not be fast enough to stop HTML5 browsers from reading the tags
            // so we'll need to turn off any default tracks if we're manually doing
            // captions and subtitles. videoElement.textTracks
            removeNodes.push(node);
          } else {
            this.remoteTextTracks().addTrack_(node['track']);
          }
        }
      }

      for (i=0; i<removeNodes.length; i++) {
        this.el_.removeChild(removeNodes[i]);
      }
    }

    if (this['featuresNativeTextTracks']) {
      this.on('loadstart', vjs.bind(this, this.hideCaptions));
    }

    // Determine if native controls should be used
    // Our goal should be to get the custom controls on mobile solid everywhere
    // so we can remove this all together. Right now this will block custom
    // controls on touch enabled laptops like the Chrome Pixel
    if (vjs.TOUCH_ENABLED && player.options()['nativeControlsForTouch'] === true) {
      this.useNativeControls();
    }

    // Chrome and Safari both have issues with autoplay.
    // In Safari (5.1.1), when we move the video element into the container div, autoplay doesn't work.
    // In Chrome (15), if you have autoplay + a poster + no controls, the video gets hidden (but audio plays)
    // This fixes both issues. Need to wait for API, so it updates displays correctly
    player.ready(function(){
      if (this.src() && this.tag && this.options_['autoplay'] && this.paused()) {
        delete this.tag['poster']; // Chrome Fix. Fixed in Chrome v16.
        this.play();
      }
    });

    this.triggerReady();
  }
});

vjs.Html5.prototype.dispose = function(){
  vjs.Html5.disposeMediaElement(this.el_);
  vjs.MediaTechController.prototype.dispose.call(this);
};

vjs.Html5.prototype.createEl = function(){
  var player = this.player_,
      track,
      trackEl,
      i,
      // If possible, reuse original tag for HTML5 playback technology element
      el = player.tag,
      attributes,
      newEl,
      clone;

  // Check if this browser supports moving the element into the box.
  // On the iPhone video will break if you move the element,
  // So we have to create a brand new element.
  if (!el || this['movingMediaElementInDOM'] === false) {

    // If the original tag is still there, clone and remove it.
    if (el) {
      clone = el.cloneNode(false);
      vjs.Html5.disposeMediaElement(el);
      el = clone;
      player.tag = null;
    } else {
      el = vjs.createEl('video');

      // determine if native controls should be used
      attributes = videojs.util.mergeOptions({}, player.tagAttributes);
      if (!vjs.TOUCH_ENABLED || player.options()['nativeControlsForTouch'] !== true) {
        delete attributes.controls;
      }

      vjs.setElementAttributes(el,
        vjs.obj.merge(attributes, {
          id:player.id() + '_html5_api',
          'class':'vjs-tech'
        })
      );
    }
    // associate the player with the new tag
    el['player'] = player;

    if (player.options_.tracks) {
      for (i = 0; i < player.options_.tracks.length; i++) {
        track = player.options_.tracks[i];
        trackEl = document.createElement('track');
        trackEl.kind = track.kind;
        trackEl.label = track.label;
        trackEl.srclang = track.srclang;
        trackEl.src = track.src;
        if ('default' in track) {
          trackEl.setAttribute('default', 'default');
        }
        el.appendChild(trackEl);
      }
    }

    vjs.insertFirst(el, player.el());
  }

  // Update specific tag settings, in case they were overridden
  var settingsAttrs = ['autoplay','preload','loop','muted'];
  for (i = settingsAttrs.length - 1; i >= 0; i--) {
    var attr = settingsAttrs[i];
    var overwriteAttrs = {};
    if (typeof player.options_[attr] !== 'undefined') {
      overwriteAttrs[attr] = player.options_[attr];
    }
    vjs.setElementAttributes(el, overwriteAttrs);
  }

  return el;
  // jenniisawesome = true;
};


vjs.Html5.prototype.hideCaptions = function() {
  var tracks = this.el_.querySelectorAll('track'),
      track,
      i = tracks.length,
      kinds = {
        'captions': 1,
        'subtitles': 1
      };

  while (i--) {
    track = tracks[i].track;
    if ((track && track['kind'] in kinds) &&
        (!tracks[i]['default'])) {
      track.mode = 'disabled';
    }
  }
};

// Make video events trigger player events
// May seem verbose here, but makes other APIs possible.
// Triggers removed using this.off when disposed
vjs.Html5.prototype.setupTriggers = function(){
  for (var i = vjs.Html5.Events.length - 1; i >= 0; i--) {
    this.on(vjs.Html5.Events[i], this.eventHandler);
  }
};

vjs.Html5.prototype.eventHandler = function(evt){
  // In the case of an error on the video element, set the error prop
  // on the player and let the player handle triggering the event. On
  // some platforms, error events fire that do not cause the error
  // property on the video element to be set. See #1465 for an example.
  if (evt.type == 'error' && this.error()) {
    this.player().error(this.error().code);

  // in some cases we pass the event directly to the player
  } else {
    // No need for media events to bubble up.
    evt.bubbles = false;

    this.player().trigger(evt);
  }
};

vjs.Html5.prototype.useNativeControls = function(){
  var tech, player, controlsOn, controlsOff, cleanUp;

  tech = this;
  player = this.player();

  // If the player controls are enabled turn on the native controls
  tech.setControls(player.controls());

  // Update the native controls when player controls state is updated
  controlsOn = function(){
    tech.setControls(true);
  };
  controlsOff = function(){
    tech.setControls(false);
  };
  player.on('controlsenabled', controlsOn);
  player.on('controlsdisabled', controlsOff);

  // Clean up when not using native controls anymore
  cleanUp = function(){
    player.off('controlsenabled', controlsOn);
    player.off('controlsdisabled', controlsOff);
  };
  tech.on('dispose', cleanUp);
  player.on('usingcustomcontrols', cleanUp);

  // Update the state of the player to using native controls
  player.usingNativeControls(true);
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
    if (/Android/.test(vjs.USER_AGENT) || !/Chrome|Mac OS X 10.5/.test(vjs.USER_AGENT)) {
      return true;
    }
  }
  return false;
};

vjs.Html5.prototype.enterFullScreen = function(){
  var video = this.el_;

  if ('webkitDisplayingFullscreen' in video) {
    this.one('webkitbeginfullscreen', function() {
      this.player_.isFullscreen(true);

      this.one('webkitendfullscreen', function() {
        this.player_.isFullscreen(false);
        this.player_.trigger('fullscreenchange');
      });

      this.player_.trigger('fullscreenchange');
    });
  }

  if (video.paused && video.networkState <= video.HAVE_METADATA) {
    // attempt to prime the video element for programmatic access
    // this isn't necessary on the desktop but shouldn't hurt
    this.el_.play();

    // playing and pausing synchronously during the transition to fullscreen
    // can get iOS ~6.1 devices into a play/pause loop
    this.setTimeout(function(){
      video.pause();
      video.webkitEnterFullScreen();
    }, 0);
  } else {
    video.webkitEnterFullScreen();
  }
};

vjs.Html5.prototype.exitFullScreen = function(){
  this.el_.webkitExitFullScreen();
};

// Checks to see if the element's reported URI (either from `el_.src`
// or `el_.currentSrc`) is a blob-uri and, if so, returns the uri that
// was passed into the source-handler when it was first invoked instead
// of the blob-uri
vjs.Html5.prototype.returnOriginalIfBlobURI_ = function (elementURI, originalURI) {
  var blobURIRegExp = /^blob\:/i;

  // If originalURI is undefined then we are probably in a non-source-handler-enabled
  // tech that inherits from the Html5 tech so we should just return the elementURI
  // regardless of it's blobby-ness
  if (originalURI && elementURI && blobURIRegExp.test(elementURI)) {
    return originalURI;
  }
  return elementURI;
};

vjs.Html5.prototype.src = function(src) {
  var elementSrc = this.el_.src;

  if (src === undefined) {
    return this.returnOriginalIfBlobURI_(elementSrc, this.source_);
  } else {
    // Setting src through `src` instead of `setSrc` will be deprecated
    this.setSrc(src);
  }
};

vjs.Html5.prototype.setSrc = function(src) {
  this.el_.src = src;
};

vjs.Html5.prototype.load = function(){ this.el_.load(); };
vjs.Html5.prototype.currentSrc = function(){
  var elementSrc = this.el_.currentSrc;

  if (!this.currentSource_) {
    return elementSrc;
  }

  return this.returnOriginalIfBlobURI_(elementSrc, this.currentSource_.src);
};

vjs.Html5.prototype.poster = function(){ return this.el_.poster; };
vjs.Html5.prototype.setPoster = function(val){ this.el_.poster = val; };

vjs.Html5.prototype.preload = function(){ return this.el_.preload; };
vjs.Html5.prototype.setPreload = function(val){ this.el_.preload = val; };

vjs.Html5.prototype.autoplay = function(){ return this.el_.autoplay; };
vjs.Html5.prototype.setAutoplay = function(val){ this.el_.autoplay = val; };

vjs.Html5.prototype.controls = function(){ return this.el_.controls; };
vjs.Html5.prototype.setControls = function(val){ this.el_.controls = !!val; };

vjs.Html5.prototype.loop = function(){ return this.el_.loop; };
vjs.Html5.prototype.setLoop = function(val){ this.el_.loop = val; };

vjs.Html5.prototype.error = function(){ return this.el_.error; };
vjs.Html5.prototype.seeking = function(){ return this.el_.seeking; };
vjs.Html5.prototype.seekable = function(){ return this.el_.seekable; };
vjs.Html5.prototype.ended = function(){ return this.el_.ended; };
vjs.Html5.prototype.defaultMuted = function(){ return this.el_.defaultMuted; };

vjs.Html5.prototype.playbackRate = function(){ return this.el_.playbackRate; };
vjs.Html5.prototype.setPlaybackRate = function(val){ this.el_.playbackRate = val; };

vjs.Html5.prototype.networkState = function(){ return this.el_.networkState; };
vjs.Html5.prototype.readyState = function(){ return this.el_.readyState; };

vjs.Html5.prototype.textTracks = function() {
  if (!this['featuresNativeTextTracks']) {
    return vjs.MediaTechController.prototype.textTracks.call(this);
  }

  return this.el_.textTracks;
};
vjs.Html5.prototype.addTextTrack = function(kind, label, language) {
  if (!this['featuresNativeTextTracks']) {
    return vjs.MediaTechController.prototype.addTextTrack.call(this, kind, label, language);
  }

  return this.el_.addTextTrack(kind, label, language);
};

vjs.Html5.prototype.addRemoteTextTrack = function(options) {
  if (!this['featuresNativeTextTracks']) {
    return vjs.MediaTechController.prototype.addRemoteTextTrack.call(this, options);
  }

  var track = document.createElement('track');
  options = options || {};

  if (options['kind']) {
    track['kind'] = options['kind'];
  }
  if (options['label']) {
    track['label'] = options['label'];
  }
  if (options['language'] || options['srclang']) {
    track['srclang'] = options['language'] || options['srclang'];
  }
  if (options['default']) {
    track['default'] = options['default'];
  }
  if (options['id']) {
    track['id'] = options['id'];
  }
  if (options['src']) {
    track['src'] = options['src'];
  }

  this.el().appendChild(track);

  if (track.track['kind'] === 'metadata') {
    track['track']['mode'] = 'hidden';
  } else {
    track['track']['mode'] = 'disabled';
  }

  track['onload'] = function() {
    var tt = track['track'];
    if (track.readyState >= 2) {
      if (tt['kind'] === 'metadata' && tt['mode'] !== 'hidden') {
        tt['mode'] = 'hidden';
      } else if (tt['kind'] !== 'metadata' && tt['mode'] !== 'disabled') {
        tt['mode'] = 'disabled';
      }
      track['onload'] = null;
    }
  };

  this.remoteTextTracks().addTrack_(track.track);

  return track;
};

vjs.Html5.prototype.removeRemoteTextTrack = function(track) {
  if (!this['featuresNativeTextTracks']) {
    return vjs.MediaTechController.prototype.removeRemoteTextTrack.call(this, track);
  }

  var tracks, i;

  this.remoteTextTracks().removeTrack_(track);

  tracks = this.el()['querySelectorAll']('track');

  for (i = 0; i < tracks.length; i++) {
    if (tracks[i] === track || tracks[i]['track'] === track) {
      tracks[i]['parentNode']['removeChild'](tracks[i]);
      break;
    }
  }
};

/* HTML5 Support Testing ---------------------------------------------------- */

/**
 * Check if HTML5 video is supported by this browser/device
 * @return {Boolean}
 */
vjs.Html5.isSupported = function(){
  // IE9 with no Media Player is a LIAR! (#984)
  try {
    vjs.TEST_VID['volume'] = 0.5;
  } catch (e) {
    return false;
  }

  return !!vjs.TEST_VID.canPlayType;
};

// Add Source Handler pattern functions to this tech
vjs.MediaTechController.withSourceHandlers(vjs.Html5);

/*
 * Override the withSourceHandler mixin's methods with our own because
 * the HTML5 Media Element returns blob urls when utilizing MSE and we
 * want to still return proper source urls even when in that case
 */
(function(){
  var
    origSetSource = vjs.Html5.prototype.setSource,
    origDisposeSourceHandler = vjs.Html5.prototype.disposeSourceHandler;

  vjs.Html5.prototype.setSource = function (source) {
    var retVal = origSetSource.call(this, source);
    this.source_ = source.src;
    return retVal;
  };

  vjs.Html5.prototype.disposeSourceHandler = function () {
    this.source_ = undefined;
    return origDisposeSourceHandler.call(this);
  };
})();

/**
 * The default native source handler.
 * This simply passes the source to the video element. Nothing fancy.
 * @param  {Object} source   The source object
 * @param  {vjs.Html5} tech  The instance of the HTML5 tech
 */
vjs.Html5['nativeSourceHandler'] = {};

/**
 * Check if the video element can handle the source natively
 * @param  {Object} source  The source object
 * @return {String}         'probably', 'maybe', or '' (empty string)
 */
vjs.Html5['nativeSourceHandler']['canHandleSource'] = function(source){
  var match, ext;

  function canPlayType(type){
    // IE9 on Windows 7 without MediaPlayer throws an error here
    // https://github.com/videojs/video.js/issues/519
    try {
      return vjs.TEST_VID.canPlayType(type);
    } catch(e) {
      return '';
    }
  }

  // If a type was provided we should rely on that
  if (source.type) {
    return canPlayType(source.type);
  } else if (source.src) {
    // If no type, fall back to checking 'video/[EXTENSION]'
    match = source.src.match(/\.([^.\/\?]+)(\?[^\/]+)?$/i);
    ext = match && match[1];

    return canPlayType('video/'+ext);
  }

  return '';
};

/**
 * Pass the source to the video element
 * Adaptive source handlers will have more complicated workflows before passing
 * video data to the video element
 * @param  {Object} source    The source object
 * @param  {vjs.Html5} tech   The instance of the Html5 tech
 */
vjs.Html5['nativeSourceHandler']['handleSource'] = function(source, tech){
  tech.setSrc(source.src);
};

/**
 * Clean up the source handler when disposing the player or switching sources..
 * (no cleanup is needed when supporting the format natively)
 */
vjs.Html5['nativeSourceHandler']['dispose'] = function(){};

// Register the native source handler
vjs.Html5['registerSourceHandler'](vjs.Html5['nativeSourceHandler']);

/**
 * Check if the volume can be changed in this browser/device.
 * Volume cannot be changed in a lot of mobile devices.
 * Specifically, it can't be changed from 1 on iOS.
 * @return {Boolean}
 */
vjs.Html5.canControlVolume = function(){
  var volume =  vjs.TEST_VID.volume;
  vjs.TEST_VID.volume = (volume / 2) + 0.1;
  return volume !== vjs.TEST_VID.volume;
};

/**
 * Check if playbackRate is supported in this browser/device.
 * @return {[type]} [description]
 */
vjs.Html5.canControlPlaybackRate = function(){
  var playbackRate =  vjs.TEST_VID.playbackRate;
  vjs.TEST_VID.playbackRate = (playbackRate / 2) + 0.1;
  return playbackRate !== vjs.TEST_VID.playbackRate;
};

/**
 * Check to see if native text tracks are supported by this browser/device
 * @return {Boolean}
 */
vjs.Html5.supportsNativeTextTracks = function() {
  var supportsTextTracks;

  // Figure out native text track support
  // If mode is a number, we cannot change it because it'll disappear from view.
  // Browsers with numeric modes include IE10 and older (<=2013) samsung android models.
  // Firefox isn't playing nice either with modifying the mode
  // TODO: Investigate firefox: https://github.com/videojs/video.js/issues/1862
  supportsTextTracks = !!vjs.TEST_VID.textTracks;
  if (supportsTextTracks && vjs.TEST_VID.textTracks.length > 0) {
    supportsTextTracks = typeof vjs.TEST_VID.textTracks[0]['mode'] !== 'number';
  }
  if (supportsTextTracks && vjs.IS_FIREFOX) {
    supportsTextTracks = false;
  }

  return supportsTextTracks;
};

/**
 * Set the tech's volume control support status
 * @type {Boolean}
 */
vjs.Html5.prototype['featuresVolumeControl'] = vjs.Html5.canControlVolume();

/**
 * Set the tech's playbackRate support status
 * @type {Boolean}
 */
vjs.Html5.prototype['featuresPlaybackRate'] = vjs.Html5.canControlPlaybackRate();

/**
 * Set the tech's status on moving the video element.
 * In iOS, if you move a video element in the DOM, it breaks video playback.
 * @type {Boolean}
 */
vjs.Html5.prototype['movingMediaElementInDOM'] = !vjs.IS_IOS;

/**
 * Set the the tech's fullscreen resize support status.
 * HTML video is able to automatically resize when going to fullscreen.
 * (No longer appears to be used. Can probably be removed.)
 */
vjs.Html5.prototype['featuresFullscreenResize'] = true;

/**
 * Set the tech's progress event support status
 * (this disables the manual progress events of the MediaTechController)
 */
vjs.Html5.prototype['featuresProgressEvents'] = true;

/**
 * Sets the tech's status on native text track support
 * @type {Boolean}
 */
vjs.Html5.prototype['featuresNativeTextTracks'] = vjs.Html5.supportsNativeTextTracks();

// HTML5 Feature detection and Device Fixes --------------------------------- //
(function() {
  var canPlayType,
      mpegurlRE = /^application\/(?:x-|vnd\.apple\.)mpegurl/i,
      mp4RE = /^video\/mp4/i;

  vjs.Html5.patchCanPlayType = function() {
    // Android 4.0 and above can play HLS to some extent but it reports being unable to do so
    if (vjs.ANDROID_VERSION >= 4.0) {
      if (!canPlayType) {
        canPlayType = vjs.TEST_VID.constructor.prototype.canPlayType;
      }

      vjs.TEST_VID.constructor.prototype.canPlayType = function(type) {
        if (type && mpegurlRE.test(type)) {
          return 'maybe';
        }
        return canPlayType.call(this, type);
      };
    }

    // Override Android 2.2 and less canPlayType method which is broken
    if (vjs.IS_OLD_ANDROID) {
      if (!canPlayType) {
        canPlayType = vjs.TEST_VID.constructor.prototype.canPlayType;
      }

      vjs.TEST_VID.constructor.prototype.canPlayType = function(type){
        if (type && mp4RE.test(type)) {
          return 'maybe';
        }
        return canPlayType.call(this, type);
      };
    }
  };

  vjs.Html5.unpatchCanPlayType = function() {
    var r = vjs.TEST_VID.constructor.prototype.canPlayType;
    vjs.TEST_VID.constructor.prototype.canPlayType = canPlayType;
    canPlayType = null;
    return r;
  };

  // by default, patch the video element
  vjs.Html5.patchCanPlayType();
})();

// List of all HTML5 events (various uses).
vjs.Html5.Events = 'loadstart,suspend,abort,error,emptied,stalled,loadedmetadata,loadeddata,canplay,canplaythrough,playing,waiting,seeking,seeked,ended,durationchange,timeupdate,progress,play,pause,ratechange,volumechange'.split(',');

vjs.Html5.disposeMediaElement = function(el){
  if (!el) { return; }

  el['player'] = null;

  if (el.parentNode) {
    el.parentNode.removeChild(el);
  }

  // remove any child track or source nodes to prevent their loading
  while(el.hasChildNodes()) {
    el.removeChild(el.firstChild);
  }

  // remove any src reference. not setting `src=''` because that causes a warning
  // in firefox
  el.removeAttribute('src');

  // force the media element to update its loading state by calling load()
  // however IE on Windows 7N has a bug that throws an error so need a try/catch (#793)
  if (typeof el.load === 'function') {
    // wrapping in an iife so it's not deoptimized (#1060#discussion_r10324473)
    (function() {
      try {
        el.load();
      } catch (e) {
        // not supported
      }
    })();
  }
};
