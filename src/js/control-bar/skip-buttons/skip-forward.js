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
      this.setIcon(`forward-${this.skipTime}`);
      this.controlText(this.localize('Skip forward {1} seconds', [this.skipTime.toLocaleString(player.language())]));
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
   * On click, skips forward in the duration/seekable range by a configurable amount of seconds.
   * If the time left in the duration/seekable range is less than the configured 'skip forward' time,
   * skips to end of duration/seekable range.
   *
   * Handle a click on a `SkipForward` button
   *
   * @param {EventTarget~Event} event
   *        The `click` event that caused this function
   *        to be called
   */
  handleClick(event) {
    if (isNaN(this.player_.duration())) {
      return;
    }

    const currentVideoTime = this.player_.currentTime();
    const liveTracker = this.player_.liveTracker;
    const duration = (liveTracker && liveTracker.isLive()) ? liveTracker.seekableEnd() : this.player_.duration();
    let newTime;

    if (currentVideoTime + this.skipTime <= duration) {
      newTime = currentVideoTime + this.skipTime;
    } else {
      newTime = duration;
    }

    this.player_.currentTime(newTime);
  }

  /**
   * Update control text on languagechange
   */
  handleLanguagechange() {
    this.controlText(this.localize('Skip forward {1} seconds', [this.skipTime]));
  }
}

SkipForward.prototype.controlText_ = 'Skip Forward';

Component.registerComponent('SkipForward', SkipForward);

export default SkipForward;
