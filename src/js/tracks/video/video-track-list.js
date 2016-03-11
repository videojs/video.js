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
    let list = this;

    Object.defineProperty(list, 'selectedIndex', {
      get() {
        let result = null;

        for (let i = 0, l = this.tracks_.length; i < l; i++) {
          let track = this.tracks_[i];

          if (track.selected) {
            result = i;
            break;
          }
        }

        return result;
      }
    });
  }

  /**
   * Add Track from VideoTrackList
   *
   * @param {VideoTrack} track
   * @method addTrack_
   * @private
   */
  addTrack_(track) {

    if (track.addEventListener) {
      track.addEventListener('selectedchange', Fn.bind(this, function () {
        this.trigger('change');
      }));
    }

    super.addTrack_(track);
  }
}

export default VideoTrackList;
