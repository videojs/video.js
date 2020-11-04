/**
 * @file track-button.js
 */
import MenuButton from '../menu/menu-button.js';
import Component from '../component.js';
import * as Fn from '../utils/fn.js';

/**
 * The base class for buttons that toggle specific  track types (e.g. subtitles).
 *
 * @extends MenuButton
 */
class TrackButton extends MenuButton {

  /**
   * Creates an instance of this class.
   *
   * @param {Player} player
   *        The `Player` that this class should be attached to.
   *
   * @param {Object} [options]
   *        The key/value store of player options.
   */
  constructor(player, options) {
    const tracks = options.tracks;

    super(player, options);

    if (this.items.length <= 1) {
      this.hide();
    }

    if (!tracks) {
      return;
    }

    const updateHandler = Fn.bind(this, this.update);

    tracks.addEventListener('removetrack', updateHandler);
    tracks.addEventListener('addtrack', updateHandler);
    tracks.addEventListener('labelchange', updateHandler);
    this.player_.on('ready', updateHandler);

    this.player_.on('dispose', function() {
      tracks.removeEventListener('removetrack', updateHandler);
      tracks.removeEventListener('addtrack', updateHandler);
      tracks.removeEventListener('labelchange', updateHandler);
    });
  }

}

Component.registerComponent('TrackButton', TrackButton);
export default TrackButton;
