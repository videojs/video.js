/**
 * @file text-track-button.js
 */
import MenuButton from '../../menu/menu-button.js';
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
class TextTrackButton extends MenuButton {

  constructor(player, options){
    super(player, options);

    let tracks = this.player_.textTracks();

    if (this.items.length <= 1) {
      this.hide();
    }

    if (!tracks) {
      return;
    }

    let updateHandler = Fn.bind(this, this.update);
    tracks.addEventListener('removetrack', updateHandler);
    tracks.addEventListener('addtrack', updateHandler);

    this.player_.on('dispose', function() {
      tracks.removeEventListener('removetrack', updateHandler);
      tracks.removeEventListener('addtrack', updateHandler);
    });
  }

  // Create a menu item for each text track
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
