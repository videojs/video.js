import Component from '../component.js';
import * as Lib from '../lib.js';

/**
 * SeekBar Behavior includes play progress bar, and seek handle
 * Needed so it can determine seek position based on handle position/size
 * @param {Player|Object} player
 * @param {Object=} options
 * @constructor
 */
class SliderHandle extends Component {

  /** @inheritDoc */
  createEl(type, props) {
    props = props || {};
    // Add the slider element class to all sub classes
    props.className = props.className + ' vjs-slider-handle';
    props = Lib.obj.merge({
      innerHTML: `<span class="vjs-control-text">${this.defaultValue || 0}</span>`
    }, props);

    return super.createEl('div', props);
  }

}

Component.registerComponent('SliderHandle', SliderHandle);
export default SliderHandle;
