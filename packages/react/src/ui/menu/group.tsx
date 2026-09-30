'use client';

import type { MenuState } from '@videojs/core';
import { forwardRef } from 'react';

import type { UIComponentProps } from '../../utils/types';
import { renderElement } from '../../utils/use-render';
import { useMenuContext } from './context';
import { getMenuGroupProps, MenuGroupProvider } from './use-menu-group';

export interface MenuGroupProps extends UIComponentProps<'div', MenuState> {}

/** Groups related menu items. Renders a `<div>` with `role="group"`. */
export const MenuGroup = forwardRef<HTMLDivElement, MenuGroupProps>(function MenuGroup(
  { render, className, style, ...elementProps },
  forwardedRef
) {
  const { state } = useMenuContext();

  return (
    <MenuGroupProvider>
      {(labelId) =>
        renderElement(
          'div',
          { render, className, style },
          {
            state,
            ref: [forwardedRef],
            props: [getMenuGroupProps(labelId, elementProps), elementProps],
          }
        )
      }
    </MenuGroupProvider>
  );
});

export namespace MenuGroup {
  export type Props = MenuGroupProps;
  export type State = MenuState;
}
