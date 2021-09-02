/**
 * Player Component - Base class for all UI objects
 *
 * @file component.js
 */
import window from 'global/window';
import evented from './mixins/evented';
import stateful from './mixins/stateful';
import * as Dom from './utils/dom.js';
import * as Fn from './utils/fn.js';
import * as Guid from './utils/guid.js';
import {toTitleCase, toLowerCase} from './utils/string-cases.js';
import mergeOptions from './utils/merge-options.js';
import computedStyle from './utils/computed-style';
import Map from './utils/map.js';
import Set from './utils/set.js';

/**
 * Base class for all UI Components.
 * Components are UI objects which represent both a javascript object and an element
 * in the DOM. They can be children of other components, and can have
 * children themselves.
 *
 * Components can also use methods from {@link EventTarget}
 */
class Component {

  /**
   * A callback that is called when a component is ready. Does not have any
   * paramters and any callback value will be ignored.
   *
   * @callback Component~ReadyCallback
   * @this Component
   */

  /**
   * Creates an instance of this class.
   *
   * @param {Player} player
   *        The `Player` that this class should be attached to.
   *
   * @param {Object} [options]
   *        The key/value store of player options.
   *
   * @param {Object[]} [options.children]
   *        An array of children objects to intialize this component with. Children objects have
   *        a name property that will be used if more than one component of the same type needs to be
   *        added.
   *
   * @param {Component~ReadyCallback} [ready]
   *        Function that gets called when the `Component` is ready.
   */
  constructor(player, options, ready) {

    // The component might be the player itself and we can't pass `this` to super
    if (!player && this.play) {
      this.player_ = player = this; // eslint-disable-line
    } else {
      this.player_ = player;
    }

    this.isDisposed_ = false;

    // Hold the reference to the parent component via `addChild` method
    this.parentComponent_ = null;

    // Make a copy of prototype.options_ to protect against overriding defaults
    this.options_ = mergeOptions({}, this.options_);

    // Updated options with supplied options
    options = this.options_ = mergeOptions(this.options_, options);

    // Get ID from options or options element if one is supplied
    this.id_ = options.id || (options.el && options.el.id);

    // If there was no ID from the options, generate one
    if (!this.id_) {
      // Don't require the player ID function in the case of mock players
      const id = player && player.id && player.id() || 'no_player';

      this.id_ = `${id}_component_${Guid.newGUID()}`;
    }

    this.name_ = options.name || null;

    // Create element if one wasn't provided in options
    if (options.el) {
      this.el_ = options.el;
    } else if (options.createEl !== false) {
      this.el_ = this.createEl();
    }

    // if evented is anything except false, we want to mixin in evented
    if (options.evented !== false) {
      // Make this an evented object and use `el_`, if available, as its event bus
      evented(this, {eventBusKey: this.el_ ? 'el_' : null});

      this.handleLanguagechange = this.handleLanguagechange.bind(this);
      this.on(this.player_, 'languagechange', this.handleLanguagechange);
    }
    stateful(this, this.constructor.defaultState);

    this.children_ = [];
    this.childIndex_ = {};
    this.childNameIndex_ = {};

    this.setTimeoutIds_ = new Set();
    this.setIntervalIds_ = new Set();
    this.rafIds_ = new Set();
    this.namedRafs_ = new Map();
    this.clearingTimersOnDispose_ = false;

    // Add any child components in options
    if (options.initChildren !== false) {
      this.initChildren();
    }

    // Don't want to trigger ready here or it will go before init is actually
    // finished for all children that run this constructor
    this.ready(ready);

    if (options.reportTouchActivity !== false) {
      this.enableTouchActivity();
    }

  }

  /**
   * Dispose of the `Component` and all child components.
   *
   * @fires Component#dispose
   */
  dispose() {

    // Bail out if the component has already been disposed.
    if (this.isDisposed_) {
      return;
    }

    if (this.readyQueue_) {
      this.readyQueue_.length = 0;
    }

    /**
     * Triggered when a `Component` is disposed.
     *
     * @event Component#dispose
     * @type {EventTarget~Event}
     *
     * @property {boolean} [bubbles=false]
     *           set to false so that the dispose event does not
     *           bubble up
     */
    this.trigger({type: 'dispose', bubbles: false});

    this.isDisposed_ = true;

    // Dispose all children.
    if (this.children_) {
      for (let i = this.children_.length - 1; i >= 0; i--) {
        if (this.children_[i].dispose) {
          this.children_[i].dispose();
        }
      }
    }

    // Delete child references
    this.children_ = null;
    this.childIndex_ = null;
    this.childNameIndex_ = null;

    this.parentComponent_ = null;

    if (this.el_) {
      // Remove element from DOM
      if (this.el_.parentNode) {
        this.el_.parentNode.removeChild(this.el_);
      }

      this.el_ = null;
    }

    // remove reference to the player after disposing of the element
    this.player_ = null;
  }

  /**
   * Determine whether or not this component has been disposed.
   *
   * @return {boolean}
   *         If the component has been disposed, will be `true`. Otherwise, `false`.
   */
  isDisposed() {
    return Boolean(this.isDisposed_);
  }

  /**
   * Return the {@link Player} that the `Component` has attached to.
   *
   * @return {Player}
   *         The player that this `Component` has attached to.
   */
  player() {
    return this.player_;
  }

  /**
   * Deep merge of options objects with new options.
   * > Note: When both `obj` and `options` contain properties whose values are objects.
   *         The two properties get merged using {@link module:mergeOptions}
   *
   * @param {Object} obj
   *        The object that contains new options.
   *
   * @return {Object}
   *         A new object of `this.options_` and `obj` merged together.
   */
  options(obj) {
    if (!obj) {
      return this.options_;
    }

    this.options_ = mergeOptions(this.options_, obj);
    return this.options_;
  }

  /**
   * Get the `Component`s DOM element
   *
   * @return {Element}
   *         The DOM element for this `Component`.
   */
  el() {
    return this.el_;
  }

