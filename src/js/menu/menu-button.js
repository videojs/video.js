/**
 * @file menu-button.js
 */
import Button from '../button.js';
import Component from '../component.js';
import Menu from './menu.js';
import * as Dom from '../utils/dom.js';
import * as Fn from '../utils/fn.js';
import * as Events from '../utils/events.js';
import toTitleCase from '../utils/to-title-case.js';
import document from 'global/document';

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
    this.on(this.menuButton_, 'focus', this.handleFocus);
    this.on(this.menuButton_, 'blur', this.handleBlur);

    this.on('keydown', this.handleSubmenuKeyPress);
  }

  /**
   * Update the menu based on the current state of its items.
   */
  update() {
    const menu = this.createMenu();

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
      const title = Dom.createEl('li', {
        className: 'vjs-menu-title',
        innerHTML: toTitleCase(this.options_.title),
        tabIndex: -1
      });

      this.hideThreshold_ += 1;

      menu.children_.unshift(title);
      Dom.prependTo(title, menu.contentEl());
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
    // When you click the button it adds focus, which will show the menu.
    // So we'll remove focus when the mouse leaves the button. Focus is needed
    // for tab navigation.

    this.one(this.menu.contentEl(), 'mouseleave', Fn.bind(this, function(e) {
      this.unpressButton();
      this.el_.blur();
    }));
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
   * This gets called when a `MenuButton` gains focus via a `focus` event.
   * Turns on listening for `keydown` events. When they happen it
   * calls `this.handleKeyPress`.
   *
   * @param {EventTarget~Event} event
   *        The `focus` event that caused this function to be called.
   *
   * @listens focus
   */
  handleFocus() {
    Events.on(document, 'keydown', Fn.bind(this, this.handleKeyPress));
  }

  /**
   * Called when a `MenuButton` loses focus. Turns off the listener for
   * `keydown` events. Which Stops `this.handleKeyPress` from getting called.
   *
   * @param {EventTarget~Event} event
   *        The `blur` event that caused this function to be called.
   *
   * @listens blur
   */
  handleBlur() {
    Events.off(document, 'keydown', Fn.bind(this, this.handleKeyPress));
  }

  /**
   * Handle tab, escape, down arrow, and up arrow keys for `MenuButton`. See
   * {@link ClickableComponent#handleKeyPress} for instances where this is called.
   *
   * @param {EventTarget~Event} event
   *        The `keydown` event that caused this function to be called.
   *
   * @listens keydown
   */
  handleKeyPress(event) {

    // Escape (27) key or Tab (9) key unpress the 'button'
    if (event.which === 27 || event.which === 9) {
      if (this.buttonPressed_) {
        this.unpressButton();
      }
      // Don't preventDefault for Tab key - we still want to lose focus
      if (event.which !== 9) {
        event.preventDefault();
        // Set focus back to the menu button's button
        this.menuButton_.el_.focus();
      }
    // Up (38) key or Down (40) key press the 'button'
    } else if (event.which === 38 || event.which === 40) {
      if (!this.buttonPressed_) {
        this.pressButton();
        event.preventDefault();
      }
    }
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
  handleSubmenuKeyPress(event) {

    // Escape (27) key or Tab (9) key unpress the 'button'
    if (event.which === 27 || event.which === 9) {
      if (this.buttonPressed_) {
        this.unpressButton();
      }
      // Don't preventDefault for Tab key - we still want to lose focus
      if (event.which !== 9) {
        event.preventDefault();
        // Set focus back to the menu button's button
        this.menuButton_.el_.focus();
      }
    }
  }

  /**
   * Put the current `MenuButton` into a pressed state.
   */
  pressButton() {
    if (this.enabled_) {
      this.buttonPressed_ = true;
      this.menu.lockShowing();
      this.menuButton_.el_.setAttribute('aria-expanded', 'true');
      // set the focus into the submenu
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
