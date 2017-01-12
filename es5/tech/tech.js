'use strict';

exports.__esModule = true;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _component = require('../component');

var _component2 = _interopRequireDefault(_component);

var _htmlTrackElement = require('../tracks/html-track-element');

var _htmlTrackElement2 = _interopRequireDefault(_htmlTrackElement);

var _htmlTrackElementList = require('../tracks/html-track-element-list');

var _htmlTrackElementList2 = _interopRequireDefault(_htmlTrackElementList);

var _mergeOptions = require('../utils/merge-options.js');

var _mergeOptions2 = _interopRequireDefault(_mergeOptions);

var _textTrack = require('../tracks/text-track');

var _textTrack2 = _interopRequireDefault(_textTrack);

var _textTrackList = require('../tracks/text-track-list');

var _textTrackList2 = _interopRequireDefault(_textTrackList);

var _videoTrackList = require('../tracks/video-track-list');

var _videoTrackList2 = _interopRequireDefault(_videoTrackList);

var _audioTrackList = require('../tracks/audio-track-list');

var _audioTrackList2 = _interopRequireDefault(_audioTrackList);

var _fn = require('../utils/fn.js');

var Fn = _interopRequireWildcard(_fn);

var _log = require('../utils/log.js');

var _log2 = _interopRequireDefault(_log);

var _timeRanges = require('../utils/time-ranges.js');

var _buffer = require('../utils/buffer.js');

var _mediaError = require('../media-error.js');

var _mediaError2 = _interopRequireDefault(_mediaError);

var _window = require('global/window');

var _window2 = _interopRequireDefault(_window);

var _document = require('global/document');

var _document2 = _interopRequireDefault(_document);

var _obj = require('../utils/obj');

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * @file tech.js
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                */

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
function createTrackHelper(self, kind, label, language) {
  var options = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : {};

  var tracks = self.textTracks();

  options.kind = kind;

  if (label) {
    options.label = label;
  }
  if (language) {
    options.language = language;
  }
  options.tech = self;

  var track = new _textTrack2['default'](options);

  tracks.addTrack_(track);

  return track;
}

/**
 * This is the base class for media playback technology controllers, such as
 * {@link Flash} and {@link HTML5}
 *
 * @extends Component
 */

