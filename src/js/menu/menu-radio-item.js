
/**
 * @file menu-radio-item.js
 */
import MenuItem from '../../menu/menu-item.js';
import Component from '../../component.js';

/**
 * The specific menu item type for selecting a language within a text track kind
 *
 * @extends MenuItem
 */
class MenuRadioItem extends MenuItem {
  constructor(player, options) {
    // only one item should be selectable in menu
    options.selectable = true;
    options.multiSelectable = false;
    super(player, options);

    this.selected(options.defaultSelection);
  }

  /**
   * This gets called when an `MenuRadioItem` is "clicked". See
   * {@link ClickableComponent} for more detailed information on what a click can be.
   *
   * @param {EventTarget~Event} event
   *        The `keydown`, `tap`, or `click` event that caused this function to be
   *        called.
   *
   * @listens tap
   * @listens click
   */
  handleClick(event) {
    for (const item of this.parentComponent_.parentComponent_.items) {
      item.selected(item.id_ === this.id_);
    }
  }
}

Component.registerComponent('MenuRadioItem', MenuRadioItem);
export default MenuRadioItem;
