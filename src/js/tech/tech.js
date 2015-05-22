/**
 * @fileoverview Media Technology Controller - Base class for media playback
 * technology controllers like Flash and HTML5
 */

import Component from '../component';
import TextTrack from '../tracks/text-track';
import TextTrackList from '../tracks/text-track-list';
import * as Fn from '../utils/fn.js';
import log from '../utils/log.js';
import { createTimeRange } from '../utils/time-ranges.js';
import { bufferedPercent } from '../utils/buffer.js';
import window from 'global/window';
import document from 'global/document';

/**
 * Base class for media (HTML5 Video, Flash) controllers
 * @param {Player|Object} player  Central player instance
 * @param {Object=} options Options object
 * @constructor
 */
class Tech extends Component {

  constructor(options={}, ready=function(){}){
    // we don't want the tech to report user activity automatically.
    // This is done manually in addControlsListeners
    options.reportTouchActivity = false;
    super(null, options, ready);

    this.textTracks_ = options.textTracks;

    // Manually track progress in cases where the browser/flash player doesn't report it.
    if (!this.featuresProgressEvents) {
      this.manualProgressOn();
    }

    // Manually track timeupdates in cases where the browser/flash player doesn't report it.
    if (!this.featuresTimeupdateEvents) {
      this.manualTimeUpdatesOn();
    }

    this.initControlsListeners();

    if (options.nativeCaptions === false || options.nativeTextTracks === false) {
      this.featuresNativeTextTracks = false;
    }

    if (!this.featuresNativeTextTracks) {
      this.emulateTextTracks();
    }

    this.initTextTrackListeners();

    // Turn on component tap events
    this.emitTapEvents();
  }

  /**
   * Set up click and touch listeners for the playback element
   * On desktops, a click on the video itself will toggle playback,
   * on a mobile device a click on the video toggles controls.
   * (toggling controls is done by toggling the user state between active and
   * inactive)
   *
   * A tap can signal that a user has become active, or has become inactive
   * e.g. a quick tap on an iPhone movie should reveal the controls. Another
   * quick tap should hide them again (signaling the user is in an inactive
   * viewing state)
   *
   * In addition to this, we still want the user to be considered inactive after
   * a few seconds of inactivity.
   *
   * Note: the only part of iOS interaction we can't mimic with this setup
   * is a touch and hold on the video element counting as activity in order to
   * keep the controls showing, but that shouldn't be an issue. A touch and hold on
   * any controls will still keep the user active
   */
  initControlsListeners() {
    // if we're loading the playback object after it has started loading or playing the
    // video (often with autoplay on) then the loadstart event has already fired and we
    // need to fire it manually because many things rely on it.
    // Long term we might consider how we would do this for other events like 'canplay'
    // that may also have fired.
    this.ready(function(){
      if (this.networkState && this.networkState() > 0) {
        this.trigger('loadstart');
      }
    });
  }

  /* Fallbacks for unsupported event types
  ================================================================================ */
  // Manually trigger progress events based on changes to the buffered amount
  // Many flash players and older HTML5 browsers don't send progress or progress-like events
  manualProgressOn() {
    this.on('durationchange', this.onDurationChange);

    this.manualProgress = true;

    // Trigger progress watching when a source begins loading
    this.trackProgress();
  }

  manualProgressOff() {
    this.manualProgress = false;
    this.stopTrackingProgress();

    this.off('durationchange', this.onDurationChange);
  }

