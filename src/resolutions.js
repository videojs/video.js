// RESOLUTIONS
// Resolutions are selectable sources for alternate bitrate material
// Player Resolution Functions - Functions add to the player object for easier access to resolutions
_V_.merge(_V_.Player.prototype, {

  showResolution: function(sourceResolutions){
    var currentSource = sourceResolutions[this.options.currentResolution],
        resolution = new _V_.Resolution(this, currentSource);

    this.ready(_V_.proxy(resolution, resolution.show));
  },

  changeResolution: function(id, disableSameKind){
    // TODO: do things...
//    this.trigger(kind+"trackchange");

    return this;
  }

});

// Resolution Class
_V_.Resolution = _V_.Component.extend({

  init: function(player, options){
    this._super(player, options);

    // Apply source info to resolution object
    // Options will be a source resolution object
    _V_.merge(this, {
      // Build ID if one doesn't exist
      id: options.id || ("vjs_resolution_" + _V_.guid++),

      src: options.src,

      // FIXME: should we honor default here?
      "default": options["default"], // 'default' is reserved-ish

      // the 'res' attribute doubles as the label
      label: options.res,

      // Mode describes if the resolution is showing, hidden, or disabled
      // const unsigned short OFF = 0;
      // const unsigned short HIDDEN = 1; (not visible - may be superfluous)
      // const unsigned short SHOWING = 2;
      // attribute unsigned short mode;
      mode: 0
    });
  },

  // Show: Mode Showing (2)
  // Indicates that the resolution is active.
  // This allows the user agent to override the state if a later resolution is discovered that is more appropriate per the user's preferences.
  show: function(){
    this.mode = 2;

    // Show element.
    this._super();
  },

  // FIXME: this hidden mode may not be necessary for resolutions
  // Hide: Mode Hidden (1)
  // Indicates that the resolution is active, but that the user agent is not actively displaying the resolution.
  // The user agent is maintaining a list of which resolutions are active, and events are being fired accordingly.
  hide: function(){
    this.mode = 1;

    // Hide element.
    this._super();
  },

  // Disable: Mode Off/Disable (0)
  // Indicates that the resolution is not active. Other than for the purposes of exposing the resolution in the DOM, the user agent is ignoring the resolution.
  // No events are fired.
  disable: function(){
    // If showing, hide.
    if (this.mode == 2) { this.hide(); }

    // Switch Mode to Off
    this.mode = 0;
  }
});

/* Resolution Menu Items
================================================================================ */
_V_.ResolutionMenuItem = _V_.MenuItem.extend({

  init: function(player, options){
    var source = this.source = options.source;

    // Modify options for parent MenuItem class's init.
    options.label = options.source.res;
    options.selected = options.source["default"];
    this._super(player, options);

    this.player.on("resolutionchange", _V_.proxy(this, this.update));
  },

  onClick: function(){
    this._super();
    this.player.changeResolution(this.source);
  },

  update: function(){
    if (this.source.mode == 2) {
      this.selected(true);
    } else {
      this.selected(false);
    }
  }

});

/* Resolutions Button
================================================================================ */
_V_.ResolutionsButton = _V_.Button.extend({

  init: function(player, options){
    this._super(player, options);

    this.menu = this.createMenu();

    if (this.items.length === 0) {
      this.hide();
    }
  },

  buttonText: "Resolutions",
  className: "vjs-resolutions-button",

  createMenu: function(){
    var menu = new _V_.Menu(this.player);

    // Add a title list item to the top
    menu.el.appendChild(_V_.createElement("li", {
      className: "vjs-menu-title",
      innerHTML: _V_.uc("resolutions")
    }));

    this.items = this.createItems();

    // Add menu items to the menu
    this.each(this.items, function(item){
      menu.addItem(item);
    });

    // Add list to element
    this.addComponent(menu);

    return menu;
  },

  // Create a menu item for each resolution
  createItems: function(){
    var items = [];
    this.each(this.player.options.sourceResolutions, function(source){
      items.push(new _V_.ResolutionMenuItem(this.player, {
        source: source
      }));
    });
    return items;
  },

  buildCSSClass: function(){
    return this.className + " vjs-menu-button " + this._super();
  },

  // Focus - Add keyboard functionality to element
  onFocus: function(){
    // Show the menu, and keep showing when the menu items are in focus
    this.menu.lockShowing();
    // this.menu.el.style.display = "block";

    // When tabbing through, the menu should hide when focus goes from the last menu item to the next tabbed element.
    _V_.one(this.menu.el.childNodes[this.menu.el.childNodes.length - 1], "blur", this.proxy(function(){
      this.menu.unlockShowing();
    }));
  },
  // Can't turn off list display that we turned on with focus, because list would go away.
  onBlur: function(){},

  onClick: function(){
    // When you click the button it adds focus, which will show the menu indefinitely.
    // So we'll remove focus when the mouse leaves the button.
    // Focus is needed for tab navigation.
    this.one("mouseout", this.proxy(function(){
      this.menu.unlockShowing();
      this.el.blur();
    }));
  }

});

// Add Button to controlBar
_V_.merge(_V_.ControlBar.prototype.options.components, {
  "resolutionsButton": {}
});
