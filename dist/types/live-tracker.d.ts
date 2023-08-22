export default LiveTracker;
/**
 * A class for checking live current time and determining when the player
 * is at or behind the live edge.
 */
declare class LiveTracker extends Component {
    /**
     * Creates an instance of this class.
     *
     * @param { import('./player').default } player
     *        The `Player` that this class should be attached to.
     *
     * @param {Object} [options]
     *        The key/value store of player options.
     *
     * @param {number} [options.trackingThreshold=20]
     *        Number of seconds of live window (seekableEnd - seekableStart) that
     *        media needs to have before the liveui will be shown.
     *
     * @param {number} [options.liveTolerance=15]
     *        Number of seconds behind live that we have to be
     *        before we will be considered non-live. Note that this will only
     *        be used when playing at the live edge. This allows large seekable end
     *        changes to not effect whether we are live or not.
     */
    constructor(player: import('./player').default, options?: {
        trackingThreshold?: number;
        liveTolerance?: number;
    });
    trackLiveHandler_: () => void;
    handlePlay_: (e: any) => void;
    handleFirstTimeupdate_: (e: any) => void;
    handleSeeked_: (e: any) => void;
    seekToLiveEdge_: (e: any) => void;
    /**
     * all the functionality for tracking when seek end changes
     * and for tracking how far past seek end we should be
     */
    trackLive_(): void;
    lastTime_: number;
    pastSeekEnd_: number;
    behindLiveEdge_: any;
    /**
     * handle a durationchange event on the player
     * and start/stop tracking accordingly.
     */
    handleDurationchange(): void;
    /**
     * start/stop tracking
     */
    toggleTracking(): void;
    /**
     * start tracking live playback
     */
    startTracking(): void;
    timeupdateSeen_: any;
    trackingInterval_: number;
    /**
     * handle the first timeupdate on the player if it wasn't already playing
     * when live tracker started tracking.
     */
    handleFirstTimeupdate(): void;
    /**
     * Keep track of what time a seek starts, and listen for seeked
     * to find where a seek ends.
     */
    handleSeeked(): void;
    seekedBehindLive_: boolean;
    nextSeekedFromUser_: boolean;
    /**
     * handle the first play on the player, and make sure that we seek
     * right to the live edge.
     */
    handlePlay(): void;
    /**
     * Stop tracking, and set all internal variables to
     * their initial value.
     */
    reset_(): void;
    lastSeekEnd_: any;
    /**
     * The next seeked event is from the user. Meaning that any seek
     * > 2s behind live will be considered behind live for real and
     * liveTolerance will be ignored.
     */
    nextSeekedFromUser(): void;
    /**
     * stop tracking live playback
     */
    stopTracking(): void;
    /**
     * A helper to get the player seekable end
     * so that we don't have to null check everywhere
     *
     * @return {number}
     *         The furthest seekable end or Infinity.
     */
    seekableEnd(): number;
    /**
     * A helper to get the player seekable start
     * so that we don't have to null check everywhere
     *
     * @return {number}
     *         The earliest seekable start or 0.
     */
    seekableStart(): number;
    /**
     * Get the live time window aka
     * the amount of time between seekable start and
     * live current time.
     *
     * @return {number}
     *         The amount of seconds that are seekable in
     *         the live video.
     */
    liveWindow(): number;
    /**
     * Determines if the player is live, only checks if this component
     * is tracking live playback or not
     *
     * @return {boolean}
     *         Whether liveTracker is tracking
     */
    isLive(): boolean;
    /**
     * Determines if currentTime is at the live edge and won't fall behind
     * on each seekableendchange
     *
     * @return {boolean}
     *         Whether playback is at the live edge
     */
    atLiveEdge(): boolean;
    /**
     * get what we expect the live current time to be
     *
     * @return {number}
     *         The expected live current time
     */
    liveCurrentTime(): number;
    /**
     * The number of seconds that have occurred after seekable end
     * changed. This will be reset to 0 once seekable end changes.
     *
     * @return {number}
     *         Seconds past the current seekable end
     */
    pastSeekEnd(): number;
    /**
     * If we are currently behind the live edge, aka currentTime will be
     * behind on a seekableendchange
     *
     * @return {boolean}
     *         If we are behind the live edge
     */
    behindLiveEdge(): boolean;
    /**
     * Whether live tracker is currently tracking or not.
     */
    isTracking(): boolean;
    /**
     * Seek to the live edge if we are behind the live edge
     */
    seekToLiveEdge(): void;
    /**
     * Dispose of liveTracker
     */
    dispose(): void;
}
import Component from "./component.js";
//# sourceMappingURL=live-tracker.d.ts.map