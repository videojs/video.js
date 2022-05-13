/**
 * @file deprecate.js
 * @module deprecate
 */
import log from './log.js';

/**
 * Decorate a function with a deprecation message the first time it is called.
 *
 * @param  {string}   message
 *         A deprecation message to log the first time the returned function
 *         is called.
 *
 * @param  {Function} fn
 *         The function to be deprecated.
 *
 * @return {Function}
 *         A wrapper function that will log a deprecation warning the first
 *         time it is called. The return value will be the return value of
 *         the wrapped function.
 */
export default function deprecate(message, fn) {
  let warned = false;

  return function(...args) {
    if (!warned) {
      log.warn(message);
    }

    warned = true;

    return fn.apply(this, args);
  };
}
