/**
 * @file flash.js
 * VideoJS-SWF - Custom Flash Player with HTML5-ish API
 * https://github.com/zencoder/video-js-swf
 * Not using setupTriggers. Using global onEvent func to distribute events
 */

import Tech from './tech';
import * as Dom from '../utils/dom.js';
import * as Url from '../utils/url.js';
import { createTimeRange } from '../utils/time-ranges.js';
import FlashRtmpDecorator from './flash-rtmp';
import Component from '../component';
import window from 'global/window';
import assign from 'object.assign';

let navigator = window.navigator;
/**
 * Flash Media Controller - Wrapper for fallback SWF API
 *
 * @param {Object=} options Object of option names and values
 * @param {Function=} ready Ready callback function
 * @extends Tech
 * @class Flash
 */
class Flash extends Tech {

  constructor(options, ready){
    super(options, ready);

    // Set the source when ready
    if (options.source) {
      this.ready(function(){
        this.setSource(options.source);
      }, true);
    }

    // Having issues with Flash reloading on certain page actions (hide/resize/fullscreen) in certain browsers
    // This allows resetting the playhead when we catch the reload
    if (options.startTime) {
      this.ready(function(){
        this.load();
        this.play();
        this.currentTime(options.startTime);
      }, true);
    }

    // Add global window functions that the swf expects
    // A 4.x workflow we weren't able to solve for in 5.0
    // because of the need to hard code these functions
    // into the swf for security reasons
    window.videojs = window.videojs || {};
    window.videojs.Flash = window.videojs.Flash || {};
    window.videojs.Flash.onReady = Flash.onReady;
    window.videojs.Flash.onEvent = Flash.onEvent;
    window.videojs.Flash.onError = Flash.onError;

    this.on('seeked', function() {
      this.lastSeekTarget_ = undefined;
    });
  }

  /**
   * Create the component's DOM element
   *
   * @return {Element}
   * @method createEl
   */
  createEl() {
    let options = this.options_;

    // If video.js is hosted locally you should also set the location
    // for the hosted swf, which should be relative to the page (not video.js)
    // Otherwise this adds a CDN url.
    // The CDN also auto-adds a swf URL for that specific version.
    if (!options.swf) {
      options.swf = '//vjs.zencdn.net/swf/__SWF_VERSION__/video-js.swf';
    }

    // Generate ID for swf object
    let objId = options.techId;

    // Merge default flashvars with ones passed in to init
    let flashVars = assign({

      // SWF Callback Functions
      'readyFunction': 'videojs.Flash.onReady',
      'eventProxyFunction': 'videojs.Flash.onEvent',
      'errorEventProxyFunction': 'videojs.Flash.onError',

      // Player Settings
      'autoplay': options.autoplay,
      'preload': options.preload,
      'loop': options.loop,
      'muted': options.muted

    }, options.flashVars);

    // Merge default parames with ones passed in
    let params = assign({
      'wmode': 'opaque', // Opaque is needed to overlay controls, but can affect playback performance
      'bgcolor': '#000000' // Using bgcolor prevents a white flash when the object is loading
    }, options.params);

    // Merge default attributes with ones passed in
    let attributes = assign({
      'id': objId,
      'name': objId, // Both ID and Name needed or swf to identify itself
      'class': 'vjs-tech'
    }, options.attributes);

    this.el_ = Flash.embed(options.swf, flashVars, params, attributes);
    this.el_.tech = this;

    return this.el_;
  }

  /**
   * Play for flash tech
   *
   * @method play
   */
  play() {
    if (this.ended()) {
      this.setCurrentTime(0);
    }
    this.el_.vjs_play();
  }

  /**
   * Pause for flash tech
   *
   * @method pause
   */
  pause() {
    this.el_.vjs_pause();
  }

  /**
   * Get/set video
   *
   * @param {Object=} src Source object
   * @return {Object}
   * @method src
   */
  src(src) {
    if (src === undefined) {
      return this.currentSrc();
    }

    // Setting src through `src` not `setSrc` will be deprecated
    return this.setSrc(src);
  }

  /**
   * Set video
   *
   * @param {Object=} src Source object
   * @deprecated
   * @method setSrc
   */
  setSrc(src) {
    // Make sure source URL is absolute.
    src = Url.getAbsoluteURL(src);
    this.el_.vjs_src(src);

    // Currently the SWF doesn't autoplay if you load a source later.
    // e.g. Load player w/ no source, wait 2s, set src.
    if (this.autoplay()) {
      var tech = this;
      this.setTimeout(function(){ tech.play(); }, 0);
    }
  }

  /**
   * Returns true if the tech is currently seeking.
   * @return {boolean} true if seeking
   */
  seeking() {
    return this.lastSeekTarget_ !== undefined;
  }

