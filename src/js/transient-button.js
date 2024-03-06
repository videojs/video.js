import Button from './button.js';
import Component from './component.js';
import {merge} from './utils/obj';
import * as Dom from './utils/dom.js';

// Options type will need to extend button options, because `className`, `clickHandler` may be used
// `position` is redeundant with `className` but allows position to be set without overriding className or vice versa.
const defaults = {
  forceTimeout: 4000,
  position: 'bottom left',
  takeFocus: false
};

/**
 * A floating transient button
 *
 * @extends Button
 */
class TransientButton extends Button {
  /**
   *
   * @param { import('./player').default } player
   *
   * @param {object} options
   */
  constructor(player, options) {
    options = merge(defaults, options);
    super(player, options);
    this.controlText(options.controlText);
    this.hide();

    // When shown, the float button will be visible even if the user is inactive.
    // Clear this if there is any interaction.
    player.on(['useractive', 'userinactive'], () => {
      this.removeClass('force-display');
    });
  }

  buildCSSClass() {
    return `vjs-transient-button focus-visible ${this.options_.position.split(' ').map((c) => `vjs-${c}`).join(' ')}`;
  }

  createEl() {
    /** @type HTMLButtonElement */
    const el = Dom.createEl(
      'button', {}, {
        type: 'button',
        class: this.buildCSSClass()
      },
      Dom.createEl('span')
    );

    this.controlTextEl_ = el.querySelector('span');

    return el;
  }

  show() {
    super.show();
    this.addClass('force-display');
    if (this.options_.takeFocus) {
      this.el().focus({ preventScroll: true});
    }

    this.forceDisplayTimeout = this.player_.setTimeout(() => {
      this.removeClass('force-display');
    }, this.options_.forceTimeout);
  }

  hide() {
    this.removeClass('force-display');
    super.hide();
  }

  dispose() {
    this.player_.clearTimeout(this.forceDisplayTimeout);
    super.dispose();
  }
}

Component.registerComponent('TransientButton', TransientButton);
export default TransientButton;
