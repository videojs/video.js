/**
 * @file clickable-component.js
 */
import Component from './component';
import * as Dom from './utils/dom.js';
import log from './utils/log.js';
import {assign} from './utils/obj';
import keycode from 'keycode';

/**
 * Component which is clickable or keyboard actionable, but is not a
 * native HTML button.
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
   *
   * @param  {function} [options.clickHandler]
   *         The function to call when the button is clicked / activated
   */
  constructor(player, options) {
    super(player, options);

    this.handleMouseOver_ = (e) => this.handleMouseOver(e);
    this.handleMouseOut_ = (e) => this.handleMouseOut(e);
    this.handleClick_ = (e) => this.handleClick(e);
    this.handleKeyDown_ = (e) => this.handleKeyDown(e);

    this.emitTapEvents();

    this.enable();
  }

  /**
   * Create the `ClickableComponent`s DOM element.
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
      role: 'button'
    }, attributes);

    this.tabIndex_ = props.tabIndex;

    const el = Dom.createEl(tag, props, attributes);

    el.appendChild(Dom.createEl('span', {
      className: 'vjs-icon-placeholder'
    }, {
      'aria-hidden': true
    }));

    this.createControlTextEl(el);

    return el;
  }

  dispose() {
    // remove controlTextEl_ on dispose
    this.controlTextEl_ = null;

    super.dispose();
  }

  /**
   * Create a control text element on this `ClickableComponent`
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
    }, {
      // let the screen reader user know that the text of the element may change
      'aria-live': 'polite'
    });

    if (el) {
      el.appendChild(this.controlTextEl_);
    }

    this.controlText(this.controlText_, el);

    return this.controlTextEl_;
  }

  /**
   * Get or set the localize text to use for the controls on the `ClickableComponent`.
   *
   * @param {string} [text]
   *        Control text for element.
   *
   * @param {Element} [el=this.el()]
   *        Element to set the title on.
   *
   * @return {string}
   *         - The control text when getting
   */
  controlText(text, el = this.el()) {
    if (text === undefined) {
      return this.controlText_ || 'Need Text';
    }

    const localizedText = this.localize(text);

    this.controlText_ = text;
    Dom.textContent(this.controlTextEl_, localizedText);
    if (!this.nonIconControl && !this.player_.options_.noUITitleAttributes) {
      // Set title attribute if only an icon is shown
      el.setAttribute('title', localizedText);
    }
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
   * Enable this `ClickableComponent`
   */
  enable() {
    if (!this.enabled_) {
      this.enabled_ = true;
      this.removeClass('vjs-disabled');
      this.el_.setAttribute('aria-disabled', 'false');
      if (typeof this.tabIndex_ !== 'undefined') {
        this.el_.setAttribute('tabIndex', this.tabIndex_);
      }
      this.on(['tap', 'click'], this.handleClick_);
      this.on('keydown', this.handleKeyDown_);
    }
  }

  /**
   * Disable this `ClickableComponent`
   */
  disable() {
    this.enabled_ = false;
    this.addClass('vjs-disabled');
    this.el_.setAttribute('aria-disabled', 'true');
    if (typeof this.tabIndex_ !== 'undefined') {
      this.el_.removeAttribute('tabIndex');
    }
    this.off('mouseover', this.handleMouseOver_);
    this.off('mouseout', this.handleMouseOut_);
    this.off(['tap', 'click'], this.handleClick_);
    this.off('keydown', this.handleKeyDown_);
  }

  /**
   * Handles language change in ClickableComponent for the player in components
   *
   *
   */
  handleLanguagechange() {
    this.controlText(this.controlText_);
  }

  /**
   * Event handler that is called when a `ClickableComponent` receives a
   * `click` or `tap` event.
   *
   * @param {EventTarget~Event} event
   *        The `tap` or `click` event that caused this function to be called.
   *
   * @listens tap
   * @listens click
   * @abstract
   */
  handleClick(event) {
    if (this.options_.clickHandler) {
      this.options_.clickHandler.call(this, arguments);
    }
  }

  /**
   * Event handler that is called when a `ClickableComponent` receives a
   * `keydown` event.
   *
   * By default, if the key is Space or Enter, it will trigger a `click` event.
   *
   * @param {EventTarget~Event} event
   *        The `keydown` event that caused this function to be called.
   *
   * @listens keydown
   */
  handleKeyDown(event) {

    // Support Space or Enter key operation to fire a click event. Also,
    // prevent the event from propagating through the DOM and triggering
    // Player hotkeys.
    if (keycode.isEventKey(event, 'Space') || keycode.isEventKey(event, 'Enter')) {
      event.preventDefault();
      event.stopPropagation();
      this.trigger('click');
    } else {

      // Pass keypress handling up for unsupported keys
      super.handleKeyDown(event);
    }
  }
}

Component.registerComponent('ClickableComponent', ClickableComponent);
export default ClickableComponent;
