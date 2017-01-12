'use strict';

exports.__esModule = true;

var _trackEnums = require('./track-enums');

var _track = require('./track');

var _track2 = _interopRequireDefault(_track);

var _mergeOptions = require('../utils/merge-options');

var _mergeOptions2 = _interopRequireDefault(_mergeOptions);

var _browser = require('../utils/browser.js');

var browser = _interopRequireWildcard(_browser);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

/**
 * A representation of a single `AudioTrack`. If it is part of an {@link AudioTrackList}
 * only one `AudioTrack` in the list will be enabled at a time.
 *
 * @see [Spec]{@link https://html.spec.whatwg.org/multipage/embedded-content.html#audiotrack}
 * @extends Track
 */
var AudioTrack = function (_Track) {
  _inherits(AudioTrack, _Track);

  /**
   * Create an instance of this class.
   *
   * @param {Object} [options={}]
   *        Object of option names and values
   *
   * @param {AudioTrack~Kind} [options.kind='']
   *        A valid audio track kind
   *
   * @param {string} [options.id='vjs_track_' + Guid.newGUID()]
   *        A unique id for this AudioTrack.
   *
   * @param {string} [options.label='']
   *        The menu label for this track.
   *
   * @param {string} [options.language='']
   *        A valid two character language code.
   *
   * @param {boolean} [options.enabled]
   *        If this track is the one that is currently playing. If this track is part of
   *        an {@link AudioTrackList}, only one {@link AudioTrack} will be enabled.
   */
  function AudioTrack() {
    var _this, _ret;

    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    _classCallCheck(this, AudioTrack);

    var settings = (0, _mergeOptions2['default'])(options, {
      kind: _trackEnums.AudioTrackKind[options.kind] || ''
    });
    // on IE8 this will be a document element
    // for every other browser this will be a normal object
    var track = (_this = _possibleConstructorReturn(this, _Track.call(this, settings)), _this);
    var enabled = false;

    if (browser.IS_IE8) {
      for (var prop in AudioTrack.prototype) {
        if (prop !== 'constructor') {
          track[prop] = AudioTrack.prototype[prop];
        }
      }
    }
    /**
     * @member {boolean} enabled
     *         If this `AudioTrack` is enabled or not. When setting this will
     *         fire {@link AudioTrack#enabledchange} if the state of enabled is changed.
     *
     * @fires VideoTrack#selectedchange
     */
    Object.defineProperty(track, 'enabled', {
      get: function get() {
        return enabled;
      },
      set: function set(newEnabled) {
        // an invalid or unchanged value
        if (typeof newEnabled !== 'boolean' || newEnabled === enabled) {
          return;
        }
        enabled = newEnabled;

        /**
         * An event that fires when enabled changes on this track. This allows
         * the AudioTrackList that holds this track to act accordingly.
         *
         * > Note: This is not part of the spec! Native tracks will do
         *         this internally without an event.
         *
         * @event AudioTrack#enabledchange
         * @type {EventTarget~Event}
         */
        this.trigger('enabledchange');
      }
    });

    // if the user sets this track to selected then
    // set selected to that true value otherwise
    // we keep it false
    if (settings.enabled) {
      track.enabled = settings.enabled;
    }
    track.loaded_ = true;

    return _ret = track, _possibleConstructorReturn(_this, _ret);
  }

  return AudioTrack;
}(_track2['default']);

exports['default'] = AudioTrack;
