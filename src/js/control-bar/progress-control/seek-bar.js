/**
 * @file seek-bar.js
 */
import Slider from '../../slider/slider.js';
import Component from '../../component.js';
import {IE_VERSION, IS_IOS, IS_ANDROID} from '../../utils/browser.js';
import * as Dom from '../../utils/dom.js';
import * as Fn from '../../utils/fn.js';
import formatTime from '../../utils/format-time.js';
import {silencePromise} from '../../utils/promise';

import './load-progress-bar.js';
import './play-progress-bar.js';
import './mouse-time-display.js';

// The number of seconds the `step*` functions move the timeline.
const STEP_SECONDS = 5;

// The interval at which the bar should update as it progresses.
const UPDATE_REFRESH_INTERVAL = 30;

/**
 * Seek bar and container for the progress bars. Uses {@link PlayProgressBar}
 * as its `bar`.
 *
 * @extends Slider
 */
class SeekBar extends Slider {

  /**
   * Creates an instance of this class.
   *
   * @param {Player} player
   *        The `Player` that this class should be attached to.
   *
   * @param {Object} [options]
   *        The key/value store of player options.
   */
  constructor(player, options) {
    super(player, options);

    this.update = Fn.throttle(Fn.bind(this, this.update), UPDATE_REFRESH_INTERVAL);

    this.on(player, 'timeupdate', this.update);
    this.on(player, 'ended', this.handleEnded);

    // when playing, let's ensure we smoothly update the play progress bar
    // via an interval
    this.updateInterval = null;

    this.on(player, ['playing'], () => {
      this.clearInterval(this.updateInterval);

      this.updateInterval = this.setInterval(() =>{
        this.requestAnimationFrame(() => {
          this.update();
        });
      }, UPDATE_REFRESH_INTERVAL);
    });

    this.on(player, ['ended', 'pause', 'waiting'], () => {
      this.clearInterval(this.updateInterval);
    });

    this.on(player, ['timeupdate', 'ended'], this.update);
  }

  /**
   * Create the `Component`'s DOM element
   *
   * @return {Element}
   *         The element that was created.
   */
  createEl() {
    return super.createEl('div', {
      className: 'vjs-progress-holder'
    }, {
      'aria-label': this.localize('Progress Bar')
    });
  }

  /**
   * This function updates the play progress bar and accessiblity
   * attributes to whatever is passed in.
   *
   * @param {number} currentTime
   *        The currentTime value that should be used for accessiblity
   *
   * @param {number} percent
   *        The percentage as a decimal that the bar should be filled from 0-1.
   *
   * @private
   */
  update_(currentTime, percent) {
    const duration = this.player_.duration();

    // machine readable value of progress bar (percentage complete)
    this.el_.setAttribute('aria-valuenow', (percent * 100).toFixed(2));

    // human readable value of progress bar (time complete)
    this.el_.setAttribute('aria-valuetext',
                          this.localize('progress bar timing: currentTime={1} duration={2}',
                                        [formatTime(currentTime, duration),
                                         formatTime(duration, duration)],
                                        '{1} of {2}'));

    // Update the `PlayProgressBar`.
    this.bar.update(Dom.getBoundingClientRect(this.el_), percent);
  }

  /**
   * Update the seek bar's UI.
   *
   * @param {EventTarget~Event} [event]
   *        The `timeupdate` or `ended` event that caused this to run.
   *
   * @listens Player#timeupdate
   *
   * @returns {number}
   *          The current percent at a number from 0-1
   */
  update(event) {
    const percent = super.update();

    this.update_(this.getCurrentTime_(), percent);
    return percent;
  }

  /**
   * Get the value of current time but allows for smooth scrubbing,
   * when player can't keep up.
   *
   * @return {number}
   *         The current time value to display
   *
   * @private
   */
  getCurrentTime_() {
    return (this.player_.scrubbing()) ?
      this.player_.getCache().currentTime :
      this.player_.currentTime();
  }

  /**
   * We want the seek bar to be full on ended
   * no matter what the actual internal values are. so we force it.
   *
   * @param {EventTarget~Event} [event]
   *        The `timeupdate` or `ended` event that caused this to run.
   *
   * @listens Player#ended
   */
  handleEnded(event) {
    this.update_(this.player_.duration(), 1);
  }

  /**
   * Get the percentage of media played so far.
   *
   * @return {number}
   *         The percentage of media played so far (0 to 1).
   */
  getPercent() {
    const percent = this.getCurrentTime_() / this.player_.duration();

    return percent >= 1 ? 1 : percent;
  }

