/**
 * @file picture-in-picture-toggle.js
 */
import Button from '../button.js';
import Component from '../component.js';
import document from 'global/document';

/**
 * Toggle Picture-in-Picture mode
 *
 * @extends Button
 */
class PictureInPictureToggle extends Button {

  /**
   * Creates an instance of this class.
   *
   * @param {Player} player
   *        The `Player` that this class should be attached to.
   *
   * @param {Object} [options]
   *        The key/value store of player options.
   *
   * @listens Player#enterpictureinpicture
   * @listens Player#leavepictureinpicture
   */
  constructor(player, options) {
    super(player, options);
    this.on(player, ['enterpictureinpicture', 'leavepictureinpicture'], (e) => this.handlePictureInPictureChange(e));
    this.on(player, ['disablepictureinpicturechanged', 'loadedmetadata'], (e) => this.handlePictureInPictureEnabledChange(e));

    // TODO: Deactivate button on player emptied event.
    this.disable();
  }

  /**
   * Builds the default DOM `className`.
   *
   * @return {string}
   *         The DOM `className` for this object.
   */
  buildCSSClass() {
    return `vjs-picture-in-picture-control ${super.buildCSSClass()}`;
  }

  /**
   * Enables or disables button based on document.pictureInPictureEnabled property value
   * or on value returned by player.disablePictureInPicture() method.
   */
  handlePictureInPictureEnabledChange() {
    if (document.pictureInPictureEnabled && this.player_.disablePictureInPicture() === false) {
      this.enable();
    } else {
      this.disable();
    }
  }

  /**
   * Handles enterpictureinpicture and leavepictureinpicture on the player and change control text accordingly.
   *
   * @param {EventTarget~Event} [event]
   *        The {@link Player#enterpictureinpicture} or {@link Player#leavepictureinpicture} event that caused this function to be
   *        called.
   *
   * @listens Player#enterpictureinpicture
   * @listens Player#leavepictureinpicture
   */
  handlePictureInPictureChange(event) {
    if (this.player_.isInPictureInPicture()) {
      this.controlText('Exit Picture-in-Picture');
    } else {
      this.controlText('Picture-in-Picture');
    }
    this.handlePictureInPictureEnabledChange();
  }

  /**
   * This gets called when an `PictureInPictureToggle` is "clicked". See
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
    if (!this.player_.isInPictureInPicture()) {
      this.player_.requestPictureInPicture();
    } else {
      this.player_.exitPictureInPicture();
    }
  }

}

/**
 * The text that should display over the `PictureInPictureToggle`s controls. Added for localization.
 *
 * @type {string}
 * @private
 */
PictureInPictureToggle.prototype.controlText_ = 'Picture-in-Picture';

Component.registerComponent('PictureInPictureToggle', PictureInPictureToggle);
export default PictureInPictureToggle;
