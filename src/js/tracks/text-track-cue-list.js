/*
 * https://html.spec.whatwg.org/multipage/embedded-content.html#texttrackcuelist
 *
 * interface TextTrackCueList {
 *   readonly attribute unsigned long length;
 *   getter TextTrackCue (unsigned long index);
 *   TextTrackCue? getCueById(DOMString id);
 * };
 */

vjs.TextTrackCueList = function(cues) {
  var list = this,
      prop;

  if (vjs.IS_IE8) {
    list = document.createElement('custom');

    for (prop in vjs.TextTrackCueList.prototype) {
      list[prop] = vjs.TextTrackCueList.prototype[prop];
    }
  }

  vjs.TextTrackCueList.prototype.setCues_.call(list, cues);

  Object.defineProperty(list, 'length', {
    get: function() {
      return this.length_;
    }
  });

  if (vjs.IS_IE8) {
    return list;
  }
};

vjs.TextTrackCueList.prototype.setCues_ = function(cues) {
  var oldLength = this.length || 0,
      i = 0,
      l = cues.length,
      defineProp;

  this.cues_ = cues;
  this.length_ = cues.length;

  defineProp = function(i) {
    if (!(''+i in this)) {
      Object.defineProperty(this, '' + i, {
        get: function() {
          return this.cues_[i];
        }
      });
    }
  };

  if (oldLength < l) {
    i = oldLength;
    for(; i < l; i++) {
      defineProp.call(this, i);
    }
  }
};

vjs.TextTrackCueList.prototype.getCueById = function(id) {
  var i = 0,
      l = this.length,
      result = null,
      cue;

  for (; i < l; i++) {
    cue = this[i];
    if (cue.id === id) {
      result = cue;
      break;
    }
  }

  return result;
};