  /**
   * Create the `Component`s DOM element.
   *
   * @param {string} [tagName]
   *        Element's DOM node type. e.g. 'div'
   *
   * @param {Object} [properties]
   *        An object of properties that should be set.
   *
   * @param {Object} [attributes]
   *        An object of attributes that should be set.
   *
   * @return {Element}
   *         The element that gets created.
   */
  createEl(tagName, properties, attributes) {
    return Dom.createEl(tagName, properties, attributes);
  }

  /**
   * Localize a string given the string in english.
   *
   * If tokens are provided, it'll try and run a simple token replacement on the provided string.
   * The tokens it looks for look like `{1}` with the index being 1-indexed into the tokens array.
   *
   * If a `defaultValue` is provided, it'll use that over `string`,
   * if a value isn't found in provided language files.
   * This is useful if you want to have a descriptive key for token replacement
   * but have a succinct localized string and not require `en.json` to be included.
   *
   * Currently, it is used for the progress bar timing.
   * ```js
   * {
   *   "progress bar timing: currentTime={1} duration={2}": "{1} of {2}"
   * }
   * ```
   * It is then used like so:
   * ```js
   * this.localize('progress bar timing: currentTime={1} duration{2}',
   *               [this.player_.currentTime(), this.player_.duration()],
   *               '{1} of {2}');
   * ```
   *
   * Which outputs something like: `01:23 of 24:56`.
   *
   *
   * @param {string} string
   *        The string to localize and the key to lookup in the language files.
   * @param {string[]} [tokens]
   *        If the current item has token replacements, provide the tokens here.
   * @param {string} [defaultValue]
   *        Defaults to `string`. Can be a default value to use for token replacement
   *        if the lookup key is needed to be separate.
   *
   * @return {string}
   *         The localized string or if no localization exists the english string.
   */
  localize(string, tokens, defaultValue = string) {

    const code = this.player_.language && this.player_.language();
    const languages = this.player_.languages && this.player_.languages();
    const language = languages && languages[code];
    const primaryCode = code && code.split('-')[0];
    const primaryLang = languages && languages[primaryCode];

    let localizedString = defaultValue;

    if (language && language[string]) {
      localizedString = language[string];
    } else if (primaryLang && primaryLang[string]) {
      localizedString = primaryLang[string];
    }

    if (tokens) {
      localizedString = localizedString.replace(/\{(\d+)\}/g, function(match, index) {
        const value = tokens[index - 1];
        let ret = value;

        if (typeof value === 'undefined') {
          ret = match;
        }

        return ret;
      });
    }

    return localizedString;
  }

  /**
   * Handles language change for the player in components. Should be overriden by sub-components.
   *
   * @abstract
   */
  handleLanguagechange() {}

  /**
   * Return the `Component`s DOM element. This is where children get inserted.
   * This will usually be the the same as the element returned in {@link Component#el}.
   *
   * @return {Element}
   *         The content element for this `Component`.
   */
  contentEl() {
    return this.contentEl_ || this.el_;
  }

  /**
   * Get this `Component`s ID
   *
   * @return {string}
   *         The id of this `Component`
   */
  id() {
    return this.id_;
  }

  /**
   * Get the `Component`s name. The name gets used to reference the `Component`
   * and is set during registration.
   *
   * @return {string}
   *         The name of this `Component`.
   */
  name() {
    return this.name_;
  }

  /**
   * Get an array of all child components
   *
   * @return {Array}
   *         The children
   */
  children() {
    return this.children_;
  }

  /**
   * Returns the child `Component` with the given `id`.
   *
   * @param {string} id
   *        The id of the child `Component` to get.
   *
   * @return {Component|undefined}
   *         The child `Component` with the given `id` or undefined.
   */
  getChildById(id) {
    return this.childIndex_[id];
  }

  /**
   * Returns the child `Component` with the given `name`.
   *
   * @param {string} name
   *        The name of the child `Component` to get.
   *
   * @return {Component|undefined}
   *         The child `Component` with the given `name` or undefined.
   */
  getChild(name) {
    if (!name) {
      return;
    }

    return this.childNameIndex_[name];
  }

  /**
   * Returns the descendant `Component` following the givent
   * descendant `names`. For instance ['foo', 'bar', 'baz'] would
   * try to get 'foo' on the current component, 'bar' on the 'foo'
   * component and 'baz' on the 'bar' component and return undefined
   * if any of those don't exist.
   *
   * @param {...string[]|...string} names
   *        The name of the child `Component` to get.
   *
   * @return {Component|undefined}
   *         The descendant `Component` following the given descendant
   *         `names` or undefined.
   */
  getDescendant(...names) {
    // flatten array argument into the main array
    names = names.reduce((acc, n) => acc.concat(n), []);

    let currentChild = this;

    for (let i = 0; i < names.length; i++) {
      currentChild = currentChild.getChild(names[i]);

      if (!currentChild || !currentChild.getChild) {
        return;
      }
    }

    return currentChild;
  }

