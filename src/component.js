/**
 * Player Component - Base class for all UI objects
 */

goog.provide('_V_.Component');

goog.require('_V_');

/**
 * Base UI Component class
 * @param {Object} player  Main Player
 * @param {Object=} options
 * @constructor
 */
_V_.Component = function(player, options, ready){
  this.player = player;

  // // Allow for overridding default component options
  options = this.options = _V_.merge(this.options || {}, options);

  // Get ID from options, element, or create using player ID and unique ID
  this.id_ = options.id || ((options.el && options.el.id) ? options.el.id : player.id + "_component_" + _V_.guid++);

  this.name_ = options.name || null;

  // Create element if one wasn't provided in potions
  this.el_ = (options.el) ? options.el : this.createEl();

  // Add any child components in options
  this.initChildren();

  this.ready(ready);
  // Don't want to trigger ready here or it will before init is actually
  // finished for all children that run this constructor
};

/**
 * Dispose of the component and all child components.
 */
_V_.Component.prototype.dispose = function(){
  // Dispose all children.
  if (this.children_) {
    for (var i = this.children_.length - 1; i >= 0; i--) {
      this.children_[i].dispose();
    };
  }

  // Delete child references
  this.children_ = null;
  this.childIndex_ = null;
  this.childNameIndex_ = null;

  // Remove all event listeners.
  this.off();

  // Remove element from DOM
  if (this.el_.parentNode) {
    this.el_.parentNode.removeChild(this.el_);
  }

  _V_.removeData(this.el_);
  this.el_ = null;
};

/**
 * Component options object.
 * @type {Object}
 * @private
 */
_V_.Component.prototype.options;

/**
 * The DOM element for the component.
 * @type {Element}
 * @private
 */
_V_.Component.prototype.el_;

/**
 * Create the component's DOM element.
 * @param  {String=} tagName  Element's node type. e.g. 'div'
 * @param  {Object=} attributes An object of element attributes that should be set on the element.
 * @return {Element}
 */
_V_.Component.prototype.createEl = function(tagName, attributes){
  return _V_.createEl(tagName, attributes);
};

/**
 * Return the component's DOM element.
 * @return {Element}
 */
_V_.Component.prototype.getEl = function(){
  return this.el_;
};

/**
 * The ID for the component.
 * @type {String}
 * @private
 */
_V_.Component.prototype.id_;

/**
 * Return the component's ID.
 * @return {String}
 */
_V_.Component.prototype.getId = function(){
  return this.id_;
};

/**
 * The name for the component. Often used to reference the component.
 * @type {String}
 * @private
 */
_V_.Component.prototype.name_;

/**
 * Return the component's ID.
 * @return {String}
 */
_V_.Component.prototype.getName = function(){
  return this.name_;
};

/**
 * Array of child components
 * @type {Array}
 * @private
 */
_V_.Component.prototype.children_;

/**
 * Returns array of all child components.
 * @return {Array}
 */
_V_.Component.prototype.getChildren = function(){
  return this.children_;
}

/**
 * Object of child components by ID
 * @type {Object}
 * @private
 */
_V_.Component.prototype.childIndex_;

/**
 * Returns a child component with the provided ID.
 * @return {Array}
 */
_V_.Component.prototype.getChildById = function(id){
  return this.childIndex_[id];
}

/**
 * Object of child components by Name
 * @type {Object}
 * @private
 */
_V_.Component.prototype.childNameIndex_;

/**
 * Returns a child component with the provided ID.
 * @return {Array}
 */
_V_.Component.prototype.getChild = function(name){
  return this.childNameIndex_[name];
}

/**
 * Adds a child component inside this component.
 * @param {String|_V_.Component} child The class name or instance of a child to add.
 * @param {Object=} options Optional options, including options to be passed to
 *  children of the child.
 * @return {_V_.Component} The child component, because it might be created in this process.
 * @suppress {accessControls|checkRegExp|checkTypes|checkVars|const|constantProperty|deprecated|duplicate|es5Strict|fileoverviewTags|globalThis|invalidCasts|missingProperties|nonStandardJsDocs|strictModuleDepCheck|undefinedNames|undefinedVars|unknownDefines|uselessCode|visibility}
 */
