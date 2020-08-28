/**
 * @file fn.js
 * @module fn
 */
import { newGUID } from './guid.js';
import window from 'global/window';

export const UPDATE_REFRESH_INTERVAL = 30;

/**
 * Bind (a.k.a proxy or context). A simple method for changing the context of
 * a function.
 *
 * It also stores a unique id on the function so it can be easily removed from
 * events.
 *
 * @function
 * @param    {Mixed} context
 *           The object to bind as scope.
 *
 * @param    {Function} fn
 *           The function to be bound to a scope.
 *
 * @param    {number} [uid]
 *           An optional unique ID for the function to be set
 *
 * @return   {Function}
 *           The new function that will be bound into the context given
 */
export const bind = function(context, fn, uid) {
  // Make sure the function has a unique ID
  if (!fn.guid) {
    fn.guid = newGUID();
  }

  // Create the new function that changes the context
  const bound = fn.bind(context);

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
 * @function
 * @param    {Function} fn
 *           The function to be throttled.
 *
 * @param    {number}   wait
 *           The number of milliseconds by which to throttle.
 *
 * @return   {Function}
 */
export const throttle = function(fn, wait) {
  let last = window.performance.now();

  const throttled = function(...args) {
    const now = window.performance.now();

    if (now - last >= wait) {
      fn(...args);
      last = now;
    }
  };

  return throttled;
};

/**
 * Creates a debounced function that delays invoking `func` until after `wait`
 * milliseconds have elapsed since the last time the debounced function was
 * invoked.
 *
 * Inspired by lodash and underscore implementations.
 *
 * @function
 * @param    {Function} func
 *           The function to wrap with debounce behavior.
 *
 * @param    {number} wait
 *           The number of milliseconds to wait after the last invocation.
 *
 * @param    {boolean} [immediate]
 *           Whether or not to invoke the function immediately upon creation.
 *
 * @param    {Object} [context=window]
 *           The "context" in which the debounced function should debounce. For
 *           example, if this function should be tied to a Video.js player,
 *           the player can be passed here. Alternatively, defaults to the
 *           global `window` object.
 *
 * @return   {Function}
 *           A debounced function.
 */
export const debounce = function(func, wait, immediate, context = window) {
  let timeout;

  const cancel = () => {
    context.clearTimeout(timeout);
    timeout = null;
  };

  /* eslint-disable consistent-this */
  const debounced = function() {
    const self = this;
    const args = arguments;

    let later = function() {
      timeout = null;
      later = null;
      if (!immediate) {
        func.apply(self, args);
      }
    };

    if (!timeout && immediate) {
      func.apply(self, args);
    }

    context.clearTimeout(timeout);
    timeout = context.setTimeout(later, wait);
  };
  /* eslint-enable consistent-this */

  debounced.cancel = cancel;

  return debounced;
};
