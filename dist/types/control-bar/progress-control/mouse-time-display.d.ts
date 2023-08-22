export default MouseTimeDisplay;
/**
 * The {@link MouseTimeDisplay} component tracks mouse movement over the
 * {@link ProgressControl}. It displays an indicator and a {@link TimeTooltip}
 * indicating the time which is represented by a given point in the
 * {@link ProgressControl}.
 *
 * @extends Component
 */
declare class MouseTimeDisplay extends Component {
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
     * Enqueues updates to its own DOM as well as the DOM of its
     * {@link TimeTooltip} child.
     *
     * @param {Object} seekBarRect
     *        The `ClientRect` for the {@link SeekBar} element.
     *
     * @param {number} seekBarPoint
     *        A number from 0 to 1, representing a horizontal reference point
     *        from the left edge of the {@link SeekBar}
     */
    update(seekBarRect: any, seekBarPoint: number): void;
    /**
     * Create the DOM element for this class.
     *
     * @return {Element}
     *         The element that was created.
     */
    createEl(): Element;
}
import Component from "../../component.js";
//# sourceMappingURL=mouse-time-display.d.ts.map