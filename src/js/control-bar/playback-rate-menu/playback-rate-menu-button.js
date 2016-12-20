/**
 * @file playback-rate-menu-button.js
 */
import MenuButton from '../../menu/menu-button.js';
import Menu from '../../menu/menu.js';
import PlaybackRateMenuItem from './playback-rate-menu-item.js';
import Component from '../../component.js';
import * as Dom from '../../utils/dom.js';

/**
 * The component for controlling the playback rate.
 *
 * @extends MenuButton
 */
class PlaybackRateMenuButton extends MenuButton {

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

    this.updateVisibility();
    this.updateLabel();

    this.on(player, 'loadstart', this.updateVisibility);
    this.on(player, 'ratechange', this.updateLabel);
  }

  /**
   * Create the `Component`'s DOM element
   *
   * @return {Element}
   *         The element that was created.
   */
  createEl() {
    const el = super.createEl();

    this.labelEl_ = Dom.createEl('div', {
      className: 'vjs-playback-rate-value',
      innerHTML: 1.0
    });

    el.appendChild(this.labelEl_);

    return el;
  }

  /**
   * Builds the default DOM `className`.
   *
   * @return {string}
   *         The DOM `className` for this object.
   */
  buildCSSClass() {
    return `vjs-playback-rate ${super.buildCSSClass()}`;
  }

  /**
   * Create the playback rate menu
   *
   * @return {Menu}
   *         Menu object populated with {@link PlaybackRateMenuItem}s
   */
  createMenu() {
    const menu = new Menu(this.player());
    const rates = this.playbackRates();

    if (rates) {
      for (let i = rates.length - 1; i >= 0; i--) {
        menu.addChild(
          new PlaybackRateMenuItem(this.player(), {rate: rates[i] + 'x'})
        );
      }
    }

    return menu;
  }

  /**
   * Updates ARIA accessibility attributes
   */
  updateARIAAttributes() {
    // Current playback rate
    this.el().setAttribute('aria-valuenow', this.player().playbackRate());
  }

  /**
   * This gets called when an `PlaybackRateMenuButton` is "clicked". See
   * {@link ClickableComponent} for more detailed information on what a click can be.
   *
   * @param {EventTarget~Event} [event]
   *        The `keydown`, `tap`, or `click` event that caused this function to be
   *        called.
   *
   * @listens tap
   * @listens click
   */
  handleClick(event) {
    // select next rate option
    const currentRate = this.player().playbackRate();
    const rates = this.playbackRates();

    // this will select first one if the last one currently selected
    let newRate = rates[0];

    for (let i = 0; i < rates.length; i++) {
      if (rates[i] > currentRate) {
        newRate = rates[i];
        break;
      }
    }
    this.player().playbackRate(newRate);
  }

  /**
   * Get possible playback rates
   *
   * @return {Array}
   *         All possible playback rates
   */
  playbackRates() {
    return this.options_.playbackRates || (this.options_.playerOptions && this.options_.playerOptions.playbackRates);
  }

  /**
   * Get whether playback rates is supported by the tech
   * and an array of playback rates exists
   *
   * @return {boolean}
   *         Whether changing playback rate is supported
   */
  playbackRateSupported() {
    return this.player().tech_ &&
      this.player().tech_.featuresPlaybackRate &&
      this.playbackRates() &&
      this.playbackRates().length > 0
    ;
  }

  /**
   * Hide playback rate controls when they're no playback rate options to select
   *
   * @param {EventTarget~Event} [event]
   *        The event that caused this function to run.
   *
   * @listens Player#loadstart
   */
  updateVisibility(event) {
    if (this.playbackRateSupported()) {
      this.removeClass('vjs-hidden');
    } else {
      this.addClass('vjs-hidden');
    }
  }

  /**
   * Update button label when rate changed
   *
   * @param {EventTarget~Event} [event]
   *        The event that caused this function to run.
   *
   * @listens Player#ratechange
   */
  updateLabel(event) {
    if (this.playbackRateSupported()) {
      this.labelEl_.innerHTML = this.player().playbackRate() + 'x';
    }
  }

}

/**
 * The text that should display over the `FullscreenToggle`s controls. Added for localization.
 *
 * @type {string}
 * @private
 */
PlaybackRateMenuButton.prototype.controlText_ = 'Playback Rate';

Component.registerComponent('PlaybackRateMenuButton', PlaybackRateMenuButton);
export default PlaybackRateMenuButton;
