import { TransitionDataAttrs } from '../transition';
import type { StateAttrMap } from '../types';
import type { MenuState } from './core';

/**
 * Root popup state used for positioning and surface transitions.
 *
 * @internal
 */
export const MenuPopupDataAttrs = {
  /** Present when the menu is open. */
  open: 'data-open',
  /** Rendered positioning side after collision handling. Absent on submenus. */
  side: 'data-side',
  /** Popover positioning alignment. Absent on submenus. */
  align: 'data-align',
  ...TransitionDataAttrs,
} as const satisfies StateAttrMap<MenuState>;

/**
 * State for one root or nested Content.
 *
 * @internal
 */
export const MenuContentDataAttrs = {
  /** Present while this Content is active or transitioning out. */
  open: 'data-open',
  /** Present on Content when this menu is nested inside a parent menu. */
  isSubmenu: 'data-submenu',
  /** Present when this Content has an open logical child. */
  childOpen: 'data-child-open',
  ...TransitionDataAttrs,
} as const satisfies StateAttrMap<MenuState> & { childOpen: string };

/**
 * All public Menu data attributes exposed to component transforms.
 *
 * @internal
 */
export const MenuDataAttrs = {
  ...MenuPopupDataAttrs,
  ...MenuContentDataAttrs,
} as const satisfies StateAttrMap<MenuState> & { childOpen: string };
