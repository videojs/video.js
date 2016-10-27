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
    if (!Dom.isEl(target[eventBusKey])) {
      throw new Error(`eventBusKey "${eventBusKey}" does not refer to an element`);
    }
    target.eventBusEl_ = target[eventBusKey];
  } else {
    target.eventBusEl_ = Dom.createEl('span', {className: 'vjs-event-bus'});
  }

  ['off', 'on', 'one', 'trigger']
    .filter(name => !exclude || exclude.indexOf(name) === -1)
    .forEach(name => {
      target[name] = (...args) => {
        return Events[name](...[target.eventBusEl_, ...args]);
      };
    });

  return target;
}

export default evented;
