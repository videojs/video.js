'use client';

import type { MenuState } from '@videojs/core';
import { completeMenuItemSelection } from '@videojs/core/dom';
import { forwardRef, useCallback, useEffect, useRef } from 'react';

import type { UIComponentProps } from '../../utils/types';
import { renderElement } from '../../utils/use-render';
import { MenuRadioItemContextProvider, useMenuContext, useMenuRadioGroupContext } from './context';

export interface MenuRadioItemProps extends UIComponentProps<'div', MenuState> {
  /** The value this item represents. */
  value: string;
  /** Whether the item is disabled. */
  disabled?: boolean;
}

/** A radio-style menu item. Renders a `<div>` with `role="menuitemradio"`. */
export const MenuRadioItem = forwardRef<HTMLDivElement, MenuRadioItemProps>(function MenuRadioItem(
  { render, className, style, value, disabled, onClick, ...elementProps },
  forwardedRef
) {
  const { menu, state } = useMenuContext();
  const { value: groupValue, onValueChange } = useMenuRadioGroupContext();
  const elementRef = useRef<HTMLDivElement>(null);
  const checked = groupValue === value;

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    return menu.registerItem(element);
  }, [menu]);

  const handleClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (disabled) return;

      onClick?.(event);

      if (event.defaultPrevented) return;

      onValueChange(value);
      completeMenuItemSelection(menu);
    },
    [disabled, onClick, onValueChange, value, menu]
  );

  const handlePointerEnter = useCallback(() => {
    const element = elementRef.current;
    if (!element || disabled) return;

    menu.highlight(element, { focus: false, pointer: true });
  }, [menu, disabled]);

  return (
    <MenuRadioItemContextProvider value={checked}>
      {renderElement(
        'div',
        { render, className, style },
        {
          state,
          ref: [forwardedRef, elementRef],
          props: [
            {
              role: 'menuitemradio' as const,
              'aria-checked': checked,
              'aria-disabled': disabled ? true : undefined,
              onClick: handleClick,
              onPointerEnter: handlePointerEnter,
            },
            elementProps,
          ],
        }
      )}
    </MenuRadioItemContextProvider>
  );
});

export namespace MenuRadioItem {
  export type Props = MenuRadioItemProps;
  export type State = MenuState;
}
