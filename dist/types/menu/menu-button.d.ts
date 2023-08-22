export default MenuButton;
/**
 * A `MenuButton` class for any popup {@link Menu}.
 *
 * @extends Component
 */
declare class MenuButton extends Component {
    /**
     * Creates an instance of this class.
     *
     * @param { import('../player').default } player
     *        The `Player` that this class should be attached to.
     *
     * @param {Object} [options={}]
     *        The key/value store of player options.
     */
    constructor(player: import('../player').default, options?: any);
    menuButton_: Button;
    enabled_: boolean;
    handleMenuKeyUp_: (e: any) => void;
    /**
     * Update the menu based on the current state of its items.
     */
    update(): void;
    menu: Menu;
    /**
     * Track the state of the menu button
     *
     * @type {Boolean}
     * @private
     */
    private buttonPressed_;
    /**
     * Create the menu and add all items to it.
     *
     * @return {Menu}
     *         The constructed menu
     */
    createMenu(): Menu;
    /**
     * Hide the menu if the number of items is less than or equal to this threshold. This defaults
     * to 0 and whenever we add items which can be hidden to the menu we'll increment it. We list
     * it here because every time we run `createMenu` we need to reset the value.
     *
     * @protected
     * @type {Number}
     */
    protected hideThreshold_: number;
    items: void;
    /**
     * Create the list of menu items. Specific to each subclass.
     *
     * @abstract
     */
    createItems(): void;
    /**
     * Create the `MenuButtons`s DOM element.
     *
     * @return {Element}
     *         The element that gets created.
     */
    createEl(): Element;
    /**
     * Overwrites the `setIcon` method from `Component`.
     * In this case, we want the icon to be appended to the menuButton.
     *
     * @param {string} name
     *         The icon name to be added.
     */
    setIcon(name: string): void;
    /**
     * Allow sub components to stack CSS class names for the wrapper element
     *
     * @return {string}
     *         The constructed wrapper DOM `className`
     */
    buildWrapperCSSClass(): string;
    /**
     * Get or set the localized control text that will be used for accessibility.
     *
     * > NOTE: This will come from the internal `menuButton_` element.
     *
     * @param {string} [text]
     *        Control text for element.
     *
     * @param {Element} [el=this.menuButton_.el()]
     *        Element to set the title on.
     *
     * @return {string}
     *         - The control text when getting
     */
    controlText(text?: string, el?: Element): string;
    /**
     * Dispose of the `menu-button` and all child components.
     */
    dispose(): void;
    /**
     * Handle a click on a `MenuButton`.
     * See {@link ClickableComponent#handleClick} for instances where this is called.
     *
     * @param {Event} event
     *        The `keydown`, `tap`, or `click` event that caused this function to be
     *        called.
     *
     * @listens tap
     * @listens click
     */
    handleClick(event: Event): void;
    /**
     * Handle `mouseleave` for `MenuButton`.
     *
     * @param {Event} event
     *        The `mouseleave` event that caused this function to be called.
     *
     * @listens mouseleave
     */
    handleMouseLeave(event: Event): void;
    /**
     * Handle tab, escape, down arrow, and up arrow keys for `MenuButton`. See
     * {@link ClickableComponent#handleKeyDown} for instances where this is called.
     *
     * @param {Event} event
     *        The `keydown` event that caused this function to be called.
     *
     * @listens keydown
     */
    handleKeyDown(event: Event): void;
    /**
     * Handle a `keyup` event on a `MenuButton`. The listener for this is added in
     * the constructor.
     *
     * @param {Event} event
     *        Key press event
     *
     * @listens keyup
     */
    handleMenuKeyUp(event: Event): void;
    /**
     * This method name now delegates to `handleSubmenuKeyDown`. This means
     * anyone calling `handleSubmenuKeyPress` will not see their method calls
     * stop working.
     *
     * @param {Event} event
     *        The event that caused this function to be called.
     */
    handleSubmenuKeyPress(event: Event): void;
    /**
     * Handle a `keydown` event on a sub-menu. The listener for this is added in
     * the constructor.
     *
     * @param {Event} event
     *        Key press event
     *
     * @listens keydown
     */
    handleSubmenuKeyDown(event: Event): void;
    /**
     * Put the current `MenuButton` into a pressed state.
     */
    pressButton(): void;
    /**
     * Take the current `MenuButton` out of a pressed state.
     */
    unpressButton(): void;
    /**
     * Disable the `MenuButton`. Don't allow it to be clicked.
     */
    disable(): void;
    /**
     * Enable the `MenuButton`. Allow it to be clicked.
     */
    enable(): void;
}
import Component from "../component.js";
import Button from "../button.js";
import Menu from "./menu.js";
//# sourceMappingURL=menu-button.d.ts.map