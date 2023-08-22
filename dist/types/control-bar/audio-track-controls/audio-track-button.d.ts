export default AudioTrackButton;
/**
 * The base class for buttons that toggle specific {@link AudioTrack} types.
 *
 * @extends TrackButton
 */
declare class AudioTrackButton extends TrackButton {
    /**
     * Create a menu item for each audio track
     *
     * @param {AudioTrackMenuItem[]} [items=[]]
     *        An array of existing menu items to use.
     *
     * @return {AudioTrackMenuItem[]}
     *         An array of menu items
     */
    createItems(items?: AudioTrackMenuItem[]): AudioTrackMenuItem[];
    /**
     * The text that should display over the `AudioTrackButton`s controls. Added for localization.
     *
     * @type {string}
     * @protected
     */
    protected controlText_: string;
}
import TrackButton from "../track-button.js";
import AudioTrackMenuItem from "./audio-track-menu-item.js";
//# sourceMappingURL=audio-track-button.d.ts.map