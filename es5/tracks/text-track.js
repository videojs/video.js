'use strict';

exports.__esModule = true;

var _textTrackCueList = require('./text-track-cue-list');

var _textTrackCueList2 = _interopRequireDefault(_textTrackCueList);

var _fn = require('../utils/fn.js');

var Fn = _interopRequireWildcard(_fn);

var _trackEnums = require('./track-enums');

var _log = require('../utils/log.js');

var _log2 = _interopRequireDefault(_log);

var _window = require('global/window');

var _window2 = _interopRequireDefault(_window);

var _track = require('./track.js');

var _track2 = _interopRequireDefault(_track);

var _url = require('../utils/url.js');

var _xhr = require('xhr');

var _xhr2 = _interopRequireDefault(_xhr);

var _mergeOptions = require('../utils/merge-options');

var _mergeOptions2 = _interopRequireDefault(_mergeOptions);

var _browser = require('../utils/browser.js');

var browser = _interopRequireWildcard(_browser);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * @file text-track.js
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                */


/**
 * Takes a webvtt file contents and parses it into cues
 *
 * @param {string} srcContent
 *        webVTT file contents
 *
 * @param {TextTrack} track
 *        TextTrack to add cues to. Cues come from the srcContent.
 *
 * @private
 */
var parseCues = function parseCues(srcContent, track) {
  var parser = new _window2['default'].WebVTT.Parser(_window2['default'], _window2['default'].vttjs, _window2['default'].WebVTT.StringDecoder());
  var errors = [];

  parser.oncue = function (cue) {
    track.addCue(cue);
  };

  parser.onparsingerror = function (error) {
    errors.push(error);
  };

  parser.onflush = function () {
    track.trigger({
      type: 'loadeddata',
      target: track
    });
  };

  parser.parse(srcContent);
  if (errors.length > 0) {
    if (_window2['default'].console && _window2['default'].console.groupCollapsed) {
      _window2['default'].console.groupCollapsed('Text Track parsing errors for ' + track.src);
    }
    errors.forEach(function (error) {
      return _log2['default'].error(error);
    });
    if (_window2['default'].console && _window2['default'].console.groupEnd) {
      _window2['default'].console.groupEnd();
    }
  }

  parser.flush();
};

/**
 * Load a `TextTrack` from a specifed url.
 *
 * @param {string} src
 *        Url to load track from.
 *
 * @param {TextTrack} track
 *        Track to add cues to. Comes from the content at the end of `url`.
 *
 * @private
 */
var loadTrack = function loadTrack(src, track) {
  var opts = {
    uri: src
  };
  var crossOrigin = (0, _url.isCrossOrigin)(src);

  if (crossOrigin) {
    opts.cors = crossOrigin;
  }

  (0, _xhr2['default'])(opts, Fn.bind(this, function (err, response, responseBody) {
    if (err) {
      return _log2['default'].error(err, response);
    }

    track.loaded_ = true;

    // Make sure that vttjs has loaded, otherwise, wait till it finished loading
    // NOTE: this is only used for the alt/video.novtt.js build
    if (typeof _window2['default'].WebVTT !== 'function') {
      if (track.tech_) {
        (function () {
          var loadHandler = function loadHandler() {
            return parseCues(responseBody, track);
          };

          track.tech_.on('vttjsloaded', loadHandler);
          track.tech_.on('vttjserror', function () {
            _log2['default'].error('vttjs failed to load, stopping trying to process ' + track.src);
            track.tech_.off('vttjsloaded', loadHandler);
          });
        })();
      }
    } else {
      parseCues(responseBody, track);
    }
  }));
};

/**
 * A representation of a single `TextTrack`.
 *
 * @see [Spec]{@link https://html.spec.whatwg.org/multipage/embedded-content.html#texttrack}
 * @extends Track
 */

