import Component from '../../component.js';
import SkipButton from './skip-button.js';

/**
 * Back button for the videoplayer.
 * @extends SkipButton
 */
class BackButton extends SkipButton {

  constructor(player, options) {
    super(player, options);
  }


  /**
   * Builds the default DOM `className`
   * 
   * @return {string}
   *         The DOM `className` for this object
   */
  buildCSSClass() {
    return `vjs-back-button ${super.buildCSSClass()}`;
  }

  handleClick(event) {
    console.log("Hello");
  }
} 

BackButton.prototype.controlText_ = 'Replay';

Component.registerComponent('BackButton', BackButton);
export default BackButton;