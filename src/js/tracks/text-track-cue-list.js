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

TextTrackCueList.prototype.optimizeAllCues_ = function() {
  let cues = this.cues_;
  this.quickCues_ = [];

  for (let i = 0; i < cues.length; i++) {
    this.optimizeCue_(cues[i]);
  }
};

TextTrackCueList.prototype.optimizeCue_ = function(cue){
  if(this.optimized_){
    for (let j = cue['startTime']; j < cue['endTime'] + 100; j += 100) {
      this.quickCues_[j / 100 | 0] = this.quickCues_[j / 100 | 0] || [];
      this.quickCues_[j / 100 | 0].push(cue);
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
    }
  }

  if (removed) {
    this.length_ = this.cues_.length;
    if(this.optimized_){
      this.optimizeAllCues_();
    }
  }
};

TextTrackCueList.prototype.getActiveCuesByTime = function(time) {
  let cues = this.quickCues_[time/100|0]||[];
  let active = [];

  for (let i = 0, l = cues.length; i < l; i++) {
    let cue = cues[i];
    if (cue['startTime'] <= time && cue['endTime'] >= time) {
      active.push(cue);
    } else if (cue['startTime'] === cue['endTime'] && cue['startTime'] <= time && cue['startTime'] + 0.5 >= time) {
      active.push(cue);
    }

    if (cue['startTime'] > time){
      break;
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