  /**
   * Add a child `Component` inside the current `Component`.
   *
   *
   * @param {string|Component} child
   *        The name or instance of a child to add.
   *
   * @param {Object} [options={}]
   *        The key/value store of options that will get passed to children of
   *        the child.
   *
   * @param {number} [index=this.children_.length]
   *        The index to attempt to add a child into.
   *
   * @return {Component}
   *         The `Component` that gets added as a child. When using a string the
   *         `Component` will get created by this process.
   */
  addChild(child, options = {}, index = this.children_.length) {
    let component;
    let componentName;

    // If child is a string, create component with options
    if (typeof child === 'string') {
      componentName = toTitleCase(child);

      const componentClassName = options.componentClass || componentName;

      // Set name through options
      options.name = componentName;

      // Create a new object & element for this controls set
      // If there's no .player_, this is a player
      const ComponentClass = Component.getComponent(componentClassName);

      if (!ComponentClass) {
        throw new Error(`Component ${componentClassName} does not exist`);
      }

      // data stored directly on the videojs object may be
      // misidentified as a component to retain
      // backwards-compatibility with 4.x. check to make sure the
      // component class can be instantiated.
      if (typeof ComponentClass !== 'function') {
        return null;
      }

      component = new ComponentClass(this.player_ || this, options);

    // child is a component instance
    } else {
      component = child;
    }

    if (component.parentComponent_) {
      component.parentComponent_.removeChild(component);
    }
    this.children_.splice(index, 0, component);
    component.parentComponent_ = this;

    if (typeof component.id === 'function') {
      this.childIndex_[component.id()] = component;
    }

    // If a name wasn't used to create the component, check if we can use the
    // name function of the component
    componentName = componentName || (component.name && toTitleCase(component.name()));

    if (componentName) {
      this.childNameIndex_[componentName] = component;
      this.childNameIndex_[toLowerCase(componentName)] = component;
    }

    // Add the UI object's element to the container div (box)
    // Having an element is not required
    if (typeof component.el === 'function' && component.el()) {
      // If inserting before a component, insert before that component's element
      let refNode = null;

      if (this.children_[index + 1]) {
        // Most children are components, but the video tech is an HTML element
        if (this.children_[index + 1].el_) {
          refNode = this.children_[index + 1].el_;
        } else if (Dom.isEl(this.children_[index + 1])) {
          refNode = this.children_[index + 1];
        }
      }

      this.contentEl().insertBefore(component.el(), refNode);
    }

    // Return so it can stored on parent object if desired.
    return component;
  }

  /**
   * Remove a child `Component` from this `Component`s list of children. Also removes
   * the child `Component`s element from this `Component`s element.
   *
   * @param {Component} component
   *        The child `Component` to remove.
   */
  removeChild(component) {
    if (typeof component === 'string') {
      component = this.getChild(component);
    }

    if (!component || !this.children_) {
      return;
    }

    let childFound = false;

    for (let i = this.children_.length - 1; i >= 0; i--) {
      if (this.children_[i] === component) {
        childFound = true;
        this.children_.splice(i, 1);
        break;
      }
    }

    if (!childFound) {
      return;
    }

    component.parentComponent_ = null;

    this.childIndex_[component.id()] = null;
    this.childNameIndex_[toTitleCase(component.name())] = null;
    this.childNameIndex_[toLowerCase(component.name())] = null;

    const compEl = component.el();

    if (compEl && compEl.parentNode === this.contentEl()) {
      this.contentEl().removeChild(component.el());
    }
  }

  /**
   * Add and initialize default child `Component`s based upon options.
   */
  initChildren() {
    const children = this.options_.children;

    if (children) {
      // `this` is `parent`
      const parentOptions = this.options_;

      const handleAdd = (child) => {
        const name = child.name;
        let opts = child.opts;

        // Allow options for children to be set at the parent options
        // e.g. videojs(id, { controlBar: false });
        // instead of videojs(id, { children: { controlBar: false });
        if (parentOptions[name] !== undefined) {
          opts = parentOptions[name];
        }

        // Allow for disabling default components
        // e.g. options['children']['posterImage'] = false
        if (opts === false) {
          return;
        }

        // Allow options to be passed as a simple boolean if no configuration
        // is necessary.
        if (opts === true) {
          opts = {};
        }

        // We also want to pass the original player options
        // to each component as well so they don't need to
        // reach back into the player for options later.
        opts.playerOptions = this.options_.playerOptions;

        // Create and add the child component.
        // Add a direct reference to the child by name on the parent instance.
        // If two of the same component are used, different names should be supplied
        // for each
        const newChild = this.addChild(name, opts);

        if (newChild) {
          this[name] = newChild;
        }
      };

      // Allow for an array of children details to passed in the options
      let workingChildren;
      const Tech = Component.getComponent('Tech');

      if (Array.isArray(children)) {
        workingChildren = children;
      } else {
        workingChildren = Object.keys(children);
      }

      workingChildren
      // children that are in this.options_ but also in workingChildren  would
      // give us extra children we do not want. So, we want to filter them out.
        .concat(Object.keys(this.options_)
          .filter(function(child) {
            return !workingChildren.some(function(wchild) {
              if (typeof wchild === 'string') {
                return child === wchild;
              }
              return child === wchild.name;
            });
          }))
        .map((child) => {
          let name;
          let opts;

          if (typeof child === 'string') {
            name = child;
            opts = children[name] || this.options_[name] || {};
          } else {
            name = child.name;
            opts = child;
          }

          return {name, opts};
        })
        .filter((child) => {
        // we have to make sure that child.name isn't in the techOrder since
        // techs are registerd as Components but can't aren't compatible
        // See https://github.com/videojs/video.js/issues/2772
          const c = Component.getComponent(child.opts.componentClass ||
                                       toTitleCase(child.name));

          return c && !Tech.isTech(c);
        })
        .forEach(handleAdd);
    }
  }

  /**
   * Builds the default DOM class name. Should be overriden by sub-components.
   *
   * @return {string}
   *         The DOM class name for this object.
   *
   * @abstract
   */
  buildCSSClass() {
    // Child classes can include a function that does:
    // return 'CLASS NAME' + this._super();
    return '';
  }

  /**
   * Bind a listener to the component's ready state.
   * Different from event listeners in that if the ready event has already happened
   * it will trigger the function immediately.
   *
   * @return {Component}
   *         Returns itself; method can be chained.
   */
  ready(fn, sync = false) {
    if (!fn) {
      return;
    }

    if (!this.isReady_) {
      this.readyQueue_ = this.readyQueue_ || [];
      this.readyQueue_.push(fn);
      return;
    }

    if (sync) {
      fn.call(this);
    } else {
      // Call the function asynchronously by default for consistency
      this.setTimeout(fn, 1);
    }
  }

  /**
   * Trigger all the ready listeners for this `Component`.
   *
   * @fires Component#ready
   */
  triggerReady() {
    this.isReady_ = true;

    // Ensure ready is triggered asynchronously
    this.setTimeout(function() {
      const readyQueue = this.readyQueue_;

      // Reset Ready Queue
      this.readyQueue_ = [];

      if (readyQueue && readyQueue.length > 0) {
        readyQueue.forEach(function(fn) {
          fn.call(this);
        }, this);
      }

      // Allow for using event listeners also
      /**
       * Triggered when a `Component` is ready.
       *
       * @event Component#ready
       * @type {EventTarget~Event}
       */
      this.trigger('ready');
    }, 1);
  }

