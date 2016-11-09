/**
 * @file play-progress-bar.js
 */
import Component from '../../component.js';
import * as Fn from '../../utils/fn.js';
import formatTime from '../../utils/format-time.js';

/**
 * Shows play progress
 *
 * @extends Component
 */
class TooltipProgressBar extends Component {

  /**
   * Creates an instance of this class.
   *
   * @param {Player} player
   *        The `Player` that this class should be attached to.
   *
   * @param {Object} [options]
   *        The key/value store of player options.
   */
  constructor(player, options) {
    super(player, options);
    this.updateDataAttr();
    this.on(player, 'timeupdate', this.updateDataAttr);
    player.ready(Fn.bind(this, this.updateDataAttr));
  }

  /**
   * Create the `Component`'s DOM element
   *
   * @return {Element}
   *         The element that was created.
   */
  createEl() {
    const el = super.createEl('div', {
      className: 'vjs-tooltip-progress-bar vjs-slider-bar',
      innerHTML: `<div class="vjs-time-tooltip"></div>
        <span class="vjs-control-text"><span>${this.localize('Progress')}</span>: 0%</span>`
    });

    this.tooltip = el.querySelector('.vjs-time-tooltip');

    return el;
  }

  /**
   * Updatet the data-current-time attribute for TooltipProgressBar
   *
   * @param {EventTarget~Event} [event]
   *        The `timeupdate` event that caused this function to run.
   *
   * @listens Player#timeupdate
   */
  updateDataAttr(event) {
    const time = (this.player_.scrubbing()) ? this.player_.getCache().currentTime : this.player_.currentTime();
    const formattedTime = formatTime(time, this.player_.duration());

    this.el_.setAttribute('data-current-time', formattedTime);
    this.tooltip.innerHTML = formattedTime;
  }

}

Component.registerComponent('TooltipProgressBar', TooltipProgressBar);
export default TooltipProgressBar;
