/**
 * @file mouse-volume-level-display.js
 */
import Component from '../../component.js';
import * as Fn from '../../utils/fn.js';

import './volume-level-tooltip';

/**
 * The {@link MouseVolumeLevelDisplay} component tracks mouse movement over the
 * {@link VolumeControl}. It displays an indicator and a {@link VolumeLevelTooltip}
 * indicating the volume level which is represented by a given point in the
 * {@link VolumeBar}.
 *
 * @extends Component
 */
class MouseVolumeLevelDisplay extends Component {

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
   * Create the DOM element for this class.
   *
   * @return {Element}
   *         The element that was created.
   */
  createEl() {
    return super.createEl('div', {
      className: 'vjs-mouse-display'
    });
  }

  /**
   * Enquires updates to its own DOM as well as the DOM of its
   * {@link VolumeLevelTooltip} child.
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
  update(rangeBarRect, rangeBarPoint, vertical) {
    const volume = 100 * rangeBarPoint;

    this.getChild('volumeLevelTooltip').updateVolume(rangeBarRect, rangeBarPoint, vertical, volume, () => {
      if (vertical) {
        this.el_.style.bottom = `${rangeBarRect.height * rangeBarPoint}px`;
      } else {
        this.el_.style.left = `${rangeBarRect.width * rangeBarPoint}px`;
      }
    });
  }
}

/**
 * Default options for `MouseVolumeLevelDisplay`
 *
 * @type {Object}
 * @private
 */
MouseVolumeLevelDisplay.prototype.options_ = {
  children: [
    'volumeLevelTooltip'
  ]
};

Component.registerComponent('MouseVolumeLevelDisplay', MouseVolumeLevelDisplay);
export default MouseVolumeLevelDisplay;
