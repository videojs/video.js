/**
 * Display that an error has occurred making the video unplayable
 * @param {vjs.Player|Object} player
 * @param {Object=} options
 * @constructor
 */
vjs.ErrorDisplay = vjs.Component.extend({
  init: function(player, options){
    vjs.Component.call(this, player, options);
  }
});

vjs.ErrorDisplay.prototype.createEl = function(){
  var el = vjs.Component.prototype.createEl.call(this, 'div', {
    className: 'vjs-error-display'
  });

  return el;
};
