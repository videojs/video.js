/**
 * @file fullscreen-toggle.js
 */
import Button from '../button.js';
import Component from '../component.js';

/**
 * Toggle fullscreen video
 *
 * @extends Button
 * @class FullscreenToggle
 */
class FullscreenToggle extends Button {

  /**
   * Allow sub components to stack CSS class names
   *
   * @return {String} The constructed class name
   * @method buildCSSClass
   */
  buildCSSClass() {
    return `vjs-fullscreen-control ${super.buildCSSClass()}`;
  }

  /**
   * Handles click for full screen
   *
   * @method handleClick
   */
  handleClick() {
    if (!this.player_.isFullscreen()) {
      this.player_.requestFullscreen();
      this.controlText('Non-Fullscreen');
    } else {
      this.player_.exitFullscreen();
      this.controlText('Fullscreen');
    }
  }

}

FullscreenToggle.prototype.controlText_ = 'Fullscreen';

Component.registerComponent('FullscreenToggle', FullscreenToggle);
export default FullscreenToggle;
