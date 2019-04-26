/**
 * @file slider.js
 */
import Component from '../component.js';
import * as Dom from '../utils/dom.js';
import {assign} from '../utils/obj';
import {IS_CHROME} from '../utils/browser.js';
import keycode from 'keycode';

/**
 * The base functionality for a slider. Can be vertical or horizontal.
 * For instance the volume bar or the seek bar on a video is a slider.
 *
 * @extends Component
 */
class Slider extends Component {

  /**
 * Create an instance of this class
 *
 * @param {Player} player
 *        The `Player` that this class should be attached to.
 *
 * @param {Object} [options]
 *        The key/value store of player options.
 */
  constructor(player, options) {
    super(player, options);

    // Set property names to bar to match with the child Slider class is looking for
    this.bar = this.getChild(this.options_.barName);

    // Set a horizontal or vertical class on the slider depending on the slider type
    this.vertical(!!this.options_.vertical);

    this.enable();
  }

  /**
   * Are controls are currently enabled for this slider or not.
   *
   * @return {boolean}
   *         true if controls are enabled, false otherwise
   */
  enabled() {
    return this.enabled_;
  }

  /**
   * Enable controls for this slider if they are disabled
   */
  enable() {
    if (this.enabled()) {
      return;
    }

    this.on('mousedown', this.handleMouseDown);
    this.on('touchstart', this.handleMouseDown);
    this.on('keydown', this.handleKeyDown);
    this.on('click', this.handleClick);

    this.on(this.player_, 'controlsvisible', this.update);

    if (this.playerEvent) {
      this.on(this.player_, this.playerEvent, this.update);
    }

    this.removeClass('disabled');
    this.setAttribute('tabindex', 0);

    this.enabled_ = true;
  }

  /**
   * Disable controls for this slider if they are enabled
   */
  disable() {
    if (!this.enabled()) {
      return;
    }
    const doc = this.bar.el_.ownerDocument;

    this.off('mousedown', this.handleMouseDown);
    this.off('touchstart', this.handleMouseDown);
    this.off('keydown', this.handleKeyDown);
    this.off('click', this.handleClick);
    this.off(this.player_, 'controlsvisible', this.update);
    this.off(doc, 'mousemove', this.handleMouseMove);
    this.off(doc, 'mouseup', this.handleMouseUp);
    this.off(doc, 'touchmove', this.handleMouseMove);
    this.off(doc, 'touchend', this.handleMouseUp);
    this.removeAttribute('tabindex');

    this.addClass('disabled');

    if (this.playerEvent) {
      this.off(this.player_, this.playerEvent, this.update);
    }
    this.enabled_ = false;
  }

  /**
   * Create the `Slider`s DOM element.
   *
   * @param {string} type
   *        Type of element to create.
   *
   * @param {Object} [props={}]
   *        List of properties in Object form.
   *
   * @param {Object} [attributes={}]
   *        list of attributes in Object form.
   *
   * @return {Element}
   *         The element that gets created.
   */
  createEl(type, props = {}, attributes = {}) {
    // Add the slider element class to all sub classes
    props.className = props.className + ' vjs-slider';
    props = assign({
      tabIndex: 0
    }, props);

    attributes = assign({
      'role': 'slider',
      'aria-valuenow': 0,
      'aria-valuemin': 0,
      'aria-valuemax': 100,
      'tabIndex': 0
    }, attributes);

    return super.createEl(type, props, attributes);
  }

  /**
   * Handle `mousedown` or `touchstart` events on the `Slider`.
   *
   * @param {EventTarget~Event} event
   *        `mousedown` or `touchstart` event that triggered this function
   *
   * @listens mousedown
   * @listens touchstart
   * @fires Slider#slideractive
   */
  handleMouseDown(event) {
    const doc = this.bar.el_.ownerDocument;

    if (event.type === 'mousedown') {
      event.preventDefault();
    }
    // Do not call preventDefault() on touchstart in Chrome
    // to avoid console warnings. Use a 'touch-action: none' style
    // instead to prevent unintented scrolling.
    // https://developers.google.com/web/updates/2017/01/scrolling-intervention
    if (event.type === 'touchstart' && !IS_CHROME) {
      event.preventDefault();
    }
    Dom.blockTextSelection();

    this.addClass('vjs-sliding');
    /**
     * Triggered when the slider is in an active state
     *
     * @event Slider#slideractive
     * @type {EventTarget~Event}
     */
    this.trigger('slideractive');

    this.on(doc, 'mousemove', this.handleMouseMove);
    this.on(doc, 'mouseup', this.handleMouseUp);
    this.on(doc, 'touchmove', this.handleMouseMove);
    this.on(doc, 'touchend', this.handleMouseUp);

    this.handleMouseMove(event);
  }

