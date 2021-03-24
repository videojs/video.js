/**
 * @file duration-display.js
 */
import TimeDisplay from './time-display';
import Component from '../../component.js';

/**
 * Displays the duration
 *
 * @extends Component
 */
class DurationDisplay extends TimeDisplay {

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

    const updateContent = (e) => this.updateContent(e);

    // we do not want to/need to throttle duration changes,
    // as they should always display the changed duration as
    // it has changed
    this.on(player, 'durationchange', updateContent);

    // Listen to loadstart because the player duration is reset when a new media element is loaded,
    // but the durationchange on the user agent will not fire.
    // @see [Spec]{@link https://www.w3.org/TR/2011/WD-html5-20110113/video.html#media-element-load-algorithm}
    this.on(player, 'loadstart', updateContent);

    // Also listen for timeupdate (in the parent) and loadedmetadata because removing those
    // listeners could have broken dependent applications/libraries. These
    // can likely be removed for 7.0.
    this.on(player, 'loadedmetadata', updateContent);
  }

  /**
   * Builds the default DOM `className`.
   *
   * @return {string}
   *         The DOM `className` for this object.
   */
  buildCSSClass() {
    return 'vjs-duration';
  }

  /**
   * Update duration time display.
   *
   * @param {EventTarget~Event} [event]
   *        The `durationchange`, `timeupdate`, or `loadedmetadata` event that caused
   *        this function to be called.
   *
   * @listens Player#durationchange
   * @listens Player#timeupdate
   * @listens Player#loadedmetadata
   */
  updateContent(event) {
    const duration = this.player_.duration();

    this.updateTextNode_(duration);
  }
}

/**
 * The text that is added to the `DurationDisplay` for screen reader users.
 *
 * @type {string}
 * @private
 */
DurationDisplay.prototype.labelText_ = 'Duration';

/**
 * The text that should display over the `DurationDisplay`s controls. Added to for localization.
 *
 * @type {string}
 * @private
 *
 * @deprecated in v7; controlText_ is not used in non-active display Components
 */
DurationDisplay.prototype.controlText_ = 'Duration';

Component.registerComponent('DurationDisplay', DurationDisplay);
export default DurationDisplay;
