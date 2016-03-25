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

    this.on('tap', this.handleClick);
    this.on('click', this.handleClick);
    this.on('focus', this.handleFocus);
    this.on('blur', this.handleBlur);
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
  createEl(tag='div', props={}, attributes={}) {
    props = assign({
      className: this.buildCSSClass(),
      tabIndex: 0
    }, props);

    if (tag === 'button') {
      log.error(`Creating a ClickableComponent with an HTML element of ${tag} is not supported; use a Button instead.`);
    }

    // Add ARIA attributes for clickable element which is not a native HTML button
    attributes = assign({
      role: 'button',
      'aria-live': 'polite' // let the screen reader user know that the text of the element may change
    }, attributes);

    let el = super.createEl(tag, props, attributes);

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

    this.controlText(this.controlText_);

    return this.controlTextEl_;
  }

  /**
   * Controls text - both request and localize
   *
   * @param {String} text Text for element
   * @return {String}
   * @method controlText
   */
  controlText(text) {
    if (!text) return this.controlText_ || 'Need Text';

    this.controlText_ = text;
    this.controlTextEl_.innerHTML = this.localize(this.controlText_);

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
   * Adds a child component inside this clickable-component
   *
   * @param {String|Component} child The class name or instance of a child to add
   * @param {Object=} options Options, including options to be passed to children of the child.
   * @return {Component} The child component (created by this process if a string was used)
   * @method addChild
   */
  addChild(child, options={}) {
    // TODO: Fix adding an actionable child to a ClickableComponent; currently
    // it will cause issues with assistive technology (e.g. screen readers)
    // which support ARIA, since an element with role="button" cannot have
    // actionable child elements.

    //let className = this.constructor.name;
    //log.warn(`Adding a child to a ClickableComponent (${className}) can cause issues with assistive technology which supports ARIA, since an element with role="button" cannot have actionable child elements.`);

    return super.addChild(child, options);
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
      super.handleKeyPress(event); // Pass keypress handling up for unsupported keys
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
