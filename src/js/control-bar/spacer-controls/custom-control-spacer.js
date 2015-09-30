/**
 * @file custom-control-spacer.js
 */
import Spacer from './spacer.js';
import Component from '../../component.js';

/**
 * Spacer specifically meant to be used as an insertion point for new plugins, etc.
 *
 * @extends Spacer
 * @class CustomControlSpacer
 */
class CustomControlSpacer extends Spacer {

  /**
   * Allow sub components to stack CSS class names
   *
   * @return {String} The constructed class name
   * @method buildCSSClass
   */
  buildCSSClass() {
    return `vjs-custom-control-spacer ${super.buildCSSClass()}`;
  }

  /**
   * Create the component's DOM element
   *
   * @return {Element}
   * @method createEl
   */
  createEl() {
    let el = super.createEl({
      className: this.buildCSSClass(),
    });

    // No-flex/table-cell mode requires there be some content
    // in the cell to fill the remaining space of the table.
    el.innerHTML = '&nbsp;';
    return el;
  }
}

Component.registerComponent('CustomControlSpacer', CustomControlSpacer);
export default CustomControlSpacer;
