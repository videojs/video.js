'use client';

import type { PopoverState } from '@videojs/core';

import type { UIComponentProps } from '../../utils/types';
import { createContextPart } from '../create-context-part';
import { usePopoverContext } from './context';

export interface PopoverArrowProps extends UIComponentProps<'div', PopoverState> {}

/** Decorative arrow pointing from the popup toward the trigger. Hidden from assistive technology. */
export const PopoverArrow = createContextPart<PopoverArrowProps, PopoverState>({
  displayName: 'PopoverArrow',
  tag: 'div',
  useContext: usePopoverContext,
  staticProps: { 'aria-hidden': 'true' as const },
});

export namespace PopoverArrow {
  export type Props = PopoverArrowProps;
  export type State = PopoverState;
}
