/**
 * @file audio-track-list.js
 */
import TrackList from './track-list';
import * as browser from '../utils/browser.js';
import document from 'global/document';

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
    let list;

    // make sure only 1 track is enabled
    // sorted from last index to first index
    for (let i = tracks.length - 1; i >= 0; i--) {
      if (tracks[i].enabled) {
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
      for (const prop in AudioTrackList.prototype) {
        if (prop !== 'constructor') {
          list[prop] = AudioTrackList.prototype[prop];
        }
      }
    }

    list = super(tracks, list);
    list.changing_ = false;

    return list;
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

    /**
     * @listens AudioTrack#enabledchange
     * @fires TrackList#change
     */
    track.addEventListener('enabledchange', () => {
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
    });
  }
}

export default AudioTrackList;
