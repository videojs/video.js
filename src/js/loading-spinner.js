/**
 * @file loading-spinner.js
 */
import Component from './component';
import * as Dom from './utils/dom';

/**
 * A loading spinner for use during waiting/loading events.
 *
 * @extends Component
 */
class LoadingSpinner extends Component {

  /**
   * Create the `LoadingSpinner`s DOM element.
   *
   * @return {Element}
   *         The dom element that gets created.
   */
  createEl() {
    const isAudio = this.player_.isAudio();
    const playerType = this.localize(isAudio ? 'Audio Player' : 'Video Player');
    const controlText = Dom.createEl('span', {
      className: 'vjs-control-text',
      textContent: this.localize('{1} is loading.', [playerType])
    });

    const el = super.createEl('div', {
      className: 'vjs-loading-spinner',
      dir: 'ltr'
    });

    el.appendChild(controlText);

    return el;
  }

  /**
   * Update control text on languagechange
   */
  handleLanguagechange() {
    this.$('.vjs-control-text').textContent = this.localize('{1} is loading.', [
      this.player_.isAudio() ? 'Audio Player' : 'Video Player'
    ]);
  }
}

Component.registerComponent('LoadingSpinner', LoadingSpinner);
export default LoadingSpinner;
