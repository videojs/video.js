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
    this.on(player, 'ended', this.handleEnded);
  }

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

  /**
   * When the player fires ended there should be no time left. Sadly
   * this is not always the case, lets make it seem like that is the case
   * for users.
   *
   * @param {EventTarget~Event} [event]
   *        The `ended` event that caused this to run.
   *
   * @listens Player#ended
   */
  handleEnded(event) {
    if (!this.player_.duration()) {
      return;
    }
    this.updateFormattedTime_(this.player_.duration());
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
