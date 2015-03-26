import Component from '../component';
import Menu, { MenuButton, MenuItem } from '../menu';
import * as Lib from '../lib';

/**
 * The component for controlling the playback rate
 *
 * @param {vjs.Player|Object} player
 * @param {Object=} options
 * @constructor
 */
let PlaybackRateMenuButton = MenuButton.extend({
  /** @constructor */
  init: function(player, options){
    MenuButton.call(this, player, options);

    this.updateVisibility();
    this.updateLabel();

    this.on(player, 'loadstart', this.updateVisibility);
    this.on(player, 'ratechange', this.updateLabel);
  }
});

PlaybackRateMenuButton.prototype.buttonText = 'Playback Rate';
PlaybackRateMenuButton.prototype.className = 'vjs-playback-rate';

PlaybackRateMenuButton.prototype.createEl = function(){
  let el = MenuButton.prototype.createEl.call(this);

  this.labelEl_ = Lib.createEl('div', {
    className: 'vjs-playback-rate-value',
    innerHTML: 1.0
  });

  el.appendChild(this.labelEl_);

  return el;
};

// Menu creation
PlaybackRateMenuButton.prototype.createMenu = function(){
  let menu = new Menu(this.player());
  let rates = this.player().options()['playbackRates'];

  if (rates) {
    for (let i = rates.length - 1; i >= 0; i--) {
      menu.addChild(
        new PlaybackRateMenuItem(this.player(), { 'rate': rates[i] + 'x'})
      );
    }
  }

  return menu;
};

PlaybackRateMenuButton.prototype.updateARIAAttributes = function(){
  // Current playback rate
  this.el().setAttribute('aria-valuenow', this.player().playbackRate());
};

PlaybackRateMenuButton.prototype.onClick = function(){
  // select next rate option
  let currentRate = this.player().playbackRate();
  let rates = this.player().options()['playbackRates'];
  // this will select first one if the last one currently selected
  let newRate = rates[0];
  for (let i = 0; i <rates.length ; i++) {
    if (rates[i] > currentRate) {
      newRate = rates[i];
      break;
    }
  }
  this.player().playbackRate(newRate);
};

PlaybackRateMenuButton.prototype.playbackRateSupported = function(){
  return this.player().tech
    && this.player().tech['featuresPlaybackRate']
    && this.player().options()['playbackRates']
    && this.player().options()['playbackRates'].length > 0
  ;
};

/**
 * Hide playback rate controls when they're no playback rate options to select
 */
PlaybackRateMenuButton.prototype.updateVisibility = function(){
  if (this.playbackRateSupported()) {
    this.removeClass('vjs-hidden');
  } else {
    this.addClass('vjs-hidden');
  }
};

/**
 * Update button label when rate changed
 */
PlaybackRateMenuButton.prototype.updateLabel = function(){
  if (this.playbackRateSupported()) {
    this.labelEl_.innerHTML = this.player().playbackRate() + 'x';
  }
};

/**
 * The specific menu item type for selecting a playback rate
 *
 * @constructor
 */
var PlaybackRateMenuItem = MenuItem.extend({
  contentElType: 'button',
  /** @constructor */
  init: function(player, options){
    let label = this.label = options['rate'];
    let rate = this.rate = parseFloat(label, 10);

    // Modify options for parent MenuItem class's init.
    options['label'] = label;
    options['selected'] = rate === 1;
    MenuItem.call(this, player, options);

    this.on(player, 'ratechange', this.update);
  }
});

Component.registerComponent('PlaybackRateMenuItem', PlaybackRateMenuItem);

PlaybackRateMenuItem.prototype.onClick = function(){
  MenuItem.prototype.onClick.call(this);
  this.player().playbackRate(this.rate);
};

PlaybackRateMenuItem.prototype.update = function(){
  this.selected(this.player().playbackRate() == this.rate);
};

Component.registerComponent('PlaybackRateMenuButton', PlaybackRateMenuButton);
export default PlaybackRateMenuButton;
export { PlaybackRateMenuItem };
