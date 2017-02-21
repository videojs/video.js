/**
 * @file tech.js
 */

import Component from '../component';
import HTMLTrackElement from '../tracks/html-track-element';
import HTMLTrackElementList from '../tracks/html-track-element-list';
import mergeOptions from '../utils/merge-options.js';
import TextTrack from '../tracks/text-track';
import TextTrackList from '../tracks/text-track-list';
import VideoTrackList from '../tracks/video-track-list';
import AudioTrackList from '../tracks/audio-track-list';
import * as Fn from '../utils/fn.js';
import log from '../utils/log.js';
import { createTimeRange } from '../utils/time-ranges.js';
import { bufferedPercent } from '../utils/buffer.js';
import MediaError from '../media-error.js';
import window from 'global/window';
import document from 'global/document';
import {isPlain} from '../utils/obj';

/**
 * An Object containing a structure like: `{src: 'url', type: 'mimetype'}` or string
 * that just contains the src url alone.
 * * `var SourceObject = {src: 'http://ex.com/video.mp4', type: 'video/mp4'};`
   * `var SourceString = 'http://example.com/some-video.mp4';`
 *
 * @typedef {Object|string} Tech~SourceObject
 *
 * @property {string} src
 *           The url to the source
 *
 * @property {string} type
 *           The mime type of the source
 */

/**
 * A function used by {@link Tech} to create a new {@link TextTrack}.
 *
 * @param {Tech} self
 *        An instance of the Tech class.
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
 * @param {Object} [options={}]
 *        An object with additional text track options
 *
 * @return {TextTrack}
 *          The text track that was created.
 */
function createTrackHelper(self, kind, label, language, options = {}) {
  const tracks = self.textTracks();

  options.kind = kind;

  if (label) {
    options.label = label;
  }
  if (language) {
    options.language = language;
  }
  options.tech = self;

  const track = new TextTrack(options);

  tracks.addTrack_(track);

  return track;
}

/**
 * This is the base class for media playback technology controllers, such as
 * {@link Flash} and {@link HTML5}
 *
 * @extends Component
 */
class Tech extends Component {

 /**
  * Create an instance of this Tech.
  *
  * @param {Object} [options]
  *        The key/value store of player options.
  *
  * @param {Component~ReadyCallback} ready
  *        Callback function to call when the `HTML5` Tech is ready.
  */
  constructor(options = {}, ready = function() {}) {
    // we don't want the tech to report user activity automatically.
    // This is done manually in addControlsListeners
    options.reportTouchActivity = false;
    super(null, options, ready);

    // keep track of whether the current source has played at all to
    // implement a very limited played()
    this.hasStarted_ = false;
    this.on('playing', function() {
      this.hasStarted_ = true;
    });
    this.on('loadstart', function() {
      this.hasStarted_ = false;
    });

    this.textTracks_ = options.textTracks;
    this.videoTracks_ = options.videoTracks;
    this.audioTracks_ = options.audioTracks;

    // Manually track progress in cases where the browser/flash player doesn't report it.
    if (!this.featuresProgressEvents) {
      this.manualProgressOn();
    }

    // Manually track timeupdates in cases where the browser/flash player doesn't report it.
    if (!this.featuresTimeupdateEvents) {
      this.manualTimeUpdatesOn();
    }

    ['Text', 'Audio', 'Video'].forEach((track) => {
      if (options[`native${track}Tracks`] === false) {
        this[`featuresNative${track}Tracks`] = false;
      }
    });

    if (options.nativeCaptions === false) {
      this.featuresNativeTextTracks = false;
    }

    if (!this.featuresNativeTextTracks) {
      this.emulateTextTracks();
    }

    this.autoRemoteTextTracks_ = new TextTrackList();

    this.initTextTrackListeners();
    this.initTrackListeners();

    // Turn on component tap events only if not using native controls
    if (!options.nativeControlsForTouch) {
      this.emitTapEvents();
    }

    if (this.constructor) {
      this.name_ = this.constructor.name || 'Unknown Tech';
    }
  }