  /**
   * Find a single DOM element matching a `selector`. This can be within the `Component`s
   * `contentEl()` or another custom context.
   *
   * @param {string} selector
   *        A valid CSS selector, which will be passed to `querySelector`.
   *
   * @param {Element|string} [context=this.contentEl()]
   *        A DOM element within which to query. Can also be a selector string in
   *        which case the first matching element will get used as context. If
   *        missing `this.contentEl()` gets used. If  `this.contentEl()` returns
   *        nothing it falls back to `document`.
   *
   * @return {Element|null}
   *         the dom element that was found, or null
   *
   * @see [Information on CSS Selectors](https://developer.mozilla.org/en-US/docs/Web/Guide/CSS/Getting_Started/Selectors)
   */
  $(selector, context) {
    return Dom.$(selector, context || this.contentEl());
  }

  /**
   * Finds all DOM element matching a `selector`. This can be within the `Component`s
   * `contentEl()` or another custom context.
   *
   * @param {string} selector
   *        A valid CSS selector, which will be passed to `querySelectorAll`.
   *
   * @param {Element|string} [context=this.contentEl()]
   *        A DOM element within which to query. Can also be a selector string in
   *        which case the first matching element will get used as context. If
   *        missing `this.contentEl()` gets used. If  `this.contentEl()` returns
   *        nothing it falls back to `document`.
   *
   * @return {NodeList}
   *         a list of dom elements that were found
   *
   * @see [Information on CSS Selectors](https://developer.mozilla.org/en-US/docs/Web/Guide/CSS/Getting_Started/Selectors)
   */
  $$(selector, context) {
    return Dom.$$(selector, context || this.contentEl());
  }

  /**
   * Check if a component's element has a CSS class name.
   *
   * @param {string} classToCheck
   *        CSS class name to check.
   *
   * @return {boolean}
   *         - True if the `Component` has the class.
   *         - False if the `Component` does not have the class`
   */
  hasClass(classToCheck) {
    return Dom.hasClass(this.el_, classToCheck);
  }

  /**
   * Add a CSS class name to the `Component`s element.
   *
   * @param {string} classToAdd
   *        CSS class name to add
   */
  addClass(classToAdd) {
    Dom.addClass(this.el_, classToAdd);
  }

  /**
   * Remove a CSS class name from the `Component`s element.
   *
   * @param {string} classToRemove
   *        CSS class name to remove
   */
  removeClass(classToRemove) {
    Dom.removeClass(this.el_, classToRemove);
  }

  /**
   * Add or remove a CSS class name from the component's element.
   * - `classToToggle` gets added when {@link Component#hasClass} would return false.
   * - `classToToggle` gets removed when {@link Component#hasClass} would return true.
   *
   * @param  {string} classToToggle
   *         The class to add or remove based on (@link Component#hasClass}
   *
   * @param  {boolean|Dom~predicate} [predicate]
   *         An {@link Dom~predicate} function or a boolean
   */
  toggleClass(classToToggle, predicate) {
    Dom.toggleClass(this.el_, classToToggle, predicate);
  }

  /**
   * Show the `Component`s element if it is hidden by removing the
   * 'vjs-hidden' class name from it.
   */
  show() {
    this.removeClass('vjs-hidden');
  }

  /**
   * Hide the `Component`s element if it is currently showing by adding the
   * 'vjs-hidden` class name to it.
   */
  hide() {
    this.addClass('vjs-hidden');
  }

  /**
   * Lock a `Component`s element in its visible state by adding the 'vjs-lock-showing'
   * class name to it. Used during fadeIn/fadeOut.
   *
   * @private
   */
  lockShowing() {
    this.addClass('vjs-lock-showing');
  }

  /**
   * Unlock a `Component`s element from its visible state by removing the 'vjs-lock-showing'
   * class name from it. Used during fadeIn/fadeOut.
   *
   * @private
   */
  unlockShowing() {
    this.removeClass('vjs-lock-showing');
  }

  /**
   * Get the value of an attribute on the `Component`s element.
   *
   * @param {string} attribute
   *        Name of the attribute to get the value from.
   *
   * @return {string|null}
   *         - The value of the attribute that was asked for.
   *         - Can be an empty string on some browsers if the attribute does not exist
   *           or has no value
   *         - Most browsers will return null if the attibute does not exist or has
   *           no value.
   *
   * @see [DOM API]{@link https://developer.mozilla.org/en-US/docs/Web/API/Element/getAttribute}
   */
  getAttribute(attribute) {
    return Dom.getAttribute(this.el_, attribute);
  }

  /**
   * Set the value of an attribute on the `Component`'s element
   *
   * @param {string} attribute
   *        Name of the attribute to set.
   *
   * @param {string} value
   *        Value to set the attribute to.
   *
   * @see [DOM API]{@link https://developer.mozilla.org/en-US/docs/Web/API/Element/setAttribute}
   */
  setAttribute(attribute, value) {
    Dom.setAttribute(this.el_, attribute, value);
  }

  /**
   * Remove an attribute from the `Component`s element.
   *
   * @param {string} attribute
   *        Name of the attribute to remove.
   *
   * @see [DOM API]{@link https://developer.mozilla.org/en-US/docs/Web/API/Element/removeAttribute}
   */
  removeAttribute(attribute) {
    Dom.removeAttribute(this.el_, attribute);
  }

  /**
   * Get or set the width of the component based upon the CSS styles.
   * See {@link Component#dimension} for more detailed information.
   *
   * @param {number|string} [num]
   *        The width that you want to set postfixed with '%', 'px' or nothing.
   *
   * @param {boolean} [skipListeners]
   *        Skip the componentresize event trigger
   *
   * @return {number|string}
   *         The width when getting, zero if there is no width. Can be a string
   *           postpixed with '%' or 'px'.
   */
  width(num, skipListeners) {
    return this.dimension('width', num, skipListeners);
  }

