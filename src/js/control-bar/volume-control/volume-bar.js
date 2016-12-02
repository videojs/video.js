/**
 * @file volume-bar.js
 */
import Slider from '../../slider/slider.js';
import Component from '../../component.js';
import * as Fn from '../../utils/fn.js';

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
    player.ready(Fn.bind(this, this.updateARIAAttributes));
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
      'aria-label': 'volume level'
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
