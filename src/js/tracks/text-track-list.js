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
vjs.TextTrackList = function(tracks) {
  var list = this,
      i = 0;

  if (vjs.IS_IE8) {
    list = document.createElement('custom');
  }

  this.tracks_ = [];

  Object.defineProperty(list, 'length', {
    get: function() {
      return this.tracks_.length;
    }
  });

  for (; i < tracks.length; i++) {
    this.addTrack_(tracks[i]);
  }

  if (vjs.IS_IE8) {
    return list;
  }
};

vjs.TextTrackList.prototype = vjs.obj.create(vjs.EventEmitter.prototype);
vjs.TextTrackList.prototype.constructor = vjs.TextTrackList;

vjs.TextTrackList.prototype.allowedEvents_ = {
  'change': 'change',
  'addtrack': 'addtrack',
  'removetrack': 'removetrack'
};

vjs.TextTrackList.prototype.addTrack_ = function(track) {
  var index = this.tracks_.length;
  if (!(''+index in this)) {
    Object.defineProperty(this, index, {
      get: function() {
        return this.tracks_[index];
      }
    });
  }

  this.tracks_.push(track);

  this.trigger('addtrack');
};

vjs.TextTrackList.prototype.removeTrack_ = function(rtrack) {
  var i = 0,
      l = this.length,
      result = null,
      track;

  for (; i < l; i++) {
    track = this[i];
    if (track === rtrack) {
      this.tracks_.splice(i, 1);
      break;
    }
  }

  this.trigger('removetrack');
};

vjs.TextTrackList.prototype.getTrackById = function(id) {
  var i = 0,
      l = this.length,
      result = null,
      track;

  for (; i < l; i++) {
    track = this[i];
    if (track.id === id) {
      result = track;
      break;
    }
  }

  return result;
};
