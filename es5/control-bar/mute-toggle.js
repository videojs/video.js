'use strict';

exports.__esModule = true;

var _button = require('../button');

var _button2 = _interopRequireDefault(_button);

var _component = require('../component');

var _component2 = _interopRequireDefault(_component);

var _dom = require('../utils/dom.js');

var Dom = _interopRequireWildcard(_dom);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * @file mute-toggle.js
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                */


/**
 * A button component for muting the audio.
 *
 * @extends Button
 */
var MuteToggle = function (_Button) {
  _inherits(MuteToggle, _Button);

  /**
   * Creates an instance of this class.
   *
   * @param {Player} player
   *        The `Player` that this class should be attached to.
   *
   * @param {Object} [options]
   *        The key/value store of player options.
   */
  function MuteToggle(player, options) {
    _classCallCheck(this, MuteToggle);

    var _this = _possibleConstructorReturn(this, _Button.call(this, player, options));

    _this.on(player, 'volumechange', _this.update);

    // hide mute toggle if the current tech doesn't support volume control
    if (player.tech_ && player.tech_.featuresVolumeControl === false) {
      _this.addClass('vjs-hidden');
    }

    _this.on(player, 'loadstart', function () {
      // We need to update the button to account for a default muted state.
      this.update();

      if (player.tech_.featuresVolumeControl === false) {
        this.addClass('vjs-hidden');
      } else {
        this.removeClass('vjs-hidden');
      }
    });
    return _this;
  }

  /**
   * Builds the default DOM `className`.
   *
   * @return {string}
   *         The DOM `className` for this object.
   */


  MuteToggle.prototype.buildCSSClass = function buildCSSClass() {
    return 'vjs-mute-control ' + _Button.prototype.buildCSSClass.call(this);
  };

  /**
   * This gets called when an `MuteToggle` is "clicked". See
   * {@link ClickableComponent} for more detailed information on what a click can be.
   *
   * @param {EventTarget~Event} [event]
   *        The `keydown`, `tap`, or `click` event that caused this function to be
   *        called.
   *
   * @listens tap
   * @listens click
   */


  MuteToggle.prototype.handleClick = function handleClick(event) {
    this.player_.muted(this.player_.muted() ? false : true);
  };

  /**
   * Update the state of volume.
   *
   * @param {EventTarget~Event} [event]
   *        The {@link Player#loadstart} event if this function was called through an
   *        event.
   *
   * @listens Player#loadstart
   */


  MuteToggle.prototype.update = function update(event) {
    var vol = this.player_.volume();
    var level = 3;

    if (vol === 0 || this.player_.muted()) {
      level = 0;
    } else if (vol < 0.33) {
      level = 1;
    } else if (vol < 0.67) {
      level = 2;
    }

    // Don't rewrite the button text if the actual text doesn't change.
    // This causes unnecessary and confusing information for screen reader users.
    // This check is needed because this function gets called every time the volume level is changed.
    var toMute = this.player_.muted() ? 'Unmute' : 'Mute';

    if (this.controlText() !== toMute) {
      this.controlText(toMute);
    }

    // TODO improve muted icon classes
    for (var i = 0; i < 4; i++) {
      Dom.removeElClass(this.el_, 'vjs-vol-' + i);
    }
    Dom.addElClass(this.el_, 'vjs-vol-' + level);
  };

  return MuteToggle;
}(_button2['default']);

/**
 * The text that should display over the `MuteToggle`s controls. Added for localization.
 *
 * @type {string}
 * @private
 */


MuteToggle.prototype.controlText_ = 'Mute';

_component2['default'].registerComponent('MuteToggle', MuteToggle);
exports['default'] = MuteToggle;
