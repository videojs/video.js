export default LiveDisplay;
/**
 * Displays the live indicator when duration is Infinity.
 *
 * @extends Component
 */
declare class LiveDisplay extends Component {
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
    /**
     * Create the `Component`'s DOM element
     *
     * @return {Element}
     *         The element that was created.
     */
    createEl(): Element;
    contentEl_: Element;
    dispose(): void;
    /**
     * Check the duration to see if the LiveDisplay should be showing or not. Then show/hide
     * it accordingly
     *
     * @param {Event} [event]
     *        The {@link Player#durationchange} event that caused this function to run.
     *
     * @listens Player#durationchange
     */
    updateShowing(event?: Event): void;
}
import Component from "../component";
//# sourceMappingURL=live-display.d.ts.map