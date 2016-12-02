/**
 * @file text-track-button.js
 */
import TrackButton from '../track-button.js';
import Component from '../../component.js';
import TextTrackMenuItem from './text-track-menu-item.js';
import OffTextTrackMenuItem from './off-text-track-menu-item.js';

/**
 * The base class for buttons that toggle specific text track types (e.g. subtitles)
 *
 * @extends MenuButton
 */
class TextTrackButton extends TrackButton {

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
    options.tracks = player.textTracks();

    super(player, options);
  }

  /**
   * Create a menu item for each text track
   *
   * @param {TextTrackMenuItem[]} [items=[]]
   *        Existing array of items to use during creation
   *
   * @return {TextTrackMenuItem[]}
   *         Array of menu items that were created
   */
  createItems(items = []) {
    // Add an OFF menu item to turn all tracks off
    items.push(new OffTextTrackMenuItem(this.player_, {kind: this.kind_}));

    const tracks = this.player_.textTracks();

    if (!tracks) {
      return items;
    }

    for (let i = 0; i < tracks.length; i++) {
      const track = tracks[i];

      // only add tracks that are of the appropriate kind and have a label
      if (track.kind === this.kind_) {
        items.push(new TextTrackMenuItem(this.player_, {
          track,
          // MenuItem is selectable
          selectable: true
        }));
      }
    }

    return items;
  }

}

Component.registerComponent('TextTrackButton', TextTrackButton);
export default TextTrackButton;
