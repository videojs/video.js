/**
 * @file off-text-track-menu-item.js
 */
import TextTrackMenuItem from './text-track-menu-item.js';
import Component from '../../component.js';

/**
 * A special menu item for turning of a specific type of text track
 *
 * @param {Player|Object} player
 * @param {Object=} options
 * @extends TextTrackMenuItem
 * @class OffTextTrackMenuItem
 */
class OffTextTrackMenuItem extends TextTrackMenuItem {

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
   * @param {Object} event Event object
   * @method handleTracksChange
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
