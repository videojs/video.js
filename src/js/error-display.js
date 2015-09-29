/**
 * @file error-display.js
 */
import Component from './component';
import  * as Dom from './utils/dom.js';

/**
 * Display that an error has occurred making the video unplayable
 *
 * @param {Object} player  Main Player
 * @param {Object=} options Object of option names and values
 * @extends Component
 * @class ErrorDisplay
 */
class ErrorDisplay extends Component {

  constructor(player, options) {
    super(player, options);

    this.update();
    this.on(player, 'error', this.update);
  }

  /**
   * Create the component's DOM element
   *
   * @return {Element}
   * @method createEl
   */
  createEl() {
    var el = super.createEl('div', {
      className: 'vjs-error-display'
    });

    this.contentEl_ = Dom.createEl('div');
    el.appendChild(this.contentEl_);

    return el;
  }

  /**
   * Update the error message in localized language
   *
   * @method update
   */
  update() {
    if (this.player().error()) {
      this.contentEl_.innerHTML = this.localize(this.player().error().message);
    }
  }
}

Component.registerComponent('ErrorDisplay', ErrorDisplay);
export default ErrorDisplay;
