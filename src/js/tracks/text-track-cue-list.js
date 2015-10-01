/**
 * @file text-track-cue-list.js
 */
import * as browser from '../utils/browser.js';
import document from 'global/document';

/*
 * https://html.spec.whatwg.org/multipage/embedded-content.html#texttrackcuelist
 *
 * interface TextTrackCueList {
 *   readonly attribute unsigned long length;
 *   getter TextTrackCue (unsigned long index);
 *   TextTrackCue? getCueById(DOMString id);
 * };
 */

let TextTrackCueList = function(cues) {
  let list = this;

  if (browser.IS_IE8) {
    list = document.createElement('custom');

    for (let prop in TextTrackCueList.prototype) {
      list[prop] = TextTrackCueList.prototype[prop];
    }
  }

  TextTrackCueList.prototype.setCues_.call(list, cues);

  Object.defineProperty(list, 'length', {
    get: function() {
      return this.length_;
    }
  });

  if (browser.IS_IE8) {
    return list;
  }
};

TextTrackCueList.prototype.setCues_ = function(cues) {
  let oldLength = this.length || 0;
  let i = 0;
  let l = cues.length;

  this.cues_ = cues;
  this.length_ = cues.length;

  let defineProp = function(i) {
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

TextTrackCueList.prototype.getCueById = function(id) {
  let result = null;
  for (let i = 0, l = this.length; i < l; i++) {
    let cue = this[i];
    if (cue.id === id) {
      result = cue;
      break;
    }
  }

  return result;
};

export default TextTrackCueList;
