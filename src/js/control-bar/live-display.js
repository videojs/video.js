/**
 * @file live-display.js
 */
import Component from '../component';
import * as Dom from '../utils/dom.js';
import * as browser from '../utils/browser.js';

// TODO - Future make it click to snap to live

/**
 * Displays the live indicator when duration is Infinity.
 *
 * @extends Component
 */
class LiveDisplay extends Component {

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

    this.updateShowing();
    this.on(this.player(), 'durationchange', this.updateShowing);
  }

  /**
   * Create the `Component`'s DOM element
   *
   * @return {Element}
   *         The element that was created.
   */
  createEl() {
    const el = super.createEl('div', {
      className: 'vjs-live-control vjs-control'
    });

    this.contentEl_ = Dom.createEl('div', {
      className: 'vjs-live-display',
      innerHTML: `<span class="vjs-control-text">${this.localize('Stream Type')}</span>${this.localize('LIVE')}`
    }, {
      'aria-live': 'off'
    });

    el.appendChild(this.contentEl_);
    return el;
  }

  /**
   * Check the duration to see if the LiveDisplay should be showing or not. Then show/hide
   * it accordingly
   *
   * @param {EventTarget~Event} [event]
   *        The {@link Player#durationchange} event that caused this function to run.
   *
   * @listens Player#durationchange
   */
  updateShowing(event) {
    if (this.player().duration() === Infinity) {
      // On Android Chrome, duration of VOD HLS remains Infinity until
      // after playback has begun (and after hasStarted()).
      if (browser.IS_ANDROID && browser.IS_CHROME) {
        let checkDuration = function () {
          if (this.player().currentTime() > 0) {
            if (this.player().duration() === Infinity) {
              this.show();
            } else {
              this.hide();
            }
            this.off(this.player(), 'timeupdate', checkDuration);
          }
        };

        this.on(this.player(), 'timeupdate', checkDuration);
      } else {
        this.show();
      }
    } else {
      this.hide();
    }
  }

}

Component.registerComponent('LiveDisplay', LiveDisplay);
export default LiveDisplay;