var TextTrack = function (_Track) {
  _inherits(TextTrack, _Track);

  /**
   * Create an instance of this class.
   *
   * @param {Object} options={}
   *        Object of option names and values
   *
   * @param {Tech} options.tech
   *        A reference to the tech that owns this TextTrack.
   *
   * @param {TextTrack~Kind} [options.kind='subtitles']
   *        A valid text track kind.
   *
   * @param {TextTrack~Mode} [options.mode='disabled']
   *        A valid text track mode.
   *
   * @param {string} [options.id='vjs_track_' + Guid.newGUID()]
   *        A unique id for this TextTrack.
   *
   * @param {string} [options.label='']
   *        The menu label for this track.
   *
   * @param {string} [options.language='']
   *        A valid two character language code.
   *
   * @param {string} [options.srclang='']
   *        A valid two character language code. An alternative, but deprioritized
   *        vesion of `options.language`
   *
   * @param {string} [options.src]
   *        A url to TextTrack cues.
   *
   * @param {boolean} [options.default]
   *        If this track should default to on or off.
   */
  function TextTrack() {
    var _this, _ret2;

    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    _classCallCheck(this, TextTrack);

    if (!options.tech) {
      throw new Error('A tech was not provided.');
    }

    var settings = (0, _mergeOptions2['default'])(options, {
      kind: _trackEnums.TextTrackKind[options.kind] || 'subtitles',
      language: options.language || options.srclang || ''
    });
    var mode = _trackEnums.TextTrackMode[settings.mode] || 'disabled';
    var default_ = settings['default'];

    if (settings.kind === 'metadata' || settings.kind === 'chapters') {
      mode = 'hidden';
    }
    // on IE8 this will be a document element
    // for every other browser this will be a normal object
    var tt = (_this = _possibleConstructorReturn(this, _Track.call(this, settings)), _this);

    tt.tech_ = settings.tech;

    if (browser.IS_IE8) {
      for (var prop in TextTrack.prototype) {
        if (prop !== 'constructor') {
          tt[prop] = TextTrack.prototype[prop];
        }
      }
    }

    tt.cues_ = [];
    tt.activeCues_ = [];

    var cues = new _textTrackCueList2['default'](tt.cues_);
    var activeCues = new _textTrackCueList2['default'](tt.activeCues_);
    var changed = false;
    var timeupdateHandler = Fn.bind(tt, function () {

      // Accessing this.activeCues for the side-effects of updating itself
      // due to it's nature as a getter function. Do not remove or cues will
      // stop updating!
      /* eslint-disable no-unused-expressions */
      this.activeCues;
      /* eslint-enable no-unused-expressions */
      if (changed) {
        this.trigger('cuechange');
        changed = false;
      }
    });

    if (mode !== 'disabled') {
      tt.tech_.on('timeupdate', timeupdateHandler);
    }

    /**
     * @member {boolean} default
     *         If this track was set to be on or off by default. Cannot be changed after
     *         creation.
     *
     * @readonly
     */
    Object.defineProperty(tt, 'default', {
      get: function get() {
        return default_;
      },
      set: function set() {}
    });

    /**
     * @member {string} mode
     *         Set the mode of this TextTrack to a valid {@link TextTrack~Mode}. Will
     *         not be set if setting to an invalid mode.
     *
     * @fires TextTrack#modechange
     */
    Object.defineProperty(tt, 'mode', {
      get: function get() {
        return mode;
      },
      set: function set(newMode) {
        if (!_trackEnums.TextTrackMode[newMode]) {
          return;
        }
        mode = newMode;
        if (mode === 'showing') {
          this.tech_.on('timeupdate', timeupdateHandler);
        }
        /**
         * An event that fires when mode changes on this track. This allows
         * the TextTrackList that holds this track to act accordingly.
         *
         * > Note: This is not part of the spec!
         *
         * @event TextTrack#modechange
         * @type {EventTarget~Event}
         */
        this.trigger('modechange');
      }
    });

    /**
     * @member {TextTrackCueList} cues
     *         The text track cue list for this TextTrack.
     */
    Object.defineProperty(tt, 'cues', {
      get: function get() {
        if (!this.loaded_) {
          return null;
        }

        return cues;
      },
      set: function set() {}
    });

    /**
     * @member {TextTrackCueList} activeCues
     *         The list text track cues that are currently active for this TextTrack.
     */
    Object.defineProperty(tt, 'activeCues', {
      get: function get() {
        if (!this.loaded_) {
          return null;
        }

        // nothing to do
        if (this.cues.length === 0) {
          return activeCues;
        }

        var ct = this.tech_.currentTime();
        var active = [];

        for (var i = 0, l = this.cues.length; i < l; i++) {
          var cue = this.cues[i];

          if (cue.startTime <= ct && cue.endTime >= ct) {
            active.push(cue);
          } else if (cue.startTime === cue.endTime && cue.startTime <= ct && cue.startTime + 0.5 >= ct) {
            active.push(cue);
          }
        }

        changed = false;

        if (active.length !== this.activeCues_.length) {
          changed = true;
        } else {
          for (var _i = 0; _i < active.length; _i++) {
            if (this.activeCues_.indexOf(active[_i]) === -1) {
              changed = true;
            }
          }
        }

        this.activeCues_ = active;
        activeCues.setCues_(this.activeCues_);

        return activeCues;
      },
      set: function set() {}
    });

    if (settings.src) {
      tt.src = settings.src;
      loadTrack(settings.src, tt);
    } else {
      tt.loaded_ = true;
    }

    return _ret2 = tt, _possibleConstructorReturn(_this, _ret2);
  }

  /**
   * Add a cue to the internal list of cues.
   *
   * @param {TextTrack~Cue} cue
   *        The cue to add to our internal list
   */


  TextTrack.prototype.addCue = function addCue(cue) {
    var tracks = this.tech_.textTracks();

    if (tracks) {
      for (var i = 0; i < tracks.length; i++) {
        if (tracks[i] !== this) {
          tracks[i].removeCue(cue);
        }
      }
    }

    this.cues_.push(cue);
    this.cues.setCues_(this.cues_);
  };

  /**
   * Remove a cue from our internal list
   *
   * @param {TextTrack~Cue} removeCue
   *        The cue to remove from our internal list
   */


  TextTrack.prototype.removeCue = function removeCue(_removeCue) {
    var removed = false;

    for (var i = 0, l = this.cues_.length; i < l; i++) {
      var cue = this.cues_[i];

      if (cue === _removeCue) {
        this.cues_.splice(i, 1);
        removed = true;
      }
    }

    if (removed) {
      this.cues.setCues_(this.cues_);
    }
  };

  return TextTrack;
}(_track2['default']);

/**
 * cuechange - One or more cues in the track have become active or stopped being active.
 */


TextTrack.prototype.allowedEvents_ = {
  cuechange: 'cuechange'
};

exports['default'] = TextTrack;
