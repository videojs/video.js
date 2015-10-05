/**
 * @file menu-button.js
 */
import Button from '../button.js';
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
class MenuButton extends Button {

  constructor(player, options={}){
    super(player, options);

    this.update();

    this.on('keydown', this.handleKeyPress);
    this.el_.setAttribute('aria-haspopup', true);
    this.el_.setAttribute('role', 'button');
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
      menu.contentEl().appendChild(Dom.createEl('li', {
        className: 'vjs-menu-title',
        innerHTML: toTitleCase(this.options_.title),
        tabIndex: -1
      }));
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
   * Focus - Add keyboard functionality to element
   * This function is not needed anymore. Instead, the
   * keyboard functionality is handled by
   * treating the button as triggering a submenu.
   * When the button is pressed, the submenu
   * appears. Pressing the button again makes
   * the submenu disappear.
   *
   * @method handleFocus
   */
  handleFocus() {}

  /**
   * Can't turn off list display that we turned
   * on with focus, because list would go away.
   *
   * @method handleBlur
   */
  handleBlur() {}

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
   * @param {Object} Key press event
   * @method handleKeyPress
   */
  handleKeyPress(event) {

    // Check for space bar (32) or enter (13) keys
    if (event.which === 32 || event.which === 13) {
      if (this.buttonPressed_){
        this.unpressButton();
      } else {
        this.pressButton();
      }
      event.preventDefault();
    // Check for escape (27) key
    } else if (event.which === 27){
      if (this.buttonPressed_){
        this.unpressButton();
      }
      event.preventDefault();
    }
  }

  /**
   * Makes changes based on button pressed
   *
   * @method pressButton
   */
  pressButton() {
    this.buttonPressed_ = true;
    this.menu.lockShowing();
    this.el_.setAttribute('aria-pressed', true);
    if (this.items && this.items.length > 0) {
      this.items[0].el().focus(); // set the focus to the title of the submenu
    }
  }

  /**
   * Makes changes based on button unpressed
   *
   * @method unpressButton
   */
  unpressButton() {
    this.buttonPressed_ = false;
    this.menu.unlockShowing();
    this.el_.setAttribute('aria-pressed', false);
  }
}

Component.registerComponent('MenuButton', MenuButton);
export default MenuButton;
