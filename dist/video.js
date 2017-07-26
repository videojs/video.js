/**
 * @license
 * Video.js 5.20.2 <http://videojs.com/>
 * Copyright Brightcove, Inc. <https://www.brightcove.com/>
 * Available under Apache License Version 2.0
 * <https://github.com/videojs/video.js/blob/master/LICENSE>
 *
 * Includes vtt.js <https://github.com/mozilla/vtt.js>
 * Available under Apache License Version 2.0
 * <https://github.com/mozilla/vtt.js/blob/master/LICENSE>
 */

(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.videojs = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){
'use strict';

exports.__esModule = true;

var _button = _dereq_(2);

var _button2 = _interopRequireDefault(_button);

var _component = _dereq_(5);

var _component2 = _interopRequireDefault(_component);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * @file big-play-button.js
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                */


/**
 * The initial play button that shows before the video has played. The hiding of the
 * `BigPlayButton` get done via CSS and `Player` states.
 *
 * @extends Button
 */
var BigPlayButton = function (_Button) {
  _inherits(BigPlayButton, _Button);

  function BigPlayButton(player, options) {
    _classCallCheck(this, BigPlayButton);

    var _this = _possibleConstructorReturn(this, _Button.call(this, player, options));

    _this.mouseused_ = false;

    _this.on('mousedown', _this.handleMouseDown);
    return _this;
  }

  /**
   * Builds the default DOM `className`.
   *
   * @return {string}
   *         The DOM `className` for this object. Always returns 'vjs-big-play-button'.
   */


  BigPlayButton.prototype.buildCSSClass = function buildCSSClass() {
    return 'vjs-big-play-button';
  };

  /**
   * This gets called when a `BigPlayButton` "clicked". See {@link ClickableComponent}
   * for more detailed information on what a click can be.
   *
   * @param {EventTarget~Event} event
   *        The `keydown`, `tap`, or `click` event that caused this function to be
   *        called.
   *
   * @listens tap
   * @listens click
   */


  BigPlayButton.prototype.handleClick = function handleClick(event) {
    var playPromise = this.player_.play();

    // exit early if clicked via the mouse
    if (this.mouseused_ && event.clientX && event.clientY) {
      return;
    }

    var cb = this.player_.getChild('controlBar');
    var playToggle = cb && cb.getChild('playToggle');

    if (!playToggle) {
      this.player_.focus();
      return;
    }

    var playFocus = function playFocus() {
      return playToggle.focus();
    };

    if (playPromise && playPromise.then) {
      var ignoreRejectedPlayPromise = function ignoreRejectedPlayPromise() {};

      playPromise.then(playFocus, ignoreRejectedPlayPromise);
    } else {
      this.setTimeout(playFocus, 1);
    }
  };

  BigPlayButton.prototype.handleKeyPress = function handleKeyPress(event) {
    this.mouseused_ = false;

    _Button.prototype.handleKeyPress.call(this, event);
  };

  BigPlayButton.prototype.handleMouseDown = function handleMouseDown(event) {
    this.mouseused_ = true;
  };

  return BigPlayButton;
}(_button2['default']);

/**
 * The text that should display over the `BigPlayButton`s controls. Added to for localization.
 *
 * @type {string}
 * @private
 */


BigPlayButton.prototype.controlText_ = 'Play Video';

_component2['default'].registerComponent('BigPlayButton', BigPlayButton);
exports['default'] = BigPlayButton;

},{"2":2,"5":5}],2:[function(_dereq_,module,exports){
'use strict';

exports.__esModule = true;

var _clickableComponent = _dereq_(3);

var _clickableComponent2 = _interopRequireDefault(_clickableComponent);

var _component = _dereq_(5);

var _component2 = _interopRequireDefault(_component);

var _log = _dereq_(86);

var _log2 = _interopRequireDefault(_log);

var _obj = _dereq_(88);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * @file button.js
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                */


/**
 * Base class for all buttons.
 *
 * @extends ClickableComponent
 */
var Button = function (_ClickableComponent) {
  _inherits(Button, _ClickableComponent);

  function Button() {
    _classCallCheck(this, Button);

    return _possibleConstructorReturn(this, _ClickableComponent.apply(this, arguments));
  }

  /**
   * Create the `Button`s DOM element.
   *
   * @param {string} [tag=button]
   *        Element's node type. e.g. 'button'
   *
   * @param {Object} [props={}]
   *        An object of properties that should be set on the element.
   *
   * @param {Object} [attributes={}]
   *        An object of attributes that should be set on the element.
   *
   * @return {Element}
   *         The element that gets created.
   */
  Button.prototype.createEl = function createEl() {
    var tag = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'button';
    var props = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    var attributes = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

    props = (0, _obj.assign)({
      className: this.buildCSSClass()
    }, props);

    if (tag !== 'button') {
      _log2['default'].warn('Creating a Button with an HTML element of ' + tag + ' is deprecated; use ClickableComponent instead.');

      // Add properties for clickable element which is not a native HTML button
      props = (0, _obj.assign)({
        tabIndex: 0
      }, props);

      // Add ARIA attributes for clickable element which is not a native HTML button
      attributes = (0, _obj.assign)({
        role: 'button'
      }, attributes);
    }

    // Add attributes for button element
    attributes = (0, _obj.assign)({

      // Necessary since the default button type is "submit"
      'type': 'button',

      // let the screen reader user know that the text of the button may change
      'aria-live': 'polite'
    }, attributes);

    var el = _component2['default'].prototype.createEl.call(this, tag, props, attributes);

    this.createControlTextEl(el);

    return el;
  };

  /**
   * Add a child `Component` inside of this `Button`.
   *
   * @param {string|Component} child
   *        The name or instance of a child to add.
   *
   * @param {Object} [options={}]
   *        The key/value store of options that will get passed to children of
   *        the child.
   *
   * @return {Component}
   *         The `Component` that gets added as a child. When using a string the
   *         `Component` will get created by this process.
   *
   * @deprecated since version 5
   */


  Button.prototype.addChild = function addChild(child) {
    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    var className = this.constructor.name;

    _log2['default'].warn('Adding an actionable (user controllable) child to a Button (' + className + ') is not supported; use a ClickableComponent instead.');

    // Avoid the error message generated by ClickableComponent's addChild method
    return _component2['default'].prototype.addChild.call(this, child, options);
  };

  /**
   * Enable the `Button` element so that it can be activated or clicked. Use this with
   * {@link Button#disable}.
   */


  Button.prototype.enable = function enable() {
    _ClickableComponent.prototype.enable.call(this);
    this.el_.removeAttribute('disabled');
  };

  /**
   * Enable the `Button` element so that it cannot be activated or clicked. Use this with
   * {@link Button#enable}.
   */


  Button.prototype.disable = function disable() {
    _ClickableComponent.prototype.disable.call(this);
    this.el_.setAttribute('disabled', 'disabled');
  };

  /**
   * This gets called when a `Button` has focus and `keydown` is triggered via a key
   * press.
   *
   * @param {EventTarget~Event} event
   *        The event that caused this function to get called.
   *
   * @listens keydown
   */


  Button.prototype.handleKeyPress = function handleKeyPress(event) {

    // Ignore Space (32) or Enter (13) key operation, which is handled by the browser for a button.
    if (event.which === 32 || event.which === 13) {
      return;
    }

    // Pass keypress handling up for unsupported keys
    _ClickableComponent.prototype.handleKeyPress.call(this, event);
  };

  return Button;
}(_clickableComponent2['default']);

_component2['default'].registerComponent('Button', Button);
exports['default'] = Button;

},{"3":3,"5":5,"86":86,"88":88}],3:[function(_dereq_,module,exports){
'use strict';

exports.__esModule = true;

var _component = _dereq_(5);

var _component2 = _interopRequireDefault(_component);

var _dom = _dereq_(81);

var Dom = _interopRequireWildcard(_dom);

var _events = _dereq_(82);

var Events = _interopRequireWildcard(_events);

var _fn = _dereq_(83);

var Fn = _interopRequireWildcard(_fn);

var _log = _dereq_(86);

var _log2 = _interopRequireDefault(_log);

var _document = _dereq_(94);

var _document2 = _interopRequireDefault(_document);

var _obj = _dereq_(88);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * @file button.js
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                */


/**
 * Clickable Component which is clickable or keyboard actionable,
 * but is not a native HTML button.
 *
 * @extends Component
 */
var ClickableComponent = function (_Component) {
  _inherits(ClickableComponent, _Component);

  /**
   * Creates an instance of this class.
   *
   * @param  {Player} player
   *         The `Player` that this class should be attached to.
   *
   * @param  {Object} [options]
   *         The key/value store of player options.
   */
  function ClickableComponent(player, options) {
    _classCallCheck(this, ClickableComponent);

    var _this = _possibleConstructorReturn(this, _Component.call(this, player, options));

    _this.emitTapEvents();

    _this.enable();
    return _this;
  }

  /**
   * Create the `Component`s DOM element.
   *
   * @param {string} [tag=div]
   *        The element's node type.
   *
   * @param {Object} [props={}]
   *        An object of properties that should be set on the element.
   *
   * @param {Object} [attributes={}]
   *        An object of attributes that should be set on the element.
   *
   * @return {Element}
   *         The element that gets created.
   */


  ClickableComponent.prototype.createEl = function createEl() {
    var tag = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'div';
    var props = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    var attributes = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

    props = (0, _obj.assign)({
      className: this.buildCSSClass(),
      tabIndex: 0
    }, props);

    if (tag === 'button') {
      _log2['default'].error('Creating a ClickableComponent with an HTML element of ' + tag + ' is not supported; use a Button instead.');
    }

    // Add ARIA attributes for clickable element which is not a native HTML button
    attributes = (0, _obj.assign)({
      'role': 'button',

      // let the screen reader user know that the text of the element may change
      'aria-live': 'polite'
    }, attributes);

    this.tabIndex_ = props.tabIndex;

    var el = _Component.prototype.createEl.call(this, tag, props, attributes);

    this.createControlTextEl(el);

    return el;
  };

  /**
   * Create a control text element on this `Component`
   *
   * @param {Element} [el]
   *        Parent element for the control text.
   *
   * @return {Element}
   *         The control text element that gets created.
   */


  ClickableComponent.prototype.createControlTextEl = function createControlTextEl(el) {
    this.controlTextEl_ = Dom.createEl('span', {
      className: 'vjs-control-text'
    });

    if (el) {
      el.appendChild(this.controlTextEl_);
    }

    this.controlText(this.controlText_, el);

    return this.controlTextEl_;
  };

  /**
   * Get or set the localize text to use for the controls on the `Component`.
   *
   * @param {string} [text]
   *        Control text for element.
   *
   * @param {Element} [el=this.el()]
   *        Element to set the title on.
   *
   * @return {string|ClickableComponent}
   *         - The control text when getting
   *         - Returns itself when setting; method can be chained.
   */


  ClickableComponent.prototype.controlText = function controlText(text) {
    var el = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : this.el();

    if (!text) {
      return this.controlText_ || 'Need Text';
    }

    var localizedText = this.localize(text);

    this.controlText_ = text;
    this.controlTextEl_.innerHTML = localizedText;

    if (!this.nonIconControl) {
      // Set title attribute if only an icon is shown
      el.setAttribute('title', localizedText);
    }

    return this;
  };

  /**
   * Builds the default DOM `className`.
   *
   * @return {string}
   *         The DOM `className` for this object.
   */


  ClickableComponent.prototype.buildCSSClass = function buildCSSClass() {
    return 'vjs-control vjs-button ' + _Component.prototype.buildCSSClass.call(this);
  };

  /**
   * Enable this `Component`s element.
   *
   * @return {ClickableComponent}
   *         Returns itself; method can be chained.
   */


  ClickableComponent.prototype.enable = function enable() {
    this.removeClass('vjs-disabled');
    this.el_.setAttribute('aria-disabled', 'false');
    if (typeof this.tabIndex_ !== 'undefined') {
      this.el_.setAttribute('tabIndex', this.tabIndex_);
    }
    this.off(['tap', 'click'], this.handleClick);
    this.off('focus', this.handleFocus);
    this.off('blur', this.handleBlur);
    this.on(['tap', 'click'], this.handleClick);
    this.on('focus', this.handleFocus);
    this.on('blur', this.handleBlur);
    return this;
  };

  /**
   * Disable this `Component`s element.
   *
   * @return {ClickableComponent}
   *         Returns itself; method can be chained.
   */


  ClickableComponent.prototype.disable = function disable() {
    this.addClass('vjs-disabled');
    this.el_.setAttribute('aria-disabled', 'true');
    if (typeof this.tabIndex_ !== 'undefined') {
      this.el_.removeAttribute('tabIndex');
    }
    this.off(['tap', 'click'], this.handleClick);
    this.off('focus', this.handleFocus);
    this.off('blur', this.handleBlur);
    return this;
  };

  /**
   * This gets called when a `ClickableComponent` gets:
   * - Clicked (via the `click` event, listening starts in the constructor)
   * - Tapped (via the `tap` event, listening starts in the constructor)
   * - The following things happen in order:
   *   1. {@link ClickableComponent#handleFocus} is called via a `focus` event on the
   *      `ClickableComponent`.
   *   2. {@link ClickableComponent#handleFocus} adds a listener for `keydown` on using
   *      {@link ClickableComponent#handleKeyPress}.
   *   3. `ClickableComponent` has not had a `blur` event (`blur` means that focus was lost). The user presses
   *      the space or enter key.
   *   4. {@link ClickableComponent#handleKeyPress} calls this function with the `keydown`
   *      event as a parameter.
   *
   * @param {EventTarget~Event} event
   *        The `keydown`, `tap`, or `click` event that caused this function to be
   *        called.
   *
   * @listens tap
   * @listens click
   * @abstract
   */


  ClickableComponent.prototype.handleClick = function handleClick(event) {};

  /**
   * This gets called when a `ClickableComponent` gains focus via a `focus` event.
   * Turns on listening for `keydown` events. When they happen it
   * calls `this.handleKeyPress`.
   *
   * @param {EventTarget~Event} event
   *        The `focus` event that caused this function to be called.
   *
   * @listens focus
   */


  ClickableComponent.prototype.handleFocus = function handleFocus(event) {
    Events.on(_document2['default'], 'keydown', Fn.bind(this, this.handleKeyPress));
  };

  /**
   * Called when this ClickableComponent has focus and a key gets pressed down. By
   * default it will call `this.handleClick` when the key is space or enter.
   *
   * @param {EventTarget~Event} event
   *        The `keydown` event that caused this function to be called.
   *
   * @listens keydown
   */


  ClickableComponent.prototype.handleKeyPress = function handleKeyPress(event) {

    // Support Space (32) or Enter (13) key operation to fire a click event
    if (event.which === 32 || event.which === 13) {
      event.preventDefault();
      this.handleClick(event);
    } else if (_Component.prototype.handleKeyPress) {

      // Pass keypress handling up for unsupported keys
      _Component.prototype.handleKeyPress.call(this, event);
    }
  };

  /**
   * Called when a `ClickableComponent` loses focus. Turns off the listener for
   * `keydown` events. Which Stops `this.handleKeyPress` from getting called.
   *
   * @param {EventTarget~Event} event
   *        The `blur` event that caused this function to be called.
   *
   * @listens blur
   */


  ClickableComponent.prototype.handleBlur = function handleBlur(event) {
    Events.off(_document2['default'], 'keydown', Fn.bind(this, this.handleKeyPress));
  };

  return ClickableComponent;
}(_component2['default']);

_component2['default'].registerComponent('ClickableComponent', ClickableComponent);
exports['default'] = ClickableComponent;

},{"5":5,"81":81,"82":82,"83":83,"86":86,"88":88,"94":94}],4:[function(_dereq_,module,exports){
'use strict';

exports.__esModule = true;

var _button = _dereq_(2);

var _button2 = _interopRequireDefault(_button);

var _component = _dereq_(5);

var _component2 = _interopRequireDefault(_component);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * @file close-button.js
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                */


/**
 * The `CloseButton` is a `{@link Button}` that fires a `close` event when
 * it gets clicked.
 *
 * @extends Button
 */
var CloseButton = function (_Button) {
  _inherits(CloseButton, _Button);

  /**
   * Creates an instance of the this class.
   *
   * @param  {Player} player
   *         The `Player` that this class should be attached to.
   *
   * @param  {Object} [options]
   *         The key/value store of player options.
   */
  function CloseButton(player, options) {
    _classCallCheck(this, CloseButton);

    var _this = _possibleConstructorReturn(this, _Button.call(this, player, options));

    _this.controlText(options && options.controlText || _this.localize('Close'));
    return _this;
  }

  /**
   * Builds the default DOM `className`.
   *
   * @return {string}
   *         The DOM `className` for this object.
   */


  CloseButton.prototype.buildCSSClass = function buildCSSClass() {
    return 'vjs-close-button ' + _Button.prototype.buildCSSClass.call(this);
  };

  /**
   * This gets called when a `CloseButton` gets clicked. See
   * {@link ClickableComponent#handleClick} for more information on when this will be
   * triggered
   *
   * @param {EventTarget~Event} event
   *        The `keydown`, `tap`, or `click` event that caused this function to be
   *        called.
   *
   * @listens tap
   * @listens click
   * @fires CloseButton#close
   */


  CloseButton.prototype.handleClick = function handleClick(event) {

    /**
     * Triggered when the a `CloseButton` is clicked.
     *
     * @event CloseButton#close
     * @type {EventTarget~Event}
     *
     * @property {boolean} [bubbles=false]
     *           set to false so that the close event does not
     *           bubble up to parents if there is no listener
     */
    this.trigger({ type: 'close', bubbles: false });
  };

  return CloseButton;
}(_button2['default']);

_component2['default'].registerComponent('CloseButton', CloseButton);
exports['default'] = CloseButton;

},{"2":2,"5":5}],5:[function(_dereq_,module,exports){
'use strict';

exports.__esModule = true;

var _window = _dereq_(95);

var _window2 = _interopRequireDefault(_window);

var _dom = _dereq_(81);

var Dom = _interopRequireWildcard(_dom);

var _fn = _dereq_(83);

var Fn = _interopRequireWildcard(_fn);

var _guid = _dereq_(85);

var Guid = _interopRequireWildcard(_guid);

var _events = _dereq_(82);

var Events = _interopRequireWildcard(_events);

var _log = _dereq_(86);

var _log2 = _interopRequireDefault(_log);

var _toTitleCase = _dereq_(91);

var _toTitleCase2 = _interopRequireDefault(_toTitleCase);

var _mergeOptions = _dereq_(87);

var _mergeOptions2 = _interopRequireDefault(_mergeOptions);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } } /**
                                                                                                                                                           * Player Component - Base class for all UI objects
                                                                                                                                                           *
                                                                                                                                                           * @file component.js
                                                                                                                                                           */


/**
 * Base class for all UI Components.
 * Components are UI objects which represent both a javascript object and an element
 * in the DOM. They can be children of other components, and can have
 * children themselves.
 *
 * Components can also use methods from {@link EventTarget}
 */
var Component = function () {

  /**
   * A callback that is called when a component is ready. Does not have any
   * paramters and any callback value will be ignored.
   *
   * @callback Component~ReadyCallback
   * @this Component
   */

  /**
   * Creates an instance of this class.
   *
   * @param {Player} player
   *        The `Player` that this class should be attached to.
   *
   * @param {Object} [options]
   *        The key/value store of player options.
   #
   * @param {Object[]} [options.children]
   *        An array of children objects to intialize this component with. Children objects have
   *        a name property that will be used if more than one component of the same type needs to be
   *        added.
   *
   * @param {Component~ReadyCallback} [ready]
   *        Function that gets called when the `Component` is ready.
   */
  function Component(player, options, ready) {
    _classCallCheck(this, Component);

    // The component might be the player itself and we can't pass `this` to super
    if (!player && this.play) {
      this.player_ = player = this; // eslint-disable-line
    } else {
      this.player_ = player;
    }

    // Make a copy of prototype.options_ to protect against overriding defaults
    this.options_ = (0, _mergeOptions2['default'])({}, this.options_);

    // Updated options with supplied options
    options = this.options_ = (0, _mergeOptions2['default'])(this.options_, options);

    // Get ID from options or options element if one is supplied
    this.id_ = options.id || options.el && options.el.id;

    // If there was no ID from the options, generate one
    if (!this.id_) {
      // Don't require the player ID function in the case of mock players
      var id = player && player.id && player.id() || 'no_player';

      this.id_ = id + '_component_' + Guid.newGUID();
    }

    this.name_ = options.name || null;

    // Create element if one wasn't provided in options
    if (options.el) {
      this.el_ = options.el;
    } else if (options.createEl !== false) {
      this.el_ = this.createEl();
    }

    this.children_ = [];
    this.childIndex_ = {};
    this.childNameIndex_ = {};

    // Add any child components in options
    if (options.initChildren !== false) {
      this.initChildren();
    }

    this.ready(ready);
    // Don't want to trigger ready here or it will before init is actually
    // finished for all children that run this constructor

    if (options.reportTouchActivity !== false) {
      this.enableTouchActivity();
    }
  }

  /**
   * Dispose of the `Component` and all child components.
   *
   * @fires Component#dispose
   */


  Component.prototype.dispose = function dispose() {

    /**
     * Triggered when a `Component` is disposed.
     *
     * @event Component#dispose
     * @type {EventTarget~Event}
     *
     * @property {boolean} [bubbles=false]
     *           set to false so that the close event does not
     *           bubble up
     */
    this.trigger({ type: 'dispose', bubbles: false });

    // Dispose all children.
    if (this.children_) {
      for (var i = this.children_.length - 1; i >= 0; i--) {
        if (this.children_[i].dispose) {
          this.children_[i].dispose();
        }
      }
    }

    // Delete child references
    this.children_ = null;
    this.childIndex_ = null;
    this.childNameIndex_ = null;

    // Remove all event listeners.
    this.off();

    // Remove element from DOM
    if (this.el_.parentNode) {
      this.el_.parentNode.removeChild(this.el_);
    }

    Dom.removeElData(this.el_);
    this.el_ = null;
  };

  /**
   * Return the {@link Player} that the `Component` has attached to.
   *
   * @return {Player}
   *         The player that this `Component` has attached to.
   */


  Component.prototype.player = function player() {
    return this.player_;
  };

  /**
   * Deep merge of options objects with new options.
   * > Note: When both `obj` and `options` contain properties whose values are objects.
   *         The two properties get merged using {@link module:mergeOptions}
   *
   * @param {Object} obj
   *        The object that contains new options.
   *
   * @return {Object}
   *         A new object of `this.options_` and `obj` merged together.
   *
   * @deprecated since version 5
   */


  Component.prototype.options = function options(obj) {
    _log2['default'].warn('this.options() has been deprecated and will be moved to the constructor in 6.0');

    if (!obj) {
      return this.options_;
    }

    this.options_ = (0, _mergeOptions2['default'])(this.options_, obj);
    return this.options_;
  };

  /**
   * Get the `Component`s DOM element
   *
   * @return {Element}
   *         The DOM element for this `Component`.
   */


  Component.prototype.el = function el() {
    return this.el_;
  };

  /**
   * Create the `Component`s DOM element.
   *
   * @param {string} [tagName]
   *        Element's DOM node type. e.g. 'div'
   *
   * @param {Object} [properties]
   *        An object of properties that should be set.
   *
   * @param {Object} [attributes]
   *        An object of attributes that should be set.
   *
   * @return {Element}
   *         The element that gets created.
   */


  Component.prototype.createEl = function createEl(tagName, properties, attributes) {
    return Dom.createEl(tagName, properties, attributes);
  };

  /**
   * Localize a string given the string in english.
   *
   * @param {string} string
   *        The string to localize.
   *
   * @return {string}
   *         The localized string or if no localization exists the english string.
   */


  Component.prototype.localize = function localize(string) {
    var code = this.player_.language && this.player_.language();
    var languages = this.player_.languages && this.player_.languages();

    if (!code || !languages) {
      return string;
    }

    var language = languages[code];

    if (language && language[string]) {
      return language[string];
    }

    var primaryCode = code.split('-')[0];
    var primaryLang = languages[primaryCode];

    if (primaryLang && primaryLang[string]) {
      return primaryLang[string];
    }

    return string;
  };

  /**
   * Return the `Component`s DOM element. This is where children get inserted.
   * This will usually be the the same as the element returned in {@link Component#el}.
   *
   * @return {Element}
   *         The content element for this `Component`.
   */


  Component.prototype.contentEl = function contentEl() {
    return this.contentEl_ || this.el_;
  };

  /**
   * Get this `Component`s ID
   *
   * @return {string}
   *         The id of this `Component`
   */


  Component.prototype.id = function id() {
    return this.id_;
  };

  /**
   * Get the `Component`s name. The name gets used to reference the `Component`
   * and is set during registration.
   *
   * @return {string}
   *         The name of this `Component`.
   */


  Component.prototype.name = function name() {
    return this.name_;
  };

  /**
   * Get an array of all child components
   *
   * @return {Array}
   *         The children
   */


  Component.prototype.children = function children() {
    return this.children_;
  };

  /**
   * Returns the child `Component` with the given `id`.
   *
   * @param {string} id
   *        The id of the child `Component` to get.
   *
   * @return {Component|undefined}
   *         The child `Component` with the given `id` or undefined.
   */


  Component.prototype.getChildById = function getChildById(id) {
    return this.childIndex_[id];
  };

  /**
   * Returns the child `Component` with the given `name`.
   *
   * @param {string} name
   *        The name of the child `Component` to get.
   *
   * @return {Component|undefined}
   *         The child `Component` with the given `name` or undefined.
   */


  Component.prototype.getChild = function getChild(name) {
    if (!name) {
      return;
    }

    name = (0, _toTitleCase2['default'])(name);

    return this.childNameIndex_[name];
  };

  /**
   * Add a child `Component` inside the current `Component`.
   *
   *
   * @param {string|Component} child
   *        The name or instance of a child to add.
   *
   * @param {Object} [options={}]
   *        The key/value store of options that will get passed to children of
   *        the child.
   *
   * @param {number} [index=this.children_.length]
   *        The index to attempt to add a child into.
   *
   * @return {Component}
   *         The `Component` that gets added as a child. When using a string the
   *         `Component` will get created by this process.
   */


  Component.prototype.addChild = function addChild(child) {
    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    var index = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : this.children_.length;

    var component = void 0;
    var componentName = void 0;

    // If child is a string, create component with options
    if (typeof child === 'string') {
      componentName = (0, _toTitleCase2['default'])(child);

      // Options can also be specified as a boolean,
      // so convert to an empty object if false.
      if (!options) {
        options = {};
      }

      // Same as above, but true is deprecated so show a warning.
      if (options === true) {
        _log2['default'].warn('Initializing a child component with `true` is deprecated.' + 'Children should be defined in an array when possible, ' + 'but if necessary use an object instead of `true`.');
        options = {};
      }

      var componentClassName = options.componentClass || componentName;

      // Set name through options
      options.name = componentName;

      // Create a new object & element for this controls set
      // If there's no .player_, this is a player
      var ComponentClass = Component.getComponent(componentClassName);

      if (!ComponentClass) {
        throw new Error('Component ' + componentClassName + ' does not exist');
      }

      // data stored directly on the videojs object may be
      // misidentified as a component to retain
      // backwards-compatibility with 4.x. check to make sure the
      // component class can be instantiated.
      if (typeof ComponentClass !== 'function') {
        return null;
      }

      component = new ComponentClass(this.player_ || this, options);

      // child is a component instance
    } else {
      component = child;
    }

    this.children_.splice(index, 0, component);

    if (typeof component.id === 'function') {
      this.childIndex_[component.id()] = component;
    }

    // If a name wasn't used to create the component, check if we can use the
    // name function of the component
    componentName = componentName || component.name && (0, _toTitleCase2['default'])(component.name());

    if (componentName) {
      this.childNameIndex_[componentName] = component;
    }

    // Add the UI object's element to the container div (box)
    // Having an element is not required
    if (typeof component.el === 'function' && component.el()) {
      var childNodes = this.contentEl().children;
      var refNode = childNodes[index] || null;

      this.contentEl().insertBefore(component.el(), refNode);
    }

    // Return so it can stored on parent object if desired.
    return component;
  };

  /**
   * Remove a child `Component` from this `Component`s list of children. Also removes
   * the child `Component`s element from this `Component`s element.
   *
   * @param {Component} component
   *        The child `Component` to remove.
   */


  Component.prototype.removeChild = function removeChild(component) {
    if (typeof component === 'string') {
      component = this.getChild(component);
    }

    if (!component || !this.children_) {
      return;
    }

    var childFound = false;

    for (var i = this.children_.length - 1; i >= 0; i--) {
      if (this.children_[i] === component) {
        childFound = true;
        this.children_.splice(i, 1);
        break;
      }
    }

    if (!childFound) {
      return;
    }

    this.childIndex_[component.id()] = null;
    this.childNameIndex_[component.name()] = null;

    var compEl = component.el();

    if (compEl && compEl.parentNode === this.contentEl()) {
      this.contentEl().removeChild(component.el());
    }
  };

  /**
   * Add and initialize default child `Component`s based upon options.
   */


  Component.prototype.initChildren = function initChildren() {
    var _this = this;

    var children = this.options_.children;

    if (children) {
      // `this` is `parent`
      var parentOptions = this.options_;

      var handleAdd = function handleAdd(child) {
        var name = child.name;
        var opts = child.opts;

        // Allow options for children to be set at the parent options
        // e.g. videojs(id, { controlBar: false });
        // instead of videojs(id, { children: { controlBar: false });
        if (parentOptions[name] !== undefined) {
          opts = parentOptions[name];
        }

        // Allow for disabling default components
        // e.g. options['children']['posterImage'] = false
        if (opts === false) {
          return;
        }

        // Allow options to be passed as a simple boolean if no configuration
        // is necessary.
        if (opts === true) {
          opts = {};
        }

        // We also want to pass the original player options
        // to each component as well so they don't need to
        // reach back into the player for options later.
        opts.playerOptions = _this.options_.playerOptions;

        // Create and add the child component.
        // Add a direct reference to the child by name on the parent instance.
        // If two of the same component are used, different names should be supplied
        // for each
        var newChild = _this.addChild(name, opts);

        if (newChild) {
          _this[name] = newChild;
        }
      };

      // Allow for an array of children details to passed in the options
      var workingChildren = void 0;
      var Tech = Component.getComponent('Tech');

      if (Array.isArray(children)) {
        workingChildren = children;
      } else {
        workingChildren = Object.keys(children);
      }

      workingChildren
      // children that are in this.options_ but also in workingChildren  would
      // give us extra children we do not want. So, we want to filter them out.
      .concat(Object.keys(this.options_).filter(function (child) {
        return !workingChildren.some(function (wchild) {
          if (typeof wchild === 'string') {
            return child === wchild;
          }
          return child === wchild.name;
        });
      })).map(function (child) {
        var name = void 0;
        var opts = void 0;

        if (typeof child === 'string') {
          name = child;
          opts = children[name] || _this.options_[name] || {};
        } else {
          name = child.name;
          opts = child;
        }

        return { name: name, opts: opts };
      }).filter(function (child) {
        // we have to make sure that child.name isn't in the techOrder since
        // techs are registerd as Components but can't aren't compatible
        // See https://github.com/videojs/video.js/issues/2772
        var c = Component.getComponent(child.opts.componentClass || (0, _toTitleCase2['default'])(child.name));

        return c && !Tech.isTech(c);
      }).forEach(handleAdd);
    }
  };

  /**
   * Builds the default DOM class name. Should be overriden by sub-components.
   *
   * @return {string}
   *         The DOM class name for this object.
   *
   * @abstract
   */


  Component.prototype.buildCSSClass = function buildCSSClass() {
    // Child classes can include a function that does:
    // return 'CLASS NAME' + this._super();
    return '';
  };

  /**
   * Add an `event listener` to this `Component`s element.
   *
   * The benefit of using this over the following:
   * - `VjsEvents.on(otherElement, 'eventName', myFunc)`
   * - `otherComponent.on('eventName', myFunc)`
   *
   * 1. Is that the listeners will get cleaned up when either component gets disposed.
   * 1. It will also bind `myComponent` as the context of `myFunc`.
   * > NOTE: If you remove the element from the DOM that has used `on` you need to
   *         clean up references using: `myComponent.trigger(el, 'dispose')`
   *         This will also allow the browser to garbage collect it. In special
   *         cases such as with `window` and `document`, which are both permanent,
   *         this is not necessary.
   *
   * @param {string|Component|string[]} [first]
   *        The event name, and array of event names, or another `Component`.
   *
   * @param {EventTarget~EventListener|string|string[]} [second]
   *        The listener function, an event name, or an Array of events names.
   *
   * @param {EventTarget~EventListener} [third]
   *        The event handler if `first` is a `Component` and `second` is an event name
   *        or an Array of event names.
   *
   * @return {Component}
   *         Returns itself; method can be chained.
   *
   * @listens Component#dispose
   */


  Component.prototype.on = function on(first, second, third) {
    var _this2 = this;

    if (typeof first === 'string' || Array.isArray(first)) {
      Events.on(this.el_, first, Fn.bind(this, second));

      // Targeting another component or element
    } else {
      var target = first;
      var type = second;
      var fn = Fn.bind(this, third);

      // When this component is disposed, remove the listener from the other component
      var removeOnDispose = function removeOnDispose() {
        return _this2.off(target, type, fn);
      };

      // Use the same function ID so we can remove it later it using the ID
      // of the original listener
      removeOnDispose.guid = fn.guid;
      this.on('dispose', removeOnDispose);

      // If the other component is disposed first we need to clean the reference
      // to the other component in this component's removeOnDispose listener
      // Otherwise we create a memory leak.
      var cleanRemover = function cleanRemover() {
        return _this2.off('dispose', removeOnDispose);
      };

      // Add the same function ID so we can easily remove it later
      cleanRemover.guid = fn.guid;

      // Check if this is a DOM node
      if (first.nodeName) {
        // Add the listener to the other element
        Events.on(target, type, fn);
        Events.on(target, 'dispose', cleanRemover);

        // Should be a component
        // Not using `instanceof Component` because it makes mock players difficult
      } else if (typeof first.on === 'function') {
        // Add the listener to the other component
        target.on(type, fn);
        target.on('dispose', cleanRemover);
      }
    }

    return this;
  };

  /**
   * Remove an event listener from this `Component`s element. If the second argument is
   * exluded all listeners for the type passed in as the first argument will be removed.
   *
   * @param {string|Component|string[]} [first]
   *        The event name, and array of event names, or another `Component`.
   *
   * @param {EventTarget~EventListener|string|string[]} [second]
   *        The listener function, an event name, or an Array of events names.
   *
   * @param {EventTarget~EventListener} [third]
   *        The event handler if `first` is a `Component` and `second` is an event name
   *        or an Array of event names.
   *
   * @return {Component}
   *         Returns itself; method can be chained.
   */


  Component.prototype.off = function off(first, second, third) {
    if (!first || typeof first === 'string' || Array.isArray(first)) {
      Events.off(this.el_, first, second);
    } else {
      var target = first;
      var type = second;
      // Ensure there's at least a guid, even if the function hasn't been used
      var fn = Fn.bind(this, third);

      // Remove the dispose listener on this component,
      // which was given the same guid as the event listener
      this.off('dispose', fn);

      if (first.nodeName) {
        // Remove the listener
        Events.off(target, type, fn);
        // Remove the listener for cleaning the dispose listener
        Events.off(target, 'dispose', fn);
      } else {
        target.off(type, fn);
        target.off('dispose', fn);
      }
    }

    return this;
  };

  /**
   * Add an event listener that gets triggered only once and then gets removed.
   *
   * @param {string|Component|string[]} [first]
   *        The event name, and array of event names, or another `Component`.
   *
   * @param {EventTarget~EventListener|string|string[]} [second]
   *        The listener function, an event name, or an Array of events names.
   *
   * @param {EventTarget~EventListener} [third]
   *        The event handler if `first` is a `Component` and `second` is an event name
   *        or an Array of event names.
   *
   * @return {Component}
   *         Returns itself; method can be chained.
   */


  Component.prototype.one = function one(first, second, third) {
    var _this3 = this,
        _arguments = arguments;

    if (typeof first === 'string' || Array.isArray(first)) {
      Events.one(this.el_, first, Fn.bind(this, second));
    } else {
      var target = first;
      var type = second;
      var fn = Fn.bind(this, third);

      var newFunc = function newFunc() {
        _this3.off(target, type, newFunc);
        fn.apply(null, _arguments);
      };

      // Keep the same function ID so we can remove it later
      newFunc.guid = fn.guid;

      this.on(target, type, newFunc);
    }

    return this;
  };

  /**
   * Trigger an event on an element.
   *
   * @param {EventTarget~Event|Object|string} event
   *        The event name, and Event, or an event-like object with a type attribute
   *        set to the event name.
   *
   * @param {Object} [hash]
   *        Data hash to pass along with the event
   *
   * @return {Component}
   *         Returns itself; method can be chained.
   */


  Component.prototype.trigger = function trigger(event, hash) {
    Events.trigger(this.el_, event, hash);
    return this;
  };

  /**
   * Bind a listener to the component's ready state. If the ready event has already
   * happened it will trigger the function immediately.
   *
   * @param  {Component~ReadyCallback} fn
   *         A function to call when ready is triggered.
   *
   * @param  {boolean} [sync=false]
   *         Execute the listener synchronously if `Component` is ready.
   *
   * @return {Component}
   *         Returns itself; method can be chained.
   */


  Component.prototype.ready = function ready(fn) {
    var sync = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

    if (fn) {
      if (this.isReady_) {
        if (sync) {
          fn.call(this);
        } else {
          // Call the function asynchronously by default for consistency
          this.setTimeout(fn, 1);
        }
      } else {
        this.readyQueue_ = this.readyQueue_ || [];
        this.readyQueue_.push(fn);
      }
    }
    return this;
  };

  /**
   * Trigger all the ready listeners for this `Component`.
   *
   * @fires Component#ready
   */


  Component.prototype.triggerReady = function triggerReady() {
    this.isReady_ = true;

    // Ensure ready is triggerd asynchronously
    this.setTimeout(function () {
      var readyQueue = this.readyQueue_;

      // Reset Ready Queue
      this.readyQueue_ = [];

      if (readyQueue && readyQueue.length > 0) {
        readyQueue.forEach(function (fn) {
          fn.call(this);
        }, this);
      }

      // Allow for using event listeners also
      /**
       * Triggered when a `Component` is ready.
       *
       * @event Component#ready
       * @type {EventTarget~Event}
       */
      this.trigger('ready');
    }, 1);
  };

  /**
   * Find a single DOM element matching a `selector`. This can be within the `Component`s
   * `contentEl()` or another custom context.
   *
   * @param {string} selector
   *        A valid CSS selector, which will be passed to `querySelector`.
   *
   * @param {Element|string} [context=this.contentEl()]
   *        A DOM element within which to query. Can also be a selector string in
   *        which case the first matching element will get used as context. If
   *        missing `this.contentEl()` gets used. If  `this.contentEl()` returns
   *        nothing it falls back to `document`.
   *
   * @return {Element|null}
   *         the dom element that was found, or null
   *
   * @see [Information on CSS Selectors](https://developer.mozilla.org/en-US/docs/Web/Guide/CSS/Getting_Started/Selectors)
   */


  Component.prototype.$ = function $(selector, context) {
    return Dom.$(selector, context || this.contentEl());
  };

  /**
   * Finds all DOM element matching a `selector`. This can be within the `Component`s
   * `contentEl()` or another custom context.
   *
   * @param {string} selector
   *        A valid CSS selector, which will be passed to `querySelectorAll`.
   *
   * @param {Element|string} [context=this.contentEl()]
   *        A DOM element within which to query. Can also be a selector string in
   *        which case the first matching element will get used as context. If
   *        missing `this.contentEl()` gets used. If  `this.contentEl()` returns
   *        nothing it falls back to `document`.
   *
   * @return {NodeList}
   *         a list of dom elements that were found
   *
   * @see [Information on CSS Selectors](https://developer.mozilla.org/en-US/docs/Web/Guide/CSS/Getting_Started/Selectors)
   */


  Component.prototype.$$ = function $$(selector, context) {
    return Dom.$$(selector, context || this.contentEl());
  };

  /**
   * Check if a component's element has a CSS class name.
   *
   * @param {string} classToCheck
   *        CSS class name to check.
   *
   * @return {boolean}
   *         - True if the `Component` has the class.
   *         - False if the `Component` does not have the class`
   */


  Component.prototype.hasClass = function hasClass(classToCheck) {
    return Dom.hasElClass(this.el_, classToCheck);
  };

  /**
   * Add a CSS class name to the `Component`s element.
   *
   * @param {string} classToAdd
   *        CSS class name to add
   *
   * @return {Component}
   *         Returns itself; method can be chained.
   */


  Component.prototype.addClass = function addClass(classToAdd) {
    Dom.addElClass(this.el_, classToAdd);
    return this;
  };

  /**
   * Remove a CSS class name from the `Component`s element.
   *
   * @param {string} classToRemove
   *        CSS class name to remove
   *
   * @return {Component}
   *         Returns itself; method can be chained.
   */


  Component.prototype.removeClass = function removeClass(classToRemove) {
    Dom.removeElClass(this.el_, classToRemove);
    return this;
  };

  /**
   * Add or remove a CSS class name from the component's element.
   * - `classToToggle` gets added when {@link Component#hasClass} would return false.
   * - `classToToggle` gets removed when {@link Component#hasClass} would return true.
   *
   * @param  {string} classToToggle
   *         The class to add or remove based on (@link Component#hasClass}
   *
   * @param  {boolean|Dom~predicate} [predicate]
   *         An {@link Dom~predicate} function or a boolean
   *
   * @return {Component}
   *         Returns itself; method can be chained.
   */


  Component.prototype.toggleClass = function toggleClass(classToToggle, predicate) {
    Dom.toggleElClass(this.el_, classToToggle, predicate);
    return this;
  };

  /**
   * Show the `Component`s element if it is hidden by removing the
   * 'vjs-hidden' class name from it.
   *
   * @return {Component}
   *         Returns itself; method can be chained.
   */


  Component.prototype.show = function show() {
    this.removeClass('vjs-hidden');
    return this;
  };

  /**
   * Hide the `Component`s element if it is currently showing by adding the
   * 'vjs-hidden` class name to it.
   *
   * @return {Component}
   *         Returns itself; method can be chained.
   */


  Component.prototype.hide = function hide() {
    this.addClass('vjs-hidden');
    return this;
  };

  /**
   * Lock a `Component`s element in its visible state by adding the 'vjs-lock-showing'
   * class name to it. Used during fadeIn/fadeOut.
   *
   * @return {Component}
   *         Returns itself; method can be chained.
   *
   * @private
   */


  Component.prototype.lockShowing = function lockShowing() {
    this.addClass('vjs-lock-showing');
    return this;
  };

  /**
   * Unlock a `Component`s element from its visible state by removing the 'vjs-lock-showing'
   * class name from it. Used during fadeIn/fadeOut.
   *
   * @return {Component}
   *         Returns itself; method can be chained.
   *
   * @private
   */


  Component.prototype.unlockShowing = function unlockShowing() {
    this.removeClass('vjs-lock-showing');
    return this;
  };

  /**
   * Get the value of an attribute on the `Component`s element.
   *
   * @param {string} attribute
   *        Name of the attribute to get the value from.
   *
   * @return {string|null}
   *         - The value of the attribute that was asked for.
   *         - Can be an empty string on some browsers if the attribute does not exist
   *           or has no value
   *         - Most browsers will return null if the attibute does not exist or has
   *           no value.
   *
   * @see [DOM API]{@link https://developer.mozilla.org/en-US/docs/Web/API/Element/getAttribute}
   */


  Component.prototype.getAttribute = function getAttribute(attribute) {
    return Dom.getAttribute(this.el_, attribute);
  };

  /**
   * Set the value of an attribute on the `Component`'s element
   *
   * @param {string} attribute
   *        Name of the attribute to set.
   *
   * @param {string} value
   *        Value to set the attribute to.
   *
   * @return {Component}
   *         Returns itself; method can be chained.
   *
   * @see [DOM API]{@link https://developer.mozilla.org/en-US/docs/Web/API/Element/setAttribute}
   */


  Component.prototype.setAttribute = function setAttribute(attribute, value) {
    Dom.setAttribute(this.el_, attribute, value);
    return this;
  };

  /**
   * Remove an attribute from the `Component`s element.
   *
   * @param {string} attribute
   *        Name of the attribute to remove.
   *
   * @return {Component}
   *         Returns itself; method can be chained.
   *
   * @see [DOM API]{@link https://developer.mozilla.org/en-US/docs/Web/API/Element/removeAttribute}
   */


  Component.prototype.removeAttribute = function removeAttribute(attribute) {
    Dom.removeAttribute(this.el_, attribute);
    return this;
  };

  /**
   * Get or set the width of the component based upon the CSS styles.
   * See {@link Component#dimension} for more detailed information.
   *
   * @param {number|string} [num]
   *        The width that you want to set postfixed with '%', 'px' or nothing.
   *
   * @param {boolean} [skipListeners]
   *        Skip the resize event trigger
   *
   * @return {Component|number|string}
   *         - The width when getting, zero if there is no width. Can be a string
   *           postpixed with '%' or 'px'.
   *         - Returns itself when setting; method can be chained.
   */


  Component.prototype.width = function width(num, skipListeners) {
    return this.dimension('width', num, skipListeners);
  };

  /**
   * Get or set the height of the component based upon the CSS styles.
   * See {@link Component#dimension} for more detailed information.
   *
   * @param {number|string} [num]
   *        The height that you want to set postfixed with '%', 'px' or nothing.
   *
   * @param {boolean} [skipListeners]
   *        Skip the resize event trigger
   *
   * @return {Component|number|string}
   *         - The width when getting, zero if there is no width. Can be a string
   *           postpixed with '%' or 'px'.
   *         - Returns itself when setting; method can be chained.
   */


  Component.prototype.height = function height(num, skipListeners) {
    return this.dimension('height', num, skipListeners);
  };

  /**
   * Set both the width and height of the `Component` element at the same time.
   *
   * @param  {number|string} width
   *         Width to set the `Component`s element to.
   *
   * @param  {number|string} height
   *         Height to set the `Component`s element to.
   *
   * @return {Component}
   *         Returns itself; method can be chained.
   */


  Component.prototype.dimensions = function dimensions(width, height) {
    // Skip resize listeners on width for optimization
    return this.width(width, true).height(height);
  };

  /**
   * Get or set width or height of the `Component` element. This is the shared code
   * for the {@link Component#width} and {@link Component#height}.
   *
   * Things to know:
   * - If the width or height in an number this will return the number postfixed with 'px'.
   * - If the width/height is a percent this will return the percent postfixed with '%'
   * - Hidden elements have a width of 0 with `window.getComputedStyle`. This function
   *   defaults to the `Component`s `style.width` and falls back to `window.getComputedStyle`.
   *   See [this]{@link http://www.foliotek.com/devblog/getting-the-width-of-a-hidden-element-with-jquery-using-width/}
   *   for more information
   * - If you want the computed style of the component, use {@link Component#currentWidth}
   *   and {@link {Component#currentHeight}
   *
   * @fires Component#resize
   *
   * @param {string} widthOrHeight
   8        'width' or 'height'
   *
   * @param  {number|string} [num]
   8         New dimension
   *
   * @param  {boolean} [skipListeners]
   *         Skip resize event trigger
   *
   * @return {Component}
   *         - the dimension when getting or 0 if unset
   *         - Returns itself when setting; method can be chained.
   */


  Component.prototype.dimension = function dimension(widthOrHeight, num, skipListeners) {
    if (num !== undefined) {
      // Set to zero if null or literally NaN (NaN !== NaN)
      if (num === null || num !== num) {
        num = 0;
      }

      // Check if using css width/height (% or px) and adjust
      if (('' + num).indexOf('%') !== -1 || ('' + num).indexOf('px') !== -1) {
        this.el_.style[widthOrHeight] = num;
      } else if (num === 'auto') {
        this.el_.style[widthOrHeight] = '';
      } else {
        this.el_.style[widthOrHeight] = num + 'px';
      }

      // skipListeners allows us to avoid triggering the resize event when setting both width and height
      if (!skipListeners) {
        /**
         * Triggered when a component is resized.
         *
         * @event Component#resize
         * @type {EventTarget~Event}
         */
        this.trigger('resize');
      }

      // Return component
      return this;
    }

    // Not setting a value, so getting it
    // Make sure element exists
    if (!this.el_) {
      return 0;
    }

    // Get dimension value from style
    var val = this.el_.style[widthOrHeight];
    var pxIndex = val.indexOf('px');

    if (pxIndex !== -1) {
      // Return the pixel value with no 'px'
      return parseInt(val.slice(0, pxIndex), 10);
    }

    // No px so using % or no style was set, so falling back to offsetWidth/height
    // If component has display:none, offset will return 0
    // TODO: handle display:none and no dimension style using px
    return parseInt(this.el_['offset' + (0, _toTitleCase2['default'])(widthOrHeight)], 10);
  };

  /**
   * Get the width or the height of the `Component` elements computed style. Uses
   * `window.getComputedStyle`.
   *
   * @param {string} widthOrHeight
   *        A string containing 'width' or 'height'. Whichever one you want to get.
   *
   * @return {number}
   *         The dimension that gets asked for or 0 if nothing was set
   *         for that dimension.
   */


  Component.prototype.currentDimension = function currentDimension(widthOrHeight) {
    var computedWidthOrHeight = 0;

    if (widthOrHeight !== 'width' && widthOrHeight !== 'height') {
      throw new Error('currentDimension only accepts width or height value');
    }

    if (typeof _window2['default'].getComputedStyle === 'function') {
      var computedStyle = _window2['default'].getComputedStyle(this.el_);

      computedWidthOrHeight = computedStyle.getPropertyValue(widthOrHeight) || computedStyle[widthOrHeight];
    }

    // remove 'px' from variable and parse as integer
    computedWidthOrHeight = parseFloat(computedWidthOrHeight);

    // if the computed value is still 0, it's possible that the browser is lying
    // and we want to check the offset values.
    // This code also runs on IE8 and wherever getComputedStyle doesn't exist.
    if (computedWidthOrHeight === 0) {
      var rule = 'offset' + (0, _toTitleCase2['default'])(widthOrHeight);

      computedWidthOrHeight = this.el_[rule];
    }

    return computedWidthOrHeight;
  };

  /**
   * An object that contains width and height values of the `Component`s
   * computed style. Uses `window.getComputedStyle`.
   *
   * @typedef {Object} Component~DimensionObject
   *
   * @property {number} width
   *           The width of the `Component`s computed style.
   *
   * @property {number} height
   *           The height of the `Component`s computed style.
   */

  /**
   * Get an object that contains width and height values of the `Component`s
   * computed style.
   *
   * @return {Component~DimensionObject}
   *         The dimensions of the components element
   */


  Component.prototype.currentDimensions = function currentDimensions() {
    return {
      width: this.currentDimension('width'),
      height: this.currentDimension('height')
    };
  };

  /**
   * Get the width of the `Component`s computed style. Uses `window.getComputedStyle`.
   *
   * @return {number} width
   *           The width of the `Component`s computed style.
   */


  Component.prototype.currentWidth = function currentWidth() {
    return this.currentDimension('width');
  };

  /**
   * Get the height of the `Component`s computed style. Uses `window.getComputedStyle`.
   *
   * @return {number} height
   *           The height of the `Component`s computed style.
   */


  Component.prototype.currentHeight = function currentHeight() {
    return this.currentDimension('height');
  };

  /**
   * Set the focus to this component
   */


  Component.prototype.focus = function focus() {
    this.el_.focus();
  };

  /**
   * Remove the focus from this component
   */


  Component.prototype.blur = function blur() {
    this.el_.blur();
  };

  /**
   * Emit a 'tap' events when touch event support gets detected. This gets used to
   * support toggling the controls through a tap on the video. They get enabled
   * because every sub-component would have extra overhead otherwise.
   *
   * @private
   * @fires Component#tap
   * @listens Component#touchstart
   * @listens Component#touchmove
   * @listens Component#touchleave
   * @listens Component#touchcancel
   * @listens Component#touchend
    */


  Component.prototype.emitTapEvents = function emitTapEvents() {
    // Track the start time so we can determine how long the touch lasted
    var touchStart = 0;
    var firstTouch = null;

    // Maximum movement allowed during a touch event to still be considered a tap
    // Other popular libs use anywhere from 2 (hammer.js) to 15,
    // so 10 seems like a nice, round number.
    var tapMovementThreshold = 10;

    // The maximum length a touch can be while still being considered a tap
    var touchTimeThreshold = 200;

    var couldBeTap = void 0;

    this.on('touchstart', function (event) {
      // If more than one finger, don't consider treating this as a click
      if (event.touches.length === 1) {
        // Copy pageX/pageY from the object
        firstTouch = {
          pageX: event.touches[0].pageX,
          pageY: event.touches[0].pageY
        };
        // Record start time so we can detect a tap vs. "touch and hold"
        touchStart = new Date().getTime();
        // Reset couldBeTap tracking
        couldBeTap = true;
      }
    });

    this.on('touchmove', function (event) {
      // If more than one finger, don't consider treating this as a click
      if (event.touches.length > 1) {
        couldBeTap = false;
      } else if (firstTouch) {
        // Some devices will throw touchmoves for all but the slightest of taps.
        // So, if we moved only a small distance, this could still be a tap
        var xdiff = event.touches[0].pageX - firstTouch.pageX;
        var ydiff = event.touches[0].pageY - firstTouch.pageY;
        var touchDistance = Math.sqrt(xdiff * xdiff + ydiff * ydiff);

        if (touchDistance > tapMovementThreshold) {
          couldBeTap = false;
        }
      }
    });

    var noTap = function noTap() {
      couldBeTap = false;
    };

    // TODO: Listen to the original target. http://youtu.be/DujfpXOKUp8?t=13m8s
    this.on('touchleave', noTap);
    this.on('touchcancel', noTap);

    // When the touch ends, measure how long it took and trigger the appropriate
    // event
    this.on('touchend', function (event) {
      firstTouch = null;
      // Proceed only if the touchmove/leave/cancel event didn't happen
      if (couldBeTap === true) {
        // Measure how long the touch lasted
        var touchTime = new Date().getTime() - touchStart;

        // Make sure the touch was less than the threshold to be considered a tap
        if (touchTime < touchTimeThreshold) {
          // Don't let browser turn this into a click
          event.preventDefault();
          /**
           * Triggered when a `Component` is tapped.
           *
           * @event Component#tap
           * @type {EventTarget~Event}
           */
          this.trigger('tap');
          // It may be good to copy the touchend event object and change the
          // type to tap, if the other event properties aren't exact after
          // Events.fixEvent runs (e.g. event.target)
        }
      }
    });
  };

  /**
   * This function reports user activity whenever touch events happen. This can get
   * turned off by any sub-components that wants touch events to act another way.
   *
   * Report user touch activity when touch events occur. User activity gets used to
   * determine when controls should show/hide. It is simple when it comes to mouse
   * events, because any mouse event should show the controls. So we capture mouse
   * events that bubble up to the player and report activity when that happens.
   * With touch events it isn't as easy as `touchstart` and `touchend` toggle player
   * controls. So touch events can't help us at the player level either.
   *
   * User activity gets checked asynchronously. So what could happen is a tap event
   * on the video turns the controls off. Then the `touchend` event bubbles up to
   * the player. Which, if it reported user activity, would turn the controls right
   * back on. We also don't want to completely block touch events from bubbling up.
   * Furthermore a `touchmove` event and anything other than a tap, should not turn
   * controls back on.
   *
   * @listens Component#touchstart
   * @listens Component#touchmove
   * @listens Component#touchend
   * @listens Component#touchcancel
   */


  Component.prototype.enableTouchActivity = function enableTouchActivity() {
    // Don't continue if the root player doesn't support reporting user activity
    if (!this.player() || !this.player().reportUserActivity) {
      return;
    }

    // listener for reporting that the user is active
    var report = Fn.bind(this.player(), this.player().reportUserActivity);

    var touchHolding = void 0;

    this.on('touchstart', function () {
      report();
      // For as long as the they are touching the device or have their mouse down,
      // we consider them active even if they're not moving their finger or mouse.
      // So we want to continue to update that they are active
      this.clearInterval(touchHolding);
      // report at the same interval as activityCheck
      touchHolding = this.setInterval(report, 250);
    });

    var touchEnd = function touchEnd(event) {
      report();
      // stop the interval that maintains activity if the touch is holding
      this.clearInterval(touchHolding);
    };

    this.on('touchmove', report);
    this.on('touchend', touchEnd);
    this.on('touchcancel', touchEnd);
  };

  /**
   * A callback that has no parameters and is bound into `Component`s context.
   *
   * @callback Component~GenericCallback
   * @this Component
   */

  /**
   * Creates a function that runs after an `x` millisecond timeout. This function is a
   * wrapper around `window.setTimeout`. There are a few reasons to use this one
   * instead though:
   * 1. It gets cleared via  {@link Component#clearTimeout} when
   *    {@link Component#dispose} gets called.
   * 2. The function callback will gets turned into a {@link Component~GenericCallback}
   *
   * > Note: You can use `window.clearTimeout` on the id returned by this function. This
   *         will cause its dispose listener not to get cleaned up! Please use
   *         {@link Component#clearTimeout} or {@link Component#dispose}.
   *
   * @param {Component~GenericCallback} fn
   *        The function that will be run after `timeout`.
   *
   * @param {number} timeout
   *        Timeout in milliseconds to delay before executing the specified function.
   *
   * @return {number}
   *         Returns a timeout ID that gets used to identify the timeout. It can also
   *         get used in {@link Component#clearTimeout} to clear the timeout that
   *         was set.
   *
   * @listens Component#dispose
   * @see [Similar to]{@link https://developer.mozilla.org/en-US/docs/Web/API/WindowTimers/setTimeout}
   */


  Component.prototype.setTimeout = function setTimeout(fn, timeout) {
    fn = Fn.bind(this, fn);

    var timeoutId = _window2['default'].setTimeout(fn, timeout);
    var disposeFn = function disposeFn() {
      this.clearTimeout(timeoutId);
    };

    disposeFn.guid = 'vjs-timeout-' + timeoutId;

    this.on('dispose', disposeFn);

    return timeoutId;
  };

  /**
   * Clears a timeout that gets created via `window.setTimeout` or
   * {@link Component#setTimeout}. If you set a timeout via {@link Component#setTimeout}
   * use this function instead of `window.clearTimout`. If you don't your dispose
   * listener will not get cleaned up until {@link Component#dispose}!
   *
   * @param {number} timeoutId
   *        The id of the timeout to clear. The return value of
   *        {@link Component#setTimeout} or `window.setTimeout`.
   *
   * @return {number}
   *         Returns the timeout id that was cleared.
   *
   * @see [Similar to]{@link https://developer.mozilla.org/en-US/docs/Web/API/WindowTimers/clearTimeout}
   */


  Component.prototype.clearTimeout = function clearTimeout(timeoutId) {
    _window2['default'].clearTimeout(timeoutId);

    var disposeFn = function disposeFn() {};

    disposeFn.guid = 'vjs-timeout-' + timeoutId;

    this.off('dispose', disposeFn);

    return timeoutId;
  };

  /**
   * Creates a function that gets run every `x` milliseconds. This function is a wrapper
   * around `window.setInterval`. There are a few reasons to use this one instead though.
   * 1. It gets cleared via  {@link Component#clearInterval} when
   *    {@link Component#dispose} gets called.
   * 2. The function callback will be a {@link Component~GenericCallback}
   *
   * @param {Component~GenericCallback} fn
   *        The function to run every `x` seconds.
   *
   * @param {number} interval
   *        Execute the specified function every `x` milliseconds.
   *
   * @return {number}
   *         Returns an id that can be used to identify the interval. It can also be be used in
   *         {@link Component#clearInterval} to clear the interval.
   *
   * @listens Component#dispose
   * @see [Similar to]{@link https://developer.mozilla.org/en-US/docs/Web/API/WindowTimers/setInterval}
   */


  Component.prototype.setInterval = function setInterval(fn, interval) {
    fn = Fn.bind(this, fn);

    var intervalId = _window2['default'].setInterval(fn, interval);

    var disposeFn = function disposeFn() {
      this.clearInterval(intervalId);
    };

    disposeFn.guid = 'vjs-interval-' + intervalId;

    this.on('dispose', disposeFn);

    return intervalId;
  };

  /**
   * Clears an interval that gets created via `window.setInterval` or
   * {@link Component#setInterval}. If you set an inteval via {@link Component#setInterval}
   * use this function instead of `window.clearInterval`. If you don't your dispose
   * listener will not get cleaned up until {@link Component#dispose}!
   *
   * @param {number} intervalId
   *        The id of the interval to clear. The return value of
   *        {@link Component#setInterval} or `window.setInterval`.
   *
   * @return {number}
   *         Returns the interval id that was cleared.
   *
   * @see [Similar to]{@link https://developer.mozilla.org/en-US/docs/Web/API/WindowTimers/clearInterval}
   */


  Component.prototype.clearInterval = function clearInterval(intervalId) {
    _window2['default'].clearInterval(intervalId);

    var disposeFn = function disposeFn() {};

    disposeFn.guid = 'vjs-interval-' + intervalId;

    this.off('dispose', disposeFn);

    return intervalId;
  };

  /**
   * Register a `Component` with `videojs` given the name and the component.
   *
   * > NOTE: {@link Tech}s should not be registered as a `Component`. {@link Tech}s
   *         should be registered using {@link Tech.registerTech} or
   *         {@link videojs:videojs.registerTech}.
   *
   * > NOTE: This function can also be seen on videojs as
   *         {@link videojs:videojs.registerComponent}.
   *
   * @param {string} name
   *        The name of the `Component` to register.
   *
   * @param {Component} comp
   *        The `Component` class to register.
   *
   * @return {Component}
   *         The `Component` that was registered.
   */


  Component.registerComponent = function registerComponent(name, comp) {
    if (!name) {
      return;
    }

    name = (0, _toTitleCase2['default'])(name);

    if (!Component.components_) {
      Component.components_ = {};
    }

    if (name === 'Player' && Component.components_[name]) {
      var Player = Component.components_[name];

      // If we have players that were disposed, then their name will still be
      // in Players.players. So, we must loop through and verify that the value
      // for each item is not null. This allows registration of the Player component
      // after all players have been disposed or before any were created.
      if (Player.players && Object.keys(Player.players).length > 0 && Object.keys(Player.players).map(function (playerName) {
        return Player.players[playerName];
      }).every(Boolean)) {
        throw new Error('Can not register Player component after player has been created');
      }
    }

    Component.components_[name] = comp;

    return comp;
  };

  /**
   * Get a `Component` based on the name it was registered with.
   *
   * @param {string} name
   *        The Name of the component to get.
   *
   * @return {Component}
   *         The `Component` that got registered under the given name.
   *
   * @deprecated In `videojs` 6 this will not return `Component`s that were not
   *             registered using {@link Component.registerComponent}. Currently we
   *             check the global `videojs` object for a `Component` name and
   *             return that if it exists.
   */


  Component.getComponent = function getComponent(name) {
    if (!name) {
      return;
    }

    name = (0, _toTitleCase2['default'])(name);

    if (Component.components_ && Component.components_[name]) {
      return Component.components_[name];
    }

    if (_window2['default'] && _window2['default'].videojs && _window2['default'].videojs[name]) {
      _log2['default'].warn('The ' + name + ' component was added to the videojs object when it should be registered using videojs.registerComponent(name, component)');

      return _window2['default'].videojs[name];
    }
  };

  /**
   * Sets up the constructor using the supplied init method or uses the init of the
   * parent object.
   *
   * @param {Object} [props={}]
   *        An object of properties.
   *
   * @return {Object}
   *         the extended object.
   *
   * @deprecated since version 5
   */


  Component.extend = function extend(props) {
    props = props || {};

    _log2['default'].warn('Component.extend({}) has been deprecated, ' + ' use videojs.extend(Component, {}) instead');

    // Set up the constructor using the supplied init method
    // or using the init of the parent object
    // Make sure to check the unobfuscated version for external libs
    var init = props.init || props.init || this.prototype.init || this.prototype.init || function () {};
    // In Resig's simple class inheritance (previously used) the constructor
    //  is a function that calls `this.init.apply(arguments)`
    // However that would prevent us from using `ParentObject.call(this);`
    //  in a Child constructor because the `this` in `this.init`
    //  would still refer to the Child and cause an infinite loop.
    // We would instead have to do
    //    `ParentObject.prototype.init.apply(this, arguments);`
    //  Bleh. We're not creating a _super() function, so it's good to keep
    //  the parent constructor reference simple.
    var subObj = function subObj() {
      init.apply(this, arguments);
    };

    // Inherit from this object's prototype
    subObj.prototype = Object.create(this.prototype);
    // Reset the constructor property for subObj otherwise
    // instances of subObj would have the constructor of the parent Object
    subObj.prototype.constructor = subObj;

    // Make the class extendable
    subObj.extend = Component.extend;

    // Extend subObj's prototype with functions and other properties from props
    for (var name in props) {
      if (props.hasOwnProperty(name)) {
        subObj.prototype[name] = props[name];
      }
    }

    return subObj;
  };

  return Component;
}();

Component.registerComponent('Component', Component);
exports['default'] = Component;

},{"81":81,"82":82,"83":83,"85":85,"86":86,"87":87,"91":91,"95":95}],6:[function(_dereq_,module,exports){
'use strict';

exports.__esModule = true;

var _trackButton = _dereq_(36);

var _trackButton2 = _interopRequireDefault(_trackButton);

var _component = _dereq_(5);

var _component2 = _interopRequireDefault(_component);

var _audioTrackMenuItem = _dereq_(7);

var _audioTrackMenuItem2 = _interopRequireDefault(_audioTrackMenuItem);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * @file audio-track-button.js
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                */


/**
 * The base class for buttons that toggle specific {@link AudioTrack} types.
 *
 * @extends TrackButton
 */
var AudioTrackButton = function (_TrackButton) {
  _inherits(AudioTrackButton, _TrackButton);

  /**
   * Creates an instance of this class.
   *
   * @param {Player} player
   *        The `Player` that this class should be attached to.
   *
   * @param {Object} [options={}]
   *        The key/value store of player options.
   */
  function AudioTrackButton(player) {
    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    _classCallCheck(this, AudioTrackButton);

    options.tracks = player.audioTracks && player.audioTracks();

    var _this = _possibleConstructorReturn(this, _TrackButton.call(this, player, options));

    _this.el_.setAttribute('aria-label', 'Audio Menu');
    return _this;
  }

  /**
   * Builds the default DOM `className`.
   *
   * @return {string}
   *         The DOM `className` for this object.
   */


  AudioTrackButton.prototype.buildCSSClass = function buildCSSClass() {
    return 'vjs-audio-button ' + _TrackButton.prototype.buildCSSClass.call(this);
  };

  /**
   * Create a menu item for each audio track
   *
   * @param {AudioTrackMenuItem[]} [items=[]]
   *        An array of existing menu items to use.
   *
   * @return {AudioTrackMenuItem[]}
   *         An array of menu items
   */


  AudioTrackButton.prototype.createItems = function createItems() {
    var items = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];

    // if there's only one audio track, there no point in showing it
    this.hideThreshold_ = 1;

    var tracks = this.player_.audioTracks && this.player_.audioTracks();

    if (!tracks) {
      return items;
    }

    for (var i = 0; i < tracks.length; i++) {
      var track = tracks[i];

      items.push(new _audioTrackMenuItem2['default'](this.player_, {
        track: track,
        // MenuItem is selectable
        selectable: true
      }));
    }

    return items;
  };

  return AudioTrackButton;
}(_trackButton2['default']);

/**
 * The text that should display over the `AudioTrackButton`s controls. Added for localization.
 *
 * @type {string}
 * @private
 */


AudioTrackButton.prototype.controlText_ = 'Audio Track';
_component2['default'].registerComponent('AudioTrackButton', AudioTrackButton);
exports['default'] = AudioTrackButton;

},{"36":36,"5":5,"7":7}],7:[function(_dereq_,module,exports){
'use strict';

exports.__esModule = true;

var _menuItem = _dereq_(48);

var _menuItem2 = _interopRequireDefault(_menuItem);

var _component = _dereq_(5);

var _component2 = _interopRequireDefault(_component);

var _fn = _dereq_(83);

var Fn = _interopRequireWildcard(_fn);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * @file audio-track-menu-item.js
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                */


/**
 * An {@link AudioTrack} {@link MenuItem}
 *
 * @extends MenuItem
 */
var AudioTrackMenuItem = function (_MenuItem) {
  _inherits(AudioTrackMenuItem, _MenuItem);

  /**
   * Creates an instance of this class.
   *
   * @param {Player} player
   *        The `Player` that this class should be attached to.
   *
   * @param {Object} [options]
   *        The key/value store of player options.
   */
  function AudioTrackMenuItem(player, options) {
    _classCallCheck(this, AudioTrackMenuItem);

    var track = options.track;
    var tracks = player.audioTracks();

    // Modify options for parent MenuItem class's init.
    options.label = track.label || track.language || 'Unknown';
    options.selected = track.enabled;

    var _this = _possibleConstructorReturn(this, _MenuItem.call(this, player, options));

    _this.track = track;

    if (tracks) {
      var changeHandler = Fn.bind(_this, _this.handleTracksChange);

      tracks.addEventListener('change', changeHandler);
      _this.on('dispose', function () {
        tracks.removeEventListener('change', changeHandler);
      });
    }
    return _this;
  }

  /**
   * This gets called when an `AudioTrackMenuItem is "clicked". See {@link ClickableComponent}
   * for more detailed information on what a click can be.
   *
   * @param {EventTarget~Event} [event]
   *        The `keydown`, `tap`, or `click` event that caused this function to be
   *        called.
   *
   * @listens tap
   * @listens click
   */


  AudioTrackMenuItem.prototype.handleClick = function handleClick(event) {
    var tracks = this.player_.audioTracks();

    _MenuItem.prototype.handleClick.call(this, event);

    if (!tracks) {
      return;
    }

    for (var i = 0; i < tracks.length; i++) {
      var track = tracks[i];

      track.enabled = track === this.track;
    }
  };

  /**
   * Handle any {@link AudioTrack} change.
   *
   * @param {EventTarget~Event} [event]
   *        The {@link AudioTrackList#change} event that caused this to run.
   *
   * @listens AudioTrackList#change
   */


  AudioTrackMenuItem.prototype.handleTracksChange = function handleTracksChange(event) {
    this.selected(this.track.enabled);
  };

  return AudioTrackMenuItem;
}(_menuItem2['default']);

_component2['default'].registerComponent('AudioTrackMenuItem', AudioTrackMenuItem);
exports['default'] = AudioTrackMenuItem;

},{"48":48,"5":5,"83":83}],8:[function(_dereq_,module,exports){
'use strict';

exports.__esModule = true;

var _component = _dereq_(5);

var _component2 = _interopRequireDefault(_component);

_dereq_(12);

_dereq_(32);

_dereq_(33);

_dereq_(35);

_dereq_(34);

_dereq_(10);

_dereq_(18);

_dereq_(9);

_dereq_(38);

_dereq_(40);

_dereq_(11);

_dereq_(25);

_dereq_(27);

_dereq_(29);

_dereq_(24);

_dereq_(6);

_dereq_(13);

_dereq_(21);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * @file control-bar.js
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                */


// Required children


/**
 * Container of main controls.
 *
 * @extends Component
 */
var ControlBar = function (_Component) {
  _inherits(ControlBar, _Component);

  function ControlBar() {
    _classCallCheck(this, ControlBar);

    return _possibleConstructorReturn(this, _Component.apply(this, arguments));
  }

  /**
   * Create the `Component`'s DOM element
   *
   * @return {Element}
   *         The element that was created.
   */
  ControlBar.prototype.createEl = function createEl() {
    return _Component.prototype.createEl.call(this, 'div', {
      className: 'vjs-control-bar',
      dir: 'ltr'
    }, {
      // The control bar is a group, so it can contain menuitems
      role: 'group'
    });
  };

  return ControlBar;
}(_component2['default']);

/**
 * Default options for `ControlBar`
 *
 * @type {Object}
 * @private
 */


ControlBar.prototype.options_ = {
  children: ['playToggle', 'volumeMenuButton', 'currentTimeDisplay', 'timeDivider', 'durationDisplay', 'progressControl', 'liveDisplay', 'remainingTimeDisplay', 'customControlSpacer', 'playbackRateMenuButton', 'chaptersButton', 'descriptionsButton', 'subtitlesButton', 'captionsButton', 'audioTrackButton', 'fullscreenToggle']
};

_component2['default'].registerComponent('ControlBar', ControlBar);
exports['default'] = ControlBar;

},{"10":10,"11":11,"12":12,"13":13,"18":18,"21":21,"24":24,"25":25,"27":27,"29":29,"32":32,"33":33,"34":34,"35":35,"38":38,"40":40,"5":5,"6":6,"9":9}],9:[function(_dereq_,module,exports){
'use strict';

exports.__esModule = true;

var _button = _dereq_(2);

var _button2 = _interopRequireDefault(_button);

var _component = _dereq_(5);

var _component2 = _interopRequireDefault(_component);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * @file fullscreen-toggle.js
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                */


/**
 * Toggle fullscreen video
 *
 * @extends Button
 */
var FullscreenToggle = function (_Button) {
  _inherits(FullscreenToggle, _Button);

  /**
   * Creates an instance of this class.
   *
   * @param {Player} player
   *        The `Player` that this class should be attached to.
   *
   * @param {Object} [options]
   *        The key/value store of player options.
   */
  function FullscreenToggle(player, options) {
    _classCallCheck(this, FullscreenToggle);

    var _this = _possibleConstructorReturn(this, _Button.call(this, player, options));

    _this.on(player, 'fullscreenchange', _this.handleFullscreenChange);
    return _this;
  }

  /**
   * Builds the default DOM `className`.
   *
   * @return {string}
   *         The DOM `className` for this object.
   */


  FullscreenToggle.prototype.buildCSSClass = function buildCSSClass() {
    return 'vjs-fullscreen-control ' + _Button.prototype.buildCSSClass.call(this);
  };

  /**
   * Handles fullscreenchange on the player and change control text accordingly.
   *
   * @param {EventTarget~Event} [event]
   *        The {@link Player#fullscreenchange} event that caused this function to be
   *        called.
   *
   * @listens Player#fullscreenchange
   */


  FullscreenToggle.prototype.handleFullscreenChange = function handleFullscreenChange(event) {
    if (this.player_.isFullscreen()) {
      this.controlText('Non-Fullscreen');
    } else {
      this.controlText('Fullscreen');
    }
  };

  /**
   * This gets called when an `FullscreenToggle` is "clicked". See
   * {@link ClickableComponent} for more detailed information on what a click can be.
   *
   * @param {EventTarget~Event} [event]
   *        The `keydown`, `tap`, or `click` event that caused this function to be
   *        called.
   *
   * @listens tap
   * @listens click
   */


  FullscreenToggle.prototype.handleClick = function handleClick(event) {
    if (!this.player_.isFullscreen()) {
      this.player_.requestFullscreen();
    } else {
      this.player_.exitFullscreen();
    }
  };

  return FullscreenToggle;
}(_button2['default']);

/**
 * The text that should display over the `FullscreenToggle`s controls. Added for localization.
 *
 * @type {string}
 * @private
 */


FullscreenToggle.prototype.controlText_ = 'Fullscreen';

_component2['default'].registerComponent('FullscreenToggle', FullscreenToggle);
exports['default'] = FullscreenToggle;

},{"2":2,"5":5}],10:[function(_dereq_,module,exports){
'use strict';

exports.__esModule = true;

var _component = _dereq_(5);

var _component2 = _interopRequireDefault(_component);

var _dom = _dereq_(81);

var Dom = _interopRequireWildcard(_dom);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * @file live-display.js
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                */


// TODO - Future make it click to snap to live

/**
 * Displays the live indicator when duration is Infinity.
 *
 * @extends Component
 */
var LiveDisplay = function (_Component) {
  _inherits(LiveDisplay, _Component);

  /**
   * Creates an instance of this class.
   *
   * @param {Player} player
   *        The `Player` that this class should be attached to.
   *
   * @param {Object} [options]
   *        The key/value store of player options.
   */
  function LiveDisplay(player, options) {
    _classCallCheck(this, LiveDisplay);

    var _this = _possibleConstructorReturn(this, _Component.call(this, player, options));

    _this.updateShowing();
    _this.on(_this.player(), 'durationchange', _this.updateShowing);
    return _this;
  }

  /**
   * Create the `Component`'s DOM element
   *
   * @return {Element}
   *         The element that was created.
   */


  LiveDisplay.prototype.createEl = function createEl() {
    var el = _Component.prototype.createEl.call(this, 'div', {
      className: 'vjs-live-control vjs-control'
    });

    this.contentEl_ = Dom.createEl('div', {
      className: 'vjs-live-display',
      innerHTML: '<span class="vjs-control-text">' + this.localize('Stream Type') + '</span>' + this.localize('LIVE')
    }, {
      'aria-live': 'off'
    });

    el.appendChild(this.contentEl_);
    return el;
  };

  /**
   * Check the duration to see if the LiveDisplay should be showing or not. Then show/hide
   * it accordingly
   *
   * @param {EventTarget~Event} [event]
   *        The {@link Player#durationchange} event that caused this function to run.
   *
   * @listens Player#durationchange
   */


  LiveDisplay.prototype.updateShowing = function updateShowing(event) {
    if (this.player().duration() === Infinity) {
      this.show();
    } else {
      this.hide();
    }
  };

  return LiveDisplay;
}(_component2['default']);

_component2['default'].registerComponent('LiveDisplay', LiveDisplay);
exports['default'] = LiveDisplay;

},{"5":5,"81":81}],11:[function(_dereq_,module,exports){
'use strict';

exports.__esModule = true;

var _button = _dereq_(2);

var _button2 = _interopRequireDefault(_button);

var _component = _dereq_(5);

var _component2 = _interopRequireDefault(_component);

var _dom = _dereq_(81);

var Dom = _interopRequireWildcard(_dom);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * @file mute-toggle.js
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                */


/**
 * A button component for muting the audio.
 *
 * @extends Button
 */
var MuteToggle = function (_Button) {
  _inherits(MuteToggle, _Button);

  /**
   * Creates an instance of this class.
   *
   * @param {Player} player
   *        The `Player` that this class should be attached to.
   *
   * @param {Object} [options]
   *        The key/value store of player options.
   */
  function MuteToggle(player, options) {
    _classCallCheck(this, MuteToggle);

    var _this = _possibleConstructorReturn(this, _Button.call(this, player, options));

    _this.on(player, 'volumechange', _this.update);

    // hide mute toggle if the current tech doesn't support volume control
    if (player.tech_ && player.tech_.featuresVolumeControl === false) {
      _this.addClass('vjs-hidden');
    }

    _this.on(player, 'loadstart', function () {
      // We need to update the button to account for a default muted state.
      this.update();

      if (player.tech_.featuresVolumeControl === false) {
        this.addClass('vjs-hidden');
      } else {
        this.removeClass('vjs-hidden');
      }
    });
    return _this;
  }

  /**
   * Builds the default DOM `className`.
   *
   * @return {string}
   *         The DOM `className` for this object.
   */


  MuteToggle.prototype.buildCSSClass = function buildCSSClass() {
    return 'vjs-mute-control ' + _Button.prototype.buildCSSClass.call(this);
  };

  /**
   * This gets called when an `MuteToggle` is "clicked". See
   * {@link ClickableComponent} for more detailed information on what a click can be.
   *
   * @param {EventTarget~Event} [event]
   *        The `keydown`, `tap`, or `click` event that caused this function to be
   *        called.
   *
   * @listens tap
   * @listens click
   */


  MuteToggle.prototype.handleClick = function handleClick(event) {
    this.player_.muted(this.player_.muted() ? false : true);
  };

  /**
   * Update the state of volume.
   *
   * @param {EventTarget~Event} [event]
   *        The {@link Player#loadstart} event if this function was called through an
   *        event.
   *
   * @listens Player#loadstart
   */


  MuteToggle.prototype.update = function update(event) {
    var vol = this.player_.volume();
    var level = 3;

    if (this.player_.muted()) {
      level = 0;
    } else if (vol < 0.33) {
      level = 1;
    } else if (vol < 0.67) {
      level = 2;
    }

    // Don't rewrite the button text if the actual text doesn't change.
    // This causes unnecessary and confusing information for screen reader users.
    // This check is needed because this function gets called every time the volume level is changed.
    var toMute = this.player_.muted() ? 'Unmute' : 'Mute';

    if (this.controlText() !== toMute) {
      this.controlText(toMute);
    }

    // TODO improve muted icon classes
    for (var i = 0; i < 4; i++) {
      Dom.removeElClass(this.el_, 'vjs-vol-' + i);
    }
    Dom.addElClass(this.el_, 'vjs-vol-' + level);
  };

  return MuteToggle;
}(_button2['default']);

/**
 * The text that should display over the `MuteToggle`s controls. Added for localization.
 *
 * @type {string}
 * @private
 */


MuteToggle.prototype.controlText_ = 'Mute';

_component2['default'].registerComponent('MuteToggle', MuteToggle);
exports['default'] = MuteToggle;

},{"2":2,"5":5,"81":81}],12:[function(_dereq_,module,exports){
'use strict';

exports.__esModule = true;

var _button = _dereq_(2);

var _button2 = _interopRequireDefault(_button);

var _component = _dereq_(5);

var _component2 = _interopRequireDefault(_component);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * @file play-toggle.js
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                */


/**
 * Button to toggle between play and pause.
 *
 * @extends Button
 */
var PlayToggle = function (_Button) {
  _inherits(PlayToggle, _Button);

  /**
   * Creates an instance of this class.
   *
   * @param {Player} player
   *        The `Player` that this class should be attached to.
   *
   * @param {Object} [options]
   *        The key/value store of player options.
   */
  function PlayToggle(player, options) {
    _classCallCheck(this, PlayToggle);

    var _this = _possibleConstructorReturn(this, _Button.call(this, player, options));

    _this.on(player, 'play', _this.handlePlay);
    _this.on(player, 'pause', _this.handlePause);
    return _this;
  }

  /**
   * Builds the default DOM `className`.
   *
   * @return {string}
   *         The DOM `className` for this object.
   */


  PlayToggle.prototype.buildCSSClass = function buildCSSClass() {
    return 'vjs-play-control ' + _Button.prototype.buildCSSClass.call(this);
  };

  /**
   * This gets called when an `PlayToggle` is "clicked". See
   * {@link ClickableComponent} for more detailed information on what a click can be.
   *
   * @param {EventTarget~Event} [event]
   *        The `keydown`, `tap`, or `click` event that caused this function to be
   *        called.
   *
   * @listens tap
   * @listens click
   */


  PlayToggle.prototype.handleClick = function handleClick(event) {
    if (this.player_.paused()) {
      this.player_.play();
    } else {
      this.player_.pause();
    }
  };

  /**
   * Add the vjs-playing class to the element so it can change appearance.
   *
   * @param {EventTarget~Event} [event]
   *        The event that caused this function to run.
   *
   * @listens Player#play
   */


  PlayToggle.prototype.handlePlay = function handlePlay(event) {
    this.removeClass('vjs-paused');
    this.addClass('vjs-playing');
    // change the button text to "Pause"
    this.controlText('Pause');
  };

  /**
   * Add the vjs-paused class to the element so it can change appearance.
   *
   * @param {EventTarget~Event} [event]
   *        The event that caused this function to run.
   *
   * @listens Player#pause
   */


  PlayToggle.prototype.handlePause = function handlePause(event) {
    this.removeClass('vjs-playing');
    this.addClass('vjs-paused');
    // change the button text to "Play"
    this.controlText('Play');
  };

  return PlayToggle;
}(_button2['default']);

/**
 * The text that should display over the `PlayToggle`s controls. Added for localization.
 *
 * @type {string}
 * @private
 */


PlayToggle.prototype.controlText_ = 'Play';

_component2['default'].registerComponent('PlayToggle', PlayToggle);
exports['default'] = PlayToggle;

},{"2":2,"5":5}],13:[function(_dereq_,module,exports){
'use strict';

exports.__esModule = true;

var _menuButton = _dereq_(47);

var _menuButton2 = _interopRequireDefault(_menuButton);

var _menu = _dereq_(49);

var _menu2 = _interopRequireDefault(_menu);

var _playbackRateMenuItem = _dereq_(14);

var _playbackRateMenuItem2 = _interopRequireDefault(_playbackRateMenuItem);

var _component = _dereq_(5);

var _component2 = _interopRequireDefault(_component);

var _dom = _dereq_(81);

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

},{"14":14,"47":47,"49":49,"5":5,"81":81}],14:[function(_dereq_,module,exports){
'use strict';

exports.__esModule = true;

var _menuItem = _dereq_(48);

var _menuItem2 = _interopRequireDefault(_menuItem);

var _component = _dereq_(5);

var _component2 = _interopRequireDefault(_component);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * @file playback-rate-menu-item.js
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                */


/**
 * The specific menu item type for selecting a playback rate.
 *
 * @extends MenuItem
 */
var PlaybackRateMenuItem = function (_MenuItem) {
  _inherits(PlaybackRateMenuItem, _MenuItem);

  /**
   * Creates an instance of this class.
   *
   * @param {Player} player
   *        The `Player` that this class should be attached to.
   *
   * @param {Object} [options]
   *        The key/value store of player options.
   */
  function PlaybackRateMenuItem(player, options) {
    _classCallCheck(this, PlaybackRateMenuItem);

    var label = options.rate;
    var rate = parseFloat(label, 10);

    // Modify options for parent MenuItem class's init.
    options.label = label;
    options.selected = rate === 1;
    options.selectable = true;

    var _this = _possibleConstructorReturn(this, _MenuItem.call(this, player, options));

    _this.label = label;
    _this.rate = rate;

    _this.on(player, 'ratechange', _this.update);
    return _this;
  }

  /**
   * This gets called when an `PlaybackRateMenuItem` is "clicked". See
   * {@link ClickableComponent} for more detailed information on what a click can be.
   *
   * @param {EventTarget~Event} [event]
   *        The `keydown`, `tap`, or `click` event that caused this function to be
   *        called.
   *
   * @listens tap
   * @listens click
   */


  PlaybackRateMenuItem.prototype.handleClick = function handleClick(event) {
    _MenuItem.prototype.handleClick.call(this);
    this.player().playbackRate(this.rate);
  };

  /**
   * Update the PlaybackRateMenuItem when the playbackrate changes.
   *
   * @param {EventTarget~Event} [event]
   *        The `ratechange` event that caused this function to run.
   *
   * @listens Player#ratechange
   */


  PlaybackRateMenuItem.prototype.update = function update(event) {
    this.selected(this.player().playbackRate() === this.rate);
  };

  return PlaybackRateMenuItem;
}(_menuItem2['default']);

/**
 * The text that should display over the `PlaybackRateMenuItem`s controls. Added for localization.
 *
 * @type {string}
 * @private
 */


PlaybackRateMenuItem.prototype.contentElType = 'button';

_component2['default'].registerComponent('PlaybackRateMenuItem', PlaybackRateMenuItem);
exports['default'] = PlaybackRateMenuItem;

},{"48":48,"5":5}],15:[function(_dereq_,module,exports){
'use strict';

exports.__esModule = true;

var _component = _dereq_(5);

var _component2 = _interopRequireDefault(_component);

var _dom = _dereq_(81);

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

},{"5":5,"81":81}],16:[function(_dereq_,module,exports){
'use strict';

exports.__esModule = true;

var _component = _dereq_(5);

var _component2 = _interopRequireDefault(_component);

var _dom = _dereq_(81);

var Dom = _interopRequireWildcard(_dom);

var _fn = _dereq_(83);

var Fn = _interopRequireWildcard(_fn);

var _formatTime = _dereq_(84);

var _formatTime2 = _interopRequireDefault(_formatTime);

var _computedStyle = _dereq_(80);

var _computedStyle2 = _interopRequireDefault(_computedStyle);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * @file mouse-time-display.js
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                */


/**
 * The Mouse Time Display component shows the time you will seek to
 * when hovering over the progress bar
 *
 * @extends Component
 */
var MouseTimeDisplay = function (_Component) {
  _inherits(MouseTimeDisplay, _Component);

  /**
   * Creates an instance of this class.
   *
   * @param {Player} player
   *        The `Player` that this class should be attached to.
   *
   * @param {Object} [options]
   *        The key/value store of player options.
   */
  function MouseTimeDisplay(player, options) {
    _classCallCheck(this, MouseTimeDisplay);

    var _this = _possibleConstructorReturn(this, _Component.call(this, player, options));

    if (options.playerOptions && options.playerOptions.controlBar && options.playerOptions.controlBar.progressControl && options.playerOptions.controlBar.progressControl.keepTooltipsInside) {
      _this.keepTooltipsInside = options.playerOptions.controlBar.progressControl.keepTooltipsInside;
    }

    if (_this.keepTooltipsInside) {
      _this.tooltip = Dom.createEl('div', { className: 'vjs-time-tooltip' });
      _this.el().appendChild(_this.tooltip);
      _this.addClass('vjs-keep-tooltips-inside');
    }

    _this.update(0, 0);

    player.on('ready', function () {
      _this.on(player.controlBar.progressControl.el(), 'mousemove', Fn.throttle(Fn.bind(_this, _this.handleMouseMove), 25));
    });
    return _this;
  }

  /**
   * Create the `Component`'s DOM element
   *
   * @return {Element}
   *         The element that was created.
   */


  MouseTimeDisplay.prototype.createEl = function createEl() {
    return _Component.prototype.createEl.call(this, 'div', {
      className: 'vjs-mouse-display'
    });
  };

  /**
   * Handle the mouse move event on the `MouseTimeDisplay`.
   *
   * @param {EventTarget~Event} event
   *        The `mousemove` event that caused this to event to run.
   *
   * @listen mousemove
   */


  MouseTimeDisplay.prototype.handleMouseMove = function handleMouseMove(event) {
    var duration = this.player_.duration();
    var newTime = this.calculateDistance(event) * duration;
    var position = event.pageX - Dom.findElPosition(this.el().parentNode).left;

    this.update(newTime, position);
  };

  /**
   * Update the time and posistion of the `MouseTimeDisplay`.
   *
   * @param {number} newTime
   *        Time to change the `MouseTimeDisplay` to.
   *
   * @param {nubmer} position
   *        Postion from the left of the in pixels.
   */


  MouseTimeDisplay.prototype.update = function update(newTime, position) {
    var time = (0, _formatTime2['default'])(newTime, this.player_.duration());

    this.el().style.left = position + 'px';
    this.el().setAttribute('data-current-time', time);

    if (this.keepTooltipsInside) {
      var clampedPosition = this.clampPosition_(position);
      var difference = position - clampedPosition + 1;
      var tooltipWidth = parseFloat((0, _computedStyle2['default'])(this.tooltip, 'width'));
      var tooltipWidthHalf = tooltipWidth / 2;

      this.tooltip.innerHTML = time;
      this.tooltip.style.right = '-' + (tooltipWidthHalf - difference) + 'px';
    }
  };

  /**
   * Get the mouse pointers x coordinate in pixels.
   *
   * @param {EventTarget~Event} [event]
   *        The `mousemove` event that was passed to this function by
   *        {@link MouseTimeDisplay#handleMouseMove}
   *
   * @return {number}
   *         THe x position in pixels of the mouse pointer.
   */


  MouseTimeDisplay.prototype.calculateDistance = function calculateDistance(event) {
    return Dom.getPointerPosition(this.el().parentNode, event).x;
  };

  /**
   * This takes in a horizontal position for the bar and returns a clamped position.
   * Clamped position means that it will keep the position greater than half the width
   * of the tooltip and smaller than the player width minus half the width o the tooltip.
   * It will only clamp the position if `keepTooltipsInside` option is set.
   *
   * @param {number} position
   *        The position the bar wants to be
   *
   * @return {number}
   *         The (potentially) new clamped position.
   *
   * @private
   */


  MouseTimeDisplay.prototype.clampPosition_ = function clampPosition_(position) {
    if (!this.keepTooltipsInside) {
      return position;
    }

    var playerWidth = parseFloat((0, _computedStyle2['default'])(this.player().el(), 'width'));
    var tooltipWidth = parseFloat((0, _computedStyle2['default'])(this.tooltip, 'width'));
    var tooltipWidthHalf = tooltipWidth / 2;
    var actualPosition = position;

    if (position < tooltipWidthHalf) {
      actualPosition = Math.ceil(tooltipWidthHalf);
    } else if (position > playerWidth - tooltipWidthHalf) {
      actualPosition = Math.floor(playerWidth - tooltipWidthHalf);
    }

    return actualPosition;
  };

  return MouseTimeDisplay;
}(_component2['default']);

_component2['default'].registerComponent('MouseTimeDisplay', MouseTimeDisplay);
exports['default'] = MouseTimeDisplay;

},{"5":5,"80":80,"81":81,"83":83,"84":84}],17:[function(_dereq_,module,exports){
'use strict';

exports.__esModule = true;

var _component = _dereq_(5);

var _component2 = _interopRequireDefault(_component);

var _fn = _dereq_(83);

var Fn = _interopRequireWildcard(_fn);

var _formatTime = _dereq_(84);

var _formatTime2 = _interopRequireDefault(_formatTime);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * @file play-progress-bar.js
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                */


/**
 * Shows play progress
 *
 * @extends Component
 */
var PlayProgressBar = function (_Component) {
  _inherits(PlayProgressBar, _Component);

  /**
   * Creates an instance of this class.
   *
   * @param {Player} player
   *        The `Player` that this class should be attached to.
   *
   * @param {Object} [options]
   *        The key/value store of player options.
   */
  function PlayProgressBar(player, options) {
    _classCallCheck(this, PlayProgressBar);

    var _this = _possibleConstructorReturn(this, _Component.call(this, player, options));

    _this.updateDataAttr();
    _this.on(player, 'timeupdate', _this.updateDataAttr);
    player.ready(Fn.bind(_this, _this.updateDataAttr));

    if (options.playerOptions && options.playerOptions.controlBar && options.playerOptions.controlBar.progressControl && options.playerOptions.controlBar.progressControl.keepTooltipsInside) {
      _this.keepTooltipsInside = options.playerOptions.controlBar.progressControl.keepTooltipsInside;
    }

    if (_this.keepTooltipsInside) {
      _this.addClass('vjs-keep-tooltips-inside');
    }
    return _this;
  }

  /**
   * Create the `Component`'s DOM element
   *
   * @return {Element}
   *         The element that was created.
   */


  PlayProgressBar.prototype.createEl = function createEl() {
    return _Component.prototype.createEl.call(this, 'div', {
      className: 'vjs-play-progress vjs-slider-bar',
      innerHTML: '<span class="vjs-control-text"><span>' + this.localize('Progress') + '</span>: 0%</span>'
    });
  };

  /**
   * Update the data-current-time attribute on the `PlayProgressBar`.
   *
   * @param {EventTarget~Event} [event]
   *        The `timeupdate` event that caused this to run.
   *
   * @listens Player#timeupdate
   */


  PlayProgressBar.prototype.updateDataAttr = function updateDataAttr(event) {
    var time = this.player_.scrubbing() ? this.player_.getCache().currentTime : this.player_.currentTime();

    this.el_.setAttribute('data-current-time', (0, _formatTime2['default'])(time, this.player_.duration()));
  };

  return PlayProgressBar;
}(_component2['default']);

_component2['default'].registerComponent('PlayProgressBar', PlayProgressBar);
exports['default'] = PlayProgressBar;

},{"5":5,"83":83,"84":84}],18:[function(_dereq_,module,exports){
'use strict';

exports.__esModule = true;

var _component = _dereq_(5);

var _component2 = _interopRequireDefault(_component);

_dereq_(19);

_dereq_(16);

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

},{"16":16,"19":19,"5":5}],19:[function(_dereq_,module,exports){
'use strict';

exports.__esModule = true;

var _slider = _dereq_(57);

var _slider2 = _interopRequireDefault(_slider);

var _component = _dereq_(5);

var _component2 = _interopRequireDefault(_component);

var _fn = _dereq_(83);

var Fn = _interopRequireWildcard(_fn);

var _formatTime = _dereq_(84);

var _formatTime2 = _interopRequireDefault(_formatTime);

var _computedStyle = _dereq_(80);

var _computedStyle2 = _interopRequireDefault(_computedStyle);

_dereq_(15);

_dereq_(17);

_dereq_(20);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * @file seek-bar.js
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                */


/**
 * Seek Bar and holder for the progress bars
 *
 * @extends Slider
 */
var SeekBar = function (_Slider) {
  _inherits(SeekBar, _Slider);

  /**
   * Creates an instance of this class.
   *
   * @param {Player} player
   *        The `Player` that this class should be attached to.
   *
   * @param {Object} [options]
   *        The key/value store of player options.
   */
  function SeekBar(player, options) {
    _classCallCheck(this, SeekBar);

    var _this = _possibleConstructorReturn(this, _Slider.call(this, player, options));

    _this.on(player, 'timeupdate', _this.updateProgress);
    _this.on(player, 'ended', _this.updateProgress);
    player.ready(Fn.bind(_this, _this.updateProgress));

    if (options.playerOptions && options.playerOptions.controlBar && options.playerOptions.controlBar.progressControl && options.playerOptions.controlBar.progressControl.keepTooltipsInside) {
      _this.keepTooltipsInside = options.playerOptions.controlBar.progressControl.keepTooltipsInside;
    }

    if (_this.keepTooltipsInside) {
      _this.tooltipProgressBar = _this.addChild('TooltipProgressBar');
    }
    return _this;
  }

  /**
   * Create the `Component`'s DOM element
   *
   * @return {Element}
   *         The element that was created.
   */


  SeekBar.prototype.createEl = function createEl() {
    return _Slider.prototype.createEl.call(this, 'div', {
      className: 'vjs-progress-holder'
    }, {
      'aria-label': 'progress bar'
    });
  };

  /**
   * Update the seek bars tooltip and width.
   *
   * @param {EventTarget~Event} [event]
   *        The `timeupdate` or `ended` event that caused this to run.
   *
   * @listens Player#timeupdate
   * @listens Player#ended
   */


  SeekBar.prototype.updateProgress = function updateProgress(event) {
    this.updateAriaAttributes(this.el_);

    if (this.keepTooltipsInside) {
      this.updateAriaAttributes(this.tooltipProgressBar.el_);
      this.tooltipProgressBar.el_.style.width = this.bar.el_.style.width;

      var playerWidth = parseFloat((0, _computedStyle2['default'])(this.player().el(), 'width'));
      var tooltipWidth = parseFloat((0, _computedStyle2['default'])(this.tooltipProgressBar.tooltip, 'width'));
      var tooltipStyle = this.tooltipProgressBar.el().style;

      tooltipStyle.maxWidth = Math.floor(playerWidth - tooltipWidth / 2) + 'px';
      tooltipStyle.minWidth = Math.ceil(tooltipWidth / 2) + 'px';
      tooltipStyle.right = '-' + tooltipWidth / 2 + 'px';
    }
  };

  /**
   * Update ARIA accessibility attributes
   *
   * @param {Element} el
   *        The element to update with aria accessibility attributes.
   */


  SeekBar.prototype.updateAriaAttributes = function updateAriaAttributes(el) {
    // Allows for smooth scrubbing, when player can't keep up.
    var time = this.player_.scrubbing() ? this.player_.getCache().currentTime : this.player_.currentTime();

    // machine readable value of progress bar (percentage complete)
    el.setAttribute('aria-valuenow', (this.getPercent() * 100).toFixed(2));
    // human readable value of progress bar (time complete)
    el.setAttribute('aria-valuetext', (0, _formatTime2['default'])(time, this.player_.duration()));
  };

  /**
   * Get percentage of video played
   *
   * @return {number}
   *         The percentage played
   */


  SeekBar.prototype.getPercent = function getPercent() {
    var percent = this.player_.currentTime() / this.player_.duration();

    return percent >= 1 ? 1 : percent;
  };

  /**
   * Handle mouse down on seek bar
   *
   * @param {EventTarget~Event} event
   *        The `mousedown` event that caused this to run.
   *
   * @listens mousedown
   */


  SeekBar.prototype.handleMouseDown = function handleMouseDown(event) {
    this.player_.scrubbing(true);

    this.videoWasPlaying = !this.player_.paused();
    this.player_.pause();

    _Slider.prototype.handleMouseDown.call(this, event);
  };

  /**
   * Handle mouse move on seek bar
   *
   * @param {EventTarget~Event} event
   *        The `mousemove` event that caused this to run.
   *
   * @listens mousemove
   */


  SeekBar.prototype.handleMouseMove = function handleMouseMove(event) {
    var newTime = this.calculateDistance(event) * this.player_.duration();

    // Don't let video end while scrubbing.
    if (newTime === this.player_.duration()) {
      newTime = newTime - 0.1;
    }

    // Set new time (tell player to seek to new time)
    this.player_.currentTime(newTime);
  };

  /**
   * Handle mouse up on seek bar
   *
   * @param {EventTarget~Event} event
   *        The `mouseup` event that caused this to run.
   *
   * @listens mouseup
   */


  SeekBar.prototype.handleMouseUp = function handleMouseUp(event) {
    _Slider.prototype.handleMouseUp.call(this, event);

    this.player_.scrubbing(false);
    if (this.videoWasPlaying) {
      this.player_.play();
    }
  };

  /**
   * Move more quickly fast forward for keyboard-only users
   */


  SeekBar.prototype.stepForward = function stepForward() {
    // more quickly fast forward for keyboard-only users
    this.player_.currentTime(this.player_.currentTime() + 5);
  };

  /**
   * Move more quickly rewind for keyboard-only users
   */


  SeekBar.prototype.stepBack = function stepBack() {
    // more quickly rewind for keyboard-only users
    this.player_.currentTime(this.player_.currentTime() - 5);
  };

  return SeekBar;
}(_slider2['default']);

/**
 * Default options for the `SeekBar`
 *
 * @type {Object}
 * @private
 */


SeekBar.prototype.options_ = {
  children: ['loadProgressBar', 'mouseTimeDisplay', 'playProgressBar'],
  barName: 'playProgressBar'
};

/**
 * Call the update event for this Slider when this event happens on the player.
 *
 * @type {string}
 */
SeekBar.prototype.playerEvent = 'timeupdate';

_component2['default'].registerComponent('SeekBar', SeekBar);
exports['default'] = SeekBar;

},{"15":15,"17":17,"20":20,"5":5,"57":57,"80":80,"83":83,"84":84}],20:[function(_dereq_,module,exports){
'use strict';

exports.__esModule = true;

var _component = _dereq_(5);

var _component2 = _interopRequireDefault(_component);

var _fn = _dereq_(83);

var Fn = _interopRequireWildcard(_fn);

var _formatTime = _dereq_(84);

var _formatTime2 = _interopRequireDefault(_formatTime);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * @file play-progress-bar.js
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                */


/**
 * Shows play progress
 *
 * @extends Component
 */
var TooltipProgressBar = function (_Component) {
  _inherits(TooltipProgressBar, _Component);

  /**
   * Creates an instance of this class.
   *
   * @param {Player} player
   *        The `Player` that this class should be attached to.
   *
   * @param {Object} [options]
   *        The key/value store of player options.
   */
  function TooltipProgressBar(player, options) {
    _classCallCheck(this, TooltipProgressBar);

    var _this = _possibleConstructorReturn(this, _Component.call(this, player, options));

    _this.updateDataAttr();
    _this.on(player, 'timeupdate', _this.updateDataAttr);
    player.ready(Fn.bind(_this, _this.updateDataAttr));
    return _this;
  }

  /**
   * Create the `Component`'s DOM element
   *
   * @return {Element}
   *         The element that was created.
   */


  TooltipProgressBar.prototype.createEl = function createEl() {
    var el = _Component.prototype.createEl.call(this, 'div', {
      className: 'vjs-tooltip-progress-bar vjs-slider-bar',
      innerHTML: '<div class="vjs-time-tooltip"></div>\n        <span class="vjs-control-text"><span>' + this.localize('Progress') + '</span>: 0%</span>'
    });

    this.tooltip = el.querySelector('.vjs-time-tooltip');

    return el;
  };

  /**
   * Updatet the data-current-time attribute for TooltipProgressBar
   *
   * @param {EventTarget~Event} [event]
   *        The `timeupdate` event that caused this function to run.
   *
   * @listens Player#timeupdate
   */


  TooltipProgressBar.prototype.updateDataAttr = function updateDataAttr(event) {
    var time = this.player_.scrubbing() ? this.player_.getCache().currentTime : this.player_.currentTime();
    var formattedTime = (0, _formatTime2['default'])(time, this.player_.duration());

    this.el_.setAttribute('data-current-time', formattedTime);
    this.tooltip.innerHTML = formattedTime;
  };

  return TooltipProgressBar;
}(_component2['default']);

_component2['default'].registerComponent('TooltipProgressBar', TooltipProgressBar);
exports['default'] = TooltipProgressBar;

},{"5":5,"83":83,"84":84}],21:[function(_dereq_,module,exports){
'use strict';

exports.__esModule = true;

var _spacer = _dereq_(22);

var _spacer2 = _interopRequireDefault(_spacer);

var _component = _dereq_(5);

var _component2 = _interopRequireDefault(_component);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * @file custom-control-spacer.js
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                */


/**
 * Spacer specifically meant to be used as an insertion point for new plugins, etc.
 *
 * @extends Spacer
 */
var CustomControlSpacer = function (_Spacer) {
  _inherits(CustomControlSpacer, _Spacer);

  function CustomControlSpacer() {
    _classCallCheck(this, CustomControlSpacer);

    return _possibleConstructorReturn(this, _Spacer.apply(this, arguments));
  }

  /**
   * Builds the default DOM `className`.
   *
   * @return {string}
   *         The DOM `className` for this object.
   */
  CustomControlSpacer.prototype.buildCSSClass = function buildCSSClass() {
    return 'vjs-custom-control-spacer ' + _Spacer.prototype.buildCSSClass.call(this);
  };

  /**
   * Create the `Component`'s DOM element
   *
   * @return {Element}
   *         The element that was created.
   */


  CustomControlSpacer.prototype.createEl = function createEl() {
    var el = _Spacer.prototype.createEl.call(this, {
      className: this.buildCSSClass()
    });

    // No-flex/table-cell mode requires there be some content
    // in the cell to fill the remaining space of the table.
    el.innerHTML = '&nbsp;';
    return el;
  };

  return CustomControlSpacer;
}(_spacer2['default']);

_component2['default'].registerComponent('CustomControlSpacer', CustomControlSpacer);
exports['default'] = CustomControlSpacer;

},{"22":22,"5":5}],22:[function(_dereq_,module,exports){
'use strict';

exports.__esModule = true;

var _component = _dereq_(5);

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

},{"5":5}],23:[function(_dereq_,module,exports){
'use strict';

exports.__esModule = true;

var _textTrackMenuItem = _dereq_(31);

var _textTrackMenuItem2 = _interopRequireDefault(_textTrackMenuItem);

var _component = _dereq_(5);

var _component2 = _interopRequireDefault(_component);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * @file caption-settings-menu-item.js
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                */


/**
 * The menu item for caption track settings menu
 *
 * @extends TextTrackMenuItem
 */
var CaptionSettingsMenuItem = function (_TextTrackMenuItem) {
  _inherits(CaptionSettingsMenuItem, _TextTrackMenuItem);

  /**
   * Creates an instance of this class.
   *
   * @param {Player} player
   *        The `Player` that this class should be attached to.
   *
   * @param {Object} [options]
   *        The key/value store of player options.
   */
  function CaptionSettingsMenuItem(player, options) {
    _classCallCheck(this, CaptionSettingsMenuItem);

    options.track = {
      player: player,
      kind: options.kind,
      label: options.kind + ' settings',
      selectable: false,
      'default': false,
      mode: 'disabled'
    };

    // CaptionSettingsMenuItem has no concept of 'selected'
    options.selectable = false;

    var _this = _possibleConstructorReturn(this, _TextTrackMenuItem.call(this, player, options));

    _this.addClass('vjs-texttrack-settings');
    _this.controlText(', opens ' + options.kind + ' settings dialog');
    return _this;
  }

  /**
   * This gets called when an `CaptionSettingsMenuItem` is "clicked". See
   * {@link ClickableComponent} for more detailed information on what a click can be.
   *
   * @param {EventTarget~Event} [event]
   *        The `keydown`, `tap`, or `click` event that caused this function to be
   *        called.
   *
   * @listens tap
   * @listens click
   */


  CaptionSettingsMenuItem.prototype.handleClick = function handleClick(event) {
    this.player().getChild('textTrackSettings').show();
    this.player().getChild('textTrackSettings').el_.focus();
  };

  return CaptionSettingsMenuItem;
}(_textTrackMenuItem2['default']);

_component2['default'].registerComponent('CaptionSettingsMenuItem', CaptionSettingsMenuItem);
exports['default'] = CaptionSettingsMenuItem;

},{"31":31,"5":5}],24:[function(_dereq_,module,exports){
'use strict';

exports.__esModule = true;

var _textTrackButton = _dereq_(30);

var _textTrackButton2 = _interopRequireDefault(_textTrackButton);

var _component = _dereq_(5);

var _component2 = _interopRequireDefault(_component);

var _captionSettingsMenuItem = _dereq_(23);

var _captionSettingsMenuItem2 = _interopRequireDefault(_captionSettingsMenuItem);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * @file captions-button.js
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                */


/**
 * The button component for toggling and selecting captions
 *
 * @extends TextTrackButton
 */
var CaptionsButton = function (_TextTrackButton) {
  _inherits(CaptionsButton, _TextTrackButton);

  /**
   * Creates an instance of this class.
   *
   * @param {Player} player
   *        The `Player` that this class should be attached to.
   *
   * @param {Object} [options]
   *        The key/value store of player options.
   *
   * @param {Component~ReadyCallback} [ready]
   *        The function to call when this component is ready.
   */
  function CaptionsButton(player, options, ready) {
    _classCallCheck(this, CaptionsButton);

    var _this = _possibleConstructorReturn(this, _TextTrackButton.call(this, player, options, ready));

    _this.el_.setAttribute('aria-label', 'Captions Menu');
    return _this;
  }

  /**
   * Builds the default DOM `className`.
   *
   * @return {string}
   *         The DOM `className` for this object.
   */


  CaptionsButton.prototype.buildCSSClass = function buildCSSClass() {
    return 'vjs-captions-button ' + _TextTrackButton.prototype.buildCSSClass.call(this);
  };

  /**
   * Create caption menu items
   *
   * @return {CaptionSettingsMenuItem[]}
   *         The array of current menu items.
   */


  CaptionsButton.prototype.createItems = function createItems() {
    var items = [];

    if (!(this.player().tech_ && this.player().tech_.featuresNativeTextTracks)) {
      items.push(new _captionSettingsMenuItem2['default'](this.player_, { kind: this.kind_ }));

      this.hideThreshold_ += 1;
    }

    return _TextTrackButton.prototype.createItems.call(this, items);
  };

  return CaptionsButton;
}(_textTrackButton2['default']);

/**
 * `kind` of TextTrack to look for to associate it with this menu.
 *
 * @type {string}
 * @private
 */


CaptionsButton.prototype.kind_ = 'captions';

/**
 * The text that should display over the `CaptionsButton`s controls. Added for localization.
 *
 * @type {string}
 * @private
 */
CaptionsButton.prototype.controlText_ = 'Captions';

_component2['default'].registerComponent('CaptionsButton', CaptionsButton);
exports['default'] = CaptionsButton;

},{"23":23,"30":30,"5":5}],25:[function(_dereq_,module,exports){
'use strict';

exports.__esModule = true;

var _textTrackButton = _dereq_(30);

var _textTrackButton2 = _interopRequireDefault(_textTrackButton);

var _component = _dereq_(5);

var _component2 = _interopRequireDefault(_component);

var _chaptersTrackMenuItem = _dereq_(26);

var _chaptersTrackMenuItem2 = _interopRequireDefault(_chaptersTrackMenuItem);

var _toTitleCase = _dereq_(91);

var _toTitleCase2 = _interopRequireDefault(_toTitleCase);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * @file chapters-button.js
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                */


/**
 * The button component for toggling and selecting chapters
 * Chapters act much differently than other text tracks
 * Cues are navigation vs. other tracks of alternative languages
 *
 * @extends TextTrackButton
 */
var ChaptersButton = function (_TextTrackButton) {
  _inherits(ChaptersButton, _TextTrackButton);

  /**
   * Creates an instance of this class.
   *
   * @param {Player} player
   *        The `Player` that this class should be attached to.
   *
   * @param {Object} [options]
   *        The key/value store of player options.
   *
   * @param {Component~ReadyCallback} [ready]
   *        The function to call when this function is ready.
   */
  function ChaptersButton(player, options, ready) {
    _classCallCheck(this, ChaptersButton);

    var _this = _possibleConstructorReturn(this, _TextTrackButton.call(this, player, options, ready));

    _this.el_.setAttribute('aria-label', 'Chapters Menu');
    return _this;
  }

  /**
   * Builds the default DOM `className`.
   *
   * @return {string}
   *         The DOM `className` for this object.
   */


  ChaptersButton.prototype.buildCSSClass = function buildCSSClass() {
    return 'vjs-chapters-button ' + _TextTrackButton.prototype.buildCSSClass.call(this);
  };

  /**
   * Update the menu based on the current state of its items.
   *
   * @param {EventTarget~Event} [event]
   *        An event that triggered this function to run.
   *
   * @listens TextTrackList#addtrack
   * @listens TextTrackList#removetrack
   * @listens TextTrackList#change
   */


  ChaptersButton.prototype.update = function update(event) {
    if (!this.track_ || event && (event.type === 'addtrack' || event.type === 'removetrack')) {
      this.setTrack(this.findChaptersTrack());
    }
    _TextTrackButton.prototype.update.call(this);
  };

  /**
   * Set the currently selected track for the chapters button.
   *
   * @param {TextTrack} track
   *        The new track to select. Nothing will change if this is the currently selected
   *        track.
   */


  ChaptersButton.prototype.setTrack = function setTrack(track) {
    if (this.track_ === track) {
      return;
    }

    if (!this.updateHandler_) {
      this.updateHandler_ = this.update.bind(this);
    }

    // here this.track_ refers to the old track instance
    if (this.track_) {
      var remoteTextTrackEl = this.player_.remoteTextTrackEls().getTrackElementByTrack_(this.track_);

      if (remoteTextTrackEl) {
        remoteTextTrackEl.removeEventListener('load', this.updateHandler_);
      }

      this.track_ = null;
    }

    this.track_ = track;

    // here this.track_ refers to the new track instance
    if (this.track_) {
      this.track_.mode = 'hidden';

      var _remoteTextTrackEl = this.player_.remoteTextTrackEls().getTrackElementByTrack_(this.track_);

      if (_remoteTextTrackEl) {
        _remoteTextTrackEl.addEventListener('load', this.updateHandler_);
      }
    }
  };

  /**
   * Find the track object that is currently in use by this ChaptersButton
   *
   * @return {TextTrack|undefined}
   *         The current track or undefined if none was found.
   */


  ChaptersButton.prototype.findChaptersTrack = function findChaptersTrack() {
    var tracks = this.player_.textTracks() || [];

    for (var i = tracks.length - 1; i >= 0; i--) {
      // We will always choose the last track as our chaptersTrack
      var track = tracks[i];

      if (track.kind === this.kind_) {
        return track;
      }
    }
  };

  /**
   * Get the caption for the ChaptersButton based on the track label. This will also
   * use the current tracks localized kind as a fallback if a label does not exist.
   *
   * @return {string}
   *         The tracks current label or the localized track kind.
   */


  ChaptersButton.prototype.getMenuCaption = function getMenuCaption() {
    if (this.track_ && this.track_.label) {
      return this.track_.label;
    }
    return this.localize((0, _toTitleCase2['default'])(this.kind_));
  };

  /**
   * Create menu from chapter track
   *
   * @return {Menu}
   *         New menu for the chapter buttons
   */


  ChaptersButton.prototype.createMenu = function createMenu() {
    this.options_.title = this.getMenuCaption();
    return _TextTrackButton.prototype.createMenu.call(this);
  };

  /**
   * Create a menu item for each text track
   *
   * @return {TextTrackMenuItem[]}
   *         Array of menu items
   */


  ChaptersButton.prototype.createItems = function createItems() {
    var items = [];

    if (!this.track_) {
      return items;
    }

    var cues = this.track_.cues;

    if (!cues) {
      return items;
    }

    for (var i = 0, l = cues.length; i < l; i++) {
      var cue = cues[i];
      var mi = new _chaptersTrackMenuItem2['default'](this.player_, { track: this.track_, cue: cue });

      items.push(mi);
    }

    return items;
  };

  return ChaptersButton;
}(_textTrackButton2['default']);

/**
 * `kind` of TextTrack to look for to associate it with this menu.
 *
 * @type {string}
 * @private
 */


ChaptersButton.prototype.kind_ = 'chapters';

/**
 * The text that should display over the `ChaptersButton`s controls. Added for localization.
 *
 * @type {string}
 * @private
 */
ChaptersButton.prototype.controlText_ = 'Chapters';

_component2['default'].registerComponent('ChaptersButton', ChaptersButton);
exports['default'] = ChaptersButton;

},{"26":26,"30":30,"5":5,"91":91}],26:[function(_dereq_,module,exports){
'use strict';

exports.__esModule = true;

var _menuItem = _dereq_(48);

var _menuItem2 = _interopRequireDefault(_menuItem);

var _component = _dereq_(5);

var _component2 = _interopRequireDefault(_component);

var _fn = _dereq_(83);

var Fn = _interopRequireWildcard(_fn);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * @file chapters-track-menu-item.js
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                */


/**
 * The chapter track menu item
 *
 * @extends MenuItem
 */
var ChaptersTrackMenuItem = function (_MenuItem) {
  _inherits(ChaptersTrackMenuItem, _MenuItem);

  /**
   * Creates an instance of this class.
   *
   * @param {Player} player
   *        The `Player` that this class should be attached to.
   *
   * @param {Object} [options]
   *        The key/value store of player options.
   */
  function ChaptersTrackMenuItem(player, options) {
    _classCallCheck(this, ChaptersTrackMenuItem);

    var track = options.track;
    var cue = options.cue;
    var currentTime = player.currentTime();

    // Modify options for parent MenuItem class's init.
    options.selectable = true;
    options.label = cue.text;
    options.selected = cue.startTime <= currentTime && currentTime < cue.endTime;

    var _this = _possibleConstructorReturn(this, _MenuItem.call(this, player, options));

    _this.track = track;
    _this.cue = cue;
    track.addEventListener('cuechange', Fn.bind(_this, _this.update));
    return _this;
  }

  /**
   * This gets called when an `ChaptersTrackMenuItem` is "clicked". See
   * {@link ClickableComponent} for more detailed information on what a click can be.
   *
   * @param {EventTarget~Event} [event]
   *        The `keydown`, `tap`, or `click` event that caused this function to be
   *        called.
   *
   * @listens tap
   * @listens click
   */


  ChaptersTrackMenuItem.prototype.handleClick = function handleClick(event) {
    _MenuItem.prototype.handleClick.call(this);
    this.player_.currentTime(this.cue.startTime);
    this.update(this.cue.startTime);
  };

  /**
   * Update chapter menu item
   *
   * @param {EventTarget~Event} [event]
   *        The `cuechange` event that caused this function to run.
   *
   * @listens TextTrack#cuechange
   */


  ChaptersTrackMenuItem.prototype.update = function update(event) {
    var cue = this.cue;
    var currentTime = this.player_.currentTime();

    // vjs.log(currentTime, cue.startTime);
    this.selected(cue.startTime <= currentTime && currentTime < cue.endTime);
  };

  return ChaptersTrackMenuItem;
}(_menuItem2['default']);

_component2['default'].registerComponent('ChaptersTrackMenuItem', ChaptersTrackMenuItem);
exports['default'] = ChaptersTrackMenuItem;

},{"48":48,"5":5,"83":83}],27:[function(_dereq_,module,exports){
'use strict';

exports.__esModule = true;

var _textTrackButton = _dereq_(30);

var _textTrackButton2 = _interopRequireDefault(_textTrackButton);

var _component = _dereq_(5);

var _component2 = _interopRequireDefault(_component);

var _fn = _dereq_(83);

var Fn = _interopRequireWildcard(_fn);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * @file descriptions-button.js
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                */


/**
 * The button component for toggling and selecting descriptions
 *
 * @extends TextTrackButton
 */
var DescriptionsButton = function (_TextTrackButton) {
  _inherits(DescriptionsButton, _TextTrackButton);

  /**
   * Creates an instance of this class.
   *
   * @param {Player} player
   *        The `Player` that this class should be attached to.
   *
   * @param {Object} [options]
   *        The key/value store of player options.
   *
   * @param {Component~ReadyCallback} [ready]
   *        The function to call when this component is ready.
   */
  function DescriptionsButton(player, options, ready) {
    _classCallCheck(this, DescriptionsButton);

    var _this = _possibleConstructorReturn(this, _TextTrackButton.call(this, player, options, ready));

    _this.el_.setAttribute('aria-label', 'Descriptions Menu');

    var tracks = player.textTracks();

    if (tracks) {
      var changeHandler = Fn.bind(_this, _this.handleTracksChange);

      tracks.addEventListener('change', changeHandler);
      _this.on('dispose', function () {
        tracks.removeEventListener('change', changeHandler);
      });
    }
    return _this;
  }

  /**
   * Handle text track change
   *
   * @param {EventTarget~Event} event
   *        The event that caused this function to run
   *
   * @listens TextTrackList#change
   */


  DescriptionsButton.prototype.handleTracksChange = function handleTracksChange(event) {
    var tracks = this.player().textTracks();
    var disabled = false;

    // Check whether a track of a different kind is showing
    for (var i = 0, l = tracks.length; i < l; i++) {
      var track = tracks[i];

      if (track.kind !== this.kind_ && track.mode === 'showing') {
        disabled = true;
        break;
      }
    }

    // If another track is showing, disable this menu button
    if (disabled) {
      this.disable();
    } else {
      this.enable();
    }
  };

  /**
   * Builds the default DOM `className`.
   *
   * @return {string}
   *         The DOM `className` for this object.
   */


  DescriptionsButton.prototype.buildCSSClass = function buildCSSClass() {
    return 'vjs-descriptions-button ' + _TextTrackButton.prototype.buildCSSClass.call(this);
  };

  return DescriptionsButton;
}(_textTrackButton2['default']);

/**
 * `kind` of TextTrack to look for to associate it with this menu.
 *
 * @type {string}
 * @private
 */


DescriptionsButton.prototype.kind_ = 'descriptions';

/**
 * The text that should display over the `DescriptionsButton`s controls. Added for localization.
 *
 * @type {string}
 * @private
 */
DescriptionsButton.prototype.controlText_ = 'Descriptions';

_component2['default'].registerComponent('DescriptionsButton', DescriptionsButton);
exports['default'] = DescriptionsButton;

},{"30":30,"5":5,"83":83}],28:[function(_dereq_,module,exports){
'use strict';

exports.__esModule = true;

var _textTrackMenuItem = _dereq_(31);

var _textTrackMenuItem2 = _interopRequireDefault(_textTrackMenuItem);

var _component = _dereq_(5);

var _component2 = _interopRequireDefault(_component);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * @file off-text-track-menu-item.js
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                */


/**
 * A special menu item for turning of a specific type of text track
 *
 * @extends TextTrackMenuItem
 */
var OffTextTrackMenuItem = function (_TextTrackMenuItem) {
  _inherits(OffTextTrackMenuItem, _TextTrackMenuItem);

  /**
   * Creates an instance of this class.
   *
   * @param {Player} player
   *        The `Player` that this class should be attached to.
   *
   * @param {Object} [options]
   *        The key/value store of player options.
   */
  function OffTextTrackMenuItem(player, options) {
    _classCallCheck(this, OffTextTrackMenuItem);

    // Create pseudo track info
    // Requires options['kind']
    options.track = {
      player: player,
      kind: options.kind,
      label: options.kind + ' off',
      'default': false,
      mode: 'disabled'
    };

    // MenuItem is selectable
    options.selectable = true;

    var _this = _possibleConstructorReturn(this, _TextTrackMenuItem.call(this, player, options));

    _this.selected(true);
    return _this;
  }

  /**
   * Handle text track change
   *
   * @param {EventTarget~Event} event
   *        The event that caused this function to run
   */


  OffTextTrackMenuItem.prototype.handleTracksChange = function handleTracksChange(event) {
    var tracks = this.player().textTracks();
    var selected = true;

    for (var i = 0, l = tracks.length; i < l; i++) {
      var track = tracks[i];

      if (track.kind === this.track.kind && track.mode === 'showing') {
        selected = false;
        break;
      }
    }

    this.selected(selected);
  };

  return OffTextTrackMenuItem;
}(_textTrackMenuItem2['default']);

_component2['default'].registerComponent('OffTextTrackMenuItem', OffTextTrackMenuItem);
exports['default'] = OffTextTrackMenuItem;

},{"31":31,"5":5}],29:[function(_dereq_,module,exports){
'use strict';

exports.__esModule = true;

var _textTrackButton = _dereq_(30);

var _textTrackButton2 = _interopRequireDefault(_textTrackButton);

var _component = _dereq_(5);

var _component2 = _interopRequireDefault(_component);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * @file subtitles-button.js
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                */


/**
 * The button component for toggling and selecting subtitles
 *
 * @extends TextTrackButton
 */
var SubtitlesButton = function (_TextTrackButton) {
  _inherits(SubtitlesButton, _TextTrackButton);

  /**
   * Creates an instance of this class.
   *
   * @param {Player} player
   *        The `Player` that this class should be attached to.
   *
   * @param {Object} [options]
   *        The key/value store of player options.
   *
   * @param {Component~ReadyCallback} [ready]
   *        The function to call when this component is ready.
   */
  function SubtitlesButton(player, options, ready) {
    _classCallCheck(this, SubtitlesButton);

    var _this = _possibleConstructorReturn(this, _TextTrackButton.call(this, player, options, ready));

    _this.el_.setAttribute('aria-label', 'Subtitles Menu');
    return _this;
  }

  /**
   * Builds the default DOM `className`.
   *
   * @return {string}
   *         The DOM `className` for this object.
   */


  SubtitlesButton.prototype.buildCSSClass = function buildCSSClass() {
    return 'vjs-subtitles-button ' + _TextTrackButton.prototype.buildCSSClass.call(this);
  };

  return SubtitlesButton;
}(_textTrackButton2['default']);

/**
 * `kind` of TextTrack to look for to associate it with this menu.
 *
 * @type {string}
 * @private
 */


SubtitlesButton.prototype.kind_ = 'subtitles';

/**
 * The text that should display over the `SubtitlesButton`s controls. Added for localization.
 *
 * @type {string}
 * @private
 */
SubtitlesButton.prototype.controlText_ = 'Subtitles';

_component2['default'].registerComponent('SubtitlesButton', SubtitlesButton);
exports['default'] = SubtitlesButton;

},{"30":30,"5":5}],30:[function(_dereq_,module,exports){
'use strict';

exports.__esModule = true;

var _trackButton = _dereq_(36);

var _trackButton2 = _interopRequireDefault(_trackButton);

var _component = _dereq_(5);

var _component2 = _interopRequireDefault(_component);

var _textTrackMenuItem = _dereq_(31);

var _textTrackMenuItem2 = _interopRequireDefault(_textTrackMenuItem);

var _offTextTrackMenuItem = _dereq_(28);

var _offTextTrackMenuItem2 = _interopRequireDefault(_offTextTrackMenuItem);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * @file text-track-button.js
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                */


/**
 * The base class for buttons that toggle specific text track types (e.g. subtitles)
 *
 * @extends MenuButton
 */
var TextTrackButton = function (_TrackButton) {
  _inherits(TextTrackButton, _TrackButton);

  /**
   * Creates an instance of this class.
   *
   * @param {Player} player
   *        The `Player` that this class should be attached to.
   *
   * @param {Object} [options={}]
   *        The key/value store of player options.
   */
  function TextTrackButton(player) {
    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    _classCallCheck(this, TextTrackButton);

    options.tracks = player.textTracks();

    return _possibleConstructorReturn(this, _TrackButton.call(this, player, options));
  }

  /**
   * Create a menu item for each text track
   *
   * @param {TextTrackMenuItem[]} [items=[]]
   *        Existing array of items to use during creation
   *
   * @return {TextTrackMenuItem[]}
   *         Array of menu items that were created
   */


  TextTrackButton.prototype.createItems = function createItems() {
    var items = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];

    // Add an OFF menu item to turn all tracks off
    items.push(new _offTextTrackMenuItem2['default'](this.player_, { kind: this.kind_ }));
    this.hideThreshold_ += 1;

    var tracks = this.player_.textTracks();

    if (!tracks) {
      return items;
    }

    for (var i = 0; i < tracks.length; i++) {
      var track = tracks[i];

      // only add tracks that are of the appropriate kind and have a label
      if (track.kind === this.kind_) {
        items.push(new _textTrackMenuItem2['default'](this.player_, {
          track: track,
          // MenuItem is selectable
          selectable: true
        }));
      }
    }

    return items;
  };

  return TextTrackButton;
}(_trackButton2['default']);

_component2['default'].registerComponent('TextTrackButton', TextTrackButton);
exports['default'] = TextTrackButton;

},{"28":28,"31":31,"36":36,"5":5}],31:[function(_dereq_,module,exports){
'use strict';

exports.__esModule = true;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _menuItem = _dereq_(48);

var _menuItem2 = _interopRequireDefault(_menuItem);

var _component = _dereq_(5);

var _component2 = _interopRequireDefault(_component);

var _fn = _dereq_(83);

var Fn = _interopRequireWildcard(_fn);

var _window = _dereq_(95);

var _window2 = _interopRequireDefault(_window);

var _document = _dereq_(94);

var _document2 = _interopRequireDefault(_document);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * @file text-track-menu-item.js
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                */


/**
 * The specific menu item type for selecting a language within a text track kind
 *
 * @extends MenuItem
 */
var TextTrackMenuItem = function (_MenuItem) {
  _inherits(TextTrackMenuItem, _MenuItem);

  /**
   * Creates an instance of this class.
   *
   * @param {Player} player
   *        The `Player` that this class should be attached to.
   *
   * @param {Object} [options]
   *        The key/value store of player options.
   */
  function TextTrackMenuItem(player, options) {
    _classCallCheck(this, TextTrackMenuItem);

    var track = options.track;
    var tracks = player.textTracks();

    // Modify options for parent MenuItem class's init.
    options.label = track.label || track.language || 'Unknown';
    options.selected = track['default'] || track.mode === 'showing';

    var _this = _possibleConstructorReturn(this, _MenuItem.call(this, player, options));

    _this.track = track;

    if (tracks) {
      var changeHandler = Fn.bind(_this, _this.handleTracksChange);

      player.on(['loadstart', 'texttrackchange'], changeHandler);
      tracks.addEventListener('change', changeHandler);
      _this.on('dispose', function () {
        tracks.removeEventListener('change', changeHandler);
      });
    }

    // iOS7 doesn't dispatch change events to TextTrackLists when an
    // associated track's mode changes. Without something like
    // Object.observe() (also not present on iOS7), it's not
    // possible to detect changes to the mode attribute and polyfill
    // the change event. As a poor substitute, we manually dispatch
    // change events whenever the controls modify the mode.
    if (tracks && tracks.onchange === undefined) {
      var event = void 0;

      _this.on(['tap', 'click'], function () {
        if (_typeof(_window2['default'].Event) !== 'object') {
          // Android 2.3 throws an Illegal Constructor error for window.Event
          try {
            event = new _window2['default'].Event('change');
          } catch (err) {
            // continue regardless of error
          }
        }

        if (!event) {
          event = _document2['default'].createEvent('Event');
          event.initEvent('change', true, true);
        }

        tracks.dispatchEvent(event);
      });
    }
    return _this;
  }

  /**
   * This gets called when an `TextTrackMenuItem` is "clicked". See
   * {@link ClickableComponent} for more detailed information on what a click can be.
   *
   * @param {EventTarget~Event} event
   *        The `keydown`, `tap`, or `click` event that caused this function to be
   *        called.
   *
   * @listens tap
   * @listens click
   */


  TextTrackMenuItem.prototype.handleClick = function handleClick(event) {
    var kind = this.track.kind;
    var tracks = this.player_.textTracks();

    _MenuItem.prototype.handleClick.call(this, event);

    if (!tracks) {
      return;
    }

    for (var i = 0; i < tracks.length; i++) {
      var track = tracks[i];

      if (track.kind !== kind) {
        continue;
      }

      if (track === this.track) {
        if (track.mode !== 'showing') {
          track.mode = 'showing';
        }
      } else if (track.mode !== 'disabled') {
        track.mode = 'disabled';
      }
    }
  };

  /**
   * Handle text track list change
   *
   * @param {EventTarget~Event} event
   *        The `change` event that caused this function to be called.
   *
   * @listens TextTrackList#change
   */


  TextTrackMenuItem.prototype.handleTracksChange = function handleTracksChange(event) {
    this.selected(this.track.mode === 'showing');
  };

  return TextTrackMenuItem;
}(_menuItem2['default']);

_component2['default'].registerComponent('TextTrackMenuItem', TextTrackMenuItem);
exports['default'] = TextTrackMenuItem;

},{"48":48,"5":5,"83":83,"94":94,"95":95}],32:[function(_dereq_,module,exports){
'use strict';

exports.__esModule = true;

var _component = _dereq_(5);

var _component2 = _interopRequireDefault(_component);

var _dom = _dereq_(81);

var Dom = _interopRequireWildcard(_dom);

var _formatTime = _dereq_(84);

var _formatTime2 = _interopRequireDefault(_formatTime);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * @file current-time-display.js
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                */


/**
 * Displays the current time
 *
 * @extends Component
 */
var CurrentTimeDisplay = function (_Component) {
  _inherits(CurrentTimeDisplay, _Component);

  /**
   * Creates an instance of this class.
   *
   * @param {Player} player
   *        The `Player` that this class should be attached to.
   *
   * @param {Object} [options]
   *        The key/value store of player options.
   */
  function CurrentTimeDisplay(player, options) {
    _classCallCheck(this, CurrentTimeDisplay);

    var _this = _possibleConstructorReturn(this, _Component.call(this, player, options));

    _this.on(player, 'timeupdate', _this.updateContent);
    return _this;
  }

  /**
   * Create the `Component`'s DOM element
   *
   * @return {Element}
   *         The element that was created.
   */


  CurrentTimeDisplay.prototype.createEl = function createEl() {
    var el = _Component.prototype.createEl.call(this, 'div', {
      className: 'vjs-current-time vjs-time-control vjs-control'
    });

    this.contentEl_ = Dom.createEl('div', {
      className: 'vjs-current-time-display',
      // label the current time for screen reader users
      innerHTML: '<span class="vjs-control-text">Current Time </span>' + '0:00'
    }, {
      // tell screen readers not to automatically read the time as it changes
      'aria-live': 'off'
    });

    el.appendChild(this.contentEl_);
    return el;
  };

  /**
   * Update current time display
   *
   * @param {EventTarget~Event} [event]
   *        The `timeupdate` event that caused this function to run.
   *
   * @listens Player#timeupdate
   */


  CurrentTimeDisplay.prototype.updateContent = function updateContent(event) {
    // Allows for smooth scrubbing, when player can't keep up.
    var time = this.player_.scrubbing() ? this.player_.getCache().currentTime : this.player_.currentTime();
    var localizedText = this.localize('Current Time');
    var formattedTime = (0, _formatTime2['default'])(time, this.player_.duration());

    if (formattedTime !== this.formattedTime_) {
      this.formattedTime_ = formattedTime;
      this.contentEl_.innerHTML = '<span class="vjs-control-text">' + localizedText + '</span> ' + formattedTime;
    }
  };

  return CurrentTimeDisplay;
}(_component2['default']);

_component2['default'].registerComponent('CurrentTimeDisplay', CurrentTimeDisplay);
exports['default'] = CurrentTimeDisplay;

},{"5":5,"81":81,"84":84}],33:[function(_dereq_,module,exports){
'use strict';

exports.__esModule = true;

var _component = _dereq_(5);

var _component2 = _interopRequireDefault(_component);

var _dom = _dereq_(81);

var Dom = _interopRequireWildcard(_dom);

var _formatTime = _dereq_(84);

var _formatTime2 = _interopRequireDefault(_formatTime);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * @file duration-display.js
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                */


/**
 * Displays the duration
 *
 * @extends Component
 */
var DurationDisplay = function (_Component) {
  _inherits(DurationDisplay, _Component);

  /**
   * Creates an instance of this class.
   *
   * @param {Player} player
   *        The `Player` that this class should be attached to.
   *
   * @param {Object} [options]
   *        The key/value store of player options.
   */
  function DurationDisplay(player, options) {
    _classCallCheck(this, DurationDisplay);

    var _this = _possibleConstructorReturn(this, _Component.call(this, player, options));

    _this.on(player, 'durationchange', _this.updateContent);

    // Also listen for timeupdate and loadedmetadata because removing those
    // listeners could have broken dependent applications/libraries. These
    // can likely be removed for 6.0.
    _this.on(player, 'timeupdate', _this.updateContent);
    _this.on(player, 'loadedmetadata', _this.updateContent);
    return _this;
  }

  /**
   * Create the `Component`'s DOM element
   *
   * @return {Element}
   *         The element that was created.
   */


  DurationDisplay.prototype.createEl = function createEl() {
    var el = _Component.prototype.createEl.call(this, 'div', {
      className: 'vjs-duration vjs-time-control vjs-control'
    });

    this.contentEl_ = Dom.createEl('div', {
      className: 'vjs-duration-display',
      // label the duration time for screen reader users
      innerHTML: '<span class="vjs-control-text">' + this.localize('Duration Time') + '</span> 0:00'
    }, {
      // tell screen readers not to automatically read the time as it changes
      'aria-live': 'off'
    });

    el.appendChild(this.contentEl_);
    return el;
  };

  /**
   * Update duration time display.
   *
   * @param {EventTarget~Event} [event]
   *        The `durationchange`, `timeupdate`, or `loadedmetadata` event that caused
   *        this function to be called.
   *
   * @listens Player#durationchange
   * @listens Player#timeupdate
   * @listens Player#loadedmetadata
   */


  DurationDisplay.prototype.updateContent = function updateContent(event) {
    var duration = this.player_.duration();

    if (duration && this.duration_ !== duration) {
      this.duration_ = duration;
      var localizedText = this.localize('Duration Time');
      var formattedTime = (0, _formatTime2['default'])(duration);

      // label the duration time for screen reader users
      this.contentEl_.innerHTML = '<span class="vjs-control-text">' + localizedText + '</span> ' + formattedTime;
    }
  };

  return DurationDisplay;
}(_component2['default']);

_component2['default'].registerComponent('DurationDisplay', DurationDisplay);
exports['default'] = DurationDisplay;

},{"5":5,"81":81,"84":84}],34:[function(_dereq_,module,exports){
'use strict';

exports.__esModule = true;

var _component = _dereq_(5);

var _component2 = _interopRequireDefault(_component);

var _dom = _dereq_(81);

var Dom = _interopRequireWildcard(_dom);

var _formatTime = _dereq_(84);

var _formatTime2 = _interopRequireDefault(_formatTime);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * @file remaining-time-display.js
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                */


/**
 * Displays the time left in the video
 *
 * @extends Component
 */
var RemainingTimeDisplay = function (_Component) {
  _inherits(RemainingTimeDisplay, _Component);

  /**
   * Creates an instance of this class.
   *
   * @param {Player} player
   *        The `Player` that this class should be attached to.
   *
   * @param {Object} [options]
   *        The key/value store of player options.
   */
  function RemainingTimeDisplay(player, options) {
    _classCallCheck(this, RemainingTimeDisplay);

    var _this = _possibleConstructorReturn(this, _Component.call(this, player, options));

    _this.on(player, 'timeupdate', _this.updateContent);
    _this.on(player, 'durationchange', _this.updateContent);
    return _this;
  }

  /**
   * Create the `Component`'s DOM element
   *
   * @return {Element}
   *         The element that was created.
   */


  RemainingTimeDisplay.prototype.createEl = function createEl() {
    var el = _Component.prototype.createEl.call(this, 'div', {
      className: 'vjs-remaining-time vjs-time-control vjs-control'
    });

    this.contentEl_ = Dom.createEl('div', {
      className: 'vjs-remaining-time-display',
      // label the remaining time for screen reader users
      innerHTML: '<span class="vjs-control-text">' + this.localize('Remaining Time') + '</span> -0:00'
    }, {
      // tell screen readers not to automatically read the time as it changes
      'aria-live': 'off'
    });

    el.appendChild(this.contentEl_);
    return el;
  };

  /**
   * Update remaining time display.
   *
   * @param {EventTarget~Event} [event]
   *        The `timeupdate` or `durationchange` event that caused this to run.
   *
   * @listens Player#timeupdate
   * @listens Player#durationchange
   */


  RemainingTimeDisplay.prototype.updateContent = function updateContent(event) {
    if (this.player_.duration()) {
      var localizedText = this.localize('Remaining Time');
      var formattedTime = (0, _formatTime2['default'])(this.player_.remainingTime());

      if (formattedTime !== this.formattedTime_) {
        this.formattedTime_ = formattedTime;
        this.contentEl_.innerHTML = '<span class="vjs-control-text">' + localizedText + '</span> -' + formattedTime;
      }
    }

    // Allows for smooth scrubbing, when player can't keep up.
    // var time = (this.player_.scrubbing()) ? this.player_.getCache().currentTime : this.player_.currentTime();
    // this.contentEl_.innerHTML = vjs.formatTime(time, this.player_.duration());
  };

  return RemainingTimeDisplay;
}(_component2['default']);

_component2['default'].registerComponent('RemainingTimeDisplay', RemainingTimeDisplay);
exports['default'] = RemainingTimeDisplay;

},{"5":5,"81":81,"84":84}],35:[function(_dereq_,module,exports){
'use strict';

exports.__esModule = true;

var _component = _dereq_(5);

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

},{"5":5}],36:[function(_dereq_,module,exports){
'use strict';

exports.__esModule = true;

var _menuButton = _dereq_(47);

var _menuButton2 = _interopRequireDefault(_menuButton);

var _component = _dereq_(5);

var _component2 = _interopRequireDefault(_component);

var _fn = _dereq_(83);

var Fn = _interopRequireWildcard(_fn);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * @file track-button.js
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                */


/**
 * The base class for buttons that toggle specific  track types (e.g. subtitles).
 *
 * @extends MenuButton
 */
var TrackButton = function (_MenuButton) {
  _inherits(TrackButton, _MenuButton);

  /**
   * Creates an instance of this class.
   *
   * @param {Player} player
   *        The `Player` that this class should be attached to.
   *
   * @param {Object} [options]
   *        The key/value store of player options.
   */
  function TrackButton(player, options) {
    _classCallCheck(this, TrackButton);

    var tracks = options.tracks;

    var _this = _possibleConstructorReturn(this, _MenuButton.call(this, player, options));

    if (_this.items.length <= 1) {
      _this.hide();
    }

    if (!tracks) {
      return _possibleConstructorReturn(_this);
    }

    var updateHandler = Fn.bind(_this, _this.update);

    tracks.addEventListener('removetrack', updateHandler);
    tracks.addEventListener('addtrack', updateHandler);

    _this.player_.on('dispose', function () {
      tracks.removeEventListener('removetrack', updateHandler);
      tracks.removeEventListener('addtrack', updateHandler);
    });
    return _this;
  }

  return TrackButton;
}(_menuButton2['default']);

_component2['default'].registerComponent('TrackButton', TrackButton);
exports['default'] = TrackButton;

},{"47":47,"5":5,"83":83}],37:[function(_dereq_,module,exports){
'use strict';

exports.__esModule = true;

var _slider = _dereq_(57);

var _slider2 = _interopRequireDefault(_slider);

var _component = _dereq_(5);

var _component2 = _interopRequireDefault(_component);

var _fn = _dereq_(83);

var Fn = _interopRequireWildcard(_fn);

_dereq_(39);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * @file volume-bar.js
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                */


// Required children


/**
 * The bar that contains the volume level and can be clicked on to adjust the level
 *
 * @extends Slider
 */
var VolumeBar = function (_Slider) {
  _inherits(VolumeBar, _Slider);

  /**
   * Creates an instance of this class.
   *
   * @param {Player} player
   *        The `Player` that this class should be attached to.
   *
   * @param {Object} [options]
   *        The key/value store of player options.
   */
  function VolumeBar(player, options) {
    _classCallCheck(this, VolumeBar);

    var _this = _possibleConstructorReturn(this, _Slider.call(this, player, options));

    _this.on(player, 'volumechange', _this.updateARIAAttributes);
    player.ready(Fn.bind(_this, _this.updateARIAAttributes));
    return _this;
  }

  /**
   * Create the `Component`'s DOM element
   *
   * @return {Element}
   *         The element that was created.
   */


  VolumeBar.prototype.createEl = function createEl() {
    return _Slider.prototype.createEl.call(this, 'div', {
      className: 'vjs-volume-bar vjs-slider-bar'
    }, {
      'aria-label': 'volume level'
    });
  };

  /**
   * Handle movement events on the {@link VolumeMenuButton}.
   *
   * @param {EventTarget~Event} event
   *        The event that caused this function to run.
   *
   * @listens mousemove
   */


  VolumeBar.prototype.handleMouseMove = function handleMouseMove(event) {
    this.checkMuted();
    this.player_.volume(this.calculateDistance(event));
  };

  /**
   * If the player is muted unmute it.
   */


  VolumeBar.prototype.checkMuted = function checkMuted() {
    if (this.player_.muted()) {
      this.player_.muted(false);
    }
  };

  /**
   * Get percent of volume level
   *
   * @return {number}
   *         Volume level percent as a decimal number.
   */


  VolumeBar.prototype.getPercent = function getPercent() {
    if (this.player_.muted()) {
      return 0;
    }
    return this.player_.volume();
  };

  /**
   * Increase volume level for keyboard users
   */


  VolumeBar.prototype.stepForward = function stepForward() {
    this.checkMuted();
    this.player_.volume(this.player_.volume() + 0.1);
  };

  /**
   * Decrease volume level for keyboard users
   */


  VolumeBar.prototype.stepBack = function stepBack() {
    this.checkMuted();
    this.player_.volume(this.player_.volume() - 0.1);
  };

  /**
   * Update ARIA accessibility attributes
   *
   * @param {EventTarget~Event} [event]
   *        The `volumechange` event that caused this function to run.
   *
   * @listens Player#volumechange
   */


  VolumeBar.prototype.updateARIAAttributes = function updateARIAAttributes(event) {
    // Current value of volume bar as a percentage
    var volume = (this.player_.volume() * 100).toFixed(2);

    this.el_.setAttribute('aria-valuenow', volume);
    this.el_.setAttribute('aria-valuetext', volume + '%');
  };

  return VolumeBar;
}(_slider2['default']);

/**
 * Default options for the `VolumeBar`
 *
 * @type {Object}
 * @private
 */


VolumeBar.prototype.options_ = {
  children: ['volumeLevel'],
  barName: 'volumeLevel'
};

/**
 * Call the update event for this Slider when this event happens on the player.
 *
 * @type {string}
 */
VolumeBar.prototype.playerEvent = 'volumechange';

_component2['default'].registerComponent('VolumeBar', VolumeBar);
exports['default'] = VolumeBar;

},{"39":39,"5":5,"57":57,"83":83}],38:[function(_dereq_,module,exports){
'use strict';

exports.__esModule = true;

var _component = _dereq_(5);

var _component2 = _interopRequireDefault(_component);

_dereq_(37);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * @file volume-control.js
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                */


// Required children


/**
 * The component for controlling the volume level
 *
 * @extends Component
 */
var VolumeControl = function (_Component) {
  _inherits(VolumeControl, _Component);

  /**
   * Creates an instance of this class.
   *
   * @param {Player} player
   *        The `Player` that this class should be attached to.
   *
   * @param {Object} [options={}]
   *        The key/value store of player options.
   */
  function VolumeControl(player, options) {
    _classCallCheck(this, VolumeControl);

    // hide volume controls when they're not supported by the current tech
    var _this = _possibleConstructorReturn(this, _Component.call(this, player, options));

    if (player.tech_ && player.tech_.featuresVolumeControl === false) {
      _this.addClass('vjs-hidden');
    }
    _this.on(player, 'loadstart', function () {
      if (player.tech_.featuresVolumeControl === false) {
        this.addClass('vjs-hidden');
      } else {
        this.removeClass('vjs-hidden');
      }
    });
    return _this;
  }

  /**
   * Create the `Component`'s DOM element
   *
   * @return {Element}
   *         The element that was created.
   */


  VolumeControl.prototype.createEl = function createEl() {
    return _Component.prototype.createEl.call(this, 'div', {
      className: 'vjs-volume-control vjs-control'
    });
  };

  return VolumeControl;
}(_component2['default']);

/**
 * Default options for the `VolumeControl`
 *
 * @type {Object}
 * @private
 */


VolumeControl.prototype.options_ = {
  children: ['volumeBar']
};

_component2['default'].registerComponent('VolumeControl', VolumeControl);
exports['default'] = VolumeControl;

},{"37":37,"5":5}],39:[function(_dereq_,module,exports){
'use strict';

exports.__esModule = true;

var _component = _dereq_(5);

var _component2 = _interopRequireDefault(_component);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * @file volume-level.js
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                */


/**
 * Shows volume level
 *
 * @extends Component
 */
var VolumeLevel = function (_Component) {
  _inherits(VolumeLevel, _Component);

  function VolumeLevel() {
    _classCallCheck(this, VolumeLevel);

    return _possibleConstructorReturn(this, _Component.apply(this, arguments));
  }

  /**
   * Create the `Component`'s DOM element
   *
   * @return {Element}
   *         The element that was created.
   */
  VolumeLevel.prototype.createEl = function createEl() {
    return _Component.prototype.createEl.call(this, 'div', {
      className: 'vjs-volume-level',
      innerHTML: '<span class="vjs-control-text"></span>'
    });
  };

  return VolumeLevel;
}(_component2['default']);

_component2['default'].registerComponent('VolumeLevel', VolumeLevel);
exports['default'] = VolumeLevel;

},{"5":5}],40:[function(_dereq_,module,exports){
'use strict';

exports.__esModule = true;

var _fn = _dereq_(83);

var Fn = _interopRequireWildcard(_fn);

var _component = _dereq_(5);

var _component2 = _interopRequireDefault(_component);

var _popup = _dereq_(54);

var _popup2 = _interopRequireDefault(_popup);

var _popupButton = _dereq_(53);

var _popupButton2 = _interopRequireDefault(_popupButton);

var _muteToggle = _dereq_(11);

var _muteToggle2 = _interopRequireDefault(_muteToggle);

var _volumeBar = _dereq_(37);

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

},{"11":11,"37":37,"5":5,"53":53,"54":54,"83":83}],41:[function(_dereq_,module,exports){
'use strict';

exports.__esModule = true;

var _component = _dereq_(5);

var _component2 = _interopRequireDefault(_component);

var _modalDialog = _dereq_(50);

var _modalDialog2 = _interopRequireDefault(_modalDialog);

var _mergeOptions = _dereq_(87);

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
  pauseOnOpen: false,
  fillAlways: true,
  temporary: false,
  uncloseable: true
});

_component2['default'].registerComponent('ErrorDisplay', ErrorDisplay);
exports['default'] = ErrorDisplay;

},{"5":5,"50":50,"87":87}],42:[function(_dereq_,module,exports){
'use strict';

exports.__esModule = true;

var _events = _dereq_(82);

var Events = _interopRequireWildcard(_events);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

/**
 * `EventTarget` is a class that can have the same API as the DOM `EventTarget`. It
 * adds shorthand functions that wrap around lengthy functions. For example:
 * the `on` function is a wrapper around `addEventListener`.
 *
 * @see [EventTarget Spec]{@link https://www.w3.org/TR/DOM-Level-2-Events/events.html#Events-EventTarget}
 * @class EventTarget
 */
var EventTarget = function EventTarget() {};

/**
 * A Custom DOM event.
 *
 * @typedef {Object} EventTarget~Event
 * @see [Properties]{@link https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent}
 */

/**
 * All event listeners should follow the following format.
 *
 * @callback EventTarget~EventListener
 * @this {EventTarget}
 *
 * @param {EventTarget~Event} event
 *        the event that triggered this function
 *
 * @param {Object} [hash]
 *        hash of data sent during the event
 */

/**
 * An object containing event names as keys and booleans as values.
 *
 * > NOTE: If an event name is set to a true value here {@link EventTarget#trigger}
 *         will have extra functionality. See that function for more information.
 *
 * @property EventTarget.prototype.allowedEvents_
 * @private
 */
/**
 * @file src/js/event-target.js
 */
EventTarget.prototype.allowedEvents_ = {};

/**
 * Adds an `event listener` to an instance of an `EventTarget`. An `event listener` is a
 * function that will get called when an event with a certain name gets triggered.
 *
 * @param {string|string[]} type
 *        An event name or an array of event names.
 *
 * @param {EventTarget~EventListener} fn
 *        The function to call with `EventTarget`s
 */
EventTarget.prototype.on = function (type, fn) {
  // Remove the addEventListener alias before calling Events.on
  // so we don't get into an infinite type loop
  var ael = this.addEventListener;

  this.addEventListener = function () {};
  Events.on(this, type, fn);
  this.addEventListener = ael;
};

/**
 * An alias of {@link EventTarget#on}. Allows `EventTarget` to mimic
 * the standard DOM API.
 *
 * @function
 * @see {@link EventTarget#on}
 */
EventTarget.prototype.addEventListener = EventTarget.prototype.on;

/**
 * Removes an `event listener` for a specific event from an instance of `EventTarget`.
 * This makes it so that the `event listener` will no longer get called when the
 * named event happens.
 *
 * @param {string|string[]} type
 *        An event name or an array of event names.
 *
 * @param {EventTarget~EventListener} fn
 *        The function to remove.
 */
EventTarget.prototype.off = function (type, fn) {
  Events.off(this, type, fn);
};

/**
 * An alias of {@link EventTarget#off}. Allows `EventTarget` to mimic
 * the standard DOM API.
 *
 * @function
 * @see {@link EventTarget#off}
 */
EventTarget.prototype.removeEventListener = EventTarget.prototype.off;

/**
 * This function will add an `event listener` that gets triggered only once. After the
 * first trigger it will get removed. This is like adding an `event listener`
 * with {@link EventTarget#on} that calls {@link EventTarget#off} on itself.
 *
 * @param {string|string[]} type
 *        An event name or an array of event names.
 *
 * @param {EventTarget~EventListener} fn
 *        The function to be called once for each event name.
 */
EventTarget.prototype.one = function (type, fn) {
  // Remove the addEventListener alialing Events.on
  // so we don't get into an infinite type loop
  var ael = this.addEventListener;

  this.addEventListener = function () {};
  Events.one(this, type, fn);
  this.addEventListener = ael;
};

/**
 * This function causes an event to happen. This will then cause any `event listeners`
 * that are waiting for that event, to get called. If there are no `event listeners`
 * for an event then nothing will happen.
 *
 * If the name of the `Event` that is being triggered is in `EventTarget.allowedEvents_`.
 * Trigger will also call the `on` + `uppercaseEventName` function.
 *
 * Example:
 * 'click' is in `EventTarget.allowedEvents_`, so, trigger will attempt to call
 * `onClick` if it exists.
 *
 * @param {string|EventTarget~Event|Object} event
 *        The name of the event, an `Event`, or an object with a key of type set to
 *        an event name.
 */
EventTarget.prototype.trigger = function (event) {
  var type = event.type || event;

  if (typeof event === 'string') {
    event = { type: type };
  }
  event = Events.fixEvent(event);

  if (this.allowedEvents_[type] && this['on' + type]) {
    this['on' + type](event);
  }

  Events.trigger(this, event);
};

/**
 * An alias of {@link EventTarget#trigger}. Allows `EventTarget` to mimic
 * the standard DOM API.
 *
 * @function
 * @see {@link EventTarget#trigger}
 */
EventTarget.prototype.dispatchEvent = EventTarget.prototype.trigger;

exports['default'] = EventTarget;

},{"82":82}],43:[function(_dereq_,module,exports){
'use strict';

exports.__esModule = true;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _log = _dereq_(86);

var _log2 = _interopRequireDefault(_log);

var _obj = _dereq_(88);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

/**
 * @file extend.js
 * @module extend
 */

/**
 * A combination of node inherits and babel's inherits (after transpile).
 * Both work the same but node adds `super_` to the subClass
 * and Bable adds the superClass as __proto__. Both seem useful.
 *
 * @param {Object} subClass
 *        The class to inherit to
 *
 * @param {Object} superClass
 *        The class to inherit from
 *
 * @private
 */
var _inherits = function _inherits(subClass, superClass) {
  if (typeof superClass !== 'function' && superClass !== null) {
    throw new TypeError('Super expression must either be null or a function, not ' + (typeof superClass === 'undefined' ? 'undefined' : _typeof(superClass)));
  }

  subClass.prototype = Object.create(superClass && superClass.prototype, {
    constructor: {
      value: subClass,
      enumerable: false,
      writable: true,
      configurable: true
    }
  });

  if (superClass) {
    // node
    subClass.super_ = superClass;
  }
};

/**
 * Function for subclassing using the same inheritance that
 * videojs uses internally
 *
 * @param {Object} superClass
 *        The class to inherit from
 *
 * @param {Object} [subClassMethods={}]
 *        The class to inherit to
 *
 * @return {Object}
 *         The new object with subClassMethods that inherited superClass.
 */
var extendFn = function extendFn(superClass) {
  var subClassMethods = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

  var subClass = function subClass() {
    superClass.apply(this, arguments);
  };

  var methods = {};

  if ((0, _obj.isObject)(subClassMethods)) {
    if (typeof subClassMethods.init === 'function') {
      _log2['default'].warn('Constructor logic via init() is deprecated; please use constructor() instead.');
      subClassMethods.constructor = subClassMethods.init;
    }
    if (subClassMethods.constructor !== Object.prototype.constructor) {
      subClass = subClassMethods.constructor;
    }
    methods = subClassMethods;
  } else if (typeof subClassMethods === 'function') {
    subClass = subClassMethods;
  }

  _inherits(subClass, superClass);

  // Extend subObj's prototype with functions and other properties from props
  for (var name in methods) {
    if (methods.hasOwnProperty(name)) {
      subClass.prototype[name] = methods[name];
    }
  }

  return subClass;
};

exports['default'] = extendFn;

},{"86":86,"88":88}],44:[function(_dereq_,module,exports){
'use strict';

exports.__esModule = true;

var _document = _dereq_(94);

var _document2 = _interopRequireDefault(_document);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

/**
 * Store the browser-specific methods for the fullscreen API.
 *
 * @type {Object}
 * @see [Specification]{@link https://fullscreen.spec.whatwg.org}
 * @see [Map Approach From Screenfull.js]{@link https://github.com/sindresorhus/screenfull.js}
 */
var FullscreenApi = {};

// browser API methods
/**
 * @file fullscreen-api.js
 * @module fullscreen-api
 * @private
 */
var apiMap = [['requestFullscreen', 'exitFullscreen', 'fullscreenElement', 'fullscreenEnabled', 'fullscreenchange', 'fullscreenerror'],
// WebKit
['webkitRequestFullscreen', 'webkitExitFullscreen', 'webkitFullscreenElement', 'webkitFullscreenEnabled', 'webkitfullscreenchange', 'webkitfullscreenerror'],
// Old WebKit (Safari 5.1)
['webkitRequestFullScreen', 'webkitCancelFullScreen', 'webkitCurrentFullScreenElement', 'webkitCancelFullScreen', 'webkitfullscreenchange', 'webkitfullscreenerror'],
// Mozilla
['mozRequestFullScreen', 'mozCancelFullScreen', 'mozFullScreenElement', 'mozFullScreenEnabled', 'mozfullscreenchange', 'mozfullscreenerror'],
// Microsoft
['msRequestFullscreen', 'msExitFullscreen', 'msFullscreenElement', 'msFullscreenEnabled', 'MSFullscreenChange', 'MSFullscreenError']];

var specApi = apiMap[0];
var browserApi = void 0;

// determine the supported set of functions
for (var i = 0; i < apiMap.length; i++) {
  // check for exitFullscreen function
  if (apiMap[i][1] in _document2['default']) {
    browserApi = apiMap[i];
    break;
  }
}

// map the browser API names to the spec API names
if (browserApi) {
  for (var _i = 0; _i < browserApi.length; _i++) {
    FullscreenApi[specApi[_i]] = browserApi[_i];
  }
}

exports['default'] = FullscreenApi;

},{"94":94}],45:[function(_dereq_,module,exports){
'use strict';

exports.__esModule = true;

var _component = _dereq_(5);

var _component2 = _interopRequireDefault(_component);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * @file loading-spinner.js
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                */


/**
 * A loading spinner for use during waiting/loading events.
 *
 * @extends Component
 */
var LoadingSpinner = function (_Component) {
  _inherits(LoadingSpinner, _Component);

  function LoadingSpinner() {
    _classCallCheck(this, LoadingSpinner);

    return _possibleConstructorReturn(this, _Component.apply(this, arguments));
  }

  /**
   * Create the `LoadingSpinner`s DOM element.
   *
   * @return {Element}
   *         The dom element that gets created.
   */
  LoadingSpinner.prototype.createEl = function createEl() {
    return _Component.prototype.createEl.call(this, 'div', {
      className: 'vjs-loading-spinner',
      dir: 'ltr'
    });
  };

  return LoadingSpinner;
}(_component2['default']);

_component2['default'].registerComponent('LoadingSpinner', LoadingSpinner);
exports['default'] = LoadingSpinner;

},{"5":5}],46:[function(_dereq_,module,exports){
'use strict';

exports.__esModule = true;

var _obj = _dereq_(88);

/**
 * A Custom `MediaError` class which mimics the standard HTML5 `MediaError` class.
 *
 * @param {number|string|Object|MediaError} value
 *        This can be of multiple types:
 *        - number: should be a standard error code
 *        - string: an error message (the code will be 0)
 *        - Object: arbitrary properties
 *        - `MediaError` (native): used to populate a video.js `MediaError` object
 *        - `MediaError` (video.js): will return itself if it's already a
 *          video.js `MediaError` object.
 *
 * @see [MediaError Spec]{@link https://dev.w3.org/html5/spec-author-view/video.html#mediaerror}
 * @see [Encrypted MediaError Spec]{@link https://www.w3.org/TR/2013/WD-encrypted-media-20130510/#error-codes}
 *
 * @class MediaError
 */
function MediaError(value) {

  // Allow redundant calls to this constructor to avoid having `instanceof`
  // checks peppered around the code.
  if (value instanceof MediaError) {
    return value;
  }

  if (typeof value === 'number') {
    this.code = value;
  } else if (typeof value === 'string') {
    // default code is zero, so this is a custom error
    this.message = value;
  } else if ((0, _obj.isObject)(value)) {

    // We assign the `code` property manually because native `MediaError` objects
    // do not expose it as an own/enumerable property of the object.
    if (typeof value.code === 'number') {
      this.code = value.code;
    }

    (0, _obj.assign)(this, value);
  }

  if (!this.message) {
    this.message = MediaError.defaultMessages[this.code] || '';
  }
}

/**
 * The error code that refers two one of the defined `MediaError` types
 *
 * @type {Number}
 */
/**
 * @file media-error.js
 */
MediaError.prototype.code = 0;

/**
 * An optional message that to show with the error. Message is not part of the HTML5
 * video spec but allows for more informative custom errors.
 *
 * @type {String}
 */
MediaError.prototype.message = '';

/**
 * An optional status code that can be set by plugins to allow even more detail about
 * the error. For example a plugin might provide a specific HTTP status code and an
 * error message for that code. Then when the plugin gets that error this class will
 * know how to display an error message for it. This allows a custom message to show
 * up on the `Player` error overlay.
 *
 * @type {Array}
 */
MediaError.prototype.status = null;

/**
 * Errors indexed by the W3C standard. The order **CANNOT CHANGE**! See the
 * specification listed under {@link MediaError} for more information.
 *
 * @enum {array}
 * @readonly
 * @property {string} 0 - MEDIA_ERR_CUSTOM
 * @property {string} 1 - MEDIA_ERR_CUSTOM
 * @property {string} 2 - MEDIA_ERR_ABORTED
 * @property {string} 3 - MEDIA_ERR_NETWORK
 * @property {string} 4 - MEDIA_ERR_SRC_NOT_SUPPORTED
 * @property {string} 5 - MEDIA_ERR_ENCRYPTED
 */
MediaError.errorTypes = ['MEDIA_ERR_CUSTOM', 'MEDIA_ERR_ABORTED', 'MEDIA_ERR_NETWORK', 'MEDIA_ERR_DECODE', 'MEDIA_ERR_SRC_NOT_SUPPORTED', 'MEDIA_ERR_ENCRYPTED'];

/**
 * The default `MediaError` messages based on the {@link MediaError.errorTypes}.
 *
 * @type {Array}
 * @constant
 */
MediaError.defaultMessages = {
  1: 'You aborted the media playback',
  2: 'A network error caused the media download to fail part-way.',
  3: 'The media playback was aborted due to a corruption problem or because the media used features your browser did not support.',
  4: 'The media could not be loaded, either because the server or network failed or because the format is not supported.',
  5: 'The media is encrypted and we do not have the keys to decrypt it.'
};

// Add types as properties on MediaError
// e.g. MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED = 4;
for (var errNum = 0; errNum < MediaError.errorTypes.length; errNum++) {
  MediaError[MediaError.errorTypes[errNum]] = errNum;
  // values should be accessible on both the class and instance
  MediaError.prototype[MediaError.errorTypes[errNum]] = errNum;
}

// jsdocs for instance/static members added above
// instance methods use `#` and static methods use `.`
/**
 * W3C error code for any custom error.
 *
 * @member MediaError#MEDIA_ERR_CUSTOM
 * @constant {number}
 * @default 0
 */
/**
 * W3C error code for any custom error.
 *
 * @member MediaError.MEDIA_ERR_CUSTOM
 * @constant {number}
 * @default 0
 */

/**
 * W3C error code for media error aborted.
 *
 * @member MediaError#MEDIA_ERR_ABORTED
 * @constant {number}
 * @default 1
 */
/**
 * W3C error code for media error aborted.
 *
 * @member MediaError.MEDIA_ERR_ABORTED
 * @constant {number}
 * @default 1
 */

/**
 * W3C error code for any network error.
 *
 * @member MediaError#MEDIA_ERR_NETWORK
 * @constant {number}
 * @default 2
 */
/**
 * W3C error code for any network error.
 *
 * @member MediaError.MEDIA_ERR_NETWORK
 * @constant {number}
 * @default 2
 */

/**
 * W3C error code for any decoding error.
 *
 * @member MediaError#MEDIA_ERR_DECODE
 * @constant {number}
 * @default 3
 */
/**
 * W3C error code for any decoding error.
 *
 * @member MediaError.MEDIA_ERR_DECODE
 * @constant {number}
 * @default 3
 */

/**
 * W3C error code for any time that a source is not supported.
 *
 * @member MediaError#MEDIA_ERR_SRC_NOT_SUPPORTED
 * @constant {number}
 * @default 4
 */
/**
 * W3C error code for any time that a source is not supported.
 *
 * @member MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED
 * @constant {number}
 * @default 4
 */

/**
 * W3C error code for any time that a source is encrypted.
 *
 * @member MediaError#MEDIA_ERR_ENCRYPTED
 * @constant {number}
 * @default 5
 */
/**
 * W3C error code for any time that a source is encrypted.
 *
 * @member MediaError.MEDIA_ERR_ENCRYPTED
 * @constant {number}
 * @default 5
 */

exports['default'] = MediaError;

},{"88":88}],47:[function(_dereq_,module,exports){
'use strict';

exports.__esModule = true;

var _clickableComponent = _dereq_(3);

var _clickableComponent2 = _interopRequireDefault(_clickableComponent);

var _component = _dereq_(5);

var _component2 = _interopRequireDefault(_component);

var _menu = _dereq_(49);

var _menu2 = _interopRequireDefault(_menu);

var _dom = _dereq_(81);

var Dom = _interopRequireWildcard(_dom);

var _fn = _dereq_(83);

var Fn = _interopRequireWildcard(_fn);

var _toTitleCase = _dereq_(91);

var _toTitleCase2 = _interopRequireDefault(_toTitleCase);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * @file menu-button.js
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                */


/**
 * A `MenuButton` class for any popup {@link Menu}.
 *
 * @extends ClickableComponent
 */
var MenuButton = function (_ClickableComponent) {
  _inherits(MenuButton, _ClickableComponent);

  /**
   * Creates an instance of this class.
   *
   * @param {Player} player
   *        The `Player` that this class should be attached to.
   *
   * @param {Object} [options={}]
   *        The key/value store of player options.
   */
  function MenuButton(player) {
    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    _classCallCheck(this, MenuButton);

    var _this = _possibleConstructorReturn(this, _ClickableComponent.call(this, player, options));

    _this.update();

    _this.enabled_ = true;

    _this.el_.setAttribute('aria-haspopup', 'true');
    _this.el_.setAttribute('role', 'menuitem');
    _this.on('keydown', _this.handleSubmenuKeyPress);
    return _this;
  }

  /**
   * Update the menu based on the current state of its items.
   */


  MenuButton.prototype.update = function update() {
    var menu = this.createMenu();

    if (this.menu) {
      this.removeChild(this.menu);
    }

    this.menu = menu;
    this.addChild(menu);

    /**
     * Track the state of the menu button
     *
     * @type {Boolean}
     * @private
     */
    this.buttonPressed_ = false;
    this.el_.setAttribute('aria-expanded', 'false');

    if (this.items && this.items.length <= this.hideThreshold_) {
      this.hide();
    } else {
      this.show();
    }
  };

  /**
   * Create the menu and add all items to it.
   *
   * @return {Menu}
   *         The constructed menu
   */


  MenuButton.prototype.createMenu = function createMenu() {
    var menu = new _menu2['default'](this.player_);

    /**
     * Hide the menu if the number of items is less than or equal to this threshold. This defaults
     * to 0 and whenever we add items which can be hidden to the menu we'll increment it. We list
     * it here because every time we run `createMenu` we need to reset the value.
     *
     * @protected
     * @type {Number}
     */
    this.hideThreshold_ = 0;

    // Add a title list item to the top
    if (this.options_.title) {
      var title = Dom.createEl('li', {
        className: 'vjs-menu-title',
        innerHTML: (0, _toTitleCase2['default'])(this.options_.title),
        tabIndex: -1
      });

      this.hideThreshold_ += 1;

      menu.children_.unshift(title);
      Dom.insertElFirst(title, menu.contentEl());
    }

    this.items = this.createItems();

    if (this.items) {
      // Add menu items to the menu
      for (var i = 0; i < this.items.length; i++) {
        menu.addItem(this.items[i]);
      }
    }

    return menu;
  };

  /**
   * Create the list of menu items. Specific to each subclass.
   *
   * @abstract
   */


  MenuButton.prototype.createItems = function createItems() {};

  /**
   * Create the `MenuButtons`s DOM element.
   *
   * @return {Element}
   *         The element that gets created.
   */


  MenuButton.prototype.createEl = function createEl() {
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


  MenuButton.prototype.buildCSSClass = function buildCSSClass() {
    var menuButtonClass = 'vjs-menu-button';

    // If the inline option is passed, we want to use different styles altogether.
    if (this.options_.inline === true) {
      menuButtonClass += '-inline';
    } else {
      menuButtonClass += '-popup';
    }

    return 'vjs-menu-button ' + menuButtonClass + ' ' + _ClickableComponent.prototype.buildCSSClass.call(this);
  };

  /**
   * Handle a click on a `MenuButton`.
   * See {@link ClickableComponent#handleClick} for instances where this is called.
   *
   * @param {EventTarget~Event} event
   *        The `keydown`, `tap`, or `click` event that caused this function to be
   *        called.
   *
   * @listens tap
   * @listens click
   */


  MenuButton.prototype.handleClick = function handleClick(event) {
    // When you click the button it adds focus, which will show the menu.
    // So we'll remove focus when the mouse leaves the button. Focus is needed
    // for tab navigation.

    this.one(this.menu.contentEl(), 'mouseleave', Fn.bind(this, function (e) {
      this.unpressButton();
      this.el_.blur();
    }));
    if (this.buttonPressed_) {
      this.unpressButton();
    } else {
      this.pressButton();
    }
  };

  /**
   * Handle tab, escape, down arrow, and up arrow keys for `MenuButton`. See
   * {@link ClickableComponent#handleKeyPress} for instances where this is called.
   *
   * @param {EventTarget~Event} event
   *        The `keydown` event that caused this function to be called.
   *
   * @listens keydown
   */


  MenuButton.prototype.handleKeyPress = function handleKeyPress(event) {

    // Escape (27) key or Tab (9) key unpress the 'button'
    if (event.which === 27 || event.which === 9) {
      if (this.buttonPressed_) {
        this.unpressButton();
      }
      // Don't preventDefault for Tab key - we still want to lose focus
      if (event.which !== 9) {
        event.preventDefault();
      }
      // Up (38) key or Down (40) key press the 'button'
    } else if (event.which === 38 || event.which === 40) {
      if (!this.buttonPressed_) {
        this.pressButton();
        event.preventDefault();
      }
    } else {
      _ClickableComponent.prototype.handleKeyPress.call(this, event);
    }
  };

  /**
   * Handle a `keydown` event on a sub-menu. The listener for this is added in
   * the constructor.
   *
   * @param {EventTarget~Event} event
   *        Key press event
   *
   * @listens keydown
   */


  MenuButton.prototype.handleSubmenuKeyPress = function handleSubmenuKeyPress(event) {

    // Escape (27) key or Tab (9) key unpress the 'button'
    if (event.which === 27 || event.which === 9) {
      if (this.buttonPressed_) {
        this.unpressButton();
      }
      // Don't preventDefault for Tab key - we still want to lose focus
      if (event.which !== 9) {
        event.preventDefault();
      }
    }
  };

  /**
   * Put the current `MenuButton` into a pressed state.
   */


  MenuButton.prototype.pressButton = function pressButton() {
    if (this.enabled_) {
      this.buttonPressed_ = true;
      this.menu.lockShowing();
      this.el_.setAttribute('aria-expanded', 'true');
      // set the focus into the submenu
      this.menu.focus();
    }
  };

  /**
   * Take the current `MenuButton` out of a pressed state.
   */


  MenuButton.prototype.unpressButton = function unpressButton() {
    if (this.enabled_) {
      this.buttonPressed_ = false;
      this.menu.unlockShowing();
      this.el_.setAttribute('aria-expanded', 'false');
      // Set focus back to this menu button
      this.el_.focus();
    }
  };

  /**
   * Disable the `MenuButton`. Don't allow it to be clicked.
   *
   * @return {MenuButton}
   *         Returns itself; method can be chained.
   */


  MenuButton.prototype.disable = function disable() {
    // Unpress, but don't force focus on this button
    this.buttonPressed_ = false;
    this.menu.unlockShowing();
    this.el_.setAttribute('aria-expanded', 'false');

    this.enabled_ = false;

    return _ClickableComponent.prototype.disable.call(this);
  };

  /**
   * Enable the `MenuButton`. Allow it to be clicked.
   *
   * @return {MenuButton}
   *         Returns itself; method can be chained.
   */


  MenuButton.prototype.enable = function enable() {
    this.enabled_ = true;

    return _ClickableComponent.prototype.enable.call(this);
  };

  return MenuButton;
}(_clickableComponent2['default']);

_component2['default'].registerComponent('MenuButton', MenuButton);
exports['default'] = MenuButton;

},{"3":3,"49":49,"5":5,"81":81,"83":83,"91":91}],48:[function(_dereq_,module,exports){
'use strict';

exports.__esModule = true;

var _clickableComponent = _dereq_(3);

var _clickableComponent2 = _interopRequireDefault(_clickableComponent);

var _component = _dereq_(5);

var _component2 = _interopRequireDefault(_component);

var _obj = _dereq_(88);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * @file menu-item.js
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                */


/**
 * The component for a menu item. `<li>`
 *
 * @extends ClickableComponent
 */
var MenuItem = function (_ClickableComponent) {
  _inherits(MenuItem, _ClickableComponent);

  /**
   * Creates an instance of the this class.
   *
   * @param {Player} player
   *        The `Player` that this class should be attached to.
   *
   * @param {Object} [options={}]
   *        The key/value store of player options.
   *
   */
  function MenuItem(player, options) {
    _classCallCheck(this, MenuItem);

    var _this = _possibleConstructorReturn(this, _ClickableComponent.call(this, player, options));

    _this.selectable = options.selectable;

    _this.selected(options.selected);

    if (_this.selectable) {
      // TODO: May need to be either menuitemcheckbox or menuitemradio,
      //       and may need logical grouping of menu items.
      _this.el_.setAttribute('role', 'menuitemcheckbox');
    } else {
      _this.el_.setAttribute('role', 'menuitem');
    }
    return _this;
  }

  /**
   * Create the `MenuItem's DOM element
   *
   * @param {string} [type=li]
   *        Element's node type, not actually used, always set to `li`.
   *
   * @param {Object} [props={}]
   *        An object of properties that should be set on the element
   *
   * @param {Object} [attrs={}]
   *        An object of attributes that should be set on the element
   *
   * @return {Element}
   *         The element that gets created.
   */


  MenuItem.prototype.createEl = function createEl(type, props, attrs) {
    // The control is textual, not just an icon
    this.nonIconControl = true;

    return _ClickableComponent.prototype.createEl.call(this, 'li', (0, _obj.assign)({
      className: 'vjs-menu-item',
      innerHTML: this.localize(this.options_.label),
      tabIndex: -1
    }, props), attrs);
  };

  /**
   * Any click on a `MenuItem` puts int into the selected state.
   * See {@link ClickableComponent#handleClick} for instances where this is called.
   *
   * @param {EventTarget~Event} event
   *        The `keydown`, `tap`, or `click` event that caused this function to be
   *        called.
   *
   * @listens tap
   * @listens click
   */


  MenuItem.prototype.handleClick = function handleClick(event) {
    this.selected(true);
  };

  /**
   * Set the state for this menu item as selected or not.
   *
   * @param {boolean} selected
   *        if the menu item is selected or not
   */


  MenuItem.prototype.selected = function selected(_selected) {
    if (this.selectable) {
      if (_selected) {
        this.addClass('vjs-selected');
        this.el_.setAttribute('aria-checked', 'true');
        // aria-checked isn't fully supported by browsers/screen readers,
        // so indicate selected state to screen reader in the control text.
        this.controlText(', selected');
      } else {
        this.removeClass('vjs-selected');
        this.el_.setAttribute('aria-checked', 'false');
        // Indicate un-selected state to screen reader
        // Note that a space clears out the selected state text
        this.controlText(' ');
      }
    }
  };

  return MenuItem;
}(_clickableComponent2['default']);

_component2['default'].registerComponent('MenuItem', MenuItem);
exports['default'] = MenuItem;

},{"3":3,"5":5,"88":88}],49:[function(_dereq_,module,exports){
'use strict';

exports.__esModule = true;

var _component = _dereq_(5);

var _component2 = _interopRequireDefault(_component);

var _dom = _dereq_(81);

var Dom = _interopRequireWildcard(_dom);

var _fn = _dereq_(83);

var Fn = _interopRequireWildcard(_fn);

var _events = _dereq_(82);

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

},{"5":5,"81":81,"82":82,"83":83}],50:[function(_dereq_,module,exports){
'use strict';

exports.__esModule = true;

var _dom = _dereq_(81);

var Dom = _interopRequireWildcard(_dom);

var _fn = _dereq_(83);

var Fn = _interopRequireWildcard(_fn);

var _component = _dereq_(5);

var _component2 = _interopRequireDefault(_component);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * @file modal-dialog.js
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                */


var MODAL_CLASS_NAME = 'vjs-modal-dialog';
var ESC = 27;

/**
 * The `ModalDialog` displays over the video and its controls, which blocks
 * interaction with the player until it is closed.
 *
 * Modal dialogs include a "Close" button and will close when that button
 * is activated - or when ESC is pressed anywhere.
 *
 * @extends Component
 */

var ModalDialog = function (_Component) {
  _inherits(ModalDialog, _Component);

  /**
   * Create an instance of this class.
   *
   * @param {Player} player
   *        The `Player` that this class should be attached to.
   *
   * @param {Object} [options]
   *        The key/value store of player options.
   *
   * @param {Mixed} [options.content=undefined]
   *        Provide customized content for this modal.
   *
   * @param {string} [options.description]
   *        A text description for the modal, primarily for accessibility.
   *
   * @param {boolean} [options.fillAlways=false]
   *        Normally, modals are automatically filled only the first time
   *        they open. This tells the modal to refresh its content
   *        every time it opens.
   *
   * @param {string} [options.label]
   *        A text label for the modal, primarily for accessibility.
   *
   * @param {boolean} [options.temporary=true]
   *        If `true`, the modal can only be opened once; it will be
   *        disposed as soon as it's closed.
   *
   * @param {boolean} [options.uncloseable=false]
   *        If `true`, the user will not be able to close the modal
   *        through the UI in the normal ways. Programmatic closing is
   *        still possible.
   */
  function ModalDialog(player, options) {
    _classCallCheck(this, ModalDialog);

    var _this = _possibleConstructorReturn(this, _Component.call(this, player, options));

    _this.opened_ = _this.hasBeenOpened_ = _this.hasBeenFilled_ = false;

    _this.closeable(!_this.options_.uncloseable);
    _this.content(_this.options_.content);

    // Make sure the contentEl is defined AFTER any children are initialized
    // because we only want the contents of the modal in the contentEl
    // (not the UI elements like the close button).
    _this.contentEl_ = Dom.createEl('div', {
      className: MODAL_CLASS_NAME + '-content'
    }, {
      role: 'document'
    });

    _this.descEl_ = Dom.createEl('p', {
      className: MODAL_CLASS_NAME + '-description vjs-offscreen',
      id: _this.el().getAttribute('aria-describedby')
    });

    Dom.textContent(_this.descEl_, _this.description());
    _this.el_.appendChild(_this.descEl_);
    _this.el_.appendChild(_this.contentEl_);
    return _this;
  }

  /**
   * Create the `ModalDialog`'s DOM element
   *
   * @return {Element}
   *         The DOM element that gets created.
   */


  ModalDialog.prototype.createEl = function createEl() {
    return _Component.prototype.createEl.call(this, 'div', {
      className: this.buildCSSClass(),
      tabIndex: -1
    }, {
      'aria-describedby': this.id() + '_description',
      'aria-hidden': 'true',
      'aria-label': this.label(),
      'role': 'dialog'
    });
  };

  /**
   * Builds the default DOM `className`.
   *
   * @return {string}
   *         The DOM `className` for this object.
   */


  ModalDialog.prototype.buildCSSClass = function buildCSSClass() {
    return MODAL_CLASS_NAME + ' vjs-hidden ' + _Component.prototype.buildCSSClass.call(this);
  };

  /**
   * Handles `keydown` events on the document, looking for ESC, which closes
   * the modal.
   *
   * @param {EventTarget~Event} e
   *        The keypress that triggered this event.
   *
   * @listens keydown
   */


  ModalDialog.prototype.handleKeyPress = function handleKeyPress(e) {
    if (e.which === ESC && this.closeable()) {
      this.close();
    }
  };

  /**
   * Returns the label string for this modal. Primarily used for accessibility.
   *
   * @return {string}
   *         the localized or raw label of this modal.
   */


  ModalDialog.prototype.label = function label() {
    return this.options_.label || this.localize('Modal Window');
  };

  /**
   * Returns the description string for this modal. Primarily used for
   * accessibility.
   *
   * @return {string}
   *         The localized or raw description of this modal.
   */


  ModalDialog.prototype.description = function description() {
    var desc = this.options_.description || this.localize('This is a modal window.');

    // Append a universal closeability message if the modal is closeable.
    if (this.closeable()) {
      desc += ' ' + this.localize('This modal can be closed by pressing the Escape key or activating the close button.');
    }

    return desc;
  };

  /**
   * Opens the modal.
   *
   * @fires ModalDialog#beforemodalopen
   * @fires ModalDialog#modalopen
   *
   * @return {ModalDialog}
   *         Returns itself; method can be chained.
   */


  ModalDialog.prototype.open = function open() {
    if (!this.opened_) {
      var player = this.player();

      /**
       * Fired just before a `ModalDialog` is opened.
       *
       * @event ModalDialog#beforemodalopen
       * @type {EventTarget~Event}
       */
      this.trigger('beforemodalopen');
      this.opened_ = true;

      // Fill content if the modal has never opened before and
      // never been filled.
      if (this.options_.fillAlways || !this.hasBeenOpened_ && !this.hasBeenFilled_) {
        this.fill();
      }

      // If the player was playing, pause it and take note of its previously
      // playing state.
      this.wasPlaying_ = !player.paused();

      if (this.options_.pauseOnOpen && this.wasPlaying_) {
        player.pause();
      }

      if (this.closeable()) {
        this.on(this.el_.ownerDocument, 'keydown', Fn.bind(this, this.handleKeyPress));
      }

      player.controls(false);
      this.show();
      this.el().setAttribute('aria-hidden', 'false');

      /**
       * Fired just after a `ModalDialog` is opened.
       *
       * @event ModalDialog#modalopen
       * @type {EventTarget~Event}
       */
      this.trigger('modalopen');
      this.hasBeenOpened_ = true;
    }
    return this;
  };

  /**
   * If the `ModalDialog` is currently open or closed.
   *
   * @param  {boolean} [value]
   *         If given, it will open (`true`) or close (`false`) the modal.
   *
   * @return {boolean}
   *         the current open state of the modaldialog
   */


  ModalDialog.prototype.opened = function opened(value) {
    if (typeof value === 'boolean') {
      this[value ? 'open' : 'close']();
    }
    return this.opened_;
  };

  /**
   * Closes the modal, does nothing if the `ModalDialog` is
   * not open.
   *
   * @fires ModalDialog#beforemodalclose
   * @fires ModalDialog#modalclose
   *
   * @return {ModalDialog}
   *         Returns itself; method can be chained.
   */


  ModalDialog.prototype.close = function close() {
    if (this.opened_) {
      var player = this.player();

      /**
       * Fired just before a `ModalDialog` is closed.
       *
       * @event ModalDialog#beforemodalclose
       * @type {EventTarget~Event}
       */
      this.trigger('beforemodalclose');
      this.opened_ = false;

      if (this.wasPlaying_ && this.options_.pauseOnOpen) {
        player.play();
      }

      if (this.closeable()) {
        this.off(this.el_.ownerDocument, 'keydown', Fn.bind(this, this.handleKeyPress));
      }

      player.controls(true);
      this.hide();
      this.el().setAttribute('aria-hidden', 'true');

      /**
       * Fired just after a `ModalDialog` is closed.
       *
       * @event ModalDialog#modalclose
       * @type {EventTarget~Event}
       */
      this.trigger('modalclose');

      if (this.options_.temporary) {
        this.dispose();
      }
    }
    return this;
  };

  /**
   * Check to see if the `ModalDialog` is closeable via the UI.
   *
   * @param  {boolean} [value]
   *         If given as a boolean, it will set the `closeable` option.
   *
   * @return {boolean}
   *         Returns the final value of the closable option.
   */


  ModalDialog.prototype.closeable = function closeable(value) {
    if (typeof value === 'boolean') {
      var closeable = this.closeable_ = !!value;
      var close = this.getChild('closeButton');

      // If this is being made closeable and has no close button, add one.
      if (closeable && !close) {

        // The close button should be a child of the modal - not its
        // content element, so temporarily change the content element.
        var temp = this.contentEl_;

        this.contentEl_ = this.el_;
        close = this.addChild('closeButton', { controlText: 'Close Modal Dialog' });
        this.contentEl_ = temp;
        this.on(close, 'close', this.close);
      }

      // If this is being made uncloseable and has a close button, remove it.
      if (!closeable && close) {
        this.off(close, 'close', this.close);
        this.removeChild(close);
        close.dispose();
      }
    }
    return this.closeable_;
  };

  /**
   * Fill the modal's content element with the modal's "content" option.
   * The content element will be emptied before this change takes place.
   *
   * @return {ModalDialog}
   *         Returns itself; method can be chained.
   */


  ModalDialog.prototype.fill = function fill() {
    return this.fillWith(this.content());
  };

  /**
   * Fill the modal's content element with arbitrary content.
   * The content element will be emptied before this change takes place.
   *
   * @fires ModalDialog#beforemodalfill
   * @fires ModalDialog#modalfill
   *
   * @param  {Mixed} [content]
   *         The same rules apply to this as apply to the `content` option.
   *
   * @return {ModalDialog}
   *         Returns itself; method can be chained.
   */


  ModalDialog.prototype.fillWith = function fillWith(content) {
    var contentEl = this.contentEl();
    var parentEl = contentEl.parentNode;
    var nextSiblingEl = contentEl.nextSibling;

    /**
     * Fired just before a `ModalDialog` is filled with content.
     *
     * @event ModalDialog#beforemodalfill
     * @type {EventTarget~Event}
     */
    this.trigger('beforemodalfill');
    this.hasBeenFilled_ = true;

    // Detach the content element from the DOM before performing
    // manipulation to avoid modifying the live DOM multiple times.
    parentEl.removeChild(contentEl);
    this.empty();
    Dom.insertContent(contentEl, content);
    /**
     * Fired just after a `ModalDialog` is filled with content.
     *
     * @event ModalDialog#modalfill
     * @type {EventTarget~Event}
     */
    this.trigger('modalfill');

    // Re-inject the re-filled content element.
    if (nextSiblingEl) {
      parentEl.insertBefore(contentEl, nextSiblingEl);
    } else {
      parentEl.appendChild(contentEl);
    }

    return this;
  };

  /**
   * Empties the content element. This happens anytime the modal is filled.
   *
   * @fires ModalDialog#beforemodalempty
   * @fires ModalDialog#modalempty
   *
   * @return {ModalDialog}
   *         Returns itself; method can be chained.
   */


  ModalDialog.prototype.empty = function empty() {
    /**
     * Fired just before a `ModalDialog` is emptied.
     *
     * @event ModalDialog#beforemodalempty
     * @type {EventTarget~Event}
     */
    this.trigger('beforemodalempty');
    Dom.emptyEl(this.contentEl());

    /**
     * Fired just after a `ModalDialog` is emptied.
     *
     * @event ModalDialog#modalempty
     * @type {EventTarget~Event}
     */
    this.trigger('modalempty');
    return this;
  };

  /**
   * Gets or sets the modal content, which gets normalized before being
   * rendered into the DOM.
   *
   * This does not update the DOM or fill the modal, but it is called during
   * that process.
   *
   * @param  {Mixed} [value]
   *         If defined, sets the internal content value to be used on the
   *         next call(s) to `fill`. This value is normalized before being
   *         inserted. To "clear" the internal content value, pass `null`.
   *
   * @return {Mixed}
   *         The current content of the modal dialog
   */


  ModalDialog.prototype.content = function content(value) {
    if (typeof value !== 'undefined') {
      this.content_ = value;
    }
    return this.content_;
  };

  return ModalDialog;
}(_component2['default']);

/**
 * Default options for `ModalDialog` default options.
 *
 * @type {Object}
 * @private
 */


ModalDialog.prototype.options_ = {
  pauseOnOpen: true,
  temporary: true
};

_component2['default'].registerComponent('ModalDialog', ModalDialog);
exports['default'] = ModalDialog;

},{"5":5,"81":81,"83":83}],51:[function(_dereq_,module,exports){
'use strict';

exports.__esModule = true;

var _component = _dereq_(5);

var _component2 = _interopRequireDefault(_component);

var _document = _dereq_(94);

var _document2 = _interopRequireDefault(_document);

var _window = _dereq_(95);

var _window2 = _interopRequireDefault(_window);

var _events = _dereq_(82);

var Events = _interopRequireWildcard(_events);

var _dom = _dereq_(81);

var Dom = _interopRequireWildcard(_dom);

var _fn = _dereq_(83);

var Fn = _interopRequireWildcard(_fn);

var _guid = _dereq_(85);

var Guid = _interopRequireWildcard(_guid);

var _browser = _dereq_(78);

var browser = _interopRequireWildcard(_browser);

var _log = _dereq_(86);

var _log2 = _interopRequireDefault(_log);

var _toTitleCase = _dereq_(91);

var _toTitleCase2 = _interopRequireDefault(_toTitleCase);

var _timeRanges = _dereq_(90);

var _buffer = _dereq_(79);

var _stylesheet = _dereq_(89);

var stylesheet = _interopRequireWildcard(_stylesheet);

var _fullscreenApi = _dereq_(44);

var _fullscreenApi2 = _interopRequireDefault(_fullscreenApi);

var _mediaError = _dereq_(46);

var _mediaError2 = _interopRequireDefault(_mediaError);

var _tuple = _dereq_(97);

var _tuple2 = _interopRequireDefault(_tuple);

var _obj = _dereq_(88);

var _mergeOptions = _dereq_(87);

var _mergeOptions2 = _interopRequireDefault(_mergeOptions);

var _textTrackListConverter = _dereq_(69);

var _textTrackListConverter2 = _interopRequireDefault(_textTrackListConverter);

var _modalDialog = _dereq_(50);

var _modalDialog2 = _interopRequireDefault(_modalDialog);

var _tech = _dereq_(62);

var _tech2 = _interopRequireDefault(_tech);

var _audioTrackList = _dereq_(63);

var _audioTrackList2 = _interopRequireDefault(_audioTrackList);

var _videoTrackList = _dereq_(76);

var _videoTrackList2 = _interopRequireDefault(_videoTrackList);

_dereq_(61);

_dereq_(59);

_dereq_(55);

_dereq_(68);

_dereq_(45);

_dereq_(1);

_dereq_(4);

_dereq_(8);

_dereq_(41);

_dereq_(71);

_dereq_(60);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * @file player.js
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                */
// Subclasses Component


// The following imports are used only to ensure that the corresponding modules
// are always included in the video.js package. Importing the modules will
// execute them and they will register themselves with video.js.


// Import Html5 tech, at least for disposing the original video tag.


// The following tech events are simply re-triggered
// on the player when they happen
var TECH_EVENTS_RETRIGGER = [
/**
 * Fired while the user agent is downloading media data.
 *
 * @event Player#progress
 * @type {EventTarget~Event}
 */
/**
 * Retrigger the `progress` event that was triggered by the {@link Tech}.
 *
 * @private
 * @method Player#handleTechProgress_
 * @fires Player#progress
 * @listens Tech#progress
 */
'progress',

/**
 * Fires when the loading of an audio/video is aborted.
 *
 * @event Player#abort
 * @type {EventTarget~Event}
 */
/**
 * Retrigger the `abort` event that was triggered by the {@link Tech}.
 *
 * @private
 * @method Player#handleTechAbort_
 * @fires Player#abort
 * @listens Tech#abort
 */
'abort',

/**
 * Fires when the browser is intentionally not getting media data.
 *
 * @event Player#suspend
 * @type {EventTarget~Event}
 */
/**
 * Retrigger the `suspend` event that was triggered by the {@link Tech}.
 *
 * @private
 * @method Player#handleTechSuspend_
 * @fires Player#suspend
 * @listens Tech#suspend
 */
'suspend',

/**
 * Fires when the current playlist is empty.
 *
 * @event Player#emptied
 * @type {EventTarget~Event}
 */
/**
 * Retrigger the `emptied` event that was triggered by the {@link Tech}.
 *
 * @private
 * @method Player#handleTechEmptied_
 * @fires Player#emptied
 * @listens Tech#emptied
 */
'emptied',
/**
 * Fires when the browser is trying to get media data, but data is not available.
 *
 * @event Player#stalled
 * @type {EventTarget~Event}
 */
/**
 * Retrigger the `stalled` event that was triggered by the {@link Tech}.
 *
 * @private
 * @method Player#handleTechStalled_
 * @fires Player#stalled
 * @listens Tech#stalled
 */
'stalled',

/**
 * Fires when the browser has loaded meta data for the audio/video.
 *
 * @event Player#loadedmetadata
 * @type {EventTarget~Event}
 */
/**
 * Retrigger the `stalled` event that was triggered by the {@link Tech}.
 *
 * @private
 * @method Player#handleTechLoadedmetadata_
 * @fires Player#loadedmetadata
 * @listens Tech#loadedmetadata
 */
'loadedmetadata',

/**
 * Fires when the browser has loaded the current frame of the audio/video.
 *
 * @event player#loadeddata
 * @type {event}
 */
/**
 * Retrigger the `loadeddata` event that was triggered by the {@link Tech}.
 *
 * @private
 * @method Player#handleTechLoaddeddata_
 * @fires Player#loadeddata
 * @listens Tech#loadeddata
 */
'loadeddata',

/**
 * Fires when the current playback position has changed.
 *
 * @event player#timeupdate
 * @type {event}
 */
/**
 * Retrigger the `timeupdate` event that was triggered by the {@link Tech}.
 *
 * @private
 * @method Player#handleTechTimeUpdate_
 * @fires Player#timeupdate
 * @listens Tech#timeupdate
 */
'timeupdate',

/**
 * Fires when the playing speed of the audio/video is changed
 *
 * @event player#ratechange
 * @type {event}
 */
/**
 * Retrigger the `ratechange` event that was triggered by the {@link Tech}.
 *
 * @private
 * @method Player#handleTechRatechange_
 * @fires Player#ratechange
 * @listens Tech#ratechange
 */
'ratechange',

/**
 * Fires when the volume has been changed
 *
 * @event player#volumechange
 * @type {event}
 */
/**
 * Retrigger the `volumechange` event that was triggered by the {@link Tech}.
 *
 * @private
 * @method Player#handleTechVolumechange_
 * @fires Player#volumechange
 * @listens Tech#volumechange
 */
'volumechange',

/**
 * Fires when the text track has been changed
 *
 * @event player#texttrackchange
 * @type {event}
 */
/**
 * Retrigger the `texttrackchange` event that was triggered by the {@link Tech}.
 *
 * @private
 * @method Player#handleTechTexttrackchange_
 * @fires Player#texttrackchange
 * @listens Tech#texttrackchange
 */
'texttrackchange'];

/**
 * An instance of the `Player` class is created when any of the Video.js setup methods
 * are used to initialize a video.
 *
 * After an instance has been created it can be accessed globally in two ways:
 * 1. By calling `videojs('example_video_1');`
 * 2. By using it directly via  `videojs.players.example_video_1;`
 *
 * @extends Component
 */

var Player = function (_Component) {
  _inherits(Player, _Component);

  /**
   * Create an instance of this class.
   *
   * @param {Element} tag
   *        The original video DOM element used for configuring options.
   *
   * @param {Object} [options]
   *        Object of option names and values.
   *
   * @param {Component~ReadyCallback} [ready]
   *        Ready callback function.
   */
  function Player(tag, options, ready) {
    _classCallCheck(this, Player);

    // Make sure tag ID exists
    tag.id = tag.id || 'vjs_video_' + Guid.newGUID();

    // Set Options
    // The options argument overrides options set in the video tag
    // which overrides globally set options.
    // This latter part coincides with the load order
    // (tag must exist before Player)
    options = (0, _obj.assign)(Player.getTagSettings(tag), options);

    // Delay the initialization of children because we need to set up
    // player properties first, and can't use `this` before `super()`
    options.initChildren = false;

    // Same with creating the element
    options.createEl = false;

    // we don't want the player to report touch activity on itself
    // see enableTouchActivity in Component
    options.reportTouchActivity = false;

    // If language is not set, get the closest lang attribute
    if (!options.language) {
      if (typeof tag.closest === 'function') {
        var closest = tag.closest('[lang]');

        if (closest) {
          options.language = closest.getAttribute('lang');
        }
      } else {
        var element = tag;

        while (element && element.nodeType === 1) {
          if (Dom.getElAttributes(element).hasOwnProperty('lang')) {
            options.language = element.getAttribute('lang');
            break;
          }
          element = element.parentNode;
        }
      }
    }

    // Run base component initializing with new options

    // if the global option object was accidentally blown away by
    // someone, bail early with an informative error
    var _this = _possibleConstructorReturn(this, _Component.call(this, null, options, ready));

    if (!_this.options_ || !_this.options_.techOrder || !_this.options_.techOrder.length) {
      throw new Error('No techOrder specified. Did you overwrite ' + 'videojs.options instead of just changing the ' + 'properties you want to override?');
    }

    // Store the original tag used to set options
    _this.tag = tag;

    // Store the tag attributes used to restore html5 element
    _this.tagAttributes = tag && Dom.getElAttributes(tag);

    // Update current language
    _this.language(_this.options_.language);

    // Update Supported Languages
    if (options.languages) {
      // Normalise player option languages to lowercase
      var languagesToLower = {};

      Object.getOwnPropertyNames(options.languages).forEach(function (name) {
        languagesToLower[name.toLowerCase()] = options.languages[name];
      });
      _this.languages_ = languagesToLower;
    } else {
      _this.languages_ = Player.prototype.options_.languages;
    }

    // Cache for video property values.
    _this.cache_ = {};

    // Set poster
    _this.poster_ = options.poster || '';

    // Set controls
    _this.controls_ = !!options.controls;

    // Original tag settings stored in options
    // now remove immediately so native controls don't flash.
    // May be turned back on by HTML5 tech if nativeControlsForTouch is true
    tag.controls = false;

    /*
     * Store the internal state of scrubbing
     *
     * @private
     * @return {Boolean} True if the user is scrubbing
     */
    _this.scrubbing_ = false;

    _this.el_ = _this.createEl();

    // We also want to pass the original player options to each component and plugin
    // as well so they don't need to reach back into the player for options later.
    // We also need to do another copy of this.options_ so we don't end up with
    // an infinite loop.
    var playerOptionsCopy = (0, _mergeOptions2['default'])(_this.options_);

    // Load plugins
    if (options.plugins) {
      var plugins = options.plugins;

      Object.getOwnPropertyNames(plugins).forEach(function (name) {
        if (typeof this[name] === 'function') {
          this[name](plugins[name]);
        } else {
          _log2['default'].error('Unable to find plugin:', name);
        }
      }, _this);
    }

    _this.options_.playerOptions = playerOptionsCopy;

    _this.initChildren();

    // Set isAudio based on whether or not an audio tag was used
    _this.isAudio(tag.nodeName.toLowerCase() === 'audio');

    // Update controls className. Can't do this when the controls are initially
    // set because the element doesn't exist yet.
    if (_this.controls()) {
      _this.addClass('vjs-controls-enabled');
    } else {
      _this.addClass('vjs-controls-disabled');
    }

    // Set ARIA label and region role depending on player type
    _this.el_.setAttribute('role', 'region');
    if (_this.isAudio()) {
      _this.el_.setAttribute('aria-label', 'audio player');
    } else {
      _this.el_.setAttribute('aria-label', 'video player');
    }

    if (_this.isAudio()) {
      _this.addClass('vjs-audio');
    }

    if (_this.flexNotSupported_()) {
      _this.addClass('vjs-no-flex');
    }

    // TODO: Make this smarter. Toggle user state between touching/mousing
    // using events, since devices can have both touch and mouse events.
    // if (browser.TOUCH_ENABLED) {
    //   this.addClass('vjs-touch-enabled');
    // }

    // iOS Safari has broken hover handling
    if (!browser.IS_IOS) {
      _this.addClass('vjs-workinghover');
    }

    // Make player easily findable by ID
    Player.players[_this.id_] = _this;

    // Add a major version class to aid css in plugins
    var majorVersion = '5.20.2'.split('.')[0];

    _this.addClass('vjs-v' + majorVersion);

    // When the player is first initialized, trigger activity so components
    // like the control bar show themselves if needed
    _this.userActive(true);
    _this.reportUserActivity();
    _this.listenForUserActivity_();

    _this.on('fullscreenchange', _this.handleFullscreenChange_);
    _this.on('stageclick', _this.handleStageClick_);
    return _this;
  }

  /**
   * Destroys the video player and does any necessary cleanup.
   *
   * This is especially helpful if you are dynamically adding and removing videos
   * to/from the DOM.
   *
   * @fires Player#dispose
   */


  Player.prototype.dispose = function dispose() {
    /**
     * Called when the player is being disposed of.
     *
     * @event Player#dispose
     * @type {EventTarget~Event}
     */
    this.trigger('dispose');
    // prevent dispose from being called twice
    this.off('dispose');

    if (this.styleEl_ && this.styleEl_.parentNode) {
      this.styleEl_.parentNode.removeChild(this.styleEl_);
    }

    // Kill reference to this player
    Player.players[this.id_] = null;

    if (this.tag && this.tag.player) {
      this.tag.player = null;
    }

    if (this.el_ && this.el_.player) {
      this.el_.player = null;
    }

    if (this.tech_) {
      this.tech_.dispose();
    }

    _Component.prototype.dispose.call(this);
  };

  /**
   * Create the `Player`'s DOM element.
   *
   * @return {Element}
   *         The DOM element that gets created.
   */


  Player.prototype.createEl = function createEl() {
    var tag = this.tag;
    var el = void 0;
    var playerElIngest = this.playerElIngest_ = tag.parentNode && tag.parentNode.hasAttribute && tag.parentNode.hasAttribute('data-vjs-player');

    if (playerElIngest) {
      el = this.el_ = tag.parentNode;
    } else {
      el = this.el_ = _Component.prototype.createEl.call(this, 'div');
    }

    // set tabindex to -1 so we could focus on the player element
    tag.setAttribute('tabindex', '-1');

    // Remove width/height attrs from tag so CSS can make it 100% width/height
    tag.removeAttribute('width');
    tag.removeAttribute('height');

    // Copy over all the attributes from the tag, including ID and class
    // ID will now reference player box, not the video tag
    var attrs = Dom.getElAttributes(tag);

    Object.getOwnPropertyNames(attrs).forEach(function (attr) {
      // workaround so we don't totally break IE7
      // http://stackoverflow.com/questions/3653444/css-styles-not-applied-on-dynamic-elements-in-internet-explorer-7
      if (attr === 'class') {
        el.className += ' ' + attrs[attr];
      } else {
        el.setAttribute(attr, attrs[attr]);
      }
    });

    // Update tag id/class for use as HTML5 playback tech
    // Might think we should do this after embedding in container so .vjs-tech class
    // doesn't flash 100% width/height, but class only applies with .video-js parent
    tag.playerId = tag.id;
    tag.id += '_html5_api';
    tag.className = 'vjs-tech';

    // Make player findable on elements
    tag.player = el.player = this;
    // Default state of video is paused
    this.addClass('vjs-paused');

    // Add a style element in the player that we'll use to set the width/height
    // of the player in a way that's still overrideable by CSS, just like the
    // video element
    if (_window2['default'].VIDEOJS_NO_DYNAMIC_STYLE !== true) {
      this.styleEl_ = stylesheet.createStyleElement('vjs-styles-dimensions');
      var defaultsStyleEl = Dom.$('.vjs-styles-defaults');
      var head = Dom.$('head');

      head.insertBefore(this.styleEl_, defaultsStyleEl ? defaultsStyleEl.nextSibling : head.firstChild);
    }

    // Pass in the width/height/aspectRatio options which will update the style el
    this.width(this.options_.width);
    this.height(this.options_.height);
    this.fluid(this.options_.fluid);
    this.aspectRatio(this.options_.aspectRatio);

    // Hide any links within the video/audio tag, because IE doesn't hide them completely.
    var links = tag.getElementsByTagName('a');

    for (var i = 0; i < links.length; i++) {
      var linkEl = links.item(i);

      Dom.addElClass(linkEl, 'vjs-hidden');
      linkEl.setAttribute('hidden', 'hidden');
    }

    // insertElFirst seems to cause the networkState to flicker from 3 to 2, so
    // keep track of the original for later so we can know if the source originally failed
    tag.initNetworkState_ = tag.networkState;

    // Wrap video tag in div (el/box) container
    if (tag.parentNode && !playerElIngest) {
      tag.parentNode.insertBefore(el, tag);
    }

    // insert the tag as the first child of the player element
    // then manually add it to the children array so that this.addChild
    // will work properly for other components
    //
    // Breaks iPhone, fixed in HTML5 setup.
    Dom.insertElFirst(tag, el);
    this.children_.unshift(tag);

    this.el_ = el;

    return el;
  };

  /**
   * A getter/setter for the `Player`'s width.
   *
   * @param {number} [value]
   *        The value to set the `Player's width to.
   *
   * @return {number}
   *         The current width of the `Player`.
   */


  Player.prototype.width = function width(value) {
    return this.dimension('width', value);
  };

  /**
   * A getter/setter for the `Player`'s height.
   *
   * @param {number} [value]
   *        The value to set the `Player's heigth to.
   *
   * @return {number}
   *         The current heigth of the `Player`.
   */


  Player.prototype.height = function height(value) {
    return this.dimension('height', value);
  };

  /**
   * A getter/setter for the `Player`'s width & height.
   *
   * @param {string} dimension
   *        This string can be:
   *        - 'width'
   *        - 'height'
   *
   * @param {number} [value]
   *        Value for dimension specified in the first argument.
   *
   * @return {Player|number}
   *         - Returns itself when setting; method can be chained.
   *         - The dimension arguments value when getting (width/height).
   */


  Player.prototype.dimension = function dimension(_dimension, value) {
    var privDimension = _dimension + '_';

    if (value === undefined) {
      return this[privDimension] || 0;
    }

    if (value === '') {
      // If an empty string is given, reset the dimension to be automatic
      this[privDimension] = undefined;
    } else {
      var parsedVal = parseFloat(value);

      if (isNaN(parsedVal)) {
        _log2['default'].error('Improper value "' + value + '" supplied for for ' + _dimension);
        return this;
      }

      this[privDimension] = parsedVal;
    }

    this.updateStyleEl_();
    return this;
  };

  /**
   * A getter/setter/toggler for the vjs-fluid `className` on the `Player`.
   *
   * @param {boolean} [bool]
   *        - A value of true adds the class.
   *        - A value of false removes the class.
   *        - No value will toggle the fluid class.
   *
   * @return {boolean|undefined}
   *         - The value of fluid when getting.
   *         - `undefined` when setting.
   */


  Player.prototype.fluid = function fluid(bool) {
    if (bool === undefined) {
      return !!this.fluid_;
    }

    this.fluid_ = !!bool;

    if (bool) {
      this.addClass('vjs-fluid');
    } else {
      this.removeClass('vjs-fluid');
    }

    this.updateStyleEl_();
  };

  /**
   * Get/Set the aspect ratio
   *
   * @param {string} [ratio]
   *        Aspect ratio for player
   *
   * @return {string|undefined}
   *         returns the current aspect ratio when getting
   */

  /**
   * A getter/setter for the `Player`'s aspect ratio.
   *
   * @param {string} [ratio]
   *        The value to set the `Player's aspect ratio to.
   *
   * @return {string|undefined}
   *         - The current aspect ratio of the `Player` when getting.
   *         - undefined when setting
   */


  Player.prototype.aspectRatio = function aspectRatio(ratio) {
    if (ratio === undefined) {
      return this.aspectRatio_;
    }

    // Check for width:height format
    if (!/^\d+\:\d+$/.test(ratio)) {
      throw new Error('Improper value supplied for aspect ratio. The format should be width:height, for example 16:9.');
    }
    this.aspectRatio_ = ratio;

    // We're assuming if you set an aspect ratio you want fluid mode,
    // because in fixed mode you could calculate width and height yourself.
    this.fluid(true);

    this.updateStyleEl_();
  };

  /**
   * Update styles of the `Player` element (height, width and aspect ratio).
   *
   * @private
   * @listens Tech#loadedmetadata
   */


  Player.prototype.updateStyleEl_ = function updateStyleEl_() {
    if (_window2['default'].VIDEOJS_NO_DYNAMIC_STYLE === true) {
      var _width = typeof this.width_ === 'number' ? this.width_ : this.options_.width;
      var _height = typeof this.height_ === 'number' ? this.height_ : this.options_.height;
      var techEl = this.tech_ && this.tech_.el();

      if (techEl) {
        if (_width >= 0) {
          techEl.width = _width;
        }
        if (_height >= 0) {
          techEl.height = _height;
        }
      }

      return;
    }

    var width = void 0;
    var height = void 0;
    var aspectRatio = void 0;
    var idClass = void 0;

    // The aspect ratio is either used directly or to calculate width and height.
    if (this.aspectRatio_ !== undefined && this.aspectRatio_ !== 'auto') {
      // Use any aspectRatio that's been specifically set
      aspectRatio = this.aspectRatio_;
    } else if (this.videoWidth() > 0) {
      // Otherwise try to get the aspect ratio from the video metadata
      aspectRatio = this.videoWidth() + ':' + this.videoHeight();
    } else {
      // Or use a default. The video element's is 2:1, but 16:9 is more common.
      aspectRatio = '16:9';
    }

    // Get the ratio as a decimal we can use to calculate dimensions
    var ratioParts = aspectRatio.split(':');
    var ratioMultiplier = ratioParts[1] / ratioParts[0];

    if (this.width_ !== undefined) {
      // Use any width that's been specifically set
      width = this.width_;
    } else if (this.height_ !== undefined) {
      // Or calulate the width from the aspect ratio if a height has been set
      width = this.height_ / ratioMultiplier;
    } else {
      // Or use the video's metadata, or use the video el's default of 300
      width = this.videoWidth() || 300;
    }

    if (this.height_ !== undefined) {
      // Use any height that's been specifically set
      height = this.height_;
    } else {
      // Otherwise calculate the height from the ratio and the width
      height = width * ratioMultiplier;
    }

    // Ensure the CSS class is valid by starting with an alpha character
    if (/^[^a-zA-Z]/.test(this.id())) {
      idClass = 'dimensions-' + this.id();
    } else {
      idClass = this.id() + '-dimensions';
    }

    // Ensure the right class is still on the player for the style element
    this.addClass(idClass);

    stylesheet.setTextContent(this.styleEl_, '\n      .' + idClass + ' {\n        width: ' + width + 'px;\n        height: ' + height + 'px;\n      }\n\n      .' + idClass + '.vjs-fluid {\n        padding-top: ' + ratioMultiplier * 100 + '%;\n      }\n    ');
  };

  /**
   * Load/Create an instance of playback {@link Tech} including element
   * and API methods. Then append the `Tech` element in `Player` as a child.
   *
   * @param {string} techName
   *        name of the playback technology
   *
   * @param {string} source
   *        video source
   *
   * @private
   */


  Player.prototype.loadTech_ = function loadTech_(techName, source) {
    var _this2 = this;

    // Pause and remove current playback technology
    if (this.tech_) {
      this.unloadTech_();
    }

    // get rid of the HTML5 video tag as soon as we are using another tech
    if (techName !== 'Html5' && this.tag) {
      _tech2['default'].getTech('Html5').disposeMediaElement(this.tag);
      this.tag.player = null;
      this.tag = null;
    }

    this.techName_ = techName;

    // Turn off API access because we're loading a new tech that might load asynchronously
    this.isReady_ = false;

    // Grab tech-specific options from player options and add source and parent element to use.
    var techOptions = (0, _obj.assign)({
      source: source,
      'nativeControlsForTouch': this.options_.nativeControlsForTouch,
      'playerId': this.id(),
      'techId': this.id() + '_' + techName + '_api',
      'videoTracks': this.videoTracks_,
      'textTracks': this.textTracks_,
      'audioTracks': this.audioTracks_,
      'autoplay': this.options_.autoplay,
      'playsinline': this.options_.playsinline,
      'preload': this.options_.preload,
      'loop': this.options_.loop,
      'muted': this.options_.muted,
      'poster': this.poster(),
      'language': this.language(),
      'playerElIngest': this.playerElIngest_ || false,
      'vtt.js': this.options_['vtt.js']
    }, this.options_[techName.toLowerCase()]);

    if (this.tag) {
      techOptions.tag = this.tag;
    }

    if (source) {
      this.currentType_ = source.type;

      if (source.src === this.cache_.src && this.cache_.currentTime > 0) {
        techOptions.startTime = this.cache_.currentTime;
      }

      this.cache_.sources = null;
      this.cache_.source = source;
      this.cache_.src = source.src;
    }

    // Initialize tech instance
    var TechComponent = _tech2['default'].getTech(techName);

    // Support old behavior of techs being registered as components.
    // Remove once that deprecated behavior is removed.
    if (!TechComponent) {
      TechComponent = _component2['default'].getComponent(techName);
    }
    this.tech_ = new TechComponent(techOptions);

    // player.triggerReady is always async, so don't need this to be async
    this.tech_.ready(Fn.bind(this, this.handleTechReady_), true);

    _textTrackListConverter2['default'].jsonToTextTracks(this.textTracksJson_ || [], this.tech_);

    // Listen to all HTML5-defined events and trigger them on the player
    TECH_EVENTS_RETRIGGER.forEach(function (event) {
      _this2.on(_this2.tech_, event, _this2['handleTech' + (0, _toTitleCase2['default'])(event) + '_']);
    });
    this.on(this.tech_, 'loadstart', this.handleTechLoadStart_);
    this.on(this.tech_, 'waiting', this.handleTechWaiting_);
    this.on(this.tech_, 'canplay', this.handleTechCanPlay_);
    this.on(this.tech_, 'canplaythrough', this.handleTechCanPlayThrough_);
    this.on(this.tech_, 'playing', this.handleTechPlaying_);
    this.on(this.tech_, 'ended', this.handleTechEnded_);
    this.on(this.tech_, 'seeking', this.handleTechSeeking_);
    this.on(this.tech_, 'seeked', this.handleTechSeeked_);
    this.on(this.tech_, 'play', this.handleTechPlay_);
    this.on(this.tech_, 'firstplay', this.handleTechFirstPlay_);
    this.on(this.tech_, 'pause', this.handleTechPause_);
    this.on(this.tech_, 'durationchange', this.handleTechDurationChange_);
    this.on(this.tech_, 'fullscreenchange', this.handleTechFullscreenChange_);
    this.on(this.tech_, 'error', this.handleTechError_);
    this.on(this.tech_, 'loadedmetadata', this.updateStyleEl_);
    this.on(this.tech_, 'posterchange', this.handleTechPosterChange_);
    this.on(this.tech_, 'textdata', this.handleTechTextData_);

    this.usingNativeControls(this.techGet_('controls'));

    if (this.controls() && !this.usingNativeControls()) {
      this.addTechControlsListeners_();
    }

    // Add the tech element in the DOM if it was not already there
    // Make sure to not insert the original video element if using Html5
    if (this.tech_.el().parentNode !== this.el() && (techName !== 'Html5' || !this.tag)) {
      Dom.insertElFirst(this.tech_.el(), this.el());
    }

    // Get rid of the original video tag reference after the first tech is loaded
    if (this.tag) {
      this.tag.player = null;
      this.tag = null;
    }
  };

  /**
   * Unload and dispose of the current playback {@link Tech}.
   *
   * @private
   */


  Player.prototype.unloadTech_ = function unloadTech_() {
    // Save the current text tracks so that we can reuse the same text tracks with the next tech
    this.videoTracks_ = this.videoTracks();
    this.textTracks_ = this.textTracks();
    this.audioTracks_ = this.audioTracks();
    this.textTracksJson_ = _textTrackListConverter2['default'].textTracksToJson(this.tech_);

    this.isReady_ = false;

    this.tech_.dispose();

    this.tech_ = false;
  };

  /**
   * Return a reference to the current {@link Tech}, but only if given an object with the
   * `IWillNotUseThisInPlugins` property having a true value. This is try and prevent misuse
   * of techs by plugins.
   *
   * @param {Object} safety
   *        An object that must contain `{IWillNotUseThisInPlugins: true}`
   *
   * @param {boolean} safety.IWillNotUseThisInPlugins
   *        Must be set to true or else this function will throw an error.
   *
   * @return {Tech}
   *         The Tech
   */


  Player.prototype.tech = function tech(safety) {
    if (safety && safety.IWillNotUseThisInPlugins) {
      return this.tech_;
    }
    var errorText = '\n      Please make sure that you are not using this inside of a plugin.\n      To disable this alert and error, please pass in an object with\n      `IWillNotUseThisInPlugins` to the `tech` method. See\n      https://github.com/videojs/video.js/issues/2617 for more info.\n    ';

    _window2['default'].alert(errorText);
    throw new Error(errorText);
  };

  /**
   * Set up click and touch listeners for the playback element
   *
   * - On desktops: a click on the video itself will toggle playback
   * - On mobile devices: a click on the video toggles controls
   *   which is done by toggling the user state between active and
   *   inactive
   * - A tap can signal that a user has become active or has become inactive
   *   e.g. a quick tap on an iPhone movie should reveal the controls. Another
   *   quick tap should hide them again (signaling the user is in an inactive
   *   viewing state)
   * - In addition to this, we still want the user to be considered inactive after
   *   a few seconds of inactivity.
   *
   * > Note: the only part of iOS interaction we can't mimic with this setup
   * is a touch and hold on the video element counting as activity in order to
   * keep the controls showing, but that shouldn't be an issue. A touch and hold
   * on any controls will still keep the user active
   *
   * @private
   */


  Player.prototype.addTechControlsListeners_ = function addTechControlsListeners_() {
    // Make sure to remove all the previous listeners in case we are called multiple times.
    this.removeTechControlsListeners_();

    // Some browsers (Chrome & IE) don't trigger a click on a flash swf, but do
    // trigger mousedown/up.
    // http://stackoverflow.com/questions/1444562/javascript-onclick-event-over-flash-object
    // Any touch events are set to block the mousedown event from happening
    this.on(this.tech_, 'mousedown', this.handleTechClick_);

    // If the controls were hidden we don't want that to change without a tap event
    // so we'll check if the controls were already showing before reporting user
    // activity
    this.on(this.tech_, 'touchstart', this.handleTechTouchStart_);
    this.on(this.tech_, 'touchmove', this.handleTechTouchMove_);
    this.on(this.tech_, 'touchend', this.handleTechTouchEnd_);

    // The tap listener needs to come after the touchend listener because the tap
    // listener cancels out any reportedUserActivity when setting userActive(false)
    this.on(this.tech_, 'tap', this.handleTechTap_);
  };

  /**
   * Remove the listeners used for click and tap controls. This is needed for
   * toggling to controls disabled, where a tap/touch should do nothing.
   *
   * @private
   */


  Player.prototype.removeTechControlsListeners_ = function removeTechControlsListeners_() {
    // We don't want to just use `this.off()` because there might be other needed
    // listeners added by techs that extend this.
    this.off(this.tech_, 'tap', this.handleTechTap_);
    this.off(this.tech_, 'touchstart', this.handleTechTouchStart_);
    this.off(this.tech_, 'touchmove', this.handleTechTouchMove_);
    this.off(this.tech_, 'touchend', this.handleTechTouchEnd_);
    this.off(this.tech_, 'mousedown', this.handleTechClick_);
  };

  /**
   * Player waits for the tech to be ready
   *
   * @private
   */


  Player.prototype.handleTechReady_ = function handleTechReady_() {
    this.triggerReady();

    // Keep the same volume as before
    if (this.cache_.volume) {
      this.techCall_('setVolume', this.cache_.volume);
    }

    // Look if the tech found a higher resolution poster while loading
    this.handleTechPosterChange_();

    // Update the duration if available
    this.handleTechDurationChange_();

    // Chrome and Safari both have issues with autoplay.
    // In Safari (5.1.1), when we move the video element into the container div, autoplay doesn't work.
    // In Chrome (15), if you have autoplay + a poster + no controls, the video gets hidden (but audio plays)
    // This fixes both issues. Need to wait for API, so it updates displays correctly
    if ((this.src() || this.currentSrc()) && this.tag && this.options_.autoplay && this.paused()) {
      try {
        // Chrome Fix. Fixed in Chrome v16.
        delete this.tag.poster;
      } catch (e) {
        (0, _log2['default'])('deleting tag.poster throws in some browsers', e);
      }
      this.play();
    }
  };

  /**
   * Retrigger the `loadstart` event that was triggered by the {@link Tech}. This
   * function will also trigger {@link Player#firstplay} if it is the first loadstart
   * for a video.
   *
   * @fires Player#loadstart
   * @fires Player#firstplay
   * @listens Tech#loadstart
   * @private
   */


  Player.prototype.handleTechLoadStart_ = function handleTechLoadStart_() {
    // TODO: Update to use `emptied` event instead. See #1277.

    this.removeClass('vjs-ended');
    this.removeClass('vjs-seeking');

    // reset the error state
    this.error(null);

    // If it's already playing we want to trigger a firstplay event now.
    // The firstplay event relies on both the play and loadstart events
    // which can happen in any order for a new source
    if (!this.paused()) {
      /**
       * Fired when the user agent begins looking for media data
       *
       * @event Player#loadstart
       * @type {EventTarget~Event}
       */
      this.trigger('loadstart');
      this.trigger('firstplay');
    } else {
      // reset the hasStarted state
      this.hasStarted(false);
      this.trigger('loadstart');
    }
  };

  /**
   * Add/remove the vjs-has-started class
   *
   * @fires Player#firstplay
   *
   * @param {boolean} hasStarted
   *        - true: adds the class
   *        - false: remove the class
   *
   * @return {boolean}
   *         the boolean value of hasStarted
   */


  Player.prototype.hasStarted = function hasStarted(_hasStarted) {
    if (_hasStarted !== undefined) {
      // only update if this is a new value
      if (this.hasStarted_ !== _hasStarted) {
        this.hasStarted_ = _hasStarted;
        if (_hasStarted) {
          this.addClass('vjs-has-started');
          // trigger the firstplay event if this newly has played
          this.trigger('firstplay');
        } else {
          this.removeClass('vjs-has-started');
        }
      }
      return this;
    }
    return !!this.hasStarted_;
  };

  /**
   * Fired whenever the media begins or resumes playback
   *
   * @see [Spec]{@link https://html.spec.whatwg.org/multipage/embedded-content.html#dom-media-play}
   * @fires Player#play
   * @listens Tech#play
   * @private
   */


  Player.prototype.handleTechPlay_ = function handleTechPlay_() {
    this.removeClass('vjs-ended');
    this.removeClass('vjs-paused');
    this.addClass('vjs-playing');

    // hide the poster when the user hits play
    this.hasStarted(true);
    /**
     * Triggered whenever an {@link Tech#play} event happens. Indicates that
     * playback has started or resumed.
     *
     * @event Player#play
     * @type {EventTarget~Event}
     */
    this.trigger('play');
  };

  /**
   * Retrigger the `waiting` event that was triggered by the {@link Tech}.
   *
   * @fires Player#waiting
   * @listens Tech#waiting
   * @private
   */


  Player.prototype.handleTechWaiting_ = function handleTechWaiting_() {
    var _this3 = this;

    this.addClass('vjs-waiting');
    /**
     * A readyState change on the DOM element has caused playback to stop.
     *
     * @event Player#waiting
     * @type {EventTarget~Event}
     */
    this.trigger('waiting');
    this.one('timeupdate', function () {
      return _this3.removeClass('vjs-waiting');
    });
  };

  /**
   * Retrigger the `canplay` event that was triggered by the {@link Tech}.
   * > Note: This is not consistent between browsers. See #1351
   *
   * @fires Player#canplay
   * @listens Tech#canplay
   * @private
   */


  Player.prototype.handleTechCanPlay_ = function handleTechCanPlay_() {
    this.removeClass('vjs-waiting');
    /**
     * The media has a readyState of HAVE_FUTURE_DATA or greater.
     *
     * @event Player#canplay
     * @type {EventTarget~Event}
     */
    this.trigger('canplay');
  };

  /**
   * Retrigger the `canplaythrough` event that was triggered by the {@link Tech}.
   *
   * @fires Player#canplaythrough
   * @listens Tech#canplaythrough
   * @private
   */


  Player.prototype.handleTechCanPlayThrough_ = function handleTechCanPlayThrough_() {
    this.removeClass('vjs-waiting');
    /**
     * The media has a readyState of HAVE_ENOUGH_DATA or greater. This means that the
     * entire media file can be played without buffering.
     *
     * @event Player#canplaythrough
     * @type {EventTarget~Event}
     */
    this.trigger('canplaythrough');
  };

  /**
   * Retrigger the `playing` event that was triggered by the {@link Tech}.
   *
   * @fires Player#playing
   * @listens Tech#playing
   * @private
   */


  Player.prototype.handleTechPlaying_ = function handleTechPlaying_() {
    this.removeClass('vjs-waiting');
    /**
     * The media is no longer blocked from playback, and has started playing.
     *
     * @event Player#playing
     * @type {EventTarget~Event}
     */
    this.trigger('playing');
  };

  /**
   * Retrigger the `seeking` event that was triggered by the {@link Tech}.
   *
   * @fires Player#seeking
   * @listens Tech#seeking
   * @private
   */


  Player.prototype.handleTechSeeking_ = function handleTechSeeking_() {
    this.addClass('vjs-seeking');
    /**
     * Fired whenever the player is jumping to a new time
     *
     * @event Player#seeking
     * @type {EventTarget~Event}
     */
    this.trigger('seeking');
  };

  /**
   * Retrigger the `seeked` event that was triggered by the {@link Tech}.
   *
   * @fires Player#seeked
   * @listens Tech#seeked
   * @private
   */


  Player.prototype.handleTechSeeked_ = function handleTechSeeked_() {
    this.removeClass('vjs-seeking');
    /**
     * Fired when the player has finished jumping to a new time
     *
     * @event Player#seeked
     * @type {EventTarget~Event}
     */
    this.trigger('seeked');
  };

  /**
   * Retrigger the `firstplay` event that was triggered by the {@link Tech}.
   *
   * @fires Player#firstplay
   * @listens Tech#firstplay
   * @deprecated As of 6.0 passing the `starttime` option to the player will be deprecated
   * @private
   */


  Player.prototype.handleTechFirstPlay_ = function handleTechFirstPlay_() {
    // If the first starttime attribute is specified
    // then we will start at the given offset in seconds
    if (this.options_.starttime) {
      _log2['default'].warn('Passing the `starttime` option to the player will be deprecated in 6.0');
      this.currentTime(this.options_.starttime);
    }

    this.addClass('vjs-has-started');
    /**
     * Fired the first time a video is played. Not part of the HLS spec, and this is
     * probably not the best implementation yet, so use sparingly. If you don't have a
     * reason to prevent playback, use `myPlayer.one('play');` instead.
     *
     * @event Player#firstplay
     * @type {EventTarget~Event}
     */
    this.trigger('firstplay');
  };

  /**
   * Retrigger the `pause` event that was triggered by the {@link Tech}.
   *
   * @fires Player#pause
   * @listens Tech#pause
   * @private
   */


  Player.prototype.handleTechPause_ = function handleTechPause_() {
    this.removeClass('vjs-playing');
    this.addClass('vjs-paused');
    /**
     * Fired whenever the media has been paused
     *
     * @event Player#pause
     * @type {EventTarget~Event}
     */
    this.trigger('pause');
  };

  /**
   * Retrigger the `ended` event that was triggered by the {@link Tech}.
   *
   * @fires Player#ended
   * @listens Tech#ended
   * @private
   */


  Player.prototype.handleTechEnded_ = function handleTechEnded_() {
    this.addClass('vjs-ended');
    if (this.options_.loop) {
      this.currentTime(0);
      this.play();
    } else if (!this.paused()) {
      this.pause();
    }

    /**
     * Fired when the end of the media resource is reached (currentTime == duration)
     *
     * @event Player#ended
     * @type {EventTarget~Event}
     */
    this.trigger('ended');
  };

  /**
   * Fired when the duration of the media resource is first known or changed
   *
   * @listens Tech#durationchange
   * @private
   */


  Player.prototype.handleTechDurationChange_ = function handleTechDurationChange_() {
    this.duration(this.techGet_('duration'));
  };

  /**
   * Handle a click on the media element to play/pause
   *
   * @param {EventTarget~Event} event
   *        the event that caused this function to trigger
   *
   * @listens Tech#mousedown
   * @private
   */


  Player.prototype.handleTechClick_ = function handleTechClick_(event) {
    // We're using mousedown to detect clicks thanks to Flash, but mousedown
    // will also be triggered with right-clicks, so we need to prevent that
    if (event.button !== 0) {
      return;
    }

    // When controls are disabled a click should not toggle playback because
    // the click is considered a control
    if (this.controls()) {
      if (this.paused()) {
        this.play();
      } else {
        this.pause();
      }
    }
  };

  /**
   * Handle a tap on the media element. It will toggle the user
   * activity state, which hides and shows the controls.
   *
   * @listens Tech#tap
   * @private
   */


  Player.prototype.handleTechTap_ = function handleTechTap_() {
    this.userActive(!this.userActive());
  };

  /**
   * Handle touch to start
   *
   * @listens Tech#touchstart
   * @private
   */


  Player.prototype.handleTechTouchStart_ = function handleTechTouchStart_() {
    this.userWasActive = this.userActive();
  };

  /**
   * Handle touch to move
   *
   * @listens Tech#touchmove
   * @private
   */


  Player.prototype.handleTechTouchMove_ = function handleTechTouchMove_() {
    if (this.userWasActive) {
      this.reportUserActivity();
    }
  };

  /**
   * Handle touch to end
   *
   * @param {EventTarget~Event} event
   *        the touchend event that triggered
   *        this function
   *
   * @listens Tech#touchend
   * @private
   */


  Player.prototype.handleTechTouchEnd_ = function handleTechTouchEnd_(event) {
    // Stop the mouse events from also happening
    event.preventDefault();
  };

  /**
   * Fired when the player switches in or out of fullscreen mode
   *
   * @private
   * @listens Player#fullscreenchange
   */


  Player.prototype.handleFullscreenChange_ = function handleFullscreenChange_() {
    if (this.isFullscreen()) {
      this.addClass('vjs-fullscreen');
    } else {
      this.removeClass('vjs-fullscreen');
    }
  };

  /**
   * native click events on the SWF aren't triggered on IE11, Win8.1RT
   * use stageclick events triggered from inside the SWF instead
   *
   * @private
   * @listens stageclick
   */


  Player.prototype.handleStageClick_ = function handleStageClick_() {
    this.reportUserActivity();
  };

  /**
   * Handle Tech Fullscreen Change
   *
   * @param {EventTarget~Event} event
   *        the fullscreenchange event that triggered this function
   *
   * @param {Object} data
   *        the data that was sent with the event
   *
   * @private
   * @listens Tech#fullscreenchange
   * @fires Player#fullscreenchange
   */


  Player.prototype.handleTechFullscreenChange_ = function handleTechFullscreenChange_(event, data) {
    if (data) {
      this.isFullscreen(data.isFullscreen);
    }
    /**
     * Fired when going in and out of fullscreen.
     *
     * @event Player#fullscreenchange
     * @type {EventTarget~Event}
     */
    this.trigger('fullscreenchange');
  };

  /**
   * Fires when an error occurred during the loading of an audio/video.
   *
   * @private
   * @listens Tech#error
   */


  Player.prototype.handleTechError_ = function handleTechError_() {
    var error = this.tech_.error();

    this.error(error);
  };

  /**
   * Retrigger the `textdata` event that was triggered by the {@link Tech}.
   *
   * @fires Player#textdata
   * @listens Tech#textdata
   * @private
   */


  Player.prototype.handleTechTextData_ = function handleTechTextData_() {
    var data = null;

    if (arguments.length > 1) {
      data = arguments[1];
    }

    /**
     * Fires when we get a textdata event from tech
     *
     * @event Player#textdata
     * @type {EventTarget~Event}
     */
    this.trigger('textdata', data);
  };

  /**
   * Get object for cached values.
   *
   * @return {Object}
   *         get the current object cache
   */


  Player.prototype.getCache = function getCache() {
    return this.cache_;
  };

  /**
   * Pass values to the playback tech
   *
   * @param {string} [method]
   *        the method to call
   *
   * @param {Object} arg
   *        the argument to pass
   *
   * @private
   */


  Player.prototype.techCall_ = function techCall_(method, arg) {
    // If it's not ready yet, call method when it is
    if (this.tech_ && !this.tech_.isReady_) {
      this.tech_.ready(function () {
        this[method](arg);
      }, true);

      // Otherwise call method now
    } else {
      try {
        if (this.tech_) {
          this.tech_[method](arg);
        }
      } catch (e) {
        (0, _log2['default'])(e);
        throw e;
      }
    }
  };

  /**
   * Get calls can't wait for the tech, and sometimes don't need to.
   *
   * @param {string} method
   *        Tech method
   *
   * @return {Function|undefined}
   *         the method or undefined
   *
   * @private
   */


  Player.prototype.techGet_ = function techGet_(method) {
    if (this.tech_ && this.tech_.isReady_) {

      // Flash likes to die and reload when you hide or reposition it.
      // In these cases the object methods go away and we get errors.
      // When that happens we'll catch the errors and inform tech that it's not ready any more.
      try {
        return this.tech_[method]();
      } catch (e) {
        // When building additional tech libs, an expected method may not be defined yet
        if (this.tech_[method] === undefined) {
          (0, _log2['default'])('Video.js: ' + method + ' method not defined for ' + this.techName_ + ' playback technology.', e);

          // When a method isn't available on the object it throws a TypeError
        } else if (e.name === 'TypeError') {
          (0, _log2['default'])('Video.js: ' + method + ' unavailable on ' + this.techName_ + ' playback technology element.', e);
          this.tech_.isReady_ = false;
        } else {
          (0, _log2['default'])(e);
        }
        throw e;
      }
    }

    return;
  };

  /**
   * start media playback
   *
   * @return {Player}
   *         A reference to the player object this function was called on
   */


  Player.prototype.play = function play() {
    // Only calls the tech's play if we already have a src loaded
    if (this.src() || this.currentSrc()) {
      this.techCall_('play');
    } else {
      this.tech_.one('loadstart', function () {
        this.play();
      });
    }

    return this;
  };

  /**
   * Pause the video playback
   *
   * @return {Player}
   *         A reference to the player object this function was called on
   */


  Player.prototype.pause = function pause() {
    this.techCall_('pause');
    return this;
  };

  /**
   * Check if the player is paused or has yet to play
   *
   * @return {boolean}
   *         - false: if the media is currently playing
   *         - true: if media is not currently playing
   */


  Player.prototype.paused = function paused() {
    // The initial state of paused should be true (in Safari it's actually false)
    return this.techGet_('paused') === false ? false : true;
  };

  /**
   * Returns whether or not the user is "scrubbing". Scrubbing is
   * when the user has clicked the progress bar handle and is
   * dragging it along the progress bar.
   *
   * @param {boolean} [isScrubbing]
   *        wether the user is or is not scrubbing
   *
   * @return {boolean|Player}
   *         A instance of the player that called this function when setting,
   *         and the value of scrubbing when getting
   */


  Player.prototype.scrubbing = function scrubbing(isScrubbing) {
    if (isScrubbing !== undefined) {
      this.scrubbing_ = !!isScrubbing;

      if (isScrubbing) {
        this.addClass('vjs-scrubbing');
      } else {
        this.removeClass('vjs-scrubbing');
      }

      return this;
    }

    return this.scrubbing_;
  };

  /**
   * Get or set the current time (in seconds)
   *
   * @param {number|string} [seconds]
   *        The time to seek to in seconds
   *
   * @return {Player|number}
   *         - the current time in seconds when getting
   *         - a reference to the current player object when setting
   */


  Player.prototype.currentTime = function currentTime(seconds) {
    if (seconds !== undefined) {

      this.techCall_('setCurrentTime', seconds);

      return this;
    }

    // cache last currentTime and return. default to 0 seconds
    //
    // Caching the currentTime is meant to prevent a massive amount of reads on the tech's
    // currentTime when scrubbing, but may not provide much performance benefit afterall.
    // Should be tested. Also something has to read the actual current time or the cache will
    // never get updated.
    this.cache_.currentTime = this.techGet_('currentTime') || 0;
    return this.cache_.currentTime;
  };

  /**
   * Normally gets the length in time of the video in seconds;
   * in all but the rarest use cases an argument will NOT be passed to the method
   *
   * > **NOTE**: The video must have started loading before the duration can be
   * known, and in the case of Flash, may not be known until the video starts
   * playing.
   *
   * @fires Player#durationchange
   *
   * @param {number} [seconds]
   *        The duration of the video to set in seconds
   *
   * @return {number|Player}
   *         - The duration of the video in seconds when getting
   *         - A reference to the player that called this function
   *           when setting
   */


  Player.prototype.duration = function duration(seconds) {
    if (seconds === undefined) {
      // return NaN if the duration is not known
      return this.cache_.duration !== undefined ? this.cache_.duration : NaN;
    }

    seconds = parseFloat(seconds);

    // Standardize on Inifity for signaling video is live
    if (seconds < 0) {
      seconds = Infinity;
    }

    if (seconds !== this.cache_.duration) {
      // Cache the last set value for optimized scrubbing (esp. Flash)
      this.cache_.duration = seconds;

      if (seconds === Infinity) {
        this.addClass('vjs-live');
      } else {
        this.removeClass('vjs-live');
      }
      /**
       * @event Player#durationchange
       * @type {EventTarget~Event}
       */
      this.trigger('durationchange');
    }

    return this;
  };

  /**
   * Calculates how much time is left in the video. Not part
   * of the native video API.
   *
   * @return {number}
   *         The time remaining in seconds
   */


  Player.prototype.remainingTime = function remainingTime() {
    return this.duration() - this.currentTime();
  };

  //
  // Kind of like an array of portions of the video that have been downloaded.

  /**
   * Get a TimeRange object with an array of the times of the video
   * that have been downloaded. If you just want the percent of the
   * video that's been downloaded, use bufferedPercent.
   *
   * @see [Buffered Spec]{@link http://dev.w3.org/html5/spec/video.html#dom-media-buffered}
   *
   * @return {TimeRange}
   *         A mock TimeRange object (following HTML spec)
   */


  Player.prototype.buffered = function buffered() {
    var buffered = this.techGet_('buffered');

    if (!buffered || !buffered.length) {
      buffered = (0, _timeRanges.createTimeRange)(0, 0);
    }

    return buffered;
  };

  /**
   * Get the percent (as a decimal) of the video that's been downloaded.
   * This method is not a part of the native HTML video API.
   *
   * @return {number}
   *         A decimal between 0 and 1 representing the percent
   *         that is bufferred 0 being 0% and 1 being 100%
   */


  Player.prototype.bufferedPercent = function bufferedPercent() {
    return (0, _buffer.bufferedPercent)(this.buffered(), this.duration());
  };

  /**
   * Get the ending time of the last buffered time range
   * This is used in the progress bar to encapsulate all time ranges.
   *
   * @return {number}
   *         The end of the last buffered time range
   */


  Player.prototype.bufferedEnd = function bufferedEnd() {
    var buffered = this.buffered();
    var duration = this.duration();
    var end = buffered.end(buffered.length - 1);

    if (end > duration) {
      end = duration;
    }

    return end;
  };

  /**
   * Get or set the current volume of the media
   *
   * @param  {number} [percentAsDecimal]
   *         The new volume as a decimal percent:
   *         - 0 is muted/0%/off
   *         - 1.0 is 100%/full
   *         - 0.5 is half volume or 50%
   *
   * @return {Player|number}
   *         a reference to the calling player when setting and the
   *         current volume as a percent when getting
   */


  Player.prototype.volume = function volume(percentAsDecimal) {
    var vol = void 0;

    if (percentAsDecimal !== undefined) {
      // Force value to between 0 and 1
      vol = Math.max(0, Math.min(1, parseFloat(percentAsDecimal)));
      this.cache_.volume = vol;
      this.techCall_('setVolume', vol);

      return this;
    }

    // Default to 1 when returning current volume.
    vol = parseFloat(this.techGet_('volume'));
    return isNaN(vol) ? 1 : vol;
  };

  /**
   * Get the current muted state, or turn mute on or off
   *
   * @param {boolean} [muted]
   *        - true to mute
   *        - false to unmute
   *
   * @return {boolean|Player}
   *         - true if mute is on and getting
   *         - false if mute is off and getting
   *         - A reference to the current player when setting
   */


  Player.prototype.muted = function muted(_muted) {
    if (_muted !== undefined) {
      this.techCall_('setMuted', _muted);
      return this;
    }
    return this.techGet_('muted') || false;
  };

  /**
   * Check if current tech can support native fullscreen
   * (e.g. with built in controls like iOS, so not our flash swf)
   *
   * @return {boolean}
   *         if native fullscreen is supported
   */


  Player.prototype.supportsFullScreen = function supportsFullScreen() {
    return this.techGet_('supportsFullScreen') || false;
  };

  /**
   * Check if the player is in fullscreen mode or tell the player that it
   * is or is not in fullscreen mode.
   *
   * > NOTE: As of the latest HTML5 spec, isFullscreen is no longer an official
   * property and instead document.fullscreenElement is used. But isFullscreen is
   * still a valuable property for internal player workings.
   *
   * @param  {boolean} [isFS]
   *         Set the players current fullscreen state
   *
   * @return {boolean|Player}
   *         - true if fullscreen is on and getting
   *         - false if fullscreen is off and getting
   *         - A reference to the current player when setting
   */


  Player.prototype.isFullscreen = function isFullscreen(isFS) {
    if (isFS !== undefined) {
      this.isFullscreen_ = !!isFS;
      return this;
    }
    return !!this.isFullscreen_;
  };

  /**
   * Increase the size of the video to full screen
   * In some browsers, full screen is not supported natively, so it enters
   * "full window mode", where the video fills the browser window.
   * In browsers and devices that support native full screen, sometimes the
   * browser's default controls will be shown, and not the Video.js custom skin.
   * This includes most mobile devices (iOS, Android) and older versions of
   * Safari.
   *
   * @fires Player#fullscreenchange
   * @return {Player}
   *         A reference to the current player
   */


  Player.prototype.requestFullscreen = function requestFullscreen() {
    var fsApi = _fullscreenApi2['default'];

    this.isFullscreen(true);

    if (fsApi.requestFullscreen) {
      // the browser supports going fullscreen at the element level so we can
      // take the controls fullscreen as well as the video

      // Trigger fullscreenchange event after change
      // We have to specifically add this each time, and remove
      // when canceling fullscreen. Otherwise if there's multiple
      // players on a page, they would all be reacting to the same fullscreen
      // events
      Events.on(_document2['default'], fsApi.fullscreenchange, Fn.bind(this, function documentFullscreenChange(e) {
        this.isFullscreen(_document2['default'][fsApi.fullscreenElement]);

        // If cancelling fullscreen, remove event listener.
        if (this.isFullscreen() === false) {
          Events.off(_document2['default'], fsApi.fullscreenchange, documentFullscreenChange);
        }
        /**
         * @event Player#fullscreenchange
         * @type {EventTarget~Event}
         */
        this.trigger('fullscreenchange');
      }));

      this.el_[fsApi.requestFullscreen]();
    } else if (this.tech_.supportsFullScreen()) {
      // we can't take the video.js controls fullscreen but we can go fullscreen
      // with native controls
      this.techCall_('enterFullScreen');
    } else {
      // fullscreen isn't supported so we'll just stretch the video element to
      // fill the viewport
      this.enterFullWindow();
      /**
       * @event Player#fullscreenchange
       * @type {EventTarget~Event}
       */
      this.trigger('fullscreenchange');
    }

    return this;
  };

  /**
   * Return the video to its normal size after having been in full screen mode
   *
   * @fires Player#fullscreenchange
   *
   * @return {Player}
   *         A reference to the current player
   */


  Player.prototype.exitFullscreen = function exitFullscreen() {
    var fsApi = _fullscreenApi2['default'];

    this.isFullscreen(false);

    // Check for browser element fullscreen support
    if (fsApi.requestFullscreen) {
      _document2['default'][fsApi.exitFullscreen]();
    } else if (this.tech_.supportsFullScreen()) {
      this.techCall_('exitFullScreen');
    } else {
      this.exitFullWindow();
      /**
       * @event Player#fullscreenchange
       * @type {EventTarget~Event}
       */
      this.trigger('fullscreenchange');
    }

    return this;
  };

  /**
   * When fullscreen isn't supported we can stretch the
   * video container to as wide as the browser will let us.
   *
   * @fires Player#enterFullWindow
   */


  Player.prototype.enterFullWindow = function enterFullWindow() {
    this.isFullWindow = true;

    // Storing original doc overflow value to return to when fullscreen is off
    this.docOrigOverflow = _document2['default'].documentElement.style.overflow;

    // Add listener for esc key to exit fullscreen
    Events.on(_document2['default'], 'keydown', Fn.bind(this, this.fullWindowOnEscKey));

    // Hide any scroll bars
    _document2['default'].documentElement.style.overflow = 'hidden';

    // Apply fullscreen styles
    Dom.addElClass(_document2['default'].body, 'vjs-full-window');

    /**
     * @event Player#enterFullWindow
     * @type {EventTarget~Event}
     */
    this.trigger('enterFullWindow');
  };

  /**
   * Check for call to either exit full window or
   * full screen on ESC key
   *
   * @param {string} event
   *        Event to check for key press
   */


  Player.prototype.fullWindowOnEscKey = function fullWindowOnEscKey(event) {
    if (event.keyCode === 27) {
      if (this.isFullscreen() === true) {
        this.exitFullscreen();
      } else {
        this.exitFullWindow();
      }
    }
  };

  /**
   * Exit full window
   *
   * @fires Player#exitFullWindow
   */


  Player.prototype.exitFullWindow = function exitFullWindow() {
    this.isFullWindow = false;
    Events.off(_document2['default'], 'keydown', this.fullWindowOnEscKey);

    // Unhide scroll bars.
    _document2['default'].documentElement.style.overflow = this.docOrigOverflow;

    // Remove fullscreen styles
    Dom.removeElClass(_document2['default'].body, 'vjs-full-window');

    // Resize the box, controller, and poster to original sizes
    // this.positionAll();
    /**
     * @event Player#exitFullWindow
     * @type {EventTarget~Event}
     */
    this.trigger('exitFullWindow');
  };

  /**
   * Check whether the player can play a given mimetype
   *
   * @see https://www.w3.org/TR/2011/WD-html5-20110113/video.html#dom-navigator-canplaytype
   *
   * @param {string} type
   *        The mimetype to check
   *
   * @return {string}
   *         'probably', 'maybe', or '' (empty string)
   */


  Player.prototype.canPlayType = function canPlayType(type) {
    var can = void 0;

    // Loop through each playback technology in the options order
    for (var i = 0, j = this.options_.techOrder; i < j.length; i++) {
      var techName = (0, _toTitleCase2['default'])(j[i]);
      var tech = _tech2['default'].getTech(techName);

      // Support old behavior of techs being registered as components.
      // Remove once that deprecated behavior is removed.
      if (!tech) {
        tech = _component2['default'].getComponent(techName);
      }

      // Check if the current tech is defined before continuing
      if (!tech) {
        _log2['default'].error('The "' + techName + '" tech is undefined. Skipped browser support check for that tech.');
        continue;
      }

      // Check if the browser supports this technology
      if (tech.isSupported()) {
        can = tech.canPlayType(type);

        if (can) {
          return can;
        }
      }
    }

    return '';
  };

  /**
   * Select source based on tech-order or source-order
   * Uses source-order selection if `options.sourceOrder` is truthy. Otherwise,
   * defaults to tech-order selection
   *
   * @param {Array} sources
   *        The sources for a media asset
   *
   * @return {Object|boolean}
   *         Object of source and tech order or false
   */


  Player.prototype.selectSource = function selectSource(sources) {
    var _this4 = this;

    // Get only the techs specified in `techOrder` that exist and are supported by the
    // current platform
    var techs = this.options_.techOrder.map(_toTitleCase2['default']).map(function (techName) {
      // `Component.getComponent(...)` is for support of old behavior of techs
      // being registered as components.
      // Remove once that deprecated behavior is removed.
      return [techName, _tech2['default'].getTech(techName) || _component2['default'].getComponent(techName)];
    }).filter(function (_ref) {
      var techName = _ref[0],
          tech = _ref[1];

      // Check if the current tech is defined before continuing
      if (tech) {
        // Check if the browser supports this technology
        return tech.isSupported();
      }

      _log2['default'].error('The "' + techName + '" tech is undefined. Skipped browser support check for that tech.');
      return false;
    });

    // Iterate over each `innerArray` element once per `outerArray` element and execute
    // `tester` with both. If `tester` returns a non-falsy value, exit early and return
    // that value.
    var findFirstPassingTechSourcePair = function findFirstPassingTechSourcePair(outerArray, innerArray, tester) {
      var found = void 0;

      outerArray.some(function (outerChoice) {
        return innerArray.some(function (innerChoice) {
          found = tester(outerChoice, innerChoice);

          if (found) {
            return true;
          }
        });
      });

      return found;
    };

    var foundSourceAndTech = void 0;
    var flip = function flip(fn) {
      return function (a, b) {
        return fn(b, a);
      };
    };
    var finder = function finder(_ref2, source) {
      var techName = _ref2[0],
          tech = _ref2[1];

      if (tech.canPlaySource(source, _this4.options_[techName.toLowerCase()])) {
        return { source: source, tech: techName };
      }
    };

    // Depending on the truthiness of `options.sourceOrder`, we swap the order of techs and sources
    // to select from them based on their priority.
    if (this.options_.sourceOrder) {
      // Source-first ordering
      foundSourceAndTech = findFirstPassingTechSourcePair(sources, techs, flip(finder));
    } else {
      // Tech-first ordering
      foundSourceAndTech = findFirstPassingTechSourcePair(techs, sources, finder);
    }

    return foundSourceAndTech || false;
  };

  /**
   * The source function updates the video source
   * There are three types of variables you can pass as the argument.
   * **URL string**: A URL to the the video file. Use this method if you are sure
   * the current playback technology (HTML5/Flash) can support the source you
   * provide. Currently only MP4 files can be used in both HTML5 and Flash.
   *
   * @param {Tech~SourceObject|Tech~SourceObject[]} [source]
   *        One SourceObject or an array of SourceObjects
   *
   * @return {string|Player}
   *         - The current video source when getting
   *         - The player when setting
   */


  Player.prototype.src = function src(source) {
    if (source === undefined) {
      return this.techGet_('src');
    }

    var currentTech = _tech2['default'].getTech(this.techName_);

    // Support old behavior of techs being registered as components.
    // Remove once that deprecated behavior is removed.
    if (!currentTech) {
      currentTech = _component2['default'].getComponent(this.techName_);
    }

    // case: Array of source objects to choose from and pick the best to play
    if (Array.isArray(source)) {
      this.sourceList_(source);

      // case: URL String (http://myvideo...)
    } else if (typeof source === 'string') {
      // create a source object from the string
      this.src({ src: source });

      // case: Source object { src: '', type: '' ... }
    } else if (source instanceof Object) {
      // check if the source has a type and the loaded tech cannot play the source
      // if there's no type we'll just try the current tech
      if (source.type && !currentTech.canPlaySource(source, this.options_[this.techName_.toLowerCase()])) {
        // create a source list with the current source and send through
        // the tech loop to check for a compatible technology
        this.sourceList_([source]);
      } else {
        this.cache_.sources = null;
        this.cache_.source = source;
        this.cache_.src = source.src;

        this.currentType_ = source.type || '';

        // wait until the tech is ready to set the source
        this.ready(function () {

          // The setSource tech method was added with source handlers
          // so older techs won't support it
          // We need to check the direct prototype for the case where subclasses
          // of the tech do not support source handlers
          if (currentTech.prototype.hasOwnProperty('setSource')) {
            this.techCall_('setSource', source);
          } else {
            this.techCall_('src', source.src);
          }

          if (this.options_.preload === 'auto') {
            this.load();
          }

          if (this.options_.autoplay) {
            this.play();
          }

          // Set the source synchronously if possible (#2326)
        }, true);
      }
    }

    return this;
  };

  /**
   * Handle an array of source objects
   *
   * @param  {Tech~SourceObject[]} sources
   *         Array of source objects
   *
   * @private
   */


  Player.prototype.sourceList_ = function sourceList_(sources) {
    var sourceTech = this.selectSource(sources);

    if (sourceTech) {
      if (sourceTech.tech === this.techName_) {
        // if this technology is already loaded, set the source
        this.src(sourceTech.source);
      } else {
        // load this technology with the chosen source
        this.loadTech_(sourceTech.tech, sourceTech.source);
      }

      this.cache_.sources = sources;
    } else {
      // We need to wrap this in a timeout to give folks a chance to add error event handlers
      this.setTimeout(function () {
        this.error({ code: 4, message: this.localize(this.options_.notSupportedMessage) });
      }, 0);

      // we could not find an appropriate tech, but let's still notify the delegate that this is it
      // this needs a better comment about why this is needed
      this.triggerReady();
    }
  };

  /**
   * Begin loading the src data.
   *
   * @return {Player}
   *         A reference to the player
   */


  Player.prototype.load = function load() {
    this.techCall_('load');
    return this;
  };

  /**
   * Reset the player. Loads the first tech in the techOrder,
   * and calls `reset` on the tech`.
   *
   * @return {Player}
   *         A reference to the player
   */


  Player.prototype.reset = function reset() {
    this.loadTech_((0, _toTitleCase2['default'])(this.options_.techOrder[0]), null);
    this.techCall_('reset');
    return this;
  };

  /**
   * Returns all of the current source objects.
   *
   * @return {Tech~SourceObject[]}
   *         The current source objects
   */


  Player.prototype.currentSources = function currentSources() {
    var source = this.currentSource();
    var sources = [];

    // assume `{}` or `{ src }`
    if (Object.keys(source).length !== 0) {
      sources.push(source);
    }

    return this.cache_.sources || sources;
  };

  /**
   * Returns the current source object.
   *
   * @return {Tech~SourceObject}
   *         The current source object
   */


  Player.prototype.currentSource = function currentSource() {
    var source = {};
    var src = this.currentSrc();

    if (src) {
      source.src = src;
    }

    return this.cache_.source || source;
  };

  /**
   * Returns the fully qualified URL of the current source value e.g. http://mysite.com/video.mp4
   * Can be used in conjuction with `currentType` to assist in rebuilding the current source object.
   *
   * @return {string}
   *         The current source
   */


  Player.prototype.currentSrc = function currentSrc() {
    return this.techGet_('currentSrc') || this.cache_.src || '';
  };

  /**
   * Get the current source type e.g. video/mp4
   * This can allow you rebuild the current source object so that you could load the same
   * source and tech later
   *
   * @return {string}
   *         The source MIME type
   */


  Player.prototype.currentType = function currentType() {
    return this.currentType_ || '';
  };

  /**
   * Get or set the preload attribute
   *
   * @param {boolean} [value]
   *        - true means that we should preload
   *        - false maens that we should not preload
   *
   * @return {string|Player}
   *         - the preload attribute value when getting
   *         - the player when setting
   */


  Player.prototype.preload = function preload(value) {
    if (value !== undefined) {
      this.techCall_('setPreload', value);
      this.options_.preload = value;
      return this;
    }
    return this.techGet_('preload');
  };

  /**
   * Get or set the autoplay attribute.
   *
   * @param {boolean} [value]
   *        - true means that we should autoplay
   *        - false maens that we should not autoplay
   *
   * @return {string|Player}
   *         - the current value of autoplay
   *         - the player when setting
   */


  Player.prototype.autoplay = function autoplay(value) {
    if (value !== undefined) {
      this.techCall_('setAutoplay', value);
      this.options_.autoplay = value;
      return this;
    }
    return this.techGet_('autoplay', value);
  };

  /**
   * Set or unset the playsinline attribute.
   * Playsinline tells the browser that non-fullscreen playback is preferred.
   *
   * @param {boolean} [value]
   *        - true means that we should try to play inline by default
   *        - false means that we should use the browser's default playback mode,
   *          which in most cases is inline. iOS Safari is a notable exception
   *          and plays fullscreen by default.
   *
   * @return {string|Player}
   *         - the current value of playsinline
   *         - the player when setting
   *
   * @see [Spec]{@link https://html.spec.whatwg.org/#attr-video-playsinline}
   */


  Player.prototype.playsinline = function playsinline(value) {
    if (value !== undefined) {
      this.techCall_('setPlaysinline', value);
      this.options_.playsinline = value;
      return this;
    }
    return this.techGet_('playsinline');
  };

  /**
   * Get or set the loop attribute on the video element.
   *
   * @param {boolean} [value]
   *        - true means that we should loop the video
   *        - false means that we should not loop the video
   *
   * @return {string|Player}
   *         - the current value of loop when getting
   *         - the player when setting
   */


  Player.prototype.loop = function loop(value) {
    if (value !== undefined) {
      this.techCall_('setLoop', value);
      this.options_.loop = value;
      return this;
    }
    return this.techGet_('loop');
  };

  /**
   * Get or set the poster image source url
   *
   * @fires Player#posterchange
   *
   * @param {string} [src]
   *        Poster image source URL
   *
   * @return {string|Player}
   *         - the current value of poster when getting
   *         - the player when setting
   */


  Player.prototype.poster = function poster(src) {
    if (src === undefined) {
      return this.poster_;
    }

    // The correct way to remove a poster is to set as an empty string
    // other falsey values will throw errors
    if (!src) {
      src = '';
    }

    // update the internal poster variable
    this.poster_ = src;

    // update the tech's poster
    this.techCall_('setPoster', src);

    // alert components that the poster has been set
    /**
     * This event fires when the poster image is changed on the player.
     *
     * @event Player#posterchange
     * @type {EventTarget~Event}
     */
    this.trigger('posterchange');

    return this;
  };

  /**
   * Some techs (e.g. YouTube) can provide a poster source in an
   * asynchronous way. We want the poster component to use this
   * poster source so that it covers up the tech's controls.
   * (YouTube's play button). However we only want to use this
   * soruce if the player user hasn't set a poster through
   * the normal APIs.
   *
   * @fires Player#posterchange
   * @listens Tech#posterchange
   * @private
   */


  Player.prototype.handleTechPosterChange_ = function handleTechPosterChange_() {
    if (!this.poster_ && this.tech_ && this.tech_.poster) {
      this.poster_ = this.tech_.poster() || '';

      // Let components know the poster has changed
      this.trigger('posterchange');
    }
  };

  /**
   * Get or set whether or not the controls are showing.
   *
   * @fires Player#controlsenabled
   *
   * @param {boolean} [bool]
   *        - true to turn controls on
   *        - false to turn controls off
   *
   * @return {boolean|Player}
   *         - the current value of controls when getting
   *         - the player when setting
   */


  Player.prototype.controls = function controls(bool) {
    if (bool !== undefined) {
      bool = !!bool;

      // Don't trigger a change event unless it actually changed
      if (this.controls_ !== bool) {
        this.controls_ = bool;

        if (this.usingNativeControls()) {
          this.techCall_('setControls', bool);
        }

        if (bool) {
          this.removeClass('vjs-controls-disabled');
          this.addClass('vjs-controls-enabled');
          /**
           * @event Player#controlsenabled
           * @type {EventTarget~Event}
           */
          this.trigger('controlsenabled');

          if (!this.usingNativeControls()) {
            this.addTechControlsListeners_();
          }
        } else {
          this.removeClass('vjs-controls-enabled');
          this.addClass('vjs-controls-disabled');
          /**
           * @event Player#controlsdisabled
           * @type {EventTarget~Event}
           */
          this.trigger('controlsdisabled');

          if (!this.usingNativeControls()) {
            this.removeTechControlsListeners_();
          }
        }
      }
      return this;
    }
    return !!this.controls_;
  };

  /**
   * Toggle native controls on/off. Native controls are the controls built into
   * devices (e.g. default iPhone controls), Flash, or other techs
   * (e.g. Vimeo Controls)
   * **This should only be set by the current tech, because only the tech knows
   * if it can support native controls**
   *
   * @fires Player#usingnativecontrols
   * @fires Player#usingcustomcontrols
   *
   * @param {boolean} [bool]
   *        - true to turn native controls on
   *        - false to turn native controls off
   *
   * @return {boolean|Player}
   *         - the current value of native controls when getting
   *         - the player when setting
   */


  Player.prototype.usingNativeControls = function usingNativeControls(bool) {
    if (bool !== undefined) {
      bool = !!bool;

      // Don't trigger a change event unless it actually changed
      if (this.usingNativeControls_ !== bool) {
        this.usingNativeControls_ = bool;
        if (bool) {
          this.addClass('vjs-using-native-controls');

          /**
           * player is using the native device controls
           *
           * @event Player#usingnativecontrols
           * @type {EventTarget~Event}
           */
          this.trigger('usingnativecontrols');
        } else {
          this.removeClass('vjs-using-native-controls');

          /**
           * player is using the custom HTML controls
           *
           * @event Player#usingcustomcontrols
           * @type {EventTarget~Event}
           */
          this.trigger('usingcustomcontrols');
        }
      }
      return this;
    }
    return !!this.usingNativeControls_;
  };

  /**
   * Set or get the current MediaError
   *
   * @fires Player#error
   *
   * @param  {MediaError|string|number} [err]
   *         A MediaError or a string/number to be turned
   *         into a MediaError
   *
   * @return {MediaError|null|Player}
   *         - The current MediaError when getting (or null)
   *         - The player when setting
   */


  Player.prototype.error = function error(err) {
    if (err === undefined) {
      return this.error_ || null;
    }

    // restoring to default
    if (err === null) {
      this.error_ = err;
      this.removeClass('vjs-error');
      if (this.errorDisplay) {
        this.errorDisplay.close();
      }
      return this;
    }

    this.error_ = new _mediaError2['default'](err);

    // add the vjs-error classname to the player
    this.addClass('vjs-error');

    // log the name of the error type and any message
    // ie8 just logs "[object object]" if you just log the error object
    _log2['default'].error('(CODE:' + this.error_.code + ' ' + _mediaError2['default'].errorTypes[this.error_.code] + ')', this.error_.message, this.error_);

    /**
     * @event Player#error
     * @type {EventTarget~Event}
     */
    this.trigger('error');

    return this;
  };

  /**
   * Report user activity
   *
   * @param {Object} event
   *        Event object
   */


  Player.prototype.reportUserActivity = function reportUserActivity(event) {
    this.userActivity_ = true;
  };

  /**
   * Get/set if user is active
   *
   * @fires Player#useractive
   * @fires Player#userinactive
   *
   * @param {boolean} [bool]
   *        - true if the user is active
   *        - false if the user is inactive
   * @return {boolean|Player}
   *         - the current value of userActive when getting
   *         - the player when setting
   */


  Player.prototype.userActive = function userActive(bool) {
    if (bool !== undefined) {
      bool = !!bool;
      if (bool !== this.userActive_) {
        this.userActive_ = bool;
        if (bool) {
          // If the user was inactive and is now active we want to reset the
          // inactivity timer
          this.userActivity_ = true;
          this.removeClass('vjs-user-inactive');
          this.addClass('vjs-user-active');
          /**
           * @event Player#useractive
           * @type {EventTarget~Event}
           */
          this.trigger('useractive');
        } else {
          // We're switching the state to inactive manually, so erase any other
          // activity
          this.userActivity_ = false;

          // Chrome/Safari/IE have bugs where when you change the cursor it can
          // trigger a mousemove event. This causes an issue when you're hiding
          // the cursor when the user is inactive, and a mousemove signals user
          // activity. Making it impossible to go into inactive mode. Specifically
          // this happens in fullscreen when we really need to hide the cursor.
          //
          // When this gets resolved in ALL browsers it can be removed
          // https://code.google.com/p/chromium/issues/detail?id=103041
          if (this.tech_) {
            this.tech_.one('mousemove', function (e) {
              e.stopPropagation();
              e.preventDefault();
            });
          }

          this.removeClass('vjs-user-active');
          this.addClass('vjs-user-inactive');
          /**
           * @event Player#userinactive
           * @type {EventTarget~Event}
           */
          this.trigger('userinactive');
        }
      }
      return this;
    }
    return this.userActive_;
  };

  /**
   * Listen for user activity based on timeout value
   *
   * @private
   */


  Player.prototype.listenForUserActivity_ = function listenForUserActivity_() {
    var mouseInProgress = void 0;
    var lastMoveX = void 0;
    var lastMoveY = void 0;
    var handleActivity = Fn.bind(this, this.reportUserActivity);

    var handleMouseMove = function handleMouseMove(e) {
      // #1068 - Prevent mousemove spamming
      // Chrome Bug: https://code.google.com/p/chromium/issues/detail?id=366970
      if (e.screenX !== lastMoveX || e.screenY !== lastMoveY) {
        lastMoveX = e.screenX;
        lastMoveY = e.screenY;
        handleActivity();
      }
    };

    var handleMouseDown = function handleMouseDown() {
      handleActivity();
      // For as long as the they are touching the device or have their mouse down,
      // we consider them active even if they're not moving their finger or mouse.
      // So we want to continue to update that they are active
      this.clearInterval(mouseInProgress);
      // Setting userActivity=true now and setting the interval to the same time
      // as the activityCheck interval (250) should ensure we never miss the
      // next activityCheck
      mouseInProgress = this.setInterval(handleActivity, 250);
    };

    var handleMouseUp = function handleMouseUp(event) {
      handleActivity();
      // Stop the interval that maintains activity if the mouse/touch is down
      this.clearInterval(mouseInProgress);
    };

    // Any mouse movement will be considered user activity
    this.on('mousedown', handleMouseDown);
    this.on('mousemove', handleMouseMove);
    this.on('mouseup', handleMouseUp);

    // Listen for keyboard navigation
    // Shouldn't need to use inProgress interval because of key repeat
    this.on('keydown', handleActivity);
    this.on('keyup', handleActivity);

    // Run an interval every 250 milliseconds instead of stuffing everything into
    // the mousemove/touchmove function itself, to prevent performance degradation.
    // `this.reportUserActivity` simply sets this.userActivity_ to true, which
    // then gets picked up by this loop
    // http://ejohn.org/blog/learning-from-twitter/
    var inactivityTimeout = void 0;

    this.setInterval(function () {
      // Check to see if mouse/touch activity has happened
      if (this.userActivity_) {
        // Reset the activity tracker
        this.userActivity_ = false;

        // If the user state was inactive, set the state to active
        this.userActive(true);

        // Clear any existing inactivity timeout to start the timer over
        this.clearTimeout(inactivityTimeout);

        var timeout = this.options_.inactivityTimeout;

        if (timeout > 0) {
          // In <timeout> milliseconds, if no more activity has occurred the
          // user will be considered inactive
          inactivityTimeout = this.setTimeout(function () {
            // Protect against the case where the inactivityTimeout can trigger just
            // before the next user activity is picked up by the activity check loop
            // causing a flicker
            if (!this.userActivity_) {
              this.userActive(false);
            }
          }, timeout);
        }
      }
    }, 250);
  };

  /**
   * Gets or sets the current playback rate. A playback rate of
   * 1.0 represents normal speed and 0.5 would indicate half-speed
   * playback, for instance.
   *
   * @see https://html.spec.whatwg.org/multipage/embedded-content.html#dom-media-playbackrate
   *
   * @param {number} [rate]
   *       New playback rate to set.
   *
   * @return {number|Player}
   *         - The current playback rate when getting or 1.0
   *         - the player when setting
   */


  Player.prototype.playbackRate = function playbackRate(rate) {
    if (rate !== undefined) {
      this.techCall_('setPlaybackRate', rate);
      return this;
    }

    if (this.tech_ && this.tech_.featuresPlaybackRate) {
      return this.techGet_('playbackRate');
    }
    return 1.0;
  };

  /**
   * Gets or sets the audio flag
   *
   * @param {boolean} bool
   *        - true signals that this is an audio player
   *        - false signals that this is not an audio player
   *
   * @return {Player|boolean}
   *         - the current value of isAudio when getting
   *         - the player if setting
   */


  Player.prototype.isAudio = function isAudio(bool) {
    if (bool !== undefined) {
      this.isAudio_ = !!bool;
      return this;
    }

    return !!this.isAudio_;
  };

  /**
   * Get the {@link VideoTrackList}
   *
   * @see https://html.spec.whatwg.org/multipage/embedded-content.html#videotracklist
   *
   * @return {VideoTrackList}
   *         the current video track list
   */


  Player.prototype.videoTracks = function videoTracks() {
    // if we have not yet loadTech_, we create videoTracks_
    // these will be passed to the tech during loading
    if (!this.tech_) {
      this.videoTracks_ = this.videoTracks_ || new _videoTrackList2['default']();
      return this.videoTracks_;
    }

    return this.tech_.videoTracks();
  };

  /**
   * Get the {@link AudioTrackList}
   *
   * @see https://html.spec.whatwg.org/multipage/embedded-content.html#audiotracklist
   *
   * @return {AudioTrackList}
   *         the current audio track list
   */


  Player.prototype.audioTracks = function audioTracks() {
    // if we have not yet loadTech_, we create videoTracks_
    // these will be passed to the tech during loading
    if (!this.tech_) {
      this.audioTracks_ = this.audioTracks_ || new _audioTrackList2['default']();
      return this.audioTracks_;
    }

    return this.tech_.audioTracks();
  };

  /**
   * Get the {@link TextTrackList}
   *
   * Text tracks are tracks of timed text events.
   * - Captions: text displayed over the video
   *             for the hearing impaired
   * - Subtitles: text displayed over the video for
   *              those who don't understand language in the video
   * - Chapters: text displayed in a menu allowing the user to jump
   *             to particular points (chapters) in the video
   * - Descriptions: (not yet implemented) audio descriptions that are read back to
   *                 the user by a screen reading device
   *
   * @see http://www.w3.org/html/wg/drafts/html/master/embedded-content-0.html#dom-media-texttracks
   *
   * @return {TextTrackList|undefined}
   *         The current TextTrackList or undefined if
   *         or undefined if we don't have a tech
   */


  Player.prototype.textTracks = function textTracks() {
    // cannot use techGet_ directly because it checks to see whether the tech is ready.
    // Flash is unlikely to be ready in time but textTracks should still work.
    if (this.tech_) {
      return this.tech_.textTracks();
    }
  };

  /**
   * Get the "remote" {@link TextTrackList}. Remote Text Tracks
   * are tracks that were added to the HTML video element and can
   * be removed, whereas normal texttracks cannot be removed.
   *
   *
   * @return {TextTrackList|undefined}
   *         The current remote text track list or undefined
   *         if we don't have a tech
   */


  Player.prototype.remoteTextTracks = function remoteTextTracks() {
    if (this.tech_) {
      return this.tech_.remoteTextTracks();
    }
  };

  /**
   * Get the "remote" {@link HTMLTrackElementList}.
   * This gives the user all of the DOM elements that match up
   * with the remote {@link TextTrackList}.
   *
   * @return {HTMLTrackElementList}
   *         The current remote text track list elements
   *         or undefined if we don't have a tech
   */


  Player.prototype.remoteTextTrackEls = function remoteTextTrackEls() {
    if (this.tech_) {
      return this.tech_.remoteTextTrackEls();
    }
  };

  /**
   * A helper method for adding a {@link TextTrack} to our
   * {@link TextTrackList}.
   *
   * In addition to the W3C settings we allow adding additional info through options.
   *
   * @see http://www.w3.org/html/wg/drafts/html/master/embedded-content-0.html#dom-media-addtexttrack
   *
   * @param {string} [kind]
   *        the kind of TextTrack you are adding
   *
   * @param {string} [label]
   *        the label to give the TextTrack label
   *
   * @param {string} [language]
   *        the language to set on the TextTrack
   *
   * @return {TextTrack|undefined}
   *         the TextTrack that was added or undefined
   *         if there is no tech
   */


  Player.prototype.addTextTrack = function addTextTrack(kind, label, language) {
    if (this.tech_) {
      return this.tech_.addTextTrack(kind, label, language);
    }
  };

  /**
   * Create a remote {@link TextTrack} and an {@link HTMLTrackElement}. It will
   * automatically removed from the video element whenever the source changes, unless
   * manualCleanup is set to false.
   *
   * @param {Object} options
   *        Options to pass to {@link HTMLTrackElement} during creation. See
   *        {@link HTMLTrackElement} for object properties that you should use.
   *
   * @param {boolean} [manualCleanup=true] if set to false, the TextTrack will be
   *
   * @return {HTMLTrackElement}
   *         the HTMLTrackElement that was created and added
   *         to the HTMLTrackElementList and the remote
   *         TextTrackList
   *
   * @deprecated The default value of the "manualCleanup" parameter will default
   *             to "false" in upcoming versions of Video.js
   */


  Player.prototype.addRemoteTextTrack = function addRemoteTextTrack(options, manualCleanup) {
    if (this.tech_) {
      return this.tech_.addRemoteTextTrack(options, manualCleanup);
    }
  };

  /**
   * Remove a remote {@link TextTrack} from the respective
   * {@link TextTrackList} and {@link HTMLTrackElementList}.
   *
   * @param {Object} track
   *        Remote {@link TextTrack} to remove
   *
   * @return {undefined}
   *         does not return anything
   */


  Player.prototype.removeRemoteTextTrack = function removeRemoteTextTrack() {
    var _ref3 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
        _ref3$track = _ref3.track,
        track = _ref3$track === undefined ? arguments[0] : _ref3$track;

    // destructure the input into an object with a track argument, defaulting to arguments[0]
    // default the whole argument to an empty object if nothing was passed in

    if (this.tech_) {
      return this.tech_.removeRemoteTextTrack(track);
    }
  };

  /**
   * Gets available media playback quality metrics as specified by the W3C's Media
   * Playback Quality API.
   *
   * @see [Spec]{@link https://wicg.github.io/media-playback-quality}
   *
   * @return {Object|undefined}
   *         An object with supported media playback quality metrics or undefined if there
   *         is no tech or the tech does not support it.
   */


  Player.prototype.getVideoPlaybackQuality = function getVideoPlaybackQuality() {
    return this.techGet_('getVideoPlaybackQuality');
  };

  /**
   * Get video width
   *
   * @return {number}
   *         current video width
   */


  Player.prototype.videoWidth = function videoWidth() {
    return this.tech_ && this.tech_.videoWidth && this.tech_.videoWidth() || 0;
  };

  /**
   * Get video height
   *
   * @return {number}
   *         current video height
   */


  Player.prototype.videoHeight = function videoHeight() {
    return this.tech_ && this.tech_.videoHeight && this.tech_.videoHeight() || 0;
  };

  // Methods to add support for
  // initialTime: function() { return this.techCall_('initialTime'); },
  // startOffsetTime: function() { return this.techCall_('startOffsetTime'); },
  // played: function() { return this.techCall_('played'); },
  // defaultPlaybackRate: function() { return this.techCall_('defaultPlaybackRate'); },
  // defaultMuted: function() { return this.techCall_('defaultMuted'); }

  /**
   * The player's language code
   * NOTE: The language should be set in the player options if you want the
   * the controls to be built with a specific language. Changing the lanugage
   * later will not update controls text.
   *
   * @param {string} [code]
   *        the language code to set the player to
   *
   * @return {string|Player}
   *         - The current language code when getting
   *         - A reference to the player when setting
   */


  Player.prototype.language = function language(code) {
    if (code === undefined) {
      return this.language_;
    }

    this.language_ = String(code).toLowerCase();
    return this;
  };

  /**
   * Get the player's language dictionary
   * Merge every time, because a newly added plugin might call videojs.addLanguage() at any time
   * Languages specified directly in the player options have precedence
   *
   * @return {Array}
   *         An array of of supported languages
   */


  Player.prototype.languages = function languages() {
    return (0, _mergeOptions2['default'])(Player.prototype.options_.languages, this.languages_);
  };

  /**
   * returns a JavaScript object reperesenting the current track
   * information. **DOES not return it as JSON**
   *
   * @return {Object}
   *         Object representing the current of track info
   */


  Player.prototype.toJSON = function toJSON() {
    var options = (0, _mergeOptions2['default'])(this.options_);
    var tracks = options.tracks;

    options.tracks = [];

    for (var i = 0; i < tracks.length; i++) {
      var track = tracks[i];

      // deep merge tracks and null out player so no circular references
      track = (0, _mergeOptions2['default'])(track);
      track.player = undefined;
      options.tracks[i] = track;
    }

    return options;
  };

  /**
   * Creates a simple modal dialog (an instance of the {@link ModalDialog}
   * component) that immediately overlays the player with arbitrary
   * content and removes itself when closed.
   *
   * @param {string|Function|Element|Array|null} content
   *        Same as {@link ModalDialog#content}'s param of the same name.
   *        The most straight-forward usage is to provide a string or DOM
   *        element.
   *
   * @param {Object} [options]
   *        Extra options which will be passed on to the {@link ModalDialog}.
   *
   * @return {ModalDialog}
   *         the {@link ModalDialog} that was created
   */


  Player.prototype.createModal = function createModal(content, options) {
    var _this5 = this;

    options = options || {};
    options.content = content || '';

    var modal = new _modalDialog2['default'](this, options);

    this.addChild(modal);
    modal.on('dispose', function () {
      _this5.removeChild(modal);
    });

    return modal.open();
  };

  /**
   * Gets tag settings
   *
   * @param {Element} tag
   *        The player tag
   *
   * @return {Object}
   *         An object containing all of the settings
   *         for a player tag
   */


  Player.getTagSettings = function getTagSettings(tag) {
    var baseOptions = {
      sources: [],
      tracks: []
    };

    var tagOptions = Dom.getElAttributes(tag);
    var dataSetup = tagOptions['data-setup'];

    if (Dom.hasElClass(tag, 'vjs-fluid')) {
      tagOptions.fluid = true;
    }

    // Check if data-setup attr exists.
    if (dataSetup !== null) {
      // Parse options JSON
      // If empty string, make it a parsable json object.
      var _safeParseTuple = (0, _tuple2['default'])(dataSetup || '{}'),
          err = _safeParseTuple[0],
          data = _safeParseTuple[1];

      if (err) {
        _log2['default'].error(err);
      }
      (0, _obj.assign)(tagOptions, data);
    }

    (0, _obj.assign)(baseOptions, tagOptions);

    // Get tag children settings
    if (tag.hasChildNodes()) {
      var children = tag.childNodes;

      for (var i = 0, j = children.length; i < j; i++) {
        var child = children[i];
        // Change case needed: http://ejohn.org/blog/nodename-case-sensitivity/
        var childName = child.nodeName.toLowerCase();

        if (childName === 'source') {
          baseOptions.sources.push(Dom.getElAttributes(child));
        } else if (childName === 'track') {
          baseOptions.tracks.push(Dom.getElAttributes(child));
        }
      }
    }

    return baseOptions;
  };

  /**
   * Determine wether or not flexbox is supported
   *
   * @return {boolean}
   *         - true if flexbox is supported
   *         - false if flexbox is not supported
   */


  Player.prototype.flexNotSupported_ = function flexNotSupported_() {
    var elem = _document2['default'].createElement('i');

    // Note: We don't actually use flexBasis (or flexOrder), but it's one of the more
    // common flex features that we can rely on when checking for flex support.
    return !('flexBasis' in elem.style || 'webkitFlexBasis' in elem.style || 'mozFlexBasis' in elem.style || 'msFlexBasis' in elem.style ||
    // IE10-specific (2012 flex spec)
    'msFlexOrder' in elem.style);
  };

  return Player;
}(_component2['default']);

/**
 * Global player list
 *
 * @type {Object}
 */


Player.players = {};

var navigator = _window2['default'].navigator;

/*
 * Player instance options, surfaced using options
 * options = Player.prototype.options_
 * Make changes in options, not here.
 *
 * @type {Object}
 * @private
 */
Player.prototype.options_ = {
  // Default order of fallback technology
  techOrder: ['html5', 'flash'],
  // techOrder: ['flash','html5'],

  html5: {},
  flash: {},

  // defaultVolume: 0.85,
  defaultVolume: 0.00,

  // default inactivity timeout
  inactivityTimeout: 2000,

  // default playback rates
  playbackRates: [],
  // Add playback rate selection by adding rates
  // 'playbackRates': [0.5, 1, 1.5, 2],

  // Included control sets
  children: ['mediaLoader', 'posterImage', 'textTrackDisplay', 'loadingSpinner', 'bigPlayButton', 'controlBar', 'errorDisplay', 'textTrackSettings'],

  language: navigator && (navigator.languages && navigator.languages[0] || navigator.userLanguage || navigator.language) || 'en',

  // locales and their language translations
  languages: {},

  // Default message to show when a video cannot be played.
  notSupportedMessage: 'No compatible source was found for this media.'
};

[
/**
 * Returns whether or not the player is in the "ended" state.
 *
 * @return {Boolean} True if the player is in the ended state, false if not.
 * @method Player#ended
 */
'ended',
/**
 * Returns whether or not the player is in the "seeking" state.
 *
 * @return {Boolean} True if the player is in the seeking state, false if not.
 * @method Player#seeking
 */
'seeking',
/**
 * Returns the TimeRanges of the media that are currently available
 * for seeking to.
 *
 * @return {TimeRanges} the seekable intervals of the media timeline
 * @method Player#seekable
 */
'seekable',
/**
 * Returns the current state of network activity for the element, from
 * the codes in the list below.
 * - NETWORK_EMPTY (numeric value 0)
 *   The element has not yet been initialised. All attributes are in
 *   their initial states.
 * - NETWORK_IDLE (numeric value 1)
 *   The element's resource selection algorithm is active and has
 *   selected a resource, but it is not actually using the network at
 *   this time.
 * - NETWORK_LOADING (numeric value 2)
 *   The user agent is actively trying to download data.
 * - NETWORK_NO_SOURCE (numeric value 3)
 *   The element's resource selection algorithm is active, but it has
 *   not yet found a resource to use.
 *
 * @see https://html.spec.whatwg.org/multipage/embedded-content.html#network-states
 * @return {number} the current network activity state
 * @method Player#networkState
 */
'networkState',
/**
 * Returns a value that expresses the current state of the element
 * with respect to rendering the current playback position, from the
 * codes in the list below.
 * - HAVE_NOTHING (numeric value 0)
 *   No information regarding the media resource is available.
 * - HAVE_METADATA (numeric value 1)
 *   Enough of the resource has been obtained that the duration of the
 *   resource is available.
 * - HAVE_CURRENT_DATA (numeric value 2)
 *   Data for the immediate current playback position is available.
 * - HAVE_FUTURE_DATA (numeric value 3)
 *   Data for the immediate current playback position is available, as
 *   well as enough data for the user agent to advance the current
 *   playback position in the direction of playback.
 * - HAVE_ENOUGH_DATA (numeric value 4)
 *   The user agent estimates that enough data is available for
 *   playback to proceed uninterrupted.
 *
 * @see https://html.spec.whatwg.org/multipage/embedded-content.html#dom-media-readystate
 * @return {number} the current playback rendering state
 * @method Player#readyState
 */
'readyState'].forEach(function (fn) {
  Player.prototype[fn] = function () {
    return this.techGet_(fn);
  };
});

TECH_EVENTS_RETRIGGER.forEach(function (event) {
  Player.prototype['handleTech' + (0, _toTitleCase2['default'])(event) + '_'] = function () {
    return this.trigger(event);
  };
});

/**
 * Fired when the player has initial duration and dimension information
 *
 * @event Player#loadedmetadata
 * @type {EventTarget~Event}
 */

/**
 * Fired when the player has downloaded data at the current playback position
 *
 * @event Player#loadeddata
 * @type {EventTarget~Event}
 */

/**
 * Fired when the current playback position has changed *
 * During playback this is fired every 15-250 milliseconds, depending on the
 * playback technology in use.
 *
 * @event Player#timeupdate
 * @type {EventTarget~Event}
 */

/**
 * Fired when the volume changes
 *
 * @event Player#volumechange
 * @type {EventTarget~Event}
 */

_component2['default'].registerComponent('Player', Player);
exports['default'] = Player;

},{"1":1,"4":4,"41":41,"44":44,"45":45,"46":46,"5":5,"50":50,"55":55,"59":59,"60":60,"61":61,"62":62,"63":63,"68":68,"69":69,"71":71,"76":76,"78":78,"79":79,"8":8,"81":81,"82":82,"83":83,"85":85,"86":86,"87":87,"88":88,"89":89,"90":90,"91":91,"94":94,"95":95,"97":97}],52:[function(_dereq_,module,exports){
'use strict';

exports.__esModule = true;

var _player = _dereq_(51);

var _player2 = _interopRequireDefault(_player);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

/**
 * The method for registering a video.js plugin. {@link videojs:videojs.registerPlugin].
 *
 * @param {string} name
 *        The name of the plugin that is being registered
 *
 * @param {plugins:PluginFn} init
 *        The function that gets run when a `Player` initializes.
 */
var plugin = function plugin(name, init) {
  _player2['default'].prototype[name] = init;
}; /**
    * @file plugins.js
    * @module plugins
    */
exports['default'] = plugin;

},{"51":51}],53:[function(_dereq_,module,exports){
'use strict';

exports.__esModule = true;

var _clickableComponent = _dereq_(3);

var _clickableComponent2 = _interopRequireDefault(_clickableComponent);

var _component = _dereq_(5);

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

},{"3":3,"5":5}],54:[function(_dereq_,module,exports){
'use strict';

exports.__esModule = true;

var _component = _dereq_(5);

var _component2 = _interopRequireDefault(_component);

var _dom = _dereq_(81);

var Dom = _interopRequireWildcard(_dom);

var _fn = _dereq_(83);

var Fn = _interopRequireWildcard(_fn);

var _events = _dereq_(82);

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

},{"5":5,"81":81,"82":82,"83":83}],55:[function(_dereq_,module,exports){
'use strict';

exports.__esModule = true;

var _clickableComponent = _dereq_(3);

var _clickableComponent2 = _interopRequireDefault(_clickableComponent);

var _component = _dereq_(5);

var _component2 = _interopRequireDefault(_component);

var _fn = _dereq_(83);

var Fn = _interopRequireWildcard(_fn);

var _dom = _dereq_(81);

var Dom = _interopRequireWildcard(_dom);

var _browser = _dereq_(78);

var browser = _interopRequireWildcard(_browser);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * @file poster-image.js
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                */


/**
 * A `ClickableComponent` that handles showing the poster image for the player.
 *
 * @extends ClickableComponent
 */
var PosterImage = function (_ClickableComponent) {
  _inherits(PosterImage, _ClickableComponent);

  /**
   * Create an instance of this class.
   *
   * @param {Player} player
   *        The `Player` that this class should attach to.
   *
   * @param {Object} [options]
   *        The key/value store of player options.
   */
  function PosterImage(player, options) {
    _classCallCheck(this, PosterImage);

    var _this = _possibleConstructorReturn(this, _ClickableComponent.call(this, player, options));

    _this.update();
    player.on('posterchange', Fn.bind(_this, _this.update));
    return _this;
  }

  /**
   * Clean up and dispose of the `PosterImage`.
   */


  PosterImage.prototype.dispose = function dispose() {
    this.player().off('posterchange', this.update);
    _ClickableComponent.prototype.dispose.call(this);
  };

  /**
   * Create the `PosterImage`s DOM element.
   *
   * @return {Element}
   *         The element that gets created.
   */


  PosterImage.prototype.createEl = function createEl() {
    var el = Dom.createEl('div', {
      className: 'vjs-poster',

      // Don't want poster to be tabbable.
      tabIndex: -1
    });

    // To ensure the poster image resizes while maintaining its original aspect
    // ratio, use a div with `background-size` when available. For browsers that
    // do not support `background-size` (e.g. IE8), fall back on using a regular
    // img element.
    if (!browser.BACKGROUND_SIZE_SUPPORTED) {
      this.fallbackImg_ = Dom.createEl('img');
      el.appendChild(this.fallbackImg_);
    }

    return el;
  };

  /**
   * An {@link EventTarget~EventListener} for {@link Player#posterchange} events.
   *
   * @listens Player#posterchange
   *
   * @param {EventTarget~Event} [event]
   *        The `Player#posterchange` event that triggered this function.
   */


  PosterImage.prototype.update = function update(event) {
    var url = this.player().poster();

    this.setSrc(url);

    // If there's no poster source we should display:none on this component
    // so it's not still clickable or right-clickable
    if (url) {
      this.show();
    } else {
      this.hide();
    }
  };

  /**
   * Set the source of the `PosterImage` depending on the display method.
   *
   * @param {string} url
   *        The URL to the source for the `PosterImage`.
   */


  PosterImage.prototype.setSrc = function setSrc(url) {
    if (this.fallbackImg_) {
      this.fallbackImg_.src = url;
    } else {
      var backgroundImage = '';

      // Any falsey values should stay as an empty string, otherwise
      // this will throw an extra error
      if (url) {
        backgroundImage = 'url("' + url + '")';
      }

      this.el_.style.backgroundImage = backgroundImage;
    }
  };

  /**
   * An {@link EventTarget~EventListener} for clicks on the `PosterImage`. See
   * {@link ClickableComponent#handleClick} for instances where this will be triggered.
   *
   * @listens tap
   * @listens click
   * @listens keydown
   *
   * @param {EventTarget~Event} event
   +        The `click`, `tap` or `keydown` event that caused this function to be called.
   */


  PosterImage.prototype.handleClick = function handleClick(event) {
    // We don't want a click to trigger playback when controls are disabled
    if (!this.player_.controls()) {
      return;
    }

    if (this.player_.paused()) {
      this.player_.play();
    } else {
      this.player_.pause();
    }
  };

  return PosterImage;
}(_clickableComponent2['default']);

_component2['default'].registerComponent('PosterImage', PosterImage);
exports['default'] = PosterImage;

},{"3":3,"5":5,"78":78,"81":81,"83":83}],56:[function(_dereq_,module,exports){
'use strict';

exports.__esModule = true;
exports.hasLoaded = exports.autoSetupTimeout = exports.autoSetup = undefined;

var _dom = _dereq_(81);

var Dom = _interopRequireWildcard(_dom);

var _events = _dereq_(82);

var Events = _interopRequireWildcard(_events);

var _document = _dereq_(94);

var _document2 = _interopRequireDefault(_document);

var _window = _dereq_(95);

var _window2 = _interopRequireDefault(_window);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

/**
 * @file setup.js - Functions for setting up a player without
 * user interaction based on the data-setup `attribute` of the video tag.
 *
 * @module setup
 */
var _windowLoaded = false;
var videojs = void 0;

/**
 * Set up any tags that have a data-setup `attribute` when the player is started.
 */
var autoSetup = function autoSetup() {

  // Protect against breakage in non-browser environments.
  if (!Dom.isReal()) {
    return;
  }

  // One day, when we stop supporting IE8, go back to this, but in the meantime...*hack hack hack*
  // var vids = Array.prototype.slice.call(document.getElementsByTagName('video'));
  // var audios = Array.prototype.slice.call(document.getElementsByTagName('audio'));
  // var mediaEls = vids.concat(audios);

  // Because IE8 doesn't support calling slice on a node list, we need to loop
  // through each list of elements to build up a new, combined list of elements.
  var vids = _document2['default'].getElementsByTagName('video');
  var audios = _document2['default'].getElementsByTagName('audio');
  var mediaEls = [];

  if (vids && vids.length > 0) {
    for (var i = 0, e = vids.length; i < e; i++) {
      mediaEls.push(vids[i]);
    }
  }

  if (audios && audios.length > 0) {
    for (var _i = 0, _e = audios.length; _i < _e; _i++) {
      mediaEls.push(audios[_i]);
    }
  }

  // Check if any media elements exist
  if (mediaEls && mediaEls.length > 0) {

    for (var _i2 = 0, _e2 = mediaEls.length; _i2 < _e2; _i2++) {
      var mediaEl = mediaEls[_i2];

      // Check if element exists, has getAttribute func.
      // IE seems to consider typeof el.getAttribute == 'object' instead of
      // 'function' like expected, at least when loading the player immediately.
      if (mediaEl && mediaEl.getAttribute) {

        // Make sure this player hasn't already been set up.
        if (mediaEl.player === undefined) {
          var options = mediaEl.getAttribute('data-setup');

          // Check if data-setup attr exists.
          // We only auto-setup if they've added the data-setup attr.
          if (options !== null) {
            // Create new video.js instance.
            videojs(mediaEl);
          }
        }

        // If getAttribute isn't defined, we need to wait for the DOM.
      } else {
        autoSetupTimeout(1);
        break;
      }
    }

    // No videos were found, so keep looping unless page is finished loading.
  } else if (!_windowLoaded) {
    autoSetupTimeout(1);
  }
};

/**
 * Wait until the page is loaded before running autoSetup. This will be called in
 * autoSetup if `hasLoaded` returns false.
 *
 * @param {number} wait
 *        How long to wait in ms
 *
 * @param {videojs} [vjs]
 *        The videojs library function
 */
function autoSetupTimeout(wait, vjs) {
  if (vjs) {
    videojs = vjs;
  }

  _window2['default'].setTimeout(autoSetup, wait);
}

if (Dom.isReal() && _document2['default'].readyState === 'complete') {
  _windowLoaded = true;
} else {
  /**
   * Listen for the load event on window, and set _windowLoaded to true.
   *
   * @listens load
   */
  Events.one(_window2['default'], 'load', function () {
    _windowLoaded = true;
  });
}

/**
 * check if the document has been loaded
 */
var hasLoaded = function hasLoaded() {
  return _windowLoaded;
};

exports.autoSetup = autoSetup;
exports.autoSetupTimeout = autoSetupTimeout;
exports.hasLoaded = hasLoaded;

},{"81":81,"82":82,"94":94,"95":95}],57:[function(_dereq_,module,exports){
'use strict';

exports.__esModule = true;

var _component = _dereq_(5);

var _component2 = _interopRequireDefault(_component);

var _dom = _dereq_(81);

var Dom = _interopRequireWildcard(_dom);

var _obj = _dereq_(88);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * @file slider.js
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                */


/**
 * The base functionality for a slider. Can be vertical or horizontal.
 * For instance the volume bar or the seek bar on a video is a slider.
 *
 * @extends Component
 */
var Slider = function (_Component) {
  _inherits(Slider, _Component);

  /**
   * Create an instance of this class
   *
   * @param {Player} player
   *        The `Player` that this class should be attached to.
   *
   * @param {Object} [options]
   *        The key/value store of player options.
   */
  function Slider(player, options) {
    _classCallCheck(this, Slider);

    // Set property names to bar to match with the child Slider class is looking for
    var _this = _possibleConstructorReturn(this, _Component.call(this, player, options));

    _this.bar = _this.getChild(_this.options_.barName);

    // Set a horizontal or vertical class on the slider depending on the slider type
    _this.vertical(!!_this.options_.vertical);

    _this.on('mousedown', _this.handleMouseDown);
    _this.on('touchstart', _this.handleMouseDown);
    _this.on('focus', _this.handleFocus);
    _this.on('blur', _this.handleBlur);
    _this.on('click', _this.handleClick);

    _this.on(player, 'controlsvisible', _this.update);
    _this.on(player, _this.playerEvent, _this.update);
    return _this;
  }

  /**
   * Create the `Button`s DOM element.
   *
   * @param {string} type
   *        Type of element to create.
   *
   * @param {Object} [props={}]
   *        List of properties in Object form.
   *
   * @param {Object} [attributes={}]
   *        list of attributes in Object form.
   *
   * @return {Element}
   *         The element that gets created.
   */


  Slider.prototype.createEl = function createEl(type) {
    var props = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    var attributes = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

    // Add the slider element class to all sub classes
    props.className = props.className + ' vjs-slider';
    props = (0, _obj.assign)({
      tabIndex: 0
    }, props);

    attributes = (0, _obj.assign)({
      'role': 'slider',
      'aria-valuenow': 0,
      'aria-valuemin': 0,
      'aria-valuemax': 100,
      'tabIndex': 0
    }, attributes);

    return _Component.prototype.createEl.call(this, type, props, attributes);
  };

  /**
   * Handle `mousedown` or `touchstart` events on the `Slider`.
   *
   * @param {EventTarget~Event} event
   *        `mousedown` or `touchstart` event that triggered this function
   *
   * @listens mousedown
   * @listens touchstart
   * @fires Slider#slideractive
   */


  Slider.prototype.handleMouseDown = function handleMouseDown(event) {
    var doc = this.bar.el_.ownerDocument;

    event.preventDefault();
    Dom.blockTextSelection();

    this.addClass('vjs-sliding');
    /**
     * Triggered when the slider is in an active state
     *
     * @event Slider#slideractive
     * @type {EventTarget~Event}
     */
    this.trigger('slideractive');

    this.on(doc, 'mousemove', this.handleMouseMove);
    this.on(doc, 'mouseup', this.handleMouseUp);
    this.on(doc, 'touchmove', this.handleMouseMove);
    this.on(doc, 'touchend', this.handleMouseUp);

    this.handleMouseMove(event);
  };

  /**
   * Handle the `mousemove`, `touchmove`, and `mousedown` events on this `Slider`.
   * The `mousemove` and `touchmove` events will only only trigger this function during
   * `mousedown` and `touchstart`. This is due to {@link Slider#handleMouseDown} and
   * {@link Slider#handleMouseUp}.
   *
   * @param {EventTarget~Event} event
   *        `mousedown`, `mousemove`, `touchstart`, or `touchmove` event that triggered
   *        this function
   *
   * @listens mousemove
   * @listens touchmove
   */


  Slider.prototype.handleMouseMove = function handleMouseMove(event) {};

  /**
   * Handle `mouseup` or `touchend` events on the `Slider`.
   *
   * @param {EventTarget~Event} event
   *        `mouseup` or `touchend` event that triggered this function.
   *
   * @listens touchend
   * @listens mouseup
   * @fires Slider#sliderinactive
   */


  Slider.prototype.handleMouseUp = function handleMouseUp() {
    var doc = this.bar.el_.ownerDocument;

    Dom.unblockTextSelection();

    this.removeClass('vjs-sliding');
    /**
     * Triggered when the slider is no longer in an active state.
     *
     * @event Slider#sliderinactive
     * @type {EventTarget~Event}
     */
    this.trigger('sliderinactive');

    this.off(doc, 'mousemove', this.handleMouseMove);
    this.off(doc, 'mouseup', this.handleMouseUp);
    this.off(doc, 'touchmove', this.handleMouseMove);
    this.off(doc, 'touchend', this.handleMouseUp);

    this.update();
  };

  /**
   * Update the progress bar of the `Slider`.
   */


  Slider.prototype.update = function update() {
    // In VolumeBar init we have a setTimeout for update that pops and update to the end of the
    // execution stack. The player is destroyed before then update will cause an error
    if (!this.el_) {
      return;
    }

    // If scrubbing, we could use a cached value to make the handle keep up with the user's mouse.
    // On HTML5 browsers scrubbing is really smooth, but some flash players are slow, so we might want to utilize this later.
    // var progress =  (this.player_.scrubbing()) ? this.player_.getCache().currentTime / this.player_.duration() : this.player_.currentTime() / this.player_.duration();
    var progress = this.getPercent();
    var bar = this.bar;

    // If there's no bar...
    if (!bar) {
      return;
    }

    // Protect against no duration and other division issues
    if (typeof progress !== 'number' || progress !== progress || progress < 0 || progress === Infinity) {
      progress = 0;
    }

    // Convert to a percentage for setting
    var percentage = (progress * 100).toFixed(2) + '%';

    // Set the new bar width or height
    if (this.vertical()) {
      bar.el().style.height = percentage;
    } else {
      bar.el().style.width = percentage;
    }
  };

  /**
   * Calculate distance for slider
   *
   * @param {EventTarget~Event} event
   *        The event that caused this function to run.
   *
   * @return {number}
   *         The current position of the Slider.
   *         - postition.x for vertical `Slider`s
   *         - postition.y for horizontal `Slider`s
   */


  Slider.prototype.calculateDistance = function calculateDistance(event) {
    var position = Dom.getPointerPosition(this.el_, event);

    if (this.vertical()) {
      return position.y;
    }
    return position.x;
  };

  /**
   * Handle a `focus` event on this `Slider`.
   *
   * @param {EventTarget~Event} event
   *        The `focus` event that caused this function to run.
   *
   * @listens focus
   */


  Slider.prototype.handleFocus = function handleFocus() {
    this.on(this.bar.el_.ownerDocument, 'keydown', this.handleKeyPress);
  };

  /**
   * Handle a `keydown` event on the `Slider`. Watches for left, rigth, up, and down
   * arrow keys. This function will only be called when the slider has focus. See
   * {@link Slider#handleFocus} and {@link Slider#handleBlur}.
   *
   * @param {EventTarget~Event} event
   *        the `keydown` event that caused this function to run.
   *
   * @listens keydown
   */


  Slider.prototype.handleKeyPress = function handleKeyPress(event) {
    // Left and Down Arrows
    if (event.which === 37 || event.which === 40) {
      event.preventDefault();
      this.stepBack();

      // Up and Right Arrows
    } else if (event.which === 38 || event.which === 39) {
      event.preventDefault();
      this.stepForward();
    }
  };

  /**
   * Handle a `blur` event on this `Slider`.
   *
   * @param {EventTarget~Event} event
   *        The `blur` event that caused this function to run.
   *
   * @listens blur
   */

  Slider.prototype.handleBlur = function handleBlur() {
    this.off(this.bar.el_.ownerDocument, 'keydown', this.handleKeyPress);
  };

  /**
   * Listener for click events on slider, used to prevent clicks
   *   from bubbling up to parent elements like button menus.
   *
   * @param {Object} event
   *        Event that caused this object to run
   */


  Slider.prototype.handleClick = function handleClick(event) {
    event.stopImmediatePropagation();
    event.preventDefault();
  };

  /**
   * Get/set if slider is horizontal for vertical
   *
   * @param {boolean} [bool]
   *        - true if slider is vertical,
   *        - false is horizontal
   *
   * @return {boolean|Slider}
   *         - true if slider is vertical, and getting
   *         - false is horizontal, and getting
   *         - a reference to this object when setting
   */


  Slider.prototype.vertical = function vertical(bool) {
    if (bool === undefined) {
      return this.vertical_ || false;
    }

    this.vertical_ = !!bool;

    if (this.vertical_) {
      this.addClass('vjs-slider-vertical');
    } else {
      this.addClass('vjs-slider-horizontal');
    }

    return this;
  };

  return Slider;
}(_component2['default']);

_component2['default'].registerComponent('Slider', Slider);
exports['default'] = Slider;

},{"5":5,"81":81,"88":88}],58:[function(_dereq_,module,exports){
'use strict';

exports.__esModule = true;
/**
 * @file flash-rtmp.js
 * @module flash-rtmp
 */

/**
 * Add RTMP properties to the {@link Flash} Tech.
 *
 * @param {Flash} Flash
 *        The flash tech class.
 *
 * @mixin FlashRtmpDecorator
 */
function FlashRtmpDecorator(Flash) {
  Flash.streamingFormats = {
    'rtmp/mp4': 'MP4',
    'rtmp/flv': 'FLV'
  };

  /**
   * Join connection and stream with an ampersand.
   *
   * @param {string} connection
   *        The connection string.
   *
   * @param {string} stream
   *        The stream string.
   */
  Flash.streamFromParts = function (connection, stream) {
    return connection + '&' + stream;
  };

  /**
   * The flash parts object that contains connection and stream info.
   *
   * @typedef {Object} Flash~PartsObject
   *
   * @property {string} connection
   *           The connection string of a source, defaults to an empty string.
   *
   * @property {string} stream
   *           The stream string of the source, defaults to an empty string.
   */

  /**
   * Convert a source url into a stream and connection parts.
   *
   * @param {string} src
   *        the source url
   *
   * @return {Flash~PartsObject}
   *         The parts object that contains a connection and a stream
   */
  Flash.streamToParts = function (src) {
    var parts = {
      connection: '',
      stream: ''
    };

    if (!src) {
      return parts;
    }

    // Look for the normal URL separator we expect, '&'.
    // If found, we split the URL into two pieces around the
    // first '&'.
    var connEnd = src.search(/&(?!\w+=)/);
    var streamBegin = void 0;

    if (connEnd !== -1) {
      streamBegin = connEnd + 1;
    } else {
      // If there's not a '&', we use the last '/' as the delimiter.
      connEnd = streamBegin = src.lastIndexOf('/') + 1;
      if (connEnd === 0) {
        // really, there's not a '/'?
        connEnd = streamBegin = src.length;
      }
    }

    parts.connection = src.substring(0, connEnd);
    parts.stream = src.substring(streamBegin, src.length);

    return parts;
  };

  /**
   * Check if the source type is a streaming type.
   *
   * @param {string} srcType
   *        The mime type to check.
   *
   * @return {boolean}
   *          - True if the source type is a streaming type.
   *          - False if the source type is not a streaming type.
   */
  Flash.isStreamingType = function (srcType) {
    return srcType in Flash.streamingFormats;
  };

  // RTMP has four variations, any string starting
  // with one of these protocols should be valid

  /**
   * Regular expression used to check if the source is an rtmp source.
   *
   * @property {RegExp} Flash.RTMP_RE
   */
  Flash.RTMP_RE = /^rtmp[set]?:\/\//i;

  /**
   * Check if the source itself is a streaming type.
   *
   * @param {string} src
   *        The url to the source.
   *
   * @return {boolean}
   *          - True if the source url indicates that the source is streaming.
   *          - False if the shource url indicates that the source url is not streaming.
   */
  Flash.isStreamingSrc = function (src) {
    return Flash.RTMP_RE.test(src);
  };

  /**
   * A source handler for RTMP urls
   * @type {Object}
   */
  Flash.rtmpSourceHandler = {};

  /**
   * Check if Flash can play the given mime type.
   *
   * @param {string} type
   *        The mime type to check
   *
   * @return {string}
   *         'maybe', or '' (empty string)
   */
  Flash.rtmpSourceHandler.canPlayType = function (type) {
    if (Flash.isStreamingType(type)) {
      return 'maybe';
    }

    return '';
  };

  /**
   * Check if Flash can handle the source natively
   *
   * @param {Object} source
   *        The source object
   *
   * @param {Object} [options]
   *        The options passed to the tech
   *
   * @return {string}
   *         'maybe', or '' (empty string)
   */
  Flash.rtmpSourceHandler.canHandleSource = function (source, options) {
    var can = Flash.rtmpSourceHandler.canPlayType(source.type);

    if (can) {
      return can;
    }

    if (Flash.isStreamingSrc(source.src)) {
      return 'maybe';
    }

    return '';
  };

  /**
   * Pass the source to the flash object.
   *
   * @param {Object} source
   *        The source object
   *
   * @param {Flash} tech
   *        The instance of the Flash tech
   *
   * @param {Object} [options]
   *        The options to pass to the source
   */
  Flash.rtmpSourceHandler.handleSource = function (source, tech, options) {
    var srcParts = Flash.streamToParts(source.src);

    tech.setRtmpConnection(srcParts.connection);
    tech.setRtmpStream(srcParts.stream);
  };

  // Register the native source handler
  Flash.registerSourceHandler(Flash.rtmpSourceHandler);

  return Flash;
}

exports['default'] = FlashRtmpDecorator;

},{}],59:[function(_dereq_,module,exports){
'use strict';

exports.__esModule = true;

var _tech = _dereq_(62);

var _tech2 = _interopRequireDefault(_tech);

var _dom = _dereq_(81);

var Dom = _interopRequireWildcard(_dom);

var _url = _dereq_(92);

var Url = _interopRequireWildcard(_url);

var _timeRanges = _dereq_(90);

var _flashRtmp = _dereq_(58);

var _flashRtmp2 = _interopRequireDefault(_flashRtmp);

var _component = _dereq_(5);

var _component2 = _interopRequireDefault(_component);

var _window = _dereq_(95);

var _window2 = _interopRequireDefault(_window);

var _obj = _dereq_(88);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * @file flash.js
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * VideoJS-SWF - Custom Flash Player with HTML5-ish API
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * https://github.com/zencoder/video-js-swf
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * Not using setupTriggers. Using global onEvent func to distribute events
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                */

var navigator = _window2['default'].navigator;

/**
 * Flash Media Controller - Wrapper for Flash Media API
 *
 * @mixes FlashRtmpDecorator
 * @mixes Tech~SouceHandlerAdditions
 * @extends Tech
 */

var Flash = function (_Tech) {
  _inherits(Flash, _Tech);

  /**
   * Create an instance of this Tech.
   *
   * @param {Object} [options]
   *        The key/value store of player options.
   *
   * @param {Component~ReadyCallback} ready
   *        Callback function to call when the `Flash` Tech is ready.
   */
  function Flash(options, ready) {
    _classCallCheck(this, Flash);

    // Set the source when ready
    var _this = _possibleConstructorReturn(this, _Tech.call(this, options, ready));

    if (options.source) {
      _this.ready(function () {
        this.setSource(options.source);
      }, true);
    }

    // Having issues with Flash reloading on certain page actions (hide/resize/fullscreen) in certain browsers
    // This allows resetting the playhead when we catch the reload
    if (options.startTime) {
      _this.ready(function () {
        this.load();
        this.play();
        this.currentTime(options.startTime);
      }, true);
    }

    // Add global window functions that the swf expects
    // A 4.x workflow we weren't able to solve for in 5.0
    // because of the need to hard code these functions
    // into the swf for security reasons
    _window2['default'].videojs = _window2['default'].videojs || {};
    _window2['default'].videojs.Flash = _window2['default'].videojs.Flash || {};
    _window2['default'].videojs.Flash.onReady = Flash.onReady;
    _window2['default'].videojs.Flash.onEvent = Flash.onEvent;
    _window2['default'].videojs.Flash.onError = Flash.onError;

    _this.on('seeked', function () {
      this.lastSeekTarget_ = undefined;
    });

    return _this;
  }

  /**
   * Create the `Flash` Tech's DOM element.
   *
   * @return {Element}
   *         The element that gets created.
   */


  Flash.prototype.createEl = function createEl() {
    var options = this.options_;

    // If video.js is hosted locally you should also set the location
    // for the hosted swf, which should be relative to the page (not video.js)
    // Otherwise this adds a CDN url.
    // The CDN also auto-adds a swf URL for that specific version.
    if (!options.swf) {
      var ver = '5.4.1';

      options.swf = '//vjs.zencdn.net/swf/' + ver + '/video-js.swf';
    }

    // Generate ID for swf object
    var objId = options.techId;

    // Merge default flashvars with ones passed in to init
    var flashVars = (0, _obj.assign)({

      // SWF Callback Functions
      readyFunction: 'videojs.Flash.onReady',
      eventProxyFunction: 'videojs.Flash.onEvent',
      errorEventProxyFunction: 'videojs.Flash.onError',

      // Player Settings
      autoplay: options.autoplay,
      preload: options.preload,
      loop: options.loop,
      muted: options.muted

    }, options.flashVars);

    // Merge default parames with ones passed in
    var params = (0, _obj.assign)({
      // Opaque is needed to overlay controls, but can affect playback performance
      wmode: 'opaque',
      // Using bgcolor prevents a white flash when the object is loading
      bgcolor: '#000000'
    }, options.params);

    // Merge default attributes with ones passed in
    var attributes = (0, _obj.assign)({
      // Both ID and Name needed or swf to identify itself
      id: objId,
      name: objId,
      'class': 'vjs-tech'
    }, options.attributes);

    this.el_ = Flash.embed(options.swf, flashVars, params, attributes);
    this.el_.tech = this;

    return this.el_;
  };

  /**
   * Called by {@link Player#play} to play using the `Flash` `Tech`.
   */


  Flash.prototype.play = function play() {
    if (this.ended()) {
      this.setCurrentTime(0);
    }
    this.el_.vjs_play();
  };

  /**
   * Called by {@link Player#pause} to pause using the `Flash` `Tech`.
   */


  Flash.prototype.pause = function pause() {
    this.el_.vjs_pause();
  };

  /**
   * A getter/setter for the `Flash` Tech's source object.
   * > Note: Please use {@link Flash#setSource}
   *
   * @param {Tech~SourceObject} [src]
   *        The source object you want to set on the `Flash` techs.
   *
   * @return {Tech~SourceObject|undefined}
   *         - The current source object when a source is not passed in.
   *         - undefined when setting
   *
   * @deprecated Since version 5.
   */


  Flash.prototype.src = function src(_src) {
    if (_src === undefined) {
      return this.currentSrc();
    }

    // Setting src through `src` not `setSrc` will be deprecated
    return this.setSrc(_src);
  };

  /**
   * A getter/setter for the `Flash` Tech's source object.
   *
   * @param {Tech~SourceObject} [src]
   *        The source object you want to set on the `Flash` techs.
   *
   * @return {Tech~SourceObject|undefined}
   *         - The current source object when a source is not passed in.
   *         - undefined when setting
   */


  Flash.prototype.setSrc = function setSrc(src) {
    var _this2 = this;

    // Make sure source URL is absolute.
    src = Url.getAbsoluteURL(src);
    this.el_.vjs_src(src);

    // Currently the SWF doesn't autoplay if you load a source later.
    // e.g. Load player w/ no source, wait 2s, set src.
    if (this.autoplay()) {
      this.setTimeout(function () {
        return _this2.play();
      }, 0);
    }
  };

  /**
   * Indicates whether the media is currently seeking to a new position or not.
   *
   * @return {boolean}
   *         - True if seeking to a new position
   *         - False otherwise
   */


  Flash.prototype.seeking = function seeking() {
    return this.lastSeekTarget_ !== undefined;
  };

  /**
   * Returns the current time in seconds that the media is at in playback.
   *
   * @param {number} time
   *        Current playtime of the media in seconds.
   */


  Flash.prototype.setCurrentTime = function setCurrentTime(time) {
    var seekable = this.seekable();

    if (seekable.length) {
      // clamp to the current seekable range
      time = time > seekable.start(0) ? time : seekable.start(0);
      time = time < seekable.end(seekable.length - 1) ? time : seekable.end(seekable.length - 1);

      this.lastSeekTarget_ = time;
      this.trigger('seeking');
      this.el_.vjs_setProperty('currentTime', time);
      _Tech.prototype.setCurrentTime.call(this);
    }
  };

  /**
   * Get the current playback time in seconds
   *
   * @return {number}
   *         The current time of playback in seconds.
   */


  Flash.prototype.currentTime = function currentTime() {
    // when seeking make the reported time keep up with the requested time
    // by reading the time we're seeking to
    if (this.seeking()) {
      return this.lastSeekTarget_ || 0;
    }
    return this.el_.vjs_getProperty('currentTime');
  };

  /**
   * Get the current source
   *
   * @method currentSrc
   * @return {Tech~SourceObject}
   *         The current source
   */


  Flash.prototype.currentSrc = function currentSrc() {
    if (this.currentSource_) {
      return this.currentSource_.src;
    }
    return this.el_.vjs_getProperty('currentSrc');
  };

  /**
   * Get the total duration of the current media.
   *
   * @return {number}
   8          The total duration of the current media.
   */


  Flash.prototype.duration = function duration() {
    if (this.readyState() === 0) {
      return NaN;
    }
    var duration = this.el_.vjs_getProperty('duration');

    return duration >= 0 ? duration : Infinity;
  };

  /**
   * Load media into Tech.
   */


  Flash.prototype.load = function load() {
    this.el_.vjs_load();
  };

  /**
   * Get the poster image that was set on the tech.
   */


  Flash.prototype.poster = function poster() {
    this.el_.vjs_getProperty('poster');
  };

  /**
   * Poster images are not handled by the Flash tech so make this is a no-op.
   */


  Flash.prototype.setPoster = function setPoster() {};

  /**
   * Determine the time ranges that can be seeked to in the media.
   *
   * @return {TimeRange}
   *         Returns the time ranges that can be seeked to.
   */


  Flash.prototype.seekable = function seekable() {
    var duration = this.duration();

    if (duration === 0) {
      return (0, _timeRanges.createTimeRange)();
    }
    return (0, _timeRanges.createTimeRange)(0, duration);
  };

  /**
   * Get and create a `TimeRange` object for buffering.
   *
   * @return {TimeRange}
   *         The time range object that was created.
   */


  Flash.prototype.buffered = function buffered() {
    var ranges = this.el_.vjs_getProperty('buffered');

    if (ranges.length === 0) {
      return (0, _timeRanges.createTimeRange)();
    }
    return (0, _timeRanges.createTimeRange)(ranges[0][0], ranges[0][1]);
  };

  /**
   * Get fullscreen support -
   *
   * Flash does not allow fullscreen through javascript
   * so this always returns false.
   *
   * @return {boolean}
   *         The Flash tech does not support fullscreen, so it will always return false.
   */


  Flash.prototype.supportsFullScreen = function supportsFullScreen() {
    // Flash does not allow fullscreen through javascript
    return false;
  };

  /**
   * Flash does not allow fullscreen through javascript
   * so this always returns false.
   *
   * @return {boolean}
   *         The Flash tech does not support fullscreen, so it will always return false.
   */


  Flash.prototype.enterFullScreen = function enterFullScreen() {
    return false;
  };

  /**
   * Gets available media playback quality metrics as specified by the W3C's Media
   * Playback Quality API.
   *
   * @see [Spec]{@link https://wicg.github.io/media-playback-quality}
   *
   * @return {Object}
   *         An object with supported media playback quality metrics
   */


  Flash.prototype.getVideoPlaybackQuality = function getVideoPlaybackQuality() {
    var videoPlaybackQuality = this.el_.vjs_getProperty('getVideoPlaybackQuality');

    if (_window2['default'].performance && typeof _window2['default'].performance.now === 'function') {
      videoPlaybackQuality.creationTime = _window2['default'].performance.now();
    } else if (_window2['default'].performance && _window2['default'].performance.timing && typeof _window2['default'].performance.timing.navigationStart === 'number') {
      videoPlaybackQuality.creationTime = _window2['default'].Date.now() - _window2['default'].performance.timing.navigationStart;
    }

    return videoPlaybackQuality;
  };

  return Flash;
}(_tech2['default']);

// Create setters and getters for attributes


var _api = Flash.prototype;
var _readWrite = 'rtmpConnection,rtmpStream,preload,defaultPlaybackRate,playbackRate,autoplay,loop,mediaGroup,controller,controls,volume,muted,defaultMuted'.split(',');
var _readOnly = 'networkState,readyState,initialTime,startOffsetTime,paused,ended,videoWidth,videoHeight'.split(',');

function _createSetter(attr) {
  var attrUpper = attr.charAt(0).toUpperCase() + attr.slice(1);

  _api['set' + attrUpper] = function (val) {
    return this.el_.vjs_setProperty(attr, val);
  };
}

function _createGetter(attr) {
  _api[attr] = function () {
    return this.el_.vjs_getProperty(attr);
  };
}

// Create getter and setters for all read/write attributes
for (var i = 0; i < _readWrite.length; i++) {
  _createGetter(_readWrite[i]);
  _createSetter(_readWrite[i]);
}

// Create getters for read-only attributes
for (var _i = 0; _i < _readOnly.length; _i++) {
  _createGetter(_readOnly[_i]);
}

/** ------------------------------ Getters ------------------------------ **/
/**
 * Get the value of `rtmpConnection` from the swf.
 *
 * @method Flash#rtmpConnection
 * @return {string}
 *         The current value of `rtmpConnection` on the swf.
 */

/**
 * Get the value of `rtmpStream` from the swf.
 *
 * @method Flash#rtmpStream
 * @return {string}
 *         The current value of `rtmpStream` on the swf.
 */

/**
 * Get the value of `preload` from the swf. `preload` indicates
 * what should download before the media is interacted with. It can have the following
 * values:
 * - none: nothing should be downloaded
 * - metadata: poster and the first few frames of the media may be downloaded to get
 *   media dimensions and other metadata
 * - auto: allow the media and metadata for the media to be downloaded before
 *    interaction
 *
 * @method Flash#preload
 * @return {string}
 *         The value of `preload` from the swf. Will be 'none', 'metadata',
 *         or 'auto'.
 */

/**
 * Get the value of `defaultPlaybackRate` from the swf.
 *
 * @method Flash#defaultPlaybackRate
 * @return {number}
 *         The current value of `defaultPlaybackRate` on the swf.
 */

/**
 * Get the value of `playbackRate` from the swf. `playbackRate` indicates
 * the rate at which the media is currently playing back. Examples:
 *   - if playbackRate is set to 2, media will play twice as fast.
 *   - if playbackRate is set to 0.5, media will play half as fast.
 *
 * @method Flash#playbackRate
 * @return {number}
 *         The value of `playbackRate` from the swf. A number indicating
 *         the current playback speed of the media, where 1 is normal speed.
 */

/**
 * Get the value of `autoplay` from the swf. `autoplay` indicates
 * that the media should start to play as soon as the page is ready.
 *
 * @method Flash#autoplay
 * @return {boolean}
 *         - The value of `autoplay` from the swf.
 *         - True indicates that the media ashould start as soon as the page loads.
 *         - False indicates that the media should not start as soon as the page loads.
 */

/**
 * Get the value of `loop` from the swf. `loop` indicates
 * that the media should return to the start of the media and continue playing once
 * it reaches the end.
 *
 * @method Flash#loop
 * @return {boolean}
 *         - The value of `loop` from the swf.
 *         - True indicates that playback should seek back to start once
 *           the end of a media is reached.
 *         - False indicates that playback should not loop back to the start when the
 *           end of the media is reached.
 */

/**
 * Get the value of `mediaGroup` from the swf.
 *
 * @method Flash#mediaGroup
 * @return {string}
 *         The current value of `mediaGroup` on the swf.
 */

/**
 * Get the value of `controller` from the swf.
 *
 * @method Flash#controller
 * @return {string}
 *         The current value of `controller` on the swf.
 */

/**
 * Get the value of `controls` from the swf. `controls` indicates
 * whether the native flash controls should be shown or hidden.
 *
 * @method Flash#controls
 * @return {boolean}
 *         - The value of `controls` from the swf.
 *         - True indicates that native controls should be showing.
 *         - False indicates that native controls should be hidden.
 */

/**
 * Get the value of the `volume` from the swf. `volume` indicates the current
 * audio level as a percentage in decimal form. This means that 1 is 100%, 0.5 is 50%, and
 * so on.
 *
 * @method Flash#volume
 * @return {number}
 *         The volume percent as a decimal. Value will be between 0-1.
 */

/**
 * Get the value of the `muted` from the swf. `muted` indicates the current
 * audio level should be silent.
 *
 * @method Flash#muted
 * @return {boolean}
 *         - True if the audio should be set to silent
 *         - False otherwise
 */

/**
 * Get the value of `defaultMuted` from the swf. `defaultMuted` indicates
 * whether the media should start muted or not. Only changes the default state of the
 * media. `muted` and `defaultMuted` can have different values. `muted` indicates the
 * current state.
 *
 * @method Flash#defaultMuted
 * @return {boolean}
 *         - The value of `defaultMuted` from the swf.
 *         - True indicates that the media should start muted.
 *         - False indicates that the media should not start muted.
 */

/**
 * Get the value of `networkState` from the swf. `networkState` indicates
 * the current network state. It returns an enumeration from the following list:
 * - 0: NETWORK_EMPTY
 * - 1: NEWORK_IDLE
 * - 2: NETWORK_LOADING
 * - 3: NETWORK_NO_SOURCE
 *
 * @method Flash#networkState
 * @return {number}
 *         The value of `networkState` from the swf. This will be a number
 *         from the list in the description.
 */

/**
 * Get the value of `readyState` from the swf. `readyState` indicates
 * the current state of the media element. It returns an enumeration from the
 * following list:
 * - 0: HAVE_NOTHING
 * - 1: HAVE_METADATA
 * - 2: HAVE_CURRENT_DATA
 * - 3: HAVE_FUTURE_DATA
 * - 4: HAVE_ENOUGH_DATA
 *
 * @method Flash#readyState
 * @return {number}
 *         The value of `readyState` from the swf. This will be a number
 *         from the list in the description.
 */

/**
 * Get the value of `readyState` from the swf. `readyState` indicates
 * the current state of the media element. It returns an enumeration from the
 * following list:
 * - 0: HAVE_NOTHING
 * - 1: HAVE_METADATA
 * - 2: HAVE_CURRENT_DATA
 * - 3: HAVE_FUTURE_DATA
 * - 4: HAVE_ENOUGH_DATA
 *
 * @method Flash#readyState
 * @return {number}
 *         The value of `readyState` from the swf. This will be a number
 *         from the list in the description.
 */

/**
 * Get the value of `initialTime` from the swf.
 *
 * @method Flash#initialTime
 * @return {number}
 *         The `initialTime` proprety on the swf.
 */

/**
 * Get the value of `startOffsetTime` from the swf.
 *
 * @method Flash#startOffsetTime
 * @return {number}
 *         The `startOffsetTime` proprety on the swf.
 */

/**
 * Get the value of `paused` from the swf. `paused` indicates whether the swf
 * is current paused or not.
 *
 * @method Flash#paused
 * @return {boolean}
 *         The value of `paused` from the swf.
 */

/**
 * Get the value of `ended` from the swf. `ended` indicates whether
 * the media has reached the end or not.
 *
 * @method Flash#ended
 * @return {boolean}
 *         - True indicates that the media has ended.
 *         - False indicates that the media has not ended.
 *
 * @see [Spec]{@link https://www.w3.org/TR/html5/embedded-content-0.html#dom-media-ended}
 */

/**
 * Get the value of `videoWidth` from the swf. `videoWidth` indicates
 * the current width of the media in css pixels.
 *
 * @method Flash#videoWidth
 * @return {number}
 *         The value of `videoWidth` from the swf. This will be a number
 *         in css pixels.
 */

/**
 * Get the value of `videoHeight` from the swf. `videoHeigth` indicates
 * the current height of the media in css pixels.
 *
 * @method Flassh.prototype.videoHeight
 * @return {number}
 *         The value of `videoHeight` from the swf. This will be a number
 *         in css pixels.
 */
/** ------------------------------ Setters ------------------------------ **/

/**
 * Set the value of `rtmpConnection` on the swf.
 *
 * @method Flash#setRtmpConnection
 * @param {string} rtmpConnection
 *        New value to set the `rtmpConnection` property to.
 */

/**
 * Set the value of `rtmpStream` on the swf.
 *
 * @method Flash#setRtmpStream
 * @param {string} rtmpStream
 *        New value to set the `rtmpStream` property to.
 */

/**
 * Set the value of `preload` on the swf. `preload` indicates
 * what should download before the media is interacted with. It can have the following
 * values:
 * - none: nothing should be downloaded
 * - metadata: poster and the first few frames of the media may be downloaded to get
 *   media dimensions and other metadata
 * - auto: allow the media and metadata for the media to be downloaded before
 *    interaction
 *
 * @method Flash#setPreload
 * @param {string} preload
 *        The value of `preload` to set on the swf. Should be 'none', 'metadata',
 *        or 'auto'.
 */

/**
 * Set the value of `defaultPlaybackRate` on the swf.
 *
 * @method Flash#setDefaultPlaybackRate
 * @param {number} defaultPlaybackRate
 *        New value to set the `defaultPlaybackRate` property to.
 */

/**
 * Set the value of `playbackRate` on the swf. `playbackRate` indicates
 * the rate at which the media is currently playing back. Examples:
 *   - if playbackRate is set to 2, media will play twice as fast.
 *   - if playbackRate is set to 0.5, media will play half as fast.
 *
 * @method Flash#setPlaybackRate
 * @param {number} playbackRate
 *        New value of `playbackRate` on the swf. A number indicating
 *        the current playback speed of the media, where 1 is normal speed.
 */

/**
 * Set the value of `autoplay` on the swf. `autoplay` indicates
 * that the media should start to play as soon as the page is ready.
 *
 * @method Flash#setAutoplay
 * @param {boolean} autoplay
 *        - The value of `autoplay` from the swf.
 *        - True indicates that the media ashould start as soon as the page loads.
 *        - False indicates that the media should not start as soon as the page loads.
 */

/**
 * Set the value of `loop` on the swf. `loop` indicates
 * that the media should return to the start of the media and continue playing once
 * it reaches the end.
 *
 * @method Flash#setLoop
 * @param {boolean} loop
 *        - True indicates that playback should seek back to start once
 *          the end of a media is reached.
 *        - False indicates that playback should not loop back to the start when the
 *          end of the media is reached.
 */

/**
 * Set the value of `mediaGroup` on the swf.
 *
 * @method Flash#setMediaGroup
 * @param {string} mediaGroup
 *        New value of `mediaGroup` to set on the swf.
 */

/**
 * Set the value of `controller` on the swf.
 *
 * @method Flash#setController
 * @param {string} controller
 *        New value the current value of `controller` on the swf.
 */

/**
 * Get the value of `controls` from the swf. `controls` indicates
 * whether the native flash controls should be shown or hidden.
 *
 * @method Flash#controls
 * @return {boolean}
 *         - The value of `controls` from the swf.
 *         - True indicates that native controls should be showing.
 *         - False indicates that native controls should be hidden.
 */

/**
 * Set the value of the `volume` on the swf. `volume` indicates the current
 * audio level as a percentage in decimal form. This means that 1 is 100%, 0.5 is 50%, and
 * so on.
 *
 * @method Flash#setVolume
 * @param {number} percentAsDecimal
 *         The volume percent as a decimal. Value will be between 0-1.
 */

/**
 * Set the value of the `muted` on the swf. `muted` indicates that the current
 * audio level should be silent.
 *
 * @method Flash#setMuted
 * @param {boolean} muted
 *         - True if the audio should be set to silent
 *         - False otherwise
 */

/**
 * Set the value of `defaultMuted` on the swf. `defaultMuted` indicates
 * whether the media should start muted or not. Only changes the default state of the
 * media. `muted` and `defaultMuted` can have different values. `muted` indicates the
 * current state.
 *
 * @method Flash#setDefaultMuted
 * @param {boolean} defaultMuted
 *         - True indicates that the media should start muted.
 *         - False indicates that the media should not start muted.
 */

/* Flash Support Testing -------------------------------------------------------- */

/**
 * Check if the Flash tech is currently supported.
 *
 * @return {boolean}
 *          - True if the flash tech is supported.
 *          - False otherwise.
 */
Flash.isSupported = function () {
  return Flash.version()[0] >= 10;
  // return swfobject.hasFlashPlayerVersion('10');
};

// Add Source Handler pattern functions to this tech
_tech2['default'].withSourceHandlers(Flash);

/*
 * Native source handler for flash,  simply passes the source to the swf element.
 *
 * @property {Tech~SourceObject} source
 *           The source object
 *
 * @property {Flash} tech
 *           The instance of the Flash tech
 */
Flash.nativeSourceHandler = {};

/**
 * Check if the Flash can play the given mime type.
 *
 * @param {string} type
 *        The mimetype to check
 *
 * @return {string}
 *         'maybe', or '' (empty string)
 */
Flash.nativeSourceHandler.canPlayType = function (type) {
  if (type in Flash.formats) {
    return 'maybe';
  }

  return '';
};

/**
 * Check if the media element can handle a source natively.
 *
 * @param {Tech~SourceObject} source
 *         The source object
 *
 * @param {Object} [options]
 *         Options to be passed to the tech.
 *
 * @return {string}
 *         'maybe', or '' (empty string).
 */
Flash.nativeSourceHandler.canHandleSource = function (source, options) {
  var type = void 0;

  function guessMimeType(src) {
    var ext = Url.getFileExtension(src);

    if (ext) {
      return 'video/' + ext;
    }
    return '';
  }

  if (!source.type) {
    type = guessMimeType(source.src);
  } else {
    // Strip code information from the type because we don't get that specific
    type = source.type.replace(/;.*/, '').toLowerCase();
  }

  return Flash.nativeSourceHandler.canPlayType(type);
};

/**
 * Pass the source to the swf.
 *
 * @param {Tech~SourceObject} source
 *        The source object
 *
 * @param {Flash} tech
 *        The instance of the Flash tech
 *
 * @param {Object} [options]
 *        The options to pass to the source
 */
Flash.nativeSourceHandler.handleSource = function (source, tech, options) {
  tech.setSrc(source.src);
};

/**
 * noop for native source handler dispose, as cleanup will happen automatically.
 */
Flash.nativeSourceHandler.dispose = function () {};

// Register the native source handler
Flash.registerSourceHandler(Flash.nativeSourceHandler);

/**
 * Flash supported mime types.
 *
 * @constant {Object}
 */
Flash.formats = {
  'video/flv': 'FLV',
  'video/x-flv': 'FLV',
  'video/mp4': 'MP4',
  'video/m4v': 'MP4'
};

/**
 * Called when the the swf is "ready", and makes sure that the swf is really
 * ready using {@link Flash#checkReady}
 */
Flash.onReady = function (currSwf) {
  var el = Dom.getEl(currSwf);
  var tech = el && el.tech;

  // if there is no el then the tech has been disposed
  // and the tech element was removed from the player div
  if (tech && tech.el()) {
    // check that the flash object is really ready
    Flash.checkReady(tech);
  }
};

/**
 * The SWF isn't always ready when it says it is. Sometimes the API functions still
 * need to be added to the object. If it's not ready, we set a timeout to check again
 * shortly.
 *
 * @param {Flash} tech
 *        The instance of the flash tech to check.
 */
Flash.checkReady = function (tech) {
  // stop worrying if the tech has been disposed
  if (!tech.el()) {
    return;
  }

  // check if API property exists
  if (tech.el().vjs_getProperty) {
    // tell tech it's ready
    tech.triggerReady();
  } else {
    // wait longer
    this.setTimeout(function () {
      Flash.checkReady(tech);
    }, 50);
  }
};

/**
 * Trigger events from the swf on the Flash Tech.
 *
 * @param {number} swfID
 *        The id of the swf that had the event
 *
 * @param {string} eventName
 *        The name of the event to trigger
 */
Flash.onEvent = function (swfID, eventName) {
  var tech = Dom.getEl(swfID).tech;
  var args = Array.prototype.slice.call(arguments, 2);

  // dispatch Flash events asynchronously for two reasons:
  // - Flash swallows any exceptions generated by javascript it
  //   invokes
  // - Flash is suspended until the javascript returns which may cause
  //   playback performance issues
  tech.setTimeout(function () {
    tech.trigger(eventName, args);
  }, 1);
};

/**
 * Log errors from the swf on the Flash tech.
 *
 * @param {number} swfID
 *        The id of the swf that had an error.
 *
 * @param {string} The error string
 *        The error to set on the Flash Tech.
 *
 * @return {MediaError|undefined}
 *          - Returns a MediaError when err is 'srcnotfound'
 *          - Returns undefined otherwise.
 */
Flash.onError = function (swfID, err) {
  var tech = Dom.getEl(swfID).tech;

  // trigger MEDIA_ERR_SRC_NOT_SUPPORTED
  if (err === 'srcnotfound') {
    return tech.error(4);
  }

  // trigger a custom error
  tech.error('FLASH: ' + err);
};

/**
 * Get the current version of Flash that is in use on the page.
 *
 * @return {Array}
 *          an array of versions that are available.
 */
Flash.version = function () {
  var version = '0,0,0';

  // IE
  try {
    version = new _window2['default'].ActiveXObject('ShockwaveFlash.ShockwaveFlash').GetVariable('$version').replace(/\D+/g, ',').match(/^,?(.+),?$/)[1];

    // other browsers
  } catch (e) {
    try {
      if (navigator.mimeTypes['application/x-shockwave-flash'].enabledPlugin) {
        version = (navigator.plugins['Shockwave Flash 2.0'] || navigator.plugins['Shockwave Flash']).description.replace(/\D+/g, ',').match(/^,?(.+),?$/)[1];
      }
    } catch (err) {
      // satisfy linter
    }
  }
  return version.split(',');
};

/**
 * Only use for non-iframe embeds.
 *
 * @param {Object} swf
 *        The videojs-swf object.
 *
 * @param {Object} flashVars
 *        Names and values to use as flash option variables.
 *
 * @param {Object} params
 *        Style parameters to set on the object.
 *
 * @param {Object} attributes
 *        Attributes to set on the element.
 *
 * @return {Element}
 *          The embeded Flash DOM element.
 */
Flash.embed = function (swf, flashVars, params, attributes) {
  var code = Flash.getEmbedCode(swf, flashVars, params, attributes);

  // Get element by embedding code and retrieving created element
  var obj = Dom.createEl('div', { innerHTML: code }).childNodes[0];

  return obj;
};

/**
 * Only use for non-iframe embeds.
 *
 * @param {Object} swf
 *        The videojs-swf object.
 *
 * @param {Object} flashVars
 *        Names and values to use as flash option variables.
 *
 * @param {Object} params
 *        Style parameters to set on the object.
 *
 * @param {Object} attributes
 *        Attributes to set on the element.
 *
 * @return {Element}
 *          The embeded Flash DOM element.
 */
Flash.getEmbedCode = function (swf, flashVars, params, attributes) {
  var objTag = '<object type="application/x-shockwave-flash" ';
  var flashVarsString = '';
  var paramsString = '';
  var attrsString = '';

  // Convert flash vars to string
  if (flashVars) {
    Object.getOwnPropertyNames(flashVars).forEach(function (key) {
      flashVarsString += key + '=' + flashVars[key] + '&amp;';
    });
  }

  // Add swf, flashVars, and other default params
  params = (0, _obj.assign)({
    movie: swf,
    flashvars: flashVarsString,
    // Required to talk to swf
    allowScriptAccess: 'always',
    // All should be default, but having security issues.
    allowNetworking: 'all'
  }, params);

  // Create param tags string
  Object.getOwnPropertyNames(params).forEach(function (key) {
    paramsString += '<param name="' + key + '" value="' + params[key] + '" />';
  });

  attributes = (0, _obj.assign)({
    // Add swf to attributes (need both for IE and Others to work)
    data: swf,

    // Default to 100% width/height
    width: '100%',
    height: '100%'

  }, attributes);

  // Create Attributes string
  Object.getOwnPropertyNames(attributes).forEach(function (key) {
    attrsString += key + '="' + attributes[key] + '" ';
  });

  return '' + objTag + attrsString + '>' + paramsString + '</object>';
};

// Run Flash through the RTMP decorator
(0, _flashRtmp2['default'])(Flash);

_component2['default'].registerComponent('Flash', Flash);
_tech2['default'].registerTech('Flash', Flash);
exports['default'] = Flash;

},{"5":5,"58":58,"62":62,"81":81,"88":88,"90":90,"92":92,"95":95}],60:[function(_dereq_,module,exports){
'use strict';

exports.__esModule = true;

var _templateObject = _taggedTemplateLiteralLoose(['Text Tracks are being loaded from another origin but the crossorigin attribute isn\'t used.\n            This may prevent text tracks from loading.'], ['Text Tracks are being loaded from another origin but the crossorigin attribute isn\'t used.\n            This may prevent text tracks from loading.']);

var _tech = _dereq_(62);

var _tech2 = _interopRequireDefault(_tech);

var _component = _dereq_(5);

var _component2 = _interopRequireDefault(_component);

var _dom = _dereq_(81);

var Dom = _interopRequireWildcard(_dom);

var _url = _dereq_(92);

var Url = _interopRequireWildcard(_url);

var _fn = _dereq_(83);

var Fn = _interopRequireWildcard(_fn);

var _log = _dereq_(86);

var _log2 = _interopRequireDefault(_log);

var _tsml = _dereq_(98);

var _tsml2 = _interopRequireDefault(_tsml);

var _browser = _dereq_(78);

var browser = _interopRequireWildcard(_browser);

var _document = _dereq_(94);

var _document2 = _interopRequireDefault(_document);

var _window = _dereq_(95);

var _window2 = _interopRequireDefault(_window);

var _obj = _dereq_(88);

var _mergeOptions = _dereq_(87);

var _mergeOptions2 = _interopRequireDefault(_mergeOptions);

var _toTitleCase = _dereq_(91);

var _toTitleCase2 = _interopRequireDefault(_toTitleCase);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _taggedTemplateLiteralLoose(strings, raw) { strings.raw = raw; return strings; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * @file html5.js
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                */


/**
 * HTML5 Media Controller - Wrapper for HTML5 Media API
 *
 * @mixes Tech~SouceHandlerAdditions
 * @extends Tech
 */
var Html5 = function (_Tech) {
  _inherits(Html5, _Tech);

  /**
   * Create an instance of this Tech.
   *
   * @param {Object} [options]
   *        The key/value store of player options.
   *
   * @param {Component~ReadyCallback} ready
   *        Callback function to call when the `HTML5` Tech is ready.
   */
  function Html5(options, ready) {
    _classCallCheck(this, Html5);

    var _this = _possibleConstructorReturn(this, _Tech.call(this, options, ready));

    var source = options.source;
    var crossoriginTracks = false;

    // Set the source if one is provided
    // 1) Check if the source is new (if not, we want to keep the original so playback isn't interrupted)
    // 2) Check to see if the network state of the tag was failed at init, and if so, reset the source
    // anyway so the error gets fired.
    if (source && (_this.el_.currentSrc !== source.src || options.tag && options.tag.initNetworkState_ === 3)) {
      _this.setSource(source);
    } else {
      _this.handleLateInit_(_this.el_);
    }

    if (_this.el_.hasChildNodes()) {

      var nodes = _this.el_.childNodes;
      var nodesLength = nodes.length;
      var removeNodes = [];

      while (nodesLength--) {
        var node = nodes[nodesLength];
        var nodeName = node.nodeName.toLowerCase();

        if (nodeName === 'track') {
          if (!_this.featuresNativeTextTracks) {
            // Empty video tag tracks so the built-in player doesn't use them also.
            // This may not be fast enough to stop HTML5 browsers from reading the tags
            // so we'll need to turn off any default tracks if we're manually doing
            // captions and subtitles. videoElement.textTracks
            removeNodes.push(node);
          } else {
            // store HTMLTrackElement and TextTrack to remote list
            _this.remoteTextTrackEls().addTrackElement_(node);
            _this.remoteTextTracks().addTrack_(node.track);
            if (!crossoriginTracks && !_this.el_.hasAttribute('crossorigin') && Url.isCrossOrigin(node.src)) {
              crossoriginTracks = true;
            }
          }
        }
      }

      for (var i = 0; i < removeNodes.length; i++) {
        _this.el_.removeChild(removeNodes[i]);
      }
    }

    // TODO: add text tracks into this list
    var trackTypes = ['audio', 'video'];

    // ProxyNative Video/Audio Track
    trackTypes.forEach(function (type) {
      var elTracks = _this.el()[type + 'Tracks'];
      var techTracks = _this[type + 'Tracks']();
      var capitalType = (0, _toTitleCase2['default'])(type);

      if (!_this['featuresNative' + capitalType + 'Tracks'] || !elTracks || !elTracks.addEventListener) {
        return;
      }

      _this['handle' + capitalType + 'TrackChange_'] = function (e) {
        techTracks.trigger({
          type: 'change',
          target: techTracks,
          currentTarget: techTracks,
          srcElement: techTracks
        });
      };

      _this['handle' + capitalType + 'TrackAdd_'] = function (e) {
        return techTracks.addTrack(e.track);
      };
      _this['handle' + capitalType + 'TrackRemove_'] = function (e) {
        return techTracks.removeTrack(e.track);
      };

      elTracks.addEventListener('change', _this['handle' + capitalType + 'TrackChange_']);
      elTracks.addEventListener('addtrack', _this['handle' + capitalType + 'TrackAdd_']);
      elTracks.addEventListener('removetrack', _this['handle' + capitalType + 'TrackRemove_']);
      _this['removeOld' + capitalType + 'Tracks_'] = function (e) {
        return _this.removeOldTracks_(techTracks, elTracks);
      };

      // Remove (native) tracks that are not used anymore
      _this.on('loadstart', _this['removeOld' + capitalType + 'Tracks_']);
    });

    if (_this.featuresNativeTextTracks) {
      if (crossoriginTracks) {
        _log2['default'].warn((0, _tsml2['default'])(_templateObject));
      }

      _this.handleTextTrackChange_ = Fn.bind(_this, _this.handleTextTrackChange);
      _this.handleTextTrackAdd_ = Fn.bind(_this, _this.handleTextTrackAdd);
      _this.handleTextTrackRemove_ = Fn.bind(_this, _this.handleTextTrackRemove);
      _this.proxyNativeTextTracks_();
    }

    // Determine if native controls should be used
    // Our goal should be to get the custom controls on mobile solid everywhere
    // so we can remove this all together. Right now this will block custom
    // controls on touch enabled laptops like the Chrome Pixel
    if ((browser.TOUCH_ENABLED || browser.IS_IPHONE || browser.IS_NATIVE_ANDROID) && options.nativeControlsForTouch === true) {
      _this.setControls(true);
    }

    // on iOS, we want to proxy `webkitbeginfullscreen` and `webkitendfullscreen`
    // into a `fullscreenchange` event
    _this.proxyWebkitFullscreen_();

    _this.triggerReady();
    return _this;
  }

  /**
   * Dispose of `HTML5` media element and remove all tracks.
   */


  Html5.prototype.dispose = function dispose() {
    var _this2 = this;

    // Un-ProxyNativeTracks
    ['audio', 'video', 'text'].forEach(function (type) {
      var capitalType = (0, _toTitleCase2['default'])(type);
      var tl = _this2.el_[type + 'Tracks'];

      if (tl && tl.removeEventListener) {
        tl.removeEventListener('change', _this2['handle' + capitalType + 'TrackChange_']);
        tl.removeEventListener('addtrack', _this2['handle' + capitalType + 'TrackAdd_']);
        tl.removeEventListener('removetrack', _this2['handle' + capitalType + 'TrackRemove_']);
      }

      // Stop removing old text tracks
      if (tl) {
        _this2.off('loadstart', _this2['removeOld' + capitalType + 'Tracks_']);
      }
    });

    Html5.disposeMediaElement(this.el_);
    // tech will handle clearing of the emulated track list
    _Tech.prototype.dispose.call(this);
  };

  /**
   * Create the `Html5` Tech's DOM element.
   *
   * @return {Element}
   *         The element that gets created.
   */


  Html5.prototype.createEl = function createEl() {
    var el = this.options_.tag;

    // Check if this browser supports moving the element into the box.
    // On the iPhone video will break if you move the element,
    // So we have to create a brand new element.
    // If we ingested the player div, we do not need to move the media element.
    if (!el || !(this.options_.playerElIngest || this.movingMediaElementInDOM)) {

      // If the original tag is still there, clone and remove it.
      if (el) {
        var clone = el.cloneNode(true);

        if (el.parentNode) {
          el.parentNode.insertBefore(clone, el);
        }
        Html5.disposeMediaElement(el);
        el = clone;
      } else {
        el = _document2['default'].createElement('video');

        // determine if native controls should be used
        var tagAttributes = this.options_.tag && Dom.getElAttributes(this.options_.tag);
        var attributes = (0, _mergeOptions2['default'])({}, tagAttributes);

        if (!browser.TOUCH_ENABLED || this.options_.nativeControlsForTouch !== true) {
          delete attributes.controls;
        }

        Dom.setElAttributes(el, (0, _obj.assign)(attributes, {
          id: this.options_.techId,
          'class': 'vjs-tech'
        }));
      }

      el.playerId = this.options_.playerId;
    }

    // Update specific tag settings, in case they were overridden
    var settingsAttrs = ['autoplay', 'preload', 'loop', 'muted', 'playsinline'];

    for (var i = settingsAttrs.length - 1; i >= 0; i--) {
      var attr = settingsAttrs[i];
      var overwriteAttrs = {};

      if (typeof this.options_[attr] !== 'undefined') {
        overwriteAttrs[attr] = this.options_[attr];
      }
      Dom.setElAttributes(el, overwriteAttrs);
    }

    return el;
  };

  /**
   * This will be triggered if the loadstart event has already fired, before videojs was
   * ready. Two known examples of when this can happen are:
   * 1. If we're loading the playback object after it has started loading
   * 2. The media is already playing the (often with autoplay on) then
   *
   * This function will fire another loadstart so that videojs can catchup.
   *
   * @fires Tech#loadstart
   *
   * @return {undefined}
   *         returns nothing.
   */


  Html5.prototype.handleLateInit_ = function handleLateInit_(el) {
    if (el.networkState === 0 || el.networkState === 3) {
      // The video element hasn't started loading the source yet
      // or didn't find a source
      return;
    }

    if (el.readyState === 0) {
      // NetworkState is set synchronously BUT loadstart is fired at the
      // end of the current stack, usually before setInterval(fn, 0).
      // So at this point we know loadstart may have already fired or is
      // about to fire, and either way the player hasn't seen it yet.
      // We don't want to fire loadstart prematurely here and cause a
      // double loadstart so we'll wait and see if it happens between now
      // and the next loop, and fire it if not.
      // HOWEVER, we also want to make sure it fires before loadedmetadata
      // which could also happen between now and the next loop, so we'll
      // watch for that also.
      var loadstartFired = false;
      var setLoadstartFired = function setLoadstartFired() {
        loadstartFired = true;
      };

      this.on('loadstart', setLoadstartFired);

      var triggerLoadstart = function triggerLoadstart() {
        // We did miss the original loadstart. Make sure the player
        // sees loadstart before loadedmetadata
        if (!loadstartFired) {
          this.trigger('loadstart');
        }
      };

      this.on('loadedmetadata', triggerLoadstart);

      this.ready(function () {
        this.off('loadstart', setLoadstartFired);
        this.off('loadedmetadata', triggerLoadstart);

        if (!loadstartFired) {
          // We did miss the original native loadstart. Fire it now.
          this.trigger('loadstart');
        }
      });

      return;
    }

    // From here on we know that loadstart already fired and we missed it.
    // The other readyState events aren't as much of a problem if we double
    // them, so not going to go to as much trouble as loadstart to prevent
    // that unless we find reason to.
    var eventsToTrigger = ['loadstart'];

    // loadedmetadata: newly equal to HAVE_METADATA (1) or greater
    eventsToTrigger.push('loadedmetadata');

    // loadeddata: newly increased to HAVE_CURRENT_DATA (2) or greater
    if (el.readyState >= 2) {
      eventsToTrigger.push('loadeddata');
    }

    // canplay: newly increased to HAVE_FUTURE_DATA (3) or greater
    if (el.readyState >= 3) {
      eventsToTrigger.push('canplay');
    }

    // canplaythrough: newly equal to HAVE_ENOUGH_DATA (4)
    if (el.readyState >= 4) {
      eventsToTrigger.push('canplaythrough');
    }

    // We still need to give the player time to add event listeners
    this.ready(function () {
      eventsToTrigger.forEach(function (type) {
        this.trigger(type);
      }, this);
    });
  };

  /**
   * Add event listeners to native text track events. This adds the native text tracks
   * to our emulated {@link TextTrackList}.
   */


  Html5.prototype.proxyNativeTextTracks_ = function proxyNativeTextTracks_() {
    var tt = this.el().textTracks;

    if (tt) {
      // Add tracks - if player is initialised after DOM loaded, textTracks
      // will not trigger addtrack
      for (var i = 0; i < tt.length; i++) {
        this.textTracks().addTrack_(tt[i]);
      }

      if (tt.addEventListener) {
        tt.addEventListener('change', this.handleTextTrackChange_);
        tt.addEventListener('addtrack', this.handleTextTrackAdd_);
        tt.addEventListener('removetrack', this.handleTextTrackRemove_);
      }

      // Remove (native) texttracks that are not used anymore
      this.on('loadstart', this.removeOldTextTracks_);
    }
  };

  /**
   * Handle any {@link TextTrackList} `change` event.
   *
   * @param {EventTarget~Event} e
   *        The `change` event that caused this to run.
   *
   * @listens TextTrackList#change
   */


  Html5.prototype.handleTextTrackChange = function handleTextTrackChange(e) {
    var tt = this.textTracks();

    this.textTracks().trigger({
      type: 'change',
      target: tt,
      currentTarget: tt,
      srcElement: tt
    });
  };

  /**
   * Handle any {@link TextTrackList} `addtrack` event.
   *
   * @param {EventTarget~Event} e
   *        The `addtrack` event that caused this to run.
   *
   * @listens TextTrackList#addtrack
   */


  Html5.prototype.handleTextTrackAdd = function handleTextTrackAdd(e) {
    this.textTracks().addTrack_(e.track);
  };

  /**
   * Handle any {@link TextTrackList} `removetrack` event.
   *
   * @param {EventTarget~Event} e
   *        The `removetrack` event that caused this to run.
   *
   * @listens TextTrackList#removetrack
   */


  Html5.prototype.handleTextTrackRemove = function handleTextTrackRemove(e) {
    this.textTracks().removeTrack_(e.track);
  };

  /**
   * This function removes any {@link AudioTrack}s, {@link VideoTrack}s, or
   * {@link TextTrack}s that are not in the media elements TrackList.
   *
   * @param {TrackList} techTracks
   *        HTML5 Tech's TrackList to search through
   *
   * @param {TrackList} elTracks
   *        HTML5 media elements TrackList to search trough.
   *
   * @private
   */


  Html5.prototype.removeOldTracks_ = function removeOldTracks_(techTracks, elTracks) {
    // This will loop over the techTracks and check if they are still used by the HTML5 media element
    // If not, they will be removed from the emulated list
    var removeTracks = [];

    if (!elTracks) {
      return;
    }

    for (var i = 0; i < techTracks.length; i++) {
      var techTrack = techTracks[i];
      var found = false;

      for (var j = 0; j < elTracks.length; j++) {
        if (elTracks[j] === techTrack) {
          found = true;
          break;
        }
      }

      if (!found) {
        removeTracks.push(techTrack);
      }
    }

    for (var _i = 0; _i < removeTracks.length; _i++) {
      var track = removeTracks[_i];

      techTracks.removeTrack_(track);
    }
  };

  /**
   * Remove {@link TextTrack}s that dont exist in the native track list from our
   * emulated {@link TextTrackList}.
   *
   * @listens Tech#loadstart
   */


  Html5.prototype.removeOldTextTracks_ = function removeOldTextTracks_(e) {
    var techTracks = this.textTracks();
    var elTracks = this.el().textTracks;

    this.removeOldTracks_(techTracks, elTracks);
  };

  /**
   * Called by {@link Player#play} to play using the `Html5` `Tech`.
   */


  Html5.prototype.play = function play() {
    var playPromise = this.el_.play();

    // Catch/silence error when a pause interrupts a play request
    // on browsers which return a promise
    if (playPromise !== undefined && typeof playPromise.then === 'function') {
      playPromise.then(null, function (e) {});
    }
  };

  /**
   * Set current time for the `HTML5` tech.
   *
   * @param {number} seconds
   *        Set the current time of the media to this.
   */


  Html5.prototype.setCurrentTime = function setCurrentTime(seconds) {
    try {
      this.el_.currentTime = seconds;
    } catch (e) {
      (0, _log2['default'])(e, 'Video is not ready. (Video.js)');
      // this.warning(VideoJS.warnings.videoNotReady);
    }
  };

  /**
   * Get the current duration of the HTML5 media element.
   *
   * @return {number}
   *         The duration of the media or 0 if there is no duration.
   */


  Html5.prototype.duration = function duration() {
    var _this3 = this;

    // Android Chrome will report duration as Infinity for VOD HLS until after
    // playback has started, which triggers the live display erroneously.
    // Return NaN if playback has not started and trigger a durationupdate once
    // the duration can be reliably known.
    if (this.el_.duration === Infinity && browser.IS_ANDROID && browser.IS_CHROME) {
      if (this.el_.currentTime === 0) {
        // Wait for the first `timeupdate` with currentTime > 0 - there may be
        // several with 0
        var checkProgress = function checkProgress() {
          if (_this3.el_.currentTime > 0) {
            // Trigger durationchange for genuinely live video
            if (_this3.el_.duration === Infinity) {
              _this3.trigger('durationchange');
            }
            _this3.off('timeupdate', checkProgress);
          }
        };

        this.on('timeupdate', checkProgress);
        return NaN;
      }
    }
    return this.el_.duration || NaN;
  };

  /**
   * Get the current width of the HTML5 media element.
   *
   * @return {number}
   *         The width of the HTML5 media element.
   */


  Html5.prototype.width = function width() {
    return this.el_.offsetWidth;
  };

  /**
   * Get the current height of the HTML5 media element.
   *
   * @return {number}
   *         The heigth of the HTML5 media element.
   */


  Html5.prototype.height = function height() {
    return this.el_.offsetHeight;
  };

  /**
   * Proxy iOS `webkitbeginfullscreen` and `webkitendfullscreen` into
   * `fullscreenchange` event.
   *
   * @private
   * @fires fullscreenchange
   * @listens webkitendfullscreen
   * @listens webkitbeginfullscreen
   * @listens webkitbeginfullscreen
   */


  Html5.prototype.proxyWebkitFullscreen_ = function proxyWebkitFullscreen_() {
    var _this4 = this;

    if (!('webkitDisplayingFullscreen' in this.el_)) {
      return;
    }

    var endFn = function endFn() {
      this.trigger('fullscreenchange', { isFullscreen: false });
    };

    var beginFn = function beginFn() {
      if ('webkitPresentationMode' in this.el_ && this.el_.webkitPresentationMode !== 'picture-in-picture') {
        this.one('webkitendfullscreen', endFn);

        this.trigger('fullscreenchange', { isFullscreen: true });
      }
    };

    this.on('webkitbeginfullscreen', beginFn);
    this.on('dispose', function () {
      _this4.off('webkitbeginfullscreen', beginFn);
      _this4.off('webkitendfullscreen', endFn);
    });
  };

  /**
   * Check if fullscreen is supported on the current playback device.
   *
   * @return {boolean}
   *         - True if fullscreen is supported.
   *         - False if fullscreen is not supported.
   */


  Html5.prototype.supportsFullScreen = function supportsFullScreen() {
    if (typeof this.el_.webkitEnterFullScreen === 'function') {
      var userAgent = _window2['default'].navigator && _window2['default'].navigator.userAgent || '';

      // Seems to be broken in Chromium/Chrome && Safari in Leopard
      if (/Android/.test(userAgent) || !/Chrome|Mac OS X 10.5/.test(userAgent)) {
        return true;
      }
    }
    return false;
  };

  /**
   * Request that the `HTML5` Tech enter fullscreen.
   */


  Html5.prototype.enterFullScreen = function enterFullScreen() {
    var video = this.el_;

    if (video.paused && video.networkState <= video.HAVE_METADATA) {
      // attempt to prime the video element for programmatic access
      // this isn't necessary on the desktop but shouldn't hurt
      this.el_.play();

      // playing and pausing synchronously during the transition to fullscreen
      // can get iOS ~6.1 devices into a play/pause loop
      this.setTimeout(function () {
        video.pause();
        video.webkitEnterFullScreen();
      }, 0);
    } else {
      video.webkitEnterFullScreen();
    }
  };

  /**
   * Request that the `HTML5` Tech exit fullscreen.
   */


  Html5.prototype.exitFullScreen = function exitFullScreen() {
    this.el_.webkitExitFullScreen();
  };

  /**
   * A getter/setter for the `Html5` Tech's source object.
   * > Note: Please use {@link Html5#setSource}
   *
   * @param {Tech~SourceObject} [src]
   *        The source object you want to set on the `HTML5` techs element.
   *
   * @return {Tech~SourceObject|undefined}
   *         - The current source object when a source is not passed in.
   *         - undefined when setting
   *
   * @deprecated Since version 5.
   */


  Html5.prototype.src = function src(_src) {
    if (_src === undefined) {
      return this.el_.src;
    }

    // Setting src through `src` instead of `setSrc` will be deprecated
    this.setSrc(_src);
  };

  /**
   * Reset the tech by removing all sources and then calling
   * {@link Html5.resetMediaElement}.
   */


  Html5.prototype.reset = function reset() {
    Html5.resetMediaElement(this.el_);
  };

  /**
   * Get the current source on the `HTML5` Tech. Falls back to returning the source from
   * the HTML5 media element.
   *
   * @return {Tech~SourceObject}
   *         The current source object from the HTML5 tech. With a fallback to the
   *         elements source.
   */


  Html5.prototype.currentSrc = function currentSrc() {
    if (this.currentSource_) {
      return this.currentSource_.src;
    }
    return this.el_.currentSrc;
  };

  /**
   * Set controls attribute for the HTML5 media Element.
   *
   * @param {string} val
   *        Value to set the controls attribute to
   */


  Html5.prototype.setControls = function setControls(val) {
    this.el_.controls = !!val;
  };

  /**
   * Create and returns a remote {@link TextTrack} object.
   *
   * @param {string} kind
   *        `TextTrack` kind (subtitles, captions, descriptions, chapters, or metadata)
   *
   * @param {string} [label]
   *        Label to identify the text track
   *
   * @param {string} [language]
   *        Two letter language abbreviation
   *
   * @return {TextTrack}
   *         The TextTrack that gets created.
   */


  Html5.prototype.addTextTrack = function addTextTrack(kind, label, language) {
    if (!this.featuresNativeTextTracks) {
      return _Tech.prototype.addTextTrack.call(this, kind, label, language);
    }

    return this.el_.addTextTrack(kind, label, language);
  };

  /**
   * Creates either native TextTrack or an emulated TextTrack depending
   * on the value of `featuresNativeTextTracks`
   *
   * @param {Object} options
   *        The object should contain the options to intialize the TextTrack with.
   *
   * @param {string} [options.kind]
   *        `TextTrack` kind (subtitles, captions, descriptions, chapters, or metadata).
   *
   * @param {string} [options.label].
   *        Label to identify the text track
   *
   * @param {string} [options.language]
   *        Two letter language abbreviation.
   *
   * @param {boolean} [options.default]
   *        Default this track to on.
   *
   * @param {string} [options.id]
   *        The internal id to assign this track.
   *
   * @param {string} [options.src]
   *        A source url for the track.
   *
   * @return {HTMLTrackElement}
   *         The track element that gets created.
   */


  Html5.prototype.createRemoteTextTrack = function createRemoteTextTrack(options) {
    if (!this.featuresNativeTextTracks) {
      return _Tech.prototype.createRemoteTextTrack.call(this, options);
    }
    var htmlTrackElement = _document2['default'].createElement('track');

    if (options.kind) {
      htmlTrackElement.kind = options.kind;
    }
    if (options.label) {
      htmlTrackElement.label = options.label;
    }
    if (options.language || options.srclang) {
      htmlTrackElement.srclang = options.language || options.srclang;
    }
    if (options['default']) {
      htmlTrackElement['default'] = options['default'];
    }
    if (options.id) {
      htmlTrackElement.id = options.id;
    }
    if (options.src) {
      htmlTrackElement.src = options.src;
    }

    return htmlTrackElement;
  };

  /**
   * Creates a remote text track object and returns an html track element.
   *
   * @param {Object} options The object should contain values for
   * kind, language, label, and src (location of the WebVTT file)
   * @param {Boolean} [manualCleanup=true] if set to false, the TextTrack will be
   * automatically removed from the video element whenever the source changes
   * @return {HTMLTrackElement} An Html Track Element.
   * This can be an emulated {@link HTMLTrackElement} or a native one.
   * @deprecated The default value of the "manualCleanup" parameter will default
   * to "false" in upcoming versions of Video.js
   */


  Html5.prototype.addRemoteTextTrack = function addRemoteTextTrack(options, manualCleanup) {
    var htmlTrackElement = _Tech.prototype.addRemoteTextTrack.call(this, options, manualCleanup);

    if (this.featuresNativeTextTracks) {
      this.el().appendChild(htmlTrackElement);
    }

    return htmlTrackElement;
  };

  /**
   * Remove remote `TextTrack` from `TextTrackList` object
   *
   * @param {TextTrack} track
   *        `TextTrack` object to remove
   */


  Html5.prototype.removeRemoteTextTrack = function removeRemoteTextTrack(track) {
    _Tech.prototype.removeRemoteTextTrack.call(this, track);

    if (this.featuresNativeTextTracks) {
      var tracks = this.$$('track');

      var i = tracks.length;

      while (i--) {
        if (track === tracks[i] || track === tracks[i].track) {
          this.el().removeChild(tracks[i]);
        }
      }
    }
  };

  /**
   * Get the value of `playsinline` from the media element. `playsinline` indicates
   * to the browser that non-fullscreen playback is preferred when fullscreen
   * playback is the native default, such as in iOS Safari.
   *
   * @method Html5#playsinline
   * @return {boolean}
   *         - The value of `playsinline` from the media element.
   *         - True indicates that the media should play inline.
   *         - False indicates that the media should not play inline.
   *
   * @see [Spec]{@link https://html.spec.whatwg.org/#attr-video-playsinline}
   */


  Html5.prototype.playsinline = function playsinline() {
    return this.el_.hasAttribute('playsinline');
  };

  /**
   * Set the value of `playsinline` from the media element. `playsinline` indicates
   * to the browser that non-fullscreen playback is preferred when fullscreen
   * playback is the native default, such as in iOS Safari.
   *
   * @method Html5#setPlaysinline
   * @param {boolean} playsinline
   *         - True indicates that the media should play inline.
   *         - False indicates that the media should not play inline.
   *
   * @see [Spec]{@link https://html.spec.whatwg.org/#attr-video-playsinline}
   */


  Html5.prototype.setPlaysinline = function setPlaysinline(value) {
    if (value) {
      this.el_.setAttribute('playsinline', 'playsinline');
    } else {
      this.el_.removeAttribute('playsinline');
    }
  };

  /**
   * Gets available media playback quality metrics as specified by the W3C's Media
   * Playback Quality API.
   *
   * @see [Spec]{@link https://wicg.github.io/media-playback-quality}
   *
   * @return {Object}
   *         An object with supported media playback quality metrics
   */


  Html5.prototype.getVideoPlaybackQuality = function getVideoPlaybackQuality() {
    if (typeof this.el().getVideoPlaybackQuality === 'function') {
      return this.el().getVideoPlaybackQuality();
    }

    var videoPlaybackQuality = {};

    if (typeof this.el().webkitDroppedFrameCount !== 'undefined' && typeof this.el().webkitDecodedFrameCount !== 'undefined') {
      videoPlaybackQuality.droppedVideoFrames = this.el().webkitDroppedFrameCount;
      videoPlaybackQuality.totalVideoFrames = this.el().webkitDecodedFrameCount;
    }

    if (_window2['default'].performance && typeof _window2['default'].performance.now === 'function') {
      videoPlaybackQuality.creationTime = _window2['default'].performance.now();
    } else if (_window2['default'].performance && _window2['default'].performance.timing && typeof _window2['default'].performance.timing.navigationStart === 'number') {
      videoPlaybackQuality.creationTime = _window2['default'].Date.now() - _window2['default'].performance.timing.navigationStart;
    }

    return videoPlaybackQuality;
  };

  return Html5;
}(_tech2['default']);

/* HTML5 Support Testing ---------------------------------------------------- */

if (Dom.isReal()) {

  /**
   * Element for testing browser HTML5 media capabilities
   *
   * @type {Element}
   * @constant
   * @private
   */
  Html5.TEST_VID = _document2['default'].createElement('video');
  var track = _document2['default'].createElement('track');

  track.kind = 'captions';
  track.srclang = 'en';
  track.label = 'English';
  Html5.TEST_VID.appendChild(track);
}

/**
 * Check if HTML5 media is supported by this browser/device.
 *
 * @return {boolean}
 *         - True if HTML5 media is supported.
 *         - False if HTML5 media is not supported.
 */
Html5.isSupported = function () {
  // IE9 with no Media Player is a LIAR! (#984)
  try {
    Html5.TEST_VID.volume = 0.5;
  } catch (e) {
    return false;
  }

  return !!(Html5.TEST_VID && Html5.TEST_VID.canPlayType);
};

/**
 * Check if the volume can be changed in this browser/device.
 * Volume cannot be changed in a lot of mobile devices.
 * Specifically, it can't be changed from 1 on iOS.
 *
 * @return {boolean}
 *         - True if volume can be controlled
 *         - False otherwise
 */
Html5.canControlVolume = function () {
  // IE will error if Windows Media Player not installed #3315
  try {
    var volume = Html5.TEST_VID.volume;

    Html5.TEST_VID.volume = volume / 2 + 0.1;
    return volume !== Html5.TEST_VID.volume;
  } catch (e) {
    return false;
  }
};

/**
 * Check if the playback rate can be changed in this browser/device.
 *
 * @return {boolean}
 *         - True if playback rate can be controlled
 *         - False otherwise
 */
Html5.canControlPlaybackRate = function () {
  // Playback rate API is implemented in Android Chrome, but doesn't do anything
  // https://github.com/videojs/video.js/issues/3180
  if (browser.IS_ANDROID && browser.IS_CHROME && browser.CHROME_VERSION < 58) {
    return false;
  }
  // IE will error if Windows Media Player not installed #3315
  try {
    var playbackRate = Html5.TEST_VID.playbackRate;

    Html5.TEST_VID.playbackRate = playbackRate / 2 + 0.1;
    return playbackRate !== Html5.TEST_VID.playbackRate;
  } catch (e) {
    return false;
  }
};

/**
 * Check to see if native `TextTrack`s are supported by this browser/device.
 *
 * @return {boolean}
 *         - True if native `TextTrack`s are supported.
 *         - False otherwise
 */
Html5.supportsNativeTextTracks = function () {
  return browser.IS_ANY_SAFARI;
};

/**
 * Check to see if native `VideoTrack`s are supported by this browser/device
 *
 * @return {boolean}
 *        - True if native `VideoTrack`s are supported.
 *        - False otherwise
 */
Html5.supportsNativeVideoTracks = function () {
  return !!(Html5.TEST_VID && Html5.TEST_VID.videoTracks);
};

/**
 * Check to see if native `AudioTrack`s are supported by this browser/device
 *
 * @return {boolean}
 *        - True if native `AudioTrack`s are supported.
 *        - False otherwise
 */
Html5.supportsNativeAudioTracks = function () {
  return !!(Html5.TEST_VID && Html5.TEST_VID.audioTracks);
};

/**
 * An array of events available on the Html5 tech.
 *
 * @private
 * @type {Array}
 */
Html5.Events = ['loadstart', 'suspend', 'abort', 'error', 'emptied', 'stalled', 'loadedmetadata', 'loadeddata', 'canplay', 'canplaythrough', 'playing', 'waiting', 'seeking', 'seeked', 'ended', 'durationchange', 'timeupdate', 'progress', 'play', 'pause', 'ratechange', 'volumechange'];

/**
 * Boolean indicating whether the `Tech` supports volume control.
 *
 * @type {boolean}
 * @default {@link Html5.canControlVolume}
 */
Html5.prototype.featuresVolumeControl = Html5.canControlVolume();

/**
 * Boolean indicating whether the `Tech` supports changing the speed at which the media
 * plays. Examples:
 *   - Set player to play 2x (twice) as fast
 *   - Set player to play 0.5x (half) as fast
 *
 * @type {boolean}
 * @default {@link Html5.canControlPlaybackRate}
 */
Html5.prototype.featuresPlaybackRate = Html5.canControlPlaybackRate();

/**
 * Boolean indicating whether the `HTML5` tech currently supports the media element
 * moving in the DOM. iOS breaks if you move the media element, so this is set this to
 * false there. Everywhere else this should be true.
 *
 * @type {boolean}
 * @default
 */
Html5.prototype.movingMediaElementInDOM = !browser.IS_IOS;

// TODO: Previous comment: No longer appears to be used. Can probably be removed.
//       Is this true?
/**
 * Boolean indicating whether the `HTML5` tech currently supports automatic media resize
 * when going into fullscreen.
 *
 * @type {boolean}
 * @default
 */
Html5.prototype.featuresFullscreenResize = true;

/**
 * Boolean indicating whether the `HTML5` tech currently supports the progress event.
 * If this is false, manual `progress` events will be triggred instead.
 *
 * @type {boolean}
 * @default
 */
Html5.prototype.featuresProgressEvents = true;

/**
 * Boolean indicating whether the `HTML5` tech currently supports the timeupdate event.
 * If this is false, manual `timeupdate` events will be triggred instead.
 *
 * @default
 */
Html5.prototype.featuresTimeupdateEvents = true;

/**
 * Boolean indicating whether the `HTML5` tech currently supports native `TextTrack`s.
 *
 * @type {boolean}
 * @default {@link Html5.supportsNativeTextTracks}
 */
Html5.prototype.featuresNativeTextTracks = Html5.supportsNativeTextTracks();

/**
 * Boolean indicating whether the `HTML5` tech currently supports native `VideoTrack`s.
 *
 * @type {boolean}
 * @default {@link Html5.supportsNativeVideoTracks}
 */
Html5.prototype.featuresNativeVideoTracks = Html5.supportsNativeVideoTracks();

/**
 * Boolean indicating whether the `HTML5` tech currently supports native `AudioTrack`s.
 *
 * @type {boolean}
 * @default {@link Html5.supportsNativeAudioTracks}
 */
Html5.prototype.featuresNativeAudioTracks = Html5.supportsNativeAudioTracks();

// HTML5 Feature detection and Device Fixes --------------------------------- //
var canPlayType = Html5.TEST_VID && Html5.TEST_VID.constructor.prototype.canPlayType;
var mpegurlRE = /^application\/(?:x-|vnd\.apple\.)mpegurl/i;
var mp4RE = /^video\/mp4/i;

Html5.patchCanPlayType = function () {

  // Android 4.0 and above can play HLS to some extent but it reports being unable to do so
  if (browser.ANDROID_VERSION >= 4.0 && !browser.IS_FIREFOX) {
    Html5.TEST_VID.constructor.prototype.canPlayType = function (type) {
      if (type && mpegurlRE.test(type)) {
        return 'maybe';
      }
      return canPlayType.call(this, type);
    };

    // Override Android 2.2 and less canPlayType method which is broken
  } else if (browser.IS_OLD_ANDROID) {
    Html5.TEST_VID.constructor.prototype.canPlayType = function (type) {
      if (type && mp4RE.test(type)) {
        return 'maybe';
      }
      return canPlayType.call(this, type);
    };
  }
};

Html5.unpatchCanPlayType = function () {
  var r = Html5.TEST_VID.constructor.prototype.canPlayType;

  Html5.TEST_VID.constructor.prototype.canPlayType = canPlayType;
  return r;
};

// by default, patch the media element
Html5.patchCanPlayType();

Html5.disposeMediaElement = function (el) {
  if (!el) {
    return;
  }

  if (el.parentNode) {
    el.parentNode.removeChild(el);
  }

  // remove any child track or source nodes to prevent their loading
  while (el.hasChildNodes()) {
    el.removeChild(el.firstChild);
  }

  // remove any src reference. not setting `src=''` because that causes a warning
  // in firefox
  el.removeAttribute('src');

  // force the media element to update its loading state by calling load()
  // however IE on Windows 7N has a bug that throws an error so need a try/catch (#793)
  if (typeof el.load === 'function') {
    // wrapping in an iife so it's not deoptimized (#1060#discussion_r10324473)
    (function () {
      try {
        el.load();
      } catch (e) {
        // not supported
      }
    })();
  }
};

Html5.resetMediaElement = function (el) {
  if (!el) {
    return;
  }

  var sources = el.querySelectorAll('source');
  var i = sources.length;

  while (i--) {
    el.removeChild(sources[i]);
  }

  // remove any src reference.
  // not setting `src=''` because that throws an error
  el.removeAttribute('src');

  if (typeof el.load === 'function') {
    // wrapping in an iife so it's not deoptimized (#1060#discussion_r10324473)
    (function () {
      try {
        el.load();
      } catch (e) {
        // satisfy linter
      }
    })();
  }
};

/* Native HTML5 element property wrapping ----------------------------------- */
// Wrap native properties with a getter
[
/**
 * Get the value of `paused` from the media element. `paused` indicates whether the media element
 * is currently paused or not.
 *
 * @method Html5#paused
 * @return {boolean}
 *         The value of `paused` from the media element.
 *
 * @see [Spec]{@link https://www.w3.org/TR/html5/embedded-content-0.html#dom-media-paused}
 */
'paused',

/**
 * Get the value of `currentTime` from the media element. `currentTime` indicates
 * the current second that the media is at in playback.
 *
 * @method Html5#currentTime
 * @return {number}
 *         The value of `currentTime` from the media element.
 *
 * @see [Spec]{@link https://www.w3.org/TR/html5/embedded-content-0.html#dom-media-currenttime}
 */
'currentTime',

/**
 * Get the value of `buffered` from the media element. `buffered` is a `TimeRange`
 * object that represents the parts of the media that are already downloaded and
 * available for playback.
 *
 * @method Html5#buffered
 * @return {TimeRange}
 *         The value of `buffered` from the media element.
 *
 * @see [Spec]{@link https://www.w3.org/TR/html5/embedded-content-0.html#dom-media-buffered}
 */
'buffered',

/**
 * Get the value of `volume` from the media element. `volume` indicates
 * the current playback volume of audio for a media. `volume` will be a value from 0
 * (silent) to 1 (loudest and default).
 *
 * @method Html5#volume
 * @return {number}
 *         The value of `volume` from the media element. Value will be between 0-1.
 *
 * @see [Spec]{@link https://www.w3.org/TR/html5/embedded-content-0.html#dom-a-volume}
 */
'volume',

/**
 * Get the value of `muted` from the media element. `muted` indicates
 * that the volume for the media should be set to silent. This does not actually change
 * the `volume` attribute.
 *
 * @method Html5#muted
 * @return {boolean}
 *         - True if the value of `volume` should be ignored and the audio set to silent.
 *         - False if the value of `volume` should be used.
 *
 * @see [Spec]{@link https://www.w3.org/TR/html5/embedded-content-0.html#dom-media-muted}
 */
'muted',

/**
 * Get the value of `poster` from the media element. `poster` indicates
 * that the url of an image file that can/will be shown when no media data is available.
 *
 * @method Html5#poster
 * @return {string}
 *         The value of `poster` from the media element. Value will be a url to an
 *         image.
 *
 * @see [Spec]{@link https://www.w3.org/TR/html5/embedded-content-0.html#attr-video-poster}
 */
'poster',

/**
 * Get the value of `preload` from the media element. `preload` indicates
 * what should download before the media is interacted with. It can have the following
 * values:
 * - none: nothing should be downloaded
 * - metadata: poster and the first few frames of the media may be downloaded to get
 *   media dimensions and other metadata
 * - auto: allow the media and metadata for the media to be downloaded before
 *    interaction
 *
 * @method Html5#preload
 * @return {string}
 *         The value of `preload` from the media element. Will be 'none', 'metadata',
 *         or 'auto'.
 *
 * @see [Spec]{@link https://www.w3.org/TR/html5/embedded-content-0.html#attr-media-preload}
 */
'preload',

/**
 * Get the value of `autoplay` from the media element. `autoplay` indicates
 * that the media should start to play as soon as the page is ready.
 *
 * @method Html5#autoplay
 * @return {boolean}
 *         - The value of `autoplay` from the media element.
 *         - True indicates that the media should start as soon as the page loads.
 *         - False indicates that the media should not start as soon as the page loads.
 *
 * @see [Spec]{@link https://www.w3.org/TR/html5/embedded-content-0.html#attr-media-autoplay}
 */
'autoplay',

/**
 * Get the value of `controls` from the media element. `controls` indicates
 * whether the native media controls should be shown or hidden.
 *
 * @method Html5#controls
 * @return {boolean}
 *         - The value of `controls` from the media element.
 *         - True indicates that native controls should be showing.
 *         - False indicates that native controls should be hidden.
 *
 * @see [Spec]{@link https://www.w3.org/TR/html5/embedded-content-0.html#attr-media-controls}
 */
'controls',

/**
 * Get the value of `loop` from the media element. `loop` indicates
 * that the media should return to the start of the media and continue playing once
 * it reaches the end.
 *
 * @method Html5#loop
 * @return {boolean}
 *         - The value of `loop` from the media element.
 *         - True indicates that playback should seek back to start once
 *           the end of a media is reached.
 *         - False indicates that playback should not loop back to the start when the
 *           end of the media is reached.
 *
 * @see [Spec]{@link https://www.w3.org/TR/html5/embedded-content-0.html#attr-media-loop}
 */
'loop',

/**
 * Get the value of the `error` from the media element. `error` indicates any
 * MediaError that may have occured during playback. If error returns null there is no
 * current error.
 *
 * @method Html5#error
 * @return {MediaError|null}
 *         The value of `error` from the media element. Will be `MediaError` if there
 *         is a current error and null otherwise.
 *
 * @see [Spec]{@link https://www.w3.org/TR/html5/embedded-content-0.html#dom-media-error}
 */
'error',

/**
 * Get the value of `seeking` from the media element. `seeking` indicates whether the
 * media is currently seeking to a new position or not.
 *
 * @method Html5#seeking
 * @return {boolean}
 *         - The value of `seeking` from the media element.
 *         - True indicates that the media is currently seeking to a new position.
 *         - Flase indicates that the media is not seeking to a new position at this time.
 *
 * @see [Spec]{@link https://www.w3.org/TR/html5/embedded-content-0.html#dom-media-seeking}
 */
'seeking',

/**
 * Get the value of `seekable` from the media element. `seekable` returns a
 * `TimeRange` object indicating ranges of time that can currently be `seeked` to.
 *
 * @method Html5#seekable
 * @return {TimeRange}
 *         The value of `seekable` from the media element. A `TimeRange` object
 *         indicating the current ranges of time that can be seeked to.
 *
 * @see [Spec]{@link https://www.w3.org/TR/html5/embedded-content-0.html#dom-media-seekable}
 */
'seekable',

/**
 * Get the value of `ended` from the media element. `ended` indicates whether
 * the media has reached the end or not.
 *
 * @method Html5#ended
 * @return {boolean}
 *         - The value of `ended` from the media element.
 *         - True indicates that the media has ended.
 *         - False indicates that the media has not ended.
 *
 * @see [Spec]{@link https://www.w3.org/TR/html5/embedded-content-0.html#dom-media-ended}
 */
'ended',

/**
 * Get the value of `defaultMuted` from the media element. `defaultMuted` indicates
 * whether the media should start muted or not. Only changes the default state of the
 * media. `muted` and `defaultMuted` can have different values. `muted` indicates the
 * current state.
 *
 * @method Html5#defaultMuted
 * @return {boolean}
 *         - The value of `defaultMuted` from the media element.
 *         - True indicates that the media should start muted.
 *         - False indicates that the media should not start muted
 *
 * @see [Spec]{@link https://www.w3.org/TR/html5/embedded-content-0.html#dom-media-defaultmuted}
 */
'defaultMuted',

/**
 * Get the value of `playbackRate` from the media element. `playbackRate` indicates
 * the rate at which the media is currently playing back. Examples:
 *   - if playbackRate is set to 2, media will play twice as fast.
 *   - if playbackRate is set to 0.5, media will play half as fast.
 *
 * @method Html5#playbackRate
 * @return {number}
 *         The value of `playbackRate` from the media element. A number indicating
 *         the current playback speed of the media, where 1 is normal speed.
 *
 * @see [Spec]{@link https://www.w3.org/TR/html5/embedded-content-0.html#dom-media-playbackrate}
 */
'playbackRate',

/**
 * Get the value of `played` from the media element. `played` returns a `TimeRange`
 * object representing points in the media timeline that have been played.
 *
 * @method Html5#played
 * @return {TimeRange}
 *         The value of `played` from the media element. A `TimeRange` object indicating
 *         the ranges of time that have been played.
 *
 * @see [Spec]{@link https://www.w3.org/TR/html5/embedded-content-0.html#dom-media-played}
 */
'played',

/**
 * Get the value of `networkState` from the media element. `networkState` indicates
 * the current network state. It returns an enumeration from the following list:
 * - 0: NETWORK_EMPTY
 * - 1: NEWORK_IDLE
 * - 2: NETWORK_LOADING
 * - 3: NETWORK_NO_SOURCE
 *
 * @method Html5#networkState
 * @return {number}
 *         The value of `networkState` from the media element. This will be a number
 *         from the list in the description.
 *
 * @see [Spec] {@link https://www.w3.org/TR/html5/embedded-content-0.html#dom-media-networkstate}
 */
'networkState',

/**
 * Get the value of `readyState` from the media element. `readyState` indicates
 * the current state of the media element. It returns an enumeration from the
 * following list:
 * - 0: HAVE_NOTHING
 * - 1: HAVE_METADATA
 * - 2: HAVE_CURRENT_DATA
 * - 3: HAVE_FUTURE_DATA
 * - 4: HAVE_ENOUGH_DATA
 *
 * @method Html5#readyState
 * @return {number}
 *         The value of `readyState` from the media element. This will be a number
 *         from the list in the description.
 *
 * @see [Spec] {@link https://www.w3.org/TR/html5/embedded-content-0.html#ready-states}
 */
'readyState',

/**
 * Get the value of `videoWidth` from the video element. `videoWidth` indicates
 * the current width of the video in css pixels.
 *
 * @method Html5#videoWidth
 * @return {number}
 *         The value of `videoWidth` from the video element. This will be a number
 *         in css pixels.
 *
 * @see [Spec] {@link https://www.w3.org/TR/html5/embedded-content-0.html#dom-video-videowidth}
 */
'videoWidth',

/**
 * Get the value of `videoHeight` from the video element. `videoHeigth` indicates
 * the current height of the video in css pixels.
 *
 * @method Html5#videoHeight
 * @return {number}
 *         The value of `videoHeight` from the video element. This will be a number
 *         in css pixels.
 *
 * @see [Spec] {@link https://www.w3.org/TR/html5/embedded-content-0.html#dom-video-videowidth}
 */
'videoHeight'].forEach(function (prop) {
  Html5.prototype[prop] = function () {
    return this.el_[prop];
  };
});

// Wrap native properties with a setter in this format:
// set + toTitleCase(name)
[
/**
 * Set the value of `volume` on the media element. `volume` indicates the current
 * audio level as a percentage in decimal form. This means that 1 is 100%, 0.5 is 50%, and
 * so on.
 *
 * @method Html5#setVolume
 * @param {number} percentAsDecimal
 *        The volume percent as a decimal. Valid range is from 0-1.
 *
 * @see [Spec]{@link https://www.w3.org/TR/html5/embedded-content-0.html#dom-a-volume}
 */
'volume',

/**
 * Set the value of `muted` on the media element. `muted` indicates the current
 * audio level should be silent.
 *
 * @method Html5#setMuted
 * @param {boolean} muted
 *        - True if the audio should be set to silent
 *        - False otherwise
 *
 * @see [Spec]{@link https://www.w3.org/TR/html5/embedded-content-0.html#dom-media-muted}
 */
'muted',

/**
 * Set the value of `src` on the media element. `src` indicates the current
 * {@link Tech~SourceObject} for the media.
 *
 * @method Html5#setSrc
 * @param {Tech~SourceObject} src
 *        The source object to set as the current source.
 *
 * @see [Spec]{@link https://www.w3.org/TR/html5/embedded-content-0.html#dom-media-src}
 */
'src',

/**
 * Set the value of `poster` on the media element. `poster` is the url to
 * an image file that can/will be shown when no media data is available.
 *
 * @method Html5#setPoster
 * @param {string} poster
 *        The url to an image that should be used as the `poster` for the media
 *        element.
 *
 * @see [Spec]{@link https://www.w3.org/TR/html5/embedded-content-0.html#attr-media-poster}
 */
'poster',

/**
 * Set the value of `preload` on the media element. `preload` indicates
 * what should download before the media is interacted with. It can have the following
 * values:
 * - none: nothing should be downloaded
 * - metadata: poster and the first few frames of the media may be downloaded to get
 *   media dimensions and other metadata
 * - auto: allow the media and metadata for the media to be downloaded before
 *    interaction
 *
 * @method Html5#setPreload
 * @param {string} preload
 *         The value of `preload` to set on the media element. Must be 'none', 'metadata',
 *         or 'auto'.
 *
 * @see [Spec]{@link https://www.w3.org/TR/html5/embedded-content-0.html#attr-media-preload}
 */
'preload',

/**
 * Set the value of `autoplay` on the media element. `autoplay` indicates
 * that the media should start to play as soon as the page is ready.
 *
 * @method Html5#setAutoplay
 * @param {boolean} autoplay
 *         - True indicates that the media should start as soon as the page loads.
 *         - False indicates that the media should not start as soon as the page loads.
 *
 * @see [Spec]{@link https://www.w3.org/TR/html5/embedded-content-0.html#attr-media-autoplay}
 */
'autoplay',

/**
 * Set the value of `loop` on the media element. `loop` indicates
 * that the media should return to the start of the media and continue playing once
 * it reaches the end.
 *
 * @method Html5#setLoop
 * @param {boolean} loop
 *         - True indicates that playback should seek back to start once
 *           the end of a media is reached.
 *         - False indicates that playback should not loop back to the start when the
 *           end of the media is reached.
 *
 * @see [Spec]{@link https://www.w3.org/TR/html5/embedded-content-0.html#attr-media-loop}
 */
'loop',

/**
 * Set the value of `playbackRate` on the media element. `playbackRate` indicates
 * the rate at which the media should play back. Examples:
 *   - if playbackRate is set to 2, media will play twice as fast.
 *   - if playbackRate is set to 0.5, media will play half as fast.
 *
 * @method Html5#setPlaybackRate
 * @return {number}
 *         The value of `playbackRate` from the media element. A number indicating
 *         the current playback speed of the media, where 1 is normal speed.
 *
 * @see [Spec]{@link https://www.w3.org/TR/html5/embedded-content-0.html#dom-media-playbackrate}
 */
'playbackRate'].forEach(function (prop) {
  Html5.prototype['set' + (0, _toTitleCase2['default'])(prop)] = function (v) {
    this.el_[prop] = v;
  };
});

// wrap native functions with a function
[
/**
 * A wrapper around the media elements `pause` function. This will call the `HTML5`
 * media elements `pause` function.
 *
 * @method Html5#pause
 * @see [Spec]{@link https://www.w3.org/TR/html5/embedded-content-0.html#dom-media-pause}
 */
'pause',

/**
 * A wrapper around the media elements `load` function. This will call the `HTML5`s
 * media element `load` function.
 *
 * @method Html5#load
 * @see [Spec]{@link https://www.w3.org/TR/html5/embedded-content-0.html#dom-media-load}
 */
'load'].forEach(function (prop) {
  Html5.prototype[prop] = function () {
    return this.el_[prop]();
  };
});

_tech2['default'].withSourceHandlers(Html5);

/**
 * Native source handler for Html5, simply passes the source to the media element.
 *
 * @proprety {Tech~SourceObject} source
 *        The source object
 *
 * @proprety {Html5} tech
 *        The instance of the HTML5 tech.
 */
Html5.nativeSourceHandler = {};

/**
 * Check if the media element can play the given mime type.
 *
 * @param {string} type
 *        The mimetype to check
 *
 * @return {string}
 *         'probably', 'maybe', or '' (empty string)
 */
Html5.nativeSourceHandler.canPlayType = function (type) {
  // IE9 on Windows 7 without MediaPlayer throws an error here
  // https://github.com/videojs/video.js/issues/519
  try {
    return Html5.TEST_VID.canPlayType(type);
  } catch (e) {
    return '';
  }
};

/**
 * Check if the media element can handle a source natively.
 *
 * @param {Tech~SourceObject} source
 *         The source object
 *
 * @param {Object} [options]
 *         Options to be passed to the tech.
 *
 * @return {string}
 *         'probably', 'maybe', or '' (empty string).
 */
Html5.nativeSourceHandler.canHandleSource = function (source, options) {

  // If a type was provided we should rely on that
  if (source.type) {
    return Html5.nativeSourceHandler.canPlayType(source.type);

    // If no type, fall back to checking 'video/[EXTENSION]'
  } else if (source.src) {
    var ext = Url.getFileExtension(source.src);

    return Html5.nativeSourceHandler.canPlayType('video/' + ext);
  }

  return '';
};

/**
 * Pass the source to the native media element.
 *
 * @param {Tech~SourceObject} source
 *        The source object
 *
 * @param {Html5} tech
 *        The instance of the Html5 tech
 *
 * @param {Object} [options]
 *        The options to pass to the source
 */
Html5.nativeSourceHandler.handleSource = function (source, tech, options) {
  tech.setSrc(source.src);
};

/**
 * A noop for the native dispose function, as cleanup is not needed.
 */
Html5.nativeSourceHandler.dispose = function () {};

// Register the native source handler
Html5.registerSourceHandler(Html5.nativeSourceHandler);

_component2['default'].registerComponent('Html5', Html5);
_tech2['default'].registerTech('Html5', Html5);
exports['default'] = Html5;

},{"5":5,"62":62,"78":78,"81":81,"83":83,"86":86,"87":87,"88":88,"91":91,"92":92,"94":94,"95":95,"98":98}],61:[function(_dereq_,module,exports){
'use strict';

exports.__esModule = true;

var _component = _dereq_(5);

var _component2 = _interopRequireDefault(_component);

var _tech = _dereq_(62);

var _tech2 = _interopRequireDefault(_tech);

var _toTitleCase = _dereq_(91);

var _toTitleCase2 = _interopRequireDefault(_toTitleCase);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * @file loader.js
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                */


/**
 * The `MediaLoader` is the `Component` that decides which playback technology to load
 * when a player is initialized.
 *
 * @extends Component
 */
var MediaLoader = function (_Component) {
  _inherits(MediaLoader, _Component);

  /**
   * Create an instance of this class.
   *
   * @param {Player} player
   *        The `Player` that this class should attach to.
   *
   * @param {Object} [options]
   *        The key/value stroe of player options.
   *
   * @param {Component~ReadyCallback} [ready]
   *        The function that is run when this component is ready.
   */
  function MediaLoader(player, options, ready) {
    _classCallCheck(this, MediaLoader);

    // If there are no sources when the player is initialized,
    // load the first supported playback technology.

    var _this = _possibleConstructorReturn(this, _Component.call(this, player, options, ready));

    if (!options.playerOptions.sources || options.playerOptions.sources.length === 0) {
      for (var i = 0, j = options.playerOptions.techOrder; i < j.length; i++) {
        var techName = (0, _toTitleCase2['default'])(j[i]);
        var tech = _tech2['default'].getTech(techName);

        // Support old behavior of techs being registered as components.
        // Remove once that deprecated behavior is removed.
        if (!techName) {
          tech = _component2['default'].getComponent(techName);
        }

        // Check if the browser supports this technology
        if (tech && tech.isSupported()) {
          player.loadTech_(techName);
          break;
        }
      }
    } else {
      // Loop through playback technologies (HTML5, Flash) and check for support.
      // Then load the best source.
      // A few assumptions here:
      //   All playback technologies respect preload false.
      player.src(options.playerOptions.sources);
    }
    return _this;
  }

  return MediaLoader;
}(_component2['default']);

_component2['default'].registerComponent('MediaLoader', MediaLoader);
exports['default'] = MediaLoader;

},{"5":5,"62":62,"91":91}],62:[function(_dereq_,module,exports){
'use strict';

exports.__esModule = true;

var _component = _dereq_(5);

var _component2 = _interopRequireDefault(_component);

var _htmlTrackElement = _dereq_(66);

var _htmlTrackElement2 = _interopRequireDefault(_htmlTrackElement);

var _htmlTrackElementList = _dereq_(65);

var _htmlTrackElementList2 = _interopRequireDefault(_htmlTrackElementList);

var _mergeOptions = _dereq_(87);

var _mergeOptions2 = _interopRequireDefault(_mergeOptions);

var _textTrack = _dereq_(72);

var _textTrack2 = _interopRequireDefault(_textTrack);

var _textTrackList = _dereq_(70);

var _textTrackList2 = _interopRequireDefault(_textTrackList);

var _videoTrackList = _dereq_(76);

var _videoTrackList2 = _interopRequireDefault(_videoTrackList);

var _audioTrackList = _dereq_(63);

var _audioTrackList2 = _interopRequireDefault(_audioTrackList);

var _fn = _dereq_(83);

var Fn = _interopRequireWildcard(_fn);

var _log = _dereq_(86);

var _log2 = _interopRequireDefault(_log);

var _timeRanges = _dereq_(90);

var _buffer = _dereq_(79);

var _mediaError = _dereq_(46);

var _mediaError2 = _interopRequireDefault(_mediaError);

var _window = _dereq_(95);

var _window2 = _interopRequireDefault(_window);

var _document = _dereq_(94);

var _document2 = _interopRequireDefault(_document);

var _obj = _dereq_(88);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * @file tech.js
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                */

/**
 * An Object containing a structure like: `{src: 'url', type: 'mimetype'}` or string
 * that just contains the src url alone.
 * * `var SourceObject = {src: 'http://ex.com/video.mp4', type: 'video/mp4'};`
   * `var SourceString = 'http://example.com/some-video.mp4';`
 *
 * @typedef {Object|string} Tech~SourceObject
 *
 * @property {string} src
 *           The url to the source
 *
 * @property {string} type
 *           The mime type of the source
 */

/**
 * A function used by {@link Tech} to create a new {@link TextTrack}.
 *
 * @param {Tech} self
 *        An instance of the Tech class.
 *
 * @param {string} kind
 *        `TextTrack` kind (subtitles, captions, descriptions, chapters, or metadata)
 *
 * @param {string} [label]
 *        Label to identify the text track
 *
 * @param {string} [language]
 *        Two letter language abbreviation
 *
 * @param {Object} [options={}]
 *        An object with additional text track options
 *
 * @return {TextTrack}
 *          The text track that was created.
 */
function createTrackHelper(self, kind, label, language) {
  var options = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : {};

  var tracks = self.textTracks();

  options.kind = kind;

  if (label) {
    options.label = label;
  }
  if (language) {
    options.language = language;
  }
  options.tech = self;

  var track = new _textTrack2['default'](options);

  tracks.addTrack_(track);

  return track;
}

/**
 * This is the base class for media playback technology controllers, such as
 * {@link Flash} and {@link HTML5}
 *
 * @extends Component
 */

var Tech = function (_Component) {
  _inherits(Tech, _Component);

  /**
   * Create an instance of this Tech.
   *
   * @param {Object} [options]
   *        The key/value store of player options.
   *
   * @param {Component~ReadyCallback} ready
   *        Callback function to call when the `HTML5` Tech is ready.
   */
  function Tech() {
    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    var ready = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : function () {};

    _classCallCheck(this, Tech);

    // we don't want the tech to report user activity automatically.
    // This is done manually in addControlsListeners
    options.reportTouchActivity = false;

    // keep track of whether the current source has played at all to
    // implement a very limited played()
    var _this = _possibleConstructorReturn(this, _Component.call(this, null, options, ready));

    _this.hasStarted_ = false;
    _this.on('playing', function () {
      this.hasStarted_ = true;
    });
    _this.on('loadstart', function () {
      this.hasStarted_ = false;
    });

    _this.textTracks_ = options.textTracks;
    _this.videoTracks_ = options.videoTracks;
    _this.audioTracks_ = options.audioTracks;

    // Manually track progress in cases where the browser/flash player doesn't report it.
    if (!_this.featuresProgressEvents) {
      _this.manualProgressOn();
    }

    // Manually track timeupdates in cases where the browser/flash player doesn't report it.
    if (!_this.featuresTimeupdateEvents) {
      _this.manualTimeUpdatesOn();
    }

    ['Text', 'Audio', 'Video'].forEach(function (track) {
      if (options['native' + track + 'Tracks'] === false) {
        _this['featuresNative' + track + 'Tracks'] = false;
      }
    });

    if (options.nativeCaptions === false) {
      _this.featuresNativeTextTracks = false;
    }

    if (!_this.featuresNativeTextTracks) {
      _this.emulateTextTracks();
    }

    _this.autoRemoteTextTracks_ = new _textTrackList2['default']();

    _this.initTextTrackListeners();
    _this.initTrackListeners();

    // Turn on component tap events only if not using native controls
    if (!options.nativeControlsForTouch) {
      _this.emitTapEvents();
    }

    if (_this.constructor) {
      _this.name_ = _this.constructor.name || 'Unknown Tech';
    }
    return _this;
  }

  /* Fallbacks for unsupported event types
  ================================================================================ */

  /**
   * Polyfill the `progress` event for browsers that don't support it natively.
   *
   * @see {@link Tech#trackProgress}
   */


  Tech.prototype.manualProgressOn = function manualProgressOn() {
    this.on('durationchange', this.onDurationChange);

    this.manualProgress = true;

    // Trigger progress watching when a source begins loading
    this.one('ready', this.trackProgress);
  };

  /**
   * Turn off the polyfill for `progress` events that was created in
   * {@link Tech#manualProgressOn}
   */


  Tech.prototype.manualProgressOff = function manualProgressOff() {
    this.manualProgress = false;
    this.stopTrackingProgress();

    this.off('durationchange', this.onDurationChange);
  };

  /**
   * This is used to trigger a `progress` event when the buffered percent changes. It
   * sets an interval function that will be called every 500 milliseconds to check if the
   * buffer end percent has changed.
   *
   * > This function is called by {@link Tech#manualProgressOn}
   *
   * @param {EventTarget~Event} event
   *        The `ready` event that caused this to run.
   *
   * @listens Tech#ready
   * @fires Tech#progress
   */


  Tech.prototype.trackProgress = function trackProgress(event) {
    this.stopTrackingProgress();
    this.progressInterval = this.setInterval(Fn.bind(this, function () {
      // Don't trigger unless buffered amount is greater than last time

      var numBufferedPercent = this.bufferedPercent();

      if (this.bufferedPercent_ !== numBufferedPercent) {
        /**
         * See {@link Player#progress}
         *
         * @event Tech#progress
         * @type {EventTarget~Event}
         */
        this.trigger('progress');
      }

      this.bufferedPercent_ = numBufferedPercent;

      if (numBufferedPercent === 1) {
        this.stopTrackingProgress();
      }
    }), 500);
  };

  /**
   * Update our internal duration on a `durationchange` event by calling
   * {@link Tech#duration}.
   *
   * @param {EventTarget~Event} event
   *        The `durationchange` event that caused this to run.
   *
   * @listens Tech#durationchange
   */


  Tech.prototype.onDurationChange = function onDurationChange(event) {
    this.duration_ = this.duration();
  };

  /**
   * Get and create a `TimeRange` object for buffering.
   *
   * @return {TimeRange}
   *         The time range object that was created.
   */


  Tech.prototype.buffered = function buffered() {
    return (0, _timeRanges.createTimeRange)(0, 0);
  };

  /**
   * Get the percentage of the current video that is currently buffered.
   *
   * @return {number}
   *         A number from 0 to 1 that represents the decimal percentage of the
   *         video that is buffered.
   *
   */


  Tech.prototype.bufferedPercent = function bufferedPercent() {
    return (0, _buffer.bufferedPercent)(this.buffered(), this.duration_);
  };

  /**
   * Turn off the polyfill for `progress` events that was created in
   * {@link Tech#manualProgressOn}
   * Stop manually tracking progress events by clearing the interval that was set in
   * {@link Tech#trackProgress}.
   */


  Tech.prototype.stopTrackingProgress = function stopTrackingProgress() {
    this.clearInterval(this.progressInterval);
  };

  /**
   * Polyfill the `timeupdate` event for browsers that don't support it.
   *
   * @see {@link Tech#trackCurrentTime}
   */


  Tech.prototype.manualTimeUpdatesOn = function manualTimeUpdatesOn() {
    this.manualTimeUpdates = true;

    this.on('play', this.trackCurrentTime);
    this.on('pause', this.stopTrackingCurrentTime);
  };

  /**
   * Turn off the polyfill for `timeupdate` events that was created in
   * {@link Tech#manualTimeUpdatesOn}
   */


  Tech.prototype.manualTimeUpdatesOff = function manualTimeUpdatesOff() {
    this.manualTimeUpdates = false;
    this.stopTrackingCurrentTime();
    this.off('play', this.trackCurrentTime);
    this.off('pause', this.stopTrackingCurrentTime);
  };

  /**
   * Sets up an interval function to track current time and trigger `timeupdate` every
   * 250 milliseconds.
   *
   * @listens Tech#play
   * @triggers Tech#timeupdate
   */


  Tech.prototype.trackCurrentTime = function trackCurrentTime() {
    if (this.currentTimeInterval) {
      this.stopTrackingCurrentTime();
    }
    this.currentTimeInterval = this.setInterval(function () {
      /**
       * Triggered at an interval of 250ms to indicated that time is passing in the video.
       *
       * @event Tech#timeupdate
       * @type {EventTarget~Event}
       */
      this.trigger({ type: 'timeupdate', target: this, manuallyTriggered: true });

      // 42 = 24 fps // 250 is what Webkit uses // FF uses 15
    }, 250);
  };

  /**
   * Stop the interval function created in {@link Tech#trackCurrentTime} so that the
   * `timeupdate` event is no longer triggered.
   *
   * @listens {Tech#pause}
   */


  Tech.prototype.stopTrackingCurrentTime = function stopTrackingCurrentTime() {
    this.clearInterval(this.currentTimeInterval);

    // #1002 - if the video ends right before the next timeupdate would happen,
    // the progress bar won't make it all the way to the end
    this.trigger({ type: 'timeupdate', target: this, manuallyTriggered: true });
  };

  /**
   * Turn off all event polyfills, clear the `Tech`s {@link AudioTrackList},
   * {@link VideoTrackList}, and {@link TextTrackList}, and dispose of this Tech.
   *
   * @fires Component#dispose
   */


  Tech.prototype.dispose = function dispose() {

    // clear out all tracks because we can't reuse them between techs
    this.clearTracks(['audio', 'video', 'text']);

    // Turn off any manual progress or timeupdate tracking
    if (this.manualProgress) {
      this.manualProgressOff();
    }

    if (this.manualTimeUpdates) {
      this.manualTimeUpdatesOff();
    }

    _Component.prototype.dispose.call(this);
  };

  /**
   * Clear out a single `TrackList` or an array of `TrackLists` given their names.
   *
   * > Note: Techs without source handlers should call this between sources for `video`
   *         & `audio` tracks. You don't want to use them between tracks!
   *
   * @param {string[]|string} types
   *        TrackList names to clear, valid names are `video`, `audio`, and
   *        `text`.
   */


  Tech.prototype.clearTracks = function clearTracks(types) {
    var _this2 = this;

    types = [].concat(types);
    // clear out all tracks because we can't reuse them between techs
    types.forEach(function (type) {
      var list = _this2[type + 'Tracks']() || [];
      var i = list.length;

      while (i--) {
        var track = list[i];

        if (type === 'text') {
          _this2.removeRemoteTextTrack(track);
        }
        list.removeTrack_(track);
      }
    });
  };

  /**
   * Remove any TextTracks added via addRemoteTextTrack that are
   * flagged for automatic garbage collection
   */


  Tech.prototype.cleanupAutoTextTracks = function cleanupAutoTextTracks() {
    var list = this.autoRemoteTextTracks_ || [];
    var i = list.length;

    while (i--) {
      var track = list[i];

      this.removeRemoteTextTrack(track);
    }
  };

  /**
   * Reset the tech, which will removes all sources and reset the internal readyState.
   *
   * @abstract
   */


  Tech.prototype.reset = function reset() {};

  /**
   * Get or set an error on the Tech.
   *
   * @param {MediaError} [err]
   *        Error to set on the Tech
   *
   * @return {MediaError|null}
   *         The current error object on the tech, or null if there isn't one.
   */


  Tech.prototype.error = function error(err) {
    if (err !== undefined) {
      this.error_ = new _mediaError2['default'](err);
      this.trigger('error');
    }
    return this.error_;
  };

  /**
   * Returns the `TimeRange`s that have been played through for the current source.
   *
   * > NOTE: This implementation is incomplete. It does not track the played `TimeRange`.
   *         It only checks wether the source has played at all or not.
   *
   * @return {TimeRange}
   *         - A single time range if this video has played
   *         - An empty set of ranges if not.
   */


  Tech.prototype.played = function played() {
    if (this.hasStarted_) {
      return (0, _timeRanges.createTimeRange)(0, 0);
    }
    return (0, _timeRanges.createTimeRange)();
  };

  /**
   * Causes a manual time update to occur if {@link Tech#manualTimeUpdatesOn} was
   * previously called.
   *
   * @fires Tech#timeupdate
   */


  Tech.prototype.setCurrentTime = function setCurrentTime() {
    // improve the accuracy of manual timeupdates
    if (this.manualTimeUpdates) {
      /**
       * A manual `timeupdate` event.
       *
       * @event Tech#timeupdate
       * @type {EventTarget~Event}
       */
      this.trigger({ type: 'timeupdate', target: this, manuallyTriggered: true });
    }
  };

  /**
   * Turn on listeners for {@link TextTrackList} events. This adds
   * {@link EventTarget~EventListeners} for `texttrackchange`, `addtrack` and
   * `removetrack`.
   *
   * @fires Tech#texttrackchange
   */


  Tech.prototype.initTextTrackListeners = function initTextTrackListeners() {
    var textTrackListChanges = Fn.bind(this, function () {
      /**
       * Triggered when tracks are added or removed on the Tech {@link TextTrackList}
       *
       * @event Tech#texttrackchange
       * @type {EventTarget~Event}
       */
      this.trigger('texttrackchange');
    });

    var tracks = this.textTracks();

    if (!tracks) {
      return;
    }

    tracks.addEventListener('removetrack', textTrackListChanges);
    tracks.addEventListener('addtrack', textTrackListChanges);

    this.on('dispose', Fn.bind(this, function () {
      tracks.removeEventListener('removetrack', textTrackListChanges);
      tracks.removeEventListener('addtrack', textTrackListChanges);
    }));
  };

  /**
   * Turn on listeners for {@link VideoTrackList} and {@link {AudioTrackList} events.
   * This adds {@link EventTarget~EventListeners} for `addtrack`, and  `removetrack`.
   *
   * @fires Tech#audiotrackchange
   * @fires Tech#videotrackchange
   */


  Tech.prototype.initTrackListeners = function initTrackListeners() {
    var _this3 = this;

    var trackTypes = ['video', 'audio'];

    trackTypes.forEach(function (type) {
      /**
       * Triggered when tracks are added or removed on the Tech {@link AudioTrackList}
       *
       * @event Tech#audiotrackchange
       * @type {EventTarget~Event}
       */

      /**
       * Triggered when tracks are added or removed on the Tech {@link VideoTrackList}
       *
       * @event Tech#videotrackchange
       * @type {EventTarget~Event}
       */
      var trackListChanges = function trackListChanges() {
        _this3.trigger(type + 'trackchange');
      };

      var tracks = _this3[type + 'Tracks']();

      tracks.addEventListener('removetrack', trackListChanges);
      tracks.addEventListener('addtrack', trackListChanges);

      _this3.on('dispose', function () {
        tracks.removeEventListener('removetrack', trackListChanges);
        tracks.removeEventListener('addtrack', trackListChanges);
      });
    });
  };

  /**
   * Emulate TextTracks using vtt.js if necessary
   *
   * @fires Tech#vttjsloaded
   * @fires Tech#vttjserror
   */


  Tech.prototype.addWebVttScript_ = function addWebVttScript_() {
    var _this4 = this;

    if (_window2['default'].WebVTT) {
      return;
    }

    // Initially, Tech.el_ is a child of a dummy-div wait until the Component system
    // signals that the Tech is ready at which point Tech.el_ is part of the DOM
    // before inserting the WebVTT script
    if (_document2['default'].body.contains(this.el())) {
      var vtt = _dereq_(99);

      // load via require if available and vtt.js script location was not passed in
      // as an option. novtt builds will turn the above require call into an empty object
      // which will cause this if check to always fail.
      if (!this.options_['vtt.js'] && (0, _obj.isPlain)(vtt) && Object.keys(vtt).length > 0) {
        this.trigger('vttjsloaded');
        return;
      }

      // load vtt.js via the script location option or the cdn of no location was
      // passed in
      var script = _document2['default'].createElement('script');

      script.src = this.options_['vtt.js'] || 'https://vjs.zencdn.net/vttjs/0.12.4/vtt.min.js';
      script.onload = function () {
        /**
         * Fired when vtt.js is loaded.
         *
         * @event Tech#vttjsloaded
         * @type {EventTarget~Event}
         */
        _this4.trigger('vttjsloaded');
      };
      script.onerror = function () {
        /**
         * Fired when vtt.js was not loaded due to an error
         *
         * @event Tech#vttjsloaded
         * @type {EventTarget~Event}
         */
        _this4.trigger('vttjserror');
      };
      this.on('dispose', function () {
        script.onload = null;
        script.onerror = null;
      });
      // but have not loaded yet and we set it to true before the inject so that
      // we don't overwrite the injected window.WebVTT if it loads right away
      _window2['default'].WebVTT = true;
      this.el().parentNode.appendChild(script);
    } else {
      this.ready(this.addWebVttScript_);
    }
  };

  /**
   * Emulate texttracks
   *
   * @method emulateTextTracks
   */


  Tech.prototype.emulateTextTracks = function emulateTextTracks() {
    var _this5 = this;

    var tracks = this.textTracks();

    if (!tracks) {
      return;
    }

    var remoteTracks = this.remoteTextTracks();
    var handleAddTrack = function handleAddTrack(e) {
      return tracks.addTrack_(e.track);
    };
    var handleRemoveTrack = function handleRemoveTrack(e) {
      return tracks.removeTrack_(e.track);
    };

    remoteTracks.on('addtrack', handleAddTrack);
    remoteTracks.on('removetrack', handleRemoveTrack);

    this.addWebVttScript_();

    var updateDisplay = function updateDisplay() {
      return _this5.trigger('texttrackchange');
    };

    var textTracksChanges = function textTracksChanges() {
      updateDisplay();

      for (var i = 0; i < tracks.length; i++) {
        var track = tracks[i];

        track.removeEventListener('cuechange', updateDisplay);
        if (track.mode === 'showing') {
          track.addEventListener('cuechange', updateDisplay);
        }
      }
    };

    textTracksChanges();
    tracks.addEventListener('change', textTracksChanges);
    tracks.addEventListener('addtrack', textTracksChanges);
    tracks.addEventListener('removetrack', textTracksChanges);

    this.on('dispose', function () {
      remoteTracks.off('addtrack', handleAddTrack);
      remoteTracks.off('removetrack', handleRemoveTrack);
      tracks.removeEventListener('change', textTracksChanges);
      tracks.removeEventListener('addtrack', textTracksChanges);
      tracks.removeEventListener('removetrack', textTracksChanges);

      for (var i = 0; i < tracks.length; i++) {
        var track = tracks[i];

        track.removeEventListener('cuechange', updateDisplay);
      }
    });
  };

  /**
   * Get the `Tech`s {@link VideoTrackList}.
   *
   * @return {VideoTrackList}
   *          The video track list that the Tech is currently using.
   */


  Tech.prototype.videoTracks = function videoTracks() {
    this.videoTracks_ = this.videoTracks_ || new _videoTrackList2['default']();
    return this.videoTracks_;
  };

  /**
   * Get the `Tech`s {@link AudioTrackList}.
   *
   * @return {AudioTrackList}
   *          The audio track list that the Tech is currently using.
   */


  Tech.prototype.audioTracks = function audioTracks() {
    this.audioTracks_ = this.audioTracks_ || new _audioTrackList2['default']();
    return this.audioTracks_;
  };

  /**
   * Get the `Tech`s {@link TextTrackList}.
   *
   * @return {TextTrackList}
   *          The text track list that the Tech is currently using.
   */


  Tech.prototype.textTracks = function textTracks() {
    this.textTracks_ = this.textTracks_ || new _textTrackList2['default']();
    return this.textTracks_;
  };

  /**
   * Get the `Tech`s remote {@link TextTrackList}, which is created from elements
   * that were added to the DOM.
   *
   * @return {TextTrackList}
   *          The remote text track list that the Tech is currently using.
   */


  Tech.prototype.remoteTextTracks = function remoteTextTracks() {
    this.remoteTextTracks_ = this.remoteTextTracks_ || new _textTrackList2['default']();
    return this.remoteTextTracks_;
  };

  /**
   * Get The `Tech`s  {HTMLTrackElementList}, which are the elements in the DOM that are
   * being used as TextTracks.
   *
   * @return {HTMLTrackElementList}
   *          The current HTML track elements that exist for the tech.
   */


  Tech.prototype.remoteTextTrackEls = function remoteTextTrackEls() {
    this.remoteTextTrackEls_ = this.remoteTextTrackEls_ || new _htmlTrackElementList2['default']();
    return this.remoteTextTrackEls_;
  };

  /**
   * Create and returns a remote {@link TextTrack} object.
   *
   * @param {string} kind
   *        `TextTrack` kind (subtitles, captions, descriptions, chapters, or metadata)
   *
   * @param {string} [label]
   *        Label to identify the text track
   *
   * @param {string} [language]
   *        Two letter language abbreviation
   *
   * @return {TextTrack}
   *         The TextTrack that gets created.
   */


  Tech.prototype.addTextTrack = function addTextTrack(kind, label, language) {
    if (!kind) {
      throw new Error('TextTrack kind is required but was not provided');
    }

    return createTrackHelper(this, kind, label, language);
  };

  /**
   * Create an emulated TextTrack for use by addRemoteTextTrack
   *
   * This is intended to be overridden by classes that inherit from
   * Tech in order to create native or custom TextTracks.
   *
   * @param {Object} options
   *        The object should contain the options to initialize the TextTrack with.
   *
   * @param {string} [options.kind]
   *        `TextTrack` kind (subtitles, captions, descriptions, chapters, or metadata).
   *
   * @param {string} [options.label].
   *        Label to identify the text track
   *
   * @param {string} [options.language]
   *        Two letter language abbreviation.
   *
   * @return {HTMLTrackElement}
   *         The track element that gets created.
   */


  Tech.prototype.createRemoteTextTrack = function createRemoteTextTrack(options) {
    var track = (0, _mergeOptions2['default'])(options, {
      tech: this
    });

    return new _htmlTrackElement2['default'](track);
  };

  /**
   * Creates a remote text track object and returns an html track element.
   *
   * > Note: This can be an emulated {@link HTMLTrackElement} or a native one.
   *
   * @param {Object} options
   *        See {@link Tech#createRemoteTextTrack} for more detailed properties.
   *
   * @param {boolean} [manualCleanup=true]
   *        - When false: the TextTrack will be automatically removed from the video
   *          element whenever the source changes
   *        - When True: The TextTrack will have to be cleaned up manually
   *
   * @return {HTMLTrackElement}
   *         An Html Track Element.
   *
   * @deprecated The default functionality for this function will be equivalent
   *             to "manualCleanup=false" in the future. The manualCleanup parameter will
   *             also be removed.
   */


  Tech.prototype.addRemoteTextTrack = function addRemoteTextTrack() {
    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    var manualCleanup = arguments[1];

    var htmlTrackElement = this.createRemoteTextTrack(options);

    if (manualCleanup !== true && manualCleanup !== false) {
      // deprecation warning
      _log2['default'].warn('Calling addRemoteTextTrack without explicitly setting the "manualCleanup" parameter to `true` is deprecated and default to `false` in future version of video.js');
      manualCleanup = true;
    }

    // store HTMLTrackElement and TextTrack to remote list
    this.remoteTextTrackEls().addTrackElement_(htmlTrackElement);
    this.remoteTextTracks().addTrack_(htmlTrackElement.track);

    if (manualCleanup !== true) {
      // create the TextTrackList if it doesn't exist
      this.autoRemoteTextTracks_.addTrack_(htmlTrackElement.track);
    }

    return htmlTrackElement;
  };

  /**
   * Remove a remote text track from the remote `TextTrackList`.
   *
   * @param {TextTrack} track
   *        `TextTrack` to remove from the `TextTrackList`
   */


  Tech.prototype.removeRemoteTextTrack = function removeRemoteTextTrack(track) {
    var trackElement = this.remoteTextTrackEls().getTrackElementByTrack_(track);

    // remove HTMLTrackElement and TextTrack from remote list
    this.remoteTextTrackEls().removeTrackElement_(trackElement);
    this.remoteTextTracks().removeTrack_(track);
    this.autoRemoteTextTracks_.removeTrack_(track);
  };

  /**
   * Gets available media playback quality metrics as specified by the W3C's Media
   * Playback Quality API.
   *
   * @see [Spec]{@link https://wicg.github.io/media-playback-quality}
   *
   * @return {Object}
   *         An object with supported media playback quality metrics
   *
   * @abstract
   */


  Tech.prototype.getVideoPlaybackQuality = function getVideoPlaybackQuality() {
    return {};
  };

  /**
   * A method to set a poster from a `Tech`.
   *
   * @abstract
   */


  Tech.prototype.setPoster = function setPoster() {};

  /**
   * A method to check for the presence of the 'playsinine' <video> attribute.
   *
   * @abstract
   */


  Tech.prototype.playsinline = function playsinline() {};

  /**
   * A method to set or unset the 'playsinine' <video> attribute.
   *
   * @abstract
   */


  Tech.prototype.setPlaysinline = function setPlaysinline() {};

  /*
   * Check if the tech can support the given mime-type.
   *
   * The base tech does not support any type, but source handlers might
   * overwrite this.
   *
   * @param  {string} type
   *         The mimetype to check for support
   *
   * @return {string}
   *         'probably', 'maybe', or empty string
   *
   * @see [Spec]{@link https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/canPlayType}
   *
   * @abstract
   */


  Tech.prototype.canPlayType = function canPlayType() {
    return '';
  };

  /*
   * Return whether the argument is a Tech or not.
   * Can be passed either a Class like `Html5` or a instance like `player.tech_`
   *
   * @param {Object} component
   *        The item to check
   *
   * @return {boolean}
   *         Whether it is a tech or not
   *         - True if it is a tech
   *         - False if it is not
   */


  Tech.isTech = function isTech(component) {
    return component.prototype instanceof Tech || component instanceof Tech || component === Tech;
  };

  /**
   * Registers a `Tech` into a shared list for videojs.
   *
   * @param {string} name
   *        Name of the `Tech` to register.
   *
   * @param {Object} tech
   *        The `Tech` class to register.
   */


  Tech.registerTech = function registerTech(name, tech) {
    if (!Tech.techs_) {
      Tech.techs_ = {};
    }

    if (!Tech.isTech(tech)) {
      throw new Error('Tech ' + name + ' must be a Tech');
    }

    Tech.techs_[name] = tech;
    return tech;
  };

  /**
   * Get a `Tech` from the shared list by name.
   *
   * @param {string} name
   *        Name of the component to get
   *
   * @return {Tech|undefined}
   *         The `Tech` or undefined if there was no tech with the name requsted.
   */


  Tech.getTech = function getTech(name) {
    if (Tech.techs_ && Tech.techs_[name]) {
      return Tech.techs_[name];
    }

    if (_window2['default'] && _window2['default'].videojs && _window2['default'].videojs[name]) {
      _log2['default'].warn('The ' + name + ' tech was added to the videojs object when it should be registered using videojs.registerTech(name, tech)');
      return _window2['default'].videojs[name];
    }
  };

  return Tech;
}(_component2['default']);

/**
 * List of associated text tracks.
 *
 * @type {TextTrackList}
 * @private
 */


Tech.prototype.textTracks_; // eslint-disable-line

/**
 * List of associated audio tracks.
 *
 * @type {AudioTrackList}
 * @private
 */
Tech.prototype.audioTracks_; // eslint-disable-line

/**
 * List of associated video tracks.
 *
 * @type {VideoTrackList}
 * @private
 */
Tech.prototype.videoTracks_; // eslint-disable-line

/**
 * Boolean indicating wether the `Tech` supports volume control.
 *
 * @type {boolean}
 * @default
 */
Tech.prototype.featuresVolumeControl = true;

/**
 * Boolean indicating wether the `Tech` support fullscreen resize control.
 * Resizing plugins using request fullscreen reloads the plugin
 *
 * @type {boolean}
 * @default
 */
Tech.prototype.featuresFullscreenResize = false;

/**
 * Boolean indicating wether the `Tech` supports changing the speed at which the video
 * plays. Examples:
 *   - Set player to play 2x (twice) as fast
 *   - Set player to play 0.5x (half) as fast
 *
 * @type {boolean}
 * @default
 */
Tech.prototype.featuresPlaybackRate = false;

/**
 * Boolean indicating wether the `Tech` supports the `progress` event. This is currently
 * not triggered by video-js-swf. This will be used to determine if
 * {@link Tech#manualProgressOn} should be called.
 *
 * @type {boolean}
 * @default
 */
Tech.prototype.featuresProgressEvents = false;

/**
 * Boolean indicating wether the `Tech` supports the `timeupdate` event. This is currently
 * not triggered by video-js-swf. This will be used to determine if
 * {@link Tech#manualTimeUpdates} should be called.
 *
 * @type {boolean}
 * @default
 */
Tech.prototype.featuresTimeupdateEvents = false;

/**
 * Boolean indicating wether the `Tech` supports the native `TextTrack`s.
 * This will help us integrate with native `TextTrack`s if the browser supports them.
 *
 * @type {boolean}
 * @default
 */
Tech.prototype.featuresNativeTextTracks = false;

/**
 * A functional mixin for techs that want to use the Source Handler pattern.
 * Source handlers are scripts for handling specific formats.
 * The source handler pattern is used for adaptive formats (HLS, DASH) that
 * manually load video data and feed it into a Source Buffer (Media Source Extensions)
 * Example: `Tech.withSourceHandlers.call(MyTech);`
 *
 * @param {Tech} _Tech
 *        The tech to add source handler functions to.
 *
 * @mixes Tech~SourceHandlerAdditions
 */
Tech.withSourceHandlers = function (_Tech) {

  /**
   * Register a source handler
   *
   * @param {Function} handler
   *        The source handler class
   *
   * @param {number} [index]
   *        Register it at the following index
   */
  _Tech.registerSourceHandler = function (handler, index) {
    var handlers = _Tech.sourceHandlers;

    if (!handlers) {
      handlers = _Tech.sourceHandlers = [];
    }

    if (index === undefined) {
      // add to the end of the list
      index = handlers.length;
    }

    handlers.splice(index, 0, handler);
  };

  /**
   * Check if the tech can support the given type. Also checks the
   * Techs sourceHandlers.
   *
   * @param {string} type
   *         The mimetype to check.
   *
   * @return {string}
   *         'probably', 'maybe', or '' (empty string)
   */
  _Tech.canPlayType = function (type) {
    var handlers = _Tech.sourceHandlers || [];
    var can = void 0;

    for (var i = 0; i < handlers.length; i++) {
      can = handlers[i].canPlayType(type);

      if (can) {
        return can;
      }
    }

    return '';
  };

  /**
   * Returns the first source handler that supports the source.
   *
   * TODO: Answer question: should 'probably' be prioritized over 'maybe'
   *
   * @param {Tech~SourceObject} source
   *        The source object
   *
   * @param {Object} options
   *        The options passed to the tech
   *
   * @return {SourceHandler|null}
   *          The first source handler that supports the source or null if
   *          no SourceHandler supports the source
   */
  _Tech.selectSourceHandler = function (source, options) {
    var handlers = _Tech.sourceHandlers || [];
    var can = void 0;

    for (var i = 0; i < handlers.length; i++) {
      can = handlers[i].canHandleSource(source, options);

      if (can) {
        return handlers[i];
      }
    }

    return null;
  };

  /**
   * Check if the tech can support the given source.
   *
   * @param {Tech~SourceObject} srcObj
   *        The source object
   *
   * @param {Object} options
   *        The options passed to the tech
   *
   * @return {string}
   *         'probably', 'maybe', or '' (empty string)
   */
  _Tech.canPlaySource = function (srcObj, options) {
    var sh = _Tech.selectSourceHandler(srcObj, options);

    if (sh) {
      return sh.canHandleSource(srcObj, options);
    }

    return '';
  };

  /**
   * When using a source handler, prefer its implementation of
   * any function normally provided by the tech.
   */
  var deferrable = ['seekable', 'duration'];

  /**
   * A wrapper around {@link Tech#seekable} that will call a `SourceHandler`s seekable
   * function if it exists, with a fallback to the Techs seekable function.
   *
   * @method _Tech.seekable
   */

  /**
   * A wrapper around {@link Tech#duration} that will call a `SourceHandler`s duration
   * function if it exists, otherwise it will fallback to the techs duration function.
   *
   * @method _Tech.duration
   */

  deferrable.forEach(function (fnName) {
    var originalFn = this[fnName];

    if (typeof originalFn !== 'function') {
      return;
    }

    this[fnName] = function () {
      if (this.sourceHandler_ && this.sourceHandler_[fnName]) {
        return this.sourceHandler_[fnName].apply(this.sourceHandler_, arguments);
      }
      return originalFn.apply(this, arguments);
    };
  }, _Tech.prototype);

  /**
   * Create a function for setting the source using a source object
   * and source handlers.
   * Should never be called unless a source handler was found.
   *
   * @param {Tech~SourceObject} source
   *        A source object with src and type keys
   *
   * @return {Tech}
   *         Returns itself; this method is chainable
   */
  _Tech.prototype.setSource = function (source) {
    var sh = _Tech.selectSourceHandler(source, this.options_);

    if (!sh) {
      // Fall back to a native source hander when unsupported sources are
      // deliberately set
      if (_Tech.nativeSourceHandler) {
        sh = _Tech.nativeSourceHandler;
      } else {
        _log2['default'].error('No source hander found for the current source.');
      }
    }

    // Dispose any existing source handler
    this.disposeSourceHandler();
    this.off('dispose', this.disposeSourceHandler);

    if (sh !== _Tech.nativeSourceHandler) {
      this.currentSource_ = source;

      // Catch if someone replaced the src without calling setSource.
      // If they do, set currentSource_ to null and dispose our source handler.
      this.off(this.el_, 'loadstart', _Tech.prototype.firstLoadStartListener_);
      this.off(this.el_, 'loadstart', _Tech.prototype.successiveLoadStartListener_);
      this.one(this.el_, 'loadstart', _Tech.prototype.firstLoadStartListener_);
    }

    this.sourceHandler_ = sh.handleSource(source, this, this.options_);
    this.on('dispose', this.disposeSourceHandler);

    return this;
  };

  /**
   * Called once for the first loadstart of a video.
   *
   * @listens Tech#loadstart
   */
  _Tech.prototype.firstLoadStartListener_ = function () {
    this.one(this.el_, 'loadstart', _Tech.prototype.successiveLoadStartListener_);
  };

  // On successive loadstarts when setSource has not been called again
  /**
   * Called after the first loadstart for a video occurs.
   *
   * @listens Tech#loadstart
   */
  _Tech.prototype.successiveLoadStartListener_ = function () {
    this.disposeSourceHandler();
    this.one(this.el_, 'loadstart', _Tech.prototype.successiveLoadStartListener_);
  };

  /**
   * Clean up any existing SourceHandlers and listeners when the Tech is disposed.
   *
   * @listens Tech#dispose
   */
  _Tech.prototype.disposeSourceHandler = function () {
    // if we have a source and get another one
    // then we are loading something new
    // than clear all of our current tracks
    if (this.currentSource_) {
      this.clearTracks(['audio', 'video']);
      this.currentSource_ = null;
    }

    // always clean up auto-text tracks
    this.cleanupAutoTextTracks();

    if (this.sourceHandler_) {
      this.off(this.el_, 'loadstart', _Tech.prototype.firstLoadStartListener_);
      this.off(this.el_, 'loadstart', _Tech.prototype.successiveLoadStartListener_);

      if (this.sourceHandler_.dispose) {
        this.sourceHandler_.dispose();
      }

      this.sourceHandler_ = null;
    }
  };
};

_component2['default'].registerComponent('Tech', Tech);
// Old name for Tech
// @deprecated
_component2['default'].registerComponent('MediaTechController', Tech);
Tech.registerTech('Tech', Tech);
exports['default'] = Tech;

},{"46":46,"5":5,"63":63,"65":65,"66":66,"70":70,"72":72,"76":76,"79":79,"83":83,"86":86,"87":87,"88":88,"90":90,"94":94,"95":95,"99":99}],63:[function(_dereq_,module,exports){
'use strict';

exports.__esModule = true;

var _trackList = _dereq_(74);

var _trackList2 = _interopRequireDefault(_trackList);

var _browser = _dereq_(78);

var browser = _interopRequireWildcard(_browser);

var _document = _dereq_(94);

var _document2 = _interopRequireDefault(_document);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * @file audio-track-list.js
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                */


/**
 * Anywhere we call this function we diverge from the spec
 * as we only support one enabled audiotrack at a time
 *
 * @param {AudioTrackList} list
 *        list to work on
 *
 * @param {AudioTrack} track
 *        The track to skip
 *
 * @private
 */
var disableOthers = function disableOthers(list, track) {
  for (var i = 0; i < list.length; i++) {
    if (track.id === list[i].id) {
      continue;
    }
    // another audio track is enabled, disable it
    list[i].enabled = false;
  }
};

/**
 * The current list of {@link AudioTrack} for a media file.
 *
 * @see [Spec]{@link https://html.spec.whatwg.org/multipage/embedded-content.html#audiotracklist}
 * @extends TrackList
 */

var AudioTrackList = function (_TrackList) {
  _inherits(AudioTrackList, _TrackList);

  /**
   * Create an instance of this class.
   *
   * @param {AudioTrack[]} [tracks=[]]
   *        A list of `AudioTrack` to instantiate the list with.
   */
  function AudioTrackList() {
    var _this, _ret;

    var tracks = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];

    _classCallCheck(this, AudioTrackList);

    var list = void 0;

    // make sure only 1 track is enabled
    // sorted from last index to first index
    for (var i = tracks.length - 1; i >= 0; i--) {
      if (tracks[i].enabled) {
        disableOthers(tracks, tracks[i]);
        break;
      }
    }

    // IE8 forces us to implement inheritance ourselves
    // as it does not support Object.defineProperty properly
    if (browser.IS_IE8) {
      list = _document2['default'].createElement('custom');
      for (var prop in _trackList2['default'].prototype) {
        if (prop !== 'constructor') {
          list[prop] = _trackList2['default'].prototype[prop];
        }
      }
      for (var _prop in AudioTrackList.prototype) {
        if (_prop !== 'constructor') {
          list[_prop] = AudioTrackList.prototype[_prop];
        }
      }
    }

    list = (_this = _possibleConstructorReturn(this, _TrackList.call(this, tracks, list)), _this);
    list.changing_ = false;

    return _ret = list, _possibleConstructorReturn(_this, _ret);
  }

  /**
   * Add an {@link AudioTrack} to the `AudioTrackList`.
   *
   * @param {AudioTrack} track
   *        The AudioTrack to add to the list
   *
   * @fires Track#addtrack
   * @private
   */


  AudioTrackList.prototype.addTrack_ = function addTrack_(track) {
    var _this2 = this;

    if (track.enabled) {
      disableOthers(this, track);
    }

    _TrackList.prototype.addTrack_.call(this, track);
    // native tracks don't have this
    if (!track.addEventListener) {
      return;
    }

    /**
     * @listens AudioTrack#enabledchange
     * @fires TrackList#change
     */
    track.addEventListener('enabledchange', function () {
      // when we are disabling other tracks (since we don't support
      // more than one track at a time) we will set changing_
      // to true so that we don't trigger additional change events
      if (_this2.changing_) {
        return;
      }
      _this2.changing_ = true;
      disableOthers(_this2, track);
      _this2.changing_ = false;
      _this2.trigger('change');
    });
  };

  /**
   * Add an {@link AudioTrack} to the `AudioTrackList`.
   *
   * @param {AudioTrack} track
   *        The AudioTrack to add to the list
   *
   * @fires Track#addtrack
   */


  AudioTrackList.prototype.addTrack = function addTrack(track) {
    this.addTrack_(track);
  };

  /**
   * Remove an {@link AudioTrack} from the `AudioTrackList`.
   *
   * @param {AudioTrack} track
   *        The AudioTrack to remove from the list
   *
   * @fires Track#removetrack
   */


  AudioTrackList.prototype.removeTrack = function removeTrack(track) {
    _TrackList.prototype.removeTrack_.call(this, track);
  };

  return AudioTrackList;
}(_trackList2['default']);

exports['default'] = AudioTrackList;

},{"74":74,"78":78,"94":94}],64:[function(_dereq_,module,exports){
'use strict';

exports.__esModule = true;

var _trackEnums = _dereq_(73);

var _track = _dereq_(75);

var _track2 = _interopRequireDefault(_track);

var _mergeOptions = _dereq_(87);

var _mergeOptions2 = _interopRequireDefault(_mergeOptions);

var _browser = _dereq_(78);

var browser = _interopRequireWildcard(_browser);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

/**
 * A representation of a single `AudioTrack`. If it is part of an {@link AudioTrackList}
 * only one `AudioTrack` in the list will be enabled at a time.
 *
 * @see [Spec]{@link https://html.spec.whatwg.org/multipage/embedded-content.html#audiotrack}
 * @extends Track
 */
var AudioTrack = function (_Track) {
  _inherits(AudioTrack, _Track);

  /**
   * Create an instance of this class.
   *
   * @param {Object} [options={}]
   *        Object of option names and values
   *
   * @param {AudioTrack~Kind} [options.kind='']
   *        A valid audio track kind
   *
   * @param {string} [options.id='vjs_track_' + Guid.newGUID()]
   *        A unique id for this AudioTrack.
   *
   * @param {string} [options.label='']
   *        The menu label for this track.
   *
   * @param {string} [options.language='']
   *        A valid two character language code.
   *
   * @param {boolean} [options.enabled]
   *        If this track is the one that is currently playing. If this track is part of
   *        an {@link AudioTrackList}, only one {@link AudioTrack} will be enabled.
   */
  function AudioTrack() {
    var _this, _ret;

    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    _classCallCheck(this, AudioTrack);

    var settings = (0, _mergeOptions2['default'])(options, {
      kind: _trackEnums.AudioTrackKind[options.kind] || ''
    });
    // on IE8 this will be a document element
    // for every other browser this will be a normal object
    var track = (_this = _possibleConstructorReturn(this, _Track.call(this, settings)), _this);
    var enabled = false;

    if (browser.IS_IE8) {
      for (var prop in AudioTrack.prototype) {
        if (prop !== 'constructor') {
          track[prop] = AudioTrack.prototype[prop];
        }
      }
    }
    /**
     * @member {boolean} enabled
     *         If this `AudioTrack` is enabled or not. When setting this will
     *         fire {@link AudioTrack#enabledchange} if the state of enabled is changed.
     *
     * @fires VideoTrack#selectedchange
     */
    Object.defineProperty(track, 'enabled', {
      get: function get() {
        return enabled;
      },
      set: function set(newEnabled) {
        // an invalid or unchanged value
        if (typeof newEnabled !== 'boolean' || newEnabled === enabled) {
          return;
        }
        enabled = newEnabled;

        /**
         * An event that fires when enabled changes on this track. This allows
         * the AudioTrackList that holds this track to act accordingly.
         *
         * > Note: This is not part of the spec! Native tracks will do
         *         this internally without an event.
         *
         * @event AudioTrack#enabledchange
         * @type {EventTarget~Event}
         */
        this.trigger('enabledchange');
      }
    });

    // if the user sets this track to selected then
    // set selected to that true value otherwise
    // we keep it false
    if (settings.enabled) {
      track.enabled = settings.enabled;
    }
    track.loaded_ = true;

    return _ret = track, _possibleConstructorReturn(_this, _ret);
  }

  return AudioTrack;
}(_track2['default']);

exports['default'] = AudioTrack;

},{"73":73,"75":75,"78":78,"87":87}],65:[function(_dereq_,module,exports){
'use strict';

exports.__esModule = true;

var _browser = _dereq_(78);

var browser = _interopRequireWildcard(_browser);

var _document = _dereq_(94);

var _document2 = _interopRequireDefault(_document);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } } /**
                                                                                                                                                           * @file html-track-element-list.js
                                                                                                                                                           */

/**
 * The current list of {@link HtmlTrackElement}s.
 */
var HtmlTrackElementList = function () {

  /**
   * Create an instance of this class.
   *
   * @param {HtmlTrackElement[]} [tracks=[]]
   *        A list of `HtmlTrackElement` to instantiate the list with.
   */
  function HtmlTrackElementList() {
    var trackElements = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];

    _classCallCheck(this, HtmlTrackElementList);

    var list = this; // eslint-disable-line

    if (browser.IS_IE8) {
      list = _document2['default'].createElement('custom');

      for (var prop in HtmlTrackElementList.prototype) {
        if (prop !== 'constructor') {
          list[prop] = HtmlTrackElementList.prototype[prop];
        }
      }
    }

    list.trackElements_ = [];

    /**
     * @member {number} length
     *         The current number of `Track`s in the this Trackist.
     */
    Object.defineProperty(list, 'length', {
      get: function get() {
        return this.trackElements_.length;
      }
    });

    for (var i = 0, length = trackElements.length; i < length; i++) {
      list.addTrackElement_(trackElements[i]);
    }

    if (browser.IS_IE8) {
      return list;
    }
  }

  /**
   * Add an {@link HtmlTrackElement} to the `HtmlTrackElementList`
   *
   * @param {HtmlTrackElement} trackElement
   *        The track element to add to the list.
   *
   * @private
   */


  HtmlTrackElementList.prototype.addTrackElement_ = function addTrackElement_(trackElement) {
    var index = this.trackElements_.length;

    if (!('' + index in this)) {
      Object.defineProperty(this, index, {
        get: function get() {
          return this.trackElements_[index];
        }
      });
    }

    // Do not add duplicate elements
    if (this.trackElements_.indexOf(trackElement) === -1) {
      this.trackElements_.push(trackElement);
    }
  };

  /**
   * Get an {@link HtmlTrackElement} from the `HtmlTrackElementList` given an
   * {@link TextTrack}.
   *
   * @param {TextTrack} track
   *        The track associated with a track element.
   *
   * @return {HtmlTrackElement|undefined}
   *         The track element that was found or undefined.
   *
   * @private
   */


  HtmlTrackElementList.prototype.getTrackElementByTrack_ = function getTrackElementByTrack_(track) {
    var trackElement_ = void 0;

    for (var i = 0, length = this.trackElements_.length; i < length; i++) {
      if (track === this.trackElements_[i].track) {
        trackElement_ = this.trackElements_[i];

        break;
      }
    }

    return trackElement_;
  };

  /**
   * Remove a {@link HtmlTrackElement} from the `HtmlTrackElementList`
   *
   * @param {HtmlTrackElement} trackElement
   *        The track element to remove from the list.
   *
   * @private
   */


  HtmlTrackElementList.prototype.removeTrackElement_ = function removeTrackElement_(trackElement) {
    for (var i = 0, length = this.trackElements_.length; i < length; i++) {
      if (trackElement === this.trackElements_[i]) {
        this.trackElements_.splice(i, 1);

        break;
      }
    }
  };

  return HtmlTrackElementList;
}();

exports['default'] = HtmlTrackElementList;

},{"78":78,"94":94}],66:[function(_dereq_,module,exports){
'use strict';

exports.__esModule = true;

var _browser = _dereq_(78);

var browser = _interopRequireWildcard(_browser);

var _document = _dereq_(94);

var _document2 = _interopRequireDefault(_document);

var _eventTarget = _dereq_(42);

var _eventTarget2 = _interopRequireDefault(_eventTarget);

var _textTrack = _dereq_(72);

var _textTrack2 = _interopRequireDefault(_textTrack);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * @file html-track-element.js
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                */

/**
 * @typedef {HTMLTrackElement~ReadyState}
 * @enum {number}
 */
var NONE = 0;
var LOADING = 1;
var LOADED = 2;
var ERROR = 3;

/**
 * A single track represented in the DOM.
 *
 * @see [Spec]{@link https://html.spec.whatwg.org/multipage/embedded-content.html#htmltrackelement}
 * @extends EventTarget
 */

var HTMLTrackElement = function (_EventTarget) {
  _inherits(HTMLTrackElement, _EventTarget);

  /**
   * Create an instance of this class.
   *
   * @param {Object} options={}
   *        Object of option names and values
   *
   * @param {Tech} options.tech
   *        A reference to the tech that owns this HTMLTrackElement.
   *
   * @param {TextTrack~Kind} [options.kind='subtitles']
   *        A valid text track kind.
   *
   * @param {TextTrack~Mode} [options.mode='disabled']
   *        A valid text track mode.
   *
   * @param {string} [options.id='vjs_track_' + Guid.newGUID()]
   *        A unique id for this TextTrack.
   *
   * @param {string} [options.label='']
   *        The menu label for this track.
   *
   * @param {string} [options.language='']
   *        A valid two character language code.
   *
   * @param {string} [options.srclang='']
   *        A valid two character language code. An alternative, but deprioritized
   *        vesion of `options.language`
   *
   * @param {string} [options.src]
   *        A url to TextTrack cues.
   *
   * @param {boolean} [options.default]
   *        If this track should default to on or off.
   */
  function HTMLTrackElement() {
    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    _classCallCheck(this, HTMLTrackElement);

    var _this = _possibleConstructorReturn(this, _EventTarget.call(this));

    var readyState = void 0;
    var trackElement = _this; // eslint-disable-line

    if (browser.IS_IE8) {
      trackElement = _document2['default'].createElement('custom');

      for (var prop in HTMLTrackElement.prototype) {
        if (prop !== 'constructor') {
          trackElement[prop] = HTMLTrackElement.prototype[prop];
        }
      }
    }

    var track = new _textTrack2['default'](options);

    trackElement.kind = track.kind;
    trackElement.src = track.src;
    trackElement.srclang = track.language;
    trackElement.label = track.label;
    trackElement['default'] = track['default'];

    /**
     * @member {HTMLTrackElement~ReadyState} readyState
     *         The current ready state of the track element.
     */
    Object.defineProperty(trackElement, 'readyState', {
      get: function get() {
        return readyState;
      }
    });

    /**
     * @member {TextTrack} track
     *         The underlying TextTrack object.
     */
    Object.defineProperty(trackElement, 'track', {
      get: function get() {
        return track;
      }
    });

    readyState = NONE;

    /**
     * @listens TextTrack#loadeddata
     * @fires HTMLTrackElement#load
     */
    track.addEventListener('loadeddata', function () {
      readyState = LOADED;

      trackElement.trigger({
        type: 'load',
        target: trackElement
      });
    });

    if (browser.IS_IE8) {
      var _ret;

      return _ret = trackElement, _possibleConstructorReturn(_this, _ret);
    }
    return _this;
  }

  return HTMLTrackElement;
}(_eventTarget2['default']);

HTMLTrackElement.prototype.allowedEvents_ = {
  load: 'load'
};

HTMLTrackElement.NONE = NONE;
HTMLTrackElement.LOADING = LOADING;
HTMLTrackElement.LOADED = LOADED;
HTMLTrackElement.ERROR = ERROR;

exports['default'] = HTMLTrackElement;

},{"42":42,"72":72,"78":78,"94":94}],67:[function(_dereq_,module,exports){
'use strict';

exports.__esModule = true;

var _browser = _dereq_(78);

var browser = _interopRequireWildcard(_browser);

var _document = _dereq_(94);

var _document2 = _interopRequireDefault(_document);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } } /**
                                                                                                                                                           * @file text-track-cue-list.js
                                                                                                                                                           */


/**
 * @typedef {Object} TextTrackCue
 *
 * @property {string} id
 *           The unique id for this text track cue
 *
 * @property {number} startTime
 *           The start time for this text track cue
 *
 * @property {number} endTime
 *           The end time for this text track cue
 *
 * @property {boolean} pauseOnExit
 *           Pause when the end time is reached if true.
 *
 * @see [Spec]{@link https://html.spec.whatwg.org/multipage/embedded-content.html#texttrackcue}
 */

/**
 * A List of TextTrackCues.
 *
 * @see [Spec]{@link https://html.spec.whatwg.org/multipage/embedded-content.html#texttrackcuelist}
 */
var TextTrackCueList = function () {

  /**
   * Create an instance of this class..
   *
   * @param {Array} cues
   *        A list of cues to be initialized with
   */
  function TextTrackCueList(cues) {
    _classCallCheck(this, TextTrackCueList);

    var list = this; // eslint-disable-line

    if (browser.IS_IE8) {
      list = _document2['default'].createElement('custom');

      for (var prop in TextTrackCueList.prototype) {
        if (prop !== 'constructor') {
          list[prop] = TextTrackCueList.prototype[prop];
        }
      }
    }

    TextTrackCueList.prototype.setCues_.call(list, cues);

    /**
     * @member {number} length
     *         The current number of `TextTrackCue`s in the TextTrackCueList.
     */
    Object.defineProperty(list, 'length', {
      get: function get() {
        return this.length_;
      }
    });

    if (browser.IS_IE8) {
      return list;
    }
  }

  /**
   * A setter for cues in this list. Creates getters
   * an an index for the cues.
   *
   * @param {Array} cues
   *        An array of cues to set
   *
   * @private
   */


  TextTrackCueList.prototype.setCues_ = function setCues_(cues) {
    var oldLength = this.length || 0;
    var i = 0;
    var l = cues.length;

    this.cues_ = cues;
    this.length_ = cues.length;

    var defineProp = function defineProp(index) {
      if (!('' + index in this)) {
        Object.defineProperty(this, '' + index, {
          get: function get() {
            return this.cues_[index];
          }
        });
      }
    };

    if (oldLength < l) {
      i = oldLength;

      for (; i < l; i++) {
        defineProp.call(this, i);
      }
    }
  };

  /**
   * Get a `TextTrackCue` that is currently in the `TextTrackCueList` by id.
   *
   * @param {string} id
   *        The id of the cue that should be searched for.
   *
   * @return {TextTrackCue|null}
   *         A single cue or null if none was found.
   */


  TextTrackCueList.prototype.getCueById = function getCueById(id) {
    var result = null;

    for (var i = 0, l = this.length; i < l; i++) {
      var cue = this[i];

      if (cue.id === id) {
        result = cue;
        break;
      }
    }

    return result;
  };

  return TextTrackCueList;
}();

exports['default'] = TextTrackCueList;

},{"78":78,"94":94}],68:[function(_dereq_,module,exports){
'use strict';

exports.__esModule = true;

var _component = _dereq_(5);

var _component2 = _interopRequireDefault(_component);

var _fn = _dereq_(83);

var Fn = _interopRequireWildcard(_fn);

var _window = _dereq_(95);

var _window2 = _interopRequireDefault(_window);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * @file text-track-display.js
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                */


var darkGray = '#222';
var lightGray = '#ccc';
var fontMap = {
  monospace: 'monospace',
  sansSerif: 'sans-serif',
  serif: 'serif',
  monospaceSansSerif: '"Andale Mono", "Lucida Console", monospace',
  monospaceSerif: '"Courier New", monospace',
  proportionalSansSerif: 'sans-serif',
  proportionalSerif: 'serif',
  casual: '"Comic Sans MS", Impact, fantasy',
  script: '"Monotype Corsiva", cursive',
  smallcaps: '"Andale Mono", "Lucida Console", monospace, sans-serif'
};

/**
 * Construct an rgba color from a given hex color code.
 *
 * @param {number} color
 *        Hex number for color, like #f0e.
 *
 * @param {number} opacity
 *        Value for opacity, 0.0 - 1.0.
 *
 * @return {string}
 *         The rgba color that was created, like 'rgba(255, 0, 0, 0.3)'.
 *
 * @private
 */
function constructColor(color, opacity) {
  return 'rgba(' +
  // color looks like "#f0e"
  parseInt(color[1] + color[1], 16) + ',' + parseInt(color[2] + color[2], 16) + ',' + parseInt(color[3] + color[3], 16) + ',' + opacity + ')';
}

/**
 * Try to update the style of a DOM element. Some style changes will throw an error,
 * particularly in IE8. Those should be noops.
 *
 * @param {Element} el
 *        The DOM element to be styled.
 *
 * @param {string} style
 *        The CSS property on the element that should be styled.
 *
 * @param {string} rule
 *        The style rule that should be applied to the property.
 */
function tryUpdateStyle(el, style, rule) {
  try {
    el.style[style] = rule;
  } catch (e) {

    // Satisfies linter.
    return;
  }
}

/**
 * The component for displaying text track cues.
 *
 * @extends Component
 */

var TextTrackDisplay = function (_Component) {
  _inherits(TextTrackDisplay, _Component);

  /**
   * Creates an instance of this class.
   *
   * @param {Player} player
   *        The `Player` that this class should be attached to.
   *
   * @param {Object} [options]
   *        The key/value store of player options.
   *
   * @param {Component~ReadyCallback} [ready]
   *        The function to call when `TextTrackDisplay` is ready.
   */
  function TextTrackDisplay(player, options, ready) {
    _classCallCheck(this, TextTrackDisplay);

    var _this = _possibleConstructorReturn(this, _Component.call(this, player, options, ready));

    player.on('loadstart', Fn.bind(_this, _this.toggleDisplay));
    player.on('texttrackchange', Fn.bind(_this, _this.updateDisplay));

    // This used to be called during player init, but was causing an error
    // if a track should show by default and the display hadn't loaded yet.
    // Should probably be moved to an external track loader when we support
    // tracks that don't need a display.
    player.ready(Fn.bind(_this, function () {
      if (player.tech_ && player.tech_.featuresNativeTextTracks) {
        this.hide();
        return;
      }

      player.on('fullscreenchange', Fn.bind(this, this.updateDisplay));

      var tracks = this.options_.playerOptions.tracks || [];

      for (var i = 0; i < tracks.length; i++) {
        this.player_.addRemoteTextTrack(tracks[i], true);
      }

      var modes = { captions: 1, subtitles: 1 };
      var trackList = this.player_.textTracks();
      var firstDesc = void 0;
      var firstCaptions = void 0;

      if (trackList) {
        for (var _i = 0; _i < trackList.length; _i++) {
          var track = trackList[_i];

          if (track['default']) {
            if (track.kind === 'descriptions' && !firstDesc) {
              firstDesc = track;
            } else if (track.kind in modes && !firstCaptions) {
              firstCaptions = track;
            }
          }
        }

        // We want to show the first default track but captions and subtitles
        // take precedence over descriptions.
        // So, display the first default captions or subtitles track
        // and otherwise the first default descriptions track.
        if (firstCaptions) {
          firstCaptions.mode = 'showing';
        } else if (firstDesc) {
          firstDesc.mode = 'showing';
        }
      }
    }));
    return _this;
  }

  /**
   * Turn display of {@link TextTrack}'s from the current state into the other state.
   * There are only two states:
   * - 'shown'
   * - 'hidden'
   *
   * @listens Player#loadstart
   */


  TextTrackDisplay.prototype.toggleDisplay = function toggleDisplay() {
    if (this.player_.tech_ && this.player_.tech_.featuresNativeTextTracks) {
      this.hide();
    } else {
      this.show();
    }
  };

  /**
   * Create the {@link Component}'s DOM element.
   *
   * @return {Element}
   *         The element that was created.
   */


  TextTrackDisplay.prototype.createEl = function createEl() {
    return _Component.prototype.createEl.call(this, 'div', {
      className: 'vjs-text-track-display'
    }, {
      'aria-live': 'off',
      'aria-atomic': 'true'
    });
  };

  /**
   * Clear all displayed {@link TextTrack}s.
   */


  TextTrackDisplay.prototype.clearDisplay = function clearDisplay() {
    if (typeof _window2['default'].WebVTT === 'function') {
      _window2['default'].WebVTT.processCues(_window2['default'], [], this.el_);
    }
  };

  /**
   * Update the displayed TextTrack when a either a {@link Player#texttrackchange} or
   * a {@link Player#fullscreenchange} is fired.
   *
   * @listens Player#texttrackchange
   * @listens Player#fullscreenchange
   */


  TextTrackDisplay.prototype.updateDisplay = function updateDisplay() {
    var tracks = this.player_.textTracks();

    this.clearDisplay();

    if (!tracks) {
      return;
    }

    // Track display prioritization model: if multiple tracks are 'showing',
    //  display the first 'subtitles' or 'captions' track which is 'showing',
    //  otherwise display the first 'descriptions' track which is 'showing'

    var descriptionsTrack = null;
    var captionsSubtitlesTrack = null;

    var i = tracks.length;

    while (i--) {
      var track = tracks[i];

      if (track.mode === 'showing') {
        if (track.kind === 'descriptions') {
          descriptionsTrack = track;
        } else {
          captionsSubtitlesTrack = track;
        }
      }
    }

    if (captionsSubtitlesTrack) {
      if (this.getAttribute('aria-live') !== 'off') {
        this.setAttribute('aria-live', 'off');
      }
      this.updateForTrack(captionsSubtitlesTrack);
    } else if (descriptionsTrack) {
      if (this.getAttribute('aria-live') !== 'assertive') {
        this.setAttribute('aria-live', 'assertive');
      }
      this.updateForTrack(descriptionsTrack);
    }
  };

  /**
   * Add an {@link Texttrack} to to the {@link Tech}s {@link TextTrackList}.
   *
   * @param {TextTrack} track
   *        Text track object to be added to the list.
   */


  TextTrackDisplay.prototype.updateForTrack = function updateForTrack(track) {
    if (typeof _window2['default'].WebVTT !== 'function' || !track.activeCues) {
      return;
    }

    var overrides = this.player_.textTrackSettings.getValues();
    var cues = [];

    for (var _i2 = 0; _i2 < track.activeCues.length; _i2++) {
      cues.push(track.activeCues[_i2]);
    }

    _window2['default'].WebVTT.processCues(_window2['default'], cues, this.el_);

    var i = cues.length;

    while (i--) {
      var cue = cues[i];

      if (!cue) {
        continue;
      }

      var cueDiv = cue.displayState;

      if (overrides.color) {
        cueDiv.firstChild.style.color = overrides.color;
      }
      if (overrides.textOpacity) {
        tryUpdateStyle(cueDiv.firstChild, 'color', constructColor(overrides.color || '#fff', overrides.textOpacity));
      }
      if (overrides.backgroundColor) {
        cueDiv.firstChild.style.backgroundColor = overrides.backgroundColor;
      }
      if (overrides.backgroundOpacity) {
        tryUpdateStyle(cueDiv.firstChild, 'backgroundColor', constructColor(overrides.backgroundColor || '#000', overrides.backgroundOpacity));
      }
      if (overrides.windowColor) {
        if (overrides.windowOpacity) {
          tryUpdateStyle(cueDiv, 'backgroundColor', constructColor(overrides.windowColor, overrides.windowOpacity));
        } else {
          cueDiv.style.backgroundColor = overrides.windowColor;
        }
      }
      if (overrides.edgeStyle) {
        if (overrides.edgeStyle === 'dropshadow') {
          cueDiv.firstChild.style.textShadow = '2px 2px 3px ' + darkGray + ', 2px 2px 4px ' + darkGray + ', 2px 2px 5px ' + darkGray;
        } else if (overrides.edgeStyle === 'raised') {
          cueDiv.firstChild.style.textShadow = '1px 1px ' + darkGray + ', 2px 2px ' + darkGray + ', 3px 3px ' + darkGray;
        } else if (overrides.edgeStyle === 'depressed') {
          cueDiv.firstChild.style.textShadow = '1px 1px ' + lightGray + ', 0 1px ' + lightGray + ', -1px -1px ' + darkGray + ', 0 -1px ' + darkGray;
        } else if (overrides.edgeStyle === 'uniform') {
          cueDiv.firstChild.style.textShadow = '0 0 4px ' + darkGray + ', 0 0 4px ' + darkGray + ', 0 0 4px ' + darkGray + ', 0 0 4px ' + darkGray;
        }
      }
      if (overrides.fontPercent && overrides.fontPercent !== 1) {
        var fontSize = _window2['default'].parseFloat(cueDiv.style.fontSize);

        cueDiv.style.fontSize = fontSize * overrides.fontPercent + 'px';
        cueDiv.style.height = 'auto';
        cueDiv.style.top = 'auto';
        cueDiv.style.bottom = '2px';
      }
      if (overrides.fontFamily && overrides.fontFamily !== 'default') {
        if (overrides.fontFamily === 'small-caps') {
          cueDiv.firstChild.style.fontVariant = 'small-caps';
        } else {
          cueDiv.firstChild.style.fontFamily = fontMap[overrides.fontFamily];
        }
      }
    }
  };

  return TextTrackDisplay;
}(_component2['default']);

_component2['default'].registerComponent('TextTrackDisplay', TextTrackDisplay);
exports['default'] = TextTrackDisplay;

},{"5":5,"83":83,"95":95}],69:[function(_dereq_,module,exports){
'use strict';

exports.__esModule = true;
/**
 * @file text-track-list-converter.js Utilities for capturing text track state and
 * re-creating tracks based on a capture.
 *
 * @module text-track-list-converter
 */

/**
 * Examine a single {@link TextTrack} and return a JSON-compatible javascript object that
 * represents the {@link TextTrack}'s state.
 *
 * @param {TextTrack} track
 *        The text track to query.
 *
 * @return {Object}
 *         A serializable javascript representation of the TextTrack.
 * @private
 */
var trackToJson_ = function trackToJson_(track) {
  var ret = ['kind', 'label', 'language', 'id', 'inBandMetadataTrackDispatchType', 'mode', 'src'].reduce(function (acc, prop, i) {

    if (track[prop]) {
      acc[prop] = track[prop];
    }

    return acc;
  }, {
    cues: track.cues && Array.prototype.map.call(track.cues, function (cue) {
      return {
        startTime: cue.startTime,
        endTime: cue.endTime,
        text: cue.text,
        id: cue.id
      };
    })
  });

  return ret;
};

/**
 * Examine a {@link Tech} and return a JSON-compatible javascript array that represents the
 * state of all {@link TextTrack}s currently configured. The return array is compatible with
 * {@link text-track-list-converter:jsonToTextTracks}.
 *
 * @param {Tech} tech
 *        The tech object to query
 *
 * @return {Array}
 *         A serializable javascript representation of the {@link Tech}s
 *         {@link TextTrackList}.
 */
var textTracksToJson = function textTracksToJson(tech) {

  var trackEls = tech.$$('track');

  var trackObjs = Array.prototype.map.call(trackEls, function (t) {
    return t.track;
  });
  var tracks = Array.prototype.map.call(trackEls, function (trackEl) {
    var json = trackToJson_(trackEl.track);

    if (trackEl.src) {
      json.src = trackEl.src;
    }
    return json;
  });

  return tracks.concat(Array.prototype.filter.call(tech.textTracks(), function (track) {
    return trackObjs.indexOf(track) === -1;
  }).map(trackToJson_));
};

/**
 * Create a set of remote {@link TextTrack}s on a {@link Tech} based on an array of javascript
 * object {@link TextTrack} representations.
 *
 * @param {Array} json
 *        An array of `TextTrack` representation objects, like those that would be
 *        produced by `textTracksToJson`.
 *
 * @param {Tech} tech
 *        The `Tech` to create the `TextTrack`s on.
 */
var jsonToTextTracks = function jsonToTextTracks(json, tech) {
  json.forEach(function (track) {
    var addedTrack = tech.addRemoteTextTrack(track).track;

    if (!track.src && track.cues) {
      track.cues.forEach(function (cue) {
        return addedTrack.addCue(cue);
      });
    }
  });

  return tech.textTracks();
};

exports['default'] = { textTracksToJson: textTracksToJson, jsonToTextTracks: jsonToTextTracks, trackToJson_: trackToJson_ };

},{}],70:[function(_dereq_,module,exports){
'use strict';

exports.__esModule = true;

var _trackList = _dereq_(74);

var _trackList2 = _interopRequireDefault(_trackList);

var _fn = _dereq_(83);

var Fn = _interopRequireWildcard(_fn);

var _browser = _dereq_(78);

var browser = _interopRequireWildcard(_browser);

var _document = _dereq_(94);

var _document2 = _interopRequireDefault(_document);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * @file text-track-list.js
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                */


/**
 * The current list of {@link TextTrack} for a media file.
 *
 * @see [Spec]{@link https://html.spec.whatwg.org/multipage/embedded-content.html#texttracklist}
 * @extends TrackList
 */
var TextTrackList = function (_TrackList) {
  _inherits(TextTrackList, _TrackList);

  /**
   * Create an instance of this class.
   *
   * @param {TextTrack[]} [tracks=[]]
   *        A list of `TextTrack` to instantiate the list with.
   */
  function TextTrackList() {
    var _this, _ret;

    var tracks = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];

    _classCallCheck(this, TextTrackList);

    var list = void 0;

    // IE8 forces us to implement inheritance ourselves
    // as it does not support Object.defineProperty properly
    if (browser.IS_IE8) {
      list = _document2['default'].createElement('custom');
      for (var prop in _trackList2['default'].prototype) {
        if (prop !== 'constructor') {
          list[prop] = _trackList2['default'].prototype[prop];
        }
      }
      for (var _prop in TextTrackList.prototype) {
        if (_prop !== 'constructor') {
          list[_prop] = TextTrackList.prototype[_prop];
        }
      }
    }

    list = (_this = _possibleConstructorReturn(this, _TrackList.call(this, tracks, list)), _this);
    return _ret = list, _possibleConstructorReturn(_this, _ret);
  }

  /**
   * Add a {@link TextTrack} to the `TextTrackList`
   *
   * @param {TextTrack} track
   *        The text track to add to the list.
   *
   * @fires TrackList#addtrack
   * @private
   */


  TextTrackList.prototype.addTrack_ = function addTrack_(track) {
    _TrackList.prototype.addTrack_.call(this, track);

    /**
     * @listens TextTrack#modechange
     * @fires TrackList#change
     */
    track.addEventListener('modechange', Fn.bind(this, function () {
      this.trigger('change');
    }));
  };

  return TextTrackList;
}(_trackList2['default']);

exports['default'] = TextTrackList;

},{"74":74,"78":78,"83":83,"94":94}],71:[function(_dereq_,module,exports){
'use strict';

exports.__esModule = true;

var _window = _dereq_(95);

var _window2 = _interopRequireDefault(_window);

var _component = _dereq_(5);

var _component2 = _interopRequireDefault(_component);

var _dom = _dereq_(81);

var _fn = _dereq_(83);

var Fn = _interopRequireWildcard(_fn);

var _obj = _dereq_(88);

var Obj = _interopRequireWildcard(_obj);

var _log = _dereq_(86);

var _log2 = _interopRequireDefault(_log);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * @file text-track-settings.js
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                */


var LOCAL_STORAGE_KEY = 'vjs-text-track-settings';

var COLOR_BLACK = ['#000', 'Black'];
var COLOR_BLUE = ['#00F', 'Blue'];
var COLOR_CYAN = ['#0FF', 'Cyan'];
var COLOR_GREEN = ['#0F0', 'Green'];
var COLOR_MAGENTA = ['#F0F', 'Magenta'];
var COLOR_RED = ['#F00', 'Red'];
var COLOR_WHITE = ['#FFF', 'White'];
var COLOR_YELLOW = ['#FF0', 'Yellow'];

var OPACITY_OPAQUE = ['1', 'Opaque'];
var OPACITY_SEMI = ['0.5', 'Semi-Transparent'];
var OPACITY_TRANS = ['0', 'Transparent'];

// Configuration for the various <select> elements in the DOM of this component.
//
// Possible keys include:
//
// `default`:
//   The default option index. Only needs to be provided if not zero.
// `parser`:
//   A function which is used to parse the value from the selected option in
//   a customized way.
// `selector`:
//   The selector used to find the associated <select> element.
var selectConfigs = {
  backgroundColor: {
    selector: '.vjs-bg-color > select',
    id: 'captions-background-color-%s',
    label: 'Color',
    options: [COLOR_BLACK, COLOR_WHITE, COLOR_RED, COLOR_GREEN, COLOR_BLUE, COLOR_YELLOW, COLOR_MAGENTA, COLOR_CYAN]
  },

  backgroundOpacity: {
    selector: '.vjs-bg-opacity > select',
    id: 'captions-background-opacity-%s',
    label: 'Transparency',
    options: [OPACITY_OPAQUE, OPACITY_SEMI, OPACITY_TRANS]
  },

  color: {
    selector: '.vjs-fg-color > select',
    id: 'captions-foreground-color-%s',
    label: 'Color',
    options: [COLOR_WHITE, COLOR_BLACK, COLOR_RED, COLOR_GREEN, COLOR_BLUE, COLOR_YELLOW, COLOR_MAGENTA, COLOR_CYAN]
  },

  edgeStyle: {
    selector: '.vjs-edge-style > select',
    id: '%s',
    label: 'Text Edge Style',
    options: [['none', 'None'], ['raised', 'Raised'], ['depressed', 'Depressed'], ['uniform', 'Uniform'], ['dropshadow', 'Dropshadow']]
  },

  fontFamily: {
    selector: '.vjs-font-family > select',
    id: 'captions-font-family-%s',
    label: 'Font Family',
    options: [['proportionalSansSerif', 'Proportional Sans-Serif'], ['monospaceSansSerif', 'Monospace Sans-Serif'], ['proportionalSerif', 'Proportional Serif'], ['monospaceSerif', 'Monospace Serif'], ['casual', 'Casual'], ['script', 'Script'], ['small-caps', 'Small Caps']]
  },

  fontPercent: {
    selector: '.vjs-font-percent > select',
    id: 'captions-font-size-%s',
    label: 'Font Size',
    options: [['0.50', '50%'], ['0.75', '75%'], ['1.00', '100%'], ['1.25', '125%'], ['1.50', '150%'], ['1.75', '175%'], ['2.00', '200%'], ['3.00', '300%'], ['4.00', '400%']],
    'default': 2,
    parser: function parser(v) {
      return v === '1.00' ? null : Number(v);
    }
  },

  textOpacity: {
    selector: '.vjs-text-opacity > select',
    id: 'captions-foreground-opacity-%s',
    label: 'Transparency',
    options: [OPACITY_OPAQUE, OPACITY_SEMI]
  },

  // Options for this object are defined below.
  windowColor: {
    selector: '.vjs-window-color > select',
    id: 'captions-window-color-%s',
    label: 'Color'
  },

  // Options for this object are defined below.
  windowOpacity: {
    selector: '.vjs-window-opacity > select',
    id: 'captions-window-opacity-%s',
    label: 'Transparency',
    options: [OPACITY_TRANS, OPACITY_SEMI, OPACITY_OPAQUE]
  }
};

selectConfigs.windowColor.options = selectConfigs.backgroundColor.options;

/**
 * Get the actual value of an option.
 *
 * @param  {string} value
 *         The value to get
 *
 * @param  {Function} [parser]
 *         Optional function to adjust the value.
 *
 * @return {Mixed}
 *         - Will be `undefined` if no value exists
 *         - Will be `undefined` if the given value is "none".
 *         - Will be the actual value otherwise.
 *
 * @private
 */
function parseOptionValue(value, parser) {
  if (parser) {
    value = parser(value);
  }

  if (value && value !== 'none') {
    return value;
  }
}

/**
 * Gets the value of the selected <option> element within a <select> element.
 *
 * @param  {Element} el
 *         the element to look in
 *
 * @param  {Function} [parser]
 *         Optional function to adjust the value.
 *
 * @return {Mixed}
 *         - Will be `undefined` if no value exists
 *         - Will be `undefined` if the given value is "none".
 *         - Will be the actual value otherwise.
 *
 * @private
 */
function getSelectedOptionValue(el, parser) {
  var value = el.options[el.options.selectedIndex].value;

  return parseOptionValue(value, parser);
}

/**
 * Sets the selected <option> element within a <select> element based on a
 * given value.
 *
 * @param {Element} el
 *        The element to look in.
 *
 * @param {string} value
 *        the property to look on.
 *
 * @param {Function} [parser]
 *        Optional function to adjust the value before comparing.
 *
 * @private
 */
function setSelectedOption(el, value, parser) {
  if (!value) {
    return;
  }

  for (var i = 0; i < el.options.length; i++) {
    if (parseOptionValue(el.options[i].value, parser) === value) {
      el.selectedIndex = i;
      break;
    }
  }
}

/**
 * Manipulate Text Tracks settings.
 *
 * @extends Component
 */

var TextTrackSettings = function (_Component) {
  _inherits(TextTrackSettings, _Component);

  /**
   * Creates an instance of this class.
   *
   * @param {Player} player
   *         The `Player` that this class should be attached to.
   *
   * @param {Object} [options]
   *         The key/value store of player options.
   */
  function TextTrackSettings(player, options) {
    _classCallCheck(this, TextTrackSettings);

    var _this = _possibleConstructorReturn(this, _Component.call(this, player, options));

    _this.setDefaults();
    _this.hide();

    _this.updateDisplay = Fn.bind(_this, _this.updateDisplay);

    // Grab `persistTextTrackSettings` from the player options if not passed in child options
    if (options.persistTextTrackSettings === undefined) {
      _this.options_.persistTextTrackSettings = _this.options_.playerOptions.persistTextTrackSettings;
    }

    _this.on(_this.$('.vjs-done-button'), 'click', function () {
      _this.saveSettings();
      _this.hide();
    });

    _this.on(_this.$('.vjs-default-button'), 'click', function () {
      _this.setDefaults();
      _this.updateDisplay();
    });

    Obj.each(selectConfigs, function (config) {
      _this.on(_this.$(config.selector), 'change', _this.updateDisplay);
    });

    if (_this.options_.persistTextTrackSettings) {
      _this.restoreSettings();
    }
    return _this;
  }

  /**
   * Create a <select> element with configured options.
   *
   * @param {string} key
   *        Configuration key to use during creation.
   *
   * @return {Element}
   *         The DOM element that gets created.
   * @private
   */


  TextTrackSettings.prototype.createElSelect_ = function createElSelect_(key) {
    var _this2 = this;

    var config = selectConfigs[key];
    var id = config.id.replace('%s', this.id_);

    return [(0, _dom.createEl)('label', {
      className: 'vjs-label',
      textContent: config.label
    }, {
      'for': id
    }), (0, _dom.createEl)('select', { id: id }, undefined, config.options.map(function (o) {
      return (0, _dom.createEl)('option', {
        textContent: _this2.localize(o[1]),
        value: o[0]
      });
    }))];
  };

  /**
   * Create foreground color element for the component
   *
   * @return {Element}
   *         The element that was created.
   *
   * @private
   */


  TextTrackSettings.prototype.createElFgColor_ = function createElFgColor_() {
    var legend = (0, _dom.createEl)('legend', {
      textContent: this.localize('Text')
    });

    var select = this.createElSelect_('color');

    var opacity = (0, _dom.createEl)('span', {
      className: 'vjs-text-opacity vjs-opacity'
    }, undefined, this.createElSelect_('textOpacity'));

    return (0, _dom.createEl)('fieldset', {
      className: 'vjs-fg-color vjs-tracksetting'
    }, undefined, [legend].concat(select, opacity));
  };

  /**
   * Create background color element for the component
   *
   * @return {Element}
   *         The element that was created
   *
   * @private
   */


  TextTrackSettings.prototype.createElBgColor_ = function createElBgColor_() {
    var legend = (0, _dom.createEl)('legend', {
      textContent: this.localize('Background')
    });

    var select = this.createElSelect_('backgroundColor');

    var opacity = (0, _dom.createEl)('span', {
      className: 'vjs-bg-opacity vjs-opacity'
    }, undefined, this.createElSelect_('backgroundOpacity'));

    return (0, _dom.createEl)('fieldset', {
      className: 'vjs-bg-color vjs-tracksetting'
    }, undefined, [legend].concat(select, opacity));
  };

  /**
   * Create window color element for the component
   *
   * @return {Element}
   *         The element that was created
   *
   * @private
   */


  TextTrackSettings.prototype.createElWinColor_ = function createElWinColor_() {
    var legend = (0, _dom.createEl)('legend', {
      textContent: this.localize('Window')
    });

    var select = this.createElSelect_('windowColor');

    var opacity = (0, _dom.createEl)('span', {
      className: 'vjs-window-opacity vjs-opacity'
    }, undefined, this.createElSelect_('windowOpacity'));

    return (0, _dom.createEl)('fieldset', {
      className: 'vjs-window-color vjs-tracksetting'
    }, undefined, [legend].concat(select, opacity));
  };

  /**
   * Create color elements for the component
   *
   * @return {Element}
   *         The element that was created
   *
   * @private
   */


  TextTrackSettings.prototype.createElColors_ = function createElColors_() {
    return (0, _dom.createEl)('div', {
      className: 'vjs-tracksettings-colors'
    }, undefined, [this.createElFgColor_(), this.createElBgColor_(), this.createElWinColor_()]);
  };

  /**
   * Create font elements for the component
   *
   * @return {Element}
   *         The element that was created.
   *
   * @private
   */


  TextTrackSettings.prototype.createElFont_ = function createElFont_() {
    var fontPercent = (0, _dom.createEl)('div', {
      className: 'vjs-font-percent vjs-tracksetting'
    }, undefined, this.createElSelect_('fontPercent'));

    var edgeStyle = (0, _dom.createEl)('div', {
      className: 'vjs-edge-style vjs-tracksetting'
    }, undefined, this.createElSelect_('edgeStyle'));

    var fontFamily = (0, _dom.createEl)('div', {
      className: 'vjs-font-family vjs-tracksetting'
    }, undefined, this.createElSelect_('fontFamily'));

    return (0, _dom.createEl)('div', {
      className: 'vjs-tracksettings-font'
    }, undefined, [fontPercent, edgeStyle, fontFamily]);
  };

  /**
   * Create controls for the component
   *
   * @return {Element}
   *         The element that was created.
   *
   * @private
   */


  TextTrackSettings.prototype.createElControls_ = function createElControls_() {
    var defaultsButton = (0, _dom.createEl)('button', {
      className: 'vjs-default-button',
      textContent: this.localize('Defaults')
    });

    var doneButton = (0, _dom.createEl)('button', {
      className: 'vjs-done-button',
      textContent: 'Done'
    });

    return (0, _dom.createEl)('div', {
      className: 'vjs-tracksettings-controls'
    }, undefined, [defaultsButton, doneButton]);
  };

  /**
   * Create the component's DOM element
   *
   * @return {Element}
   *         The element that was created.
   */


  TextTrackSettings.prototype.createEl = function createEl() {
    var settings = (0, _dom.createEl)('div', {
      className: 'vjs-tracksettings'
    }, undefined, [this.createElColors_(), this.createElFont_(), this.createElControls_()]);

    var heading = (0, _dom.createEl)('div', {
      className: 'vjs-control-text',
      id: 'TTsettingsDialogLabel-' + this.id_,
      textContent: 'Caption Settings Dialog'
    }, {
      'aria-level': '1',
      'role': 'heading'
    });

    var description = (0, _dom.createEl)('div', {
      className: 'vjs-control-text',
      id: 'TTsettingsDialogDescription-' + this.id_,
      textContent: 'Beginning of dialog window. Escape will cancel and close the window.'
    });

    var doc = (0, _dom.createEl)('div', undefined, {
      role: 'document'
    }, [heading, description, settings]);

    return (0, _dom.createEl)('div', {
      className: 'vjs-caption-settings vjs-modal-overlay',
      tabIndex: -1
    }, {
      'role': 'dialog',
      'aria-labelledby': heading.id,
      'aria-describedby': description.id
    }, doc);
  };

  /**
   * Gets an object of text track settings (or null).
   *
   * @return {Object}
   *         An object with config values parsed from the DOM or localStorage.
   */


  TextTrackSettings.prototype.getValues = function getValues() {
    var _this3 = this;

    return Obj.reduce(selectConfigs, function (accum, config, key) {
      var value = getSelectedOptionValue(_this3.$(config.selector), config.parser);

      if (value !== undefined) {
        accum[key] = value;
      }

      return accum;
    }, {});
  };

  /**
   * Sets text track settings from an object of values.
   *
   * @param {Object} values
   *        An object with config values parsed from the DOM or localStorage.
   */


  TextTrackSettings.prototype.setValues = function setValues(values) {
    var _this4 = this;

    Obj.each(selectConfigs, function (config, key) {
      setSelectedOption(_this4.$(config.selector), values[key], config.parser);
    });
  };

  /**
   * Sets all <select> elements to their default values.
   */


  TextTrackSettings.prototype.setDefaults = function setDefaults() {
    var _this5 = this;

    Obj.each(selectConfigs, function (config) {
      var index = config.hasOwnProperty('default') ? config['default'] : 0;

      _this5.$(config.selector).selectedIndex = index;
    });
  };

  /**
   * Restore texttrack settings from localStorage
   */


  TextTrackSettings.prototype.restoreSettings = function restoreSettings() {
    var values = void 0;

    try {
      values = JSON.parse(_window2['default'].localStorage.getItem(LOCAL_STORAGE_KEY));
    } catch (err) {
      _log2['default'].warn(err);
    }

    if (values) {
      this.setValues(values);
    }
  };

  /**
   * Save text track settings to localStorage
   */


  TextTrackSettings.prototype.saveSettings = function saveSettings() {
    if (!this.options_.persistTextTrackSettings) {
      return;
    }

    var values = this.getValues();

    try {
      if (Object.keys(values).length) {
        _window2['default'].localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(values));
      } else {
        _window2['default'].localStorage.removeItem(LOCAL_STORAGE_KEY);
      }
    } catch (err) {
      _log2['default'].warn(err);
    }
  };

  /**
   * Update display of text track settings
   */


  TextTrackSettings.prototype.updateDisplay = function updateDisplay() {
    var ttDisplay = this.player_.getChild('textTrackDisplay');

    if (ttDisplay) {
      ttDisplay.updateDisplay();
    }
  };

  return TextTrackSettings;
}(_component2['default']);

_component2['default'].registerComponent('TextTrackSettings', TextTrackSettings);

exports['default'] = TextTrackSettings;

},{"5":5,"81":81,"83":83,"86":86,"88":88,"95":95}],72:[function(_dereq_,module,exports){
'use strict';

exports.__esModule = true;

var _textTrackCueList = _dereq_(67);

var _textTrackCueList2 = _interopRequireDefault(_textTrackCueList);

var _fn = _dereq_(83);

var Fn = _interopRequireWildcard(_fn);

var _trackEnums = _dereq_(73);

var _log = _dereq_(86);

var _log2 = _interopRequireDefault(_log);

var _window = _dereq_(95);

var _window2 = _interopRequireDefault(_window);

var _track = _dereq_(75);

var _track2 = _interopRequireDefault(_track);

var _url = _dereq_(92);

var _xhr = _dereq_(104);

var _xhr2 = _interopRequireDefault(_xhr);

var _mergeOptions = _dereq_(87);

var _mergeOptions2 = _interopRequireDefault(_mergeOptions);

var _browser = _dereq_(78);

var browser = _interopRequireWildcard(_browser);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * @file text-track.js
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                */


/**
 * Takes a webvtt file contents and parses it into cues
 *
 * @param {string} srcContent
 *        webVTT file contents
 *
 * @param {TextTrack} track
 *        TextTrack to add cues to. Cues come from the srcContent.
 *
 * @private
 */
var parseCues = function parseCues(srcContent, track) {
  var parser = new _window2['default'].WebVTT.Parser(_window2['default'], _window2['default'].vttjs, _window2['default'].WebVTT.StringDecoder());
  var errors = [];

  parser.oncue = function (cue) {
    track.addCue(cue);
  };

  parser.onparsingerror = function (error) {
    errors.push(error);
  };

  parser.onflush = function () {
    track.trigger({
      type: 'loadeddata',
      target: track
    });
  };

  parser.parse(srcContent);
  if (errors.length > 0) {
    if (_window2['default'].console && _window2['default'].console.groupCollapsed) {
      _window2['default'].console.groupCollapsed('Text Track parsing errors for ' + track.src);
    }
    errors.forEach(function (error) {
      return _log2['default'].error(error);
    });
    if (_window2['default'].console && _window2['default'].console.groupEnd) {
      _window2['default'].console.groupEnd();
    }
  }

  parser.flush();
};

/**
 * Load a `TextTrack` from a specifed url.
 *
 * @param {string} src
 *        Url to load track from.
 *
 * @param {TextTrack} track
 *        Track to add cues to. Comes from the content at the end of `url`.
 *
 * @private
 */
var loadTrack = function loadTrack(src, track) {
  var opts = {
    uri: src
  };
  var crossOrigin = (0, _url.isCrossOrigin)(src);

  if (crossOrigin) {
    opts.cors = crossOrigin;
  }

  (0, _xhr2['default'])(opts, Fn.bind(this, function (err, response, responseBody) {
    if (err) {
      return _log2['default'].error(err, response);
    }

    track.loaded_ = true;

    // Make sure that vttjs has loaded, otherwise, wait till it finished loading
    // NOTE: this is only used for the alt/video.novtt.js build
    if (typeof _window2['default'].WebVTT !== 'function') {
      if (track.tech_) {
        var loadHandler = function loadHandler() {
          return parseCues(responseBody, track);
        };

        track.tech_.on('vttjsloaded', loadHandler);
        track.tech_.on('vttjserror', function () {
          _log2['default'].error('vttjs failed to load, stopping trying to process ' + track.src);
          track.tech_.off('vttjsloaded', loadHandler);
        });
      }
    } else {
      parseCues(responseBody, track);
    }
  }));
};

/**
 * A representation of a single `TextTrack`.
 *
 * @see [Spec]{@link https://html.spec.whatwg.org/multipage/embedded-content.html#texttrack}
 * @extends Track
 */

var TextTrack = function (_Track) {
  _inherits(TextTrack, _Track);

  /**
   * Create an instance of this class.
   *
   * @param {Object} options={}
   *        Object of option names and values
   *
   * @param {Tech} options.tech
   *        A reference to the tech that owns this TextTrack.
   *
   * @param {TextTrack~Kind} [options.kind='subtitles']
   *        A valid text track kind.
   *
   * @param {TextTrack~Mode} [options.mode='disabled']
   *        A valid text track mode.
   *
   * @param {string} [options.id='vjs_track_' + Guid.newGUID()]
   *        A unique id for this TextTrack.
   *
   * @param {string} [options.label='']
   *        The menu label for this track.
   *
   * @param {string} [options.language='']
   *        A valid two character language code.
   *
   * @param {string} [options.srclang='']
   *        A valid two character language code. An alternative, but deprioritized
   *        vesion of `options.language`
   *
   * @param {string} [options.src]
   *        A url to TextTrack cues.
   *
   * @param {boolean} [options.default]
   *        If this track should default to on or off.
   */
  function TextTrack() {
    var _this, _ret;

    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    _classCallCheck(this, TextTrack);

    if (!options.tech) {
      throw new Error('A tech was not provided.');
    }

    var settings = (0, _mergeOptions2['default'])(options, {
      kind: _trackEnums.TextTrackKind[options.kind] || 'subtitles',
      language: options.language || options.srclang || ''
    });
    var mode = _trackEnums.TextTrackMode[settings.mode] || 'disabled';
    var default_ = settings['default'];

    if (settings.kind === 'metadata' || settings.kind === 'chapters') {
      mode = 'hidden';
    }
    // on IE8 this will be a document element
    // for every other browser this will be a normal object
    var tt = (_this = _possibleConstructorReturn(this, _Track.call(this, settings)), _this);

    tt.tech_ = settings.tech;

    if (browser.IS_IE8) {
      for (var prop in TextTrack.prototype) {
        if (prop !== 'constructor') {
          tt[prop] = TextTrack.prototype[prop];
        }
      }
    }

    tt.cues_ = [];
    tt.activeCues_ = [];

    var cues = new _textTrackCueList2['default'](tt.cues_);
    var activeCues = new _textTrackCueList2['default'](tt.activeCues_);
    var changed = false;
    var timeupdateHandler = Fn.bind(tt, function () {

      // Accessing this.activeCues for the side-effects of updating itself
      // due to it's nature as a getter function. Do not remove or cues will
      // stop updating!
      /* eslint-disable no-unused-expressions */
      this.activeCues;
      /* eslint-enable no-unused-expressions */
      if (changed) {
        this.trigger('cuechange');
        changed = false;
      }
    });

    if (mode !== 'disabled') {
      tt.tech_.ready(function () {
        tt.tech_.on('timeupdate', timeupdateHandler);
      }, true);
    }

    /**
     * @member {boolean} default
     *         If this track was set to be on or off by default. Cannot be changed after
     *         creation.
     *
     * @readonly
     */
    Object.defineProperty(tt, 'default', {
      get: function get() {
        return default_;
      },
      set: function set() {}
    });

    /**
     * @member {string} mode
     *         Set the mode of this TextTrack to a valid {@link TextTrack~Mode}. Will
     *         not be set if setting to an invalid mode.
     *
     * @fires TextTrack#modechange
     */
    Object.defineProperty(tt, 'mode', {
      get: function get() {
        return mode;
      },
      set: function set(newMode) {
        var _this2 = this;

        if (!_trackEnums.TextTrackMode[newMode]) {
          return;
        }
        mode = newMode;
        if (mode === 'showing') {
          this.tech_.ready(function () {
            _this2.tech_.on('timeupdate', timeupdateHandler);
          }, true);
        }
        /**
         * An event that fires when mode changes on this track. This allows
         * the TextTrackList that holds this track to act accordingly.
         *
         * > Note: This is not part of the spec!
         *
         * @event TextTrack#modechange
         * @type {EventTarget~Event}
         */
        this.trigger('modechange');
      }
    });

    /**
     * @member {TextTrackCueList} cues
     *         The text track cue list for this TextTrack.
     */
    Object.defineProperty(tt, 'cues', {
      get: function get() {
        if (!this.loaded_) {
          return null;
        }

        return cues;
      },
      set: function set() {}
    });

    /**
     * @member {TextTrackCueList} activeCues
     *         The list text track cues that are currently active for this TextTrack.
     */
    Object.defineProperty(tt, 'activeCues', {
      get: function get() {
        if (!this.loaded_) {
          return null;
        }

        // nothing to do
        if (this.cues.length === 0) {
          return activeCues;
        }

        var ct = this.tech_.currentTime();
        var active = [];

        for (var i = 0, l = this.cues.length; i < l; i++) {
          var cue = this.cues[i];

          if (cue.startTime <= ct && cue.endTime >= ct) {
            active.push(cue);
          } else if (cue.startTime === cue.endTime && cue.startTime <= ct && cue.startTime + 0.5 >= ct) {
            active.push(cue);
          }
        }

        changed = false;

        if (active.length !== this.activeCues_.length) {
          changed = true;
        } else {
          for (var _i = 0; _i < active.length; _i++) {
            if (this.activeCues_.indexOf(active[_i]) === -1) {
              changed = true;
            }
          }
        }

        this.activeCues_ = active;
        activeCues.setCues_(this.activeCues_);

        return activeCues;
      },
      set: function set() {}
    });

    if (settings.src) {
      tt.src = settings.src;
      loadTrack(settings.src, tt);
    } else {
      tt.loaded_ = true;
    }

    return _ret = tt, _possibleConstructorReturn(_this, _ret);
  }

  /**
   * Add a cue to the internal list of cues.
   *
   * @param {TextTrack~Cue} cue
   *        The cue to add to our internal list
   */


  TextTrack.prototype.addCue = function addCue(originalCue) {
    var cue = originalCue;

    if (_window2['default'].vttjs && !(originalCue instanceof _window2['default'].vttjs.VTTCue)) {
      cue = new _window2['default'].vttjs.VTTCue(originalCue.startTime, originalCue.endTime, originalCue.text);

      for (var prop in originalCue) {
        if (!(prop in cue)) {
          cue[prop] = originalCue[prop];
        }
      }

      // make sure that `id` is copied over
      cue.id = originalCue.id;
      cue.originalCue_ = originalCue;
    }

    var tracks = this.tech_.textTracks();

    if (tracks) {
      for (var i = 0; i < tracks.length; i++) {
        if (tracks[i] !== this) {
          tracks[i].removeCue(cue);
        }
      }
    }

    this.cues_.push(cue);
    this.cues.setCues_(this.cues_);
  };

  /**
   * Remove a cue from our internal list
   *
   * @param {TextTrack~Cue} removeCue
   *        The cue to remove from our internal list
   */


  TextTrack.prototype.removeCue = function removeCue(_removeCue) {
    var i = this.cues_.length;

    while (i--) {
      var cue = this.cues_[i];

      if (cue === _removeCue || cue.originalCue_ && cue.originalCue_ === _removeCue) {
        this.cues_.splice(i, 1);
        this.cues.setCues_(this.cues_);
        break;
      }
    }
  };

  return TextTrack;
}(_track2['default']);

/**
 * cuechange - One or more cues in the track have become active or stopped being active.
 */


TextTrack.prototype.allowedEvents_ = {
  cuechange: 'cuechange'
};

exports['default'] = TextTrack;

},{"104":104,"67":67,"73":73,"75":75,"78":78,"83":83,"86":86,"87":87,"92":92,"95":95}],73:[function(_dereq_,module,exports){
'use strict';

exports.__esModule = true;
/**
 * @file track-kinds.js
 */

/**
 * All possible `VideoTrackKind`s
 *
 * @see https://html.spec.whatwg.org/multipage/embedded-content.html#dom-videotrack-kind
 * @typedef VideoTrack~Kind
 * @enum
 */
var VideoTrackKind = exports.VideoTrackKind = {
  alternative: 'alternative',
  captions: 'captions',
  main: 'main',
  sign: 'sign',
  subtitles: 'subtitles',
  commentary: 'commentary'
};

/**
 * All possible `AudioTrackKind`s
 *
 * @see https://html.spec.whatwg.org/multipage/embedded-content.html#dom-audiotrack-kind
 * @typedef AudioTrack~Kind
 * @enum
 */
var AudioTrackKind = exports.AudioTrackKind = {
  'alternative': 'alternative',
  'descriptions': 'descriptions',
  'main': 'main',
  'main-desc': 'main-desc',
  'translation': 'translation',
  'commentary': 'commentary'
};

/**
 * All possible `TextTrackKind`s
 *
 * @see https://html.spec.whatwg.org/multipage/embedded-content.html#dom-texttrack-kind
 * @typedef TextTrack~Kind
 * @enum
 */
var TextTrackKind = exports.TextTrackKind = {
  subtitles: 'subtitles',
  captions: 'captions',
  descriptions: 'descriptions',
  chapters: 'chapters',
  metadata: 'metadata'
};

/**
 * All possible `TextTrackMode`s
 *
 * @see https://html.spec.whatwg.org/multipage/embedded-content.html#texttrackmode
 * @typedef TextTrack~Mode
 * @enum
 */
var TextTrackMode = exports.TextTrackMode = {
  disabled: 'disabled',
  hidden: 'hidden',
  showing: 'showing'
};

},{}],74:[function(_dereq_,module,exports){
'use strict';

exports.__esModule = true;

var _eventTarget = _dereq_(42);

var _eventTarget2 = _interopRequireDefault(_eventTarget);

var _browser = _dereq_(78);

var browser = _interopRequireWildcard(_browser);

var _document = _dereq_(94);

var _document2 = _interopRequireDefault(_document);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * @file track-list.js
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                */


/**
 * Common functionaliy between {@link TextTrackList}, {@link AudioTrackList}, and
 * {@link VideoTrackList}
 *
 * @extends EventTarget
 */
var TrackList = function (_EventTarget) {
  _inherits(TrackList, _EventTarget);

  /**
   * Create an instance of this class
   *
   * @param {Track[]} tracks
   *        A list of tracks to initialize the list with.
   *
   * @param {Object} [list]
   *        The child object with inheritance done manually for ie8.
   *
   * @abstract
   */
  function TrackList() {
    var tracks = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];

    var _ret;

    var list = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;

    _classCallCheck(this, TrackList);

    var _this = _possibleConstructorReturn(this, _EventTarget.call(this));

    if (!list) {
      list = _this; // eslint-disable-line
      if (browser.IS_IE8) {
        list = _document2['default'].createElement('custom');
        for (var prop in TrackList.prototype) {
          if (prop !== 'constructor') {
            list[prop] = TrackList.prototype[prop];
          }
        }
      }
    }

    list.tracks_ = [];

    /**
     * @member {number} length
     *         The current number of `Track`s in the this Trackist.
     */
    Object.defineProperty(list, 'length', {
      get: function get() {
        return this.tracks_.length;
      }
    });

    for (var i = 0; i < tracks.length; i++) {
      list.addTrack_(tracks[i]);
    }

    // must return the object, as for ie8 it will not be this
    // but a reference to a document object
    return _ret = list, _possibleConstructorReturn(_this, _ret);
  }

  /**
   * Add a {@link Track} to the `TrackList`
   *
   * @param {Track} track
   *        The audio, video, or text track to add to the list.
   *
   * @fires TrackList#addtrack
   * @private
   */


  TrackList.prototype.addTrack_ = function addTrack_(track) {
    var index = this.tracks_.length;

    if (!('' + index in this)) {
      Object.defineProperty(this, index, {
        get: function get() {
          return this.tracks_[index];
        }
      });
    }

    // Do not add duplicate tracks
    if (this.tracks_.indexOf(track) === -1) {
      this.tracks_.push(track);
      /**
       * Triggered when a track is added to a track list.
       *
       * @event TrackList#addtrack
       * @type {EventTarget~Event}
       * @property {Track} track
       *           A reference to track that was added.
       */
      this.trigger({
        track: track,
        type: 'addtrack'
      });
    }
  };

  /**
   * Remove a {@link Track} from the `TrackList`
   *
   * @param {Track} track
   *        The audio, video, or text track to remove from the list.
   *
   * @fires TrackList#removetrack
   * @private
   */


  TrackList.prototype.removeTrack_ = function removeTrack_(rtrack) {
    var track = void 0;

    for (var i = 0, l = this.length; i < l; i++) {
      if (this[i] === rtrack) {
        track = this[i];
        if (track.off) {
          track.off();
        }

        this.tracks_.splice(i, 1);

        break;
      }
    }

    if (!track) {
      return;
    }

    /**
     * Triggered when a track is removed from track list.
     *
     * @event TrackList#removetrack
     * @type {EventTarget~Event}
     * @property {Track} track
     *           A reference to track that was removed.
     */
    this.trigger({
      track: track,
      type: 'removetrack'
    });
  };

  /**
   * Get a Track from the TrackList by a tracks id
   *
   * @param {String} id - the id of the track to get
   * @method getTrackById
   * @return {Track}
   * @private
   */


  TrackList.prototype.getTrackById = function getTrackById(id) {
    var result = null;

    for (var i = 0, l = this.length; i < l; i++) {
      var track = this[i];

      if (track.id === id) {
        result = track;
        break;
      }
    }

    return result;
  };

  return TrackList;
}(_eventTarget2['default']);

/**
 * Triggered when a different track is selected/enabled.
 *
 * @event TrackList#change
 * @type {EventTarget~Event}
 */

/**
 * Events that can be called with on + eventName. See {@link EventHandler}.
 *
 * @property {Object} TrackList#allowedEvents_
 * @private
 */


TrackList.prototype.allowedEvents_ = {
  change: 'change',
  addtrack: 'addtrack',
  removetrack: 'removetrack'
};

// emulate attribute EventHandler support to allow for feature detection
for (var event in TrackList.prototype.allowedEvents_) {
  TrackList.prototype['on' + event] = null;
}

exports['default'] = TrackList;

},{"42":42,"78":78,"94":94}],75:[function(_dereq_,module,exports){
'use strict';

exports.__esModule = true;

var _browser = _dereq_(78);

var browser = _interopRequireWildcard(_browser);

var _document = _dereq_(94);

var _document2 = _interopRequireDefault(_document);

var _guid = _dereq_(85);

var Guid = _interopRequireWildcard(_guid);

var _eventTarget = _dereq_(42);

var _eventTarget2 = _interopRequireDefault(_eventTarget);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * @file track.js
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                */


/**
 * A Track class that contains all of the common functionality for {@link AudioTrack},
 * {@link VideoTrack}, and {@link TextTrack}.
 *
 * > Note: This class should not be used directly
 *
 * @see {@link https://html.spec.whatwg.org/multipage/embedded-content.html}
 * @extends EventTarget
 * @abstract
 */
var Track = function (_EventTarget) {
  _inherits(Track, _EventTarget);

  /**
   * Create an instance of this class.
   *
   * @param {Object} [options={}]
   *        Object of option names and values
   *
   * @param {string} [options.kind='']
   *        A valid kind for the track type you are creating.
   *
   * @param {string} [options.id='vjs_track_' + Guid.newGUID()]
   *        A unique id for this AudioTrack.
   *
   * @param {string} [options.label='']
   *        The menu label for this track.
   *
   * @param {string} [options.language='']
   *        A valid two character language code.
   *
   * @abstract
   */
  function Track() {
    var _ret;

    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    _classCallCheck(this, Track);

    var _this = _possibleConstructorReturn(this, _EventTarget.call(this));

    var track = _this; // eslint-disable-line

    if (browser.IS_IE8) {
      track = _document2['default'].createElement('custom');
      for (var prop in Track.prototype) {
        if (prop !== 'constructor') {
          track[prop] = Track.prototype[prop];
        }
      }
    }

    var trackProps = {
      id: options.id || 'vjs_track_' + Guid.newGUID(),
      kind: options.kind || '',
      label: options.label || '',
      language: options.language || ''
    };

    /**
     * @member {string} id
     *         The id of this track. Cannot be changed after creation.
     *
     * @readonly
     */

    /**
     * @member {string} kind
     *         The kind of track that this is. Cannot be changed after creation.
     *
     * @readonly
     */

    /**
     * @member {string} label
     *         The label of this track. Cannot be changed after creation.
     *
     * @readonly
     */

    /**
     * @member {string} language
     *         The two letter language code for this track. Cannot be changed after
     *         creation.
     *
     * @readonly
     */

    var _loop = function _loop(key) {
      Object.defineProperty(track, key, {
        get: function get() {
          return trackProps[key];
        },
        set: function set() {}
      });
    };

    for (var key in trackProps) {
      _loop(key);
    }

    return _ret = track, _possibleConstructorReturn(_this, _ret);
  }

  return Track;
}(_eventTarget2['default']);

exports['default'] = Track;

},{"42":42,"78":78,"85":85,"94":94}],76:[function(_dereq_,module,exports){
'use strict';

exports.__esModule = true;

var _trackList = _dereq_(74);

var _trackList2 = _interopRequireDefault(_trackList);

var _browser = _dereq_(78);

var browser = _interopRequireWildcard(_browser);

var _document = _dereq_(94);

var _document2 = _interopRequireDefault(_document);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * @file video-track-list.js
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                */


/**
 * Un-select all other {@link VideoTrack}s that are selected.
 *
 * @param {VideoTrackList} list
 *        list to work on
 *
 * @param {VideoTrack} track
 *        The track to skip
 *
 * @private
 */
var disableOthers = function disableOthers(list, track) {
  for (var i = 0; i < list.length; i++) {
    if (track.id === list[i].id) {
      continue;
    }
    // another video track is enabled, disable it
    list[i].selected = false;
  }
};

/**
 * The current list of {@link VideoTrack} for a video.
 *
 * @see [Spec]{@link https://html.spec.whatwg.org/multipage/embedded-content.html#videotracklist}
 * @extends TrackList
 */

var VideoTrackList = function (_TrackList) {
  _inherits(VideoTrackList, _TrackList);

  /**
   * Create an instance of this class.
   *
   * @param {VideoTrack[]} [tracks=[]]
   *        A list of `VideoTrack` to instantiate the list with.
   */
  function VideoTrackList() {
    var _this, _ret;

    var tracks = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];

    _classCallCheck(this, VideoTrackList);

    var list = void 0;

    // make sure only 1 track is enabled
    // sorted from last index to first index
    for (var i = tracks.length - 1; i >= 0; i--) {
      if (tracks[i].selected) {
        disableOthers(tracks, tracks[i]);
        break;
      }
    }

    // IE8 forces us to implement inheritance ourselves
    // as it does not support Object.defineProperty properly
    if (browser.IS_IE8) {
      list = _document2['default'].createElement('custom');
      for (var prop in _trackList2['default'].prototype) {
        if (prop !== 'constructor') {
          list[prop] = _trackList2['default'].prototype[prop];
        }
      }
      for (var _prop in VideoTrackList.prototype) {
        if (_prop !== 'constructor') {
          list[_prop] = VideoTrackList.prototype[_prop];
        }
      }
    }

    list = (_this = _possibleConstructorReturn(this, _TrackList.call(this, tracks, list)), _this);
    list.changing_ = false;

    /**
     * @member {number} VideoTrackList#selectedIndex
     *         The current index of the selected {@link VideoTrack`}.
     */
    Object.defineProperty(list, 'selectedIndex', {
      get: function get() {
        for (var _i = 0; _i < this.length; _i++) {
          if (this[_i].selected) {
            return _i;
          }
        }
        return -1;
      },
      set: function set() {}
    });

    return _ret = list, _possibleConstructorReturn(_this, _ret);
  }

  /**
   * Add a {@link VideoTrack} to the `VideoTrackList`.
   *
   * @param {VideoTrack} track
   *        The VideoTrack to add to the list
   *
   * @fires TrackList#addtrack
   * @private
   */


  VideoTrackList.prototype.addTrack_ = function addTrack_(track) {
    var _this2 = this;

    if (track.selected) {
      disableOthers(this, track);
    }

    _TrackList.prototype.addTrack_.call(this, track);
    // native tracks don't have this
    if (!track.addEventListener) {
      return;
    }

    /**
     * @listens VideoTrack#selectedchange
     * @fires TrackList#change
     */
    track.addEventListener('selectedchange', function () {
      if (_this2.changing_) {
        return;
      }
      _this2.changing_ = true;
      disableOthers(_this2, track);
      _this2.changing_ = false;
      _this2.trigger('change');
    });
  };

  /**
   * Add a {@link VideoTrack} to the `VideoTrackList`.
   *
   * @param {VideoTrack} track
   *        The VideoTrack to add to the list
   *
   * @fires TrackList#addtrack
   */


  VideoTrackList.prototype.addTrack = function addTrack(track) {
    this.addTrack_(track);
  };

  /**
   * Remove a {@link VideoTrack} to the `VideoTrackList`.
   *
   * @param {VideoTrack} track
   *        The VideoTrack to remove from the list.
   *
   * @fires TrackList#removetrack
   */


  VideoTrackList.prototype.removeTrack = function removeTrack(track) {
    _TrackList.prototype.removeTrack_.call(this, track);
  };

  return VideoTrackList;
}(_trackList2['default']);

exports['default'] = VideoTrackList;

},{"74":74,"78":78,"94":94}],77:[function(_dereq_,module,exports){
'use strict';

exports.__esModule = true;

var _trackEnums = _dereq_(73);

var _track = _dereq_(75);

var _track2 = _interopRequireDefault(_track);

var _mergeOptions = _dereq_(87);

var _mergeOptions2 = _interopRequireDefault(_mergeOptions);

var _browser = _dereq_(78);

var browser = _interopRequireWildcard(_browser);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

/**
 * A representation of a single `VideoTrack`.
 *
 * @see [Spec]{@link https://html.spec.whatwg.org/multipage/embedded-content.html#videotrack}
 * @extends Track
 */
var VideoTrack = function (_Track) {
  _inherits(VideoTrack, _Track);

  /**
   * Create an instance of this class.
   *
   * @param {Object} [options={}]
   *        Object of option names and values
   *
   * @param {string} [options.kind='']
   *        A valid {@link VideoTrack~Kind}
   *
   * @param {string} [options.id='vjs_track_' + Guid.newGUID()]
   *        A unique id for this AudioTrack.
   *
   * @param {string} [options.label='']
   *        The menu label for this track.
   *
   * @param {string} [options.language='']
   *        A valid two character language code.
   *
   * @param {boolean} [options.selected]
   *        If this track is the one that is currently playing.
   */
  function VideoTrack() {
    var _this, _ret;

    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    _classCallCheck(this, VideoTrack);

    var settings = (0, _mergeOptions2['default'])(options, {
      kind: _trackEnums.VideoTrackKind[options.kind] || ''
    });

    // on IE8 this will be a document element
    // for every other browser this will be a normal object
    var track = (_this = _possibleConstructorReturn(this, _Track.call(this, settings)), _this);
    var selected = false;

    if (browser.IS_IE8) {
      for (var prop in VideoTrack.prototype) {
        if (prop !== 'constructor') {
          track[prop] = VideoTrack.prototype[prop];
        }
      }
    }

    /**
     * @member {boolean} selected
     *         If this `VideoTrack` is selected or not. When setting this will
     *         fire {@link VideoTrack#selectedchange} if the state of selected changed.
     *
     * @fires VideoTrack#selectedchange
     */
    Object.defineProperty(track, 'selected', {
      get: function get() {
        return selected;
      },
      set: function set(newSelected) {
        // an invalid or unchanged value
        if (typeof newSelected !== 'boolean' || newSelected === selected) {
          return;
        }
        selected = newSelected;

        /**
         * An event that fires when selected changes on this track. This allows
         * the VideoTrackList that holds this track to act accordingly.
         *
         * > Note: This is not part of the spec! Native tracks will do
         *         this internally without an event.
         *
         * @event VideoTrack#selectedchange
         * @type {EventTarget~Event}
         */
        this.trigger('selectedchange');
      }
    });

    // if the user sets this track to selected then
    // set selected to that true value otherwise
    // we keep it false
    if (settings.selected) {
      track.selected = settings.selected;
    }

    return _ret = track, _possibleConstructorReturn(_this, _ret);
  }

  return VideoTrack;
}(_track2['default']);

exports['default'] = VideoTrack;

},{"73":73,"75":75,"78":78,"87":87}],78:[function(_dereq_,module,exports){
'use strict';

exports.__esModule = true;
exports.BACKGROUND_SIZE_SUPPORTED = exports.TOUCH_ENABLED = exports.IS_ANY_SAFARI = exports.IS_SAFARI = exports.IE_VERSION = exports.IS_IE8 = exports.CHROME_VERSION = exports.IS_CHROME = exports.IS_EDGE = exports.IS_FIREFOX = exports.IS_NATIVE_ANDROID = exports.IS_OLD_ANDROID = exports.ANDROID_VERSION = exports.IS_ANDROID = exports.IOS_VERSION = exports.IS_IOS = exports.IS_IPOD = exports.IS_IPHONE = exports.IS_IPAD = undefined;

var _dom = _dereq_(81);

var Dom = _interopRequireWildcard(_dom);

var _window = _dereq_(95);

var _window2 = _interopRequireDefault(_window);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

/**
 * @file browser.js
 * @module browser
 */
var USER_AGENT = _window2['default'].navigator && _window2['default'].navigator.userAgent || '';
var webkitVersionMap = /AppleWebKit\/([\d.]+)/i.exec(USER_AGENT);
var appleWebkitVersion = webkitVersionMap ? parseFloat(webkitVersionMap.pop()) : null;

/*
 * Device is an iPhone
 *
 * @type {Boolean}
 * @constant
 * @private
 */
var IS_IPAD = exports.IS_IPAD = /iPad/i.test(USER_AGENT);

// The Facebook app's UIWebView identifies as both an iPhone and iPad, so
// to identify iPhones, we need to exclude iPads.
// http://artsy.github.io/blog/2012/10/18/the-perils-of-ios-user-agent-sniffing/
var IS_IPHONE = exports.IS_IPHONE = /iPhone/i.test(USER_AGENT) && !IS_IPAD;
var IS_IPOD = exports.IS_IPOD = /iPod/i.test(USER_AGENT);
var IS_IOS = exports.IS_IOS = IS_IPHONE || IS_IPAD || IS_IPOD;

var IOS_VERSION = exports.IOS_VERSION = function () {
  var match = USER_AGENT.match(/OS (\d+)_/i);

  if (match && match[1]) {
    return match[1];
  }
  return null;
}();

var IS_ANDROID = exports.IS_ANDROID = /Android/i.test(USER_AGENT);
var ANDROID_VERSION = exports.ANDROID_VERSION = function () {
  // This matches Android Major.Minor.Patch versions
  // ANDROID_VERSION is Major.Minor as a Number, if Minor isn't available, then only Major is returned
  var match = USER_AGENT.match(/Android (\d+)(?:\.(\d+))?(?:\.(\d+))*/i);

  if (!match) {
    return null;
  }

  var major = match[1] && parseFloat(match[1]);
  var minor = match[2] && parseFloat(match[2]);

  if (major && minor) {
    return parseFloat(match[1] + '.' + match[2]);
  } else if (major) {
    return major;
  }
  return null;
}();

// Old Android is defined as Version older than 2.3, and requiring a webkit version of the android browser
var IS_OLD_ANDROID = exports.IS_OLD_ANDROID = IS_ANDROID && /webkit/i.test(USER_AGENT) && ANDROID_VERSION < 2.3;
var IS_NATIVE_ANDROID = exports.IS_NATIVE_ANDROID = IS_ANDROID && ANDROID_VERSION < 5 && appleWebkitVersion < 537;

var IS_FIREFOX = exports.IS_FIREFOX = /Firefox/i.test(USER_AGENT);
var IS_EDGE = exports.IS_EDGE = /Edge/i.test(USER_AGENT);
var IS_CHROME = exports.IS_CHROME = !IS_EDGE && /Chrome/i.test(USER_AGENT);
var CHROME_VERSION = exports.CHROME_VERSION = function () {
  var match = USER_AGENT.match(/Chrome\/(\d+)/);

  if (match && match[1]) {
    return parseFloat(match[1]);
  }
  return null;
}();
var IS_IE8 = exports.IS_IE8 = /MSIE\s8\.0/.test(USER_AGENT);
var IE_VERSION = exports.IE_VERSION = function () {
  var result = /MSIE\s(\d+)\.\d/.exec(USER_AGENT);
  var version = result && parseFloat(result[1]);

  if (!version && /Trident\/7.0/i.test(USER_AGENT) && /rv:11.0/.test(USER_AGENT)) {
    // IE 11 has a different user agent string than other IE versions
    version = 11.0;
  }

  return version;
}();

var IS_SAFARI = exports.IS_SAFARI = /Safari/i.test(USER_AGENT) && !IS_CHROME && !IS_ANDROID && !IS_EDGE;
var IS_ANY_SAFARI = exports.IS_ANY_SAFARI = IS_SAFARI || IS_IOS;

var TOUCH_ENABLED = exports.TOUCH_ENABLED = Dom.isReal() && ('ontouchstart' in _window2['default'] || _window2['default'].DocumentTouch && _window2['default'].document instanceof _window2['default'].DocumentTouch);

var BACKGROUND_SIZE_SUPPORTED = exports.BACKGROUND_SIZE_SUPPORTED = Dom.isReal() && 'backgroundSize' in _window2['default'].document.createElement('video').style;

},{"81":81,"95":95}],79:[function(_dereq_,module,exports){
'use strict';

exports.__esModule = true;
exports.bufferedPercent = bufferedPercent;

var _timeRanges = _dereq_(90);

/**
 * Compute the percentage of the media that has been buffered.
 *
 * @param {TimeRange} buffered
 *        The current `TimeRange` object representing buffered time ranges
 *
 * @param {number} duration
 *        Total duration of the media
 *
 * @return {number}
 *         Percent buffered of the total duration in decimal form.
 */
function bufferedPercent(buffered, duration) {
  var bufferedDuration = 0;
  var start = void 0;
  var end = void 0;

  if (!duration) {
    return 0;
  }

  if (!buffered || !buffered.length) {
    buffered = (0, _timeRanges.createTimeRange)(0, 0);
  }

  for (var i = 0; i < buffered.length; i++) {
    start = buffered.start(i);
    end = buffered.end(i);

    // buffered end can be bigger than duration by a very small fraction
    if (end > duration) {
      end = duration;
    }

    bufferedDuration += end - start;
  }

  return bufferedDuration / duration;
} /**
   * @file buffer.js
   * @module buffer
   */

},{"90":90}],80:[function(_dereq_,module,exports){
'use strict';

exports.__esModule = true;
exports['default'] = computedStyle;

var _window = _dereq_(95);

var _window2 = _interopRequireDefault(_window);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

/**
 * A safe getComputedStyle with an IE8 fallback.
 *
 * This is needed because in Firefox, if the player is loaded in an iframe with
 * `display:none`, then `getComputedStyle` returns `null`, so, we do a null-check to
 * make sure  that the player doesn't break in these cases.
 *
 * @param {Element} el
 *        The element you want the computed style of
 *
 * @param {string} prop
 *        The property name you want
 *
 * @see https://bugzilla.mozilla.org/show_bug.cgi?id=548397
 */
function computedStyle(el, prop) {
  if (!el || !prop) {
    return '';
  }

  if (typeof _window2['default'].getComputedStyle === 'function') {
    var cs = _window2['default'].getComputedStyle(el);

    return cs ? cs[prop] : '';
  }

  return el.currentStyle[prop] || '';
} /**
   * @file computed-style.js
   * @module computed-style
   */

},{"95":95}],81:[function(_dereq_,module,exports){
'use strict';

exports.__esModule = true;
exports.$$ = exports.$ = undefined;

var _templateObject = _taggedTemplateLiteralLoose(['Setting attributes in the second argument of createEl()\n                has been deprecated. Use the third argument instead.\n                createEl(type, properties, attributes). Attempting to set ', ' to ', '.'], ['Setting attributes in the second argument of createEl()\n                has been deprecated. Use the third argument instead.\n                createEl(type, properties, attributes). Attempting to set ', ' to ', '.']);

exports.isReal = isReal;
exports.isEl = isEl;
exports.getEl = getEl;
exports.createEl = createEl;
exports.textContent = textContent;
exports.insertElFirst = insertElFirst;
exports.getElData = getElData;
exports.hasElData = hasElData;
exports.removeElData = removeElData;
exports.hasElClass = hasElClass;
exports.addElClass = addElClass;
exports.removeElClass = removeElClass;
exports.toggleElClass = toggleElClass;
exports.setElAttributes = setElAttributes;
exports.getElAttributes = getElAttributes;
exports.getAttribute = getAttribute;
exports.setAttribute = setAttribute;
exports.removeAttribute = removeAttribute;
exports.blockTextSelection = blockTextSelection;
exports.unblockTextSelection = unblockTextSelection;
exports.findElPosition = findElPosition;
exports.getPointerPosition = getPointerPosition;
exports.isTextNode = isTextNode;
exports.emptyEl = emptyEl;
exports.normalizeContent = normalizeContent;
exports.appendContent = appendContent;
exports.insertContent = insertContent;

var _document = _dereq_(94);

var _document2 = _interopRequireDefault(_document);

var _window = _dereq_(95);

var _window2 = _interopRequireDefault(_window);

var _guid = _dereq_(85);

var Guid = _interopRequireWildcard(_guid);

var _log = _dereq_(86);

var _log2 = _interopRequireDefault(_log);

var _tsml = _dereq_(98);

var _tsml2 = _interopRequireDefault(_tsml);

var _obj = _dereq_(88);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _taggedTemplateLiteralLoose(strings, raw) { strings.raw = raw; return strings; } /**
                                                                                           * @file dom.js
                                                                                           * @module dom
                                                                                           */


/**
 * Detect if a value is a string with any non-whitespace characters.
 *
 * @param {string} str
 *        The string to check
 *
 * @return {boolean}
 *         - True if the string is non-blank
 *         - False otherwise
 *
 */
function isNonBlankString(str) {
  return typeof str === 'string' && /\S/.test(str);
}

/**
 * Throws an error if the passed string has whitespace. This is used by
 * class methods to be relatively consistent with the classList API.
 *
 * @param {string} str
 *         The string to check for whitespace.
 *
 * @throws {Error}
 *         Throws an error if there is whitespace in the string.
 *
 */
function throwIfWhitespace(str) {
  if (/\s/.test(str)) {
    throw new Error('class has illegal whitespace characters');
  }
}

/**
 * Produce a regular expression for matching a className within an elements className.
 *
 * @param {string} className
 *         The className to generate the RegExp for.
 *
 * @return {RegExp}
 *         The RegExp that will check for a specific `className` in an elements
 *         className.
 */
function classRegExp(className) {
  return new RegExp('(^|\\s)' + className + '($|\\s)');
}

/**
 * Whether the current DOM interface appears to be real.
 *
 * @return {Boolean}
 */
function isReal() {
  return (

    // Both document and window will never be undefined thanks to `global`.
    _document2['default'] === _window2['default'].document &&

    // In IE < 9, DOM methods return "object" as their type, so all we can
    // confidently check is that it exists.
    typeof _document2['default'].createElement !== 'undefined'
  );
}

/**
 * Determines, via duck typing, whether or not a value is a DOM element.
 *
 * @param {Mixed} value
 *        The thing to check
 *
 * @return {boolean}
 *         - True if it is a DOM element
 *         - False otherwise
 */
function isEl(value) {
  return (0, _obj.isObject)(value) && value.nodeType === 1;
}

/**
 * Creates functions to query the DOM using a given method.
 *
 * @param {string} method
 *         The method to create the query with.
 *
 * @return {Function}
 *         The query method
 */
function createQuerier(method) {
  return function (selector, context) {
    if (!isNonBlankString(selector)) {
      return _document2['default'][method](null);
    }
    if (isNonBlankString(context)) {
      context = _document2['default'].querySelector(context);
    }

    var ctx = isEl(context) ? context : _document2['default'];

    return ctx[method] && ctx[method](selector);
  };
}

/**
 * Shorthand for document.getElementById()
 * Also allows for CSS (jQuery) ID syntax. But nothing other than IDs.
 *
 * @param {string} id
 *         The id of the element to get
 *
 * @return {Element|null}
 *         Element with supplied ID or null if there wasn't one.
 */
function getEl(id) {
  if (id.indexOf('#') === 0) {
    id = id.slice(1);
  }

  return _document2['default'].getElementById(id);
}

/**
 * Creates an element and applies properties.
 *
 * @param {string} [tagName='div']
 *         Name of tag to be created.
 *
 * @param {Object} [properties={}]
 *         Element properties to be applied.
 *
 * @param {Object} [attributes={}]
 *         Element attributes to be applied.
 *
 * @param {String|Element|TextNode|Array|Function} [content]
 *         Contents for the element (see: {@link dom:normalizeContent})
 *
 * @return {Element}
 *         The element that was created.
 */
function createEl() {
  var tagName = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'div';
  var properties = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  var attributes = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
  var content = arguments[3];

  var el = _document2['default'].createElement(tagName);

  Object.getOwnPropertyNames(properties).forEach(function (propName) {
    var val = properties[propName];

    // See #2176
    // We originally were accepting both properties and attributes in the
    // same object, but that doesn't work so well.
    if (propName.indexOf('aria-') !== -1 || propName === 'role' || propName === 'type') {
      _log2['default'].warn((0, _tsml2['default'])(_templateObject, propName, val));
      el.setAttribute(propName, val);

      // Handle textContent since it's not supported everywhere and we have a
      // method for it.
    } else if (propName === 'textContent') {
      textContent(el, val);
    } else {
      el[propName] = val;
    }
  });

  Object.getOwnPropertyNames(attributes).forEach(function (attrName) {
    el.setAttribute(attrName, attributes[attrName]);
  });

  if (content) {
    appendContent(el, content);
  }

  return el;
}

/**
 * Injects text into an element, replacing any existing contents entirely.
 *
 * @param {Element} el
 *        The element to add text content into
 *
 * @param {string} text
 *        The text content to add.
 *
 * @return {Element}
 *         The element with added text content.
 */
function textContent(el, text) {
  if (typeof el.textContent === 'undefined') {
    el.innerText = text;
  } else {
    el.textContent = text;
  }
  return el;
}

/**
 * Insert an element as the first child node of another
 *
 * @param {Element} child
 *        Element to insert
 *
 * @param {Element} parent
 *        Element to insert child into
 *
 */
function insertElFirst(child, parent) {
  if (parent.firstChild) {
    parent.insertBefore(child, parent.firstChild);
  } else {
    parent.appendChild(child);
  }
}

/**
 * Element Data Store. Allows for binding data to an element without putting it directly on the element.
 * Ex. Event listeners are stored here.
 * (also from jsninja.com, slightly modified and updated for closure compiler)
 *
 * @type {Object}
 * @private
 */
var elData = {};

/*
 * Unique attribute name to store an element's guid in
 *
 * @type {string}
 * @constant
 * @private
 */
var elIdAttr = 'vdata' + new Date().getTime();

/**
 * Returns the cache object where data for an element is stored
 *
 * @param {Element} el
 *        Element to store data for.
 *
 * @return {Object}
 *         The cache object for that el that was passed in.
 */
function getElData(el) {
  var id = el[elIdAttr];

  if (!id) {
    id = el[elIdAttr] = Guid.newGUID();
  }

  if (!elData[id]) {
    elData[id] = {};
  }

  return elData[id];
}

/**
 * Returns whether or not an element has cached data
 *
 * @param {Element} el
 *        Check if this element has cached data.
 *
 * @return {boolean}
 *         - True if the DOM element has cached data.
 *         - False otherwise.
 */
function hasElData(el) {
  var id = el[elIdAttr];

  if (!id) {
    return false;
  }

  return !!Object.getOwnPropertyNames(elData[id]).length;
}

/**
 * Delete data for the element from the cache and the guid attr from getElementById
 *
 * @param {Element} el
 *        Remove cached data for this element.
 */
function removeElData(el) {
  var id = el[elIdAttr];

  if (!id) {
    return;
  }

  // Remove all stored data
  delete elData[id];

  // Remove the elIdAttr property from the DOM node
  try {
    delete el[elIdAttr];
  } catch (e) {
    if (el.removeAttribute) {
      el.removeAttribute(elIdAttr);
    } else {
      // IE doesn't appear to support removeAttribute on the document element
      el[elIdAttr] = null;
    }
  }
}

/**
 * Check if an element has a CSS class
 *
 * @param {Element} element
 *        Element to check
 *
 * @param {string} classToCheck
 *        Class name to check for
 *
 * @return {boolean}
 *         - True if the element had the class
 *         - False otherwise.
 *
 * @throws {Error}
 *         Throws an error if `classToCheck` has white space.
 */
function hasElClass(element, classToCheck) {
  throwIfWhitespace(classToCheck);
  if (element.classList) {
    return element.classList.contains(classToCheck);
  }
  return classRegExp(classToCheck).test(element.className);
}

/**
 * Add a CSS class name to an element
 *
 * @param {Element} element
 *        Element to add class name to.
 *
 * @param {string} classToAdd
 *        Class name to add.
 *
 * @return {Element}
 *         The dom element with the added class name.
 */
function addElClass(element, classToAdd) {
  if (element.classList) {
    element.classList.add(classToAdd);

    // Don't need to `throwIfWhitespace` here because `hasElClass` will do it
    // in the case of classList not being supported.
  } else if (!hasElClass(element, classToAdd)) {
    element.className = (element.className + ' ' + classToAdd).trim();
  }

  return element;
}

/**
 * Remove a CSS class name from an element
 *
 * @param {Element} element
 *        Element to remove a class name from.
 *
 * @param {string} classToRemove
 *        Class name to remove
 *
 * @return {Element}
 *         The dom element with class name removed.
 */
function removeElClass(element, classToRemove) {
  if (element.classList) {
    element.classList.remove(classToRemove);
  } else {
    throwIfWhitespace(classToRemove);
    element.className = element.className.split(/\s+/).filter(function (c) {
      return c !== classToRemove;
    }).join(' ');
  }

  return element;
}

/**
 * The callback definition for toggleElClass.
 *
 * @callback Dom~PredicateCallback
 * @param {Element} element
 *        The DOM element of the Component.
 *
 * @param {string} classToToggle
 *        The `className` that wants to be toggled
 *
 * @return {boolean|undefined}
 *         - If true the `classToToggle` will get added to `element`.
 *         - If false the `classToToggle` will get removed from `element`.
 *         - If undefined this callback will be ignored
 */

/**
 * Adds or removes a CSS class name on an element depending on an optional
 * condition or the presence/absence of the class name.
 *
 * @param {Element} element
 *        The element to toggle a class name on.
 *
 * @param {string} classToToggle
 *        The class that should be toggled
 *
 * @param {boolean|PredicateCallback} [predicate]
 *        See the return value for {@link Dom~PredicateCallback}
 *
 * @return {Element}
 *         The element with a class that has been toggled.
 */
function toggleElClass(element, classToToggle, predicate) {

  // This CANNOT use `classList` internally because IE does not support the
  // second parameter to the `classList.toggle()` method! Which is fine because
  // `classList` will be used by the add/remove functions.
  var has = hasElClass(element, classToToggle);

  if (typeof predicate === 'function') {
    predicate = predicate(element, classToToggle);
  }

  if (typeof predicate !== 'boolean') {
    predicate = !has;
  }

  // If the necessary class operation matches the current state of the
  // element, no action is required.
  if (predicate === has) {
    return;
  }

  if (predicate) {
    addElClass(element, classToToggle);
  } else {
    removeElClass(element, classToToggle);
  }

  return element;
}

/**
 * Apply attributes to an HTML element.
 *
 * @param {Element} el
 *        Element to add attributes to.
 *
 * @param {Object} [attributes]
 *        Attributes to be applied.
 */
function setElAttributes(el, attributes) {
  Object.getOwnPropertyNames(attributes).forEach(function (attrName) {
    var attrValue = attributes[attrName];

    if (attrValue === null || typeof attrValue === 'undefined' || attrValue === false) {
      el.removeAttribute(attrName);
    } else {
      el.setAttribute(attrName, attrValue === true ? '' : attrValue);
    }
  });
}

/**
 * Get an element's attribute values, as defined on the HTML tag
 * Attributes are not the same as properties. They're defined on the tag
 * or with setAttribute (which shouldn't be used with HTML)
 * This will return true or false for boolean attributes.
 *
 * @param {Element} tag
 *        Element from which to get tag attributes.
 *
 * @return {Object}
 *         All attributes of the element.
 */
function getElAttributes(tag) {
  var obj = {};

  // known boolean attributes
  // we can check for matching boolean properties, but older browsers
  // won't know about HTML5 boolean attributes that we still read from
  var knownBooleans = ',' + 'autoplay,controls,loop,muted,default' + ',';

  if (tag && tag.attributes && tag.attributes.length > 0) {
    var attrs = tag.attributes;

    for (var i = attrs.length - 1; i >= 0; i--) {
      var attrName = attrs[i].name;
      var attrVal = attrs[i].value;

      // check for known booleans
      // the matching element property will return a value for typeof
      if (typeof tag[attrName] === 'boolean' || knownBooleans.indexOf(',' + attrName + ',') !== -1) {
        // the value of an included boolean attribute is typically an empty
        // string ('') which would equal false if we just check for a false value.
        // we also don't want support bad code like autoplay='false'
        attrVal = attrVal !== null ? true : false;
      }

      obj[attrName] = attrVal;
    }
  }

  return obj;
}

/**
 * Get the value of an element's attribute
 *
 * @param {Element} el
 *        A DOM element
 *
 * @param {string} attribute
 *        Attribute to get the value of
 *
 * @return {string}
 *         value of the attribute
 */
function getAttribute(el, attribute) {
  return el.getAttribute(attribute);
}

/**
 * Set the value of an element's attribute
 *
 * @param {Element} el
 *        A DOM element
 *
 * @param {string} attribute
 *        Attribute to set
 *
 * @param {string} value
 *        Value to set the attribute to
 */
function setAttribute(el, attribute, value) {
  el.setAttribute(attribute, value);
}

/**
 * Remove an element's attribute
 *
 * @param {Element} el
 *        A DOM element
 *
 * @param {string} attribute
 *        Attribute to remove
 */
function removeAttribute(el, attribute) {
  el.removeAttribute(attribute);
}

/**
 * Attempt to block the ability to select text while dragging controls
 */
function blockTextSelection() {
  _document2['default'].body.focus();
  _document2['default'].onselectstart = function () {
    return false;
  };
}

/**
 * Turn off text selection blocking
 */
function unblockTextSelection() {
  _document2['default'].onselectstart = function () {
    return true;
  };
}

/**
 * The postion of a DOM element on the page.
 *
 * @typedef {Object} Dom~Position
 *
 * @property {number} left
 *           Pixels to the left
 *
 * @property {number} top
 *           Pixels on top
 */

/**
 * Offset Left.
 * getBoundingClientRect technique from
 * John Resig
 *
 * @see http://ejohn.org/blog/getboundingclientrect-is-awesome/
 *
 * @param {Element} el
 *        Element from which to get offset
 *
 * @return {Dom~Position}
 *         The position of the element that was passed in.
 */
function findElPosition(el) {
  var box = void 0;

  if (el.getBoundingClientRect && el.parentNode) {
    box = el.getBoundingClientRect();
  }

  if (!box) {
    return {
      left: 0,
      top: 0
    };
  }

  var docEl = _document2['default'].documentElement;
  var body = _document2['default'].body;

  var clientLeft = docEl.clientLeft || body.clientLeft || 0;
  var scrollLeft = _window2['default'].pageXOffset || body.scrollLeft;
  var left = box.left + scrollLeft - clientLeft;

  var clientTop = docEl.clientTop || body.clientTop || 0;
  var scrollTop = _window2['default'].pageYOffset || body.scrollTop;
  var top = box.top + scrollTop - clientTop;

  // Android sometimes returns slightly off decimal values, so need to round
  return {
    left: Math.round(left),
    top: Math.round(top)
  };
}

/**
 * x and y coordinates for a dom element or mouse pointer
 *
 * @typedef {Object} Dom~Coordinates
 *
 * @property {number} x
 *           x coordinate in pixels
 *
 * @property {number} y
 *           y coordinate in pixels
 */

/**
 * Get pointer position in element
 * Returns an object with x and y coordinates.
 * The base on the coordinates are the bottom left of the element.
 *
 * @param {Element} el
 *        Element on which to get the pointer position on
 *
 * @param {EventTarget~Event} event
 *        Event object
 *
 * @return {Dom~Coordinates}
 *         A Coordinates object corresponding to the mouse position.
 *
 */
function getPointerPosition(el, event) {
  var position = {};
  var box = findElPosition(el);
  var boxW = el.offsetWidth;
  var boxH = el.offsetHeight;

  var boxY = box.top;
  var boxX = box.left;
  var pageY = event.pageY;
  var pageX = event.pageX;

  if (event.changedTouches) {
    pageX = event.changedTouches[0].pageX;
    pageY = event.changedTouches[0].pageY;
  }

  position.y = Math.max(0, Math.min(1, (boxY - pageY + boxH) / boxH));
  position.x = Math.max(0, Math.min(1, (pageX - boxX) / boxW));

  return position;
}

/**
 * Determines, via duck typing, whether or not a value is a text node.
 *
 * @param {Mixed} value
 *        Check if this value is a text node.
 *
 * @return {boolean}
 *         - True if it is a text node
 *         - False otherwise
 */
function isTextNode(value) {
  return (0, _obj.isObject)(value) && value.nodeType === 3;
}

/**
 * Empties the contents of an element.
 *
 * @param {Element} el
 *        The element to empty children from
 *
 * @return {Element}
 *         The element with no children
 */
function emptyEl(el) {
  while (el.firstChild) {
    el.removeChild(el.firstChild);
  }
  return el;
}

/**
 * Normalizes content for eventual insertion into the DOM.
 *
 * This allows a wide range of content definition methods, but protects
 * from falling into the trap of simply writing to `innerHTML`, which is
 * an XSS concern.
 *
 * The content for an element can be passed in multiple types and
 * combinations, whose behavior is as follows:
 *
 * @param {String|Element|TextNode|Array|Function} content
 *        - String: Normalized into a text node.
 *        - Element/TextNode: Passed through.
 *        - Array: A one-dimensional array of strings, elements, nodes, or functions
 *          (which return single strings, elements, or nodes).
 *        - Function: If the sole argument, is expected to produce a string, element,
 *          node, or array as defined above.
 *
 * @return {Array}
 *         All of the content that was passed in normalized.
 */
function normalizeContent(content) {

  // First, invoke content if it is a function. If it produces an array,
  // that needs to happen before normalization.
  if (typeof content === 'function') {
    content = content();
  }

  // Next up, normalize to an array, so one or many items can be normalized,
  // filtered, and returned.
  return (Array.isArray(content) ? content : [content]).map(function (value) {

    // First, invoke value if it is a function to produce a new value,
    // which will be subsequently normalized to a Node of some kind.
    if (typeof value === 'function') {
      value = value();
    }

    if (isEl(value) || isTextNode(value)) {
      return value;
    }

    if (typeof value === 'string' && /\S/.test(value)) {
      return _document2['default'].createTextNode(value);
    }
  }).filter(function (value) {
    return value;
  });
}

/**
 * Normalizes and appends content to an element.
 *
 * @param {Element} el
 *        Element to append normalized content to.
 *
 *
 * @param {String|Element|TextNode|Array|Function} content
 *        See the `content` argument of {@link dom:normalizeContent}
 *
 * @return {Element}
 *         The element with appended normalized content.
 */
function appendContent(el, content) {
  normalizeContent(content).forEach(function (node) {
    return el.appendChild(node);
  });
  return el;
}

/**
 * Normalizes and inserts content into an element; this is identical to
 * `appendContent()`, except it empties the element first.
 *
 * @param {Element} el
 *        Element to insert normalized content into.
 *
 * @param {String|Element|TextNode|Array|Function} content
 *        See the `content` argument of {@link dom:normalizeContent}
 *
 * @return {Element}
 *         The element with inserted normalized content.
 *
 */
function insertContent(el, content) {
  return appendContent(emptyEl(el), content);
}

/**
 * Finds a single DOM element matching `selector` within the optional
 * `context` of another DOM element (defaulting to `document`).
 *
 * @param {string} selector
 *        A valid CSS selector, which will be passed to `querySelector`.
 *
 * @param {Element|String} [context=document]
 *        A DOM element within which to query. Can also be a selector
 *        string in which case the first matching element will be used
 *        as context. If missing (or no element matches selector), falls
 *        back to `document`.
 *
 * @return {Element|null}
 *         The element that was found or null.
 */
var $ = exports.$ = createQuerier('querySelector');

/**
 * Finds a all DOM elements matching `selector` within the optional
 * `context` of another DOM element (defaulting to `document`).
 *
 * @param {string} selector
 *           A valid CSS selector, which will be passed to `querySelectorAll`.
 *
 * @param {Element|String} [context=document]
 *           A DOM element within which to query. Can also be a selector
 *           string in which case the first matching element will be used
 *           as context. If missing (or no element matches selector), falls
 *           back to `document`.
 *
 * @return {NodeList}
 *         A element list of elements that were found. Will be empty if none were found.
 *
 */
var $$ = exports.$$ = createQuerier('querySelectorAll');

},{"85":85,"86":86,"88":88,"94":94,"95":95,"98":98}],82:[function(_dereq_,module,exports){
'use strict';

exports.__esModule = true;
exports.fixEvent = fixEvent;
exports.on = on;
exports.off = off;
exports.trigger = trigger;
exports.one = one;

var _dom = _dereq_(81);

var Dom = _interopRequireWildcard(_dom);

var _guid = _dereq_(85);

var Guid = _interopRequireWildcard(_guid);

var _log = _dereq_(86);

var _log2 = _interopRequireDefault(_log);

var _window = _dereq_(95);

var _window2 = _interopRequireDefault(_window);

var _document = _dereq_(94);

var _document2 = _interopRequireDefault(_document);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

/**
 * Clean up the listener cache and dispatchers
 *
 * @param {Element|Object} elem
 *        Element to clean up
 *
 * @param {string} type
 *        Type of event to clean up
 */
function _cleanUpEvents(elem, type) {
  var data = Dom.getElData(elem);

  // Remove the events of a particular type if there are none left
  if (data.handlers[type].length === 0) {
    delete data.handlers[type];
    // data.handlers[type] = null;
    // Setting to null was causing an error with data.handlers

    // Remove the meta-handler from the element
    if (elem.removeEventListener) {
      elem.removeEventListener(type, data.dispatcher, false);
    } else if (elem.detachEvent) {
      elem.detachEvent('on' + type, data.dispatcher);
    }
  }

  // Remove the events object if there are no types left
  if (Object.getOwnPropertyNames(data.handlers).length <= 0) {
    delete data.handlers;
    delete data.dispatcher;
    delete data.disabled;
  }

  // Finally remove the element data if there is no data left
  if (Object.getOwnPropertyNames(data).length === 0) {
    Dom.removeElData(elem);
  }
}

/**
 * Loops through an array of event types and calls the requested method for each type.
 *
 * @param {Function} fn
 *        The event method we want to use.
 *
 * @param {Element|Object} elem
 *        Element or object to bind listeners to
 *
 * @param {string} type
 *        Type of event to bind to.
 *
 * @param {EventTarget~EventListener} callback
 *        Event listener.
 */
/**
 * @file events.js. An Event System (John Resig - Secrets of a JS Ninja http://jsninja.com/)
 * (Original book version wasn't completely usable, so fixed some things and made Closure Compiler compatible)
 * This should work very similarly to jQuery's events, however it's based off the book version which isn't as
 * robust as jquery's, so there's probably some differences.
 *
 * @module events
 */

function _handleMultipleEvents(fn, elem, types, callback) {
  types.forEach(function (type) {
    // Call the event method for each one of the types
    fn(elem, type, callback);
  });
}

/**
 * Fix a native event to have standard property values
 *
 * @param {Object} event
 *        Event object to fix.
 *
 * @return {Object}
 *         Fixed event object.
 */
function fixEvent(event) {

  function returnTrue() {
    return true;
  }

  function returnFalse() {
    return false;
  }

  // Test if fixing up is needed
  // Used to check if !event.stopPropagation instead of isPropagationStopped
  // But native events return true for stopPropagation, but don't have
  // other expected methods like isPropagationStopped. Seems to be a problem
  // with the Javascript Ninja code. So we're just overriding all events now.
  if (!event || !event.isPropagationStopped) {
    var old = event || _window2['default'].event;

    event = {};
    // Clone the old object so that we can modify the values event = {};
    // IE8 Doesn't like when you mess with native event properties
    // Firefox returns false for event.hasOwnProperty('type') and other props
    //  which makes copying more difficult.
    // TODO: Probably best to create a whitelist of event props
    for (var key in old) {
      // Safari 6.0.3 warns you if you try to copy deprecated layerX/Y
      // Chrome warns you if you try to copy deprecated keyboardEvent.keyLocation
      // and webkitMovementX/Y
      if (key !== 'layerX' && key !== 'layerY' && key !== 'keyLocation' && key !== 'webkitMovementX' && key !== 'webkitMovementY') {
        // Chrome 32+ warns if you try to copy deprecated returnValue, but
        // we still want to if preventDefault isn't supported (IE8).
        if (!(key === 'returnValue' && old.preventDefault)) {
          event[key] = old[key];
        }
      }
    }

    // The event occurred on this element
    if (!event.target) {
      event.target = event.srcElement || _document2['default'];
    }

    // Handle which other element the event is related to
    if (!event.relatedTarget) {
      event.relatedTarget = event.fromElement === event.target ? event.toElement : event.fromElement;
    }

    // Stop the default browser action
    event.preventDefault = function () {
      if (old.preventDefault) {
        old.preventDefault();
      }
      event.returnValue = false;
      old.returnValue = false;
      event.defaultPrevented = true;
    };

    event.defaultPrevented = false;

    // Stop the event from bubbling
    event.stopPropagation = function () {
      if (old.stopPropagation) {
        old.stopPropagation();
      }
      event.cancelBubble = true;
      old.cancelBubble = true;
      event.isPropagationStopped = returnTrue;
    };

    event.isPropagationStopped = returnFalse;

    // Stop the event from bubbling and executing other handlers
    event.stopImmediatePropagation = function () {
      if (old.stopImmediatePropagation) {
        old.stopImmediatePropagation();
      }
      event.isImmediatePropagationStopped = returnTrue;
      event.stopPropagation();
    };

    event.isImmediatePropagationStopped = returnFalse;

    // Handle mouse position
    if (event.clientX !== null && event.clientX !== undefined) {
      var doc = _document2['default'].documentElement;
      var body = _document2['default'].body;

      event.pageX = event.clientX + (doc && doc.scrollLeft || body && body.scrollLeft || 0) - (doc && doc.clientLeft || body && body.clientLeft || 0);
      event.pageY = event.clientY + (doc && doc.scrollTop || body && body.scrollTop || 0) - (doc && doc.clientTop || body && body.clientTop || 0);
    }

    // Handle key presses
    event.which = event.charCode || event.keyCode;

    // Fix button for mouse clicks:
    // 0 == left; 1 == middle; 2 == right
    if (event.button !== null && event.button !== undefined) {

      // The following is disabled because it does not pass videojs-standard
      // and... yikes.
      /* eslint-disable */
      event.button = event.button & 1 ? 0 : event.button & 4 ? 1 : event.button & 2 ? 2 : 0;
      /* eslint-enable */
    }
  }

  // Returns fixed-up instance
  return event;
}

/**
 * Whether passive event listeners are supported
 */
var _supportsPassive = false;

(function () {
  try {
    var opts = Object.defineProperty({}, 'passive', {
      get: function get() {
        _supportsPassive = true;
      }
    });

    _window2['default'].addEventListener('test', null, opts);
  } catch (e) {
    // disregard
  }
})();

/**
 * Touch events Chrome expects to be passive
 */
var passiveEvents = ['touchstart', 'touchmove'];

/**
 * Add an event listener to element
 * It stores the handler function in a separate cache object
 * and adds a generic handler to the element's event,
 * along with a unique id (guid) to the element.
 *
 * @param {Element|Object} elem
 *        Element or object to bind listeners to
 *
 * @param {string|string[]} type
 *        Type of event to bind to.
 *
 * @param {EventTarget~EventListener} fn
 *        Event listener.
 */
function on(elem, type, fn) {
  if (Array.isArray(type)) {
    return _handleMultipleEvents(on, elem, type, fn);
  }

  var data = Dom.getElData(elem);

  // We need a place to store all our handler data
  if (!data.handlers) {
    data.handlers = {};
  }

  if (!data.handlers[type]) {
    data.handlers[type] = [];
  }

  if (!fn.guid) {
    fn.guid = Guid.newGUID();
  }

  data.handlers[type].push(fn);

  if (!data.dispatcher) {
    data.disabled = false;

    data.dispatcher = function (event, hash) {

      if (data.disabled) {
        return;
      }

      event = fixEvent(event);

      var handlers = data.handlers[event.type];

      if (handlers) {
        // Copy handlers so if handlers are added/removed during the process it doesn't throw everything off.
        var handlersCopy = handlers.slice(0);

        for (var m = 0, n = handlersCopy.length; m < n; m++) {
          if (event.isImmediatePropagationStopped()) {
            break;
          } else {
            try {
              handlersCopy[m].call(elem, event, hash);
            } catch (e) {
              _log2['default'].error(e);
            }
          }
        }
      }
    };
  }

  if (data.handlers[type].length === 1) {
    if (elem.addEventListener) {
      var options = false;

      if (_supportsPassive && passiveEvents.indexOf(type) > -1) {
        options = { passive: true };
      }
      elem.addEventListener(type, data.dispatcher, options);
    } else if (elem.attachEvent) {
      elem.attachEvent('on' + type, data.dispatcher);
    }
  }
}

/**
 * Removes event listeners from an element
 *
 * @param {Element|Object} elem
 *        Object to remove listeners from.
 *
 * @param {string|string[]} [type]
 *        Type of listener to remove. Don't include to remove all events from element.
 *
 * @param {EventTarget~EventListener} [fn]
 *        Specific listener to remove. Don't include to remove listeners for an event
 *        type.
 */
function off(elem, type, fn) {
  // Don't want to add a cache object through getElData if not needed
  if (!Dom.hasElData(elem)) {
    return;
  }

  var data = Dom.getElData(elem);

  // If no events exist, nothing to unbind
  if (!data.handlers) {
    return;
  }

  if (Array.isArray(type)) {
    return _handleMultipleEvents(off, elem, type, fn);
  }

  // Utility function
  var removeType = function removeType(t) {
    data.handlers[t] = [];
    _cleanUpEvents(elem, t);
  };

  // Are we removing all bound events?
  if (!type) {
    for (var t in data.handlers) {
      removeType(t);
    }
    return;
  }

  var handlers = data.handlers[type];

  // If no handlers exist, nothing to unbind
  if (!handlers) {
    return;
  }

  // If no listener was provided, remove all listeners for type
  if (!fn) {
    removeType(type);
    return;
  }

  // We're only removing a single handler
  if (fn.guid) {
    for (var n = 0; n < handlers.length; n++) {
      if (handlers[n].guid === fn.guid) {
        handlers.splice(n--, 1);
      }
    }
  }

  _cleanUpEvents(elem, type);
}

/**
 * Trigger an event for an element
 *
 * @param {Element|Object} elem
 *        Element to trigger an event on
 *
 * @param {EventTarget~Event|string} event
 *        A string (the type) or an event object with a type attribute
 *
 * @param {Object} [hash]
 *        data hash to pass along with the event
 *
 * @return {boolean|undefined}
 *         - Returns the opposite of `defaultPrevented` if default was prevented
 *         - Otherwise returns undefined
 */
function trigger(elem, event, hash) {
  // Fetches element data and a reference to the parent (for bubbling).
  // Don't want to add a data object to cache for every parent,
  // so checking hasElData first.
  var elemData = Dom.hasElData(elem) ? Dom.getElData(elem) : {};
  var parent = elem.parentNode || elem.ownerDocument;
  // type = event.type || event,
  // handler;

  // If an event name was passed as a string, creates an event out of it
  if (typeof event === 'string') {
    event = { type: event, target: elem };
  }
  // Normalizes the event properties.
  event = fixEvent(event);

  // If the passed element has a dispatcher, executes the established handlers.
  if (elemData.dispatcher) {
    elemData.dispatcher.call(elem, event, hash);
  }

  // Unless explicitly stopped or the event does not bubble (e.g. media events)
  // recursively calls this function to bubble the event up the DOM.
  if (parent && !event.isPropagationStopped() && event.bubbles === true) {
    trigger.call(null, parent, event, hash);

    // If at the top of the DOM, triggers the default action unless disabled.
  } else if (!parent && !event.defaultPrevented) {
    var targetData = Dom.getElData(event.target);

    // Checks if the target has a default action for this event.
    if (event.target[event.type]) {
      // Temporarily disables event dispatching on the target as we have already executed the handler.
      targetData.disabled = true;
      // Executes the default action.
      if (typeof event.target[event.type] === 'function') {
        event.target[event.type]();
      }
      // Re-enables event dispatching.
      targetData.disabled = false;
    }
  }

  // Inform the triggerer if the default was prevented by returning false
  return !event.defaultPrevented;
}

/**
 * Trigger a listener only once for an event
 *
 * @param {Element|Object} elem
 *        Element or object to bind to.
 *
 * @param {string|string[]} type
 *        Name/type of event
 *
 * @param {Event~EventListener} fn
 *        Event Listener function
 */
function one(elem, type, fn) {
  if (Array.isArray(type)) {
    return _handleMultipleEvents(one, elem, type, fn);
  }
  var func = function func() {
    off(elem, type, func);
    fn.apply(this, arguments);
  };

  // copy the guid to the new function so it can removed using the original function's ID
  func.guid = fn.guid = fn.guid || Guid.newGUID();
  on(elem, type, func);
}

},{"81":81,"85":85,"86":86,"94":94,"95":95}],83:[function(_dereq_,module,exports){
'use strict';

exports.__esModule = true;
exports.throttle = exports.bind = undefined;

var _guid = _dereq_(85);

/**
 * Bind (a.k.a proxy or Context). A simple method for changing the context of a function
 * It also stores a unique id on the function so it can be easily removed from events.
 *
 * @param {Mixed} context
 *        The object to bind as scope.
 *
 * @param {Function} fn
 *        The function to be bound to a scope.
 *
 * @param {number} [uid]
 *        An optional unique ID for the function to be set
 *
 * @return {Function}
 *         The new function that will be bound into the context given
 */
var bind = exports.bind = function bind(context, fn, uid) {
  // Make sure the function has a unique ID
  if (!fn.guid) {
    fn.guid = (0, _guid.newGUID)();
  }

  // Create the new function that changes the context
  var bound = function bound() {
    return fn.apply(context, arguments);
  };

  // Allow for the ability to individualize this function
  // Needed in the case where multiple objects might share the same prototype
  // IF both items add an event listener with the same function, then you try to remove just one
  // it will remove both because they both have the same guid.
  // when using this, you need to use the bind method when you remove the listener as well.
  // currently used in text tracks
  bound.guid = uid ? uid + '_' + fn.guid : fn.guid;

  return bound;
};

/**
 * Wraps the given function, `fn`, with a new function that only invokes `fn`
 * at most once per every `wait` milliseconds.
 *
 * @param  {Function} fn
 *         The function to be throttled.
 *
 * @param  {Number}   wait
 *         The number of milliseconds by which to throttle.
 *
 * @return {Function}
 */
/**
 * @file fn.js
 * @module fn
 */
var throttle = exports.throttle = function throttle(fn, wait) {
  var last = Date.now();

  var throttled = function throttled() {
    var now = Date.now();

    if (now - last >= wait) {
      fn.apply(undefined, arguments);
      last = now;
    }
  };

  return throttled;
};

},{"85":85}],84:[function(_dereq_,module,exports){
'use strict';

exports.__esModule = true;
/**
 * @file format-time.js
 * @module Format-time
 */

/**
 * Format seconds as a time string, H:MM:SS or M:SS. Supplying a guide (in seconds)
 * will force a number of leading zeros to cover the length of the guide.
 *
 * @param {number} seconds
 *        Number of seconds to be turned into a string
 *
 * @param {number} guide
 *        Number (in seconds) to model the string after
 *
 * @return {string}
 *         Time formatted as H:MM:SS or M:SS
 */
function formatTime(seconds) {
  var guide = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : seconds;

  seconds = seconds < 0 ? 0 : seconds;
  var s = Math.floor(seconds % 60);
  var m = Math.floor(seconds / 60 % 60);
  var h = Math.floor(seconds / 3600);
  var gm = Math.floor(guide / 60 % 60);
  var gh = Math.floor(guide / 3600);

  // handle invalid times
  if (isNaN(seconds) || seconds === Infinity) {
    // '-' is false for all relational operators (e.g. <, >=) so this setting
    // will add the minimum number of fields specified by the guide
    h = m = s = '-';
  }

  // Check if we need to show hours
  h = h > 0 || gh > 0 ? h + ':' : '';

  // If hours are showing, we may need to add a leading zero.
  // Always show at least one digit of minutes.
  m = ((h || gm >= 10) && m < 10 ? '0' + m : m) + ':';

  // Check if leading zero is need for seconds
  s = s < 10 ? '0' + s : s;

  return h + m + s;
}

exports['default'] = formatTime;

},{}],85:[function(_dereq_,module,exports){
"use strict";

exports.__esModule = true;
exports.newGUID = newGUID;
/**
 * @file guid.js
 * @module guid
 */

/**
 * Unique ID for an element or function
 * @type {Number}
 */
var _guid = 1;

/**
 * Get a unique auto-incrementing ID by number that has not been returned before.
 *
 * @return {number}
 *         A new unique ID.
 */
function newGUID() {
  return _guid++;
}

},{}],86:[function(_dereq_,module,exports){
'use strict';

exports.__esModule = true;
exports.logByType = undefined;

var _window = _dereq_(95);

var _window2 = _interopRequireDefault(_window);

var _browser = _dereq_(78);

var _obj = _dereq_(88);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var log = void 0;

/**
 * Log messages to the console and history based on the type of message
 *
 * @param  {string} type
 *         The name of the console method to use.
 *
 * @param  {Array} args
 *         The arguments to be passed to the matching console method.
 *
 * @param  {boolean} [stringify]
 *         By default, only old IEs should get console argument stringification,
 *         but this is exposed as a parameter to facilitate testing.
 */
/**
 * @file log.js
 * @module log
 */
var logByType = exports.logByType = function logByType(type, args) {
  var stringify = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : !!_browser.IE_VERSION && _browser.IE_VERSION < 11;


  if (type !== 'log') {

    // add the type to the front of the message when it's not "log"
    args.unshift(type.toUpperCase() + ':');
  }

  // add to history
  log.history.push(args);

  // add console prefix after adding to history
  args.unshift('VIDEOJS:');

  // If there's no console then don't try to output messages, but they will
  // still be stored in `log.history`.
  //
  // Was setting these once outside of this function, but containing them
  // in the function makes it easier to test cases where console doesn't exist
  // when the module is executed.
  var fn = _window2['default'].console && _window2['default'].console[type];

  // Bail out if there's no console.
  if (!fn) {
    return;
  }

  // IEs previous to 11 log objects uselessly as "[object Object]"; so, JSONify
  // objects and arrays for those less-capable browsers.
  if (stringify) {
    args = args.map(function (a) {
      if ((0, _obj.isObject)(a) || Array.isArray(a)) {
        try {
          return JSON.stringify(a);
        } catch (x) {
          return String(a);
        }
      }

      // Cast to string before joining, so we get null and undefined explicitly
      // included in output (as we would in a modern console).
      return String(a);
    }).join(' ');
  }

  // Old IE versions do not allow .apply() for console methods (they are
  // reported as objects rather than functions).
  if (!fn.apply) {
    fn(args);
  } else {
    fn[Array.isArray(args) ? 'apply' : 'call'](_window2['default'].console, args);
  }
};

/**
 * Log plain debug messages
 *
 * @param {Mixed[]} args
 *        One or more messages or objects that should be logged.
 */
log = function log() {
  for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
    args[_key] = arguments[_key];
  }

  logByType('log', args);
};

/**
 * Keep a history of log messages
 *
 * @type {Array}
 */
log.history = [];

/**
 * Log error messages
 *
 * @param {Mixed[]} args
 *        One or more messages or objects that should be logged as an error
 */
log.error = function () {
  for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
    args[_key2] = arguments[_key2];
  }

  return logByType('error', args);
};

/**
 * Log warning messages
 *
 * @param {Mixed[]} args
 *        One or more messages or objects that should be logged as a warning.
 */
log.warn = function () {
  for (var _len3 = arguments.length, args = Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
    args[_key3] = arguments[_key3];
  }

  return logByType('warn', args);
};

exports['default'] = log;

},{"78":78,"88":88,"95":95}],87:[function(_dereq_,module,exports){
'use strict';

exports.__esModule = true;
exports['default'] = mergeOptions;

var _obj = _dereq_(88);

/**
 * Deep-merge one or more options objects, recursively merging **only** plain
 * object properties.
 *
 * @param   {Object[]} sources
 *          One or more objects to merge into a new object.
 *
 * @returns {Object}
 *          A new object that is the merged result of all sources.
 */
function mergeOptions() {
  var result = {};

  for (var _len = arguments.length, sources = Array(_len), _key = 0; _key < _len; _key++) {
    sources[_key] = arguments[_key];
  }

  sources.forEach(function (source) {
    if (!source) {
      return;
    }

    (0, _obj.each)(source, function (value, key) {
      if (!(0, _obj.isPlain)(value)) {
        result[key] = value;
        return;
      }

      if (!(0, _obj.isPlain)(result[key])) {
        result[key] = {};
      }

      result[key] = mergeOptions(result[key], value);
    });
  });

  return result;
} /**
   * @file merge-options.js
   * @module merge-options
   */

},{"88":88}],88:[function(_dereq_,module,exports){
'use strict';

exports.__esModule = true;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

exports.each = each;
exports.reduce = reduce;
exports.assign = assign;
exports.isObject = isObject;
exports.isPlain = isPlain;
/**
 * @file obj.js
 * @module obj
 */

/**
 * @callback obj:EachCallback
 *
 * @param {Mixed} value
 *        The current key for the object that is being iterated over.
 *
 * @param {string} key
 *        The current key-value for object that is being iterated over
 */

/**
 * @callback obj:ReduceCallback
 *
 * @param {Mixed} accum
 *        The value that is accumulating over the reduce loop.
 *
 * @param {Mixed} value
 *        The current key for the object that is being iterated over.
 *
 * @param {string} key
 *        The current key-value for object that is being iterated over
 *
 * @return {Mixed}
 *         The new accumulated value.
 */
var toString = Object.prototype.toString;

/**
 * Get the keys of an Object
 *
 * @param {Object}
 *        The Object to get the keys from
 *
 * @return {string[]}
 *         An array of the keys from the object. Returns an empty array if the
 *         object passed in was invalid or had no keys.
 *
 * @private
 */
var keys = function keys(object) {
  return isObject(object) ? Object.keys(object) : [];
};

/**
 * Array-like iteration for objects.
 *
 * @param {Object} object
 *        The object to iterate over
 *
 * @param {obj:EachCallback} fn
 *        The callback function which is called for each key in the object.
 */
function each(object, fn) {
  keys(object).forEach(function (key) {
    return fn(object[key], key);
  });
}

/**
 * Array-like reduce for objects.
 *
 * @param {Object} object
 *        The Object that you want to reduce.
 *
 * @param {Function} fn
 *         A callback function which is called for each key in the object. It
 *         receives the accumulated value and the per-iteration value and key
 *         as arguments.
 *
 * @param {Mixed} [initial = 0]
 *        Starting value
 *
 * @return {Mixed}
 *         The final accumulated value.
 */
function reduce(object, fn) {
  var initial = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;

  return keys(object).reduce(function (accum, key) {
    return fn(accum, object[key], key);
  }, initial);
}

/**
 * Object.assign-style object shallow merge/extend.
 *
 * @param  {Object} target
 * @param  {Object} ...sources
 * @return {Object}
 */
function assign(target) {
  for (var _len = arguments.length, sources = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
    sources[_key - 1] = arguments[_key];
  }

  if (Object.assign) {
    return Object.assign.apply(Object, [target].concat(sources));
  }

  sources.forEach(function (source) {
    if (!source) {
      return;
    }

    each(source, function (value, key) {
      target[key] = value;
    });
  });

  return target;
}

/**
 * Returns whether a value is an object of any kind - including DOM nodes,
 * arrays, regular expressions, etc. Not functions, though.
 *
 * This avoids the gotcha where using `typeof` on a `null` value
 * results in `'object'`.
 *
 * @param  {Object} value
 * @return {Boolean}
 */
function isObject(value) {
  return !!value && (typeof value === 'undefined' ? 'undefined' : _typeof(value)) === 'object';
}

/**
 * Returns whether an object appears to be a "plain" object - that is, a
 * direct instance of `Object`.
 *
 * @param  {Object} value
 * @return {Boolean}
 */
function isPlain(value) {
  return isObject(value) && toString.call(value) === '[object Object]' && value.constructor === Object;
}

},{}],89:[function(_dereq_,module,exports){
'use strict';

exports.__esModule = true;
exports.setTextContent = exports.createStyleElement = undefined;

var _document = _dereq_(94);

var _document2 = _interopRequireDefault(_document);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

/**
 * Create a DOM syle element given a className for it.
 *
 * @param {string} className
 *        The className to add to the created style element.
 *
 * @return {Element}
 *         The element that was created.
 */
var createStyleElement = exports.createStyleElement = function createStyleElement(className) {
  var style = _document2['default'].createElement('style');

  style.className = className;

  return style;
};

/**
 * Add text to a DOM element.
 *
 * @param {Element} el
 *        The Element to add text content to.
 *
 * @param {string} content
 *        The text to add to the element.
 */
/**
 * @file stylesheet.js
 * @module stylesheet
 */
var setTextContent = exports.setTextContent = function setTextContent(el, content) {
  if (el.styleSheet) {
    el.styleSheet.cssText = content;
  } else {
    el.textContent = content;
  }
};

},{"94":94}],90:[function(_dereq_,module,exports){
'use strict';

exports.__esModule = true;
exports.createTimeRange = undefined;
exports.createTimeRanges = createTimeRanges;

var _log = _dereq_(86);

var _log2 = _interopRequireDefault(_log);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

/**
 * Returns the time for the specified index at the start or end
 * of a TimeRange object.
 *
 * @function time-ranges:indexFunction
 *
 * @param {number} [index=0]
 *        The range number to return the time for.
 *
 * @return {number}
 *         The time that offset at the specified index.
 *
 * @depricated index must be set to a value, in the future this will throw an error.
 */

/**
 * An object that contains ranges of time for various reasons.
 *
 * @typedef {Object} TimeRange
 *
 * @property {number} length
 *           The number of time ranges represented by this Object
 *
 * @property {time-ranges:indexFunction} start
 *           Returns the time offset at which a specified time range begins.
 *
 * @property {time-ranges:indexFunction} end
 *           Returns the time offset at which a specified time range begins.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/TimeRanges
 */

/**
 * Check if any of the time ranges are over the maximum index.
 *
 * @param {string} fnName
 *        The function name to use for logging
 *
 * @param {number} index
 *        The index to check
 *
 * @param {number} maxIndex
 *        The maximum possible index
 *
 * @throws {Error} if the timeRanges provided are over the maxIndex
 */
function rangeCheck(fnName, index, maxIndex) {
  if (index < 0 || index > maxIndex) {
    throw new Error('Failed to execute \'' + fnName + '\' on \'TimeRanges\': The index provided (' + index + ') is greater than or equal to the maximum bound (' + maxIndex + ').');
  }
}

/**
 * Check if any of the time ranges are over the maximum index.
 *
 * @param {string} fnName
 *        The function name to use for logging
 *
 * @param {string} valueIndex
 *        The proprety that should be used to get the time. should be 'start' or 'end'
 *
 * @param {Array} ranges
 *        An array of time ranges
 *
 * @param {Array} [rangeIndex=0]
 *        The index to start the search at
 *
 * @return {number}
 *         The time that offset at the specified index.
 *
 *
 * @depricated rangeIndex must be set to a value, in the future this will throw an error.
 * @throws {Error} if rangeIndex is more than the length of ranges
 */
/**
 * @file time-ranges.js
 * @module time-ranges
 */
function getRange(fnName, valueIndex, ranges, rangeIndex) {
  if (rangeIndex === undefined) {
    _log2['default'].warn('DEPRECATED: Function \'' + fnName + '\' on \'TimeRanges\' called without an index argument.');
    rangeIndex = 0;
  }
  rangeCheck(fnName, rangeIndex, ranges.length - 1);
  return ranges[rangeIndex][valueIndex];
}

/**
 * Create a time range object givent ranges of time.
 *
 * @param {Array} [ranges]
 *        An array of time ranges.
 */
function createTimeRangesObj(ranges) {
  if (ranges === undefined || ranges.length === 0) {
    return {
      length: 0,
      start: function start() {
        throw new Error('This TimeRanges object is empty');
      },
      end: function end() {
        throw new Error('This TimeRanges object is empty');
      }
    };
  }
  return {
    length: ranges.length,
    start: getRange.bind(null, 'start', 0, ranges),
    end: getRange.bind(null, 'end', 1, ranges)
  };
}

/**
 * Should create a fake `TimeRange` object which mimics an HTML5 time range instance.
 *
 * @param {number|Array} start
 *        The start of a single range or an array of ranges
 *
 * @param {number} end
 *        The end of a single range.
 *
 * @private
 */
function createTimeRanges(start, end) {
  if (Array.isArray(start)) {
    return createTimeRangesObj(start);
  } else if (start === undefined || end === undefined) {
    return createTimeRangesObj();
  }
  return createTimeRangesObj([[start, end]]);
}

exports.createTimeRange = createTimeRanges;

},{"86":86}],91:[function(_dereq_,module,exports){
'use strict';

exports.__esModule = true;
/**
 * @file to-title-case.js
 * @module to-title-case
 */

/**
 * Uppercase the first letter of a string.
 *
 * @param {string} string
 *        String to be uppercased
 *
 * @return {string}
 *         The string with an uppercased first letter
 */
function toTitleCase(string) {
  if (typeof string !== 'string') {
    return string;
  }

  return string.charAt(0).toUpperCase() + string.slice(1);
}

exports['default'] = toTitleCase;

},{}],92:[function(_dereq_,module,exports){
'use strict';

exports.__esModule = true;
exports.isCrossOrigin = exports.getFileExtension = exports.getAbsoluteURL = exports.parseUrl = undefined;

var _document = _dereq_(94);

var _document2 = _interopRequireDefault(_document);

var _window = _dereq_(95);

var _window2 = _interopRequireDefault(_window);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

/**
 * @typedef {Object} url:URLObject
 *
 * @property {string} protocol
 *           The protocol of the url that was parsed.
 *
 * @property {string} hostname
 *           The hostname of the url that was parsed.
 *
 * @property {string} port
 *           The port of the url that was parsed.
 *
 * @property {string} pathname
 *           The pathname of the url that was parsed.
 *
 * @property {string} search
 *           The search query of the url that was parsed.
 *
 * @property {string} hash
 *           The hash of the url that was parsed.
 *
 * @property {string} host
 *           The host of the url that was parsed.
 */

/**
 * Resolve and parse the elements of a URL.
 *
 * @param  {String} url
 *         The url to parse
 *
 * @return {url:URLObject}
 *         An object of url details
 */
/**
 * @file url.js
 * @module url
 */
var parseUrl = exports.parseUrl = function parseUrl(url) {
  var props = ['protocol', 'hostname', 'port', 'pathname', 'search', 'hash', 'host'];

  // add the url to an anchor and let the browser parse the URL
  var a = _document2['default'].createElement('a');

  a.href = url;

  // IE8 (and 9?) Fix
  // ie8 doesn't parse the URL correctly until the anchor is actually
  // added to the body, and an innerHTML is needed to trigger the parsing
  var addToBody = a.host === '' && a.protocol !== 'file:';
  var div = void 0;

  if (addToBody) {
    div = _document2['default'].createElement('div');
    div.innerHTML = '<a href="' + url + '"></a>';
    a = div.firstChild;
    // prevent the div from affecting layout
    div.setAttribute('style', 'display:none; position:absolute;');
    _document2['default'].body.appendChild(div);
  }

  // Copy the specific URL properties to a new object
  // This is also needed for IE8 because the anchor loses its
  // properties when it's removed from the dom
  var details = {};

  for (var i = 0; i < props.length; i++) {
    details[props[i]] = a[props[i]];
  }

  // IE9 adds the port to the host property unlike everyone else. If
  // a port identifier is added for standard ports, strip it.
  if (details.protocol === 'http:') {
    details.host = details.host.replace(/:80$/, '');
  }

  if (details.protocol === 'https:') {
    details.host = details.host.replace(/:443$/, '');
  }

  if (addToBody) {
    _document2['default'].body.removeChild(div);
  }

  return details;
};

/**
 * Get absolute version of relative URL. Used to tell flash correct URL.
 *
 *
 * @param  {string} url
 *         URL to make absolute
 *
 * @return {string}
 *         Absolute URL
 *
 * @see http://stackoverflow.com/questions/470832/getting-an-absolute-url-from-a-relative-one-ie6-issue
 */
var getAbsoluteURL = exports.getAbsoluteURL = function getAbsoluteURL(url) {
  // Check if absolute URL
  if (!url.match(/^https?:\/\//)) {
    // Convert to absolute URL. Flash hosted off-site needs an absolute URL.
    var div = _document2['default'].createElement('div');

    div.innerHTML = '<a href="' + url + '">x</a>';
    url = div.firstChild.href;
  }

  return url;
};

/**
 * Returns the extension of the passed file name. It will return an empty string
 * if passed an invalid path.
 *
 * @param {string} path
 *        The fileName path like '/path/to/file.mp4'
 *
 * @returns {string}
 *          The extension in lower case or an empty string if no
 *          extension could be found.
 */
var getFileExtension = exports.getFileExtension = function getFileExtension(path) {
  if (typeof path === 'string') {
    var splitPathRe = /^(\/?)([\s\S]*?)((?:\.{1,2}|[^\/]+?)(\.([^\.\/\?]+)))(?:[\/]*|[\?].*)$/i;
    var pathParts = splitPathRe.exec(path);

    if (pathParts) {
      return pathParts.pop().toLowerCase();
    }
  }

  return '';
};

/**
 * Returns whether the url passed is a cross domain request or not.
 *
 * @param {string} url
 *        The url to check.
 *
 * @return {boolean}
 *         Whether it is a cross domain request or not.
 */
var isCrossOrigin = exports.isCrossOrigin = function isCrossOrigin(url) {
  var winLoc = _window2['default'].location;
  var urlInfo = parseUrl(url);

  // IE8 protocol relative urls will return ':' for protocol
  var srcProtocol = urlInfo.protocol === ':' ? winLoc.protocol : urlInfo.protocol;

  // Check if url is for another domain/origin
  // IE8 doesn't know location.origin, so we won't rely on it here
  var crossOrigin = srcProtocol + urlInfo.host !== winLoc.protocol + winLoc.host;

  return crossOrigin;
};

},{"94":94,"95":95}],93:[function(_dereq_,module,exports){
'use strict';

exports.__esModule = true;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; /**
                                                                                                                                                                                                                                                                               * @file video.js
                                                                                                                                                                                                                                                                               * @module videojs
                                                                                                                                                                                                                                                                               */

/* global define */

// Include the built-in techs


var _window = _dereq_(95);

var _window2 = _interopRequireDefault(_window);

var _document = _dereq_(94);

var _document2 = _interopRequireDefault(_document);

var _browser = _dereq_(78);

var browser = _interopRequireWildcard(_browser);

var _dom = _dereq_(81);

var Dom = _interopRequireWildcard(_dom);

var _setup = _dereq_(56);

var setup = _interopRequireWildcard(_setup);

var _stylesheet = _dereq_(89);

var stylesheet = _interopRequireWildcard(_stylesheet);

var _component = _dereq_(5);

var _component2 = _interopRequireDefault(_component);

var _eventTarget = _dereq_(42);

var _eventTarget2 = _interopRequireDefault(_eventTarget);

var _events = _dereq_(82);

var Events = _interopRequireWildcard(_events);

var _player = _dereq_(51);

var _player2 = _interopRequireDefault(_player);

var _plugins = _dereq_(52);

var _plugins2 = _interopRequireDefault(_plugins);

var _mergeOptions2 = _dereq_(87);

var _mergeOptions3 = _interopRequireDefault(_mergeOptions2);

var _fn = _dereq_(83);

var Fn = _interopRequireWildcard(_fn);

var _textTrack = _dereq_(72);

var _textTrack2 = _interopRequireDefault(_textTrack);

var _audioTrack = _dereq_(64);

var _audioTrack2 = _interopRequireDefault(_audioTrack);

var _videoTrack = _dereq_(77);

var _videoTrack2 = _interopRequireDefault(_videoTrack);

var _timeRanges = _dereq_(90);

var _formatTime = _dereq_(84);

var _formatTime2 = _interopRequireDefault(_formatTime);

var _log = _dereq_(86);

var _log2 = _interopRequireDefault(_log);

var _url = _dereq_(92);

var Url = _interopRequireWildcard(_url);

var _obj = _dereq_(88);

var _computedStyle = _dereq_(80);

var _computedStyle2 = _interopRequireDefault(_computedStyle);

var _extend = _dereq_(43);

var _extend2 = _interopRequireDefault(_extend);

var _xhr = _dereq_(104);

var _xhr2 = _interopRequireDefault(_xhr);

var _tech = _dereq_(62);

var _tech2 = _interopRequireDefault(_tech);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

// HTML5 Element Shim for IE8
if (typeof HTMLVideoElement === 'undefined' && Dom.isReal()) {
  _document2['default'].createElement('video');
  _document2['default'].createElement('audio');
  _document2['default'].createElement('track');
}

/**
 * Doubles as the main function for users to create a player instance and also
 * the main library object.
 * The `videojs` function can be used to initialize or retrieve a player.
  *
 * @param {string|Element} id
 *        Video element or video element ID
 *
 * @param {Object} [options]
 *        Optional options object for config/settings
 *
 * @param {Component~ReadyCallback} [ready]
 *        Optional ready callback
 *
 * @return {Player}
 *         A player instance
 *
 * @mixes videojs
 */
function videojs(id, options, ready) {
  var tag = void 0;

  // Allow for element or ID to be passed in
  // String ID
  if (typeof id === 'string') {

    // Adjust for jQuery ID syntax
    if (id.indexOf('#') === 0) {
      id = id.slice(1);
    }

    // If a player instance has already been created for this ID return it.
    if (videojs.getPlayers()[id]) {

      // If options or ready funtion are passed, warn
      if (options) {
        _log2['default'].warn('Player "' + id + '" is already initialised. Options will not be applied.');
      }

      if (ready) {
        videojs.getPlayers()[id].ready(ready);
      }

      return videojs.getPlayers()[id];
    }

    // Otherwise get element for ID
    tag = Dom.getEl(id);

    // ID is a media element
  } else {
    tag = id;
  }

  // Check for a useable element
  // re: nodeName, could be a box div also
  if (!tag || !tag.nodeName) {
    throw new TypeError('The element or ID supplied is not valid. (videojs)');
  }

  // Element may have a player attr referring to an already created player instance.
  // If so return that otherwise set up a new player below
  if (tag.player || _player2['default'].players[tag.playerId]) {
    return tag.player || _player2['default'].players[tag.playerId];
  }

  options = options || {};

  videojs.hooks('beforesetup').forEach(function (hookFunction) {
    var opts = hookFunction(tag, (0, _mergeOptions3['default'])(options));

    if (!(0, _obj.isObject)(opts) || Array.isArray(opts)) {
      _log2['default'].error('please return an object in beforesetup hooks');
      return;
    }

    options = (0, _mergeOptions3['default'])(options, opts);
  });

  var PlayerComponent = _component2['default'].getComponent('Player');
  // If not, set up a new player
  var player = new PlayerComponent(tag, options, ready);

  videojs.hooks('setup').forEach(function (hookFunction) {
    return hookFunction(player);
  });

  return player;
}

/**
 * An Object that contains lifecycle hooks as keys which point to an array
 * of functions that are run when a lifecycle is triggered
 */
videojs.hooks_ = {};

/**
 * Get a list of hooks for a specific lifecycle
 *
 * @param {string} type
 *        the lifecyle to get hooks from
 *
 * @param {Function} [fn]
 *        Optionally add a hook to the lifecycle that your are getting.
 *
 * @return {Array}
 *         an array of hooks, or an empty array if there are none.
 */
videojs.hooks = function (type, fn) {
  videojs.hooks_[type] = videojs.hooks_[type] || [];
  if (fn) {
    videojs.hooks_[type] = videojs.hooks_[type].concat(fn);
  }
  return videojs.hooks_[type];
};

/**
 * Add a function hook to a specific videojs lifecycle.
 *
 * @param {string} type
 *        the lifecycle to hook the function to.
 *
 * @param {Function|Function[]}
 *        The function or array of functions to attach.
 */
videojs.hook = function (type, fn) {
  videojs.hooks(type, fn);
};

/**
 * Remove a hook from a specific videojs lifecycle.
 *
 * @param {string} type
 *        the lifecycle that the function hooked to
 *
 * @param {Function} fn
 *        The hooked function to remove
 *
 * @return {boolean}
 *         The function that was removed or undef
 */
videojs.removeHook = function (type, fn) {
  var index = videojs.hooks(type).indexOf(fn);

  if (index <= -1) {
    return false;
  }

  videojs.hooks_[type] = videojs.hooks_[type].slice();
  videojs.hooks_[type].splice(index, 1);

  return true;
};

// Add default styles
if (_window2['default'].VIDEOJS_NO_DYNAMIC_STYLE !== true && Dom.isReal()) {
  var style = Dom.$('.vjs-styles-defaults');

  if (!style) {
    style = stylesheet.createStyleElement('vjs-styles-defaults');
    var head = Dom.$('head');

    if (head) {
      head.insertBefore(style, head.firstChild);
    }
    stylesheet.setTextContent(style, '\n      .video-js {\n        width: 300px;\n        height: 150px;\n      }\n\n      .vjs-fluid {\n        padding-top: 56.25%\n      }\n    ');
  }
}

// Run Auto-load players
// You have to wait at least once in case this script is loaded after your
// video in the DOM (weird behavior only with minified version)
setup.autoSetupTimeout(1, videojs);

/**
 * Current software version. Follows semver.
 *
 * @type {string}
 */
videojs.VERSION = '5.20.2';

/**
 * The global options object. These are the settings that take effect
 * if no overrides are specified when the player is created.
 *
 * @type {Object}
 */
videojs.options = _player2['default'].prototype.options_;

/**
 * Get an object with the currently created players, keyed by player ID
 *
 * @return {Object}
 *         The created players
 */
videojs.getPlayers = function () {
  return _player2['default'].players;
};

/**
 * Expose players object.
 *
 * @memberOf videojs
 * @property {Object} players
 */
videojs.players = _player2['default'].players;

/**
 * Get a component class object by name
 *
 * @borrows Component.getComponent as videojs.getComponent
 */
videojs.getComponent = _component2['default'].getComponent;

/**
 * Register a component so it can referred to by name. Used when adding to other
 * components, either through addChild `component.addChild('myComponent')` or through
 * default children options  `{ children: ['myComponent'] }`.
 *
 * > NOTE: You could also just initialize the component before adding.
 * `component.addChild(new MyComponent());`
 *
 * @param {string} name
 *        The class name of the component
 *
 * @param {Component} comp
 *        The component class
 *
 * @return {Component}
 *         The newly registered component
 */
videojs.registerComponent = function (name, comp) {
  if (_tech2['default'].isTech(comp)) {
    _log2['default'].warn('The ' + name + ' tech was registered as a component. It should instead be registered using videojs.registerTech(name, tech)');
  }

  _component2['default'].registerComponent.call(_component2['default'], name, comp);
};

/**
 * Get a Tech class object by name
 *
 * @borrows Tech.getTech as videojs.getTech
 */
videojs.getTech = _tech2['default'].getTech;

/**
 * Register a Tech so it can referred to by name.
 * This is used in the tech order for the player.
 *
 * @borrows Tech.registerTech as videojs.registerTech
 */
videojs.registerTech = _tech2['default'].registerTech;

/**
 * A suite of browser and device tests from {@link browser}.
 *
 * @type {Object}
 * @private
 */
videojs.browser = browser;

/**
 * Whether or not the browser supports touch events. Included for backward
 * compatibility with 4.x, but deprecated. Use `videojs.browser.TOUCH_ENABLED`
 * instead going forward.
 *
 * @deprecated since version 5.0
 * @type {boolean}
 */
videojs.TOUCH_ENABLED = browser.TOUCH_ENABLED;

/**
 * Subclass an existing class
 * Mimics ES6 subclassing with the `extend` keyword
 *
 * @borrows extend:extendFn as videojs.extend
 */
videojs.extend = _extend2['default'];

/**
 * Merge two options objects recursively
 * Performs a deep merge like lodash.merge but **only merges plain objects**
 * (not arrays, elements, anything else)
 * Other values will be copied directly from the second object.
 *
 * @borrows merge-options:mergeOptions as videojs.mergeOptions
 */
videojs.mergeOptions = _mergeOptions3['default'];

/**
 * Change the context (this) of a function
 *
 * > NOTE: as of v5.0 we require an ES5 shim, so you should use the native
 * `function() {}.bind(newContext);` instead of this.
 *
 * @borrows fn:bind as videojs.bind
 */
videojs.bind = Fn.bind;

/**
 * Create a Video.js player plugin.
 * Plugins are only initialized when options for the plugin are included
 * in the player options, or the plugin function on the player instance is
 * called.
 *
 * @borrows plugin:plugin as videojs.plugin
 */
videojs.plugin = _plugins2['default'];

/**
 * Adding languages so that they're available to all players.
 * Example: `videojs.addLanguage('es', { 'Hello': 'Hola' });`
 *
 * @param {string} code
 *        The language code or dictionary property
 *
 * @param {Object} data
 *        The data values to be translated
 *
 * @return {Object}
 *         The resulting language dictionary object
 */
videojs.addLanguage = function (code, data) {
  var _mergeOptions;

  code = ('' + code).toLowerCase();

  videojs.options.languages = (0, _mergeOptions3['default'])(videojs.options.languages, (_mergeOptions = {}, _mergeOptions[code] = data, _mergeOptions));

  return videojs.options.languages[code];
};

/**
 * Log messages
 *
 * @borrows log:log as videojs.log
 */
videojs.log = _log2['default'];

/**
 * Creates an emulated TimeRange object.
 *
 * @borrows time-ranges:createTimeRanges as videojs.createTimeRange
 */
/**
 * @borrows time-ranges:createTimeRanges as videojs.createTimeRanges
 */
videojs.createTimeRange = videojs.createTimeRanges = _timeRanges.createTimeRanges;

/**
 * Format seconds as a time string, H:MM:SS or M:SS
 * Supplying a guide (in seconds) will force a number of leading zeros
 * to cover the length of the guide
 *
 * @borrows format-time:formatTime as videojs.formatTime
 */
videojs.formatTime = _formatTime2['default'];

/**
 * Resolve and parse the elements of a URL
 *
 * @borrows url:parseUrl as videojs.parseUrl
 */
videojs.parseUrl = Url.parseUrl;

/**
 * Returns whether the url passed is a cross domain request or not.
 *
 * @borrows url:isCrossOrigin as videojs.isCrossOrigin
 */
videojs.isCrossOrigin = Url.isCrossOrigin;

/**
 * Event target class.
 *
 * @borrows EventTarget as videojs.EventTarget
 */
videojs.EventTarget = _eventTarget2['default'];

/**
 * Add an event listener to element
 * It stores the handler function in a separate cache object
 * and adds a generic handler to the element's event,
 * along with a unique id (guid) to the element.
 *
 * @borrows events:on as videojs.on
 */
videojs.on = Events.on;

/**
 * Trigger a listener only once for an event
 *
 * @borrows events:one as videojs.one
 */
videojs.one = Events.one;

/**
 * Removes event listeners from an element
 *
 * @borrows events:off as videojs.off
 */
videojs.off = Events.off;

/**
 * Trigger an event for an element
 *
 * @borrows events:trigger as videojs.trigger
 */
videojs.trigger = Events.trigger;

/**
 * A cross-browser XMLHttpRequest wrapper. Here's a simple example:
 *
 * @param {Object} options
 *        settings for the request.
 *
 * @return {XMLHttpRequest|XDomainRequest}
 *         The request object.
 *
 * @see https://github.com/Raynos/xhr
 */
videojs.xhr = _xhr2['default'];

/**
 * TextTrack class
 *
 * @borrows TextTrack as videojs.TextTrack
 */
videojs.TextTrack = _textTrack2['default'];

/**
 * export the AudioTrack class so that source handlers can create
 * AudioTracks and then add them to the players AudioTrackList
 *
 * @borrows AudioTrack as videojs.AudioTrack
 */
videojs.AudioTrack = _audioTrack2['default'];

/**
 * export the VideoTrack class so that source handlers can create
 * VideoTracks and then add them to the players VideoTrackList
 *
 * @borrows VideoTrack as videojs.VideoTrack
 */
videojs.VideoTrack = _videoTrack2['default'];

/**
 * Determines, via duck typing, whether or not a value is a DOM element.
 *
 * @borrows dom:isEl as videojs.isEl
 */
videojs.isEl = Dom.isEl;

/**
 * Determines, via duck typing, whether or not a value is a text node.
 *
 * @borrows dom:isTextNode as videojs.isTextNode
 */
videojs.isTextNode = Dom.isTextNode;

/**
 * Creates an element and applies properties.
 *
 * @borrows dom:createEl as videojs.createEl
 */
videojs.createEl = Dom.createEl;

/**
 * Check if an element has a CSS class
 *
 * @borrows dom:hasElClass as videojs.hasClass
 */
videojs.hasClass = Dom.hasElClass;

/**
 * Add a CSS class name to an element
 *
 * @borrows dom:addElClass as videojs.addClass
 */
videojs.addClass = Dom.addElClass;

/**
 * Remove a CSS class name from an element
 *
 * @borrows dom:removeElClass as videojs.removeClass
 */
videojs.removeClass = Dom.removeElClass;

/**
 * Adds or removes a CSS class name on an element depending on an optional
 * condition or the presence/absence of the class name.
 *
 * @borrows dom:toggleElClass as videojs.toggleClass
 */
videojs.toggleClass = Dom.toggleElClass;

/**
 * Apply attributes to an HTML element.
 *
 * @borrows dom:setElAttributes as videojs.setAttribute
 */
videojs.setAttributes = Dom.setElAttributes;

/**
 * Get an element's attribute values, as defined on the HTML tag
 * Attributes are not the same as properties. They're defined on the tag
 * or with setAttribute (which shouldn't be used with HTML)
 * This will return true or false for boolean attributes.
 *
 * @borrows dom:getElAttributes as videojs.getAttributes
 */
videojs.getAttributes = Dom.getElAttributes;

/**
 * Empties the contents of an element.
 *
 * @borrows dom:emptyEl as videojs.emptyEl
 */
videojs.emptyEl = Dom.emptyEl;

/**
 * Normalizes and appends content to an element.
 *
 * The content for an element can be passed in multiple types and
 * combinations, whose behavior is as follows:
 *
 * - String
 *   Normalized into a text node.
 *
 * - Element, TextNode
 *   Passed through.
 *
 * - Array
 *   A one-dimensional array of strings, elements, nodes, or functions (which
 *   return single strings, elements, or nodes).
 *
 * - Function
 *   If the sole argument, is expected to produce a string, element,
 *   node, or array.
 *
 * @borrows dom:appendContents as videojs.appendContet
 */
videojs.appendContent = Dom.appendContent;

/**
 * Normalizes and inserts content into an element; this is identical to
 * `appendContent()`, except it empties the element first.
 *
 * The content for an element can be passed in multiple types and
 * combinations, whose behavior is as follows:
 *
 * - String
 *   Normalized into a text node.
 *
 * - Element, TextNode
 *   Passed through.
 *
 * - Array
 *   A one-dimensional array of strings, elements, nodes, or functions (which
 *   return single strings, elements, or nodes).
 *
 * - Function
 *   If the sole argument, is expected to produce a string, element,
 *   node, or array.
 *
 * @borrows dom:insertContent as videojs.insertContent
 */
videojs.insertContent = Dom.insertContent;

/**
 * A safe getComputedStyle with an IE8 fallback.
 *
 * This is because in Firefox, if the player is loaded in an iframe with `display:none`,
 * then `getComputedStyle` returns `null`, so, we do a null-check to make sure
 * that the player doesn't break in these cases.
 * See https://bugzilla.mozilla.org/show_bug.cgi?id=548397 for more details.
 *
 * @borrows computed-style:computedStyle as videojs.computedStyle
 */
videojs.computedStyle = _computedStyle2['default'];

/*
 * Custom Universal Module Definition (UMD)
 *
 * Video.js will never be a non-browser lib so we can simplify UMD a bunch and
 * still support requirejs and browserify. This also needs to be closure
 * compiler compatible, so string keys are used.
 */
if (typeof define === 'function' && define.amd) {
  define('videojs', [], function () {
    return videojs;
  });

  // checking that module is an object too because of umdjs/umd#35
} else if ((typeof exports === 'undefined' ? 'undefined' : _typeof(exports)) === 'object' && (typeof module === 'undefined' ? 'undefined' : _typeof(module)) === 'object') {
  module.exports = videojs;
}

exports['default'] = videojs;

},{"104":104,"42":42,"43":43,"5":5,"51":51,"52":52,"56":56,"62":62,"64":64,"72":72,"77":77,"78":78,"80":80,"81":81,"82":82,"83":83,"84":84,"86":86,"87":87,"88":88,"89":89,"90":90,"92":92,"94":94,"95":95}],94:[function(_dereq_,module,exports){
(function (global){
var topLevel = typeof global !== 'undefined' ? global :
    typeof window !== 'undefined' ? window : {}
var minDoc = _dereq_(96);

if (typeof document !== 'undefined') {
    module.exports = document;
} else {
    var doccy = topLevel['__GLOBAL_DOCUMENT_CACHE@4'];

    if (!doccy) {
        doccy = topLevel['__GLOBAL_DOCUMENT_CACHE@4'] = minDoc;
    }

    module.exports = doccy;
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"96":96}],95:[function(_dereq_,module,exports){
(function (global){
if (typeof window !== "undefined") {
    module.exports = window;
} else if (typeof global !== "undefined") {
    module.exports = global;
} else if (typeof self !== "undefined"){
    module.exports = self;
} else {
    module.exports = {};
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],96:[function(_dereq_,module,exports){

},{}],97:[function(_dereq_,module,exports){
module.exports = SafeParseTuple

function SafeParseTuple(obj, reviver) {
    var json
    var error = null

    try {
        json = JSON.parse(obj, reviver)
    } catch (err) {
        error = err
    }

    return [error, json]
}

},{}],98:[function(_dereq_,module,exports){
function clean (s) {
  return s.replace(/\n\r?\s*/g, '')
}


module.exports = function tsml (sa) {
  var s = ''
    , i = 0

  for (; i < arguments.length; i++)
    s += clean(sa[i]) + (arguments[i + 1] || '')

  return s
}
},{}],99:[function(_dereq_,module,exports){
/**
 * Copyright 2013 vtt.js Contributors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// Default exports for Node. Export the extended versions of VTTCue and
// VTTRegion in Node since we likely want the capability to convert back and
// forth between JSON. If we don't then it's not that big of a deal since we're
// off browser.

var window = _dereq_(103);

var vttjs = module.exports = {
  WebVTT: _dereq_(100),
  VTTCue: _dereq_(101),
  VTTRegion: _dereq_(102)
};

window.vttjs = vttjs;
window.WebVTT = vttjs.WebVTT;

var cueShim = vttjs.VTTCue;
var regionShim = vttjs.VTTRegion;
var nativeVTTCue = window.VTTCue;
var nativeVTTRegion = window.VTTRegion;

vttjs.shim = function() {
  window.VTTCue = cueShim;
  window.VTTRegion = regionShim;
};

vttjs.restore = function() {
  window.VTTCue = nativeVTTCue;
  window.VTTRegion = nativeVTTRegion;
};

if (!window.VTTCue) {
  vttjs.shim();
}

},{"100":100,"101":101,"102":102,"103":103}],100:[function(_dereq_,module,exports){
/**
 * Copyright 2013 vtt.js Contributors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/* -*- Mode: Java; tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2 -*- */
/* vim: set shiftwidth=2 tabstop=2 autoindent cindent expandtab: */
var _objCreate = Object.create || (function() {
  function F() {}
  return function(o) {
    if (arguments.length !== 1) {
      throw new Error('Object.create shim only accepts one parameter.');
    }
    F.prototype = o;
    return new F();
  };
})();

// Creates a new ParserError object from an errorData object. The errorData
// object should have default code and message properties. The default message
// property can be overriden by passing in a message parameter.
// See ParsingError.Errors below for acceptable errors.
function ParsingError(errorData, message) {
  this.name = "ParsingError";
  this.code = errorData.code;
  this.message = message || errorData.message;
}
ParsingError.prototype = _objCreate(Error.prototype);
ParsingError.prototype.constructor = ParsingError;

// ParsingError metadata for acceptable ParsingErrors.
ParsingError.Errors = {
  BadSignature: {
    code: 0,
    message: "Malformed WebVTT signature."
  },
  BadTimeStamp: {
    code: 1,
    message: "Malformed time stamp."
  }
};

// Try to parse input as a time stamp.
function parseTimeStamp(input) {

  function computeSeconds(h, m, s, f) {
    return (h | 0) * 3600 + (m | 0) * 60 + (s | 0) + (f | 0) / 1000;
  }

  var m = input.match(/^(\d+):(\d{2})(:\d{2})?\.(\d{3})/);
  if (!m) {
    return null;
  }

  if (m[3]) {
    // Timestamp takes the form of [hours]:[minutes]:[seconds].[milliseconds]
    return computeSeconds(m[1], m[2], m[3].replace(":", ""), m[4]);
  } else if (m[1] > 59) {
    // Timestamp takes the form of [hours]:[minutes].[milliseconds]
    // First position is hours as it's over 59.
    return computeSeconds(m[1], m[2], 0,  m[4]);
  } else {
    // Timestamp takes the form of [minutes]:[seconds].[milliseconds]
    return computeSeconds(0, m[1], m[2], m[4]);
  }
}

// A settings object holds key/value pairs and will ignore anything but the first
// assignment to a specific key.
function Settings() {
  this.values = _objCreate(null);
}

Settings.prototype = {
  // Only accept the first assignment to any key.
  set: function(k, v) {
    if (!this.get(k) && v !== "") {
      this.values[k] = v;
    }
  },
  // Return the value for a key, or a default value.
  // If 'defaultKey' is passed then 'dflt' is assumed to be an object with
  // a number of possible default values as properties where 'defaultKey' is
  // the key of the property that will be chosen; otherwise it's assumed to be
  // a single value.
  get: function(k, dflt, defaultKey) {
    if (defaultKey) {
      return this.has(k) ? this.values[k] : dflt[defaultKey];
    }
    return this.has(k) ? this.values[k] : dflt;
  },
  // Check whether we have a value for a key.
  has: function(k) {
    return k in this.values;
  },
  // Accept a setting if its one of the given alternatives.
  alt: function(k, v, a) {
    for (var n = 0; n < a.length; ++n) {
      if (v === a[n]) {
        this.set(k, v);
        break;
      }
    }
  },
  // Accept a setting if its a valid (signed) integer.
  integer: function(k, v) {
    if (/^-?\d+$/.test(v)) { // integer
      this.set(k, parseInt(v, 10));
    }
  },
  // Accept a setting if its a valid percentage.
  percent: function(k, v) {
    var m;
    if ((m = v.match(/^([\d]{1,3})(\.[\d]*)?%$/))) {
      v = parseFloat(v);
      if (v >= 0 && v <= 100) {
        this.set(k, v);
        return true;
      }
    }
    return false;
  }
};

// Helper function to parse input into groups separated by 'groupDelim', and
// interprete each group as a key/value pair separated by 'keyValueDelim'.
function parseOptions(input, callback, keyValueDelim, groupDelim) {
  var groups = groupDelim ? input.split(groupDelim) : [input];
  for (var i in groups) {
    if (typeof groups[i] !== "string") {
      continue;
    }
    var kv = groups[i].split(keyValueDelim);
    if (kv.length !== 2) {
      continue;
    }
    var k = kv[0];
    var v = kv[1];
    callback(k, v);
  }
}

function parseCue(input, cue, regionList) {
  // Remember the original input if we need to throw an error.
  var oInput = input;
  // 4.1 WebVTT timestamp
  function consumeTimeStamp() {
    var ts = parseTimeStamp(input);
    if (ts === null) {
      throw new ParsingError(ParsingError.Errors.BadTimeStamp,
                            "Malformed timestamp: " + oInput);
    }
    // Remove time stamp from input.
    input = input.replace(/^[^\sa-zA-Z-]+/, "");
    return ts;
  }

  // 4.4.2 WebVTT cue settings
  function consumeCueSettings(input, cue) {
    var settings = new Settings();

    parseOptions(input, function (k, v) {
      switch (k) {
      case "region":
        // Find the last region we parsed with the same region id.
        for (var i = regionList.length - 1; i >= 0; i--) {
          if (regionList[i].id === v) {
            settings.set(k, regionList[i].region);
            break;
          }
        }
        break;
      case "vertical":
        settings.alt(k, v, ["rl", "lr"]);
        break;
      case "line":
        var vals = v.split(","),
            vals0 = vals[0];
        settings.integer(k, vals0);
        settings.percent(k, vals0) ? settings.set("snapToLines", false) : null;
        settings.alt(k, vals0, ["auto"]);
        if (vals.length === 2) {
          settings.alt("lineAlign", vals[1], ["start", "middle", "end"]);
        }
        break;
      case "position":
        vals = v.split(",");
        settings.percent(k, vals[0]);
        if (vals.length === 2) {
          settings.alt("positionAlign", vals[1], ["start", "middle", "end"]);
        }
        break;
      case "size":
        settings.percent(k, v);
        break;
      case "align":
        settings.alt(k, v, ["start", "middle", "end", "left", "right"]);
        break;
      }
    }, /:/, /\s/);

    // Apply default values for any missing fields.
    cue.region = settings.get("region", null);
    cue.vertical = settings.get("vertical", "");
    cue.line = settings.get("line", "auto");
    cue.lineAlign = settings.get("lineAlign", "start");
    cue.snapToLines = settings.get("snapToLines", true);
    cue.size = settings.get("size", 100);
    cue.align = settings.get("align", "middle");
    cue.position = settings.get("position", {
      start: 0,
      left: 0,
      middle: 50,
      end: 100,
      right: 100
    }, cue.align);
    cue.positionAlign = settings.get("positionAlign", {
      start: "start",
      left: "start",
      middle: "middle",
      end: "end",
      right: "end"
    }, cue.align);
  }

  function skipWhitespace() {
    input = input.replace(/^\s+/, "");
  }

  // 4.1 WebVTT cue timings.
  skipWhitespace();
  cue.startTime = consumeTimeStamp();   // (1) collect cue start time
  skipWhitespace();
  if (input.substr(0, 3) !== "-->") {     // (3) next characters must match "-->"
    throw new ParsingError(ParsingError.Errors.BadTimeStamp,
                           "Malformed time stamp (time stamps must be separated by '-->'): " +
                           oInput);
  }
  input = input.substr(3);
  skipWhitespace();
  cue.endTime = consumeTimeStamp();     // (5) collect cue end time

  // 4.1 WebVTT cue settings list.
  skipWhitespace();
  consumeCueSettings(input, cue);
}

var ESCAPE = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&lrm;": "\u200e",
  "&rlm;": "\u200f",
  "&nbsp;": "\u00a0"
};

var TAG_NAME = {
  c: "span",
  i: "i",
  b: "b",
  u: "u",
  ruby: "ruby",
  rt: "rt",
  v: "span",
  lang: "span"
};

var TAG_ANNOTATION = {
  v: "title",
  lang: "lang"
};

var NEEDS_PARENT = {
  rt: "ruby"
};

// Parse content into a document fragment.
function parseContent(window, input) {
  function nextToken() {
    // Check for end-of-string.
    if (!input) {
      return null;
    }

    // Consume 'n' characters from the input.
    function consume(result) {
      input = input.substr(result.length);
      return result;
    }

    var m = input.match(/^([^<]*)(<[^>]+>?)?/);
    // If there is some text before the next tag, return it, otherwise return
    // the tag.
    return consume(m[1] ? m[1] : m[2]);
  }

  // Unescape a string 's'.
  function unescape1(e) {
    return ESCAPE[e];
  }
  function unescape(s) {
    while ((m = s.match(/&(amp|lt|gt|lrm|rlm|nbsp);/))) {
      s = s.replace(m[0], unescape1);
    }
    return s;
  }

  function shouldAdd(current, element) {
    return !NEEDS_PARENT[element.localName] ||
           NEEDS_PARENT[element.localName] === current.localName;
  }

  // Create an element for this tag.
  function createElement(type, annotation) {
    var tagName = TAG_NAME[type];
    if (!tagName) {
      return null;
    }
    var element = window.document.createElement(tagName);
    element.localName = tagName;
    var name = TAG_ANNOTATION[type];
    if (name && annotation) {
      element[name] = annotation.trim();
    }
    return element;
  }

  var rootDiv = window.document.createElement("div"),
      current = rootDiv,
      t,
      tagStack = [];

  while ((t = nextToken()) !== null) {
    if (t[0] === '<') {
      if (t[1] === "/") {
        // If the closing tag matches, move back up to the parent node.
        if (tagStack.length &&
            tagStack[tagStack.length - 1] === t.substr(2).replace(">", "")) {
          tagStack.pop();
          current = current.parentNode;
        }
        // Otherwise just ignore the end tag.
        continue;
      }
      var ts = parseTimeStamp(t.substr(1, t.length - 2));
      var node;
      if (ts) {
        // Timestamps are lead nodes as well.
        node = window.document.createProcessingInstruction("timestamp", ts);
        current.appendChild(node);
        continue;
      }
      var m = t.match(/^<([^.\s/0-9>]+)(\.[^\s\\>]+)?([^>\\]+)?(\\?)>?$/);
      // If we can't parse the tag, skip to the next tag.
      if (!m) {
        continue;
      }
      // Try to construct an element, and ignore the tag if we couldn't.
      node = createElement(m[1], m[3]);
      if (!node) {
        continue;
      }
      // Determine if the tag should be added based on the context of where it
      // is placed in the cuetext.
      if (!shouldAdd(current, node)) {
        continue;
      }
      // Set the class list (as a list of classes, separated by space).
      if (m[2]) {
        node.className = m[2].substr(1).replace('.', ' ');
      }
      // Append the node to the current node, and enter the scope of the new
      // node.
      tagStack.push(m[1]);
      current.appendChild(node);
      current = node;
      continue;
    }

    // Text nodes are leaf nodes.
    current.appendChild(window.document.createTextNode(unescape(t)));
  }

  return rootDiv;
}

// This is a list of all the Unicode characters that have a strong
// right-to-left category. What this means is that these characters are
// written right-to-left for sure. It was generated by pulling all the strong
// right-to-left characters out of the Unicode data table. That table can
// found at: http://www.unicode.org/Public/UNIDATA/UnicodeData.txt
var strongRTLRanges = [[0x5be, 0x5be], [0x5c0, 0x5c0], [0x5c3, 0x5c3], [0x5c6, 0x5c6],
 [0x5d0, 0x5ea], [0x5f0, 0x5f4], [0x608, 0x608], [0x60b, 0x60b], [0x60d, 0x60d],
 [0x61b, 0x61b], [0x61e, 0x64a], [0x66d, 0x66f], [0x671, 0x6d5], [0x6e5, 0x6e6],
 [0x6ee, 0x6ef], [0x6fa, 0x70d], [0x70f, 0x710], [0x712, 0x72f], [0x74d, 0x7a5],
 [0x7b1, 0x7b1], [0x7c0, 0x7ea], [0x7f4, 0x7f5], [0x7fa, 0x7fa], [0x800, 0x815],
 [0x81a, 0x81a], [0x824, 0x824], [0x828, 0x828], [0x830, 0x83e], [0x840, 0x858],
 [0x85e, 0x85e], [0x8a0, 0x8a0], [0x8a2, 0x8ac], [0x200f, 0x200f],
 [0xfb1d, 0xfb1d], [0xfb1f, 0xfb28], [0xfb2a, 0xfb36], [0xfb38, 0xfb3c],
 [0xfb3e, 0xfb3e], [0xfb40, 0xfb41], [0xfb43, 0xfb44], [0xfb46, 0xfbc1],
 [0xfbd3, 0xfd3d], [0xfd50, 0xfd8f], [0xfd92, 0xfdc7], [0xfdf0, 0xfdfc],
 [0xfe70, 0xfe74], [0xfe76, 0xfefc], [0x10800, 0x10805], [0x10808, 0x10808],
 [0x1080a, 0x10835], [0x10837, 0x10838], [0x1083c, 0x1083c], [0x1083f, 0x10855],
 [0x10857, 0x1085f], [0x10900, 0x1091b], [0x10920, 0x10939], [0x1093f, 0x1093f],
 [0x10980, 0x109b7], [0x109be, 0x109bf], [0x10a00, 0x10a00], [0x10a10, 0x10a13],
 [0x10a15, 0x10a17], [0x10a19, 0x10a33], [0x10a40, 0x10a47], [0x10a50, 0x10a58],
 [0x10a60, 0x10a7f], [0x10b00, 0x10b35], [0x10b40, 0x10b55], [0x10b58, 0x10b72],
 [0x10b78, 0x10b7f], [0x10c00, 0x10c48], [0x1ee00, 0x1ee03], [0x1ee05, 0x1ee1f],
 [0x1ee21, 0x1ee22], [0x1ee24, 0x1ee24], [0x1ee27, 0x1ee27], [0x1ee29, 0x1ee32],
 [0x1ee34, 0x1ee37], [0x1ee39, 0x1ee39], [0x1ee3b, 0x1ee3b], [0x1ee42, 0x1ee42],
 [0x1ee47, 0x1ee47], [0x1ee49, 0x1ee49], [0x1ee4b, 0x1ee4b], [0x1ee4d, 0x1ee4f],
 [0x1ee51, 0x1ee52], [0x1ee54, 0x1ee54], [0x1ee57, 0x1ee57], [0x1ee59, 0x1ee59],
 [0x1ee5b, 0x1ee5b], [0x1ee5d, 0x1ee5d], [0x1ee5f, 0x1ee5f], [0x1ee61, 0x1ee62],
 [0x1ee64, 0x1ee64], [0x1ee67, 0x1ee6a], [0x1ee6c, 0x1ee72], [0x1ee74, 0x1ee77],
 [0x1ee79, 0x1ee7c], [0x1ee7e, 0x1ee7e], [0x1ee80, 0x1ee89], [0x1ee8b, 0x1ee9b],
 [0x1eea1, 0x1eea3], [0x1eea5, 0x1eea9], [0x1eeab, 0x1eebb], [0x10fffd, 0x10fffd]];

function isStrongRTLChar(charCode) {
  for (var i = 0; i < strongRTLRanges.length; i++) {
    var currentRange = strongRTLRanges[i];
    if (charCode >= currentRange[0] && charCode <= currentRange[1]) {
      return true;
    }
  }

  return false;
}

function determineBidi(cueDiv) {
  var nodeStack = [],
      text = "",
      charCode;

  if (!cueDiv || !cueDiv.childNodes) {
    return "ltr";
  }

  function pushNodes(nodeStack, node) {
    for (var i = node.childNodes.length - 1; i >= 0; i--) {
      nodeStack.push(node.childNodes[i]);
    }
  }

  function nextTextNode(nodeStack) {
    if (!nodeStack || !nodeStack.length) {
      return null;
    }

    var node = nodeStack.pop(),
        text = node.textContent || node.innerText;
    if (text) {
      // TODO: This should match all unicode type B characters (paragraph
      // separator characters). See issue #115.
      var m = text.match(/^.*(\n|\r)/);
      if (m) {
        nodeStack.length = 0;
        return m[0];
      }
      return text;
    }
    if (node.tagName === "ruby") {
      return nextTextNode(nodeStack);
    }
    if (node.childNodes) {
      pushNodes(nodeStack, node);
      return nextTextNode(nodeStack);
    }
  }

  pushNodes(nodeStack, cueDiv);
  while ((text = nextTextNode(nodeStack))) {
    for (var i = 0; i < text.length; i++) {
      charCode = text.charCodeAt(i);
      if (isStrongRTLChar(charCode)) {
        return "rtl";
      }
    }
  }
  return "ltr";
}

function computeLinePos(cue) {
  if (typeof cue.line === "number" &&
      (cue.snapToLines || (cue.line >= 0 && cue.line <= 100))) {
    return cue.line;
  }
  if (!cue.track || !cue.track.textTrackList ||
      !cue.track.textTrackList.mediaElement) {
    return -1;
  }
  var track = cue.track,
      trackList = track.textTrackList,
      count = 0;
  for (var i = 0; i < trackList.length && trackList[i] !== track; i++) {
    if (trackList[i].mode === "showing") {
      count++;
    }
  }
  return ++count * -1;
}

function StyleBox() {
}

// Apply styles to a div. If there is no div passed then it defaults to the
// div on 'this'.
StyleBox.prototype.applyStyles = function(styles, div) {
  div = div || this.div;
  for (var prop in styles) {
    if (styles.hasOwnProperty(prop)) {
      div.style[prop] = styles[prop];
    }
  }
};

StyleBox.prototype.formatStyle = function(val, unit) {
  return val === 0 ? 0 : val + unit;
};

// Constructs the computed display state of the cue (a div). Places the div
// into the overlay which should be a block level element (usually a div).
function CueStyleBox(window, cue, styleOptions) {
  var isIE8 = (/MSIE\s8\.0/).test(navigator.userAgent);
  var color = "rgba(255, 255, 255, 1)";
  var backgroundColor = "rgba(0, 0, 0, 0.8)";

  if (isIE8) {
    color = "rgb(255, 255, 255)";
    backgroundColor = "rgb(0, 0, 0)";
  }

  StyleBox.call(this);
  this.cue = cue;

  // Parse our cue's text into a DOM tree rooted at 'cueDiv'. This div will
  // have inline positioning and will function as the cue background box.
  this.cueDiv = parseContent(window, cue.text);
  var styles = {
    color: color,
    backgroundColor: backgroundColor,
    position: "relative",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    display: "inline"
  };

  if (!isIE8) {
    styles.writingMode = cue.vertical === "" ? "horizontal-tb"
                                             : cue.vertical === "lr" ? "vertical-lr"
                                                                     : "vertical-rl";
    styles.unicodeBidi = "plaintext";
  }
  this.applyStyles(styles, this.cueDiv);

  // Create an absolutely positioned div that will be used to position the cue
  // div. Note, all WebVTT cue-setting alignments are equivalent to the CSS
  // mirrors of them except "middle" which is "center" in CSS.
  this.div = window.document.createElement("div");
  styles = {
    textAlign: cue.align === "middle" ? "center" : cue.align,
    font: styleOptions.font,
    whiteSpace: "pre-line",
    position: "absolute"
  };

  if (!isIE8) {
    styles.direction = determineBidi(this.cueDiv);
    styles.writingMode = cue.vertical === "" ? "horizontal-tb"
                                             : cue.vertical === "lr" ? "vertical-lr"
                                                                     : "vertical-rl".
    stylesunicodeBidi =  "plaintext";
  }

  this.applyStyles(styles);

  this.div.appendChild(this.cueDiv);

  // Calculate the distance from the reference edge of the viewport to the text
  // position of the cue box. The reference edge will be resolved later when
  // the box orientation styles are applied.
  var textPos = 0;
  switch (cue.positionAlign) {
  case "start":
    textPos = cue.position;
    break;
  case "middle":
    textPos = cue.position - (cue.size / 2);
    break;
  case "end":
    textPos = cue.position - cue.size;
    break;
  }

  // Horizontal box orientation; textPos is the distance from the left edge of the
  // area to the left edge of the box and cue.size is the distance extending to
  // the right from there.
  if (cue.vertical === "") {
    this.applyStyles({
      left:  this.formatStyle(textPos, "%"),
      width: this.formatStyle(cue.size, "%")
    });
  // Vertical box orientation; textPos is the distance from the top edge of the
  // area to the top edge of the box and cue.size is the height extending
  // downwards from there.
  } else {
    this.applyStyles({
      top: this.formatStyle(textPos, "%"),
      height: this.formatStyle(cue.size, "%")
    });
  }

  this.move = function(box) {
    this.applyStyles({
      top: this.formatStyle(box.top, "px"),
      bottom: this.formatStyle(box.bottom, "px"),
      left: this.formatStyle(box.left, "px"),
      right: this.formatStyle(box.right, "px"),
      height: this.formatStyle(box.height, "px"),
      width: this.formatStyle(box.width, "px")
    });
  };
}
CueStyleBox.prototype = _objCreate(StyleBox.prototype);
CueStyleBox.prototype.constructor = CueStyleBox;

// Represents the co-ordinates of an Element in a way that we can easily
// compute things with such as if it overlaps or intersects with another Element.
// Can initialize it with either a StyleBox or another BoxPosition.
function BoxPosition(obj) {
  var isIE8 = (/MSIE\s8\.0/).test(navigator.userAgent);

  // Either a BoxPosition was passed in and we need to copy it, or a StyleBox
  // was passed in and we need to copy the results of 'getBoundingClientRect'
  // as the object returned is readonly. All co-ordinate values are in reference
  // to the viewport origin (top left).
  var lh, height, width, top;
  if (obj.div) {
    height = obj.div.offsetHeight;
    width = obj.div.offsetWidth;
    top = obj.div.offsetTop;

    var rects = (rects = obj.div.childNodes) && (rects = rects[0]) &&
                rects.getClientRects && rects.getClientRects();
    obj = obj.div.getBoundingClientRect();
    // In certain cases the outter div will be slightly larger then the sum of
    // the inner div's lines. This could be due to bold text, etc, on some platforms.
    // In this case we should get the average line height and use that. This will
    // result in the desired behaviour.
    lh = rects ? Math.max((rects[0] && rects[0].height) || 0, obj.height / rects.length)
               : 0;

  }
  this.left = obj.left;
  this.right = obj.right;
  this.top = obj.top || top;
  this.height = obj.height || height;
  this.bottom = obj.bottom || (top + (obj.height || height));
  this.width = obj.width || width;
  this.lineHeight = lh !== undefined ? lh : obj.lineHeight;

  if (isIE8 && !this.lineHeight) {
    this.lineHeight = 13;
  }
}

// Move the box along a particular axis. Optionally pass in an amount to move
// the box. If no amount is passed then the default is the line height of the
// box.
BoxPosition.prototype.move = function(axis, toMove) {
  toMove = toMove !== undefined ? toMove : this.lineHeight;
  switch (axis) {
  case "+x":
    this.left += toMove;
    this.right += toMove;
    break;
  case "-x":
    this.left -= toMove;
    this.right -= toMove;
    break;
  case "+y":
    this.top += toMove;
    this.bottom += toMove;
    break;
  case "-y":
    this.top -= toMove;
    this.bottom -= toMove;
    break;
  }
};

// Check if this box overlaps another box, b2.
BoxPosition.prototype.overlaps = function(b2) {
  return this.left < b2.right &&
         this.right > b2.left &&
         this.top < b2.bottom &&
         this.bottom > b2.top;
};

// Check if this box overlaps any other boxes in boxes.
BoxPosition.prototype.overlapsAny = function(boxes) {
  for (var i = 0; i < boxes.length; i++) {
    if (this.overlaps(boxes[i])) {
      return true;
    }
  }
  return false;
};

// Check if this box is within another box.
BoxPosition.prototype.within = function(container) {
  return this.top >= container.top &&
         this.bottom <= container.bottom &&
         this.left >= container.left &&
         this.right <= container.right;
};

// Check if this box is entirely within the container or it is overlapping
// on the edge opposite of the axis direction passed. For example, if "+x" is
// passed and the box is overlapping on the left edge of the container, then
// return true.
BoxPosition.prototype.overlapsOppositeAxis = function(container, axis) {
  switch (axis) {
  case "+x":
    return this.left < container.left;
  case "-x":
    return this.right > container.right;
  case "+y":
    return this.top < container.top;
  case "-y":
    return this.bottom > container.bottom;
  }
};

// Find the percentage of the area that this box is overlapping with another
// box.
BoxPosition.prototype.intersectPercentage = function(b2) {
  var x = Math.max(0, Math.min(this.right, b2.right) - Math.max(this.left, b2.left)),
      y = Math.max(0, Math.min(this.bottom, b2.bottom) - Math.max(this.top, b2.top)),
      intersectArea = x * y;
  return intersectArea / (this.height * this.width);
};

// Convert the positions from this box to CSS compatible positions using
// the reference container's positions. This has to be done because this
// box's positions are in reference to the viewport origin, whereas, CSS
// values are in referecne to their respective edges.
BoxPosition.prototype.toCSSCompatValues = function(reference) {
  return {
    top: this.top - reference.top,
    bottom: reference.bottom - this.bottom,
    left: this.left - reference.left,
    right: reference.right - this.right,
    height: this.height,
    width: this.width
  };
};

// Get an object that represents the box's position without anything extra.
// Can pass a StyleBox, HTMLElement, or another BoxPositon.
BoxPosition.getSimpleBoxPosition = function(obj) {
  var height = obj.div ? obj.div.offsetHeight : obj.tagName ? obj.offsetHeight : 0;
  var width = obj.div ? obj.div.offsetWidth : obj.tagName ? obj.offsetWidth : 0;
  var top = obj.div ? obj.div.offsetTop : obj.tagName ? obj.offsetTop : 0;

  obj = obj.div ? obj.div.getBoundingClientRect() :
                obj.tagName ? obj.getBoundingClientRect() : obj;
  var ret = {
    left: obj.left,
    right: obj.right,
    top: obj.top || top,
    height: obj.height || height,
    bottom: obj.bottom || (top + (obj.height || height)),
    width: obj.width || width
  };
  return ret;
};

// Move a StyleBox to its specified, or next best, position. The containerBox
// is the box that contains the StyleBox, such as a div. boxPositions are
// a list of other boxes that the styleBox can't overlap with.
function moveBoxToLinePosition(window, styleBox, containerBox, boxPositions) {

  // Find the best position for a cue box, b, on the video. The axis parameter
  // is a list of axis, the order of which, it will move the box along. For example:
  // Passing ["+x", "-x"] will move the box first along the x axis in the positive
  // direction. If it doesn't find a good position for it there it will then move
  // it along the x axis in the negative direction.
  function findBestPosition(b, axis) {
    var bestPosition,
        specifiedPosition = new BoxPosition(b),
        percentage = 1; // Highest possible so the first thing we get is better.

    for (var i = 0; i < axis.length; i++) {
      while (b.overlapsOppositeAxis(containerBox, axis[i]) ||
             (b.within(containerBox) && b.overlapsAny(boxPositions))) {
        b.move(axis[i]);
      }
      // We found a spot where we aren't overlapping anything. This is our
      // best position.
      if (b.within(containerBox)) {
        return b;
      }
      var p = b.intersectPercentage(containerBox);
      // If we're outside the container box less then we were on our last try
      // then remember this position as the best position.
      if (percentage > p) {
        bestPosition = new BoxPosition(b);
        percentage = p;
      }
      // Reset the box position to the specified position.
      b = new BoxPosition(specifiedPosition);
    }
    return bestPosition || specifiedPosition;
  }

  var boxPosition = new BoxPosition(styleBox),
      cue = styleBox.cue,
      linePos = computeLinePos(cue),
      axis = [];

  // If we have a line number to align the cue to.
  if (cue.snapToLines) {
    var size;
    switch (cue.vertical) {
    case "":
      axis = [ "+y", "-y" ];
      size = "height";
      break;
    case "rl":
      axis = [ "+x", "-x" ];
      size = "width";
      break;
    case "lr":
      axis = [ "-x", "+x" ];
      size = "width";
      break;
    }

    var step = boxPosition.lineHeight,
        position = step * Math.round(linePos),
        maxPosition = containerBox[size] + step,
        initialAxis = axis[0];

    // If the specified intial position is greater then the max position then
    // clamp the box to the amount of steps it would take for the box to
    // reach the max position.
    if (Math.abs(position) > maxPosition) {
      position = position < 0 ? -1 : 1;
      position *= Math.ceil(maxPosition / step) * step;
    }

    // If computed line position returns negative then line numbers are
    // relative to the bottom of the video instead of the top. Therefore, we
    // need to increase our initial position by the length or width of the
    // video, depending on the writing direction, and reverse our axis directions.
    if (linePos < 0) {
      position += cue.vertical === "" ? containerBox.height : containerBox.width;
      axis = axis.reverse();
    }

    // Move the box to the specified position. This may not be its best
    // position.
    boxPosition.move(initialAxis, position);

  } else {
    // If we have a percentage line value for the cue.
    var calculatedPercentage = (boxPosition.lineHeight / containerBox.height) * 100;

    switch (cue.lineAlign) {
    case "middle":
      linePos -= (calculatedPercentage / 2);
      break;
    case "end":
      linePos -= calculatedPercentage;
      break;
    }

    // Apply initial line position to the cue box.
    switch (cue.vertical) {
    case "":
      styleBox.applyStyles({
        top: styleBox.formatStyle(linePos, "%")
      });
      break;
    case "rl":
      styleBox.applyStyles({
        left: styleBox.formatStyle(linePos, "%")
      });
      break;
    case "lr":
      styleBox.applyStyles({
        right: styleBox.formatStyle(linePos, "%")
      });
      break;
    }

    axis = [ "+y", "-x", "+x", "-y" ];

    // Get the box position again after we've applied the specified positioning
    // to it.
    boxPosition = new BoxPosition(styleBox);
  }

  var bestPosition = findBestPosition(boxPosition, axis);
  styleBox.move(bestPosition.toCSSCompatValues(containerBox));
}

function WebVTT() {
  // Nothing
}

// Helper to allow strings to be decoded instead of the default binary utf8 data.
WebVTT.StringDecoder = function() {
  return {
    decode: function(data) {
      if (!data) {
        return "";
      }
      if (typeof data !== "string") {
        throw new Error("Error - expected string data.");
      }
      return decodeURIComponent(encodeURIComponent(data));
    }
  };
};

WebVTT.convertCueToDOMTree = function(window, cuetext) {
  if (!window || !cuetext) {
    return null;
  }
  return parseContent(window, cuetext);
};

var FONT_SIZE_PERCENT = 0.05;
var FONT_STYLE = "sans-serif";
var CUE_BACKGROUND_PADDING = "1.5%";

// Runs the processing model over the cues and regions passed to it.
// @param overlay A block level element (usually a div) that the computed cues
//                and regions will be placed into.
WebVTT.processCues = function(window, cues, overlay) {
  if (!window || !cues || !overlay) {
    return null;
  }

  // Remove all previous children.
  while (overlay.firstChild) {
    overlay.removeChild(overlay.firstChild);
  }

  var paddedOverlay = window.document.createElement("div");
  paddedOverlay.style.position = "absolute";
  paddedOverlay.style.left = "0";
  paddedOverlay.style.right = "0";
  paddedOverlay.style.top = "0";
  paddedOverlay.style.bottom = "0";
  paddedOverlay.style.margin = CUE_BACKGROUND_PADDING;
  overlay.appendChild(paddedOverlay);

  // Determine if we need to compute the display states of the cues. This could
  // be the case if a cue's state has been changed since the last computation or
  // if it has not been computed yet.
  function shouldCompute(cues) {
    for (var i = 0; i < cues.length; i++) {
      if (cues[i].hasBeenReset || !cues[i].displayState) {
        return true;
      }
    }
    return false;
  }

  // We don't need to recompute the cues' display states. Just reuse them.
  if (!shouldCompute(cues)) {
    for (var i = 0; i < cues.length; i++) {
      paddedOverlay.appendChild(cues[i].displayState);
    }
    return;
  }

  var boxPositions = [],
      containerBox = BoxPosition.getSimpleBoxPosition(paddedOverlay),
      fontSize = Math.round(containerBox.height * FONT_SIZE_PERCENT * 100) / 100;
  var styleOptions = {
    font: fontSize + "px " + FONT_STYLE
  };

  (function() {
    var styleBox, cue;

    for (var i = 0; i < cues.length; i++) {
      cue = cues[i];

      // Compute the intial position and styles of the cue div.
      styleBox = new CueStyleBox(window, cue, styleOptions);
      paddedOverlay.appendChild(styleBox.div);

      // Move the cue div to it's correct line position.
      moveBoxToLinePosition(window, styleBox, containerBox, boxPositions);

      // Remember the computed div so that we don't have to recompute it later
      // if we don't have too.
      cue.displayState = styleBox.div;

      boxPositions.push(BoxPosition.getSimpleBoxPosition(styleBox));
    }
  })();
};

WebVTT.Parser = function(window, vttjs, decoder) {
  if (!decoder) {
    decoder = vttjs;
    vttjs = {};
  }
  if (!vttjs) {
    vttjs = {};
  }

  this.window = window;
  this.vttjs = vttjs;
  this.state = "INITIAL";
  this.buffer = "";
  this.decoder = decoder || new TextDecoder("utf8");
  this.regionList = [];
};

WebVTT.Parser.prototype = {
  // If the error is a ParsingError then report it to the consumer if
  // possible. If it's not a ParsingError then throw it like normal.
  reportOrThrowError: function(e) {
    if (e instanceof ParsingError) {
      this.onparsingerror && this.onparsingerror(e);
    } else {
      throw e;
    }
  },
  parse: function (data) {
    var self = this;

    // If there is no data then we won't decode it, but will just try to parse
    // whatever is in buffer already. This may occur in circumstances, for
    // example when flush() is called.
    if (data) {
      // Try to decode the data that we received.
      self.buffer += self.decoder.decode(data, {stream: true});
    }

    function collectNextLine() {
      var buffer = self.buffer;
      var pos = 0;
      while (pos < buffer.length && buffer[pos] !== '\r' && buffer[pos] !== '\n') {
        ++pos;
      }
      var line = buffer.substr(0, pos);
      // Advance the buffer early in case we fail below.
      if (buffer[pos] === '\r') {
        ++pos;
      }
      if (buffer[pos] === '\n') {
        ++pos;
      }
      self.buffer = buffer.substr(pos);
      return line;
    }

    // 3.4 WebVTT region and WebVTT region settings syntax
    function parseRegion(input) {
      var settings = new Settings();

      parseOptions(input, function (k, v) {
        switch (k) {
        case "id":
          settings.set(k, v);
          break;
        case "width":
          settings.percent(k, v);
          break;
        case "lines":
          settings.integer(k, v);
          break;
        case "regionanchor":
        case "viewportanchor":
          var xy = v.split(',');
          if (xy.length !== 2) {
            break;
          }
          // We have to make sure both x and y parse, so use a temporary
          // settings object here.
          var anchor = new Settings();
          anchor.percent("x", xy[0]);
          anchor.percent("y", xy[1]);
          if (!anchor.has("x") || !anchor.has("y")) {
            break;
          }
          settings.set(k + "X", anchor.get("x"));
          settings.set(k + "Y", anchor.get("y"));
          break;
        case "scroll":
          settings.alt(k, v, ["up"]);
          break;
        }
      }, /=/, /\s/);

      // Create the region, using default values for any values that were not
      // specified.
      if (settings.has("id")) {
        var region = new (self.vttjs.VTTRegion || self.window.VTTRegion)();
        region.width = settings.get("width", 100);
        region.lines = settings.get("lines", 3);
        region.regionAnchorX = settings.get("regionanchorX", 0);
        region.regionAnchorY = settings.get("regionanchorY", 100);
        region.viewportAnchorX = settings.get("viewportanchorX", 0);
        region.viewportAnchorY = settings.get("viewportanchorY", 100);
        region.scroll = settings.get("scroll", "");
        // Register the region.
        self.onregion && self.onregion(region);
        // Remember the VTTRegion for later in case we parse any VTTCues that
        // reference it.
        self.regionList.push({
          id: settings.get("id"),
          region: region
        });
      }
    }

    // draft-pantos-http-live-streaming-20
    // https://tools.ietf.org/html/draft-pantos-http-live-streaming-20#section-3.5
    // 3.5 WebVTT
    function parseTimestampMap(input) {
      var settings = new Settings();

      parseOptions(input, function(k, v) {
        switch(k) {
        case "MPEGT":
          settings.integer(k + 'S', v);
          break;
        case "LOCA":
          settings.set(k + 'L', parseTimeStamp(v));
          break;
        }
      }, /[^\d]:/, /,/);

      self.ontimestampmap && self.ontimestampmap({
        "MPEGTS": settings.get("MPEGTS"),
        "LOCAL": settings.get("LOCAL")
      });
    }

    // 3.2 WebVTT metadata header syntax
    function parseHeader(input) {
      if (input.match(/X-TIMESTAMP-MAP/)) {
        // This line contains HLS X-TIMESTAMP-MAP metadata
        parseOptions(input, function(k, v) {
          switch(k) {
          case "X-TIMESTAMP-MAP":
            parseTimestampMap(v);
            break;
          }
        }, /=/);
      } else {
        parseOptions(input, function (k, v) {
          switch (k) {
          case "Region":
            // 3.3 WebVTT region metadata header syntax
            parseRegion(v);
            break;
          }
        }, /:/);
      }

    }

    // 5.1 WebVTT file parsing.
    try {
      var line;
      if (self.state === "INITIAL") {
        // We can't start parsing until we have the first line.
        if (!/\r\n|\n/.test(self.buffer)) {
          return this;
        }

        line = collectNextLine();

        var m = line.match(/^WEBVTT([ \t].*)?$/);
        if (!m || !m[0]) {
          throw new ParsingError(ParsingError.Errors.BadSignature);
        }

        self.state = "HEADER";
      }

      var alreadyCollectedLine = false;
      while (self.buffer) {
        // We can't parse a line until we have the full line.
        if (!/\r\n|\n/.test(self.buffer)) {
          return this;
        }

        if (!alreadyCollectedLine) {
          line = collectNextLine();
        } else {
          alreadyCollectedLine = false;
        }

        switch (self.state) {
        case "HEADER":
          // 13-18 - Allow a header (metadata) under the WEBVTT line.
          if (/:/.test(line)) {
            parseHeader(line);
          } else if (!line) {
            // An empty line terminates the header and starts the body (cues).
            self.state = "ID";
          }
          continue;
        case "NOTE":
          // Ignore NOTE blocks.
          if (!line) {
            self.state = "ID";
          }
          continue;
        case "ID":
          // Check for the start of NOTE blocks.
          if (/^NOTE($|[ \t])/.test(line)) {
            self.state = "NOTE";
            break;
          }
          // 19-29 - Allow any number of line terminators, then initialize new cue values.
          if (!line) {
            continue;
          }
          self.cue = new (self.vttjs.VTTCue || self.window.VTTCue)(0, 0, "");
          self.state = "CUE";
          // 30-39 - Check if self line contains an optional identifier or timing data.
          if (line.indexOf("-->") === -1) {
            self.cue.id = line;
            continue;
          }
          // Process line as start of a cue.
          /*falls through*/
        case "CUE":
          // 40 - Collect cue timings and settings.
          try {
            parseCue(line, self.cue, self.regionList);
          } catch (e) {
            self.reportOrThrowError(e);
            // In case of an error ignore rest of the cue.
            self.cue = null;
            self.state = "BADCUE";
            continue;
          }
          self.state = "CUETEXT";
          continue;
        case "CUETEXT":
          var hasSubstring = line.indexOf("-->") !== -1;
          // 34 - If we have an empty line then report the cue.
          // 35 - If we have the special substring '-->' then report the cue,
          // but do not collect the line as we need to process the current
          // one as a new cue.
          if (!line || hasSubstring && (alreadyCollectedLine = true)) {
            // We are done parsing self cue.
            self.oncue && self.oncue(self.cue);
            self.cue = null;
            self.state = "ID";
            continue;
          }
          if (self.cue.text) {
            self.cue.text += "\n";
          }
          self.cue.text += line;
          continue;
        case "BADCUE": // BADCUE
          // 54-62 - Collect and discard the remaining cue.
          if (!line) {
            self.state = "ID";
          }
          continue;
        }
      }
    } catch (e) {
      self.reportOrThrowError(e);

      // If we are currently parsing a cue, report what we have.
      if (self.state === "CUETEXT" && self.cue && self.oncue) {
        self.oncue(self.cue);
      }
      self.cue = null;
      // Enter BADWEBVTT state if header was not parsed correctly otherwise
      // another exception occurred so enter BADCUE state.
      self.state = self.state === "INITIAL" ? "BADWEBVTT" : "BADCUE";
    }
    return this;
  },
  flush: function () {
    var self = this;
    try {
      // Finish decoding the stream.
      self.buffer += self.decoder.decode();
      // Synthesize the end of the current cue or region.
      if (self.cue || self.state === "HEADER") {
        self.buffer += "\n\n";
        self.parse();
      }
      // If we've flushed, parsed, and we're still on the INITIAL state then
      // that means we don't have enough of the stream to parse the first
      // line.
      if (self.state === "INITIAL") {
        throw new ParsingError(ParsingError.Errors.BadSignature);
      }
    } catch(e) {
      self.reportOrThrowError(e);
    }
    self.onflush && self.onflush();
    return this;
  }
};

module.exports = WebVTT;

},{}],101:[function(_dereq_,module,exports){
/**
 * Copyright 2013 vtt.js Contributors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var autoKeyword = "auto";
var directionSetting = {
  "": true,
  "lr": true,
  "rl": true
};
var alignSetting = {
  "start": true,
  "middle": true,
  "end": true,
  "left": true,
  "right": true
};

function findDirectionSetting(value) {
  if (typeof value !== "string") {
    return false;
  }
  var dir = directionSetting[value.toLowerCase()];
  return dir ? value.toLowerCase() : false;
}

function findAlignSetting(value) {
  if (typeof value !== "string") {
    return false;
  }
  var align = alignSetting[value.toLowerCase()];
  return align ? value.toLowerCase() : false;
}

function extend(obj) {
  var i = 1;
  for (; i < arguments.length; i++) {
    var cobj = arguments[i];
    for (var p in cobj) {
      obj[p] = cobj[p];
    }
  }

  return obj;
}

function VTTCue(startTime, endTime, text) {
  var cue = this;
  var isIE8 = (/MSIE\s8\.0/).test(navigator.userAgent);
  var baseObj = {};

  if (isIE8) {
    cue = document.createElement('custom');
  } else {
    baseObj.enumerable = true;
  }

  /**
   * Shim implementation specific properties. These properties are not in
   * the spec.
   */

  // Lets us know when the VTTCue's data has changed in such a way that we need
  // to recompute its display state. This lets us compute its display state
  // lazily.
  cue.hasBeenReset = false;

  /**
   * VTTCue and TextTrackCue properties
   * http://dev.w3.org/html5/webvtt/#vttcue-interface
   */

  var _id = "";
  var _pauseOnExit = false;
  var _startTime = startTime;
  var _endTime = endTime;
  var _text = text;
  var _region = null;
  var _vertical = "";
  var _snapToLines = true;
  var _line = "auto";
  var _lineAlign = "start";
  var _position = 50;
  var _positionAlign = "middle";
  var _size = 50;
  var _align = "middle";

  Object.defineProperty(cue,
    "id", extend({}, baseObj, {
      get: function() {
        return _id;
      },
      set: function(value) {
        _id = "" + value;
      }
    }));

  Object.defineProperty(cue,
    "pauseOnExit", extend({}, baseObj, {
      get: function() {
        return _pauseOnExit;
      },
      set: function(value) {
        _pauseOnExit = !!value;
      }
    }));

  Object.defineProperty(cue,
    "startTime", extend({}, baseObj, {
      get: function() {
        return _startTime;
      },
      set: function(value) {
        if (typeof value !== "number") {
          throw new TypeError("Start time must be set to a number.");
        }
        _startTime = value;
        this.hasBeenReset = true;
      }
    }));

  Object.defineProperty(cue,
    "endTime", extend({}, baseObj, {
      get: function() {
        return _endTime;
      },
      set: function(value) {
        if (typeof value !== "number") {
          throw new TypeError("End time must be set to a number.");
        }
        _endTime = value;
        this.hasBeenReset = true;
      }
    }));

  Object.defineProperty(cue,
    "text", extend({}, baseObj, {
      get: function() {
        return _text;
      },
      set: function(value) {
        _text = "" + value;
        this.hasBeenReset = true;
      }
    }));

  Object.defineProperty(cue,
    "region", extend({}, baseObj, {
      get: function() {
        return _region;
      },
      set: function(value) {
        _region = value;
        this.hasBeenReset = true;
      }
    }));

  Object.defineProperty(cue,
    "vertical", extend({}, baseObj, {
      get: function() {
        return _vertical;
      },
      set: function(value) {
        var setting = findDirectionSetting(value);
        // Have to check for false because the setting an be an empty string.
        if (setting === false) {
          throw new SyntaxError("An invalid or illegal string was specified.");
        }
        _vertical = setting;
        this.hasBeenReset = true;
      }
    }));

  Object.defineProperty(cue,
    "snapToLines", extend({}, baseObj, {
      get: function() {
        return _snapToLines;
      },
      set: function(value) {
        _snapToLines = !!value;
        this.hasBeenReset = true;
      }
    }));

  Object.defineProperty(cue,
    "line", extend({}, baseObj, {
      get: function() {
        return _line;
      },
      set: function(value) {
        if (typeof value !== "number" && value !== autoKeyword) {
          throw new SyntaxError("An invalid number or illegal string was specified.");
        }
        _line = value;
        this.hasBeenReset = true;
      }
    }));

  Object.defineProperty(cue,
    "lineAlign", extend({}, baseObj, {
      get: function() {
        return _lineAlign;
      },
      set: function(value) {
        var setting = findAlignSetting(value);
        if (!setting) {
          throw new SyntaxError("An invalid or illegal string was specified.");
        }
        _lineAlign = setting;
        this.hasBeenReset = true;
      }
    }));

  Object.defineProperty(cue,
    "position", extend({}, baseObj, {
      get: function() {
        return _position;
      },
      set: function(value) {
        if (value < 0 || value > 100) {
          throw new Error("Position must be between 0 and 100.");
        }
        _position = value;
        this.hasBeenReset = true;
      }
    }));

  Object.defineProperty(cue,
    "positionAlign", extend({}, baseObj, {
      get: function() {
        return _positionAlign;
      },
      set: function(value) {
        var setting = findAlignSetting(value);
        if (!setting) {
          throw new SyntaxError("An invalid or illegal string was specified.");
        }
        _positionAlign = setting;
        this.hasBeenReset = true;
      }
    }));

  Object.defineProperty(cue,
    "size", extend({}, baseObj, {
      get: function() {
        return _size;
      },
      set: function(value) {
        if (value < 0 || value > 100) {
          throw new Error("Size must be between 0 and 100.");
        }
        _size = value;
        this.hasBeenReset = true;
      }
    }));

  Object.defineProperty(cue,
    "align", extend({}, baseObj, {
      get: function() {
        return _align;
      },
      set: function(value) {
        var setting = findAlignSetting(value);
        if (!setting) {
          throw new SyntaxError("An invalid or illegal string was specified.");
        }
        _align = setting;
        this.hasBeenReset = true;
      }
    }));

  /**
   * Other <track> spec defined properties
   */

  // http://www.whatwg.org/specs/web-apps/current-work/multipage/the-video-element.html#text-track-cue-display-state
  cue.displayState = undefined;

  if (isIE8) {
    return cue;
  }
}

/**
 * VTTCue methods
 */

VTTCue.prototype.getCueAsHTML = function() {
  // Assume WebVTT.convertCueToDOMTree is on the global.
  return WebVTT.convertCueToDOMTree(window, this.text);
};

module.exports = VTTCue;

},{}],102:[function(_dereq_,module,exports){
/**
 * Copyright 2013 vtt.js Contributors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var scrollSetting = {
  "": true,
  "up": true
};

function findScrollSetting(value) {
  if (typeof value !== "string") {
    return false;
  }
  var scroll = scrollSetting[value.toLowerCase()];
  return scroll ? value.toLowerCase() : false;
}

function isValidPercentValue(value) {
  return typeof value === "number" && (value >= 0 && value <= 100);
}

// VTTRegion shim http://dev.w3.org/html5/webvtt/#vttregion-interface
function VTTRegion() {
  var _width = 100;
  var _lines = 3;
  var _regionAnchorX = 0;
  var _regionAnchorY = 100;
  var _viewportAnchorX = 0;
  var _viewportAnchorY = 100;
  var _scroll = "";

  Object.defineProperties(this, {
    "width": {
      enumerable: true,
      get: function() {
        return _width;
      },
      set: function(value) {
        if (!isValidPercentValue(value)) {
          throw new Error("Width must be between 0 and 100.");
        }
        _width = value;
      }
    },
    "lines": {
      enumerable: true,
      get: function() {
        return _lines;
      },
      set: function(value) {
        if (typeof value !== "number") {
          throw new TypeError("Lines must be set to a number.");
        }
        _lines = value;
      }
    },
    "regionAnchorY": {
      enumerable: true,
      get: function() {
        return _regionAnchorY;
      },
      set: function(value) {
        if (!isValidPercentValue(value)) {
          throw new Error("RegionAnchorX must be between 0 and 100.");
        }
        _regionAnchorY = value;
      }
    },
    "regionAnchorX": {
      enumerable: true,
      get: function() {
        return _regionAnchorX;
      },
      set: function(value) {
        if(!isValidPercentValue(value)) {
          throw new Error("RegionAnchorY must be between 0 and 100.");
        }
        _regionAnchorX = value;
      }
    },
    "viewportAnchorY": {
      enumerable: true,
      get: function() {
        return _viewportAnchorY;
      },
      set: function(value) {
        if (!isValidPercentValue(value)) {
          throw new Error("ViewportAnchorY must be between 0 and 100.");
        }
        _viewportAnchorY = value;
      }
    },
    "viewportAnchorX": {
      enumerable: true,
      get: function() {
        return _viewportAnchorX;
      },
      set: function(value) {
        if (!isValidPercentValue(value)) {
          throw new Error("ViewportAnchorX must be between 0 and 100.");
        }
        _viewportAnchorX = value;
      }
    },
    "scroll": {
      enumerable: true,
      get: function() {
        return _scroll;
      },
      set: function(value) {
        var setting = findScrollSetting(value);
        // Have to check for false as an empty string is a legal value.
        if (setting === false) {
          throw new SyntaxError("An invalid or illegal string was specified.");
        }
        _scroll = setting;
      }
    }
  });
}

module.exports = VTTRegion;

},{}],103:[function(_dereq_,module,exports){
(function (global){
var win;

if (typeof window !== "undefined") {
    win = window;
} else if (typeof global !== "undefined") {
    win = global;
} else if (typeof self !== "undefined"){
    win = self;
} else {
    win = {};
}

module.exports = win;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],104:[function(_dereq_,module,exports){
"use strict";
var window = _dereq_(95)
var isFunction = _dereq_(105)
var parseHeaders = _dereq_(108)
var xtend = _dereq_(109)

module.exports = createXHR
createXHR.XMLHttpRequest = window.XMLHttpRequest || noop
createXHR.XDomainRequest = "withCredentials" in (new createXHR.XMLHttpRequest()) ? createXHR.XMLHttpRequest : window.XDomainRequest

forEachArray(["get", "put", "post", "patch", "head", "delete"], function(method) {
    createXHR[method === "delete" ? "del" : method] = function(uri, options, callback) {
        options = initParams(uri, options, callback)
        options.method = method.toUpperCase()
        return _createXHR(options)
    }
})

function forEachArray(array, iterator) {
    for (var i = 0; i < array.length; i++) {
        iterator(array[i])
    }
}

function isEmpty(obj){
    for(var i in obj){
        if(obj.hasOwnProperty(i)) return false
    }
    return true
}

function initParams(uri, options, callback) {
    var params = uri

    if (isFunction(options)) {
        callback = options
        if (typeof uri === "string") {
            params = {uri:uri}
        }
    } else {
        params = xtend(options, {uri: uri})
    }

    params.callback = callback
    return params
}

function createXHR(uri, options, callback) {
    options = initParams(uri, options, callback)
    return _createXHR(options)
}

function _createXHR(options) {
    if(typeof options.callback === "undefined"){
        throw new Error("callback argument missing")
    }

    var called = false
    var callback = function cbOnce(err, response, body){
        if(!called){
            called = true
            options.callback(err, response, body)
        }
    }

    function readystatechange() {
        if (xhr.readyState === 4) {
            loadFunc()
        }
    }

    function getBody() {
        // Chrome with requestType=blob throws errors arround when even testing access to responseText
        var body = undefined

        if (xhr.response) {
            body = xhr.response
        } else {
            body = xhr.responseText || getXml(xhr)
        }

        if (isJson) {
            try {
                body = JSON.parse(body)
            } catch (e) {}
        }

        return body
    }

    var failureResponse = {
                body: undefined,
                headers: {},
                statusCode: 0,
                method: method,
                url: uri,
                rawRequest: xhr
            }

    function errorFunc(evt) {
        clearTimeout(timeoutTimer)
        if(!(evt instanceof Error)){
            evt = new Error("" + (evt || "Unknown XMLHttpRequest Error") )
        }
        evt.statusCode = 0
        return callback(evt, failureResponse)
    }

    // will load the data & process the response in a special response object
    function loadFunc() {
        if (aborted) return
        var status
        clearTimeout(timeoutTimer)
        if(options.useXDR && xhr.status===undefined) {
            //IE8 CORS GET successful response doesn't have a status field, but body is fine
            status = 200
        } else {
            status = (xhr.status === 1223 ? 204 : xhr.status)
        }
        var response = failureResponse
        var err = null

        if (status !== 0){
            response = {
                body: getBody(),
                statusCode: status,
                method: method,
                headers: {},
                url: uri,
                rawRequest: xhr
            }
            if(xhr.getAllResponseHeaders){ //remember xhr can in fact be XDR for CORS in IE
                response.headers = parseHeaders(xhr.getAllResponseHeaders())
            }
        } else {
            err = new Error("Internal XMLHttpRequest Error")
        }
        return callback(err, response, response.body)
    }

    var xhr = options.xhr || null

    if (!xhr) {
        if (options.cors || options.useXDR) {
            xhr = new createXHR.XDomainRequest()
        }else{
            xhr = new createXHR.XMLHttpRequest()
        }
    }

    var key
    var aborted
    var uri = xhr.url = options.uri || options.url
    var method = xhr.method = options.method || "GET"
    var body = options.body || options.data || null
    var headers = xhr.headers = options.headers || {}
    var sync = !!options.sync
    var isJson = false
    var timeoutTimer

    if ("json" in options) {
        isJson = true
        headers["accept"] || headers["Accept"] || (headers["Accept"] = "application/json") //Don't override existing accept header declared by user
        if (method !== "GET" && method !== "HEAD") {
            headers["content-type"] || headers["Content-Type"] || (headers["Content-Type"] = "application/json") //Don't override existing accept header declared by user
            body = JSON.stringify(options.json)
        }
    }

    xhr.onreadystatechange = readystatechange
    xhr.onload = loadFunc
    xhr.onerror = errorFunc
    // IE9 must have onprogress be set to a unique function.
    xhr.onprogress = function () {
        // IE must die
    }
    xhr.ontimeout = errorFunc
    xhr.open(method, uri, !sync, options.username, options.password)
    //has to be after open
    if(!sync) {
        xhr.withCredentials = !!options.withCredentials
    }
    // Cannot set timeout with sync request
    // not setting timeout on the xhr object, because of old webkits etc. not handling that correctly
    // both npm's request and jquery 1.x use this kind of timeout, so this is being consistent
    if (!sync && options.timeout > 0 ) {
        timeoutTimer = setTimeout(function(){
            aborted=true//IE9 may still call readystatechange
            xhr.abort("timeout")
            var e = new Error("XMLHttpRequest timeout")
            e.code = "ETIMEDOUT"
            errorFunc(e)
        }, options.timeout )
    }

    if (xhr.setRequestHeader) {
        for(key in headers){
            if(headers.hasOwnProperty(key)){
                xhr.setRequestHeader(key, headers[key])
            }
        }
    } else if (options.headers && !isEmpty(options.headers)) {
        throw new Error("Headers cannot be set on an XDomainRequest object")
    }

    if ("responseType" in options) {
        xhr.responseType = options.responseType
    }

    if ("beforeSend" in options &&
        typeof options.beforeSend === "function"
    ) {
        options.beforeSend(xhr)
    }

    xhr.send(body)

    return xhr


}

function getXml(xhr) {
    if (xhr.responseType === "document") {
        return xhr.responseXML
    }
    var firefoxBugTakenEffect = xhr.status === 204 && xhr.responseXML && xhr.responseXML.documentElement.nodeName === "parsererror"
    if (xhr.responseType === "" && !firefoxBugTakenEffect) {
        return xhr.responseXML
    }

    return null
}

function noop() {}

},{"105":105,"108":108,"109":109,"95":95}],105:[function(_dereq_,module,exports){
module.exports = isFunction

var toString = Object.prototype.toString

function isFunction (fn) {
  var string = toString.call(fn)
  return string === '[object Function]' ||
    (typeof fn === 'function' && string !== '[object RegExp]') ||
    (typeof window !== 'undefined' &&
     // IE8 and below
     (fn === window.setTimeout ||
      fn === window.alert ||
      fn === window.confirm ||
      fn === window.prompt))
};

},{}],106:[function(_dereq_,module,exports){
var isFunction = _dereq_(105)

module.exports = forEach

var toString = Object.prototype.toString
var hasOwnProperty = Object.prototype.hasOwnProperty

function forEach(list, iterator, context) {
    if (!isFunction(iterator)) {
        throw new TypeError('iterator must be a function')
    }

    if (arguments.length < 3) {
        context = this
    }
    
    if (toString.call(list) === '[object Array]')
        forEachArray(list, iterator, context)
    else if (typeof list === 'string')
        forEachString(list, iterator, context)
    else
        forEachObject(list, iterator, context)
}

function forEachArray(array, iterator, context) {
    for (var i = 0, len = array.length; i < len; i++) {
        if (hasOwnProperty.call(array, i)) {
            iterator.call(context, array[i], i, array)
        }
    }
}

function forEachString(string, iterator, context) {
    for (var i = 0, len = string.length; i < len; i++) {
        // no such thing as a sparse string.
        iterator.call(context, string.charAt(i), i, string)
    }
}

function forEachObject(object, iterator, context) {
    for (var k in object) {
        if (hasOwnProperty.call(object, k)) {
            iterator.call(context, object[k], k, object)
        }
    }
}

},{"105":105}],107:[function(_dereq_,module,exports){

exports = module.exports = trim;

function trim(str){
  return str.replace(/^\s*|\s*$/g, '');
}

exports.left = function(str){
  return str.replace(/^\s*/, '');
};

exports.right = function(str){
  return str.replace(/\s*$/, '');
};

},{}],108:[function(_dereq_,module,exports){
var trim = _dereq_(107)
  , forEach = _dereq_(106)
  , isArray = function(arg) {
      return Object.prototype.toString.call(arg) === '[object Array]';
    }

module.exports = function (headers) {
  if (!headers)
    return {}

  var result = {}

  forEach(
      trim(headers).split('\n')
    , function (row) {
        var index = row.indexOf(':')
          , key = trim(row.slice(0, index)).toLowerCase()
          , value = trim(row.slice(index + 1))

        if (typeof(result[key]) === 'undefined') {
          result[key] = value
        } else if (isArray(result[key])) {
          result[key].push(value)
        } else {
          result[key] = [ result[key], value ]
        }
      }
  )

  return result
}
},{"106":106,"107":107}],109:[function(_dereq_,module,exports){
module.exports = extend

var hasOwnProperty = Object.prototype.hasOwnProperty;

function extend() {
    var target = {}

    for (var i = 0; i < arguments.length; i++) {
        var source = arguments[i]

        for (var key in source) {
            if (hasOwnProperty.call(source, key)) {
                target[key] = source[key]
            }
        }
    }

    return target
}

},{}]},{},[93])(93)
});