_V_.Component.prototype.addChild = function(child, options){
  var component, componentClass, componentName, componentId;

  // If string, create new component with options
  if (typeof child === "string") {

    componentName = child;

    // Make sure options is at least an empty object to protect against errors
    options = options || {};

    // Assume name of set is a lowercased name of the UI Class (PlayButton, etc.)
    componentClass = options.componentClass || _V_.capitalize(componentName);

    // Set name through options
    options.name = componentName;

    // Create a new object & element for this controls set
    // If there's no .player, this is a player
    // Closure Compiler throws an 'incomplete alias' warning if we use the _V_ variable directly.
    // Every class should be exported, so this should never be a problem here.
    component = new window['_V_'][componentClass](this.player || this, options);

  // child is a component instance
  } else {
    component = child;
  }

  componentName = component.getName();
  componentId = component.getId();

  this.children_ = this.children_ || [];
  this.childIndex_ = this.childNameIndex_ || {};
  this.childNameIndex_ = this.childNameIndex_ || {};

  this.children_.push(component);

  if (componentId) {
    this.childIndex_[componentId] = component;
  }

  if (componentName) {
    this.childNameIndex_[componentName] = component;
  }

  // Add the UI object's element to the container div (box)
  this.el_.appendChild(component.getEl());

  // Return so it can stored on parent object if desired.
  return component;
};

_V_.Component.prototype.removeChild = function(component){
  if (typeof component === 'string') {
    component = this.getChild(component);
  }

  if (!component || !this.children_) return;

  var childFound = false;
  for (var i = this.children_.length - 1; i >= 0; i--) {
    if (this.children_[i] === component) {
      childFound = true;
      this.children_.splice(i,1);
      break;
    }
  };

  if (!childFound) return;

  this.childIndex_[component.id] = null;
  this.childNameIndex_[component.name] = null;

  var compEl = component.getEl();
  if (compEl && compEl.parentNode === this.el_) {
    this.el_.removeChild(component.getEl());
  }
};

/**
 * Initialize default child components from options
 */
_V_.Component.prototype.initChildren = function(){
  var options = this.options;

  if (options && options.children) {
    var self = this;

    // Loop through components and add them to the player
    _V_.eachProp(options.children, function(name, opts){

      // Allow for disabling default components
      // e.g. _V_.options.components.posterImage = false
      if (opts === false) return;

      // Allow waiting to add components until a specific event is called
      var tempAdd = function(){
        // Set property name on player. Could cause conflicts with other prop names, but it's worth making refs easy.
        self[name] = self.addChild(name, opts);
      };

      if (opts.loadEvent) {
        // this.one(opts.loadEvent, tempAdd)
      } else {
        tempAdd();
      }
    });
  }
};

_V_.Component.prototype.buildCSSClass = function(){
    // Child classes can include a function that does:
    // return "CLASS NAME" + this._super();
    return "";
};

/* Events
============================================================================= */

/**
 * Add an event listener to this component's element. Context will be the component.
 * @param  {String}   type Event type e.g. 'click'
 * @param  {Function} fn   Event listener
 * @return {_V_.Component}
 */
_V_.Component.prototype.on = function(type, fn){
  _V_.on(this.el_, type, _V_.bind(this, fn));
  return this;
};

/**
 * Remove an event listener from the component's element
 * @param  {String=}   type Optional event type. Without type it will remove all listeners.
 * @param  {Function=} fn   Optional event listener. Without fn it will remove all listeners for a type.
 * @return {_V_.Component}
 */
_V_.Component.prototype.off = function(type, fn){
  _V_.off(this.el_, type, fn);
  return this;
};

/**
 * Add an event listener to be triggered only once and then removed
 * @param  {String}   type Event type
 * @param  {Function} fn   Event listener
 * @return {_V_.Component}
 */
_V_.Component.prototype.one = function(type, fn) {
  _V_.one(this.el_, type, _V_.bind(this, fn));
  return this;
};

