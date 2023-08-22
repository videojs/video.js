export default Player;
/**
 * An instance of the `Player` class is created when any of the Video.js setup methods
 * are used to initialize a video.
 *
 * After an instance has been created it can be accessed globally in three ways:
 * 1. By calling `videojs.getPlayer('example_video_1');`
 * 2. By calling `videojs('example_video_1');` (not recomended)
 * 2. By using it directly via  `videojs.players.example_video_1;`
 *
 * @extends Component
 * @global
 */
declare class Player extends Component {
    /**
     * Gets tag settings
     *
     * @param {Element} tag
     *        The player tag
     *
     * @return {Object}
     *         An object containing all of the settings
     *         for a player tag
     */
    static getTagSettings(tag: Element): any;
    /**
     * Create an instance of this class.
     *
     * @param {Element} tag
     *        The original video DOM element used for configuring options.
     *
     * @param {Object} [options]
     *        Object of option names and values.
     *
     * @param {Function} [ready]
     *        Ready callback function.
     */
    constructor(tag: Element, options?: any, ready?: Function);
    boundDocumentFullscreenChange_: (e: any) => void;
    boundFullWindowOnEscKey_: (e: any) => void;
    boundUpdateStyleEl_: (e: any) => void;
    boundApplyInitTime_: (e: any) => void;
    boundUpdateCurrentBreakpoint_: (e: any) => void;
    boundHandleTechClick_: (e: any) => void;
    boundHandleTechDoubleClick_: (e: any) => void;
    boundHandleTechTouchStart_: (e: any) => void;
    boundHandleTechTouchMove_: (e: any) => void;
    boundHandleTechTouchEnd_: (e: any) => void;
    boundHandleTechTap_: (e: any) => void;
    isFullscreen_: boolean;
    log: any;
    fsApi_: any;
    isPosterFromTech_: boolean;
    queuedCallbacks_: any[];
    hasStarted_: boolean;
    userActive_: boolean;
    debugEnabled_: boolean;
    audioOnlyMode_: boolean;
    audioPosterMode_: boolean;
    audioOnlyCache_: {
        playerHeight: any;
        hiddenChildren: any[];
    };
    tag: Element;
    tagAttributes: any;
    languages_: {};
    /** @type string */
    poster_: string;
    /** @type {boolean} */
    controls_: boolean;
    changingSrc_: boolean;
    playCallbacks_: any[];
    playTerminatedQueue_: any[];
    scrubbing_: boolean;
    el_: Element;
    middleware_: any[];
    /**
     * Destroys the video player and does any necessary cleanup.
     *
     * This is especially helpful if you are dynamically adding and removing videos
     * to/from the DOM.
     *
     * @fires Player#dispose
     */
    dispose(): void;
    styleEl_: Element;
    playerElIngest_: any;
    /**
     * Create the `Player`'s DOM element.
     *
     * @return {Element}
     *         The DOM element that gets created.
     */
    createEl(): Element;
    fill_: boolean;
    fluid_: boolean;
    /**
     * Get or set the `Player`'s crossOrigin option. For the HTML5 player, this
     * sets the `crossOrigin` property on the `<video>` tag to control the CORS
     * behavior.
     *
     * @see [Video Element Attributes]{@link https://developer.mozilla.org/en-US/docs/Web/HTML/Element/video#attr-crossorigin}
     *
     * @param {string|null} [value]
     *        The value to set the `Player`'s crossOrigin to. If an argument is
     *        given, must be one of `'anonymous'` or `'use-credentials'`, or 'null'.
     *
     * @return {string|null|undefined}
     *         - The current crossOrigin value of the `Player` when getting.
     *         - undefined when setting
     */
    crossOrigin(value?: string | null): string | null | undefined;
    /**
     * A getter/setter for the `Player`'s width. Returns the player's configured value.
     * To get the current width use `currentWidth()`.
     *
     * @param {number|string} [value]
     *        CSS value to set the `Player`'s width to.
     *
     * @return {number|undefined}
     *         - The current width of the `Player` when getting.
     *         - Nothing when setting
     */
    width(value?: number | string): number | undefined;
    /**
     * A getter/setter for the `Player`'s height. Returns the player's configured value.
     * To get the current height use `currentheight()`.
     *
     * @param {number|string} [value]
     *        CSS value to set the `Player`'s height to.
     *
     * @return {number|undefined}
     *         - The current height of the `Player` when getting.
     *         - Nothing when setting
     */
    height(value?: number | string): number | undefined;
    /**
     * A getter/setter for the `Player`'s width & height.
     *
     * @param {string} dimension
     *        This string can be:
     *        - 'width'
     *        - 'height'
     *
     * @param {number|string} [value]
     *        Value for dimension specified in the first argument.
     *
     * @return {number}
     *         The dimension arguments value when getting (width/height).
     */
    dimension(dimension: string, value?: number | string): number;
    /**
     * A getter/setter/toggler for the vjs-fluid `className` on the `Player`.
     *
     * Turning this on will turn off fill mode.
     *
     * @param {boolean} [bool]
     *        - A value of true adds the class.
     *        - A value of false removes the class.
     *        - No value will be a getter.
     *
     * @return {boolean|undefined}
     *         - The value of fluid when getting.
     *         - `undefined` when setting.
     */
    fluid(bool?: boolean): boolean | undefined;
    /**
     * A getter/setter/toggler for the vjs-fill `className` on the `Player`.
     *
     * Turning this on will turn off fluid mode.
     *
     * @param {boolean} [bool]
     *        - A value of true adds the class.
     *        - A value of false removes the class.
     *        - No value will be a getter.
     *
     * @return {boolean|undefined}
     *         - The value of fluid when getting.
     *         - `undefined` when setting.
     */
    fill(bool?: boolean): boolean | undefined;
    /**
     * Get/Set the aspect ratio
     *
     * @param {string} [ratio]
     *        Aspect ratio for player
     *
     * @return {string|undefined}
     *         returns the current aspect ratio when getting
     */
    /**
     * A getter/setter for the `Player`'s aspect ratio.
     *
     * @param {string} [ratio]
     *        The value to set the `Player`'s aspect ratio to.
     *
     * @return {string|undefined}
     *         - The current aspect ratio of the `Player` when getting.
     *         - undefined when setting
     */
    aspectRatio(ratio?: string): string | undefined;
    aspectRatio_: string;
    /**
     * Update styles of the `Player` element (height, width and aspect ratio).
     *
     * @private
     * @listens Tech#loadedmetadata
     */
    private updateStyleEl_;
    /**
     * Load/Create an instance of playback {@link Tech} including element
     * and API methods. Then append the `Tech` element in `Player` as a child.
     *
     * @param {string} techName
     *        name of the playback technology
     *
     * @param {string} source
     *        video source
     *
     * @private
     */
    private loadTech_;
    techName_: string;
    tech_: any;
    /**
     * Unload and dispose of the current playback {@link Tech}.
     *
     * @private
     */
    private unloadTech_;
    textTracksJson_: any[];
    /**
     * Return a reference to the current {@link Tech}.
     * It will print a warning by default about the danger of using the tech directly
     * but any argument that is passed in will silence the warning.
     *
     * @param {*} [safety]
     *        Anything passed in to silence the warning
     *
     * @return {Tech}
     *         The Tech
     */
    tech(safety?: any): Tech;
    /**
     * Set up click and touch listeners for the playback element
     *
     * - On desktops: a click on the video itself will toggle playback
     * - On mobile devices: a click on the video toggles controls
     *   which is done by toggling the user state between active and
     *   inactive
     * - A tap can signal that a user has become active or has become inactive
     *   e.g. a quick tap on an iPhone movie should reveal the controls. Another
     *   quick tap should hide them again (signaling the user is in an inactive
     *   viewing state)
     * - In addition to this, we still want the user to be considered inactive after
     *   a few seconds of inactivity.
     *
     * > Note: the only part of iOS interaction we can't mimic with this setup
     * is a touch and hold on the video element counting as activity in order to
     * keep the controls showing, but that shouldn't be an issue. A touch and hold
     * on any controls will still keep the user active
     *
     * @private
     */
    private addTechControlsListeners_;
    /**
     * Remove the listeners used for click and tap controls. This is needed for
     * toggling to controls disabled, where a tap/touch should do nothing.
     *
     * @private
     */
    private removeTechControlsListeners_;
    /**
     * Player waits for the tech to be ready
     *
     * @private
     */
    private handleTechReady_;
    /**
     * Retrigger the `loadstart` event that was triggered by the {@link Tech}.
     *
     * @fires Player#loadstart
     * @listens Tech#loadstart
     * @private
     */
    private handleTechLoadStart_;
    /**
     * Handle autoplay string values, rather than the typical boolean
     * values that should be handled by the tech. Note that this is not
     * part of any specification. Valid values and what they do can be
     * found on the autoplay getter at Player#autoplay()
     */
    manualAutoplay_(type: any): Promise<void>;
    /**
     * Update the internal source caches so that we return the correct source from
     * `src()`, `currentSource()`, and `currentSources()`.
     *
     * > Note: `currentSources` will not be updated if the source that is passed in exists
     *         in the current `currentSources` cache.
     *
     *
     * @param {Tech~SourceObject} srcObj
     *        A string or object source to update our caches to.
     */
    updateSourceCaches_(srcObj?: string): void;
    /**
     * *EXPERIMENTAL* Fired when the source is set or changed on the {@link Tech}
     * causing the media element to reload.
     *
     * It will fire for the initial source and each subsequent source.
     * This event is a custom event from Video.js and is triggered by the {@link Tech}.
     *
     * The event object for this event contains a `src` property that will contain the source
     * that was available when the event was triggered. This is generally only necessary if Video.js
     * is switching techs while the source was being changed.
     *
     * It is also fired when `load` is called on the player (or media element)
     * because the {@link https://html.spec.whatwg.org/multipage/media.html#dom-media-load|specification for `load`}
     * says that the resource selection algorithm needs to be aborted and restarted.
     * In this case, it is very likely that the `src` property will be set to the
     * empty string `""` to indicate we do not know what the source will be but
     * that it is changing.
     *
     * *This event is currently still experimental and may change in minor releases.*
     * __To use this, pass `enableSourceset` option to the player.__
     *
     * @event Player#sourceset
     * @type {Event}
     * @prop {string} src
     *                The source url available when the `sourceset` was triggered.
     *                It will be an empty string if we cannot know what the source is
     *                but know that the source will change.
     */
    /**
     * Retrigger the `sourceset` event that was triggered by the {@link Tech}.
     *
     * @fires Player#sourceset
     * @listens Tech#sourceset
     * @private
     */
    private handleTechSourceset_;
    lastSource_: {
        player: any;
        tech: any;
    };
    /**
     * Add/remove the vjs-has-started class
     *
     *
     * @param {boolean} request
     *        - true: adds the class
     *        - false: remove the class
     *
     * @return {boolean}
     *         the boolean value of hasStarted_
     */
    hasStarted(request: boolean): boolean;
    /**
     * Fired whenever the media begins or resumes playback
     *
     * @see [Spec]{@link https://html.spec.whatwg.org/multipage/embedded-content.html#dom-media-play}
     * @fires Player#play
     * @listens Tech#play
     * @private
     */
    private handleTechPlay_;
    /**
     * Retrigger the `ratechange` event that was triggered by the {@link Tech}.
     *
     * If there were any events queued while the playback rate was zero, fire
     * those events now.
     *
     * @private
     * @method Player#handleTechRateChange_
     * @fires Player#ratechange
     * @listens Tech#ratechange
     */
    private handleTechRateChange_;
    /**
     * Retrigger the `waiting` event that was triggered by the {@link Tech}.
     *
     * @fires Player#waiting
     * @listens Tech#waiting
     * @private
     */
    private handleTechWaiting_;
    /**
     * Retrigger the `canplay` event that was triggered by the {@link Tech}.
     * > Note: This is not consistent between browsers. See #1351
     *
     * @fires Player#canplay
     * @listens Tech#canplay
     * @private
     */
    private handleTechCanPlay_;
    /**
     * Retrigger the `canplaythrough` event that was triggered by the {@link Tech}.
     *
     * @fires Player#canplaythrough
     * @listens Tech#canplaythrough
     * @private
     */
    private handleTechCanPlayThrough_;
    /**
     * Retrigger the `playing` event that was triggered by the {@link Tech}.
     *
     * @fires Player#playing
     * @listens Tech#playing
     * @private
     */
    private handleTechPlaying_;
    /**
     * Retrigger the `seeking` event that was triggered by the {@link Tech}.
     *
     * @fires Player#seeking
     * @listens Tech#seeking
     * @private
     */
    private handleTechSeeking_;
    /**
     * Retrigger the `seeked` event that was triggered by the {@link Tech}.
     *
     * @fires Player#seeked
     * @listens Tech#seeked
     * @private
     */
    private handleTechSeeked_;
    /**
     * Retrigger the `pause` event that was triggered by the {@link Tech}.
     *
     * @fires Player#pause
     * @listens Tech#pause
     * @private
     */
    private handleTechPause_;
    /**
     * Retrigger the `ended` event that was triggered by the {@link Tech}.
     *
     * @fires Player#ended
     * @listens Tech#ended
     * @private
     */
    private handleTechEnded_;
    /**
     * Fired when the duration of the media resource is first known or changed
     *
     * @listens Tech#durationchange
     * @private
     */
    private handleTechDurationChange_;
    /**
     * Handle a click on the media element to play/pause
     *
     * @param {Event} event
     *        the event that caused this function to trigger
     *
     * @listens Tech#click
     * @private
     */
    private handleTechClick_;
    /**
     * Handle a double-click on the media element to enter/exit fullscreen
     *
     * @param {Event} event
     *        the event that caused this function to trigger
     *
     * @listens Tech#dblclick
     * @private
     */
    private handleTechDoubleClick_;
    /**
     * Handle a tap on the media element. It will toggle the user
     * activity state, which hides and shows the controls.
     *
     * @listens Tech#tap
     * @private
     */
    private handleTechTap_;
    /**
     * Handle touch to start
     *
     * @listens Tech#touchstart
     * @private
     */
    private handleTechTouchStart_;
    userWasActive: boolean;
    /**
     * Handle touch to move
     *
     * @listens Tech#touchmove
     * @private
     */
    private handleTechTouchMove_;
    /**
     * Handle touch to end
     *
     * @param {Event} event
     *        the touchend event that triggered
     *        this function
     *
     * @listens Tech#touchend
     * @private
     */
    private handleTechTouchEnd_;
    /**
     * @private
     */
    private toggleFullscreenClass_;
    /**
     * when the document fschange event triggers it calls this
     */
    documentFullscreenChange_(e: any): void;
    /**
     * Handle Tech Fullscreen Change
     *
     * @param {Event} event
     *        the fullscreenchange event that triggered this function
     *
     * @param {Object} data
     *        the data that was sent with the event
     *
     * @private
     * @listens Tech#fullscreenchange
     * @fires Player#fullscreenchange
     */
    private handleTechFullscreenChange_;
    handleTechFullscreenError_(event: any, err: any): void;
    /**
     * @private
     */
    private togglePictureInPictureClass_;
    /**
     * Handle Tech Enter Picture-in-Picture.
     *
     * @param {Event} event
     *        the enterpictureinpicture event that triggered this function
     *
     * @private
     * @listens Tech#enterpictureinpicture
     */
    private handleTechEnterPictureInPicture_;
    /**
     * Handle Tech Leave Picture-in-Picture.
     *
     * @param {Event} event
     *        the leavepictureinpicture event that triggered this function
     *
     * @private
     * @listens Tech#leavepictureinpicture
     */
    private handleTechLeavePictureInPicture_;
    /**
     * Fires when an error occurred during the loading of an audio/video.
     *
     * @private
     * @listens Tech#error
     */
    private handleTechError_;
    /**
     * Retrigger the `textdata` event that was triggered by the {@link Tech}.
     *
     * @fires Player#textdata
     * @listens Tech#textdata
     * @private
     */
    private handleTechTextData_;
    /**
     * Get object for cached values.
     *
     * @return {Object}
     *         get the current object cache
     */
    getCache(): any;
    /**
     * Resets the internal cache object.
     *
     * Using this function outside the player constructor or reset method may
     * have unintended side-effects.
     *
     * @private
     */
    private resetCache_;
    cache_: {
        currentTime: number;
        initTime: number;
        inactivityTimeout: number;
        duration: number;
        lastVolume: number;
        lastPlaybackRate: number;
        media: any;
        src: string;
        source: {};
        sources: any[];
        playbackRates: any[];
        volume: number;
    };
    /**
     * Pass values to the playback tech
     *
     * @param {string} [method]
     *        the method to call
     *
     * @param {Object} [arg]
     *        the argument to pass
     *
     * @private
     */
    private techCall_;
    /**
     * Mediate attempt to call playback tech method
     * and return the value of the method called.
     *
     * @param {string} method
     *        Tech method
     *
     * @return {*}
     *         Value returned by the tech method called, undefined if tech
     *         is not ready or tech method is not present
     *
     * @private
     */
    private techGet_;
    /**
     * Attempt to begin playback at the first opportunity.
     *
     * @return {Promise|undefined}
     *         Returns a promise if the browser supports Promises (or one
     *         was passed in as an option). This promise will be resolved on
     *         the return value of play. If this is undefined it will fulfill the
     *         promise chain otherwise the promise chain will be fulfilled when
     *         the promise from play is fulfilled.
     */
    play(): Promise<any> | undefined;
    /**
     * The actual logic for play, takes a callback that will be resolved on the
     * return value of play. This allows us to resolve to the play promise if there
     * is one on modern browsers.
     *
     * @private
     * @param {Function} [callback]
     *        The callback that should be called when the techs play is actually called
     */
    private play_;
    waitToPlay_: (e: any) => void;
    /**
     * These functions will be run when if play is terminated. If play
     * runPlayCallbacks_ is run these function will not be run. This allows us
     * to differentiate between a terminated play and an actual call to play.
     */
    runPlayTerminatedQueue_(): void;
    /**
     * When a callback to play is delayed we have to run these
     * callbacks when play is actually called on the tech. This function
     * runs the callbacks that were delayed and accepts the return value
     * from the tech.
     *
     * @param {undefined|Promise} val
     *        The return value from the tech.
     */
    runPlayCallbacks_(val: undefined | Promise<any>): void;
    /**
     * Pause the video playback
     */
    pause(): void;
    /**
     * Check if the player is paused or has yet to play
     *
     * @return {boolean}
     *         - false: if the media is currently playing
     *         - true: if media is not currently playing
     */
    paused(): boolean;
    /**
     * Get a TimeRange object representing the current ranges of time that the user
     * has played.
     *
     * @return { import('./utils/time').TimeRange }
     *         A time range object that represents all the increments of time that have
     *         been played.
     */
    played(): import('./utils/time').TimeRange;
    /**
     * Sets or returns whether or not the user is "scrubbing". Scrubbing is
     * when the user has clicked the progress bar handle and is
     * dragging it along the progress bar.
     *
     * @param {boolean} [isScrubbing]
     *        whether the user is or is not scrubbing
     *
     * @return {boolean|undefined}
     *         - The value of scrubbing when getting
     *         - Nothing when setting
     */
    scrubbing(isScrubbing?: boolean): boolean | undefined;
    /**
     * Get or set the current time (in seconds)
     *
     * @param {number|string} [seconds]
     *        The time to seek to in seconds
     *
     * @return {number|undefined}
     *         - the current time in seconds when getting
     *         - Nothing when setting
     */
    currentTime(seconds?: number | string): number | undefined;
    /**
     * Apply the value of initTime stored in cache as currentTime.
     *
     * @private
     */
    private applyInitTime_;
    /**
     * Normally gets the length in time of the video in seconds;
     * in all but the rarest use cases an argument will NOT be passed to the method
     *
     * > **NOTE**: The video must have started loading before the duration can be
     * known, and depending on preload behaviour may not be known until the video starts
     * playing.
     *
     * @fires Player#durationchange
     *
     * @param {number} [seconds]
     *        The duration of the video to set in seconds
     *
     * @return {number|undefined}
     *         - The duration of the video in seconds when getting
     *         - Nothing when setting
     */
    duration(seconds?: number): number | undefined;
    /**
     * Calculates how much time is left in the video. Not part
     * of the native video API.
     *
     * @return {number}
     *         The time remaining in seconds
     */
    remainingTime(): number;
    /**
     * A remaining time function that is intended to be used when
     * the time is to be displayed directly to the user.
     *
     * @return {number}
     *         The rounded time remaining in seconds
     */
    remainingTimeDisplay(): number;
    /**
     * Get a TimeRange object with an array of the times of the video
     * that have been downloaded. If you just want the percent of the
     * video that's been downloaded, use bufferedPercent.
     *
     * @see [Buffered Spec]{@link http://dev.w3.org/html5/spec/video.html#dom-media-buffered}
     *
     * @return { import('./utils/time').TimeRange }
     *         A mock {@link TimeRanges} object (following HTML spec)
     */
    buffered(): import('./utils/time').TimeRange;
    /**
     * Get the percent (as a decimal) of the video that's been downloaded.
     * This method is not a part of the native HTML video API.
     *
     * @return {number}
     *         A decimal between 0 and 1 representing the percent
     *         that is buffered 0 being 0% and 1 being 100%
     */
    bufferedPercent(): number;
    /**
     * Get the ending time of the last buffered time range
     * This is used in the progress bar to encapsulate all time ranges.
     *
     * @return {number}
     *         The end of the last buffered time range
     */
    bufferedEnd(): number;
    /**
     * Get or set the current volume of the media
     *
     * @param  {number} [percentAsDecimal]
     *         The new volume as a decimal percent:
     *         - 0 is muted/0%/off
     *         - 1.0 is 100%/full
     *         - 0.5 is half volume or 50%
     *
     * @return {number|undefined}
     *         The current volume as a percent when getting
     */
    volume(percentAsDecimal?: number): number | undefined;
    /**
     * Get the current muted state, or turn mute on or off
     *
     * @param {boolean} [muted]
     *        - true to mute
     *        - false to unmute
     *
     * @return {boolean|undefined}
     *         - true if mute is on and getting
     *         - false if mute is off and getting
     *         - nothing if setting
     */
    muted(muted?: boolean): boolean | undefined;
    /**
     * Get the current defaultMuted state, or turn defaultMuted on or off. defaultMuted
     * indicates the state of muted on initial playback.
     *
     * ```js
     *   var myPlayer = videojs('some-player-id');
     *
     *   myPlayer.src("http://www.example.com/path/to/video.mp4");
     *
     *   // get, should be false
     *   console.log(myPlayer.defaultMuted());
     *   // set to true
     *   myPlayer.defaultMuted(true);
     *   // get should be true
     *   console.log(myPlayer.defaultMuted());
     * ```
     *
     * @param {boolean} [defaultMuted]
     *        - true to mute
     *        - false to unmute
     *
     * @return {boolean|undefined}
     *         - true if defaultMuted is on and getting
     *         - false if defaultMuted is off and getting
     *         - Nothing when setting
     */
    defaultMuted(defaultMuted?: boolean): boolean | undefined;
    /**
     * Get the last volume, or set it
     *
     * @param  {number} [percentAsDecimal]
     *         The new last volume as a decimal percent:
     *         - 0 is muted/0%/off
     *         - 1.0 is 100%/full
     *         - 0.5 is half volume or 50%
     *
     * @return {number|undefined}
     *         - The current value of lastVolume as a percent when getting
     *         - Nothing when setting
     *
     * @private
     */
    private lastVolume_;
    /**
     * Check if current tech can support native fullscreen
     * (e.g. with built in controls like iOS)
     *
     * @return {boolean}
     *         if native fullscreen is supported
     */
    supportsFullScreen(): boolean;
    /**
     * Check if the player is in fullscreen mode or tell the player that it
     * is or is not in fullscreen mode.
     *
     * > NOTE: As of the latest HTML5 spec, isFullscreen is no longer an official
     * property and instead document.fullscreenElement is used. But isFullscreen is
     * still a valuable property for internal player workings.
     *
     * @param  {boolean} [isFS]
     *         Set the players current fullscreen state
     *
     * @return {boolean|undefined}
     *         - true if fullscreen is on and getting
     *         - false if fullscreen is off and getting
     *         - Nothing when setting
     */
    isFullscreen(isFS?: boolean): boolean | undefined;
    /**
     * Increase the size of the video to full screen
     * In some browsers, full screen is not supported natively, so it enters
     * "full window mode", where the video fills the browser window.
     * In browsers and devices that support native full screen, sometimes the
     * browser's default controls will be shown, and not the Video.js custom skin.
     * This includes most mobile devices (iOS, Android) and older versions of
     * Safari.
     *
     * @param  {Object} [fullscreenOptions]
     *         Override the player fullscreen options
     *
     * @fires Player#fullscreenchange
     */
    requestFullscreen(fullscreenOptions?: any): Promise<any>;
    requestFullscreenHelper_(fullscreenOptions: any): any;
    /**
     * Return the video to its normal size after having been in full screen mode
     *
     * @fires Player#fullscreenchange
     */
    exitFullscreen(): Promise<any>;
    exitFullscreenHelper_(): any;
    /**
     * When fullscreen isn't supported we can stretch the
     * video container to as wide as the browser will let us.
     *
     * @fires Player#enterFullWindow
     */
    enterFullWindow(): void;
    isFullWindow: boolean;
    docOrigOverflow: any;
    /**
     * Check for call to either exit full window or
     * full screen on ESC key
     *
     * @param {string} event
     *        Event to check for key press
     */
    fullWindowOnEscKey(event: string): void;
    /**
     * Exit full window
     *
     * @fires Player#exitFullWindow
     */
    exitFullWindow(): void;
    /**
     * Get or set disable Picture-in-Picture mode.
     *
     * @param {boolean} [value]
     *                  - true will disable Picture-in-Picture mode
     *                  - false will enable Picture-in-Picture mode
     */
    disablePictureInPicture(value?: boolean): any;
    /**
     * Check if the player is in Picture-in-Picture mode or tell the player that it
     * is or is not in Picture-in-Picture mode.
     *
     * @param  {boolean} [isPiP]
     *         Set the players current Picture-in-Picture state
     *
     * @return {boolean|undefined}
     *         - true if Picture-in-Picture is on and getting
     *         - false if Picture-in-Picture is off and getting
     *         - nothing if setting
     */
    isInPictureInPicture(isPiP?: boolean): boolean | undefined;
    isInPictureInPicture_: boolean;
    /**
     * Create a floating video window always on top of other windows so that users may
     * continue consuming media while they interact with other content sites, or
     * applications on their device.
     *
     * This can use document picture-in-picture or element picture in picture
     *
     * Set `enableDocumentPictureInPicture` to `true` to use docPiP on a supported browser
     * Else set `disablePictureInPicture` to `false` to disable elPiP on a supported browser
     *
     *
     * @see [Spec]{@link https://w3c.github.io/picture-in-picture/}
     * @see [Spec]{@link https://wicg.github.io/document-picture-in-picture/}
     *
     * @fires Player#enterpictureinpicture
     *
     * @return {Promise}
     *         A promise with a Picture-in-Picture window.
     */
    requestPictureInPicture(): Promise<any>;
    /**
     * Exit Picture-in-Picture mode.
     *
     * @see [Spec]{@link https://wicg.github.io/picture-in-picture}
     *
     * @fires Player#leavepictureinpicture
     *
     * @return {Promise}
     *         A promise.
     */
    exitPictureInPicture(): Promise<any>;
    /**
     * Called when this Player has focus and a key gets pressed down, or when
     * any Component of this player receives a key press that it doesn't handle.
     * This allows player-wide hotkeys (either as defined below, or optionally
     * by an external function).
     *
     * @param {Event} event
     *        The `keydown` event that caused this function to be called.
     *
     * @listens keydown
     */
    handleKeyDown(event: Event): void;
    /**
     * Called when this Player receives a hotkey keydown event.
     * Supported player-wide hotkeys are:
     *
     *   f          - toggle fullscreen
     *   m          - toggle mute
     *   k or Space - toggle play/pause
     *
     * @param {Event} event
     *        The `keydown` event that caused this function to be called.
     */
    handleHotkeys(event: Event): void;
    /**
     * Check whether the player can play a given mimetype
     *
     * @see https://www.w3.org/TR/2011/WD-html5-20110113/video.html#dom-navigator-canplaytype
     *
     * @param {string} type
     *        The mimetype to check
     *
     * @return {string}
     *         'probably', 'maybe', or '' (empty string)
     */
    canPlayType(type: string): string;
    /**
     * Select source based on tech-order or source-order
     * Uses source-order selection if `options.sourceOrder` is truthy. Otherwise,
     * defaults to tech-order selection
     *
     * @param {Array} sources
     *        The sources for a media asset
     *
     * @return {Object|boolean}
     *         Object of source and tech order or false
     */
    selectSource(sources: any[]): any | boolean;
    /**
     * Executes source setting and getting logic
     *
     * @param {Tech~SourceObject|Tech~SourceObject[]|string} [source]
     *        A SourceObject, an array of SourceObjects, or a string referencing
     *        a URL to a media source. It is _highly recommended_ that an object
     *        or array of objects is used here, so that source selection
     *        algorithms can take the `type` into account.
     *
     *        If not provided, this method acts as a getter.
     * @param {boolean} [isRetry]
     *        Indicates whether this is being called internally as a result of a retry
     *
     * @return {string|undefined}
     *         If the `source` argument is missing, returns the current source
     *         URL. Otherwise, returns nothing/undefined.
     */
    handleSrc_(source: any, isRetry?: boolean): string | undefined;
    resetRetryOnError_: () => void;
    /**
     * Get or set the video source.
     *
     * @param {Tech~SourceObject|Tech~SourceObject[]|string} [source]
     *        A SourceObject, an array of SourceObjects, or a string referencing
     *        a URL to a media source. It is _highly recommended_ that an object
     *        or array of objects is used here, so that source selection
     *        algorithms can take the `type` into account.
     *
     *        If not provided, this method acts as a getter.
     *
     * @return {string|undefined}
     *         If the `source` argument is missing, returns the current source
     *         URL. Otherwise, returns nothing/undefined.
     */
    src(source: any): string | undefined;
    /**
     * Set the source object on the tech, returns a boolean that indicates whether
     * there is a tech that can play the source or not
     *
     * @param {Tech~SourceObject} source
     *        The source object to set on the Tech
     *
     * @return {boolean}
     *         - True if there is no Tech to playback this source
     *         - False otherwise
     *
     * @private
     */
    private src_;
    /**
     * Begin loading the src data.
     */
    load(): void;
    /**
     * Reset the player. Loads the first tech in the techOrder,
     * removes all the text tracks in the existing `tech`,
     * and calls `reset` on the `tech`.
     */
    reset(): void;
    doReset_(): void;
    /**
     * Reset Control Bar's UI by calling sub-methods that reset
     * all of Control Bar's components
     */
    resetControlBarUI_(): void;
    /**
     * Reset tech's progress so progress bar is reset in the UI
     */
    resetProgressBar_(): void;
    /**
     * Reset Playback ratio
     */
    resetPlaybackRate_(): void;
    /**
     * Reset Volume bar
     */
    resetVolumeBar_(): void;
    /**
     * Returns all of the current source objects.
     *
     * @return {Tech~SourceObject[]}
     *         The current source objects
     */
    currentSources(): Tech;
    /**
     * Returns the current source object.
     *
     * @return {Tech~SourceObject}
     *         The current source object
     */
    currentSource(): Tech;
    /**
     * Returns the fully qualified URL of the current source value e.g. http://mysite.com/video.mp4
     * Can be used in conjunction with `currentType` to assist in rebuilding the current source object.
     *
     * @return {string}
     *         The current source
     */
    currentSrc(): string;
    /**
     * Get the current source type e.g. video/mp4
     * This can allow you rebuild the current source object so that you could load the same
     * source and tech later
     *
     * @return {string}
     *         The source MIME type
     */
    currentType(): string;
    /**
     * Get or set the preload attribute
     *
     * @param {'none'|'auto'|'metadata'} [value]
     *        Preload mode to pass to tech
     *
     * @return {string|undefined}
     *         - The preload attribute value when getting
     *         - Nothing when setting
     */
    preload(value?: 'none' | 'auto' | 'metadata'): string | undefined;
    /**
     * Get or set the autoplay option. When this is a boolean it will
     * modify the attribute on the tech. When this is a string the attribute on
     * the tech will be removed and `Player` will handle autoplay on loadstarts.
     *
     * @param {boolean|'play'|'muted'|'any'} [value]
     *        - true: autoplay using the browser behavior
     *        - false: do not autoplay
     *        - 'play': call play() on every loadstart
     *        - 'muted': call muted() then play() on every loadstart
     *        - 'any': call play() on every loadstart. if that fails call muted() then play().
     *        - *: values other than those listed here will be set `autoplay` to true
     *
     * @return {boolean|string|undefined}
     *         - The current value of autoplay when getting
     *         - Nothing when setting
     */
    autoplay(value?: boolean | 'play' | 'muted' | 'any'): boolean | string | undefined;
    /**
     * Set or unset the playsinline attribute.
     * Playsinline tells the browser that non-fullscreen playback is preferred.
     *
     * @param {boolean} [value]
     *        - true means that we should try to play inline by default
     *        - false means that we should use the browser's default playback mode,
     *          which in most cases is inline. iOS Safari is a notable exception
     *          and plays fullscreen by default.
     *
     * @return {string|undefined}
     *         - the current value of playsinline
     *         - Nothing when setting
     *
     * @see [Spec]{@link https://html.spec.whatwg.org/#attr-video-playsinline}
     */
    playsinline(value?: boolean): string | undefined;
    /**
     * Get or set the loop attribute on the video element.
     *
     * @param {boolean} [value]
     *        - true means that we should loop the video
     *        - false means that we should not loop the video
     *
     * @return {boolean|undefined}
     *         - The current value of loop when getting
     *         - Nothing when setting
     */
    loop(value?: boolean): boolean | undefined;
    /**
     * Get or set the poster image source url
     *
     * @fires Player#posterchange
     *
     * @param {string} [src]
     *        Poster image source URL
     *
     * @return {string|undefined}
     *         - The current value of poster when getting
     *         - Nothing when setting
     */
    poster(src?: string): string | undefined;
    /**
     * Some techs (e.g. YouTube) can provide a poster source in an
     * asynchronous way. We want the poster component to use this
     * poster source so that it covers up the tech's controls.
     * (YouTube's play button). However we only want to use this
     * source if the player user hasn't set a poster through
     * the normal APIs.
     *
     * @fires Player#posterchange
     * @listens Tech#posterchange
     * @private
     */
    private handleTechPosterChange_;
    /**
     * Get or set whether or not the controls are showing.
     *
     * @fires Player#controlsenabled
     *
     * @param {boolean} [bool]
     *        - true to turn controls on
     *        - false to turn controls off
     *
     * @return {boolean|undefined}
     *         - The current value of controls when getting
     *         - Nothing when setting
     */
    controls(bool?: boolean): boolean | undefined;
    /**
     * Toggle native controls on/off. Native controls are the controls built into
     * devices (e.g. default iPhone controls) or other techs
     * (e.g. Vimeo Controls)
     * **This should only be set by the current tech, because only the tech knows
     * if it can support native controls**
     *
     * @fires Player#usingnativecontrols
     * @fires Player#usingcustomcontrols
     *
     * @param {boolean} [bool]
     *        - true to turn native controls on
     *        - false to turn native controls off
     *
     * @return {boolean|undefined}
     *         - The current value of native controls when getting
     *         - Nothing when setting
     */
    usingNativeControls(bool?: boolean): boolean | undefined;
    usingNativeControls_: any;
    /**
     * Set or get the current MediaError
     *
     * @fires Player#error
     *
     * @param  {MediaError|string|number} [err]
     *         A MediaError or a string/number to be turned
     *         into a MediaError
     *
     * @return {MediaError|null|undefined}
     *         - The current MediaError when getting (or null)
     *         - Nothing when setting
     */
    error(err?: MediaError | string | number): MediaError | null | undefined;
    error_: MediaError;
    /**
     * Report user activity
     *
     * @param {Object} event
     *        Event object
     */
    reportUserActivity(event: any): void;
    userActivity_: boolean;
    /**
     * Get/set if user is active
     *
     * @fires Player#useractive
     * @fires Player#userinactive
     *
     * @param {boolean} [bool]
     *        - true if the user is active
     *        - false if the user is inactive
     *
     * @return {boolean|undefined}
     *         - The current value of userActive when getting
     *         - Nothing when setting
     */
    userActive(bool?: boolean): boolean | undefined;
    /**
     * Listen for user activity based on timeout value
     *
     * @private
     */
    private listenForUserActivity_;
    /**
     * Gets or sets the current playback rate. A playback rate of
     * 1.0 represents normal speed and 0.5 would indicate half-speed
     * playback, for instance.
     *
     * @see https://html.spec.whatwg.org/multipage/embedded-content.html#dom-media-playbackrate
     *
     * @param {number} [rate]
     *       New playback rate to set.
     *
     * @return {number|undefined}
     *         - The current playback rate when getting or 1.0
     *         - Nothing when setting
     */
    playbackRate(rate?: number): number | undefined;
    /**
     * Gets or sets the current default playback rate. A default playback rate of
     * 1.0 represents normal speed and 0.5 would indicate half-speed playback, for instance.
     * defaultPlaybackRate will only represent what the initial playbackRate of a video was, not
     * not the current playbackRate.
     *
     * @see https://html.spec.whatwg.org/multipage/embedded-content.html#dom-media-defaultplaybackrate
     *
     * @param {number} [rate]
     *       New default playback rate to set.
     *
     * @return {number|undefined}
     *         - The default playback rate when getting or 1.0
     *         - Nothing when setting
     */
    defaultPlaybackRate(rate?: number): number | undefined;
    /**
     * Gets or sets the audio flag
     *
     * @param {boolean} [bool]
     *        - true signals that this is an audio player
     *        - false signals that this is not an audio player
     *
     * @return {boolean|undefined}
     *         - The current value of isAudio when getting
     *         - Nothing when setting
     */
    isAudio(bool?: boolean): boolean | undefined;
    isAudio_: boolean;
    enableAudioOnlyUI_(): void;
    disableAudioOnlyUI_(): void;
    /**
     * Get the current audioOnlyMode state or set audioOnlyMode to true or false.
     *
     * Setting this to `true` will hide all player components except the control bar,
     * as well as control bar components needed only for video.
     *
     * @param {boolean} [value]
     *         The value to set audioOnlyMode to.
     *
     * @return {Promise|boolean}
     *        A Promise is returned when setting the state, and a boolean when getting
     *        the present state
     */
    audioOnlyMode(value?: boolean): Promise<any> | boolean;
    enablePosterModeUI_(): void;
    disablePosterModeUI_(): void;
    /**
     * Get the current audioPosterMode state or set audioPosterMode to true or false
     *
     * @param {boolean} [value]
     *         The value to set audioPosterMode to.
     *
     * @return {Promise|boolean}
     *         A Promise is returned when setting the state, and a boolean when getting
     *        the present state
     */
    audioPosterMode(value?: boolean): Promise<any> | boolean;
    /**
     * A helper method for adding a {@link TextTrack} to our
     * {@link TextTrackList}.
     *
     * In addition to the W3C settings we allow adding additional info through options.
     *
     * @see http://www.w3.org/html/wg/drafts/html/master/embedded-content-0.html#dom-media-addtexttrack
     *
     * @param {string} [kind]
     *        the kind of TextTrack you are adding
     *
     * @param {string} [label]
     *        the label to give the TextTrack label
     *
     * @param {string} [language]
     *        the language to set on the TextTrack
     *
     * @return {TextTrack|undefined}
     *         the TextTrack that was added or undefined
     *         if there is no tech
     */
    addTextTrack(kind?: string, label?: string, language?: string): TextTrack | undefined;
    /**
     * Create a remote {@link TextTrack} and an {@link HTMLTrackElement}.
     *
     * @param {Object} options
     *        Options to pass to {@link HTMLTrackElement} during creation. See
     *        {@link HTMLTrackElement} for object properties that you should use.
     *
     * @param {boolean} [manualCleanup=false] if set to true, the TextTrack will not be removed
     *                                        from the TextTrackList and HtmlTrackElementList
     *                                        after a source change
     *
     * @return { import('./tracks/html-track-element').default }
     *         the HTMLTrackElement that was created and added
     *         to the HtmlTrackElementList and the remote
     *         TextTrackList
     *
     */
    addRemoteTextTrack(options: any, manualCleanup?: boolean): import('./tracks/html-track-element').default;
    /**
     * Remove a remote {@link TextTrack} from the respective
     * {@link TextTrackList} and {@link HtmlTrackElementList}.
     *
     * @param {Object} track
     *        Remote {@link TextTrack} to remove
     *
     * @return {undefined}
     *         does not return anything
     */
    removeRemoteTextTrack(obj?: {}): undefined;
    /**
     * Gets available media playback quality metrics as specified by the W3C's Media
     * Playback Quality API.
     *
     * @see [Spec]{@link https://wicg.github.io/media-playback-quality}
     *
     * @return {Object|undefined}
     *         An object with supported media playback quality metrics or undefined if there
     *         is no tech or the tech does not support it.
     */
    getVideoPlaybackQuality(): any | undefined;
    /**
     * Get video width
     *
     * @return {number}
     *         current video width
     */
    videoWidth(): number;
    /**
     * Get video height
     *
     * @return {number}
     *         current video height
     */
    videoHeight(): number;
    /**
     * Set or get the player's language code.
     *
     * Changing the language will trigger
     * [languagechange]{@link Player#event:languagechange}
     * which Components can use to update control text.
     * ClickableComponent will update its control text by default on
     * [languagechange]{@link Player#event:languagechange}.
     *
     * @fires Player#languagechange
     *
     * @param {string} [code]
     *        the language code to set the player to
     *
     * @return {string|undefined}
     *         - The current language code when getting
     *         - Nothing when setting
     */
    language(code?: string): string | undefined;
    language_: string;
    /**
     * Get the player's language dictionary
     * Merge every time, because a newly added plugin might call videojs.addLanguage() at any time
     * Languages specified directly in the player options have precedence
     *
     * @return {Array}
     *         An array of of supported languages
     */
    languages(): any[];
    /**
     * returns a JavaScript object representing the current track
     * information. **DOES not return it as JSON**
     *
     * @return {Object}
     *         Object representing the current of track info
     */
    toJSON(): any;
    /**
     * Creates a simple modal dialog (an instance of the {@link ModalDialog}
     * component) that immediately overlays the player with arbitrary
     * content and removes itself when closed.
     *
     * @param {string|Function|Element|Array|null} content
     *        Same as {@link ModalDialog#content}'s param of the same name.
     *        The most straight-forward usage is to provide a string or DOM
     *        element.
     *
     * @param {Object} [options]
     *        Extra options which will be passed on to the {@link ModalDialog}.
     *
     * @return {ModalDialog}
     *         the {@link ModalDialog} that was created
     */
    createModal(content: string | Function | Element | any[] | null, options?: any): ModalDialog;
    /**
     * Change breakpoint classes when the player resizes.
     *
     * @private
     */
    private updateCurrentBreakpoint_;
    breakpoint_: string;
    /**
     * Removes the current breakpoint.
     *
     * @private
     */
    private removeCurrentBreakpoint_;
    /**
     * Get or set breakpoints on the player.
     *
     * Calling this method with an object or `true` will remove any previous
     * custom breakpoints and start from the defaults again.
     *
     * @param  {Object|boolean} [breakpoints]
     *         If an object is given, it can be used to provide custom
     *         breakpoints. If `true` is given, will set default breakpoints.
     *         If this argument is not given, will simply return the current
     *         breakpoints.
     *
     * @param  {number} [breakpoints.tiny]
     *         The maximum width for the "vjs-layout-tiny" class.
     *
     * @param  {number} [breakpoints.xsmall]
     *         The maximum width for the "vjs-layout-x-small" class.
     *
     * @param  {number} [breakpoints.small]
     *         The maximum width for the "vjs-layout-small" class.
     *
     * @param  {number} [breakpoints.medium]
     *         The maximum width for the "vjs-layout-medium" class.
     *
     * @param  {number} [breakpoints.large]
     *         The maximum width for the "vjs-layout-large" class.
     *
     * @param  {number} [breakpoints.xlarge]
     *         The maximum width for the "vjs-layout-x-large" class.
     *
     * @param  {number} [breakpoints.huge]
     *         The maximum width for the "vjs-layout-huge" class.
     *
     * @return {Object}
     *         An object mapping breakpoint names to maximum width values.
     */
    breakpoints(breakpoints?: any | boolean): any;
    breakpoints_: any;
    /**
     * Get or set a flag indicating whether or not this player should adjust
     * its UI based on its dimensions.
     *
     * @param  {boolean} [value]
     *         Should be `true` if the player should adjust its UI based on its
     *         dimensions; otherwise, should be `false`.
     *
     * @return {boolean|undefined}
     *         Will be `true` if this player should adjust its UI based on its
     *         dimensions; otherwise, will be `false`.
     *         Nothing if setting
     */
    responsive(value?: boolean): boolean | undefined;
    responsive_: any;
    /**
     * Get current breakpoint name, if any.
     *
     * @return {string}
     *         If there is currently a breakpoint set, returns a the key from the
     *         breakpoints object matching it. Otherwise, returns an empty string.
     */
    currentBreakpoint(): string;
    /**
     * Get the current breakpoint class name.
     *
     * @return {string}
     *         The matching class name (e.g. `"vjs-layout-tiny"` or
     *         `"vjs-layout-large"`) for the current breakpoint. Empty string if
     *         there is no current breakpoint.
     */
    currentBreakpointClass(): string;
    /**
     * An object that describes a single piece of media.
     *
     * Properties that are not part of this type description will be retained; so,
     * this can be viewed as a generic metadata storage mechanism as well.
     *
     * @see      {@link https://wicg.github.io/mediasession/#the-mediametadata-interface}
     * @typedef  {Object} Player~MediaObject
     *
     * @property {string} [album]
     *           Unused, except if this object is passed to the `MediaSession`
     *           API.
     *
     * @property {string} [artist]
     *           Unused, except if this object is passed to the `MediaSession`
     *           API.
     *
     * @property {Object[]} [artwork]
     *           Unused, except if this object is passed to the `MediaSession`
     *           API. If not specified, will be populated via the `poster`, if
     *           available.
     *
     * @property {string} [poster]
     *           URL to an image that will display before playback.
     *
     * @property {Tech~SourceObject|Tech~SourceObject[]|string} [src]
     *           A single source object, an array of source objects, or a string
     *           referencing a URL to a media source. It is _highly recommended_
     *           that an object or array of objects is used here, so that source
     *           selection algorithms can take the `type` into account.
     *
     * @property {string} [title]
     *           Unused, except if this object is passed to the `MediaSession`
     *           API.
     *
     * @property {Object[]} [textTracks]
     *           An array of objects to be used to create text tracks, following
     *           the {@link https://www.w3.org/TR/html50/embedded-content-0.html#the-track-element|native track element format}.
     *           For ease of removal, these will be created as "remote" text
     *           tracks and set to automatically clean up on source changes.
     *
     *           These objects may have properties like `src`, `kind`, `label`,
     *           and `language`, see {@link Tech#createRemoteTextTrack}.
     */
    /**
     * Populate the player using a {@link Player~MediaObject|MediaObject}.
     *
     * @param  {Player~MediaObject} media
     *         A media object.
     *
     * @param  {Function} ready
     *         A callback to be called when the player is ready.
     */
    loadMedia(media: any, ready: Function): void;
    /**
     * Get a clone of the current {@link Player~MediaObject} for this player.
     *
     * If the `loadMedia` method has not been used, will attempt to return a
     * {@link Player~MediaObject} based on the current state of the player.
     *
     * @return {Player~MediaObject}
     */
    getMedia(): Player;
    /**
     * Set debug mode to enable/disable logs at info level.
     *
     * @param {boolean} enabled
     * @fires Player#debugon
     * @fires Player#debugoff
     * @return {boolean|undefined}
     */
    debug(enabled: boolean): boolean | undefined;
    previousLogLevel_: any;
    /**
     * Set or get current playback rates.
     * Takes an array and updates the playback rates menu with the new items.
     * Pass in an empty array to hide the menu.
     * Values other than arrays are ignored.
     *
     * @fires Player#playbackrateschange
     * @param {number[]} newRates
     *                   The new rates that the playback rates menu should update to.
     *                   An empty array will hide the menu
     * @return {number[]} When used as a getter will return the current playback rates
     */
    playbackRates(newRates: number[]): number[];
    /**
     * Get or set the `Player`'s crossorigin option. For the HTML5 player, this
     * sets the `crossOrigin` property on the `<video>` tag to control the CORS
     * behavior.
     *
     * @see [Video Element Attributes]{@link https://developer.mozilla.org/en-US/docs/Web/HTML/Element/video#attr-crossorigin}
     *
     * @param {string} [value]
     *        The value to set the `Player`'s crossorigin to. If an argument is
     *        given, must be one of `anonymous` or `use-credentials`.
     *
     * @return {string|undefined}
     *         - The current crossorigin value of the `Player` when getting.
     *         - undefined when setting
     */
    crossorigin: (value?: string | null) => string | null | undefined;
    options_: {
        techOrder: any[];
        html5: {};
        enableSourceset: boolean;
        inactivityTimeout: number;
        playbackRates: any[];
        liveui: boolean;
        children: string[];
        language: any;
        languages: {};
        notSupportedMessage: string;
        normalizeAutoplay: boolean;
        fullscreen: {
            options: {
                navigationUI: string;
            };
        };
        breakpoints: {};
        responsive: boolean;
        audioOnlyMode: boolean;
        audioPosterMode: boolean;
    };
}
declare namespace Player {
    const players: any;
}
import Component from "./component.js";
import Tech from "./tech/tech.js";
import MediaError from "./media-error.js";
import ModalDialog from "./modal-dialog";
//# sourceMappingURL=player.d.ts.map