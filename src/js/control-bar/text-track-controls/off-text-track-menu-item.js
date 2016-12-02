/**
 * @file off-text-track-menu-item.js
 */
import TextTrackMenuItem from './text-track-menu-item.js';
import Component from '../../component.js';

/**
 * A special menu item for turning of a specific type of text track
 *
 * @extends TextTrackMenuItem
 */
class OffTextTrackMenuItem extends TextTrackMenuItem {

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
    // Create pseudo track info
    // Requires options['kind']
    options.track = {
      player,
      kind: options.kind,
      label: options.kind + ' off',
      default: false,
      mode: 'disabled'
    };

    // MenuItem is selectable
    options.selectable = true;

    super(player, options);
    this.selected(true);
  }

  /**
   * Handle text track change
   *
   * @param {EventTarget~Event} event
   *        The event that caused this function to run
   */
  handleTracksChange(event) {
    const tracks = this.player().textTracks();
    let selected = true;

    for (let i = 0, l = tracks.length; i < l; i++) {
      const track = tracks[i];

      if (track.kind === this.track.kind && track.mode === 'showing') {
        selected = false;
        break;
      }
    }

    this.selected(selected);
  }

}

Component.registerComponent('OffTextTrackMenuItem', OffTextTrackMenuItem);
export default OffTextTrackMenuItem;
