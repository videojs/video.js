'use strict';

exports.__esModule = true;

var _component = require('../component.js');

var _component2 = _interopRequireDefault(_component);

require('./play-toggle.js');

require('./time-controls/current-time-display.js');

require('./time-controls/duration-display.js');

require('./time-controls/time-divider.js');

require('./time-controls/remaining-time-display.js');

require('./live-display.js');

require('./progress-control/progress-control.js');

require('./fullscreen-toggle.js');

require('./volume-control/volume-control.js');

require('./volume-menu-button.js');

require('./mute-toggle.js');

require('./text-track-controls/chapters-button.js');

require('./text-track-controls/descriptions-button.js');

require('./text-track-controls/subtitles-button.js');

require('./text-track-controls/captions-button.js');

require('./audio-track-controls/audio-track-button.js');

require('./playback-rate-menu/playback-rate-menu-button.js');

require('./spacer-controls/custom-control-spacer.js');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * @file control-bar.js
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                */


// Required children


/**
 * Container of main controls.
 *
 * @extends Component
 */
var ControlBar = function (_Component) {
  _inherits(ControlBar, _Component);

  function ControlBar() {
    _classCallCheck(this, ControlBar);

    return _possibleConstructorReturn(this, _Component.apply(this, arguments));
  }

  /**
   * Create the `Component`'s DOM element
   *
   * @return {Element}
   *         The element that was created.
   */
  ControlBar.prototype.createEl = function createEl() {
    return _Component.prototype.createEl.call(this, 'div', {
      className: 'vjs-control-bar',
      dir: 'ltr'
    }, {
      // The control bar is a group, so it can contain menuitems
      role: 'group'
    });
  };

  return ControlBar;
}(_component2['default']);

/**
 * Default options for `ControlBar`
 *
 * @type {Object}
 * @private
 */


ControlBar.prototype.options_ = {
  children: ['playToggle', 'volumeMenuButton', 'currentTimeDisplay', 'timeDivider', 'durationDisplay', 'progressControl', 'liveDisplay', 'remainingTimeDisplay', 'customControlSpacer', 'playbackRateMenuButton', 'chaptersButton', 'descriptionsButton', 'subtitlesButton', 'captionsButton', 'audioTrackButton', 'fullscreenToggle']
};

_component2['default'].registerComponent('ControlBar', ControlBar);
exports['default'] = ControlBar;
