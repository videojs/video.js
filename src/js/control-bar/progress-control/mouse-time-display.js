/**
 * @file mouse-time-display.js
 */
import Component from '../../component.js';
import * as Dom from '../../utils/dom.js';
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
class MouseTimeDisplay extends Component {

  constructor(player, options) {
    super(player, options);
    this.update();
    player.on('ready', () => {
      this.on(player.controlBar.progressControl.el(), 'mousemove', throttle(Fn.bind(this, this.handleMouseMove), 50));
    });
  }

  /**
   * Create the component's DOM element
   *
   * @return {Element}
   * @method createEl
   */
  createEl() {
    return super.createEl('div', {
      className: 'vjs-mouse-display'
    });
  }

  getPercent() {
    return this.newTime / this.player_.duration();
  }

  handleMouseMove(event) {
    this.newTime = this.calculateDistance(event) * this.player_.duration();

    this.position = event.pageX - Dom.findElPosition(this.el().parentNode).left;

    this.update();
  }

  calculateDistance(event) {
    return Dom.getPointerPosition(this.el().parentNode, event).x;
  }

  update() {
    this.updateDataAttr();

    this.el().style.left = this.position + 'px';
  }

  updateDataAttr() {
    let time = formatTime(this.newTime, this.player_.duration());
    this.el().setAttribute('data-current-time', time);
  }
}

Component.registerComponent('MouseTimeDisplay', MouseTimeDisplay);
export default MouseTimeDisplay;
