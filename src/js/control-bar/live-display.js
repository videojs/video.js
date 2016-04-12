/**
 * @file live-display.js
 */
import Component from '../component';
import * as Dom from '../utils/dom.js';
import * as browser from '../utils/browser.js';

/**
 * Displays the live indicator
 * TODO - Future make it click to snap to live
 *
 * @extends Component
 * @class LiveDisplay
 */
class LiveDisplay extends Component {

  constructor(player, options) {
    super(player, options);

    this.updateShowing();
    this.on(this.player(), 'durationchange', this.updateShowing);
  }

  /**
   * Create the component's DOM element
   *
   * @return {Element}
   * @method createEl
   */
  createEl() {
    var el = super.createEl('div', {
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

  updateShowing() {
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
