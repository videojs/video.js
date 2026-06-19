/**
 * @file track-button.js
 */
import MenuButton from '../menu/menu-button.js';
import Component from '../component.js';
import * as Fn from '../utils/fn.js';

/** @import Player from '../player' */

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

    this.updateHandler_ = Fn.bind_(this, this.update);
    this.cleanupHandler_ = Fn.bind_(this, this.cleanupTrackListeners_);

    tracks.addEventListener('removetrack', this.updateHandler_);
    tracks.addEventListener('addtrack', this.updateHandler_);
    tracks.addEventListener('labelchange', this.updateHandler_);

    this.player_.on('ready', this.updateHandler_);
    this.player_.on('dispose', this.cleanupHandler_);
  }

  /**
   * Remove all track list event listeners without triggering a full dispose.
   * Used as the player 'dispose' handler and called by dispose() before super.
   *
   * @private
   */
  cleanupTrackListeners_() {
    if (!this.updateHandler_) {
      return;
    }

    const tracks = this.options_.tracks;

    if (tracks) {
      tracks.removeEventListener('removetrack', this.updateHandler_);
      tracks.removeEventListener('addtrack', this.updateHandler_);
      tracks.removeEventListener('labelchange', this.updateHandler_);
    }

    if (this.player_) {
      this.player_.off('ready', this.updateHandler_);
      this.player_.off('dispose', this.cleanupHandler_);
    }

    this.updateHandler_ = null;
    this.cleanupHandler_ = null;
  }

  /**
   * Dispose of the Component and remove all event listeners.
   *
   * @override
   */
  dispose() {
    this.cleanupTrackListeners_();

    super.dispose();
  }
}

Component.registerComponent('TrackButton', TrackButton);
export default TrackButton;
