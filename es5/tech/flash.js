'use strict';

exports.__esModule = true;

var _tech = require('./tech');

var _tech2 = _interopRequireDefault(_tech);

var _dom = require('../utils/dom.js');

var Dom = _interopRequireWildcard(_dom);

var _url = require('../utils/url.js');

var Url = _interopRequireWildcard(_url);

var _timeRanges = require('../utils/time-ranges.js');

var _flashRtmp = require('./flash-rtmp');

var _flashRtmp2 = _interopRequireDefault(_flashRtmp);

var _component = require('../component');

var _component2 = _interopRequireDefault(_component);

var _window = require('global/window');

var _window2 = _interopRequireDefault(_window);

var _obj = require('../utils/obj');

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * @file flash.js
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * VideoJS-SWF - Custom Flash Player with HTML5-ish API
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * https://github.com/zencoder/video-js-swf
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * Not using setupTriggers. Using global onEvent func to distribute events
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                */

var navigator = _window2['default'].navigator;

/**
 * Flash Media Controller - Wrapper for Flash Media API
 *
 * @mixes FlashRtmpDecorator
 * @mixes Tech~SouceHandlerAdditions
 * @extends Tech
 */

var Flash = function (_Tech) {
  _inherits(Flash, _Tech);

  /**
   * Create an instance of this Tech.
   *
   * @param {Object} [options]
   *        The key/value store of player options.
   *
   * @param {Component~ReadyCallback} ready
   *        Callback function to call when the `Flash` Tech is ready.
   */
  function Flash(options, ready) {
    _classCallCheck(this, Flash);

    // Set the source when ready
    var _this = _possibleConstructorReturn(this, _Tech.call(this, options, ready));

    if (options.source) {
      _this.ready(function () {
        this.setSource(options.source);
      }, true);
    }

    // Having issues with Flash reloading on certain page actions (hide/resize/fullscreen) in certain browsers
    // This allows resetting the playhead when we catch the reload
    if (options.startTime) {
      _this.ready(function () {
        this.load();
        this.play();
        this.currentTime(options.startTime);
      }, true);
    }

    // Add global window functions that the swf expects
    // A 4.x workflow we weren't able to solve for in 5.0
    // because of the need to hard code these functions
    // into the swf for security reasons
    _window2['default'].videojs = _window2['default'].videojs || {};
    _window2['default'].videojs.Flash = _window2['default'].videojs.Flash || {};
    _window2['default'].videojs.Flash.onReady = Flash.onReady;
    _window2['default'].videojs.Flash.onEvent = Flash.onEvent;
    _window2['default'].videojs.Flash.onError = Flash.onError;

    _this.on('seeked', function () {
      this.lastSeekTarget_ = undefined;
    });

    return _this;
  }

  /**
   * Create the `Flash` Tech's DOM element.
   *
   * @return {Element}
   *         The element that gets created.
   */


  Flash.prototype.createEl = function createEl() {
    var options = this.options_;

    // If video.js is hosted locally you should also set the location
    // for the hosted swf, which should be relative to the page (not video.js)
    // Otherwise this adds a CDN url.
    // The CDN also auto-adds a swf URL for that specific version.
    if (!options.swf) {
      var ver = '5.1.0';

      options.swf = '//vjs.zencdn.net/swf/' + ver + '/video-js.swf';
    }

    // Generate ID for swf object
    var objId = options.techId;

    // Merge default flashvars with ones passed in to init
    var flashVars = (0, _obj.assign)({

      // SWF Callback Functions
      readyFunction: 'videojs.Flash.onReady',
      eventProxyFunction: 'videojs.Flash.onEvent',
      errorEventProxyFunction: 'videojs.Flash.onError',

      // Player Settings
      autoplay: options.autoplay,
      preload: options.preload,
      loop: options.loop,
      muted: options.muted

    }, options.flashVars);

    // Merge default parames with ones passed in
    var params = (0, _obj.assign)({
      // Opaque is needed to overlay controls, but can affect playback performance
      wmode: 'opaque',
      // Using bgcolor prevents a white flash when the object is loading
      bgcolor: '#000000'
    }, options.params);

    // Merge default attributes with ones passed in
    var attributes = (0, _obj.assign)({
      // Both ID and Name needed or swf to identify itself
      id: objId,
      name: objId,
      'class': 'vjs-tech'
    }, options.attributes);

    this.el_ = Flash.embed(options.swf, flashVars, params, attributes);
    this.el_.tech = this;

    return this.el_;
  };

  /**
   * Called by {@link Player#play} to play using the `Flash` `Tech`.
   */


  Flash.prototype.play = function play() {
    if (this.ended()) {
      this.setCurrentTime(0);
    }
    this.el_.vjs_play();
  };

  /**
   * Called by {@link Player#pause} to pause using the `Flash` `Tech`.
   */


  Flash.prototype.pause = function pause() {
    this.el_.vjs_pause();
  };

  /**
   * A getter/setter for the `Flash` Tech's source object.
   * > Note: Please use {@link Flash#setSource}
   *
   * @param {Tech~SourceObject} [src]
   *        The source object you want to set on the `Flash` techs.
   *
   * @return {Tech~SourceObject|undefined}
   *         - The current source object when a source is not passed in.
   *         - undefined when setting
   *
   * @deprecated Since version 5.
   */


  Flash.prototype.src = function src(_src) {
    if (_src === undefined) {
      return this.currentSrc();
    }

    // Setting src through `src` not `setSrc` will be deprecated
    return this.setSrc(_src);
  };

  /**
   * A getter/setter for the `Flash` Tech's source object.
   *
   * @param {Tech~SourceObject} [src]
   *        The source object you want to set on the `Flash` techs.
   *
   * @return {Tech~SourceObject|undefined}
   *         - The current source object when a source is not passed in.
   *         - undefined when setting
   */


  Flash.prototype.setSrc = function setSrc(src) {
    var _this2 = this;

    // Make sure source URL is absolute.
    src = Url.getAbsoluteURL(src);
    this.el_.vjs_src(src);

    // Currently the SWF doesn't autoplay if you load a source later.
    // e.g. Load player w/ no source, wait 2s, set src.
    if (this.autoplay()) {
      this.setTimeout(function () {
        return _this2.play();
      }, 0);
    }
  };

  /**
   * Indicates whether the media is currently seeking to a new position or not.
   *
   * @return {boolean}
   *         - True if seeking to a new position
   *         - False otherwise
   */


  Flash.prototype.seeking = function seeking() {
    return this.lastSeekTarget_ !== undefined;
  };

  /**
   * Returns the current time in seconds that the media is at in playback.
   *
   * @param {number} time
   *        Current playtime of the media in seconds.
   */


  Flash.prototype.setCurrentTime = function setCurrentTime(time) {
    var seekable = this.seekable();

    if (seekable.length) {
      // clamp to the current seekable range
      time = time > seekable.start(0) ? time : seekable.start(0);
      time = time < seekable.end(seekable.length - 1) ? time : seekable.end(seekable.length - 1);

      this.lastSeekTarget_ = time;
      this.trigger('seeking');
      this.el_.vjs_setProperty('currentTime', time);
      _Tech.prototype.setCurrentTime.call(this);
    }
  };

  /**
   * Get the current playback time in seconds
   *
   * @return {number}
   *         The current time of playback in seconds.
   */


  Flash.prototype.currentTime = function currentTime() {
    // when seeking make the reported time keep up with the requested time
    // by reading the time we're seeking to
    if (this.seeking()) {
      return this.lastSeekTarget_ || 0;
    }
    return this.el_.vjs_getProperty('currentTime');
  };

  /**
   * Get the current source
   *
   * @method currentSrc
   * @return {Tech~SourceObject}
   *         The current source
   */


  Flash.prototype.currentSrc = function currentSrc() {
    if (this.currentSource_) {
      return this.currentSource_.src;
    }
    return this.el_.vjs_getProperty('currentSrc');
  };

  /**
   * Get the total duration of the current media.
   *
   * @return {number}
   8          The total duration of the current media.
   */


  Flash.prototype.duration = function duration() {
    if (this.readyState() === 0) {
      return NaN;
    }
    var duration = this.el_.vjs_getProperty('duration');

    return duration >= 0 ? duration : Infinity;
  };

  /**
   * Load media into Tech.
   */


  Flash.prototype.load = function load() {
    this.el_.vjs_load();
  };

  /**
   * Get the poster image that was set on the tech.
   */


  Flash.prototype.poster = function poster() {
    this.el_.vjs_getProperty('poster');
  };

  /**
   * Poster images are not handled by the Flash tech so make this is a no-op.
   */


  Flash.prototype.setPoster = function setPoster() {};

  /**
   * Determine the time ranges that can be seeked to in the media.
   *
   * @return {TimeRange}
   *         Returns the time ranges that can be seeked to.
   */


  Flash.prototype.seekable = function seekable() {
    var duration = this.duration();

    if (duration === 0) {
      return (0, _timeRanges.createTimeRange)();
    }
    return (0, _timeRanges.createTimeRange)(0, duration);
  };

  /**
   * Get and create a `TimeRange` object for buffering.
   *
   * @return {TimeRange}
   *         The time range object that was created.
   */


  Flash.prototype.buffered = function buffered() {
    var ranges = this.el_.vjs_getProperty('buffered');

    if (ranges.length === 0) {
      return (0, _timeRanges.createTimeRange)();
    }
    return (0, _timeRanges.createTimeRange)(ranges[0][0], ranges[0][1]);
  };

  /**
   * Get fullscreen support -
   *
   * Flash does not allow fullscreen through javascript
   * so this always returns false.
   *
   * @return {boolean}
   *         The Flash tech does not support fullscreen, so it will always return false.
   */


  Flash.prototype.supportsFullScreen = function supportsFullScreen() {
    // Flash does not allow fullscreen through javascript
    return false;
  };

  /**
   * Flash does not allow fullscreen through javascript
   * so this always returns false.
   *
   * @return {boolean}
   *         The Flash tech does not support fullscreen, so it will always return false.
   */


  Flash.prototype.enterFullScreen = function enterFullScreen() {
    return false;
  };

  return Flash;
}(_tech2['default']);

