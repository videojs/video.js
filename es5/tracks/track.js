'use strict';

exports.__esModule = true;

var _browser = require('../utils/browser.js');

var browser = _interopRequireWildcard(_browser);

var _document = require('global/document');

var _document2 = _interopRequireDefault(_document);

var _guid = require('../utils/guid.js');

var Guid = _interopRequireWildcard(_guid);

var _eventTarget = require('../event-target');

var _eventTarget2 = _interopRequireDefault(_eventTarget);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * @file track.js
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                */


/**
 * A Track class that contains all of the common functionality for {@link AudioTrack},
 * {@link VideoTrack}, and {@link TextTrack}.
 *
 * > Note: This class should not be used directly
 *
 * @see {@link https://html.spec.whatwg.org/multipage/embedded-content.html}
 * @extends EventTarget
 * @abstract
 */
var Track = function (_EventTarget) {
  _inherits(Track, _EventTarget);

  /**
   * Create an instance of this class.
   *
   * @param {Object} [options={}]
   *        Object of option names and values
   *
   * @param {string} [options.kind='']
   *        A valid kind for the track type you are creating.
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
   * @abstract
   */
  function Track() {
    var _ret;

    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    _classCallCheck(this, Track);

    var _this = _possibleConstructorReturn(this, _EventTarget.call(this));

    var track = _this; // eslint-disable-line

    if (browser.IS_IE8) {
      track = _document2['default'].createElement('custom');
      for (var prop in Track.prototype) {
        if (prop !== 'constructor') {
          track[prop] = Track.prototype[prop];
        }
      }
    }

    var trackProps = {
      id: options.id || 'vjs_track_' + Guid.newGUID(),
      kind: options.kind || '',
      label: options.label || '',
      language: options.language || ''
    };

    /**
     * @member {string} id
     *         The id of this track. Cannot be changed after creation.
     *
     * @readonly
     */

    /**
     * @member {string} kind
     *         The kind of track that this is. Cannot be changed after creation.
     *
     * @readonly
     */

    /**
     * @member {string} label
     *         The label of this track. Cannot be changed after creation.
     *
     * @readonly
     */

    /**
     * @member {string} language
     *         The two letter language code for this track. Cannot be changed after
     *         creation.
     *
     * @readonly
     */

    var _loop = function _loop(key) {
      Object.defineProperty(track, key, {
        get: function get() {
          return trackProps[key];
        },
        set: function set() {}
      });
    };

    for (var key in trackProps) {
      _loop(key);
    }

    return _ret = track, _possibleConstructorReturn(_this, _ret);
  }

  return Track;
}(_eventTarget2['default']);

exports['default'] = Track;
