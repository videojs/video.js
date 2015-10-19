/**
 * @file video.js
 */
import document from 'global/document';
import * as setup from './setup';
import * as stylesheet from './utils/stylesheet.js';
import Component from './component';
import EventTarget from './event-target';
import * as Events from './utils/events.js';
import Player from './player';
import plugin from './plugins.js';
import mergeOptions from '../../src/js/utils/merge-options.js';
import * as Fn from './utils/fn.js';
import TextTrack from './tracks/text-track.js';

import assign from 'object.assign';
import { createTimeRanges } from './utils/time-ranges.js';
import formatTime from './utils/format-time.js';
import log from './utils/log.js';
import * as Dom from './utils/dom.js';
import * as browser from './utils/browser.js';
import * as Url from './utils/url.js';
import extendFn from './extend.js';
import merge from 'lodash-compat/object/merge';
import createDeprecationProxy from './utils/create-deprecation-proxy.js';
import xhr from 'xhr';

// Include the built-in techs
import Html5 from './tech/html5.js';
import Flash from './tech/flash.js';

// HTML5 Element Shim for IE8
if (typeof HTMLVideoElement === 'undefined') {
  document.createElement('video');
  document.createElement('audio');
  document.createElement('track');
}

/**
 * Doubles as the main function for users to create a player instance and also
 * the main library object.
 * The `videojs` function can be used to initialize or retrieve a player.
 * ```js
 *     var myPlayer = videojs('my_video_id');
 * ```
 *
 * @param  {String|Element} id      Video element or video element ID
 * @param  {Object=} options        Optional options object for config/settings
 * @param  {Function=} ready        Optional ready callback
 * @return {Player}                 A player instance
 * @mixes videojs
 * @method videojs
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
    if (videojs.getPlayers()[id]) {

      // If options or ready funtion are passed, warn
      if (options) {
        log.warn(`Player "${id}" is already initialised. Options will not be applied.`);
      }

      if (ready) {
        videojs.getPlayers()[id].ready(ready);
      }

      return videojs.getPlayers()[id];

    // Otherwise get element for ID
    } else {
      tag = Dom.getEl(id);
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

// Add default styles
let style = document.querySelector('.vjs-styles-defaults');
if (!style) {
  style = stylesheet.createStyleElement('vjs-styles-defaults');
  let head = document.querySelector('head');
  head.insertBefore(style, head.firstChild);
  stylesheet.setTextContent(style, `
    .video-js {
      width: 300px;
      height: 150px;
    }

    .vjs-fluid {
      padding-top: 56.25%
    }
  `);
}

// Run Auto-load players
// You have to wait at least once in case this script is loaded after your video in the DOM (weird behavior only with minified version)
setup.autoSetupTimeout(1, videojs);

/*
 * Current software version (semver)
 *
 * @type {String}
 */
videojs.VERSION = '__VERSION__';

/**
 * The global options object. These are the settings that take effect
 * if no overrides are specified when the player is created.
 *
 * ```js
 *     videojs.options.autoplay = true
 *     // -> all players will autoplay by default
 * ```
 *
 * @type {Object}
 */
videojs.options = Player.prototype.options_;

/**
 * Get an object with the currently created players, keyed by player ID
 *
 * @return {Object} The created players
 * @mixes videojs
 * @method getPlayers
 */
videojs.getPlayers = function() {
  return Player.players;
};

/**
 * For backward compatibility, expose players object.
 *
 * @deprecated
 * @memberOf videojs
 * @property {Object|Proxy} players
 */
videojs.players = createDeprecationProxy(Player.players, {
  get: 'Access to videojs.players is deprecated; use videojs.getPlayers instead',
  set: 'Modification of videojs.players is deprecated'
});

/**
 * Get a component class object by name
 * ```js
 *     var VjsButton = videojs.getComponent('Button');
 *     // Create a new instance of the component
 *     var myButton = new VjsButton(myPlayer);
 * ```
 *
 * @return {Component} Component identified by name
 * @mixes videojs
 * @method getComponent
 */
videojs.getComponent = Component.getComponent;

/**
 * Register a component so it can referred to by name
 * Used when adding to other
 * components, either through addChild
 * `component.addChild('myComponent')`
 * or through default children options
 * `{ children: ['myComponent'] }`.
 * ```js
 *     // Get a component to subclass
 *     var VjsButton = videojs.getComponent('Button');
 *     // Subclass the component (see 'extend' doc for more info)
 *     var MySpecialButton = videojs.extend(VjsButton, {});
 *     // Register the new component
 *     VjsButton.registerComponent('MySepcialButton', MySepcialButton);
 *     // (optionally) add the new component as a default player child
 *     myPlayer.addChild('MySepcialButton');
 * ```
 * NOTE: You could also just initialize the component before adding.
 * `component.addChild(new MyComponent());`
 *
 * @param {String} The class name of the component
 * @param {Component} The component class
 * @return {Component} The newly registered component
 * @mixes videojs
 * @method registerComponent
 */