// Create setters and getters for attributes


var _api = Flash.prototype;
var _readWrite = 'rtmpConnection,rtmpStream,preload,defaultPlaybackRate,playbackRate,autoplay,loop,mediaGroup,controller,controls,volume,muted,defaultMuted'.split(',');
var _readOnly = 'networkState,readyState,initialTime,startOffsetTime,paused,ended,videoWidth,videoHeight'.split(',');

function _createSetter(attr) {
  var attrUpper = attr.charAt(0).toUpperCase() + attr.slice(1);

  _api['set' + attrUpper] = function (val) {
    return this.el_.vjs_setProperty(attr, val);
  };
}

function _createGetter(attr) {
  _api[attr] = function () {
    return this.el_.vjs_getProperty(attr);
  };
}

// Create getter and setters for all read/write attributes
for (var i = 0; i < _readWrite.length; i++) {
  _createGetter(_readWrite[i]);
  _createSetter(_readWrite[i]);
}

// Create getters for read-only attributes
for (var _i = 0; _i < _readOnly.length; _i++) {
  _createGetter(_readOnly[_i]);
}

/** ------------------------------ Getters ------------------------------ **/
/**
 * Get the value of `rtmpConnection` from the swf.
 *
 * @method Flash#rtmpConnection
 * @return {string}
 *         The current value of `rtmpConnection` on the swf.
 */

