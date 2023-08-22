export default SeekToLive;
/**
 * Displays the live indicator when duration is Infinity.
 *
 * @extends Component
 */
declare class SeekToLive extends Component {
    /**
     * Creates an instance of this class.
     *
     * @param { import('./player').default } player
     *        The `Player` that this class should be attached to.
     *
     * @param {Object} [options]
     *        The key/value store of player options.
     */
    constructor(player: any, options?: any);
    updateLiveEdgeStatusHandler_: (e: any) => void;
    /**
     * Create the `Component`'s DOM element
     *
     * @return {Element}
     *         The element that was created.
     */
    createEl(): Element;
    textEl_: Element;
    /**
     * Update the state of this button if we are at the live edge
     * or not
     */
    updateLiveEdgeStatus(): void;
    /**
     * On click bring us as near to the live point as possible.
     * This requires that we wait for the next `live-seekable-change`
     * event which will happen every segment length seconds.
     */
    handleClick(): void;
    /**
     * Dispose of the element and stop tracking
     */
    dispose(): void;
    /**
     * The text that should display over the `SeekToLive`s control. Added for localization.
     *
     * @type {string}
     * @protected
     */
    protected controlText_: string;
}
import Component from "../component";
//# sourceMappingURL=seek-to-live.d.ts.map