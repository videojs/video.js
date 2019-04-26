/**
 * @file modal-dialog.js
 */
import * as Dom from './utils/dom';
import Component from './component';
import window from 'global/window';
import document from 'global/document';
import keycode from 'keycode';

const MODAL_CLASS_NAME = 'vjs-modal-dialog';

/**
 * The `ModalDialog` displays over the video and its controls, which blocks
 * interaction with the player until it is closed.
 *
 * Modal dialogs include a "Close" button and will close when that button
 * is activated - or when ESC is pressed anywhere.
 *
 * @extends Component
 */
class ModalDialog extends Component {

  /**
   * Create an instance of this class.
   *
   * @param {Player} player
   *        The `Player` that this class should be attached to.
   *
   * @param {Object} [options]
   *        The key/value store of player options.
   *
   * @param {Mixed} [options.content=undefined]
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
  constructor(player, options) {
    super(player, options);
    this.opened_ = this.hasBeenOpened_ = this.hasBeenFilled_ = false;

    this.closeable(!this.options_.uncloseable);
    this.content(this.options_.content);

    // Make sure the contentEl is defined AFTER any children are initialized
    // because we only want the contents of the modal in the contentEl
    // (not the UI elements like the close button).
    this.contentEl_ = Dom.createEl('div', {
      className: `${MODAL_CLASS_NAME}-content`
    }, {
      role: 'document'
    });

    this.descEl_ = Dom.createEl('p', {
      className: `${MODAL_CLASS_NAME}-description vjs-control-text`,
      id: this.el().getAttribute('aria-describedby')
    });

    Dom.textContent(this.descEl_, this.description());
    this.el_.appendChild(this.descEl_);
    this.el_.appendChild(this.contentEl_);
  }

  /**
   * Create the `ModalDialog`'s DOM element
   *
   * @return {Element}
   *         The DOM element that gets created.
   */
  createEl() {
    return super.createEl('div', {
      className: this.buildCSSClass(),
      tabIndex: -1
    }, {
      'aria-describedby': `${this.id()}_description`,
      'aria-hidden': 'true',
      'aria-label': this.label(),
      'role': 'dialog'
    });
  }

  dispose() {
    this.contentEl_ = null;
    this.descEl_ = null;
    this.previouslyActiveEl_ = null;

    super.dispose();
  }

  /**
   * Builds the default DOM `className`.
   *
   * @return {string}
   *         The DOM `className` for this object.
   */
  buildCSSClass() {
    return `${MODAL_CLASS_NAME} vjs-hidden ${super.buildCSSClass()}`;
  }

  /**
   * Returns the label string for this modal. Primarily used for accessibility.
   *
   * @return {string}
   *         the localized or raw label of this modal.
   */
  label() {
    return this.localize(this.options_.label || 'Modal Window');
  }

  /**
   * Returns the description string for this modal. Primarily used for
   * accessibility.
   *
   * @return {string}
   *         The localized or raw description of this modal.
   */
  description() {
    let desc = this.options_.description || this.localize('This is a modal window.');

    // Append a universal closeability message if the modal is closeable.
    if (this.closeable()) {
      desc += ' ' + this.localize('This modal can be closed by pressing the Escape key or activating the close button.');
    }

    return desc;
  }

  /**
   * Opens the modal.
   *
   * @fires ModalDialog#beforemodalopen
   * @fires ModalDialog#modalopen
   */
  open() {
    if (!this.opened_) {
      const player = this.player();

      /**
        * Fired just before a `ModalDialog` is opened.
        *
        * @event ModalDialog#beforemodalopen
        * @type {EventTarget~Event}
        */
      this.trigger('beforemodalopen');
      this.opened_ = true;

      // Fill content if the modal has never opened before and
      // never been filled.
      if (this.options_.fillAlways || !this.hasBeenOpened_ && !this.hasBeenFilled_) {
        this.fill();
      }

      // If the player was playing, pause it and take note of its previously
      // playing state.
      this.wasPlaying_ = !player.paused();

      if (this.options_.pauseOnOpen && this.wasPlaying_) {
        player.pause();
      }

      this.on('keydown', this.handleKeyDown);

      // Hide controls and note if they were enabled.
      this.hadControls_ = player.controls();
      player.controls(false);

      this.show();
      this.conditionalFocus_();
      this.el().setAttribute('aria-hidden', 'false');

      /**
        * Fired just after a `ModalDialog` is opened.
        *
        * @event ModalDialog#modalopen
        * @type {EventTarget~Event}
        */
      this.trigger('modalopen');
      this.hasBeenOpened_ = true;
    }
  }

