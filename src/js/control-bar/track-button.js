/**
 * @file track-button.js
 */
import MenuButton from '../menu/menu-button.js';
import Component from '../component.js';
import * as Fn from '../utils/fn.js';

/**
 * The base class for buttons that toggle specific text track types (e.g. subtitles)
 *
 * @param {Player|Object} player
 * @param {Object=} options
 * @extends MenuButton
 * @class TrackButton
 */
class TrackButton extends MenuButton {

  constructor(player, options){
    let tracks = options.tracks;

    super(player, options);

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

}

Component.registerComponent('TrackButton', TrackButton);
export default TrackButton;
