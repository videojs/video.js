// Fake a media playback tech controller so that player tests
// can run without HTML5 which PhantomJS does not support.
import Tech from '../../../src/js/tech/tech.js';
import {createTimeRanges} from '../../../src/js/utils/time-ranges.js';
/**
 * @class
 */
class TechFaker extends Tech {

  constructor(options, handleReady) {
    super(options, handleReady);

    this.featuresPlaybackRate = true;
    this.defaultPlaybackRate_ = 1;
    this.playbackRate_ = 1;
    this.currentTime_ = 0;

    if (this.options_ && this.options_.sourceset) {
      this.fakeSourceset();
    }
    if (!options || options.autoReady !== false) {
      this.triggerReady();
    }
  }

  createEl() {
    const el = super.createEl('div', {
      className: 'vjs-tech'
    });

    return el;
  }

  // fake a poster attribute to mimic the video element
  poster() {
    return this.el().poster;
  }
  setPoster(val) {
    this.el().poster = val;
    this.trigger('posterchange');
  }

  setControls(val) {}

  setVolume(value) {
    this.volume_ = value;
  }

  setMuted() {}

  setAutoplay(v) {
    if (!v) {
      this.options_.autoplay = false;
    }

    this.options_.autoplay = true;
  }

  defaultPlaybackRate(value) {
    if (value !== undefined) {
      this.defaultPlaybackRate_ = parseFloat(value);
    }
    return this.defaultPlaybackRate_;
  }

  setPlaybackRate(value) {
    const last = this.playbackRate_;

    this.playbackRate_ = parseFloat(value);

    if (value !== last) {
      this.trigger('ratechange');
    }
  }

  playbackRate() {
    return this.playbackRate_;
  }

  setCurrentTime(value) {
    const last = this.currentTime_;

    this.currentTime_ = parseFloat(value);

    if (value !== last) {
      this.trigger('timeupdate');
    }
  }

  currentTime() {
    return this.currentTime_;
  }

  seekable() {
    return createTimeRanges(0, 0);
  }
  seeking() {
    return false;
  }
  setScrubbing() {}
  fakeSourceset() {
    this.el_.src = this.options_.sourceset;
    this.el_.setAttribute('src', this.options_.sourceset);
    super.triggerSourceset(this.options_.sourceset);
  }
  src(src) {
    if (typeof src !== 'undefined' && this.options_ && this.options_.sourceset) {
      this.fakeSourceset();
    }
    return 'movie.mp4';
  }
  load() {
  }
  currentSrc() {
    return 'movie.mp4';
  }
  volume() {
    return this.volume_ || 0;
  }
  muted() {
    return false;
  }
  autoplay() {
    return this.options_.autoplay || false;
  }
  pause() {
    return false;
  }
  paused() {
    return true;
  }
  loop() {
    return false;
  }
  play() {
    this.trigger('play');
  }
  supportsFullScreen() {
    return false;
  }
  buffered() {
    return {};
  }
  duration() {
    return {};
  }
  networkState() {
    return 0;
  }
  readyState() {
    return 0;
  }
  controls() {
    return false;
  }
  ended() {
    return false;
  }
  crossOrigin() {
    return null;
  }

  // Support everything except for "video/unsupported-format"
  static isSupported() {
    return true;
  }
  static canPlayType(type) {
    return (type !== 'video/unsupported-format' ? 'maybe' : '');
  }
  static canPlaySource(srcObj) {
    return srcObj.type !== 'video/unsupported-format';
  }
}

Tech.registerTech('TechFaker', TechFaker);
export default TechFaker;
