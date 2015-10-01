/**
 * @file spacer.js
 */
import Component from '../../component.js';

/**
 * Just an empty spacer element that can be used as an append point for plugins, etc.
 * Also can be used to create space between elements when necessary.
 *
 * @extends Component
 * @class Spacer
 */
class Spacer extends Component {

  /**
   * Allow sub components to stack CSS class names
   *
   * @return {String} The constructed class name
   * @method buildCSSClass
   */
  buildCSSClass() {
    return `vjs-spacer ${super.buildCSSClass()}`;
  }

  /**
   * Create the component's DOM element
   *
   * @return {Element}
   * @method createEl
   */
  createEl() {
    return super.createEl('div', {
      className: this.buildCSSClass()
    });
  }
}

Component.registerComponent('Spacer', Spacer);

export default Spacer;
