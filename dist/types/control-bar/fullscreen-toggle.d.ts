export default FullscreenToggle;
/**
 * Toggle fullscreen video
 *
 * @extends Button
 */
declare class FullscreenToggle extends Button {
    /**
     * Creates an instance of this class.
     *
     * @param { import('./player').default } player
     *        The `Player` that this class should be attached to.
     *
     * @param {Object} [options]
     *        The key/value store of player options.
     */
    constructor(player: any, options?: any);
    /**
     * Handles fullscreenchange on the player and change control text accordingly.
     *
     * @param {Event} [event]
     *        The {@link Player#fullscreenchange} event that caused this function to be
     *        called.
     *
     * @listens Player#fullscreenchange
     */
    handleFullscreenChange(event?: Event): void;
    /**
     * This gets called when an `FullscreenToggle` is "clicked". See
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
//# sourceMappingURL=fullscreen-toggle.d.ts.map