/**
 * @file video-track-list.js
 */
import TrackList from './track-list';
import * as browser from '../utils/browser.js';
import document from 'global/document';

/**
 * disable other video tracks before selecting the new one
 *
 * @param {Array|VideoTrackList} list list to work on
 * @param {VideoTrack} track the track to skip
 */
const disableOthers = function(list, track) {
  for (let i = 0; i < list.length; i++) {
    if (track.id === list[i].id) {
      continue;
    }
    // another audio track is enabled, disable it
    list[i].selected = false;
  }
};

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

  constructor(tracks = []) {
    let list;

    // make sure only 1 track is enabled
    // sorted from last index to first index
    for (let i = tracks.length - 1; i >= 0; i--) {
      if (tracks[i].selected) {
        disableOthers(tracks, tracks[i]);
        break;
      }
    }

    // IE8 forces us to implement inheritance ourselves
    // as it does not support Object.defineProperty properly
    if (browser.IS_IE8) {
      list = document.createElement('custom');
      for (let prop in TrackList.prototype) {
        if (prop !== 'constructor') {
          list[prop] = TrackList.prototype[prop];
        }
      }
      for (let prop in VideoTrackList.prototype) {
        if (prop !== 'constructor') {
          list[prop] = VideoTrackList.prototype[prop];
        }
      }
    }

    list = super(tracks, list);
    list.changing_ = false;

    Object.defineProperty(list, 'selectedIndex', {
      get() {
        for (let i = 0; i < this.length; i++) {
          if (this[i].selected) {
            return i;
          }
        }
        return -1;
      },
      set() {}
    });

    return list;
  }

  addTrack_(track) {
    if (track.selected) {
      disableOthers(this, track);
    }

    super.addTrack_(track);
    // native tracks don't have this
    if (!track.addEventListener) {
      return;
    }
    track.addEventListener('selectedchange', () => {
      if (this.changing_) {
        return;
      }
      this.changing_ = true;
      disableOthers(this, track);
      this.changing_ = false;
      this.trigger('change');
    });
  }

  addTrack(track) {
    this.addTrack_(track);
  }

  removeTrack(track) {
    super.removeTrack_(track);
  }

}

export default VideoTrackList;
