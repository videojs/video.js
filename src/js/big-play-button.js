/**
 * @file big-play-button.js
 */
import Button from './button.js';
import Component from './component.js';

/**
 * Initial play button. Shows before the video has played. The hiding of the
 * big play button is done via CSS and player states.
 *
 * @param {Object} player  Main Player
 * @param {Object=} options Object of option names and values
 * @extends Button
 * @class BigPlayButton
 */
class BigPlayButton extends Button {

  constructor(player, options) {
    super(player, options);
  }

  /**
   * Allow sub components to stack CSS class names
   *
   * @return {String} The constructed class name
   * @method buildCSSClass
   */
  buildCSSClass() {
    return 'vjs-big-play-button';
  }

  /**
   * Handles click for play
   *
   * @method handleClick
   */
  handleClick() {
    this.player_.play();
  }

}

BigPlayButton.prototype.controlText_ = 'Play Video';

Component.registerComponent('BigPlayButton', BigPlayButton);
export default BigPlayButton;
