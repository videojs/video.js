/**
 * @file seek-to-live.js
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

    if (this.player_.liveTracker) {
      this.updateLiveEdgeStatusHandler_ = (e) => this.updateLiveEdgeStatus(e);
      this.on(this.player_.liveTracker, 'liveedgechange', this.updateLiveEdgeStatusHandler_);
    }
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

    this.textEl_ = Dom.createEl('span', {
      className: 'vjs-seek-to-live-text',
      textContent: this.localize('LIVE')
    }, {
      'aria-hidden': 'true'
    });

    el.appendChild(this.textEl_);
    return el;
  }

  /**
   * Update the state of this button if we are at the live edge
   * or not
   */
  updateLiveEdgeStatus() {
    // default to live edge
    if (!this.player_.liveTracker || this.player_.liveTracker.atLiveEdge()) {
      this.setAttribute('aria-disabled', true);
      this.addClass('vjs-at-live-edge');
      this.controlText('Seek to live, currently playing live');
    } else {
      this.setAttribute('aria-disabled', false);
      this.removeClass('vjs-at-live-edge');
      this.controlText('Seek to live, currently behind live');
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
    if (this.player_.liveTracker) {
      this.off(this.player_.liveTracker, 'liveedgechange', this.updateLiveEdgeStatusHandler_);
    }
    this.textEl_ = null;

    super.dispose();
  }
}

SeekToLive.prototype.controlText_ = 'Seek to live, currently playing live';

Component.registerComponent('SeekToLive', SeekToLive);
export default SeekToLive;
