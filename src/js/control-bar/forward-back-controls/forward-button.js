import Button from '../../button.js';
import Component from '../../component.js';
import SkipButton from './skip-button.js';

/**
 * Forward and backwards button for the videoplayer.
 * @extends SkipButton
 */
class ForwardButton extends SkipButton {

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
    console.log("css built")
    console.log('vjs-jump-forward');
    return `vjs-forward-button ${super.buildCSSClass()}`;
  }

  handleClick(event) {
    console.log("Hello");
  }
} 

ForwardButton.prototype.controlText_ = 'Skip Forward';

Component.registerComponent('ForwardButton', ForwardButton);
export default ForwardButton;