  /**
   * Handle the `mousemove`, `touchmove`, and `mousedown` events on this `Slider`.
   * The `mousemove` and `touchmove` events will only only trigger this function during
   * `mousedown` and `touchstart`. This is due to {@link Slider#handleMouseDown} and
   * {@link Slider#handleMouseUp}.
   *
   * @param {EventTarget~Event} event
   *        `mousedown`, `mousemove`, `touchstart`, or `touchmove` event that triggered
   *        this function
   *
   * @listens mousemove
   * @listens touchmove
   */
  handleMouseMove(event) {}

  /**
   * Handle `mouseup` or `touchend` events on the `Slider`.
   *
   * @param {EventTarget~Event} event
   *        `mouseup` or `touchend` event that triggered this function.
   *
   * @listens touchend
   * @listens mouseup
   * @fires Slider#sliderinactive
   */
  handleMouseUp() {
    const doc = this.bar.el_.ownerDocument;

    Dom.unblockTextSelection();

    this.removeClass('vjs-sliding');
    /**
     * Triggered when the slider is no longer in an active state.
     *
     * @event Slider#sliderinactive
     * @type {EventTarget~Event}
     */
    this.trigger('sliderinactive');

    this.off(doc, 'mousemove', this.handleMouseMove);
    this.off(doc, 'mouseup', this.handleMouseUp);
    this.off(doc, 'touchmove', this.handleMouseMove);
    this.off(doc, 'touchend', this.handleMouseUp);

    this.update();
  }

  /**
   * Update the progress bar of the `Slider`.
   *
   * @return {number}
   *          The percentage of progress the progress bar represents as a
   *          number from 0 to 1.
   */
  update() {

    // In VolumeBar init we have a setTimeout for update that pops and update
    // to the end of the execution stack. The player is destroyed before then
    // update will cause an error
    if (!this.el_) {
      return;
    }

    // If scrubbing, we could use a cached value to make the handle keep up
    // with the user's mouse. On HTML5 browsers scrubbing is really smooth, but
    // some flash players are slow, so we might want to utilize this later.
    // var progress =  (this.player_.scrubbing()) ? this.player_.getCache().currentTime / this.player_.duration() : this.player_.currentTime() / this.player_.duration();
    let progress = this.getPercent();
    const bar = this.bar;

    // If there's no bar...
    if (!bar) {
      return;
    }

    // Protect against no duration and other division issues
    if (typeof progress !== 'number' ||
        progress !== progress ||
        progress < 0 ||
        progress === Infinity) {
      progress = 0;
    }

    // Convert to a percentage for setting
    const percentage = (progress * 100).toFixed(2) + '%';
    const style = bar.el().style;

    // Set the new bar width or height
    if (this.vertical()) {
      style.height = percentage;
    } else {
      style.width = percentage;
    }

    return progress;
  }

  /**
   * Calculate distance for slider
   *
   * @param {EventTarget~Event} event
   *        The event that caused this function to run.
   *
   * @return {number}
   *         The current position of the Slider.
   *         - position.x for vertical `Slider`s
   *         - position.y for horizontal `Slider`s
   */
  calculateDistance(event) {
    const position = Dom.getPointerPosition(this.el_, event);

    if (this.vertical()) {
      return position.y;
    }
    return position.x;
  }

  /**
   * Handle a `keydown` event on the `Slider`. Watches for left, rigth, up, and down
   * arrow keys. This function will only be called when the slider has focus. See
   * {@link Slider#handleFocus} and {@link Slider#handleBlur}.
   *
   * @param {EventTarget~Event} event
   *        the `keydown` event that caused this function to run.
   *
   * @listens keydown
   */
  handleKeyDown(event) {

    // Left and Down Arrows
    if (keycode.isEventKey(event, 'Left') || keycode.isEventKey(event, 'Down')) {
      event.stopPropagation();
      this.stepBack();

    // Up and Right Arrows
    } else if (keycode.isEventKey(event, 'Right') || keycode.isEventKey(event, 'Up')) {
      event.stopPropagation();
      this.stepForward();
    } else {

      // Pass keydown handling up for unsupported keys
      super.handleKeyDown(event);
    }
  }

  /**
   * Listener for click events on slider, used to prevent clicks
   *   from bubbling up to parent elements like button menus.
   *
   * @param {Object} event
   *        Event that caused this object to run
   */
  handleClick(event) {
    event.stopPropagation();
    event.preventDefault();
  }

  /**
   * Get/set if slider is horizontal for vertical
   *
   * @param {boolean} [bool]
   *        - true if slider is vertical,
   *        - false is horizontal
   *
   * @return {boolean}
   *         - true if slider is vertical, and getting
   *         - false if the slider is horizontal, and getting
   */
  vertical(bool) {
    if (bool === undefined) {
      return this.vertical_ || false;
    }

    this.vertical_ = !!bool;

    if (this.vertical_) {
      this.addClass('vjs-slider-vertical');
    } else {
      this.addClass('vjs-slider-horizontal');
    }
  }
}

Component.registerComponent('Slider', Slider);
export default Slider;
