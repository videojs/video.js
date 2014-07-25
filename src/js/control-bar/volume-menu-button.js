var VolumeMenuButton, Button, MuteToggle, menu, volume, vjslib;

Button = require('../button.js');
MuteToggle = require('./mute-toggle.js');
menu = require('../menu.js');
volume = require('./volume-control.js');
vjslib = require('../lib.js');

/**
 * Menu button with a popup for showing the volume slider.
 * @constructor
 */
VolumeMenuButton = menu.MenuButton.extend({
  /** @constructor */
  init: function(player, options){
    menu.MenuButton.call(this, player, options);

    // Same listeners as MuteToggle
    player.on('volumechange', vjslib.bind(this, this.update));

    // hide mute toggle if the current tech doesn't support volume control
    if (player.tech && player.tech.features && player.tech.features.volumeControl === false) {
      this.addClass('vjs-hidden');
    }
    player.on('loadstart', vjslib.bind(this, function(){
      if (player.tech.features && player.tech.features.volumeControl === false) {
        this.addClass('vjs-hidden');
      } else {
        this.removeClass('vjs-hidden');
      }
    }));
    this.addClass('vjs-menu-button');
  }
});

VolumeMenuButton.prototype.createMenu = function(){
  var menu = new menu.Menu(this.player_, {
    contentElType: 'div'
  });
  var vc = new volume.VolumeBar(this.player_, vjslib.obj.merge({vertical: true}, this.options_.volumeBar));
  menu.addChild(vc);
  return menu;
};

VolumeMenuButton.prototype.onClick = function(){
  MuteToggle.prototype.onClick.call(this);
  menu.MenuButton.prototype.onClick.call(this);
};

VolumeMenuButton.prototype.createEl = function(){
  return Button.prototype.createEl.call(this, 'div', {
    className: 'vjs-volume-menu-button vjs-menu-button vjs-control',
    innerHTML: '<div><span class="vjs-control-text">Mute</span></div>'
  });
};

VolumeMenuButton.prototype.update = MuteToggle.prototype.update;

module.exports = VolumeMenuButton;