/**
 * Get the value of `rtmpStream` from the swf.
 *
 * @method Flash#rtmpStream
 * @return {string}
 *         The current value of `rtmpStream` on the swf.
 */

/**
 * Get the value of `preload` from the swf. `preload` indicates
 * what should download before the media is interacted with. It can have the following
 * values:
 * - none: nothing should be downloaded
 * - metadata: poster and the first few frames of the media may be downloaded to get
 *   media dimensions and other metadata
 * - auto: allow the media and metadata for the media to be downloaded before
 *    interaction
 *
 * @method Flash#preload
 * @return {string}
 *         The value of `preload` from the swf. Will be 'none', 'metadata',
 *         or 'auto'.
 */

/**
 * Get the value of `defaultPlaybackRate` from the swf.
 *
 * @method Flash#defaultPlaybackRate
 * @return {number}
 *         The current value of `defaultPlaybackRate` on the swf.
 */

/**
 * Get the value of `playbackRate` from the swf. `playbackRate` indicates
 * the rate at which the media is currently playing back. Examples:
 *   - if playbackRate is set to 2, media will play twice as fast.
 *   - if playbackRate is set to 0.5, media will play half as fast.
 *
 * @method Flash#playbackRate
 * @return {number}
 *         The value of `playbackRate` from the swf. A number indicating
 *         the current playback speed of the media, where 1 is normal speed.
 */