  /* Fallbacks for unsupported event types
  ================================================================================ */

  /**
   * Polyfill the `progress` event for browsers that don't support it natively.
   *
   * @see {@link Tech#trackProgress}
   */
  manualProgressOn() {
    this.on('durationchange', this.onDurationChange);

    this.manualProgress = true;

    // Trigger progress watching when a source begins loading
    this.one('ready', this.trackProgress);
  }

  /**
   * Turn off the polyfill for `progress` events that was created in
   * {@link Tech#manualProgressOn}
   */
  manualProgressOff() {
    this.manualProgress = false;
    this.stopTrackingProgress();

    this.off('durationchange', this.onDurationChange);
  }

  /**
   * This is used to trigger a `progress` event when the buffered percent changes. It
   * sets an interval function that will be called every 500 milliseconds to check if the
   * buffer end percent has changed.
   *
   * > This function is called by {@link Tech#manualProgressOn}
   *
   * @param {EventTarget~Event} event
   *        The `ready` event that caused this to run.
   *
   * @listens Tech#ready
   * @fires Tech#progress
   */
  trackProgress(event) {
    this.stopTrackingProgress();
    this.progressInterval = this.setInterval(Fn.bind(this, function() {
      // Don't trigger unless buffered amount is greater than last time

      const numBufferedPercent = this.bufferedPercent();

      if (this.bufferedPercent_ !== numBufferedPercent) {
        /**
         * See {@link Player#progress}
         *
         * @event Tech#progress
         * @type {EventTarget~Event}
         */
        this.trigger('progress');
      }

      this.bufferedPercent_ = numBufferedPercent;

      if (numBufferedPercent === 1) {
        this.stopTrackingProgress();
      }
    }), 500);
  }

  /**
   * Update our internal duration on a `durationchange` event by calling
   * {@link Tech#duration}.
   *
   * @param {EventTarget~Event} event
   *        The `durationchange` event that caused this to run.
   *
   * @listens Tech#durationchange
   */
  onDurationChange(event) {
    this.duration_ = this.duration();
  }

  /**
   * Get and create a `TimeRange` object for buffering.
   *
   * @return {TimeRange}
   *         The time range object that was created.
   */
  buffered() {
    return createTimeRange(0, 0);
  }

  /**
   * Get the percentage of the current video that is currently buffered.
   *
   * @return {number}
   *         A number from 0 to 1 that represents the decimal percentage of the
   *         video that is buffered.
   *
   */
  bufferedPercent() {
    return bufferedPercent(this.buffered(), this.duration_);
  }

  /**
   * Turn off the polyfill for `progress` events that was created in
   * {@link Tech#manualProgressOn}
   * Stop manually tracking progress events by clearing the interval that was set in
   * {@link Tech#trackProgress}.
   */
  stopTrackingProgress() {
    this.clearInterval(this.progressInterval);
  }

  /**
   * Polyfill the `timeupdate` event for browsers that don't support it.
   *
   * @see {@link Tech#trackCurrentTime}
   */
  manualTimeUpdatesOn() {
    this.manualTimeUpdates = true;

    this.on('play', this.trackCurrentTime);
    this.on('pause', this.stopTrackingCurrentTime);
  }

  /**
   * Turn off the polyfill for `timeupdate` events that was created in
   * {@link Tech#manualTimeUpdatesOn}
   */
  manualTimeUpdatesOff() {
    this.manualTimeUpdates = false;
    this.stopTrackingCurrentTime();
    this.off('play', this.trackCurrentTime);
    this.off('pause', this.stopTrackingCurrentTime);
  }

  /**
   * Sets up an interval function to track current time and trigger `timeupdate` every
   * 250 milliseconds.
   *
   * @listens Tech#play
   * @triggers Tech#timeupdate
   */
  trackCurrentTime() {
    if (this.currentTimeInterval) {
      this.stopTrackingCurrentTime();
    }
    this.currentTimeInterval = this.setInterval(function() {
      /**
       * Triggered at an interval of 250ms to indicated that time is passing in the video.
       *
       * @event Tech#timeupdate
       * @type {EventTarget~Event}
       */
      this.trigger({ type: 'timeupdate', target: this, manuallyTriggered: true });

    // 42 = 24 fps // 250 is what Webkit uses // FF uses 15
    }, 250);
  }

