/**
 * @file playback-rate-menu-button.js
 */
import MenuButton from '../../menu/menu-button.js';
import Menu from '../../menu/menu.js';
import PlaybackRateMenuItem from './playback-rate-menu-item.js';
import Component from '../../component.js';
import * as Dom from '../../utils/dom.js';

/**
 * The component for controlling the playback rate
 *
 * @param {Player|Object} player
 * @param {Object=} options
 * @extends MenuButton
 * @class PlaybackRateMenuButton
 */
class PlaybackRateMenuButton extends MenuButton {

  constructor(player, options){
    super(player, options);

    this.updateVisibility();
    this.updateLabel();

    this.on(player, 'loadstart', this.updateVisibility);
    this.on(player, 'ratechange', this.updateLabel);
  }

  /**
   * Create the component's DOM element
   *
   * @return {Element}
   * @method createEl
   */
  createEl() {
    let el = super.createEl();

    this.labelEl_ = Dom.createEl('div', {
      className: 'vjs-playback-rate-value',
      innerHTML: 1.0
    });

    el.appendChild(this.labelEl_);

    return el;
  }

  /**
   * Allow sub components to stack CSS class names
   *
   * @return {String} The constructed class name
   * @method buildCSSClass
   */
  buildCSSClass() {
    return `vjs-playback-rate ${super.buildCSSClass()}`;
  }

  /**
   * Create the playback rate menu
   *
   * @return {Menu} Menu object populated with items
   * @method createMenu
   */
  createMenu() {
    let menu = new Menu(this.player());
    let rates = this.playbackRates();

    if (rates) {
      for (let i = rates.length - 1; i >= 0; i--) {
        menu.addChild(
          new PlaybackRateMenuItem(this.player(), { 'rate': rates[i] + 'x'})
        );
      }
    }

    return menu;
  }

  /**
   * Updates ARIA accessibility attributes
   *
   * @method updateARIAAttributes
   */
  updateARIAAttributes() {
    // Current playback rate
    this.el().setAttribute('aria-valuenow', this.player().playbackRate());
  }

  /**
   * Handle menu item click
   *
   * @method handleClick
   */
  handleClick() {
    // select next rate option
    let currentRate = this.player().playbackRate();
    let rates = this.playbackRates();

    // this will select first one if the last one currently selected
    let newRate = rates[0];
    for (let i = 0; i < rates.length ; i++) {
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
   * @return {Array} Possible playback rates
   * @method playbackRates
   */
  playbackRates() {
    return this.options_['playbackRates'] || (this.options_.playerOptions && this.options_.playerOptions['playbackRates']);
  }

  /**
   * Get supported playback rates
   *
   * @return {Array} Supported playback rates
   * @method playbackRateSupported
   */
  playbackRateSupported() {
    return this.player().tech_
      && this.player().tech_['featuresPlaybackRate']
      && this.playbackRates()
      && this.playbackRates().length > 0
    ;
  }

  /**
   * Hide playback rate controls when they're no playback rate options to select
   *
   * @method updateVisibility
   */
  updateVisibility() {
    if (this.playbackRateSupported()) {
      this.removeClass('vjs-hidden');
    } else {
      this.addClass('vjs-hidden');
    }
  }

  /**
   * Update button label when rate changed
   *
   * @method updateLabel
   */
  updateLabel() {
    if (this.playbackRateSupported()) {
      this.labelEl_.innerHTML = this.player().playbackRate() + 'x';
    }
  }

}

PlaybackRateMenuButton.prototype.controlText_ = 'Playback Rate';

Component.registerComponent('PlaybackRateMenuButton', PlaybackRateMenuButton);
export default PlaybackRateMenuButton;