  /**
   * If the `ModalDialog` is currently open or closed.
   *
   * @param  {boolean} [value]
   *         If given, it will open (`true`) or close (`false`) the modal.
   *
   * @return {boolean}
   *         the current open state of the modaldialog
   */
  opened(value) {
    if (typeof value === 'boolean') {
      this[value ? 'open' : 'close']();
    }
    return this.opened_;
  }

  /**
   * Closes the modal, does nothing if the `ModalDialog` is
   * not open.
   *
   * @fires ModalDialog#beforemodalclose
   * @fires ModalDialog#modalclose
   */
  close() {
    if (!this.opened_) {
      return;
    }
    const player = this.player();

    /**
      * Fired just before a `ModalDialog` is closed.
      *
      * @event ModalDialog#beforemodalclose
      * @type {EventTarget~Event}
      */
    this.trigger('beforemodalclose');
    this.opened_ = false;

    if (this.wasPlaying_ && this.options_.pauseOnOpen) {
      player.play();
    }

    this.off('keydown', this.handleKeyDown);

    if (this.hadControls_) {
      player.controls(true);
    }

    this.hide();
    this.el().setAttribute('aria-hidden', 'true');

    /**
      * Fired just after a `ModalDialog` is closed.
      *
      * @event ModalDialog#modalclose
      * @type {EventTarget~Event}
      */
    this.trigger('modalclose');
    this.conditionalBlur_();

    if (this.options_.temporary) {
      this.dispose();
    }
  }

  /**
   * Check to see if the `ModalDialog` is closeable via the UI.
   *
   * @param  {boolean} [value]
   *         If given as a boolean, it will set the `closeable` option.
   *
   * @return {boolean}
   *         Returns the final value of the closable option.
   */
  closeable(value) {
    if (typeof value === 'boolean') {
      const closeable = this.closeable_ = !!value;
      let close = this.getChild('closeButton');

      // If this is being made closeable and has no close button, add one.
      if (closeable && !close) {

        // The close button should be a child of the modal - not its
        // content element, so temporarily change the content element.
        const temp = this.contentEl_;

        this.contentEl_ = this.el_;
        close = this.addChild('closeButton', {controlText: 'Close Modal Dialog'});
        this.contentEl_ = temp;
        this.on(close, 'close', this.close);
      }

      // If this is being made uncloseable and has a close button, remove it.
      if (!closeable && close) {
        this.off(close, 'close', this.close);
        this.removeChild(close);
        close.dispose();
      }
    }
    return this.closeable_;
  }

  /**
   * Fill the modal's content element with the modal's "content" option.
   * The content element will be emptied before this change takes place.
   */
  fill() {
    this.fillWith(this.content());
  }

  /**
   * Fill the modal's content element with arbitrary content.
   * The content element will be emptied before this change takes place.
   *
   * @fires ModalDialog#beforemodalfill
   * @fires ModalDialog#modalfill
   *
   * @param {Mixed} [content]
   *        The same rules apply to this as apply to the `content` option.
   */
  fillWith(content) {
    const contentEl = this.contentEl();
    const parentEl = contentEl.parentNode;
    const nextSiblingEl = contentEl.nextSibling;

    /**
      * Fired just before a `ModalDialog` is filled with content.
      *
      * @event ModalDialog#beforemodalfill
      * @type {EventTarget~Event}
      */
    this.trigger('beforemodalfill');
    this.hasBeenFilled_ = true;

    // Detach the content element from the DOM before performing
    // manipulation to avoid modifying the live DOM multiple times.
    parentEl.removeChild(contentEl);
    this.empty();
    Dom.insertContent(contentEl, content);
    /**
     * Fired just after a `ModalDialog` is filled with content.
     *
     * @event ModalDialog#modalfill
     * @type {EventTarget~Event}
     */
    this.trigger('modalfill');

    // Re-inject the re-filled content element.
    if (nextSiblingEl) {
      parentEl.insertBefore(contentEl, nextSiblingEl);
    } else {
      parentEl.appendChild(contentEl);
    }

    // make sure that the close button is last in the dialog DOM
    const closeButton = this.getChild('closeButton');

    if (closeButton) {
      parentEl.appendChild(closeButton.el_);
    }
  }

