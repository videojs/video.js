'use client';

import type { MenuState } from '@videojs/core';
import { forwardRef } from 'react';

import type { UIComponentProps } from '../../utils/types';
import { renderElement } from '../../utils/use-render';
import { MenuRadioGroupContextProvider, useMenuContext } from './context';
import { getMenuGroupProps, MenuGroupProvider } from './use-menu-group';

export interface MenuRadioGroupProps extends UIComponentProps<'div', MenuState> {
  /** The currently selected value. */
  value: string;
  /** Called when the user selects a radio item. */
  onValueChange: (value: string) => void;
}

/** A group of mutually exclusive radio items. Renders a `<div>` with `role="group"`. */
export const MenuRadioGroup = forwardRef<HTMLDivElement, MenuRadioGroupProps>(function MenuRadioGroup(
  { render, className, style, value, onValueChange, ...elementProps },
  forwardedRef
) {
  const { state } = useMenuContext();

  return (
    <MenuGroupProvider>
      {(labelId) => (
        <MenuRadioGroupContextProvider value={{ value, onValueChange }}>
          {renderElement(
            'div',
            { render, className, style },
            {
              state,
              ref: [forwardedRef],
              props: [getMenuGroupProps(labelId, elementProps), elementProps],
            }
          )}
        </MenuRadioGroupContextProvider>
      )}
    </MenuGroupProvider>
  );
});

export namespace MenuRadioGroup {
  export type Props = MenuRadioGroupProps;
  export type State = MenuState;
}
