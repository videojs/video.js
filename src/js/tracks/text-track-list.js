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
      for (const prop in TrackList.prototype) {
        if (prop !== 'constructor') {
          list[prop] = TrackList.prototype[prop];
        }
      }
      for (const prop in TextTrackList.prototype) {
        if (prop !== 'constructor') {
          list[prop] = TextTrackList.prototype[prop];
        }
      }
    }

    list = super(tracks, list);
    return list;
  }

  addTrack(track) {
    super.addTrack(track);
    track.addEventListener('modechange', Fn.bind(this, function() {
      this.trigger('change');
    }));
  }
}
export default TextTrackList;
