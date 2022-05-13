/**
 * @file video.js
 * @module videojs
 */
import {version} from '../../package.json';
import window from 'global/window';

// Include core functions and classes
import extend from './extend';
import * as setup from './setup';
import * as stylesheet from './utils/stylesheet';
import Component from './component';
import EventTarget from './event-target';
import Player from './player';
import Plugin from './plugin';
import TextTrack from './tracks/text-track';
import AudioTrack from './tracks/audio-track';
import VideoTrack from './tracks/video-track';

// Include utilities
import { createTimeRange } from './utils/time-ranges';
import formatTime, { setFormatTime, resetFormatTime } from './utils/format-time';
import log, { createLogger } from './utils/log';
import deprecate from './utils/deprecate';
import * as browser from './utils/browser';
import clamp from './utils/clamp';
import computedStyle from './utils/computed-style';
import * as dom from './utils/dom';
import * as events from './utils/events';
import * as fn from './utils/fn';

import {
  hooks_,
  hooks,
  hook,
  hookOnce,
  removeHook
} from './utils/hooks';

import * as obj from './utils/obj';
import * as promise from './utils/promise';
import * as str from './utils/str';
import * as url from './utils/url';

import xhr from '@videojs/xhr';

// Include the built-in techs
import Tech from './tech/tech';
import { use as middlewareUse, TERMINATOR } from './tech/middleware';
import defineLazyProperty from './utils/define-lazy-property';

/**
 * Normalize an `id` value by trimming off a leading `#`
 *
 * @private
 * @param   {string} id
 *          A string, maybe with a leading `#`.
 *
 * @return {string}
 *          The string, without any leading `#`.
 */
const normalizeId = (id) => id.indexOf('#') === 0 ? id.slice(1) : id;

/**
 * The `videojs()` function doubles as the main function for users to create a
 * {@link Player} instance as well as the main library namespace.
 *
 * It can also be used as a getter for a pre-existing {@link Player} instance.
 * However, we _strongly_ recommend using `videojs.getPlayer()` for this
 * purpose because it avoids any potential for unintended initialization.
 *
 * Due to [limitations](https://github.com/jsdoc3/jsdoc/issues/955#issuecomment-313829149)
 * of our JSDoc template, we cannot properly document this as both a function
 * and a namespace, so its function signature is documented here.
 *
 * #### Arguments
 * ##### id
 * string|Element, **required**
 *
 * Video element or video element ID.
 *
 * ##### options
 * Object, optional
 *
 * Options object for providing settings.
 * See: [Options Guide](https://docs.videojs.com/tutorial-options.html).
 *
 * ##### ready
 * {@link Component~ReadyCallback}, optional
 *
 * A function to be called when the {@link Player} and {@link Tech} are ready.
 *
 * #### Return Value
 *
 * The `videojs()` function returns a {@link Player} instance.
 *
 * @namespace
 *
 * @borrows AudioTrack as AudioTrack
 * @borrows Component.getComponent as getComponent
 * @borrows module:computed-style~computedStyle as computedStyle
 * @borrows module:events.on as on
 * @borrows module:events.one as one
 * @borrows module:events.off as off
 * @borrows module:events.trigger as trigger
 * @borrows EventTarget as EventTarget
 * @borrows module:extend~extend as extend
 * @borrows module:fn.bind as bind
 * @borrows module:format-time.formatTime as formatTime
 * @borrows module:format-time.resetFormatTime as resetFormatTime
 * @borrows module:format-time.setFormatTime as setFormatTime
 * @borrows module:merge-options.mergeOptions as mergeOptions
 * @borrows module:middleware.use as use
 * @borrows Player.players as players
 * @borrows Plugin.registerPlugin as registerPlugin
 * @borrows Plugin.deregisterPlugin as deregisterPlugin
 * @borrows Plugin.getPlugins as getPlugins
 * @borrows Plugin.getPlugin as getPlugin
 * @borrows Plugin.getPluginVersion as getPluginVersion
 * @borrows Tech.getTech as getTech
 * @borrows Tech.registerTech as registerTech
 * @borrows TextTrack as TextTrack
 * @borrows module:time-ranges.createTimeRanges as createTimeRange
 * @borrows module:time-ranges.createTimeRanges as createTimeRanges
 * @borrows module:url.isCrossOrigin as isCrossOrigin
 * @borrows module:url.parseUrl as parseUrl
 * @borrows VideoTrack as VideoTrack
 *
 * @param  {string|Element} id
 *         Video element or video element ID.
 *
 * @param  {Object} [options]
 *         Options object for providing settings.
 *         See: [Options Guide](https://docs.videojs.com/tutorial-options.html).
 *
 * @param  {Component~ReadyCallback} [ready]
 *         A function to be called when the {@link Player} and {@link Tech} are
 *         ready.
 *
 * @return {Player}
 *         The `videojs()` function returns a {@link Player|Player} instance.
 */
