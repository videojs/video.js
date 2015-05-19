import TextTrackButton from './text-track-button.js';
import Component from '../../component.js';
import CaptionSettingsMenuItem from './caption-settings-menu-item.js';

/**
 * The button component for toggling and selecting captions
 *
 * @constructor
 */
class CaptionsButton extends TextTrackButton {

  constructor(player, options, ready){
    super(player, options, ready);
    this.el_.setAttribute('aria-label','Captions Menu');
  }

  update() {
    let threshold = 2;
    super.update();

    // if native, then threshold is 1 because no settings button
    if (this.player().tech && this.player().tech['featuresNativeTextTracks']) {
      threshold = 1;
    }

    if (this.items && this.items.length > threshold) {
      this.show();
    } else {
      this.hide();
    }
  }

  createItems() {
    let items = [];

    if (!(this.player().tech && this.player().tech['featuresNativeTextTracks'])) {
      items.push(new CaptionSettingsMenuItem(this.player_, { 'kind': this.kind_ }));
    }

    return super.createItems(items);
  }

}

CaptionsButton.prototype.kind_ = 'captions';
CaptionsButton.prototype.buttonText = 'Captions';
CaptionsButton.prototype.className = 'vjs-captions-button';

Component.registerComponent('CaptionsButton', CaptionsButton);
export default CaptionsButton;
