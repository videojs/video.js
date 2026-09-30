'use client';

import { type TooltipProps as CoreTooltipProps, TooltipCore, TooltipDataAttrs } from '@videojs/core';
import {
  createTooltip,
  createTransition,
  type PositioningBoundary,
  type TooltipChangeDetails,
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
import { type TooltipContent, TooltipContextProvider } from './context';
import { useTooltipGroup } from './group-context';

export interface TooltipRootProps extends Omit<CoreTooltipProps, 'boundary'> {
  /** Boundary used to constrain the popup size. */
  boundary?: PositioningBoundary;
  /** Called when the tooltip open state changes (fires immediately, before animations). */
  onOpenChange?: (open: boolean, details: TooltipChangeDetails) => void;
  /** Called after open/close animations complete. */
  onOpenChangeComplete?: (open: boolean) => void;
  children?: ReactNode;
}

export function TooltipRoot({
  open: controlledOpen,
  defaultOpen = TooltipCore.defaultProps.defaultOpen,
  onOpenChange: onOpenChangeProp,
  onOpenChangeComplete: onOpenChangeCompleteProp,
  delay = TooltipCore.defaultProps.delay,
  closeDelay = TooltipCore.defaultProps.closeDelay,
  disableHoverablePopup = TooltipCore.defaultProps.disableHoverablePopup,
  disabled = TooltipCore.defaultProps.disabled,
  sticky = TooltipCore.defaultProps.sticky,
  boundary = 'container',
  children,
  ...coreProps
}: TooltipRootProps): ReactNode {
  const container = useOptionalContainer();
  const popupGroup = useOptionalPopupGroup();
  const controls = useOptionalControlsContext();
  const [core] = useState(() => new TooltipCore(coreProps));

  core.setProps(coreProps);

  const isControlled = !isUndefined(controlledOpen);

  const groupFromContext = useTooltipGroup();

  // Keep refs that always point to the latest values so the
  // createTooltip closure never reads stale props.
  const onOpenChangeRef = useLatestRef(onOpenChangeProp);
  const onOpenChangeCompleteRef = useLatestRef(onOpenChangeCompleteProp);
  const delayRef = useLatestRef(delay);
  const closeDelayRef = useLatestRef(closeDelay);
  const disableHoverablePopupRef = useLatestRef(disableHoverablePopup);
  const disabledRef = useLatestRef(disabled);
  const stickyRef = useLatestRef(sticky);
  const groupRef = useLatestRef(groupFromContext);
  const popupGroupRef = useLatestRef(popupGroup);

  const [tooltip] = useState(() => {
    const instance = createTooltip({
      transition: createTransition(),
      onOpenChange: (nextOpen: boolean, details: TooltipChangeDetails) => {
        onOpenChangeRef.current?.(nextOpen, details);
      },
      onOpenChangeComplete: (nextOpen: boolean) => {
        onOpenChangeCompleteRef.current?.(nextOpen);
      },
      delay: () => delayRef.current,
      closeDelay: () => closeDelayRef.current,
      disableHoverablePopup: () => disableHoverablePopupRef.current,
      disabled: () => disabledRef.current,
      sticky: () => stickyRef.current,
      group: () => groupRef.current,
      popupGroup: () => popupGroupRef.current,
    });

    // Apply defaultOpen on creation (uncontrolled only)
    if (!isControlled && defaultOpen) {
      instance.open();
    }

    return instance;
  });

  const [content, setContent] = useState<TooltipContent | undefined>();

  const anchorName = useSafeId();
  const popupId = useSafeId('tooltip');

  // Sync controlled open prop -> internal input state.
  useEffect(() => {
    if (isUndefined(controlledOpen)) return;

    const { active: inputOpen } = tooltip.input.current;
    if (controlledOpen === inputOpen) return;

    if (controlledOpen) {
      tooltip.open();
    } else {
      tooltip.close();
    }
  }, [controlledOpen, tooltip]);

  useEffect(() => {
    if (isUndefined(controls?.state.visible)) return;

    if (controls.state.visible) return;

    tooltip.close('imperative-action');
  }, [controls?.state.visible, tooltip]);

  useDestroy(tooltip);

  const input = useSnapshot(tooltip.input);

  core.setInput(input);
  const { state, preferredSide, setPositionedSide } = usePositionedState(core.getState());

  return (
    <TooltipContextProvider
      value={{
        core,
        tooltip,
        state,
        preferredSide,
        setPositionedSide,
        stateAttrMap: TooltipDataAttrs,
        anchorName,
        popupId,
        content,
        setContent,
        boundary,
        container,
      }}
    >
      {children}
    </TooltipContextProvider>
  );
}

export namespace TooltipRoot {
  export type Props = TooltipRootProps;
}
