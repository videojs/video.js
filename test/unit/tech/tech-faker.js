// Fake a media playback tech controller so that player tests
// can run without HTML5 or Flash, of which PhantomJS supports neither.
import Tech from '../../../src/js/tech/tech.js';

/**
 * @constructor
 */
class TechFaker extends Tech {

  constructor(options, handleReady) {
    super(options, handleReady);
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
  }

  setControls(val) {}

  setVolume(newVolume) {}

  setMuted() {}

  currentTime() {
    return 0;
  }
  seeking() {
    return false;
  }
  src() {
    return 'movie.mp4';
  }
  currentSrc() {
    return 'movie.mp4';
  }
  volume() {
    return 0;
  }
  muted() {
    return false;
  }
  pause() {
    return false;
  }
  paused() {
    return true;
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