function videojs(id, options, ready) {
  let player = videojs.getPlayer(id);

  if (player) {
    if (options) {
      log.warn(`Player "${id}" is already initialised. Options will not be applied.`);
    }
    if (ready) {
      player.ready(ready);
    }
    return player;
  }

  const el = (typeof id === 'string') ? dom.$('#' + normalizeId(id)) : id;

  if (!dom.isEl(el)) {
    throw new TypeError('The element or ID supplied is not valid. (videojs)');
  }

  // document.body.contains(el) will only check if el is contained within that one document.
  // This causes problems for elements in iframes.
  // Instead, use the element's ownerDocument instead of the global document.
  // This will make sure that the element is indeed in the dom of that document.
  // Additionally, check that the document in question has a default view.
  // If the document is no longer attached to the dom, the defaultView of the document will be null.
  if (!el.ownerDocument.defaultView || !el.ownerDocument.body.contains(el)) {
    log.warn('The element supplied is not included in the DOM');
  }

  options = options || {};

  hooks('beforesetup').forEach((hookFunction) => {
    const opts = hookFunction(el, obj.merge(options));

    if (!obj.isObject(opts) || Array.isArray(opts)) {
      log.error('please return an object in beforesetup hooks');
      return;
    }

    options = obj.merge(options, opts);
  });

  // We get the current "Player" component here in case an integration has
  // replaced it with a custom player.
  const PlayerComponent = Component.getComponent('Player');

  player = new PlayerComponent(el, options, ready);

  hooks('setup').forEach((hookFunction) => hookFunction(player));

  return player;
}

videojs.hooks_ = hooks_;
videojs.hooks = hooks;
videojs.hook = hook;
videojs.hookOnce = hookOnce;
videojs.removeHook = removeHook;

