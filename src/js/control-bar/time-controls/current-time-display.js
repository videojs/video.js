/**
 * @file current-time-display.js
 */
import document from 'global/document';
import Component from '../../component.js';
import * as Dom from '../../utils/dom.js';
import {bind, throttle} from '../../utils/fn.js';
import formatTime from '../../utils/format-time.js';

/**
 * Displays the current time
 *
 * @extends Component
 */
class CurrentTimeDisplay extends Component {

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
  createEl() {
    const el = super.createEl('div', {
      className: 'vjs-current-time vjs-time-control vjs-control'
    });

    this.contentEl_ = Dom.createEl('div', {
      className: 'vjs-current-time-display'
    }, {
      // tell screen readers not to automatically read the time as it changes
      'aria-live': 'off'
    }, Dom.createEl('span', {
      className: 'vjs-control-text',
      textContent: this.localize('Current Time')
    }));

    this.updateTextNode_();
    el.appendChild(this.contentEl_);
    return el;
  }

  /**
   * Updates the "current time" text node with new content using the
   * contents of the `formattedTime_` property.
   *
   * @private
   */
  updateTextNode_() {
    if (this.textNode_) {
      this.contentEl_.removeChild(this.textNode_);
    }
    this.textNode_ = document.createTextNode(` ${this.formattedTime_ || '0:00'}`);
    this.contentEl_.appendChild(this.textNode_);
  }

  /**
   * Update current time display
   *
   * @param {EventTarget~Event} [event]
   *        The `timeupdate` event that caused this function to run.
   *
   * @listens Player#timeupdate
   */
  updateContent(event) {
    // Allows for smooth scrubbing, when player can't keep up.
    const time = (this.player_.scrubbing()) ? this.player_.getCache().currentTime : this.player_.currentTime();
    const formattedTime = formatTime(time, this.player_.duration());

    if (formattedTime !== this.formattedTime_) {
      this.formattedTime_ = formattedTime;
      this.requestAnimationFrame(this.updateTextNode_);
    }
  }

}

Component.registerComponent('CurrentTimeDisplay', CurrentTimeDisplay);
export default CurrentTimeDisplay;
