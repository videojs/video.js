/**
 * @file plugins.js
 */
import Player from './player.js';

/**
 * The method for registering a video.js plugin
 *
 * @param  {String} name The name of the plugin
 * @param  {Function} init The function that is run when the player inits
 * @method plugin
 */
var plugin = function(name, init){
  Player.prototype[name] = init;
};

export default plugin;
