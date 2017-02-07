/**
 * @file button.js
 */
import Component from './component';
import * as Dom from './utils/dom.js';
import * as Events from './utils/events.js';
import * as Fn from './utils/fn.js';
import log from './utils/log.js';
import document from 'global/document';
import {assign} from './utils/obj';

/**
 * Clickable Component which is clickable or keyboard actionable,
 * but is not a native HTML button.
 *
 * @extends Component
 */
class ClickableComponent extends Component {

  /**
   * Creates an instance of this class.
   *
   * @param  {Player} player
   *         The `Player` that this class should be attached to.
   *
   * @param  {Object} [options]
   *         The key/value store of player options.
   */
  constructor(player, options) {
    super(player, options);

    this.emitTapEvents();

    this.enable();
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
  createEl(tag = 'div', props = {}, attributes = {}) {
    props = assign({
      className: this.buildCSSClass(),
      tabIndex: 0
    }, props);

    if (tag === 'button') {
      log.error(`Creating a ClickableComponent with an HTML element of ${tag} is not supported; use a Button instead.`);
    }

    // Add ARIA attributes for clickable element which is not a native HTML button
    attributes = assign({
      'role': 'button',

      // let the screen reader user know that the text of the element may change
      'aria-live': 'polite'
    }, attributes);

    this.tabIndex_ = props.tabIndex;

    const el = super.createEl(tag, props, attributes);

    this.createControlTextEl(el);

    return el;
  }

  /**
   * Create a control text element on this `Component`
   *
   * @param {Element} [el]
   *        Parent element for the control text.
   *
   * @return {Element}
   *         The control text element that gets created.
   */
  createControlTextEl(el) {
    this.controlTextEl_ = Dom.createEl('span', {
      className: 'vjs-control-text'
    });

    if (el) {
      el.appendChild(this.controlTextEl_);
    }

    this.controlText(this.controlText_, el);

    return this.controlTextEl_;
  }

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
  controlText(text, el = this.el()) {
    if (!text) {
      return this.controlText_ || 'Need Text';
    }

    const localizedText = this.localize(text);

    this.controlText_ = text;
    this.controlTextEl_.innerHTML = localizedText;

    if (!this.nonIconControl) {
      // Set title attribute if only an icon is shown
      el.setAttribute('title', localizedText);
    }

    return this;
  }

  /**
   * Builds the default DOM `className`.
   *
   * @return {string}
   *         The DOM `className` for this object.
   */
  buildCSSClass() {
    return `vjs-control vjs-button ${super.buildCSSClass()}`;
  }

  /**
   * Enable this `Component`s element.
   *
   * @return {ClickableComponent}
   *         Returns itself; method can be chained.
   */
  enable() {
    this.removeClass('vjs-disabled');
    this.el_.setAttribute('aria-disabled', 'false');
    if (typeof this.tabIndex_ !== 'undefined') {
      this.el_.setAttribute('tabIndex', this.tabIndex_);
    }
    this.on('tap', this.handleClick);
    this.on('click', this.handleClick);
    this.on('focus', this.handleFocus);
    this.on('blur', this.handleBlur);
    return this;
  }

  /**
   * Disable this `Component`s element.
   *
   * @return {ClickableComponent}
   *         Returns itself; method can be chained.
   */
  disable() {
    this.addClass('vjs-disabled');
    this.el_.setAttribute('aria-disabled', 'true');
    if (typeof this.tabIndex_ !== 'undefined') {
      this.el_.removeAttribute('tabIndex');
    }
    this.off('tap', this.handleClick);
    this.off('click', this.handleClick);
    this.off('focus', this.handleFocus);
    this.off('blur', this.handleBlur);
    return this;
  }

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
  handleClick(event) {}

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
  handleFocus(event) {
    Events.on(document, 'keydown', Fn.bind(this, this.handleKeyPress));
  }

  /**
   * Called when this ClickableComponent has focus and a key gets pressed down. By
   * default it will call `this.handleClick` when the key is space or enter.
   *
   * @param {EventTarget~Event} event
   *        The `keydown` event that caused this function to be called.
   *
   * @listens keydown
   */
  handleKeyPress(event) {

    // Support Space (32) or Enter (13) key operation to fire a click event
    if (event.which === 32 || event.which === 13) {
      event.preventDefault();
      this.handleClick(event);
    } else if (super.handleKeyPress) {

      // Pass keypress handling up for unsupported keys
      super.handleKeyPress(event);
    }
  }

  /**
   * Called when a `ClickableComponent` loses focus. Turns off the listener for
   * `keydown` events. Which Stops `this.handleKeyPress` from getting called.
   *
   * @param {EventTarget~Event} event
   *        The `blur` event that caused this function to be called.
   *
   * @listens blur
   */
  handleBlur(event) {
    Events.off(document, 'keydown', Fn.bind(this, this.handleKeyPress));
  }
}

Component.registerComponent('ClickableComponent', ClickableComponent);
export default ClickableComponent;
