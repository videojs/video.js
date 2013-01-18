/**
 * @fileoverview Main function src.
 */

goog.provide('vjs');
goog.provide('videojs');

// HTML5 Shiv. Must be in <head> to support older browsers.
document.createElement('video');document.createElement('audio');

/**
 * Doubles as the main function for users to create a player instance and also
 * the main library object.
 *
 * @param  {String|Element} id      Video element or video element ID
 * @param  {Object=} options        Optional options object for config/settings
 * @param  {Function=} ready        Optional ready callback
 * @return {vjs.Player}             A player instance
 */
vjs = function(id, options, ready){
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
var videojs = vjs;

// CDN Version. Used to target right flash swf.
vjs.cdn_version = 'GENERATED_CDN_VSN';
vjs.access_protocol = ('https:' == document.location.protocol ? 'https://' : 'http://');

/**
 * Global Player instance options
 * @type {Object}
 */
// var vjs = videojs;

vjs.options = {
  // Default order of fallback technology
  'techOrder': ['html5','flash'],
  // techOrder: ['flash','html5'],

  'html5': {},
  'flash': { swf: vjs.access_protocol + 'vjs.zencdn.net/c/video-js.swf' },

  // Default of web browser is 300x150. Should rely on source width/height.
  'width': 300,
  'height': 150,

  // defaultVolume: 0.85,
  'defaultVolume': 0.00, // The freakin seaguls are driving me crazy!

  // Included control sets
  'children': {
    'mediaLoader': {},
    'posterImage': {},
    'textTrackDisplay': {},
    'loadingSpinner': {},
    'bigPlayButton': {},
    'controlBar': {}
  }
};

/**
 * Global player list
 * @type {Object}
 */
vjs.players = {};


// Set CDN Version of swf
if (vjs.cdn_version != 'GENERATED_CDN_VSN') {
  videojs.options['flash']['swf'] = vjs.access_protocol + 'vjs.zencdn.net/'+vjs.cdn_version+'/video-js.swf';
}
