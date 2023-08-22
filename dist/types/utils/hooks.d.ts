/**
 * An Object that contains lifecycle hooks as keys which point to an array
 * of functions that are run when a lifecycle is triggered
 *
 * @private
 */
export const hooks_: {};
/**
 * Get a list of hooks for a specific lifecycle
 *
 * @param  {string} type
 *         the lifecycle to get hooks from
 *
 * @param  {Function|Function[]} [fn]
 *         Optionally add a hook (or hooks) to the lifecycle that your are getting.
 *
 * @return {Array}
 *         an array of hooks, or an empty array if there are none.
 */
export function hooks(type: string, fn?: Function | Function[]): any[];
/**
 * Add a function hook to a specific videojs lifecycle.
 *
 * @param {string} type
 *        the lifecycle to hook the function to.
 *
 * @param {Function|Function[]}
 *        The function or array of functions to attach.
 */
export function hook(type: string, fn: any): void;
/**
 * Add a function hook that will only run once to a specific videojs lifecycle.
 *
 * @param {string} type
 *        the lifecycle to hook the function to.
 *
 * @param {Function|Function[]}
 *        The function or array of functions to attach.
 */
export function hookOnce(type: string, fn: any): void;
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
export function removeHook(type: string, fn: Function): boolean;
//# sourceMappingURL=hooks.d.ts.map