  /**
   * Set current time
   *
   * @param {Number} time Current time of video
   * @method setCurrentTime
   */
  setCurrentTime(time) {
    let seekable = this.seekable();
    if (seekable.length) {
      // clamp to the current seekable range
      time = time > seekable.start(0) ? time : seekable.start(0);
      time = time < seekable.end(seekable.length - 1) ? time : seekable.end(seekable.length - 1);

      this.lastSeekTarget_ = time;
      this.trigger('seeking');
      this.el_.vjs_setProperty('currentTime', time);
      super.setCurrentTime();
    }
  }

  /**
   * Get current time
   *
   * @param {Number=} time Current time of video
   * @return {Number} Current time
   * @method currentTime
   */
  currentTime(time) {
    // when seeking make the reported time keep up with the requested time
    // by reading the time we're seeking to
    if (this.seeking()) {
      return this.lastSeekTarget_ || 0;
    }
    return this.el_.vjs_getProperty('currentTime');
  }

  /**
   * Get current source
   *
   * @method currentSrc
   */
  currentSrc() {
    if (this.currentSource_) {
      return this.currentSource_.src;
    } else {
      return this.el_.vjs_getProperty('currentSrc');
    }
  }

  /**
   * Load media into player
   *
   * @method load
   */
  load() {
    this.el_.vjs_load();
  }

  /**
   * Get poster
   *
   * @method poster
   */
  poster() {
    this.el_.vjs_getProperty('poster');
  }

  /**
   * Poster images are not handled by the Flash tech so make this a no-op
   *
   * @method setPoster
   */
  setPoster() {}

  /**
   * Determine if can seek in media
   *
   * @return {TimeRangeObject}
   * @method seekable
   */
  seekable() {
    const duration = this.duration();
    if (duration === 0) {
      return createTimeRange();
    }
    return createTimeRange(0, duration);
  }

  /**
   * Get buffered time range
   *
   * @return {TimeRangeObject}
   * @method buffered
   */
  buffered() {
    let ranges = this.el_.vjs_getProperty('buffered');
    if (ranges.length === 0) {
      return createTimeRange();
    }
    return createTimeRange(ranges[0][0], ranges[0][1]);
  }

  /**
   * Get fullscreen support -
   * Flash does not allow fullscreen through javascript
   * so always returns false
   *
   * @return {Boolean} false
   * @method supportsFullScreen
   */
  supportsFullScreen() {
    return false; // Flash does not allow fullscreen through javascript
  }

  /**
   * Request to enter fullscreen
   * Flash does not allow fullscreen through javascript
   * so always returns false
   *
   * @return {Boolean} false
   * @method enterFullScreen
   */
  enterFullScreen() {
    return false;
  }

}


// Create setters and getters for attributes
const _api = Flash.prototype;
const _readWrite = 'rtmpConnection,rtmpStream,preload,defaultPlaybackRate,playbackRate,autoplay,loop,mediaGroup,controller,controls,volume,muted,defaultMuted'.split(',');
const _readOnly = 'networkState,readyState,initialTime,duration,startOffsetTime,paused,ended,videoTracks,audioTracks,videoWidth,videoHeight'.split(',');

function _createSetter(attr){
  var attrUpper = attr.charAt(0).toUpperCase() + attr.slice(1);
  _api['set'+attrUpper] = function(val){ return this.el_.vjs_setProperty(attr, val); };
}
function _createGetter(attr) {
  _api[attr] = function(){ return this.el_.vjs_getProperty(attr); };
}

// Create getter and setters for all read/write attributes
for (let i = 0; i < _readWrite.length; i++) {
  _createGetter(_readWrite[i]);
  _createSetter(_readWrite[i]);
}

// Create getters for read-only attributes
for (let i = 0; i < _readOnly.length; i++) {
  _createGetter(_readOnly[i]);
}

/* Flash Support Testing -------------------------------------------------------- */

Flash.isSupported = function(){
  return Flash.version()[0] >= 10;
  // return swfobject.hasFlashPlayerVersion('10');
};

// Add Source Handler pattern functions to this tech
Tech.withSourceHandlers(Flash);

/*
 * The default native source handler.
 * This simply passes the source to the video element. Nothing fancy.
 *
 * @param  {Object} source   The source object
 * @param  {Flash} tech  The instance of the Flash tech
 */
Flash.nativeSourceHandler = {};

/**
 * Check if Flash can play the given videotype
 * @param  {String} type    The mimetype to check
 * @return {String}         'probably', 'maybe', or '' (empty string)
 */
Flash.nativeSourceHandler.canPlayType = function(type){
  if (type in Flash.formats) {
    return 'maybe';
  }

  return '';
};

/*
 * Check Flash can handle the source natively
 *
 * @param  {Object} source  The source object
 * @return {String}         'probably', 'maybe', or '' (empty string)
 */
Flash.nativeSourceHandler.canHandleSource = function(source){
  var type;

  function guessMimeType(src) {
    var ext = Url.getFileExtension(src);
    if (ext) {
      return `video/${ext}`;
    }
    return '';
  }

  if (!source.type) {
    type = guessMimeType(source.src);
  } else {
    // Strip code information from the type because we don't get that specific
    type = source.type.replace(/;.*/, '').toLowerCase();
  }

  return Flash.nativeSourceHandler.canPlayType(type);
};

