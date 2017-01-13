/**
 * @file volume-control.js
 */
import Component from '../../component.js';
import checkVolumeSupport from './check-volume-support';
import mergeOptions from '../../utils/merge-options';
import log from '../../utils/log';

// Required children
import './volume-bar.js';
import './mute-toggle.js';

/**
 * The component for controlling the volume level
 *
 * @extends Component
 */
class VolumeControl extends Component {

  /**
   * Creates an instance of this class.
   *
   * @param {Player} player
   *        The `Player` that this class should be attached to.
   *
   * @param {Object} [options={}]
   *        The key/value store of player options.
   */
  constructor(player, options) {
    const settings = mergeOptions({}, options);

    if (settings.inline === true) {
      settings.vertical = false;
    } else {
      settings.vertical = true;
    }

    super(player, settings);

    // hide this control if volume support is missing
    checkVolumeSupport(this, player);
  }

  show() {
    this.volumeBar.show();
  }

  hide() {
    this.volumeBar.hide()
  }

  /**
   * Create the `Component`'s DOM element
   *
   * @return {Element}
   *         The element that was created.
   */
  createEl() {
    let orientationClass = 'vjs-volume-horizonal';

    if (this.options_.vertical === true) {
      orientationClass = 'vjs-volume-vertical';
    }

    return super.createEl('div', {
      className: `vjs-volume-control vjs-control ${orientationClass}`
    });
  }

}

/**
 * Default options for the `VolumeControl`
 *
 * @type {Object}
 * @private
 */
VolumeControl.prototype.options_ = {
  children: [
    'volumeBar'
  ]
};

Component.registerComponent('VolumeControl', VolumeControl);
export default VolumeControl;
