/**
 * @file audio-track-list.js
 */
import TrackList from './track-list';
import * as browser from '../utils/browser.js';

/**
 * A list of possible audio tracks. All functionality is in the
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
  constructor(tracks = []) {
    let list = super(tracks);

    if (browser.IS_IE8) {
      for (let prop in AudioTrackList.prototype) {
        if (prop !== 'constructor') {
          list[prop] = AudioTrackList.prototype[prop];
        }
      }
    }

    return list;
  }


  addTrack_(track) {
    super.addTrack_(track);
    // native tracks don't have this
    if(track.addEventListener) {
      track.addEventListener('enabledchange', () => {
        this.trigger('change');
      });
    }
  }

  addTrack(track) {
    this.addTrack_(track);
  }

  removeTrack(track) {
    super.removeTrack_(track);
  }

}

export default AudioTrackList;
