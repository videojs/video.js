'use strict';

exports.__esModule = true;

var _component = require('../component.js');

var _component2 = _interopRequireDefault(_component);

var _dom = require('../utils/dom.js');

var Dom = _interopRequireWildcard(_dom);

var _fn = require('../utils/fn.js');

var Fn = _interopRequireWildcard(_fn);

var _events = require('../utils/events.js');

var Events = _interopRequireWildcard(_events);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * @file popup.js
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                */


/**
 * The Popup component is used to build pop up controls.
 *
 * @extends Component
 */
var Popup = function (_Component) {
  _inherits(Popup, _Component);

  function Popup() {
    _classCallCheck(this, Popup);

    return _possibleConstructorReturn(this, _Component.apply(this, arguments));
  }

  /**
   * Add a popup item to the popup
   *
   * @param {Object|string} component
   *        Component or component type to add
   *
   */
  Popup.prototype.addItem = function addItem(component) {
    this.addChild(component);
    component.on('click', Fn.bind(this, function () {
      this.unlockShowing();
    }));
  };

  /**
   * Create the `PopupButton`s DOM element.
   *
   * @return {Element}
   *         The element that gets created.
   */


  Popup.prototype.createEl = function createEl() {
    var contentElType = this.options_.contentElType || 'ul';

    this.contentEl_ = Dom.createEl(contentElType, {
      className: 'vjs-menu-content'
    });

    var el = _Component.prototype.createEl.call(this, 'div', {
      append: this.contentEl_,
      className: 'vjs-menu'
    });

    el.appendChild(this.contentEl_);

    // Prevent clicks from bubbling up. Needed for Popup Buttons,
    // where a click on the parent is significant
    Events.on(el, 'click', function (event) {
      event.preventDefault();
      event.stopImmediatePropagation();
    });

    return el;
  };

  return Popup;
}(_component2['default']);

_component2['default'].registerComponent('Popup', Popup);
exports['default'] = Popup;
