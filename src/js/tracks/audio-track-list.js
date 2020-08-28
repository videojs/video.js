/**
 * @file audio-track-list.js
 */
import TrackList from './track-list';

/**
 * Anywhere we call this function we diverge from the spec
 * as we only support one enabled audiotrack at a time
 *
 * @param {AudioTrackList} list
 *        list to work on
 *
 * @param {AudioTrack} track
 *        The track to skip
 *
 * @private
 */
const disableOthers = function(list, track) {
  for (let i = 0; i < list.length; i++) {
    if (!Object.keys(list[i]).length || track.id === list[i].id) {
      continue;
    }
    // another audio track is enabled, disable it
    list[i].enabled = false;
  }
};

/**
 * The current list of {@link AudioTrack} for a media file.
 *
 * @see [Spec]{@link https://html.spec.whatwg.org/multipage/embedded-content.html#audiotracklist}
 * @extends TrackList
 */
class AudioTrackList extends TrackList {

  /**
   * Create an instance of this class.
   *
   * @param {AudioTrack[]} [tracks=[]]
   *        A list of `AudioTrack` to instantiate the list with.
   */
  constructor(tracks = []) {
    // make sure only 1 track is enabled
    // sorted from last index to first index
    for (let i = tracks.length - 1; i >= 0; i--) {
      if (tracks[i].enabled) {
        disableOthers(tracks, tracks[i]);
        break;
      }
    }

    super(tracks);
    this.changing_ = false;
  }

  /**
   * Add an {@link AudioTrack} to the `AudioTrackList`.
   *
   * @param {AudioTrack} track
   *        The AudioTrack to add to the list
   *
   * @fires TrackList#addtrack
   */
  addTrack(track) {
    if (track.enabled) {
      disableOthers(this, track);
    }

    super.addTrack(track);
    // native tracks don't have this
    if (!track.addEventListener) {
      return;
    }

    track.enabledChange_ = () => {
      // when we are disabling other tracks (since we don't support
      // more than one track at a time) we will set changing_
      // to true so that we don't trigger additional change events
      if (this.changing_) {
        return;
      }
      this.changing_ = true;
      disableOthers(this, track);
      this.changing_ = false;
      this.trigger('change');
    };

    /**
     * @listens AudioTrack#enabledchange
     * @fires TrackList#change
     */
    track.addEventListener('enabledchange', track.enabledChange_);
  }

  removeTrack(rtrack) {
    super.removeTrack(rtrack);

    if (rtrack.removeEventListener && rtrack.enabledChange_) {
      rtrack.removeEventListener('enabledchange', rtrack.enabledChange_);
      rtrack.enabledChange_ = null;
    }
  }
}

export default AudioTrackList;