  /**
   * Stop the interval function created in {@link Tech#trackCurrentTime} so that the
   * `timeupdate` event is no longer triggered.
   *
   * @listens {Tech#pause}
   */
  stopTrackingCurrentTime() {
    this.clearInterval(this.currentTimeInterval);

    // #1002 - if the video ends right before the next timeupdate would happen,
    // the progress bar won't make it all the way to the end
    this.trigger({ type: 'timeupdate', target: this, manuallyTriggered: true });
  }

  /**
   * Turn off all event polyfills, clear the `Tech`s {@link AudioTrackList},
   * {@link VideoTrackList}, and {@link TextTrackList}, and dispose of this Tech.
   *
   * @fires Component#dispose
   */
  dispose() {

    // clear out all tracks because we can't reuse them between techs
    this.clearTracks(['audio', 'video', 'text']);

    // Turn off any manual progress or timeupdate tracking
    if (this.manualProgress) {
      this.manualProgressOff();
    }

    if (this.manualTimeUpdates) {
      this.manualTimeUpdatesOff();
    }

    super.dispose();
  }

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
  clearTracks(types) {
    types = [].concat(types);
    // clear out all tracks because we can't reuse them between techs
    types.forEach((type) => {
      const list = this[`${type}Tracks`]() || [];
      let i = list.length;

      while (i--) {
        const track = list[i];

        if (type === 'text') {
          this.removeRemoteTextTrack(track);
        }
        list.removeTrack_(track);
      }
    });
  }

  /**
   * Remove any TextTracks added via addRemoteTextTrack that are
   * flagged for automatic garbage collection
   */
  cleanupAutoTextTracks() {
    const list = this.autoRemoteTextTracks_ || [];
    let i = list.length;

    while (i--) {
      const track = list[i];

      this.removeRemoteTextTrack(track);
    }
  }

  /**
   * Reset the tech, which will removes all sources and reset the internal readyState.
   *
   * @abstract
   */
  reset() {}

  /**
   * Get or set an error on the Tech.
   *
   * @param {MediaError} [err]
   *        Error to set on the Tech
   *
   * @return {MediaError|null}
   *         The current error object on the tech, or null if there isn't one.
   */
  error(err) {
    if (err !== undefined) {
      this.error_ = new MediaError(err);
      this.trigger('error');
    }
    return this.error_;
  }

  /**
   * Returns the `TimeRange`s that have been played through for the current source.
   *
   * > NOTE: This implementation is incomplete. It does not track the played `TimeRange`.
   *         It only checks wether the source has played at all or not.
   *
   * @return {TimeRange}
   *         - A single time range if this video has played
   *         - An empty set of ranges if not.
   */
  played() {
    if (this.hasStarted_) {
      return createTimeRange(0, 0);
    }
    return createTimeRange();
  }

  /**
   * Causes a manual time update to occur if {@link Tech#manualTimeUpdatesOn} was
   * previously called.
   *
   * @fires Tech#timeupdate
   */
  setCurrentTime() {
    // improve the accuracy of manual timeupdates
    if (this.manualTimeUpdates) {
      /**
       * A manual `timeupdate` event.
       *
       * @event Tech#timeupdate
       * @type {EventTarget~Event}
       */
      this.trigger({ type: 'timeupdate', target: this, manuallyTriggered: true });
    }
  }

