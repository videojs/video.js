'use strict';

exports.__esModule = true;

var _clickableComponent = require('../clickable-component.js');

var _clickableComponent2 = _interopRequireDefault(_clickableComponent);

var _component = require('../component.js');

var _component2 = _interopRequireDefault(_component);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * @file popup-button.js
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                */


/**
 * A button class for use with {@link Popup} controls
 *
 * @extends ClickableComponent
 */
var PopupButton = function (_ClickableComponent) {
  _inherits(PopupButton, _ClickableComponent);

  /**
   * Create an instance of this class.
   *
   * @param {Player} player
   *        The `Player` that this class should be attached to.
   *
   * @param {Object} [options]
   *        The key/value store of player options.
   */
  function PopupButton(player) {
    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    _classCallCheck(this, PopupButton);

    var _this = _possibleConstructorReturn(this, _ClickableComponent.call(this, player, options));

    _this.update();
    return _this;
  }

  /**
   * Update the `Popup` that this button is attached to.
   */


  PopupButton.prototype.update = function update() {
    var popup = this.createPopup();

    if (this.popup) {
      this.removeChild(this.popup);
    }

    this.popup = popup;
    this.addChild(popup);

    if (this.items && this.items.length === 0) {
      this.hide();
    } else if (this.items && this.items.length > 1) {
      this.show();
    }
  };

  /**
   * Create a `Popup`. - Override with specific functionality for component
   *
   * @abstract
   */


  PopupButton.prototype.createPopup = function createPopup() {};

  /**
   * Create the `PopupButton`s DOM element.
   *
   * @return {Element}
   *         The element that gets created.
   */


  PopupButton.prototype.createEl = function createEl() {
    return _ClickableComponent.prototype.createEl.call(this, 'div', {
      className: this.buildCSSClass()
    });
  };

  /**
   * Builds the default DOM `className`.
   *
   * @return {string}
   *         The DOM `className` for this object.
   */


  PopupButton.prototype.buildCSSClass = function buildCSSClass() {
    var menuButtonClass = 'vjs-menu-button';

    // If the inline option is passed, we want to use different styles altogether.
    if (this.options_.inline === true) {
      menuButtonClass += '-inline';
    } else {
      menuButtonClass += '-popup';
    }

    return 'vjs-menu-button ' + menuButtonClass + ' ' + _ClickableComponent.prototype.buildCSSClass.call(this);
  };

  return PopupButton;
}(_clickableComponent2['default']);

_component2['default'].registerComponent('PopupButton', PopupButton);
exports['default'] = PopupButton;
