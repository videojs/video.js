export default CurrentTimeDisplay;
/**
 * Displays the current time
 *
 * @extends Component
 */
declare class CurrentTimeDisplay extends Component {
    /**
     * Update current time display
     *
     * @param {Event} [event]
     *        The `timeupdate` event that caused this function to run.
     *
     * @listens Player#timeupdate
     */
    updateContent(event?: Event): void;
    /**
     * The text that is added to the `CurrentTimeDisplay` for screen reader users.
     *
     * @type {string}
     * @private
     */
    private labelText_;
    /**
     * The text that should display over the `CurrentTimeDisplay`s controls. Added to for localization.
     *
     * @type {string}
     * @protected
     *
     * @deprecated in v7; controlText_ is not used in non-active display Components
     */
    protected controlText_: string;
}
import Component from "../../component.js";
//# sourceMappingURL=current-time-display.d.ts.map