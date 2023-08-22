export default CaptionSettingsMenuItem;
/**
 * The menu item for caption track settings menu
 *
 * @extends TextTrackMenuItem
 */
declare class CaptionSettingsMenuItem extends TextTrackMenuItem {
    /**
     * This gets called when an `CaptionSettingsMenuItem` is "clicked". See
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
}
import TextTrackMenuItem from "./text-track-menu-item.js";
//# sourceMappingURL=caption-settings-menu-item.d.ts.map