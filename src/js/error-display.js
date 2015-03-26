import Component from './component';
import * as Lib from './lib';

/**
 * Display that an error has occurred making the video unplayable
 * @param {vjs.Player|Object} player
 * @param {Object=} options
 * @constructor
 */
let ErrorDisplay = Component.extend({
  init: function(player, options){
    Component.call(this, player, options);

    this.update();
    this.on(player, 'error', this.update);
  }
});

Component.registerComponent('ErrorDisplay', ErrorDisplay);

ErrorDisplay.prototype.createEl = function(){
  var el = Component.prototype.createEl.call(this, 'div', {
    className: 'vjs-error-display'
  });

  this.contentEl_ = Lib.createEl('div');
  el.appendChild(this.contentEl_);

  return el;
};

ErrorDisplay.prototype.update = function(){
  if (this.player().error()) {
    this.contentEl_.innerHTML = this.localize(this.player().error().message);
  }
};

export default ErrorDisplay;
