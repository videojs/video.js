/**
 * @file plugin.js
 */
import stateful from './mixins/stateful';
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
  const result = plugin.apply(this, arguments);

  this.activePlugins_[name] = true;
  this.trigger('pluginsetup', name, result);
  return result;
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
    stateful(this, this.constructor.defaultState);
    player.on('dispose', Fn.bind(this, this.dispose));
    player.activePlugins_[this.name] = true;
    player.trigger('pluginsetup', this.name, this);
  }

  /**
   * Disposes a plugin.
   *
   * Subclasses can override this if they want, but for the sake of safety,
   * it's probably best to subscribe to one of the disposal events.
   */
  dispose() {
    const {name, player, state} = this;
    const props = {name, player, state};

    this.off();
    player.activePlugins_[name] = false;

    // Eliminate possible sources of leaking memory.
    this.player[name] = createPluginFactory(name, pluginCache[name]);
    this.player = this.state = null;
    this.trigger('dispose', this, props);
  }

  /**
   * Gets the version of the plugin, if known.
   *
   * This will look for a `VERSION` property on the plugin subclass.
   *
   * @return {String} [description]
   */
  static version() {
    return this.VERSION || '';
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
   * Register a video.js plugin
   *
   * @param  {String} name
   * @param  {Function} plugin
   *         A sub-class of `Plugin` or an anonymous function for simple plugins.
   * @return {Function}
   */
  static registerPlugin(name, plugin) {
    if (pluginCache[name] || Player.prototype[name]) {
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
   * Gets an object containing all plugins.
   *
   * @return {Object}
   */
  static getPlugins() {
    return Obj.assign({}, pluginCache);
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

    return plugin && plugin.version() || '';
  }
}

Plugin.registerPlugin('plugin', Plugin);

export default Plugin;
