import Button from './button.js';
import Component from './component.js';
import {merge} from './utils/obj';
import * as Dom from './utils/dom.js';

/** @import Player from './player' */

/**
 * @typedef {object} TransientButtonOptions
 * @property {string} [controlText] Control text, usually visible for these buttons
 * @property {number} [initialDisplay=4000] Time in ms that button should initially remain visible
 * @property {Array<'top'|'neartop'|'bottom'|'left'|'right'>} [position] Array of position strings to add basic styles for positioning
 * @property {string} [className] Class(es) to add
 * @property {boolean} [takeFocus=false] Whether element sohuld take focus when shown
 * @property {Function} [clickHandler] Function called on button activation
 */

/** @type {TransientButtonOptions} */
const defaults = {
  initialDisplay: 4000,
  position: [],
  takeFocus: false
};

/**
 * A floating transient button.
 * It's recommended to insert these buttons _before_ the control bar with the this argument to `addChild`
 * for a logical tab order.
 *
 * @example
 * ```
 * player.addChild(
 *   'TransientButton',
 *   options,
 *   player.children().indexOf(player.getChild("ControlBar"))
 * )
 * ```
 *
 * @extends Button
 */
class TransientButton extends Button {
  /**
   * TransientButton constructor
   *
   * @param {Player} player The button's player
   * @param {TransientButtonOptions} options Options for the transient button
   */
  constructor(player, options) {
    options = merge(defaults, options);
    super(player, options);
    this.controlText(options.controlText);
    this.hide();

    // When shown, the float button will be visible even if the user is inactive.
    // Clear this if there is any interaction.
    this.on(this.player_, ['useractive', 'userinactive'], (e) => {
      this.removeClass('force-display');
    });
  }

  /**
   * Return CSS class including position classes
   *
   * @return {string} CSS class list
   */
  buildCSSClass() {
    return `vjs-transient-button focus-visible ${this.options_.position.map((c) => `vjs-${c}`).join(' ')}`;
  }

  /**
   * Create the button element
   *
   * @return {HTMLButtonElement} The button element
   */
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

  /**
   * Show the button. The button will remain visible for the `initialDisplay` time, default 4s,
   * and when there is user activity.
   */
  show() {
    super.show();
    this.addClass('force-display');
    if (this.options_.takeFocus) {
      this.el().focus({ preventScroll: true});
    }

    this.forceDisplayTimeout = this.player_.setTimeout(() => {
      this.removeClass('force-display');
    }, this.options_.initialDisplay);
  }

  /**
   * Hide the display, even if during the `initialDisplay` time.
   */
  hide() {
    this.removeClass('force-display');
    super.hide();
  }

  /**
   * Dispose the component
   */
  dispose() {
    this.player_.clearTimeout(this.forceDisplayTimeout);
    super.dispose();
  }
}

Component.registerComponent('TransientButton', TransientButton);
export default TransientButton;
