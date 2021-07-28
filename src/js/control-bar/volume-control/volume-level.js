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
    const el = super.createEl('div', {
      className: 'vjs-volume-level'
    });

    el.appendChild(super.createEl('span', {
      className: 'vjs-control-text'
    }));

    return el;
  }

}

Component.registerComponent('VolumeLevel', VolumeLevel);
export default VolumeLevel;
