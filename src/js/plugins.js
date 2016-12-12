/**
 * @file plugins.js
 * @module plugins
 */
import Player from './player.js';

/**
 * The method for registering a video.js plugin. {@link videojs:videojs.registerPlugin].
 *
 * @param {string} name
 *        The name of the plugin that is being registered
 *
 * @param {plugins:PluginFn} init
 *        The function that gets run when a `Player` initializes.
 */
const plugin = function(name, init) {
  Player.prototype[name] = init;
};

export default plugin;
