export default CloseButton;
/**
 * The `CloseButton` is a `{@link Button}` that fires a `close` event when
 * it gets clicked.
 *
 * @extends Button
 */
declare class CloseButton extends Button {
    /**
    * Creates an instance of the this class.
    *
    * @param  { import('./player').default } player
    *         The `Player` that this class should be attached to.
    *
    * @param  {Object} [options]
    *         The key/value store of player options.
    */
    constructor(player: import('./player').default, options?: any);
    /**
     * This gets called when a `CloseButton` gets clicked. See
     * {@link ClickableComponent#handleClick} for more information on when
     * this will be triggered
     *
     * @param {Event} event
     *        The `keydown`, `tap`, or `click` event that caused this function to be
     *        called.
     *
     * @listens tap
     * @listens click
     * @fires CloseButton#close
     */
    handleClick(event: Event): void;
}
import Button from "./button";
//# sourceMappingURL=close-button.d.ts.map