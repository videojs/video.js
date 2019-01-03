/**
 * @file load-progress-bar.js
 */
import Component from '../../component.js';
import * as Dom from '../../utils/dom.js';

/**
 * Shows loading progress
 *
 * @extends Component
 */
class LoadProgressBar extends Component {

  /**
   * Creates an instance of this class.
   *
   * @param {Player} player
   *        The `Player` that this class should be attached to.
   *
   * @param {Object} [options]
   *        The key/value store of player options.
   */
  constructor(player, options) {
    super(player, options);
    this.partEls_ = [];
    this.on(player, 'progress', this.update);
  }

  /**
   * Create the `Component`'s DOM element
   *
   * @return {Element}
   *         The element that was created.
   */
  createEl() {
    return super.createEl('div', {
      className: 'vjs-load-progress',
      innerHTML: `<span class="vjs-control-text"><span>${this.localize('Loaded')}</span>: <span class="vjs-control-text-loaded-percentage">0%</span></span>`
    });
  }

  dispose() {
    this.partEls_ = null;

    super.dispose();
  }

  /**
   * Update progress bar
   *
   * @param {EventTarget~Event} [event]
   *        The `progress` event that caused this function to run.
   *
   * @listens Player#progress
   */
  update(event) {
    const liveTracker = this.player_.liveTracker;
    const buffered = this.player_.buffered();
    const duration = (liveTracker && liveTracker.isLive()) ? liveTracker.seekableEnd() : this.player_.duration();
    const bufferedEnd = this.player_.bufferedEnd();
    const children = this.partEls_;
    const controlTextPercentage = this.$('.vjs-control-text-loaded-percentage');

    // get the percent width of a time compared to the total end
    const percentify = function(time, end, rounded) {
      // no NaN
      let percent = (time / end) || 0;

      percent = (percent >= 1 ? 1 : percent) * 100;

      if (rounded) {
        percent = percent.toFixed(2);
      }

      return percent + '%';
    };

    // update the width of the progress bar
    this.el_.style.width = percentify(bufferedEnd, duration);

    // update the control-text
    Dom.textContent(controlTextPercentage, percentify(bufferedEnd, duration, true));

    // add child elements to represent the individual buffered time ranges
    for (let i = 0; i < buffered.length; i++) {
      const start = buffered.start(i);
      const end = buffered.end(i);
      let part = children[i];

      if (!part) {
        part = this.el_.appendChild(Dom.createEl());
        children[i] = part;
      }

      // set the percent based on the width of the progress bar (bufferedEnd)
      part.style.left = percentify(start, bufferedEnd);
      part.style.width = percentify(end - start, bufferedEnd);
    }

    // remove unused buffered range elements
    for (let i = children.length; i > buffered.length; i--) {
      this.el_.removeChild(children[i - 1]);
    }
    children.length = buffered.length;
  }

}

Component.registerComponent('LoadProgressBar', LoadProgressBar);
export default LoadProgressBar;
