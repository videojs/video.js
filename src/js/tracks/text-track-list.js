/**
 * @file text-track-list.js
 */
import TrackList from './track-list';
import * as Fn from '../utils/fn.js';
import * as browser from '../utils/browser.js';
import document from 'global/document';

/**
 * The current list of {@link TextTrack} for a media file.
 *
 * @see [Spec]{@link https://html.spec.whatwg.org/multipage/embedded-content.html#texttracklist}
 * @extends TrackList
 */
class TextTrackList extends TrackList {

  /**
   * Create an instance of this class.
   *
   * @param {TextTrack[]} [tracks=[]]
   *        A list of `TextTrack` to instantiate the list with.
   */
  constructor(tracks = []) {
    let list;

    // IE8 forces us to implement inheritance ourselves
    // as it does not support Object.defineProperty properly
    if (browser.IS_IE8) {
      list = document.createElement('custom');
      for (const prop in TrackList.prototype) {
        if (prop !== 'constructor') {
          list[prop] = TrackList.prototype[prop];
        }
      }
      for (const prop in TextTrackList.prototype) {
        if (prop !== 'constructor') {
          list[prop] = TextTrackList.prototype[prop];
        }
      }
    }

    list = super(tracks, list);
    return list;
  }

  /**
   * Add a {@link TextTrack} to the `TextTrackList`
   *
   * @param {TextTrack} track
   *        The text track to add to the list.
   *
   * @fires TrackList#addtrack
   * @private
   */
  addTrack_(track) {
    super.addTrack_(track);

    /**
     * @listens TextTrack#modechange
     * @fires TrackList#change
     */
    track.addEventListener('modechange', Fn.bind(this, function() {
      this.trigger('change');
    }));
  }
}
export default TextTrackList;
