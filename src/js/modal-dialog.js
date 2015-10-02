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
 * Modal dialog for use by plugins to display a dialog over the video, which
 * blocks interaction with the player until it is closed.
 *
 * Modal dialogs include a "Close" button and will close when that button
 * is activated - or when Esc is pressed anywhere.
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
   * @param  {Boolean} [options.disposeOnClose]
   *         If `true`, the modal can only be opened once. It will be
   *         disposed as soon as it's closed.
   *
   * @param  {String} [options.label]
   *         A text label for the dialog, primarily for accessibility.
   *
   * @param  {Boolean} [options.openImmediately]
   *         If `true`, the modal will be displayed immediately upon
   *         instantiation.
   *
   * @param  {String} [options.slug]
   *         This is a string that will be prefixed with "vjs-modal-dialog-"
   *         to construct a CSS class specific to this modal. For example,
   *         if this option were "foo," the modal could be identified with
   *         the class "vjs-modal-dialog-foo".
   */
  constructor(player, options) {
    if (options && DISALLOWED_SLUGS.indexOf(options.slug) > -1) {
      throw new Error(`${options.slug} is not allowed as a slug`);
    }

    super(player, options);
    this.opened_ = false;

    // Create an own property for each instance with a bound keypress
    // handler so it can be properly added and removed as a listener.
    this.handleKeyPress = Fn.bind(this, this.handleKeyPress);

    // If a close button was added (which is the default), set the modal to
    // close when the button is activated.
    let close = this.getChild('closeButton');
    if (close) {
      this.on(close, 'close', this.close);
    }

    // Make sure the contentEl is defined AFTER any children are initialized
    // because we only want the contents of the modal in the contentEl (not
    // the UI elements like the close button).
    this.contentEl_ = Dom.createEl('div', {
      className: `${CLASS_NAME_PREFIX}-content`
    });
    this.el_.appendChild(this.contentEl_);

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
    if (this.opened_) {
      return;
    }

    this.trigger('beforemodalopen');
    this.opened_ = true;
    let player = this.player();

    // If the player was playing, pause it and take note of its previously
    // playing state.
    this.wasPlaying_ = !player.paused();
    if (this.wasPlaying_) {
      player.pause();
    }

    player.controls(false);
    Events.on(document, 'keydown', this.handleKeyPress);
    this.show();
    this.trigger('modalopen');
  }

  /**
   * Whether or not the modal is open currently.
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
    if (!this.opened_) {
      return;
    }

    this.trigger('beforemodalclose');
    this.opened_ = false;
    let player = this.player();

    if (this.wasPlaying_) {
      player.play();
    }

    player.controls(true);
    Events.off(document, 'keydown', this.handleKeyPress);
    this.hide();
    this.trigger('modalclose');

    if (this.options_.disposeOnClose) {
      this.dispose();
    }
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
