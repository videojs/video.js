import Spacer from './spacer.js';

/**
 * Spacer specifically meant to be used as an insertion point for new plugins, etc.
 *
 * @param {Player|Object} player
 * @param {Obect=} options
 */
class CustomControlSpacer extends Spacer {
  buildCSSClass() {
    return `vjs-custom-control-spacer ${super.buildCSSClass()}`;
  }

  createEl() {
    return super.createEl({
      className: this.buildCSSClass()
    });
  }
}

Spacer.registerComponent('CustomControlSpacer', CustomControlSpacer);

export default CustomControlSpacer;
