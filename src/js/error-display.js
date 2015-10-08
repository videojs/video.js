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
   * Include the old class for backward-compatibility.
   *
   * This can be removed in 6.0.
   *
   * @method buildCSSClass
   * @deprecated
   * @return {String}
   */
  buildCSSClass() {
    return `vjs-error-display ${super.buildCSSClass()}`;
  }

  /**
   * Generates the modal content based on the player error.
   *
   * @return {String|Null}
   */
  content() {
    let error = this.player().error();
    return error ? this.localize(error.message) : '';
  }
}

ErrorDisplay.prototype.options_ = mergeOptions(ModalDialog.prototype.options_, {
  fillAlways: true,
  uncloseable: true
});

Component.registerComponent('ErrorDisplay', ErrorDisplay);
export default ErrorDisplay;
