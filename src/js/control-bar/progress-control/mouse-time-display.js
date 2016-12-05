/**
 * @file mouse-time-display.js
 */
import Component from '../../component.js';
import * as Dom from '../../utils/dom.js';
import * as Fn from '../../utils/fn.js';
import formatTime from '../../utils/format-time.js';
import computedStyle from '../../utils/computed-style.js';

/**
 * The Mouse Time Display component shows the time you will seek to
 * when hovering over the progress bar
 *
 * @extends Component
 */
class MouseTimeDisplay extends Component {

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

    this.tooltip = Dom.createEl('div', {className: 'vjs-time-tooltip'});
    this.el().appendChild(this.tooltip);

    this.update(0, 0);

    player.on('ready', () => {
      const progressControlEl = player.
        getChild('controlBar').
        getChild('progressControl').
        el();

      const listener = Fn.throttle(Fn.bind(this, this.handleProgressMouseMove), 25);

      this.on(progressControlEl, 'mousemove', listener);
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
      className: 'vjs-mouse-display'
    });
  }

  /**
   * Handle the mouse move event on the grandparent progress control.
   *
   * @param {EventTarget~Event} event
   *        The `mousemove` event that caused this to event to run.
   *
   * @listen mousemove
   */
  handleProgressMouseMove(event) {
    const referenceEl = this.el().parentNode;
    const duration = this.player_.duration();
    const newTime = this.calculateDistance(event) * duration;

    let position = event.pageX - Dom.findElPosition(referenceEl).left;

    // Because the event is targeting the grandparent of this component, we
    // need to ensure that the position remains within the actual reference
    // element (the parent, i.e. the seek-bar). On the left, this means
    // ensuring that position is always 0 or above.
    if (position < 0) {
      position = 0;

    // On the right, this means ensuring the position is always less than or
    // equal to the seek bar's client width.
    } else if (position > referenceEl.clientWidth) {
      position = referenceEl.clientWidth;
    }

    this.update(newTime, position);
  }

  /**
   * Update the time and position of the `MouseTimeDisplay`.
   *
   * @param {number} newTime
   *        Time to change the `MouseTimeDisplay` to.
   *
   * @param {number} position
   *        Postion from the left of the in pixels.
   */
  update(newTime, position) {
    const time = formatTime(newTime, this.player_.duration());

    this.el().style.left = position + 'px';
    this.el().setAttribute('data-current-time', time);

    const clampedPosition = this.clampPosition_(position);
    const difference = position - clampedPosition + 1;
    const tooltipWidth = parseFloat(computedStyle(this.tooltip, 'width'));
    const tooltipWidthHalf = tooltipWidth / 2;

    this.tooltip.innerHTML = time;
    this.tooltip.style.right = `-${tooltipWidthHalf - difference}px`;
  }

  /**
   * Get the mouse pointers x coordinate in pixels.
   *
   * @param {EventTarget~Event} [event]
   *        The `mousemove` event that was passed to this function by
   *        {@link MouseTimeDisplay#handleMouseMove}
   *
   * @return {number}
   *         THe x position in pixels of the mouse pointer.
   */
  calculateDistance(event) {
    return Dom.getPointerPosition(this.el().parentNode, event).x;
  }

  /**
   * This takes in a horizontal position for the bar and returns a clamped
   * position. Clamped position means that it will keep the position greater
   * than half the width of the tooltip and smaller than the player width minus
   * half the width of the tooltip.
   *
   * @param {number} position
   *        The position the bar wants to be
   *
   * @return {number}
   *         The (potentially) new clamped position.
   *
   * @private
   */
  clampPosition_(position) {
    const playerWidth = parseFloat(computedStyle(this.player().el(), 'width'));
    const tooltipWidth = parseFloat(computedStyle(this.tooltip, 'width'));
    const tooltipWidthHalf = tooltipWidth / 2;
    let actualPosition = position;

    // need to account for the width of the progress-holder element

    if (position < tooltipWidthHalf) {
      actualPosition = Math.ceil(tooltipWidthHalf);
    } else if (position > (playerWidth - tooltipWidthHalf)) {
      actualPosition = Math.floor(playerWidth - tooltipWidthHalf);
    }

    return actualPosition;
  }
}

Component.registerComponent('MouseTimeDisplay', MouseTimeDisplay);
export default MouseTimeDisplay;
