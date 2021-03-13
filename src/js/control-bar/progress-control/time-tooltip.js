/**
 * @file time-tooltip.js
 */
import Component from '../../component';
import * as Dom from '../../utils/dom.js';
import formatTime from '../../utils/format-time.js';
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
   * @param {Player} player
   *        The {@link Player} that this class should be attached to.
   *
   * @param {Object} [options]
   *        The key/value store of player options.
   */
  constructor(player, options) {
    super(player, options);
    this.update = Fn.throttle(Fn.bind(this, this.update), Fn.UPDATE_REFRESH_INTERVAL);
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
    const tooltipRect = Dom.findPosition(this.el_);
    const playerRect = Dom.getBoundingClientRect(this.player_.el());
    const seekBarPointPx = seekBarRect.width * seekBarPoint;

    // do nothing if either rect isn't available
    // for example, if the player isn't in the DOM for testing
    if (!playerRect || !tooltipRect) {
      return;
    }

    // This is the space left of the `seekBarPoint` available within the bounds
    // of the player. We calculate any gap between the left edge of the player
    // and the left edge of the `SeekBar` and add the number of pixels in the
    // `SeekBar` before hitting the `seekBarPoint`
    const spaceLeftOfPoint = (seekBarRect.left - playerRect.left) + seekBarPointPx;

    // This is the space right of the `seekBarPoint` available within the bounds
    // of the player. We calculate the number of pixels from the `seekBarPoint`
    // to the right edge of the `SeekBar` and add to that any gap between the
    // right edge of the `SeekBar` and the player.
    const spaceRightOfPoint = (seekBarRect.width - seekBarPointPx) +
      (playerRect.right - seekBarRect.right);

    // This is the number of pixels by which the tooltip will need to be pulled
    // further to the right to center it over the `seekBarPoint`.
    let pullTooltipBy = tooltipRect.width / 2;

    // Adjust the `pullTooltipBy` distance to the left or right depending on
    // the results of the space calculations above.
    if (spaceLeftOfPoint < pullTooltipBy) {
      pullTooltipBy += pullTooltipBy - spaceLeftOfPoint;
    } else if (spaceRightOfPoint < pullTooltipBy) {
      pullTooltipBy = spaceRightOfPoint;
    }

    // Due to the imprecision of decimal/ratio based calculations and varying
    // rounding behaviors, there are cases where the spacing adjustment is off
    // by a pixel or two. This adds insurance to these calculations.
    if (pullTooltipBy < 0) {
      pullTooltipBy = 0;
    } else if (pullTooltipBy > tooltipRect.width) {
      pullTooltipBy = tooltipRect.width;
    }

    // prevent small width fluctuations within 0.4px from
    // changing the value below.
    // This really helps for live to prevent the play
    // progress time tooltip from jittering
    pullTooltipBy = Math.round(pullTooltipBy);

    this.el_.style.right = `-${pullTooltipBy}px`;
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
