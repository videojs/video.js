/**
 * @file text-track-list.js
 */
import TrackList from './track-list';
import * as Fn from '../utils/fn.js';

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
  addTrack_(track) {
    super.addTrack_(track);
    track.addEventListener('modechange', Fn.bind(this, function() {
      this.trigger('change');
    }));
  }
}
export default TextTrackList;
