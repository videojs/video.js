/**
 * @file mixins/evented.js
 * @module evented
 */
import * as Dom from '../utils/dom';
import * as Events from '../utils/events';
import * as Fn from '../utils/fn';
import * as Obj from '../utils/obj';

/**
 * Returns whether or not an object has had the evented mixin applied.
 *
 * @param  {Object} object
 *         An object to test.
 *
 * @return {boolean}
 *         Whether or not the object appears to be evented.
 */
const isEvented = (object) =>
  typeof object.eventBusKey_ === 'string' &&
  (/\S/).test(object.eventBusKey_) &&
  ['on', 'one', 'off', 'trigger'].every(k => typeof object[k] === 'function');

/**
 * Whether a value is a valid event type - non-empty string or array.
 *
 * @private
 * @param  {string|Array} type
 *         The type value to test.
 *
 * @return {boolean}
 *         Whether or not the type is a valid event type.
 */
const isValidEventType = (type) =>
  // The regex here verifies that the `type` contains at least one non-
  // whitespace character.
  (typeof type === 'string' && (/\S/).test(type)) ||
  (Array.isArray(type) && !!type.length);

/**
 * Validates common on/off arguments.
 *
 * @private
 * @throws {Error}
 *         If any argument is not valid.
 *
 * @param  {Object} target
 *         A value to be tested to determine if it is a valid event target.
 *
 * @param  {string|string[]}
 *         A value to be tested to determine if it is a valid event type.
 *
 * @param  {Function} listener
 *         A value to be tested to determine if it is a valid event listener.
 */
const validate = (target, type, listener) => {
  if (!target || (!Events.canHaveListeners(target) && !isEvented(target))) {
    throw new Error('Invalid target; must be a DOM node or evented object.');
  }

  if (!isValidEventType(type)) {
    throw new Error('Invalid event type; must be a non-empty string or array.');
  }

  if (typeof listener !== 'function') {
    throw new Error('Invalid listener; must be a function.');
  }
};

/**
 * Takes an array of arguments given to `on()` or `one()`, validates them, and
 * normalizes them into an object.
 *
 * @private
 * @param  {Object} self
 *         The evented object on which `on()` or `one()` was called. This
 *         object will be bound as the `this` value for the listener.
 *
 * @param  {Array} args
 *         An array of arguments passed to `on()` or `one()`.
 *
 * @return {Object}
 *         An object containing useful values for `on()` or `one()` calls.
 */
const normalizeListenArgs = (self, args) => {
  const eventBusEl = self.getEventBusEl_();

  // If the number of arguments is less than 3, the target is always the
  // evented object itself.
  const isTargetingSelf = args.length < 3 || args[0] === self || args[0] === eventBusEl;
  let target;
  let type;
  let listener;

  if (isTargetingSelf) {
    target = eventBusEl;

    // Deal with cases where we got 3 arguments, but we are still listening to
    // the evented object itself.
    if (args.length >= 3) {
      args.shift();
    }

    [type, listener] = args;
  } else {
    [target, type, listener] = args;
  }

  validate(target, type, listener);

  listener = Fn.bind(self, listener);

  return {isTargetingSelf, target, type, listener};
};

/**
 * Adds the listener to the event type(s) on the target, normalizing for
 * the type of target.
 *
 * @private
 * @param  {Element|Object} target
 *         A DOM node or evented object.
 *
 * @param  {string} method
 *         The event binding method to use ("on" or "one").
 *
 * @param  {string|Array} type
 *         One or more event type(s).
 *
 * @param  {Function} listener
 *         A listener function.
 */
const listen = (target, method, type, listener) => {
  if (Events.canHaveListeners(target)) {
    Events[method](target, type, listener);
  } else {
    target[method](type, listener);
  }
};

/**
 * Contains methods that provide event capabilites to an object which is passed
 * to {@link module:evented|evented}.
 *
 * @mixin EventedMixin
 */
