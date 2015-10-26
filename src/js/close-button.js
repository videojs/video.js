import Button from './button';
import Component from './component';

/**
 * The `CloseButton` component is a button which fires a "close" event
 * when it is activated.
 *
 * @extends Button
 * @class CloseButton
 */
class CloseButton extends Button {

  constructor(player, options) {
    super(player, options);
    this.controlText(options && options.controlText || this.localize('Close'));
  }

  buildCSSClass() {
    return `vjs-close-button ${super.buildCSSClass()}`;
  }

  handleClick() {
    this.trigger({type: 'close', bubbles: false});
  }
}

Component.registerComponent('CloseButton', CloseButton);
export default CloseButton;
