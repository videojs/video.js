/**
 * @file menu-item.js
 */
import Button from '../button.js';
import Component from '../component.js';
import assign from 'object.assign';

/**
 * The component for a menu item. `<li>`
 *
 * @param {Player|Object} player
 * @param {Object=} options
 * @extends Button
 * @class MenuItem
 */
class MenuItem extends Button {

  constructor(player, options) {
    super(player, options);
    this.selected(options['selected']);
  }

  /**
   * Create the component's DOM element
   *
   * @param {String=} type Desc
   * @param {Object=} props Desc
   * @return {Element}
   * @method createEl
   */
  createEl(type, props, attrs) {
    return super.createEl('li', assign({
      className: 'vjs-menu-item',
      innerHTML: this.localize(this.options_['label'])
    }, props), attrs);
  }

  /**
   * Handle a click on the menu item, and set it to selected
   *
   * @method handleClick
   */
  handleClick() {
    this.selected(true);
  }

  /**
   * Set this menu item as selected or not
   *
   * @param  {Boolean} selected
   * @method selected
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
