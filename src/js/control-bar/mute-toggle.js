/**
 * @file mute-toggle.js
 */
import Button from '../button';
import Component from '../component';
import * as Dom from '../utils/dom.js';

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

    this.on(player, 'volumechange', this.update);

    // hide mute toggle if the current tech doesn't support volume control
    if (player.tech_ && player.tech_.featuresVolumeControl === false) {
      this.addClass('vjs-hidden');
    }

    this.on(player, 'loadstart', function() {
      // We need to update the button to account for a default muted state.
      this.update();

      if (player.tech_.featuresVolumeControl === false) {
        this.addClass('vjs-hidden');
      } else {
        this.removeClass('vjs-hidden');
      }
    });
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
    this.player_.muted(this.player_.muted() ? false : true);
  }

  /**
   * Update the state of volume.
   *
   * @param {EventTarget~Event} [event]
   *        The {@link Player#loadstart} event if this function was called through an
   *        event.
   *
   * @listens Player#loadstart
   */
  update(event) {
    const vol = this.player_.volume();
    let level = 3;

    if (vol === 0 || this.player_.muted()) {
      level = 0;
    } else if (vol < 0.33) {
      level = 1;
    } else if (vol < 0.67) {
      level = 2;
    }

    // Don't rewrite the button text if the actual text doesn't change.
    // This causes unnecessary and confusing information for screen reader users.
    // This check is needed because this function gets called every time the volume level is changed.
    const toMute = this.player_.muted() ? 'Unmute' : 'Mute';

    if (this.controlText() !== toMute) {
      this.controlText(toMute);
    }

    // TODO improve muted icon classes
    for (let i = 0; i < 4; i++) {
      Dom.removeElClass(this.el_, `vjs-vol-${i}`);
    }
    Dom.addElClass(this.el_, `vjs-vol-${level}`);
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
