/**
 * @file text-track-list.js
 */
import TrackList from './track-list';
import * as Fn from '../utils/fn.js';
import * as browser from '../utils/browser.js';
import document from 'global/document';

/**
 * A list of possible text tracks. All functionality is in the
 * base class TrackList. The spec for TextTrackList is located at:
 * @link https://html.spec.whatwg.org/multipage/embedded-content.html#texttracklist
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
 * @param {TextTrack[]} tracks A list of tracks to initialize the list with
 * @extends TrackList
 * @class TextTrackList
 */
class TextTrackList extends TrackList {
  constructor(tracks = []) {
    let list;

    // IE8 forces us to implement inheritance ourselves
    // as it does not support Object.defineProperty properly
    if (browser.IS_IE8) {
      list = document.createElement('custom');
      for (let prop in TrackList.prototype) {
        if (prop !== 'constructor') {
          list[prop] = TrackList.prototype[prop];
        }
      }
      for (let prop in TextTrackList.prototype) {
        if (prop !== 'constructor') {
          list[prop] = TextTrackList.prototype[prop];
        }
      }
    }

    list = super(tracks, list);
    return list;
  }

  addTrack_(track) {
    super.addTrack_(track);
    track.addEventListener('modechange', Fn.bind(this, function() {
      this.trigger('change');
    }));
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
export default TextTrackList;
