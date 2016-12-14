/**
 * @file plugin.js
 */
import evented from './mixins/evented';
import stateful from './mixins/stateful';
import * as Events from './utils/events';
import * as Fn from './utils/fn';
import Player from './player';

/**
 * @typedef {Object} plugin:AdvancedEventHash
 *
 * @property {string} instance
 *           The plugin instance on which the event is fired.
 *
 * @property {string} name
 *           The name of the plugin.
 *
 * @property {string} plugin
 *           The plugin class/constructor.
 */

/**
 * @typedef {Object} plugin:BasicEventHash
 *
 * @property {string} instance
 *           The return value of the plugin function.
 *
 * @property {string} name
 *           The name of the plugin.
 *
 * @property {string} plugin
 *           The plugin function.
 */

/**
 * The base plugin name.
 *
 * @private
 * @type {string}
 */
const BASE_PLUGIN_NAME = 'plugin';

/**
 * The key on which a player's active plugins cache is stored.
 *
 * @private
 * @type {string}
 */
const PLUGIN_CACHE_KEY = 'activePlugins_';

/**
 * Stores registered plugins in a private space.
 *
 * @private
 * @type {Object}
 */
const pluginStorage = {};

/**
 * Reports whether or not a plugin has been registered.
 *
 * @private
 * @param  {string} name
 *         The name of a plugin.
 *
 * @return {boolean}
 *         Whether or not the plugin has been registered.
 */
const pluginExists = (name) => pluginStorage.hasOwnProperty(name);

/**
 * Get a single registered plugin by name.
 *
 * @private
 * @param  {string} name
 *         The name of a plugin.
 *
 * @return {Function|undefined}
 *         The plugin (or undefined).
 */
const getPlugin = (name) => pluginExists(name) ? pluginStorage[name] : undefined;

/**
 * Marks a plugin as "active" on a player.
 *
 * Also, ensures that the player has an object for tracking active plugins.
 *
 * @private
 * @param  {Player} player
 *         A Video.js player instance.
 *
 * @param  {string} name
 *         The name of a plugin.
 */
const markPluginAsActive = (player, name) => {
  player[PLUGIN_CACHE_KEY] = player[PLUGIN_CACHE_KEY] || {};
  player[PLUGIN_CACHE_KEY][name] = true;
};

/**
 * Takes a basic plugin function and returns a wrapper function which marks
 * on the player that the plugin has been activated.
 *
 * @private
 * @param  {string} name
 *         The name of the plugin.
 *
 * @param  {Function} plugin
 *         The basic plugin.
 *
 * @return {Function}
 *         A wrapper function for the given plugin.
 */
const createBasicPlugin = (name, plugin) => function() {
  const instance = plugin.apply(this, arguments);

  markPluginAsActive(this, name);

  // We trigger the "pluginsetup" event on the player regardless, but we want
  // the hash to be consistent with the hash provided for advanced plugins.
  // The only potentially counter-intuitive thing here is the `instance` is the
  // value returned by the `plugin` function.
  this.trigger('pluginsetup', {name, plugin, instance});
  return instance;
};

/**
 * Takes a plugin sub-class and returns a factory function for generating
 * instances of it.
 *
 * This factory function will replace itself with an instance of the requested
 * sub-class of Plugin.
 *
 * @private
 * @param  {string} name
 *         The name of the plugin.
 *
 * @param  {Plugin} PluginSubClass
 *         The advanced plugin.
 *
 * @return {Function}
 *         A factory function for the plugin sub-class.
 */
const createPluginFactory = (name, PluginSubClass) => {

  // Add a `name` property to the plugin prototype so that each plugin can
  // refer to itself by name.
  PluginSubClass.prototype.name = name;

  return function(...args) {
    const instance = new PluginSubClass(...[this, ...args]);

    // The plugin is replaced by a function that returns the current instance.
    this[name] = () => instance;

    return instance;
  };
};

class Plugin {

