/**
 * @file time-display.js
 */
import document from 'global/document';
import Component from '../../component.js';
import * as Dom from '../../utils/dom.js';
import {bind, throttle} from '../../utils/fn.js';
import formatTime from '../../utils/format-time.js';

/**
 * Displays the time left in the video
 *
 * @extends Component
 */
class TimeDisplay extends Component {

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
    this.throttledUpdateContent = throttle(bind(this, this.updateContent), 25);
    this.on(player, 'timeupdate', this.throttledUpdateContent);
  }

  /**
   * Create the `Component`'s DOM element
   *
   * @return {Element}
   *         The element that was created.
   */
  createEl(plainName) {
    const className = this.buildCSSClass();
    const el = super.createEl('div', {
      className: `${className} vjs-time-control vjs-control`
    });

    this.contentEl_ = Dom.createEl('div', {
      className: `${className}-display`
    }, {
      // tell screen readers not to automatically read the time as it changes
      'aria-live': 'off'
    }, Dom.createEl('span', {
      className: 'vjs-control-text',
      textContent: this.localize(this.controlText_)
    }));

    this.updateTextNode_();
    el.appendChild(this.contentEl_);
    return el;
  }

  dispose() {
    this.contentEl_ = null;
    this.textNode_ = null;

    super.dispose();
  }

  /**
   * Updates the "remaining time" text node with new content using the
   * contents of the `formattedTime_` property.
   *
   * @private
   */
  updateTextNode_() {
    if (!this.contentEl_) {
      return;
    }

    while (this.contentEl_.firstChild) {
      this.contentEl_.removeChild(this.contentEl_.firstChild);
    }

    this.textNode_ = document.createTextNode(this.formattedTime_ || '0:00');
    this.contentEl_.appendChild(this.textNode_);
  }

  /**
   * Generates a formatted time for this component to use in display.
   *
   * @param  {number} time
   *         A numeric time, in seconds.
   *
   * @return {string}
   *         A formatted time
   *
   * @private
   */
  formatTime_(time) {
    return formatTime(time);
  }

  /**
   * Updates the time display text node if it has what was passed in changed
   * the formatted time.
   *
   * @param {number} time
   *        The time to update to
   *
   * @private
   */
  updateFormattedTime_(time) {
    const formattedTime = this.formatTime_(time);

    if (formattedTime === this.formattedTime_) {
      return;
    }

    this.formattedTime_ = formattedTime;
    this.requestAnimationFrame(this.updateTextNode_);
  }

  /**
   * To be filled out in the child class, should update the displayed time
   * in accordance with the fact that the current time has changed.
   *
   * @param {EventTarget~Event} [event]
   *        The `timeupdate`  event that caused this to run.
   *
   * @listens Player#timeupdate
   */
  updateContent(event) {}
}

/**
 * The text that should display over the `TimeDisplay`s controls. Added to for localization.
 *
 * @type {string}
 * @private
 */
TimeDisplay.prototype.controlText_ = 'Time';

Component.registerComponent('TimeDisplay', TimeDisplay);
export default TimeDisplay;
