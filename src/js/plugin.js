/**
 * @file plugin.js
 */
import evented from './mixins/evented';
import stateful from './mixins/stateful';
import * as Events from './utils/events';
import * as Fn from './utils/fn';
import log from './utils/log';
import Player from './player';

/**
 * The base plugin name.
 *
 * @private
 * @constant
 * @type {string}
 */
const BASE_PLUGIN_NAME = 'plugin';

/**
 * The key on which a player's active plugins cache is stored.
 *
 * @private
 * @constant
 * @type     {string}
 */
const PLUGIN_CACHE_KEY = 'activePlugins_';

/**
 * Stores registered plugins in a private space.
 *
 * @private
 * @type    {Object}
 */
const pluginStorage = {};

/**
 * Reports whether or not a plugin has been registered.
 *
 * @private
 * @param   {string} name
 *          The name of a plugin.
 *
 * @returns {boolean}
 *          Whether or not the plugin has been registered.
 */
const pluginExists = (name) => pluginStorage.hasOwnProperty(name);

/**
 * Get a single registered plugin by name.
 *
 * @private
 * @param   {string} name
 *          The name of a plugin.
 *
 * @returns {Function|undefined}
 *          The plugin (or undefined).
 */
const getPlugin = (name) => pluginExists(name) ? pluginStorage[name] : undefined;

/**
 * Marks a plugin as "active" on a player.
 *
 * Also, ensures that the player has an object for tracking active plugins.
 *
 * @private
 * @param   {Player} player
 *          A Video.js player instance.
 *
 * @param   {string} name
 *          The name of a plugin.
 */
const markPluginAsActive = (player, name) => {
  player[PLUGIN_CACHE_KEY] = player[PLUGIN_CACHE_KEY] || {};
  player[PLUGIN_CACHE_KEY][name] = true;
};

/**
 * Triggers a pair of plugin setup events.
 *
 * @private
 * @param  {Player} player
 *         A Video.js player instance.
 *
 * @param  {Plugin~PluginEventHash} hash
 *         A plugin event hash.
 *
 * @param  {Boolean} [before]
 *         If true, prefixes the event name with "before". In other words,
 *         use this to trigger "beforepluginsetup" instead of "pluginsetup".
 */
const triggerSetupEvent = (player, hash, before) => {
  const eventName = (before ? 'before' : '') + 'pluginsetup';

  player.trigger(eventName, hash);
  player.trigger(eventName + ':' + hash.name, hash);
};

/**
 * Takes a basic plugin function and returns a wrapper function which marks
 * on the player that the plugin has been activated.
 *
 * @private
 * @param   {string} name
 *          The name of the plugin.
 *
 * @param   {Function} plugin
 *          The basic plugin.
 *
 * @returns {Function}
 *          A wrapper function for the given plugin.
 */
const createBasicPlugin = function(name, plugin) {
  const basicPluginWrapper = function() {

    // We trigger the "beforepluginsetup" and "pluginsetup" events on the player
    // regardless, but we want the hash to be consistent with the hash provided
    // for advanced plugins.
    //
    // The only potentially counter-intuitive thing here is the `instance` in
    // the "pluginsetup" event is the value returned by the `plugin` function.
    triggerSetupEvent(this, {name, plugin, instance: null}, true);

    const instance = plugin.apply(this, arguments);

    markPluginAsActive(this, name);
    triggerSetupEvent(this, {name, plugin, instance});

    return instance;
  };

  Object.keys(plugin).forEach(function(prop) {
    basicPluginWrapper[prop] = plugin[prop];
  });

  return basicPluginWrapper;
};

/**
 * Takes a plugin sub-class and returns a factory function for generating
 * instances of it.
 *
 * This factory function will replace itself with an instance of the requested
 * sub-class of Plugin.
 *
 * @private
 * @param   {string} name
 *          The name of the plugin.
 *
 * @param   {Plugin} PluginSubClass
 *          The advanced plugin.
 *
 * @returns {Function}
 */
const createPluginFactory = (name, PluginSubClass) => {

  // Add a `name` property to the plugin prototype so that each plugin can
  // refer to itself by name.
  PluginSubClass.prototype.name = name;

  return function(...args) {
    triggerSetupEvent(this, {name, plugin: PluginSubClass, instance: null}, true);

    const instance = new PluginSubClass(...[this, ...args]);

    // The plugin is replaced by a function that returns the current instance.
    this[name] = () => instance;

    triggerSetupEvent(this, instance.getEventHash());

    return instance;
  };
};

