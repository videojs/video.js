export default SeekBar;
/**
 * Seek bar and container for the progress bars. Uses {@link PlayProgressBar}
 * as its `bar`.
 *
 * @extends Slider
 */
declare class SeekBar extends Slider {
    /**
     * Sets the event handlers
     *
     * @private
     */
    private setEventHandlers_;
    /**
     * This function updates the play progress bar and accessibility
     * attributes to whatever is passed in.
     *
     * @param {Event} [event]
     *        The `timeupdate` or `ended` event that caused this to run.
     *
     * @listens Player#timeupdate
     *
     * @return {number}
     *          The current percent at a number from 0-1
     */
    update(event?: Event): number;
    updateInterval: number;
    enableIntervalHandler_: (e: any) => void;
    disableIntervalHandler_: (e: any) => void;
    toggleVisibility_(e: any): void;
    enableInterval_(): void;
    disableInterval_(e: any): void;
    /**
     * Create the `Component`'s DOM element
     *
     * @return {Element}
     *         The element that was created.
     */
    createEl(): Element;
    percent_: any;
    currentTime_: any;
    duration_: any;
    /**
     * Prevent liveThreshold from causing seeks to seem like they
     * are not happening from a user perspective.
     *
     * @param {number} ct
     *        current time to seek to
     */
    userSeek_(ct: number): void;
    /**
     * Get the value of current time but allows for smooth scrubbing,
     * when player can't keep up.
     *
     * @return {number}
     *         The current time value to display
     *
     * @private
     */
    private getCurrentTime_;
    /**
     * Get the percentage of media played so far.
     *
     * @return {number}
     *         The percentage of media played so far (0 to 1).
     */
    getPercent(): number;
    videoWasPlaying: boolean;
    /**
     * Handle mouse move on seek bar
     *
     * @param {MouseEvent} event
     *        The `mousemove` event that caused this to run.
     * @param {boolean} mouseDown this is a flag that should be set to true if `handleMouseMove` is called directly. It allows us to skip things that should not happen if coming from mouse down but should happen on regular mouse move handler. Defaults to false
     *
     * @listens mousemove
     */
    handleMouseMove(event: MouseEvent, mouseDown?: boolean): void;
    /**
     * Move more quickly fast forward for keyboard-only users
     */
    stepForward(): void;
    /**
     * Move more quickly rewind for keyboard-only users
     */
    stepBack(): void;
    /**
     * Toggles the playback state of the player
     * This gets called when enter or space is used on the seekbar
     *
     * @param {KeyboardEvent} event
     *        The `keydown` event that caused this function to be called
     *
     */
    handleAction(event: KeyboardEvent): void;
    dispose(): void;
}
import Slider from "../../slider/slider.js";
//# sourceMappingURL=seek-bar.d.ts.map