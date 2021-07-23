/**
 * @file custom-control-spacer.js
 */
import Spacer from './spacer.js';
import Component from '../../component.js';

/**
 * Spacer specifically meant to be used as an insertion point for new plugins, etc.
 *
 * @extends Spacer
 */
class CustomControlSpacer extends Spacer {

  /**
   * Builds the default DOM `className`.
   *
   * @return {string}
   *         The DOM `className` for this object.
   */
  buildCSSClass() {
    return `vjs-custom-control-spacer ${super.buildCSSClass()}`;
  }

  /**
   * Create the `Component`'s DOM element
   *
   * @return {Element}
   *         The element that was created.
   */
  createEl() {
    return super.createEl('div', {
      className: this.buildCSSClass(),
      // No-flex/table-cell mode requires there be some content
      // in the cell to fill the remaining space of the table.
      textContent: '\u00a0'
    });
  }
}

Component.registerComponent('CustomControlSpacer', CustomControlSpacer);
export default CustomControlSpacer;