// Add default styles
if (window.VIDEOJS_NO_DYNAMIC_STYLE !== true && dom.isReal()) {
  let style = dom.$('.vjs-styles-defaults');

  if (!style) {
    style = stylesheet.createStyleElement('vjs-styles-defaults');
    const head = dom.$('head');

    if (head) {
      head.insertBefore(style, head.firstChild);
    }
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
}

// Run Auto-load players
// You have to wait at least once in case this script is loaded after your
// video in the DOM (weird behavior only with minified version)
setup.autoSetupTimeout(1, videojs);

/**
 * Current Video.js version. Follows [semantic versioning](https://semver.org/).
 *
 * @type {string}
 */
videojs.VERSION = version;

/**
 * The global options object. These are the settings that take effect
 * if no overrides are specified when the player is created.
 *
 * @type {Object}
 */
videojs.options = Player.prototype.options_;

/**
 * Get an object with the currently created players, keyed by player ID
 *
 * @return {Object}
 *         The created players
 */
videojs.getPlayers = () => Player.players;

/**
 * Get a single player based on an ID or DOM element.
 *
 * This is useful if you want to check if an element or ID has an associated
 * Video.js player, but not create one if it doesn't.
 *
 * @param   {string|Element} id
 *          An HTML element - `<video>`, `<audio>`, or `<video-js>` -
 *          or a string matching the `id` of such an element.
 *
 * @return {Player|undefined}
 *          A player instance or `undefined` if there is no player instance
 *          matching the argument.
 */
videojs.getPlayer = (id) => {
  const players = Player.players;
  let tag;

  if (typeof id === 'string') {
    const nId = normalizeId(id);
    const player = players[nId];

    if (player) {
      return player;
    }

    tag = dom.$('#' + nId);
  } else {
    tag = id;
  }

  if (dom.isEl(tag)) {
    const {player, playerId} = tag;

    // Element may have a `player` property referring to an already created
    // player instance. If so, return that.
    if (player || players[playerId]) {
      return player || players[playerId];
    }
  }
};

/**
 * Returns an array of all current players.
 *
 * @return {Array}
 *         An array of all players. The array will be in the order that
 *         `Object.keys` provides, which could potentially vary between
 *         JavaScript engines.
 *
 */
videojs.getAllPlayers = () =>

  // Disposed players leave a key with a `null` value, so we need to make sure
  // we filter those out.
  Object.keys(Player.players).map(k => Player.players[k]).filter(Boolean);

videojs.players = Player.players;
videojs.getComponent = Component.getComponent;

/**
 * Register a component so it can referred to by name. Used when adding to other
 * components, either through addChild `component.addChild('myComponent')` or through
 * default children options  `{ children: ['myComponent'] }`.
 *
 * > NOTE: You could also just initialize the component before adding.
 * `component.addChild(new MyComponent());`
 *
 * @param {string} name
 *        The class name of the component
 *
 * @param {Component} comp
 *        The component class
 *
 * @return {Component}
 *         The newly registered component
 */
videojs.registerComponent = (name, comp) => {
  if (Tech.isTech(comp)) {
    log.warn(`The ${name} tech was registered as a component. It should instead be registered using videojs.registerTech(name, tech)`);
  }

  Component.registerComponent.call(Component, name, comp);
};

videojs.getTech = Tech.getTech;
videojs.registerTech = Tech.registerTech;
videojs.use = middlewareUse;

/**
 * An object that can be returned by a middleware to signify
 * that the middleware is being terminated.
 *
 * @type {object}
 * @property {object} middleware.TERMINATOR
 */
Object.defineProperty(videojs, 'middleware', {
  value: {},
  writeable: false,
  enumerable: true
});

Object.defineProperty(videojs.middleware, 'TERMINATOR', {
  value: TERMINATOR,
  writeable: false,
  enumerable: true
});

/**
 * Adding languages so that they're available to all players.
 * Example: `videojs.addLanguage('es', { 'Hello': 'Hola' });`
 *
 * @param {string} code
 *        The language code or dictionary property
 *
 * @param {Object} data
 *        The data values to be translated
 *
 * @return {Object}
 *         The resulting language dictionary object
 */
videojs.addLanguage = function(code, data) {
  code = ('' + code).toLowerCase();

  videojs.options.languages = obj.merge(
    videojs.options.languages,
    {[code]: data}
  );

  return videojs.options.languages[code];
};

/**
 * A reference to the {@link module:log|log utility module} as an object.
 *
 * @type {Function}
 * @see  {@link module:log|log}
 */
videojs.log = log;
videojs.createLogger = createLogger;

videojs.registerPlugin = Plugin.registerPlugin;
videojs.deregisterPlugin = Plugin.deregisterPlugin;
videojs.getPlugins = Plugin.getPlugins;
videojs.getPlugin = Plugin.getPlugin;
videojs.getPluginVersion = Plugin.getPluginVersion;

/**
 * A reference to the {@link module:browser|browser utility module} as an object.
 *
 * @type {Object}
 * @see  {@link module:browser|browser}
 */
videojs.browser = browser;

/**
 * A reference to the {@link module:dom|DOM utility module} as an object.
 *
 * @type {Object}
 * @see  {@link module:dom|dom}
 */
videojs.dom = dom;

/**
 * A reference to the {@link module:fn|function utility module} as an object.
 *
 * @type {Object}
 * @see  {@link module:fn|fn}
 */
videojs.fn = fn;

/**
 * An object containing number-related functions.
 *
 * @type {Object}
 */
videojs.num = {
  clamp
};

/**
 * A reference to the {@link module:obj|object utility module} as an object.
 *
 * @type {Object}
 * @see  {@link module:obj|obj}
 */
videojs.obj = obj;

/**
 * A reference to the {@link module:promise|promise utility module} as an object.
 *
 * @type {Object}
 * @see  {@link module:promise|promise}
 */
videojs.promise = promise;

/**
 * A reference to the {@link module:str|string utility module} as an object.
 *
 * @type {Object}
 * @see  {@link module:str|str}
 */
videojs.str = str;

/**
 * An object containing time-related functions.
 *
 * @type {Object}
 */
videojs.time = {
  createTimeRange,
  format: formatTime,
  setFormat: setFormatTime,
  resetFormat: resetFormatTime
};

/**
 * A reference to the {@link module:url|URL utility module} as an object.
 *
 * @type {Object}
 * @see  {@link module:url|url}
 */
videojs.url = url;

/**
 * Namespace for general utility functions.
 *
 * @type {Object}
 */
videojs.utils = {
  computedStyle,
  defineLazyProperty
};

// Deprecated global namespace functions
videojs.extend = deprecate('videojs.extend is deprecated as of 8.0. Please use native ES6 classes instead.', extend);
videojs.mergeOptions = deprecate('videojs.mergeOptions is deprecated as of 8.0. Please use videojs.obj.merge instead.', obj.merge);
videojs.bind = deprecate('videojs.bind is deprecated as of 8.0. Please use native Function.prototype.bind instead.', fn.bind);
videojs.createTimeRange = deprecate('videojs.createTimeRange is deprecated as of 8.0. Please use videojs.time.createTimeRange instead.', createTimeRange);
videojs.createTimeRanges = deprecate('videojs.createTimeRanges is deprecated as of 8.0. Please use videojs.time.createTimeRange instead.', createTimeRange);
videojs.formatTime = deprecate('videojs.formatTime is deprecated as of 8.0. Please use videojs.time.format instead.', formatTime);
videojs.setFormatTime = deprecate('videojs.setFormatTime is deprecated as of 8.0. Please use videojs.time.setFormat instead.', setFormatTime);
videojs.resetFormatTime = deprecate('videojs.resetFormatTime is deprecated as of 8.0. Please use videojs.time.resetFormat instead.', resetFormatTime);
videojs.computedStyle = deprecate('videojs.computedStyle is deprecated as of 8.0. Please use videojs.utils.computedStyle instead.', computedStyle);
videojs.defineLazyProperty = deprecate('videojs.defineLazyProperty is deprecated as of 8.0. Please use videojs.utils.defineLazyProperty instead.', defineLazyProperty);
videojs.isPromise = deprecate('videojs.isPromise is deprecated as of 8.0. Please use videojs.promise.isPromise instead.', promise.isPromise);
videojs.silencePromise = deprecate('videojs.silencePromise is deprecated as of 8.0. Please use videojs.promise.silencePromise instead.', promise.silencePromise);
videojs.parseUrl = deprecate('videojs.parseUrl is deprecated as of 8.0. Please use videojs.url.parseUrl instead.', url.parseUrl);
videojs.isCrossOrigin = deprecate('videojs.isCrossOrigin is deprecated as of 8.0. Please use videojs.url.isCrossOrigin instead.', url.isCrossOrigin);

videojs.on = events.on;
videojs.one = events.one;
videojs.off = events.off;
videojs.trigger = events.trigger;

videojs.EventTarget = EventTarget;
videojs.TextTrack = TextTrack;
videojs.AudioTrack = AudioTrack;
videojs.VideoTrack = VideoTrack;

/**
 * A cross-browser XMLHttpRequest wrapper.
 *
 * @function
 * @param    {Object} options
 *           Settings for the request.
 *
 * @return   {XMLHttpRequest|XDomainRequest}
 *           The request object.
 *
 * @see      https://github.com/Raynos/xhr
 */
videojs.xhr = xhr;

export default videojs;

