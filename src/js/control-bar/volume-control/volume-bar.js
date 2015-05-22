import Slider from '../../slider/slider.js';
import Component from '../../component.js';
import * as Fn from '../../utils/fn.js';
import roundFloat from '../../utils/round-float.js';

// Required children
import VolumeLevel from './volume-level.js';

/**
 * The bar that contains the volume level and can be clicked on to adjust the level
 *
 * @param {Player|Object} player
 * @param {Object=} options
 * @constructor
 */
class VolumeBar extends Slider {

  constructor(player, options){
    super(player, options);
    this.on(player, 'volumechange', this.updateARIAAttributes);
    player.ready(Fn.bind(this, this.updateARIAAttributes));
  }

  createEl() {
    return super.createEl('div', {
      className: 'vjs-volume-bar',
      'aria-label': 'volume level'
    });
  }

  handleMouseMove(event) {
    if (this.player_.muted()) {
      this.player_.muted(false);
    }

    this.player_.volume(this.calculateDistance(event));
  }

  getPercent() {
    if (this.player_.muted()) {
      return 0;
    } else {
      return this.player_.volume();
    }
  }

  stepForward() {
    this.player_.volume(this.player_.volume() + 0.1);
  }

  stepBack() {
    this.player_.volume(this.player_.volume() - 0.1);
  }

  updateARIAAttributes() {
    // Current value of volume bar as a percentage
    this.el_.setAttribute('aria-valuenow', roundFloat(this.player_.volume()*100, 2));
    this.el_.setAttribute('aria-valuetext', roundFloat(this.player_.volume()*100, 2)+'%');
  }

}

VolumeBar.prototype.options_ = {
  children: {
    'volumeLevel': {}
  },
  'barName': 'volumeLevel'
};

VolumeBar.prototype.playerEvent = 'volumechange';

Component.registerComponent('VolumeBar', VolumeBar);
export default VolumeBar;
