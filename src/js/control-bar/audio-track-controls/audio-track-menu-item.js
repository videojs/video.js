/**
 * @file audio-track-menu-item.js
 */
import MenuItem from '../../menu/menu-item.js';
import Component from '../../component.js';
import * as Fn from '../../utils/fn.js';

/**
 * The audio track menu item
 *
 * @param {Player|Object} player
 * @param {Object=} options
 * @extends MenuItem
 * @class AudioTrackMenuItem
 */
class AudioTrackMenuItem extends MenuItem {
  constructor(player, options) {
    let track = options.track;
    let tracks = player.audioTracks();

    // Modify options for parent MenuItem class's init.
    options.label = track.label || track.language || 'Unknown';
    options.selected = track.enabled;

    super(player, options);

    this.track = track;

    if (tracks) {
      let changeHandler = Fn.bind(this, this.handleTracksChange);

      tracks.addEventListener('change', changeHandler);
      this.on('dispose', () => {
        tracks.removeEventListener('change', changeHandler);
      });
    }
  }

  /**
   * Handle click on audio track
   *
   * @method handleClick
   */
  handleClick(event) {
    let tracks = this.player_.audioTracks();

    super.handleClick(event);

    if (!tracks) return;

    for (let i = 0; i < tracks.length; i++) {
      let track = tracks[i];

      if (track === this.track) {
        track.enabled = true;
      }
    }
  }

  /**
   * Handle audio track change
   *
   * @method handleTracksChange
   */
  handleTracksChange(event) {
    this.selected(this.track.enabled);
  }
}

Component.registerComponent('AudioTrackMenuItem', AudioTrackMenuItem);
export default AudioTrackMenuItem;
