export default Tech;
/**
 * ~SourceObject
 */
export type Tech = any | string;
/**
 * This is the base class for media playback technology controllers, such as
 * {@link HTML5}
 *
 * @extends Component
 */
declare class Tech extends Component {
    /**
     * Check if the type is supported by this tech.
     *
     * The base tech does not support any type, but source handlers might
     * overwrite this.
     *
     * @param {string} _type
     *        The media type to check
     * @return {string} Returns the native video element's response
     */
    static canPlayType(_type: string): string;
    /**
     * Check if the tech can support the given source
     *
     * @param {Object} srcObj
     *        The source object
     * @param {Object} options
     *        The options passed to the tech
     * @return {string} 'probably', 'maybe', or '' (empty string)
     */
    static canPlaySource(srcObj: any, options: any): string;
    static isTech(component: any): boolean;
    /**
     * Registers a `Tech` into a shared list for videojs.
     *
     * @param {string} name
     *        Name of the `Tech` to register.
     *
     * @param {Object} tech
     *        The `Tech` class to register.
     */
    static registerTech(name: string, tech: any): any;
    /**
     * Get a `Tech` from the shared list by name.
     *
     * @param {string} name
     *        `camelCase` or `TitleCase` name of the Tech to get
     *
     * @return {Tech|undefined}
     *         The `Tech` or undefined if there was no tech with the name requested.
     */
    static getTech(name: string): Tech | undefined;
    /**
    * Create an instance of this Tech.
    *
    * @param {Object} [options]
    *        The key/value store of player options.
    *
    * @param {Function} [ready]
    *        Callback function to call when the `HTML5` Tech is ready.
    */
    constructor(options?: any, ready?: Function);
    onDurationChange_: (e: any) => void;
    trackProgress_: (e: any) => void;
    trackCurrentTime_: (e: any) => void;
    stopTrackingCurrentTime_: (e: any) => void;
    disposeSourceHandler_: (e: any) => any;
    queuedHanders_: Set<any>;
    hasStarted_: boolean;
    featuresNativeTextTracks: boolean;
    preloadTextTracks: boolean;
    autoRemoteTextTracks_: import("../tracks/text-track-list").default;
    /**
     * A special function to trigger source set in a way that will allow player
     * to re-trigger if the player or tech are not ready yet.
     *
     * @fires Tech#sourceset
     * @param {string} src The source string at the time of the source changing.
     */
    triggerSourceset(src: string): void;
    /**
     * Polyfill the `progress` event for browsers that don't support it natively.
     *
     * @see {@link Tech#trackProgress}
     */
    manualProgressOn(): void;
    manualProgress: boolean;
    /**
     * Turn off the polyfill for `progress` events that was created in
     * {@link Tech#manualProgressOn}
     */
    manualProgressOff(): void;
    /**
     * This is used to trigger a `progress` event when the buffered percent changes. It
     * sets an interval function that will be called every 500 milliseconds to check if the
     * buffer end percent has changed.
     *
     * > This function is called by {@link Tech#manualProgressOn}
     *
     * @param {Event} event
     *        The `ready` event that caused this to run.
     *
     * @listens Tech#ready
     * @fires Tech#progress
     */
    trackProgress(event: Event): void;
    progressInterval: number;
    /**
     * Update our internal duration on a `durationchange` event by calling
     * {@link Tech#duration}.
     *
     * @param {Event} event
     *        The `durationchange` event that caused this to run.
     *
     * @listens Tech#durationchange
     */
    onDurationChange(event: Event): void;
    duration_: any;
    /**
     * Get and create a `TimeRange` object for buffering.
     *
     * @return { import('../utils/time').TimeRange }
     *         The time range object that was created.
     */
    buffered(): import('../utils/time').TimeRange;
    /**
     * Get the percentage of the current video that is currently buffered.
     *
     * @return {number}
     *         A number from 0 to 1 that represents the decimal percentage of the
     *         video that is buffered.
     *
     */
    bufferedPercent(): number;
    /**
     * Turn off the polyfill for `progress` events that was created in
     * {@link Tech#manualProgressOn}
     * Stop manually tracking progress events by clearing the interval that was set in
     * {@link Tech#trackProgress}.
     */
    stopTrackingProgress(): void;
    /**
     * Polyfill the `timeupdate` event for browsers that don't support it.
     *
     * @see {@link Tech#trackCurrentTime}
     */
    manualTimeUpdatesOn(): void;
    manualTimeUpdates: boolean;
    /**
     * Turn off the polyfill for `timeupdate` events that was created in
     * {@link Tech#manualTimeUpdatesOn}
     */
    manualTimeUpdatesOff(): void;
    /**
     * Sets up an interval function to track current time and trigger `timeupdate` every
     * 250 milliseconds.
     *
     * @listens Tech#play
     * @triggers Tech#timeupdate
     */
    trackCurrentTime(): void;
    currentTimeInterval: number;
    /**
     * Stop the interval function created in {@link Tech#trackCurrentTime} so that the
     * `timeupdate` event is no longer triggered.
     *
     * @listens {Tech#pause}
     */
    stopTrackingCurrentTime(): void;
    /**
     * Turn off all event polyfills, clear the `Tech`s {@link AudioTrackList},
     * {@link VideoTrackList}, and {@link TextTrackList}, and dispose of this Tech.
     *
     * @fires Component#dispose
     */
    dispose(): void;
    /**
     * Clear out a single `TrackList` or an array of `TrackLists` given their names.
     *
     * > Note: Techs without source handlers should call this between sources for `video`
     *         & `audio` tracks. You don't want to use them between tracks!
     *
     * @param {string[]|string} types
     *        TrackList names to clear, valid names are `video`, `audio`, and
     *        `text`.
     */
    clearTracks(types: string[] | string): void;
    /**
     * Remove any TextTracks added via addRemoteTextTrack that are
     * flagged for automatic garbage collection
     */
    cleanupAutoTextTracks(): void;
    /**
     * Reset the tech, which will removes all sources and reset the internal readyState.
     *
     * @abstract
     */
    reset(): void;
    /**
     * Get the value of `crossOrigin` from the tech.
     *
     * @abstract
     *
     * @see {Html5#crossOrigin}
     */
    crossOrigin(): void;
    /**
     * Set the value of `crossOrigin` on the tech.
     *
     * @abstract
     *
     * @param {string} crossOrigin the crossOrigin value
     * @see {Html5#setCrossOrigin}
     */
    setCrossOrigin(): void;
    /**
     * Get or set an error on the Tech.
     *
     * @param {MediaError} [err]
     *        Error to set on the Tech
     *
     * @return {MediaError|null}
     *         The current error object on the tech, or null if there isn't one.
     */
    error(err?: MediaError): MediaError | null;
    error_: MediaError;
    /**
     * Returns the `TimeRange`s that have been played through for the current source.
     *
     * > NOTE: This implementation is incomplete. It does not track the played `TimeRange`.
     *         It only checks whether the source has played at all or not.
     *
     * @return {TimeRange}
     *         - A single time range if this video has played
     *         - An empty set of ranges if not.
     */
    played(): TimeRange;
    /**
     * Start playback
     *
     * @abstract
     *
     * @see {Html5#play}
     */
    play(): void;
    /**
     * Set whether we are scrubbing or not
     *
     * @abstract
     * @param {boolean} _isScrubbing
     *                  - true for we are currently scrubbing
     *                  - false for we are no longer scrubbing
     *
     * @see {Html5#setScrubbing}
     */
    setScrubbing(_isScrubbing: boolean): void;
    /**
     * Get whether we are scrubbing or not
     *
     * @abstract
     *
     * @see {Html5#scrubbing}
     */
    scrubbing(): void;
    /**
     * Causes a manual time update to occur if {@link Tech#manualTimeUpdatesOn} was
     * previously called.
     *
     * @param {number} _seconds
     *        Set the current time of the media to this.
     * @fires Tech#timeupdate
     */
    setCurrentTime(_seconds: number): void;
    /**
     * Turn on listeners for {@link VideoTrackList}, {@link {AudioTrackList}, and
     * {@link TextTrackList} events.
     *
     * This adds {@link EventTarget~EventListeners} for `addtrack`, and  `removetrack`.
     *
     * @fires Tech#audiotrackchange
     * @fires Tech#videotrackchange
     * @fires Tech#texttrackchange
     */
    initTrackListeners(): void;
    /**
     * Emulate TextTracks using vtt.js if necessary
     *
     * @fires Tech#vttjsloaded
     * @fires Tech#vttjserror
     */
    addWebVttScript_(): void;
    /**
     * Emulate texttracks
     *
     */
    emulateTextTracks(): void;
    /**
     * Create and returns a remote {@link TextTrack} object.
     *
     * @param {string} kind
     *        `TextTrack` kind (subtitles, captions, descriptions, chapters, or metadata)
     *
     * @param {string} [label]
     *        Label to identify the text track
     *
     * @param {string} [language]
     *        Two letter language abbreviation
     *
     * @return {TextTrack}
     *         The TextTrack that gets created.
     */
    addTextTrack(kind: string, label?: string, language?: string): TextTrack;
    /**
     * Create an emulated TextTrack for use by addRemoteTextTrack
     *
     * This is intended to be overridden by classes that inherit from
     * Tech in order to create native or custom TextTracks.
     *
     * @param {Object} options
     *        The object should contain the options to initialize the TextTrack with.
     *
     * @param {string} [options.kind]
     *        `TextTrack` kind (subtitles, captions, descriptions, chapters, or metadata).
     *
     * @param {string} [options.label].
     *        Label to identify the text track
     *
     * @param {string} [options.language]
     *        Two letter language abbreviation.
     *
     * @return {HTMLTrackElement}
     *         The track element that gets created.
     */
    createRemoteTextTrack(options: {
        kind?: string;
        label?: string;
        language?: string;
    }): HTMLTrackElement;
    /**
     * Creates a remote text track object and returns an html track element.
     *
     * > Note: This can be an emulated {@link HTMLTrackElement} or a native one.
     *
     * @param {Object} options
     *        See {@link Tech#createRemoteTextTrack} for more detailed properties.
     *
     * @param {boolean} [manualCleanup=false]
     *        - When false: the TextTrack will be automatically removed from the video
     *          element whenever the source changes
     *        - When True: The TextTrack will have to be cleaned up manually
     *
     * @return {HTMLTrackElement}
     *         An Html Track Element.
     *
     */
    addRemoteTextTrack(options?: any, manualCleanup?: boolean): HTMLTrackElement;
    /**
     * Remove a remote text track from the remote `TextTrackList`.
     *
     * @param {TextTrack} track
     *        `TextTrack` to remove from the `TextTrackList`
     */
    removeRemoteTextTrack(track: TextTrack): void;
    /**
     * Gets available media playback quality metrics as specified by the W3C's Media
     * Playback Quality API.
     *
     * @see [Spec]{@link https://wicg.github.io/media-playback-quality}
     *
     * @return {Object}
     *         An object with supported media playback quality metrics
     *
     * @abstract
     */
    getVideoPlaybackQuality(): any;
    /**
     * Attempt to create a floating video window always on top of other windows
     * so that users may continue consuming media while they interact with other
     * content sites, or applications on their device.
     *
     * @see [Spec]{@link https://wicg.github.io/picture-in-picture}
     *
     * @return {Promise|undefined}
     *         A promise with a Picture-in-Picture window if the browser supports
     *         Promises (or one was passed in as an option). It returns undefined
     *         otherwise.
     *
     * @abstract
     */
    requestPictureInPicture(): Promise<any> | undefined;
    /**
     * A method to check for the value of the 'disablePictureInPicture' <video> property.
     * Defaults to true, as it should be considered disabled if the tech does not support pip
     *
     * @abstract
     */
    disablePictureInPicture(): boolean;
    /**
     * A method to set or unset the 'disablePictureInPicture' <video> property.
     *
     * @abstract
     */
    setDisablePictureInPicture(): void;
    /**
     * A fallback implementation of requestVideoFrameCallback using requestAnimationFrame
     *
     * @param {function} cb
     * @return {number} request id
     */
    requestVideoFrameCallback(cb: Function): number;
    /**
     * A fallback implementation of cancelVideoFrameCallback
     *
     * @param {number} id id of callback to be cancelled
     */
    cancelVideoFrameCallback(id: number): void;
    /**
     * A method to set a poster from a `Tech`.
     *
     * @abstract
     */
    setPoster(): void;
    /**
     * A method to check for the presence of the 'playsinline' <video> attribute.
     *
     * @abstract
     */
    playsinline(): void;
    /**
     * A method to set or unset the 'playsinline' <video> attribute.
     *
     * @abstract
     */
    setPlaysinline(): void;
    /**
     * Attempt to force override of native audio tracks.
     *
     * @param {boolean} override - If set to true native audio will be overridden,
     * otherwise native audio will potentially be used.
     *
     * @abstract
     */
    overrideNativeAudioTracks(override: boolean): void;
    /**
     * Attempt to force override of native video tracks.
     *
     * @param {boolean} override - If set to true native video will be overridden,
     * otherwise native video will potentially be used.
     *
     * @abstract
     */
    overrideNativeVideoTracks(override: boolean): void;
    /**
     * Check if the tech can support the given mime-type.
     *
     * The base tech does not support any type, but source handlers might
     * overwrite this.
     *
     * @param  {string} _type
     *         The mimetype to check for support
     *
     * @return {string}
     *         'probably', 'maybe', or empty string
     *
     * @see [Spec]{@link https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/canPlayType}
     *
     * @abstract
     */
    canPlayType(_type: string): string;
    /**
     * List of associated text tracks
     *
     * @type {TextTrackList}
     * @private
     * @property Tech#textTracks_
     */
    /**
     * List of associated audio tracks.
     *
     * @type {AudioTrackList}
     * @private
     * @property Tech#audioTracks_
     */
    /**
     * List of associated video tracks.
     *
     * @type {VideoTrackList}
     * @private
     * @property Tech#videoTracks_
     */
    /**
     * Boolean indicating whether the `Tech` supports volume control.
     *
     * @type {boolean}
     * @default
     */
    featuresVolumeControl: boolean;
    /**
     * Boolean indicating whether the `Tech` supports muting volume.
     *
     * @type {boolean}
     * @default
     */
    featuresMuteControl: boolean;
    /**
     * Boolean indicating whether the `Tech` supports fullscreen resize control.
     * Resizing plugins using request fullscreen reloads the plugin
     *
     * @type {boolean}
     * @default
     */
    featuresFullscreenResize: boolean;
    /**
     * Boolean indicating whether the `Tech` supports changing the speed at which the video
     * plays. Examples:
     *   - Set player to play 2x (twice) as fast
     *   - Set player to play 0.5x (half) as fast
     *
     * @type {boolean}
     * @default
     */
    featuresPlaybackRate: boolean;
    /**
     * Boolean indicating whether the `Tech` supports the `progress` event.
     * This will be used to determine if {@link Tech#manualProgressOn} should be called.
     *
     * @type {boolean}
     * @default
     */
    featuresProgressEvents: boolean;
    /**
     * Boolean indicating whether the `Tech` supports the `sourceset` event.
     *
     * A tech should set this to `true` and then use {@link Tech#triggerSourceset}
     * to trigger a {@link Tech#event:sourceset} at the earliest time after getting
     * a new source.
     *
     * @type {boolean}
     * @default
     */
    featuresSourceset: boolean;
    /**
     * Boolean indicating whether the `Tech` supports the `timeupdate` event.
     * This will be used to determine if {@link Tech#manualTimeUpdates} should be called.
     *
     * @type {boolean}
     * @default
     */
    featuresTimeupdateEvents: boolean;
    /**
     * Boolean indicating whether the `Tech` supports `requestVideoFrameCallback`.
     *
     * @type {boolean}
     * @default
     */
    featuresVideoFrameCallback: boolean;
}
declare namespace Tech {
    /**
     * A functional mixin for techs that want to use the Source Handler pattern.
     * Source handlers are scripts for handling specific formats.
     * The source handler pattern is used for adaptive formats (HLS, DASH) that
     * manually load video data and feed it into a Source Buffer (Media Source Extensions)
     * Example: `Tech.withSourceHandlers.call(MyTech);`
     *
     * @param {Tech} _Tech
     *        The tech to add source handler functions to.
     *
     * @mixes Tech~SourceHandlerAdditions
     */
    function withSourceHandlers(_Tech: Tech): void;
    const defaultTechOrder_: any[];
}
import Component from "../component";
import MediaError from "../media-error.js";
//# sourceMappingURL=tech.d.ts.map