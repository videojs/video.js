/**
 * @file frame-tooltip.js
 */
import Component from '../../component';
import * as Dom from '../../utils/dom.js';
import * as Fn from '../../utils/fn.js';

/**
 * Frame tooltips display a frame above the progress bar.
 *
 * @extends Component
 */
class FrameTooltip extends Component {

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
   * Create the frame tooltip DOM element
   *
   * @return {Element}
   *         The element that was created.
   */
  createEl() {
    return super.createEl('div', {
      className: 'vjs-frame-tooltip',
      id: 'frametooltip'
    }, {
      'aria-hidden': 'true'
    });
  }

  /**
   * Updates the position of the frame tooltip relative to the `SeekBar`.
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
   */
  update(seekBarRect, seekBarPoint, time) {
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
    this.draw(time);
  }

  /**
   * Draw the frame at specific time to the tooltip DOM element.
   *
   * @param {string} content
   *        The formatted time we want to frame for the tooltip.
   */
  draw(content) {
    const videoElement = this.player().children()[0];

    const clonedVideo = videoElement.cloneNode(true);

    clonedVideo.currentTime = parseInt(content, 10);

    const canvas = Dom.createEl('canvas');

    const context = canvas.getContext('2d');

    clonedVideo.addEventListener('loadedmetadata', function() {
      clonedVideo.addEventListener('seeked', function() {
        context.drawImage(clonedVideo, 0, 0, canvas.width, canvas.height);
      });
      clonedVideo.removeEventListener('loadedmetadata', null);
    });
    if (this.el_.firstChild) {
      this.el_.removeChild(this.el_.firstChild);
    }
    this.el_.appendChild(canvas);
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
  updateFrame(seekBarRect, seekBarPoint, time, cb) {
    this.requestNamedAnimationFrame('TimeTooltip#updateFrame', () => {
      this.update(seekBarRect, seekBarPoint, time);
      if (cb) {
        cb();
      }
    });
  }
}

Component.registerComponent('FrameTooltip', FrameTooltip);
export default FrameTooltip;
