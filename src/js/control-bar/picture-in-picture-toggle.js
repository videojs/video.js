/**
 * @file picture-in-picture-toggle.js
 */
import Button from '../button.js';
import Component from '../component.js';
import document from 'global/document';
import window from 'global/window';

/** @import Player from './player' */

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

    this.setIcon('picture-in-picture-enter');

    this.on(player, ['enterpictureinpicture', 'leavepictureinpicture'], (e) => this.handlePictureInPictureChange(e));
    this.on(player, ['disablepictureinpicturechanged', 'loadedmetadata'], (e) => this.handlePictureInPictureEnabledChange(e));
    this.on(player, ['loadedmetadata', 'audioonlymodechange', 'audiopostermodechange'], () => this.handlePictureInPictureAudioModeChange());

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
    return `vjs-picture-in-picture-control vjs-hidden ${super.buildCSSClass()}`;
  }

  /**
   * Displays or hides the button depending on the audio mode detection.
   * Exits picture-in-picture if it is enabled when switching to audio mode.
   */
  handlePictureInPictureAudioModeChange() {
    // This audio detection will not detect HLS or DASH audio-only streams because there was no reliable way to detect them at the time
    const isSourceAudio = this.player_.currentType().substring(0, 5) === 'audio';
    const isAudioMode =
      isSourceAudio || this.player_.audioPosterMode() || this.player_.audioOnlyMode();

    if (!isAudioMode) {
      this.show();

      return;
    }

    if (this.player_.isInPictureInPicture()) {
      this.player_.exitPictureInPicture();
    }

    this.hide();
  }

  /**
   * Enables or disables button based on availability of a Picture-In-Picture mode.
   *
   * Enabled if
   * - `player.options().enableDocumentPictureInPicture` is true and
   *   window.documentPictureInPicture is available; or
   * - `player.disablePictureInPicture()` is false and
   *   element.requestPictureInPicture is available
   */
  handlePictureInPictureEnabledChange() {
    if (
      (document.pictureInPictureEnabled && this.player_.disablePictureInPicture() === false) ||
      (this.player_.options_.enableDocumentPictureInPicture && 'documentPictureInPicture' in window)
    ) {
      this.enable();
    } else {
      this.disable();
    }
  }

  /**
   * Handles enterpictureinpicture and leavepictureinpicture on the player and change control text accordingly.
   *
   * @param {Event} [event]
   *        The {@link Player#enterpictureinpicture} or {@link Player#leavepictureinpicture} event that caused this function to be
   *        called.
   *
   * @listens Player#enterpictureinpicture
   * @listens Player#leavepictureinpicture
   */
  handlePictureInPictureChange(event) {
    if (this.player_.isInPictureInPicture()) {
      this.setIcon('picture-in-picture-exit');
      this.controlText('Exit Picture-in-Picture');
    } else {
      this.setIcon('picture-in-picture-enter');
      this.controlText('Picture-in-Picture');
    }
    this.handlePictureInPictureEnabledChange();
  }

  /**
   * This gets called when an `PictureInPictureToggle` is "clicked". See
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
    if (!this.player_.isInPictureInPicture()) {
      this.player_.requestPictureInPicture();
    } else {
      this.player_.exitPictureInPicture();
    }
  }

  /**
   * Show the `Component`s element if it is hidden by removing the
   * 'vjs-hidden' class name from it only in browsers that support the Picture-in-Picture API.
   */
  show() {
    // Does not allow to display the pictureInPictureToggle in browsers that do not support the Picture-in-Picture API, e.g. Firefox.
    if (typeof document.exitPictureInPicture !== 'function') {
      return;
    }

    super.show();
  }
}

/**
 * The text that should display over the `PictureInPictureToggle`s controls. Added for localization.
 *
 * @type {string}
 * @protected
 */
PictureInPictureToggle.prototype.controlText_ = 'Picture-in-Picture';

Component.registerComponent('PictureInPictureToggle', PictureInPictureToggle);
export default PictureInPictureToggle;
