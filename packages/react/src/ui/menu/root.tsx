'use client';

import { MenuCore, type MenuOptionState, resolveMenuOptionState, type MenuProps } from '@videojs/core';
import {
  createMenu,
  createTransition,
  type MenuChangeDetails,
  type PositioningBoundary,
  selectControls,
} from '@videojs/core/dom';
import { useSnapshot } from '@videojs/store/react';
import type { ReactNode } from 'react';
import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react';

import { useOptionalContainer, useOptionalPlayer } from '../../player/context';
import { useOptionalPopupGroup } from '../../player/popup-group-context';
import { useDestroy } from '../../utils/use-destroy';
import { useLatestRef } from '../../utils/use-latest-ref';
import { useSafeId } from '../../utils/use-safe-id';
import { useOptionalControlsContext } from '../controls/context';
import { usePositionedState } from '../hooks/use-positioned-state';
import { MenuContextProvider, useOptionalMenuContext } from './context';

export interface MenuRootProps extends Omit<MenuProps, 'boundary'> {
  /** Boundary used to constrain the root menu popup size. */
  boundary?: PositioningBoundary;
  /** Called when the menu open state changes (fires immediately, before animations). */
  onOpenChange?: (open: boolean, details: MenuChangeDetails) => void;
  /** Called after open/close animations complete. */
  onOpenChangeComplete?: (open: boolean) => void;
  children?: ReactNode;
}

export function MenuRoot({
  open: controlledOpen,
  defaultOpen = MenuCore.defaultProps.defaultOpen,
  onOpenChange: onOpenChangeProp,
  onOpenChangeComplete: onOpenChangeCompleteProp,
  boundary = 'container',
  children,
  ...coreProps
}: MenuRootProps): ReactNode {
  // Detect if we are nested inside a parent Menu.Content — if so, operate as
  // a submenu: no popover positioning, Trigger acts as a parent item.
  const parentMenu = useOptionalMenuContext();
  const controls = useOptionalControlsContext();
  const controlsState = useOptionalPlayer(selectControls);
  const container = useOptionalContainer();
  const popupGroup = useOptionalPopupGroup();
  const isSubmenu = parentMenu !== null;
  const { side, align, closeOnEscape, closeOnOutsideClick } = coreProps;

  const [core] = useState(() => new MenuCore(coreProps));

  const isControlled = controlledOpen !== undefined;
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const resolvedOpen = controlledOpen ?? uncontrolledOpen;

  const onOpenChangeRef = useLatestRef(onOpenChangeProp);
  const onOpenChangeCompleteRef = useLatestRef(onOpenChangeCompleteProp);

  const closeOnEscapeRef = useLatestRef(closeOnEscape);
  const closeOnOutsideClickRef = useLatestRef(closeOnOutsideClick);

  const popupGroupRef = useLatestRef(popupGroup);
  const isSubmenuRef = useLatestRef(isSubmenu);

  const [menu] = useState(() => {
    const instance = createMenu({
      transition: createTransition(),
      onOpenChange(nextOpen, details) {
        if (!isControlled) setUncontrolledOpen(nextOpen);

        onOpenChangeRef.current?.(nextOpen, details);
      },
      onOpenChangeComplete(nextOpen) {
        onOpenChangeCompleteRef.current?.(nextOpen);
      },
      closeOnEscape: () => closeOnEscapeRef.current ?? MenuCore.defaultProps.closeOnEscape,
      closeOnOutsideClick: () => closeOnOutsideClickRef.current ?? MenuCore.defaultProps.closeOnOutsideClick,
      group: () => (isSubmenuRef.current ? undefined : popupGroupRef.current),
    });

    return instance;
  });

  const anchorName = useSafeId();
  const contentId = useSafeId('menu');

  useLayoutEffect(() => parentMenu?.menu.registerSubmenu(menu), [menu, parentMenu?.menu]);

  // Commit only the open state resolved by controlled/uncontrolled ownership.
  useLayoutEffect(() => {
    menu.syncOpen(resolvedOpen);
  }, [menu, resolvedOpen]);

  useEffect(() => {
    if (isSubmenu || controls?.state.visible !== false) return;

    menu.close('imperative-action');
  }, [controls?.state.visible, isSubmenu, menu]);

  useDestroy(menu);

  const input = useSnapshot(menu.input);

  useEffect(() => {
    if (!input.active || isSubmenu) return;

    return controlsState?.requestControlsLock();
  }, [controlsState?.requestControlsLock, input.active, isSubmenu]);

  const preferredState = useMemo(() => {
    core.setProps({ side, align, closeOnEscape, closeOnOutsideClick });
    core.setInput({ ...input, isSubmenu });
    return core.getState();
  }, [core, input, side, align, closeOnEscape, closeOnOutsideClick, isSubmenu]);
  const { state, preferredSide, setPositionedSide } = usePositionedState(preferredState);

  const [optionStates, setOptionStates] = useState<ReadonlyMap<symbol, MenuOptionState>>(() => new Map());
  const [optionSource] = useState(() => Symbol('menu'));
  const setOptionState = useCallback((source: symbol, optionState: MenuOptionState | null) => {
    setOptionStates((current) => {
      const previous = current.get(source);
      if (optionState && isSameOptionState(previous, optionState)) return current;

      if (!optionState && !previous) return current;

      const next = new Map(current);

      if (optionState) next.set(source, optionState);
      else next.delete(source);

      return next;
    });
  }, []);
  const optionState = useMemo(() => resolveMenuOptionState(optionStates.values()), [optionStates]);
  const setParentOptionState = parentMenu?.setOptionState;

  useEffect(() => {
    if (!optionState?.disabled && !optionState?.hidden) return;

    menu.close('imperative-action');
  }, [menu, optionState?.disabled, optionState?.hidden]);

  useLayoutEffect(() => {
    if (!setParentOptionState) return undefined;

    setParentOptionState(optionSource, optionState);

    return () => setParentOptionState(optionSource, null);
  }, [optionSource, optionState, setParentOptionState]);

  const contextValue = useMemo(
    () => ({
      core,
      menu,
      parent: parentMenu,
      state,
      preferredSide,
      setPositionedSide,
      contentId,
      anchorName,
      boundary,
      container,
      optionState,
      setOptionState,
    }),
    [
      core,
      menu,
      parentMenu,
      state,
      preferredSide,
      setPositionedSide,
      contentId,
      anchorName,
      boundary,
      container,
      optionState,
      setOptionState,
    ]
  );

  return <MenuContextProvider value={contextValue}>{children}</MenuContextProvider>;
}

function isSameOptionState(a: MenuOptionState | undefined, b: MenuOptionState): boolean {
  return (
    a?.value === b.value && a.disabled === b.disabled && a.hidden === b.hidden && a.availability === b.availability
  );
}

export namespace MenuRoot {
  export type Props = MenuRootProps;
}
