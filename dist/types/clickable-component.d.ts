export default ClickableComponent;
/**
 * Component which is clickable or keyboard actionable, but is not a
 * native HTML button.
 *
 * @extends Component
 */
declare class ClickableComponent extends Component {
    /**
     * Creates an instance of this class.
     *
     * @param  { import('./player').default } player
     *         The `Player` that this class should be attached to.
     *
     * @param  {Object} [options]
     *         The key/value store of component options.
     *
     * @param  {function} [options.clickHandler]
     *         The function to call when the button is clicked / activated
     *
     * @param  {string} [options.controlText]
     *         The text to set on the button
     *
     * @param  {string} [options.className]
     *         A class or space separated list of classes to add the component
     *
     */
    constructor(player: import('./player').default, options?: {
        clickHandler?: Function;
        controlText?: string;
        className?: string;
    });
    handleMouseOver_: (e: any) => any;
    handleMouseOut_: (e: any) => any;
    handleClick_: (e: any) => void;
    handleKeyDown_: (e: any) => void;
    tabIndex_: any;
    dispose(): void;
    controlTextEl_: Element;
    /**
     * Create a control text element on this `ClickableComponent`
     *
     * @param {Element} [el]
     *        Parent element for the control text.
     *
     * @return {Element}
     *         The control text element that gets created.
     */
    createControlTextEl(el?: Element): Element;
    /**
     * Get or set the localize text to use for the controls on the `ClickableComponent`.
     *
     * @param {string} [text]
     *        Control text for element.
     *
     * @param {Element} [el=this.el()]
     *        Element to set the title on.
     *
     * @return {string}
     *         - The control text when getting
     */
    controlText(text?: string, el?: Element): string;
    /** @protected */
    protected controlText_: string;
    /**
     * Enable this `ClickableComponent`
     */
    enable(): void;
    enabled_: boolean;
    /**
     * Disable this `ClickableComponent`
     */
    disable(): void;
    /**
     * Event handler that is called when a `ClickableComponent` receives a
     * `click` or `tap` event.
     *
     * @param {Event} event
     *        The `tap` or `click` event that caused this function to be called.
     *
     * @listens tap
     * @listens click
     * @abstract
     */
    handleClick(event: Event, ...args: any[]): void;
    /**
     * Event handler that is called when a `ClickableComponent` receives a
     * `keydown` event.
     *
     * By default, if the key is Space or Enter, it will trigger a `click` event.
     *
     * @param {Event} event
     *        The `keydown` event that caused this function to be called.
     *
     * @listens keydown
     */
    handleKeyDown(event: Event): void;
}
import Component from "./component";
//# sourceMappingURL=clickable-component.d.ts.map