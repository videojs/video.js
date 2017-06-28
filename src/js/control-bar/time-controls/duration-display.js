/**
 * @file duration-display.js
 */
import document from 'global/document';
import Component from '../../component.js';
import * as Dom from '../../utils/dom.js';
import {bind, throttle} from '../../utils/fn.js';
import formatTime from '../../utils/format-time.js';

/**
 * Displays the duration
 *
 * @extends Component
 */
class DurationDisplay extends Component {

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

    this.on(player, [
      'durationchange',

      // Also listen for timeupdate and loadedmetadata because removing those
      // listeners could have broken dependent applications/libraries. These
      // can likely be removed for 7.0.
      'loadedmetadata',
      'timeupdate'
    ], this.throttledUpdateContent);
  }

  /**
   * Create the `Component`'s DOM element
   *
   * @return {Element}
   *         The element that was created.
   */
  createEl() {
    const el = super.createEl('div', {
      className: 'vjs-duration vjs-time-control vjs-control'
    });

    this.contentEl_ = Dom.createEl('div', {
      className: 'vjs-duration-display'
    }, {
      // tell screen readers not to automatically read the time as it changes
      'aria-live': 'off'
    }, Dom.createEl('span', {
      className: 'vjs-control-text',
      textContent: this.localize('Duration Time')
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
   * Update duration time display.
   *
   * @param {EventTarget~Event} [event]
   *        The `durationchange`, `timeupdate`, or `loadedmetadata` event that caused
   *        this function to be called.
   *
   * @listens Player#durationchange
   * @listens Player#timeupdate
   * @listens Player#loadedmetadata
   */
  updateContent(event) {
    const duration = this.player_.duration();

    if (duration && this.duration_ !== duration) {
      this.duration_ = duration;
      this.formattedTime_ = formatTime(duration);
      this.requestAnimationFrame(this.updateTextNode_);
    }
  }
}

Component.registerComponent('DurationDisplay', DurationDisplay);
export default DurationDisplay;