  /**
   * Turn on listeners for {@link TextTrackList} events. This adds
   * {@link EventTarget~EventListeners} for `texttrackchange`, `addtrack` and
   * `removetrack`.
   *
   * @fires Tech#texttrackchange
   */
  initTextTrackListeners() {
    const textTrackListChanges = Fn.bind(this, function() {
      /**
       * Triggered when tracks are added or removed on the Tech {@link TextTrackList}
       *
       * @event Tech#texttrackchange
       * @type {EventTarget~Event}
       */
      this.trigger('texttrackchange');
    });

    const tracks = this.textTracks();

    if (!tracks) {
      return;
    }

    tracks.addEventListener('removetrack', textTrackListChanges);
    tracks.addEventListener('addtrack', textTrackListChanges);

    this.on('dispose', Fn.bind(this, function() {
      tracks.removeEventListener('removetrack', textTrackListChanges);
      tracks.removeEventListener('addtrack', textTrackListChanges);
    }));
  }

  /**
   * Turn on listeners for {@link VideoTrackList} and {@link {AudioTrackList} events.
   * This adds {@link EventTarget~EventListeners} for `addtrack`, and  `removetrack`.
   *
   * @fires Tech#audiotrackchange
   * @fires Tech#videotrackchange
   */
  initTrackListeners() {
    const trackTypes = ['video', 'audio'];

    trackTypes.forEach((type) => {
     /**
      * Triggered when tracks are added or removed on the Tech {@link AudioTrackList}
      *
      * @event Tech#audiotrackchange
      * @type {EventTarget~Event}
      */

     /**
      * Triggered when tracks are added or removed on the Tech {@link VideoTrackList}
      *
      * @event Tech#videotrackchange
      * @type {EventTarget~Event}
      */
      const trackListChanges = () => {
        this.trigger(`${type}trackchange`);
      };

      const tracks = this[`${type}Tracks`]();

      tracks.addEventListener('removetrack', trackListChanges);
      tracks.addEventListener('addtrack', trackListChanges);

      this.on('dispose', () => {
        tracks.removeEventListener('removetrack', trackListChanges);
        tracks.removeEventListener('addtrack', trackListChanges);
      });
    });
  }

  /**
   * Emulate TextTracks using vtt.js if necessary
   *
   * @fires Tech#vttjsloaded
   * @fires Tech#vttjserror
   */
  addWebVttScript_() {
    if (window.WebVTT) {
      return;
    }

    // Initially, Tech.el_ is a child of a dummy-div wait until the Component system
    // signals that the Tech is ready at which point Tech.el_ is part of the DOM
    // before inserting the WebVTT script
    if (this.el().parentNode !== null && this.el().parentNode !== undefined) {
      const vtt = require('videojs-vtt.js');

      // load via require if available and vtt.js script location was not passed in
      // as an option. novtt builds will turn the above require call into an empty object
      // which will cause this if check to always fail.
      if (!this.options_['vtt.js'] && isPlain(vtt) && Object.keys(vtt).length > 0) {
        this.trigger('vttjsloaded');
        return;
      }

      // load vtt.js via the script location option or the cdn of no location was
      // passed in
      const script = document.createElement('script');

      script.src = this.options_['vtt.js'] || 'https://cdn.rawgit.com/gkatsev/vtt.js/vjs-v0.12.1/dist/vtt.min.js';
      script.onload = () => {
        /**
         * Fired when vtt.js is loaded.
         *
         * @event Tech#vttjsloaded
         * @type {EventTarget~Event}
         */
        this.trigger('vttjsloaded');
      };
      script.onerror = () => {
        /**
         * Fired when vtt.js was not loaded due to an error
         *
         * @event Tech#vttjsloaded
         * @type {EventTarget~Event}
         */
        this.trigger('vttjserror');
      };
      this.on('dispose', () => {
        script.onload = null;
        script.onerror = null;
      });
      // but have not loaded yet and we set it to true before the inject so that
      // we don't overwrite the injected window.WebVTT if it loads right away
      window.WebVTT = true;
      this.el().parentNode.appendChild(script);
    } else {
      this.ready(this.addWebVttScript_);
    }

  }

