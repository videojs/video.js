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
class PlayProgressBar extends Component {

  constructor(player, options){
    super(player, options);
    this.updateDataAttr();
    this.on(player, 'timeupdate', this.updateDataAttr);
    player.ready(Fn.bind(this, this.updateDataAttr));

    if (options.playerOptions &&
        options.playerOptions.controlBar &&
        options.playerOptions.controlBar.progressControl &&
        options.playerOptions.controlBar.progressControl.keepWithin) {
      this.keepWithin = options.playerOptions.controlBar.progressControl.keepWithin;
    }

    if (this.keepWithin) {
      this.timeTooltip = Dom.createEl('div', {
        className: 'vjs-play-progress-time vjs-time-tooltip'
      });
      this.el().appendChild(this.timeTooltip);

      this.on(player, ['seeked'], this.resetMargin);
      this.addClass('vjs-keep-within');
    }
  }

  /**
   * Create the component's DOM element
   *
   * @return {Element}
   * @method createEl
   */
  createEl() {
    return super.createEl('div', {
      className: 'vjs-play-progress vjs-slider-bar',
      innerHTML: `<span class="vjs-control-text"><span>${this.localize('Progress')}</span>: 0%</span>`
    });
  }

  resetMargin() {
    this.timeTooltip.style.marginRight = '-1.5em';
  }

  updateDataAttr() {
    let time = (this.player_.scrubbing()) ? this.player_.getCache().currentTime : this.player_.currentTime();
    this.el_.setAttribute('data-current-time', formatTime(time, this.player_.duration()));

    if (this.keepWithin) {
      let progressControl = player.controlBar.progressControl;
      let playerRect = progressControl.el().getBoundingClientRect();
      let tooltipRect = this.timeTooltip.getBoundingClientRect();
      let tooltipStyle = getComputedStyle(this.timeTooltip);

      if (tooltipRect.right === 0 && tooltipRect.left === 0) {
        return;
      }

      if (playerRect.right < tooltipRect.right) {
        this.timeTooltip.style.marginRight = (parseInt(tooltipStyle.marginRight, 10) - (playerRect.right - tooltipRect.right)) + 'px';
      }

      this.timeTooltip.innerHTML = formatTime(time, this.player_.duration());
    }
  }

}

Component.registerComponent('PlayProgressBar', PlayProgressBar);
export default PlayProgressBar;
