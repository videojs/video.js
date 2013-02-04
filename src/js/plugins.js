goog.provide('vjs.plugin');

vjs.plugin = function(name, init){
  vjs.Player.prototype[name] = init;
};