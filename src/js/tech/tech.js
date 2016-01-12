/**
 * @file tech.js
 * Media Technology Controller - Base class for media playback
 * technology controllers like Flash and HTML5
 */

import Component from '../component';
import HTMLTrackElement from '../tracks/html-track-element';
import HTMLTrackElementList from '../tracks/html-track-element-list';
import mergeOptions from '../utils/merge-options.js';
import TextTrack from '../tracks/text-track';
import TextTrackList from '../tracks/text-track-list';
import * as Fn from '../utils/fn.js';
import log from '../utils/log.js';
import { createTimeRange } from '../utils/time-ranges.js';
import { bufferedPercent } from '../utils/buffer.js';
import MediaError from '../media-error.js';
import window from 'global/window';
import document from 'global/document';

/**
 * Base class for media (HTML5 Video, Flash) controllers
 *
 * @param {Object=} options Options object
 * @param {Function=} ready Ready callback function
 * @extends Component
 * @class Tech
 */
class Tech extends Component {

  constructor(options={}, ready=function(){}){
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

    // Manually track progress in cases where the browser/flash player doesn't report it.
    if (!this.featuresProgressEvents) {
      this.manualProgressOn();
    }

    // Manually track timeupdates in cases where the browser/flash player doesn't report it.
    if (!this.featuresTimeupdateEvents) {
      this.manualTimeUpdatesOn();
    }

    if (options.nativeCaptions === false || options.nativeTextTracks === false) {
      this.featuresNativeTextTracks = false;
    }

    if (!this.featuresNativeTextTracks) {
      this.on('ready', this.emulateTextTracks);
    }

    this.initTextTrackListeners();

    // Turn on component tap events
    this.emitTapEvents();
  }

  /* Fallbacks for unsupported event types
  ================================================================================ */
  // Manually trigger progress events based on changes to the buffered amount
  // Many flash players and older HTML5 browsers don't send progress or progress-like events
  /**
   * Turn on progress events
   *
   * @method manualProgressOn
   */
  manualProgressOn() {
    this.on('durationchange', this.onDurationChange);

    this.manualProgress = true;

    // Trigger progress watching when a source begins loading
    this.one('ready', this.trackProgress);
  }

  /**
   * Turn off progress events
   *
   * @method manualProgressOff
   */
  manualProgressOff() {
    this.manualProgress = false;
    this.stopTrackingProgress();

    this.off('durationchange', this.onDurationChange);
  }

  /**
   * Track progress
   *
   * @method trackProgress
   */
  trackProgress() {
    this.stopTrackingProgress();
    this.progressInterval = this.setInterval(Fn.bind(this, function(){
      // Don't trigger unless buffered amount is greater than last time

      let numBufferedPercent = this.bufferedPercent();

      if (this.bufferedPercent_ !== numBufferedPercent) {
        this.trigger('progress');
      }

      this.bufferedPercent_ = numBufferedPercent;

      if (numBufferedPercent === 1) {
        this.stopTrackingProgress();
      }
    }), 500);
  }

  /**
   * Update duration
   *
   * @method onDurationChange
   */
  onDurationChange() {
    this.duration_ = this.duration();
  }

  /**
   * Create and get TimeRange object for buffering
   *
   * @return {TimeRangeObject}
   * @method buffered
   */
  buffered() {
    return createTimeRange(0, 0);
  }

  /**
   * Get buffered percent
   *
   * @return {Number}
   * @method bufferedPercent
   */
  bufferedPercent() {
    return bufferedPercent(this.buffered(), this.duration_);
  }

  /**
   * Stops tracking progress by clearing progress interval
   *
   * @method stopTrackingProgress
   */
  stopTrackingProgress() {
    this.clearInterval(this.progressInterval);
  }

  /*! Time Tracking -------------------------------------------------------------- */
  /**
   * Set event listeners for on play and pause and tracking current time
   *
   * @method manualTimeUpdatesOn
   */
  manualTimeUpdatesOn() {
    this.manualTimeUpdates = true;

    this.on('play', this.trackCurrentTime);
    this.on('pause', this.stopTrackingCurrentTime);
  }

