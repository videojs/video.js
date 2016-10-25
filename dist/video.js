/**
 * @license
 * Video.js 5.12.6 <http://videojs.com/>
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
 * Initial play button. Shows before the video has played. The hiding of the
 * big play button is done via CSS and player states.
 *
 * @param {Object} player  Main Player
 * @param {Object=} options Object of option names and values
 * @extends Button
 * @class BigPlayButton
 */
var BigPlayButton = function (_Button) {
  _inherits(BigPlayButton, _Button);

  function BigPlayButton(player, options) {
    _classCallCheck(this, BigPlayButton);

    return _possibleConstructorReturn(this, _Button.call(this, player, options));
  }

  /**
   * Allow sub components to stack CSS class names
   *
   * @return {String} The constructed class name
   * @method buildCSSClass
   */


  BigPlayButton.prototype.buildCSSClass = function buildCSSClass() {
    return 'vjs-big-play-button';
  };

  /**
   * Handles click for play
   *
   * @method handleClick
   */


  BigPlayButton.prototype.handleClick = function handleClick() {
    this.player_.play();
  };

  return BigPlayButton;
}(_button2['default']);

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

var _log = _dereq_(85);

var _log2 = _interopRequireDefault(_log);

var _object = _dereq_(136);

var _object2 = _interopRequireDefault(_object);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * @file button.js
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                */


/**
 * Base class for all buttons
 *
 * @param {Object} player  Main Player
 * @param {Object=} options Object of option names and values
 * @extends ClickableComponent
 * @class Button
 */
var Button = function (_ClickableComponent) {
  _inherits(Button, _ClickableComponent);

  function Button(player, options) {
    _classCallCheck(this, Button);

    return _possibleConstructorReturn(this, _ClickableComponent.call(this, player, options));
  }

  /**
   * Create the component's DOM element
   *
   * @param {String=} type Element's node type. e.g. 'div'
   * @param {Object=} props An object of properties that should be set on the element
   * @param {Object=} attributes An object of attributes that should be set on the element
   * @return {Element}
   * @method createEl
   */


  Button.prototype.createEl = function createEl() {
    var tag = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'button';
    var props = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    var attributes = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

    props = (0, _object2['default'])({
      className: this.buildCSSClass()
    }, props);

    if (tag !== 'button') {
      _log2['default'].warn('Creating a Button with an HTML element of ' + tag + ' is deprecated; use ClickableComponent instead.');

      // Add properties for clickable element which is not a native HTML button
      props = (0, _object2['default'])({
        tabIndex: 0
      }, props);

      // Add ARIA attributes for clickable element which is not a native HTML button
      attributes = (0, _object2['default'])({
        role: 'button'
      }, attributes);
    }

    // Add attributes for button element
    attributes = (0, _object2['default'])({

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
   * Adds a child component inside this button
   *
   * @param {String|Component} child The class name or instance of a child to add
   * @param {Object=} options Options, including options to be passed to children of the child.
   * @return {Component} The child component (created by this process if a string was used)
   * @deprecated
   * @method addChild
   */


  Button.prototype.addChild = function addChild(child) {
    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    var className = this.constructor.name;

    _log2['default'].warn('Adding an actionable (user controllable) child to a Button (' + className + ') is not supported; use a ClickableComponent instead.');

    // Avoid the error message generated by ClickableComponent's addChild method
    return _component2['default'].prototype.addChild.call(this, child, options);
  };

  /**
   * Handle KeyPress (document level) - Extend with specific functionality for button
   *
   * @method handleKeyPress
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

},{"136":136,"3":3,"5":5,"85":85}],3:[function(_dereq_,module,exports){
'use strict';

exports.__esModule = true;

var _component = _dereq_(5);

var _component2 = _interopRequireDefault(_component);

var _dom = _dereq_(80);

var Dom = _interopRequireWildcard(_dom);

var _events = _dereq_(81);

var Events = _interopRequireWildcard(_events);

var _fn = _dereq_(82);

var Fn = _interopRequireWildcard(_fn);

var _log = _dereq_(85);

var _log2 = _interopRequireDefault(_log);

var _document = _dereq_(92);

var _document2 = _interopRequireDefault(_document);

var _object = _dereq_(136);

var _object2 = _interopRequireDefault(_object);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * @file button.js
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                */


/**
 * Clickable Component which is clickable or keyboard actionable, but is not a native HTML button
 *
 * @param {Object} player  Main Player
 * @param {Object=} options Object of option names and values
 * @extends Component
 * @class ClickableComponent
 */
var ClickableComponent = function (_Component) {
  _inherits(ClickableComponent, _Component);

  function ClickableComponent(player, options) {
    _classCallCheck(this, ClickableComponent);

    var _this = _possibleConstructorReturn(this, _Component.call(this, player, options));

    _this.emitTapEvents();

    _this.on('tap', _this.handleClick);
    _this.on('click', _this.handleClick);
    _this.on('focus', _this.handleFocus);
    _this.on('blur', _this.handleBlur);
    return _this;
  }

  /**
   * Create the component's DOM element
   *
   * @param {String=} type Element's node type. e.g. 'div'
   * @param {Object=} props An object of properties that should be set on the element
   * @param {Object=} attributes An object of attributes that should be set on the element
   * @return {Element}
   * @method createEl
   */


  ClickableComponent.prototype.createEl = function createEl() {
    var tag = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'div';
    var props = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    var attributes = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

    props = (0, _object2['default'])({
      className: this.buildCSSClass(),
      tabIndex: 0
    }, props);

    if (tag === 'button') {
      _log2['default'].error('Creating a ClickableComponent with an HTML element of ' + tag + ' is not supported; use a Button instead.');
    }

    // Add ARIA attributes for clickable element which is not a native HTML button
    attributes = (0, _object2['default'])({
      'role': 'button',

      // let the screen reader user know that the text of the element may change
      'aria-live': 'polite'
    }, attributes);

    var el = _Component.prototype.createEl.call(this, tag, props, attributes);

    this.createControlTextEl(el);

    return el;
  };

  /**
   * create control text
   *
   * @param {Element} el Parent element for the control text
   * @return {Element}
   * @method controlText
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
   * Controls text - both request and localize
   *
   * @param {String}  text Text for element
   * @param {Element=} el Element to set the title on
   * @return {String}
   * @method controlText
   */


  ClickableComponent.prototype.controlText = function controlText(text) {
    var el = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : this.el();

    if (!text) {
      return this.controlText_ || 'Need Text';
    }

    var localizedText = this.localize(text);

    this.controlText_ = text;
    this.controlTextEl_.innerHTML = localizedText;
    el.setAttribute('title', localizedText);

    return this;
  };

  /**
   * Allows sub components to stack CSS class names
   *
   * @return {String}
   * @method buildCSSClass
   */


  ClickableComponent.prototype.buildCSSClass = function buildCSSClass() {
    return 'vjs-control vjs-button ' + _Component.prototype.buildCSSClass.call(this);
  };

  /**
   * Adds a child component inside this clickable-component
   *
   * @param {String|Component} child The class name or instance of a child to add
   * @param {Object=} options Options, including options to be passed to children of the child.
   * @return {Component} The child component (created by this process if a string was used)
   * @method addChild
   */


  ClickableComponent.prototype.addChild = function addChild(child) {
    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    // TODO: Fix adding an actionable child to a ClickableComponent; currently
    // it will cause issues with assistive technology (e.g. screen readers)
    // which support ARIA, since an element with role="button" cannot have
    // actionable child elements.

    // let className = this.constructor.name;
    // log.warn(`Adding a child to a ClickableComponent (${className}) can cause issues with assistive technology which supports ARIA, since an element with role="button" cannot have actionable child elements.`);

    return _Component.prototype.addChild.call(this, child, options);
  };

  /**
   * Enable the component element
   *
   * @return {Component}
   * @method enable
   */


  ClickableComponent.prototype.enable = function enable() {
    this.removeClass('vjs-disabled');
    this.el_.setAttribute('aria-disabled', 'false');
    return this;
  };

  /**
   * Disable the component element
   *
   * @return {Component}
   * @method disable
   */


  ClickableComponent.prototype.disable = function disable() {
    this.addClass('vjs-disabled');
    this.el_.setAttribute('aria-disabled', 'true');
    return this;
  };

  /**
   * Handle Click - Override with specific functionality for component
   *
   * @method handleClick
   */


  ClickableComponent.prototype.handleClick = function handleClick() {};

  /**
   * Handle Focus - Add keyboard functionality to element
   *
   * @method handleFocus
   */


  ClickableComponent.prototype.handleFocus = function handleFocus() {
    Events.on(_document2['default'], 'keydown', Fn.bind(this, this.handleKeyPress));
  };

  /**
   * Handle KeyPress (document level) - Trigger click when Space or Enter key is pressed
   *
   * @method handleKeyPress
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
   * Handle Blur - Remove keyboard triggers
   *
   * @method handleBlur
   */


  ClickableComponent.prototype.handleBlur = function handleBlur() {
    Events.off(_document2['default'], 'keydown', Fn.bind(this, this.handleKeyPress));
  };

  return ClickableComponent;
}(_component2['default']);

_component2['default'].registerComponent('ClickableComponent', ClickableComponent);
exports['default'] = ClickableComponent;

},{"136":136,"5":5,"80":80,"81":81,"82":82,"85":85,"92":92}],4:[function(_dereq_,module,exports){
'use strict';

exports.__esModule = true;

var _button = _dereq_(2);

var _button2 = _interopRequireDefault(_button);

var _component = _dereq_(5);

var _component2 = _interopRequireDefault(_component);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

/**
 * The `CloseButton` component is a button which fires a "close" event
 * when it is activated.
 *
 * @extends Button
 * @class CloseButton
 */
var CloseButton = function (_Button) {
  _inherits(CloseButton, _Button);

  function CloseButton(player, options) {
    _classCallCheck(this, CloseButton);

    var _this = _possibleConstructorReturn(this, _Button.call(this, player, options));

    _this.controlText(options && options.controlText || _this.localize('Close'));
    return _this;
  }

  CloseButton.prototype.buildCSSClass = function buildCSSClass() {
    return 'vjs-close-button ' + _Button.prototype.buildCSSClass.call(this);
  };

  CloseButton.prototype.handleClick = function handleClick() {
    this.trigger({ type: 'close', bubbles: false });
  };

  return CloseButton;
}(_button2['default']);

_component2['default'].registerComponent('CloseButton', CloseButton);
exports['default'] = CloseButton;

},{"2":2,"5":5}],5:[function(_dereq_,module,exports){
'use strict';

exports.__esModule = true;

var _window = _dereq_(93);

var _window2 = _interopRequireDefault(_window);

var _dom = _dereq_(80);

var Dom = _interopRequireWildcard(_dom);

var _fn = _dereq_(82);

var Fn = _interopRequireWildcard(_fn);

var _guid = _dereq_(84);

var Guid = _interopRequireWildcard(_guid);

var _events = _dereq_(81);

var Events = _interopRequireWildcard(_events);

var _log = _dereq_(85);

var _log2 = _interopRequireDefault(_log);

var _toTitleCase = _dereq_(89);

var _toTitleCase2 = _interopRequireDefault(_toTitleCase);

var _mergeOptions = _dereq_(86);

var _mergeOptions2 = _interopRequireDefault(_mergeOptions);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } } /**
                                                                                                                                                           * @file component.js
                                                                                                                                                           *
                                                                                                                                                           * Player Component - Base class for all UI objects
                                                                                                                                                           */


/**
 * Base UI Component class
 * Components are embeddable UI objects that are represented by both a
 * javascript object and an element in the DOM. They can be children of other
 * components, and can have many children themselves.
 * ```js
 *     // adding a button to the player
 *     var button = player.addChild('button');
 *     button.el(); // -> button element
 * ```
 * ```html
 *     <div class="video-js">
 *       <div class="vjs-button">Button</div>
 *     </div>
 * ```
 * Components are also event targets.
 * ```js
 *     button.on('click', function() {
 *       console.log('Button Clicked!');
 *     });
 *     button.trigger('customevent');
 * ```
 *
 * @param {Object} player  Main Player
 * @param {Object=} options Object of option names and values
 * @param {Function=} ready    Ready callback function
 * @class Component
 */
var Component = function () {
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
   * Dispose of the component and all child components
   *
   * @method dispose
   */


  Component.prototype.dispose = function dispose() {
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
   * Return the component's player
   *
   * @return {Player}
   * @method player
   */


  Component.prototype.player = function player() {
    return this.player_;
  };

  /**
   * Deep merge of options objects
   * Whenever a property is an object on both options objects
   * the two properties will be merged using mergeOptions.
   *
   * ```js
   *     Parent.prototype.options_ = {
   *       optionSet: {
   *         'childOne': { 'foo': 'bar', 'asdf': 'fdsa' },
   *         'childTwo': {},
   *         'childThree': {}
   *       }
   *     }
   *     newOptions = {
   *       optionSet: {
   *         'childOne': { 'foo': 'baz', 'abc': '123' }
   *         'childTwo': null,
   *         'childFour': {}
   *       }
   *     }
   *
   *     this.options(newOptions);
   * ```
   * RESULT
   * ```js
   *     {
   *       optionSet: {
   *         'childOne': { 'foo': 'baz', 'asdf': 'fdsa', 'abc': '123' },
   *         'childTwo': null, // Disabled. Won't be initialized.
   *         'childThree': {},
   *         'childFour': {}
   *       }
   *     }
   * ```
   *
   * @param  {Object} obj Object of new option values
   * @return {Object}     A NEW object of this.options_ and obj merged
   * @method options
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
   * Get the component's DOM element
   * ```js
   *     var domEl = myComponent.el();
   * ```
   *
   * @return {Element}
   * @method el
   */


  Component.prototype.el = function el() {
    return this.el_;
  };

  /**
   * Create the component's DOM element
   *
   * @param  {String=} tagName  Element's node type. e.g. 'div'
   * @param  {Object=} properties An object of properties that should be set
   * @param  {Object=} attributes An object of attributes that should be set
   * @return {Element}
   * @method createEl
   */


  Component.prototype.createEl = function createEl(tagName, properties, attributes) {
    return Dom.createEl(tagName, properties, attributes);
  };

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
   * Return the component's DOM element where children are inserted.
   * Will either be the same as el() or a new element defined in createEl().
   *
   * @return {Element}
   * @method contentEl
   */


  Component.prototype.contentEl = function contentEl() {
    return this.contentEl_ || this.el_;
  };

  /**
   * Get the component's ID
   * ```js
   *     var id = myComponent.id();
   * ```
   *
   * @return {String}
   * @method id
   */


  Component.prototype.id = function id() {
    return this.id_;
  };

  /**
   * Get the component's name. The name is often used to reference the component.
   * ```js
   *     var name = myComponent.name();
   * ```
   *
   * @return {String}
   * @method name
   */


  Component.prototype.name = function name() {
    return this.name_;
  };

  /**
   * Get an array of all child components
   * ```js
   *     var kids = myComponent.children();
   * ```
   *
   * @return {Array} The children
   * @method children
   */


  Component.prototype.children = function children() {
    return this.children_;
  };

  /**
   * Returns a child component with the provided ID
   *
   * @return {Component}
   * @method getChildById
   */


  Component.prototype.getChildById = function getChildById(id) {
    return this.childIndex_[id];
  };

  /**
   * Returns a child component with the provided name
   *
   * @return {Component}
   * @method getChild
   */


  Component.prototype.getChild = function getChild(name) {
    return this.childNameIndex_[name];
  };

  /**
   * Adds a child component inside this component
   * ```js
   *     myComponent.el();
   *     // -> <div class='my-component'></div>
   *     myComponent.children();
   *     // [empty array]
   *
   *     var myButton = myComponent.addChild('MyButton');
   *     // -> <div class='my-component'><div class="my-button">myButton<div></div>
   *     // -> myButton === myComponent.children()[0];
   * ```
   * Pass in options for child constructors and options for children of the child
   * ```js
   *     var myButton = myComponent.addChild('MyButton', {
   *       text: 'Press Me',
   *       buttonChildExample: {
   *         buttonChildOption: true
   *       }
   *     });
   * ```
   *
   * @param {String|Component} child The class name or instance of a child to add
   * @param {Object=} options Options, including options to be passed to children of the child.
   * @param {Number} index into our children array to attempt to add the child
   * @return {Component} The child component (created by this process if a string was used)
   * @method addChild
   */


  Component.prototype.addChild = function addChild(child) {
    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    var index = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : this.children_.length;

    var component = void 0;
    var componentName = void 0;

    // If child is a string, create nt with options
    if (typeof child === 'string') {
      componentName = child;

      // Options can also be specified as a boolean, so convert to an empty object if false.
      if (!options) {
        options = {};
      }

      // Same as above, but true is deprecated so show a warning.
      if (options === true) {
        _log2['default'].warn('Initializing a child component with `true` is deprecated. Children should be defined in an array when possible, but if necessary use an object instead of `true`.');
        options = {};
      }

      // If no componentClass in options, assume componentClass is the name lowercased
      // (e.g. playButton)
      var componentClassName = options.componentClass || (0, _toTitleCase2['default'])(componentName);

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
    componentName = componentName || component.name && component.name();

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
   * Remove a child component from this component's list of children, and the
   * child component's element from this component's element
   *
   * @param  {Component} component Component to remove
   * @method removeChild
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
   * Add and initialize default child components from options
   * ```js
   *     // when an instance of MyComponent is created, all children in options
   *     // will be added to the instance by their name strings and options
   *     MyComponent.prototype.options_ = {
   *       children: [
   *         'myChildComponent'
   *       ],
   *       myChildComponent: {
   *         myChildOption: true
   *       }
   *     };
   *
   *     // Or when creating the component
   *     var myComp = new MyComponent(player, {
   *       children: [
   *         'myChildComponent'
   *       ],
   *       myChildComponent: {
   *         myChildOption: true
   *       }
   *     });
   * ```
   * The children option can also be an array of
   * child options objects (that also include a 'name' key).
   * This can be used if you have two child components of the
   * same type that need different options.
   * ```js
   *     var myComp = new MyComponent(player, {
   *       children: [
   *         'button',
   *         {
   *           name: 'button',
   *           someOtherOption: true
   *         },
   *         {
   *           name: 'button',
   *           someOtherOption: false
   *         }
   *       ]
   *     });
   * ```
   *
   * @method initChildren
   */


  Component.prototype.initChildren = function initChildren() {
    var _this = this;

    var children = this.options_.children;

    if (children) {
      (function () {
        // `this` is `parent`
        var parentOptions = _this.options_;

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

          // We also want to pass the original player options to each component as well so they don't need to
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
        .concat(Object.keys(_this.options_).filter(function (child) {
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
      })();
    }
  };

  /**
   * Allows sub components to stack CSS class names
   *
   * @return {String} The constructed class name
   * @method buildCSSClass
   */


  Component.prototype.buildCSSClass = function buildCSSClass() {
    // Child classes can include a function that does:
    // return 'CLASS NAME' + this._super();
    return '';
  };

  /**
   * Add an event listener to this component's element
   * ```js
   *     var myFunc = function() {
   *       var myComponent = this;
   *       // Do something when the event is fired
   *     };
   *
   *     myComponent.on('eventType', myFunc);
   * ```
   * The context of myFunc will be myComponent unless previously bound.
   * Alternatively, you can add a listener to another element or component.
   * ```js
   *     myComponent.on(otherElement, 'eventName', myFunc);
   *     myComponent.on(otherComponent, 'eventName', myFunc);
   * ```
   * The benefit of using this over `VjsEvents.on(otherElement, 'eventName', myFunc)`
   * and `otherComponent.on('eventName', myFunc)` is that this way the listeners
   * will be automatically cleaned up when either component is disposed.
   * It will also bind myComponent as the context of myFunc.
   * **NOTE**: When using this on elements in the page other than window
   * and document (both permanent), if you remove the element from the DOM
   * you need to call `myComponent.trigger(el, 'dispose')` on it to clean up
   * references to it and allow the browser to garbage collect it.
   *
   * @param  {String|Component} first   The event type or other component
   * @param  {Function|String}      second  The event handler or event type
   * @param  {Function}             third   The event handler
   * @return {Component}
   * @method on
   */


  Component.prototype.on = function on(first, second, third) {
    var _this2 = this;

    if (typeof first === 'string' || Array.isArray(first)) {
      Events.on(this.el_, first, Fn.bind(this, second));

      // Targeting another component or element
    } else {
      (function () {
        var target = first;
        var type = second;
        var fn = Fn.bind(_this2, third);

        // When this component is disposed, remove the listener from the other component
        var removeOnDispose = function removeOnDispose() {
          return _this2.off(target, type, fn);
        };

        // Use the same function ID so we can remove it later it using the ID
        // of the original listener
        removeOnDispose.guid = fn.guid;
        _this2.on('dispose', removeOnDispose);

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
      })();
    }

    return this;
  };

  /**
   * Remove an event listener from this component's element
   * ```js
   *     myComponent.off('eventType', myFunc);
   * ```
   * If myFunc is excluded, ALL listeners for the event type will be removed.
   * If eventType is excluded, ALL listeners will be removed from the component.
   * Alternatively you can use `off` to remove listeners that were added to other
   * elements or components using `myComponent.on(otherComponent...`.
   * In this case both the event type and listener function are REQUIRED.
   * ```js
   *     myComponent.off(otherElement, 'eventType', myFunc);
   *     myComponent.off(otherComponent, 'eventType', myFunc);
   * ```
   *
   * @param  {String=|Component}  first  The event type or other component
   * @param  {Function=|String}       second The listener function or event type
   * @param  {Function=}              third  The listener for other component
   * @return {Component}
   * @method off
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
   * Add an event listener to be triggered only once and then removed
   * ```js
   *     myComponent.one('eventName', myFunc);
   * ```
   * Alternatively you can add a listener to another element or component
   * that will be triggered only once.
   * ```js
   *     myComponent.one(otherElement, 'eventName', myFunc);
   *     myComponent.one(otherComponent, 'eventName', myFunc);
   * ```
   *
   * @param  {String|Component}  first   The event type or other component
   * @param  {Function|String}       second  The listener function or event type
   * @param  {Function=}             third   The listener function for other component
   * @return {Component}
   * @method one
   */


  Component.prototype.one = function one(first, second, third) {
    var _this3 = this,
        _arguments = arguments;

    if (typeof first === 'string' || Array.isArray(first)) {
      Events.one(this.el_, first, Fn.bind(this, second));
    } else {
      (function () {
        var target = first;
        var type = second;
        var fn = Fn.bind(_this3, third);

        var newFunc = function newFunc() {
          _this3.off(target, type, newFunc);
          fn.apply(null, _arguments);
        };

        // Keep the same function ID so we can remove it later
        newFunc.guid = fn.guid;

        _this3.on(target, type, newFunc);
      })();
    }

    return this;
  };

  /**
   * Trigger an event on an element
   * ```js
   *     myComponent.trigger('eventName');
   *     myComponent.trigger({'type':'eventName'});
   *     myComponent.trigger('eventName', {data: 'some data'});
   *     myComponent.trigger({'type':'eventName'}, {data: 'some data'});
   * ```
   *
   * @param  {Event|Object|String} event  A string (the type) or an event object with a type attribute
   * @param  {Object} [hash] data hash to pass along with the event
   * @return {Component}       self
   * @method trigger
   */


  Component.prototype.trigger = function trigger(event, hash) {
    Events.trigger(this.el_, event, hash);
    return this;
  };

  /**
   * Bind a listener to the component's ready state.
   * Different from event listeners in that if the ready event has already happened
   * it will trigger the function immediately.
   *
   * @param  {Function} fn Ready listener
   * @param  {Boolean} sync Exec the listener synchronously if component is ready
   * @return {Component}
   * @method ready
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
   * Trigger the ready listeners
   *
   * @return {Component}
   * @method triggerReady
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
      this.trigger('ready');
    }, 1);
  };

  /**
   * Finds a single DOM element matching `selector` within the component's
   * `contentEl` or another custom context.
   *
   * @method $
   * @param  {String} selector
   *         A valid CSS selector, which will be passed to `querySelector`.
   *
   * @param  {Element|String} [context=document]
   *         A DOM element within which to query. Can also be a selector
   *         string in which case the first matching element will be used
   *         as context. If missing (or no element matches selector), falls
   *         back to `document`.
   *
   * @return {Element|null}
   */


  Component.prototype.$ = function $(selector, context) {
    return Dom.$(selector, context || this.contentEl());
  };

  /**
   * Finds a all DOM elements matching `selector` within the component's
   * `contentEl` or another custom context.
   *
   * @method $$
   * @param  {String} selector
   *         A valid CSS selector, which will be passed to `querySelectorAll`.
   *
   * @param  {Element|String} [context=document]
   *         A DOM element within which to query. Can also be a selector
   *         string in which case the first matching element will be used
   *         as context. If missing (or no element matches selector), falls
   *         back to `document`.
   *
   * @return {NodeList}
   */


  Component.prototype.$$ = function $$(selector, context) {
    return Dom.$$(selector, context || this.contentEl());
  };

  /**
   * Check if a component's element has a CSS class name
   *
   * @param {String} classToCheck Classname to check
   * @return {Component}
   * @method hasClass
   */


  Component.prototype.hasClass = function hasClass(classToCheck) {
    return Dom.hasElClass(this.el_, classToCheck);
  };

  /**
   * Add a CSS class name to the component's element
   *
   * @param {String} classToAdd Classname to add
   * @return {Component}
   * @method addClass
   */


  Component.prototype.addClass = function addClass(classToAdd) {
    Dom.addElClass(this.el_, classToAdd);
    return this;
  };

  /**
   * Remove a CSS class name from the component's element
   *
   * @param {String} classToRemove Classname to remove
   * @return {Component}
   * @method removeClass
   */


  Component.prototype.removeClass = function removeClass(classToRemove) {
    Dom.removeElClass(this.el_, classToRemove);
    return this;
  };

  /**
   * Add or remove a CSS class name from the component's element
   *
   * @param  {String} classToToggle
   * @param  {Boolean|Function} [predicate]
   *         Can be a function that returns a Boolean. If `true`, the class
   *         will be added; if `false`, the class will be removed. If not
   *         given, the class will be added if not present and vice versa.
   *
   * @return {Component}
   * @method toggleClass
   */


  Component.prototype.toggleClass = function toggleClass(classToToggle, predicate) {
    Dom.toggleElClass(this.el_, classToToggle, predicate);
    return this;
  };

  /**
   * Show the component element if hidden
   *
   * @return {Component}
   * @method show
   */


  Component.prototype.show = function show() {
    this.removeClass('vjs-hidden');
    return this;
  };

  /**
   * Hide the component element if currently showing
   *
   * @return {Component}
   * @method hide
   */


  Component.prototype.hide = function hide() {
    this.addClass('vjs-hidden');
    return this;
  };

  /**
   * Lock an item in its visible state
   * To be used with fadeIn/fadeOut.
   *
   * @return {Component}
   * @private
   * @method lockShowing
   */


  Component.prototype.lockShowing = function lockShowing() {
    this.addClass('vjs-lock-showing');
    return this;
  };

  /**
   * Unlock an item to be hidden
   * To be used with fadeIn/fadeOut.
   *
   * @return {Component}
   * @private
   * @method unlockShowing
   */


  Component.prototype.unlockShowing = function unlockShowing() {
    this.removeClass('vjs-lock-showing');
    return this;
  };

  /**
   * Set or get the width of the component (CSS values)
   * Setting the video tag dimension values only works with values in pixels.
   * Percent values will not work.
   * Some percents can be used, but width()/height() will return the number + %,
   * not the actual computed width/height.
   *
   * @param  {Number|String=} num   Optional width number
   * @param  {Boolean} skipListeners Skip the 'resize' event trigger
   * @return {Component} This component, when setting the width
   * @return {Number|String} The width, when getting
   * @method width
   */


  Component.prototype.width = function width(num, skipListeners) {
    return this.dimension('width', num, skipListeners);
  };

  /**
   * Get or set the height of the component (CSS values)
   * Setting the video tag dimension values only works with values in pixels.
   * Percent values will not work.
   * Some percents can be used, but width()/height() will return the number + %,
   * not the actual computed width/height.
   *
   * @param  {Number|String=} num     New component height
   * @param  {Boolean=} skipListeners Skip the resize event trigger
   * @return {Component} This component, when setting the height
   * @return {Number|String} The height, when getting
   * @method height
   */


  Component.prototype.height = function height(num, skipListeners) {
    return this.dimension('height', num, skipListeners);
  };

  /**
   * Set both width and height at the same time
   *
   * @param  {Number|String} width Width of player
   * @param  {Number|String} height Height of player
   * @return {Component} The component
   * @method dimensions
   */


  Component.prototype.dimensions = function dimensions(width, height) {
    // Skip resize listeners on width for optimization
    return this.width(width, true).height(height);
  };

  /**
   * Get or set width or height
   * This is the shared code for the width() and height() methods.
   * All for an integer, integer + 'px' or integer + '%';
   * Known issue: Hidden elements officially have a width of 0. We're defaulting
   * to the style.width value and falling back to computedStyle which has the
   * hidden element issue. Info, but probably not an efficient fix:
   * http://www.foliotek.com/devblog/getting-the-width-of-a-hidden-element-with-jquery-using-width/
   *
   * @param  {String} widthOrHeight  'width' or 'height'
   * @param  {Number|String=} num     New dimension
   * @param  {Boolean=} skipListeners Skip resize event trigger
   * @return {Component} The component if a dimension was set
   * @return {Number|String} The dimension if nothing was set
   * @private
   * @method dimension
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
   * Get width or height of computed style
   * @param  {String} widthOrHeight  'width' or 'height'
   * @return {Number|Boolean} The bolean false if nothing was set
   * @method currentDimension
   */


  Component.prototype.currentDimension = function currentDimension(widthOrHeight) {
    var computedWidthOrHeight = 0;

    if (widthOrHeight !== 'width' && widthOrHeight !== 'height') {
      throw new Error('currentDimension only accepts width or height value');
    }

    if (typeof _window2['default'].getComputedStyle === 'function') {
      var computedStyle = _window2['default'].getComputedStyle(this.el_);

      computedWidthOrHeight = computedStyle.getPropertyValue(widthOrHeight) || computedStyle[widthOrHeight];
    } else if (this.el_.currentStyle) {
      // ie 8 doesn't support computed style, shim it
      // return clientWidth or clientHeight instead for better accuracy
      var rule = 'offset' + (0, _toTitleCase2['default'])(widthOrHeight);

      computedWidthOrHeight = this.el_[rule];
    }

    // remove 'px' from variable and parse as integer
    computedWidthOrHeight = parseFloat(computedWidthOrHeight);
    return computedWidthOrHeight;
  };

  /**
   * Get an object which contains width and height values of computed style
   * @return {Object} The dimensions of element
   * @method currentDimensions
   */


  Component.prototype.currentDimensions = function currentDimensions() {
    return {
      width: this.currentDimension('width'),
      height: this.currentDimension('height')
    };
  };

  /**
   * Get width of computed style
   * @return {Integer}
   * @method currentWidth
   */


  Component.prototype.currentWidth = function currentWidth() {
    return this.currentDimension('width');
  };

  /**
   * Get height of computed style
   * @return {Integer}
   * @method currentHeight
   */


  Component.prototype.currentHeight = function currentHeight() {
    return this.currentDimension('height');
  };

  /**
   * Emit 'tap' events when touch events are supported
   * This is used to support toggling the controls through a tap on the video.
   * We're requiring them to be enabled because otherwise every component would
   * have this extra overhead unnecessarily, on mobile devices where extra
   * overhead is especially bad.
   *
   * @private
   * @method emitTapEvents
   */


  Component.prototype.emitTapEvents = function emitTapEvents() {
    // Track the start time so we can determine how long the touch lasted
    var touchStart = 0;
    var firstTouch = null;

    // Maximum movement allowed during a touch event to still be considered a tap
    // Other popular libs use anywhere from 2 (hammer.js) to 15, so 10 seems like a nice, round number.
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
          this.trigger('tap');
          // It may be good to copy the touchend event object and change the
          // type to tap, if the other event properties aren't exact after
          // Events.fixEvent runs (e.g. event.target)
        }
      }
    });
  };

  /**
   * Report user touch activity when touch events occur
   * User activity is used to determine when controls should show/hide. It's
   * relatively simple when it comes to mouse events, because any mouse event
   * should show the controls. So we capture mouse events that bubble up to the
   * player and report activity when that happens.
   * With touch events it isn't as easy. We can't rely on touch events at the
   * player level, because a tap (touchstart + touchend) on the video itself on
   * mobile devices is meant to turn controls off (and on). User activity is
   * checked asynchronously, so what could happen is a tap event on the video
   * turns the controls off, then the touchend event bubbles up to the player,
   * which if it reported user activity, would turn the controls right back on.
   * (We also don't want to completely block touch events from bubbling up)
   * Also a touchmove, touch+hold, and anything other than a tap is not supposed
   * to turn the controls back on on a mobile device.
   * Here we're setting the default component behavior to report user activity
   * whenever touch events happen, and this can be turned off by components that
   * want touch events to act differently.
   *
   * @method enableTouchActivity
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
   * Creates timeout and sets up disposal automatically.
   *
   * @param {Function} fn The function to run after the timeout.
   * @param {Number} timeout Number of ms to delay before executing specified function.
   * @return {Number} Returns the timeout ID
   * @method setTimeout
   */


  Component.prototype.setTimeout = function setTimeout(fn, timeout) {
    fn = Fn.bind(this, fn);

    // window.setTimeout would be preferable here, but due to some bizarre issue with Sinon and/or Phantomjs, we can't.
    var timeoutId = _window2['default'].setTimeout(fn, timeout);

    var disposeFn = function disposeFn() {
      this.clearTimeout(timeoutId);
    };

    disposeFn.guid = 'vjs-timeout-' + timeoutId;

    this.on('dispose', disposeFn);

    return timeoutId;
  };

  /**
   * Clears a timeout and removes the associated dispose listener
   *
   * @param {Number} timeoutId The id of the timeout to clear
   * @return {Number} Returns the timeout ID
   * @method clearTimeout
   */


  Component.prototype.clearTimeout = function clearTimeout(timeoutId) {
    _window2['default'].clearTimeout(timeoutId);

    var disposeFn = function disposeFn() {};

    disposeFn.guid = 'vjs-timeout-' + timeoutId;

    this.off('dispose', disposeFn);

    return timeoutId;
  };

  /**
   * Creates an interval and sets up disposal automatically.
   *
   * @param {Function} fn The function to run every N seconds.
   * @param {Number} interval Number of ms to delay before executing specified function.
   * @return {Number} Returns the interval ID
   * @method setInterval
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
   * Clears an interval and removes the associated dispose listener
   *
   * @param {Number} intervalId The id of the interval to clear
   * @return {Number} Returns the interval ID
   * @method clearInterval
   */


  Component.prototype.clearInterval = function clearInterval(intervalId) {
    _window2['default'].clearInterval(intervalId);

    var disposeFn = function disposeFn() {};

    disposeFn.guid = 'vjs-interval-' + intervalId;

    this.off('dispose', disposeFn);

    return intervalId;
  };

  /**
   * Registers a component
   *
   * @param {String} name Name of the component to register
   * @param {Object} comp The component to register
   * @static
   * @method registerComponent
   */


  Component.registerComponent = function registerComponent(name, comp) {
    if (!Component.components_) {
      Component.components_ = {};
    }

    Component.components_[name] = comp;
    return comp;
  };

  /**
   * Gets a component by name
   *
   * @param {String} name Name of the component to get
   * @return {Component}
   * @static
   * @method getComponent
   */


  Component.getComponent = function getComponent(name) {
    if (Component.components_ && Component.components_[name]) {
      return Component.components_[name];
    }

    if (_window2['default'] && _window2['default'].videojs && _window2['default'].videojs[name]) {
      _log2['default'].warn('The ' + name + ' component was added to the videojs object when it should be registered using videojs.registerComponent(name, component)');
      return _window2['default'].videojs[name];
    }
  };

  /**
   * Sets up the constructor using the supplied init method
   * or uses the init of the parent object
   *
   * @param {Object} props An object of properties
   * @static
   * @deprecated
   * @method extend
   */


  Component.extend = function extend(props) {
    props = props || {};

    _log2['default'].warn('Component.extend({}) has been deprecated, use videojs.extend(Component, {}) instead');

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

},{"80":80,"81":81,"82":82,"84":84,"85":85,"86":86,"89":89,"93":93}],6:[function(_dereq_,module,exports){
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
 * The base class for buttons that toggle specific text track types (e.g. subtitles)
 *
 * @param {Player|Object} player
 * @param {Object=} options
 * @extends TrackButton
 * @class AudioTrackButton
 */
var AudioTrackButton = function (_TrackButton) {
  _inherits(AudioTrackButton, _TrackButton);

  function AudioTrackButton(player) {
    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    _classCallCheck(this, AudioTrackButton);

    options.tracks = player.audioTracks && player.audioTracks();

    var _this = _possibleConstructorReturn(this, _TrackButton.call(this, player, options));

    _this.el_.setAttribute('aria-label', 'Audio Menu');
    return _this;
  }

  /**
   * Allow sub components to stack CSS class names
   *
   * @return {String} The constructed class name
   * @method buildCSSClass
   */


  AudioTrackButton.prototype.buildCSSClass = function buildCSSClass() {
    return 'vjs-audio-button ' + _TrackButton.prototype.buildCSSClass.call(this);
  };

  /**
   * Create a menu item for each audio track
   *
   * @return {Array} Array of menu items
   * @method createItems
   */


  AudioTrackButton.prototype.createItems = function createItems() {
    var items = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];

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

var _fn = _dereq_(82);

var Fn = _interopRequireWildcard(_fn);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * @file audio-track-menu-item.js
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                */


/**
 * The audio track menu item
 *
 * @param {Player|Object} player
 * @param {Object=} options
 * @extends MenuItem
 * @class AudioTrackMenuItem
 */
var AudioTrackMenuItem = function (_MenuItem) {
  _inherits(AudioTrackMenuItem, _MenuItem);

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
      (function () {
        var changeHandler = Fn.bind(_this, _this.handleTracksChange);

        tracks.addEventListener('change', changeHandler);
        _this.on('dispose', function () {
          tracks.removeEventListener('change', changeHandler);
        });
      })();
    }
    return _this;
  }

  /**
   * Handle click on audio track
   *
   * @method handleClick
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
   * Handle audio track change
   *
   * @method handleTracksChange
   */


  AudioTrackMenuItem.prototype.handleTracksChange = function handleTracksChange(event) {
    this.selected(this.track.enabled);
  };

  return AudioTrackMenuItem;
}(_menuItem2['default']);

_component2['default'].registerComponent('AudioTrackMenuItem', AudioTrackMenuItem);
exports['default'] = AudioTrackMenuItem;

},{"48":48,"5":5,"82":82}],8:[function(_dereq_,module,exports){
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
 * Container of main controls
 *
 * @extends Component
 * @class ControlBar
 */
var ControlBar = function (_Component) {
  _inherits(ControlBar, _Component);

  function ControlBar() {
    _classCallCheck(this, ControlBar);

    return _possibleConstructorReturn(this, _Component.apply(this, arguments));
  }

  /**
   * Create the component's DOM element
   *
   * @return {Element}
   * @method createEl
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
 * @class FullscreenToggle
 */
var FullscreenToggle = function (_Button) {
  _inherits(FullscreenToggle, _Button);

  function FullscreenToggle(player, options) {
    _classCallCheck(this, FullscreenToggle);

    var _this = _possibleConstructorReturn(this, _Button.call(this, player, options));

    _this.on(player, 'fullscreenchange', _this.handleFullscreenChange);
    return _this;
  }

  /**
   * Allow sub components to stack CSS class names
   *
   * @return {String} The constructed class name
   * @method buildCSSClass
   */


  FullscreenToggle.prototype.buildCSSClass = function buildCSSClass() {
    return 'vjs-fullscreen-control ' + _Button.prototype.buildCSSClass.call(this);
  };
  /**
   * Handles Fullscreenchange on the component and change control text accordingly
   *
   * @method handleFullscreenChange
   */


  FullscreenToggle.prototype.handleFullscreenChange = function handleFullscreenChange() {
    if (this.player_.isFullscreen()) {
      this.controlText('Non-Fullscreen');
    } else {
      this.controlText('Fullscreen');
    }
  };
  /**
   * Handles click for full screen
   *
   * @method handleClick
   */


  FullscreenToggle.prototype.handleClick = function handleClick() {
    if (!this.player_.isFullscreen()) {
      this.player_.requestFullscreen();
    } else {
      this.player_.exitFullscreen();
    }
  };

  return FullscreenToggle;
}(_button2['default']);

FullscreenToggle.prototype.controlText_ = 'Fullscreen';

_component2['default'].registerComponent('FullscreenToggle', FullscreenToggle);
exports['default'] = FullscreenToggle;

},{"2":2,"5":5}],10:[function(_dereq_,module,exports){
'use strict';

exports.__esModule = true;

var _component = _dereq_(5);

var _component2 = _interopRequireDefault(_component);

var _dom = _dereq_(80);

var Dom = _interopRequireWildcard(_dom);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * @file live-display.js
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                */


/**
 * Displays the live indicator
 * TODO - Future make it click to snap to live
 *
 * @extends Component
 * @class LiveDisplay
 */
var LiveDisplay = function (_Component) {
  _inherits(LiveDisplay, _Component);

  function LiveDisplay(player, options) {
    _classCallCheck(this, LiveDisplay);

    var _this = _possibleConstructorReturn(this, _Component.call(this, player, options));

    _this.updateShowing();
    _this.on(_this.player(), 'durationchange', _this.updateShowing);
    return _this;
  }

  /**
   * Create the component's DOM element
   *
   * @return {Element}
   * @method createEl
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

  LiveDisplay.prototype.updateShowing = function updateShowing() {
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

},{"5":5,"80":80}],11:[function(_dereq_,module,exports){
'use strict';

exports.__esModule = true;

var _button = _dereq_(2);

var _button2 = _interopRequireDefault(_button);

var _component = _dereq_(5);

var _component2 = _interopRequireDefault(_component);

var _dom = _dereq_(80);

var Dom = _interopRequireWildcard(_dom);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * @file mute-toggle.js
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                */


/**
 * A button component for muting the audio
 *
 * @param {Player|Object} player
 * @param {Object=} options
 * @extends Button
 * @class MuteToggle
 */
var MuteToggle = function (_Button) {
  _inherits(MuteToggle, _Button);

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
   * Allow sub components to stack CSS class names
   *
   * @return {String} The constructed class name
   * @method buildCSSClass
   */


  MuteToggle.prototype.buildCSSClass = function buildCSSClass() {
    return 'vjs-mute-control ' + _Button.prototype.buildCSSClass.call(this);
  };

  /**
   * Handle click on mute
   *
   * @method handleClick
   */


  MuteToggle.prototype.handleClick = function handleClick() {
    this.player_.muted(this.player_.muted() ? false : true);
  };

  /**
   * Update volume
   *
   * @method update
   */


  MuteToggle.prototype.update = function update() {
    var vol = this.player_.volume();
    var level = 3;

    if (vol === 0 || this.player_.muted()) {
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

MuteToggle.prototype.controlText_ = 'Mute';

_component2['default'].registerComponent('MuteToggle', MuteToggle);
exports['default'] = MuteToggle;

},{"2":2,"5":5,"80":80}],12:[function(_dereq_,module,exports){
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
 * Button to toggle between play and pause
 *
 * @param {Player|Object} player
 * @param {Object=} options
 * @extends Button
 * @class PlayToggle
 */
var PlayToggle = function (_Button) {
  _inherits(PlayToggle, _Button);

  function PlayToggle(player, options) {
    _classCallCheck(this, PlayToggle);

    var _this = _possibleConstructorReturn(this, _Button.call(this, player, options));

    _this.on(player, 'play', _this.handlePlay);
    _this.on(player, 'pause', _this.handlePause);
    return _this;
  }

  /**
   * Allow sub components to stack CSS class names
   *
   * @return {String} The constructed class name
   * @method buildCSSClass
   */


  PlayToggle.prototype.buildCSSClass = function buildCSSClass() {
    return 'vjs-play-control ' + _Button.prototype.buildCSSClass.call(this);
  };

  /**
   * Handle click to toggle between play and pause
   *
   * @method handleClick
   */


  PlayToggle.prototype.handleClick = function handleClick() {
    if (this.player_.paused()) {
      this.player_.play();
    } else {
      this.player_.pause();
    }
  };

  /**
   * Add the vjs-playing class to the element so it can change appearance
   *
   * @method handlePlay
   */


  PlayToggle.prototype.handlePlay = function handlePlay() {
    this.removeClass('vjs-paused');
    this.addClass('vjs-playing');
    // change the button text to "Pause"
    this.controlText('Pause');
  };

  /**
   * Add the vjs-paused class to the element so it can change appearance
   *
   * @method handlePause
   */


  PlayToggle.prototype.handlePause = function handlePause() {
    this.removeClass('vjs-playing');
    this.addClass('vjs-paused');
    // change the button text to "Play"
    this.controlText('Play');
  };

  return PlayToggle;
}(_button2['default']);

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

var _dom = _dereq_(80);

var Dom = _interopRequireWildcard(_dom);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * @file playback-rate-menu-button.js
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                */


/**
 * The component for controlling the playback rate
 *
 * @param {Player|Object} player
 * @param {Object=} options
 * @extends MenuButton
 * @class PlaybackRateMenuButton
 */
var PlaybackRateMenuButton = function (_MenuButton) {
  _inherits(PlaybackRateMenuButton, _MenuButton);

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
   * Create the component's DOM element
   *
   * @return {Element}
   * @method createEl
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
   * Allow sub components to stack CSS class names
   *
   * @return {String} The constructed class name
   * @method buildCSSClass
   */


  PlaybackRateMenuButton.prototype.buildCSSClass = function buildCSSClass() {
    return 'vjs-playback-rate ' + _MenuButton.prototype.buildCSSClass.call(this);
  };

  /**
   * Create the playback rate menu
   *
   * @return {Menu} Menu object populated with items
   * @method createMenu
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
   *
   * @method updateARIAAttributes
   */


  PlaybackRateMenuButton.prototype.updateARIAAttributes = function updateARIAAttributes() {
    // Current playback rate
    this.el().setAttribute('aria-valuenow', this.player().playbackRate());
  };

  /**
   * Handle menu item click
   *
   * @method handleClick
   */


  PlaybackRateMenuButton.prototype.handleClick = function handleClick() {
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
   * @return {Array} Possible playback rates
   * @method playbackRates
   */


  PlaybackRateMenuButton.prototype.playbackRates = function playbackRates() {
    return this.options_.playbackRates || this.options_.playerOptions && this.options_.playerOptions.playbackRates;
  };

  /**
   * Get whether playback rates is supported by the tech
   * and an array of playback rates exists
   *
   * @return {Boolean} Whether changing playback rate is supported
   * @method playbackRateSupported
   */


  PlaybackRateMenuButton.prototype.playbackRateSupported = function playbackRateSupported() {
    return this.player().tech_ && this.player().tech_.featuresPlaybackRate && this.playbackRates() && this.playbackRates().length > 0;
  };

  /**
   * Hide playback rate controls when they're no playback rate options to select
   *
   * @method updateVisibility
   */


  PlaybackRateMenuButton.prototype.updateVisibility = function updateVisibility() {
    if (this.playbackRateSupported()) {
      this.removeClass('vjs-hidden');
    } else {
      this.addClass('vjs-hidden');
    }
  };

  /**
   * Update button label when rate changed
   *
   * @method updateLabel
   */


  PlaybackRateMenuButton.prototype.updateLabel = function updateLabel() {
    if (this.playbackRateSupported()) {
      this.labelEl_.innerHTML = this.player().playbackRate() + 'x';
    }
  };

  return PlaybackRateMenuButton;
}(_menuButton2['default']);

PlaybackRateMenuButton.prototype.controlText_ = 'Playback Rate';

_component2['default'].registerComponent('PlaybackRateMenuButton', PlaybackRateMenuButton);
exports['default'] = PlaybackRateMenuButton;

},{"14":14,"47":47,"49":49,"5":5,"80":80}],14:[function(_dereq_,module,exports){
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
 * The specific menu item type for selecting a playback rate
 *
 * @param {Player|Object} player
 * @param {Object=} options
 * @extends MenuItem
 * @class PlaybackRateMenuItem
 */
var PlaybackRateMenuItem = function (_MenuItem) {
  _inherits(PlaybackRateMenuItem, _MenuItem);

  function PlaybackRateMenuItem(player, options) {
    _classCallCheck(this, PlaybackRateMenuItem);

    var label = options.rate;
    var rate = parseFloat(label, 10);

    // Modify options for parent MenuItem class's init.
    options.label = label;
    options.selected = rate === 1;

    var _this = _possibleConstructorReturn(this, _MenuItem.call(this, player, options));

    _this.label = label;
    _this.rate = rate;

    _this.on(player, 'ratechange', _this.update);
    return _this;
  }

  /**
   * Handle click on menu item
   *
   * @method handleClick
   */


  PlaybackRateMenuItem.prototype.handleClick = function handleClick() {
    _MenuItem.prototype.handleClick.call(this);
    this.player().playbackRate(this.rate);
  };

  /**
   * Update playback rate with selected rate
   *
   * @method update
   */


  PlaybackRateMenuItem.prototype.update = function update() {
    this.selected(this.player().playbackRate() === this.rate);
  };

  return PlaybackRateMenuItem;
}(_menuItem2['default']);

PlaybackRateMenuItem.prototype.contentElType = 'button';

_component2['default'].registerComponent('PlaybackRateMenuItem', PlaybackRateMenuItem);
exports['default'] = PlaybackRateMenuItem;

},{"48":48,"5":5}],15:[function(_dereq_,module,exports){
'use strict';

exports.__esModule = true;

var _component = _dereq_(5);

var _component2 = _interopRequireDefault(_component);

var _dom = _dereq_(80);

var Dom = _interopRequireWildcard(_dom);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * @file load-progress-bar.js
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                */


/**
 * Shows load progress
 *
 * @param {Player|Object} player
 * @param {Object=} options
 * @extends Component
 * @class LoadProgressBar
 */
var LoadProgressBar = function (_Component) {
  _inherits(LoadProgressBar, _Component);

  function LoadProgressBar(player, options) {
    _classCallCheck(this, LoadProgressBar);

    var _this = _possibleConstructorReturn(this, _Component.call(this, player, options));

    _this.partEls_ = [];
    _this.on(player, 'progress', _this.update);
    return _this;
  }

  /**
   * Create the component's DOM element
   *
   * @return {Element}
   * @method createEl
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
   * @method update
   */


  LoadProgressBar.prototype.update = function update() {
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

},{"5":5,"80":80}],16:[function(_dereq_,module,exports){
'use strict';

exports.__esModule = true;

var _window = _dereq_(93);

var _window2 = _interopRequireDefault(_window);

var _component = _dereq_(5);

var _component2 = _interopRequireDefault(_component);

var _dom = _dereq_(80);

var Dom = _interopRequireWildcard(_dom);

var _fn = _dereq_(82);

var Fn = _interopRequireWildcard(_fn);

var _formatTime = _dereq_(83);

var _formatTime2 = _interopRequireDefault(_formatTime);

var _throttle = _dereq_(98);

var _throttle2 = _interopRequireDefault(_throttle);

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
 * @param {Player|Object} player
 * @param {Object=} options
 * @extends Component
 * @class MouseTimeDisplay
 */
var MouseTimeDisplay = function (_Component) {
  _inherits(MouseTimeDisplay, _Component);

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
      _this.on(player.controlBar.progressControl.el(), 'mousemove', (0, _throttle2['default'])(Fn.bind(_this, _this.handleMouseMove), 25));
    });
    return _this;
  }

  /**
   * Create the component's DOM element
   *
   * @return {Element}
   * @method createEl
   */


  MouseTimeDisplay.prototype.createEl = function createEl() {
    return _Component.prototype.createEl.call(this, 'div', {
      className: 'vjs-mouse-display'
    });
  };

  MouseTimeDisplay.prototype.handleMouseMove = function handleMouseMove(event) {
    var duration = this.player_.duration();
    var newTime = this.calculateDistance(event) * duration;
    var position = event.pageX - Dom.findElPosition(this.el().parentNode).left;

    this.update(newTime, position);
  };

  MouseTimeDisplay.prototype.update = function update(newTime, position) {
    var time = (0, _formatTime2['default'])(newTime, this.player_.duration());

    this.el().style.left = position + 'px';
    this.el().setAttribute('data-current-time', time);

    if (this.keepTooltipsInside) {
      var clampedPosition = this.clampPosition_(position);
      var difference = position - clampedPosition + 1;
      var tooltipWidth = parseFloat(_window2['default'].getComputedStyle(this.tooltip).width);
      var tooltipWidthHalf = tooltipWidth / 2;

      this.tooltip.innerHTML = time;
      this.tooltip.style.right = '-' + (tooltipWidthHalf - difference) + 'px';
    }
  };

  MouseTimeDisplay.prototype.calculateDistance = function calculateDistance(event) {
    return Dom.getPointerPosition(this.el().parentNode, event).x;
  };

  /**
   * This takes in a horizontal position for the bar and returns a clamped position.
   * Clamped position means that it will keep the position greater than half the width
   * of the tooltip and smaller than the player width minus half the width o the tooltip.
   * It will only clamp the position if `keepTooltipsInside` option is set.
   *
   * @param {Number} position the position the bar wants to be
   * @return {Number} newPosition the (potentially) clamped position
   * @method clampPosition_
   */


  MouseTimeDisplay.prototype.clampPosition_ = function clampPosition_(position) {
    if (!this.keepTooltipsInside) {
      return position;
    }

    var playerWidth = parseFloat(_window2['default'].getComputedStyle(this.player().el()).width);
    var tooltipWidth = parseFloat(_window2['default'].getComputedStyle(this.tooltip).width);
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

},{"5":5,"80":80,"82":82,"83":83,"93":93,"98":98}],17:[function(_dereq_,module,exports){
'use strict';

exports.__esModule = true;

var _component = _dereq_(5);

var _component2 = _interopRequireDefault(_component);

var _fn = _dereq_(82);

var Fn = _interopRequireWildcard(_fn);

var _formatTime = _dereq_(83);

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
 * @param {Player|Object} player
 * @param {Object=} options
 * @extends Component
 * @class PlayProgressBar
 */
var PlayProgressBar = function (_Component) {
  _inherits(PlayProgressBar, _Component);

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
   * Create the component's DOM element
   *
   * @return {Element}
   * @method createEl
   */


  PlayProgressBar.prototype.createEl = function createEl() {
    return _Component.prototype.createEl.call(this, 'div', {
      className: 'vjs-play-progress vjs-slider-bar',
      innerHTML: '<span class="vjs-control-text"><span>' + this.localize('Progress') + '</span>: 0%</span>'
    });
  };

  PlayProgressBar.prototype.updateDataAttr = function updateDataAttr() {
    var time = this.player_.scrubbing() ? this.player_.getCache().currentTime : this.player_.currentTime();

    this.el_.setAttribute('data-current-time', (0, _formatTime2['default'])(time, this.player_.duration()));
  };

  return PlayProgressBar;
}(_component2['default']);

_component2['default'].registerComponent('PlayProgressBar', PlayProgressBar);
exports['default'] = PlayProgressBar;

},{"5":5,"82":82,"83":83}],18:[function(_dereq_,module,exports){
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
 * and play progress
 *
 * @param {Player|Object} player
 * @param {Object=} options
 * @extends Component
 * @class ProgressControl
 */
var ProgressControl = function (_Component) {
  _inherits(ProgressControl, _Component);

  function ProgressControl() {
    _classCallCheck(this, ProgressControl);

    return _possibleConstructorReturn(this, _Component.apply(this, arguments));
  }

  /**
   * Create the component's DOM element
   *
   * @return {Element}
   * @method createEl
   */
  ProgressControl.prototype.createEl = function createEl() {
    return _Component.prototype.createEl.call(this, 'div', {
      className: 'vjs-progress-control vjs-control'
    });
  };

  return ProgressControl;
}(_component2['default']);

ProgressControl.prototype.options_ = {
  children: ['seekBar']
};

_component2['default'].registerComponent('ProgressControl', ProgressControl);
exports['default'] = ProgressControl;

},{"16":16,"19":19,"5":5}],19:[function(_dereq_,module,exports){
'use strict';

exports.__esModule = true;

var _window = _dereq_(93);

var _window2 = _interopRequireDefault(_window);

var _slider = _dereq_(57);

var _slider2 = _interopRequireDefault(_slider);

var _component = _dereq_(5);

var _component2 = _interopRequireDefault(_component);

var _fn = _dereq_(82);

var Fn = _interopRequireWildcard(_fn);

var _formatTime = _dereq_(83);

var _formatTime2 = _interopRequireDefault(_formatTime);

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
 * @param {Player|Object} player
 * @param {Object=} options
 * @extends Slider
 * @class SeekBar
 */
var SeekBar = function (_Slider) {
  _inherits(SeekBar, _Slider);

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
   * Create the component's DOM element
   *
   * @return {Element}
   * @method createEl
   */


  SeekBar.prototype.createEl = function createEl() {
    return _Slider.prototype.createEl.call(this, 'div', {
      className: 'vjs-progress-holder'
    }, {
      'aria-label': 'progress bar'
    });
  };

  /**
   * Update ARIA accessibility attributes
   *
   * @method updateARIAAttributes
   */


  SeekBar.prototype.updateProgress = function updateProgress() {
    this.updateAriaAttributes(this.el_);

    if (this.keepTooltipsInside) {
      this.updateAriaAttributes(this.tooltipProgressBar.el_);
      this.tooltipProgressBar.el_.style.width = this.bar.el_.style.width;

      var playerWidth = parseFloat(_window2['default'].getComputedStyle(this.player().el()).width);
      var tooltipWidth = parseFloat(_window2['default'].getComputedStyle(this.tooltipProgressBar.tooltip).width);
      var tooltipStyle = this.tooltipProgressBar.el().style;

      tooltipStyle.maxWidth = Math.floor(playerWidth - tooltipWidth / 2) + 'px';
      tooltipStyle.minWidth = Math.ceil(tooltipWidth / 2) + 'px';
      tooltipStyle.right = '-' + tooltipWidth / 2 + 'px';
    }
  };

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
   * @return {Number} Percentage played
   * @method getPercent
   */


  SeekBar.prototype.getPercent = function getPercent() {
    var percent = this.player_.currentTime() / this.player_.duration();

    return percent >= 1 ? 1 : percent;
  };

  /**
   * Handle mouse down on seek bar
   *
   * @method handleMouseDown
   */


  SeekBar.prototype.handleMouseDown = function handleMouseDown(event) {
    _Slider.prototype.handleMouseDown.call(this, event);

    this.player_.scrubbing(true);

    this.videoWasPlaying = !this.player_.paused();
    this.player_.pause();
  };

  /**
   * Handle mouse move on seek bar
   *
   * @method handleMouseMove
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
   * @method handleMouseUp
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
   *
   * @method stepForward
   */


  SeekBar.prototype.stepForward = function stepForward() {
    // more quickly fast forward for keyboard-only users
    this.player_.currentTime(this.player_.currentTime() + 5);
  };

  /**
   * Move more quickly rewind for keyboard-only users
   *
   * @method stepBack
   */


  SeekBar.prototype.stepBack = function stepBack() {
    // more quickly rewind for keyboard-only users
    this.player_.currentTime(this.player_.currentTime() - 5);
  };

  return SeekBar;
}(_slider2['default']);

SeekBar.prototype.options_ = {
  children: ['loadProgressBar', 'mouseTimeDisplay', 'playProgressBar'],
  barName: 'playProgressBar'
};

SeekBar.prototype.playerEvent = 'timeupdate';

_component2['default'].registerComponent('SeekBar', SeekBar);
exports['default'] = SeekBar;

},{"15":15,"17":17,"20":20,"5":5,"57":57,"82":82,"83":83,"93":93}],20:[function(_dereq_,module,exports){
'use strict';

exports.__esModule = true;

var _component = _dereq_(5);

var _component2 = _interopRequireDefault(_component);

var _fn = _dereq_(82);

var Fn = _interopRequireWildcard(_fn);

var _formatTime = _dereq_(83);

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
 * @param {Player|Object} player
 * @param {Object=} options
 * @extends Component
 * @class PlayProgressBar
 */
var TooltipProgressBar = function (_Component) {
  _inherits(TooltipProgressBar, _Component);

  function TooltipProgressBar(player, options) {
    _classCallCheck(this, TooltipProgressBar);

    var _this = _possibleConstructorReturn(this, _Component.call(this, player, options));

    _this.updateDataAttr();
    _this.on(player, 'timeupdate', _this.updateDataAttr);
    player.ready(Fn.bind(_this, _this.updateDataAttr));
    return _this;
  }

  /**
   * Create the component's DOM element
   *
   * @return {Element}
   * @method createEl
   */


  TooltipProgressBar.prototype.createEl = function createEl() {
    var el = _Component.prototype.createEl.call(this, 'div', {
      className: 'vjs-tooltip-progress-bar vjs-slider-bar',
      innerHTML: '<div class="vjs-time-tooltip"></div>\n        <span class="vjs-control-text"><span>' + this.localize('Progress') + '</span>: 0%</span>'
    });

    this.tooltip = el.querySelector('.vjs-time-tooltip');

    return el;
  };

  TooltipProgressBar.prototype.updateDataAttr = function updateDataAttr() {
    var time = this.player_.scrubbing() ? this.player_.getCache().currentTime : this.player_.currentTime();
    var formattedTime = (0, _formatTime2['default'])(time, this.player_.duration());

    this.el_.setAttribute('data-current-time', formattedTime);
    this.tooltip.innerHTML = formattedTime;
  };

  return TooltipProgressBar;
}(_component2['default']);

_component2['default'].registerComponent('TooltipProgressBar', TooltipProgressBar);
exports['default'] = TooltipProgressBar;

},{"5":5,"82":82,"83":83}],21:[function(_dereq_,module,exports){
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
 * @class CustomControlSpacer
 */
var CustomControlSpacer = function (_Spacer) {
  _inherits(CustomControlSpacer, _Spacer);

  function CustomControlSpacer() {
    _classCallCheck(this, CustomControlSpacer);

    return _possibleConstructorReturn(this, _Spacer.apply(this, arguments));
  }

  /**
   * Allow sub components to stack CSS class names
   *
   * @return {String} The constructed class name
   * @method buildCSSClass
   */
  CustomControlSpacer.prototype.buildCSSClass = function buildCSSClass() {
    return 'vjs-custom-control-spacer ' + _Spacer.prototype.buildCSSClass.call(this);
  };

  /**
   * Create the component's DOM element
   *
   * @return {Element}
   * @method createEl
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
 * @class Spacer
 */
var Spacer = function (_Component) {
  _inherits(Spacer, _Component);

  function Spacer() {
    _classCallCheck(this, Spacer);

    return _possibleConstructorReturn(this, _Component.apply(this, arguments));
  }

  /**
   * Allow sub components to stack CSS class names
   *
   * @return {String} The constructed class name
   * @method buildCSSClass
   */
  Spacer.prototype.buildCSSClass = function buildCSSClass() {
    return 'vjs-spacer ' + _Component.prototype.buildCSSClass.call(this);
  };

  /**
   * Create the component's DOM element
   *
   * @return {Element}
   * @method createEl
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
 * @param {Player|Object} player
 * @param {Object=} options
 * @extends TextTrackMenuItem
 * @class CaptionSettingsMenuItem
 */
var CaptionSettingsMenuItem = function (_TextTrackMenuItem) {
  _inherits(CaptionSettingsMenuItem, _TextTrackMenuItem);

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
   * Handle click on menu item
   *
   * @method handleClick
   */


  CaptionSettingsMenuItem.prototype.handleClick = function handleClick() {
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
 * @param {Object} player  Player object
 * @param {Object=} options Object of option names and values
 * @param {Function=} ready    Ready callback function
 * @extends TextTrackButton
 * @class CaptionsButton
 */
var CaptionsButton = function (_TextTrackButton) {
  _inherits(CaptionsButton, _TextTrackButton);

  function CaptionsButton(player, options, ready) {
    _classCallCheck(this, CaptionsButton);

    var _this = _possibleConstructorReturn(this, _TextTrackButton.call(this, player, options, ready));

    _this.el_.setAttribute('aria-label', 'Captions Menu');
    return _this;
  }

  /**
   * Allow sub components to stack CSS class names
   *
   * @return {String} The constructed class name
   * @method buildCSSClass
   */


  CaptionsButton.prototype.buildCSSClass = function buildCSSClass() {
    return 'vjs-captions-button ' + _TextTrackButton.prototype.buildCSSClass.call(this);
  };

  /**
   * Update caption menu items
   *
   * @method update
   */


  CaptionsButton.prototype.update = function update() {
    var threshold = 2;

    _TextTrackButton.prototype.update.call(this);

    // if native, then threshold is 1 because no settings button
    if (this.player().tech_ && this.player().tech_.featuresNativeTextTracks) {
      threshold = 1;
    }

    if (this.items && this.items.length > threshold) {
      this.show();
    } else {
      this.hide();
    }
  };

  /**
   * Create caption menu items
   *
   * @return {Array} Array of menu items
   * @method createItems
   */


  CaptionsButton.prototype.createItems = function createItems() {
    var items = [];

    if (!(this.player().tech_ && this.player().tech_.featuresNativeTextTracks)) {
      items.push(new _captionSettingsMenuItem2['default'](this.player_, { kind: this.kind_ }));
    }

    return _TextTrackButton.prototype.createItems.call(this, items);
  };

  return CaptionsButton;
}(_textTrackButton2['default']);

CaptionsButton.prototype.kind_ = 'captions';
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

var _textTrackMenuItem = _dereq_(31);

var _textTrackMenuItem2 = _interopRequireDefault(_textTrackMenuItem);

var _chaptersTrackMenuItem = _dereq_(26);

var _chaptersTrackMenuItem2 = _interopRequireDefault(_chaptersTrackMenuItem);

var _menu = _dereq_(49);

var _menu2 = _interopRequireDefault(_menu);

var _dom = _dereq_(80);

var Dom = _interopRequireWildcard(_dom);

var _toTitleCase = _dereq_(89);

var _toTitleCase2 = _interopRequireDefault(_toTitleCase);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

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
 * @param {Object} player  Player object
 * @param {Object=} options Object of option names and values
 * @param {Function=} ready    Ready callback function
 * @extends TextTrackButton
 * @class ChaptersButton
 */
var ChaptersButton = function (_TextTrackButton) {
  _inherits(ChaptersButton, _TextTrackButton);

  function ChaptersButton(player, options, ready) {
    _classCallCheck(this, ChaptersButton);

    var _this = _possibleConstructorReturn(this, _TextTrackButton.call(this, player, options, ready));

    _this.el_.setAttribute('aria-label', 'Chapters Menu');
    return _this;
  }

  /**
   * Allow sub components to stack CSS class names
   *
   * @return {String} The constructed class name
   * @method buildCSSClass
   */


  ChaptersButton.prototype.buildCSSClass = function buildCSSClass() {
    return 'vjs-chapters-button ' + _TextTrackButton.prototype.buildCSSClass.call(this);
  };

  /**
   * Create a menu item for each text track
   *
   * @return {Array} Array of menu items
   * @method createItems
   */


  ChaptersButton.prototype.createItems = function createItems() {
    var items = [];
    var tracks = this.player_.textTracks();

    if (!tracks) {
      return items;
    }

    for (var i = 0; i < tracks.length; i++) {
      var track = tracks[i];

      if (track.kind === this.kind_) {
        items.push(new _textTrackMenuItem2['default'](this.player_, { track: track }));
      }
    }

    return items;
  };

  /**
   * Create menu from chapter buttons
   *
   * @return {Menu} Menu of chapter buttons
   * @method createMenu
   */


  ChaptersButton.prototype.createMenu = function createMenu() {
    var _this2 = this;

    var tracks = this.player_.textTracks() || [];
    var chaptersTrack = void 0;
    var items = this.items || [];

    for (var i = tracks.length - 1; i >= 0; i--) {

      // We will always choose the last track as our chaptersTrack
      var track = tracks[i];

      if (track.kind === this.kind_) {
        chaptersTrack = track;

        break;
      }
    }

    var menu = this.menu;

    if (menu === undefined) {
      menu = new _menu2['default'](this.player_);

      var title = Dom.createEl('li', {
        className: 'vjs-menu-title',
        innerHTML: (0, _toTitleCase2['default'])(this.kind_),
        tabIndex: -1
      });

      menu.children_.unshift(title);
      Dom.insertElFirst(title, menu.contentEl());
    } else {
      // We will empty out the menu children each time because we want a
      // fresh new menu child list each time
      items.forEach(function (item) {
        return menu.removeChild(item);
      });
      // Empty out the ChaptersButton menu items because we no longer need them
      items = [];
    }

    if (chaptersTrack && (chaptersTrack.cues === null || chaptersTrack.cues === undefined)) {
      chaptersTrack.mode = 'hidden';

      var remoteTextTrackEl = this.player_.remoteTextTrackEls().getTrackElementByTrack_(chaptersTrack);

      if (remoteTextTrackEl) {
        remoteTextTrackEl.addEventListener('load', function (event) {
          return _this2.update();
        });
      }
    }

    if (chaptersTrack && chaptersTrack.cues && chaptersTrack.cues.length > 0) {
      var cues = chaptersTrack.cues;

      for (var _i = 0, l = cues.length; _i < l; _i++) {
        var cue = cues[_i];

        var mi = new _chaptersTrackMenuItem2['default'](this.player_, {
          cue: cue,
          track: chaptersTrack
        });

        items.push(mi);

        menu.addChild(mi);
      }
    }

    if (items.length > 0) {
      this.show();
    }
    // Assigning the value of items back to this.items for next iteration
    this.items = items;
    return menu;
  };

  return ChaptersButton;
}(_textTrackButton2['default']);

ChaptersButton.prototype.kind_ = 'chapters';
ChaptersButton.prototype.controlText_ = 'Chapters';

_component2['default'].registerComponent('ChaptersButton', ChaptersButton);
exports['default'] = ChaptersButton;

},{"26":26,"30":30,"31":31,"49":49,"5":5,"80":80,"89":89}],26:[function(_dereq_,module,exports){
'use strict';

exports.__esModule = true;

var _menuItem = _dereq_(48);

var _menuItem2 = _interopRequireDefault(_menuItem);

var _component = _dereq_(5);

var _component2 = _interopRequireDefault(_component);

var _fn = _dereq_(82);

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
 * @param {Player|Object} player
 * @param {Object=} options
 * @extends MenuItem
 * @class ChaptersTrackMenuItem
 */
var ChaptersTrackMenuItem = function (_MenuItem) {
  _inherits(ChaptersTrackMenuItem, _MenuItem);

  function ChaptersTrackMenuItem(player, options) {
    _classCallCheck(this, ChaptersTrackMenuItem);

    var track = options.track;
    var cue = options.cue;
    var currentTime = player.currentTime();

    // Modify options for parent MenuItem class's init.
    options.label = cue.text;
    options.selected = cue.startTime <= currentTime && currentTime < cue.endTime;

    var _this = _possibleConstructorReturn(this, _MenuItem.call(this, player, options));

    _this.track = track;
    _this.cue = cue;
    track.addEventListener('cuechange', Fn.bind(_this, _this.update));
    return _this;
  }

  /**
   * Handle click on menu item
   *
   * @method handleClick
   */


  ChaptersTrackMenuItem.prototype.handleClick = function handleClick() {
    _MenuItem.prototype.handleClick.call(this);
    this.player_.currentTime(this.cue.startTime);
    this.update(this.cue.startTime);
  };

  /**
   * Update chapter menu item
   *
   * @method update
   */


  ChaptersTrackMenuItem.prototype.update = function update() {
    var cue = this.cue;
    var currentTime = this.player_.currentTime();

    // vjs.log(currentTime, cue.startTime);
    this.selected(cue.startTime <= currentTime && currentTime < cue.endTime);
  };

  return ChaptersTrackMenuItem;
}(_menuItem2['default']);

_component2['default'].registerComponent('ChaptersTrackMenuItem', ChaptersTrackMenuItem);
exports['default'] = ChaptersTrackMenuItem;

},{"48":48,"5":5,"82":82}],27:[function(_dereq_,module,exports){
'use strict';

exports.__esModule = true;

var _textTrackButton = _dereq_(30);

var _textTrackButton2 = _interopRequireDefault(_textTrackButton);

var _component = _dereq_(5);

var _component2 = _interopRequireDefault(_component);

var _fn = _dereq_(82);

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
 * @param {Object} player  Player object
 * @param {Object=} options Object of option names and values
 * @param {Function=} ready    Ready callback function
 * @extends TextTrackButton
 * @class DescriptionsButton
 */
var DescriptionsButton = function (_TextTrackButton) {
  _inherits(DescriptionsButton, _TextTrackButton);

  function DescriptionsButton(player, options, ready) {
    _classCallCheck(this, DescriptionsButton);

    var _this = _possibleConstructorReturn(this, _TextTrackButton.call(this, player, options, ready));

    _this.el_.setAttribute('aria-label', 'Descriptions Menu');

    var tracks = player.textTracks();

    if (tracks) {
      (function () {
        var changeHandler = Fn.bind(_this, _this.handleTracksChange);

        tracks.addEventListener('change', changeHandler);
        _this.on('dispose', function () {
          tracks.removeEventListener('change', changeHandler);
        });
      })();
    }
    return _this;
  }

  /**
   * Handle text track change
   *
   * @method handleTracksChange
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
   * Allow sub components to stack CSS class names
   *
   * @return {String} The constructed class name
   * @method buildCSSClass
   */


  DescriptionsButton.prototype.buildCSSClass = function buildCSSClass() {
    return 'vjs-descriptions-button ' + _TextTrackButton.prototype.buildCSSClass.call(this);
  };

  return DescriptionsButton;
}(_textTrackButton2['default']);

DescriptionsButton.prototype.kind_ = 'descriptions';
DescriptionsButton.prototype.controlText_ = 'Descriptions';

_component2['default'].registerComponent('DescriptionsButton', DescriptionsButton);
exports['default'] = DescriptionsButton;

},{"30":30,"5":5,"82":82}],28:[function(_dereq_,module,exports){
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
 * @param {Player|Object} player
 * @param {Object=} options
 * @extends TextTrackMenuItem
 * @class OffTextTrackMenuItem
 */
var OffTextTrackMenuItem = function (_TextTrackMenuItem) {
  _inherits(OffTextTrackMenuItem, _TextTrackMenuItem);

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
   * @param {Object} event Event object
   * @method handleTracksChange
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
 * @param {Object} player  Player object
 * @param {Object=} options Object of option names and values
 * @param {Function=} ready    Ready callback function
 * @extends TextTrackButton
 * @class SubtitlesButton
 */
var SubtitlesButton = function (_TextTrackButton) {
  _inherits(SubtitlesButton, _TextTrackButton);

  function SubtitlesButton(player, options, ready) {
    _classCallCheck(this, SubtitlesButton);

    var _this = _possibleConstructorReturn(this, _TextTrackButton.call(this, player, options, ready));

    _this.el_.setAttribute('aria-label', 'Subtitles Menu');
    return _this;
  }

  /**
   * Allow sub components to stack CSS class names
   *
   * @return {String} The constructed class name
   * @method buildCSSClass
   */


  SubtitlesButton.prototype.buildCSSClass = function buildCSSClass() {
    return 'vjs-subtitles-button ' + _TextTrackButton.prototype.buildCSSClass.call(this);
  };

  return SubtitlesButton;
}(_textTrackButton2['default']);

SubtitlesButton.prototype.kind_ = 'subtitles';
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
 * @param {Player|Object} player
 * @param {Object=} options
 * @extends MenuButton
 * @class TextTrackButton
 */
var TextTrackButton = function (_TrackButton) {
  _inherits(TextTrackButton, _TrackButton);

  function TextTrackButton(player) {
    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    _classCallCheck(this, TextTrackButton);

    options.tracks = player.textTracks();

    return _possibleConstructorReturn(this, _TrackButton.call(this, player, options));
  }

  /**
   * Create a menu item for each text track
   *
   * @return {Array} Array of menu items
   * @method createItems
   */


  TextTrackButton.prototype.createItems = function createItems() {
    var items = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];

    // Add an OFF menu item to turn all tracks off
    items.push(new _offTextTrackMenuItem2['default'](this.player_, { kind: this.kind_ }));

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

var _fn = _dereq_(82);

var Fn = _interopRequireWildcard(_fn);

var _window = _dereq_(93);

var _window2 = _interopRequireDefault(_window);

var _document = _dereq_(92);

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
 * @param {Player|Object} player
 * @param {Object=} options
 * @extends MenuItem
 * @class TextTrackMenuItem
 */
var TextTrackMenuItem = function (_MenuItem) {
  _inherits(TextTrackMenuItem, _MenuItem);

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
      (function () {
        var changeHandler = Fn.bind(_this, _this.handleTracksChange);

        tracks.addEventListener('change', changeHandler);
        _this.on('dispose', function () {
          tracks.removeEventListener('change', changeHandler);
        });
      })();
    }

    // iOS7 doesn't dispatch change events to TextTrackLists when an
    // associated track's mode changes. Without something like
    // Object.observe() (also not present on iOS7), it's not
    // possible to detect changes to the mode attribute and polyfill
    // the change event. As a poor substitute, we manually dispatch
    // change events whenever the controls modify the mode.
    if (tracks && tracks.onchange === undefined) {
      (function () {
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
      })();
    }
    return _this;
  }

  /**
   * Handle click on text track
   *
   * @method handleClick
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
        track.mode = 'showing';
      } else {
        track.mode = 'disabled';
      }
    }
  };

  /**
   * Handle text track change
   *
   * @method handleTracksChange
   */


  TextTrackMenuItem.prototype.handleTracksChange = function handleTracksChange(event) {
    this.selected(this.track.mode === 'showing');
  };

  return TextTrackMenuItem;
}(_menuItem2['default']);

_component2['default'].registerComponent('TextTrackMenuItem', TextTrackMenuItem);
exports['default'] = TextTrackMenuItem;

},{"48":48,"5":5,"82":82,"92":92,"93":93}],32:[function(_dereq_,module,exports){
'use strict';

exports.__esModule = true;

var _component = _dereq_(5);

var _component2 = _interopRequireDefault(_component);

var _dom = _dereq_(80);

var Dom = _interopRequireWildcard(_dom);

var _formatTime = _dereq_(83);

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
 * @param {Player|Object} player
 * @param {Object=} options
 * @extends Component
 * @class CurrentTimeDisplay
 */
var CurrentTimeDisplay = function (_Component) {
  _inherits(CurrentTimeDisplay, _Component);

  function CurrentTimeDisplay(player, options) {
    _classCallCheck(this, CurrentTimeDisplay);

    var _this = _possibleConstructorReturn(this, _Component.call(this, player, options));

    _this.on(player, 'timeupdate', _this.updateContent);
    return _this;
  }

  /**
   * Create the component's DOM element
   *
   * @return {Element}
   * @method createEl
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
   * @method updateContent
   */


  CurrentTimeDisplay.prototype.updateContent = function updateContent() {
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

},{"5":5,"80":80,"83":83}],33:[function(_dereq_,module,exports){
'use strict';

exports.__esModule = true;

var _component = _dereq_(5);

var _component2 = _interopRequireDefault(_component);

var _dom = _dereq_(80);

var Dom = _interopRequireWildcard(_dom);

var _formatTime = _dereq_(83);

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
 * @param {Player|Object} player
 * @param {Object=} options
 * @extends Component
 * @class DurationDisplay
 */
var DurationDisplay = function (_Component) {
  _inherits(DurationDisplay, _Component);

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
   * Create the component's DOM element
   *
   * @return {Element}
   * @method createEl
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
   * Update duration time display
   *
   * @method updateContent
   */


  DurationDisplay.prototype.updateContent = function updateContent() {
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

},{"5":5,"80":80,"83":83}],34:[function(_dereq_,module,exports){
'use strict';

exports.__esModule = true;

var _component = _dereq_(5);

var _component2 = _interopRequireDefault(_component);

var _dom = _dereq_(80);

var Dom = _interopRequireWildcard(_dom);

var _formatTime = _dereq_(83);

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
 * @param {Player|Object} player
 * @param {Object=} options
 * @extends Component
 * @class RemainingTimeDisplay
 */
var RemainingTimeDisplay = function (_Component) {
  _inherits(RemainingTimeDisplay, _Component);

  function RemainingTimeDisplay(player, options) {
    _classCallCheck(this, RemainingTimeDisplay);

    var _this = _possibleConstructorReturn(this, _Component.call(this, player, options));

    _this.on(player, 'timeupdate', _this.updateContent);
    _this.on(player, 'durationchange', _this.updateContent);
    return _this;
  }

  /**
   * Create the component's DOM element
   *
   * @return {Element}
   * @method createEl
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
   * Update remaining time display
   *
   * @method updateContent
   */


  RemainingTimeDisplay.prototype.updateContent = function updateContent() {
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

},{"5":5,"80":80,"83":83}],35:[function(_dereq_,module,exports){
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
 * @param {Player|Object} player
 * @param {Object=} options
 * @extends Component
 * @class TimeDivider
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
   * @method createEl
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

var _fn = _dereq_(82);

var Fn = _interopRequireWildcard(_fn);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * @file track-button.js
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                */


/**
 * The base class for buttons that toggle specific text track types (e.g. subtitles)
 *
 * @param {Player|Object} player
 * @param {Object=} options
 * @extends MenuButton
 * @class TrackButton
 */
var TrackButton = function (_MenuButton) {
  _inherits(TrackButton, _MenuButton);

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

},{"47":47,"5":5,"82":82}],37:[function(_dereq_,module,exports){
'use strict';

exports.__esModule = true;

var _slider = _dereq_(57);

var _slider2 = _interopRequireDefault(_slider);

var _component = _dereq_(5);

var _component2 = _interopRequireDefault(_component);

var _fn = _dereq_(82);

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
 * @param {Player|Object} player
 * @param {Object=} options
 * @extends Slider
 * @class VolumeBar
 */
var VolumeBar = function (_Slider) {
  _inherits(VolumeBar, _Slider);

  function VolumeBar(player, options) {
    _classCallCheck(this, VolumeBar);

    var _this = _possibleConstructorReturn(this, _Slider.call(this, player, options));

    _this.on(player, 'volumechange', _this.updateARIAAttributes);
    player.ready(Fn.bind(_this, _this.updateARIAAttributes));
    return _this;
  }

  /**
   * Create the component's DOM element
   *
   * @return {Element}
   * @method createEl
   */


  VolumeBar.prototype.createEl = function createEl() {
    return _Slider.prototype.createEl.call(this, 'div', {
      className: 'vjs-volume-bar vjs-slider-bar'
    }, {
      'aria-label': 'volume level'
    });
  };

  /**
   * Handle mouse move on volume bar
   *
   * @method handleMouseMove
   */


  VolumeBar.prototype.handleMouseMove = function handleMouseMove(event) {
    this.checkMuted();
    this.player_.volume(this.calculateDistance(event));
  };

  VolumeBar.prototype.checkMuted = function checkMuted() {
    if (this.player_.muted()) {
      this.player_.muted(false);
    }
  };

  /**
   * Get percent of volume level
   *
   * @retun {Number} Volume level percent
   * @method getPercent
   */


  VolumeBar.prototype.getPercent = function getPercent() {
    if (this.player_.muted()) {
      return 0;
    }
    return this.player_.volume();
  };

  /**
   * Increase volume level for keyboard users
   *
   * @method stepForward
   */


  VolumeBar.prototype.stepForward = function stepForward() {
    this.checkMuted();
    this.player_.volume(this.player_.volume() + 0.1);
  };

  /**
   * Decrease volume level for keyboard users
   *
   * @method stepBack
   */


  VolumeBar.prototype.stepBack = function stepBack() {
    this.checkMuted();
    this.player_.volume(this.player_.volume() - 0.1);
  };

  /**
   * Update ARIA accessibility attributes
   *
   * @method updateARIAAttributes
   */


  VolumeBar.prototype.updateARIAAttributes = function updateARIAAttributes() {
    // Current value of volume bar as a percentage
    var volume = (this.player_.volume() * 100).toFixed(2);

    this.el_.setAttribute('aria-valuenow', volume);
    this.el_.setAttribute('aria-valuetext', volume + '%');
  };

  return VolumeBar;
}(_slider2['default']);

VolumeBar.prototype.options_ = {
  children: ['volumeLevel'],
  barName: 'volumeLevel'
};

VolumeBar.prototype.playerEvent = 'volumechange';

_component2['default'].registerComponent('VolumeBar', VolumeBar);
exports['default'] = VolumeBar;

},{"39":39,"5":5,"57":57,"82":82}],38:[function(_dereq_,module,exports){
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
 * @param {Player|Object} player
 * @param {Object=} options
 * @extends Component
 * @class VolumeControl
 */
var VolumeControl = function (_Component) {
  _inherits(VolumeControl, _Component);

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
   * Create the component's DOM element
   *
   * @return {Element}
   * @method createEl
   */


  VolumeControl.prototype.createEl = function createEl() {
    return _Component.prototype.createEl.call(this, 'div', {
      className: 'vjs-volume-control vjs-control'
    });
  };

  return VolumeControl;
}(_component2['default']);

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
 * @param {Player|Object} player
 * @param {Object=} options
 * @extends Component
 * @class VolumeLevel
 */
var VolumeLevel = function (_Component) {
  _inherits(VolumeLevel, _Component);

  function VolumeLevel() {
    _classCallCheck(this, VolumeLevel);

    return _possibleConstructorReturn(this, _Component.apply(this, arguments));
  }

  /**
   * Create the component's DOM element
   *
   * @return {Element}
   * @method createEl
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

var _fn = _dereq_(82);

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
 * @param {Player|Object} player
 * @param {Object=} options
 * @extends PopupButton
 * @class VolumeMenuButton
 */
var VolumeMenuButton = function (_PopupButton) {
  _inherits(VolumeMenuButton, _PopupButton);

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
   * Allow sub components to stack CSS class names
   *
   * @return {String} The constructed class name
   * @method buildCSSClass
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
   * Allow sub components to stack CSS class names
   *
   * @return {Popup} The volume popup button
   * @method createPopup
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
   * Handle click on volume popup and calls super
   *
   * @method handleClick
   */


  VolumeMenuButton.prototype.handleClick = function handleClick() {
    _muteToggle2['default'].prototype.handleClick.call(this);
    _PopupButton.prototype.handleClick.call(this);
  };

  VolumeMenuButton.prototype.attachVolumeBarEvents = function attachVolumeBarEvents() {
    this.menuContent.on(['mousedown', 'touchdown'], Fn.bind(this, this.handleMouseDown));
  };

  VolumeMenuButton.prototype.handleMouseDown = function handleMouseDown(event) {
    this.on(['mousemove', 'touchmove'], Fn.bind(this.volumeBar, this.volumeBar.handleMouseMove));
    this.on(this.el_.ownerDocument, ['mouseup', 'touchend'], this.handleMouseUp);
  };

  VolumeMenuButton.prototype.handleMouseUp = function handleMouseUp(event) {
    this.off(['mousemove', 'touchmove'], Fn.bind(this.volumeBar, this.volumeBar.handleMouseMove));
  };

  return VolumeMenuButton;
}(_popupButton2['default']);

VolumeMenuButton.prototype.volumeUpdate = _muteToggle2['default'].prototype.update;
VolumeMenuButton.prototype.controlText_ = 'Mute';

_component2['default'].registerComponent('VolumeMenuButton', VolumeMenuButton);
exports['default'] = VolumeMenuButton;

},{"11":11,"37":37,"5":5,"53":53,"54":54,"82":82}],41:[function(_dereq_,module,exports){
'use strict';

exports.__esModule = true;

var _component = _dereq_(5);

var _component2 = _interopRequireDefault(_component);

var _modalDialog = _dereq_(50);

var _modalDialog2 = _interopRequireDefault(_modalDialog);

var _mergeOptions = _dereq_(86);

var _mergeOptions2 = _interopRequireDefault(_mergeOptions);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * @file error-display.js
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                */


/**
 * Display that an error has occurred making the video unplayable.
 *
 * @extends ModalDialog
 * @class ErrorDisplay
 */
var ErrorDisplay = function (_ModalDialog) {
  _inherits(ErrorDisplay, _ModalDialog);

  /**
   * Constructor for error display modal.
   *
   * @param  {Player} player
   * @param  {Object} [options]
   */
  function ErrorDisplay(player, options) {
    _classCallCheck(this, ErrorDisplay);

    var _this = _possibleConstructorReturn(this, _ModalDialog.call(this, player, options));

    _this.on(player, 'error', _this.open);
    return _this;
  }

  /**
   * Include the old class for backward-compatibility.
   *
   * This can be removed in 6.0.
   *
   * @method buildCSSClass
   * @deprecated
   * @return {String}
   */


  ErrorDisplay.prototype.buildCSSClass = function buildCSSClass() {
    return 'vjs-error-display ' + _ModalDialog.prototype.buildCSSClass.call(this);
  };

  /**
   * Generates the modal content based on the player error.
   *
   * @return {String|Null}
   */


  ErrorDisplay.prototype.content = function content() {
    var error = this.player().error();

    return error ? this.localize(error.message) : '';
  };

  return ErrorDisplay;
}(_modalDialog2['default']);

ErrorDisplay.prototype.options_ = (0, _mergeOptions2['default'])(_modalDialog2['default'].prototype.options_, {
  fillAlways: true,
  temporary: false,
  uncloseable: true
});

_component2['default'].registerComponent('ErrorDisplay', ErrorDisplay);
exports['default'] = ErrorDisplay;

},{"5":5,"50":50,"86":86}],42:[function(_dereq_,module,exports){
'use strict';

exports.__esModule = true;

var _events = _dereq_(81);

var Events = _interopRequireWildcard(_events);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

var EventTarget = function EventTarget() {}; /**
                                              * @file event-target.js
                                              */


EventTarget.prototype.allowedEvents_ = {};

EventTarget.prototype.on = function (type, fn) {
  // Remove the addEventListener alias before calling Events.on
  // so we don't get into an infinite type loop
  var ael = this.addEventListener;

  this.addEventListener = function () {};
  Events.on(this, type, fn);
  this.addEventListener = ael;
};

EventTarget.prototype.addEventListener = EventTarget.prototype.on;

EventTarget.prototype.off = function (type, fn) {
  Events.off(this, type, fn);
};

EventTarget.prototype.removeEventListener = EventTarget.prototype.off;

EventTarget.prototype.one = function (type, fn) {
  // Remove the addEventListener alias before calling Events.on
  // so we don't get into an infinite type loop
  var ael = this.addEventListener;

  this.addEventListener = function () {};
  Events.one(this, type, fn);
  this.addEventListener = ael;
};

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

// The standard DOM EventTarget.dispatchEvent() is aliased to trigger()
EventTarget.prototype.dispatchEvent = EventTarget.prototype.trigger;

exports['default'] = EventTarget;

},{"81":81}],43:[function(_dereq_,module,exports){
'use strict';

exports.__esModule = true;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _log = _dereq_(85);

var _log2 = _interopRequireDefault(_log);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

/*
 * @file extend.js
 *
 * A combination of node inherits and babel's inherits (after transpile).
 * Both work the same but node adds `super_` to the subClass
 * and Bable adds the superClass as __proto__. Both seem useful.
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

/*
 * Function for subclassing using the same inheritance that
 * videojs uses internally
 * ```js
 * var Button = videojs.getComponent('Button');
 * ```
 * ```js
 * var MyButton = videojs.extend(Button, {
 *   constructor: function(player, options) {
 *     Button.call(this, player, options);
 *   },
 *   onClick: function() {
 *     // doSomething
 *   }
 * });
 * ```
 */
var extendFn = function extendFn(superClass) {
  var subClassMethods = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

  var subClass = function subClass() {
    superClass.apply(this, arguments);
  };

  var methods = {};

  if ((typeof subClassMethods === 'undefined' ? 'undefined' : _typeof(subClassMethods)) === 'object') {
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

},{"85":85}],44:[function(_dereq_,module,exports){
'use strict';

exports.__esModule = true;

var _document = _dereq_(92);

var _document2 = _interopRequireDefault(_document);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

/*
 * Store the browser-specific methods for the fullscreen API
 * @type {Object|undefined}
 * @private
 */
var FullscreenApi = {};

// browser API methods
// map approach from Screenful.js - https://github.com/sindresorhus/screenfull.js
/**
 * @file fullscreen-api.js
 */
var apiMap = [
// Spec: https://dvcs.w3.org/hg/fullscreen/raw-file/tip/Overview.html
['requestFullscreen', 'exitFullscreen', 'fullscreenElement', 'fullscreenEnabled', 'fullscreenchange', 'fullscreenerror'],
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

},{"92":92}],45:[function(_dereq_,module,exports){
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


/* Loading Spinner
================================================================================ */
/**
 * Loading spinner for waiting events
 *
 * @extends Component
 * @class LoadingSpinner
 */
var LoadingSpinner = function (_Component) {
  _inherits(LoadingSpinner, _Component);

  function LoadingSpinner() {
    _classCallCheck(this, LoadingSpinner);

    return _possibleConstructorReturn(this, _Component.apply(this, arguments));
  }

  /**
   * Create the component's DOM element
   *
   * @method createEl
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

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; /**
                                                                                                                                                                                                                                                                               * @file media-error.js
                                                                                                                                                                                                                                                                               */


var _object = _dereq_(136);

var _object2 = _interopRequireDefault(_object);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

/*
 * Custom MediaError class which mimics the standard HTML5 MediaError class.
 *
 * @param {Number|String|Object|MediaError} value
 *        This can be of multiple types:
 *        - Number: should be a standard error code
 *        - String: an error message (the code will be 0)
 *        - Object: arbitrary properties
 *        - MediaError (native): used to populate a video.js MediaError object
 *        - MediaError (video.js): will return itself if it's already a
 *          video.js MediaError object.
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
  } else if ((typeof value === 'undefined' ? 'undefined' : _typeof(value)) === 'object') {

    // We assign the `code` property manually because native MediaError objects
    // do not expose it as an own/enumerable property of the object.
    if (typeof value.code === 'number') {
      this.code = value.code;
    }

    (0, _object2['default'])(this, value);
  }

  if (!this.message) {
    this.message = MediaError.defaultMessages[this.code] || '';
  }
}

/*
 * The error code that refers two one of the defined
 * MediaError types
 *
 * @type {Number}
 */
MediaError.prototype.code = 0;

/*
 * An optional message to be shown with the error.
 * Message is not part of the HTML5 video spec
 * but allows for more informative custom errors.
 *
 * @type {String}
 */
MediaError.prototype.message = '';

/*
 * An optional status code that can be set by plugins
 * to allow even more detail about the error.
 * For example the HLS plugin might provide the specific
 * HTTP status code that was returned when the error
 * occurred, then allowing a custom error overlay
 * to display more information.
 *
 * @type {Array}
 */
MediaError.prototype.status = null;

// These errors are indexed by the W3C standard numeric value. The order
// should not be changed!
MediaError.errorTypes = ['MEDIA_ERR_CUSTOM', 'MEDIA_ERR_ABORTED', 'MEDIA_ERR_NETWORK', 'MEDIA_ERR_DECODE', 'MEDIA_ERR_SRC_NOT_SUPPORTED', 'MEDIA_ERR_ENCRYPTED'];

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

exports['default'] = MediaError;

},{"136":136}],47:[function(_dereq_,module,exports){
'use strict';

exports.__esModule = true;

var _clickableComponent = _dereq_(3);

var _clickableComponent2 = _interopRequireDefault(_clickableComponent);

var _component = _dereq_(5);

var _component2 = _interopRequireDefault(_component);

var _menu = _dereq_(49);

var _menu2 = _interopRequireDefault(_menu);

var _dom = _dereq_(80);

var Dom = _interopRequireWildcard(_dom);

var _fn = _dereq_(82);

var Fn = _interopRequireWildcard(_fn);

var _toTitleCase = _dereq_(89);

var _toTitleCase2 = _interopRequireDefault(_toTitleCase);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * @file menu-button.js
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                */


/**
 * A button class with a popup menu
 *
 * @param {Player|Object} player
 * @param {Object=} options
 * @extends Button
 * @class MenuButton
 */
var MenuButton = function (_ClickableComponent) {
  _inherits(MenuButton, _ClickableComponent);

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
   * Update menu
   *
   * @method update
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

    if (this.items && this.items.length === 0) {
      this.hide();
    } else if (this.items && this.items.length > 1) {
      this.show();
    }
  };

  /**
   * Create menu
   *
   * @return {Menu} The constructed menu
   * @method createMenu
   */


  MenuButton.prototype.createMenu = function createMenu() {
    var menu = new _menu2['default'](this.player_);

    // Add a title list item to the top
    if (this.options_.title) {
      var title = Dom.createEl('li', {
        className: 'vjs-menu-title',
        innerHTML: (0, _toTitleCase2['default'])(this.options_.title),
        tabIndex: -1
      });

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
   * @method createItems
   */


  MenuButton.prototype.createItems = function createItems() {};

  /**
   * Create the component's DOM element
   *
   * @return {Element}
   * @method createEl
   */


  MenuButton.prototype.createEl = function createEl() {
    return _ClickableComponent.prototype.createEl.call(this, 'div', {
      className: this.buildCSSClass()
    });
  };

  /**
   * Allow sub components to stack CSS class names
   *
   * @return {String} The constructed class name
   * @method buildCSSClass
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
   * When you click the button it adds focus, which
   * will show the menu indefinitely.
   * So we'll remove focus when the mouse leaves the button.
   * Focus is needed for tab navigation.
   * Allow sub components to stack CSS class names
   *
   * @method handleClick
   */


  MenuButton.prototype.handleClick = function handleClick() {
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
   * Handle key press on menu
   *
   * @param {Object} event Key press event
   * @method handleKeyPress
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
   * Handle key press on submenu
   *
   * @param {Object} event Key press event
   * @method handleSubmenuKeyPress
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
   * Makes changes based on button pressed
   *
   * @method pressButton
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
   * Makes changes based on button unpressed
   *
   * @method unpressButton
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
   * Disable the menu button
   *
   * @return {Component}
   * @method disable
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
   * Enable the menu button
   *
   * @return {Component}
   * @method disable
   */


  MenuButton.prototype.enable = function enable() {
    this.enabled_ = true;

    return _ClickableComponent.prototype.enable.call(this);
  };

  return MenuButton;
}(_clickableComponent2['default']);

_component2['default'].registerComponent('MenuButton', MenuButton);
exports['default'] = MenuButton;

},{"3":3,"49":49,"5":5,"80":80,"82":82,"89":89}],48:[function(_dereq_,module,exports){
'use strict';

exports.__esModule = true;

var _clickableComponent = _dereq_(3);

var _clickableComponent2 = _interopRequireDefault(_clickableComponent);

var _component = _dereq_(5);

var _component2 = _interopRequireDefault(_component);

var _object = _dereq_(136);

var _object2 = _interopRequireDefault(_object);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * @file menu-item.js
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                */


/**
 * The component for a menu item. `<li>`
 *
 * @param {Player|Object} player
 * @param {Object=} options
 * @extends Button
 * @class MenuItem
 */
var MenuItem = function (_ClickableComponent) {
  _inherits(MenuItem, _ClickableComponent);

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
   * Create the component's DOM element
   *
   * @param {String=} type Desc
   * @param {Object=} props Desc
   * @return {Element}
   * @method createEl
   */


  MenuItem.prototype.createEl = function createEl(type, props, attrs) {
    return _ClickableComponent.prototype.createEl.call(this, 'li', (0, _object2['default'])({
      className: 'vjs-menu-item',
      innerHTML: this.localize(this.options_.label),
      tabIndex: -1
    }, props), attrs);
  };

  /**
   * Handle a click on the menu item, and set it to selected
   *
   * @method handleClick
   */


  MenuItem.prototype.handleClick = function handleClick() {
    this.selected(true);
  };

  /**
   * Set this menu item as selected or not
   *
   * @param  {Boolean} selected
   * @method selected
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

},{"136":136,"3":3,"5":5}],49:[function(_dereq_,module,exports){
'use strict';

exports.__esModule = true;

var _component = _dereq_(5);

var _component2 = _interopRequireDefault(_component);

var _dom = _dereq_(80);

var Dom = _interopRequireWildcard(_dom);

var _fn = _dereq_(82);

var Fn = _interopRequireWildcard(_fn);

var _events = _dereq_(81);

var Events = _interopRequireWildcard(_events);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * @file menu.js
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                */


/**
 * The Menu component is used to build pop up menus, including subtitle and
 * captions selection menus.
 *
 * @extends Component
 * @class Menu
 */
var Menu = function (_Component) {
  _inherits(Menu, _Component);

  function Menu(player, options) {
    _classCallCheck(this, Menu);

    var _this = _possibleConstructorReturn(this, _Component.call(this, player, options));

    _this.focusedChild_ = -1;

    _this.on('keydown', _this.handleKeyPress);
    return _this;
  }

  /**
   * Add a menu item to the menu
   *
   * @param {Object|String} component Component or component type to add
   * @method addItem
   */


  Menu.prototype.addItem = function addItem(component) {
    this.addChild(component);
    component.on('click', Fn.bind(this, function () {
      this.unlockShowing();
      // TODO: Need to set keyboard focus back to the menuButton
    }));
  };

  /**
   * Create the component's DOM element
   *
   * @return {Element}
   * @method createEl
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
   * Handle key press for menu
   *
   * @param {Object} event Event object
   * @method handleKeyPress
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
   * Move to next (lower) menu item for keyboard users
   *
   * @method stepForward
   */


  Menu.prototype.stepForward = function stepForward() {
    var stepChild = 0;

    if (this.focusedChild_ !== undefined) {
      stepChild = this.focusedChild_ + 1;
    }
    this.focus(stepChild);
  };

  /**
   * Move to previous (higher) menu item for keyboard users
   *
   * @method stepBack
   */


  Menu.prototype.stepBack = function stepBack() {
    var stepChild = 0;

    if (this.focusedChild_ !== undefined) {
      stepChild = this.focusedChild_ - 1;
    }
    this.focus(stepChild);
  };

  /**
   * Set focus on a menu item in the menu
   *
   * @param {Object|String} item Index of child item set focus on
   * @method focus
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

},{"5":5,"80":80,"81":81,"82":82}],50:[function(_dereq_,module,exports){
'use strict';

exports.__esModule = true;

var _dom = _dereq_(80);

var Dom = _interopRequireWildcard(_dom);

var _fn = _dereq_(82);

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
 * @class ModalDialog
 */

var ModalDialog = function (_Component) {
  _inherits(ModalDialog, _Component);

  /**
   * Constructor for modals.
   *
   * @param  {Player} player
   * @param  {Object} [options]
   * @param  {Mixed} [options.content=undefined]
   *         Provide customized content for this modal.
   *
   * @param  {String} [options.description]
   *         A text description for the modal, primarily for accessibility.
   *
   * @param  {Boolean} [options.fillAlways=false]
   *         Normally, modals are automatically filled only the first time
   *         they open. This tells the modal to refresh its content
   *         every time it opens.
   *
   * @param  {String} [options.label]
   *         A text label for the modal, primarily for accessibility.
   *
   * @param  {Boolean} [options.temporary=true]
   *         If `true`, the modal can only be opened once; it will be
   *         disposed as soon as it's closed.
   *
   * @param  {Boolean} [options.uncloseable=false]
   *         If `true`, the user will not be able to close the modal
   *         through the UI in the normal ways. Programmatic closing is
   *         still possible.
   *
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
   * Create the modal's DOM element
   *
   * @method createEl
   * @return {Element}
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
   * Build the modal's CSS class.
   *
   * @method buildCSSClass
   * @return {String}
   */


  ModalDialog.prototype.buildCSSClass = function buildCSSClass() {
    return MODAL_CLASS_NAME + ' vjs-hidden ' + _Component.prototype.buildCSSClass.call(this);
  };

  /**
   * Handles key presses on the document, looking for ESC, which closes
   * the modal.
   *
   * @method handleKeyPress
   * @param  {Event} e
   */


  ModalDialog.prototype.handleKeyPress = function handleKeyPress(e) {
    if (e.which === ESC && this.closeable()) {
      this.close();
    }
  };

  /**
   * Returns the label string for this modal. Primarily used for accessibility.
   *
   * @return {String}
   */


  ModalDialog.prototype.label = function label() {
    return this.options_.label || this.localize('Modal Window');
  };

  /**
   * Returns the description string for this modal. Primarily used for
   * accessibility.
   *
   * @return {String}
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
   * @method open
   * @return {ModalDialog}
   */


  ModalDialog.prototype.open = function open() {
    if (!this.opened_) {
      var player = this.player();

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

      if (this.wasPlaying_) {
        player.pause();
      }

      if (this.closeable()) {
        this.on(this.el_.ownerDocument, 'keydown', Fn.bind(this, this.handleKeyPress));
      }

      player.controls(false);
      this.show();
      this.el().setAttribute('aria-hidden', 'false');
      this.trigger('modalopen');
      this.hasBeenOpened_ = true;
    }
    return this;
  };

  /**
   * Whether or not the modal is opened currently.
   *
   * @method opened
   * @param  {Boolean} [value]
   *         If given, it will open (`true`) or close (`false`) the modal.
   *
   * @return {Boolean}
   */


  ModalDialog.prototype.opened = function opened(value) {
    if (typeof value === 'boolean') {
      this[value ? 'open' : 'close']();
    }
    return this.opened_;
  };

  /**
   * Closes the modal.
   *
   * @method close
   * @return {ModalDialog}
   */


  ModalDialog.prototype.close = function close() {
    if (this.opened_) {
      var player = this.player();

      this.trigger('beforemodalclose');
      this.opened_ = false;

      if (this.wasPlaying_) {
        player.play();
      }

      if (this.closeable()) {
        this.off(this.el_.ownerDocument, 'keydown', Fn.bind(this, this.handleKeyPress));
      }

      player.controls(true);
      this.hide();
      this.el().setAttribute('aria-hidden', 'true');
      this.trigger('modalclose');

      if (this.options_.temporary) {
        this.dispose();
      }
    }
    return this;
  };

  /**
   * Whether or not the modal is closeable via the UI.
   *
   * @method closeable
   * @param  {Boolean} [value]
   *         If given as a Boolean, it will set the `closeable` option.
   *
   * @return {Boolean}
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
   *
   * The content element will be emptied before this change takes place.
   *
   * @method fill
   * @return {ModalDialog}
   */


  ModalDialog.prototype.fill = function fill() {
    return this.fillWith(this.content());
  };

  /**
   * Fill the modal's content element with arbitrary content.
   *
   * The content element will be emptied before this change takes place.
   *
   * @method fillWith
   * @param  {Mixed} [content]
   *         The same rules apply to this as apply to the `content` option.
   *
   * @return {ModalDialog}
   */


  ModalDialog.prototype.fillWith = function fillWith(content) {
    var contentEl = this.contentEl();
    var parentEl = contentEl.parentNode;
    var nextSiblingEl = contentEl.nextSibling;

    this.trigger('beforemodalfill');
    this.hasBeenFilled_ = true;

    // Detach the content element from the DOM before performing
    // manipulation to avoid modifying the live DOM multiple times.
    parentEl.removeChild(contentEl);
    this.empty();
    Dom.insertContent(contentEl, content);
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
   * Empties the content element.
   *
   * This happens automatically anytime the modal is filled.
   *
   * @method empty
   * @return {ModalDialog}
   */


  ModalDialog.prototype.empty = function empty() {
    this.trigger('beforemodalempty');
    Dom.emptyEl(this.contentEl());
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
   * @method content
   * @param  {Mixed} [value]
   *         If defined, sets the internal content value to be used on the
   *         next call(s) to `fill`. This value is normalized before being
   *         inserted. To "clear" the internal content value, pass `null`.
   *
   * @return {Mixed}
   */


  ModalDialog.prototype.content = function content(value) {
    if (typeof value !== 'undefined') {
      this.content_ = value;
    }
    return this.content_;
  };

  return ModalDialog;
}(_component2['default']);

/*
 * Modal dialog default options.
 *
 * @type {Object}
 * @private
 */


ModalDialog.prototype.options_ = {
  temporary: true
};

_component2['default'].registerComponent('ModalDialog', ModalDialog);
exports['default'] = ModalDialog;

},{"5":5,"80":80,"82":82}],51:[function(_dereq_,module,exports){
'use strict';

exports.__esModule = true;

var _component = _dereq_(5);

var _component2 = _interopRequireDefault(_component);

var _document = _dereq_(92);

var _document2 = _interopRequireDefault(_document);

var _window = _dereq_(93);

var _window2 = _interopRequireDefault(_window);

var _events = _dereq_(81);

var Events = _interopRequireWildcard(_events);

var _dom = _dereq_(80);

var Dom = _interopRequireWildcard(_dom);

var _fn = _dereq_(82);

var Fn = _interopRequireWildcard(_fn);

var _guid = _dereq_(84);

var Guid = _interopRequireWildcard(_guid);

var _browser = _dereq_(78);

var browser = _interopRequireWildcard(_browser);

var _log = _dereq_(85);

var _log2 = _interopRequireDefault(_log);

var _toTitleCase = _dereq_(89);

var _toTitleCase2 = _interopRequireDefault(_toTitleCase);

var _timeRanges = _dereq_(88);

var _buffer = _dereq_(79);

var _stylesheet = _dereq_(87);

var stylesheet = _interopRequireWildcard(_stylesheet);

var _fullscreenApi = _dereq_(44);

var _fullscreenApi2 = _interopRequireDefault(_fullscreenApi);

var _mediaError = _dereq_(46);

var _mediaError2 = _interopRequireDefault(_mediaError);

var _tuple = _dereq_(145);

var _tuple2 = _interopRequireDefault(_tuple);

var _object = _dereq_(136);

var _object2 = _interopRequireDefault(_object);

var _mergeOptions = _dereq_(86);

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


var TECH_EVENTS_RETRIGGER = [
/**
 * Fired while the user agent is downloading media data
 *
 * @private
 * @method Player.prototype.handleTechProgress_
 */
'progress',
/**
 * Fires when the loading of an audio/video is aborted
 *
 * @private
 * @method Player.prototype.handleTechAbort_
 */
'abort',
/**
 * Fires when the browser is intentionally not getting media data
 *
 * @private
 * @method Player.prototype.handleTechSuspend_
 */
'suspend',
/**
 * Fires when the current playlist is empty
 *
 * @private
 * @method Player.prototype.handleTechEmptied_
 */
'emptied',
/**
 * Fires when the browser is trying to get media data, but data is not available
 *
 * @private
 * @method Player.prototype.handleTechStalled_
 */
'stalled',
/**
 * Fires when the browser has loaded meta data for the audio/video
 *
 * @private
 * @method Player.prototype.handleTechLoadedmetadata_
 */
'loadedmetadata',
/**
 * Fires when the browser has loaded the current frame of the audio/video
 *
 * @private
 * @method Player.prototype.handleTechLoaddeddata_
 */
'loadeddata',
/**
 * Fires when the current playback position has changed
 *
 * @private
 * @method Player.prototype.handleTechTimeUpdate_
 */
'timeupdate',
/**
 * Fires when the playing speed of the audio/video is changed
 *
 * @private
 * @method Player.prototype.handleTechRatechange_
 */
'ratechange',
/**
 * Fires when the volume has been changed
 *
 * @private
 * @method Player.prototype.handleTechVolumechange_
 */
'volumechange',
/**
 * Fires when the text track has been changed
 *
 * @private
 * @method Player.prototype.handleTechTexttrackchange_
 */
'texttrackchange'];

/**
 * An instance of the `Player` class is created when any of the Video.js setup methods are used to initialize a video.
 * ```js
 * var myPlayer = videojs('example_video_1');
 * ```
 * In the following example, the `data-setup` attribute tells the Video.js library to create a player instance when the library is ready.
 * ```html
 * <video id="example_video_1" data-setup='{}' controls>
 *   <source src="my-source.mp4" type="video/mp4">
 * </video>
 * ```
 * After an instance has been created it can be accessed globally using `Video('example_video_1')`.
 *
 * @param {Element} tag        The original video tag used for configuring options
 * @param {Object=} options    Object of option names and values
 * @param {Function=} ready    Ready callback function
 * @class Player
 */

var Player = function (_Component) {
  _inherits(Player, _Component);

  function Player(tag, options, ready) {
    _classCallCheck(this, Player);

    // Make sure tag ID exists
    tag.id = tag.id || 'vjs_video_' + Guid.newGUID();

    // Set Options
    // The options argument overrides options set in the video tag
    // which overrides globally set options.
    // This latter part coincides with the load order
    // (tag must exist before Player)
    options = (0, _object2['default'])(Player.getTagSettings(tag), options);

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
      (function () {
        // Normalise player option languages to lowercase
        var languagesToLower = {};

        Object.getOwnPropertyNames(options.languages).forEach(function (name) {
          languagesToLower[name.toLowerCase()] = options.languages[name];
        });
        _this.languages_ = languagesToLower;
      })();
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
      (function () {
        var plugins = options.plugins;

        Object.getOwnPropertyNames(plugins).forEach(function (name) {
          if (typeof this[name] === 'function') {
            this[name](plugins[name]);
          } else {
            _log2['default'].error('Unable to find plugin:', name);
          }
        }, _this);
      })();
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
   * Destroys the video player and does any necessary cleanup
   * ```js
   *     myPlayer.dispose();
   * ```
   * This is especially helpful if you are dynamically adding and removing videos
   * to/from the DOM.
   */


  Player.prototype.dispose = function dispose() {
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
   * Create the component's DOM element
   *
   * @return {Element}
   */


  Player.prototype.createEl = function createEl() {
    var el = this.el_ = _Component.prototype.createEl.call(this, 'div');
    var tag = this.tag;

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
        el.className = attrs[attr];
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
    if (tag.parentNode) {
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
   * Get/set player width
   *
   * @param {Number=} value Value for width
   * @return {Number} Width when getting
   */


  Player.prototype.width = function width(value) {
    return this.dimension('width', value);
  };

  /**
   * Get/set player height
   *
   * @param {Number=} value Value for height
   * @return {Number} Height when getting
   */


  Player.prototype.height = function height(value) {
    return this.dimension('height', value);
  };

  /**
   * Get/set dimension for player
   *
   * @param {String} dimension Either width or height
   * @param {Number=} value Value for dimension
   * @return {Component}
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
   * Add/remove the vjs-fluid class
   *
   * @param {Boolean} bool Value of true adds the class, value of false removes the class
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
  };

  /**
   * Get/Set the aspect ratio
   *
   * @param {String=} ratio Aspect ratio for player
   * @return aspectRatio
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
   * Update styles of the player element (height, width and aspect ratio)
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
    } else if (this.videoWidth()) {
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
   * Load the Media Playback Technology (tech)
   * Load/Create an instance of playback technology including element and API methods
   * And append playback element in player div.
   *
   * @param {String} techName Name of the playback technology
   * @param {String} source Video source
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
    var techOptions = (0, _object2['default'])({
      source: source,
      'nativeControlsForTouch': this.options_.nativeControlsForTouch,
      'playerId': this.id(),
      'techId': this.id() + '_' + techName + '_api',
      'videoTracks': this.videoTracks_,
      'textTracks': this.textTracks_,
      'audioTracks': this.audioTracks_,
      'autoplay': this.options_.autoplay,
      'preload': this.options_.preload,
      'loop': this.options_.loop,
      'muted': this.options_.muted,
      'poster': this.poster(),
      'language': this.language(),
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
   * Unload playback technology
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
   * Return a reference to the current tech.
   * It will only return a reference to the tech if given an object with the
   * `IWillNotUseThisInPlugins` property on it. This is try and prevent misuse
   * of techs by plugins.
   *
   * @param {Object}
   * @return {Object} The Tech
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
   * On desktops, a click on the video itself will toggle playback,
   * on a mobile device a click on the video toggles controls.
   * (toggling controls is done by toggling the user state between active and
   * inactive)
   * A tap can signal that a user has become active, or has become inactive
   * e.g. a quick tap on an iPhone movie should reveal the controls. Another
   * quick tap should hide them again (signaling the user is in an inactive
   * viewing state)
   * In addition to this, we still want the user to be considered inactive after
   * a few seconds of inactivity.
   * Note: the only part of iOS interaction we can't mimic with this setup
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
   * Fired when the user agent begins looking for media data
   *
   * @event loadstart
   * @private
   */


  Player.prototype.handleTechLoadStart_ = function handleTechLoadStart_() {
    // TODO: Update to use `emptied` event instead. See #1277.

    this.removeClass('vjs-ended');

    // reset the error state
    this.error(null);

    // If it's already playing we want to trigger a firstplay event now.
    // The firstplay event relies on both the play and loadstart events
    // which can happen in any order for a new source
    if (!this.paused()) {
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
   * @param {Boolean} hasStarted The value of true adds the class the value of false remove the class
   * @return {Boolean} Boolean value if has started
   * @private
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
   * @private
   */


  Player.prototype.handleTechPlay_ = function handleTechPlay_() {
    this.removeClass('vjs-ended');
    this.removeClass('vjs-paused');
    this.addClass('vjs-playing');

    // hide the poster when the user hits play
    // https://html.spec.whatwg.org/multipage/embedded-content.html#dom-media-play
    this.hasStarted(true);

    this.trigger('play');
  };

  /**
   * Fired whenever the media begins waiting
   *
   * @private
   */


  Player.prototype.handleTechWaiting_ = function handleTechWaiting_() {
    var _this3 = this;

    this.addClass('vjs-waiting');
    this.trigger('waiting');
    this.one('timeupdate', function () {
      return _this3.removeClass('vjs-waiting');
    });
  };

  /**
   * A handler for events that signal that waiting has ended
   * which is not consistent between browsers. See #1351
   *
   * @private
   */


  Player.prototype.handleTechCanPlay_ = function handleTechCanPlay_() {
    this.removeClass('vjs-waiting');
    this.trigger('canplay');
  };

  /**
   * A handler for events that signal that waiting has ended
   * which is not consistent between browsers. See #1351
   *
   * @private
   */


  Player.prototype.handleTechCanPlayThrough_ = function handleTechCanPlayThrough_() {
    this.removeClass('vjs-waiting');
    this.trigger('canplaythrough');
  };

  /**
   * A handler for events that signal that waiting has ended
   * which is not consistent between browsers. See #1351
   *
   * @private
   */


  Player.prototype.handleTechPlaying_ = function handleTechPlaying_() {
    this.removeClass('vjs-waiting');
    this.trigger('playing');
  };

  /**
   * Fired whenever the player is jumping to a new time
   *
   * @private
   */


  Player.prototype.handleTechSeeking_ = function handleTechSeeking_() {
    this.addClass('vjs-seeking');
    this.trigger('seeking');
  };

  /**
   * Fired when the player has finished jumping to a new time
   *
   * @private
   */


  Player.prototype.handleTechSeeked_ = function handleTechSeeked_() {
    this.removeClass('vjs-seeking');
    this.trigger('seeked');
  };

  /**
   * Fired the first time a video is played
   * Not part of the HLS spec, and we're not sure if this is the best
   * implementation yet, so use sparingly. If you don't have a reason to
   * prevent playback, use `myPlayer.one('play');` instead.
   *
   * @private
   */


  Player.prototype.handleTechFirstPlay_ = function handleTechFirstPlay_() {
    // If the first starttime attribute is specified
    // then we will start at the given offset in seconds
    if (this.options_.starttime) {
      this.currentTime(this.options_.starttime);
    }

    this.addClass('vjs-has-started');
    this.trigger('firstplay');
  };

  /**
   * Fired whenever the media has been paused
   *
   * @private
   */


  Player.prototype.handleTechPause_ = function handleTechPause_() {
    this.removeClass('vjs-playing');
    this.addClass('vjs-paused');
    this.trigger('pause');
  };

  /**
   * Fired when the end of the media resource is reached (currentTime == duration)
   *
   * @event ended
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

    this.trigger('ended');
  };

  /**
   * Fired when the duration of the media resource is first known or changed
   *
   * @private
   */


  Player.prototype.handleTechDurationChange_ = function handleTechDurationChange_() {
    this.duration(this.techGet_('duration'));
  };

  /**
   * Handle a click on the media element to play/pause
   *
   * @param {Object=} event Event object
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
   * @private
   */


  Player.prototype.handleTechTap_ = function handleTechTap_() {
    this.userActive(!this.userActive());
  };

  /**
   * Handle touch to start
   *
   * @private
   */


  Player.prototype.handleTechTouchStart_ = function handleTechTouchStart_() {
    this.userWasActive = this.userActive();
  };

  /**
   * Handle touch to move
   *
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
   */


  Player.prototype.handleStageClick_ = function handleStageClick_() {
    this.reportUserActivity();
  };

  /**
   * Handle Tech Fullscreen Change
   *
   * @private
   */


  Player.prototype.handleTechFullscreenChange_ = function handleTechFullscreenChange_(event, data) {
    if (data) {
      this.isFullscreen(data.isFullscreen);
    }
    this.trigger('fullscreenchange');
  };

  /**
   * Fires when an error occurred during the loading of an audio/video
   *
   * @private
   */


  Player.prototype.handleTechError_ = function handleTechError_() {
    var error = this.tech_.error();

    this.error(error);
  };

  Player.prototype.handleTechTextData_ = function handleTechTextData_() {
    var data = null;

    if (arguments.length > 1) {
      data = arguments[1];
    }
    this.trigger('textdata', data);
  };

  /**
   * Get object for cached values.
   *
   * @return {Object}
   */


  Player.prototype.getCache = function getCache() {
    return this.cache_;
  };

  /**
   * Pass values to the playback tech
   *
   * @param {String=} method Method
   * @param {Object=} arg Argument
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
   * @param {String} method Tech method
   * @return {Method}
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
   * ```js
   *     myPlayer.play();
   * ```
   *
   * @return {Player} self
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
   * ```js
   *     myPlayer.pause();
   * ```
   *
   * @return {Player} self
   */


  Player.prototype.pause = function pause() {
    this.techCall_('pause');
    return this;
  };

  /**
   * Check if the player is paused
   * ```js
   *     var isPaused = myPlayer.paused();
   *     var isPlaying = !myPlayer.paused();
   * ```
   *
   * @return {Boolean} false if the media is currently playing, or true otherwise
   */


  Player.prototype.paused = function paused() {
    // The initial state of paused should be true (in Safari it's actually false)
    return this.techGet_('paused') === false ? false : true;
  };

  /**
   * Returns whether or not the user is "scrubbing". Scrubbing is when the user
   * has clicked the progress bar handle and is dragging it along the progress bar.
   *
   * @param  {Boolean} isScrubbing   True/false the user is scrubbing
   * @return {Boolean}               The scrubbing status when getting
   * @return {Object}                The player when setting
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
   * ```js
   *     // get
   *     var whereYouAt = myPlayer.currentTime();
   *     // set
   *     myPlayer.currentTime(120); // 2 minutes into the video
   * ```
   *
   * @param  {Number|String=} seconds The time to seek to
   * @return {Number}        The time in seconds, when not setting
   * @return {Player}    self, when the current time is set
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
   * ```js
   *     var lengthOfVideo = myPlayer.duration();
   * ```
   * **NOTE**: The video must have started loading before the duration can be
   * known, and in the case of Flash, may not be known until the video starts
   * playing.
   *
   * @param {Number} seconds Duration when setting
   * @return {Number} The duration of the video in seconds when getting
   */


  Player.prototype.duration = function duration(seconds) {
    if (seconds === undefined) {
      return this.cache_.duration || 0;
    }

    seconds = parseFloat(seconds) || 0;

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

      this.trigger('durationchange');
    }

    return this;
  };

  /**
   * Calculates how much time is left.
   * ```js
   *     var timeLeft = myPlayer.remainingTime();
   * ```
   * Not a native video element function, but useful
   *
   * @return {Number} The time remaining in seconds
   */


  Player.prototype.remainingTime = function remainingTime() {
    return this.duration() - this.currentTime();
  };

  // http://dev.w3.org/html5/spec/video.html#dom-media-buffered
  // Buffered returns a timerange object.
  // Kind of like an array of portions of the video that have been downloaded.

  /**
   * Get a TimeRange object with the times of the video that have been downloaded
   * If you just want the percent of the video that's been downloaded,
   * use bufferedPercent.
   * ```js
   *     // Number of different ranges of time have been buffered. Usually 1.
   *     numberOfRanges = bufferedTimeRange.length,
   *     // Time in seconds when the first range starts. Usually 0.
   *     firstRangeStart = bufferedTimeRange.start(0),
   *     // Time in seconds when the first range ends
   *     firstRangeEnd = bufferedTimeRange.end(0),
   *     // Length in seconds of the first time range
   *     firstRangeLength = firstRangeEnd - firstRangeStart;
   * ```
   *
   * @return {Object} A mock TimeRange object (following HTML spec)
   */


  Player.prototype.buffered = function buffered() {
    var buffered = this.techGet_('buffered');

    if (!buffered || !buffered.length) {
      buffered = (0, _timeRanges.createTimeRange)(0, 0);
    }

    return buffered;
  };

  /**
   * Get the percent (as a decimal) of the video that's been downloaded
   * ```js
   *     var howMuchIsDownloaded = myPlayer.bufferedPercent();
   * ```
   * 0 means none, 1 means all.
   * (This method isn't in the HTML5 spec, but it's very convenient)
   *
   * @return {Number} A decimal between 0 and 1 representing the percent
   */


  Player.prototype.bufferedPercent = function bufferedPercent() {
    return (0, _buffer.bufferedPercent)(this.buffered(), this.duration());
  };

  /**
   * Get the ending time of the last buffered time range
   * This is used in the progress bar to encapsulate all time ranges.
   *
   * @return {Number} The end of the last buffered time range
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
   * ```js
   *     // get
   *     var howLoudIsIt = myPlayer.volume();
   *     // set
   *     myPlayer.volume(0.5); // Set volume to half
   * ```
   * 0 is off (muted), 1.0 is all the way up, 0.5 is half way.
   *
   * @param  {Number} percentAsDecimal The new volume as a decimal percent
   * @return {Number}              The current volume when getting
   * @return {Player}              self when setting
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
   * ```js
   *     // get
   *     var isVolumeMuted = myPlayer.muted();
   *     // set
   *     myPlayer.muted(true); // mute the volume
   * ```
   *
   * @param  {Boolean=} muted True to mute, false to unmute
   * @return {Boolean} True if mute is on, false if not when getting
   * @return {Player} self when setting mute
   */


  Player.prototype.muted = function muted(_muted) {
    if (_muted !== undefined) {
      this.techCall_('setMuted', _muted);
      return this;
    }
    return this.techGet_('muted') || false;
  };

  // Check if current tech can support native fullscreen
  // (e.g. with built in controls like iOS, so not our flash swf)
  /**
   * Check to see if fullscreen is supported
   *
   * @return {Boolean}
   */


  Player.prototype.supportsFullScreen = function supportsFullScreen() {
    return this.techGet_('supportsFullScreen') || false;
  };

  /**
   * Check if the player is in fullscreen mode
   * ```js
   *     // get
   *     var fullscreenOrNot = myPlayer.isFullscreen();
   *     // set
   *     myPlayer.isFullscreen(true); // tell the player it's in fullscreen
   * ```
   * NOTE: As of the latest HTML5 spec, isFullscreen is no longer an official
   * property and instead document.fullscreenElement is used. But isFullscreen is
   * still a valuable property for internal player workings.
   *
   * @param  {Boolean=} isFS Update the player's fullscreen state
   * @return {Boolean} true if fullscreen false if not when getting
   * @return {Player} self when setting
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
   * ```js
   *     myPlayer.requestFullscreen();
   * ```
   * In some browsers, full screen is not supported natively, so it enters
   * "full window mode", where the video fills the browser window.
   * In browsers and devices that support native full screen, sometimes the
   * browser's default controls will be shown, and not the Video.js custom skin.
   * This includes most mobile devices (iOS, Android) and older versions of
   * Safari.
   *
   * @return {Player} self
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
      this.trigger('fullscreenchange');
    }

    return this;
  };

  /**
   * Return the video to its normal size after having been in full screen mode
   * ```js
   *     myPlayer.exitFullscreen();
   * ```
   *
   * @return {Player} self
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
      this.trigger('fullscreenchange');
    }

    return this;
  };

  /**
   * When fullscreen isn't supported we can stretch the video container to as wide as the browser will let us.
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

    this.trigger('enterFullWindow');
  };

  /**
   * Check for call to either exit full window or full screen on ESC key
   *
   * @param {String} event Event to check for key press
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
    this.trigger('exitFullWindow');
  };

  /**
   * Check whether the player can play a given mimetype
   *
   * @param {String} type The mimetype to check
   * @return {String} 'probably', 'maybe', or '' (empty string)
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
   * @param {Array} sources The sources for a media asset
   * @return {Object|Boolean} Object of source and tech order, otherwise false
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
   * **URL String**: A URL to the the video file. Use this method if you are sure
   * the current playback technology (HTML5/Flash) can support the source you
   * provide. Currently only MP4 files can be used in both HTML5 and Flash.
   * ```js
   *     myPlayer.src("http://www.example.com/path/to/video.mp4");
   * ```
   * **Source Object (or element):* * A javascript object containing information
   * about the source file. Use this method if you want the player to determine if
   * it can support the file using the type information.
   * ```js
   *     myPlayer.src({ type: "video/mp4", src: "http://www.example.com/path/to/video.mp4" });
   * ```
   * **Array of Source Objects:* * To provide multiple versions of the source so
   * that it can be played using HTML5 across browsers you can use an array of
   * source objects. Video.js will detect which version is supported and load that
   * file.
   * ```js
   *     myPlayer.src([
   *       { type: "video/mp4", src: "http://www.example.com/path/to/video.mp4" },
   *       { type: "video/webm", src: "http://www.example.com/path/to/video.webm" },
   *       { type: "video/ogg", src: "http://www.example.com/path/to/video.ogv" }
   *     ]);
   * ```
   *
   * @param  {String|Object|Array=} source The source URL, object, or array of sources
   * @return {String} The current video source when getting
   * @return {String} The player when setting
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
   * @param  {Array} sources Array of source objects
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
   * @return {Player} Returns the player
   */


  Player.prototype.load = function load() {
    this.techCall_('load');
    return this;
  };

  /**
   * Reset the player. Loads the first tech in the techOrder,
   * and calls `reset` on the tech`.
   *
   * @return {Player} Returns the player
   */


  Player.prototype.reset = function reset() {
    this.loadTech_((0, _toTitleCase2['default'])(this.options_.techOrder[0]), null);
    this.techCall_('reset');
    return this;
  };

  /**
   * Returns the fully qualified URL of the current source value e.g. http://mysite.com/video.mp4
   * Can be used in conjuction with `currentType` to assist in rebuilding the current source object.
   *
   * @return {String} The current source
   */


  Player.prototype.currentSrc = function currentSrc() {
    return this.techGet_('currentSrc') || this.cache_.src || '';
  };

  /**
   * Get the current source type e.g. video/mp4
   * This can allow you rebuild the current source object so that you could load the same
   * source and tech later
   *
   * @return {String} The source MIME type
   */


  Player.prototype.currentType = function currentType() {
    return this.currentType_ || '';
  };

  /**
   * Get or set the preload attribute
   *
   * @param {Boolean} value Boolean to determine if preload should be used
   * @return {String} The preload attribute value when getting
   * @return {Player} Returns the player when setting
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
   * @param {Boolean} value Boolean to determine if video should autoplay
   * @return {String} The autoplay attribute value when getting
   * @return {Player} Returns the player when setting
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
   * Get or set the loop attribute on the video element.
   *
   * @param {Boolean} value Boolean to determine if video should loop
   * @return {String} The loop attribute value when getting
   * @return {Player} Returns the player when setting
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
   * ##### EXAMPLE:
   * ```js
   *     // get
   *     var currentPoster = myPlayer.poster();
   *     // set
   *     myPlayer.poster('http://example.com/myImage.jpg');
   * ```
   *
   * @param  {String=} src Poster image source URL
   * @return {String} poster URL when getting
   * @return {Player} self when setting
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
   * @param  {Boolean} bool Set controls to showing or not
   * @return {Boolean}    Controls are showing
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
          this.trigger('controlsenabled');

          if (!this.usingNativeControls()) {
            this.addTechControlsListeners_();
          }
        } else {
          this.removeClass('vjs-controls-enabled');
          this.addClass('vjs-controls-disabled');
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
   * @param  {Boolean} bool    True signals that native controls are on
   * @return {Player}      Returns the player
   * @private
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
            * @event usingnativecontrols
            * @memberof Player
            * @instance
            * @private
            */
          this.trigger('usingnativecontrols');
        } else {
          this.removeClass('vjs-using-native-controls');

          /**
            * player is using the custom HTML controls
           *
            * @event usingcustomcontrols
            * @memberof Player
            * @instance
            * @private
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
   * @param  {*} err A MediaError or a String/Number to be turned into a MediaError
   * @return {MediaError|null}     when getting
   * @return {Player}              when setting
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

    // fire an error event on the player
    this.trigger('error');

    return this;
  };

  /**
   * Report user activity
   *
   * @param {Object} event Event object
   */


  Player.prototype.reportUserActivity = function reportUserActivity(event) {
    this.userActivity_ = true;
  };

  /**
   * Get/set if user is active
   *
   * @param {Boolean} bool Value when setting
   * @return {Boolean} Value if user is active user when getting
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
   * Gets or sets the current playback rate.  A playback rate of
   * 1.0 represents normal speed and 0.5 would indicate half-speed
   * playback, for instance.
   * @see https://html.spec.whatwg.org/multipage/embedded-content.html#dom-media-playbackrate
   *
   * @param  {Number} rate    New playback rate to set.
   * @return {Number}         Returns the new playback rate when setting
   * @return {Number}         Returns the current playback rate when getting
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
   * @param  {Boolean} bool    True signals that this is an audio player.
   * @return {Boolean}         Returns true if player is audio, false if not when getting
   * @return {Player}      Returns the player if setting
   * @private
   */


  Player.prototype.isAudio = function isAudio(bool) {
    if (bool !== undefined) {
      this.isAudio_ = !!bool;
      return this;
    }

    return !!this.isAudio_;
  };

  /**
   * Get a video track list
   * @link https://html.spec.whatwg.org/multipage/embedded-content.html#videotracklist
   *
   * @return {VideoTrackList} thes current video track list
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
   * Get an audio track list
   * @link https://html.spec.whatwg.org/multipage/embedded-content.html#audiotracklist
   *
   * @return {AudioTrackList} thes current audio track list
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
   * Text tracks are tracks of timed text events.
   * Captions - text displayed over the video for the hearing impaired
   * Subtitles - text displayed over the video for those who don't understand language in the video
   * Chapters - text displayed in a menu allowing the user to jump to particular points (chapters) in the video
   * Descriptions (not supported yet) - audio descriptions that are read back to the user by a screen reading device
   */

  /**
   * Get an array of associated text tracks. captions, subtitles, chapters, descriptions
   * http://www.w3.org/html/wg/drafts/html/master/embedded-content-0.html#dom-media-texttracks
   *
   * @return {Array}           Array of track objects
   */


  Player.prototype.textTracks = function textTracks() {
    // cannot use techGet_ directly because it checks to see whether the tech is ready.
    // Flash is unlikely to be ready in time but textTracks should still work.
    if (this.tech_) {
      return this.tech_.textTracks();
    }
  };

  /**
   * Get an array of remote text tracks
   *
   * @return {Array}
   */


  Player.prototype.remoteTextTracks = function remoteTextTracks() {
    if (this.tech_) {
      return this.tech_.remoteTextTracks();
    }
  };

  /**
   * Get an array of remote html track elements
   *
   * @return {HTMLTrackElement[]}
   */


  Player.prototype.remoteTextTrackEls = function remoteTextTrackEls() {
    if (this.tech_) {
      return this.tech_.remoteTextTrackEls();
    }
  };

  /**
   * Add a text track
   * In addition to the W3C settings we allow adding additional info through options.
   * http://www.w3.org/html/wg/drafts/html/master/embedded-content-0.html#dom-media-addtexttrack
   *
   * @param {String}  kind        Captions, subtitles, chapters, descriptions, or metadata
   * @param {String=} label       Optional label
   * @param {String=} language    Optional language
   */


  Player.prototype.addTextTrack = function addTextTrack(kind, label, language) {
    if (this.tech_) {
      return this.tech_.addTextTrack(kind, label, language);
    }
  };

  /**
   * Add a remote text track
   *
   * @param {Object} options    Options for remote text track
   */


  Player.prototype.addRemoteTextTrack = function addRemoteTextTrack(options) {
    if (this.tech_) {
      return this.tech_.addRemoteTextTrack(options);
    }
  };

  /**
   * Remove a remote text track
   *
   * @param {Object} track    Remote text track to remove
   */
  // destructure the input into an object with a track argument, defaulting to arguments[0]
  // default the whole argument to an empty object if nothing was passed in


  Player.prototype.removeRemoteTextTrack = function removeRemoteTextTrack() {
    var _ref3 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
        _ref3$track = _ref3.track,
        track = _ref3$track === undefined ? arguments[0] : _ref3$track;

    if (this.tech_) {
      return this.tech_.removeRemoteTextTrack(track);
    }
  };

  /**
   * Get video width
   *
   * @return {Number} Video width
   */


  Player.prototype.videoWidth = function videoWidth() {
    return this.tech_ && this.tech_.videoWidth && this.tech_.videoWidth() || 0;
  };

  /**
   * Get video height
   *
   * @return {Number} Video height
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
   * @param {String} code  The locale string
   * @return {String}      The locale string when getting
   * @return {Player}      self when setting
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
   * @return {Array} Array of languages
   */


  Player.prototype.languages = function languages() {
    return (0, _mergeOptions2['default'])(Player.prototype.options_.languages, this.languages_);
  };

  /**
   * Converts track info to JSON
   *
   * @return {Object} JSON object of options
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
   * Creates a simple modal dialog (an instance of the `ModalDialog`
   * component) that immediately overlays the player with arbitrary
   * content and removes itself when closed.
   *
   * @param {String|Function|Element|Array|Null} content
   *        Same as `ModalDialog#content`'s param of the same name.
   *
   *        The most straight-forward usage is to provide a string or DOM
   *        element.
   *
   * @param {Object} [options]
   *        Extra options which will be passed on to the `ModalDialog`.
   *
   * @return {ModalDialog}
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
   * @param {Element} tag The player tag
   * @return {Array} An array of sources and track objects
   * @static
   */


  Player.getTagSettings = function getTagSettings(tag) {
    var baseOptions = {
      sources: [],
      tracks: []
    };

    var tagOptions = Dom.getElAttributes(tag);
    var dataSetup = tagOptions['data-setup'];

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
      (0, _object2['default'])(tagOptions, data);
    }

    (0, _object2['default'])(baseOptions, tagOptions);

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
   * @return {Boolean} wether or not flexbox is supported
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

/*
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
 * @method Player.prototype.ended
 */
'ended',
/**
 * Returns whether or not the player is in the "seeking" state.
 *
 * @return {Boolean} True if the player is in the seeking state, false if not.
 * @method Player.prototype.seeking
 */
'seeking',
/**
 * Returns the TimeRanges of the media that are currently available
 * for seeking to.
 *
 * @return {TimeRanges} the seekable intervals of the media timeline
 * @method Player.prototype.seekable
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
 * @return {Number} the current network activity state
 * @method Player.prototype.networkState
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
 * @return {Number} the current playback rendering state
 * @method Player.prototype.readyState
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

/* document methods */
/**
 * Fired when the player has initial duration and dimension information
 *
 * @event loadedmetadata
 * @private
 * @method Player.prototype.handleLoadedMetaData_
 */

/**
 * Fired when the player receives text data
 *
 * @event textdata
 * @private
 * @method Player.prototype.handleTextData_
 */

/**
 * Fired when the player has downloaded data at the current playback position
 *
 * @event loadeddata
 * @private
 * @method Player.prototype.handleLoadedData_
 */

/**
 * Fired when the user is active, e.g. moves the mouse over the player
 *
 * @event useractive
 * @private
 * @method Player.prototype.handleUserActive_
 */

/**
 * Fired when the user is inactive, e.g. a short delay after the last mouse move or control interaction
 *
 * @event userinactive
 * @private
 * @method Player.prototype.handleUserInactive_
 */

/**
 * Fired when the current playback position has changed *
 * During playback this is fired every 15-250 milliseconds, depending on the
 * playback technology in use.
 *
 * @event timeupdate
 * @private
 * @method Player.prototype.handleTimeUpdate_
 */

/**
 * Fired when the volume changes
 *
 * @event volumechange
 * @private
 * @method Player.prototype.handleVolumeChange_
 */

/**
 * Fired when an error occurs
 *
 * @event error
 * @private
 * @method Player.prototype.handleError_
 */

_component2['default'].registerComponent('Player', Player);
exports['default'] = Player;

},{"1":1,"136":136,"145":145,"4":4,"41":41,"44":44,"45":45,"46":46,"5":5,"50":50,"55":55,"59":59,"60":60,"61":61,"62":62,"63":63,"68":68,"69":69,"71":71,"76":76,"78":78,"79":79,"8":8,"80":80,"81":81,"82":82,"84":84,"85":85,"86":86,"87":87,"88":88,"89":89,"92":92,"93":93}],52:[function(_dereq_,module,exports){
'use strict';

exports.__esModule = true;

var _player = _dereq_(51);

var _player2 = _interopRequireDefault(_player);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

/**
 * The method for registering a video.js plugin
 *
 * @param  {String} name The name of the plugin
 * @param  {Function} init The function that is run when the player inits
 * @method plugin
 */
var plugin = function plugin(name, init) {
  _player2['default'].prototype[name] = init;
}; /**
    * @file plugins.js
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
 * A button class with a popup control
 *
 * @param {Player|Object} player
 * @param {Object=} options
 * @extends ClickableComponent
 * @class PopupButton
 */
var PopupButton = function (_ClickableComponent) {
  _inherits(PopupButton, _ClickableComponent);

  function PopupButton(player) {
    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    _classCallCheck(this, PopupButton);

    var _this = _possibleConstructorReturn(this, _ClickableComponent.call(this, player, options));

    _this.update();
    return _this;
  }

  /**
   * Update popup
   *
   * @method update
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
   * Create popup - Override with specific functionality for component
   *
   * @return {Popup} The constructed popup
   * @method createPopup
   */


  PopupButton.prototype.createPopup = function createPopup() {};

  /**
   * Create the component's DOM element
   *
   * @return {Element}
   * @method createEl
   */


  PopupButton.prototype.createEl = function createEl() {
    return _ClickableComponent.prototype.createEl.call(this, 'div', {
      className: this.buildCSSClass()
    });
  };

  /**
   * Allow sub components to stack CSS class names
   *
   * @return {String} The constructed class name
   * @method buildCSSClass
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

var _dom = _dereq_(80);

var Dom = _interopRequireWildcard(_dom);

var _fn = _dereq_(82);

var Fn = _interopRequireWildcard(_fn);

var _events = _dereq_(81);

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
 * @class Popup
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
   * @param {Object|String} component Component or component type to add
   * @method addItem
   */
  Popup.prototype.addItem = function addItem(component) {
    this.addChild(component);
    component.on('click', Fn.bind(this, function () {
      this.unlockShowing();
    }));
  };

  /**
   * Create the component's DOM element
   *
   * @return {Element}
   * @method createEl
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

},{"5":5,"80":80,"81":81,"82":82}],55:[function(_dereq_,module,exports){
'use strict';

exports.__esModule = true;

var _clickableComponent = _dereq_(3);

var _clickableComponent2 = _interopRequireDefault(_clickableComponent);

var _component = _dereq_(5);

var _component2 = _interopRequireDefault(_component);

var _fn = _dereq_(82);

var Fn = _interopRequireWildcard(_fn);

var _dom = _dereq_(80);

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
 * The component that handles showing the poster image.
 *
 * @param {Player|Object} player
 * @param {Object=} options
 * @extends Button
 * @class PosterImage
 */
var PosterImage = function (_ClickableComponent) {
  _inherits(PosterImage, _ClickableComponent);

  function PosterImage(player, options) {
    _classCallCheck(this, PosterImage);

    var _this = _possibleConstructorReturn(this, _ClickableComponent.call(this, player, options));

    _this.update();
    player.on('posterchange', Fn.bind(_this, _this.update));
    return _this;
  }

  /**
   * Clean up the poster image
   *
   * @method dispose
   */


  PosterImage.prototype.dispose = function dispose() {
    this.player().off('posterchange', this.update);
    _ClickableComponent.prototype.dispose.call(this);
  };

  /**
   * Create the poster's image element
   *
   * @return {Element}
   * @method createEl
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
   * Event handler for updates to the player's poster source
   *
   * @method update
   */


  PosterImage.prototype.update = function update() {
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
   * Set the poster source depending on the display method
   *
   * @param {String} url The URL to the poster source
   * @method setSrc
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
   * Event handler for clicks on the poster image
   *
   * @method handleClick
   */


  PosterImage.prototype.handleClick = function handleClick() {
    // We don't want a click to trigger playback when controls are disabled
    // but CSS should be hiding the poster to prevent that from happening
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

},{"3":3,"5":5,"78":78,"80":80,"82":82}],56:[function(_dereq_,module,exports){
'use strict';

exports.__esModule = true;
exports.hasLoaded = exports.autoSetupTimeout = exports.autoSetup = undefined;

var _events = _dereq_(81);

var Events = _interopRequireWildcard(_events);

var _document = _dereq_(92);

var _document2 = _interopRequireDefault(_document);

var _window = _dereq_(93);

var _window2 = _interopRequireDefault(_window);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

var _windowLoaded = false; /**
                            * @file setup.js
                            *
                            * Functions for automatically setting up a player
                            * based on the data-setup attribute of the video tag
                            */

var videojs = void 0;

// Automatically set up any tags that have a data-setup attribute
var autoSetup = function autoSetup() {
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

// Pause to let the DOM keep processing
function autoSetupTimeout(wait, vjs) {
  if (vjs) {
    videojs = vjs;
  }

  setTimeout(autoSetup, wait);
}

if (_document2['default'].readyState === 'complete') {
  _windowLoaded = true;
} else {
  Events.one(_window2['default'], 'load', function () {
    _windowLoaded = true;
  });
}

var hasLoaded = function hasLoaded() {
  return _windowLoaded;
};

exports.autoSetup = autoSetup;
exports.autoSetupTimeout = autoSetupTimeout;
exports.hasLoaded = hasLoaded;

},{"81":81,"92":92,"93":93}],57:[function(_dereq_,module,exports){
'use strict';

exports.__esModule = true;

var _component = _dereq_(5);

var _component2 = _interopRequireDefault(_component);

var _dom = _dereq_(80);

var Dom = _interopRequireWildcard(_dom);

var _object = _dereq_(136);

var _object2 = _interopRequireDefault(_object);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * @file slider.js
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                */


/**
 * The base functionality for sliders like the volume bar and seek bar
 *
 * @param {Player|Object} player
 * @param {Object=} options
 * @extends Component
 * @class Slider
 */
var Slider = function (_Component) {
  _inherits(Slider, _Component);

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
   * Create the component's DOM element
   *
   * @param {String} type Type of element to create
   * @param {Object=} props List of properties in Object form
   * @return {Element}
   * @method createEl
   */


  Slider.prototype.createEl = function createEl(type) {
    var props = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    var attributes = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

    // Add the slider element class to all sub classes
    props.className = props.className + ' vjs-slider';
    props = (0, _object2['default'])({
      tabIndex: 0
    }, props);

    attributes = (0, _object2['default'])({
      'role': 'slider',
      'aria-valuenow': 0,
      'aria-valuemin': 0,
      'aria-valuemax': 100,
      'tabIndex': 0
    }, attributes);

    return _Component.prototype.createEl.call(this, type, props, attributes);
  };

  /**
   * Handle mouse down on slider
   *
   * @param {Object} event Mouse down event object
   * @method handleMouseDown
   */


  Slider.prototype.handleMouseDown = function handleMouseDown(event) {
    var doc = this.bar.el_.ownerDocument;

    event.preventDefault();
    Dom.blockTextSelection();

    this.addClass('vjs-sliding');
    this.trigger('slideractive');

    this.on(doc, 'mousemove', this.handleMouseMove);
    this.on(doc, 'mouseup', this.handleMouseUp);
    this.on(doc, 'touchmove', this.handleMouseMove);
    this.on(doc, 'touchend', this.handleMouseUp);

    this.handleMouseMove(event);
  };

  /**
   * To be overridden by a subclass
   *
   * @method handleMouseMove
   */


  Slider.prototype.handleMouseMove = function handleMouseMove() {};

  /**
   * Handle mouse up on Slider
   *
   * @method handleMouseUp
   */


  Slider.prototype.handleMouseUp = function handleMouseUp() {
    var doc = this.bar.el_.ownerDocument;

    Dom.unblockTextSelection();

    this.removeClass('vjs-sliding');
    this.trigger('sliderinactive');

    this.off(doc, 'mousemove', this.handleMouseMove);
    this.off(doc, 'mouseup', this.handleMouseUp);
    this.off(doc, 'touchmove', this.handleMouseMove);
    this.off(doc, 'touchend', this.handleMouseUp);

    this.update();
  };

  /**
   * Update slider
   *
   * @method update
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
   * @param {Object} event Event object
   * @method calculateDistance
   */


  Slider.prototype.calculateDistance = function calculateDistance(event) {
    var position = Dom.getPointerPosition(this.el_, event);

    if (this.vertical()) {
      return position.y;
    }
    return position.x;
  };

  /**
   * Handle on focus for slider
   *
   * @method handleFocus
   */


  Slider.prototype.handleFocus = function handleFocus() {
    this.on(this.bar.el_.ownerDocument, 'keydown', this.handleKeyPress);
  };

  /**
   * Handle key press for slider
   *
   * @param {Object} event Event object
   * @method handleKeyPress
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
   * Handle on blur for slider
   *
   * @method handleBlur
   */


  Slider.prototype.handleBlur = function handleBlur() {
    this.off(this.bar.el_.ownerDocument, 'keydown', this.handleKeyPress);
  };

  /**
   * Listener for click events on slider, used to prevent clicks
   *   from bubbling up to parent elements like button menus.
   *
   * @param {Object} event Event object
   * @method handleClick
   */


  Slider.prototype.handleClick = function handleClick(event) {
    event.stopImmediatePropagation();
    event.preventDefault();
  };

  /**
   * Get/set if slider is horizontal for vertical
   *
   * @param {Boolean} bool True if slider is vertical, false is horizontal
   * @return {Boolean} True if slider is vertical, false is horizontal
   * @method vertical
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

},{"136":136,"5":5,"80":80}],58:[function(_dereq_,module,exports){
'use strict';

exports.__esModule = true;
/**
 * @file flash-rtmp.js
 */
function FlashRtmpDecorator(Flash) {
  Flash.streamingFormats = {
    'rtmp/mp4': 'MP4',
    'rtmp/flv': 'FLV'
  };

  Flash.streamFromParts = function (connection, stream) {
    return connection + '&' + stream;
  };

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

  Flash.isStreamingType = function (srcType) {
    return srcType in Flash.streamingFormats;
  };

  // RTMP has four variations, any string starting
  // with one of these protocols should be valid
  Flash.RTMP_RE = /^rtmp[set]?:\/\//i;

  Flash.isStreamingSrc = function (src) {
    return Flash.RTMP_RE.test(src);
  };

  /**
   * A source handler for RTMP urls
   * @type {Object}
   */
  Flash.rtmpSourceHandler = {};

  /**
   * Check if Flash can play the given videotype
   * @param  {String} type    The mimetype to check
   * @return {String}         'probably', 'maybe', or '' (empty string)
   */
  Flash.rtmpSourceHandler.canPlayType = function (type) {
    if (Flash.isStreamingType(type)) {
      return 'maybe';
    }

    return '';
  };

  /**
   * Check if Flash can handle the source natively
   * @param  {Object} source  The source object
   * @param  {Object} options The options passed to the tech
   * @return {String}         'probably', 'maybe', or '' (empty string)
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
   * Pass the source to the flash object
   * Adaptive source handlers will have more complicated workflows before passing
   * video data to the video element
   * @param  {Object} source   The source object
   * @param  {Flash}  tech     The instance of the Flash tech
   * @param  {Object} options  The options to pass to the source
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

var _dom = _dereq_(80);

var Dom = _interopRequireWildcard(_dom);

var _url = _dereq_(90);

var Url = _interopRequireWildcard(_url);

var _timeRanges = _dereq_(88);

var _flashRtmp = _dereq_(58);

var _flashRtmp2 = _interopRequireDefault(_flashRtmp);

var _component = _dereq_(5);

var _component2 = _interopRequireDefault(_component);

var _window = _dereq_(93);

var _window2 = _interopRequireDefault(_window);

var _object = _dereq_(136);

var _object2 = _interopRequireDefault(_object);

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
 * Flash Media Controller - Wrapper for fallback SWF API
 *
 * @param {Object=} options Object of option names and values
 * @param {Function=} ready Ready callback function
 * @extends Tech
 * @class Flash
 */

var Flash = function (_Tech) {
  _inherits(Flash, _Tech);

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
   * Create the component's DOM element
   *
   * @return {Element}
   * @method createEl
   */


  Flash.prototype.createEl = function createEl() {
    var options = this.options_;

    // If video.js is hosted locally you should also set the location
    // for the hosted swf, which should be relative to the page (not video.js)
    // Otherwise this adds a CDN url.
    // The CDN also auto-adds a swf URL for that specific version.
    if (!options.swf) {
      var ver = '5.1.0';

      options.swf = '//vjs.zencdn.net/swf/' + ver + '/video-js.swf';
    }

    // Generate ID for swf object
    var objId = options.techId;

    // Merge default flashvars with ones passed in to init
    var flashVars = (0, _object2['default'])({

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
    var params = (0, _object2['default'])({
      // Opaque is needed to overlay controls, but can affect playback performance
      wmode: 'opaque',
      // Using bgcolor prevents a white flash when the object is loading
      bgcolor: '#000000'
    }, options.params);

    // Merge default attributes with ones passed in
    var attributes = (0, _object2['default'])({
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
   * Play for flash tech
   *
   * @method play
   */


  Flash.prototype.play = function play() {
    if (this.ended()) {
      this.setCurrentTime(0);
    }
    this.el_.vjs_play();
  };

  /**
   * Pause for flash tech
   *
   * @method pause
   */


  Flash.prototype.pause = function pause() {
    this.el_.vjs_pause();
  };

  /**
   * Get/set video
   *
   * @param {Object=} src Source object
   * @return {Object}
   * @method src
   */


  Flash.prototype.src = function src(_src) {
    if (_src === undefined) {
      return this.currentSrc();
    }

    // Setting src through `src` not `setSrc` will be deprecated
    return this.setSrc(_src);
  };

  /**
   * Set video
   *
   * @param {Object=} src Source object
   * @deprecated
   * @method setSrc
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
   * Returns true if the tech is currently seeking.
   * @return {boolean} true if seeking
   */


  Flash.prototype.seeking = function seeking() {
    return this.lastSeekTarget_ !== undefined;
  };

  /**
   * Set current time
   *
   * @param {Number} time Current time of video
   * @method setCurrentTime
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
   * Get current time
   *
   * @param {Number=} time Current time of video
   * @return {Number} Current time
   * @method currentTime
   */


  Flash.prototype.currentTime = function currentTime(time) {
    // when seeking make the reported time keep up with the requested time
    // by reading the time we're seeking to
    if (this.seeking()) {
      return this.lastSeekTarget_ || 0;
    }
    return this.el_.vjs_getProperty('currentTime');
  };

  /**
   * Get current source
   *
   * @method currentSrc
   */


  Flash.prototype.currentSrc = function currentSrc() {
    if (this.currentSource_) {
      return this.currentSource_.src;
    }
    return this.el_.vjs_getProperty('currentSrc');
  };

  /**
   * Get media duration
   *
   * @returns {Number} Media duration
   */


  Flash.prototype.duration = function duration() {
    if (this.readyState() === 0) {
      return NaN;
    }
    var duration = this.el_.vjs_getProperty('duration');

    return duration >= 0 ? duration : Infinity;
  };

  /**
   * Load media into player
   *
   * @method load
   */


  Flash.prototype.load = function load() {
    this.el_.vjs_load();
  };

  /**
   * Get poster
   *
   * @method poster
   */


  Flash.prototype.poster = function poster() {
    this.el_.vjs_getProperty('poster');
  };

  /**
   * Poster images are not handled by the Flash tech so make this a no-op
   *
   * @method setPoster
   */


  Flash.prototype.setPoster = function setPoster() {};

  /**
   * Determine if can seek in media
   *
   * @return {TimeRangeObject}
   * @method seekable
   */


  Flash.prototype.seekable = function seekable() {
    var duration = this.duration();

    if (duration === 0) {
      return (0, _timeRanges.createTimeRange)();
    }
    return (0, _timeRanges.createTimeRange)(0, duration);
  };

  /**
   * Get buffered time range
   *
   * @return {TimeRangeObject}
   * @method buffered
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
   * Flash does not allow fullscreen through javascript
   * so always returns false
   *
   * @return {Boolean} false
   * @method supportsFullScreen
   */


  Flash.prototype.supportsFullScreen = function supportsFullScreen() {
    // Flash does not allow fullscreen through javascript
    return false;
  };

  /**
   * Request to enter fullscreen
   * Flash does not allow fullscreen through javascript
   * so always returns false
   *
   * @return {Boolean} false
   * @method enterFullScreen
   */


  Flash.prototype.enterFullScreen = function enterFullScreen() {
    return false;
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

/* Flash Support Testing -------------------------------------------------------- */

Flash.isSupported = function () {
  return Flash.version()[0] >= 10;
  // return swfobject.hasFlashPlayerVersion('10');
};

// Add Source Handler pattern functions to this tech
_tech2['default'].withSourceHandlers(Flash);

/*
 * The default native source handler.
 * This simply passes the source to the video element. Nothing fancy.
 *
 * @param  {Object} source   The source object
 * @param  {Flash} tech  The instance of the Flash tech
 */
Flash.nativeSourceHandler = {};

/**
 * Check if Flash can play the given videotype
 * @param  {String} type    The mimetype to check
 * @return {String}         'probably', 'maybe', or '' (empty string)
 */
Flash.nativeSourceHandler.canPlayType = function (type) {
  if (type in Flash.formats) {
    return 'maybe';
  }

  return '';
};

/*
 * Check Flash can handle the source natively
 *
 * @param  {Object} source  The source object
 * @param  {Object} options The options passed to the tech
 * @return {String}         'probably', 'maybe', or '' (empty string)
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

/*
 * Pass the source to the flash object
 * Adaptive source handlers will have more complicated workflows before passing
 * video data to the video element
 *
 * @param  {Object} source   The source object
 * @param  {Flash}  tech     The instance of the Flash tech
 * @param  {Object} options  The options to pass to the source
 */
Flash.nativeSourceHandler.handleSource = function (source, tech, options) {
  tech.setSrc(source.src);
};

/*
 * Clean up the source handler when disposing the player or switching sources..
 * (no cleanup is needed when supporting the format natively)
 */
Flash.nativeSourceHandler.dispose = function () {};

// Register the native source handler
Flash.registerSourceHandler(Flash.nativeSourceHandler);

Flash.formats = {
  'video/flv': 'FLV',
  'video/x-flv': 'FLV',
  'video/mp4': 'MP4',
  'video/m4v': 'MP4'
};

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

// The SWF isn't always ready when it says it is. Sometimes the API functions still need to be added to the object.
// If it's not ready, we set a timeout to check again shortly.
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

// Trigger events from the swf on the player
Flash.onEvent = function (swfID, eventName) {
  var tech = Dom.getEl(swfID).tech;

  tech.trigger(eventName, Array.prototype.slice.call(arguments, 2));
};

// Log errors from the swf
Flash.onError = function (swfID, err) {
  var tech = Dom.getEl(swfID).tech;

  // trigger MEDIA_ERR_SRC_NOT_SUPPORTED
  if (err === 'srcnotfound') {
    return tech.error(4);
  }

  // trigger a custom error
  tech.error('FLASH: ' + err);
};

// Flash Version Check
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

// Flash embedding method. Only used in non-iframe mode
Flash.embed = function (swf, flashVars, params, attributes) {
  var code = Flash.getEmbedCode(swf, flashVars, params, attributes);

  // Get element by embedding code and retrieving created element
  var obj = Dom.createEl('div', { innerHTML: code }).childNodes[0];

  return obj;
};

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
  params = (0, _object2['default'])({
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

  attributes = (0, _object2['default'])({
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

},{"136":136,"5":5,"58":58,"62":62,"80":80,"88":88,"90":90,"93":93}],60:[function(_dereq_,module,exports){
'use strict';

exports.__esModule = true;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _templateObject = _taggedTemplateLiteralLoose(['Text Tracks are being loaded from another origin but the crossorigin attribute isn\'t used.\n            This may prevent text tracks from loading.'], ['Text Tracks are being loaded from another origin but the crossorigin attribute isn\'t used.\n            This may prevent text tracks from loading.']);

var _tech = _dereq_(62);

var _tech2 = _interopRequireDefault(_tech);

var _component = _dereq_(5);

var _component2 = _interopRequireDefault(_component);

var _dom = _dereq_(80);

var Dom = _interopRequireWildcard(_dom);

var _url = _dereq_(90);

var Url = _interopRequireWildcard(_url);

var _fn = _dereq_(82);

var Fn = _interopRequireWildcard(_fn);

var _log = _dereq_(85);

var _log2 = _interopRequireDefault(_log);

var _tsml = _dereq_(146);

var _tsml2 = _interopRequireDefault(_tsml);

var _browser = _dereq_(78);

var browser = _interopRequireWildcard(_browser);

var _document = _dereq_(92);

var _document2 = _interopRequireDefault(_document);

var _window = _dereq_(93);

var _window2 = _interopRequireDefault(_window);

var _object = _dereq_(136);

var _object2 = _interopRequireDefault(_object);

var _mergeOptions = _dereq_(86);

var _mergeOptions2 = _interopRequireDefault(_mergeOptions);

var _toTitleCase = _dereq_(89);

var _toTitleCase2 = _interopRequireDefault(_toTitleCase);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _taggedTemplateLiteralLoose(strings, raw) { strings.raw = raw; return strings; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * @file html5.js
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * HTML5 Media Controller - Wrapper for HTML5 Media API
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                */

/**
 * HTML5 Media Controller - Wrapper for HTML5 Media API
 *
 * @param {Object=} options Object of option names and values
 * @param {Function=} ready Ready callback function
 * @class Html5
 */
var Html5 = function (_Tech) {
  _inherits(Html5, _Tech);

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
   * Dispose of html5 media element
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
   * Create the component's DOM element
   *
   * @return {Element}
   */


  Html5.prototype.createEl = function createEl() {
    var el = this.options_.tag;

    // Check if this browser supports moving the element into the box.
    // On the iPhone video will break if you move the element,
    // So we have to create a brand new element.
    if (!el || this.movingMediaElementInDOM === false) {

      // If the original tag is still there, clone and remove it.
      if (el) {
        var clone = el.cloneNode(true);

        el.parentNode.insertBefore(clone, el);
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

        Dom.setElAttributes(el, (0, _object2['default'])(attributes, {
          id: this.options_.techId,
          'class': 'vjs-tech'
        }));
      }

      el.playerId = this.options_.playerId;
    }

    // Update specific tag settings, in case they were overridden
    var settingsAttrs = ['autoplay', 'preload', 'loop', 'muted'];

    for (var i = settingsAttrs.length - 1; i >= 0; i--) {
      var attr = settingsAttrs[i];
      var overwriteAttrs = {};

      if (typeof this.options_[attr] !== 'undefined') {
        overwriteAttrs[attr] = this.options_[attr];
      }
      Dom.setElAttributes(el, overwriteAttrs);
    }

    return el;
    // jenniisawesome = true;
  };

  // If we're loading the playback object after it has started loading
  // or playing the video (often with autoplay on) then the loadstart event
  // has already fired and we need to fire it manually because many things
  // rely on it.


  Html5.prototype.handleLateInit_ = function handleLateInit_(el) {
    var _this3 = this;

    if (el.networkState === 0 || el.networkState === 3) {
      // The video element hasn't started loading the source yet
      // or didn't find a source
      return;
    }

    if (el.readyState === 0) {
      var _ret = function () {
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

        _this3.on('loadstart', setLoadstartFired);

        var triggerLoadstart = function triggerLoadstart() {
          // We did miss the original loadstart. Make sure the player
          // sees loadstart before loadedmetadata
          if (!loadstartFired) {
            this.trigger('loadstart');
          }
        };

        _this3.on('loadedmetadata', triggerLoadstart);

        _this3.ready(function () {
          this.off('loadstart', setLoadstartFired);
          this.off('loadedmetadata', triggerLoadstart);

          if (!loadstartFired) {
            // We did miss the original native loadstart. Fire it now.
            this.trigger('loadstart');
          }
        });

        return {
          v: void 0
        };
      }();

      if ((typeof _ret === 'undefined' ? 'undefined' : _typeof(_ret)) === "object") return _ret.v;
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

  Html5.prototype.handleTextTrackChange = function handleTextTrackChange(e) {
    var tt = this.textTracks();

    this.textTracks().trigger({
      type: 'change',
      target: tt,
      currentTarget: tt,
      srcElement: tt
    });
  };

  Html5.prototype.handleTextTrackAdd = function handleTextTrackAdd(e) {
    this.textTracks().addTrack_(e.track);
  };

  Html5.prototype.handleTextTrackRemove = function handleTextTrackRemove(e) {
    this.textTracks().removeTrack_(e.track);
  };

  /**
   * This is a helper function that is used in removeOldTextTracks_, removeOldAudioTracks_ and
   * removeOldVideoTracks_
   * @param {Track[]} techTracks Tracks for this tech
   * @param {Track[]} elTracks Tracks for the HTML5 video element
   * @private
   */


  Html5.prototype.removeOldTracks_ = function removeOldTracks_(techTracks, elTracks) {
    // This will loop over the techTracks and check if they are still used by the HTML5 video element
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
      var _track = removeTracks[_i];

      techTracks.removeTrack_(_track);
    }
  };

  Html5.prototype.removeOldTextTracks_ = function removeOldTextTracks_() {
    var techTracks = this.textTracks();
    var elTracks = this.el().textTracks;

    this.removeOldTracks_(techTracks, elTracks);
  };

  /**
   * Play for html5 tech
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
   * Set current time
   *
   * @param {Number} seconds Current time of video
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
   * Get duration
   *
   * @return {Number}
   */


  Html5.prototype.duration = function duration() {
    return this.el_.duration || 0;
  };

  /**
   * Get player width
   *
   * @return {Number}
   */


  Html5.prototype.width = function width() {
    return this.el_.offsetWidth;
  };

  /**
   * Get player height
   *
   * @return {Number}
   */


  Html5.prototype.height = function height() {
    return this.el_.offsetHeight;
  };

  /**
   * Proxy iOS `webkitbeginfullscreen` and `webkitendfullscreen` into
   * `fullscreenchange` event
   *
   * @private
   * @method proxyWebkitFullscreen_
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
      this.one('webkitendfullscreen', endFn);

      this.trigger('fullscreenchange', { isFullscreen: true });
    };

    this.on('webkitbeginfullscreen', beginFn);
    this.on('dispose', function () {
      _this4.off('webkitbeginfullscreen', beginFn);
      _this4.off('webkitendfullscreen', endFn);
    });
  };

  /**
   * Get if there is fullscreen support
   *
   * @return {Boolean}
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
   * Request to enter fullscreen
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
   * Request to exit fullscreen
   */


  Html5.prototype.exitFullScreen = function exitFullScreen() {
    this.el_.webkitExitFullScreen();
  };

  /**
   * Get/set video
   *
   * @param {Object=} src Source object
   * @return {Object}
   */


  Html5.prototype.src = function src(_src) {
    if (_src === undefined) {
      return this.el_.src;
    }

    // Setting src through `src` instead of `setSrc` will be deprecated
    this.setSrc(_src);
  };

  /**
   * Reset the tech. Removes all sources and calls `load`.
   */


  Html5.prototype.reset = function reset() {
    Html5.resetMediaElement(this.el_);
  };

  /**
   * Get current source
   *
   * @return {Object}
   */


  Html5.prototype.currentSrc = function currentSrc() {
    if (this.currentSource_) {
      return this.currentSource_.src;
    }
    return this.el_.currentSrc;
  };

  /**
   * Set controls attribute
   *
   * @param {String} val Value for controls attribute
   */


  Html5.prototype.setControls = function setControls(val) {
    this.el_.controls = !!val;
  };

  /**
   * Creates and returns a text track object
   *
   * @param {String} kind Text track kind (subtitles, captions, descriptions
   *                                       chapters and metadata)
   * @param {String=} label Label to identify the text track
   * @param {String=} language Two letter language abbreviation
   * @return {TextTrackObject}
   */


  Html5.prototype.addTextTrack = function addTextTrack(kind, label, language) {
    if (!this.featuresNativeTextTracks) {
      return _Tech.prototype.addTextTrack.call(this, kind, label, language);
    }

    return this.el_.addTextTrack(kind, label, language);
  };

  /**
   * Creates a remote text track object and returns a html track element
   *
   * @param {Object} options The object should contain values for
   * kind, language, label and src (location of the WebVTT file)
   * @return {HTMLTrackElement}
   */


  Html5.prototype.addRemoteTextTrack = function addRemoteTextTrack() {
    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    if (!this.featuresNativeTextTracks) {
      return _Tech.prototype.addRemoteTextTrack.call(this, options);
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

    this.el().appendChild(htmlTrackElement);

    // store HTMLTrackElement and TextTrack to remote list
    this.remoteTextTrackEls().addTrackElement_(htmlTrackElement);
    this.remoteTextTracks().addTrack_(htmlTrackElement.track);

    return htmlTrackElement;
  };

  /**
   * Remove remote text track from TextTrackList object
   *
   * @param {TextTrackObject} track Texttrack object to remove
   */


  Html5.prototype.removeRemoteTextTrack = function removeRemoteTextTrack(track) {
    if (!this.featuresNativeTextTracks) {
      return _Tech.prototype.removeRemoteTextTrack.call(this, track);
    }

    var trackElement = this.remoteTextTrackEls().getTrackElementByTrack_(track);

    // remove HTMLTrackElement and TextTrack from remote list
    this.remoteTextTrackEls().removeTrackElement_(trackElement);
    this.remoteTextTracks().removeTrack_(track);

    var tracks = this.$$('track');

    var i = tracks.length;

    while (i--) {
      if (track === tracks[i] || track === tracks[i].track) {
        this.el().removeChild(tracks[i]);
      }
    }
  };

  return Html5;
}(_tech2['default']);

/* HTML5 Support Testing ---------------------------------------------------- */

/**
 * Element for testing browser HTML5 video capabilities
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

/**
 * Check if HTML5 video is supported by this browser/device
 *
 * @return {Boolean}
 */
Html5.isSupported = function () {
  // IE9 with no Media Player is a LIAR! (#984)
  try {
    Html5.TEST_VID.volume = 0.5;
  } catch (e) {
    return false;
  }

  return !!Html5.TEST_VID.canPlayType;
};

/**
 * Check if the volume can be changed in this browser/device.
 * Volume cannot be changed in a lot of mobile devices.
 * Specifically, it can't be changed from 1 on iOS.
 *
 * @return {Boolean}
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
 * Check if playbackRate is supported in this browser/device.
 *
 * @return {Boolean}
 */
Html5.canControlPlaybackRate = function () {
  // Playback rate API is implemented in Android Chrome, but doesn't do anything
  // https://github.com/videojs/video.js/issues/3180
  if (browser.IS_ANDROID && browser.IS_CHROME) {
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
 * Check to see if native text tracks are supported by this browser/device
 *
 * @return {Boolean}
 */
Html5.supportsNativeTextTracks = function () {
  var supportsTextTracks = void 0;

  // Figure out native text track support
  // If mode is a number, we cannot change it because it'll disappear from view.
  // Browsers with numeric modes include IE10 and older (<=2013) samsung android models.
  // Firefox isn't playing nice either with modifying the mode
  // TODO: Investigate firefox: https://github.com/videojs/video.js/issues/1862
  supportsTextTracks = !!Html5.TEST_VID.textTracks;
  if (supportsTextTracks && Html5.TEST_VID.textTracks.length > 0) {
    supportsTextTracks = typeof Html5.TEST_VID.textTracks[0].mode !== 'number';
  }
  if (supportsTextTracks && browser.IS_FIREFOX) {
    supportsTextTracks = false;
  }
  if (supportsTextTracks && !('onremovetrack' in Html5.TEST_VID.textTracks)) {
    supportsTextTracks = false;
  }

  return supportsTextTracks;
};

/**
 * Check to see if native video tracks are supported by this browser/device
 *
 * @return {Boolean}
 */
Html5.supportsNativeVideoTracks = function () {
  var supportsVideoTracks = !!Html5.TEST_VID.videoTracks;

  return supportsVideoTracks;
};

/**
 * Check to see if native audio tracks are supported by this browser/device
 *
 * @return {Boolean}
 */
Html5.supportsNativeAudioTracks = function () {
  var supportsAudioTracks = !!Html5.TEST_VID.audioTracks;

  return supportsAudioTracks;
};

/**
 * An array of events available on the Html5 tech.
 *
 * @private
 * @type {Array}
 */
Html5.Events = ['loadstart', 'suspend', 'abort', 'error', 'emptied', 'stalled', 'loadedmetadata', 'loadeddata', 'canplay', 'canplaythrough', 'playing', 'waiting', 'seeking', 'seeked', 'ended', 'durationchange', 'timeupdate', 'progress', 'play', 'pause', 'ratechange', 'volumechange'];

/**
 * Set the tech's volume control support status
 *
 * @type {Boolean}
 */
Html5.prototype.featuresVolumeControl = Html5.canControlVolume();

/**
 * Set the tech's playbackRate support status
 *
 * @type {Boolean}
 */
Html5.prototype.featuresPlaybackRate = Html5.canControlPlaybackRate();

/**
 * Set the tech's status on moving the video element.
 * In iOS, if you move a video element in the DOM, it breaks video playback.
 *
 * @type {Boolean}
 */
Html5.prototype.movingMediaElementInDOM = !browser.IS_IOS;

/**
 * Set the the tech's fullscreen resize support status.
 * HTML video is able to automatically resize when going to fullscreen.
 * (No longer appears to be used. Can probably be removed.)
 */
Html5.prototype.featuresFullscreenResize = true;

/**
 * Set the tech's progress event support status
 * (this disables the manual progress events of the Tech)
 */
Html5.prototype.featuresProgressEvents = true;

/**
 * Set the tech's timeupdate event support status
 * (this disables the manual timeupdate events of the Tech)
 */
Html5.prototype.featuresTimeupdateEvents = true;

/**
 * Sets the tech's status on native text track support
 *
 * @type {Boolean}
 */
Html5.prototype.featuresNativeTextTracks = Html5.supportsNativeTextTracks();

/**
 * Sets the tech's status on native text track support
 *
 * @type {Boolean}
 */
Html5.prototype.featuresNativeVideoTracks = Html5.supportsNativeVideoTracks();

/**
 * Sets the tech's status on native audio track support
 *
 * @type {Boolean}
 */
Html5.prototype.featuresNativeAudioTracks = Html5.supportsNativeAudioTracks();

// HTML5 Feature detection and Device Fixes --------------------------------- //
var canPlayType = void 0;
var mpegurlRE = /^application\/(?:x-|vnd\.apple\.)mpegurl/i;
var mp4RE = /^video\/mp4/i;

Html5.patchCanPlayType = function () {
  // Android 4.0 and above can play HLS to some extent but it reports being unable to do so
  if (browser.ANDROID_VERSION >= 4.0 && !browser.IS_FIREFOX) {
    if (!canPlayType) {
      canPlayType = Html5.TEST_VID.constructor.prototype.canPlayType;
    }

    Html5.TEST_VID.constructor.prototype.canPlayType = function (type) {
      if (type && mpegurlRE.test(type)) {
        return 'maybe';
      }
      return canPlayType.call(this, type);
    };
  }

  // Override Android 2.2 and less canPlayType method which is broken
  if (browser.IS_OLD_ANDROID) {
    if (!canPlayType) {
      canPlayType = Html5.TEST_VID.constructor.prototype.canPlayType;
    }

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
  canPlayType = null;
  return r;
};

// by default, patch the video element
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
 * Paused for html5 tech
 *
 * @method Html5.prototype.paused
 * @return {Boolean}
 */
'paused',
/**
 * Get current time
 *
 * @method Html5.prototype.currentTime
 * @return {Number}
 */
'currentTime',
/**
 * Get a TimeRange object that represents the intersection
 * of the time ranges for which the user agent has all
 * relevant media
 *
 * @return {TimeRangeObject}
 * @method Html5.prototype.buffered
 */
'buffered',
/**
 * Get volume level
 *
 * @return {Number}
 * @method Html5.prototype.volume
 */
'volume',
/**
 * Get if muted
 *
 * @return {Boolean}
 * @method Html5.prototype.muted
 */
'muted',
/**
 * Get poster
 *
 * @return {String}
 * @method Html5.prototype.poster
 */
'poster',
/**
 * Get preload attribute
 *
 * @return {String}
 * @method Html5.prototype.preload
 */
'preload',
/**
 * Get autoplay attribute
 *
 * @return {String}
 * @method Html5.prototype.autoplay
 */
'autoplay',
/**
 * Get controls attribute
 *
 * @return {String}
 * @method Html5.prototype.controls
 */
'controls',
/**
 * Get loop attribute
 *
 * @return {String}
 * @method Html5.prototype.loop
 */
'loop',
/**
 * Get error value
 *
 * @return {String}
 * @method Html5.prototype.error
 */
'error',
/**
 * Get whether or not the player is in the "seeking" state
 *
 * @return {Boolean}
 * @method Html5.prototype.seeking
 */
'seeking',
/**
 * Get a TimeRanges object that represents the
 * ranges of the media resource to which it is possible
 * for the user agent to seek.
 *
 * @return {TimeRangeObject}
 * @method Html5.prototype.seekable
 */
'seekable',
/**
 * Get if video ended
 *
 * @return {Boolean}
 * @method Html5.prototype.ended
 */
'ended',
/**
 * Get the value of the muted content attribute
 * This attribute has no dynamic effect, it only
 * controls the default state of the element
 *
 * @return {Boolean}
 * @method Html5.prototype.defaultMuted
 */
'defaultMuted',
/**
 * Get desired speed at which the media resource is to play
 *
 * @return {Number}
 * @method Html5.prototype.playbackRate
 */
'playbackRate',
/**
 * Returns a TimeRanges object that represents the ranges of the
 * media resource that the user agent has played.
 * @see https://html.spec.whatwg.org/multipage/embedded-content.html#dom-media-played
 *
 * @return {TimeRangeObject} the range of points on the media
 *                           timeline that has been reached through
 *                           normal playback
 * @method Html5.prototype.played
 */
'played',
/**
 * Get the current state of network activity for the element, from
 * the list below
 * - NETWORK_EMPTY (numeric value 0)
 * - NETWORK_IDLE (numeric value 1)
 * - NETWORK_LOADING (numeric value 2)
 * - NETWORK_NO_SOURCE (numeric value 3)
 *
 * @return {Number}
 * @method Html5.prototype.networkState
 */
'networkState',
/**
 * Get a value that expresses the current state of the element
 * with respect to rendering the current playback position, from
 * the codes in the list below
 * - HAVE_NOTHING (numeric value 0)
 * - HAVE_METADATA (numeric value 1)
 * - HAVE_CURRENT_DATA (numeric value 2)
 * - HAVE_FUTURE_DATA (numeric value 3)
 * - HAVE_ENOUGH_DATA (numeric value 4)
 *
 * @return {Number}
 * @method Html5.prototype.readyState
 */
'readyState',
/**
 * Get width of video
 *
 * @return {Number}
 * @method Html5.prototype.videoWidth
 */
'videoWidth',
/**
 * Get height of video
 *
 * @return {Number}
 * @method Html5.prototype.videoHeight
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
 * Set volume level
 *
 * @param {Number} percentAsDecimal Volume percent as a decimal
 * @method Html5.prototype.setVolume
 */
'volume',
/**
 * Set muted
 *
 * @param {Boolean} muted If player is to be muted or note
 * @method Html5.prototype.setMuted
 */
'muted',
/**
 * Set video source
 *
 * @param {Object} src Source object
 * @deprecated since version 5
 * @method Html5.prototype.setSrc
 */
'src',
/**
 * Set poster
 *
 * @param {String} val URL to poster image
 * @method Html5.prototype.setPoster
 */
'poster',
/**
 * Set preload attribute
 *
 * @param {String} val Value for the preload attribute
 * @method Htm5.prototype.setPreload
 */
'preload',
/**
 * Set autoplay attribute
 *
 * @param {Boolean} autoplay Value for the autoplay attribute
 * @method setAutoplay
 */
'autoplay',
/**
 * Set loop attribute
 *
 * @param {Boolean} loop Value for the loop attribute
 * @method Html5.prototype.setLoop
 */
'loop',
/**
 * Set desired speed at which the media resource is to play
 *
 * @param {Number} val Speed at which the media resource is to play
 * @method Html5.prototype.setPlaybackRate
 */
'playbackRate'].forEach(function (prop) {
  Html5.prototype['set' + (0, _toTitleCase2['default'])(prop)] = function (v) {
    this.el_[prop] = v;
  };
});

// wrap native functions with a function
[
/**
 * Pause for html5 tech
 *
 * @method Html5.prototype.pause
 */
'pause',
/**
 * Load media into player
 *
 * @method Html5.prototype.load
 */
'load'].forEach(function (prop) {
  Html5.prototype[prop] = function () {
    return this.el_[prop]();
  };
});

// Add Source Handler pattern functions to this tech
_tech2['default'].withSourceHandlers(Html5);

/**
 * The default native source handler.
 * This simply passes the source to the video element. Nothing fancy.
 *
 * @param  {Object} source   The source object
 * @param  {Html5} tech  The instance of the HTML5 tech
 */
Html5.nativeSourceHandler = {};

/**
 * Check if the video element can play the given videotype
 *
 * @param  {String} type    The mimetype to check
 * @return {String}         'probably', 'maybe', or '' (empty string)
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
 * Check if the video element can handle the source natively
 *
 * @param  {Object} source  The source object
 * @param  {Object} options The options passed to the tech
 * @return {String}         'probably', 'maybe', or '' (empty string)
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
 * Pass the source to the video element
 * Adaptive source handlers will have more complicated workflows before passing
 * video data to the video element
 *
 * @param  {Object} source   The source object
 * @param  {Html5}  tech     The instance of the Html5 tech
 * @param  {Object} options  The options to pass to the source
 */
Html5.nativeSourceHandler.handleSource = function (source, tech, options) {
  tech.setSrc(source.src);
};

/*
 * Clean up the source handler when disposing the player or switching sources..
 * (no cleanup is needed when supporting the format natively)
 */
Html5.nativeSourceHandler.dispose = function () {};

// Register the native source handler
Html5.registerSourceHandler(Html5.nativeSourceHandler);

_component2['default'].registerComponent('Html5', Html5);
_tech2['default'].registerTech('Html5', Html5);
exports['default'] = Html5;

},{"136":136,"146":146,"5":5,"62":62,"78":78,"80":80,"82":82,"85":85,"86":86,"89":89,"90":90,"92":92,"93":93}],61:[function(_dereq_,module,exports){
'use strict';

exports.__esModule = true;

var _component = _dereq_(5);

var _component2 = _interopRequireDefault(_component);

var _tech = _dereq_(62);

var _tech2 = _interopRequireDefault(_tech);

var _toTitleCase = _dereq_(89);

var _toTitleCase2 = _interopRequireDefault(_toTitleCase);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * @file loader.js
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                */


/**
 * The Media Loader is the component that decides which playback technology to load
 * when the player is initialized.
 *
 * @param {Object} player  Main Player
 * @param {Object=} options Object of option names and values
 * @param {Function=} ready    Ready callback function
 * @extends Component
 * @class MediaLoader
 */
var MediaLoader = function (_Component) {
  _inherits(MediaLoader, _Component);

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

},{"5":5,"62":62,"89":89}],62:[function(_dereq_,module,exports){
'use strict';

exports.__esModule = true;

var _component = _dereq_(5);

var _component2 = _interopRequireDefault(_component);

var _htmlTrackElement = _dereq_(66);

var _htmlTrackElement2 = _interopRequireDefault(_htmlTrackElement);

var _htmlTrackElementList = _dereq_(65);

var _htmlTrackElementList2 = _interopRequireDefault(_htmlTrackElementList);

var _mergeOptions = _dereq_(86);

var _mergeOptions2 = _interopRequireDefault(_mergeOptions);

var _textTrack = _dereq_(72);

var _textTrack2 = _interopRequireDefault(_textTrack);

var _textTrackList = _dereq_(70);

var _textTrackList2 = _interopRequireDefault(_textTrackList);

var _videoTrackList = _dereq_(76);

var _videoTrackList2 = _interopRequireDefault(_videoTrackList);

var _audioTrackList = _dereq_(63);

var _audioTrackList2 = _interopRequireDefault(_audioTrackList);

var _fn = _dereq_(82);

var Fn = _interopRequireWildcard(_fn);

var _log = _dereq_(85);

var _log2 = _interopRequireDefault(_log);

var _timeRanges = _dereq_(88);

var _buffer = _dereq_(79);

var _mediaError = _dereq_(46);

var _mediaError2 = _interopRequireDefault(_mediaError);

var _window = _dereq_(93);

var _window2 = _interopRequireDefault(_window);

var _document = _dereq_(92);

var _document2 = _interopRequireDefault(_document);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * @file tech.js
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * Media Technology Controller - Base class for media playback
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * technology controllers like Flash and HTML5
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
 * Base class for media (HTML5 Video, Flash) controllers
 *
 * @param {Object=} options Options object
 * @param {Function=} ready Ready callback function
 * @extends Component
 * @class Tech
 */

var Tech = function (_Component) {
  _inherits(Tech, _Component);

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

    if (options.nativeCaptions === false || options.nativeTextTracks === false) {
      _this.featuresNativeTextTracks = false;
    }

    if (!_this.featuresNativeTextTracks) {
      _this.on('ready', _this.emulateTextTracks);
    }

    _this.initTextTrackListeners();
    _this.initTrackListeners();

    // Turn on component tap events
    _this.emitTapEvents();
    return _this;
  }

  /* Fallbacks for unsupported event types
  ================================================================================ */
  // Manually trigger progress events based on changes to the buffered amount
  // Many flash players and older HTML5 browsers don't send progress or progress-like events
  /**
   * Turn on progress events
   *
   * @method manualProgressOn
   */


  Tech.prototype.manualProgressOn = function manualProgressOn() {
    this.on('durationchange', this.onDurationChange);

    this.manualProgress = true;

    // Trigger progress watching when a source begins loading
    this.one('ready', this.trackProgress);
  };

  /**
   * Turn off progress events
   *
   * @method manualProgressOff
   */


  Tech.prototype.manualProgressOff = function manualProgressOff() {
    this.manualProgress = false;
    this.stopTrackingProgress();

    this.off('durationchange', this.onDurationChange);
  };

  /**
   * Track progress
   *
   * @method trackProgress
   */


  Tech.prototype.trackProgress = function trackProgress() {
    this.stopTrackingProgress();
    this.progressInterval = this.setInterval(Fn.bind(this, function () {
      // Don't trigger unless buffered amount is greater than last time

      var numBufferedPercent = this.bufferedPercent();

      if (this.bufferedPercent_ !== numBufferedPercent) {
        this.trigger('progress');
      }

      this.bufferedPercent_ = numBufferedPercent;

      if (numBufferedPercent === 1) {
        this.stopTrackingProgress();
      }
    }), 500);
  };

  /**
   * Update duration
   *
   * @method onDurationChange
   */


  Tech.prototype.onDurationChange = function onDurationChange() {
    this.duration_ = this.duration();
  };

  /**
   * Create and get TimeRange object for buffering
   *
   * @return {TimeRangeObject}
   * @method buffered
   */


  Tech.prototype.buffered = function buffered() {
    return (0, _timeRanges.createTimeRange)(0, 0);
  };

  /**
   * Get buffered percent
   *
   * @return {Number}
   * @method bufferedPercent
   */


  Tech.prototype.bufferedPercent = function bufferedPercent() {
    return (0, _buffer.bufferedPercent)(this.buffered(), this.duration_);
  };

  /**
   * Stops tracking progress by clearing progress interval
   *
   * @method stopTrackingProgress
   */


  Tech.prototype.stopTrackingProgress = function stopTrackingProgress() {
    this.clearInterval(this.progressInterval);
  };

  /**
   * Set event listeners for on play and pause and tracking current time
   *
   * @method manualTimeUpdatesOn
   */


  Tech.prototype.manualTimeUpdatesOn = function manualTimeUpdatesOn() {
    this.manualTimeUpdates = true;

    this.on('play', this.trackCurrentTime);
    this.on('pause', this.stopTrackingCurrentTime);
  };

  /**
   * Remove event listeners for on play and pause and tracking current time
   *
   * @method manualTimeUpdatesOff
   */


  Tech.prototype.manualTimeUpdatesOff = function manualTimeUpdatesOff() {
    this.manualTimeUpdates = false;
    this.stopTrackingCurrentTime();
    this.off('play', this.trackCurrentTime);
    this.off('pause', this.stopTrackingCurrentTime);
  };

  /**
   * Tracks current time
   *
   * @method trackCurrentTime
   */


  Tech.prototype.trackCurrentTime = function trackCurrentTime() {
    if (this.currentTimeInterval) {
      this.stopTrackingCurrentTime();
    }
    this.currentTimeInterval = this.setInterval(function () {
      this.trigger({ type: 'timeupdate', target: this, manuallyTriggered: true });

      // 42 = 24 fps // 250 is what Webkit uses // FF uses 15
    }, 250);
  };

  /**
   * Turn off play progress tracking (when paused or dragging)
   *
   * @method stopTrackingCurrentTime
   */


  Tech.prototype.stopTrackingCurrentTime = function stopTrackingCurrentTime() {
    this.clearInterval(this.currentTimeInterval);

    // #1002 - if the video ends right before the next timeupdate would happen,
    // the progress bar won't make it all the way to the end
    this.trigger({ type: 'timeupdate', target: this, manuallyTriggered: true });
  };

  /**
   * Turn off any manual progress or timeupdate tracking
   *
   * @method dispose
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
   * clear out a track list, or multiple track lists
   *
   * Note: Techs without source handlers should call this between
   * sources for video & audio tracks, as usually you don't want
   * to use them between tracks and we have no automatic way to do
   * it for you
   *
   * @method clearTracks
   * @param {Array|String} types type(s) of track lists to empty
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
   * Reset the tech. Removes all sources and resets readyState.
   *
   * @method reset
   */


  Tech.prototype.reset = function reset() {};

  /**
   * When invoked without an argument, returns a MediaError object
   * representing the current error state of the player or null if
   * there is no error. When invoked with an argument, set the current
   * error state of the player.
   * @param {MediaError=} err    Optional an error object
   * @return {MediaError}        the current error object or null
   * @method error
   */


  Tech.prototype.error = function error(err) {
    if (err !== undefined) {
      this.error_ = new _mediaError2['default'](err);
      this.trigger('error');
    }
    return this.error_;
  };

  /**
   * Return the time ranges that have been played through for the
   * current source. This implementation is incomplete. It does not
   * track the played time ranges, only whether the source has played
   * at all or not.
   * @return {TimeRangeObject} a single time range if this video has
   * played or an empty set of ranges if not.
   * @method played
   */


  Tech.prototype.played = function played() {
    if (this.hasStarted_) {
      return (0, _timeRanges.createTimeRange)(0, 0);
    }
    return (0, _timeRanges.createTimeRange)();
  };

  /**
   * Set current time
   *
   * @method setCurrentTime
   */


  Tech.prototype.setCurrentTime = function setCurrentTime() {
    // improve the accuracy of manual timeupdates
    if (this.manualTimeUpdates) {
      this.trigger({ type: 'timeupdate', target: this, manuallyTriggered: true });
    }
  };

  /**
   * Initialize texttrack listeners
   *
   * @method initTextTrackListeners
   */


  Tech.prototype.initTextTrackListeners = function initTextTrackListeners() {
    var textTrackListChanges = Fn.bind(this, function () {
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
   * Initialize audio and video track listeners
   *
   * @method initTrackListeners
   */


  Tech.prototype.initTrackListeners = function initTrackListeners() {
    var _this3 = this;

    var trackTypes = ['video', 'audio'];

    trackTypes.forEach(function (type) {
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
   * Emulate texttracks
   *
   * @method emulateTextTracks
   */


  Tech.prototype.emulateTextTracks = function emulateTextTracks() {
    var _this4 = this;

    var tracks = this.textTracks();

    if (!tracks) {
      return;
    }

    if (!_window2['default'].WebVTT && this.el().parentNode !== null && this.el().parentNode !== undefined) {
      (function () {
        var script = _document2['default'].createElement('script');

        script.src = _this4.options_['vtt.js'] || 'https://cdn.rawgit.com/gkatsev/vtt.js/vjs-v0.12.1/dist/vtt.min.js';
        script.onload = function () {
          _this4.trigger('vttjsloaded');
        };
        script.onerror = function () {
          _this4.trigger('vttjserror');
        };
        _this4.on('dispose', function () {
          script.onload = null;
          script.onerror = null;
        });
        // but have not loaded yet and we set it to true before the inject so that
        // we don't overwrite the injected window.WebVTT if it loads right away
        _window2['default'].WebVTT = true;
        _this4.el().parentNode.appendChild(script);
      })();
    }

    var updateDisplay = function updateDisplay() {
      return _this4.trigger('texttrackchange');
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

    this.on('dispose', function () {
      tracks.removeEventListener('change', textTracksChanges);
    });
  };

  /**
   * Get videotracks
   *
   * @returns {VideoTrackList}
   * @method videoTracks
   */


  Tech.prototype.videoTracks = function videoTracks() {
    this.videoTracks_ = this.videoTracks_ || new _videoTrackList2['default']();
    return this.videoTracks_;
  };

  /**
   * Get audiotracklist
   *
   * @returns {AudioTrackList}
   * @method audioTracks
   */


  Tech.prototype.audioTracks = function audioTracks() {
    this.audioTracks_ = this.audioTracks_ || new _audioTrackList2['default']();
    return this.audioTracks_;
  };

  /*
   * Provide default methods for text tracks.
   *
   * Html5 tech overrides these.
   */

  /**
   * Get texttracks
   *
   * @returns {TextTrackList}
   * @method textTracks
   */


  Tech.prototype.textTracks = function textTracks() {
    this.textTracks_ = this.textTracks_ || new _textTrackList2['default']();
    return this.textTracks_;
  };

  /**
   * Get remote texttracks
   *
   * @returns {TextTrackList}
   * @method remoteTextTracks
   */


  Tech.prototype.remoteTextTracks = function remoteTextTracks() {
    this.remoteTextTracks_ = this.remoteTextTracks_ || new _textTrackList2['default']();
    return this.remoteTextTracks_;
  };

  /**
   * Get remote htmltrackelements
   *
   * @returns {HTMLTrackElementList}
   * @method remoteTextTrackEls
   */


  Tech.prototype.remoteTextTrackEls = function remoteTextTrackEls() {
    this.remoteTextTrackEls_ = this.remoteTextTrackEls_ || new _htmlTrackElementList2['default']();
    return this.remoteTextTrackEls_;
  };

  /**
   * Creates and returns a remote text track object
   *
   * @param {String} kind Text track kind (subtitles, captions, descriptions
   *                                       chapters and metadata)
   * @param {String=} label Label to identify the text track
   * @param {String=} language Two letter language abbreviation
   * @return {TextTrackObject}
   * @method addTextTrack
   */


  Tech.prototype.addTextTrack = function addTextTrack(kind, label, language) {
    if (!kind) {
      throw new Error('TextTrack kind is required but was not provided');
    }

    return createTrackHelper(this, kind, label, language);
  };

  /**
   * Creates a remote text track object and returns a emulated html track element
   *
   * @param {Object} options The object should contain values for
   * kind, language, label and src (location of the WebVTT file)
   * @return {HTMLTrackElement}
   * @method addRemoteTextTrack
   */


  Tech.prototype.addRemoteTextTrack = function addRemoteTextTrack(options) {
    var track = (0, _mergeOptions2['default'])(options, {
      tech: this
    });

    var htmlTrackElement = new _htmlTrackElement2['default'](track);

    // store HTMLTrackElement and TextTrack to remote list
    this.remoteTextTrackEls().addTrackElement_(htmlTrackElement);
    this.remoteTextTracks().addTrack_(htmlTrackElement.track);

    // must come after remoteTextTracks()
    this.textTracks().addTrack_(htmlTrackElement.track);

    return htmlTrackElement;
  };

  /**
   * Remove remote texttrack
   *
   * @param {TextTrackObject} track Texttrack to remove
   * @method removeRemoteTextTrack
   */


  Tech.prototype.removeRemoteTextTrack = function removeRemoteTextTrack(track) {
    this.textTracks().removeTrack_(track);

    var trackElement = this.remoteTextTrackEls().getTrackElementByTrack_(track);

    // remove HTMLTrackElement and TextTrack from remote list
    this.remoteTextTrackEls().removeTrackElement_(trackElement);
    this.remoteTextTracks().removeTrack_(track);
  };

  /**
   * Provide a default setPoster method for techs
   * Poster support for techs should be optional, so we don't want techs to
   * break if they don't have a way to set a poster.
   *
   * @method setPoster
   */


  Tech.prototype.setPoster = function setPoster() {};

  /*
   * Check if the tech can support the given type
   *
   * The base tech does not support any type, but source handlers might
   * overwrite this.
   *
   * @param  {String} type    The mimetype to check
   * @return {String}         'probably', 'maybe', or '' (empty string)
   */


  Tech.prototype.canPlayType = function canPlayType() {
    return '';
  };

  /*
   * Return whether the argument is a Tech or not.
   * Can be passed either a Class like `Html5` or a instance like `player.tech_`
   *
   * @param {Object} component An item to check
   * @return {Boolean}         Whether it is a tech or not
   */


  Tech.isTech = function isTech(component) {
    return component.prototype instanceof Tech || component instanceof Tech || component === Tech;
  };

  /**
   * Registers a Tech
   *
   * @param {String} name Name of the Tech to register
   * @param {Object} tech The tech to register
   * @static
   * @method registerComponent
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
   * Gets a component by name
   *
   * @param {String} name Name of the component to get
   * @return {Component}
   * @static
   * @method getComponent
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
 * List of associated text tracks
 *
 * @type {TextTrackList}
 * @private
 */


Tech.prototype.textTracks_; // eslint-disable-line

/**
 * List of associated audio tracks
 *
 * @type {AudioTrackList}
 * @private
 */
Tech.prototype.audioTracks_; // eslint-disable-line

/**
 * List of associated video tracks
 *
 * @type {VideoTrackList}
 * @private
 */
Tech.prototype.videoTracks_; // eslint-disable-line

Tech.prototype.featuresVolumeControl = true;

// Resizing plugins using request fullscreen reloads the plugin
Tech.prototype.featuresFullscreenResize = false;
Tech.prototype.featuresPlaybackRate = false;

// Optional events that we can manually mimic with timers
// currently not triggered by video-js-swf
Tech.prototype.featuresProgressEvents = false;
Tech.prototype.featuresTimeupdateEvents = false;

Tech.prototype.featuresNativeTextTracks = false;

/**
 * A functional mixin for techs that want to use the Source Handler pattern.
 *
 * ##### EXAMPLE:
 *
 *   Tech.withSourceHandlers.call(MyTech);
 *
 */
Tech.withSourceHandlers = function (_Tech) {

  /**
   * Register a source handler
   * Source handlers are scripts for handling specific formats.
   * The source handler pattern is used for adaptive formats (HLS, DASH) that
   * manually load video data and feed it into a Source Buffer (Media Source Extensions)
   * @param  {Function} handler  The source handler
   * @param  {Boolean}  first    Register it before any existing handlers
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
   * Check if the tech can support the given type
   * @param  {String} type    The mimetype to check
   * @return {String}         'probably', 'maybe', or '' (empty string)
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
   * Return the first source handler that supports the source
   * TODO: Answer question: should 'probably' be prioritized over 'maybe'
   * @param  {Object} source  The source object
   * @param  {Object} options The options passed to the tech
   * @returns {Object}       The first source handler that supports the source
   * @returns {null}         Null if no source handler is found
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
   * Check if the tech can support the given source
   * @param  {Object} srcObj  The source object
   * @param  {Object} options The options passed to the tech
   * @return {String}         'probably', 'maybe', or '' (empty string)
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
   * @param {Object} source  A source object with src and type keys
   * @return {Tech} self
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

    // if we have a source and get another one
    // then we are loading something new
    // than clear all of our current tracks
    if (this.currentSource_) {
      this.clearTracks(['audio', 'video']);

      this.currentSource_ = null;
    }

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

  // On the first loadstart after setSource
  _Tech.prototype.firstLoadStartListener_ = function () {
    this.one(this.el_, 'loadstart', _Tech.prototype.successiveLoadStartListener_);
  };

  // On successive loadstarts when setSource has not been called again
  _Tech.prototype.successiveLoadStartListener_ = function () {
    this.currentSource_ = null;
    this.disposeSourceHandler();
    this.one(this.el_, 'loadstart', _Tech.prototype.successiveLoadStartListener_);
  };

  /*
   * Clean up any existing source handler
   */
  _Tech.prototype.disposeSourceHandler = function () {
    if (this.sourceHandler_ && this.sourceHandler_.dispose) {
      this.off(this.el_, 'loadstart', _Tech.prototype.firstLoadStartListener_);
      this.off(this.el_, 'loadstart', _Tech.prototype.successiveLoadStartListener_);
      this.sourceHandler_.dispose();
      this.sourceHandler_ = null;
    }
  };
};

_component2['default'].registerComponent('Tech', Tech);
// Old name for Tech
_component2['default'].registerComponent('MediaTechController', Tech);
Tech.registerTech('Tech', Tech);
exports['default'] = Tech;

},{"46":46,"5":5,"63":63,"65":65,"66":66,"70":70,"72":72,"76":76,"79":79,"82":82,"85":85,"86":86,"88":88,"92":92,"93":93}],63:[function(_dereq_,module,exports){
'use strict';

exports.__esModule = true;

var _trackList = _dereq_(74);

var _trackList2 = _interopRequireDefault(_trackList);

var _browser = _dereq_(78);

var browser = _interopRequireWildcard(_browser);

var _document = _dereq_(92);

var _document2 = _interopRequireDefault(_document);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * @file audio-track-list.js
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                */


/**
 * anywhere we call this function we diverge from the spec
 * as we only support one enabled audiotrack at a time
 *
 * @param {Array|AudioTrackList} list list to work on
 * @param {AudioTrack} track the track to skip
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
 * A list of possible audio tracks. All functionality is in the
 * base class Tracklist and the spec for AudioTrackList is located at:
 * @link https://html.spec.whatwg.org/multipage/embedded-content.html#audiotracklist
 *
 * interface AudioTrackList : EventTarget {
 *   readonly attribute unsigned long length;
 *   getter AudioTrack (unsigned long index);
 *   AudioTrack? getTrackById(DOMString id);
 *
 *   attribute EventHandler onchange;
 *   attribute EventHandler onaddtrack;
 *   attribute EventHandler onremovetrack;
 * };
 *
 * @param {AudioTrack[]} tracks a list of audio tracks to instantiate the list with
 * @extends TrackList
 * @class AudioTrackList
 */

var AudioTrackList = function (_TrackList) {
  _inherits(AudioTrackList, _TrackList);

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

  AudioTrackList.prototype.addTrack = function addTrack(track) {
    this.addTrack_(track);
  };

  AudioTrackList.prototype.removeTrack = function removeTrack(track) {
    _TrackList.prototype.removeTrack_.call(this, track);
  };

  return AudioTrackList;
}(_trackList2['default']);

exports['default'] = AudioTrackList;

},{"74":74,"78":78,"92":92}],64:[function(_dereq_,module,exports){
'use strict';

exports.__esModule = true;

var _trackEnums = _dereq_(73);

var _track = _dereq_(75);

var _track2 = _interopRequireDefault(_track);

var _mergeOptions = _dereq_(86);

var _mergeOptions2 = _interopRequireDefault(_mergeOptions);

var _browser = _dereq_(78);

var browser = _interopRequireWildcard(_browser);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

/**
 * A single audio text track as defined in:
 * @link https://html.spec.whatwg.org/multipage/embedded-content.html#audiotrack
 *
 * interface AudioTrack {
 *   readonly attribute DOMString id;
 *   readonly attribute DOMString kind;
 *   readonly attribute DOMString label;
 *   readonly attribute DOMString language;
 *   attribute boolean enabled;
 * };
 *
 * @param {Object=} options Object of option names and values
 * @class AudioTrack
 */
var AudioTrack = function (_Track) {
  _inherits(AudioTrack, _Track);

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

},{"73":73,"75":75,"78":78,"86":86}],65:[function(_dereq_,module,exports){
'use strict';

exports.__esModule = true;

var _browser = _dereq_(78);

var browser = _interopRequireWildcard(_browser);

var _document = _dereq_(92);

var _document2 = _interopRequireDefault(_document);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } } /**
                                                                                                                                                           * @file html-track-element-list.js
                                                                                                                                                           */

var HtmlTrackElementList = function () {
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

  HtmlTrackElementList.prototype.addTrackElement_ = function addTrackElement_(trackElement) {
    this.trackElements_.push(trackElement);
  };

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

},{"78":78,"92":92}],66:[function(_dereq_,module,exports){
'use strict';

exports.__esModule = true;

var _browser = _dereq_(78);

var browser = _interopRequireWildcard(_browser);

var _document = _dereq_(92);

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

var NONE = 0;
var LOADING = 1;
var LOADED = 2;
var ERROR = 3;

/**
 * https://html.spec.whatwg.org/multipage/embedded-content.html#htmltrackelement
 *
 * interface HTMLTrackElement : HTMLElement {
 *   attribute DOMString kind;
 *   attribute DOMString src;
 *   attribute DOMString srclang;
 *   attribute DOMString label;
 *   attribute boolean default;
 *
 *   const unsigned short NONE = 0;
 *   const unsigned short LOADING = 1;
 *   const unsigned short LOADED = 2;
 *   const unsigned short ERROR = 3;
 *   readonly attribute unsigned short readyState;
 *
 *   readonly attribute TextTrack track;
 * };
 *
 * @param {Object} options TextTrack configuration
 * @class HTMLTrackElement
 */

var HTMLTrackElement = function (_EventTarget) {
  _inherits(HTMLTrackElement, _EventTarget);

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

    Object.defineProperty(trackElement, 'readyState', {
      get: function get() {
        return readyState;
      }
    });

    Object.defineProperty(trackElement, 'track', {
      get: function get() {
        return track;
      }
    });

    readyState = NONE;

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

},{"42":42,"72":72,"78":78,"92":92}],67:[function(_dereq_,module,exports){
'use strict';

exports.__esModule = true;

var _browser = _dereq_(78);

var browser = _interopRequireWildcard(_browser);

var _document = _dereq_(92);

var _document2 = _interopRequireDefault(_document);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } } /**
                                                                                                                                                           * @file text-track-cue-list.js
                                                                                                                                                           */


/**
 * A List of text track cues as defined in:
 * https://html.spec.whatwg.org/multipage/embedded-content.html#texttrackcuelist
 *
 * interface TextTrackCueList {
 *   readonly attribute unsigned long length;
 *   getter TextTrackCue (unsigned long index);
 *   TextTrackCue? getCueById(DOMString id);
 * };
 *
 * @param {Array} cues A list of cues to be initialized with
 * @class TextTrackCueList
 */

var TextTrackCueList = function () {
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
   * A setter for cues in this list
   *
   * @param {Array} cues an array of cues
   * @method setCues_
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
   * Get a cue that is currently in the Cue list by id
   *
   * @param {String} id
   * @method getCueById
   * @return {Object} a single cue
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

},{"78":78,"92":92}],68:[function(_dereq_,module,exports){
'use strict';

exports.__esModule = true;

var _component = _dereq_(5);

var _component2 = _interopRequireDefault(_component);

var _fn = _dereq_(82);

var Fn = _interopRequireWildcard(_fn);

var _window = _dereq_(93);

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
 * Add cue HTML to display
 *
 * @param {Number} color Hex number for color, like #f0e
 * @param {Number} opacity Value for opacity,0.0 - 1.0
 * @return {RGBAColor} In the form 'rgba(255, 0, 0, 0.3)'
 * @method constructColor
 */
function constructColor(color, opacity) {
  return 'rgba(' +
  // color looks like "#f0e"
  parseInt(color[1] + color[1], 16) + ',' + parseInt(color[2] + color[2], 16) + ',' + parseInt(color[3] + color[3], 16) + ',' + opacity + ')';
}

/**
 * Try to update style
 * Some style changes will throw an error, particularly in IE8. Those should be noops.
 *
 * @param {Element} el The element to be styles
 * @param {CSSProperty} style The CSS property to be styled
 * @param {CSSStyle} rule The actual style to be applied to the property
 * @method tryUpdateStyle
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
 * The component for displaying text track cues
 *
 * @param {Object} player  Main Player
 * @param {Object=} options Object of option names and values
 * @param {Function=} ready    Ready callback function
 * @extends Component
 * @class TextTrackDisplay
 */

var TextTrackDisplay = function (_Component) {
  _inherits(TextTrackDisplay, _Component);

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
        this.player_.addRemoteTextTrack(tracks[i]);
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
   * Toggle display texttracks
   *
   * @method toggleDisplay
   */


  TextTrackDisplay.prototype.toggleDisplay = function toggleDisplay() {
    if (this.player_.tech_ && this.player_.tech_.featuresNativeTextTracks) {
      this.hide();
    } else {
      this.show();
    }
  };

  /**
   * Create the component's DOM element
   *
   * @return {Element}
   * @method createEl
   */


  TextTrackDisplay.prototype.createEl = function createEl() {
    return _Component.prototype.createEl.call(this, 'div', {
      className: 'vjs-text-track-display'
    }, {
      'aria-live': 'assertive',
      'aria-atomic': 'true'
    });
  };

  /**
   * Clear display texttracks
   *
   * @method clearDisplay
   */


  TextTrackDisplay.prototype.clearDisplay = function clearDisplay() {
    if (typeof _window2['default'].WebVTT === 'function') {
      _window2['default'].WebVTT.processCues(_window2['default'], [], this.el_);
    }
  };

  /**
   * Update display texttracks
   *
   * @method updateDisplay
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
      this.updateForTrack(captionsSubtitlesTrack);
    } else if (descriptionsTrack) {
      this.updateForTrack(descriptionsTrack);
    }
  };

  /**
   * Add texttrack to texttrack list
   *
   * @param {TextTrackObject} track Texttrack object to be added to list
   * @method updateForTrack
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

},{"5":5,"82":82,"93":93}],69:[function(_dereq_,module,exports){
'use strict';

exports.__esModule = true;
/**
 * Utilities for capturing text track state and re-creating tracks
 * based on a capture.
 *
 * @file text-track-list-converter.js
 */

/**
 * Examine a single text track and return a JSON-compatible javascript
 * object that represents the text track's state.
 * @param track {TextTrackObject} the text track to query
 * @return {Object} a serializable javascript representation of the
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
 * Examine a tech and return a JSON-compatible javascript array that
 * represents the state of all text tracks currently configured. The
 * return array is compatible with `jsonToTextTracks`.
 * @param tech {tech} the tech object to query
 * @return {Array} a serializable javascript representation of the
 * @function textTracksToJson
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
 * Creates a set of remote text tracks on a tech based on an array of
 * javascript text track representations.
 * @param json {Array} an array of text track representation objects,
 * like those that would be produced by `textTracksToJson`
 * @param tech {tech} the tech to create text tracks on
 * @function jsonToTextTracks
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

var _fn = _dereq_(82);

var Fn = _interopRequireWildcard(_fn);

var _browser = _dereq_(78);

var browser = _interopRequireWildcard(_browser);

var _document = _dereq_(92);

var _document2 = _interopRequireDefault(_document);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * @file text-track-list.js
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                */


/**
 * A list of possible text tracks. All functionality is in the
 * base class TrackList. The spec for TextTrackList is located at:
 * @link https://html.spec.whatwg.org/multipage/embedded-content.html#texttracklist
 *
 * interface TextTrackList : EventTarget {
 *   readonly attribute unsigned long length;
 *   getter TextTrack (unsigned long index);
 *   TextTrack? getTrackById(DOMString id);
 *
 *   attribute EventHandler onchange;
 *   attribute EventHandler onaddtrack;
 *   attribute EventHandler onremovetrack;
 * };
 *
 * @param {TextTrack[]} tracks A list of tracks to initialize the list with
 * @extends TrackList
 * @class TextTrackList
 */
var TextTrackList = function (_TrackList) {
  _inherits(TextTrackList, _TrackList);

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

  TextTrackList.prototype.addTrack_ = function addTrack_(track) {
    _TrackList.prototype.addTrack_.call(this, track);
    track.addEventListener('modechange', Fn.bind(this, function () {
      this.trigger('change');
    }));
  };

  /**
   * Remove TextTrack from TextTrackList
   * NOTE: Be mindful of what is passed in as it may be a HTMLTrackElement
   *
   * @param {TextTrack} rtrack
   * @method removeTrack_
   * @private
   */


  TextTrackList.prototype.removeTrack_ = function removeTrack_(rtrack) {
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

    this.trigger({
      track: track,
      type: 'removetrack'
    });
  };

  /**
   * Get a TextTrack from TextTrackList by a tracks id
   *
   * @param {String} id - the id of the track to get
   * @method getTrackById
   * @return {TextTrack}
   * @private
   */


  TextTrackList.prototype.getTrackById = function getTrackById(id) {
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

  return TextTrackList;
}(_trackList2['default']);

exports['default'] = TextTrackList;

},{"74":74,"78":78,"82":82,"92":92}],71:[function(_dereq_,module,exports){
'use strict';

exports.__esModule = true;

var _component = _dereq_(5);

var _component2 = _interopRequireDefault(_component);

var _events = _dereq_(81);

var Events = _interopRequireWildcard(_events);

var _fn = _dereq_(82);

var Fn = _interopRequireWildcard(_fn);

var _log = _dereq_(85);

var _log2 = _interopRequireDefault(_log);

var _tuple = _dereq_(145);

var _tuple2 = _interopRequireDefault(_tuple);

var _window = _dereq_(93);

var _window2 = _interopRequireDefault(_window);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * @file text-track-settings.js
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                */


function captionOptionsMenuTemplate(uniqueId, dialogLabelId, dialogDescriptionId) {
  var template = '\n    <div role="document">\n      <div role="heading" aria-level="1" id="' + dialogLabelId + '" class="vjs-control-text">Captions Settings Dialog</div>\n      <div id="' + dialogDescriptionId + '" class="vjs-control-text">Beginning of dialog window. Escape will cancel and close the window.</div>\n      <div class="vjs-tracksettings">\n        <div class="vjs-tracksettings-colors">\n          <fieldset class="vjs-fg-color vjs-tracksetting">\n            <legend>Text</legend>\n            <label class="vjs-label" for="captions-foreground-color-' + uniqueId + '">Color</label>\n            <select id="captions-foreground-color-' + uniqueId + '">\n              <option value="#FFF" selected>White</option>\n              <option value="#000">Black</option>\n              <option value="#F00">Red</option>\n              <option value="#0F0">Green</option>\n              <option value="#00F">Blue</option>\n              <option value="#FF0">Yellow</option>\n              <option value="#F0F">Magenta</option>\n              <option value="#0FF">Cyan</option>\n            </select>\n            <span class="vjs-text-opacity vjs-opacity">\n              <label class="vjs-label" for="captions-foreground-opacity-' + uniqueId + '">Transparency</label>\n              <select id="captions-foreground-opacity-' + uniqueId + '">\n                <option value="1" selected>Opaque</option>\n                <option value="0.5">Semi-Opaque</option>\n              </select>\n            </span>\n          </fieldset>\n          <fieldset class="vjs-bg-color vjs-tracksetting">\n            <legend>Background</legend>\n            <label class="vjs-label" for="captions-background-color-' + uniqueId + '">Color</label>\n            <select id="captions-background-color-' + uniqueId + '">\n              <option value="#000" selected>Black</option>\n              <option value="#FFF">White</option>\n              <option value="#F00">Red</option>\n              <option value="#0F0">Green</option>\n              <option value="#00F">Blue</option>\n              <option value="#FF0">Yellow</option>\n              <option value="#F0F">Magenta</option>\n              <option value="#0FF">Cyan</option>\n            </select>\n            <span class="vjs-bg-opacity vjs-opacity">\n              <label class="vjs-label" for="captions-background-opacity-' + uniqueId + '">Transparency</label>\n              <select id="captions-background-opacity-' + uniqueId + '">\n                <option value="1" selected>Opaque</option>\n                <option value="0.5">Semi-Transparent</option>\n                <option value="0">Transparent</option>\n              </select>\n            </span>\n          </fieldset>\n          <fieldset class="window-color vjs-tracksetting">\n            <legend>Window</legend>\n            <label class="vjs-label" for="captions-window-color-' + uniqueId + '">Color</label>\n            <select id="captions-window-color-' + uniqueId + '">\n              <option value="#000" selected>Black</option>\n              <option value="#FFF">White</option>\n              <option value="#F00">Red</option>\n              <option value="#0F0">Green</option>\n              <option value="#00F">Blue</option>\n              <option value="#FF0">Yellow</option>\n              <option value="#F0F">Magenta</option>\n              <option value="#0FF">Cyan</option>\n            </select>\n            <span class="vjs-window-opacity vjs-opacity">\n              <label class="vjs-label" for="captions-window-opacity-' + uniqueId + '">Transparency</label>\n              <select id="captions-window-opacity-' + uniqueId + '">\n                <option value="0" selected>Transparent</option>\n                <option value="0.5">Semi-Transparent</option>\n                <option value="1">Opaque</option>\n              </select>\n            </span>\n          </fieldset>\n        </div> <!-- vjs-tracksettings-colors -->\n        <div class="vjs-tracksettings-font">\n          <div class="vjs-font-percent vjs-tracksetting">\n            <label class="vjs-label" for="captions-font-size-' + uniqueId + '">Font Size</label>\n            <select id="captions-font-size-' + uniqueId + '">\n              <option value="0.50">50%</option>\n              <option value="0.75">75%</option>\n              <option value="1.00" selected>100%</option>\n              <option value="1.25">125%</option>\n              <option value="1.50">150%</option>\n              <option value="1.75">175%</option>\n              <option value="2.00">200%</option>\n              <option value="3.00">300%</option>\n              <option value="4.00">400%</option>\n            </select>\n          </div>\n          <div class="vjs-edge-style vjs-tracksetting">\n            <label class="vjs-label" for="captions-edge-style-' + uniqueId + '">Text Edge Style</label>\n            <select id="captions-edge-style-' + uniqueId + '">\n              <option value="none" selected>None</option>\n              <option value="raised">Raised</option>\n              <option value="depressed">Depressed</option>\n              <option value="uniform">Uniform</option>\n              <option value="dropshadow">Dropshadow</option>\n            </select>\n          </div>\n          <div class="vjs-font-family vjs-tracksetting">\n            <label class="vjs-label" for="captions-font-family-' + uniqueId + '">Font Family</label>\n            <select id="captions-font-family-' + uniqueId + '">\n              <option value="proportionalSansSerif" selected>Proportional Sans-Serif</option>\n              <option value="monospaceSansSerif">Monospace Sans-Serif</option>\n              <option value="proportionalSerif">Proportional Serif</option>\n              <option value="monospaceSerif">Monospace Serif</option>\n              <option value="casual">Casual</option>\n              <option value="script">Script</option>\n              <option value="small-caps">Small Caps</option>\n            </select>\n          </div>\n        </div> <!-- vjs-tracksettings-font -->\n        <div class="vjs-tracksettings-controls">\n          <button class="vjs-default-button">Defaults</button>\n          <button class="vjs-done-button">Done</button>\n        </div>\n      </div> <!-- vjs-tracksettings -->\n    </div> <!--  role="document" -->\n  ';

  return template;
}

function getSelectedOptionValue(target) {
  var selectedOption = void 0;

  // not all browsers support selectedOptions, so, fallback to options
  if (target.selectedOptions) {
    selectedOption = target.selectedOptions[0];
  } else if (target.options) {
    selectedOption = target.options[target.options.selectedIndex];
  }

  return selectedOption.value;
}

function setSelectedOption(target, value) {
  if (!value) {
    return;
  }

  var i = void 0;

  for (i = 0; i < target.options.length; i++) {
    var option = target.options[i];

    if (option.value === value) {
      break;
    }
  }

  target.selectedIndex = i;
}

/**
 * Manipulate settings of texttracks
 *
 * @param {Object} player  Main Player
 * @param {Object=} options Object of option names and values
 * @extends Component
 * @class TextTrackSettings
 */

var TextTrackSettings = function (_Component) {
  _inherits(TextTrackSettings, _Component);

  function TextTrackSettings(player, options) {
    _classCallCheck(this, TextTrackSettings);

    var _this = _possibleConstructorReturn(this, _Component.call(this, player, options));

    _this.hide();

    // Grab `persistTextTrackSettings` from the player options if not passed in child options
    if (options.persistTextTrackSettings === undefined) {
      _this.options_.persistTextTrackSettings = _this.options_.playerOptions.persistTextTrackSettings;
    }

    Events.on(_this.$('.vjs-done-button'), 'click', Fn.bind(_this, function () {
      this.saveSettings();
      this.hide();
    }));

    Events.on(_this.$('.vjs-default-button'), 'click', Fn.bind(_this, function () {
      this.$('.vjs-fg-color > select').selectedIndex = 0;
      this.$('.vjs-bg-color > select').selectedIndex = 0;
      this.$('.window-color > select').selectedIndex = 0;
      this.$('.vjs-text-opacity > select').selectedIndex = 0;
      this.$('.vjs-bg-opacity > select').selectedIndex = 0;
      this.$('.vjs-window-opacity > select').selectedIndex = 0;
      this.$('.vjs-edge-style select').selectedIndex = 0;
      this.$('.vjs-font-family select').selectedIndex = 0;
      this.$('.vjs-font-percent select').selectedIndex = 2;
      this.updateDisplay();
    }));

    Events.on(_this.$('.vjs-fg-color > select'), 'change', Fn.bind(_this, _this.updateDisplay));
    Events.on(_this.$('.vjs-bg-color > select'), 'change', Fn.bind(_this, _this.updateDisplay));
    Events.on(_this.$('.window-color > select'), 'change', Fn.bind(_this, _this.updateDisplay));
    Events.on(_this.$('.vjs-text-opacity > select'), 'change', Fn.bind(_this, _this.updateDisplay));
    Events.on(_this.$('.vjs-bg-opacity > select'), 'change', Fn.bind(_this, _this.updateDisplay));
    Events.on(_this.$('.vjs-window-opacity > select'), 'change', Fn.bind(_this, _this.updateDisplay));
    Events.on(_this.$('.vjs-font-percent select'), 'change', Fn.bind(_this, _this.updateDisplay));
    Events.on(_this.$('.vjs-edge-style select'), 'change', Fn.bind(_this, _this.updateDisplay));
    Events.on(_this.$('.vjs-font-family select'), 'change', Fn.bind(_this, _this.updateDisplay));

    if (_this.options_.persistTextTrackSettings) {
      _this.restoreSettings();
    }
    return _this;
  }

  /**
   * Create the component's DOM element
   *
   * @return {Element}
   * @method createEl
   */


  TextTrackSettings.prototype.createEl = function createEl() {
    var uniqueId = this.id_;
    var dialogLabelId = 'TTsettingsDialogLabel-' + uniqueId;
    var dialogDescriptionId = 'TTsettingsDialogDescription-' + uniqueId;

    return _Component.prototype.createEl.call(this, 'div', {
      className: 'vjs-caption-settings vjs-modal-overlay',
      innerHTML: captionOptionsMenuTemplate(uniqueId, dialogLabelId, dialogDescriptionId),
      tabIndex: -1
    }, {
      'role': 'dialog',
      'aria-labelledby': dialogLabelId,
      'aria-describedby': dialogDescriptionId
    });
  };

  /**
   * Get texttrack settings
   * Settings are
   * .vjs-edge-style
   * .vjs-font-family
   * .vjs-fg-color
   * .vjs-text-opacity
   * .vjs-bg-color
   * .vjs-bg-opacity
   * .window-color
   * .vjs-window-opacity
   *
   * @return {Object}
   * @method getValues
   */


  TextTrackSettings.prototype.getValues = function getValues() {
    var textEdge = getSelectedOptionValue(this.$('.vjs-edge-style select'));
    var fontFamily = getSelectedOptionValue(this.$('.vjs-font-family select'));
    var fgColor = getSelectedOptionValue(this.$('.vjs-fg-color > select'));
    var textOpacity = getSelectedOptionValue(this.$('.vjs-text-opacity > select'));
    var bgColor = getSelectedOptionValue(this.$('.vjs-bg-color > select'));
    var bgOpacity = getSelectedOptionValue(this.$('.vjs-bg-opacity > select'));
    var windowColor = getSelectedOptionValue(this.$('.window-color > select'));
    var windowOpacity = getSelectedOptionValue(this.$('.vjs-window-opacity > select'));
    var fontPercent = _window2['default'].parseFloat(getSelectedOptionValue(this.$('.vjs-font-percent > select')));

    var result = {
      fontPercent: fontPercent,
      fontFamily: fontFamily,
      textOpacity: textOpacity,
      windowColor: windowColor,
      windowOpacity: windowOpacity,
      backgroundOpacity: bgOpacity,
      edgeStyle: textEdge,
      color: fgColor,
      backgroundColor: bgColor
    };

    for (var name in result) {
      if (result[name] === '' || result[name] === 'none' || name === 'fontPercent' && result[name] === 1.00) {
        delete result[name];
      }
    }
    return result;
  };

  /**
   * Set texttrack settings
   * Settings are
   * .vjs-edge-style
   * .vjs-font-family
   * .vjs-fg-color
   * .vjs-text-opacity
   * .vjs-bg-color
   * .vjs-bg-opacity
   * .window-color
   * .vjs-window-opacity
   *
   * @param {Object} values Object with texttrack setting values
   * @method setValues
   */


  TextTrackSettings.prototype.setValues = function setValues(values) {
    setSelectedOption(this.$('.vjs-edge-style select'), values.edgeStyle);
    setSelectedOption(this.$('.vjs-font-family select'), values.fontFamily);
    setSelectedOption(this.$('.vjs-fg-color > select'), values.color);
    setSelectedOption(this.$('.vjs-text-opacity > select'), values.textOpacity);
    setSelectedOption(this.$('.vjs-bg-color > select'), values.backgroundColor);
    setSelectedOption(this.$('.vjs-bg-opacity > select'), values.backgroundOpacity);
    setSelectedOption(this.$('.window-color > select'), values.windowColor);
    setSelectedOption(this.$('.vjs-window-opacity > select'), values.windowOpacity);

    var fontPercent = values.fontPercent;

    if (fontPercent) {
      fontPercent = fontPercent.toFixed(2);
    }

    setSelectedOption(this.$('.vjs-font-percent > select'), fontPercent);
  };

  /**
   * Restore texttrack settings
   *
   * @method restoreSettings
   */


  TextTrackSettings.prototype.restoreSettings = function restoreSettings() {
    var err = void 0;
    var values = void 0;

    try {
      var _safeParseTuple = (0, _tuple2['default'])(_window2['default'].localStorage.getItem('vjs-text-track-settings'));

      err = _safeParseTuple[0];
      values = _safeParseTuple[1];


      if (err) {
        _log2['default'].error(err);
      }
    } catch (e) {
      _log2['default'].warn(e);
    }

    if (values) {
      this.setValues(values);
    }
  };

  /**
   * Save texttrack settings to local storage
   *
   * @method saveSettings
   */


  TextTrackSettings.prototype.saveSettings = function saveSettings() {
    if (!this.options_.persistTextTrackSettings) {
      return;
    }

    var values = this.getValues();

    try {
      if (Object.getOwnPropertyNames(values).length > 0) {
        _window2['default'].localStorage.setItem('vjs-text-track-settings', JSON.stringify(values));
      } else {
        _window2['default'].localStorage.removeItem('vjs-text-track-settings');
      }
    } catch (e) {
      _log2['default'].warn(e);
    }
  };

  /**
   * Update display of texttrack settings
   *
   * @method updateDisplay
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

},{"145":145,"5":5,"81":81,"82":82,"85":85,"93":93}],72:[function(_dereq_,module,exports){
'use strict';

exports.__esModule = true;

var _textTrackCueList = _dereq_(67);

var _textTrackCueList2 = _interopRequireDefault(_textTrackCueList);

var _fn = _dereq_(82);

var Fn = _interopRequireWildcard(_fn);

var _trackEnums = _dereq_(73);

var _log = _dereq_(85);

var _log2 = _interopRequireDefault(_log);

var _window = _dereq_(93);

var _window2 = _interopRequireDefault(_window);

var _track = _dereq_(75);

var _track2 = _interopRequireDefault(_track);

var _url = _dereq_(90);

var _xhr = _dereq_(147);

var _xhr2 = _interopRequireDefault(_xhr);

var _mergeOptions = _dereq_(86);

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
 * takes a webvtt file contents and parses it into cues
 *
 * @param {String} srcContent webVTT file contents
 * @param {Track} track track to addcues to
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
 * load a track from a  specifed url
 *
 * @param {String} src url to load track from
 * @param {Track} track track to addcues to
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
        (function () {
          var loadHandler = function loadHandler() {
            return parseCues(responseBody, track);
          };

          track.tech_.on('vttjsloaded', loadHandler);
          track.tech_.on('vttjserror', function () {
            _log2['default'].error('vttjs failed to load, stopping trying to process ' + track.src);
            track.tech_.off('vttjsloaded', loadHandler);
          });
        })();
      }
    } else {
      parseCues(responseBody, track);
    }
  }));
};

/**
 * A single text track as defined in:
 * @link https://html.spec.whatwg.org/multipage/embedded-content.html#texttrack
 *
 * interface TextTrack : EventTarget {
 *   readonly attribute TextTrackKind kind;
 *   readonly attribute DOMString label;
 *   readonly attribute DOMString language;
 *
 *   readonly attribute DOMString id;
 *   readonly attribute DOMString inBandMetadataTrackDispatchType;
 *
 *   attribute TextTrackMode mode;
 *
 *   readonly attribute TextTrackCueList? cues;
 *   readonly attribute TextTrackCueList? activeCues;
 *
 *   void addCue(TextTrackCue cue);
 *   void removeCue(TextTrackCue cue);
 *
 *   attribute EventHandler oncuechange;
 * };
 *
 * @param {Object=} options Object of option names and values
 * @extends Track
 * @class TextTrack
 */

var TextTrack = function (_Track) {
  _inherits(TextTrack, _Track);

  function TextTrack() {
    var _this, _ret2;

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
      tt.tech_.on('timeupdate', timeupdateHandler);
    }

    Object.defineProperty(tt, 'default', {
      get: function get() {
        return default_;
      },
      set: function set() {}
    });

    Object.defineProperty(tt, 'mode', {
      get: function get() {
        return mode;
      },
      set: function set(newMode) {
        if (!_trackEnums.TextTrackMode[newMode]) {
          return;
        }
        mode = newMode;
        if (mode === 'showing') {
          this.tech_.on('timeupdate', timeupdateHandler);
        }
        this.trigger('modechange');
      }
    });

    Object.defineProperty(tt, 'cues', {
      get: function get() {
        if (!this.loaded_) {
          return null;
        }

        return cues;
      },
      set: function set() {}
    });

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

    return _ret2 = tt, _possibleConstructorReturn(_this, _ret2);
  }

  /**
   * add a cue to the internal list of cues
   *
   * @param {Object} cue the cue to add to our internal list
   * @method addCue
   */


  TextTrack.prototype.addCue = function addCue(cue) {
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
   * remvoe a cue from our internal list
   *
   * @param {Object} removeCue the cue to remove from our internal list
   * @method removeCue
   */


  TextTrack.prototype.removeCue = function removeCue(_removeCue) {
    var removed = false;

    for (var i = 0, l = this.cues_.length; i < l; i++) {
      var cue = this.cues_[i];

      if (cue === _removeCue) {
        this.cues_.splice(i, 1);
        removed = true;
      }
    }

    if (removed) {
      this.cues.setCues_(this.cues_);
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

},{"147":147,"67":67,"73":73,"75":75,"78":78,"82":82,"85":85,"86":86,"90":90,"93":93}],73:[function(_dereq_,module,exports){
'use strict';

exports.__esModule = true;
/**
 * @file track-kinds.js
 */

/**
 * https://html.spec.whatwg.org/multipage/embedded-content.html#dom-videotrack-kind
 *
 * enum VideoTrackKind {
 *   "alternative",
 *   "captions",
 *   "main",
 *   "sign",
 *   "subtitles",
 *   "commentary",
 *   "",
 * };
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
 * https://html.spec.whatwg.org/multipage/embedded-content.html#dom-audiotrack-kind
 *
 * enum AudioTrackKind {
 *   "alternative",
 *   "descriptions",
 *   "main",
 *   "main-desc",
 *   "translation",
 *   "commentary",
 *   "",
 * };
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
 * https://html.spec.whatwg.org/multipage/embedded-content.html#texttrackkind
 *
 * enum TextTrackKind {
 *   "subtitles",
 *   "captions",
 *   "descriptions",
 *   "chapters",
 *   "metadata"
 * };
 */
var TextTrackKind = exports.TextTrackKind = {
  subtitles: 'subtitles',
  captions: 'captions',
  descriptions: 'descriptions',
  chapters: 'chapters',
  metadata: 'metadata'
};

/**
 * https://html.spec.whatwg.org/multipage/embedded-content.html#texttrackmode
 *
 * enum TextTrackMode { "disabled",  "hidden",  "showing" };
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

var _document = _dereq_(92);

var _document2 = _interopRequireDefault(_document);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * @file track-list.js
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                */


/**
 * Common functionaliy between Text, Audio, and Video TrackLists
 * Interfaces defined in the following spec:
 * @link https://html.spec.whatwg.org/multipage/embedded-content.html
 *
 * @param {Track[]} tracks A list of tracks to initialize the list with
 * @param {Object} list the child object with inheritance done manually for ie8
 * @extends EventTarget
 * @class TrackList
 */
var TrackList = function (_EventTarget) {
  _inherits(TrackList, _EventTarget);

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
    Object.defineProperty(list, 'length', {
      get: function get() {
        return this.tracks_.length;
      }
    });

    for (var i = 0; i < tracks.length; i++) {
      list.addTrack_(tracks[i]);
    }

    return _ret = list, _possibleConstructorReturn(_this, _ret);
  }

  /**
   * Add a Track from TrackList
   *
   * @param {Mixed} track
   * @method addTrack_
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
      this.trigger({
        track: track,
        type: 'addtrack'
      });
    }
  };

  /**
   * Remove a Track from TrackList
   *
   * @param {Track} rtrack track to be removed
   * @method removeTrack_
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
 * change - One or more tracks in the track list have been enabled or disabled.
 * addtrack - A track has been added to the track list.
 * removetrack - A track has been removed from the track list.
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

},{"42":42,"78":78,"92":92}],75:[function(_dereq_,module,exports){
'use strict';

exports.__esModule = true;

var _browser = _dereq_(78);

var browser = _interopRequireWildcard(_browser);

var _document = _dereq_(92);

var _document2 = _interopRequireDefault(_document);

var _guid = _dereq_(84);

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
 * setup the common parts of an audio, video, or text track
 * @link https://html.spec.whatwg.org/multipage/embedded-content.html
 *
 * @param {String} type The type of track we are dealing with audio|video|text
 * @param {Object=} options Object of option names and values
 * @extends EventTarget
 * @class Track
 */
var Track = function (_EventTarget) {
  _inherits(Track, _EventTarget);

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

},{"42":42,"78":78,"84":84,"92":92}],76:[function(_dereq_,module,exports){
'use strict';

exports.__esModule = true;

var _trackList = _dereq_(74);

var _trackList2 = _interopRequireDefault(_trackList);

var _browser = _dereq_(78);

var browser = _interopRequireWildcard(_browser);

var _document = _dereq_(92);

var _document2 = _interopRequireDefault(_document);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * @file video-track-list.js
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                */


/**
 * disable other video tracks before selecting the new one
 *
 * @param {Array|VideoTrackList} list list to work on
 * @param {VideoTrack} track the track to skip
 */
var disableOthers = function disableOthers(list, track) {
  for (var i = 0; i < list.length; i++) {
    if (track.id === list[i].id) {
      continue;
    }
    // another audio track is enabled, disable it
    list[i].selected = false;
  }
};

/**
* A list of possiblee video tracks. Most functionality is in the
 * base class Tracklist and the spec for VideoTrackList is located at:
 * @link https://html.spec.whatwg.org/multipage/embedded-content.html#videotracklist
 *
 * interface VideoTrackList : EventTarget {
 *   readonly attribute unsigned long length;
 *   getter VideoTrack (unsigned long index);
 *   VideoTrack? getTrackById(DOMString id);
 *   readonly attribute long selectedIndex;
 *
 *   attribute EventHandler onchange;
 *   attribute EventHandler onaddtrack;
 *   attribute EventHandler onremovetrack;
 * };
 *
 * @param {VideoTrack[]} tracks a list of video tracks to instantiate the list with
 # @extends TrackList
 * @class VideoTrackList
 */

var VideoTrackList = function (_TrackList) {
  _inherits(VideoTrackList, _TrackList);

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

  VideoTrackList.prototype.addTrack = function addTrack(track) {
    this.addTrack_(track);
  };

  VideoTrackList.prototype.removeTrack = function removeTrack(track) {
    _TrackList.prototype.removeTrack_.call(this, track);
  };

  return VideoTrackList;
}(_trackList2['default']);

exports['default'] = VideoTrackList;

},{"74":74,"78":78,"92":92}],77:[function(_dereq_,module,exports){
'use strict';

exports.__esModule = true;

var _trackEnums = _dereq_(73);

var _track = _dereq_(75);

var _track2 = _interopRequireDefault(_track);

var _mergeOptions = _dereq_(86);

var _mergeOptions2 = _interopRequireDefault(_mergeOptions);

var _browser = _dereq_(78);

var browser = _interopRequireWildcard(_browser);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

/**
 * A single video text track as defined in:
 * @link https://html.spec.whatwg.org/multipage/embedded-content.html#videotrack
 *
 * interface VideoTrack {
 *   readonly attribute DOMString id;
 *   readonly attribute DOMString kind;
 *   readonly attribute DOMString label;
 *   readonly attribute DOMString language;
 *   attribute boolean selected;
 * };
 *
 * @param {Object=} options Object of option names and values
 * @class VideoTrack
 */
var VideoTrack = function (_Track) {
  _inherits(VideoTrack, _Track);

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

},{"73":73,"75":75,"78":78,"86":86}],78:[function(_dereq_,module,exports){
'use strict';

exports.__esModule = true;
exports.BACKGROUND_SIZE_SUPPORTED = exports.TOUCH_ENABLED = exports.IE_VERSION = exports.IS_IE8 = exports.IS_CHROME = exports.IS_EDGE = exports.IS_FIREFOX = exports.IS_NATIVE_ANDROID = exports.IS_OLD_ANDROID = exports.ANDROID_VERSION = exports.IS_ANDROID = exports.IOS_VERSION = exports.IS_IOS = exports.IS_IPOD = exports.IS_IPHONE = exports.IS_IPAD = undefined;

var _document = _dereq_(92);

var _document2 = _interopRequireDefault(_document);

var _window = _dereq_(93);

var _window2 = _interopRequireDefault(_window);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

/**
 * @file browser.js
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
var IS_IE8 = exports.IS_IE8 = /MSIE\s8\.0/.test(USER_AGENT);
var IE_VERSION = exports.IE_VERSION = function (result) {
  return result && parseFloat(result[1]);
}(/MSIE\s(\d+)\.\d/.exec(USER_AGENT));

var TOUCH_ENABLED = exports.TOUCH_ENABLED = !!('ontouchstart' in _window2['default'] || _window2['default'].DocumentTouch && _document2['default'] instanceof _window2['default'].DocumentTouch);
var BACKGROUND_SIZE_SUPPORTED = exports.BACKGROUND_SIZE_SUPPORTED = 'backgroundSize' in _document2['default'].createElement('video').style;

},{"92":92,"93":93}],79:[function(_dereq_,module,exports){
'use strict';

exports.__esModule = true;
exports.bufferedPercent = bufferedPercent;

var _timeRanges = _dereq_(88);

/**
 * Compute how much your video has been buffered
 *
 * @param  {Object} Buffered object
 * @param  {Number} Total duration
 * @return {Number} Percent buffered of the total duration
 * @private
 * @function bufferedPercent
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
   */

},{"88":88}],80:[function(_dereq_,module,exports){
'use strict';

exports.__esModule = true;
exports.$$ = exports.$ = undefined;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; /**
                                                                                                                                                                                                                                                                               * @file dom.js
                                                                                                                                                                                                                                                                               */


var _templateObject = _taggedTemplateLiteralLoose(['Setting attributes in the second argument of createEl()\n                has been deprecated. Use the third argument instead.\n                createEl(type, properties, attributes). Attempting to set ', ' to ', '.'], ['Setting attributes in the second argument of createEl()\n                has been deprecated. Use the third argument instead.\n                createEl(type, properties, attributes). Attempting to set ', ' to ', '.']);

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
exports.blockTextSelection = blockTextSelection;
exports.unblockTextSelection = unblockTextSelection;
exports.findElPosition = findElPosition;
exports.getPointerPosition = getPointerPosition;
exports.isTextNode = isTextNode;
exports.emptyEl = emptyEl;
exports.normalizeContent = normalizeContent;
exports.appendContent = appendContent;
exports.insertContent = insertContent;

var _document = _dereq_(92);

var _document2 = _interopRequireDefault(_document);

var _window = _dereq_(93);

var _window2 = _interopRequireDefault(_window);

var _guid = _dereq_(84);

var Guid = _interopRequireWildcard(_guid);

var _log = _dereq_(85);

var _log2 = _interopRequireDefault(_log);

var _tsml = _dereq_(146);

var _tsml2 = _interopRequireDefault(_tsml);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _taggedTemplateLiteralLoose(strings, raw) { strings.raw = raw; return strings; }

/**
 * Detect if a value is a string with any non-whitespace characters.
 *
 * @param  {String} str
 * @return {Boolean}
 */
function isNonBlankString(str) {
  return typeof str === 'string' && /\S/.test(str);
}

/**
 * Throws an error if the passed string has whitespace. This is used by
 * class methods to be relatively consistent with the classList API.
 *
 * @param  {String} str
 * @return {Boolean}
 */
function throwIfWhitespace(str) {
  if (/\s/.test(str)) {
    throw new Error('class has illegal whitespace characters');
  }
}

/**
 * Produce a regular expression for matching a class name.
 *
 * @param  {String} className
 * @return {RegExp}
 */
function classRegExp(className) {
  return new RegExp('(^|\\s)' + className + '($|\\s)');
}

/**
 * Determines, via duck typing, whether or not a value is a DOM element.
 *
 * @function isEl
 * @param    {Mixed} value
 * @return   {Boolean}
 */
function isEl(value) {
  return !!value && (typeof value === 'undefined' ? 'undefined' : _typeof(value)) === 'object' && value.nodeType === 1;
}

/**
 * Creates functions to query the DOM using a given method.
 *
 * @function createQuerier
 * @private
 * @param  {String} method
 * @return {Function}
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
 * @param  {String} id  Element ID
 * @return {Element}    Element with supplied ID
 * @function getEl
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
 * @param  {String} [tagName='div'] Name of tag to be created.
 * @param  {Object} [properties={}] Element properties to be applied.
 * @param  {Object} [attributes={}] Element attributes to be applied.
 * @return {Element}
 * @function createEl
 */
function createEl() {
  var tagName = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'div';
  var properties = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  var attributes = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

  var el = _document2['default'].createElement(tagName);

  Object.getOwnPropertyNames(properties).forEach(function (propName) {
    var val = properties[propName];

    // See #2176
    // We originally were accepting both properties and attributes in the
    // same object, but that doesn't work so well.
    if (propName.indexOf('aria-') !== -1 || propName === 'role' || propName === 'type') {
      _log2['default'].warn((0, _tsml2['default'])(_templateObject, propName, val));
      el.setAttribute(propName, val);
    } else {
      el[propName] = val;
    }
  });

  Object.getOwnPropertyNames(attributes).forEach(function (attrName) {
    el.setAttribute(attrName, attributes[attrName]);
  });

  return el;
}

/**
 * Injects text into an element, replacing any existing contents entirely.
 *
 * @param  {Element} el
 * @param  {String} text
 * @return {Element}
 * @function textContent
 */
function textContent(el, text) {
  if (typeof el.textContent === 'undefined') {
    el.innerText = text;
  } else {
    el.textContent = text;
  }
}

/**
 * Insert an element as the first child node of another
 *
 * @param  {Element} child   Element to insert
 * @param  {Element} parent Element to insert child into
 * @private
 * @function insertElFirst
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
 * @type {String}
 * @constant
 * @private
 */
var elIdAttr = 'vdata' + new Date().getTime();

/**
 * Returns the cache object where data for an element is stored
 *
 * @param  {Element} el Element to store data for.
 * @return {Object}
 * @function getElData
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
 * @param  {Element} el A dom element
 * @return {Boolean}
 * @private
 * @function hasElData
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
 * @param  {Element} el Remove data for an element
 * @private
 * @function removeElData
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
 * @function hasElClass
 * @param {Element} element Element to check
 * @param {String} classToCheck Classname to check
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
 * @function addElClass
 * @param {Element} element    Element to add class name to
 * @param {String} classToAdd Classname to add
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
 * @function removeElClass
 * @param {Element} element    Element to remove from class name
 * @param {String} classToRemove Classname to remove
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
 * Adds or removes a CSS class name on an element depending on an optional
 * condition or the presence/absence of the class name.
 *
 * @function toggleElClass
 * @param    {Element} element
 * @param    {String} classToToggle
 * @param    {Boolean|Function} [predicate]
 *           Can be a function that returns a Boolean. If `true`, the class
 *           will be added; if `false`, the class will be removed. If not
 *           given, the class will be added if not present and vice versa.
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
 * @param  {Element} el         Target element.
 * @param  {Object=} attributes Element attributes to be applied.
 * @private
 * @function setElAttributes
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
 * @param  {Element} tag Element from which to get tag attributes
 * @return {Object}
 * @private
 * @function getElAttributes
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
 * Attempt to block the ability to select text while dragging controls
 *
 * @return {Boolean}
 * @function blockTextSelection
 */
function blockTextSelection() {
  _document2['default'].body.focus();
  _document2['default'].onselectstart = function () {
    return false;
  };
}

/**
 * Turn off text selection blocking
 *
 * @return {Boolean}
 * @function unblockTextSelection
 */
function unblockTextSelection() {
  _document2['default'].onselectstart = function () {
    return true;
  };
}

/**
 * Offset Left
 * getBoundingClientRect technique from
 * John Resig http://ejohn.org/blog/getboundingclientrect-is-awesome/
 *
 * @function findElPosition
 * @param {Element} el Element from which to get offset
 * @return {Object}
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
 * Get pointer position in element
 * Returns an object with x and y coordinates.
 * The base on the coordinates are the bottom left of the element.
 *
 * @function getPointerPosition
 * @param {Element} el Element on which to get the pointer position on
 * @param {Event} event Event object
 * @return {Object} This object will have x and y coordinates corresponding to the mouse position
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
 * @param  {Mixed} value
 * @return {Boolean}
 */
function isTextNode(value) {
  return !!value && (typeof value === 'undefined' ? 'undefined' : _typeof(value)) === 'object' && value.nodeType === 3;
}

/**
 * Empties the contents of an element.
 *
 * @function emptyEl
 * @param    {Element} el
 * @return   {Element}
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
 * @function normalizeContent
 * @param    {String|Element|TextNode|Array|Function} content
 * @return   {Array}
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
 * @function appendContent
 * @param    {Element} el
 * @param    {String|Element|TextNode|Array|Function} content
 *           See: `normalizeContent`
 * @return   {Element}
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
 * @function insertContent
 * @param    {Element} el
 * @param    {String|Element|TextNode|Array|Function} content
 *           See: `normalizeContent`
 * @return   {Element}
 */
function insertContent(el, content) {
  return appendContent(emptyEl(el), content);
}

/**
 * Finds a single DOM element matching `selector` within the optional
 * `context` of another DOM element (defaulting to `document`).
 *
 * @function $
 * @param    {String} selector
 *           A valid CSS selector, which will be passed to `querySelector`.
 *
 * @param    {Element|String} [context=document]
 *           A DOM element within which to query. Can also be a selector
 *           string in which case the first matching element will be used
 *           as context. If missing (or no element matches selector), falls
 *           back to `document`.
 *
 * @return   {Element|null}
 */
var $ = exports.$ = createQuerier('querySelector');

/**
 * Finds a all DOM elements matching `selector` within the optional
 * `context` of another DOM element (defaulting to `document`).
 *
 * @function $$
 * @param    {String} selector
 *           A valid CSS selector, which will be passed to `querySelectorAll`.
 *
 * @param    {Element|String} [context=document]
 *           A DOM element within which to query. Can also be a selector
 *           string in which case the first matching element will be used
 *           as context. If missing (or no element matches selector), falls
 *           back to `document`.
 *
 * @return   {NodeList}
 */
var $$ = exports.$$ = createQuerier('querySelectorAll');

},{"146":146,"84":84,"85":85,"92":92,"93":93}],81:[function(_dereq_,module,exports){
'use strict';

exports.__esModule = true;
exports.fixEvent = fixEvent;
exports.on = on;
exports.off = off;
exports.trigger = trigger;
exports.one = one;

var _dom = _dereq_(80);

var Dom = _interopRequireWildcard(_dom);

var _guid = _dereq_(84);

var Guid = _interopRequireWildcard(_guid);

var _log = _dereq_(85);

var _log2 = _interopRequireDefault(_log);

var _window = _dereq_(93);

var _window2 = _interopRequireDefault(_window);

var _document = _dereq_(92);

var _document2 = _interopRequireDefault(_document);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

/**
 * Clean up the listener cache and dispatchers
*
 * @param  {Element|Object} elem Element to clean up
 * @param  {String} type Type of event to clean up
 * @private
 * @method _cleanUpEvents
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
 * @param  {Function} fn   The event method we want to use.
 * @param  {Element|Object} elem Element or object to bind listeners to
 * @param  {String}   type Type of event to bind to.
 * @param  {Function} callback   Event listener.
 * @private
 * @function _handleMultipleEvents
 */
/**
 * @file events.js
 *
 * Event System (John Resig - Secrets of a JS Ninja http://jsninja.com/)
 * (Original book version wasn't completely usable, so fixed some things and made Closure Compiler compatible)
 * This should work very similarly to jQuery's events, however it's based off the book version which isn't as
 * robust as jquery's, so there's probably some differences.
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
 * @param  {Object} event Event object to fix
 * @return {Object}
 * @private
 * @method fixEvent
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
    (function () {
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
    })();
  }

  // Returns fixed-up instance
  return event;
}

/**
 * Add an event listener to element
 * It stores the handler function in a separate cache object
 * and adds a generic handler to the element's event,
 * along with a unique id (guid) to the element.
 *
 * @param  {Element|Object}   elem Element or object to bind listeners to
 * @param  {String|Array}   type Type of event to bind to.
 * @param  {Function} fn   Event listener.
 * @method on
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
      elem.addEventListener(type, data.dispatcher, false);
    } else if (elem.attachEvent) {
      elem.attachEvent('on' + type, data.dispatcher);
    }
  }
}

/**
 * Removes event listeners from an element
 *
 * @param  {Element|Object}   elem Object to remove listeners from
 * @param  {String|Array=}   type Type of listener to remove. Don't include to remove all events from element.
 * @param  {Function} fn   Specific listener to remove. Don't include to remove listeners for an event type.
 * @method off
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
 * @param  {Element|Object}      elem  Element to trigger an event on
 * @param  {Event|Object|String} event A string (the type) or an event object with a type attribute
 * @param  {Object} [hash] data hash to pass along with the event
 * @return {Boolean=} Returned only if default was prevented
 * @method trigger
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
 * @param  {Element|Object}   elem Element or object to
 * @param  {String|Array}   type Name/type of event
 * @param  {Function} fn Event handler function
 * @method one
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

},{"80":80,"84":84,"85":85,"92":92,"93":93}],82:[function(_dereq_,module,exports){
'use strict';

exports.__esModule = true;
exports.bind = undefined;

var _guid = _dereq_(84);

/**
 * Bind (a.k.a proxy or Context). A simple method for changing the context of a function
 * It also stores a unique id on the function so it can be easily removed from events
 *
 * @param  {*}   context The object to bind as scope
 * @param  {Function} fn      The function to be bound to a scope
 * @param  {Number=}   uid     An optional unique ID for the function to be set
 * @return {Function}
 * @private
 * @method bind
 */
var bind = exports.bind = function bind(context, fn, uid) {
  // Make sure the function has a unique ID
  if (!fn.guid) {
    fn.guid = (0, _guid.newGUID)();
  }

  // Create the new function that changes the context
  var ret = function ret() {
    return fn.apply(context, arguments);
  };

  // Allow for the ability to individualize this function
  // Needed in the case where multiple objects might share the same prototype
  // IF both items add an event listener with the same function, then you try to remove just one
  // it will remove both because they both have the same guid.
  // when using this, you need to use the bind method when you remove the listener as well.
  // currently used in text tracks
  ret.guid = uid ? uid + '_' + fn.guid : fn.guid;

  return ret;
}; /**
    * @file fn.js
    */

},{"84":84}],83:[function(_dereq_,module,exports){
'use strict';

exports.__esModule = true;
/**
 * @file format-time.js
 *
 * Format seconds as a time string, H:MM:SS or M:SS
 * Supplying a guide (in seconds) will force a number of leading zeros
 * to cover the length of the guide
 *
 * @param  {Number} seconds Number of seconds to be turned into a string
 * @param  {Number} guide   Number (in seconds) to model the string after
 * @return {String}         Time formatted as H:MM:SS or M:SS
 * @private
 * @function formatTime
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

},{}],84:[function(_dereq_,module,exports){
"use strict";

exports.__esModule = true;
exports.newGUID = newGUID;
/**
 * @file guid.js
 *
 * Unique ID for an element or function
 * @type {Number}
 * @private
 */
var _guid = 1;

/**
 * Get the next unique ID
 *
 * @return {String}
 * @function newGUID
 */
function newGUID() {
  return _guid++;
}

},{}],85:[function(_dereq_,module,exports){
'use strict';

exports.__esModule = true;
exports.logByType = undefined;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; /**
                                                                                                                                                                                                                                                                               * @file log.js
                                                                                                                                                                                                                                                                               */


var _window = _dereq_(93);

var _window2 = _interopRequireDefault(_window);

var _browser = _dereq_(78);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var log = void 0;

/**
 * Log messages to the console and history based on the type of message
 *
 * @param  {String} type
 *         The name of the console method to use.
 * @param  {Array} args
 *         The arguments to be passed to the matching console method.
 * @param  {Boolean} [stringify]
 *         By default, only old IEs should get console argument stringification,
 *         but this is exposed as a parameter to facilitate testing.
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
      if (a && (typeof a === 'undefined' ? 'undefined' : _typeof(a)) === 'object' || Array.isArray(a)) {
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
 * @function log
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
 * @method error
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
 * @method warn
 */
log.warn = function () {
  for (var _len3 = arguments.length, args = Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
    args[_key3] = arguments[_key3];
  }

  return logByType('warn', args);
};

exports['default'] = log;

},{"78":78,"93":93}],86:[function(_dereq_,module,exports){
'use strict';

exports.__esModule = true;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; /**
                                                                                                                                                                                                                                                                               * @file merge-options.js
                                                                                                                                                                                                                                                                               */


exports['default'] = mergeOptions;

var _merge = _dereq_(131);

var _merge2 = _interopRequireDefault(_merge);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function isPlain(obj) {
  return !!obj && (typeof obj === 'undefined' ? 'undefined' : _typeof(obj)) === 'object' && obj.toString() === '[object Object]' && obj.constructor === Object;
}

/**
 * Merge customizer. video.js simply overwrites non-simple objects
 * (like arrays) instead of attempting to overlay them.
 * @see https://lodash.com/docs#merge
 */
function customizer(destination, source) {
  // If we're not working with a plain object, copy the value as is
  // If source is an array, for instance, it will replace destination
  if (!isPlain(source)) {
    return source;
  }

  // If the new value is a plain object but the first object value is not
  // we need to create a new object for the first object to merge with.
  // This makes it consistent with how merge() works by default
  // and also protects from later changes the to first object affecting
  // the second object's values.
  if (!isPlain(destination)) {
    return mergeOptions(source);
  }
}

/**
 * Merge one or more options objects, recursively merging **only**
 * plain object properties.  Previously `deepMerge`.
 *
 * @param  {...Object} source One or more objects to merge
 * @returns {Object}          a new object that is the union of all
 * provided objects
 * @function mergeOptions
 */
function mergeOptions() {
  // contruct the call dynamically to handle the variable number of
  // objects to merge
  var args = Array.prototype.slice.call(arguments);

  // unshift an empty object into the front of the call as the target
  // of the merge
  args.unshift({});

  // customize conflict resolution to match our historical merge behavior
  args.push(customizer);

  _merge2['default'].apply(null, args);

  // return the mutated result object
  return args[0];
}

},{"131":131}],87:[function(_dereq_,module,exports){
'use strict';

exports.__esModule = true;
exports.setTextContent = exports.createStyleElement = undefined;

var _document = _dereq_(92);

var _document2 = _interopRequireDefault(_document);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var createStyleElement = exports.createStyleElement = function createStyleElement(className) {
  var style = _document2['default'].createElement('style');

  style.className = className;

  return style;
};

var setTextContent = exports.setTextContent = function setTextContent(el, content) {
  if (el.styleSheet) {
    el.styleSheet.cssText = content;
  } else {
    el.textContent = content;
  }
};

},{"92":92}],88:[function(_dereq_,module,exports){
'use strict';

exports.__esModule = true;
exports.createTimeRange = undefined;
exports.createTimeRanges = createTimeRanges;

var _log = _dereq_(85);

var _log2 = _interopRequireDefault(_log);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function rangeCheck(fnName, index, maxIndex) {
  if (index < 0 || index > maxIndex) {
    throw new Error('Failed to execute \'' + fnName + '\' on \'TimeRanges\': The index provided (' + index + ') is greater than or equal to the maximum bound (' + maxIndex + ').');
  }
}

function getRange(fnName, valueIndex, ranges, rangeIndex) {
  if (rangeIndex === undefined) {
    _log2['default'].warn('DEPRECATED: Function \'' + fnName + '\' on \'TimeRanges\' called without an index argument.');
    rangeIndex = 0;
  }
  rangeCheck(fnName, rangeIndex, ranges.length - 1);
  return ranges[rangeIndex][valueIndex];
}

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
 * @file time-ranges.js
 *
 * Should create a fake TimeRange object
 * Mimics an HTML5 time range instance, which has functions that
 * return the start and end times for a range
 * TimeRanges are returned by the buffered() method
 *
 * @param  {(Number|Array)} Start of a single range or an array of ranges
 * @param  {Number} End of a single range
 * @private
 * @method createTimeRanges
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

},{"85":85}],89:[function(_dereq_,module,exports){
"use strict";

exports.__esModule = true;
/**
 * @file to-title-case.js
 *
 * Uppercase the first letter of a string
 *
 * @param  {String} string String to be uppercased
 * @return {String}
 * @private
 * @method toTitleCase
 */
function toTitleCase(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

exports["default"] = toTitleCase;

},{}],90:[function(_dereq_,module,exports){
'use strict';

exports.__esModule = true;
exports.isCrossOrigin = exports.getFileExtension = exports.getAbsoluteURL = exports.parseUrl = undefined;

var _document = _dereq_(92);

var _document2 = _interopRequireDefault(_document);

var _window = _dereq_(93);

var _window2 = _interopRequireDefault(_window);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

/**
 * Resolve and parse the elements of a URL
 *
 * @param  {String} url The url to parse
 * @return {Object}     An object of url details
 * @method parseUrl
 */
/**
 * @file url.js
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
 * http://stackoverflow.com/questions/470832/getting-an-absolute-url-from-a-relative-one-ie6-issue
 *
 * @param  {String} url URL to make absolute
 * @return {String}     Absolute URL
 * @private
 * @method getAbsoluteURL
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
 * Returns the extension of the passed file name. It will return an empty string if you pass an invalid path
 *
 * @param {String}    path    The fileName path like '/path/to/file.mp4'
 * @returns {String}          The extension in lower case or an empty string if no extension could be found.
 * @method getFileExtension
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
 * @param {String} url The url to check
 * @return {Boolean}   Whether it is a cross domain request or not
 * @method isCrossOrigin
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

},{"92":92,"93":93}],91:[function(_dereq_,module,exports){
'use strict';

exports.__esModule = true;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; /**
                                                                                                                                                                                                                                                                               * @file video.js
                                                                                                                                                                                                                                                                               */

/* global define */

// Include the built-in techs


var _window = _dereq_(93);

var _window2 = _interopRequireDefault(_window);

var _document = _dereq_(92);

var _document2 = _interopRequireDefault(_document);

var _setup = _dereq_(56);

var setup = _interopRequireWildcard(_setup);

var _stylesheet = _dereq_(87);

var stylesheet = _interopRequireWildcard(_stylesheet);

var _component = _dereq_(5);

var _component2 = _interopRequireDefault(_component);

var _eventTarget = _dereq_(42);

var _eventTarget2 = _interopRequireDefault(_eventTarget);

var _events = _dereq_(81);

var Events = _interopRequireWildcard(_events);

var _player = _dereq_(51);

var _player2 = _interopRequireDefault(_player);

var _plugins = _dereq_(52);

var _plugins2 = _interopRequireDefault(_plugins);

var _mergeOptions = _dereq_(86);

var _mergeOptions2 = _interopRequireDefault(_mergeOptions);

var _fn = _dereq_(82);

var Fn = _interopRequireWildcard(_fn);

var _textTrack = _dereq_(72);

var _textTrack2 = _interopRequireDefault(_textTrack);

var _audioTrack = _dereq_(64);

var _audioTrack2 = _interopRequireDefault(_audioTrack);

var _videoTrack = _dereq_(77);

var _videoTrack2 = _interopRequireDefault(_videoTrack);

var _timeRanges = _dereq_(88);

var _formatTime = _dereq_(83);

var _formatTime2 = _interopRequireDefault(_formatTime);

var _log = _dereq_(85);

var _log2 = _interopRequireDefault(_log);

var _dom = _dereq_(80);

var Dom = _interopRequireWildcard(_dom);

var _browser = _dereq_(78);

var browser = _interopRequireWildcard(_browser);

var _url = _dereq_(90);

var Url = _interopRequireWildcard(_url);

var _extend = _dereq_(43);

var _extend2 = _interopRequireDefault(_extend);

var _merge2 = _dereq_(131);

var _merge3 = _interopRequireDefault(_merge2);

var _xhr = _dereq_(147);

var _xhr2 = _interopRequireDefault(_xhr);

var _tech = _dereq_(62);

var _tech2 = _interopRequireDefault(_tech);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

// HTML5 Element Shim for IE8
if (typeof HTMLVideoElement === 'undefined' && _window2['default'].document && _window2['default'].document.createElement) {
  _document2['default'].createElement('video');
  _document2['default'].createElement('audio');
  _document2['default'].createElement('track');
}

/**
 * Doubles as the main function for users to create a player instance and also
 * the main library object.
 * The `videojs` function can be used to initialize or retrieve a player.
 * ```js
 *     var myPlayer = videojs('my_video_id');
 * ```
 *
 * @param  {String|Element} id      Video element or video element ID
 * @param  {Object=} options        Optional options object for config/settings
 * @param  {Function=} ready        Optional ready callback
 * @return {Player}                 A player instance
 * @mixes videojs
 * @method videojs
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
  // If not, set up a new player and return the instance.
  return tag.player || _player2['default'].players[tag.playerId] || new _player2['default'](tag, options, ready);
}

// Add default styles
if (_window2['default'].VIDEOJS_NO_DYNAMIC_STYLE !== true) {
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

/*
 * Current software version (semver)
 *
 * @type {String}
 */
videojs.VERSION = '5.12.6';

/**
 * The global options object. These are the settings that take effect
 * if no overrides are specified when the player is created.
 *
 * ```js
 *     videojs.options.autoplay = true
 *     // -> all players will autoplay by default
 * ```
 *
 * @type {Object}
 */
videojs.options = _player2['default'].prototype.options_;

/**
 * Get an object with the currently created players, keyed by player ID
 *
 * @return {Object} The created players
 * @mixes videojs
 * @method getPlayers
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
 * ```js
 *     var VjsButton = videojs.getComponent('Button');
 *     // Create a new instance of the component
 *     var myButton = new VjsButton(myPlayer);
 * ```
 *
 * @return {Component} Component identified by name
 * @mixes videojs
 * @method getComponent
 */
videojs.getComponent = _component2['default'].getComponent;

/**
 * Register a component so it can referred to by name
 * Used when adding to other
 * components, either through addChild
 * `component.addChild('myComponent')`
 * or through default children options
 * `{ children: ['myComponent'] }`.
 * ```js
 *     // Get a component to subclass
 *     var VjsButton = videojs.getComponent('Button');
 *     // Subclass the component (see 'extend' doc for more info)
 *     var MySpecialButton = videojs.extend(VjsButton, {});
 *     // Register the new component
 *     VjsButton.registerComponent('MySepcialButton', MySepcialButton);
 *     // (optionally) add the new component as a default player child
 *     myPlayer.addChild('MySepcialButton');
 * ```
 * NOTE: You could also just initialize the component before adding.
 * `component.addChild(new MyComponent());`
 *
 * @param {String} The class name of the component
 * @param {Component} The component class
 * @return {Component} The newly registered component
 * @mixes videojs
 * @method registerComponent
 */
videojs.registerComponent = function (name, comp) {
  if (_tech2['default'].isTech(comp)) {
    _log2['default'].warn('The ' + name + ' tech was registered as a component. It should instead be registered using videojs.registerTech(name, tech)');
  }

  _component2['default'].registerComponent.call(_component2['default'], name, comp);
};

/**
 * Get a Tech class object by name
 * ```js
 *     var Html5 = videojs.getTech('Html5');
 *     // Create a new instance of the component
 *     var html5 = new Html5(options);
 * ```
 *
 * @return {Tech} Tech identified by name
 * @mixes videojs
 * @method getComponent
 */
videojs.getTech = _tech2['default'].getTech;

/**
 * Register a Tech so it can referred to by name.
 * This is used in the tech order for the player.
 *
 * ```js
 *     // get the Html5 Tech
 *     var Html5 = videojs.getTech('Html5');
 *     var MyTech = videojs.extend(Html5, {});
 *     // Register the new Tech
 *     VjsButton.registerTech('Tech', MyTech);
 *     var player = videojs('myplayer', {
 *       techOrder: ['myTech', 'html5']
 *     });
 * ```
 *
 * @param {String} The class name of the tech
 * @param {Tech} The tech class
 * @return {Tech} The newly registered Tech
 * @mixes videojs
 * @method registerTech
 */
videojs.registerTech = _tech2['default'].registerTech;

/**
 * A suite of browser and device tests
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
 * @deprecated
 * @type {Boolean}
 */
videojs.TOUCH_ENABLED = browser.TOUCH_ENABLED;

/**
 * Subclass an existing class
 * Mimics ES6 subclassing with the `extend` keyword
 * ```js
 *     // Create a basic javascript 'class'
 *     function MyClass(name) {
 *       // Set a property at initialization
 *       this.myName = name;
 *     }
 *     // Create an instance method
 *     MyClass.prototype.sayMyName = function() {
 *       alert(this.myName);
 *     };
 *     // Subclass the exisitng class and change the name
 *     // when initializing
 *     var MySubClass = videojs.extend(MyClass, {
 *       constructor: function(name) {
 *         // Call the super class constructor for the subclass
 *         MyClass.call(this, name)
 *       }
 *     });
 *     // Create an instance of the new sub class
 *     var myInstance = new MySubClass('John');
 *     myInstance.sayMyName(); // -> should alert "John"
 * ```
 *
 * @param {Function} The Class to subclass
 * @param {Object} An object including instace methods for the new class
 *                   Optionally including a `constructor` function
 * @return {Function} The newly created subclass
 * @mixes videojs
 * @method extend
 */
videojs.extend = _extend2['default'];

/**
 * Merge two options objects recursively
 * Performs a deep merge like lodash.merge but **only merges plain objects**
 * (not arrays, elements, anything else)
 * Other values will be copied directly from the second object.
 * ```js
 *     var defaultOptions = {
 *       foo: true,
 *       bar: {
 *         a: true,
 *         b: [1,2,3]
 *       }
 *     };
 *     var newOptions = {
 *       foo: false,
 *       bar: {
 *         b: [4,5,6]
 *       }
 *     };
 *     var result = videojs.mergeOptions(defaultOptions, newOptions);
 *     // result.foo = false;
 *     // result.bar.a = true;
 *     // result.bar.b = [4,5,6];
 * ```
 *
 * @param {Object} defaults  The options object whose values will be overriden
 * @param {Object} overrides The options object with values to override the first
 * @param {Object} etc       Any number of additional options objects
 *
 * @return {Object} a new object with the merged values
 * @mixes videojs
 * @method mergeOptions
 */
videojs.mergeOptions = _mergeOptions2['default'];

/**
 * Change the context (this) of a function
 *
 *     videojs.bind(newContext, function() {
 *       this === newContext
 *     });
 *
 * NOTE: as of v5.0 we require an ES5 shim, so you should use the native
 * `function() {}.bind(newContext);` instead of this.
 *
 * @param  {*}        context The object to bind as scope
 * @param  {Function} fn      The function to be bound to a scope
 * @param  {Number=}  uid     An optional unique ID for the function to be set
 * @return {Function}
 */
videojs.bind = Fn.bind;

/**
 * Create a Video.js player plugin
 * Plugins are only initialized when options for the plugin are included
 * in the player options, or the plugin function on the player instance is
 * called.
 * **See the plugin guide in the docs for a more detailed example**
 * ```js
 *     // Make a plugin that alerts when the player plays
 *     videojs.plugin('myPlugin', function(myPluginOptions) {
 *       myPluginOptions = myPluginOptions || {};
 *
 *       var player = this;
 *       var alertText = myPluginOptions.text || 'Player is playing!'
 *
 *       player.on('play', function() {
 *         alert(alertText);
 *       });
 *     });
 *     // USAGE EXAMPLES
 *     // EXAMPLE 1: New player with plugin options, call plugin immediately
 *     var player1 = videojs('idOne', {
 *       myPlugin: {
 *         text: 'Custom text!'
 *       }
 *     });
 *     // Click play
 *     // --> Should alert 'Custom text!'
 *     // EXAMPLE 3: New player, initialize plugin later
 *     var player3 = videojs('idThree');
 *     // Click play
 *     // --> NO ALERT
 *     // Click pause
 *     // Initialize plugin using the plugin function on the player instance
 *     player3.myPlugin({
 *       text: 'Plugin added later!'
 *     });
 *     // Click play
 *     // --> Should alert 'Plugin added later!'
 * ```
 *
 * @param {String} name The plugin name
 * @param {Function} fn The plugin function that will be called with options
 * @mixes videojs
 * @method plugin
 */
videojs.plugin = _plugins2['default'];

/**
 * Adding languages so that they're available to all players.
 * ```js
 *     videojs.addLanguage('es', { 'Hello': 'Hola' });
 * ```
 *
 * @param  {String} code The language code or dictionary property
 * @param  {Object} data The data values to be translated
 * @return {Object} The resulting language dictionary object
 * @mixes videojs
 * @method addLanguage
 */
videojs.addLanguage = function (code, data) {
  var _merge;

  code = ('' + code).toLowerCase();
  return (0, _merge3['default'])(videojs.options.languages, (_merge = {}, _merge[code] = data, _merge))[code];
};

/**
 * Log debug messages.
 *
 * @param {...Object} messages One or more messages to log
 */
videojs.log = _log2['default'];

/**
 * Creates an emulated TimeRange object.
 *
 * @param  {Number|Array} start Start time in seconds or an array of ranges
 * @param  {Number} end   End time in seconds
 * @return {Object}       Fake TimeRange object
 * @method createTimeRange
 */
videojs.createTimeRange = videojs.createTimeRanges = _timeRanges.createTimeRanges;

/**
 * Format seconds as a time string, H:MM:SS or M:SS
 * Supplying a guide (in seconds) will force a number of leading zeros
 * to cover the length of the guide
 *
 * @param  {Number} seconds Number of seconds to be turned into a string
 * @param  {Number} guide   Number (in seconds) to model the string after
 * @return {String}         Time formatted as H:MM:SS or M:SS
 * @method formatTime
 */
videojs.formatTime = _formatTime2['default'];

/**
 * Resolve and parse the elements of a URL
 *
 * @param  {String} url The url to parse
 * @return {Object}     An object of url details
 * @method parseUrl
 */
videojs.parseUrl = Url.parseUrl;

/**
 * Returns whether the url passed is a cross domain request or not.
 *
 * @param {String} url The url to check
 * @return {Boolean}   Whether it is a cross domain request or not
 * @method isCrossOrigin
 */
videojs.isCrossOrigin = Url.isCrossOrigin;

/**
 * Event target class.
 *
 * @type {Function}
 */
videojs.EventTarget = _eventTarget2['default'];

/**
 * Add an event listener to element
 * It stores the handler function in a separate cache object
 * and adds a generic handler to the element's event,
 * along with a unique id (guid) to the element.
 *
 * @param  {Element|Object}   elem Element or object to bind listeners to
 * @param  {String|Array}   type Type of event to bind to.
 * @param  {Function} fn   Event listener.
 * @method on
 */
videojs.on = Events.on;

/**
 * Trigger a listener only once for an event
 *
 * @param  {Element|Object}   elem Element or object to
 * @param  {String|Array}   type Name/type of event
 * @param  {Function} fn Event handler function
 * @method one
 */
videojs.one = Events.one;

/**
 * Removes event listeners from an element
 *
 * @param  {Element|Object}   elem Object to remove listeners from
 * @param  {String|Array=}   type Type of listener to remove. Don't include to remove all events from element.
 * @param  {Function} fn   Specific listener to remove. Don't include to remove listeners for an event type.
 * @method off
 */
videojs.off = Events.off;

/**
 * Trigger an event for an element
 *
 * @param  {Element|Object}      elem  Element to trigger an event on
 * @param  {Event|Object|String} event A string (the type) or an event object with a type attribute
 * @param  {Object} [hash] data hash to pass along with the event
 * @return {Boolean=} Returned only if default was prevented
 * @method trigger
 */
videojs.trigger = Events.trigger;

/**
 * A cross-browser XMLHttpRequest wrapper. Here's a simple example:
 *
 *     videojs.xhr({
 *       body: someJSONString,
 *       uri: "/foo",
 *       headers: {
 *         "Content-Type": "application/json"
 *       }
 *     }, function (err, resp, body) {
 *       // check resp.statusCode
 *     });
 *
 * Check out the [full
 * documentation](https://github.com/Raynos/xhr/blob/v2.1.0/README.md)
 * for more options.
 *
 * @param {Object} options settings for the request.
 * @return {XMLHttpRequest|XDomainRequest} the request object.
 * @see https://github.com/Raynos/xhr
 */
videojs.xhr = _xhr2['default'];

/**
 * TextTrack class
 *
 * @type {Function}
 */
videojs.TextTrack = _textTrack2['default'];

/**
 * export the AudioTrack class so that source handlers can create
 * AudioTracks and then add them to the players AudioTrackList
 *
 * @type {Function}
 */
videojs.AudioTrack = _audioTrack2['default'];

/**
 * export the VideoTrack class so that source handlers can create
 * VideoTracks and then add them to the players VideoTrackList
 *
 * @type {Function}
 */
videojs.VideoTrack = _videoTrack2['default'];

/**
 * Determines, via duck typing, whether or not a value is a DOM element.
 *
 * @method isEl
 * @param  {Mixed} value
 * @return {Boolean}
 */
videojs.isEl = Dom.isEl;

/**
 * Determines, via duck typing, whether or not a value is a text node.
 *
 * @method isTextNode
 * @param  {Mixed} value
 * @return {Boolean}
 */
videojs.isTextNode = Dom.isTextNode;

/**
 * Creates an element and applies properties.
 *
 * @method createEl
 * @param  {String} [tagName='div'] Name of tag to be created.
 * @param  {Object} [properties={}] Element properties to be applied.
 * @param  {Object} [attributes={}] Element attributes to be applied.
 * @return {Element}
 */
videojs.createEl = Dom.createEl;

/**
 * Check if an element has a CSS class
 *
 * @method hasClass
 * @param {Element} element Element to check
 * @param {String} classToCheck Classname to check
 */
videojs.hasClass = Dom.hasElClass;

/**
 * Add a CSS class name to an element
 *
 * @method addClass
 * @param {Element} element    Element to add class name to
 * @param {String} classToAdd Classname to add
 */
videojs.addClass = Dom.addElClass;

/**
 * Remove a CSS class name from an element
 *
 * @method removeClass
 * @param {Element} element    Element to remove from class name
 * @param {String} classToRemove Classname to remove
 */
videojs.removeClass = Dom.removeElClass;

/**
 * Adds or removes a CSS class name on an element depending on an optional
 * condition or the presence/absence of the class name.
 *
 * @method toggleElClass
 * @param  {Element} element
 * @param  {String} classToToggle
 * @param  {Boolean|Function} [predicate]
 *         Can be a function that returns a Boolean. If `true`, the class
 *         will be added; if `false`, the class will be removed. If not
 *         given, the class will be added if not present and vice versa.
 */
videojs.toggleClass = Dom.toggleElClass;

/**
 * Apply attributes to an HTML element.
 *
 * @method setAttributes
 * @param  {Element} el         Target element.
 * @param  {Object=} attributes Element attributes to be applied.
 */
videojs.setAttributes = Dom.setElAttributes;

/**
 * Get an element's attribute values, as defined on the HTML tag
 * Attributes are not the same as properties. They're defined on the tag
 * or with setAttribute (which shouldn't be used with HTML)
 * This will return true or false for boolean attributes.
 *
 * @method getAttributes
 * @param  {Element} tag Element from which to get tag attributes
 * @return {Object}
 */
videojs.getAttributes = Dom.getElAttributes;

/**
 * Empties the contents of an element.
 *
 * @method emptyEl
 * @param  {Element} el
 * @return {Element}
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
 * @method appendContent
 * @param  {Element} el
 * @param  {String|Element|TextNode|Array|Function} content
 * @return {Element}
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
 * @method insertContent
 * @param  {Element} el
 * @param  {String|Element|TextNode|Array|Function} content
 * @return {Element}
 */
videojs.insertContent = Dom.insertContent;

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

},{"131":131,"147":147,"42":42,"43":43,"5":5,"51":51,"52":52,"56":56,"62":62,"64":64,"72":72,"77":77,"78":78,"80":80,"81":81,"82":82,"83":83,"85":85,"86":86,"87":87,"88":88,"90":90,"92":92,"93":93}],92:[function(_dereq_,module,exports){
(function (global){
var topLevel = typeof global !== 'undefined' ? global :
    typeof window !== 'undefined' ? window : {}
var minDoc = _dereq_(94);

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
},{"94":94}],93:[function(_dereq_,module,exports){
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
},{}],94:[function(_dereq_,module,exports){

},{}],95:[function(_dereq_,module,exports){
var getNative = _dereq_(111);

/* Native method references for those with the same name as other `lodash` methods. */
var nativeNow = getNative(Date, 'now');

/**
 * Gets the number of milliseconds that have elapsed since the Unix epoch
 * (1 January 1970 00:00:00 UTC).
 *
 * @static
 * @memberOf _
 * @category Date
 * @example
 *
 * _.defer(function(stamp) {
 *   console.log(_.now() - stamp);
 * }, _.now());
 * // => logs the number of milliseconds it took for the deferred function to be invoked
 */
var now = nativeNow || function() {
  return new Date().getTime();
};

module.exports = now;

},{"111":111}],96:[function(_dereq_,module,exports){
var isObject = _dereq_(124),
    now = _dereq_(95);

/** Used as the `TypeError` message for "Functions" methods. */
var FUNC_ERROR_TEXT = 'Expected a function';

/* Native method references for those with the same name as other `lodash` methods. */
var nativeMax = Math.max;

/**
 * Creates a debounced function that delays invoking `func` until after `wait`
 * milliseconds have elapsed since the last time the debounced function was
 * invoked. The debounced function comes with a `cancel` method to cancel
 * delayed invocations. Provide an options object to indicate that `func`
 * should be invoked on the leading and/or trailing edge of the `wait` timeout.
 * Subsequent calls to the debounced function return the result of the last
 * `func` invocation.
 *
 * **Note:** If `leading` and `trailing` options are `true`, `func` is invoked
 * on the trailing edge of the timeout only if the the debounced function is
 * invoked more than once during the `wait` timeout.
 *
 * See [David Corbacho's article](http://drupalmotion.com/article/debounce-and-throttle-visual-explanation)
 * for details over the differences between `_.debounce` and `_.throttle`.
 *
 * @static
 * @memberOf _
 * @category Function
 * @param {Function} func The function to debounce.
 * @param {number} [wait=0] The number of milliseconds to delay.
 * @param {Object} [options] The options object.
 * @param {boolean} [options.leading=false] Specify invoking on the leading
 *  edge of the timeout.
 * @param {number} [options.maxWait] The maximum time `func` is allowed to be
 *  delayed before it's invoked.
 * @param {boolean} [options.trailing=true] Specify invoking on the trailing
 *  edge of the timeout.
 * @returns {Function} Returns the new debounced function.
 * @example
 *
 * // avoid costly calculations while the window size is in flux
 * jQuery(window).on('resize', _.debounce(calculateLayout, 150));
 *
 * // invoke `sendMail` when the click event is fired, debouncing subsequent calls
 * jQuery('#postbox').on('click', _.debounce(sendMail, 300, {
 *   'leading': true,
 *   'trailing': false
 * }));
 *
 * // ensure `batchLog` is invoked once after 1 second of debounced calls
 * var source = new EventSource('/stream');
 * jQuery(source).on('message', _.debounce(batchLog, 250, {
 *   'maxWait': 1000
 * }));
 *
 * // cancel a debounced call
 * var todoChanges = _.debounce(batchLog, 1000);
 * Object.observe(models.todo, todoChanges);
 *
 * Object.observe(models, function(changes) {
 *   if (_.find(changes, { 'user': 'todo', 'type': 'delete'})) {
 *     todoChanges.cancel();
 *   }
 * }, ['delete']);
 *
 * // ...at some point `models.todo` is changed
 * models.todo.completed = true;
 *
 * // ...before 1 second has passed `models.todo` is deleted
 * // which cancels the debounced `todoChanges` call
 * delete models.todo;
 */
function debounce(func, wait, options) {
  var args,
      maxTimeoutId,
      result,
      stamp,
      thisArg,
      timeoutId,
      trailingCall,
      lastCalled = 0,
      maxWait = false,
      trailing = true;

  if (typeof func != 'function') {
    throw new TypeError(FUNC_ERROR_TEXT);
  }
  wait = wait < 0 ? 0 : (+wait || 0);
  if (options === true) {
    var leading = true;
    trailing = false;
  } else if (isObject(options)) {
    leading = !!options.leading;
    maxWait = 'maxWait' in options && nativeMax(+options.maxWait || 0, wait);
    trailing = 'trailing' in options ? !!options.trailing : trailing;
  }

  function cancel() {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    if (maxTimeoutId) {
      clearTimeout(maxTimeoutId);
    }
    lastCalled = 0;
    maxTimeoutId = timeoutId = trailingCall = undefined;
  }

  function complete(isCalled, id) {
    if (id) {
      clearTimeout(id);
    }
    maxTimeoutId = timeoutId = trailingCall = undefined;
    if (isCalled) {
      lastCalled = now();
      result = func.apply(thisArg, args);
      if (!timeoutId && !maxTimeoutId) {
        args = thisArg = undefined;
      }
    }
  }

  function delayed() {
    var remaining = wait - (now() - stamp);
    if (remaining <= 0 || remaining > wait) {
      complete(trailingCall, maxTimeoutId);
    } else {
      timeoutId = setTimeout(delayed, remaining);
    }
  }

  function maxDelayed() {
    complete(trailing, timeoutId);
  }

  function debounced() {
    args = arguments;
    stamp = now();
    thisArg = this;
    trailingCall = trailing && (timeoutId || !leading);

    if (maxWait === false) {
      var leadingCall = leading && !timeoutId;
    } else {
      if (!maxTimeoutId && !leading) {
        lastCalled = stamp;
      }
      var remaining = maxWait - (stamp - lastCalled),
          isCalled = remaining <= 0 || remaining > maxWait;

      if (isCalled) {
        if (maxTimeoutId) {
          maxTimeoutId = clearTimeout(maxTimeoutId);
        }
        lastCalled = stamp;
        result = func.apply(thisArg, args);
      }
      else if (!maxTimeoutId) {
        maxTimeoutId = setTimeout(maxDelayed, remaining);
      }
    }
    if (isCalled && timeoutId) {
      timeoutId = clearTimeout(timeoutId);
    }
    else if (!timeoutId && wait !== maxWait) {
      timeoutId = setTimeout(delayed, wait);
    }
    if (leadingCall) {
      isCalled = true;
      result = func.apply(thisArg, args);
    }
    if (isCalled && !timeoutId && !maxTimeoutId) {
      args = thisArg = undefined;
    }
    return result;
  }
  debounced.cancel = cancel;
  return debounced;
}

module.exports = debounce;

},{"124":124,"95":95}],97:[function(_dereq_,module,exports){
/** Used as the `TypeError` message for "Functions" methods. */
var FUNC_ERROR_TEXT = 'Expected a function';

/* Native method references for those with the same name as other `lodash` methods. */
var nativeMax = Math.max;

/**
 * Creates a function that invokes `func` with the `this` binding of the
 * created function and arguments from `start` and beyond provided as an array.
 *
 * **Note:** This method is based on the [rest parameter](https://developer.mozilla.org/Web/JavaScript/Reference/Functions/rest_parameters).
 *
 * @static
 * @memberOf _
 * @category Function
 * @param {Function} func The function to apply a rest parameter to.
 * @param {number} [start=func.length-1] The start position of the rest parameter.
 * @returns {Function} Returns the new function.
 * @example
 *
 * var say = _.restParam(function(what, names) {
 *   return what + ' ' + _.initial(names).join(', ') +
 *     (_.size(names) > 1 ? ', & ' : '') + _.last(names);
 * });
 *
 * say('hello', 'fred', 'barney', 'pebbles');
 * // => 'hello fred, barney, & pebbles'
 */
function restParam(func, start) {
  if (typeof func != 'function') {
    throw new TypeError(FUNC_ERROR_TEXT);
  }
  start = nativeMax(start === undefined ? (func.length - 1) : (+start || 0), 0);
  return function() {
    var args = arguments,
        index = -1,
        length = nativeMax(args.length - start, 0),
        rest = Array(length);

    while (++index < length) {
      rest[index] = args[start + index];
    }
    switch (start) {
      case 0: return func.call(this, rest);
      case 1: return func.call(this, args[0], rest);
      case 2: return func.call(this, args[0], args[1], rest);
    }
    var otherArgs = Array(start + 1);
    index = -1;
    while (++index < start) {
      otherArgs[index] = args[index];
    }
    otherArgs[start] = rest;
    return func.apply(this, otherArgs);
  };
}

module.exports = restParam;

},{}],98:[function(_dereq_,module,exports){
var debounce = _dereq_(96),
    isObject = _dereq_(124);

/** Used as the `TypeError` message for "Functions" methods. */
var FUNC_ERROR_TEXT = 'Expected a function';

/**
 * Creates a throttled function that only invokes `func` at most once per
 * every `wait` milliseconds. The throttled function comes with a `cancel`
 * method to cancel delayed invocations. Provide an options object to indicate
 * that `func` should be invoked on the leading and/or trailing edge of the
 * `wait` timeout. Subsequent calls to the throttled function return the
 * result of the last `func` call.
 *
 * **Note:** If `leading` and `trailing` options are `true`, `func` is invoked
 * on the trailing edge of the timeout only if the the throttled function is
 * invoked more than once during the `wait` timeout.
 *
 * See [David Corbacho's article](http://drupalmotion.com/article/debounce-and-throttle-visual-explanation)
 * for details over the differences between `_.throttle` and `_.debounce`.
 *
 * @static
 * @memberOf _
 * @category Function
 * @param {Function} func The function to throttle.
 * @param {number} [wait=0] The number of milliseconds to throttle invocations to.
 * @param {Object} [options] The options object.
 * @param {boolean} [options.leading=true] Specify invoking on the leading
 *  edge of the timeout.
 * @param {boolean} [options.trailing=true] Specify invoking on the trailing
 *  edge of the timeout.
 * @returns {Function} Returns the new throttled function.
 * @example
 *
 * // avoid excessively updating the position while scrolling
 * jQuery(window).on('scroll', _.throttle(updatePosition, 100));
 *
 * // invoke `renewToken` when the click event is fired, but not more than once every 5 minutes
 * jQuery('.interactive').on('click', _.throttle(renewToken, 300000, {
 *   'trailing': false
 * }));
 *
 * // cancel a trailing throttled call
 * jQuery(window).on('popstate', throttled.cancel);
 */
function throttle(func, wait, options) {
  var leading = true,
      trailing = true;

  if (typeof func != 'function') {
    throw new TypeError(FUNC_ERROR_TEXT);
  }
  if (options === false) {
    leading = false;
  } else if (isObject(options)) {
    leading = 'leading' in options ? !!options.leading : leading;
    trailing = 'trailing' in options ? !!options.trailing : trailing;
  }
  return debounce(func, wait, { 'leading': leading, 'maxWait': +wait, 'trailing': trailing });
}

module.exports = throttle;

},{"124":124,"96":96}],99:[function(_dereq_,module,exports){
/**
 * Copies the values of `source` to `array`.
 *
 * @private
 * @param {Array} source The array to copy values from.
 * @param {Array} [array=[]] The array to copy values to.
 * @returns {Array} Returns `array`.
 */
function arrayCopy(source, array) {
  var index = -1,
      length = source.length;

  array || (array = Array(length));
  while (++index < length) {
    array[index] = source[index];
  }
  return array;
}

module.exports = arrayCopy;

},{}],100:[function(_dereq_,module,exports){
/**
 * A specialized version of `_.forEach` for arrays without support for callback
 * shorthands and `this` binding.
 *
 * @private
 * @param {Array} array The array to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @returns {Array} Returns `array`.
 */
function arrayEach(array, iteratee) {
  var index = -1,
      length = array.length;

  while (++index < length) {
    if (iteratee(array[index], index, array) === false) {
      break;
    }
  }
  return array;
}

module.exports = arrayEach;

},{}],101:[function(_dereq_,module,exports){
/**
 * Copies properties of `source` to `object`.
 *
 * @private
 * @param {Object} source The object to copy properties from.
 * @param {Array} props The property names to copy.
 * @param {Object} [object={}] The object to copy properties to.
 * @returns {Object} Returns `object`.
 */
function baseCopy(source, props, object) {
  object || (object = {});

  var index = -1,
      length = props.length;

  while (++index < length) {
    var key = props[index];
    object[key] = source[key];
  }
  return object;
}

module.exports = baseCopy;

},{}],102:[function(_dereq_,module,exports){
var createBaseFor = _dereq_(109);

/**
 * The base implementation of `baseForIn` and `baseForOwn` which iterates
 * over `object` properties returned by `keysFunc` invoking `iteratee` for
 * each property. Iteratee functions may exit iteration early by explicitly
 * returning `false`.
 *
 * @private
 * @param {Object} object The object to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @param {Function} keysFunc The function to get the keys of `object`.
 * @returns {Object} Returns `object`.
 */
var baseFor = createBaseFor();

module.exports = baseFor;

},{"109":109}],103:[function(_dereq_,module,exports){
var baseFor = _dereq_(102),
    keysIn = _dereq_(130);

/**
 * The base implementation of `_.forIn` without support for callback
 * shorthands and `this` binding.
 *
 * @private
 * @param {Object} object The object to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @returns {Object} Returns `object`.
 */
function baseForIn(object, iteratee) {
  return baseFor(object, iteratee, keysIn);
}

module.exports = baseForIn;

},{"102":102,"130":130}],104:[function(_dereq_,module,exports){
var arrayEach = _dereq_(100),
    baseMergeDeep = _dereq_(105),
    isArray = _dereq_(121),
    isArrayLike = _dereq_(112),
    isObject = _dereq_(124),
    isObjectLike = _dereq_(117),
    isTypedArray = _dereq_(127),
    keys = _dereq_(129);

/**
 * The base implementation of `_.merge` without support for argument juggling,
 * multiple sources, and `this` binding `customizer` functions.
 *
 * @private
 * @param {Object} object The destination object.
 * @param {Object} source The source object.
 * @param {Function} [customizer] The function to customize merged values.
 * @param {Array} [stackA=[]] Tracks traversed source objects.
 * @param {Array} [stackB=[]] Associates values with source counterparts.
 * @returns {Object} Returns `object`.
 */
function baseMerge(object, source, customizer, stackA, stackB) {
  if (!isObject(object)) {
    return object;
  }
  var isSrcArr = isArrayLike(source) && (isArray(source) || isTypedArray(source)),
      props = isSrcArr ? undefined : keys(source);

  arrayEach(props || source, function(srcValue, key) {
    if (props) {
      key = srcValue;
      srcValue = source[key];
    }
    if (isObjectLike(srcValue)) {
      stackA || (stackA = []);
      stackB || (stackB = []);
      baseMergeDeep(object, source, key, baseMerge, customizer, stackA, stackB);
    }
    else {
      var value = object[key],
          result = customizer ? customizer(value, srcValue, key, object, source) : undefined,
          isCommon = result === undefined;

      if (isCommon) {
        result = srcValue;
      }
      if ((result !== undefined || (isSrcArr && !(key in object))) &&
          (isCommon || (result === result ? (result !== value) : (value === value)))) {
        object[key] = result;
      }
    }
  });
  return object;
}

module.exports = baseMerge;

},{"100":100,"105":105,"112":112,"117":117,"121":121,"124":124,"127":127,"129":129}],105:[function(_dereq_,module,exports){
var arrayCopy = _dereq_(99),
    isArguments = _dereq_(120),
    isArray = _dereq_(121),
    isArrayLike = _dereq_(112),
    isPlainObject = _dereq_(125),
    isTypedArray = _dereq_(127),
    toPlainObject = _dereq_(128);

/**
 * A specialized version of `baseMerge` for arrays and objects which performs
 * deep merges and tracks traversed objects enabling objects with circular
 * references to be merged.
 *
 * @private
 * @param {Object} object The destination object.
 * @param {Object} source The source object.
 * @param {string} key The key of the value to merge.
 * @param {Function} mergeFunc The function to merge values.
 * @param {Function} [customizer] The function to customize merged values.
 * @param {Array} [stackA=[]] Tracks traversed source objects.
 * @param {Array} [stackB=[]] Associates values with source counterparts.
 * @returns {boolean} Returns `true` if the objects are equivalent, else `false`.
 */
function baseMergeDeep(object, source, key, mergeFunc, customizer, stackA, stackB) {
  var length = stackA.length,
      srcValue = source[key];

  while (length--) {
    if (stackA[length] == srcValue) {
      object[key] = stackB[length];
      return;
    }
  }
  var value = object[key],
      result = customizer ? customizer(value, srcValue, key, object, source) : undefined,
      isCommon = result === undefined;

  if (isCommon) {
    result = srcValue;
    if (isArrayLike(srcValue) && (isArray(srcValue) || isTypedArray(srcValue))) {
      result = isArray(value)
        ? value
        : (isArrayLike(value) ? arrayCopy(value) : []);
    }
    else if (isPlainObject(srcValue) || isArguments(srcValue)) {
      result = isArguments(value)
        ? toPlainObject(value)
        : (isPlainObject(value) ? value : {});
    }
    else {
      isCommon = false;
    }
  }
  // Add the source value to the stack of traversed objects and associate
  // it with its merged value.
  stackA.push(srcValue);
  stackB.push(result);

  if (isCommon) {
    // Recursively merge objects and arrays (susceptible to call stack limits).
    object[key] = mergeFunc(result, srcValue, customizer, stackA, stackB);
  } else if (result === result ? (result !== value) : (value === value)) {
    object[key] = result;
  }
}

module.exports = baseMergeDeep;

},{"112":112,"120":120,"121":121,"125":125,"127":127,"128":128,"99":99}],106:[function(_dereq_,module,exports){
var toObject = _dereq_(119);

/**
 * The base implementation of `_.property` without support for deep paths.
 *
 * @private
 * @param {string} key The key of the property to get.
 * @returns {Function} Returns the new function.
 */
function baseProperty(key) {
  return function(object) {
    return object == null ? undefined : toObject(object)[key];
  };
}

module.exports = baseProperty;

},{"119":119}],107:[function(_dereq_,module,exports){
var identity = _dereq_(133);

/**
 * A specialized version of `baseCallback` which only supports `this` binding
 * and specifying the number of arguments to provide to `func`.
 *
 * @private
 * @param {Function} func The function to bind.
 * @param {*} thisArg The `this` binding of `func`.
 * @param {number} [argCount] The number of arguments to provide to `func`.
 * @returns {Function} Returns the callback.
 */
function bindCallback(func, thisArg, argCount) {
  if (typeof func != 'function') {
    return identity;
  }
  if (thisArg === undefined) {
    return func;
  }
  switch (argCount) {
    case 1: return function(value) {
      return func.call(thisArg, value);
    };
    case 3: return function(value, index, collection) {
      return func.call(thisArg, value, index, collection);
    };
    case 4: return function(accumulator, value, index, collection) {
      return func.call(thisArg, accumulator, value, index, collection);
    };
    case 5: return function(value, other, key, object, source) {
      return func.call(thisArg, value, other, key, object, source);
    };
  }
  return function() {
    return func.apply(thisArg, arguments);
  };
}

module.exports = bindCallback;

},{"133":133}],108:[function(_dereq_,module,exports){
var bindCallback = _dereq_(107),
    isIterateeCall = _dereq_(115),
    restParam = _dereq_(97);

/**
 * Creates a `_.assign`, `_.defaults`, or `_.merge` function.
 *
 * @private
 * @param {Function} assigner The function to assign values.
 * @returns {Function} Returns the new assigner function.
 */
function createAssigner(assigner) {
  return restParam(function(object, sources) {
    var index = -1,
        length = object == null ? 0 : sources.length,
        customizer = length > 2 ? sources[length - 2] : undefined,
        guard = length > 2 ? sources[2] : undefined,
        thisArg = length > 1 ? sources[length - 1] : undefined;

    if (typeof customizer == 'function') {
      customizer = bindCallback(customizer, thisArg, 5);
      length -= 2;
    } else {
      customizer = typeof thisArg == 'function' ? thisArg : undefined;
      length -= (customizer ? 1 : 0);
    }
    if (guard && isIterateeCall(sources[0], sources[1], guard)) {
      customizer = length < 3 ? undefined : customizer;
      length = 1;
    }
    while (++index < length) {
      var source = sources[index];
      if (source) {
        assigner(object, source, customizer);
      }
    }
    return object;
  });
}

module.exports = createAssigner;

},{"107":107,"115":115,"97":97}],109:[function(_dereq_,module,exports){
var toObject = _dereq_(119);

/**
 * Creates a base function for `_.forIn` or `_.forInRight`.
 *
 * @private
 * @param {boolean} [fromRight] Specify iterating from right to left.
 * @returns {Function} Returns the new base function.
 */
function createBaseFor(fromRight) {
  return function(object, iteratee, keysFunc) {
    var iterable = toObject(object),
        props = keysFunc(object),
        length = props.length,
        index = fromRight ? length : -1;

    while ((fromRight ? index-- : ++index < length)) {
      var key = props[index];
      if (iteratee(iterable[key], key, iterable) === false) {
        break;
      }
    }
    return object;
  };
}

module.exports = createBaseFor;

},{"119":119}],110:[function(_dereq_,module,exports){
var baseProperty = _dereq_(106);

/**
 * Gets the "length" property value of `object`.
 *
 * **Note:** This function is used to avoid a [JIT bug](https://bugs.webkit.org/show_bug.cgi?id=142792)
 * that affects Safari on at least iOS 8.1-8.3 ARM64.
 *
 * @private
 * @param {Object} object The object to query.
 * @returns {*} Returns the "length" value.
 */
var getLength = baseProperty('length');

module.exports = getLength;

},{"106":106}],111:[function(_dereq_,module,exports){
var isNative = _dereq_(123);

/**
 * Gets the native function at `key` of `object`.
 *
 * @private
 * @param {Object} object The object to query.
 * @param {string} key The key of the method to get.
 * @returns {*} Returns the function if it's native, else `undefined`.
 */
function getNative(object, key) {
  var value = object == null ? undefined : object[key];
  return isNative(value) ? value : undefined;
}

module.exports = getNative;

},{"123":123}],112:[function(_dereq_,module,exports){
var getLength = _dereq_(110),
    isLength = _dereq_(116);

/**
 * Checks if `value` is array-like.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is array-like, else `false`.
 */
function isArrayLike(value) {
  return value != null && isLength(getLength(value));
}

module.exports = isArrayLike;

},{"110":110,"116":116}],113:[function(_dereq_,module,exports){
/**
 * Checks if `value` is a host object in IE < 9.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a host object, else `false`.
 */
var isHostObject = (function() {
  try {
    Object({ 'toString': 0 } + '');
  } catch(e) {
    return function() { return false; };
  }
  return function(value) {
    // IE < 9 presents many host objects as `Object` objects that can coerce
    // to strings despite having improperly defined `toString` methods.
    return typeof value.toString != 'function' && typeof (value + '') == 'string';
  };
}());

module.exports = isHostObject;

},{}],114:[function(_dereq_,module,exports){
/** Used to detect unsigned integer values. */
var reIsUint = /^\d+$/;

/**
 * Used as the [maximum length](http://ecma-international.org/ecma-262/6.0/#sec-number.max_safe_integer)
 * of an array-like value.
 */
var MAX_SAFE_INTEGER = 9007199254740991;

/**
 * Checks if `value` is a valid array-like index.
 *
 * @private
 * @param {*} value The value to check.
 * @param {number} [length=MAX_SAFE_INTEGER] The upper bounds of a valid index.
 * @returns {boolean} Returns `true` if `value` is a valid index, else `false`.
 */
function isIndex(value, length) {
  value = (typeof value == 'number' || reIsUint.test(value)) ? +value : -1;
  length = length == null ? MAX_SAFE_INTEGER : length;
  return value > -1 && value % 1 == 0 && value < length;
}

module.exports = isIndex;

},{}],115:[function(_dereq_,module,exports){
var isArrayLike = _dereq_(112),
    isIndex = _dereq_(114),
    isObject = _dereq_(124);

/**
 * Checks if the provided arguments are from an iteratee call.
 *
 * @private
 * @param {*} value The potential iteratee value argument.
 * @param {*} index The potential iteratee index or key argument.
 * @param {*} object The potential iteratee object argument.
 * @returns {boolean} Returns `true` if the arguments are from an iteratee call, else `false`.
 */
function isIterateeCall(value, index, object) {
  if (!isObject(object)) {
    return false;
  }
  var type = typeof index;
  if (type == 'number'
      ? (isArrayLike(object) && isIndex(index, object.length))
      : (type == 'string' && index in object)) {
    var other = object[index];
    return value === value ? (value === other) : (other !== other);
  }
  return false;
}

module.exports = isIterateeCall;

},{"112":112,"114":114,"124":124}],116:[function(_dereq_,module,exports){
/**
 * Used as the [maximum length](http://ecma-international.org/ecma-262/6.0/#sec-number.max_safe_integer)
 * of an array-like value.
 */
var MAX_SAFE_INTEGER = 9007199254740991;

/**
 * Checks if `value` is a valid array-like length.
 *
 * **Note:** This function is based on [`ToLength`](http://ecma-international.org/ecma-262/6.0/#sec-tolength).
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a valid length, else `false`.
 */
function isLength(value) {
  return typeof value == 'number' && value > -1 && value % 1 == 0 && value <= MAX_SAFE_INTEGER;
}

module.exports = isLength;

},{}],117:[function(_dereq_,module,exports){
/**
 * Checks if `value` is object-like.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
 */
function isObjectLike(value) {
  return !!value && typeof value == 'object';
}

module.exports = isObjectLike;

},{}],118:[function(_dereq_,module,exports){
var isArguments = _dereq_(120),
    isArray = _dereq_(121),
    isIndex = _dereq_(114),
    isLength = _dereq_(116),
    isString = _dereq_(126),
    keysIn = _dereq_(130);

/** Used for native method references. */
var objectProto = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/**
 * A fallback implementation of `Object.keys` which creates an array of the
 * own enumerable property names of `object`.
 *
 * @private
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of property names.
 */
function shimKeys(object) {
  var props = keysIn(object),
      propsLength = props.length,
      length = propsLength && object.length;

  var allowIndexes = !!length && isLength(length) &&
    (isArray(object) || isArguments(object) || isString(object));

  var index = -1,
      result = [];

  while (++index < propsLength) {
    var key = props[index];
    if ((allowIndexes && isIndex(key, length)) || hasOwnProperty.call(object, key)) {
      result.push(key);
    }
  }
  return result;
}

module.exports = shimKeys;

},{"114":114,"116":116,"120":120,"121":121,"126":126,"130":130}],119:[function(_dereq_,module,exports){
var isObject = _dereq_(124),
    isString = _dereq_(126),
    support = _dereq_(132);

/**
 * Converts `value` to an object if it's not one.
 *
 * @private
 * @param {*} value The value to process.
 * @returns {Object} Returns the object.
 */
function toObject(value) {
  if (support.unindexedChars && isString(value)) {
    var index = -1,
        length = value.length,
        result = Object(value);

    while (++index < length) {
      result[index] = value.charAt(index);
    }
    return result;
  }
  return isObject(value) ? value : Object(value);
}

module.exports = toObject;

},{"124":124,"126":126,"132":132}],120:[function(_dereq_,module,exports){
var isArrayLike = _dereq_(112),
    isObjectLike = _dereq_(117);

/** Used for native method references. */
var objectProto = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/** Native method references. */
var propertyIsEnumerable = objectProto.propertyIsEnumerable;

/**
 * Checks if `value` is classified as an `arguments` object.
 *
 * @static
 * @memberOf _
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is correctly classified, else `false`.
 * @example
 *
 * _.isArguments(function() { return arguments; }());
 * // => true
 *
 * _.isArguments([1, 2, 3]);
 * // => false
 */
function isArguments(value) {
  return isObjectLike(value) && isArrayLike(value) &&
    hasOwnProperty.call(value, 'callee') && !propertyIsEnumerable.call(value, 'callee');
}

module.exports = isArguments;

},{"112":112,"117":117}],121:[function(_dereq_,module,exports){
var getNative = _dereq_(111),
    isLength = _dereq_(116),
    isObjectLike = _dereq_(117);

/** `Object#toString` result references. */
var arrayTag = '[object Array]';

/** Used for native method references. */
var objectProto = Object.prototype;

/**
 * Used to resolve the [`toStringTag`](http://ecma-international.org/ecma-262/6.0/#sec-object.prototype.tostring)
 * of values.
 */
var objToString = objectProto.toString;

/* Native method references for those with the same name as other `lodash` methods. */
var nativeIsArray = getNative(Array, 'isArray');

/**
 * Checks if `value` is classified as an `Array` object.
 *
 * @static
 * @memberOf _
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is correctly classified, else `false`.
 * @example
 *
 * _.isArray([1, 2, 3]);
 * // => true
 *
 * _.isArray(function() { return arguments; }());
 * // => false
 */
var isArray = nativeIsArray || function(value) {
  return isObjectLike(value) && isLength(value.length) && objToString.call(value) == arrayTag;
};

module.exports = isArray;

},{"111":111,"116":116,"117":117}],122:[function(_dereq_,module,exports){
var isObject = _dereq_(124);

/** `Object#toString` result references. */
var funcTag = '[object Function]';

/** Used for native method references. */
var objectProto = Object.prototype;

/**
 * Used to resolve the [`toStringTag`](http://ecma-international.org/ecma-262/6.0/#sec-object.prototype.tostring)
 * of values.
 */
var objToString = objectProto.toString;

/**
 * Checks if `value` is classified as a `Function` object.
 *
 * @static
 * @memberOf _
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is correctly classified, else `false`.
 * @example
 *
 * _.isFunction(_);
 * // => true
 *
 * _.isFunction(/abc/);
 * // => false
 */
function isFunction(value) {
  // The use of `Object#toString` avoids issues with the `typeof` operator
  // in older versions of Chrome and Safari which return 'function' for regexes
  // and Safari 8 which returns 'object' for typed array constructors.
  return isObject(value) && objToString.call(value) == funcTag;
}

module.exports = isFunction;

},{"124":124}],123:[function(_dereq_,module,exports){
var isFunction = _dereq_(122),
    isHostObject = _dereq_(113),
    isObjectLike = _dereq_(117);

/** Used to detect host constructors (Safari > 5). */
var reIsHostCtor = /^\[object .+?Constructor\]$/;

/** Used for native method references. */
var objectProto = Object.prototype;

/** Used to resolve the decompiled source of functions. */
var fnToString = Function.prototype.toString;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/** Used to detect if a method is native. */
var reIsNative = RegExp('^' +
  fnToString.call(hasOwnProperty).replace(/[\\^$.*+?()[\]{}|]/g, '\\$&')
  .replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, '$1.*?') + '$'
);

/**
 * Checks if `value` is a native function.
 *
 * @static
 * @memberOf _
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a native function, else `false`.
 * @example
 *
 * _.isNative(Array.prototype.push);
 * // => true
 *
 * _.isNative(_);
 * // => false
 */
function isNative(value) {
  if (value == null) {
    return false;
  }
  if (isFunction(value)) {
    return reIsNative.test(fnToString.call(value));
  }
  return isObjectLike(value) && (isHostObject(value) ? reIsNative : reIsHostCtor).test(value);
}

module.exports = isNative;

},{"113":113,"117":117,"122":122}],124:[function(_dereq_,module,exports){
/**
 * Checks if `value` is the [language type](https://es5.github.io/#x8) of `Object`.
 * (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
 *
 * @static
 * @memberOf _
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an object, else `false`.
 * @example
 *
 * _.isObject({});
 * // => true
 *
 * _.isObject([1, 2, 3]);
 * // => true
 *
 * _.isObject(1);
 * // => false
 */
function isObject(value) {
  // Avoid a V8 JIT bug in Chrome 19-20.
  // See https://code.google.com/p/v8/issues/detail?id=2291 for more details.
  var type = typeof value;
  return !!value && (type == 'object' || type == 'function');
}

module.exports = isObject;

},{}],125:[function(_dereq_,module,exports){
var baseForIn = _dereq_(103),
    isArguments = _dereq_(120),
    isHostObject = _dereq_(113),
    isObjectLike = _dereq_(117),
    support = _dereq_(132);

/** `Object#toString` result references. */
var objectTag = '[object Object]';

/** Used for native method references. */
var objectProto = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/**
 * Used to resolve the [`toStringTag`](http://ecma-international.org/ecma-262/6.0/#sec-object.prototype.tostring)
 * of values.
 */
var objToString = objectProto.toString;

/**
 * Checks if `value` is a plain object, that is, an object created by the
 * `Object` constructor or one with a `[[Prototype]]` of `null`.
 *
 * **Note:** This method assumes objects created by the `Object` constructor
 * have no inherited enumerable properties.
 *
 * @static
 * @memberOf _
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a plain object, else `false`.
 * @example
 *
 * function Foo() {
 *   this.a = 1;
 * }
 *
 * _.isPlainObject(new Foo);
 * // => false
 *
 * _.isPlainObject([1, 2, 3]);
 * // => false
 *
 * _.isPlainObject({ 'x': 0, 'y': 0 });
 * // => true
 *
 * _.isPlainObject(Object.create(null));
 * // => true
 */
function isPlainObject(value) {
  var Ctor;

  // Exit early for non `Object` objects.
  if (!(isObjectLike(value) && objToString.call(value) == objectTag && !isHostObject(value) && !isArguments(value)) ||
      (!hasOwnProperty.call(value, 'constructor') && (Ctor = value.constructor, typeof Ctor == 'function' && !(Ctor instanceof Ctor)))) {
    return false;
  }
  // IE < 9 iterates inherited properties before own properties. If the first
  // iterated property is an object's own property then there are no inherited
  // enumerable properties.
  var result;
  if (support.ownLast) {
    baseForIn(value, function(subValue, key, object) {
      result = hasOwnProperty.call(object, key);
      return false;
    });
    return result !== false;
  }
  // In most environments an object's own properties are iterated before
  // its inherited properties. If the last iterated property is an object's
  // own property then there are no inherited enumerable properties.
  baseForIn(value, function(subValue, key) {
    result = key;
  });
  return result === undefined || hasOwnProperty.call(value, result);
}

module.exports = isPlainObject;

},{"103":103,"113":113,"117":117,"120":120,"132":132}],126:[function(_dereq_,module,exports){
var isObjectLike = _dereq_(117);

/** `Object#toString` result references. */
var stringTag = '[object String]';

/** Used for native method references. */
var objectProto = Object.prototype;

/**
 * Used to resolve the [`toStringTag`](http://ecma-international.org/ecma-262/6.0/#sec-object.prototype.tostring)
 * of values.
 */
var objToString = objectProto.toString;

/**
 * Checks if `value` is classified as a `String` primitive or object.
 *
 * @static
 * @memberOf _
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is correctly classified, else `false`.
 * @example
 *
 * _.isString('abc');
 * // => true
 *
 * _.isString(1);
 * // => false
 */
function isString(value) {
  return typeof value == 'string' || (isObjectLike(value) && objToString.call(value) == stringTag);
}

module.exports = isString;

},{"117":117}],127:[function(_dereq_,module,exports){
var isLength = _dereq_(116),
    isObjectLike = _dereq_(117);

/** `Object#toString` result references. */
var argsTag = '[object Arguments]',
    arrayTag = '[object Array]',
    boolTag = '[object Boolean]',
    dateTag = '[object Date]',
    errorTag = '[object Error]',
    funcTag = '[object Function]',
    mapTag = '[object Map]',
    numberTag = '[object Number]',
    objectTag = '[object Object]',
    regexpTag = '[object RegExp]',
    setTag = '[object Set]',
    stringTag = '[object String]',
    weakMapTag = '[object WeakMap]';

var arrayBufferTag = '[object ArrayBuffer]',
    float32Tag = '[object Float32Array]',
    float64Tag = '[object Float64Array]',
    int8Tag = '[object Int8Array]',
    int16Tag = '[object Int16Array]',
    int32Tag = '[object Int32Array]',
    uint8Tag = '[object Uint8Array]',
    uint8ClampedTag = '[object Uint8ClampedArray]',
    uint16Tag = '[object Uint16Array]',
    uint32Tag = '[object Uint32Array]';

/** Used to identify `toStringTag` values of typed arrays. */
var typedArrayTags = {};
typedArrayTags[float32Tag] = typedArrayTags[float64Tag] =
typedArrayTags[int8Tag] = typedArrayTags[int16Tag] =
typedArrayTags[int32Tag] = typedArrayTags[uint8Tag] =
typedArrayTags[uint8ClampedTag] = typedArrayTags[uint16Tag] =
typedArrayTags[uint32Tag] = true;
typedArrayTags[argsTag] = typedArrayTags[arrayTag] =
typedArrayTags[arrayBufferTag] = typedArrayTags[boolTag] =
typedArrayTags[dateTag] = typedArrayTags[errorTag] =
typedArrayTags[funcTag] = typedArrayTags[mapTag] =
typedArrayTags[numberTag] = typedArrayTags[objectTag] =
typedArrayTags[regexpTag] = typedArrayTags[setTag] =
typedArrayTags[stringTag] = typedArrayTags[weakMapTag] = false;

/** Used for native method references. */
var objectProto = Object.prototype;

/**
 * Used to resolve the [`toStringTag`](http://ecma-international.org/ecma-262/6.0/#sec-object.prototype.tostring)
 * of values.
 */
var objToString = objectProto.toString;

/**
 * Checks if `value` is classified as a typed array.
 *
 * @static
 * @memberOf _
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is correctly classified, else `false`.
 * @example
 *
 * _.isTypedArray(new Uint8Array);
 * // => true
 *
 * _.isTypedArray([]);
 * // => false
 */
function isTypedArray(value) {
  return isObjectLike(value) && isLength(value.length) && !!typedArrayTags[objToString.call(value)];
}

module.exports = isTypedArray;

},{"116":116,"117":117}],128:[function(_dereq_,module,exports){
var baseCopy = _dereq_(101),
    keysIn = _dereq_(130);

/**
 * Converts `value` to a plain object flattening inherited enumerable
 * properties of `value` to own properties of the plain object.
 *
 * @static
 * @memberOf _
 * @category Lang
 * @param {*} value The value to convert.
 * @returns {Object} Returns the converted plain object.
 * @example
 *
 * function Foo() {
 *   this.b = 2;
 * }
 *
 * Foo.prototype.c = 3;
 *
 * _.assign({ 'a': 1 }, new Foo);
 * // => { 'a': 1, 'b': 2 }
 *
 * _.assign({ 'a': 1 }, _.toPlainObject(new Foo));
 * // => { 'a': 1, 'b': 2, 'c': 3 }
 */
function toPlainObject(value) {
  return baseCopy(value, keysIn(value));
}

module.exports = toPlainObject;

},{"101":101,"130":130}],129:[function(_dereq_,module,exports){
var getNative = _dereq_(111),
    isArrayLike = _dereq_(112),
    isObject = _dereq_(124),
    shimKeys = _dereq_(118),
    support = _dereq_(132);

/* Native method references for those with the same name as other `lodash` methods. */
var nativeKeys = getNative(Object, 'keys');

/**
 * Creates an array of the own enumerable property names of `object`.
 *
 * **Note:** Non-object values are coerced to objects. See the
 * [ES spec](http://ecma-international.org/ecma-262/6.0/#sec-object.keys)
 * for more details.
 *
 * @static
 * @memberOf _
 * @category Object
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of property names.
 * @example
 *
 * function Foo() {
 *   this.a = 1;
 *   this.b = 2;
 * }
 *
 * Foo.prototype.c = 3;
 *
 * _.keys(new Foo);
 * // => ['a', 'b'] (iteration order is not guaranteed)
 *
 * _.keys('hi');
 * // => ['0', '1']
 */
var keys = !nativeKeys ? shimKeys : function(object) {
  var Ctor = object == null ? undefined : object.constructor;
  if ((typeof Ctor == 'function' && Ctor.prototype === object) ||
      (typeof object == 'function' ? support.enumPrototypes : isArrayLike(object))) {
    return shimKeys(object);
  }
  return isObject(object) ? nativeKeys(object) : [];
};

module.exports = keys;

},{"111":111,"112":112,"118":118,"124":124,"132":132}],130:[function(_dereq_,module,exports){
var arrayEach = _dereq_(100),
    isArguments = _dereq_(120),
    isArray = _dereq_(121),
    isFunction = _dereq_(122),
    isIndex = _dereq_(114),
    isLength = _dereq_(116),
    isObject = _dereq_(124),
    isString = _dereq_(126),
    support = _dereq_(132);

/** `Object#toString` result references. */
var arrayTag = '[object Array]',
    boolTag = '[object Boolean]',
    dateTag = '[object Date]',
    errorTag = '[object Error]',
    funcTag = '[object Function]',
    numberTag = '[object Number]',
    objectTag = '[object Object]',
    regexpTag = '[object RegExp]',
    stringTag = '[object String]';

/** Used to fix the JScript `[[DontEnum]]` bug. */
var shadowProps = [
  'constructor', 'hasOwnProperty', 'isPrototypeOf', 'propertyIsEnumerable',
  'toLocaleString', 'toString', 'valueOf'
];

/** Used for native method references. */
var errorProto = Error.prototype,
    objectProto = Object.prototype,
    stringProto = String.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/**
 * Used to resolve the [`toStringTag`](http://ecma-international.org/ecma-262/6.0/#sec-object.prototype.tostring)
 * of values.
 */
var objToString = objectProto.toString;

/** Used to avoid iterating over non-enumerable properties in IE < 9. */
var nonEnumProps = {};
nonEnumProps[arrayTag] = nonEnumProps[dateTag] = nonEnumProps[numberTag] = { 'constructor': true, 'toLocaleString': true, 'toString': true, 'valueOf': true };
nonEnumProps[boolTag] = nonEnumProps[stringTag] = { 'constructor': true, 'toString': true, 'valueOf': true };
nonEnumProps[errorTag] = nonEnumProps[funcTag] = nonEnumProps[regexpTag] = { 'constructor': true, 'toString': true };
nonEnumProps[objectTag] = { 'constructor': true };

arrayEach(shadowProps, function(key) {
  for (var tag in nonEnumProps) {
    if (hasOwnProperty.call(nonEnumProps, tag)) {
      var props = nonEnumProps[tag];
      props[key] = hasOwnProperty.call(props, key);
    }
  }
});

/**
 * Creates an array of the own and inherited enumerable property names of `object`.
 *
 * **Note:** Non-object values are coerced to objects.
 *
 * @static
 * @memberOf _
 * @category Object
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of property names.
 * @example
 *
 * function Foo() {
 *   this.a = 1;
 *   this.b = 2;
 * }
 *
 * Foo.prototype.c = 3;
 *
 * _.keysIn(new Foo);
 * // => ['a', 'b', 'c'] (iteration order is not guaranteed)
 */
function keysIn(object) {
  if (object == null) {
    return [];
  }
  if (!isObject(object)) {
    object = Object(object);
  }
  var length = object.length;

  length = (length && isLength(length) &&
    (isArray(object) || isArguments(object) || isString(object)) && length) || 0;

  var Ctor = object.constructor,
      index = -1,
      proto = (isFunction(Ctor) && Ctor.prototype) || objectProto,
      isProto = proto === object,
      result = Array(length),
      skipIndexes = length > 0,
      skipErrorProps = support.enumErrorProps && (object === errorProto || object instanceof Error),
      skipProto = support.enumPrototypes && isFunction(object);

  while (++index < length) {
    result[index] = (index + '');
  }
  // lodash skips the `constructor` property when it infers it's iterating
  // over a `prototype` object because IE < 9 can't set the `[[Enumerable]]`
  // attribute of an existing property and the `constructor` property of a
  // prototype defaults to non-enumerable.
  for (var key in object) {
    if (!(skipProto && key == 'prototype') &&
        !(skipErrorProps && (key == 'message' || key == 'name')) &&
        !(skipIndexes && isIndex(key, length)) &&
        !(key == 'constructor' && (isProto || !hasOwnProperty.call(object, key)))) {
      result.push(key);
    }
  }
  if (support.nonEnumShadows && object !== objectProto) {
    var tag = object === stringProto ? stringTag : (object === errorProto ? errorTag : objToString.call(object)),
        nonEnums = nonEnumProps[tag] || nonEnumProps[objectTag];

    if (tag == objectTag) {
      proto = objectProto;
    }
    length = shadowProps.length;
    while (length--) {
      key = shadowProps[length];
      var nonEnum = nonEnums[key];
      if (!(isProto && nonEnum) &&
          (nonEnum ? hasOwnProperty.call(object, key) : object[key] !== proto[key])) {
        result.push(key);
      }
    }
  }
  return result;
}

module.exports = keysIn;

},{"100":100,"114":114,"116":116,"120":120,"121":121,"122":122,"124":124,"126":126,"132":132}],131:[function(_dereq_,module,exports){
var baseMerge = _dereq_(104),
    createAssigner = _dereq_(108);

/**
 * Recursively merges own enumerable properties of the source object(s), that
 * don't resolve to `undefined` into the destination object. Subsequent sources
 * overwrite property assignments of previous sources. If `customizer` is
 * provided it's invoked to produce the merged values of the destination and
 * source properties. If `customizer` returns `undefined` merging is handled
 * by the method instead. The `customizer` is bound to `thisArg` and invoked
 * with five arguments: (objectValue, sourceValue, key, object, source).
 *
 * @static
 * @memberOf _
 * @category Object
 * @param {Object} object The destination object.
 * @param {...Object} [sources] The source objects.
 * @param {Function} [customizer] The function to customize assigned values.
 * @param {*} [thisArg] The `this` binding of `customizer`.
 * @returns {Object} Returns `object`.
 * @example
 *
 * var users = {
 *   'data': [{ 'user': 'barney' }, { 'user': 'fred' }]
 * };
 *
 * var ages = {
 *   'data': [{ 'age': 36 }, { 'age': 40 }]
 * };
 *
 * _.merge(users, ages);
 * // => { 'data': [{ 'user': 'barney', 'age': 36 }, { 'user': 'fred', 'age': 40 }] }
 *
 * // using a customizer callback
 * var object = {
 *   'fruits': ['apple'],
 *   'vegetables': ['beet']
 * };
 *
 * var other = {
 *   'fruits': ['banana'],
 *   'vegetables': ['carrot']
 * };
 *
 * _.merge(object, other, function(a, b) {
 *   if (_.isArray(a)) {
 *     return a.concat(b);
 *   }
 * });
 * // => { 'fruits': ['apple', 'banana'], 'vegetables': ['beet', 'carrot'] }
 */
var merge = createAssigner(baseMerge);

module.exports = merge;

},{"104":104,"108":108}],132:[function(_dereq_,module,exports){
/** Used for native method references. */
var arrayProto = Array.prototype,
    errorProto = Error.prototype,
    objectProto = Object.prototype;

/** Native method references. */
var propertyIsEnumerable = objectProto.propertyIsEnumerable,
    splice = arrayProto.splice;

/**
 * An object environment feature flags.
 *
 * @static
 * @memberOf _
 * @type Object
 */
var support = {};

(function(x) {
  var Ctor = function() { this.x = x; },
      object = { '0': x, 'length': x },
      props = [];

  Ctor.prototype = { 'valueOf': x, 'y': x };
  for (var key in new Ctor) { props.push(key); }

  /**
   * Detect if `name` or `message` properties of `Error.prototype` are
   * enumerable by default (IE < 9, Safari < 5.1).
   *
   * @memberOf _.support
   * @type boolean
   */
  support.enumErrorProps = propertyIsEnumerable.call(errorProto, 'message') ||
    propertyIsEnumerable.call(errorProto, 'name');

  /**
   * Detect if `prototype` properties are enumerable by default.
   *
   * Firefox < 3.6, Opera > 9.50 - Opera < 11.60, and Safari < 5.1
   * (if the prototype or a property on the prototype has been set)
   * incorrectly set the `[[Enumerable]]` value of a function's `prototype`
   * property to `true`.
   *
   * @memberOf _.support
   * @type boolean
   */
  support.enumPrototypes = propertyIsEnumerable.call(Ctor, 'prototype');

  /**
   * Detect if properties shadowing those on `Object.prototype` are non-enumerable.
   *
   * In IE < 9 an object's own properties, shadowing non-enumerable ones,
   * are made non-enumerable as well (a.k.a the JScript `[[DontEnum]]` bug).
   *
   * @memberOf _.support
   * @type boolean
   */
  support.nonEnumShadows = !/valueOf/.test(props);

  /**
   * Detect if own properties are iterated after inherited properties (IE < 9).
   *
   * @memberOf _.support
   * @type boolean
   */
  support.ownLast = props[0] != 'x';

  /**
   * Detect if `Array#shift` and `Array#splice` augment array-like objects
   * correctly.
   *
   * Firefox < 10, compatibility modes of IE 8, and IE < 9 have buggy Array
   * `shift()` and `splice()` functions that fail to remove the last element,
   * `value[0]`, of array-like objects even though the "length" property is
   * set to `0`. The `shift()` method is buggy in compatibility modes of IE 8,
   * while `splice()` is buggy regardless of mode in IE < 9.
   *
   * @memberOf _.support
   * @type boolean
   */
  support.spliceObjects = (splice.call(object, 0, 1), !object[0]);

  /**
   * Detect lack of support for accessing string characters by index.
   *
   * IE < 8 can't access characters by index. IE 8 can only access characters
   * by index on string literals, not string objects.
   *
   * @memberOf _.support
   * @type boolean
   */
  support.unindexedChars = ('x'[0] + Object('x')[0]) != 'xx';
}(1, 0));

module.exports = support;

},{}],133:[function(_dereq_,module,exports){
/**
 * This method returns the first argument provided to it.
 *
 * @static
 * @memberOf _
 * @category Utility
 * @param {*} value Any value.
 * @returns {*} Returns `value`.
 * @example
 *
 * var object = { 'user': 'fred' };
 *
 * _.identity(object) === object;
 * // => true
 */
function identity(value) {
  return value;
}

module.exports = identity;

},{}],134:[function(_dereq_,module,exports){
'use strict';

var keys = _dereq_(141);

module.exports = function hasSymbols() {
	if (typeof Symbol !== 'function' || typeof Object.getOwnPropertySymbols !== 'function') { return false; }
	if (typeof Symbol.iterator === 'symbol') { return true; }

	var obj = {};
	var sym = Symbol('test');
	var symObj = Object(sym);
	if (typeof sym === 'string') { return false; }

	if (Object.prototype.toString.call(sym) !== '[object Symbol]') { return false; }
	if (Object.prototype.toString.call(symObj) !== '[object Symbol]') { return false; }

	// temp disabled per https://github.com/ljharb/object.assign/issues/17
	// if (sym instanceof Symbol) { return false; }
	// temp disabled per https://github.com/WebReflection/get-own-property-symbols/issues/4
	// if (!(symObj instanceof Symbol)) { return false; }

	var symVal = 42;
	obj[sym] = symVal;
	for (sym in obj) { return false; }
	if (keys(obj).length !== 0) { return false; }
	if (typeof Object.keys === 'function' && Object.keys(obj).length !== 0) { return false; }

	if (typeof Object.getOwnPropertyNames === 'function' && Object.getOwnPropertyNames(obj).length !== 0) { return false; }

	var syms = Object.getOwnPropertySymbols(obj);
	if (syms.length !== 1 || syms[0] !== sym) { return false; }

	if (!Object.prototype.propertyIsEnumerable.call(obj, sym)) { return false; }

	if (typeof Object.getOwnPropertyDescriptor === 'function') {
		var descriptor = Object.getOwnPropertyDescriptor(obj, sym);
		if (descriptor.value !== symVal || descriptor.enumerable !== true) { return false; }
	}

	return true;
};

},{"141":141}],135:[function(_dereq_,module,exports){
'use strict';

// modified from https://github.com/es-shims/es6-shim
var keys = _dereq_(141);
var bind = _dereq_(140);
var canBeObject = function (obj) {
	return typeof obj !== 'undefined' && obj !== null;
};
var hasSymbols = _dereq_(134)();
var toObject = Object;
var push = bind.call(Function.call, Array.prototype.push);
var propIsEnumerable = bind.call(Function.call, Object.prototype.propertyIsEnumerable);
var originalGetSymbols = hasSymbols ? Object.getOwnPropertySymbols : null;

module.exports = function assign(target, source1) {
	if (!canBeObject(target)) { throw new TypeError('target must be an object'); }
	var objTarget = toObject(target);
	var s, source, i, props, syms, value, key;
	for (s = 1; s < arguments.length; ++s) {
		source = toObject(arguments[s]);
		props = keys(source);
		var getSymbols = hasSymbols && (Object.getOwnPropertySymbols || originalGetSymbols);
		if (getSymbols) {
			syms = getSymbols(source);
			for (i = 0; i < syms.length; ++i) {
				key = syms[i];
				if (propIsEnumerable(source, key)) {
					push(props, key);
				}
			}
		}
		for (i = 0; i < props.length; ++i) {
			key = props[i];
			value = source[key];
			if (propIsEnumerable(source, key)) {
				objTarget[key] = value;
			}
		}
	}
	return objTarget;
};

},{"134":134,"140":140,"141":141}],136:[function(_dereq_,module,exports){
'use strict';

var defineProperties = _dereq_(137);

var implementation = _dereq_(135);
var getPolyfill = _dereq_(143);
var shim = _dereq_(144);

var polyfill = getPolyfill();

defineProperties(polyfill, {
	implementation: implementation,
	getPolyfill: getPolyfill,
	shim: shim
});

module.exports = polyfill;

},{"135":135,"137":137,"143":143,"144":144}],137:[function(_dereq_,module,exports){
'use strict';

var keys = _dereq_(141);
var foreach = _dereq_(138);
var hasSymbols = typeof Symbol === 'function' && typeof Symbol() === 'symbol';

var toStr = Object.prototype.toString;

var isFunction = function (fn) {
	return typeof fn === 'function' && toStr.call(fn) === '[object Function]';
};

var arePropertyDescriptorsSupported = function () {
	var obj = {};
	try {
		Object.defineProperty(obj, 'x', { enumerable: false, value: obj });
        /* eslint-disable no-unused-vars, no-restricted-syntax */
        for (var _ in obj) { return false; }
        /* eslint-enable no-unused-vars, no-restricted-syntax */
		return obj.x === obj;
	} catch (e) { /* this is IE 8. */
		return false;
	}
};
var supportsDescriptors = Object.defineProperty && arePropertyDescriptorsSupported();

var defineProperty = function (object, name, value, predicate) {
	if (name in object && (!isFunction(predicate) || !predicate())) {
		return;
	}
	if (supportsDescriptors) {
		Object.defineProperty(object, name, {
			configurable: true,
			enumerable: false,
			value: value,
			writable: true
		});
	} else {
		object[name] = value;
	}
};

var defineProperties = function (object, map) {
	var predicates = arguments.length > 2 ? arguments[2] : {};
	var props = keys(map);
	if (hasSymbols) {
		props = props.concat(Object.getOwnPropertySymbols(map));
	}
	foreach(props, function (name) {
		defineProperty(object, name, map[name], predicates[name]);
	});
};

defineProperties.supportsDescriptors = !!supportsDescriptors;

module.exports = defineProperties;

},{"138":138,"141":141}],138:[function(_dereq_,module,exports){

var hasOwn = Object.prototype.hasOwnProperty;
var toString = Object.prototype.toString;

module.exports = function forEach (obj, fn, ctx) {
    if (toString.call(fn) !== '[object Function]') {
        throw new TypeError('iterator must be a function');
    }
    var l = obj.length;
    if (l === +l) {
        for (var i = 0; i < l; i++) {
            fn.call(ctx, obj[i], i, obj);
        }
    } else {
        for (var k in obj) {
            if (hasOwn.call(obj, k)) {
                fn.call(ctx, obj[k], k, obj);
            }
        }
    }
};


},{}],139:[function(_dereq_,module,exports){
var ERROR_MESSAGE = 'Function.prototype.bind called on incompatible ';
var slice = Array.prototype.slice;
var toStr = Object.prototype.toString;
var funcType = '[object Function]';

module.exports = function bind(that) {
    var target = this;
    if (typeof target !== 'function' || toStr.call(target) !== funcType) {
        throw new TypeError(ERROR_MESSAGE + target);
    }
    var args = slice.call(arguments, 1);

    var bound;
    var binder = function () {
        if (this instanceof bound) {
            var result = target.apply(
                this,
                args.concat(slice.call(arguments))
            );
            if (Object(result) === result) {
                return result;
            }
            return this;
        } else {
            return target.apply(
                that,
                args.concat(slice.call(arguments))
            );
        }
    };

    var boundLength = Math.max(0, target.length - args.length);
    var boundArgs = [];
    for (var i = 0; i < boundLength; i++) {
        boundArgs.push('$' + i);
    }

    bound = Function('binder', 'return function (' + boundArgs.join(',') + '){ return binder.apply(this,arguments); }')(binder);

    if (target.prototype) {
        var Empty = function Empty() {};
        Empty.prototype = target.prototype;
        bound.prototype = new Empty();
        Empty.prototype = null;
    }

    return bound;
};

},{}],140:[function(_dereq_,module,exports){
var implementation = _dereq_(139);

module.exports = Function.prototype.bind || implementation;

},{"139":139}],141:[function(_dereq_,module,exports){
'use strict';

// modified from https://github.com/es-shims/es5-shim
var has = Object.prototype.hasOwnProperty;
var toStr = Object.prototype.toString;
var slice = Array.prototype.slice;
var isArgs = _dereq_(142);
var isEnumerable = Object.prototype.propertyIsEnumerable;
var hasDontEnumBug = !isEnumerable.call({ toString: null }, 'toString');
var hasProtoEnumBug = isEnumerable.call(function () {}, 'prototype');
var dontEnums = [
	'toString',
	'toLocaleString',
	'valueOf',
	'hasOwnProperty',
	'isPrototypeOf',
	'propertyIsEnumerable',
	'constructor'
];
var equalsConstructorPrototype = function (o) {
	var ctor = o.constructor;
	return ctor && ctor.prototype === o;
};
var excludedKeys = {
	$console: true,
	$external: true,
	$frame: true,
	$frameElement: true,
	$frames: true,
	$innerHeight: true,
	$innerWidth: true,
	$outerHeight: true,
	$outerWidth: true,
	$pageXOffset: true,
	$pageYOffset: true,
	$parent: true,
	$scrollLeft: true,
	$scrollTop: true,
	$scrollX: true,
	$scrollY: true,
	$self: true,
	$webkitIndexedDB: true,
	$webkitStorageInfo: true,
	$window: true
};
var hasAutomationEqualityBug = (function () {
	/* global window */
	if (typeof window === 'undefined') { return false; }
	for (var k in window) {
		try {
			if (!excludedKeys['$' + k] && has.call(window, k) && window[k] !== null && typeof window[k] === 'object') {
				try {
					equalsConstructorPrototype(window[k]);
				} catch (e) {
					return true;
				}
			}
		} catch (e) {
			return true;
		}
	}
	return false;
}());
var equalsConstructorPrototypeIfNotBuggy = function (o) {
	/* global window */
	if (typeof window === 'undefined' || !hasAutomationEqualityBug) {
		return equalsConstructorPrototype(o);
	}
	try {
		return equalsConstructorPrototype(o);
	} catch (e) {
		return false;
	}
};

var keysShim = function keys(object) {
	var isObject = object !== null && typeof object === 'object';
	var isFunction = toStr.call(object) === '[object Function]';
	var isArguments = isArgs(object);
	var isString = isObject && toStr.call(object) === '[object String]';
	var theKeys = [];

	if (!isObject && !isFunction && !isArguments) {
		throw new TypeError('Object.keys called on a non-object');
	}

	var skipProto = hasProtoEnumBug && isFunction;
	if (isString && object.length > 0 && !has.call(object, 0)) {
		for (var i = 0; i < object.length; ++i) {
			theKeys.push(String(i));
		}
	}

	if (isArguments && object.length > 0) {
		for (var j = 0; j < object.length; ++j) {
			theKeys.push(String(j));
		}
	} else {
		for (var name in object) {
			if (!(skipProto && name === 'prototype') && has.call(object, name)) {
				theKeys.push(String(name));
			}
		}
	}

	if (hasDontEnumBug) {
		var skipConstructor = equalsConstructorPrototypeIfNotBuggy(object);

		for (var k = 0; k < dontEnums.length; ++k) {
			if (!(skipConstructor && dontEnums[k] === 'constructor') && has.call(object, dontEnums[k])) {
				theKeys.push(dontEnums[k]);
			}
		}
	}
	return theKeys;
};

keysShim.shim = function shimObjectKeys() {
	if (Object.keys) {
		var keysWorksWithArguments = (function () {
			// Safari 5.0 bug
			return (Object.keys(arguments) || '').length === 2;
		}(1, 2));
		if (!keysWorksWithArguments) {
			var originalKeys = Object.keys;
			Object.keys = function keys(object) {
				if (isArgs(object)) {
					return originalKeys(slice.call(object));
				} else {
					return originalKeys(object);
				}
			};
		}
	} else {
		Object.keys = keysShim;
	}
	return Object.keys || keysShim;
};

module.exports = keysShim;

},{"142":142}],142:[function(_dereq_,module,exports){
'use strict';

var toStr = Object.prototype.toString;

module.exports = function isArguments(value) {
	var str = toStr.call(value);
	var isArgs = str === '[object Arguments]';
	if (!isArgs) {
		isArgs = str !== '[object Array]' &&
			value !== null &&
			typeof value === 'object' &&
			typeof value.length === 'number' &&
			value.length >= 0 &&
			toStr.call(value.callee) === '[object Function]';
	}
	return isArgs;
};

},{}],143:[function(_dereq_,module,exports){
'use strict';

var implementation = _dereq_(135);

var lacksProperEnumerationOrder = function () {
	if (!Object.assign) {
		return false;
	}
	// v8, specifically in node 4.x, has a bug with incorrect property enumeration order
	// note: this does not detect the bug unless there's 20 characters
	var str = 'abcdefghijklmnopqrst';
	var letters = str.split('');
	var map = {};
	for (var i = 0; i < letters.length; ++i) {
		map[letters[i]] = letters[i];
	}
	var obj = Object.assign({}, map);
	var actual = '';
	for (var k in obj) {
		actual += k;
	}
	return str !== actual;
};

var assignHasPendingExceptions = function () {
	if (!Object.assign || !Object.preventExtensions) {
		return false;
	}
	// Firefox 37 still has "pending exception" logic in its Object.assign implementation,
	// which is 72% slower than our shim, and Firefox 40's native implementation.
	var thrower = Object.preventExtensions({ 1: 2 });
	try {
		Object.assign(thrower, 'xy');
	} catch (e) {
		return thrower[1] === 'y';
	}
	return false;
};

module.exports = function getPolyfill() {
	if (!Object.assign) {
		return implementation;
	}
	if (lacksProperEnumerationOrder()) {
		return implementation;
	}
	if (assignHasPendingExceptions()) {
		return implementation;
	}
	return Object.assign;
};

},{"135":135}],144:[function(_dereq_,module,exports){
'use strict';

var define = _dereq_(137);
var getPolyfill = _dereq_(143);

module.exports = function shimAssign() {
	var polyfill = getPolyfill();
	define(
		Object,
		{ assign: polyfill },
		{ assign: function () { return Object.assign !== polyfill; } }
	);
	return polyfill;
};

},{"137":137,"143":143}],145:[function(_dereq_,module,exports){
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

},{}],146:[function(_dereq_,module,exports){
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
},{}],147:[function(_dereq_,module,exports){
"use strict";
var window = _dereq_(93)
var once = _dereq_(149)
var isFunction = _dereq_(148)
var parseHeaders = _dereq_(152)
var xtend = _dereq_(153)

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
    var callback = options.callback
    if(typeof callback === "undefined"){
        throw new Error("callback argument missing")
    }
    callback = once(callback)

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
        } else if (xhr.responseType === "text" || !xhr.responseType) {
            body = xhr.responseText || xhr.responseXML
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
        callback(evt, failureResponse)
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
        callback(err, response, response.body)

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

function noop() {}

},{"148":148,"149":149,"152":152,"153":153,"93":93}],148:[function(_dereq_,module,exports){
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

},{}],149:[function(_dereq_,module,exports){
module.exports = once

once.proto = once(function () {
  Object.defineProperty(Function.prototype, 'once', {
    value: function () {
      return once(this)
    },
    configurable: true
  })
})

function once (fn) {
  var called = false
  return function () {
    if (called) return
    called = true
    return fn.apply(this, arguments)
  }
}

},{}],150:[function(_dereq_,module,exports){
var isFunction = _dereq_(148)

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

},{"148":148}],151:[function(_dereq_,module,exports){

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

},{}],152:[function(_dereq_,module,exports){
var trim = _dereq_(151)
  , forEach = _dereq_(150)
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
},{"150":150,"151":151}],153:[function(_dereq_,module,exports){
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

},{}]},{},[91])(91)
});
/* vtt.js - v0.12.1 (https://github.com/mozilla/vtt.js) built on 08-07-2015 */

(function(root) {
  var vttjs = root.vttjs = {};
  var cueShim = vttjs.VTTCue;
  var regionShim = vttjs.VTTRegion;
  var oldVTTCue = root.VTTCue;
  var oldVTTRegion = root.VTTRegion;

  vttjs.shim = function() {
    vttjs.VTTCue = cueShim;
    vttjs.VTTRegion = regionShim;
  };

  vttjs.restore = function() {
    vttjs.VTTCue = oldVTTCue;
    vttjs.VTTRegion = oldVTTRegion;
  };
}(this));

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

(function(root, vttjs) {

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

  root.VTTCue = root.VTTCue || VTTCue;
  vttjs.VTTCue = VTTCue;
}(this, (this.vttjs || {})));

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

(function(root, vttjs) {

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

  root.VTTRegion = root.VTTRegion || VTTRegion;
  vttjs.VTTRegion = VTTRegion;
}(this, (this.vttjs || {})));

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

(function(global) {

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
  var strongRTLChars = [0x05BE, 0x05C0, 0x05C3, 0x05C6, 0x05D0, 0x05D1,
      0x05D2, 0x05D3, 0x05D4, 0x05D5, 0x05D6, 0x05D7, 0x05D8, 0x05D9, 0x05DA,
      0x05DB, 0x05DC, 0x05DD, 0x05DE, 0x05DF, 0x05E0, 0x05E1, 0x05E2, 0x05E3,
      0x05E4, 0x05E5, 0x05E6, 0x05E7, 0x05E8, 0x05E9, 0x05EA, 0x05F0, 0x05F1,
      0x05F2, 0x05F3, 0x05F4, 0x0608, 0x060B, 0x060D, 0x061B, 0x061E, 0x061F,
      0x0620, 0x0621, 0x0622, 0x0623, 0x0624, 0x0625, 0x0626, 0x0627, 0x0628,
      0x0629, 0x062A, 0x062B, 0x062C, 0x062D, 0x062E, 0x062F, 0x0630, 0x0631,
      0x0632, 0x0633, 0x0634, 0x0635, 0x0636, 0x0637, 0x0638, 0x0639, 0x063A,
      0x063B, 0x063C, 0x063D, 0x063E, 0x063F, 0x0640, 0x0641, 0x0642, 0x0643,
      0x0644, 0x0645, 0x0646, 0x0647, 0x0648, 0x0649, 0x064A, 0x066D, 0x066E,
      0x066F, 0x0671, 0x0672, 0x0673, 0x0674, 0x0675, 0x0676, 0x0677, 0x0678,
      0x0679, 0x067A, 0x067B, 0x067C, 0x067D, 0x067E, 0x067F, 0x0680, 0x0681,
      0x0682, 0x0683, 0x0684, 0x0685, 0x0686, 0x0687, 0x0688, 0x0689, 0x068A,
      0x068B, 0x068C, 0x068D, 0x068E, 0x068F, 0x0690, 0x0691, 0x0692, 0x0693,
      0x0694, 0x0695, 0x0696, 0x0697, 0x0698, 0x0699, 0x069A, 0x069B, 0x069C,
      0x069D, 0x069E, 0x069F, 0x06A0, 0x06A1, 0x06A2, 0x06A3, 0x06A4, 0x06A5,
      0x06A6, 0x06A7, 0x06A8, 0x06A9, 0x06AA, 0x06AB, 0x06AC, 0x06AD, 0x06AE,
      0x06AF, 0x06B0, 0x06B1, 0x06B2, 0x06B3, 0x06B4, 0x06B5, 0x06B6, 0x06B7,
      0x06B8, 0x06B9, 0x06BA, 0x06BB, 0x06BC, 0x06BD, 0x06BE, 0x06BF, 0x06C0,
      0x06C1, 0x06C2, 0x06C3, 0x06C4, 0x06C5, 0x06C6, 0x06C7, 0x06C8, 0x06C9,
      0x06CA, 0x06CB, 0x06CC, 0x06CD, 0x06CE, 0x06CF, 0x06D0, 0x06D1, 0x06D2,
      0x06D3, 0x06D4, 0x06D5, 0x06E5, 0x06E6, 0x06EE, 0x06EF, 0x06FA, 0x06FB,
      0x06FC, 0x06FD, 0x06FE, 0x06FF, 0x0700, 0x0701, 0x0702, 0x0703, 0x0704,
      0x0705, 0x0706, 0x0707, 0x0708, 0x0709, 0x070A, 0x070B, 0x070C, 0x070D,
      0x070F, 0x0710, 0x0712, 0x0713, 0x0714, 0x0715, 0x0716, 0x0717, 0x0718,
      0x0719, 0x071A, 0x071B, 0x071C, 0x071D, 0x071E, 0x071F, 0x0720, 0x0721,
      0x0722, 0x0723, 0x0724, 0x0725, 0x0726, 0x0727, 0x0728, 0x0729, 0x072A,
      0x072B, 0x072C, 0x072D, 0x072E, 0x072F, 0x074D, 0x074E, 0x074F, 0x0750,
      0x0751, 0x0752, 0x0753, 0x0754, 0x0755, 0x0756, 0x0757, 0x0758, 0x0759,
      0x075A, 0x075B, 0x075C, 0x075D, 0x075E, 0x075F, 0x0760, 0x0761, 0x0762,
      0x0763, 0x0764, 0x0765, 0x0766, 0x0767, 0x0768, 0x0769, 0x076A, 0x076B,
      0x076C, 0x076D, 0x076E, 0x076F, 0x0770, 0x0771, 0x0772, 0x0773, 0x0774,
      0x0775, 0x0776, 0x0777, 0x0778, 0x0779, 0x077A, 0x077B, 0x077C, 0x077D,
      0x077E, 0x077F, 0x0780, 0x0781, 0x0782, 0x0783, 0x0784, 0x0785, 0x0786,
      0x0787, 0x0788, 0x0789, 0x078A, 0x078B, 0x078C, 0x078D, 0x078E, 0x078F,
      0x0790, 0x0791, 0x0792, 0x0793, 0x0794, 0x0795, 0x0796, 0x0797, 0x0798,
      0x0799, 0x079A, 0x079B, 0x079C, 0x079D, 0x079E, 0x079F, 0x07A0, 0x07A1,
      0x07A2, 0x07A3, 0x07A4, 0x07A5, 0x07B1, 0x07C0, 0x07C1, 0x07C2, 0x07C3,
      0x07C4, 0x07C5, 0x07C6, 0x07C7, 0x07C8, 0x07C9, 0x07CA, 0x07CB, 0x07CC,
      0x07CD, 0x07CE, 0x07CF, 0x07D0, 0x07D1, 0x07D2, 0x07D3, 0x07D4, 0x07D5,
      0x07D6, 0x07D7, 0x07D8, 0x07D9, 0x07DA, 0x07DB, 0x07DC, 0x07DD, 0x07DE,
      0x07DF, 0x07E0, 0x07E1, 0x07E2, 0x07E3, 0x07E4, 0x07E5, 0x07E6, 0x07E7,
      0x07E8, 0x07E9, 0x07EA, 0x07F4, 0x07F5, 0x07FA, 0x0800, 0x0801, 0x0802,
      0x0803, 0x0804, 0x0805, 0x0806, 0x0807, 0x0808, 0x0809, 0x080A, 0x080B,
      0x080C, 0x080D, 0x080E, 0x080F, 0x0810, 0x0811, 0x0812, 0x0813, 0x0814,
      0x0815, 0x081A, 0x0824, 0x0828, 0x0830, 0x0831, 0x0832, 0x0833, 0x0834,
      0x0835, 0x0836, 0x0837, 0x0838, 0x0839, 0x083A, 0x083B, 0x083C, 0x083D,
      0x083E, 0x0840, 0x0841, 0x0842, 0x0843, 0x0844, 0x0845, 0x0846, 0x0847,
      0x0848, 0x0849, 0x084A, 0x084B, 0x084C, 0x084D, 0x084E, 0x084F, 0x0850,
      0x0851, 0x0852, 0x0853, 0x0854, 0x0855, 0x0856, 0x0857, 0x0858, 0x085E,
      0x08A0, 0x08A2, 0x08A3, 0x08A4, 0x08A5, 0x08A6, 0x08A7, 0x08A8, 0x08A9,
      0x08AA, 0x08AB, 0x08AC, 0x200F, 0xFB1D, 0xFB1F, 0xFB20, 0xFB21, 0xFB22,
      0xFB23, 0xFB24, 0xFB25, 0xFB26, 0xFB27, 0xFB28, 0xFB2A, 0xFB2B, 0xFB2C,
      0xFB2D, 0xFB2E, 0xFB2F, 0xFB30, 0xFB31, 0xFB32, 0xFB33, 0xFB34, 0xFB35,
      0xFB36, 0xFB38, 0xFB39, 0xFB3A, 0xFB3B, 0xFB3C, 0xFB3E, 0xFB40, 0xFB41,
      0xFB43, 0xFB44, 0xFB46, 0xFB47, 0xFB48, 0xFB49, 0xFB4A, 0xFB4B, 0xFB4C,
      0xFB4D, 0xFB4E, 0xFB4F, 0xFB50, 0xFB51, 0xFB52, 0xFB53, 0xFB54, 0xFB55,
      0xFB56, 0xFB57, 0xFB58, 0xFB59, 0xFB5A, 0xFB5B, 0xFB5C, 0xFB5D, 0xFB5E,
      0xFB5F, 0xFB60, 0xFB61, 0xFB62, 0xFB63, 0xFB64, 0xFB65, 0xFB66, 0xFB67,
      0xFB68, 0xFB69, 0xFB6A, 0xFB6B, 0xFB6C, 0xFB6D, 0xFB6E, 0xFB6F, 0xFB70,
      0xFB71, 0xFB72, 0xFB73, 0xFB74, 0xFB75, 0xFB76, 0xFB77, 0xFB78, 0xFB79,
      0xFB7A, 0xFB7B, 0xFB7C, 0xFB7D, 0xFB7E, 0xFB7F, 0xFB80, 0xFB81, 0xFB82,
      0xFB83, 0xFB84, 0xFB85, 0xFB86, 0xFB87, 0xFB88, 0xFB89, 0xFB8A, 0xFB8B,
      0xFB8C, 0xFB8D, 0xFB8E, 0xFB8F, 0xFB90, 0xFB91, 0xFB92, 0xFB93, 0xFB94,
      0xFB95, 0xFB96, 0xFB97, 0xFB98, 0xFB99, 0xFB9A, 0xFB9B, 0xFB9C, 0xFB9D,
      0xFB9E, 0xFB9F, 0xFBA0, 0xFBA1, 0xFBA2, 0xFBA3, 0xFBA4, 0xFBA5, 0xFBA6,
      0xFBA7, 0xFBA8, 0xFBA9, 0xFBAA, 0xFBAB, 0xFBAC, 0xFBAD, 0xFBAE, 0xFBAF,
      0xFBB0, 0xFBB1, 0xFBB2, 0xFBB3, 0xFBB4, 0xFBB5, 0xFBB6, 0xFBB7, 0xFBB8,
      0xFBB9, 0xFBBA, 0xFBBB, 0xFBBC, 0xFBBD, 0xFBBE, 0xFBBF, 0xFBC0, 0xFBC1,
      0xFBD3, 0xFBD4, 0xFBD5, 0xFBD6, 0xFBD7, 0xFBD8, 0xFBD9, 0xFBDA, 0xFBDB,
      0xFBDC, 0xFBDD, 0xFBDE, 0xFBDF, 0xFBE0, 0xFBE1, 0xFBE2, 0xFBE3, 0xFBE4,
      0xFBE5, 0xFBE6, 0xFBE7, 0xFBE8, 0xFBE9, 0xFBEA, 0xFBEB, 0xFBEC, 0xFBED,
      0xFBEE, 0xFBEF, 0xFBF0, 0xFBF1, 0xFBF2, 0xFBF3, 0xFBF4, 0xFBF5, 0xFBF6,
      0xFBF7, 0xFBF8, 0xFBF9, 0xFBFA, 0xFBFB, 0xFBFC, 0xFBFD, 0xFBFE, 0xFBFF,
      0xFC00, 0xFC01, 0xFC02, 0xFC03, 0xFC04, 0xFC05, 0xFC06, 0xFC07, 0xFC08,
      0xFC09, 0xFC0A, 0xFC0B, 0xFC0C, 0xFC0D, 0xFC0E, 0xFC0F, 0xFC10, 0xFC11,
      0xFC12, 0xFC13, 0xFC14, 0xFC15, 0xFC16, 0xFC17, 0xFC18, 0xFC19, 0xFC1A,
      0xFC1B, 0xFC1C, 0xFC1D, 0xFC1E, 0xFC1F, 0xFC20, 0xFC21, 0xFC22, 0xFC23,
      0xFC24, 0xFC25, 0xFC26, 0xFC27, 0xFC28, 0xFC29, 0xFC2A, 0xFC2B, 0xFC2C,
      0xFC2D, 0xFC2E, 0xFC2F, 0xFC30, 0xFC31, 0xFC32, 0xFC33, 0xFC34, 0xFC35,
      0xFC36, 0xFC37, 0xFC38, 0xFC39, 0xFC3A, 0xFC3B, 0xFC3C, 0xFC3D, 0xFC3E,
      0xFC3F, 0xFC40, 0xFC41, 0xFC42, 0xFC43, 0xFC44, 0xFC45, 0xFC46, 0xFC47,
      0xFC48, 0xFC49, 0xFC4A, 0xFC4B, 0xFC4C, 0xFC4D, 0xFC4E, 0xFC4F, 0xFC50,
      0xFC51, 0xFC52, 0xFC53, 0xFC54, 0xFC55, 0xFC56, 0xFC57, 0xFC58, 0xFC59,
      0xFC5A, 0xFC5B, 0xFC5C, 0xFC5D, 0xFC5E, 0xFC5F, 0xFC60, 0xFC61, 0xFC62,
      0xFC63, 0xFC64, 0xFC65, 0xFC66, 0xFC67, 0xFC68, 0xFC69, 0xFC6A, 0xFC6B,
      0xFC6C, 0xFC6D, 0xFC6E, 0xFC6F, 0xFC70, 0xFC71, 0xFC72, 0xFC73, 0xFC74,
      0xFC75, 0xFC76, 0xFC77, 0xFC78, 0xFC79, 0xFC7A, 0xFC7B, 0xFC7C, 0xFC7D,
      0xFC7E, 0xFC7F, 0xFC80, 0xFC81, 0xFC82, 0xFC83, 0xFC84, 0xFC85, 0xFC86,
      0xFC87, 0xFC88, 0xFC89, 0xFC8A, 0xFC8B, 0xFC8C, 0xFC8D, 0xFC8E, 0xFC8F,
      0xFC90, 0xFC91, 0xFC92, 0xFC93, 0xFC94, 0xFC95, 0xFC96, 0xFC97, 0xFC98,
      0xFC99, 0xFC9A, 0xFC9B, 0xFC9C, 0xFC9D, 0xFC9E, 0xFC9F, 0xFCA0, 0xFCA1,
      0xFCA2, 0xFCA3, 0xFCA4, 0xFCA5, 0xFCA6, 0xFCA7, 0xFCA8, 0xFCA9, 0xFCAA,
      0xFCAB, 0xFCAC, 0xFCAD, 0xFCAE, 0xFCAF, 0xFCB0, 0xFCB1, 0xFCB2, 0xFCB3,
      0xFCB4, 0xFCB5, 0xFCB6, 0xFCB7, 0xFCB8, 0xFCB9, 0xFCBA, 0xFCBB, 0xFCBC,
      0xFCBD, 0xFCBE, 0xFCBF, 0xFCC0, 0xFCC1, 0xFCC2, 0xFCC3, 0xFCC4, 0xFCC5,
      0xFCC6, 0xFCC7, 0xFCC8, 0xFCC9, 0xFCCA, 0xFCCB, 0xFCCC, 0xFCCD, 0xFCCE,
      0xFCCF, 0xFCD0, 0xFCD1, 0xFCD2, 0xFCD3, 0xFCD4, 0xFCD5, 0xFCD6, 0xFCD7,
      0xFCD8, 0xFCD9, 0xFCDA, 0xFCDB, 0xFCDC, 0xFCDD, 0xFCDE, 0xFCDF, 0xFCE0,
      0xFCE1, 0xFCE2, 0xFCE3, 0xFCE4, 0xFCE5, 0xFCE6, 0xFCE7, 0xFCE8, 0xFCE9,
      0xFCEA, 0xFCEB, 0xFCEC, 0xFCED, 0xFCEE, 0xFCEF, 0xFCF0, 0xFCF1, 0xFCF2,
      0xFCF3, 0xFCF4, 0xFCF5, 0xFCF6, 0xFCF7, 0xFCF8, 0xFCF9, 0xFCFA, 0xFCFB,
      0xFCFC, 0xFCFD, 0xFCFE, 0xFCFF, 0xFD00, 0xFD01, 0xFD02, 0xFD03, 0xFD04,
      0xFD05, 0xFD06, 0xFD07, 0xFD08, 0xFD09, 0xFD0A, 0xFD0B, 0xFD0C, 0xFD0D,
      0xFD0E, 0xFD0F, 0xFD10, 0xFD11, 0xFD12, 0xFD13, 0xFD14, 0xFD15, 0xFD16,
      0xFD17, 0xFD18, 0xFD19, 0xFD1A, 0xFD1B, 0xFD1C, 0xFD1D, 0xFD1E, 0xFD1F,
      0xFD20, 0xFD21, 0xFD22, 0xFD23, 0xFD24, 0xFD25, 0xFD26, 0xFD27, 0xFD28,
      0xFD29, 0xFD2A, 0xFD2B, 0xFD2C, 0xFD2D, 0xFD2E, 0xFD2F, 0xFD30, 0xFD31,
      0xFD32, 0xFD33, 0xFD34, 0xFD35, 0xFD36, 0xFD37, 0xFD38, 0xFD39, 0xFD3A,
      0xFD3B, 0xFD3C, 0xFD3D, 0xFD50, 0xFD51, 0xFD52, 0xFD53, 0xFD54, 0xFD55,
      0xFD56, 0xFD57, 0xFD58, 0xFD59, 0xFD5A, 0xFD5B, 0xFD5C, 0xFD5D, 0xFD5E,
      0xFD5F, 0xFD60, 0xFD61, 0xFD62, 0xFD63, 0xFD64, 0xFD65, 0xFD66, 0xFD67,
      0xFD68, 0xFD69, 0xFD6A, 0xFD6B, 0xFD6C, 0xFD6D, 0xFD6E, 0xFD6F, 0xFD70,
      0xFD71, 0xFD72, 0xFD73, 0xFD74, 0xFD75, 0xFD76, 0xFD77, 0xFD78, 0xFD79,
      0xFD7A, 0xFD7B, 0xFD7C, 0xFD7D, 0xFD7E, 0xFD7F, 0xFD80, 0xFD81, 0xFD82,
      0xFD83, 0xFD84, 0xFD85, 0xFD86, 0xFD87, 0xFD88, 0xFD89, 0xFD8A, 0xFD8B,
      0xFD8C, 0xFD8D, 0xFD8E, 0xFD8F, 0xFD92, 0xFD93, 0xFD94, 0xFD95, 0xFD96,
      0xFD97, 0xFD98, 0xFD99, 0xFD9A, 0xFD9B, 0xFD9C, 0xFD9D, 0xFD9E, 0xFD9F,
      0xFDA0, 0xFDA1, 0xFDA2, 0xFDA3, 0xFDA4, 0xFDA5, 0xFDA6, 0xFDA7, 0xFDA8,
      0xFDA9, 0xFDAA, 0xFDAB, 0xFDAC, 0xFDAD, 0xFDAE, 0xFDAF, 0xFDB0, 0xFDB1,
      0xFDB2, 0xFDB3, 0xFDB4, 0xFDB5, 0xFDB6, 0xFDB7, 0xFDB8, 0xFDB9, 0xFDBA,
      0xFDBB, 0xFDBC, 0xFDBD, 0xFDBE, 0xFDBF, 0xFDC0, 0xFDC1, 0xFDC2, 0xFDC3,
      0xFDC4, 0xFDC5, 0xFDC6, 0xFDC7, 0xFDF0, 0xFDF1, 0xFDF2, 0xFDF3, 0xFDF4,
      0xFDF5, 0xFDF6, 0xFDF7, 0xFDF8, 0xFDF9, 0xFDFA, 0xFDFB, 0xFDFC, 0xFE70,
      0xFE71, 0xFE72, 0xFE73, 0xFE74, 0xFE76, 0xFE77, 0xFE78, 0xFE79, 0xFE7A,
      0xFE7B, 0xFE7C, 0xFE7D, 0xFE7E, 0xFE7F, 0xFE80, 0xFE81, 0xFE82, 0xFE83,
      0xFE84, 0xFE85, 0xFE86, 0xFE87, 0xFE88, 0xFE89, 0xFE8A, 0xFE8B, 0xFE8C,
      0xFE8D, 0xFE8E, 0xFE8F, 0xFE90, 0xFE91, 0xFE92, 0xFE93, 0xFE94, 0xFE95,
      0xFE96, 0xFE97, 0xFE98, 0xFE99, 0xFE9A, 0xFE9B, 0xFE9C, 0xFE9D, 0xFE9E,
      0xFE9F, 0xFEA0, 0xFEA1, 0xFEA2, 0xFEA3, 0xFEA4, 0xFEA5, 0xFEA6, 0xFEA7,
      0xFEA8, 0xFEA9, 0xFEAA, 0xFEAB, 0xFEAC, 0xFEAD, 0xFEAE, 0xFEAF, 0xFEB0,
      0xFEB1, 0xFEB2, 0xFEB3, 0xFEB4, 0xFEB5, 0xFEB6, 0xFEB7, 0xFEB8, 0xFEB9,
      0xFEBA, 0xFEBB, 0xFEBC, 0xFEBD, 0xFEBE, 0xFEBF, 0xFEC0, 0xFEC1, 0xFEC2,
      0xFEC3, 0xFEC4, 0xFEC5, 0xFEC6, 0xFEC7, 0xFEC8, 0xFEC9, 0xFECA, 0xFECB,
      0xFECC, 0xFECD, 0xFECE, 0xFECF, 0xFED0, 0xFED1, 0xFED2, 0xFED3, 0xFED4,
      0xFED5, 0xFED6, 0xFED7, 0xFED8, 0xFED9, 0xFEDA, 0xFEDB, 0xFEDC, 0xFEDD,
      0xFEDE, 0xFEDF, 0xFEE0, 0xFEE1, 0xFEE2, 0xFEE3, 0xFEE4, 0xFEE5, 0xFEE6,
      0xFEE7, 0xFEE8, 0xFEE9, 0xFEEA, 0xFEEB, 0xFEEC, 0xFEED, 0xFEEE, 0xFEEF,
      0xFEF0, 0xFEF1, 0xFEF2, 0xFEF3, 0xFEF4, 0xFEF5, 0xFEF6, 0xFEF7, 0xFEF8,
      0xFEF9, 0xFEFA, 0xFEFB, 0xFEFC, 0x10800, 0x10801, 0x10802, 0x10803,
      0x10804, 0x10805, 0x10808, 0x1080A, 0x1080B, 0x1080C, 0x1080D, 0x1080E,
      0x1080F, 0x10810, 0x10811, 0x10812, 0x10813, 0x10814, 0x10815, 0x10816,
      0x10817, 0x10818, 0x10819, 0x1081A, 0x1081B, 0x1081C, 0x1081D, 0x1081E,
      0x1081F, 0x10820, 0x10821, 0x10822, 0x10823, 0x10824, 0x10825, 0x10826,
      0x10827, 0x10828, 0x10829, 0x1082A, 0x1082B, 0x1082C, 0x1082D, 0x1082E,
      0x1082F, 0x10830, 0x10831, 0x10832, 0x10833, 0x10834, 0x10835, 0x10837,
      0x10838, 0x1083C, 0x1083F, 0x10840, 0x10841, 0x10842, 0x10843, 0x10844,
      0x10845, 0x10846, 0x10847, 0x10848, 0x10849, 0x1084A, 0x1084B, 0x1084C,
      0x1084D, 0x1084E, 0x1084F, 0x10850, 0x10851, 0x10852, 0x10853, 0x10854,
      0x10855, 0x10857, 0x10858, 0x10859, 0x1085A, 0x1085B, 0x1085C, 0x1085D,
      0x1085E, 0x1085F, 0x10900, 0x10901, 0x10902, 0x10903, 0x10904, 0x10905,
      0x10906, 0x10907, 0x10908, 0x10909, 0x1090A, 0x1090B, 0x1090C, 0x1090D,
      0x1090E, 0x1090F, 0x10910, 0x10911, 0x10912, 0x10913, 0x10914, 0x10915,
      0x10916, 0x10917, 0x10918, 0x10919, 0x1091A, 0x1091B, 0x10920, 0x10921,
      0x10922, 0x10923, 0x10924, 0x10925, 0x10926, 0x10927, 0x10928, 0x10929,
      0x1092A, 0x1092B, 0x1092C, 0x1092D, 0x1092E, 0x1092F, 0x10930, 0x10931,
      0x10932, 0x10933, 0x10934, 0x10935, 0x10936, 0x10937, 0x10938, 0x10939,
      0x1093F, 0x10980, 0x10981, 0x10982, 0x10983, 0x10984, 0x10985, 0x10986,
      0x10987, 0x10988, 0x10989, 0x1098A, 0x1098B, 0x1098C, 0x1098D, 0x1098E,
      0x1098F, 0x10990, 0x10991, 0x10992, 0x10993, 0x10994, 0x10995, 0x10996,
      0x10997, 0x10998, 0x10999, 0x1099A, 0x1099B, 0x1099C, 0x1099D, 0x1099E,
      0x1099F, 0x109A0, 0x109A1, 0x109A2, 0x109A3, 0x109A4, 0x109A5, 0x109A6,
      0x109A7, 0x109A8, 0x109A9, 0x109AA, 0x109AB, 0x109AC, 0x109AD, 0x109AE,
      0x109AF, 0x109B0, 0x109B1, 0x109B2, 0x109B3, 0x109B4, 0x109B5, 0x109B6,
      0x109B7, 0x109BE, 0x109BF, 0x10A00, 0x10A10, 0x10A11, 0x10A12, 0x10A13,
      0x10A15, 0x10A16, 0x10A17, 0x10A19, 0x10A1A, 0x10A1B, 0x10A1C, 0x10A1D,
      0x10A1E, 0x10A1F, 0x10A20, 0x10A21, 0x10A22, 0x10A23, 0x10A24, 0x10A25,
      0x10A26, 0x10A27, 0x10A28, 0x10A29, 0x10A2A, 0x10A2B, 0x10A2C, 0x10A2D,
      0x10A2E, 0x10A2F, 0x10A30, 0x10A31, 0x10A32, 0x10A33, 0x10A40, 0x10A41,
      0x10A42, 0x10A43, 0x10A44, 0x10A45, 0x10A46, 0x10A47, 0x10A50, 0x10A51,
      0x10A52, 0x10A53, 0x10A54, 0x10A55, 0x10A56, 0x10A57, 0x10A58, 0x10A60,
      0x10A61, 0x10A62, 0x10A63, 0x10A64, 0x10A65, 0x10A66, 0x10A67, 0x10A68,
      0x10A69, 0x10A6A, 0x10A6B, 0x10A6C, 0x10A6D, 0x10A6E, 0x10A6F, 0x10A70,
      0x10A71, 0x10A72, 0x10A73, 0x10A74, 0x10A75, 0x10A76, 0x10A77, 0x10A78,
      0x10A79, 0x10A7A, 0x10A7B, 0x10A7C, 0x10A7D, 0x10A7E, 0x10A7F, 0x10B00,
      0x10B01, 0x10B02, 0x10B03, 0x10B04, 0x10B05, 0x10B06, 0x10B07, 0x10B08,
      0x10B09, 0x10B0A, 0x10B0B, 0x10B0C, 0x10B0D, 0x10B0E, 0x10B0F, 0x10B10,
      0x10B11, 0x10B12, 0x10B13, 0x10B14, 0x10B15, 0x10B16, 0x10B17, 0x10B18,
      0x10B19, 0x10B1A, 0x10B1B, 0x10B1C, 0x10B1D, 0x10B1E, 0x10B1F, 0x10B20,
      0x10B21, 0x10B22, 0x10B23, 0x10B24, 0x10B25, 0x10B26, 0x10B27, 0x10B28,
      0x10B29, 0x10B2A, 0x10B2B, 0x10B2C, 0x10B2D, 0x10B2E, 0x10B2F, 0x10B30,
      0x10B31, 0x10B32, 0x10B33, 0x10B34, 0x10B35, 0x10B40, 0x10B41, 0x10B42,
      0x10B43, 0x10B44, 0x10B45, 0x10B46, 0x10B47, 0x10B48, 0x10B49, 0x10B4A,
      0x10B4B, 0x10B4C, 0x10B4D, 0x10B4E, 0x10B4F, 0x10B50, 0x10B51, 0x10B52,
      0x10B53, 0x10B54, 0x10B55, 0x10B58, 0x10B59, 0x10B5A, 0x10B5B, 0x10B5C,
      0x10B5D, 0x10B5E, 0x10B5F, 0x10B60, 0x10B61, 0x10B62, 0x10B63, 0x10B64,
      0x10B65, 0x10B66, 0x10B67, 0x10B68, 0x10B69, 0x10B6A, 0x10B6B, 0x10B6C,
      0x10B6D, 0x10B6E, 0x10B6F, 0x10B70, 0x10B71, 0x10B72, 0x10B78, 0x10B79,
      0x10B7A, 0x10B7B, 0x10B7C, 0x10B7D, 0x10B7E, 0x10B7F, 0x10C00, 0x10C01,
      0x10C02, 0x10C03, 0x10C04, 0x10C05, 0x10C06, 0x10C07, 0x10C08, 0x10C09,
      0x10C0A, 0x10C0B, 0x10C0C, 0x10C0D, 0x10C0E, 0x10C0F, 0x10C10, 0x10C11,
      0x10C12, 0x10C13, 0x10C14, 0x10C15, 0x10C16, 0x10C17, 0x10C18, 0x10C19,
      0x10C1A, 0x10C1B, 0x10C1C, 0x10C1D, 0x10C1E, 0x10C1F, 0x10C20, 0x10C21,
      0x10C22, 0x10C23, 0x10C24, 0x10C25, 0x10C26, 0x10C27, 0x10C28, 0x10C29,
      0x10C2A, 0x10C2B, 0x10C2C, 0x10C2D, 0x10C2E, 0x10C2F, 0x10C30, 0x10C31,
      0x10C32, 0x10C33, 0x10C34, 0x10C35, 0x10C36, 0x10C37, 0x10C38, 0x10C39,
      0x10C3A, 0x10C3B, 0x10C3C, 0x10C3D, 0x10C3E, 0x10C3F, 0x10C40, 0x10C41,
      0x10C42, 0x10C43, 0x10C44, 0x10C45, 0x10C46, 0x10C47, 0x10C48, 0x1EE00,
      0x1EE01, 0x1EE02, 0x1EE03, 0x1EE05, 0x1EE06, 0x1EE07, 0x1EE08, 0x1EE09,
      0x1EE0A, 0x1EE0B, 0x1EE0C, 0x1EE0D, 0x1EE0E, 0x1EE0F, 0x1EE10, 0x1EE11,
      0x1EE12, 0x1EE13, 0x1EE14, 0x1EE15, 0x1EE16, 0x1EE17, 0x1EE18, 0x1EE19,
      0x1EE1A, 0x1EE1B, 0x1EE1C, 0x1EE1D, 0x1EE1E, 0x1EE1F, 0x1EE21, 0x1EE22,
      0x1EE24, 0x1EE27, 0x1EE29, 0x1EE2A, 0x1EE2B, 0x1EE2C, 0x1EE2D, 0x1EE2E,
      0x1EE2F, 0x1EE30, 0x1EE31, 0x1EE32, 0x1EE34, 0x1EE35, 0x1EE36, 0x1EE37,
      0x1EE39, 0x1EE3B, 0x1EE42, 0x1EE47, 0x1EE49, 0x1EE4B, 0x1EE4D, 0x1EE4E,
      0x1EE4F, 0x1EE51, 0x1EE52, 0x1EE54, 0x1EE57, 0x1EE59, 0x1EE5B, 0x1EE5D,
      0x1EE5F, 0x1EE61, 0x1EE62, 0x1EE64, 0x1EE67, 0x1EE68, 0x1EE69, 0x1EE6A,
      0x1EE6C, 0x1EE6D, 0x1EE6E, 0x1EE6F, 0x1EE70, 0x1EE71, 0x1EE72, 0x1EE74,
      0x1EE75, 0x1EE76, 0x1EE77, 0x1EE79, 0x1EE7A, 0x1EE7B, 0x1EE7C, 0x1EE7E,
      0x1EE80, 0x1EE81, 0x1EE82, 0x1EE83, 0x1EE84, 0x1EE85, 0x1EE86, 0x1EE87,
      0x1EE88, 0x1EE89, 0x1EE8B, 0x1EE8C, 0x1EE8D, 0x1EE8E, 0x1EE8F, 0x1EE90,
      0x1EE91, 0x1EE92, 0x1EE93, 0x1EE94, 0x1EE95, 0x1EE96, 0x1EE97, 0x1EE98,
      0x1EE99, 0x1EE9A, 0x1EE9B, 0x1EEA1, 0x1EEA2, 0x1EEA3, 0x1EEA5, 0x1EEA6,
      0x1EEA7, 0x1EEA8, 0x1EEA9, 0x1EEAB, 0x1EEAC, 0x1EEAD, 0x1EEAE, 0x1EEAF,
      0x1EEB0, 0x1EEB1, 0x1EEB2, 0x1EEB3, 0x1EEB4, 0x1EEB5, 0x1EEB6, 0x1EEB7,
      0x1EEB8, 0x1EEB9, 0x1EEBA, 0x1EEBB, 0x10FFFD];

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
        for (var j = 0; j < strongRTLChars.length; j++) {
          if (strongRTLChars[j] === charCode) {
            return "rtl";
          }
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

      // 3.2 WebVTT metadata header syntax
      function parseHeader(input) {
        parseOptions(input, function (k, v) {
          switch (k) {
          case "Region":
            // 3.3 WebVTT region metadata header syntax
            parseRegion(v);
            break;
          }
        }, /:/);
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

  global.WebVTT = WebVTT;

}(this, (this.vttjs || {})));
