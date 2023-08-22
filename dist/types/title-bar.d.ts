export default TitleBar;
/**
 * Displays an element over the player which contains an optional title and
 * description for the current content.
 *
 * Much of the code for this component originated in the now obsolete
 * videojs-dock plugin: https://github.com/brightcove/videojs-dock/
 *
 * @extends Component
 */
declare class TitleBar extends Component {
    constructor(player: any, options: any);
    /**
     * Create the `TitleBar`'s DOM element
     *
     * @return {Element}
     *         The element that was created.
     */
    createEl(): Element;
    els: {
        title: Element;
        description: Element;
    };
    /**
     * Updates the DOM based on the component's state object.
     */
    updateDom_(): void;
    /**
     * Update the contents of the title bar component with new title and
     * description text.
     *
     * If both title and description are missing, the title bar will be hidden.
     *
     * If either title or description are present, the title bar will be visible.
     *
     * NOTE: Any previously set value will be preserved. To unset a previously
     * set value, you must pass an empty string or null.
     *
     * For example:
     *
     * ```
     * update({title: 'foo', description: 'bar'}) // title: 'foo', description: 'bar'
     * update({description: 'bar2'}) // title: 'foo', description: 'bar2'
     * update({title: ''}) // title: '', description: 'bar2'
     * update({title: 'foo', description: null}) // title: 'foo', description: null
     * ```
     *
     * @param  {Object} [options={}]
     *         An options object. When empty, the title bar will be hidden.
     *
     * @param  {string} [options.title]
     *         A title to display in the title bar.
     *
     * @param  {string} [options.description]
     *         A description to display in the title bar.
     */
    update(options?: {
        title?: string;
        description?: string;
    }): void;
    /**
     * Dispose the component.
     */
    dispose(): void;
}
import Component from "./component";
//# sourceMappingURL=title-bar.d.ts.map