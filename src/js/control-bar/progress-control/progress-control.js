/**
 * @file progress-control.js
 */
import Component from '../../component.js';

import './seek-bar.js';
import './mouse-time-display.js';

/**
 * The Progress Control component contains the seek bar, load progress,
 * and play progress.
 *
 * @extends Component
 */
class ProgressControl extends Component {

  /**
   * Create the `Component`'s DOM element
   *
   * @return {Element}
   *         The element that was created.
   */
  createEl() {
    return super.createEl('div', {
      className: 'vjs-progress-control vjs-control'
    });
  }
}

/**
 * Default options for `ProgressControl`
 *
 * @type {Object}
 * @private
 */
ProgressControl.prototype.options_ = {
  children: [
    'seekBar'
  ]
};

Component.registerComponent('ProgressControl', ProgressControl);
export default ProgressControl;
