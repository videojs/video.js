import Component from '../../component.js';
import * as Dom from '../../utils/dom.js';
import formatTime from '../../utils/format-time.js';

/**
 * Displays the time left in the video
 * @param {Player|Object} player
 * @param {Object=} options
 * @constructor
 */
class RemainingTimeDisplay extends Component {

  constructor(player, options){
    super(player, options);

    this.on(player, 'timeupdate', this.updateContent);
  }

  createEl() {
    let el = super.createEl('div', {
      className: 'vjs-remaining-time vjs-time-control vjs-control'
    });

    this.contentEl_ = Dom.createEl('div', {
      className: 'vjs-remaining-time-display',
      innerHTML: `<span class="vjs-control-text">${this.localize('Remaining Time')}</span> -0:00`, // label the remaining time for screen reader users
      'aria-live': 'off' // tell screen readers not to automatically read the time as it changes
    });

    el.appendChild(this.contentEl_);
    return el;
  }

  updateContent() {
    if (this.player_.duration()) {
      const localizedText = this.localize('Remaining Time');
      const formattedTime = formatTime(this.player_.remainingTime());
      this.contentEl_.innerHTML = `<span class="vjs-control-text">${localizedText}</span> -${formattedTime}`;
    }

    // Allows for smooth scrubbing, when player can't keep up.
    // var time = (this.player_.scrubbing) ? this.player_.getCache().currentTime : this.player_.currentTime();
    // this.contentEl_.innerHTML = vjs.formatTime(time, this.player_.duration());
  }

}

Component.registerComponent('RemainingTimeDisplay', RemainingTimeDisplay);
export default RemainingTimeDisplay;
