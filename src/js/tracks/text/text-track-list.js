/**
 * @file text-track-list.js
 */
import TrackList from '../track-list';
import * as Fn from '../../utils/fn.js';
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
 * @param {TextTrack[]} tracks A list of tracks to initialize the list with
 * @extends EventTarget
 * @class TextTrackList
 */

class TextTrackList extends TrackList {
  constructor() {
    super();
  }

  addTrack_(track) {
    track.addEventListener('modechange', Fn.bind(this, function () {
      this.trigger('change');
    }));
    super.addTrack_(track);
  }
}


export default TextTrackList;
