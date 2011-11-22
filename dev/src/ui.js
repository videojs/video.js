(function(){var initializing=false, fnTest=/xyz/.test(function(){xyz;}) ? /\b_super\b/ : /.*/; _V_.Class = function(){}; _V_.Class.extend = function(prop) { var _super = this.prototype; initializing = true; var prototype = new this(); initializing = false; for (var name in prop) { prototype[name] = typeof prop[name] == "function" && typeof _super[name] == "function" && fnTest.test(prop[name]) ? (function(name, fn){ return function() { var tmp = this._super; this._super = _super[name]; var ret = fn.apply(this, arguments); this._super = tmp; return ret; }; })(name, prop[name]) : prop[name]; } function Class() { if ( !initializing && this.init ) this.init.apply(this, arguments); } Class.prototype = prototype; Class.constructor = Class; Class.extend = arguments.callee; return Class;};})();

// bar.playToggle = new _V_.PlayToggle(player, options);

/* UI Component- Base class for all UI objects
================================================================================ */
_V_.UIComponent = _V_.Class.extend({
  init: function(player, options){
    this.player = player;

    // Array of sub-components
    this.components = [];
  },
  createElement: function(){},
  destroy: function(){},

  // Add child components to this component.
  // Will generate a new child component and then append child component's element to this component's element.
  // Takes either the name of the UI component class, or an object that contains a name, UI Class, and options.
  addComponent: function(nameORobject){
    var name, uiClass, options, component;

    if (typeof set == "string") {
      name = nameORobj;

      // Assume name of set is a lowercased name of the UI Class (PlayButton, etc.)
      uiClass = _V_.capitalize(nameORobj);

    // Can also pass in object to define a different class than the name and add other options
    } else {
      name = nameORobj.name;
      uiClass = nameORobj.uiClass;
      options = nameORobj.options;
    }

    // Create a new object & element for this controls set
    component = this.ui[name] = new _V_[uiClass](this);

    // Add the UI object's element to the container div (box)
    this.el.appendChild(component.el);
  },

  show: function(){
    this.el.style.display = "block";
  },

  hide: function(){
    this.el.style.display = "none";
  }
});

/* Button - Base class for all buttons
================================================================================ */
_V_.Button = _V_.UIComponent.extend({

  init: function(player, options){

    this.player = player;
    this.el = this.createElement();

    _V_.addEvent(this.el, "click", _V_.proxy(this, this.onClick));
    _V_.addEvent(this.el, "focus", _V_.proxy(this, this.onFocus));
    _V_.addEvent(this.el, "blur", _V_.proxy(this, this.onBlur));

    this._super(player, options);
  },

  createElement: function(type, options){
    _V_.merge({
      role: "button",
      tabIndex: 0
    }, options || {})
    return _V_.createElement(type || "div", options);
  },

  // Click - Override with specific functionality for button
  onClick: function(){},

  // Focus - Add keyboard functionality to element
  onFocus: function(){
    _V_.addEvent(document, "keyup", _V_.proxy(this, this.onKeyPress));
  },

  // KeyPress (document level) - Trigger click when keys are pressed
  onKeyPress: function(event){
    // Check for space bar (32) or enter (13) keys
    if (event.which == 32 || event.which == 13) {
      event.preventDefault();
      this.onClick();
    }
  },

  // Blur - Remove keyboard triggers
  onBlur: function(){
     _V_.removeEvent(document, "keyup", _V_.proxy(this, this.onKeyPress));
  }

});

/* Play Button
================================================================================ */
_V_.PlayButton = _V_.Button.extend({

  createElement: function(){
    return this._super("div", {
      className: "vjs-play-button vjs-control",
      innerHTML: '<div><span class="vjs-control-text">Play</span></div>'
    });
  },

  onClick: function(){
    this.player.play();
  }

});

/* Pause Button
================================================================================ */
_V_.PauseButton = _V_.Button.extend({

  createElement: function(){
    return this._super("div", {
      className: "vjs-pause-button vjs-control",
      innerHTML: '<div><span class="vjs-control-text">Pause</span></div>'
    });
  },

  onClick: function(){
    this.player.pause();
  }

});

/* Play Toggle - Play or Pause Media
================================================================================ */
_V_.PlayToggle = _V_.Button.extend({

  init: function(player, options){

    player.addEvent("play", _V_.proxy(this, this.onPlay));
    player.addEvent("pause", _V_.proxy(this, this.onPause));

    return this._super(player, options);
  },

  createElement: function(){
    return this._super("div", {
      className: "vjs-play-control vjs-control",
      innerHTML: '<div><span class="vjs-control-text">Play</span></div>'
    });
  },

  // OnClick - Toggle between play and pause
  onClick: function(){
    if (this.player.paused()) {
      this.player.play();
    } else {
      this.player.pause();
    }
  },

  // OnPlay - Add the vjs-playing class to the element so it can change appearance
  onPlay: function(){
    _V_.removeClass(this.el, "vjs-paused");
    _V_.addClass(this.el, "vjs-playing");
  },

  // OnPause - Add the vjs-paused class to the element so it can change appearance
  onPause: function(){
    _V_.removeClass(this.el, "vjs-playing");
    _V_.addClass(this.el, "vjs-paused");
  }

});


/* Fullscreen Toggle Behaviors
================================================================================ */
_V_.FullscreenToggle = _V_.Button.extend({

  createElement: function(){
    return this._super("div", {
      className: "vjs-fullscreen-control vjs-control",
      innerHTML: '<div><span class="vjs-control-text">Fullscreen</span></div>'
    });
  },

  onClick: function(){
    if (!this.player.videoIsFullScreen) {
      this.player.enterFullScreen();
    } else {
      this.player.exitFullScreen();
    }
  }
});

/* Big Play Button
================================================================================ */
_V_.BigPlayButton = _V_.Button.extend({
  init: function(player){

    player.addEvent("play", _V_.proxy(this, this.hide));
    player.addEvent("ended", _V_.proxy(this, this.show));

    return this._super(player);
  },

  createElement: function(){
    return this._super("div", {
      className: "vjs-big-play-button",
      innerHTML: "<span></span>"
    });
  },

  onClick: function(){
    this.player.play();
  }
});

/* Control Bar
================================================================================ */
_V_.ControlBar = _V_.UIComponent.extend({
  init: function(player, options){
    this.player = player;
    this.el = this.createElement();
    this.children = [];

    player.addEvent("mouseover", _V_.proxy(this, this.show));
    player.addEvent("mouseout", _V_.proxy(this, this.hide));

    _V_.each(options.children, function(child){
      this.appendUI(child)
    });

    var pt = this.children["playToggle"] = new _V_.PlayToggle(player);
    this.el.appendChild(pt.el);

    var ft = this.children["fullscreenToggle"] = new _V_.FullscreenToggle(player);
    this.el.appendChild(ft.el);
  },

  createElement: function(){
    return _V_.createElement("div", {
      className: "vjs-controls"
    });
  },

  appendUI: function(name){
    var component = this.children[name] = new _V_.PlayToggle(player);
    this.el.appendChild(pt.el);
  },

  show: function(){
    // Used for transitions (fading out)
    this.el.style.opacity = 1;
    // bar.style.display = "block";
  },
  hide: function(){
    this.el.style.opacity = 0;
    // bar.style.display = "none";
  }
});