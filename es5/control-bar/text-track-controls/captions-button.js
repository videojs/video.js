'use strict';

exports.__esModule = true;

var _textTrackButton = require('./text-track-button.js');

var _textTrackButton2 = _interopRequireDefault(_textTrackButton);

var _component = require('../../component.js');

var _component2 = _interopRequireDefault(_component);

var _captionSettingsMenuItem = require('./caption-settings-menu-item.js');

var _captionSettingsMenuItem2 = _interopRequireDefault(_captionSettingsMenuItem);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * @file captions-button.js
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                */


/**
 * The button component for toggling and selecting captions
 *
 * @extends TextTrackButton
 */
var CaptionsButton = function (_TextTrackButton) {
  _inherits(CaptionsButton, _TextTrackButton);

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
  function CaptionsButton(player, options, ready) {
    _classCallCheck(this, CaptionsButton);

    var _this = _possibleConstructorReturn(this, _TextTrackButton.call(this, player, options, ready));

    _this.el_.setAttribute('aria-label', 'Captions Menu');
    return _this;
  }

  /**
   * Builds the default DOM `className`.
   *
   * @return {string}
   *         The DOM `className` for this object.
   */


  CaptionsButton.prototype.buildCSSClass = function buildCSSClass() {
    return 'vjs-captions-button ' + _TextTrackButton.prototype.buildCSSClass.call(this);
  };

  /**
   * Update caption menu items
   *
   * @param {EventTarget~Event} [event]
   *        The `addtrack` or `removetrack` event that caused this function to be
   *        called.
   *
   * @listens TextTrackList#addtrack
   * @listens TextTrackList#removetrack
   */


  CaptionsButton.prototype.update = function update(event) {
    var threshold = 2;

    _TextTrackButton.prototype.update.call(this);

    // if native, then threshold is 1 because no settings button
    if (this.player().tech_ && this.player().tech_.featuresNativeTextTracks) {
      threshold = 1;
    }

    if (this.items && this.items.length > threshold) {
      this.show();
    } else {
      this.hide();
    }
  };

  /**
   * Create caption menu items
   *
   * @return {CaptionSettingsMenuItem[]}
   *         The array of current menu items.
   */


  CaptionsButton.prototype.createItems = function createItems() {
    var items = [];

    if (!(this.player().tech_ && this.player().tech_.featuresNativeTextTracks)) {
      items.push(new _captionSettingsMenuItem2['default'](this.player_, { kind: this.kind_ }));
    }

    return _TextTrackButton.prototype.createItems.call(this, items);
  };

  return CaptionsButton;
}(_textTrackButton2['default']);

/**
 * `kind` of TextTrack to look for to associate it with this menu.
 *
 * @type {string}
 * @private
 */


CaptionsButton.prototype.kind_ = 'captions';

/**
 * The text that should display over the `CaptionsButton`s controls. Added for localization.
 *
 * @type {string}
 * @private
 */
CaptionsButton.prototype.controlText_ = 'Captions';

_component2['default'].registerComponent('CaptionsButton', CaptionsButton);
exports['default'] = CaptionsButton;
