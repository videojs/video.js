/**
 * Data attributes set on all navigable menu item elements.
 *
 * @parts item, radio-item, checkbox-item, trigger
 * @internal
 */
export const MenuItemDataAttrs = {
  /**
   * Present on all navigable item types: Item, RadioItem, CheckboxItem, and the Trigger when acting as a submenu
   * trigger inside a parent menu. Use `[data-item]` as a shared selector to target all item types at once.
   */
  item: 'data-item',
  /** Present when the item is highlighted. Set to `pointer` when pointer movement caused the highlight; otherwise empty. */
  highlighted: 'data-highlighted',
} as const;
