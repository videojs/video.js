import Button from './button.js';
import Component from './component.js';

/* Big Play Button
================================================================================ */
/**
 * Initial play button. Shows before the video has played. The hiding of the
 * big play button is done via CSS and player states.
 * @param {Player|Object} player
 * @param {Object=} options
 * @class
 * @constructor
 */
class BigPlayButton extends Button {

  buildCSSClass() {
    return 'vjs-big-play-button';
  }

  handleClick() {
    this.player_.play();
  }

}

BigPlayButton.prototype.controlText_ = 'Play Video';

Component.registerComponent('BigPlayButton', BigPlayButton);
export default BigPlayButton;
