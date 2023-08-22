export default Button;
/**
 * Base class for all buttons.
 *
 * @extends ClickableComponent
 */
declare class Button extends ClickableComponent {
    /**
     * Add a child `Component` inside of this `Button`.
     *
     * @param {string|Component} child
     *        The name or instance of a child to add.
     *
     * @param {Object} [options={}]
     *        The key/value store of options that will get passed to children of
     *        the child.
     *
     * @return {Component}
     *         The `Component` that gets added as a child. When using a string the
     *         `Component` will get created by this process.
     *
     * @deprecated since version 5
     */
    addChild(child: string | Component, options?: any): Component;
}
import ClickableComponent from "./clickable-component.js";
import Component from "./component";
//# sourceMappingURL=button.d.ts.map