  /**
   * Get or set the height of the component based upon the CSS styles.
   * See {@link Component#dimension} for more detailed information.
   *
   * @param {number|string} [num]
   *        The height that you want to set postfixed with '%', 'px' or nothing.
   *
   * @param {boolean} [skipListeners]
   *        Skip the componentresize event trigger
   *
   * @return {number|string}
   *         The width when getting, zero if there is no width. Can be a string
   *         postpixed with '%' or 'px'.
   */
  height(num, skipListeners) {
    return this.dimension('height', num, skipListeners);
  }

  /**
   * Set both the width and height of the `Component` element at the same time.
   *
   * @param  {number|string} width
   *         Width to set the `Component`s element to.
   *
   * @param  {number|string} height
   *         Height to set the `Component`s element to.
   */
  dimensions(width, height) {
    // Skip componentresize listeners on width for optimization
    this.width(width, true);
    this.height(height);
  }

  /**
   * Get or set width or height of the `Component` element. This is the shared code
   * for the {@link Component#width} and {@link Component#height}.
   *
   * Things to know:
   * - If the width or height in an number this will return the number postfixed with 'px'.
   * - If the width/height is a percent this will return the percent postfixed with '%'
   * - Hidden elements have a width of 0 with `window.getComputedStyle`. This function
   *   defaults to the `Component`s `style.width` and falls back to `window.getComputedStyle`.
   *   See [this]{@link http://www.foliotek.com/devblog/getting-the-width-of-a-hidden-element-with-jquery-using-width/}
   *   for more information
   * - If you want the computed style of the component, use {@link Component#currentWidth}
   *   and {@link {Component#currentHeight}
   *
   * @fires Component#componentresize
   *
   * @param {string} widthOrHeight
   8        'width' or 'height'
   *
   * @param  {number|string} [num]
   8         New dimension
   *
   * @param  {boolean} [skipListeners]
   *         Skip componentresize event trigger
   *
   * @return {number}
   *         The dimension when getting or 0 if unset
   */
  dimension(widthOrHeight, num, skipListeners) {
    if (num !== undefined) {
      // Set to zero if null or literally NaN (NaN !== NaN)
      if (num === null || num !== num) {
        num = 0;
      }

      // Check if using css width/height (% or px) and adjust
      if (('' + num).indexOf('%') !== -1 || ('' + num).indexOf('px') !== -1) {
        this.el_.style[widthOrHeight] = num;
      } else if (num === 'auto') {
        this.el_.style[widthOrHeight] = '';
      } else {
        this.el_.style[widthOrHeight] = num + 'px';
      }

      // skipListeners allows us to avoid triggering the resize event when setting both width and height
      if (!skipListeners) {
        /**
         * Triggered when a component is resized.
         *
         * @event Component#componentresize
         * @type {EventTarget~Event}
         */
        this.trigger('componentresize');
      }

      return;
    }

    // Not setting a value, so getting it
    // Make sure element exists
    if (!this.el_) {
      return 0;
    }

    // Get dimension value from style
    const val = this.el_.style[widthOrHeight];
    const pxIndex = val.indexOf('px');

    if (pxIndex !== -1) {
      // Return the pixel value with no 'px'
      return parseInt(val.slice(0, pxIndex), 10);
    }

    // No px so using % or no style was set, so falling back to offsetWidth/height
    // If component has display:none, offset will return 0
    // TODO: handle display:none and no dimension style using px
    return parseInt(this.el_['offset' + toTitleCase(widthOrHeight)], 10);
  }

  /**
   * Get the computed width or the height of the component's element.
   *
   * Uses `window.getComputedStyle`.
   *
   * @param {string} widthOrHeight
   *        A string containing 'width' or 'height'. Whichever one you want to get.
   *
   * @return {number}
   *         The dimension that gets asked for or 0 if nothing was set
   *         for that dimension.
   */
  currentDimension(widthOrHeight) {
    let computedWidthOrHeight = 0;

    if (widthOrHeight !== 'width' && widthOrHeight !== 'height') {
      throw new Error('currentDimension only accepts width or height value');
    }

    computedWidthOrHeight = computedStyle(this.el_, widthOrHeight);

    // remove 'px' from variable and parse as integer
    computedWidthOrHeight = parseFloat(computedWidthOrHeight);

    // if the computed value is still 0, it's possible that the browser is lying
    // and we want to check the offset values.
    // This code also runs wherever getComputedStyle doesn't exist.
    if (computedWidthOrHeight === 0 || isNaN(computedWidthOrHeight)) {
      const rule = `offset${toTitleCase(widthOrHeight)}`;

      computedWidthOrHeight = this.el_[rule];
    }

    return computedWidthOrHeight;
  }

  /**
   * An object that contains width and height values of the `Component`s
   * computed style. Uses `window.getComputedStyle`.
   *
   * @typedef {Object} Component~DimensionObject
   *
   * @property {number} width
   *           The width of the `Component`s computed style.
   *
   * @property {number} height
   *           The height of the `Component`s computed style.
   */

  /**
   * Get an object that contains computed width and height values of the
   * component's element.
   *
   * Uses `window.getComputedStyle`.
   *
   * @return {Component~DimensionObject}
   *         The computed dimensions of the component's element.
   */
  currentDimensions() {
    return {
      width: this.currentDimension('width'),
      height: this.currentDimension('height')
    };
  }

  /**
   * Get the computed width of the component's element.
   *
   * Uses `window.getComputedStyle`.
   *
   * @return {number}
   *         The computed width of the component's element.
   */
  currentWidth() {
    return this.currentDimension('width');
  }

  /**
   * Get the computed height of the component's element.
   *
   * Uses `window.getComputedStyle`.
   *
   * @return {number}
   *         The computed height of the component's element.
   */
  currentHeight() {
    return this.currentDimension('height');
  }

  /**
   * Set the focus to this component
   */
  focus() {
    this.el_.focus();
  }

