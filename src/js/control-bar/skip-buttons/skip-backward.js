import Button from '../../button';
import Component from '../../component';

class SkipBackward extends Button {
  constructor(player, options) {
    super(player, options);

    this.validOptions = [5, 10, 30];
    this.skipTime = this.getSkipBackwardTime();

    if (this.skipTime && this.validOptions.includes(this.skipTime)) {
      this.show();
    } else {
      this.hide();
    }
  }

  getSkipBackwardTime() {
    const playerOptions = this.options_.playerOptions;

    return playerOptions.controlBar && playerOptions.controlBar.skipButtons && playerOptions.controlBar.skipButtons.backward;
  }

  buildCSSClass() {
    return `vjs-skip-backward-${this.getSkipBackwardTime()} ${super.buildCSSClass()}`;
  }

  /**
   * TBC
   *
   * Handle a click on a `SkipBackward` button
   *
   * @param {EventTarget~Event} event
   *        The `click` event that caused this function
   *        to be called
   */
  handleClick(event) {
    const currentVideoTime = this.player_.currentTime();

    let newTime;

    if (currentVideoTime >= this.skipTime) {
      newTime = currentVideoTime - this.skipTime;
    } else {
      newTime = 0;
    }
    this.player_.currentTime(newTime);
  }
}

SkipBackward.prototype.controlText_ = 'Skip Backward';

Component.registerComponent('SkipBackward', SkipBackward);

export default SkipBackward;
