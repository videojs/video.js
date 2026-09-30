'use client';

import type { MenuState } from '@videojs/core';
import { forwardRef, useCallback, useEffect, useRef } from 'react';

import type { UIComponentProps } from '../../utils/types';
import { renderElement } from '../../utils/use-render';
import { useMenuContext } from './context';

export interface MenuCheckboxItemProps extends UIComponentProps<'div', MenuState> {
  /** Whether the item is currently checked. */
  checked: boolean;
  /** Called when the checked state should change. */
  onCheckedChange: (checked: boolean) => void;
  /** Whether the item is disabled. */
  disabled?: boolean;
}

/** A checkbox-style menu item. Renders a `<div>` with `role="menuitemcheckbox"`. */
export const MenuCheckboxItem = forwardRef<HTMLDivElement, MenuCheckboxItemProps>(function MenuCheckboxItem(
  { render, className, style, checked, onCheckedChange, disabled, onClick, ...elementProps },
  forwardedRef
) {
  const { menu, state } = useMenuContext();
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    return menu.registerItem(element);
  }, [menu]);

  const handleClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (disabled) return;

      onClick?.(event);
      onCheckedChange(!checked);
    },
    [disabled, onClick, onCheckedChange, checked]
  );

  const handlePointerEnter = useCallback(() => {
    const element = elementRef.current;
    if (!element || disabled) return;

    menu.highlight(element, { focus: false, pointer: true });
  }, [menu, disabled]);

  return renderElement(
    'div',
    { render, className, style },
    {
      state,
      ref: [forwardedRef, elementRef],
      props: [
        {
          role: 'menuitemcheckbox' as const,
          'aria-checked': checked,
          'aria-disabled': disabled ? true : undefined,
          onClick: handleClick,
          onPointerEnter: handlePointerEnter,
        },
        elementProps,
      ],
    }
  );
});

export namespace MenuCheckboxItem {
  export type Props = MenuCheckboxItemProps;
  export type State = MenuState;
}