  /**
   * Remove the focus from this component
   */
  blur() {
    this.el_.blur();
  }

  /**
   * When this Component receives a `keydown` event which it does not process,
   *  it passes the event to the Player for handling.
   *
   * @param {EventTarget~Event} event
   *        The `keydown` event that caused this function to be called.
   */
  handleKeyDown(event) {
    if (this.player_) {

      // We only stop propagation here because we want unhandled events to fall
      // back to the browser.
      event.stopPropagation();
      this.player_.handleKeyDown(event);
    }
  }

  /**
   * Many components used to have a `handleKeyPress` method, which was poorly
   * named because it listened to a `keydown` event. This method name now
   * delegates to `handleKeyDown`. This means anyone calling `handleKeyPress`
   * will not see their method calls stop working.
   *
   * @param {EventTarget~Event} event
   *        The event that caused this function to be called.
   */
  handleKeyPress(event) {
    this.handleKeyDown(event);
  }

  /**
   * Emit a 'tap' events when touch event support gets detected. This gets used to
   * support toggling the controls through a tap on the video. They get enabled
   * because every sub-component would have extra overhead otherwise.
   *
   * @private
   * @fires Component#tap
   * @listens Component#touchstart
   * @listens Component#touchmove
   * @listens Component#touchleave
   * @listens Component#touchcancel
   * @listens Component#touchend

   */
  emitTapEvents() {
    // Track the start time so we can determine how long the touch lasted
    let touchStart = 0;
    let firstTouch = null;

    // Maximum movement allowed during a touch event to still be considered a tap
    // Other popular libs use anywhere from 2 (hammer.js) to 15,
    // so 10 seems like a nice, round number.
    const tapMovementThreshold = 10;

    // The maximum length a touch can be while still being considered a tap
    const touchTimeThreshold = 200;

    let couldBeTap;

    this.on('touchstart', function(event) {
      // If more than one finger, don't consider treating this as a click
      if (event.touches.length === 1) {
        // Copy pageX/pageY from the object
        firstTouch = {
          pageX: event.touches[0].pageX,
          pageY: event.touches[0].pageY
        };
        // Record start time so we can detect a tap vs. "touch and hold"
        touchStart = window.performance.now();
        // Reset couldBeTap tracking
        couldBeTap = true;
      }
    });

    this.on('touchmove', function(event) {
      // If more than one finger, don't consider treating this as a click
      if (event.touches.length > 1) {
        couldBeTap = false;
      } else if (firstTouch) {
        // Some devices will throw touchmoves for all but the slightest of taps.
        // So, if we moved only a small distance, this could still be a tap
        const xdiff = event.touches[0].pageX - firstTouch.pageX;
        const ydiff = event.touches[0].pageY - firstTouch.pageY;
        const touchDistance = Math.sqrt(xdiff * xdiff + ydiff * ydiff);

        if (touchDistance > tapMovementThreshold) {
          couldBeTap = false;
        }
      }
    });

    const noTap = function() {
      couldBeTap = false;
    };

    // TODO: Listen to the original target. http://youtu.be/DujfpXOKUp8?t=13m8s
    this.on('touchleave', noTap);
    this.on('touchcancel', noTap);

    // When the touch ends, measure how long it took and trigger the appropriate
    // event
    this.on('touchend', function(event) {
      firstTouch = null;
      // Proceed only if the touchmove/leave/cancel event didn't happen
      if (couldBeTap === true) {
        // Measure how long the touch lasted
        const touchTime = window.performance.now() - touchStart;

        // Make sure the touch was less than the threshold to be considered a tap
        if (touchTime < touchTimeThreshold) {
          // Don't let browser turn this into a click
          event.preventDefault();
          /**
           * Triggered when a `Component` is tapped.
           *
           * @event Component#tap
           * @type {EventTarget~Event}
           */
          this.trigger('tap');
          // It may be good to copy the touchend event object and change the
          // type to tap, if the other event properties aren't exact after
          // Events.fixEvent runs (e.g. event.target)
        }
      }
    });
  }

  /**
   * This function reports user activity whenever touch events happen. This can get
   * turned off by any sub-components that wants touch events to act another way.
   *
   * Report user touch activity when touch events occur. User activity gets used to
   * determine when controls should show/hide. It is simple when it comes to mouse
   * events, because any mouse event should show the controls. So we capture mouse
   * events that bubble up to the player and report activity when that happens.
   * With touch events it isn't as easy as `touchstart` and `touchend` toggle player
   * controls. So touch events can't help us at the player level either.
   *
   * User activity gets checked asynchronously. So what could happen is a tap event
   * on the video turns the controls off. Then the `touchend` event bubbles up to
   * the player. Which, if it reported user activity, would turn the controls right
   * back on. We also don't want to completely block touch events from bubbling up.
   * Furthermore a `touchmove` event and anything other than a tap, should not turn
   * controls back on.
   *
   * @listens Component#touchstart
   * @listens Component#touchmove
   * @listens Component#touchend
   * @listens Component#touchcancel
   */
  enableTouchActivity() {
    // Don't continue if the root player doesn't support reporting user activity
    if (!this.player() || !this.player().reportUserActivity) {
      return;
    }

    // listener for reporting that the user is active
    const report = Fn.bind(this.player(), this.player().reportUserActivity);

    let touchHolding;

    this.on('touchstart', function() {
      report();
      // For as long as the they are touching the device or have their mouse down,
      // we consider them active even if they're not moving their finger or mouse.
      // So we want to continue to update that they are active
      this.clearInterval(touchHolding);
      // report at the same interval as activityCheck
      touchHolding = this.setInterval(report, 250);
    });

    const touchEnd = function(event) {
      report();
      // stop the interval that maintains activity if the touch is holding
      this.clearInterval(touchHolding);
    };

    this.on('touchmove', report);
    this.on('touchend', touchEnd);
    this.on('touchcancel', touchEnd);
  }

  /**
   * A callback that has no parameters and is bound into `Component`s context.
   *
   * @callback Component~GenericCallback
   * @this Component
   */

