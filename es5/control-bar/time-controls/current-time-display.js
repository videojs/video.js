'use strict';

exports.__esModule = true;

var _component = require('../../component.js');

var _component2 = _interopRequireDefault(_component);

var _dom = require('../../utils/dom.js');

var Dom = _interopRequireWildcard(_dom);

var _formatTime = require('../../utils/format-time.js');

var _formatTime2 = _interopRequireDefault(_formatTime);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * @file current-time-display.js
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                */


/**
 * Displays the current time
 *
 * @extends Component
 */
var CurrentTimeDisplay = function (_Component) {
  _inherits(CurrentTimeDisplay, _Component);

  /**
   * Creates an instance of this class.
   *
   * @param {Player} player
   *        The `Player` that this class should be attached to.
   *
   * @param {Object} [options]
   *        The key/value store of player options.
   */
  function CurrentTimeDisplay(player, options) {
    _classCallCheck(this, CurrentTimeDisplay);

    var _this = _possibleConstructorReturn(this, _Component.call(this, player, options));

    _this.on(player, 'timeupdate', _this.updateContent);
    return _this;
  }

  /**
   * Create the `Component`'s DOM element
   *
   * @return {Element}
   *         The element that was created.
   */


  CurrentTimeDisplay.prototype.createEl = function createEl() {
    var el = _Component.prototype.createEl.call(this, 'div', {
      className: 'vjs-current-time vjs-time-control vjs-control'
    });

    this.contentEl_ = Dom.createEl('div', {
      className: 'vjs-current-time-display',
      // label the current time for screen reader users
      innerHTML: '<span class="vjs-control-text">Current Time </span>' + '0:00'
    }, {
      // tell screen readers not to automatically read the time as it changes
      'aria-live': 'off'
    });

    el.appendChild(this.contentEl_);
    return el;
  };

  /**
   * Update current time display
   *
   * @param {EventTarget~Event} [event]
   *        The `timeupdate` event that caused this function to run.
   *
   * @listens Player#timeupdate
   */


  CurrentTimeDisplay.prototype.updateContent = function updateContent(event) {
    // Allows for smooth scrubbing, when player can't keep up.
    var time = this.player_.scrubbing() ? this.player_.getCache().currentTime : this.player_.currentTime();
    var localizedText = this.localize('Current Time');
    var formattedTime = (0, _formatTime2['default'])(time, this.player_.duration());

    if (formattedTime !== this.formattedTime_) {
      this.formattedTime_ = formattedTime;
      this.contentEl_.innerHTML = '<span class="vjs-control-text">' + localizedText + '</span> ' + formattedTime;
    }
  };

  return CurrentTimeDisplay;
}(_component2['default']);

_component2['default'].registerComponent('CurrentTimeDisplay', CurrentTimeDisplay);
exports['default'] = CurrentTimeDisplay;
