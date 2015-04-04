import Component from '../component';
import * as Lib from '../lib';
import Slider, { SliderHandle } from '../slider';

/**
 * The component for controlling the volume level
 *
 * @param {vjs.Player|Object} player
 * @param {Object=} options
 * @constructor
 */
let VolumeControl = Component.extend({
  /** @constructor */
  init: function(player, options){
    Component.call(this, player, options);

    // hide volume controls when they're not supported by the current tech
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
  }
});

Component.registerComponent('VolumeControl', VolumeControl);

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
var VolumeBar = Slider.extend({
  /** @constructor */
  init: function(player, options){
    Slider.call(this, player, options);
    this.on(player, 'volumechange', this.updateARIAAttributes);
    player.ready(Lib.bind(this, this.updateARIAAttributes));
  }
});

Component.registerComponent('VolumeBar', VolumeBar);

VolumeBar.prototype.updateARIAAttributes = function(){
  // Current value of volume bar as a percentage
  this.el_.setAttribute('aria-valuenow', Lib.round(this.player_.volume()*100, 2));
  this.el_.setAttribute('aria-valuetext', Lib.round(this.player_.volume()*100, 2)+'%');
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
  return Slider.prototype.createEl.call(this, 'div', {
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
var VolumeLevel = Component.extend({
  /** @constructor */
  init: function(player, options){
    Component.call(this, player, options);
  }
});

Component.registerComponent('VolumeLevel', VolumeLevel);

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
var VolumeHandle = SliderHandle.extend();

Component.registerComponent('VolumeHandle', VolumeHandle);

VolumeHandle.prototype.defaultValue = '00:00';

/** @inheritDoc */
VolumeHandle.prototype.createEl = function(){
  return SliderHandle.prototype.createEl.call(this, 'div', {
    className: 'vjs-volume-handle'
  });
};

export default VolumeControl;
export { VolumeBar, VolumeLevel, VolumeHandle };
