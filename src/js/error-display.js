/**
 * @file error-display.js
 */
import Component from './component';
import ModalDialog from './modal-dialog';
import mergeOptions from './utils/merge-options';

/**
 * A display that indicates an error has occurred. This means that the video
 * is unplayable.
 *
 * @extends ModalDialog
 */
class ErrorDisplay extends ModalDialog {

  /**
   * Creates an instance of this class.
   *
   * @param  {Player} player
   *         The `Player` that this class should be attached to.
   *
   * @param  {Object} [options]
   *         The key/value store of player options.
   */
  constructor(player, options) {
    super(player, options);
    this.on(player, 'error', this.open);
  }

  /**
   * Builds the default DOM `className`.
   *
   * @return {string}
   *         The DOM `className` for this object.
   *
   * @deprecated Since version 5.
   */
  buildCSSClass() {
    return `vjs-error-display ${super.buildCSSClass()}`;
  }

  /**
   * Gets the localized error message based on the `Player`s error.
   *
   * @return {string}
   *         The `Player`s error message localized or an empty string.
   */
  content() {
    const error = this.player().error();

    return error ? this.localize(error.message) : '';
  }
}

/**
 * The default options for an `ErrorDisplay`.
 *
 * @private
 */
ErrorDisplay.prototype.options_ = mergeOptions(ModalDialog.prototype.options_, {
  pauseOnOpen: false,
  fillAlways: true,
  temporary: false,
  uncloseable: true
});

Component.registerComponent('ErrorDisplay', ErrorDisplay);
export default ErrorDisplay;
