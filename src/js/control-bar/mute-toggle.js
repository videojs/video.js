/**
 * @file mute-toggle.js
 */
import Button from '../button';
import Component from '../component';
import * as Dom from '../utils/dom.js';

/**
 * A button component for muting the audio
 *
 * @param {Player|Object} player
 * @param {Object=} options
 * @extends Button
 * @class MuteToggle
 */
class MuteToggle extends Button {

  constructor(player, options) {
    super(player, options);

    this.on(player, 'volumechange', this.update);

    // hide mute toggle if the current tech doesn't support volume control
    if (player.tech_ && player.tech_['featuresVolumeControl'] === false) {
      this.addClass('vjs-hidden');
    }

    this.on(player, 'loadstart', function() {
      this.update(); // We need to update the button to account for a default muted state.

      if (player.tech_['featuresVolumeControl'] === false) {
        this.addClass('vjs-hidden');
      } else {
        this.removeClass('vjs-hidden');
      }
    });
  }

  /**
   * Allow sub components to stack CSS class names
   *
   * @return {String} The constructed class name
   * @method buildCSSClass
   */
  buildCSSClass() {
    return `vjs-mute-control ${super.buildCSSClass()}`;
  }

  /**
   * Handle click on mute
   *
   * @method handleClick
   */
  handleClick() {
    this.player_.muted( this.player_.muted() ? false : true );
  }

  /**
   * Update volume
   *
   * @method update
   */
  update() {
    var vol = this.player_.volume(),
        level = 3;

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
    let toMute = this.player_.muted() ? 'Unmute' : 'Mute';
    let localizedMute = this.localize(toMute);
    if (this.controlText() !== localizedMute) {
      this.controlText(localizedMute);
    }

    /* TODO improve muted icon classes */
    for (var i = 0; i < 4; i++) {
      Dom.removeElClass(this.el_, `vjs-vol-${i}`);
    }
    Dom.addElClass(this.el_, `vjs-vol-${level}`);
  }

}

MuteToggle.prototype.controlText_ = 'Mute';

Component.registerComponent('MuteToggle', MuteToggle);
export default MuteToggle;
