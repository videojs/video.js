import Button from '../button.js';
import Component from '../component.js';
import assign from 'object.assign';

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
    return super.createEl('li', assign({
      className: 'vjs-menu-item',
      innerHTML: this.localize(this.options_['label'])
    }, props));
  }

  /**
   * Handle a click on the menu item, and set it to selected
   */
  handleClick() {
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

Component.registerComponent('MenuItem', MenuItem);
export default MenuItem;
