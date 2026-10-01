import { defaults } from '@videojs/utils/object';
import type { NonNullableObject } from '@videojs/utils/types';

import type { PopoverAlign, PopoverBoundary, PopoverSide } from '../popover/core';
import type { TransitionFlags, TransitionState, TransitionStatus } from '../transition';
import { getTransitionFlags } from '../transition';

export type { PopoverAlign, PopoverSide };

export interface MenuProps {
  /** Preferred side of the trigger for the menu. Root menus only. */
  side?: PopoverSide | undefined;
  /** Alignment along the trigger's edge. Root menus only. */
  align?: PopoverAlign | undefined;
  /** Boundary used to constrain the root menu popup. */
  boundary?: PopoverBoundary | undefined;
  /** Controlled open state. */
  open?: boolean | undefined;
  /** Initial open state (uncontrolled). */
  defaultOpen?: boolean | undefined;
  /** Close the menu when Escape is pressed at root level. */
  closeOnEscape?: boolean | undefined;
  /** Close the menu when clicking outside. Root menus only. */
  closeOnOutsideClick?: boolean | undefined;
}

type MenuCoreProps = Omit<MenuProps, 'boundary'>;

/** @internal */
export interface MenuTriggerProps {
  disabled?: boolean | undefined;
}

/** @internal */
export interface MenuPopupProps {
  /** Keep the popup mounted while closed. */
  keepMounted?: boolean | undefined;
}

export interface MenuOptionState {
  /** Selected value displayed by an option group's `Value` part. */
  value: string;
  /** Whether the menu trigger should be disabled. */
  disabled: boolean;
  /** Whether the menu trigger should be hidden. */
  hidden: boolean;
  /** Whether the menu has a meaningful option available. */
  availability: 'available' | 'unavailable' | 'unsupported';
}

/** @internal */
export interface MenuItemProps {
  disabled?: boolean | undefined;
}

/** @internal */
export interface MenuItemIndicatorProps {
  checked?: boolean | undefined;
  forceMount?: boolean | undefined;
}

/**
 * Combines direct and nested option-menu state for a parent trigger.
 *
 * @internal
 */
export function resolveMenuOptionState(states: Iterable<MenuOptionState>): MenuOptionState | null {
  const options = [...states];
  if (options.length === 0) return null;

  const visible = options.filter((state) => !state.hidden);
  const available = visible.filter((state) => state.availability === 'available');
  const availability =
    available.length > 0
      ? 'available'
      : options.every((state) => state.availability === 'unsupported')
        ? 'unsupported'
        : 'unavailable';

  return {
    value: options.length === 1 ? options[0]!.value : '',
    disabled: visible.length === 0 || visible.every((state) => state.disabled),
    hidden: visible.length === 0,
    availability,
  };
}

/** Runtime input derived by framework adapters and `createTransition`. */
export interface MenuInput extends TransitionState {
  /** Whether this menu is nested inside another menu's content. */
  isSubmenu: boolean;
}

export interface MenuState extends TransitionFlags {
  open: boolean;
  status: TransitionStatus;
  /** Preferred side of the trigger for the menu. Root menus only. */
  side: PopoverSide | undefined;
  align: PopoverAlign | undefined;
  /** Whether this menu is nested inside another menu's content. */
  isSubmenu: boolean;
}

/**
 * Base menu logic: ARIA attributes and open/close state computation.
 *
 * @internal
 */
export class MenuCore {
  static readonly defaultProps: NonNullableObject<MenuCoreProps> = {
    side: 'bottom',
    align: 'start',
    open: false,
    defaultOpen: false,
    closeOnEscape: true,
    closeOnOutsideClick: true,
  };

  #props = { ...MenuCore.defaultProps };
  #input: MenuInput | null = null;

  get props(): Readonly<NonNullableObject<MenuCoreProps>> {
    return this.#props;
  }

  constructor(props?: MenuCoreProps) {
    if (props) this.setProps(props);
  }

  setProps(props: MenuCoreProps): void {
    this.#props = defaults(props, MenuCore.defaultProps);
  }

  setInput(input: MenuInput): void {
    this.#input = input;
  }

  getState(): MenuState {
    const input = this.#input!;
    const isSubmenu = input.isSubmenu;

    return {
      open: input.active,
      status: input.status,
      side: isSubmenu ? undefined : this.#props.side,
      align: isSubmenu ? undefined : this.#props.align,
      isSubmenu,
      ...getTransitionFlags(input.status),
    };
  }

  getTriggerAttrs(state: MenuState, contentId?: string) {
    return {
      ...(!state.isSubmenu && { tabIndex: 0 }),
      'aria-haspopup': 'menu' as const,
      'aria-expanded': state.open && state.status !== 'ending' ? 'true' : 'false',
      'aria-controls': contentId,
    };
  }

  getContentAttrs() {
    return {
      role: 'menu' as const,
      tabIndex: -1,
    };
  }

  getPopupAttrs() {
    return { popover: 'manual' as const };
  }
}

/** @internal */
export namespace MenuCore {
  export type Props = MenuCoreProps;
  export type State = MenuState;
  export type Input = MenuInput;
}
