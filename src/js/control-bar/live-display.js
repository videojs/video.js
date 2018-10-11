/**
 * @file live-display.js
 */
import ClickableComponent from '../clickable-component';
import Component from '../component';
import * as Dom from '../utils/dom.js';

/**
 * Displays the live indicator when duration is Infinity.
 *
 * @extends Component
 */
class LiveDisplay extends ClickableComponent {

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
   * Determines whether the currentTime is also
   * at the live edge of playback by using the seekable end.
   *
   * @return {boolean}
   *         True if the current time is at the live edge and false otherwise.
   */
  atLiveEdge() {
    const currentTime = this.player().currentTime();
    const liveCurrentTime = this.liveCurrentTime();

    // we are "live" if the live current time and the current time are within half a second
    // of each other
    if (liveCurrentTime === Infinity || (liveCurrentTime - currentTime) <= 0.5) {
      return true;
    }

    return false;
  }

  /**
   * Update the the css class of this element with `vjs-at-live-edge` when
   * we are at the live edge.
   */
  updateLiveStatus() {
    if (!this.atLiveEdge()) {
      this.removeClass('vjs-at-live-edge');
    } else {
      this.addClass('vjs-at-live-edge');
    }
  }

  /**
   * A getter for the internal liveCurrentTime_ tracking
   *
   * @return {number}
   *         What we expect the live current time to be.
   */
  liveCurrentTime() {
    return this.liveCurrentTime_;
  }

  /**
   * On click bring us as near to the live point as possible.
   * This requires that we wait for the next `live-seekable-change`
   * event which will happen every segment length seconds.
   */
  handleClick() {
    // don't attempt to seek to live if we are already live
    if (this.atLiveEdge()) {
      return;
    }

    this.player().pause();
    this.player().addClass('vjs-waiting');
    this.one('live-seekable-change', () => {
      this.player().removeClass('vjs-waiting');
      this.player().currentTime(this.liveCurrentTime());
      this.player().play();
    });
  }

  /**
   * This function tracks whether the user is at the current
   * live edge or not. It does this by setting an interval that
   * goes off every 250ms and adding 250ms to our internal count
   * of the live current time. It is kept in check by the seekable end
   * of the current buffer, which is always the live point at the very second
   * that it changes.
   *
   * This function also triggers `live-seekable-change` whenever it detects
   * that the live edge has changed. This helps the handleClick function
   * seek to the live edge.
   */
  startTracking() {
    // if we are already tracking do nothing
    if (this.trackingInterval_) {
      return;
    }

    this.trackingInterval_ = this.setInterval(() => {
      const seekable = this.player().seekable();
      const seekEnd = seekable && seekable.length && seekable.end(0);

      if (this.lastSeekEnd_ !== seekEnd) {
        this.liveCurrentTime_ = seekEnd;
        this.trigger('live-seekable-change');
      }

      this.lastSeekEnd_ = seekEnd;
      this.liveCurrentTime_ += 0.25;
      this.updateLiveStatus();
    }, 250);

    this.liveCurrentTime_ = this.player().currentTime();
  }

  /**
   * In order to determine when the user is behind a live stream
   * we have to keep track of the live current time using an interval.
   * this function clears that interval if it is set.
   */
  stopTracking() {
    // if we are not tracking do nothing
    if (!this.trackingInterval_) {
      return;
    }

    this.clearInterval(this.trackingInterval_);
    this.trackingInterval_ = null;
    this.liveCurrentTime_ = 0;
    this.lastSeekEnd_ = null;
  }

  /**
   * show this element and start tracking
   */
  show() {
    super.show();
    this.startTracking();
  }

  /**
   * hide this element and stop tracking
   */
  hide() {
    super.hide();
    this.stopTracking();
  }

  /**
   * Check the duration to see if the LiveDisplay should be showing or not. Then show/hide
   * it accordingly. Note that hide and show will also start and stop live tracking
   *
   * @param {EventTarget~Event} [event]
   *        The {@link Player#durationchange} event that caused this function to run.
   *
   * @listens Player#durationchange
   */
  updateShowing(event) {
    if (this.player().duration() === Infinity) {
      this.show();
    } else {
      this.hide();
    }
  }

  /**
   * Dispose of the element and stop tracking
   */
  dispose() {
    this.contentEl_ = null;
    this.stopTracking();

    super.dispose();
  }

}

Component.registerComponent('LiveDisplay', LiveDisplay);
export default LiveDisplay;
