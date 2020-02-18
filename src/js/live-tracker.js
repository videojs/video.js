import Component from './component.js';
import median from './utils/median.js';
import mergeOptions from './utils/merge-options.js';
import document from 'global/document';
import * as browser from './utils/browser.js';
import * as Fn from './utils/fn.js';

/* track when we are at the live edge, and other helpers for live playback */
class LiveTracker extends Component {

  constructor(player, options) {
    // LiveTracker does not need an element
    const options_ = mergeOptions({createEl: false}, options);

    super(player, options_);

    this.reset_();

    this.on(this.player_, 'durationchange', this.handleDurationchange);

    // we don't need to track live playback if the document is hidden,
    // also, tracking when the document is hidden can
    // cause the CPU to spike and eventually crash the page on IE11.
    if (browser.IE_VERSION && 'hidden' in document && 'visibilityState' in document) {
      this.on(document, 'visibilitychange', this.handleVisibilityChange);
    }
  }

  handleVisibilityChange() {
    if (this.player_.duration() !== Infinity) {
      return;
    }

    if (document.hidden) {
      this.stopTracking();
    } else {
      this.startTracking();
    }
  }

  isBehind_() {
    // don't report that we are behind until a timeupdate has been seen
    if (!this.timeupdateSeen_) {
      return false;
    }
    const liveCurrentTime = this.liveCurrentTime();
    const currentTime = this.player_.currentTime();

    // the live edge window is the amount of seconds away from live
    // that a player can be, but still be considered live.
    // we add 0.07 because the live tracking happens every 30ms
    // and we want some wiggle room for short segment live playback
    const liveEdgeWindow = (this.seekableIncrement_ * 2) + 0.07;

    // on Android liveCurrentTime can bee Infinity, because seekableEnd
    // can be Infinity, so we handle that case.
    return liveCurrentTime !== Infinity && (liveCurrentTime - liveEdgeWindow) >= currentTime;
  }

  // all the functionality for tracking when seek end changes
  // and for tracking how far past seek end we should be
  trackLive_() {
    this.pastSeekEnd_ = this.pastSeekEnd_;
    const seekable = this.player_.seekable();

    // skip undefined seekable
    if (!seekable || !seekable.length) {
      return;
    }

    const newSeekEnd = this.seekableEnd();

    // we can only tell if we are behind live, when seekable changes
    // once we detect that seekable has changed we check the new seek
    // end against current time, with a fudge value of half a second.
    if (newSeekEnd !== this.lastSeekEnd_) {
      if (this.lastSeekEnd_) {
        // we try to get the best fit value for the seeking increment
        // variable from the last 12 values.
        this.seekableIncrementList_ = this.seekableIncrementList_.slice(-11);
        this.seekableIncrementList_.push(Math.abs(newSeekEnd - this.lastSeekEnd_));
        if (this.seekableIncrementList_.length > 3) {
          this.seekableIncrement_ = median(this.seekableIncrementList_);
        }
      }

      this.pastSeekEnd_ = 0;
      this.lastSeekEnd_ = newSeekEnd;
      this.trigger('seekableendchange');
    }

    // we should reset pastSeekEnd when the value
    // is much higher than seeking increment.
    if (this.pastSeekEnd() > this.seekableIncrement_ * 1.5) {
      this.pastSeekEnd_ = 0;
    } else {
      this.pastSeekEnd_ = this.pastSeekEnd() + 0.03;
    }

    if (this.isBehind_() !== this.behindLiveEdge()) {
      this.behindLiveEdge_ = this.isBehind_();
      this.trigger('liveedgechange');
    }
  }

  /**
   * handle a durationchange event on the player
   * and start/stop tracking accordingly.
   */
  handleDurationchange() {
    if (this.player_.duration() === Infinity) {
      this.startTracking();
    } else {
      this.stopTracking();
    }
  }