  trackProgress() {
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

  onDurationChange() {
    this.duration_ = this.duration();
  }

  buffered() {
    return createTimeRange(0, 0);
  }

  bufferedPercent() {
    return bufferedPercent(this.buffered(), this.duration_);
  }

  stopTrackingProgress() {
    this.clearInterval(this.progressInterval);
  }

  /*! Time Tracking -------------------------------------------------------------- */
  manualTimeUpdatesOn() {
    this.manualTimeUpdates = true;

    this.on('play', this.trackCurrentTime);
    this.on('pause', this.stopTrackingCurrentTime);
  }

  manualTimeUpdatesOff() {
    this.manualTimeUpdates = false;
    this.stopTrackingCurrentTime();
    this.off('play', this.trackCurrentTime);
    this.off('pause', this.stopTrackingCurrentTime);
  }

  trackCurrentTime() {
    if (this.currentTimeInterval) { this.stopTrackingCurrentTime(); }
    this.currentTimeInterval = this.setInterval(function(){
      this.trigger({ type: 'timeupdate', target: this, manuallyTriggered: true });
    }, 250); // 42 = 24 fps // 250 is what Webkit uses // FF uses 15
  }

  // Turn off play progress tracking (when paused or dragging)
  stopTrackingCurrentTime() {
    this.clearInterval(this.currentTimeInterval);

    // #1002 - if the video ends right before the next timeupdate would happen,
    // the progress bar won't make it all the way to the end
    this.trigger({ type: 'timeupdate', target: this, manuallyTriggered: true });
  }

  dispose() {
    // Turn off any manual progress or timeupdate tracking
    if (this.manualProgress) { this.manualProgressOff(); }

    if (this.manualTimeUpdates) { this.manualTimeUpdatesOff(); }

    super.dispose();
  }

  setCurrentTime() {
    // improve the accuracy of manual timeupdates
    if (this.manualTimeUpdates) { this.trigger({ type: 'timeupdate', target: this, manuallyTriggered: true }); }
  }

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

  emulateTextTracks() {
    if (!window['WebVTT'] && this.el().parentNode != null) {
      let script = document.createElement('script');
      script.src = this.options_['vtt.js'] || '../node_modules/vtt.js/dist/vtt.js';
      this.el().parentNode.appendChild(script);
      window['WebVTT'] = true;
    }

    let tracks = this.textTracks();
    if (!tracks) {
      return;
    }

    let textTracksChanges = function() {
      let updateDisplay = Fn.bind(this, function() {
        this.trigger('texttrackchange');
      });

      this.trigger('texttrackchange');

      for (let i = 0; i < this.length; i++) {
        let track = this[i];
        track.removeEventListener('cuechange', updateDisplay);
        if (track.mode === 'showing') {
          track.addEventListener('cuechange', updateDisplay);
        }
      }
    };

    tracks.addEventListener('change', textTracksChanges);

    this.on('dispose', Fn.bind(this, function() {
      tracks.removeEventListener('change', textTracksChanges);
    }));
  }

  /**
   * Provide default methods for text tracks.
   *
   * Html5 tech overrides these.
   */

  textTracks() {
    this.textTracks_ = this.textTracks_ || new TextTrackList();
    return this.textTracks_;
  }

  remoteTextTracks() {
    this.remoteTextTracks_ = this.remoteTextTracks_ || new TextTrackList();
    return this.remoteTextTracks_;
  }

  addTextTrack(kind, label, language) {
    if (!kind) {
      throw new Error('TextTrack kind is required but was not provided');
    }

    return createTrackHelper(this, kind, label, language);
  }

  addRemoteTextTrack(options) {
    let track = createTrackHelper(this, options.kind, options.label, options.language, options);
    this.remoteTextTracks().addTrack_(track);
    return {
      track: track
    };
  }

  removeRemoteTextTrack(track) {
    this.textTracks().removeTrack_(track);
    this.remoteTextTracks().removeTrack_(track);
  }

  /**
   * Provide a default setPoster method for techs
   *
   * Poster support for techs should be optional, so we don't want techs to
   * break if they don't have a way to set a poster.
   */
  setPoster() {}

}

/**
 * List of associated text tracks
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

/**
 * A functional mixin for techs that want to use the Source Handler pattern.
 *
 * ##### EXAMPLE:
 *
 *   Tech.withSourceHandlers.call(MyTech);
 *
 */
Tech.withSourceHandlers = function(_Tech){
  /**
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

  /**
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

  /**
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

  /**
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

  /**
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
export default Tech;
