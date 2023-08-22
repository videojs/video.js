export default PictureInPictureToggle;
/**
 * Toggle Picture-in-Picture mode
 *
 * @extends Button
 */
declare class PictureInPictureToggle extends Button {
    /**
     * Creates an instance of this class.
     *
     * @param { import('./player').default } player
     *        The `Player` that this class should be attached to.
     *
     * @param {Object} [options]
     *        The key/value store of player options.
     *
     * @listens Player#enterpictureinpicture
     * @listens Player#leavepictureinpicture
     */
    constructor(player: any, options?: any);
    /**
     * Displays or hides the button depending on the audio mode detection.
     * Exits picture-in-picture if it is enabled when switching to audio mode.
     */
    handlePictureInPictureAudioModeChange(): void;
    /**
     * Enables or disables button based on availability of a Picture-In-Picture mode.
     *
     * Enabled if
     * - `player.options().enableDocumentPictureInPicture` is true and
     *   window.documentPictureInPicture is available; or
     * - `player.disablePictureInPicture()` is false and
     *   element.requestPictureInPicture is available
     */
    handlePictureInPictureEnabledChange(): void;
    /**
     * Handles enterpictureinpicture and leavepictureinpicture on the player and change control text accordingly.
     *
     * @param {Event} [event]
     *        The {@link Player#enterpictureinpicture} or {@link Player#leavepictureinpicture} event that caused this function to be
     *        called.
     *
     * @listens Player#enterpictureinpicture
     * @listens Player#leavepictureinpicture
     */
    handlePictureInPictureChange(event?: Event): void;
    /**
     * This gets called when an `PictureInPictureToggle` is "clicked". See
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
import Button from "../button.js";
//# sourceMappingURL=picture-in-picture-toggle.d.ts.map