const EventedMixin = {

  /**
   * Returns an evented object's "event bus" element - this element acts as a
   * conduit for events triggered on the evented object.
   *
   * An event bus element is necessary because the underlying events system
   * relies on a DOM element behind the scenes to function.
   *
   * @return {Element}
   */
  getEventBusEl_() {
    if (Events.canHaveListeners(this[this.eventBusKey_])) {
      return this[this.eventBusKey_];
    }
  },

  /**
   * Add a listener to an event (or events) on this object or another evented
   * object.
   *
   * @param  {string|Array|Element|Object} targetOrType
   *         If this is a string or array, it represents the event type(s)
   *         that will trigger the listener.
   *
   *         Another evented object can be passed here instead, which will
   *         cause the listener to listen for events on _that_ object.
   *
   *         In either case, the listener's `this` value will be bound to
   *         this object.
   *
   * @param  {string|Array|Function} typeOrListener
   *         If the first argument was a string or array, this should be the
   *         listener function. Otherwise, this is a string or array of event
   *         type(s).
   *
   * @param  {Function} [listener]
   *         If the first argument was another evented object, this will be
   *         the listener function.
   */
  on(...args) {
    const {isTargetingSelf, target, type, listener} = normalizeListenArgs(this, args);

    listen(target, 'on', type, listener);

    // If this object is listening to another evented object.
    if (!isTargetingSelf) {

      // If this object is disposed, remove the listener.
      const removeListenerOnDispose = () => this.off(target, type, listener);

      // Use the same function ID as the listener so we can remove it later it
      // using the ID of the original listener.
      removeListenerOnDispose.guid = listener.guid;

      // Add a listener to the target's dispose event as well. This ensures
      // that if the target is disposed BEFORE this object, we remove the
      // removal listener that was just added. Otherwise, we create a memory leak.
      const removeRemoverOnTargetDispose = () => this.off('dispose', removeListenerOnDispose);

      // Use the same function ID as the listener so we can remove it later
      // it using the ID of the original listener.
      removeRemoverOnTargetDispose.guid = listener.guid;

      listen(this, 'on', 'dispose', removeListenerOnDispose);
      listen(target, 'on', 'dispose', removeRemoverOnTargetDispose);
    }
  },

  /**
   * Add a listener to an event (or events) on this object or another evented
   * object. The listener will only be called once and then removed.
   *
   * @param  {string|Array|Element|Object} targetOrType
   *         If this is a string or array, it represents the event type(s)
   *         that will trigger the listener.
   *
   *         Another evented object can be passed here instead, which will
   *         cause the listener to listen for events on _that_ object.
   *
   *         In either case, the listener's `this` value will be bound to
   *         this object.
   *
   * @param  {string|Array|Function} typeOrListener
   *         If the first argument was a string or array, this should be the
   *         listener function. Otherwise, this is a string or array of event
   *         type(s).
   *
   * @param  {Function} [listener]
   *         If the first argument was another evented object, this will be
   *         the listener function.
   */
  one(...args) {
    const {isTargetingSelf, target, type, listener} = normalizeListenArgs(this, args);

    // Targeting this evented object.
    if (isTargetingSelf) {
      listen(target, 'one', type, listener);

    // Targeting another evented object.
    } else {
      const wrapper = (...largs) => {
        this.off(target, type, wrapper);
        listener.apply(null, largs);
      };

      // Use the same function ID as the listener so we can remove it later
      // it using the ID of the original listener.
      wrapper.guid = listener.guid;
      listen(target, 'one', type, wrapper);
    }
  },

  /**
   * Removes listener(s) from event(s) on an evented object.
   *
   * @param  {string|Array|Element|Object} [targetOrType]
   *         If this is a string or array, it represents the event type(s).
   *
   *         Another evented object can be passed here instead, in which case
   *         ALL 3 arguments are _required_.
   *
   * @param  {string|Array|Function} [typeOrListener]
   *         If the first argument was a string or array, this may be the
   *         listener function. Otherwise, this is a string or array of event
   *         type(s).
   *
   * @param  {Function} [listener]
   *         If the first argument was another evented object, this will be
   *         the listener function; otherwise, _all_ listeners bound to the
   *         event type(s) will be removed.
   */
  off(targetOrType, typeOrListener, listener) {

    // Targeting this evented object.
    if (!targetOrType || isValidEventType(targetOrType)) {
      Events.off(this.getEventBusEl_(), targetOrType, typeOrListener);

    // Targeting another evented object.
    } else {
      const target = targetOrType;
      const type = typeOrListener;

      // Fail fast and in a meaningful way!
      validate(target, type, listener);

      // Ensure there's at least a guid, even if the function hasn't been used
      listener = Fn.bind(this, listener);

      // Remove the dispose listener on this evented object, which was given
      // the same guid as the event listener in on().
      this.off('dispose', listener);

      if (target.nodeName) {
        Events.off(target, type, listener);
        Events.off(target, 'dispose', listener);
      } else if (isEvented(target)) {
        target.off(type, listener);
        target.off('dispose', listener);
      }
    }
  },

  /**
   * Fire an event on this evented object, causing its listeners to be called.
   *
   * @param   {string|Object} event
   *          An event type or an object with a type property.
   *
   * @param   {Object} [hash]
   *          An additional object to pass along to listeners.
   *
   * @returns {boolean}
   *          Whether or not the default behavior was prevented.
   */
  trigger(event, hash) {
    return Events.trigger(this.getEventBusEl_(), event, hash);
  }
};

/**
 * Applies {@link module:evented~EventedMixin|EventedMixin} to a target object.
 *
 * @param  {Object} target
 *         The object to which to add event methods.
 *
 * @param  {Object} [options={}]
 *         Options for customizing the mixin behavior.
 *
 * @param  {string} [options.eventBusKey]
 *         By default, an evented object will have an element created for it
 *         to act as an "event bus". However, for most use-cases (such as with
 *         components), we want to use a pre-existing element in the live DOM.
 *
 *         For those cases, an optional key can be provided, which represents
 *         the property on the target object containing an element to use as
 *         an event bus. We use a string here to support cases where the actual
 *         DOM element may change.
 *
 * @return {Object}
 *         The target object.
 */
function evented(target, options = {}) {

  // If an eventBusKey is provided, use it. We assume then that the element has
  // either been created or will be created before binding any listeners.
  if (options.eventBusKey) {
    target.eventBusKey_ = options.eventBusKey;

  // If no eventBusKey is provided, create an event bus element.
  } else {
    target.eventBusKey_ = 'eventBusEl_';
    target[target.eventBusKey_] = Dom.createEl('span', {className: 'vjs-event-bus'});
  }

  Obj.assign(target, EventedMixin);

  return target;
}

export default evented;
export {isEvented};
