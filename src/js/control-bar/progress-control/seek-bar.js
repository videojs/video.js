import Slider from '../../slider/slider.js';
import Component from '../../component.js';
import LoadProgressBar from './load-progress-bar.js';
import PlayProgressBar from './play-progress-bar.js';
import * as Fn from '../../utils/fn.js';
import formatTime from '../../utils/format-time.js';
import roundFloat from '../../utils/round-float.js';

/**
 * Seek Bar and holder for the progress bars
 *
 * @param {Player|Object} player
 * @param {Object=} options
 * @constructor
 */
class SeekBar extends Slider {

  constructor(player, options){
    super(player, options);
    this.on(player, 'timeupdate', this.updateARIAAttributes);
    player.ready(Fn.bind(this, this.updateARIAAttributes));
  }

  createEl() {
    return super.createEl('div', {
      className: 'vjs-progress-holder',
      'aria-label': 'video progress bar'
    });
  }

  updateARIAAttributes() {
      // Allows for smooth scrubbing, when player can't keep up.
      let time = (this.player_.scrubbing()) ? this.player_.getCache().currentTime : this.player_.currentTime();
      this.el_.setAttribute('aria-valuenow', roundFloat(this.getPercent()*100, 2)); // machine readable value of progress bar (percentage complete)
      this.el_.setAttribute('aria-valuetext', formatTime(time, this.player_.duration())); // human readable value of progress bar (time complete)
  }

  getPercent() {
    let percent = this.player_.currentTime() / this.player_.duration();
    return percent >= 1 ? 1 : percent;
  }

  handleMouseDown(event) {
    super.handleMouseDown(event);

    this.player_.scrubbing(true);

    this.videoWasPlaying = !this.player_.paused();
    this.player_.pause();
  }

  handleMouseMove(event) {
    let newTime = this.calculateDistance(event) * this.player_.duration();

    // Don't let video end while scrubbing.
    if (newTime === this.player_.duration()) { newTime = newTime - 0.1; }

    // Set new time (tell player to seek to new time)
    this.player_.currentTime(newTime);
  }

  handleMouseUp(event) {
    super.handleMouseUp(event);

    this.player_.scrubbing(false);
    if (this.videoWasPlaying) {
      this.player_.play();
    }
  }

  stepForward() {
    this.player_.currentTime(this.player_.currentTime() + 5); // more quickly fast forward for keyboard-only users
  }

  stepBack() {
    this.player_.currentTime(this.player_.currentTime() - 5); // more quickly rewind for keyboard-only users
  }

}

SeekBar.prototype.options_ = {
  children: {
    'loadProgressBar': {},
    'playProgressBar': {}
  },
  'barName': 'playProgressBar'
};

SeekBar.prototype.playerEvent = 'timeupdate';

Component.registerComponent('SeekBar', SeekBar);
export default SeekBar;
