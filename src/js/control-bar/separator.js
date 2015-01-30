/**
* Just an empty separator element that can be used as an append point for plugins, etc.
* Also can be used to create space between elements when necessary.
*
* @param {vjs.Player|Object} player
* @param {Object=} options
* @constructor
*/
vjs.Separator = vjs.Component.extend({
  /** @constructor */
  init: function(player, options){
    vjs.Component.call(this, player, options);
  }
});

vjs.Separator.prototype.createEl = function(){
  return vjs.Component.prototype.createEl.call(this, 'div', {
    className: 'vjs-separator-control'
  });
};
