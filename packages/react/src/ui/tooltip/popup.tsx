'use client';

import { TooltipCSSVars, type TooltipState } from '@videojs/core';
import { forwardRef, useCallback, useMemo, useRef } from 'react';

import type { UIComponentProps } from '../../utils/types';
import { useComposedRefs } from '../../utils/use-composed-refs';
import { renderElement } from '../../utils/use-render';
import { usePopupPosition } from '../popover/use-popup-position';
import { useTooltipContext } from './context';
import { TooltipLabel } from './label';
import { TooltipShortcut } from './shortcut';

export interface TooltipPopupProps extends UIComponentProps<'div', TooltipState> {}

/**
 * Container for the tooltip content. Positioned relative to the trigger using CSS anchor positioning with a JavaScript
 * fallback.
 */
export const TooltipPopup = forwardRef<HTMLDivElement, TooltipPopupProps>(function TooltipPopup(
  { render, className, style, children, ...elementProps },
  forwardedRef
) {
  const {
    core,
    tooltip,
    state,
    preferredSide,
    setPositionedSide,
    stateAttrMap,
    anchorName,
    popupId,
    boundary,
    container,
  } = useTooltipContext();
  const internalRef = useRef<HTMLDivElement>(null);

  const popupRef = useCallback(
    (el: HTMLDivElement | null) => {
      tooltip.setPopupElement(el);
    },
    [tooltip]
  );

  const composedRef = useComposedRefs(forwardedRef, popupRef, internalRef);

  // --- Positioning ---

  const posOpts = useMemo(() => ({ side: preferredSide, align: state.align }), [preferredSide, state.align]);

  const positioningStyle = usePopupPosition({
    open: state.open,
    anchorName,
    position: posOpts,
    triggerSource: tooltip,
    popupRef: internalRef,
    boundary,
    container,
    cssVars: TooltipCSSVars,
    onSideChange: setPositionedSide,
  });

  // --- Visibility ---

  if (!state.open) {
    return null;
  }

  const body =
    children !== undefined ? (
      children
    ) : (
      <>
        <TooltipLabel />
        <TooltipShortcut />
      </>
    );

  // Remap DOM focus events to React synthetic event names.
  const { onFocusOut, ...restPopupProps } = tooltip.popupProps;

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
        { children: body },
        { ...restPopupProps, onBlur: onFocusOut },
        elementProps,
      ],
    }
  );
});

export namespace TooltipPopup {
  export type Props = TooltipPopupProps;
  export type State = TooltipState;
}