  /**
   * Plugin constructor.
   *
   * Subclasses should call `super` to ensure plugins are properly initialized.
   *
   * @fires Plugin#pluginsetup
   * @param {Player} player
   *        A Video.js player instance.
   */
  constructor(player) {
    this.player = player;

    if (this.constructor === Plugin) {
      throw new Error('Plugin must be sub-classed; not directly instantiated.');
    }

    // Make this object evented, but remove the added `trigger` method so we
    // use the prototype version instead.
    evented(this);
    delete this.trigger;

    stateful(this, this.constructor.defaultState);
    markPluginAsActive(player, this.name);

    // Bind all plugin prototype methods to this object.
    Object.keys(Plugin.prototype).forEach(k => {
      if (typeof this[k] === 'function') {
        this[k] = Fn.bind(this, this[k]);
      }
    });

    // If the player is disposed, dispose the plugin.
    player.on('dispose', this.dispose);

    /**
     * Signals that a plugin (both basic and advanced) has just been set up
     * on a player.
     *
     * @event Plugin#pluginsetup
     * @type {EventTarget~Event}
     */
    player.trigger('pluginsetup', this.getEventHash_());
  }

  /**
   * Each event triggered by plugins includes a hash of additional data with
   * conventional properties.
   *
   * This returns that object or mutates an existing hash.
   *
   * @private
   * @param  {Object} [hash={}]
   *         An object to be used as event an event hash.
   *
   * @return {plugin:AdvancedEventHash}
   *         An event hash object with provided properties mixed-in.
   */
  getEventHash_(hash = {}) {
    hash.name = this.name;
    hash.plugin = this.constructor;
    hash.instance = this;
    return hash;
  }

  /**
   * Triggers an event on the plugin object.
   *
   * @param  {Event|Object|string} event
   *         A string (the type) or an event object with a type attribute.
   *
   * @param  {plugin:AdvancedEventHash} [hash={}]
   *         Additional data hash to pass along with the event.
   *
   * @return {boolean}
   *         Whether or not default was prevented.
   */
  trigger(event, hash = {}) {
    return Events.trigger(this.eventBusEl_, event, this.getEventHash_(hash));
  }

  /**
   * Handles "statechanged" events on the plugin. No-op by default, override by
   * subclassing.
   *
   * @abstract
   * @param {Event} e
   *        An event object provided by a "statechanged" event.
   *
   * @param {Object} e.changes
   *        An object describing changes that occurred with the "statechanged"
   *        event.
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
     * @type {EventTarget~Event}
     */
    this.trigger('dispose');
    this.off();

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
   * @param  {string|Function} plugin
   *         If a string, matches the name of a plugin. If a function, will be
   *         tested directly.
   *
   * @return {boolean}
   *         Whether or not a plugin is a basic plugin.
   */
  static isBasic(plugin) {
    const p = (typeof plugin === 'string') ? getPlugin(plugin) : plugin;

    return typeof p === 'function' && !Plugin.prototype.isPrototypeOf(p.prototype);
  }

  /**
   * Register a Video.js plugin.
   *
   * @param  {string} name
   *         The name of the plugin to be registered. Must be a string and
   *         must not match an existing plugin or a method on the `Player`
   *         prototype.
   *
   * @param  {Function} plugin
   *         A sub-class of `Plugin` or a function for basic plugins.
   *
   * @return {Function}
   *         For advanced plugins, a factory function for that plugin. For
   *         basic plugins, a wrapper function that initializes the plugin.
   */
  static registerPlugin(name, plugin) {
    if (typeof name !== 'string') {
      throw new Error(`Illegal plugin name, "${name}", must be a string, was ${typeof name}.`);
    }

    if (pluginExists(name) || Player.prototype.hasOwnProperty(name)) {
      throw new Error(`Illegal plugin name, "${name}", already exists.`);
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
   * @param  {string} name
   *         The name of the plugin to be deregistered.
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
   * @param  {Array} [names]
   *         If provided, should be an array of plugin names. Defaults to _all_
   *         plugin names.
   *
   * @return {Object|undefined}
   *         An object containing plugin(s) associated with their name(s) or
   *         `undefined` if no matching plugins exist).
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
   * Gets a plugin by name if it exists.
   *
   * @param  {string} name
   *         The name of a plugin.
   *
   * @return {Function|undefined}
   *         The plugin (or `undefined`).
   */
  static getPlugin(name) {
    return getPlugin(name);
  }

  /**
   * Gets a plugin's version, if available
   *
   * @param  {string} name
   *         The name of a plugin.
   *
   * @return {string}
   *         The plugin's version or an empty string.
   */
  static getPluginVersion(name) {
    const plugin = getPlugin(name);

    return plugin && plugin.VERSION || '';
  }
}

Plugin.registerPlugin(BASE_PLUGIN_NAME, Plugin);

/**
 * The name of the base plugin class as it is registered.
 *
 * @type {string}
 */
Plugin.BASE_PLUGIN_NAME = BASE_PLUGIN_NAME;

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
