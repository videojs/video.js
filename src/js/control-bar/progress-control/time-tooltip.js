/**
 * @file time-tooltip.js
 */
import Component from '../../component';
import * as Dom from '../../utils/dom.js';
import {formatTime} from '../../utils/time.js';
import * as Fn from '../../utils/fn.js';

/**
 * Time tooltips display a time above the progress bar.
 *
 * @extends Component
 */
class TimeTooltip extends Component {

  /**
   * Creates an instance of this class.
   *
   * @param { import('../../player').default } player
   *        The {@link Player} that this class should be attached to.
   *
   * @param {Object} [options]
   *        The key/value store of player options.
   */
  constructor(player, options) {
    super(player, options);
    this.update = Fn.throttle(Fn.bind_(this, this.update), Fn.UPDATE_REFRESH_INTERVAL);
  }

  /**
   * Create the time tooltip DOM element
   *
   * @return {Element}
   *         The element that was created.
   */
  createEl() {
    return super.createEl('div', {
      className: 'vjs-time-tooltip'
    }, {
      'aria-hidden': 'true'
    });
  }

  /**
   * Updates the position of the time tooltip relative to the `SeekBar`.
   *
   * @param {Object} seekBarRect
   *        The `ClientRect` for the {@link SeekBar} element.
   *
   * @param {number} seekBarPoint
   *        A number from 0 to 1, representing a horizontal reference point
   *        from the left edge of the {@link SeekBar}
   */
  update(seekBarRect, seekBarPoint, content) {
    this.write(content);
  }

  /**
   * Write the time to the tooltip DOM element.
   *
   * @param {string} content
   *        The formatted time for the tooltip.
   */
  write(content) {
    Dom.textContent(this.el_, content);
  }

  /**
   * Updates the position of the time tooltip relative to the `SeekBar`.
   *
   * @param {Object} seekBarRect
   *        The `ClientRect` for the {@link SeekBar} element.
   *
   * @param {number} seekBarPoint
   *        A number from 0 to 1, representing a horizontal reference point
   *        from the left edge of the {@link SeekBar}
   *
   * @param {number} time
   *        The time to update the tooltip to, not used during live playback
   *
   * @param {Function} cb
   *        A function that will be called during the request animation frame
   *        for tooltips that need to do additional animations from the default
   */
  updateTime(seekBarRect, seekBarPoint, time, cb) {
    this.requestNamedAnimationFrame('TimeTooltip#updateTime', () => {
      let content;
      const duration = this.player_.duration();

      if (this.player_.liveTracker && this.player_.liveTracker.isLive()) {
        const liveWindow = this.player_.liveTracker.liveWindow();
        const secondsBehind = liveWindow - (seekBarPoint * liveWindow);

        content = (secondsBehind < 1 ? '' : '-') + formatTime(secondsBehind, liveWindow);
      } else {
        content = formatTime(time, duration);
      }

      this.update(seekBarRect, seekBarPoint, content);
      if (cb) {
        cb();
      }
    });
  }
}

Component.registerComponent('TimeTooltip', TimeTooltip);
export default TimeTooltip;
