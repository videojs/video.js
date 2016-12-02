/**
 * @file popup-button.js
 */
import ClickableComponent from '../clickable-component.js';
import Component from '../component.js';

/**
 * A button class for use with {@link Popup} controls
 *
 * @extends ClickableComponent
 */
class PopupButton extends ClickableComponent {

  /**
   * Create an instance of this class.
   *
   * @param {Player} player
   *        The `Player` that this class should be attached to.
   *
   * @param {Object} [options]
   *        The key/value store of player options.
   */
  constructor(player, options = {}) {
    super(player, options);

    this.update();
  }

  /**
   * Update the `Popup` that this button is attached to.
   */
  update() {
    const popup = this.createPopup();

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
   * Create a `Popup`. - Override with specific functionality for component
   *
   * @abstract
   */
  createPopup() {}

  /**
   * Create the `PopupButton`s DOM element.
   *
   * @return {Element}
   *         The element that gets created.
   */
  createEl() {
    return super.createEl('div', {
      className: this.buildCSSClass()
    });
  }

  /**
   * Builds the default DOM `className`.
   *
   * @return {string}
   *         The DOM `className` for this object.
   */
  buildCSSClass() {
    let menuButtonClass = 'vjs-menu-button';

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
