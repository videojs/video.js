/**
 * A middleware object is a plain JavaScript object that has methods that
 * match the {@link Tech} methods found in the lists of allowed
 * {@link module:middleware.allowedGetters|getters},
 * {@link module:middleware.allowedSetters|setters}, and
 * {@link module:middleware.allowedMediators|mediators}.
 *
 * @typedef {Object} MiddlewareObject
 */
/**
 * A middleware factory function that should return a
 * {@link module:middleware~MiddlewareObject|MiddlewareObject}.
 *
 * This factory will be called for each player when needed, with the player
 * passed in as an argument.
 *
 * @callback MiddlewareFactory
 * @param { import('../player').default } player
 *        A Video.js player.
 */
/**
 * Define a middleware that the player should use by way of a factory function
 * that returns a middleware object.
 *
 * @param  {string} type
 *         The MIME type to match or `"*"` for all MIME types.
 *
 * @param  {MiddlewareFactory} middleware
 *         A middleware factory function that will be executed for
 *         matching types.
 */
export function use(type: string, middleware: MiddlewareFactory): void;
/**
 * Gets middlewares by type (or all middlewares).
 *
 * @param  {string} type
 *         The MIME type to match or `"*"` for all MIME types.
 *
 * @return {Function[]|undefined}
 *         An array of middlewares or `undefined` if none exist.
 */
export function getMiddleware(type: string): Function[] | undefined;
/**
 * Asynchronously sets a source using middleware by recursing through any
 * matching middlewares and calling `setSource` on each, passing along the
 * previous returned value each time.
 *
 * @param  { import('../player').default } player
 *         A {@link Player} instance.
 *
 * @param  {Tech~SourceObject} src
 *         A source object.
 *
 * @param  {Function}
 *         The next middleware to run.
 */
export function setSource(player: import('../player').default, src: any, next: any): void;
/**
 * When the tech is set, passes the tech to each middleware's `setTech` method.
 *
 * @param {Object[]} middleware
 *        An array of middleware instances.
 *
 * @param { import('../tech/tech').default } tech
 *        A Video.js tech.
 */
export function setTech(middleware: any[], tech: import('../tech/tech').default): void;
/**
 * Calls a getter on the tech first, through each middleware
 * from right to left to the player.
 *
 * @param  {Object[]} middleware
 *         An array of middleware instances.
 *
 * @param  { import('../tech/tech').default } tech
 *         The current tech.
 *
 * @param  {string} method
 *         A method name.
 *
 * @return {*}
 *         The final value from the tech after middleware has intercepted it.
 */
export function get(middleware: any[], tech: import('../tech/tech').default, method: string): any;
/**
 * Takes the argument given to the player and calls the setter method on each
 * middleware from left to right to the tech.
 *
 * @param  {Object[]} middleware
 *         An array of middleware instances.
 *
 * @param  { import('../tech/tech').default } tech
 *         The current tech.
 *
 * @param  {string} method
 *         A method name.
 *
 * @param  {*} arg
 *         The value to set on the tech.
 *
 * @return {*}
 *         The return value of the `method` of the `tech`.
 */
export function set(middleware: any[], tech: import('../tech/tech').default, method: string, arg: any): any;
/**
 * Takes the argument given to the player and calls the `call` version of the
 * method on each middleware from left to right.
 *
 * Then, call the passed in method on the tech and return the result unchanged
 * back to the player, through middleware, this time from right to left.
 *
 * @param  {Object[]} middleware
 *         An array of middleware instances.
 *
 * @param  { import('../tech/tech').default } tech
 *         The current tech.
 *
 * @param  {string} method
 *         A method name.
 *
 * @param  {*} arg
 *         The value to set on the tech.
 *
 * @return {*}
 *         The return value of the `method` of the `tech`, regardless of the
 *         return values of middlewares.
 */
export function mediate(middleware: any[], tech: import('../tech/tech').default, method: string, arg?: any): any;
/**
 * Clear the middleware cache for a player.
 *
 * @param  { import('../player').default } player
 *         A {@link Player} instance.
 */
export function clearCacheForPlayer(player: import('../player').default): void;
export const TERMINATOR: {};
/**
 * Enumeration of allowed getters where the keys are method names.
 *
 * @type {Object}
 */
export const allowedGetters: any;
/**
 * Enumeration of allowed setters where the keys are method names.
 *
 * @type {Object}
 */
export const allowedSetters: any;
/**
 * Enumeration of allowed mediators where the keys are method names.
 *
 * @type {Object}
 */
export const allowedMediators: any;
/**
 * A middleware object is a plain JavaScript object that has methods that
 * match the {@link Tech } methods found in the lists of allowed
 * {@link module :middleware.allowedGetters|getters},
 * {@link module :middleware.allowedSetters|setters}, and
 * {@link module :middleware.allowedMediators|mediators}.
 */
export type MiddlewareObject = any;
/**
 * A middleware factory function that should return a
 * {@link module :middleware~MiddlewareObject|MiddlewareObject}.
 *
 * This factory will be called for each player when needed, with the player
 * passed in as an argument.
 */
export type MiddlewareFactory = (player: import('../player').default) => any;
//# sourceMappingURL=middleware.d.ts.map