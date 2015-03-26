import Button from '../button';
import Component from '../component';
import * as Lib from '../lib';

/**
 * Button to toggle between play and pause
 * @param {vjs.Player|Object} player
 * @param {Object=} options
 * @class
 * @constructor
 */
var PlayToggle = Button.extend({
  /** @constructor */
  init: function(player, options){
    Button.call(this, player, options);

    this.on(player, 'play', this.onPlay);
    this.on(player, 'pause', this.onPause);
  }
});

Component.registerComponent('PlayToggle', PlayToggle);

PlayToggle.prototype.buttonText = 'Play';

PlayToggle.prototype.buildCSSClass = function(){
  return 'vjs-play-control ' + Button.prototype.buildCSSClass.call(this);
};

// OnClick - Toggle between play and pause
PlayToggle.prototype.onClick = function(){
  if (this.player_.paused()) {
    this.player_.play();
  } else {
    this.player_.pause();
  }
};

  // OnPlay - Add the vjs-playing class to the element so it can change appearance
PlayToggle.prototype.onPlay = function(){
  this.removeClass('vjs-paused');
  this.addClass('vjs-playing');
  this.el_.children[0].children[0].innerHTML = this.localize('Pause'); // change the button text to "Pause"
};

  // OnPause - Add the vjs-paused class to the element so it can change appearance
PlayToggle.prototype.onPause = function(){
  this.removeClass('vjs-playing');
  this.addClass('vjs-paused');
  this.el_.children[0].children[0].innerHTML = this.localize('Play'); // change the button text to "Play"
};

export default PlayToggle;
