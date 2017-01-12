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
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * @file chapters-track-menu-item.js
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                */


/**
 * The chapter track menu item
 *
 * @extends MenuItem
 */
var ChaptersTrackMenuItem = function (_MenuItem) {
  _inherits(ChaptersTrackMenuItem, _MenuItem);

  /**
   * Creates an instance of this class.
   *
   * @param {Player} player
   *        The `Player` that this class should be attached to.
   *
   * @param {Object} [options]
   *        The key/value store of player options.
   */
  function ChaptersTrackMenuItem(player, options) {
    _classCallCheck(this, ChaptersTrackMenuItem);

    var track = options.track;
    var cue = options.cue;
    var currentTime = player.currentTime();

    // Modify options for parent MenuItem class's init.
    options.selectable = true;
    options.label = cue.text;
    options.selected = cue.startTime <= currentTime && currentTime < cue.endTime;

    var _this = _possibleConstructorReturn(this, _MenuItem.call(this, player, options));

    _this.track = track;
    _this.cue = cue;
    track.addEventListener('cuechange', Fn.bind(_this, _this.update));
    return _this;
  }

  /**
   * This gets called when an `ChaptersTrackMenuItem` is "clicked". See
   * {@link ClickableComponent} for more detailed information on what a click can be.
   *
   * @param {EventTarget~Event} [event]
   *        The `keydown`, `tap`, or `click` event that caused this function to be
   *        called.
   *
   * @listens tap
   * @listens click
   */


  ChaptersTrackMenuItem.prototype.handleClick = function handleClick(event) {
    _MenuItem.prototype.handleClick.call(this);
    this.player_.currentTime(this.cue.startTime);
    this.update(this.cue.startTime);
  };

  /**
   * Update chapter menu item
   *
   * @param {EventTarget~Event} [event]
   *        The `cuechange` event that caused this function to run.
   *
   * @listens TextTrack#cuechange
   */


  ChaptersTrackMenuItem.prototype.update = function update(event) {
    var cue = this.cue;
    var currentTime = this.player_.currentTime();

    // vjs.log(currentTime, cue.startTime);
    this.selected(cue.startTime <= currentTime && currentTime < cue.endTime);
  };

  return ChaptersTrackMenuItem;
}(_menuItem2['default']);

_component2['default'].registerComponent('ChaptersTrackMenuItem', ChaptersTrackMenuItem);
exports['default'] = ChaptersTrackMenuItem;
