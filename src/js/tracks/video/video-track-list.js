/**
 * @file video-track-list.js
 */
import TrackList from '../track-list';
import * as Fn from '../../utils/fn.js';
/**
 * A video track list as defined in:
 * https://html.spec.whatwg.org/multipage/embedded-content.html#videotracklist
 *
 * interface VideoTrackList : EventTarget {
 *   readonly attribute unsigned long length;
 *   getter VideoTrack (unsigned long index);
 *   VideoTrack? getTrackById(DOMString id);
 *
 *   attribute EventHandler onchange;
 *   attribute EventHandler onaddtrack;
 *   attribute EventHandler onremovetrack;
 * };
 *
 * @param {VideoTrack[]} tracks A list of tracks to initialize the list with
 * @extends EventTarget
 * @class VideoTrackList
 */

class VideoTrackList extends TrackList {
  constructor(tracks = []) {
    super(tracks);
  }

  /**
   * Add Track from VideoTrackList
   *
   * @param {VideoTrack} track
   * @method addTrack_
   * @private
   */
  addTrack_(track) {

    this.trigger('change');

    super.addTrack_(track);
  }

  /**
   * Get the index of the current VideoTrack object
   *
   * @method selectedIndex
   * @return {id}
   * @private
   */
  selectedIndex() {
    let result = null;

    for (let i = 0, l = this.length; i < l; i++) {
      let track = this[i];

      if (track.selected) {
        result = track;
        break;
      }
    }

    return result;
  }
}

export default VideoTrackList;
