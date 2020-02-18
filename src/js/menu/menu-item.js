/**
 * @file menu-item.js
 */
import ClickableComponent from '../clickable-component.js';
import Component from '../component.js';
import {assign} from '../utils/obj';
import {MenuKeys} from './menu-keys.js';
import keycode from 'keycode';

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
    this.isSelected_ = options.selected || false;
    this.multiSelectable = options.multiSelectable;

    this.selected(this.isSelected_);

    if (this.selectable) {
      if (this.multiSelectable) {
        this.el_.setAttribute('role', 'menuitemcheckbox');
      } else {
        this.el_.setAttribute('role', 'menuitemradio');
      }
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
      innerHTML: `<span class="vjs-menu-item-text">${this.localize(this.options_.label)}</span>`,
      tabIndex: -1
    }, props), attrs);
  }

  /**
   * Ignore keys which are used by the menu, but pass any other ones up. See
   * {@link ClickableComponent#handleKeyDown} for instances where this is called.
   *
   * @param {EventTarget~Event} event
   *        The `keydown` event that caused this function to be called.
   *
   * @listens keydown
   */
  handleKeyDown(event) {
    if (!MenuKeys.some((key) => keycode.isEventKey(event, key))) {
      // Pass keydown handling up for unused keys
      super.handleKeyDown(event);
    }
  }

  /**
   * Any click on a `MenuItem` puts it into the selected state.
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
        this.isSelected_ = true;
      } else {
        this.removeClass('vjs-selected');
        this.el_.setAttribute('aria-checked', 'false');
        // Indicate un-selected state to screen reader
        this.controlText('');
        this.isSelected_ = false;
      }
    }
  }
}

Component.registerComponent('MenuItem', MenuItem);
export default MenuItem;
