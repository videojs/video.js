import TextTrackButton from './text-track-button.js';
import TextTrackMenuItem from './text-track-menu-item.js';
import ChaptersTrackMenuItem from './chapters-track-menu-item.js';
import Menu from '../../menu/menu.js';
import * as Lib from '../../lib.js';
import window from 'global/window';

// Chapters act much differently than other text tracks
// Cues are navigation vs. other tracks of alternative languages
/**
 * The button component for toggling and selecting chapters
 *
 * @constructor
 */
class ChaptersButton extends TextTrackButton {

  constructor(player, options, ready){
    super(player, options, ready);
    this.el_.setAttribute('aria-label','Chapters Menu');
  }

  // Create a menu item for each text track
  createItems() {
    let items = [];

    let tracks = this.player_.textTracks();

    if (!tracks) {
      return items;
    }

    for (let i = 0; i < tracks.length; i++) {
      let track = tracks[i];
      if (track['kind'] === this.kind_) {
        items.push(new TextTrackMenuItem(this.player_, {
          'track': track
        }));
      }
    }

    return items;
  }

  createMenu() {
    let tracks = this.player_.textTracks() || [];
    let chaptersTrack;
    let items = this.items = [];

    for (let i = 0, l = tracks.length; i < l; i++) {
      let track = tracks[i];
      if (track['kind'] == this.kind_) {
        if (!track.cues) {
          track['mode'] = 'hidden';
          /* jshint loopfunc:true */
          // TODO see if we can figure out a better way of doing this https://github.com/videojs/video.js/issues/1864
          window.setTimeout(Lib.bind(this, function() {
            this.createMenu();
          }), 100);
          /* jshint loopfunc:false */
        } else {
          chaptersTrack = track;
          break;
        }
      }
    }

    let menu = this.menu;
    if (menu === undefined) {
      menu = new Menu(this.player_);
      menu.contentEl().appendChild(Lib.createEl('li', {
        className: 'vjs-menu-title',
        innerHTML: Lib.capitalize(this.kind_),
        tabindex: -1
      }));
    }

    if (chaptersTrack) {
      let cues = chaptersTrack['cues'], cue;

      for (let i = 0, l = cues.length; i < l; i++) {
        cue = cues[i];

        let mi = new ChaptersTrackMenuItem(this.player_, {
          'track': chaptersTrack,
          'cue': cue
        });

        items.push(mi);

        menu.addChild(mi);
      }
      this.addChild(menu);
    }

    if (this.items.length > 0) {
      this.show();
    }

    return menu;
  }

}

ChaptersButton.prototype.kind_ = 'chapters';
ChaptersButton.prototype.buttonText = 'Chapters';
ChaptersButton.prototype.className = 'vjs-chapters-button';

TextTrackButton.registerComponent('ChaptersButton', ChaptersButton);
export default ChaptersButton;
