var VolumeControl, VolumeBar, VolumeLevel, VolumeLevel, VolumeHandle, Component, vjslib, slider;

Component = require('../component.js');
vjslib = require('../lib.js');
slider = require('../slider.js');

/**
 * The component for controlling the volume level
 *
 * @param {vjs.Player|Object} player
 * @param {Object=} options
 * @constructor
 */
VolumeControl = Component.extend({
  /** @constructor */
  init: function(player, options){
    Component.call(this, player, options);

    // hide volume controls when they're not supported by the current tech
    if (player.tech && player.tech.features && player.tech.features['volumeControl'] === false) {
      this.addClass('vjs-hidden');
    }
    player.on('loadstart', vjslib.bind(this, function(){
      if (player.tech.features && player.tech.features['volumeControl'] === false) {
        this.addClass('vjs-hidden');
      } else {
        this.removeClass('vjs-hidden');
      }
    }));
  }
});

VolumeControl.prototype.options_ = {
  children: {
    'volumeBar': {}
  }
};

VolumeControl.prototype.createEl = function(){
  return Component.prototype.createEl.call(this, 'div', {
    className: 'vjs-volume-control vjs-control'
  });
};

/**
 * The bar that contains the volume level and can be clicked on to adjust the level
 *
 * @param {vjs.Player|Object} player
 * @param {Object=} options
 * @constructor
 */
VolumeBar = slider.Slider.extend({
  /** @constructor */
  init: function(player, options){
    slider.Slider.call(this, player, options);
    player.on('volumechange', vjslib.bind(this, this.updateARIAAttributes));
    player.ready(vjslib.bind(this, this.updateARIAAttributes));
  }
});

VolumeBar.prototype.updateARIAAttributes = function(){
  // Current value of volume bar as a percentage
  this.el_.setAttribute('aria-valuenow',vjslib.round(this.player_.volume()*100, 2));
  this.el_.setAttribute('aria-valuetext',vjslib.round(this.player_.volume()*100, 2)+'%');
};

VolumeBar.prototype.options_ = {
  children: {
    'volumeLevel': {},
    'volumeHandle': {}
  },
  'barName': 'volumeLevel',
  'handleName': 'volumeHandle'
};

VolumeBar.prototype.playerEvent = 'volumechange';

VolumeBar.prototype.createEl = function(){
  return slider.Slider.prototype.createEl.call(this, 'div', {
    className: 'vjs-volume-bar',
    'aria-label': 'volume level'
  });
};

VolumeBar.prototype.onMouseMove = function(event) {
  if (this.player_.muted()) {
    this.player_.muted(false);
  }

  this.player_.volume(this.calculateDistance(event));
};

VolumeBar.prototype.getPercent = function(){
  if (this.player_.muted()) {
    return 0;
  } else {
    return this.player_.volume();
  }
};

VolumeBar.prototype.stepForward = function(){
  this.player_.volume(this.player_.volume() + 0.1);
};

VolumeBar.prototype.stepBack = function(){
  this.player_.volume(this.player_.volume() - 0.1);
};

/**
 * Shows volume level
 *
 * @param {vjs.Player|Object} player
 * @param {Object=} options
 * @constructor
 */
VolumeLevel = Component.extend({
  /** @constructor */
  init: function(player, options){
    Component.call(this, player, options);
  }
});

VolumeLevel.prototype.createEl = function(){
  return Component.prototype.createEl.call(this, 'div', {
    className: 'vjs-volume-level',
    innerHTML: '<span class="vjs-control-text"></span>'
  });
};

/**
 * The volume handle can be dragged to adjust the volume level
 *
 * @param {vjs.Player|Object} player
 * @param {Object=} options
 * @constructor
 */
 VolumeHandle = slider.SliderHandle.extend();

 VolumeHandle.prototype.defaultValue = '00:00';

 /** @inheritDoc */
 VolumeHandle.prototype.createEl = function(){
   return slider.SliderHandle.prototype.createEl.call(this, 'div', {
     className: 'vjs-volume-handle'
   });
 };

module.exports = {
  VolumeControl: VolumeControl,
  VolumeBar: VolumeBar,
  VolumeLevel: VolumeLevel,
  VolumeHandle: VolumeHandle
};
