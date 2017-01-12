'use strict';

exports.__esModule = true;

var _trackButton = require('../track-button.js');

var _trackButton2 = _interopRequireDefault(_trackButton);

var _component = require('../../component.js');

var _component2 = _interopRequireDefault(_component);

var _textTrackMenuItem = require('./text-track-menu-item.js');

var _textTrackMenuItem2 = _interopRequireDefault(_textTrackMenuItem);

var _offTextTrackMenuItem = require('./off-text-track-menu-item.js');

var _offTextTrackMenuItem2 = _interopRequireDefault(_offTextTrackMenuItem);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * @file text-track-button.js
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                */


/**
 * The base class for buttons that toggle specific text track types (e.g. subtitles)
 *
 * @extends MenuButton
 */
var TextTrackButton = function (_TrackButton) {
  _inherits(TextTrackButton, _TrackButton);

  /**
   * Creates an instance of this class.
   *
   * @param {Player} player
   *        The `Player` that this class should be attached to.
   *
   * @param {Object} [options={}]
   *        The key/value store of player options.
   */
  function TextTrackButton(player) {
    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    _classCallCheck(this, TextTrackButton);

    options.tracks = player.textTracks();

    return _possibleConstructorReturn(this, _TrackButton.call(this, player, options));
  }

  /**
   * Create a menu item for each text track
   *
   * @param {TextTrackMenuItem[]} [items=[]]
   *        Existing array of items to use during creation
   *
   * @return {TextTrackMenuItem[]}
   *         Array of menu items that were created
   */


  TextTrackButton.prototype.createItems = function createItems() {
    var items = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];

    // Add an OFF menu item to turn all tracks off
    items.push(new _offTextTrackMenuItem2['default'](this.player_, { kind: this.kind_ }));

    var tracks = this.player_.textTracks();

    if (!tracks) {
      return items;
    }

    for (var i = 0; i < tracks.length; i++) {
      var track = tracks[i];

      // only add tracks that are of the appropriate kind and have a label
      if (track.kind === this.kind_) {
        items.push(new _textTrackMenuItem2['default'](this.player_, {
          track: track,
          // MenuItem is selectable
          selectable: true
        }));
      }
    }

    return items;
  };

  return TextTrackButton;
}(_trackButton2['default']);

_component2['default'].registerComponent('TextTrackButton', TextTrackButton);
exports['default'] = TextTrackButton;
