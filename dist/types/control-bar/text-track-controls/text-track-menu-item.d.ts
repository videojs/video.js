export default TextTrackMenuItem;
/**
 * The specific menu item type for selecting a language within a text track kind
 *
 * @extends MenuItem
 */
declare class TextTrackMenuItem extends MenuItem {
    track: any;
    kinds: any;
    /**
     * Handle text track list change
     *
     * @param {Event} event
     *        The `change` event that caused this function to be called.
     *
     * @listens TextTrackList#change
     */
    handleTracksChange(event: Event): void;
    handleSelectedLanguageChange(event: any): void;
}
import MenuItem from "../../menu/menu-item.js";
//# sourceMappingURL=text-track-menu-item.d.ts.map