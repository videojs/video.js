/**
 * @file play-progress-bar.js
 */
import Component from '../../component.js';
import {IS_IOS, IS_ANDROID} from '../../utils/browser.js';
import formatTime from '../../utils/format-time.js';

import './time-tooltip';

/**
 * Used by {@link SeekBar} to display media playback progress as part of the
 * {@link ProgressControl}.
 *
 * @extends Component
 */
class PlayProgressBar extends Component {

  /**
   * Create the the DOM element for this class.
   *
   * @return {Element}
   *         The element that was created.
   */
  createEl() {
    return super.createEl('div', {
      className: 'vjs-play-progress vjs-slider-bar',
      innerHTML: `<span class="vjs-control-text"><span>${this.localize('Progress')}</span>: 0%</span>`
    });
  }

  /**
   * Enqueues updates to its own DOM as well as the DOM of its
   * {@link TimeTooltip} child.
   *
   * @param {Object} seekBarRect
   *        The `ClientRect` for the {@link SeekBar} element.
   *
   * @param {number} seekBarPoint
   *        A number from 0 to 1, representing a horizontal reference point
   *        from the left edge of the {@link SeekBar}
   */
  update(seekBarRect, seekBarPoint) {

    // If there is an existing rAF ID, cancel it so we don't over-queue.
    if (this.rafId_) {
      this.cancelAnimationFrame(this.rafId_);
    }

    this.rafId_ = this.requestAnimationFrame(() => {
      const timeTooltip = this.getChild('timeTooltip');

      if (!timeTooltip) {
        return;
      }
      let content;

      if (this.player_.duration() === Infinity) {
        const seekEnd = this.player_.seekable().end(0);
        const timeBehindLive = seekEnd - (seekBarPoint * seekEnd);

        // the live tooltip shows the time as a negative number
        // indicating the time from the live point.
        content = formatTime(timeBehindLive, seekEnd);

        if (timeBehindLive !== 0) {
          content = `-${content}`;
        }
      } else {

        const time = (this.player_.scrubbing()) ?
          this.player_.getCache().currentTime :
          this.player_.currentTime();

        content = formatTime(time, this.player_.duration());
      }

      timeTooltip.update(seekBarRect, seekBarPoint, content);
    });
  }
}

/**
 * Default options for {@link PlayProgressBar}.
 *
 * @type {Object}
 * @private
 */
PlayProgressBar.prototype.options_ = {
  children: []
};

// Time tooltips should not be added to a player on mobile devices
if (!IS_IOS && !IS_ANDROID) {
  PlayProgressBar.prototype.options_.children.push('timeTooltip');
}

Component.registerComponent('PlayProgressBar', PlayProgressBar);
export default PlayProgressBar;
