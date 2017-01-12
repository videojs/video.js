'use strict';

exports.__esModule = true;

var _menuButton = require('../../menu/menu-button.js');

var _menuButton2 = _interopRequireDefault(_menuButton);

var _menu = require('../../menu/menu.js');

var _menu2 = _interopRequireDefault(_menu);

var _playbackRateMenuItem = require('./playback-rate-menu-item.js');

var _playbackRateMenuItem2 = _interopRequireDefault(_playbackRateMenuItem);

var _component = require('../../component.js');

var _component2 = _interopRequireDefault(_component);

var _dom = require('../../utils/dom.js');

var Dom = _interopRequireWildcard(_dom);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * @file playback-rate-menu-button.js
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                */


/**
 * The component for controlling the playback rate.
 *
 * @extends MenuButton
 */
var PlaybackRateMenuButton = function (_MenuButton) {
  _inherits(PlaybackRateMenuButton, _MenuButton);

  /**
   * Creates an instance of this class.
   *
   * @param {Player} player
   *        The `Player` that this class should be attached to.
   *
   * @param {Object} [options]
   *        The key/value store of player options.
   */
  function PlaybackRateMenuButton(player, options) {
    _classCallCheck(this, PlaybackRateMenuButton);

    var _this = _possibleConstructorReturn(this, _MenuButton.call(this, player, options));

    _this.updateVisibility();
    _this.updateLabel();

    _this.on(player, 'loadstart', _this.updateVisibility);
    _this.on(player, 'ratechange', _this.updateLabel);
    return _this;
  }

  /**
   * Create the `Component`'s DOM element
   *
   * @return {Element}
   *         The element that was created.
   */


  PlaybackRateMenuButton.prototype.createEl = function createEl() {
    var el = _MenuButton.prototype.createEl.call(this);

    this.labelEl_ = Dom.createEl('div', {
      className: 'vjs-playback-rate-value',
      innerHTML: 1.0
    });

    el.appendChild(this.labelEl_);

    return el;
  };

  /**
   * Builds the default DOM `className`.
   *
   * @return {string}
   *         The DOM `className` for this object.
   */


  PlaybackRateMenuButton.prototype.buildCSSClass = function buildCSSClass() {
    return 'vjs-playback-rate ' + _MenuButton.prototype.buildCSSClass.call(this);
  };

  /**
   * Create the playback rate menu
   *
   * @return {Menu}
   *         Menu object populated with {@link PlaybackRateMenuItem}s
   */


  PlaybackRateMenuButton.prototype.createMenu = function createMenu() {
    var menu = new _menu2['default'](this.player());
    var rates = this.playbackRates();

    if (rates) {
      for (var i = rates.length - 1; i >= 0; i--) {
        menu.addChild(new _playbackRateMenuItem2['default'](this.player(), { rate: rates[i] + 'x' }));
      }
    }

    return menu;
  };

  /**
   * Updates ARIA accessibility attributes
   */


  PlaybackRateMenuButton.prototype.updateARIAAttributes = function updateARIAAttributes() {
    // Current playback rate
    this.el().setAttribute('aria-valuenow', this.player().playbackRate());
  };

  /**
   * This gets called when an `PlaybackRateMenuButton` is "clicked". See
   * {@link ClickableComponent} for more detailed information on what a click can be.
   *
   * @param {EventTarget~Event} [event]
   *        The `keydown`, `tap`, or `click` event that caused this function to be
   *        called.
   *
   * @listens tap
   * @listens click
   */


  PlaybackRateMenuButton.prototype.handleClick = function handleClick(event) {
    // select next rate option
    var currentRate = this.player().playbackRate();
    var rates = this.playbackRates();

    // this will select first one if the last one currently selected
    var newRate = rates[0];

    for (var i = 0; i < rates.length; i++) {
      if (rates[i] > currentRate) {
        newRate = rates[i];
        break;
      }
    }
    this.player().playbackRate(newRate);
  };

  /**
   * Get possible playback rates
   *
   * @return {Array}
   *         All possible playback rates
   */


  PlaybackRateMenuButton.prototype.playbackRates = function playbackRates() {
    return this.options_.playbackRates || this.options_.playerOptions && this.options_.playerOptions.playbackRates;
  };

  /**
   * Get whether playback rates is supported by the tech
   * and an array of playback rates exists
   *
   * @return {boolean}
   *         Whether changing playback rate is supported
   */


  PlaybackRateMenuButton.prototype.playbackRateSupported = function playbackRateSupported() {
    return this.player().tech_ && this.player().tech_.featuresPlaybackRate && this.playbackRates() && this.playbackRates().length > 0;
  };

  /**
   * Hide playback rate controls when they're no playback rate options to select
   *
   * @param {EventTarget~Event} [event]
   *        The event that caused this function to run.
   *
   * @listens Player#loadstart
   */


  PlaybackRateMenuButton.prototype.updateVisibility = function updateVisibility(event) {
    if (this.playbackRateSupported()) {
      this.removeClass('vjs-hidden');
    } else {
      this.addClass('vjs-hidden');
    }
  };

  /**
   * Update button label when rate changed
   *
   * @param {EventTarget~Event} [event]
   *        The event that caused this function to run.
   *
   * @listens Player#ratechange
   */


  PlaybackRateMenuButton.prototype.updateLabel = function updateLabel(event) {
    if (this.playbackRateSupported()) {
      this.labelEl_.innerHTML = this.player().playbackRate() + 'x';
    }
  };

  return PlaybackRateMenuButton;
}(_menuButton2['default']);

/**
 * The text that should display over the `FullscreenToggle`s controls. Added for localization.
 *
 * @type {string}
 * @private
 */


PlaybackRateMenuButton.prototype.controlText_ = 'Playback Rate';

_component2['default'].registerComponent('PlaybackRateMenuButton', PlaybackRateMenuButton);
exports['default'] = PlaybackRateMenuButton;
