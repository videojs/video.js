/**
 * @file load-progress-bar.js
 */
import Component from '../../component.js';
import {bind} from '../../utils/fn.js';
import * as Dom from '../../utils/dom.js';
import activeElement from '../../mixins/active-element.js';

// get the percent width of a time compared to the total end
const percentify = function(time, end) {
  // no NaN
  let percent = (time / end) || 0;

  percent = (percent >= 1 ? 1 : percent) * 100;

  return percent;
};

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
    this.update = bind(this, this.update);
    activeElement(this, {
      liveUpdates: false,
      update: this.update,
      startUpdate: () => {
        this.on(player, 'progress', this.update);
        this.update();
      },
      stopUpdate: () => {
        this.off(player, 'progress', this.update);
      }
    });
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
    this.requestAnimationFrame(() => {
      const liveTracker = this.player_.liveTracker;
      const buffered = this.player_.buffered();
      const duration = (liveTracker && liveTracker.isLive()) ? liveTracker.seekableEnd() : this.player_.duration();
      const bufferedEnd = this.player_.bufferedEnd();
      const children = this.partEls_;
      const controlTextPercentage = this.$('.vjs-control-text-loaded-percentage');
      const percent = percentify(bufferedEnd, duration);

      if (this.el_.style.width !== percent) {
        // update the width of the progress bar
        this.el_.style.width = percent + '%';
      }

      // update the control-text
      Dom.textContent(controlTextPercentage, percent.toFixed(2) + '%');

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
        const leftPercent = percentify(start, bufferedEnd) + '%';
        const widthPercent = percentify(end - start, bufferedEnd) + '%';

        if (part.style.left !== leftPercent) {
          part.style.left = leftPercent;
        }

        if (part.style.width !== widthPercent) {
          part.style.widh = widthPercent;
        }
      }

      // remove unused buffered range elements
      for (let i = children.length; i > buffered.length; i--) {
        this.el_.removeChild(children[i - 1]);
      }
      children.length = buffered.length;
    });
  }

}

Component.registerComponent('LoadProgressBar', LoadProgressBar);
export default LoadProgressBar;
