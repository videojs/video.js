/**
 * Array-like iteration for objects.
 *
 * @param {Object} object
 *        The object to iterate over
 *
 * @param {obj:EachCallback} fn
 *        The callback function which is called for each key in the object.
 */
export function each(object: any, fn: any): void;
/**
 * Array-like reduce for objects.
 *
 * @param {Object} object
 *        The Object that you want to reduce.
 *
 * @param {Function} fn
 *         A callback function which is called for each key in the object. It
 *         receives the accumulated value and the per-iteration value and key
 *         as arguments.
 *
 * @param {*} [initial = 0]
 *        Starting value
 *
 * @return {*}
 *         The final accumulated value.
 */
export function reduce(object: any, fn: Function, initial?: any): any;
/**
 * Returns whether a value is an object of any kind - including DOM nodes,
 * arrays, regular expressions, etc. Not functions, though.
 *
 * This avoids the gotcha where using `typeof` on a `null` value
 * results in `'object'`.
 *
 * @param  {Object} value
 * @return {boolean}
 */
export function isObject(value: any): boolean;
/**
 * Returns whether an object appears to be a "plain" object - that is, a
 * direct instance of `Object`.
 *
 * @param  {Object} value
 * @return {boolean}
 */
export function isPlain(value: any): boolean;
/**
 * Merge two objects recursively.
 *
 * Performs a deep merge like
 * {@link https://lodash.com/docs/4.17.10#merge|lodash.merge}, but only merges
 * plain objects (not arrays, elements, or anything else).
 *
 * Non-plain object values will be copied directly from the right-most
 * argument.
 *
 * @param   {Object[]} sources
 *          One or more objects to merge into a new object.
 *
 * @return {Object}
 *          A new object that is the merged result of all sources.
 */
export function merge(...sources: any[]): any;
/**
 * Returns an array of values for a given object
 *
 * @param  {Object} source - target object
 * @return {Array<unknown>} - object values
 */
export function values(source?: any): Array<unknown>;
/**
 * Object.defineProperty but "lazy", which means that the value is only set after
 * it is retrieved the first time, rather than being set right away.
 *
 * @param {Object} obj the object to set the property on
 * @param {string} key the key for the property to set
 * @param {Function} getValue the function used to get the value when it is needed.
 * @param {boolean} setter whether a setter should be allowed or not
 */
export function defineLazyProperty(obj: any, key: string, getValue: Function, setter?: boolean): any;
/**
 * :EachCallback
 */
export type obj = (value: any, key: string) => any;
//# sourceMappingURL=obj.d.ts.map