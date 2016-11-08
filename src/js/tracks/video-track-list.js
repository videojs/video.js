/**
 * @file video-track-list.js
 */
import TrackList from './track-list';
import * as browser from '../utils/browser.js';
import document from 'global/document';

/**
 * Un-select all other {@link VideoTrack}s that are selected.
 *
 * @param {VideoTrackList} list
 *        list to work on
 *
 * @param {VideoTrack} track
 *        The track to skip
 *
 * @private
 */
const disableOthers = function(list, track) {
  for (let i = 0; i < list.length; i++) {
    if (track.id === list[i].id) {
      continue;
    }
    // another video track is enabled, disable it
    list[i].selected = false;
  }
};

/**
 * The current list of {@link VideoTrack} for a video.
 *
 * @see [Spec]{@link https://html.spec.whatwg.org/multipage/embedded-content.html#videotracklist}
 * @extends TrackList
 */
class VideoTrackList extends TrackList {

  /**
   * Create an instance of this class.
   *
   * @param {VideoTrack[]} [tracks=[]]
   *        A list of `VideoTrack` to instantiate the list with.
   */
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
      for (const prop in TrackList.prototype) {
        if (prop !== 'constructor') {
          list[prop] = TrackList.prototype[prop];
        }
      }
      for (const prop in VideoTrackList.prototype) {
        if (prop !== 'constructor') {
          list[prop] = VideoTrackList.prototype[prop];
        }
      }
    }

    list = super(tracks, list);
    list.changing_ = false;

    /**
     * @member {number} VideoTrackList#selectedIndex
     *         The current index of the selected {@link VideoTrack`}.
     */
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

  /**
   * Add a {@link VideoTrack} to the `VideoTrackList`.
   *
   * @param {VideoTrack} track
   *        The VideoTrack to add to the list
   *
   * @fires TrackList#addtrack
   * @private
   */
  addTrack_(track) {
    if (track.selected) {
      disableOthers(this, track);
    }

    super.addTrack_(track);
    // native tracks don't have this
    if (!track.addEventListener) {
      return;
    }

    /**
     * @listens VideoTrack#selectedchange
     * @fires TrackList#change
     */
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

  /**
   * Add a {@link VideoTrack} to the `VideoTrackList`.
   *
   * @param {VideoTrack} track
   *        The VideoTrack to add to the list
   *
   * @fires TrackList#addtrack
   */
  addTrack(track) {
    this.addTrack_(track);
  }

  /**
   * Remove a {@link VideoTrack} to the `VideoTrackList`.
   *
   * @param {VideoTrack} track
   *        The VideoTrack to remove from the list.
   *
   * @fires TrackList#removetrack
   */
  removeTrack(track) {
    super.removeTrack_(track);
  }

}

export default VideoTrackList;
