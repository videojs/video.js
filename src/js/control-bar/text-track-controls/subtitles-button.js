/**
 * @file subtitles-button.js
 */
import TextTrackButton from './text-track-button.js';
import Component from '../../component.js';

/**
 * The button component for toggling and selecting subtitles
 *
 * @extends TextTrackButton
 */
class SubtitlesButton extends TextTrackButton {

  /**
   * Creates an instance of this class.
   *
   * @param {Player} player
   *        The `Player` that this class should be attached to.
   *
   * @param {Object} [options]
   *        The key/value store of player options.
   *
   * @param {Component~ReadyCallback} [ready]
   *        The function to call when this component is ready.
   */
  constructor(player, options, ready) {
    super(player, options, ready);
    this.el_.setAttribute('aria-label', 'Subtitles Menu');
  }

  /**
   * Builds the default DOM `className`.
   *
   * @return {string}
   *         The DOM `className` for this object.
   */
  buildCSSClass() {
    return `vjs-subtitles-button ${super.buildCSSClass()}`;
  }

}

/**
 * `kind` of TextTrack to look for to associate it with this menu.
 *
 * @type {string}
 * @private
 */
SubtitlesButton.prototype.kind_ = 'subtitles';

/**
 * The text that should display over the `SubtitlesButton`s controls. Added for localization.
 *
 * @type {string}
 * @private
 */
SubtitlesButton.prototype.controlText_ = 'Subtitles';

Component.registerComponent('SubtitlesButton', SubtitlesButton);
export default SubtitlesButton;
