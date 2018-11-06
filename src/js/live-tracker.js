import Component from './component.js';

/* track when we are at the live edge, and other helpers for live playback */
class LiveTracker extends Component {

  constructor(player, options, ready) {
    super(player, options, ready);

    this.on(this.player_, 'durationchange', this.handleDurationchange);
  }

  isBehind() {
    const liveCurrentTime = this.liveCurrentTime();
    const currentTime = this.player_.currentTime();
    const segmentLength = this.segmentLength_ || 12;

    // the live edge window is the amount of seconds away from live
    // that a player can be, but still be considered live.
    // we add 0.07 because the live tracking happens every 30ms
    // and we want some wiggle room for short segment live playback
    const liveEdgeWindow = segmentLength + 0.07;

    return liveCurrentTime !== Infinity && (liveCurrentTime - liveEdgeWindow) >= currentTime;
  }

  // all the functionality for tracking when seek end changes
  // and for tracking how far past seek end we should be
  trackLive_() {
    this.pastSeekEnd_ = this.pastSeekEnd_ || 0;
    const seekable = this.player_.seekable();

    // skip undefined seekable
    if (!seekable || !seekable.length) {
      return;
    }

    const newSeekEnd = seekable.end(0);

    // we can only tell if we are behing live, when seekable changes
    // once we detect that seekable has changed we check the new seek
    // end against current time, with a fudge value of half a second.
    if (newSeekEnd !== this.lastSeekEnd_) {
      if (this.lastSeekEnd_) {
        this.segmentLength_ = newSeekEnd - this.lastSeekEnd_;
      }

      this.pastSeekEnd_ = 0;
      this.lastSeekEnd_ = newSeekEnd;
      this.trigger('seek-end-change');
    }

    this.pastSeekEnd_ = this.pastSeekEnd() + 0.03;

    if (this.isBehind() !== this.behindLiveEdge()) {
      this.behindLiveEdge_ = this.isBehind();
      this.trigger('live-edge-change');
    }
  }

  /**
   * handle a durationchange event on the player
   * and start/stop tracking accordingly.
   */
  handleDurationchange() {
    if (this.player_.duration() === Infinity) {
      this.start();
    } else {
      this.stop();
    }
  }

  /**
   * start tracking live playback
   */
  start() {
    if (this.started()) {
      return;
    }

    this.trackingInterval_ = this.setInterval(this.trackLive_, 30);
    this.trackLive_();
  }

  /**
   * stop tracking live playback
   */
  stop() {
    if (!this.started()) {
      return;
    }
    this.pastSeekEnd_ = 0;
    this.lastSeekEnd_ = null;
    this.behindLiveEdge_ = null;

    this.clearInterval(this.trackingInterval_);
    this.trackingInterval_ = null;
  }

  /**
   * A helper to get the player seekable end
   * so that we don't have to null check everywhere
   */
  seekEnd() {
    const seekable = this.player_.seekable();

    if (!seekable || !seekable.length) {
      return Infinity;
    }

    return seekable.end(0);
  }

  /**
   * A helper to get the player seekable start
   * so that we don't have to null check everywhere
   */
  seekStart() {
    const seekable = this.player_.seekable();

    if (!seekable || !seekable.length) {
      return 0;
    }

    return seekable.start(0);
  }

  /**
   * Get the live time window
   */
  liveTimeWindow() {
    const seekable = this.player_.seekable();

    if (!seekable || !seekable.length) {
      return 0;
    }

    return seekable.end(0) - seekable.start(0);
  }

  /**
   * Determines if the player is live, only checks wether this component
   * is tracking live playback or not
   */
  isLive() {
    return this.started();
  }

  /**
   * Determines if currentTime is at the live edge and won't fall behind
   * on each seek-end-change
   */
  atLiveEdge() {
    return !this.behindLiveEdge();
  }

  /**
   * get what we expect the live current time to be
   */
  liveCurrentTime() {
    return this.pastSeekEnd() + this.seekEnd();
  }

  /**
   * Returns how far past seek end we expect current time to be
   */
  pastSeekEnd() {
    return this.pastSeekEnd_ || 0;
  }

  /**
   * If we are currently behind the live edge, aka currentTime will be
   * behind on a seek-end-change
   */
  behindLiveEdge() {
    return this.behindLiveEdge_;
  }

  started() {
    return typeof this.trackingInterval_ === 'number';
  }

  /**
   * Seek to the live edge if we are behind the live edge
   */
  seekToLiveEdge() {
    if (this.atLiveEdge()) {
      return;
    }

    this.player().pause();
    this.player().addClass('vjs-waiting');
    this.one('seek-end-change', () => {
      this.player().removeClass('vjs-waiting');
      this.player().currentTime(this.seekEnd());
      this.player().play();
    });
  }
}

Component.registerComponent('LiveTracker', LiveTracker);
export default LiveTracker;
