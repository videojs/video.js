// RESOLUTIONS
// Resolutions are selectable sources for alternate bitrate material
// Player Resolution Functions - Functions add to the player object for easier access to resolutions

vjs.Player.prototype.changeResolution = function(new_source, new_resolution){
    // has the exact same source been chosen?
    if (this.options_['resoution'] === new_resolution){
        this.trigger('resolutionchange');
        return this; // basically a no-op
    }

    this.pause();

    // remember our position in the current stream
    var curTime = this.currentTime();

    // reload the new tech and the new source (mostly used to re-fire
    // the events we want)
    this.src(new_source);
    

    // when the technology is re-started, kick off the new stream
    this.ready(function() {
      this.one('loadeddata', vjs.bind(this, function() {
        this.currentTime(curTime);
      }));
      this.trigger('resolutionchange');
      this.play();
      // remember this selection
      vjs.setLocalStorage('videojs_preferred_res', parseInt(new_source.index, 10));
    });
};

/* Resolution Menu Items
================================================================================ */
vjs.ResolutionMenuItem = function(player, options){
  // Modify options for parent MenuItem class's init.
  options['label'] = options.source['res'];

  this.source = options.source['src'];
  this.resolution = options.source['res'];

  goog.base(this, player, options);

  this.player_.one('loadstart', vjs.bind(this, this.update));
  this.player_.on('resolutionchange', vjs.bind(this, this.update));
};
goog.inherits(vjs.ResolutionMenuItem, vjs.MenuItem);

vjs.ResolutionMenuItem.prototype.onClick = function(){
  goog.base(this, 'onClick');
  this.player_.changeResolution(this.source, this.resolution);
};

vjs.ResolutionMenuItem.prototype.update = function(){
  var player = this.player_;
  if ((player.cache_['src'] === this.source)) {
    this.selected(true);
  } else {
    this.selected(false);
  }
};

/* Resolutions Button
================================================================================ */
vjs.ResolutionsButton = function(player, options) {
  goog.base(this, player, options);

  this.sourceResolutions_ = player.options_['sourceResolutions'];
  this.menu = this.createMenu();

  if (this.sourceResolutions_.length <= 1) {
    this.hide();
  }
  this.on('keyup', this.onKeyPress);
  this.el_.setAttribute('aria-haspopup',true);
  this.el_.setAttribute('role','button');
};
goog.inherits(vjs.ResolutionsButton, vjs.Button);

vjs.ResolutionsButton.prototype.kind_ = 'captions';
vjs.ResolutionsButton.prototype.buttonText = 'Resolutions';
vjs.ResolutionsButton.prototype.className = 'vjs-resolutions-button';

vjs.ResolutionsButton.prototype.createMenu = function() {
  var menu = new vjs.Menu(this.player_);

    // Add a title list item to the top
    menu.el_.appendChild(vjs.createEl('li', {
      className: 'vjs-menu-title',
      innerHTML: vjs.capitalize('resolutions'),
      tabindex: -1
    }));

    this.items = this.createItems();

    // Add menu items to the menu
    for (var i = 0; i < this.items.length; i++) {
      menu.addItem(this.items[i]);
    }

    // Add list to element
    this.addChild(menu);

    return menu;
};

vjs.ResolutionsButton.prototype.createItems = function(){
  var items = [];
  for (var i = 0; i < this.sourceResolutions_.length; i++) {
    items.push(new vjs.ResolutionMenuItem(this.player_, {
      'source': this.sourceResolutions_[i]
    }));
  }
  return items;
};

vjs.ResolutionsButton.prototype.buildCSSClass = function(){
  return this.className + ' vjs-menu-button ' + goog.base(this, 'buildCSSClass');
};

// Focus - Add keyboard functionality to element
vjs.ResolutionsButton.prototype.onFocus = function() {
  // This function is not needed anymore. Instead, the keyboard functionality is handled by
  // treating the button as triggering a submenu. When the button is pressed, the submenu
  // appears. Pressing the button again makes the submenu disappear.

  /*
  // Show the menu, and keep showing when the menu items are in focus
  this.menu.lockShowing();
  // this.menu.el_.style.display = 'block';

  // When tabbing through, the menu should hide when focus goes from the last menu item to the next tabbed element.
  vjs.one(this.menu.el_.childNodes[this.menu.el_.childNodes.length - 1], 'blur', vjs.bind(this, function(){
    this.menu.unlockShowing();
  }));
    */
};

// Can't turn off list display that we turned on with focus, because list would go away.
vjs.ResolutionsButton.prototype.onBlur = function() {};

vjs.ResolutionsButton.prototype.onClick = function(){
  // When you click the button it adds focus, which will show the menu indefinitely.
  // So we'll remove focus when the mouse leaves the button.
  // Focus is needed for tab navigation.
  this.one('mouseout', vjs.bind(this, function(){
    this.menu.unlockShowing();
    this.el_.blur();
  }));
  if (this.buttonPressed){
      this.unpressButton();
  } else {
      this.pressButton();
  }
};

vjs.ResolutionsButton.prototype.onKeyPress = function(event){
  // Check for space bar (32) or enter (13) keys
  if (event.which == 32 || event.which == 13) {
      event.preventDefault();
      if (this.buttonPressed){
          this.unpressButton();
      } else {
          this.pressButton();
      }
  }

  // Check for escape (27) key
  if (event.which == 27){
      event.preventDefault();
      if (this.buttonPressed){
          this.unpressButton();
      }
  }
};

vjs.ResolutionsButton.prototype.pressButton = function(){
    this.buttonPressed = true;
    this.menu.lockShowing();
    this.el_.setAttribute('aria-pressed',true);
    this.el_.children[1].children[0].focus(); // set the focus to the title of the submenu
};

vjs.ResolutionsButton.prototype.unpressButton = function(){
    this.buttonPressed = false;
    this.menu.unlockShowing();
    this.el_.setAttribute('aria-pressed',false);
};

// Add Button to controlBar
vjs.obj.merge(vjs.ControlBar.prototype.options_['children'], {
  'resolutionsButton': {}
});