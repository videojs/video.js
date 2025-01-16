/**
 * @file button.js
 */
import ClickableComponent from './clickable-component.js';
import Component from './component';
import log from './utils/log.js';
import {createEl} from './utils/dom.js';

/**
 * Base class for all buttons.
 *
 * @extends ClickableComponent
 */
class Button extends ClickableComponent {
  /**
   * Create the `Button`s DOM element.
   *
   * @param {string} [tag="button"]
   *        The element's node type. Always creates a `button`.
   *
   * @param {Object} [props={}]
   *        An object of properties to set on the element.
   *
   * @param {Object} [attributes={}]
   *        An object of attributes to set on the element.
   *
   * @return {Element}
   *         The created DOM element.
   */
  createEl(tag, props = {}, attributes = {}) {
    tag = 'button'; // Override to always be 'button'.

    props = Object.assign(
      {
        className: this.buildCSSClass(),
      },
      props
    );

    attributes = Object.assign(
      {
        type: 'button', // Default "button" type to avoid "submit".
      },
      attributes
    );

    const el = createEl(tag, props, attributes);

    if (!this.player_.options_.experimentalSvgIcons) {
      el.appendChild(
        this.createIconPlaceholder()
      );
    }

    this.createControlTextEl(el);

    return el;
  }

  /**
   * Create a placeholder icon element.
   *
   * @return {Element}
   *         The placeholder span element.
   */
  createIconPlaceholder() {
    return createEl(
      'span',
      { className: 'vjs-icon-placeholder' },
      { 'aria-hidden': true }
    );
  }

  /**
   * Add a child `Component` to this `Button`.
   *
   * @param {string|Component} child
   *        The name or instance of a child to add.
   *
   * @param {Object} [options={}]
   *        Options to pass to the child.
   *
   * @return {Component}
   *         The `Component` added as a child.
   *
   * @deprecated since version 5
   */
  addChild(child, options = {}) {
    const className = this.constructor.name;

    log.warn(
      `Adding an actionable (user-controllable) child to a Button (${className}) is not supported; use a ClickableComponent instead.`
    );

    // Call the parent implementation to prevent method error.
    return Component.prototype.addChild.call(this, child, options);
  }

  /**
   * Enable the `Button` element, making it clickable.
   */
  enable() {
    super.enable();
    if (this.el_) {
      this.el_.removeAttribute('disabled');
    }
  }

  /**
   * Disable the `Button` element, preventing interaction.
   */
  disable() {
    super.disable();
    if (this.el_) {
      this.el_.setAttribute('disabled', 'disabled');
    }
  }

  /**
   * Handle the `keydown` event when the `Button` has focus.
   *
   * @param {KeyboardEvent} event
   *        The triggered `keydown` event.
   */
  handleKeyDown(event) {
    // Let the browser handle Enter and Space keys for buttons.
    if (event.key === ' ' || event.key === 'Enter') {
      event.stopPropagation();
      return;
    }

    // Fallback to the parent keydown handler for other keys.
    super.handleKeyDown(event);
  }
}

// Register the `Button` class with the `Component` registry.
Component.registerComponent('Button', Button);

export default Button;