var Tech = function (_Component) {
  _inherits(Tech, _Component);

  /**
   * Create an instance of this Tech.
   *
   * @param {Object} [options]
   *        The key/value store of player options.
   *
   * @param {Component~ReadyCallback} ready
   *        Callback function to call when the `HTML5` Tech is ready.
   */
  function Tech() {
    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    var ready = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : function () {};

    _classCallCheck(this, Tech);

    // we don't want the tech to report user activity automatically.
    // This is done manually in addControlsListeners
    options.reportTouchActivity = false;

    // keep track of whether the current source has played at all to
    // implement a very limited played()
    var _this = _possibleConstructorReturn(this, _Component.call(this, null, options, ready));

    _this.hasStarted_ = false;
    _this.on('playing', function () {
      this.hasStarted_ = true;
    });
    _this.on('loadstart', function () {
      this.hasStarted_ = false;
    });

    _this.textTracks_ = options.textTracks;
    _this.videoTracks_ = options.videoTracks;
    _this.audioTracks_ = options.audioTracks;

    // Manually track progress in cases where the browser/flash player doesn't report it.
    if (!_this.featuresProgressEvents) {
      _this.manualProgressOn();
    }

    // Manually track timeupdates in cases where the browser/flash player doesn't report it.
    if (!_this.featuresTimeupdateEvents) {
      _this.manualTimeUpdatesOn();
    }

    ['Text', 'Audio', 'Video'].forEach(function (track) {
      if (options['native' + track + 'Tracks'] === false) {
        _this['featuresNative' + track + 'Tracks'] = false;
      }
    });

    if (options.nativeCaptions === false) {
      _this.featuresNativeTextTracks = false;
    }

    if (!_this.featuresNativeTextTracks) {
      _this.emulateTextTracks();
    }

    _this.autoRemoteTextTracks_ = new _textTrackList2['default']();

    _this.initTextTrackListeners();
    _this.initTrackListeners();

    // Turn on component tap events only if not using native controls
    if (!options.nativeControlsForTouch) {
      _this.emitTapEvents();
    }

    if (_this.constructor) {
      _this.name_ = _this.constructor.name || 'Unknown Tech';
    }
    return _this;
  }

  /* Fallbacks for unsupported event types
  ================================================================================ */

  /**
   * Polyfill the `progress` event for browsers that don't support it natively.
   *
   * @see {@link Tech#trackProgress}
   */


  Tech.prototype.manualProgressOn = function manualProgressOn() {
    this.on('durationchange', this.onDurationChange);

    this.manualProgress = true;

    // Trigger progress watching when a source begins loading
    this.one('ready', this.trackProgress);
  };

  /**
   * Turn off the polyfill for `progress` events that was created in
   * {@link Tech#manualProgressOn}
   */


  Tech.prototype.manualProgressOff = function manualProgressOff() {
    this.manualProgress = false;
    this.stopTrackingProgress();

    this.off('durationchange', this.onDurationChange);
  };

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


  Tech.prototype.trackProgress = function trackProgress(event) {
    this.stopTrackingProgress();
    this.progressInterval = this.setInterval(Fn.bind(this, function () {
      // Don't trigger unless buffered amount is greater than last time

      var numBufferedPercent = this.bufferedPercent();

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
  };

  /**
   * Update our internal duration on a `durationchange` event by calling
   * {@link Tech#duration}.
   *
   * @param {EventTarget~Event} event
   *        The `durationchange` event that caused this to run.
   *
   * @listens Tech#durationchange
   */


  Tech.prototype.onDurationChange = function onDurationChange(event) {
    this.duration_ = this.duration();
  };

  /**
   * Get and create a `TimeRange` object for buffering.
   *
   * @return {TimeRange}
   *         The time range object that was created.
   */


  Tech.prototype.buffered = function buffered() {
    return (0, _timeRanges.createTimeRange)(0, 0);
  };

  /**
   * Get the percentage of the current video that is currently buffered.
   *
   * @return {number}
   *         A number from 0 to 1 that represents the decimal percentage of the
   *         video that is buffered.
   *
   */


  Tech.prototype.bufferedPercent = function bufferedPercent() {
    return (0, _buffer.bufferedPercent)(this.buffered(), this.duration_);
  };

  /**
   * Turn off the polyfill for `progress` events that was created in
   * {@link Tech#manualProgressOn}
   * Stop manually tracking progress events by clearing the interval that was set in
   * {@link Tech#trackProgress}.
   */


  Tech.prototype.stopTrackingProgress = function stopTrackingProgress() {
    this.clearInterval(this.progressInterval);
  };

  /**
   * Polyfill the `timeupdate` event for browsers that don't support it.
   *
   * @see {@link Tech#trackCurrentTime}
   */


  Tech.prototype.manualTimeUpdatesOn = function manualTimeUpdatesOn() {
    this.manualTimeUpdates = true;

    this.on('play', this.trackCurrentTime);
    this.on('pause', this.stopTrackingCurrentTime);
  };

  /**
   * Turn off the polyfill for `timeupdate` events that was created in
   * {@link Tech#manualTimeUpdatesOn}
   */


  Tech.prototype.manualTimeUpdatesOff = function manualTimeUpdatesOff() {
    this.manualTimeUpdates = false;
    this.stopTrackingCurrentTime();
    this.off('play', this.trackCurrentTime);
    this.off('pause', this.stopTrackingCurrentTime);
  };

  /**
   * Sets up an interval function to track current time and trigger `timeupdate` every
   * 250 milliseconds.
   *
   * @listens Tech#play
   * @triggers Tech#timeupdate
   */


  Tech.prototype.trackCurrentTime = function trackCurrentTime() {
    if (this.currentTimeInterval) {
      this.stopTrackingCurrentTime();
    }
    this.currentTimeInterval = this.setInterval(function () {
      /**
       * Triggered at an interval of 250ms to indicated that time is passing in the video.
       *
       * @event Tech#timeupdate
       * @type {EventTarget~Event}
       */
      this.trigger({ type: 'timeupdate', target: this, manuallyTriggered: true });

      // 42 = 24 fps // 250 is what Webkit uses // FF uses 15
    }, 250);
  };

  /**
   * Stop the interval function created in {@link Tech#trackCurrentTime} so that the
   * `timeupdate` event is no longer triggered.
   *
   * @listens {Tech#pause}
   */


  Tech.prototype.stopTrackingCurrentTime = function stopTrackingCurrentTime() {
    this.clearInterval(this.currentTimeInterval);

    // #1002 - if the video ends right before the next timeupdate would happen,
    // the progress bar won't make it all the way to the end
    this.trigger({ type: 'timeupdate', target: this, manuallyTriggered: true });
  };

  /**
   * Turn off all event polyfills, clear the `Tech`s {@link AudioTrackList},
   * {@link VideoTrackList}, and {@link TextTrackList}, and dispose of this Tech.
   *
   * @fires Component#dispose
   */


  Tech.prototype.dispose = function dispose() {

    // clear out all tracks because we can't reuse them between techs
    this.clearTracks(['audio', 'video', 'text']);

    // Turn off any manual progress or timeupdate tracking
    if (this.manualProgress) {
      this.manualProgressOff();
    }

    if (this.manualTimeUpdates) {
      this.manualTimeUpdatesOff();
    }

    _Component.prototype.dispose.call(this);
  };

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


  Tech.prototype.clearTracks = function clearTracks(types) {
    var _this2 = this;

    types = [].concat(types);
    // clear out all tracks because we can't reuse them between techs
    types.forEach(function (type) {
      var list = _this2[type + 'Tracks']() || [];
      var i = list.length;

      while (i--) {
        var track = list[i];

        if (type === 'text') {
          _this2.removeRemoteTextTrack(track);
        }
        list.removeTrack_(track);
      }
    });
  };

  /**
   * Remove any TextTracks added via addRemoteTextTrack that are
   * flagged for automatic garbage collection
   */


  Tech.prototype.cleanupAutoTextTracks = function cleanupAutoTextTracks() {
    var list = this.autoRemoteTextTracks_ || [];
    var i = list.length;

    while (i--) {
      var track = list[i];

      this.removeRemoteTextTrack(track);
    }
  };

  /**
   * Reset the tech, which will removes all sources and reset the internal readyState.
   *
   * @abstract
   */


  Tech.prototype.reset = function reset() {};

  /**
   * Get or set an error on the Tech.
   *
   * @param {MediaError} [err]
   *        Error to set on the Tech
   *
   * @return {MediaError|null}
   *         The current error object on the tech, or null if there isn't one.
   */


  Tech.prototype.error = function error(err) {
    if (err !== undefined) {
      this.error_ = new _mediaError2['default'](err);
      this.trigger('error');
    }
    return this.error_;
  };

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


  Tech.prototype.played = function played() {
    if (this.hasStarted_) {
      return (0, _timeRanges.createTimeRange)(0, 0);
    }
    return (0, _timeRanges.createTimeRange)();
  };

  /**
   * Causes a manual time update to occur if {@link Tech#manualTimeUpdatesOn} was
   * previously called.
   *
   * @fires Tech#timeupdate
   */


  Tech.prototype.setCurrentTime = function setCurrentTime() {
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
  };

  /**
   * Turn on listeners for {@link TextTrackList} events. This adds
   * {@link EventTarget~EventListeners} for `texttrackchange`, `addtrack` and
   * `removetrack`.
   *
   * @fires Tech#texttrackchange
   */


  Tech.prototype.initTextTrackListeners = function initTextTrackListeners() {
    var textTrackListChanges = Fn.bind(this, function () {
      /**
       * Triggered when tracks are added or removed on the Tech {@link TextTrackList}
       *
       * @event Tech#texttrackchange
       * @type {EventTarget~Event}
       */
      this.trigger('texttrackchange');
    });

    var tracks = this.textTracks();

    if (!tracks) {
      return;
    }

    tracks.addEventListener('removetrack', textTrackListChanges);
    tracks.addEventListener('addtrack', textTrackListChanges);

    this.on('dispose', Fn.bind(this, function () {
      tracks.removeEventListener('removetrack', textTrackListChanges);
      tracks.removeEventListener('addtrack', textTrackListChanges);
    }));
  };

  /**
   * Turn on listeners for {@link VideoTrackList} and {@link {AudioTrackList} events.
   * This adds {@link EventTarget~EventListeners} for `addtrack`, and  `removetrack`.
   *
   * @fires Tech#audiotrackchange
   * @fires Tech#videotrackchange
   */


  Tech.prototype.initTrackListeners = function initTrackListeners() {
    var _this3 = this;

    var trackTypes = ['video', 'audio'];

    trackTypes.forEach(function (type) {
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
      var trackListChanges = function trackListChanges() {
        _this3.trigger(type + 'trackchange');
      };

      var tracks = _this3[type + 'Tracks']();

      tracks.addEventListener('removetrack', trackListChanges);
      tracks.addEventListener('addtrack', trackListChanges);

      _this3.on('dispose', function () {
        tracks.removeEventListener('removetrack', trackListChanges);
        tracks.removeEventListener('addtrack', trackListChanges);
      });
    });
  };

  /**
   * Emulate TextTracks using vtt.js if necessary
   *
   * @fires Tech#vttjsloaded
   * @fires Tech#vttjserror
   */


  Tech.prototype.addWebVttScript_ = function addWebVttScript_() {
    var _this4 = this;

    if (!_window2['default'].WebVTT && this.el().parentNode !== null && this.el().parentNode !== undefined) {
      var _ret = function () {
        var vtt = require('videojs-vtt.js');

        // load via require if available and vtt.js script location was not passed in
        // as an option. novtt builds will turn the above require call into an empty object
        // which will cause this if check to always fail.
        if (!_this4.options_['vtt.js'] && (0, _obj.isPlain)(vtt) && Object.keys(vtt).length > 0) {
          Object.keys(vtt).forEach(function (k) {
            _window2['default'][k] = vtt[k];
          });
          _this4.trigger('vttjsloaded');
          return {
            v: void 0
          };
        }

        // load vtt.js via the script location option or the cdn of no location was
        // passed in
        var script = _document2['default'].createElement('script');

        script.src = _this4.options_['vtt.js'] || 'https://cdn.rawgit.com/gkatsev/vtt.js/vjs-v0.12.1/dist/vtt.min.js';
        script.onload = function () {
          /**
           * Fired when vtt.js is loaded.
           *
           * @event Tech#vttjsloaded
           * @type {EventTarget~Event}
           */
          _this4.trigger('vttjsloaded');
        };
        script.onerror = function () {
          /**
           * Fired when vtt.js was not loaded due to an error
           *
           * @event Tech#vttjsloaded
           * @type {EventTarget~Event}
           */
          _this4.trigger('vttjserror');
        };
        _this4.on('dispose', function () {
          script.onload = null;
          script.onerror = null;
        });
        // but have not loaded yet and we set it to true before the inject so that
        // we don't overwrite the injected window.WebVTT if it loads right away
        _window2['default'].WebVTT = true;
        _this4.el().parentNode.appendChild(script);
      }();

      if ((typeof _ret === 'undefined' ? 'undefined' : _typeof(_ret)) === "object") return _ret.v;
    }
  };

  /**
   * Emulate texttracks
   *
   * @method emulateTextTracks
   */


  Tech.prototype.emulateTextTracks = function emulateTextTracks() {
    var _this5 = this;

    var tracks = this.textTracks();

    if (!tracks) {
      return;
    }

    this.remoteTextTracks().on('addtrack', function (e) {
      _this5.textTracks().addTrack_(e.track);
    });

    this.remoteTextTracks().on('removetrack', function (e) {
      _this5.textTracks().removeTrack_(e.track);
    });

    // Initially, Tech.el_ is a child of a dummy-div wait until the Component system
    // signals that the Tech is ready at which point Tech.el_ is part of the DOM
    // before inserting the WebVTT script
    this.on('ready', this.addWebVttScript_);

    var updateDisplay = function updateDisplay() {
      return _this5.trigger('texttrackchange');
    };
    var textTracksChanges = function textTracksChanges() {
      updateDisplay();

      for (var i = 0; i < tracks.length; i++) {
        var track = tracks[i];

        track.removeEventListener('cuechange', updateDisplay);
        if (track.mode === 'showing') {
          track.addEventListener('cuechange', updateDisplay);
        }
      }
    };

    textTracksChanges();
    tracks.addEventListener('change', textTracksChanges);

    this.on('dispose', function () {
      tracks.removeEventListener('change', textTracksChanges);
    });
  };

  /**
   * Get the `Tech`s {@link VideoTrackList}.
   *
   * @return {VideoTrackList}
   *          The video track list that the Tech is currently using.
   */


  Tech.prototype.videoTracks = function videoTracks() {
    this.videoTracks_ = this.videoTracks_ || new _videoTrackList2['default']();
    return this.videoTracks_;
  };

  /**
   * Get the `Tech`s {@link AudioTrackList}.
   *
   * @return {AudioTrackList}
   *          The audio track list that the Tech is currently using.
   */


  Tech.prototype.audioTracks = function audioTracks() {
    this.audioTracks_ = this.audioTracks_ || new _audioTrackList2['default']();
    return this.audioTracks_;
  };

  /**
   * Get the `Tech`s {@link TextTrackList}.
   *
   * @return {TextTrackList}
   *          The text track list that the Tech is currently using.
   */


  Tech.prototype.textTracks = function textTracks() {
    this.textTracks_ = this.textTracks_ || new _textTrackList2['default']();
    return this.textTracks_;
  };

  /**
   * Get the `Tech`s remote {@link TextTrackList}, which is created from elements
   * that were added to the DOM.
   *
   * @return {TextTrackList}
   *          The remote text track list that the Tech is currently using.
   */


  Tech.prototype.remoteTextTracks = function remoteTextTracks() {
    this.remoteTextTracks_ = this.remoteTextTracks_ || new _textTrackList2['default']();
    return this.remoteTextTracks_;
  };

  /**
   * Get The `Tech`s  {HTMLTrackElementList}, which are the elements in the DOM that are
   * being used as TextTracks.
   *
   * @return {HTMLTrackElementList}
   *          The current HTML track elements that exist for the tech.
   */


  Tech.prototype.remoteTextTrackEls = function remoteTextTrackEls() {
    this.remoteTextTrackEls_ = this.remoteTextTrackEls_ || new _htmlTrackElementList2['default']();
    return this.remoteTextTrackEls_;
  };

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


  Tech.prototype.addTextTrack = function addTextTrack(kind, label, language) {
    if (!kind) {
      throw new Error('TextTrack kind is required but was not provided');
    }

    return createTrackHelper(this, kind, label, language);
  };

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


  Tech.prototype.createRemoteTextTrack = function createRemoteTextTrack(options) {
    var track = (0, _mergeOptions2['default'])(options, {
      tech: this
    });

    return new _htmlTrackElement2['default'](track);
  };

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


  Tech.prototype.addRemoteTextTrack = function addRemoteTextTrack() {
    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    var manualCleanup = arguments[1];

    var htmlTrackElement = this.createRemoteTextTrack(options);

    if (manualCleanup !== true && manualCleanup !== false) {
      // deprecation warning
      _log2['default'].warn('Calling addRemoteTextTrack without explicitly setting the "manualCleanup" parameter to `true` is deprecated and default to `false` in future version of video.js');
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
  };

  /**
   * Remove a remote text track from the remote `TextTrackList`.
   *
   * @param {TextTrack} track
   *        `TextTrack` to remove from the `TextTrackList`
   */


  Tech.prototype.removeRemoteTextTrack = function removeRemoteTextTrack(track) {
    var trackElement = this.remoteTextTrackEls().getTrackElementByTrack_(track);

    // remove HTMLTrackElement and TextTrack from remote list
    this.remoteTextTrackEls().removeTrackElement_(trackElement);
    this.remoteTextTracks().removeTrack_(track);
    this.autoRemoteTextTracks_.removeTrack_(track);
  };

  /**
   * A method to set a poster from a `Tech`.
   *
   * @abstract
   */


  Tech.prototype.setPoster = function setPoster() {};

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


  Tech.prototype.canPlayType = function canPlayType() {
    return '';
  };

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


  Tech.isTech = function isTech(component) {
    return component.prototype instanceof Tech || component instanceof Tech || component === Tech;
  };

  /**
   * Registers a `Tech` into a shared list for videojs.
   *
   * @param {string} name
   *        Name of the `Tech` to register.
   *
   * @param {Object} tech
   *        The `Tech` class to register.
   */


  Tech.registerTech = function registerTech(name, tech) {
    if (!Tech.techs_) {
      Tech.techs_ = {};
    }

    if (!Tech.isTech(tech)) {
      throw new Error('Tech ' + name + ' must be a Tech');
    }

    Tech.techs_[name] = tech;
    return tech;
  };

  /**
   * Get a `Tech` from the shared list by name.
   *
   * @param {string} name
   *        Name of the component to get
   *
   * @return {Tech|undefined}
   *         The `Tech` or undefined if there was no tech with the name requsted.
   */


  Tech.getTech = function getTech(name) {
    if (Tech.techs_ && Tech.techs_[name]) {
      return Tech.techs_[name];
    }

    if (_window2['default'] && _window2['default'].videojs && _window2['default'].videojs[name]) {
      _log2['default'].warn('The ' + name + ' tech was added to the videojs object when it should be registered using videojs.registerTech(name, tech)');
      return _window2['default'].videojs[name];
    }
  };

  return Tech;
}(_component2['default']);

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
Tech.withSourceHandlers = function (_Tech) {

  /**
   * Register a source handler
   *
   * @param {Function} handler
   *        The source handler class
   *
   * @param {number} [index]
   *        Register it at the following index
   */
  _Tech.registerSourceHandler = function (handler, index) {
    var handlers = _Tech.sourceHandlers;

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
  _Tech.canPlayType = function (type) {
    var handlers = _Tech.sourceHandlers || [];
    var can = void 0;

    for (var i = 0; i < handlers.length; i++) {
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
  _Tech.selectSourceHandler = function (source, options) {
    var handlers = _Tech.sourceHandlers || [];
    var can = void 0;

    for (var i = 0; i < handlers.length; i++) {
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
  _Tech.canPlaySource = function (srcObj, options) {
    var sh = _Tech.selectSourceHandler(srcObj, options);

    if (sh) {
      return sh.canHandleSource(srcObj, options);
    }

    return '';
  };

  /**
   * When using a source handler, prefer its implementation of
   * any function normally provided by the tech.
   */
  var deferrable = ['seekable', 'duration'];

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

  deferrable.forEach(function (fnName) {
    var originalFn = this[fnName];

    if (typeof originalFn !== 'function') {
      return;
    }

    this[fnName] = function () {
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
  _Tech.prototype.setSource = function (source) {
    var sh = _Tech.selectSourceHandler(source, this.options_);

    if (!sh) {
      // Fall back to a native source hander when unsupported sources are
      // deliberately set
      if (_Tech.nativeSourceHandler) {
        sh = _Tech.nativeSourceHandler;
      } else {
        _log2['default'].error('No source hander found for the current source.');
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
  _Tech.prototype.firstLoadStartListener_ = function () {
    this.one(this.el_, 'loadstart', _Tech.prototype.successiveLoadStartListener_);
  };

  // On successive loadstarts when setSource has not been called again
  /**
   * Called after the first loadstart for a video occurs.
   *
   * @listens Tech#loadstart
   */
  _Tech.prototype.successiveLoadStartListener_ = function () {
    this.disposeSourceHandler();
    this.one(this.el_, 'loadstart', _Tech.prototype.successiveLoadStartListener_);
  };

  /**
   * Clean up any existing SourceHandlers and listeners when the Tech is disposed.
   *
   * @listens Tech#dispose
   */
  _Tech.prototype.disposeSourceHandler = function () {
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

_component2['default'].registerComponent('Tech', Tech);
// Old name for Tech
// @deprecated
_component2['default'].registerComponent('MediaTechController', Tech);
Tech.registerTech('Tech', Tech);
exports['default'] = Tech;
