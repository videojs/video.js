'use strict';

exports.__esModule = true;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _menuItem = require('../../menu/menu-item.js');

var _menuItem2 = _interopRequireDefault(_menuItem);

var _component = require('../../component.js');

var _component2 = _interopRequireDefault(_component);

var _fn = require('../../utils/fn.js');

var Fn = _interopRequireWildcard(_fn);

var _window = require('global/window');

var _window2 = _interopRequireDefault(_window);

var _document = require('global/document');

var _document2 = _interopRequireDefault(_document);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * @file text-track-menu-item.js
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                */


/**
 * The specific menu item type for selecting a language within a text track kind
 *
 * @extends MenuItem
 */
var TextTrackMenuItem = function (_MenuItem) {
  _inherits(TextTrackMenuItem, _MenuItem);

  /**
   * Creates an instance of this class.
   *
   * @param {Player} player
   *        The `Player` that this class should be attached to.
   *
   * @param {Object} [options]
   *        The key/value store of player options.
   */
  function TextTrackMenuItem(player, options) {
    _classCallCheck(this, TextTrackMenuItem);

    var track = options.track;
    var tracks = player.textTracks();

    // Modify options for parent MenuItem class's init.
    options.label = track.label || track.language || 'Unknown';
    options.selected = track['default'] || track.mode === 'showing';

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

    // iOS7 doesn't dispatch change events to TextTrackLists when an
    // associated track's mode changes. Without something like
    // Object.observe() (also not present on iOS7), it's not
    // possible to detect changes to the mode attribute and polyfill
    // the change event. As a poor substitute, we manually dispatch
    // change events whenever the controls modify the mode.
    if (tracks && tracks.onchange === undefined) {
      (function () {
        var event = void 0;

        _this.on(['tap', 'click'], function () {
          if (_typeof(_window2['default'].Event) !== 'object') {
            // Android 2.3 throws an Illegal Constructor error for window.Event
            try {
              event = new _window2['default'].Event('change');
            } catch (err) {
              // continue regardless of error
            }
          }

          if (!event) {
            event = _document2['default'].createEvent('Event');
            event.initEvent('change', true, true);
          }

          tracks.dispatchEvent(event);
        });
      })();
    }
    return _this;
  }

  /**
   * This gets called when an `TextTrackMenuItem` is "clicked". See
   * {@link ClickableComponent} for more detailed information on what a click can be.
   *
   * @param {EventTarget~Event} event
   *        The `keydown`, `tap`, or `click` event that caused this function to be
   *        called.
   *
   * @listens tap
   * @listens click
   */


  TextTrackMenuItem.prototype.handleClick = function handleClick(event) {
    var kind = this.track.kind;
    var tracks = this.player_.textTracks();

    _MenuItem.prototype.handleClick.call(this, event);

    if (!tracks) {
      return;
    }

    for (var i = 0; i < tracks.length; i++) {
      var track = tracks[i];

      if (track.kind !== kind) {
        continue;
      }

      if (track === this.track) {
        track.mode = 'showing';
      } else {
        track.mode = 'disabled';
      }
    }
  };

  /**
   * Handle text track list change
   *
   * @param {EventTarget~Event} event
   *        The `change` event that caused this function to be called.
   *
   * @listens TextTrackList#change
   */


  TextTrackMenuItem.prototype.handleTracksChange = function handleTracksChange(event) {
    this.selected(this.track.mode === 'showing');
  };

  return TextTrackMenuItem;
}(_menuItem2['default']);

_component2['default'].registerComponent('TextTrackMenuItem', TextTrackMenuItem);
exports['default'] = TextTrackMenuItem;
