export default SubsCapsButton;
/**
 * The button component for toggling and selecting captions and/or subtitles
 *
 * @extends TextTrackButton
 */
declare class SubsCapsButton extends TextTrackButton {
    label_: string;
    /**
     * Builds the default DOM `className`.
     *
     * @return {string}
     *         The DOM `className` for this object.
     */
    buildCSSClass(): string;
    buildWrapperCSSClass(): string;
    /**
     * Create caption/subtitles menu items
     *
     * @return {CaptionSettingsMenuItem[]}
     *         The array of current menu items.
     */
    createItems(): CaptionSettingsMenuItem[];
    /**
     * The text that should display over the `SubsCapsButton`s controls.
     *
     *
     * @type {string}
     * @protected
     */
    protected controlText_: string;
}
import TextTrackButton from "./text-track-button.js";
import CaptionSettingsMenuItem from "./caption-settings-menu-item.js";
//# sourceMappingURL=subs-caps-button.d.ts.map