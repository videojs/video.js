/**
 * @file video-track-list.js
 */
import TrackList from './track-list';

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
    if (!Object.keys(list[i]).length || track.id === list[i].id) {
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
    // make sure only 1 track is enabled
    // sorted from last index to first index
    for (let i = tracks.length - 1; i >= 0; i--) {
      if (tracks[i].selected) {
        disableOthers(tracks, tracks[i]);
        break;
      }
    }

    super(tracks);
    this.changing_ = false;

    /**
     * @member {number} VideoTrackList#selectedIndex
     *         The current index of the selected {@link VideoTrack`}.
     */
    Object.defineProperty(this, 'selectedIndex', {
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
    if (track.selected) {
      disableOthers(this, track);
    }

    super.addTrack(track);
    // native tracks don't have this
    if (!track.addEventListener) {
      return;
    }

    track.selectedChange_ = () => {
      if (this.changing_) {
        return;
      }
      this.changing_ = true;
      disableOthers(this, track);
      this.changing_ = false;
      this.trigger('change');
    };

    /**
     * @listens VideoTrack#selectedchange
     * @fires TrackList#change
     */
    track.addEventListener('selectedchange', track.selectedChange_);
  }

  removeTrack(rtrack) {
    super.removeTrack(rtrack);

    if (rtrack.removeEventListener && rtrack.selectedChange_) {
      rtrack.removeEventListener('selectedchange', rtrack.selectedChange_);
      rtrack.selectedChange_ = null;
    }
  }
}

export default VideoTrackList;
