/**
 * Whether the current DOM interface appears to be real (i.e. not simulated).
 *
 * @return {boolean}
 *         Will be `true` if the DOM appears to be real, `false` otherwise.
 */
export function isReal(): boolean;
/**
 * Determines, via duck typing, whether or not a value is a DOM element.
 *
 * @param  {*} value
 *         The value to check.
 *
 * @return {boolean}
 *         Will be `true` if the value is a DOM element, `false` otherwise.
 */
export function isEl(value: any): boolean;
/**
 * Determines if the current DOM is embedded in an iframe.
 *
 * @return {boolean}
 *         Will be `true` if the DOM is embedded in an iframe, `false`
 *         otherwise.
 */
export function isInFrame(): boolean;
/**
 * Creates an element and applies properties, attributes, and inserts content.
 *
 * @param  {string} [tagName='div']
 *         Name of tag to be created.
 *
 * @param  {Object} [properties={}]
 *         Element properties to be applied.
 *
 * @param  {Object} [attributes={}]
 *         Element attributes to be applied.
 *
 * @param {ContentDescriptor} [content]
 *        A content descriptor object.
 *
 * @return {Element}
 *         The element that was created.
 */
export function createEl(tagName?: string, properties?: any, attributes?: any, content?: ContentDescriptor): Element;
/**
 * Injects text into an element, replacing any existing contents entirely.
 *
 * @param  {HTMLElement} el
 *         The element to add text content into
 *
 * @param  {string} text
 *         The text content to add.
 *
 * @return {Element}
 *         The element with added text content.
 */
export function textContent(el: HTMLElement, text: string): Element;
/**
 * Insert an element as the first child node of another
 *
 * @param {Element} child
 *        Element to insert
 *
 * @param {Element} parent
 *        Element to insert child into
 */
export function prependTo(child: Element, parent: Element): void;
/**
 * Check if an element has a class name.
 *
 * @param  {Element} element
 *         Element to check
 *
 * @param  {string} classToCheck
 *         Class name to check for
 *
 * @return {boolean}
 *         Will be `true` if the element has a class, `false` otherwise.
 *
 * @throws {Error}
 *         Throws an error if `classToCheck` has white space.
 */
export function hasClass(element: Element, classToCheck: string): boolean;
/**
 * Add a class name to an element.
 *
 * @param  {Element} element
 *         Element to add class name to.
 *
 * @param  {...string} classesToAdd
 *         One or more class name to add.
 *
 * @return {Element}
 *         The DOM element with the added class name.
 */
export function addClass(element: Element, ...classesToAdd: string[]): Element;
/**
 * Remove a class name from an element.
 *
 * @param  {Element} element
 *         Element to remove a class name from.
 *
 * @param  {...string} classesToRemove
 *         One or more class name to remove.
 *
 * @return {Element}
 *         The DOM element with class name removed.
 */
export function removeClass(element: Element, ...classesToRemove: string[]): Element;
/**
 * The callback definition for toggleClass.
 *
 * @callback module:dom~PredicateCallback
 * @param    {Element} element
 *           The DOM element of the Component.
 *
 * @param    {string} classToToggle
 *           The `className` that wants to be toggled
 *
 * @return   {boolean|undefined}
 *           If `true` is returned, the `classToToggle` will be added to the
 *           `element`. If `false`, the `classToToggle` will be removed from
 *           the `element`. If `undefined`, the callback will be ignored.
 */
/**
 * Adds or removes a class name to/from an element depending on an optional
 * condition or the presence/absence of the class name.
 *
 * @param  {Element} element
 *         The element to toggle a class name on.
 *
 * @param  {string} classToToggle
 *         The class that should be toggled.
 *
 * @param  {boolean|module:dom~PredicateCallback} [predicate]
 *         See the return value for {@link module:dom~PredicateCallback}
 *
 * @return {Element}
 *         The element with a class that has been toggled.
 */
export function toggleClass(element: Element, classToToggle: string, predicate: any): Element;
/**
 * Apply attributes to an HTML element.
 *
 * @param {Element} el
 *        Element to add attributes to.
 *
 * @param {Object} [attributes]
 *        Attributes to be applied.
 */
export function setAttributes(el: Element, attributes?: any): void;
/**
 * Get an element's attribute values, as defined on the HTML tag.
 *
 * Attributes are not the same as properties. They're defined on the tag
 * or with setAttribute.
 *
 * @param  {Element} tag
 *         Element from which to get tag attributes.
 *
 * @return {Object}
 *         All attributes of the element. Boolean attributes will be `true` or
 *         `false`, others will be strings.
 */
