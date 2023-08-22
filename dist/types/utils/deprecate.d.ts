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
export function deprecate(message: string, fn: Function): Function;
/**
 * Internal function used to mark a function as deprecated in the next major
 * version with consistent messaging.
 *
 * @param  {number}   major   The major version where it will be removed
 * @param  {string}   oldName The old function name
 * @param  {string}   newName The new function name
 * @param  {Function} fn      The function to deprecate
 * @return {Function}         The decorated function
 */
export function deprecateForMajor(major: number, oldName: string, newName: string, fn: Function): Function;
//# sourceMappingURL=deprecate.d.ts.map