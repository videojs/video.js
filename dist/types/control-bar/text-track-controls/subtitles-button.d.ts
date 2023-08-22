export default SubtitlesButton;
/**
 * The button component for toggling and selecting subtitles
 *
 * @extends TextTrackButton
 */
declare class SubtitlesButton extends TextTrackButton {
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
     * `kind` of TextTrack to look for to associate it with this menu.
     *
     * @type {string}
     * @private
     */
    private kind_;
    /**
     * The text that should display over the `SubtitlesButton`s controls. Added for localization.
     *
     * @type {string}
     * @protected
     */
    protected controlText_: string;
}
import TextTrackButton from "./text-track-button.js";
//# sourceMappingURL=subtitles-button.d.ts.map