export default Component;
/**
 * Base class for all UI Components.
 * Components are UI objects which represent both a javascript object and an element
 * in the DOM. They can be children of other components, and can have
 * children themselves.
 *
 * Components can also use methods from {@link EventTarget}
 */
declare class Component {
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
    static registerComponent(name: string, ComponentToRegister: Component): Component;
    /**
     * Get a `Component` based on the name it was registered with.
     *
     * @param {string} name
     *        The Name of the component to get.
     *
     * @return {Component}
     *         The `Component` that got registered under the given name.
     */
    static getComponent(name: string): Component;
    /**
     * A callback that is called when a component is ready. Does not have any
     * parameters and any callback value will be ignored.
     *
     * @callback ReadyCallback
     * @this Component
     */
    /**
     * Creates an instance of this class.
     *
     * @param { import('./player').default } player
     *        The `Player` that this class should be attached to.
     *
     * @param {Object} [options]
     *        The key/value store of component options.
     *
     * @param {Object[]} [options.children]
     *        An array of children objects to initialize this component with. Children objects have
     *        a name property that will be used if more than one component of the same type needs to be
     *        added.
     *
     * @param  {string} [options.className]
     *         A class or space separated list of classes to add the component
     *
     * @param {ReadyCallback} [ready]
     *        Function that gets called when the `Component` is ready.
     */
    constructor(player: import('./player').default, options?: {
        children?: any[];
        className?: string;
    }, ready?: () => any);
    player_: any;
    isDisposed_: boolean;
    parentComponent_: any;
    options_: any;
    id_: any;
    name_: any;
    el_: any;
    /**
     * Handles language change for the player in components. Should be overridden by sub-components.
     *
     * @abstract
     */
    handleLanguagechange(): void;
    children_: any[];
    childIndex_: {};
    childNameIndex_: {};
    setTimeoutIds_: Set<any>;
    setIntervalIds_: Set<any>;
    rafIds_: Set<any>;
    namedRafs_: Map<any, any>;
    clearingTimersOnDispose_: boolean;
    /**
     * Adds an `event listener` to an instance of an `EventTarget`. An `event listener` is a
     * function that will get called when an event with a certain name gets triggered.
     *
     * @param {string|string[]} type
     *        An event name or an array of event names.
     *
     * @param {Function} fn
     *        The function to call with `EventTarget`s
     */
    on(type: string | string[], fn: Function): void;
    /**
     * Removes an `event listener` for a specific event from an instance of `EventTarget`.
     * This makes it so that the `event listener` will no longer get called when the
     * named event happens.
     *
     * @param {string|string[]} type
     *        An event name or an array of event names.
     *
     * @param {Function} fn
     *        The function to remove.
     */
    off(type: string | string[], fn: Function): void;
    /**
     * This function will add an `event listener` that gets triggered only once. After the
     * first trigger it will get removed. This is like adding an `event listener`
     * with {@link EventTarget#on} that calls {@link EventTarget#off} on itself.
     *
     * @param {string|string[]} type
     *        An event name or an array of event names.
     *
     * @param {Function} fn
     *        The function to be called once for each event name.
     */
    one(type: string | string[], fn: Function): void;
    /**
     * This function will add an `event listener` that gets triggered only once and is
     * removed from all events. This is like adding an array of `event listener`s
     * with {@link EventTarget#on} that calls {@link EventTarget#off} on all events the
     * first time it is triggered.
     *
     * @param {string|string[]} type
     *        An event name or an array of event names.
     *
     * @param {Function} fn
     *        The function to be called once for each event name.
     */
    any(type: string | string[], fn: Function): void;
    /**
     * This function causes an event to happen. This will then cause any `event listeners`
     * that are waiting for that event, to get called. If there are no `event listeners`
     * for an event then nothing will happen.
     *
     * If the name of the `Event` that is being triggered is in `EventTarget.allowedEvents_`.
     * Trigger will also call the `on` + `uppercaseEventName` function.
     *
     * Example:
     * 'click' is in `EventTarget.allowedEvents_`, so, trigger will attempt to call
     * `onClick` if it exists.
     *
     * @param {string|Event|Object} event
     *        The name of the event, an `Event`, or an object with a key of type set to
     *        an event name.
     *
     * @param {Object} [hash]
     *        Optionally extra argument to pass through to an event listener
     */
    trigger(event: string | Event | any, hash?: any): void;
    /**
     * Dispose of the `Component` and all child components.
     *
     * @fires Component#dispose
     *
     * @param {Object} options
     * @param {Element} options.originalEl element with which to replace player element
     */
    dispose(options?: {
        originalEl: Element;
    }): void;
    /**
     * Determine whether or not this component has been disposed.
     *
     * @return {boolean}
     *         If the component has been disposed, will be `true`. Otherwise, `false`.
     */
    isDisposed(): boolean;
    /**
     * Return the {@link Player} that the `Component` has attached to.
     *
     * @return { import('./player').default }
     *         The player that this `Component` has attached to.
     */
    player(): import('./player').default;
    /**
     * Deep merge of options objects with new options.
     * > Note: When both `obj` and `options` contain properties whose values are objects.
     *         The two properties get merged using {@link module:obj.merge}
     *
     * @param {Object} obj
     *        The object that contains new options.
     *
     * @return {Object}
     *         A new object of `this.options_` and `obj` merged together.
     */
    options(obj: any): any;
    /**
     * Get the `Component`s DOM element
     *
     * @return {Element}
     *         The DOM element for this `Component`.
     */
    el(): Element;
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
    createEl(tagName?: string, properties?: any, attributes?: any): Element;
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
    localize(string: string, tokens?: string[], defaultValue?: string): string;
    /**
     * Return the `Component`s DOM element. This is where children get inserted.
     * This will usually be the the same as the element returned in {@link Component#el}.
     *
     * @return {Element}
     *         The content element for this `Component`.
     */
    contentEl(): Element;
    /**
     * Get this `Component`s ID
     *
     * @return {string}
     *         The id of this `Component`
     */
    id(): string;
    /**
     * Get the `Component`s name. The name gets used to reference the `Component`
     * and is set during registration.
     *
     * @return {string}
     *         The name of this `Component`.
     */
    name(): string;
    /**
     * Get an array of all child components
     *
     * @return {Array}
     *         The children
     */
    children(): any[];
    /**
     * Returns the child `Component` with the given `id`.
     *
     * @param {string} id
     *        The id of the child `Component` to get.
     *
     * @return {Component|undefined}
     *         The child `Component` with the given `id` or undefined.
     */
    getChildById(id: string): Component | undefined;
    /**
     * Returns the child `Component` with the given `name`.
     *
     * @param {string} name
     *        The name of the child `Component` to get.
     *
     * @return {Component|undefined}
     *         The child `Component` with the given `name` or undefined.
     */
    getChild(name: string): Component | undefined;
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
    getDescendant(...names: any[]): Component | undefined;
    /**
     * Adds an SVG icon element to another element or component.
     *
     * @param {string} iconName
     *        The name of icon. A list of all the icon names can be found at 'sandbox/svg-icons.html'
     *
     * @param {Element} [el=this.el()]
     *        Element to set the title on. Defaults to the current Component's element.
     *
     * @return {Element}
     *        The newly created icon element.
     */
    setIcon(iconName: string, el?: Element): Element;
    iconIsSet_: boolean;
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
    addChild(child: string | Component, options?: any, index?: number): Component;
    /**
     * Remove a child `Component` from this `Component`s list of children. Also removes
     * the child `Component`s element from this `Component`s element.
     *
     * @param {Component} component
     *        The child `Component` to remove.
     */
    removeChild(component: Component): void;
    /**
     * Add and initialize default child `Component`s based upon options.
     */
    initChildren(): void;
    /**
     * Builds the default DOM class name. Should be overridden by sub-components.
     *
     * @return {string}
     *         The DOM class name for this object.
     *
     * @abstract
     */
    buildCSSClass(): string;
    /**
     * Bind a listener to the component's ready state.
     * Different from event listeners in that if the ready event has already happened
     * it will trigger the function immediately.
     *
     * @param {ReadyCallback} fn
     *        Function that gets called when the `Component` is ready.
     *
     * @return {Component}
     *         Returns itself; method can be chained.
     */
    ready(fn: () => any, sync?: boolean): Component;
    readyQueue_: any;
    /**
     * Trigger all the ready listeners for this `Component`.
     *
     * @fires Component#ready
     */
    triggerReady(): void;
    isReady_: boolean;
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
    $(selector: string, context?: Element | string): Element | null;
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
    $$(selector: string, context?: Element | string): NodeList;
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
    hasClass(classToCheck: string): boolean;
    /**
     * Add a CSS class name to the `Component`s element.
     *
     * @param {...string} classesToAdd
     *        One or more CSS class name to add.
     */
    addClass(...classesToAdd: string[]): void;
    /**
     * Remove a CSS class name from the `Component`s element.
     *
     * @param {...string} classesToRemove
     *        One or more CSS class name to remove.
     */
    removeClass(...classesToRemove: string[]): void;
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
    toggleClass(classToToggle: string, predicate: any): void;
    /**
     * Show the `Component`s element if it is hidden by removing the
     * 'vjs-hidden' class name from it.
     */
    show(): void;
    /**
     * Hide the `Component`s element if it is currently showing by adding the
     * 'vjs-hidden` class name to it.
     */
    hide(): void;
    /**
     * Lock a `Component`s element in its visible state by adding the 'vjs-lock-showing'
     * class name to it. Used during fadeIn/fadeOut.
     *
     * @private
     */
    private lockShowing;
    /**
     * Unlock a `Component`s element from its visible state by removing the 'vjs-lock-showing'
     * class name from it. Used during fadeIn/fadeOut.
     *
     * @private
     */
    private unlockShowing;
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
     *         - Most browsers will return null if the attribute does not exist or has
     *           no value.
     *
     * @see [DOM API]{@link https://developer.mozilla.org/en-US/docs/Web/API/Element/getAttribute}
     */
    getAttribute(attribute: string): string | null;
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
    setAttribute(attribute: string, value: string): void;
    /**
     * Remove an attribute from the `Component`s element.
     *
     * @param {string} attribute
     *        Name of the attribute to remove.
     *
     * @see [DOM API]{@link https://developer.mozilla.org/en-US/docs/Web/API/Element/removeAttribute}
     */
    removeAttribute(attribute: string): void;
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
    width(num?: number | string, skipListeners?: boolean): number | string;
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
    height(num?: number | string, skipListeners?: boolean): number | string;
    /**
     * Set both the width and height of the `Component` element at the same time.
     *
     * @param  {number|string} width
     *         Width to set the `Component`s element to.
     *
     * @param  {number|string} height
     *         Height to set the `Component`s element to.
     */
    dimensions(width: number | string, height: number | string): void;
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
    dimension(widthOrHeight: string, num?: number | string, skipListeners?: boolean): number;
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
    currentDimension(widthOrHeight: string): number;
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
    currentDimensions(): Component;
    /**
     * Get the computed width of the component's element.
     *
     * Uses `window.getComputedStyle`.
     *
     * @return {number}
     *         The computed width of the component's element.
     */
    currentWidth(): number;
    /**
     * Get the computed height of the component's element.
     *
     * Uses `window.getComputedStyle`.
     *
     * @return {number}
     *         The computed height of the component's element.
     */
    currentHeight(): number;
    /**
     * Set the focus to this component
     */
    focus(): void;
    /**
     * Remove the focus from this component
     */
    blur(): void;
    /**
     * When this Component receives a `keydown` event which it does not process,
     *  it passes the event to the Player for handling.
     *
     * @param {KeyboardEvent} event
     *        The `keydown` event that caused this function to be called.
     */
    handleKeyDown(event: KeyboardEvent): void;
    /**
     * Many components used to have a `handleKeyPress` method, which was poorly
     * named because it listened to a `keydown` event. This method name now
     * delegates to `handleKeyDown`. This means anyone calling `handleKeyPress`
     * will not see their method calls stop working.
     *
     * @param {Event} event
     *        The event that caused this function to be called.
     */
    handleKeyPress(event: Event): void;
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
    private emitTapEvents;
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
    enableTouchActivity(): void;
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
    setTimeout(fn: any, timeout: number): number;
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
    clearTimeout(timeoutId: number): number;
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
    setInterval(fn: any, interval: number): number;
    /**
     * Clears an interval that gets created via `window.setInterval` or
     * {@link Component#setInterval}. If you set an interval via {@link Component#setInterval}
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
    clearInterval(intervalId: number): number;
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
    requestAnimationFrame(fn: any): number;
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
    requestNamedAnimationFrame(name: string, fn: any): string;
    /**
     * Cancels a current named animation frame if it exists.
     *
     * @param {string} name
     *        The name of the requestAnimationFrame to cancel.
     */
    cancelNamedAnimationFrame(name: string): void;
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
    cancelAnimationFrame(id: number): number;
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
    private clearTimersOnDispose_;
}
//# sourceMappingURL=component.d.ts.map