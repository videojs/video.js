var FullscreenToggle, Button;

Button = require('../button.js');

/**
 * Toggle fullscreen video
 * @param {vjs.Player|Object} player
 * @param {Object=} options
 * @class
 * @extends vjs.Button
 */
FullscreenToggle = Button.extend({
  /**
   * @constructor
   * @memberof vjs.FullscreenToggle
   * @instance
   */
  init: function(player, options){
    Button.call(this, player, options);
  }
});

FullscreenToggle.prototype.buttonText = 'Fullscreen';

FullscreenToggle.prototype.buildCSSClass = function(){
  return 'vjs-fullscreen-control ' + Button.prototype.buildCSSClass.call(this);
};

FullscreenToggle.prototype.onClick = function(){
  if (!this.player_.isFullscreen()) {
    this.player_.requestFullscreen();
    this.controlText_.innerHTML = 'Non-Fullscreen';
  } else {
    this.player_.exitFullscreen();
    this.controlText_.innerHTML = 'Fullscreen';
  }
};

module.exports = FullscreenToggle;
