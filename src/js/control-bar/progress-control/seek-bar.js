/**
 * @file seek-bar.js
 */
import window from 'global/window';
import Slider from '../../slider/slider.js';
import Component from '../../component.js';
import LoadProgressBar from './load-progress-bar.js';
import PlayProgressBar from './play-progress-bar.js';
import TooltipProgressBar from './tooltip-progress-bar.js';
import * as Fn from '../../utils/fn.js';
import formatTime from '../../utils/format-time.js';
import assign from 'object.assign';

/**
 * Seek Bar and holder for the progress bars
 *
 * @param {Player|Object} player
 * @param {Object=} options
 * @extends Slider
 * @class SeekBar
 */
class SeekBar extends Slider {

  constructor(player, options){
    super(player, options);
    this.on(player, 'timeupdate', this.updateProgress);
    this.on(player, 'ended', this.updateProgress);
    player.ready(Fn.bind(this, this.updateProgress));

    if (options.playerOptions &&
        options.playerOptions.controlBar &&
        options.playerOptions.controlBar.progressControl &&
        options.playerOptions.controlBar.progressControl.keepTooltipsInside) {
      this.keepTooltipsInside = options.playerOptions.controlBar.progressControl.keepTooltipsInside;
    }

    if (this.keepTooltipsInside) {
      this.tooltipProgressBar = this.addChild('TooltipProgressBar');
    }
  }

  /**
   * Create the component's DOM element
   *
   * @return {Element}
   * @method createEl
   */
  createEl() {
    return super.createEl('div', {
      className: 'vjs-progress-holder'
    }, {
      'aria-label': 'progress bar'
    });
  }

  /**
   * Update ARIA accessibility attributes
   *
   * @method updateARIAAttributes
   */
  updateProgress() {
    this.updateAriaAttributes(this.el_);

    if (this.keepTooltipsInside) {
      this.updateAriaAttributes(this.tooltipProgressBar.el_);
      this.tooltipProgressBar.el_.style.width = this.bar.el_.style.width;

      let playerWidth = parseFloat(window.getComputedStyle(this.player().el()).width);
      let tooltipWidth = parseFloat(window.getComputedStyle(this.tooltipProgressBar.tooltip).width);
      let tooltipStyle = this.tooltipProgressBar.el().style;
      tooltipStyle.maxWidth = Math.floor(playerWidth - (tooltipWidth / 2)) + 'px';
      tooltipStyle.minWidth = Math.ceil(tooltipWidth / 2) + 'px';
      tooltipStyle.right = `-${tooltipWidth / 2}px`;
    }
  }

  updateAriaAttributes(el) {
    // Allows for smooth scrubbing, when player can't keep up.
    let time = (this.player_.scrubbing()) ? this.player_.getCache().currentTime : this.player_.currentTime();
    el.setAttribute('aria-valuenow', (this.getPercent() * 100).toFixed(2)); // machine readable value of progress bar (percentage complete)
    el.setAttribute('aria-valuetext', formatTime(time, this.player_.duration())); // human readable value of progress bar (time complete)
  }

  /**
   * Get percentage of video played
   *
   * @return {Number} Percentage played
   * @method getPercent
   */
  getPercent() {
    let percent = this.player_.currentTime() / this.player_.duration();
    return percent >= 1 ? 1 : percent;
  }

  /**
   * Handle mouse down on seek bar
   *
   * @method handleMouseDown
   */
  handleMouseDown(event) {
    super.handleMouseDown(event);

    this.player_.scrubbing(true);

    this.videoWasPlaying = !this.player_.paused();
    this.player_.pause();
  }

  /**
   * Handle mouse move on seek bar
   *
   * @method handleMouseMove
   */
  handleMouseMove(event) {
    let newTime = this.calculateDistance(event) * this.player_.duration();

    // Don't let video end while scrubbing.
    if (newTime === this.player_.duration()) { newTime = newTime - 0.1; }

    // Set new time (tell player to seek to new time)
    this.player_.currentTime(newTime);
  }

  /**
   * Handle mouse up on seek bar
   *
   * @method handleMouseUp
   */
  handleMouseUp(event) {
    super.handleMouseUp(event);

    this.player_.scrubbing(false);
    if (this.videoWasPlaying) {
      this.player_.play();
    }
  }

  /**
   * Move more quickly fast forward for keyboard-only users
   *
   * @method stepForward
   */
  stepForward() {
    this.player_.currentTime(this.player_.currentTime() + 5); // more quickly fast forward for keyboard-only users
  }

  /**
   * Move more quickly rewind for keyboard-only users
   *
   * @method stepBack
   */
  stepBack() {
    this.player_.currentTime(this.player_.currentTime() - 5); // more quickly rewind for keyboard-only users
  }

}

SeekBar.prototype.options_ = {
  children: [
    'loadProgressBar',
    'mouseTimeDisplay',
    'playProgressBar'
  ],
  'barName': 'playProgressBar'
};

SeekBar.prototype.playerEvent = 'timeupdate';

Component.registerComponent('SeekBar', SeekBar);
export default SeekBar;
