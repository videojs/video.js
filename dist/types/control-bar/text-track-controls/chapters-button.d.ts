export default ChaptersButton;
/**
 * The button component for toggling and selecting chapters
 * Chapters act much differently than other text tracks
 * Cues are navigation vs. other tracks of alternative languages
 *
 * @extends TextTrackButton
 */
declare class ChaptersButton extends TextTrackButton {
    /**
     * Creates an instance of this class.
     *
     * @param { import('../../player').default } player
     *        The `Player` that this class should be attached to.
     *
     * @param {Object} [options]
     *        The key/value store of player options.
     *
     * @param {Function} [ready]
     *        The function to call when this function is ready.
     */
    constructor(player: import('../../player').default, options?: any, ready?: Function);
    selectCurrentItem_: () => void;
    /**
     * Builds the default DOM `className`.
     *
     * @return {string}
     *         The DOM `className` for this object.
     */
    buildCSSClass(): string;
    buildWrapperCSSClass(): string;
    /**
     * Update the menu based on the current state of its items.
     *
     * @param {Event} [event]
     *        An event that triggered this function to run.
     *
     * @listens TextTrackList#addtrack
     * @listens TextTrackList#removetrack
     * @listens TextTrackList#change
     */
    update(event?: Event): void;
    /**
     * Set the currently selected track for the chapters button.
     *
     * @param {TextTrack} track
     *        The new track to select. Nothing will change if this is the currently selected
     *        track.
     */
    setTrack(track: TextTrack): void;
    updateHandler_: any;
    track_: any;
    /**
     * Find the track object that is currently in use by this ChaptersButton
     *
     * @return {TextTrack|undefined}
     *         The current track or undefined if none was found.
     */
    findChaptersTrack(): TextTrack | undefined;
    /**
     * Get the caption for the ChaptersButton based on the track label. This will also
     * use the current tracks localized kind as a fallback if a label does not exist.
     *
     * @return {string}
     *         The tracks current label or the localized track kind.
     */
    getMenuCaption(): string;
    /**
     * Create menu from chapter track
     *
     * @return { import('../../menu/menu').default }
     *         New menu for the chapter buttons
     */
    createMenu(): import('../../menu/menu').default;
    /**
     * Create a menu item for each text track
     *
     * @return  { import('./text-track-menu-item').default[] }
     *         Array of menu items
     */
    createItems(): import('./text-track-menu-item').default[];
    /**
     * `kind` of TextTrack to look for to associate it with this menu.
     *
     * @type {string}
     * @private
     */
    private kind_;
    /**
     * The text that should display over the `ChaptersButton`s controls. Added for localization.
     *
     * @type {string}
     * @protected
     */
    protected controlText_: string;
}
import TextTrackButton from "./text-track-button.js";
//# sourceMappingURL=chapters-button.d.ts.map