/**
 * @file text-track-cue-list.js
 */
import * as browser from '../utils/browser.js';
import document from 'global/document';

/**
 * A List of text track cues as defined in:
 * https://html.spec.whatwg.org/multipage/embedded-content.html#texttrackcuelist
 *
 * interface TextTrackCueList {
 *   readonly attribute unsigned long length;
 *   getter TextTrackCue (unsigned long index);
 *   TextTrackCue? getCueById(DOMString id);
 * };
 *
 * @param {Array} cues A list of cues to be initialized with
 * @class TextTrackCueList
 */

class TextTrackCueList {
  constructor(cues) {
    let list = this;

    if (browser.IS_IE8) {
      list = document.createElement('custom');

      for (let prop in TextTrackCueList.prototype) {
        if (prop !== 'constructor') {
          list[prop] = TextTrackCueList.prototype[prop];
        }
      }
    }

    TextTrackCueList.prototype.setCues_.call(list, cues);

    Object.defineProperty(list, 'length', {
      get() {
        return this.length_;
      }
    });

    if (browser.IS_IE8) {
      return list;
    }
  }

  /**
   * A setter for cues in this list
   *
   * @param {Array} cues an array of cues
   * @method setCues_
   * @private
   */
  setCues_(cues) {
    let oldLength = this.length || 0;
    let i = 0;
    let l = cues.length;

    this.cues_ = cues;
    this.length_ = cues.length;

    let defineProp = function(index) {
      if (!('' + index in this)) {
        Object.defineProperty(this, '' + index, {
          get() {
            return this.cues_[index];
          }
        });
      }
    };

    if (oldLength < l) {
      i = oldLength;

      for (; i < l; i++) {
        defineProp.call(this, i);
      }
    }
  }

  /**
   * Get a cue that is currently in the Cue list by id
   *
   * @param {String} id
   * @method getCueById
   * @return {Object} a single cue
   */
  getCueById(id) {
    let result = null;

    for (let i = 0, l = this.length; i < l; i++) {
      let cue = this[i];

      if (cue.id === id) {
        result = cue;
        break;
      }
    }

    return result;
  }
}

export default TextTrackCueList;
