/**
 * @file mouse-time-display.js
 */
import Component from '../../component.js';
import * as Fn from '../../utils/fn.js';
import formatTime from '../../utils/format-time.js';

import './time-tooltip';

/**
 * The {@link MouseTimeDisplay} component tracks mouse movement over the
 * {@link ProgressControl}. It displays an indicator and a {@link TimeTooltip}
 * indicating the time which is represented by a given point in the
 * {@link ProgressControl}.
 *
 * @extends Component
 */
class MouseTimeDisplay extends Component {

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
    this.update = Fn.throttle(Fn.bind(this, this.update), 25);
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
      const duration = this.player_.duration();
      const content = formatTime(seekBarPoint * duration, duration);

      this.el_.style.left = `${seekBarRect.width * seekBarPoint}px`;
      this.getChild('timeTooltip').update(seekBarRect, seekBarPoint, content);
    });
  }
}

/**
 * Default options for `MouseTimeDisplay`
 *
 * @type {Object}
 * @private
 */
MouseTimeDisplay.prototype.options_ = {
  children: [
    'timeTooltip'
  ]
};

Component.registerComponent('MouseTimeDisplay', MouseTimeDisplay);
export default MouseTimeDisplay;
