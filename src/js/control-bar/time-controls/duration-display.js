/**
 * @file duration-display.js
 */
import Component from '../../component.js';
import * as Dom from '../../utils/dom.js';
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

    this.on(player, 'durationchange', this.updateContent);

    // Also listen for timeupdate and loadedmetadata because removing those
    // listeners could have broken dependent applications/libraries. These
    // can likely be removed for 6.0.
    this.on(player, 'timeupdate', this.updateContent);
    this.on(player, 'loadedmetadata', this.updateContent);
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
      className: 'vjs-duration-display',
      // label the duration time for screen reader users
      innerHTML: `<span class="vjs-control-text">${this.localize('Duration Time')}</span> 0:00`
    }, {
      // tell screen readers not to automatically read the time as it changes
      'aria-live': 'off'
    });

    el.appendChild(this.contentEl_);
    return el;
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
      const localizedText = this.localize('Duration Time');
      const formattedTime = formatTime(duration);

      // label the duration time for screen reader users
      this.contentEl_.innerHTML = `<span class="vjs-control-text">${localizedText}</span> ${formattedTime}`;
    }
  }

}

Component.registerComponent('DurationDisplay', DurationDisplay);
export default DurationDisplay;
