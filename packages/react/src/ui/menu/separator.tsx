'use client';

import type { MenuState } from '@videojs/core';
import { forwardRef } from 'react';

import type { UIComponentProps } from '../../utils/types';
import { renderElement } from '../../utils/use-render';
import { useMenuContext } from './context';

export interface MenuSeparatorProps extends UIComponentProps<'div', MenuState> {}

/** Visual divider between groups of items. Renders a `<div>` with `role="separator"`. */
export const MenuSeparator = forwardRef<HTMLDivElement, MenuSeparatorProps>(function MenuSeparator(
  { render, className, style, ...elementProps },
  forwardedRef
) {
  const { state } = useMenuContext();

  return renderElement(
    'div',
    { render, className, style },
    {
      state,
      ref: [forwardedRef],
      props: [{ role: 'separator' as const }, elementProps],
    }
  );
});

export namespace MenuSeparator {
  export type Props = MenuSeparatorProps;
  export type State = MenuState;
}
