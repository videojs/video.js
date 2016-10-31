/**
 * @file loading-spinner.js
 */
import Component from './component';

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
    return super.createEl('div', {
      className: 'vjs-loading-spinner',
      dir: 'ltr'
    });
  }
}

Component.registerComponent('LoadingSpinner', LoadingSpinner);
export default LoadingSpinner;
