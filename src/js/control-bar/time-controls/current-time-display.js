/**
 * @file current-time-display.js
 */
import TimeDisplay from './time-display';
import Component from '../../component.js';

/**
 * Displays the current time
 *
 * @extends Component
 */
class CurrentTimeDisplay extends TimeDisplay {

  /**
   * Builds the default DOM `className`.
   *
   * @return {string}
   *         The DOM `className` for this object.
   */
  buildCSSClass() {
    return 'vjs-current-time';
  }

  /**
   * Update current time display
   *
   * @param {EventTarget~Event} [event]
   *        The `timeupdate` event that caused this function to run.
   *
   * @listens Player#timeupdate
   */
  updateContent(event) {
    // Allows for smooth scrubbing, when player can't keep up.
    const time = (this.player_.scrubbing()) ? this.player_.getCache().currentTime : this.player_.currentTime();

    this.updateFormattedTime_(time);
  }

}

/**
 * The text that should display over the `CurrentTimeDisplay`s controls. Added to for localization.
 *
 * @type {string}
 * @private
 */
CurrentTimeDisplay.prototype.controlText_ = 'Current Time';

Component.registerComponent('CurrentTimeDisplay', CurrentTimeDisplay);
export default CurrentTimeDisplay;
