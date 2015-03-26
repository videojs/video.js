import Button from './button';
import Component from './component';
import * as Lib from './lib';
import * as Events from './events';

/* Menu
================================================================================ */
/**
 * The Menu component is used to build pop up menus, including subtitle and
 * captions selection menus.
 *
 * @param {vjs.Player|Object} player
 * @param {Object=} options
 * @class
 * @constructor
 */
let Menu = Component.extend();

/**
 * Add a menu item to the menu
 * @param {Object|String} component Component or component type to add
 */
Menu.prototype.addItem = function(component){
  this.addChild(component);
  component.on('click', Lib.bind(this, function(){
    this.unlockShowing();
  }));
};

/** @inheritDoc */
Menu.prototype.createEl = function(){
  let contentElType = this.options().contentElType || 'ul';
  this.contentEl_ = Lib.createEl(contentElType, {
    className: 'vjs-menu-content'
  });
  var el = Component.prototype.createEl.call(this, 'div', {
    append: this.contentEl_,
    className: 'vjs-menu'
  });
  el.appendChild(this.contentEl_);

  // Prevent clicks from bubbling up. Needed for Menu Buttons,
  // where a click on the parent is significant
  Events.on(el, 'click', function(event){
    event.preventDefault();
    event.stopImmediatePropagation();
  });

  return el;
};

/**
 * The component for a menu item. `<li>`
 *
 * @param {vjs.Player|Object} player
 * @param {Object=} options
 * @class
 * @constructor
 */
var MenuItem = Button.extend({
  /** @constructor */
  init: function(player, options){
    Button.call(this, player, options);
    this.selected(options['selected']);
  }
});

/** @inheritDoc */
MenuItem.prototype.createEl = function(type, props){
  return Button.prototype.createEl.call(this, 'li', Lib.obj.merge({
    className: 'vjs-menu-item',
    innerHTML: this.localize(this.options_['label'])
  }, props));
};

/**
 * Handle a click on the menu item, and set it to selected
 */
MenuItem.prototype.onClick = function(){
  this.selected(true);
};

/**
 * Set this menu item as selected or not
 * @param  {Boolean} selected
 */
MenuItem.prototype.selected = function(selected){
  if (selected) {
    this.addClass('vjs-selected');
    this.el_.setAttribute('aria-selected',true);
  } else {
    this.removeClass('vjs-selected');
    this.el_.setAttribute('aria-selected',false);
  }
};


/**
 * A button class with a popup menu
 * @param {vjs.Player|Object} player
 * @param {Object=} options
 * @constructor
 */
var MenuButton = Button.extend({
  /** @constructor */
  init: function(player, options){
    Button.call(this, player, options);

    this.update();

    this.on('keydown', this.onKeyPress);
    this.el_.setAttribute('aria-haspopup', true);
    this.el_.setAttribute('role', 'button');
  }
});

MenuButton.prototype.update = function() {
  let menu = this.createMenu();

  if (this.menu) {
    this.removeChild(this.menu);
  }

  this.menu = menu;
  this.addChild(menu);

  if (this.items && this.items.length === 0) {
    this.hide();
  } else if (this.items && this.items.length > 1) {
    this.show();
  }
};

/**
 * Track the state of the menu button
 * @type {Boolean}
 * @private
 */
MenuButton.prototype.buttonPressed_ = false;

MenuButton.prototype.createMenu = function(){
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
};

/**
 * Create the list of menu items. Specific to each subclass.
 */
MenuButton.prototype.createItems = function(){};

/** @inheritDoc */
MenuButton.prototype.buildCSSClass = function(){
  return this.className + ' vjs-menu-button ' + Button.prototype.buildCSSClass.call(this);
};

// Focus - Add keyboard functionality to element
// This function is not needed anymore. Instead, the keyboard functionality is handled by
// treating the button as triggering a submenu. When the button is pressed, the submenu
// appears. Pressing the button again makes the submenu disappear.
MenuButton.prototype.onFocus = function(){};
// Can't turn off list display that we turned on with focus, because list would go away.
MenuButton.prototype.onBlur = function(){};

MenuButton.prototype.onClick = function(){
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
};

MenuButton.prototype.onKeyPress = function(event){

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
};

MenuButton.prototype.pressButton = function(){
  this.buttonPressed_ = true;
  this.menu.lockShowing();
  this.el_.setAttribute('aria-pressed', true);
  if (this.items && this.items.length > 0) {
    this.items[0].el().focus(); // set the focus to the title of the submenu
  }
};

MenuButton.prototype.unpressButton = function(){
  this.buttonPressed_ = false;
  this.menu.unlockShowing();
  this.el_.setAttribute('aria-pressed', false);
};

Component.registerComponent('Menu', Menu);
Component.registerComponent('MenuButton', MenuButton);
Component.registerComponent('MenuItem', MenuItem);

export default Menu;
export { MenuItem, MenuButton };
