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

let TextTrackCueList = function(cues, optimized) {
  let list = this;
  this.optimized_ = optimized || false;

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
    get: function() {
      return this.length_;
    }
  });

  if (browser.IS_IE8) {
    return list;
  }
};

TextTrackCueList.prototype.setCues_ = function(cues) {
  let i = 0;
  let l = cues.length;

  this.cues_ = [];
  this.length_ = 0;
  if (this.optimized_) {
    this.quickCues_ = [];
  }

  for(i; i < l; i++){
    this.addCue_(cues[i]);
  }

  this.length_ = this.cues_.length;
};

/**
 * Reset all optimization and rebuild quickCues
 * @private
 */
TextTrackCueList.prototype.optimizeAllCues_ = function() {
  let cues = this.cues_;
  this.quickCues_ = [];

  for (let i = 0; i < cues.length; i++) {
    this.optimizeCue_(cues[i]);
  }
};

/**
 * Optimize lookup time of a cue by separating cues into groups of 100 seconds
 * quickCues_[n] will contains every cues that should be visible
 * between 100*n seconds and 100*(n+1) seconds
 * @param cue to be optimized
 * @private
 */
TextTrackCueList.prototype.optimizeCue_ = function(cue) {
  if(this.optimized_) {
    // Find every quickCue group the cue should be in.
    // Start with appearance time and goes 100 by 100 until disappearance time + 100
    for (let cueTime = cue['startTime']; cueTime < cue['endTime'] + 100; cueTime += 100) {
      // Calculation of current group of time
      let group = cueTime / 100 | 0;
      this.quickCues_[group] = this.quickCues_[group] || [];
      this.quickCues_[group].push(cue);
    }
  }
};

TextTrackCueList.prototype.addCue_ = function(cue) {
  this.cues_.push(cue);
  if(this.optimized_) {
    this.optimizeCue_(cue);
  }

  let defineProp = function(i) {
    if (!(''+i in this)) {
      Object.defineProperty(this, '' + i, {
        get: function() {
          return this.cues_[i];
        }
      });
    }
  };
  defineProp.call(this, this.cues_.length-1);
  this.length_ = this.cues_.length;
};

TextTrackCueList.prototype.removeCue_ = function(removeCue) {
  let removed = false;

  for (let i = 0, l = this.cues_.length; i < l; i++) {
    let cue = this.cues_[i];
    if (cue === removeCue) {
      this.cues_.splice(i, 1);
      removed = true;
      break;
    }
  }

  if (removed) {
    this.length_ = this.cues_.length;
    if(this.optimized_){
      this.optimizeAllCues_();
    }
  }
};

/**
 * Return array of active cues at given time from optimized storage of cues.
 * @param time
 * @returns {Array}
 * @private
 */
TextTrackCueList.prototype.getActiveCuesByTime_ = function(time) {
  let group = time/100|0;
  // Doesn't check for every cues but only the ones appearing around time
  let cues = this.quickCues_[group]||[];
  let active = [];

  for (let i = 0, l = cues.length; i < l; i++) {
    let cue = cues[i];
    // Accept standard cues that are visible at given time
    // Also accept malformed cue with same startTime and endTime
    if (cue['startTime'] <= time && cue['endTime'] >= time) {
      active.push(cue);
    } else if (cue['startTime'] === cue['endTime'] && cue['startTime'] <= time && cue['startTime'] + 0.5 >= time) {
      active.push(cue);
    }
  }

  return active;
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
