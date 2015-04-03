/**
 * @fileoverview VideoJS-SWF - Custom Flash Player with HTML5-ish API
 * https://github.com/zencoder/video-js-swf
 * Not using setupTriggers. Using global onEvent func to distribute events
 */

import MediaTechController from './media';
import * as Lib from '../lib';
import FlashRtmpDecorator from './flash-rtmp';
import Component from '../component';
import window from 'global/window';
let navigator = window.navigator;

/**
 * Flash Media Controller - Wrapper for fallback SWF API
 *
 * @param {vjs.Player} player
 * @param {Object=} options
 * @param {Function=} ready
 * @constructor
 */
var Flash = MediaTechController.extend({
  /** @constructor */
  init: function(player, options, ready){
    MediaTechController.call(this, player, options, ready);

    let { source, parentEl } = options;

    // Create a temporary element to be replaced by swf object
    let placeHolder = this.el_ = Lib.createEl('div', { id: player.id() + '_temp_flash' });

    // Generate ID for swf object
    let objId = player.id()+'_flash_api';

    // Store player options in local var for optimization
    // TODO: switch to using player methods instead of options
    // e.g. player.autoplay();
    let playerOptions = player.options_;

    // Merge default flashvars with ones passed in to init
    let flashVars = Lib.obj.merge({

      // SWF Callback Functions
      'readyFunction': 'videojs.Flash.onReady',
      'eventProxyFunction': 'videojs.Flash.onEvent',
      'errorEventProxyFunction': 'videojs.Flash.onError',

      // Player Settings
      'autoplay': playerOptions.autoplay,
      'preload': playerOptions.preload,
      'loop': playerOptions.loop,
      'muted': playerOptions.muted

    }, options['flashVars']);

    // Merge default parames with ones passed in
    let params = Lib.obj.merge({
      'wmode': 'opaque', // Opaque is needed to overlay controls, but can affect playback performance
      'bgcolor': '#000000' // Using bgcolor prevents a white flash when the object is loading
    }, options['params']);

    // Merge default attributes with ones passed in
    let attributes = Lib.obj.merge({
      'id': objId,
      'name': objId, // Both ID and Name needed or swf to identify itself
      'class': 'vjs-tech'
    }, options['attributes']);

    // If source was supplied pass as a flash var.
    if (source) {
      this.ready(function(){
        this.setSource(source);
      });
    }

    // Add placeholder to player div
    Lib.insertFirst(placeHolder, parentEl);

    // Having issues with Flash reloading on certain page actions (hide/resize/fullscreen) in certain browsers
    // This allows resetting the playhead when we catch the reload
    if (options['startTime']) {
      this.ready(function(){
        this.load();
        this.play();
        this['currentTime'](options['startTime']);
      });
    }

    // firefox doesn't bubble mousemove events to parent. videojs/video-js-swf#37
    // bugzilla bug: https://bugzilla.mozilla.org/show_bug.cgi?id=836786
    if (Lib.IS_FIREFOX) {
      this.ready(function(){
        this.on('mousemove', function(){
          // since it's a custom event, don't bubble higher than the player
          this.player().trigger({ 'type':'mousemove', 'bubbles': false });
        });
      });
    }

    // native click events on the SWF aren't triggered on IE11, Win8.1RT
    // use stageclick events triggered from inside the SWF instead
    player.on('stageclick', player.reportUserActivity);

    this.el_ = Flash.embed(options['swf'], placeHolder, flashVars, params, attributes);
  }
});

Component.registerComponent('Flash', Flash);

Flash.prototype.dispose = function(){
  MediaTechController.prototype.dispose.call(this);
};

Flash.prototype.play = function(){
  this.el_.vjs_play();
};

Flash.prototype.pause = function(){
  this.el_.vjs_pause();
};

Flash.prototype.src = function(src){
  if (src === undefined) {
    return this['currentSrc']();
  }

  // Setting src through `src` not `setSrc` will be deprecated
  return this.setSrc(src);
};

Flash.prototype.setSrc = function(src){
  // Make sure source URL is absolute.
  src = Lib.getAbsoluteURL(src);
  this.el_.vjs_src(src);

  // Currently the SWF doesn't autoplay if you load a source later.
  // e.g. Load player w/ no source, wait 2s, set src.
  if (this.player_.autoplay()) {
    var tech = this;
    this.setTimeout(function(){ tech.play(); }, 0);
  }
};

Flash.prototype['setCurrentTime'] = function(time){
  this.lastSeekTarget_ = time;
  this.el_.vjs_setProperty('currentTime', time);
  MediaTechController.prototype.setCurrentTime.call(this);
};

Flash.prototype['currentTime'] = function(time){
  // when seeking make the reported time keep up with the requested time
  // by reading the time we're seeking to
  if (this.seeking()) {
    return this.lastSeekTarget_ || 0;
  }
  return this.el_.vjs_getProperty('currentTime');
};

Flash.prototype['currentSrc'] = function(){
  if (this.currentSource_) {
    return this.currentSource_.src;
  } else {
    return this.el_.vjs_getProperty('currentSrc');
  }
};

Flash.prototype.load = function(){
  this.el_.vjs_load();
};

