import Button from '../button.js';
import * as Lib from '../lib.js';

/**
 * The component for a menu item. `<li>`
 *
 * @param {Player|Object} player
 * @param {Object=} options
 * @class
 * @constructor
 */
class MenuItem extends Button {

  constructor(player, options) {
    super(player, options);
    this.selected(options['selected']);
  }

  /** @inheritDoc */
  createEl(type, props) {
    return super.createEl('li', Lib.obj.merge({
      className: 'vjs-menu-item',
      innerHTML: this.localize(this.options_['label'])
    }, props));
  }

  /**
   * Handle a click on the menu item, and set it to selected
   */
  onClick() {
    this.selected(true);
  }

  /**
   * Set this menu item as selected or not
   * @param  {Boolean} selected
   */
  selected(selected) {
    if (selected) {
      this.addClass('vjs-selected');
      this.el_.setAttribute('aria-selected',true);
    } else {
      this.removeClass('vjs-selected');
      this.el_.setAttribute('aria-selected',false);
    }
  }

}

Button.registerComponent('MenuItem', MenuItem);
export default MenuItem;
