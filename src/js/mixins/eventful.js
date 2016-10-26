/**
 * @file mixins/eventful.js
 */
import * as Events from '../utils/events';

/**
 * Makes an object "eventful" - granting it methods from the `Events` utility.
 *
 * By default, this adds the `off`, `on`, `one`, and `trigger` methods, but
 * exclusions can optionally be made.
 *
 * @param  {Object} target
 *         The object to which to add event methods.
 *
 * @param  {Array} [exclusions=[]]
 *         An array of methods to exclude from addition to the object.
 *
 * @return {Object}
 *         The target object.
 */
function eventful(target, exclusions = []) {
  ['off', 'on', 'one', 'trigger']
    .filter(name => exclusions.indexOf(name) === -1)
    .forEach(name => {
      target[name] = Events[name].bind(target, target);
    });

  return target;
}

export default eventful;
