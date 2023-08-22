export default VolumeControl;
/**
 * The component for controlling the volume level
 *
 * @extends Component
 */
declare class VolumeControl extends Component {
    /**
     * Creates an instance of this class.
     *
     * @param { import('../../player').default } player
     *        The `Player` that this class should be attached to.
     *
     * @param {Object} [options={}]
     *        The key/value store of player options.
     */
    constructor(player: import('../../player').default, options?: any);
    throttledHandleMouseMove: Function;
    handleMouseUpHandler_: (e: any) => void;
    /**
     * Create the `Component`'s DOM element
     *
     * @return {Element}
     *         The element that was created.
     */
    createEl(): Element;
    /**
     * Handle `mousedown` or `touchstart` events on the `VolumeControl`.
     *
     * @param {Event} event
     *        `mousedown` or `touchstart` event that triggered this function
     *
     * @listens mousedown
     * @listens touchstart
     */
    handleMouseDown(event: Event): void;
    /**
     * Handle `mouseup` or `touchend` events on the `VolumeControl`.
     *
     * @param {Event} event
     *        `mouseup` or `touchend` event that triggered this function.
     *
     * @listens touchend
     * @listens mouseup
     */
    handleMouseUp(event: Event): void;
    /**
     * Handle `mousedown` or `touchstart` events on the `VolumeControl`.
     *
     * @param {Event} event
     *        `mousedown` or `touchstart` event that triggered this function
     *
     * @listens mousedown
     * @listens touchstart
     */
    handleMouseMove(event: Event): void;
}
import Component from "../../component.js";
//# sourceMappingURL=volume-control.d.ts.map