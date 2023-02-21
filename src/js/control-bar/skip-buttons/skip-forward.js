import Button from '../../button';
import Component from '../../component';

/**
 * Button to skip forward a configurable amount of time
 * through a video. Renders in the control bar.
 *
 * e.g. options: {controlBar: {skipButtons: forward: 5}}
 *
 * @extends Button
 */
class SkipForward extends Button {
  constructor(player, options) {
    super(player, options);

    this.validOptions = [5, 10, 30];
    this.skipTime = this.getSkipForwardTime();

    if (this.skipTime && this.validOptions.includes(this.skipTime)) {
      this.show();
    } else {
      this.hide();
    }
  }

  getSkipForwardTime() {
    const playerOptions = this.options_.playerOptions;

    return playerOptions.controlBar && playerOptions.controlBar.skipButtons && playerOptions.controlBar.skipButtons.forward;
  }

  buildCSSClass() {
    return `vjs-skip-forward-${this.getSkipForwardTime()} ${super.buildCSSClass()}`;
  }

  /**
   * On click, skips forward in the video by a configurable amount of seconds.
   * If the time left in the video is less than the configured 'skip forward' time,
   * skips to end of video.
   *
   * Handle a click on a `SkipForward` button
   *
   * @param {EventTarget~Event} event
   *        The `click` event that caused this function
   *        to be called
   */
  handleClick(event) {
    const currentVideoTime = this.player_.currentTime();
    const duration = this.player_.duration();

    let newTime;

    if (currentVideoTime + this.skipTime <= duration) {
      newTime = currentVideoTime + this.skipTime;
    } else {
      newTime = duration;
    }

    this.player_.currentTime(newTime);
  }
}

SkipForward.prototype.controlText_ = 'Skip Forward';

Component.registerComponent('SkipForward', SkipForward);

export default SkipForward;
