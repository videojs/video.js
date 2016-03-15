/**
 * @file video-track-list.js
 */
import TrackList from './track-list';

/**
* A list of possiblee video tracks. Most functionality is in the
 * base class Tracklist and the spec for VideoTrackList is located at:
 * @link https://html.spec.whatwg.org/multipage/embedded-content.html#videotracklist
 *
 * interface VideoTrackList : EventTarget {
 *   readonly attribute unsigned long length;
 *   getter VideoTrack (unsigned long index);
 *   VideoTrack? getTrackById(DOMString id);
 *   readonly attribute long selectedIndex;
 *
 *   attribute EventHandler onchange;
 *   attribute EventHandler onaddtrack;
 *   attribute EventHandler onremovetrack;
 * };
 *
 * @param {VideoTrack[]} tracks a list of video tracks to instantiate the list with
 # @extends TrackList
 * @class VideoTrackList
 */
class VideoTrackList extends TrackList {
  constructor(tracks) {
    let videoTrackList = super(tracks);
    Object.defineProperty(videoTrackList, 'selectedIndex', {
      get() {
        for (let i = 0; i < this.length; i++) {
          if (this[i].selected()) {
            return i;
          }
        }
        return -1;
      },
      set() {},
    });
    return videoTrackList;
  }

  addTrack_(track) {
    super.addTrack_(track);
    track.addEventListener('selectedchange', () => {
      this.trigger('change');
    });
  }

  addTrack(track) {
    this.addTrack_(track);
  }
}

export default VideoTrackList;
