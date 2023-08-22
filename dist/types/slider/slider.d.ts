export default Slider;
/**
 * The base functionality for a slider. Can be vertical or horizontal.
 * For instance the volume bar or the seek bar on a video is a slider.
 *
 * @extends Component
 */
declare class Slider extends Component {
    /**
   * Create an instance of this class
   *
   * @param { import('../player').default } player
   *        The `Player` that this class should be attached to.
   *
   * @param {Object} [options]
   *        The key/value store of player options.
   */
    constructor(player: import('../player').default, options?: any);
    handleMouseDown_: (e: any) => void;
    handleMouseUp_: (e: any) => void;
    handleKeyDown_: (e: any) => void;
    handleClick_: (e: any) => void;
    handleMouseMove_: (e: any) => void;
    update_: (e: any) => number;
    bar: Component;
    /**
     * Are controls are currently enabled for this slider or not.
     *
     * @return {boolean}
     *         true if controls are enabled, false otherwise
     */
    enabled(): boolean;
    /**
     * Enable controls for this slider if they are disabled
     */
    enable(): void;
    enabled_: boolean;
    /**
     * Disable controls for this slider if they are enabled
     */
    disable(): void;
    /**
     * Create the `Slider`s DOM element.
     *
     * @param {string} type
     *        Type of element to create.
     *
     * @param {Object} [props={}]
     *        List of properties in Object form.
     *
     * @param {Object} [attributes={}]
     *        list of attributes in Object form.
     *
     * @return {Element}
     *         The element that gets created.
     */
    createEl(type: string, props?: any, attributes?: any): Element;
    /**
     * Handle `mousedown` or `touchstart` events on the `Slider`.
     *
     * @param {MouseEvent} event
     *        `mousedown` or `touchstart` event that triggered this function
     *
     * @listens mousedown
     * @listens touchstart
     * @fires Slider#slideractive
     */
    handleMouseDown(event: MouseEvent): void;
    /**
     * Handle the `mousemove`, `touchmove`, and `mousedown` events on this `Slider`.
     * The `mousemove` and `touchmove` events will only only trigger this function during
     * `mousedown` and `touchstart`. This is due to {@link Slider#handleMouseDown} and
     * {@link Slider#handleMouseUp}.
     *
     * @param {MouseEvent} event
     *        `mousedown`, `mousemove`, `touchstart`, or `touchmove` event that triggered
     *        this function
     * @param {boolean} mouseDown this is a flag that should be set to true if `handleMouseMove` is called directly. It allows us to skip things that should not happen if coming from mouse down but should happen on regular mouse move handler. Defaults to false.
     *
     * @listens mousemove
     * @listens touchmove
     */
    handleMouseMove(event: MouseEvent): void;
    /**
     * Handle `mouseup` or `touchend` events on the `Slider`.
     *
     * @param {MouseEvent} event
     *        `mouseup` or `touchend` event that triggered this function.
     *
     * @listens touchend
     * @listens mouseup
     * @fires Slider#sliderinactive
     */
    handleMouseUp(event: MouseEvent): void;
    /**
     * Update the progress bar of the `Slider`.
     *
     * @return {number}
     *          The percentage of progress the progress bar represents as a
     *          number from 0 to 1.
     */
    update(): number;
    progress_: any;
    /**
     * Get the percentage of the bar that should be filled
     * but clamped and rounded.
     *
     * @return {number}
     *         percentage filled that the slider is
     */
    getProgress(): number;
    /**
     * Calculate distance for slider
     *
     * @param {Event} event
     *        The event that caused this function to run.
     *
     * @return {number}
     *         The current position of the Slider.
     *         - position.x for vertical `Slider`s
     *         - position.y for horizontal `Slider`s
     */
    calculateDistance(event: Event): number;
    /**
     * Listener for click events on slider, used to prevent clicks
     *   from bubbling up to parent elements like button menus.
     *
     * @param {Object} event
     *        Event that caused this object to run
     */
    handleClick(event: any): void;
    /**
     * Get/set if slider is horizontal for vertical
     *
     * @param {boolean} [bool]
     *        - true if slider is vertical,
     *        - false is horizontal
     *
     * @return {boolean}
     *         - true if slider is vertical, and getting
     *         - false if the slider is horizontal, and getting
     */
    vertical(bool?: boolean): boolean;
    vertical_: boolean;
}
import Component from "../component.js";
//# sourceMappingURL=slider.d.ts.map