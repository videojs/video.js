/**
 * @file volume-bar.js
 */
import Slider from '../../slider/slider.js';
import Component from '../../component.js';
import * as Dom from '../../utils/dom.js';
import clamp from '../../utils/clamp.js';
import {IS_IOS, IS_ANDROID} from '../../utils/browser.js';

// Required children
import './volume-level.js';
import './mouse-volume-level-display.js';

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
    this.on('slideractive', (e) => this.updateLastVolume_(e));
    this.on(player, 'volumechange', (e) => this.updateARIAAttributes(e));
    player.ready(() => this.updateARIAAttributes());
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
      'aria-label': this.localize('Volume Level'),
      'aria-live': 'polite'
    });
  }

  /**
   * Handle mouse down on volume bar
   *
   * @param {EventTarget~Event} event
   *        The `mousedown` event that caused this to run.
   *
   * @listens mousedown
   */
  handleMouseDown(event) {
    if (!Dom.isSingleLeftClick(event)) {
      return;
    }

    super.handleMouseDown(event);
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
    const mouseVolumeLevelDisplay = this.getChild('mouseVolumeLevelDisplay');

    if (mouseVolumeLevelDisplay) {
      const volumeBarEl = this.el();
      const volumeBarRect = Dom.getBoundingClientRect(volumeBarEl);
      const vertical = this.vertical();
      let volumeBarPoint = Dom.getPointerPosition(volumeBarEl, event);

      volumeBarPoint = vertical ? volumeBarPoint.y : volumeBarPoint.x;
      // The default skin has a gap on either side of the `VolumeBar`. This means
      // that it's possible to trigger this behavior outside the boundaries of
      // the `VolumeBar`. This ensures we stay within it at all times.
      volumeBarPoint = clamp(volumeBarPoint, 0, 1);

      mouseVolumeLevelDisplay.update(volumeBarRect, volumeBarPoint, vertical);
    }

    if (!Dom.isSingleLeftClick(event)) {
      return;
    }

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
    const ariaValue = this.player_.muted() ? 0 : this.volumeAsPercentage_();

    this.el_.setAttribute('aria-valuenow', ariaValue);
    this.el_.setAttribute('aria-valuetext', ariaValue + '%');
  }

  /**
   * Returns the current value of the player volume as a percentage
   *
   * @private
   */
  volumeAsPercentage_() {
    return Math.round(this.player_.volume() * 100);
  }

  /**
   * When user starts dragging the VolumeBar, store the volume and listen for
   * the end of the drag. When the drag ends, if the volume was set to zero,
   * set lastVolume to the stored volume.
   *
   * @listens slideractive
   * @private
   */
  updateLastVolume_() {
    const volumeBeforeDrag = this.player_.volume();

    this.one('sliderinactive', () => {
      if (this.player_.volume() === 0) {
        this.player_.lastVolume_(volumeBeforeDrag);
      }
    });
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

// MouseVolumeLevelDisplay tooltip should not be added to a player on mobile devices
if (!IS_IOS && !IS_ANDROID) {
  VolumeBar.prototype.options_.children.splice(0, 0, 'mouseVolumeLevelDisplay');
}

/**
 * Call the update event for this Slider when this event happens on the player.
 *
 * @type {string}
 */
VolumeBar.prototype.playerEvent = 'volumechange';

Component.registerComponent('VolumeBar', VolumeBar);
export default VolumeBar;
