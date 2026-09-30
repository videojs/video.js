'use client';

import type { TooltipState } from '@videojs/core';
import { forwardRef } from 'react';

import type { UIComponentProps } from '../../utils/types';
import { renderElement } from '../../utils/use-render';
import { useTooltipContext } from './context';

export interface TooltipShortcutProps extends UIComponentProps<'kbd', TooltipState> {}

/** Keyboard shortcut hint; apply skin `className` (CSS: `media-tooltip__kbd`; Tailwind: `popup.tooltipShortcut`). */
export const TooltipShortcut = forwardRef<HTMLElement, TooltipShortcutProps>(function TooltipShortcut(
  { render, className, style, children, ...elementProps },
  forwardedRef
) {
  const { state, stateAttrMap, content } = useTooltipContext();
  const shortcut = children !== undefined && children !== null ? children : (content?.shortcut ?? null);
  if (!shortcut) return null;

  return renderElement(
    'kbd',
    { render, className, style },
    {
      state,
      stateAttrMap,
      ref: forwardedRef,
      props: [elementProps, { children: shortcut }],
    }
  );
});

export namespace TooltipShortcut {
  export type Props = TooltipShortcutProps;
  export type State = TooltipState;
}
