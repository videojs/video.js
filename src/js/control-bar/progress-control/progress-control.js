/**
 * @file progress-control.js
 */
import Component from '../../component.js';
import * as Dom from '../../utils/dom.js';
import clamp from '../../utils/clamp.js';
import {bind, throttle, UPDATE_REFRESH_INTERVAL} from '../../utils/fn.js';
import {silencePromise} from '../../utils/promise';

import './seek-bar.js';

/**
 * The Progress Control component contains the seek bar, load progress,
 * and play progress.
 *
 * @extends Component
 */
class ProgressControl extends Component {

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
    this.handleMouseMove = throttle(bind(this, this.handleMouseMove), UPDATE_REFRESH_INTERVAL);
    this.throttledHandleMouseSeek = throttle(bind(this, this.handleMouseSeek), UPDATE_REFRESH_INTERVAL);
    this.handleMouseUpHandler_ = (e) => this.handleMouseUp(e);
    this.handleMouseDownHandler_ = (e) => this.handleMouseDown(e);

    this.enable();
  }

  /**
   * Create the `Component`'s DOM element
   *
   * @return {Element}
   *         The element that was created.
   */
  createEl() {
    return super.createEl('div', {
      className: 'vjs-progress-control vjs-control'
    });
  }

  /**
   * When the mouse moves over the `ProgressControl`, the pointer position
   * gets passed down to the `MouseTimeDisplay` component.
   *
   * @param {EventTarget~Event} event
   *        The `mousemove` event that caused this function to run.
   *
   * @listen mousemove
   */
  handleMouseMove(event) {
    const seekBar = this.getChild('seekBar');

    if (!seekBar) {
      return;
    }

    const playProgressBar = seekBar.getChild('playProgressBar');
    const mouseTimeDisplay = seekBar.getChild('mouseTimeDisplay');

    if (!playProgressBar && !mouseTimeDisplay) {
      return;
    }

    const seekBarEl = seekBar.el();
    const seekBarRect = Dom.findPosition(seekBarEl);
    let seekBarPoint = Dom.getPointerPosition(seekBarEl, event).x;

    // The default skin has a gap on either side of the `SeekBar`. This means
    // that it's possible to trigger this behavior outside the boundaries of
    // the `SeekBar`. This ensures we stay within it at all times.
    seekBarPoint = clamp(seekBarPoint, 0, 1);

    if (mouseTimeDisplay) {
      mouseTimeDisplay.update(seekBarRect, seekBarPoint);
    }

    if (playProgressBar) {
      playProgressBar.update(seekBarRect, seekBar.getProgress());
    }

  }

  /**
   * A throttled version of the {@link ProgressControl#handleMouseSeek} listener.
   *
   * @method ProgressControl#throttledHandleMouseSeek
   * @param {EventTarget~Event} event
   *        The `mousemove` event that caused this function to run.
   *
   * @listen mousemove
   * @listen touchmove
   */

  /**
   * Handle `mousemove` or `touchmove` events on the `ProgressControl`.
   *
   * @param {EventTarget~Event} event
   *        `mousedown` or `touchstart` event that triggered this function
   *
   * @listens mousemove
   * @listens touchmove
   */
  handleMouseSeek(event) {
    const seekBar = this.getChild('seekBar');

    if (seekBar) {
      seekBar.handleMouseMove(event);
    }
  }

  /**
   * Are controls are currently enabled for this progress control.
   *
   * @return {boolean}
   *         true if controls are enabled, false otherwise
   */
  enabled() {
    return this.enabled_;
  }

  /**
   * Disable all controls on the progress control and its children
   */
  disable() {
    this.children().forEach((child) => child.disable && child.disable());

    if (!this.enabled()) {
      return;
    }

    this.off(['mousedown', 'touchstart'], this.handleMouseDownHandler_);
    this.off(this.el_, 'mousemove', this.handleMouseMove);

    this.removeListenersAddedOnMousedownAndTouchstart();

    this.addClass('disabled');

    this.enabled_ = false;

    // Restore normal playback state if controls are disabled while scrubbing
    if (this.player_.scrubbing()) {
      const seekBar = this.getChild('seekBar');

      this.player_.scrubbing(false);

      if (seekBar.videoWasPlaying) {
        silencePromise(this.player_.play());
      }
    }
  }

  /**
   * Enable all controls on the progress control and its children
   */
  enable() {
    this.children().forEach((child) => child.enable && child.enable());

    if (this.enabled()) {
      return;
    }

    this.on(['mousedown', 'touchstart'], this.handleMouseDownHandler_);
    this.on(this.el_, 'mousemove', this.handleMouseMove);
    this.removeClass('disabled');

    this.enabled_ = true;
  }

  /**
   * Cleanup listeners after the user finishes interacting with the progress controls
   */
  removeListenersAddedOnMousedownAndTouchstart() {
    const doc = this.el_.ownerDocument;

    this.off(doc, 'mousemove', this.throttledHandleMouseSeek);
    this.off(doc, 'touchmove', this.throttledHandleMouseSeek);
    this.off(doc, 'mouseup', this.handleMouseUpHandler_);
    this.off(doc, 'touchend', this.handleMouseUpHandler_);
  }

  /**
   * Handle `mousedown` or `touchstart` events on the `ProgressControl`.
   *
   * @param {EventTarget~Event} event
   *        `mousedown` or `touchstart` event that triggered this function
   *
   * @listens mousedown
   * @listens touchstart
   */
  handleMouseDown(event) {
    const doc = this.el_.ownerDocument;
    const seekBar = this.getChild('seekBar');

    if (seekBar) {
      seekBar.handleMouseDown(event);
    }

    this.on(doc, 'mousemove', this.throttledHandleMouseSeek);
    this.on(doc, 'touchmove', this.throttledHandleMouseSeek);
    this.on(doc, 'mouseup', this.handleMouseUpHandler_);
    this.on(doc, 'touchend', this.handleMouseUpHandler_);
  }

  /**
   * Handle `mouseup` or `touchend` events on the `ProgressControl`.
   *
   * @param {EventTarget~Event} event
   *        `mouseup` or `touchend` event that triggered this function.
   *
   * @listens touchend
   * @listens mouseup
   */
  handleMouseUp(event) {
    const seekBar = this.getChild('seekBar');

    if (seekBar) {
      seekBar.handleMouseUp(event);
    }

    this.removeListenersAddedOnMousedownAndTouchstart();
  }
}

/**
 * Default options for `ProgressControl`
 *
 * @type {Object}
 * @private
 */
ProgressControl.prototype.options_ = {
  children: [
    'seekBar'
  ]
};

Component.registerComponent('ProgressControl', ProgressControl);
export default ProgressControl;
