/**
 * @file track-list.js
 */
import EventTarget from '../event-target';
import {isEvented} from '../mixins/evented';

/**
 * Common functionaliy between {@link TextTrackList}, {@link AudioTrackList}, and
 * {@link VideoTrackList}
 *
 * @extends EventTarget
 */
class TrackList extends EventTarget {
  /**
   * Create an instance of this class
   *
   * @param {Track[]} tracks
   *        A list of tracks to initialize the list with.
   *
   * @abstract
   */
  constructor(tracks = []) {
    super();

    this.tracks_ = [];

    /**
     * @memberof TrackList
     * @member {number} length
     *         The current number of `Track`s in the this Trackist.
     * @instance
     */
    Object.defineProperty(this, 'length', {
      get() {
        return this.tracks_.length;
      }
    });

    for (let i = 0; i < tracks.length; i++) {
      this.addTrack(tracks[i]);
    }
  }

  /**
   * Add a {@link Track} to the `TrackList`
   *
   * @param {Track} track
   *        The audio, video, or text track to add to the list.
   *
   * @fires TrackList#addtrack
   */
  addTrack(track) {
    const index = this.tracks_.length;

    if (!('' + index in this)) {
      Object.defineProperty(this, index, {
        get() {
          return this.tracks_[index];
        }
      });
    }

    // Do not add duplicate tracks
    if (this.tracks_.indexOf(track) === -1) {
      this.tracks_.push(track);
      /**
       * Triggered when a track is added to a track list.
       *
       * @event TrackList#addtrack
       * @type {EventTarget~Event}
       * @property {Track} track
       *           A reference to track that was added.
       */
      this.trigger({
        track,
        type: 'addtrack',
        target: this
      });
    }

    /**
     * Triggered when a track label is changed.
     *
     * @event TrackList#addtrack
     * @type {EventTarget~Event}
     * @property {Track} track
     *           A reference to track that was added.
     */
    track.labelchange_ = () => {
      this.trigger({
        track,
        type: 'labelchange',
        target: this
      });
    };

    if (isEvented(track)) {
      track.addEventListener('labelchange', track.labelchange_);
    }
  }

  /**
   * Remove a {@link Track} from the `TrackList`
   *
   * @param {Track} rtrack
   *        The audio, video, or text track to remove from the list.
   *
   * @fires TrackList#removetrack
   */
  removeTrack(rtrack) {
    let track;

    for (let i = 0, l = this.length; i < l; i++) {
      if (this[i] === rtrack) {
        track = this[i];
        if (track.off) {
          track.off();
        }

        this.tracks_.splice(i, 1);

        break;
      }
    }

    if (!track) {
      return;
    }

    /**
     * Triggered when a track is removed from track list.
     *
     * @event TrackList#removetrack
     * @type {EventTarget~Event}
     * @property {Track} track
     *           A reference to track that was removed.
     */
    this.trigger({
      track,
      type: 'removetrack',
      target: this
    });
  }

  /**
   * Get a Track from the TrackList by a tracks id
   *
   * @param {string} id - the id of the track to get
   * @method getTrackById
   * @return {Track}
   * @private
   */
  getTrackById(id) {
    let result = null;

    for (let i = 0, l = this.length; i < l; i++) {
      const track = this[i];

      if (track.id === id) {
        result = track;
        break;
      }
    }

    return result;
  }
}

/**
 * Triggered when a different track is selected/enabled.
 *
 * @event TrackList#change
 * @type {EventTarget~Event}
 */

/**
 * Events that can be called with on + eventName. See {@link EventHandler}.
 *
 * @property {Object} TrackList#allowedEvents_
 * @private
 */
TrackList.prototype.allowedEvents_ = {
  change: 'change',
  addtrack: 'addtrack',
  removetrack: 'removetrack',
  labelchange: 'labelchange'
};

// emulate attribute EventHandler support to allow for feature detection
for (const event in TrackList.prototype.allowedEvents_) {
  TrackList.prototype['on' + event] = null;
}

export default TrackList;
