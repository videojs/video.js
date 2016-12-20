/**
 * @file spacer.js
 */
import Component from '../../component.js';

/**
 * Just an empty spacer element that can be used as an append point for plugins, etc.
 * Also can be used to create space between elements when necessary.
 *
 * @extends Component
 */
class Spacer extends Component {

 /**
  * Builds the default DOM `className`.
  *
  * @return {string}
  *         The DOM `className` for this object.
  */
  buildCSSClass() {
    return `vjs-spacer ${super.buildCSSClass()}`;
  }

  /**
   * Create the `Component`'s DOM element
   *
   * @return {Element}
   *         The element that was created.
   */
  createEl() {
    return super.createEl('div', {
      className: this.buildCSSClass()
    });
  }
}

Component.registerComponent('Spacer', Spacer);

export default Spacer;
