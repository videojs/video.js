export default TimeTooltip;
/**
 * Time tooltips display a time above the progress bar.
 *
 * @extends Component
 */
declare class TimeTooltip extends Component {
    /**
     * Creates an instance of this class.
     *
     * @param { import('../../player').default } player
     *        The {@link Player} that this class should be attached to.
     *
     * @param {Object} [options]
     *        The key/value store of player options.
     */
    constructor(player: import('../../player').default, options?: any);
    /**
     * Updates the position of the time tooltip relative to the `SeekBar`.
     *
     * @param {Object} seekBarRect
     *        The `ClientRect` for the {@link SeekBar} element.
     *
     * @param {number} seekBarPoint
     *        A number from 0 to 1, representing a horizontal reference point
     *        from the left edge of the {@link SeekBar}
     */
    update(seekBarRect: any, seekBarPoint: number, content: any): void;
    /**
     * Create the time tooltip DOM element
     *
     * @return {Element}
     *         The element that was created.
     */
    createEl(): Element;
    /**
     * Write the time to the tooltip DOM element.
     *
     * @param {string} content
     *        The formatted time for the tooltip.
     */
    write(content: string): void;
    /**
     * Updates the position of the time tooltip relative to the `SeekBar`.
     *
     * @param {Object} seekBarRect
     *        The `ClientRect` for the {@link SeekBar} element.
     *
     * @param {number} seekBarPoint
     *        A number from 0 to 1, representing a horizontal reference point
     *        from the left edge of the {@link SeekBar}
     *
     * @param {number} time
     *        The time to update the tooltip to, not used during live playback
     *
     * @param {Function} cb
     *        A function that will be called during the request animation frame
     *        for tooltips that need to do additional animations from the default
     */
    updateTime(seekBarRect: any, seekBarPoint: number, time: number, cb: Function): void;
}
import Component from "../../component";
//# sourceMappingURL=time-tooltip.d.ts.map