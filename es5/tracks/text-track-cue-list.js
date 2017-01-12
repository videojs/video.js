'use strict';

exports.__esModule = true;

var _browser = require('../utils/browser.js');

var browser = _interopRequireWildcard(_browser);

var _document = require('global/document');

var _document2 = _interopRequireDefault(_document);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } } /**
                                                                                                                                                           * @file text-track-cue-list.js
                                                                                                                                                           */


/**
 * @typedef {Object} TextTrackCue
 *
 * @property {string} id
 *           The unique id for this text track cue
 *
 * @property {number} startTime
 *           The start time for this text track cue
 *
 * @property {number} endTime
 *           The end time for this text track cue
 *
 * @property {boolean} pauseOnExit
 *           Pause when the end time is reached if true.
 *
 * @see [Spec]{@link https://html.spec.whatwg.org/multipage/embedded-content.html#texttrackcue}
 */

/**
 * A List of TextTrackCues.
 *
 * @see [Spec]{@link https://html.spec.whatwg.org/multipage/embedded-content.html#texttrackcuelist}
 */
var TextTrackCueList = function () {

  /**
   * Create an instance of this class..
   *
   * @param {Array} cues
   *        A list of cues to be initialized with
   */
  function TextTrackCueList(cues) {
    _classCallCheck(this, TextTrackCueList);

    var list = this; // eslint-disable-line

    if (browser.IS_IE8) {
      list = _document2['default'].createElement('custom');

      for (var prop in TextTrackCueList.prototype) {
        if (prop !== 'constructor') {
          list[prop] = TextTrackCueList.prototype[prop];
        }
      }
    }

    TextTrackCueList.prototype.setCues_.call(list, cues);

    /**
     * @member {number} length
     *         The current number of `TextTrackCue`s in the TextTrackCueList.
     */
    Object.defineProperty(list, 'length', {
      get: function get() {
        return this.length_;
      }
    });

    if (browser.IS_IE8) {
      return list;
    }
  }

  /**
   * A setter for cues in this list. Creates getters
   * an an index for the cues.
   *
   * @param {Array} cues
   *        An array of cues to set
   *
   * @private
   */


  TextTrackCueList.prototype.setCues_ = function setCues_(cues) {
    var oldLength = this.length || 0;
    var i = 0;
    var l = cues.length;

    this.cues_ = cues;
    this.length_ = cues.length;

    var defineProp = function defineProp(index) {
      if (!('' + index in this)) {
        Object.defineProperty(this, '' + index, {
          get: function get() {
            return this.cues_[index];
          }
        });
      }
    };

    if (oldLength < l) {
      i = oldLength;

      for (; i < l; i++) {
        defineProp.call(this, i);
      }
    }
  };

  /**
   * Get a `TextTrackCue` that is currently in the `TextTrackCueList` by id.
   *
   * @param {string} id
   *        The id of the cue that should be searched for.
   *
   * @return {TextTrackCue|null}
   *         A single cue or null if none was found.
   */


  TextTrackCueList.prototype.getCueById = function getCueById(id) {
    var result = null;

    for (var i = 0, l = this.length; i < l; i++) {
      var cue = this[i];

      if (cue.id === id) {
        result = cue;
        break;
      }
    }

    return result;
  };

  return TextTrackCueList;
}();

exports['default'] = TextTrackCueList;
