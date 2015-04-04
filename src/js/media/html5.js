/**
 * @fileoverview HTML5 Media Controller - Wrapper for HTML5 Media API
 */

import MediaTechController from './media';
import Component from '../component';
import * as Lib from '../lib';
import * as VjsUtil from '../util';
import document from 'global/document';

/**
 * HTML5 Media Controller - Wrapper for HTML5 Media API
 * @param {vjs.Player|Object} player
 * @param {Object=} options
 * @param {Function=} ready
 * @constructor
 */
var Html5 = MediaTechController.extend({
  /** @constructor */
  init: function(player, options, ready){
    if (options['nativeCaptions'] === false || options['nativeTextTracks'] === false) {
      this['featuresNativeTextTracks'] = false;
    }

    MediaTechController.call(this, player, options, ready);

    this.setupTriggers();

    const source = options['source'];

    // Set the source if one is provided
    // 1) Check if the source is new (if not, we want to keep the original so playback isn't interrupted)
    // 2) Check to see if the network state of the tag was failed at init, and if so, reset the source
    // anyway so the error gets fired.
    if (source && (this.el_.currentSrc !== source.src || (player.tag && player.tag.initNetworkState_ === 3))) {
      this.setSource(source);
    }

    if (this.el_.hasChildNodes()) {

      let nodes = this.el_.childNodes;
      let nodesLength = nodes.length;
      let removeNodes = [];

      while (nodesLength--) {
        let node = nodes[nodesLength];
        let nodeName = node.nodeName.toLowerCase();
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

      for (let i=0; i<removeNodes.length; i++) {
        this.el_.removeChild(removeNodes[i]);
      }
    }

    if (this['featuresNativeTextTracks']) {
      this.on('loadstart', Lib.bind(this, this.hideCaptions));
    }

    // Determine if native controls should be used
    // Our goal should be to get the custom controls on mobile solid everywhere
    // so we can remove this all together. Right now this will block custom
    // controls on touch enabled laptops like the Chrome Pixel
    if (Lib.TOUCH_ENABLED && player.options()['nativeControlsForTouch'] === true) {
      this.useNativeControls();
    }

    // Chrome and Safari both have issues with autoplay.
    // In Safari (5.1.1), when we move the video element into the container div, autoplay doesn't work.
    // In Chrome (15), if you have autoplay + a poster + no controls, the video gets hidden (but audio plays)
    // This fixes both issues. Need to wait for API, so it updates displays correctly
    player.ready(function(){
      if (this.tag && this.options_['autoplay'] && this.paused()) {
        delete this.tag['poster']; // Chrome Fix. Fixed in Chrome v16.
        this.play();
      }
    });

    this.triggerReady();
  }
});

Component.registerComponent('Html5', Html5);

Html5.prototype.dispose = function(){
  Html5.disposeMediaElement(this.el_);
  MediaTechController.prototype.dispose.call(this);
};

Html5.prototype.createEl = function(){
  let player = this.player_;
  let el = player.tag;

  // Check if this browser supports moving the element into the box.
  // On the iPhone video will break if you move the element,
  // So we have to create a brand new element.
  if (!el || this['movingMediaElementInDOM'] === false) {

    // If the original tag is still there, clone and remove it.
    if (el) {
      const clone = el.cloneNode(false);
      Html5.disposeMediaElement(el);
      el = clone;
      player.tag = null;
    } else {
      el = Lib.createEl('video');

      // determine if native controls should be used
      let attributes = VjsUtil.mergeOptions({}, player.tagAttributes);
      if (!Lib.TOUCH_ENABLED || player.options()['nativeControlsForTouch'] !== true) {
        delete attributes.controls;
      }

      Lib.setElementAttributes(el,
        Lib.obj.merge(attributes, {
          id: player.id() + '_html5_api',
          class: 'vjs-tech'
        })
      );
    }
    // associate the player with the new tag
    el['player'] = player;

    if (player.options_.tracks) {
      for (let i = 0; i < player.options_.tracks.length; i++) {
        const track = player.options_.tracks[i];
        let trackEl = document.createElement('track');
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

    Lib.insertFirst(el, player.el());
  }

  // Update specific tag settings, in case they were overridden
  let settingsAttrs = ['autoplay','preload','loop','muted'];
  for (let i = settingsAttrs.length - 1; i >= 0; i--) {
    const attr = settingsAttrs[i];
    let overwriteAttrs = {};
    if (typeof player.options_[attr] !== 'undefined') {
      overwriteAttrs[attr] = player.options_[attr];
    }
    Lib.setElementAttributes(el, overwriteAttrs);
  }

  return el;
  // jenniisawesome = true;
};


Html5.prototype.hideCaptions = function() {
  let tracks = this.el_.querySelectorAll('track');
  let i = tracks.length;
  const kinds = {
    'captions': 1,
    'subtitles': 1
  };

  while (i--) {
    let track = tracks[i].track;
    if ((track && track['kind'] in kinds) &&
        (!tracks[i]['default'])) {
      track.mode = 'disabled';
    }
  }
};

// Make video events trigger player events
// May seem verbose here, but makes other APIs possible.
// Triggers removed using this.off when disposed
Html5.prototype.setupTriggers = function(){
  for (let i = Html5.Events.length - 1; i >= 0; i--) {
    this.on(Html5.Events[i], this.eventHandler);
  }
};

Html5.prototype.eventHandler = function(evt){
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

Html5.prototype.useNativeControls = function(){
  let tech = this;
  let player = this.player();

  // If the player controls are enabled turn on the native controls
  tech.setControls(player.controls());

  // Update the native controls when player controls state is updated
  let controlsOn = function(){
    tech.setControls(true);
  };
  let controlsOff = function(){
    tech.setControls(false);
  };
  player.on('controlsenabled', controlsOn);
  player.on('controlsdisabled', controlsOff);

  // Clean up when not using native controls anymore
  let cleanUp = function(){
    player.off('controlsenabled', controlsOn);
    player.off('controlsdisabled', controlsOff);
  };
  tech.on('dispose', cleanUp);
  player.on('usingcustomcontrols', cleanUp);

  // Update the state of the player to using native controls
  player.usingNativeControls(true);
};


Html5.prototype.play = function(){ this.el_.play(); };
Html5.prototype.pause = function(){ this.el_.pause(); };
Html5.prototype.paused = function(){ return this.el_.paused; };

Html5.prototype.currentTime = function(){ return this.el_.currentTime; };
Html5.prototype.setCurrentTime = function(seconds){
  try {
    this.el_.currentTime = seconds;
  } catch(e) {
    Lib.log(e, 'Video is not ready. (Video.js)');
    // this.warning(VideoJS.warnings.videoNotReady);
  }
};

Html5.prototype.duration = function(){ return this.el_.duration || 0; };
Html5.prototype.buffered = function(){ return this.el_.buffered; };

Html5.prototype.volume = function(){ return this.el_.volume; };
Html5.prototype.setVolume = function(percentAsDecimal){ this.el_.volume = percentAsDecimal; };
Html5.prototype.muted = function(){ return this.el_.muted; };
Html5.prototype.setMuted = function(muted){ this.el_.muted = muted; };

Html5.prototype.width = function(){ return this.el_.offsetWidth; };
Html5.prototype.height = function(){ return this.el_.offsetHeight; };

Html5.prototype.supportsFullScreen = function(){
  if (typeof this.el_.webkitEnterFullScreen == 'function') {

    // Seems to be broken in Chromium/Chrome && Safari in Leopard
    if (/Android/.test(Lib.USER_AGENT) || !/Chrome|Mac OS X 10.5/.test(Lib.USER_AGENT)) {
      return true;
    }
  }
  return false;
};

Html5.prototype.enterFullScreen = function(){
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

Html5.prototype.exitFullScreen = function(){
  this.el_.webkitExitFullScreen();
};


Html5.prototype.src = function(src) {
  if (src === undefined) {
    return this.el_.src;
  } else {
    // Setting src through `src` instead of `setSrc` will be deprecated
    this.setSrc(src);
  }
};

Html5.prototype.setSrc = function(src) {
  this.el_.src = src;
};

Html5.prototype.load = function(){ this.el_.load(); };
Html5.prototype.currentSrc = function(){ return this.el_.currentSrc; };

Html5.prototype.poster = function(){ return this.el_.poster; };
Html5.prototype.setPoster = function(val){ this.el_.poster = val; };

Html5.prototype.preload = function(){ return this.el_.preload; };
Html5.prototype.setPreload = function(val){ this.el_.preload = val; };

Html5.prototype.autoplay = function(){ return this.el_.autoplay; };
Html5.prototype.setAutoplay = function(val){ this.el_.autoplay = val; };

Html5.prototype.controls = function(){ return this.el_.controls; };
Html5.prototype.setControls = function(val){ this.el_.controls = !!val; };

Html5.prototype.loop = function(){ return this.el_.loop; };
Html5.prototype.setLoop = function(val){ this.el_.loop = val; };

Html5.prototype.error = function(){ return this.el_.error; };
Html5.prototype.seeking = function(){ return this.el_.seeking; };
Html5.prototype.ended = function(){ return this.el_.ended; };
Html5.prototype.defaultMuted = function(){ return this.el_.defaultMuted; };

Html5.prototype.playbackRate = function(){ return this.el_.playbackRate; };
Html5.prototype.setPlaybackRate = function(val){ this.el_.playbackRate = val; };

Html5.prototype.networkState = function(){ return this.el_.networkState; };
Html5.prototype.readyState = function(){ return this.el_.readyState; };

Html5.prototype.textTracks = function() {
  if (!this['featuresNativeTextTracks']) {
    return MediaTechController.prototype.textTracks.call(this);
  }

  return this.el_.textTracks;
};
Html5.prototype.addTextTrack = function(kind, label, language) {
  if (!this['featuresNativeTextTracks']) {
    return MediaTechController.prototype.addTextTrack.call(this, kind, label, language);
  }

  return this.el_.addTextTrack(kind, label, language);
};

Html5.prototype.addRemoteTextTrack = function(options) {
  if (!this['featuresNativeTextTracks']) {
    return MediaTechController.prototype.addRemoteTextTrack.call(this, options);
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

Html5.prototype.removeRemoteTextTrack = function(track) {
  if (!this['featuresNativeTextTracks']) {
    return MediaTechController.prototype.removeRemoteTextTrack.call(this, track);
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
Html5.isSupported = function(){
  // IE9 with no Media Player is a LIAR! (#984)
  try {
    Lib.TEST_VID['volume'] = 0.5;
  } catch (e) {
    return false;
  }

  return !!Lib.TEST_VID.canPlayType;
};

// Add Source Handler pattern functions to this tech
MediaTechController.withSourceHandlers(Html5);

/**
 * The default native source handler.
 * This simply passes the source to the video element. Nothing fancy.
 * @param  {Object} source   The source object
 * @param  {vjs.Html5} tech  The instance of the HTML5 tech
 */
Html5.nativeSourceHandler = {};

/**
 * Check if the video element can handle the source natively
 * @param  {Object} source  The source object
 * @return {String}         'probably', 'maybe', or '' (empty string)
 */
Html5.nativeSourceHandler.canHandleSource = function(source){
  var match, ext;

  function canPlayType(type){
    // IE9 on Windows 7 without MediaPlayer throws an error here
    // https://github.com/videojs/video.js/issues/519
    try {
      return Lib.TEST_VID.canPlayType(type);
    } catch(e) {
      return '';
    }
  }

  // If a type was provided we should rely on that
  if (source.type) {
    return canPlayType(source.type);
  } else if (source.src) {
    // If no type, fall back to checking 'video/[EXTENSION]'
    ext = Lib.getFileExtension(source.src);

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
Html5.nativeSourceHandler.handleSource = function(source, tech){
  tech.setSrc(source.src);
};

/**
 * Clean up the source handler when disposing the player or switching sources..
 * (no cleanup is needed when supporting the format natively)
 */
Html5.nativeSourceHandler.dispose = function(){};

// Register the native source handler
Html5.registerSourceHandler(Html5.nativeSourceHandler);

/**
 * Check if the volume can be changed in this browser/device.
 * Volume cannot be changed in a lot of mobile devices.
 * Specifically, it can't be changed from 1 on iOS.
 * @return {Boolean}
 */
Html5.canControlVolume = function(){
  var volume =  Lib.TEST_VID.volume;
  Lib.TEST_VID.volume = (volume / 2) + 0.1;
  return volume !== Lib.TEST_VID.volume;
};

/**
 * Check if playbackRate is supported in this browser/device.
 * @return {[type]} [description]
 */
Html5.canControlPlaybackRate = function(){
  var playbackRate =  Lib.TEST_VID.playbackRate;
  Lib.TEST_VID.playbackRate = (playbackRate / 2) + 0.1;
  return playbackRate !== Lib.TEST_VID.playbackRate;
};

/**
 * Check to see if native text tracks are supported by this browser/device
 * @return {Boolean}
 */
Html5.supportsNativeTextTracks = function() {
  var supportsTextTracks;

  // Figure out native text track support
  // If mode is a number, we cannot change it because it'll disappear from view.
  // Browsers with numeric modes include IE10 and older (<=2013) samsung android models.
  // Firefox isn't playing nice either with modifying the mode
  // TODO: Investigate firefox: https://github.com/videojs/video.js/issues/1862
  supportsTextTracks = !!Lib.TEST_VID.textTracks;
  if (supportsTextTracks && Lib.TEST_VID.textTracks.length > 0) {
    supportsTextTracks = typeof Lib.TEST_VID.textTracks[0]['mode'] !== 'number';
  }
  if (supportsTextTracks && Lib.IS_FIREFOX) {
    supportsTextTracks = false;
  }

  return supportsTextTracks;
};

/**
 * Set the tech's volume control support status
 * @type {Boolean}
 */
Html5.prototype['featuresVolumeControl'] = Html5.canControlVolume();

/**
 * Set the tech's playbackRate support status
 * @type {Boolean}
 */
Html5.prototype['featuresPlaybackRate'] = Html5.canControlPlaybackRate();

/**
 * Set the tech's status on moving the video element.
 * In iOS, if you move a video element in the DOM, it breaks video playback.
 * @type {Boolean}
 */
Html5.prototype['movingMediaElementInDOM'] = !Lib.IS_IOS;

/**
 * Set the the tech's fullscreen resize support status.
 * HTML video is able to automatically resize when going to fullscreen.
 * (No longer appears to be used. Can probably be removed.)
 */
Html5.prototype['featuresFullscreenResize'] = true;

/**
 * Set the tech's progress event support status
 * (this disables the manual progress events of the MediaTechController)
 */
Html5.prototype['featuresProgressEvents'] = true;

/**
 * Sets the tech's status on native text track support
 * @type {Boolean}
 */
Html5.prototype['featuresNativeTextTracks'] = Html5.supportsNativeTextTracks();

// HTML5 Feature detection and Device Fixes --------------------------------- //
let canPlayType;
const mpegurlRE = /^application\/(?:x-|vnd\.apple\.)mpegurl/i;
const mp4RE = /^video\/mp4/i;

Html5.patchCanPlayType = function() {
  // Android 4.0 and above can play HLS to some extent but it reports being unable to do so
  if (Lib.ANDROID_VERSION >= 4.0) {
    if (!canPlayType) {
      canPlayType = Lib.TEST_VID.constructor.prototype.canPlayType;
    }

    Lib.TEST_VID.constructor.prototype.canPlayType = function(type) {
      if (type && mpegurlRE.test(type)) {
        return 'maybe';
      }
      return canPlayType.call(this, type);
    };
  }

  // Override Android 2.2 and less canPlayType method which is broken
  if (Lib.IS_OLD_ANDROID) {
    if (!canPlayType) {
      canPlayType = Lib.TEST_VID.constructor.prototype.canPlayType;
    }

    Lib.TEST_VID.constructor.prototype.canPlayType = function(type){
      if (type && mp4RE.test(type)) {
        return 'maybe';
      }
      return canPlayType.call(this, type);
    };
  }
};

Html5.unpatchCanPlayType = function() {
  var r = Lib.TEST_VID.constructor.prototype.canPlayType;
  Lib.TEST_VID.constructor.prototype.canPlayType = canPlayType;
  canPlayType = null;
  return r;
};

// by default, patch the video element
Html5.patchCanPlayType();

// List of all HTML5 events (various uses).
Html5.Events = 'loadstart,suspend,abort,error,emptied,stalled,loadedmetadata,loadeddata,canplay,canplaythrough,playing,waiting,seeking,seeked,ended,durationchange,timeupdate,progress,play,pause,ratechange,volumechange'.split(',');

Html5.disposeMediaElement = function(el){
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

export default Html5;
