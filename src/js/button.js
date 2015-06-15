import Component from './component';
import * as Dom from './utils/dom.js';
import * as Events from './utils/events.js';
import * as Fn from './utils/fn.js';
import document from 'global/document';
import assign from 'object.assign';

/* Button - Base class for all buttons
================================================================================ */
/**
 * Base class for all buttons
 * @param {Player|Object} player
 * @param {Object=} options
 * @extends Component
 * @class Button
 */
class Button extends Component {

  constructor(player, options) {
    super(player, options);

    this.emitTapEvents();

    this.on('tap', this.handleClick);
    this.on('click', this.handleClick);
    this.on('focus', this.handleFocus);
    this.on('blur', this.handleBlur);
  }

  /**
  * Create the component's DOM element
  *
  *     //This is test code
  *     var myPlayer = this;
  *
  * @param {String=} type - Element's node type. e.g. 'div'
  * @param {Object=} props - An object of element attributes that should be set on the element Tag name 
  * @return HTML Element
  * @method createEl
  */
  createEl(type='button', props={}) {
    // Add standard Aria and Tabindex info
    props = assign({
      className: this.buildCSSClass(),
      'role': 'button',
      'aria-live': 'polite', // let the screen reader user know that the text of the button may change
      tabIndex: 0
    }, props);

    let el = super.createEl(type, props);

    this.controlTextEl_ = Dom.createEl('span', {
      className: 'vjs-control-text'
    });

    el.appendChild(this.controlTextEl_);

    this.controlText(this.controlText_);

    return el;
  }

  controlText(text) {
    if (!text) return this.controlText_ || 'Need Text';

    this.controlText_ = text;
    this.controlTextEl_.innerHTML = this.localize(this.controlText_);

    return this;
  }

  /**
  * Allows sub components to stack CSS class names
  * @return {String}
  * @method buildCSSClass
  */
  buildCSSClass() {
    return `vjs-control vjs-button ${super.buildCSSClass()}`;
  }

  // Click - Override with specific functionality for button
  handleClick() {}

  // Focus - Add keyboard functionality to element
  handleFocus() {
    Events.on(document, 'keydown', Fn.bind(this, this.handleKeyPress));
  }

  // KeyPress (document level) - Trigger click when keys are pressed
  handleKeyPress(event) {
    // Check for space bar (32) or enter (13) keys
    if (event.which === 32 || event.which === 13) {
      event.preventDefault();
      this.handleClick();
    }
  }

  // Blur - Remove keyboard triggers
  handleBlur() {
    Events.off(document, 'keydown', Fn.bind(this, this.handleKeyPress));
  }

}


Component.registerComponent('Button', Button);
export default Button;