  /**
   * start tracking live playback
   */
  startTracking() {
    if (this.isTracking()) {
      return;
    }

    // If we haven't seen a timeupdate, we need to check whether playback
    // began before this component started tracking. This can happen commonly
    // when using autoplay.
    if (!this.timeupdateSeen_) {
      this.timeupdateSeen_ = this.player_.hasStarted();
    }

    this.trackingInterval_ = this.setInterval(this.trackLive_, Fn.UPDATE_REFRESH_INTERVAL);
    this.trackLive_();

    this.on(this.player_, 'play', this.trackLive_);
    this.on(this.player_, 'pause', this.trackLive_);

    // this is to prevent showing that we are not live
    // before a video starts to play
    if (!this.timeupdateSeen_) {
      this.one(this.player_, 'play', this.handlePlay);
      this.handleTimeupdate = () => {
        this.timeupdateSeen_ = true;
        this.handleTimeupdate = null;
      };
      this.one(this.player_, 'timeupdate', this.handleTimeupdate);
    }
  }

  handlePlay() {
    this.one(this.player_, 'timeupdate', this.seekToLiveEdge);
  }

  /**
   * Stop tracking, and set all internal variables to
   * their initial value.
   */
  reset_() {
    this.pastSeekEnd_ = 0;
    this.lastSeekEnd_ = null;
    this.behindLiveEdge_ = null;
    this.timeupdateSeen_ = false;

    this.clearInterval(this.trackingInterval_);
    this.trackingInterval_ = null;
    this.seekableIncrement_ = 12;
    this.seekableIncrementList_ = [];

    this.off(this.player_, 'play', this.trackLive_);
    this.off(this.player_, 'pause', this.trackLive_);
    this.off(this.player_, 'play', this.handlePlay);
    this.off(this.player_, 'timeupdate', this.seekToLiveEdge);
    if (this.handleTimeupdate) {
      this.off(this.player_, 'timeupdate', this.handleTimeupdate);
      this.handleTimeupdate = null;
    }
  }

  /**
   * stop tracking live playback
   */
  stopTracking() {
    if (!this.isTracking()) {
      return;
    }
    this.reset_();
  }

  /**
   * A helper to get the player seekable end
   * so that we don't have to null check everywhere
   */
  seekableEnd() {
    const seekable = this.player_.seekable();
    const seekableEnds = [];
    let i = seekable ? seekable.length : 0;

    while (i--) {
      seekableEnds.push(seekable.end(i));
    }

    // grab the furthest seekable end after sorting, or if there are none
    // default to Infinity
    return seekableEnds.length ? seekableEnds.sort()[seekableEnds.length - 1] : Infinity;
  }

  /**
   * A helper to get the player seekable start
   * so that we don't have to null check everywhere
   */
  seekableStart() {
    const seekable = this.player_.seekable();
    const seekableStarts = [];
    let i = seekable ? seekable.length : 0;

    while (i--) {
      seekableStarts.push(seekable.start(i));
    }

    // grab the first seekable start after sorting, or if there are none
    // default to 0
    return seekableStarts.length ? seekableStarts.sort()[0] : 0;
  }

  /**
   * Get the live time window
   */
  liveWindow() {
    const liveCurrentTime = this.liveCurrentTime();

    if (liveCurrentTime === Infinity) {
      return Infinity;
    }

    return liveCurrentTime - this.seekableStart();
  }

  /**
   * Determines if the player is live, only checks if this component
   * is tracking live playback or not
   */
  isLive() {
    return this.isTracking();
  }

  /**
   * Determines if currentTime is at the live edge and won't fall behind
   * on each seekableendchange
   */
  atLiveEdge() {
    return !this.behindLiveEdge();
  }

  /**
   * get what we expect the live current time to be
   */
  liveCurrentTime() {
    return this.pastSeekEnd() + this.seekableEnd();
  }

  /**
   * Returns how far past seek end we expect current time to be
   */
  pastSeekEnd() {
    return this.pastSeekEnd_;
  }

  /**
   * If we are currently behind the live edge, aka currentTime will be
   * behind on a seekableendchange
   */
  behindLiveEdge() {
    return this.behindLiveEdge_;
  }

  isTracking() {
    return typeof this.trackingInterval_ === 'number';
  }

  /**
   * Seek to the live edge if we are behind the live edge
   */
  seekToLiveEdge() {
    if (this.atLiveEdge()) {
      return;
    }

    this.player_.currentTime(this.liveCurrentTime());

    if (this.player_.paused()) {
      this.player_.play();
    }
  }

  dispose() {
    this.stopTracking();
    super.dispose();
  }
}

Component.registerComponent('LiveTracker', LiveTracker);
export default LiveTracker;
