export default PlaybackRateMenuItem;
/**
 * The specific menu item type for selecting a playback rate.
 *
 * @extends MenuItem
 */
declare class PlaybackRateMenuItem extends MenuItem {
    label: any;
    rate: number;
    /**
     * This gets called when an `PlaybackRateMenuItem` is "clicked". See
     * {@link ClickableComponent} for more detailed information on what a click can be.
     *
     * @param {Event} [event]
     *        The `keydown`, `tap`, or `click` event that caused this function to be
     *        called.
     *
     * @listens tap
     * @listens click
     */
    handleClick(event?: Event): void;
    /**
     * Update the PlaybackRateMenuItem when the playbackrate changes.
     *
     * @param {Event} [event]
     *        The `ratechange` event that caused this function to run.
     *
     * @listens Player#ratechange
     */
    update(event?: Event): void;
    /**
     * The text that should display over the `PlaybackRateMenuItem`s controls. Added for localization.
     *
     * @type {string}
     * @private
     */
    private contentElType;
}
import MenuItem from "../../menu/menu-item.js";
//# sourceMappingURL=playback-rate-menu-item.d.ts.map