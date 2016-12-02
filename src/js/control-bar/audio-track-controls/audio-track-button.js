/**
 * @file audio-track-button.js
 */
import TrackButton from '../track-button.js';
import Component from '../../component.js';
import AudioTrackMenuItem from './audio-track-menu-item.js';

/**
 * The base class for buttons that toggle specific {@link AudioTrack} types.
 *
 * @extends TrackButton
 */
class AudioTrackButton extends TrackButton {

  /**
   * Creates an instance of this class.
   *
   * @param {Player} player
   *        The `Player` that this class should be attached to.
   *
   * @param {Object} [options={}]
   *        The key/value store of player options.
   */
  constructor(player, options = {}) {
    options.tracks = player.audioTracks && player.audioTracks();

    super(player, options);

    this.el_.setAttribute('aria-label', 'Audio Menu');
  }

  /**
   * Builds the default DOM `className`.
   *
   * @return {string}
   *         The DOM `className` for this object.
   */
  buildCSSClass() {
    return `vjs-audio-button ${super.buildCSSClass()}`;
  }

  /**
   * Create a menu item for each audio track
   *
   * @param {AudioTrackMenuItem[]} [items=[]]
   *        An array of existing menu items to use.
   *
   * @return {AudioTrackMenuItem[]}
   *         An array of menu items
   */
  createItems(items = []) {
    const tracks = this.player_.audioTracks && this.player_.audioTracks();

    if (!tracks) {
      return items;
    }

    for (let i = 0; i < tracks.length; i++) {
      const track = tracks[i];

      items.push(new AudioTrackMenuItem(this.player_, {
        track,
        // MenuItem is selectable
        selectable: true
      }));
    }

    return items;
  }
}

/**
 * The text that should display over the `AudioTrackButton`s controls. Added for localization.
 *
 * @type {string}
 * @private
 */
AudioTrackButton.prototype.controlText_ = 'Audio Track';
Component.registerComponent('AudioTrackButton', AudioTrackButton);
export default AudioTrackButton;