  /**
   * Empties the content element. This happens anytime the modal is filled.
   *
   * @fires ModalDialog#beforemodalempty
   * @fires ModalDialog#modalempty
   */
  empty() {
    /**
    * Fired just before a `ModalDialog` is emptied.
    *
    * @event ModalDialog#beforemodalempty
    * @type {EventTarget~Event}
    */
    this.trigger('beforemodalempty');
    Dom.emptyEl(this.contentEl());

    /**
    * Fired just after a `ModalDialog` is emptied.
    *
    * @event ModalDialog#modalempty
    * @type {EventTarget~Event}
    */
    this.trigger('modalempty');
  }

  /**
   * Gets or sets the modal content, which gets normalized before being
   * rendered into the DOM.
   *
   * This does not update the DOM or fill the modal, but it is called during
   * that process.
   *
   * @param  {Mixed} [value]
   *         If defined, sets the internal content value to be used on the
   *         next call(s) to `fill`. This value is normalized before being
   *         inserted. To "clear" the internal content value, pass `null`.
   *
   * @return {Mixed}
   *         The current content of the modal dialog
   */
  content(value) {
    if (typeof value !== 'undefined') {
      this.content_ = value;
    }
    return this.content_;
  }

  /**
   * conditionally focus the modal dialog if focus was previously on the player.
   *
   * @private
   */
  conditionalFocus_() {
    const activeEl = document.activeElement;
    const playerEl = this.player_.el_;

    this.previouslyActiveEl_ = null;

    if (playerEl.contains(activeEl) || playerEl === activeEl) {
      this.previouslyActiveEl_ = activeEl;

      this.focus();
    }
  }

  /**
   * conditionally blur the element and refocus the last focused element
   *
   * @private
   */
  conditionalBlur_() {
    if (this.previouslyActiveEl_) {
      this.previouslyActiveEl_.focus();
      this.previouslyActiveEl_ = null;
    }
  }

  /**
   * Keydown handler. Attached when modal is focused.
   *
   * @listens keydown
   */
  handleKeyDown(event) {

    // Do not allow keydowns to reach out of the modal dialog.
    event.stopPropagation();

    if (keycode.isEventKey(event, 'Escape') && this.closeable()) {
      this.close();
      return;
    }

    // exit early if it isn't a tab key
    if (!keycode.isEventKey(event, 'Tab')) {
      return;
    }

    const focusableEls = this.focusableEls_();
    const activeEl = this.el_.querySelector(':focus');
    let focusIndex;

    for (let i = 0; i < focusableEls.length; i++) {
      if (activeEl === focusableEls[i]) {
        focusIndex = i;
        break;
      }
    }

    if (document.activeElement === this.el_) {
      focusIndex = 0;
    }

    if (event.shiftKey && focusIndex === 0) {
      focusableEls[focusableEls.length - 1].focus();
      event.preventDefault();
    } else if (!event.shiftKey && focusIndex === focusableEls.length - 1) {
      focusableEls[0].focus();
      event.preventDefault();
    }
  }

  /**
   * get all focusable elements
   *
   * @private
   */
  focusableEls_() {
    const allChildren = this.el_.querySelectorAll('*');

    return Array.prototype.filter.call(allChildren, (child) => {
      return ((child instanceof window.HTMLAnchorElement ||
               child instanceof window.HTMLAreaElement) && child.hasAttribute('href')) ||
             ((child instanceof window.HTMLInputElement ||
               child instanceof window.HTMLSelectElement ||
               child instanceof window.HTMLTextAreaElement ||
               child instanceof window.HTMLButtonElement) && !child.hasAttribute('disabled')) ||
             (child instanceof window.HTMLIFrameElement ||
               child instanceof window.HTMLObjectElement ||
               child instanceof window.HTMLEmbedElement) ||
             (child.hasAttribute('tabindex') && child.getAttribute('tabindex') !== -1) ||
             (child.hasAttribute('contenteditable'));
    });
  }
}

/**
 * Default options for `ModalDialog` default options.
 *
 * @type {Object}
 * @private
 */
ModalDialog.prototype.options_ = {
  pauseOnOpen: true,
  temporary: true
};

Component.registerComponent('ModalDialog', ModalDialog);
export default ModalDialog;
