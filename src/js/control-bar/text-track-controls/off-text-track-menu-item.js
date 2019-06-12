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
      // it is no longer necessary to store `kind` or `kinds` on the track itself
      // since they are now stored in the `kinds` property of all instances of
      // TextTrackMenuItem, but this will remain for backwards compatibility
      kind: options.kind,
      kinds: options.kinds,
      default: false,
      mode: 'disabled'
    };

    if (!options.kinds) {
      options.kinds = [options.kind];
    }

    if (options.label) {
      options.track.label = options.label;
    } else {
      options.track.label = options.kinds.join(' and ') + ' off';
    }

    // MenuItem is selectable
    options.selectable = true;
    // MenuItem is NOT multiSelectable (i.e. only one can be marked "selected" at a time)
    options.multiSelectable = false;

    super(player, options);
  }

  /**
   * Handle text track change
   *
   * @param {EventTarget~Event} event
   *        The event that caused this function to run
   */
  handleTracksChange(event) {
    const tracks = this.player().textTracks();
    let shouldBeSelected = true;

    for (let i = 0, l = tracks.length; i < l; i++) {
      const track = tracks[i];

      if ((this.options_.kinds.indexOf(track.kind) > -1) && track.mode === 'showing') {
        shouldBeSelected = false;
        break;
      }
    }

    // Prevent redundant selected() calls because they may cause
    // screen readers to read the appended control text unnecessarily
    if (shouldBeSelected !== this.isSelected_) {
      this.selected(shouldBeSelected);
    }
  }

  handleSelectedLanguageChange(event) {
    const tracks = this.player().textTracks();
    let allHidden = true;

    for (let i = 0, l = tracks.length; i < l; i++) {
      const track = tracks[i];

      if ((['captions', 'descriptions', 'subtitles'].indexOf(track.kind) > -1) && track.mode === 'showing') {
        allHidden = false;
        break;
      }
    }

    if (allHidden) {
      this.player_.cache_.selectedLanguage = {
        enabled: false
      };
    }
  }

}

Component.registerComponent('OffTextTrackMenuItem', OffTextTrackMenuItem);
export default OffTextTrackMenuItem;
