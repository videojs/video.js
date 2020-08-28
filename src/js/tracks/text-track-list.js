/**
 * @file text-track-list.js
 */
import TrackList from './track-list';

/**
 * The current list of {@link TextTrack} for a media file.
 *
 * @see [Spec]{@link https://html.spec.whatwg.org/multipage/embedded-content.html#texttracklist}
 * @extends TrackList
 */
class TextTrackList extends TrackList {

  /**
   * Add a {@link TextTrack} to the `TextTrackList`
   *
   * @param {TextTrack} track
   *        The text track to add to the list.
   *
   * @fires TrackList#addtrack
   */
  addTrack(track) {
    super.addTrack(track);

    if (!this.queueChange_) {
      this.queueChange_ = () => this.queueTrigger('change');
    }
    if (!this.triggerSelectedlanguagechange) {
      this.triggerSelectedlanguagechange_ = () => this.trigger('selectedlanguagechange');
    }

    /**
     * @listens TextTrack#modechange
     * @fires TrackList#change
     */
    track.addEventListener('modechange', this.queueChange_);
    const nonLanguageTextTrackKind = ['metadata', 'chapters'];

    if (nonLanguageTextTrackKind.indexOf(track.kind) === -1) {
      track.addEventListener('modechange', this.triggerSelectedlanguagechange_);
    }
  }

  removeTrack(rtrack) {
    super.removeTrack(rtrack);

    // manually remove the event handlers we added
    if (rtrack.removeEventListener) {
      if (this.queueChange_) {
        rtrack.removeEventListener('modechange', this.queueChange_);
      }
      if (this.selectedlanguagechange_) {
        rtrack.removeEventListener('modechange', this.triggerSelectedlanguagechange_);
      }
    }
  }
}
export default TextTrackList;
