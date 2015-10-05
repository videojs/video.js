/**
 * @file error-display.js
 */
import Component from './component';
import ModalDialog from './modal-dialog';

import * as Dom from './utils/dom';
import mergeOptions from './utils/merge-options';

/**
 * Display that an error has occurred making the video unplayable.
 *
 * @extends ModalDialog
 * @class ErrorDisplay
 */
class ErrorDisplay extends ModalDialog {

  /**
   * Constructor for error display modal.
   *
   * @param  {Player} player
   * @param  {Object} [options]
   */
  constructor(player, options) {
    super(player, options);
    this.on(player, 'error', this.open);
  }

  /**
   * Build the modal's CSS class.
   *
   * @method buildCSSClass
   * @return {String}
   */
  buildCSSClass() {
    return `vjs-error-display ${super.buildCSSClass()}`;
  }

  /**
   * Generates the modal content based on the player error.
   *
   * @return {Element|Null}
   */
  content() {
    let error = this.player().error();
    if (error) {
      this.content_ = Dom.createEl('span');
      this.content_.textContent = this.localize(error.message);
    } else {
      this.content_ = null;
    }
    return this.content_;
  }
}

ErrorDisplay.prototype.options_ = mergeOptions(ModalDialog.prototype.options_, {
  fillAlways: true,
  uncloseable: true
});

Component.registerComponent('ErrorDisplay', ErrorDisplay);
export default ErrorDisplay;
