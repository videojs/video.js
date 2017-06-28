/**
 * @file remaining-time-display.js
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
class RemainingTimeDisplay extends Component {

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
    this.on(player, ['timeupdate', 'durationchange'], this.throttledUpdateContent);
  }

  /**
   * Create the `Component`'s DOM element
   *
   * @return {Element}
   *         The element that was created.
   */
  createEl() {
    const el = super.createEl('div', {
      className: 'vjs-remaining-time vjs-time-control vjs-control'
    });

    this.contentEl_ = Dom.createEl('div', {
      className: 'vjs-remaining-time-display'
    }, {
      // tell screen readers not to automatically read the time as it changes
      'aria-live': 'off'
    }, Dom.createEl('span', {
      className: 'vjs-control-text',
      textContent: this.localize('Remaining Time')
    }));

    this.updateTextNode_();
    el.appendChild(this.contentEl_);
    return el;
  }

  /**
   * Updates the "remaining time" text node with new content using the
   * contents of the `formattedTime_` property.
   *
   * @private
   */
  updateTextNode_() {
    if (this.textNode_) {
      this.contentEl_.removeChild(this.textNode_);
    }
    this.textNode_ = document.createTextNode(` -${this.formattedTime_ || '0:00'}`);
    this.contentEl_.appendChild(this.textNode_);
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
    if (this.player_.duration()) {
      const formattedTime = formatTime(this.player_.remainingTime());

      if (formattedTime !== this.formattedTime_) {
        this.formattedTime_ = formattedTime;
        this.requestAnimationFrame(this.updateTextNode_);
      }
    }
  }
}

Component.registerComponent('RemainingTimeDisplay', RemainingTimeDisplay);
export default RemainingTimeDisplay;
