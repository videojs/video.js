export default TextTrackSettings;
/**
 * Manipulate Text Tracks settings.
 *
 * @extends ModalDialog
 */
declare class TextTrackSettings extends ModalDialog {
    /**
     * Creates an instance of this class.
     *
     * @param { import('../player').default } player
     *         The `Player` that this class should be attached to.
     *
     * @param {Object} [options]
     *         The key/value store of player options.
     */
    constructor(player: import('../player').default, options?: any);
    /**
     * Update display of text track settings
     */
    updateDisplay(): void;
    endDialog: Element;
    /**
     * Create a <select> element with configured options.
     *
     * @param {string} key
     *        Configuration key to use during creation.
     *
     * @return {string}
     *         An HTML string.
     *
     * @private
     */
    private createElSelect_;
    /**
     * Create foreground color element for the component
     *
     * @return {string}
     *         An HTML string.
     *
     * @private
     */
    private createElFgColor_;
    /**
     * Create background color element for the component
     *
     * @return {string}
     *         An HTML string.
     *
     * @private
     */
    private createElBgColor_;
    /**
     * Create window color element for the component
     *
     * @return {string}
     *         An HTML string.
     *
     * @private
     */
    private createElWinColor_;
    /**
     * Create color elements for the component
     *
     * @return {Element}
     *         The element that was created
     *
     * @private
     */
    private createElColors_;
    /**
     * Create font elements for the component
     *
     * @return {Element}
     *         The element that was created.
     *
     * @private
     */
    private createElFont_;
    /**
     * Create controls for the component
     *
     * @return {Element}
     *         The element that was created.
     *
     * @private
     */
    private createElControls_;
    content(): Element[];
    /**
     * Gets an object of text track settings (or null).
     *
     * @return {Object}
     *         An object with config values parsed from the DOM or localStorage.
     */
    getValues(): any;
    /**
     * Sets text track settings from an object of values.
     *
     * @param {Object} values
     *        An object with config values parsed from the DOM or localStorage.
     */
    setValues(values: any): void;
    /**
     * Sets all `<select>` elements to their default values.
     */
    setDefaults(): void;
    /**
     * Restore texttrack settings from localStorage
     */
    restoreSettings(): void;
    /**
     * Save text track settings to localStorage
     */
    saveSettings(): void;
}
import ModalDialog from "../modal-dialog";
//# sourceMappingURL=text-track-settings.d.ts.map