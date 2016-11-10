/**
 * @file plugin.js
 */
import evented from './mixins/evented';
import stateful from './mixins/stateful';
import * as Events from './utils/events';
import * as Fn from './utils/fn';
import Player from './player';

/**
 * The base plugin name.
 *
 * @private
 * @type {String}
 */
const BASE_PLUGIN_NAME = 'plugin';

/**
 * Stores registered plugins in a private space.
 *
 * @private
 * @type {Object}
 */
const pluginStorage = {};

/**
 * Takes a basic plugin function and returns a wrapper function which marks
 * on the player that the plugin has been activated.
 *
 * @private
 * @return {Function}
 */
const createBasicPlugin = (name, plugin) => function() {
  const instance = plugin.apply(this, arguments);

  this.plugins_[name] = true;

  // We trigger the "pluginsetup" event on the player regardless, but we want
  // the hash to be consistent with the hash provided for class-based plugins.
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
 * @return {Function}
 */
const createPluginFactory = (name, PluginSubClass) => {

  // Add a `name` property to the plugin prototype so that each plugin can
  // refer to itself by name.
  PluginSubClass.prototype.name = name;

  return function(...args) {
    this[name] = new PluginSubClass(...[this, ...args]);
    return this[name];
  };
};

class Plugin {

  /**
   * Plugin constructor.
   *
   * Subclasses should make sure they call `super` in order to make sure their
   * plugins are properly initialized.
   *
   * @param {Player} player
   */
  constructor(player) {
    this.player = player;
    evented(this, {exclude: ['trigger']});
    stateful(this, this.constructor.defaultState);
    player.plugins_[this.name] = true;
    player.one('dispose', Fn.bind(this, this.dispose));
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
   * @return {Object}
   *         - `instance`: The plugin instance on which the event is fired.
   *         - `name`: The name of the plugin.
   *         - `plugin`: The plugin class/constructor.
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
   * @param  {Event|Object|String} event
   *         A string (the type) or an event object with a type attribute.
   *
   * @param  {Object} [hash={}]
   *         Additional data hash to pass along with the event. In this case,
   *         several properties are added to the hash:
   *
   *         - `instance`: The plugin instance on which the event is fired.
   *         - `name`: The name of the plugin.
   *         - `plugin`: The plugin class/constructor.
   *
   * @return {Boolean}
   *         Whether or not default was prevented.
   */
  trigger(event, hash = {}) {
    return Events.trigger(this.eventBusEl_, event, this.getEventHash_(hash));
  }

  /**
   * Disposes a plugin.
   *
   * Subclasses can override this if they want, but for the sake of safety,
   * it's probably best to subscribe to one of the disposal events.
   */
  dispose() {
    const {name, player} = this;

    this.trigger('dispose');
    this.off();

    // Eliminate any possible sources of leaking memory by clearing up references
    // between the player and the plugin instance and nulling out the plugin's
    // state and replacing methods with a function that throws.
    player.plugins_[name] = false;
    this.player = this.state = null;

    this.dispose = () => {
      throw new Error('cannot call methods on a disposed object');
    };

    this.setState = this.off = this.on = this.one = this.trigger = this.dispose;

    // Finally, replace the plugin name on the player with a new factory
    // function, so that the plugin is ready to be set up again.
    player[name] = createPluginFactory(name, pluginStorage[name]);
  }

  /**
   * Determines if a plugin is a "basic" plugin (i.e. not a sub-class of `Plugin`).
   *
   * @param  {String|Function} plugin
   *         If a string, matches the name of a plugin. If a function, will be
   *         tested directly.
   * @return {Boolean}
   */
  static isBasic(plugin) {
    plugin = (typeof plugin === 'string') ? Plugin.getPlugin(plugin) : plugin;

    return typeof plugin === 'function' &&
      !Plugin.prototype.isPrototypeOf(plugin.prototype);
  }

  /**
   * Register a Video.js plugin
   *
   * @param  {String} name
   * @param  {Function} plugin
   *         A sub-class of `Plugin` or an anonymous function for basic plugins.
   * @return {Function}
   */
  static registerPlugin(name, plugin) {
    if (typeof name !== 'string') {
      throw new Error(`illegal plugin name, "${name}", must be a string, was ${typeof name}`);
    }

    if (pluginStorage[name] || Player.prototype[name]) {
      throw new Error(`illegal plugin name, "${name}", already exists`);
    }

    if (typeof plugin !== 'function') {
      throw new Error(`illegal plugin for "${name}", must be a function, was ${typeof plugin}`);
    }

    pluginStorage[name] = plugin;

    if (Plugin.isBasic(plugin)) {
      Player.prototype[name] = createBasicPlugin(name, plugin);
    } else {
      Player.prototype[name] = createPluginFactory(name, plugin);
    }

    return plugin;
  }

  /**
   * De-register a Video.js plugin.
   *
   * This is mostly used for testing, but may potentially be useful in advanced
   * player workflows.
   *
   * @param  {String} name
   */
  static deregisterPlugin(name) {
    if (name === BASE_PLUGIN_NAME) {
      throw new Error('cannot de-register base plugin');
    }
    if (pluginStorage.hasOwnProperty(name)) {
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
   * @return {Object}
   */
  static getPlugins(names = Object.keys(pluginStorage)) {
    let result;

    names.forEach(name => {
      const plugin = this.getPlugin(name);

      if (plugin) {
        result = result || {};
        result[name] = plugin;
      }
    });

    return result;
  }

  /**
   * Gets a plugin by name
   *
   * @param  {[type]} name [description]
   * @return {[type]}      [description]
   */
  static getPlugin(name) {
    return pluginStorage[name] || Player.prototype[name];
  }

  /**
   * Gets a plugin's version, if available
   *
   * @param  {String} name
   * @return {String}
   */
  static getPluginVersion(name) {
    const plugin = Plugin.getPlugin(name);

    return plugin && plugin.VERSION || '';
  }
}

Plugin.registerPlugin(BASE_PLUGIN_NAME, Plugin);

export default Plugin;
