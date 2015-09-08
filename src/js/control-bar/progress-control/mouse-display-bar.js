/**
 * @file mouse-display-bar.js
 */
import Component from '../../component.js';
import * as Fn from '../../utils/fn.js';
import formatTime from '../../utils/format-time.js';

/**
 * aligns the mouse time display
 *
 * @param {Player|Object} player
 * @param {Object=} options
 * @extends Component
 * @class MouseDisplayBar
 */
class MouseDisplayBar extends Component {

  constructor(player, options){
    super(player, options);
    this.updateDataAttr();
  }

  /**
   * Create the component's DOM element
   *
   * @return {Element}
   * @method createEl
   */
  createEl() {
    return super.createEl('div', {
      className: 'vjs-mouse-display-bar vjs-play-progress',
      innerHTML: `<span class="vjs-control-text"><span>${this.localize('Progress')}</span>: 0%</span>`
    });
  }

  updateDataAttr(time) {
    this.el_.setAttribute('data-current-time', time);
  }

}

Component.registerComponent('MouseDisplayBar', MouseDisplayBar);
export default MouseDisplayBar;
