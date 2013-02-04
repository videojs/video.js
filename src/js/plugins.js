goog.provide('vjs.plugin');

vjs.plugins = {};

vjs.plugin = function(name, init){
  vjs.Player.prototype[name] = init;
};