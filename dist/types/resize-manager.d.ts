export default ResizeManager;
/**
 * A Resize Manager. It is in charge of triggering `playerresize` on the player in the right conditions.
 *
 * It'll either create an iframe and use a debounced resize handler on it or use the new {@link https://wicg.github.io/ResizeObserver/|ResizeObserver}.
 *
 * If the ResizeObserver is available natively, it will be used. A polyfill can be passed in as an option.
 * If a `playerresize` event is not needed, the ResizeManager component can be removed from the player, see the example below.
 *
 * @example <caption>How to disable the resize manager</caption>
 * const player = videojs('#vid', {
 *   resizeManager: false
 * });
 *
 * @see {@link https://wicg.github.io/ResizeObserver/|ResizeObserver specification}
 *
 * @extends Component
 */
declare class ResizeManager extends Component {
    /**
     * Create the ResizeManager.
     *
     * @param {Object} player
     *        The `Player` that this class should be attached to.
     *
     * @param {Object} [options]
     *        The key/value store of ResizeManager options.
     *
     * @param {Object} [options.ResizeObserver]
     *        A polyfill for ResizeObserver can be passed in here.
     *        If this is set to null it will ignore the native ResizeObserver and fall back to the iframe fallback.
     */
    constructor(player: any, options?: {
        ResizeObserver?: any;
    });
    ResizeObserver: any;
    loadListener_: () => void;
    resizeObserver_: any;
    debouncedHandler_: Function;
    unloadListener_: () => void;
    createEl(): Element;
    /**
     * Called when a resize is triggered on the iframe or a resize is observed via the ResizeObserver
     *
     * @fires Player#playerresize
     */
    resizeHandler(): void;
    dispose(): void;
    resizeObserver: any;
}
import Component from "./component.js";
//# sourceMappingURL=resize-manager.d.ts.map