
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
  constructor(player, options, clickHandler) {
    // one and only one item should be selectable in menu at a time
    options.selectable = true;
    options.multiSelectable = false;
    super(player, options);

    this.clickHandler = clickHandler;
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
    // loop through the menu items, selecting this one and unselecting others
    for (const item of this.parentComponent_.parentComponent_.items) {
      item.selected(item.id_ === this.id_);
    }

    // allow clickHandler so MenuRadioItems can be created directly
    // (see ClickableComponent.handleClick(). For some reason MenuItem overrides it. Here we restore it)
    if (typeof this.clickHandler === 'function') {
      this.clickHandler(event, this.options_);
    }
  }
}

Component.registerComponent('MenuRadioItem', MenuRadioItem);
export default MenuRadioItem;
