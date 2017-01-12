/**
 * @file volume-control.js
 */
import Component from '../../component.js';
import checkVolumeSupport from './check-volume-support';

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
    super(player, options);

    // hide this control if volume support is missing
    checkVolumeSupport(this, player);

    // when the mouse leaves the VolumeControl area hide the volumeBar
    this.on(['mouseenter', 'touchstart'], () => this.volumeBar.show());
    this.on(['mouseleave', 'touchend'], () => this.volumeBar.hide());

    // when any child of the VolumeControl gets or loses focus
    // show/hide the VolumeBar
    this.children().forEach((child) => {
      this.on(child, ['focus'], () => this.volumeBar.show());
      this.on(child, ['blur'], () => this.volumeBar.hide());
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
VolumeControl.prototype.options_ = {
  children: [
    'muteToggle',
    'volumeBar'
  ]
};

Component.registerComponent('VolumeControl', VolumeControl);
export default VolumeControl;
