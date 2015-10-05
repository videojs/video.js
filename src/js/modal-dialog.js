/**
 * @file modal-dialog.js
 */
import document from 'global/document';
import tsml from 'tsml';

import * as Dom from './utils/dom';
import * as Events from './utils/events';
import * as Fn from './utils/fn';

import Component from './component';
import CloseButton from './close-button';

const CLASS_NAME_PREFIX = 'vjs-modal-dialog';

// An array of strings which are used for modal dialog sub-element classes,
// so will cause CSS issues if used as a slug.
const DISALLOWED_SLUGS = [
  'content'
];

const ESC = 27;

/**
 * The `ModalDialog` displays over the video and its controls, which blocks
 * interaction with the player until it is closed.
 *
 * Modal dialogs include a "Close" button and will close when that button
 * is activated - or when ESC is pressed anywhere.
 *
 * @extends Component
 * @class ModalDialog
 */
class ModalDialog extends Component {

  /**
   * Constructor for modal dialogs.
   *
   * @param  {Player} player
   * @param  {Object} [options]
   * @param  {Mixed} [options.content]
   *         Provide customized content for this modal dialog.
   *
   * @param  {Boolean} [options.disposeOnClose=false]
   *         If `true`, the modal dialog can only be opened once. It will be
   *         disposed as soon as it's closed, which is useful for one-off
   *         modal dialogs.
   *
   * @param  {String} [options.label='']
   *         A text label for the modal dialog, primarily for accessibility.
   *
   * @param  {Boolean} [options.openImmediately=false]
   *         If `true`, the modal dialog will be displayed immediately upon
   *         instantiation.
   *
   * @param  {Boolean} [options.fillImmediately=false]
   *         If `true`, the modal dialog will be filled immediately upon
   *         instantiation - rather than manually or the first time it
   *         opens.
   *
   * @param  {String} [options.slug]
   *         This is a string that will be prefixed with "vjs-modal-dialog-"
   *         to construct a CSS class specific to this modal dialog. For
   *         example, if this option were "foo," the modal dialog could be
   *         identified with the class "vjs-modal-dialog-foo".
   */
  constructor(player, options) {
    if (options && DISALLOWED_SLUGS.indexOf(options.slug) > -1) {
      throw new Error(`${options.slug} is not allowed as a slug`);
    }

    super(player, options);
    this.opened_ = this.hasBeenOpened_ = this.hasBeenFilled_ = false;

    // If a close button was added (which is the default), set the modal
    // dialog to close when the button is activated.
    let close = this.getChild('closeButton');
    if (close) {
      this.on(close, 'close', this.close);
    }

    // Make sure the contentEl is defined AFTER any children are initialized
    // because we only want the contents of the modal dialog in the contentEl
    // (not the UI elements like the close button).
    this.contentEl_ = Dom.createEl('div', {
      className: `${CLASS_NAME_PREFIX}-content`
    });
    this.el_.appendChild(this.contentEl_);

    if (this.options_.fillImmediately) {
      this.fill();
    }

    if (this.options_.openImmediately) {
      this.open();
    }
  }

  /**
   * Create the modal dialog's DOM element
   *
   * @method createEl
   */
  createEl() {
    return super.createEl('div', {
      className: this.buildCSSClass(),
      tabIndex: -1
    }, {
      'aria-role': 'dialog',
      'aria-label': this.options_.label || ''
    });
  }

  /**
   * Build the modal dialog's CSS class.
   *
   * @method buildCSSClass
   */
  buildCSSClass() {
    return `${CLASS_NAME_PREFIX} vjs-hidden ${CLASS_NAME_PREFIX}-${this.options_.slug} ${super.buildCSSClass()}`;
  }

  /**
   * Handles key presses on the document, looking for ESC, which closes
   * the modal dialog.
   *
   * @method handleKeyPress
   * @param  {Event} e
   */
  handleKeyPress(e) {
    if (e.which === ESC) {
      this.close();
    }
  }

  /**
   * Opens the modal dialog.
   *
   * @method open
   * @return {ModalDialog}
   */
  open() {
    if (!this.opened_) {
      let player = this.player();

      this.trigger('beforemodalopen');
      this.opened_ = true;

      // Fill content if the modal dialog has never opened before and
      // never been filled.
      if (this.options_.content && !this.hasBeenOpened_ && !this.hasBeenFilled_) {
        this.fill();
      }

      // If the player was playing, pause it and take note of its previously
      // playing state.
      this.wasPlaying_ = !player.paused();
      if (this.wasPlaying_) {
        player.pause();
      }

      player.controls(false);
      Events.on(document, 'keydown', Fn.bind(this, this.handleKeyPress));
      this.show();
      this.trigger('modalopen');
      this.hasBeenOpened_ = true;
    }
    return this;
  }

  /**
   * Whether or not the modal dialog is opened currently.
   *
   * @method opened
   * @return {Boolean}
   */
  opened() {
    return !!this.opened_;
  }

  /**
   * Closes the modal dialog.
   *
   * @method close
   * @return {ModalDialog}
   */
  close() {
    if (this.opened_) {
      let player = this.player();

      this.trigger('beforemodalclose');
      this.opened_ = false;

      if (this.wasPlaying_) {
        player.play();
      }

      player.controls(true);
      Events.off(document, 'keydown', Fn.bind(this, this.handleKeyPress));
      this.hide();
      this.trigger('modalclose');

      if (this.options_.disposeOnClose) {
        this.dispose();
      }
    }
    return this;
  }

  /**
   * Fill the modal dialog's content element with the given content or
   * falling back on the modal dialog's "content" option.
   *
   * The content element will be emptied before this change takes place.
   *
   * @param  {Mixed} [content]
   *         Defines the contents of the modal dialog. This must be either
   *         a DOM element, an array of DOM elements, or a function which
   *         returns one of these.
   *
   * @return {ModalDialog}
   */
  fill(content=this.options_.content) {
    let contentEl = this.contentEl();
    let parentEl = contentEl.parentNode;
    let nextSiblingEl = contentEl.nextSibling;

    this.hasBeenFilled_ = true;

    // Detach the content element from the DOM before performing
    // manipulation to avoid modifying the live DOM multiple times.
    parentEl.removeChild(contentEl);
    this.empty();

    this.normalizeContent_(content).forEach(el => contentEl.appendChild(el));

    // Re-inject the re-filled content element.
    if (nextSiblingEl) {
      parentEl.insertBefore(contentEl, nextSiblingEl);
    } else {
      parentEl.appendChild(contentEl);
    }

    return this;
  }

  /**
   * Empties the content element.
   *
   * This happens automatically anytime the modal dialog is filled.
   *
   * @return {ModalDialog}
   */
  empty() {
    let contentEl = this.contentEl();
    [].slice.call(contentEl.children).forEach(el => contentEl.removeChild(el));
    return this;
  }

  /**
   * Normalizes contents for insertion into a content element.
   *
   * Always returns an array of DOM elements.
   *
   * @private
   * @param  {Array|Element|Function} content
   * @return {Array}
   */
  normalizeContent_(content) {
    if (typeof content === 'function') {
      content = content.call(this, this.contentEl());
    }

    if (!Array.isArray(content)) {
      content = [content];
    }

    return content.filter(Dom.isEl);
  }
}

/*
 * Modal dialog default options.
 *
 * @type {Object}
 * @private
 */
ModalDialog.prototype.options_ = {
  children: ['closeButton'],
  slug: 'none'
};

Component.registerComponent('ModalDialog', ModalDialog);
export default ModalDialog;
