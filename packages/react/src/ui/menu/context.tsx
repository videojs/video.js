'use client';

import type { MenuCore, MenuOptionState, MenuState } from '@videojs/core';
import type { MediaContainer, MenuApi, MenuPopupApi, PositioningBoundary } from '@videojs/core/dom';
import { createContext, useContext, useLayoutEffect, useState } from 'react';

export interface MenuContextValue {
  core: MenuCore;
  menu: MenuApi;
  parent: MenuContextValue | null;
  state: MenuState;
  preferredSide: MenuState['side'];
  setPositionedSide: (side: MenuState['side']) => void;
  contentId: string;
  anchorName: string;
  boundary: PositioningBoundary;
  container: MediaContainer | null;
  optionState: MenuOptionState | null;
  setOptionState: (source: symbol, state: MenuOptionState | null) => void;
}

const MenuContext = createContext<MenuContextValue | null>(null);

export const MenuContextProvider = MenuContext.Provider;

/** Returns the current menu compound-component context. Throws outside `Menu.Root`. */
export function useMenuContext(): MenuContextValue {
  const ctx = useContext(MenuContext);
  if (!ctx) throw new Error('Menu compound components must be used within a Menu.Root');

  return ctx;
}

/** Returns the nearest menu context, or `null` outside `Menu.Root`. */
export function useOptionalMenuContext(): MenuContextValue | null {
  return useContext(MenuContext);
}

/** Publishes a specialized option group's selected value and availability to its enclosing menu. */
export function useMenuOptionState(state: MenuOptionState): void {
  const menu = useOptionalMenuContext();
  const setOptionState = menu?.setOptionState;
  const [source] = useState(() => Symbol('menu-option'));
  const { value, disabled, hidden, availability } = state;

  useLayoutEffect(() => {
    if (!setOptionState) return undefined;

    setOptionState(source, { value, disabled, hidden, availability });

    return () => setOptionState(source, null);
  }, [availability, disabled, hidden, setOptionState, source, value]);
}

export interface MenuPopupContextValue {
  popup: MenuPopupApi;
  element: HTMLElement | null;
}

const MenuPopupContext = createContext<MenuPopupContextValue | null>(null);

export const MenuPopupContextProvider = MenuPopupContext.Provider;

export function useMenuPopupContext(): MenuPopupContextValue {
  const ctx = useContext(MenuPopupContext);
  if (!ctx) throw new Error('Menu.Content must be used within a Menu.Popup');

  return ctx;
}

// ---------------------------------------------------------------------------
// Group context — shared by group-like parts and MenuGroupLabel
// ---------------------------------------------------------------------------

export interface MenuGroupContextValue {
  registerLabel: (id: string) => () => void;
}

const MenuGroupContext = createContext<MenuGroupContextValue | null>(null);

export const MenuGroupContextProvider = MenuGroupContext.Provider;

export function useMenuGroupContext(): MenuGroupContextValue | null {
  return useContext(MenuGroupContext);
}

// ---------------------------------------------------------------------------
// Radio group context — shared between MenuRadioGroup and MenuRadioItem
// ---------------------------------------------------------------------------

export interface MenuRadioGroupContextValue {
  value: string;
  onValueChange: (value: string) => void;
}

const MenuRadioGroupContext = createContext<MenuRadioGroupContextValue | null>(null);

export const MenuRadioGroupContextProvider = MenuRadioGroupContext.Provider;

export function useMenuRadioGroupContext(): MenuRadioGroupContextValue {
  const ctx = useContext(MenuRadioGroupContext);
  if (!ctx) throw new Error('Menu.RadioItem must be used within a Menu.RadioGroup');

  return ctx;
}

const MenuRadioItemContext = createContext(false);

export const MenuRadioItemContextProvider = MenuRadioItemContext.Provider;

export function useOptionalMenuRadioItemContext(): boolean {
  return useContext(MenuRadioItemContext);
}

// ---------------------------------------------------------------------------
// Root trigger render context — provided by Menu.Trigger for render children.
// ---------------------------------------------------------------------------

const MenuTriggerChildContext = createContext(false);

export const MenuTriggerChildContextProvider = MenuTriggerChildContext.Provider;

export function useOptionalMenuTriggerChildContext(): boolean {
  return useContext(MenuTriggerChildContext);
}