Flash.prototype.poster = function(){
  this.el_.vjs_getProperty('poster');
};
Flash.prototype['setPoster'] = function(){
  // poster images are not handled by the Flash tech so make this a no-op
};

Flash.prototype.buffered = function(){
  return Lib.createTimeRange(0, this.el_.vjs_getProperty('buffered'));
};

Flash.prototype.supportsFullScreen = function(){
  return false; // Flash does not allow fullscreen through javascript
};

Flash.prototype.enterFullScreen = function(){
  return false;
};

// Create setters and getters for attributes
const _api = Flash.prototype;
const _readWrite = 'rtmpConnection,rtmpStream,preload,defaultPlaybackRate,playbackRate,autoplay,loop,mediaGroup,controller,controls,volume,muted,defaultMuted'.split(',');
const _readOnly = 'error,networkState,readyState,seeking,initialTime,duration,startOffsetTime,paused,played,seekable,ended,videoTracks,audioTracks,videoWidth,videoHeight'.split(',');

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
MediaTechController.withSourceHandlers(Flash);

/**
 * The default native source handler.
 * This simply passes the source to the video element. Nothing fancy.
 * @param  {Object} source   The source object
 * @param  {vjs.Flash} tech  The instance of the Flash tech
 */
Flash.nativeSourceHandler = {};

/**
 * Check Flash can handle the source natively
 * @param  {Object} source  The source object
 * @return {String}         'probably', 'maybe', or '' (empty string)
 */
Flash.nativeSourceHandler.canHandleSource = function(source){
  var type;

  function guessMimeType(src) {
    var ext = Lib.getFileExtension(src);
    if (ext) {
      return 'video/' + ext;
    }
    return '';
  }

  if (!source.type) {
    type = guessMimeType(source.src);
  } else {
    // Strip code information from the type because we don't get that specific
    type = source.type.replace(/;.*/, '').toLowerCase();
  }

  if (type in Flash.formats) {
    return 'maybe';
  }

  return '';
};

/**
 * Pass the source to the flash object
 * Adaptive source handlers will have more complicated workflows before passing
 * video data to the video element
 * @param  {Object} source    The source object
 * @param  {vjs.Flash} tech   The instance of the Flash tech
 */
Flash.nativeSourceHandler.handleSource = function(source, tech){
  tech.setSrc(source.src);
};

/**
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

Flash['onReady'] = function(currSwf){
  let el = Lib.el(currSwf);

  // get player from the player div property
  const player = el && el.parentNode && el.parentNode['player'];

  // if there is no el or player then the tech has been disposed
  // and the tech element was removed from the player div
  if (player) {
    // reference player on tech element
    el['player'] = player;
    // check that the flash object is really ready
    Flash['checkReady'](player.tech);
  }
};

// The SWF isn't always ready when it says it is. Sometimes the API functions still need to be added to the object.
// If it's not ready, we set a timeout to check again shortly.
Flash['checkReady'] = function(tech){
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
Flash['onEvent'] = function(swfID, eventName){
  let player = Lib.el(swfID)['player'];
  player.trigger(eventName);
};

// Log errors from the swf
Flash['onError'] = function(swfID, err){
  const player = Lib.el(swfID)['player'];
  const msg = 'FLASH: '+err;

  if (err == 'srcnotfound') {
    player.error({ code: 4, message: msg });

  // errors we haven't categorized into the media errors
  } else {
    player.error(msg);
  }
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
Flash.embed = function(swf, placeHolder, flashVars, params, attributes){
  const code = Flash.getEmbedCode(swf, flashVars, params, attributes);

  // Get element by embedding code and retrieving created element
  const obj = Lib.createEl('div', { innerHTML: code }).childNodes[0];

  const par = placeHolder.parentNode;

  placeHolder.parentNode.replaceChild(obj, placeHolder);
  return obj;
};

Flash.getEmbedCode = function(swf, flashVars, params, attributes){
  const objTag = '<object type="application/x-shockwave-flash" ';
  let flashVarsString = '';
  let paramsString = '';
  let attrsString = '';

  // Convert flash vars to string
  if (flashVars) {
    Lib.obj.each(flashVars, function(key, val){
      flashVarsString += (key + '=' + val + '&amp;');
    });
  }

  // Add swf, flashVars, and other default params
  params = Lib.obj.merge({
    'movie': swf,
    'flashvars': flashVarsString,
    'allowScriptAccess': 'always', // Required to talk to swf
    'allowNetworking': 'all' // All should be default, but having security issues.
  }, params);

  // Create param tags string
  Lib.obj.each(params, function(key, val){
    paramsString += '<param name="'+key+'" value="'+val+'" />';
  });

  attributes = Lib.obj.merge({
    // Add swf to attributes (need both for IE and Others to work)
    'data': swf,

    // Default to 100% width/height
    'width': '100%',
    'height': '100%'

  }, attributes);

  // Create Attributes string
  Lib.obj.each(attributes, function(key, val){
    attrsString += (key + '="' + val + '" ');
  });

  return objTag + attrsString + '>' + paramsString + '</object>';
};

// Run Flash through the RTMP decorator
FlashRtmpDecorator(Flash);

export default Flash;
