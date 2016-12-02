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

    if (options.playerOptions &&
        options.playerOptions.controlBar &&
        options.playerOptions.controlBar.progressControl &&
        options.playerOptions.controlBar.progressControl.keepTooltipsInside) {
      this.keepTooltipsInside = options.playerOptions.controlBar.progressControl.keepTooltipsInside;
    }

    if (this.keepTooltipsInside) {
      this.tooltip = Dom.createEl('div', {className: 'vjs-time-tooltip'});
      this.el().appendChild(this.tooltip);
      this.addClass('vjs-keep-tooltips-inside');
    }

    this.update(0, 0);

    player.on('ready', () => {
      this.on(player.controlBar.progressControl.el(), 'mousemove', Fn.throttle(Fn.bind(this, this.handleMouseMove), 25));
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
   * Handle the mouse move event on the `MouseTimeDisplay`.
   *
   * @param {EventTarget~Event} event
   *        The `mousemove` event that caused this to event to run.
   *
   * @listen mousemove
   */
  handleMouseMove(event) {
    const duration = this.player_.duration();
    const newTime = this.calculateDistance(event) * duration;
    const position = event.pageX - Dom.findElPosition(this.el().parentNode).left;

    this.update(newTime, position);
  }

  /**
   * Update the time and posistion of the `MouseTimeDisplay`.
   *
   * @param {number} newTime
   *        Time to change the `MouseTimeDisplay` to.
   *
   * @param {nubmer} position
   *        Postion from the left of the in pixels.
   */
  update(newTime, position) {
    const time = formatTime(newTime, this.player_.duration());

    this.el().style.left = position + 'px';
    this.el().setAttribute('data-current-time', time);

    if (this.keepTooltipsInside) {
      const clampedPosition = this.clampPosition_(position);
      const difference = position - clampedPosition + 1;
      const tooltipWidth = parseFloat(computedStyle(this.tooltip, 'width'));
      const tooltipWidthHalf = tooltipWidth / 2;

      this.tooltip.innerHTML = time;
      this.tooltip.style.right = `-${tooltipWidthHalf - difference}px`;
    }
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
   * This takes in a horizontal position for the bar and returns a clamped position.
   * Clamped position means that it will keep the position greater than half the width
   * of the tooltip and smaller than the player width minus half the width o the tooltip.
   * It will only clamp the position if `keepTooltipsInside` option is set.
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
    if (!this.keepTooltipsInside) {
      return position;
    }

    const playerWidth = parseFloat(computedStyle(this.player().el(), 'width'));
    const tooltipWidth = parseFloat(computedStyle(this.tooltip, 'width'));
    const tooltipWidthHalf = tooltipWidth / 2;
    let actualPosition = position;

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
