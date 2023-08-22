export default VolumeLevelTooltip;
/**
 * Volume level tooltips display a volume above or side by side the volume bar.
 *
 * @extends Component
 */
declare class VolumeLevelTooltip extends Component {
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
     * Updates the position of the tooltip relative to the `VolumeBar` and
     * its content text.
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
    update(rangeBarRect: any, rangeBarPoint: number, vertical: boolean, content: any): void;
    /**
     * Create the volume tooltip DOM element
     *
     * @return {Element}
     *         The element that was created.
     */
    createEl(): Element;
    /**
     * Write the volume to the tooltip DOM element.
     *
     * @param {string} content
     *        The formatted volume for the tooltip.
     */
    write(content: string): void;
    /**
     * Updates the position of the volume tooltip relative to the `VolumeBar`.
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
     * @param {number} volume
     *        The volume level to update the tooltip to
     *
     * @param {Function} cb
     *        A function that will be called during the request animation frame
     *        for tooltips that need to do additional animations from the default
     */
    updateVolume(rangeBarRect: any, rangeBarPoint: number, vertical: boolean, volume: number, cb: Function): void;
}
import Component from "../../component";
//# sourceMappingURL=volume-level-tooltip.d.ts.map