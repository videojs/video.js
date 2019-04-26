/**
 * @file menu-button.js
 */
import Button from '../button.js';
import Component from '../component.js';
import Menu from './menu.js';
import * as Dom from '../utils/dom.js';
import toTitleCase from '../utils/to-title-case.js';
import { IS_IOS } from '../utils/browser.js';
import keycode from 'keycode';

/**
 * A `MenuButton` class for any popup {@link Menu}.
 *
 * @extends Component
 */
class MenuButton extends Component {

  /**
   * Creates an instance of this class.
   *
   * @param {Player} player
   *        The `Player` that this class should be attached to.
   *
   * @param {Object} [options={}]
   *        The key/value store of player options.
   */
  constructor(player, options = {}) {
    super(player, options);

    this.menuButton_ = new Button(player, options);

    this.menuButton_.controlText(this.controlText_);
    this.menuButton_.el_.setAttribute('aria-haspopup', 'true');

    // Add buildCSSClass values to the button, not the wrapper
    const buttonClass = Button.prototype.buildCSSClass();

    this.menuButton_.el_.className = this.buildCSSClass() + ' ' + buttonClass;
    this.menuButton_.removeClass('vjs-control');

    this.addChild(this.menuButton_);

    this.update();

    this.enabled_ = true;

    this.on(this.menuButton_, 'tap', this.handleClick);
    this.on(this.menuButton_, 'click', this.handleClick);
    this.on(this.menuButton_, 'keydown', this.handleKeyDown);
    this.on(this.menuButton_, 'mouseenter', () => {
      this.menu.show();
    });

    this.on('keydown', this.handleSubmenuKeyDown);
  }

  /**
   * Update the menu based on the current state of its items.
   */
  update() {
    const menu = this.createMenu();

    if (this.menu) {
      this.menu.dispose();
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
    this.menuButton_.el_.setAttribute('aria-expanded', 'false');

    if (this.items && this.items.length <= this.hideThreshold_) {
      this.hide();
    } else {
      this.show();
    }
  }

  /**
   * Create the menu and add all items to it.
   *
   * @return {Menu}
   *         The constructed menu
   */
  createMenu() {
    const menu = new Menu(this.player_, { menuButton: this });

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
      const titleEl = Dom.createEl('li', {
        className: 'vjs-menu-title',
        innerHTML: toTitleCase(this.options_.title),
        tabIndex: -1
      });

      this.hideThreshold_ += 1;

      const titleComponent = new Component(this.player_, {el: titleEl});

      menu.addItem(titleComponent);
    }

    this.items = this.createItems();

    if (this.items) {
      // Add menu items to the menu
      for (let i = 0; i < this.items.length; i++) {
        menu.addItem(this.items[i]);
      }
    }

    return menu;
  }

  /**
   * Create the list of menu items. Specific to each subclass.
   *
   * @abstract
   */
  createItems() {}

  /**
   * Create the `MenuButtons`s DOM element.
   *
   * @return {Element}
   *         The element that gets created.
   */
  createEl() {
    return super.createEl('div', {
      className: this.buildWrapperCSSClass()
    }, {
    });
  }

  /**
   * Allow sub components to stack CSS class names for the wrapper element
   *
   * @return {string}
   *         The constructed wrapper DOM `className`
   */
  buildWrapperCSSClass() {
    let menuButtonClass = 'vjs-menu-button';

    // If the inline option is passed, we want to use different styles altogether.
    if (this.options_.inline === true) {
      menuButtonClass += '-inline';
    } else {
      menuButtonClass += '-popup';
    }

    // TODO: Fix the CSS so that this isn't necessary
    const buttonClass = Button.prototype.buildCSSClass();

    return `vjs-menu-button ${menuButtonClass} ${buttonClass} ${super.buildCSSClass()}`;
  }

  /**
   * Builds the default DOM `className`.
   *
   * @return {string}
   *         The DOM `className` for this object.
   */
  buildCSSClass() {
    let menuButtonClass = 'vjs-menu-button';

    // If the inline option is passed, we want to use different styles altogether.
    if (this.options_.inline === true) {
      menuButtonClass += '-inline';
    } else {
      menuButtonClass += '-popup';
    }

    return `vjs-menu-button ${menuButtonClass} ${super.buildCSSClass()}`;
  }

