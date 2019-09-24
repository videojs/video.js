/**
 * @file fullscreen-toggle.js
 */
import Button from '../button.js';
import Component from '../component.js';
import document from 'global/document';

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
    /**
     * On IE11 and Edge, focus is moved to the window when fullscreen is
     * enabled. This ensures screen readers keep focus on the FullscreenToggle
     * element after activating the button.
     */
    if (this._clickElement === this.el()) {
      this.el().focus();
      this._clickElement = null;
    }
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
    this._clickElement = event.currentTarget;
    if (!this.player_.isFullscreen()) {
      this.player_.requestFullscreen();
    } else {
      this.player_.exitFullscreen();
    }
    /**
     * On IE11 and Edge, focus is moved to the window when fullscreen is
     * enabled. This ensures screen readers keep focus on the FullscreenToggle
     * element after activating the button.
     */
    this.el().focus();
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
