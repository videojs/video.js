/**
* @file volume-menu-button.js
*/
import Button from '../button.js';
import Component from '../component.js';
import Menu from '../menu/menu.js';
import MenuButton from '../menu/menu-button.js';
import MuteToggle from './mute-toggle.js';
import VolumeBar from './volume-control/volume-bar.js';

/**
* Button for volume menu
*
* @param {Player|Object} player
* @param {Object=} options
* @extends MenuButton
* @class VolumeMenuButton
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

  /**
  * Allow sub components to stack CSS class names
  *
  * @return {String} The constructed class name
  * @method buildCSSClass
  */
  buildCSSClass() {
    return `vjs-volume-menu-button ${super.buildCSSClass()}`;
  }

  /**
  * Allow sub components to stack CSS class names
  *
  * @return {Menu} The volume menu button
  * @method createMenu
  */
  createMenu() {
    let menu = new Menu(this.player_, {
      contentElType: 'div'
    });

    // The volumeBar is vertical by default in the base theme when used with a VolumeMenuButton
    var options = this.options_['volumeBar'] || {};
    options['vertical'] = options['vertical'] || true;

    let vc = new VolumeBar(this.player_, options);

    vc.on('focus', function() {
      menu.lockShowing();
    });
    vc.on('blur', function() {
      menu.unlockShowing();
    });
    menu.addChild(vc);
    return menu;
  }

  /**
  * Handle click on volume menu and calls super
  *
  * @method handleClick
  */
  handleClick() {
    MuteToggle.prototype.handleClick.call(this);
    super.handleClick();
  }

}

VolumeMenuButton.prototype.volumeUpdate = MuteToggle.prototype.update;
VolumeMenuButton.prototype.controlText_ = 'Mute';

Component.registerComponent('VolumeMenuButton', VolumeMenuButton);
export default VolumeMenuButton;
