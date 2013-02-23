vjs.plugin = function(name, init){
  vjs.Player.prototype[name] = init;
};