videojs.registerComponent = Component.registerComponent;

/**
 * A suite of browser and device tests
 *
 * @type {Object}
 * @private
 */
videojs.browser = browser;

/**
 * Whether or not the browser supports touch events. Included for backward
 * compatibility with 4.x, but deprecated. Use `videojs.browser.TOUCH_ENABLED`
 * instead going forward.
 *
 * @deprecated
 * @type {Boolean}
 */
videojs.TOUCH_ENABLED = browser.TOUCH_ENABLED;

/**
 * Subclass an existing class
 * Mimics ES6 subclassing with the `extend` keyword
 * ```js
 *     // Create a basic javascript 'class'
 *     function MyClass(name){
 *       // Set a property at initialization
 *       this.myName = name;
 *     }
 *     // Create an instance method
 *     MyClass.prototype.sayMyName = function(){
 *       alert(this.myName);
 *     };
 *     // Subclass the exisitng class and change the name
 *     // when initializing
 *     var MySubClass = videojs.extend(MyClass, {
 *       constructor: function(name) {
 *         // Call the super class constructor for the subclass
 *         MyClass.call(this, name)
 *       }
 *     });
 *     // Create an instance of the new sub class
 *     var myInstance = new MySubClass('John');
 *     myInstance.sayMyName(); // -> should alert "John"
 * ```
 *
 * @param {Function} The Class to subclass
 * @param {Object} An object including instace methods for the new class
 *                   Optionally including a `constructor` function
 * @return {Function} The newly created subclass
 * @mixes videojs
 * @method extend
 */
videojs.extend = extendFn;

/**
 * Merge two options objects recursively
 * Performs a deep merge like lodash.merge but **only merges plain objects**
 * (not arrays, elements, anything else)
 * Other values will be copied directly from the second object.
 * ```js
 *     var defaultOptions = {
 *       foo: true,
 *       bar: {
 *         a: true,
 *         b: [1,2,3]
 *       }
 *     };
 *     var newOptions = {
 *       foo: false,
 *       bar: {
 *         b: [4,5,6]
 *       }
 *     };
 *     var result = videojs.mergeOptions(defaultOptions, newOptions);
 *     // result.foo = false;
 *     // result.bar.a = true;
 *     // result.bar.b = [4,5,6];
 * ```
 *
 * @param {Object} defaults  The options object whose values will be overriden
 * @param {Object} overrides The options object with values to override the first
 * @param {Object} etc       Any number of additional options objects
 *
 * @return {Object} a new object with the merged values
 * @mixes videojs
 * @method mergeOptions
 */
videojs.mergeOptions = mergeOptions;

/**
 * Change the context (this) of a function
 *
 *     videojs.bind(newContext, function(){
 *       this === newContext
 *     });
 *
 * NOTE: as of v5.0 we require an ES5 shim, so you should use the native
 * `function(){}.bind(newContext);` instead of this.
 *
 * @param  {*}        context The object to bind as scope
 * @param  {Function} fn      The function to be bound to a scope
 * @param  {Number=}  uid     An optional unique ID for the function to be set
 * @return {Function}
 */
videojs.bind = Fn.bind;

/**
 * Create a Video.js player plugin
 * Plugins are only initialized when options for the plugin are included
 * in the player options, or the plugin function on the player instance is
 * called.
 * **See the plugin guide in the docs for a more detailed example**
 * ```js
 *     // Make a plugin that alerts when the player plays
 *     videojs.plugin('myPlugin', function(myPluginOptions) {
 *       myPluginOptions = myPluginOptions || {};
 *
 *       var player = this;
 *       var alertText = myPluginOptions.text || 'Player is playing!'
 *
 *       player.on('play', function(){
 *         alert(alertText);
 *       });
 *     });
 *     // USAGE EXAMPLES
 *     // EXAMPLE 1: New player with plugin options, call plugin immediately
 *     var player1 = videojs('idOne', {
 *       myPlugin: {
 *         text: 'Custom text!'
 *       }
 *     });
 *     // Click play
 *     // --> Should alert 'Custom text!'
 *     // EXAMPLE 3: New player, initialize plugin later
 *     var player3 = videojs('idThree');
 *     // Click play
 *     // --> NO ALERT
 *     // Click pause
 *     // Initialize plugin using the plugin function on the player instance
 *     player3.myPlugin({
 *       text: 'Plugin added later!'
 *     });
 *     // Click play
 *     // --> Should alert 'Plugin added later!'
 * ```
 *
 * @param {String} name The plugin name
 * @param {Function} fn The plugin function that will be called with options
 * @mixes videojs
 * @method plugin
 */
