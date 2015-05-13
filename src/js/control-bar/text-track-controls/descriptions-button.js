import TextTrackButton from './text-track-button.js';

/**
 * The button component for toggling and selecting descriptions
 *
 * @constructor
 */
class DescriptionsButton extends TextTrackButton {

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

TextTrackButton.registerComponent('DescriptionsButton', DescriptionsButton);
export default DescriptionsButton;
