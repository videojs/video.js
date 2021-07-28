/**
 * An Object that contains lifecycle hooks as keys which point to an array
 * of functions that are run when a lifecycle is triggered
 *
 * @private
 */
const hooks_ = {};

/**
 * Get a list of hooks for a specific lifecycle
 *
 * @param  {string} type
 *         the lifecyle to get hooks from
 *
 * @param  {Function|Function[]} [fn]
 *         Optionally add a hook (or hooks) to the lifecycle that your are getting.
 *
 * @return {Array}
 *         an array of hooks, or an empty array if there are none.
 */
const hooks = function(type, fn) {
  hooks_[type] = hooks_[type] || [];
  if (fn) {
    hooks_[type] = hooks_[type].concat(fn);
  }
  return hooks_[type];
};

/**
 * Add a function hook to a specific videojs lifecycle.
 *
 * @param {string} type
 *        the lifecycle to hook the function to.
 *
 * @param {Function|Function[]}
 *        The function or array of functions to attach.
 */
const hook = function(type, fn) {
  hooks(type, fn);
};

/**
 * Remove a hook from a specific videojs lifecycle.
 *
 * @param  {string} type
 *         the lifecycle that the function hooked to
 *
 * @param  {Function} fn
 *         The hooked function to remove
 *
 * @return {boolean}
 *         The function that was removed or undef
 */
const removeHook = function(type, fn) {
  const index = hooks(type).indexOf(fn);

  if (index <= -1) {
    return false;
  }

  hooks_[type] = hooks_[type].slice();
  hooks_[type].splice(index, 1);

  return true;
};

/**
 * Add a function hook that will only run once to a specific videojs lifecycle.
 *
 * @param {string} type
 *        the lifecycle to hook the function to.
 *
 * @param {Function|Function[]}
 *        The function or array of functions to attach.
 */
const hookOnce = function(type, fn) {
  hooks(type, [].concat(fn).map(original => {
    const wrapper = (...args) => {
      removeHook(type, wrapper);
      return original(...args);
    };

    return wrapper;
  }));
};

export {
  hooks_,
  hooks,
  hook,
  hookOnce,
  removeHook
};
