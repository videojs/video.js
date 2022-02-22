/**
 * @file big-pause-button.js
 */
import Button from './button.js';
import Component from './component.js';
import {isPromise, silencePromise} from './utils/promise';
import * as browser from './utils/browser.js';

/**
 * The pause button that shows on screen while playing. The hiding of the
 * `BigPauseButton` get done via CSS and `Player` states.
 *
 * @extends Button
 */
class BigPauseButton extends Button {
  constructor(player, options) {
    super(player, options);

    this.mouseused_ = false;

    this.on('mousedown', (e) => this.handleMouseDown(e));
  }

  /**
   * Builds the default DOM `className`.
   *
   * @return {string}
   *         The DOM `className` for this object. Always returns 'vjs-big-pause-button'.
   */
  buildCSSClass() {
    return 'vjs-big-pause-button';
  }

  /**
   * This gets called when a `BigPauseButton` "clicked". See {@link ClickableComponent}
   * for more detailed information on what a click can be.
   *
   * @param {EventTarget~Event} event
   *        The `keydown`, `tap`, or `click` event that caused this function to be
   *        called.
   *
   * @listens tap
   * @listens click
   */
  handleClick(event) {
    const pausePromise = this.player_.pause();

    // exit early if clicked via the mouse
    if (this.mouseused_ && event.clientX && event.clientY) {
      const sourceIsEncrypted = this.player_.usingPlugin('eme') &&
                                this.player_.eme.sessions &&
                                this.player_.eme.sessions.length > 0;

      silencePromise(pausePromise);
      if (this.player_.tech(true) &&
         // We've observed a bug in IE and Edge when playing back DRM content where
         // calling .focus() on the video element causes the video to go black,
         // so we avoid it in that specific case
         !((browser.IE_VERSION || browser.IS_EDGE) && sourceIsEncrypted)) {
        this.player_.tech(true).focus();
      }
      return;
    }

    const cb = this.player_.getChild('controlBar');
    const playToggle = cb && cb.getChild('playToggle');

    if (!playToggle) {
      this.player_.tech(true).focus();
      return;
    }

    const playFocus = () => playToggle.focus();

    if (isPromise(pausePromise)) {
      pausePromise.then(playFocus, () => {});
    } else {
      this.setTimeout(playFocus, 1);
    }
  }

  handleKeyDown(event) {
    this.mouseused_ = false;

    super.handleKeyDown(event);
  }

  handleMouseDown(event) {
    this.mouseused_ = true;
  }
}

/**
 * The text that should display over the `BigPauseButton`s controls. Added to for localization.
 *
 * @type {string}
 * @private
 */
BigPauseButton.prototype.controlText_ = 'Pause Video';

Component.registerComponent('BigPauseButton', BigPauseButton);
export default BigPauseButton;