  /**
   * Get or set the localized control text that will be used for accessibility.
   *
   * > NOTE: This will come from the internal `menuButton_` element.
   *
   * @param {string} [text]
   *        Control text for element.
   *
   * @param {Element} [el=this.menuButton_.el()]
   *        Element to set the title on.
   *
   * @return {string}
   *         - The control text when getting
   */
  controlText(text, el = this.menuButton_.el()) {
    return this.menuButton_.controlText(text, el);
  }

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
  handleClick(event) {
    if (this.buttonPressed_) {
      this.unpressButton();
    } else {
      this.pressButton();
    }
  }

  /**
   * Set the focus to the actual button, not to this element
   */
  focus() {
    this.menuButton_.focus();
  }

  /**
   * Remove the focus from the actual button, not this element
   */
  blur() {
    this.menuButton_.blur();
  }

  /**
   * Handle tab, escape, down arrow, and up arrow keys for `MenuButton`. See
   * {@link ClickableComponent#handleKeyDown} for instances where this is called.
   *
   * @param {EventTarget~Event} event
   *        The `keydown` event that caused this function to be called.
   *
   * @listens keydown
   */
  handleKeyDown(event) {

    // Escape or Tab unpress the 'button'
    if (keycode.isEventKey(event, 'Esc') || keycode.isEventKey(event, 'Tab')) {
      if (this.buttonPressed_) {
        this.unpressButton();
      }

      // Don't preventDefault for Tab key - we still want to lose focus
      if (!keycode.isEventKey(event, 'Tab')) {
        event.preventDefault();
        // Set focus back to the menu button's button
        this.menuButton_.focus();
      }
    // Up Arrow or Down Arrow also 'press' the button to open the menu
    } else if (keycode.isEventKey(event, 'Up') || keycode.isEventKey(event, 'Down')) {
      if (!this.buttonPressed_) {
        event.preventDefault();
        this.pressButton();
      }
    }
  }

  /**
   * This method name now delegates to `handleSubmenuKeyDown`. This means
   * anyone calling `handleSubmenuKeyPress` will not see their method calls
   * stop working.
   *
   * @param {EventTarget~Event} event
   *        The event that caused this function to be called.
   */
  handleSubmenuKeyPress(event) {
    this.handleSubmenuKeyDown(event);
  }

  /**
   * Handle a `keydown` event on a sub-menu. The listener for this is added in
   * the constructor.
   *
   * @param {EventTarget~Event} event
   *        Key press event
   *
   * @listens keydown
   */
  handleSubmenuKeyDown(event) {
    // Escape or Tab unpress the 'button'
    if (keycode.isEventKey(event, 'Esc') || keycode.isEventKey(event, 'Tab')) {
      if (this.buttonPressed_) {
        this.unpressButton();
      }
      // Don't preventDefault for Tab key - we still want to lose focus
      if (!keycode.isEventKey(event, 'Tab')) {
        event.preventDefault();
        // Set focus back to the menu button's button
        this.menuButton_.focus();
      }
    } else {
      // NOTE: This is a special case where we don't pass unhandled
      //  keydown events up to the Component handler, because it is
      //  just entending the keydown handling of the `MenuItem`
      //  in the `Menu` which already passes unused keys up.
    }
  }

  /**
   * Put the current `MenuButton` into a pressed state.
   */
  pressButton() {
    if (this.enabled_) {
      this.buttonPressed_ = true;
      this.menu.show();
      this.menu.lockShowing();
      this.menuButton_.el_.setAttribute('aria-expanded', 'true');

      // set the focus into the submenu, except on iOS where it is resulting in
      // undesired scrolling behavior when the player is in an iframe
      if (IS_IOS && Dom.isInFrame()) {
        // Return early so that the menu isn't focused
        return;
      }

      this.menu.focus();
    }
  }

  /**
   * Take the current `MenuButton` out of a pressed state.
   */
  unpressButton() {
    if (this.enabled_) {
      this.buttonPressed_ = false;
      this.menu.unlockShowing();
      this.menu.hide();
      this.menuButton_.el_.setAttribute('aria-expanded', 'false');
    }
  }

  /**
   * Disable the `MenuButton`. Don't allow it to be clicked.
   */
  disable() {
    this.unpressButton();

    this.enabled_ = false;
    this.addClass('vjs-disabled');

    this.menuButton_.disable();
  }

  /**
   * Enable the `MenuButton`. Allow it to be clicked.
   */
  enable() {
    this.enabled_ = true;
    this.removeClass('vjs-disabled');

    this.menuButton_.enable();
  }
}

Component.registerComponent('MenuButton', MenuButton);
export default MenuButton;