  /**
   * Emulate texttracks
   *
   * @method emulateTextTracks
   */
  emulateTextTracks() {
    const tracks = this.textTracks();

    if (!tracks) {
      return;
    }

    const remoteTracks = this.remoteTextTracks();
    const handleAddTrack = (e) => tracks.addTrack_(e.track);
    const handleRemoveTrack = (e) => tracks.removeTrack_(e.track);

    remoteTracks.on('addtrack', handleAddTrack);
    remoteTracks.on('removetrack', handleRemoveTrack);

    this.addWebVttScript_();

    const updateDisplay = () => this.trigger('texttrackchange');

    const textTracksChanges = () => {
      updateDisplay();

      for (let i = 0; i < tracks.length; i++) {
        const track = tracks[i];

        track.removeEventListener('cuechange', updateDisplay);
        if (track.mode === 'showing') {
          track.addEventListener('cuechange', updateDisplay);
        }
      }
    };

    textTracksChanges();
    tracks.addEventListener('change', textTracksChanges);

    this.on('dispose', function() {
      remoteTracks.off('addtrack', handleAddTrack);
      remoteTracks.off('removetrack', handleRemoveTrack);
      tracks.removeEventListener('change', textTracksChanges);

      for (let i = 0; i < tracks.length; i++) {
        const track = tracks[i];

        track.removeEventListener('cuechange', updateDisplay);
      }
    });
  }

  /**
   * Get the `Tech`s {@link VideoTrackList}.
   *
   * @return {VideoTrackList}
   *          The video track list that the Tech is currently using.
   */
  videoTracks() {
    this.videoTracks_ = this.videoTracks_ || new VideoTrackList();
    return this.videoTracks_;
  }

  /**
   * Get the `Tech`s {@link AudioTrackList}.
   *
   * @return {AudioTrackList}
   *          The audio track list that the Tech is currently using.
   */
  audioTracks() {
    this.audioTracks_ = this.audioTracks_ || new AudioTrackList();
    return this.audioTracks_;
  }

  /**
   * Get the `Tech`s {@link TextTrackList}.
   *
   * @return {TextTrackList}
   *          The text track list that the Tech is currently using.
   */
  textTracks() {
    this.textTracks_ = this.textTracks_ || new TextTrackList();
    return this.textTracks_;
  }

  /**
   * Get the `Tech`s remote {@link TextTrackList}, which is created from elements
   * that were added to the DOM.
   *
   * @return {TextTrackList}
   *          The remote text track list that the Tech is currently using.
   */
  remoteTextTracks() {
    this.remoteTextTracks_ = this.remoteTextTracks_ || new TextTrackList();
    return this.remoteTextTracks_;
  }

  /**
   * Get The `Tech`s  {HTMLTrackElementList}, which are the elements in the DOM that are
   * being used as TextTracks.
   *
   * @return {HTMLTrackElementList}
   *          The current HTML track elements that exist for the tech.
   */
  remoteTextTrackEls() {
    this.remoteTextTrackEls_ = this.remoteTextTrackEls_ || new HTMLTrackElementList();
    return this.remoteTextTrackEls_;
  }

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
  addTextTrack(kind, label, language) {
    if (!kind) {
      throw new Error('TextTrack kind is required but was not provided');
    }

    return createTrackHelper(this, kind, label, language);
  }

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
  createRemoteTextTrack(options) {
    const track = mergeOptions(options, {
      tech: this
    });

    return new HTMLTrackElement(track);
  }

