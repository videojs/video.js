/**
 * @file load-progress-bar.js
 */
import Component from '../../component.js';
import * as Dom from '../../utils/dom.js';

/**
 * Shows load progress
 *
 * @param {Player|Object} player
 * @param {Object=} options
 * @extends Component
 * @class LoadProgressBar
 */
class LoadProgressBar extends Component {

  constructor(player, options){
    super(player, options);
    this.on(player, 'progress', this.update);
  }

  /**
   * Create the component's DOM element
   *
   * @return {Element}
   * @method createEl
   */
  createEl() {
    return super.createEl('div', {
      className: 'vjs-load-progress',
      innerHTML: `<span class="vjs-control-text"><span>${this.localize('Loaded')}</span>: 0%</span>`
    });
  }

  /**
   * Update progress bar
   *
   * @method update
   */
  update() {
    let buffered = this.player_.buffered();
    let duration = this.player_.duration();
    let bufferedEnd = this.player_.bufferedEnd();
    let children = this.el_.children;

    // get the percent width of a time compared to the total end
    let percentify = function (time, end){
      let percent = (time / end) || 0; // no NaN
      return ((percent >= 1 ? 1 : percent) * 100) + '%';
    };

    // update the width of the progress bar
    this.el_.style.width = percentify(bufferedEnd, duration);

    // add child elements to represent the individual buffered time ranges
    for (let i = 0; i < buffered.length; i++) {
      let start = buffered.start(i);
      let end = buffered.end(i);
      let part = children[i];

      if (!part) {
        part = this.el_.appendChild(Dom.createEl());
      }

      // set the percent based on the width of the progress bar (bufferedEnd)
      part.style.left = percentify(start, bufferedEnd);
      part.style.width = percentify(end - start, bufferedEnd);
    }

    // remove unused buffered range elements
    for (let i = children.length; i > buffered.length; i--) {
      this.el_.removeChild(children[i-1]);
    }
  }

}

Component.registerComponent('LoadProgressBar', LoadProgressBar);
export default LoadProgressBar;
