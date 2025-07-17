/* eslint-env browser */

import Button from '../../button.js';
import Component from '../../component.js';

/**
 * Button to display video information overlay
 */
class InfoButton extends Button {
  /**
   * Constructor for InfoButton
   */
  constructor(player, options) {
    super(player, options);
    this.controlText('Show video info');
  }

  /**
   * Builds the CSS class for the button
   */
  buildCSSClass() {
    return `vjs-info-button ${super.buildCSSClass()}`;
  }

  /**
   * Handles click event to show video info
   */
  handleClick() {
    const player = this.player();
    const duration = player.duration();
    const currentTime = player.currentTime();
    const videoWidth = player.videoWidth();
    const videoHeight = player.videoHeight();

    const info = `
    <div class="vjs-info-overlay">
      <strong>Video Information:</strong><br>
      Duration: ${Math.floor(duration / 60)}:${Math.floor(duration % 60).toString().padStart(2, '0')}<br>
      Current Time: ${Math.floor(currentTime / 60)}:${Math.floor(currentTime % 60).toString().padStart(2, '0')}<br>
      Resolution: ${videoWidth}x${videoHeight}<br>
      Source: ${player.currentSrc()}
    </div>
  `;

    // Remove existing overlay if present
    const oldOverlay = player.el().querySelector('.vjs-info-overlay');

    if (oldOverlay) {
      oldOverlay.remove();
    }

    // Create a new overlay element
    const overlay = document.createElement('div');

    overlay.className = 'vjs-info-overlay';
    overlay.innerHTML = info;

    player.el().appendChild(overlay);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      overlay.remove();
    }, 9000);
  }

}

InfoButton.prototype.controlText_ = 'Info';

Component.registerComponent('InfoButton', InfoButton);
export default InfoButton;
