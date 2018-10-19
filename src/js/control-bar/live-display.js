/**
 * @file live-display.js
 */
import Button from '../button';
import Component from '../component';
import * as Dom from '../utils/dom.js';

/**
 * Displays the live indicator when duration is Infinity.
 *
 * @extends Component
 */
class LiveDisplay extends Button {

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
    this.on(this.player_, 'durationchange', this.updateShowing);
  }

  /**
   * Create the `Component`'s DOM element
   *
   * @return {Element}
   *         The element that was created.
   */
  createEl() {
    const el = super.createEl('button', {
      className: 'vjs-live-control vjs-control'
    });

    this.contentEl_ = Dom.createEl('div', {
      className: 'vjs-live-display',
      innerHTML: `<span class="vjs-control-text">${this.localize('Stream Type')}\u00a0</span>${this.localize('LIVE')}`
    }, {
      'aria-live': 'off'
    });

    this.circleEl_ = Dom.createEl('span', {
      className: 'vjs-live-circle'
    });

    el.appendChild(this.circleEl_);
    el.appendChild(this.contentEl_);
    return el;
  }

  /**
   * Update the state of this button if we are at the live edge
   * or not
   */
  updateLiveEdgeStatus(e) {
    if (this.player_.liveTracker.behindLiveEdge()) {
      this.removeClass('vjs-at-live-edge');
    } else {
      this.addClass('vjs-at-live-edge');
    }
  }

  /**
   * On click bring us as near to the live point as possible.
   * This requires that we wait for the next `live-seekable-change`
   * event which will happen every segment length seconds.
   */
  handleClick() {
    this.player_.liveTracker.seekToLiveEdge();
  }

  /**
   * show this element and start tracking
   */
  show() {
    super.show();
    this.on(this.player_.liveTracker, 'live-edge-change', this.updateLiveEdgeStatus);
  }

  /**
   * hide this element and stop tracking
   */
  hide() {
    super.hide();
    this.off(this.player_.liveTracker, 'live-edge-change', this.updateLiveEdgeStatus);
  }

  /**
   * Check the duration to see if the LiveDisplay should be showing or not. Then show/hide
   * it accordingly.
   *
   * @param {EventTarget~Event} [event]
   *        The {@link Player#durationchange} event that caused this function to run.
   *
   * @listens Player#durationchange
   */
  updateShowing(event) {
    if (this.player_.liveTracker.isLive()) {
      this.show();
    } else {
      this.hide();
    }
  }

  /**
   * Dispose of the element and stop tracking
   */
  dispose() {
    this.hide();
    this.contentEl_ = null;

    super.dispose();
  }

}

Component.registerComponent('LiveDisplay', LiveDisplay);
export default LiveDisplay;
