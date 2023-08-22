export default function createLogger(name: any): {
    (...args: any[]): void;
    /**
     * Create a new sublogger which chains the old name to the new name.
     *
     * For example, doing `videojs.log.createLogger('player')` and then using that logger will log the following:
     * ```js
     *  mylogger('foo');
     *  // > VIDEOJS: player: foo
     * ```
     *
     * @param {string} name
     *        The name to add call the new logger
     * @return {Object}
     */
    createLogger(subname: any): any;
    /**
     * Enumeration of available logging levels, where the keys are the level names
     * and the values are `|`-separated strings containing logging methods allowed
     * in that logging level. These strings are used to create a regular expression
     * matching the function name being called.
     *
     * Levels provided by Video.js are:
     *
     * - `off`: Matches no calls. Any value that can be cast to `false` will have
     *   this effect. The most restrictive.
     * - `all`: Matches only Video.js-provided functions (`debug`, `log`,
     *   `log.warn`, and `log.error`).
     * - `debug`: Matches `log.debug`, `log`, `log.warn`, and `log.error` calls.
     * - `info` (default): Matches `log`, `log.warn`, and `log.error` calls.
     * - `warn`: Matches `log.warn` and `log.error` calls.
     * - `error`: Matches only `log.error` calls.
     *
     * @type {Object}
     */
    levels: any;
    /**
     * Get or set the current logging level.
     *
     * If a string matching a key from {@link module:log.levels} is provided, acts
     * as a setter.
     *
     * @param  {string} [lvl]
     *         Pass a valid level to set a new logging level.
     *
     * @return {string}
     *         The current logging level.
     */
    level(lvl?: string): string;
    /**
     * Returns an array containing everything that has been logged to the history.
     *
     * This array is a shallow clone of the internal history record. However, its
     * contents are _not_ cloned; so, mutating objects inside this array will
     * mutate them in history.
     *
     * @return {Array}
     */
    history: {
        (): any[];
        /**
         * Allows you to filter the history by the given logger name
         *
         * @param {string} fname
         *        The name to filter by
         *
         * @return {Array}
         *         The filtered list to return
         */
        filter(fname: string): any[];
        /**
         * Clears the internal history tracking, but does not prevent further history
         * tracking.
         */
        clear(): void;
        /**
         * Disable history tracking if it is currently enabled.
         */
        disable(): void;
        /**
         * Enable history tracking if it is currently disabled.
         */
        enable(): void;
    };
    /**
     * Logs error messages. Similar to `console.error`.
     *
     * @param {...*} args
     *        One or more messages or objects that should be logged as an error
     */
    error(...args: any[]): any;
    /**
     * Logs warning messages. Similar to `console.warn`.
     *
     * @param {...*} args
     *        One or more messages or objects that should be logged as a warning.
     */
    warn(...args: any[]): any;
    /**
     * Logs debug messages. Similar to `console.debug`, but may also act as a comparable
     * log if `console.debug` is not available
     *
     * @param {...*} args
     *        One or more messages or objects that should be logged as debug.
     */
    debug(...args: any[]): any;
};
//# sourceMappingURL=create-logger.d.ts.map