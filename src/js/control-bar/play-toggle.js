var PlayToggle, Button, vjslib;

Button = require('../button.js');
vjslib = require('../lib.js');

/**
 * Button to toggle between play and pause
 * @param {vjs.Player|Object} player
 * @param {Object=} options
 * @class
 * @constructor
 */
PlayToggle = Button.extend({
  /** @constructor */
  init: function(player, options){
    Button.call(this, player, options);

    player.on('play', vjslib.bind(this, this.onPlay));
    player.on('pause', vjslib.bind(this, this.onPause));
  }
});

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
  vjslib.removeClass(this.el_, 'vjs-paused');
  vjslib.addClass(this.el_, 'vjs-playing');
  this.el_.children[0].children[0].innerHTML = 'Pause'; // change the button text to "Pause"
};

  // OnPause - Add the vjs-paused class to the element so it can change appearance
PlayToggle.prototype.onPause = function(){
  vjslib.removeClass(this.el_, 'vjs-playing');
  vjslib.addClass(this.el_, 'vjs-paused');
  this.el_.children[0].children[0].innerHTML = 'Play'; // change the button text to "Play"
};

module.exports = PlayToggle;
