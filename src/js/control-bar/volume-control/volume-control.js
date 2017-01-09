/**
 * @file volume-control.js
 */
import Component from '../../component.js';

// Required children
import './volume-bar.js';

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

    // hide volume controls when they're not supported by the current tech
    if (player.tech_ && player.tech_.featuresVolumeControl === false) {
      this.addClass('vjs-hidden');
    }
    this.on(player, 'loadstart', function() {
      if (player.tech_.featuresVolumeControl === false) {
        this.addClass('vjs-hidden');
      } else {
        this.removeClass('vjs-hidden');
      }
    });

    this.on(this.volumeBar, ['focus', 'slideractive'], () => {
      this.lock_ = true;
    });
    this.on(this.volumeBar, ['blur', 'sliderinactive'], () => {
      this.lock_ = false;
      if (this.shouldHide_) {
        this.hide();
      }
    });

    this.on(this.volumeBar, ['focus'], () => this.show());
    this.on(this.volumeBar, ['blur'], () => this.hide());
    this.on(['mouseenter', 'touchstart', 'focus'], () => this.show());
    this.on(['mouseleave', 'touchend', 'blur'], () => this.hide());

    this.hide();
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

  show() {
    this.removeAttribute('style');
    this.shouldHide_ = false;
  }

  hide() {
    if (this.lock_) {
      this.shouldHide_ = true;
      return;
    }
    // animate hiding the bar via transitions
    // todo: turn this into a class
    this.setAttribute('style', 'width:1px; margin: 0; overflow:hidden; opacity: 0');
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
