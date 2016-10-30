/**
 * @file mixins/evented.js
 */
import * as Dom from '../utils/dom';
import * as Fn from '../utils/fn';
import * as Events from '../utils/events';

/**
 * Returns whether or not an object has had the evented mixin applied.
 *
 * @private
 * @param  {Object} object
 * @return {Boolean}
 */
const isEvented = (object) =>
  !!object.eventBusEl_ &&
  ['on', 'one', 'off', 'trigger'].every(k => typeof object[k] === 'function');

/**
 * Whether a value is a valid event type - non-empty string or array.
 *
 * @param  {String|Array} type
 * @return {Boolean}
 */
const isValidEventType = (type) =>
  (typeof type === 'string' && (/\S/).test(type)) ||
  (Array.isArray(type) && !!type.length);

/**
 * Validates a value to determine if it is a valid event target. Throws if not.
 *
 * @throws {Error}
 * @param  {Object} target
 */
const validateTarget = (target) => {
  if (!target.nodeName && !isEvented(target)) {
    throw new Error('invalid target; must be a DOM node or evented object');
  }
};

/**
 * Validates a value to determine if it is a valid event target. Throws if not.
 *
 * @throws {Error}
 * @param  {String|Array} type
 */
const validateEventType = (type) => {
  if (!isValidEventType(type)) {
    throw new Error('invalid event type; must be a non-empty string or array');
  }
};

/**
 * Validates a value to determine if it is a valid listener. Throws if not.
 *
 * @throws Error
 * @param  {Function} listener
 */
const validateListener = (listener) => {
  if (typeof listener !== 'function') {
    throw new Error('invalid listener; must be a function');
  }
};

/**
 * Takes an array of arguments given to on() or one(), validates them, and
 * normalizes them into an object.
 *
 * @throws Error
 * @param  {Object} self
 *         The evented object on which on() or one() was called.
 *
 * @param  {Array} args
 *         An array of arguments passed to on() or one().
 *
 * @return {Object}
 */
const normalizeListenArgs = (self, args) => {

  // If the number of arguments is less than 3, the target is always the
  // evented object itself.
  const isTargetingSelf = args.length < 3 || args[0] === self || args[0] === self.eventBusEl_;
  let target;
  let type;
  let listener;

  if (isTargetingSelf) {
    target = self.eventBusEl_;

    // Deal with cases where we got 3 arguments, but we are still listening to
    // the evented object itself.
    if (args.length >= 3) {
      args.shift();
    }

    [type, listener] = args;
  } else {
    [target, type, listener] = args;
  }

  validateTarget(target);
  validateEventType(type);
  validateListener(listener);

  listener = Fn.bind(self, listener);

  return {isTargetingSelf, target, type, listener};
};

/**
 * Adds the listener to the event type(s) on the target, normalizing for
 * the type of target.
 *
 * @private
 * @throws {Error} If unable to add the listener
 * @param  {Element|Object} target
 *         A DOM node or evented object.
 *
 * @param  {String|Array} type
 *         One or more event type(s).
 *
 * @param  {Function} listener
 *         A listener function.
 *
 * @param  {String} [method="on"]
 *         The event binding method to use.
 */
const listen = (target, type, listener, method = 'on') => {
  validateTarget(target);

  if (target.nodeName) {
    Events[method](target, type, listener);
  } else {
    target[method](type, listener);
  }
};

/**
 * Methods that can be mixed-in with any object to provide event capabilities.
 *
 * @name mixins/evented
 * @type {Object}
 */
