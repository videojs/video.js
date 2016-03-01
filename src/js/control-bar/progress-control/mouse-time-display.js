/**
 * @file mouse-time-display.js
 */
import window from 'global/window';
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

    this.update(0, 0);

    player.on('ready', () => {
      this.on(player.controlBar.progressControl.el(), 'mousemove', throttle(Fn.bind(this, this.handleMouseMove), 25));
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

  handleMouseMove(event) {
    let duration = this.player_.duration();
    let newTime = this.calculateDistance(event) * duration;
    let position = event.pageX - Dom.findElPosition(this.el().parentNode).left;

    this.update(newTime, position);
  }

  update(newTime, position) {
    let time = formatTime(newTime, this.player_.duration());

    this.el().style.left = this.clampPosition(position) + 'px';
    this.el().setAttribute('data-current-time', time);
  }

  calculateDistance(event) {
    return Dom.getPointerPosition(this.el().parentNode, event).x;
  }

  clampPosition(position) {
    let playerWidth = parseFloat(window.getComputedStyle(this.player().el()).width);
    let tooltipWidth = parseFloat(window.getComputedStyle(this.el(), ':after').width);
    let tooltipWidthHalf = tooltipWidth / 2;
    let actualPosition = position;

    if (position < tooltipWidthHalf) {
      actualPosition = Math.ceil(tooltipWidthHalf);
    } else if (position > (playerWidth - tooltipWidthHalf)) {
      actualPosition = Math.floor(playerWidth - tooltipWidthHalf);
    }

    return actualPosition;
  }
}

Component.registerComponent('MouseTimeDisplay', MouseTimeDisplay);
export default MouseTimeDisplay;
