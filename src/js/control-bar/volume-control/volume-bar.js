/**
 * @file volume-bar.js
 */
import Slider from '../../slider/slider.js';
import Component from '../../component.js';
import checkVolumeSupport from './check-volume-support';

// Required children
import './volume-level.js';

/**
 * The bar that contains the volume level and can be clicked on to adjust the level
 *
 * @extends Slider
 */
class VolumeBar extends Slider {

  /**
   * Creates an instance of this class.
   *
   * @param {Player} player
   *        The `Player` that this class should be attached to.
   *
   * @param {Object} [options]
   *        The key/value store of player options.
   */
  constructor(player, options) {
    super(player, options);
    this.on(player, 'volumechange', this.updateARIAAttributes);
    player.ready(() => this.updateARIAAttributes);

    // hide this control if volume support is missing
    checkVolumeSupport(this, player);

    // while the slider is active (the mouse has been pressed down and
    // is dragging) we do not want to hide the VolumeBar
    this.on(['slideractive'], () => {
      this.lockShowing_ = true;
    });

    // when the slider becomes inactive again we want to hide
    // the VolumeBar, but only if we tried to hide when
    // lockShowing_ was true. see the VolumeBar#hide function.
    this.on(['sliderinactive'], () => {
      this.lockShowing_ = false;

      if (this.shouldHide_) {
        this.hide();
      }
    });

    // show/hide the VolumeBar on focus/blur
    // happens in VolumeControl but if we want to use the
    // VolumeBar by itself we will need this
    this.on(['focus'], () => this.show());
    this.on(['blur'], () => this.hide());

    // default to hidden state
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
      className: 'vjs-volume-bar vjs-slider-bar'
    }, {
      'aria-label': 'volume level',
      'aria-live': 'polite'
    });
  }

  show() {
    this.removeAttribute('style');
    this.shouldHide_ = false;
  }

  hide() {
    // if we are currently locked to the showing state
    // don't hide, but store that we should hide when
    // lockShowing_ turns to a false value.
    if (this.lockShowing_) {
      this.shouldHide_ = true;
      return;
    }
    // animate hiding the bar via transitions
    // todo: turn this into a class
    this.setAttribute('style', 'width:1px; margin: 0; overflow:hidden; opacity: 0');
  }

  /**
   * Handle movement events on the {@link VolumeMenuButton}.
   *
   * @param {EventTarget~Event} event
   *        The event that caused this function to run.
   *
   * @listens mousemove
   */
  handleMouseMove(event) {
    this.checkMuted();
    this.player_.volume(this.calculateDistance(event));
  }

  /**
   * If the player is muted unmute it.
   */
  checkMuted() {
    if (this.player_.muted()) {
      this.player_.muted(false);
    }
  }

  /**
   * Get percent of volume level
   *
   * @return {number}
   *         Volume level percent as a decimal number.
   */
  getPercent() {
    if (this.player_.muted()) {
      return 0;
    }
    return this.player_.volume();
  }

  /**
   * Increase volume level for keyboard users
   */
  stepForward() {
    this.checkMuted();
    this.player_.volume(this.player_.volume() + 0.1);
  }

  /**
   * Decrease volume level for keyboard users
   */
  stepBack() {
    this.checkMuted();
    this.player_.volume(this.player_.volume() - 0.1);
  }

  /**
   * Update ARIA accessibility attributes
   *
   * @param {EventTarget~Event} [event]
   *        The `volumechange` event that caused this function to run.
   *
   * @listens Player#volumechange
   */
  updateARIAAttributes(event) {
    // Current value of volume bar as a percentage
    const volume = (this.player_.volume() * 100).toFixed(2);

    this.el_.setAttribute('aria-valuenow', volume);
    this.el_.setAttribute('aria-valuetext', volume + '%');
  }

}

/**
 * Default options for the `VolumeBar`
 *
 * @type {Object}
 * @private
 */
VolumeBar.prototype.options_ = {
  children: [
    'volumeLevel'
  ],
  barName: 'volumeLevel'
};

/**
 * Call the update event for this Slider when this event happens on the player.
 *
 * @type {string}
 */
VolumeBar.prototype.playerEvent = 'volumechange';

Component.registerComponent('VolumeBar', VolumeBar);
export default VolumeBar;
