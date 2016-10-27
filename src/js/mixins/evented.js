/**
 * @file mixins/evented.js
 */
import * as Dom from '../utils/dom';
import * as Events from '../utils/events';

/**
 * Makes an object "evented" - granting it methods from the `Events` utility.
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
function evented(target, exclusions = []) {
  ['off', 'on', 'one', 'trigger']
    .filter(name => exclusions.indexOf(name) === -1)
    .forEach(name => {
      target.eventBusEl_ = target.el_ || Dom.createEl('span', {className: 'vjs-event-bus'});
      target[name] = (...args) => Events[name](...[target.eventBusEl_, ...args]);
    });

  return target;
}

export default evented;
