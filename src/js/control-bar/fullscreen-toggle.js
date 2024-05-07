/**
 * @file fullscreen-toggle.js
 */
import Button from '../button.js';
import Component from '../component.js';
import document from 'global/document';

/** @import Player from './player' */

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
    this.setIcon('fullscreen-enter');
    this.on(player, 'fullscreenchange', (e) => this.handleFullscreenChange(e));

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
   * @param {Event} [event]
   *        The {@link Player#fullscreenchange} event that caused this function to be
   *        called.
   *
   * @listens Player#fullscreenchange
   */
  handleFullscreenChange(event) {
    if (this.player_.isFullscreen()) {
      this.controlText('Exit Fullscreen');
      this.setIcon('fullscreen-exit');
    } else {
      this.controlText('Fullscreen');
      this.setIcon('fullscreen-enter');
    }
  }

  /**
   * This gets called when an `FullscreenToggle` is "clicked". See
   * {@link ClickableComponent} for more detailed information on what a click can be.
   *
   * @param {Event} [event]
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
 * @protected
 */
FullscreenToggle.prototype.controlText_ = 'Fullscreen';

Component.registerComponent('FullscreenToggle', FullscreenToggle);
export default FullscreenToggle;
