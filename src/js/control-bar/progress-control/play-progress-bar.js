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
class PlayProgressBar extends Component {

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
    this.tooltip = this.el_.querySelector('.vjs-time-tooltip');
    this.update = Fn.bind(this, this.update);
    this.on(player, 'timeupdate', this.update);
    player.ready(this.update);
    this.update();
  }

  /**
   * Create the `Component`'s DOM element
   *
   * @return {Element}
   *         The element that was created.
   */
  createEl() {
    return super.createEl('div', {
      className: 'vjs-play-progress vjs-slider-bar',
      innerHTML: `<div class="vjs-time-tooltip"></div><span class="vjs-control-text"><span>${this.localize('Progress')}</span>: 0%</span>`
    });
  }

  /**
   * Update the data-current-time attribute on the `PlayProgressBar` and
   * the contents of the tooltip.
   *
   * @param {EventTarget~Event} [event]
   *        The `timeupdate` event that caused this to run.
   *
   * @listens Player#timeupdate
   */
  update(event) {
    const time = (this.player_.scrubbing()) ? this.player_.getCache().currentTime : this.player_.currentTime();
    const formattedTime = formatTime(time, this.player_.duration());

    this.el_.setAttribute('data-current-time', formattedTime);
    this.tooltip.innerHTML = formattedTime;
  }
}

Component.registerComponent('PlayProgressBar', PlayProgressBar);
export default PlayProgressBar;