export function getAttributes(tag: Element): any;
/**
 * Get the value of an element's attribute.
 *
 * @param {Element} el
 *        A DOM element.
 *
 * @param {string} attribute
 *        Attribute to get the value of.
 *
 * @return {string}
 *         The value of the attribute.
 */
export function getAttribute(el: Element, attribute: string): string;
/**
 * Set the value of an element's attribute.
 *
 * @param {Element} el
 *        A DOM element.
 *
 * @param {string} attribute
 *        Attribute to set.
 *
 * @param {string} value
 *        Value to set the attribute to.
 */
export function setAttribute(el: Element, attribute: string, value: string): void;
/**
 * Remove an element's attribute.
 *
 * @param {Element} el
 *        A DOM element.
 *
 * @param {string} attribute
 *        Attribute to remove.
 */
export function removeAttribute(el: Element, attribute: string): void;
/**
 * Attempt to block the ability to select text.
 */
export function blockTextSelection(): void;
/**
 * Turn off text selection blocking.
 */
export function unblockTextSelection(): void;
/**
 * Identical to the native `getBoundingClientRect` function, but ensures that
 * the method is supported at all (it is in all browsers we claim to support)
 * and that the element is in the DOM before continuing.
 *
 * This wrapper function also shims properties which are not provided by some
 * older browsers (namely, IE8).
 *
 * Additionally, some browsers do not support adding properties to a
 * `ClientRect`/`DOMRect` object; so, we shallow-copy it with the standard
 * properties (except `x` and `y` which are not widely supported). This helps
 * avoid implementations where keys are non-enumerable.
 *
 * @param  {Element} el
 *         Element whose `ClientRect` we want to calculate.
 *
 * @return {Object|undefined}
 *         Always returns a plain object - or `undefined` if it cannot.
 */
export function getBoundingClientRect(el: Element): any | undefined;
/**
 * Represents the position of a DOM element on the page.
 *
 * @typedef  {Object} module:dom~Position
 *
 * @property {number} left
 *           Pixels to the left.
 *
 * @property {number} top
 *           Pixels from the top.
 */
/**
 * Get the position of an element in the DOM.
 *
 * Uses `getBoundingClientRect` technique from John Resig.
 *
 * @see http://ejohn.org/blog/getboundingclientrect-is-awesome/
 *
 * @param  {Element} el
 *         Element from which to get offset.
 *
 * @return {module:dom~Position}
 *         The position of the element that was passed in.
 */
export function findPosition(el: Element): any;
/**
 * Represents x and y coordinates for a DOM element or mouse pointer.
 *
 * @typedef  {Object} module:dom~Coordinates
 *
 * @property {number} x
 *           x coordinate in pixels
 *
 * @property {number} y
 *           y coordinate in pixels
 */
/**
 * Get the pointer position within an element.
 *
 * The base on the coordinates are the bottom left of the element.
 *
 * @param  {Element} el
 *         Element on which to get the pointer position on.
 *
 * @param  {Event} event
 *         Event object.
 *
 * @return {module:dom~Coordinates}
 *         A coordinates object corresponding to the mouse position.
 *
 */
export function getPointerPosition(el: Element, event: Event): any;
/**
 * Determines, via duck typing, whether or not a value is a text node.
 *
 * @param  {*} value
 *         Check if this value is a text node.
 *
 * @return {boolean}
 *         Will be `true` if the value is a text node, `false` otherwise.
 */
export function isTextNode(value: any): boolean;
/**
 * Empties the contents of an element.
 *
 * @param  {Element} el
 *         The element to empty children from
 *
 * @return {Element}
 *         The element with no children
 */
export function emptyEl(el: Element): Element;
/**
 * This is a mixed value that describes content to be injected into the DOM
 * via some method. It can be of the following types:
 *
 * Type       | Description
 * -----------|-------------
 * `string`   | The value will be normalized into a text node.
 * `Element`  | The value will be accepted as-is.
 * `Text`     | A TextNode. The value will be accepted as-is.
 * `Array`    | A one-dimensional array of strings, elements, text nodes, or functions. These functions should return a string, element, or text node (any other return value, like an array, will be ignored).
 * `Function` | A function, which is expected to return a string, element, text node, or array - any of the other possible values described above. This means that a content descriptor could be a function that returns an array of functions, but those second-level functions must return strings, elements, or text nodes.
 *
 * @typedef {string|Element|Text|Array|Function} ContentDescriptor
 */
