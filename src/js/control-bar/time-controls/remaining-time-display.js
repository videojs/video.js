/**
 * @file remaining-time-display.js
 */
import TimeDisplay from './time-display';
import Component from '../../component.js';
import * as Dom from '../../utils/dom.js';

/**
 * Displays the time left in the video
 *
 * @extends Component
 */
class RemainingTimeDisplay extends TimeDisplay {

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
    this.on(player, 'durationchange', this.throttledUpdateContent);
    this.on(player, 'ended', this.handleEnded);
  }

  /**
   * Builds the default DOM `className`.
   *
   * @return {string}
   *         The DOM `className` for this object.
   */
  buildCSSClass() {
    return 'vjs-remaining-time';
  }

  /**
   * Create the `Component`'s DOM element with the "minus" characted prepend to the time
   *
   * @return {Element}
   *         The element that was created.
   */
  createEl() {
    const el = super.createEl();

    el.insertBefore(Dom.createEl('span', {}, {'aria-hidden': true}, '-'), this.contentEl_);
    return el;
  }

  /**
   * Update remaining time display.
   *
   * @param {EventTarget~Event} [event]
   *        The `timeupdate` or `durationchange` event that caused this to run.
   *
   * @listens Player#timeupdate
   * @listens Player#durationchange
   */
  updateContent(event) {
    if (typeof this.player_.duration() !== 'number') {
      return;
    }

    // @deprecated We should only use remainingTimeDisplay
    // as of video.js 7
    if (this.player_.remainingTimeDisplay) {
      this.updateFormattedTime_(this.player_.remainingTimeDisplay());
    } else {
      this.updateFormattedTime_(this.player_.remainingTime());
    }
  }

  /**
   * When the player fires ended there should be no time left. Sadly
   * this is not always the case, lets make it seem like that is the case
   * for users.
   *
   * @param {EventTarget~Event} [event]
   *        The `ended` event that caused this to run.
   *
   * @listens Player#ended
   */
  handleEnded(event) {
    if (!this.player_.duration()) {
      return;
    }
    this.updateFormattedTime_(0);
  }
}

/**
 * The text that is added to the `RemainingTimeDisplay` for screen reader users.
 *
 * @type {string}
 * @private
 */
RemainingTimeDisplay.prototype.labelText_ = 'Remaining Time';

/**
 * The text that should display over the `RemainingTimeDisplay`s controls. Added to for localization.
 *
 * @type {string}
 * @private
 *
 * @deprecated in v7; controlText_ is not used in non-active display Components
 */
RemainingTimeDisplay.prototype.controlText_ = 'Remaining Time';

Component.registerComponent('RemainingTimeDisplay', RemainingTimeDisplay);
export default RemainingTimeDisplay;
