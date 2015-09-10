/**
 * @file mouse-time-display.js
 */
import Component from '../../component.js';
import MouseDisplayBar from './mouse-display-bar.js';
import SeekBar from './seek-bar.js';
import * as Fn from '../../utils/fn.js';
import formatTime from '../../utils/format-time.js';
import throttle from 'lodash-compat/function/throttle';

/**
 * The Mouse Time Display component shows the time you will seek to
 * when hovering over the progress bar
 *
 * @param {Player|Object} player
 * @param {Object=} options
 * @extends Component
 * @class MouseTimeDisplay
 */
class MouseTimeDisplay extends SeekBar {

  constructor(player, options) {
    super(player, options);
    this.update();
    player.on('ready', () => {
      this.on(player.controlBar.progressControl.el(), 'mousemove', throttle(Fn.bind(this, this.handleMouseMove), 50));
    });

    this.bar_ = this.el().querySelector('.vjs-mouse-display-bar');
    this.bar = {
      el: () => this.bar_
    };
  }

  /**
   * Create the component's DOM element
   *
   * @return {Element}
   * @method createEl
   */
  createEl() {
    return super.createEl('div', {
      className: 'vjs-mouse-display',
      innerHTML: `<div class="vjs-mouse-display-bar vjs-play-progress"></div>`
    });
  }

  getPercent() {
    return this.newTime / this.player_.duration();
  }

  handleMouseMove(event) {
    this.newTime = this.calculateDistance(event) * this.player_.duration();

    this.update();
  }

  update() {
    this.updateDataAttr();
    super.update();
  }

  updateDataAttr() {
    let time = formatTime(this.newTime, this.player_.duration());
    this.bar && this.bar.el().setAttribute('data-current-time', time);
  }
}

MouseTimeDisplay.prototype.options_ = {
  'barName': 'mouseTimeDisplay'
};
MouseTimeDisplay.prototype.handleMouseDown = MouseTimeDisplay.prototype.handleMouseMove;

Component.registerComponent('MouseTimeDisplay', MouseTimeDisplay);
export default MouseTimeDisplay;
