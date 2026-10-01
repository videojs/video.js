import type { MenuCore, MenuOptionState, MenuState } from '@videojs/core';
import type { MenuApi, MenuPopupApi } from '@videojs/core/dom';
import { createContext } from '@videojs/element/context';

export interface MenuContextValue {
  /** @internal The menu core that owns this menu; parts read `state` instead. */
  core: MenuCore;
  menu: MenuApi;
  popup: MenuPopupApi;
  state: MenuState;
  /** Publish option state to this menu and its parent trigger. */
  setOptionState: (source: symbol, state: MenuOptionState | null) => void;
}

/** @internal */
export interface MenuGroupContextValue {
  registerLabel: (id: string) => () => void;
}

const MENU_CONTEXT_KEY = Symbol('@videojs/menu');
const MENU_GROUP_CONTEXT_KEY = Symbol('@videojs/menu-group');

/** @internal */
export const menuContext = createContext<MenuContextValue>(MENU_CONTEXT_KEY);
/** @internal */
export const menuGroupContext = createContext<MenuGroupContextValue>(MENU_GROUP_CONTEXT_KEY);

export {
  type RadioGroupContextValue as MenuRadioGroupContextValue,
  radioGroupContext as menuRadioGroupContext,
} from '../radio-group/context';
