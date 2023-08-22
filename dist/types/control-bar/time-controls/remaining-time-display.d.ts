export default RemainingTimeDisplay;
/**
 * Displays the time left in the video
 *
 * @extends Component
 */
declare class RemainingTimeDisplay extends Component {
    /**
     * Creates an instance of this class.
     *
     * @param { import('../../player').default } player
     *        The `Player` that this class should be attached to.
     *
     * @param {Object} [options]
     *        The key/value store of player options.
     */
    constructor(player: import('../../player').default, options?: any);
    /**
     * Create the `Component`'s DOM element with the "minus" character prepend to the time
     *
     * @return {Element}
     *         The element that was created.
     */
    createEl(): Element;
    /**
     * Update remaining time display.
     *
     * @param {Event} [event]
     *        The `timeupdate` or `durationchange` event that caused this to run.
     *
     * @listens Player#timeupdate
     * @listens Player#durationchange
     */
    updateContent(event?: Event): void;
    /**
     * The text that is added to the `RemainingTimeDisplay` for screen reader users.
     *
     * @type {string}
     * @private
     */
    private labelText_;
    /**
     * The text that should display over the `RemainingTimeDisplay`s controls. Added to for localization.
     *
     * @type {string}
     * @protected
     *
     * @deprecated in v7; controlText_ is not used in non-active display Components
     */
    protected controlText_: string;
}
import Component from "../../component.js";
//# sourceMappingURL=remaining-time-display.d.ts.map