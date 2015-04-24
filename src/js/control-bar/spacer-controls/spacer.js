import Component from '../../component.js';

/**
 * Just an empty spacer element that can be used as an append point for plugins, etc.
 * Also can be used to create space between elements when necessary.
 *
 * @param {Player|Object} player
 * @param {Object=} options
 */
class Spacer extends Component {
  buildCSSClass() {
    return `vjs-spacer ${super.buildCSSClass()}`;
  }

  createEl(props) {
    return super.createEl('div', {
      className: this.buildCSSClass()
    });
  }
}

Component.registerComponent('Spacer', Spacer);

export default Spacer;
