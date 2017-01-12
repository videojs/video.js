'use strict';

exports.__esModule = true;

var _menuItem = require('../../menu/menu-item.js');

var _menuItem2 = _interopRequireDefault(_menuItem);

var _component = require('../../component.js');

var _component2 = _interopRequireDefault(_component);

var _fn = require('../../utils/fn.js');

var Fn = _interopRequireWildcard(_fn);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * @file audio-track-menu-item.js
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                */


/**
 * An {@link AudioTrack} {@link MenuItem}
 *
 * @extends MenuItem
 */
var AudioTrackMenuItem = function (_MenuItem) {
  _inherits(AudioTrackMenuItem, _MenuItem);

  /**
   * Creates an instance of this class.
   *
   * @param {Player} player
   *        The `Player` that this class should be attached to.
   *
   * @param {Object} [options]
   *        The key/value store of player options.
   */
  function AudioTrackMenuItem(player, options) {
    _classCallCheck(this, AudioTrackMenuItem);

    var track = options.track;
    var tracks = player.audioTracks();

    // Modify options for parent MenuItem class's init.
    options.label = track.label || track.language || 'Unknown';
    options.selected = track.enabled;

    var _this = _possibleConstructorReturn(this, _MenuItem.call(this, player, options));

    _this.track = track;

    if (tracks) {
      (function () {
        var changeHandler = Fn.bind(_this, _this.handleTracksChange);

        tracks.addEventListener('change', changeHandler);
        _this.on('dispose', function () {
          tracks.removeEventListener('change', changeHandler);
        });
      })();
    }
    return _this;
  }

  /**
   * This gets called when an `AudioTrackMenuItem is "clicked". See {@link ClickableComponent}
   * for more detailed information on what a click can be.
   *
   * @param {EventTarget~Event} [event]
   *        The `keydown`, `tap`, or `click` event that caused this function to be
   *        called.
   *
   * @listens tap
   * @listens click
   */


  AudioTrackMenuItem.prototype.handleClick = function handleClick(event) {
    var tracks = this.player_.audioTracks();

    _MenuItem.prototype.handleClick.call(this, event);

    if (!tracks) {
      return;
    }

    for (var i = 0; i < tracks.length; i++) {
      var track = tracks[i];

      track.enabled = track === this.track;
    }
  };

  /**
   * Handle any {@link AudioTrack} change.
   *
   * @param {EventTarget~Event} [event]
   *        The {@link AudioTrackList#change} event that caused this to run.
   *
   * @listens AudioTrackList#change
   */


  AudioTrackMenuItem.prototype.handleTracksChange = function handleTracksChange(event) {
    this.selected(this.track.enabled);
  };

  return AudioTrackMenuItem;
}(_menuItem2['default']);

_component2['default'].registerComponent('AudioTrackMenuItem', AudioTrackMenuItem);
exports['default'] = AudioTrackMenuItem;
