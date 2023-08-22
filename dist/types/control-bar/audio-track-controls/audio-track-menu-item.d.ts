export default AudioTrackMenuItem;
/**
 * An {@link AudioTrack} {@link MenuItem}
 *
 * @extends MenuItem
 */
declare class AudioTrackMenuItem extends MenuItem {
    track: any;
    createEl(type: any, props: any, attrs: any): Element;
    /**
     * This gets called when an `AudioTrackMenuItem is "clicked". See {@link ClickableComponent}
     * for more detailed information on what a click can be.
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
     * Handle any {@link AudioTrack} change.
     *
     * @param {Event} [event]
     *        The {@link AudioTrackList#change} event that caused this to run.
     *
     * @listens AudioTrackList#change
     */
    handleTracksChange(event?: Event): void;
}
import MenuItem from "../../menu/menu-item.js";
//# sourceMappingURL=audio-track-menu-item.d.ts.map