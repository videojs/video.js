import Button from '../../button.js';
import Component from '../../component.js';

/**
 * 
 */
class SkipButton extends Button {
  constructor(player, options) {
    super(player, options);
    this.handleShowing(options);
    // here we have the handle showing fn -> same for both back and forward
    // the handleClick will be different for both so that is separate
  }

  handleShowing(options) {
    if(options.skip_buttons && options.skip_buttons === 5) {
      this.show();
    }
    else {
      this.hide();
    }
  }
}

Component.registerComponent('SkipButton', SkipButton);
export default SkipButton;