/*
 * Pass the source to the flash object
 * Adaptive source handlers will have more complicated workflows before passing
 * video data to the video element
 *
 * @param  {Object} source    The source object
 * @param  {Flash} tech   The instance of the Flash tech
 */
Flash.nativeSourceHandler.handleSource = function(source, tech){
  tech.setSrc(source.src);
};

/*
 * Clean up the source handler when disposing the player or switching sources..
 * (no cleanup is needed when supporting the format natively)
 */
Flash.nativeSourceHandler.dispose = function(){};

// Register the native source handler
Flash.registerSourceHandler(Flash.nativeSourceHandler);

Flash.formats = {
  'video/flv': 'FLV',
  'video/x-flv': 'FLV',
  'video/mp4': 'MP4',
  'video/m4v': 'MP4'
};

Flash.onReady = function(currSwf){
  let el = Dom.getEl(currSwf);
  let tech = el && el.tech;

  // if there is no el then the tech has been disposed
  // and the tech element was removed from the player div
  if (tech && tech.el()) {
    // check that the flash object is really ready
    Flash.checkReady(tech);
  }
};

// The SWF isn't always ready when it says it is. Sometimes the API functions still need to be added to the object.
// If it's not ready, we set a timeout to check again shortly.
Flash.checkReady = function(tech){
  // stop worrying if the tech has been disposed
  if (!tech.el()) {
    return;
  }

  // check if API property exists
  if (tech.el().vjs_getProperty) {
    // tell tech it's ready
    tech.triggerReady();
  } else {
    // wait longer
    this.setTimeout(function(){
      Flash['checkReady'](tech);
    }, 50);
  }
};

// Trigger events from the swf on the player
Flash.onEvent = function(swfID, eventName){
  let tech = Dom.getEl(swfID).tech;
  tech.trigger(eventName);
};

// Log errors from the swf
Flash.onError = function(swfID, err){
  const tech = Dom.getEl(swfID).tech;

  // trigger MEDIA_ERR_SRC_NOT_SUPPORTED
  if (err === 'srcnotfound') {
    return tech.error(4);
  }

  // trigger a custom error
  tech.error('FLASH: ' + err);
};

// Flash Version Check
Flash.version = function(){
  let version = '0,0,0';

  // IE
  try {
    version = new window.ActiveXObject('ShockwaveFlash.ShockwaveFlash').GetVariable('$version').replace(/\D+/g, ',').match(/^,?(.+),?$/)[1];

  // other browsers
  } catch(e) {
    try {
      if (navigator.mimeTypes['application/x-shockwave-flash'].enabledPlugin){
        version = (navigator.plugins['Shockwave Flash 2.0'] || navigator.plugins['Shockwave Flash']).description.replace(/\D+/g, ',').match(/^,?(.+),?$/)[1];
      }
    } catch(err) {}
  }
  return version.split(',');
};

// Flash embedding method. Only used in non-iframe mode
Flash.embed = function(swf, flashVars, params, attributes){
  const code = Flash.getEmbedCode(swf, flashVars, params, attributes);

  // Get element by embedding code and retrieving created element
  const obj = Dom.createEl('div', { innerHTML: code }).childNodes[0];

  return obj;
};

Flash.getEmbedCode = function(swf, flashVars, params, attributes){
  const objTag = '<object type="application/x-shockwave-flash" ';
  let flashVarsString = '';
  let paramsString = '';
  let attrsString = '';

  // Convert flash vars to string
  if (flashVars) {
    Object.getOwnPropertyNames(flashVars).forEach(function(key){
      flashVarsString += `${key}=${flashVars[key]}&amp;`;
    });
  }

  // Add swf, flashVars, and other default params
  params = assign({
    'movie': swf,
    'flashvars': flashVarsString,
    'allowScriptAccess': 'always', // Required to talk to swf
    'allowNetworking': 'all' // All should be default, but having security issues.
  }, params);

  // Create param tags string
  Object.getOwnPropertyNames(params).forEach(function(key){
    paramsString += `<param name="${key}" value="${params[key]}" />`;
  });

  attributes = assign({
    // Add swf to attributes (need both for IE and Others to work)
    'data': swf,

    // Default to 100% width/height
    'width': '100%',
    'height': '100%'

  }, attributes);

  // Create Attributes string
  Object.getOwnPropertyNames(attributes).forEach(function(key){
    attrsString += `${key}="${attributes[key]}" `;
  });

  return `${objTag}${attrsString}>${paramsString}</object>`;
};

// Run Flash through the RTMP decorator
FlashRtmpDecorator(Flash);

Component.registerComponent('Flash', Flash);
Tech.registerTech('Flash', Flash);
export default Flash;
