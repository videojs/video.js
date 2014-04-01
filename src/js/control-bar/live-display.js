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
  }
});

vjs.LiveDisplay.prototype.createEl = function(){
  var el = vjs.Component.prototype.createEl.call(this, 'div', {
    className: 'vjs-live-controls vjs-control'
  });

  this.contentEl_ = vjs.createEl('div', {
    className: 'vjs-live-display',
    innerHTML: '<span class="vjs-control-text">Stream Type </span>LIVE',
    'aria-live': 'off'
  });

  el.appendChild(this.contentEl_);

  return el;
};
