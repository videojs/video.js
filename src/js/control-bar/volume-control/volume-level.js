/**
 * @file volume-level.js
 */
import Component from '../../component.js';

/**
 * Shows volume level
 *
 * @param {Player|Object} player
 * @param {Object=} options
 * @extends Component
 * @class VolumeLevel
 */
class VolumeLevel extends Component {

  /**
   * Create the component's DOM element
   *
   * @return {Element}
   * @method createEl
   */
  createEl() {
    return super.createEl('div', {
      className: 'vjs-volume-level',
      innerHTML: '<span class="vjs-control-text"></span>'
    });
  }

}

Component.registerComponent('VolumeLevel', VolumeLevel);
export default VolumeLevel;