/**
 * Trigger an event on an element
 * @param  {String} type  Event type to trigger
 * @param  {Event|Object} event Event object to be passed to the listener
 * @return {_V_.Component}
 */
_V_.Component.prototype.trigger = function(type, event){
  _V_.trigger(this.el_, type, event);
  return this;
};

/* Ready
================================================================================ */
/**
 * Is the component loaded.
 * @type {Boolean}
 * @private
 */
_V_.Component.prototype.isReady_;

/**
 * Trigger ready as soon as initialization is finished.
 *   Allows for delaying ready. Override on a sub class prototype.
 *   If you set this.isReadyOnInitFinish_ it will affect all components.
 *   Specially used when waiting for the Flash player to asynchrnously load.
 *   @type {Boolean}
 *   @private
 */
_V_.Component.prototype.isReadyOnInitFinish_ = true;

/**
 * List of ready listeners
 * @type {Array}
 * @private
 */
_V_.Component.prototype.readyQueue_;

/**
 * Bind a listener to the component's ready state.
 *   Different from event listeners in that if the ready event has already happend
 *   it will trigger the function immediately.
 * @param  {Function} fn Ready listener
 * @return {_V_.Component}
 */
_V_.Component.prototype.ready = function(fn){
  if (fn) {
    if (this.isReady_) {
      fn.call(this);
    } else {
      if (this.readyQueue_ === undefined) {
        this.readyQueue_ = [];
      }
      this.readyQueue_.push(fn);
    }
  }
  return this;
};

/**
 * Trigger the ready listeners
 * @return {_V_.Component}
 */
_V_.Component.prototype.triggerReady = function(){
  this.isReady_ = true;

  var readyQueue = this.readyQueue_;

  if (readyQueue && readyQueue.length > 0) {

    for (var i = 0, j = readyQueue.length; i < j; i++) {
      readyQueue[i].call(this)
    };

    // Reset Ready Queue
    this.readyQueue_ = [];

    // Allow for using event listeners also, in case you want to do something everytime a source is ready.
    this.trigger("ready");
  }
};

/* Display
============================================================================= */

/**
 * Add a CSS class name to the component's element
 * @param {String} classToAdd Classname to add
 * @return {_V_.Component}
 */
_V_.Component.prototype.addClass = function(classToAdd){
  _V_.addClass(this.el_, classToAdd);
  return this;
};

/**
 * Remove a CSS class name from the component's element
 * @param {String} classToRemove Classname to remove
 * @return {_V_.Component}
 */
_V_.Component.prototype.removeClass = function(classToRemove){
  _V_.removeClass(this.el_, classToRemove);
  return this;
};

/**
 * Show the component element if hidden
 * @return {_V_.Component}
 */
_V_.Component.prototype.show = function(){
  this.el_.style.display = "block";
  return this;
};

/**
 * Hide the component element if hidden
 * @return {_V_.Component}
 */
_V_.Component.prototype.hide = function(){
  this.el_.style.display = "none";
  return this;
};

/**
 * Fade a component in using CSS
 * @return {_V_.Component}
 */
_V_.Component.prototype.fadeIn = function(){
  this.removeClass("vjs-fade-out");
  this.addClass("vjs-fade-in");
  return this;
};

/**
 * Fade a component out using CSS
 * @return {_V_.Component}
 */
_V_.Component.prototype.fadeOut = function(){
  this.removeClass("vjs-fade-in");
  this.addClass("vjs-fade-out");
  return this;
};

/**
 * Lock an item in its visible state. To be used with fadeIn/fadeOut.
 * @return {_V_.Component}
 */
_V_.Component.prototype.lockShowing = function(){
  var style = this.el_.style;
  style.display = "block";
  style.opacity = 1;
  style.visiblity = "visible";
  return this;
};

/**
 * Unlock an item to be hidden. To be used with fadeIn/fadeOut.
 * @return {_V_.Component}
 */
_V_.Component.prototype.unlockShowing = function(){
  var style = this.el.style;
  style.display = "";
  style.opacity = "";
  style.visiblity = "";
  return this;
};