/**
 * Get the value of `autoplay` from the swf. `autoplay` indicates
 * that the media should start to play as soon as the page is ready.
 *
 * @method Flash#autoplay
 * @return {boolean}
 *         - The value of `autoplay` from the swf.
 *         - True indicates that the media ashould start as soon as the page loads.
 *         - False indicates that the media should not start as soon as the page loads.
 */

/**
 * Get the value of `loop` from the swf. `loop` indicates
 * that the media should return to the start of the media and continue playing once
 * it reaches the end.
 *
 * @method Flash#loop
 * @return {boolean}
 *         - The value of `loop` from the swf.
 *         - True indicates that playback should seek back to start once
 *           the end of a media is reached.
 *         - False indicates that playback should not loop back to the start when the
 *           end of the media is reached.
 */

/**
 * Get the value of `mediaGroup` from the swf.
 *
 * @method Flash#mediaGroup
 * @return {string}
 *         The current value of `mediaGroup` on the swf.
 */

/**
 * Get the value of `controller` from the swf.
 *
 * @method Flash#controller
 * @return {string}
 *         The current value of `controller` on the swf.
 */

/**
 * Get the value of `controls` from the swf. `controls` indicates
 * whether the native flash controls should be shown or hidden.
 *
 * @method Flash#controls
 * @return {boolean}
 *         - The value of `controls` from the swf.
 *         - True indicates that native controls should be showing.
 *         - False indicates that native controls should be hidden.
 */

/**
 * Get the value of the `volume` from the swf. `volume` indicates the current
 * audio level as a percentage in decimal form. This means that 1 is 100%, 0.5 is 50%, and
 * so on.
 *
 * @method Flash#volume
 * @return {number}
 *         The volume percent as a decimal. Value will be between 0-1.
 */

/**
 * Get the value of the `muted` from the swf. `muted` indicates the current
 * audio level should be silent.
 *
 * @method Flash#muted
 * @return {boolean}
 *         - True if the audio should be set to silent
 *         - False otherwise
 */

/**
 * Get the value of `defaultMuted` from the swf. `defaultMuted` indicates
 * whether the media should start muted or not. Only changes the default state of the
 * media. `muted` and `defaultMuted` can have different values. `muted` indicates the
 * current state.
 *
 * @method Flash#defaultMuted
 * @return {boolean}
 *         - The value of `defaultMuted` from the swf.
 *         - True indicates that the media should start muted.
 *         - False indicates that the media should not start muted.
 */