/**
 * Parent class for all advanced plugins.
 *
 * @mixes   module:evented~EventedMixin
 * @mixes   module:stateful~StatefulMixin
 * @fires   Player#beforepluginsetup
 * @fires   Player#beforepluginsetup:$name
 * @fires   Player#pluginsetup
 * @fires   Player#pluginsetup:$name
 * @listens Player#dispose
 * @throws  {Error}
 *          If attempting to instantiate the base {@link Plugin} class
 *          directly instead of via a sub-class.
 */
class Plugin {

  /**
   * Creates an instance of this class.
   *
   * Sub-classes should call `super` to ensure plugins are properly initialized.
   *
   * @param {Player} player
   *        A Video.js player instance.
   */
  constructor(player) {
    if (this.constructor === Plugin) {
      throw new Error('Plugin must be sub-classed; not directly instantiated.');
    }

    this.player = player;

    // Make this object evented, but remove the added `trigger` method so we
    // use the prototype version instead.
    evented(this);
    delete this.trigger;

    stateful(this, this.constructor.defaultState);
    markPluginAsActive(player, this.name);

    // Auto-bind the dispose method so we can use it as a listener and unbind
    // it later easily.
    this.dispose = Fn.bind(this, this.dispose);

    // If the player is disposed, dispose the plugin.
    player.on('dispose', this.dispose);
  }

  /**
   * Each event triggered by plugins includes a hash of additional data with
   * conventional properties.
   *
   * This returns that object or mutates an existing hash.
   *
   * @param   {Object} [hash={}]
   *          An object to be used as event an event hash.
   *
   * @returns {Plugin~PluginEventHash}
   *          An event hash object with provided properties mixed-in.
   */
  getEventHash(hash = {}) {
    hash.name = this.name;
    hash.plugin = this.constructor;
    hash.instance = this;
    return hash;
  }

  /**
   * Triggers an event on the plugin object and overrides
   * {@link module:evented~EventedMixin.trigger|EventedMixin.trigger}.
   *
   * @param   {string|Object} event
   *          An event type or an object with a type property.
   *
   * @param   {Object} [hash={}]
   *          Additional data hash to merge with a
   *          {@link Plugin~PluginEventHash|PluginEventHash}.
   *
   * @returns {boolean}
   *          Whether or not default was prevented.
   */
  trigger(event, hash = {}) {
    return Events.trigger(this.eventBusEl_, event, this.getEventHash(hash));
  }

  /**
   * Handles "statechanged" events on the plugin. No-op by default, override by
   * subclassing.
   *
   * @abstract
   * @param    {Event} e
   *           An event object provided by a "statechanged" event.
   *
   * @param    {Object} e.changes
   *           An object describing changes that occurred with the "statechanged"
   *           event.
   */
  handleStateChanged(e) {}

  /**
   * Disposes a plugin.
   *
   * Subclasses can override this if they want, but for the sake of safety,
   * it's probably best to subscribe the "dispose" event.
   *
   * @fires Plugin#dispose
   */
  dispose() {
    const {name, player} = this;

    /**
     * Signals that a advanced plugin is about to be disposed.
     *
     * @event Plugin#dispose
     * @type  {EventTarget~Event}
     */
    this.trigger('dispose');
    this.off();
    player.off('dispose', this.dispose);

    // Eliminate any possible sources of leaking memory by clearing up
    // references between the player and the plugin instance and nulling out
    // the plugin's state and replacing methods with a function that throws.
    player[PLUGIN_CACHE_KEY][name] = false;
    this.player = this.state = null;

    // Finally, replace the plugin name on the player with a new factory
    // function, so that the plugin is ready to be set up again.
    player[name] = createPluginFactory(name, pluginStorage[name]);
  }

  /**
   * Determines if a plugin is a basic plugin (i.e. not a sub-class of `Plugin`).
   *
   * @param   {string|Function} plugin
   *          If a string, matches the name of a plugin. If a function, will be
   *          tested directly.
   *
   * @returns {boolean}
   *          Whether or not a plugin is a basic plugin.
   */
  static isBasic(plugin) {
    const p = (typeof plugin === 'string') ? getPlugin(plugin) : plugin;

    return typeof p === 'function' && !Plugin.prototype.isPrototypeOf(p.prototype);
  }

