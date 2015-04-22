import Button from '../button.js';
import Menu from './menu.js';
import * as Lib from '../lib.js';

/**
 * A button class with a popup menu
 * @param {Player|Object} player
 * @param {Object=} options
 * @constructor
 */
class MenuButton extends Button {

  constructor(player, options){
    super(player, options);

    this.update();

    this.on('keydown', this.onKeyPress);
    this.el_.setAttribute('aria-haspopup', true);
    this.el_.setAttribute('role', 'button');
  }

  update() {
    let menu = this.createMenu();

    if (this.menu) {
      this.removeChild(this.menu);
    }

    this.menu = menu;
    this.addChild(menu);

    /**
     * Track the state of the menu button
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

  createMenu() {
    var menu = new Menu(this.player_);

    // Add a title list item to the top
    if (this.options().title) {
      menu.contentEl().appendChild(Lib.createEl('li', {
        className: 'vjs-menu-title',
        innerHTML: Lib.capitalize(this.options().title),
        tabindex: -1
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
   */
  createItems(){}

  /** @inheritDoc */
  buildCSSClass() {
    return `${this.className} vjs-menu-button ${super.buildCSSClass()}`;
  }

  // Focus - Add keyboard functionality to element
  // This function is not needed anymore. Instead, the keyboard functionality is handled by
  // treating the button as triggering a submenu. When the button is pressed, the submenu
  // appears. Pressing the button again makes the submenu disappear.
  onFocus() {}

  // Can't turn off list display that we turned on with focus, because list would go away.
  onBlur() {}

  onClick() {
    // When you click the button it adds focus, which will show the menu indefinitely.
    // So we'll remove focus when the mouse leaves the button.
    // Focus is needed for tab navigation.
    this.one('mouseout', Lib.bind(this, function(){
      this.menu.unlockShowing();
      this.el_.blur();
    }));
    if (this.buttonPressed_){
      this.unpressButton();
    } else {
      this.pressButton();
    }
  }

  onKeyPress(event) {

    // Check for space bar (32) or enter (13) keys
    if (event.which == 32 || event.which == 13) {
      if (this.buttonPressed_){
        this.unpressButton();
      } else {
        this.pressButton();
      }
      event.preventDefault();
    // Check for escape (27) key
    } else if (event.which == 27){
      if (this.buttonPressed_){
        this.unpressButton();
      }
      event.preventDefault();
    }
  }

  pressButton() {
    this.buttonPressed_ = true;
    this.menu.lockShowing();
    this.el_.setAttribute('aria-pressed', true);
    if (this.items && this.items.length > 0) {
      this.items[0].el().focus(); // set the focus to the title of the submenu
    }
  }

  unpressButton() {
    this.buttonPressed_ = false;
    this.menu.unlockShowing();
    this.el_.setAttribute('aria-pressed', false);
  }
}

Button.registerComponent('MenuButton', MenuButton);
export default MenuButton;