  /**
   * Creates a remote text track object and returns an html track element.
   *
   * > Note: This can be an emulated {@link HTMLTrackElement} or a native one.
   *
   * @param {Object} options
   *        See {@link Tech#createRemoteTextTrack} for more detailed properties.
   *
   * @param {boolean} [manualCleanup=true]
   *        - When false: the TextTrack will be automatically removed from the video
   *          element whenever the source changes
   *        - When True: The TextTrack will have to be cleaned up manually
   *
   * @return {HTMLTrackElement}
   *         An Html Track Element.
   *
   * @deprecated The default functionality for this function will be equivalent
   *             to "manualCleanup=false" in the future. The manualCleanup parameter will
   *             also be removed.
   */
  addRemoteTextTrack(options = {}, manualCleanup) {
    const htmlTrackElement = this.createRemoteTextTrack(options);

    if (manualCleanup !== true && manualCleanup !== false) {
      // deprecation warning
      log.warn('Calling addRemoteTextTrack without explicitly setting the "manualCleanup" parameter to `true` is deprecated and default to `false` in future version of video.js');
      manualCleanup = true;
    }

    // store HTMLTrackElement and TextTrack to remote list
    this.remoteTextTrackEls().addTrackElement_(htmlTrackElement);
    this.remoteTextTracks().addTrack_(htmlTrackElement.track);

    if (manualCleanup !== true) {
      // create the TextTrackList if it doesn't exist
      this.autoRemoteTextTracks_.addTrack_(htmlTrackElement.track);
    }

    return htmlTrackElement;
  }

  /**
   * Remove a remote text track from the remote `TextTrackList`.
   *
   * @param {TextTrack} track
   *        `TextTrack` to remove from the `TextTrackList`
   */
  removeRemoteTextTrack(track) {
    const trackElement = this.remoteTextTrackEls().getTrackElementByTrack_(track);

    // remove HTMLTrackElement and TextTrack from remote list
    this.remoteTextTrackEls().removeTrackElement_(trackElement);
    this.remoteTextTracks().removeTrack_(track);
    this.autoRemoteTextTracks_.removeTrack_(track);
  }

  /**
   * A method to set a poster from a `Tech`.
   *
   * @abstract
   */
  setPoster() {}

  /*
   * Check if the tech can support the given mime-type.
   *
   * The base tech does not support any type, but source handlers might
   * overwrite this.
   *
   * @param  {string} type
   *         The mimetype to check for support
   *
   * @return {string}
   *         'probably', 'maybe', or empty string
   *
   * @see [Spec]{@link https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/canPlayType}
   *
   * @abstract
   */
  canPlayType() {
    return '';
  }

  /*
   * Return whether the argument is a Tech or not.
   * Can be passed either a Class like `Html5` or a instance like `player.tech_`
   *
   * @param {Object} component
   *        The item to check
   *
   * @return {boolean}
   *         Whether it is a tech or not
   *         - True if it is a tech
   *         - False if it is not
   */
  static isTech(component) {
    return component.prototype instanceof Tech ||
           component instanceof Tech ||
           component === Tech;
  }

  /**
   * Registers a `Tech` into a shared list for videojs.
   *
   * @param {string} name
   *        Name of the `Tech` to register.
   *
   * @param {Object} tech
   *        The `Tech` class to register.
   */
  static registerTech(name, tech) {
    if (!Tech.techs_) {
      Tech.techs_ = {};
    }

    if (!Tech.isTech(tech)) {
      throw new Error(`Tech ${name} must be a Tech`);
    }

    Tech.techs_[name] = tech;
    return tech;
  }

  /**
   * Get a `Tech` from the shared list by name.
   *
   * @param {string} name
   *        Name of the component to get
   *
   * @return {Tech|undefined}
   *         The `Tech` or undefined if there was no tech with the name requsted.
   */
  static getTech(name) {
    if (Tech.techs_ && Tech.techs_[name]) {
      return Tech.techs_[name];
    }

    if (window && window.videojs && window.videojs[name]) {
      log.warn(`The ${name} tech was added to the videojs object when it should be registered using videojs.registerTech(name, tech)`);
      return window.videojs[name];
    }
  }
}

/**
 * List of associated text tracks.
 *
 * @type {TextTrackList}
 * @private
 */
Tech.prototype.textTracks_; // eslint-disable-line

/**
 * List of associated audio tracks.
 *
 * @type {AudioTrackList}
 * @private
 */
Tech.prototype.audioTracks_; // eslint-disable-line

/**
 * List of associated video tracks.
 *
 * @type {VideoTrackList}
 * @private
 */
Tech.prototype.videoTracks_; // eslint-disable-line

/**
 * Boolean indicating wether the `Tech` supports volume control.
 *
 * @type {boolean}
 * @default
 */
