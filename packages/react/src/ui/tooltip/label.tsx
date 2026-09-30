'use client';

import type { TooltipState } from '@videojs/core';
import { forwardRef } from 'react';

import type { UIComponentProps } from '../../utils/types';
import { renderElement } from '../../utils/use-render';
import { useTooltipContext } from './context';

export interface TooltipLabelProps extends UIComponentProps<'span', TooltipState> {}

/** Tooltip body label; defaults to context `content.label` from the linked trigger. */
export const TooltipLabel = forwardRef<HTMLSpanElement, TooltipLabelProps>(function TooltipLabel(
  { render, className, style, children, ...elementProps },
  forwardedRef
) {
  const { state, stateAttrMap, content } = useTooltipContext();
  const body = children !== undefined ? children : (content?.label ?? '');

  return renderElement(
    'span',
    { render, className, style },
    {
      state,
      stateAttrMap,
      ref: forwardedRef,
      props: [elementProps, { children: body }],
    }
  );
});

export namespace TooltipLabel {
  export type Props = TooltipLabelProps;
  export type State = TooltipState;
}
