import document from 'global/document';
import assign from 'object.assign';
import MediaLoader from './tech/loader.js';
import Html5 from './tech/html5.js';
import Flash from './tech/flash.js';
import PosterImage from './poster-image.js';
import TextTrackDisplay from './tracks/text-track-display.js';
import LoadingSpinner from './loading-spinner.js';
import BigPlayButton from './big-play-button.js';
import ControlBar from './control-bar/control-bar.js';
import ErrorDisplay from './error-display.js';
import * as setup from './setup';
import Component from './component';
import Options from './options';
import * as Dom from './utils/dom.js';
import log from './utils/log.js';
import * as browser from './utils/browser.js';
import Player from './player';
import extendsFn from './extends.js';
import plugin from './plugins.js';
import options from './options.js';
import mergeOptions from '../../src/js/utils/merge-options.js';

// HTML5 Element Shim for IE8
if (typeof HTMLVideoElement === 'undefined') {
  document.createElement('video');
  document.createElement('audio');
  document.createElement('track');
}

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
        log.warn(`Player "${id}" is already initialised. Options will not be applied.`);
      }

      if (ready) {
        Player.players[id].ready(ready);
      }

      return Player.players[id];

    // Otherwise get element for ID
    } else {
      tag = Dom.el(id);
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

// CDN Version. Used to target right flash swf.
videojs.CDN_VERSION = '__VERSION_NO_PATCH__';
videojs.ACCESS_PROTOCOL = ('https:' === document.location.protocol ? 'https://' : 'http://');

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

// Run Auto-load players
// You have to wait at least once in case this script is loaded after your video in the DOM (weird behavior only with minified version)
setup.autoSetupTimeout(1, videojs);

videojs.getComponent = Component.getComponent;
videojs.registerComponent = Component.registerComponent;

// APIs that will be removed with 5.0, but need them to get tests passing
// in ES6 transition
videojs.TOUCH_ENABLED = browser.TOUCH_ENABLED;

// Probably want to keep this one for 5.0?
videojs.players = Player.players;

videojs.extends = extendsFn;

videojs.mergeOptions = mergeOptions;

videojs.getGlobalOptions = () => options;
videojs.setGlobalOptions = function(newOptions) {
  mergeOptions(options, newOptions);
};

videojs.plugin = plugin;

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
    Options['languages'][code] = mergeOptions(Options['languages'][code], data);
  } else {
    Options['languages'][code] = data;
  }
  return Options['languages'];
};

// REMOVING: We probably should add this to the migration plugin
// // Expose but deprecate the window[componentName] method for accessing components
// Object.getOwnPropertyNames(Component.components).forEach(function(name){
//   let component = Component.components[name];
//
//   // A deprecation warning as the constuctor
//   module.exports[name] = function(player, options, ready){
//     log.warn('Using videojs.'+name+' to access the '+name+' component has been deprecated. Please use videojs.getComponent("componentName")');
//
//     return new Component(player, options, ready);
//   };
//
//   // Allow the prototype and class methods to be accessible still this way
//   // Though anything that attempts to override class methods will no longer work
//   assign(module.exports[name], component);
// });

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
