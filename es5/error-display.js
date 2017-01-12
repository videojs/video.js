'use strict';

exports.__esModule = true;

var _component = require('./component');

var _component2 = _interopRequireDefault(_component);

var _modalDialog = require('./modal-dialog');

var _modalDialog2 = _interopRequireDefault(_modalDialog);

var _mergeOptions = require('./utils/merge-options');

var _mergeOptions2 = _interopRequireDefault(_mergeOptions);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * @file error-display.js
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                */


/**
 * A display that indicates an error has occurred. This means that the video
 * is unplayable.
 *
 * @extends ModalDialog
 */
var ErrorDisplay = function (_ModalDialog) {
  _inherits(ErrorDisplay, _ModalDialog);

  /**
   * Creates an instance of this class.
   *
   * @param  {Player} player
   *         The `Player` that this class should be attached to.
   *
   * @param  {Object} [options]
   *         The key/value store of player options.
   */
  function ErrorDisplay(player, options) {
    _classCallCheck(this, ErrorDisplay);

    var _this = _possibleConstructorReturn(this, _ModalDialog.call(this, player, options));

    _this.on(player, 'error', _this.open);
    return _this;
  }

  /**
   * Builds the default DOM `className`.
   *
   * @return {string}
   *         The DOM `className` for this object.
   *
   * @deprecated Since version 5.
   */


  ErrorDisplay.prototype.buildCSSClass = function buildCSSClass() {
    return 'vjs-error-display ' + _ModalDialog.prototype.buildCSSClass.call(this);
  };

  /**
   * Gets the localized error message based on the `Player`s error.
   *
   * @return {string}
   *         The `Player`s error message localized or an empty string.
   */


  ErrorDisplay.prototype.content = function content() {
    var error = this.player().error();

    return error ? this.localize(error.message) : '';
  };

  return ErrorDisplay;
}(_modalDialog2['default']);

/**
 * The default options for an `ErrorDisplay`.
 *
 * @private
 */


ErrorDisplay.prototype.options_ = (0, _mergeOptions2['default'])(_modalDialog2['default'].prototype.options_, {
  fillAlways: true,
  temporary: false,
  uncloseable: true
});

_component2['default'].registerComponent('ErrorDisplay', ErrorDisplay);
exports['default'] = ErrorDisplay;