/**
 * Get the value of `networkState` from the swf. `networkState` indicates
 * the current network state. It returns an enumeration from the following list:
 * - 0: NETWORK_EMPTY
 * - 1: NEWORK_IDLE
 * - 2: NETWORK_LOADING
 * - 3: NETWORK_NO_SOURCE
 *
 * @method Flash#networkState
 * @return {number}
 *         The value of `networkState` from the swf. This will be a number
 *         from the list in the description.
 */

/**
 * Get the value of `readyState` from the swf. `readyState` indicates
 * the current state of the media element. It returns an enumeration from the
 * following list:
 * - 0: HAVE_NOTHING
 * - 1: HAVE_METADATA
 * - 2: HAVE_CURRENT_DATA
 * - 3: HAVE_FUTURE_DATA
 * - 4: HAVE_ENOUGH_DATA
 *
 * @method Flash#readyState
 * @return {number}
 *         The value of `readyState` from the swf. This will be a number
 *         from the list in the description.
 */

/**
 * Get the value of `readyState` from the swf. `readyState` indicates
 * the current state of the media element. It returns an enumeration from the
 * following list:
 * - 0: HAVE_NOTHING
 * - 1: HAVE_METADATA
 * - 2: HAVE_CURRENT_DATA
 * - 3: HAVE_FUTURE_DATA
 * - 4: HAVE_ENOUGH_DATA
 *
 * @method Flash#readyState
 * @return {number}
 *         The value of `readyState` from the swf. This will be a number
 *         from the list in the description.
 */

/**
 * Get the value of `initialTime` from the swf.
 *
 * @method Flash#initialTime
 * @return {number}
 *         The `initialTime` proprety on the swf.
 */

/**
 * Get the value of `startOffsetTime` from the swf.
 *
 * @method Flash#startOffsetTime
 * @return {number}
 *         The `startOffsetTime` proprety on the swf.
 */

/**
 * Get the value of `paused` from the swf. `paused` indicates whether the swf
 * is current paused or not.
 *
 * @method Flash#paused
 * @return {boolean}
 *         The value of `paused` from the swf.
 */

/**
 * Get the value of `ended` from the swf. `ended` indicates whether
 * the media has reached the end or not.
 *
 * @method Flash#ended
 * @return {boolean}
 *         - True indicates that the media has ended.
 *         - False indicates that the media has not ended.
 *
 * @see [Spec]{@link https://www.w3.org/TR/html5/embedded-content-0.html#dom-media-ended}
 */

/**
 * Get the value of `videoWidth` from the swf. `videoWidth` indicates
 * the current width of the media in css pixels.
 *
 * @method Flash#videoWidth
 * @return {number}
 *         The value of `videoWidth` from the swf. This will be a number
 *         in css pixels.
 */

/**
 * Get the value of `videoHeight` from the swf. `videoHeigth` indicates
 * the current height of the media in css pixels.
 *
 * @method Flassh.prototype.videoHeight
 * @return {number}
 *         The value of `videoHeight` from the swf. This will be a number
 *         in css pixels.
 */
/** ------------------------------ Setters ------------------------------ **/

/**
 * Set the value of `rtmpConnection` on the swf.
 *
 * @method Flash#setRtmpConnection
 * @param {string} rtmpConnection
 *        New value to set the `rtmpConnection` property to.
 */

/**
 * Set the value of `rtmpStream` on the swf.
 *
 * @method Flash#setRtmpStream
 * @param {string} rtmpStream
 *        New value to set the `rtmpStream` property to.
 */

/**
 * Set the value of `preload` on the swf. `preload` indicates
 * what should download before the media is interacted with. It can have the following
 * values:
 * - none: nothing should be downloaded
 * - metadata: poster and the first few frames of the media may be downloaded to get
 *   media dimensions and other metadata
 * - auto: allow the media and metadata for the media to be downloaded before
 *    interaction
 *
 * @method Flash#setPreload
 * @param {string} preload
 *        The value of `preload` to set on the swf. Should be 'none', 'metadata',
 *        or 'auto'.
 */

