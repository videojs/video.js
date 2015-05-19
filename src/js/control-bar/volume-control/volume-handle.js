import SliderHandle from '../../slider/slider-handle.js';
import Component from '../../component.js';

/**
 * The volume handle can be dragged to adjust the volume level
 *
 * @param {Player|Object} player
 * @param {Object=} options
 * @constructor
 */
class VolumeHandle extends SliderHandle {

  /** @inheritDoc */
  createEl() {
    return super.createEl('div', {
      className: 'vjs-volume-handle'
    });
  }

}

VolumeHandle.prototype.defaultValue = '00:00';

Component.registerComponent('VolumeHandle', VolumeHandle);
export default VolumeHandle;
