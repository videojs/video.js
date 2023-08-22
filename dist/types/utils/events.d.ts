/**
 * Fix a native event to have standard property values
 *
 * @param {Object} event
 *        Event object to fix.
 *
 * @return {Object}
 *         Fixed event object.
 */
export function fixEvent(event: any): any;
/**
 * Add an event listener to element
 * It stores the handler function in a separate cache object
 * and adds a generic handler to the element's event,
 * along with a unique id (guid) to the element.
 *
 * @param {Element|Object} elem
 *        Element or object to bind listeners to
 *
 * @param {string|string[]} type
 *        Type of event to bind to.
 *
 * @param {Function} fn
 *        Event listener.
 */
export function on(elem: Element | any, type: string | string[], fn: Function): void;
/**
 * Removes event listeners from an element
 *
 * @param {Element|Object} elem
 *        Object to remove listeners from.
 *
 * @param {string|string[]} [type]
 *        Type of listener to remove. Don't include to remove all events from element.
 *
 * @param {Function} [fn]
 *        Specific listener to remove. Don't include to remove listeners for an event
 *        type.
 */
export function off(elem: Element | any, type?: string | string[], fn?: Function): void;
/**
 * Trigger an event for an element
 *
 * @param {Element|Object} elem
 *        Element to trigger an event on
 *
 * @param {EventTarget~Event|string} event
 *        A string (the type) or an event object with a type attribute
 *
 * @param {Object} [hash]
 *        data hash to pass along with the event
 *
 * @return {boolean|undefined}
 *         Returns the opposite of `defaultPrevented` if default was
 *         prevented. Otherwise, returns `undefined`
 */
export function trigger(elem: Element | any, event: any, hash?: any): boolean | undefined;
/**
 * Trigger a listener only once for an event.
 *
 * @param {Element|Object} elem
 *        Element or object to bind to.
 *
 * @param {string|string[]} type
 *        Name/type of event
 *
 * @param {Event~EventListener} fn
 *        Event listener function
 */
export function one(elem: Element | any, type: string | string[], fn: any): void;
/**
 * Trigger a listener only once and then turn if off for all
 * configured events
 *
 * @param {Element|Object} elem
 *        Element or object to bind to.
 *
 * @param {string|string[]} type
 *        Name/type of event
 *
 * @param {Event~EventListener} fn
 *        Event listener function
 */
export function any(elem: Element | any, type: string | string[], fn: any): void;
//# sourceMappingURL=events.d.ts.map