/**
 * Set the value of `defaultPlaybackRate` on the swf.
 *
 * @method Flash#setDefaultPlaybackRate
 * @param {number} defaultPlaybackRate
 *        New value to set the `defaultPlaybackRate` property to.
 */

/**
 * Set the value of `playbackRate` on the swf. `playbackRate` indicates
 * the rate at which the media is currently playing back. Examples:
 *   - if playbackRate is set to 2, media will play twice as fast.
 *   - if playbackRate is set to 0.5, media will play half as fast.
 *
 * @method Flash#setPlaybackRate
 * @param {number} playbackRate
 *        New value of `playbackRate` on the swf. A number indicating
 *        the current playback speed of the media, where 1 is normal speed.
 */

/**
 * Set the value of `autoplay` on the swf. `autoplay` indicates
 * that the media should start to play as soon as the page is ready.
 *
 * @method Flash#setAutoplay
 * @param {boolean} autoplay
 *        - The value of `autoplay` from the swf.
 *        - True indicates that the media ashould start as soon as the page loads.
 *        - False indicates that the media should not start as soon as the page loads.
 */

/**
 * Set the value of `loop` on the swf. `loop` indicates
 * that the media should return to the start of the media and continue playing once
 * it reaches the end.
 *
 * @method Flash#setLoop
 * @param {boolean} loop
 *        - True indicates that playback should seek back to start once
 *          the end of a media is reached.
 *        - False indicates that playback should not loop back to the start when the
 *          end of the media is reached.
 */

/**
 * Set the value of `mediaGroup` on the swf.
 *
 * @method Flash#setMediaGroup
 * @param {string} mediaGroup
 *        New value of `mediaGroup` to set on the swf.
 */

/**
 * Set the value of `controller` on the swf.
 *
 * @method Flash#setController
 * @param {string} controller
 *        New value the current value of `controller` on the swf.
 */

/**
 * Get the value of `controls` from the swf. `controls` indicates
 * whether the native flash controls should be shown or hidden.
 *
 * @method Flash#controls
 * @return {boolean}
 *         - The value of `controls` from the swf.
 *         - True indicates that native controls should be showing.
 *         - False indicates that native controls should be hidden.
 */

/**
 * Set the value of the `volume` on the swf. `volume` indicates the current
 * audio level as a percentage in decimal form. This means that 1 is 100%, 0.5 is 50%, and
 * so on.
 *
 * @method Flash#setVolume
 * @param {number} percentAsDecimal
 *         The volume percent as a decimal. Value will be between 0-1.
 */

/**
 * Set the value of the `muted` on the swf. `muted` indicates that the current
 * audio level should be silent.
 *
 * @method Flash#setMuted
 * @param {boolean} muted
 *         - True if the audio should be set to silent
 *         - False otherwise
 */

/**
 * Set the value of `defaultMuted` on the swf. `defaultMuted` indicates
 * whether the media should start muted or not. Only changes the default state of the
 * media. `muted` and `defaultMuted` can have different values. `muted` indicates the
 * current state.
 *
 * @method Flash#setDefaultMuted
 * @param {boolean} defaultMuted
 *         - True indicates that the media should start muted.
 *         - False indicates that the media should not start muted.
 */

/* Flash Support Testing -------------------------------------------------------- */

/**
 * Check if the Flash tech is currently supported.
 *
 * @return {boolean}
 *          - True if the flash tech is supported.
 *          - False otherwise.
 */
Flash.isSupported = function () {
  return Flash.version()[0] >= 10;
  // return swfobject.hasFlashPlayerVersion('10');
};

// Add Source Handler pattern functions to this tech
_tech2['default'].withSourceHandlers(Flash);

/*
 * Native source handler for flash,  simply passes the source to the swf element.
 *
 * @property {Tech~SourceObject} source
 *           The source object
 *
 * @property {Flash} tech
 *           The instance of the Flash tech
 */
