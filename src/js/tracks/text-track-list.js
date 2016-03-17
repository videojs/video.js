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
    // on IE8 this will be a document element
    // for every other browser this will be a normal object
    let list = super(tracks);

    if (browser.IS_IE8) {
      for (let prop in TextTrackList.prototype) {
        if (prop !== 'constructor') {
          list[prop] = TextTrackList.prototype[prop];
        }
      }
    }
    return list;
  }

  addTrack_(track) {
    super.addTrack_(track);
    track.addEventListener('modechange', Fn.bind(this, function() {
      this.trigger('change');
    }));
  }
}
export default TextTrackList;
