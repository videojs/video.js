/**
 * @file text-track-menu-item.js
 */
import MenuItem from '../../menu/menu-item.js';
import Component from '../../component.js';
import * as Fn from '../../utils/fn.js';
import window from 'global/window';
import document from 'global/document';

/**
 * The specific menu item type for selecting a language within a text track kind
 *
 * @param {Player|Object} player
 * @param {Object=} options
 * @extends MenuItem
 * @class TextTrackMenuItem
 */
class TextTrackMenuItem extends MenuItem {

  constructor(player, options){
    let track = options['track'];
    let tracks = player.textTracks();

    // Modify options for parent MenuItem class's init.
    options['label'] = track['label'] || track['language'] || 'Unknown';
    options['selected'] = track['default'] || track['mode'] === 'showing';
    super(player, options);

    this.track = track;

    if (tracks) {
      let changeHandler = Fn.bind(this, this.handleTracksChange);

      tracks.addEventListener('change', changeHandler);
      this.on('dispose', function() {
        tracks.removeEventListener('change', changeHandler);
      });
    }

    // iOS7 doesn't dispatch change events to TextTrackLists when an
    // associated track's mode changes. Without something like
    // Object.observe() (also not present on iOS7), it's not
    // possible to detect changes to the mode attribute and polyfill
    // the change event. As a poor substitute, we manually dispatch
    // change events whenever the controls modify the mode.
    if (tracks && tracks.onchange === undefined) {
      let event;

      this.on(['tap', 'click'], function() {
        if (typeof window.Event !== 'object') {
          // Android 2.3 throws an Illegal Constructor error for window.Event
          try {
            event = new window.Event('change');
          } catch(err){}
        }

        if (!event) {
          event = document.createEvent('Event');
          event.initEvent('change', true, true);
        }

        tracks.dispatchEvent(event);
      });
    }
  }

  /**
   * Handle click on text track
   *
   * @method handleClick
   */
  handleClick(event) {
    let kind = this.track['kind'];
    let tracks = this.player_.textTracks();

    super.handleClick(event);

    if (!tracks) return;

    for (let i = 0; i < tracks.length; i++) {
      let track = tracks[i];

      if (track['kind'] !== kind) {
        continue;
      }

      if (track === this.track) {
        track['mode'] = 'showing';
      } else {
        track['mode'] = 'disabled';
      }
    }
  }

  /**
   * Handle text track change
   *
   * @method handleTracksChange
   */
  handleTracksChange(event){
    this.selected(this.track['mode'] === 'showing');
  }

}

Component.registerComponent('TextTrackMenuItem', TextTrackMenuItem);
export default TextTrackMenuItem;