  /**
   * Creates a function that runs after an `x` millisecond timeout. This function is a
   * wrapper around `window.setTimeout`. There are a few reasons to use this one
   * instead though:
   * 1. It gets cleared via  {@link Component#clearTimeout} when
   *    {@link Component#dispose} gets called.
   * 2. The function callback will gets turned into a {@link Component~GenericCallback}
   *
   * > Note: You can't use `window.clearTimeout` on the id returned by this function. This
   *         will cause its dispose listener not to get cleaned up! Please use
   *         {@link Component#clearTimeout} or {@link Component#dispose} instead.
   *
   * @param {Component~GenericCallback} fn
   *        The function that will be run after `timeout`.
   *
   * @param {number} timeout
   *        Timeout in milliseconds to delay before executing the specified function.
   *
   * @return {number}
   *         Returns a timeout ID that gets used to identify the timeout. It can also
   *         get used in {@link Component#clearTimeout} to clear the timeout that
   *         was set.
   *
   * @listens Component#dispose
   * @see [Similar to]{@link https://developer.mozilla.org/en-US/docs/Web/API/WindowTimers/setTimeout}
   */
  setTimeout(fn, timeout) {
    // declare as variables so they are properly available in timeout function
    // eslint-disable-next-line
    var timeoutId, disposeFn;

    fn = Fn.bind(this, fn);

    this.clearTimersOnDispose_();

    timeoutId = window.setTimeout(() => {
      if (this.setTimeoutIds_.has(timeoutId)) {
        this.setTimeoutIds_.delete(timeoutId);
      }
      fn();
    }, timeout);

    this.setTimeoutIds_.add(timeoutId);

    return timeoutId;
  }

  /**
   * Clears a timeout that gets created via `window.setTimeout` or
   * {@link Component#setTimeout}. If you set a timeout via {@link Component#setTimeout}
   * use this function instead of `window.clearTimout`. If you don't your dispose
   * listener will not get cleaned up until {@link Component#dispose}!
   *
   * @param {number} timeoutId
   *        The id of the timeout to clear. The return value of
   *        {@link Component#setTimeout} or `window.setTimeout`.
   *
   * @return {number}
   *         Returns the timeout id that was cleared.
   *
   * @see [Similar to]{@link https://developer.mozilla.org/en-US/docs/Web/API/WindowTimers/clearTimeout}
   */
  clearTimeout(timeoutId) {
    if (this.setTimeoutIds_.has(timeoutId)) {
      this.setTimeoutIds_.delete(timeoutId);
      window.clearTimeout(timeoutId);
    }

    return timeoutId;
  }

  /**
   * Creates a function that gets run every `x` milliseconds. This function is a wrapper
   * around `window.setInterval`. There are a few reasons to use this one instead though.
   * 1. It gets cleared via  {@link Component#clearInterval} when
   *    {@link Component#dispose} gets called.
   * 2. The function callback will be a {@link Component~GenericCallback}
   *
   * @param {Component~GenericCallback} fn
   *        The function to run every `x` seconds.
   *
   * @param {number} interval
   *        Execute the specified function every `x` milliseconds.
   *
   * @return {number}
   *         Returns an id that can be used to identify the interval. It can also be be used in
   *         {@link Component#clearInterval} to clear the interval.
   *
   * @listens Component#dispose
   * @see [Similar to]{@link https://developer.mozilla.org/en-US/docs/Web/API/WindowTimers/setInterval}
   */
  setInterval(fn, interval) {
    fn = Fn.bind(this, fn);

    this.clearTimersOnDispose_();

    const intervalId = window.setInterval(fn, interval);

    this.setIntervalIds_.add(intervalId);

    return intervalId;
  }

  /**
   * Clears an interval that gets created via `window.setInterval` or
   * {@link Component#setInterval}. If you set an inteval via {@link Component#setInterval}
   * use this function instead of `window.clearInterval`. If you don't your dispose
   * listener will not get cleaned up until {@link Component#dispose}!
   *
   * @param {number} intervalId
   *        The id of the interval to clear. The return value of
   *        {@link Component#setInterval} or `window.setInterval`.
   *
   * @return {number}
   *         Returns the interval id that was cleared.
   *
   * @see [Similar to]{@link https://developer.mozilla.org/en-US/docs/Web/API/WindowTimers/clearInterval}
   */
  clearInterval(intervalId) {
    if (this.setIntervalIds_.has(intervalId)) {
      this.setIntervalIds_.delete(intervalId);
      window.clearInterval(intervalId);
    }

    return intervalId;
  }

  /**
   * Queues up a callback to be passed to requestAnimationFrame (rAF), but
   * with a few extra bonuses:
   *
   * - Supports browsers that do not support rAF by falling back to
   *   {@link Component#setTimeout}.
   *
   * - The callback is turned into a {@link Component~GenericCallback} (i.e.
   *   bound to the component).
   *
   * - Automatic cancellation of the rAF callback is handled if the component
   *   is disposed before it is called.
   *
   * @param  {Component~GenericCallback} fn
   *         A function that will be bound to this component and executed just
   *         before the browser's next repaint.
   *
   * @return {number}
   *         Returns an rAF ID that gets used to identify the timeout. It can
   *         also be used in {@link Component#cancelAnimationFrame} to cancel
   *         the animation frame callback.
   *
   * @listens Component#dispose
   * @see [Similar to]{@link https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame}
   */
  requestAnimationFrame(fn) {
    // Fall back to using a timer.
    if (!this.supportsRaf_) {
      return this.setTimeout(fn, 1000 / 60);
    }

    this.clearTimersOnDispose_();

    // declare as variables so they are properly available in rAF function
    // eslint-disable-next-line
    var id;
    fn = Fn.bind(this, fn);

    id = window.requestAnimationFrame(() => {
      if (this.rafIds_.has(id)) {
        this.rafIds_.delete(id);
      }
      fn();
    });
    this.rafIds_.add(id);

    return id;
  }

