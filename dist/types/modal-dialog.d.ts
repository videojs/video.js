export default ModalDialog;
/**
 * The `ModalDialog` displays over the video and its controls, which blocks
 * interaction with the player until it is closed.
 *
 * Modal dialogs include a "Close" button and will close when that button
 * is activated - or when ESC is pressed anywhere.
 *
 * @extends Component
 */
declare class ModalDialog extends Component {
    /**
     * Create an instance of this class.
     *
     * @param { import('./player').default } player
     *        The `Player` that this class should be attached to.
     *
     * @param {Object} [options]
     *        The key/value store of player options.
     *
     * @param { import('./utils/dom').ContentDescriptor} [options.content=undefined]
     *        Provide customized content for this modal.
     *
     * @param {string} [options.description]
     *        A text description for the modal, primarily for accessibility.
     *
     * @param {boolean} [options.fillAlways=false]
     *        Normally, modals are automatically filled only the first time
     *        they open. This tells the modal to refresh its content
     *        every time it opens.
     *
     * @param {string} [options.label]
     *        A text label for the modal, primarily for accessibility.
     *
     * @param {boolean} [options.pauseOnOpen=true]
     *        If `true`, playback will will be paused if playing when
     *        the modal opens, and resumed when it closes.
     *
     * @param {boolean} [options.temporary=true]
     *        If `true`, the modal can only be opened once; it will be
     *        disposed as soon as it's closed.
     *
     * @param {boolean} [options.uncloseable=false]
     *        If `true`, the user will not be able to close the modal
     *        through the UI in the normal ways. Programmatic closing is
     *        still possible.
     */
    constructor(player: import('./player').default, options?: {
        content?: import('./utils/dom').ContentDescriptor;
        description?: string;
        fillAlways?: boolean;
        label?: string;
        pauseOnOpen?: boolean;
        temporary?: boolean;
        uncloseable?: boolean;
    });
    handleKeyDown_: (e: any) => void;
    close_: (e: any) => void;
    opened_: boolean;
    hasBeenOpened_: boolean;
    hasBeenFilled_: boolean;
    contentEl_: Element;
    descEl_: Element;
    /**
     * Create the `ModalDialog`'s DOM element
     *
     * @return {Element}
     *         The DOM element that gets created.
     */
    createEl(): Element;
    dispose(): void;
    previouslyActiveEl_: any;
    /**
     * Returns the label string for this modal. Primarily used for accessibility.
     *
     * @return {string}
     *         the localized or raw label of this modal.
     */
    label(): string;
    /**
     * Returns the description string for this modal. Primarily used for
     * accessibility.
     *
     * @return {string}
     *         The localized or raw description of this modal.
     */
    description(): string;
    /**
     * Opens the modal.
     *
     * @fires ModalDialog#beforemodalopen
     * @fires ModalDialog#modalopen
     */
    open(): void;
    wasPlaying_: boolean;
    hadControls_: boolean;
    /**
     * If the `ModalDialog` is currently open or closed.
     *
     * @param  {boolean} [value]
     *         If given, it will open (`true`) or close (`false`) the modal.
     *
     * @return {boolean}
     *         the current open state of the modaldialog
     */
    opened(value?: boolean): boolean;
    /**
     * Closes the modal, does nothing if the `ModalDialog` is
     * not open.
     *
     * @fires ModalDialog#beforemodalclose
     * @fires ModalDialog#modalclose
     */
    close(): void;
    /**
     * Check to see if the `ModalDialog` is closeable via the UI.
     *
     * @param  {boolean} [value]
     *         If given as a boolean, it will set the `closeable` option.
     *
     * @return {boolean}
     *         Returns the final value of the closable option.
     */
    closeable(value?: boolean): boolean;
    closeable_: boolean;
    /**
     * Fill the modal's content element with the modal's "content" option.
     * The content element will be emptied before this change takes place.
     */
    fill(): void;
    /**
     * Fill the modal's content element with arbitrary content.
     * The content element will be emptied before this change takes place.
     *
     * @fires ModalDialog#beforemodalfill
     * @fires ModalDialog#modalfill
     *
     * @param { import('./utils/dom').ContentDescriptor} [content]
     *        The same rules apply to this as apply to the `content` option.
     */
    fillWith(content?: import('./utils/dom').ContentDescriptor): void;
    /**
     * Empties the content element. This happens anytime the modal is filled.
     *
     * @fires ModalDialog#beforemodalempty
     * @fires ModalDialog#modalempty
     */
    empty(): void;
    /**
     * Gets or sets the modal content, which gets normalized before being
     * rendered into the DOM.
     *
     * This does not update the DOM or fill the modal, but it is called during
     * that process.
     *
     * @param  { import('./utils/dom').ContentDescriptor} [value]
     *         If defined, sets the internal content value to be used on the
     *         next call(s) to `fill`. This value is normalized before being
     *         inserted. To "clear" the internal content value, pass `null`.
     *
     * @return { import('./utils/dom').ContentDescriptor}
     *         The current content of the modal dialog
     */
    content(value?: import('./utils/dom').ContentDescriptor): import('./utils/dom').ContentDescriptor;
    content_: Dom.ContentDescriptor;
    /**
     * conditionally focus the modal dialog if focus was previously on the player.
     *
     * @private
     */
    private conditionalFocus_;
    /**
     * conditionally blur the element and refocus the last focused element
     *
     * @private
     */
    private conditionalBlur_;
    /**
     * Keydown handler. Attached when modal is focused.
     *
     * @listens keydown
     */
    handleKeyDown(event: any): void;
    /**
     * get all focusable elements
     *
     * @private
     */
    private focusableEls_;
}
import Component from "./component";
import * as Dom from "./utils/dom";
//# sourceMappingURL=modal-dialog.d.ts.map