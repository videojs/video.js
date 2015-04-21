import Component from './component';
import * as Lib from './lib';
import * as Events from './events';
import document from 'global/document';

/* Button - Base class for all buttons
================================================================================ */
/**
 * Base class for all buttons
 * @param {Player|Object} player
 * @param {Object=} options
 * @class
 * @constructor
 */
class Button extends Component {

  constructor(player, options) {
    super(player, options);

    this.emitTapEvents();

    this.on('tap', this.onClick);
    this.on('click', this.onClick);
    this.on('focus', this.onFocus);
    this.on('blur', this.onBlur);
  }

  createEl(type, props) {
    // Add standard Aria and Tabindex info
    props = Lib.obj.merge({
      className: this.buildCSSClass(),
      'role': 'button',
      'aria-live': 'polite', // let the screen reader user know that the text of the button may change
      tabIndex: 0
    }, props);

    let el = super.createEl(type, props);

    // if innerHTML hasn't been overridden (bigPlayButton), add content elements
    if (!props.innerHTML) {
      this.contentEl_ = Lib.createEl('div', {
        className: 'vjs-control-content'
      });

      this.controlText_ = Lib.createEl('span', {
        className: 'vjs-control-text',
        innerHTML: this.localize(this.buttonText) || 'Need Text'
      });

      this.contentEl_.appendChild(this.controlText_);
      el.appendChild(this.contentEl_);
    }

    return el;
  }

  buildCSSClass() {
    // TODO: Change vjs-control to vjs-button?
    return `vjs-control ${super.buildCSSClass()}`;
  }

  // Click - Override with specific functionality for button
  onClick() {}

  // Focus - Add keyboard functionality to element
  onFocus() {
    Events.on(document, 'keydown', Lib.bind(this, this.onKeyPress));
  }

  // KeyPress (document level) - Trigger click when keys are pressed
  onKeyPress(event) {
    // Check for space bar (32) or enter (13) keys
    if (event.which == 32 || event.which == 13) {
      event.preventDefault();
      this.onClick();
    }
  }

  // Blur - Remove keyboard triggers
  onBlur() {
    Events.off(document, 'keydown', Lib.bind(this, this.onKeyPress));
  }

}


Component.registerComponent('Button', Button);
export default Button;
