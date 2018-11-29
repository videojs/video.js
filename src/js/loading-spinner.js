/**
 * @file loading-spinner.js
 */
import Component from './component';
import * as dom from './utils/dom';

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
    const controlText = dom.createEl('span', {
      className: 'vjs-control-text',
      innerHTML: this.localize('{1} is loading.', [playerType])
    });

    const el = super.createEl('div', {
      className: 'vjs-loading-spinner',
      dir: 'ltr'
    });

    el.appendChild(controlText);

    return el;
  }

  /**
   * Show the `LoadingSpinner`s DOM element, by adding the `vjs-waiting` css class to it.
   */
  show() {
    super.show();
    this.player().addClass('vjs-waiting');
  }

  /**
   * Hide the `LoadingSpinner`s DOM element, by removing the `vjs-waiting` css class from it.
   */
  hide() {
    super.hide();
    this.player().removeClass('vjs-waiting');
  }
}

Component.registerComponent('LoadingSpinner', LoadingSpinner);
export default LoadingSpinner;
