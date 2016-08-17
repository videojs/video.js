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

  constructor(player, options) {
    super(player, options);
    this.on(player, 'fullscreenchange', this.handleFullscreenChange);
  }

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
   * Handles Fullscreenchange on the component and change control text accordingly
   *
   * @method handleFullscreenChange
   */
  handleFullscreenChange() {
    if (this.player_.isFullscreen()) {
      this.controlText('Non-Fullscreen');
    } else {
      this.controlText('Fullscreen');
    }
  }
  /**
   * Handles click for full screen
   *
   * @method handleClick
   */
  handleClick() {
    if (!this.player_.isFullscreen()) {
      this.player_.requestFullscreen();
    } else {
      this.player_.exitFullscreen();
    }
  }

}

FullscreenToggle.prototype.controlText_ = 'Fullscreen';

Component.registerComponent('FullscreenToggle', FullscreenToggle);
export default FullscreenToggle;