  /**
   * Remove event listeners for on play and pause and tracking current time
   *
   * @method manualTimeUpdatesOff
   */
  manualTimeUpdatesOff() {
    this.manualTimeUpdates = false;
    this.stopTrackingCurrentTime();
    this.off('play', this.trackCurrentTime);
    this.off('pause', this.stopTrackingCurrentTime);
  }

  /**
   * Tracks current time
   *
   * @method trackCurrentTime
   */
  trackCurrentTime() {
    if (this.currentTimeInterval) { this.stopTrackingCurrentTime(); }
    this.currentTimeInterval = this.setInterval(function(){
      this.trigger({ type: 'timeupdate', target: this, manuallyTriggered: true });
    }, 250); // 42 = 24 fps // 250 is what Webkit uses // FF uses 15
  }

  /**
   * Turn off play progress tracking (when paused or dragging)
   *
   * @method stopTrackingCurrentTime
   */
  stopTrackingCurrentTime() {
    this.clearInterval(this.currentTimeInterval);

    // #1002 - if the video ends right before the next timeupdate would happen,
    // the progress bar won't make it all the way to the end
    this.trigger({ type: 'timeupdate', target: this, manuallyTriggered: true });
  }

  /**
   * Turn off any manual progress or timeupdate tracking
   *
   * @method dispose
   */
  dispose() {
    // clear out text tracks because we can't reuse them between techs
    let textTracks = this.textTracks();

    if (textTracks) {
      let i = textTracks.length;
      while(i--) {
        this.removeRemoteTextTrack(textTracks[i]);
      }
    }

    // Turn off any manual progress or timeupdate tracking
    if (this.manualProgress) { this.manualProgressOff(); }

    if (this.manualTimeUpdates) { this.manualTimeUpdatesOff(); }

    super.dispose();
  }

  /**
   * Reset the tech. Removes all sources and resets readyState.
   *
   * @method reset
   */
  reset() {}

  /**
   * When invoked without an argument, returns a MediaError object
   * representing the current error state of the player or null if
   * there is no error. When invoked with an argument, set the current
   * error state of the player.
   * @param {MediaError=} err    Optional an error object
   * @return {MediaError}        the current error object or null
   * @method error
   */
  error(err) {
    if (err !== undefined) {
      if (err instanceof MediaError) {
        this.error_ = err;
      } else {
        this.error_ = new MediaError(err);
      }
      this.trigger('error');
    }
    return this.error_;
  }

  /**
   * Return the time ranges that have been played through for the
   * current source. This implementation is incomplete. It does not
   * track the played time ranges, only whether the source has played
   * at all or not.
   * @return {TimeRangeObject} a single time range if this video has
   * played or an empty set of ranges if not.
   * @method played
   */
  played() {
    if (this.hasStarted_) {
      return createTimeRange(0, 0);
    }
    return createTimeRange();
  }

  /**
   * Set current time
   *
   * @method setCurrentTime
   */
  setCurrentTime() {
    // improve the accuracy of manual timeupdates
    if (this.manualTimeUpdates) { this.trigger({ type: 'timeupdate', target: this, manuallyTriggered: true }); }
  }

  /**
   * Initialize texttrack listeners
   *
   * @method initTextTrackListeners
   */
  initTextTrackListeners() {
    let textTrackListChanges = Fn.bind(this, function() {
      this.trigger('texttrackchange');
    });

    let tracks = this.textTracks();

    if (!tracks) return;

    tracks.addEventListener('removetrack', textTrackListChanges);
    tracks.addEventListener('addtrack', textTrackListChanges);

    this.on('dispose', Fn.bind(this, function() {
      tracks.removeEventListener('removetrack', textTrackListChanges);
      tracks.removeEventListener('addtrack', textTrackListChanges);
    }));
  }

  /**
   * Emulate texttracks
   *
   * @method emulateTextTracks
   */
  emulateTextTracks() {
    let tracks = this.textTracks();
    if (!tracks) {
      return;
    }

    if (!window['WebVTT'] && this.el().parentNode != null) {
      let script = document.createElement('script');
      script.src = this.options_['vtt.js'] || '../node_modules/videojs-vtt.js/dist/vtt.js';
      this.el().parentNode.appendChild(script);
      window['WebVTT'] = true;
    }

    let updateDisplay = () => this.trigger('texttrackchange');
    let textTracksChanges = () => {
      updateDisplay();

      for (let i = 0; i < tracks.length; i++) {
        let track = tracks[i];
        track.removeEventListener('cuechange', updateDisplay);
        if (track.mode === 'showing') {
          track.addEventListener('cuechange', updateDisplay);
        }
      }
    };

    textTracksChanges();
    tracks.addEventListener('change', textTracksChanges);

    this.on('dispose', function() {
      tracks.removeEventListener('change', textTracksChanges);
    });
  }

