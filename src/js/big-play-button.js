var BigPlayButton, Button;

Button = require('./button.js');

/* Big Play Button
================================================================================ */
/**
 * Initial play button. Shows before the video has played. The hiding of the
 * big play button is done via CSS and player states.
 * @param {vjs.Player|Object} player
 * @param {Object=} options
 * @class
 * @constructor
 */
BigPlayButton = Button.extend();

BigPlayButton.prototype.createEl = function(){
  return Button.prototype.createEl.call(this, 'div', {
    className: 'vjs-big-play-button',
    innerHTML: '<span aria-hidden="true"></span>',
    'aria-label': 'play video'
  });
};

BigPlayButton.prototype.onClick = function(){
  this.player_.play();
};

module.exports = BigPlayButton;
