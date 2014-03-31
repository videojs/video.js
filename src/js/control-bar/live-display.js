/**
 * Displays the live indicator
 * TODO - Future make it click to snap to live
 * @param {vjs.Player|Object} player
 * @param {Object=} options
 * @constructor
 */
vjs.LiveDisplay = vjs.Component.extend({
  init: function(player, options){
    vjs.Component.call(this, player, options);

    player.on('loadstart', vjs.bind(this, this.updateContent));
  }
});

vjs.LiveDisplay.prototype.createEl = function(){
  var el = vjs.Component.prototype.createEl.call(this, 'div', {
    className: 'vjs-live-controls vjs-control'
  });

  this.contentEl_ = vjs.createEl('div', {
    className: 'vjs-live-display',
    innerHTML: '<span class="vjs-control-text">LIVE</span>LIVE',
    'aria-live': 'off'
  });

  el.appendChild(this.contentEl_);

  return el;
};

vjs.LiveDisplay.prototype.updateContent = function(){

  // Most Live streams, like RTMP, will report a duration value of -1
  // HLS Live report window.INFINITY

  /*
  if (player.duration() < 0 || player.duration() === window.INFINITY) {
    this.show();
  } else {
    this.hide();
  }
  */
};