import Button from '../../button.js';
import Component from '../../component.js';

/**
 * @extends Button
 */
class SkipButton extends Button {
  constructor(player, options) {
    super(player, options);
    this.validSkipTimes = [5, 10, 30];
    this.handleShowing(options.playerOptions);
  }

  /**
   * Handle whether we show the skip button or not
   * @param {playerOptions} playerOptions 
   */
  handleShowing(playerOptions) {
    if(playerOptions.skip_timer && this.validSkipTimes.includes(playerOptions.skip_timer)) {
      this.show();
    }
    else {
      this.hide();
    }
  }
}

Component.registerComponent('SkipButton', SkipButton);
export default SkipButton;