/**
 * If a value is provided it will change the width of the player to that value
 * otherwise the width is returned
 * http://dev.w3.org/html5/spec/dimension-attributes.html#attr-dim-height
 * Video tag width/height only work in pixels. No percents.
 * But allowing limited percents use. e.g. width() will return number+%, not computed width
 * @param  {Number|String=} num   Optional width number
 * @param  {[type]} skipListeners Skip the 'resize' event trigger
 * @return {_V_.Component|Number|String} Returns 'this' if dimension was set.
 *   Otherwise it returns the dimension.
 */
_V_.Component.prototype.width = function(num, skipListeners){
  return this.dimension("width", num, skipListeners);
};

/**
 * Get or set the height of the player
 * @param  {Number|String=} num     Optional new player height
 * @param  {Boolean=} skipListeners Optional skip resize event trigger
 * @return {_V_.Component|Number|String} The player, or the dimension
 */
_V_.Component.prototype.height = function(num, skipListeners){
  return this.dimension("height", num, skipListeners);
};

/**
 * Set both width and height at the same time.
 * @param  {Number|String} width
 * @param  {Number|String} height
 * @return {_V_.Component}   The player.
 */
_V_.Component.prototype.dimensions = function(width, height){
  // Skip resize listeners on width for optimization
  return this.width(width, true).height(height);
};

/**
 * Get or set width or height.
 * All for an integer, integer + 'px' or integer + '%';
 * Known issue: hidden elements. Hidden elements officially have a width of 0.
 * So we're defaulting to the style.width value and falling back to computedStyle
 * which has the hidden element issue.
 * Info, but probably not an efficient fix:
 * http://www.foliotek.com/devblog/getting-the-width-of-a-hidden-element-with-jquery-using-width/
 * @param  {String=} widthOrHeight 'width' or 'height'
 * @param  {Number|String=} num           New dimension
 * @param  {Boolean=} skipListeners Skip resize event trigger
 * @return {vjs.Component|Number|String} Return the player if setting a dimension.
 *                                         Otherwise it returns the dimension.
 */
_V_.Component.prototype.dimension = function(widthOrHeight, num, skipListeners){
  if (num !== undefined) {

    // Check if using css width/height (% or px) and adjust
    if ((""+num).indexOf("%") !== -1 || (""+num).indexOf("px") !== -1) {
      this.el_.style[widthOrHeight] = num;
    } else {
      this.el_.style[widthOrHeight] = num+"px";
    }

    // skipListeners allows us to avoid triggering the resize event when setting both width and height
    if (!skipListeners) { this.trigger("resize"); }

    // Return component
    return this;
  }

  // Not setting a value, so getting it
  // Make sure element exists
  if (!this.el_) return 0;

  // Get dimension value from style
  var val = this.el_.style[widthOrHeight];
  var pxIndex = val.indexOf("px");
  if (pxIndex !== -1) {
    // Return the pixel value with no 'px'
    return parseInt(val.slice(0,pxIndex), 10);

  // No px so using % or no style was set, so falling back to offsetWidth/height
  // If component has display:none, offset will return 0
  // TODO: handle display:none and no dimension style using px
  } else {

    return parseInt(this.el_['offset'+_V_.capitalize(widthOrHeight)], 10);

    // ComputedStyle version.
    // Only difference is if the element is hidden it will return
    // the percent value (e.g. '100%'')
    // instead of zero like offsetWidth returns.
    // var val = _V_.getComputedStyleValue(this.el_, widthOrHeight);
    // var pxIndex = val.indexOf("px");

    // if (pxIndex !== -1) {
    //   return val.slice(0, pxIndex);
    // } else {
    //   return val;
    // }
  }
};

// /* Utility
// ================================================================================ */
// _V_.Component.prototype.each = function(arr, fn){ _V_.each.call(this, arr, fn); };

// _V_.Component.prototype.eachProp = function(obj, fn){ _V_.eachProp.call(this, obj, fn); };

// _V_.Component.prototype.extend = function(obj){ _V_.merge(this, obj) };

// // More easily attach 'this' to functions
// _V_.Component.prototype.proxy = function(fn, uid){  return _V_.proxy(this, fn, uid); };