/**
 * Normalizes content for eventual insertion into the DOM.
 *
 * This allows a wide range of content definition methods, but helps protect
 * from falling into the trap of simply writing to `innerHTML`, which could
 * be an XSS concern.
 *
 * The content for an element can be passed in multiple types and
 * combinations, whose behavior is as follows:
 *
 * @param {ContentDescriptor} content
 *        A content descriptor value.
 *
 * @return {Array}
 *         All of the content that was passed in, normalized to an array of
 *         elements or text nodes.
 */
export function normalizeContent(content: ContentDescriptor): any[];
/**
 * Normalizes and appends content to an element.
 *
 * @param  {Element} el
 *         Element to append normalized content to.
 *
 * @param {ContentDescriptor} content
 *        A content descriptor value.
 *
 * @return {Element}
 *         The element with appended normalized content.
 */
export function appendContent(el: Element, content: ContentDescriptor): Element;
/**
 * Normalizes and inserts content into an element; this is identical to
 * `appendContent()`, except it empties the element first.
 *
 * @param {Element} el
 *        Element to insert normalized content into.
 *
 * @param {ContentDescriptor} content
 *        A content descriptor value.
 *
 * @return {Element}
 *         The element with inserted normalized content.
 */
export function insertContent(el: Element, content: ContentDescriptor): Element;
/**
 * Check if an event was a single left click.
 *
 * @param  {MouseEvent} event
 *         Event object.
 *
 * @return {boolean}
 *         Will be `true` if a single left click, `false` otherwise.
 */
export function isSingleLeftClick(event: MouseEvent): boolean;
/**
 * A safe getComputedStyle.
 *
 * This is needed because in Firefox, if the player is loaded in an iframe with
 * `display:none`, then `getComputedStyle` returns `null`, so, we do a
 * null-check to make sure that the player doesn't break in these cases.
 *
 * @param    {Element} el
 *           The element you want the computed style of
 *
 * @param    {string} prop
 *           The property name you want
 *
 * @see      https://bugzilla.mozilla.org/show_bug.cgi?id=548397
 */
export function computedStyle(el: Element, prop: string): any;
/**
 * Copy document style sheets to another window.
 *
 * @param    {Window} win
 *           The window element you want to copy the document style sheets to.
 *
 */
export function copyStyleSheetsToWindow(win: Window): void;
/**
 * Finds a single DOM element matching `selector` within the optional
 * `context` of another DOM element (defaulting to `document`).
 *
 * @param  {string} selector
 *         A valid CSS selector, which will be passed to `querySelector`.
 *
 * @param  {Element|String} [context=document]
 *         A DOM element within which to query. Can also be a selector
 *         string in which case the first matching element will be used
 *         as context. If missing (or no element matches selector), falls
 *         back to `document`.
 *
 * @return {Element|null}
 *         The element that was found or null.
 */
export const $: Function;
/**
 * Finds a all DOM elements matching `selector` within the optional
 * `context` of another DOM element (defaulting to `document`).
 *
 * @param  {string} selector
 *         A valid CSS selector, which will be passed to `querySelectorAll`.
 *
 * @param  {Element|String} [context=document]
 *         A DOM element within which to query. Can also be a selector
 *         string in which case the first matching element will be used
 *         as context. If missing (or no element matches selector), falls
 *         back to `document`.
 *
 * @return {NodeList}
 *         A element list of elements that were found. Will be empty if none
 *         were found.
 *
 */
export const $$: Function;
/**
 * :dom~PredicateCallback
 */
export type module = (element: Element, classToToggle: string) => boolean | undefined;
/**
 * This is a mixed value that describes content to be injected into the DOM
 * via some method. It can be of the following types:
 *
 * Type       | Description
 * -----------|-------------
 * `string`   | The value will be normalized into a text node.
 * `Element`  | The value will be accepted as-is.
 * `Text`     | A TextNode. The value will be accepted as-is.
 * `Array`    | A one-dimensional array of strings, elements, text nodes, or functions. These functions should return a string, element, or text node (any other return value, like an array, will be ignored).
 * `Function` | A function, which is expected to return a string, element, text node, or array - any of the other possible values described above. This means that a content descriptor could be a function that returns an array of functions, but those second-level functions must return strings, elements, or text nodes.
 */
export type ContentDescriptor = string | Element | Text | any[] | Function;
//# sourceMappingURL=dom.d.ts.map