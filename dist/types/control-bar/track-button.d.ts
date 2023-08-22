export default TrackButton;
/**
 * The base class for buttons that toggle specific  track types (e.g. subtitles).
 *
 * @extends MenuButton
 */
declare class TrackButton extends MenuButton {
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
}
import MenuButton from "../menu/menu-button.js";
//# sourceMappingURL=track-button.d.ts.map