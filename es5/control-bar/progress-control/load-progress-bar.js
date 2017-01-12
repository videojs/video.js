'use strict';

exports.__esModule = true;

var _component = require('../../component.js');

var _component2 = _interopRequireDefault(_component);

var _dom = require('../../utils/dom.js');

var Dom = _interopRequireWildcard(_dom);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * @file load-progress-bar.js
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                */


/**
 * Shows loading progress
 *
 * @extends Component
 */
var LoadProgressBar = function (_Component) {
  _inherits(LoadProgressBar, _Component);

  /**
   * Creates an instance of this class.
   *
   * @param {Player} player
   *        The `Player` that this class should be attached to.
   *
   * @param {Object} [options]
   *        The key/value store of player options.
   */
  function LoadProgressBar(player, options) {
    _classCallCheck(this, LoadProgressBar);

    var _this = _possibleConstructorReturn(this, _Component.call(this, player, options));

    _this.partEls_ = [];
    _this.on(player, 'progress', _this.update);
    return _this;
  }

  /**
   * Create the `Component`'s DOM element
   *
   * @return {Element}
   *         The element that was created.
   */


  LoadProgressBar.prototype.createEl = function createEl() {
    return _Component.prototype.createEl.call(this, 'div', {
      className: 'vjs-load-progress',
      innerHTML: '<span class="vjs-control-text"><span>' + this.localize('Loaded') + '</span>: 0%</span>'
    });
  };

  /**
   * Update progress bar
   *
   * @param {EventTarget~Event} [event]
   *        The `progress` event that caused this function to run.
   *
   * @listens Player#progress
   */


  LoadProgressBar.prototype.update = function update(event) {
    var buffered = this.player_.buffered();
    var duration = this.player_.duration();
    var bufferedEnd = this.player_.bufferedEnd();
    var children = this.partEls_;

    // get the percent width of a time compared to the total end
    var percentify = function percentify(time, end) {
      // no NaN
      var percent = time / end || 0;

      return (percent >= 1 ? 1 : percent) * 100 + '%';
    };

    // update the width of the progress bar
    this.el_.style.width = percentify(bufferedEnd, duration);

    // add child elements to represent the individual buffered time ranges
    for (var i = 0; i < buffered.length; i++) {
      var start = buffered.start(i);
      var end = buffered.end(i);
      var part = children[i];

      if (!part) {
        part = this.el_.appendChild(Dom.createEl());
        children[i] = part;
      }

      // set the percent based on the width of the progress bar (bufferedEnd)
      part.style.left = percentify(start, bufferedEnd);
      part.style.width = percentify(end - start, bufferedEnd);
    }

    // remove unused buffered range elements
    for (var _i = children.length; _i > buffered.length; _i--) {
      this.el_.removeChild(children[_i - 1]);
    }
    children.length = buffered.length;
  };

  return LoadProgressBar;
}(_component2['default']);

_component2['default'].registerComponent('LoadProgressBar', LoadProgressBar);
exports['default'] = LoadProgressBar;
