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
    const iconType = this.options_.playerOptions.skip_timer;
    return `vjs-back-button-${iconType} ${super.buildCSSClass()}`;
  }

  /**
   * 
   * @param {*} event 
   */
  handleClick(event) {
    console.log(this.options_);
    const currentVideoTime = this.player_.currentTime();
    const replayTime = this.options_.playerOptions.skip_timer;

    var newTime;
    if(currentVideoTime >= replayTime) {
      newTime = currentVideoTime - replayTime;
    } else {
      newTime = 0;
    }
    this.player_.currentTime(newTime);
  }
} 

BackButton.prototype.controlText_ = 'Replay';

Component.registerComponent('BackButton', BackButton);
export default BackButton;