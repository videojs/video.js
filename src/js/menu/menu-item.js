/**
 * @file menu-item.js
 */
import ClickableComponent from '../clickable-component.js';
import Component from '../component.js';
import {assign} from '../utils/obj';

/**
 * The component for a menu item. `<li>`
 *
 * @extends ClickableComponent
 */
class MenuItem extends ClickableComponent {

  /**
   * Creates an instance of the this class.
   *
   * @param {Player} player
   *        The `Player` that this class should be attached to.
   *
   * @param {Object} [options={}]
   *        The key/value store of player options.
   *
   */
  constructor(player, options) {
    super(player, options);

    this.selectable = options.selectable;

    this.selected(options.selected);

    if (this.selectable) {
      // TODO: May need to be either menuitemcheckbox or menuitemradio,
      //       and may need logical grouping of menu items.
      this.el_.setAttribute('role', 'menuitemcheckbox');
    } else {
      this.el_.setAttribute('role', 'menuitem');
    }
  }

  /**
   * Create the `MenuItem's DOM element
   *
   * @param {string} [type=li]
   *        Element's node type, not actually used, always set to `li`.
   *
   * @param {Object} [props={}]
   *        An object of properties that should be set on the element
   *
   * @param {Object} [attrs={}]
   *        An object of attributes that should be set on the element
   *
   * @return {Element}
   *         The element that gets created.
   */
  createEl(type, props, attrs) {
    // The control is textual, not just an icon
    this.nonIconControl = true;

    return super.createEl('li', assign({
      className: 'vjs-menu-item',
      innerHTML: this.localize(this.options_.label),
      tabIndex: -1
    }, props), attrs);
  }

  /**
   * Any click on a `MenuItem` puts int into the selected state.
   * See {@link ClickableComponent#handleClick} for instances where this is called.
   *
   * @param {EventTarget~Event} event
   *        The `keydown`, `tap`, or `click` event that caused this function to be
   *        called.
   *
   * @listens tap
   * @listens click
   */
  handleClick(event) {
    this.selected(true);
  }

  /**
   * Set the state for this menu item as selected or not.
   *
   * @param {boolean} selected
   *        if the menu item is selected or not
   */
  selected(selected) {
    if (this.selectable) {
      if (selected) {
        this.addClass('vjs-selected');
        this.el_.setAttribute('aria-checked', 'true');
        // aria-checked isn't fully supported by browsers/screen readers,
        // so indicate selected state to screen reader in the control text.
        this.controlText(', selected');
      } else {
        this.removeClass('vjs-selected');
        this.el_.setAttribute('aria-checked', 'false');
        // Indicate un-selected state to screen reader
        // Note that a space clears out the selected state text
        this.controlText(' ');
      }
    }
  }
}

Component.registerComponent('MenuItem', MenuItem);
export default MenuItem;
