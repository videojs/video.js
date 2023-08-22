export default Plugin;
/**
 * ~PluginEventHash
 */
export type Plugin = {
    /**
     *           For basic plugins, the return value of the plugin function. For
     *           advanced plugins, the plugin instance on which the event is fired.
     */
    instance: string;
    /**
     *           The name of the plugin.
     */
    name: string;
    /**
     *           For basic plugins, the plugin function. For advanced plugins, the
     *           plugin class/constructor.
     */
    plugin: string;
};
/**
 * Parent class for all advanced plugins.
 *
 * @mixes   module:evented~EventedMixin
 * @mixes   module:stateful~StatefulMixin
 * @fires   Player#beforepluginsetup
 * @fires   Player#beforepluginsetup:$name
 * @fires   Player#pluginsetup
 * @fires   Player#pluginsetup:$name
 * @listens Player#dispose
 * @throws  {Error}
 *          If attempting to instantiate the base {@link Plugin} class
 *          directly instead of via a sub-class.
 */
declare class Plugin {
    /**
     * Determines if a plugin is a basic plugin (i.e. not a sub-class of `Plugin`).
     *
     * @param   {string|Function} plugin
     *          If a string, matches the name of a plugin. If a function, will be
     *          tested directly.
     *
     * @return {boolean}
     *          Whether or not a plugin is a basic plugin.
     */
    static isBasic(plugin: string | Function): boolean;
    /**
     * Register a Video.js plugin.
     *
     * @param   {string} name
     *          The name of the plugin to be registered. Must be a string and
     *          must not match an existing plugin or a method on the `Player`
     *          prototype.
     *
     * @param   {typeof Plugin|Function} plugin
     *          A sub-class of `Plugin` or a function for basic plugins.
     *
     * @return {typeof Plugin|Function}
     *          For advanced plugins, a factory function for that plugin. For
     *          basic plugins, a wrapper function that initializes the plugin.
     */
    static registerPlugin(name: string, plugin: typeof Plugin | Function): typeof Plugin | Function;
    /**
     * De-register a Video.js plugin.
     *
     * @param  {string} name
     *         The name of the plugin to be de-registered. Must be a string that
     *         matches an existing plugin.
     *
     * @throws {Error}
     *         If an attempt is made to de-register the base plugin.
     */
    static deregisterPlugin(name: string): void;
    /**
     * Gets an object containing multiple Video.js plugins.
     *
     * @param   {Array} [names]
     *          If provided, should be an array of plugin names. Defaults to _all_
     *          plugin names.
     *
     * @return {Object|undefined}
     *          An object containing plugin(s) associated with their name(s) or
     *          `undefined` if no matching plugins exist).
     */
    static getPlugins(names?: any[]): any | undefined;
    /**
     * Gets a plugin's version, if available
     *
     * @param   {string} name
     *          The name of a plugin.
     *
     * @return {string}
     *          The plugin's version or an empty string.
     */
    static getPluginVersion(name: string): string;
    /**
     * Creates an instance of this class.
     *
     * Sub-classes should call `super` to ensure plugins are properly initialized.
     *
     * @param {Player} player
     *        A Video.js player instance.
     */
    constructor(player: Player);
    player: Player;
    log: any;
    /**
     * Disposes a plugin.
     *
     * Subclasses can override this if they want, but for the sake of safety,
     * it's probably best to subscribe the "dispose" event.
     *
     * @fires Plugin#dispose
     */
    dispose(): void;
    /**
     * Get the version of the plugin that was set on <pluginName>.VERSION
     */
    version(): any;
    /**
     * Each event triggered by plugins includes a hash of additional data with
     * conventional properties.
     *
     * This returns that object or mutates an existing hash.
     *
     * @param   {Object} [hash={}]
     *          An object to be used as event an event hash.
     *
     * @return {Plugin~PluginEventHash}
     *          An event hash object with provided properties mixed-in.
     */
    getEventHash(hash?: any): Plugin;
    /**
     * Triggers an event on the plugin object and overrides
     * {@link module:evented~EventedMixin.trigger|EventedMixin.trigger}.
     *
     * @param   {string|Object} event
     *          An event type or an object with a type property.
     *
     * @param   {Object} [hash={}]
     *          Additional data hash to merge with a
     *          {@link Plugin~PluginEventHash|PluginEventHash}.
     *
     * @return {boolean}
     *          Whether or not default was prevented.
     */
    trigger(event: string | any, hash?: any): boolean;
    /**
     * Handles "statechanged" events on the plugin. No-op by default, override by
     * subclassing.
     *
     * @abstract
     * @param    {Event} e
     *           An event object provided by a "statechanged" event.
     *
     * @param    {Object} e.changes
     *           An object describing changes that occurred with the "statechanged"
     *           event.
     */
    handleStateChanged(e: Event): void;
    state: any;
}
declare namespace Plugin {
    export { getPlugin };
    export { BASE_PLUGIN_NAME };
}
import Player from "./player";
/**
 * Get a single registered plugin by name.
 *
 * @private
 * @param   {string} name
 *          The name of a plugin.
 *
 * @return {typeof Plugin|Function|undefined}
 *          The plugin (or undefined).
 */
declare function getPlugin(name: string): typeof Plugin | Function | undefined;
/**
 * The base plugin name.
 *
 * @private
 * @constant
 * @type {string}
 */
declare const BASE_PLUGIN_NAME: string;
//# sourceMappingURL=plugin.d.ts.map