Flash.nativeSourceHandler = {};

/**
 * Check if the Flash can play the given mime type.
 *
 * @param {string} type
 *        The mimetype to check
 *
 * @return {string}
 *         'maybe', or '' (empty string)
 */
Flash.nativeSourceHandler.canPlayType = function (type) {
  if (type in Flash.formats) {
    return 'maybe';
  }

  return '';
};

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
 *         'maybe', or '' (empty string).
 */
Flash.nativeSourceHandler.canHandleSource = function (source, options) {
  var type = void 0;

  function guessMimeType(src) {
    var ext = Url.getFileExtension(src);

    if (ext) {
      return 'video/' + ext;
    }
    return '';
  }

  if (!source.type) {
    type = guessMimeType(source.src);
  } else {
    // Strip code information from the type because we don't get that specific
    type = source.type.replace(/;.*/, '').toLowerCase();
  }

  return Flash.nativeSourceHandler.canPlayType(type);
};

/**
 * Pass the source to the swf.
 *
 * @param {Tech~SourceObject} source
 *        The source object
 *
 * @param {Flash} tech
 *        The instance of the Flash tech
 *
 * @param {Object} [options]
 *        The options to pass to the source
 */
Flash.nativeSourceHandler.handleSource = function (source, tech, options) {
  tech.setSrc(source.src);
};

/**
 * noop for native source handler dispose, as cleanup will happen automatically.
 */
Flash.nativeSourceHandler.dispose = function () {};

// Register the native source handler
Flash.registerSourceHandler(Flash.nativeSourceHandler);

/**
 * Flash supported mime types.
 *
 * @constant {Object}
 */
Flash.formats = {
  'video/flv': 'FLV',
  'video/x-flv': 'FLV',
  'video/mp4': 'MP4',
  'video/m4v': 'MP4'
};

/**
 * Called when the the swf is "ready", and makes sure that the swf is really
 * ready using {@link Flash#checkReady}
 */
Flash.onReady = function (currSwf) {
  var el = Dom.getEl(currSwf);
  var tech = el && el.tech;

  // if there is no el then the tech has been disposed
  // and the tech element was removed from the player div
  if (tech && tech.el()) {
    // check that the flash object is really ready
    Flash.checkReady(tech);
  }
};

/**
 * The SWF isn't always ready when it says it is. Sometimes the API functions still
 * need to be added to the object. If it's not ready, we set a timeout to check again
 * shortly.
 *
 * @param {Flash} tech
 *        The instance of the flash tech to check.
 */
Flash.checkReady = function (tech) {
  // stop worrying if the tech has been disposed
  if (!tech.el()) {
    return;
  }

  // check if API property exists
  if (tech.el().vjs_getProperty) {
    // tell tech it's ready
    tech.triggerReady();
  } else {
    // wait longer
    this.setTimeout(function () {
      Flash.checkReady(tech);
    }, 50);
  }
};

/**
 * Trigger events from the swf on the Flash Tech.
 *
 * @param {number} swfID
 *        The id of the swf that had the event
 *
 * @param {string} eventName
 *        The name of the event to trigger
 */
Flash.onEvent = function (swfID, eventName) {
  var tech = Dom.getEl(swfID).tech;
  var args = Array.prototype.slice.call(arguments, 2);

  // dispatch Flash events asynchronously for two reasons:
  // - Flash swallows any exceptions generated by javascript it
  //   invokes
  // - Flash is suspended until the javascript returns which may cause
  //   playback performance issues
  tech.setTimeout(function () {
    tech.trigger(eventName, args);
  }, 1);
};

/**
 * Log errors from the swf on the Flash tech.
 *
 * @param {number} swfID
 *        The id of the swf that had an error.
 *
 * @param {string} The error string
 *        The error to set on the Flash Tech.
 *
 * @return {MediaError|undefined}
 *          - Returns a MediaError when err is 'srcnotfound'
 *          - Returns undefined otherwise.
 */
