var Player = require('./player.js');

/**
 * the method for registering a video.js plugin
 *
 * @param  {String} name The name of the plugin
 * @param  {Function} init The function that is run when the player inits
 */
module.exports = function plugin(name, init){
  Player.prototype[name] = init;
};
