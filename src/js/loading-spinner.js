import Component from './component';

/* Loading Spinner
================================================================================ */
/**
 * Loading spinner for waiting events
 * @param {Player|Object} player
 * @param {Object=} options
 * @class
 * @constructor
 */
class LoadingSpinner extends Component {
  createEl() {
    return super.createEl('div', {
      className: 'vjs-loading-spinner'
    });
  }
}

Component.registerComponent('LoadingSpinner', LoadingSpinner);
export default LoadingSpinner;
