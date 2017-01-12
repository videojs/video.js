'use strict';

exports.__esModule = true;

var _player = require('./player.js');

var _player2 = _interopRequireDefault(_player);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

/**
 * The method for registering a video.js plugin. {@link videojs:videojs.registerPlugin].
 *
 * @param {string} name
 *        The name of the plugin that is being registered
 *
 * @param {plugins:PluginFn} init
 *        The function that gets run when a `Player` initializes.
 */
var plugin = function plugin(name, init) {
  _player2['default'].prototype[name] = init;
}; /**
    * @file plugins.js
    * @module plugins
    */
exports['default'] = plugin;
