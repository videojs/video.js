/**
 * @file html-track-element-list.js
 */

/**
 * The current list of {@link HtmlTrackElement}s.
 */
class HtmlTrackElementList {

  /**
   * Create an instance of this class.
   *
   * @param {HtmlTrackElement[]} [tracks=[]]
   *        A list of `HtmlTrackElement` to instantiate the list with.
   */
  constructor(trackElements = []) {
    this.trackElements_ = [];

    /**
     * @memberof HtmlTrackElementList
     * @member {number} length
     *         The current number of `Track`s in the this Trackist.
     * @instance
     */
    Object.defineProperty(this, 'length', {
      get() {
        return this.trackElements_.length;
      }
    });

    for (let i = 0, length = trackElements.length; i < length; i++) {
      this.addTrackElement_(trackElements[i]);
    }
  }

  /**
   * Add an {@link HtmlTrackElement} to the `HtmlTrackElementList`
   *
   * @param {HtmlTrackElement} trackElement
   *        The track element to add to the list.
   *
   * @private
   */
  addTrackElement_(trackElement) {
    const index = this.trackElements_.length;

    if (!('' + index in this)) {
      Object.defineProperty(this, index, {
        get() {
          return this.trackElements_[index];
        }
      });
    }

    // Do not add duplicate elements
    if (this.trackElements_.indexOf(trackElement) === -1) {
      this.trackElements_.push(trackElement);
    }
  }

  /**
   * Get an {@link HtmlTrackElement} from the `HtmlTrackElementList` given an
   * {@link TextTrack}.
   *
   * @param {TextTrack} track
   *        The track associated with a track element.
   *
   * @return {HtmlTrackElement|undefined}
   *         The track element that was found or undefined.
   *
   * @private
   */
  getTrackElementByTrack_(track) {
    let trackElement_;

    for (let i = 0, length = this.trackElements_.length; i < length; i++) {
      if (track === this.trackElements_[i].track) {
        trackElement_ = this.trackElements_[i];

        break;
      }
    }

    return trackElement_;
  }

  /**
   * Remove a {@link HtmlTrackElement} from the `HtmlTrackElementList`
   *
   * @param {HtmlTrackElement} trackElement
   *        The track element to remove from the list.
   *
   * @private
   */
  removeTrackElement_(trackElement) {
    for (let i = 0, length = this.trackElements_.length; i < length; i++) {
      if (trackElement === this.trackElements_[i]) {
        if (this.trackElements_[i].track && typeof this.trackElements_[i].track.off === 'function') {
          this.trackElements_[i].track.off();
        }

        if (typeof this.trackElements_[i].off === 'function') {
          this.trackElements_[i].off();
        }
        this.trackElements_.splice(i, 1);
        break;
      }
    }
  }
}

export default HtmlTrackElementList;
