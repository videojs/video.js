import SliderHandle from '../../slider/slider-handle.js';
import * as Lib from '../../lib.js';

/**
 * The Seek Handle shows the current position of the playhead during playback,
 * and can be dragged to adjust the playhead.
 *
 * @param {Player|Object} player
 * @param {Object=} options
 * @constructor
 */
class SeekHandle extends SliderHandle {

  constructor(player, options) {
    super(player, options);
    this.on(player, 'timeupdate', this.updateContent);
  }

  /** @inheritDoc */
  createEl() {
    return super.createEl.call('div', {
      className: 'vjs-seek-handle',
      'aria-live': 'off'
    });
  }

  updateContent() {
    let time = (this.player_.scrubbing) ? this.player_.getCache().currentTime : this.player_.currentTime();
    this.el_.innerHTML = `<span class="vjs-control-text">${Lib.formatTime(time, this.player_.duration())}</span>`;
  }

}

/**
 * The default value for the handle content, which may be read by screen readers
 *
 * @type {String}
 * @private
 */
SeekHandle.prototype.defaultValue = '00:00';

SliderHandle.registerComponent('SeekHandle', SeekHandle);
export default SeekHandle;
