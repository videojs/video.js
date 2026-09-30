'use client';

import type { TooltipState } from '@videojs/core';

import type { UIComponentProps } from '../../utils/types';
import { createContextPart } from '../create-context-part';
import { useTooltipContext } from './context';

export interface TooltipArrowProps extends UIComponentProps<'div', TooltipState> {}

/** Decorative arrow pointing from the tooltip toward the trigger. Hidden from assistive technology. */
export const TooltipArrow = createContextPart<TooltipArrowProps, TooltipState>({
  displayName: 'TooltipArrow',
  tag: 'div',
  useContext: useTooltipContext,
  staticProps: { 'aria-hidden': 'true' as const },
});

export namespace TooltipArrow {
  export type Props = TooltipArrowProps;
  export type State = TooltipState;
}
