/**
 * @file chapters-button.js
 */
import TextTrackButton from './text-track-button.js';
import Component from '../../component.js';
import TextTrackMenuItem from './text-track-menu-item.js';
import ChaptersTrackMenuItem from './chapters-track-menu-item.js';
import Menu from '../../menu/menu.js';
import * as Dom from '../../utils/dom.js';
import * as Fn from '../../utils/fn.js';
import toTitleCase from '../../utils/to-title-case.js';
import window from 'global/window';

/**
 * The button component for toggling and selecting chapters
 * Chapters act much differently than other text tracks
 * Cues are navigation vs. other tracks of alternative languages
 *
 * @param {Object} player  Player object
 * @param {Object=} options Object of option names and values
 * @param {Function=} ready    Ready callback function
 * @extends TextTrackButton
 * @class ChaptersButton
 */
class ChaptersButton extends TextTrackButton {

  constructor(player, options, ready){
    super(player, options, ready);
    this.el_.setAttribute('aria-label','Chapters Menu');
  }

  /**
   * Allow sub components to stack CSS class names
   *
   * @return {String} The constructed class name
   * @method buildCSSClass
   */
  buildCSSClass() {
    return `vjs-chapters-button ${super.buildCSSClass()}`;
  }

  /**
   * Create a menu item for each text track
   *
   * @return {Array} Array of menu items
   * @method createItems
   */
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

  /**
   * Create menu from chapter buttons
   *
   * @return {Menu} Menu of chapter buttons
   * @method createMenu
   */
  createMenu() {
    let tracks = this.player_.textTracks() || [];
    let chaptersTrack;
    let items = this.items = [];

    for (let i = 0, l = tracks.length; i < l; i++) {
      let track = tracks[i];
      if (track['kind'] === this.kind_) {
        if (!track.cues) {
          track['mode'] = 'hidden';
          /* jshint loopfunc:true */
          // TODO see if we can figure out a better way of doing this https://github.com/videojs/video.js/issues/1864
          window.setTimeout(Fn.bind(this, function() {
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
      menu.contentEl().appendChild(Dom.createEl('li', {
        className: 'vjs-menu-title',
        innerHTML: toTitleCase(this.kind_),
        tabIndex: -1
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
ChaptersButton.prototype.controlText_ = 'Chapters';

Component.registerComponent('ChaptersButton', ChaptersButton);
export default ChaptersButton;
