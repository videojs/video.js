/**
 * @file progress-control.js
 */
import Component from '../../component.js';
import * as Fn from '../../utils/fn.js';
import * as Dom from '../../utils/dom.js';
import computedStyle from '../../utils/computed-style.js';

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
    const seekBarWidth = parseFloat(computedStyle(seekBarEl, 'width'));
    const seekBarPoint = Dom.getPointerPosition(seekBarEl, event).x;

    seekBar.getChild('mouseTimeDisplay').update(seekBarWidth, seekBarPoint);
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
