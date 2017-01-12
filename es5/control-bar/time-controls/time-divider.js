'use strict';

exports.__esModule = true;

var _component = require('../../component.js');

var _component2 = _interopRequireDefault(_component);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * @file time-divider.js
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                */


/**
 * The separator between the current time and duration.
 * Can be hidden if it's not needed in the design.
 *
 * @extends Component
 */
var TimeDivider = function (_Component) {
  _inherits(TimeDivider, _Component);

  function TimeDivider() {
    _classCallCheck(this, TimeDivider);

    return _possibleConstructorReturn(this, _Component.apply(this, arguments));
  }

  /**
   * Create the component's DOM element
   *
   * @return {Element}
   *         The element that was created.
   */
  TimeDivider.prototype.createEl = function createEl() {
    return _Component.prototype.createEl.call(this, 'div', {
      className: 'vjs-time-control vjs-time-divider',
      innerHTML: '<div><span>/</span></div>'
    });
  };

  return TimeDivider;
}(_component2['default']);

_component2['default'].registerComponent('TimeDivider', TimeDivider);
exports['default'] = TimeDivider;