Tech.prototype.featuresVolumeControl = true;

/**
 * Boolean indicating wether the `Tech` support fullscreen resize control.
 * Resizing plugins using request fullscreen reloads the plugin
 *
 * @type {boolean}
 * @default
 */
Tech.prototype.featuresFullscreenResize = false;

/**
 * Boolean indicating wether the `Tech` supports changing the speed at which the video
 * plays. Examples:
 *   - Set player to play 2x (twice) as fast
 *   - Set player to play 0.5x (half) as fast
 *
 * @type {boolean}
 * @default
 */
Tech.prototype.featuresPlaybackRate = false;

/**
 * Boolean indicating wether the `Tech` supports the `progress` event. This is currently
 * not triggered by video-js-swf. This will be used to determine if
 * {@link Tech#manualProgressOn} should be called.
 *
 * @type {boolean}
 * @default
 */
Tech.prototype.featuresProgressEvents = false;

/**
 * Boolean indicating wether the `Tech` supports the `timeupdate` event. This is currently
 * not triggered by video-js-swf. This will be used to determine if
 * {@link Tech#manualTimeUpdates} should be called.
 *
 * @type {boolean}
 * @default
 */
Tech.prototype.featuresTimeupdateEvents = false;

/**
 * Boolean indicating wether the `Tech` supports the native `TextTrack`s.
 * This will help us integrate with native `TextTrack`s if the browser supports them.
 *
 * @type {boolean}
 * @default
 */
