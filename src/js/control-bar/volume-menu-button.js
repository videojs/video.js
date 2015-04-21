import Button from '../button.js';
import Menu from '../menu/menu.js';
import MenuButton from '../menu/menu-button.js';
import MuteToggle from './mute-toggle.js';
import * as Lib from '../lib.js';
import VolumeBar from './volume-control/volume-bar.js';

/**
 * Menu button with a popup for showing the volume slider.
 * @constructor
 */
class VolumeMenuButton extends MenuButton {

  constructor(player, options){
    super(player, options);

    // Same listeners as MuteToggle
    this.on(player, 'volumechange', this.volumeUpdate);

    // hide mute toggle if the current tech doesn't support volume control
    if (player.tech && player.tech['featuresVolumeControl'] === false) {
      this.addClass('vjs-hidden');
    }
    this.on(player, 'loadstart', function(){
      if (player.tech['featuresVolumeControl'] === false) {
        this.addClass('vjs-hidden');
      } else {
        this.removeClass('vjs-hidden');
      }
    });
    this.addClass('vjs-menu-button');
  }

  createMenu() {
    let menu = new Menu(this.player_, {
      contentElType: 'div'
    });
    let vc = new VolumeBar(this.player_, this.options_['volumeBar']);
    vc.on('focus', function() {
      menu.lockShowing();
    });
    vc.on('blur', function() {
      menu.unlockShowing();
    });
    menu.addChild(vc);
    return menu;
  }

  onClick() {
    MuteToggle.prototype.onClick.call(this);
    super.onClick();
  }

  createEl() {
    return super.createEl('div', {
      className: 'vjs-volume-menu-button vjs-menu-button vjs-control',
      innerHTML: `<div><span class="vjs-control-text">${this.localize('Mute')}</span></div>`
    });
  }

}

VolumeMenuButton.prototype.volumeUpdate = MuteToggle.prototype.update;

Button.registerComponent('VolumeMenuButton', VolumeMenuButton);
export default VolumeMenuButton;
