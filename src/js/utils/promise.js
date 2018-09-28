
/**
 * Returns whether an object is `Promise`-like (i.e. has a `then` method).
 *
 * @param  {Object}  value
 *         An object that may or may not be `Promise`-like.
 *
 * @return {boolean}
 *         Whether or not the object is `Promise`-like.
 */
export function isPromise(value) {
  return value !== undefined && value !== null && typeof value.then === 'function';
}

/**
 * Silence a Promise-like object.
 *
 * This is useful for avoiding non-harmful, but potentially confusing "uncaught
 * play promise" rejection error messages.
 *
 * @param  {Object} value
 *         An object that may or may not be `Promise`-like.
 */
export function silencePromise(value) {
  if (isPromise(value)) {
    value.then(null, (e) => {});
  }
}
