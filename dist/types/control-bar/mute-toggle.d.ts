export default MuteToggle;
/**
 * A button component for muting the audio.
 *
 * @extends Button
 */
declare class MuteToggle extends Button {
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
     * This gets called when an `MuteToggle` is "clicked". See
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
    /**
     * Update the `MuteToggle` button based on the state of `volume` and `muted`
     * on the player.
     *
     * @param {Event} [event]
     *        The {@link Player#loadstart} event if this function was called
     *        through an event.
     *
     * @listens Player#loadstart
     * @listens Player#volumechange
     */
    update(event?: Event): void;
    /**
     * Update the appearance of the `MuteToggle` icon.
     *
     * Possible states (given `level` variable below):
     * - 0: crossed out
     * - 1: zero bars of volume
     * - 2: one bar of volume
     * - 3: two bars of volume
     *
     * @private
     */
    private updateIcon_;
    /**
     * If `muted` has changed on the player, update the control text
     * (`title` attribute on `vjs-mute-control` element and content of
     * `vjs-control-text` element).
     *
     * @private
     */
    private updateControlText_;
}
import Button from "../button";
//# sourceMappingURL=mute-toggle.d.ts.map