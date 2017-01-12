'use strict';

exports.__esModule = true;

var _textTrackButton = require('./text-track-button.js');

var _textTrackButton2 = _interopRequireDefault(_textTrackButton);

var _component = require('../../component.js');

var _component2 = _interopRequireDefault(_component);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * @file subtitles-button.js
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                */


/**
 * The button component for toggling and selecting subtitles
 *
 * @extends TextTrackButton
 */
var SubtitlesButton = function (_TextTrackButton) {
  _inherits(SubtitlesButton, _TextTrackButton);

  /**
   * Creates an instance of this class.
   *
   * @param {Player} player
   *        The `Player` that this class should be attached to.
   *
   * @param {Object} [options]
   *        The key/value store of player options.
   *
   * @param {Component~ReadyCallback} [ready]
   *        The function to call when this component is ready.
   */
  function SubtitlesButton(player, options, ready) {
    _classCallCheck(this, SubtitlesButton);

    var _this = _possibleConstructorReturn(this, _TextTrackButton.call(this, player, options, ready));

    _this.el_.setAttribute('aria-label', 'Subtitles Menu');
    return _this;
  }

  /**
   * Builds the default DOM `className`.
   *
   * @return {string}
   *         The DOM `className` for this object.
   */


  SubtitlesButton.prototype.buildCSSClass = function buildCSSClass() {
    return 'vjs-subtitles-button ' + _TextTrackButton.prototype.buildCSSClass.call(this);
  };

  return SubtitlesButton;
}(_textTrackButton2['default']);

/**
 * `kind` of TextTrack to look for to associate it with this menu.
 *
 * @type {string}
 * @private
 */


SubtitlesButton.prototype.kind_ = 'subtitles';

/**
 * The text that should display over the `SubtitlesButton`s controls. Added for localization.
 *
 * @type {string}
 * @private
 */
SubtitlesButton.prototype.controlText_ = 'Subtitles';

_component2['default'].registerComponent('SubtitlesButton', SubtitlesButton);
exports['default'] = SubtitlesButton;
