/**
 * @fileoverview Main function src.
 */

// HTML5 Shiv. Must be in <head> to support older browsers.
document.createElement('video');
document.createElement('audio');
document.createElement('track');

/**
 * Doubles as the main function for users to create a player instance and also
 * the main library object.
 *
 * **ALIASES** videojs, _V_ (deprecated)
 *
 * The `vjs` function can be used to initialize or retrieve a player.
 *
 *     var myPlayer = vjs('my_video_id');
 *
 * @param  {String|Element} id      Video element or video element ID
 * @param  {Object=} options        Optional options object for config/settings
 * @param  {Function=} ready        Optional ready callback
 * @return {vjs.Player}             A player instance
 * @namespace
 */
var vjs = function(id, options, ready){
  var tag; // Element of ID

  // Allow for element or ID to be passed in
  // String ID
  if (typeof id === 'string') {

    // Adjust for jQuery ID syntax
    if (id.indexOf('#') === 0) {
      id = id.slice(1);
    }

    // If a player instance has already been created for this ID return it.
    if (vjs.players[id]) {
      return vjs.players[id];

    // Otherwise get element for ID
    } else {
      tag = vjs.el(id);
    }

  // ID is a media element
  } else {
    tag = id;
  }

  // Check for a useable element
  if (!tag || !tag.nodeName) { // re: nodeName, could be a box div also
    throw new TypeError('The element or ID supplied is not valid. (videojs)'); // Returns
  }

  // Element may have a player attr referring to an already created player instance.
  // If not, set up a new player and return the instance.
  return tag['player'] || new vjs.Player(tag, options, ready);
};

// Extended name, also available externally, window.videojs
var videojs = window['videojs'] = vjs;

// CDN Version. Used to target right flash swf.
vjs.CDN_VERSION = 'GENERATED_CDN_VSN';
vjs.ACCESS_PROTOCOL = ('https:' == document.location.protocol ? 'https://' : 'http://');

/**
 * Global Player instance options, surfaced from vjs.Player.prototype.options_
 * vjs.options = vjs.Player.prototype.options_
 * All options should use string keys so they avoid
 * renaming by closure compiler
 * @type {Object}
 */
vjs.options = {
  // Default order of fallback technology
  'techOrder': ['html5','flash'],
  // techOrder: ['flash','html5'],

  'html5': {},
  'flash': {},

  // Default of web browser is 300x150. Should rely on source width/height.
  'width': 300,
  'height': 150,
  // defaultVolume: 0.85,
  'defaultVolume': 0.00, // The freakin seaguls are driving me crazy!

  // default playback rates
  'playbackRates': [],
  // Add playback rate selection by adding rates
  // 'playbackRates': [0.5, 1, 1.5, 2],

  // default inactivity timeout
  'inactivityTimeout': 2000,

  // Included control sets
  'children': {
    'mediaLoader': {},
    'posterImage': {},
    'textTrackDisplay': {},
    'loadingSpinner': {},
    'bigPlayButton': {},
    'controlBar': {},
    'errorDisplay': {}
  },

  'language': document.getElementsByTagName('html')[0].getAttribute('lang') || navigator.languages && navigator.languages[0] || navigator.userLanguage || navigator.language || 'en',

  // locales and their language translations
  'languages': {},

  // Default message to show when a video cannot be played.
  'notSupportedMessage': 'No compatible source was found for this video.'
};

// Set CDN Version of swf
// The added (+) blocks the replace from changing this GENERATED_CDN_VSN string
if (vjs.CDN_VERSION !== 'GENERATED'+'_CDN_VSN') {
  videojs.options['flash']['swf'] = vjs.ACCESS_PROTOCOL + 'vjs.zencdn.net/'+vjs.CDN_VERSION+'/video-js.swf';
}

/**
 * Utility function for adding languages to the default options. Useful for
 * amending multiple language support at runtime.
 *
 * Example: vjs.addLanguage('es', {'Hello':'Hola'});
 *
 * @param  {String} code The language code or dictionary property
 * @param  {Object} data The data values to be translated
 * @return {Object} The resulting global languages dictionary object
 */
vjs.addLanguage = function(code, data){
  if(vjs.options['languages'][code] !== undefined) {
    vjs.options['languages'][code] = vjs.util.mergeOptions(vjs.options['languages'][code], data);
  } else {
    vjs.options['languages'][code] = data;
  }
  return vjs.options['languages'];
};

/**
 * Global player list
 * @type {Object}
 */
vjs.players = {};

/*!
 * Custom Universal Module Definition (UMD)
 *
 * Video.js will never be a non-browser lib so we can simplify UMD a bunch and
 * still support requirejs and browserify. This also needs to be closure
 * compiler compatible, so string keys are used.
 */
if (typeof define === 'function' && define['amd']) {
  define([], function(){ return videojs; });

// checking that module is an object too because of umdjs/umd#35
} else if (typeof exports === 'object' && typeof module === 'object') {
  module['exports'] = videojs;
}
