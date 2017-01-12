'use strict';

exports.__esModule = true;

var _component = require('../../component.js');

var _component2 = _interopRequireDefault(_component);

require('./seek-bar.js');

require('./mouse-time-display.js');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * @file progress-control.js
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                */


/**
 * The Progress Control component contains the seek bar, load progress,
 * and play progress.
 *
 * @extends Component
 */
var ProgressControl = function (_Component) {
  _inherits(ProgressControl, _Component);

  function ProgressControl() {
    _classCallCheck(this, ProgressControl);

    return _possibleConstructorReturn(this, _Component.apply(this, arguments));
  }

  /**
   * Create the `Component`'s DOM element
   *
   * @return {Element}
   *         The element that was created.
   */
  ProgressControl.prototype.createEl = function createEl() {
    return _Component.prototype.createEl.call(this, 'div', {
      className: 'vjs-progress-control vjs-control'
    });
  };

  return ProgressControl;
}(_component2['default']);

/**
 * Default options for `ProgressControl`
 *
 * @type {Object}
 * @private
 */


ProgressControl.prototype.options_ = {
  children: ['seekBar']
};

_component2['default'].registerComponent('ProgressControl', ProgressControl);
exports['default'] = ProgressControl;