  /**
   * Register a Video.js plugin.
   *
   * @param   {string} name
   *          The name of the plugin to be registered. Must be a string and
   *          must not match an existing plugin or a method on the `Player`
   *          prototype.
   *
   * @param   {Function} plugin
   *          A sub-class of `Plugin` or a function for basic plugins.
   *
   * @returns {Function}
   *          For advanced plugins, a factory function for that plugin. For
   *          basic plugins, a wrapper function that initializes the plugin.
   */
  static registerPlugin(name, plugin) {
    if (typeof name !== 'string') {
      throw new Error(`Illegal plugin name, "${name}", must be a string, was ${typeof name}.`);
    }

    if (pluginExists(name)) {
      log.warn(`A plugin named "${name}" already exists. You may want to avoid re-registering plugins!`);
    } else if (Player.prototype.hasOwnProperty(name)) {
      throw new Error(`Illegal plugin name, "${name}", cannot share a name with an existing player method!`);
    }

    if (typeof plugin !== 'function') {
      throw new Error(`Illegal plugin for "${name}", must be a function, was ${typeof plugin}.`);
    }

    pluginStorage[name] = plugin;

    // Add a player prototype method for all sub-classed plugins (but not for
    // the base Plugin class).
    if (name !== BASE_PLUGIN_NAME) {
      if (Plugin.isBasic(plugin)) {
        Player.prototype[name] = createBasicPlugin(name, plugin);
      } else {
        Player.prototype[name] = createPluginFactory(name, plugin);
      }
    }

    return plugin;
  }

  /**
   * De-register a Video.js plugin.
   *
   * @param {string} name
   *        The name of the plugin to be deregistered.
   */
  static deregisterPlugin(name) {
    if (name === BASE_PLUGIN_NAME) {
      throw new Error('Cannot de-register base plugin.');
    }
    if (pluginExists(name)) {
      delete pluginStorage[name];
      delete Player.prototype[name];
    }
  }

  /**
   * Gets an object containing multiple Video.js plugins.
   *
   * @param   {Array} [names]
   *          If provided, should be an array of plugin names. Defaults to _all_
   *          plugin names.
   *
   * @returns {Object|undefined}
   *          An object containing plugin(s) associated with their name(s) or
   *          `undefined` if no matching plugins exist).
   */
  static getPlugins(names = Object.keys(pluginStorage)) {
    let result;

    names.forEach(name => {
      const plugin = getPlugin(name);

      if (plugin) {
        result = result || {};
        result[name] = plugin;
      }
    });

    return result;
  }

  /**
   * Gets a plugin's version, if available
   *
   * @param   {string} name
   *          The name of a plugin.
   *
   * @returns {string}
   *          The plugin's version or an empty string.
   */
  static getPluginVersion(name) {
    const plugin = getPlugin(name);

    return plugin && plugin.VERSION || '';
  }
}

/**
 * Gets a plugin by name if it exists.
 *
 * @static
 * @method   getPlugin
 * @memberOf Plugin
 * @param    {string} name
 *           The name of a plugin.
 *
 * @returns  {Function|undefined}
 *           The plugin (or `undefined`).
 */
Plugin.getPlugin = getPlugin;

/**
 * The name of the base plugin class as it is registered.
 *
 * @type {string}
 */
Plugin.BASE_PLUGIN_NAME = BASE_PLUGIN_NAME;

Plugin.registerPlugin(BASE_PLUGIN_NAME, Plugin);

/**
 * Documented in player.js
 *
 * @ignore
 */
Player.prototype.usingPlugin = function(name) {
  return !!this[PLUGIN_CACHE_KEY] && this[PLUGIN_CACHE_KEY][name] === true;
};

/**
 * Documented in player.js
 *
 * @ignore
 */
Player.prototype.hasPlugin = function(name) {
  return !!pluginExists(name);
};

export default Plugin;

/**
 * Signals that a plugin is about to be set up on a player.
 *
 * @event    Player#beforepluginsetup
 * @type     {Plugin~PluginEventHash}
 */

/**
 * Signals that a plugin is about to be set up on a player - by name. The name
 * is the name of the plugin.
 *
 * @event    Player#beforepluginsetup:$name
 * @type     {Plugin~PluginEventHash}
 */

/**
 * Signals that a plugin has just been set up on a player.
 *
 * @event    Player#pluginsetup
 * @type     {Plugin~PluginEventHash}
 */

/**
 * Signals that a plugin has just been set up on a player - by name. The name
 * is the name of the plugin.
 *
 * @event    Player#pluginsetup:$name
 * @type     {Plugin~PluginEventHash}
 */

/**
 * @typedef  {Object} Plugin~PluginEventHash
 *
 * @property {string} instance
 *           For basic plugins, the return value of the plugin function. For
 *           advanced plugins, the plugin instance on which the event is fired.
 *
 * @property {string} name
 *           The name of the plugin.
 *
 * @property {string} plugin
 *           For basic plugins, the plugin function. For advanced plugins, the
 *           plugin class/constructor.
 */