  /*
   * Provide default methods for text tracks.
   *
   * Html5 tech overrides these.
   */

  /**
   * Get texttracks
   *
   * @returns {TextTrackList}
   * @method textTracks
   */
  textTracks() {
    this.textTracks_ = this.textTracks_ || new TextTrackList();
    return this.textTracks_;
  }

  /**
   * Get remote texttracks
   *
   * @returns {TextTrackList}
   * @method remoteTextTracks
   */
  remoteTextTracks() {
    this.remoteTextTracks_ = this.remoteTextTracks_ || new TextTrackList();
    return this.remoteTextTracks_;
  }

  /**
   * Get remote htmltrackelements
   *
   * @returns {HTMLTrackElementList}
   * @method remoteTextTrackEls
   */
  remoteTextTrackEls() {
    this.remoteTextTrackEls_ = this.remoteTextTrackEls_ || new HTMLTrackElementList();
    return this.remoteTextTrackEls_;
  }

  /**
   * Creates and returns a remote text track object
   *
   * @param {String} kind Text track kind (subtitles, captions, descriptions
   *                                       chapters and metadata)
   * @param {String=} label Label to identify the text track
   * @param {String=} language Two letter language abbreviation
   * @return {TextTrackObject}
   * @method addTextTrack
   */
  addTextTrack(kind, label, language) {
    if (!kind) {
      throw new Error('TextTrack kind is required but was not provided');
    }

    return createTrackHelper(this, kind, label, language);
  }

  /**
   * Creates a remote text track object and returns a emulated html track element
   *
   * @param {Object} options The object should contain values for
   * kind, language, label and src (location of the WebVTT file)
   * @return {HTMLTrackElement}
   * @method addRemoteTextTrack
   */
  addRemoteTextTrack(options) {
    let track = mergeOptions(options, {
      tech: this
    });

    let htmlTrackElement = new HTMLTrackElement(track);

    // store HTMLTrackElement and TextTrack to remote list
    this.remoteTextTrackEls().addTrackElement_(htmlTrackElement);
    this.remoteTextTracks().addTrack_(htmlTrackElement.track);

    // must come after remoteTextTracks()
    this.textTracks().addTrack_(htmlTrackElement.track);

    return htmlTrackElement;
  }

  /**
   * Remove remote texttrack
   *
   * @param {TextTrackObject} track Texttrack to remove
   * @method removeRemoteTextTrack
   */
  removeRemoteTextTrack(track) {
    this.textTracks().removeTrack_(track);

    let trackElement = this.remoteTextTrackEls().getTrackElementByTrack_(track);

    // remove HTMLTrackElement and TextTrack from remote list
    this.remoteTextTrackEls().removeTrackElement_(trackElement);
    this.remoteTextTracks().removeTrack_(track);
  }

  /**
   * Provide a default setPoster method for techs
   * Poster support for techs should be optional, so we don't want techs to
   * break if they don't have a way to set a poster.
   *
   * @method setPoster
   */
  setPoster() {}

  /*
   * Check if the tech can support the given type
   *
   * The base tech does not support any type, but source handlers might
   * overwrite this.
   *
   * @param  {String} type    The mimetype to check
   * @return {String}         'probably', 'maybe', or '' (empty string)
   */
  canPlayType() {
    return '';
  }

  /*
   * Return whether the argument is a Tech or not.
   * Can be passed either a Class like `Html5` or a instance like `player.tech_`
   *
   * @param {Object} component An item to check
   * @return {Boolean}         Whether it is a tech or not
   */
  static isTech(component) {
    return component.prototype instanceof Tech ||
           component instanceof Tech ||
           component === Tech;
  }

