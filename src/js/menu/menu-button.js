/**
 * @file menu-button.js
 */
import ClickableComponent from '../clickable-component.js';
import Component from '../component.js';
import Menu from './menu.js';
import * as Dom from '../utils/dom.js';
import * as Fn from '../utils/fn.js';
import toTitleCase from '../utils/to-title-case.js';

/**
 * A button class with a popup menu
 *
 * @param {Player|Object} player
 * @param {Object=} options
 * @extends Button
 * @class MenuButton
 */
class MenuButton extends ClickableComponent {

  constructor(player, options={}){
    super(player, options);

    this.update();

    this.enabled_ = true;

    this.el_.setAttribute('aria-haspopup', 'true');
    this.el_.setAttribute('role', 'menuitem');
    this.on('keydown', this.handleSubmenuKeyPress);
  }

  /**
   * Update menu
   *
   * @method update
   */
  update() {
    let menu = this.createMenu();

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
  }

  /**
   * Create menu
   *
   * @return {Menu} The constructed menu
   * @method createMenu
   */
  createMenu() {
    var menu = new Menu(this.player_);

    // Add a title list item to the top
    if (this.options_.title) {
      let title = Dom.createEl('li', {
        className: 'vjs-menu-title',
        innerHTML: toTitleCase(this.options_.title),
        tabIndex: -1
      });
      menu.children_.unshift(title);
      Dom.insertElFirst(title, menu.contentEl());
    }

    this.items = this['createItems']();

    if (this.items) {
      // Add menu items to the menu
      for (var i = 0; i < this.items.length; i++) {
        menu.addItem(this.items[i]);
      }
    }

    return menu;
  }

  /**
   * Create the list of menu items. Specific to each subclass.
   *
   * @method createItems
   */
  createItems(){}

  /**
   * Create the component's DOM element
   *
   * @return {Element}
   * @method createEl
   */
  createEl() {
    return super.createEl('div', {
      className: this.buildCSSClass()
    });
  }

  /**
   * Allow sub components to stack CSS class names
   *
   * @return {String} The constructed class name
   * @method buildCSSClass
   */
  buildCSSClass() {
    var menuButtonClass = 'vjs-menu-button';

    // If the inline option is passed, we want to use different styles altogether.
    if (this.options_.inline === true) {
      menuButtonClass += '-inline';
    } else {
      menuButtonClass += '-popup';
    }

    return `vjs-menu-button ${menuButtonClass} ${super.buildCSSClass()}`;
  }

  /**
   * When you click the button it adds focus, which
   * will show the menu indefinitely.
   * So we'll remove focus when the mouse leaves the button.
   * Focus is needed for tab navigation.
   * Allow sub components to stack CSS class names
   *
   * @method handleClick
   */
  handleClick() {
    this.one('mouseout', Fn.bind(this, function(){
      this.menu.unlockShowing();
      this.el_.blur();
    }));
    if (this.buttonPressed_){
      this.unpressButton();
    } else {
      this.pressButton();
    }
  }

  /**
   * Handle key press on menu
   *
   * @param {Object} event Key press event
   * @method handleKeyPress
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
      }
    // Up (38) key or Down (40) key press the 'button'
    } else if (event.which === 38 || event.which === 40) {
      if (!this.buttonPressed_) {
        this.pressButton();
        event.preventDefault();
      }
    } else {
      super.handleKeyPress(event);
    }
  }

  /**
   * Handle key press on submenu
   *
   * @param {Object} event Key press event
   * @method handleSubmenuKeyPress
   */
  handleSubmenuKeyPress(event) {

    // Escape (27) key or Tab (9) key unpress the 'button'
    if (event.which === 27 || event.which === 9){
      if (this.buttonPressed_){
        this.unpressButton();
      }
      // Don't preventDefault for Tab key - we still want to lose focus
      if (event.which !== 9) {
        event.preventDefault();
      }
    }
  }

  /**
   * Makes changes based on button pressed
   *
   * @method pressButton
   */
  pressButton() {
    if (this.enabled_) {
      this.buttonPressed_ = true;
      this.menu.lockShowing();
      this.el_.setAttribute('aria-expanded', 'true');
      this.menu.focus(); // set the focus into the submenu
    }
  }

  /**
   * Makes changes based on button unpressed
   *
   * @method unpressButton
   */
  unpressButton() {
    if (this.enabled_) {
      this.buttonPressed_ = false;
      this.menu.unlockShowing();
      this.el_.setAttribute('aria-expanded', 'false');
      this.el_.focus(); // Set focus back to this menu button
    }
  }

  /**
   * Disable the menu button
   *
   * @return {Component}
   * @method disable
   */
  disable() {
    // Unpress, but don't force focus on this button
    this.buttonPressed_ = false;
    this.menu.unlockShowing();
    this.el_.setAttribute('aria-expanded', 'false');

    this.enabled_ = false;

    return super.disable();
  }

  /**
   * Enable the menu button
   *
   * @return {Component}
   * @method disable
   */
  enable() {
    this.enabled_ = true;

    return super.enable();
  }
}

Component.registerComponent('MenuButton', MenuButton);
export default MenuButton;