Tech.prototype.featuresNativeTextTracks = false;

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
Tech.withSourceHandlers = function(_Tech) {

  /**
   * Register a source handler
   *
   * @param {Function} handler
   *        The source handler class
   *
   * @param {number} [index]
   *        Register it at the following index
   */
  _Tech.registerSourceHandler = function(handler, index) {
    let handlers = _Tech.sourceHandlers;

    if (!handlers) {
      handlers = _Tech.sourceHandlers = [];
    }

    if (index === undefined) {
      // add to the end of the list
      index = handlers.length;
    }

    handlers.splice(index, 0, handler);
  };

  /**
   * Check if the tech can support the given type. Also checks the
   * Techs sourceHandlers.
   *
   * @param {string} type
   *         The mimetype to check.
   *
   * @return {string}
   *         'probably', 'maybe', or '' (empty string)
   */
  _Tech.canPlayType = function(type) {
    const handlers = _Tech.sourceHandlers || [];
    let can;

    for (let i = 0; i < handlers.length; i++) {
      can = handlers[i].canPlayType(type);

      if (can) {
        return can;
      }
    }

    return '';
  };

  /**
   * Returns the first source handler that supports the source.
   *
   * TODO: Answer question: should 'probably' be prioritized over 'maybe'
   *
   * @param {Tech~SourceObject} source
   *        The source object
   *
   * @param {Object} options
   *        The options passed to the tech
   *
   * @return {SourceHandler|null}
   *          The first source handler that supports the source or null if
   *          no SourceHandler supports the source
   */
  _Tech.selectSourceHandler = function(source, options) {
    const handlers = _Tech.sourceHandlers || [];
    let can;

    for (let i = 0; i < handlers.length; i++) {
      can = handlers[i].canHandleSource(source, options);

      if (can) {
        return handlers[i];
      }
    }

    return null;
  };

  /**
   * Check if the tech can support the given source.
   *
   * @param {Tech~SourceObject} srcObj
   *        The source object
   *
   * @param {Object} options
   *        The options passed to the tech
   *
   * @return {string}
   *         'probably', 'maybe', or '' (empty string)
   */
  _Tech.canPlaySource = function(srcObj, options) {
    const sh = _Tech.selectSourceHandler(srcObj, options);

    if (sh) {
      return sh.canHandleSource(srcObj, options);
    }

    return '';
  };

  /**
   * When using a source handler, prefer its implementation of
   * any function normally provided by the tech.
   */
  const deferrable = [
    'seekable',
    'duration'
  ];

  /**
   * A wrapper around {@link Tech#seekable} that will call a `SourceHandler`s seekable
   * function if it exists, with a fallback to the Techs seekable function.
   *
   * @method _Tech.seekable
   */

  /**
   * A wrapper around {@link Tech#duration} that will call a `SourceHandler`s duration
   * function if it exists, otherwise it will fallback to the techs duration function.
   *
   * @method _Tech.duration
   */

  deferrable.forEach(function(fnName) {
    const originalFn = this[fnName];

    if (typeof originalFn !== 'function') {
      return;
    }

    this[fnName] = function() {
      if (this.sourceHandler_ && this.sourceHandler_[fnName]) {
        return this.sourceHandler_[fnName].apply(this.sourceHandler_, arguments);
      }
      return originalFn.apply(this, arguments);
    };
  }, _Tech.prototype);

  /**
   * Create a function for setting the source using a source object
   * and source handlers.
   * Should never be called unless a source handler was found.
   *
   * @param {Tech~SourceObject} source
   *        A source object with src and type keys
   *
   * @return {Tech}
   *         Returns itself; this method is chainable
   */
  _Tech.prototype.setSource = function(source) {
    let sh = _Tech.selectSourceHandler(source, this.options_);

    if (!sh) {
      // Fall back to a native source hander when unsupported sources are
      // deliberately set
      if (_Tech.nativeSourceHandler) {
        sh = _Tech.nativeSourceHandler;
      } else {
        log.error('No source hander found for the current source.');
      }
    }

    // Dispose any existing source handler
    this.disposeSourceHandler();
    this.off('dispose', this.disposeSourceHandler);

    if (sh !== _Tech.nativeSourceHandler) {
      this.currentSource_ = source;

      // Catch if someone replaced the src without calling setSource.
      // If they do, set currentSource_ to null and dispose our source handler.
      this.off(this.el_, 'loadstart', _Tech.prototype.firstLoadStartListener_);
      this.off(this.el_, 'loadstart', _Tech.prototype.successiveLoadStartListener_);
      this.one(this.el_, 'loadstart', _Tech.prototype.firstLoadStartListener_);
    }

    this.sourceHandler_ = sh.handleSource(source, this, this.options_);
    this.on('dispose', this.disposeSourceHandler);

    return this;
  };

  /**
   * Called once for the first loadstart of a video.
   *
   * @listens Tech#loadstart
   */
  _Tech.prototype.firstLoadStartListener_ = function() {
    this.one(this.el_, 'loadstart', _Tech.prototype.successiveLoadStartListener_);
  };

  // On successive loadstarts when setSource has not been called again
  /**
   * Called after the first loadstart for a video occurs.
   *
   * @listens Tech#loadstart
   */
  _Tech.prototype.successiveLoadStartListener_ = function() {
    this.disposeSourceHandler();
    this.one(this.el_, 'loadstart', _Tech.prototype.successiveLoadStartListener_);
  };

  /**
   * Clean up any existing SourceHandlers and listeners when the Tech is disposed.
   *
   * @listens Tech#dispose
   */
  _Tech.prototype.disposeSourceHandler = function() {
    // if we have a source and get another one
    // then we are loading something new
    // than clear all of our current tracks
    if (this.currentSource_) {
      this.clearTracks(['audio', 'video']);
      this.currentSource_ = null;
    }

    // always clean up auto-text tracks
    this.cleanupAutoTextTracks();

    if (this.sourceHandler_) {
      this.off(this.el_, 'loadstart', _Tech.prototype.firstLoadStartListener_);
      this.off(this.el_, 'loadstart', _Tech.prototype.successiveLoadStartListener_);

      if (this.sourceHandler_.dispose) {
        this.sourceHandler_.dispose();
      }

      this.sourceHandler_ = null;
    }
  };

};

Component.registerComponent('Tech', Tech);
// Old name for Tech
// @deprecated
Component.registerComponent('MediaTechController', Tech);
Tech.registerTech('Tech', Tech);
export default Tech;
