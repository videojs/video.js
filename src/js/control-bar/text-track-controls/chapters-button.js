/**
 * @file chapters-button.js
 */
import TextTrackButton from './text-track-button.js';
import Component from '../../component.js';
import ChaptersTrackMenuItem from './chapters-track-menu-item.js';
import toTitleCase from '../../utils/to-title-case.js';

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

  constructor(player, options, ready) {
    super(player, options, ready);
    this.el_.setAttribute('aria-label', 'Chapters Menu');
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

  update(event) {
    if (!this.track_ || (event && (event.type === 'addtrack' || event.type === 'removetrack'))) {
      this.setTrack(this.findChaptersTrack());
    }
    super.update();
  }

  setTrack(track) {
    if (this.track_ === track) {
      return;
    }

    if (!this.updateHandler_) {
      this.updateHandler_ = this.update.bind(this);
    }

    // here this.track_ refers to the old track instance
    if (this.track_) {
      const remoteTextTrackEl = this.player_.remoteTextTrackEls().getTrackElementByTrack_(this.track_);

      if (remoteTextTrackEl) {
        remoteTextTrackEl.removeEventListener('load', this.updateHandler_);
      }

      this.track_ = null;
    }

    this.track_ = track;

    // here this.track_ refers to the new track instance
    if (this.track_) {
      this.track_.mode = 'hidden';

      const remoteTextTrackEl = this.player_.remoteTextTrackEls().getTrackElementByTrack_(this.track_);

      if (remoteTextTrackEl) {
        remoteTextTrackEl.addEventListener('load', this.updateHandler_);
      }
    }
  }

  findChaptersTrack() {
    const tracks = this.player_.textTracks() || [];

    for (let i = tracks.length - 1; i >= 0; i--) {
      // We will always choose the last track as our chaptersTrack
      const track = tracks[i];

      if (track.kind === this.kind_) {
        return track;
      }
    }
  }

  getMenuCaption() {
    if (this.track_ && this.track_.label) {
      return this.track_.label;
    }
    return this.localize(toTitleCase(this.kind_));
  }

  /**
   * Create menu from chapter track
   *
   * @return {Menu} Menu of chapter buttons
   * @method createMenu
   */
  createMenu() {
    this.options_.title = this.getMenuCaption();
    return super.createMenu();
  }

  /**
   * Create a menu item for each chapter cue
   *
   * @return {Array} Array of menu items
   * @method createItems
   */
  createItems() {
    const items = [];

    if (!this.track_) {
      return items;
    }

    const cues = this.track_.cues;

    if (!cues) {
      return items;
    }

    for (let i = 0, l = cues.length; i < l; i++) {
      const cue = cues[i];
      const mi = new ChaptersTrackMenuItem(this.player_, { track: this.track_, cue });

      items.push(mi);
    }

    return items;
  }
}

ChaptersButton.prototype.kind_ = 'chapters';
ChaptersButton.prototype.controlText_ = 'Chapters';

Component.registerComponent('ChaptersButton', ChaptersButton);
export default ChaptersButton;
