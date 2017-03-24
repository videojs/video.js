/**
 * @file mute-toggle.js
 */
import Button from '../button';
import Component from '../component';
import * as Dom from '../utils/dom.js';
import checkVolumeSupport from './volume-control/check-volume-support';

/**
 * A button component for muting the audio.
 *
 * @extends Button
 */
class MuteToggle extends Button {

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

    // hide this control if volume support is missing
    checkVolumeSupport(this, player);

    this.on(player, ['loadstart', 'volumechange'], this.update);
  }

  /**
   * Builds the default DOM `className`.
   *
   * @return {string}
   *         The DOM `className` for this object.
   */
  buildCSSClass() {
    return `vjs-mute-control ${super.buildCSSClass()}`;
  }

  /**
   * This gets called when an `MuteToggle` is "clicked". See
   * {@link ClickableComponent} for more detailed information on what a click can be.
   *
   * @param {EventTarget~Event} [event]
   *        The `keydown`, `tap`, or `click` event that caused this function to be
   *        called.
   *
   * @listens tap
   * @listens click
   */
  handleClick(event) {
    const vol = this.player_.volume();
    const lastVolume = this.player_.lastVolume_();

    if (vol === 0) {
      const volumeToSet = lastVolume < 0.1 ? 0.1 : lastVolume;

      this.player_.volume(volumeToSet);
      this.player_.muted(false);
    } else {
      this.player_.muted(this.player_.muted() ? false : true);
    }
  }

  /**
   * Update the `MuteToggle` button based on the state of `volume` and `muted`
   * on the player.
   *
   * @param {EventTarget~Event} [event]
   *        The {@link Player#loadstart} event if this function was called
   *        through an event.
   *
   * @listens Player#loadstart
   * @listens Player#volumechange
   */
  update(event) {
    this.updateIcon_();
    this.updateControlText_();
  }

  /**
   * Update the appearance of the `MuteToggle` icon.
   *
   * Possible states (given `level` variable below):
   * - 0: crossed out
   * - 1: zero bars of volume
   * - 2: one bar of volume
   * - 3: two bars of volume
   *
   * @private
   */
  updateIcon_() {
    const vol = this.player_.volume();
    let level = 3;

    if (vol === 0 || this.player_.muted()) {
      level = 0;
    } else if (vol < 0.33) {
      level = 1;
    } else if (vol < 0.67) {
      level = 2;
    }

    // TODO improve muted icon classes
    for (let i = 0; i < 4; i++) {
      Dom.removeClass(this.el_, `vjs-vol-${i}`);
    }
    Dom.addClass(this.el_, `vjs-vol-${level}`);
  }

  /**
   * If `muted` has changed on the player, update the control text
   * (`title` attribute on `vjs-mute-control` element and content of
   * `vjs-control-text` element).
   *
   * @private
   */
  updateControlText_() {
    const soundOff = this.player_.muted() || this.player_.volume() === 0;
    const text = soundOff ? 'Unmute' : 'Mute';

    if (this.controlText() !== text) {
      this.controlText(text);
    }
  }

}

/**
 * The text that should display over the `MuteToggle`s controls. Added for localization.
 *
 * @type {string}
 * @private
 */
MuteToggle.prototype.controlText_ = 'Mute';

Component.registerComponent('MuteToggle', MuteToggle);
export default MuteToggle;
