export default CaptionsButton;
/**
 * The button component for toggling and selecting captions
 *
 * @extends TextTrackButton
 */
declare class CaptionsButton extends TextTrackButton {
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
     *        The function to call when this component is ready.
     */
    constructor(player: import('../../player').default, options?: any, ready?: Function);
    /**
     * Builds the default DOM `className`.
     *
     * @return {string}
     *         The DOM `className` for this object.
     */
    buildCSSClass(): string;
    buildWrapperCSSClass(): string;
    /**
     * Create caption menu items
     *
     * @return {CaptionSettingsMenuItem[]}
     *         The array of current menu items.
     */
    createItems(): CaptionSettingsMenuItem[];
    /**
     * `kind` of TextTrack to look for to associate it with this menu.
     *
     * @type {string}
     * @private
     */
    private kind_;
    /**
     * The text that should display over the `CaptionsButton`s controls. Added for localization.
     *
     * @type {string}
     * @protected
     */
    protected controlText_: string;
}
import TextTrackButton from "./text-track-button.js";
import CaptionSettingsMenuItem from "./caption-settings-menu-item.js";
//# sourceMappingURL=captions-button.d.ts.map