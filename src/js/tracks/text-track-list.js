/**
 * @file text-track-list.js
 */
import EventTarget from '../event-target';
import * as Fn from '../utils/fn.js';
import * as browser from '../utils/browser.js';
import document from 'global/document';

/**
 * A text track list as defined in:
 * https://html.spec.whatwg.org/multipage/embedded-content.html#texttracklist
 *
 * interface TextTrackList : EventTarget {
 *   readonly attribute unsigned long length;
 *   getter TextTrack (unsigned long index);
 *   TextTrack? getTrackById(DOMString id);
 *
 *   attribute EventHandler onchange;
 *   attribute EventHandler onaddtrack;
 *   attribute EventHandler onremovetrack;
 * };
 *
 * @param {Track[]} tracks A list of tracks to initialize the list with
 * @extends EventTarget
 * @class TextTrackList
 */

class TextTrackList extends EventTarget {
  constructor(tracks = []) {
    super();
    let list = this;

    if (browser.IS_IE8) {
      list = document.createElement('custom');

      for (let prop in TextTrackList.prototype) {
        if (prop !== 'constructor') {
          list[prop] = TextTrackList.prototype[prop];
        }
      }
    }

    list.tracks_ = [];

    Object.defineProperty(list, 'length', {
      get() {
        return this.tracks_.length;
      }
    });

    for (let i = 0; i < tracks.length; i++) {
      list.addTrack_(tracks[i]);
    }

    if (browser.IS_IE8) {
      return list;
    }
  }

  /**
   * Add TextTrack from TextTrackList
   *
   * @param {TextTrack} track
   * @method addTrack_
   * @private
   */
  addTrack_(track) {
    let index = this.tracks_.length;

    if (!('' + index in this)) {
      Object.defineProperty(this, index, {
        get() {
          return this.tracks_[index];
        }
      });
    }

    track.addEventListener('modechange', Fn.bind(this, function() {
      this.trigger('change');
    }));

    // Do not add duplicate tracks
    if (this.tracks_.indexOf(track) === -1) {
      this.tracks_.push(track);
      this.trigger({
        track,
        type: 'addtrack'
      });
    }

  }

  /**
   * Remove TextTrack from TextTrackList
   * NOTE: Be mindful of what is passed in as it may be a HTMLTrackElement
   *
   * @param {TextTrack} rtrack
   * @method removeTrack_
   * @private
   */
  removeTrack_(rtrack) {
    let track;

    for (let i = 0, l = this.length; i < l; i++) {
      if (this[i] === rtrack) {
        track = this[i];
        if (track.off) {
          track.off();
        }

        this.tracks_.splice(i, 1);

        break;
      }
    }

    if (!track) {
      return;
    }

    this.trigger({
      track,
      type: 'removetrack'
    });
  }

  /**
   * Get a TextTrack from TextTrackList by a tracks id
   *
   * @param {String} id - the id of the track to get
   * @method getTrackById
   * @return {TextTrack}
   * @private
   */
  getTrackById(id) {
    let result = null;

    for (let i = 0, l = this.length; i < l; i++) {
      let track = this[i];

      if (track.id === id) {
        result = track;
        break;
      }
    }

    return result;
  }
}

/**
 * change - One or more tracks in the track list have been enabled or disabled.
 * addtrack - A track has been added to the track list.
 * removetrack - A track has been removed from the track list.
 */
TextTrackList.prototype.allowedEvents_ = {
  change: 'change',
  addtrack: 'addtrack',
  removetrack: 'removetrack'
};

// emulate attribute EventHandler support to allow for feature detection
for (let event in TextTrackList.prototype.allowedEvents_) {
  TextTrackList.prototype['on' + event] = null;
}

export default TextTrackList;
