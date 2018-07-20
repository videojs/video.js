/**
 * @file text-track-list.js
 */
import TrackList from './track-list';
import * as Fn from '../utils/fn.js';

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

    /**
     * @listens TextTrack#modechange
     * @fires TrackList#change
     */
    track.addEventListener('modechange', Fn.bind(this, function() {
      this.queueTrigger('change');
    }));

    const nonLanguageTextTrackKind = ['metadata', 'chapters'];

    if (nonLanguageTextTrackKind.indexOf(track.kind) === -1) {
      track.addEventListener('modechange', Fn.bind(this, function() {
        this.trigger('selectedlanguagechange');
      }));
    }
  }
}
export default TextTrackList;
