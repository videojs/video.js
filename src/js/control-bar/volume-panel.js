/**
 * @file volume-control.js
 */
import Component from '../component.js';
import checkVolumeSupport from './volume-control/check-volume-support';
import {isPlain} from '../utils/obj';
import {IE_VERSION} from '../utils/browser';

// Required children
import './volume-control/volume-control.js';
import './mute-toggle.js';

/**
 * A Component to contain the MuteToggle and VolumeControl so that
 * they can work together.
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
  constructor(player, options = {}) {
    if (typeof options.inline !== 'undefined') {
      options.inline = options.inline;
    } else {
      options.inline = true;
    }

    // pass the inline option down to the VolumeControl as vertical if
    // the VolumeControl is on.
    if (typeof options.volumeControl === 'undefined' || isPlain(options.volumeControl)) {
      options.volumeControl = options.volumeControl || {};
      options.volumeControl.vertical = !options.inline;
    }

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
    let ieFixClass = '';

    if (IE_VERSION && IE_VERSION <= 9) {
      ieFixClass = 'vjs-ie-auto-width-fix';
    }

    let orientationClass = 'vjs-volume-panel-horizontal';

    if (!this.options_.inline) {
      orientationClass = 'vjs-volume-panel-vertical';
    }

    return super.createEl('div', {
      className: `vjs-volume-panel vjs-control ${orientationClass} ${ieFixClass}`
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
