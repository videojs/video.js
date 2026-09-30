'use client';

import type { PopoverState } from '@videojs/core';
import { forwardRef, useCallback, useMemo, useRef } from 'react';

import type { UIComponentProps } from '../../utils/types';
import { useComposedRefs } from '../../utils/use-composed-refs';
import { renderElement } from '../../utils/use-render';
import { usePopoverContext } from './context';
import { usePopupPosition } from './use-popup-position';

export interface PopoverPopupProps extends UIComponentProps<'div', PopoverState> {}

/**
 * Container for the popover content. Positioned relative to the trigger using CSS anchor positioning with a JavaScript
 * fallback.
 */
export const PopoverPopup = forwardRef<HTMLDivElement, PopoverPopupProps>(function PopoverPopup(
  { render, className, style, ...elementProps },
  forwardedRef
) {
  const {
    core,
    popover,
    state,
    preferredSide,
    setPositionedSide,
    stateAttrMap,
    anchorName,
    popupId,
    boundary,
    container,
  } = usePopoverContext();
  const internalRef = useRef<HTMLDivElement>(null);

  const popupRef = useCallback(
    (el: HTMLDivElement | null) => {
      popover.setPopupElement(el);
    },
    [popover]
  );

  const composedRef = useComposedRefs(forwardedRef, popupRef, internalRef);

  // --- Positioning ---

  const posOpts = useMemo(() => ({ side: preferredSide, align: state.align }), [preferredSide, state.align]);

  const positioningStyle = usePopupPosition({
    open: state.open,
    anchorName,
    position: posOpts,
    triggerSource: popover,
    popupRef: internalRef,
    boundary,
    container,
    onSideChange: setPositionedSide,
  });

  // --- Visibility ---

  if (!state.open) {
    return null;
  }

  // Remap DOM focus events to React synthetic event names.
  const { onFocusOut, ...restPopupProps } = popover.popupProps;

  return renderElement(
    'div',
    { render, className, style },
    {
      state,
      stateAttrMap,
      ref: composedRef,
      props: [
        {
          id: popupId,
          style: positioningStyle,
          ...core.getPopupAttrs(state),
        },
        { ...restPopupProps, onBlur: onFocusOut },
        elementProps,
      ],
    }
  );
});

export namespace PopoverPopup {
  export type Props = PopoverPopupProps;
  export type State = PopoverState;
}
