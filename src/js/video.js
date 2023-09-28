/**
 * @file video.js
 * @module videojs
 */
/**
 * @typedef { string } version
 */
import {version} from '../../package.json';
import window from 'global/window';
import {
  hooks_,
  hooks,
  hook,
  hookOnce,
  removeHook
} from './utils/hooks';
import * as setup from './setup';
import * as stylesheet from './utils/stylesheet.js';
import Component from './component';
import EventTarget from './event-target';
import * as Events from './utils/events.js';
import Player from './player';
import Plugin from './plugin';
import * as Fn from './utils/fn.js';
import * as Num from './utils/num.js';
import * as Str from './utils/str.js';
import TextTrack from './tracks/text-track.js';
import AudioTrack from './tracks/audio-track.js';
import VideoTrack from './tracks/video-track.js';
import { deprecateForMajor } from './utils/deprecate';
import * as Time from './utils/time.js';
import log, { createLogger } from './utils/log.js';
import * as Dom from './utils/dom.js';
import * as browser from './utils/browser.js';
import * as Url from './utils/url.js';
import * as Obj from './utils/obj';
import xhr from '@videojs/xhr';

// Include the built-in techs
import Tech from './tech/tech.js';
import { use as middlewareUse, TERMINATOR } from './tech/middleware.js';

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
 * A callback that is called when a component is ready. Does not have any
 * parameters and any callback value will be ignored. See: {@link Component~ReadyCallback}
 *
 * @callback ReadyCallback
 */

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
 * @borrows module:events.on as on
 * @borrows module:events.one as one
 * @borrows module:events.off as off
 * @borrows module:events.trigger as trigger
 * @borrows EventTarget as EventTarget
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
 * @borrows VideoTrack as VideoTrack
 *
 * @param  {string|Element} id
 *         Video element or video element ID.
 *
 * @param  {Object} [options]
 *         Options object for providing settings.
 *         See: [Options Guide](https://docs.videojs.com/tutorial-options.html).
 *
 * @param  {ReadyCallback} [ready]
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

  const el = (typeof id === 'string') ? Dom.$('#' + normalizeId(id)) : id;

  if (!Dom.isEl(el)) {
    throw new TypeError('The element or ID supplied is not valid. (videojs)');
  }

  // document.body.contains(el) will only check if el is contained within that one document.
  // This causes problems for elements in iframes.
  // Instead, use the element's ownerDocument instead of the global document.
  // This will make sure that the element is indeed in the dom of that document.
  // Additionally, check that the document in question has a default view.
  // If the document is no longer attached to the dom, the defaultView of the document will be null.
  // If element is inside Shadow DOM (e.g. is part of a Custom element), ownerDocument.body
  // always returns false. Instead, use the Shadow DOM root.
  const inShadowDom = 'getRootNode' in el ? el.getRootNode() instanceof window.ShadowRoot : false;
  const rootNode = inShadowDom ? el.getRootNode() : el.ownerDocument.body;

  if (!el.ownerDocument.defaultView || !rootNode.contains(el)) {
    log.warn('The element supplied is not included in the DOM');
  }

  options = options || {};

  // Store a copy of the el before modification, if it is to be restored in destroy()
  // If div ingest, store the parent div
  if (options.restoreEl === true) {
    options.restoreEl = (el.parentNode && el.parentNode.hasAttribute('data-vjs-player') ? el.parentNode : el).cloneNode(true);
  }

  hooks('beforesetup').forEach((hookFunction) => {
    const opts = hookFunction(el, Obj.merge(options));

    if (!Obj.isObject(opts) || Array.isArray(opts)) {
      log.error('please return an object in beforesetup hooks');
      return;
    }

    options = Obj.merge(options, opts);
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
if (window.VIDEOJS_NO_DYNAMIC_STYLE !== true && Dom.isReal()) {
  let style = Dom.$('.vjs-styles-defaults');

  if (!style) {
    style = stylesheet.createStyleElement('vjs-styles-defaults');
    const head = Dom.$('head');

    if (head) {
      head.insertBefore(style, head.firstChild);
    }
    stylesheet.setTextContent(style, `
      .video-js {
        width: 300px;
        height: 150px;
      }

      .vjs-fluid:not(.vjs-audio-only-mode) {
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

    tag = Dom.$('#' + nId);
  } else {
    tag = id;
  }

  if (Dom.isEl(tag)) {
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

  return Component.registerComponent.call(Component, name, comp);
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
 * A reference to the {@link module:browser|browser utility module} as an object.
 *
 * @type {Object}
 * @see  {@link module:browser|browser}
 */
videojs.browser = browser;

/**
 * A reference to the {@link module:obj|obj utility module} as an object.
 *
 * @type {Object}
 * @see  {@link module:obj|obj}
 */
videojs.obj = Obj;

/**
 * Deprecated reference to the {@link module:obj.merge|merge function}
 *
 * @type {Function}
 * @see {@link module:obj.merge|merge}
 * @deprecated Deprecated and will be removed in 9.0. Please use videojs.obj.merge instead.
 */
videojs.mergeOptions = deprecateForMajor(9, 'videojs.mergeOptions', 'videojs.obj.merge', Obj.merge);

/**
 * Deprecated reference to the {@link module:obj.defineLazyProperty|defineLazyProperty function}
 *
 * @type {Function}
 * @see {@link module:obj.defineLazyProperty|defineLazyProperty}
 * @deprecated Deprecated and will be removed in 9.0. Please use videojs.obj.defineLazyProperty instead.
 */
videojs.defineLazyProperty = deprecateForMajor(9, 'videojs.defineLazyProperty', 'videojs.obj.defineLazyProperty', Obj.defineLazyProperty);

/**
 * Deprecated reference to the {@link module:fn.bind_|fn.bind_ function}
 *
 * @type {Function}
 * @see {@link module:fn.bind_|fn.bind_}
 * @deprecated Deprecated and will be removed in 9.0. Please use native Function.prototype.bind instead.
 */
videojs.bind = deprecateForMajor(9, 'videojs.bind', 'native Function.prototype.bind', Fn.bind_);

videojs.registerPlugin = Plugin.registerPlugin;
videojs.deregisterPlugin = Plugin.deregisterPlugin;

/**
 * Deprecated method to register a plugin with Video.js
 *
 * @deprecated Deprecated and will be removed in 9.0. Use videojs.registerPlugin() instead.
 *
 * @param {string} name
 *        The plugin name
 *
 * @param {Plugin|Function} plugin
 *         The plugin sub-class or function
 */
videojs.plugin = (name, plugin) => {
  log.warn('videojs.plugin() is deprecated; use videojs.registerPlugin() instead');
  return Plugin.registerPlugin(name, plugin);
};

videojs.getPlugins = Plugin.getPlugins;
videojs.getPlugin = Plugin.getPlugin;
videojs.getPluginVersion = Plugin.getPluginVersion;

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

  videojs.options.languages = Obj.merge(
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

/**
 * A reference to the {@link module:time|time utility module} as an object.
 *
 * @type {Object}
 * @see {@link module:time|time}
 */
videojs.time = Time;

/**
 * Deprecated reference to the {@link module:time.createTimeRanges|createTimeRanges function}
 *
 * @type {Function}
 * @see {@link module:time.createTimeRanges|createTimeRanges}
 * @deprecated Deprecated and will be removed in 9.0. Please use videojs.time.createTimeRanges instead.
 */
videojs.createTimeRange = deprecateForMajor(9, 'videojs.createTimeRange', 'videojs.time.createTimeRanges', Time.createTimeRanges);

/**
 * Deprecated reference to the {@link module:time.createTimeRanges|createTimeRanges function}
 *
 * @type {Function}
 * @see {@link module:time.createTimeRanges|createTimeRanges}
 * @deprecated Deprecated and will be removed in 9.0. Please use videojs.time.createTimeRanges instead.
 */
videojs.createTimeRanges = deprecateForMajor(9, 'videojs.createTimeRanges', 'videojs.time.createTimeRanges', Time.createTimeRanges);

/**
 * Deprecated reference to the {@link module:time.formatTime|formatTime function}
 *
 * @type {Function}
 * @see {@link module:time.formatTime|formatTime}
 * @deprecated Deprecated and will be removed in 9.0. Please use videojs.time.format instead.
 */
videojs.formatTime = deprecateForMajor(9, 'videojs.formatTime', 'videojs.time.formatTime', Time.formatTime);

/**
 * Deprecated reference to the {@link module:time.setFormatTime|setFormatTime function}
 *
 * @type {Function}
 * @see {@link module:time.setFormatTime|setFormatTime}
 * @deprecated Deprecated and will be removed in 9.0. Please use videojs.time.setFormat instead.
 */
videojs.setFormatTime = deprecateForMajor(9, 'videojs.setFormatTime', 'videojs.time.setFormatTime', Time.setFormatTime);

/**
 * Deprecated reference to the {@link module:time.resetFormatTime|resetFormatTime function}
 *
 * @type {Function}
 * @see {@link module:time.resetFormatTime|resetFormatTime}
 * @deprecated Deprecated and will be removed in 9.0. Please use videojs.time.resetFormat instead.
 */
videojs.resetFormatTime = deprecateForMajor(9, 'videojs.resetFormatTime', 'videojs.time.resetFormatTime', Time.resetFormatTime);

/**
 * Deprecated reference to the {@link module:url.parseUrl|Url.parseUrl function}
 *
 * @type {Function}
 * @see {@link module:url.parseUrl|parseUrl}
 * @deprecated Deprecated and will be removed in 9.0. Please use videojs.url.parseUrl instead.
 */
videojs.parseUrl = deprecateForMajor(9, 'videojs.parseUrl', 'videojs.url.parseUrl', Url.parseUrl);

/**
 * Deprecated reference to the {@link module:url.isCrossOrigin|Url.isCrossOrigin function}
 *
 * @type {Function}
 * @see {@link module:url.isCrossOrigin|isCrossOrigin}
 * @deprecated Deprecated and will be removed in 9.0. Please use videojs.url.isCrossOrigin instead.
 */
videojs.isCrossOrigin = deprecateForMajor(9, 'videojs.isCrossOrigin', 'videojs.url.isCrossOrigin', Url.isCrossOrigin);

videojs.EventTarget = EventTarget;

videojs.any = Events.any;
videojs.on = Events.on;
videojs.one = Events.one;
videojs.off = Events.off;
videojs.trigger = Events.trigger;

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

videojs.TextTrack = TextTrack;
videojs.AudioTrack = AudioTrack;
videojs.VideoTrack = VideoTrack;

[
  'isEl',
  'isTextNode',
  'createEl',
  'hasClass',
  'addClass',
  'removeClass',
  'toggleClass',
  'setAttributes',
  'getAttributes',
  'emptyEl',
  'appendContent',
  'insertContent'
].forEach(k => {
  videojs[k] = function() {
    log.warn(`videojs.${k}() is deprecated; use videojs.dom.${k}() instead`);
    return Dom[k].apply(null, arguments);
  };
});

videojs.computedStyle = deprecateForMajor(9, 'videojs.computedStyle', 'videojs.dom.computedStyle', Dom.computedStyle);

/**
 * A reference to the {@link module:dom|DOM utility module} as an object.
 *
 * @type {Object}
 * @see {@link module:dom|dom}
 */
videojs.dom = Dom;

/**
 * A reference to the {@link module:fn|fn utility module} as an object.
 *
 * @type {Object}
 * @see {@link module:fn|fn}
 */
videojs.fn = Fn;

/**
 * A reference to the {@link module:num|num utility module} as an object.
 *
 * @type {Object}
 * @see {@link module:num|num}
 */
videojs.num = Num;

/**
 * A reference to the {@link module:str|str utility module} as an object.
 *
 * @type {Object}
 * @see {@link module:str|str}
 */
videojs.str = Str;

/**
 * A reference to the {@link module:url|URL utility module} as an object.
 *
 * @type {Object}
 * @see {@link module:url|url}
 */
videojs.url = Url;

export default videojs;
