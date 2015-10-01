import log from './log.js';

/**
 * Object containing the default behaviors for available handler methods.
 *
 * @private
 * @type {Object}
 */
const defaultBehaviors = {
  get(obj, key) {
    return obj[key];
  },
  set(obj, key, value) {
    obj[key] = value;
    return true;
  }
};

/**
 * Expose private objects publicly using a Proxy to log deprecation warnings.
 *
 * Browsers that do not support Proxy objects will simply return the `target`
 * object, so it can be directly exposed.
 *
 * @param {Object} target The target object.
 * @param {Object} messages Messages to display from a Proxy. Only operations
 *                          with an associated message will be proxied.
 * @param {String} [messages.get]
 * @param {String} [messages.set]
 * @return {Object} A Proxy if supported or the `target` argument.
 */
export default (target, messages={}) => {
  if (typeof Proxy === 'function') {
    let handler = {};

    // Build a handler object based on those keys that have both messages
    // and default behaviors.
    Object.keys(messages).forEach(key => {
      if (defaultBehaviors.hasOwnProperty(key)) {
        handler[key] = function() {
          log.warn(messages[key]);
          return defaultBehaviors[key].apply(this, arguments);
        };
      }
    });

    return new Proxy(target, handler);
  }
  return target;
};
