/**
 * @file volume-control.js
 */
import Component from '../component.js';
import checkVolumeSupport from './volume-control/check-volume-support';

// Required children
import './volume-control/volume-control.js';
import './mute-toggle.js';

/**
 * The component for controlling the volume level
 *
 * @extends Component
 */
class VolumePanel extends Component {

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
    super(player, options);

    // hide this control if volume support is missing
    checkVolumeSupport(this, player);

    // when the mouse leaves the VolumePanel area hide the VolumeControl (slider/bar)
    this.on(['mouseenter', 'touchstart'], () => this.volumeControl.show());
    this.on(['mouseleave', 'touchend'], () => this.volumeControl.hide());

    // when any child of the VolumePanel gets or loses focus
    // show/hide the VolumeControl (slider/bar)
    this.children().forEach((child) => {
      this.on(child, ['focus'], () => this.volumeControl.show());
      this.on(child, ['blur'], () => this.volumeControl.hide());
    });
  }

  /**
   * Create the `Component`'s DOM element
   *
   * @return {Element}
   *         The element that was created.
   */
  createEl() {
    return super.createEl('div', {
      className: 'vjs-volume-control vjs-control'
    });
  }

}

/**
 * Default options for the `VolumeControl`
 *
 * @type {Object}
 * @private
 */
VolumePanel.prototype.options_ = {
  children: [
    'muteToggle',
    'volumeControl'
  ]
};

Component.registerComponent('VolumePanel', VolumePanel);
export default VolumePanel;
