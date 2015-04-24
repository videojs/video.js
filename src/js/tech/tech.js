/**
 * @fileoverview Media Technology Controller - Base class for media playback
 * technology controllers like Flash and HTML5
 */

import Component from '../component';
import TextTrack from '../tracks/text-track';
import TextTrackList from '../tracks/text-track-list';
import * as Lib from '../lib';
import window from 'global/window';
import document from 'global/document';

/**
 * Base class for media (HTML5 Video, Flash) controllers
 * @param {vjs.Player|Object} player  Central player instance
 * @param {Object=} options Options object
 * @constructor
 */
class Tech extends Component {

  constructor(player, options, ready){
    options = options || {};
    // we don't want the tech to report user activity automatically.
    // This is done manually in addControlsListeners
    options.reportTouchActivity = false;
    super(player, options, ready);

    // Manually track progress in cases where the browser/flash player doesn't report it.
    if (!this['featuresProgressEvents']) {
      this.manualProgressOn();
    }

    // Manually track timeupdates in cases where the browser/flash player doesn't report it.
    if (!this['featuresTimeupdateEvents']) {
      this.manualTimeUpdatesOn();
    }

    this.initControlsListeners();

    if (options['nativeCaptions'] === false || options['nativeTextTracks'] === false) {
      this['featuresNativeTextTracks'] = false;
    }

    if (!this['featuresNativeTextTracks']) {
      this.emulateTextTracks();
    }

    this.initTextTrackListeners();
    this.userActive_ = true;
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
      this.controls_ = !!this.options.controls;

      // Set up event listeners once the tech is ready and has an element to apply
      // listeners to
      if (this.controls_ && !this.nativeControls_) {
        this.addControlsListener();
      }

      if (this.networkState && this.networkState() > 0) {
        this.trigger('loadstart');
      }
    });
  }

  setControls(bool) {
    this.controls_ = bool;

    if (bool) {
      if (this.controls_ && !this.nativeControls_) {
        this.addControlsListener();
      }
    } else {
      this.removeControlsListeners();
    }
  }

  setNativeControls(bool) {
    this.nativeControls_ = bool;
  }

  setUserActive(bool) {
    this.userActive_ = bool;
  }

  addControlsListeners() {
    let userWasActive;

    // Some browsers (Chrome & IE) don't trigger a click on a flash swf, but do
    // trigger mousedown/up.
    // http://stackoverflow.com/questions/1444562/javascript-onclick-event-over-flash-object
    // Any touch events are set to block the mousedown event from happening
    this.on('mousedown', this.onClick);

    // Track the pause status
    this.on('play', this.onPlay);
    this.on('pause', this.onPause);

    // If the controls were hidden we don't want that to change without a tap event
    // so we'll check if the controls were already showing before reporting user
    // activity
    this.on('touchstart', function(event) {
      userWasActive = this.userActive_;
    });

    this.on('touchmove', function(event) {
      if (userWasActive){
        this.trigger('useractive');
      }
    });

    this.on('touchend', function(event) {
      // Stop the mouse events from also happening
      event.preventDefault();
    });

    // Turn on component tap events
    this.emitTapEvents();

    // The tap listener needs to come after the touchend listener because the tap
    // listener cancels out any reportedUserActivity when setting userActive(false)
    this.on('tap', this.onTap);
  }

  /**
   * Remove the listeners used for click and tap controls. This is needed for
   * toggling to controls disabled, where a tap/touch should do nothing.
   */
  removeControlsListeners() {
    // We don't want to just use `this.off()` because there might be other needed
    // listeners added by techs that extend this.
    this.off('tap');
    this.off('touchstart');
    this.off('touchmove');
    this.off('touchleave');
    this.off('touchcancel');
    this.off('touchend');
    this.off('click');
    this.off('pause', this.onPause); // event also used to track time
    this.off('play', this.onPlay); // event also used to track time
    this.off('mousedown');
  }

  /**
   * Handle a click on the media element. By default will play/pause the media.
   */
  onClick(event) {
    // We're using mousedown to detect clicks thanks to Flash, but mousedown
    // will also be triggered with right-clicks, so we need to prevent that
    if (event.button !== 0) return;

    // When controls are disabled a click should not toggle playback because
    // the click is considered a control
    if (this.controls_) {
      if (this.paused_) {
        this.trigger('play');
      } else {
        this.trigger('pause');
      }
    }
  }

  onPlay() {
    this.paused_ = false;
  }

  onPause() {
    this.paused_ = true;
  }

  /**
   * Handle a tap on the media element. By default it will toggle the user
   * activity state, which hides and shows the controls.
   */
  onTap() {
    if (this.userActive_) {
      this.trigger('userinactive');
    } else {
      this.trigger('useractive');
    }
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
    this.progressInterval = this.setInterval(Lib.bind(this, function(){
      // Don't trigger unless buffered amount is greater than last time

      let bufferedPercent = this.bufferedPercent();

      if (this.bufferedPercent_ !== bufferedPercent) {
        this.trigger('progress');
      }

      this.bufferedPercent_ = bufferedPercent;

      if (bufferedPercent === 1) {
        this.stopTrackingProgress();
      }
    }), 500);
  }

  onDurationChange() {
    this.duration_ = this.duration();
  }

  bufferedPercent() {
    let bufferedDuration = 0,
        start, end;

    if (!this.duration_) {
      return 0;
    }

    let buffered = this.buffered();

    if (!buffered || !buffered.length) {
      buffered = Lib.createTimeRange(0,0);
    }

    for (var i=0; i<buffered.length; i++){
      start = buffered.start(i);
      end   = buffered.end(i);

      // buffered end can be bigger than duration by a very small fraction
      if (end > this.duration_) {
        end = this.duration_;
      }

      bufferedDuration += end - start;
    }

    return bufferedDuration / this.duration_;
  }

  stopTrackingProgress() {
    this.clearInterval(this.progressInterval);
  }

  /*! Time Tracking -------------------------------------------------------------- */
  manualTimeUpdatesOn() {
    this.manualTimeUpdates = true;

    this.on('play', this.trackCurrentTime);
    this.on('pause', this.stopTrackingCurrentTime);
    // timeupdate is also called by .currentTime whenever current time is set

    // Watch for native timeupdate event
    this.one('timeupdate', function(){
      // Update known progress support for this playback technology
      this['featuresTimeupdateEvents'] = true;
      // Turn off manual progress tracking
      this.manualTimeUpdatesOff();
    });
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
      this.trigger('timeupdate');
    }, 250); // 42 = 24 fps // 250 is what Webkit uses // FF uses 15
  }

  // Turn off play progress tracking (when paused or dragging)
  stopTrackingCurrentTime() {
    this.clearInterval(this.currentTimeInterval);

    // #1002 - if the video ends right before the next timeupdate would happen,
    // the progress bar won't make it all the way to the end
    this.trigger('timeupdate');
  }

  dispose() {
    // Turn off any manual progress or timeupdate tracking
    if (this.manualProgress) { this.manualProgressOff(); }

    if (this.manualTimeUpdates) { this.manualTimeUpdatesOff(); }

    super.dispose();
  }

  setCurrentTime() {
    // improve the accuracy of manual timeupdates
    if (this.manualTimeUpdates) { this.trigger('timeupdate'); }
  }

  // TODO: Consider looking at moving this into the text track display directly
  // https://github.com/videojs/video.js/issues/1863
  initTextTrackListeners() {
    let textTrackListChanges = Lib.bind(this, function() {
      this.trigger('texttrackchange');
    });

    let tracks = this.textTracks();

    if (!tracks) return;

    tracks.addEventListener('removetrack', textTrackListChanges);
    tracks.addEventListener('addtrack', textTrackListChanges);

    this.on('dispose', Lib.bind(this, function() {
      tracks.removeEventListener('removetrack', textTrackListChanges);
      tracks.removeEventListener('addtrack', textTrackListChanges);
    }));
  }

  emulateTextTracks() {
    if (!window['WebVTT']) {
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
      this.trigger('texttrackchange');

      for (let i = 0; i < this.length; i++) {
        let track = this[i];
        track.removeEventListener('cuechange', Lib.bind(textTrackDisplay, textTrackDisplay.updateDisplay));
        if (track.mode === 'showing') {
          track.addEventListener('cuechange', Lib.bind(textTrackDisplay, textTrackDisplay.updateDisplay));
        }
      }
    };

    tracks.addEventListener('change', textTracksChanges);

    this.on('dispose', Lib.bind(this, function() {
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
    let track = createTrackHelper(this, options['kind'], options['label'], options['language'], options);
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

var createTrackHelper = function(self, kind, label, language, options) {
  let tracks = self.textTracks();

  options = options || {};

  options['kind'] = kind;
  if (label) {
    options['label'] = label;
  }
  if (language) {
    options['language'] = language;
  }
  options.tech = self;

  let track = new TextTrack(options);
  tracks.addTrack_(track);

  return track;
};

Tech.prototype['featuresVolumeControl'] = true;

// Resizing plugins using request fullscreen reloads the plugin
Tech.prototype['featuresFullscreenResize'] = false;
Tech.prototype['featuresPlaybackRate'] = false;

// Optional events that we can manually mimic with timers
// currently not triggered by video-js-swf
Tech.prototype['featuresProgressEvents'] = false;
Tech.prototype['featuresTimeupdateEvents'] = false;

Tech.prototype['featuresNativeTextTracks'] = false;

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
        Lib.log.error('No source hander found for the current source.');
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
