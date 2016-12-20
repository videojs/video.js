/**
 * @file volume-level.js
 */
import Component from '../../component.js';

/**
 * Shows volume level
 *
 * @extends Component
 */
class VolumeLevel extends Component {

  /**
   * Create the `Component`'s DOM element
   *
   * @return {Element}
   *         The element that was created.
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