Flash.onError = function (swfID, err) {
  var tech = Dom.getEl(swfID).tech;

  // trigger MEDIA_ERR_SRC_NOT_SUPPORTED
  if (err === 'srcnotfound') {
    return tech.error(4);
  }

  // trigger a custom error
  tech.error('FLASH: ' + err);
};

/**
 * Get the current version of Flash that is in use on the page.
 *
 * @return {Array}
 *          an array of versions that are available.
 */
Flash.version = function () {
  var version = '0,0,0';

  // IE
  try {
    version = new _window2['default'].ActiveXObject('ShockwaveFlash.ShockwaveFlash').GetVariable('$version').replace(/\D+/g, ',').match(/^,?(.+),?$/)[1];

    // other browsers
  } catch (e) {
    try {
      if (navigator.mimeTypes['application/x-shockwave-flash'].enabledPlugin) {
        version = (navigator.plugins['Shockwave Flash 2.0'] || navigator.plugins['Shockwave Flash']).description.replace(/\D+/g, ',').match(/^,?(.+),?$/)[1];
      }
    } catch (err) {
      // satisfy linter
    }
  }
  return version.split(',');
};

/**
 * Only use for non-iframe embeds.
 *
 * @param {Object} swf
 *        The videojs-swf object.
 *
 * @param {Object} flashVars
 *        Names and values to use as flash option variables.
 *
 * @param {Object} params
 *        Style parameters to set on the object.
 *
 * @param {Object} attributes
 *        Attributes to set on the element.
 *
 * @return {Element}
 *          The embeded Flash DOM element.
 */
Flash.embed = function (swf, flashVars, params, attributes) {
  var code = Flash.getEmbedCode(swf, flashVars, params, attributes);

  // Get element by embedding code and retrieving created element
  var obj = Dom.createEl('div', { innerHTML: code }).childNodes[0];

  return obj;
};

/**
 * Only use for non-iframe embeds.
 *
 * @param {Object} swf
 *        The videojs-swf object.
 *
 * @param {Object} flashVars
 *        Names and values to use as flash option variables.
 *
 * @param {Object} params
 *        Style parameters to set on the object.
 *
 * @param {Object} attributes
 *        Attributes to set on the element.
 *
 * @return {Element}
 *          The embeded Flash DOM element.
 */
Flash.getEmbedCode = function (swf, flashVars, params, attributes) {
  var objTag = '<object type="application/x-shockwave-flash" ';
  var flashVarsString = '';
  var paramsString = '';
  var attrsString = '';

  // Convert flash vars to string
  if (flashVars) {
    Object.getOwnPropertyNames(flashVars).forEach(function (key) {
      flashVarsString += key + '=' + flashVars[key] + '&amp;';
    });
  }

  // Add swf, flashVars, and other default params
  params = (0, _obj.assign)({
    movie: swf,
    flashvars: flashVarsString,
    // Required to talk to swf
    allowScriptAccess: 'always',
    // All should be default, but having security issues.
    allowNetworking: 'all'
  }, params);

  // Create param tags string
  Object.getOwnPropertyNames(params).forEach(function (key) {
    paramsString += '<param name="' + key + '" value="' + params[key] + '" />';
  });

  attributes = (0, _obj.assign)({
    // Add swf to attributes (need both for IE and Others to work)
    data: swf,

    // Default to 100% width/height
    width: '100%',
    height: '100%'

  }, attributes);

  // Create Attributes string
  Object.getOwnPropertyNames(attributes).forEach(function (key) {
    attrsString += key + '="' + attributes[key] + '" ';
  });

  return '' + objTag + attrsString + '>' + paramsString + '</object>';
};

// Run Flash through the RTMP decorator
(0, _flashRtmp2['default'])(Flash);

_component2['default'].registerComponent('Flash', Flash);
_tech2['default'].registerTech('Flash', Flash);
exports['default'] = Flash;
