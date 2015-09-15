/**
 * @file captions-button.js
 */
import TextTrackButton from './text-track-button.js';
import Component from '../../component.js';
import CaptionSettingsMenuItem from './caption-settings-menu-item.js';

/**
 * The button component for toggling and selecting captions
 *
 * @param {Object} player  Player object
 * @param {Object=} options Object of option names and values
 * @param {Function=} ready    Ready callback function
 * @extends TextTrackButton
 * @class CaptionsButton
 */
class CaptionsButton extends TextTrackButton {

  constructor(player, options, ready){
    super(player, options, ready);
    this.el_.setAttribute('aria-label','Captions Menu');
  }

  /**
   * Allow sub components to stack CSS class names
   *
   * @return {String} The constructed class name
   * @method buildCSSClass
   */
  buildCSSClass() {
    return `vjs-captions-button ${super.buildCSSClass()}`;
  }

  /**
   * Update caption menu items
   *
   * @method update
   */
  update() {
    let threshold = 2;
    super.update();

    // if native, then threshold is 1 because no settings button
    if (this.player().tech_ && this.player().tech_['featuresNativeTextTracks']) {
      threshold = 1;
    }

    if (this.items && this.items.length > threshold) {
      this.show();
    } else {
      this.hide();
    }
  }

  /**
   * Create caption menu items
   *
   * @return {Array} Array of menu items
   * @method createItems
   */
  createItems() {
    let items = [];

    if (!(this.player().tech_ && this.player().tech_['featuresNativeTextTracks'])) {
      items.push(new CaptionSettingsMenuItem(this.player_, { 'kind': this.kind_ }));
    }

    return super.createItems(items);
  }

}

CaptionsButton.prototype.kind_ = 'captions';
CaptionsButton.prototype.controlText_ = 'Captions';

Component.registerComponent('CaptionsButton', CaptionsButton);
export default CaptionsButton;
