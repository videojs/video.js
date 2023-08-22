export default MouseVolumeLevelDisplay;
/**
 * The {@link MouseVolumeLevelDisplay} component tracks mouse movement over the
 * {@link VolumeControl}. It displays an indicator and a {@link VolumeLevelTooltip}
 * indicating the volume level which is represented by a given point in the
 * {@link VolumeBar}.
 *
 * @extends Component
 */
declare class MouseVolumeLevelDisplay extends Component {
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
     * Enquires updates to its own DOM as well as the DOM of its
     * {@link VolumeLevelTooltip} child.
     *
     * @param {Object} rangeBarRect
     *        The `ClientRect` for the {@link VolumeBar} element.
     *
     * @param {number} rangeBarPoint
     *        A number from 0 to 1, representing a horizontal/vertical reference point
     *        from the left edge of the {@link VolumeBar}
     *
     * @param {boolean} vertical
     *        Referees to the Volume control position
     *        in the control bar{@link VolumeControl}
     *
     */
    update(rangeBarRect: any, rangeBarPoint: number, vertical: boolean): void;
    /**
     * Create the DOM element for this class.
     *
     * @return {Element}
     *         The element that was created.
     */
    createEl(): Element;
}
import Component from "../../component.js";
//# sourceMappingURL=mouse-volume-level-display.d.ts.map