  /**
   * Handle mouse down on seek bar
   *
   * @param {EventTarget~Event} event
   *        The `mousedown` event that caused this to run.
   *
   * @listens mousedown
   */
  handleMouseDown(event) {
    if (!Dom.isSingleLeftClick(event)) {
      return;
    }

    // Stop event propagation to prevent double fire in progress-control.js
    event.stopPropagation();
    this.player_.scrubbing(true);

    this.videoWasPlaying = !this.player_.paused();
    this.player_.pause();

    super.handleMouseDown(event);
  }

  /**
   * Handle mouse move on seek bar
   *
   * @param {EventTarget~Event} event
   *        The `mousemove` event that caused this to run.
   *
   * @listens mousemove
   */
  handleMouseMove(event) {
    if (!Dom.isSingleLeftClick(event)) {
      return;
    }

    let newTime = this.calculateDistance(event) * this.player_.duration();

    // Don't let video end while scrubbing.
    if (newTime === this.player_.duration()) {
      newTime = newTime - 0.1;
    }

    // Set new time (tell player to seek to new time)
    this.player_.currentTime(newTime);
  }

  enable() {
    super.enable();
    const mouseTimeDisplay = this.getChild('mouseTimeDisplay');

    if (!mouseTimeDisplay) {
      return;
    }

    mouseTimeDisplay.show();
  }

  disable() {
    super.disable();
    const mouseTimeDisplay = this.getChild('mouseTimeDisplay');

    if (!mouseTimeDisplay) {
      return;
    }

    mouseTimeDisplay.hide();
  }

  /**
   * Handle mouse up on seek bar
   *
   * @param {EventTarget~Event} event
   *        The `mouseup` event that caused this to run.
   *
   * @listens mouseup
   */
  handleMouseUp(event) {
    super.handleMouseUp(event);

    // Stop event propagation to prevent double fire in progress-control.js
    event.stopPropagation();
    this.player_.scrubbing(false);

    /**
     * Trigger timeupdate because we're done seeking and the time has changed.
     * This is particularly useful for if the player is paused to time the time displays.
     *
     * @event Tech#timeupdate
     * @type {EventTarget~Event}
     */
    this.player_.trigger({ type: 'timeupdate', target: this, manuallyTriggered: true });
    if (this.videoWasPlaying) {
      silencePromise(this.player_.play());
    }
  }

  /**
   * Move more quickly fast forward for keyboard-only users
   */
  stepForward() {
    this.player_.currentTime(this.player_.currentTime() + STEP_SECONDS);
  }

  /**
   * Move more quickly rewind for keyboard-only users
   */
  stepBack() {
    this.player_.currentTime(this.player_.currentTime() - STEP_SECONDS);
  }

  /**
   * Toggles the playback state of the player
   * This gets called when enter or space is used on the seekbar
   *
   * @param {EventTarget~Event} event
   *        The `keydown` event that caused this function to be called
   *
   */
  handleAction(event) {
    if (this.player_.paused()) {
      this.player_.play();
    } else {
      this.player_.pause();
    }
  }

  /**
   * Called when this SeekBar has focus and a key gets pressed down. By
   * default it will call `this.handleAction` when the key is space or enter.
   *
   * @param {EventTarget~Event} event
   *        The `keydown` event that caused this function to be called.
   *
   * @listens keydown
   */
  handleKeyPress(event) {

    // Support Space (32) or Enter (13) key operation to fire a click event
    if (event.which === 32 || event.which === 13) {
      event.preventDefault();
      this.handleAction(event);
    } else if (super.handleKeyPress) {

      // Pass keypress handling up for unsupported keys
      super.handleKeyPress(event);
    }
  }
}

/**
 * Default options for the `SeekBar`
 *
 * @type {Object}
 * @private
 */
SeekBar.prototype.options_ = {
  children: [
    'loadProgressBar',
    'playProgressBar'
  ],
  barName: 'playProgressBar'
};

// MouseTimeDisplay tooltips should not be added to a player on mobile devices or IE8
if ((!IE_VERSION || IE_VERSION > 8) && !IS_IOS && !IS_ANDROID) {
  SeekBar.prototype.options_.children.splice(1, 0, 'mouseTimeDisplay');
}

/**
 * Call the update event for this Slider when this event happens on the player.
 *
 * @type {string}
 */
SeekBar.prototype.playerEvent = 'timeupdate';

Component.registerComponent('SeekBar', SeekBar);
export default SeekBar;
