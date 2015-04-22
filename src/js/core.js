/**
 * @fileoverview Main function src.
 */

import Player from './player';
import Plugins from './plugins';
import Options from './options';
import * as Lib from './lib';
import * as VjsUtil from './util';
import CoreObject from './core-object';
import document from 'global/document';

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
 * @return {Player}             A player instance
 * @namespace
 */
var videojs = function(id, options, ready){
  var tag; // Element of ID

  // Allow for element or ID to be passed in
  // String ID
  if (typeof id === 'string') {

    // Adjust for jQuery ID syntax
    if (id.indexOf('#') === 0) {
      id = id.slice(1);
    }

    // If a player instance has already been created for this ID return it.
    if (Player.players[id]) {

      // If options or ready funtion are passed, warn
      if (options) {
        Lib.log.warn(`Player "${id}" is already initialised. Options will not be applied.`);
      }

      if (ready) {
        Player.players[id].ready(ready);
      }

      return Player.players[id];

    // Otherwise get element for ID
    } else {
      tag = Lib.el(id);
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
  return tag['player'] || new Player(tag, options, ready);
};

// Extended name, also available externally, window.videojs
// var videojs = window['videojs'] = vjs;

// CDN Version. Used to target right flash swf.
videojs.CDN_VERSION = '__VERSION_NO_PATCH__';
videojs.ACCESS_PROTOCOL = ('https:' == document.location.protocol ? 'https://' : 'http://');

/**
* Full player version
* @type {string}
*/
videojs['VERSION'] = '__VERSION__';

// Set CDN Version of swf
// The added (+) blocks the replace from changing this _VERSION_NO_PATCH_ string
if (videojs.CDN_VERSION !== '__VERSION_'+'NO_PATCH__') {
  Options['flash']['swf'] = `${videojs.ACCESS_PROTOCOL}vjs.zencdn.net/${videojs.CDN_VERSION}/video-js.swf`;
}

/**
 * Utility function for adding languages to the default options. Useful for
 * amending multiple language support at runtime.
 *
 * Example: videojs.addLanguage('es', {'Hello':'Hola'});
 *
 * @param  {String} code The language code or dictionary property
 * @param  {Object} data The data values to be translated
 * @return {Object} The resulting global languages dictionary object
 */
videojs.addLanguage = function(code, data){
  if(Options['languages'][code] !== undefined) {
    Options['languages'][code] = VjsUtil.mergeOptions(Options['languages'][code], data);
  } else {
    Options['languages'][code] = data;
  }
  return Options['languages'];
};

/**
 * Custom Universal Module Definition (UMD)
 *
 * Video.js will never be a non-browser lib so we can simplify UMD a bunch and
 * still support requirejs and browserify. This also needs to be closure
 * compiler compatible, so string keys are used.
 */
if (typeof define === 'function' && define['amd']) {
  define('videojs', [], function(){ return videojs; });

// checking that module is an object too because of umdjs/umd#35
} else if (typeof exports === 'object' && typeof module === 'object') {
  module['exports'] = videojs;
}

export default videojs;
