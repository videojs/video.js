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
 * @constructor
 */
class PlaybackRateMenuButton extends MenuButton {

  constructor(player, options){
    super(player, options);

    this.updateVisibility();
    this.updateLabel();

    this.on(player, 'loadstart', this.updateVisibility);
    this.on(player, 'ratechange', this.updateLabel);
  }

  createEl() {
    let el = super.createEl();

    this.labelEl_ = Dom.createEl('div', {
      className: 'vjs-playback-rate-value',
      innerHTML: 1.0
    });

    el.appendChild(this.labelEl_);

    return el;
  }

  buildCSSClass() {
    return `vjs-playback-rate ${super.buildCSSClass()}`;
  }

  // Menu creation
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

  updateARIAAttributes() {
    // Current playback rate
    this.el().setAttribute('aria-valuenow', this.player().playbackRate());
  }

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

  playbackRates() {
    return this.options_['playbackRates'] || (this.options_.playerOptions && this.options_.playerOptions['playbackRates']);
  }

  playbackRateSupported() {
    return this.player().tech
      && this.player().tech['featuresPlaybackRate']
      && this.playbackRates()
      && this.playbackRates().length > 0
    ;
  }

  /**
   * Hide playback rate controls when they're no playback rate options to select
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
