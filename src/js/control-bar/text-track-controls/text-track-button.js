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
  createItems(items = [], TrackMenuItem = TextTrackMenuItem) {

    // Label is an override for the [track] off label
    // USed to localise captions/subtitles
    let label;

    if (this.label_) {
      label = `${this.label_} off`;
    }
    // Add an OFF menu item to turn all tracks off
    items.push(new OffTextTrackMenuItem(this.player_, {
      kinds: this.kinds_,
      kind: this.kind_,
      label
    }));

    this.hideThreshold_ += 1;

    const tracks = this.player_.textTracks();

    if (!Array.isArray(this.kinds_)) {
      this.kinds_ = [this.kind_];
    }

    for (let i = 0; i < tracks.length; i++) {
      const track = tracks[i];

      // only add tracks that are of an appropriate kind and have a label
      if (this.kinds_.indexOf(track.kind) > -1) {

        const item = new TrackMenuItem(this.player_, {
          track,
          kinds: this.kinds_,
          kind: this.kind_,
          // MenuItem is selectable
          selectable: true,
          // MenuItem is NOT multiSelectable (i.e. only one can be marked "selected" at a time)
          multiSelectable: false
        });

        item.addClass(`vjs-${track.kind}-menu-item`);
        items.push(item);
      }
    }

    return items;
  }

}

Component.registerComponent('TextTrackButton', TextTrackButton);
export default TextTrackButton;
