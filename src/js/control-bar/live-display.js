import Component from '../component';
import * as Lib from '../lib';

/**
 * Displays the live indicator
 * TODO - Future make it click to snap to live
 * @param {vjs.Player|Object} player
 * @param {Object=} options
 * @constructor
 */
var LiveDisplay = Component.extend({
  init: function(player, options){
    Component.call(this, player, options);
  }
});

Component.registerComponent('LiveDisplay', LiveDisplay);

LiveDisplay.prototype.createEl = function(){
  var el = Component.prototype.createEl.call(this, 'div', {
    className: 'vjs-live-controls vjs-control'
  });

  this.contentEl_ = Lib.createEl('div', {
    className: 'vjs-live-display',
    innerHTML: '<span class="vjs-control-text">' + this.localize('Stream Type') + '</span>' + this.localize('LIVE'),
    'aria-live': 'off'
  });

  el.appendChild(this.contentEl_);

  return el;
};

export default LiveDisplay;
