/**
 * Construct an rgba color from a given hex color code.
 *
 * @param {number} color
 *        Hex number for color, like #f0e or #f604e2.
 *
 * @param {number} opacity
 *        Value for opacity, 0.0 - 1.0.
 *
 * @return {string}
 *         The rgba color that was created, like 'rgba(255, 0, 0, 0.3)'.
 */
export function constructColor(color: number, opacity: number): string;
export default TextTrackDisplay;
/**
 * The component for displaying text track cues.
 *
 * @extends Component
 */
declare class TextTrackDisplay extends Component {
    /**
     * Creates an instance of this class.
     *
     * @param { import('../player').default } player
     *        The `Player` that this class should be attached to.
     *
     * @param {Object} [options]
     *        The key/value store of player options.
     *
     * @param {Function} [ready]
     *        The function to call when `TextTrackDisplay` is ready.
     */
    constructor(player: import('../player').default, options?: any, ready?: Function);
    /**
    * Preselect a track following this precedence:
    * - matches the previously selected {@link TextTrack}'s language and kind
    * - matches the previously selected {@link TextTrack}'s language only
    * - is the first default captions track
    * - is the first default descriptions track
    *
    * @listens Player#loadstart
    */
    preselectTrack(): void;
    /**
     * Turn display of {@link TextTrack}'s from the current state into the other state.
     * There are only two states:
     * - 'shown'
     * - 'hidden'
     *
     * @listens Player#loadstart
     */
    toggleDisplay(): void;
    /**
     * Create the {@link Component}'s DOM element.
     *
     * @return {Element}
     *         The element that was created.
     */
    createEl(): Element;
    /**
     * Clear all displayed {@link TextTrack}s.
     */
    clearDisplay(): void;
    /**
     * Update the displayed TextTrack when a either a {@link Player#texttrackchange} or
     * a {@link Player#fullscreenchange} is fired.
     *
     * @listens Player#texttrackchange
     * @listens Player#fullscreenchange
     */
    updateDisplay(): void;
    /**
     * Updates the displayed TextTrack to be sure it overlays the video when a either
     * a {@link Player#texttrackchange} or a {@link Player#fullscreenchange} is fired.
     */
    updateDisplayOverlay(): void;
    /**
     * Style {@Link TextTrack} activeCues according to {@Link TextTrackSettings}.
     *
     * @param {TextTrack} track
     *        Text track object containing active cues to style.
     */
    updateDisplayState(track: TextTrack): void;
    /**
     * Add an {@link TextTrack} to to the {@link Tech}s {@link TextTrackList}.
     *
     * @param {TextTrack|TextTrack[]} tracks
     *        Text track object or text track array to be added to the list.
     */
    updateForTrack(tracks: TextTrack | TextTrack[]): void;
}
import Component from "../component";
//# sourceMappingURL=text-track-display.d.ts.map