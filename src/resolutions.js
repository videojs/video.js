// RESOLUTIONS
// Resolutions are selectable sources for alternate bitrate material
// Player Resolution Functions - Functions add to the player object for easier access to resolutions
_V_.merge(_V_.Player.prototype, {
  // fired when a stream is chosen from the resolution menu
  changeResolution: function(new_source){
    var success = this.proxy(function(){
      this.trigger("resolutionchange");
    });

    // has the exact same source been chosen?
    if (this.values.src === new_source.src){
        success();
        return this; // basically a no-op
    }

    this.pause();

    // remember our position in the current stream
    var curTime = this.currentTime();

    // reload the new tech and the new source (mostly used to re-fire
    // the events we want)
    this.loadTech(this.techName, {src: new_source.src});

    // fired *after* ready - when the video is ready to seek
    this.one("loadeddata", _V_.proxy(this, function(){
      // seek to the remembered position in the last stream
      this.currentTime(curTime);

      success();
    }));

    // when the technology is re-started, kick off the new stream
    this.ready(this.proxy(function(){
      this.play();

      // remember this selection
      _V_.setLocalStorage("videojs_preferred_res", parseInt(new_source.index, 10));
    }));

    return this;
  }

});

/* Resolution Menu Items
================================================================================ */
_V_.ResolutionMenuItem = _V_.MenuItem.extend({

  init: function(player, options){
    var source = this.source = options.source;

    // Modify options for parent MenuItem class's init.
    options.label = options.source.res;

    this._super(player, options);

    // set initial 'default' selection
    this.player.one("loadstart", _V_.proxy(this, this.update));

    // set selection on successfull change
    this.player.on("resolutionchange", _V_.proxy(this, this.update));
  },

  onClick: function(){
    this._super();
    this.player.changeResolution(this.source);

    // need to manually blur to get rid of focus css pseudoclass on
    // the chosen item
    this.el.blur();
  },

  // fired initially when the video is loaded and when the resolution
  // changes
  update: function(){
    // are we the current video source?
    if (this.player.values.src === this.source.src){
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

    if (player.options.sources.length <= 1) {
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
