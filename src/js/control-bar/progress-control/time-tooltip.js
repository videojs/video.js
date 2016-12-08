/**
 * @file time-tooltip.js
 */
import Component from '../../component';
import * as Dom from '../../utils/dom.js';
import computedStyle from '../../utils/computed-style.js';

/**
 * Time tooltips display a time above the progress bar.
 *
 * @extends Component
 */
class TimeTooltip extends Component {

  /**
   * Create the time tooltip DOM element
   *
   * @return {Element}
   *         The element that was created.
   */
  createEl() {
    return super.createEl('div', {
      className: 'vjs-time-tooltip'
    });
  }

  /**
   * Updates the position of the time tooltip relative to the `SeekBar`.
   *
   * @param {number} seekBarWidth
   *        The width of the {@link SeekBar} in pixels.
   *
   * @param {number} seekBarPoint
   *        A number from 0 to 1, representing a horizontal reference point
   *        from the left edge of the {@link SeekBar}
   */
  update(seekBarWidth, seekBarPoint, content) {
    const tooltipWidth = parseFloat(computedStyle(this.el_, 'width'));
    const leftPosition = tooltipWidth / 2;

    this.el_.style.left = leftPosition + 'px';
    Dom.textContent(this.el_, content);
  }
}

Component.registerComponent('TimeTooltip', TimeTooltip);
export default TimeTooltip;
