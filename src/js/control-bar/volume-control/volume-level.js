import Component from '../../component.js';

/**
 * Shows volume level
 *
 * @param {Player|Object} player
 * @param {Object=} options
 * @constructor
 */
class VolumeLevel extends Component {

  createEl() {
    return super.createEl('div', {
      className: 'vjs-volume-level',
      innerHTML: '<span class="vjs-control-text"></span>'
    });
  }

}

Component.registerComponent('VolumeLevel', VolumeLevel);
export default VolumeLevel;
