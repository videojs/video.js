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
class SeekToLive extends Button {

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

    this.updateLiveEdgeStatus();
    this.on(this.player_.liveTracker, 'liveedgechange', this.updateLiveEdgeStatus);
  }

  /**
   * Create the `Component`'s DOM element
   *
   * @return {Element}
   *         The element that was created.
   */
  createEl() {
    const el = super.createEl('button', {
      className: 'vjs-seek-to-live-control vjs-control'
    });

    this.contentEl_ = Dom.createEl('div', {
      className: 'vjs-seek-to-live',
      innerHTML: `<span class="vjs-control-text">${this.localize('Stream Type')}\u00a0</span>${this.localize('LIVE')}`
    }, {
      'aria-live': 'off'
    });

    this.circleEl_ = Dom.createEl('span', {
      className: 'vjs-seek-to-live-circle'
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
   * Dispose of the element and stop tracking
   */
  dispose() {
    this.off(this.player_.liveTracker, 'liveedgechange', this.updateLiveEdgeStatus);
    this.contentEl_ = null;

    super.dispose();
  }

}

Component.registerComponent('SeekToLive', SeekToLive);
export default SeekToLive;
