'use client';

import type { TooltipState } from '@videojs/core';
import { forwardRef, useCallback } from 'react';

import type { UIComponentProps } from '../../utils/types';
import { renderElement } from '../../utils/use-render';
import { useTooltipContext } from './context';

export interface TooltipTriggerProps extends UIComponentProps<'button', TooltipState> {}

/** Element that triggers the tooltip on hover and focus. Renders a `<button>` element. */
export const TooltipTrigger = forwardRef<HTMLButtonElement, TooltipTriggerProps>(function TooltipTrigger(
  { render, className, style, ...elementProps },
  forwardedRef
) {
  const { tooltip, state, stateAttrMap } = useTooltipContext();

  const triggerRef = useCallback(
    (el: HTMLButtonElement | null) => {
      tooltip.setTriggerElement(el);
    },
    [tooltip]
  );

  // Remap DOM focus events to React synthetic event names.
  // createTooltip() uses onFocusIn/onFocusOut (matching DOM focusin/focusout),
  // but React maps those to onFocus/onBlur.
  const { onFocusIn, onFocusOut, ...restTriggerProps } = tooltip.triggerProps;

  return renderElement(
    'button',
    { render, className, style },
    {
      state,
      stateAttrMap,
      ref: [forwardedRef, triggerRef],
      props: [
        {
          type: 'button' as const,
        },
        { ...restTriggerProps, onFocus: onFocusIn, onBlur: onFocusOut },
        elementProps,
      ],
    }
  );
});

export namespace TooltipTrigger {
  export type Props = TooltipTriggerProps;
  export type State = TooltipState;
}
