/**
 * @file plugins.js
 * @module plugins
 */
import log from './utils/log';
import Player from './player';
import Plugin from './plugin';

/**
 * Store all available plugins.
 *
 * @type {Object}
 */
const plugins = {};

/**
 * Normalize the second argument to `registerPlugin` into an object.
 *
 * @param  {Function|Object} plugin
 * @return {Object}
 */
const normalizePlugin = (plugin) => {
  if (plugin !== null && typeof plugin === 'object') {
    return plugin;
  }
  return {
    deinit() {},
    dispose() {},
    init: plugin
  };
};

/**
 *
 * The method for registering a video.js plugin. {@link videojs:videojs.registerPlugin].
 *
 * @param {string} name
 *        The name of the plugin that is being registered
 *
 * @param {plugins:PluginFn} init
 *         A plugin object with an `init` method and optional `dispose`
 *         method. As a short-cut, a function can be provided, which will
 *         be used as the init for your plugin.
 */
const registerPlugin = function(name, plugin) {
  const normalized = normalizePlugin(plugin);

  if (typeof name !== 'string' || !name.trim()) {
    throw new Error('illegal plugin name; must be non-empty string');
  }

  if (plugins[name]) {
    throw new Error('illegal plugin name; already exists');
  }

  if (typeof normalized.init !== 'function') {
    throw new Error('illegal plugin init method; must be a function');
  }

  if (normalized.dispose && typeof normalized.dispose !== 'function') {
    throw new Error('illegal plugin dipose method; must be a function');
  }

  // Create a private plugin object, which is used to create Plugin objects
  // when a plugin is accessed on a player.
  plugins[name] = normalized;

  // Support old-style plugin initialization.
  Player.prototype[name] = function(...args) {
    log.warn(`initializing plugins via custom player method names is deprecated as of video.js 6.0. instead of calling this.${name}(), use this.plugin('${name}').init()`);
    this.plugin(name).init(...args);
  };

  // If using the old style of passing just an init function, copy own
  // properties from the init (such as `VERSION`) onto the plugin object,
  // excluding "reserved" keys that are already found on the created plugin
  // object. This prevents weird scenarios like overriding `plugin.init`.
  if (typeof plugin === 'function') {
    const reserved = Object.keys(plugins[name]);

    Object.keys(plugin)
      .filter(k => reserved.indexOf(k) === -1)
      .forEach(k => {
        plugins[name][k] = plugin[k];
      });
  }
};

/**
 * This is documented in the Player component, but defined here because it
 * needs to be to avoid circular dependencies.
 *
 * @ignore
 */
Player.prototype.plugin = function(name) {
  if (!this.plugins_[name]) {
    this.plugins_[name] = new Plugin(this, name, plugins[name]);
  }

  return this.plugins_[name];
};

export default registerPlugin;
