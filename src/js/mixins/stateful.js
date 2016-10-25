/**
 * @file mixins/stateful.js
 */
import * as Fn from '../utils/fn';
import log from '../utils/log';
import * as Obj from '../utils/obj';

/**
 * Set the state of an object by mutating its `state` object in place.
 *
 * @param  {Object|Function} next
 *         A new set of properties to shallow-merge into the plugin state. Can
 *         be a plain object or a function returning a plain object.
 *
 * @return {Object}
 *         An object containing changes that occured. If no changes occurred,
 *         returns `undefined`.
 *
 */
const setState = function(next) {
  if (typeof next === 'function') {
    next = next();
  }

  if (!Obj.isPlain(next)) {
    log.warn('non-plain object passed to `setState`', next);
    return;
  }

  let changes;

  Obj.each(next, (value, key) => {

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
  if (changes && typeof this.trigger === 'function') {
    this.trigger({
      changes,
      type: 'statechanged'
    });
  }

  return changes;
};

/**
 * Makes an object "stateful" - granting it a `state` property containing
 * arbitrary keys/values and a `setState` method which will trigger state
 * changes if the object has a `trigger` method.
 *
 * @param  {Object} object
 * @return {Object}
 *         Returns the `object`.
 */
function stateful(target, defaultState) {
  target.state = Obj.assign({}, defaultState);
  target.setState = Fn.bind(target, setState);
  return target;
}

export default stateful;
