/**
 * @file fullscreen-toggle.js
 */
import Button from '../button.js';
import Component from '../component.js';
import document from 'global/document';
import keycode from 'keycode';

/**
 * Toggle fullscreen video
 *
 * @extends Button
 */
class FullscreenToggle extends Button {

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
    this.on(player, 'fullscreenchange', this.handleFullscreenChange);

    if (document[player.fsApi_.fullscreenEnabled] === false) {
      this.disable();
    }
  }

  /**
   * Builds the default DOM `className`.
   *
   * @return {string}
   *         The DOM `className` for this object.
   */
  buildCSSClass() {
    return `vjs-fullscreen-control ${super.buildCSSClass()}`;
  }

  /**
   * Handles fullscreenchange on the player and change control text accordingly.
   *
   * @param {EventTarget~Event} [event]
   *        The {@link Player#fullscreenchange} event that caused this function to be
   *        called.
   *
   * @listens Player#fullscreenchange
   */
  handleFullscreenChange(event) {
    if (this.player_.isFullscreen()) {
      this.controlText('Non-Fullscreen');
    } else {
      this.controlText('Fullscreen');
    }
  }

  /**
   * Handle tab key for `FullscreenToggle`. See
   * {@link ClickableComponent#handleKeyDown} for instances where this is called.
   *
   * @param {EventTarget~Event} event
   *        The `keydown` event that caused this function to be called.
   *
   * @listens keydown
   */
  handleKeyDown(event) {
    // If not Fullscreen mode and Tab press the 'button'
    if (!(this.player_.isFullscreen() && keycode.isEventKey(event, 'Tab'))) {
      return;
    }
    event.preventDefault();

    // Trap the keyboard focus by rewinding back to the play toggle button in the player
    const cb = this.player_.getChild('controlBar');
    const playToggle = cb && cb.getChild('playToggle');

    if (!playToggle) {
      this.player_.tech(true).focus();
      return;
    }

    return playToggle.focus();
  }

  /**
   * This gets called when an `FullscreenToggle` is "clicked". See
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
    if (!this.player_.isFullscreen()) {
      this.player_.requestFullscreen();
    } else {
      this.player_.exitFullscreen();
    }
  }

}

/**
 * The text that should display over the `FullscreenToggle`s controls. Added for localization.
 *
 * @type {string}
 * @private
 */
FullscreenToggle.prototype.controlText_ = 'Fullscreen';

Component.registerComponent('FullscreenToggle', FullscreenToggle);
export default FullscreenToggle;
