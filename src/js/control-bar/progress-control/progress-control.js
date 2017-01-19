/**
 * @file progress-control.js
 */
import Component from '../../component.js';
import * as Fn from '../../utils/fn.js';
import * as Dom from '../../utils/dom.js';

import './seek-bar.js';

/**
 * The Progress Control component contains the seek bar, load progress,
 * and play progress.
 *
 * @extends Component
 */
class ProgressControl extends Component {

  /**
   * Creates an instance of this class.
   *
   * @param {Player} player
   *        The `Player` that this class should be attached to.
   *
   * @param {Object} [options]
   *        The key/value store of player options.
   */
  constructor(player, options) {
    super(player, options);
    this.handleMouseMove = Fn.throttle(Fn.bind(this, this.handleMouseMove), 25);
    this.on(this.el_, 'mousemove', this.handleMouseMove);
  }

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

  /**
   * When the mouse moves over the `ProgressControl`, the pointer position
   * gets passed down to the `MouseTimeDisplay` component.
   *
   * @param {EventTarget~Event} event
   *        The `mousemove` event that caused this function to run.
   *
   * @listen mousemove
   */
  handleMouseMove(event) {
    const seekBar = this.getChild('seekBar');
    const seekBarEl = seekBar.el();
    const seekBarRect = Dom.getBoundingClientRect(seekBarEl);
    let seekBarPoint = Dom.getPointerPosition(seekBarEl, event).x;

    // The default skin has a gap on either side of the `SeekBar`. This means
    // that it's possible to trigger this behavior outside the boundaries of
    // the `SeekBar`. This ensures we stay within it at all times.
    if (seekBarPoint > 1) {
      seekBarPoint = 1;
    } else if (seekBarPoint < 0) {
      seekBarPoint = 0;
    }

    seekBar.getChild('mouseTimeDisplay').update(seekBarRect, seekBarPoint);
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
