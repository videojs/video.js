import Component from '../../component.js';
import SeekBar from './seek-bar.js';

/**
 * The Progress Control component contains the seek bar, load progress,
 * and play progress
 *
 * @param {Player|Object} player
 * @param {Object=} options
 * @constructor
 */
class ProgressControl extends Component {
  createEl() {
    return super.createEl('div', {
      className: 'vjs-progress-control vjs-control'
    });
  }
}

ProgressControl.prototype.options_ = {
  children: {
    'seekBar': {}
  }
};

Component.registerComponent('ProgressControl', ProgressControl);
export default ProgressControl;
