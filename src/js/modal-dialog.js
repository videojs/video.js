/**
 * @file modal-dialog.js
 */
import document from 'global/document';

import * as Dom from './utils/dom';
import * as Events from './utils/events';
import * as Fn from './utils/fn';
import log from './utils/log';

import Component from './component';
import CloseButton from './close-button';

const MODAL_CLASS_NAME = 'vjs-modal-dialog';
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
   * @param  {Boolean} [options.fillAlways=false]
   *         Normally, modals are automatically filled only the first time
   *         they open. This tells the modal to refresh its content
   *         every time it opens.
   *
   * @param  {String} [options.label='']
   *         A text label for the modal, primarily for accessibility.
   *
   * @param  {Boolean} [options.temporary=true]
   *         If `true`, the modal can only be opened once; it will be
   *         disposed as soon as it's closed.
   *
   * @param  {Boolean} [options.uncloseable=false]
   *         If `true`, the user will not be able to close the modal
   *         through the UI in the normal ways. Programmatic closing is
   *         still possible.
   *
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
    });
    this.el_.appendChild(this.contentEl_);
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
    return `${MODAL_CLASS_NAME} vjs-hidden ${super.buildCSSClass()}`;
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
      if (this.options_.fillAlways || !this.hasBeenOpened_ && !this.hasBeenFilled_) {
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

      if (this.options_.temporary) {
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

      if (closeable) {
        if (!close) {
          close = this.addChild('closeButton');
        }
        this.on(close, 'close', this.close);
      } else if (close) {
        this.off(close, 'close', this.close);
        this.removeChild(close);
        close.dispose();
      }
    }
    return !!this.closeable_;
  }

  /**
   * Fill the modal's content element with the modal's "content" option.
   *
   * The content element will be emptied before this change takes place.
   *
   * @method fill
   * @return {ModalDialog}
   */
  fill() {
    return this.fillWith(this.content());
  }

  /**
   * Fill the modal's content element with arbitrary content.
   *
   * The content element will be emptied before this change takes place.
   *
   * @method fillWith
   * @param  {String|Function|Element|Array} [content]
   *         The content with which to fill the modal. This must be either
   *         a DOM element, an array of DOM elements, a string, or a
   *         function which returns one of these.
   *
   * @return {ModalDialog}
   */
  fillWith(content) {
    let contentEl = this.contentEl();
    let parentEl = contentEl.parentNode;
    let nextSiblingEl = contentEl.nextSibling;

    content = this.normalizeContent_(content);

    if (content && content.length) {
      this.trigger('beforemodalfill');
      this.hasBeenFilled_ = true;

      // Detach the content element from the DOM before performing
      // manipulation to avoid modifying the live DOM multiple times.
      parentEl.removeChild(contentEl);
      this.empty();

      // Strings are written into the DOM directly, arrays should by filtered
      // down to DOM elements only and appended in order.
      if (typeof content === 'string') {
        contentEl.innerHTML = content;
      } else {
        content.forEach(el => contentEl.appendChild(el));
      }

      this.trigger('modalfill');

      // Re-inject the re-filled content element.
      if (nextSiblingEl) {
        parentEl.insertBefore(contentEl, nextSiblingEl);
      } else {
        parentEl.appendChild(contentEl);
      }
    } else {
      log.warn('no content defined for modal');
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
    this.trigger('beforemodalempty');
    [].slice.call(contentEl.children).forEach(el => contentEl.removeChild(el));
    this.trigger('modalempty');
    return this;
  }

  /**
   * Gets or sets the modal content, which gets normalized before being
   * rendered into the DOM.
   *
   * This does not update the DOM or fill the modal, but it is called during
   * that process.
   *
   * @method content
   * @param  {String|Function|Element|Array|Null} [value]
   *         If given, sets the internal content value to be used on the next
   *         call to `fill`. This value is passed through normalizeContent_
   *         before being rendered into the DOM.
   *
   * @return {String|Function|Element|Array|Null}
   */
  content(value) {
    if (
      value === null ||
      typeof value === 'string' ||
      typeof value === 'function' ||
      Array.isArray(value) ||
      Dom.isEl(value)
    ) {
      this.content_ = value;
    }
    return this.content_;
  }

  /**
   * Normalizes contents for insertion into a content element.
   *
   * @method normalizeContent_
   * @private
   * @param  {String|Function|Element|Array} content
   * @return {Array|String|Null}
   *         An array of one or more DOM element(s). A non-empty string. Null.
   */
  normalizeContent_(content) {

    // Short-cut out if it's clearly invalid.
    if (!content) {
      return null;
    }

    if (typeof content === 'function') {
      content = content.call(this, this.contentEl());
    }

    if (typeof content === 'string' && /\S/.test(content)) {
      return content;
    }

    content = (Array.isArray(content) ? content : [content]).filter(Dom.isEl);
    return content.length ? content : null;
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
  temporary: true
};

Component.registerComponent('ModalDialog', ModalDialog);
export default ModalDialog;
