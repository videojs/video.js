import Component from '../../component.js';

// Required children
import VolumeBar from './volume-bar.js';

/**
 * The component for controlling the volume level
 *
 * @param {Player|Object} player
 * @param {Object=} options
 * @constructor
 */
class VolumeControl extends Component {

  constructor(player, options){
    super(player, options);

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

  createEl() {
    return super.createEl('div', {
      className: 'vjs-volume-control vjs-control'
    });
  }

}

VolumeControl.prototype.options_ = {
  children: {
    'volumeBar': {}
  }
};

Component.registerComponent('VolumeControl', VolumeControl);
export default VolumeControl;
