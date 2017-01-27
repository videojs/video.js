/**
 * @file volume-bar.js
 */
import Slider from '../../slider/slider.js';
import Component from '../../component.js';

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
    this.on('slideractive', this.updateVolumeBeforeDrag);
    this.on('sliderinactive', this.updateLastVolume);
    this.on(player, 'volumechange', this.updateARIAAttributes);
    player.ready(() => this.updateARIAAttributes);
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

  /**
   * Store value of volume in `volumeBeforeDrag` when user begins dragging the
   * VolumeBar (so long as volume is above zero). This is used to restore
   * volume to its starting level after dragging volume to zero and clicking
   * MuteToggle.
   *
   * @listens slideractive
   */
  updateVolumeBeforeDrag() {
    const vol = this.player_.volume();

    if (vol > 0) {
      this.player_.volumeBeforeDrag(vol);
    }
  }

  /**
   * After user finishes dragging the VolumeBar, if volume is zero, set
   * `lastVolume` (the value used in setting the volume after clicking
   * MuteToggle when volume is zero) to `volumeBeforeDrag`, so that volume will
   * be restored to its starting level before the drag.
   *
   * @listens sliderinactive
   */
  updateLastVolume() {
    const vol = this.player_.volume();
    const volumeBeforeDrag = this.player_.volumeBeforeDrag();

    if (vol === 0) {
      this.player_.lastVolume(volumeBeforeDrag);
    }
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
