/**
 * @file descriptions-button.js
 */
import TextTrackButton from './text-track-button.js';
import Component from '../../component.js';
import * as Fn from '../../utils/fn.js';

/**
 * The button component for toggling and selecting descriptions
 *
 * @extends TextTrackButton
 */
class DescriptionsButton extends TextTrackButton {

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

    const tracks = player.textTracks();
    const changeHandler = Fn.bind(this, this.handleTracksChange);

    tracks.addEventListener('change', changeHandler);
    this.on('dispose', function() {
      tracks.removeEventListener('change', changeHandler);
    });
  }

  /**
   * Handle text track change
   *
   * @param {EventTarget~Event} event
   *        The event that caused this function to run
   *
   * @listens TextTrackList#change
   */
  handleTracksChange(event) {
    const tracks = this.player().textTracks();
    let disabled = false;

    // Check whether a track of a different kind is showing
    for (let i = 0, l = tracks.length; i < l; i++) {
      const track = tracks[i];

      if (track.kind !== this.kind_ && track.mode === 'showing') {
        disabled = true;
        break;
      }
    }

    // If another track is showing, disable this menu button
    if (disabled) {
      this.disable();
    } else {
      this.enable();
    }
  }

  /**
   * Builds the default DOM `className`.
   *
   * @return {string}
   *         The DOM `className` for this object.
   */
  buildCSSClass() {
    return `vjs-descriptions-button ${super.buildCSSClass()}`;
  }

  buildWrapperCSSClass() {
    return `vjs-descriptions-button ${super.buildWrapperCSSClass()}`;
  }
}

/**
 * `kind` of TextTrack to look for to associate it with this menu.
 *
 * @type {string}
 * @private
 */
DescriptionsButton.prototype.kind_ = 'descriptions';

/**
 * The text that should display over the `DescriptionsButton`s controls. Added for localization.
 *
 * @type {string}
 * @private
 */
DescriptionsButton.prototype.controlText_ = 'Descriptions';

Component.registerComponent('DescriptionsButton', DescriptionsButton);
export default DescriptionsButton;