const mixin = {

  /**
   * Add a listener to an event (or events) on this object or another evented
   * object.
   *
   * @param  {String|Array|Element|Object} targetOrType
   *         If this is a string or array, it represents an event type(s) and
   *         the listener will be bound to this object.
   *
   *         Another evented object can be passed here instead, which will
   *         bind a listener to the given event(s) being triggered on THAT
   *         object.
   *
   *         In either case, the listener's `this` value will be bound to
   *         this object.
   *
   * @param  {String|Array|Function} typeOrListener
   *         If the first argument was a string or array, this should be the
   *         listener function. Otherwise, this is a string or array of event
   *         type(s).
   *
   * @param  {Function} [listener]
   *         If the first argument was another evented object, this will be
   *         the listener function.
   *
   * @return {Object}
   *         Returns the object itself.
   */
  on(...args) {
    const {isTargetingSelf, target, type, listener} = normalizeListenArgs(this, args);

    listen(target, type, listener);

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

      listen(this, 'dispose', removeListenerOnDispose);
      listen(target, 'dispose', removeRemoverOnTargetDispose);
    }

    return this;
  },

  /**
   * Add a listener to an event (or events) on this object or another evented
   * object. The listener will only be called once and then removed.
   *
   * @param  {String|Array|Element|Object} targetOrType
   *         If this is a string or array, it represents an event type(s) and
   *         the listener will be bound to this object.
   *
   *         Another evented object can be passed here instead, which will
   *         bind a listener to the given event(s) being triggered on THAT
   *         object.
   *
   *         In either case, the listener's `this` value will be bound to
   *         this object.
   *
   * @param  {String|Array|Function} typeOrListener
   *         If the first argument was a string or array, this should be the
   *         listener function. Otherwise, this is a string or array of event
   *         type(s).
   *
   * @param  {Function} [listener]
   *         If the first argument was another evented object, this will be
   *         the listener function.
   *
   * @return {Object}
   *         Returns the object itself.
   */
  one(...args) {
    const {isTargetingSelf, target, type, listener} = normalizeListenArgs(this, args);

    // Targeting this evented object.
    if (isTargetingSelf) {
      listen(target, type, listener, 'one');

    // Targeting another evented object.
    } else {
      const wrapper = (...largs) => {
        this.off(target, type, wrapper);
        listener.apply(null, largs);
      };

      // Use the same function ID as the listener so we can remove it later
      // it using the ID of the original listener.
      wrapper.guid = listener.guid;
      listen(target, type, wrapper, 'one');
    }

    return this;
  },

  /**
   * Removes listeners from events on an evented object.
   *
   * @param  {String|Array|Element|Object} [targetOrType]
   *         If this is a string or array, it represents an event type(s).
   *
   *         Another evented object can be passed here instead, in which case
   *         ALL 3 arguments are REQUIRED.
   *
   * @param  {String|Array|Function} [typeOrListener]
   *         If the first argument was a string or array, this should be the
   *         listener function. Otherwise, this is a string or array of event
   *         type(s).
   *
   * @param  {Function} [listener]
   *         If the first argument was another evented object, this will be
   *         the listener function.
   *
   * @return {Object}
   *         Returns the object itself.
   */
  off(targetOrType, typeOrListener, listener) {

    // Targeting this evented object.
    if (!targetOrType || isValidEventType(targetOrType)) {
      Events.off(this.eventBusEl_, targetOrType, typeOrListener);

    // Targeting another evented object.
    } else {
      const target = targetOrType;
      const type = typeOrListener;

      // Fail fast and in a meaningful way!
      validateTarget(target);
      validateEventType(type);
      validateListener(listener);

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

    return this;
  },

  /**
   * Fire an event on this evented object.
   *
   * @param  {String|Object} event
   *         An event type or an object with a type property.
   *
   * @param  {Object} [hash]
   *         An additional object to pass along to listeners.
   *
   * @return {Object}
   *         Returns the object itself.
   */
  trigger(event, hash) {
    Events.trigger(this.eventBusEl_, event, hash);
    return this;
  }
};

/**
 * Makes an object "evented" - granting it methods from the `Events` utility.
 *
 * By default, this adds the `off`, `on`, `one`, and `trigger` methods, but
 * exclusions can optionally be made.
 *
 * @param  {Object} target
 *         The object to which to add event methods.
 *
 * @param  {Object} [options]
 *         Options for customizing the mixin behavior.
 *
 * @param  {Array} [options.exclude=[]]
 *         An array of methods to exclude from addition to the object.
 *
 * @param  {String} [options.eventBusKey]
 *         By default, adds a `eventBusEl_` DOM element to the target object,
 *         which is used as an event bus. If the target object already has a
 *         DOM element that should be used, pass its key here.
 *
 * @return {Object}
 *         The target object.
 */
function evented(target, options = {}) {
  const {exclude, eventBusKey} = options;

  // Set or create the eventBusEl_.
  if (eventBusKey) {
    if (!target[eventBusKey].nodeName) {
      throw new Error(`eventBusKey "${eventBusKey}" does not refer to an element`);
    }
    target.eventBusEl_ = target[eventBusKey];
  } else {
    target.eventBusEl_ = Dom.createEl('span', {className: 'vjs-event-bus'});
  }

  // Add the mixin methods with whichever exclusions were requested.
  ['off', 'on', 'one', 'trigger']
    .filter(name => !exclude || exclude.indexOf(name) === -1)
    .forEach(name => {
      target[name] = Fn.bind(target, mixin[name]);
    });

  // When any evented object is disposed, it removes all its listeners.
  target.on('dispose', () => target.off());

  return target;
}

export default evented;
