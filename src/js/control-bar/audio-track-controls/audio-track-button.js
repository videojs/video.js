/**
 * @file audio-track-button.js
 */
import TrackButton from '../track-button.js';
import Component from '../../component.js';
import * as Fn from '../../utils/fn.js';
import AudioTrackMenuItem from './audio-track-menu-item.js';

/**
 * The base class for buttons that toggle specific text track types (e.g. subtitles)
 *
 * @param {Player|Object} player
 * @param {Object=} options
 * @extends TrackButton
 * @class AudioTrackButton
 */
class AudioTrackButton extends TrackButton {
  constructor(player, options = {}) {
    options.tracks = player.audioTracks && player.audioTracks();

    super(player, options);

    this.el_.setAttribute('aria-label', 'Audio Menu');
  }

  /**
   * Allow sub components to stack CSS class names
   *
   * @return {String} The constructed class name
   * @method buildCSSClass
   */
  buildCSSClass() {
    return `vjs-audio-button ${super.buildCSSClass()}`;
  }

  /**
   * Create a menu item for each audio track
   *
   * @return {Array} Array of menu items
   * @method createItems
   */
  createItems(items = []) {
    let tracks = this.player_.audioTracks && this.player_.audioTracks();

    if (!tracks) {
      return items;
    }

    for (let i = 0; i < tracks.length; i++) {
      let track = tracks[i];

      items.push(new AudioTrackMenuItem(this.player_, {
        // MenuItem is selectable
        'selectable': true,
        'track': track
      }));
    }

    return items;
  }
}

Component.registerComponent('AudioTrackButton', AudioTrackButton);
export default AudioTrackButton;
