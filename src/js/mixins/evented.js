/**
 * @file mixins/evented.js
 */
import * as Dom from '../utils/dom';
import * as Fn from '../utils/fn';
import * as Events from '../utils/events';

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
   * @param  {String|Array|Element|Object} first
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
   * @param  {String|Array|Function} second
   *         If the first argument was a string or array, this should be the
   *         listener function. Otherwise, this is a string or array of event
   *         type(s).
   *
   * @param  {Function} [third]
   *         If the first argument was another evented object, this will be
   *         the listener function.
   *
   * @return {Object}
   *         Returns the object itself.
   */
  on(first, second, third) {
    // Targeting this evented object.
    if (typeof first === 'string' || Array.isArray(first)) {
      Events.on(this.eventBusEl_, first, Fn.bind(this, second));

    // Targeting another evented object.
    } else {
      const target = first;
      const type = second;
      const listener = Fn.bind(this, third);

      // When this object is disposed, remove the listener from the target.
      const removeOnDispose = () => this.off(target, type, listener);

      // Use the same function ID as the listener so we can remove it later it
      // using the ID of the original listener.
      removeOnDispose.guid = listener.guid;
      this.on('dispose', removeOnDispose);

      // If the target is disposed first, we need to remove the reference to
      // the target in this evented object's `removeOnDispose` listener.
      // Otherwise, we create a memory leak.
      const cleanRemover = () => this.off('dispose', removeOnDispose);

      // Add the same function ID so we can easily remove it later
      cleanRemover.guid = listener.guid;

      // Handle cases where the target is a DOM node.
      if (target.nodeName) {
        Events.on(target, type, listener);
        Events.on(target, 'dispose', cleanRemover);

      // Should be another evented object, which we detect via duck typing.
      } else if (typeof target.on === 'function') {
        target.on(type, listener);
        target.on('dispose', cleanRemover);

      // If the target is not a valid object, throw.
      } else {
        throw new Error('target was not a DOM node or an evented object');
      }
    }

    return this;
  },

  /**
   * Add a listener to an event (or events) on this object or another evented
   * object. The listener will be removed after the first time it is called.
   *
   * @param  {String|Array|Element|Object} first
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
   * @param  {String|Array|Function} second
   *         If the first argument was a string or array, this should be the
   *         listener function. Otherwise, this is a string or array of event
   *         type(s).
   *
   * @param  {Function} [third]
   *         If the first argument was another evented object, this will be
   *         the listener function.
   *
   * @return {Object}
   *         Returns the object itself.
   */
  one(first, second, third) {

    // Targeting this evented object.
    if (typeof first === 'string' || Array.isArray(first)) {
      Events.one(this.eventBusEl_, first, Fn.bind(this, second));

    // Targeting another evented object.
    } else {
      const target = first;
      const type = second;
      const listener = Fn.bind(this, third);

      const wrapper = (...args) => {
        this.off(target, type, wrapper);
        listener.apply(null, args);
      };

      // Keep the same function ID so we can remove it later
      wrapper.guid = listener.guid;
      this.on(target, type, wrapper);
    }

    return this;
  },

  /**
   * Removes listeners from events on an evented object.
   *
   * @param  {String|Array|Element|Object} [first]
   *         If this is a string or array, it represents an event type(s)
   *         from which to remove the listener.
   *
   *         Another evented object can be passed here instead, which will
   *         remove the listener from THAT object.
   *
   *         If no arguments are passed at all, ALL listeners will be removed
   *         from this evented object.
   *
   * @param  {String|Array|Function} [second]
   *         If the first argument was a string or array, this should be the
   *         listener function. Otherwise, this is a string or array of event
   *         type(s).
   *
   * @param  {Function} [third]
   *         If the first argument was another evented object, this will be
   *         the listener function.
   *
   * @return {Object}
   *         Returns the object itself.
   */
  off(first, second, third) {

    // Targeting this evented object.
    if (!first || typeof first === 'string' || Array.isArray(first)) {
      Events.off(this.eventBusEl_, first, second);

    // Targeting another evented object.
    } else {
      const target = first;
      const type = second;

      // Ensure there's at least a guid, even if the function hasn't been used
      const listener = Fn.bind(this, third);

      // Remove the dispose listener on this evented object, which was given
      // the same guid as the event listener in on().
      this.off('dispose', listener);

      // Handle cases where the target is a DOM node.
      if (first.nodeName) {
        Events.off(target, type, listener);
        Events.off(target, 'dispose', listener);

      // Should be another evented object, which we detect via duck typing.
      } else if (typeof target.off === 'function') {
        target.off(type, listener);
        target.off('dispose', listener);

      // If the target is not a valid object, throw.
      } else {
        throw new Error('target was not a DOM node or an evented object');
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

  return target;
}

export default evented;
