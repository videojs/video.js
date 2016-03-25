/**
 * @file play-progress-bar.js
 */
import Component from '../../component.js';
import * as Fn from '../../utils/fn.js';
import * as Dom from '../../utils/dom.js';
import formatTime from '../../utils/format-time.js';

/**
 * Shows play progress
 *
 * @param {Player|Object} player
 * @param {Object=} options
 * @extends Component
 * @class PlayProgressBar
 */
class TooltipProgressBar extends Component {

  constructor(player, options){
    super(player, options);
    this.updateDataAttr();
    this.on(player, 'timeupdate', this.updateDataAttr);
    player.ready(Fn.bind(this, this.updateDataAttr));
  }

  /**
   * Create the component's DOM element
   *
   * @return {Element}
   * @method createEl
   */
  createEl() {
    let el = super.createEl('div', {
      className: 'vjs-tooltip-progress-bar vjs-slider-bar',
      innerHTML: `<div class="vjs-time-tooltip"></div>
        <span class="vjs-control-text"><span>${this.localize('Progress')}</span>: 0%</span>`
    });

    this.tooltip = el.querySelector('.vjs-time-tooltip');

    return el;
  }

  updateDataAttr() {
    let time = (this.player_.scrubbing()) ? this.player_.getCache().currentTime : this.player_.currentTime();
    let formattedTime = formatTime(time, this.player_.duration());
    this.el_.setAttribute('data-current-time', formattedTime);
    this.tooltip.innerHTML = formattedTime;
  }

}

Component.registerComponent('TooltipProgressBar', TooltipProgressBar);
export default TooltipProgressBar;
