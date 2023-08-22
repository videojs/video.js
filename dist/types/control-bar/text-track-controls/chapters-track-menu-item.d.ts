export default ChaptersTrackMenuItem;
/**
 * The chapter track menu item
 *
 * @extends MenuItem
 */
declare class ChaptersTrackMenuItem extends MenuItem {
    track: any;
    cue: any;
    /**
     * This gets called when an `ChaptersTrackMenuItem` is "clicked". See
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
import MenuItem from "../../menu/menu-item.js";
//# sourceMappingURL=chapters-track-menu-item.d.ts.map