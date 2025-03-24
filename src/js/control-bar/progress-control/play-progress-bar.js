/**
 * @file play-progress-bar.js
 */
import Component from '../../component.js';
import {IS_IOS, IS_ANDROID} from '../../utils/browser.js';
import * as Fn from '../../utils/fn.js';

/** @import Player from '../../player' */

import './time-tooltip';

/**
 * Used by {@link SeekBar} to display media playback progress as part of the
 * {@link ProgressControl}.
 *
 * @extends Component
 */
class PlayProgressBar extends Component {

  /**
   * Creates an instance of this class.
   *
   * @param {Player} player
   *        The {@link Player} that this class should be attached to.
   *
   * @param {Object} [options]
   *        The key/value store of player options.
   */
  constructor(player, options) {
    super(player, options);
    this.setIcon('circle');
    this.update = Fn.throttle(Fn.bind_(this, this.update), Fn.UPDATE_REFRESH_INTERVAL);
  }

  /**
   * Create the the DOM element for this class.
   *
   * @return {Element}
   *         The element that was created.
   */
  createEl() {
    return super.createEl('div', {
      className: 'vjs-play-progress vjs-slider-bar'
    }, {
      'aria-hidden': 'true'
    });
  }

  /**
   * Enqueues updates to its own DOM as well as the DOM of its
   * {@link TimeTooltip} child.
   *
   * @param {Object} seekBarRect
   *        The `ClientRect` for the {@link SeekBar} element.
   *
   * @param {number} seekBarPoint
   *        A number from 0 to 1, representing a horizontal reference point
   *        from the left edge of the {@link SeekBar}
   *
   * @param {Event} [event]
   *        The `timeupdate` event that caused this function to run.
   */
  update(seekBarRect, seekBarPoint, event) {
    const timeTooltip = this.getChild('timeTooltip');

    if (!timeTooltip) {
      return;
    }

    // Combined logic: if an event with a valid pendingSeekTime getter exists, use it.
    const time = (event &&
      event.target &&
      typeof event.target.pendingSeekTime === 'function') ?
      event.target.pendingSeekTime() :
      (this.player_.scrubbing() ?
        this.player_.getCache().currentTime :
        this.player_.currentTime());

    timeTooltip.updateTime(seekBarRect, seekBarPoint, time);
  }
}

/**
 * Default options for {@link PlayProgressBar}.
 *
 * @type {Object}
 * @private
 */
PlayProgressBar.prototype.options_ = {
  children: []
};

// Time tooltips should not be added to a player on mobile devices
if (!IS_IOS && !IS_ANDROID) {
  PlayProgressBar.prototype.options_.children.push('timeTooltip');
}

Component.registerComponent('PlayProgressBar', PlayProgressBar);
export default PlayProgressBar;
