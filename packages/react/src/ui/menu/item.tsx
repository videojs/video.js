'use client';

import type { MenuState } from '@videojs/core';
import { completeMenuItemSelection } from '@videojs/core/dom';
import { forwardRef, useCallback, useEffect, useRef } from 'react';

import type { UIComponentProps } from '../../utils/types';
import { renderElement } from '../../utils/use-render';
import { useMenuContext } from './context';

export interface MenuItemProps extends UIComponentProps<'div', MenuState> {
  /** Called when the item is selected. */
  onSelect?: () => void;
  /** Whether the item is disabled. */
  disabled?: boolean;
}

/** A single action in the menu. Renders a `<div>` with `role="menuitem"`. */
export const MenuItem = forwardRef<HTMLDivElement, MenuItemProps>(function MenuItem(
  { render, className, style, onSelect, disabled, onClick, ...elementProps },
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

      if (event.defaultPrevented) return;

      onSelect?.();
      completeMenuItemSelection(menu);
    },
    [disabled, onClick, onSelect, menu]
  );

  const handlePointerEnter = useCallback(() => {
    const element = elementRef.current;
    if (!element || disabled) return;

    menu.highlight(element, { focus: false, pointer: true });
  }, [menu, disabled]);

  return (
    <MenuItemContent
      disabled={disabled}
      elementProps={elementProps}
      onClick={handleClick}
      onPointerEnter={handlePointerEnter}
      render={render}
      className={className}
      style={style}
      state={state}
      forwardedRef={forwardedRef}
      elementRef={elementRef}
    />
  );
});

interface MenuItemContentProps {
  disabled: boolean | undefined;
  elementProps: Record<string, unknown>;
  onClick: (event: React.MouseEvent<HTMLDivElement>) => void;
  onPointerEnter: () => void;
  render: MenuItemProps['render'];
  className: MenuItemProps['className'];
  style: MenuItemProps['style'];
  state: MenuState;
  forwardedRef: React.ForwardedRef<HTMLDivElement>;
  elementRef: React.RefObject<HTMLDivElement | null>;
}

function MenuItemContent({
  disabled,
  elementProps,
  onClick,
  onPointerEnter,
  render,
  className,
  style,
  state,
  forwardedRef,
  elementRef,
}: MenuItemContentProps) {
  return renderElement(
    'div',
    { render, className, style },
    {
      state,
      ref: [forwardedRef, elementRef],
      props: [
        {
          role: 'menuitem' as const,
          'aria-disabled': disabled ? true : undefined,
          onClick,
          onPointerEnter,
        },
        elementProps,
      ],
    }
  );
}

export namespace MenuItem {
  export type Props = MenuItemProps;
  export type State = MenuState;
}
