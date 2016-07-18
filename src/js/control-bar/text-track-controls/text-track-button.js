/**
 * @file text-track-button.js
 */
import TrackButton from '../track-button.js';
import Component from '../../component.js';
import * as Fn from '../../utils/fn.js';
import TextTrackMenuItem from './text-track-menu-item.js';
import OffTextTrackMenuItem from './off-text-track-menu-item.js';

/**
 * The base class for buttons that toggle specific text track types (e.g. subtitles)
 *
 * @param {Player|Object} player
 * @param {Object=} options
 * @extends MenuButton
 * @class TextTrackButton
 */
class TextTrackButton extends TrackButton {

  constructor(player, options = {}){
    options.tracks = player.textTracks();

    super(player, options);
  }

  /**
   * Create a menu item for each text track
   *
   * @return {Array} Array of menu items
   * @method createItems
   */
  createItems(items=[]) {
    // Add an OFF menu item to turn all tracks off
    items.push(new OffTextTrackMenuItem(this.player_, { 'kind': this.kind_ }));

    let tracks = this.player_.textTracks();

    if (!tracks) {
      return items;
    }

    for (let i = 0; i < tracks.length; i++) {
      let track = tracks[i];

      // only add tracks that are of the appropriate kind and have a label
      if (track['kind'] === this.kind_) {
        items.push(new TextTrackMenuItem(this.player_, {
          // MenuItem is selectable
          'selectable': true,
          'track': track
        }));
      }
    }

    return items;
  }

}

Component.registerComponent('TextTrackButton', TextTrackButton);
export default TextTrackButton;
