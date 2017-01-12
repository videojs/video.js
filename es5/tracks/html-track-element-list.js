'use strict';

exports.__esModule = true;

var _browser = require('../utils/browser.js');

var browser = _interopRequireWildcard(_browser);

var _document = require('global/document');

var _document2 = _interopRequireDefault(_document);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } } /**
                                                                                                                                                           * @file html-track-element-list.js
                                                                                                                                                           */

/**
 * The current list of {@link HtmlTrackElement}s.
 */
var HtmlTrackElementList = function () {

  /**
   * Create an instance of this class.
   *
   * @param {HtmlTrackElement[]} [tracks=[]]
   *        A list of `HtmlTrackElement` to instantiate the list with.
   */
  function HtmlTrackElementList() {
    var trackElements = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];

    _classCallCheck(this, HtmlTrackElementList);

    var list = this; // eslint-disable-line

    if (browser.IS_IE8) {
      list = _document2['default'].createElement('custom');

      for (var prop in HtmlTrackElementList.prototype) {
        if (prop !== 'constructor') {
          list[prop] = HtmlTrackElementList.prototype[prop];
        }
      }
    }

    list.trackElements_ = [];

    /**
     * @member {number} length
     *         The current number of `Track`s in the this Trackist.
     */
    Object.defineProperty(list, 'length', {
      get: function get() {
        return this.trackElements_.length;
      }
    });

    for (var i = 0, length = trackElements.length; i < length; i++) {
      list.addTrackElement_(trackElements[i]);
    }

    if (browser.IS_IE8) {
      return list;
    }
  }

  /**
   * Add an {@link HtmlTrackElement} to the `HtmlTrackElementList`
   *
   * @param {HtmlTrackElement} trackElement
   *        The track element to add to the list.
   *
   * @private
   */


  HtmlTrackElementList.prototype.addTrackElement_ = function addTrackElement_(trackElement) {
    var index = this.trackElements_.length;

    if (!('' + index in this)) {
      Object.defineProperty(this, index, {
        get: function get() {
          return this.trackElements_[index];
        }
      });
    }

    // Do not add duplicate elements
    if (this.trackElements_.indexOf(trackElement) === -1) {
      this.trackElements_.push(trackElement);
    }
  };

  /**
   * Get an {@link HtmlTrackElement} from the `HtmlTrackElementList` given an
   * {@link TextTrack}.
   *
   * @param {TextTrack} track
   *        The track associated with a track element.
   *
   * @return {HtmlTrackElement|undefined}
   *         The track element that was found or undefined.
   *
   * @private
   */


  HtmlTrackElementList.prototype.getTrackElementByTrack_ = function getTrackElementByTrack_(track) {
    var trackElement_ = void 0;

    for (var i = 0, length = this.trackElements_.length; i < length; i++) {
      if (track === this.trackElements_[i].track) {
        trackElement_ = this.trackElements_[i];

        break;
      }
    }

    return trackElement_;
  };

  /**
   * Remove a {@link HtmlTrackElement} from the `HtmlTrackElementList`
   *
   * @param {HtmlTrackElement} trackElement
   *        The track element to remove from the list.
   *
   * @private
   */


  HtmlTrackElementList.prototype.removeTrackElement_ = function removeTrackElement_(trackElement) {
    for (var i = 0, length = this.trackElements_.length; i < length; i++) {
      if (trackElement === this.trackElements_[i]) {
        this.trackElements_.splice(i, 1);

        break;
      }
    }
  };

  return HtmlTrackElementList;
}();

exports['default'] = HtmlTrackElementList;
