/**
 * @file fn.js
 * @module fn
 */
import { newGUID } from './guid.js';

/**
 * Bind (a.k.a proxy or Context). A simple method for changing the context of a function
 * It also stores a unique id on the function so it can be easily removed from events.
 *
 * @param {Mixed} context
 *        The object to bind as scope.
 *
 * @param {Function} fn
 *        The function to be bound to a scope.
 *
 * @param {number} [uid]
 *        An optional unique ID for the function to be set
 *
 * @return {Function}
 *         The new function that will be bound into the context given
 */
export const bind = function(context, fn, uid) {
  // Make sure the function has a unique ID
  if (!fn.guid) {
    fn.guid = newGUID();
  }

  // Create the new function that changes the context
  const bound = function() {
    return fn.apply(context, arguments);
  };

  // Allow for the ability to individualize this function
  // Needed in the case where multiple objects might share the same prototype
  // IF both items add an event listener with the same function, then you try to remove just one
  // it will remove both because they both have the same guid.
  // when using this, you need to use the bind method when you remove the listener as well.
  // currently used in text tracks
  bound.guid = (uid) ? uid + '_' + fn.guid : fn.guid;

  return bound;
};

/**
 * Wraps the given function, `fn`, with a new function that only invokes `fn`
 * at most once per every `wait` milliseconds.
 *
 * @param  {Function} fn
 *         The function to be throttled.
 *
 * @param  {Number}   wait
 *         The number of milliseconds by which to throttle.
 *
 * @return {Function}
 */
export const throttle = function(fn, wait) {
  let last = Date.now();

  const throttled = function(...args) {
    const now = Date.now();

    if (now - last >= wait) {
      fn(...args);
      last = now;
    }
  };

  return throttled;
};