  /**
   * Registers a Tech
   *
   * @param {String} name Name of the Tech to register
   * @param {Object} tech The tech to register
   * @static
   * @method registerComponent
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
   * Gets a component by name
   *
   * @param {String} name Name of the component to get
   * @return {Component}
   * @static
   * @method getComponent
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

/*
 * List of associated text tracks
 *
 * @type {Array}
 * @private
 */
Tech.prototype.textTracks_;

var createTrackHelper = function(self, kind, label, language, options={}) {
  let tracks = self.textTracks();

  options.kind = kind;

  if (label) {
    options.label = label;
  }
  if (language) {
    options.language = language;
  }
  options.tech = self;

  let track = new TextTrack(options);
  tracks.addTrack_(track);

  return track;
};

Tech.prototype.featuresVolumeControl = true;

// Resizing plugins using request fullscreen reloads the plugin
Tech.prototype.featuresFullscreenResize = false;
Tech.prototype.featuresPlaybackRate = false;

// Optional events that we can manually mimic with timers
// currently not triggered by video-js-swf
Tech.prototype.featuresProgressEvents = false;
Tech.prototype.featuresTimeupdateEvents = false;

Tech.prototype.featuresNativeTextTracks = false;

/*
 * A functional mixin for techs that want to use the Source Handler pattern.
 *
 * ##### EXAMPLE:
 *
 *   Tech.withSourceHandlers.call(MyTech);
 *
 */
Tech.withSourceHandlers = function(_Tech){
   /*
    * Register a source handler
    * Source handlers are scripts for handling specific formats.
    * The source handler pattern is used for adaptive formats (HLS, DASH) that
    * manually load video data and feed it into a Source Buffer (Media Source Extensions)
    * @param  {Function} handler  The source handler
    * @param  {Boolean}  first    Register it before any existing handlers
    */
   _Tech.registerSourceHandler = function(handler, index){
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

  /*
   * Check if the tech can support the given type
   * @param  {String} type    The mimetype to check
   * @return {String}         'probably', 'maybe', or '' (empty string)
   */
  _Tech.canPlayType = function(type){
    let handlers = _Tech.sourceHandlers || [];
    let can;

    for (let i = 0; i < handlers.length; i++) {
      can = handlers[i].canPlayType(type);

      if (can) {
        return can;
      }
    }

    return '';
  };

   /*
    * Return the first source handler that supports the source
    * TODO: Answer question: should 'probably' be prioritized over 'maybe'
    * @param  {Object} source The source object
    * @returns {Object}       The first source handler that supports the source
    * @returns {null}         Null if no source handler is found
    */
   _Tech.selectSourceHandler = function(source){
    let handlers = _Tech.sourceHandlers || [];
    let can;

    for (let i = 0; i < handlers.length; i++) {
      can = handlers[i].canHandleSource(source);

      if (can) {
        return handlers[i];
      }
    }

    return null;
  };

  /*
   * Check if the tech can support the given source
   * @param  {Object} srcObj  The source object
   * @return {String}         'probably', 'maybe', or '' (empty string)
   */
  _Tech.canPlaySource = function(srcObj){
    let sh = _Tech.selectSourceHandler(srcObj);

    if (sh) {
      return sh.canHandleSource(srcObj);
    }

    return '';
  };

  /*
   * When using a source handler, prefer its implementation of
   * any function normally provided by the tech.
   */
  let deferrable = [
      'seekable',
      'duration'
    ];

  deferrable.forEach(function (fnName) {
    let originalFn = this[fnName];

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

   /*
    * Create a function for setting the source using a source object
    * and source handlers.
    * Should never be called unless a source handler was found.
    * @param {Object} source  A source object with src and type keys
    * @return {Tech} self
    */
   _Tech.prototype.setSource = function(source){
    let sh = _Tech.selectSourceHandler(source);

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

    this.currentSource_ = source;
    this.sourceHandler_ = sh.handleSource(source, this);
    this.on('dispose', this.disposeSourceHandler);

    return this;
  };

   /*
    * Clean up any existing source handler
    */
   _Tech.prototype.disposeSourceHandler = function(){
    if (this.sourceHandler_ && this.sourceHandler_.dispose) {
      this.sourceHandler_.dispose();
    }
  };

};

Component.registerComponent('Tech', Tech);
// Old name for Tech
Component.registerComponent('MediaTechController', Tech);
Tech.registerTech('Tech', Tech);
export default Tech;
