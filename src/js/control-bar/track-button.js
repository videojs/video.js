/**
 * @file track-button.js
 */
import MenuButton from '../menu/menu-button.js';
import Component from '../component.js';
import * as Fn from '../utils/fn.js';

/** @import Player from './player' */

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

    const updateHandler = Fn.bind_(this, this.update);
    const disposeHandler = Fn.bind_(this, this.dispose);

    // keep references to the event handlers so subclasses / callers can remove listeners if they dispose the component
    this.updateHandler_ = updateHandler;
    this.disposeHandler_ = disposeHandler;

    tracks.addEventListener('removetrack', updateHandler);
    tracks.addEventListener('addtrack', updateHandler);
    tracks.addEventListener('labelchange', updateHandler);
    this.player_.on('ready', updateHandler);
    this.player_.on('dispose', disposeHandler);
  }

  /**
   * Dispose of the Component and remove all event listeners
   *
   * @override
   */
  dispose() {
    const tracks = this.options_.tracks;

    tracks.removeEventListener('removetrack', this.updateHandler_);
    tracks.removeEventListener('addtrack', this.updateHandler_);
    tracks.removeEventListener('labelchange', this.updateHandler_);

    this.player_.off('ready', this.updateHandler_);
    this.player_.off('dispose', this.disposeHandler_);

    delete this.updateHandler_;
    delete this.disposeHandler_;

    super.dispose();
  }
}

Component.registerComponent('TrackButton', TrackButton);
export default TrackButton;
