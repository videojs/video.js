/**
 * @file text-track-list.js
 */
import EventTarget from '../event-target';
import * as Fn from '../utils/fn.js';
import * as browser from '../utils/browser.js';
import document from 'global/document';

/*
 * https://html.spec.whatwg.org/multipage/embedded-content.html#texttracklist
 *
 * interface TextTrackList : EventTarget {
 *   readonly attribute unsigned long length;
 *   getter TextTrack (unsigned long index);
 *   TextTrack? getTrackById(DOMString id);
 *
 *   attribute EventHandler onchange;
 *   attribute EventHandler onaddtrack;
 *   attribute EventHandler onremovetrack;
 * };
 */
let TextTrackList = function(tracks) {
  let list = this;

  if (browser.IS_IE8) {
    list = document.createElement('custom');

    for (let prop in TextTrackList.prototype) {
      list[prop] = TextTrackList.prototype[prop];
    }
  }

  tracks = tracks || [];
  list.tracks_ = [];

  Object.defineProperty(list, 'length', {
    get: function() {
      return this.tracks_.length;
    }
  });

  for (let i = 0; i < tracks.length; i++) {
    list.addTrack_(tracks[i]);
  }

  if (browser.IS_IE8) {
    return list;
  }
};

TextTrackList.prototype = Object.create(EventTarget.prototype);
TextTrackList.prototype.constructor = TextTrackList;

/*
 * change - One or more tracks in the track list have been enabled or disabled.
 * addtrack - A track has been added to the track list.
 * removetrack - A track has been removed from the track list.
 */
TextTrackList.prototype.allowedEvents_ = {
  'change': 'change',
  'addtrack': 'addtrack',
  'removetrack': 'removetrack'
};

// emulate attribute EventHandler support to allow for feature detection
for (let event in TextTrackList.prototype.allowedEvents_) {
  TextTrackList.prototype['on' + event] = null;
}

TextTrackList.prototype.addTrack_ = function(track) {
  let index = this.tracks_.length;
  if (!(''+index in this)) {
    Object.defineProperty(this, index, {
      get: function() {
        return this.tracks_[index];
      }
    });
  }

  track.addEventListener('modechange', Fn.bind(this, function() {
    this.trigger('change');
  }));
  this.tracks_.push(track);

  this.trigger({
    type: 'addtrack',
    track: track
  });
};

TextTrackList.prototype.removeTrack_ = function(rtrack) {
  let result = null;
  let track;

  for (let i = 0, l = this.length; i < l; i++) {
    track = this[i];
    if (track === rtrack) {
      this.tracks_.splice(i, 1);
      break;
    }
  }

  this.trigger({
    type: 'removetrack',
    track: track
  });
};

TextTrackList.prototype.getTrackById = function(id) {
  let result = null;

  for (let i = 0, l = this.length; i < l; i++) {
    let track = this[i];
    if (track.id === id) {
      result = track;
      break;
    }
  }

  return result;
};

export default TextTrackList;
