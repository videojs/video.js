/**
 * @file remaining-time-display.js
 */
import Component from '../../component.js';
import * as Dom from '../../utils/dom.js';
import formatTime from '../../utils/format-time.js';

/**
 * Displays the time left in the video
 *
 * @param {Player|Object} player
 * @param {Object=} options
 * @extends Component
 * @class RemainingTimeDisplay
 */
class RemainingTimeDisplay extends Component {

  constructor(player, options){
    super(player, options);

    this.on(player, 'timeupdate', this.updateContent);
  }

  /**
   * Create the component's DOM element
   *
   * @return {Element}
   * @method createEl
   */
  createEl() {
    let el = super.createEl('div', {
      className: 'vjs-remaining-time vjs-time-control vjs-control'
    });

    this.contentEl_ = Dom.createEl('div', {
      className: 'vjs-remaining-time-display',
      // label the remaining time for screen reader users
      innerHTML: `<span class="vjs-control-text">${this.localize('Remaining Time')}</span> -0:00`,
    }, {
      // tell screen readers not to automatically read the time as it changes
      'aria-live': 'off'
    });

    el.appendChild(this.contentEl_);
    return el;
  }

  /**
   * Update remaining time display
   *
   * @method updateContent
   */
  updateContent() {
    if (this.player_.duration()) {
      const localizedText = this.localize('Remaining Time');
      const formattedTime = formatTime(this.player_.remainingTime());
      this.contentEl_.innerHTML = `<span class="vjs-control-text">${localizedText}</span> -${formattedTime}`;
    }

    // Allows for smooth scrubbing, when player can't keep up.
    // var time = (this.player_.scrubbing()) ? this.player_.getCache().currentTime : this.player_.currentTime();
    // this.contentEl_.innerHTML = vjs.formatTime(time, this.player_.duration());
  }

}

Component.registerComponent('RemainingTimeDisplay', RemainingTimeDisplay);
export default RemainingTimeDisplay;
