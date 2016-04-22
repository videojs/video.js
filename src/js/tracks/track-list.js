/**
 * @file track-list.js
 */
import EventTarget from '../event-target';
import * as Fn from '../utils/fn.js';
import * as browser from '../utils/browser.js';
import document from 'global/document';

/**
 * Common functionaliy between Text, Audio, and Video TrackLists
 * Interfaces defined in the following spec:
 * @link https://html.spec.whatwg.org/multipage/embedded-content.html
 *
 * @param {Track[]} tracks A list of tracks to initialize the list with
 * @param {Object} list the child object with inheritance done manually for ie8
 * @extends EventTarget
 * @class TrackList
 */
class TrackList extends EventTarget {
  constructor(tracks = [], list = null) {
    super();
    if (!list) {
      list = this;
      if (browser.IS_IE8) {
        list = document.createElement('custom');
        for (let prop in TrackList.prototype) {
          if (prop !== 'constructor') {
            list[prop] = TrackList.prototype[prop];
          }
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

    return list;
  }

  /**
   * Add a Track from TrackList
   *
   * @param {Mixed} track
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
   * Remove a Track from TrackList
   *
   * @param {Track} rtrack track to be removed
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
   * Get a Track from the TrackList by a tracks id
   *
   * @param {String} id - the id of the track to get
   * @method getTrackById
   * @return {Track}
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
TrackList.prototype.allowedEvents_ = {
  change: 'change',
  addtrack: 'addtrack',
  removetrack: 'removetrack'
};

// emulate attribute EventHandler support to allow for feature detection
for (let event in TrackList.prototype.allowedEvents_) {
  TrackList.prototype['on' + event] = null;
}

export default TrackList;
