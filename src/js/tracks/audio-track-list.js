/**
 * @file audio-track-list.js
 */
import TrackList from './track-list';
import * as browser from '../utils/browser.js';
import document from 'global/document';

/**
 * anywhere we call this function we diverge from the spec
 * as we only support one enabled audiotrack at a time
 *
 * @param {Array|AudioTrackList} list list to work on
 * @param {AudioTrack} track the track to skip
 */
const disableOthers = function(list, track) {
  for (let i = 0; i < list.length; i++) {
    if (track.id === list[i].id) {
      continue;
    }
    // another audio track is enabled, disable it
    list[i].enabled = false;
  }
};
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
 * @extends TrackList
 * @class AudioTrackList
 */
class AudioTrackList extends TrackList {
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
      for (let prop in TrackList.prototype) {
        if (prop !== 'constructor') {
          list[prop] = TrackList.prototype[prop];
        }
      }
      for (let prop in AudioTrackList.prototype) {
        if (prop !== 'constructor') {
          list[prop] = AudioTrackList.prototype[prop];
        }
      }
    }

    list = super(tracks, list);
    list.changing_ = false;

    return list;
  }

  addTrack_(track) {
    if (track.enabled) {
      disableOthers(this, track);
    }

    super.addTrack_(track);
    // native tracks don't have this
    if (!track.addEventListener) {
      return;
    }

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

  addTrack(track) {
    this.addTrack_(track);
  }

  removeTrack(track) {
    super.removeTrack_(track);
  }

}

export default AudioTrackList;
