// Fake a media playback tech controller so that player tests
// can run without HTML5 or Flash, of which PhantomJS supports neither.

import Tech from '../../src/js/tech/tech.js';
import * as Lib from '../../src/js/lib.js';
import Component from '../../src/js/component.js';

/**
 * @constructor
 */
class MediaFaker extends Tech {

  constructor(player, options, handleReady){
    super(player, options, handleReady);
    this.triggerReady();
  }

  createEl() {
    var el = super.createEl('div', {
      className: 'vjs-tech'
    });

    if (this.player().poster()) {
      // transfer the poster image to mimic HTML
      el.poster = this.player().poster();
    }

    Lib.insertFirst(el, this.player_.el());

    return el;
  }

  // fake a poster attribute to mimic the video element
  poster() { return this.el().poster; }
  setPoster(val) { this.el().poster = val; }

  currentTime() { return 0; }
  seeking() { return false; }
  src() { return 'movie.mp4'; }
  volume() { return 0; }
  muted() { return false; }
  pause() { return false; }
  paused() { return true; }
  play() { this.player().trigger('play'); }
  supportsFullScreen() { return false; }
  buffered() { return {}; }
  duration() { return {}; }
  networkState() { return 0; }
  readyState() { return 0; }

  // Support everything except for "video/unsupported-format"
  static isSupported() { return true; }
  static canPlaySource(srcObj) { return srcObj.type !== 'video/unsupported-format'; }
}

Component.registerComponent('MediaFaker', MediaFaker);
module.exports = MediaFaker;
