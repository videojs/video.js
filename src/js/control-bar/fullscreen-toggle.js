import Button from '../button.js';
import Component from '../component.js';

/**
 * Toggle fullscreen video
 * @param {Player|Object} player
 * @param {Object=} options
 * @class
 * @extends vjs.Button
 */
class FullscreenToggle extends Button {

  buildCSSClass() {
    return `vjs-fullscreen-control ${super.buildCSSClass()}`;
  }

  handleClick() {
    if (!this.player_.isFullscreen()) {
      this.player_.requestFullscreen();
      this.controlText(this.localize('Non-Fullscreen'));
    } else {
      this.player_.exitFullscreen();
      this.controlText(this.localize('Fullscreen'));
    }
  }

}

FullscreenToggle.prototype.controlText_ = 'Fullscreen';

Component.registerComponent('FullscreenToggle', FullscreenToggle);
export default FullscreenToggle;
