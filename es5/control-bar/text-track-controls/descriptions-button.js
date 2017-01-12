'use strict';

exports.__esModule = true;

var _textTrackButton = require('./text-track-button.js');

var _textTrackButton2 = _interopRequireDefault(_textTrackButton);

var _component = require('../../component.js');

var _component2 = _interopRequireDefault(_component);

var _fn = require('../../utils/fn.js');

var Fn = _interopRequireWildcard(_fn);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * @file descriptions-button.js
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                */


/**
 * The button component for toggling and selecting descriptions
 *
 * @extends TextTrackButton
 */
var DescriptionsButton = function (_TextTrackButton) {
  _inherits(DescriptionsButton, _TextTrackButton);

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
  function DescriptionsButton(player, options, ready) {
    _classCallCheck(this, DescriptionsButton);

    var _this = _possibleConstructorReturn(this, _TextTrackButton.call(this, player, options, ready));

    _this.el_.setAttribute('aria-label', 'Descriptions Menu');

    var tracks = player.textTracks();

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
   * Handle text track change
   *
   * @param {EventTarget~Event} event
   *        The event that caused this function to run
   *
   * @listens TextTrackList#change
   */


  DescriptionsButton.prototype.handleTracksChange = function handleTracksChange(event) {
    var tracks = this.player().textTracks();
    var disabled = false;

    // Check whether a track of a different kind is showing
    for (var i = 0, l = tracks.length; i < l; i++) {
      var track = tracks[i];

      if (track.kind !== this.kind_ && track.mode === 'showing') {
        disabled = true;
        break;
      }
    }

    // If another track is showing, disable this menu button
    if (disabled) {
      this.disable();
    } else {
      this.enable();
    }
  };

  /**
   * Builds the default DOM `className`.
   *
   * @return {string}
   *         The DOM `className` for this object.
   */


  DescriptionsButton.prototype.buildCSSClass = function buildCSSClass() {
    return 'vjs-descriptions-button ' + _TextTrackButton.prototype.buildCSSClass.call(this);
  };

  return DescriptionsButton;
}(_textTrackButton2['default']);

/**
 * `kind` of TextTrack to look for to associate it with this menu.
 *
 * @type {string}
 * @private
 */


DescriptionsButton.prototype.kind_ = 'descriptions';

/**
 * The text that should display over the `DescriptionsButton`s controls. Added for localization.
 *
 * @type {string}
 * @private
 */
DescriptionsButton.prototype.controlText_ = 'Descriptions';

_component2['default'].registerComponent('DescriptionsButton', DescriptionsButton);
exports['default'] = DescriptionsButton;
