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

/**
 * Resolution Class
 * Contains resolution methods for loading and parsing of resoltuions
 * @param {vjs.Player|Object} player
 * @param {Object=} options
 * @constructor
 */
vjs.Resolution = function(player, options, ready){
  goog.base(this, player, options, ready);

  // Apply resolution info to resolution object
  // Options will often be a resolution element

  // Build ID if one doesn't exist
  this.id_ = options['id'] || ('vjs_' + options['kind'] + '_' + options['language'] + '_' + vjs.guid++);
  this.src_ = options['src'];
  // 'default' is a reserved keyword in js so we use an abbreviated version
  this.dflt_ = options['default'] || options['dflt'];
  this.title_ = options['title'];
  this.label_ = options['label'];
};
goog.inherits(vjs.Resolution, vjs.Component);

/**
 * Resoltuion kind value.
 * @private
 */
vjs.Resolution.prototype.kind_;

/**
 * Get the track kind value
 * @return {String}
 */
vjs.Resolution.prototype.kind = function(){
  return this.kind_;
};

/**
 * Resolution src value
 * @private
 */
vjs.Resolution.prototype.src_;

/**
 * Get the resolution src value
 * @return {String}
 */
vjs.Resolution.prototype.src = function(){
  return this.src_;
};

/**
 * Resolution default value
 * If default is used, resoltuion to show
 * @private
 */
vjs.Resolution.prototype.dflt_;

/**
 * Get the resoltuion default value
 * 'default' is a reserved keyword
 * @return {Boolean}
 */
vjs.Resolution.prototype.dflt = function(){
  return this.dflt_;
};

/**
 * Resoltuion title value
 * @private
 */
vjs.TextTrack.prototype.title_;

/**
 * Get the resolution title value
 * @return {String}
 */
vjs.TextTrack.prototype.title = function(){
  return this.title_;
};

/* Resolution Menu Items
================================================================================ */
vjs.ResolutionMenuItem = function(player, options){
  // Modify options for parent MenuItem class's init.
  options['label'] = options.source['data-res'];

  this.source = options.source['src'];
  this.resolution = options.source['data-res'];

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
vjs.ResolutionButton = function(player, options) {
  goog.base(this, player, options);

  this.sourceResolutions_ = player.options_['sourceResolutions'];
  var resolutions = this.sourceResolutions_ || [];
  this.menu = this.createMenu();

  if (resolutions.length <= 1) {
    this.hide();
  }
  this.on('keyup', this.onKeyPress);
  this.el_.setAttribute('aria-haspopup',true);
  this.el_.setAttribute('role','button');
};
goog.inherits(vjs.ResolutionButton, vjs.Button);

vjs.ResolutionButton.prototype.buttonPressed = false;

vjs.ResolutionButton.prototype.createMenu = function() {
  var menu = new vjs.Menu(this.player_);

    // Add a title list item to the top
    menu.el_.appendChild(vjs.createEl('li', {
      className: 'vjs-menu-title',
      innerHTML: vjs.capitalize(this.kind_),
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

vjs.ResolutionButton.prototype.createItems = function(){
  var resolutions = this.sourceResolutions_ || [];
  var items = [];
  for (var i = 0; i < resolutions.length; i++) {
    items.push(new vjs.ResolutionMenuItem(this.player_, {
      'source': this.sourceResolutions_[i]
    }));
  }
  return items;
};

vjs.ResolutionButton.prototype.buildCSSClass = function(){
  return this.className + ' vjs-menu-button ' + goog.base(this, 'buildCSSClass');
};

// Focus - Add keyboard functionality to element
vjs.ResolutionButton.prototype.onFocus = function() {
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
vjs.ResolutionButton.prototype.onBlur = function() {};

vjs.ResolutionButton.prototype.onClick = function(){
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

vjs.ResolutionButton.prototype.onKeyPress = function(event){
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

vjs.ResolutionButton.prototype.pressButton = function(){
    this.buttonPressed = true;
    this.menu.lockShowing();
    this.el_.setAttribute('aria-pressed',true);
    this.el_.children[1].children[0].focus(); // set the focus to the title of the submenu
};

vjs.ResolutionButton.prototype.unpressButton = function(){
    this.buttonPressed = false;
    this.menu.unlockShowing();
    this.el_.setAttribute('aria-pressed',false);
};

/**
 * @constructor
 */
vjs.ResolutionsButton = function(player, options, ready){
  goog.base(this, player, options, ready);
  this.el_.setAttribute('aria-label','Resolutions Menu');
};
goog.inherits(vjs.ResolutionsButton, vjs.ResolutionButton);
vjs.ResolutionsButton.prototype.kind_ = 'resolutions';
vjs.ResolutionsButton.prototype.buttonText = 'Resolutions';
vjs.ResolutionsButton.prototype.className = 'vjs-resolutions-button';

// Add Button to controlBar
vjs.obj.merge(vjs.ControlBar.prototype.options_['children'], {
  'resolutionsButton': {}
});