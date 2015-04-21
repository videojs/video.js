import Component from '../component.js';
import * as Lib from '../lib.js';

/**
 * Displays the current time
 * @param {Player|Object} player
 * @param {Object=} options
 * @constructor
 */
class CurrentTimeDisplay extends Component {

  constructor(player, options){
    super(player, options);

    this.on(player, 'timeupdate', this.updateContent);
  }

  createEl() {
    let el = super.createEl('div', {
      className: 'vjs-current-time vjs-time-controls vjs-control'
    });

    this.contentEl_ = Lib.createEl('div', {
      className: 'vjs-current-time-display',
      innerHTML: '<span class="vjs-control-text">Current Time </span>' + '0:00', // label the current time for screen reader users
      'aria-live': 'off' // tell screen readers not to automatically read the time as it changes
    });

    el.appendChild(this.contentEl_);
    return el;
  }

  updateContent() {
    // Allows for smooth scrubbing, when player can't keep up.
    let time = (this.player_.scrubbing) ? this.player_.getCache().currentTime : this.player_.currentTime();
    this.contentEl_.innerHTML = '<span class="vjs-control-text">' + this.localize('Current Time') + '</span> ' + Lib.formatTime(time, this.player_.duration());
  }

}

Component.registerComponent('CurrentTimeDisplay', CurrentTimeDisplay);
export default CurrentTimeDisplay;
