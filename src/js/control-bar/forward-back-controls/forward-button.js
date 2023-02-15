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

    this.options = options;
  }

  /**
   * Builds the default DOM `className`
   * 
   * @return {string}
   *         The DOM `className` for this object
   */
  buildCSSClass() {
    return `vjs-forward-button ${super.buildCSSClass()}`;
  }

  /**
   * 
   * @param {*} event 
   */
  handleClick(event) {
    // skip forward logic
    // if we are end of video we do not skip
    // if the duration left of the vid is < than the skip timer we skip to end
    const currentTime = this.player_.currentTime();
    const duration = this.player_.duration();
    const skipTime = this.options.playerOptions.skip_timer;

    var newTime;
    if (currentTime + skipTime <= duration) {
      newTime = currentTime + skipTime;
    } else {
      newTime = duration;
    }
    this.player_.currentTime(newTime);
  }
} 

ForwardButton.prototype.controlText_ = 'Forward';

Component.registerComponent('ForwardButton', ForwardButton);
export default ForwardButton;