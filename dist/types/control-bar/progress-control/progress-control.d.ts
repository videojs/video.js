export default ProgressControl;
/**
 * The Progress Control component contains the seek bar, load progress,
 * and play progress.
 *
 * @extends Component
 */
declare class ProgressControl extends Component {
    /**
     * Creates an instance of this class.
     *
     * @param { import('../../player').default } player
     *        The `Player` that this class should be attached to.
     *
     * @param {Object} [options]
     *        The key/value store of player options.
     */
    constructor(player: import('../../player').default, options?: any);
    /**
     * When the mouse moves over the `ProgressControl`, the pointer position
     * gets passed down to the `MouseTimeDisplay` component.
     *
     * @param {Event} event
     *        The `mousemove` event that caused this function to run.
     *
     * @listen mousemove
     */
    handleMouseMove(event: Event): void;
    throttledHandleMouseSeek: Function;
    handleMouseUpHandler_: (e: any) => void;
    handleMouseDownHandler_: (e: any) => void;
    /**
     * Create the `Component`'s DOM element
     *
     * @return {Element}
     *         The element that was created.
     */
    createEl(): Element;
    /**
     * A throttled version of the {@link ProgressControl#handleMouseSeek} listener.
     *
     * @method ProgressControl#throttledHandleMouseSeek
     * @param {Event} event
     *        The `mousemove` event that caused this function to run.
     *
     * @listen mousemove
     * @listen touchmove
     */
    /**
     * Handle `mousemove` or `touchmove` events on the `ProgressControl`.
     *
     * @param {Event} event
     *        `mousedown` or `touchstart` event that triggered this function
     *
     * @listens mousemove
     * @listens touchmove
     */
    handleMouseSeek(event: Event): void;
    /**
     * Are controls are currently enabled for this progress control.
     *
     * @return {boolean}
     *         true if controls are enabled, false otherwise
     */
    enabled(): boolean;
    /**
     * Disable all controls on the progress control and its children
     */
    disable(): void;
    enabled_: boolean;
    /**
     * Enable all controls on the progress control and its children
     */
    enable(): void;
    /**
     * Cleanup listeners after the user finishes interacting with the progress controls
     */
    removeListenersAddedOnMousedownAndTouchstart(): void;
    /**
     * Handle `mousedown` or `touchstart` events on the `ProgressControl`.
     *
     * @param {Event} event
     *        `mousedown` or `touchstart` event that triggered this function
     *
     * @listens mousedown
     * @listens touchstart
     */
    handleMouseDown(event: Event): void;
    /**
     * Handle `mouseup` or `touchend` events on the `ProgressControl`.
     *
     * @param {Event} event
     *        `mouseup` or `touchend` event that triggered this function.
     *
     * @listens touchend
     * @listens mouseup
     */
    handleMouseUp(event: Event): void;
}
import Component from "../../component.js";
//# sourceMappingURL=progress-control.d.ts.map