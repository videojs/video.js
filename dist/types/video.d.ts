export default videojs;
/**
 * A callback that is called when a component is ready. Does not have any
 * parameters and any callback value will be ignored. See: {@link Component ~ReadyCallback}
 */
export type ReadyCallback = () => any;
/**
 * A callback that is called when a component is ready. Does not have any
 * parameters and any callback value will be ignored. See: {@link Component~ReadyCallback}
 *
 * @callback ReadyCallback
 */
/**
 * The `videojs()` function doubles as the main function for users to create a
 * {@link Player} instance as well as the main library namespace.
 *
 * It can also be used as a getter for a pre-existing {@link Player} instance.
 * However, we _strongly_ recommend using `videojs.getPlayer()` for this
 * purpose because it avoids any potential for unintended initialization.
 *
 * Due to [limitations](https://github.com/jsdoc3/jsdoc/issues/955#issuecomment-313829149)
 * of our JSDoc template, we cannot properly document this as both a function
 * and a namespace, so its function signature is documented here.
 *
 * #### Arguments
 * ##### id
 * string|Element, **required**
 *
 * Video element or video element ID.
 *
 * ##### options
 * Object, optional
 *
 * Options object for providing settings.
 * See: [Options Guide](https://docs.videojs.com/tutorial-options.html).
 *
 * ##### ready
 * {@link Component~ReadyCallback}, optional
 *
 * A function to be called when the {@link Player} and {@link Tech} are ready.
 *
 * #### Return Value
 *
 * The `videojs()` function returns a {@link Player} instance.
 *
 * @namespace
 *
 * @borrows AudioTrack as AudioTrack
 * @borrows Component.getComponent as getComponent
 * @borrows module:events.on as on
 * @borrows module:events.one as one
 * @borrows module:events.off as off
 * @borrows module:events.trigger as trigger
 * @borrows EventTarget as EventTarget
 * @borrows module:middleware.use as use
 * @borrows Player.players as players
 * @borrows Plugin.registerPlugin as registerPlugin
 * @borrows Plugin.deregisterPlugin as deregisterPlugin
 * @borrows Plugin.getPlugins as getPlugins
 * @borrows Plugin.getPlugin as getPlugin
 * @borrows Plugin.getPluginVersion as getPluginVersion
 * @borrows Tech.getTech as getTech
 * @borrows Tech.registerTech as registerTech
 * @borrows TextTrack as TextTrack
 * @borrows VideoTrack as VideoTrack
 *
 * @param  {string|Element} id
 *         Video element or video element ID.
 *
 * @param  {Object} [options]
 *         Options object for providing settings.
 *         See: [Options Guide](https://docs.videojs.com/tutorial-options.html).
 *
 * @param  {ReadyCallback} [ready]
 *         A function to be called when the {@link Player} and {@link Tech} are
 *         ready.
 *
 * @return {Player}
 *         The `videojs()` function returns a {@link Player|Player} instance.
 */
