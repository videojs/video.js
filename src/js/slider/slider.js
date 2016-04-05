/**
 * @file slider.js
 */
import Component from '../component.js';
import * as Dom from '../utils/dom.js';
import assign from 'object.assign';

/**
 * The base functionality for sliders like the volume bar and seek bar
 *
 * @param {Player|Object} player
 * @param {Object=} options
 * @extends Component
 * @class Slider
 */
class Slider extends Component {

  constructor(player, options) {
    super(player, options);

    // Set property names to bar to match with the child Slider class is looking for
    this.bar = this.getChild(this.options_.barName);

    // Set a horizontal or vertical class on the slider depending on the slider type
    this.vertical(!!this.options_.vertical);

    this.on('mousedown', this.handleMouseDown);
    this.on('touchstart', this.handleMouseDown);
    this.on('focus', this.handleFocus);
    this.on('blur', this.handleBlur);
    this.on('click', this.handleClick);

    this.on(player, 'controlsvisible', this.update);
    this.on(player, this.playerEvent, this.update);
  }

  /**
   * Create the component's DOM element
   *
   * @param {String} type Type of element to create
   * @param {Object=} props List of properties in Object form
   * @return {Element}
   * @method createEl
   */
  createEl(type, props={}, attributes={}) {
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
      tabIndex: 0
    }, attributes);

    return super.createEl(type, props, attributes);
  }

  /**
   * Handle mouse down on slider
   *
   * @param {Object} event Mouse down event object
   * @method handleMouseDown
   */
  handleMouseDown(event) {
    let doc = this.bar.el_.ownerDocument;

    event.preventDefault();
    Dom.blockTextSelection();

    this.addClass('vjs-sliding');
    this.trigger('slideractive');

    this.on(doc, 'mousemove', this.handleMouseMove);
    this.on(doc, 'mouseup', this.handleMouseUp);
    this.on(doc, 'touchmove', this.handleMouseMove);
    this.on(doc, 'touchend', this.handleMouseUp);

    this.handleMouseMove(event);
  }

  /**
   * To be overridden by a subclass
   *
   * @method handleMouseMove
   */
  handleMouseMove() {}

  /**
   * Handle mouse up on Slider
   *
   * @method handleMouseUp
   */
  handleMouseUp() {
    let doc = this.bar.el_.ownerDocument;

    Dom.unblockTextSelection();

    this.removeClass('vjs-sliding');
    this.trigger('sliderinactive');

    this.off(doc, 'mousemove', this.handleMouseMove);
    this.off(doc, 'mouseup', this.handleMouseUp);
    this.off(doc, 'touchmove', this.handleMouseMove);
    this.off(doc, 'touchend', this.handleMouseUp);

    this.update();
  }

  /**
   * Update slider
   *
   * @method update
   */
  update() {
    // In VolumeBar init we have a setTimeout for update that pops and update to the end of the
    // execution stack. The player is destroyed before then update will cause an error
    if (!this.el_) return;

    // If scrubbing, we could use a cached value to make the handle keep up with the user's mouse.
    // On HTML5 browsers scrubbing is really smooth, but some flash players are slow, so we might want to utilize this later.
    // var progress =  (this.player_.scrubbing()) ? this.player_.getCache().currentTime / this.player_.duration() : this.player_.currentTime() / this.player_.duration();
    let progress = this.getPercent();
    let bar = this.bar;

    // If there's no bar...
    if (!bar) return;

    // Protect against no duration and other division issues
    if (typeof progress !== 'number' ||
        progress !== progress ||
        progress < 0 ||
        progress === Infinity) {
          progress = 0;
    }

    // Convert to a percentage for setting
    let percentage = (progress * 100).toFixed(2) + '%';

    // Set the new bar width or height
    if (this.vertical()) {
      bar.el().style.height = percentage;
    } else {
      bar.el().style.width = percentage;
    }
  }

  /**
   * Calculate distance for slider
   *
   * @param {Object} event Event object
   * @method calculateDistance
   */
  calculateDistance(event){
    let position = Dom.getPointerPosition(this.el_, event);
    if (this.vertical()) {
      return position.y;
    }
    return position.x;
  }

  /**
   * Handle on focus for slider
   *
   * @method handleFocus
   */
  handleFocus() {
    this.on(this.bar.el_.ownerDocument, 'keydown', this.handleKeyPress);
  }

  /**
   * Handle key press for slider
   *
   * @param {Object} event Event object
   * @method handleKeyPress
   */
  handleKeyPress(event) {
    if (event.which === 37 || event.which === 40) { // Left and Down Arrows
      event.preventDefault();
      this.stepBack();
    } else if (event.which === 38 || event.which === 39) { // Up and Right Arrows
      event.preventDefault();
      this.stepForward();
    }
  }

  /**
   * Handle on blur for slider
   *
   * @method handleBlur
   */
  handleBlur() {
    this.off(this.bar.el_.ownerDocument, 'keydown', this.handleKeyPress);
  }

  /**
   * Listener for click events on slider, used to prevent clicks
   *   from bubbling up to parent elements like button menus.
   *
   * @param {Object} event Event object
   * @method handleClick
   */
  handleClick(event) {
    event.stopImmediatePropagation();
    event.preventDefault();
  }

  /**
   * Get/set if slider is horizontal for vertical
   *
   * @param {Boolean} bool True if slider is vertical, false is horizontal
   * @return {Boolean} True if slider is vertical, false is horizontal
   * @method vertical
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

    return this;
  }

}

Component.registerComponent('Slider', Slider);
export default Slider;