  /**
   * Request an animation frame, but only one named animation
   * frame will be queued. Another will never be added until
   * the previous one finishes.
   *
   * @param {string} name
   *        The name to give this requestAnimationFrame
   *
   * @param  {Component~GenericCallback} fn
   *         A function that will be bound to this component and executed just
   *         before the browser's next repaint.
   */
  requestNamedAnimationFrame(name, fn) {
    if (this.namedRafs_.has(name)) {
      return;
    }
    this.clearTimersOnDispose_();

    fn = Fn.bind(this, fn);

    const id = this.requestAnimationFrame(() => {
      fn();
      if (this.namedRafs_.has(name)) {
        this.namedRafs_.delete(name);
      }
    });

    this.namedRafs_.set(name, id);

    return name;
  }

  /**
   * Cancels a current named animation frame if it exists.
   *
   * @param {string} name
   *        The name of the requestAnimationFrame to cancel.
   */
  cancelNamedAnimationFrame(name) {
    if (!this.namedRafs_.has(name)) {
      return;
    }

    this.cancelAnimationFrame(this.namedRafs_.get(name));
    this.namedRafs_.delete(name);
  }

  /**
   * Cancels a queued callback passed to {@link Component#requestAnimationFrame}
   * (rAF).
   *
   * If you queue an rAF callback via {@link Component#requestAnimationFrame},
   * use this function instead of `window.cancelAnimationFrame`. If you don't,
   * your dispose listener will not get cleaned up until {@link Component#dispose}!
   *
   * @param {number} id
   *        The rAF ID to clear. The return value of {@link Component#requestAnimationFrame}.
   *
   * @return {number}
   *         Returns the rAF ID that was cleared.
   *
   * @see [Similar to]{@link https://developer.mozilla.org/en-US/docs/Web/API/window/cancelAnimationFrame}
   */
  cancelAnimationFrame(id) {
    // Fall back to using a timer.
    if (!this.supportsRaf_) {
      return this.clearTimeout(id);
    }

    if (this.rafIds_.has(id)) {
      this.rafIds_.delete(id);
      window.cancelAnimationFrame(id);
    }

    return id;

  }

  /**
   * A function to setup `requestAnimationFrame`, `setTimeout`,
   * and `setInterval`, clearing on dispose.
   *
   * > Previously each timer added and removed dispose listeners on it's own.
   * For better performance it was decided to batch them all, and use `Set`s
   * to track outstanding timer ids.
   *
   * @private
   */
  clearTimersOnDispose_() {
    if (this.clearingTimersOnDispose_) {
      return;
    }

    this.clearingTimersOnDispose_ = true;
    this.one('dispose', () => {
      [
        ['namedRafs_', 'cancelNamedAnimationFrame'],
        ['rafIds_', 'cancelAnimationFrame'],
        ['setTimeoutIds_', 'clearTimeout'],
        ['setIntervalIds_', 'clearInterval']
      ].forEach(([idName, cancelName]) => {
        // for a `Set` key will actually be the value again
        // so forEach((val, val) =>` but for maps we want to use
        // the key.
        this[idName].forEach((val, key) => this[cancelName](key));
      });

      this.clearingTimersOnDispose_ = false;
    });
  }

  /**
   * Register a `Component` with `videojs` given the name and the component.
   *
   * > NOTE: {@link Tech}s should not be registered as a `Component`. {@link Tech}s
   *         should be registered using {@link Tech.registerTech} or
   *         {@link videojs:videojs.registerTech}.
   *
   * > NOTE: This function can also be seen on videojs as
   *         {@link videojs:videojs.registerComponent}.
   *
   * @param {string} name
   *        The name of the `Component` to register.
   *
   * @param {Component} ComponentToRegister
   *        The `Component` class to register.
   *
   * @return {Component}
   *         The `Component` that was registered.
   */
  static registerComponent(name, ComponentToRegister) {
    if (typeof name !== 'string' || !name) {
      throw new Error(`Illegal component name, "${name}"; must be a non-empty string.`);
    }

    const Tech = Component.getComponent('Tech');

    // We need to make sure this check is only done if Tech has been registered.
    const isTech = Tech && Tech.isTech(ComponentToRegister);
    const isComp = Component === ComponentToRegister ||
      Component.prototype.isPrototypeOf(ComponentToRegister.prototype);

    if (isTech || !isComp) {
      let reason;

      if (isTech) {
        reason = 'techs must be registered using Tech.registerTech()';
      } else {
        reason = 'must be a Component subclass';
      }

      throw new Error(`Illegal component, "${name}"; ${reason}.`);
    }

    name = toTitleCase(name);

    if (!Component.components_) {
      Component.components_ = {};
    }

    const Player = Component.getComponent('Player');

    if (name === 'Player' && Player && Player.players) {
      const players = Player.players;
      const playerNames = Object.keys(players);

      // If we have players that were disposed, then their name will still be
      // in Players.players. So, we must loop through and verify that the value
      // for each item is not null. This allows registration of the Player component
      // after all players have been disposed or before any were created.
      if (players &&
          playerNames.length > 0 &&
          playerNames.map((pname) => players[pname]).every(Boolean)) {
        throw new Error('Can not register Player component after player has been created.');
      }
    }

    Component.components_[name] = ComponentToRegister;
    Component.components_[toLowerCase(name)] = ComponentToRegister;

    return ComponentToRegister;
  }

  /**
   * Get a `Component` based on the name it was registered with.
   *
   * @param {string} name
   *        The Name of the component to get.
   *
   * @return {Component}
   *         The `Component` that got registered under the given name.
   */
  static getComponent(name) {
    if (!name || !Component.components_) {
      return;
    }

    return Component.components_[name];
  }
}

/**
 * Whether or not this component supports `requestAnimationFrame`.
 *
 * This is exposed primarily for testing purposes.
 *
 * @private
 * @type {Boolean}
 */
Component.prototype.supportsRaf_ = typeof window.requestAnimationFrame === 'function' &&
  typeof window.cancelAnimationFrame === 'function';

Component.registerComponent('Component', Component);

export default Component;
