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
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * @file menu.js
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                */


/**
 * The Menu component is used to build popup menus, including subtitle and
 * captions selection menus.
 *
 * @extends Component
 */
var Menu = function (_Component) {
  _inherits(Menu, _Component);

  /**
   * Create an instance of this class.
   *
   * @param {Player} player
   *        the player that this component should attach to
   *
   * @param {Object} [options]
   *        Object of option names and values
   *
   */
  function Menu(player, options) {
    _classCallCheck(this, Menu);

    var _this = _possibleConstructorReturn(this, _Component.call(this, player, options));

    _this.focusedChild_ = -1;

    _this.on('keydown', _this.handleKeyPress);
    return _this;
  }

  /**
   * Add a {@link MenuItem} to the menu.
   *
   * @param {Object|string} component
   *        The name or instance of the `MenuItem` to add.
   *
   */


  Menu.prototype.addItem = function addItem(component) {
    this.addChild(component);
    component.on('click', Fn.bind(this, function (event) {
      this.unlockShowing();
      // TODO: Need to set keyboard focus back to the menuButton
    }));
  };

  /**
   * Create the `Menu`s DOM element.
   *
   * @return {Element}
   *         the element that was created
   */


  Menu.prototype.createEl = function createEl() {
    var contentElType = this.options_.contentElType || 'ul';

    this.contentEl_ = Dom.createEl(contentElType, {
      className: 'vjs-menu-content'
    });

    this.contentEl_.setAttribute('role', 'menu');

    var el = _Component.prototype.createEl.call(this, 'div', {
      append: this.contentEl_,
      className: 'vjs-menu'
    });

    el.setAttribute('role', 'presentation');
    el.appendChild(this.contentEl_);

    // Prevent clicks from bubbling up. Needed for Menu Buttons,
    // where a click on the parent is significant
    Events.on(el, 'click', function (event) {
      event.preventDefault();
      event.stopImmediatePropagation();
    });

    return el;
  };

  /**
   * Handle a `keydown` event on this menu. This listener is added in the constructor.
   *
   * @param {EventTarget~Event} event
   *        A `keydown` event that happened on the menu.
   *
   * @listens keydown
   */


  Menu.prototype.handleKeyPress = function handleKeyPress(event) {
    // Left and Down Arrows
    if (event.which === 37 || event.which === 40) {
      event.preventDefault();
      this.stepForward();

      // Up and Right Arrows
    } else if (event.which === 38 || event.which === 39) {
      event.preventDefault();
      this.stepBack();
    }
  };

  /**
   * Move to next (lower) menu item for keyboard users.
   */


  Menu.prototype.stepForward = function stepForward() {
    var stepChild = 0;

    if (this.focusedChild_ !== undefined) {
      stepChild = this.focusedChild_ + 1;
    }
    this.focus(stepChild);
  };

  /**
   * Move to previous (higher) menu item for keyboard users.
   */


  Menu.prototype.stepBack = function stepBack() {
    var stepChild = 0;

    if (this.focusedChild_ !== undefined) {
      stepChild = this.focusedChild_ - 1;
    }
    this.focus(stepChild);
  };

  /**
   * Set focus on a {@link MenuItem} in the `Menu`.
   *
   * @param {Object|string} [item=0]
   *        Index of child item set focus on.
   */


  Menu.prototype.focus = function focus() {
    var item = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;

    var children = this.children().slice();
    var haveTitle = children.length && children[0].className && /vjs-menu-title/.test(children[0].className);

    if (haveTitle) {
      children.shift();
    }

    if (children.length > 0) {
      if (item < 0) {
        item = 0;
      } else if (item >= children.length) {
        item = children.length - 1;
      }

      this.focusedChild_ = item;

      children[item].el_.focus();
    }
  };

  return Menu;
}(_component2['default']);

_component2['default'].registerComponent('Menu', Menu);
exports['default'] = Menu;
