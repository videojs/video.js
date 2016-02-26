/**
 * @file audio-track-list.js
 */
import TrackList from './track-list';

/**
 * A list of possiblee audio tracks. All functionality is in the
 * base class Tracklist and the spec for AudioTrackList is located at:
 * @link https://html.spec.whatwg.org/multipage/embedded-content.html#audiotracklist
 *
 * interface AudioTrackList : EventTarget {
 *   readonly attribute unsigned long length;
 *   getter AudioTrack (unsigned long index);
 *   AudioTrack? getTrackById(DOMString id);
 *
 *   attribute EventHandler onchange;
 *   attribute EventHandler onaddtrack;
 *   attribute EventHandler onremovetrack;
 * };
 *
 * @param {AudioTrack[]} tracks a list of audio tracks to instantiate the list with
 # @extends TrackList
 * @class AudioTrackList
 */
class AudioTrackList extends TrackList {
  addTrack_(track) {
    super(track);
    track.addEventListener('enabledchange', () => {
      this.trigger('change');
    });
  }
}

export default AudioTrackList;
