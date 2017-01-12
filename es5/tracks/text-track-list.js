'use strict';

exports.__esModule = true;

var _trackList = require('./track-list');

var _trackList2 = _interopRequireDefault(_trackList);

var _fn = require('../utils/fn.js');

var Fn = _interopRequireWildcard(_fn);

var _browser = require('../utils/browser.js');

var browser = _interopRequireWildcard(_browser);

var _document = require('global/document');

var _document2 = _interopRequireDefault(_document);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * @file text-track-list.js
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                */


/**
 * The current list of {@link TextTrack} for a media file.
 *
 * @see [Spec]{@link https://html.spec.whatwg.org/multipage/embedded-content.html#texttracklist}
 * @extends TrackList
 */
var TextTrackList = function (_TrackList) {
  _inherits(TextTrackList, _TrackList);

  /**
   * Create an instance of this class.
   *
   * @param {TextTrack[]} [tracks=[]]
   *        A list of `TextTrack` to instantiate the list with.
   */
  function TextTrackList() {
    var _this, _ret;

    var tracks = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];

    _classCallCheck(this, TextTrackList);

    var list = void 0;

    // IE8 forces us to implement inheritance ourselves
    // as it does not support Object.defineProperty properly
    if (browser.IS_IE8) {
      list = _document2['default'].createElement('custom');
      for (var prop in _trackList2['default'].prototype) {
        if (prop !== 'constructor') {
          list[prop] = _trackList2['default'].prototype[prop];
        }
      }
      for (var _prop in TextTrackList.prototype) {
        if (_prop !== 'constructor') {
          list[_prop] = TextTrackList.prototype[_prop];
        }
      }
    }

    list = (_this = _possibleConstructorReturn(this, _TrackList.call(this, tracks, list)), _this);
    return _ret = list, _possibleConstructorReturn(_this, _ret);
  }

  /**
   * Add a {@link TextTrack} to the `TextTrackList`
   *
   * @param {TextTrack} track
   *        The text track to add to the list.
   *
   * @fires TrackList#addtrack
   * @private
   */


  TextTrackList.prototype.addTrack_ = function addTrack_(track) {
    _TrackList.prototype.addTrack_.call(this, track);

    /**
     * @listens TextTrack#modechange
     * @fires TrackList#change
     */
    track.addEventListener('modechange', Fn.bind(this, function () {
      this.trigger('change');
    }));
  };

  return TextTrackList;
}(_trackList2['default']);

exports['default'] = TextTrackList;
