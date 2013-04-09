/* Menu
================================================================================ */
/**
 * The base for text track and settings menu buttons.
 * @param {vjs.Player|Object} player
 * @param {Object=} options
 * @constructor
 */
vjs.Menu = vjs.Component.extend({
  /** @constructor */
  init: function(player, options){
    vjs.Component.call(this, player, options);
  }
});

vjs.Menu.prototype.addItem = function(component){
  this.addChild(component);
  component.on('click', vjs.bind(this, function(){
    this.unlockShowing();
  }));
};

vjs.Menu.prototype.createEl = function(){
  return vjs.Component.prototype.createEl.call(this, 'ul', {
    className: 'vjs-menu'
  });
};

/**
 * Menu item
 * @param {vjs.Player|Object} player
 * @param {Object=} options
 * @constructor
 */
vjs.MenuItem = vjs.Button.extend({
  /** @constructor */
  init: function(player, options){
    vjs.Button.call(this, player, options);

    if (options['selected']) {
      this.addClass('vjs-selected');
      this.el_.setAttribute('aria-selected',true);
    } else {
      this.el_.setAttribute('aria-selected',false);
    }
  }
});

vjs.MenuItem.prototype.createEl = function(type, props){
  return vjs.Button.prototype.createEl.call(this, 'li', vjs.obj.merge({
    className: 'vjs-menu-item',
    innerHTML: this.options_['label']
  }, props));
};

vjs.MenuItem.prototype.onClick = function(){
  this.selected(true);
};

vjs.MenuItem.prototype.selected = function(selected){
  if (selected) {
    this.addClass('vjs-selected');
    this.el_.setAttribute('aria-selected',true);
  } else {
    this.removeClass('vjs-selected');
    this.el_.setAttribute('aria-selected',false);
  }
};