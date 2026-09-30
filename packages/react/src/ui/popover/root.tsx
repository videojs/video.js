'use client';

import { type PopoverProps as CorePopoverProps, PopoverCore, PopoverDataAttrs } from '@videojs/core';
import {
  createPopover,
  createTransition,
  type PopoverChangeDetails,
  type PositioningBoundary,
} from '@videojs/core/dom';
import { useSnapshot } from '@videojs/store/react';
import { isUndefined } from '@videojs/utils/predicate';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';

import { useOptionalContainer } from '../../player/context';
import { useOptionalPopupGroup } from '../../player/popup-group-context';
import { useDestroy } from '../../utils/use-destroy';
import { useLatestRef } from '../../utils/use-latest-ref';
import { useSafeId } from '../../utils/use-safe-id';
import { useOptionalControlsContext } from '../controls/context';
import { usePositionedState } from '../hooks/use-positioned-state';
import { PopoverContextProvider } from './context';

export interface PopoverRootProps extends Omit<CorePopoverProps, 'boundary'> {
  /** Boundary used to constrain the popup size. */
  boundary?: PositioningBoundary;
  /** Called when the popover open state changes (fires immediately, before animations). */
  onOpenChange?: (open: boolean, details: PopoverChangeDetails) => void;
  /** Called after open/close animations complete. */
  onOpenChangeComplete?: (open: boolean) => void;
  children?: ReactNode;
}

export function PopoverRoot({
  open: controlledOpen,
  defaultOpen = PopoverCore.defaultProps.defaultOpen,
  onOpenChange: onOpenChangeProp,
  onOpenChangeComplete: onOpenChangeCompleteProp,
  openOnHover = PopoverCore.defaultProps.openOnHover,
  delay = PopoverCore.defaultProps.delay,
  closeDelay = PopoverCore.defaultProps.closeDelay,
  boundary = 'container',
  children,
  ...coreProps
}: PopoverRootProps): ReactNode {
  const container = useOptionalContainer();
  const popupGroup = useOptionalPopupGroup();
  const controls = useOptionalControlsContext();
  const [core] = useState(() => new PopoverCore(coreProps));

  core.setProps(coreProps);

  const isControlled = !isUndefined(controlledOpen);

  // Keep refs that always point to the latest values so the
  // createPopover closure never reads stale props.
  const onOpenChangeRef = useLatestRef(onOpenChangeProp);
  const onOpenChangeCompleteRef = useLatestRef(onOpenChangeCompleteProp);

  const closeOnEscapeRef = useLatestRef(coreProps.closeOnEscape);
  const closeOnOutsideClickRef = useLatestRef(coreProps.closeOnOutsideClick);
  const openOnHoverRef = useLatestRef(openOnHover);
  const delayRef = useLatestRef(delay);
  const closeDelayRef = useLatestRef(closeDelay);

  const popupGroupRef = useLatestRef(popupGroup);

  const [popover] = useState(() => {
    const instance = createPopover({
      transition: createTransition(),
      onOpenChange: (nextOpen: boolean, details: PopoverChangeDetails) => {
        onOpenChangeRef.current?.(nextOpen, details);
      },
      onOpenChangeComplete: (nextOpen: boolean) => {
        onOpenChangeCompleteRef.current?.(nextOpen);
      },
      closeOnEscape: () => closeOnEscapeRef.current ?? PopoverCore.defaultProps.closeOnEscape,
      closeOnOutsideClick: () => closeOnOutsideClickRef.current ?? PopoverCore.defaultProps.closeOnOutsideClick,
      openOnHover: () => openOnHoverRef.current,
      delay: () => delayRef.current,
      closeDelay: () => closeDelayRef.current,
      group: () => popupGroupRef.current,
    });

    // Apply defaultOpen on creation (uncontrolled only)
    if (!isControlled && defaultOpen) {
      instance.open('click');
    }

    return instance;
  });

  const anchorName = useSafeId();
  const popupId = useSafeId('popup');

  // Sync controlled open prop -> internal input state.
  useEffect(() => {
    if (isUndefined(controlledOpen)) return;

    const { active: inputOpen } = popover.input.current;
    if (controlledOpen === inputOpen) return;

    if (controlledOpen) {
      popover.open('click');
    } else {
      popover.close('click');
    }
  }, [controlledOpen, popover]);

  useEffect(() => {
    if (isUndefined(controls?.state.visible)) return;

    if (controls.state.visible) return;

    popover.close('imperative-action');
  }, [controls?.state.visible, popover]);

  useDestroy(popover);

  const input = useSnapshot(popover.input);

  core.setInput(input);
  const { state, preferredSide, setPositionedSide } = usePositionedState(core.getState());

  return (
    <PopoverContextProvider
      value={{
        core,
        popover,
        state,
        preferredSide,
        setPositionedSide,
        stateAttrMap: PopoverDataAttrs,
        anchorName,
        popupId,
        boundary,
        container,
      }}
    >
      {children}
    </PopoverContextProvider>
  );
}

export namespace PopoverRoot {
  export type Props = PopoverRootProps;
}
