import Button from '../../button';
import Component from '../../component';

/**
 * Button to skip backward a configurable amount of time
 * through a video. Renders in the control bar.
 *
 *  * e.g. options: {controlBar: {skipButtons: backward: 5}}
 *
 * @extends Button
 */
class SkipBackward extends Button {
  constructor(player, options) {
    super(player, options);

    this.validOptions = [5, 10, 30];
    this.skipTime = this.getSkipBackwardTime();

    if (this.skipTime && this.validOptions.includes(this.skipTime)) {
      this.setIcon(`replay-${this.skipTime}`);
      this.controlText(this.localize('Skip backward {1} seconds', [this.skipTime.toLocaleString(player.language())]));
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
   * On click, skips backward in the video by a configurable amount of seconds.
   * If the current time in the video is less than the configured 'skip backward' time,
   * skips to beginning of video or seekable range.
   *
   * Handle a click on a `SkipBackward` button
   *
   * @param {EventTarget~Event} event
   *        The `click` event that caused this function
   *        to be called
   */
  handleClick(event) {
    const currentVideoTime = this.player_.currentTime();
    const liveTracker = this.player_.liveTracker;
    const seekableStart = liveTracker && liveTracker.isLive() && liveTracker.seekableStart();
    let newTime;

    if (seekableStart && (currentVideoTime - this.skipTime <= seekableStart)) {
      newTime = seekableStart;
    } else if (currentVideoTime >= this.skipTime) {
      newTime = currentVideoTime - this.skipTime;
    } else {
      newTime = 0;
    }
    this.player_.currentTime(newTime);
  }

  /**
   * Update control text on languagechange
   */
  handleLanguagechange() {
    this.controlText(this.localize('Skip backward {1} seconds', [this.skipTime]));
  }
}

SkipBackward.prototype.controlText_ = 'Skip Backward';

Component.registerComponent('SkipBackward', SkipBackward);

export default SkipBackward;