videojs.plugin = plugin;

/**
 * Adding languages so that they're available to all players.
 * ```js
 *     videojs.addLanguage('es', { 'Hello': 'Hola' });
 * ```
 *
 * @param  {String} code The language code or dictionary property
 * @param  {Object} data The data values to be translated
 * @return {Object} The resulting language dictionary object
 * @mixes videojs
 * @method addLanguage
 */
videojs.addLanguage = function(code, data){
  code = ('' + code).toLowerCase();
  return merge(videojs.options.languages, { [code]: data })[code];
};

/**
 * Log debug messages.
 *
 * @param {...Object} messages One or more messages to log
 */
videojs.log = log;

/**
 * Creates an emulated TimeRange object.
 *
 * @param  {Number|Array} start Start time in seconds or an array of ranges
 * @param  {Number} end   End time in seconds
 * @return {Object}       Fake TimeRange object
 * @method createTimeRange
 */
videojs.createTimeRange = videojs.createTimeRanges = createTimeRanges;

/**
 * Format seconds as a time string, H:MM:SS or M:SS
 * Supplying a guide (in seconds) will force a number of leading zeros
 * to cover the length of the guide
 *
 * @param  {Number} seconds Number of seconds to be turned into a string
 * @param  {Number} guide   Number (in seconds) to model the string after
 * @return {String}         Time formatted as H:MM:SS or M:SS
 * @method formatTime
 */
videojs.formatTime = formatTime;

/**
 * Resolve and parse the elements of a URL
 *
 * @param  {String} url The url to parse
 * @return {Object}     An object of url details
 * @method parseUrl
 */
videojs.parseUrl = Url.parseUrl;

/**
 * Returns whether the url passed is a cross domain request or not.
 *
 * @param {String} url The url to check
 * @return {Boolean}   Whether it is a cross domain request or not
 * @method isCrossOrigin
 */
videojs.isCrossOrigin = Url.isCrossOrigin;

/**
 * Event target class.
 *
 * @type {Function}
 */
videojs.EventTarget = EventTarget;

/**
 * Add an event listener to element
 * It stores the handler function in a separate cache object
 * and adds a generic handler to the element's event,
 * along with a unique id (guid) to the element.
 *
 * @param  {Element|Object}   elem Element or object to bind listeners to
 * @param  {String|Array}   type Type of event to bind to.
 * @param  {Function} fn   Event listener.
 * @method on
 */
videojs.on = Events.on;

/**
 * Trigger a listener only once for an event
 *
 * @param  {Element|Object}   elem Element or object to
 * @param  {String|Array}   type Name/type of event
 * @param  {Function} fn Event handler function
 * @method one
 */
videojs.one = Events.one;

/**
 * Removes event listeners from an element
 *
 * @param  {Element|Object}   elem Object to remove listeners from
 * @param  {String|Array=}   type Type of listener to remove. Don't include to remove all events from element.
 * @param  {Function} fn   Specific listener to remove. Don't include to remove listeners for an event type.
 * @method off
 */
videojs.off = Events.off;

/**
 * Trigger an event for an element
 *
 * @param  {Element|Object}      elem  Element to trigger an event on
 * @param  {Event|Object|String} event A string (the type) or an event object with a type attribute
 * @param  {Object} [hash] data hash to pass along with the event
 * @return {Boolean=} Returned only if default was prevented
 * @method trigger
 */
videojs.trigger = Events.trigger;

/**
 * A cross-browser XMLHttpRequest wrapper. Here's a simple example:
 *
 *     videojs.xhr({
 *       body: someJSONString,
 *       uri: "/foo",
 *       headers: {
 *         "Content-Type": "application/json"
 *       }
 *     }, function (err, resp, body) {
 *       // check resp.statusCode
 *     });
 *
 * Check out the [full
 * documentation](https://github.com/Raynos/xhr/blob/v2.1.0/README.md)
 * for more options.
 *
 * @param {Object} options settings for the request.
 * @return {XMLHttpRequest|XDomainRequest} the request object.
 * @see https://github.com/Raynos/xhr
 */
videojs.xhr = xhr;

/**
 * TextTrack class
 *
 * @type {Function}
 */
videojs.TextTrack = TextTrack;

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

/*
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
