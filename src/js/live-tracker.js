import Component from './component.js';
import mergeOptions from './utils/merge-options.js';
import document from 'global/document';
import * as browser from './utils/browser.js';
import window from 'global/window';
import * as Fn from './utils/fn.js';

const defaults = {
  // Number of seconds of live window (seekableEnd - seekableStart) that
  // a video needs to have before the liveui will be shown.
  trackingThreshold: 30
};

/* track when we are at the live edge, and other helpers for live playback */
class LiveTracker extends Component {

  constructor(player, options) {
    // LiveTracker does not need an element
    const options_ = mergeOptions(defaults, options, {createEl: false});

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

  // all the functionality for tracking when seek end changes
  // and for tracking how far past seek end we should be
  trackLive_() {
    const seekable = this.player_.seekable();

    // skip undefined seekable
    if (!seekable || !seekable.length) {
      return;
    }

    const newTime = window.performance.now().toFixed(4);
    const deltaTime = !this.lastTime_ ? 0 : (newTime - this.lastTime_) / 1000;

    this.lastTime_ = newTime;

    this.pastSeekEnd_ = this.pastSeekEnd() + deltaTime;

    const liveCurrentTime = this.liveCurrentTime();
    const currentTime = this.player_.currentTime();
    // we are behind live if the difference between live and current time
    // is greater liveTolerance which defaults to 15s
    let isBehind = Math.abs(liveCurrentTime - currentTime) > this.options_.liveTolerance;

    // we cannot be behind if
    // 1. until we have not seen a timeupdate yet
    // 2. liveCurrentTime is Infinity, which happens on Android
    if (!this.timeupdateSeen_ || liveCurrentTime === Infinity) {
      isBehind = false;
    }

    if (isBehind !== this.behindLiveEdge_) {
      this.behindLiveEdge_ = isBehind;
      this.trigger('liveedgechange');
    }
  }

  /**
   * handle a durationchange event on the player
   * and start/stop tracking accordingly.
   */
  handleDurationchange() {
    if (this.player_.duration() === Infinity && this.liveWindow() >= this.options_.trackingThreshold) {
      if (this.player_.options_.liveui) {
        this.player_.addClass('vjs-liveui');
      }
      this.startTracking();
    } else {
      this.player_.removeClass('vjs-liveui');
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
    this.lastTime_ = null;
    this.pastSeekEnd_ = 0;
    this.lastSeekEnd_ = null;
    this.behindLiveEdge_ = true;
    this.timeupdateSeen_ = false;

    this.clearInterval(this.trackingInterval_);
    this.trackingInterval_ = null;

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
    this.trigger('liveedgechange');
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
    const seekableEnd = this.seekableEnd();

    if (typeof this.lastSeekEnd_ === 'number' && seekableEnd !== this.lastSeekEnd_) {
      this.pastSeekEnd_ = 0;
    }
    this.lastSeekEnd_ = seekableEnd;
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
