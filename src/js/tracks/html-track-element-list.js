/**
 * @file html-track-element.js
 */

import * as browser from '../utils/browser.js';

class HtmlTrackElementList {
  constructor(trackElements = []) {
    this.trackElements_ = [];

    Object.defineProperty(this, 'length', {
      get() {
        return this.trackElements_.length;
      }
    });

    for (let i = 0, length = trackElements.length; i < length; i++) {
      this.addTrackElement_(trackElements[i]);
    }

    if (browser.IS_IE8) {
      return this;
    }
  }

  addTrackElement_(trackElement) {
    this.trackElements_.push(trackElement);
  }

  getTrackElementByTrack_(track) {
    let trackElement_;

    for (let i = 0, length = this.trackElements_.length; i < length; i++) {
      if (track !== this.trackElements_[i].track) {
        continue;
      }

      trackElement_ = this.trackElements_[i];

      break;
    }

    return trackElement_;
  }

  removeTrackElement_(trackElement) {
    for (let i = 0, length = this.trackElements_.length; i < length; i++) {
      if (trackElement !== this.trackElements_[i]) {
        continue;
      }

      this.trackElements_.splice(i, 1);

      break;
    }
  }
}

export default HtmlTrackElementList;
