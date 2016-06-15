/**
 * @file menu-item.js
 */
import ClickableComponent from '../clickable-component.js';
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
class MenuItem extends ClickableComponent {

  constructor(player, options) {
    super(player, options);

    this.selectable = options['selectable'];

    this.selected(options['selected']);

    if (this.selectable) {
      // TODO: May need to be either menuitemcheckbox or menuitemradio,
      //       and may need logical grouping of menu items.
      this.el_.setAttribute('role', 'menuitemcheckbox');
    } else {
      this.el_.setAttribute('role', 'menuitem');
    }
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
      innerHTML: this.localize(this.options_['label']),
      tabIndex: -1
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
    if (this.selectable) {
      if (selected) {
        this.addClass('vjs-selected');
        this.el_.setAttribute('aria-checked','true');
        // aria-checked isn't fully supported by browsers/screen readers,
        // so indicate selected state to screen reader in the control text.
        this.controlText(', selected');
      } else {
        this.removeClass('vjs-selected');
        this.el_.setAttribute('aria-checked','false');
        // Indicate un-selected state to screen reader
        // Note that a space clears out the selected state text
        this.controlText(' ');
      }
    }
  }
}

Component.registerComponent('MenuItem', MenuItem);
export default MenuItem;
