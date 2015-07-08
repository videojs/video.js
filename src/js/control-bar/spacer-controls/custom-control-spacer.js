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
    return super.createEl({
      className: this.buildCSSClass()
    });
  }
}

Component.registerComponent('CustomControlSpacer', CustomControlSpacer);
export default CustomControlSpacer;
