/**
 * @file src/js/event-target.js
 */
import * as Events from './utils/events.js';
import window from 'global/window';

let EVENT_MAP;

/**
 * `EventTarget` is a class that can have the same API as the DOM `EventTarget`. It
 * adds shorthand functions that wrap around lengthy functions. For example:
 * the `on` function is a wrapper around `addEventListener`.
 *
 * @see [EventTarget Spec]{@link https://www.w3.org/TR/DOM-Level-2-Events/events.html#Events-EventTarget}
 * @class EventTarget
 */
class EventTarget {
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
  on(type, fn) {
    // Remove the addEventListener alias before calling Events.on
    // so we don't get into an infinite type loop
    const ael = this.addEventListener;

    this.addEventListener = () => { };
    Events.on(this, type, fn);
    this.addEventListener = ael;
  }
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
  off(type, fn) {
    Events.off(this, type, fn);
  }
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
  one(type, fn) {
    // Remove the addEventListener aliasing Events.on
    // so we don't get into an infinite type loop
    const ael = this.addEventListener;

    this.addEventListener = () => { };
    Events.one(this, type, fn);
    this.addEventListener = ael;
  }
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
  any(type, fn) {
    // Remove the addEventListener aliasing Events.on
    // so we don't get into an infinite type loop
    const ael = this.addEventListener;

    this.addEventListener = () => { };
    Events.any(this, type, fn);
    this.addEventListener = ael;
  }
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
  trigger(event) {
    const type = event.type || event;

    // deprecation
    // In a future version we should default target to `this`
    // similar to how we default the target to `elem` in
    // `Events.trigger`. Right now the default `target` will be
    // `document` due to the `Event.fixEvent` call.
    if (typeof event === 'string') {
      event = { type };
    }
    event = Events.fixEvent(event);

    if (this.allowedEvents_[type] && this['on' + type]) {
      this['on' + type](event);
    }

    Events.trigger(this, event);
  }
  queueTrigger(event) {
    // only set up EVENT_MAP if it'll be used
    if (!EVENT_MAP) {
      EVENT_MAP = new Map();
    }

    const type = event.type || event;
    let map = EVENT_MAP.get(this);

    if (!map) {
      map = new Map();
      EVENT_MAP.set(this, map);
    }

    const oldTimeout = map.get(type);

    map.delete(type);
    window.clearTimeout(oldTimeout);

    const timeout = window.setTimeout(() => {
      map.delete(type);
      // if we cleared out all timeouts for the current target, delete its map
      if (map.size === 0) {
        map = null;
        EVENT_MAP.delete(this);
      }

      this.trigger(event);
    }, 0);

    map.set(type, timeout);
  }
}

/**
 * A Custom DOM event.
 *
 * @typedef {CustomEvent} Event
 * @see [Properties]{@link https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent}
 */

/**
 * All event listeners should follow the following format.
 *
 * @callback EventListener
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
 * @protected
 */
EventTarget.prototype.allowedEvents_ = {};

/**
 * An alias of {@link EventTarget#on}. Allows `EventTarget` to mimic
 * the standard DOM API.
 *
 * @function
 * @see {@link EventTarget#on}
 */
EventTarget.prototype.addEventListener = EventTarget.prototype.on;

/**
 * An alias of {@link EventTarget#off}. Allows `EventTarget` to mimic
 * the standard DOM API.
 *
 * @function
 * @see {@link EventTarget#off}
 */
EventTarget.prototype.removeEventListener = EventTarget.prototype.off;

/**
 * An alias of {@link EventTarget#trigger}. Allows `EventTarget` to mimic
 * the standard DOM API.
 *
 * @function
 * @see {@link EventTarget#trigger}
 */
EventTarget.prototype.dispatchEvent = EventTarget.prototype.trigger;

export default EventTarget;
