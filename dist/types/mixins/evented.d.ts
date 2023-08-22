export default evented;
/**
 * Applies {@link module:evented~EventedMixin|EventedMixin} to a target object.
 *
 * @param  {Object} target
 *         The object to which to add event methods.
 *
 * @param  {Object} [options={}]
 *         Options for customizing the mixin behavior.
 *
 * @param  {string} [options.eventBusKey]
 *         By default, adds a `eventBusEl_` DOM element to the target object,
 *         which is used as an event bus. If the target object already has a
 *         DOM element that should be used, pass its key here.
 *
 * @return {Object}
 *         The target object.
 */
declare function evented(target: any, options?: {
    eventBusKey?: string;
}): any;
/**
 * Returns whether or not an object has had the evented mixin applied.
 *
 * @param  {Object} object
 *         An object to test.
 *
 * @return {boolean}
 *         Whether or not the object appears to be evented.
 */
export function isEvented(object: any): boolean;
/**
 * Adds a callback to run after the evented mixin applied.
 *
 * @param  {Object} target
 *         An object to Add
 * @param  {Function} callback
 *         The callback to run.
 */
export function addEventedCallback(target: any, callback: Function): void;
//# sourceMappingURL=evented.d.ts.map