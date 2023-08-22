export default EventTarget;
/**
 * A Custom DOM event.
 */
export type Event = CustomEvent;
/**
 * ~EventListener
 */
export type EventTarget = () => any;
/**
 * `EventTarget` is a class that can have the same API as the DOM `EventTarget`. It
 * adds shorthand functions that wrap around lengthy functions. For example:
 * the `on` function is a wrapper around `addEventListener`.
 *
 * @see [EventTarget Spec]{@link https://www.w3.org/TR/DOM-Level-2-Events/events.html#Events-EventTarget}
 * @class EventTarget
 */
declare class EventTarget {
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
    addEventListener: any;
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
     * @param {string|EventTarget~Event|Object} event
     *        The name of the event, an `Event`, or an object with a key of type set to
     *        an event name.
     */
    trigger(event: any): void;
    queueTrigger(event: any): void;
    /**
     * A Custom DOM event.
     *
     * @typedef {CustomEvent} Event
     * @see [Properties]{@link https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent}
     */
    /**
     * All event listeners should follow the following format.
     *
     * @callback EventTarget~EventListener
     * @this {EventTarget}
     *
     * @param {Event} event
     *        the event that triggered this function
     *
     * @param {Object} [hash]
     *        hash of data sent during the event
     */
    /**
     * An object containing event names as keys and booleans as values.
     *
     * > NOTE: If an event name is set to a true value here {@link EventTarget#trigger}
     *         will have extra functionality. See that function for more information.
     *
     * @property EventTarget.prototype.allowedEvents_
     * @private
     */
    private allowedEvents_;
    /**
     * An alias of {@link EventTarget#off}. Allows `EventTarget` to mimic
     * the standard DOM API.
     *
     * @function
     * @see {@link EventTarget#off}
     */
    removeEventListener: (type: string | string[], fn: Function) => void;
    /**
     * An alias of {@link EventTarget#trigger}. Allows `EventTarget` to mimic
     * the standard DOM API.
     *
     * @function
     * @see {@link EventTarget#trigger}
     */
    dispatchEvent: (event: any) => void;
}
//# sourceMappingURL=event-target.d.ts.map