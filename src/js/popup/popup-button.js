/**
 * @file popup-button.js
 */
import ClickableComponent from '../clickable-component.js';
import Component from '../component.js';
import Popup from './popup.js';
import * as Dom from '../utils/dom.js';
import * as Fn from '../utils/fn.js';
import toTitleCase from '../utils/to-title-case.js';

/**
 * A button class with a popup control
 *
 * @param {Player|Object} player
 * @param {Object=} options
 * @extends ClickableComponent
 * @class PopupButton
 */
class PopupButton extends ClickableComponent {

  constructor(player, options={}){
    super(player, options);

    this.update();
  }

  /**
   * Update popup
   *
   * @method update
   */
  update() {
    let popup = this.createPopup();

    if (this.popup) {
      this.removeChild(this.popup);
    }

    this.popup = popup;
    this.addChild(popup);

    if (this.items && this.items.length === 0) {
      this.hide();
    } else if (this.items && this.items.length > 1) {
      this.show();
    }
  }

  /**
   * Create popup - Override with specific functionality for component
   *
   * @return {Popup} The constructed popup
   * @method createPopup
   */
  createPopup() {}

  /**
   * Create the component's DOM element
   *
   * @return {Element}
   * @method createEl
   */
  createEl() {
    return super.createEl('div', {
      className: this.buildCSSClass()
    });
  }

  /**
   * Allow sub components to stack CSS class names
   *
   * @return {String} The constructed class name
   * @method buildCSSClass
   */
  buildCSSClass() {
    var menuButtonClass = 'vjs-menu-button';

    // If the inline option is passed, we want to use different styles altogether.
    if (this.options_.inline === true) {
      menuButtonClass += '-inline';
    } else {
      menuButtonClass += '-popup';
    }

    return `vjs-menu-button ${menuButtonClass} ${super.buildCSSClass()}`;
  }

}

Component.registerComponent('PopupButton', PopupButton);
export default PopupButton;
