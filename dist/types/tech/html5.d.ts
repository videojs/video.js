export default Html5;
/**
 * HTML5 Media Controller - Wrapper for HTML5 Media API
 *
 * @mixes Tech~SourceHandlerAdditions
 * @extends Tech
 */
declare class Html5 extends Tech {
    isScrubbing_: boolean;
    /**
     * Modify the media element so that we can detect when
     * the source is changed. Fires `sourceset` just after the source has changed
     */
    setupSourcesetHandling_(): void;
    /**
     * When a captions track is enabled in the iOS Safari native player, all other
     * tracks are disabled (including metadata tracks), which nulls all of their
     * associated cue points. This will restore metadata tracks to their pre-fullscreen
     * state in those cases so that cue points are not needlessly lost.
     *
     * @private
     */
    private restoreMetadataTracksInIOSNativePlayer_;
    /**
     * Attempt to force override of tracks for the given type
     *
     * @param {string} type - Track type to override, possible values include 'Audio',
     * 'Video', and 'Text'.
     * @param {boolean} override - If set to true native audio/video will be overridden,
     * otherwise native audio/video will potentially be used.
     * @private
     */
    private overrideNative_;
    /**
     * Proxy native track list events for the given type to our track
     * lists if the browser we are playing in supports that type of track list.
     *
     * @param {string} name - Track type; values include 'audio', 'video', and 'text'
     * @private
     */
    private proxyNativeTracksForType_;
    /**
     * Proxy all native track list events to our track lists if the browser we are playing
     * in supports that type of track list.
     *
     * @private
     */
    private proxyNativeTracks_;
    /**
     * Create the `Html5` Tech's DOM element.
     *
     * @return {Element}
     *         The element that gets created.
     */
    createEl(): Element;
    /**
     * This will be triggered if the loadstart event has already fired, before videojs was
     * ready. Two known examples of when this can happen are:
     * 1. If we're loading the playback object after it has started loading
     * 2. The media is already playing the (often with autoplay on) then
     *
     * This function will fire another loadstart so that videojs can catchup.
     *
     * @fires Tech#loadstart
     *
     * @return {undefined}
     *         returns nothing.
     */
    handleLateInit_(el: any): undefined;
    /**
     * Get whether we are scrubbing or not.
     *
     * @return {boolean} isScrubbing
     *                  - true for we are currently scrubbing
     *                  - false for we are no longer scrubbing
     */
    scrubbing(): boolean;
    /**
     * Get the current duration of the HTML5 media element.
     *
     * @return {number}
     *         The duration of the media or 0 if there is no duration.
     */
    duration(): number;
    /**
     * Get the current width of the HTML5 media element.
     *
     * @return {number}
     *         The width of the HTML5 media element.
     */
    width(): number;
    /**
     * Get the current height of the HTML5 media element.
     *
     * @return {number}
     *         The height of the HTML5 media element.
     */
    height(): number;
    /**
     * Proxy iOS `webkitbeginfullscreen` and `webkitendfullscreen` into
     * `fullscreenchange` event.
     *
     * @private
     * @fires fullscreenchange
     * @listens webkitendfullscreen
     * @listens webkitbeginfullscreen
     * @listens webkitbeginfullscreen
     */
    private proxyWebkitFullscreen_;
    /**
     * Check if fullscreen is supported on the video el.
     *
     * @return {boolean}
     *         - True if fullscreen is supported.
     *         - False if fullscreen is not supported.
     */
    supportsFullScreen(): boolean;
    /**
     * Request that the `HTML5` Tech enter fullscreen.
     */
    enterFullScreen(): void;
    /**
     * Request that the `HTML5` Tech exit fullscreen.
     */
    exitFullScreen(): void;
    /**
     * A getter/setter for the `Html5` Tech's source object.
     * > Note: Please use {@link Html5#setSource}
     *
     * @param {Tech~SourceObject} [src]
     *        The source object you want to set on the `HTML5` techs element.
     *
     * @return {Tech~SourceObject|undefined}
     *         - The current source object when a source is not passed in.
     *         - undefined when setting
     *
     * @deprecated Since version 5.
     */
    src(src: any): Tech;
    /**
     * Get the current source on the `HTML5` Tech. Falls back to returning the source from
     * the HTML5 media element.
     *
     * @return {Tech~SourceObject}
     *         The current source object from the HTML5 tech. With a fallback to the
     *         elements source.
     */
    currentSrc(): Tech;
    /**
     * Set controls attribute for the HTML5 media Element.
     *
     * @param {string} val
     *        Value to set the controls attribute to
     */
    setControls(val: string): void;
    /**
     * Creates either native TextTrack or an emulated TextTrack depending
     * on the value of `featuresNativeTextTracks`
     *
     * @param {Object} options
     *        The object should contain the options to initialize the TextTrack with.
     *
     * @param {string} [options.kind]
     *        `TextTrack` kind (subtitles, captions, descriptions, chapters, or metadata).
     *
     * @param {string} [options.label]
     *        Label to identify the text track
     *
     * @param {string} [options.language]
     *        Two letter language abbreviation.
     *
     * @param {boolean} [options.default]
     *        Default this track to on.
     *
     * @param {string} [options.id]
     *        The internal id to assign this track.
     *
     * @param {string} [options.src]
     *        A source url for the track.
     *
     * @return {HTMLTrackElement}
     *         The track element that gets created.
     */
    createRemoteTextTrack(options: {
        kind?: string;
        label?: string;
        language?: string;
        default?: boolean;
        id?: string;
        src?: string;
    }): HTMLTrackElement;
    /**
     * Creates a remote text track object and returns an html track element.
     *
     * @param {Object} options The object should contain values for
     * kind, language, label, and src (location of the WebVTT file)
     * @param {boolean} [manualCleanup=false] if set to true, the TextTrack
     * will not be removed from the TextTrackList and HtmlTrackElementList
     * after a source change
     * @return {HTMLTrackElement} An Html Track Element.
     * This can be an emulated {@link HTMLTrackElement} or a native one.
     *
     */
    addRemoteTextTrack(options: any, manualCleanup?: boolean): HTMLTrackElement;
    /**
     * Boolean indicating whether the `HTML5` tech currently supports the media element
     * moving in the DOM. iOS breaks if you move the media element, so this is set this to
     * false there. Everywhere else this should be true.
     *
     * @type {boolean}
     * @default
     */
    movingMediaElementInDOM: boolean;
}
declare namespace Html5 {
    /**
     * Check if HTML5 media is supported by this browser/device.
     *
     * @return {boolean}
     *         - True if HTML5 media is supported.
     *         - False if HTML5 media is not supported.
     */
    function isSupported(): boolean;
    /**
     * Check if the tech can support the given type
     *
     * @param {string} type
     *        The mimetype to check
     * @return {string} 'probably', 'maybe', or '' (empty string)
     */
    function canPlayType(type: string): string;
    /**
     * Check if the tech can support the given source
     *
     * @param {Object} srcObj
     *        The source object
     * @param {Object} options
     *        The options passed to the tech
     * @return {string} 'probably', 'maybe', or '' (empty string)
     */
    function canPlaySource(srcObj: any, options: any): string;
    /**
     * Check if the volume can be changed in this browser/device.
     * Volume cannot be changed in a lot of mobile devices.
     * Specifically, it can't be changed from 1 on iOS.
     *
     * @return {boolean}
     *         - True if volume can be controlled
     *         - False otherwise
     */
    function canControlVolume(): boolean;
    /**
     * Check if the volume can be muted in this browser/device.
     * Some devices, e.g. iOS, don't allow changing volume
     * but permits muting/unmuting.
     *
     * @return {boolean}
     *      - True if volume can be muted
     *      - False otherwise
     */
    function canMuteVolume(): boolean;
    /**
     * Check if the playback rate can be changed in this browser/device.
     *
     * @return {boolean}
     *         - True if playback rate can be controlled
     *         - False otherwise
     */
    function canControlPlaybackRate(): boolean;
    /**
     * Check if we can override a video/audio elements attributes, with
     * Object.defineProperty.
     *
     * @return {boolean}
     *         - True if builtin attributes can be overridden
     *         - False otherwise
     */
    function canOverrideAttributes(): boolean;
    /**
     * Check to see if native `TextTrack`s are supported by this browser/device.
     *
     * @return {boolean}
     *         - True if native `TextTrack`s are supported.
     *         - False otherwise
     */
    function supportsNativeTextTracks(): boolean;
    /**
     * Check to see if native `VideoTrack`s are supported by this browser/device
     *
     * @return {boolean}
     *        - True if native `VideoTrack`s are supported.
     *        - False otherwise
     */
    function supportsNativeVideoTracks(): boolean;
    /**
     * Check to see if native `AudioTrack`s are supported by this browser/device
     *
     * @return {boolean}
     *        - True if native `AudioTrack`s are supported.
     *        - False otherwise
     */
    function supportsNativeAudioTracks(): boolean;
    const Events: any[];
    function disposeMediaElement(el: any): void;
    function resetMediaElement(el: any): void;
    namespace nativeSourceHandler {
        /**
         * Check if the media element can play the given mime type.
         *
         * @param {string} type
         *        The mimetype to check
         *
         * @return {string}
         *         'probably', 'maybe', or '' (empty string)
         */
        function canPlayType(type: string): string;
        /**
         * Check if the media element can handle a source natively.
         *
         * @param {Tech~SourceObject} source
         *         The source object
         *
         * @param {Object} [options]
         *         Options to be passed to the tech.
         *
         * @return {string}
         *         'probably', 'maybe', or '' (empty string).
         */
        function canHandleSource(source: any, options?: any): string;
        /**
         * Pass the source to the native media element.
         *
         * @param {Tech~SourceObject} source
         *        The source object
         *
         * @param {Html5} tech
         *        The instance of the Html5 tech
         *
         * @param {Object} [options]
         *        The options to pass to the source
         */
        function handleSource(source: any, tech: Html5, options?: any): void;
        /**
         * A noop for the native dispose function, as cleanup is not needed.
         */
        function dispose(): void;
    }
}
import Tech from "./tech.js";
//# sourceMappingURL=html5.d.ts.map