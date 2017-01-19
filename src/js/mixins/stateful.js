/**
 * @file mixins/stateful.js
 * @module stateful
 */
import {isEvented} from './evented';
import * as Obj from '../utils/obj';

/**
 * Contains methods that provide statefulness to an object which is passed
 * to {@link module:stateful}.
 *
 * @mixin StatefulMixin
 */
const StatefulMixin = {

  /**
   * A hash containing arbitrary keys and values representing the state of
   * the object.
   *
   * @type {Object}
   */
  state: {},

  /**
   * Set the state of an object by mutating its
   * {@link module:stateful~StatefulMixin.state|state} object in place.
   *
   * @fires   module:stateful~StatefulMixin#statechanged
   * @param   {Object|Function} stateUpdates
   *          A new set of properties to shallow-merge into the plugin state.
   *          Can be a plain object or a function returning a plain object.
   *
   * @returns {Object|undefined}
   *          An object containing changes that occurred. If no changes
   *          occurred, returns `undefined`.
   */
  setState(stateUpdates) {

    // Support providing the `stateUpdates` state as a function.
    if (typeof stateUpdates === 'function') {
      stateUpdates = stateUpdates();
    }

    let changes;

    Obj.each(stateUpdates, (value, key) => {

      // Record the change if the value is different from what's in the
      // current state.
      if (this.state[key] !== value) {
        changes = changes || {};
        changes[key] = {
          from: this.state[key],
          to: value
        };
      }

      this.state[key] = value;
    });

    // Only trigger "statechange" if there were changes AND we have a trigger
    // function. This allows us to not require that the target object be an
    // evented object.
    if (changes && isEvented(this)) {

      /**
       * An event triggered on an object that is both
       * {@link module:stateful|stateful} and {@link module:evented|evented}
       * indicating that its state has changed.
       *
       * @event    module:stateful~StatefulMixin#statechanged
       * @type     {Object}
       * @property {Object} changes
       *           A hash containing the properties that were changed and
       *           the values they were changed `from` and `to`.
       */
      this.trigger({
        changes,
        type: 'statechanged'
      });
    }

    return changes;
  }
};

/**
 * Applies {@link module:stateful~StatefulMixin|StatefulMixin} to a target
 * object.
 *
 * If the target object is {@link module:evented|evented} and has a
 * `handleStateChanged` method, that method will be automatically bound to the
 * `statechanged` event on itself.
 *
 * @param   {Object} target
 *          The object to be made stateful.
 *
 * @param   {Object} [defaultState]
 *          A default set of properties to populate the newly-stateful object's
 *          `state` property.
 *
 * @returns {Object}
 *          Returns the `target`.
 */
function stateful(target, defaultState) {
  Obj.assign(target, StatefulMixin);

  // This happens after the mixing-in because we need to replace the `state`
  // added in that step.
  target.state = Obj.assign({}, target.state, defaultState);

  // Auto-bind the `handleStateChanged` method of the target object if it exists.
  if (typeof target.handleStateChanged === 'function' && isEvented(target)) {
    target.on('statechanged', target.handleStateChanged);
  }

  return target;
}

export default stateful;
