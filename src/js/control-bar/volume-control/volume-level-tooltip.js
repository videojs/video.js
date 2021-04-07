/**
 * @file volume-level-tooltip.js
 */
import Component from '../../component';
import * as Dom from '../../utils/dom.js';
import * as Fn from '../../utils/fn.js';

/**
 * Volume level tooltips display a volume above or side by side the volume bar.
 *
 * @extends Component
 */
class VolumeLevelTooltip extends Component {

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
   * Create the volume tooltip DOM element
   *
   * @return {Element}
   *         The element that was created.
   */
  createEl() {
    return super.createEl('div', {
      className: 'vjs-volume-tooltip'
    }, {
      'aria-hidden': 'true'
    });
  }

  /**
   * Updates the position of the tooltip relative to the `VolumeBar` and
   * its content text.
   *
   * @param {Object} rangeBarRect
   *        The `ClientRect` for the {@link VolumeBar} element.
   *
   * @param {number} rangeBarPoint
   *        A number from 0 to 1, representing a horizontal/vertical reference point
   *        from the left edge of the {@link VolumeBar}
   *
   * @param {boolean} vertical
   *        Referees to the Volume control position
   *        in the control bar{@link VolumeControl}
   *
   */
  update(rangeBarRect, rangeBarPoint, vertical, content) {
    if (!vertical) {
      const tooltipRect = Dom.getBoundingClientRect(this.el_);
      const playerRect = Dom.getBoundingClientRect(this.player_.el());
      const volumeBarPointPx = rangeBarRect.width * rangeBarPoint;

      if (!playerRect || !tooltipRect) {
        return;
      }

      const spaceLeftOfPoint = (rangeBarRect.left - playerRect.left) + volumeBarPointPx;
      const spaceRightOfPoint = (rangeBarRect.width - volumeBarPointPx) +
        (playerRect.right - rangeBarRect.right);
      let pullTooltipBy = tooltipRect.width / 2;

      if (spaceLeftOfPoint < pullTooltipBy) {
        pullTooltipBy += pullTooltipBy - spaceLeftOfPoint;
      } else if (spaceRightOfPoint < pullTooltipBy) {
        pullTooltipBy = spaceRightOfPoint;
      }

      if (pullTooltipBy < 0) {
        pullTooltipBy = 0;
      } else if (pullTooltipBy > tooltipRect.width) {
        pullTooltipBy = tooltipRect.width;
      }

      this.el_.style.right = `-${pullTooltipBy}px`;
    }
    this.write(`${content}%`);
  }

  /**
   * Write the volume to the tooltip DOM element.
   *
   * @param {string} content
   *        The formatted volume for the tooltip.
   */
  write(content) {
    Dom.textContent(this.el_, content);
  }

  /**
   * Updates the position of the volume tooltip relative to the `VolumeBar`.
   *
   * @param {Object} rangeBarRect
   *        The `ClientRect` for the {@link VolumeBar} element.
   *
   * @param {number} rangeBarPoint
   *        A number from 0 to 1, representing a horizontal/vertical reference point
   *        from the left edge of the {@link VolumeBar}
   *
   * @param {boolean} vertical
   *        Referees to the Volume control position
   *        in the control bar{@link VolumeControl}
   *
   * @param {number} volume
   *        The volume level to update the tooltip to
   *
   * @param {Function} cb
   *        A function that will be called during the request animation frame
   *        for tooltips that need to do additional animations from the default
   */
  updateVolume(rangeBarRect, rangeBarPoint, vertical, volume, cb) {
    this.requestNamedAnimationFrame('VolumeLevelTooltip#updateVolume', () => {
      this.update(rangeBarRect, rangeBarPoint, vertical, volume.toFixed(0));
      if (cb) {
        cb();
      }
    });
  }
}

Component.registerComponent('VolumeLevelTooltip', VolumeLevelTooltip);
export default VolumeLevelTooltip;
