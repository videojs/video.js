/**
 * @file plugin.js
 */
import eventful from './decorators/eventful';
import stateful from './decorators/stateful';
import * as Events from './utils/events';
import * as Fn from './utils/fn';
import * as Obj from './utils/obj';
import EventTarget from './event-target';
import Player from './player';

/**
 * Stores registered plugins in a private space.
 *
 * @private
 * @type {Object}
 */
const pluginCache = {};

/**
 * Takes a basic plugin function and returns a wrapper function which marks
 * on the player that the plugin has been activated.
 *
 * @private
 * @return {Function}
 */
const createBasicPlugin = (name, plugin) => function() {
  const instance = plugin.apply(this, arguments);

  this.activePlugins_[name] = true;

  // We trigger the "pluginsetup" event regardless, but we want the hash to
  // be consistent. The only odd thing here is the `instance` is the value
  // returned by the `plugin` function (instead of, necessarily, an instance
  // of it).
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
  // refer to itself.
  PluginSubClass.prototype.name = name;

  return function(...args) {
    this[name] = new PluginSubClass(...[this, ...args]);
    return this[name];
  };
};

class Plugin extends EventTarget {

  /**
   * Plugin constructor.
   *
   * Subclasses should make sure they call `super` in order to make sure their
   * plugins are properly initialized.
   *
   * @param {Player} player
   */
  constructor(player) {
    super();
    this.player = player;

    eventful(this, ['trigger']);
    stateful(this, this.constructor.defaultState);

    player.on('dispose', Fn.bind(this, this.dispose));
    player.activePlugins_[this.name] = true;
    player.trigger('pluginsetup', this.getEventHash_());
  }

  /**
   * Each event triggered by plugins includes a hash of additional data with
   * conventional properties.
   *
   * This returns that object or mutates an existing hash.
   *
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
   *         Additional data hash to pass along with the event.
   *
   * @return {Boolean}
   *         Whether or not default was prevented.
   */
  trigger(event, hash = {}) {
    return Events.trigger(this, event, this.getEventHash_(hash));
  }

  /**
   * Disposes a plugin.
   *
   * Subclasses can override this if they want, but for the sake of safety,
   * it's probably best to subscribe to one of the disposal events.
   */
  dispose() {
    this.off();
    this.player.activePlugins_[this.name] = false;
    this.trigger('dispose');

    // Eliminate possible sources of leaking memory.
    this.player[this.name] = createPluginFactory(this.name, pluginCache[this.name]);
    this.player = this.state = null;
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
    if (typeof name !== 'string' || pluginCache[name] || Player.prototype[name]) {
      throw new Error(`illegal plugin name, "${name}"`);
    }

    if (typeof plugin !== 'function') {
      throw new Error(`illegal plugin for "${name}", must be a function, was ${typeof plugin}`);
    }

    pluginCache[name] = plugin;

    if (Plugin.isBasic(plugin)) {
      Player.prototype[name] = createBasicPlugin(name, plugin);
    } else {
      Player.prototype[name] = createPluginFactory(name, plugin);
    }

    return plugin;
  }

  /**
   * Register multiple plugins via an object where the keys are plugin names
   * and the values are sub-classes of `Plugin` or anonymous functions for
   * basic plugins.
   *
   * @param  {Object} plugins
   * @return {Object}
   *         An object containing plugins that were added.
   */
  static registerPlugins(plugins) {
    Obj.each(plugins, (value, key) => this.registerPlugin(key, value));
    return plugins;
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
    if (pluginCache.hasOwnProperty(name)) {
      delete pluginCache[name];
      delete Player.prototype[name];
    }
  }

  /**
   * De-register multiple Video.js plugins.
   *
   * @param  {Array} [names]
   *         If provided, should be an array of plugin names. Defaults to _all_
   *         plugin names.
   */
  static deregisterPlugins(names = Object.keys(pluginCache)) {
    names.forEach(name => this.deregisterPlugin(name));
  }

  /**
   * Gets an object containing multiple Video.js plugins.
   *
   * @param  {Array} [names]
   *         If provided, should be an array of plugin names. Defaults to _all_
   *         plugin names.
   * @return {Object}
   */
  static getPlugins(names = Object.keys(pluginCache)) {
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
    return pluginCache[name] || Player.prototype[name];
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

Plugin.registerPlugin('plugin', Plugin);

export default Plugin;
