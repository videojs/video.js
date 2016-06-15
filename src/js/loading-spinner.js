/**
 * @file loading-spinner.js
 */
import Component from './component';

/* Loading Spinner
================================================================================ */
/**
 * Loading spinner for waiting events
 *
 * @extends Component
 * @class LoadingSpinner
 */
class LoadingSpinner extends Component {

  /**
   * Create the component's DOM element
   *
   * @method createEl
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
