import CaptionsButton from './captions-button.js';

/**
 * The button component for toggling and selecting descriptions
 *
 * @constructor
 */
class DescriptionsButton extends CaptionsButton {

  constructor(player, options, ready){
    super(player, options, ready);
    this.el_.setAttribute('aria-label','Descriptions Menu');
  }

  buildCSSClass() {
    return `vjs-descriptions-button ${super.buildCSSClass()}`;
  }

}

DescriptionsButton.prototype.kind_ = 'descriptions';
DescriptionsButton.prototype.controlText_ = 'Descriptions';

CaptionsButton.registerComponent('DescriptionsButton', DescriptionsButton);
export default DescriptionsButton;
