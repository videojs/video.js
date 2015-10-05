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

// An array of strings which are used for modal sub-element classes,
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
   * Constructor for modals.
   *
   * @param  {Player} player
   * @param  {Object} [options]
   * @param  {Mixed} [options.content=undefined]
   *         Provide customized content for this modal.
   *
   * @param  {Boolean} [options.disposeOnClose=false]
   *         If `true`, the modal can only be opened once. It will be
   *         disposed as soon as it's closed, which is useful for one-off
   *         modals.
   *
   * @param  {String} [options.label='']
   *         A text label for the modal, primarily for accessibility.
   *
   * @param  {Boolean} [options.openImmediately=false]
   *         If `true`, the modal will be displayed immediately upon
   *         instantiation.
   *
   * @param  {Boolean} [options.fillImmediately=false]
   *         If `true`, the modal will be filled immediately upon
   *         instantiation - rather than manually or the first time it
   *         opens.
   *
   * @param  {String} [options.slug='none']
   *         This is a string that will be prefixed with "vjs-modal-dialog-"
   *         to construct a CSS class specific to this modal. For
   *         example, if this option were "foo," the modal could be
   *         identified with the class "vjs-modal-dialog-foo".
   *
   * @param  {Boolean} [options.uncloseable=false]
   *         If `true`, the user will not be able to close the modal
   *         through the UI in the normal ways. Programmatic closing is
   *         still possible.
   *
   */
  constructor(player, options) {
    if (options && DISALLOWED_SLUGS.indexOf(options.slug) > -1) {
      throw new Error(`${options.slug} is not allowed as a slug`);
    }

    super(player, options);
    this.opened_ = this.hasBeenOpened_ = this.hasBeenFilled_ = false;

    this.closeable(!this.options_.uncloseable);

    // Make sure the contentEl is defined AFTER any children are initialized
    // because we only want the contents of the modal in the contentEl
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
   * Create the modal's DOM element
   *
   * @method createEl
   * @return {Element}
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
   * Build the modal's CSS class.
   *
   * @method buildCSSClass
   * @return {String}
   */
  buildCSSClass() {
    return `${CLASS_NAME_PREFIX} vjs-hidden ${CLASS_NAME_PREFIX}-${this.options_.slug} ${super.buildCSSClass()}`;
  }

  /**
   * Handles key presses on the document, looking for ESC, which closes
   * the modal.
   *
   * @method handleKeyPress
   * @param  {Event} e
   */
  handleKeyPress(e) {
    if (e.which === ESC && this.closeable()) {
      this.close();
    }
  }

  /**
   * Opens the modal.
   *
   * @method open
   * @return {ModalDialog}
   */
  open() {
    if (!this.opened_) {
      let player = this.player();

      this.trigger('beforemodalopen');
      this.opened_ = true;

      // Fill content if the modal has never opened before and
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

      if (this.closeable()) {
        Events.on(document, 'keydown', Fn.bind(this, this.handleKeyPress));
      }

      player.controls(false);
      this.show();
      this.trigger('modalopen');
      this.hasBeenOpened_ = true;
    }
    return this;
  }

  /**
   * Whether or not the modal is opened currently.
   *
   * @method opened
   * @param  {Boolean} [value]
   *         If given as a Boolean, it will open (`true`) or close (`false`)
   *         the modal.
   *
   * @return {Boolean|ModalDialog}
   *         Returns `this` only if `value` was passed.
   */
  opened(value) {
    if (typeof value !== 'undefined') {
      this[value ? 'open' : 'close']();
    }
    return !!this.opened_;
  }

  /**
   * Closes the modal.
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

      if (this.closeable()) {
        Events.off(document, 'keydown', Fn.bind(this, this.handleKeyPress));
      }

      player.controls(true);
      this.hide();
      this.trigger('modalclose');

      if (this.options_.disposeOnClose) {
        this.dispose();
      }
    }
    return this;
  }

  /**
   * Whether or not the modal is closeable via the UI.
   *
   * @method closeable
   * @param  {Boolean} [value]
   *         If given as a Boolean, it will set the `closeable` option.
   *
   * @return {Boolean}
   */
  closeable(value) {
    if (typeof value !== 'undefined') {
      let closeable = this.closeable_ = !!value;
      let close = this.getChild('closeButton');

      if (closeable && !close) {
        this.on(this.addChild('closeButton'), 'close', this.close);
      } else if (!closeable && close) {
        this.off(close, 'close', this.close);
        this.removeChild(close);
        close.dispose();
      }
    }
    return !!this.closeable_;
  }

  /**
   * Fill the modal's content element with the given content or
   * falling back on the modal's "content" option.
   *
   * The content element will be emptied before this change takes place.
   *
   * @method fill
   * @param  {Mixed} [content]
   *         Defines the contents of the modal. This must be either
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
   * This happens automatically anytime the modal is filled.
   *
   * @method empty
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
   * @method normalizeContent_
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
