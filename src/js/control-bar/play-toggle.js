/**
 * @file play-toggle.js
 */
import Button from '../button.js';
import Component from '../component.js';
import keycode from 'keycode';

/**
 * Button to toggle between play and pause.
 *
 * @extends Button
 */
class PlayToggle extends Button {

  /**
   * Creates an instance of this class.
   *
   * @param {Player} player
   *        The `Player` that this class should be attached to.
   *
   * @param {Object} [options={}]
   *        The key/value store of player options.
   */
  constructor(player, options = {}) {
    super(player, options);

    // show or hide replay icon
    options.replay = options.replay === undefined || options.replay;

    this.on(player, 'play', this.handlePlay);
    this.on(player, 'pause', this.handlePause);

    if (options.replay) {
      this.on(player, 'ended', this.handleEnded);
    }
  }

  /**
   * Builds the default DOM `className`.
   *
   * @return {string}
   *         The DOM `className` for this object.
   */
  buildCSSClass() {
    return `vjs-play-control ${super.buildCSSClass()}`;
  }

  /**
   * This gets called when an `PlayToggle` is "clicked". See
   * {@link ClickableComponent} for more detailed information on what a click can be.
   *
   * @param {EventTarget~Event} [event]
   *        The `keydown`, `tap`, or `click` event that caused this function to be
   *        called.
   *
   * @listens tap
   * @listens click
   */
  handleClick(event) {
    if (this.player_.paused()) {
      this.player_.play();
    } else {
      this.player_.pause();
    }
  }

  /**
   * Handle tab key for `PlayToggle`. See
   * {@link ClickableComponent#handleKeyDown} for instances where this is called.
   *
   * @param {EventTarget~Event} event
   *        The `keydown` event that caused this function to be called.
   *
   * @listens keydown
   */
  handleKeyDown(event) {
    const isShiftTab = event.shiftKey && keycode.isEventKey(event, 'Tab');

    if (!(this.player_.isFullscreen() && isShiftTab)) {
      return;
    }

    event.preventDefault();

    // If Fullscreen mode and Shift-Tab press the 'button'
    // Trap the keyboard focus by rewinding back to the fullscreen toggle button in the player
    const cb = this.player_.getChild('controlBar');
    const fullscreenToggle = cb && cb.getChild('fullscreenToggle');

    if (!fullscreenToggle) {
      this.player_.tech(true).focus();
      return;
    }

    return fullscreenToggle.focus();
  }

  /**
   * This gets called once after the video has ended and the user seeks so that
   * we can change the replay button back to a play button.
   *
   * @param {EventTarget~Event} [event]
   *        The event that caused this function to run.
   *
   * @listens Player#seeked
   */
  handleSeeked(event) {
    this.removeClass('vjs-ended');

    if (this.player_.paused()) {
      this.handlePause(event);
    } else {
      this.handlePlay(event);
    }
  }

  /**
   * Add the vjs-playing class to the element so it can change appearance.
   *
   * @param {EventTarget~Event} [event]
   *        The event that caused this function to run.
   *
   * @listens Player#play
   */
  handlePlay(event) {
    this.removeClass('vjs-ended');
    this.removeClass('vjs-paused');
    this.addClass('vjs-playing');
    // change the button text to "Pause"
    this.controlText('Pause');
  }

  /**
   * Add the vjs-paused class to the element so it can change appearance.
   *
   * @param {EventTarget~Event} [event]
   *        The event that caused this function to run.
   *
   * @listens Player#pause
   */
  handlePause(event) {
    this.removeClass('vjs-playing');
    this.addClass('vjs-paused');
    // change the button text to "Play"
    this.controlText('Play');
  }

  /**
   * Add the vjs-ended class to the element so it can change appearance
   *
   * @param {EventTarget~Event} [event]
   *        The event that caused this function to run.
   *
   * @listens Player#ended
   */
  handleEnded(event) {
    this.removeClass('vjs-playing');
    this.addClass('vjs-ended');
    // change the button text to "Replay"
    this.controlText('Replay');

    // on the next seek remove the replay button
    this.one(this.player_, 'seeked', this.handleSeeked);
  }
}

/**
 * The text that should display over the `PlayToggle`s controls. Added for localization.
 *
 * @type {string}
 * @private
 */
PlayToggle.prototype.controlText_ = 'Play';

Component.registerComponent('PlayToggle', PlayToggle);
export default PlayToggle;
