'use client';

import type { MenuState } from '@videojs/core';
import { forwardRef } from 'react';

import type { UIComponentProps } from '../../utils/types';
import { renderElement } from '../../utils/use-render';
import { useMenuContext, useOptionalMenuRadioItemContext } from './context';

export interface MenuItemIndicatorProps extends UIComponentProps<'span', MenuState> {
  /** Whether the indicator is currently shown. Typically bound to the parent item's checked state. */
  checked?: boolean;
  /** When `true`, renders even when unchecked (useful for animating out). Defaults to `false`. */
  forceMount?: boolean;
}

/** Visual indicator for a checked state. Only renders when `checked` is `true` (or `forceMount` is set). */
export const MenuItemIndicator = forwardRef<HTMLSpanElement, MenuItemIndicatorProps>(function MenuItemIndicator(
  { render, className, style, checked, forceMount = false, ...elementProps },
  forwardedRef
) {
  const { state } = useMenuContext();
  const itemChecked = useOptionalMenuRadioItemContext();
  const resolvedChecked = checked ?? itemChecked;
  if (!resolvedChecked && !forceMount) return null;

  return renderElement(
    'span',
    { render, className, style },
    {
      state,
      ref: [forwardedRef],
      props: [{ 'aria-hidden': true }, elementProps],
    }
  );
});

export namespace MenuItemIndicator {
  export type Props = MenuItemIndicatorProps;
  export type State = MenuState;
}
