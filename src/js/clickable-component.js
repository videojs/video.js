/**
 * @file button.js
 */
import Component from './component';
import * as Dom from './utils/dom.js';
import * as Events from './utils/events.js';
import * as Fn from './utils/fn.js';
import log from './utils/log.js';
import document from 'global/document';
import assign from 'object.assign';

/**
 * Clickable Component which is clickable or keyboard actionable, but is not a native HTML button
 *
 * @param {Object} player  Main Player
 * @param {Object=} options Object of option names and values
 * @extends Component
 * @class ClickableComponent
 */
class ClickableComponent extends Component {

  constructor(player, options) {
    super(player, options);

    this.emitTapEvents();

    this.enable();
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
   * create control text
   *
   * @param {Element} el Parent element for the control text
   * @return {Element}
   * @method controlText
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
   * Controls text - both request and localize
   *
   * @param {String}  text Text for element
   * @param {Element=} el Element to set the title on
   * @return {String}
   * @method controlText
   */
  controlText(text, el = this.el()) {
    if (!text) {
      return this.controlText_ || 'Need Text';
    }

    const localizedText = this.localize(text);

    this.controlText_ = text;
    this.controlTextEl_.innerHTML = localizedText;
    el.setAttribute('title', localizedText);

    return this;
  }

  /**
   * Allows sub components to stack CSS class names
   *
   * @return {String}
   * @method buildCSSClass
   */
  buildCSSClass() {
    return `vjs-control vjs-button ${super.buildCSSClass()}`;
  }

  /**
   * Enable the component element
   *
   * @return {Component}
   * @method enable
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
   * Disable the component element
   *
   * @return {Component}
   * @method disable
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
   * Handle Click - Override with specific functionality for component
   *
   * @method handleClick
   */
  handleClick() {}

  /**
   * Handle Focus - Add keyboard functionality to element
   *
   * @method handleFocus
   */
  handleFocus() {
    Events.on(document, 'keydown', Fn.bind(this, this.handleKeyPress));
  }

  /**
   * Handle KeyPress (document level) - Trigger click when Space or Enter key is pressed
   *
   * @method handleKeyPress
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
   * Handle Blur - Remove keyboard triggers
   *
   * @method handleBlur
   */
  handleBlur() {
    Events.off(document, 'keydown', Fn.bind(this, this.handleKeyPress));
  }
}

Component.registerComponent('ClickableComponent', ClickableComponent);
export default ClickableComponent;
