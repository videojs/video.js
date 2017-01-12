'use strict';

exports.__esModule = true;

var _fn = require('../utils/fn.js');

var Fn = _interopRequireWildcard(_fn);

var _component = require('../component.js');

var _component2 = _interopRequireDefault(_component);

var _popup = require('../popup/popup.js');

var _popup2 = _interopRequireDefault(_popup);

var _popupButton = require('../popup/popup-button.js');

var _popupButton2 = _interopRequireDefault(_popupButton);

var _muteToggle = require('./mute-toggle.js');

var _muteToggle2 = _interopRequireDefault(_muteToggle);

var _volumeBar = require('./volume-control/volume-bar.js');

var _volumeBar2 = _interopRequireDefault(_volumeBar);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * @file volume-menu-button.js
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                */


/**
 * Button for volume popup
 *
 * @extends PopupButton
 */
var VolumeMenuButton = function (_PopupButton) {
  _inherits(VolumeMenuButton, _PopupButton);

  /**
   * Creates an instance of this class.
   *
   * @param {Player} player
   *        The `Player` that this class should be attached to.
   *
   * @param {Object} [options={}]
   *        The key/value store of player options.
   */
  function VolumeMenuButton(player) {
    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    _classCallCheck(this, VolumeMenuButton);

    // Default to inline
    if (options.inline === undefined) {
      options.inline = true;
    }

    // If the vertical option isn't passed at all, default to true.
    if (options.vertical === undefined) {
      // If an inline volumeMenuButton is used, we should default to using
      // a horizontal slider for obvious reasons.
      if (options.inline) {
        options.vertical = false;
      } else {
        options.vertical = true;
      }
    }

    // The vertical option needs to be set on the volumeBar as well,
    // since that will need to be passed along to the VolumeBar constructor
    options.volumeBar = options.volumeBar || {};
    options.volumeBar.vertical = !!options.vertical;

    // Same listeners as MuteToggle
    var _this = _possibleConstructorReturn(this, _PopupButton.call(this, player, options));

    _this.on(player, 'volumechange', _this.volumeUpdate);
    _this.on(player, 'loadstart', _this.volumeUpdate);

    // hide mute toggle if the current tech doesn't support volume control
    function updateVisibility() {
      if (player.tech_ && player.tech_.featuresVolumeControl === false) {
        this.addClass('vjs-hidden');
      } else {
        this.removeClass('vjs-hidden');
      }
    }

    updateVisibility.call(_this);
    _this.on(player, 'loadstart', updateVisibility);

    _this.on(_this.volumeBar, ['slideractive', 'focus'], function () {
      this.addClass('vjs-slider-active');
    });

    _this.on(_this.volumeBar, ['sliderinactive', 'blur'], function () {
      this.removeClass('vjs-slider-active');
    });

    _this.on(_this.volumeBar, ['focus'], function () {
      this.addClass('vjs-lock-showing');
    });

    _this.on(_this.volumeBar, ['blur'], function () {
      this.removeClass('vjs-lock-showing');
    });
    return _this;
  }

  /**
   * Builds the default DOM `className`.
   *
   * @return {string}
   *         The DOM `className` for this object.
   */


  VolumeMenuButton.prototype.buildCSSClass = function buildCSSClass() {
    var orientationClass = '';

    if (this.options_.vertical) {
      orientationClass = 'vjs-volume-menu-button-vertical';
    } else {
      orientationClass = 'vjs-volume-menu-button-horizontal';
    }

    return 'vjs-volume-menu-button ' + _PopupButton.prototype.buildCSSClass.call(this) + ' ' + orientationClass;
  };

  /**
   * Create the VolumeMenuButton popup
   *
   * @return {Popup}
   *         The popup that was created
   */


  VolumeMenuButton.prototype.createPopup = function createPopup() {
    var popup = new _popup2['default'](this.player_, {
      contentElType: 'div'
    });

    var vb = new _volumeBar2['default'](this.player_, this.options_.volumeBar);

    popup.addChild(vb);

    this.menuContent = popup;
    this.volumeBar = vb;

    this.attachVolumeBarEvents();

    return popup;
  };

  /**
   * This gets called when an `VolumeMenuButton` is "clicked". See
   * {@link ClickableComponent} for more detailed information on what a click can be.
   *
   * @param {EventTarget~Event} [event]
   *        The `keydown`, `tap`, or `click` event that caused this function to be
   *        called.
   *
   * @listens tap
   * @listens click
   */


  VolumeMenuButton.prototype.handleClick = function handleClick(event) {
    _muteToggle2['default'].prototype.handleClick.call(this);
    _PopupButton.prototype.handleClick.call(this);
  };

  /**
   * Add events listeners to the created `VolumeBar`.
   */


  VolumeMenuButton.prototype.attachVolumeBarEvents = function attachVolumeBarEvents() {
    this.menuContent.on(['mousedown', 'touchdown'], Fn.bind(this, this.handleMouseDown));
  };

  /**
   * Handle the `mousedown` and `touchdown` events on the `VolumeBar`
   *
   * @param {EventTarget~Event} [event]
   *        The `mousedown` or `touchdown` event that caused this to run.
   *
   * @listens mousedown
   * @listens touchdown
   */


  VolumeMenuButton.prototype.handleMouseDown = function handleMouseDown(event) {
    this.on(['mousemove', 'touchmove'], Fn.bind(this.volumeBar, this.volumeBar.handleMouseMove));
    this.on(this.el_.ownerDocument, ['mouseup', 'touchend'], this.handleMouseUp);
  };

  /**
   * Handle the `mouseup` and `touchend` events on the `VolumeBar`
   *
   * @param {EventTarget~Event} [event]
   *        The `mouseup` or `touchend` event that caused this to run.
   *
   * @listens mouseup
   * @listens touchend
   */


  VolumeMenuButton.prototype.handleMouseUp = function handleMouseUp(event) {
    this.off(['mousemove', 'touchmove'], Fn.bind(this.volumeBar, this.volumeBar.handleMouseMove));
  };

  return VolumeMenuButton;
}(_popupButton2['default']);

/**
 * @borrows MuteToggle#update as VolumeMenuButton#volumeUpdate
 */


VolumeMenuButton.prototype.volumeUpdate = _muteToggle2['default'].prototype.update;

/**
 * The text that should display over the `VolumeMenuButton`s controls. Added for localization.
 *
 * @type {string}
 * @private
 */
VolumeMenuButton.prototype.controlText_ = 'Mute';

_component2['default'].registerComponent('VolumeMenuButton', VolumeMenuButton);
exports['default'] = VolumeMenuButton;
