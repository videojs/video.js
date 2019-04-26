/**
 * @file seek-bar.js
 */
import Slider from '../../slider/slider.js';
import Component from '../../component.js';
import {IS_IOS, IS_ANDROID} from '../../utils/browser.js';
import * as Dom from '../../utils/dom.js';
import * as Fn from '../../utils/fn.js';
import formatTime from '../../utils/format-time.js';
import {silencePromise} from '../../utils/promise';
import keycode from 'keycode';
import document from 'global/document';

import './load-progress-bar.js';
import './play-progress-bar.js';
import './mouse-time-display.js';

// The number of seconds the `step*` functions move the timeline.
const STEP_SECONDS = 5;

// The multiplier of STEP_SECONDS that PgUp/PgDown move the timeline.
const PAGE_KEY_MULTIPLIER = 12;

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
    this.setEventHandlers_();
  }

  /**
   * Sets the event handlers
   *
   * @private
   */
  setEventHandlers_() {
    this.update = Fn.throttle(Fn.bind(this, this.update), UPDATE_REFRESH_INTERVAL);

    this.on(this.player_, 'timeupdate', this.update);
    this.on(this.player_, 'ended', this.handleEnded);
    this.on(this.player_, 'durationchange', this.update);
    if (this.player_.liveTracker) {
      this.on(this.player_.liveTracker, 'liveedgechange', this.update);
    }

    // when playing, let's ensure we smoothly update the play progress bar
    // via an interval
    this.updateInterval = null;

    this.on(this.player_, ['playing'], this.enableInterval_);

    this.on(this.player_, ['ended', 'pause', 'waiting'], this.disableInterval_);

    // we don't need to update the play progress if the document is hidden,
    // also, this causes the CPU to spike and eventually crash the page on IE11.
    if ('hidden' in document && 'visibilityState' in document) {
      this.on(document, 'visibilitychange', this.toggleVisibility_);
    }
  }

  toggleVisibility_(e) {
    if (document.hidden) {
      this.disableInterval_(e);
    } else {
      this.enableInterval_();

      // we just switched back to the page and someone may be looking, so, update ASAP
      this.requestAnimationFrame(this.update);
    }
  }

  enableInterval_() {
    this.clearInterval(this.updateInterval);

    this.updateInterval = this.setInterval(() =>{
      this.requestAnimationFrame(this.update);
    }, UPDATE_REFRESH_INTERVAL);
  }

  disableInterval_(e) {
    if (this.player_.liveTracker && this.player_.liveTracker.isLive() && e.type !== 'ended') {
      return;
    }

    this.clearInterval(this.updateInterval);
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
   * This function updates the play progress bar and accessibility
   * attributes to whatever is passed in.
   *
   * @param {number} currentTime
   *        The currentTime value that should be used for accessibility
   *
   * @param {number} percent
   *        The percentage as a decimal that the bar should be filled from 0-1.
   *
   * @private
   */
  update_(currentTime, percent) {
    const liveTracker = this.player_.liveTracker;
    let duration = this.player_.duration();

    if (liveTracker && liveTracker.isLive()) {
      duration = this.player_.liveTracker.liveCurrentTime();
    }

    // machine readable value of progress bar (percentage complete)
    this.el_.setAttribute('aria-valuenow', (percent * 100).toFixed(2));

    // human readable value of progress bar (time complete)
    this.el_.setAttribute(
      'aria-valuetext',
      this.localize(
        'progress bar timing: currentTime={1} duration={2}',
        [formatTime(currentTime, duration),
          formatTime(duration, duration)],
        '{1} of {2}'
      )
    );

    // Update the `PlayProgressBar`.
    if (this.bar) {
      this.bar.update(Dom.getBoundingClientRect(this.el_), percent);
    }
  }

  /**
   * Update the seek bar's UI.
   *
   * @param {EventTarget~Event} [event]
   *        The `timeupdate` or `ended` event that caused this to run.
   *
   * @listens Player#timeupdate
   *
   * @return {number}
   *          The current percent at a number from 0-1
   */
  update(event) {
    // if the offsetParent is null, then this element is hidden, in which case
    // we don't need to update it.
    if (this.el().offsetParent === null) {
      return;
    }

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
    const currentTime = this.getCurrentTime_();
    let percent;
    const liveTracker = this.player_.liveTracker;

    if (liveTracker && liveTracker.isLive()) {
      percent = (currentTime - liveTracker.seekableStart()) / liveTracker.liveWindow();

      // prevent the percent from changing at the live edge
      if (liveTracker.atLiveEdge()) {
        percent = 1;
      }
    } else {
      percent = currentTime / this.player_.duration();
    }

    return percent >= 1 ? 1 : (percent || 0);
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
    let newTime;
    const distance = this.calculateDistance(event);
    const liveTracker = this.player_.liveTracker;

    if (!liveTracker || !liveTracker.isLive()) {
      newTime = distance * this.player_.duration();

      // Don't let video end while scrubbing.
      if (newTime === this.player_.duration()) {
        newTime = newTime - 0.1;
      }
    } else {
      const seekableStart = liveTracker.seekableStart();
      const seekableEnd = liveTracker.liveCurrentTime();

      newTime = seekableStart + (distance * liveTracker.liveWindow());

      // Don't let video end while scrubbing.
      if (newTime >= seekableEnd) {
        newTime = seekableEnd;
      }

      // Compensate for precision differences so that currentTime is not less
      // than seekable start
      if (newTime <= seekableStart) {
        newTime = seekableStart + 0.1;
      }

      // On android seekableEnd can be Infinity sometimes,
      // this will cause newTime to be Infinity, which is
      // not a valid currentTime.
      if (newTime === Infinity) {
        return;
      }
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
    if (event) {
      event.stopPropagation();
    }
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
   * Called when this SeekBar has focus and a key gets pressed down.
   * Supports the following keys:
   *
   *   Space or Enter key fire a click event
   *   Home key moves to start of the timeline
   *   End key moves to end of the timeline
   *   Digit "0" through "9" keys move to 0%, 10% ... 80%, 90% of the timeline
   *   PageDown key moves back a larger step than ArrowDown
   *   PageUp key moves forward a large step
   *
   * @param {EventTarget~Event} event
   *        The `keydown` event that caused this function to be called.
   *
   * @listens keydown
   */
  handleKeyDown(event) {
    if (keycode.isEventKey(event, 'Space') || keycode.isEventKey(event, 'Enter')) {
      event.stopPropagation();
      this.handleAction(event);
    } else if (keycode.isEventKey(event, 'Home')) {
      event.stopPropagation();
      this.player_.currentTime(0);
    } else if (keycode.isEventKey(event, 'End')) {
      event.stopPropagation();
      this.player_.currentTime(this.player_.duration());
    } else if (/^[0-9]$/.test(keycode(event))) {
      event.stopPropagation();
      const gotoFraction = (keycode.codes[keycode(event)] - keycode.codes['0']) * 10.0 / 100.0;

      this.player_.currentTime(this.player_.duration() * gotoFraction);
    } else if (keycode.isEventKey(event, 'PgDn')) {
      event.stopPropagation();
      this.player_.currentTime(this.player_.currentTime() - (STEP_SECONDS * PAGE_KEY_MULTIPLIER));
    } else if (keycode.isEventKey(event, 'PgUp')) {
      event.stopPropagation();
      this.player_.currentTime(this.player_.currentTime() + (STEP_SECONDS * PAGE_KEY_MULTIPLIER));
    } else {
      // Pass keydown handling up for unsupported keys
      super.handleKeyDown(event);
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

// MouseTimeDisplay tooltips should not be added to a player on mobile devices
if (!IS_IOS && !IS_ANDROID) {
  SeekBar.prototype.options_.children.splice(1, 0, 'mouseTimeDisplay');
}

Component.registerComponent('SeekBar', SeekBar);
export default SeekBar;
