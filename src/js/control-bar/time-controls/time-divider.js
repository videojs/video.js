/**
 * @file time-divider.js
 */
import Component from '../../component.js';

/**
 * The separator between the current time and duration.
 * Can be hidden if it's not needed in the design.
 *
 * @param {Player|Object} player
 * @param {Object=} options
 * @extends Component
 * @class TimeDivider
 */
class TimeDivider extends Component {

  /**
   * Create the component's DOM element
   *
   * @return {Element}
   * @method createEl
   */
  createEl() {
    return super.createEl('div', {
      className: 'vjs-time-control vjs-time-divider',
      innerHTML: '<div><span>/</span></div>'
    });
  }

}

Component.registerComponent('TimeDivider', TimeDivider);
export default TimeDivider;
