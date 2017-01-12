'use strict';

exports.__esModule = true;

var _component = require('../../component.js');

var _component2 = _interopRequireDefault(_component);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * @file spacer.js
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                */


/**
 * Just an empty spacer element that can be used as an append point for plugins, etc.
 * Also can be used to create space between elements when necessary.
 *
 * @extends Component
 */
var Spacer = function (_Component) {
  _inherits(Spacer, _Component);

  function Spacer() {
    _classCallCheck(this, Spacer);

    return _possibleConstructorReturn(this, _Component.apply(this, arguments));
  }

  /**
   * Builds the default DOM `className`.
   *
   * @return {string}
   *         The DOM `className` for this object.
   */
  Spacer.prototype.buildCSSClass = function buildCSSClass() {
    return 'vjs-spacer ' + _Component.prototype.buildCSSClass.call(this);
  };

  /**
   * Create the `Component`'s DOM element
   *
   * @return {Element}
   *         The element that was created.
   */


  Spacer.prototype.createEl = function createEl() {
    return _Component.prototype.createEl.call(this, 'div', {
      className: this.buildCSSClass()
    });
  };

  return Spacer;
}(_component2['default']);

_component2['default'].registerComponent('Spacer', Spacer);

exports['default'] = Spacer;
