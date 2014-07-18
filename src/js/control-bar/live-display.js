var LiveDisplay, Component, vjslib;

Component = require('../component.js');
vjslib = require('../lib.js');

/**
 * Displays the live indicator
 * TODO - Future make it click to snap to live
 * @param {vjs.Player|Object} player
 * @param {Object=} options
 * @constructor
 */
LiveDisplay = Component.extend({
  init: function(player, options){
    Component.call(this, player, options);
  }
});

LiveDisplay.prototype.createEl = function(){
  var el = Component.prototype.createEl.call(this, 'div', {
    className: 'vjs-live-controls vjs-control'
  });

  this.contentEl_ = vjslib.createEl('div', {
    className: 'vjs-live-display',
    innerHTML: '<span class="vjs-control-text">Stream Type </span>LIVE',
    'aria-live': 'off'
  });

  el.appendChild(this.contentEl_);

  return el;
};

module.exports = LiveDisplay;