declare function videojs(id: string | Element, options?: any, ready?: ReadyCallback): Player;
declare namespace videojs {
    export { hooks_ };
    export { hooks };
    export { hook };
    export { hookOnce };
    export { removeHook };
    export { version as VERSION };
    export const options: any;
    /**
     * Get an object with the currently created players, keyed by player ID
     *
     * @return {Object}
     *         The created players
     */
    export function getPlayers(): any;
    /**
     * Get a single player based on an ID or DOM element.
     *
     * This is useful if you want to check if an element or ID has an associated
     * Video.js player, but not create one if it doesn't.
     *
     * @param   {string|Element} id
     *          An HTML element - `<video>`, `<audio>`, or `<video-js>` -
     *          or a string matching the `id` of such an element.
     *
     * @return {Player|undefined}
     *          A player instance or `undefined` if there is no player instance
     *          matching the argument.
     */
    export function getPlayer(id: string | Element): Player;
    /**
     * Returns an array of all current players.
     *
     * @return {Array}
     *         An array of all players. The array will be in the order that
     *         `Object.keys` provides, which could potentially vary between
     *         JavaScript engines.
     *
     */
    export function getAllPlayers(): any[];
    export const players: any;
    export const getComponent: typeof Component.getComponent;
    /**
     * Register a component so it can referred to by name. Used when adding to other
     * components, either through addChild `component.addChild('myComponent')` or through
     * default children options  `{ children: ['myComponent'] }`.
     *
     * > NOTE: You could also just initialize the component before adding.
     * `component.addChild(new MyComponent());`
     *
     * @param {string} name
     *        The class name of the component
     *
     * @param {Component} comp
     *        The component class
     *
     * @return {Component}
     *         The newly registered component
     */
    export function registerComponent(name: string, comp: Component): Component;
    export const getTech: typeof Tech.getTech;
    export const registerTech: typeof Tech.registerTech;
    export { middlewareUse as use };
    export namespace middleware {
        const TERMINATOR: {};
    }
    export { browser };
    export { Obj as obj };
    export const mergeOptions: Function;
    export const defineLazyProperty: Function;
    export const bind: Function;
    export const registerPlugin: typeof Plugin.registerPlugin;
    export const deregisterPlugin: typeof Plugin.deregisterPlugin;
    /**
     * Deprecated method to register a plugin with Video.js
     *
     * @deprecated Deprecated and will be removed in 9.0. Use videojs.registerPlugin() instead.
     *
     * @param {string} name
     *        The plugin name
     *
     * @param {Plugin|Function} plugin
     *         The plugin sub-class or function
     */
    export function plugin(name: string, plugin: Function | Plugin): Function | typeof Plugin;
    export const getPlugins: typeof Plugin.getPlugins;
    export const getPlugin: (name: string) => Function | typeof Plugin;
    export const getPluginVersion: typeof Plugin.getPluginVersion;
    /**
     * Adding languages so that they're available to all players.
     * Example: `videojs.addLanguage('es', { 'Hello': 'Hola' });`
     *
     * @param {string} code
     *        The language code or dictionary property
     *
     * @param {Object} data
     *        The data values to be translated
     *
     * @return {Object}
     *         The resulting language dictionary object
     */
    export function addLanguage(code: string, data: any): any;
    export { log };
    export { createLogger };
    export { Time as time };
    export const createTimeRange: Function;
    export const createTimeRanges: Function;
    export const formatTime: Function;
    export const setFormatTime: Function;
    export const resetFormatTime: Function;
    export const parseUrl: Function;
    export const isCrossOrigin: Function;
    export { EventTarget };
    export const any: typeof Events.any;
    export const on: typeof Events.on;
    export const one: typeof Events.one;
    export const off: typeof Events.off;
    export const trigger: typeof Events.trigger;
    export { xhr };
    export { TextTrack };
    export { AudioTrack };
    export { VideoTrack };
    export const computedStyle: Function;
    export { Dom as dom };
    export { Fn as fn };
    export { Num as num };
    export { Str as str };
    export { Url as url };
}
import Player from "./player";
import { hooks_ } from "./utils/hooks";
import { hooks } from "./utils/hooks";
import { hook } from "./utils/hooks";
import { hookOnce } from "./utils/hooks";
import { removeHook } from "./utils/hooks";
import Component from "./component";
import Tech from "./tech/tech.js";
import { use as middlewareUse } from "./tech/middleware.js";
import * as browser from "./utils/browser.js";
import * as Obj from "./utils/obj";
import Plugin from "./plugin";
import log from "./utils/log.js";
import { createLogger } from "./utils/log.js";
import * as Time from "./utils/time.js";
import EventTarget from "./event-target";
import * as Events from "./utils/events.js";
import xhr from "@videojs/xhr";
import TextTrack from "./tracks/text-track.js";
import AudioTrack from "./tracks/audio-track.js";
import VideoTrack from "./tracks/video-track.js";
import * as Dom from "./utils/dom.js";
import * as Fn from "./utils/fn.js";
import * as Num from "./utils/num.js";
import * as Str from "./utils/str.js";
import * as Url from "./utils/url.js";
//# sourceMappingURL=video.d.ts.map